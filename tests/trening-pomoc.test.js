'use strict';
// Pomoč v treningu (trening/trening.js, način "Spoznaj") v nadomestnem DOM-u (dom-stub.js):
//   - pomoč = ogled namiga ALI rešitve (vsak pritisk, tudi kratek);
//   - vaja s pomočjo se ne šteje nikamor - ne med pravilne ne med napačne (že šteti
//     napačni poskusi te vaje se ob ogledu odštejejo);
//   - oznaka "s pomočjo" pri sporočilu po "Preveri", v vrstici rezultata in v povzetku;
//   - ogled po pravilnem odgovoru ne spremeni ničesar;
//   - "Naslednja vaja" zastavico ponastavi.
// Pokrita sta oba načina preverjanja: izbira celic (Očitna para ter 1 in 2 na delni
// mreži, checkPhase1) in vpis (Očitni in Skriti enojček, checkSingle - na vaji 1 in 4,
// torej z označeno celico ali števko in z označeno enoto).
// Na koncu je še postopnost enojčkov v krogu: oznaka, omejena izbira in zatemnjene
// celice (vaje 1-3, 4-6), cela mreža (vaje 7-9).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { odpriPomoc, zapriPomoc, medPomocjo } = require('./pomoc-stikali.js');

// Vrstni red kot <script> v trening/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

// Math.random s stalnim semenom: vaja (in z njo npr. polna vrstica 1) je ob vsakem zagonu ista.
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

