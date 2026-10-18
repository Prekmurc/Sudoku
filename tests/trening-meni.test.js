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
const { makeDom, Element, omogociIskanje } = require('./dom-stub.js');

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

// Naloga 6b, korak 1 (O1–O3 v docs/naloga6b-nacrt.md): v zgornji vrstici vaje desno od »Nazaj na izbiro« gumb za
// drugi način iste tehnike – »↔ Vadi v uganki« v »Spoznaj«, »↔ Spoznaj« v »Vadi v uganki«, istega videza (back-btn).
// Dotik začne nov krog v drugem načinu brez vprašanja (kot gumb na kartici); položaj menija ostane od odhoda iz
// menija. Isto pravilo CSS za zgornjo in spodnjo vrstico, eno vrstico pri 320–1280 px preverja
// tools/preveri-naloga6b-brskalnik.js --korak 1.
test('korak 6b-a: zgornja vrstica vaje – levo »Nazaj na izbiro«, desno gumb drugega načina, pred rezultatom', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const trainer = html.slice(html.indexOf('<div id="trainer">'), html.indexOf('<div id="pomocDialog"'));
  const vrstica = trainer.match(/<div class="vrh-vaje">([\s\S]*?)<\/div>/);
  assert.ok(vrstica, 'vrstica .vrh-vaje v #trainer');
  assert.ok(trainer.indexOf('<div class="vrh-vaje">') < trainer.indexOf('class="score-bar"'), 'nad rezultatom');
  const gumbi = [...vrstica[1].matchAll(/<button([^>]*)>([^<]*)<\/button>/g)];
  assert.equal(gumbi.length, 2);
  assert.match(gumbi[0][1], /id="backBtn"/);
  assert.equal(gumbi[0][2], '← Nazaj na izbiro');
  assert.match(gumbi[1][1], /id="drugiNacin"/);
  assert.match(gumbi[1][1], /type="button"/);
  for (const g of gumbi) assert.match(g[1], /class="[^"]*\bback-btn\b/, 'videz kot »Nazaj na izbiro«');
  // Isto pravilo CSS za obe vrstici (ne kopija).
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'trening.css'), 'utf8');
  assert.match(css, /\.vrh-vaje,\.dno-vaje\{display:flex;/);
  assert.doesNotMatch(css, /(^|\})\.dno-vaje\{display:flex/m, 'spodnja vrstica nima svojega pravila');
});

// Popravek koraka a (P1 = A v docs/naloga6b-nacrt.md, razdelek 10): kadar gumba ne gresta v eno vrstico (320 px,
// »Spoznaj«), gre drugi v novo vrstico, desno – napisa se ne prelomita. Razporeditev preverja
// tools/preveri-naloga6b-brskalnik.js --korak 1.
test('popravek 6b-a: ozek zaslon – drugi gumb vrstice v novo vrstico, desno (isto pravilo za obe vrstici)', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'trening.css'), 'utf8');
  assert.match(css, /\.vrh-vaje,\.dno-vaje\{display:flex;flex-wrap:wrap;/, 'prelom vrstice');
  assert.match(css, /:is\(\.vrh-vaje,\.dno-vaje\) button\.back-btn:last-child\{margin-left:auto\}/, 'drugi gumb ob desnem robu');
});

