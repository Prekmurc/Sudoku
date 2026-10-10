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
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'];

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

// »Nazaj na izbiro« tudi na dnu vaje (naloga 4c, korak 1, O6 v docs/navigacija-nacrt.md): drugi gumb je
// v #trainer za #exerciseArea (zunaj vaje, zato ga nov izris vaje ne pobriše), z istim napisom; učinek je
// enak zgornjemu. Da je pod kartico in v oknu, preverja tools/preveri-navigacija-brskalnik.js.
test('»Nazaj na izbiro« na dnu: v HTML za #exerciseArea v #trainer, isti napis kot zgornji', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const trainer = html.slice(html.indexOf('<div id="trainer">'));
  const konec = trainer.indexOf('</div>\n</div>');
  const vsebina = trainer.slice(0, konec);
  const zgoraj = vsebina.match(/<button[^>]*id="backBtn"[^>]*>([^<]*)<\/button>/);
  const spodaj = vsebina.match(/<button[^>]*id="backBtnDno"[^>]*>([^<]*)<\/button>/);
  assert.ok(zgoraj, 'zgornji gumb v #trainer');
  assert.ok(spodaj, 'spodnji gumb v #trainer');
  assert.equal(spodaj[1], zgoraj[1]);
  assert.equal(spodaj[1], '← Nazaj na izbiro');
  assert.ok(vsebina.indexOf('id="backBtnDno"') > vsebina.indexOf('id="exerciseArea"'), 'za #exerciseArea');
  assert.match(spodaj[0], /class="[^"]*\bback-btn\b/);
});

test('»Nazaj na izbiro« na dnu: isti učinek kot zgornji (Spoznaj, Vadi v uganki, Končano!)', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0; // iskanje vaje »Vadi v uganki« ostane v teku
  const { run } = loadContext(DATOTEKE, dom.globals);
  const okno = dom.globals.window;

  okno.scrollY = 1334;
  run('zacniKrog("hidden-triple", "spoznaj")');
  okno.scrollTo(0, 900); // dno vaje
  dom.klikni('backBtnDno');
  assert.equal(okno.scrollY, 1334, 'Spoznaj: položaj menija kot ob odhodu');
  assert.equal(dom.el('menu').style.display, 'block');
  assert.equal(dom.el('trainer').style.display, 'none');
  assert.equal(run('mode'), null);

  okno.scrollY = 820;
  run('zacniKrog("x-wing", "uganka")');
  const iskanje = run('vadiIskanje');
  okno.scrollTo(0, 700);
  dom.klikni('backBtnDno');
  assert.ok(run('vadiIskanje') > iskanje, 'Vadi v uganki: iskanje vaje prekinjeno');
  assert.equal(run('vadi'), null);
  assert.equal(okno.scrollY, 820);
  assert.equal(dom.el('menu').style.display, 'block');

  // »Končano!« – gumb na dnu ostane (je zunaj #exerciseArea) in vrne v meni.
  okno.scrollY = 400;
  run('zacniKrog("naked-pair", "spoznaj")');
  run('exNum = MAX_EX; renderExercise()');
  okno.scrollTo(0, 200);
  dom.klikni('backBtnDno');
  assert.equal(okno.scrollY, 400, 'Končano!: položaj menija kot ob odhodu');
  assert.equal(dom.el('trainer').style.display, 'none');
});
