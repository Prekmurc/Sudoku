'use strict';
// UI igre (igra/igra.js) v nadomestnem DOM-u (dom-stub.js) - logika prikaza, ki je
// stanje.js ne pokriva:
//   - uganka, ki je samo odprta (brez poteze), ne dobi časa "zadnje reševanje" in
//     v prikazu nima druge vrstice (tudi kadar se po odprtju prikaz še enkrat
//     osveži, kot pri uganki iz generatorja);
//   - uganka iz generatorja in ročno vnesena uganka se takoj dodata v zbirko (z
//     "dodana", brez časa reševanja) in sta v seznamu na vrhu;
//   - napredek igre (sudoku.igra.v1) se shranjuje ločeno od zapisa v zbirki
//     (sudoku.zbirka.v1): ponovno reševanje rešene uganke preživi osvežitev strani
//     (poteze, KAZALEC in vsebina mreže), čas prve rešitve pa ostane zamrznjen;
//   - obnova kazalca: delno razveljavljeno stanje ostane, "vse razveljavljeno" se
//     vrne na konec zgodovine, po "Začni znova" pa mreža ostane prazna;
//   - rešena uganka takoj po zadnji potezi zaklene mrežo (nizi in razveljavi/ponovi
//     onemogočeni, razlog pove, zakaj; "Začni znova" ostane), zapis v zbirki pa se
//     zamrzne;
//   - stanje uganke iz enega vira (zbirkaStanjeUganke): napis in gumb v seznamu
//     zbirke, vgrajeni primeri, kartica "Uganka" in ponovno reševanje rešene uganke
//     ("rešena … · znova v teku (12/57)", gumb "Nadaljuj").
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v igra/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'igra/stanje.js', 'igra/igra.js'];
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
// Stanje iz zapisa v zbirki (kot v izvozu) - brez shranjene igre.
const stanjeZapisa = run => run(`zbirkaStanjeUganke(${D}, zbirkaBeri().find(z => z.danosti === ${D})).besedilo`);
// Prazne celice uganke - imenovalec v "v teku (12/57)".
const praznih = [...danosti].filter(ch => ch === '0').length;
// Vpiše celo rešitev po celicah, vsako z izvedi() - kot igralec z nizom "Vpiši".
const resiVse = run => run("for (let c = 0; c < 81; c++) if (igra.danosti[c] === '0') izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] });");
// Del kartice uganke v seznamu zbirke (shared/zbirka-ui.js) po razredu: zb-vrstica
// (1. vrstica), zb-casi (stanje), zb-info, zb-gumbi. Seznam se pred tem izriše znova.
const delKartice = (run, razred, d = D) => run(`(() => { izrisiZbirko();
  const li = zbirkaVrstice.get(${d}) || [...document.getElementById('primeriSeznam').children]
    .find(li => li.children[0].textContent.startsWith(zbirkaPrimerZa(${d}).ime));
  return li.children.find(el => el.className === '${razred}'); })()`);
// Napis gumba pri uganki v seznamu zbirke (Igraj / Nadaljuj / Poglej) - z izrisane kartice.
const gumb = (run, d = D) => delKartice(run, 'zb-gumbi', d).children[0].textContent;
// Ali je shranjena igra začeta (vsaj ena poteza v zgodovini).
const zaceta = run => run(`zbirkaPovzetekZapisa(${D}, igreBeri().igre[${D}]).zaceta`);

test('odprta uganka brez poteze: ni časa reševanja, v seznamu je "nova"', () => {
  const { run } = zacni();
  // Ustvarjena uganka se odpre, takoj za tem pa se prikaz še enkrat osveži
  // (sporočilo "Ustvarjena uganka ..."). Tudi to ni poteza.
  run('osvezi()');

  const z = zapis(run);
  assert.ok(z, 'uganka je v zbirki');
  assert.ok(!z.igrano, `brez poteze ni časa reševanja (igrano = ${z.igrano})`);
  assert.equal(vrstica(run), '', 'kartica "Uganka" nima vrstice reševanja');
  assert.equal(stanjeZapisa(run), 'nova');
  // Kartica v seznamu ima 2. vrstico vedno - pri novi uganki samo "nova".
  assert.equal(delKartice(run, 'zb-casi').textContent, 'nova');
  // V seznamu zbirke je pri taki uganki gumb "Igraj", ne "Nadaljuj".
  assert.equal(zaceta(run), false);
  assert.equal(gumb(run), 'Igraj');
});

