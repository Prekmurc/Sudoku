'use strict';
// Gumba »Izvozi« in »Uvozi« v oknu zbirke - reševalec (app/zbirka.js) in igra (igra/igra.js) -
// v nadomestnem DOM-u (dom-stub.js). Logika je v shared/zbirka.js (zbirkaIzvozi, zbirkaUvozi,
// zbirkaPrenesi), tu je vezava na DOM: klik, prenos datoteke, izbira datoteke (skrito polje
// <input type="file">), branje (`text()`), ponastavitev `value` (da gre ista datoteka znova
// skozi "change"), napaka branja in kaj se po uvozu osveži. Izbirnika datotek in prenosa test ne
// odpre: prenos ujame nadomestni Blob, izbiro datoteke nadomesti `files` + dogodek "change".
// Pravi brskalnik: tools/preveri-faza7-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html in igra/index.html.
const RESEVALEC = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'app/app.js', 'app/zbirka.js'];
const IGRA = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'igra/shramba.js', 'igra/igra.js'];

const uganke = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'));
const A = uganke[0];
const B = uganke[1];

// Elementi obeh aplikacij: gumba, skrito polje za datoteko, vrstica sporočila, seznam,
// gumb »Zbirka« in razred vrstice sporočila (brez napake / z napako).
const APLIKACIJI = {
  reševalec: {
    datoteke: RESEVALEC, izvozi: 'libExport', uvozi: 'libImport', datoteka: 'libFile',
    status: 'libStatus', seznam: 'libList', gumbZbirka: 'libraryBtn',
    razred: 'lib-status', razredNapaka: 'lib-status err',
    odpri: 'zbirkaOdpri()',
  },
  igra: {
    datoteke: IGRA, izvozi: 'zbirkaIzvoziBtn', uvozi: 'zbirkaUvoziBtn', datoteka: 'zbirkaDatoteka',
    status: 'zbirkaStatus', seznam: 'zbirkaSeznam', gumbZbirka: 'zbirkaBtn',
    razred: 'dialog-status', razredNapaka: 'dialog-status err',
    odpri: "document.getElementById('zbirkaBtn').sprozi('click')",
  },
};

// Aplikacija z zapisi v zbirki (lahko prazna) in odprtim oknom zbirke. `prenosi` zbere
// besedila prenesenih datotek (nadomestni Blob), `povezave` povezave <a download>, ki jih je
// zbirkaPrenesi() kliknila.
function zacni(app, zapisi = []) {
  const a = APLIKACIJI[app];
  const dom = makeDom();
  if (zapisi.length) dom.shramba.set('sudoku.zbirka.v1', JSON.stringify(zapisi));
  const prenosi = [];
  dom.globals.Blob = function Blob(deli, moznosti) { this.besedilo = deli.join(''); this.type = moznosti && moznosti.type; prenosi.push(this); };
  const povezave = [];
  const createElement = dom.document.createElement.bind(dom.document);
  dom.document.createElement = (tag) => {
    const el = createElement(tag);
    if (String(tag).toLowerCase() === 'a') el.addEventListener('click', () => povezave.push({ href: el.href, download: el.download }));
    return el;
  };
  const { run } = loadContext(a.datoteke, dom.globals);
  run(a.odpri);
  return { a, dom, run, prenosi, povezave };
}

// Izbira datoteke: polje dobi `files` (in vrednost, kot jo nastavi brskalnik), nato "change".
// Branje (`text()`) je obljuba - počakamo, da se izvede.
async function izberi(dom, a, datoteke) {
  const polje = dom.el(a.datoteka);
  polje.files = datoteke;
  polje.value = datoteke.length ? 'C:\\fakepath\\' + datoteke[0].name : '';
  polje.sprozi('change');
  await new Promise(r => setImmediate(r));
}
const datoteka = (besedilo, name = 'zbirka-ugank.md') => ({ name, text: () => Promise.resolve(besedilo) });

const status = (dom, a) => ({ besedilo: dom.el(a.status).textContent, razred: dom.el(a.status).className });
// Danosti ugank v seznamu »Moje uganke« (kartice; prazna zbirka ima vrstico »prazno«).
const vSeznamu = (run, a) => run(`[...document.getElementById('${a.seznam}').children].filter(li => li.className !== 'prazno').length`);

