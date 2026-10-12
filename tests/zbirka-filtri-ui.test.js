'use strict';
// Filtri in razvrščanje v oknu »Zbirka ugank« igre (naloga 10, docs/naloga10-nacrt.md, korak 2) v nadomestnem
// DOM-u (dom-stub.js) - izris zbirkaUstvariFiltre() (shared/zbirka-ui.js) in vezava v igra/igra.js:
//   - štiri okenca v oznakah (Težavnost, Stanje, Tehnika, Razvrsti), možnosti s števili iz
//     zbirkaMoznostiFiltrov(), prva možnost filtra prazna; vklopljen filter ima razred `vklopljen`;
//   - sprememba okenca takoj osveži seznam (vrstni red iz zbirkaFiltriraj()), vrstico »Prikazanih N od M« in
//     shrambo; »Počisti filtre« samo pri vklopljenem filtru, izklopi vse tri, »Razvrsti« ostane;
//   - prazen izid (sporočilo namesto kartic), prazna zbirka (brez okenc);
//   - pomnjenje (nova stran z isto hrambo), izpraznitev odsotne vrednosti ob odprtju, O7 po »Izbriši«,
//     »Uvozi« z vklopljenim filtrom, »Oceni zbirko« s pripisom skritih predlogov (O8) in »Zapiši ocene«,
//     trenutno odprta uganka, ki jo filter skrije (O9);
//   - povzetek shranjene igre enkrat na kartico (O11), krajši namig nad gumbi (D1), Pomoč.
// Logiko filtrov preverja tests/zbirka-filtri.test.js; tu je ta logika merilo, s katerim se primerja izris.
// Pravi brskalnik: tools/preveri-naloga10-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v igra/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'igra/shramba.js', 'igra/igra.js'];
const S = v => JSON.stringify(v);

// ---------- testna zbirka (kot v tests/zbirka-filtri.test.js) ----------

// Uganke iz docs/uganke.md (brez vgrajenih primerov) in kopiji prvih dveh z zamenjanimi števkami (zamenjava
// ohrani enolično rešitev - preverjeno s countSolutions()). Zapisi iz zbirkaShraniResitev(), dodane po vrsti.
// Stanja: [1] v teku iz zapisa, [2] rešena iz zapisa, [3] začeta igra s samimi vpisi; druge nove. Zadnja
// (kopija) ima prazno težavnost (stari zapis z neznanim imenom).
const PREDLOGA = new Map();
const { run: runP } = loadContext(['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/zbirka.js'], {
  localStorage: {
    getItem: k => (PREDLOGA.has(k) ? PREDLOGA.get(k) : null),
    setItem: (k, v) => PREDLOGA.set(k, String(v)),
    removeItem: k => PREDLOGA.delete(k),
  },
});
const ZAMENJAVA = '987654321';
const uganke = loadPuzzles().map(p => p.danosti.replace(/\./g, '0')).filter(d => !runP(`zbirkaPrimerZa(${S(d)})`));
const kopije = uganke.slice(0, 2).map(d => d.replace(/[1-9]/g, c => ZAMENJAVA[Number(c) - 1]));
for (const d of kopije) assert.equal(runP(`countSolutions(${S(d)})`), 1, 'kopija ima natanko eno rešitev');
const VSE = [...uganke, ...kopije];
VSE.forEach((d, i) => {
  runP(`zbirkaZdaj = () => ${S(`2026-09-${String(10 + i).padStart(2, '0')} 08:00`)}`);
  assert.ok(runP(`(() => { const r = solve(${S(d)}); return !!zbirkaShraniResitev(${S(d)}, r.board, r.log, { izvor: 'rocno' }); })()`));
});
const danih = d => [...d].filter(c => c !== '0').length;
runP(`zbirkaShraniIgranje(${S(VSE[1])}, '2026-10-01 10:00', ${danih(VSE[1]) + 5}, false)`);
runP(`zbirkaShraniIgranje(${S(VSE[2])}, '2026-10-02 10:00', 81, false)`);
{
  const res = JSON.parse(S(runP(`solutionOf(${S(VSE[3])})`)));
  const poteze = [...VSE[3]].map((c, i) => i).filter(i => VSE[3][i] === '0').slice(0, 3)
    .map(celica => ({ tip: 'vpis', celica, stevka: res[celica] }));
  PREDLOGA.set(runP('IGRA_KLJUC'), S({ zadnja: null, igre: { [VSE[3]]: { poteze, kazalec: 3, nazadnje: '2026-10-03 10:00' } } }));
  const z = JSON.parse(PREDLOGA.get(runP('ZBIRKA_KLJUC')));
  z.find(x => x.danosti === VSE[VSE.length - 1]).tezavnost = 'Drugo';
  PREDLOGA.set(runP('ZBIRKA_KLJUC'), S(z));
}