test('korak 6b-a: napis po načinu; dotik začne nov krog iste tehnike v drugem načinu, »Nazaj« vrne na isto mesto', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0; // iskanje vaje »Vadi v uganki« ostane v teku
  const { run } = loadContext(DATOTEKE, dom.globals);
  const okno = dom.globals.window;
  const gumb = dom.el('drugiNacin');
  assert.equal(run('napisDrugegaNacina("spoznaj")'), '↔ Vadi v uganki');
  assert.equal(run('napisDrugegaNacina("uganka")'), '↔ Spoznaj');

  okno.scrollY = 1334;
  run('zacniKrog("hidden-pair", "spoznaj")');
  assert.equal(gumb.textContent, '↔ Vadi v uganki', 'Spoznaj');
  // Sredi kroga: vaja 4, rezultat 2 / 3, spremenjene nastavitve kroga.
  run('exNum = 3; scoreRight = 2; scoreTotal = 3; sPomocjo = 1; razlagaKrog = true; vecCelicKrog = false; updateScore(); renderExercise()');
  okno.scrollTo(0, 600);
  dom.klikni('drugiNacin');
  assert.equal(run('mode'), 'hidden-pair', 'ista tehnika');
  assert.equal(run('nacin'), 'uganka', 'drugi način');
  assert.equal(run('exNum'), 0, 'vaja 1');
  assert.deepEqual([run('scoreRight'), run('scoreTotal'), run('sPomocjo')], [0, 0, 0]);
  assert.equal(String(dom.el('scoreRight').textContent), '0');
  assert.equal(String(dom.el('scoreTotal').textContent), '0');
  assert.equal(run('razlagaKrog'), false, 'nastavitve kroga kot ob začetku iz menija');
  assert.equal(run('vecCelicKrog'), null);
  assert.equal(run('vadi') === null, true, 'iskanje vaje »Vadi v uganki« teče');
  assert.equal(okno.scrollY, 0, 'nov krog na vrhu strani');
  assert.equal(dom.el('menu').style.display, 'none');
  assert.equal(dom.el('trainer').style.display, 'block');
  assert.equal(run('menuPolozaj'), 1334, 'položaj menija od odhoda iz menija');
  assert.equal(gumb.textContent, '↔ Spoznaj', 'Vadi v uganki');
  assert.match(run('vprasanjeOdhoda() || ""'), /^$/, 'vaja 1 brez »Preveri« – brez vprašanja');
  run('exNum = 2');
  assert.match(run('vprasanjeOdhoda()'), /Krog 4 · Skriti par · Vadi v uganki \(vaja 3 \/ 9, pravilno 0 \/ 0\)/, 'vprašanje pove novi način');
  run('exNum = 0');

  // Iz »Vadi v uganki« nazaj v »Spoznaj« – iskanje »Iščem vajo …« se prekine.
  const iskanje = run('vadiIskanje');
  dom.klikni('drugiNacin');
  assert.ok(run('vadiIskanje') > iskanje, 'iskanje prekinjeno');
  assert.equal(run('nacin'), 'spoznaj');
  assert.equal(run('mode'), 'hidden-pair');
  assert.equal(gumb.textContent, '↔ Vadi v uganki');
  dom.klikni('backBtn');
  assert.equal(okno.scrollY, 1334, '»Nazaj na izbiro« po prehodu – položaj kot ob odhodu iz menija');
  assert.equal(dom.el('menu').style.display, 'block');

  // Pri »Končano!« gumb ostane (zunaj #exerciseArea) in začne krog v drugem načinu.
  okno.scrollY = 400;
  run('zacniKrog("x-wing", "spoznaj")');
  run('exNum = MAX_EX; renderExercise()');
  dom.klikni('drugiNacin');
  assert.equal(run('nacin'), 'uganka');
  assert.equal(run('exNum'), 0);
  assert.equal(run('mode'), 'x-wing');
  dom.klikni('backBtnDno');
  assert.equal(okno.scrollY, 400);
});

test('korak 6b-a: Pomoč treninga omeni gumb drugega načina', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  assert.ok(html.includes('<p>Krog ima devet vaj. Zgoraj je rezultat, na koncu kroga povzetek; z <b>Nazaj na izbiro</b> izbereš drugo tehniko, z <b>↔ Vadi v uganki</b> oziroma <b>↔ Spoznaj</b> desno ob njem pa začneš nov krog iste tehnike v drugem načinu.</p>'));
});

