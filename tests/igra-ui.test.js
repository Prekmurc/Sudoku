'use strict';
// UI igre (igra/igra.js) v nadomestnem DOM-u (dom-stub.js) - logika prikaza, ki je
// stanje.js ne pokriva:
//   - uganka, ki je samo odprta (brez poteze), ne dobi časa "zadnje reševanje" in
//     v prikazu nima druge vrstice (tudi kadar se po odprtju prikaz še enkrat
//     osveži, kot pri uganki iz generatorja);
//   - uganka iz generatorja in ročno vnesena uganka se takoj dodata v zbirko (z
//     "dodana", brez časa reševanja) in sta v seznamu na vrhu;
//   - napredek igre (sudoku.igra.v1) se shranjuje ločeno od zapisa v zbirki
//     (sudoku.zbirka.v1): ponovno reševanje rešene uganke preživi osvežitev strani,
//     čas prve rešitve pa ostane zamrznjen;
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
const vrstica = run => run(`zbirkaVrsticaIgranja(zbirkaBeri().find(z => z.danosti === ${D}))`);
const stanjeZapisa = run => run(`zbirkaStanjeIgre(zbirkaBeri().find(z => z.danosti === ${D})).besedilo`);
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

/* ---------- nova uganka pride v zbirko takoj, brez časa reševanja ---------- */

// Še tri uganke iz docs/uganke.md - zbirka naj ima tudi take, ki sem jih že reševal.
const druge = loadPuzzles().slice(1, 4).map(p => p.danosti.replace(/\./g, '0'));

function zbirkaZRezevanimi(run) {
  druge.forEach((d, i) => {
    run(`dodajVZbirko(${JSON.stringify(d)}, 'Težka', 'rocno')`);
    run(`zbirkaShraniIgranje(${JSON.stringify(d)}, '2026-09-21 18:4${i}', 40, false)`);
  });
}

test('ustvarjena uganka: takoj v zbirki, z "dodana" in brez časa reševanja', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  zbirkaZRezevanimi(run);
  const prej = run('zbirkaBeri().length');

  // Prava pot: sporočilo "najdena" iz delavca (generator-worker.js).
  run("iskanje = { stopnja: 'lahka', zacetek: Date.now(), poskusi: 3 }");
  run(`obdelajIskanje({ tip: 'najdena', danosti: ${D}, stopnja: 'lahka' })`);

  const z = zapis(run);
  assert.ok(z, 'ustvarjena uganka je v zbirki');
  assert.equal(run('zbirkaBeri().length'), prej + 1);
  assert.ok(z.dodano, 'ima čas dodajanja');
  assert.equal(z.izvor, 'generator');
  assert.ok(!z.igrano, 'brez poteze nima časa reševanja');
  assert.equal(vrstica(run), '', 'druge vrstice ni');
  assert.equal(dom.el('zbirkaBtn').textContent, `Zbirka (${prej + 1})`);

  // V seznamu mora biti vidna in na vrhu (ne pod vsemi že reševanimi).
  run('izrisiZbirko()');
  assert.equal(dom.el('zbirkaSeznam').children.length, prej + 1, 'seznam ima vse uganke');
  assert.equal(run('zbirkaZaSeznam(zbirkaBeri())[0].danosti'), JSON.parse(D), 'nova uganka je na vrhu');
  assert.ok(dom.el('zbirkaSeznam').children[0].textContent.includes('ustvaril generator'));
  assert.equal(gumb(run), 'Igraj');
});

test('ročno vnesena uganka: takoj v zbirki, z "dodana" in brez časa reševanja', async () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  zbirkaZRezevanimi(run);
  const prej = run('zbirkaBeri().length');

  // Prava pot: danosti v mreži okna "Nova uganka" in klik na "Začni igro".
  run(`vnosi.forEach((inp, i) => { inp.value = ${D}[i] === '0' ? '' : ${D}[i]; })`);
  dom.klikni('novaZacni');
  await new Promise(r => setTimeout(r, 300)); // enoličnost se preveri v setTimeout

  const z = zapis(run);
  assert.ok(z, 'ročno vnesena uganka je v zbirki');
  assert.equal(run('zbirkaBeri().length'), prej + 1);
  assert.ok(z.dodano, 'ima čas dodajanja');
  assert.equal(z.izvor, 'rocno');
  assert.ok(!z.igrano, 'brez poteze nima časa reševanja');
  assert.equal(run('igra.danosti'), JSON.parse(D), 'uganka se začne igrati');
  assert.equal(run('zbirkaZaSeznam(zbirkaBeri())[0].danosti'), JSON.parse(D), 'nova uganka je na vrhu');
});

