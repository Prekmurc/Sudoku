'use strict';
// Trening »Vadi v uganki« (trening/v-uganki.js, docs/vadi-v-uganki-nacrt.md) v
// nadomestnem DOM-u (dom-stub.js): iskanje vaje (sproti in banka po meji), zaslon vaje
// (1-12 s kandidati stanja S0, E1/E2 brez), vrstica s številom prej odstranjenih
// kandidatov in "pokaži prečrtane", krog in "Končano!". Vaje so iz pravih ugank (banka
// in minimalne uganke iz semen), nič ni sestavljeno na pamet. Videza (CSS) test ne vidi -
// to preveri tools/preveri-vadi-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v trening/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

// Math.random s semenom (mulberry32) - v kontekstu, pred vajo.
const SEME = s => `{ let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; }`;

// Kontekst treninga; setTimeout gre v vrsto, ki jo test izprazni (iskanje vaje).
// banka: true = meja iskanja je takoj presežena (vaja iz banke), false = ura stoji
// (iskanje sproti, dokler ne najde).
function zacni(tehnika, { banka = true, seme = 1, shramba } = {}) {
  const dom = makeDom(shramba);
  const vrsta = [];
  dom.globals.setTimeout = f => { vrsta.push(f); return vrsta.length; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run(banka ? 'vadiZdaj = (() => { let t = 0; return () => (t += 5000); })()' : 'vadiZdaj = () => 0');
  const izprazni = () => { for (let i = 0; i < 10000 && vrsta.length; i++) vrsta.shift()(); assert.equal(vrsta.length, 0, 'iskanje se konča'); };
  run(`zacniKrog(${JSON.stringify(tehnika)}, 'uganka')`);
  return { dom, run, vrsta, izprazni };
}

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const najdi = (dom, f) => vsi(dom.el('exerciseArea')).filter(f);
const poRazredu = (dom, r) => najdi(dom, e => new RegExp(`(^|\\s)${r}(\\s|$)`).test(e.className));
const gumb = (dom, napis) => {
  const g = najdi(dom, e => e.tagName === 'BUTTON' && e.textContent === napis)[0];
  assert.ok(g, `gumb "${napis}"`);
  return g;
};
const iz = (run, izraz) => JSON.parse(run(`JSON.stringify(${izraz})`));
// Celice mreže vaje (indeks = celica 0-80).
const celice = dom => {
  const a = [];
  for (const e of poRazredu(dom, 'celica')) if (e.dataset.r !== undefined) a[+e.dataset.r * 9 + +e.dataset.c] = e;
  return a;
};
const bits = m => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => m & (1 << d));

test('iskanje: "Iščem vajo …", nato vaja; ob preseženi meji iz banke', () => {
  const { dom, run, izprazni } = zacni('hidden-pair');
  assert.equal(run('nacin'), 'uganka');
  assert.equal(poRazredu(dom, 'vadi-isce')[0].textContent, 'Iščem vajo …');
  assert.equal(run('vadi'), null);
  izprazni();
  assert.equal(poRazredu(dom, 'vadi-isce').length, 0);
  assert.equal(run('vadi.v.izvor.vrsta'), 'banka');
  assert.ok(run('VAJE_BANKA.some(z => z.seme === vadi.v.izvor.seme && z.tehnike.includes("Hidden pair"))'));
  assert.equal(poRazredu(dom, 'ex-label')[0].textContent, '4 · Skriti par (Hidden Pair) · Vadi v uganki · Vaja 1 / 9');
  // V S0 je naslednji korak motorja izbrana tehnika.
  assert.equal(run('nextStep(vadi.v.S0.deska).technique'), 'Hidden pair');
  assert.equal(najdi(dom, e => e.tagName === 'H3')[0].textContent,
    'Poišči korak tehnike Skriti par in odstrani kandidate, ki jih izloči.');
  assert.equal(poRazredu(dom, 'desc')[0].textContent, run('TEHNIKE_OPISI["hidden-pair"].razlaga'));
  // Stopnja uganke (informacija), izvor v title.
  const info = poRazredu(dom, 'vaja-info')[0];
  assert.equal(info.children[0].textContent, `Uganka: ${run('vadi.v.stopnja')}`);
  assert.equal(run('vadi.v.stopnja'), run('VAJE_BANKA.find(z => z.seme === vadi.v.izvor.seme).stopnja'));
  assert.match(info.children[0].title, /^Vaja iz banke \(seme \d+\)$/);
});

