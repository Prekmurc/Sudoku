'use strict';
// Faza 5 – videz (docs/faza5-nacrt.md) v pravem brskalniku: vse tri aplikacije pri 320,
// 375, 430 in 1280 px v več stanjih. Preveri, da stran nima vodoravnega preliva
// (scrollWidth <= clientWidth), da noben element ne sega čez svojo kartico (ali ploščo,
// okno), da povečan prikaz in okna pokrijejo celo okno in nimajo vodoravnega drsnika
// (razen notranjosti povečanega prikaza - tam je povečava namen) ter da v strani ni napak JS.
//
//   node tools/preveri-videz-brskalnik.js [--mapa <mapa za posnetke>] [--sirine 320,375]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).
// Brskalnik brez glave skrije drsnike, zato preliv zaradi širine drsnika na namizju tu ni
// viden (ročni pregled).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto;
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-videz'));
const SIRINE = arg('--sirine', '320,375,430,1280').split(',').map(Number);

// Math.random s semenom (mulberry32) v strani - vaje treninga so ponovljive.
const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0; let t = seme;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })()`;

// Tehnike treninga (data-mode kartic) - »Spoznaj« vseh in »Vadi v uganki« treh.
const TEHNIKE = ['naked-single', 'hidden-single', 'pointing', 'box-line', 'naked-pair', 'hidden-pair',
  'naked-triple', 'hidden-triple', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
const VADI = ['naked-pair', 'swordfish', 'naked-single'];

// ime posnetka: brez šumnikov in presledkov
const datoteka = ime => ime.replace(/č/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/[^a-z0-9-]+/gi, '-');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Meritev v strani: širina strani, elementi čez okno, elementi čez svojo posodo (kartica,
// plošča, okno) - samo najvišji, ki seže čez (njegovi otroci se ne naštevajo).
const MERITEV = `(() => {
  const d = document.documentElement;
  const ime = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : '');
  const vidno = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const cez = (r, p) => r.right > p.right + 0.5 || r.left < p.left - 0.5;
  const posode = [...document.querySelectorAll('.card, .exercise, .menu-card, .score-bar, .plosca, .stranski, .dialog-panel, .lib-panel, #steps li')]
    .filter(p => vidno(p) && !p.closest('#lightbox'));
  const izPosod = [];
  for (const p of posode) {
    const pr = p.getBoundingClientRect();
    for (const el of p.querySelectorAll('*')) {
      if (!vidno(el)) continue;
      const r = el.getBoundingClientRect();
      if (!cez(r, pr)) continue;
      if (el.parentElement !== p && cez(el.parentElement.getBoundingClientRect(), pr)) continue;
      izPosod.push(ime(p) + ' > ' + ime(el) + ' [' + Math.round(r.left - pr.left) + ', ' + Math.round(r.right - pr.right) + ']');
    }
  }
  return { sw: d.scrollWidth, cw: d.clientWidth, izPosod: [...new Set(izPosod)].slice(0, 6) };
})()`;

async function meri(b, ime, sirina, posnetek = false) {
  const r = await b.izvedi(MERITEV);
  preveri(`${ime}: brez vodoravnega preliva strani`, r.sw <= r.cw, `${r.sw} > ${r.cw}`);
  preveri(`${ime}: nič ne sega čez svojo kartico`, r.izPosod.length === 0, r.izPosod);
  if (posnetek) await b.posnetek(path.join(mapa, `${datoteka(ime)}-${sirina}.png`));
}

// Fiksno okno (povečan prikaz, zbirka, okna igre) pokrije celo okno brskalnika in nima
// vodoravnega drsnika; `notranji` je element z namenskim drsnikom (povečava), ki se ne šteje.
async function okno(b, izbirnik, ime, sirina) {
  const r = await b.izvedi(`(() => {
    const o = document.querySelector(${JSON.stringify(izbirnik)});
    if (!o || getComputedStyle(o).display === 'none') return null;
    const p = o.getBoundingClientRect();
    return { l: p.left, t: p.top, w: p.width, h: p.height, iw: innerWidth, ih: innerHeight, sw: o.scrollWidth, cw: o.clientWidth,
      fixed: getComputedStyle(o).position };
  })()`);
  preveri(`${ime}: okno je odprto`, r !== null);
  if (!r) return;
  preveri(`${ime}: pokrije celo okno`, r.fixed === 'fixed' && Math.abs(r.l) < 0.5 && Math.abs(r.t) < 0.5
    && Math.abs(r.w - r.iw) < 0.5 && Math.abs(r.h - r.ih) < 0.5, r);
  preveri(`${ime}: brez vodoravnega drsnika v oknu`, r.sw <= r.cw, `${r.sw} > ${r.cw}`);
  await b.posnetek(path.join(mapa, `${datoteka(ime)}-${sirina}.png`), { vsaStran: false });
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'reševalec prazen', sirina);
  await b.izvedi(`(() => { const sel = document.getElementById('exampleSelect'); sel.value = '2'; sel.dispatchEvent(new Event('change')); })()`);
  await b.klikni('#candBtn');
  await b.klikni('#solveBtn');
  await b.cakaj(`document.getElementById('results').style.display === 'block'`, 20000);
  await b.klikni('#openStepsBtn');
  // male mreže koraka: prvih nekaj in ena pozneje (več kandidatov)
  await b.izvedi(`(() => { const t = [...document.querySelectorAll('.mini-toggle')]; [0, 1, 4, Math.floor(t.length / 2)].forEach(i => t[i] && t[i].click()); })()`);
  const mreze = await b.izvedi(`document.querySelectorAll('.mini-container .mini-grid').length`);
  preveri('reševalec: male mreže koraka so odprte', mreze >= 3, mreze);
  await meri(b, 'reševalec z rešitvijo in koraki', sirina, true);
  await b.klikni('#libraryBtn');
  await okno(b, '#library', 'reševalec, okno zbirke', sirina);
  await b.klikni('#libClose');
  await b.klikni('#solvedGrid');
  await okno(b, '#lightbox', 'reševalec, povečan prikaz rešitve', sirina);
  await b.klikni('#lightboxClose');
  await b.klikni('.mini-container .mini-grid');
  await okno(b, '#lightbox', 'reševalec, povečan prikaz koraka', sirina);
  await b.klikni('#lightboxClose');
  await meri(b, 'reševalec po zaprtju oken', sirina);
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'igra prazna', sirina);
  await b.izvedi('zacniIgro(PRIMERI[0].danosti)');
  for (const id of ['stikaloVrstice', 'stikaloStolpci', 'stikaloBloki']) {
    if (!await b.izvedi(`document.getElementById('${id}').checked`)) await b.klikni('#' + id);
  }
  await b.klikni('#mreza .celica[data-r="4"][data-c="5"]');
  await b.klikni('#korakBtn');
  await b.klikni('.nastavi-poud summary');
  preveri('igra: razdelek »Barve poudarka« je odprt', await b.izvedi(`document.querySelector('.nastavi-poud').open`));
  await meri(b, 'igra z uganko, seznami in barvami poudarka', sirina, true);
  for (const [gumb, id, ime] of [['#zbirkaBtn', '#zbirkaDialog', 'igra, okno zbirke'], ['#novaBtn', '#novaDialog', 'igra, okno nova uganka'],
    ['#navodilaBtn', '#navodilaDialog', 'igra, okno pomoč']]) {
    await b.klikni(gumb);
    if (id === '#zbirkaDialog') await b.izvedi(`document.getElementById('primeriRazdelek').open = true`);
    await okno(b, `${id}.odprt`, ime, sirina);
    const r = await b.izvedi(MERITEV);
    preveri(`${ime}: nič ne sega čez okno`, r.izPosod.length === 0, r.izPosod);
    await b.izvedi(`document.querySelector('${id} [data-zapri]').click()`);
  }
}

async function trening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'trening meni', sirina);
  for (const m of TEHNIKE) {
    await b.izvedi(SEME(4242));
    await b.izvedi(`zacniKrog('${m}', 'spoznaj')`);
    await meri(b, `trening Spoznaj ${m}`, sirina, m === 'naked-pair');
    await b.klikni('#backBtn');
  }
  for (const m of VADI) {
    await b.izvedi(SEME(4242));
    await b.izvedi(`zacniKrog('${m}', 'uganka')`);
    await b.cakaj(`!document.querySelector('.vadi-isce')`, 15000);
    await meri(b, `trening Vadi ${m}`, sirina);
    await b.klikni('#backBtn');
  }
}

async function main() {
  const b = await zazeni();
  try {
    for (const sirina of SIRINE) {
      await resevalec(b, sirina);
      await igra(b, sirina);
      await trening(b, sirina);
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
