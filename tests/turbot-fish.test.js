'use strict';
// Testi tehnike Turbot Fish (shared/engine.js turbotFish) in rešljivosti ugank iz
// docs/uganke.md. Zagon iz korena projekta: node --test tests/
//
// Testne pozicije niso sestavljene na pamet: so posnetki stanja kandidatov (polje
// snapshotCand/snapshotGrid v dnevniku solve()) med reševanjem ugank iz docs/uganke.md,
// poiskani s skripto. Pri vsaki je naveden vir (uganka in indeks koraka v dnevniku).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles, boardFromText } = require('./load-engine.js');

const E = loadEngine();
// Polja iz vm konteksta imajo drug prototip Array kot polja tu, zato jih deepStrictEqual
// ne šteje za enaka - pred primerjavo jih pretvorimo v navadne vrednosti.
const plain = x => JSON.parse(JSON.stringify(x));
const describe = step => plain({
  variant: step.variant,
  cells: step.cells.map(E.cellLabel),
  eliminate: step.eliminate.map(([c, d]) => `${E.cellLabel(c)}≠${d}`),
});

// hard-17-a, stanje pred korakom 27 (indeks velja za vrstni red tehnik pred 2026-09-18).
const KITE_POS = `
[2347] [38] [3478] [467] 1 5 [279] [347] [34679]
[347] 9 [15] [467] 8 2 [157] [13457] [34567]
[247] 6 [15] [47] 9 3 [12578] [14578] [457]
5 [47] 2 1 [467] 9 3 [67] 8
6 [138] [3478] 2 [35] [47] [157] 9 [57]
9 [13] [37] 8 [35] [67] 4 [1567] 2
[347] 5 [347] 9 [47] 8 6 2 1
8 [247] [69] [35] [2467] 1 [579] [3457] [34579]
1 [247] [69] [35] [2467] [467] [5789] [34578] [34579]`;

// oakever-ekstrem-17-a, stanje pred korakom 37 (indeks velja za vrstni red tehnik pred
// 2026-09-18).
const SKYSCRAPER_POS = `
8 1 5 7 [234] [234] [34] 6 9
[46] [3467] [3467] 1 5 9 [34] 2 8
[46] 9 2 8 [346] [346] 7 1 5
7 [68] 1 4 [28] 5 9 3 [26]
2 [34] 9 6 [37] 1 8 5 [47]
5 [3468] [3468] 9 [2378] [237] 1 [47] [26]
1 [467] [467] 2 9 8 5 [47] 3
3 [28] [8] 5 1 [467] [26] 9 [467]
9 5 [467] 3 [467] [467] [26] 8 1`;

// hard-17-a, stanje pred korakom 28 (indeks velja za vrstni red tehnik pred 2026-09-18;
// takoj po zmaju iz KITE_POS; tu nobena tehnika ne najde koraka in reševalec ugiba).
const NO_PATTERN_POS = `
[2347] [38] [3478] [467] 1 5 [279] [347] [34679]
[347] 9 [15] [467] 8 2 [157] [13457] [34567]
[247] 6 [15] [47] 9 3 [12578] [14578] [457]
5 [47] 2 1 [467] 9 3 [67] 8
6 [138] [3478] 2 [35] [47] [157] 9 [57]
9 [13] [37] 8 [35] [67] 4 [1567] 2
[347] 5 [347] 9 [47] 8 6 2 1
8 [247] [69] [35] [2467] 1 [579] [3457] [34579]
1 [27] [69] [35] [2467] [467] [5789] [34578] [34579]`;

