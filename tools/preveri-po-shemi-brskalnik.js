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
// Korak 3: 3 · Očitni par, 4 · Skriti par, 5 · Očitna trojica, 6 · Skrita trojica pri 375 in 1280 px:
//   - shema odprta, preslikava (»… črke so števke: x = 4, y = 7.«, pri vaji 2 »vrstica sheme je
//     stolpec«) med njo in enoto, vse v kartici;
//   - vaja 1 vrstica (celice ena ob drugi), vaja 2 stolpec, izrisan navpično (celice ena pod drugo),
//     v kartici tudi pri 375 px;
//   - celica za celico kot shema (iz SHEME_TEHNIK, razčlenjeno tu): prazna celica sheme je dana
//     števka (ni števka črke), črke so natanko števke črk v celici, drugi kandidati natanko pri »…«;
//   - pravi kliki na celice vzorca in »Preveri« (pri 4 in 6 še pravi kliki na števke in 2. faza)
//     → »Pravilno!«.
// Korak 4: 9 · Veriga ene števke (vaja 1 prva risba, vaja 2 druga), 10 · W-krilo, 12 · Edinstveni
// pravokotnik, 13 · XY-veriga (vaja 2 obrnjena), 11 · XY-krilo (vaja 2 zrcaljena levo-desno) pri 375 in
// 1280 px:
//   - oznaka (»· po shemi«, »· po shemi, obrnjeno«, »· po shemi, zrcaljeno«), shema odprta, preslikava
//     med njo in mrežo 9 × 9, mreža in vse celice v kartici, brez vodoravnega preliva;
//   - prazne celice na mreži = celice s črko na risbi (iz SHEME_TEHNIK, razčlenjeno tu; obrat /
//     zrcaljenje / druga risba);
//   - male števke berljive: izračunana velikost pisave (izpis, vsaj 8 px), vsaka v svoji celici;
//   - pravi kliki na celice vzorca → »Pravilno!«, pri 13 številka 1 v V2S2 in 1-5 po vrsti sheme;
//   - posnetek mreže (gostota) za ročni pregled: <ključ>-vaja<n>-<širina>.png.
// Korak 5: 1 · Izločitev izven bloka, 2 · Izločitev v bloku (delna mreža, vaja 2 obrnjena) pri 375 in 1280 px:
//   - oznaka, shema odprta, preslikava (»… črka x je števka 4.«) med njo in delno mrežo, vse v kartici;
//   - vidne celice (brez .izven) = blok in vrstica vzorca sheme (vaja 2 blok in stolpec obrnjene sheme),
//     prazne vidne celice z x = celice x sheme v njih (iz SHEME_TEHNIK, razčlenjeno tu);
//   - krepka oznaka roba: vaja 1 vrstica 1 (pri 2 vrstica 2), vaja 2 stolpec 1 (stolpec 2);
//   - pravi kliki na celice vzorca in »Preveri« → »Pravilno!«, celice vzorca jantarne (k-vzorec);
//   - brez vodoravnega preliva; posnetek <ključ>-vaja<n>-<širina>.png.
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

// 3-6: celice sheme v vrstici - { prazna, crke, drugi, vzorec } (razčlenjeno v strani iz SHEME_TEHNIK).
const VRSTICA_SHEME = kljuc => `SHEME_TEHNIK[${JSON.stringify(kljuc)}].celice.map(z => {
  const t = z.replace(/^[*+]/, '').split(' ').filter(Boolean).map(s => s.replace(/^-/, ''));
  return { prazna: !t.length, crke: t.filter(s => s !== '…'), drugi: t.includes('…'), vzorec: /^[*+]/.test(z) }; })`;

