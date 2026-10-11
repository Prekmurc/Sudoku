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
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js',
  'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'];

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

// Kazalo tehnik in gumb »↑« v meniju (naloga 4c, korak 2, O4 in O5 v docs/navigacija-nacrt.md; sestavina v
// shared/navigacija.js). Nadomestni DOM nima kartic menija (querySelector vrne null), zato tu samo vsebina
// kazala in vidnost gumba; pomik do kartice, velikost oznak (D3) in prekrivanje z gumboma kartice preverja
// tools/preveri-navigacija-brskalnik.js --korak 2.
const OZNAKE = ['E1', 'E2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
// Raven po oznaki (tabela ravni, ne koda): E1, E2 lahka, 1–6 srednja, 7–12 napredna, 13 ekspertna.
const RAZRED = o => (o[0] === 'E' ? 't-single' : +o <= 6 ? 't-pair' : +o <= 12 ? 't-advanced' : 't-expert');

test('kazalo tehnik v HTML: <nav id="kazaloTehnik"> v #menu pred prvo kartico', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const meni = html.slice(html.indexOf('<div id="menu">'), html.indexOf('<div id="trainer">'));
  const nav = meni.indexOf('<nav id="kazaloTehnik"');
  assert.ok(nav > 0, 'kazalo je v #menu');
  assert.ok(nav < meni.indexOf('class="menu-card"'), 'pred prvo kartico');
  assert.match(meni.slice(nav, meni.indexOf('>', nav)), /class="kazalo-tehnik"/);
  assert.match(meni.slice(nav, meni.indexOf('>', nav)), /aria-label="Kazalo tehnik"/);
});

test('kazalo tehnik: 15 oznak v vrstnem redu kartic, razred po ravni, ime v title in aria-label', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0;
  const { run } = loadContext(DATOTEKE, dom.globals);
  const kartice = run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([m]) => m)');
  const opisi = run('TEHNIKE_OPISI');
  const gumbi = dom.el('kazaloTehnik').children;
  assert.equal(gumbi.length, 15);
  gumbi.forEach((g, i) => {
    const o = OZNAKE[i], m = kartice[i];
    assert.equal(g.tagName, 'BUTTON', o);
    assert.equal(g.type, 'button', o);
    assert.equal(g.textContent, o);
    assert.equal(g.dataset.kazalo, m, `${o}: kartica ${m}`);
    assert.ok(g.classList.contains('tag') && g.classList.contains(RAZRED(o)), `${o}: ${g.className}`);
    assert.ok(g.title.startsWith(`${o} · ${opisi[m].ime} (`), `${o}: ${g.title}`);
    assert.equal(g.getAttribute('aria-label'), g.title, o);
  });
  // Seznam brez DOM-a je isti (za kazalo v oknu Pomoč, korak 3).
  assert.deepEqual([...run('kazaloTehnik().map(p => p.oznaka)')], OZNAKE);
  // Klik oznake vaje ne začne (pomik do kartice preverja brskalnik).
  gumbi[8].sprozi('click');
  assert.equal(run('mode'), null);
  assert.equal(dom.el('trainer').style.display, undefined);
});

test('gumb »↑«: skrit na vrhu in v vaji, v meniju viden po enem zaslonu – tudi takoj po »Nazaj na izbiro«', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0;
  const { run } = loadContext(DATOTEKE, dom.globals);
  const okno = dom.globals.window;
  const drsi = y => { okno.scrollTo(0, y); okno.sprozi('scroll'); };
  const gumb = dom.document.body.children.find(e => e.classList.contains('na-vrh'));
  assert.ok(gumb, 'gumb je v <body>');
  assert.equal(gumb.tagName, 'BUTTON');
  assert.equal(gumb.textContent, '↑');
  assert.equal(gumb.title, 'Na vrh');
  assert.equal(gumb.getAttribute('aria-label'), 'Na vrh');

  assert.equal(gumb.hidden, true, 'na vrhu skrit');
  drsi(okno.innerHeight);
  assert.equal(gumb.hidden, true, 'po natanko enem zaslonu še skrit');
  drsi(okno.innerHeight + 1);
  assert.equal(gumb.hidden, false, 'po enem zaslonu viden');

  // V vaji skrit, tudi ko je stran pomaknjena več kot en zaslon.
  drsi(2000);
  run('zacniKrog("x-wing", "spoznaj")');
  assert.equal(gumb.hidden, true, 'Spoznaj: skrit');
  drsi(1500);
  assert.equal(gumb.hidden, true, 'Spoznaj, pomaknjena vaja: skrit');
  // »Nazaj na izbiro« vrne meni na 2000 px – gumb viden brez dodatnega drsenja (brez dogodka scroll).
  dom.klikni('backBtnDno');
  assert.equal(okno.scrollY, 2000);
  assert.equal(gumb.hidden, false, 'po »Nazaj na izbiro« (spodnji) viden');

  run('zacniKrog("swordfish", "uganka")');
  assert.equal(gumb.hidden, true, 'Vadi v uganki: skrit');
  dom.klikni('backBtn');
  assert.equal(gumb.hidden, false, 'po »Nazaj na izbiro« (zgornji) viden');

  // Kartica blizu vrha: po vrnitvi skrit.
  drsi(300);
  run('zacniKrog("naked-single", "spoznaj")');
  dom.klikni('backBtn');
  assert.equal(okno.scrollY, 300);
  assert.equal(gumb.hidden, true, 'meni na 300 px: skrit');

  // Klik »↑« pomakne na vrh.
  drsi(2500);
  gumb.sprozi('click');
  assert.equal(okno.scrollY, 0, 'na vrhu');
  okno.sprozi('scroll');
  assert.equal(gumb.hidden, true);
});