const ZAPIS_A = { danosti: A, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '' };

for (const app of Object.keys(APLIKACIJI)) {
  test(`${app}: izvoz prazne zbirke – sporočilo z napako, brez prenosa`, () => {
    const { a, dom, prenosi, povezave } = zacni(app);
    dom.klikni(a.izvozi);
    assert.deepEqual(status(dom, a), { besedilo: 'Zbirka je prazna – ni česa izvoziti.', razred: a.razredNapaka });
    assert.equal(prenosi.length, 0);
    assert.equal(povezave.length, 0);
  });

  test(`${app}: izvoz prenese datoteko z besedilom zbirkaIzvozi()`, () => {
    const { a, dom, run, prenosi, povezave } = zacni(app, [ZAPIS_A]);
    dom.klikni(a.izvozi);
    assert.equal(prenosi.length, 1);
    assert.equal(prenosi[0].besedilo, run('zbirkaIzvozi().besedilo'));
    assert.ok(prenosi[0].besedilo.includes(A.replace(/0/g, '.')) || prenosi[0].besedilo.includes(A), 'danosti so v datoteki');
    assert.equal(prenosi[0].type, 'text/markdown;charset=utf-8');
    assert.deepEqual(povezave, [{ href: 'blob:test', download: 'zbirka-ugank.md' }]);
    assert.deepEqual(status(dom, a), { besedilo: 'Izvoženih ugank: 1 (datoteka zbirka-ugank.md).', razred: a.razred });
  });

  test(`${app}: »Uvozi« odpre izbiro datoteke`, () => {
    const { a, dom } = zacni(app);
    let odprto = 0;
    dom.el(a.datoteka).addEventListener('click', () => odprto++);
    dom.klikni(a.uvozi);
    assert.equal(odprto, 1);
  });

  test(`${app}: uvoz izvožene datoteke – sporočilo, seznam, števec, prazna vrednost polja; ista datoteka znova`, async () => {
    // Izvoz iz ene zbirke (dve uganki), uvoz v drugo (prazno).
    const vir = zacni(app, [ZAPIS_A, { danosti: B, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-22 10:05', opomba: 'druga' }]);
    vir.dom.klikni(vir.a.izvozi);
    const besedilo = vir.prenosi[0].besedilo;

    const { a, dom, run } = zacni(app);
    assert.equal(dom.el(a.gumbZbirka).textContent, 'Zbirka (0)');
    await izberi(dom, a, [datoteka(besedilo)]);
    assert.deepEqual(status(dom, a), { besedilo: 'Uvoz končan – novih: 2 · dopolnjenih: 0 · že obstoječih brez sprememb: 0.', razred: a.razred });
    assert.equal(run('zbirkaBeri().length'), 2);
    assert.equal(vSeznamu(run, a), 2, 'seznam je osvežen');
    assert.equal(dom.el(a.gumbZbirka).textContent, 'Zbirka (2)', 'števec je osvežen');
    assert.equal(dom.el(a.datoteka).value, '', 'vrednost polja je prazna - ista datoteka gre lahko znova skozi »change«');

    // Ista datoteka znova: nič novega.
    await izberi(dom, a, [datoteka(besedilo)]);
    assert.deepEqual(status(dom, a), { besedilo: 'Uvoz končan – novih: 0 · dopolnjenih: 0 · že obstoječih brez sprememb: 2.', razred: a.razred });
    assert.equal(run('zbirkaBeri().length'), 2);
    assert.equal(dom.el(a.datoteka).value, '');
  });

  test(`${app}: datoteka brez ugank – sporočilo z napako, zbirka ostane`, async () => {
    const { a, dom, run } = zacni(app, [ZAPIS_A]);
    await izberi(dom, a, [datoteka('# Nekaj\n\nbrez ugank\n', 'prazno.md')]);
    assert.deepEqual(status(dom, a), { besedilo: 'V datoteki ni nobene uganke (pričakujem vrstice oblike »- **Danosti:** `…`«).', razred: a.razredNapaka });
    assert.equal(run('zbirkaBeri().length'), 1);
    assert.equal(vSeznamu(run, a), 1);
    assert.equal(dom.el(a.datoteka).value, '');
  });

  test(`${app}: napaka branja datoteke – sporočilo z napako`, async () => {
    const { a, dom, run } = zacni(app, [ZAPIS_A]);
    await izberi(dom, a, [{ name: 'zbirka-ugank.md', text: () => Promise.reject(new Error('dostop zavrnjen')) }]);
    assert.deepEqual(status(dom, a), { besedilo: 'Datoteke ni bilo mogoče prebrati: dostop zavrnjen', razred: a.razredNapaka });
    assert.equal(run('zbirkaBeri().length'), 1);
    assert.equal(dom.el(a.datoteka).value, '');
  });

  test(`${app}: brez datoteke (izbira preklicana) – nič se ne zgodi`, async () => {
    const { a, dom, run } = zacni(app, [ZAPIS_A]);
    dom.el(a.status).textContent = 'prej';
    await izberi(dom, a, []);
    assert.equal(dom.el(a.status).textContent, 'prej');
    assert.equal(run('zbirkaBeri().length'), 1);
  });
}

// Uvoz, ki dopolni odprto uganko (opomba iz datoteke), osveži tudi prikaz te uganke.
const ZAPIS_A_Z_OPOMBO = { ...ZAPIS_A, opomba: 'iz datoteke' };

test('reševalec: uvoz osveži vrstico »Shranjeno v zbirko« (opomba rešene uganke)', async () => {
  const { a, dom, run } = zacni('reševalec');
  const d = JSON.stringify(A);
  run(`(() => { const { board, log } = solve(${d}); zbirkaPoResevanju(${d}, board, log, 1); })()`);
  assert.equal(dom.el('saveMsg').textContent, '✓ Shranjeno v zbirko');
  assert.equal(dom.el('saveNote').value, '');
  const besedilo = run(`zbirkaVMarkdown([${JSON.stringify(ZAPIS_A_Z_OPOMBO)}])`);
  await izberi(dom, a, [datoteka(besedilo)]);
  assert.equal(status(dom, a).besedilo, 'Uvoz končan – novih: 0 · dopolnjenih: 1 · že obstoječih brez sprememb: 0.');
  assert.equal(dom.el('saveNote').value, 'iz datoteke', 'vrstica pod rešitvijo kaže uvoženo opombo');
});

test('igra: uvoz osveži kartico »Uganka« odprte uganke (opomba)', async () => {
  const { a, dom, run } = zacni('igra', [ZAPIS_A]);
  run(`zacniIgro(${JSON.stringify(A)})`);
  const opomba = () => dom.el('opisUganke').children.filter(v => v.className === 'opis-vrstica opis-opomba').map(v => v.textContent);
  assert.deepEqual(opomba(), []);
  const besedilo = run(`zbirkaVMarkdown([${JSON.stringify(ZAPIS_A_Z_OPOMBO)}])`);
  await izberi(dom, a, [datoteka(besedilo)]);
  assert.equal(status(dom, a).besedilo, 'Uvoz končan – novih: 0 · dopolnjenih: 1 · že obstoječih brez sprememb: 0.');
  assert.deepEqual(opomba(), ['iz datoteke']);
});

test('igra: med ocenjevanjem sta »Izvozi« in »Uvozi« onemogočena', () => {
  const { a, dom, prenosi } = zacni('igra', [ZAPIS_A]);
  let odprto = 0;
  dom.el(a.datoteka).addEventListener('click', () => odprto++);
  dom.klikni('oceniBtn');
  assert.equal(dom.el(a.izvozi).disabled, true);
  assert.equal(dom.el(a.uvozi).disabled, true);
  dom.klikni(a.izvozi);
  dom.klikni(a.uvozi);
  assert.equal(prenosi.length, 0);
  assert.equal(odprto, 0);
  dom.klikni('oceniPrekiniBtn');
  assert.equal(dom.el(a.izvozi).disabled, false);
  assert.equal(dom.el(a.uvozi).disabled, false);
  dom.klikni(a.izvozi);
  assert.equal(prenosi.length, 1);
});
