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
  run('exNum++; renderExercise()'); // naslednja vaja kroga
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

/* ---------- 6b: odgovor pri 1-12 ---------- */

// Vaja tehnike iz banke, ki izpolni pogoj (izraz nad `v`), na zaslonu. Iskanje po banki
// po vrsti (brez naključja) - vaja je stanje prave uganke, izbrisi v testu so iz korakov
// motorja (KT, KV) in števk rešitve.
function vajaZ(tehnika, pogoj) {
  const t = zacni(tehnika);
  t.izprazni();
  t.run(`{ const kljuc = TEHNIKA_VAJE[mode]; let najdena = null;
    for (const z of VAJE_BANKA.filter(z => z.tehnike.includes(kljuc))) {
      const { stanja, stopnja } = stanjaVUganki(z.danosti, kljuc);
      for (const st of stanja) { const v = vajaIzStanja(z.danosti, kljuc, st, stopnja); if (v && (${pogoj})) { najdena = v; break; } }
      if (najdena) { najdena.izvor = { vrsta: 'banka', seme: z.seme }; break; }
    }
    izrisiVadi(najdena); }`);
  return t;
}
// Izbrisi iz S0: KT[0] (korak tehnike), neutemeljen (kandidat, ki ni števka rešitve in ga ne
// izbriše noben korak), druge tehnike (izbris koraka iz KV zunaj vseh korakov KT).
const IZBRISI = `(() => {
  const k = e => e[0] * 10 + e[1], vKT = new Set(v.KT.flatMap(s => s.eliminate.map(k))), vKV = new Set(v.KV.flatMap(s => s.eliminate.map(k)));
  let neut = null;
  for (let c = 0; c < 81 && !neut; c++) if (!v.S0.grid[c]) for (let d = 1; d <= 9 && !neut; d++)
    if ((v.S0.kandidati[c] & (1 << d)) && d !== v.resitev[c] && !vKV.has(c * 10 + d)) neut = [c, d];
  const druga = v.KV.flatMap(s => s.eliminate).find(e => !vKT.has(k(e))) || null;
  let prava = null;
  for (let c = 0; c < 81 && !prava; c++) if (!v.S0.grid[c] && (v.S0.kandidati[c] & (1 << v.resitev[c]))) prava = [c, v.resitev[c]];
  return { korak: v.KT[0].eliminate, neut, druga, prava };
})()`;
const izbrisiVaje = run => iz(run, `((v) => ${IZBRISI})(vadi.v)`);

const izberi = (dom, run, c) => {
  if (run('vadi.plosca.enaIzbrana()') !== c) celice(dom)[c].sprozi('click');
  assert.equal(run('vadi.plosca.enaIzbrana()'), c, `izbrana ${c}`);
};
const odstrani = (dom, run, [c, d]) => {
  izberi(dom, run, c);
  poRazredu(dom, 'niz-odstrani')[0].children[d - 1].sprozi('click');
  assert.equal(run(`vadi.stanje.kandidati[${c}] & ${1 << d}`), 0, `odstranjen ${d} iz ${c}`);
};
const jeKand = (run, [c, d]) => !!run(`vadi.stanje.kandidati[${c}] & ${1 << d}`);
const fb = dom => poRazredu(dom, 'fb')[0];
const rezultat = dom => `${dom.el('scoreRight').textContent}/${dom.el('scoreTotal').textContent}`;

