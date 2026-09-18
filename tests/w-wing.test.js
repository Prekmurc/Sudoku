'use strict';
// Testi tehnike W-Wing (shared/engine.js wWing; v aplikaciji Oakever "Krilo W").
// Zagon iz korena projekta: node --test "tests/*.test.js"
//
// Kot pri Turbot Fish testne pozicije niso sestavljene na pamet: so posnetki stanja
// kandidatov (polji snapshotGrid/snapshotCand v dnevniku solve()) med reševanjem ugank
// iz docs/uganke.md, poiskani s skripto. Pri vsaki je naveden vir (uganka in indeks
// koraka v dnevniku).
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

// hard-17-a, stanje pred korakom 45 (korak, ki ga solve() dejansko naredi z W-Wing).
const WWING_POS = `
[27] 3 8 [67] 1 5 [29] 4 [69]
[47] 9 [15] [467] 8 2 [57] [13] [36]
[247] 6 [15] [47] 9 3 [28] [18] [57]
5 4 2 1 [6] 9 3 7 8
6 8 7 2 [35] 4 1 9 [5]
9 1 [3] 8 [35] 7 4 [56] 2
3 5 4 9 7 8 6 2 1
8 [27] [69] [35] [246] 1 [579] [35] [34579]
1 [27] [69] [35] [246] [6] [5789] [358] [34579]`;

// oakever-ekstrem-lv4, stanje pred korakom 50 (prav tako korak W-Wing v solve()).
// Isti par celic nastopa v obeh vlogah števk: enkrat je povezovalna 3 in izbrisana 4,
// enkrat obratno.
const OBE_VLOGI_POS = `
8 5 [34] [349] 2 1 7 6 [39]
2 [34] 7 6 [349] 8 5 [49] 1
6 [19] [19] 7 [34] 5 [34] 2 8
1 7 2 8 [349] [34] 6 [49] 5
3 8 [49] 5 6 [49] 2 1 7
5 [49] 6 1 7 2 [34] 8 [39]
[49] 2 5 [349] 1 [349] 8 7 6
[49] 6 8 [49] 5 7 1 3 2
7 [13] [13] 2 8 6 9 5 4`;

// oakever-ekstrem-17-a, stanje pred korakom 36.
const POVEZAVA_JE_TARCA_POS = `
8 1 5 7 [234] [234] [34] 6 9
[46] [3467] [3467] 1 5 9 [34] 2 8
[46] 9 2 8 [346] [346] 7 1 5
7 [68] 1 4 [28] 5 9 3 [26]
2 [34] 9 6 [37] 1 8 5 [47]
5 [3468] [3468] 9 [2378] [237] 1 [47] [26]
1 [467] [467] 2 9 8 5 [47] 3
3 [24678] [4678] 5 1 [467] [26] 9 [467]
9 5 [467] 3 [467] [467] [26] 8 1`;

// oakever-ekstrem-17-a, stanje pred korakom 51 - mesto, kjer reševalec ugiba
// (tryBifurcation). Tu W-Wing ne najde ničesar.
const NO_PATTERN_POS = `
8 1 5 7 [24] [24] 3 6 9
6 [37] [37] 1 5 9 4 2 8
4 9 2 8 [36] [36] 7 1 5
7 [68] 1 4 [28] 5 9 3 [26]
2 [34] 9 6 [37] 1 8 5 [47]
5 [48] [36] 9 [78] [23] 1 [47] [26]
1 [67] [467] 2 9 8 5 [47] 3
3 2 8 5 1 [47] 6 9 [47]
9 5 [47] 3 [46] [467] 2 8 1`;

test('W-Wing: par {4,7} z močno povezavo na 7', () => {
  const steps = E.wWing(boardFromText(E, WWING_POS));
  // Isti par in ista izbrisa, najdena prek dveh različnih močnih povezav na 7
  // (vrstica 1 in blok 3) - kot pri Turbot Fish korakov ne združujemo.
  assert.deepEqual(Array.from(steps, describe), [
    { cells: ['V2S1', 'V3S4', 'V1S1', 'V1S4'], eliminate: ['V2S4≠4', 'V3S1≠4'] },
    { cells: ['V2S1', 'V3S4', 'V2S7', 'V3S9'], eliminate: ['V2S4≠4', 'V3S1≠4'] },
  ]);
  assert.equal(steps[0].technique, 'W-Wing');
  assert.equal(steps[0].message,
    'Celici V2S1, V3S4 imata natanko kandidata 4,7 in se ne vidita. V vrstici 1 je kandidat 7 mogoč ' +
    'samo v celicah V1S1, V1S4, pri čemer V1S1 vidi V2S1, V1S4 pa V3S4 -> tvori W-Wing in vsaj ena ' +
    'od celic V2S1, V3S4 je enaka 4. 4 lahko izbrišemo iz celic, ki vidijo obe: V2S4, V3S1.');
});