test('prva poteza pri ustvarjeni uganki doda čas reševanja, zapis se ne podvoji', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run("iskanje = { stopnja: 'lahka', zacetek: Date.now(), poskusi: 1 }");
  run(`obdelajIskanje({ tip: 'najdena', danosti: ${D}, stopnja: 'lahka' })`);
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: resitev()[igra.danosti.indexOf('0')] })");

  assert.equal(run('zbirkaBeri().length'), 1, 'ista uganka ostane en zapis');
  assert.ok(zapis(run).igrano, 'šele poteza zapiše čas reševanja');
  assert.ok(vrstica(run).startsWith('zadnje reševanje '));
  assert.equal(dom.el('zbirkaBtn').textContent, 'Zbirka (1)');
});

/* ---------- pogoj "brez poteze ni zapisa" drugje ne škodi ---------- */

test('uvoz, vgrajeni primer in "Začni znova" ob pogoju brez poteze', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);

  // Uvoz iz Markdowna gre mimo igre: uganke se dodajo, čeprav jih nisem igral.
  const md = [`- **Danosti:** \`${druge[0].replace(/0/g, '.')}\``, '- **Težavnost:** Lahka', '- **Dodano:** 2026-09-20 10:00'].join('\n');
  const p = run(`zbirkaUvozi(${JSON.stringify(md)})`);
  assert.equal(p.napaka, false, p.sporocilo);
  const uvozena = run(`zbirkaBeri().find(z => z.danosti === ${JSON.stringify(druge[0])})`);
  assert.ok(uvozena, 'uvožena uganka je v zbirki');
  assert.ok(!uvozena.igrano, 'uvožena uganka nima časa reševanja');
  assert.equal(run(`zbirkaStanjeIgre(zbirkaBeri().find(z => z.danosti === ${JSON.stringify(druge[0])})).besedilo`), 'nova');

  // Vgrajeni primer se igra, a v zbirko ne pride (napredek je v shranjenih igrah).
  const primer = run('primeriIgre[4].danosti');
  run(`zacniIgro(${JSON.stringify(primer)})`);
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: resitev()[igra.danosti.indexOf('0')] })");
  assert.equal(run(`zbirkaBeri().some(z => z.danosti === ${JSON.stringify(primer)})`), false, 'vgrajeni primer ni v zbirki');
  assert.equal(run(`igreBeri().igre[${JSON.stringify(primer)}].poteze.length`), 1, 'napredek primera se shrani');

  // "Začni znova" pri nerešeni uganki: poteze ostanejo (za "Ponovi"), zato je to
  // še vedno moje reševanje in čas se osveži.
  run(`dodajVZbirko(${D}, 'Težka', 'generator')`);
  run(`zacniIgro(${D})`);
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: resitev()[igra.danosti.indexOf('0')] })");
  assert.ok(zapis(run).igrano);
  dom.potrdi(true);
  dom.klikni('znovaBtn');
  assert.equal(run('igra.kazalec'), 0);
  assert.ok(zapis(run).igrano, 'čas reševanja ostane zapisan');
  assert.match(stanjeZapisa(run), /^v teku \(\d+ od 81\)$/, 'stanje se posodobi na prazno mrežo');
});

/* ---------- ponovno reševanje rešene uganke (napredek proti zamrznjenemu zapisu) ---------- */

// Nov DOM z isto hrambo = osvežitev strani (F5): igra/igra.js se naloži znova in
// mora stanje obnoviti iz localStorage.
function osveziStran(dom) {
  const nov = makeDom(dom.shramba);
  return { dom: nov, run: loadContext(DATOTEKE, nov.globals).run };
}