test('iskanje sproti: minimalna uganka iz semena z vajo tehnike', () => {
  const { run, izprazni } = zacni('naked-single', { banka: false });
  izprazni();
  assert.equal(run('vadi.v.izvor.vrsta'), 'sproti');
  const seme = run('vadi.v.izvor.seme');
  assert.equal(run('vadi.v.danosti'), run(`genMinimalnaUganka(${seme})`));
  assert.equal(run('nextStep(vadi.v.S0.deska).technique'), 'Gol enojček');
  assert.equal(run('countSolutions(vadi.v.danosti)'), 1);
});

test('banka: zapisi se ne ponovijo, dokler jih je; nato znova', () => {
  const { run, izprazni } = zacni('swordfish');
  izprazni();
  const n = run('VAJE_BANKA.filter(z => z.tehnike.includes("Swordfish")).length');
  const semena = iz(run, `[vadi.v.izvor.seme, ...Array.from({ length: ${n - 1} }, () => vajaIzBanke('Swordfish').izvor.seme)]`);
  assert.equal(new Set(semena).size, n, 'vsak zapis enkrat');
  assert.equal(run('vadiUporabljene["Swordfish"].size'), n);
  run('vajaIzBanke("Swordfish")');
  assert.equal(run('vadiUporabljene["Swordfish"].size'), 1, 'ko jih zmanjka, se izbira začne znova');
});

test('prekinitev: "Nazaj" in nova vaja ustavita staro iskanje', () => {
  const { dom, run, vrsta } = zacni('x-wing', { banka: false });
  assert.ok(vrsta.length);
  dom.klikni('backBtn');
  while (vrsta.length) vrsta.shift()();
  assert.equal(run('vadi'), null);
  assert.equal(poRazredu(dom, 'vadi-isce').length, 1, 'zaslon ostane, kot je bil');
});

test('1-12: mreža s kandidati S0, vpisi poti, prej odstranjeni in "pokaži prečrtane"', () => {
  const { dom, run, izprazni } = zacni('hidden-pair');
  izprazni();
  const S0 = iz(run, '{ grid: vadi.v.S0.grid, kandidati: vadi.v.S0.kandidati, odstr: vadi.v.S0.zacetni.odstranjeni }');
  const danosti = run('vadi.v.danosti');
  const cs = celice(dom);
  assert.equal(cs.length, 81);
  for (let c = 0; c < 81; c++) {
    if (S0.grid[c]) {
      assert.equal(cs[c].textContent, String(S0.grid[c]));
      assert.ok(cs[c].classList.contains(danosti[c] === '0' ? 'vpis' : 'dana'), `V${c}`);
    } else {
      const k = cs[c].children[0].children.map(s => +s.textContent || 0).filter(Boolean);
      assert.deepEqual(k, bits(S0.kandidati[c]), `kandidati celice ${c}`);
    }
  }
  // Prej odstranjeni: število in sklanjanje, kljukica.
  const n = run('vadi.v.prejOdstranjenih');
  assert.equal(S0.odstr.reduce((s, m) => s + bits(m).length, 0), n);
  assert.ok(n > 0);
  const info = poRazredu(dom, 'vaja-info')[0];
  assert.equal(info.children[1].textContent, run(`prejOdstranjenihBesedilo(${n})`));
  const kljukica = info.children[2].children[0];
  assert.equal(kljukica.checked, false);
  assert.equal(poRazredu(dom, 'precrtan').length, 0);
  kljukica.checked = true;
  kljukica.sprozi('change');
  const precrtani = poRazredu(dom, 'precrtan');
  assert.equal(precrtani.length, n);
  for (let c = 0; c < 81; c++) {
    for (const d of bits(S0.odstr[c])) assert.equal(celice(dom)[c].children[0].children[d - 1].className, 'kand precrtan');
  }
  // Kljukica ostane med vajami kroga.
  gumb(dom, 'Naslednja vaja →').sprozi('click');
  izprazni();
  const info2 = poRazredu(dom, 'vaja-info')[0];
  if (run('vadi.v.prejOdstranjenih')) {
    assert.equal(info2.children[2].children[0].checked, true);
    assert.equal(poRazredu(dom, 'precrtan').length, run('vadi.v.prejOdstranjenih'));
  }
  // Nova tehnika (nov krog) kljukico izklopi.
  run('zacniKrog("hidden-pair", "uganka")');
  izprazni();
  assert.equal(run('precrtaniKrog'), false);
});

