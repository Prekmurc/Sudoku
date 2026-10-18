'use strict';
// Skupine tehnik za prikaz (naloga 11a, korak 2 – docs/naloga11a-nacrt.md, razdelek 2 in 5.3): SKUPINE_TEHNIK v
// shared/engine.js – sedem skupin z imeni iz odločitve 2026-10-18 (docs/uskladitev.md 1.1), zaporedni odseki
// ALL_TECHNIQUES, vsaka v eni ravni; težavnost skupine iz ravni (tezavnostTehnike()); imeSkupine() z razponi oznak iz
// TRENING_TEHNIKE (zadnja številka ni zapisana dobesedno – 11b doda tehniko). TECHNIQUE_GROUPS (sidranje v nextStep())
// ostane nespremenjen – skupine za prikaz so ločene (O1).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['SKUPINE_TEHNIK', 'skupinaTehnike', 'imeSkupine', 'TECHNIQUE_GROUPS', 'RAVNI_TEHNIK', 'ravenTehnike', 'tezavnostTehnike',
    'TRENING_ENOJCKA', 'TRENING_TEHNIKE', 'oznakaTehnike'],
});
const J = x => JSON.stringify(x);
const KLJUCI = E.ALL_TECHNIQUES.map(([k]) => k);
const SKUPINE = [...E.SKUPINE_TEHNIK];

test('SKUPINE_TEHNIK: sedem skupin z imeni in angleškimi imeni iz odločitve 2026-10-18', () => {
  assert.deepEqual(J(SKUPINE.map(s => [s.kljuc, s.ime, s.anglesko])), J([
    ['enojcki', 'Enojčki', 'Singles'],
    ['preseki', 'Preseki', 'Intersections'],
    ['podmnozice', 'Podmnožice', 'Subsets'],
    ['ribe', 'Ribji vzorci', 'Fish'],
    ['kratke-verige', 'Kratke verige', 'Short Chains'],
    ['edinstvenost', 'Edinstvenost', 'Uniqueness'],
    ['dolge-verige', 'Dolge verige', 'Long Chains'],
  ]));
});

test('SKUPINE_TEHNIK: vsaka tehnika v natanko eni skupini, zaporedni odseki ALL_TECHNIQUES, poskus ni v nobeni', () => {
  assert.deepEqual(J(SKUPINE.flatMap(s => s.tehnike)), J(KLJUCI), 'skupine skupaj = ALL_TECHNIQUES v vrstnem redu');
  for (const s of SKUPINE) assert.ok(s.tehnike.length > 0, s.kljuc);
  assert.ok(!SKUPINE.some(s => s.tehnike.some(t => t.startsWith('Poskus'))), 'poskus s protislovjem ni v skupini');
  // Tabela iz odločitve (oznake), dolge verige do zadnje tehnike.
  const oznaka = t => E.oznakaTehnike([...E.TRENING_ENOJCKA, ...E.TRENING_TEHNIKE].find(([, k]) => k === t)[0]);
  assert.deepEqual(J(SKUPINE.slice(0, 6).map(s => s.tehnike.map(oznaka))),
    J([['E1', 'E2'], ['1', '2'], ['3', '4', '5', '6'], ['7', '8'], ['9', '10', '11'], ['12']]));
  assert.equal(SKUPINE[6].tehnike[0], 'XY-Chain', 'do 11b ima »Dolge verige« samo XY-verigo');
});

test('SKUPINE_TEHNIK: vse tehnike skupine v isti ravni; težavnost skupin Lahka, Srednja, Srednja, Težka ×3, Ekstremna', () => {
  for (const s of SKUPINE) {
    const ravni = new Set(s.tehnike.map(t => E.ravenTehnike(t)));
    assert.equal(ravni.size, 1, `${s.kljuc}: ena raven`);
  }
  assert.deepEqual(J(SKUPINE.map(s => E.tezavnostTehnike(s.tehnike[0]).ime)),
    J(['Lahka', 'Srednja', 'Srednja', 'Težka', 'Težka', 'Težka', 'Ekstremna']));
});

test('skupinaTehnike(): skupina po ključu ALL_TECHNIQUES; poskus, OBSTALO, neznan ključ → null', () => {
  for (const s of SKUPINE) for (const t of s.tehnike) assert.equal(E.skupinaTehnike(t), s, t);
  assert.equal(E.skupinaTehnike('Hidden triple').kljuc, 'podmnozice');
  assert.equal(E.skupinaTehnike('Poskus in protislovje (forcing chain)'), null);
  assert.equal(E.skupinaTehnike('OBSTALO'), null);
  assert.equal(E.skupinaTehnike('Neznana'), null);
});

test('imeSkupine(): »Podmnožice (Subsets)«, s številkami razpon oznak (»· 3–6«, ena tehnika »· 12«), tudi po ključu skupine', () => {
  const ime = s => E.imeSkupine(s);
  const sStevilkami = s => E.imeSkupine(s, { stevilke: true });
  assert.deepEqual(J(SKUPINE.map(ime)), J(['Enojčki (Singles)', 'Preseki (Intersections)', 'Podmnožice (Subsets)',
    'Ribji vzorci (Fish)', 'Kratke verige (Short Chains)', 'Edinstvenost (Uniqueness)', 'Dolge verige (Long Chains)']));
  const zadnja = String(E.TRENING_TEHNIKE.length);
  const dolge = SKUPINE[6].tehnike.length > 1 ? `${E.TRENING_TEHNIKE.length - SKUPINE[6].tehnike.length + 1}–${zadnja}` : zadnja;
  assert.deepEqual(J(SKUPINE.map(sStevilkami)), J(['Enojčki (Singles) · E1–E2', 'Preseki (Intersections) · 1–2',
    'Podmnožice (Subsets) · 3–6', 'Ribji vzorci (Fish) · 7–8', 'Kratke verige (Short Chains) · 9–11',
    'Edinstvenost (Uniqueness) · 12', `Dolge verige (Long Chains) · ${dolge}`]));
  assert.equal(E.imeSkupine('podmnozice', { stevilke: true }), 'Podmnožice (Subsets) · 3–6', 'po ključu skupine');
});

test('TECHNIQUE_GROUPS (sidranje v nextStep()) je nespremenjen – skupine za prikaz so ločene (O1)', () => {
  assert.deepEqual(J(E.TECHNIQUE_GROUPS), J([
    ['Gol enojček', 'Skriti enojček'],
    ['Pointing pair/triple', 'Box-line reduction'],
    ['Naked pair', 'Hidden pair'],
    ['Naked triple', 'Hidden triple'],
    ['X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle'],
    ['XY-Chain'],
  ]));
});