// Naloga 11a, korak 2 (opažanje ob izvedbi): Pomoč treninga ne omenja drugih aplikacij (pravilo besedil); primer
// oznak pri uganki ostane.
test('naloga 11a-2: Pomoč treninga brez omembe igre in reševalca, primer oznak ostane', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const pomoc = html.slice(html.indexOf('<div id="pomocDialog"'), html.indexOf('<script'));
  assert.doesNotMatch(pomoc.replace(/<[^>]*>/g, ''), /\bigr[aieo]\b|reševal/i);
  assert.ok(pomoc.includes('<p>Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje. Z istimi oznakami so naštete '
    + 'tehnike, ki jih uganka potrebuje – npr. <b>Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par</b>.</p>'));
});

// Naloga 6b, korak 2 (O4 A, O5 A, O6 B, O12 A, O13 A in razdelek 2.5 v docs/naloga6b-nacrt.md): kazalo tehnik v meniju je
// seznam – vrstica z oznako v barvi ravni ter slovenskim in angleškim imenom (izrisiKazaloTehnik(…, { imena: true })).
// Kartica in vrstica tehnike, ki si jo nazadnje vadil, imata razred `zadnja` (moder okvir); postavi ga začetek kroga,
// zapomni si ga ključ sudoku.trening.zadnja. Stolpce, okvir in razporeditev preverja
// tools/preveri-naloga6b-brskalnik.js --korak 2. Okno Pomoč kliče brez možnosti – vrstica oznak ostane (pomoc.test.js).
const ZADNJA_KLJUC = 'sudoku.trening.zadnja';
const elementi = (el, out = []) => { for (const c of el.children || []) { out.push(c); elementi(c, out); } return out; };
// Meni s 15 karticami v vrstnem redu iz trening/index.html (nadomestni DOM jih sicer nima) – za razred `zadnja` na
// kartici in naslove skupin (naloga 11a); kartica ima značko, naslov h3 in opis kot v HTML.
function domSKarticami(shramba) {
  const dom = makeDom(shramba);
  dom.globals.setTimeout = () => 0;
  const meni = dom.el('menu');
  for (const m of ['naked-single', 'hidden-single', 'naked-pair', 'hidden-pair', 'pointing', 'box-line', 'naked-triple',
    'hidden-triple', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain']) {
    const k = new Element('div');
    k.className = 'menu-card';
    k.dataset.mode = m;
    const z = new Element('span');
    z.className = 'badge';
    k.append(z, new Element('h3'), new Element('p'));
    omogociIskanje(k);
    meni.appendChild(k);
  }
  omogociIskanje(meni);
  return dom;
}
const zadnjeKartice = dom => dom.el('menu').children.filter(k => k.classList.contains('menu-card') && k.classList.contains('zadnja')).map(k => k.dataset.mode);
// Vrstice kazala (od naloge 11a v skupinah in stolpcih – gumbi .kazalo-vrstica kjer koli v kazalu).
const vrsticeKazala = el => elementi(el).filter(e => e.classList.contains('kazalo-vrstica'));
const zadnjeVrstice = dom => vrsticeKazala(dom.el('kazaloTehnik')).filter(v => v.classList.contains('zadnja')).map(v => v.dataset.kazalo);

test('korak 6b-b: kazaloTehnik() ima še slovensko ime (imeTehnike brez angleškega) in angleško (TEHNIKE_OPISI)', () => {
  const { run } = loadContext(DATOTEKE, makeDom().globals);
  const postavke = run('kazaloTehnik()');
  const opisi = run('TEHNIKE_OPISI');
  assert.deepEqual(Array.from(postavke, p => p.oznaka), OZNAKE);
  for (const p of postavke) {
    assert.equal(p.slovensko, run('imeTehnike')(p.tehnika, { anglesko: false }), p.oznaka);
    assert.equal(p.slovensko, opisi[p.kljuc].ime, p.oznaka);
    assert.equal(p.anglesko, opisi[p.kljuc].anglesko, p.oznaka);
    assert.equal(p.ime, `${p.oznaka} · ${p.slovensko} (${p.anglesko})`, 'obstoječe polje ostane');
  }
});

// Naloga 11a, korak 2 (docs/naloga11a-nacrt.md, 1.6 in 5.3): kazalo ima eno obliko za meni treninga in okno Pomoč
// (možnost { imena } odpade) – dva stolpca .kazalo-stolpec (levo skupine težavnosti Lahka in Srednja, desno Težka in
// Ekstremna), v njih skupine .kazalo-skupina (SKUPINE_TEHNIK v shared/engine.js) z naslovom .kazalo-naslov (ime skupine
// in značka težavnosti v barvi ravni) in vrsticami .kazalo-vrstica (oznaka, slovensko in angleško ime). Pričakovane
// skupine so iz tabele odločitve 2026-10-18 (docs/uskladitev.md 1.1), dolge verige do zadnje tehnike (11b doda tehniko).
const SKUPINE_KAZALA = [
  ['enojcki', ['E1', 'E2'], 'LAHKA (EASY)'],
  ['preseki', ['1', '2'], 'SREDNJA (MEDIUM)'],
  ['podmnozice', ['3', '4', '5', '6'], 'SREDNJA (MEDIUM)'],
  ['ribe', ['7', '8'], 'TEŽKA (HARD)'],
  ['kratke-verige', ['9', '10', '11'], 'TEŽKA (HARD)'],
  ['edinstvenost', ['12'], 'TEŽKA (HARD)'],
  ['dolge-verige', OZNAKE.slice(OZNAKE.indexOf('12') + 1), 'EKSTREMNA (EXTREME)'],
];
const STOLPCA_KAZALA = [['enojcki', 'preseki', 'podmnozice'], ['ribe', 'kratke-verige', 'edinstvenost', 'dolge-verige']];
// Zgradba kazala brez poslušalcev (za primerjavo kazala v meniju in v Pomoči).
const zgradba = e => [e.tagName, e.className, e.children && e.children.length ? e.children.map(zgradba) : e.textContent,
  e.dataset ? e.dataset.kazalo || e.dataset.skupina || '' : '', e.getAttribute ? e.getAttribute('aria-label') : ''];
function preveriKazalo(run, el) {
  const opisi = run('TEHNIKE_OPISI');
  const vaje = run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]');
  assert.ok(!el.classList.contains('z-imeni'), 'brez razreda z-imeni – ena oblika');
  assert.deepEqual(el.children.map(c => [c.tagName, c.className]), [['DIV', 'kazalo-stolpec'], ['DIV', 'kazalo-stolpec']]);
  assert.deepEqual(el.children.map(st => st.children.map(g => g.dataset.skupina)), STOLPCA_KAZALA, 'levo Lahka in Srednja, desno Težka in Ekstremna');
  const skupine = el.children.flatMap(st => st.children);
  skupine.forEach((g, i) => {
    const [kljuc, oznake, znacka] = SKUPINE_KAZALA[i];
    const s = run('SKUPINE_TEHNIK')[i];
    assert.equal(g.tagName, 'DIV');
    assert.equal(g.className, 'kazalo-skupina', kljuc);
    assert.equal(g.getAttribute('role'), 'group');
    assert.equal(g.getAttribute('aria-label'), `${s.ime} (${s.anglesko})`, kljuc);
    const [naslov, ...vrstice] = g.children;
    assert.equal(naslov.className, 'kazalo-naslov', `${kljuc}: naslov nad vrsticami`);
    assert.deepEqual(naslov.children.map(e => [e.tagName, e.className, e.textContent]), [
      ['SPAN', 'kazalo-skupina-ime', `${s.ime} (${s.anglesko})`],
      ['SPAN', `tag ${RAZRED(oznake[0])} kazalo-tezavnost`, znacka]], `${kljuc}: ime in značka težavnosti`);
    assert.deepEqual(vrstice.map(v => v.children[0].textContent), oznake, `${kljuc}: vrstice skupine`);
  });
  const vrstice = vrsticeKazala(el);
  assert.equal(vrstice.length, 15);
  vrstice.forEach((v, i) => {
    const o = OZNAKE[i], [m, t] = vaje[i];
    assert.equal(v.tagName, 'BUTTON', o);
    assert.equal(v.type, 'button', o);
    assert.equal(v.className, 'kazalo-vrstica', o);
    assert.equal(v.dataset.kazalo, m, `${o}: kartica ${m}`);
    const [oznaka, imena] = v.children;
    assert.equal(oznaka.tagName, 'SPAN');
    assert.equal(oznaka.className, `tag ${RAZRED(o)}`, `${o}: oznaka v barvi ravni`);
    assert.equal(oznaka.textContent, o);
    assert.equal(imena.className, 'kazalo-imena');
    assert.deepEqual(imena.children.map(e => [e.tagName, e.className, e.textContent]),
      [['SPAN', 'si', run('imeTehnike')(t, { anglesko: false })], ['SPAN', 'en', opisi[m].anglesko]], o);
    assert.equal(v.title, '', `${o}: imeni sta vidni – brez title`);
  });
  return vrstice;
}

