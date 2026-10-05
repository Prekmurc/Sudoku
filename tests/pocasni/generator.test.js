'use strict';
// Testi generatorja ugank (shared/generator.js): opredelitev stopenj (docs/uskladitev.md,
// razdelek 7), pogoji generatorja, enoličnost rešitve in ponovljivost po semenu.
// Uganke tu niso sestavljene na pamet - ustvari jih generator in vsaka je preverjena s
// countSolutions()/solve() (CLAUDE.md).
// Zagon (vsi testi): node --test "tests/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadContext, loadPuzzles } = require('../load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/stanje.js', 'shared/zbirka.js', 'shared/generator.js'],
  names: ['applyStep', 'STOPNJE_UGANK', 'STOPNJE_GENERATORJA', 'stopnjaUganke', 'ustvariUganko',
    'oceniStopnjo', 'oceniUganko', 'oceniTezavnost', 'genPot', 'genRazvrsti', 'genTehnikeSolve',
    'GEN_LAHKE', 'GEN_PRESEKI', 'GEN_PARI', 'GEN_TROJICE', 'GEN_SREDNJE', 'GEN_NAPREDNE',
    'GEN_EKSPERTNE', 'TEZAVNOSTI', 'PRIMERI', 'genMinimalnaUganka', 'zbirkaBesediloTehnik', 'zbirkaTehnikeZapisa', 'zbirkaPotIzOcene',
    'TRENING_TEHNIKE', 'GEN_NAJMANJ_SREDNJIH', 'GEN_TEZKA_NAJVEC', 'countSolutions'],
});
const VSE_TEHNIKE = E.ALL_TECHNIQUES.map(([ime]) => ime);

// Semena, pri katerih generator da uganko te stopnje (preverjeno ob pisanju testa;
// seme da vedno isto uganko, zato so testi ponovljivi in hitri).
// Zelo težka: seme 18 (prej 3 - ta po opredelitvi 2026-10-04 da težko, ker zadošča ena napredna).
const SEMENA = { lahka: 1, srednja: 5, tezka: 7, zelotezka: 18 };
const uganke = {};
for (const kljuc of Object.keys(SEMENA)) {
  uganke[kljuc] = E.ustvariUganko(kljuc, SEMENA[kljuc]);
  assert.ok(uganke[kljuc], `seme ${SEMENA[kljuc]} mora dati uganko stopnje ${kljuc}`);
}

// Pot motorja s samimi tehnikami `imena` (po vrstnem redu ALL_TECHNIQUES) s štetjem uporab:
// { tehnika: uporab } ali null, če se zatakne. Neodvisno od genPot() v shared/generator.js.
function potZUporabami(danosti, imena) {
  const tehnike = E.ALL_TECHNIQUES.filter(([ime]) => imena.includes(ime));
  const b = new E.Board(danosti);
  const uporab = {};
  for (let k = 0; k < 500 && !b.isSolved(); k++) {
    const t = tehnike.find(([, fn]) => fn(b).length);
    if (!t) return null;
    uporab[t[0]] = (uporab[t[0]] || 0) + 1;
    E.applyStep(b, t[1](b)[0]);
  }
  return b.isSolved() ? uporab : null;
}
const naprednihV = uporab => Object.keys(uporab).filter(t => E.GEN_NAPREDNE.includes(t));
// Prva napredna tehnika po vrstnem redu, ki skupaj z lažjimi reši uganko, ali null.
function prvaZadostna(danosti) {
  return E.GEN_NAPREDNE.find(t => potZUporabami(danosti, [...E.GEN_LAHKE, ...E.GEN_SREDNJE, t])) || null;
}
// Pot ocene po opredelitvi na vrhu shared/generator.js (odločitev 2026-10-04): pot v stalnem
// vrstnem redu; če uporabi dve ali več naprednih, pot z eno samo - s prvo, ki zadošča.
function potOcene(danosti) {
  const vse = potZUporabami(danosti, VSE_TEHNIKE);
  if (!vse || naprednihV(vse).length < 2) return vse;
  const t = prvaZadostna(danosti);
  return t ? potZUporabami(danosti, [...E.GEN_LAHKE, ...E.GEN_SREDNJE, t]) : vse;
}

// Stopnje, ki jim uganka ustreza po merah iz genRazvrsti(); null = motor v stalnem
// vrstnem redu je brez ugibanja ne reši.
function stopnjeZa(danosti) {
  const m = E.genRazvrsti(danosti);
  // [...] - STOPNJE_UGANK je iz vm konteksta, deepEqual zahteva polje iz tega realma.
  return m ? [...E.STOPNJE_UGANK].filter(s => s.ustreza(m)).map(s => s.kljuc) : null;
}

