'use strict';
// Vaji 1 in 2 »Spoznaj« po shemi (docs/trening-ucenje-nacrt.md, del A) - test raste po korakih.
// Vaja 1 je natanko kot shema (SHEME_TEHNIK v shared/sheme.js), vaja 2 shema, obrnjena čez glavno
// diagonalo (O16; VrSc -> VcSr), črke so naključne števke (O1, pri vaji 2 nove - O17). Pričakovane
// celice se tu izračunajo iz zapisa sheme neodvisno od trening/generators.js, obrat tudi.
// Korak 2: 7 · X-krilo in 8 · Mečarica (mreža ene števke - celice x iz sheme):
//   - celice vaje = celice x sheme, vzorec in izbrisi iz sheme (vaja 2 obrnjena);
//   - funkcija tehnike v motorju na mreži vaje najde natanko korak sheme;
//   - »Rešitev« pokaže celice sheme, »Preveri« s celicami vzorca → »Pravilno!«;
//   - oznaka »· po shemi« / »· po shemi, obrnjeno« in vrstica s preslikavo;
//   - vaja 3 je pri istem semenu enaka izhodu generatorja (M.gen(2));
//   - E1 in »Vadi v uganki« brez vaje po shemi; pravila besedil.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { medPomocjo } = require('./pomoc-stikali.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

const motor = loadContext(['shared/engine.js', 'shared/sheme.js']).run;
const SHEME = JSON.parse(motor('JSON.stringify(SHEME_TEHNIK)'));
const obrni = i => (i % 9) * 9 + Math.floor(i / 9);
const urejeno = a => [...a].sort((x, y) => x - y);

// Celice sheme 9 × 9 s črko x: { celice, vzorec (»*«), izbris (»-x«) }, pri obrnjeni shemi obrnjene.
function izSheme(kljuc, obrnjeno) {
  const celice = [], vzorec = [], izbris = [];
  SHEME[kljuc].celice.forEach((zapis, i) => {
    const zetoni = zapis.replace(/^[*+]/, '').split(' ').filter(Boolean);
    if (!zetoni.some(t => t.replace(/^-/, '') === 'x')) return;
    const idx = obrnjeno ? obrni(i) : i;
    celice.push(idx);
    if (/^[*+]/.test(zapis)) vzorec.push(idx);
    if (zetoni.includes('-x')) izbris.push(idx);
  });
  return { celice: urejeno(celice), vzorec: urejeno(vzorec), izbris: urejeno(izbris) };
}

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const vObmocju = dom => vsi(dom.el('exerciseArea'));
const vaja = dom => vObmocju(dom).find(e => e.className === 'exercise');
const poShemi = dom => vObmocju(dom).find(e => e.className === 'po-shemi');
const gumb = (dom, napis) => vObmocju(dom).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vObmocju(dom).find(e => /^fb\b/.test(e.className));
const xwCelice = (dom, razred) => urejeno(vObmocju(dom).filter(e => e.classList.contains('xw-cell') && e.classList.contains(razred)).map(e => +e.dataset.idx));
const oznacena = dom => +vObmocju(dom).find(e => e.className === 'xw-digit-label').textContent.match(/\d$/)[0];

// Nov krog »Spoznaj« tehnike s semenom; n = številka vaje (0 = vaja 1).
function krog(tehnika, seme, n = 0) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`zacniKrog(${JSON.stringify(tehnika)}, 'spoznaj')`);
  for (let i = 0; i < n; i++) run('exNum++; renderExercise()');
  return { dom, run };
}

const FUNKCIJA = { 'x-wing': 'xWing', 'swordfish': 'swordfish' };
const SEMENA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