test('naloga 11a-2: izrisiKazaloTehnik() – dva stolpca, skupine z naslovom in značko težavnosti, vrstice z imeni; vrne vrstice', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const el = new Element('nav');
  el.className = 'kazalo-tehnik';
  const klik = [];
  const vrnjene = run('izrisiKazaloTehnik')(el, p => klik.push(p.kljuc));
  const vrstice = preveriKazalo(run, el);
  assert.equal(vrnjene.length, 15);
  vrnjene.forEach((v, i) => assert.equal(v, vrstice[i], 'vrne gumbe vrstic v vrstnem redu'));
  vrstice.forEach(v => assert.equal(v.getAttribute('aria-label'), run('imeTehnike')(run('TEHNIKA_VAJE')[v.dataset.kazalo], { stevilka: true })));
  vrstice[3].sprozi('click');
  assert.deepEqual(klik, ['box-line']);
  // Ponoven izris zamenja vsebino.
  run('izrisiKazaloTehnik')(el, () => {});
  assert.equal(vrsticeKazala(el).length, 15);
  // kazaloTehnik(): postavka ima še ključ skupine.
  assert.deepEqual(Array.from(run('kazaloTehnik()'), p => p.skupina),
    SKUPINE_KAZALA.flatMap(([k, oznake]) => oznake.map(() => k)));
});

