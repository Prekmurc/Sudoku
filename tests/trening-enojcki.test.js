'use strict';
// Testi vaj za enojčka v treningu (trening/generators.js genNakedSingle/genHiddenSingle,
// preveriEnojcek). Drugače kot ostale vaje je vaja stanje prave uganke (ena rešitev),
// rešene do tja samo z enojčki, zato se preverja: uganka, skladnost mreže z rešitvijo,
// kandidati samo iz števk (prikaz brez kandidatov), pri E2 ni nobenega očitnega
// enojčka, preverjanje odgovora pa sprejme natanko korake motorja.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'trening/generators.js'],
  names: ['genNakedSingle', 'genHiddenSingle', 'preveriEnojcek', 'MODES', 'Math',
    'nakedSingles', 'hiddenSingles', 'solutionOf', 'boxOf', 'ENOJCEK_NAJMANJ_PRAZNIH'],
});

// Ponovljivost: Math.random v kontekstu generatorja zamenjamo s PRNG s semenom (mulberry32).
let seed = 20260924;
E.Math.random = () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const N = 100;
const ustvari = (gen) => {
  const t0 = process.hrtime.bigint();
  const vaje = Array.from({ length: N }, () => gen());
  return { vaje, ms: Number(process.hrtime.bigint() - t0) / 1e6 / N };
};
const E1 = ustvari(E.genNakedSingle);
const E2 = ustvari(E.genHiddenSingle);

const deska = ex => ({ grid: ex.boardGrid, cand: ex.boardCand });
const prazne = ex => [...Array(81).keys()].filter(c => ex.boardGrid[c] === 0);

test('vnosa v MODES: brez kandidatov, en vpis', () => {
  for (const [kljuc, gen] of [['naked-single', E.genNakedSingle], ['hidden-single', E.genHiddenSingle]]) {
    const M = E.MODES[kljuc];
    assert.equal(M.gen, gen);
    assert.equal(M.isSingle, true);
    assert.equal(M.showCandidateCount, false, `${kljuc}: gumb za število kandidatov bi izdal odgovor`);
  }
});

test('vaja je stanje prave uganke z eno rešitvijo, kandidati izhajajo samo iz števk', () => {
  for (const ex of [...E1.vaje, ...E2.vaje]) {
    assert.equal(E.countSolutions(ex.danosti), 1, ex.danosti);
    assert.equal(ex.resitev, E.solutionOf(ex.danosti).join(''));
    for (let c = 0; c < 81; c++) {
      if (ex.danosti[c] !== '0') assert.equal(ex.boardGrid[c], +ex.danosti[c], 'danost je na mreži');
      if (ex.boardGrid[c]) { assert.equal(ex.boardGrid[c], +ex.resitev[c], 'števka na mreži je iz rešitve'); continue; }
      // Kandidati = vse števke razen tistih, ki jih celica vidi (samo vpisi, brez izbrisov).
      let vidi = 0;
      for (const p of E.PEERS[c]) if (ex.boardGrid[p]) vidi |= 1 << ex.boardGrid[p];
      assert.equal(ex.boardCand[c], E.FULL & ~vidi, `kandidati ${E.cellLabel(c)}`);
    }
  }
});

test('E1: na mreži je očitni enojček, vaja ni tik pred koncem, načrtovani korak je pravilen', () => {
  for (const ex of E1.vaje) {
    assert.equal(ex.vrsta, 'naked');
    assert.ok(prazne(ex).length >= E.ENOJCEK_NAJMANJ_PRAZNIH, 'dovolj praznih celic');
    assert.ok(E.nakedSingles(deska(ex)).length > 0);
    const [[c, d]] = ex.korak.assign;
    assert.equal(ex.korak.technique, 'Gol enojček');
    assert.equal(E.popcount(ex.boardCand[c]), 1);
    assert.equal(d, +ex.resitev[c]);
    assert.match(ex.namig, /^V mreži (je|sta|so) \d+ celic[aei]? z eno samo možno števko\. Ena je v bloku (\d)\.$/);
    assert.equal(+ex.namig.match(/bloku (\d)/)[1], E.boxOf(c) + 1, 'namig pove blok načrtovane celice');
  }
});