// Igra nad kopijo predloge (ali dano hrambo - nova stran z isto hrambo) z odprtim oknom zbirke.
function zacni(shramba = new Map(PREDLOGA), { odpri = true } = {}) {
  const dom = makeDom(shramba);
  const { run } = loadContext(DATOTEKE, dom.globals);
  if (odpri) dom.klikni('zbirkaBtn');
  return { dom, run, J: izraz => JSON.parse(S(run(izraz))) };
}

// Deli okna: vsebnik #zbirkaFiltri = [mreža okenc, vrstica »Prikazanih«]; okence je <label> = [ime, <select>].
const vsebnik = dom => dom.el('zbirkaFiltri');
const oznake = dom => vsebnik(dom).children[0].children;
const okence = (dom, polje) => oznake(dom).map(l => l.children[1]).find(s => s.dataset.filter === polje);
const napisi = (dom, polje) => okence(dom, polje).children.map(o => o.textContent);
const izbrana = (dom, polje) => {
  const s = okence(dom, polje);
  return s.children.find(o => o.value === s.value).textContent;
};
// Izbira možnosti, kot bi jo izbral igralec: po začetku napisa (»Težka«, »7 X-krilo«), prazna z ''.
function izberi(dom, polje, zacetek) {
  const s = okence(dom, polje);
  const o = s.children.find(x => (zacetek === '' ? x.textContent === '' : x.textContent.startsWith(zacetek)));
  assert.ok(o, `možnost »${zacetek}« v okencu ${polje}: ${S(s.children.map(x => x.textContent))}`);
  s.value = o.value;
  s.sprozi('change');
}
const vrstica = dom => vsebnik(dom).children[1];
const prikazanih = dom => vrstica(dom).children[0].textContent;
const pocisti = dom => vrstica(dom).children[1];
const kartice = dom => dom.el('zbirkaSeznam').children;
// Danosti kartic v seznamu v vrstnem redu izrisa.
const vSeznamu = run => JSON.parse(S(run('[...zbirkaVrstice.keys()]')));
// Merilo: logika koraka 1 (tests/zbirka-filtri.test.js) nad trenutno zbirko in izbiro.
const pricakovano = (J, izbira) => J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(izbira)}).map(l => l.z.danosti)`);
const moznostiLogike = (J, izbira) => J(`zbirkaMoznostiFiltrov(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(izbira)})`);
const shranjeno = dom => JSON.parse(dom.shramba.get('sudoku.zbirka.filtri') || 'null');
const BREZ = { tezavnost: null, stanje: null, tehnika: null, razvrsti: 'nazadnje' };

// Težavnost in tehnika, ki ju ima več ugank, a ne vse (da filter res kaj skrije).
function vrednostZaFilter(J, polje) {
  const m = moznostiLogike(J, BREZ)[polje];
  return m.filter(x => x.n > 1 && x.n < VSE.length).sort((a, b) => b.n - a.n)[0];
}

test('okenca: imena, možnosti s števili iz logike, prva prazna; Razvrsti s štirimi načini', () => {
  const { dom, run, J } = zacni();
  assert.equal(vsebnik(dom).hidden, false);
  assert.deepEqual(oznake(dom).map(l => [l.tagName, l.children[0].textContent, l.children[1].tagName]),
    [['LABEL', 'Težavnost', 'SELECT'], ['LABEL', 'Stanje', 'SELECT'], ['LABEL', 'Tehnika', 'SELECT'], ['LABEL', 'Razvrsti', 'SELECT']]);
  const m = moznostiLogike(J, BREZ);
  for (const p of ['tezavnost', 'stanje', 'tehnika']) {
    assert.deepEqual(napisi(dom, p), ['', ...m[p].map(x => x.napis)], p);
    assert.equal(izbrana(dom, p), '', `${p}: izbrana prazna možnost`);
    assert.equal(okence(dom, p).classList.contains('vklopljen'), false);
  }
  assert.deepEqual(napisi(dom, 'stanje'), ['', 'Nova (' + m.stanje[0].n + ')', 'V teku (2)', 'Rešena (1)']);
  assert.ok(napisi(dom, 'tezavnost').at(-1).startsWith('Ni določena ('), 'prazna težavnost na koncu');
  assert.ok(!napisi(dom, 'tehnika').some(n => /^E[12]\b|ugibanje/.test(n)), 'brez E1, E2 in ugibanja');
  assert.deepEqual(napisi(dom, 'razvrsti'), ['Nazadnje', 'Težavnost', 'Število danih', 'Datum dodajanja']);
  assert.equal(izbrana(dom, 'razvrsti'), 'Nazadnje');
  assert.equal(prikazanih(dom), `Prikazanih ${VSE.length} od ${VSE.length}`);
  assert.equal(pocisti(dom).textContent, 'Počisti filtre');
  assert.equal(pocisti(dom).hidden, true, 'brez vklopljenega filtra ni »Počisti filtre«');
  assert.deepEqual(vSeznamu(run), pricakovano(J, BREZ));
});

test('sprememba okenca takoj osveži seznam, števila, vrstico in shrambo; filtri se seštevajo', () => {
  const { dom, run, J } = zacni();
  const t = vrednostZaFilter(J, 'tezavnost');
  izberi(dom, 'tezavnost', t.ime + ' (');
  let izbira = { ...BREZ, tezavnost: t.vrednost };
  assert.deepEqual(vSeznamu(run), pricakovano(J, izbira));
  assert.equal(kartice(dom).length, t.n);
  assert.equal(okence(dom, 'tezavnost').classList.contains('vklopljen'), true);
  assert.equal(izbrana(dom, 'tezavnost'), t.napis);
  assert.match(prikazanih(dom), new RegExp(`^Prikazan\\w* ${t.n} od ${VSE.length}$`));
  assert.equal(pocisti(dom).hidden, false);
  assert.deepEqual(shranjeno(dom), izbira);

  // Druga izbira (IN): števila v okencih ob upoštevanju drugih filtrov (O2).
  const teh = moznostiLogike(J, izbira).tehnika.find(x => x.n > 0);
  izberi(dom, 'tehnika', teh.ime + ' (');
  izbira = { ...izbira, tehnika: teh.vrednost };
  const m = moznostiLogike(J, izbira);
  assert.deepEqual(vSeznamu(run), pricakovano(J, izbira));
  for (const p of ['tezavnost', 'stanje', 'tehnika']) assert.deepEqual(napisi(dom, p), ['', ...m[p].map(x => x.napis)], p);
  assert.equal(izbrana(dom, 'tehnika'), `${teh.ime} (${vSeznamu(run).length})`, 'izbrana možnost ima število prikazanih');
  assert.deepEqual(shranjeno(dom), izbira);

  // Razvrsti: vrstni red iz logike, ni filter.
  for (const r of ['danih', 'dodano', 'tezavnost', 'nazadnje']) {
    izberi(dom, 'razvrsti', { danih: 'Število danih', dodano: 'Datum dodajanja', tezavnost: 'Težavnost', nazadnje: 'Nazadnje' }[r]);
    izbira = { ...izbira, razvrsti: r };
    assert.deepEqual(vSeznamu(run), pricakovano(J, izbira), r);
    assert.equal(okence(dom, 'razvrsti').classList.contains('vklopljen'), false);
  }
  izberi(dom, 'razvrsti', 'Število danih');
  izbira = { ...izbira, razvrsti: 'danih' };

  // »Počisti filtre«: izklopi vse tri filtre, Razvrsti ostane; gumb se skrije.
  pocisti(dom).sprozi('click');
  assert.deepEqual(shranjeno(dom), { ...BREZ, razvrsti: 'danih' });
  assert.deepEqual(vSeznamu(run), pricakovano(J, { ...BREZ, razvrsti: 'danih' }));
  for (const p of ['tezavnost', 'stanje', 'tehnika']) assert.equal(izbrana(dom, p), '', p);
  assert.equal(izbrana(dom, 'razvrsti'), 'Število danih');
  assert.equal(pocisti(dom).hidden, true);
  assert.equal(prikazanih(dom), `Prikazanih ${VSE.length} od ${VSE.length}`);
});

test('prazen izid: sporočilo namesto kartic; prazna zbirka: brez okenc', () => {
  const { dom, run, J } = zacni();
  // Rešena uganka je ena; tehnika, ki je ta uganka nima, da prazen izid.
  izberi(dom, 'stanje', 'Rešena');
  const brez = moznostiLogike(J, { ...BREZ, stanje: 'resena' }).tehnika.find(x => x.n === 0);
  assert.ok(brez, 'tehnika z »(0)« ob izbranem stanju');
  izberi(dom, 'tehnika', brez.napis);
  assert.equal(kartice(dom).length, 1);
  assert.equal(kartice(dom)[0].className, 'prazno');
  assert.equal(kartice(dom)[0].textContent, 'Nobena uganka ne ustreza izbranim filtrom.');
  assert.equal(prikazanih(dom), `Prikazanih 0 od ${VSE.length}`);
  assert.deepEqual(vSeznamu(run), []);

  const prazna = zacni(new Map());
  assert.equal(vsebnik(prazna.dom).hidden, true, 'pri prazni zbirki okenc ni');
  assert.match(kartice(prazna.dom)[0].textContent, /^Zbirka je prazna/);
});

test('pomnjenje: nova stran z isto hrambo uporabi izbiro; odsotna vrednost se ob odprtju izprazni', () => {
  const { dom, J } = zacni();
  const t = vrednostZaFilter(J, 'tehnika');
  izberi(dom, 'tehnika', t.ime + ' (');
  izberi(dom, 'razvrsti', 'Datum dodajanja');

  const nova = zacni(dom.shramba);
  assert.equal(izbrana(nova.dom, 'tehnika'), t.napis);
  assert.equal(izbrana(nova.dom, 'razvrsti'), 'Datum dodajanja');
  assert.deepEqual(vSeznamu(nova.run), pricakovano(nova.J, { ...BREZ, tehnika: t.vrednost, razvrsti: 'dodano' }));

  // Vrednosti, ki jih v zbirki ni (težavnost in tehnika, ki je nima nobena uganka), se ob odprtju izpraznita –
  // tudi v shrambi; Razvrsti ostane.
  const m = moznostiLogike(J, BREZ);
  const niTez = J('TEZAVNOSTI').find(v => !m.tezavnost.some(x => x.vrednost === v));
  const niTeh = J('TRENING_TEHNIKE.map(([, t]) => t)').find(k => !m.tehnika.some(x => x.vrednost === k));
  assert.ok(niTez && niTeh, 'težavnost in tehnika, ki ju ni v zbirki');
  dom.shramba.set('sudoku.zbirka.filtri', S({ tezavnost: niTez, stanje: 'resena', tehnika: niTeh, razvrsti: 'danih' }));
  const tretja = zacni(dom.shramba);
  assert.equal(izbrana(tretja.dom, 'tezavnost'), '');
  assert.equal(izbrana(tretja.dom, 'tehnika'), '');
  assert.equal(izbrana(tretja.dom, 'stanje'), 'Rešena (1)', 'vrednost, ki je v zbirki, ostane');
  assert.deepEqual(shranjeno(tretja.dom), { ...BREZ, stanje: 'resena', razvrsti: 'danih' });
  assert.deepEqual(vSeznamu(tretja.run), [VSE[2]]);

  // Pokvarjen zapis – vse izklopljeno, brez napake.
  dom.shramba.set('sudoku.zbirka.filtri', '{pokvarjeno');
  const cetrta = zacni(dom.shramba);
  assert.equal(vSeznamu(cetrta.run).length, VSE.length);
  assert.equal(izbrana(cetrta.dom, 'razvrsti'), 'Nazadnje');
});

test('»Izbriši« zadnjo uganko z izbrano vrednostjo: vrednost ostane z »(0)« do zaprtja okna (O7)', () => {
  const { dom, run, J } = zacni();
  const ena = moznostiLogike(J, BREZ).tezavnost.find(x => x.n === 1);
  assert.ok(ena, 'težavnost, ki jo ima ena sama uganka');
  izberi(dom, 'tezavnost', ena.napis);
  const [d] = vSeznamu(run);
  run(`izbrisiUganko(zbirkaBeri().find(z => z.danosti === ${S(d)}))`);
  assert.equal(izbrana(dom, 'tezavnost'), `${ena.ime} (0)`);
  assert.equal(kartice(dom)[0].textContent, 'Nobena uganka ne ustreza izbranim filtrom.');
  assert.equal(prikazanih(dom), `Prikazanih 0 od ${VSE.length - 1}`);
  assert.equal(shranjeno(dom).tezavnost, ena.vrednost, 'v shrambi do naslednjega odprtja');

  // Ponovno odprtje okna: vrednost se izprazni, tudi v shrambi.
  run("zapriDialog(document.getElementById('zbirkaDialog'))");
  dom.klikni('zbirkaBtn');
  assert.equal(izbrana(dom, 'tezavnost'), '');
  assert.equal(shranjeno(dom).tezavnost, null);
  assert.equal(vSeznamu(run).length, VSE.length - 1);
});

test('»Uvozi« z vklopljenim filtrom: filter ostane, števila in »od M« se povečajo', async () => {
  // Izvoz nove uganke (kopija tretje z zamenjanimi števkami) iz druge, prazne igre.
  const nova = VSE[2].replace(/[1-9]/g, c => ZAMENJAVA[Number(c) - 1]);
  assert.equal(runP(`countSolutions(${S(nova)})`), 1);
  const druga = zacni(new Map(), { odpri: false });
  druga.run(`dodajVZbirko(${S(nova)}, '', 'rocno')`);
  const besedilo = druga.run('zbirkaIzvozi().besedilo');

  const { dom, run, J } = zacni();
  izberi(dom, 'stanje', 'Nova');
  const prej = vSeznamu(run).length;
  dom.el('zbirkaDatoteka').files = [{ text: () => Promise.resolve(besedilo) }];
  dom.el('zbirkaDatoteka').sprozi('change');
  await new Promise(r => setTimeout(r, 0));
  assert.match(dom.el('zbirkaStatus').textContent, /^Uvoz končan – novih: 1/);
  assert.equal(izbrana(dom, 'stanje'), `Nova (${prej + 1})`);
  assert.equal(prikazanih(dom), `Prikazanih ${prej + 1} od ${VSE.length + 1}`);
  assert.deepEqual(vSeznamu(run), pricakovano(J, { ...BREZ, stanje: 'nova' }));
  assert.ok(vSeznamu(run).includes(nova));
});

test('»Oceni zbirko« z vklopljenim filtrom: pripis skritih predlogov (O8), »Zapiši ocene« z istimi filtri', () => {
  const { dom, run, J } = zacni();
  izberi(dom, 'stanje', 'V teku');
  const vidne = vSeznamu(run);
  const skrite = VSE.filter(d => !vidne.includes(d));
  // Predlogi ocene, kot jih pošlje ocenjevanje (obdelajOceno): vidna in dve skriti uganki dobijo
  // »Več rešitev« (sprememba težavnosti), ena skrita ostane brez spremembe.
  const zapisi = J('zbirkaBeri()');
  const brezSpremembe = zapisi.find(z => z.danosti === skrite[2]);
  run(`ocenjevanje = { danosti: ${S(VSE)}, zapisi: new Map(zbirkaBeri().map(z => [z.danosti, z])), i: 0 }`);
  run('osveziOcenoGumbe()');
  const ocena = (d, tezavnost, resitve, i) => run(`obdelajOceno(${S({ tip: 'ocena', i, danosti: d, tezavnost, resitve })})`);
  ocena(vidne[0], 'Več rešitev', 2, 0);
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length}`, 'brez skritih predlogov ni pripisa');
  ocena(skrite[0], 'Več rešitev', 2, 1);
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length} · skritih predlogov ocene: 1`);
  ocena(skrite[1], 'Več rešitev', 2, 2);
  ocena(skrite[2], brezSpremembe.tezavnost || '', 'unknown', 3);
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length} · skritih predlogov ocene: 2`);
  // Vidna kartica ima vrstico ocene, skritih ni v seznamu.
  assert.ok(run(`zbirkaVrstice.get(${S(vidne[0])}).children.some(el => el.className.includes('zb-ocena'))`));
  run(`obdelajOceno({ tip: 'konec', ocenjenih: 4 })`);
  assert.equal(dom.el('oceniZapisiBtn').textContent, 'Zapiši ocene (3)', '»Zapiši ocene« šteje tudi skrite');

  // Sprememba filtra med predlogom: predlogi se izrišejo pri vidnih karticah, pripis se osveži.
  izberi(dom, 'stanje', '');
  assert.equal(prikazanih(dom), `Prikazanih ${VSE.length} od ${VSE.length}`);
  assert.ok(run(`zbirkaVrstice.get(${S(skrite[0])}).children.some(el => el.className.includes('zb-ocena'))`));
  izberi(dom, 'stanje', 'V teku');
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length} · skritih predlogov ocene: 2`);

  // »Zapiši ocene«: zapiše tudi skrite, seznam z istimi filtri, pripis izgine.
  dom.klikni('oceniZapisiBtn');
  assert.equal(J('zbirkaBeri()').filter(z => z.tezavnost === 'Več rešitev').length, 3);
  assert.equal(izbrana(dom, 'stanje'), 'V teku (2)');
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length}`);
  assert.ok(napisi(dom, 'tezavnost').includes('Več rešitev (1)'), 'nova vrednost v okencu, število ob filtru Stanje');

  // »Prekliči«: pripis izgine.
  run(`ocenjevanje = { danosti: ${S(VSE)}, zapisi: new Map(zbirkaBeri().map(z => [z.danosti, z])), i: 0 }`);
  ocena(skrite[3], 'Brez rešitve', 0, 0);
  run(`obdelajOceno({ tip: 'konec', ocenjenih: 1 })`);
  assert.match(prikazanih(dom), /skritih predlogov ocene: 1$/);
  dom.klikni('oceniPreklicBtn');
  assert.equal(prikazanih(dom), `Prikazani 2 od ${VSE.length}`);
});

