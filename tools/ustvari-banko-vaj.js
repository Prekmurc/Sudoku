'use strict';
// Banka vaj za "Vadi v uganki" (docs/trening-v-uganki-nacrt.md, del 3): ustvari
// shared/vaje-banka.js - uganke, v katerih so stanja redkih tehnik, ki jih trening
// sproti (meja 1 s) pogosto ne najde.
//
// Zagon iz korena projekta:
//   node tools/ustvari-banko-vaj.js [--na-tehniko 50] [--najvec-semen 50000]
//
// Postopek:
//   1. za semena 1, 2, ... uganka genMinimalnaUganka(seme) in tehnikeVUganki(danosti)
//      (shared/vaje-uganka.js - tehnike, za katere ima uganka stanje vaje, in stopnja);
//   2. uganka ostane, če ima tehniko, ki še nima --na-tehniko ugank; konec, ko jih
//      imajo vse tehnike iz ALL_TECHNIQUES;
//   3. odvečni zapisi: od zadnjega proti prvemu se odstrani zapis, pri katerem imajo
//      vse njegove tehnike več kot --na-tehniko ugank (brez tega bi ostale skoraj vse
//      uganke z začetka, ki jih je bilo treba vzeti zaradi pogostih tehnik);
//   4. zapis v shared/vaje-banka.js, urejeno po semenu (pregledne razlike v gitu).
//
// Banko je treba ustvariti znova ob vsaki spremembi motorja (shared/engine.js) ali
// generatorja (shared/generator.js). Če test tests/vaje-banka.test.js pade, se datoteka
// in test ne popravljata ročno - poženi to orodje.

const { loadEngine } = require('../tests/load-engine.js');
const fs = require('node:fs');
const path = require('node:path');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js'],
  names: ['genMinimalnaUganka', 'tehnikeVUganki'],
});

const args = process.argv.slice(2);
const arg = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? args[i + 1] : privzeto;
};
const NA_TEHNIKO = Number(arg('--na-tehniko', 50));
const NAJVEC_SEMEN = Number(arg('--najvec-semen', 50000));
const IZHOD = path.join(__dirname, '..', 'shared', 'vaje-banka.js');

const TEHNIKE = E.ALL_TECHNIQUES.map(([k]) => k);
const steviloZ = zapisi => {
  const n = Object.fromEntries(TEHNIKE.map(k => [k, 0]));
  for (const z of zapisi) for (const k of z.tehnike) n[k]++;
  return n;
};

// 1.-2. Semena po vrsti.
const t0 = Date.now();
const zapisi = [];
const n = Object.fromEntries(TEHNIKE.map(k => [k, 0]));
let seme = 0;
while (TEHNIKE.some(k => n[k] < NA_TEHNIKO)) {
  if (++seme > NAJVEC_SEMEN) {
    console.error(`Po ${NAJVEC_SEMEN} semenih nimajo vse tehnike ${NA_TEHNIKO} ugank - banka ni zapisana.`);
    console.error(JSON.stringify(n));
    process.exit(1);
  }
  const danosti = E.genMinimalnaUganka(seme);
  const { tehnike, stopnja } = E.tehnikeVUganki(danosti);
  if (tehnike.some(k => n[k] < NA_TEHNIKO)) {
    zapisi.push({ seme, danosti, stopnja, tehnike: [...tehnike] });
    for (const k of tehnike) n[k]++;
  }
  if (seme % 500 === 0) {
    const manjka = TEHNIKE.filter(k => n[k] < NA_TEHNIKO).map(k => `${k} ${n[k]}`).join(', ');
    console.error(`seme ${seme}, ${((Date.now() - t0) / 1000).toFixed(0)} s - manjka: ${manjka}`);
  }
}
const semen = seme;

// 3. Odvečni zapisi.
const ostane = new Array(zapisi.length).fill(true);
for (let i = zapisi.length - 1; i >= 0; i--) {
  if (zapisi[i].tehnike.every(k => n[k] > NA_TEHNIKO)) {
    ostane[i] = false;
    for (const k of zapisi[i].tehnike) n[k]--;
  }
}
const banka = zapisi.filter((_, i) => ostane[i]).sort((a, b) => a.seme - b.seme);

// 4. Zapis.
const datum = new Date().toISOString().slice(0, 10);
const vrstica = z => `  { seme: ${z.seme}, danosti: '${z.danosti}', stopnja: '${z.stopnja}', tehnike: [${z.tehnike.map(k => `'${k}'`).join(', ')}] },`;
const vsebina = `/* ==================== BANKA VAJ ====================
   Trening "Vadi v uganki" (docs/trening-v-uganki-nacrt.md, del 3): uganke s stanji
   tehnik, ki jih trening sproti pogosto ne najde. Brez DOM-a in brez odvisnosti.

   NE UREJAJ ROČNO. Datoteko ustvari orodje:
     node tools/ustvari-banko-vaj.js --na-tehniko ${NA_TEHNIKO}
   Ob vsaki spremembi motorja (shared/engine.js) ali generatorja (shared/generator.js)
   jo ustvari znova s tem orodjem. Če test tests/vaje-banka.test.js pade, datoteke in
   testa ne popravljaj ročno - poženi orodje.

   Ustvarjeno ${datum}: semena 1-${semen}, vsaj ${NA_TEHNIKO} ugank na tehniko, ${banka.length} zapisov.
   Zapis { seme, danosti, stopnja, tehnike }, urejeno po semenu:
   - danosti = genMinimalnaUganka(seme) (shared/generator.js), natanko ena rešitev;
   - stopnja = oceniTezavnost(danosti).tezavnost (lahko tudi "Presega tehnike" - vaja
     je en korak pred prvim poskusom s protislovjem);
   - tehnike = tehnikeVUganki(danosti).tehnike (shared/vaje-uganka.js): ključi
     ALL_TECHNIQUES, za katere ima uganka stanje vaje; ime za prikaz da imeTehnike(). */
const VAJE_BANKA = [
${banka.map(vrstica).join('\n')}
];
`;
fs.writeFileSync(IZHOD, vsebina);

const koncno = steviloZ(banka);
console.log(`Semen: ${semen}, zapisov: ${banka.length} (pred odstranitvijo odvečnih ${zapisi.length}), ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
for (const k of TEHNIKE) console.log(`  ${k}: ${koncno[k]}`);
console.log(`Zapisano v ${path.relative(process.cwd(), IZHOD)}.`);
