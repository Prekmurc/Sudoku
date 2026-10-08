'use strict';
// Vaji 1 in 2 »Spoznaj« po shemi v pravem brskalniku (docs/trening-ucenje-nacrt.md, del A) - scenarij
// raste po korakih. Korak 2: 7 · X-krilo in 8 · Mečarica pri 375 in 1280 px:
//   - razdelek »Shema« je odprt in nad mrežo, vrstica s preslikavo (.po-shemi) je med njim in mrežo,
//     v kartici;
//   - celice na mreži (iz DOM) = celice x sheme (iz SHEME_TEHNIK, razčlenjeno tu) pri vaji 1 in
//     obrnjene sheme (VrSc -> VcSr) pri vaji 2; oznaka »· po shemi« / »· po shemi, obrnjeno«;
//   - pravi kliki na celice vzorca in »Preveri« → »Pravilno!« (vaja 1), pravi klik »Naslednja vaja →«
//     in enako pri vaji 2;
//   - brez vodoravnega preliva in brez napak JS; posnetki v mapi (--mapa, privzeto začasna).
//
//   node tools/preveri-po-shemi-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-po-shemi'));

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const SEME = s => `(() => { let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return true; })()`;
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

// Celice sheme s črko x (vzorec = »*«), pri obrnjeni shemi VrSc -> VcSr - razčlenjeno v strani iz
// zapisa SHEME_TEHNIK, brez kode treninga.
const IZ_SHEME = (kljuc, obrnjeno) => `(() => {
  const obrni = i => (i % 9) * 9 + Math.floor(i / 9), x = [], vz = [];
  SHEME_TEHNIK[${JSON.stringify(kljuc)}].celice.forEach((z, i) => {
    const t = z.replace(/^[*+]/, '').split(' ').filter(Boolean);
    if (!t.some(s => s.replace(/^-/, '') === 'x')) return;
    const idx = ${obrnjeno} ? obrni(i) : i; x.push(idx); if (/^[*+]/.test(z)) vz.push(idx); });
  const u = a => a.sort((p, q) => p - q); return { x: u(x), vzorec: u(vz) }; })()`;

// Stanje vaje na strani.
const STANJE = `(() => {
  const ex = document.querySelector('#exerciseArea .exercise'), k = ex.getBoundingClientRect();
  const sh = ex.querySelector('details.shema-razdelek'), ps = ex.querySelector('.po-shemi'), m = ex.querySelector('.xw-grid');
  const r = e => e ? e.getBoundingClientRect() : null, [rs, rp, rm] = [r(sh), r(ps), r(m)];
  const v = e => !!e && e.left >= k.left - 0.5 && e.right <= k.right + 0.5;
  return { oznaka: ex.querySelector('.ex-label').textContent, preslikava: ps ? ps.textContent : null,
    stevka: +(ex.querySelector('.xw-digit-label').textContent.match(/\\d$/) || [])[0],
    shemaOdprta: !!sh && sh.open, vrstniRed: !!(rs && rp && rm) && rs.bottom <= rp.top + 0.5 && rp.bottom <= rm.top + 0.5,
    vKartici: v(rs) && v(rp) && v(rm), pisava: ps ? getComputedStyle(ps).fontSize : null,
    celice: [...ex.querySelectorAll('.xw-cell.has-digit')].map(c => +c.dataset.idx).sort((p, q) => p - q),
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function klikniGumb(b, napis) {
  await b.izvedi(`[...document.querySelectorAll('#exerciseArea button')].find(x => x.textContent === ${JSON.stringify(napis)}).setAttribute('data-klik', '1'); true`);
  await b.klikni('#exerciseArea button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
  await pocakaj(b);
}

async function vaja(b, kljuc, n, sirina) {
  const obrnjeno = n === 1;
  const s = await b.izvedi(STANJE), sh = await b.izvedi(IZ_SHEME(kljuc, obrnjeno));
  const ime = `${kljuc}, vaja ${n + 1}, ${sirina} px`;
  preveri(`${ime}: oznaka »· po shemi${obrnjeno ? ', obrnjeno' : ''}«`, s.oznaka.endsWith(`· Vaja ${n + 1} / 9 · po shemi${obrnjeno ? ', obrnjeno' : ''}`), s.oznaka);
  preveri(`${ime}: shema odprta, preslikava med shemo in mrežo, vse v kartici`, s.shemaOdprta && s.vrstniRed && s.vKartici, s);
  preveri(`${ime}: preslikava »… črka x je števka ${s.stevka}.«`, s.preslikava === (obrnjeno
    ? `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črka x je števka ${s.stevka}.`
    : `Vaja po shemi zgoraj – iste celice, črka x je števka ${s.stevka}.`), s.preslikava);
  preveri(`${ime}: celice na mreži = celice x ${obrnjeno ? 'obrnjene ' : ''}sheme (${sh.x.length})`, JSON.stringify(s.celice) === JSON.stringify(sh.x), [s.celice, sh.x]);
  preveri(`${ime}: brez vodoravnega preliva`, !s.preliv);
  await b.posnetek(path.join(mapa, `${kljuc}-vaja${n + 1}-${sirina}.png`));
  for (const c of sh.vzorec) await b.klikni(`#exerciseArea .xw-cell[data-idx="${c}"]`);
  await klikniGumb(b, 'Preveri');
  const fb = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .fb'); return { cls: f.className, besedilo: f.textContent }; })()`);
  preveri(`${ime}: pravi kliki na celice vzorca → »Pravilno!«`, /\bok\b/.test(fb.cls) && fb.besedilo.startsWith('Pravilno!'), fb);
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      for (const kljuc of ['x-wing', 'swordfish']) {
        console.log(`${kljuc}, ${sirina} px`);
        await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
        await b.izvedi(SEME(20261008));
        await b.klikni(`.menu-card[data-mode="${kljuc}"]`);
        await pocakaj(b);
        await vaja(b, kljuc, 0, sirina);
        await klikniGumb(b, 'Naslednja vaja →');
        await vaja(b, kljuc, 1, sirina);
      }
    }
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
