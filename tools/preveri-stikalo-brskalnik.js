'use strict';
// »Namig« in »Rešitev« kot stikali v pravem brskalniku (docs/trening-ucenje-nacrt.md, del B,
// korak 1): trening »Spoznaj« 11 · XY-krilo pri 375 px (posnemanje telefona, pravi dotik –
// tapni()) in 1280 px (prava miška):
//   - dotik/klik »Rešitev« odpre okvir in oznake, gumb ima napis »Skrij rešitev«, aria-pressed in
//     pritisnjen slog (izračunan: podlaga in polna obroba), drugi dotik/klik ga zapre;
//   - okvir ostane po drsenju strani (kolesce miške pri 1280, potez prsta pri 375);
//   - na dnu strani (1280 × 1000, stran pomaknjena do konca) ostane odprt - v izhodišču (gumb
//     »Rešitev (drži)«, --izhodisce, privzeto 4e1e4dc) se med pravim pritiskom skrije (napaka iz
//     »Kasneje«, docs/uskladitev.md). Izhodišče je 4e1e4dc, kjer je bila napaka izmerjena
//     (docs/oznake-nacrt.md, razdelek 8): v c7eb185 se v brskalniku brez glave ne pokaže več, ker je
//     nad gumbom več vsebine (razdelka »Razlaga« in »Shema«), mehanizem - mouseleave ob pritisku - pa
//     je ostal;
//   - besedilo okvirja se da označiti (vlečenje miške), okvir ostane odprt;
//   - Namig in Rešitev: odprt je kvečjemu eden;
//   - »Vadi v uganki« 4: drugi klik na »Namig« zapre okvir;
//   - brez vodoravnega preliva in brez napak JS.
//
//   node tools/preveri-stikalo-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');

const KOREN = path.join(__dirname, '..');
const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-stikalo'));
const izhodisce = arg('--izhodisce', '4e1e4dc');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const SEME = s => `(() => { let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return true; })()`;
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

// Stanje pomoči na strani: gumba (napis, aria-pressed, podlaga, obroba), odprti okvirji, oznake.
const STANJE = `(() => {
  const g = [...document.querySelectorAll('.peek-row button')].map(x => { const s = getComputedStyle(x);
    return { napis: x.textContent, pritisnjen: x.getAttribute('aria-pressed'), podlaga: s.backgroundColor, obroba: s.borderTopStyle }; });
  return { gumbi: g, odprti: document.querySelectorAll('.peek-overlay.visible, .vadi-pomoc:not([hidden])').length,
    oznake: document.querySelectorAll('#exerciseArea .peek-hl').length,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function gumb(b, napis, dotik) {
  await b.izvedi(`[...document.querySelectorAll('.peek-row button')].find(x => x.textContent === ${JSON.stringify(napis)}).setAttribute('data-klik', '1'); true`);
  if (dotik) await b.tapni('.peek-row button[data-klik="1"]'); else await b.klikni('.peek-row button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
  await pocakaj(b);
}

async function spoznaj(b, sirina) {
  const dotik = sirina < 500;
  console.log(`Trening »Spoznaj« 11 · XY-krilo, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: dotik });
  await b.izvedi(SEME(20261008));
  await b.izvedi(`zacniKrog('xy-wing', 'spoznaj'); true`);
  let s = await b.izvedi(STANJE);
  preveri('zaprto: »Namig« in »Rešitev«, aria-pressed false', JSON.stringify(s.gumbi.map(x => [x.napis, x.pritisnjen])) === '[["Namig","false"],["Rešitev","false"]]', s.gumbi);
  const zaprtSlog = s.gumbi[1];

  await gumb(b, 'Rešitev', dotik);
  s = await b.izvedi(STANJE);
  preveri('»Rešitev« odpre okvir in oznake', s.odprti === 1 && s.oznake > 0, s);
  preveri('napis »Skrij rešitev«, aria-pressed true', s.gumbi[1].napis === 'Skrij rešitev' && s.gumbi[1].pritisnjen === 'true', s.gumbi[1]);
  preveri('pritisnjen slog: podlaga #FFFCE8, polna obroba (zaprt: bel, črtkan)',
    s.gumbi[1].podlaga === 'rgb(255, 252, 232)' && s.gumbi[1].obroba === 'solid' && zaprtSlog.podlaga === 'rgb(255, 255, 255)' && zaprtSlog.obroba === 'dashed', [zaprtSlog, s.gumbi[1]]);
  preveri('brez vodoravnega preliva', !s.preliv);
  await b.posnetek(path.join(mapa, `resitev-${sirina}.png`), { vsaStran: false });

  // Drsenje strani: okvir ostane.
  if (dotik) {
    await b.cdp.poslji('Input.synthesizeScrollGesture', { x: 180, y: 600, yDistance: -500, speed: 2000 });
    await b.cdp.poslji('Input.synthesizeScrollGesture', { x: 180, y: 300, yDistance: 500, speed: 2000 });
  } else {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 500, deltaX: 0, deltaY: 600 });
    await pocakaj(b);
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 500, deltaX: 0, deltaY: -600 });
  }
  await pocakaj(b);
  s = await b.izvedi(STANJE);
  preveri('po drsenju strani ostane odprta', s.odprti === 1 && s.oznake > 0 && s.gumbi[1].napis === 'Skrij rešitev', s);

  // Besedilo okvirja se da označiti (vlečenje miške čez prvo vrstico); okvir ostane odprt.
  if (!dotik) {
    const t = await b.izvedi(`(() => { const o = document.querySelector('.peek-overlay.visible'); o.scrollIntoView({ block: 'center' });
      const r = o.getBoundingClientRect(); return { x1: r.left + 16, x2: r.right - 16, y: r.top + 16, us: getComputedStyle(o).userSelect }; })()`);
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x1, y: t.y, button: 'left', clickCount: 1 });
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x2, y: t.y, button: 'left' });
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x2, y: t.y, button: 'left', clickCount: 1 });
    const oznaceno = await b.izvedi('window.getSelection().toString()');
    s = await b.izvedi(STANJE);
    preveri('besedilo okvirja se da označiti', oznaceno.length > 10 && t.us !== 'none', { oznaceno: oznaceno.slice(0, 40), userSelect: t.us });
    preveri('okvir po označevanju ostane odprt', s.odprti === 1, s);
    await b.izvedi('window.getSelection().removeAllRanges(); true');
  }

  // Namig zamenja Rešitev (kvečjemu eden odprt), drugi klik zapre.
  await gumb(b, 'Namig', dotik);
  s = await b.izvedi(STANJE);
  preveri('Namig zamenja Rešitev: en okvir, brez oznak', s.odprti === 1 && s.oznake === 0
    && JSON.stringify(s.gumbi.map(x => [x.napis, x.pritisnjen])) === '[["Skrij namig","true"],["Rešitev","false"]]', s);
  await gumb(b, 'Skrij namig', dotik);
  s = await b.izvedi(STANJE);
  preveri('drugi dotik/klik zapre', s.odprti === 0 && s.gumbi[0].napis === 'Namig', s);
}

