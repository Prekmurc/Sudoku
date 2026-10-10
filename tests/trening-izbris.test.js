'use strict';
// »Spoznaj«: druga faza – izbris (docs/izbris-nacrt.md, korak 2: osnova in 3–6) v nadomestnem DOM-u:
//   - po pravilni 1. fazi niz »Izbriši kandidata« in navodilo, sporočilo brez izbrisa, vaja ni rešena;
//   - oznake s celico in števko: presek (onemogočeni gumbi), ↺ odstrani, izbira ostane, kandidati vaje
//     nespremenjeni;
//   - izidi »Preveri«: prazno in nepopolno ne štejeta (oznake ostanejo pri nepopolnem), napačno šteje in
//     pobriše vse oznake, pravilno šteje in reši vajo;
//   - končno stanje po 2. fazi = stanje po pravilnem odgovoru pred nalogo (razredi correct, elim, hl,
//     legenda, sporočilo koraka);
//   - 4 in 6: izbris v celicah vzorca, ni gumbov števk; 3 in 5: drug vzorec – njegov izbris; varovalo za
//     vzorec brez izbrisa (O10);
//   - štetje kroga: brez napak 9 / 9; napaka v 1. fazi pri 4 šteje; Namig v 2. fazi – vaja s pomočjo,
//     odšteti tudi poskusi 1. faze;
//   - Namig 2. faze (število in števke), Rešitev 2. faze (oznake, napačna oznaka, legenda, osvežitev);
//   - Shift+števka s pari QWERTZ, Escape, števka brez Shift nič;
//   - besedila (»izbriši«, sklanjanje).
// Izbris vzorca izračuna test sam iz vaje (neodvisno od trening/trening.js). Na kodi pred korakom 2 pade
// (po pravilni 1. fazi je vaja pri 3 in 5 že rešena, pri 4 in 6 sledi izbira števk).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { spremljajVajo, odgovoriPravilno, dokoncajOdgovor } = require('./odgovor-spoznaj.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js',
  'trening/izbris.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;
const TEHNIKE = ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple'];
const SKRITI = t => t.startsWith('hidden');

