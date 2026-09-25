'use strict';
// Vaje "Vadi v uganki" (shared/vaje-uganka.js, docs/trening-v-uganki-nacrt.md, del 2):
// minimalna uganka iz semena, stanja na poti motorja, vaja kot igra z začetnimi potezami
// in presoja odgovora preveriVajo() z vrstnim redom izidov. Stanja in odgovori niso
// sestavljeni na pamet: uganke da genMinimalnaUganka(seme), izbrisi v odgovorih so
// izbrisi korakov motorja (KT, KV) ali števke rešitve.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js'],
  names: ['genMinimalnaUganka', 'oceniTezavnost', 'nextStep', 'applyStep', 'nakedSingles', 'hiddenSingles',
    'stanjaVUganki', 'vajaIzStanja', 'vajaIzUganke', 'preveriVajo', 'VAJA_E1_NAJMANJ_PRAZNIH',
    'stanjeIgre', 'dodajPotezo', 'lahkoRazveljavi', 'lahkoZacniZnova', 'mozneAkcije', 'imeTehnike',
    'POSKUS_KLJUC', 'elimLabel', 'solutionOf'],
});

const bits = m => [...E.bitsOf(m)];
const ENOJCKA = ['Gol enojček', 'Skriti enojček'];
const TEHNIKE = E.ALL_TECHNIQUES.map(([k]) => k);

// Prvo seme (1, 2, ...), ki da stanje tehnike - poiskal program (skripta v razvoju,
// isto kot stanjaVUganki() spodaj). Sprememba motorja (vrstni red, nova tehnika) lahko
// seznam pokvari; test to pokaže.
const SEMENA = {
  'Gol enojček': 1,
  'Skriti enojček': 2,
  'Pointing pair/triple': 3,
  'Box-line reduction': 3,
  'Naked pair': 3,
  'Hidden pair': 3,
  'Naked triple': 67,
  'Hidden triple': 42,
  'X-Wing': 3,
  'Swordfish': 245,
  'Turbot Fish': 18,
  'W-Wing': 18,
  'XY-Wing': 7,
  'Unique Rectangle': 3,
};
// Uganka "Presega tehnike" s stanji Pointing pred prvim poskusom.
const SEME_PRESEGA = 12;

const uganke = new Map();
const uganka = seme => {
  if (!uganke.has(seme)) uganke.set(seme, E.genMinimalnaUganka(seme));
  return uganke.get(seme);
};

// Vse vaje tehnike iz njenega semena (vsako stanje na poti).
function vajeTehnike(kljuc) {
  const danosti = uganka(SEMENA[kljuc]);
  const r = E.stanjaVUganki(danosti, kljuc);
  return r.stanja.map(s => E.vajaIzStanja(danosti, kljuc, s, r.stopnja));
}
const vaje = new Map(TEHNIKE.map(k => [k, vajeTehnike(k)]));

// Kopija igre vaje z odstranjenimi kandidati (poteze 'kandidat'); vrne stanjeIgre().
const kljucIzbrisa = ([c, d]) => c * 10 + d;
function odstrani(vaja, izbrisi) {
  const igra = JSON.parse(JSON.stringify(vaja.igra));
  const videni = new Set();
  for (const [c, d] of izbrisi) {
    if (videni.has(kljucIzbrisa([c, d]))) continue;
    videni.add(kljucIzbrisa([c, d]));
    assert.ok(E.dodajPotezo(igra, { tip: 'kandidat', celica: c, stevka: d, odstrani: true }), `odstrani ${c}/${d}`);
  }
  return { igra, stanje: E.stanjeIgre(igra) };
}
const preveri = (vaja, izbrisi) => E.preveriVajo(vaja, odstrani(vaja, izbrisi).stanje);

// Izbrisi, ki jih utemelji KT / KV; kandidati S0 po vrsti.
const vKT = v => new Set(v.KT.flatMap(k => k.eliminate.map(kljucIzbrisa)));
const vKV = v => new Set(v.KV.flatMap(k => k.eliminate.map(kljucIzbrisa)));
function kandidatiS0(v) {
  const out = [];
  for (let c = 0; c < 81; c++) if (!v.S0.grid[c]) for (const d of bits(v.S0.kandidati[c])) out.push([c, d]);
  return out;
}
// Neutemeljen izbris: kandidat, ki ni prava števka in ga ne izbriše noben korak.
const neutemeljen = v => kandidatiS0(v).find(e => v.resitev[e[0]] !== e[1] && !vKV(v).has(kljucIzbrisa(e)));
// Izbris druge tehnike: izbris koraka iz KV, ki ni izbris nobenega koraka KT.
const drugaTehnika = v => {
  const kt = vKT(v);
  for (const k of v.KV) for (const e of k.eliminate) if (!kt.has(kljucIzbrisa(e))) return e;
  return null;
};
const pravaStevka = v => kandidatiS0(v).find(e => v.resitev[e[0]] === e[1] && E.popcount(v.S0.kandidati[e[0]]) > 1);
const sortiraj = a => [...a].map(e => [...e]).sort((x, y) => kljucIzbrisa(x) - kljucIzbrisa(y));

