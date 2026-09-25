'use strict';
// Banka vaj (shared/vaje-banka.js, docs/trening-v-uganki-nacrt.md, del 3): vsak zapis
// je ponovljiv iz semena, ima eno rešitev, pravo stopnjo in natanko izračunani seznam
// tehnik; vsaka tehnika ima vsaj 50 ugank.
//
// Banko ustvari tools/ustvari-banko-vaj.js. Sprememba motorja ali generatorja jo lahko
// pokvari - takrat jo ustvari znova z orodjem, datoteke in tega testa ne popravljaj ročno.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js'],
  names: ['VAJE_BANKA', 'genMinimalnaUganka', 'tehnikeVUganki', 'oceniTezavnost', 'imeTehnike'],
});

const NA_TEHNIKO = 50;
const ZNOVA = 'ustvari banko znova: node tools/ustvari-banko-vaj.js';
const TEHNIKE = E.ALL_TECHNIQUES.map(([k]) => k);
const banka = E.VAJE_BANKA;

function steviloPoTehnikah() {
  const n = Object.fromEntries(TEHNIKE.map(k => [k, 0]));
  for (const z of banka) for (const k of z.tehnike) n[k]++;
  return n;
}

test('banka: oblika zapisov, urejeno po semenu, semena se ne ponavljajo', () => {
  assert.ok(Array.isArray(banka) && banka.length > 0);
  for (let i = 0; i < banka.length; i++) {
    const z = banka[i];
    assert.deepEqual(Object.keys(z), ['seme', 'danosti', 'stopnja', 'tehnike'], `zapis ${i}`);
    assert.ok(Number.isInteger(z.seme) && z.seme > 0, `zapis ${i}`);
    assert.match(z.danosti, /^[0-9]{81}$/, `seme ${z.seme}`);
    if (i > 0) assert.ok(banka[i - 1].seme < z.seme, `urejeno po semenu, strogo naraščajoče (seme ${z.seme})`);
  }
});

test('banka: seme da iste danosti, uganka ima natanko eno rešitev', () => {
  for (const z of banka) {
    assert.equal(E.genMinimalnaUganka(z.seme), z.danosti, `seme ${z.seme} - ${ZNOVA}`);
    assert.equal(E.countSolutions(z.danosti), 1, `seme ${z.seme}`);
  }
});

test('banka: tehnike so natanko tehnikeVUganki(), stopnja je oceniTezavnost()', () => {
  for (const z of banka) {
    const t = E.tehnikeVUganki(z.danosti);
    assert.deepEqual([...z.tehnike], [...t.tehnike], `seme ${z.seme} - ${ZNOVA}`);
    assert.equal(z.stopnja, t.stopnja, `seme ${z.seme} - ${ZNOVA}`);
    assert.equal(z.stopnja, E.oceniTezavnost(z.danosti).tezavnost, `seme ${z.seme}`);
  }
});

test('banka: tehnike so ključi ALL_TECHNIQUES po vrstnem redu, imeTehnike() jih prevede', () => {
  for (const z of banka) {
    assert.ok(z.tehnike.length > 0, `seme ${z.seme}`);
    const red = [...z.tehnike].map(k => TEHNIKE.indexOf(k));
    assert.ok(red.every(i => i >= 0), `seme ${z.seme}: neznan ključ`);
    assert.deepEqual(red, [...red].sort((a, b) => a - b), `seme ${z.seme}: vrstni red`);
    for (const k of z.tehnike) assert.notEqual(E.imeTehnike(k), k, `${k} nima imena za prikaz`);
  }
});

test(`banka: vsaka tehnika ima vsaj ${NA_TEHNIKO} ugank, odvečnih zapisov ni`, () => {
  const n = steviloPoTehnikah();
  for (const k of TEHNIKE) assert.ok(n[k] >= NA_TEHNIKO, `${k}: ${n[k]} ugank - ${ZNOVA}`);
  // Orodje odstrani zapis, pri katerem imajo vse tehnike več kot NA_TEHNIKO ugank.
  for (const z of banka) {
    assert.ok(z.tehnike.some(k => n[k] === NA_TEHNIKO), `seme ${z.seme} je odveč - ${ZNOVA}`);
  }
});
