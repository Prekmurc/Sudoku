'use strict';
// XY-veriga, korak 3 (docs/xy-veriga-nacrt.md, razdelek 5, O4: B) v pravem brskalniku: zaporedne
// številke celic verige na mreži pri 375 in 1280 px - mala mreža koraka in povečava v reševalcu,
// mreža igre na tretji stopnji »Naslednjega koraka« in mreža vaj 9 × 9 v »Spoznaj« ob
// »Rešitvi (drži)«. Veriga še ni v vrstnem redu tehnik (korak 6), zato jo scenarij v stran
// vstavi sam: v reševalcu namesto korakov 31-34 preizkusne uganke xy-veriga-17 (stanje pred
// poskusom) postavi štiri verige xyChain() iz tega stanja, v igri odigra korake 1-30 dnevnika
// solve() in »Naslednji korak« da prednost verigi, v treningu vaja XY-krila dobi polje veriga
// (kot ga bo dal generator verige). Za vsako številko: izračunan slog (jantarna podlaga, bela
// pisava, kontrast vsaj 4,5 : 1), v celici (ne sega čez notranji rob), brez prekrivanja s
// kandidati, pravo besedilo in mesto (5, sicer 8, 2, 4, 6, 1, 3, 7, 9); legenda »celice verige (po
// vrsti)«; brez vodoravnega preliva in napak JS. Posnetki mrež v mapo (--mapa).
//
//   node tools/preveri-veriga-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-veriga');
const D = JSON.stringify(loadPuzzles().find(u => u.ime === 'xy-veriga-17').danosti.replace(/\./g, '0'));
const MESTA = [5, 8, 2, 4, 6, 1, 3, 7, 9];
// Prva veriga preizkusne uganke pred korakom 31: V5S4 – V6S6 – V9S6 – V8S5 – V8S3 (indeksi 0-80).
const PREIZKUSNA = [39, 50, 77, 67, 65];

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Meritev številk verige v elementu `koren`: za vsako številko (izbirnik `oznaka`) celica
// (najbližji prednik z izbirnikom `celica`), položaj v celici, kandidati v isti celici
// (otroci starša številke z besedilom, ki niso številka), izračunan slog in kontrast.
const MERI = `(koren, oznaka, celica) => {
  const lum = rgb => { const k = rgb.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]; };
  const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const el = typeof koren === 'string' ? document.querySelector(koren) : koren;
  return [...el.querySelectorAll(oznaka)].map(o => {
    const c = o.closest(celica), r = o.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const notranja = { l: cr.left + c.clientLeft, t: cr.top + c.clientTop, r: cr.left + c.clientLeft + c.clientWidth, b: cr.top + c.clientTop + c.clientHeight };
    const sosedi = [...o.parentElement.children].filter(x => x !== o && x.textContent.trim() && getComputedStyle(x).visibility !== 'hidden');
    const prekrivanje = sosedi.map(x => { const q = x.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, q.right) - Math.max(r.left, q.left)) * Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)); });
    const s = getComputedStyle(o);
    return {
      besedilo: o.textContent, mesto: [...o.parentElement.children].indexOf(o) + 1,
      r: +c.dataset.r, c: +c.dataset.c,
      kandidati: sosedi.map(x => +x.textContent),
      vCelici: r.left >= notranja.l - 0.01 && r.top >= notranja.t - 0.01 && r.right <= notranja.r + 0.01 && r.bottom <= notranja.b + 0.01,
      prekrivanje: Math.max(0, ...prekrivanje),
      sirina: r.width, visina: r.height, celica: cr.width,
      vidna: s.visibility === 'visible' && s.display !== 'none' && r.width > 0,
      ozadje: s.backgroundColor, barva: s.color, pisava: parseFloat(s.fontSize),
      kontrast: kontrast(s.color, s.backgroundColor),
    };
  });
}`;

