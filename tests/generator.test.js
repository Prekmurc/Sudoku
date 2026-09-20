'use strict';
// Testi generatorja ugank (shared/generator.js): merilo stopnje, enoličnost rešitve
// in ponovljivost po semenu. Uganke tu niso sestavljene na pamet - ustvari jih
// generator in vsaka je preverjena s countSolutions()/solve() (CLAUDE.md).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/zbirka.js', 'shared/generator.js'],
  names: ['applyStep', 'STOPNJE_UGANK', 'stopnjaUganke', 'ustvariUganko', 'oceniStopnjo',
    'oceniUganko', 'genPot', 'genRazvrsti', 'genTehnikeSolve', 'GEN_ENOJCKI', 'GEN_PRESEKI',
    'GEN_PARI', 'GEN_TROJICE', 'GEN_SREDNJE', 'GEN_NAPREDNE', 'TEZAVNOSTI'],
});

// Semena, pri katerih generator da uganko te stopnje (preverjeno ob pisanju testa;
// seme da vedno isto uganko, zato so testi ponovljivi in hitri).
const SEMENA = { lahka: 1, srednja: 5, tezka: 7, zelotezka: 3 };
const uganke = {};
for (const kljuc of Object.keys(SEMENA)) {
  uganke[kljuc] = E.ustvariUganko(kljuc, SEMENA[kljuc]);
  assert.ok(uganke[kljuc], `seme ${SEMENA[kljuc]} mora dati uganko stopnje ${kljuc}`);
}

// Stopnje, ki jim uganka ustreza po merah iz genRazvrsti(); null = ne reši je nobena
// pot brez ugibanja.
function stopnjeZa(danosti) {
  const m = E.genRazvrsti(danosti);
  // [...] - STOPNJE_UGANK je iz vm konteksta, deepEqual zahteva polje iz tega realma.
  return m ? [...E.STOPNJE_UGANK].filter(s => s.ustreza(m)).map(s => s.kljuc) : null;
}

test('stopnje: ključi, imena in opisi', () => {
  assert.deepEqual([...E.STOPNJE_UGANK].map(s => s.kljuc), ['lahka', 'srednja', 'tezka', 'zelotezka']);
  // Ime stopnje je hkrati težavnost v zbirki: prve štiri vrednosti v TEZAVNOSTI
  // (shared/zbirka.js), da se imeni ne moreta razdvojiti.
  const imena = [...E.STOPNJE_UGANK].map(s => s.ime);
  assert.deepEqual(imena, ['Lahka', 'Srednja', 'Težka', 'Zelo težka']);
  assert.deepEqual([...E.TEZAVNOSTI].slice(0, 4), imena);
  assert.ok([...E.TEZAVNOSTI].includes('Ekstrem'), 'Ekstrem ostane za uganke z ugibanjem');
  for (const s of E.STOPNJE_UGANK) {
    assert.ok(s.ime && s.opis, `stopnja ${s.kljuc} mora imeti ime in opis`);
    assert.equal(typeof s.ustreza, 'function', `stopnja ${s.kljuc} mora imeti merilo`);
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

test('merilo stopnje: mere iz genRazvrsti() ustrezajo natanko svoji stopnji', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const m = E.genRazvrsti(u.danosti);
    assert.ok(m, `${kljuc}: pot brez ugibanja mora uspeti`);
    assert.deepEqual({ skupina: m.skupina, tehNad: m.tehNad, napredne: m.napredne },
      { skupina: u.mere.skupina, tehNad: u.mere.tehNad, napredne: u.mere.napredne },
      `${kljuc}: mere ustvarjene uganke`);
    assert.deepEqual(stopnjeZa(u.danosti), [kljuc], `${kljuc}: ustreza samo svoji stopnji`);
  }
});

test('lahka samo enojčki, srednja para/trojica/presek, težka ena napredna, zelo težka več', () => {
  // lahka: reši se samo z enojčki (brez zapisanih kandidatov).
  assert.ok(E.genPot(uganke.lahka.danosti, E.GEN_ENOJCKI), 'lahko rešijo sami enojčki');
  assert.equal(uganke.lahka.mere.tehNad, 0, 'lahka ne potrebuje tehnike nad enojčki');
  // srednja: samih enojčkov ni dovolj, naprednih ne potrebuje.
  assert.equal(E.genPot(uganke.srednja.danosti, E.GEN_ENOJCKI), null, 'srednje ne rešijo sami enojčki');
  assert.equal(uganke.srednja.mere.napredne, 0, 'srednja ne potrebuje napredne tehnike');
  const sp = [...uganke.srednja.mere.uporabljene];
  assert.ok(sp.some(ime => [...E.GEN_PARI, ...E.GEN_TROJICE, ...E.GEN_PRESEKI].includes(ime)),
    'srednja mora uporabiti paro, trojico ali presek');
  // težka: natanko ena napredna, skupaj največ štiri tehnike nad enojčki.
  assert.equal(uganke.tezka.mere.napredne, 1, 'težka potrebuje natanko eno napredno tehniko');
  assert.ok(uganke.tezka.mere.tehNad <= 4, 'težka ima največ štiri tehnike nad enojčki');
  // zelo težka: dve različni napredni ali pet tehnik nad enojčki.
  const z = uganke.zelotezka.mere;
  assert.ok(z.napredne >= 2 || z.tehNad >= 5, 'zelo težka: dve napredni ali pet tehnik');
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

// Stopnje so tudi popolne: vsaka uganka, ki jo genRazvrsti() razvrsti, pade v natanko
// eno stopnjo. Preverjeno na ugankah iz docs/uganke.md (tiste, ki jih solve() reši
// samo z ugibanjem, ostanejo nerazvrščene).
test('stopnje pokrijejo vsako razvrščeno uganko iz docs/uganke.md', () => {
  let razvrscenih = 0;
  for (const { ime, danosti } of loadPuzzles()) {
    const s = stopnjeZa(danosti);
    if (s === null) continue; // brez ugibanja ni rešljiva
    razvrscenih++;
    assert.equal(s.length, 1, `${ime}: natanko ena stopnja, dobil [${s.join(', ')}]`);
  }
  assert.ok(razvrscenih >= 4, 'vsaj štiri uganke iz docs/uganke.md morajo biti razvrščene');
});

// oceniUganko(): razvrstitev že znane uganke brez ciljne stopnje (gumb "Oceni zbirko").
test('oceniUganko(): težavnost je ime stopnje, ki uganki ustreza', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const o = E.oceniUganko(u.danosti);
    assert.equal(o.stopnja.kljuc, kljuc, `${kljuc}: stopnja`);
    assert.equal(o.tezavnost, E.stopnjaUganke(kljuc).ime, `${kljuc}: težavnost = ime stopnje`);
    assert.ok([...E.TEZAVNOSTI].includes(o.tezavnost), `${kljuc}: težavnost je iz TEZAVNOSTI`);
    assert.ok(o.board.isSolved() && o.log.length, `${kljuc}: vrne rezultat solve()`);
  }
});

test('oceniUganko() na ugankah iz docs/uganke.md: stopnja ali Ekstrem', () => {
  let ekstremov = 0;
  for (const { ime, danosti } of loadPuzzles()) {
    const o = E.oceniUganko(danosti);
    const s = stopnjeZa(danosti);
    if (s === null) {
      // Brez ugibanja ni rešljiva (ali je genRazvrsti ne razvrsti) -> Ekstrem.
      assert.equal(o.stopnja, null, `${ime}: brez stopnje`);
      assert.equal(o.tezavnost, 'Ekstrem', `${ime}: težavnost`);
      ekstremov++;
      continue;
    }
    assert.equal(o.stopnja.kljuc, s[0], `${ime}: ista stopnja kot po merah`);
    assert.equal(o.tezavnost, o.stopnja.ime, `${ime}: težavnost = ime stopnje`);
  }
  assert.ok(ekstremov >= 1, 'vsaj ena uganka iz docs/uganke.md zahteva ugibanje');
});

test('oceniUganko(): uganka, ki jo solve() reši le z ugibanjem, dobi Ekstrem', () => {
  // Vgrajeni "Primer 1 (z ugibanjem)" iz shared/zbirka.js.
  const danosti = '000800020900000600000000000604000900000720003500000000000056000080009000070000010';
  const o = E.oceniUganko(danosti);
  assert.equal(o.stopnja, null);
  assert.equal(o.tezavnost, 'Ekstrem');
});

test('isto seme da vedno isto uganko', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    assert.equal(E.ustvariUganko(kljuc, SEMENA[kljuc]).danosti, u.danosti, kljuc);
    assert.equal(u.seme, SEMENA[kljuc]);
    assert.equal(u.stopnja, kljuc);
  }
});