test('prva poteza zapiše čas reševanja in drugo vrstico', () => {
  const { run } = zacni();
  run("izvedi({ tip: 'vpis', celica: igra.danosti.indexOf('0'), stevka: resitev()[igra.danosti.indexOf('0')] })");

  assert.ok(zapis(run).igrano, 'čas reševanja je zapisan');
  assert.ok(vrstica(run).startsWith('zadnje reševanje '), vrstica(run));
  assert.equal(stanjeZapisa(run), `v teku (1/${praznih})`);
  assert.equal(zaceta(run), true);
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

// Še druge uganke iz docs/uganke.md - zbirka naj ima tudi take, ki sem jih že reševal.
// Brez vgrajenih primerov: ti v zbirko ne pridejo (dodajVZbirko in uvoz jih
// preskočita). Takih ugank je v docs/uganke.md poleg prve še dve.
const jePrimer = (() => {
  const { run } = loadContext(['shared/engine.js', 'shared/zbirka.js']);
  return d => run(`!!zbirkaPrimerZa(${JSON.stringify(d)})`);
})();
const druge = loadPuzzles().slice(1).map(p => p.danosti.replace(/\./g, '0')).filter(d => !jePrimer(d)).slice(0, 3);

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
  assert.equal(run(`zbirkaStanjeUganke(${JSON.stringify(druge[0])}, zbirkaBeri().find(z => z.danosti === ${JSON.stringify(druge[0])})).besedilo`), 'nova');

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
  assert.equal(stanjeZapisa(run), `v teku (0/${praznih})`, 'stanje se posodobi na prazno mrežo');
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
  const danih = run("igra.danosti.replace(/0/g, '').length");
  assert.equal(run('steviloVpisanih(stanje)'), danih + 3, 'tri števke so na mreži');
  const mrezaPrej = run('stanje.grid.join("")');
  // Napredek gre v sudoku.igra.v1 (poteze IN kazalec), ne v zbirko.
  const shranjeno = JSON.parse(dom.shramba.get('sudoku.igra.v1')).igre[JSON.parse(D)];
  assert.equal(shranjeno.poteze.length, 3);
  assert.equal(shranjeno.kazalec, 3, 'kazalec je shranjen na koncu zgodovine');

  // F5
  const po = osveziStran(dom);
  assert.equal(po.run('!!igra'), true, 'po osvežitvi je igra odprta');
  assert.equal(po.run('igra.poteze.length'), 3, 'poteze so ohranjene');
  assert.equal(po.run('igra.kazalec'), 3, 'kazalec je na koncu zgodovine, ne na 0');
  assert.equal(po.run('stanje.grid.join("")'), mrezaPrej, 'mreža je enaka kot pred osvežitvijo');
  assert.equal(po.run('steviloVpisanih(stanje)'), danih + 3, 'vpisane števke so ohranjene');
  assert.equal(po.dom.el('stevecPotez').textContent, 'poteza 3 / 3');
  assert.equal(po.dom.el('razveljaviBtn').disabled, false, 'Razveljavi je na voljo');
  assert.equal(po.dom.el('znovaBtn').disabled, false, '"Začni znova" je na voljo');
  assert.equal(po.run('samoZaOgled()'), false, 'mreža je igrljiva naprej');

  // Zapis v zbirki ostane zamrznjen na prvi rešitvi.
  const z = po.run(`zbirkaBeri().find(z => z.danosti === ${D})`);
  assert.equal(z.igrano, prvaResitev, 'čas prve rešitve se ni spremenil');
  assert.equal(z.izpolnjeno, 81);
  assert.equal(po.run(`zbirkaStanjeUganke(${D}, zbirkaBeri().find(z => z.danosti === ${D})).besedilo`), 'rešena');
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

/* ---------- obnova kazalca v zgodovini potez ---------- */

// Tri poteze v prve tri proste celice (vsaka pravilna).
function trikratVpisi(run) {
  for (let i = 0; i < 3; i++) {
    run("(() => { const c = igra.danosti.split('').findIndex((ch, i) => ch === '0' && !stanje.vpisi[i]); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");
  }
}

test('kazalec po "Razveljavi" preživi osvežitev strani (2 od 3)', () => {
  const { dom, run } = zacni();
  trikratVpisi(run);
  const danih = run("igra.danosti.replace(/0/g, '').length");
  dom.klikni('razveljaviBtn');
  assert.equal(run('igra.kazalec'), 2);
  const mrezaPrej = run('stanje.grid.join("")');
  assert.equal(run('steviloVpisanih(stanje)'), danih + 2, 'na mreži sta dve vpisani števki');
  assert.equal(JSON.parse(dom.shramba.get('sudoku.igra.v1')).igre[JSON.parse(D)].kazalec, 2, 'kazalec se shrani');

  const po = osveziStran(dom);
  assert.equal(po.run('igra.kazalec'), 2, 'delno razveljavljeno stanje ostane');
  assert.equal(po.run('igra.poteze.length'), 3, 'zgodovina je cela (tretja poteza v "Ponovi")');
  assert.equal(po.run('steviloVpisanih(stanje)'), danih + 2, 'na mreži sta dve vpisani števki');
  assert.equal(po.run('stanje.grid.join("")'), mrezaPrej);
  assert.equal(po.dom.el('stevecPotez').textContent, 'poteza 2 / 3');
  assert.equal(po.dom.el('ponoviBtn').disabled, false, '"Ponovi" je na voljo');
});

test('"vse razveljavljeno" se ob osvežitvi vrne na konec zgodovine', () => {
  const { dom, run } = zacni();
  trikratVpisi(run);
  const danih = run("igra.danosti.replace(/0/g, '').length");
  const mrezaPolna = run('stanje.grid.join("")');
  for (let i = 0; i < 3; i++) dom.klikni('razveljaviBtn');
  assert.equal(run('igra.kazalec'), 0, 'mreža je prazna, zgodovina skrita');

  // Prazna mreža s skrito zgodovino je videti kot izgubljen napredek, zato se ob
  // osvežitvi vrnemo na konec zgodovine.
  const po = osveziStran(dom);
  assert.equal(po.run('igra.kazalec'), 3);
  assert.equal(po.run('steviloVpisanih(stanje)'), danih + 3);
  assert.equal(po.run('stanje.grid.join("")'), mrezaPolna);
});

test('po "Začni znova" mreža ostane prazna tudi po osvežitvi', () => {
  const { dom, run } = zacni();
  trikratVpisi(run);
  const danih = run("igra.danosti.replace(/0/g, '').length");
  dom.potrdi(true);
  dom.klikni('znovaBtn');
  assert.equal(run('igra.kazalec'), 0);
  assert.equal(JSON.parse(dom.shramba.get('sudoku.igra.v1')).igre[JSON.parse(D)].znova, true, 'namera se shrani');

  const po = osveziStran(dom);
  assert.equal(po.run('igra.kazalec'), 0, '"Začni znova" se z osvežitvijo ne razveljavi');
  assert.equal(po.run('steviloVpisanih(stanje)'), danih, 'mreža je prazna');
  assert.equal(po.run('igra.poteze.length'), 3, 'prejšnje poteze so na voljo s "Ponovi"');
  assert.match(po.dom.el('status').textContent, /Ponovi/, 'sporočilo pove, kje so poteze');

  // Prva nova poteza pobriše namero in odreže rep.
  po.run("(() => { const c = igra.danosti.split('').findIndex((ch, i) => ch === '0' && !stanje.vpisi[i]); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");
  assert.equal(po.run('igra.poteze.length'), 1);
  assert.equal(po.run('igra.znova'), false);
  const po2 = osveziStran(po.dom);
  assert.equal(po2.run('igra.kazalec'), 1, 'nova poteza je ohranjena');
  assert.equal(po2.run('steviloVpisanih(stanje)'), danih + 1);
});

/* ---------- stanje uganke iz enega vira (zbirkaStanjeUganke) ---------- */

// Vrstica seznama zbirke v igri (li) za testno uganko.
const vrsticaSeznama = run => {
  run('izrisiZbirko()');
  return run(`zbirkaVrstice.get(${D}).textContent`);
};
// Ena pravilna poteza v prvo prosto celico.
const enVpis = run => run("(() => { const c = igra.danosti.split('').findIndex((ch, i) => ch === '0' && !stanje.vpisi[i]); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");

test('kartica "Uganka": napredek "moji vpisi / prazne celice"', () => {
  const { dom, run } = zacni();
  assert.equal(dom.el('status').textContent, `Nova uganka (0/${praznih}).`);
  enVpis(run);
  enVpis(run);
  assert.equal(dom.el('status').textContent, `V teku (2/${praznih}).`);
  assert.ok(dom.el('opisUganke').textContent.includes(`· v teku (2/${praznih})`), dom.el('opisUganke').textContent);
});

test('samo odstranjen kandidat: uganka je v teku (0/57), gumb "Nadaljuj"', () => {
  const { run } = zacni();
  run("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'kandidat', celica: c, stevka: resitev()[c], odstrani: true }); })()");
  assert.equal(stanjeZapisa(run), `v teku (0/${praznih})`);
  assert.ok(vrsticaSeznama(run).includes(`v teku (0/${praznih})`));
  assert.equal(gumb(run), 'Nadaljuj');
});

test('polna mreža z napako: "v teku (57/57) · napaka", gumb "Nadaljuj"', () => {
  // V igri take mreže z dovoljenimi potezami ni mogoče dobiti (vpis je samo kandidat,
  // polna mreža brez sporov pa je pri enolični uganki rešitev) - nastane lahko iz
  // starejših ali uvoženih podatkov. Shranjeno igro zato zapišemo neposredno.
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`dodajVZbirko(${D}, 'Težka', 'generator')`);
  const res = run(`solutionOf(${D})`);
  const prazne = [...danosti].map((ch, c) => (ch === '0' ? c : -1)).filter(c => c >= 0);
  const poteze = prazne.map((c, i) => ({ tip: 'vpis', celica: c, stevka: i === prazne.length - 1 ? res[c] % 9 + 1 : res[c] }));
  dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: null, igre: { [danosti]: { poteze, kazalec: poteze.length, zacetek: '2026-09-23 10:00', nazadnje: '2026-09-23 10:00' } } }));
  run(`zbirkaShraniIgranje(${D}, '2026-09-23 10:00', 81, true)`);

  assert.equal(stanjeZapisa(run), `v teku (${praznih}/${praznih}) · napaka`);
  const li = vrsticaSeznama(run);
  assert.ok(li.includes(`zadnje reševanje 23. 9. 2026 ob 10:00 · v teku (${praznih}/${praznih}) · napaka`), li);
  assert.equal(gumb(run), 'Nadaljuj');
  // Podoznaka je svoj element z razredom "napaka" (rdeča v igra.css).
  run('izrisiZbirko()');
  assert.equal(run(`zbirkaVrstice.get(${D}).children[1].children.slice(-1)[0].className`), 'napaka');
});

