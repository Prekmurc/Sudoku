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
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

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
  // Vaja 1: navodilo pove enoto koraka (območje), pod njim povzetek tehnike in poved, da je
  // območje označeno; razlaga in posledica sta v zaprtem razdelku "Razlaga" (faza 6).
  assert.match(najdi(dom, e => e.tagName === 'H3')[0].textContent,
    /^V (vrstici|stolpcu|bloku) \d poišči skriti par in izbriši kandidate, ki zaradi njega odpadejo\.$/);
  assert.equal(poRazredu(dom, 'desc')[0].textContent, run('TEHNIKE_OPISI["hidden-pair"].povzetek') + ' Območje je na mreži uokvirjeno.');
  const razlaga = poRazredu(dom, 'razlaga-tehnike')[0];
  assert.equal(razlaga.open, false, 'razdelek Razlaga je privzeto zaprt');
  assert.deepEqual(razlaga.children.map(c => c.textContent),
    ['Razlaga', run('TEHNIKE_OPISI["hidden-pair"].razlaga'), run('TEHNIKE_OPISI["hidden-pair"].posledica')]);
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
  assert.equal(info.children[1].textContent, run(`prejOdstranjenihBesedilo(${n}, true)`), 'besedilo pove, da prečrtani niso del naloge');
  assert.match(info.children[1].textContent, /niso del naloge\.$/);
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
  assert.equal(b(0), 'Prejšnji koraki niso izbrisali nobenega kandidata.');
  assert.equal(b(1), 'Prejšnji koraki so že izbrisali 1 kandidata – niso del naloge.');
  assert.equal(b(2), 'Prejšnji koraki so že izbrisali 2 kandidata – niso del naloge.');
  assert.equal(b(3), 'Prejšnji koraki so že izbrisali 3 kandidate – niso del naloge.');
  assert.equal(b(4), 'Prejšnji koraki so že izbrisali 4 kandidate – niso del naloge.');
  assert.equal(b(5), 'Prejšnji koraki so že izbrisali 5 kandidatov – niso del naloge.');
  assert.equal(b(11), 'Prejšnji koraki so že izbrisali 11 kandidatov – niso del naloge.');
  assert.equal(b(101), 'Prejšnji koraki so že izbrisali 101 kandidata – niso del naloge.');
  assert.equal(b(102), 'Prejšnji koraki so že izbrisali 102 kandidata – niso del naloge.');
  assert.equal(run('prejOdstranjenihBesedilo(5, true)'), 'Prečrtane kandidate (5) so izbrisali prejšnji koraki – niso del naloge.');
});

for (const [mode, kljuc] of [['naked-single', 'Gol enojček'], ['hidden-single', 'Skriti enojček']]) {
  test(`${mode}: mreža brez kandidatov, izbrati je mogoče samo prazne celice, brez vrstice o kandidatih`, () => {
    const { dom, run, izprazni } = zacni(mode);
    izprazni();
    assert.equal(run('nextStep(vadi.v.S0.deska).technique'), kljuc);
    assert.equal(run('vadi.v.prejOdstranjenih'), 0, 'čisto stanje');
    assert.equal(vsi(poRazredu(dom, 'mreza')[0]).filter(e => /\bkand\b/.test(e.className)).length, 0, 'v mreži ni kandidatov');
    assert.equal(poRazredu(dom, 'vaja-info')[0].children.length, 1, 'samo stopnja uganke');
    // Vaja 1: izbrati je mogoče samo prazne celice v enoti območja (označena, druge prazne
    // celice so zatemnjene), kot v "Spoznaj".
    const grid = iz(run, 'vadi.v.S0.grid'), enota = iz(run, 'vadi.ob.enota');
    const cs = celice(dom);
    assert.match(najdi(dom, e => e.tagName === 'H3')[0].textContent, /^V (vrstici|stolpcu|bloku) \d poišči /);
    const vEnoti = grid.findIndex((v, c) => !v && enota.includes(c)), zunaj = grid.findIndex((v, c) => !v && !enota.includes(c));
    for (let c = 0; c < 81; c++) {
      assert.equal(cs[c].classList.contains('oznacena'), enota.includes(c), `oznacena ${c}`);
      assert.equal(cs[c].classList.contains('neaktivna'), !grid[c] && !enota.includes(c), `neaktivna ${c}`);
    }
    for (const c of [grid.findIndex(v => v), vEnoti, zunaj]) {
      cs[c].sprozi('click');
      assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), c === vEnoti ? [c] : []);
      if (c === vEnoti) cs[c].sprozi('click');
    }
    // Vaja 7: cela uganka - izbrati je mogoče vsako prazno celico.
    run('exNum = 6; renderExercise()');
    izprazni();
    assert.equal(run('vadi.ob'), null);
    const g7 = iz(run, 'vadi.v.S0.grid');
    assert.equal(celice(dom).filter(e => e.classList.contains('oznacena') || e.classList.contains('neaktivna')).length, 0);
    const p7 = g7.findIndex(v => !v);
    celice(dom)[p7].sprozi('click');
    assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), [p7]);
  });
}

