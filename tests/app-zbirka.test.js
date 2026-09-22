'use strict';
// UI zbirke v reševalcu (app/zbirka.js) v nadomestnem DOM-u (dom-stub.js): gumba
// "Naloži" in "Izbriši" pri uganki v seznamu. Oba sta nekoč v besedilu uporabljala
// spremenljivko, ki ne obstaja, zato je klik vrgel ReferenceError in ni naredil nič.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/zbirka.js', 'app/app.js', 'app/zbirka.js'];
const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');

// Reševalec z eno uganko v zbirki (dodana 21. 9. 2026 ob 16:33). `vprasanja` zbere
// besedila confirm(), `odgovor` pove, kaj confirm() vrne.
function zacni(odgovor = true) {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '' },
  ]));
  const vprasanja = [];
  dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  return { dom, run, vprasanja };
}

// Gumb z danim napisom pri (edini) uganki v seznamu.
function gumb(dom, napis) {
  const li = dom.el('libList').children[0];
  const vrstica = li.children.find(el => el.className === 'lib-actions');
  const b = vrstica.children.find(el => el.textContent === napis);
  assert.ok(b, `gumb »${napis}« obstaja`);
  return b;
}

test('reševalec: »Naloži« vpiše danosti v mrežo in zapre okno', () => {
  const { dom, run } = zacni();
  gumb(dom, 'Naloži').sprozi('click');
  assert.equal(run('currentGivens()'), danosti);
  assert.equal(dom.el('status').textContent, 'Naložena uganka iz zbirke (Težka, dodana 21. 9. 2026 ob 16:33).');
  assert.equal(dom.el('library').style.display, 'none');
});

test('reševalec: »Izbriši« vpraša z datumom in po potrditvi uganko izbriše', () => {
  const { dom, run, vprasanja } = zacni(true);
  gumb(dom, 'Izbriši').sprozi('click');
  assert.deepEqual(vprasanja, ['Izbrišem uganko, dodano 21. 9. 2026 ob 16:33 (Težka)?']);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(dom.el('libStatus').textContent, 'Uganka je izbrisana.');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
});

test('reševalec: »Izbriši« brez potrditve uganko pusti v zbirki', () => {
  const { dom, run, vprasanja } = zacni(false);
  gumb(dom, 'Izbriši').sprozi('click');
  assert.equal(vprasanja.length, 1);
  assert.equal(run('zbirkaBeri().length'), 1);
});