test('seme 1 da uganko lahka-seme-1 iz docs/uganke.md', () => {
  assert.equal(E.ustvariUganko('lahka', 1).danosti,
    '876000004000000700000200580034010800210069000000305070000000600040076900008000040');
});

// Uganka lahka-seme-197 iz docs/uganke.md je po merilu štirih stopenj (2026-09-20)
// srednja, ne lahka: potrebuje Pointing pair/triple. Iz semena 197 se ne reproducira
// več - merilo lahke je zdaj "samo enojčki", zato na poti odstranjevanja zmaga drug
// kandidat. Uganka v docs/uganke.md ostaja (testne uganke se ne spreminjajo).
test('lahka-seme-197 iz docs/uganke.md je po novem merilu srednja', () => {
  const danosti = '073004002049060800105800000000000026000090370387002000492070600000009050500206907';
  assert.deepEqual(stopnjeZa(danosti), ['srednja']);
  assert.equal(E.genRazvrsti(danosti).skupina, 2, 'najlažja zadostna skupina so preseki');
});

test('seme 97 (strogoSrednja) da uganko, ki ustreza srednji stopnji', () => {
  const u = E.ustvariUganko('srednja', 97, { strogoSrednja: true });
  assert.equal(u.danosti,
    '004007025100003000070800000800090034040005009960000002001006000000000000000004761');
  assert.equal(E.countSolutions(u.danosti), 1);
  assert.deepEqual(stopnjeZa(u.danosti), ['srednja']);
});

test('srednja-a iz docs/uganke.md še ustreza merilu srednje stopnje', () => {
  const danosti = '004007025100003000070800000800090034040005009960000572001006000000000000000004761';
  const o = E.oceniStopnjo('srednja', danosti, { strogoSrednja: true });
  assert.ok(o.ustreza, 'uganka mora ustrezati merilu srednje stopnje');
});

test('strogoSrednja zahteva par in trojico na poti', () => {
  const u = E.ustvariUganko('srednja', 97, { strogoSrednja: true });
  const pot = [...u.mere.uporabljene];
  assert.ok(pot.some(ime => E.GEN_PARI.includes(ime)), 'par na poti');
  assert.ok(pot.some(ime => E.GEN_TROJICE.includes(ime)), 'trojica na poti');
});

test('neznana stopnja vrže napako', () => {
  assert.throws(() => E.oceniStopnjo('ekstrem', '0'.repeat(81)), /Neznana stopnja/);
});