test('krog: 9 vaj s pravilnim odgovorom (predlog + Preveri), nato "Končano!" z rezultatom', () => {
  const { dom, run, izprazni } = zacni('naked-single');
  for (let i = 0; i < 9; i++) {
    izprazni();
    assert.equal(poRazredu(dom, 'ex-label')[0].textContent.endsWith(`Vaja ${i + 1} / 9`), true);
    // Pri vajah 1-6 je odgovor korak v območju (izbira je omejena na enoto).
    const [c, d] = iz(run, 'vadi.KTob[0].assign[0]');
    celice(dom)[c].sprozi('click');
    poRazredu(dom, 'niz-vpisi')[0].children[d - 1].sprozi('click');
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').style.display, 'inline-block');
    gumb(dom, i < 8 ? 'Naslednja vaja →' : 'Končaj').sprozi('click');
  }
  assert.match(dom.el('exerciseArea').children[0].innerHTML, /Končano!/);
  assert.match(dom.el('exerciseArea').children[0].innerHTML, /Rezultat: <b>9<\/b> \/ <b>9<\/b> \(100%\)/);
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
// ob: izraz za območje (privzeto null - cela uganka, kot vaje 7-9). "Več celic" je
// izklopljen (vecCelicKrog = false), ker testi odgovorov izbirajo po eno celico.
function vajaZ(tehnika, pogoj, ob = 'null') {
  const t = zacni(tehnika);
  t.izprazni();
  t.run(`{ const kljuc = TEHNIKA_VAJE[mode]; let najdena = null;
    for (const z of VAJE_BANKA.filter(z => z.tehnike.includes(kljuc))) {
      const { stanja, stopnja } = stanjaVUganki(z.danosti, kljuc);
      for (const st of stanja) { const v = vajaIzStanja(z.danosti, kljuc, st, stopnja); if (v && (${pogoj})) { najdena = v; break; } }
      if (najdena) { najdena.izvor = { vrsta: 'banka', seme: z.seme }; break; }
    }
    vecCelicKrog = false; izrisiVadi(najdena, ${ob}); }`);
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
  assert.equal(fb(dom).innerHTML, 'Izbriši kandidate, ki zaradi iskanega koraka odpadejo.');
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
  assert.match(fb(dom).innerHTML, /^<b>Ni pravilno\.<\/b> Števka \d je v V\dS\d prava – tega kandidata ne smeš izbrisati\. $/);
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

/* ---------- 6d: E1 in E2 ---------- */

const nizVpisi = (dom, d) => poRazredu(dom, 'niz-vpisi')[0].children[d - 1];

test('E1: predlog v celici (niz Vpiši z vsemi 9 števkami, tipke), izidi "Preveri", pravilen predlog postane poteza', () => {
  const { dom, run, izprazni } = zacni('naked-single');
  run('exNum = 6; renderExercise()'); // cela uganka (vaja 7)
  izprazni();
  const S0 = iz(run, 'vadi.v.S0');
  const N = run('vadi.v.igra.kazalec');
  // Brez predloga.
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).innerHTML, 'Izberi celico in vpiši števko.');
  // Vseh 9 števk za izbrano prazno celico (tudi tiste, ki niso kandidat).
  const [kc, kd] = iz(run, 'vadi.v.KT[0].assign[0]');
  const t = e => dom.tipka({ preventDefault() {}, ...e });
  izberi(dom, run, kc);
  assert.ok([1, 2, 3, 4, 5, 6, 7, 8, 9].every(d => !nizVpisi(dom, d).disabled), 'vseh 9 števk');
  assert.equal(poRazredu(dom, 'niz-odstrani').length, 0);
  // Predlog: niz in tipka (tudi Numpad), Backspace ga pobriše, ni poteza.
  const druga = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => d !== kd);
  nizVpisi(dom, druga).sprozi('click');
  assert.equal(celice(dom)[kc].textContent, String(druga));
  assert.equal(celice(dom)[kc].className.includes('predlog'), true);
  t({ key: String(kd), code: `Numpad${kd}` });
  assert.equal(celice(dom)[kc].textContent, String(kd), 'nov predlog zamenja starega');
  t({ key: 'Backspace', code: 'Backspace' });
  assert.equal(celice(dom)[kc].textContent, '');
  assert.equal(run('vadi.v.igra.kazalec'), N, 'predlog ni poteza');
  // Napačen predlog (preveriEnojcek 'narobe'): šteje, predlog se pobriše, Preveri
  // onemogočen do novega predloga.
  const narobe = iz(run, `(() => { for (let c = 0; c < 81; c++) if (!vadi.v.S0.grid[c]) for (let d = 1; d <= 9; d++)
    if (preveriVajo(vadi.v, vadi.stanje, { celica: c, stevka: d }).izid === 'napacno') return [c, d]; })()`);
  izberi(dom, run, narobe[0]);
  t({ key: String(narobe[1]), code: `Digit${narobe[1]}` });
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).className, 'fb err');
  assert.match(fb(dom).innerHTML, /^<b>Ni pravilno\.<\/b> /);
  assert.equal(rezultat(dom), '0/1');
  assert.equal(celice(dom)[narobe[0]].textContent, '');
  assert.equal(gumb(dom, 'Preveri').disabled, true);
  // Nevtralno (prava števka, ki je očitni enojček ne dokaže): ne šteje.
  const nevt = iz(run, `(() => { for (let c = 0; c < 81; c++) if (!vadi.v.S0.grid[c])
    if (preveriVajo(vadi.v, vadi.stanje, { celica: c, stevka: vadi.v.resitev[c] }).izid === 'nevtralno') return [c, vadi.v.resitev[c]]; })()`);
  if (nevt) {
    izberi(dom, run, nevt[0]);
    nizVpisi(dom, nevt[1]).sprozi('click');
    assert.equal(gumb(dom, 'Preveri').disabled, false);
    gumb(dom, 'Preveri').sprozi('click');
    assert.equal(fb(dom).className, 'fb info');
    assert.match(fb(dom).innerHTML, /^<b>Še ne\.<\/b> Števka je prava/);
    assert.equal(rezultat(dom), '0/1');
  }
  // Pravilen predlog: poteza vpis, zelena celica, zaklep.
  izberi(dom, run, kc);
  nizVpisi(dom, kd).sprozi('click');
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).className, 'fb ok');
  assert.equal(rezultat(dom), '1/2');
  assert.equal(run('vadi.v.igra.kazalec'), N + 1);
  assert.equal(run(`vadi.stanje.grid[${kc}]`), kd);
  assert.ok(celice(dom)[kc].classList.contains('vpis') && celice(dom)[kc].classList.contains('k-vpis'));
  assert.equal(celice(dom).filter(e => e.classList.contains('izbrana')).length, 0);
  const prazna = S0.grid.findIndex((x, c) => !x && c !== kc);
  celice(dom)[prazna].sprozi('click');
  t({ key: '1', code: 'Digit1' });
  assert.equal(celice(dom)[prazna].textContent, '', 'po pravilnem odgovoru ni predloga');
  assert.equal(gumb(dom, 'Naslednja vaja →').style.display, 'inline-block');
});

