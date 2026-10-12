'use strict';
// UI zbirke v reševalcu (app/zbirka.js) v nadomestnem DOM-u (dom-stub.js): gumba
// "Odpri" (prej "Naloži") in "Izbriši" pri uganki v seznamu. Oba sta nekoč v
// besedilu uporabljala spremenljivko, ki ne obstaja, zato je klik vrgel
// ReferenceError in ni naredil nič. Kartica uganke je skupna z igro
// (shared/zbirka-ui.js): stanje je iz istega vira kot v igri (zbirkaStanjeUganke) -
// iz shranjene igre, kadar obstaja, sicer iz zapisa v zbirki. Vgrajeni primer,
// rešen v reševalcu, se v zbirko ne shrani. "Izbriši" in "Izbriši vse" pobrišeta
// tudi shranjene igre (igre primerov ostanejo).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'app/app.js', 'app/zbirka.js'];
const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
// Danosti vgrajenega primera (PRIMERI v shared/zbirka.js) s '0'.
const PRIMER = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js']).run("PRIMERI[1].danosti.split('.').join('0')");

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

// Del kartice (edine) uganke v seznamu po razredu (glej shared/zbirka-ui.js).
const delKartice = (dom, razred) => dom.el('libList').children[0].children.find(el => el.className === razred);

// Ali je okno zbirke odprto (edino mesto, ki ve, kako se okno odpira).
const oknoOdprto = dom => dom.el('library').classList.contains('odprt');

// Gumb z danim napisom pri (edini) uganki v seznamu.
function gumb(dom, napis) {
  const vrstica = delKartice(dom, 'zb-gumbi');
  const b = vrstica.children.find(el => el.textContent === napis);
  assert.ok(b, `gumb »${napis}« obstaja`);
  return b;
}

test('reševalec: »Odpri« vpiše danosti v mrežo in zapre okno', () => {
  const { dom, run } = zacni();
  gumb(dom, 'Odpri').sprozi('click');
  assert.equal(run('currentGivens()'), danosti);
  assert.equal(dom.el('status').textContent, 'Naložena uganka iz zbirke (Težka, dodana 21. 9. 2026 ob 16:33).');
  assert.equal(oknoOdprto(dom), false);
});

test('reševalec: »Izbriši« vpraša z datumom in po potrditvi uganko izbriše', () => {
  const { dom, run, vprasanja } = zacni(true);
  gumb(dom, 'Izbriši').sprozi('click');
  assert.deepEqual(vprasanja, ['Izbrišem uganko, dodano 21. 9. 2026 ob 16:33 (Težka)? Izbriše se tudi njen shranjeni napredek.']);
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

/* ---------- okno zbirke: odpiranje, zapiranje, Escape, osvežitev ---------- */

// Reševalec z eno uganko v zbirki, okno še zaprto.
function zaprto() {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '' },
  ]));
  const { run } = loadContext(DATOTEKE, dom.globals);
  return { dom, run };
}

test('reševalec: okno zbirke se odpre z gumbom in zapre s ✕, klikom ob panelu in tipko Escape', () => {
  const { dom } = zaprto();
  assert.equal(oknoOdprto(dom), false, 'ob zagonu je okno zaprto');

  dom.klikni('libraryBtn');
  assert.equal(oknoOdprto(dom), true, 'gumb »Zbirka« okno odpre');
  assert.equal(dom.el('libList').children.length, 1, 'seznam je izrisan');
  // Klik v panelu (cilj ni ozadje okna) okna ne zapre.
  dom.el('library').sprozi('click', { target: dom.el('libList') });
  assert.equal(oknoOdprto(dom), true, 'klik v panelu okna ne zapre');
  dom.klikni('libClose');
  assert.equal(oknoOdprto(dom), false, '✕ okno zapre');

  dom.klikni('libraryBtn');
  dom.el('library').sprozi('click', { target: dom.el('library') });
  assert.equal(oknoOdprto(dom), false, 'klik ob panelu (na ozadju) okno zapre');

  dom.klikni('libraryBtn');
  dom.tipka({ key: 'Enter' });
  assert.equal(oknoOdprto(dom), true, 'druga tipka okna ne zapre');
  dom.tipka({ key: 'Escape' });
  assert.equal(oknoOdprto(dom), false, 'Escape okno zapre');
  dom.tipka({ key: 'Escape' });
  assert.equal(oknoOdprto(dom), false, 'Escape pri zaprtem oknu ga ne odpre');

  // Ponovno odprtje pobriše prejšnje sporočilo.
  dom.klikni('libraryBtn');
  dom.klikni('libDeleteAll');
  assert.ok(dom.el('libStatus').textContent, 'sporočilo po brisanju');
  dom.klikni('libClose');
  dom.klikni('libraryBtn');
  assert.equal(dom.el('libStatus').textContent, '', 'ob odprtju je vrstica statusa prazna');
});

