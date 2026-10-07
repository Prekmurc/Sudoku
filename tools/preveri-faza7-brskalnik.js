'use strict';
// Faza 7 v pravem brskalniku (docs/faza7-nacrt.md). Scenarij raste po korakih:
//   korak 2 (6.6, dopolnitev D1) - sporočila o številu rešitev v igri: vrstica ocene v
//     seznamu zbirke po »Oceni zbirko« (najdaljša: »· enoličnosti ni bilo mogoče preveriti
//     v razumnem času«) in sporočilo »Začni igro« v oknu »Nova uganka« pri 320 in 375 px -
//     besedilo se prelomi v svoji kartici, stran in okno nimata vodoravnega preliva.
// Uganke brez rešitve in z več rešitvami izpelje program (countSolutions()) iz uganke v
// docs/uganke.md; 'unknown' da nadomestni countSolutions v strani. Ocena teče v glavni
// niti (Worker v strani onemogočen - nadomestna pot igre za file://), ker delavec
// nadomestnega countSolutions ne vidi. Gumbi s pravim klikom.
//
//   node tools/preveri-faza7-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadContext, loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-faza7');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Uganke s 0 in 2 rešitvama ter uganka za 'unknown' (kot v tests/igra-ui.test.js).
function uganke() {
  const { run } = loadContext(['shared/engine.js']);
  const vse = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'));
  const danosti = vse[0];
  const st = d => run(`countSolutions(${JSON.stringify(d)})`);
  let vec = danosti;
  for (let i = 0; i < 81 && st(vec) === 1; i++) if (vec[i] !== '0') vec = vec.slice(0, i) + '0' + vec.slice(i + 1);
  const resitev = run(`solutionOf(${JSON.stringify(danosti)})`);
  const b = run(`new Board(${JSON.stringify(danosti)})`);
  const c = [...danosti].findIndex((ch, i) => ch === '0' && (b.cand[i] & ~(1 << Number(resitev[i])) & 0x3fe));
  const dd = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => x !== Number(resitev[c]) && (b.cand[c] & (1 << x)));
  const brez = danosti.slice(0, c) + dd + danosti.slice(c + 1);
  const neznana = vse.slice(1).find(d => st(d) === 1);
  if (st(brez) !== 0 || st(vec) !== 2) throw new Error('uganki brez rešitve in z več rešitvami nista taki');
  return { 0: brez, 2: vec, unknown: neznana };
}
const U = uganke();
const OCENA = {
  0: 'ocena: Težka → Brez rešitve · nima rešitve',
  2: 'ocena: Težka → Več rešitev · ima več kot eno rešitev',
  unknown: 'ocena: brez sprememb · enoličnosti ni bilo mogoče preveriti v razumnem času',
};

const NADOMESTNI = `(() => { const prava = countSolutions;
  countSolutions = (g, ...r) => g === ${JSON.stringify(U.unknown)} ? 'unknown' : prava(g, ...r);
  window.Worker = function () { throw new Error('brez delavca'); }; })()`;

// Element je v svojem vsebniku, stran in vsebnik brez vodoravnega preliva.
const meritev = (izbirnik, vsebnik) => `(() => {
  const el = document.querySelector(${JSON.stringify(izbirnik)});
  const v = el.closest(${JSON.stringify(vsebnik)});
  const r = el.getBoundingClientRect(), k = v.getBoundingClientRect();
  const panel = el.closest('.dialog-panel');
  const vrstica = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.2;
  return {
    vVsebniku: r.left >= k.left - 0.5 && r.right <= k.right + 0.5,
    elPreliv: el.scrollWidth - el.clientWidth,
    vrstic: Math.round(r.height / vrstica),
    stran: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panel: panel ? panel.scrollWidth - panel.clientWidth : 0,
    okno: innerWidth,
  };
})()`;

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px – vrstica ocene (D1)`);
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: true });
  await b.izvedi('localStorage.clear()');
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: true });
  await b.izvedi(NADOMESTNI);
  const md = Object.values(U).map(d => [`- **Danosti:** \`${d.replace(/0/g, '.')}\``,
    '- **Težavnost:** Težka', '- **Dodano:** 2026-09-20 10:00'].join('\n')).join('\n\n');
  const p = await b.izvedi(`zbirkaUvozi(${JSON.stringify(md)})`);
  preveri('uvoz treh ugank', !p.napaka && (await b.izvedi('zbirkaBeri().length')) === 3, p);
  await b.klikni('#zbirkaBtn');
  await b.klikni('#oceniBtn');
  await b.cakaj('!ocenjevanje && document.querySelectorAll(".zb-ocena").length === 3', 20000);
  for (const [primer, d] of Object.entries(U)) {
    const id = `ocena-${primer}`;
    const besedilo = await b.izvedi(`(() => { const li = zbirkaVrstice.get(${JSON.stringify(d)});
      const el = li.querySelector('.zb-ocena'); el.id = '${id}'; return el.textContent; })()`);
    preveri(`besedilo vrstice ocene (${primer})`, besedilo === OCENA[primer], besedilo);
    const m = await b.izvedi(meritev(`#${id}`, 'li'));
    preveri(`vrstica ocene v kartici uganke, brez preliva (${primer}, ${m.vrstic} ${m.vrstic === 1 ? 'vrstica' : 'vrstice'})`,
      m.vVsebniku && m.elPreliv <= 0 && m.stran <= 0 && m.panel <= 0, m);
    if (primer === 'unknown') preveri('najdaljše besedilo se prelomi', m.vrstic >= 2, m);
  }
  await b.izvedi(`document.getElementById('ocena-unknown').scrollIntoView({ block: 'center' })`);
  await b.posnetek(path.join(mapa, `ocena-${sirina}.png`), { vsaStran: false });
  await b.klikni('#zbirkaDialog [data-zapri]');

  console.log(`Igra, ${sirina} px – »Začni igro«`);
  for (const [primer, d] of Object.entries(U)) {
    await b.klikni('#novaBtn');
    await b.fokus('#novaNiz');
    await b.vtipkaj(d.replace(/0/g, '.'));
    await b.klikni('#novaZacni');
    await b.cakaj(`document.getElementById('novaStatus').textContent.startsWith('Te uganke')`, 10000);
    const s = await b.izvedi(`document.getElementById('novaStatus').textContent`);
    preveri(`sporočilo (${primer})`, s.startsWith('Te uganke ni mogoče igrati: '), s);
    const m = await b.izvedi(meritev('#novaStatus', '.dialog-panel'));
    preveri(`sporočilo v oknu, brez preliva (${primer}, ${m.vrstic} vrstic)`,
      m.vVsebniku && m.elPreliv <= 0 && m.stran <= 0 && m.panel <= 0, m);
    if (primer === 'unknown') {
      await b.izvedi(`document.getElementById('novaStatus').scrollIntoView({ block: 'center' })`);
      await b.posnetek(path.join(mapa, `nova-${sirina}.png`), { vsaStran: false });
    }
    await b.klikni('#novaDialog [data-zapri]');
  }
  preveri('brez napak JS', b.napake.length === 0, b.napake);
}

(async () => {
  require('node:fs').mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    for (const s of [320, 375]) await igra(b, s);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