test('stopnje: ključi, imena in opisi', () => {
  assert.deepEqual([...E.STOPNJE_UGANK].map(s => s.kljuc), ['lahka', 'srednja', 'tezka', 'zelotezka', 'ekstrem']);
  // Ime stopnje je hkrati težavnost v zbirki: prvih pet vrednosti v TEZAVNOSTI
  // (shared/zbirka.js), da se imeni ne moreta razdvojiti. Sledijo oznake uganke brez
  // stopnje; "Drugo" ne obstaja več.
  const imena = [...E.STOPNJE_UGANK].map(s => s.ime);
  assert.deepEqual(imena, ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstrem']);
  assert.deepEqual([...E.TEZAVNOSTI], [...imena, 'Presega tehnike', 'Več rešitev', 'Brez rešitve']);
  for (const s of E.STOPNJE_UGANK) {
    assert.ok(s.ime && s.opis, `stopnja ${s.kljuc} mora imeti ime in opis`);
    assert.equal(typeof s.ustreza, 'function', `stopnja ${s.kljuc} mora imeti merilo`);
    assert.equal(E.stopnjaUganke(s.kljuc), s);
  }
  // Generator ponuja štiri stopnje; Ekstrem (ekspertna tehnika) nima merila iskanja.
  assert.deepEqual([...E.STOPNJE_GENERATORJA].map(s => s.kljuc), ['lahka', 'srednja', 'tezka', 'zelotezka']);
  for (const s of E.STOPNJE_GENERATORJA) {
    assert.equal(typeof s.ustrezaIskanju, 'function', `stopnja ${s.kljuc} mora imeti merilo iskanja`);
    // Opis merila generatorja (okno "Nova uganka", namig na gumbu) - docs/uskladitev.md 5.2.
    assert.ok(s.opisIskanja, `stopnja ${s.kljuc} mora imeti opis merila iskanja`);
  }
  assert.equal(E.stopnjaUganke('ekstrem').ustrezaIskanju, null);
  assert.equal(E.stopnjaUganke('ekstrem').opisIskanja, null);
  assert.equal(E.stopnjaUganke('ni-take'), null);
});

// Ravni tehnik so izrecne: vsaka tehnika motorja (tudi enojčka, ki sta v
// ALL_TECHNIQUES prva) je v natanko eni ravni - nova tehnika brez ravni tu pade.
test('ravni: vsaka tehnika iz ALL_TECHNIQUES je v natanko eni ravni', () => {
  const ravni = { lahke: E.GEN_LAHKE, srednje: E.GEN_SREDNJE, napredne: E.GEN_NAPREDNE, ekspertne: E.GEN_EKSPERTNE };
  for (const ime of VSE_TEHNIKE) {
    const v = Object.entries(ravni).filter(([, r]) => r.includes(ime)).map(([k]) => k);
    assert.equal(v.length, 1, `${ime}: ravni [${v.join(', ')}]`);
  }
  const vse = Object.values(ravni).flatMap(r => [...r]);
  assert.equal(vse.length, VSE_TEHNIKE.length, 'v ravneh ni tehnik, ki jih motor nima');
  assert.deepEqual([...E.GEN_LAHKE], ['Gol enojček', 'Skriti enojček'], 'lahke = E1, E2');
  assert.deepEqual([...E.GEN_SREDNJE], [...VSE_TEHNIKE.slice(2, 8)], 'srednje = 1-6');
  assert.deepEqual([...E.GEN_NAPREDNE], [...VSE_TEHNIKE.slice(8, 14)], 'napredne = 7-12');
  assert.deepEqual([...E.GEN_EKSPERTNE], [], 'ekspertne tehnike (13, XY-veriga) še ni');
});

test('vsaka ustvarjena uganka ima natanko eno rešitev in jo solve() reši brez ugibanja', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    assert.match(u.danosti, /^[0-9]{81}$/, `${kljuc}: 81 znakov`);
    assert.equal(E.countSolutions(u.danosti), 1, `${kljuc}: natanko ena rešitev`);
    const tehnike = E.genTehnikeSolve(u.danosti);
    assert.ok(tehnike, `${kljuc}: solve() jo reši brez poskusa s protislovjem`);
    assert.deepEqual({ ...tehnike }, { ...u.tehnike });
  }
});

test('merilo stopnje: mere iz genRazvrsti() ustrezajo natanko svoji stopnji', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const m = E.genRazvrsti(u.danosti);
    assert.ok(m, `${kljuc}: pot brez ugibanja mora uspeti`);
    assert.deepEqual({ srednje: m.srednje, napredne: m.napredne, ekspertne: m.ekspertne, tehNad: m.tehNad },
      { srednje: u.mere.srednje, napredne: u.mere.napredne, ekspertne: u.mere.ekspertne, tehNad: u.mere.tehNad },
      `${kljuc}: mere ustvarjene uganke`);
    assert.deepEqual(stopnjeZa(u.danosti), [kljuc], `${kljuc}: ustreza samo svoji stopnji`);
  }
});

