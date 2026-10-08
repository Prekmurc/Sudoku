'use strict';
// Prikaz zaporedja XY-verige na mreži (docs/xy-veriga-nacrt.md, razdelek 5, odločitev O4: B,
// korak 3): v celici verige je na praznem mestu kandidata zaporedna številka 1…n (mesto 5,
// če 5 ni kandidat, sicer prvo prosto po vrstnem redu 8, 2, 4, 6, 1, 3, 7, 9), kandidati
// ostanejo na svojih mestih, legenda »celice verige (po vrsti)«. Mala mreža reševalca
// (app/app.js), mreža igre in »Vadi v uganki« (shared/mreza.js, oznakeKoraka), legenda
// »Vadi v uganki« (trening/v-uganki.js) in mreža vaj 9-12 v »Spoznaj« (trening/trening.js).
//
// Stanja niso sestavljena na pamet: za vsako uganko iz docs/uganke.md je to prvo stanje v
// dnevniku solve() (posnetek pred korakom), v katerem xyChain() kaj najde; koraki so vsi
// koraki xyChain() v tem stanju. Pri preizkusni uganki xy-veriga-17 je prvi korak veriga
// V5S4 – V6S6 – V9S6 – V8S5 – V8S3 (tests/xy-chain.test.js).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const RESEVALEC = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
  'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'app/app.js', 'app/zbirka.js'];
const MREZA = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js'];
const TRENING = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const MESTA = [5, 8, 2, 4, 6, 1, 3, 7, 9];
const mestoStevilke = maska => MESTA.find(d => !(maska & (1 << d)));
const L = i => `V${Math.floor(i / 9) + 1}S${i % 9 + 1}`;

const res = loadContext(RESEVALEC, makeDom().globals);
const mr = loadContext(MREZA, makeDom().globals);
mr.run(`var el = document.createElement('div'); var mr = ustvariMrezo(el, {});`);

// Za vsako uganko prvo stanje z verigo: { ime, danosti, grid, cand, koraki }; pri preizkusni
// uganki še stanje pred korakom 31 (danes poskus, po vklopu verige veriga - načrt, razdelek 5).
const STANJA = [];
for (const { ime: imeUganke, danosti: d } of loadPuzzles()) {
  const danosti = d.replace(/\./g, '0');
  for (const korak31 of imeUganke === 'xy-veriga-17' ? [false, true] : [false]) {
    const ime = korak31 ? `${imeUganke} (korak 31)` : imeUganke;
    const s = JSON.parse(res.run(`JSON.stringify((() => { const r = solve(${JSON.stringify(danosti)});
      for (const s of ${korak31} ? [r.log[30]] : r.log) {
        if (!s.snapshotGrid) continue;
        const b = Object.create(Board.prototype);
        b.grid = Array.from(s.snapshotGrid); b.cand = Array.from(s.snapshotCand);
        const koraki = xyChain(b);
        if (koraki.length) return { grid: b.grid, cand: b.cand, koraki };
      }
      return null; })())`));
    if (s) STANJA.push({ ime, danosti, ...s });
  }
}

const vsi = (el, out = []) => { for (const c of el.children || []) { out.push(c); vsi(c, out); } return out; };

test('stanja z verigo: preizkusna uganka in vsaj ena celica verige s kandidatom 5', () => {
  const imena = STANJA.map(s => s.ime);
  for (const ime of ['xy-veriga-17', 'example-app', 'oakever-ekstrem-17-a']) assert.ok(imena.includes(ime), ime);
  const xy = STANJA.find(s => s.ime === 'xy-veriga-17 (korak 31)');
  assert.deepEqual(xy.koraki[0].cells.map(L), ['V5S4', 'V6S6', 'V9S6', 'V8S5', 'V8S3']);
  // Pravilo »sicer 8 …« mora biti preizkušeno.
  assert.ok(STANJA.some(s => s.koraki.some(k => k.cells.some(c => s.cand[c] & (1 << 5)))));
});

// Kandidati in številke v celici, izrisani s 9 mesti: [besedilo, razred] po mestih 1-9.
function preveriCelice(ime, k, cand, celice, razredStevilke, prazno) {
  const red = new Map(k.cells.map((c, j) => [c, j + 1]));
  for (let c = 0; c < 81; c++) {
    const mesta = celice(c);
    if (!mesta) { assert.ok(!red.has(c), `${ime}: celica verige ${L(c)} ima kandidate`); continue; }
    const st = red.get(c);
    const mesto = st ? mestoStevilke(cand[c]) : 0;
    mesta.forEach(([besedilo, razred], i) => {
      const d = i + 1;
      const kje = `${ime}, ${L(c)}, mesto ${d}`;
      if (d === mesto) {
        assert.equal(besedilo, String(st), `${kje}: zaporedna številka`);
        assert.ok(razred.split(' ').includes(razredStevilke), `${kje}: razred številke`);
      } else {
        assert.ok(!razred.split(' ').includes(razredStevilke), `${kje}: brez številke`);
        if (cand[c] & (1 << d)) assert.equal(besedilo, String(d), `${kje}: kandidat ostane`);
        else assert.ok(prazno(besedilo, razred), `${kje}: prazno mesto`);
      }
    });
    if (st) assert.ok(!(cand[c] & (1 << mesto)), `${kje(c)}: številka ni na mestu kandidata`);
  }
  function kje(c) { return `${ime}, ${L(c)}`; }
}

