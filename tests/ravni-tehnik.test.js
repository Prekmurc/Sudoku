'use strict';
// Raven tehnike (faza 7, korak 5 – docs/faza7-nacrt.md, točka 1.1): barva oznake koraka tagClass()
// za vse ključe, ki jih da solve(), in ravni v vrstnem redu ALL_TECHNIQUES. Pričakovane vrednosti so
// iz tabele ravni (E1, E2 lahka, 1–6 srednja, 7–12 napredna, ekspertne še ni), ne iz kode. Test je
// napisan pred spremembo in je bil zelen na stari kodi (tagClass() po imenih, ravni GEN_* v
// shared/generator.js).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/zbirka.js', 'shared/zbirka-ui.js'],
  names: ['tagClass', 'TEZAVNOSTI', 'ZNACKA_TEZAVNOSTI', 'TECHNIQUE_GROUPS', 'TRENING_ENOJCKA', 'TRENING_TEHNIKE', 'RAVNI_TEHNIK', 'ravenTehnike',
    'GEN_LAHKE', 'GEN_PRESEKI', 'GEN_PARI', 'GEN_TROJICE', 'GEN_SREDNJE', 'GEN_NAPREDNE', 'GEN_EKSPERTNE'],
});

// Tabela ravni v vrstnem redu tehnik (E1, E2, 1–12).
const LAHKE = ['Gol enojček', 'Skriti enojček'];
const SREDNJE = ['Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'Hidden pair', 'Naked triple', 'Hidden triple'];
const NAPREDNE = ['X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle'];
const RAZRED = new Map([
  ...LAHKE.map(t => [t, 't-single']),
  ...SREDNJE.map(t => [t, 't-pair']),
  ...NAPREDNE.map(t => [t, 't-advanced']),
]);
const KLJUCI = [...E.ALL_TECHNIQUES.map(([ime]) => ime)]; // polje iz konteksta testa (deepEqual primerja prototip)

test('tagClass(): 14 tehnik po ravni, poskus nov in star, OBSTALO, NAPAKA, neznan ključ', () => {
  assert.deepEqual(KLJUCI, [...LAHKE, ...SREDNJE, ...NAPREDNE], 'tabela pokrije vse tehnike motorja');
  for (const t of KLJUCI) assert.equal(E.tagClass(t), RAZRED.get(t), t);
  assert.equal(E.tagClass('Poskus in protislovje (forcing chain)'), 't-chain', 'poskus');
  assert.equal(E.tagClass('Poskus in protislovje (V1S1 = 5)'), 't-chain', 'star zapis poskusa s celico');
  assert.equal(E.tagClass('OBSTALO'), 't-basic');
  assert.equal(E.tagClass('NAPAKA'), 't-basic');
  assert.equal(E.tagClass('Neznana tehnika'), 't-basic');
});

test('tagClass(): vsak ključ iz dnevnika solve() na ugankah iz docs/uganke.md', () => {
  const kljuci = new Set();
  for (const p of loadPuzzles()) for (const k of E.solve(p.danosti.replace(/\./g, '0')).log) kljuci.add(k.technique);
  assert.ok(kljuci.size >= 10, `ključev: ${kljuci.size}`);
  for (const k of kljuci) {
    const pricakovano = RAZRED.get(k) || (k.startsWith('Poskus in protislovje') ? 't-chain' : 't-basic');
    assert.equal(E.tagClass(k), pricakovano, k);
  }
});

test('ravni v vrstnem redu ALL_TECHNIQUES (GEN_* v shared/generator.js)', () => {
  assert.deepEqual([...E.GEN_LAHKE], LAHKE);
  assert.deepEqual([...E.GEN_SREDNJE], SREDNJE);
  assert.deepEqual([...E.GEN_NAPREDNE], NAPREDNE);
  assert.deepEqual([...E.GEN_EKSPERTNE], []);
  assert.deepEqual([...E.GEN_LAHKE, ...E.GEN_SREDNJE, ...E.GEN_NAPREDNE, ...E.GEN_EKSPERTNE], KLJUCI,
    'ravni skupaj so ALL_TECHNIQUES v istem vrstnem redu');
  // Ožje delitve za strogoSrednja so skupaj srednja raven.
  assert.deepEqual([...E.GEN_PRESEKI, ...E.GEN_PARI, ...E.GEN_TROJICE], SREDNJE);
});

test('TECHNIQUE_GROUPS: vsaka skupina je v eni ravni, skupine so zaporedni odseki ALL_TECHNIQUES', () => {
  const ravni = [E.GEN_LAHKE, E.GEN_SREDNJE, E.GEN_NAPREDNE, E.GEN_EKSPERTNE];
  for (const g of E.TECHNIQUE_GROUPS) {
    assert.equal(ravni.filter(r => g.every(t => r.includes(t))).length, 1, g.join(', '));
  }
  assert.deepEqual([...E.TECHNIQUE_GROUPS.flat()], KLJUCI);
});

// XY-veriga, korak 2 (docs/xy-veriga-nacrt.md, razdelek 7, O5): ekspertna raven dobi svojo barvo
// (turkizna, .tag.t-expert), značka težavnosti »Ekstrem« ni več rdeča kot »Presega tehnike«. Tehnike
// v ekspertni ravni še ni, zato jo test za ta primer doda sam in jo nato odstrani. Pred spremembo je bil
// test zelen z današnjim pričakovanjem (ekspertna raven t-basic, »Ekstrem« enak »Presega tehnike«).
test('razred ravni: tehnika v ekspertni ravni dobi t-expert', () => {
  E.RAVNI_TEHNIK.ekspertna.push('XY-Chain');
  try {
    assert.equal(E.ravenTehnike('XY-Chain'), 'ekspertna');
    assert.equal(E.tagClass('XY-Chain'), 't-expert');
  } finally {
    E.RAVNI_TEHNIK.ekspertna.pop();
  }
  assert.equal(E.tagClass('XY-Chain'), 't-basic', 'zunaj ravni');
});

test('značka težavnosti: »Ekstrem« ni »Presega tehnike«, vsaka stopnja ima razred svoje ravni', () => {
  const razred = t => E.ZNACKA_TEZAVNOSTI[t] || 't-chain';
  assert.notEqual(razred('Ekstrem'), razred('Presega tehnike'));
  assert.equal(razred('Ekstrem'), 't-expert znacka-ekstrem');
  for (const t of ['Presega tehnike', 'Več rešitev', 'Brez rešitve']) assert.equal(razred(t), 't-chain', t);
  assert.equal(razred('Lahka'), 't-single');
  assert.equal(razred('Srednja'), 't-pair');
  assert.equal(razred('Težka'), 't-advanced');
  assert.equal(razred('Zelo težka'), 't-advanced znacka-zelo-tezka');
  for (const t of Object.keys(E.ZNACKA_TEZAVNOSTI)) assert.ok(E.TEZAVNOSTI.includes(t), t);
});

// Po spremembi (RAVNI_TEHNIK in ravenTehnike() v shared/engine.js - edini vir ravni).
test('RAVNI_TEHNIK in ravenTehnike(): ravni v vrstnem redu tehnik, GEN_* so iste ravni', () => {
  assert.deepEqual(Object.keys(E.RAVNI_TEHNIK), ['lahka', 'srednja', 'napredna', 'ekspertna']);
  assert.deepEqual([...E.RAVNI_TEHNIK.lahka], LAHKE);
  assert.deepEqual([...E.RAVNI_TEHNIK.srednja], SREDNJE);
  assert.deepEqual([...E.RAVNI_TEHNIK.napredna], NAPREDNE);
  assert.deepEqual([...E.RAVNI_TEHNIK.ekspertna], []);
  assert.equal(E.GEN_LAHKE, E.RAVNI_TEHNIK.lahka);
  assert.equal(E.GEN_SREDNJE, E.RAVNI_TEHNIK.srednja);
  assert.equal(E.GEN_NAPREDNE, E.RAVNI_TEHNIK.napredna);
  assert.equal(E.GEN_EKSPERTNE, E.RAVNI_TEHNIK.ekspertna);
  for (const t of LAHKE) assert.equal(E.ravenTehnike(t), 'lahka', t);
  for (const t of SREDNJE) assert.equal(E.ravenTehnike(t), 'srednja', t);
  for (const t of NAPREDNE) assert.equal(E.ravenTehnike(t), 'napredna', t);
  for (const k of ['Poskus in protislovje (forcing chain)', 'Poskus in protislovje (V1S1 = 5)', 'OBSTALO', 'NAPAKA', 'Neznana tehnika', undefined]) {
    assert.equal(E.ravenTehnike(k), null, String(k));
  }
});

// Značka kartice v trening/index.html je nadomestek - trening.js jo izpolni iz ravenTehnike();
// v HTML mora biti enaka (nadomestni DOM nima querySelector, izpolnitev v pravem brskalniku
// preverja tools/preveri-faza7-brskalnik.js --korak 5).
test('značke v trening/index.html so enake ravenTehnike()', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const znacke = new Map([...html.matchAll(/data-mode="([^"]+)">\s*<span class="badge badge-(\w+)">([^<]+)<\/span>/g)]
    .map(m => [m[1], [m[2], m[3]]]));
  const vaje = [...E.TRENING_ENOJCKA, ...E.TRENING_TEHNIKE];
  assert.equal(znacke.size, vaje.length);
  for (const [m, t] of vaje) {
    const r = E.ravenTehnike(t);
    assert.deepEqual(znacke.get(m), [r, r.toUpperCase()], m);
  }
});