test('lahka samo enojčki, srednja para/trojica/presek, težka ena napredna, zelo težka več', () => {
  // lahka: reši se samo z enojčki (brez zapisanih kandidatov).
  assert.ok(E.genPot(uganke.lahka.danosti, E.GEN_LAHKE), 'lahko rešijo sami enojčki');
  assert.equal(uganke.lahka.mere.tehNad, 0, 'lahka ne potrebuje tehnike nad enojčki');
  // srednja: samih enojčkov ni dovolj, naprednih ne potrebuje.
  assert.equal(E.genPot(uganke.srednja.danosti, E.GEN_LAHKE), null, 'srednje ne rešijo sami enojčki');
  assert.equal(uganke.srednja.mere.napredne, 0, 'srednja ne potrebuje napredne tehnike');
  const sp = [...uganke.srednja.mere.uporabljene];
  assert.ok(sp.some(ime => [...E.GEN_PARI, ...E.GEN_TROJICE, ...E.GEN_PRESEKI].includes(ime)),
    'srednja mora uporabiti paro, trojico ali presek');
  // težka: natanko ena napredna, skupaj največ štiri tehnike nad enojčki.
  assert.equal(uganke.tezka.mere.napredne, 1, 'težka potrebuje natanko eno napredno tehniko');
  assert.ok(uganke.tezka.mere.tehNad <= 4, 'težka ima največ štiri tehnike nad enojčki');
  // zelo težka: vsaj dve različni napredni (pravila "5 ali več tehnik" ni več) in nobena
  // posamezna napredna skupaj z lažjimi ne zadošča (opredelitev 2026-10-04).
  assert.ok(uganke.zelotezka.mere.napredne >= 2, 'zelo težka: vsaj dve napredni');
  assert.equal(prvaZadostna(uganke.zelotezka.danosti), null, 'zelo težka: ena napredna ne zadošča');
});

// Stopnja po najtežji ravni (razdelek 7.2): število srednjih tehnik stopnje ne
// spremeni. Uganka je naključna minimalna uganka iz semena 100239 (meritev
// 2026-09-24): ena napredna in pet srednjih - prej Zelo težka po pravilu "5 ali več".
test('ena napredna in pet srednjih tehnik je Težka, ne Zelo težka', () => {
  const danosti = '060070000000000805030600000000901020200500900700000004003200506000014000000005001';
  assert.equal(E.countSolutions(danosti), 1, 'natanko ena rešitev');
  const m = E.genRazvrsti(danosti);
  assert.equal(m.napredne, 1);
  assert.ok(m.tehNad >= 5, `vsaj pet tehnik nad enojčki (dobljenih ${m.tehNad})`);
  assert.deepEqual(stopnjeZa(danosti), ['tezka']);
  assert.equal(E.oceniUganko(danosti).tezavnost, 'Težka');
  // Generator take uganke kot Težke ne ponudi (največ štiri tehnike nad enojčki).
  assert.equal(E.oceniStopnjo('tezka', danosti).ustreza, false);
});

// Šteje se MNOŽICA različnih tehnik (7.1): tehnika, uporabljena večkrat, šteje enkrat.
test('mere štejejo različne tehnike, ne uporab', () => {
  let vecUporab = 0;
  const vzorec = [...loadPuzzles(), ...Object.entries(uganke).map(([ime, u]) => ({ ime, danosti: u.danosti }))];
  for (const { ime, danosti } of vzorec) {
    const m = E.genRazvrsti(danosti);
    if (!m) continue;
    // Ista pot kot pri oceni (potOcene zgoraj), le da šteje uporabe.
    const uporab = potOcene(danosti);
    const nad = Object.keys(uporab).filter(t => !E.GEN_LAHKE.includes(t));
    assert.equal(m.tehNad, nad.length, `${ime}: različnih tehnik nad enojčki`);
    assert.equal(m.srednje, nad.filter(t => E.GEN_SREDNJE.includes(t)).length, `${ime}: srednjih`);
    assert.equal(m.napredne, nad.filter(t => E.GEN_NAPREDNE.includes(t)).length, `${ime}: naprednih`);
    if (nad.some(t => uporab[t] > 1)) vecUporab++;
  }
  assert.ok(vecUporab >= 1, 'vsaj ena uganka uporabi kako tehniko nad enojčki večkrat');
});

// Motor v stalnem vrstnem redu (7.1): ocena uporabi pot genPot() z vsemi tehnikami (brez
// sidranja na števko, ki ga ima solve()), pri dveh ali več naprednih pa pot z eno samo, če
// zadošča (opredelitev 2026-10-04).
test('ocena izhaja iz poti motorja v stalnem vrstnem redu ali poti z eno napredno tehniko', () => {
  for (const { ime, danosti } of [...loadPuzzles(), ...Object.entries(uganke).map(([ime, u]) => ({ ime, danosti: u.danosti }))]) {
    const pot = potOcene(danosti);
    const o = E.oceniTezavnost(danosti);
    if (!pot) { assert.equal(o.tezavnost, 'Presega tehnike', ime); continue; }
    assert.deepEqual([...o.mere.uporabljene].sort(), Object.keys(pot).sort(), ime);
  }
});

