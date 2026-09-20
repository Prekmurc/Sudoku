/* ==================== GENERATOR UGANK (skupna koda) ====================
   Ustvari uganko izbrane stopnje: iz naključne polne mreže odstranjuje celice,
   dokler ima uganka natanko eno rešitev (countSolutions() === 1), in na tej poti
   obdrži uganko, ki ustreza stopnji. Ugank ne sestavljamo na pamet (CLAUDE.md).
   Brez DOM-a - uporabljata jo igra/generator-worker.js (iskanje v ločeni niti) in
   tools/ustvari-uganko.js (CLI). Naloži se za shared/engine.js (Board, solve,
   countSolutions, applyStep, ALL_TECHNIQUES, TECHNIQUE_GROUPS, techniqueGroup, PEERS).

   Stopnjo določata DVE meri (genRazvrsti): najlažja skupina tehnik, ki uganko še
   reši, IN število različnih tehnik nad enojčki, ki jih ta pot uporabi. Obe sta
   potrebni - meritev 2026-09-20 na 600 naključnih ugankah (docs/uganke.md, razdelek
   "Porazdelitev naključnih ugank") je pokazala, da skupina števila tehnik ne določa:
   četrtina ugank z napredno tehniko uporabi le eno ali dve tehniki nad enojčki.
     lahka      - reši se samo z enojčki (brez zapisanih kandidatov)      53,5 %
     srednja    - potrebuje očitno/skrito paro, trojico ali presek        22,8 %
     težka      - potrebuje natanko eno napredno tehniko, skupaj <= 4     14,0 %
     zelo težka - >= 2 različni napredni ali >= 5 tehnik nad enojčki       9,7 %
   Stopnje se izključujejo in pokrijejo vse uganke, ki jih solve() reši brez
   poskusa s protislovjem (teh je pribl. 79 % naključnih ugank). Iskanje v igri traja
   v povprečju 0,2 s (lahka) do 1 s (zelo težka), izjemoma nekaj sekund.

   Z moznosti.strogoSrednja zahteva srednja stopnja par IN trojico na poti - to je
   merilo za testne uganke v docs/uganke.md (uporablja ga tools/ustvari-uganko.js).
   Iskanje je pri njem precej daljše (pribl. 1 uganka na 200 semen), zato igra tega
   ne zahteva. */

const GEN_ENOJCKI = ['Gol enojček', 'Skriti enojček'];
const GEN_PRESEKI = ['Pointing pair/triple', 'Box-line reduction'];
const GEN_PARI = ['Naked pair', 'Hidden pair'];
const GEN_TROJICE = ['Naked triple', 'Hidden triple'];
const GEN_SREDNJE = [...GEN_ENOJCKI, ...GEN_PRESEKI, ...GEN_PARI, ...GEN_TROJICE];
// Napredne = vse preostale tehnike reševalca (X-Wing ... Unique Rectangle).
const GEN_NAPREDNE = ALL_TECHNIQUES.map(([ime]) => ime).filter(ime => !GEN_SREDNJE.includes(ime));

// Stopnje od najlažje k najtežji. `ustreza(mere)` je merilo nad merami iz
// genRazvrsti(). `ime` je hkrati težavnost v zbirki (prve štiri vrednosti v
// TEZAVNOSTI v shared/zbirka.js), da se imeni stopnje in težavnosti ne moreta
// razdvojiti. `najvecjaPrednost` pove, kdaj se iskanje najboljše uganke lahko
// ustavi (glej prednost v oceniStopnjo).
const STOPNJE_UGANK = [
  {
    kljuc: 'lahka', ime: 'Lahka', najvecjaPrednost: 1,
    ustreza: (m) => m.skupina === 0,
    opis: 'reši se samo z enojčki, brez zapisanih kandidatov',
  },
  {
    kljuc: 'srednja', ime: 'Srednja', najvecjaPrednost: 1,
    ustreza: (m) => m.skupina >= 1 && m.skupina <= 3,
    opis: 'potrebuje očitno ali skrito paro, trojico ali presek (Pointing pair/triple, Box-line reduction)',
  },
  {
    kljuc: 'tezka', ime: 'Težka', najvecjaPrednost: 1,
    ustreza: (m) => m.skupina === 4 && m.napredne === 1 && m.tehNad <= 4,
    opis: 'potrebuje natanko eno napredno tehniko (X-Wing, Turbot Fish, Swordfish, W-Wing, XY-Wing, Unique Rectangle)',
  },
  {
    kljuc: 'zelotezka', ime: 'Zelo težka', najvecjaPrednost: 1,
    ustreza: (m) => m.skupina === 4 && (m.napredne >= 2 || m.tehNad >= 5),
    opis: 'potrebuje dve različni napredni tehniki ali pet različnih tehnik nad enojčki',
  },
];

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