test('trenutno odprta uganka, ki jo filter skrije, ni v seznamu (O9); povzetek igre enkrat na kartico (O11)', () => {
  const { dom, run } = zacni(new Map(PREDLOGA), { odpri: false });
  run(`zacniIgro(${S(VSE[0])})`);
  dom.klikni('zbirkaBtn');
  assert.ok(kartice(dom).some(li => li.className === 'trenutna'));
  izberi(dom, 'stanje', 'Rešena');
  assert.ok(!vSeznamu(run).includes(VSE[0]));
  assert.ok(!kartice(dom).some(li => li.className === 'trenutna'));
  izberi(dom, 'stanje', '');

  // Povzetek shranjene igre se pri izrisu kartic izračuna enkrat na uganko zbirke (filter in kartica) in enkrat
  // na vgrajeni primer (uskladiIgranje() pred izrisom ga računa za odprto uganko brez poteze - to ni izris).
  run('var stPovzetkov = 0; const izvirni = zbirkaPovzetekZapisa; zbirkaPovzetekZapisa = (...a) => (stPovzetkov++, izvirni(...a))');
  run('(() => { const igre = igreBeri().igre; izrisiPrimere(igre); izrisiMojeUganke(igre); })()');
  assert.equal(run('stPovzetkov'), VSE.length + run('PRIMERI.length'));
});