const STANJE_ENOTE = `(() => {
  const ex = document.querySelector('#exerciseArea .exercise'), k = ex.getBoundingClientRect();
  const sh = ex.querySelector('details.shema-razdelek'), ps = ex.querySelector('.po-shemi');
  const m = ex.querySelector('.layout-row, .layout-col');
  const r = e => e ? e.getBoundingClientRect() : null, [rs, rp, rm] = [r(sh), r(ps), r(m)];
  const v = e => !!e && e.left >= k.left - 0.5 && e.right <= k.right + 0.5;
  const celice = [...m.querySelectorAll('.gc')].map(c => ({ si: +c.dataset.si, r: c.getBoundingClientRect(),
    dana: c.classList.contains('fixed') ? +c.textContent : null,
    kand: [...c.querySelectorAll('.cd')].filter(d => !d.classList.contains('hide')).map(d => +d.dataset.d) }));
  const pon = (a, b) => (a.r.left + a.r.right) / 2;
  return { oznaka: ex.querySelector('.ex-label').textContent, preslikava: ps ? ps.textContent : null,
    enota: m.className, shemaOdprta: !!sh && sh.open,
    vrstniRed: !!(rs && rp && rm) && rs.bottom <= rp.top + 0.5 && rp.bottom <= rm.top + 0.5,
    vKartici: v(rs) && v(rp) && v(rm) && celice.every(c => v(c.r)),
    vodoravno: celice.every((c, i) => !i || (c.r.left >= celice[i - 1].r.right - 0.5 && Math.abs(c.r.top - celice[i - 1].r.top) < 0.5)),
    navpicno: celice.every((c, i) => !i || (c.r.top >= celice[i - 1].r.bottom - 0.5 && Math.abs(c.r.left - celice[i - 1].r.left) < 0.5)),
    celice: celice.map(c => ({ si: c.si, dana: c.dana, kand: c.kand })),
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function vajaPodmnozice(b, kljuc, n, sirina) {
  const obrnjeno = n === 1, skrita = kljuc.startsWith('hidden');
  const s = await b.izvedi(STANJE_ENOTE), sh = await b.izvedi(VRSTICA_SHEME(kljuc));
  const ime = `${kljuc}, vaja ${n + 1}, ${sirina} px`;
  preveri(`${ime}: oznaka »· po shemi${obrnjeno ? ', obrnjeno' : ''}«`, s.oznaka.endsWith(`· Vaja ${n + 1} / 9 · po shemi${obrnjeno ? ', obrnjeno' : ''}`), s.oznaka);
  preveri(`${ime}: shema odprta, preslikava med shemo in enoto, vse v kartici`, s.shemaOdprta && s.vrstniRed && s.vKartici, s);
  const m = (s.preslikava || '').match(/črke so števke: (.*)\.$/);
  const crke = m ? m[1].split(', ').map(p => p.split(' = ')) : [];
  const crka = Object.fromEntries(crke.map(([c, d]) => [c, +d]));
  const zacetek = obrnjeno ? 'Vaja po obrnjeni shemi zgoraj – vrstica sheme je stolpec, ' : 'Vaja po shemi zgoraj – iste celice, ';
  preveri(`${ime}: preslikava »${s.preslikava}«`, !!m && s.preslikava.startsWith(zacetek)
    && JSON.stringify(crke.map(([c]) => c)) === JSON.stringify(['x', 'y', 'z'].filter(c => sh.some(x => x.crke.includes(c)))), s.preslikava);
  preveri(`${ime}: ${obrnjeno ? 'stolpec, izrisan navpično' : 'vrstica, celice ena ob drugi'}`,
    s.enota === (obrnjeno ? 'layout-col' : 'layout-row') && (obrnjeno ? s.navpicno : s.vodoravno), s.enota);
  const stevkeCrk = Object.values(crka);
  const ujema = s.celice.length === 9 && sh.every((x, i) => {
    const c = s.celice[i];
    if (c.si !== i) return false;
    if (x.prazna) return c.dana !== null && !stevkeCrk.includes(c.dana);
    return c.dana === null && JSON.stringify(c.kand.filter(d => stevkeCrk.includes(d))) === JSON.stringify(x.crke.map(z => crka[z]).sort((p, q) => p - q))
      && c.kand.some(d => !stevkeCrk.includes(d)) === x.drugi;
  });
  preveri(`${ime}: celica za celico kot shema (dane števke, črke, »…«)`, ujema, s.celice);
  preveri(`${ime}: brez vodoravnega preliva`, !s.preliv);
  await b.posnetek(path.join(mapa, `${kljuc}-vaja${n + 1}-${sirina}.png`));
  for (const i of sh.map((x, i) => x.vzorec ? i : -1).filter(i => i >= 0)) await b.klikni(`#exerciseArea .gc[data-si="${i}"]`);
  await klikniGumb(b, 'Preveri');
  if (skrita) {
    for (const d of stevkeCrk) await b.klikni(`#exerciseArea .digit-btns button[data-d="${d}"]`);
    await klikniGumb(b, stevkeCrk.length === 2 ? 'Preveri dve števki' : 'Preveri tri števke');
  }
  const fb = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .fb'); return { cls: f.className, besedilo: f.textContent }; })()`);
  preveri(`${ime}: pravi kliki na celice vzorca${skrita ? ' in števke' : ''} → »Pravilno!«`, /\bok\b/.test(fb.cls) && fb.besedilo.startsWith('Pravilno!'), fb);
}