/* ---------- genMinimalnaUganka ---------- */

test('genMinimalnaUganka(): isto seme da iste danosti, ena rešitev, vsaka danost je potrebna', () => {
  for (const seme of [1, 2, 3]) {
    const d = E.genMinimalnaUganka(seme);
    assert.equal(d, E.genMinimalnaUganka(seme), `seme ${seme}`);
    assert.match(d, /^[0-9]{81}$/);
    assert.equal(E.countSolutions(d), 1, `seme ${seme}: ena rešitev`);
    for (let c = 0; c < 81; c++) {
      if (d[c] === '0') continue;
      const brez = d.slice(0, c) + '0' + d.slice(c + 1);
      assert.notEqual(E.countSolutions(brez), 1, `seme ${seme}: danost ${c} je potrebna`);
    }
  }
  assert.notEqual(E.genMinimalnaUganka(1), E.genMinimalnaUganka(2));
});

/* ---------- stanja in vaja kot igra ---------- */

test('stanja na poti: za vsako tehniko je v S0 naslednji korak motorja ta tehnika', () => {
  for (const kljuc of TEHNIKE) {
    const vs = vaje.get(kljuc);
    assert.ok(vs.length, `${kljuc}: seme ${SEMENA[kljuc]} nima stanja`);
    for (const v of vs) {
      assert.equal(E.nextStep(v.S0.deska).technique, kljuc, kljuc);
      assert.ok(v.KT.length && v.KT.every(k => k.technique === kljuc), `${kljuc}: KT`);
      assert.ok(v.KV.length >= v.KT.length, `${kljuc}: KV vsebuje KT`);
    }
  }
});

test('uganka ima eno rešitev, stopnja je ista kot oceniTezavnost()', () => {
  for (const seme of new Set([...Object.values(SEMENA), SEME_PRESEGA])) {
    const d = uganka(seme);
    assert.equal(E.countSolutions(d), 1, `seme ${seme}`);
    const o = E.oceniTezavnost(d);
    for (const kljuc of TEHNIKE) {
      const r = E.stanjaVUganki(d, kljuc);
      assert.equal(r.stopnja, o.tezavnost, `seme ${seme}, ${kljuc}`);
    }
  }
});

test('vaja kot igra: kandidati so natanko kandidati na poti, začetne poteze so zaklenjene', () => {
  for (const kljuc of TEHNIKE) {
    const danosti = uganka(SEMENA[kljuc]);
    const r = E.stanjaVUganki(danosti, kljuc);
    for (const s of r.stanja) {
      const v = E.vajaIzStanja(danosti, kljuc, s, r.stopnja);
      assert.deepEqual([...v.S0.grid], [...s.grid], `${kljuc}: mreža`);
      for (let c = 0; c < 81; c++) if (!s.grid[c]) assert.equal(v.S0.kandidati[c], s.cand[c], `${kljuc}: kandidati ${c}`);
      assert.equal(v.igra.zacetnihPotez, v.igra.poteze.length);
      assert.equal(v.igra.kazalec, v.igra.poteze.length);
      assert.equal(E.lahkoRazveljavi(v.igra), false);
      assert.equal(E.lahkoZacniZnova(v.igra), false);
      const izbrisov = v.igra.poteze.filter(p => p.tip === 'kandidat').length;
      assert.equal(v.prejOdstranjenih, izbrisov);
      // Kandidatov, odstranjenih pred vajo, ni mogoče vrniti.
      for (let c = 0; c < 81; c++) assert.equal(E.mozneAkcije(v.S0, c).vrni, 0, `${kljuc}: vrni ${c}`);
      assert.deepEqual([...v.resitev], [...E.solutionOf(danosti)]);
      assert.equal(v.stopnja, r.stopnja);
    }
  }
});

