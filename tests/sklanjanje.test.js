'use strict';
// Sklanjanje po številu (faza 7, točka 6.7, docs/faza7-nacrt.md): besedila s številom v
// vseh treh aplikacijah. Pričakovane oblike so zapisane po pravilu slovnice (dvojina pri
// 2, množina pri 3 in 4, rodilnik množine pri 0 in 5 ali več – po zadnjih dveh mestih,
// 101 je kot 1), ne prepisane iz kode. Števila: 0–25 in 99–125; pri številu celic v
// mreži (namig golega enojčka in E1) 1–81 – korak ima vsaj eno celico, mreža 81.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Oblika po številu: [1, 2, 3–4, 0 in 5+] po n % 100.
const oblika = (n, [ena, dve, triStiri, pet]) => {
  const m = n % 100;
  return m === 1 ? ena : m === 2 ? dve : m === 3 || m === 4 ? triStiri : pet;
};
const STEVILA = [...Array(26).keys(), ...Array.from({ length: 27 }, (_, i) => 99 + i)];
const CELICE = Array.from({ length: 81 }, (_, i) => i + 1);

// Vrstni red kot <script> v igra/index.html in trening/index.html.
const IGRA = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
  'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'igra/shramba.js', 'igra/igra.js'];
const TRENING = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

const igra = loadContext(IGRA, makeDom().globals).run;
const trening = loadContext(TRENING, makeDom().globals).run;

test('»42 korakov« v kartici zbirke (zbirkaStKorakov)', () => {
  for (const n of STEVILA) {
    assert.equal(igra(`zbirkaStKorakov(${n})`), `${n} ${oblika(n, ['korak', 'koraka', 'koraki', 'korakov'])}`, `n = ${n}`);
  }
});

test('»Ocenjeno: 5 ugank« v igri (stUgank)', () => {
  for (const n of STEVILA) {
    assert.equal(igra(`stUgank(${n})`), `${n} ${oblika(n, ['uganka', 'uganki', 'uganke', 'ugank'])}`, `n = ${n}`);
  }
});

test('namig golega enojčka »V mreži sta 2 celici …« (stepHint)', () => {
  for (const n of CELICE) {
    const glagol = oblika(n, ['je', 'sta', 'so', 'je']);
    const celic = oblika(n, ['celica', 'celici', 'celice', 'celic']);
    assert.equal(igra(`stepHint({ technique: 'Gol enojček', hint: { count: ${n} } })`),
      `V mreži ${glagol} ${n} ${celic} z enim samim kandidatom.`, `n = ${n}`);
  }
});

test('»manjkata še 2 izbrisa« v »Vadi v uganki« (steviloIzbrisov, manjkaIzbrisov)', () => {
  for (const n of STEVILA) {
    const izbris = `${n} ${oblika(n, ['izbris', 'izbrisa', 'izbrisi', 'izbrisov'])}`;
    assert.equal(trening(`steviloIzbrisov(${n})`), izbris, `n = ${n}`);
    assert.equal(trening(`manjkaIzbrisov(${n})`), `${oblika(n, ['manjka', 'manjkata', 'manjkajo', 'manjka'])} še ${izbris}`, `n = ${n}`);
  }
});

test('namig E1 »… so 3 celice, v katerih …« (celicZEnoStevko)', () => {
  for (const n of CELICE) {
    const glagol = oblika(n, ['je', 'sta', 'so', 'je']);
    const celic = oblika(n, ['celica', 'celici', 'celice', 'celic']);
    const v = oblika(n, ['v kateri', 'v katerih', 'v katerih', 'v katerih']);
    assert.equal(trening(`celicZEnoStevko(${n})`), `${glagol} ${n} ${celic}, ${v} je mogoča samo ena števka`, `n = ${n}`);
  }
});

test('»Prejšnji koraki so že izbrisali 5 kandidatov …« (prejOdstranjenihBesedilo)', () => {
  assert.equal(trening('prejOdstranjenihBesedilo(0)'), 'Prejšnji koraki niso izbrisali nobenega kandidata.');
  for (const n of STEVILA.filter(n => n > 0)) {
    const kandidat = oblika(n, ['kandidata', 'kandidata', 'kandidate', 'kandidatov']);
    assert.equal(trening(`prejOdstranjenihBesedilo(${n})`), `Prejšnji koraki so že izbrisali ${n} ${kandidat} – niso del naloge.`, `n = ${n}`);
    assert.equal(trening(`prejOdstranjenihBesedilo(${n}, true)`), `Prečrtane kandidate (${n}) so izbrisali prejšnji koraki – niso del naloge.`, `n = ${n}`);
  }
});
