/* ==================== GENERATOR UGANK (skupna koda) ====================
   Ustvari uganko izbrane stopnje: iz naključne polne mreže odstranjuje celice,
   dokler ima uganka natanko eno rešitev (countSolutions() === 1), in na tej poti
   obdrži uganko, ki ustreza stopnji. Ugank ne sestavljamo na pamet (CLAUDE.md).
   Tu je tudi ocena že znane uganke (oceniUganko, oceniTezavnost). Brez DOM-a -
   uporabljajo jo igra/generator-worker.js (iskanje v ločeni niti), igra/oceni-worker.js,
   shared/zbirka.js (težavnost ob nastanku zapisa in ob uvozu), trening in
   tools/ustvari-uganko.js (CLI). Naloži se za shared/engine.js (Board, solve,
   countSolutions, applyStep, ALL_TECHNIQUES, PEERS).

   Opredelitve stopenj (odločitev 2026-09-24, docs/uskladitev.md, razdelek 7):
     1. Najprej število rešitev: 0 -> "Brez rešitve", 2 ali več -> "Več rešitev"
        (take uganke ni mogoče igrati, zato stopnje ne dobi).
     2. Nato motor v STALNEM vrstnem redu tehnik (ALL_TECHNIQUES, brez sidranja na
        števko - genPot z vsemi tehnikami): v vsakem koraku najlažja tehnika, ki kaj
        najde. Če se zatakne (moral bi ugibati), dobi uganka "Presega tehnike" -
        poskus s protislovjem ni tehnika in ni raven.
     3. Šteje se MNOŽICA različnih uporabljenih tehnik, ne število uporab.
   Stopnja je raven najtežje uporabljene tehnike (ravni GEN_LAHKE ... GEN_EKSPERTNE):
     lahka      - samo enojčki (E1, E2)
     srednja    - najtežja raven so srednje tehnike (1-6)
     težka      - natanko ena različna napredna tehnika (7-12), srednjih koliko koli
     zelo težka - vsaj dve različni napredni tehniki
     ekstrem    - ekspertna tehnika (13, XY-veriga - še ni v motorju, GEN_EKSPERTNE
                  je prazen; generator te stopnje ne ponuja)
   Stopnje se izključujejo in pokrijejo vsako uganko, ki jo motor reši brez ugibanja.
   Na 600 naključnih minimalnih ugankah (meritev 2026-09-24) je delež 53 / 25 / 14 / 8 %
   ugank brez ugibanja, 21,5 % vseh pa presega tehnike.

   Merili sta dve, ker imata dve nalogi:
     ustreza        - STOPNJA: razvrsti vsako uganko (oceniUganko, gumb "Oceni zbirko",
                      ročni vnos, uvoz).
     ustrezaIskanju - OŽJI pogoj GENERATORJA (ustvariUganko): uganka naj bo za svojo
                      stopnjo tipična - vsaj dve različni srednji tehniki
                      (GEN_NAJMANJ_SREDNJIH), da ne stoji na eni sami tehniki nad
                      enojčki, pri težki pa še največ štiri različne tehnike nad enojčki
                      (GEN_TEZKA_NAJVEC), da ustvarjena Težka ostane jasno pod Zelo težko.
                      Stopnja brez ustrezaIskanju (Ekstrem) se ne ustvarja.
   Vsak ustrezaIskanju je podmnožica svojega ustreza, sicer bi ustvarjena uganka pri
   "Oceni zbirko" dobila drugo težavnost, kot jo ima v zbirki. To preverja
   tests/generator.test.js.

   Iskanje traja v povprečju 0,2 s (lahka), 0,9 s (srednja), 1,2 s (težka) in 2,1 s
   (zelo težka), izjemoma nekaj sekund (docs/tehnike.md).

   Z moznosti.strogoSrednja zahteva srednja stopnja par IN trojico na poti - to je
   merilo za testne uganke v docs/uganke.md (uporablja ga tools/ustvari-uganko.js).
   Iskanje je pri njem precej daljše, zato igra tega ne zahteva. */