// Povečan prikaz (lightbox) v reševalcu: Escape ga zapre (naloga 6, korak 3, O6 A). Povečava je
// nad okni (z-index), zato pri odprtem oknu pod njo prvi Escape zapre povečavo, drugi okno.
const povecavaOdprta = dom => dom.el('lightbox').style.display === 'block';
const pomocOdprta = dom => dom.el('pomocDialog').classList.contains('odprt');

// "Reši" teče v setTimeout - počakaj, da status ni več "Rešujem …".
async function resi(dom, run, d) {
  run(`inputs.forEach((inp, i) => { inp.value = ${JSON.stringify(d)}[i] === '0' ? '' : ${JSON.stringify(d)}[i]; })`);
  dom.klikni('solveBtn');
  for (let t = 0; t < 400 && dom.el('status').textContent === 'Rešujem …'; t++) await new Promise(r => setTimeout(r, 25));
}

test('reševalec: Escape zapre povečan prikaz rešitve in koraka', async () => {
  const { dom, run } = zaprto();
  await resi(dom, run, danosti);
  dom.klikni('solvedGrid');
  assert.equal(povecavaOdprta(dom), true, 'dotik rešene mreže jo poveča');
  dom.tipka({ key: 'Enter' });
  assert.equal(povecavaOdprta(dom), true, 'druga tipka povečave ne zapre');
  dom.tipka({ key: 'Escape' });
  assert.equal(povecavaOdprta(dom), false, 'Escape zapre povečavo rešitve');
  dom.tipka({ key: 'Escape' });
  assert.equal(povecavaOdprta(dom), false, 'Escape pri zaprti povečavi je ne odpre');
  assert.equal(oknoOdprto(dom), false);
  assert.equal(pomocOdprta(dom), false);

  // Povečava koraka (isti openLightbox kot klik male mreže koraka - ta v nadomestnem DOM-u ne
  // nastane, ker potrebuje querySelector; pravi klik preveri tools/preveri-naloga6-brskalnik.js).
  run("openLightbox(el => renderGridInto(el, lastSolve.log.find(s => s.snapshotGrid), 'min(52px, var(--mcs-povecave))'))");
  assert.equal(povecavaOdprta(dom), true);
  dom.tipka({ key: 'Escape' });
  assert.equal(povecavaOdprta(dom), false, 'Escape zapre povečavo koraka');
});

