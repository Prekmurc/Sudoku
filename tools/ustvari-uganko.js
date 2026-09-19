'use strict';
// Ustvari testno uganko izbrane težavnosti: iz naključne polne mreže odstranjuje
// celice, dokler ima uganka natanko eno rešitev (countSolutions() === 1), in na tej
// poti obdrži uganko, ki ustreza kategoriji. Ugank ne sestavljamo na pamet (CLAUDE.md).
//
// Zagon iz korena projekta:
//   node tools/ustvari-uganko.js <lahka|srednja> [--seme N] [--poskusov M]
//
// Kategorije ("pot" = reševanje samo z naštetimi tehnikami, po vrstnem redu
// ALL_TECHNIQUES, brez ugibanja; skupina je "zahtevana", če se pot brez nje zatakne):
//   lahka   - pot z enojčki + Pointing/Box-line uganko reši, pot samo z enojčki ne.
//   srednja - pot z enojčki, Pointing/Box-line, pari in trojicami jo reši in uporabi
//             vsaj en par in vsaj eno trojico; pot brez parov in trojic je ne reši.
//             (Strožji pogoj "brez parov ne IN brez trojic ne" v 2000 semenih ni dal
//             nobene uganke - pari in trojice se med seboj pogosto nadomestijo.)
// Pri obeh mora solve() (vse tehnike) uganko rešiti brez ugibanja. Njegov dnevnik
// lahko vsebuje tudi tehnike zunaj kategorije, ker se solve() "usidra" na številko
// prejšnjega koraka in zanjo vzame tudi zahtevnejšo tehniko pred enojčkom z drugo
// številko; iz istega razloga lahko kako tehniko s poti izpusti. Prednost ima zato
// uganka, katere dnevnik solve() ostane v kategoriji in vsebuje njene tehnike (pri
// lahki Pointing in Box-line, pri srednji par in trojico) - ta dnevnik vidijo
// reševalec, igra in pokritost tehnik v docs/uganke.md.
//
// Seme N da vedno isto uganko (ponovljivo). Brez --seme se preizkusi semena 1, 2, ...
// do --poskusov (privzeto 500) in izpiše najboljša najdena (iskanje se ustavi pri
// prvi, ki izpolni vse prednosti).
const { loadEngine } = require('../tests/load-engine.js');

const E = loadEngine(undefined, { names: ['applyStep'] });

const ENOJCKI = ['Gol enojček', 'Skriti enojček'];
const PRESEK = ['Pointing pair/triple', 'Box-line reduction'];
const PARI = ['Naked pair', 'Hidden pair'];
const TROJICE = ['Naked triple', 'Hidden triple'];