// Ravni tehnik - vsaka tehnika iz ALL_TECHNIQUES je v natanko eni (preverja
// tests/generator.test.js, da nova tehnika ne ostane brez ravni).
const GEN_LAHKE = ['Gol enojček', 'Skriti enojček'];                    // E1, E2
const GEN_PRESEKI = ['Pointing pair/triple', 'Box-line reduction'];
const GEN_PARI = ['Naked pair', 'Hidden pair'];
const GEN_TROJICE = ['Naked triple', 'Hidden triple'];
const GEN_SREDNJE = [...GEN_PRESEKI, ...GEN_PARI, ...GEN_TROJICE];     // 1-6
const GEN_NAPREDNE = ['X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle']; // 7-12
const GEN_EKSPERTNE = [];                                               // 13 XY-veriga, ko bo v motorju
// Pogoja generatorja (glej ustrezaIskanju): najmanj različnih srednjih tehnik (vse
// stopnje razen lahke) in največ različnih tehnik nad enojčki pri težki.
const GEN_NAJMANJ_SREDNJIH = 2;
const GEN_TEZKA_NAJVEC = 4;

// Oznake uganke brez stopnje (vrednosti iz TEZAVNOSTI v shared/zbirka.js).
const OCENA_PRESEGA = 'Presega tehnike';
const OCENA_VEC_RESITEV = 'Več rešitev';
const OCENA_BREZ_RESITVE = 'Brez rešitve';

// Stopnje od najlažje k najtežji. `ustreza(mere)` je merilo nad merami iz
// genRazvrsti(). `ime` je hkrati težavnost v zbirki (prvih pet vrednosti v
// TEZAVNOSTI v shared/zbirka.js), da se imeni stopnje in težavnosti ne moreta
// razdvojiti. `najvecjaPrednost` pove, kdaj se iskanje najboljše uganke lahko
// ustavi (glej prednost v oceniStopnjo). Stopnja brez `ustrezaIskanju` se ne ustvarja.
const STOPNJE_UGANK = [
  {
    kljuc: 'lahka', ime: 'Lahka', najvecjaPrednost: 1,
    ustreza: (m) => m.tehNad === 0,
    ustrezaIskanju: (m) => m.tehNad === 0,
    opis: 'reši se samo z enojčki, brez zapisanih kandidatov',
  },
  {
    kljuc: 'srednja', ime: 'Srednja', najvecjaPrednost: 1,
    ustreza: (m) => m.srednje >= 1 && m.napredne === 0 && m.ekspertne === 0,
    ustrezaIskanju: (m) => m.napredne === 0 && m.ekspertne === 0 && m.srednje >= GEN_NAJMANJ_SREDNJIH,
    opis: 'potrebuje vsaj dve različni tehniki: očitno ali skrito paro, trojico ali presek (Pointing pair/triple, Box-line reduction)',
  },
  {
    kljuc: 'tezka', ime: 'Težka', najvecjaPrednost: 1,
    ustreza: (m) => m.napredne === 1 && m.ekspertne === 0,
    ustrezaIskanju: (m) => m.napredne === 1 && m.ekspertne === 0
      && m.srednje >= GEN_NAJMANJ_SREDNJIH && m.tehNad <= GEN_TEZKA_NAJVEC,
    opis: 'potrebuje natanko eno napredno tehniko (X-Wing, Swordfish, Turbot Fish, W-Wing, XY-Wing, Unique Rectangle) in vsaj dve srednji',
  },
  {
    kljuc: 'zelotezka', ime: 'Zelo težka', najvecjaPrednost: 1,
    ustreza: (m) => m.napredne >= 2 && m.ekspertne === 0,
    ustrezaIskanju: (m) => m.napredne >= 2 && m.ekspertne === 0 && m.srednje >= GEN_NAJMANJ_SREDNJIH,
    opis: 'potrebuje vsaj dve različni napredni tehniki in vsaj dve srednji',
  },
  {
    kljuc: 'ekstrem', ime: 'Ekstrem', najvecjaPrednost: 1,
    ustreza: (m) => m.ekspertne >= 1,
    ustrezaIskanju: null,
    opis: 'potrebuje ekspertno tehniko (XY-veriga - še ni v reševalcu)',
  },
];

// Stopnje, ki jih generator ponuja (gumbi v oknu "Nova uganka").
const STOPNJE_GENERATORJA = STOPNJE_UGANK.filter(s => s.ustrezaIskanju);

function stopnjaUganke(kljuc) {
  return STOPNJE_UGANK.find(s => s.kljuc === kljuc) || null;
}

/* ---------- naključnost (ponovljiva) ---------- */

