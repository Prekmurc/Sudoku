'use strict';
// Banka vaj za "Vadi v uganki" (docs/trening-v-uganki-nacrt.md, del 3;
// docs/vadi-v-uganki-nacrt.md, točka 16): ustvari shared/vaje-banka.js - uganke s stanji
// tehnik, ki jih trening sproti (meja 1 s) pogosto ne najde, po možnosti osnovne stopnje
// tehnike (stopnjaTehnike() v shared/vaje-uganka.js - iz ravni v shared/generator.js).
//
// Zagon iz korena projekta:
//   node tools/ustvari-banko-vaj.js [--na-tehniko 50] [--najvec-semen 30000]
//
// Postopek:
//   1. za semena 1, 2, ... uganka genMinimalnaUganka(seme) in tehnikeVUganki(danosti)
//      (shared/vaje-uganka.js - tehnike, za katere ima uganka stanje vaje, in stopnja);
//   2. uganka ostane, če ima tehniko, ki še nima --na-tehniko ugank:
//      - osnovne stopnje tehnike (npr. Težka pri 7-12), ali
//      - rešljivih (ne "Presega tehnike"), ali
//      - sploh (skrajni primer, ko rešljivih ni dovolj);
//      konec, ko imajo vse tehnike vse tri, ali pri --najvec-semen (redke kombinacije,
//      npr. Mečarica v Težki uganki, do --na-tehniko v razumnem času ne pridejo - vzame
//      se, kar je; meritev v načrtu, točka 16.3);
//   3. odvečni zapisi: od zadnjega proti prvemu se odstrani zapis, ki ni potreben za
//      nobeno od treh štetij nobene svoje tehnike (štetje bi brez njega ostalo vsaj
//      --na-tehniko ali se ga ne šteje);
//   4. zapis v shared/vaje-banka.js, urejeno po semenu (pregledne razlike v gitu).
// Če kaka tehnika po meji semen nima niti --na-tehniko ugank skupaj, banka ni zapisana.
//
// Banko je treba ustvariti znova ob vsaki spremembi motorja (shared/engine.js) ali
// generatorja (shared/generator.js). Če test tests/vaje-banka.test.js pade, se datoteka
// in test ne popravljata ročno - poženi to orodje.

const { loadEngine } = require('../tests/load-engine.js');
const fs = require('node:fs');
const path = require('node:path');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js'],
  names: ['genMinimalnaUganka', 'tehnikeVUganki', 'stopnjaTehnike', 'OCENA_PRESEGA'],
});

const args = process.argv.slice(2);
const arg = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? args[i + 1] : privzeto;
};
const NA_TEHNIKO = Number(arg('--na-tehniko', 50));
const NAJVEC_SEMEN = Number(arg('--najvec-semen', 30000));
const IZHOD = path.join(__dirname, '..', 'shared', 'vaje-banka.js');

const TEHNIKE = E.ALL_TECHNIQUES.map(([k]) => k);
const OSNOVNA = Object.fromEntries(TEHNIKE.map(k => [k, E.stopnjaTehnike(k)]));

// Tri štetja po tehnikah: osnovne stopnje, rešljive, vse. Zapis šteje v štetje, če ustreza
// njegovemu pogoju.
const STETJA = {
  osnovna: (z, k) => z.stopnja === OSNOVNA[k],
  resljiva: z => z.stopnja !== E.OCENA_PRESEGA,
  vse: () => true,
};
const nic = () => Object.fromEntries(Object.keys(STETJA).map(s => [s, Object.fromEntries(TEHNIKE.map(k => [k, 0]))]));
const pristej = (n, z, d) => {
  for (const [s, pogoj] of Object.entries(STETJA)) for (const k of z.tehnike) if (pogoj(z, k)) n[s][k] += d;
};
const manjka = n => TEHNIKE.some(k => Object.keys(STETJA).some(s => n[s][k] < NA_TEHNIKO));

// 1.-2. Semena po vrsti.
const t0 = Date.now();
const zapisi = [];
const n = nic();
let seme = 0;
while (manjka(n) && seme < NAJVEC_SEMEN) {
  seme++;
  const danosti = E.genMinimalnaUganka(seme);
  const { tehnike, stopnja } = E.tehnikeVUganki(danosti);
  const z = { seme, danosti, stopnja, tehnike: [...tehnike] };
  const koristi = Object.entries(STETJA).some(([s, pogoj]) => z.tehnike.some(k => pogoj(z, k) && n[s][k] < NA_TEHNIKO));
  if (koristi) {
    zapisi.push(z);
    pristej(n, z, 1);
  }
  if (seme % 1000 === 0) {
    const osn = TEHNIKE.filter(k => n.osnovna[k] < NA_TEHNIKO).map(k => `${k} ${n.osnovna[k]}`).join(', ');
    console.error(`seme ${seme}, ${((Date.now() - t0) / 1000).toFixed(0)} s - osnovne stopnje manjka: ${osn || '-'}`);
  }
}
const semen = seme;
const premalo = TEHNIKE.filter(k => n.vse[k] < NA_TEHNIKO);
if (premalo.length) {
  console.error(`Po ${semen} semenih nimajo ${NA_TEHNIKO} ugank: ${premalo.join(', ')} - banka ni zapisana.`);
  process.exit(1);
}