for (const tehnika of ['x-wing', 'swordfish']) {
  for (const [n, obrnjeno] of [[0, false], [1, true]]) {
    const ime = `${tehnika}, vaja ${n + 1}${obrnjeno ? ' (obrnjena shema)' : ''}`;
    const pricakovano = izSheme(tehnika, obrnjeno);

    test(`${ime}: celice, vzorec in izbrisi so iz sheme; motor najde natanko korak sheme`, () => {
      const stevke = new Set();
      for (const seme of SEMENA) {
        const { dom, run } = krog(tehnika, seme, n);
        assert.deepEqual(xwCelice(dom, 'has-digit'), pricakovano.celice, `seme ${seme}: celice z x`);
        const d = oznacena(dom);
        stevke.add(d);
        const koraki = run(`${FUNKCIJA[tehnika]}({ grid: new Array(81).fill(0), cand: [...Array(81).keys()].map(i => ${JSON.stringify(pricakovano.celice)}.includes(i) ? 1 << ${d} : 0) })
          .map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbris: k.eliminate.map(([c, s]) => c * 10 + s).sort((a, b) => a - b) }))`);
        assert.deepEqual(JSON.parse(JSON.stringify(koraki)), [{ celice: pricakovano.vzorec, izbris: pricakovano.izbris.map(c => c * 10 + d) }], `seme ${seme}: korak motorja`);
        medPomocjo(dom, 'resitev', () => {
          assert.deepEqual(xwCelice(dom, 'peek-hl'), pricakovano.vzorec, `seme ${seme}: »Rešitev« – vzorec`);
          assert.deepEqual(xwCelice(dom, 'peek-elim'), pricakovano.izbris, `seme ${seme}: »Rešitev« – izbris`);
        });
      }
      assert.ok(stevke.size >= 4, `števke so naključne: ${[...stevke]}`);
    });

    test(`${ime}: »Preveri« s celicami vzorca → »Pravilno!«`, () => {
      const { dom } = krog(tehnika, 5, n);
      for (const c of vObmocju(dom).filter(e => e.classList.contains('xw-cell') && pricakovano.vzorec.includes(+e.dataset.idx))) c.sprozi('click');
      gumb(dom, 'Preveri').sprozi('click');
      assert.match(fb(dom).className, /\bok\b/);
      assert.match(fb(dom).innerHTML, /^<b>Pravilno!/);
      assert.deepEqual(xwCelice(dom, 'xw-elim'), pricakovano.izbris, 'izbris po odgovoru');
    });

    test(`${ime}: oznaka nad vajo in vrstica s preslikavo`, () => {
      const { dom } = krog(tehnika, 3, n);
      const d = oznacena(dom);
      assert.match(vaja(dom).innerHTML, new RegExp(`^<p class="ex-label">[^<]* · Vaja ${n + 1} / 9 · ${obrnjeno ? 'po shemi, obrnjeno' : 'po shemi'}</p>`));
      assert.equal(poShemi(dom).textContent, obrnjeno
        ? `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črka x je števka ${d}.`
        : `Vaja po shemi zgoraj – iste celice, črka x je števka ${d}.`);
      // Vrstica s preslikavo je tik za razdelkom »Shema«, ta je odprt.
      const otroci = vaja(dom).children;
      const i = otroci.indexOf(poShemi(dom));
      assert.equal(otroci[i - 1].className, 'shema-razdelek');
      assert.equal(otroci[i - 1].open, true);
    });
  }

  test(`${tehnika}: vaji 1 in 2 imata vsaka svojo števko (nove števke, O17)`, () => {
    let razlicni = 0;
    for (const seme of SEMENA) {
      const { dom, run } = krog(tehnika, seme);
      const d1 = oznacena(dom);
      run('exNum++; renderExercise()');
      if (oznacena(dom) !== d1) razlicni++;
    }
    assert.ok(razlicni >= SEMENA.length / 2, `različnih: ${razlicni} / ${SEMENA.length}`);
  });

  test(`${tehnika}: vaja 3 je pri istem semenu enaka izhodu generatorja, brez oznake po shemi`, () => {
    for (const seme of [11, 22, 33]) {
      const { dom, run } = krog(tehnika, 1, 2);
      run(`${SEME(seme)} renderExercise()`);
      const celice = xwCelice(dom, 'has-digit'), d = oznacena(dom);
      run(SEME(seme));
      const gen = run(`(() => { const ex = MODES[${JSON.stringify(tehnika)}].gen(2); return { d: ex.digit, celice: ex.grid.map((h, i) => h ? i : -1).filter(i => i >= 0) }; })()`);
      assert.deepEqual({ d, celice }, JSON.parse(JSON.stringify(gen)), `seme ${seme}`);
      assert.equal(poShemi(dom), undefined);
      assert.doesNotMatch(vaja(dom).innerHTML, /po shemi/);
    }
  });
}

test('genPoShemi: vaje 3-9, E1, E2 in tehnike brez vaje po shemi dajo null (vaja iz generatorja)', () => {
  const { run } = loadContext(DATOTEKE, makeDom().globals);
  for (const n of [2, 3, 8]) for (const t of ['x-wing', 'swordfish']) assert.equal(run(`genPoShemi('${t}', ${n})`), null, `${t}, vaja ${n + 1}`);
  for (const t of ['naked-single', 'hidden-single']) for (const n of [0, 1]) assert.equal(run(`genPoShemi('${t}', ${n})`), null, `${t}, vaja ${n + 1}`);
});

test('E1 in »Vadi v uganki« nimata vaje po shemi', () => {
  const e1 = krog('naked-single', 4);
  assert.equal(poShemi(e1.dom), undefined);
  assert.doesNotMatch(vaja(e1.dom).innerHTML, /po shemi/);
  for (const t of ['x-wing', 'swordfish']) {
    const dom = makeDom();
    const { run } = loadContext(DATOTEKE, dom.globals);
    run(SEME(4));
    run(`zacniKrog('${t}', 'uganka')`);
    assert.equal(poShemi(dom), undefined, t);
    assert.ok(!vObmocju(dom).some(e => /po shemi/.test(e.innerHTML || '') || /po shemi/.test(e.textContent || '')), t);
  }
});

test('besedila vaje po shemi: brez »številk«, ločila (pomišljaj, brez ravnih narekovajev)', () => {
  for (const tehnika of ['x-wing', 'swordfish']) for (const n of [0, 1]) {
    const { dom } = krog(tehnika, 8, n);
    for (const b of [vaja(dom).innerHTML.replace(/<[^>]*>/g, ' '), poShemi(dom).textContent]) {
      assert.doesNotMatch(b, /številk/i, b);
      assert.doesNotMatch(b, / - |—|"|\.\.\./, b);
    }
  }
});