test('reševalec: Escape ob povečavi in oknu pod njo zapre najprej povečavo, nato okno', () => {
  const { dom, run } = zaprto();
  run("openLightbox(() => {})");
  dom.klikni('libraryBtn');
  assert.equal(oknoOdprto(dom), true);
  dom.tipka({ key: 'Escape' });
  assert.equal(povecavaOdprta(dom), false, 'prvi Escape zapre povečavo (zgornja plast)');
  assert.equal(oknoOdprto(dom), true, 'zbirka ostane odprta');
  dom.tipka({ key: 'Escape' });
  assert.equal(oknoOdprto(dom), false, 'drugi Escape zapre zbirko');
  assert.equal(pomocOdprta(dom), false, 'Pomoč se ne odpre');

  run("openLightbox(() => {})");
  dom.klikni('pomocBtn');
  assert.equal(pomocOdprta(dom), true);
  dom.tipka({ key: 'Escape' });
  assert.equal(povecavaOdprta(dom), false, 'prvi Escape zapre povečavo');
  assert.equal(pomocOdprta(dom), true, 'Pomoč ostane odprta');
  dom.tipka({ key: 'Escape' });
  assert.equal(pomocOdprta(dom), false, 'drugi Escape zapre Pomoč');
  assert.equal(oknoOdprto(dom), false, 'zbirka ostane zaprta');
});

test('reševalec: Escape brez povečave zapre okno zbirke in Pomoč kot prej', () => {
  const { dom } = zaprto();
  dom.klikni('libraryBtn');
  dom.tipka({ key: 'Escape' });
  assert.equal(oknoOdprto(dom), false, 'zbirka je zaprta');
  assert.equal(pomocOdprta(dom), false, 'Pomoč se ne odpre');
  assert.equal(povecavaOdprta(dom), false, 'povečava se ne odpre');

  // Pomoč se odpira in zapira kot prej (shared/pomoc.js); zbirke ne odpre.
  dom.klikni('pomocBtn');
  assert.equal(pomocOdprta(dom), true, 'Pomoč je odprta');
  dom.tipka({ key: 'Escape' });
  assert.equal(pomocOdprta(dom), false, 'Escape zapre Pomoč');
  assert.equal(oknoOdprto(dom), false, 'zbirka ostane zaprta');
});

test('reševalec: Pomoč pove, kako se povečava zapre (O7)', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /Povečano mrežo zapreš z dotikom, z ✕ ali s tipko <kbd>Esc<\/kbd>\./);
});

test('reševalec: sprememba v drugem zavihku osveži odprt seznam, zaprtega ne izriše', () => {
  const { dom } = zaprto();
  const zapis = (d, dodano) => ({ danosti: d, tezavnost: 'Lahka', izvor: 'rocno', dodano, opomba: '' });
  const druga = loadPuzzles()[3].danosti.replace(/\./g, '0');
  const tretja = loadPuzzles()[4].danosti.replace(/\./g, '0');

  dom.klikni('libraryBtn');
  dom.drugZavihek('sudoku.zbirka.v1', JSON.stringify([
    zapis(danosti, '2026-09-21 16:33'), zapis(druga, '2026-09-22 10:00'),
  ]));
  assert.equal(oknoOdprto(dom), true, 'okno ostane odprto');
  assert.equal(dom.el('libList').children.length, 2, 'odprt seznam je osvežen');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (2)');

  dom.klikni('libClose');
  dom.drugZavihek('sudoku.zbirka.v1', JSON.stringify([
    zapis(danosti, '2026-09-21 16:33'), zapis(druga, '2026-09-22 10:00'), zapis(tretja, '2026-09-23 10:00'),
  ]));
  assert.equal(oknoOdprto(dom), false, 'zaprto okno se ne odpre');
  assert.equal(dom.el('libList').children.length, 2, 'zaprtega seznama ne izriše');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (3)', 'števec je osvežen');
  dom.klikni('libraryBtn');
  assert.equal(dom.el('libList').children.length, 3, 'ob odprtju je seznam nov');
});

/* ---------- stanje uganke: isti vir kot v igri ---------- */

const praznih = [...danosti].filter(ch => ch === '0').length;
const resitev = (() => { const { run } = loadContext(['shared/engine.js'], {}); return run(`solutionOf(${JSON.stringify(danosti)})`); })();
const prazne = [...danosti].map((ch, c) => (ch === '0' ? c : -1)).filter(c => c >= 0);
const vpisi = n => prazne.slice(0, n).map(c => ({ tip: 'vpis', celica: c, stevka: resitev[c] }));

