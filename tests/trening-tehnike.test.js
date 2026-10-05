'use strict';
// Številke tehnik iz treninga (TRENING_TEHNIKE v shared/engine.js) in enojčka z oznakama
// E1, E2 (TRENING_ENOJCKA): seznama se skupaj morata ujemati s karticami v
// trening/index.html in z MODES v trening/generators.js, TRENING_TEHNIKE mora vsebovati
// vse tehnike iz ALL_TECHNIQUES razen enojčkov (enojčka imata v »Tehnike:« oznaki E1, E2).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js', 'trening/generators.js', 'shared/zbirka.js'],
  names: ['TRENING_TEHNIKE', 'TRENING_ENOJCKA', 'oznakaTehnike', 'MODES', 'zbirkaBesediloTehnik', 'zbirkaTehnikeZapisa', 'zbirkaPodatkiResevanja',
    'zbirkaIzMarkdowna', 'zbirkaVMarkdown',
    'TEHNIKE_OPISI', 'opisVaje', 'opisTehnike', 'imeTehnike', 'redTehnike', 'stepHint',
    'genMinimalnaUganka', 'stanjaVUganki', 'vajaIzStanja', 'preveriVajo', 'stanjeIgre', 'dodajPotezo', 'Math'],
});
// Math.random s stalnim semenom (mulberry32): besedila naključnih vaj so ob vsakem zagonu ista.
let seme = 20261005;
E.Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const treningHtml = fs.readFileSync(path.join(__dirname, '..', 'trening', 'index.html'), 'utf8');
const kartice = [...treningHtml.matchAll(/class="menu-card" data-mode="([^"]+)"/g)].map(m => m[1]);
// Naslov kartice v meniju: data-mode -> besedilo <h3>.
const naslovi = new Map([...treningHtml.matchAll(/data-mode="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)].map(m => [m[1], m[2]]));
const nacini = E.TRENING_TEHNIKE.map(([m]) => m);
const imena = E.TRENING_TEHNIKE.map(([, t]) => t);
const ENOJCKA = ['Gol enojček', 'Skriti enojček'];
// Vse vaje v treningu: E1, E2, nato 1-12.
const vseVaje = [...E.TRENING_ENOJCKA.map(([m]) => m), ...nacini];

test('TRENING_ENOJCKA in TRENING_TEHNIKE se ujemata s karticami v trening/index.html in z MODES', () => {
  assert.deepEqual([...E.TRENING_ENOJCKA.map(([m]) => m)], ['naked-single', 'hidden-single']);
  // Drugi element je ključ v ALL_TECHNIQUES, kot pri TRENING_TEHNIKE (ime da imeTehnike()).
  assert.deepEqual([...E.TRENING_ENOJCKA.map(([, t]) => t)], ENOJCKA);
  assert.equal(new Set(vseVaje).size, vseVaje.length, 'oznaka kartice se ponovi');
  assert.deepEqual([...kartice].sort(), [...vseVaje].sort(), 'kartice v HTML');
  assert.deepEqual(Object.keys(E.MODES).sort(), [...vseVaje].sort(), 'MODES v generators.js');
});

// Enojčka imata oznaki E1 in E2 namesto številke: številke 1-12 ostanejo nespremenjene.
test('oznake v treningu: E1, E2, nato 1-12', () => {
  assert.deepEqual(vseVaje.map(m => E.oznakaTehnike(m)),
    ['E1', 'E2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  assert.equal(E.oznakaTehnike('neznana'), '');
});

test('TRENING_TEHNIKE je brez enojčkov', () => {
  for (const m of E.TRENING_ENOJCKA.map(([k]) => k)) assert.ok(!nacini.includes(m), m);
  for (const t of ENOJCKA) assert.ok(!imena.includes(t), t);
});

test('TRENING_TEHNIKE vsebuje vse tehnike iz ALL_TECHNIQUES razen enojčkov, vsako enkrat', () => {
  assert.equal(new Set(imena).size, imena.length, 'tehnika se ponovi');
  const vse = E.ALL_TECHNIQUES.map(([t]) => t);
  for (const t of imena) assert.ok(vse.includes(t), `${t} ni v ALL_TECHNIQUES`);
  for (const t of vse) {
    if (!ENOJCKA.includes(t)) assert.ok(imena.includes(t), `${t} nima številke v treningu`);
  }
});

// Odločitev 2026-09-24: znotraj ravni po zahtevnosti (srednje po Sudoku Explainerju,
// napredne po SE, Turbot Fish in W-Wing po točkah HoDoKu - docs/tehnike.md), povsod
// isti vrstni red: motor, pomoč v igri, številke v treningu in pri ugankah.
test('številke tehnik 1-12 in isti vrstni red kot v ALL_TECHNIQUES', () => {
  assert.deepEqual([...imena], [
    'Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'Hidden pair',
    'Naked triple', 'Hidden triple',
    'X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle',
  ]);
  assert.deepEqual([...E.ALL_TECHNIQUES.map(([t]) => t)].filter(t => !ENOJCKA.includes(t)), [...imena]);
});

// Značka kartice v treningu je raven tehnike (docs/uskladitev.md, 1.1): lahka E1, E2,
// srednja 1-6, napredna 7-12.
test('značke v treningu: LAHKA za E1-E2, SREDNJA za 1-6, NAPREDNA za 7-12', () => {
  const znacke = new Map([...treningHtml.matchAll(/data-mode="([^"]+)">\s*<span class="badge badge-(\w+)">([^<]+)<\/span>/g)]
    .map(m => [m[1], [m[2], m[3]]]));
  for (const [m] of E.TRENING_ENOJCKA) assert.deepEqual(znacke.get(m), ['lahka', 'LAHKA'], m);
  nacini.forEach((m, i) => {
    const pricakovano = i < 6 ? ['srednja', 'SREDNJA'] : ['napredna', 'NAPREDNA'];
    assert.deepEqual(znacke.get(m), pricakovano, `${i + 1}. ${m}`);
  });
});

// Številke niso shranjene nikjer: zbirka in izvoz hranita imena tehnik, številko da
// zbirkaKratkoImeTehnike() ob prikazu. Izvoz iz časa pred preštevilčenjem (2026-09-24,
// takrat je bil Naked pair 1, Pointing 3) zato po uvozu kaže nove številke.
test('izvoz hrani imena tehnik, star izvoz po uvozu dobi nove številke', () => {
  // Uganka, ki ni vgrajeni primer (primere uvoz preskoči).
  const danosti = loadPuzzles().find(p => p.ime === 'hard-17-a').danosti;
  const star = [
    '### 2026-09-20 10:00 · Srednja', '',
    `- **Danosti:** \`${danosti}\``,
    '- **Težavnost:** Srednja',
    '- **Tehnike:** Skriti enojček 30, Gol enojček 27, Naked pair 2, Hidden triple 1, Pointing pair/triple 1',
  ].join('\n');
  const { zapisi } = E.zbirkaIzMarkdowna(star);
  assert.equal(zapisi.length, 1);
  const besedilo = z => E.zbirkaBesediloTehnik(E.zbirkaTehnikeZapisa(z));
  const pricakovano = 'Tehnike: E1, E2, 1 Izločitev izven bloka, 3 Očitni par in 6 Skrita trojica';
  assert.equal(besedilo(zapisi[0]), pricakovano);
  const izvoz = E.zbirkaVMarkdown(zapisi);
  // Izvoz tehnike uredi po vrstnem redu tehnik (redTehnike()), ne po pogostosti, in
  // zapiše slovenska imena brez oklepaja (imeTehnike()); uvoz jih prebere nazaj v ključe.
  assert.match(izvoz, /\*\*Tehnike:\*\* Očitni enojček 27, Skriti enojček 30, Izločitev izven bloka 1, Očitni par 2, Skrita trojica 1$/m);
  assert.equal(besedilo(E.zbirkaIzMarkdowna(izvoz).zapisi[0]), pricakovano, 'nov izvoz po uvozu');
  assert.doesNotMatch(izvoz, /tehnike: \d/, 'v izvozu ni številk tehnik');
});

test('»Tehnike:« uganke v zbirki: številke in imena iz treninga, enojčka E1/E2, poskus je »ugibanje«', () => {
  const besedilo = tehnike => E.zbirkaBesediloTehnik(E.zbirkaTehnikeZapisa({ tehnike }));
  const ime = kljuc => `${imena.indexOf(kljuc) + 1} ${E.imeTehnike(kljuc, { anglesko: false })}`;
  assert.equal(E.zbirkaBesediloTehnik(E.zbirkaTehnikeZapisa({})), 'Tehnike: ni podatkov');
  assert.equal(besedilo(null), 'Tehnike: ni podatkov');
  assert.equal(besedilo([]), 'Tehnike: ni podatkov');
  assert.equal(besedilo([['Skriti enojček', 30], ['Gol enojček', 20]]), 'Tehnike: E1 in E2');
  assert.equal(besedilo([['Skriti enojček', 9], ['X-Wing', 1], ['Naked pair', 2]]),
    `Tehnike: E2, ${ime('Naked pair')} in ${ime('X-Wing')}`);
  assert.equal(besedilo([['Gol enojček', 5], ['Poskus in protislovje (forcing chain)', 1]]), 'Tehnike: E1 in ugibanje');
  assert.equal(besedilo([['Turbot Fish', 2], ['Poskus in protislovje (forcing chain)', 3]]),
    `Tehnike: ${ime('Turbot Fish')} in ugibanje`);
  assert.equal(besedilo([['Pointing pair/triple', 1], ['Stara tehnika', 1]]), `Tehnike: ${ime('Pointing pair/triple')} in Stara tehnika`);
});

test('»Tehnike:« na ugankah iz docs/uganke.md: vsaka uporabljena tehnika ima oznako ali številko', () => {
  const del = String.raw`(E[12]|\d+ [^,]+?|ugibanje)`;
  for (const p of loadPuzzles()) {
    const { board, log } = E.solve(p.danosti.replace(/\./g, '0'));
    const z = E.zbirkaPodatkiResevanja(board, log);
    const o = E.zbirkaBesediloTehnik(E.zbirkaTehnikeZapisa(z));
    assert.match(o, new RegExp(`^Tehnike: ${del}((, ${del})* in ${del})?$`), `${p.ime}: ${o}`);
    const poskus = z.tehnike.some(([t]) => t.includes('protislovje'));
    assert.equal(/ in ugibanje$/.test(o), poskus, `${p.ime}: ${o}`);
    assert.doesNotMatch(o, /\+/, `${p.ime}: ${o}`);
  }
});

/* ---------- opisi tehnik (TEHNIKE_OPISI v shared/engine.js) ---------- */

// Faza 6 (docs/faza6-besedila.md): povzetek (kartica in besedilo pod nalogo), razlaga (kako
// vzorec prepoznaš), posledica (kaj izbrišeš ali vpišeš in zakaj) in navodilo (kaj izbereš v
// »Spoznaj«) so izpolnjeni pri vseh 14 tehnikah. Pravila besedil: glagol »izbriši«, druga oseba
// ednine, števila z besedo, pari v zavitih oklepajih, brez omembe drugih aplikacij.
const POLJA_OPISA = ['povzetek', 'razlaga', 'posledica', 'navodilo'];
test('TEHNIKE_OPISI: vsaka tehnika ima ime, povzetek, razlago, posledico in navodilo', () => {
  assert.deepEqual(Object.keys(E.TEHNIKE_OPISI).sort(), [...vseVaje].sort());
  for (const kljuc of vseVaje) {
    const o = E.TEHNIKE_OPISI[kljuc];
    for (const polje of ['ime', ...POLJA_OPISA]) {
      assert.ok(o[polje], `${kljuc}: ${polje}`);
      assert.equal(o[polje].trim(), o[polje], `${kljuc}: ${polje} brez odvečnih presledkov`);
    }
    // Pod nalogo povzetek z navodilom, v razdelku "Razlaga" in v oknu Pomoč razlaga s posledico.
    assert.equal(E.opisVaje(kljuc), `${o.povzetek} ${o.navodilo}`, `${kljuc}: opisVaje()`);
    assert.equal(E.opisTehnike(kljuc), `${o.razlaga} ${o.posledica}`, `${kljuc}: opisTehnike()`);
    assert.match(o.posledica, /izbrišeš|vpišeš/, `${kljuc}: posledica pove, kaj izbrišeš ali vpišeš`);
  }
});

test('TEHNIKE_OPISI: pravila besedil (izbriši, druga oseba, števila z besedo, pari {x, y})', () => {
  for (const kljuc of vseVaje) {
    for (const polje of POLJA_OPISA) {
      const t = E.TEHNIKE_OPISI[kljuc][polje];
      preveriBesedilo(t, `${kljuc}.${polje}`);
      assert.doesNotMatch(t, /\b[2-9] (celic|vrstic|stolp|števk|kandidat|vogal|blok)/, `${kljuc}.${polje}: število s številko`);
      assert.doesNotMatch(t, /Oakever|aplikacij/i, `${kljuc}.${polje}: omemba druge aplikacije`);
    }
  }
});

// Naslov kartice v HTML je nadomestek - trening.js ga ob zagonu prepiše z imeTehnike()
// (tega nadomestni DOM ne preveri, querySelector() vrne null). Privzeta oblika
// imeTehnike() je brez številke, zato enakost preveri tudi, da je številka samo v
// data-stevilka.
test('naslov kartice v trening/index.html je imeTehnike(), opis povzetek, MODES.desc je opisVaje()', () => {
  // Opis na kartici je (kot naslov) nadomestek - trening.js ga prepiše s povzetkom (faza 6).
  const opisi = new Map([...treningHtml.matchAll(/data-mode="([^"]+)"[\s\S]*?<\/h3>\s*<p>([^<]*)<\/p>/g)].map(m => [m[1], m[2]]));
  for (const [m, kljuc] of [...E.TRENING_ENOJCKA, ...E.TRENING_TEHNIKE]) {
    assert.equal(naslovi.get(m), E.imeTehnike(kljuc), `${m}: naslov kartice`);
    assert.equal(opisi.get(m), E.TEHNIKE_OPISI[m].povzetek, `${m}: opis kartice`);
    assert.equal(E.MODES[m].desc, E.opisVaje(m), `${m}: MODES.desc`);
    assert.equal(E.MODES[m].name, undefined, `${m}: MODES.name ne obstaja več (ime da imeTehnike())`);
  }
});

/* ---------- ime tehnike za prikaz (imeTehnike, redTehnike v shared/engine.js) ---------- */

test('imeTehnike(): vsaka tehnika iz ALL_TECHNIQUES ima slovensko in angleško ime', () => {
  const vse = E.ALL_TECHNIQUES.map(([t]) => t);
  for (const t of vse) {
    const ime = E.imeTehnike(t);
    assert.match(ime, /^[^()]+ \([^()]+\)$/, `${t}: "${ime}" = slovensko (angleško)`);
    assert.notEqual(ime, t, `${t}: ime za prikaz ni ključ motorja`);
  }
  for (const kljuc of vseVaje) {
    const o = E.TEHNIKE_OPISI[kljuc];
    assert.ok(o.ime && o.anglesko, `${kljuc}: ime in anglesko`);
    assert.doesNotMatch(o.ime, /[()]/, `${kljuc}: ime brez oklepaja`);
  }
  assert.equal(new Set(vse.map(t => E.imeTehnike(t, { anglesko: false }))).size, vse.length, 'slovenska imena so različna');
});

test('imeTehnike(): dogovorjene oblike (docs/faza4-nacrt.md, del 1)', () => {
  // Privzeto brez številke in brez ločila " · " (naslov kartice v treningu).
  assert.equal(E.imeTehnike('Hidden pair'), 'Skriti par (Hidden Pair)');
  assert.equal(E.imeTehnike('Gol enojček'), 'Očitni enojček (Naked Single)');
  assert.equal(E.imeTehnike('XY-Wing'), 'XY-krilo (XY-Wing, Y-Wing)');
  for (const [t] of E.ALL_TECHNIQUES) {
    assert.doesNotMatch(E.imeTehnike(t), /^(E?\d+)|·/, `${t}: privzeto brez številke`);
  }
  // S številko iz treninga.
  assert.equal(E.imeTehnike('Hidden pair', { stevilka: true }), '4 · Skriti par (Hidden Pair)');
  assert.equal(E.imeTehnike('Gol enojček', { stevilka: true }), 'E1 · Očitni enojček (Naked Single)');
  assert.equal(E.imeTehnike('Skriti enojček', { stevilka: true }), 'E2 · Skriti enojček (Hidden Single)');
  assert.equal(E.imeTehnike('Unique Rectangle', { stevilka: true }), '12 · Edinstveni pravokotnik (Unique Rectangle)');
  for (const [m, t] of E.TRENING_TEHNIKE) {
    assert.ok(E.imeTehnike(t, { stevilka: true }).startsWith(E.oznakaTehnike(m) + ' · '), t);
  }
  // Brez oklepaja (oznaka koraka; celo ime je v namigu miške).
  assert.equal(E.imeTehnike('Hidden pair', { stevilka: true, anglesko: false }), '4 · Skriti par');
  assert.equal(E.imeTehnike('Turbot Fish', { anglesko: false }), 'Veriga ene števke');
  // Poskus: brez številke, angleško z veliko začetnico; ključ motorja se ne spremeni.
  const poskus = 'Poskus in protislovje (forcing chain)';
  assert.ok(E.solve('000800020900000600000000000604000900000720003500000000000056000080009000070000010')
    .log.some(s => s.technique === poskus), 'ključ poskusa v dnevniku solve()');
  assert.equal(E.imeTehnike(poskus), 'Poskus in protislovje (Trial and Error)');
  assert.equal(E.imeTehnike(poskus, { stevilka: true }), 'Poskus in protislovje (Trial and Error)');
  assert.equal(E.imeTehnike(poskus, { stevilka: true, anglesko: false }), 'Poskus in protislovje');
  assert.equal(E.imeTehnike('Poskus in protislovje (V1S1 = 5)'), 'Poskus in protislovje (Trial and Error)', 'star zapis');
  // Neznan ključ ostane nespremenjen.
  for (const t of ['OBSTALO', 'NAPAKA', 'Stara tehnika']) {
    assert.equal(E.imeTehnike(t), t);
    assert.equal(E.imeTehnike(t, { stevilka: true, anglesko: false }), t);
  }
});

test('redTehnike(): vrstni red ALL_TECHNIQUES, nato poskus, nato neznane', () => {
  const vse = E.ALL_TECHNIQUES.map(([t]) => t);
  vse.forEach((t, i) => assert.equal(E.redTehnike(t), i, t));
  const poskus = E.redTehnike('Poskus in protislovje (forcing chain)');
  assert.ok(poskus > E.redTehnike(vse[vse.length - 1]), 'poskus za vsemi tehnikami');
  assert.equal(E.redTehnike('Poskus in protislovje (V1S1 = 5)'), poskus);
  assert.ok(E.redTehnike('Stara tehnika') > poskus, 'neznana na koncu');
  const pomesano = ['Stara tehnika', 'X-Wing', 'Poskus in protislovje (forcing chain)', 'Naked pair', 'Gol enojček'];
  assert.deepEqual([...pomesano].sort((a, b) => E.redTehnike(a) - E.redTehnike(b)),
    ['Gol enojček', 'Naked pair', 'X-Wing', 'Poskus in protislovje (forcing chain)', 'Stara tehnika']);
});

test('TEHNIKE_OPISI: izraz je povsod "števka", ne "številka"', () => {
  for (const kljuc of vseVaje) {
    const o = E.TEHNIKE_OPISI[kljuc];
    for (const [polje, t] of Object.entries(o)) {
      assert.doesNotMatch(t, /številk/i, `${kljuc}.${polje}`);
    }
  }
});

// Odločitev 2026-09-25 (docs/faza4-nacrt.md, del 3): angleški imeni po virih iz
// docs/tehnike.md - podtip verige »2-String Kite«, poskus »Trial and Error«. Notranja
// vrednost step.variant ostane 'Two-String Kite'.
test('angleški imeni po virih: »2-String Kite« in »Trial and Error«', () => {
  for (const kljuc of vseVaje) {
    for (const [polje, t] of Object.entries(E.TEHNIKE_OPISI[kljuc])) {
      assert.doesNotMatch(t, /Two-String|Forcing Chain/i, `${kljuc}.${polje}`);
    }
  }
  assert.match(E.TEHNIKE_OPISI['turbot-fish'].razlaga, /Zmaj z dvema vrvicama \(2-String Kite\)/);
  for (const t of ['Poskus in protislovje (forcing chain)', 'Poskus in protislovje (V1S1 = 5)']) {
    assert.equal(E.imeTehnike(t), 'Poskus in protislovje (Trial and Error)', t);
    assert.equal(E.imeTehnike(t, { stevilka: true, anglesko: false }), 'Poskus in protislovje', t);
  }
});

// Besedila, ki jih vidi uporabnik, zunaj TEHNIKE_OPISI (faza 4, del 2): izraz je
// »števka«, tehnike imajo slovensko ime - angleško ime je lahko samo v oklepaju
// (»vzorec Nebotičnik (Skyscraper, veriga ene števke)«). Opuščeni angleški imeni (odločitev
// 2026-09-25) nista nikjer, tudi v oklepaju ne: »Two-String Kite« (zdaj »2-String Kite«)
// in »Forcing Chain« (poskus je »Trial and Error«).
const ANGLESKA = [
  ...Object.values(E.TEHNIKE_OPISI).flatMap(o => o.anglesko.split(', ')),
  'Skyscraper', '2-String Kite',
];
const OPUSCENA = /Two-String|Forcing Chain/i;
function preveriBesedilo(t, kje) {
  assert.doesNotMatch(t, /številk/i, `${kje}: »številk«`);
  // Faza 6: glagol »izbriši« (ime tehnike »Izločitev …« je dovoljeno), druga oseba ednine, pari
  // v zavitih oklepajih s presledkom za vejico.
  assert.doesNotMatch(t, /odstran|izloč(?!itev)/i, `${kje}: »odstrani« ali »izloči«: ${t}`);
  assert.doesNotMatch(t, /izbrišemo/, `${kje}: »izbrišemo«: ${t}`);
  assert.doesNotMatch(t, /\{[^}]*,\S[^}]*\}/, `${kje}: par brez presledka za vejico: ${t}`);
  assert.doesNotMatch(t, OPUSCENA, `${kje}: opuščeno angleško ime`);
  const brezOklepajev = t.replace(/\([^)]*\)/g, '');
  for (const a of ANGLESKA) assert.ok(!brezOklepajev.includes(a), `${kje}: angleško ime »${a}« zunaj oklepaja: ${t}`);
}

test('besedila vaj v treningu (desc, unitLabel, namig, sporočilo motorja): »števka«, slovenska imena', () => {
  for (const m of vseVaje) {
    for (let n = 0; n < 4; n++) {
      const ex = E.MODES[m].gen(n);
      // Polja, ki jih vidi uporabnik (variant, mode ipd. so notranja).
      for (const polje of ['desc', 'unitLabel', 'namig', 'solutionMessage']) {
        if (ex[polje] !== undefined) preveriBesedilo(ex[polje], `${m} vaja ${n}.${polje}`);
      }
      if (ex.korak) preveriBesedilo(ex.korak.message, `${m} vaja ${n}.korak`);
    }
  }
});

test('sporočila solve() in stepHint() na ugankah iz docs/uganke.md: »števka«, slovenska imena', () => {
  for (const p of loadPuzzles()) {
    const r = E.solve(p.danosti.replace(/\./g, '0'));
    r.log.forEach((s, i) => {
      preveriBesedilo(s.message, `${p.ime} korak ${i + 1} (${s.technique})`);
      const namig = E.stepHint(s);
      if (namig) preveriBesedilo(namig, `${p.ime} namig ${i + 1} (${s.technique})`);
    });
  }
});

// Sporočila presoje v "Vadi v uganki" (preveriVajo() v shared/vaje-uganka.js) za vse
// izide: ime tehnike iz imeTehnike() brez angleškega imena, izraz »števka«. Uganke so iz
// semen, ki imajo stanja za vse tehnike (glej SEMENA v tests/pocasni/vaje-uganka.test.js).
test('sporočila preveriVajo(): »števka«, slovenska imena', () => {
  const izidi = new Set();
  for (const seme of [1, 2, 3, 18, 245]) {
    const danosti = E.genMinimalnaUganka(seme);
    for (const [kljuc] of E.ALL_TECHNIQUES) {
      const r = E.stanjaVUganki(danosti, kljuc);
      for (const s of r.stanja.slice(0, 2)) {
        const v = E.vajaIzStanja(danosti, kljuc, s, r.stopnja);
        const sporocila = [];
        const presodi = (izbrisi, predlog) => {
          const igra = JSON.parse(JSON.stringify(v.igra));
          for (const [c, d] of izbrisi) E.dodajPotezo(igra, { tip: 'kandidat', celica: c, stevka: d, odstrani: true });
          const p = E.preveriVajo(v, E.stanjeIgre(igra), predlog);
          izidi.add(p.izid);
          sporocila.push(p.sporocilo);
        };
        presodi([]);
        if (ENOJCKA.includes(kljuc)) {
          // Vsaka prazna celica z vsemi števkami: pravilno, nevtralno, napačno.
          for (let c = 0; c < 81; c++) if (!v.S0.grid[c]) for (let d = 1; d <= 9; d++) presodi([], { celica: c, stevka: d });
        } else {
          // Koraki vseh tehnik (pravilno, druga tehnika), del koraka (delno), vsak
          // kandidat posebej (napačno, neutemeljeno ...).
          for (const k of v.KV) { presodi(k.eliminate); presodi(k.eliminate.slice(0, 1)); }
          for (let c = 0; c < 81; c++) if (!v.S0.grid[c]) for (const d of E.bitsOf(v.S0.kandidati[c])) presodi([[c, d]]);
        }
        sporocila.forEach((t, i) => preveriBesedilo(t, `${kljuc} seme ${seme} sporočilo ${i}`));
      }
    }
  }
  assert.deepEqual([...izidi].sort(),
    ['delno', 'druga-tehnika', 'napacno', 'neutemeljeno', 'nevtralno', 'pravilno', 'prazno']);
});