test('reševalec: zaporedne številke na praznem mestu kandidata, legenda »celice verige (po vrsti)«', () => {
  res.run('var stanjeVeriga = null;');
  for (const s of STANJA) {
    res.run(`lastSolve = { givens: ${JSON.stringify(s.danosti)}, grid: [], log: [] };`);
    s.koraki.forEach((k, ki) => {
      const ime = `${s.ime}, veriga ${ki + 1}`;
      const korak = JSON.stringify({ ...k, snapshotGrid: s.grid, snapshotCand: s.cand });
      const [mreza, legenda] = res.run(`(() => { const div = document.createElement('div');
        renderGridInto(div, ${korak}, '40px'); return [div, legendaKoraka(${korak})]; })()`);
      preveriCelice(ime, k, s.cand, c => {
        const cg = mreza.children[c].children[0];
        return cg ? cg.children.map(sp => [sp.textContent, sp.className]) : null;
      }, 'mcand-veriga', (b, r) => b === '' && r === 'mcand mcand-empty');
      for (const c of k.cells) assert.ok(mreza.children[c].classList.contains('hl-source'), `${ime}: ${L(c)} jantarna`);
      for (const [c, d] of k.eliminate) {
        const sp = mreza.children[c].children[0].children[d - 1];
        assert.equal(sp.className, 'mcand mcand-elim', `${ime}: izbris ${L(c)}≠${d}`);
      }
      const postavke = legenda.children.map(p => p.textContent);
      assert.ok(postavke.some(t => t.endsWith('celice verige (po vrsti)')), `${ime}: legenda ${postavke}`);
      assert.ok(!postavke.some(t => t.endsWith('celice vzorca')), `${ime}: legenda brez »celice vzorca«`);
      const sw = legenda.children.find(p => p.textContent.endsWith('celice verige (po vrsti)')).children[0];
      assert.equal(sw.textContent, '1', `${ime}: vzorček legende`);
    });
  }
});

test('igra (shared/mreza.js): zaporedne številke s kandidati in z izklopljenimi kandidati', () => {
  for (const s of STANJA) {
    s.koraki.forEach((k, ki) => {
      for (const brez of [false, true]) {
        const ime = `${s.ime}, veriga ${ki + 1}${brez ? ', brez kandidatov' : ''}`;
        const el = mr.run(`(() => { const k = ${JSON.stringify(k)}; const stanje = { grid: ${JSON.stringify(s.grid)}, kandidati: ${JSON.stringify(s.cand)} };
          mr.izrisi({ grid: stanje.grid, danosti: ${JSON.stringify(s.danosti)}, kandidati: stanje.kandidati,
            celiceKandidatov: ${brez} ? [...k.cells, ...k.eliminate.map(e => e[0])] : null,
            oznake: oznakeKoraka(k, stanje) }); return el; })()`);
        preveriCelice(ime, k, s.cand, c => {
          const m = el.children[c].children[0];
          return m ? m.children.map(sp => [sp.textContent, sp.className]) : null;
        }, 'k-veriga', (b, r) => b === '' && r === 'kand');
        for (const c of k.cells) assert.ok(el.children[c].classList.contains('k-vzorec'), `${ime}: ${L(c)} jantarna`);
      }
    });
  }
});

test('igra: izvedena dejanja in korak brez verige - brez številk', () => {
  const s = STANJA.find(x => x.ime === 'xy-veriga-17 (korak 31)');
  const k = s.koraki[0];
  // Korak, ki ni veriga (isti podatki brez polja veriga), številk nima.
  const el = mr.run(`(() => { const k = ${JSON.stringify({ ...k, veriga: undefined })};
    const stanje = { grid: ${JSON.stringify(s.grid)}, kandidati: ${JSON.stringify(s.cand)} };
    mr.izrisi({ grid: stanje.grid, danosti: ${JSON.stringify(s.danosti)}, kandidati: stanje.kandidati,
      oznake: oznakeKoraka(k, stanje) }); return el; })()`);
  assert.ok(!vsi(el).some(e => e.classList && e.classList.contains('k-veriga')));
});

/* ---------- trening ---------- */

const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

test('»Vadi v uganki«: legenda koraka verige »celice verige (po vrsti)«, drugih tehnik nespremenjena', () => {
  const { run } = loadContext(TRENING, makeDom().globals);
  const k = STANJA.find(x => x.ime === 'xy-veriga-17 (korak 31)').koraki[0];
  for (const odstranjeni of [false, true]) {
    const l = run(`legendaKoraka(${JSON.stringify(k)}, ${odstranjeni})`);
    const t = l.children.map(p => p.textContent);
    assert.ok(t[0].endsWith('celice verige (po vrsti)'), t[0]);
    assert.equal(l.children[0].children[0].textContent, '1');
    const brez = run(`legendaKoraka(${JSON.stringify({ ...k, veriga: undefined })}, ${odstranjeni})`);
    assert.ok(brez.children[0].textContent.endsWith('celice vzorca'));
  }
});