// Kontekst z odprto prvo vajo tehnike; generator vaje si zapomni zadnjo vajo (`zadnja`),
// da test pozna pravi odgovor.
function zacni(tehnika, n = 0, shramba) {
  const dom = makeDom(shramba);
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(1));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen; MODES[${JSON.stringify(tehnika)}].gen = n => (zadnja = g(n)); }`);
  run(`mode = ${JSON.stringify(tehnika)}; exNum = ${n}; scoreRight = 0; scoreTotal = 0; sPomocjo = 0; updateScore(); renderExercise();`);
  return { dom, run };
}

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const gumb = (dom, napis) => {
  const g = vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
  assert.ok(g, `gumb "${napis}"`);
  return g;
};
const fb = dom => vsi(dom.el('exerciseArea')).find(e => /^fb\b/.test(e.className));
const imaOznako = dom => (fb(dom).children || []).some(c => c.className === 's-pomocjo');
const rezultat = dom => `${dom.el('scoreRight').textContent}/${dom.el('scoreTotal').textContent}`;
const pomoc = dom => dom.el('scorePomoc').textContent;

// Odgovori za Očitno paro: pravi par iz vaje ali dve celici s kandidati, ki para ne tvorita.
function pravilnoPar(dom, run) {
  run('selected = [...zadnja.targetSlots]');
  gumb(dom, 'Preveri').sprozi('click');
}
function napacnoPar(dom, run) {
  run(`{
    const s = zadnja.slots, prosti = s.map((x, i) => i).filter(i => s[i].c);
    let par = null;
    for (const a of prosti) for (const b of prosti)
      if (a < b && !par && new Set([...s[a].c, ...s[b].c]).size > 2) par = [a, b];
    selected = par;
  }`);
  gumb(dom, 'Preveri').sprozi('click');
}
// Odgovori za enojčka: korak vaje ali vpis, ki ga preveriEnojcek() zavrne - na mestu, ki
// ga oznaka postopnosti dovoli (označena celica, števka, enota). Celica se izbere s
// klikom na mrežo plošče (vnaprej izbrana je že izbrana), števka neposredno.
function izberiCelico(run, c) {
  if (run('enojcek.plosca.enaIzbrana()') !== c) run(`enojcek.plosca.mreza.celice[${c}]`).sprozi('click');
  assert.equal(run('enojcek.plosca.enaIzbrana()'), c, `celica ${c} izbrana`);
}
function pravilnoEnojcek(dom, run) {
  izberiCelico(run, run('zadnja.korak.assign[0][0]'));
  run('pickedDigits = [zadnja.korak.assign[0][1]]');
  gumb(dom, 'Preveri').sprozi('click');
}
function napacnoEnojcek(dom, run) {
  run(`var napacen; {
    let o = null;
    const z = zadnja.oznaka || {};
    const dovoljena = c => z.celica != null ? c === z.celica : !z.enota || z.enota.includes(c);
    for (let c = 0; c < 81 && !o; c++) if (!zadnja.boardGrid[c] && dovoljena(c))
      for (let d = 1; d <= 9 && !o; d++) if ((!z.stevka || d === z.stevka) && preveriEnojcek(zadnja, c, d).izid === 'narobe') o = [c, d];
    napacen = o;
  }`);
  izberiCelico(run, run('napacen[0]'));
  run('pickedDigits = [napacen[1]]');
  gumb(dom, 'Preveri').sprozi('click');
}

// Odgovori za 1 in 2 (delna mreža): celice koraka vaje ali dve prazni vidni celici zunaj njega.
function pravilnoPresek(dom, run) {
  run('selected = [...zadnja.solutionCells]');
  gumb(dom, 'Preveri').sprozi('click');
}
function napacnoPresek(dom, run) {
  run('selected = zadnja.vidne.filter(c => !zadnja.grid[c] && !zadnja.solutionCells.includes(c)).slice(0, 2)');
  gumb(dom, 'Preveri').sprozi('click');
}

// 1, 2 in očitni par: vaja 7 (n = 6) - vaji 1 in 2 sta po shemi (docs/trening-ucenje-nacrt.md, del A), mimo MODES[].gen.
const PRIMERI = [
  { tehnika: 'pointing', n: 6, pravilno: pravilnoPresek, napacno: napacnoPresek },
  { tehnika: 'box-line', n: 6, pravilno: pravilnoPresek, napacno: napacnoPresek },
  { tehnika: 'naked-pair', n: 6, pravilno: pravilnoPar, napacno: napacnoPar },
  { tehnika: 'naked-single', n: 0, pravilno: pravilnoEnojcek, napacno: napacnoEnojcek },
  { tehnika: 'naked-single', n: 3, pravilno: pravilnoEnojcek, napacno: napacnoEnojcek },
  { tehnika: 'hidden-single', n: 0, pravilno: pravilnoEnojcek, napacno: napacnoEnojcek },
  { tehnika: 'hidden-single', n: 3, pravilno: pravilnoEnojcek, napacno: napacnoEnojcek },
];

for (const { tehnika: t, n, pravilno, napacno } of PRIMERI) {
  const tehnika = `${t} (vaja ${n + 1})`, zacni_ = () => zacni(t, n);
  test(`${tehnika}: vaja brez pomoči se šteje (napačen in pravilen poskus)`, () => {
    const { dom, run } = zacni_();
    napacno(dom, run);
    assert.equal(rezultat(dom), '0/1');
    pravilno(dom, run);
    assert.equal(rezultat(dom), '1/2');
    assert.equal(pomoc(dom), '');
    assert.ok(!imaOznako(dom));
  });

  for (const [kaj, napis] of [['namig', 'Namig'], ['resitev', 'Rešitev']]) {
    test(`${tehnika}: ${napis} - vaja se ne šteje nikamor in dobi oznako "s pomočjo"`, () => {
      const { dom, run } = zacni_();
      napacno(dom, run);
      assert.equal(rezultat(dom), '0/1');
      // Kratek ogled: odpri in takoj zapri.
      odpriPomoc(dom, kaj);
      zapriPomoc(dom, kaj);
      assert.equal(rezultat(dom), '0/0', 'že šteti poskus te vaje se odšteje');
      assert.equal(pomoc(dom), ' · s pomočjo: 1');
      // Ponoven ogled iste vaje se ne šteje dvakrat.
      odpriPomoc(dom, 'namig');
      odpriPomoc(dom, 'resitev');
      assert.equal(pomoc(dom), ' · s pomočjo: 1');
      napacno(dom, run);
      assert.equal(rezultat(dom), '0/0', 'napačen poskus po pomoči se ne šteje');
      assert.ok(imaOznako(dom));
      pravilno(dom, run);
      assert.equal(rezultat(dom), '0/0', 'pravilen odgovor po pomoči se ne šteje');
      assert.match(fb(dom).innerHTML, /Pravilno!/);
      assert.ok(imaOznako(dom), 'sporočilo ima oznako "s pomočjo"');
    });
  }

  test(`${tehnika}: ogled po pravilnem odgovoru ne spremeni ničesar`, () => {
    const { dom, run } = zacni_();
    pravilno(dom, run);
    assert.equal(rezultat(dom), '1/1');
    odpriPomoc(dom, 'resitev');
    assert.equal(rezultat(dom), '1/1');
    assert.equal(pomoc(dom), '');
  });

  test(`${tehnika}: "Naslednja vaja" ponastavi pomoč, povzetek pove število vaj s pomočjo`, () => {
    const { dom, run } = zacni_();
    odpriPomoc(dom, 'namig');
    pravilno(dom, run);
    assert.equal(rezultat(dom), '0/0');
    gumb(dom, 'Naslednja vaja →').sprozi('click');
    assert.equal(run('exNum'), n + 1);
    pravilno(dom, run);
    assert.equal(rezultat(dom), '1/1', 'nova vaja brez pomoči se šteje');
    assert.ok(!imaOznako(dom));
    assert.equal(pomoc(dom), ' · s pomočjo: 1');
    run('exNum = MAX_EX; renderExercise()');
    const povzetek = dom.el('exerciseArea').children[0].innerHTML;
    assert.match(povzetek, /Rezultat: <b>1<\/b> \/ <b>1<\/b>/);
    assert.match(povzetek, /S pomočjo: <b>1<\/b> \(ne štejejo\)/);
  });
}

/* ---------- postopnost enojčkov v krogu ---------- */

// Celice mreže enojčka (plošča, indeks = celica 0-80) in gumbi števk.
const celice = dom => {
  const a = [];
  for (const e of vsi(dom.el('exerciseArea'))) if (/\bcelica\b/.test(e.className) && e.dataset.r !== undefined) a[+e.dataset.r * 9 + +e.dataset.c] = e;
  return a;
};
const stevke = dom => vsi(dom.el('exerciseArea')).filter(e => e.tagName === 'BUTTON' && e.dataset.d);
const ima = (el, r) => el.classList.contains(r);
// Vrednosti iz konteksta vm kot navadne tabele (deepEqual primerja tudi prototip).
const iz = (run, izraz) => JSON.parse(run(`JSON.stringify(${izraz})`));
const izb = run => iz(run, 'enojcek.plosca.izbrane'), stv = run => iz(run, 'pickedDigits'), enota = run => iz(run, 'zadnja.oznaka.enota');
const prazne = run => iz(run, '[...Array(81).keys()].filter(c => !zadnja.boardGrid[c])');

// Izbrati je mogoče natanko prazne celice v `dovoljene` (klik jih izbere, ponoven klik
// odizbere); druge prazne celice so zatemnjene (neaktivna) in se ne izberejo; polne
// celice niso zatemnjene in se ne izberejo.
function preveriIzbiro(dom, run, dovoljene) {
  const cs = celice(dom), pr = prazne(run), prej = izb(run);
  for (let c = 0; c < 81; c++) {
    const sme = dovoljene.includes(c) && pr.includes(c);
    if (pr.includes(c)) assert.equal(ima(cs[c], 'neaktivna'), !sme, `celica ${c} zatemnjena`);
    else assert.ok(!ima(cs[c], 'neaktivna'), 'polna celica ni zatemnjena');
    cs[c].sprozi('click');
    assert.deepEqual(izb(run), sme ? [c] : prej, `klik celice ${c}`);
    if (sme) cs[c].sprozi('click');
    assert.deepEqual(izb(run), prej);
  }
}

test('E1 vaja 1: celica je označena in izbrana, druge prazne celice so zatemnjene in se ne dajo izbrati', () => {
  const { dom, run } = zacni('naked-single', 0);
  const [c, d] = run('zadnja.korak.assign[0]');
  assert.equal(run('zadnja.oznaka.celica'), c);
  const cs = celice(dom);
  assert.deepEqual(izb(run), [c]);
  assert.ok(ima(cs[c], 'izbrana') && ima(cs[c], 'oznacena'));
  assert.ok(!ima(cs[c], 'neaktivna'));
  for (const x of prazne(run)) if (x !== c) assert.ok(ima(cs[x], 'neaktivna'), `celica ${x}`);
  // Klik druge celice ali označene celice izbire ne spremeni.
  for (const x of prazne(run)) cs[x].sprozi('click');
  assert.deepEqual(izb(run), [c]);
  assert.ok(stevke(dom).every(b => !b.disabled), 'števke so vse na voljo');
  // Napačna števka: celica ostane izbrana.
  stevke(dom).find(b => +b.dataset.d !== d).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Ni pravilno/);
  assert.deepEqual(izb(run), [c]);
  assert.ok(ima(celice(dom)[c], 'izbrana'));
  stevke(dom).find(b => +b.dataset.d === d).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.equal(rezultat(dom), '1/2');
});

test('E1 vaja 4: izbrati je mogoče samo prazne celice označene enote', () => {
  const { dom, run } = zacni('naked-single', 3);
  const u = enota(run), cs = celice(dom);
  assert.deepEqual(izb(run), []);
  for (const x of u) assert.ok(ima(cs[x], 'oznacena'));
  preveriIzbiro(dom, run, u);
  const zunaj = prazne(run).find(x => !u.includes(x)), notri = prazne(run).find(x => u.includes(x));
  cs[zunaj].sprozi('click');
  assert.deepEqual(izb(run), []);
  cs[notri].sprozi('click');
  assert.deepEqual(izb(run), [notri]);
});

test('E2 vaja 1: enota in števka sta označeni, števka je izbrana, drugi gumbi števk so onemogočeni', () => {
  const { dom, run } = zacni('hidden-single', 0);
  const [c, d] = run('zadnja.korak.assign[0]'), u = enota(run), cs = celice(dom);
  assert.equal(run('zadnja.oznaka.stevka'), d);
  assert.deepEqual(stv(run), [d]);
  for (const b of stevke(dom)) {
    assert.equal(b.disabled, +b.dataset.d !== d, `gumb ${b.dataset.d}`);
    assert.equal(ima(b, 'picked'), +b.dataset.d === d);
  }
  preveriIzbiro(dom, run, u);
  // Klik izbrane števke je ne odizbere.
  stevke(dom).find(b => +b.dataset.d === d).sprozi('click');
  assert.deepEqual(stv(run), [d]);
  // Napačna celica v enoti: števka ostane izbrana, celica ne.
  const druga = prazne(run).find(x => u.includes(x) && x !== c);
  cs[druga].sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Ni pravilno/);
  assert.deepEqual(stv(run), [d]);
  assert.deepEqual(izb(run), []);
  cs[c].sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.equal(rezultat(dom), '1/2');
});

test('E2 vaja 4: označena je samo enota, števke so vse na voljo', () => {
  const { dom, run } = zacni('hidden-single', 3);
  assert.equal(run('zadnja.oznaka.stevka'), null);
  assert.deepEqual(stv(run), []);
  assert.ok(stevke(dom).every(b => !b.disabled));
  preveriIzbiro(dom, run, enota(run));
});

for (const t of ['naked-single', 'hidden-single']) {
  test(`${t} vaja 7: cela mreža brez oznake, vse prazne celice so klikljive`, () => {
    const { dom, run } = zacni(t, 6);
    assert.equal(run('zadnja.oznaka'), null);
    assert.ok(celice(dom).every(e => !ima(e, 'oznacena')));
    preveriIzbiro(dom, run, prazne(run));
    assert.deepEqual(izb(run), []);
    assert.deepEqual(stv(run), []);
  });
}

test('navodilo nad mrežo in opis sledita stopnji', () => {
  for (const [t, n] of [['naked-single', 0], ['naked-single', 3], ['hidden-single', 0], ['hidden-single', 6]]) {
    const { dom, run } = zacni(t, n);
    const html = vsi(dom.el('exerciseArea'))[0].innerHTML;
    assert.ok(html.includes(`<h3>${run('zadnja.unitLabel')}</h3>`), html);
    // Pod nalogo povzetek tehnike in opis stopnje (vaje 1-6) ali navodilo (vaje 7-9) - faza 6.
    assert.ok(html.includes(`<p class="desc">${run('zadnja.desc ? TEHNIKE_OPISI[mode].povzetek + " " + zadnja.desc : MODES[mode].desc')}</p>`), html);
  }
});

/* ---------- pripomočki pri enojčkih (docs/pripomocki-e1-e2-nacrt.md) ---------- */

// Tipka na strani (poslušalec keydown v trening.js).
const tipka = (dom, e) => dom.globals.document.sprozi('keydown', e);
const poudari = (run, d) => run(`enojcek.plosca.gumbi.poudari[${d - 1}]`);

for (const t of ['naked-single', 'hidden-single']) {
  test(`${t}: mreža brez kandidatov, poudarek ene in več števk, seznami s stikali`, () => {
    const shramba = new Map();
    const { dom, run } = zacni(t, 6, shramba);
    const cs = celice(dom), grid = iz(run, 'zadnja.boardGrid');
    assert.equal(cs.filter(Boolean).length, 81);
    assert.ok(cs.every(c => !vsi(c).some(e => /\bkand\b/.test(e.className))), 'v mreži ni kandidatov');
    for (let c = 0; c < 81; c++) assert.equal(cs[c].textContent, grid[c] ? String(grid[c]) : '', `celica ${c}`);
    assert.ok(cs.every(c => !ima(c, 'soseda')), 'brez senčenja sosed');

    // Poudarek ene števke: celice z njo dobijo barvo 0; druga števka ga zamenja.
    const [a, b] = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => grid.includes(d));
    poudari(run, a).sprozi('click');
    for (let c = 0; c < 81; c++) assert.equal(ima(cs[c], 'poud-stevka'), grid[c] === a, `poudarek ${c}`);
    poudari(run, b).sprozi('click');
    assert.ok(cs.every((c, i) => ima(c, 'poud-stevka') === (grid[i] === b)));
    // "Več hkrati": obe števki, vsaka s svojo barvo; kljukica ostane za naslednjo vajo kroga.
    const [, vh, kV, kS, kB] = vsi(dom.el('exerciseArea')).filter(e => e.tagName === 'INPUT');
    vh.checked = true; vh.sprozi('change');
    poudari(run, a).sprozi('click');
    const iA = grid.indexOf(a), iB = grid.indexOf(b);
    assert.ok(ima(cs[iB], 'b0') && ima(cs[iA], 'b1'), 'barvi po vrstnem redu izbire');

    // Seznami: privzeto skriti, stikala se shranijo pod ključem treninga.
    const seznami = vsi(dom.el('exerciseArea')).filter(e => /(^| )seznam( |$)/.test(e.className));
    assert.equal(seznami.length, 3);
    assert.ok(seznami.every(s => s.hidden));
    kV.checked = true; kV.sprozi('change');
    kB.checked = true; kB.sprozi('change');
    assert.deepEqual(seznami.map(s => s.hidden), [false, true, false]);
    assert.match(seznami[0].children[0].title, /^Vrstica 1: ((manjka|manjkata|manjkajo) \d|polna$)/);
    assert.deepEqual(JSON.parse(shramba.get('sudoku.trening.seznami')), { vrstice: true, stolpci: false, bloki: true });
    assert.ok(ima(vsi(dom.el('exerciseArea')).find(e => /\bvaja-enojcek\b/.test(e.className)), 'z-vrsticami'));
    assert.equal(kS.checked, false);

    // Naslednja vaja kroga: stikala in "več hkrati" ostanejo, poudarki ne.
    run('exNum++; renderExercise()');
    const [, vh2, kV2, kS2, kB2] = vsi(dom.el('exerciseArea')).filter(e => e.tagName === 'INPUT');
    assert.deepEqual([vh2.checked, kV2.checked, kS2.checked, kB2.checked], [true, true, false, true]);
    assert.ok(celice(dom).every(c => !ima(c, 'poud-stevka')));
    const g2 = iz(run, 'zadnja.boardGrid'), [x, y] = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => g2.includes(d));
    poudari(run, x).sprozi('click');
    poudari(run, y).sprozi('click');
    assert.ok(ima(celice(dom)[g2.indexOf(x)], 'poud-stevka') && ima(celice(dom)[g2.indexOf(y)], 'poud-stevka'), '"več hkrati" še velja');
  });
}

test('barve poudarka iz nastavitev igre (samo branje) veljajo v treningu', () => {
  const shramba = new Map([['sudoku.igra.poud', JSON.stringify({ 1: '#ff8080', 2: '#40c0c0' })]]);
  const { dom } = zacni('naked-single', 6, shramba);
  const s = dom.globals.document.documentElement.style;
  assert.equal(s.getPropertyValue('--poud'), '#FF8080');
  assert.equal(s.getPropertyValue('--poud2'), '#40C0C0');
  assert.equal(s.getPropertyValue('--poud3'), '');
  assert.equal(shramba.get('sudoku.igra.poud'), JSON.stringify({ 1: '#ff8080', 2: '#40c0c0' }), 'trening ne piše');
});

test('tipkovnica pri enojčkih po stopnjah (tudi pari QWERTZ key/code)', () => {
  // Cela mreža (vaja 7): števka izbere števko, puščice izbiro, Escape jo počisti.
  let { dom, run } = zacni('naked-single', 6);
  const pr = prazne(run);
  tipka(dom, { key: '4', code: 'Digit4' });
  assert.deepEqual(stv(run), [4]);
  assert.ok(ima(stevke(dom)[3], 'picked'));
  tipka(dom, { key: '4', code: 'Numpad4' });
  assert.deepEqual(stv(run), [], 'ponovna števka prekliče izbiro (kot gumb)');
  // QWERTZ: Shift+2 da key '"', code Digit2 - ni izbira števke (Shift+števka je izbris kandidata).
  tipka(dom, { key: '"', code: 'Digit2', shiftKey: true });
  assert.deepEqual(stv(run), []);
  tipka(dom, { key: 'ArrowRight', code: 'ArrowRight' });
  assert.deepEqual(izb(run), [pr[0]], 'prva puščica izbere prvo prazno celico');
  tipka(dom, { key: 'ArrowRight', code: 'ArrowRight' });
  const vVrstici = pr.filter(c => Math.floor(c / 9) === Math.floor(pr[0] / 9));
  assert.deepEqual(izb(run), [vVrstici[1] !== undefined ? vVrstici[1] : pr[0]], 'polne celice se preskočijo');
  tipka(dom, { key: 'Escape', code: 'Escape' });
  assert.deepEqual(izb(run), []);
  // QWERTZ Ctrl+Z (key 'z', code 'KeyY') in Ctrl+Y: ni potez, ki bi jih bilo mogoče razveljaviti.
  const k = run('enojcek.plosca.mreza.celice.map(c => c.textContent).join()');
  tipka(dom, { key: 'z', code: 'KeyY', ctrlKey: true });
  tipka(dom, { key: 'y', code: 'KeyZ', ctrlKey: true });
  tipka(dom, { key: 'Backspace', code: 'Backspace' });
  assert.equal(run('enojcek.plosca.mreza.celice.map(c => c.textContent).join()'), k, 'vpisi poti ostanejo');

  // E1 vaja 1: označena celica ostane izbrana (puščice, Escape), števka se izbere.
  ({ dom, run } = zacni('naked-single', 0));
  const c = run('zadnja.oznaka.celica');
  for (const key of ['ArrowLeft', 'ArrowUp', 'Escape']) tipka(dom, { key, code: key });
  assert.deepEqual(izb(run), [c]);
  const d = run('zadnja.korak.assign[0][1]');
  tipka(dom, { key: String(d), code: `Digit${d}` });
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);

  // E2 vaja 1: označena števka se s tipko ne zamenja.
  ({ dom, run } = zacni('hidden-single', 0));
  const s = run('zadnja.oznaka.stevka'), druga = s === 1 ? 2 : 1;
  tipka(dom, { key: String(druga), code: `Digit${druga}` });
  assert.deepEqual(stv(run), [s]);

  // V meniju (brez vaje) tipke ne naredijo nič.
  gumb(dom, 'Preveri'); // vaja je prikazana
  run('mode = null');
  tipka(dom, { key: 'ArrowRight', code: 'ArrowRight' });
  assert.deepEqual(izb(run), []);
});

test('enojčka: "Rešitev" z oznakami koraka, pravilen odgovor postane poteza in zaklene mrežo', () => {
  const { dom, run } = zacni('hidden-single', 0);
  const [c, d] = run('zadnja.korak.assign[0]'), u = enota(run);
  odpriPomoc(dom, 'resitev');
  let cs = celice(dom);
  assert.ok(ima(cs[c], 'k-vpis') && cs[c].textContent === String(d), 'celica koraka zeleno s števko');
  for (const x of u) if (x !== c) assert.ok(ima(cs[x], 'k-vzorec'), `enota ${x}`);
  zapriPomoc(dom, 'resitev');
  assert.ok(cs.every(x => !ima(x, 'k-vpis') && !ima(x, 'k-vzorec')), 'po spustu ni oznak');
  assert.equal(cs[c].textContent, '');

  // Pravilen odgovor (vaja s pomočjo - ne šteje, poteza pa se zapiše).
  const manjkaPrej = poudari(run, d).innerHTML;
  cs[c].sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.equal(run('enojcek.plosca.mreza.celice[' + c + '].textContent'), String(d));
  cs = celice(dom);
  assert.ok(ima(cs[c], 'k-vpis') && ima(cs[c], 'vpis') && !ima(cs[c], 'izbrana'));
  assert.ok(run('enojcek.plosca.mreza.el.className').includes('zaklenjena'));
  const n = +/manjka">(\d+)/.exec(manjkaPrej)[1];
  assert.match(poudari(run, d).innerHTML, new RegExp(`manjka">${n - 1}<`), 'števec "še manjka" se zmanjša');
  // Zaklenjena: klik ne izbere, Ctrl+Z ne vrne poteze.
  const druga = u.find(x => x !== c && !iz(run, 'zadnja.boardGrid')[x]);
  if (druga !== undefined) cs[druga].sprozi('click');
  assert.ok(celice(dom).every(x => !ima(x, 'izbrana')));
  tipka(dom, { key: 'z', code: 'KeyZ', ctrlKey: true });
  assert.equal(run('enojcek.plosca.mreza.celice[' + c + '].textContent'), String(d));
});