test('ponovno reševanje rešene uganke: "rešena … · znova v teku", gumb "Nadaljuj"', () => {
  const { dom, run } = zacni();
  resiVse(run);
  assert.equal(gumb(run), 'Poglej');
  assert.match(vrsticaSeznama(run), /rešena \d+\. \d+\. \d{4} ob \d{2}:\d{2}/);

  dom.potrdi(true);
  dom.klikni('znovaBtn');
  enVpis(run);
  enVpis(run);
  enVpis(run);

  // Napis in gumb iz istega vira: igra je v teku, čas prve rešitve ostane.
  assert.equal(gumb(run), 'Nadaljuj');
  const li = vrsticaSeznama(run);
  assert.match(li, new RegExp(`rešena \\d+\\. \\d+\\. \\d{4} ob \\d{2}:\\d{2} · znova v teku \\(3/${praznih}\\)`), li);
  assert.match(dom.el('opisUganke').textContent, new RegExp(`\\nrešena .* · znova v teku \\(3/${praznih}\\)`));
  // Zapis v zbirki (in izvoz) ostane zamrznjen.
  assert.equal(stanjeZapisa(run), 'rešena');
  assert.ok(run('zbirkaIzvozi().besedilo').includes('- **Stanje:** rešena'));

  // Tudi po osvežitvi strani.
  const po = osveziStran(dom);
  assert.equal(gumb(po.run), 'Nadaljuj');
  assert.ok(vrsticaSeznama(po.run).includes(`znova v teku (3/${praznih})`));
});