test('E2: senčenje ob eni poudarjeni števki je pomoč, pri E1 ne; namig in rešitev', () => {
  for (const [mode, pomoc] of [['hidden-single', true], ['naked-single', false]]) {
    const { dom, run, izprazni } = zacni(mode);
    izprazni();
    const kljukice = poRazredu(dom, 'kljukice')[0].children;
    assert.equal(kljukice[0].textContent, ' senči');
    kljukice[0].children[0].checked = true;
    kljukice[0].children[0].sprozi('change');
    assert.equal(sPomocjo(dom), '', 'sama kljukica ni pomoč');
    run('vadi.plosca.poudari(vadi.v.KT[0].assign[0][1])');
    assert.equal(sPomocjo(dom), pomoc ? ' · s pomočjo: 1' : '', mode);
    assert.ok(celice(dom).some(e => e.classList.contains('zasencena')));
  }
  // Namig (cela mreža) in rešitev (celica s števko zeleno) pri E2.
  const { dom, run, izprazni } = zacni('hidden-single', { seme: 3 });
  izprazni();
  gumb(dom, 'Namig').sprozi('click');
  // Vaja 1 z enoto: namig kot v "Spoznaj" pri označeni enoti (katere števke manjkajo).
  assert.match(pomocOkvir(dom).textContent, /^Namig: V (vrstici|stolpcu|bloku) \d manjka/);
  assert.equal(sPomocjo(dom), ' · s pomočjo: 1');
  gumb(dom, 'Rešitev').sprozi('click');
  const oznacene = celice(dom).filter(e => e.classList.contains('k-vpis'));
  assert.equal(oznacene.length, 1);
  assert.ok(oznacene[0].textContent.length === 1, 'celica s števko rešitve');
  assert.ok(celice(dom).some(e => e.classList.contains('k-vzorec')), 'enota koraka');
});


