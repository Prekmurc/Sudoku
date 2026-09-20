'use strict';
// Ustvari testno uganko izbrane kategorije (stopnje). Logika je v shared/generator.js
// (isti modul uporablja igra za gumb "Ustvari uganko"); tu sta samo razčlenitev
// argumentov in izpis.
//
// Zagon iz korena projekta:
//   node tools/ustvari-uganko.js <lahka|srednja|tezka> [--seme N] [--poskusov M]
//
// Kategorije (merilo = najzahtevnejša skupina tehnik, ki jo uganka potrebuje; glej
// komentar v shared/generator.js):
//   lahka   - pot z enojčki + Pointing/Box-line uganko reši, pot samo z enojčki ne.
//   srednja - pot z enojčki, Pointing/Box-line, pari in trojicami jo reši in uporabi
//             vsaj en par in vsaj eno trojico; pot brez parov in trojic je ne reši.
//             (Strožji pogoj "brez parov ne IN brez trojic ne" v 2000 semenih ni dal
//             nobene uganke - pari in trojice se med seboj pogosto nadomestijo.)
//             To orodje zahteva par IN trojico (moznosti.strogoSrednja); igra je
//             ohlapnejša (par ALI trojica), ker je tako iskanje sekundno namesto
//             pribl. polminutno.
//   tezka   - pot s pari in trojicami je ne reši, solve() pa jo reši brez ugibanja
//             (potrebuje vsaj eno napredno tehniko).
// Pri vseh mora solve() (vse tehnike) uganko rešiti brez ugibanja. Njegov dnevnik
// lahko vsebuje tudi tehnike zunaj kategorije, ker se solve() "usidra" na številko
// prejšnjega koraka in zanjo vzame tudi zahtevnejšo tehniko pred enojčkom z drugo
// številko; iz istega razloga lahko kako tehniko s poti izpusti. Prednost ima zato
// uganka, katere dnevnik solve() ostane v kategoriji in vsebuje njene tehnike (pri
// lahki Pointing in Box-line, pri srednji par in trojico, pri težki napredno
// tehniko) - ta dnevnik vidijo reševalec, igra in pokritost tehnik v docs/uganke.md.
//
// Seme N da vedno isto uganko (ponovljivo). Brez --seme se preizkusi semena 1, 2, ...
// do --poskusov (privzeto 500) in izpiše najboljša najdena (iskanje se ustavi pri
// prvi, ki izpolni vse prednosti).
const { loadEngine } = require('../tests/load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['applyStep', 'STOPNJE_UGANK', 'stopnjaUganke', 'ustvariUganko', 'oceniStopnjo',
    'genSamoIz', 'GEN_NAPREDNE'],
});

const args = process.argv.slice(2);
const kategorija = args[0];
const vrednost = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? Number(args[i + 1]) : privzeto;
};
const stopnja = E.stopnjaUganke(kategorija);
if (!stopnja) {
  console.error(`Uporaba: node tools/ustvari-uganko.js <${E.STOPNJE_UGANK.map(s => s.kljuc).join('|')}> [--seme N] [--poskusov M]`);
  process.exit(2);
}
const MOZNOSTI = { strogoSrednja: true };
const semena = args.includes('--seme') ? [vrednost('--seme')] : [...Array(vrednost('--poskusov', 500)).keys()].map(i => i + 1);
let izbrana = null;
for (const seme of semena) {
  const u = E.ustvariUganko(kategorija, seme, MOZNOSTI);
  if (!u) continue;
  if (!izbrana || u.prednost > izbrana.prednost) izbrana = u;
  if (izbrana.prednost === stopnja.najvecjaPrednost) break;
}
if (!izbrana) {
  console.error(`Ni ustrezne uganke (semena ${semena[0]}–${semena[semena.length - 1]}).`);
  process.exit(1);
}
const { seme, danosti, tehnike, uporabljene } = izbrana;
console.log(`kategorija: ${kategorija}`);
console.log(`seme:       ${seme}`);
console.log(`danosti:    ${danosti.replace(/0/g, '.')} (${danosti.replace(/0/g, '').length})`);
console.log(`countSolutions(): ${E.countSolutions(danosti)}`);
if (uporabljene) console.log(`pot:        ${[...uporabljene].join(', ')} (samo s tehnikami kategorije)`);
else console.log(`pot:        pot s pari in trojicami je ne reši (potrebuje napredno tehniko)`);
if (stopnja.dovoljene) {
  console.log(`dnevnik solve() samo iz tehnik kategorije: ${E.genSamoIz(tehnike, stopnja.dovoljene) ? 'da' : 'ne'}`);
} else {
  console.log(`napredne tehnike v dnevniku solve(): ${E.GEN_NAPREDNE.filter(ime => tehnike[ime]).join(', ') || 'nobena'}`);
}
console.log(`solve():    ${Object.entries(tehnike).map(([ime, n]) => `${ime} (${n})`).join(', ')}; korakov ${Object.values(tehnike).reduce((a, b) => a + b, 0)}`);
