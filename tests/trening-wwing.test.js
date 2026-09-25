'use strict';
// Testi generatorja vaj W-Wing (trening/generators.js genWWing) - vaje so sintetične
// (niso prave uganke), zato se preverja, da jih motor (shared/engine.js wWing) oceni
// tako, kot je načrtovano. Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, { files: ['trening/generators.js'], names: ['genWWing', 'MODES', 'Math', 'ALL_UNITS', 'imeTehnike'] });

// Ponovljivost: Math.random v kontekstu generatorja zamenjamo s PRNG s semenom (mulberry32).
let seed = 20260918;
E.Math.random = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const N = 200;
const t0 = process.hrtime.bigint();
const exercises = Array.from({ length: N }, (_, n) => E.genWWing(n));
const msPerExercise = Number(process.hrtime.bigint() - t0) / 1e6 / N;

const boardOf = ex => ({ grid: ex.boardGrid, cand: ex.boardCand });
// Polja iz vm konteksta imajo drug prototip Array kot polja tu, zato jih deepStrictEqual
// ne šteje za enaka - razpon jih pretvori v navadno polje.
const candsOf = (ex, c) => (ex.boardGrid[c] === 0 ? [...E.bitsOf(ex.boardCand[c])] : []);
const hasDigit = (ex, c, d) => candsOf(ex, c).includes(d);
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
// Enote, ki vsebujejo vse dane celice.
const unitsWith = (...cells) => E.ALL_UNITS.filter(u => cells.every(c => u.includes(c)));
const countInUnit = (ex, unit, d) => unit.filter(c => hasDigit(ex, c, d)).length;

test('vnos v MODES', () => {
  const M = E.MODES['w-wing'];
  assert.equal(M.gen, E.genWWing);
  assert.equal(M.isWWing, true);
  assert.equal(M.pickN, 4);
  assert.equal(M.showCandidateCount, true);
  // Ime tehnike ni več v MODES (da ga imeTehnike() v shared/engine.js).
  assert.equal(M.name, undefined);
  assert.equal(E.imeTehnike('W-Wing'), 'W-krilo (W-Wing)');
});

test(`generator: ${N} vaj, povprečno ${msPerExercise.toFixed(1)} ms na vajo`, t => {
  t.diagnostic(`povprečni čas generiranja: ${msPerExercise.toFixed(2)} ms/vajo`);
  assert.ok(msPerExercise < 200);
});

test('celici para sta bivalue z isto masko in se ne vidita', () => {
  exercises.forEach((ex, n) => {
    const [a, b] = ex.digits;
    const [p1, p2] = ex.pair;
    assert.deepEqual(candsOf(ex, p1).sort(), [a, b].sort(), `vaja ${n}`);
    assert.deepEqual(candsOf(ex, p2).sort(), [a, b].sort(), `vaja ${n}`);
    assert.ok(!E.PEERS[p1].has(p2), `vaja ${n}`);
    // Bivalue celice s to masko sta samo ti dve (sicer bi nastali dodatni vzorci).
    const enake = [...ex.slots].filter(s => sameSet(s.c, [a, b])).map(s => s.idx);
    assert.deepEqual(enake.sort((x, y) => x - y), [p1, p2].sort((x, y) => x - y), `vaja ${n}`);
  });
});

test('povezava je močna: enota z natanko dvema celicama z vezno števko', () => {
  exercises.forEach((ex, n) => {
    const [a, b] = ex.digits;
    const [x, y] = ex.link;
    const [p1, p2] = ex.pair;
    assert.ok(hasDigit(ex, x, b) && hasDigit(ex, y, b), `vaja ${n}`);
    assert.ok(![x, y].includes(p1) && ![x, y].includes(p2), `vaja ${n}`);
    // Vsaj ena skupna enota celic povezave ima natanko dve celici z b.
    assert.ok(unitsWith(x, y).some(u => countInUnit(ex, u, b) === 2), `vaja ${n}`);
    // Vsaka celica povezave vidi po eno celico para (v eni ali drugi razporeditvi).
    assert.ok((E.PEERS[x].has(p1) && E.PEERS[y].has(p2)) || (E.PEERS[x].has(p2) && E.PEERS[y].has(p1)), `vaja ${n}`);
    // Celice izbrisa vidijo obe celici para in imajo izbrisano števko.
    for (const [c, d] of ex.solutionEliminate) {
      assert.equal(d, a, `vaja ${n}`);
      assert.ok(E.PEERS[p1].has(c) && E.PEERS[p2].has(c), `vaja ${n}`);
    }
    assert.ok(ex.solutionEliminate.length > 0, `vaja ${n}`);
  });
});