// Deterministični generator (mulberry32).
function prng(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function premesaj(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Naključna polna veljavna mreža (sestopanje, števke v naključnem vrstnem redu).
function polnaMreza(rnd) {
  const g = new Array(81).fill(0);
  const dovoljena = (c, d) => {
    for (const p of E.PEERS[c]) if (g[p] === d) return false;
    return true;
  };
  const napolni = (c) => {
    if (c === 81) return true;
    for (const d of premesaj([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) {
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

// Pot: reševanje samo s tehnikami iz `imena` (po vrstnem redu ALL_TECHNIQUES, brez
// ugibanja). Vrne množico uporabljenih tehnik ali null, če se zatakne.
function pot(danosti, imena) {
  const tehnike = E.ALL_TECHNIQUES.filter(([ime]) => imena.includes(ime));
  const b = new E.Board(danosti);
  const uporabljene = new Set();
  for (let i = 0; i < 500 && !b.isSolved(); i++) {
    let korak = null;
    for (const [ime, fn] of tehnike) {
      const s = fn(b);
      if (s.length) { korak = s[0]; uporabljene.add(ime); break; }
    }
    if (!korak) return null;
    E.applyStep(b, korak);
    if (!b.isValid()) return null;
  }
  return b.isSolved() ? uporabljene : null;
}

// Tehnike v dnevniku solve() z vsemi tehnikami: { ime: število } ali null, če uganke
// ne reši ali pri tem ugiba.
function tehnikeSolve(danosti) {
  const { board, log } = E.solve(danosti);
  if (!board.isSolved() || log.some(k => k.technique.includes('protislovje'))) return null;
  const t = {};
  for (const k of log) t[k.technique] = (t[k.technique] || 0) + 1;
  return t;
}

const samoIz = (t, dovoljene) => Object.keys(t).every(ime => dovoljene.includes(ime));
const imaKatero = (mnozica, imena) => imena.some(ime => mnozica.has(ime));

// Vrne { ustreza, t, uporabljene, prednost } za kategorijo. Prednost (večja je boljša):
// 2 = dnevnik solve() samo iz tehnik kategorije, + pri lahki 1 za vsako od
// Pointing/Box-line v dnevniku solve(), pri srednji 1, če ima dnevnik par in trojico.
const NAJVECJA_PREDNOST = { lahka: 2 + PRESEK.length, srednja: 3 };
function oceni(kategorija, danosti) {
  const osnova = kategorija === 'lahka' ? ENOJCKI : [...ENOJCKI, ...PRESEK];
  const dovoljene = kategorija === 'lahka' ? [...ENOJCKI, ...PRESEK] : [...ENOJCKI, ...PRESEK, ...PARI, ...TROJICE];
  const uporabljene = pot(danosti, dovoljene);
  if (!uporabljene || pot(danosti, osnova)) return { ustreza: false };
  if (kategorija === 'srednja' && !(imaKatero(uporabljene, PARI) && imaKatero(uporabljene, TROJICE))) return { ustreza: false };
  const t = tehnikeSolve(danosti);
  if (!t) return { ustreza: false };
  let prednost = samoIz(t, dovoljene) ? 2 : 0;
  if (kategorija === 'lahka') prednost += PRESEK.filter(ime => t[ime]).length;
  else if (PARI.some(ime => t[ime]) && TROJICE.some(ime => t[ime])) prednost += 1;
  return { ustreza: true, t, uporabljene, prednost };
}

// Odstranjuje celice v naključnem vrstnem redu (celica ostane, če bi bilo brez nje
// več rešitev) in vrne najboljšo ustrezno uganko na poti: najprej po prednosti,
// nato z manj danostmi.
function ustvari(kategorija, seme) {
  const rnd = prng(seme);
  const g = polnaMreza(rnd);
  let najboljsa = null;
  for (const c of premesaj([...Array(81).keys()], rnd)) {
    const v = g[c];
    g[c] = 0;
    const danosti = g.join('');
    if (E.countSolutions(danosti) !== 1) { g[c] = v; continue; }
    const o = oceni(kategorija, danosti);
    if (o.ustreza && (!najboljsa || o.prednost >= najboljsa.prednost)) najboljsa = { danosti, ...o };
  }
  return najboljsa;
}

const args = process.argv.slice(2);
const kategorija = args[0];
const vrednost = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? Number(args[i + 1]) : privzeto;
};
if (kategorija !== 'lahka' && kategorija !== 'srednja') {
  console.error('Uporaba: node tools/ustvari-uganko.js <lahka|srednja> [--seme N] [--poskusov M]');
  process.exit(2);
}
const semena = args.includes('--seme') ? [vrednost('--seme')] : [...Array(vrednost('--poskusov', 500)).keys()].map(i => i + 1);
let izbrana = null;
for (const seme of semena) {
  const u = ustvari(kategorija, seme);
  if (!u) continue;
  if (!izbrana || u.prednost > izbrana.prednost) izbrana = { seme, ...u };
  if (izbrana.prednost === NAJVECJA_PREDNOST[kategorija]) break;
}
if (!izbrana) {
  console.error(`Ni ustrezne uganke (semena ${semena[0]}–${semena[semena.length - 1]}).`);
  process.exit(1);
}
const { seme, danosti, t, uporabljene } = izbrana;
const resitev = E.countSolutions(danosti);
console.log(`kategorija: ${kategorija}`);
console.log(`seme:       ${seme}`);
console.log(`danosti:    ${danosti.replace(/0/g, '.')} (${danosti.replace(/0/g, '').length})`);
console.log(`countSolutions(): ${resitev}`);
console.log(`pot:        ${[...uporabljene].join(', ')} (samo s tehnikami kategorije)`);
console.log(`dnevnik solve() samo iz tehnik kategorije: ${samoIz(t, kategorija === 'lahka' ? [...ENOJCKI, ...PRESEK] : [...ENOJCKI, ...PRESEK, ...PARI, ...TROJICE]) ? 'da' : 'ne'}`);
console.log(`solve():    ${Object.entries(t).map(([ime, n]) => `${ime} (${n})`).join(', ')}; korakov ${Object.values(t).reduce((a, b) => a + b, 0)}`);
