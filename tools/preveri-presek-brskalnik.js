'use strict';
// Vaji 1 · Izločitev izven bloka in 2 · Izločitev v bloku v načinu "Spoznaj" v pravem
// brskalniku (docs/geometrija-1-2-nacrt.md), pri širini 375 in 1200 px: delna mreža v
// kartici brez vodoravnega drsnika, 66 skritih celic kot siva ploskev in 15 vidnih,
// krepka oznaka vrstice/stolpca vaje, poudarjena števka, izrazita izbira, pravi kliki
// (skrita celica se ne izbere, pravilna izbira -> "Pravilno!" in oznake koraka), brez
// napak JS; posnetke zaslona shrani v mapo (--mapa, privzeto začasna).
//
// Druge tehnike (3-12) morajo ostati enake: z Math.random s semenom se vsaka
// vaja izriše v izhodišču (izvleček commita --izhodisce z git archive, privzeto
// 4e1e4dc - zadnji commit faze 5 »videz«, docs/faza5-nacrt.md; prej 7429363) in v
// trenutni kodi; primerja se
// innerHTML območja vaje in izračunani slogi vseh njegovih elementov. E1 in E2 sta od
// naloge »Pripomočki za E1/E2« (2026-09-28) na plošči iz shared/plosca.js in se od
// izhodišča namerno razlikujeta, zato ju tu ni - preverja ju
// tools/preveri-enojcki-brskalnik.js (ta primerja 3-12 z istim izhodiščem).
//
//   node tools/preveri-presek-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa, odmakniMisko } = require('./primerjava-slogov.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-presek'));
const izhodisce = arg('--izhodisce', '4e1e4dc');
const KOREN = path.join(__dirname, '..');

const SIVA = 'rgb(228, 232, 236)'; // --izven-bg v shared/mreza.css
let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Math.random s semenom (mulberry32) v strani - pred klikom na kartico tehnike.
const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; return true; })()`;

const celica = i => `.vaja-presek .celica[data-r="${Math.floor(i / 9)}"][data-c="${i % 9}"]`;

async function presek(b, mode, sirina) {
  console.log(`Trening, ${mode === 'pointing' ? '1 · Izločitev izven bloka' : '2 · Izločitev v bloku'}, ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(SEME(20260927 + sirina));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  // Vaja: iz stanja strani (vidne celice, korak), ne iz generatorja v Node.
  const ex = await b.izvedi(`(() => {
    const c = presek.mreza.celice;
    const vidne = c.map((e, i) => e.classList.contains('izven') ? -1 : i).filter(i => i >= 0);
    return { vidne, prazne: vidne.filter(i => !c[i].classList.contains('dana') && !c[i].classList.contains('vpis')) };
  })()`);
  const podatki = await b.izvedi(`(() => {
    const k = document.querySelector('.vaja-presek'), kr = k.getBoundingClientRect();
    const kartica = document.querySelector('.exercise').getBoundingClientRect();
    const c = presek.mreza.celice;
    const skrite = c.filter(e => e.classList.contains('izven'));
    const krepke = [...k.querySelectorAll('.rob-s span, .rob-v span')].filter(s => getComputedStyle(s).fontWeight === '700').map(s => s.textContent);
    return {
      sirinaStrani: document.documentElement.scrollWidth,
      vKartici: kr.left >= kartica.left && kr.right <= kartica.right,
      skritih: skrite.length,
      sivih: skrite.filter(e => getComputedStyle(e).backgroundColor === '${SIVA}').length,
      belihVidnih: c.filter(e => !e.classList.contains('izven') && getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)').length,
      krepke,
      poudarjenih: document.querySelectorAll('.vaja-presek .kand.poud').length,
      stevilaKandidatov: [...document.querySelectorAll('button')].some(g => g.textContent === 'Pokaži število kandidatov'),
      velikost: c[0].getBoundingClientRect().width,
    };
  })()`);
  preveri('ni vodoravnega drsnika', podatki.sirinaStrani === sirina, podatki.sirinaStrani);
  preveri('mreža je v kartici', podatki.vKartici);
  preveri('66 skritih celic, vse sive', podatki.skritih === 66 && podatki.sivih === 66, [podatki.skritih, podatki.sivih]);
  preveri('15 vidnih celic, bele', ex.vidne.length === 15 && podatki.belihVidnih === 15, [ex.vidne.length, podatki.belihVidnih]);
  preveri('krepka je natanko ena oznaka roba (enota vaje)', podatki.krepke.length === 1, podatki.krepke);
  preveri('števka vaje je poudarjena', podatki.poudarjenih > 0, podatki.poudarjenih);
  preveri('ni gumba »Pokaži število kandidatov«', !podatki.stevilaKandidatov);
  console.log(`    velikost celice ${podatki.velikost.toFixed(1)} px, krepko ${podatki.krepke.join(', ')}`);

  // Pravi kliki: skrita celica se ne izbere, dve prazni celici se izbereta in sta vidno drugačni.
  const skrita = [...Array(81).keys()].find(i => !ex.vidne.includes(i));
  await b.klikni(celica(skrita));
  preveri('klik skrite celice ne izbere', (await b.izvedi('selected.length')) === 0);
  const [a, c2] = ex.prazne;
  await b.klikni(celica(a));
  await b.klikni(celica(c2));
  const izbira = await b.izvedi(`(() => {
    const c = presek.mreza.celice, s = getComputedStyle(c[${a}]), n = [...c].find((e, i) => !e.classList.contains('izven') && !e.classList.contains('izbrana') && !e.classList.contains('dana') && !e.classList.contains('vpis'));
    return { izbrane: [...selected], bg: s.backgroundColor, senca: s.boxShadow, bgNeizbrane: n ? getComputedStyle(n).backgroundColor : '' };
  })()`);
  preveri('izbrani sta dve celici', izbira.izbrane.length === 2 && izbira.izbrane.includes(a) && izbira.izbrane.includes(c2), izbira.izbrane);
  preveri('izbrana celica ima drugo podlago in obrobo', izbira.bg !== izbira.bgNeizbrane && /3px/.test(izbira.senca), izbira);
  await b.posnetek(path.join(mapa, `${mode}-${sirina}-izbira.png`));

  // Pravilen odgovor s pravimi kliki: počisti izbiro, izberi celice koraka, Preveri.
  for (const i of izbira.izbrane) await b.klikni(celica(i));
  // Celice koraka iz stanja strani: prikaz koraka (kot "Rešitev") označi vzorec (k-vzorec).
  const vzorec = await b.izvedi(`(() => { presek.pokaziKorak(true);
    const v = presek.mreza.celice.map((e, i) => e.classList.contains('k-vzorec') ? i : -1).filter(i => i >= 0);
    presek.pokaziKorak(false); return v; })()`);
  preveri('vzorec ima 2 ali 3 celice', vzorec.length === 2 || vzorec.length === 3, vzorec);
  for (const i of vzorec) await b.klikni(celica(i));
  await b.izvedi(`[...document.querySelectorAll('button')].find(g => g.textContent === 'Preveri').dataset.test = 'preveri'`);
  await b.klikni('[data-test="preveri"]');
  const po = await b.izvedi(`(() => {
    const fb = document.querySelector('.fb');
    const c = presek.mreza.celice;
    return { cls: fb.className, besedilo: fb.textContent, vzorec: c.filter(e => e.classList.contains('k-vzorec')).length,
      izbris: document.querySelectorAll('.vaja-presek .kand.k-izbris').length, rezultat: document.getElementById('scoreRight').textContent + '/' + document.getElementById('scoreTotal').textContent };
  })()`);
  preveri('pravilna izbira → »Pravilno!«', po.cls.includes('ok') && po.besedilo.startsWith('Pravilno!'), po.besedilo);
  preveri('oznake koraka na mreži (vzorec in izbris)', po.vzorec === vzorec.length && po.izbris > 0, po);
  preveri('rezultat 1/1', po.rezultat === '1/1', po.rezultat);
  await b.posnetek(path.join(mapa, `${mode}-${sirina}-pravilno.png`));
}