// Reševalec z uganko, ki je v zbirki zapisana kot rešena, in (neobvezno) shranjeno igro.
function zStanjem(zapis, poteze) {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '', ...zapis },
  ]));
  if (poteze) {
    dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: danosti,
      igre: { [danosti]: { poteze, kazalec: poteze.length, zacetek: '2026-09-22 10:00', nazadnje: '2026-09-22 10:00' } } }));
  }
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  const v = delKartice(dom, 'zb-casi');
  return v ? v.textContent : null; // nova uganka nima vrstice stanja
}

test('reševalec: stanje "v teku (12/57)" iz zapisa, kadar shranjene igre ni', () => {
  assert.equal(zStanjem({ igrano: '2026-09-22 10:05', izpolnjeno: 81 - praznih + 12, napaka: false }),
    `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (12/${praznih})`);
  assert.equal(zStanjem({}), null, 'nova uganka nima vrstice stanja (»nova« se ne izpiše)');
});

test('reševalec: shranjena igra ima prednost - "rešena … · znova v teku"', () => {
  const resena = { igrano: '2026-09-21 17:48', izpolnjeno: 81, napaka: false };
  assert.equal(zStanjem(resena), 'rešena 21. 9. 2026 ob 17:48');
  // Po "Začni znova" v igri: zapis je zamrznjen, igra pa je spet v teku.
  assert.equal(zStanjem(resena, vpisi(3)), `rešena 21. 9. 2026 ob 17:48 · znova v teku (3/${praznih})`);
  // Nerešena uganka: napredek iz igre, čas iz zapisa.
  assert.equal(zStanjem({ igrano: '2026-09-22 10:05', izpolnjeno: 81 - praznih + 12 }, vpisi(5)),
    `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (5/${praznih})`);
});

/* ---------- kartica uganke (skupna z igro) ---------- */

test('reševalec: vrstice kartice - naslov, stanje, danih · tehnike · koraki · program', () => {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: 'moja opomba',
      reseno: 81 - praznih + 36, koraki: 42, ugibanje: 0, tehnike: [], nazadnje: '2026-09-21 16:33' },
  ]));
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  assert.equal(delKartice(dom, 'zb-vrstica').textContent, 'ročni vnos · dodana 21. 9. 2026 ob 16:33');
  const znacka = delKartice(dom, 'zb-info').children[0];
  assert.equal(znacka.className, 'tag t-advanced znacka-tezavnosti', 'težavnost je značka v barvi stopnje');
  assert.equal(znacka.textContent, 'Težka');
  assert.equal(delKartice(dom, 'zb-casi'), undefined, 'nova uganka: brez vrstice stanja');
  assert.equal(delKartice(dom, 'zb-info').textContent,
    `Težka danih ${81 - praznih} · Tehnike: ni podatkov · 42 korakov · program rešil delno (36/${praznih})`);
  assert.equal(delKartice(dom, 'zb-opomba').textContent, 'moja opomba');
  // Namig miške: časi v isti obliki kot v seznamu, program z istim števcem.
  const namig = delKartice(dom, 'zb-vrstica').title;
  assert.ok(namig.includes('Dodano: 21. 9. 2026 ob 16:33'), namig);
  assert.ok(namig.includes(`Program rešil: delno (36/${praznih})`), namig);
});

test('reševalec: uganka v vnosni mreži je označena kot trenutno odprta', () => {
  const { dom, run } = zacni();
  const li = () => dom.el('libList').children[0];
  assert.equal(li().className, '', 'mreža je prazna - nobena ni odprta');
  gumb(dom, 'Odpri').sprozi('click');
  run('zbirkaOdpri()');
  assert.equal(li().className, 'trenutna');
  const znacka = li().children[0].children.find(el => el.className === 'zb-trenutna');
  assert.equal(znacka && znacka.textContent, 'trenutno odprta');
});

