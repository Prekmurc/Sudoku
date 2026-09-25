'use strict';
// Številke tehnik iz treninga (TRENING_TEHNIKE v shared/engine.js) in enojčka z oznakama
// E1, E2 (TRENING_ENOJCKA): seznama se skupaj morata ujemati s karticami v
// trening/index.html in z MODES v trening/generators.js, TRENING_TEHNIKE mora vsebovati
// vse tehnike iz ALL_TECHNIQUES razen enojčkov; oznaka "tehnike: 1, 3, 7" v zbirki
// (zbirkaOznakaTehnik v shared/zbirka.js) enojčkov ne izpisuje.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'trening/generators.js', 'shared/zbirka.js'],
  names: ['TRENING_TEHNIKE', 'TRENING_ENOJCKA', 'oznakaTehnike', 'MODES', 'zbirkaOznakaTehnik', 'zbirkaPodatkiResevanja',
    'zbirkaIzMarkdowna', 'zbirkaVMarkdown',
    'TEHNIKE_OPISI', 'opisVaje', 'opisTehnike', 'imeTehnike', 'redTehnike', 'stepHint'],
});

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
// zbirkaOznakaTehnik() ob prikazu. Izvoz iz časa pred preštevilčenjem (2026-09-24,
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
  assert.equal(E.zbirkaOznakaTehnik(zapisi[0]), 'tehnike: 1, 3, 6');
  const izvoz = E.zbirkaVMarkdown(zapisi);
  // Izvoz tehnike uredi po vrstnem redu tehnik (redTehnike()), ne po pogostosti.
  assert.match(izvoz, /\*\*Tehnike:\*\* Gol enojček 27, Skriti enojček 30, Pointing pair\/triple 1, Naked pair 2, Hidden triple 1$/m);
  assert.doesNotMatch(izvoz, /tehnike: \d/, 'v izvozu ni številk tehnik');
});

test('zbirkaOznakaTehnik(): številke iz treninga, brez enojčkov, poskus posebej', () => {
  const oznaka = tehnike => E.zbirkaOznakaTehnik({ tehnike });
  const st = ime => imena.indexOf(ime) + 1;
  assert.equal(E.zbirkaOznakaTehnik({}), 'tehnike: ni podatkov');
  assert.equal(E.zbirkaOznakaTehnik({ tehnike: null }), 'tehnike: ni podatkov');
  assert.equal(oznaka([]), 'tehnike: samo enojčki');
  assert.equal(oznaka([['Skriti enojček', 30], ['Gol enojček', 20]]), 'tehnike: samo enojčki');
  assert.equal(oznaka([['Skriti enojček', 9], ['X-Wing', 1], ['Naked pair', 2]]),
    `tehnike: ${st('Naked pair')}, ${st('X-Wing')}`);
  assert.equal(oznaka([['Gol enojček', 5], ['Poskus in protislovje (forcing chain)', 1]]), 'tehnike: samo enojčki + poskus');
  assert.equal(oznaka([['Turbot Fish', 2], ['Poskus in protislovje (forcing chain)', 3]]),
    `tehnike: ${st('Turbot Fish')} + poskus ×3`);
  assert.equal(oznaka([['Pointing pair/triple', 1], ['Stara tehnika', 1]]), `tehnike: ${st('Pointing pair/triple')}, Stara tehnika`);
});

test('zbirkaOznakaTehnik() na ugankah iz docs/uganke.md: vsaka uporabljena tehnika ima številko', () => {
  for (const p of loadPuzzles()) {
    const { board, log } = E.solve(p.danosti.replace(/\./g, '0'));
    const z = E.zbirkaPodatkiResevanja(board, log);
    const o = E.zbirkaOznakaTehnik(z);
    assert.match(o, /^tehnike: (samo enojčki|\d+(, \d+)*)( \+ poskus( ×\d+)?)?$/, `${p.ime}: ${o}`);
    const poskus = z.tehnike.some(([t]) => t.includes('protislovje'));
    assert.equal(o.includes('+ poskus'), poskus, `${p.ime}: ${o}`);
  }
});

/* ---------- opisi tehnik (TEHNIKE_OPISI v shared/engine.js) ---------- */

test('TEHNIKE_OPISI: vsaka tehnika iz treninga ima ime in razlago, besedili za vajo in za pomoč nista prazni', () => {
  assert.deepEqual(Object.keys(E.TEHNIKE_OPISI).sort(), [...vseVaje].sort());
  for (const kljuc of vseVaje) {
    const o = E.TEHNIKE_OPISI[kljuc];
    assert.ok(o.ime && o.razlaga, `${kljuc}: ime in razlaga`);
    assert.equal(o.razlaga.trim(), o.razlaga, `${kljuc}: razlaga brez odvečnih presledkov`);
    assert.ok(E.opisVaje(kljuc).startsWith(o.razlaga), `${kljuc}: besedilo vaje se začne z razlago`);
    assert.ok(E.opisTehnike(kljuc).startsWith(o.razlaga), `${kljuc}: besedilo pomoči se začne z razlago`);
    // V oknu Pomoč mora razlaga povedati tudi, kaj iz vzorca sledi (izbris ali vpis).
    assert.match(E.opisTehnike(kljuc), /izbriš|izbrišemo|vpišeš/, `${kljuc}: pomoč pove, kaj se izbriše ali vpiše`);
  }
});

// Naslov kartice v HTML je nadomestek - trening.js ga ob zagonu prepiše z imeTehnike()
// (tega nadomestni DOM ne preveri, querySelector() vrne null). Privzeta oblika
// imeTehnike() je brez številke, zato enakost preveri tudi, da je številka samo v
// data-stevilka.
test('naslov kartice v trening/index.html je imeTehnike(), MODES.desc je opisVaje()', () => {
  for (const [m, kljuc] of [...E.TRENING_ENOJCKA, ...E.TRENING_TEHNIKE]) {
    assert.equal(naslovi.get(m), E.imeTehnike(kljuc), `${m}: naslov kartice`);
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
  assert.equal(E.imeTehnike(poskus), 'Poskus in protislovje (Forcing Chain)');
  assert.equal(E.imeTehnike(poskus, { stevilka: true }), 'Poskus in protislovje (Forcing Chain)');
  assert.equal(E.imeTehnike(poskus, { stevilka: true, anglesko: false }), 'Poskus in protislovje');
  assert.equal(E.imeTehnike('Poskus in protislovje (V1S1 = 5)'), 'Poskus in protislovje (Forcing Chain)', 'star zapis');
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

// Besedila, ki jih vidi uporabnik, zunaj TEHNIKE_OPISI (faza 4, del 2): izraz je
// »števka«, tehnike imajo slovensko ime - angleško ime je lahko samo v oklepaju
// (»vzorec Nebotičnik (Skyscraper, veriga ene števke)«).
const ANGLESKA = [
  ...Object.values(E.TEHNIKE_OPISI).flatMap(o => o.anglesko.split(', ')),
  'Skyscraper', 'Two-String Kite',
];
function preveriBesedilo(t, kje) {
  assert.doesNotMatch(t, /številk/i, `${kje}: »številk«`);
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
