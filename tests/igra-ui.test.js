'use strict';
// UI igre (igra/igra.js) v nadomestnem DOM-u (dom-stub.js) - logika prikaza, ki je
// stanje.js ne pokriva:
//   - uganka, ki je samo odprta (brez poteze), ne dobi časa "zadnje reševanje" in
//     v prikazu nima druge vrstice (tudi kadar se po odprtju prikaz še enkrat
//     osveži, kot pri uganki iz generatorja);
//   - rešena uganka takoj po zadnji potezi zaklene mrežo (nizi in razveljavi/ponovi
//     onemogočeni, razlog pove, zakaj; "Začni znova" ostane), zapis v zbirki pa se
//     zamrzne.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v igra/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/zbirka.js', 'shared/generator.js', 'igra/stanje.js', 'igra/igra.js'];
const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
const D = JSON.stringify(danosti);

// Svež kontekst z uganko v zbirki (kot bi jo dodal generator) in odprto igro.
function zacni() {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`dodajVZbirko(${D}, 'Težka', 'generator')`);
  run(`zacniIgro(${D})`);
  return { dom, run };
}

const zapis = run => run(`zbirkaBeri().find(z => z.danosti === ${D})`);
const vrstica = run => run('zbirkaVrsticaIgranja(zbirkaBeri()[0])');
const stanjeZapisa = run => run('zbirkaStanjeIgre(zbirkaBeri()[0]).besedilo');
// Vpiše celo rešitev po celicah, vsako z izvedi() - kot igralec z nizom "Vpiši".
const resiVse = run => run("for (let c = 0; c < 81; c++) if (igra.danosti[c] === '0') izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] });");
// Napis gumba pri uganki v seznamu zbirke (Igraj / Nadaljuj / Poglej).
const gumb = run => run(`gumbiUganke(${D}, igreBeri().igre[${D}]).children[0].textContent`);

test('odprta uganka brez poteze: ni časa reševanja in ni druge vrstice', () => {
  const { run } = zacni();
  // Ustvarjena uganka se odpre, takoj za tem pa se prikaz še enkrat osveži
  // (sporočilo "Ustvarjena uganka ..."). Tudi to ni poteza.
  run('osvezi()');

  const z = zapis(run);
  assert.ok(z, 'uganka je v zbirki');
  assert.ok(!z.igrano, `brez poteze ni časa reševanja (igrano = ${z.igrano})`);
  assert.equal(vrstica(run), '', 'druge vrstice ni');
  assert.equal(stanjeZapisa(run), 'nova');
  // V seznamu zbirke je pri taki uganki gumb "Igraj", ne "Nadaljuj".
  assert.equal(run(`zacetaIgra(igreBeri().igre[${D}])`), false);
  assert.equal(gumb(run), 'Igraj');
});

test('prva poteza zapiše čas reševanja in drugo vrstico', () => {
  const { run } = zacni();
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: resitev()[igra.danosti.indexOf('0')] })");

  assert.ok(zapis(run).igrano, 'čas reševanja je zapisan');
  assert.ok(vrstica(run).startsWith('zadnje reševanje '), vrstica(run));
  assert.match(stanjeZapisa(run), /^v teku \(\d+ od 81\)$/);
  assert.equal(run(`zacetaIgra(igreBeri().igre[${D}])`), true);
  assert.equal(gumb(run), 'Nadaljuj');
});

test('rešena uganka: mreža se zaklene takoj po zadnji potezi', () => {
  const { run, dom } = zacni();
  resiVse(run);

  assert.equal(run('samoZaOgled()'), true, 'stanje je rešeno takoj po zadnji potezi');
  assert.match(dom.el('razlogNizov').textContent, /samo za ogled/, 'pod nizoma piše, da je mreža zaklenjena');
  assert.match(dom.el('status').textContent, /rešena/i, 'kartica Uganka pove, da je rešena');
  assert.equal(dom.el('razveljaviBtn').disabled, true, 'Razveljavi je onemogočen');
  assert.equal(dom.el('ponoviBtn').disabled, true, 'Ponovi je onemogočen');
  assert.equal(dom.el('zbrisiBtn').disabled, true, 'Zbriši vpis je onemogočen');
  assert.equal(dom.el('znovaBtn').disabled, false, '"Začni znova" ostane na voljo');
  assert.equal(run('gumbiVpisi.every(b => b.disabled)'), true, 'niz "Vpiši" je onemogočen');
  assert.equal(run('gumbiOdstrani.every(b => b.disabled)'), true, 'niz "Odstrani kandidata" je onemogočen');

  // Poteze se ne sprejemajo več (tipkovnica gre skozi isti izvedi()).
  const potez = run('igra.poteze.length');
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: 0 })");
  run('zbrisiVpis()');
  assert.equal(run('igra.poteze.length'), potez, 'nova poteza se ne doda');
  assert.equal(run('igra.kazalec'), potez);

  // Zaklep mora biti viden, ne le v onemogočenih gumbih.
  assert.ok(dom.el('mreza').className.includes('zaklenjena'), 'mreža je označena kot zaklenjena');
  assert.ok(dom.el('razlogNizov').className.includes('zaklenjeno'), 'vrstica z razlogom izstopa');
  assert.ok(dom.el('znovaBtn').className.includes('primary'), '"Začni znova" je poudarjen');
  assert.equal(gumb(run), 'Poglej', 'pri rešeni uganki v zbirki ni kaj nadaljevati');

  // Zapis v zbirki je zamrznjen, v prikazu je samo "rešena <čas>".
  assert.equal(zapis(run).izpolnjeno, 81);
  assert.equal(stanjeZapisa(run), 'rešena');
  assert.match(vrstica(run), /^rešena \d+\. \d+\. \d{4} ob \d{2}:\d{2}$/);
});

test('"Začni znova" pri rešeni uganki: vpraša, mreža je spet prazna, čas prve rešitve ostane', () => {
  const { run, dom } = zacni();
  resiVse(run);
  const cas = zapis(run).igrano;

  dom.potrdi(false);
  dom.klikni('znovaBtn');
  assert.equal(run('igra.kazalec > 0'), true, 'brez potrditve se ne zgodi nič');

  dom.potrdi(true);
  dom.klikni('znovaBtn');
  assert.equal(run('igra.kazalec'), 0, 'poteze so razveljavljene');
  assert.equal(run('samoZaOgled()'), false, 'mreža je spet za reševanje');
  assert.ok(!dom.el('mreza').className.includes('zaklenjena'), 'oznaka zaklepa je odstranjena');
  assert.ok(!dom.el('razlogNizov').className.includes('zaklenjeno'));
  assert.equal(run('gumbiVpisi.some(b => !b.disabled) || izbrane.length === 0'), true);

  assert.equal(zapis(run).igrano, cas, 'ohrani se čas prve rešitve');
  assert.equal(stanjeZapisa(run), 'rešena', 'zapis ostane zamrznjen');
});