test('reševalec: rešen vgrajeni primer se v zbirko ne shrani', () => {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  const primer = run('PRIMERI[4]');
  const g = JSON.stringify(primer.danosti.replace(/\./g, '0'));
  run(`(() => { const { board, log } = solve(${g}); zbirkaPoResevanju(${g}, board, log, 1); })()`);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.equal(dom.el('saveMsg').textContent, 'Vgrajeni primer – v zbirko se ne shrani.');
  assert.equal(dom.el('saveFields').style.display, 'none', 'težavnosti in opombe ni mogoče nastaviti');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
  // Navadna uganka se shrani kot ročni vnos.
  const d = JSON.stringify(danosti);
  run(`(() => { const { board, log } = solve(${d}); zbirkaPoResevanju(${d}, board, log, 1); })()`);
  assert.equal(run(`zbirkaBeri().find(z => z.danosti === ${d}).izvor`), 'rocno');
  // Težavnost se izračuna ob nastanku zapisa (shared/generator.js je naložen).
  const tezavnost = run(`oceniTezavnost(${d}).tezavnost`);
  assert.ok(tezavnost, 'težavnost je določena');
  assert.equal(run(`zbirkaBeri().find(z => z.danosti === ${d}).tezavnost`), tezavnost);
  assert.equal(dom.el('saveDifficulty').value, tezavnost, 'spustni seznam kaže izračunano');
  assert.equal(dom.el('saveMsg').textContent, '✓ Shranjeno v zbirko');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (1)');
});

test('reševalec: »Izbriši« pobriše tudi shranjeno igro uganke', () => {
  const dom = makeDom();
  dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([{ danosti, tezavnost: 'Težka', dodano: '2026-09-21 16:33' }]));
  dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: danosti, igre: { [danosti]: { poteze: [], kazalec: 0 } } }));
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');
  gumb(dom, 'Izbriši').sprozi('click');
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], []);
});

test('reševalec: »Izbriši vse« s potrditvijo (število, priporočilo izvoza), ostanejo samo igre primerov', () => {
  const primer = PRIMER;
  // Sirota: igra uganke, ki je v zbirki ni več (izbrisana pred novim modelom).
  const sirota = loadPuzzles()[4].danosti.replace(/\./g, '0');
  const pripravi = (odgovor) => {
    const dom = makeDom();
    dom.shramba.set('sudoku.zbirka.v1', JSON.stringify([
      { danosti, tezavnost: 'Težka', dodano: '2026-09-21 16:33' },
      { danosti: loadPuzzles()[3].danosti.replace(/\./g, '0'), tezavnost: 'Lahka', dodano: '2026-09-22 10:00' },
    ]));
    dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: primer,
      igre: { [danosti]: { poteze: [], kazalec: 0 }, [sirota]: { poteze: [], kazalec: 0 }, [primer]: { poteze: [], kazalec: 0 } } }));
    const vprasanja = [];
    dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
    const { run } = loadContext(DATOTEKE, dom.globals);
    run('zbirkaOdpri()');
    dom.klikni('libDeleteAll');
    return { dom, run, vprasanja };
  };

  const preklic = pripravi(false);
  assert.equal(preklic.vprasanja.length, 1);
  assert.match(preklic.vprasanja[0], /\(2\)/, 'navede število ugank');
  assert.match(preklic.vprasanja[0], /izvoziš/, 'priporoči izvoz');
  assert.equal(preklic.run('zbirkaBeri().length'), 2, 'brez potrditve se nič ne izbriše');
  assert.equal(preklic.run('Object.keys(igreBeri().igre).length'), 3);

  const { dom, run } = pripravi(true);
  assert.equal(run('zbirkaBeri().length'), 0);
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], [primer], 'ostane samo igra primera - tudi sirota je izbrisana');
  assert.equal(dom.el('libStatus').textContent, 'Izbrisanih ugank: 2. Izbrisan je tudi napredek izbrisanih ugank: 1.');
  assert.equal(dom.el('libraryBtn').textContent, 'Zbirka (0)');
  assert.equal(dom.el('libList').children[0].className, 'prazno');
});

