'use strict';
// Testi tehnike XY-Wing (shared/engine.js xyWing).
// Zagon iz korena projekta: node --test "tests/*.test.js"
//
// Zakaj lasten test: od uvedbe W-Wing (2026-09-18) `solve()` pri nobeni uganki iz
// docs/uganke.md ne izvede koraka XY-Wing - vsakič prej najde korak kake cenejše
// tehnike - zato tehnika prek dnevnika reševanja ni več pokrita. Vzorci v teh ugankah
// so kljub temu prisotni, zato jih testiramo neposredno.
//
// Kot pri Turbot Fish in W-Wing testne pozicije niso sestavljene na pamet: so posnetki
// stanja kandidatov (polji snapshotGrid/snapshotCand v dnevniku solve()) med reševanjem
// ugank iz docs/uganke.md. Pri vsaki je naveden vir (uganka in indeks koraka).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles, boardFromText } = require('./load-engine.js');

const E = loadEngine();
// Polja iz vm konteksta imajo drug prototip Array kot polja tu, zato jih deepStrictEqual
// ne šteje za enaka - pred primerjavo jih pretvorimo v navadne vrednosti.
const plain = x => JSON.parse(JSON.stringify(x));
const describe = step => plain({
  cells: step.cells.map(E.cellLabel),
  eliminate: step.eliminate.map(([c, d]) => `${E.cellLabel(c)}≠${d}`),
});

// oakever-ekstrem-lv4, stanje pred korakom 42.
const XYWING_POS = `
8 5 [349] [349] 2 1 7 6 [39]
2 [34] 7 6 [349] 8 5 [49] 1
6 [1349] [1349] 7 [349] 5 [34] 2 8
1 7 2 8 [349] [349] 6 [49] 5
[34] 8 [349] 5 6 [349] 2 1 7
5 [349] 6 1 7 2 [34] 8 [39]
[349] 2 5 [349] 1 [349] 8 7 6
[49] 6 8 [49] 5 7 1 3 2
7 [13] [13] 2 8 6 9 5 4`;

// example-app, stanje pred korakom 50 - mesto, kjer reševalec ugiba (tryBifurcation).
// Tu XY-Wing ne najde ničesar.
const NO_PATTERN_POS = `
4 6 3 8 9 [17] [17] 2 5
9 1 [28] 5 [34] [237] 6 [37] [48]
7 5 [28] 6 [134] [123] [138] 9 [148]
6 2 4 3 [18] [18] 9 5 7
8 9 1 7 2 5 4 6 3
5 3 7 9 6 4 [12] 8 [12]
[13] 4 9 [12] 5 6 [2378] [37] [28]
[13] 8 5 [12] 7 9 [23] 4 6
2 7 6 4 [38] [38] 5 1 9`;

test('XY-Wing: pivot in krili v različnih enotah', () => {
  const steps = E.xyWing(boardFromText(E, XYWING_POS));
  // Vsak vzorec se pojavi dvakrat, ker motor krili preizkusi v obeh vrstnih redih;
  // koraka sta enakovredna (isti pivot, isti krili, isti izbris).
  assert.deepEqual(Array.from(steps, describe), [
    { cells: ['V2S8', 'V2S2', 'V1S9'], eliminate: ['V1S3≠3'] },
    { cells: ['V2S8', 'V1S9', 'V2S2'], eliminate: ['V1S3≠3'] },
    { cells: ['V4S8', 'V6S7', 'V6S9'], eliminate: ['V6S2≠3'] },
    { cells: ['V4S8', 'V6S9', 'V6S7'], eliminate: ['V6S2≠3'] },
  ]);
  assert.equal(steps[0].technique, 'XY-Wing');
  // Pivot V2S8 {4,9}: krilo V2S2 {3,4} ga vidi v vrstici 2, krilo V1S9 {3,9} v bloku 3;
  // skupni kandidat kril je 3, celica V1S3 vidi obe krili.
  assert.equal(steps[0].message,
    'Pivot V2S8 {4,9} ima dve krili: V2S2 in V1S9, ki obe delita kandidata 3 -> 3 lahko ' +
    'izbrišemo iz celic, ki vidijo obe krili (V1S3).');
  assert.equal(steps[2].message,
    'Pivot V4S8 {4,9} ima dve krili: V6S7 in V6S9, ki obe delita kandidata 3 -> 3 lahko ' +
    'izbrišemo iz celic, ki vidijo obe krili (V6S2).');
});

test('brez vzorca', () => {
  assert.deepEqual(plain(E.xyWing(boardFromText(E, NO_PATTERN_POS))), []);
});

test('XY-Wing je v ALL_TECHNIQUES takoj za W-Wing', () => {
  const names = E.ALL_TECHNIQUES.map(([n]) => n);
  assert.equal(names[names.indexOf('W-Wing') + 1], 'XY-Wing');
});

for (const { ime, danosti } of loadPuzzles()) {
  test(`uganka ${ime}: noben XY-Wing vzorec ne izbriše pravilne številke`, () => {
    const { board, log } = E.solve(danosti);
    assert.ok(board.isSolved() && board.isValid());
    // Uganka ima natanko eno rešitev, zato je rešena mreža ravno ta rešitev.
    const sol = board.grid;
    for (const step of log) {
      // Vsi vzorci XY-Wing, ki jih motor najde v tem stanju (ne le uporabljeni).
      const b = Object.create(E.Board.prototype);
      b.grid = step.snapshotGrid.slice(); b.cand = step.snapshotCand.slice();
      for (const w of E.xyWing(b)) {
        for (const [c, d] of w.eliminate) assert.notEqual(sol[c], d, w.message);
      }
    }
  });
}
