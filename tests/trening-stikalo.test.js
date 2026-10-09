'use strict';
// »Namig« in »Rešitev« kot stikali (docs/trening-ucenje-nacrt.md, del B, korak 1) v nadomestnem DOM-u:
//   - »Spoznaj«: klik pokaže, drugi klik skrije (okvir in oznake na mreži); napis »Namig« /
//     »Rešitev«, odprt »Skrij namig« / »Skrij rešitev« in aria-pressed (O10); odprt je kvečjemu
//     eden (O11); pomoč se šteje ob prvem odprtju, nato nič več;
//   - izbira ob odprti Rešitvi (O12, B): pri 5 drug veljaven vzorec, izbran s kliki, zamenja
//     prikazani vzorec; pri 1 in 2 je izbira vidna skupaj z oznakami koraka;
//   - »Preveri« (O13): napačen odgovor Rešitev pusti odprto (oznake sledijo prazni izbiri), pravilen
//     jo zapre – tudi 2. faza pri 4 (1. faza jo pusti); pri 13 po pravilnem odgovoru ostanejo
//     zaporedne številke verige;
//   - nova vaja, »Nazaj na izbiro« in nov krog: zaprto; E1: odpri, zapri, pravilen odgovor zapre;
//   - »Vadi v uganki« (O14): drugi klik na gumb okvir zapre, napis in aria-pressed kot v »Spoznaj«;
//   - Pomoč treninga: brez »(drži)«.
// Na kodi pred korakom 1 pade (gumba sta »Namig (drži)« in »Rešitev (drži)«, klik ne naredi nič).
// Pravi dotik in postavitev preverja tools/preveri-stikalo-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { spremljajVajo, odgovoriPravilno, dokoncajDrugoFazo } = require('./odgovor-spoznaj.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

