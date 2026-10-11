'use strict';
// Reševalec – filter korakov in okrogel »↑« (naloga 6b, korak c, O7–O11 v docs/naloga6b-nacrt.md):
//   - možnosti okenca »Pokaži« iz dnevnika (moznostiKorakov()): »Vsi koraki (N)«, »Brez enojčkov (N)« (samo, če
//     ima uganka korake drugih tehnik), nato vsaka uporabljena tehnika v vrstnem redu povzetka; štetje enako
//     povzetku pod rešitvijo (ena funkcija – stetjeTehnik()); P_14, P_1 (brez »Brez enojčkov«), P_16 (poskus);
//   - filter skrije korake (atribut hidden) z izvirnimi številkami, števec in »Počisti kljukice« veljata za vse;
//   - O9 – odprte male mreže ostanejo; O10 – seznam enkrat na rešitev (Skrij/Pokaži ohrani filter in kljukice,
//     »Reši« z istimi danostmi nič ne spremeni, z drugimi kartico skrije, naslednji »Pokaži« zgradi nov seznam);
//   - O11 – gumb »↑« (ustvariNaVrh() iz shared/navigacija.js) je ustvarjen, viden po enem zaslonu, klik na vrh.
// Nadomestni DOM ne parsira HTML; izbirnik v seznamu korakov omogoči omogociIskanje(). Postavitev, pravi dotik in
// tipkovnica: tools/preveri-naloga6b-brskalnik.js --samo 3.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom, omogociIskanje } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js',
  'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'app/app.js', 'app/zbirka.js'];

function resevalec() {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  return { dom, run };
}

// "Reši" teče v setTimeout - počakaj, da status ni več "Rešujem …".
async function resi(dom) {
  dom.klikni('solveBtn');
  for (let t = 0; t < 400 && dom.el('status').textContent === 'Rešujem …'; t++) await new Promise(r => setTimeout(r, 25));
}
// Vgrajeni primer prek seznama »Primeri po težavnosti« in »Reši«.
async function primer(ime) {
  const r = resevalec();
  r.run(`exampleSelect.value = String(PRIMERI.findIndex(p => p.ime === ${JSON.stringify(ime)})); exampleSelect.sprozi('change')`);
  await resi(r.dom);
  return r;
}
// Seznam korakov v nadomestnem DOM-u: iskanje po seznamu in po vsakem koraku (updateProgress, »Počisti kljukice«).
function koraki(dom) {
  const ol = omogociIskanje(dom.el('steps'));
  ol.children.forEach(omogociIskanje);
  return ol.children;
}
const okence = dom => dom.el('stepsFilter');
const napisi = dom => okence(dom).children.map(o => o.textContent);
function izberi(dom, vrednost) {
  okence(dom).value = vrednost;
  okence(dom).sprozi('change');
}
const vidne = dom => koraki(dom).filter(li => !li.hidden).map(li => Number(li.querySelector('.idx').textContent.replace('.', '')));
const kljukica = li => li.querySelector('.done-check');
function oznaci(li) {
  kljukica(li).checked = true;
  kljukica(li).sprozi('change');
}
const stevec = dom => dom.el('progress').textContent;
const tehnike = run => JSON.parse(run('JSON.stringify(lastSolve.log.map(s => s.technique))'));
const ENOJCKA = ['Gol enojček', 'Skriti enojček'];

// Povzetek pod rešitvijo: [kratko ime (brez angleškega v oklepaju), število] v izpisanem vrstnem redu.
const povzetek = dom => [...dom.el('summary').innerHTML.matchAll(/<span>(.*?) – <b>(\d+)×<\/b><\/span>/g)]
  .map(([, ime, n]) => `${ime.replace(/ \(.*\)$/, '')} (${n})`);

test('okence »Pokaži«: možnosti za P_14 – vsi, brez enojčkov, tehnike v vrstnem redu povzetka', async () => {
  const { dom, run } = await primer('P_14');
  dom.klikni('openStepsBtn');
  assert.deepEqual(napisi(dom), [
    'Vsi koraki (69)', 'Brez enojčkov (12)', 'E1 · Očitni enojček (25)', 'E2 · Skriti enojček (32)',
    '1 · Izločitev izven bloka (4)', '3 · Očitni par (4)', '4 · Skriti par (2)', '9 · Veriga ene števke (1)', '11 · XY-krilo (1)',
  ]);
  assert.deepEqual(napisi(dom).slice(2), povzetek(dom), 'štetje in vrstni red enaka povzetku pod rešitvijo');
  assert.equal(okence(dom).value, 'vsi');
  assert.deepEqual(okence(dom).children.map(o => o.value).slice(0, 3), ['vsi', 'brez-enojckov', 'Gol enojček']);
  assert.equal(koraki(dom).length, 69);
  assert.ok(koraki(dom).every(li => !li.hidden), 'na začetku so vidni vsi koraki');
  assert.equal(tehnike(run).length, 69);
});

