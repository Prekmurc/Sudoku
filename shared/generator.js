/* ==================== GENERATOR UGANK (skupna koda) ====================
   Ustvari uganko izbrane stopnje: iz naključne polne mreže odstranjuje celice,
   dokler ima uganka natanko eno rešitev (countSolutions() === 1), in na tej poti
   obdrži uganko, ki ustreza stopnji. Ugank ne sestavljamo na pamet (CLAUDE.md).
   Brez DOM-a - uporabljata jo igra/generator-worker.js (iskanje v ločeni niti) in
   tools/ustvari-uganko.js (CLI). Naloži se za shared/engine.js (Board, solve,
   countSolutions, applyStep, ALL_TECHNIQUES, PEERS).

   Stopnjo določa najzahtevnejša skupina tehnik, ki jo uganka POTREBUJE. "Pot" =
   reševanje samo z naštetimi tehnikami, po vrstnem redu ALL_TECHNIQUES, brez
   ugibanja; skupina je zahtevana, če se pot brez nje zatakne:
     lahka   - pot z enojčki + preseki jo reši, pot samo z enojčki ne.
     srednja - pot s pari in trojicami jo reši, pot z enojčki + preseki ne.
     težka   - pot s pari in trojicami je ne reši, solve() (vse tehnike) jo reši,
               torej potrebuje vsaj eno napredno tehniko.
   Pri vseh mora solve() uganko rešiti brez poskusa s protislovjem (kar reši, to
   vidi tudi "Naslednji korak" v igri).

   Z moznosti.strogoSrednja zahteva srednja stopnja par IN trojico na poti - to je
   merilo za testne uganke v docs/uganke.md (uporablja ga tools/ustvari-uganko.js).
   Iskanje je pri njem precej daljše (pribl. 1 uganka na 200 semen), zato igra tega
   ne zahteva: tam je dovolj par ALI trojica. */

const GEN_ENOJCKI = ['Gol enojček', 'Skriti enojček'];
const GEN_PRESEKI = ['Pointing pair/triple', 'Box-line reduction'];
const GEN_PARI = ['Naked pair', 'Hidden pair'];
const GEN_TROJICE = ['Naked triple', 'Hidden triple'];
const GEN_OSNOVNE = [...GEN_ENOJCKI, ...GEN_PRESEKI];
const GEN_SREDNJE = [...GEN_OSNOVNE, ...GEN_PARI, ...GEN_TROJICE];
// Napredne = vse preostale tehnike reševalca (X-Wing ... Unique Rectangle).
const GEN_NAPREDNE = ALL_TECHNIQUES.map(([ime]) => ime).filter(ime => !GEN_SREDNJE.includes(ime));

// Stopnje od najlažje k najtežji. `osnova` = tehnike, ki uganke še ne smejo rešiti,
// `dovoljene` = tehnike, s katerimi mora biti rešljiva (null = vse, prek solve()).
// `tezavnost` je vrednost iz TEZAVNOSTI v shared/zbirka.js (zapis v zbirki).
const STOPNJE_UGANK = [
  {
    kljuc: 'lahka', ime: 'Lahka', tezavnost: 'Preprosto',
    osnova: GEN_ENOJCKI, dovoljene: GEN_OSNOVNE, najvecjaPrednost: 2 + GEN_PRESEKI.length,
    opis: 'poleg enojčkov potrebuje Pointing pair/triple ali Box-line reduction',
  },
  {
    kljuc: 'srednja', ime: 'Srednja', tezavnost: 'Srednje',
    osnova: GEN_OSNOVNE, dovoljene: GEN_SREDNJE, najvecjaPrednost: 3,
    opis: 'potrebuje očitno ali skrito paro oziroma trojico',
  },
  {
    kljuc: 'tezka', ime: 'Težka', tezavnost: 'Težko',
    osnova: GEN_SREDNJE, dovoljene: null, najvecjaPrednost: 1,
    opis: 'potrebuje napredno tehniko (X-Wing, Turbot Fish, Swordfish, W-Wing, XY-Wing, Unique Rectangle)',
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

// Tehnike v dnevniku solve() z vsemi tehnikami: { ime: število } ali null, če uganke
// ne reši ali pri tem ugiba.
function genTehnikeSolve(danosti) {
  const { board, log } = solve(danosti);
  if (!board.isSolved() || log.some(k => k.technique.includes('protislovje'))) return null;
  const t = {};
  for (const k of log) t[k.technique] = (t[k.technique] || 0) + 1;
  return t;
}

const genSamoIz = (t, dovoljene) => Object.keys(t).every(ime => dovoljene.includes(ime));
const genImaKatero = (mnozica, imena) => imena.some(ime => mnozica.has(ime));

// Vrne { ustreza, tehnike, uporabljene, prednost } za stopnjo. Prednost (večja je
// boljša) pove, kako dobro uganko vidi tudi solve(): njegov dnevnik se zaradi
// sidranja na števko prejšnjega koraka lahko razlikuje od poti - vzame zahtevnejšo
// tehniko za isto števko ali kako s poti izpusti. Pri lahki in srednji 2 za dnevnik
// samo iz tehnik stopnje, +1 za vsako značilno tehniko stopnje v njem; pri težki 1,
// če je v dnevniku napredna tehnika.
function oceniStopnjo(kljuc, danosti, moznosti = {}) {
  const s = stopnjaUganke(kljuc);
  if (!s) throw new Error('Neznana stopnja: ' + kljuc);
  const uporabljene = s.dovoljene ? genPot(danosti, s.dovoljene) : null;
  if (s.dovoljene && !uporabljene) return { ustreza: false };
  if (genPot(danosti, s.osnova)) return { ustreza: false };
  if (kljuc === 'srednja' && moznosti.strogoSrednja
      && !(genImaKatero(uporabljene, GEN_PARI) && genImaKatero(uporabljene, GEN_TROJICE))) {
    return { ustreza: false };
  }
  const tehnike = genTehnikeSolve(danosti);
  if (!tehnike) return { ustreza: false };
  let prednost = 0;
  if (kljuc === 'tezka') {
    prednost = GEN_NAPREDNE.some(ime => tehnike[ime]) ? 1 : 0;
  } else {
    prednost = genSamoIz(tehnike, s.dovoljene) ? 2 : 0;
    if (kljuc === 'lahka') prednost += GEN_PRESEKI.filter(ime => tehnike[ime]).length;
    else if (GEN_PARI.some(ime => tehnike[ime]) && GEN_TROJICE.some(ime => tehnike[ime])) prednost += 1;
  }
  return { ustreza: true, tehnike, uporabljene, prednost };
}

/* ---------- ustvarjanje ---------- */

// Odstranjuje celice v naključnem vrstnem redu (celica ostane, če bi bilo brez nje
// več rešitev) in vrne najboljšo ustrezno uganko na poti: najprej po prednosti,
// nato z manj danostmi. Vrne { danosti, stopnja, seme, tehnike, uporabljene,
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
