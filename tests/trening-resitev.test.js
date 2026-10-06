'use strict';
// "Rešitev (drži)" v "Spoznaj" pri vajah, kjer "Preveri" sprejme več vzorcev (trening/trening.js,
// docs/izbira-spoznaj-nacrt.md, razdelek 6): očitni par in trojica (3, 5), X-krilo (7) in
// mečarica (8). "Rešitev" pokaže vzorec, ki se najbolj ujema z izbiro - brez izbire vzorec
// generatorja (kot prej). Drugi veljavni vzorci se tu poiščejo neodvisno od trening.js (X-krilo in
// trojica po pravilu iz checkPhase1, mečarica s swordfish() kot v checkPhase1), sprejem pa potrdi
// "Preveri" sam. Okvir izbire ob "Rešitvi" (pravilno/napačno izbrana) je CSS in ga preverja
// tools/preveri-izbira-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

// Celice izbrisa očitnega para/trojice (celice cells, števke ds): druge celice enote s katero od
// števk ds - od naloge docs/precrtanje-resitev-nacrt.md jih »Rešitev« pokaže (prej elim: []).
const IZBRIS_OCITNIH = '(ex, cells, ds) => ex.slots.map((s, i) => i).filter(i => !cells.includes(i) && ex.slots[i].c && ex.slots[i].c.some(d => ds.includes(d)))';
// Neodvisno naštevanje drugih veljavnih vzorcev (koda v kontekstu; vrne [{ cells, elim }]).
const DRUGI = {
  // X-krilo: dve vrstici (stolpca) s števko na natanko istih dveh mestih; izbris = druge celice s
  // števko v teh dveh stolpcih (vrsticah).
  'x-wing': `ex => { const out = [];
    for (const vrst of [true, false]) { const id = (b, i) => vrst ? b * 9 + i : i * 9 + b;
      for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) {
        const pa = [], pb = []; for (let i = 0; i < 9; i++) { if (ex.grid[id(a, i)]) pa.push(i); if (ex.grid[id(b, i)]) pb.push(i); }
        if (pa.length !== 2 || pa[0] !== pb[0] || pa[1] !== pb[1]) continue;
        const elim = []; for (const i of pa) for (let x = 0; x < 9; x++) if (x !== a && x !== b && ex.grid[id(x, i)]) elim.push(id(x, i));
        out.push({ cells: [id(a, pa[0]), id(a, pa[1]), id(b, pa[0]), id(b, pa[1])], elim }); } }
    return out; }`,
  'swordfish': `ex => swordfish({ grid: new Array(81).fill(0), cand: ex.grid.map(h => h ? 1 << ex.digit : 0) })
    .map(s => ({ cells: s.cells, elim: s.eliminate.map(([c]) => c) }))`,
  'naked-triple': `ex => { const out = [], p = ex.slots.map((s, i) => s.c ? i : -1).filter(i => i >= 0);
    for (let a = 0; a < p.length; a++) for (let b = a + 1; b < p.length; b++) for (let c = b + 1; c < p.length; c++)
      if (new Set([p[a], p[b], p[c]].flatMap(i => ex.slots[i].c)).size === 3) out.push({ cells: [p[a], p[b], p[c]],
        elim: (${IZBRIS_OCITNIH})(ex, [p[a], p[b], p[c]], [...new Set([p[a], p[b], p[c]].flatMap(i => ex.slots[i].c))]) });
    return out; }`,
};
const VZOREC = {
  'x-wing': 'ex => ({ cells: ex.rect.map(([r, c]) => r * 9 + c), elim: ex.elimCells.map(([r, c]) => r * 9 + c) })',
  'swordfish': 'ex => ({ cells: ex.sfCells.map(([r, c]) => r * 9 + c), elim: ex.elimCells.map(([r, c]) => r * 9 + c) })',
  'naked-triple': `ex => ({ cells: ex.targetSlots, elim: (${IZBRIS_OCITNIH})(ex, ex.targetSlots, ex.targetDigits) })`,
  'naked-pair': `ex => ({ cells: ex.targetSlots, elim: (${IZBRIS_OCITNIH})(ex, ex.targetSlots, ex.targetDigits) })`,
  'hidden-pair': 'ex => ({ cells: ex.targetSlots, elim: [] })',
};
const kljuc = a => [...a].sort((x, y) => x - y).join(',');