/* ---------- popravek 7b: območje koraka (vaje 1-6) ---------- */

test('območje po tehnikah (vaja 1): navodilo, oznaka na mreži ali poudarek števk; Namig in Rešitev iz območja', () => {
  const PRICAKOVANO = {
    'naked-triple': /^V (vrstici|stolpcu|bloku) \d poišči očitno trojico in izbriši kandidate, ki zaradi nje odpadejo\.$/,
    'box-line': /^V (vrstici|stolpcu) \d poišči izločitev v bloku in izbriši kandidate, ki zaradi nje odpadejo\.$/,
    'x-wing': /^Za števko \d poišči X-krilo in izbriši kandidate, ki zaradi njega odpadejo\.$/,
    'swordfish': /^Za števko \d poišči mečarico in izbriši kandidate, ki zaradi nje odpadejo\.$/,
    'w-wing': /^Za par \{\d, \d\} poišči W-krilo in izbriši kandidate, ki zaradi njega odpadejo\.$/,
    'xy-wing': /^Poišči XY-krilo s pivotom V\dS\d in izbriši kandidate, ki zaradi njega odpadejo\.$/,
    'unique-rectangle': /^V blokih \d in \d poišči edinstveni pravokotnik in izbriši kandidate, ki zaradi njega odpadejo\.$/,
  };
  for (const [mode, vzorec] of Object.entries(PRICAKOVANO)) {
    const { dom, run, izprazni } = zacni(mode);
    izprazni();
    const ob = iz(run, 'vadi.ob');
    assert.match(najdi(dom, e => e.tagName === 'H3')[0].textContent, vzorec, mode);
    const oznacene = celice(dom).map((e, c) => e.classList.contains('oznacena') ? c : -1).filter(c => c >= 0);
    assert.deepEqual(oznacene, ob.celice ? [...ob.celice].sort((a, b) => a - b) : [], `${mode}: oznaka`);
    if (ob.stevke) for (const d of ob.stevke) assert.ok(run(`vadi.plosca.barvaPoudarka(${d})`) >= 0, `${mode}: poudarjena ${d}`);
    // Okvir območja (točka 17): razred obm natanko na celicah območja; temne oznake roba;
    // pri števkah obroč na gumbu v nizu Poudari.
    const zObm = celice(dom).map((e, c) => e.classList.contains('obm') ? c : -1).filter(c => c >= 0);
    assert.deepEqual(zObm, ob.celice ? [...ob.celice].sort((a, b) => a - b) : [], `${mode}: okvir`);
    const temne = poRazredu(dom, 'obm').filter(e => e.tagName === 'SPAN').length;
    assert.ok(ob.celice ? temne > 0 : temne === 0, `${mode}: oznake roba ${temne}`);
    const obroci = poRazredu(dom, 'niz-poudari')[0].children.map((g, i) => g.classList.contains('obm-stevka') ? i + 1 : 0).filter(Boolean);
    assert.deepEqual(obroci, ob.stevke ? [...ob.stevke] : [], `${mode}: obroč števke`);
    assert.ok(run('vadi.KTob.length > 0 && vadi.KTob.every(k => vObmocju(k, vadi.ob))'));
    // Rešitev pokaže korak iz območja.
    gumb(dom, 'Rešitev').sprozi('click');
    assert.ok(run(`vadi.KTob.some(k => ${JSON.stringify(poRazredu(dom, 'vadi-pomoc')[0].textContent)}.startsWith('Rešitev: ' + k.message))`), `${mode}: rešitev iz območja`);
    // Vaja 7: brez območja.
    run('exNum = 6; renderExercise()');
    izprazni();
    assert.equal(run('vadi.ob'), null);
    assert.equal(najdi(dom, e => e.tagName === 'H3')[0].textContent, run('navodiloVadi(vadi.v.kljuc, null)'));
    assert.match(najdi(dom, e => e.tagName === 'H3')[0].textContent, /^Poišči \S+.* in izbriši kandidate, ki zaradi (nje|njega) odpadejo\.$/);
    assert.equal(celice(dom).filter(e => e.classList.contains('oznacena')).length, 0);
  }
});