test('1-12: šest izidov "Preveri", samodejna razveljavitev, "Poskusi znova", pravilno z zaklepom', () => {
  const { dom, run } = vajaZ('hidden-pair', `v.KT[0].eliminate.length >= 2 && (${IZBRISI}).neut && (${IZBRISI}).druga`);
  const I = izbrisiVaje(run);
  const N = run('vadi.v.igra.zacetnihPotez');
  const preveriBtn = () => gumb(dom, 'Preveri');
  // Niza "Vpiši" ni, niz "Odstrani" je.
  assert.equal(poRazredu(dom, 'niz-vpisi').length, 0);
  assert.equal(poRazredu(dom, 'niz-odstrani')[0].children.length, 9);

  // prazno
  preveriBtn().sprozi('click');
  assert.equal(fb(dom).className, 'fb info');
  assert.equal(fb(dom).innerHTML, 'Odstrani kandidate, ki jih tehnika izloči.');
  assert.equal(preveriBtn().disabled, true, 'Preveri onemogočen do spremembe');
  assert.equal(rezultat(dom), '0/0');

  // delno: en izbris koraka
  odstrani(dom, run, I.korak[0]);
  assert.equal(preveriBtn().disabled, false);
  assert.equal(fb(dom).className, 'fb', 'sporočilo po spremembi izgine');
  preveriBtn().sprozi('click');
  assert.match(fb(dom).innerHTML, /^<b>Še ne\.<\/b> Prav, a to še ni ves korak – manjka/);
  assert.equal(rezultat(dom), '0/0');

  // neutemeljeno: izbris se samodejno vrne kot poteza "vrni", izbris koraka ostane
  odstrani(dom, run, I.neut);
  const kaz = run('vadi.v.igra.kazalec');
  preveriBtn().sprozi('click');
  assert.equal(fb(dom).className, 'fb info');
  assert.equal(fb(dom).innerHTML,
    `Izbris drži, a ga v tem koraku ne utemelji nobena tehnika. Razveljavljeno: ${run(`cellLabel(${I.neut[0]})`)} (${I.neut[1]}).`);
  assert.ok(jeKand(run, I.neut), 'neutemeljen izbris vrnjen');
  assert.ok(!jeKand(run, I.korak[0]), 'izbris koraka ostane');
  assert.equal(run('vadi.v.igra.kazalec'), kaz + 1, 'vrnitev je ena poteza');
  assert.equal(preveriBtn().disabled, true);
  assert.equal(rezultat(dom), '0/0');

  // druga tehnika
  odstrani(dom, run, I.druga);
  preveriBtn().sprozi('click');
  assert.match(fb(dom).innerHTML, /^To drži, a je to korak tehnike .+, ne 4 · Skriti par\. Razveljavljeno: /);
  assert.ok(jeKand(run, I.druga));
  assert.equal(rezultat(dom), '0/0');

  // napačno: prava števka celice; "Poskusi znova" vrne na začetek vaje
  odstrani(dom, run, I.prava);
  preveriBtn().sprozi('click');
  assert.equal(fb(dom).className, 'fb err');
  assert.match(fb(dom).innerHTML, /^<b>Ni pravilno\.<\/b> Števka \d je v V\dS\d prava – tega kandidata ne smeš odstraniti\. $/);
  assert.equal(rezultat(dom), '0/1');
  preveriBtn().sprozi('click');
  assert.equal(rezultat(dom), '0/1', 'isti odgovor se ne šteje dvakrat');
  const znova = fb(dom).children.find(e => e.textContent === 'Poskusi znova');
  znova.sprozi('click');
  assert.equal(run('vadi.v.igra.kazalec'), N);
  assert.ok(jeKand(run, I.prava) && jeKand(run, I.korak[0]));
  assert.equal(preveriBtn().disabled, false);
  assert.equal(fb(dom).className, 'fb');
  assert.ok(run(`lahkoPonovi(vadi.v.igra)`), 'poteze ostanejo v "Ponovi"');

  // pravilno: vsi izbrisi koraka
  for (const e of I.korak) if (jeKand(run, e)) odstrani(dom, run, e);
  preveriBtn().sprozi('click');
  assert.equal(fb(dom).className, 'fb ok');
  assert.equal(fb(dom).innerHTML, `<b>Pravilno!</b> ${run('vadi.v.KT[0].message')}`);
  assert.equal(rezultat(dom), '1/2');
  assert.equal(run('vajaResena'), true);
  assert.equal(poRazredu(dom, 'akcije')[0].hidden, true, 'Razveljavi/Ponovi/Začni znova skriti');
  assert.equal(preveriBtn().style.display, 'none');
  assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
  assert.equal(poRazredu(dom, 'niz-razlog')[0].textContent, 'Vaja je rešena – nadaljuj z »Naslednja vaja«.');
  // Oznake: vzorec koraka, izbrisi rdeče prečrtani; izbire ni več.
  const cs = celice(dom);
  for (const c of run('vadi.v.KT[0].cells')) assert.ok(cs[c].classList.contains('k-vzorec'));
  for (const [c, d] of I.korak) assert.equal(cs[c].children[0].children[d - 1].className, 'kand precrtan k-izbris');
  const prazna = iz(run, 'vadi.stanje.grid').findIndex((x, c) => !x && c !== run('vadi.plosca.enaIzbrana()'));
  const prej = iz(run, 'vadi.plosca.izbrane');
  cs[prazna].sprozi('click');
  assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), prej, 'klik po pravilnem odgovoru izbire ne spremeni');
  assert.equal(celice(dom).filter(e => e.classList.contains('izbrana')).length, 0, 'izbira ni prikazana');
  const kaz2 = run('vadi.v.igra.kazalec');
  dom.tipka({ key: '!', code: 'Digit1', shiftKey: true, preventDefault() {} });
  dom.tipka({ key: 'z', code: 'KeyY', ctrlKey: true, preventDefault() {} });
  assert.equal(run('vadi.v.igra.kazalec'), kaz2, 'po pravilnem odgovoru tipke ne spremenijo igre');
});