// Zahteva naloge: vaja za skriti enojček ga mora res zahtevati - na vsej mreži ni
// nobenega očitnega enojčka, zato nobene celice ne reši že očitni.
test('E2: na mreži ni nobenega očitnega enojčka, skriti je v celici z vsaj dvema kandidatoma', () => {
  for (const ex of E2.vaje) {
    assert.equal(ex.vrsta, 'hidden');
    assert.equal(E.nakedSingles(deska(ex)).length, 0, 'ni očitnega enojčka');
    for (const c of prazne(ex)) assert.ok(E.popcount(ex.boardCand[c]) >= 2, E.cellLabel(c));
    const [[c, d]] = ex.korak.assign;
    assert.equal(ex.korak.technique, 'Skriti enojček');
    assert.equal(d, +ex.resitev[c]);
    // Namig pove samo enoto (kot v igri) - ne celice in ne števke.
    assert.match(ex.namig, /^Poglej (vrstico|stolpec|blok) \d: katera števka, ki je v nje[jm] še ni, je mogoča samo na enem mestu\?$/);
    assert.doesNotMatch(ex.namig, /V\dS\d/);
  }
});

// Preverjanje odgovora na vseh praznih celicah in vseh števkah: 'prav' natanko pri
// korakih tehnike, prava števka po drugi poti 'nevtralno', sicer 'narobe'.
test('preveriEnojcek(): sprejme natanko korake tehnike', () => {
  let nevtralnih = 0, zeVpisana = 0;
  for (const ex of [...E1.vaje, ...E2.vaje]) {
    const fn = ex.vrsta === 'naked' ? E.nakedSingles : E.hiddenSingles;
    const koraki = new Set(fn(deska(ex)).map(s => s.assign[0].join(':')));
    assert.equal(E.preveriEnojcek(ex, ...ex.korak.assign[0]).izid, 'prav', 'načrtovani korak');
    for (const c of prazne(ex)) {
      for (let d = 1; d <= 9; d++) {
        const r = E.preveriEnojcek(ex, c, d);
        const pricakovano = koraki.has(`${c}:${d}`) ? 'prav' : d === +ex.resitev[c] ? 'nevtralno' : 'narobe';
        assert.equal(r.izid, pricakovano, `${ex.vrsta} ${E.cellLabel(c)} = ${d}: ${r.sporocilo}`);
        assert.ok(r.sporocilo, 'vsak izid ima sporočilo');
        if (r.izid === 'nevtralno') nevtralnih++;
        if (!(ex.boardCand[c] & (1 << d))) {
          assert.match(r.sporocilo, /že vpisana \(V\dS\d\)/, 'števka, ki ni kandidat, je v enoti že vpisana');
          zeVpisana++;
        }
      }
    }
    // Izpolnjena celica: odgovor se ne šteje.
    const polna = ex.boardGrid.findIndex(v => v !== 0);
    assert.equal(E.preveriEnojcek(ex, polna, ex.boardGrid[polna]).izid, 'nevtralno');
  }
  assert.ok(nevtralnih > 0 && zeVpisana > 0, 'preizkušeni so vsi izidi');
});

test('E1: skriti enojček s pravo števko je nevtralen in pove, da je to skriti enojček', () => {
  let najdenih = 0;
  for (const ex of E1.vaje) {
    for (const s of E.hiddenSingles(deska(ex))) {
      const [c, d] = s.assign[0];
      const r = E.preveriEnojcek(ex, c, d);
      assert.equal(r.izid, 'nevtralno');
      assert.match(r.sporocilo, /to je skriti enojček/);
      najdenih++;
    }
  }
  assert.ok(najdenih > 0);
});

test('vaje so raznolike in se ustvarijo hitro', () => {
  for (const { vaje } of [E1, E2]) {
    assert.equal(new Set(vaje.map(ex => ex.danosti)).size, N, 'vsaka vaja je iz druge uganke');
    assert.ok(new Set(vaje.map(ex => ex.korak.assign[0][1])).size === 9, 'vse števke');
  }
  // Oznaka enote skritega enojčka: vrstice, stolpci in bloki.
  const enote = new Set(E2.vaje.map(ex => ex.namig.split(' ')[1]));
  assert.deepEqual([...enote].sort(), ['blok', 'stolpec', 'vrstico']);
  console.log(`# ms na vajo: E1 ${E1.ms.toFixed(0)}, E2 ${E2.ms.toFixed(0)}`);
  assert.ok(E1.ms < 500 && E2.ms < 500, `ms na vajo: ${E1.ms.toFixed(0)} / ${E2.ms.toFixed(0)}`);
});
