'use strict';
// UI zbirke v reševalcu (app/zbirka.js) v nadomestnem DOM-u (dom-stub.js): gumba
// "Odpri" (prej "Naloži") in "Izbriši" pri uganki v seznamu. Oba sta nekoč v
// besedilu uporabljala spremenljivko, ki ne obstaja, zato je klik vrgel
// ReferenceError in ni naredil nič. Kartica uganke je skupna z igro
// (shared/zbirka-ui.js): stanje je iz istega vira kot v igri (zbirkaStanjeUganke) -
// iz shranjene igre, kadar obstaja, sicer iz zapisa v zbirki. Vgrajeni primer,
// rešen v reševalcu, dobi izvor "primer" in težavnost iz PRIMERI.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'app/app.js', 'app/zbirka.js'];
const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');

// Reševalec z eno uganko v zbirki (dodana 21. 9. 2026 ob 16:33). `vprasanja` zbere
// besedila confirm(), `odgovor` pove, kaj confirm() vrne.
function zacni(odgovor = true) {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '' },
  ]));
  const vprasanja = [];
  dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  return { dom, run, vprasanja };
}

// Del kartice (edine) uganke v seznamu po razredu (glej shared/zbirka-ui.js).
const delKartice = (dom, razred) => dom.el('libList').children[0].children.find(el => el.className === razred);

// Gumb z danim napisom pri (edini) uganki v seznamu.
function gumb(dom, napis) {
  const vrstica = delKartice(dom, 'zb-gumbi');
  const b = vrstica.children.find(el => el.textContent === napis);
  assert.ok(b, `gumb »${napis}« obstaja`);
  return b;
}

test('reševalec: »Odpri« vpiše danosti v mrežo in zapre okno', () => {
  const { dom, run } = zacni();
  gumb(dom, 'Odpri').sprozi('click');
  assert.equal(run('currentGivens()'), danosti);
  assert.equal(dom.el('status').textContent, 'Naložena uganka iz zbirke (Težka, dodana 21. 9. 2026 ob 16:33).');
  assert.equal(dom.el('library').style.display, 'none');
});

test('reševalec: »Izbriši« vpraša z datumom in po potrditvi uganko izbriše', () => {
  const { dom, run, vprasanja } = zacni(true);
  gumb(dom, 'Izbriši').sprozi('click');
  assert.deepEqual(vprasanja, ['Izbrišem uganko, dodano 21. 9. 2026 ob 16:33 (Težka)?']);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(dom.el('libStatus').textContent, 'Uganka je izbrisana.');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
});

test('reševalec: »Izbriši« brez potrditve uganko pusti v zbirki', () => {
  const { dom, run, vprasanja } = zacni(false);
  gumb(dom, 'Izbriši').sprozi('click');
  assert.equal(vprasanja.length, 1);
  assert.equal(run('zbirkaBeri().length'), 1);
});

/* ---------- stanje uganke: isti vir kot v igri ---------- */

const praznih = [...danosti].filter(ch => ch === '0').length;
const resitev = (() => { const { run } = loadContext(['shared/engine.js'], {}); return run(`solutionOf(${JSON.stringify(danosti)})`); })();
const prazne = [...danosti].map((ch, c) => (ch === '0' ? c : -1)).filter(c => c >= 0);
const vpisi = n => prazne.slice(0, n).map(c => ({ tip: 'vpis', celica: c, stevka: resitev[c] }));

// Reševalec z uganko, ki je v zbirki zapisana kot rešena, in (neobvezno) shranjeno igro.
function zStanjem(zapis, poteze) {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '', ...zapis },
  ]));
  if (poteze) {
    dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: danosti,
      igre: { [danosti]: { poteze, kazalec: poteze.length, zacetek: '2026-09-22 10:00', nazadnje: '2026-09-22 10:00' } } }));
  }
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  return delKartice(dom, 'zb-casi').textContent;
}