test('okno zbirke igre: vsebnik filtrov med vrstico ocen in seznamom, krajši namig (D1), Pomoč', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'igra', 'index.html'), 'utf8');
  const okno = html.slice(html.indexOf('<div id="zbirkaDialog"'), html.indexOf('<div id="navodilaDialog"'));
  const red = ['id="zbirkaStatus"', 'id="ocenaGumbi"', 'id="zbirkaFiltri"', 'id="zbirkaSeznam"'].map(s => okno.indexOf(s));
  assert.ok(red.every((x, i) => x > 0 && (i === 0 || x > red[i - 1])), S(red));
  const namig = okno.match(/<p class="namig">([\s\S]*?)<\/p>/)[1];
  assert.equal(namig, 'Zbirka je ista kot v reševalcu. Z <b>Izvozi</b> in <b>Uvozi</b> jo preneseš na drugo napravo; pred <b>Izbriši vse</b> jo izvozi. Več v Pomoči.');
  const pomoc = html.slice(html.indexOf('<div id="navodilaDialog"'));
  const i = pomoc.indexOf('<h4 class="navodila-podnaslov">Filtri in razvrščanje</h4>');
  assert.ok(i > pomoc.indexOf('>Uganka v seznamu<') && i < pomoc.indexOf('>Nova uganka<'), 'podnaslov za »Uganka v seznamu«');
  const odstavek = pomoc.slice(i).match(/<p>([\s\S]*?)<\/p>/)[1];
  for (const b of ['Moje uganke', 'Težavnost', 'Stanje', 'Tehnika', 'Razvrsti', 'Nazadnje', 'Število danih', 'Datum dodajanja', 'Počisti filtre']) {
    assert.ok(odstavek.includes(`<b>${b}</b>`), b);
  }
});
