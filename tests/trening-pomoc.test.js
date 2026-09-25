'use strict';
// Pomoč v treningu (trening/trening.js, način "Spoznaj") v nadomestnem DOM-u (dom-stub.js):
//   - pomoč = ogled namiga ALI rešitve (vsak pritisk, tudi kratek);
//   - vaja s pomočjo se ne šteje nikamor - ne med pravilne ne med napačne (že šteti
//     napačni poskusi te vaje se ob ogledu odštejejo);
//   - oznaka "s pomočjo" pri sporočilu po "Preveri", v vrstici rezultata in v povzetku;
//   - ogled po pravilnem odgovoru ne spremeni ničesar;
//   - "Naslednja vaja" zastavico ponastavi.
// Pokrita sta oba načina preverjanja: izbira celic (Očitna para, checkPhase1) in vpis
// (Očitni in Skriti enojček, checkSingle - na vaji 1 in 4, torej z označeno celico ali
// števko in z označeno enoto).
// Na koncu je še postopnost enojčkov v krogu: oznaka, omejena izbira in zatemnjene
// celice (vaje 1-3, 4-6), cela mreža (vaje 7-9).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v trening/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'trening/generators.js', 'trening/trening.js'];

// Kontekst z odprto prvo vajo tehnike; generator vaje si zapomni zadnjo vajo (`zadnja`),
// da test pozna pravi odgovor.
function zacni(tehnika, n = 0) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
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
// ga oznaka postopnosti dovoli (označena celica, števka, enota).
function pravilnoEnojcek(dom, run) {
  run('selected = [zadnja.korak.assign[0][0]]; pickedDigits = [zadnja.korak.assign[0][1]]');
  gumb(dom, 'Preveri').sprozi('click');
}
function napacnoEnojcek(dom, run) {
  run(`{
    let o = null;
    const z = zadnja.oznaka || {};
    const dovoljena = c => z.celica != null ? c === z.celica : !z.enota || z.enota.includes(c);
    for (let c = 0; c < 81 && !o; c++) if (!zadnja.boardGrid[c] && dovoljena(c))
      for (let d = 1; d <= 9 && !o; d++) if ((!z.stevka || d === z.stevka) && preveriEnojcek(zadnja, c, d).izid === 'narobe') o = [c, d];
    selected = [o[0]]; pickedDigits = [o[1]];
  }`);
  gumb(dom, 'Preveri').sprozi('click');
}

const PRIMERI = [
  { tehnika: 'naked-pair', n: 0, pravilno: pravilnoPar, napacno: napacnoPar },
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

  for (const [napis, dogodek] of [['Namig (drži)', 'mousedown'], ['Rešitev (drži)', 'touchstart']]) {
    test(`${tehnika}: ${napis} - vaja se ne šteje nikamor in dobi oznako "s pomočjo"`, () => {
      const { dom, run } = zacni_();
      napacno(dom, run);
      assert.equal(rezultat(dom), '0/1');
      // Kratek ogled: pritisk in takoj spust.
      gumb(dom, napis).sprozi(dogodek);
      gumb(dom, napis).sprozi(dogodek === 'mousedown' ? 'mouseup' : 'touchend');
      assert.equal(rezultat(dom), '0/0', 'že šteti poskus te vaje se odšteje');
      assert.equal(pomoc(dom), ' · s pomočjo: 1');
      // Ponoven ogled iste vaje se ne šteje dvakrat.
      gumb(dom, 'Namig (drži)').sprozi('mousedown');
      gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
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
    gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
    assert.equal(rezultat(dom), '1/1');
    assert.equal(pomoc(dom), '');
  });

  test(`${tehnika}: "Naslednja vaja" ponastavi pomoč, povzetek pove število vaj s pomočjo`, () => {
    const { dom, run } = zacni_();
    gumb(dom, 'Namig (drži)').sprozi('mousedown');
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

// Celice mreže enojčka (indeks = celica 0-80) in gumbi števk.
const celice = dom => {
  const a = [];
  for (const e of vsi(dom.el('exerciseArea'))) if (/\bgc\b/.test(e.className) && e.dataset.r !== undefined) a[+e.dataset.r * 9 + +e.dataset.c] = e;
  return a;
};
const stevke = dom => vsi(dom.el('exerciseArea')).filter(e => e.tagName === 'BUTTON' && e.dataset.d);
const ima = (el, r) => el.classList.contains(r);
// Vrednosti iz konteksta vm kot navadne tabele (deepEqual primerja tudi prototip).
const iz = (run, izraz) => JSON.parse(run(`JSON.stringify(${izraz})`));
const izb = run => iz(run, 'selected'), stv = run => iz(run, 'pickedDigits'), enota = run => iz(run, 'zadnja.oznaka.enota');
const prazne = run => iz(run, '[...Array(81).keys()].filter(c => !zadnja.boardGrid[c])');

// Klikljive (in ne zatemnjene) so natanko prazne celice v `dovoljene`; polne celice
// niso zatemnjene.
function preveriIzbiro(dom, run, dovoljene) {
  const cs = celice(dom), pr = prazne(run);
  for (const c of pr) {
    const sme = dovoljene.includes(c);
    assert.equal(ima(cs[c], 'selectable'), sme, `celica ${c} klikljiva`);
    assert.equal(ima(cs[c], 'ni-izbire'), !sme, `celica ${c} zatemnjena`);
  }
  for (const c of cs.keys()) if (!pr.includes(c)) assert.ok(!ima(cs[c], 'ni-izbire'), 'polna celica ni zatemnjena');
}

test('E1 vaja 1: celica je označena in izbrana, druge prazne celice so zatemnjene in se ne dajo izbrati', () => {
  const { dom, run } = zacni('naked-single', 0);
  const [c, d] = run('zadnja.korak.assign[0]');
  assert.equal(run('zadnja.oznaka.celica'), c);
  const cs = celice(dom);
  assert.deepEqual(izb(run), [c]);
  assert.ok(ima(cs[c], 'selected-slate') && ima(cs[c], 'oznacena-enota'));
  assert.ok(!ima(cs[c], 'ni-izbire'));
  for (const x of prazne(run)) if (x !== c) assert.ok(ima(cs[x], 'ni-izbire') && !ima(cs[x], 'selectable'), `celica ${x}`);
  // Klik druge celice ali označene celice izbire ne spremeni.
  for (const x of prazne(run)) cs[x].sprozi('click');
  assert.deepEqual(izb(run), [c]);
  assert.ok(stevke(dom).every(b => !b.disabled), 'števke so vse na voljo');
  // Napačna števka: celica ostane izbrana.
  stevke(dom).find(b => +b.dataset.d !== d).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Ni pravilno/);
  assert.deepEqual(izb(run), [c]);
  assert.ok(ima(cs[c], 'selected-slate'));
  stevke(dom).find(b => +b.dataset.d === d).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(fb(dom).innerHTML, /Pravilno!/);
  assert.equal(rezultat(dom), '1/2');
});

test('E1 vaja 4: izbrati je mogoče samo prazne celice označene enote', () => {
  const { dom, run } = zacni('naked-single', 3);
  const u = enota(run), cs = celice(dom);
  assert.deepEqual(izb(run), []);
  for (const x of u) assert.ok(ima(cs[x], 'oznacena-enota'));
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
    assert.ok(celice(dom).every(e => !ima(e, 'oznacena-enota')));
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
    assert.ok(html.includes(`<p class="desc">${run('zadnja.desc || MODES[mode].desc')}</p>`), html);
  }
});
