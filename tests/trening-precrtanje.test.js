'use strict';
// Prečrtanje števke izbrisa ob "Rešitvi (drži)" v "Spoznaj" 3-12 (trening/trening.js,
// docs/precrtanje-resitev-nacrt.md): med "Rešitvijo" dobijo male števke izbrisa razred
// peek-izbris (rdeče prečrtano kot .cd.elim), peekOff ga odstrani; elim po pravilnem odgovoru
// ostane tudi po ogledu "Rešitve" in spustu. Pričakovani izbris se tu izračuna neodvisno od
// trening.js: pri 9-12 iz koraka vaje (solutionEliminate), pri očitnem paru in trojici (3, 5)
// števke vzorca v drugih celicah enote (tudi pri drugem veljavnem vzorcu), pri skritih (4, 6)
// druge števke v celicah vzorca. Pri X-krilu in mečarici (7, 8) male števke ni - prečrta CSS
// celice, kar preverja tools/preveri-izbira-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { odpriPomoc, zapriPomoc, medPomocjo } = require('./pomoc-stikali.js');
const { spremljajVajo, odgovoriPravilno, dokoncajOdgovor, dokoncajDrugoFazo } = require('./odgovor-spoznaj.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

// Drug veljaven očitni vzorec (pickN celic z natanko pickN kandidati), ki ni vzorec generatorja.
const DRUGI_OCITNI = `ex => { const p = ex.slots.map((s, i) => s.c ? i : -1).filter(i => i >= 0), n = ex.targetSlots.length, out = [];
  (function nabori(od, nabor) { if (nabor.length === n) { if (new Set(nabor.flatMap(i => ex.slots[i].c)).size === n) out.push(nabor); return; }
    for (let k = od; k < p.length; k++) nabori(k + 1, [...nabor, p[k]]); })(0, []);
  const k = a => [...a].sort((x, y) => x - y).join(); return out.find(c => k(c) !== k(ex.targetSlots)); }`;

// Vaja tehnike (zadnja = vaja, ki jo je dal generator); z drugim = true generator ponavlja, dokler
// vaja nima drugega veljavnega očitnega vzorca (zadnja.drugi). Vaja 7 kroga (exNum = 6): vaji 1 in 2
// sta od dela A načrta docs/trening-ucenje-nacrt.md po shemi (mimo MODES[].gen), vaja 7 je iste vrste.
function zacni(tehnika, seme, { drugim = false } = {}) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen, drugi = ${drugim ? DRUGI_OCITNI : '() => undefined'};
    MODES[${JSON.stringify(tehnika)}].gen = n => { for (let i = 0; ; i++) { const ex = g(n); ex.drugi = drugi(ex);
      if (!${drugim} || ex.drugi || i > 2000) return (zadnja = ex); } }; }`);
  spremljajVajo(run);
  run(`mode = ${JSON.stringify(tehnika)}; exNum = 6; renderExercise();`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const gumb = (dom, napis) => vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vsi(dom.el('exerciseArea')).find(e => /^fb\b/.test(e.className));
// Male števke z razredom kot "si:števka" (si = indeks v ex.slots, data-si celice).
function stevke(dom, razred) {
  const out = [];
  for (const cel of vsi(dom.el('exerciseArea')).filter(e => e.dataset && e.dataset.si !== undefined)) {
    for (const cd of vsi(cel)) if (cd.classList && cd.classList.contains('cd') && cd.classList.contains(razred)) out.push(`${cel.dataset.si}:${cd.dataset.d}`);
  }
  return out.sort();
}
const celice = (dom, razred) => vsi(dom.el('exerciseArea'))
  .filter(e => e.dataset && e.dataset.si !== undefined && e.classList.contains(razred)).map(e => +e.dataset.si).sort((a, b) => a - b);
const medResitvijo = (dom, f) => medPomocjo(dom, 'resitev', f);
const pari = p => [...p].map(([si, d]) => `${si}:${d}`).sort();
// Izbris očitnega vzorca (celice cells, števke ds): števke ds v drugih celicah enote.
const izbrisOcitnih = (run, cells, ds) => pari(run('zadnja.slots').flatMap((s, si) =>
  cells.includes(si) || !s.c ? [] : s.c.filter(d => ds.includes(d)).map(d => [si, d])));
const SEMENA = [7, 11, 23];

// Po pravilnem odgovoru so prečrtane (elim) iste števke; ogled "Rešitve" in spust elim ne spremenita.
function poOdgovoru(dom, pricakovano) {
  assert.match(fb(dom).className, /\bok\b/, 'pravilen odgovor');
  assert.deepEqual(stevke(dom, 'elim'), pricakovano, 'po pravilnem odgovoru prečrtan izbris');
  medResitvijo(dom, () => assert.deepEqual(stevke(dom, 'elim'), pricakovano, 'elim ob »Rešitvi« ostane'));
  assert.deepEqual(stevke(dom, 'elim'), pricakovano, 'elim po spustu ostane');
  assert.deepEqual(stevke(dom, 'peek-izbris'), [], 'po spustu brez peek-izbris');
}

for (const tehnika of ['turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle']) {
  for (const seme of SEMENA) {
    test(`${tehnika} (seme ${seme}): »Rešitev« prečrta števke iz koraka vaje, spust jih odstrani, elim po odgovoru ostane`, () => {
      const { dom, run } = zacni(tehnika, seme);
      const si = new Map(run('zadnja.slots').map((s, i) => [s.idx, i]));
      const izbris = pari(run('zadnja.solutionEliminate').map(([c, d]) => [si.get(c), d]));
      assert.ok(izbris.length > 0);
      medResitvijo(dom, () => {
        assert.deepEqual(stevke(dom, 'peek-izbris'), izbris, 'prečrtane natanko števke izbrisa');
        assert.deepEqual(celice(dom, 'peek-elim'), [...new Set(izbris.map(k => +k.split(':')[0]))].sort((a, b) => a - b), 'celice izbrisa');
      });
      assert.deepEqual(stevke(dom, 'peek-izbris'), [], 'po spustu brez prečrtanih');
      assert.deepEqual(celice(dom, 'peek-elim'), []);
      odgovoriPravilno(dom, run);
      poOdgovoru(dom, izbris);
      medResitvijo(dom, () => assert.deepEqual(stevke(dom, 'peek-izbris'), izbris, '»Rešitev« po odgovoru'));
    });
  }
}

for (const tehnika of ['naked-pair', 'naked-triple']) {
  for (const seme of SEMENA) {
    test(`${tehnika} (seme ${seme}): »Rešitev« pokaže izbris – celice rožnate, števke vzorca v njih prečrtane; elim po odgovoru ostane`, () => {
      const { dom, run } = zacni(tehnika, seme);
      const cells = run('zadnja.targetSlots'), izbris = izbrisOcitnih(run, cells, run('zadnja.targetDigits'));
      assert.ok(izbris.length > 0, 'vaja ima izbris');
      medResitvijo(dom, () => {
        assert.deepEqual(celice(dom, 'peek-hl'), [...cells].sort((a, b) => a - b));
        assert.deepEqual(stevke(dom, 'peek-izbris'), izbris, 'prečrtane natanko števke izbrisa');
        assert.deepEqual(celice(dom, 'peek-elim'), [...new Set(izbris.map(k => +k.split(':')[0]))].sort((a, b) => a - b), 'celice izbrisa rožnate');
      });
      assert.deepEqual(stevke(dom, 'peek-izbris'), []);
      assert.deepEqual(celice(dom, 'peek-elim'), []);
      odgovoriPravilno(dom, run);
      poOdgovoru(dom, izbris);
    });
  }
}

// Drug veljaven vzorec ima samo vaja trojice (generator para ga v 2000 vajah ne da).
test('naked-triple: z izbranim drugim veljavnim vzorcem »Rešitev« prečrta njegov izbris', () => {
  const { dom, run } = zacni('naked-triple', 7, { drugim: true });
  const d = run('zadnja.drugi');
  assert.ok(d, 'vaja ima drug veljaven vzorec');
  const ds = [...new Set(d.flatMap(si => run(`zadnja.slots[${si}].c`)))];
  const izbris = izbrisOcitnih(run, d, ds);
  run(`selected = ${JSON.stringify(d)}`);
  medResitvijo(dom, () => {
    assert.deepEqual(celice(dom, 'peek-hl'), [...d].sort((a, b) => a - b));
    assert.deepEqual(stevke(dom, 'peek-izbris'), izbris);
  });
  dokoncajOdgovor(dom, run);
  poOdgovoru(dom, izbris);
});

for (const tehnika of ['hidden-pair', 'hidden-triple']) {
  for (const seme of SEMENA) {
    test(`${tehnika} (seme ${seme}): »Rešitev« prečrta druge števke v celicah vzorca (celice ostanejo jantarne); elim po 2. fazi ostane`, () => {
      const { dom, run } = zacni(tehnika, seme);
      const cells = run('zadnja.targetSlots'), ds = run('zadnja.targetDigits');
      const izbris = pari(cells.flatMap(si => run(`zadnja.slots[${si}].c`).filter(d => !ds.includes(d)).map(d => [si, d])));
      assert.ok(izbris.length > 0, 'vaja ima izbris');
      medResitvijo(dom, () => {
        assert.deepEqual(celice(dom, 'peek-hl'), [...cells].sort((a, b) => a - b));
        assert.deepEqual(celice(dom, 'peek-elim'), [], 'celice brez rožnate podlage');
        assert.deepEqual(stevke(dom, 'peek-izbris'), izbris, 'prečrtane natanko druge števke');
      });
      assert.deepEqual(stevke(dom, 'peek-izbris'), []);
      run(`selected = [...zadnja.targetSlots]`);
      gumb(dom, 'Preveri').sprozi('click');
      assert.deepEqual(stevke(dom, 'elim'), [], 'po 1. fazi še ni izbrisa');
      dokoncajDrugoFazo(dom, run);
      poOdgovoru(dom, izbris);
    });
  }
}