// Na dnu strani (1280 × 1000): stran pomaknjena do konca, nato »Rešitev«. Nova koda: klik, okvir
// ostane. Izhodišče: pravi pritisk na »Rešitev (drži)« - po 300 ms med držanjem je okvir skrit.
async function dnoStrani(b, star) {
  await b.odpri('trening/index.html', { sirina: 1280, visina: 1000 });
  await b.izvedi(SEME(20261008));
  await b.klikni('.menu-card[data-mode="xy-wing"]');
  await b.izvedi('window.scrollTo(0, document.documentElement.scrollHeight); true');
  await pocakaj(b);
  const t = await b.izvedi(`(() => { const g = document.querySelectorAll('.peek-row button')[1]; const r = g.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, napis: g.textContent, dno: Math.abs(window.scrollY + innerHeight - document.documentElement.scrollHeight) < 2 }; })()`);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  if (star) {
    await pocakaj(b);
    const odprt = await b.izvedi(`document.querySelectorAll('.peek-overlay.visible').length`);
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    return { ...t, odprt };
  }
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  await pocakaj(b, 500);
  return { ...t, odprt: await b.izvedi(`document.querySelectorAll('.peek-overlay.visible').length`) };
}

async function vadi(b) {
  console.log('Trening »Vadi v uganki« 4 · Skriti par, 1280 px');
  await b.odpri('trening/index.html', { sirina: 1280, visina: 1000 });
  await b.izvedi(SEME(7));
  await b.izvedi(`zacniKrog('hidden-pair', 'uganka'); true`);
  await b.cakaj('document.querySelector(".vaja-uganka")', 15000);
  await gumb(b, 'Namig', false);
  let s = await b.izvedi(STANJE);
  preveri('»Namig« odpre okvir, napis »Skrij namig«', s.odprti === 1 && s.gumbi[0].napis === 'Skrij namig' && s.gumbi[0].pritisnjen === 'true', s);
  await gumb(b, 'Skrij namig', false);
  s = await b.izvedi(STANJE);
  preveri('drugi klik okvir zapre', s.odprti === 0 && s.gumbi[0].napis === 'Namig', s);
  await gumb(b, 'Rešitev', false);
  s = await b.izvedi(STANJE);
  preveri('pritisnjen slog tudi tu', s.gumbi[1].podlaga === 'rgb(255, 252, 232)' && s.gumbi[1].obroba === 'solid', s.gumbi[1]);
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    await spoznaj(b, 375);
    await spoznaj(b, 1280);
    console.log('Na dnu strani, 1280 × 1000');
    const r = await dnoStrani(b, false);
    preveri('stran je pomaknjena do konca', r.dno, r);
    preveri('nova koda: »Rešitev« ostane odprta', r.odprt === 1 && r.napis === 'Rešitev', r);
    await vadi(b);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }

  // Izhodišče: napaka iz »Kasneje« - okvir se med pritiskom skrije.
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star });
  const bStar = await zazeni({ koren: star });
  try {
    console.log(`Izhodišče ${izhodisce}, na dnu strani, 1280 × 1000`);
    const r = await dnoStrani(bStar, true);
    preveri('izhodišče: gumb »Rešitev (drži)«, stran do konca', r.napis === 'Rešitev (drži)' && r.dno, r);
    preveri('izhodišče: okvir se med pritiskom skrije (napaka, ki jo stikalo odpravi)', r.odprt === 0, r);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