test('1-12: tipkovnica (pari QWERTZ), razlog pri vpisu iz prejšnjih korakov, besedila', () => {
  const { dom, run } = vajaZ('naked-pair', 'v.S0.grid.some((x, c) => x && v.danosti[c] === "0")');
  const S0 = iz(run, 'vadi.v.S0');
  // Shift+števka na slovenski razporeditvi: e.key je znak, e.code fizična tipka.
  const QWERTZ = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
  const c = S0.grid.findIndex((x, i) => !x && bits(S0.kandidati[i]).length >= 2);
  const d = bits(S0.kandidati[c])[0];
  izberi(dom, run, c);
  const t = e => dom.tipka({ preventDefault() {}, ...e });
  t({ key: String(d), code: `Digit${d}` });
  t({ key: 'Backspace', code: 'Backspace' });
  assert.equal(run('vadi.v.igra.kazalec'), run('vadi.v.igra.zacetnihPotez'), 'števka brez Shift in Backspace ne naredita nič');
  t({ key: QWERTZ[d], code: `Digit${d}`, shiftKey: true });
  assert.ok(!jeKand(run, [c, d]), 'Shift+števka (QWERTZ) odstrani');
  t({ key: 'z', code: 'KeyY', ctrlKey: true });
  assert.ok(jeKand(run, [c, d]), 'Ctrl+Z (QWERTZ) razveljavi');
  t({ key: 'y', code: 'KeyZ', ctrlKey: true });
  assert.ok(!jeKand(run, [c, d]), 'Ctrl+Y (QWERTZ) ponovi');
  // Vpis iz prejšnjih korakov: razlog pove, da se ne spreminja.
  const danosti = run('vadi.v.danosti');
  const vp = S0.grid.findIndex((x, i) => x && danosti[i] === '0');
  izberi(dom, run, vp);
  assert.equal(poRazredu(dom, 'niz-razlog')[0].textContent,
    `V ${run(`cellLabel(${vp})`)} je vpis iz prejšnjih korakov (${S0.grid[vp]}) – ne spreminja se.`);
  // Besedila zaslona brez "številk", "Prikaži" in angleških imen zunaj oklepaja.
  const besedila = vsi(dom.el('exerciseArea')).map(e => `${e.lastna || ''} ${e.title || ''} ${e.html || ''}`).join(' ');
  assert.doesNotMatch(besedila, /številk|Prikaži/i);
  assert.doesNotMatch(besedila.replace(/\([^)]*\)/g, ''), /Naked|Hidden|Pair|Wing|Swordfish|Rectangle|Turbot|Pointing|Box-line/);
});

/* ---------- 6c: pomoč pri 1-12 ---------- */

const pomocOkvir = dom => poRazredu(dom, 'vadi-pomoc')[0];
const pomocBesedilo = dom => pomocOkvir(dom).textContent;
const sPomocjo = dom => dom.el('scorePomoc').textContent;

