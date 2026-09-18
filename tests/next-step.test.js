'use strict';
// Testi funkcij motorja za igro: nextStep() (en naslednji korak, ki ga uporablja
// tudi solve()) in solutionOf() (rešitev uganke za "Preveri"), na ugankah iz
// docs/uganke.md (nova uganka tam je samodejno vključena).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, { names: ['nextStep', 'solutionOf', 'applyStep'] });

const uganke = loadPuzzles().map(p => {
  const danosti = p.danosti.replace(/\./g, '0');
  const r = E.solve(danosti);
  const tehnike = r.solutionCount === 1
    ? E.ALL_TECHNIQUES
    : E.ALL_TECHNIQUES.filter(([ime]) => ime !== 'Unique Rectangle');
  return { ime: p.ime, danosti, r, tehnike };
});

// Korak brez polj, ki jih doda solve() (posnetek stanja, usidrana številka).
const jedro = s => s && JSON.parse(JSON.stringify({
  technique: s.technique, message: s.message, cells: s.cells, assign: s.assign, eliminate: s.eliminate,
}));
const stevke = s => new Set([...s.assign.map(([, d]) => d), ...s.eliminate.map(([, d]) => d)]);

for (const u of uganke) {
  test(`${u.ime}: zaporedje nextStep() da isti dnevnik kot solve()`, () => {
    const b = new E.Board(u.danosti);
    let fokus = null;
    for (const s of u.r.log) {
      if (s.technique === 'OBSTALO' || s.technique === 'NAPAKA') break;
      const pred = JSON.stringify([b.grid, b.cand]);
      const k = E.nextStep(b, u.tehnike, fokus);
      assert.equal(JSON.stringify([b.grid, b.cand]), pred, 'nextStep ne spremeni deske');
      assert.deepEqual(jedro(k), jedro(s));
      E.applyStep(b, k);
      fokus = s.focusDigit;
    }
  });

  test(`${u.ime}: nextStep() s poudarjeno številko ima prednost, če korak s to številko obstaja`, () => {
    const b = new E.Board(u.danosti);
    const brez = E.nextStep(b, u.tehnike);
    assert.deepEqual(jedro(brez), jedro(u.r.log[0]), 'brez številke: prvi korak solve()');
    for (let d = 1; d <= 9; d++) {
      const obstaja = u.tehnike.some(([, fn]) => fn(b).some(s => stevke(s).has(d)));
      const k = E.nextStep(b, u.tehnike, d);
      if (obstaja) assert.ok(stevke(k).has(d), `korak za številko ${d}`);
      else assert.deepEqual(jedro(k), jedro(brez), `za številko ${d} ni koraka - enak kot brez nje`);
    }
  });

  test(`${u.ime}: solutionOf() da veljavno rešitev, skladno z danostmi`, () => {
    const res = E.solutionOf(u.danosti);
    assert.ok(res, 'rešitev obstaja');
    for (let c = 0; c < 81; c++) if (u.danosti[c] !== '0') assert.equal(res[c], +u.danosti[c]);
    for (const enota of [...E.ROWS, ...E.COLS, ...E.BOXES]) {
      assert.deepEqual([...enota.map(c => res[c])].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    if (u.r.board.isSolved()) assert.deepEqual([...res], [...u.r.board.grid], 'enaka kot rešitev iz solve()');
  });
}

test('solutionOf(): danosti s protislovjem nimajo rešitve', () => {
  const d = uganke[0].danosti;
  // V vrstico prve dane števke dodamo še enkrat isto števko (v prazno celico).
  const dana = d.split('').findIndex(ch => ch !== '0');
  const vrsta = Math.floor(dana / 9);
  const prazna = E.ROWS[vrsta].find(c => d[c] === '0');
  const pokvarjene = d.slice(0, prazna) + d[dana] + d.slice(prazna + 1);
  assert.equal(E.solutionOf(pokvarjene), null);
});
