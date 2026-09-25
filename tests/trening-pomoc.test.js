'use strict';
// Pomoč v treningu (trening/trening.js, način "Spoznaj") v nadomestnem DOM-u (dom-stub.js):
//   - pomoč = ogled namiga ALI rešitve (vsak pritisk, tudi kratek);
//   - vaja s pomočjo se ne šteje nikamor - ne med pravilne ne med napačne (že šteti
//     napačni poskusi te vaje se ob ogledu odštejejo);
//   - oznaka "s pomočjo" pri sporočilu po "Preveri", v vrstici rezultata in v povzetku;
//   - ogled po pravilnem odgovoru ne spremeni ničesar;
//   - "Naslednja vaja" zastavico ponastavi.
// Pokrita sta oba načina preverjanja: izbira celic (Očitna para, checkPhase1) in vpis
// (Očitni enojček, checkSingle).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v trening/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'trening/generators.js', 'trening/trening.js'];

// Kontekst z odprto prvo vajo tehnike; generator vaje si zapomni zadnjo vajo (`zadnja`),
// da test pozna pravi odgovor.
function zacni(tehnika) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen; MODES[${JSON.stringify(tehnika)}].gen = n => (zadnja = g(n)); }`);
  run(`mode = ${JSON.stringify(tehnika)}; exNum = 0; scoreRight = 0; scoreTotal = 0; sPomocjo = 0; updateScore(); renderExercise();`);
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
// Odgovori za Očitni enojček: korak vaje ali vpis, ki ga preveriEnojcek() zavrne.
function pravilnoEnojcek(dom, run) {
  run('selected = [zadnja.korak.assign[0][0]]; pickedDigits = [zadnja.korak.assign[0][1]]');
  gumb(dom, 'Preveri').sprozi('click');
}
function napacnoEnojcek(dom, run) {
  run(`{
    let o = null;
    for (let c = 0; c < 81 && !o; c++) if (!zadnja.boardGrid[c])
      for (let d = 1; d <= 9 && !o; d++) if (preveriEnojcek(zadnja, c, d).izid === 'narobe') o = [c, d];
    selected = [o[0]]; pickedDigits = [o[1]];
  }`);
  gumb(dom, 'Preveri').sprozi('click');
}

const PRIMERI = [
  { tehnika: 'naked-pair', pravilno: pravilnoPar, napacno: napacnoPar },
  { tehnika: 'naked-single', pravilno: pravilnoEnojcek, napacno: napacnoEnojcek },
];

for (const { tehnika, pravilno, napacno } of PRIMERI) {
  test(`${tehnika}: vaja brez pomoči se šteje (napačen in pravilen poskus)`, () => {
    const { dom, run } = zacni(tehnika);
    napacno(dom, run);
    assert.equal(rezultat(dom), '0/1');
    pravilno(dom, run);
    assert.equal(rezultat(dom), '1/2');
    assert.equal(pomoc(dom), '');
    assert.ok(!imaOznako(dom));
  });

  for (const [napis, dogodek] of [['Namig (drži)', 'mousedown'], ['Rešitev (drži)', 'touchstart']]) {
    test(`${tehnika}: ${napis} - vaja se ne šteje nikamor in dobi oznako "s pomočjo"`, () => {
      const { dom, run } = zacni(tehnika);
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
    const { dom, run } = zacni(tehnika);
    pravilno(dom, run);
    assert.equal(rezultat(dom), '1/1');
    gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
    assert.equal(rezultat(dom), '1/1');
    assert.equal(pomoc(dom), '');
  });

  test(`${tehnika}: "Naslednja vaja" ponastavi pomoč, povzetek pove število vaj s pomočjo`, () => {
    const { dom, run } = zacni(tehnika);
    gumb(dom, 'Namig (drži)').sprozi('mousedown');
    pravilno(dom, run);
    assert.equal(rezultat(dom), '0/0');
    gumb(dom, 'Naslednja vaja →').sprozi('click');
    assert.equal(run('exNum'), 1);
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