const AMBER_INK = 'rgb(134, 92, 15)';
function pregledOznak(ime, m, pricakovano) {
  preveri(`${ime}: ${pricakovano.length} številk`, m.length === pricakovano.length, m.length);
  const poVrsti = [...m].sort((a, b) => a.besedilo - b.besedilo);
  preveri(`${ime}: številke 1…n v celicah verige po vrsti`,
    JSON.stringify(poVrsti.map(o => [o.besedilo, o.r * 9 + o.c])) === JSON.stringify(pricakovano.map((c, j) => [String(j + 1), c])),
    poVrsti.map(o => `${o.besedilo}:V${o.r + 1}S${o.c + 1}`));
  preveri(`${ime}: mesto 5, sicer prvo prosto (8, 2, 4 …)`,
    m.every(o => o.mesto === MESTA.find(d => !o.kandidati.includes(d))), m.map(o => [o.mesto, o.kandidati]));
  preveri(`${ime}: v vsaki celici verige dva kandidata ostaneta`, m.every(o => o.kandidati.length === 2), m.map(o => o.kandidati));
  preveri(`${ime}: številka ne sega iz celice`, m.every(o => o.vCelici));
  preveri(`${ime}: številka ne prekrije kandidata`, m.every(o => o.prekrivanje === 0), m.map(o => o.prekrivanje));
  preveri(`${ime}: vidna, jantarna podlaga, bela pisava`, m.every(o => o.vidna && o.ozadje === AMBER_INK && o.barva === 'rgb(255, 255, 255)'),
    m.map(o => [o.ozadje, o.barva]));
  preveri(`${ime}: kontrast vsaj 4,5 : 1`, m.every(o => o.kontrast >= 4.5), m.map(o => o.kontrast.toFixed(2)));
  const o = m[0] || {};
  console.log(`     celica ${o.celica && o.celica.toFixed(1)} px, številka ${o.sirina && o.sirina.toFixed(1)} × ${o.visina && o.visina.toFixed(1)} px, pisava ${o.pisava} px, kontrast ${o.kontrast && o.kontrast.toFixed(2)}`);
}

// Posnetek elementa (dvojna ločljivost) - mreža s številkami za ogled.
async function posnetekElementa(b, izbirnik, pot) {
  const r = await b.izvedi(`(() => { const el = document.querySelector(${JSON.stringify(izbirnik)}); el.scrollIntoView({ block: 'center' });
    const q = el.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, width: q.width, height: q.height }; })()`);
  const s = await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...r, scale: 2 } });
  fs.mkdirSync(mapa, { recursive: true });
  fs.writeFileSync(pot, Buffer.from(s.data, 'base64'));
}

