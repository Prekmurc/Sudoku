'use strict';
// Ustvari testno uganko izbrane kategorije (stopnje). Logika je v shared/generator.js
// (isti modul uporablja igra za gumb "Ustvari uganko"); tu sta samo razčlenitev
// argumentov in izpis.
//
// Zagon iz korena projekta:
//   node tools/ustvari-uganko.js <lahka|srednja|tezka|zelotezka> [--seme N] [--poskusov M]
//
// Kategorije (stopnje generatorja, ustrezaIskanju v shared/generator.js). Mere so
// iz množice različnih tehnik, ki jih motor v stalnem vrstnem redu uporabi
// (genRazvrsti); srednje = 1-6, napredne = 7-12 (docs/uskladitev.md, razdelek 7):
//   lahka      - reši se samo z enojčki (brez zapisanih kandidatov).
//   srednja    - vsaj dve različni srednji tehniki, naprednih pa ne. To orodje tu
//                zahteva še par IN trojico na poti (moznosti.strogoSrednja), da so
//                testne uganke v docs/uganke.md bogatejše; igra tega ne zahteva,
//                ker je iskanje s tem precej daljše.
//   tezka      - natanko ena napredna tehnika, vsaj dve srednji, skupaj največ
//                štiri tehnike nad enojčki.
//   zelotezka  - vsaj dve različni napredni in vsaj dve srednji tehniki.
// Stopnje Ekstrem (ekspertna tehnika) generator ne ustvarja.
// Pri vseh mora solve() (vse tehnike) uganko rešiti brez ugibanja. Njegov dnevnik
// se lahko od poti razlikuje, ker se solve() "usidra" na številko prejšnjega koraka
// in zanjo vzame tudi zahtevnejšo tehniko pred enojčkom z drugo številko; iz istega
// razloga lahko kako tehniko s poti izpusti. Prednost 1 ima zato uganka, katere
// dnevnik solve() ustreza istemu merilu kot pot - ta dnevnik vidijo reševalec, igra
// in pokritost tehnik v docs/uganke.md.
//
// Seme N da vedno isto uganko (ponovljivo). Brez --seme se preizkusi semena 1, 2, ...
// do --poskusov (privzeto 500) in izpiše najboljša najdena (iskanje se ustavi pri
// prvi, ki izpolni vse prednosti).
const { loadEngine } = require('../tests/load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['applyStep', 'STOPNJE_GENERATORJA', 'stopnjaUganke', 'ustvariUganko', 'oceniStopnjo',
    'genRazvrsti', 'GEN_NAPREDNE'],
});

const args = process.argv.slice(2);
const kategorija = args[0];
const vrednost = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? Number(args[i + 1]) : privzeto;
};
const stopnja = E.stopnjaUganke(kategorija);
if (!stopnja || !stopnja.ustrezaIskanju) {
  console.error(`Uporaba: node tools/ustvari-uganko.js <${E.STOPNJE_GENERATORJA.map(s => s.kljuc).join('|')}> [--seme N] [--poskusov M]`);
  process.exit(2);
}
const MOZNOSTI = { strogoSrednja: true }; // velja samo za kategorijo srednja
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
const { seme, danosti, tehnike, uporabljene, mere, prednost } = izbrana;
console.log(`kategorija: ${kategorija} (${stopnja.ime} - ${stopnja.opis})`);
console.log(`seme:       ${seme}`);
console.log(`danosti:    ${danosti.replace(/0/g, '.')} (${danosti.replace(/0/g, '').length})`);
console.log(`countSolutions(): ${E.countSolutions(danosti)}`);
console.log(`pot:        ${[...uporabljene].join(', ')}`);
console.log(`mere:       tehnik nad enojčki ${mere.tehNad}: srednjih ${mere.srednje}, naprednih ${mere.napredne}, ekspertnih ${mere.ekspertne}`);
console.log(`dnevnik solve() ustreza istemu merilu: ${prednost ? 'da' : 'ne'}`);
console.log(`napredne tehnike v dnevniku solve(): ${E.GEN_NAPREDNE.filter(ime => tehnike[ime]).join(', ') || 'nobena'}`);
console.log(`solve():    ${Object.entries(tehnike).map(([ime, n]) => `${ime} (${n})`).join(', ')}; korakov ${Object.values(tehnike).reduce((a, b) => a + b, 0)}`);