// 9-13: celice s črko na risbi vaje n (pri 9 druga risba, pri 11 zrcaljeno, sicer obrnjeno), vzorec in
// veriga sheme (pri 13: V2S2, nato po povezavah »vidita«) - razčlenjeno v strani iz SHEME_TEHNIK.
const RISBA_VAJE = (kljuc, n) => `(() => {
  const kljuc = ${JSON.stringify(kljuc)}, s = SHEME_TEHNIK[kljuc], n = ${n}, risba = s.risbe ? s.risbe[n] : s;
  const obrni = i => (i % 9) * 9 + Math.floor(i / 9), zrcali = i => Math.floor(i / 9) * 9 + 8 - i % 9;
  const naMrezo = n === 0 || s.risbe ? i => i : kljuc === 'xy-wing' ? zrcali : obrni;
  const celice = [], vzorec = [];
  risba.celice.forEach((z, i) => {
    const t = z.replace(/^[*+]/, '').split(' ').filter(Boolean);
    if (!t.length) return;
    celice.push(naMrezo(i));
    if (/^[*+]/.test(z)) vzorec.push(naMrezo(i));
  });
  const iz = v => (+v[1] - 1) * 9 + (+v[3] - 1);
  const veriga = kljuc === 'xy-chain' ? [iz('V2S2'), ...s.vidita.map(p => iz(p.split(' ')[1]))].map(naMrezo) : null;
  const u = a => a.sort((p, q) => p - q);
  return { celice: u(celice), vzorec: u(vzorec), veriga, naslov: risba.naslov || null };
})()`;