// Prva vaja tehnike; z drugim = true generator ponavlja, dokler vaja nima drugega veljavnega
// vzorca (drugi = prvi takšen, `zadnja.drugi`).
function zacni(tehnika, { seme = 7, drugim = false } = {}) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen, vzorec = ${VZOREC[tehnika]}, drugi = ${DRUGI[tehnika] || '() => []'};
    MODES[${JSON.stringify(tehnika)}].gen = n => { for (let i = 0; ; i++) { const ex = g(n), v = vzorec(ex);
      const k = a => [...a].sort((x, y) => x - y).join(',');
      ex.vzorec = v; ex.drugi = drugi(ex).find(d => k(d.cells) !== k(v.cells));
      if (!${drugim} || ex.drugi || i > 2000) return (zadnja = ex); } }; }`);
  run(`mode = ${JSON.stringify(tehnika)}; exNum = 0; renderExercise();`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const gumb = (dom, napis) => vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vsi(dom.el('exerciseArea')).find(e => /^fb\b/.test(e.className));
// Celice mreže z razredom: pri X-krilu in mečarici indeksi 0-80 (data-idx), drugod indeksi v ex.slots (data-si).
const sRazredom = (dom, razred) => vsi(dom.el('exerciseArea'))
  .filter(e => e.classList.contains(razred)).map(e => +(e.dataset.idx ?? e.dataset.si)).sort((a, b) => a - b);
const besediloResitve = dom => vsi(dom.el('exerciseArea')).filter(e => e.className === 'peek-overlay visible').map(e => e.innerHTML).join('');
function medResitvijo(dom, f) {
  gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
  try { return f(); } finally { gumb(dom, 'Rešitev (drži)').sprozi('mouseup'); }
}

for (const tehnika of ['x-wing', 'swordfish', 'naked-triple']) {
  test(`${tehnika}: brez izbire »Rešitev« pokaže vzorec generatorja (kot prej)`, () => {
    const { dom, run } = zacni(tehnika, { drugim: true });
    const v = run('zadnja.vzorec');
    assert.ok(run('!!zadnja.drugi'), 'vaja ima drug veljaven vzorec');
    medResitvijo(dom, () => {
      assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(v.cells));
      assert.equal(kljuc(sRazredom(dom, 'peek-elim').filter(c => !v.cells.includes(c))), kljuc(v.elim));
    });
    assert.deepEqual(sRazredom(dom, 'peek-hl'), [], 'po spustu ni oznak');
  });

  test(`${tehnika}: z izbranim drugim veljavnim vzorcem ga »Rešitev« pokaže, »Preveri« ga sprejme`, () => {
    const { dom, run } = zacni(tehnika, { drugim: true });
    const d = run('zadnja.drugi');
    run(`selected = ${JSON.stringify(d.cells)}`);
    medResitvijo(dom, () => {
      assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(d.cells), 'celice vzorca so izbrane celice');
      assert.equal(kljuc(sRazredom(dom, 'peek-elim').filter(c => !d.cells.includes(c))), kljuc(d.elim), 'izbris tega vzorca');
      if (tehnika === 'naked-triple') {
        const ds = [...new Set(d.cells.flatMap(si => run(`zadnja.slots[${si}].c`)))].sort((a, b) => a - b);
        assert.equal(besediloResitve(dom), `{${ds.join(', ')}} v ${kljuc(d.cells).split(',').map(si => run(`zadnja.slots[${si}].pos`)).join(', ')}.`);
      }
    });
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(fb(dom).className, /\bok\b/, '»Preveri« sprejme drug vzorec');
    assert.match(fb(dom).innerHTML, /^<b>Pravilno!/);
  });

  test(`${tehnika}: delna izbira iz vzorca generatorja – »Rešitev« pokaže vzorec generatorja`, () => {
    const { dom, run } = zacni(tehnika, { drugim: true });
    const v = run('zadnja.vzorec'), d = run('zadnja.drugi');
    // celica vzorca generatorja, ki ni v drugem vzorcu
    const c = v.cells.find(x => !d.cells.includes(x));
    assert.notEqual(c, undefined, 'vzorec generatorja ni del drugega');
    run(`selected = [${c}]`);
    medResitvijo(dom, () => assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(v.cells)));
  });
}

// Slog izbire je v trening.css eno pravilo s seznamom razredov MODES[].selClass (izbira, pravilno in
// napačno izbrana ob "Rešitvi" - štirje seznami); razred, ki ga ni na seznamih, bi ostal brez sloga.
test('vsak MODES[].selClass je v vseh štirih seznamih razredov izbire v trening/trening.css', () => {
  const fs = require('node:fs'), path = require('node:path');
  const css = fs.readFileSync(path.join(__dirname, '..', 'trening', 'trening.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const seznami = [...css.matchAll(/\.gc(?:\.peek-hl)?:is\(([^)]*)\)/g)].map(m => m[1].split(',').map(s => s.trim().replace(/^\./, '')));
  assert.equal(seznami.length, 4, 'pravilo izbire in tri pravila "Rešitve"');
  const { run } = loadContext(DATOTEKE, makeDom().globals);
  const razredi = [...new Set(run('Object.values(MODES).map(m => m.selClass).filter(Boolean)'))];
  assert.ok(razredi.length >= 10);
  for (const s of seznami) assert.deepEqual([...s].sort(), [...razredi].sort());
});

for (const tehnika of ['naked-pair', 'hidden-pair']) {
  test(`${tehnika}: »Rešitev« pokaže vzorec vaje, besedilo kot prej`, () => {
    const { dom, run } = zacni(tehnika);
    const v = run('zadnja.vzorec');
    medResitvijo(dom, () => {
      assert.equal(kljuc(sRazredom(dom, 'peek-hl')), kljuc(v.cells));
      if (tehnika === 'naked-pair') assert.equal(besediloResitve(dom), run('zadnja.solutionMessage'));
    });
  });
}
