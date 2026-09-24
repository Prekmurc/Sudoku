'use strict';
// Ena zbirka za reševalec (app/) in igro (igra/), odprta v dveh zavihkih z isto
// hrambo (localStorage). Vsak zavihek je svoj kontekst z nadomestnim DOM-om
// (dom-stub.js), `shramba` pa je skupna:
//   - v obeh aplikacijah je isto število ugank (gumb "Zbirka") in isti seznam;
//     vgrajeni primeri niso del zbirke - tudi stari zapisi primerov ne štejejo;
//   - sprememba v drugem zavihku (dogodek "storage") osveži števec in odprt seznam;
//   - uganka, izbrisana v drugem zavihku, ki je odprta v igri, izprazni mrežo.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html in igra/index.html.
const RESEVALEC = ['shared/engine.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'app/app.js', 'app/zbirka.js'];
const IGRA = ['shared/engine.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'igra/stanje.js', 'igra/igra.js'];
const ZBIRKA = 'sudoku.zbirka.v1';

// Uganke iz docs/uganke.md, ki niso vgrajeni primeri (tri so), četrta iz generatorja
// (seme 2, stopnja lahka - ponovljivo, natanko ena rešitev), in en primer.
const { run: skupna } = loadContext(['shared/engine.js', 'shared/zbirka.js', 'shared/generator.js']);
const [a, b, c] = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'))
  .filter(d => !skupna(`!!zbirkaPrimerZa(${JSON.stringify(d)})`));
const nova = skupna("ustvariUganko('lahka', 2).danosti");
const primer = skupna("PRIMERI[2].danosti.replace(/\\./g, '0')");

test('pripravljene uganke: štiri različne, nobena ni primer, vsaka ima eno rešitev', () => {
  const vse = [a, b, c, nova];
  assert.equal(new Set(vse).size, 4);
  for (const d of vse) {
    assert.equal(skupna(`!!zbirkaPrimerZa(${JSON.stringify(d)})`), false);
    assert.equal(skupna(`countSolutions(${JSON.stringify(d)})`), 1);
  }
});

// Zavihek z dano aplikacijo nad skupno hrambo.
function zavihek(datoteke, shramba) {
  const dom = makeDom(shramba);
  const vprasanja = [];
  dom.globals.confirm = (t) => { vprasanja.push(t); return true; };
  const { run } = loadContext(datoteke, dom.globals);
  return { dom, run, vprasanja };
}

// Zbirka s tremi ugankami in starim zapisom primera (kot ga je prej shranil reševalec).
function hramba() {
  const shramba = new Map();
  shramba.set(ZBIRKA, JSON.stringify([
    { danosti: a, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-20 10:00' },
    { danosti: primer, tezavnost: 'Srednja', izvor: 'primer', dodano: '2026-09-20 11:00' },
    { danosti: b, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-21 10:00' },
    { danosti: c, tezavnost: 'Zelo težka', izvor: 'generator', dodano: '2026-09-22 10:00' },
  ]));
  return shramba;
}

const stevilo = (dom, id) => dom.el(id).textContent;

test('isto število in isti seznam v reševalcu in igri; stari zapis primera ne šteje', () => {
  for (const vrstniRed of [[RESEVALEC, IGRA], [IGRA, RESEVALEC]]) {
    const shramba = hramba();
    const prvi = zavihek(vrstniRed[0], shramba);
    const drugi = zavihek(vrstniRed[1], shramba);
    const [res, igra] = vrstniRed[0] === RESEVALEC ? [prvi, drugi] : [drugi, prvi];
    assert.equal(stevilo(res.dom, 'libraryBtn'), 'Zbirka (3)');
    assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (3)');
    assert.equal(JSON.parse(shramba.get(ZBIRKA)).length, 3, 'zapis primera je odstranjen iz hrambe');

    res.run('zbirkaOdpri()');
    igra.dom.klikni('zbirkaBtn');
    const naslovi = el => el.children.map(li => li.children[0].textContent);
    assert.deepEqual(naslovi(res.dom.el('libList')), naslovi(igra.dom.el('zbirkaSeznam')), 'iste kartice v istem vrstnem redu');
  }
});

test('rešen primer v reševalcu ne spremeni števila v nobeni aplikaciji', () => {
  const shramba = hramba();
  const res = zavihek(RESEVALEC, shramba);
  const igra = zavihek(IGRA, shramba);
  const prej = shramba.get(ZBIRKA);
  const P = JSON.stringify(primer);
  res.run(`(() => { const { board, log } = solve(${P}); zbirkaPoResevanju(${P}, board, log, 1); })()`);
  assert.equal(shramba.get(ZBIRKA), prej, 'zbirka je nespremenjena');
  igra.dom.obvesti(ZBIRKA, prej);
  assert.equal(stevilo(res.dom, 'libraryBtn'), 'Zbirka (3)');
  assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (3)');
});

test('dogodek "storage": igra osveži števec in odprt seznam, ko reševalec doda uganko', () => {
  const shramba = hramba();
  const igra = zavihek(IGRA, shramba);
  const res = zavihek(RESEVALEC, shramba);
  igra.dom.klikni('zbirkaBtn');
  assert.equal(igra.dom.el('zbirkaSeznam').children.length, 3);

  const prej = shramba.get(ZBIRKA);
  const d = JSON.stringify(nova);
  res.run(`(() => { const { board, log } = solve(${d}); zbirkaPoResevanju(${d}, board, log, 1); })()`);
  assert.equal(stevilo(res.dom, 'libraryBtn'), 'Zbirka (4)');
  assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (3)', 'brez dogodka igra ne ve za spremembo');

  igra.dom.obvesti(ZBIRKA, prej);
  assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (4)');
  assert.equal(igra.dom.el('zbirkaSeznam').children.length, 4, 'odprt seznam je osvežen');
});

test('dogodek "storage": reševalec osveži števec in odprt seznam, ko igra izbriše uganko', () => {
  const shramba = hramba();
  const res = zavihek(RESEVALEC, shramba);
  const igra = zavihek(IGRA, shramba);
  res.run('zbirkaOdpri()');
  assert.equal(res.dom.el('libList').children.length, 3);

  const prej = shramba.get(ZBIRKA);
  igra.dom.klikni('zbirkaBtn');
  igra.run(`zbirkaVrstice.get(${JSON.stringify(b)})`).children.find(el => el.className === 'zb-gumbi')
    .children.find(g => g.textContent === 'Izbriši').sprozi('click');
  assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (2)');

  res.dom.obvesti(ZBIRKA, prej);
  assert.equal(stevilo(res.dom, 'libraryBtn'), 'Zbirka (2)');
  assert.equal(res.dom.el('libList').children.length, 2, 'odprt seznam je osvežen');

  // Zaprt seznam se ne izriše (osveži se ob odprtju), števec pa se.
  res.run('zbirkaZapri()');
  const prej2 = shramba.get(ZBIRKA);
  igra.dom.klikni('zbirkaIzbrisiVseBtn');
  res.dom.obvesti(ZBIRKA, prej2);
  assert.equal(stevilo(res.dom, 'libraryBtn'), 'Zbirka (0)');
});

test('dogodek "storage": uganka, odprta v igri, izbrisana v reševalcu - mreža se izprazni', () => {
  const shramba = hramba();
  const igra = zavihek(IGRA, shramba);
  const A = JSON.stringify(a);
  igra.run(`zacniIgro(${A})`);
  igra.run("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");

  const res = zavihek(RESEVALEC, shramba);
  res.run('zbirkaOdpri()');
  // Brisanje druge uganke: odprta igra ostane.
  let prej = shramba.get(ZBIRKA);
  res.dom.el('libList').children.find(li => li.children[0].textContent.startsWith('Lahka'))
    .children.find(el => el.className === 'zb-gumbi').children.find(g => g.textContent === 'Izbriši').sprozi('click');
  igra.dom.obvesti(ZBIRKA, prej);
  assert.equal(igra.run('igra.danosti'), a);

  // Brisanje odprte uganke.
  prej = shramba.get(ZBIRKA);
  res.dom.el('libList').children.find(li => li.children[0].textContent.startsWith('Težka'))
    .children.find(el => el.className === 'zb-gumbi').children.find(g => g.textContent === 'Izbriši').sprozi('click');
  assert.equal(igra.run(`!!igreBeri().igre[${A}]`), false, 'reševalec je izbrisal tudi shranjeno igro');
  igra.dom.obvesti(ZBIRKA, prej);
  assert.equal(igra.run('igra'), null, 'mreža je prazna');
  assert.equal(igra.dom.el('opisUganke').textContent, 'Ni odprte uganke.');
  assert.equal(stevilo(igra.dom, 'zbirkaBtn'), 'Zbirka (1)');
  // Brez odprte igre ni poteze, ki bi znova zapisala shranjeno igro.
  assert.equal(igra.run(`!!igreBeri().igre[${A}]`), false);
});