// Izris vaje z danim semenom: innerHTML območja vaje in izračunani slogi njegovih elementov.
const SLOGI = ['width', 'height', 'background-color', 'color', 'font-size', 'font-weight', 'font-family',
  'border-top-width', 'border-left-color', 'box-shadow', 'display', 'visibility', 'margin-top', 'padding-left'];
async function izris(b, mode, sirina) {
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(SEME(4242));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await odmakniMisko(b); // :hover s prehodom pod miško ne sme vplivati na primerjavo
  // Pisave (Google Fonts) se lahko naložijo šele po kliku - širina besedila bi se
  // razlikovala zaradi nalaganja, ne zaradi kode (lažna razlika 0,016 px pri 8b,
  // docs/vadi-v-uganki-nacrt.md 16.10).
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    const a = document.getElementById('exerciseArea');
    const slogi = [...a.querySelectorAll('*')].map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    return { html: a.innerHTML, slogi };
  })()`);
}

async function drugeTehnike(sirine) {
  const vse = ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple',
    'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
  const brez = ['pointing', 'box-line', 'naked-single', 'hidden-single'];
  const html = fs.readFileSync(path.join(KOREN, 'trening', 'index.html'), 'utf8');
  const nacini = [...html.matchAll(/data-mode="([^"]+)"/g)].map(m => m[1]).filter(m => !brez.includes(m));
  preveri('druge tehnike: 10 kartic (3-12)', nacini.length === 10 && vse.every(m => nacini.includes(m)), nacini);

  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  const tar = path.join(star, 'izhodisce.tar');
  execFileSync('git', ['archive', '--format=tar', '-o', tar, izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  const bNov = await zazeni();
  try {
    for (const sirina of sirine) {
      console.log(`Druge tehnike, ${sirina} px (izhodišče ${izhodisce})`);
      for (const m of nacini) {
        const s = await izris(bStar, m, sirina);
        const n = await izris(bNov, m, sirina);
        const razl = razlikeIzrisa(s, n, SLOGI);
        preveri(`${m}: izris enak`, razl.length === 0, razl);
      }
    }
  } finally {
    await bStar.zapri();
    await bNov.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
  for (const n of [...bStar.napake, ...bNov.napake]) { console.log(`  ✗ ${n}`); napak++; }
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    for (const sirina of [375, 1200]) {
      for (const mode of ['pointing', 'box-line']) await presek(b, mode, sirina);
    }
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  await drugeTehnike([375, 1200]);
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