test('E1 in E2: samo čista stanja (brez izbrisov), E1 z vsaj 30 praznimi, E2 brez očitnega enojčka', () => {
  for (const kljuc of ENOJCKA) {
    const danosti = uganka(SEMENA[kljuc]);
    const r = E.stanjaVUganki(danosti, kljuc);
    assert.ok(r.stanja.length > 1, `${kljuc}: iz uganke je več vaj`);
    for (const s of r.stanja) {
      assert.equal(s.cisto, true);
      const v = E.vajaIzStanja(danosti, kljuc, s, r.stopnja);
      assert.equal(v.prejOdstranjenih, 0, `${kljuc}: kandidati samo iz števk`);
      if (kljuc === 'Gol enojček') assert.ok(s.praznih >= E.VAJA_E1_NAJMANJ_PRAZNIH);
      else assert.equal(E.nakedSingles(v.S0.deska).length, 0, 'E2: na mreži ni očitnega enojčka');
    }
  }
  // Pri tehnikah 1-12 so stanja tudi po izbrisih prejšnjih korakov.
  assert.ok(TEHNIKE.filter(k => !ENOJCKA.includes(k)).some(k => vaje.get(k).some(v => v.prejOdstranjenih > 0)));
});

test('uganka Presega tehnike: stanja so samo pred prvim poskusom s protislovjem', () => {
  const kljuc = 'Pointing pair/triple';
  const d = uganka(SEME_PRESEGA);
  const r = E.stanjaVUganki(d, kljuc);
  assert.equal(r.poskus, true);
  assert.equal(r.stopnja, 'Presega tehnike');
  assert.ok(r.stanja.length, 'stanja pred poskusom so veljavna');
  // Neodvisno: pot do prvega poskusa in stanja Pointing na njej.
  const b = new E.Board(d);
  const pred = [];
  let k;
  for (;;) {
    k = E.nextStep(b);
    if (!k || k.technique.startsWith(E.POSKUS_KLJUC)) break;
    if (k.technique === kljuc) pred.push(b.grid.join(''));
    E.applyStep(b, k);
  }
  assert.ok(k, 'pot pride do poskusa');
  assert.deepEqual([...r.stanja.map(s => s.grid.join(''))], pred);
  // Za poskusom je Pointing še kje na poti, a tista stanja niso vaje.
  const praznihPriPoskusu = b.grid.filter(x => x === 0).length;
  for (const s of r.stanja) assert.ok(s.praznih > praznihPriPoskusu);
  E.applyStep(b, k);
  let za = 0;
  for (let i = 0; i < 200 && !b.isSolved(); i++) {
    const n = E.nextStep(b);
    if (!n) break;
    if (n.technique === kljuc) za++;
    E.applyStep(b, n);
  }
  assert.ok(za > 0, 'za poskusom so še stanja Pointing (in niso med vajami)');
});

test('vajaIzUganke(): naključno stanje iz uganke, null brez stanja', () => {
  const d = uganka(SEMENA['Gol enojček']);
  const r = E.stanjaVUganki(d, 'Gol enojček');
  const prvo = E.vajaIzUganke(d, 'Gol enojček', () => 0);
  const zadnje = E.vajaIzUganke(d, 'Gol enojček', () => 0.9999);
  assert.deepEqual([...prvo.S0.grid], [...r.stanja[0].grid]);
  assert.deepEqual([...zadnje.S0.grid], [...r.stanja[r.stanja.length - 1].grid]);
  assert.equal(E.vajaIzUganke(uganka(1), 'Swordfish'), null);
});

/* ---------- presoja odgovora 1-12 ---------- */

const vaje112 = TEHNIKE.filter(k => !ENOJCKA.includes(k)).flatMap(k => vaje.get(k));

test('preveriVajo(): prazno, pravilno za vsak korak KT', () => {
  for (const v of vaje112) {
    const r0 = E.preveriVajo(v, v.S0);
    assert.equal(r0.izid, 'prazno');
    assert.equal(r0.sporocilo, 'Odstrani kandidate, ki jih tehnika izloči.');
    for (const k of v.KT) {
      const r = preveri(v, k.eliminate);
      assert.equal(r.izid, 'pravilno', `${v.kljuc}: ${k.message}`);
      assert.ok(r.korak.eliminate.every(e => k.eliminate.some(x => kljucIzbrisa(x) === kljucIzbrisa(e))));
      assert.equal(r.sporocilo, `Pravilno! ${r.korak.message}`);
      assert.equal(r.razveljavi.length, 0);
    }
  }
});

