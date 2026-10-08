'use strict';
// Testi generatorja vaj XY-veriga (trening/generators.js genXYChain, docs/xy-veriga-nacrt.md,
// korak 5) - vaje so sintetične (niso prave uganke), zato se preverja, da jih motor
// (shared/engine.js xyChain, xyWing) oceni tako, kot je načrtovano. Pogoji vzorca in motilca so
// izračunani tu, iz kandidatov deske, ne iz kode generatorja. Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, { files: ['trening/generators.js'], names: ['genXYChain', 'MODES', 'Math', 'xyChain'] });

// Ponovljivost: Math.random v kontekstu generatorja zamenjamo s PRNG s semenom (mulberry32).
let seed = 20261008;
E.Math.random = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const N = 200;
const t0 = process.hrtime.bigint();
const exercises = Array.from({ length: N }, (_, n) => E.genXYChain(n));
const msPerExercise = Number(process.hrtime.bigint() - t0) / 1e6 / N;

const boardOf = ex => ({ grid: ex.boardGrid, cand: ex.boardCand });
// Polja iz vm konteksta imajo drug prototip Array kot polja tu, zato jih deepStrictEqual
// ne šteje za enaka - razpon jih pretvori v navadno polje.
const candsOf = (ex, c) => (ex.boardGrid[c] === 0 ? [...E.bitsOf(ex.boardCand[c])] : []);
const hasDigit = (ex, c, d) => candsOf(ex, c).includes(d);
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const sees = (a, b) => E.PEERS[a].has(b);
const skupne = (ex, a, b) => candsOf(ex, a).filter(d => hasDigit(ex, b, d));

// Veriga števk: vsaka celica ima natanko dva kandidata, zaporedni celici imata skupen
// kandidat, ki ga prejšnja »preda« naprej. Vrne števke, ki jih celice dobijo, če prva ni z
// (zadnja vrednost je števka zadnje celice), ali null, če veriga števk ni mogoča.
function predaja(ex, celice, z) {
  if (!celice.every(c => candsOf(ex, c).length === 2)) return null;
  const vrednosti = [];
  let d = z;
  for (const c of celice) {
    if (!hasDigit(ex, c, d)) return null;
    d = candsOf(ex, c).find(x => x !== d);
    vrednosti.push(d);
  }
  return vrednosti;
}

test(`generator: ${N} vaj, povprečno ${msPerExercise.toFixed(1)} ms na vajo`, t => {
  t.diagnostic(`povprečni čas generiranja: ${msPerExercise.toFixed(2)} ms/vajo`);
  assert.ok(msPerExercise < 200);
});

test('vnosa v MODES še ni (pride s kartico v koraku 6)', () => {
  assert.equal(E.MODES['xy-chain'], undefined);
});

test('polja vaje: mode, veriga, solutionVeriga, brez polja digit', () => {
  exercises.forEach((ex, n) => {
    assert.equal(ex.mode, 'xy-chain', `vaja ${n}`);
    assert.equal(ex.solutionVeriga, true, `vaja ${n}`);
    // Polje digit bi izris cele mreže v trening.js poudaril (kot pri veriga ene števke).
    assert.equal(ex.digit, undefined, `vaja ${n}`);
    assert.ok(ex.unitLabel.startsWith('XY-veriga'), `vaja ${n}`);
    // Prazne celice so natanko celice vaje.
    const prazne = [...ex.slots.map(s => s.idx)];
    assert.deepEqual(prazne, [...Array(81).keys()].filter(i => ex.boardGrid[i] === 0), `vaja ${n}`);
    const vse = [...ex.celiceVerige, ...ex.izbris, ...ex.distractor.cells];
    assert.equal(new Set(vse).size, vse.length, `vaja ${n}: celica dvakrat`);
    assert.ok(sameSet(prazne, vse), `vaja ${n}`);
  });
});

test('veriga: 4-6 celic z dvema kandidatoma, različne števke povezav, konca imata z', () => {
  exercises.forEach((ex, n) => {
    const ch = ex.celiceVerige, z = ex.z;
    assert.ok(ch.length >= 4 && ch.length <= 6, `vaja ${n}`);
    const vr = predaja(ex, ch, z);
    assert.ok(vr, `vaja ${n}: veriga števk`);
    assert.equal(vr[vr.length - 1], z, `vaja ${n}: zadnja celica je z`);
    // Števke povezav (vse vrednosti razen zadnje) so različne in različne od z.
    const povezave = vr.slice(0, -1);
    assert.equal(new Set([z, ...povezave]).size, ch.length, `vaja ${n}`);
    for (let i = 0; i < ch.length; i++) {
      for (let j = i + 1; j < ch.length; j++) {
        // Zaporedni celici se vidita, nezaporedni ne (veriga brez bližnjic).
        assert.equal(sees(ch[i], ch[j]), j === i + 1, `vaja ${n}: ${i}, ${j}`);
      }
    }
    // Celice izbrisa vidijo oba konca, imajo z in niso celice z dvema kandidatoma.
    assert.ok(ex.izbris.length >= 1 && ex.izbris.length <= 2, `vaja ${n}`);
    for (const c of ex.izbris) {
      assert.ok(sees(c, ch[0]) && sees(c, ch[ch.length - 1]) && hasDigit(ex, c, z), `vaja ${n}`);
      assert.ok(candsOf(ex, c).length >= 3, `vaja ${n}`);
    }
    assert.ok(sameSet(ex.solutionEliminate.map(([c, d]) => `${c}|${d}`), ex.izbris.map(c => `${c}|${z}`)), `vaja ${n}`);
  });
});