/* ---------- zelo težka = ena napredna ne zadošča (odločitev 2026-10-04) ---------- */

// Vzorec: naključne minimalne uganke iz semen 1-200 in uganke generatorja za težko in zelo
// težko (seme 7, semena 18 in 59). Vsaka je preverjena s countSolutions().
const VZOREC_OCENE = (() => {
  const out = [];
  for (let seme = 1; seme <= 200; seme++) out.push({ ime: `minimalna ${seme}`, danosti: E.genMinimalnaUganka(seme) });
  out.push({ ime: 'generator težka 7', danosti: uganke.tezka.danosti });
  for (const seme of [18, 59]) out.push({ ime: `generator zelo težka ${seme}`, danosti: E.ustvariUganko('zelotezka', seme).danosti });
  return out.map(u => ({ ...u, o: E.oceniTezavnost(u.danosti) }));
})();

test('»Zelo težka«: nobena posamezna napredna tehnika skupaj z lažjimi uganke ne reši', () => {
  const zelo = VZOREC_OCENE.filter(u => u.o.tezavnost === 'Zelo težka');
  assert.ok(zelo.length >= 3, `v vzorcu je ${zelo.length} zelo težkih`);
  for (const u of zelo) {
    assert.equal(E.countSolutions(u.danosti), 1, u.ime);
    for (const t of E.GEN_NAPREDNE) {
      assert.equal(potZUporabami(u.danosti, [...E.GEN_LAHKE, ...E.GEN_SREDNJE, t]), null, `${u.ime}: ${t} sama zadošča`);
    }
  }
  // Sprememba ni prazna: v vzorcu so težke uganke, ki jih pot v stalnem vrstnem redu reši z dvema
  // naprednima (prej Zelo težka).
  const prej = VZOREC_OCENE.filter(u => u.o.tezavnost === 'Težka' && naprednihV(potZUporabami(u.danosti, VSE_TEHNIKE)).length >= 2);
  assert.ok(prej.length >= 3, `prej zelo težkih, zdaj težkih: ${prej.length}`);
});

// Številke naprednih tehnik (7-12) v oznaki »tehnike: …«.
// Številke tehnik v »Tehnike: E1, E2, 1 Izločitev izven bloka in 10 W-krilo« (E1/E2 niso številke).
const stevilkeVOznaki = oznaka => [...oznaka.matchAll(/(?:: |, | in )(\d+) /g)].map(m => Number(m[1]));
const napredneVOznaki = oznaka => stevilkeVOznaki(oznaka).filter(n => n >= 7 && n <= 12);
const oznakaTehnik = z => E.zbirkaBesediloTehnik(E.zbirkaTehnikeZapisa(z));
const stevilka = ime => E.TRENING_TEHNIKE.findIndex(([, t]) => t === ime) + 1;

test('»Težka«: v oznaki »tehnike:« je natanko ena napredna – z najnižjo številko, ki zadošča', () => {
  const tezke = VZOREC_OCENE.filter(u => u.o.tezavnost === 'Težka');
  assert.ok(tezke.length >= 10, `v vzorcu je ${tezke.length} težkih`);
  let dnevnikDve = 0;
  for (const u of tezke) {
    const { log } = E.solve(u.danosti);
    const tehnike = [...new Set(log.map(k => k.technique))].map(t => [t, 1]);
    if (tehnike.filter(([t]) => E.GEN_NAPREDNE.includes(t)).length >= 2) dnevnikDve++;
    const pricakovana = stevilka(prvaZadostna(u.danosti));
    // Z zapisano potjo ocene (nov zapis) in brez nje (starejši zapis - izračun sproti).
    for (const z of [{ danosti: u.danosti, tezavnost: 'Težka', tehnike, potOcene: E.zbirkaPotIzOcene(u.o) },
      { danosti: u.danosti, tezavnost: 'Težka', tehnike }]) {
      const oznaka = oznakaTehnik(z);
      assert.deepEqual(napredneVOznaki(oznaka), [pricakovana], `${u.ime}: ${oznaka}`);
    }
  }
  // Brez poti ocene bi pri teh pisalo »Težka · tehnike: …« z dvema naprednima.
  assert.ok(dnevnikDve >= 1, `težkih z dvema naprednima v dnevniku solve(): ${dnevnikDve}`);
});