test('preveriVajo(): delno - del koraka KT, sporočilo pove, koliko manjka', () => {
  let delnih = 0;
  for (const v of vaje112) {
    for (const k of v.KT) {
      if (k.eliminate.length < 2) continue;
      const del = k.eliminate.slice(0, -1);
      const vR = new Set(del.map(kljucIzbrisa));
      const cel = v.KT.some(x => x.eliminate.every(e => vR.has(kljucIzbrisa(e))));
      const r = preveri(v, del);
      assert.equal(r.izid, cel ? 'pravilno' : 'delno', v.kljuc);
      if (!cel) {
        delnih++;
        assert.match(r.sporocilo, /^Prav, a to še ni ves korak – manjka še 1 izbris\.$/);
      }
    }
  }
  assert.ok(delnih > 0, 'vsaj en primer delnega odgovora');
  // Več manjkajočih: samo prvi izbris koraka z več izbrisi; število manjkajočih je
  // najmanjše med koraki KT, ki ta izbris vsebujejo.
  const oblika = n => (n === 2 ? 'manjkata še 2 izbrisa' : n <= 4 ? `manjkajo še ${n} izbrisi` : `manjka še ${n} izbrisov`);
  let vec = 0;
  for (const v of vaje112) {
    for (const k of v.KT) {
      if (k.eliminate.length < 3) continue;
      const e = k.eliminate[0];
      const koraki = v.KT.filter(x => x.eliminate.some(y => kljucIzbrisa(y) === kljucIzbrisa(e)));
      const n = Math.min(...koraki.map(x => x.eliminate.length - 1));
      if (n < 2) continue;
      const r = preveri(v, [e]);
      assert.equal(r.izid, 'delno', v.kljuc);
      assert.equal(r.sporocilo, `Prav, a to še ni ves korak – ${oblika(n)}.`);
      vec++;
    }
  }
  assert.ok(vec > 0, 'vsaj en primer z več manjkajočimi izbrisi');
});

test('preveriVajo(): napacno - odstranjena prava števka', () => {
  for (const v of vaje112) {
    const e = pravaStevka(v);
    const r = preveri(v, [e]);
    assert.equal(r.izid, 'napacno');
    assert.equal(r.sporocilo, `Števka ${e[1]} je v ${E.cellLabel(e[0])} prava – tega kandidata ne smeš odstraniti.`);
    assert.equal(r.razveljavi.length, 0);
  }
});

test('preveriVajo(): neutemeljeno - izbris drži, a ga ne utemelji noben korak; ni napaka', () => {
  for (const v of vaje112) {
    const e = neutemeljen(v);
    assert.ok(e, v.kljuc);
    const r = preveri(v, [e]);
    assert.equal(r.izid, 'neutemeljeno');
    assert.equal(r.sporocilo, `Izbris drži, a ga v tem koraku ne utemelji nobena tehnika. Razveljavljeno: ${E.elimLabel([e])}.`);
    assert.deepEqual(sortiraj(r.razveljavi), sortiraj([e]));
  }
  // Dva neutemeljena izbrisa: dvojina.
  const v = vaje112[0];
  const dva = kandidatiS0(v).filter(e => v.resitev[e[0]] !== e[1] && !vKV(v).has(kljucIzbrisa(e))).slice(0, 2);
  assert.match(preveri(v, dva).sporocilo, /^Izbrisa držita, a ju v tem koraku ne utemelji nobena tehnika\./);
});

test('preveriVajo(): druga-tehnika - ime tehnike koraka, ki izbris utemelji, s številko', () => {
  let primerov = 0;
  for (const v of vaje112) {
    const e = drugaTehnika(v);
    if (!e) continue;
    primerov++;
    const korak = v.KV.find(k => k.eliminate.some(x => kljucIzbrisa(x) === kljucIzbrisa(e)));
    const r = preveri(v, [e]);
    assert.equal(r.izid, 'druga-tehnika', v.kljuc);
    assert.equal(r.korak, korak);
    const ime = t => E.imeTehnike(t, { stevilka: true, anglesko: false });
    assert.equal(r.sporocilo, `To drži, a je to korak tehnike ${ime(korak.technique)}, ne ${ime(v.kljuc)}. Razveljavljeno: ${E.elimLabel([e])}.`);
    assert.deepEqual(sortiraj(r.razveljavi), sortiraj([e]));
  }
  assert.ok(primerov >= 5, `primerov druge tehnike: ${primerov}`);
});