test('naloga 11a-2: kazalo v meniju – oblika iz izrisiKazaloTehnik(), aria-label, klik vaje ne začne', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0;
  const { run } = loadContext(DATOTEKE, dom.globals);
  const vaje = run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]');
  const vrstice = preveriKazalo(run, dom.el('kazaloTehnik'));
  vrstice.forEach((v, i) => assert.equal(v.getAttribute('aria-label'), run('imeTehnike')(vaje[i][1], { stevilka: true }), OZNAKE[i]));
  vrstice[12].sprozi('click');
  assert.equal(run('mode'), null, 'klik vaje ne začne');
  assert.equal(dom.el('trainer').style.display, undefined);
});

test('naloga 11a-2: kazalo v Pomoči treninga je iste oblike kot v meniju (isti razredi, vrstni red, vrstice)', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0;
  const { run } = loadContext(DATOTEKE, dom.globals);
  const [, nav] = dom.el('pomocTehnike').children;
  assert.equal(nav.tagName, 'NAV');
  assert.equal(nav.getAttribute('aria-label'), 'Kazalo tehnik');
  preveriKazalo(run, nav);
  assert.equal(nav.className, 'kazalo-tehnik');
  assert.deepEqual(zgradba(nav)[2], zgradba(dom.el('kazaloTehnik'))[2], 'ista zgradba kot kazalo v meniju');
});