test('vgrajeni primer: ista kartica in besedila stanj kot zbirka', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const primer = run('primeriIgre[4]');
  const P = JSON.stringify(primer.danosti);
  const prazniPrimera = [...primer.danosti].filter(ch => ch === '0').length;
  const del = razred => delKartice(run, razred, P).textContent;
  // 1. vrstica je ime primera, 2. vedno stanje, 3. danosti (primer brez zapisa v
  // zbirki nima podatkov reševanja).
  assert.equal(del('zb-vrstica'), primer.ime);
  assert.equal(del('zb-casi'), 'nova');
  assert.equal(del('zb-info'), `danih ${81 - prazniPrimera}`);
  run(`zacniIgro(${P})`);
  enVpis(run);
  // Brez zapisa v zbirki ni časa (čas shranjene igre se osveži že ob odprtju).
  assert.equal(del('zb-casi'), `v teku (1/${prazniPrimera})`);
  assert.equal(gumb(run, P), 'Nadaljuj');
  resiVse(run);
  assert.equal(del('zb-casi'), 'rešena');
  assert.equal(gumb(run, P), 'Poglej');
});

/* ---------- brisanje v igri ---------- */

// Nadomestni confirm, ki zbere besedila vprašanj (kontekst je že naložen, zato ga
// zamenjamo v njem).
function zberiVprasanja(run, odgovor) {
  run(`globalThis.__vprasanja = []; confirm = (t) => { __vprasanja.push(t); return ${odgovor}; }`);
  return () => run('__vprasanja');
}
const gumbKartice = (run, napis, d = D) => delKartice(run, 'zb-gumbi', d).children.find(b => b.textContent === napis);

