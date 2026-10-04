'use strict';
// Faza 6, korak b (docs/faza6-besedila.md) v »Spoznaj« (trening/trening.js), v nadomestnem DOM-u:
//   - legenda oznak pod »Rešitvijo (drži)« in pod »Pravilno!« pri 1-12: našteje samo vrste celic,
//     ki so takrat na mreži (pri 3-12 legendaOznak(), pri 1 in 2 legendaKoraka()); E1 in E2 je
//     nimata;
//   - razdelek »Razlaga« pod nalogo (razlaga in posledica): privzeto zaprt, odprt ostane med
//     vajami kroga, nov krog ga zapre, ogled ne šteje kot pomoč;
//   - namig pri 7 in 8 (E4): šteje po vrsticah in stolpcih, besedilo po tehniki - pri vaji z
//     vrsticami in pri vaji s stolpci.
// Barve vzorčkov legende (enake celicam) preverja tools/preveri-izbira-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

// Vaja tehnike s semenom; pogoj (koda v kontekstu, ex => bool) - generator ponavlja, dokler ga
// vaja ne izpolni (zadnja = vaja na zaslonu).
function zacni(tehnika, seme = 7, pogoj = 'ex => true') {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(`var zadnja; { const g = MODES[${JSON.stringify(tehnika)}].gen, p = ${pogoj};
    MODES[${JSON.stringify(tehnika)}].gen = n => { for (let i = 0; ; i++) { const ex = g(n); if (p(ex) || i > 500) return (zadnja = ex); } }; }`);
  run(`zacniKrog(${JSON.stringify(tehnika)}, 'spoznaj')`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const vse = dom => vsi(dom.el('exerciseArea'));
const gumb = (dom, napis) => vse(dom).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vse(dom).find(e => /^fb\b/.test(e.className));
const videnOkvir = dom => vse(dom).find(e => e.className === 'peek-overlay visible');
// Legende v elementu: [[razred vzorčka, besedilo], ...] za vsako legendo.
const legende = el => vsi(el).filter(e => e.className === 'legenda-vaje')
  .map(l => l.children.map(p => [p.children[0].className, p.children[1].textContent]));
const besedila = l => l.map(([, b]) => b);
function medResitvijo(dom, f) {
  gumb(dom, 'Rešitev (drži)').sprozi('mousedown');
  try { return f(); } finally { gumb(dom, 'Rešitev (drži)').sprozi('mouseup'); }
}
// Pravilen odgovor z izbiro v stanju (kot v drugih testih »Spoznaj«) in klikom »Preveri«.
function odgovori(dom, run, tehnika) {
  if (tehnika === 'x-wing' || tehnika === 'swordfish') {
    run(`selected = (zadnja.rect || zadnja.sfCells).map(([r, c]) => r * 9 + c)`);
  } else if (['turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'].includes(tehnika)) {
    run('selected = zadnja.solutionCells.map(c => zadnja.slots.findIndex(s => s.idx === c))');
  } else {
    run('selected = [...zadnja.targetSlots]');
  }
  gumb(dom, 'Preveri').sprozi('click');
  if (tehnika === 'hidden-pair' || tehnika === 'hidden-triple') {
    run('pickedDigits = [...zadnja.targetDigits]');
    gumb(dom, tehnika === 'hidden-pair' ? 'Preveri dve števki' : 'Preveri tri števke').sprozi('click');
  }
  assert.match(fb(dom).className, /\bok\b/, `${tehnika}: pravilen odgovor`);
}

// Pričakovane postavke (neodvisno od kode, po pomenu oznak pri tehniki): ob »Rešitvi« brez izbire
// celice vzorca, celice izbrisa (pri skritih ni - izbris je v celicah vzorca) in prečrtana števka;
// po odgovoru izbrane celice, celice z izbrisom (pri 3-6 brez podlage) in izbrisani kandidati.
const SKRITI = ['hidden-pair', 'hidden-triple'];
const S_CELICO_IZBRISA = ['x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
for (const tehnika of ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish',
  'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle']) {
  test(`legenda ${tehnika}: ob »Rešitvi« brez izbire in po pravilnem odgovoru samo oznake na mreži`, () => {
    const { dom, run } = zacni(tehnika);
    // Pri skritih je izbris v celicah vzorca, pri 12 v četrtem vogalu, ki je tudi vzorec (videti je kot
    // vzorec) - postavke »celica izbrisa« tam ni.
    const resitev = [...SKRITI, 'unique-rectangle'].includes(tehnika) ? ['celice vzorca', 'kandidat za izbris'] : ['celice vzorca', 'celica izbrisa', 'kandidat za izbris'];
    medResitvijo(dom, () => {
      const l = legende(videnOkvir(dom));
      assert.equal(l.length, 1, 'ena legenda v okvirju »Rešitve«');
      assert.deepEqual(besedila(l[0]), resitev);
      assert.equal(l[0][0][0], 'sw sw-vzorec');
      const [razred] = l[0][l[0].length - 1];
      assert.equal(razred, 'izbris-vzorec', 'zadnja postavka je prečrtana števka');
    });
    // Ponoven ogled ne podvoji legende.
    medResitvijo(dom, () => assert.equal(legende(videnOkvir(dom)).length, 1));
    odgovori(dom, run, tehnika);
    const po = legende(fb(dom));
    assert.equal(po.length, 1, 'ena legenda pod »Pravilno!«');
    assert.deepEqual(besedila(po[0]), S_CELICO_IZBRISA.includes(tehnika)
      ? ['izbrane celice', 'celica z izbrisom', 'izbrisani kandidati'] : ['izbrane celice', 'izbrisani kandidati']);
    assert.equal(po[0][0][0], 'sw sw-pravilno');
    // Pri 9-12 ima celica z izbrisom rdeč okvir (.gc.elimcell), pri 7 in 8 ne (.xw-elim).
    if (S_CELICO_IZBRISA.includes(tehnika)) {
      assert.equal(po[0][1][0], ['x-wing', 'swordfish'].includes(tehnika) ? 'sw sw-izbris' : 'sw sw-izbris-okvir');
    }
  });
}

// Izbira s kliki (razredi izbire na celicah - kot v brskalniku). Pri skritem paru izbris ni v
// drugih celicah, zato je izbrana druga celica »napačno izbrana«; pri očitnem paru ima vsaka druga
// celica enote kakšno števko para (generator), zato je izbrana druga celica celica izbrisa.
const celicaVaje = (dom, si) => vse(dom).find(e => e.dataset && e.dataset.si === si);
test('legenda ob »Rešitvi« z izbiro (skriti par): pravilno izbrana, spregledana, napačno izbrana', () => {
  const { dom, run } = zacni('hidden-pair', 7);
  const t = run('zadnja.targetSlots');
  const druga = run('zadnja.slots').findIndex((s, i) => s.c && !t.includes(i));
  celicaVaje(dom, t[0]).sprozi('click');
  celicaVaje(dom, druga).sprozi('click');
  medResitvijo(dom, () => assert.deepEqual(besedila(legende(videnOkvir(dom))[0]),
    ['pravilno izbrana celica', 'spregledana celica vzorca', 'napačno izbrana celica', 'kandidat za izbris']));
});

test('legenda ob »Rešitvi« z izbiro (očitni par): napačno izbrana celica izbrisa', () => {
  const { dom, run } = zacni('naked-pair', 7);
  const t = run('zadnja.targetSlots'), ds = run('zadnja.targetDigits'), slots = run('zadnja.slots');
  const izbrisa = slots.map((s, i) => i).filter(i => slots[i].c && !t.includes(i) && slots[i].c.some(d => ds.includes(d)));
  assert.ok(izbrisa.length > 0, 'vaja ima celico izbrisa');
  celicaVaje(dom, t[0]).sprozi('click');
  celicaVaje(dom, izbrisa[0]).sprozi('click');
  medResitvijo(dom, () => assert.deepEqual(besedila(legende(videnOkvir(dom))[0]),
    ['pravilno izbrana celica', 'spregledana celica vzorca', 'napačno izbrana celica izbrisa',
      ...(izbrisa.length > 1 ? ['celica izbrisa'] : []), 'kandidat za izbris']));
});

for (const tehnika of ['pointing', 'box-line']) {
  test(`legenda ${tehnika}: ob »Rešitvi« vzorec in kandidat za izbris, po odgovoru izbrisani kandidati`, () => {
    const { dom, run } = zacni(tehnika);
    medResitvijo(dom, () => assert.deepEqual(besedila(legende(videnOkvir(dom))[0]), ['celice vzorca', 'kandidat za izbris']));
    run('selected = [...zadnja.solutionCells]');
    gumb(dom, 'Preveri').sprozi('click');
    assert.match(fb(dom).className, /\bok\b/);
    assert.deepEqual(legende(fb(dom)).map(besedila), [['celice vzorca', 'izbrisani kandidati']]);
  });
}

test('E1 in E2 nimata legende (kot v »Vadi v uganki«)', () => {
  for (const tehnika of ['naked-single', 'hidden-single']) {
    const { dom } = zacni(tehnika);
    medResitvijo(dom, () => assert.deepEqual(legende(videnOkvir(dom)), [], tehnika));
  }
});

test('razdelek »Razlaga«: zaprt, razlaga in posledica, odprt ostane med vajami kroga, ne šteje kot pomoč', () => {
  const { dom, run } = zacni('x-wing');
  const razlaga = () => vse(dom).find(e => e.className === 'razlaga-tehnike');
  const r = razlaga();
  assert.equal(r.tagName, 'DETAILS');
  assert.equal(r.open, false, 'privzeto zaprt');
  assert.deepEqual(r.children.map(c => c.textContent),
    ['Razlaga', run('TEHNIKE_OPISI["x-wing"].razlaga'), run('TEHNIKE_OPISI["x-wing"].posledica')]);
  // Pod nalogo povzetek in opis naloge (X-krilo ima lasten opis s števko).
  assert.match(vse(dom)[0].innerHTML, new RegExp(`<p class="desc">${run('TEHNIKE_OPISI["x-wing"].povzetek').replace(/[()]/g, '\\$&')} Števka \\d: poišči `));
  r.open = true; r.sprozi('toggle');
  assert.equal(run('pomocVaje'), false, 'ogled razlage ni pomoč');
  odgovori(dom, run, 'x-wing');
  assert.equal(run('scoreRight') + '/' + run('scoreTotal'), '1/1', 'vaja se šteje');
  gumb(dom, 'Naslednja vaja →').sprozi('click');
  assert.equal(razlaga().open, true, 'odprt ostane v naslednji vaji kroga');
  run(`zacniKrog('x-wing', 'spoznaj')`);
  assert.equal(razlaga().open, false, 'nov krog - zaprt');
});

// E4: namig pri 7 in 8 šteje pojavitve po vrsticah in stolpcih (vaja je lahko v obeh smereh).
const NAMIG_ISCI = {
  'x-wing': 'Poišči dve vrstici ali dva stolpca, v katerih je števka natanko dvakrat.',
  'swordfish': 'Poišči tri vrstice ali tri stolpce, v katerih je števka dvakrat ali trikrat, vse v istih treh stolpcih (vrsticah).',
};
for (const tehnika of ['x-wing', 'swordfish']) {
  for (const vrstice of [true, false]) {
    test(`namig ${tehnika}, vaja ${vrstice ? 'z vrsticami' : 's stolpci'}: štetje po vrsticah in stolpcih, besedilo po tehniki`, () => {
      // Smer da generator po številki vaje (soda - vrstice, liha - stolpci): druga vaja kroga.
      const { dom, run } = zacni(tehnika, 3);
      if (!vrstice) { run('exNum = 1'); run('renderExercise()'); }
      assert.equal(run('zadnja.baseIsRow'), vrstice, 'vaja v želeni smeri');
      const grid = run('zadnja.grid'), bases = run('zadnja.bases');
      gumb(dom, 'Namig (drži)').sprozi('mousedown');
      const namig = videnOkvir(dom).innerHTML;
      gumb(dom, 'Namig (drži)').sprozi('mouseup');
      const [delV, delS] = namig.split(' · po stolpcih: ');
      assert.ok(delV.startsWith(`Pojavitve ${run('zadnja.digit')} po vrsticah: `) && delS, namig);
      assert.ok(namig.endsWith(NAMIG_ISCI[tehnika]), namig);
      // Vsaka osnovna vrstica (stolpec) vzorca je v svojem delu s pravim številom pojavitev.
      for (const b of bases) {
        let n = 0;
        for (let i = 0; i < 9; i++) if (grid[vrstice ? b * 9 + i : i * 9 + b]) n++;
        assert.ok((vrstice ? delV : delS).includes(`${vrstice ? 'V' : 'S'}${b + 1}:${n}×`), `${namig} (osnova ${b + 1})`);
      }
    });
  }
}
