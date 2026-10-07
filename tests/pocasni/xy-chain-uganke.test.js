'use strict';
// XY-veriga (shared/engine.js xyChain, docs/xy-veriga-nacrt.md, korak 1) na stanjih pravih
// ugank: 300 minimalnih ugank (genMinimalnaUganka(1..300)), vsa stanja na poti nextStep()
// do rešitve ali do prvega poskusa s protislovjem. Noben izbris ne izbriše števke rešitve
// (solutionOf()), koraki so natanko verige neodvisnega iskanja (tests/xy-veriga-neodvisno.js)
// in noben nima manj kot 4 ali več kot 8 celic. Traja pribl. 20 s, zato je med počasnimi.
// Zagon (vsi testi): node --test "tests/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('../load-engine.js');
const { verigeNeodvisno } = require('../xy-veriga-neodvisno.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['xyChain', 'nextStep', 'applyStep', 'solutionOf', 'genMinimalnaUganka', 'POSKUS_KLJUC'],
});
const L = c => E.cellLabel(c);
const opis = step => ({
  cells: step.cells.map(L),
  eliminate: step.eliminate.map(([c, d]) => `${L(c)}≠${d}`),
});

test('300 minimalnih ugank: izbrisi verig so pravilni, koraki = neodvisno iskanje', () => {
  let stanj = 0, zVerigo = 0, korakov = 0;
  const dolzine = new Set();
  for (let seme = 1; seme <= 300; seme++) {
    const danosti = E.genMinimalnaUganka(seme);
    const resitev = E.solutionOf(danosti);
    assert.ok(resitev, `seme ${seme}: rešitev`);
    const b = new E.Board(danosti);
    for (let i = 0; i < 200 && !b.isSolved(); i++) {
      const koraki = E.xyChain(b);
      stanj++;
      if (koraki.length) zVerigo++;
      for (const k of koraki) {
        korakov++;
        dolzine.add(k.cells.length);
        assert.ok(k.cells.length >= 4 && k.cells.length <= 8, `seme ${seme}: dolžina ${k.cells.length}`);
        for (const [c, d] of k.eliminate) {
          assert.notEqual(resitev[c], d, `seme ${seme}, korak ${i}: ${k.message}`);
        }
      }
      assert.deepEqual(JSON.parse(JSON.stringify(koraki.map(opis))), verigeNeodvisno(b, 4, 8, L),
        `seme ${seme}, korak ${i}`);
      const k = E.nextStep(b);
      if (!k || k.technique.startsWith(E.POSKUS_KLJUC)) break;
      E.applyStep(b, k);
    }
  }
  // Meritev 2026-10-07: 15 327 stanj, v 5757 je vsaj ena veriga, 36 147 korakov dolžin 4-8.
  assert.ok(stanj > 10000 && zVerigo > 1000 && korakov > 10000, `${stanj} / ${zVerigo} / ${korakov}`);
  assert.deepEqual([...dolzine].sort(), [4, 5, 6, 7, 8]);
});