test('sklanjanje števila prej odstranjenih kandidatov', () => {
  const { run } = zacni('hidden-pair');
  const b = n => run(`prejOdstranjenihBesedilo(${n})`);
  assert.equal(b(0), 'V tem stanju ni prej odstranjenih kandidatov.');
  assert.equal(b(1), 'V tem stanju je že odstranjen 1 kandidat (prejšnji koraki).');
  assert.equal(b(2), 'V tem stanju sta že odstranjena 2 kandidata (prejšnji koraki).');
  assert.equal(b(3), 'V tem stanju so že odstranjeni 3 kandidati (prejšnji koraki).');
  assert.equal(b(4), 'V tem stanju so že odstranjeni 4 kandidati (prejšnji koraki).');
  assert.equal(b(5), 'V tem stanju je že odstranjenih 5 kandidatov (prejšnji koraki).');
  assert.equal(b(11), 'V tem stanju je že odstranjenih 11 kandidatov (prejšnji koraki).');
  assert.equal(b(101), 'V tem stanju je že odstranjen 101 kandidat (prejšnji koraki).');
  assert.equal(b(102), 'V tem stanju sta že odstranjena 102 kandidata (prejšnji koraki).');
});

for (const [mode, kljuc] of [['naked-single', 'Gol enojček'], ['hidden-single', 'Skriti enojček']]) {
  test(`${mode}: mreža brez kandidatov, izbrati je mogoče samo prazne celice, brez vrstice o kandidatih`, () => {
    const { dom, run, izprazni } = zacni(mode);
    izprazni();
    assert.equal(run('nextStep(vadi.v.S0.deska).technique'), kljuc);
    assert.equal(run('vadi.v.prejOdstranjenih'), 0, 'čisto stanje');
    assert.equal(vsi(poRazredu(dom, 'mreza')[0]).filter(e => /\bkand\b/.test(e.className)).length, 0, 'v mreži ni kandidatov');
    assert.equal(poRazredu(dom, 'vaja-info')[0].children.length, 1, 'samo stopnja uganke');
    const grid = iz(run, 'vadi.v.S0.grid');
    const cs = celice(dom);
    for (const c of [grid.findIndex(v => v), grid.findIndex(v => !v)]) {
      cs[c].sprozi('click');
      assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), grid[c] ? [] : [c]);
      cs[c].sprozi('click');
    }
  });
}

test('krog: 9 vaj, nato "Končano!"', () => {
  const { dom, run, izprazni } = zacni('naked-single');
  for (let i = 0; i < 9; i++) {
    izprazni();
    assert.equal(poRazredu(dom, 'ex-label')[0].textContent.endsWith(`Vaja ${i + 1} / 9`), true);
    gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').sprozi('click');
  }
  assert.match(dom.el('exerciseArea').children[0].innerHTML, /Končano!/);
  assert.equal(run('vadi'), null);
});

test('"Spoznaj" iz istega konteksta ostane sestavljena vaja', () => {
  const { dom, run, izprazni } = zacni('naked-pair');
  izprazni();
  run('zacniKrog("naked-pair", "spoznaj")');
  assert.equal(run('nacin'), 'spoznaj');
  assert.equal(run('vadi'), null);
  assert.match(dom.el('exerciseArea').children[0].innerHTML, /<p class="ex-label">3 · Očitni par \(Naked Pair\) · Vaja 1 \/ 9<\/p>/);
  assert.equal(poRazredu(dom, 'vaja-uganka').length, 0);
});