const STANJE_MREZE = `(() => {
  const ex = document.querySelector('#exerciseArea .exercise'), k = ex.getBoundingClientRect();
  const sh = ex.querySelector('details.shema-razdelek'), ps = ex.querySelector('.po-shemi'), m = ex.querySelector('.g9');
  const r = e => e ? e.getBoundingClientRect() : null, [rs, rp, rm] = [r(sh), r(ps), r(m)];
  const v = e => !!e && e.left >= k.left - 0.5 && e.right <= k.right + 0.5;
  const prazne = [...m.querySelectorAll('.gc[data-si]')];
  const vidne = prazne.flatMap(c => [...c.querySelectorAll('.cd')].filter(d => !d.classList.contains('hide')).map(d => [c, d]));
  const vCeli = vidne.every(([c, d]) => { const a = c.getBoundingClientRect(), b = d.getBoundingClientRect();
    return b.left >= a.left - 0.5 && b.right <= a.right + 0.5 && b.top >= a.top - 0.5 && b.bottom <= a.bottom + 0.5; });
  return { oznaka: ex.querySelector('.ex-label').textContent, preslikava: ps ? ps.textContent : null,
    shemaOdprta: !!sh && sh.open, vrstniRed: !!(rs && rp && rm) && rs.bottom <= rp.top + 0.5 && rp.bottom <= rm.top + 0.5,
    vKartici: v(rs) && v(rp) && v(rm) && [...m.querySelectorAll('.gc')].every(c => v(c.getBoundingClientRect())),
    prazne: prazne.map(c => +c.dataset.r * 9 + +c.dataset.c).sort((p, q) => p - q),
    velikosti: [...new Set(vidne.map(([, d]) => getComputedStyle(d).fontSize))],
    celica: Math.round(prazne[0].getBoundingClientRect().width * 10) / 10, vCeli,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function vajaMreze(b, kljuc, n, sirina) {
  const sh = await b.izvedi(RISBA_VAJE(kljuc, n)), s = await b.izvedi(STANJE_MREZE);
  const ime = `${kljuc}, vaja ${n + 1}, ${sirina} px`;
  const pripis = n === 0 || kljuc === 'turbot-fish' ? 'po shemi' : kljuc === 'xy-wing' ? 'po shemi, zrcaljeno' : 'po shemi, obrnjeno';
  preveri(`${ime}: oznaka »· ${pripis}«`, s.oznaka.endsWith(`· Vaja ${n + 1} / 9 · ${pripis}`), s.oznaka);
  preveri(`${ime}: shema odprta, preslikava med shemo in mrežo, mreža in celice v kartici`, s.shemaOdprta && s.vrstniRed && s.vKartici, s);
  const zacetek = kljuc === 'turbot-fish'
    ? `Vaja po ${n === 0 ? 'prvi' : 'drugi'} risbi sheme zgoraj (${sh.naslov.split(' (')[0]}) – iste celice, črka x je števka `
    : n === 0 ? 'Vaja po shemi zgoraj – iste celice, črke so števke: '
    : kljuc === 'xy-wing' ? 'Vaja po zrcaljeni shemi zgoraj – stolpec 1 sheme je stolpec 9, stolpec 2 je stolpec 8 …, črke so števke: '
    : 'Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črke so števke: ';
  preveri(`${ime}: preslikava »${s.preslikava}«`, !!s.preslikava && s.preslikava.startsWith(zacetek), s.preslikava);
  const kje = n === 0 ? 'shemi' : kljuc === 'turbot-fish' ? 'drugi risbi' : kljuc === 'xy-wing' ? 'zrcaljeni shemi' : 'obrnjeni shemi';
  preveri(`${ime}: prazne celice = celice s črko na ${kje} (${sh.celice.length})`, JSON.stringify(s.prazne) === JSON.stringify(sh.celice), [s.prazne, sh.celice]);
  const px = s.velikosti.map(parseFloat);
  console.log(`    male števke ${s.velikosti.join(', ')}, celica ${s.celica} px`);
  preveri(`${ime}: male števke vsaj 8 px in vsaka v svoji celici`, px.length > 0 && px.every(v => v >= 8) && s.vCeli, s.velikosti);
  preveri(`${ime}: brez vodoravnega preliva`, !s.preliv);
  await b.izvedi(`document.querySelector('#exerciseArea .g9').scrollIntoView({ block: 'center' }); true`);
  await b.posnetek(path.join(mapa, `${kljuc}-vaja${n + 1}-${sirina}.png`), { vsaStran: false });
  for (const c of sh.vzorec) await b.klikni(`#exerciseArea .g9 .gc[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]`);
  await klikniGumb(b, 'Preveri');
  const fb = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .fb'); return { cls: f.className, besedilo: f.textContent }; })()`);
  preveri(`${ime}: pravi kliki na celice vzorca → »Pravilno!«`, fb.cls.split(' ').includes('ok') && fb.besedilo.startsWith('Pravilno!'), fb);
  if (sh.veriga) {
    const st = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .g9 .gc[data-si]')].flatMap(c =>
      [...c.querySelectorAll('.veriga-st')].map(d => [+c.dataset.r * 9 + +c.dataset.c, +d.textContent])).sort((p, q) => p[1] - q[1]).map(([i]) => i)`);
    preveri(`${ime}: številke verige 1-${sh.veriga.length} po vrsti sheme, 1 v V2S2`, JSON.stringify(st) === JSON.stringify(sh.veriga), [st, sh.veriga]);
  }
}

// 1 in 2: delna mreža iz shem pasu (vidni sta blok in vrstica vzorca; pri vaji 2 obrnjeno) - razčlenjeno v
// strani iz SHEME_TEHNIK, brez kode treninga.
const PAS_SHEME = (kljuc, obrnjeno) => `(() => {
  const obrni = i => (i % 9) * 9 + Math.floor(i / 9), blok = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
  const x = [], vz = [];
  SHEME_TEHNIK[${JSON.stringify(kljuc)}].celice.forEach((z, i) => {
    const t = z.replace(/^[*+]/, '').split(' ').filter(Boolean);
    if (!t.some(s => s.replace(/^-/, '') === 'x')) return;
    x.push(i); if (/^[*+]/.test(z)) vz.push(i); });
  const vr = Math.floor(vz[0] / 9), bl = blok(vz[0]);
  const vidne = [...Array(81).keys()].filter(i => Math.floor(i / 9) === vr || blok(i) === bl);
  const o = i => ${obrnjeno} ? obrni(i) : i, u = a => a.map(o).sort((p, q) => p - q);
  return { vidne: u(vidne), x: u(x.filter(i => vidne.includes(i))), vzorec: u(vz), enota: vr }; })()`;

const STANJE_PRESEKA = `(() => {
  const ex = document.querySelector('#exerciseArea .exercise'), k = ex.getBoundingClientRect();
  const sh = ex.querySelector('details.shema-razdelek'), ps = ex.querySelector('.po-shemi'), m = ex.querySelector('.vaja-presek');
  const r = e => e ? e.getBoundingClientRect() : null, [rs, rp, rm] = [r(sh), r(ps), r(m)];
  const v = e => !!e && e.left >= k.left - 0.5 && e.right <= k.right + 0.5;
  const celice = [...m.querySelectorAll('.celica')];
  const idx = c => +c.dataset.r * 9 + +c.dataset.c;
  const stevka = +((ps ? ps.textContent : '').match(/števka (\\d)\\.$/) || [])[1];
  const akt = sel => [...m.querySelectorAll(sel + ' > *')].map((s, i) => s.classList.contains('akt') ? i : -1).filter(i => i >= 0);
  return { oznaka: ex.querySelector('.ex-label').textContent, preslikava: ps ? ps.textContent : null, stevka,
    shemaOdprta: !!sh && sh.open, vrstniRed: !!(rs && rp && rm) && rs.bottom <= rp.top + 0.5 && rp.bottom <= rm.top + 0.5,
    vKartici: v(rs) && v(rp) && v(rm) && celice.every(c => v(c.getBoundingClientRect())),
    vidne: celice.filter(c => !c.classList.contains('izven')).map(idx).sort((p, q) => p - q),
    x: celice.filter(c => !c.classList.contains('izven') && [...c.querySelectorAll('.kand')].some(s => s.textContent === String(stevka))).map(idx).sort((p, q) => p - q),
    vrstice: akt('.rob-v'), stolpci: akt('.rob-s'),
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function vajaPreseka(b, kljuc, n, sirina) {
  const obrnjeno = n === 1;
  const s = await b.izvedi(STANJE_PRESEKA), sh = await b.izvedi(PAS_SHEME(kljuc, obrnjeno));
  const ime = `${kljuc}, vaja ${n + 1}, ${sirina} px`;
  preveri(`${ime}: oznaka »· po shemi${obrnjeno ? ', obrnjeno' : ''}«`, s.oznaka.endsWith(`· Vaja ${n + 1} / 9 · po shemi${obrnjeno ? ', obrnjeno' : ''}`), s.oznaka);
  preveri(`${ime}: shema odprta, preslikava med shemo in delno mrežo, vse v kartici`, s.shemaOdprta && s.vrstniRed && s.vKartici, s);
  preveri(`${ime}: preslikava »… črka x je števka ${s.stevka}.«`, s.stevka >= 1 && s.preslikava === (obrnjeno
    ? `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črka x je števka ${s.stevka}.`
    : `Vaja po shemi zgoraj – iste celice, črka x je števka ${s.stevka}.`), s.preslikava);
  preveri(`${ime}: vidne celice = blok in ${obrnjeno ? 'stolpec obrnjene' : 'vrstica'} sheme (${sh.vidne.length})`, JSON.stringify(s.vidne) === JSON.stringify(sh.vidne), [s.vidne, sh.vidne]);
  preveri(`${ime}: celice z x = celice x sheme v vidnem delu (${sh.x.length})`, JSON.stringify(s.x) === JSON.stringify(sh.x), [s.x, sh.x]);
  preveri(`${ime}: krepka oznaka roba – ${obrnjeno ? 'stolpec' : 'vrstica'} ${sh.enota + 1}`,
    JSON.stringify([s.vrstice, s.stolpci]) === JSON.stringify(obrnjeno ? [[], [sh.enota]] : [[sh.enota], []]), [s.vrstice, s.stolpci]);
  preveri(`${ime}: brez vodoravnega preliva`, !s.preliv);
  await b.posnetek(path.join(mapa, `${kljuc}-vaja${n + 1}-${sirina}.png`));
  for (const c of sh.vzorec) await b.klikni(`#exerciseArea .vaja-presek .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]`);
  await klikniGumb(b, 'Preveri');
  const fb = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .fb'); return { cls: f.className, besedilo: f.textContent,
    vzorec: [...document.querySelectorAll('#exerciseArea .vaja-presek .celica.k-vzorec')].map(c => +c.dataset.r * 9 + +c.dataset.c).sort((p, q) => p - q) }; })()`);
  preveri(`${ime}: pravi kliki na celice vzorca → »Pravilno!«, vzorec označen`, fb.cls.split(' ').includes('ok') && fb.besedilo.startsWith('Pravilno!')
    && JSON.stringify(fb.vzorec) === JSON.stringify(sh.vzorec), fb);
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      for (const kljuc of ['pointing', 'box-line']) {
        console.log(`${kljuc}, ${sirina} px`);
        await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
        await b.izvedi(SEME(20261009));
        await b.klikni(`.menu-card[data-mode="${kljuc}"]`);
        await b.cakaj("!!document.querySelector('#exerciseArea .vaja-presek')", 10000);
        await pocakaj(b);
        await vajaPreseka(b, kljuc, 0, sirina);
        await klikniGumb(b, 'Naslednja vaja →');
        await b.cakaj("!!document.querySelector('#exerciseArea .vaja-presek')", 10000);
        await vajaPreseka(b, kljuc, 1, sirina);
      }
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
      for (const kljuc of ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple']) {
        console.log(`${kljuc}, ${sirina} px`);
        await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
        await b.izvedi(SEME(20261009));
        await b.klikni(`.menu-card[data-mode="${kljuc}"]`);
        await pocakaj(b);
        await vajaPodmnozice(b, kljuc, 0, sirina);
        await klikniGumb(b, 'Naslednja vaja →');
        await vajaPodmnozice(b, kljuc, 1, sirina);
      }
      for (const kljuc of ['turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain']) {
        console.log(`${kljuc}, ${sirina} px`);
        await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
        await b.izvedi(SEME(20261009));
        await b.klikni(`.menu-card[data-mode="${kljuc}"]`);
        await pocakaj(b);
        await vajaMreze(b, kljuc, 0, sirina);
        await klikniGumb(b, 'Naslednja vaja →');
        await vajaMreze(b, kljuc, 1, sirina);
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