test('motor najde načrtovano verigo in nobene druge, XY-krilo nič', () => {
  exercises.forEach((ex, n) => {
    const steps = E.xyChain(boardOf(ex));
    assert.equal(steps.length, 1, `vaja ${n}: ${steps.map(s => s.message).join(' | ')}`);
    const [s] = steps;
    const ch = [...ex.celiceVerige];
    // Motor verigo zapiše od konca z nižjim položajem.
    const pricakovano = ch[0] < ch[ch.length - 1] ? ch : ch.slice().reverse();
    assert.deepEqual([...s.cells], pricakovano, `vaja ${n}`);
    assert.deepEqual([...ex.solutionCells], pricakovano, `vaja ${n}`);
    assert.equal(s.veriga, true, `vaja ${n}`);
    assert.equal(s.message, ex.solutionMessage, `vaja ${n}`);
    assert.ok(sameSet(s.eliminate.map(([c, d]) => `${c}|${d}`), ex.solutionEliminate.map(([c, d]) => `${c}|${d}`)), `vaja ${n}`);
    assert.equal(E.xyWing(boardOf(ex)).length, 0, `vaja ${n}: XY-krilo`);
  });
});

test('dolžine 4, 5, 6 se izmenjujejo (po zaporedni številki vaje)', t => {
  const stej = { 4: 0, 5: 0, 6: 0 };
  exercises.forEach((ex, n) => {
    assert.equal(ex.celiceVerige.length, 4 + (n % 3), `vaja ${n}`);
    stej[ex.celiceVerige.length]++;
  });
  t.diagnostic(`dolžine: 4 → ${stej[4]}, 5 → ${stej[5]}, 6 → ${stej[6]}`);
});

test('tipa motilca se izmenjujeta (sode vaje sosednji-se-ne-vidita, lihe konca-brez-skupne)', t => {
  const stej = {};
  exercises.forEach((ex, n) => {
    assert.equal(ex.distractor.type, n % 2 === 0 ? 'sosednji-se-ne-vidita' : 'konca-brez-skupne', `vaja ${n}`);
    stej[ex.distractor.type] = (stej[ex.distractor.type] || 0) + 1;
  });
  t.diagnostic(`motilci: ${JSON.stringify(stej)}`);
});

test('moteči vzorec spodleti pri natanko enem pogoju', () => {
  const types = new Set();
  exercises.forEach((ex, n) => {
    const dis = ex.distractor;
    types.add(dis.type);
    const dc = [...dis.veriga];
    const m = dc.length;
    assert.ok(m >= 4, `vaja ${n}`);
    assert.ok(sameSet([...dis.cells], [...dc, dis.izbris]), `vaja ${n}`);
    assert.ok(dis.cells.every(c => !ex.celiceVerige.includes(c) && !ex.izbris.includes(c)), `vaja ${n}`);
    // Vse celice motilca imajo dva kandidata, zaporedni celici imata natanko en skupen
    // kandidat (števka povezave), nezaporedni nobenega razen koncev.
    assert.ok(dc.every(c => candsOf(ex, c).length === 2), `vaja ${n}`);
    for (let i = 0; i + 1 < m; i++) assert.equal(skupne(ex, dc[i], dc[i + 1]).length, 1, `vaja ${n}`);
    // Pari zaporednih celic, ki se ne vidita.
    const nevidni = [];
    for (let i = 0; i + 1 < m; i++) if (!sees(dc[i], dc[i + 1])) nevidni.push(i);
    // Števka prvega konca: tista, ki je ne preda druga celica.
    const z = candsOf(ex, dc[0]).find(d => !hasDigit(ex, dc[1], d));
    const vr = predaja(ex, dc, z);
    assert.ok(vr, `vaja ${n}: veriga števk`);
    const zadnja = vr[vr.length - 1];
    // Celica, ki vidi oba konca in ima števko prvega konca (tu bi motilec brisal).
    assert.ok(sees(dis.izbris, dc[0]) && sees(dis.izbris, dc[m - 1]) && hasDigit(ex, dis.izbris, z), `vaja ${n}`);
    assert.ok(candsOf(ex, dis.izbris).length >= 3, `vaja ${n}`);

    if (dis.type === 'sosednji-se-ne-vidita') {
      // Izpolnjeno: konca imata z. Spodleti: natanko en par zaporednih celic se ne vidi.
      assert.equal(zadnja, z, `vaja ${n}`);
      assert.equal(nevidni.length, 1, `vaja ${n}`);
    } else {
      assert.equal(dis.type, 'konca-brez-skupne');
      // Izpolnjeno: zaporedne celice se vidijo. Spodleti: zadnji konec nima z.
      assert.equal(nevidni.length, 0, `vaja ${n}`);
      assert.notEqual(zadnja, z, `vaja ${n}`);
      assert.ok(!hasDigit(ex, dc[m - 1], z), `vaja ${n}`);
      // Z z namesto druge števke zadnjega konca motor motilčevo verigo najde.
      const b2 = { grid: [...ex.boardGrid], cand: [...ex.boardCand] };
      b2.cand[dc[m - 1]] = (b2.cand[dc[m - 1]] & ~(1 << zadnja)) | (1 << z);
      assert.ok(E.xyChain(b2).some(s => sameSet([...s.cells], dc)), `vaja ${n}`);
    }
  });
  assert.deepEqual([...types].sort(), ['konca-brez-skupne', 'sosednji-se-ne-vidita']);
});