test('reševalec: stanje "v teku (12/57)" iz zapisa, kadar shranjene igre ni', () => {
  assert.equal(zStanjem({ igrano: '2026-09-22 10:05', izpolnjeno: 81 - praznih + 12, napaka: false }),
    `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (12/${praznih})`);
  assert.equal(zStanjem({}), 'nova', 'nova uganka ima v 2. vrstici "nova"');
});

test('reševalec: shranjena igra ima prednost - "rešena … · znova v teku"', () => {
  const resena = { igrano: '2026-09-21 17:48', izpolnjeno: 81, napaka: false };
  assert.equal(zStanjem(resena), 'rešena 21. 9. 2026 ob 17:48');
  // Po "Začni znova" v igri: zapis je zamrznjen, igra pa je spet v teku.
  assert.equal(zStanjem(resena, vpisi(3)), `rešena 21. 9. 2026 ob 17:48 · znova v teku (3/${praznih})`);
  // Nerešena uganka: napredek iz igre, čas iz zapisa.
  assert.equal(zStanjem({ igrano: '2026-09-22 10:05', izpolnjeno: 81 - praznih + 12 }, vpisi(5)),
    `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (5/${praznih})`);
});

/* ---------- kartica uganke (skupna z igro) ---------- */

test('reševalec: vrstice kartice - naslov, stanje, danih · tehnike · koraki · program', () => {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: 'moja opomba',
      reseno: 81 - praznih + 36, koraki: 42, ugibanje: 0, tehnike: [], nazadnje: '2026-09-21 16:33' },
  ]));
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  assert.equal(delKartice(dom, 'zb-vrstica').textContent, 'Težka · ročni vnos · dodana 21. 9. 2026 ob 16:33');
  assert.equal(delKartice(dom, 'zb-casi').textContent, 'nova');
  assert.equal(delKartice(dom, 'zb-info').textContent,
    `danih ${81 - praznih} · tehnike: samo enojčki · 42 korakov · program rešil delno (36/${praznih})`);
  assert.equal(delKartice(dom, 'zb-opomba').textContent, 'moja opomba');
  // Namig miške: časi v isti obliki kot v seznamu, program z istim števcem.
  const namig = delKartice(dom, 'zb-vrstica').title;
  assert.ok(namig.includes('Dodano: 21. 9. 2026 ob 16:33'), namig);
  assert.ok(namig.includes(`Program rešil: delno (36/${praznih})`), namig);
});

test('reševalec: uganka v vnosni mreži je označena kot trenutno odprta', () => {
  const { dom, run } = zacni();
  const li = () => dom.el('libList').children[0];
  assert.equal(li().className, '', 'mreža je prazna - nobena ni odprta');
  gumb(dom, 'Odpri').sprozi('click');
  run('zbirkaOdpri()');
  assert.equal(li().className, 'trenutna');
  const znacka = li().children[0].children.find(el => el.className === 'zb-trenutna');
  assert.equal(znacka && znacka.textContent, 'trenutno odprta');
});

test('reševalec: rešen vgrajeni primer dobi izvor "primer" in težavnost primera', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const primer = run('PRIMERI[4]');
  const g = JSON.stringify(primer.danosti.replace(/\./g, '0'));
  run(`(() => { const { board, log } = solve(${g}); zbirkaPoResevanju(${g}, board, log, 1); })()`);
  const z = run('zbirkaBeri()[0]');
  assert.equal(z.izvor, 'primer');
  assert.equal(z.tezavnost, primer.tezavnost);
  assert.equal(dom.el('saveMsg').textContent, '✓ Shranjeno v zbirko');
  // V seznamu reševalca je (lahko ga izbrišeš) - z imenom primera v 1. vrstici.
  run('zbirkaOdpri()');
  assert.equal(dom.el('libList').children.length, 1);
  assert.ok(delKartice(dom, 'zb-vrstica').textContent.startsWith(`${primer.ime} · dodana `));
  // Navadna uganka ostane ročni vnos.
  const d = JSON.stringify(danosti);
  run(`(() => { const { board, log } = solve(${d}); zbirkaPoResevanju(${d}, board, log, 1); })()`);
  assert.equal(run(`zbirkaBeri().find(z => z.danosti === ${d}).izvor`), 'rocno');
});
