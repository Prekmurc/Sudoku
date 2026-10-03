'use strict';
// Banka vaj (shared/vaje-banka.js, docs/trening-v-uganki-nacrt.md, del 3;
// docs/vadi-v-uganki-nacrt.md, točka 16): vsak zapis je ponovljiv iz semena, ima eno
// rešitev, pravo stopnjo in natanko izračunani seznam tehnik; vsaka tehnika ima vsaj 50
// rešljivih ugank (ne "Presega tehnike") in uganke osnovne stopnje (stopnjaTehnike());
// noben zapis ni odveč po pravilu orodja tools/ustvari-banko-vaj.js.
//
// Banko ustvari tools/ustvari-banko-vaj.js. Sprememba motorja ali generatorja jo lahko
// pokvari - takrat jo ustvari znova z orodjem, datoteke in tega testa ne popravljaj ročno.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js'],
  names: ['VAJE_BANKA', 'genMinimalnaUganka', 'tehnikeVUganki', 'oceniTezavnost', 'imeTehnike', 'stopnjaTehnike', 'OCENA_PRESEGA',
    'vecCelicVStanjih', 'delezVecCelic'],
});

const NA_TEHNIKO = 50;
const ZNOVA = 'ustvari banko znova: node tools/ustvari-banko-vaj.js';
const TEHNIKE = E.ALL_TECHNIQUES.map(([k]) => k);
const banka = E.VAJE_BANKA;

// Tri štetja po tehnikah kot v orodju: osnovne stopnje, rešljive, vse.
const STETJA = {
  osnovna: (z, k) => z.stopnja === E.stopnjaTehnike(k),
  resljiva: z => z.stopnja !== E.OCENA_PRESEGA,
  vse: () => true,
};
function stetja() {
  const n = Object.fromEntries(Object.keys(STETJA).map(s => [s, Object.fromEntries(TEHNIKE.map(k => [k, 0]))]));
  for (const z of banka) for (const [s, pogoj] of Object.entries(STETJA)) for (const k of z.tehnike) if (pogoj(z, k)) n[s][k]++;
  return n;
}

test('banka: oblika zapisov, urejeno po semenu, semena se ne ponavljajo', () => {
  assert.ok(Array.isArray(banka) && banka.length > 0);
  for (let i = 0; i < banka.length; i++) {
    const z = banka[i];
    assert.deepEqual(Object.keys(z), ['seme', 'danosti', 'stopnja', 'tehnike', 'vecCelic'], `zapis ${i}`);
    // vecCelic: za vsako tehniko par [korakov, z isto števko iz 2+ celic].
    assert.equal(z.vecCelic.length, z.tehnike.length, `seme ${z.seme}: vecCelic vzporedno s tehnike`);
    for (const [korakov, vec] of z.vecCelic) assert.ok(Number.isInteger(korakov) && korakov > 0 && Number.isInteger(vec) && vec >= 0 && vec <= korakov, `seme ${z.seme}`);
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

test(`banka: vsaka tehnika ima vsaj ${NA_TEHNIKO} rešljivih ugank in uganke osnovne stopnje, odvečnih zapisov ni`, () => {
  const n = stetja();
  for (const k of TEHNIKE) {
    assert.ok(n.resljiva[k] >= NA_TEHNIKO, `${k}: ${n.resljiva[k]} rešljivih ugank - ${ZNOVA}`);
    assert.ok(n.osnovna[k] > 0, `${k}: nobene uganke osnovne stopnje (${E.stopnjaTehnike(k)}) - ${ZNOVA}`);
  }
  // Brez "Presega tehnike", ker ima vsaka tehnika dovolj rešljivih ugank.
  assert.ok(banka.every(z => z.stopnja !== E.OCENA_PRESEGA), 'v banki ni ugank Presega tehnike');
  // Orodje odstrani zapis, ki ni potreben za nobeno štetje (štetje bi brez njega ostalo
  // vsaj NA_TEHNIKO) nobene svoje tehnike.
  for (const z of banka) {
    const potreben = Object.entries(STETJA).some(([s, pogoj]) => z.tehnike.some(k => pogoj(z, k) && n[s][k] <= NA_TEHNIKO));
    assert.ok(potreben, `seme ${z.seme} je odveč - ${ZNOVA}`);
  }
});

// Polje vecCelic (točka 18 v docs/vadi-v-uganki-nacrt.md) se preveri na vzorcu - prvih 20
// ugank vsake tehnike (vse bi trajalo pribl. 60 s); delež tehnike je seštevek čez zapise.
const VZOREC = 20;
test(`banka: vecCelic na vzorcu ${VZOREC} ugank na tehniko je natanko vecCelicVStanjih(); deleži 1-12 med 0 in 1`, () => {
  for (const k of TEHNIKE) {
    const zapisi = banka.filter(z => z.tehnike.includes(k)).slice(0, VZOREC);
    for (const z of zapisi) {
      assert.deepEqual([...z.vecCelic[z.tehnike.indexOf(k)]], [...E.vecCelicVStanjih(z.danosti, k)], `seme ${z.seme}, ${k} - ${ZNOVA}`);
    }
    const d = E.delezVecCelic(banka, k);
    assert.ok(d !== null && d >= 0 && d <= 1, `${k}: delež ${d}`);
  }
});