test('okence »Pokaži«: P_1 (lahka) brez »Brez enojčkov«, P_16 s poskusom in protislovjem', async () => {
  const p1 = await primer('P_1');
  p1.dom.klikni('openStepsBtn');
  assert.deepEqual(napisi(p1.dom), ['Vsi koraki (58)', 'E1 · Očitni enojček (26)', 'E2 · Skriti enojček (32)']);
  assert.deepEqual(napisi(p1.dom).slice(1), povzetek(p1.dom));

  const p16 = await primer('P_16');
  p16.dom.klikni('openStepsBtn');
  const n = napisi(p16.dom);
  assert.equal(n[0], 'Vsi koraki (73)');
  assert.equal(n[1], `Brez enojčkov (${tehnike(p16.run).filter(t => !ENOJCKA.includes(t)).length})`);
  assert.equal(n[1], 'Brez enojčkov (15)');
  assert.ok(n.includes('Poskus in protislovje (1)'), n);
  assert.deepEqual(n.slice(2), povzetek(p16.dom), 'štetje in vrstni red enaka povzetku');
  // Možnost poskusa pokaže samo njegov korak.
  const poskus = okence(p16.dom).children.find(o => o.textContent === 'Poskus in protislovje (1)').value;
  izberi(p16.dom, poskus);
  const t = tehnike(p16.run);
  assert.deepEqual(vidne(p16.dom), t.map((x, i) => (x === poskus ? i + 1 : 0)).filter(Boolean));
  assert.equal(vidne(p16.dom).length, 1);
});

test('filter skrije korake, številke ostanejo izvirne; števec in »Počisti kljukice« za vse korake', async () => {
  const { dom, run } = await primer('P_14');
  dom.klikni('openStepsBtn');
  const li = koraki(dom);
  for (let i = 0; i < 22; i++) oznaci(li[i]); // 20 enojčkov in koraka 21, 22
  assert.equal(stevec(dom), '22 / 69 opravljeno');

  izberi(dom, 'brez-enojckov');
  const t = tehnike(run);
  assert.deepEqual(vidne(dom), [21, 22, 23, 24, 25, 27, 28, 33, 34, 37, 38, 44]);
  assert.deepEqual(vidne(dom), t.map((x, i) => (ENOJCKA.includes(x) ? 0 : i + 1)).filter(Boolean));
  assert.ok(koraki(dom).every((x, i) => x.hidden === ENOJCKA.includes(t[i])), 'skriti so natanko enojčki');
  assert.equal(stevec(dom), '22 / 69 opravljeno', 'števec šteje tudi skrite korake');

  izberi(dom, 'Naked pair');
  assert.deepEqual(vidne(dom), t.map((x, i) => (x === 'Naked pair' ? i + 1 : 0)).filter(Boolean));
  assert.equal(vidne(dom).length, 4);

  dom.klikni('resetChecks');
  assert.equal(stevec(dom), '0 / 69 opravljeno');
  assert.ok(koraki(dom).every(x => !kljukica(x).checked && !x.classList.contains('done')), 'pobriše tudi skrite');

  izberi(dom, 'vsi');
  assert.equal(vidne(dom).length, 69);
});

test('O9: odprta mala mreža skritega koraka je ob »Vsi koraki« spet odprta', async () => {
  const { dom } = await primer('P_14');
  dom.klikni('openStepsBtn');
  const prvi = koraki(dom)[0];
  const gumb = prvi.querySelector('button.mini-toggle'), mreza = prvi.querySelector('div.mini-container');
  gumb.sprozi('click');
  assert.equal(mreza.style.display, 'block');
  izberi(dom, 'brez-enojckov');
  assert.equal(prvi.hidden, true);
  izberi(dom, 'vsi');
  assert.equal(prvi.hidden, false);
  assert.equal(mreza.style.display, 'block');
  assert.equal(gumb.textContent, 'Skrij mrežo ▴');
});

