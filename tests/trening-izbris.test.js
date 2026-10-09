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
// Oznake s kliki: po števkah - Escape, celice s to števko, gumb števke.
function oznaci(dom, pari) {
  for (const d of [...new Set(pari.map(([, x]) => x))]) {
    tipka(dom, { key: 'Escape', code: 'Escape' });
    for (const [si] of pari.filter(([, x]) => x === d)) celica(dom, si).sprozi('click');
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
    // Presek: druga celica brez skupnega kandidata ali s skupnim.
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