test('brisanje v igri: "Izbriši" s potrditvijo, izbriše zapis in shranjeno igro', () => {
  const { dom, run } = zacni();
  zbirkaZRezevanimi(run);
  enVpis(run);
  dom.klikni('zbirkaBtn');
  assert.equal(dom.el('zbirkaBtn').textContent, 'Zbirka (3)');

  // Preklic: nič se ne spremeni.
  let vprasanja = zberiVprasanja(run, false);
  gumbKartice(run, 'Izbriši').sprozi('click');
  assert.equal(vprasanja().length, 1);
  assert.match(vprasanja()[0], /^Izbrišem uganko, dodano .* \(Težka\)\? Izbriše se tudi njen shranjeni napredek\.$/);
  assert.ok(zapis(run), 'po preklicu je uganka še v zbirki');
  assert.ok(run(`igreBeri().igre[${D}]`), 'in njena igra tudi');

  // Brisanje uganke, ki ni odprta: odprta igra ostane.
  vprasanja = zberiVprasanja(run, true);
  const d1 = JSON.stringify(druge[0]);
  gumbKartice(run, 'Izbriši', d1).sprozi('click');
  assert.equal(run(`zbirkaBeri().some(z => z.danosti === ${d1})`), false);
  assert.equal(run('igra.danosti'), JSON.parse(D), 'odprta uganka ostane');
  assert.equal(dom.el('zbirkaBtn').textContent, 'Zbirka (2)');
  assert.equal(dom.el('zbirkaStatus').textContent, 'Uganka je izbrisana.');

  // Brisanje odprte uganke: mreža se izprazni kot ob prvem zagonu.
  gumbKartice(run, 'Izbriši').sprozi('click');
  assert.equal(zapis(run), undefined);
  assert.equal(run(`igreBeri().igre[${D}]`), undefined, 'shranjena igra je izbrisana');
  assert.equal(run('igra'), null, 'ni odprte uganke');
  assert.ok(dom.el('mreza').className.includes('prazna'));
  assert.equal(dom.el('opisUganke').textContent, 'Ni odprte uganke.');
  assert.equal(dom.el('zbirkaBtn').textContent, 'Zbirka (1)');
  // Ob osvežitvi strani se ne odpre nič (zadnja igra je bila izbrisana).
  const po = osveziStran(dom);
  assert.equal(po.run('igra'), null);
});