test('Two-String Kite (Zmaj z dvema vrvicama)', () => {
  const steps = E.turbotFish(boardFromText(E, KITE_POS));
  assert.deepEqual(Array.from(steps, describe), [
    { variant: 'Two-String Kite', cells: ['V4S2', 'V4S5', 'V5S6', 'V9S6'], eliminate: ['V9S2≠4'] },
  ]);
  assert.equal(steps[0].technique, 'Turbot Fish');
  assert.equal(steps[0].message,
    'Kandidat 4 je v vrstici 4 mogoč samo v celicah V4S2, V4S5, v stolpcu 6 pa samo v celicah V5S6, V9S6. ' +
    'Celici V4S5 in V5S6 ležita v bloku 5, zato je vsaj ena od celic V4S2, V9S6 enaka 4 -> tvori vzorec ' +
    'Zmaj z dvema vrvicama (Two-String Kite, Turbot Fish). 4 lahko izbrišemo iz celic, ki vidijo obe: V9S2.');
});

test('Skyscraper', () => {
  const steps = E.turbotFish(boardFromText(E, SKYSCRAPER_POS));
  assert.deepEqual(Array.from(steps, describe), [
    { variant: 'Two-String Kite', cells: ['V5S2', 'V5S9', 'V6S8', 'V7S8'], eliminate: ['V7S2≠4'] },
    { variant: 'Skyscraper', cells: ['V5S5', 'V5S9', 'V8S9', 'V8S6'], eliminate: ['V6S6≠7', 'V9S5≠7'] },
    { variant: 'Two-String Kite', cells: ['V8S6', 'V8S9', 'V7S8', 'V6S8'], eliminate: ['V6S6≠7'] },
  ]);
  assert.equal(steps[1].message,
    'Kandidat 7 je v vrstici 5 mogoč samo v celicah V5S5, V5S9, v vrstici 8 pa samo v celicah V8S6, V8S9. ' +
    'Celici V5S9 in V8S9 ležita v stolpcu 9, zato je vsaj ena od celic V5S5, V8S6 enaka 7 -> tvori ' +
    'Skyscraper (Turbot Fish). 7 lahko izbrišemo iz celic, ki vidijo obe: V6S6, V9S5.');
});

test('brez vzorca', () => {
  assert.deepEqual(plain(E.turbotFish(boardFromText(E, NO_PATTERN_POS))), []);
});

// Vrstni red po točkah HoDoKu (odločitev 2026-09-24, docs/tehnike.md): Turbot Fish
// (2-String Kite 150) je izenačen s Swordfish (150), pred njim je po vrstnem redu
// korakov v HoDoKu Swordfish.
test('Turbot Fish je v ALL_TECHNIQUES takoj za Swordfish in pred W-Wing', () => {
  const names = E.ALL_TECHNIQUES.map(([n]) => n);
  assert.equal(names[names.indexOf('Swordfish') + 1], 'Turbot Fish');
  assert.equal(names[names.indexOf('Turbot Fish') + 1], 'W-Wing');
});

for (const { ime, danosti } of loadPuzzles()) {
  test(`uganka ${ime}: enolična, rešena, brez napačnih izbrisov`, () => {
    assert.equal(E.countSolutions(danosti), 1);
    const { board, log } = E.solve(danosti);
    assert.ok(!log.some(s => s.technique === 'OBSTALO' || s.technique === 'NAPAKA'));
    assert.ok(board.isSolved() && board.isValid());
    // Uganka ima natanko eno rešitev, zato je rešena mreža ravno ta rešitev.
    const sol = board.grid;
    for (const step of log) {
      for (const [c, d] of step.assign) assert.equal(sol[c], d, `${step.technique}: ${step.message}`);
      for (const [c, d] of step.eliminate) assert.notEqual(sol[c], d, `${step.technique}: ${step.message}`);
      // Vsi vzorci Turbot Fish, ki jih motor najde v tem stanju (ne le uporabljeni).
      const b = Object.create(E.Board.prototype);
      b.grid = step.snapshotGrid.slice(); b.cand = step.snapshotCand.slice();
      for (const tf of E.turbotFish(b)) {
        for (const [c, d] of tf.eliminate) assert.notEqual(sol[c], d, tf.message);
      }
    }
  });
}