const preliv = b => b.izvedi('document.documentElement.scrollWidth > document.documentElement.clientWidth');

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(`naloziDanosti(${D}, ''); true`);
  await b.klikni('#solveBtn');
  await b.cakaj('!!lastSolve', 20000);
  // Koraki 31-34: verige iz stanja pred poskusom (korak 31).
  const verige = await b.izvedi(`(() => { const s = lastSolve.log[30];
    const d = Object.create(Board.prototype); d.grid = Array.from(s.snapshotGrid); d.cand = Array.from(s.snapshotCand);
    const k = xyChain(d).slice(0, 4);
    k.forEach((v, j) => { lastSolve.log[30 + j] = { ...v, snapshotGrid: s.snapshotGrid, snapshotCand: s.snapshotCand }; });
    return k.map(v => v.cells); })()`);
  preveri('štiri verige v stanju pred korakom 31, prva V5S4 – V6S6 – V9S6 – V8S5 – V8S3',
    verige.length === 4 && JSON.stringify(verige[0]) === JSON.stringify(PREIZKUSNA), verige);
  await b.klikni('#openStepsBtn');
  for (let j = 0; j < verige.length; j++) {
    const li = `#steps > li:nth-child(${31 + j})`;
    await b.klikni(`${li} .mini-toggle`);
    const m = await b.izvedi(`(${MERI})(${JSON.stringify(li + ' .mini-grid')}, '.mcand-veriga', '.mcell')`);
    pregledOznak(`korak ${31 + j} (${verige[j].length} celic)`, m, verige[j]);
    const legenda = await b.izvedi(`[...document.querySelectorAll(${JSON.stringify(li + ' .mini-legend > span')})].map(s => s.textContent)`);
    preveri(`korak ${31 + j}: legenda »celice verige (po vrsti)«`, legenda[0] === '1celice verige (po vrsti)' && !legenda.some(t => t.endsWith('celice vzorca')), legenda);
    if (j === 0) await posnetekElementa(b, `${li} .mini-container`, path.join(mapa, `resevalec-mala-${sirina}.png`));
  }
  preveri('brez vodoravnega preliva', !(await preliv(b)));
  // Povečava koraka 31.
  await b.klikni('#steps > li:nth-child(31) .mini-grid');
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  const m = await b.izvedi(`(${MERI})('#lightboxInner', '.mcand-veriga', '.mcell')`);
  pregledOznak('povečava koraka 31', m, verige[0]);
  const drsnik = await b.izvedi(`(() => { const s = document.getElementById('lightboxScroll'); return s.scrollWidth > s.clientWidth; })()`);
  preveri('povečava brez vodoravnega drsnika', !drsnik);
  await b.posnetek(path.join(mapa, `resevalec-povecava-${sirina}.png`), { vsaStran: false });
  await b.klikni('#lightboxClose');
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  // Koraki 1-30 dnevnika solve() kot poteze, nato »Naslednji korak« z verigo, če je v stanju.
  const enako = await b.izvedi(`(() => { dodajVZbirko(${D}, '', 'rocno'); zacniIgro(${D});
    const log = solve(${D}).log;
    for (const s of log.slice(0, 30)) {
      for (const [celica, stevka] of s.assign) { dodajPotezo(igra, { tip: 'vpis', celica, stevka }, stanje); stanje = stanjeIgre(igra); }
      for (const [celica, stevka] of s.eliminate) { if (dodajPotezo(igra, { tip: 'kandidat', celica, stevka, odstrani: true }, stanje)) stanje = stanjeIgre(igra); }
    }
    osvezi();
    const prej = nextStep;
    nextStep = (d, ...ost) => { const v = xyChain(d); return v.length ? v[0] : prej(d, ...ost); };
    // Posnetek ima v polni celici bit njene števke, stanje igre 0 - primerjajo se prazne celice.
    return stanje.grid.every((v, i) => v === log[30].snapshotGrid[i] && (v || stanje.kandidati[i] === log[30].snapshotCand[i])); })()`);
  preveri('stanje igre po 30 korakih = stanje pred korakom 31', enako);
  for (let i = 0; i < 3; i++) await b.klikni('#korakBtn');
  const p = await b.izvedi('pomoc && { stopnja: pomoc.stopnja, tehnika: pomoc.korak.technique, veriga: pomoc.korak.veriga }');
  preveri('»Naslednji korak« na tretji stopnji, korak XY-Chain z verigo', p && p.stopnja === 3 && p.tehnika === 'XY-Chain' && p.veriga, p);
  const m = await b.izvedi(`(${MERI})('#mreza', '.kand.k-veriga', '.celica')`);
  pregledOznak('tretja stopnja »Naslednjega koraka«', m, PREIZKUSNA);
  preveri('celice verige jantarne (k-vzorec)', await b.izvedi(`${JSON.stringify(PREIZKUSNA)}.every(c => document.querySelectorAll('#mreza .celica')[c].classList.contains('k-vzorec'))`));
  preveri('brez vodoravnega preliva', !(await preliv(b)));
  await posnetekElementa(b, '#mreza', path.join(mapa, `igra-${sirina}.png`));
}

async function trening(b, sirina) {
  console.log(`Trening »Spoznaj« (mreža 9 × 9), ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi(`{ const g = MODES['xy-wing'].gen; MODES['xy-wing'].gen = n => (window.zadnjaVaja = { ...g(n), solutionVeriga: true }); }
    zacniKrog('xy-wing', 'spoznaj'); document.body.style.paddingBottom = '800px'; true`);
  // Pravi pritisk miške na »Rešitev (drži)«.
  const t = await b.izvedi(`(() => { const g = [...document.querySelectorAll('.peek-btn')].find(x => x.textContent === 'Rešitev (drži)');
    g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  try {
    await new Promise(r => setTimeout(r, 300));
    const m = await b.izvedi(`(${MERI})('.g9', '.cd.veriga-st', '.gc')`);
    pregledOznak('»Rešitev (drži)«', m, await b.izvedi('zadnjaVaja.solutionCells'));
    const legenda = await b.izvedi(`[...document.querySelectorAll('.legenda-vaje > span')].map(s => s.textContent)`);
    preveri('legenda »celice verige (po vrsti)«', legenda[0] === '1celice verige (po vrsti)', legenda);
    preveri('brez vodoravnega preliva', !(await preliv(b)));
  } finally {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  }
  await new Promise(r => setTimeout(r, 200));
  preveri('po spustu ni številk', (await b.izvedi(`document.querySelectorAll('.g9 .veriga-st').length`)) === 0);
}

(async () => {
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      await resevalec(b, sirina);
      await igra(b, sirina);
      await trening(b, sirina);
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