// Popravek B po ročnem pregledu naloge 4c (docs/navigacija-nacrt.md, razdelek 9): na dnu vaje desno od
// spodnjega »Nazaj na izbiro« gumb »↑ Na vrh« v isti vrstici in istega videza (razred back-btn), ni plavajoč;
// klik pomakne stran na vrh, vaja ostane. V »Spoznaj«, »Vadi v uganki« in pri »Končano!«. Okrogel plavajoč »↑«
// ostane samo v meniju. Eno vrstico pri 320 px brez preliva preverja tools/preveri-navigacija-brskalnik.js --korak 5.
test('popravek B: »↑ Na vrh« na dnu vaje – v HTML v isti vrstici desno od spodnjega »Nazaj na izbiro«, isti razred', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const trainer = html.slice(html.indexOf('<div id="trainer">'), html.indexOf('<div id="pomocDialog"'));
  const vrstica = trainer.match(/<div class="dno-vaje">([\s\S]*?)<\/div>/);
  assert.ok(vrstica, 'vrstica .dno-vaje v #trainer');
  assert.ok(trainer.indexOf('<div class="dno-vaje">') > trainer.indexOf('id="exerciseArea"'), 'vrstica za #exerciseArea');
  const gumbi = [...vrstica[1].matchAll(/<button([^>]*)>([^<]*)<\/button>/g)];
  assert.deepEqual(gumbi.map(g => g[2]), ['← Nazaj na izbiro', '↑ Na vrh'], 'Nazaj levo, Na vrh desno');
  assert.match(gumbi[0][1], /id="backBtnDno"/);
  assert.match(gumbi[1][1], /id="naVrhDno"/);
  for (const g of gumbi) assert.match(g[1], /class="[^"]*\bback-btn\b/, 'isti videz kot »Nazaj na izbiro«');
  assert.doesNotMatch(gumbi[1][1], /\bna-vrh\b/, 'ni okrogel plavajoč gumb');
});

test('popravek B: klik »↑ Na vrh« na dnu vaje pomakne stran na vrh (Spoznaj, Vadi v uganki, Končano!), vaja ostane', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0;
  const { run } = loadContext(DATOTEKE, dom.globals);
  const okno = dom.globals.window;
  const plavajoc = dom.document.body.children.find(e => e.classList.contains('na-vrh'));
  const primeri = [['x-wing', 'spoznaj', ''], ['hidden-pair', 'uganka', ''], ['naked-pair', 'spoznaj', 'konec']];
  for (const [mode, nacin, konec] of primeri) {
    run(`zacniKrog(${JSON.stringify(mode)}, ${JSON.stringify(nacin)})`);
    if (konec) run('exNum = MAX_EX; renderExercise()');
    okno.scrollTo(0, 1800);
    okno.sprozi('scroll');
    assert.equal(plavajoc.hidden, true, `${mode} ${nacin}: okrogel »↑« v vaji skrit`);
    dom.klikni('naVrhDno');
    assert.equal(okno.scrollY, 0, `${mode} ${nacin} ${konec}: stran na vrhu`);
    assert.equal(dom.el('trainer').style.display, 'block', 'vaja ostane odprta');
    assert.equal(dom.el('menu').style.display, 'none');
    assert.equal(run('mode'), mode);
  }
});