test('reševalec: »Izbriši vse« pri prazni zbirki počisti sirote, šele nato je »Zbirka je že prazna.«', () => {
  const primer = PRIMER;
  const sirote = [0, 3, 4].map(i => loadPuzzles()[i].danosti.replace(/\./g, '0'));
  const dom = makeDom();
  // Zbirka izbrisana s staro različico, igre so ostale.
  dom.shramba.set('sudoku.zbirka.v1', '[]');
  const igre = { [primer]: { poteze: [], kazalec: 0 } };
  for (const d of sirote) igre[d] = { poteze: [], kazalec: 0 };
  dom.shramba.set('sudoku.igra.v1', JSON.stringify({ zadnja: sirote[0], igre }));
  const vprasanja = [];
  let odgovor = false;
  dom.globals.confirm = (besedilo) => { vprasanja.push(besedilo); return odgovor; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('zbirkaOdpri()');

  dom.klikni('libDeleteAll');
  assert.equal(vprasanja.length, 1, 'vpraša, čeprav je zbirka prazna');
  assert.match(vprasanja[0], /napredek izbrisanih ugank \(3\)/);
  assert.equal(run('Object.keys(igreBeri().igre).length'), 4, 'brez potrditve se nič ne izbriše');

  odgovor = true;
  dom.klikni('libDeleteAll');
  assert.deepEqual([...run('Object.keys(igreBeri().igre)')], [primer], 'ostane samo igra primera');
  assert.equal(dom.el('libStatus').textContent, 'Izbrisan napredek izbrisanih ugank: 3.');

  // Zdaj ni ne ugank ne sirot.
  dom.klikni('libDeleteAll');
  assert.equal(vprasanja.length, 2, 'ne vpraša več');
  assert.equal(dom.el('libStatus').textContent, 'Zbirka je že prazna.');
});

/* ---------- filtri in razvrščanje nad seznamom (naloga 10, korak 3) ---------- */
// Izris in vezavo filtrov (zbirkaUstvariFiltre() v shared/zbirka-ui.js) podrobno preverja
// tests/zbirka-filtri-ui.test.js v igri; tu je vezava v app/zbirka.js. Merilo za seznam je logika
// (zbirkaFiltriraj() v shared/zbirka.js), kartice se ločijo po naslovu (različni datumi dodajanja).
const fs = require('node:fs');
const path = require('node:path');
const S = v => JSON.stringify(v);

// Pet ugank iz docs/uganke.md (brez vgrajenih primerov) z različnimi težavnostmi – ena brez težavnosti.
const FILTRI_UGANKE = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'))
  .filter(d => !loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js']).run(`!!zbirkaPrimerZa(${S(d)})`))
  .slice(0, 5);
const FILTRI_TEZAVNOSTI = ['Težka', 'Lahka', 'Težka', 'Srednja', ''];

// Reševalec z odprtim oknom zbirke nad dano hrambo (nova stran) ali nad zbirko FILTRI_UGANKE.
function sFiltri(shramba) {
  const dom = makeDom(shramba);
  if (!shramba) {
    dom.shramba.set('sudoku.zbirka.v1', S(FILTRI_UGANKE.map((d, i) => (
      { danosti: d, tezavnost: FILTRI_TEZAVNOSTI[i], izvor: 'rocno', dodano: `2026-09-1${i} 10:00`, opomba: '' }))));
  }
  dom.globals.confirm = () => true;
  const { run } = loadContext(DATOTEKE, dom.globals);
  dom.klikni('libraryBtn');
  return { dom, run, J: izraz => JSON.parse(S(run(izraz))) };
}
// Vsebnik #libFiltri = [mreža okenc, vrstica »Prikazanih«]; okence je <label> = [ime, <select>].
const fVsebnik = dom => dom.el('libFiltri');
const fOkence = (dom, polje) => fVsebnik(dom).children[0].children.map(l => l.children[1]).find(s => s.dataset.filter === polje);
const fIzbrana = (dom, polje) => { const s = fOkence(dom, polje); return s.children.find(o => o.value === s.value).textContent; };
function fIzberi(dom, polje, zacetek) {
  const s = fOkence(dom, polje);
  const o = s.children.find(x => (zacetek === '' ? x.textContent === '' : x.textContent.startsWith(zacetek)));
  assert.ok(o, `možnost »${zacetek}« v okencu ${polje}`);
  s.value = o.value;
  s.sprozi('change');
}
const fPrikazanih = dom => fVsebnik(dom).children[1].children[0].textContent;
const fPocisti = dom => fVsebnik(dom).children[1].children[1];
const fNaslovi = dom => dom.el('libList').children.map(li => li.children[0].textContent);
// Naslovi kartic, ki jih da logika za trenutno zbirko in izbiro.
const fPricakovano = (J, izbira) => J(`(() => { const igre = igreBeri().igre;
  return zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igre), ${S(izbira)}).map(l => zbirkaKartica(l.z.danosti, l.z, l.povzetek).naslov); })()`);
const F_BREZ = { tezavnost: null, stanje: null, tehnika: null, razvrsti: 'nazadnje' };

test('reševalec: filtri nad seznamom – okenca, sprememba osveži seznam, Razvrsti, »Počisti filtre«, shramba', () => {
  const { dom, J } = sFiltri();
  assert.equal(fVsebnik(dom).hidden, false);
  assert.deepEqual(fVsebnik(dom).children[0].children.map(l => [l.tagName, l.children[0].textContent]),
    [['LABEL', 'Težavnost'], ['LABEL', 'Stanje'], ['LABEL', 'Tehnika'], ['LABEL', 'Razvrsti']]);
  assert.deepEqual(fOkence(dom, 'tezavnost').children.map(o => o.textContent), ['', 'Lahka (1)', 'Srednja (1)', 'Težka (2)', 'Ni določena (1)']);
  assert.equal(fPrikazanih(dom), 'Prikazanih 5 od 5');
  assert.equal(fPocisti(dom).hidden, true);
  assert.deepEqual(fNaslovi(dom), fPricakovano(J, F_BREZ));

  fIzberi(dom, 'tezavnost', 'Težka');
  assert.deepEqual(fNaslovi(dom), fPricakovano(J, { ...F_BREZ, tezavnost: 'Težka' }));
  assert.equal(fNaslovi(dom).length, 2);
  assert.equal(fPrikazanih(dom), 'Prikazani 2 od 5');
  assert.equal(fOkence(dom, 'tezavnost').classList.contains('vklopljen'), true);
  assert.equal(fPocisti(dom).hidden, false);
  assert.deepEqual(JSON.parse(dom.shramba.get('sudoku.zbirka.filtri')), { ...F_BREZ, tezavnost: 'Težka' });

  fIzberi(dom, 'razvrsti', 'Število danih');
  assert.deepEqual(fNaslovi(dom), fPricakovano(J, { ...F_BREZ, tezavnost: 'Težka', razvrsti: 'danih' }));

  fPocisti(dom).sprozi('click');
  assert.equal(fIzbrana(dom, 'tezavnost'), '');
  assert.equal(fIzbrana(dom, 'razvrsti'), 'Število danih', 'Razvrsti ni filter, ostane');
  assert.deepEqual(fNaslovi(dom), fPricakovano(J, { ...F_BREZ, razvrsti: 'danih' }));
  assert.equal(fPrikazanih(dom), 'Prikazanih 5 od 5');
});

test('reševalec: filtri – »Izbriši« zadnje z izbrano vrednostjo (O7, prazen izid), ponovno odprtje, nova stran, prazna zbirka', () => {
  const { dom, run } = sFiltri();
  fIzberi(dom, 'tezavnost', 'Srednja');
  assert.equal(fNaslovi(dom).length, 1);
  dom.el('libList').children[0].children.find(el => el.className === 'zb-gumbi')
    .children.find(g => g.textContent === 'Izbriši').sprozi('click');
  assert.equal(run('zbirkaBeri().length'), 4);
  assert.equal(dom.el('libStatus').textContent, 'Uganka je izbrisana.');
  assert.equal(fIzbrana(dom, 'tezavnost'), 'Srednja (0)', 'vrednost ostane do zaprtja okna');
  assert.equal(dom.el('libList').children.length, 1);
  assert.equal(dom.el('libList').children[0].className, 'prazno');
  assert.equal(dom.el('libList').children[0].textContent, 'Nobena uganka ne ustreza izbranim filtrom.');
  assert.equal(fPrikazanih(dom), 'Prikazanih 0 od 4');

  // Ponovno odprtje: vrednost, ki je ni več, se izprazni (tudi v shrambi).
  dom.klikni('libClose');
  dom.klikni('libraryBtn');
  assert.equal(fIzbrana(dom, 'tezavnost'), '');
  assert.equal(JSON.parse(dom.shramba.get('sudoku.zbirka.filtri')).tezavnost, null);
  assert.equal(fNaslovi(dom).length, 4);

  // Nova stran z isto hrambo: izbira ostane.
  fIzberi(dom, 'tezavnost', 'Lahka');
  const nova = sFiltri(dom.shramba);
  assert.equal(fIzbrana(nova.dom, 'tezavnost'), 'Lahka (1)');
  assert.equal(fNaslovi(nova.dom).length, 1);

  // »Izbriši vse«: prazna zbirka – okenc ni, ostane »Zbirka je prazna …«.
  nova.dom.klikni('libDeleteAll');
  assert.equal(fVsebnik(nova.dom).hidden, true);
  assert.match(nova.dom.el('libList').children[0].textContent, /^Zbirka je prazna/);
});

test('reševalec: okno zbirke – vsebnik filtrov med sporočili in seznamom, krajši namig (D1), Pomoč', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'index.html'), 'utf8');
  const okno = html.slice(html.indexOf('<div id="library"'), html.indexOf('<div id="pomocDialog"'));
  const red = ['id="libStatus"', 'id="libFiltri"', 'id="libList"'].map(s => okno.indexOf(s));
  assert.ok(red.every((x, i) => x > 0 && (i === 0 || x > red[i - 1])), S(red));
  const namig = okno.match(/<p class="cand-hint">([\s\S]*?)<\/p>/)[1];
  assert.equal(namig, 'Zbirka je ista kot v igri. Z <b>Izvozi</b> in <b>Uvozi</b> jo preneseš na drugo napravo; pred <b>Izbriši vse</b> jo izvozi. Vgrajeni primeri niso del zbirke. Več v Pomoči.');
  const pomoc = html.slice(html.indexOf('<div id="pomocDialog"'));
  const razdelek = pomoc.slice(pomoc.indexOf('>Zbirka ugank</h3>'), pomoc.indexOf('>Težavnost</h3>'));
  const odstavki = [...razdelek.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1]);
  assert.equal(odstavki.length, 3, 'razdelek »Zbirka ugank«: obstoječi odstavek, podrobnosti, filtri');
  // Podrobnosti, ki so odpadle iz namiga (datoteka Markdown, uvoz iste uganke, brisanje z napredkom).
  assert.ok(/Markdown/.test(odstavki[1]) && /dopolni le manjkajoče podatke/.test(odstavki[1]) && /napredk/.test(odstavki[1]), odstavki[1]);
  for (const b of ['Zbirka ugank', 'Težavnost', 'Stanje', 'Tehnika', 'Razvrsti', 'Počisti filtre']) {
    assert.ok(odstavki[2].includes(`<b>${b}</b>`), b);
  }
});