// Uganka iz ročnega pregleda faze 6 (ustvaril jo je generator v igri; ena rešitev - preveri
// test): prej »Zelo težka«, ker je pot v stalnem vrstnem redu vzela 9 in 10, reševalec pa
// uporabi samo 12. Zadošča že 10 (W-krilo) - prva po vrstnem redu, ki zadošča.
test('uganka iz ročnega pregleda: Težka, »tehnike: 1, 2, 10«', () => {
  const danosti = ('51......8.....86..89.7.5...' + '.....7.4...39..17.....4..2.' + '.5..1....6..4.9...9...8....').replace(/\./g, '0');
  assert.equal(E.countSolutions(danosti), 1);
  assert.deepEqual(naprednihV(potZUporabami(danosti, VSE_TEHNIKE)), ['Turbot Fish', 'W-Wing'], 'pot v stalnem vrstnem redu');
  const { log } = E.solve(danosti);
  assert.deepEqual([...new Set(log.map(k => k.technique))].filter(t => E.GEN_NAPREDNE.includes(t)), ['Unique Rectangle'], 'dnevnik solve()');
  const o = E.oceniTezavnost(danosti);
  assert.equal(o.tezavnost, 'Težka');
  const oznaka = oznakaTehnik({ danosti, tezavnost: o.tezavnost, tehnike: [], potOcene: E.zbirkaPotIzOcene(o) });
  assert.deepEqual(stevilkeVOznaki(oznaka), [1, 2, 10], oznaka);
});

// Ekspertne tehnike še ni, zato je Ekstrem preverjen na merah: ekspertna tehnika da
// Ekstrem ne glede na druge tehnike.
test('ekspertna tehnika: Ekstrem', () => {
  const ustreza = (m) => [...E.STOPNJE_UGANK].filter(s => s.ustreza(m)).map(s => s.kljuc);
  assert.deepEqual(ustreza({ srednje: 0, napredne: 0, ekspertne: 1, tehNad: 1 }), ['ekstrem']);
  assert.deepEqual(ustreza({ srednje: 3, napredne: 2, ekspertne: 1, tehNad: 6 }), ['ekstrem']);
  assert.deepEqual(ustreza({ srednje: 3, napredne: 2, ekspertne: 0, tehNad: 5 }), ['zelotezka']);
});

// Pogoji generatorja (docs/uskladitev.md 7.4, docs/tehnike.md): generator sme ponuditi
// samo uganko, ki nad enojčki zahteva vsaj dve različni srednji tehniki - lahka je
// izjema, ker tehnik nad enojčki nima -, težko pa z največ štirimi tehnikami nad enojčki.
test('vsaka ustvarjena uganka ustreza pogojem generatorja', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const m = E.genRazvrsti(u.danosti);
    assert.ok(E.stopnjaUganke(kljuc).ustrezaIskanju(m), `${kljuc}: ustreza merilu iskanja`);
    if (kljuc === 'lahka') {
      assert.equal(m.tehNad, 0, 'lahka nima tehnik nad enojčki');
      continue;
    }
    assert.ok(m.srednje >= 2, `${kljuc}: vsaj dve srednji tehniki (dobljenih ${m.srednje})`);
    if (kljuc === 'tezka') assert.ok(m.tehNad <= 4, 'težka: največ štiri tehnike nad enojčki');
    const najmanjNaprednih = { srednja: 0, tezka: 1, zelotezka: 2 }[kljuc];
    if (kljuc === 'zelotezka') assert.ok(m.napredne >= 2, 'zelo težka: vsaj dve napredni');
    else assert.equal(m.napredne, najmanjNaprednih, `${kljuc}: ${najmanjNaprednih} naprednih`);
  }
});

// Merilo iskanja mora biti podmnožica stopnje, sicer bi ustvarjena uganka pri "Oceni
// zbirko" (oceniUganko, ki uporablja ustreza) dobila drugo težavnost, kot jo ima v
// zbirki. Preverjeno na vseh kombinacijah mer; hkrati stopnje vsako kombinacijo
// pokrijejo natanko enkrat.
test('merilo iskanja je ožje od stopnje, stopnje se izključujejo in pokrijejo vse', () => {
  let preverjenih = 0;
  for (let srednje = 0; srednje <= 6; srednje++) {
    for (let napredne = 0; napredne <= 6; napredne++) {
      for (let ekspertne = 0; ekspertne <= 2; ekspertne++) {
        const m = { srednje, napredne, ekspertne, tehNad: srednje + napredne + ekspertne };
        preverjenih++;
        const stopnje = [...E.STOPNJE_UGANK].filter(s => s.ustreza(m)).map(s => s.kljuc);
        assert.equal(stopnje.length, 1, `mere ${JSON.stringify(m)}: stopnje [${stopnje}]`);
        for (const s of E.STOPNJE_GENERATORJA) {
          if (s.ustrezaIskanju(m)) {
            assert.ok(s.ustreza(m),
              `${s.kljuc}: mere ${JSON.stringify(m)} ustrezajo iskanju, stopnji pa ne`);
          }
        }
      }
    }
  }
  assert.ok(preverjenih > 20, 'preverjenih mora biti več kombinacij mer');
});

test('stopnje se izključujejo: uganka ustreza samo svoji', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    for (const s of E.STOPNJE_GENERATORJA) {
      const o = E.oceniStopnjo(s.kljuc, u.danosti);
      assert.equal(!!o.ustreza, s.kljuc === kljuc,
        `uganka stopnje ${kljuc} pri oceni za ${s.kljuc}`);
    }
  }
});