test('brisanje v igri: vgrajeni primer nima gumba "Izbriši"', () => {
  const { run } = zacni();
  const P = JSON.stringify(run('primeriIgre[4].danosti'));
  assert.deepEqual(delKartice(run, 'zb-gumbi', P).children.map(b => b.textContent), ['Igraj']);
  assert.deepEqual(delKartice(run, 'zb-gumbi').children.map(b => b.textContent), ['Igraj', 'Izbriši']);
});

test('"Izbriši vse" v igri: potrditev s številom in izvozom, primeri ostanejo, mreža se izprazni', () => {
  const { dom, run } = zacni();
  zbirkaZRezevanimi(run);
  // Napredek pri primeru, nato nazaj na uganko iz zbirke.
  const P = JSON.stringify(run('primeriIgre[4].danosti'));
  run(`zacniIgro(${P})`);
  enVpis(run);
  run(`zacniIgro(${D})`);
  enVpis(run);
  dom.klikni('zbirkaBtn');

  let vprasanja = zberiVprasanja(run, false);
  dom.klikni('zbirkaIzbrisiVseBtn');
  assert.equal(vprasanja().length, 1);
  assert.ok(vprasanja()[0].includes('(3)'), vprasanja()[0]);
  assert.ok(vprasanja()[0].includes('najprej izvoziš'), 'priporoči izvoz');
  assert.equal(run('zbirkaBeri().length'), 3, 'brez potrditve se nič ne izbriše');

  vprasanja = zberiVprasanja(run, true);
  dom.klikni('zbirkaIzbrisiVseBtn');
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], [JSON.parse(P)], 'ostane samo igra primera');
  assert.equal(run('igra'), null, 'odprta uganka je bila v zbirki - mreža je prazna');
  assert.equal(dom.el('zbirkaBtn').textContent, 'Zbirka (0)');
  assert.equal(dom.el('zbirkaStatus').textContent, 'Izbrisanih ugank: 3.');
  assert.equal(dom.el('zbirkaSeznam').children[0].className, 'prazno');
  // Primer se igra naprej od shranjenega napredka.
  assert.equal(gumb(run, P), 'Nadaljuj');
});

test('"Izbriši vse" v igri: odprt primer ostane na mreži', () => {
  const { dom, run } = zacni();
  const P = run('primeriIgre[4].danosti');
  run(`zacniIgro(${JSON.stringify(P)})`);
  zberiVprasanja(run, true);
  dom.klikni('zbirkaIzbrisiVseBtn');
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(run('igra.danosti'), P);
});

test('igra vgrajenega primera v zbirko ne doda', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`dodajVZbirko(${JSON.stringify(run('primeriIgre[1].danosti'))}, 'Ekstrem', 'rocno')`);
  assert.equal(run('zbirkaBeri().length'), 0);
});