test('pravilen korak zunaj območja je pravilen, sporočilo pove, kje je bil', () => {
  const { dom, run } = vajaZ('pointing', 'v.KT.some(k => obmocjeKoraka(k).opis !== obmocjeKoraka(v.KT[0]).opis)', 'obmocjeKoraka(najdena.KT[0])');
  const zunaj = iz(run, 'vadi.v.KT.find(k => !vObmocju(k, vadi.ob))');
  const opisOb = run('vadi.ob.opis'), opisZunaj = run(`obmocjeKoraka(vadi.v.KT.find(k => !vObmocju(k, vadi.ob))).opis`);
  assert.match(najdi(dom, e => e.tagName === 'H3')[0].textContent, new RegExp(`^${opisOb[0].toUpperCase()}${opisOb.slice(1)} poišči izločitev izven bloka`));
  for (const e of zunaj.eliminate) if (jeKand(run, e)) odstrani(dom, run, e);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).className, 'fb ok');
  assert.equal(fb(dom).innerHTML, `<b>Pravilno!</b> (korak ${opisZunaj}, ne ${opisOb}) ${zunaj.message}`);
  assert.equal(rezultat(dom), '1/1', 'šteje kot pravilno');
});

test('pravilen korak v območju: sporočilo brez opombe', () => {
  const { dom, run } = vajaZ('pointing', 'true', 'obmocjeKoraka(najdena.KT[0])');
  const k = iz(run, 'vadi.KTob[0]');
  for (const e of k.eliminate) if (jeKand(run, e)) odstrani(dom, run, e);
  gumb(dom, 'Preveri').sprozi('click');
  assert.equal(fb(dom).innerHTML, `<b>Pravilno!</b> ${k.message}`);
});

/* ---------- 8c: izbira uganke po stopnji (točka 16 načrta) ---------- */

test('sproti se vzame samo uganka osnovne stopnje tehnike', () => {
  for (const [mode, osnovna] of [['pointing', 'Srednja'], ['naked-single', 'Lahka']]) {
    const { run, izprazni } = zacni(mode, { banka: false });
    izprazni();
    assert.equal(run('vadi.v.izvor.vrsta'), 'sproti');
    assert.equal(run('vadi.v.stopnja'), osnovna, mode);
    assert.equal(run('stopnjaTehnike(vadi.v.kljuc)'), osnovna);
  }
});