/* ---------- senčenje in poudarek po pravilnem odgovoru (dopolnitev D1, D2) ---------- */

// Kljukici v glavi niza Poudari: [senči, več hkrati].
const kljukiciGlave = dom => vsi(dom.el('exerciseArea')).filter(e => e.tagName === 'INPUT').slice(0, 2);
const vklopi = (el, v = true) => { el.checked = v; el.sprozi('change'); };
const zasencenih = dom => celice(dom).filter(c => ima(c, 'zasencena')).length;

test('E2: senčenje, prikazano pred odgovorom, je pomoč (sama kljukica ali dve števki ne)', () => {
  const { dom, run } = zacni('hidden-single', 3);
  const [senci, vecH] = kljukiciGlave(dom);
  const d = run('zadnja.korak.assign[0][1]'), e = d === 1 ? 2 : 1;
  napacnoEnojcek(dom, run);
  assert.equal(rezultat(dom), '0/1');
  vklopi(senci);
  assert.equal(pomoc(dom), '', 'sama kljukica ni pomoč');
  vklopi(senci, false);
  vklopi(vecH);
  poudari(run, d).sprozi('click');
  poudari(run, e).sprozi('click');
  vklopi(senci);
  assert.equal(zasencenih(dom), 0, 'dve števki: ni senčenja');
  assert.equal(pomoc(dom), '', 'dve števki niso pomoč');
  poudari(run, e).sprozi('click');
  assert.ok(zasencenih(dom) > 0);
  assert.equal(pomoc(dom), ' · s pomočjo: 1');
  assert.equal(rezultat(dom), '0/0', 'že šteti poskus se odšteje');
  pravilnoEnojcek(dom, run);
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.ok(imaOznako(dom));
  assert.equal(rezultat(dom), '0/0');
  // Kljukica ostane med vajami kroga; nova vaja je brez pomoči, dokler se senčenje ne pokaže.
  gumb(dom, 'Naslednja vaja →').sprozi('click');
  assert.equal(kljukiciGlave(dom)[0].checked, true);
  assert.equal(zasencenih(dom), 0, 'brez poudarka ni senčenja');
  pravilnoEnojcek(dom, run);
  assert.equal(rezultat(dom), '1/1');
});