// Vaja »Spoznaj« tehnike; pogoj (koda v kontekstu, ex => bool) - generator ponavlja, dokler ga vaja
// ne izpolni (zadnja = vaja na zaslonu). Pri 3-6 in 13 vaja 7 kroga (n: 6): vaji 1 in 2 sta od dela A načrta
// docs/trening-ucenje-nacrt.md po shemi (mimo MODES[].gen), vaja 7 je iste vrste kot vaja 1 (n % 3 in n % 2 sta 0).
function zacni(tehnika, { n = 0, seme = 7, pogoj = 'ex => true' } = {}) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen, p = ${pogoj};
    MODES[${JSON.stringify(tehnika)}].gen = n => { for (let i = 0; ; i++) { const ex = g(n); if (p(ex) || i > 2000) return (zadnja = ex); } }; }`);
  spremljajVajo(run);
  run(`mode = ${JSON.stringify(tehnika)}; nacin = 'spoznaj'; exNum = ${n}; scoreRight = 0; scoreTotal = 0; sPomocjo = 0; updateScore(); renderExercise();`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const vse = dom => vsi(dom.el('exerciseArea'));
const gumb = (dom, napis) => {
  const g = vse(dom).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
  assert.ok(g, `gumb "${napis}"`);
  return g;
};
// Gumba pomoči (vrstica .peek-row): [napis, aria-pressed].
const gumbaPomoci = dom => vse(dom).find(e => e.className === 'peek-row').children.map(b => [b.textContent, b.getAttribute('aria-pressed')]);
const ZAPRTO = [['Namig', 'false'], ['Rešitev', 'false']];
const odprtiOkvirji = dom => vse(dom).filter(e => /(^|\s)peek-overlay(\s|$)/.test(e.className) && /(^|\s)visible(\s|$)/.test(e.className));
const fb = dom => vse(dom).find(e => /^fb\b/.test(e.className));
const pomoc = dom => dom.el('scorePomoc').textContent;
const rezultat = dom => `${dom.el('scoreRight').textContent}/${dom.el('scoreTotal').textContent}`;
// Celice z razredom (indeksi v ex.slots - data-si, pri 7 in 8 data-idx).
const sRazredom = (dom, razred) => vse(dom).filter(e => e.classList.contains(razred)).map(e => +(e.dataset.idx ?? e.dataset.si)).sort((a, b) => a - b);
const kljuc = a => [...a].sort((x, y) => x - y).join(',');

test('3 · Očitni par: klik pokaže, drugi klik skrije; napis in aria-pressed; kvečjemu eden odprt', () => {
  const { dom, run } = zacni('naked-pair', { n: 6 });
  const vzorec = run('JSON.stringify(zadnja.targetSlots)');
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  gumb(dom, 'Rešitev').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  assert.equal(odprtiOkvirji(dom).length, 1);
  assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(JSON.parse(vzorec)), 'oznake vzorca na mreži');
  assert.ok(vse(dom).some(e => e.className === 'legenda-vaje'), 'legenda pod rešitvijo');
  gumb(dom, 'Skrij rešitev').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  assert.deepEqual(sRazredom(dom, 'peek-hl'), [], 'po drugem kliku ni oznak');
  // Namig, nato Rešitev: odprt je kvečjemu eden - drugi gumb zamenja vsebino.
  gumb(dom, 'Namig').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), [['Skrij namig', 'true'], ['Rešitev', 'false']]);
  assert.equal(odprtiOkvirji(dom).length, 1);
  assert.deepEqual(sRazredom(dom, 'peek-hl'), [], 'namig ne pokaže oznak');
  gumb(dom, 'Rešitev').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  assert.equal(odprtiOkvirji(dom).length, 1);
  assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(JSON.parse(vzorec)));
  gumb(dom, 'Namig').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), [['Skrij namig', 'true'], ['Rešitev', 'false']]);
  assert.deepEqual(sRazredom(dom, 'peek-hl'), [], 'oznake rešitve izginejo, ko se odpre namig');
  gumb(dom, 'Skrij namig').sprozi('click');
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
});

test('pomoč se šteje ob prvem odprtju, nato nič več; že šteti poskus se odšteje', () => {
  const { dom, run } = zacni('naked-pair', { n: 6 });
  run(`{ const s = zadnja.slots, p = s.map((x, i) => i).filter(i => s[i].c); let par = null;
    for (const a of p) for (const b of p) if (a < b && !par && new Set([...s[a].c, ...s[b].c]).size > 2) par = [a, b];
    selected = par; }`);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(rezultat(dom), '0/1');
  gumb(dom, 'Namig').sprozi('click');
  assert.equal(rezultat(dom), '0/0');
  assert.equal(pomoc(dom), ' · s pomočjo: 1');
  gumb(dom, 'Skrij namig').sprozi('click');
  gumb(dom, 'Rešitev').sprozi('click');
  gumb(dom, 'Skrij rešitev').sprozi('click');
  gumb(dom, 'Rešitev').sprozi('click');
  assert.equal(pomoc(dom), ' · s pomočjo: 1', 'zapiranje in ponovno odpiranje ne spremenita ničesar');
});

test('5 · Očitna trojica: izbira ob odprti Rešitvi - drug veljaven vzorec zamenja prikazani vzorec', () => {
  // Vaja z drugo veljavno trojico (neodvisno naštevanje kot v tests/trening-resitev.test.js).
  const DRUGA = `ex => { const p = ex.slots.map((s, i) => s.c ? i : -1).filter(i => i >= 0), t = [...ex.targetSlots].sort((a, b) => a - b).join(',');
    for (let a = 0; a < p.length; a++) for (let b = a + 1; b < p.length; b++) for (let c = b + 1; c < p.length; c++)
      if (new Set([p[a], p[b], p[c]].flatMap(i => ex.slots[i].c)).size === 3 && [p[a], p[b], p[c]].join(',') !== t) return [p[a], p[b], p[c]];
    return null; }`;
  const { dom, run } = zacni('naked-triple', { n: 6, pogoj: `ex => !!(${DRUGA})(ex)` });
  const druga = JSON.parse(run(`JSON.stringify((${DRUGA})(zadnja))`));
  assert.ok(druga, 'vaja z drugo trojico');
  gumb(dom, 'Rešitev').sprozi('click');
  assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(JSON.parse(run('JSON.stringify(zadnja.targetSlots)'))), 'brez izbire vzorec generatorja');
  // Kliki celic druge trojice ob odprti Rešitvi: oznake sledijo izbiri.
  const celice = vse(dom).filter(e => e.classList.contains('gc') && e.dataset.si !== undefined);
  for (const si of druga) celice.find(e => +e.dataset.si === si).sprozi('click');
  assert.equal(kljuc(JSON.parse(run('JSON.stringify(selected)'))), kljuc(druga), 'izbira deluje ob odprti Rešitvi');
  assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(druga), 'prikazani vzorec je izbrana trojica');
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  assert.match(odprtiOkvirji(dom)[0].innerHTML, /^\{\d, \d, \d\} v /, 'besedilo kot pri »Preveri« za drug vzorec');
  assert.equal(odprtiOkvirji(dom).length, 1, 'en sam okvir');
  assert.equal(vse(dom).filter(e => e.className === 'legenda-vaje').length, 1, 'ena legenda');
});

// Vaja 7 (n = 6) - vaji 1 in 2 sta po shemi (docs/trening-ucenje-nacrt.md, del A), mimo MODES[].gen.
for (const tehnika of ['pointing', 'box-line']) {
  test(`${tehnika}: izbira je ob odprti Rešitvi vidna skupaj z oznakami koraka`, () => {
    const { dom, run } = zacni(tehnika, { n: 6 });
    const celica = run('zadnja.vidne.find(c => !zadnja.grid[c] && !zadnja.solutionCells.includes(c))');
    const mreza = i => run(`presek.mreza.celice[${i}]`);
    gumb(dom, 'Rešitev').sprozi('click');
    const vzorec = JSON.parse(run('JSON.stringify(zadnja.solutionCells)'));
    for (const c of vzorec) assert.ok(mreza(c).classList.contains('k-vzorec'), `vzorec ${c}`);
    mreza(celica).sprozi('click');
    assert.deepEqual(JSON.parse(run('JSON.stringify(selected)')), [celica]);
    assert.ok(mreza(celica).classList.contains('izbrana'), 'izbrana celica je vidna');
    for (const c of vzorec) assert.ok(mreza(c).classList.contains('k-vzorec'), `oznake koraka ostanejo (${c})`);
    assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
    // Napačen odgovor: Rešitev ostane, izbira se izprazni; pravilen jo zapre, oznake odgovora ostanejo.
    run(`selected = zadnja.vidne.filter(c => !zadnja.grid[c] && !zadnja.solutionCells.includes(c)).slice(0, 2)`);
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(fb(dom).innerHTML, /To še ni pravi vzorec/);
    assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']], 'napačen odgovor Rešitev pusti');
    assert.equal(odprtiOkvirji(dom).length, 1);
    assert.ok(!mreza(celica).classList.contains('izbrana'), 'izbira je prazna');
    for (const c of vzorec) assert.ok(mreza(c).classList.contains('k-vzorec'));
    odgovoriPravilno(dom, run);
    assert.match(fb(dom).innerHTML, /Pravilno!/);
    assert.deepEqual(gumbaPomoci(dom), ZAPRTO, 'pravilen odgovor Rešitev zapre');
    assert.equal(odprtiOkvirji(dom).length, 0);
    for (const c of vzorec) assert.ok(mreza(c).classList.contains('k-vzorec'), 'oznake odgovora ostanejo');
    assert.ok(vzorec.every(c => !mreza(c).classList.contains('izbrana')), 'po pravilnem odgovoru izbire ni');
  });
}

test('3 · Očitni par: napačen odgovor Rešitev pusti odprto, pravilen jo zapre', () => {
  const { dom, run } = zacni('naked-pair', { n: 6 });
  gumb(dom, 'Rešitev').sprozi('click');
  run(`{ const s = zadnja.slots, p = s.map((x, i) => i).filter(i => s[i].c); let par = null;
    for (const a of p) for (const b of p) if (a < b && !par && new Set([...s[a].c, ...s[b].c]).size > 2) par = [a, b];
    selected = par; }`);
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /^<b>Ni par\.<\/b>/);
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  assert.equal(odprtiOkvirji(dom).length, 1);
  assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(JSON.parse(run('JSON.stringify(zadnja.targetSlots)'))), 'oznake za prazno izbiro');
  odgovoriPravilno(dom, run);
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  assert.deepEqual(sRazredom(dom, 'peek-hl'), []);
  assert.equal(kljuc(sRazredom(dom, 'correct')), kljuc(JSON.parse(run('JSON.stringify(zadnja.targetSlots)'))), 'oznake odgovora');
  // Ogled po pravilnem odgovoru: odpre in zapre, rezultat ostane.
  gumb(dom, 'Rešitev').sprozi('click');
  assert.equal(odprtiOkvirji(dom).length, 1);
  assert.equal(rezultat(dom), '0/0');
  assert.equal(pomoc(dom), ' · s pomočjo: 1');
});

test('4 · Skriti par: pravilna 1. faza Rešitev pusti, pravilna 2. faza jo zapre', () => {
  const { dom, run } = zacni('hidden-pair', { n: 6 });
  gumb(dom, 'Rešitev').sprozi('click');
  run('selected = [...zadnja.targetSlots]');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Celici sta pravilni!/);
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']], 'vaja še ni rešena');
  dokoncajDrugoFazo(dom, run);
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
});

test('13 · XY-veriga: pravilen odgovor ob odprti Rešitvi zapre okvir, zaporedne številke ostanejo', () => {
  const { dom, run } = zacni('xy-chain', { n: 6 });
  const n = run('zadnja.solutionCells.length');
  gumb(dom, 'Rešitev').sprozi('click');
  assert.equal(vse(dom).filter(e => e.classList.contains('veriga-st')).length, n, 'številke ob Rešitvi');
  odgovoriPravilno(dom, run);
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  const st = vse(dom).filter(e => e.classList.contains('veriga-st'));
  assert.equal(st.length, n, 'številke verige po pravilnem odgovoru ostanejo');
  assert.ok(st.every(e => !e.classList.contains('peek-veriga')), 'številke so trajne');
  assert.deepEqual(st.map(e => e.textContent).sort(), Array.from({ length: n }, (_, i) => String(i + 1)).sort());
});

test('nova vaja, »Nazaj na izbiro« in nov krog: Namig in Rešitev zaprta', () => {
  const { dom, run } = zacni('naked-pair', { n: 6 });
  gumb(dom, 'Rešitev').sprozi('click');
  odgovoriPravilno(dom, run);
  gumb(dom, 'Namig').sprozi('click');
  gumb(dom, 'Naslednja vaja →').sprozi('click');
  assert.equal(run('exNum'), 7);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  gumb(dom, 'Rešitev').sprozi('click');
  dom.el('backBtn').sprozi('click');
  run('zacniKrog("naked-pair", "spoznaj")');
  assert.equal(run('exNum'), 0);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  assert.deepEqual(sRazredom(dom, 'peek-hl'), []);
});

test('E1: Rešitev s klikom pokaže korak, drugi klik ga skrije; napačen odgovor jo pusti, pravilen zapre', () => {
  const { dom, run } = zacni('naked-single');
  const celice = () => JSON.parse(run('JSON.stringify(enojcek.plosca.mreza.celice.map(e => e.className))'));
  const [c, d] = JSON.parse(run('JSON.stringify(zadnja.korak.assign[0])'));
  gumb(dom, 'Rešitev').sprozi('click');
  assert.match(celice()[c], /k-vpis/);
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  gumb(dom, 'Skrij rešitev').sprozi('click');
  assert.ok(celice().every(x => !/k-vpis/.test(x)), 'po drugem kliku ni oznak');
  gumb(dom, 'Rešitev').sprozi('click');
  // Napačna števka v celici koraka: Rešitev ostane.
  if (run('enojcek.plosca.enaIzbrana()') !== c) run(`enojcek.plosca.mreza.celice[${c}]`).sprozi('click');
  run(`pickedDigits = [${d === 9 ? 8 : d + 1}]`);
  gumb(dom, 'Preveri').sprozi('click');
  assert.doesNotMatch(fb(dom).innerHTML, /Pravilno!/);
  assert.deepEqual(gumbaPomoci(dom), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  assert.match(celice()[c], /k-vpis/);
  if (run('enojcek.plosca.enaIzbrana()') !== c) run(`enojcek.plosca.mreza.celice[${c}]`).sprozi('click');
  run(`pickedDigits = [${d}]`);
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.deepEqual(gumbaPomoci(dom), ZAPRTO);
  assert.equal(odprtiOkvirji(dom).length, 0);
  assert.match(celice()[c], /k-vpis/, 'celica odgovora ostane zelena');
});

test('»Vadi v uganki«: drugi klik na gumb okvir zapre; napis in aria-pressed', () => {
  const dom = makeDom();
  const vrsta = [];
  dom.globals.setTimeout = f => { vrsta.push(f); return vrsta.length; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(1));
  run('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })()');
  run('zacniKrog("hidden-pair", "uganka")');
  for (let i = 0; i < 10000 && vrsta.length; i++) vrsta.shift()();
  const okvir = () => vse(dom).find(e => e.className === 'vadi-pomoc');
  const vrstica = () => vse(dom).find(e => e.className === 'peek-row').children.map(b => [b.textContent, b.getAttribute('aria-pressed')]);
  assert.deepEqual(vrstica(), ZAPRTO);
  gumb(dom, 'Namig').sprozi('click');
  assert.equal(okvir().hidden, false);
  assert.deepEqual(vrstica(), [['Skrij namig', 'true'], ['Rešitev', 'false']]);
  gumb(dom, 'Skrij namig').sprozi('click');
  assert.equal(okvir().hidden, true, 'drugi klik zapre');
  assert.deepEqual(vrstica(), ZAPRTO);
  gumb(dom, 'Rešitev').sprozi('click');
  assert.deepEqual(vrstica(), [['Namig', 'false'], ['Skrij rešitev', 'true']]);
  gumb(dom, 'Namig').sprozi('click');
  assert.deepEqual(vrstica(), [['Skrij namig', 'true'], ['Rešitev', 'false']], 'drugi gumb zamenja vsebino');
  assert.equal(okvir().hidden, false);
  // »Skrij« v okvirju ostane in zapre; napisa se vrneta.
  gumb(dom, 'Skrij').sprozi('click');
  assert.equal(okvir().hidden, true);
  assert.deepEqual(vrstica(), ZAPRTO);
  gumb(dom, 'Rešitev').sprozi('click');
  gumb(dom, 'Skrij rešitev').sprozi('click');
  assert.equal(okvir().hidden, true);
  assert.equal(dom.el('scorePomoc').textContent, ' · s pomočjo: 1');
});

test('Pomoč treninga: Namig in Rešitev brez »(drži)«', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'trening', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /drži/);
  assert.match(html, /<b>Namig<\/b> in <b>Rešitev<\/b> odpreš s klikom/);
});