test('naloga 11a-2: naslov skupine (h2 »Podmnožice (Subsets) · 3–6«) tik pred prvo kartico vsake skupine – sedem v vrstnem redu', () => {
  const dom = domSKarticami();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const meni = dom.el('menu').children;
  const nasloviMenija = meni.filter(e => e.tagName === 'H2');
  assert.equal(nasloviMenija.length, 7);
  assert.ok(nasloviMenija.every(h => h.className === 'skupina-naslov'));
  const skupine = run('SKUPINE_TEHNIK');
  assert.deepEqual(nasloviMenija.map(h => h.textContent), Array.from(skupine, s => run('imeSkupine')(s, { stevilke: true })));
  assert.equal(nasloviMenija[2].textContent, 'Podmnožice (Subsets) · 3–6');
  assert.equal(nasloviMenija[0].textContent, 'Enojčki (Singles) · E1–E2');
  // Za vsakim naslovom kartice njegove skupine v vrstnem redu, do naslednjega naslova.
  const poSkupinah = [];
  for (const e of meni) {
    if (e.tagName === 'H2') poSkupinah.push([]);
    else if (e.classList.contains('menu-card')) poSkupinah[poSkupinah.length - 1].push(e.querySelector('h3').dataset.stevilka);
  }
  assert.deepEqual(poSkupinah, SKUPINE_KAZALA.map(([, oznake]) => oznake));
  assert.equal(meni.filter(e => e.classList.contains('menu-card')).length, 15, 'vsaka kartica enkrat');
});

test('naloga 11a-2, O7: seznam tehnik v Pomoči ima pred prvo tehniko vsake skupine naslov z istim besedilom kot nad karticami', () => {
  const dom = domSKarticami();
  loadContext(DATOTEKE, dom.globals);
  const nasloviMenija = dom.el('menu').children.filter(e => e.tagName === 'H2').map(h => h.textContent);
  const [, , ul] = dom.el('pomocTehnike').children;
  assert.equal(ul.children.length, 15, 'vrstic seznama je še vedno 15 (naslov je v prvi tehniki skupine)');
  const prve = [];
  ul.children.forEach((li, i) => {
    const h = li.children[0];
    if (h.tagName === 'H4') {
      assert.equal(h.className, 'tehnike-skupina');
      prve.push([OZNAKE[i], h.textContent]);
    }
    assert.equal(li.children.filter(e => e.tagName === 'H4').length, h.tagName === 'H4' ? 1 : 0, `${OZNAKE[i]}: največ en naslov, na začetku`);
  });
  assert.deepEqual(prve.map(p => p[1]), nasloviMenija, 'isto besedilo kot naslovi nad karticami');
  assert.deepEqual(prve.map(p => p[0]), SKUPINE_KAZALA.map(([, oznake]) => oznake[0]), 'pred prvo tehniko skupine');
});

test('naloga 11a-2: vrh vaje – vrstica skupine nad ex-label v »Spoznaj« in »Vadi v uganki« (tudi E1, E2)', () => {
  const dom = makeDom();
  dom.globals.setTimeout = () => 0; // iskanje vaje »Vadi v uganki« ostane v teku
  const { run } = loadContext(DATOTEKE, dom.globals);
  const vaja = () => dom.el('exerciseArea').children[0];
  for (const [m, skupina, ime] of [['hidden-triple', 'Podmnožice (Subsets)', '6 · Skrita trojica (Hidden Triple)'],
    ['naked-single', 'Enojčki (Singles)', 'E1 · Očitni enojček (Naked Single)'],
    ['hidden-single', 'Enojčki (Singles)', 'E2 · Skriti enojček (Hidden Single)'],
    ['turbot-fish', 'Kratke verige (Short Chains)', '9 · Kratka X-veriga (Turbot Fish)']]) {
    run(`zacniKrog("${m}", "spoznaj")`);
    run('exNum = 2; renderExercise()'); // vaja 3 – ne po shemi
    assert.ok(vaja().innerHTML.startsWith(`<p class="ex-skupina">${skupina}</p><p class="ex-label">${ime} · Vaja 3 / 9</p>`),
      `Spoznaj ${m}: ${vaja().innerHTML.slice(0, 120)}`);
    run(`zacniKrog("${m}", "uganka")`);
    const [s, l] = vaja().children;
    assert.deepEqual([s.tagName, s.className, s.textContent], ['P', 'ex-skupina', skupina], `Vadi v uganki ${m}`);
    assert.deepEqual([l.className, l.textContent], ['ex-label', `${ime} · Vadi v uganki · Vaja 1 / 9`]);
  }
});