// Stopnje so tudi popolne: vsaka uganka, ki jo genRazvrsti() razvrsti, pade v natanko
// eno stopnjo. Preverjeno na ugankah iz docs/uganke.md (tiste, pri katerih motor
// obtiči, ostanejo nerazvrščene - "Presega tehnike").
test('stopnje pokrijejo vsako razvrščeno uganko iz docs/uganke.md', () => {
  let razvrscenih = 0;
  for (const { ime, danosti } of loadPuzzles()) {
    const s = stopnjeZa(danosti);
    if (s === null) continue; // brez ugibanja ni rešljiva
    razvrscenih++;
    assert.equal(s.length, 1, `${ime}: natanko ena stopnja, dobil [${s.join(', ')}]`);
  }
  assert.ok(razvrscenih >= 4, 'vsaj štiri uganke iz docs/uganke.md morajo biti razvrščene');
});

// oceniUganko(): razvrstitev že znane uganke brez ciljne stopnje (gumb "Oceni zbirko").
test('oceniUganko(): težavnost je ime stopnje, ki uganki ustreza', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    const o = E.oceniUganko(u.danosti);
    assert.equal(o.stopnja.kljuc, kljuc, `${kljuc}: stopnja`);
    assert.equal(o.tezavnost, E.stopnjaUganke(kljuc).ime, `${kljuc}: težavnost = ime stopnje`);
    assert.ok([...E.TEZAVNOSTI].includes(o.tezavnost), `${kljuc}: težavnost je iz TEZAVNOSTI`);
    assert.equal(o.resitve, 1, `${kljuc}: natanko ena rešitev`);
    assert.ok(o.board.isSolved() && o.log.length, `${kljuc}: vrne rezultat solve()`);
  }
});

test('oceniUganko() na ugankah iz docs/uganke.md: stopnja ali Presega tehnike', () => {
  let presega = 0;
  for (const { ime, danosti } of loadPuzzles()) {
    const o = E.oceniUganko(danosti);
    const s = stopnjeZa(danosti);
    if (s === null) {
      // Motor brez ugibanja obtiči -> Presega tehnike. Pri teh ugankah ugiba tudi solve().
      assert.equal(o.stopnja, null, `${ime}: brez stopnje`);
      assert.equal(o.tezavnost, 'Presega tehnike', `${ime}: težavnost`);
      assert.ok(o.log.some(k => k.technique.includes('protislovje')), `${ime}: solve() ugiba`);
      presega++;
      continue;
    }
    assert.equal(o.stopnja.kljuc, s[0], `${ime}: ista stopnja kot po merah`);
    assert.equal(o.tezavnost, o.stopnja.ime, `${ime}: težavnost = ime stopnje`);
  }
  assert.ok(presega >= 1, 'vsaj ena uganka iz docs/uganke.md zahteva ugibanje');
});

// Uganka brez natanko ene rešitve (v zbirko lahko pride z uvozom) ni igrljiva, zato
// ne dobi stopnje. Obe spodaj sta izpeljani iz preverjene lahka-seme-1 in njuno
// število rešitev preveri countSolutions() v testu (CLAUDE.md: nič na pamet).
test('oceniUganko(): uganka brez natanko ene rešitve dobi Več rešitev / Brez rešitve', () => {
  const ena = '876000004000000700000200580034010800210069000000305070000000600040076900008000040';
  assert.equal(E.countSolutions(ena), 1, 'izhodiščna uganka je enolična');

  // Brez prve danosti (8 v V1S1) ima uganka več rešitev.
  const vec = '0' + ena.slice(1);
  assert.equal(E.countSolutions(vec), 2, 'brez ene danosti ima več rešitev');
  const o = E.oceniUganko(vec);
  assert.equal(o.resitve, 2);
  assert.equal(o.stopnja, null, 'brez stopnje');
  assert.equal(o.tezavnost, 'Več rešitev');

  // Protislovje v prvi vrstici (drugi 8) - uganka nima rešitve.
  const brez = '8' + '8' + ena.slice(2);
  assert.equal(E.countSolutions(brez), 0, 'uganka s protislovjem nima rešitve');
  const p = E.oceniUganko(brez);
  assert.equal(p.resitve, 0);
  assert.equal(p.stopnja, null);
  assert.equal(p.tezavnost, 'Brez rešitve');
  assert.ok(![...E.TEZAVNOSTI].includes('Drugo'), 'oznake "Drugo" ni več');
});

// Enoličnosti, ki je countSolutions() ne more preveriti (varovalo), ne pripišemo ne
// stopnje ne oznake: težavnost je prazna ("težavnost ni določena"). Varovala z
// uganko ni mogoče zanesljivo sprožiti, zato ga nadomestimo v ločenem kontekstu.
test('oceniTezavnost(): nepreverjena enoličnost da prazno težavnost', () => {
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/generator.js']);
  run(`countSolutions = () => 'unknown';`);
  const o = run(`oceniTezavnost('876000004000000700000200580034010800210069000000305070000000600040076900008000040')`);
  assert.equal(o.resitve, 'unknown');
  assert.equal(o.stopnja, null);
  assert.equal(o.tezavnost, '');
});

