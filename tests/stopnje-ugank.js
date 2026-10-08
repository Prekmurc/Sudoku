'use strict';
// Stopnje ugank pred vklopom XY-verige (docs/xy-veriga-nacrt.md, korak 6): posnetek ocene
// vseh ugank iz docs/uganke.md, vgrajenih primerov (PRIMERI), vseh zapisov banke vaj
// (VAJE_BANKA) in 300 minimalnih ugank (genMinimalnaUganka(1..300)). Za vsako uganko so
// zapisani danosti, težavnost (oceniTezavnost()), tehnike poti ocene (mere.uporabljene) in
// zgoščena vrednost dnevnika solve() do prvega poskusa (brez njega ves dnevnik).
//
// Danosti so v posnetku, ker se banka in primeri v koraku 6 ustvarijo znova - primerjajo se
// uganke, ki so bile v njih pred vklopom. Posnetek je narejen na kodi pred korakom 6 (4f4652d);
// nov posnetek samo, če je sprememba ocene namerna: node tests/stopnje-ugank.js --shrani
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const POSNETEK = path.join(__dirname, 'posnetki', 'stopnje-ugank.json');
const MINIMALNIH = 300;

function nalozi() {
  return loadEngine(undefined, {
    files: ['shared/stanje.js', 'shared/zbirka.js', 'shared/generator.js', 'shared/vaje-banka.js'],
    names: ['oceniTezavnost', 'genMinimalnaUganka', 'PRIMERI', 'VAJE_BANKA', 'POSKUS_KLJUC'],
  });
}

const zgosti = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// Ocena ene uganke: { tezavnost, tehnike, poskus, dnevnik }. `poskus` je indeks prvega poskusa
// v dnevniku solve() ali -1, `dnevnik` zgoščena vrednost dnevnika pred njim.
function oceni(E, danosti) {
  const o = E.oceniTezavnost(danosti);
  const { log } = E.solve(danosti);
  const poskus = log.findIndex(k => k.technique.startsWith(E.POSKUS_KLJUC));
  const pred = poskus < 0 ? log : log.slice(0, poskus);
  const dnevnik = zgosti(JSON.stringify(pred.map(k =>
    [k.technique, k.cells, k.assign, k.eliminate, k.message])));
  const tehnike = o.mere ? [...o.mere.uporabljene].sort() : null;
  return { tezavnost: o.tezavnost, tehnike, poskus, dnevnik };
}

// Uganke posnetka: [{ izvor, danosti }] iz trenutne kode (samo za --shrani).
function uganke(E) {
  const out = [];
  for (const p of loadPuzzles()) out.push({ izvor: 'uganke.md: ' + p.ime, danosti: p.danosti });
  for (const p of E.PRIMERI) out.push({ izvor: 'PRIMERI: ' + p.ime, danosti: p.danosti });
  for (const z of E.VAJE_BANKA) out.push({ izvor: 'banka: seme ' + z.seme, danosti: z.danosti });
  for (let s = 1; s <= MINIMALNIH; s++) {
    out.push({ izvor: 'minimalna: seme ' + s, danosti: E.genMinimalnaUganka(s) });
  }
  return out;
}

function beriPosnetek() {
  return JSON.parse(fs.readFileSync(POSNETEK, 'utf8'));
}

if (require.main === module && process.argv.includes('--shrani')) {
  const E = nalozi();
  const zapisi = uganke(E).map(u => ({ ...u, ...oceni(E, u.danosti) }));
  fs.mkdirSync(path.dirname(POSNETEK), { recursive: true });
  fs.writeFileSync(POSNETEK, JSON.stringify(zapisi, null, 0).replace(/\},\{/g, '},\n{') + '\n');
  const po = {};
  for (const z of zapisi) po[z.tezavnost] = (po[z.tezavnost] || 0) + 1;
  console.log(`Zapisanih ${zapisi.length} ugank v ${POSNETEK}:`, po);
}

module.exports = { nalozi, oceni, beriPosnetek, POSNETEK };