test('W-Wing: obe vlogi števk istega para in povezava v vrstici, stolpcu ali bloku', () => {
  const steps = E.wWing(boardFromText(E, OBE_VLOGI_POS));
  assert.deepEqual(Array.from(steps, describe), [
    { cells: ['V1S3', 'V3S5', 'V2S2', 'V2S5'], eliminate: ['V1S4≠4'] },
    { cells: ['V1S3', 'V3S5', 'V1S9', 'V3S7'], eliminate: ['V1S4≠4'] },
    { cells: ['V2S2', 'V3S5', 'V1S3', 'V1S4'], eliminate: ['V2S5≠3'] },
    { cells: ['V2S2', 'V3S5', 'V2S8', 'V3S7'], eliminate: ['V2S5≠3'] },
    { cells: ['V2S8', 'V6S2', 'V1S9', 'V6S9'], eliminate: ['V2S2≠4'] },
    { cells: ['V2S8', 'V6S2', 'V4S8', 'V6S9'], eliminate: ['V2S2≠4'] },
  ]);
  // Par {3,4} V2S2/V3S5: povezovalna števka je 4, izbrisana 3 - obratno kot pri
  // prvem paru v istem položaju.
  assert.equal(steps[2].message,
    'Celici V2S2, V3S5 imata natanko kandidata 3,4 in se ne vidita. V vrstici 1 je kandidat 4 mogoč ' +
    'samo v celicah V1S3, V1S4, pri čemer V1S3 vidi V2S2, V1S4 pa V3S5 -> tvori W-Wing in vsaj ena ' +
    'od celic V2S2, V3S5 je enaka 3. 3 lahko izbrišemo iz celic, ki vidijo obe: V2S5.');
  // Povezava v stolpcu 9.
  assert.equal(steps[4].message,
    'Celici V2S8, V6S2 imata natanko kandidata 4,9 in se ne vidita. V stolpcu 9 je kandidat 9 mogoč ' +
    'samo v celicah V1S9, V6S9, pri čemer V1S9 vidi V2S8, V6S9 pa V6S2 -> tvori W-Wing in vsaj ena ' +
    'od celic V2S8, V6S2 je enaka 4. 4 lahko izbrišemo iz celic, ki vidijo obe: V2S2.');
});

test('W-Wing: celica močne povezave je lahko tudi tarča izbrisa', () => {
  const steps = E.wWing(boardFromText(E, POVEZAVA_JE_TARCA_POS));
  assert.deepEqual(Array.from(steps, describe), [
    { cells: ['V2S7', 'V5S2', 'V2S3', 'V6S3'], eliminate: ['V2S2≠4'] },
    { cells: ['V2S7', 'V5S2', 'V2S3', 'V2S2'], eliminate: ['V2S2≠4'] },
  ]);
  // V drugem vzorcu je V2S2 hkrati celica močne povezave (na 3) in tarča izbrisa (4).
  // To je veljavno: sklep "vsaj ena od celic para je 4" velja za vsako celico, ki vidi
  // obe celici para, izbris 4 pa ne poseže v kandidata 3, na katerem stoji povezava.
  assert.ok(steps[1].cells.includes(steps[1].eliminate[0][0]));
});

test('brez vzorca', () => {
  assert.deepEqual(plain(E.wWing(boardFromText(E, NO_PATTERN_POS))), []);
});

test('W-Wing je v ALL_TECHNIQUES takoj za Swordfish', () => {
  const names = E.ALL_TECHNIQUES.map(([n]) => n);
  assert.equal(names[names.indexOf('Swordfish') + 1], 'W-Wing');
});

for (const { ime, danosti } of loadPuzzles()) {
  test(`uganka ${ime}: noben W-Wing vzorec ne izbriše pravilne številke`, () => {
    const { board, log } = E.solve(danosti);
    assert.ok(board.isSolved() && board.isValid());
    // Uganka ima natanko eno rešitev, zato je rešena mreža ravno ta rešitev.
    const sol = board.grid;
    for (const step of log) {
      // Vsi vzorci W-Wing, ki jih motor najde v tem stanju (ne le uporabljeni).
      const b = Object.create(E.Board.prototype);
      b.grid = step.snapshotGrid.slice(); b.cand = step.snapshotCand.slice();
      for (const w of E.wWing(b)) {
        for (const [c, d] of w.eliminate) assert.notEqual(sol[c], d, w.message);
      }
    }
  });
}