test('oceniUganko(): uganka, ki jo motor reši le z ugibanjem, dobi Presega tehnike', () => {
  // Do 2026-10-05 vgrajeni "Primer 1 (z ugibanjem)" (uganka example-app iz docs/uganke.md).
  const danosti = '000800020900000600000000000604000900000720003500000000000056000080009000070000010';
  assert.equal(E.genPot(danosti, VSE_TEHNIKE), null, 'motor v stalnem vrstnem redu obtiči');
  const o = E.oceniUganko(danosti);
  assert.equal(o.stopnja, null);
  assert.equal(o.tezavnost, 'Presega tehnike');
  assert.equal(o.resitve, 1);
});

test('isto seme da vedno isto uganko', () => {
  for (const [kljuc, u] of Object.entries(uganke)) {
    assert.equal(E.ustvariUganko(kljuc, SEMENA[kljuc]).danosti, u.danosti, kljuc);
    assert.equal(u.seme, SEMENA[kljuc]);
    assert.equal(u.stopnja, kljuc);
  }
});

test('seme 1 da uganko lahka-seme-1 iz docs/uganke.md', () => {
  assert.equal(E.ustvariUganko('lahka', 1).danosti,
    '876000004000000700000200580034010800210069000000305070000000600040076900008000040');
});

// Uganka lahka-seme-197 iz docs/uganke.md je po merilu štirih stopenj (2026-09-20)
// srednja, ne lahka: potrebuje Pointing pair/triple. Iz semena 197 se ne reproducira
// več - merilo lahke je zdaj "samo enojčki", zato na poti odstranjevanja zmaga drug
// kandidat. Uganka v docs/uganke.md ostaja (testne uganke se ne spreminjajo).
test('lahka-seme-197 iz docs/uganke.md je po novem merilu srednja', () => {
  const danosti = '073004002049060800105800000000000026000090370387002000492070600000009050500206907';
  assert.deepEqual(stopnjeZa(danosti), ['srednja']);
  const m = E.genRazvrsti(danosti);
  assert.ok(m.uporabljene.has('Pointing pair/triple'), 'potrebuje presek');
  assert.equal(m.napredne, 0, 'brez napredne tehnike');
});

// Od preureditve tehnik 2026-09-24 (preseki pred očitno paro) je prvo seme, ki da
// uganko po strogem merilu, 1185 (prej 97 - ta pot zdaj namesto para uporabi presek).
test('seme 1185 (strogoSrednja) da uganko, ki ustreza srednji stopnji', () => {
  const u = E.ustvariUganko('srednja', 1185, { strogoSrednja: true });
  assert.equal(u.danosti,
    '709003000050000600002007509007040000000000010004280000095070003030000075000000260');
  assert.equal(E.countSolutions(u.danosti), 1);
  assert.deepEqual(stopnjeZa(u.danosti), ['srednja']);
});

// srednja-a je nastala po strogem merilu (par in trojica na poti). Od preureditve
// tehnik 2026-09-24 pridejo preseki pred očitno paro in pot para ne potrebuje več,
// zato strogemu merilu ne ustreza; srednja ostaja po obeh merilih brez strogega.
test('srednja-a iz docs/uganke.md je srednja, strogemu merilu pa ne ustreza več', () => {
  const danosti = '004007025100003000070800000800090034040005009960000572001006000000000000000004761';
  assert.equal(E.oceniUganko(danosti).tezavnost, 'Srednja');
  assert.ok(E.oceniStopnjo('srednja', danosti).ustreza, 'merilo iskanja srednje stopnje');
  assert.ok(!E.oceniStopnjo('srednja', danosti, { strogoSrednja: true }).ustreza, 'strogo merilo');
});

test('strogoSrednja zahteva par in trojico na poti', () => {
  const u = E.ustvariUganko('srednja', 1185, { strogoSrednja: true });
  const pot = [...u.mere.uporabljene];
  assert.ok(pot.some(ime => E.GEN_PARI.includes(ime)), 'par na poti');
  assert.ok(pot.some(ime => E.GEN_TROJICE.includes(ime)), 'trojica na poti');
});

test('neznana stopnja ali stopnja brez generatorja vrže napako', () => {
  assert.throws(() => E.oceniStopnjo('ni-take', '0'.repeat(81)), /Neznana stopnja/);
  assert.throws(() => E.oceniStopnjo('ekstrem', '0'.repeat(81)), /Neznana stopnja/);
});

