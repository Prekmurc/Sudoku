'use strict';
// Testi generatorja vaj Turbot Fish (trening/generators.js genTurbotFish) - vaje so
// sintetične (niso prave uganke), zato se preverja, da jih motor (shared/engine.js
// turbotFish) oceni tako, kot je načrtovano. Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, { files: ['trening/generators.js'], names: ['genTurbotFish', 'MODES', 'Math'] });

// Ponovljivost: Math.random v kontekstu generatorja zamenjamo s PRNG s semenom (mulberry32).
let seed = 20260915;
E.Math.random = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const N = 200;
const t0 = process.hrtime.bigint();
const exercises = Array.from({ length: N }, (_, n) => E.genTurbotFish(n));
const msPerExercise = Number(process.hrtime.bigint() - t0) / 1e6 / N;

const boardOf = ex => ({ grid: ex.boardGrid, cand: ex.boardCand });
const hasDigit = (ex, c) => ex.boardGrid[c] === 0 && (ex.boardCand[c] & (1 << ex.digit)) !== 0;
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
function lineOf(a, b) {
  if (Math.floor(a / 9) === Math.floor(b / 9)) return E.ROWS[Math.floor(a / 9)];
  if (a % 9 === b % 9) return E.COLS[a % 9];
  return null;
}
const countInLine = (ex, line) => line.filter(c => hasDigit(ex, c)).length;

test('vnos v MODES', () => {
  const M = E.MODES['turbot-fish'];
  assert.equal(M.gen, E.genTurbotFish);
  assert.equal(M.isTurbot, true);
  assert.equal(M.pickN, 4);
  assert.equal(M.showCandidateCount, false);
});

test(`generator: ${N} vaj, povprečno ${msPerExercise.toFixed(1)} ms na vajo`, t => {
  t.diagnostic(`povprečni čas generiranja: ${msPerExercise.toFixed(2)} ms/vajo`);
  assert.ok(msPerExercise < 200);
});

test('prazne celice imajo označeno številko in 1-2 polnilna kandidata', () => {
  for (const ex of exercises) {
    for (const s of ex.slots) {
      assert.ok(s.c.includes(ex.digit));
      assert.ok(s.c.length >= 2 && s.c.length <= 3);
    }
  }
});

test('motor najde načrtovani vzorec in nobenega drugega', () => {
  exercises.forEach((ex, n) => {
    const steps = E.turbotFish(boardOf(ex));
    assert.ok(steps.length > 0, `vaja ${n}`);
    for (const s of steps) {
      assert.ok(sameSet([...s.cells], [...ex.solutionCells]), `vaja ${n}: ${s.message}`);
      assert.ok(s.eliminate.every(([, d]) => d === ex.digit), `vaja ${n}: ${s.message}`);
    }
    assert.ok(steps.some(s => s.variant === ex.variant && s.message === ex.solutionMessage), `vaja ${n}`);
  });
});

test('podtipa se izmenjujeta (sode vaje Skyscraper, lihe Zmaj z dvema vrvicama)', () => {
  exercises.forEach((ex, n) => assert.equal(ex.variant, n % 2 === 0 ? 'Skyscraper' : 'Two-String Kite'));
});

test('moteči vzorec spodleti pri natanko enem pogoju', () => {
  const types = new Set();
  exercises.forEach((ex, n) => {
    const dis = ex.distractor;
    types.add(dis.type);
    assert.ok(dis.cells.every(c => !ex.solutionCells.includes(c) && hasDigit(ex, c)), `vaja ${n}`);
    if (dis.type === 'konca-se-ne-vidita') {
      const [L1, L2] = dis.links;
      // izpolnjeno: obe povezavi sta močni, celica z d vidi po en konec vsake
      for (const [u, v] of [L1, L2]) assert.equal(countInLine(ex, lineOf(u, v)), 2, `vaja ${n}`);
      assert.ok(L1.some(u => E.PEERS[u].has(dis.witness)) && L2.some(v => E.PEERS[v].has(dis.witness)), `vaja ${n}`);
      // spodleti: noben konec prve povezave ne vidi nobenega konca druge
      assert.ok(!L1.some(u => L2.some(v => E.PEERS[u].has(v))), `vaja ${n}`);
    } else {
      assert.equal(dis.type, 'povezava-ni-mocna');
      const [A, B, C, D] = dis.pattern;
      // izpolnjeno: konca B in C se vidita, celica z d vidi A in D
      assert.ok(E.PEERS[B].has(C), `vaja ${n}`);
      assert.ok(E.PEERS[A].has(dis.witness) && E.PEERS[D].has(dis.witness), `vaja ${n}`);
      // spodleti: ena od povezav ima tretjo celico z d, druga je močna
      const counts = [lineOf(A, B), lineOf(C, D)].map(l => countInLine(ex, l)).sort();
      assert.deepEqual(counts, [2, 3], `vaja ${n}`);
      assert.ok(lineOf(A, B).includes(dis.extra) || lineOf(C, D).includes(dis.extra), `vaja ${n}`);
      // brez tretje celice motor vzorec najde
      const b2 = { grid: [...ex.boardGrid], cand: [...ex.boardCand] };
      b2.grid[dis.extra] = 1; b2.cand[dis.extra] = 0;
      assert.ok(E.turbotFish(b2).some(s => sameSet([...s.cells], dis.pattern)), `vaja ${n}`);
    }
  });
  assert.deepEqual([...types].sort(), ['konca-se-ne-vidita', 'povezava-ni-mocna']);
});