// Mere uganke za razvrstitev v stopnjo:
//   skupina  - indeks najlažje skupine TECHNIQUE_GROUPS, s katero (in z vsemi lažjimi)
//              genPot uganko reši; 0 = samo enojčki, 4 = potrebuje napredno tehniko.
//   tehNad   - koliko RAZLIČNIH tehnik nad enojčki ta pot uporabi.
//   napredne - koliko od njih je naprednih.
// Vrne null, če uganke brez ugibanja ne reši nobena pot. Pribl. 0,2 % ugank, ki jih
// solve() reši, tu odpade: genPot vzame prvi korak prve tehnike, solve() pa korake
// izbira s sidranjem na števko (nextStep), zgodnejši izbris pa lahko uniči kandidate,
// ki jih vzorčna tehnika potrebuje. Taka uganka preprosto ne dobi stopnje.
function genRazvrsti(danosti) {
  let dovoljene = [];
  for (let g = 0; g < TECHNIQUE_GROUPS.length; g++) {
    dovoljene = [...dovoljene, ...TECHNIQUE_GROUPS[g]];
    const uporabljene = genPot(danosti, dovoljene);
    if (!uporabljene) continue;
    const nad = [...uporabljene].filter(ime => !GEN_ENOJCKI.includes(ime));
    return {
      skupina: g, uporabljene,
      tehNad: nad.length,
      napredne: nad.filter(ime => GEN_NAPREDNE.includes(ime)).length,
    };
  }
  return null;
}

// Iste mere iz dnevnika solve() (imena tehnik): skupina je najtežja skupina v njem.
function genMereDnevnika(imena) {
  const nad = imena.filter(ime => !GEN_ENOJCKI.includes(ime));
  return {
    skupina: imena.reduce((n, ime) => Math.max(n, techniqueGroup(ime)), 0),
    tehNad: nad.length,
    napredne: nad.filter(ime => GEN_NAPREDNE.includes(ime)).length,
  };
}

// Vrne { ustreza, mere, tehnike, uporabljene, prednost } za stopnjo. Prednost (večja
// je boljša) pove, ali stopnji ustreza tudi dnevnik solve(): ta se zaradi sidranja na
// števko prejšnjega koraka lahko razlikuje od poti - vzame zahtevnejšo tehniko za isto
// številko ali kako s poti izpusti. Dnevnik vidijo reševalec, igra in pokritost tehnik
// v docs/uganke.md, zato ima uganka, pri kateri se ujema, prednost pri izbiri.
function oceniStopnjo(kljuc, danosti, moznosti = {}) {
  const s = stopnjaUganke(kljuc);
  if (!s) throw new Error('Neznana stopnja: ' + kljuc);
  const mere = genRazvrsti(danosti);
  if (!mere || !s.ustreza(mere)) return { ustreza: false };
  if (kljuc === 'srednja' && moznosti.strogoSrednja
      && !(genImaKatero(mere.uporabljene, GEN_PARI) && genImaKatero(mere.uporabljene, GEN_TROJICE))) {
    return { ustreza: false };
  }
  const tehnike = genTehnikeSolve(danosti);
  if (!tehnike) return { ustreza: false };
  const prednost = s.ustreza(genMereDnevnika(Object.keys(tehnike))) ? 1 : 0;
  return { ustreza: true, mere, tehnike, uporabljene: mere.uporabljene, prednost };
}

// Razvrstitev že znane uganke (gumb "Oceni zbirko" v igri): brez ciljne stopnje.
// Vrne { stopnja, tezavnost, mere, board, log }, kjer je `stopnja` vnos iz
// STOPNJE_UGANK ali null. Uganka, ki je reševalec ne reši brez ugibanja (ali je
// genRazvrsti ne razvrsti), nima stopnje in dobi težavnost "Ekstrem". Težavnost je
// ime stopnje, torej vrednost iz TEZAVNOSTI v shared/zbirka.js. Rezultat solve()
// vrnemo, da ga klicatelj lahko uporabi (zbirkaPodatkiResevanja) brez drugega
// reševanja.
function oceniUganko(danosti) {
  const { board, log } = solve(danosti);
  const mere = genBrezUgibanja(board, log) ? genRazvrsti(danosti) : null;
  const stopnja = mere ? (STOPNJE_UGANK.find(s => s.ustreza(mere)) || null) : null;
  return { stopnja, tezavnost: stopnja ? stopnja.ime : 'Ekstrem', mere, board, log };
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