test('korak 6b-b: zadnja tehnika – ob začetku kroga natanko ena kartica in ena vrstica kazala z `zadnja`, nova tehnika ga premakne', () => {
  const dom = domSKarticami();
  const { run } = loadContext(DATOTEKE, dom.globals);
  assert.deepEqual(zadnjeKartice(dom), [], 'ob prvem odprtju brez oznake');
  assert.deepEqual(zadnjeVrstice(dom), []);
  run('zacniKrog("xy-wing", "spoznaj")');
  dom.klikni('backBtn');
  assert.deepEqual(zadnjeKartice(dom), ['xy-wing']);
  assert.deepEqual(zadnjeVrstice(dom), ['xy-wing']);
  const vrstica = m => vrsticeKazala(dom.el('kazaloTehnik')).find(v => v.dataset.kazalo === m);
  assert.equal(vrstica('xy-wing').getAttribute('aria-label'), '11 · XY-krilo (XY-Wing) – nazadnje vadena');
  // Drugi način iste tehnike – ostane; druga tehnika (tudi »Vadi v uganki«) – premakne se.
  run('zacniKrog("xy-wing", "spoznaj")');
  dom.klikni('drugiNacin');
  assert.deepEqual(zadnjeVrstice(dom), ['xy-wing']);
  dom.klikni('backBtnDno');
  run('zacniKrog("hidden-single", "uganka")');
  assert.deepEqual(zadnjeKartice(dom), ['hidden-single']);
  assert.deepEqual(zadnjeVrstice(dom), ['hidden-single']);
  assert.equal(vrstica('xy-wing').getAttribute('aria-label'), '11 · XY-krilo (XY-Wing)', 'pripis odstranjen');
  assert.equal(vrstica('hidden-single').getAttribute('aria-label'), 'E2 · Skriti enojček (Hidden Single) – nazadnje vadena');
  // Klik v kazalu ali premik po meniju oznake ne spremeni (O5 A).
  dom.klikni('backBtn');
  vrstica('x-wing').sprozi('click');
  assert.deepEqual(zadnjeVrstice(dom), ['hidden-single']);
});

test('korak 6b-b: zadnja tehnika po ponovnem odprtju strani (O6 B) – ključ sudoku.trening.zadnja', () => {
  const dom = domSKarticami();
  const { run } = loadContext(DATOTEKE, dom.globals);
  assert.equal(dom.shramba.has(ZADNJA_KLJUC), false, 'ob nalaganju se nič ne zapiše');
  run('zacniKrog("unique-rectangle", "uganka")');
  assert.equal(dom.shramba.get(ZADNJA_KLJUC), 'unique-rectangle', 'zapis ob začetku kroga');
  // Ponovno nalaganje z isto shrambo.
  const dom2 = domSKarticami(dom.shramba);
  const ctx2 = loadContext(DATOTEKE, dom2.globals);
  assert.deepEqual(zadnjeKartice(dom2), ['unique-rectangle']);
  assert.deepEqual(zadnjeVrstice(dom2), ['unique-rectangle']);
  assert.equal(ctx2.run('mode'), null, 'stran se odpre v meniju');
  // Neznan ključ – nič, brez napake; nov krog ga prepiše.
  const dom3 = domSKarticami(new Map([[ZADNJA_KLJUC, 'neznana-tehnika']]));
  const ctx3 = loadContext(DATOTEKE, dom3.globals);
  assert.deepEqual(zadnjeKartice(dom3), []);
  assert.deepEqual(zadnjeVrstice(dom3), []);
  ctx3.run('zacniKrog("x-wing", "spoznaj")');
  assert.equal(dom3.shramba.get(ZADNJA_KLJUC), 'x-wing');
});