// Težavnost in tehnike vgrajenih primerov (PRIMERI v shared/zbirka.js) so zapisane v seznamu
// (izbor tools/izberi-primere.js), zato test ob spremembi motorja ali meril stopenj takoj pokaže,
// da so zastarele. Prikazani sta v reševalcu pod seznamom in v igri (primeri se od 2026-09-24 ne
// shranjujejo v zbirko).
const enaki = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
const tehnikeDnevnika = (d) => {
  const t = new Set();
  let poskusov = 0;
  for (const k of E.solve(d).log) {
    if (/protislovje/.test(k.technique)) poskusov++;
    else t.add(k.technique);
  }
  return { t, poskusov };
};

test('PRIMERI: težavnost in tehnike so enake izračunani oceni, reševalec uporabi iste tehnike', () => {
  for (const p of E.PRIMERI) {
    const d = p.danosti.replace(/\./g, '0');
    assert.equal(E.countSolutions(d), 1, p.ime);
    assert.ok(E.TEZAVNOSTI.includes(p.tezavnost), `${p.ime}: ${p.tezavnost}`);
    const o = E.oceniUganko(d);
    assert.equal(o.tezavnost, p.tezavnost, p.ime);
    const { t, poskusov } = tehnikeDnevnika(d);
    assert.equal(p.ugibanje, poskusov, `${p.ime}: ugibanje`);
    const zapisane = new Set(p.tehnike);
    assert.equal(zapisane.size, p.tehnike.length, `${p.ime}: brez ponovitev`);
    if (o.mere) assert.ok(enaki(zapisane, o.mere.uporabljene), `${p.ime}: tehnike = pot ocene`);
    assert.ok(enaki(zapisane, t), `${p.ime}: tehnike = dnevnik solve()`);
    for (const g of p.glavna) assert.ok(zapisane.has(g), `${p.ime}: glavna ${g} je med tehnikami`);
  }
});

test('PRIMERI: vsaka stopnja in vsaka tehnika E1, E2, 1-12 ima vsaj en primer', () => {
  const stopnje = new Set(E.PRIMERI.map(p => p.tezavnost));
  for (const s of E.STOPNJE_GENERATORJA) assert.ok(stopnje.has(s.ime), s.ime);
  assert.ok(stopnje.has('Presega tehnike'));
  for (const t of VSE_TEHNIKE) assert.ok(E.PRIMERI.some(p => p.tehnike.includes(t)), t);
  // Glavna tehnika: lahka primer z obema enojčkoma, vsaka srednja in napredna tehnika glavna pri
  // natanko enem primeru svoje stopnje; zelo težka dve napredni, presega tehnike brez.
  const lahka = E.PRIMERI.filter(p => p.tezavnost === 'Lahka');
  assert.ok(lahka.length === 1 && E.GEN_LAHKE.every(t => lahka[0].tehnike.includes(t)));
  for (const [stopnja, raven] of [['Srednja', E.GEN_SREDNJE], ['Težka', E.GEN_NAPREDNE]]) {
    const pr = E.PRIMERI.filter(p => p.tezavnost === stopnja);
    assert.deepEqual([...pr.map(p => p.glavna.length)], [...raven].map(() => 1), stopnja);
    assert.deepEqual([...pr.map(p => p.glavna[0])], [...raven], `${stopnja}: po vrstnem redu tehnik`);
  }
  const zelo = E.PRIMERI.filter(p => p.tezavnost === 'Zelo težka');
  assert.ok(zelo.length === 1 && zelo[0].glavna.length === 2 && zelo[0].glavna.every(t => E.GEN_NAPREDNE.includes(t)));
  assert.deepEqual([...E.PRIMERI.map(p => p.tezavnost)],
    ['Lahka', ...E.GEN_SREDNJE.map(() => 'Srednja'), ...E.GEN_NAPREDNE.map(() => 'Težka'), 'Zelo težka', 'Presega tehnike']);
});

test('PRIMERI: srednji in težki primeri držijo meje izbora', () => {
  const stej = (p, raven) => p.tehnike.filter(t => raven.includes(t)).length;
  for (const p of E.PRIMERI) {
    const srednje = stej(p, E.GEN_SREDNJE), napredne = stej(p, E.GEN_NAPREDNE);
    if (p.tezavnost === 'Srednja') {
      assert.ok(srednje >= 2 && srednje <= 3 && napredne === 0, `${p.ime}: glavna in še 1-2 srednji`);
      // Pri presekih (1, 2) najlažja srednja uganka: brez parov in trojic razen očitnega para.
      if (E.GEN_PRESEKI.includes(p.glavna[0])) {
        assert.ok(p.tehnike.every(t => !['Hidden pair', 'Naked triple', 'Hidden triple'].includes(t)), p.ime);
      }
    }
    if (p.tezavnost === 'Težka') {
      assert.ok(napredne === 1 && srednje >= E.GEN_NAJMANJ_SREDNJIH && srednje + napredne <= E.GEN_TEZKA_NAJVEC, p.ime);
    }
    if (p.tezavnost === 'Zelo težka') assert.ok(napredne === 2 && srednje >= E.GEN_NAJMANJ_SREDNJIH, p.ime);
  }
});