test('1-12: Namig s klikom ostane do "Skrij", vaja se ne šteje (že šteti poskus se odšteje)', () => {
  const { dom, run } = vajaZ('hidden-pair', 'v.KT[0].eliminate.length >= 2');
  const I = izbrisiVaje(run);
  assert.equal(pomocOkvir(dom).hidden, true);
  // Napačen poskus se šteje, ogled namiga ga odšteje.
  odstrani(dom, run, I.prava);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(rezultat(dom), '0/1');
  gumb(dom, 'Namig').sprozi('click');
  assert.equal(rezultat(dom), '0/0');
  assert.equal(sPomocjo(dom), ' · s pomočjo: 1');
  assert.equal(pomocOkvir(dom).hidden, false);
  assert.equal(pomocBesedilo(dom), `Namig: ${run('stepHint(vadi.v.KT[0])')}Skrij`);
  // Namig ne pokaže oznak na mreži; ostane ob potezah.
  assert.equal(celice(dom).filter(e => /k-(vzorec|izbris)/.test(e.className)).length, 0);
  gumb(dom, 'Poskusi znova').sprozi('click');
  odstrani(dom, run, I.korak[0]);
  assert.equal(pomocOkvir(dom).hidden, false, 'namig ostane ob potezah');
  gumb(dom, 'Skrij').sprozi('click');
  assert.equal(pomocOkvir(dom).hidden, true);
  // Ponoven ogled se ne šteje dvakrat; pravilen odgovor po pomoči se ne šteje, oznaka.
  gumb(dom, 'Namig').sprozi('click');
  assert.equal(sPomocjo(dom), ' · s pomočjo: 1');
  for (const e of I.korak) if (jeKand(run, e)) odstrani(dom, run, e);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(rezultat(dom), '0/0');
  assert.ok(fb(dom).children.some(c => c.className === 's-pomocjo'), 'oznaka "s pomočjo"');
  assert.equal(pomocOkvir(dom).hidden, true, 'po pravilnem odgovoru se pomoč zapre');
});

test('1-12: Rešitev - oznake in seznam dejanj se osvežijo ob izbrisu, "Korak je izveden", korak z največ izbrisi', () => {
  const { dom, run } = vajaZ('pointing', 'v.KT.length >= 2 && v.KT.every(k => k.eliminate.length >= 2) && v.KT[1].eliminate.every(e => !v.KT[0].eliminate.some(x => x[0] === e[0] && x[1] === e[1]))');
  const K1 = iz(run, 'vadi.v.KT[1]');
  // Igralec je začel drugi korak - rešitev pokaže tega.
  odstrani(dom, run, K1.eliminate[0]);
  gumb(dom, 'Rešitev').sprozi('click');
  assert.equal(sPomocjo(dom), ' · s pomočjo: 1');
  assert.equal(run('JSON.stringify(vadi.v.KT[1].eliminate)'), JSON.stringify(K1.eliminate));
  const besedilo = () => pomocBesedilo(dom);
  assert.ok(besedilo().startsWith(`Rešitev: ${K1.message}`), besedilo());
  assert.match(besedilo(), new RegExp(`Opravljeno: 1 od ${K1.eliminate.length}`));
  // Na mreži samo še neizvedeni izbrisi (rdeče), vzorec jantarno.
  const cs = () => celice(dom);
  const [c0, d0] = K1.eliminate[0], [c1, d1] = K1.eliminate[1];
  assert.ok(cs()[c1].children[0].children[d1 - 1].classList.contains('k-izbris'));
  assert.equal(cs()[c0].children[0].children[d0 - 1].textContent, '', 'izveden izbris ni prikazan');
  for (const c of K1.cells) assert.ok(cs()[c].classList.contains('k-vzorec'));
  // Preostali izbrisi: "Korak je izveden."
  for (const e of K1.eliminate.slice(1)) odstrani(dom, run, e);
  assert.match(besedilo(), /✓ Korak je izveden\./);
  // Skrij: oznak ni več.
  gumb(dom, 'Skrij').sprozi('click');
  assert.equal(cs().filter(e => /k-(vzorec|izbris)/.test(e.className)).length, 0);
  // Pravilen odgovor po ogledu rešitve se ne šteje.
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).className, 'fb ok');
  assert.equal(rezultat(dom), '0/0');
});

test('1-12: ogled rešitve po pravilnem odgovoru ne šteje kot pomoč', () => {
  const { dom, run } = vajaZ('naked-pair', 'true');
  const I = izbrisiVaje(run);
  for (const e of I.korak) if (jeKand(run, e)) odstrani(dom, run, e);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(rezultat(dom), '1/1');
  gumb(dom, 'Rešitev').sprozi('click');
  gumb(dom, 'Namig').sprozi('click');
  assert.equal(rezultat(dom), '1/1');
  assert.equal(sPomocjo(dom), '');
});