// Vrstni red izidov (odločitev 2026-09-25): napacno > neutemeljeno > druga-tehnika >
// delno / pravilno; pravilno in delno se izključujeta (pravilno = vsaj en korak KT je
// cel, vsi izbrisi so iz KT).
test('preveriVajo(): mešani odgovori po vrstnem redu izidov', () => {
  let mesanih = 0;
  for (const v of vaje112) {
    const napaka = pravaStevka(v);
    const neut = neutemeljen(v);
    const druga = drugaTehnika(v);
    const kt = v.KT[0].eliminate;
    if (!druga) continue;
    mesanih++;
    // Vse vrste hkrati: napačno.
    assert.equal(preveri(v, [...kt, druga, neut, napaka]).izid, 'napacno', v.kljuc);
    // Brez prave števke: neutemeljeno; razveljavijo se vsi izbrisi zunaj KT, izbrisi KT ostanejo.
    const r1 = preveri(v, [...kt, druga, neut]);
    assert.equal(r1.izid, 'neutemeljeno', v.kljuc);
    assert.deepEqual(sortiraj(r1.razveljavi), sortiraj([druga, neut]));
    // Cel korak KT in izbris druge tehnike: druga-tehnika, razveljavi se samo tisti izbris.
    const { igra, stanje } = odstrani(v, [...kt, druga]);
    const r2 = E.preveriVajo(v, stanje);
    assert.equal(r2.izid, 'druga-tehnika', v.kljuc);
    assert.deepEqual(sortiraj(r2.razveljavi), sortiraj([druga]));
    // Ko UI izbris razveljavi (vrne kandidata), ostane cel korak KT: pravilno.
    for (const [c, d] of r2.razveljavi) {
      assert.ok(E.dodajPotezo(igra, { tip: 'kandidat', celica: c, stevka: d, odstrani: false }));
    }
    assert.equal(E.preveriVajo(v, E.stanjeIgre(igra)).izid, 'pravilno', v.kljuc);
    // Del koraka KT in izbris druge tehnike: druga-tehnika.
    assert.equal(preveri(v, [kt[0], druga]).izid, 'druga-tehnika', v.kljuc);
  }
  assert.ok(mesanih >= 5, `mešanih primerov: ${mesanih}`);
  // Cel korak KT in del drugega koraka KT: pravilno (vsi izbrisi so utemeljeni s tehniko).
  let dveKT = 0;
  for (const v of vaje112) {
    for (const a of v.KT) {
      const vA = new Set(a.eliminate.map(kljucIzbrisa));
      const b = v.KT.find(x => x !== a && x.eliminate.length >= 2 && x.eliminate.some(e => !vA.has(kljucIzbrisa(e))));
      if (!b) continue;
      const dodatni = b.eliminate.filter(e => !vA.has(kljucIzbrisa(e))).slice(0, 1);
      const r = preveri(v, [...a.eliminate, ...dodatni]);
      assert.equal(r.izid, 'pravilno', v.kljuc);
      dveKT++;
      break;
    }
  }
  assert.ok(dveKT > 0, 'vsaj en primer z dvema korakoma KT');
});

test('preveriVajo(): vpisi niso del odgovora pri 1-12', () => {
  const v = vaje112[0];
  const igra = JSON.parse(JSON.stringify(v.igra));
  const c = [...Array(81).keys()].find(x => !v.S0.grid[x]);
  assert.ok(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: v.resitev[c] }));
  assert.equal(E.preveriVajo(v, E.stanjeIgre(igra)).izid, 'prazno');
});

/* ---------- presoja odgovora E1, E2 ---------- */

test('preveriVajo() pri E1 in E2: predlog vpisa presodi preveriEnojcek()', () => {
  for (const kljuc of ENOJCKA) {
    let nevtralnih = 0;
    for (const v of vaje.get(kljuc)) {
      assert.equal(E.preveriVajo(v, v.S0).izid, 'prazno');
      const kt = new Set(v.KT.map(k => kljucIzbrisa(k.assign[0])));
      for (let c = 0; c < 81; c++) {
        if (v.S0.grid[c]) continue;
        // Prava števka: pravilno natanko pri koraku tehnike, sicer nevtralno.
        const r = E.preveriVajo(v, v.S0, { celica: c, stevka: v.resitev[c] });
        const prav = kt.has(c * 10 + v.resitev[c]);
        assert.equal(r.izid, prav ? 'pravilno' : 'nevtralno', `${kljuc} ${E.cellLabel(c)}`);
        if (prav) assert.equal(r.korak.assign[0][0], c);
        else nevtralnih++;
        // Števka, ki ni kandidat: napačno.
        const ni = bits(E.FULL & ~v.S0.kandidati[c])[0];
        if (ni) assert.equal(E.preveriVajo(v, v.S0, { celica: c, stevka: ni }).izid, 'napacno');
      }
    }
    assert.ok(nevtralnih > 0, `${kljuc}: prava števka, ki je tehnika ne dokaže`);
  }
});
