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
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'trening/generators.js'],
  names: ['genNakedSingle', 'genHiddenSingle', 'preveriEnojcek', 'MODES', 'Math',
    'nakedSingles', 'hiddenSingles', 'solutionOf', 'boxOf', 'ENOJCEK_NAJMANJ_PRAZNIH',
    'stopnjaEnojcka', 'UNITS_OF', 'ROWS', 'COLS', 'TEHNIKE_OPISI'],
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

/* ---------- postopnost v krogu (vaje 1-3, 4-6, 7-9) ---------- */

// Za vsako številko vaje 0-8 nekaj vaj obeh tehnik (isti PRNG s semenom).
const K = 4;
const krog = gen => Array.from({ length: 9 }, (_, n) => Array.from({ length: K }, () => gen(n)));
const K1 = krog(E.genNakedSingle), K2 = krog(E.genHiddenSingle);
const poStopnji = (kr, st) => kr.filter((_, n) => E.stopnjaEnojcka(n) === st).flat();
const jeEnota = u => E.UNITS_OF[u[0]].some(x => x.length === u.length && x.every((c, i) => c === u[i]));
const vrstaEnote = u => E.ROWS.includes(u) ? 'vrstica' : E.COLS.includes(u) ? 'stolpec' : 'blok';

test('postopnost: stopnja iz številke vaje (1-3, 4-6, 7-9), brez številke cela mreža', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => E.stopnjaEnojcka(n)), [1, 1, 1, 2, 2, 2, 3, 3, 3]);
  assert.equal(E.stopnjaEnojcka(undefined), 3);
  for (const ex of [...E1.vaje, ...E2.vaje]) { assert.equal(ex.stopnja, 3); assert.equal(ex.oznaka, null); }
  K1.forEach((v, n) => v.forEach(ex => assert.equal(ex.stopnja, E.stopnjaEnojcka(n))));
  K2.forEach((v, n) => v.forEach(ex => assert.equal(ex.stopnja, E.stopnjaEnojcka(n))));
});

test('E1 vaje 1-3: označena je celica koraka (očitni enojček), izbereš samo števko', () => {
  for (const ex of poStopnji(K1, 1)) {
    const [[c, d]] = ex.korak.assign;
    assert.deepEqual({ ...ex.oznaka }, { celica: c, enota: null, stevka: null });
    assert.equal(E.popcount(ex.boardCand[c]), 1, 'v označeni celici je mogoča ena sama števka');
    assert.equal(E.preveriEnojcek(ex, c, d).izid, 'prav');
    const lbl = E.cellLabel(c);
    assert.equal(ex.unitLabel, `Katera števka je edina mogoča v označeni celici ${lbl}?`);
    assert.ok(ex.desc.startsWith(E.TEHNIKE_OPISI['naked-single'].razlaga));
    assert.match(ex.desc, /Celica je že izbrana – izberi samo števko/);
    assert.equal(ex.namig, `Preglej vrstico, stolpec in blok celice ${lbl}: katera števka ni v nobenem od njih?`);
  }
});

test('E1 vaje 4-6: označena je vrstica, stolpec ali blok celice koraka', () => {
  const vrste = new Set();
  for (const ex of poStopnji(K1, 2)) {
    const [[c]] = ex.korak.assign, u = ex.oznaka.enota;
    assert.equal(ex.oznaka.celica, null); assert.equal(ex.oznaka.stevka, null);
    assert.ok(jeEnota(u) && u.includes(c), 'enota celice koraka');
    vrste.add(vrstaEnote(u));
    // Namig pove, koliko celic enote ima eno samo možno števko - ne katere.
    const celic = new Set(E.nakedSingles(deska(ex)).map(s => s.assign[0][0]).filter(x => u.includes(x))).size;
    assert.match(ex.namig, new RegExp(`^V (vrstici|stolpcu|bloku) \\d (je|sta|so) ${celic} celic[aei]? z eno samo možno števko\\. `));
    assert.doesNotMatch(ex.namig, /V\dS\d/);
    assert.match(ex.unitLabel, /^V označen(i vrstici|em stolpcu|em bloku) \d poišči celico z eno samo možno števko$/);
  }
  assert.deepEqual([...vrste].sort(), ['blok', 'stolpec', 'vrstica']);
});

test('E2 vaje 1-3: označena sta enota in števka, v enoti je zanjo eno samo mesto', () => {
  for (const ex of poStopnji(K2, 1)) {
    const [[c, d]] = ex.korak.assign, u = ex.oznaka.enota;
    assert.equal(ex.oznaka.celica, null);
    assert.equal(ex.oznaka.stevka, d);
    assert.equal(u, ex.korak.hint.unit);
    const mesta = u.filter(x => ex.boardGrid[x] === 0 && (ex.boardCand[x] & (1 << d)));
    assert.deepEqual([...mesta], [c], 'edino mesto za števko v enoti je celica koraka');
    assert.match(ex.unitLabel, new RegExp(`^V označen(i vrstici|em stolpcu|em bloku) \\d poišči edino mesto za števko ${d}$`));
    assert.match(ex.desc, /Števka je že izbrana – izberi samo celico/);
    assert.match(ex.namig, new RegExp(`^Kje v (vrstici|stolpcu|bloku) \\d števka ${d} ni mogoča\\? `));
    assert.doesNotMatch(ex.namig, /V\dS\d/);
  }
});

test('E2 vaje 4-6: označena je samo enota koraka, namig našteje manjkajoče števke', () => {
  for (const ex of poStopnji(K2, 2)) {
    const u = ex.oznaka.enota;
    assert.equal(ex.oznaka.celica, null); assert.equal(ex.oznaka.stevka, null);
    assert.equal(u, ex.korak.hint.unit);
    const manjka = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !u.some(x => ex.boardGrid[x] === d));
    assert.ok(manjka.length >= 2);
    const nastej = manjka.length === 2 ? `${manjka[0]} in ${manjka[1]}` : `${manjka.slice(0, -1).join(', ')} in ${manjka[manjka.length - 1]}`;
    assert.ok(ex.namig.includes(nastej + '. Za vsako preveri, na koliko praznih mestih'), ex.namig);
    assert.doesNotMatch(ex.namig, /V\dS\d/);
    assert.match(ex.unitLabel, /^V označen(i vrstici|em stolpcu|em bloku) \d poišči števko z enim samim mestom$/);
  }
});

test('vaje 7-9: cela mreža brez oznake, navodilo in namig kot doslej', () => {
  for (const ex of [...poStopnji(K1, 3), ...poStopnji(K2, 3)]) {
    assert.equal(ex.oznaka, null);
    assert.equal(ex.desc, undefined, 'opis iz MODES');
    assert.match(ex.unitLabel, /^Poišči (celico z eno samo možno števko|števko z enim samim mestom v enoti)$/);
    assert.match(ex.namig, /^(V mreži|Poglej) /);
  }
});

test('postopnost: besedila brez »številk« in brez angleških imen', () => {
  const angl = Object.values(E.TEHNIKE_OPISI).map(o => o.anglesko);
  for (const ex of [...K1.flat(), ...K2.flat()]) {
    for (const t of [ex.unitLabel, ex.desc || '', ex.namig]) {
      assert.doesNotMatch(t, /številk/i, t);
      for (const a of angl) assert.ok(!t.includes(a), `${a}: ${t}`);
    }
  }
});