// »Spoznaj« 9-12 (mreža vaj 9 × 9, buildFullGridLayout): vaja verige pride v koraku 5/6, zato
// je tu pot preizkušena na vaji XY-krila, ki ji test doda polje veriga (generator verige ga bo
// nastavil sam): številke ob »Rešitvi (drži)« in po pravilnem odgovoru.
function spoznaj(seme) {
  const dom = makeDom();
  const { run } = loadContext(TRENING, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES['xy-wing'].gen; MODES['xy-wing'].gen = n => (zadnja = { ...g(n), solutionVeriga: true }); }
    { const xw = xyWing; xyWing = b => xw(b).map(s => ({ ...s, veriga: true })); }`);
  run(`mode = 'xy-wing'; exNum = 0; renderExercise();`);
  return { dom, run };
}
const gumb = (dom, napis) => vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
// Številke verige v mreži vaje: [indeks celice, besedilo, mesto].
function stevilkeSpoznaj(dom, run) {
  const ex = JSON.parse(run('JSON.stringify(zadnja)'));
  const out = [];
  for (const cel of vsi(dom.el('exerciseArea')).filter(e => e.dataset && e.dataset.si !== undefined)) {
    for (const cd of vsi(cel)) {
      if (cd.classList && cd.classList.contains('veriga-st')) out.push([ex.slots[+cel.dataset.si].idx, cd.textContent, +cd.dataset.d]);
    }
  }
  return out.sort((a, b) => a[1] - b[1]);
}
const pricakovano = ex => ex.solutionCells.map((c, j) => {
  const slot = ex.slots.find(s => s.idx === c);
  const maska = slot.c.reduce((m, d) => m | (1 << d), 0);
  return [c, String(j + 1), mestoStevilke(maska)];
});

test('»Spoznaj« (mreža 9 × 9): številke verige ob »Rešitvi (drži)«, po spustu ne', () => {
  for (const seme of [1, 2, 3]) {
    const { dom, run } = spoznaj(seme);
    const ex = JSON.parse(run('JSON.stringify(zadnja)'));
    gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
    assert.deepEqual(stevilkeSpoznaj(dom, run), pricakovano(ex), `seme ${seme}`);
    const legenda = vsi(dom.el('exerciseArea')).find(e => e.className === 'legenda-vaje');
    assert.ok(legenda.children[0].textContent.endsWith('celice verige (po vrsti)'), legenda.children[0].textContent);
    assert.equal(legenda.children[0].children[0].textContent, '1');
    gumb(dom, 'Rešitev (drži)').sprozi('mouseup');
    assert.deepEqual(stevilkeSpoznaj(dom, run), [], `seme ${seme}: po spustu`);
    // Skrite male števke so po spustu spet skrite in imajo svojo števko.
    for (const cel of vsi(dom.el('exerciseArea')).filter(e => e.dataset && e.dataset.si !== undefined)) {
      const slot = ex.slots[+cel.dataset.si];
      for (const cd of vsi(cel).filter(e => e.classList && e.classList.contains('cd'))) {
        assert.equal(cd.textContent, String(cd.dataset.d));
        assert.equal(cd.classList.contains('hide'), !slot.c.includes(+cd.dataset.d));
      }
    }
  }
});

test('»Spoznaj« (mreža 9 × 9): številke verige po pravilnem odgovoru ostanejo, tudi ob »Rešitvi«', () => {
  const { dom, run } = spoznaj(4);
  const ex = JSON.parse(run('JSON.stringify(zadnja)'));
  const celice = vsi(dom.el('exerciseArea')).filter(e => e.dataset && e.dataset.si !== undefined);
  for (const c of ex.solutionCells) celice.find(e => ex.slots[+e.dataset.si].idx === c).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.match(vsi(dom.el('exerciseArea')).find(e => /^fb\b/.test(e.className)).innerHTML, /Pravilno!/);
  // Pravilen odgovor pokaže korak, ki ga je našel motor (zaporedje njegovih celic).
  const korak = JSON.parse(run(`JSON.stringify(xyWing({ grid: zadnja.boardGrid, cand: zadnja.boardCand })
    .find(s => s.cells.length === ${ex.solutionCells.length} && s.cells.every(c => ${JSON.stringify(ex.solutionCells)}.includes(c))))`));
  const prav = pricakovano({ ...ex, solutionCells: korak.cells });
  assert.deepEqual(stevilkeSpoznaj(dom, run), prav);
  gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
  gumb(dom, 'Rešitev (drži)').sprozi('mouseup');
  assert.deepEqual(stevilkeSpoznaj(dom, run), prav, 'po ogledu »Rešitve« ostanejo');
});