test('banka ob meji: najprej vse uganke osnovne stopnje, nato višje stopnje', () => {
  const { run, izprazni } = zacni('swordfish');
  izprazni();
  assert.equal(run('vadi.v.izvor.vrsta'), 'banka');
  assert.equal(run('vadi.v.stopnja'), 'Težka', 'osnovna stopnja mečarice');
  const osnovnih = run('VAJE_BANKA.filter(z => z.tehnike.includes("Swordfish") && z.stopnja === "Težka").length');
  const stopnje = iz(run, `Array.from({ length: ${osnovnih + 2} }, () => vajaIzBanke('Swordfish').stopnja)`);
  // Prva je že uporabljena (vaja na zaslonu): še osnovnih - 1 Težkih, nato Zelo težka.
  assert.deepEqual(stopnje.slice(0, osnovnih - 1), Array(osnovnih - 1).fill('Težka'));
  assert.ok(stopnje.slice(osnovnih - 1).every(s => s === 'Zelo težka'), JSON.stringify(stopnje));
});

test('oznaka pri uganki Presega tehnike: »za to vajo ni pomembno«', () => {
  const { dom, run, izprazni } = zacni('pointing');
  izprazni();
  // Uganka iz semena 12 presega tehnike, stanja izločitve izven bloka so pred prvim poskusom
  // (tests/vaje-uganka.test.js).
  run(`{ const v = vajaIzUganke(genMinimalnaUganka(12), 'Pointing pair/triple', Math.random);
    v.izvor = { vrsta: 'sproti', seme: 12 }; exNum = 6; izrisiVadi(v); }`);
  const st = poRazredu(dom, 'vaja-info')[0].children[0];
  assert.equal(st.textContent, 'Uganka: Presega tehnike – za to vajo ni pomembno');
  assert.match(st.title, /^Uganke brez ugibanja ni mogoče rešiti do konca; vaja je korak pred mestom, kjer bi bilo treba ugibati\. Vaja iz sproti ustvarjene uganke \(seme 12\)$/);
  // Pri rešljivi uganki brez pojasnila.
  run('exNum = 6; renderExercise()');
  izprazni();
  assert.equal(poRazredu(dom, 'vaja-info')[0].children[0].textContent, `Uganka: ${run('vadi.v.stopnja')}`);
});

test('»Spoznaj« 1 in 2: uganke iz banke najprej osnovne stopnje (Srednja), brez ponovitev', () => {
  const { run } = zacni('pointing');
  for (const mode of ['pointing', 'box-line']) {
    const kljuc = run(`PRESEK_KLJUC[${JSON.stringify(mode)}]`);
    const srednjih = run(`VAJE_BANKA.filter(z => z.tehnike.includes(${JSON.stringify(kljuc)}) && z.stopnja === 'Srednja').length`);
    const stopnje = iz(run, `Array.from({ length: 9 }, (_, n) => { const ex = genPresek(n, ${JSON.stringify(mode)});
      return VAJE_BANKA.find(z => z.danosti === ex.danosti).stopnja; })`);
    assert.ok(srednjih >= 9, `${mode}: dovolj ugank osnovne stopnje v banki`);
    assert.deepEqual(stopnje, Array(9).fill('Srednja'), mode);
  }
});


/* ---------- 9b: zaznamki, legenda, območje v »Spoznaj« E1/E2 (točka 17) ---------- */