// Deterministični generator (mulberry32): isto seme da vedno isto uganko.
function genPrng(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genPremesaj(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Naključno seme za igro (vsak klik da drugo uganko).
function genNaklucnoSeme() {
  return (Math.random() * 4294967296) >>> 0;
}

// Naključna polna veljavna mreža (sestopanje, števke v naključnem vrstnem redu).
function genPolnaMreza(rnd) {
  const g = new Array(81).fill(0);
  const dovoljena = (c, d) => {
    for (const p of PEERS[c]) if (g[p] === d) return false;
    return true;
  };
  const napolni = (c) => {
    if (c === 81) return true;
    for (const d of genPremesaj([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) {
      if (!dovoljena(c, d)) continue;
      g[c] = d;
      if (napolni(c + 1)) return true;
    }
    g[c] = 0;
    return false;
  };
  napolni(0);
  return g;
}

/* ---------- ocena stopnje ---------- */

// Pot: reševanje samo s tehnikami iz `imena` (po vrstnem redu ALL_TECHNIQUES, brez
// ugibanja). Vrne množico uporabljenih tehnik ali null, če se zatakne.
function genPot(danosti, imena) {
  const tehnike = ALL_TECHNIQUES.filter(([ime]) => imena.includes(ime));
  const b = new Board(danosti);
  const uporabljene = new Set();
  for (let i = 0; i < 500 && !b.isSolved(); i++) {
    let korak = null;
    for (const [ime, fn] of tehnike) {
      const s = fn(b);
      if (s.length) { korak = s[0]; uporabljene.add(ime); break; }
    }
    if (!korak) return null;
    applyStep(b, korak);
    if (!b.isValid()) return null;
  }
  return b.isSolved() ? uporabljene : null;
}

// Je reševalec uganko rešil brez ugibanja? (Rezultat solve().)
function genBrezUgibanja(board, log) {
  return board.isSolved() && !log.some(k => k.technique.includes('protislovje'));
}

// Tehnike v dnevniku solve() z vsemi tehnikami: { ime: število } ali null, če uganke
// ne reši ali pri tem ugiba.
function genTehnikeSolve(danosti) {
  const { board, log } = solve(danosti);
  if (!genBrezUgibanja(board, log)) return null;
  const t = {};
  for (const k of log) t[k.technique] = (t[k.technique] || 0) + 1;
  return t;
}

const genImaKatero = (mnozica, imena) => imena.some(ime => mnozica.has(ime));

// Mere iz MNOŽICE uporabljenih tehnik (vsaka tehnika šteje enkrat, ne glede na to,
// kolikokrat je uporabljena):
//   srednje / napredne / ekspertne - koliko različnih tehnik te ravni je v množici;
//   tehNad - koliko različnih tehnik nad enojčki (vsota vseh treh).
function genMere(uporabljene) {
  const koliko = (raven) => raven.filter(ime => uporabljene.has(ime)).length;
  const srednje = koliko(GEN_SREDNJE);
  const napredne = koliko(GEN_NAPREDNE);
  const ekspertne = koliko(GEN_EKSPERTNE);
  return { uporabljene, srednje, napredne, ekspertne, tehNad: srednje + napredne + ekspertne };
}

// Mere uganke za razvrstitev v stopnjo: motor v stalnem vrstnem redu (genPot z vsemi
// tehnikami, brez sidranja na števko) in mere množice tehnik, ki jih uporabi. Vrne
// null, če se motor zatakne - uganke brez ugibanja ne reši (oznaka "Presega tehnike").
// Motor vzame v vsakem koraku najlažjo tehniko, ki kaj najde, zato je to ista pot kot
// pri reševanju s samo tako težkimi tehnikami, kot jih uganka res potrebuje (prej
// genRazvrsti() po skupinah TECHNIQUE_GROUPS - na 600 ugankah 0 razlik).
function genRazvrsti(danosti) {
  const uporabljene = genPot(danosti, ALL_TECHNIQUES.map(([ime]) => ime));
  return uporabljene ? genMere(uporabljene) : null;
}

// Iste mere iz dnevnika solve() (imena tehnik).
function genMereDnevnika(imena) {
  return genMere(new Set(imena));
}

// Ocena uganke za GENERATOR, zato velja ožje merilo ustrezaIskanju (spodnja meja
// srednjih tehnik, pri težki še zgornja meja vseh); razvrščanje že znane uganke je v
// oceniTezavnost. Vrne { ustreza, mere, tehnike, uporabljene, prednost }. Prednost
// (večja je boljša) pove, ali istemu merilu ustreza tudi dnevnik solve(): ta se zaradi
// sidranja na števko prejšnjega koraka lahko razlikuje od poti - vzame zahtevnejšo
// tehniko za isto številko ali kako s poti izpusti. Dnevnik vidijo reševalec, igra in
// pokritost tehnik v docs/uganke.md (od tod tudi oznaka "tehnike: 1, 3, 7" pri uganki
// v zbirki), zato ima uganka, pri kateri se ujema, prednost pri izbiri - spodnjo mejo
// tehnik tako igralec vidi tudi v dnevniku, ne le na poti.
function oceniStopnjo(kljuc, danosti, moznosti = {}) {
  const s = stopnjaUganke(kljuc);
  if (!s || !s.ustrezaIskanju) throw new Error('Neznana stopnja: ' + kljuc);
  const mere = genRazvrsti(danosti);
  if (!mere || !s.ustrezaIskanju(mere)) return { ustreza: false };
  if (kljuc === 'srednja' && moznosti.strogoSrednja
      && !(genImaKatero(mere.uporabljene, GEN_PARI) && genImaKatero(mere.uporabljene, GEN_TROJICE))) {
    return { ustreza: false };
  }
  const tehnike = genTehnikeSolve(danosti);
  if (!tehnike) return { ustreza: false };
  const prednost = s.ustrezaIskanju(genMereDnevnika(Object.keys(tehnike))) ? 1 : 0;
  return { ustreza: true, mere, tehnike, uporabljene: mere.uporabljene, prednost };
}

// Težavnost že znane uganke (brez ciljne stopnje) po opredelitvi na vrhu datoteke.
// Uporabljajo jo gumb "Oceni zbirko" (prek oceniUganko), ročni vnos in uvoz
// (shared/zbirka.js). Vrne { stopnja, tezavnost, resitve, mere }: `stopnja` je vnos
// iz STOPNJE_UGANK ali null, `resitve` je countSolutions() (1, 0, 2 ali 'unknown'),
// `tezavnost` pa vrednost iz TEZAVNOSTI v shared/zbirka.js:
//   - 0 rešitev -> "Brez rešitve", 2 ali več -> "Več rešitev" (take uganke ni mogoče
//     igrati, stopnja bi bila zavajajoča);
//   - enoličnosti ni bilo mogoče preveriti ('unknown') -> '' (težavnost ni določena;
//     "Oceni zbirko" obstoječe težavnosti ne prepiše);
//   - motor se brez ugibanja zatakne -> "Presega tehnike";
//   - sicer ime stopnje.
function oceniTezavnost(danosti) {
  const resitve = countSolutions(danosti);
  if (resitve !== 1) {
    const tezavnost = resitve === 0 ? OCENA_BREZ_RESITVE : resitve === 'unknown' ? '' : OCENA_VEC_RESITEV;
    return { stopnja: null, tezavnost, resitve, mere: null };
  }
  const mere = genRazvrsti(danosti);
  const stopnja = mere ? (STOPNJE_UGANK.find(s => s.ustreza(mere)) || null) : null;
  return { stopnja, tezavnost: stopnja ? stopnja.ime : OCENA_PRESEGA, resitve, mere };
}

// Razvrstitev že znane uganke za gumb "Oceni zbirko": oceniTezavnost in še rezultat
// solve(), da ga klicatelj lahko uporabi (zbirkaPodatkiResevanja) brez drugega
// reševanja. Vrne { stopnja, tezavnost, resitve, mere, board, log }.
function oceniUganko(danosti) {
  const o = oceniTezavnost(danosti);
  const { board, log } = solve(danosti);
  return { ...o, board, log };
}

/* ---------- ustvarjanje ---------- */

// Odstranjuje celice v naključnem vrstnem redu (celica ostane, če bi bilo brez nje
// več rešitev) in vrne najboljšo ustrezno uganko na poti: najprej po prednosti,
// nato z manj danostmi. Vrne { danosti, stopnja, seme, mere, tehnike, uporabljene,
// prednost } ali null, če to seme ne da uganke te stopnje.
function ustvariUganko(kljuc, seme, moznosti = {}) {
  const rnd = genPrng(seme);
  const g = genPolnaMreza(rnd);
  let najboljsa = null;
  for (const c of genPremesaj([...Array(81).keys()], rnd)) {
    const v = g[c];
    g[c] = 0;
    const danosti = g.join('');
    if (countSolutions(danosti) !== 1) { g[c] = v; continue; }
    const o = oceniStopnjo(kljuc, danosti, moznosti);
    if (o.ustreza && (!najboljsa || o.prednost >= najboljsa.prednost)) {
      najboljsa = { danosti, stopnja: kljuc, seme, ...o };
    }
  }
  return najboljsa;
}

// En poskus z naključnim semenom (igra: iskanje v zanki, dokler ne najde).
function ustvariUgankoNaklucno(kljuc, moznosti = {}) {
  return ustvariUganko(kljuc, genNaklucnoSeme(), moznosti);
}
