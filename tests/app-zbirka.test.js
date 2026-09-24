'use strict';
// UI zbirke v reševalcu (app/zbirka.js) v nadomestnem DOM-u (dom-stub.js): gumba
// "Odpri" (prej "Naloži") in "Izbriši" pri uganki v seznamu. Oba sta nekoč v
// besedilu uporabljala spremenljivko, ki ne obstaja, zato je klik vrgel
// ReferenceError in ni naredil nič. Kartica uganke je skupna z igro
// (shared/zbirka-ui.js): stanje je iz istega vira kot v igri (zbirkaStanjeUganke) -
// iz shranjene igre, kadar obstaja, sicer iz zapisa v zbirki. Vgrajeni primer,
// rešen v reševalcu, se v zbirko ne shrani. "Izbriši" in "Izbriši vse" pobrišeta
// tudi shranjene igre (igre primerov ostanejo).
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
  assert.deepEqual(vprasanja, ['Izbrišem uganko, dodano 21. 9. 2026 ob 16:33 (Težka)? Izbriše se tudi njen shranjeni napredek.']);
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

test('reševalec: rešen vgrajeni primer se v zbirko ne shrani', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const primer = run('PRIMERI[4]');
  const g = JSON.stringify(primer.danosti.replace(/\./g, '0'));
  run(`(() => { const { board, log } = solve(${g}); zbirkaPoResevanju(${g}, board, log, 1); })()`);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(dom.el('saveMsg').textContent, 'Vgrajeni primer – v zbirko se ne shrani.');
  assert.equal(dom.el('saveFields').style.display, 'none', 'težavnosti in opombe ni mogoče nastaviti');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
  // Navadna uganka se shrani kot ročni vnos.
  const d = JSON.stringify(danosti);
  run(`(() => { const { board, log } = solve(${d}); zbirkaPoResevanju(${d}, board, log, 1); })()`);
  assert.equal(run(`zbirkaBeri().find(z => z.danosti === ${d}).izvor`), 'rocno');
  assert.equal(dom.el('saveMsg').textContent, '✓ Shranjeno v zbirko');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (1)');
});

test('reševalec: »Izbriši« pobriše tudi shranjeno igro uganke', () => {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([{ danosti, tezavnost: 'Težka', dodano: '2026-09-21 16:33' }]));
  dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: danosti, igre: { [danosti]: { poteze: [], kazalec: 0 } } }));
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  gumb(dom, 'Izbriši').sprozi('click');
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], []);
});

test('reševalec: »Izbriši vse« s potrditvijo (število, priporočilo izvoza), ostanejo samo igre primerov', () => {
  const primer = '8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4'.replace(/\./g, '0');
  // Sirota: igra uganke, ki je v zbirki ni več (izbrisana pred novim modelom).
  const sirota = loadPuzzles()[4].danosti.replace(/\./g, '0');
  const pripravi = (odgovor) => {
    const dom = makeDom();
    dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
      { danosti, tezavnost: 'Težka', dodano: '2026-09-21 16:33' },
      { danosti: loadPuzzles()[3].danosti.replace(/\./g, '0'), tezavnost: 'Lahka', dodano: '2026-09-22 10:00' },
    ]));
    dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: primer,
      igre: { [danosti]: { poteze: [], kazalec: 0 }, [sirota]: { poteze: [], kazalec: 0 }, [primer]: { poteze: [], kazalec: 0 } } }));
    const vprasanja = [];
    dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
    const { run } = loadContext(DATOTEKE, dom.globals);
    run('zbirkaOdpri()');
    dom.klikni('libDeleteAll');
    return { dom, run, vprasanja };
  };

  const preklic = pripravi(false);
  assert.equal(preklic.vprasanja.length, 1);
  assert.match(preklic.vprasanja[0], /\(2\)/, 'navede število ugank');
  assert.match(preklic.vprasanja[0], /izvoziš/, 'priporoči izvoz');
  assert.equal(preklic.run('zbirkaBeri().length'), 2, 'brez potrditve se nič ne izbriše');
  assert.equal(preklic.run('Object.keys(igreBeri().igre).length'), 3);

  const { dom, run } = pripravi(true);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], [primer], 'ostane samo igra primera - tudi sirota je izbrisana');
  assert.equal(dom.el('libStatus').textContent, 'Izbrisanih ugank: 2. Izbrisan je tudi napredek izbrisanih ugank: 1.');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
  assert.equal(dom.el('libList').children[0].className, 'prazno');
});

test('reševalec: »Izbriši vse« pri prazni zbirki počisti sirote, šele nato je »Zbirka je že prazna.«', () => {
  const primer = '8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4'.replace(/\./g, '0');
  const sirote = [0, 3, 4].map(i => loadPuzzles()[i].danosti.replace(/\./g, '0'));
  const dom = makeDom();
  // Zbirka izbrisana s staro različico, igre so ostale.
  dom.shramba.set('sudoku.zbirka.v1', '[]');
  const igre = { [primer]: { poteze: [], kazalec: 0 } };
  for (const d of sirote) igre[d] = { poteze: [], kazalec: 0 };
  dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: sirote[0], igre }));
  const vprasanja = [];
  let odgovor = false;
  dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');

  dom.klikni('libDeleteAll');
  assert.equal(vprasanja.length, 1, 'vpraša, čeprav je zbirka prazna');
  assert.match(vprasanja[0], /napredek izbrisanih ugank \(3\)/);
  assert.equal(run('Object.keys(igreBeri().igre).length'), 4, 'brez potrditve se nič ne izbriše');

  odgovor = true;
  dom.klikni('libDeleteAll');
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], [primer], 'ostane samo igra primera');
  assert.equal(dom.el('libStatus').textContent, 'Izbrisan napredek izbrisanih ugank: 3.');

  // Zdaj ni ne ugank ne sirot.
  dom.klikni('libDeleteAll');
  assert.equal(vprasanja.length, 2, 'ne vpraša več');
  assert.equal(dom.el('libStatus').textContent, 'Zbirka je že prazna.');
});