test('zaznamki: gumb in tipka O, izbira prosta, ostanejo ob »Začni znova«, nova vaja jih pobriše', () => {
  const { dom, run, izprazni } = zacni('swordfish', { banka: true });
  run('vecCelicKrog = false; exNum = 6; renderExercise()'); // izbira po eno celico, več s Ctrl+klik
  izprazni();
  const k = iz(run, 'vadi.v.KT[0]');
  const zazn = () => celice(dom).map((e, c) => e.classList.contains('zaznamovana') ? c : -1).filter(c => c >= 0);
  // Celice vzorca izbrane s Ctrl+klikom, nato gumb: zaznamovane, izbira prazna.
  celice(dom)[k.cells[0]].sprozi('click');
  for (const c of k.cells.slice(1)) celice(dom)[c].sprozi('click', { ctrlKey: true });
  gumb(dom, '◩ Označi izbrane (O)').sprozi('click');
  assert.deepEqual(zazn(), [...k.cells].sort((a, b) => a - b));
  assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), []);
  assert.equal(run('vadi.v.igra.kazalec'), run('vadi.v.igra.zacetnihPotez'), 'zaznamek ni poteza');
  assert.equal(dom.el('scorePomoc').textContent, '', 'ni pomoč');
  // Celica izbrisa je spet prosta za izbiro; izbris in »Začni znova«: zaznamki ostanejo.
  const [ec, ed] = k.eliminate[0];
  celice(dom)[ec].sprozi('click');
  poRazredu(dom, 'niz-odstrani')[0].children[ed - 1].sprozi('click');
  gumb(dom, '↺ Začni znova').sprozi('click');
  assert.deepEqual(zazn(), [...k.cells].sort((a, b) => a - b));
  // Tipka O (QWERTZ: key 'o', code 'KeyO') na zaznamovani celici: odznači.
  celice(dom)[k.cells[0]].sprozi('click');
  dom.tipka({ key: 'o', code: 'KeyO', preventDefault() {} });
  assert.equal(zazn().includes(k.cells[0]), false);
  gumb(dom, 'Počisti oznake').sprozi('click');
  assert.deepEqual(zazn(), []);
  // Nova vaja: brez zaznamkov.
  celice(dom)[k.cells[0]].sprozi('click');
  gumb(dom, '◩ Označi izbrane (O)').sprozi('click');
  run('exNum++; renderExercise()');
  izprazni();
  assert.deepEqual(zazn(), []);
  assert.equal(poRazredu(dom, 'zaznamki').length, 1);
});

test('legenda: po pravilnem odgovoru »izbrisani kandidati«, v Rešitvi »kandidat za izbris«', () => {
  const { dom, run } = vajaZ('hidden-pair', 'true');
  gumb(dom, 'Rešitev').sprozi('click');
  const vRes = poRazredu(dom, 'vadi-pomoc')[0];
  assert.match(vRes.textContent, /celice vzorca\d?kandidat za izbris/);
  gumb(dom, 'Skrij').sprozi('click');
  const k = iz(run, 'vadi.KTob[0]');
  for (const e of k.eliminate) if (jeKand(run, e)) odstrani(dom, run, e);
  gumb(dom, 'Preveri').sprozi('click');
  const leg = vsi(fb(dom)).find(e => e.className === 'legenda-vaje');
  assert.ok(leg, 'legenda pod sporočilom');
  assert.equal(leg.textContent, `celice vzorca${run('vadi.KTob[0].eliminate[0][1]')}izbrisani kandidati`);
  assert.equal(poRazredu(dom, 'zaznamki')[0].hidden, true, 'gumba zaznamkov po pravilnem odgovoru skrita');
});

test('»Spoznaj« E1/E2 pri vajah 1-6: okvir območja in temne oznake roba, pri vajah 7-9 ne', () => {
  for (const [mode, n, vrsta] of [['naked-single', 0, 'celica'], ['naked-single', 3, 'enota'], ['hidden-single', 3, 'enota'], ['naked-single', 6, null]]) {
    const { dom, run } = zacni(mode);
    run(`var zadnja; { const g = MODES[${JSON.stringify(mode)}].gen; MODES[${JSON.stringify(mode)}].gen = n => (zadnja = g(n)); }`);
    run(`zacniKrog(${JSON.stringify(mode)}, 'spoznaj'); exNum = ${n}; renderExercise();`);
    const o = iz(run, 'zadnja.oznaka');
    const vse = vsi(dom.el('exerciseArea'));
    const cel = vse.filter(e => /\bcelica\b/.test(e.className) && e.dataset.r !== undefined);
    const zObm = cel.filter(e => e.classList.contains('obm')).map(e => +e.dataset.r * 9 + +e.dataset.c).sort((a, b) => a - b);
    const temne = vse.filter(e => e.tagName === 'SPAN' && e.className === 'obm').length;
    if (!vrsta) { assert.equal(o, null); assert.deepEqual(zObm, []); assert.equal(temne, 0); continue; }
    const pricakovano = vrsta === 'celica' ? [o.celica] : [...o.enota].sort((a, b) => a - b);
    assert.deepEqual(zObm, pricakovano, `${mode} vaja ${n + 1}`);
    assert.equal(temne, vrsta === 'celica' ? 2 : pricakovano.length === 9 && new Set(pricakovano.map(c => Math.floor(c / 9))).size === 3 && new Set(pricakovano.map(c => c % 9)).size === 3 ? 6 : 1, `${mode} vaja ${n + 1}: oznake roba`);
  }
});