// Vaja 7 kroga (n: 6 - iste vrste kot vaja 1; vaji 1 in 2 sta po shemi); pogoj (koda v kontekstu,
// ex => bool) - generator ponavlja, dokler ga vaja ne izpolni; zadnja = vaja na zaslonu.
function zacni(tehnika, { n = 6, seme = 7, pogoj = 'ex => true', priredi = 'ex => ex' } = {}) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen, p = ${pogoj}, pr = ${priredi};
    MODES[${JSON.stringify(tehnika)}].gen = n => { for (let i = 0; ; i++) { const ex = g(n); if (p(ex) || i > 2000) return (zadnja = pr(ex)); } }; }`);
  spremljajVajo(run);
  run(`mode = ${JSON.stringify(tehnika)}; nacin = 'spoznaj'; exNum = ${n}; scoreRight = 0; scoreTotal = 0; sPomocjo = 0; updateScore(); renderExercise();`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const vse = dom => vsi(dom.el('exerciseArea'));
const ima = (e, r) => e.classList && e.classList.contains(r);
const gumb = (dom, napis) => vse(dom).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vse(dom).find(e => /^fb\b/.test(e.className));
const rezultat = dom => `${dom.el('scoreRight').textContent}/${dom.el('scoreTotal').textContent}`;
const pomoc = dom => dom.el('scorePomoc').textContent;
const vaja = run => JSON.parse(run('JSON.stringify(zadnja)'));
const celica = (dom, si) => vse(dom).find(e => ima(e, 'gc') && +e.dataset.si === si);
const celiceZ = (dom, r) => vse(dom).filter(e => ima(e, 'gc') && ima(e, r)).map(e => +e.dataset.si).sort((a, b) => a - b);
// Male števke z razredom kot "si:d", urejeno.
const stevke = (dom, r) => vse(dom).filter(e => ima(e, 'gc')).flatMap(c => vsi(c).filter(x => ima(x, r) && x.dataset.d).map(x => `${c.dataset.si}:${x.dataset.d}`)).sort();
const kljuci = pari => pari.map(([si, d]) => `${si}:${d}`).sort();
const faza = dom => vse(dom).find(e => ima(e, 'izbris-faza'));
const gumbStevke = (dom, d) => vsi(faza(dom)).find(e => e.tagName === 'BUTTON' && String(e.dataset.d) === String(d));
const razlog = dom => vsi(faza(dom)).find(e => ima(e, 'niz-razlog')).textContent;
const odprtiOkvirji = dom => vse(dom).filter(e => ima(e, 'peek-overlay') && ima(e, 'visible'));
const legenda = el => (vsi(el).find(e => e.className === 'legenda-vaje') || { children: [] }).children.map(p => p.children[1].textContent);
const tipka = (dom, e) => dom.tipka({ preventDefault() {}, ...e });

// Izbris vzorca (celice cells, indeksi v ex.slots) - po pravilu tehnike, neodvisno od trening.js:
// očitni par/trojica - števke vzorca v drugih celicah enote; skriti - druge števke v celicah vzorca.
function izbrisVzorca(ex, tehnika, cells) {
  if (SKRITI(tehnika)) return cells.flatMap(si => ex.slots[si].c.filter(d => !ex.targetDigits.includes(d)).map(d => [si, d]));
  const ds = [...new Set(cells.flatMap(si => ex.slots[si].c))];
  return ex.slots.flatMap((s, si) => cells.includes(si) || !s.c ? [] : s.c.filter(d => ds.includes(d)).map(d => [si, d]));
}
// 1. faza s kliki celic vzorca in »Preveri«.
function prvaFaza(dom, cells) {
  for (const si of cells) celica(dom, si).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
}
// Oznake s kliki: po parih - Escape, celica, gumb števke (deluje z vklopljeno in izklopljeno kljukico »več celic«).
function oznaci(dom, pari) {
  for (const [si, d] of pari) {
    tipka(dom, { key: 'Escape', code: 'Escape' });
    celica(dom, si).sprozi('click');
    gumbStevke(dom, d).sprozi('click');
  }
  tipka(dom, { key: 'Escape', code: 'Escape' });
}
// Kandidat zunaj izbrisa: pri očitnih števka zunaj vzorca v drugi celici enote, pri skritih števka vzorca
// v celici vzorca.
function napacenKandidat(ex, tehnika, cells, izbris) {
  const iz = new Set(kljuci(izbris));
  for (const [si, s] of ex.slots.entries()) for (const d of s.c || []) if (!iz.has(`${si}:${d}`) && (SKRITI(tehnika) ? cells.includes(si) : !cells.includes(si))) return [si, d];
  return null;
}

for (const tehnika of TEHNIKE) {
  test(`${tehnika}: po pravilni 1. fazi niz »Izbriši kandidata«, sporočilo brez izbrisa, vaja ni rešena`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run);
    assert.match(vse(dom).find(e => ima(e, 'exercise')).innerHTML, /<p class="desc">[^<]*nato izbriši kandidate, ki zaradi (njega|nje) odpadejo\.<\/p>/, 'navodilo');
    assert.equal(faza(dom), undefined, 'v 1. fazi niza ni');
    prvaFaza(dom, ex.targetSlots);
    assert.equal(fb(dom).innerHTML, '<b>Vzorec je pravilen.</b> Zdaj izbriši kandidate, ki zaradi njega odpadejo.');
    assert.ok(faza(dom) && !faza(dom).hidden, 'niz je viden');
    assert.equal(vsi(faza(dom)).filter(e => e.tagName === 'BUTTON').length, 9);
    assert.equal(rezultat(dom), '0/0', 'pravilna 1. faza se ne šteje');
    assert.equal(run('vajaResena'), false);
    assert.notEqual(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block', '»Naslednja vaja« skrita');
    assert.notEqual(gumb(dom, 'Preveri').style.display, 'none', '»Preveri« ostane');
    assert.deepEqual(celiceZ(dom, 'correct'), [...ex.targetSlots].sort((a, b) => a - b), 'celice vzorca zelene');
    assert.deepEqual(stevke(dom, 'elim'), [], 'izbrisa še ni');
    assert.deepEqual(stevke(dom, 'hl'), [], 'števke vzorca še niso obarvane');
    assert.ok(!vse(dom).some(e => e.className === 'phase2'), 'brez razdelka števk (pri 4 in 6 odpade)');
    assert.equal(razlog(dom), 'Izberi celico, nato števko, ki zaradi vzorca odpade.');
    assert.ok(vsi(faza(dom)).filter(e => e.tagName === 'BUTTON').every(b => b.disabled), 'brez izbire so gumbi onemogočeni');
  });

  test(`${tehnika}: oznake s celico in števko – presek, ↺, izbira ostane, kandidati vaje nespremenjeni`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run), cells = ex.targetSlots, izbris = izbrisVzorca(ex, tehnika, cells);
    prvaFaza(dom, cells);
    const [si, d] = izbris[0];
    celica(dom, si).sprozi('click');
    assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [si], 'celica izbrana');
    for (let x = 1; x <= 9; x++) {
      const b = gumbStevke(dom, x);
      assert.equal(b.disabled, !ex.slots[si].c.includes(x), `gumb ${x}: omogočen natanko pri kandidatu celice`);
    }
    assert.ok(ima(gumbStevke(dom, d), 'odstrani'));
    gumbStevke(dom, d).sprozi('click');
    assert.deepEqual(stevke(dom, 'oznaka'), [`${si}:${d}`], 'kandidat označen (prečrtan)');
    assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [si], 'izbira ostane');
    assert.ok(ima(gumbStevke(dom, d), 'vrni') && !ima(gumbStevke(dom, d), 'odstrani'), 'gumb ima ↺');
    assert.equal(gumbStevke(dom, d).title, `Vrni kandidata ${d}`);
    assert.deepEqual(vaja(run).slots, ex.slots, 'kandidati vaje nespremenjeni');
    assert.ok(vsi(celica(dom, si)).some(e => +e.dataset.d === d && !ima(e, 'hide')), 'kandidat ostane viden');
    gumbStevke(dom, d).sprozi('click');
    assert.deepEqual(stevke(dom, 'oznaka'), [], '↺ oznako odstrani');
    // Presek: druga celica brez skupnega kandidata ali s skupnim - z vklopljeno kljukico »več celic« (pri 3–6
    // privzeto izklopljena, popravek B 2026-10-10).
    const vec = kljukicaVec(dom);
    if (!vec.checked) { vec.checked = true; vec.sprozi('change'); }
    const drugaSi = ex.slots.findIndex((s, i) => i !== si && s.c);
    celica(dom, drugaSi).sprozi('click');
    const skupni = ex.slots[si].c.filter(x => ex.slots[drugaSi].c.includes(x));
    for (let x = 1; x <= 9; x++) assert.equal(gumbStevke(dom, x).disabled, !skupni.includes(x), `presek: gumb ${x}`);
    assert.equal(razlog(dom), skupni.length ? 'Izbrane celice: 2 – izbriši števko, ki je kandidat v vseh.' : 'Izbrane celice nimajo skupnega kandidata.');
    // Celica brez kandidatov (dana) se ne izbere.
    const dana = ex.slots.findIndex(s => !s.c);
    if (dana >= 0) {
      celica(dom, dana).sprozi('click');
      assert.ok(!celiceZ(dom, 'izbrana-izbris').includes(dana), 'dana celica se ne izbere');
    }
  });

  test(`${tehnika}: izidi »Preveri« v 2. fazi – prazno, nepopolno, napačno, pravilno; končno stanje kot prej`, () => {
    const { dom, run } = zacni(tehnika, { pogoj: 'ex => true' });
    const ex = vaja(run), cells = ex.targetSlots, izbris = izbrisVzorca(ex, tehnika, cells);
    assert.ok(izbris.length >= 2, 'vaja ima vsaj dva izbrisa');
    prvaFaza(dom, cells);
    assert.deepEqual(kljuci(JSON.parse(run('JSON.stringify(izbrisVaje.izbris)'))), kljuci(izbris), 'izbris vzorca');
    // prazno
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).innerHTML, 'Izberi celico in izbriši kandidata, ki zaradi vzorca odpade.');
    assert.equal(rezultat(dom), '0/0');
    // nepopolno
    oznaci(dom, izbris.slice(1));
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).innerHTML, '<b>Še ne.</b> Označeni kandidati res odpadejo, manjka pa še 1 izbris.');
    assert.match(fb(dom).className, /\binfo\b/);
    assert.equal(rezultat(dom), '0/0', 'nepopolno se ne šteje');
    assert.deepEqual(stevke(dom, 'oznaka'), kljuci(izbris.slice(1)), 'oznake ostanejo');
    // napačno
    const nap = napacenKandidat(ex, tehnika, cells, izbris);
    assert.ok(nap, 'vaja ima kandidat zunaj izbrisa');
    oznaci(dom, [nap]);
    celica(dom, nap[0]).sprozi('click');
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).innerHTML, `<b>Ni pravilno.</b> Med označenimi je kandidat, ki zaradi vzorca ne odpade. ${run(`TEHNIKE_OPISI[${JSON.stringify(tehnika)}].posledica`)}`);
    assert.equal(rezultat(dom), '0/1', 'napačen odgovor šteje');
    assert.deepEqual(stevke(dom, 'oznaka'), [], 'vse oznake pobrisane');
    assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [], 'izbira prazna');
    assert.equal(run('vajaResena'), false);
    // pravilno
    oznaci(dom, izbris);
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(rezultat(dom), '1/2');
    assert.equal(run('vajaResena'), true);
    // Končno stanje = stanje po pravilnem odgovoru pred nalogo.
    assert.equal(fb(dom).innerHTML, `<b>Pravilno!</b> ${ex.solutionMessage}`);
    assert.deepEqual(legenda(fb(dom)), ['izbrane celice', 'izbrisani kandidati']);
    const vz = [...cells].sort((a, b) => a - b);
    assert.deepEqual(celiceZ(dom, 'correct'), vz);
    assert.deepEqual(celiceZ(dom, run(`MODES[${JSON.stringify(tehnika)}].selClass`)), vz, 'celice vzorca izbrane kot prej');
    assert.deepEqual(stevke(dom, 'elim'), kljuci(izbris), 'izbris prečrtan');
    const ds = SKRITI(tehnika) ? ex.targetDigits : [...new Set(cells.flatMap(si => ex.slots[si].c))];
    assert.deepEqual(stevke(dom, 'hl'), kljuci(cells.flatMap(si => ex.slots[si].c.filter(d => ds.includes(d)).map(d => [si, d]))), 'števke vzorca obarvane');
    assert.deepEqual(stevke(dom, 'oznaka'), [], 'oznak ni več');
    assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), []);
    assert.ok(faza(dom).hidden, 'niz skrit');
    assert.equal(run('izbrisVaje'), null);
    assert.equal(gumb(dom, 'Preveri').style.display, 'none');
    assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
    assert.deepEqual(JSON.parse(run('JSON.stringify(selected)')), cells, 'izbira 1. faze kot prej');
    if (SKRITI(tehnika)) {
      assert.ok(vse(dom).filter(e => ima(e, 'gc')).every(c => !ima(c, 'selectable') && c.style.pointerEvents === 'none'), '4, 6: mreža ni več klikljiva (kot prej)');
    }
  });
}

test('4 · Skriti par: izbris je v celicah vzorca – celico vzorca je mogoče izbrati, gumbov števk para ni', () => {
  const { dom, run } = zacni('hidden-pair');
  const ex = vaja(run);
  prvaFaza(dom, ex.targetSlots);
  assert.equal(gumb(dom, 'Preveri dve števki'), undefined);
  const si = ex.targetSlots[0];
  celica(dom, si).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [si], 'zelena celica vzorca je izbrana');
  assert.ok(ima(celica(dom, si), 'correct'));
  odgovoriPravilno(dom, run);
  assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/);
});

test('5 · Očitna trojica: drug veljaven vzorec – v 2. fazi njegov izbris', () => {
  const DRUGI = `ex => { const p = ex.slots.map((s, i) => s.c ? i : -1).filter(i => i >= 0), t = [...ex.targetSlots].sort((a, b) => a - b).join();
    for (let a = 0; a < p.length; a++) for (let b = a + 1; b < p.length; b++) for (let c = b + 1; c < p.length; c++)
      if (new Set([p[a], p[b], p[c]].flatMap(i => ex.slots[i].c)).size === 3 && [p[a], p[b], p[c]].join() !== t) return [p[a], p[b], p[c]];
    return null; }`;
  const { dom, run } = zacni('naked-triple', { pogoj: `ex => !!(${DRUGI})(ex)`, priredi: `ex => (ex.drugi = (${DRUGI})(ex), ex)` });
  const ex = vaja(run);
  assert.ok(ex.drugi, 'vaja ima drug vzorec');
  const izbris = izbrisVzorca(ex, 'naked-triple', ex.drugi);
  assert.notDeepEqual(kljuci(izbris), kljuci(izbrisVzorca(ex, 'naked-triple', ex.targetSlots)), 'drug izbris');
  prvaFaza(dom, ex.drugi);
  assert.deepEqual(kljuci(JSON.parse(run('JSON.stringify(izbrisVaje.izbris)'))), kljuci(izbris));
  oznaci(dom, izbris);
  gumb(dom, 'Preveri').sprozi('click');
  const ds = [...new Set(ex.drugi.flatMap(si => ex.slots[si].c))].sort((a, b) => a - b);
  assert.equal(fb(dom).innerHTML, `<b>Pravilno!</b> {${ds.join(', ')}} v ${ex.drugi.map(si => ex.slots[si].pos).join(', ')}.`);
  assert.deepEqual(stevke(dom, 'elim'), kljuci(izbris));
  assert.equal(rezultat(dom), '1/1');
});

test('3 · Očitni par: vzorec brez izbrisa (varovalo, O10) – vaja rešena že po 1. fazi', () => {
  const PRIREDI = `ex => { const ds = ex.targetDigits; ex.slots.forEach((s, i) => { if (s.c && !ex.targetSlots.includes(i)) s.c = s.c.filter(d => !ds.includes(d)); }); return ex; }`;
  const POGOJ = `ex => ex.slots.every((s, i) => !s.c || ex.targetSlots.includes(i) || s.c.some(d => !ex.targetDigits.includes(d)))`;
  const { dom, run } = zacni('naked-pair', { pogoj: POGOJ, priredi: PRIREDI });
  const ex = vaja(run);
  assert.deepEqual(izbrisVzorca(ex, 'naked-pair', ex.targetSlots), []);
  prvaFaza(dom, ex.targetSlots);
  assert.equal(fb(dom).innerHTML, '<b>Pravilno!</b> Ta vzorec ne izbriše nobenega kandidata.');
  assert.equal(rezultat(dom), '1/1');
  assert.equal(run('vajaResena'), true);
  assert.ok(!faza(dom) || faza(dom).hidden, 'brez niza');
  assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
});

test('štetje kroga: 3 · Očitni par brez napak 9 / 9 (obe fazi)', () => {
  const { dom, run } = zacni('naked-pair', { n: 0 });
  for (let i = 0; i < 9; i++) {
    odgovoriPravilno(dom, run);
    assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/, `vaja ${i + 1}`);
    gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').sprozi('click');
  }
  assert.equal(rezultat(dom), '9/9');
  assert.match(dom.el('exerciseArea').children[0].innerHTML, /Rezultat: <b>9<\/b> \/ <b>9<\/b>/);
});

test('štetje: 4 · Skriti par – napaka v 1. fazi šteje', () => {
  const { dom, run } = zacni('hidden-pair');
  const ex = vaja(run);
  const narobe = ex.slots.map((s, i) => i).filter(i => ex.slots[i].c && !ex.targetSlots.includes(i)).slice(0, 2);
  prvaFaza(dom, narobe);
  assert.match(fb(dom).innerHTML, /^<b>Niso prave celice\.<\/b>/);
  assert.equal(rezultat(dom), '0/1');
  odgovoriPravilno(dom, run);
  assert.equal(rezultat(dom), '1/2');
});

// Namig 2. faze (O8): »Izbrisati je treba N kandidatov – števki a in b.« – sklanjanje po pravilu slovnice.
const KANDIDAT = n => ({ 1: 'kandidata', 2: 'kandidata', 3: 'kandidate', 4: 'kandidate' })[n % 100] || 'kandidatov';
const STEVKE = ds => ds.length === 1 ? `števka ${ds[0]}` : ds.length === 2 ? `števki ${ds[0]} in ${ds[1]}` : `števke ${ds.slice(0, -1).join(', ')} in ${ds[ds.length - 1]}`;

test('4 · Skriti par: Namig v 2. fazi – število in števke; vaja s pomočjo, odšteti tudi poskusi 1. faze', () => {
  const { dom, run } = zacni('hidden-pair');
  const ex = vaja(run), izbris = izbrisVzorca(ex, 'hidden-pair', ex.targetSlots);
  prvaFaza(dom, ex.slots.map((s, i) => i).filter(i => ex.slots[i].c && !ex.targetSlots.includes(i)).slice(0, 2));
  assert.equal(rezultat(dom), '0/1');
  prvaFaza(dom, ex.targetSlots);
  gumb(dom, 'Namig').sprozi('click');
  const ds = [...new Set(izbris.map(([, d]) => d))].sort((a, b) => a - b);
  assert.equal(odprtiOkvirji(dom)[0].innerHTML, `Izbrisati je treba ${izbris.length} ${KANDIDAT(izbris.length)} – ${STEVKE(ds)}.`);
  assert.equal(rezultat(dom), '0/0', 'poskus 1. faze odštet');
  assert.equal(pomoc(dom), ' · s pomočjo: 1');
  gumb(dom, 'Skrij namig').sprozi('click');
  oznaci(dom, izbris);
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).textContent, /s pomočjo – ne šteje/);
  assert.equal(rezultat(dom), '0/0');
});

for (const tehnika of ['naked-pair', 'hidden-triple']) {
  test(`${tehnika}: Rešitev v 2. fazi – izbris, napačna oznaka z obročem, legenda, osvežitev ob oznaki`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run), cells = ex.targetSlots, izbris = izbrisVzorca(ex, tehnika, cells);
    prvaFaza(dom, cells);
    const nap = napacenKandidat(ex, tehnika, cells, izbris);
    oznaci(dom, [izbris[0], nap]);
    gumb(dom, 'Rešitev').sprozi('click');
    assert.equal(pomoc(dom), ' · s pomočjo: 1');
    const okvir = odprtiOkvirji(dom)[0];
    assert.ok(okvir.innerHTML.startsWith(ex.solutionMessage), 'sporočilo koraka');
    assert.deepEqual(stevke(dom, 'peek-izbris'), kljuci(izbris), 'vsi kandidati za izbris prečrtani');
    assert.deepEqual(stevke(dom, 'peek-napacna'), kljuci([nap]), 'napačna oznaka');
    assert.deepEqual(celiceZ(dom, 'correct'), [...cells].sort((a, b) => a - b), 'vzorec ostane zelen');
    assert.deepEqual(celiceZ(dom, 'peek-hl'), []);
    const celiceIzbrisa = [...new Set(izbris.map(([si]) => si))].filter(si => !cells.includes(si)).sort((a, b) => a - b);
    assert.deepEqual(celiceZ(dom, 'peek-elim'), celiceIzbrisa, SKRITI(tehnika) ? 'celice vzorca niso rožnate' : 'celice izbrisa rožnate');
    assert.deepEqual(legenda(okvir), ['tvoj vzorec', ...(celiceIzbrisa.length ? ['celica izbrisa'] : []), 'kandidat za izbris', 'napačno označen kandidat']);
    // Osvežitev: napačno oznako odstrani (↺) - obroča in postavke legende ni več.
    tipka(dom, { key: 'Escape', code: 'Escape' });
    celica(dom, nap[0]).sprozi('click');
    gumbStevke(dom, nap[1]).sprozi('click');
    assert.deepEqual(stevke(dom, 'peek-napacna'), []);
    assert.deepEqual(legenda(odprtiOkvirji(dom)[0]), ['tvoj vzorec', ...(celiceIzbrisa.length ? ['celica izbrisa'] : []), 'kandidat za izbris']);
    gumb(dom, 'Skrij rešitev').sprozi('click');
    assert.deepEqual(stevke(dom, 'peek-izbris'), []);
    assert.deepEqual(stevke(dom, 'oznaka'), kljuci([izbris[0]]), 'oznaka ostane');
    // Pravilen odgovor ob odprti Rešitvi jo zapre.
    gumb(dom, 'Rešitev').sprozi('click');
    oznaci(dom, izbris.slice(1));
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/);
    assert.equal(odprtiOkvirji(dom).length, 0);
  });
}

test('tipkovnica v 2. fazi: Shift+števka (pari QWERTZ, Numpad), Escape, števka brez Shift nič; v 1. fazi nič', () => {
  const { dom, run } = zacni('naked-pair');
  const ex = vaja(run), izbris = izbrisVzorca(ex, 'naked-pair', ex.targetSlots);
  const [si, d] = izbris[0];
  const SHIFT = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
  tipka(dom, { key: SHIFT[d], code: `Digit${d}`, shiftKey: true });
  assert.equal(run('izbrisVaje'), null, 'v 1. fazi tipkovnice ni');
  prvaFaza(dom, ex.targetSlots);
  celica(dom, si).sprozi('click');
  tipka(dom, { key: String(d), code: `Digit${d}` });
  assert.deepEqual(stevke(dom, 'oznaka'), [], 'števka brez Shift ne naredi nič');
  tipka(dom, { key: SHIFT[d], code: `Digit${d}`, shiftKey: true });
  assert.deepEqual(stevke(dom, 'oznaka'), [`${si}:${d}`], 'Shift+števka (QWERTZ) označi');
  tipka(dom, { key: 'End', code: `Numpad${d}`, shiftKey: true });
  assert.deepEqual(stevke(dom, 'oznaka'), [], 'Shift+Numpad oznako odstrani');
  tipka(dom, { key: 'Escape', code: 'Escape' });
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [], 'Escape počisti izbiro');
});

test('besedila 2. faze: sklanjanje namiga in nepopolnega odgovora, »izbriši«', () => {
  const { run } = zacni('naked-pair');
  const MANJKA = n => `${({ 1: 'manjka', 2: 'manjkata', 3: 'manjkajo', 4: 'manjkajo' })[n % 100] || 'manjka'} pa še ${n} ${({ 1: 'izbris', 2: 'izbrisa', 3: 'izbrisi', 4: 'izbrisi' })[n % 100] || 'izbrisov'}`;
  for (const n of [1, 2, 3, 4, 5, 6, 11, 12, 21, 101, 102]) {
    assert.equal(run(`sporociloIzbrisa({ izid: 'delno', manjka: ${n} }, '')`), `<b>Še ne.</b> Označeni kandidati res odpadejo, ${MANJKA(n)}.`, `manjka ${n}`);
    const pari = Array.from({ length: n }, (_, i) => [i, 5]);
    assert.equal(run(`namigIzbrisa(${JSON.stringify(pari)})`), `Izbrisati je treba ${n} ${KANDIDAT(n)} – števka 5.`, `namig ${n}`);
  }
  assert.equal(run('namigIzbrisa([[0, 3], [1, 8], [2, 3]])'), 'Izbrisati je treba 3 kandidate – števki 3 in 8.');
  assert.equal(run('namigIzbrisa([[0, 3], [1, 8], [2, 5]])'), 'Izbrisati je treba 3 kandidate – števke 3, 5 in 8.');
  for (const t of TEHNIKE) {
    const nav = run(`TEHNIKE_OPISI[${JSON.stringify(t)}].navodilo`);
    assert.match(nav, /izbriši kandidate/, `${t}: navodilo pove 2. fazo`);
    assert.doesNotMatch(nav, /števki para|števke trojice|odstrani|izloči/, `${t}: brez izbire števk in drugih glagolov`);
  }
});

test('presodiIzbris: prazno, napačno, delno, pravilno', () => {
  const { run } = zacni('naked-pair');
  const p = (iz, oz) => JSON.parse(run(`JSON.stringify(presodiIzbris(${JSON.stringify(iz)}, new Set(${JSON.stringify(oz)})))`));
  const IZ = [[1, 3], [2, 3], [2, 8]];
  assert.deepEqual(p(IZ, []), { izid: 'prazno', manjka: 3 });
  assert.deepEqual(p(IZ, [13, 23]), { izid: 'delno', manjka: 1 });
  assert.deepEqual(p(IZ, [13, 23, 28, 48]), { izid: 'napacno', manjka: 0 });
  assert.deepEqual(p(IZ, [13, 23, 28]), { izid: 'pravilno', manjka: 0 });
});

// Pomožna funkcija (tests/odgovor-spoznaj.js) z drugo fazo: dokoncajOdgovor po izbiri drugega veljavnega
// vzorca označi njegov izbris.
test('pomožna funkcija: dokoncajOdgovor() opravi 2. fazo za sprejeti vzorec', () => {
  const { dom, run } = zacni('naked-pair');
  run('selected = [...zadnja.targetSlots]');
  dokoncajOdgovor(dom, run);
  assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/);
  assert.equal(rezultat(dom), '1/1');
});

// ===== Korak 3 – 7–13: mreža ene števke (7, 8 – celica xw-cell, števka je besedilo celice) in cela mreža 9 × 9
// (9–13 – celica .gc z malimi števkami). Celica vaje je pri 7 in 8 indeks 0–80, pri 9–13 indeks v ex.slots.
// Izbris vzorca izračuna test sam: pri 7 po pravilu X-krila, pri 8 s swordfish(), pri 9–13 s funkcijo tehnike
// (motor) na deski vaje - korak z isto množico celic, kot jo sprejme »Preveri«.
const MREZA_ENE = t => t === 'x-wing' || t === 'swordfish';
const TEHNIKE_7_13 = ['x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain'];
const FUNKCIJA = { 'turbot-fish': 'turbotFish', 'w-wing': 'wWing', 'xy-wing': 'xyWing', 'unique-rectangle': 'uniqueRectangle', 'xy-chain': 'xyChain' };
const jeCelicaVaje = e => (ima(e, 'gc') && e.dataset.si !== undefined) || ima(e, 'xw-cell');
const stCelice = e => +(ima(e, 'xw-cell') ? e.dataset.idx : e.dataset.si);
const celicaVaje = (dom, c) => vse(dom).find(e => jeCelicaVaje(e) && stCelice(e) === c);
const celiceVajeZ = (dom, r) => vse(dom).filter(e => jeCelicaVaje(e) && ima(e, r)).map(stCelice).sort((a, b) => a - b);
const urejeno = a => [...a].sort((x, y) => x - y);
const brezLegende = html => html.replace(/<div class="legenda-vaje">.*$/, '');
const stevilkeVerige = (dom, veriga) => veriga.map(si => (vsi(celicaVaje(dom, si)).find(e => ima(e, 'veriga-st')) || {}).textContent);

// Vzorec vaje, kot ga je sestavil generator (celice vaje) - kot izberiVzorec() v tests/odgovor-spoznaj.js.
function vzorecVaje(ex, tehnika) {
  if (MREZA_ENE(tehnika)) return (ex.rect || ex.sfCells).map(([r, c]) => r * 9 + c);
  return ex.solutionCells.map(c => ex.slots.findIndex(s => s.idx === c));
}
// X-krilo po pravilu: štiri celice v dveh vrsticah in dveh stolpcih; vrstici, v katerih je števka samo v teh
// dveh stolpcih, sta bazi - izbris so druge celice s števko v stolpcih vzorca (ali z zamenjanimi vlogami).
function izbrisXKrila(ex, cells) {
  const V = urejeno(new Set(cells.map(c => Math.floor(c / 9)))), S = urejeno(new Set(cells.map(c => c % 9)));
  const vVrstici = r => [...Array(9).keys()].filter(c => ex.grid[r * 9 + c]), vStolpcu = c => [...Array(9).keys()].filter(r => ex.grid[r * 9 + c]);
  const izbris = [];
  if (V.every(r => vVrstici(r).join() === S.join())) S.forEach(c => vStolpcu(c).forEach(r => { if (!V.includes(r)) izbris.push(r * 9 + c); }));
  else {
    assert.ok(S.every(c => vStolpcu(c).join() === V.join()), 'X-krilo po stolpcih');
    V.forEach(r => vVrstici(r).forEach(c => { if (!S.includes(c)) izbris.push(r * 9 + c); }));
  }
  return izbris.map(c => [c, ex.digit]);
}
// Izbris in sporočilo koraka vzorca `cells` (celice vaje) - neodvisno od trening/trening.js.
function korakVzorca(run, ex, tehnika, cells) {
  if (tehnika === 'x-wing') return { izbris: izbrisXKrila(ex, cells) };
  const deska = tehnika === 'swordfish' ? '{ grid: new Array(81).fill(0), cand: zadnja.grid.map(h => h ? 1 << zadnja.digit : 0) }' : '{ grid: zadnja.boardGrid, cand: zadnja.boardCand }';
  const fn = tehnika === 'swordfish' ? 'swordfish' : FUNKCIJA[tehnika];
  const celice = tehnika === 'swordfish' ? cells : cells.map(si => ex.slots[si].idx);
  const k = JSON.parse(run(`JSON.stringify(${fn}(${deska}).find(s => s.cells.length === ${celice.length} && ${JSON.stringify(celice)}.every(c => s.cells.includes(c))) || null)`));
  assert.ok(k, `${tehnika}: motor najde vzorec`);
  const vSi = c => tehnika === 'swordfish' ? c : ex.slots.findIndex(s => s.idx === c);
  return { izbris: k.eliminate.map(([c, d]) => [vSi(c), d]), sporocilo: k.message, veriga: k.veriga ? k.cells.map(vSi) : null };
}
// Oznake s kliki celic in gumbov števk (celica vaje - xw-cell ali .gc), po parih kot oznaci().
function oznaciVaja(dom, pari) {
  for (const [c, d] of pari) {
    tipka(dom, { key: 'Escape', code: 'Escape' });
    celicaVaje(dom, c).sprozi('click');
    gumbStevke(dom, d).sprozi('click');
  }
  tipka(dom, { key: 'Escape', code: 'Escape' });
}
const prvaFazaVaja = (dom, cells) => { for (const c of cells) celicaVaje(dom, c).sprozi('click'); gumb(dom, 'Preveri').sprozi('click'); };
// Kandidat zunaj izbrisa (pri mreži ene števke celica vzorca, sicer kandidat v kateri koli celici vaje).
function napacenVaja(ex, tehnika, cells, izbris) {
  const iz = new Set(kljuci(izbris));
  if (MREZA_ENE(tehnika)) return [cells[0], ex.digit];
  for (const [si, s] of ex.slots.entries()) for (const d of s.c || []) if (!iz.has(`${si}:${d}`)) return [si, d];
  return null;
}
// Oznake na mreži kot "c:d": pri mreži ene števke razred celice, sicer razred male števke.
const oznakeVaja = (dom, tehnika, r, ex) => MREZA_ENE(tehnika) ? celiceVajeZ(dom, r).map(c => `${c}:${ex.digit}`).sort() : stevke(dom, r);
const SPOROCILO_78 = /^<b>Pravilno! \((Vrstično X-krilo|Stolpčno X-krilo|Vrstična mečarica|Stolpčna mečarica)\)<\/b> Števka \d je v (dveh|treh) (vrsticah|stolpcih) \([^)]*\) mogoča samo v (stolpcih|vrsticah) [^→]* → iz preostanka teh (stolpcev|vrstic) jo izbrišeš\.$/;

for (const tehnika of TEHNIKE_7_13) {
  test(`${tehnika}: po pravilni 1. fazi niz »Izbriši kandidata«, sporočilo brez izbrisa, izbris sprejetega vzorca`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run), cells = vzorecVaje(ex, tehnika), k = korakVzorca(run, ex, tehnika, cells);
    assert.match(vse(dom).find(e => ima(e, 'exercise')).innerHTML, /<p class="desc">[^<]*, nato izbriši kandidate, ki zaradi (vzorca|njega|nje) odpadejo\.<\/p>/, 'navodilo');
    prvaFazaVaja(dom, cells);
    if (MREZA_ENE(tehnika)) {
      assert.match(fb(dom).innerHTML, /^<b>Vzorec je pravilen \((vrstično X-krilo|stolpčno X-krilo|vrstična mečarica|stolpčna mečarica)\)\.<\/b> Števka \d je v (dveh|treh) (vrsticah|stolpcih) \([^)]*\) mogoča samo v (stolpcih|vrsticah) [^.→]*\. Zdaj izbriši kandidate, ki zaradi vzorca odpadejo\.$/);
    } else assert.equal(fb(dom).innerHTML, '<b>Vzorec je pravilen.</b> Zdaj izbriši kandidate, ki zaradi njega odpadejo.');
    assert.doesNotMatch(fb(dom).innerHTML, /izbrišeš/, 'sporočilo ne pove izbrisa');
    assert.ok(faza(dom) && !faza(dom).hidden, 'niz je viden');
    assert.equal(rezultat(dom), '0/0', 'pravilna 1. faza se ne šteje');
    assert.equal(run('vajaResena'), false);
    assert.notEqual(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
    assert.deepEqual(kljuci(JSON.parse(run('JSON.stringify(izbrisVaje.izbris)'))), kljuci(k.izbris), 'izbris vzorca');
    const pravilna = tehnika === 'x-wing' ? 'xw-correct' : tehnika === 'swordfish' ? 'xw-sf-correct' : 'correct';
    assert.deepEqual(celiceVajeZ(dom, pravilna), urejeno(cells), 'celice vzorca zelene');
    assert.deepEqual(celiceVajeZ(dom, MREZA_ENE(tehnika) ? 'xw-selected' : run(`MODES['${tehnika}'].selClass`)), [], 'izbira 1. faze izpraznjena');
    assert.deepEqual([...celiceVajeZ(dom, 'xw-elim'), ...celiceVajeZ(dom, 'elimcell')], [], 'celic izbrisa še ni');
    assert.deepEqual(stevke(dom, 'elim'), [], 'izbrisa še ni');
    // 13: zaporedne številke verige so na mreži že po 1. fazi (vzorec), po vrsti verige.
    if (tehnika === 'xy-chain') assert.deepEqual(stevilkeVerige(dom, k.veriga), k.veriga.map((_, j) => String(j + 1)), 'številke verige');
    else assert.deepEqual(stevke(dom, 'veriga-st'), []);
  });

  test(`${tehnika}: izidi »Preveri« v 2. fazi; končno stanje kot pred nalogo`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run), cells = vzorecVaje(ex, tehnika), k = korakVzorca(run, ex, tehnika, cells);
    prvaFazaVaja(dom, cells);
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).innerHTML, 'Izberi celico in izbriši kandidata, ki zaradi vzorca odpade.');
    if (k.izbris.length >= 2) {
      oznaciVaja(dom, k.izbris.slice(1));
      gumb(dom, 'Preveri').sprozi('click');
      assert.equal(fb(dom).innerHTML, '<b>Še ne.</b> Označeni kandidati res odpadejo, manjka pa še 1 izbris.');
      assert.equal(rezultat(dom), '0/0', 'nepopolno se ne šteje');
      assert.deepEqual(oznakeVaja(dom, tehnika, 'oznaka', ex), kljuci(k.izbris.slice(1)), 'oznake ostanejo');
    }
    const nap = napacenVaja(ex, tehnika, cells, k.izbris);
    oznaciVaja(dom, [nap]);
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).innerHTML, `<b>Ni pravilno.</b> Med označenimi je kandidat, ki zaradi vzorca ne odpade. ${run(`TEHNIKE_OPISI['${tehnika}'].posledica`)}`);
    assert.equal(rezultat(dom), '0/1', 'napačen odgovor šteje');
    assert.deepEqual(oznakeVaja(dom, tehnika, 'oznaka', ex), [], 'vse oznake pobrisane');
    oznaciVaja(dom, k.izbris);
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(rezultat(dom), '1/2');
    assert.equal(run('vajaResena'), true);
    // Končno stanje = stanje po pravilnem odgovoru pred nalogo.
    if (MREZA_ENE(tehnika)) assert.match(brezLegende(fb(dom).innerHTML), SPOROCILO_78);
    else assert.equal(brezLegende(fb(dom).innerHTML), `<b>Pravilno!</b> ${k.sporocilo}`);
    assert.deepEqual(legenda(fb(dom)), ['izbrane celice', 'celica z izbrisom', 'izbrisani kandidati']);
    const izbrisCelice = urejeno(new Set(k.izbris.map(([c]) => c)));
    if (MREZA_ENE(tehnika)) {
      assert.deepEqual(celiceVajeZ(dom, tehnika === 'x-wing' ? 'xw-correct' : 'xw-sf-correct'), urejeno(cells));
      assert.deepEqual(celiceVajeZ(dom, 'xw-elim'), izbrisCelice, 'celice izbrisa');
      // Razredi celic vzorca v istem vrstnem redu kot prej (izbira, nato pravilno).
      for (const c of cells) assert.match(celicaVaje(dom, c).className, /^xw-cell has-digit xw-selected xw-(sf-)?correct$/, 'razredi celice vzorca kot prej');
      for (const c of izbrisCelice) assert.equal(celicaVaje(dom, c).className, 'xw-cell has-digit xw-elim', 'razredi celice izbrisa kot prej');
    } else {
      const sel = run(`MODES['${tehnika}'].selClass`);
      assert.deepEqual(celiceVajeZ(dom, 'correct'), urejeno(cells));
      for (const si of cells) assert.match(celicaVaje(dom, si).className, new RegExp(`^gc selectable ${sel} correct( elimcell)?$`), 'razredi celice vzorca kot prej');
      assert.deepEqual(celiceVajeZ(dom, 'elimcell'), izbrisCelice, 'celice izbrisa');
      assert.deepEqual(stevke(dom, 'elim'), kljuci(k.izbris), 'izbris prečrtan');
    }
    assert.deepEqual([...celiceVajeZ(dom, 'oznaka'), ...stevke(dom, 'oznaka')], [], 'oznak ni več');
    assert.deepEqual(celiceVajeZ(dom, 'izbrana-izbris'), []);
    assert.ok(faza(dom).hidden, 'niz skrit');
    assert.equal(run('izbrisVaje'), null);
    assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
    assert.deepEqual(JSON.parse(run('JSON.stringify(selected)')), cells, 'izbira 1. faze kot prej');
    if (tehnika === 'xy-chain') assert.deepEqual(stevilkeVerige(dom, k.veriga), k.veriga.map((_, j) => String(j + 1)), 'številke verige ostanejo');
  });
}

// Drug veljaven vzorec pri 7 in 8 (O10): v 2. fazi izbris tega vzorca, ne generatorjevega.
const DRUGI_78 = {
  'x-wing': `ex => { const t = ex.rect.map(([r, c]) => r * 9 + c).sort((a, b) => a - b).join();
    for (const vrst of [true, false]) { const id = (b, i) => vrst ? b * 9 + i : i * 9 + b;
      for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) {
        const pa = [], pb = []; for (let i = 0; i < 9; i++) { if (ex.grid[id(a, i)]) pa.push(i); if (ex.grid[id(b, i)]) pb.push(i); }
        if (pa.length !== 2 || pa.join() !== pb.join()) continue;
        const cells = [id(a, pa[0]), id(a, pa[1]), id(b, pa[0]), id(b, pa[1])];
        if (cells.slice().sort((x, y) => x - y).join() !== t) return cells; } }
    return null; }`,
  'swordfish': `ex => { const t = ex.sfCells.map(([r, c]) => r * 9 + c).sort((a, b) => a - b).join();
    const s = swordfish({ grid: new Array(81).fill(0), cand: ex.grid.map(h => h ? 1 << ex.digit : 0) }).find(s => s.cells.slice().sort((a, b) => a - b).join() !== t);
    return s ? s.cells : null; }`,
};
for (const tehnika of ['x-wing', 'swordfish']) {
  test(`${tehnika}: drug veljaven vzorec – v 2. fazi njegov izbris`, () => {
    const { dom, run } = zacni(tehnika, { pogoj: `ex => !!(${DRUGI_78[tehnika]})(ex)`, priredi: `ex => (ex.drugi = (${DRUGI_78[tehnika]})(ex), ex)` });
    const ex = vaja(run);
    assert.ok(ex.drugi, 'vaja ima drug vzorec');
    const k = korakVzorca(run, ex, tehnika, ex.drugi), gen = korakVzorca(run, ex, tehnika, vzorecVaje(ex, tehnika));
    assert.notDeepEqual(kljuci(k.izbris), kljuci(gen.izbris), 'drug izbris');
    prvaFazaVaja(dom, ex.drugi);
    assert.deepEqual(kljuci(JSON.parse(run('JSON.stringify(izbrisVaje.izbris)'))), kljuci(k.izbris));
    oznaciVaja(dom, k.izbris);
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(brezLegende(fb(dom).innerHTML), SPOROCILO_78);
    assert.deepEqual(celiceVajeZ(dom, 'xw-elim'), urejeno(k.izbris.map(([c]) => c)));
    assert.equal(rezultat(dom), '1/1');
  });
}

test('7 · X-krilo: celica s števko se v 2. fazi izbere, gumb je samo števka vaje, oznaka prečrta števko celice', () => {
  const { dom, run } = zacni('x-wing');
  const ex = vaja(run), cells = vzorecVaje(ex, 'x-wing'), k = korakVzorca(run, ex, 'x-wing', cells);
  prvaFazaVaja(dom, cells);
  const [c] = k.izbris[0];
  celicaVaje(dom, c).sprozi('click');
  assert.deepEqual(celiceVajeZ(dom, 'izbrana-izbris'), [c]);
  for (let x = 1; x <= 9; x++) assert.equal(gumbStevke(dom, x).disabled, x !== ex.digit, `gumb ${x}`);
  gumbStevke(dom, ex.digit).sprozi('click');
  assert.deepEqual(celiceVajeZ(dom, 'oznaka'), [c], 'števka celice označena');
  assert.ok(!ima(celicaVaje(dom, c), 'xw-elim'), 'celica ostane bela (rožnata šele po odgovoru)');
  assert.ok(ima(gumbStevke(dom, ex.digit), 'vrni'));
  gumbStevke(dom, ex.digit).sprozi('click');
  assert.deepEqual(celiceVajeZ(dom, 'oznaka'), [], '↺');
  // Celica brez števke se ne izbere.
  const prazna = ex.grid.findIndex(h => !h);
  const el = vse(dom).find(e => ima(e, 'xw-cell') && +e.dataset.idx === prazna);
  el.sprozi('click');
  assert.ok(!ima(el, 'izbrana-izbris'));
});

test('12 · Edinstveni pravokotnik: obe števki iz četrtega vogala (celica vzorca)', () => {
  const { dom, run } = zacni('unique-rectangle');
  const ex = vaja(run), cells = vzorecVaje(ex, 'unique-rectangle'), k = korakVzorca(run, ex, 'unique-rectangle', cells);
  assert.equal(k.izbris.length, 2);
  const [[c1, d1], [c2, d2]] = k.izbris;
  assert.equal(c1, c2, 'ista celica');
  assert.ok(cells.includes(c1), 'četrti vogal je celica vzorca');
  prvaFazaVaja(dom, cells);
  celicaVaje(dom, c1).sprozi('click');
  assert.ok(ima(celicaVaje(dom, c1), 'correct') && ima(celicaVaje(dom, c1), 'izbrana-izbris'), 'zelen vogal je izbran');
  gumbStevke(dom, d1).sprozi('click');
  gumbStevke(dom, d2).sprozi('click');
  assert.deepEqual(stevke(dom, 'oznaka'), kljuci(k.izbris));
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/);
  assert.deepEqual(stevke(dom, 'elim'), kljuci(k.izbris));
});

for (const tehnika of ['swordfish', 'unique-rectangle']) {
  test(`${tehnika}: Rešitev v 2. fazi – izbris, napačna oznaka, legenda`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vaja(run), cells = vzorecVaje(ex, tehnika), k = korakVzorca(run, ex, tehnika, cells);
    prvaFazaVaja(dom, cells);
    const nap = napacenVaja(ex, tehnika, cells, k.izbris);
    oznaciVaja(dom, [k.izbris[0], nap]);
    gumb(dom, 'Rešitev').sprozi('click');
    const okvir = odprtiOkvirji(dom)[0];
    const celiceIzbrisa = urejeno(new Set(k.izbris.map(([c]) => c).filter(c => !cells.includes(c))));
    assert.deepEqual(celiceVajeZ(dom, 'peek-elim'), celiceIzbrisa, 'celice izbrisa zunaj vzorca rožnate');
    if (MREZA_ENE(tehnika)) {
      assert.match(okvir.innerHTML, /^<b>(Vrstična|Stolpčna) mečarica:<\/b> Števka \d je v treh (vrsticah|stolpcih) .* → iz preostanka teh (stolpcev|vrstic) jo izbrišeš\./, 'stavek o najdenem vzorcu');
      assert.deepEqual(celiceVajeZ(dom, 'peek-napacna'), [nap[0]], 'napačna oznaka');
    } else {
      assert.ok(okvir.innerHTML.startsWith(k.sporocilo), 'sporočilo koraka');
      assert.deepEqual(stevke(dom, 'peek-izbris'), kljuci(k.izbris), 'kandidati za izbris prečrtani');
      assert.deepEqual(stevke(dom, 'peek-napacna'), kljuci([nap]), 'napačna oznaka');
    }
    assert.deepEqual(legenda(okvir), ['tvoj vzorec', ...(celiceIzbrisa.length ? ['celica izbrisa'] : []), 'kandidat za izbris', 'napačno označen kandidat']);
    gumb(dom, 'Skrij rešitev').sprozi('click');
    assert.deepEqual([...celiceVajeZ(dom, 'peek-elim'), ...celiceVajeZ(dom, 'peek-napacna'), ...stevke(dom, 'peek-izbris'), ...stevke(dom, 'peek-napacna')], [], 'po »Skrij« ni oznak Rešitve');
  });
}

test('štetje kroga: 8 · Mečarica in 13 · XY-veriga brez napak 9 / 9 (obe fazi, vaji 1 in 2 po shemi)', () => {
  for (const tehnika of ['swordfish', 'xy-chain']) {
    const { dom, run } = zacni(tehnika, { n: 0 });
    for (let i = 0; i < 9; i++) {
      odgovoriPravilno(dom, run);
      assert.match(fb(dom).innerHTML, /^<b>Pravilno!/, `${tehnika}, vaja ${i + 1}`);
      gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').sprozi('click');
    }
    assert.equal(rezultat(dom), '9/9', tehnika);
  }
});

test('besedila 2. faze 7–13: navodila povedo izbris', () => {
  const { run } = zacni('x-wing');
  for (const t of TEHNIKE_7_13) {
    const nav = run(`TEHNIKE_OPISI[${JSON.stringify(t)}].navodilo`);
    assert.match(nav, /, nato izbriši kandidate, ki zaradi (vzorca|njega|nje) odpadejo\.$/, `${t}: navodilo pove 2. fazo`);
  }
});

// --- Korak 4: 1 · Izločitev izven bloka in 2 · Izločitev v bloku (delna mreža iz shared/mreza.js) ---
// Celica je 0–80 (presek.mreza.celice); kandidati so maske ex.kandidati. Izbris izračuna test sam po pravilu
// tehnike: pri 1 števka vaje v vrstici (stolpcu) koraka zunaj bloka, pri 2 v bloku zunaj vrstice (stolpca).
// Vaja 1 (n = 0) je po shemi, vaja 7 (n = 6) iz banke vaj. Na kodi pred korakom 4 pade (po pravilni 1. fazi
// je vaja že rešena).
const PRESEK = ['pointing', 'box-line'];
const vajaPreseka = run => JSON.parse(run('JSON.stringify(vajaNaZaslonu)'));
// Array.from: polje iz konteksta vm ima drug prototip (deepStrictEqual).
const celicePreseka = run => Array.from(run('presek.mreza.celice'));
function izbrisPreseka(ex, tehnika) {
  const crta = [...Array(9).keys()].map(k => (ex.jeVrstica ? ex.enotaSt * 9 + k : k * 9 + ex.enotaSt));
  const blok = [...Array(81).keys()].filter(i => Math.floor(i / 27) === Math.floor(ex.blok / 3) && Math.floor((i % 9) / 3) === ex.blok % 3);
  const kje = tehnika === 'pointing' ? crta.filter(i => !blok.includes(i)) : blok.filter(i => !crta.includes(i));
  return kje.filter(i => !ex.grid[i] && ex.kandidati[i] & (1 << ex.digit)).map(i => [i, ex.digit]);
}
const presekZ = (run, r) => celicePreseka(run).map((c, i) => (ima(c, r) ? i : -1)).filter(i => i >= 0);
const kandZ = (run, r) => celicePreseka(run).flatMap((c, i) => (c.children[0] && !ima(c, 'izven') ? c.children[0].children : [])
  .map((s, k) => (ima(s, r) ? `${i}:${k + 1}` : null)).filter(Boolean)).sort();
// Kandidati števke vaje v vidnih praznih celicah (poudarek v 1. in 2. fazi).
const poudarjeniKand = ex => ex.vidne.filter(i => !ex.grid[i] && ex.kandidati[i] & (1 << ex.digit)).map(i => `${i}:${ex.digit}`).sort();
const poudarjenih = run => celicePreseka(run).filter(c => vsi(c).some(s => ima(s, 'poud'))).length;
function oznaciPresek(dom, run, pari) {
  for (const [c, d] of pari) {
    tipka(dom, { key: 'Escape', code: 'Escape' });
    celicePreseka(run)[c].sprozi('click');
    gumbStevke(dom, d).sprozi('click');
  }
  tipka(dom, { key: 'Escape', code: 'Escape' });
}
function prvaFazaPreseka(dom, run, ex) {
  for (const c of ex.solutionCells) celicePreseka(run)[c].sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
}

for (const tehnika of PRESEK) {
  for (const n of [0, 6]) {
    test(`${tehnika}, vaja ${n + 1}: 2. faza na delni mreži – niz, oznake, izidi »Preveri«, končno stanje kot pred nalogo`, () => {
      const { dom, run } = zacni(tehnika, { n });
      const ex = vajaPreseka(run), izbris = izbrisPreseka(ex, tehnika);
      assert.deepEqual(kljuci(izbris), kljuci(ex.solutionEliminate), 'izbris po pravilu = korak vaje');
      prvaFazaPreseka(dom, run, ex);
      assert.equal(fb(dom).innerHTML, '<b>Vzorec je pravilen.</b> Zdaj izbriši kandidate, ki zaradi njega odpadejo.');
      assert.ok(faza(dom) && !faza(dom).hidden, 'niz je viden');
      assert.equal(vsi(faza(dom)).filter(e => e.tagName === 'BUTTON').length, 9);
      assert.equal(rezultat(dom), '0/0', 'pravilna 1. faza se ne šteje');
      assert.equal(run('vajaResena'), false);
      assert.notEqual(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
      assert.deepEqual(presekZ(run, 'k-vzorec'), urejeno(ex.solutionCells), 'vzorec jantaren');
      assert.deepEqual(presekZ(run, 'k-izbris'), [], 'celice izbrisa še niso rožnate');
      assert.deepEqual(kandZ(run, 'k-izbris'), [], 'izbrisa še ni');
      // Popravek A (ročni pregled 2026-10-10): števka vaje ostane poudarjena kot v 1. fazi.
      assert.deepEqual(kandZ(run, 'poud'), poudarjeniKand(ex), 'števka vaje poudarjena v vseh vidnih praznih celicah');
      assert.deepEqual(presekZ(run, 'izbrana'), [], 'izbira 1. faze izpraznjena');
      // Skrita in dana celica se ne izbereta; celica vzorca in celica izbrisa se.
      const c = celicePreseka(run), skrita = [...Array(81).keys()].find(i => !ex.vidne.includes(i)), dana = ex.vidne.find(i => ex.grid[i]);
      c[skrita].sprozi('click');
      c[dana].sprozi('click');
      assert.deepEqual(presekZ(run, 'izbrana'), [], 'skrita in dana celica se ne izbereta');
      c[ex.solutionCells[0]].sprozi('click');
      assert.deepEqual(presekZ(run, 'izbrana'), [ex.solutionCells[0]], 'celica vzorca se izbere');
      tipka(dom, { key: 'Escape', code: 'Escape' });
      const [ci, d] = izbris[0];
      c[ci].sprozi('click');
      for (let x = 1; x <= 9; x++) assert.equal(gumbStevke(dom, x).disabled, !(ex.kandidati[ci] & (1 << x)), `gumb ${x}: omogočen natanko pri kandidatu celice`);
      gumbStevke(dom, d).sprozi('click');
      assert.deepEqual(kandZ(run, 'k-izbris'), [`${ci}:${d}`], 'kandidat označen (rdeče prečrtan)');
      assert.ok(kandZ(run, 'poud').includes(`${ci}:${d}`), 'označen kandidat ostane poudarjen');
      assert.ok(!ima(c[ci], 'k-izbris'), 'celica ostane bela');
      assert.deepEqual(presekZ(run, 'izbrana'), [ci], 'izbira ostane');
      gumbStevke(dom, d).sprozi('click');
      assert.deepEqual(kandZ(run, 'k-izbris'), [], '↺ odstrani oznako');
      tipka(dom, { key: 'Escape', code: 'Escape' });
      // Izidi: prazno, nepopolno (ne štejeta), napačno (šteje, pobriše oznake), pravilno.
      gumb(dom, 'Preveri').sprozi('click');
      assert.equal(fb(dom).innerHTML, 'Izberi celico in izbriši kandidata, ki zaradi vzorca odpade.');
      if (izbris.length >= 2) {
        oznaciPresek(dom, run, izbris.slice(1));
        gumb(dom, 'Preveri').sprozi('click');
        assert.equal(fb(dom).innerHTML, '<b>Še ne.</b> Označeni kandidati res odpadejo, manjka pa še 1 izbris.');
        assert.equal(rezultat(dom), '0/0', 'nepopolno se ne šteje');
        assert.deepEqual(kandZ(run, 'k-izbris'), kljuci(izbris.slice(1)), 'oznake ostanejo');
      }
      oznaciPresek(dom, run, [[ex.solutionCells[0], ex.digit]]);
      gumb(dom, 'Preveri').sprozi('click');
      assert.equal(fb(dom).innerHTML, `<b>Ni pravilno.</b> Med označenimi je kandidat, ki zaradi vzorca ne odpade. ${run(`TEHNIKE_OPISI['${tehnika}'].posledica`)}`);
      assert.equal(rezultat(dom), '0/1', 'napačen odgovor šteje');
      assert.deepEqual(kandZ(run, 'k-izbris'), [], 'vse oznake pobrisane');
      oznaciPresek(dom, run, izbris);
      gumb(dom, 'Preveri').sprozi('click');
      assert.equal(rezultat(dom), '1/2');
      assert.equal(run('vajaResena'), true);
      // Končno stanje = stanje po pravilnem odgovoru pred nalogo (tests/pocasni/trening-presek.test.js).
      assert.equal(brezLegende(fb(dom).innerHTML), `<b>Pravilno!</b> ${ex.solutionMessage}`);
      assert.deepEqual(legenda(fb(dom)), ['celice vzorca', 'izbrisani kandidati']);
      assert.deepEqual(presekZ(run, 'k-vzorec'), urejeno(ex.solutionCells));
      assert.deepEqual(presekZ(run, 'k-izbris'), urejeno(new Set(izbris.map(([x]) => x))), 'celice izbrisa rožnate');
      assert.deepEqual(kandZ(run, 'k-izbris'), kljuci(izbris), 'izbris prečrtan');
      assert.equal(poudarjenih(run), 0);
      assert.deepEqual(presekZ(run, 'izbrana'), []);
      assert.ok(faza(dom).hidden, 'niz skrit');
      assert.equal(run('izbrisVaje'), null);
      assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
      assert.deepEqual(JSON.parse(run('JSON.stringify(selected)')), ex.solutionCells, 'izbira 1. faze kot prej');
      c[ex.vidne.find(i => !ex.grid[i])].sprozi('click');
      assert.deepEqual(presekZ(run, 'izbrana'), [], 'po pravilnem odgovoru se nič ne izbere');
    });
  }

  test(`${tehnika}: Namig in Rešitev v 2. fazi – napačna oznaka z obročem, legenda, osvežitev, zaprtje`, () => {
    const { dom, run } = zacni(tehnika);
    const ex = vajaPreseka(run), izbris = izbrisPreseka(ex, tehnika);
    prvaFazaPreseka(dom, run, ex);
    gumb(dom, 'Namig').sprozi('click');
    assert.equal(odprtiOkvirji(dom)[0].innerHTML, `Izbrisati je treba ${izbris.length} ${KANDIDAT(izbris.length)} – števka ${ex.digit}.`);
    assert.equal(pomoc(dom), ' · s pomočjo: 1');
    gumb(dom, 'Skrij namig').sprozi('click');
    const nap = [ex.solutionCells[0], ex.digit];
    oznaciPresek(dom, run, [izbris[0], nap]);
    gumb(dom, 'Rešitev').sprozi('click');
    const okvir = odprtiOkvirji(dom)[0];
    assert.ok(okvir.innerHTML.startsWith(ex.solutionMessage), 'sporočilo koraka');
    assert.deepEqual(kandZ(run, 'k-izbris'), kljuci(izbris), 'vsi kandidati za izbris prečrtani');
    assert.deepEqual(kandZ(run, 'k-napacna'), kljuci([nap]), 'napačna oznaka');
    assert.deepEqual(presekZ(run, 'k-vzorec'), urejeno(ex.solutionCells));
    assert.deepEqual(presekZ(run, 'k-izbris'), urejeno(new Set(izbris.map(([x]) => x))), 'celice izbrisa rožnate');
    assert.deepEqual(legenda(okvir), ['celice vzorca', 'celica izbrisa', 'kandidat za izbris', 'napačno označen kandidat']);
    assert.equal(poudarjenih(run), 0, 'ob Rešitvi brez poudarka (kot prej)');
    // Osvežitev ob oznaki: napačno oznako odstrani (↺).
    tipka(dom, { key: 'Escape', code: 'Escape' });
    celicePreseka(run)[nap[0]].sprozi('click');
    gumbStevke(dom, nap[1]).sprozi('click');
    assert.deepEqual(kandZ(run, 'k-napacna'), []);
    assert.deepEqual(legenda(odprtiOkvirji(dom)[0]), ['celice vzorca', 'celica izbrisa', 'kandidat za izbris']);
    assert.deepEqual(presekZ(run, 'izbrana'), [nap[0]], 'izbira je ob Rešitvi vidna');
    gumb(dom, 'Skrij rešitev').sprozi('click');
    assert.deepEqual(kandZ(run, 'k-izbris'), kljuci([izbris[0]]), 'po zaprtju samo oznaka');
    assert.deepEqual(presekZ(run, 'k-izbris'), [], 'celice izbrisa spet bele');
    assert.deepEqual(presekZ(run, 'k-vzorec'), urejeno(ex.solutionCells), 'vzorec ostane jantaren');
    assert.deepEqual(kandZ(run, 'poud'), poudarjeniKand(ex), 'po zaprtju spet poudarek');
    gumb(dom, 'Rešitev').sprozi('click');
    oznaciPresek(dom, run, izbris.slice(1));
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(fb(dom).innerHTML, /^<b>Pravilno!<\/b>/);
    assert.match(fb(dom).textContent, /s pomočjo – ne šteje/);
    assert.equal(odprtiOkvirji(dom).length, 0, 'pravilen odgovor Rešitev zapre');
    assert.equal(rezultat(dom), '0/0');
  });
}

test('1 · Izločitev izven bloka: tipkovnica v 2. fazi – Shift+števka (QWERTZ), Escape, števka brez Shift nič', () => {
  const { dom, run } = zacni('pointing');
  const ex = vajaPreseka(run), [ci, d] = izbrisPreseka(ex, 'pointing')[0];
  const SHIFT = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
  prvaFazaPreseka(dom, run, ex);
  celicePreseka(run)[ci].sprozi('click');
  tipka(dom, { key: String(d), code: `Digit${d}` });
  assert.deepEqual(kandZ(run, 'k-izbris'), [], 'števka brez Shift ne naredi nič');
  tipka(dom, { key: SHIFT[d], code: `Digit${d}`, shiftKey: true });
  assert.deepEqual(kandZ(run, 'k-izbris'), [`${ci}:${d}`], 'Shift+števka (QWERTZ) označi');
  tipka(dom, { key: SHIFT[d], code: `Digit${d}`, shiftKey: true });
  assert.deepEqual(kandZ(run, 'k-izbris'), [], 'drugi Shift+števka oznako odstrani');
  tipka(dom, { key: 'Escape', code: 'Escape' });
  assert.deepEqual(presekZ(run, 'izbrana'), [], 'Escape počisti izbiro');
});

test('štetje kroga: 2 · Izločitev v bloku brez napak 9 / 9 (obe fazi, vaji 1 in 2 po shemi)', () => {
  const { dom, run } = zacni('box-line', { n: 0 });
  for (let i = 0; i < 9; i++) {
    odgovoriPravilno(dom, run);
    assert.match(fb(dom).innerHTML, /^<b>Pravilno!/, `vaja ${i + 1}`);
    gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').sprozi('click');
  }
  assert.equal(rezultat(dom), '9/9');
});

test('besedila 2. faze 1 in 2: navodila; Pomoč treninga omeni 2. fazo in Shift+števka v »Spoznaj«', () => {
  const { run } = zacni('pointing');
  for (const t of PRESEK) {
    assert.match(run(`TEHNIKE_OPISI[${JSON.stringify(t)}].navodilo`), /, nato izbriši kandidate, ki zaradi (vzorca|njega|nje) odpadejo\.$/, `${t}: navodilo pove 2. fazo`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const razdelek = ime => (html.split(`<h3 class="navodila-razdelek">${ime}</h3>`)[1] || '').split('<h3')[0];
  const spoznaj = razdelek('Spoznaj in Vadi v uganki');
  assert.match(spoznaj, /dve fazi/, 'dve fazi');
  assert.match(spoznaj, /<b>Izbriši kandidata<\/b>/, 'niz »Izbriši kandidata«');
  assert.match(spoznaj, /pobriše vse oznake/, 'napačen odgovor');
  assert.match(razdelek('Tipkovnica'), /»Spoznaj«[^<]*<kbd>Shift<\/kbd>\+števka/, 'Shift+števka v »Spoznaj«');
});

// --- Popravek B (ročni pregled 2026-10-10): kljukica »več celic« v nizu »Izbriši kandidata« ---
// Vklopljena: klik celico doda ali odstrani (kot prej). Izklopljena: klik izbere samo to celico, klik izbrane jo
// odizbere. Privzeto vklopljena pri tehnikah, kjer se briše ena števka (1, 2, 7–11, 13), izklopljena pri 3–6 in 12.
// Igralčeva sprememba velja do konca kroga; izklop počisti izbiro (kot v »Vadi v uganki«).
const VSE_1_13 = ['pointing', 'box-line', 'naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish',
  'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain'];
const VEC_CELIC_PRIVZETO = new Set(['pointing', 'box-line', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'xy-chain']);
const kljukicaVec = dom => vsi(faza(dom)).find(e => e.tagName === 'INPUT');
const prvaFazaPravilno = (dom, run) => { run(`{ const ex = vajaNaZaslonu, M = MODES[mode];
  selected = M.isXWing || M.isSwordfish ? (ex.rect || ex.sfCells).map(([r, c]) => r * 9 + c)
    : M.isPointing || M.isBoxLine ? [...ex.solutionCells]
    : M.isXYWing || M.isUR || M.isTurbot || M.isWWing || M.isXYChain ? ex.solutionCells.map(c => ex.slots.findIndex(s => s.idx === c))
    : [...ex.targetSlots]; }`); gumb(dom, 'Preveri').sprozi('click'); };

test('»več celic« v 2. fazi: kljukica v glavi niza, privzeto po tehniki (1, 2, 7–11, 13 vklopljena; 3–6, 12 izklopljena)', () => {
  for (const t of VSE_1_13) {
    const { dom, run } = zacni(t);
    prvaFazaPravilno(dom, run);
    const k = kljukicaVec(dom);
    assert.ok(k && k.type === 'checkbox', `${t}: kljukica v nizu`);
    assert.match(vsi(faza(dom)).find(e => e.tagName === 'LABEL').textContent, /več celic/, `${t}: napis`);
    assert.equal(k.checked, VEC_CELIC_PRIVZETO.has(t), `${t}: privzeto`);
  }
});

test('3 · Očitni par: izklopljena »več celic« – klik izbere samo to celico, klik izbrane jo odizbere; vklop – doda', () => {
  const { dom, run } = zacni('naked-pair');
  const ex = vaja(run), izbris = izbrisVzorca(ex, 'naked-pair', ex.targetSlots);
  prvaFaza(dom, ex.targetSlots);
  const [a, b] = [...new Set(izbris.map(([si]) => si))];
  celica(dom, a).sprozi('click');
  celica(dom, b).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [b], 'izbrana samo zadnja celica');
  celica(dom, b).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [], 'klik izbrane jo odizbere');
  // Oznaka: izbira ostane.
  celica(dom, a).sprozi('click');
  gumbStevke(dom, izbris.find(([si]) => si === a)[1]).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [a], 'izbira po oznaki ostane');
  // Vklop: klik doda, ponoven klik odstrani; izklop počisti izbiro.
  const k = kljukicaVec(dom);
  k.checked = true; k.sprozi('change');
  celica(dom, b).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), urejeno([a, b]), 'vklopljena: klik doda');
  celica(dom, a).sprozi('click');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [b], 'vklopljena: klik izbrane jo odstrani');
  celica(dom, a).sprozi('click');
  k.checked = false; k.sprozi('change');
  assert.deepEqual(celiceZ(dom, 'izbrana-izbris'), [], 'izklop počisti izbiro');
});

test('»več celic«: igralčeva sprememba velja do konca kroga, nov krog privzeto', () => {
  const { dom, run } = zacni('naked-pair');
  prvaFazaPravilno(dom, run);
  const k = kljukicaVec(dom);
  k.checked = true; k.sprozi('change');
  gumb(dom, 'Naslednja vaja →') && run('exNum++; renderExercise();');
  prvaFazaPravilno(dom, run);
  assert.equal(kljukicaVec(dom).checked, true, 'naslednja vaja kroga');
  run(`zacniKrog('naked-pair', 'spoznaj')`);
  prvaFazaPravilno(dom, run);
  assert.equal(kljukicaVec(dom).checked, false, 'nov krog: privzeto');
  run(`zacniKrog('pointing', 'spoznaj')`);
  prvaFazaPravilno(dom, run);
  assert.equal(kljukicaVec(dom).checked, true, 'nov krog druge tehnike: njeno privzeto');
});

test('Pomoč treninga: kljukica »več celic« v »Spoznaj«', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  const spoznaj = (html.split('<h3 class="navodila-razdelek">Spoznaj in Vadi v uganki</h3>')[1] || '').split('<h3')[0];
  assert.match(spoznaj, /<b>več celic<\/b>/, 'kljukica omenjena');
  assert.match(spoznaj, /izklopljena/, 'izklopljena – samo ena celica');
});