test('O10: Skrij/Pokaži ohrani seznam, filter in kljukice; »Reši« z istimi danostmi nič ne spremeni', async () => {
  const { dom } = await primer('P_14');
  dom.klikni('openStepsBtn');
  const prej = koraki(dom).slice();
  oznaci(prej[20]);
  izberi(dom, 'brez-enojckov');

  dom.klikni('openStepsBtn');
  assert.equal(dom.el('stepsCard').style.display, 'none');
  assert.equal(dom.el('openStepsBtn').textContent, 'Pokaži korake reševanja');
  dom.klikni('openStepsBtn');
  assert.equal(dom.el('stepsCard').style.display, 'block');
  assert.ok(koraki(dom).every((x, i) => x === prej[i]) && koraki(dom).length === 69, 'isti seznam, ne zgrajen znova');
  assert.equal(okence(dom).value, 'brez-enojckov');
  assert.equal(vidne(dom)[0], 21);
  assert.equal(kljukica(prej[20]).checked, true);
  assert.equal(stevec(dom), '1 / 69 opravljeno');

  await resi(dom);
  assert.equal(dom.el('stepsCard').style.display, 'block', 'iste danosti: kartica ostane');
  assert.ok(koraki(dom).every((x, i) => x === prej[i]), 'iste danosti: isti seznam');
  assert.equal(okence(dom).value, 'brez-enojckov');
  assert.equal(stevec(dom), '1 / 69 opravljeno');
});

test('O10: »Reši« z drugimi danostmi skrije kartico, naslednji »Pokaži« zgradi seznam nove rešitve', async () => {
  const { dom, run } = await primer('P_14');
  dom.klikni('openStepsBtn');
  oznaci(koraki(dom)[0]);
  izberi(dom, 'brez-enojckov');
  // Vpis števke rešitve v prvo prazno celico (kot vtipkana) - uganka ostane enolična, rešitev ima manj korakov.
  run(`(() => { const i = inputs.findIndex(x => !x.value); inputs[i].value = String(lastSolve.grid[i]); inputs[i].sprozi('input'); })()`);
  await resi(dom);
  assert.equal(dom.el('stepsCard').style.display, 'none', 'stari seznam se ne pokaže');
  assert.equal(dom.el('openStepsBtn').textContent, 'Pokaži korake reševanja');
  const n = tehnike(run).length;
  assert.ok(n < 69, n);
  dom.klikni('openStepsBtn');
  assert.equal(koraki(dom).length, n);
  assert.equal(okence(dom).value, 'vsi');
  assert.equal(napisi(dom)[0], `Vsi koraki (${n})`);
  assert.equal(stevec(dom), `0 / ${n} opravljeno`);
  assert.equal(vidne(dom).length, n);
});

test('O10: nova uganka iz seznama primerov skrije kartico, isti primer znova da svež seznam', async () => {
  const { dom, run } = await primer('P_14');
  dom.klikni('openStepsBtn');
  oznaci(koraki(dom)[0]);
  izberi(dom, 'brez-enojckov');
  run(`exampleSelect.value = String(PRIMERI.findIndex(p => p.ime === 'P_14')); exampleSelect.sprozi('change')`);
  assert.equal(dom.el('stepsCard').style.display, 'none');
  await resi(dom);
  dom.klikni('openStepsBtn');
  assert.equal(okence(dom).value, 'vsi');
  assert.equal(stevec(dom), '0 / 69 opravljeno');
});

test('O11: okrogel »↑« – ustvarjen v <body>, viden po enem zaslonu drsenja, klik pomakne na vrh', () => {
  const { dom } = resevalec();
  const gumbi = dom.document.body.children.filter(e => e.className === 'na-vrh');
  assert.equal(gumbi.length, 1);
  const b = gumbi[0];
  assert.equal(b.textContent, '↑');
  assert.equal(b.getAttribute('aria-label'), 'Na vrh');
  assert.equal(b.hidden, true, 'na vrhu strani skrit');
  const w = dom.globals.window;
  w.scrollY = w.innerHeight + 1;
  w.sprozi('scroll');
  assert.equal(b.hidden, false, 'po enem zaslonu viden');
  b.sprozi('click');
  assert.equal(w.scrollY, 0);
});