test('zapis brez shranjene igre (uvoz z druge naprave): napis iz zapisa, gumb "Igraj"', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const md = [`- **Danosti:** \`${danosti.replace(/0/g, '.')}\``, '- **Dodano:** 2026-09-20 10:00',
    '- **Zadnje reševanje:** 2026-09-21 10:00', `- **Stanje:** v teku (12/${praznih})`].join('\n');
  assert.equal(run(`zbirkaUvozi(${JSON.stringify(md)})`).napaka, false);
  assert.ok(vrsticaSeznama(run).includes(`zadnje reševanje 21. 9. 2026 ob 10:00 · v teku (12/${praznih})`));
  assert.equal(gumb(run), 'Igraj', 'v tem brskalniku ni česa nadaljevati');
});

test('"vse razveljavljeno": kartica kaže prazno mrežo, seznam pa to, kar se odpre', () => {
  const { dom, run } = zacni();
  trikratVpisi(run);
  for (let i = 0; i < 3; i++) dom.klikni('razveljaviBtn');
  assert.equal(dom.el('status').textContent, `V teku (0/${praznih}).`, 'na mreži ni vpisov');
  // Ob odprtju se igra vrne na konec zgodovine - to kaže seznam.
  assert.ok(vrsticaSeznama(run).includes(`v teku (3/${praznih})`));
  assert.equal(gumb(run), 'Nadaljuj');
});

/* ---------- okno "Zbirka ugank": vgrajeni primeri na dnu, zložljivi ---------- */

// Odpre okno "Zbirka ugank" z gumbom v glavi in vrne, ali je razdelek s primeri odprt.
const primeriOdprtiObOdprtju = dom => { dom.klikni('zbirkaBtn'); return dom.el('primeriRazdelek').open; };

test('vgrajeni primeri: privzeto zaprti, v naslovu število primerov', () => {
  const { dom, run } = zacni(); // zbirka ni prazna, odprta je uganka iz zbirke
  assert.equal(dom.el('primeriNaslov').textContent, `Vgrajeni primeri (${run('PRIMERI.length')})`);
  assert.equal(primeriOdprtiObOdprtju(dom), false);
  // Igralec razdelek odpre; ponoven izris seznama (uvoz, ocene) ga ne zapre.
  dom.el('primeriRazdelek').open = true;
  run('izrisiZbirko()');
  assert.equal(dom.el('primeriRazdelek').open, true, 'izris ne spremeni igralčeve izbire');
  // Ob naslednjem odprtju okna velja spet privzeto.
  assert.equal(primeriOdprtiObOdprtju(dom), false);
  assert.equal(run("document.getElementById('primeriSeznam').children.length"), run('PRIMERI.length'), 'kartice primerov so izrisane');
});

test('vgrajeni primeri: odprti, ko je moja zbirka prazna', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(primeriOdprtiObOdprtju(dom), true);
  assert.ok(dom.el('zbirkaSeznam').textContent.includes('vgrajenih primerov spodaj'), dom.el('zbirkaSeznam').textContent);
});

test('vgrajeni primeri: odprti, ko je odprta uganka primer', () => {
  const { dom, run } = zacni();
  const primer = run('primeriIgre[2]');
  run(`zacniIgro(${JSON.stringify(primer.danosti)})`);
  assert.equal(primeriOdprtiObOdprtju(dom), true);
  const li = run(`[...document.getElementById('primeriSeznam').children].find(li => li.className === 'trenutna')`);
  assert.ok(li && li.textContent.includes(primer.ime), 'kartica primera je označena kot trenutna');
  // Oznaka je značka v 1. vrstici - edino mesto, ne v vrstici z danostmi.
  const znacka = li.children[0].children.find(el => el.className === 'zb-trenutna');
  assert.equal(znacka && znacka.textContent, 'trenutno odprta');
  assert.ok(!li.children.find(el => el.className === 'zb-info').textContent.includes('trenutno'));
  // Nazaj na uganko iz zbirke: razdelek je ob odprtju okna spet zaprt.
  run(`zacniIgro(${D})`);
  assert.equal(primeriOdprtiObOdprtju(dom), false);
});