test('korak 6b-b: nedosegljiva shramba (getItem in setItem vržeta napako) – stran deluje, oznaka do zaprtja strani', () => {
  const dom = domSKarticami();
  dom.globals.localStorage = { getItem() { throw new Error('ni dostopa'); }, setItem() { throw new Error('ni dostopa'); }, removeItem() {} };
  if (dom.globals.window) dom.globals.window.localStorage = dom.globals.localStorage;
  const { run } = loadContext(DATOTEKE, dom.globals);
  assert.deepEqual(zadnjeVrstice(dom), []);
  run('zacniKrog("swordfish", "spoznaj")');
  assert.equal(run('mode'), 'swordfish', 'krog se začne');
  dom.klikni('backBtn');
  assert.deepEqual(zadnjeKartice(dom), ['swordfish']);
  assert.deepEqual(zadnjeVrstice(dom), ['swordfish']);
});

test('korak 6b-b, naloga 11a-2: slog – en okvir `zadnja` za kartico in vrstico (--izbira), dva stolpca kazala po 230 px; Pomoč treninga', () => {
  const fs = require('node:fs'), path = require('node:path');
  const css = fs.readFileSync(path.join(__dirname, '..', 'trening', 'trening.css'), 'utf8');
  assert.match(css, /\.menu-card\.zadnja,\.kazalo-vrstica\.zadnja\{border-color:var\(--izbira\);box-shadow:0 0 0 1px var\(--izbira\)\}/);
  assert.ok(css.indexOf('.menu-card.zadnja') > css.indexOf('.menu-card:hover'), 'za poudarkom pod miško – okvir ostane moder');
  const base = fs.readFileSync(path.join(__dirname, '..', 'shared', 'base.css'), 'utf8');
  // Naloga 11a, korak 2: ena oblika kazala – stolpca sta elementa (skupina se ne razdeli), dva, kadar je prostora za
  // dva po 230 px (meni pri 1280 px, okno Pomoč na računalniku), sicer en; pravila vrstice samih oznak odpadejo.
  assert.match(base, /\.kazalo-tehnik \{[^}]*display: grid;[^}]*grid-template-columns: repeat\(auto-fit, minmax\(230px, 1fr\)\);/);
  assert.doesNotMatch(base, /\.kazalo-tehnik button\.tag|z-imeni/, 'vrstica samih oznak odpade');
  assert.match(base, /\.kazalo-tehnik \.kazalo-naslov \{/, 'naslov skupine (izbirnik prevlada nad .dialog-navodila p)');
  // Vrh vaje: vrstica skupine manjša od imena tehnike (15 px) in siva; naslov skupine nad karticami.
  const ex = /\.ex-skupina\{([^}]*)\}/.exec(css);
  assert.ok(ex, '.ex-skupina v trening.css');
  assert.match(ex[1], /color:var\(--pencil\)/);
  assert.ok(parseFloat(/font-size:([\d.]+)px/.exec(ex[1])[1]) < 15, 'manjša od .ex-label');
  assert.match(css, /\.skupina-naslov\{/);
  const html = fs.readFileSync(path.join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  assert.ok(html.includes('<p>Kartica tehnike, ki si jo nazadnje vadil, in njena vrstica v kazalu tehnik imata moder okvir – tudi ko stran znova odpreš.</p>'));
});