test('E1: senčenje ni pomoč; po pravilnem odgovoru nič ne spremeni', () => {
  const { dom, run } = zacni('naked-single', 6);
  const [senci] = kljukiciGlave(dom);
  const [c, d] = run('zadnja.korak.assign[0]');
  vklopi(senci);
  poudari(run, d).sprozi('click');
  const cs = celice(dom), grid = iz(run, 'zadnja.boardGrid');
  assert.ok(zasencenih(dom) > 0);
  assert.ok(!ima(cs[c], 'zasencena'), 'celica odgovora je mesto, kamor števka še lahko');
  for (let i = 0; i < 81; i++) if (grid[i] && grid[i] !== d) assert.ok(ima(cs[i], 'zasencena'), `polna celica ${i}`);
  assert.equal(pomoc(dom), '');
  pravilnoEnojcek(dom, run);
  assert.equal(rezultat(dom), '1/1');
  // Poudarek pred zeleno: celica odgovora ima poudarek in oznako vpisa (zelen okvir v CSS).
  assert.ok(ima(cs[c], 'poud-stevka') && ima(cs[c], 'k-vpis') && !ima(cs[c], 'zasencena'));
  poudari(run, d).sprozi('click');
  poudari(run, d).sprozi('click');
  assert.equal(rezultat(dom), '1/1');
  assert.equal(pomoc(dom), '');
});

test('E2: senčenje po pravilnem odgovoru ni pomoč', () => {
  const { dom, run } = zacni('hidden-single', 6);
  const [senci] = kljukiciGlave(dom);
  pravilnoEnojcek(dom, run);
  vklopi(senci);
  poudari(run, run('zadnja.korak.assign[0][1]')).sprozi('click');
  assert.ok(zasencenih(dom) > 0);
  assert.equal(rezultat(dom), '1/1');
  assert.equal(pomoc(dom), '');
});
