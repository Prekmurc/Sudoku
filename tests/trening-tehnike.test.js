'use strict';
// Številke tehnik iz treninga (TRENING_TEHNIKE v shared/engine.js): seznam se mora ujemati
// s karticami v trening/index.html in z MODES v trening/generators.js, vsebovati mora vse
// tehnike iz ALL_TECHNIQUES razen enojčkov; oznaka "tehnike: 1, 3, 7" v zbirki
// (zbirkaOznakaTehnik v shared/zbirka.js).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['trening/generators.js', 'shared/zbirka.js'],
  names: ['TRENING_TEHNIKE', 'MODES', 'zbirkaOznakaTehnik', 'zbirkaPodatkiResevanja',
    'TEHNIKE_OPISI', 'opisVaje', 'opisTehnike'],
});

const treningHtml = fs.readFileSync(path.join(__dirname, '..', 'trening', 'index.html'), 'utf8');
const kartice = [...treningHtml.matchAll(/class="menu-card" data-mode="([^"]+)"/g)].map(m => m[1]);
// Naslov kartice v meniju: data-mode -> besedilo <h3>.
const naslovi = new Map([...treningHtml.matchAll(/data-mode="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)].map(m => [m[1], m[2]]));
const nacini = E.TRENING_TEHNIKE.map(([m]) => m);
const imena = E.TRENING_TEHNIKE.map(([, t]) => t);
const ENOJCKA = ['Gol enojček', 'Skriti enojček'];

test('TRENING_TEHNIKE se ujema s karticami v trening/index.html in z MODES', () => {
  assert.equal(new Set(nacini).size, nacini.length, 'oznaka kartice se ponovi');
  assert.deepEqual([...kartice].sort(), [...nacini].sort(), 'kartice v HTML');
  assert.deepEqual(Object.keys(E.MODES).sort(), [...nacini].sort(), 'MODES v generators.js');
});

test('TRENING_TEHNIKE vsebuje vse tehnike iz ALL_TECHNIQUES razen enojčkov, vsako enkrat', () => {
  assert.equal(new Set(imena).size, imena.length, 'tehnika se ponovi');
  const vse = E.ALL_TECHNIQUES.map(([t]) => t);
  for (const t of imena) assert.ok(vse.includes(t), `${t} ni v ALL_TECHNIQUES`);
  for (const t of vse) {
    if (!ENOJCKA.includes(t)) assert.ok(imena.includes(t), `${t} nima številke v treningu`);
  }
});

test('zbirkaOznakaTehnik(): številke iz treninga, brez enojčkov, poskus posebej', () => {
  const oznaka = tehnike => E.zbirkaOznakaTehnik({ tehnike });
  const st = ime => imena.indexOf(ime) + 1;
  assert.equal(E.zbirkaOznakaTehnik({}), 'tehnike: ni podatkov');
  assert.equal(E.zbirkaOznakaTehnik({ tehnike: null }), 'tehnike: ni podatkov');
  assert.equal(oznaka([]), 'tehnike: samo enojčki');
  assert.equal(oznaka([['Skriti enojček', 30], ['Gol enojček', 20]]), 'tehnike: samo enojčki');
  assert.equal(oznaka([['Skriti enojček', 9], ['X-Wing', 1], ['Naked pair', 2]]),
    `tehnike: ${st('Naked pair')}, ${st('X-Wing')}`);
  assert.equal(oznaka([['Gol enojček', 5], ['Poskus in protislovje (forcing chain)', 1]]), 'tehnike: samo enojčki + poskus');
  assert.equal(oznaka([['Turbot Fish', 2], ['Poskus in protislovje (forcing chain)', 3]]),
    `tehnike: ${st('Turbot Fish')} + poskus ×3`);
  assert.equal(oznaka([['Pointing pair/triple', 1], ['Stara tehnika', 1]]), `tehnike: ${st('Pointing pair/triple')}, Stara tehnika`);
});

test('zbirkaOznakaTehnik() na ugankah iz docs/uganke.md: vsaka uporabljena tehnika ima številko', () => {
  for (const p of loadPuzzles()) {
    const { board, log } = E.solve(p.danosti.replace(/\./g, '0'));
    const z = E.zbirkaPodatkiResevanja(board, log);
    const o = E.zbirkaOznakaTehnik(z);
    assert.match(o, /^tehnike: (samo enojčki|\d+(, \d+)*)( \+ poskus( ×\d+)?)?$/, `${p.ime}: ${o}`);
    const poskus = z.tehnike.some(([t]) => t.includes('protislovje'));
    assert.equal(o.includes('+ poskus'), poskus, `${p.ime}: ${o}`);
  }
});

/* ---------- opisi tehnik (TEHNIKE_OPISI v shared/engine.js) ---------- */

test('TEHNIKE_OPISI: vsaka tehnika iz treninga ima ime in razlago, besedili za vajo in za pomoč nista prazni', () => {
  assert.deepEqual(Object.keys(E.TEHNIKE_OPISI).sort(), [...nacini].sort());
  for (const kljuc of nacini) {
    const o = E.TEHNIKE_OPISI[kljuc];
    assert.ok(o.ime && o.razlaga, `${kljuc}: ime in razlaga`);
    assert.equal(o.razlaga.trim(), o.razlaga, `${kljuc}: razlaga brez odvečnih presledkov`);
    assert.ok(E.opisVaje(kljuc).startsWith(o.razlaga), `${kljuc}: besedilo vaje se začne z razlago`);
    assert.ok(E.opisTehnike(kljuc).startsWith(o.razlaga), `${kljuc}: besedilo pomoči se začne z razlago`);
    // V oknu Pomoč mora razlaga povedati tudi, kaj iz vzorca sledi (izbris ali vpis).
    assert.match(E.opisTehnike(kljuc), /izbriš|izbrišemo/, `${kljuc}: pomoč pove, kaj se izbriše`);
  }
});

test('TEHNIKE_OPISI: ime je enako naslovu kartice v trening/index.html, MODES.desc je opisVaje()', () => {
  for (const kljuc of nacini) {
    assert.equal(E.TEHNIKE_OPISI[kljuc].ime, naslovi.get(kljuc), `${kljuc}: naslov kartice`);
    assert.equal(E.MODES[kljuc].desc, E.opisVaje(kljuc), `${kljuc}: MODES.desc`);
  }
});

test('TEHNIKE_OPISI: izraz je povsod "števka", ne "številka"', () => {
  for (const kljuc of nacini) {
    const o = E.TEHNIKE_OPISI[kljuc];
    for (const [polje, t] of Object.entries(o)) {
      assert.doesNotMatch(t, /številk/i, `${kljuc}.${polje}`);
    }
  }
});