/* ---------- »več celic« privzeto vklopljen (popravek po ročnem pregledu faze 6) ---------- */

test('»več celic« pri 1–12 privzeto vklopljen, sprememba velja do konca kroga, Ctrl+klik vedno', () => {
  const kljukica = dom => poRazredu(dom, 'glava-s-kljukico')[0].children[1].children[0];
  // Prej po deležu v banki (edinstveni pravokotnik 0 % - izklop); zdaj pri vseh vklopljen.
  for (const mode of ['pointing', 'swordfish', 'xy-wing', 'unique-rectangle']) {
    const { dom, izprazni } = zacni(mode);
    izprazni();
    assert.equal(kljukica(dom).checked, true, `${mode}: privzeto`);
  }
  // Vklopljena kljukica: navaden klik doda celico.
  const { dom, run, izprazni } = zacni('swordfish');
  izprazni();
  const prazne = iz(run, 'vadi.stanje.grid').map((x, c) => (x ? -1 : c)).filter(c => c >= 0);
  celice(dom)[prazne[0]].sprozi('click');
  celice(dom)[prazne[1]].sprozi('click');
  assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), [prazne[0], prazne[1]]);
  // Izklop velja do konca kroga (naslednja vaja), nov krog spet privzeto.
  kljukica(dom).checked = false;
  kljukica(dom).sprozi('change');
  run('exNum++; renderExercise()');
  izprazni();
  assert.equal(kljukica(dom).checked, false, 'izklop ostane v naslednji vaji');
  // Izklopljena: navaden klik zamenja izbiro, Ctrl+klik doda.
  const p2 = iz(run, 'vadi.stanje.grid').map((x, c) => (x ? -1 : c)).filter(c => c >= 0);
  celice(dom)[p2[0]].sprozi('click');
  celice(dom)[p2[1]].sprozi('click');
  assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), [p2[1]]);
  celice(dom)[p2[2]].sprozi('click', { ctrlKey: true });
  assert.deepEqual(iz(run, 'vadi.plosca.izbrane'), [p2[1], p2[2]]);
  run('zacniKrog("swordfish", "uganka")');
  izprazni();
  assert.equal(kljukica(dom).checked, true, 'nov krog: privzeto');
});

// Nastavitev igre »Kandidati v celicah« (sudoku.igra.kandidati, docs/kandidati-stikalo-nacrt.md)
// je samo igrina: trening je ne bere - 1-12 s kandidati, E1/E2 brez, kot brez zapisa.
test('nastavitev igre »Kandidati v celicah« treninga ne spremeni', () => {
  for (const tehnika of ['hidden-pair', 'naked-single']) {
    const izris = shramba => {
      const { dom, izprazni } = zacni(tehnika, { shramba });
      izprazni();
      return { kandidati: celice(dom).map(c => c.children.filter(k => k.className === 'kandidati').length), dom };
    };
    const brez = izris(undefined);
    const shramba = new Map([['sudoku.igra.kandidati', 'false']]);
    const z = izris(shramba);
    assert.deepEqual(z.kandidati, brez.kandidati, tehnika);
    assert.equal(z.kandidati.some(n => n), tehnika === 'hidden-pair', tehnika);
    assert.equal(shramba.get('sudoku.igra.kandidati'), 'false', 'trening ključa ne piše');
  }
});
