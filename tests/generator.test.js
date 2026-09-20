'use strict';
// Testi generatorja ugank (shared/generator.js): merilo stopnje, enoličnost rešitve
// in ponovljivost po semenu. Uganke tu niso sestavljene na pamet - ustvari jih
// generator in vsaka je preverjena s countSolutions()/solve() (CLAUDE.md).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['applyStep', 'STOPNJE_UGANK', 'stopnjaUganke', 'ustvariUganko', 'oceniStopnjo',
    'genPot', 'genTehnikeSolve', 'GEN_ENOJCKI', 'GEN_OSNOVNE', 'GEN_SREDNJE', 'GEN_NAPREDNE'],
});

// Semena, pri katerih generator da uganko te stopnje (preverjeno ob pisanju testa;
// seme da vedno isto uganko, zato so testi ponovljivi in hitri).
const SEMENA = { lahka: 6, srednja: 5, tezka: 3 };
const uganke = {};
for (const kljuc of Object.keys(SEMENA)) {
  uganke[kljuc] = E.ustvariUganko(kljuc, SEMENA[kljuc]);
  assert.ok(uganke[kljuc], `seme ${SEMENA[kljuc]} mora dati uganko stopnje ${kljuc}`);
}

test('stopnje: ključi, težavnosti in opisi', () => {
  assert.deepEqual([...E.STOPNJE_UGANK].map(s => s.kljuc), ['lahka', 'srednja', 'tezka']);
  // Težavnost je vrednost iz TEZAVNOSTI v shared/zbirka.js (zapis v zbirki).
  assert.deepEqual([...E.STOPNJE_UGANK].map(s => s.tezavnost), ['Preprosto', 'Srednje', 'Težko']);
  for (const s of E.STOPNJE_UGANK) {
    assert.ok(s.ime && s.opis, `stopnja ${s.kljuc} mora imeti ime in opis`);
    assert.equal(E.stopnjaUganke(s.kljuc), s);
  }
  assert.equal(E.stopnjaUganke('ni-take'), null);
  // Napredne tehnike = vse razen enojčkov, presekov, parov in trojic.
  assert.deepEqual([...E.GEN_NAPREDNE],
    ['X-Wing', 'Turbot Fish', 'Swordfish', 'W-Wing', 'XY-Wing', 'Unique Rectangle']);
});

test('vsaka ustvarjena uganka ima natanko eno rešitev in jo solve() reši brez ugibanja', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    assert.match(u.danosti, /^[0-9]{81}$/, `${kljuc}: 81 znakov`);
    assert.equal(E.countSolutions(u.danosti), 1, `${kljuc}: natanko ena rešitev`);
    const tehnike = E.genTehnikeSolve(u.danosti);
    assert.ok(tehnike, `${kljuc}: solve() jo reši brez poskusa s protislovjem`);
    assert.deepEqual({ ...tehnike }, { ...u.tehnike });
  }
});

test('merilo stopnje: pot s tehnikami stopnje uspe, pot brez najzahtevnejše skupine se zatakne', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const s = E.stopnjaUganke(kljuc);
    assert.equal(E.genPot(u.danosti, s.osnova), null,
      `${kljuc}: pot brez najzahtevnejše skupine se mora zatakniti`);
    if (s.dovoljene) {
      assert.ok(E.genPot(u.danosti, s.dovoljene), `${kljuc}: pot s tehnikami stopnje mora uspeti`);
    }
  }
});

test('lahka potrebuje presek, srednja par ali trojico, težka napredno tehniko', () => {
  const l = [...E.genPot(uganke.lahka.danosti, E.GEN_OSNOVNE)];
  assert.ok(l.some(ime => ime === 'Pointing pair/triple' || ime === 'Box-line reduction'),
    'lahka mora uporabiti Pointing ali Box-line');
  const s = [...E.genPot(uganke.srednja.danosti, E.GEN_SREDNJE)];
  assert.ok(s.some(ime => ['Naked pair', 'Hidden pair', 'Naked triple', 'Hidden triple'].includes(ime)),
    'srednja mora uporabiti paro ali trojico');
  assert.ok(E.GEN_NAPREDNE.some(ime => uganke.tezka.tehnike[ime]),
    'težka mora v dnevniku solve() imeti napredno tehniko');
});

test('stopnje se izključujejo: uganka ustreza samo svoji', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    for (const s of E.STOPNJE_UGANK) {
      const o = E.oceniStopnjo(s.kljuc, u.danosti);
      assert.equal(!!o.ustreza, s.kljuc === kljuc,
        `uganka stopnje ${kljuc} pri oceni za ${s.kljuc}`);
    }
  }
});

test('isto seme da vedno isto uganko', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    assert.equal(E.ustvariUganko(kljuc, SEMENA[kljuc]).danosti, u.danosti, kljuc);
    assert.equal(u.seme, SEMENA[kljuc]);
    assert.equal(u.stopnja, kljuc);
  }
});

// Uganka lahka-seme-197 iz docs/uganke.md se iz svojega semena še vedno reproducira.
// Uganka srednja-a (prej srednja-seme-97) se ne več: ocena stopnje bere dnevnik
// solve(), ta pa se je spremenil, ko je sidranje na številko začelo popuščati lažji
// skupini tehnik - iz semena 97 zdaj zmaga drug kandidat na poti odstranjevanja.
// Uganka sama merilu še ustreza (spodnji test), zato v docs/uganke.md ostaja.
test('seme 197 da uganko lahka-seme-197 iz docs/uganke.md', () => {
  assert.equal(E.ustvariUganko('lahka', 197).danosti,
    '073004002049060800105800000000000026000090370387002000492070600000009050500206907');
});

test('seme 97 (strogoSrednja) da uganko, ki ustreza srednji stopnji', () => {
  const u = E.ustvariUganko('srednja', 97, { strogoSrednja: true });
  assert.equal(u.danosti,
    '004007025100003000070800000800090034040005009960000002001006000000000000000004761');
  assert.equal(E.countSolutions(u.danosti), 1);
});

test('srednja-a iz docs/uganke.md še ustreza merilu srednje stopnje', () => {
  const danosti = '004007025100003000070800000800090034040005009960000572001006000000000000000004761';
  const o = E.oceniStopnjo('srednja', danosti, { strogoSrednja: true });
  assert.ok(o.ustreza, 'uganka mora ustrezati merilu srednje stopnje');
});

test('strogoSrednja zahteva par in trojico na poti', () => {
  const u = E.ustvariUganko('srednja', 97, { strogoSrednja: true });
  const pot = [...E.genPot(u.danosti, E.GEN_SREDNJE)];
  assert.ok(pot.some(ime => ime === 'Naked pair' || ime === 'Hidden pair'), 'par na poti');
  assert.ok(pot.some(ime => ime === 'Naked triple' || ime === 'Hidden triple'), 'trojica na poti');
});

test('neznana stopnja vrže napako', () => {
  assert.throws(() => E.oceniStopnjo('ekstrem', '0'.repeat(81)), /Neznana stopnja/);
});
