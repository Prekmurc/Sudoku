'use strict';
// Vrnitev iz vaje na izbiro tehnike (trening/trening.js, popravek po pregledu koraka 1 faze 3a,
// docs/faza3a-nacrt.md, razdelek 8): »Nazaj na izbiro« obnovi položaj menija ob odhodu v vajo -
// seznam ostane pri tehniki, iz katere si prišel (prej je skočil na začetek, E1). Nadomestni DOM
// nima kartic menija (querySelector vrne null), zato tu samo položaj strani; da je kartica v
// oknu, preverja tools/preveri-sheme-brskalnik.js v pravem brskalniku. Ob vstopu v vajo je stran na
// vrhu (popravek pred korakom 2 – prej je ostal položaj menija in glava je bila odrezana).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

test('»Nazaj na izbiro« obnovi položaj menija ob odhodu v vajo (Spoznaj in Vadi v uganki)', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0; // iskanje vaje »Vadi v uganki« ni potrebno
  const { run } = loadContext(DATOTEKE, dom.globals);
  const okno = dom.globals.window;

  okno.scrollY = 1334;
  run('zacniKrog("hidden-triple", "spoznaj")');
  assert.equal(okno.scrollY, 0, 'vaja začne na vrhu strani');
  okno.scrollTo(0, 150); // stran z vajo je krajša - brskalnik položaj zmanjša
  run('exNum++; renderExercise()');
  dom.klikni('backBtn');
  assert.equal(okno.scrollY, 1334, 'Spoznaj: položaj kot ob odhodu');
  assert.equal(dom.el('menu').style.display, 'block');

  okno.scrollY = 820;
  run('zacniKrog("x-wing", "uganka")');
  assert.equal(okno.scrollY, 0, 'Vadi v uganki: vaja začne na vrhu strani');
  dom.klikni('backBtn');
  assert.equal(okno.scrollY, 820, 'Vadi v uganki: položaj kot ob odhodu');

  // Na vrhu menija ostane vrh.
  okno.scrollY = 0;
  run('zacniKrog("naked-single", "spoznaj")');
  okno.scrollTo(0, 300);
  dom.klikni('backBtn');
  assert.equal(okno.scrollY, 0);
});