test('rešena uganka: napredek ponovnega reševanja preživi osvežitev strani', () => {
  let { dom, run } = zacni();
  resiVse(run);
  const prvaResitev = zapis(run).igrano;
  assert.equal(stanjeZapisa(run), 'rešena');

  // "Začni znova" -> mreža je spet igrljiva
  dom.potrdi(true);
  dom.klikni('znovaBtn');
  assert.equal(run('samoZaOgled()'), false);

  // Tri nove poteze; prvo naredimo po pravi poti z miško (klik na celico v mreži
  // in nato na števko v nizu "Vpiši"), ostali dve prek izvedi().
  const c0 = run("igra.danosti.split('').findIndex((ch, i) => ch === '0' && !stanje.vpisi[i])");
  run(`celice[${c0}].sprozi('click')`);
  const d0 = run(`resitev()[${c0}]`);
  assert.equal(run(`gumbiVpisi[${d0} - 1].disabled`), false, 'niz "Vpiši" je po "Začni znova" spet omogočen');
  run(`gumbiVpisi[${d0} - 1].sprozi('click')`);
  assert.equal(run('igra.poteze.length'), 1, 'klik na števko doda potezo');
  for (let i = 0; i < 2; i++) {
    run("(() => { const c = igra.danosti.split('').findIndex((ch, i) => ch === '0' && !stanje.vpisi[i]); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");
  }
  const vpisanih = run('steviloVpisanih(stanje)');
  const danih = run("igra.danosti.replace(/0/g, '').length");
  assert.equal(vpisanih, danih + 3, 'tri števke so na mreži');
  // Napredek gre v sudoku.igra.v1, ne v zbirko.
  assert.equal(JSON.parse(dom.shramba.get('sudoku.igra.v1')).igre[JSON.parse(D)].poteze.length, 3);

  // F5
  const po = osveziStran(dom);
  assert.equal(po.run('!!igra'), true, 'po osvežitvi je igra odprta');
  assert.equal(po.run('igra.poteze.length'), 3, 'poteze so ohranjene');
  assert.equal(po.run('steviloVpisanih(stanje)'), danih + 3, 'vpisane števke so ohranjene');
  assert.equal(po.run('samoZaOgled()'), false, 'mreža je igrljiva naprej');

  // Zapis v zbirki ostane zamrznjen na prvi rešitvi.
  const z = po.run(`zbirkaBeri().find(z => z.danosti === ${D})`);
  assert.equal(z.igrano, prvaResitev, 'čas prve rešitve se ni spremenil');
  assert.equal(z.izpolnjeno, 81);
  assert.equal(po.run(`zbirkaStanjeIgre(zbirkaBeri().find(z => z.danosti === ${D})).besedilo`), 'rešena');
});

test('rešena uganka: ponovna rešitev spet zaklene mrežo, čas prve rešitve ostane', () => {
  const { dom, run } = zacni();
  resiVse(run);
  const prvaResitev = zapis(run).igrano;

  dom.potrdi(true);
  dom.klikni('znovaBtn');
  resiVse(run); // drugi poskus do konca

  assert.equal(run('samoZaOgled()'), true, 'mreža je spet zaklenjena');
  assert.ok(dom.el('mreza').className.includes('zaklenjena'));
  assert.match(dom.el('razlogNizov').textContent, /samo za ogled/);
  assert.equal(dom.el('razveljaviBtn').disabled, true);
  assert.equal(zapis(run).igrano, prvaResitev, 'v zbirki ostane čas PRVE rešitve');

  // Tudi po osvežitvi strani.
  const po = osveziStran(dom);
  assert.equal(po.run('samoZaOgled()'), true);
  assert.equal(po.run(`zbirkaBeri().find(z => z.danosti === ${D}).igrano`), prvaResitev);
});

test('napredka ni mogoče shraniti: opozorilo je vidno pri mreži', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`dodajVZbirko(${D}, 'Težka', 'generator')`);
  run(`zacniIgro(${D})`);
  // Shramba neha delovati (npr. polna ali onemogočena).
  dom.globals.localStorage.setItem = () => { throw new Error('quota'); };
  run("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");

  assert.match(dom.el('razlogNizov').textContent, /^⚠ Napredka ni bilo mogoče shraniti/);
  assert.ok(dom.el('razlogNizov').className.includes('opozorilo'));
  assert.match(dom.el('status').textContent, /Napredka ni bilo mogoče shraniti/);
});

test('poškodovan zapis igre: obnova pove, koliko potez je izpadlo', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  // Zapis s potezo, ki je ni mogoče odigrati (števka ni kandidat prve prazne celice).
  const prazna = run(`${D}.indexOf('0')`);
  const napacna = run(`(() => { const s = stanjeIgre(novaIgra(${D})); for (let d = 1; d <= 9; d++) if (!(s.kandidati[${prazna}] & (1 << d))) return d; return 0; })()`);
  const zapisIgre = {
    zadnja: JSON.parse(D),
    igre: { [JSON.parse(D)]: { poteze: [{ tip: 'vpis', celica: prazna, stevka: napacna }], kazalec: 1, zacetek: '2026-09-22 20:00', nazadnje: '2026-09-22 20:00' } },
  };
  dom.shramba.set('sudoku.igra.v1', JSON.stringify(zapisIgre));

  const po = osveziStran(dom);
  assert.equal(po.run('igra.poteze.length'), 0, 'neveljavna poteza se ne odigra');
  assert.equal(po.run('igra.izpuscenih'), 1);
  assert.match(po.dom.el('razlogNizov').textContent, /^⚠ Shranjene igre ni bilo mogoče v celoti obnoviti/);
  assert.ok(po.dom.el('razlogNizov').className.includes('opozorilo'));
});