test('motor najde načrtovani vzorec in nobenega drugega', () => {
  exercises.forEach((ex, n) => {
    const steps = E.wWing(boardOf(ex));
    assert.ok(steps.length > 0, `vaja ${n}`);
    for (const s of steps) assert.ok(sameSet([...s.cells], [...ex.solutionCells]), `vaja ${n}: ${s.message}`);
    assert.ok(steps.some(s => s.message === ex.solutionMessage), `vaja ${n}`);
    assert.ok(sameSet([...ex.solutionCells], [...ex.pair, ...ex.link]), `vaja ${n}`);
  });
});

test('tipa motilca se izmenjujeta (sode vaje para-se-vidi, lihe povezava-ni-mocna)', () => {
  exercises.forEach((ex, n) => {
    assert.equal(ex.distractor.type, n % 2 === 0 ? 'para-se-vidi' : 'povezava-ni-mocna');
  });
});

test('moteči vzorec spodleti pri natanko enem pogoju', () => {
  const types = new Set();
  exercises.forEach((ex, n) => {
    const dis = ex.distractor;
    types.add(dis.type);
    const [dp1, dp2] = dis.pair, [dx, dy] = dis.link;
    // Motilec ne deli nobene celice s pravim vzorcem.
    assert.ok(dis.cells.every(c => !ex.solutionCells.includes(c)), `vaja ${n}`);
    // Celici para motilca sta bivalue z isto masko; vezna števka je tista, ki jo imata
    // tudi celici povezave, izbrisana pa druga.
    const par = candsOf(ex, dp1);
    assert.equal(par.length, 2, `vaja ${n}`);
    assert.deepEqual(candsOf(ex, dp2).sort(), [...par].sort(), `vaja ${n}`);
    const d = par.find(v => hasDigit(ex, dx, v) && hasDigit(ex, dy, v));
    const c = par.find(v => v !== d);
    assert.ok(d !== undefined, `vaja ${n}`);
    // Izpolnjeno v obeh tipih: celici povezave nista celici para, vsaka vidi po eno
    // celico para, obstaja celica z izbrisano števko, ki vidi obe celici para.
    assert.ok(![dx, dy].includes(dp1) && ![dx, dy].includes(dp2), `vaja ${n}`);
    assert.ok((E.PEERS[dx].has(dp1) && E.PEERS[dy].has(dp2)) || (E.PEERS[dx].has(dp2) && E.PEERS[dy].has(dp1)), `vaja ${n}`);
    assert.ok(dis.elim.every(i => E.PEERS[dp1].has(i) && E.PEERS[dp2].has(i) && hasDigit(ex, i, c)), `vaja ${n}`);

    if (dis.type === 'para-se-vidi') {
      // Izpolnjeno: povezava je močna. Spodleti: celici para se vidita.
      assert.ok(unitsWith(dx, dy).some(u => countInUnit(ex, u, d) === 2), `vaja ${n}`);
      assert.ok(E.PEERS[dp1].has(dp2), `vaja ${n}`);
      assert.equal(dis.extra, null, `vaja ${n}`);
    } else {
      assert.equal(dis.type, 'povezava-ni-mocna');
      // Izpolnjeno: celici para se ne vidita. Spodleti: enota povezave ima tretjo
      // celico z vezno števko, zato nobena skupna enota ni močna povezava.
      assert.ok(!E.PEERS[dp1].has(dp2), `vaja ${n}`);
      assert.ok(unitsWith(dx, dy, dis.extra).some(u => countInUnit(ex, u, d) === 3), `vaja ${n}`);
      assert.ok(!unitsWith(dx, dy).some(u => countInUnit(ex, u, d) === 2), `vaja ${n}`);
      // Brez tretje celice motor motilčev vzorec najde.
      const b2 = { grid: [...ex.boardGrid], cand: [...ex.boardCand] };
      b2.grid[dis.extra] = 1; b2.cand[dis.extra] = 0;
      assert.ok(E.wWing(b2).some(s => sameSet([...s.cells], [dp1, dp2, dx, dy])), `vaja ${n}`);
    }
  });
  assert.deepEqual([...types].sort(), ['para-se-vidi', 'povezava-ni-mocna']);
});