// 3. Odvečni zapisi: zapis je potreben, če bi brez njega katero štetje katere njegove
// tehnike padlo pod NA_TEHNIKO.
const ostane = new Array(zapisi.length).fill(true);
for (let i = zapisi.length - 1; i >= 0; i--) {
  const z = zapisi[i];
  const potreben = Object.entries(STETJA).some(([s, pogoj]) => z.tehnike.some(k => pogoj(z, k) && n[s][k] <= NA_TEHNIKO));
  if (!potreben) {
    ostane[i] = false;
    pristej(n, z, -1);
  }
}
const banka = zapisi.filter((_, i) => ostane[i]).sort((a, b) => a.seme - b.seme);

// 4. Zapis.
const datum = new Date().toISOString().slice(0, 10);
const stopnje = {};
for (const z of banka) stopnje[z.stopnja] = (stopnje[z.stopnja] || 0) + 1;
const vrstica = z => `  { seme: ${z.seme}, danosti: '${z.danosti}', stopnja: '${z.stopnja}', tehnike: [${z.tehnike.map(k => `'${k}'`).join(', ')}] },`;
const vsebina = `/* ==================== BANKA VAJ ====================
   Trening "Vadi v uganki" (docs/trening-v-uganki-nacrt.md, del 3; izbira po stopnji -
   docs/vadi-v-uganki-nacrt.md, točka 16) in vaji 1 in 2 v "Spoznaj": uganke s stanji
   tehnik, ki jih trening sproti pogosto ne najde. Brez DOM-a in brez odvisnosti.

   NE UREJAJ ROČNO. Datoteko ustvari orodje:
     node tools/ustvari-banko-vaj.js --na-tehniko ${NA_TEHNIKO} --najvec-semen ${NAJVEC_SEMEN}
   Ob vsaki spremembi motorja (shared/engine.js) ali generatorja (shared/generator.js)
   jo ustvari znova s tem orodjem. Če test tests/vaje-banka.test.js pade, datoteke in
   testa ne popravljaj ročno - poženi orodje.

   Ustvarjeno ${datum}: semena 1-${semen}, ${banka.length} zapisov (${Object.entries(stopnje).map(([s, k]) => `${s} ${k}`).join(', ')}).
   Na tehniko vsaj ${NA_TEHNIKO} rešljivih ugank (ne "Presega tehnike") in do ${NA_TEHNIKO} ugank
   osnovne stopnje tehnike (stopnjaTehnike() v shared/vaje-uganka.js), kolikor jih je do
   meje semen:
${TEHNIKE.map(k => `     ${k}: ${OSNOVNA[k]} ${n.osnovna[k]}, rešljivih ${n.resljiva[k]}`).join('\n')}
   Zapis { seme, danosti, stopnja, tehnike }, urejeno po semenu:
   - danosti = genMinimalnaUganka(seme) (shared/generator.js), natanko ena rešitev;
   - stopnja = oceniTezavnost(danosti).tezavnost (lahko tudi "Presega tehnike" - vaja
     je en korak pred prvim poskusom s protislovjem - samo, če rešljivih ni dovolj);
   - tehnike = tehnikeVUganki(danosti).tehnike (shared/vaje-uganka.js): ključi
     ALL_TECHNIQUES, za katere ima uganka stanje vaje; ime za prikaz da imeTehnike(). */
const VAJE_BANKA = [
${banka.map(vrstica).join('\n')}
];
`;
fs.writeFileSync(IZHOD, vsebina);

console.log(`Semen: ${semen}, zapisov: ${banka.length} (pred odstranitvijo odvečnih ${zapisi.length}), ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
console.log(`Stopnje: ${JSON.stringify(stopnje)}`);
for (const k of TEHNIKE) console.log(`  ${k}: osnovne (${OSNOVNA[k]}) ${n.osnovna[k]}, rešljivih ${n.resljiva[k]}, vseh ${n.vse[k]}`);
console.log(`Zapisano v ${path.relative(process.cwd(), IZHOD)}.`);
