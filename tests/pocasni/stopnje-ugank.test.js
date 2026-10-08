'use strict';
// Vklop XY-verige ne spremeni ocene ugank, ki jih motor reši brez ugibanja
// (docs/xy-veriga-nacrt.md, korak 6 - test pred spremembo, zelen na stari kodi). Posnetek
// tests/posnetki/stopnje-ugank.json (tests/stopnje-ugank.js) je narejen pred vklopom: vse
// uganke iz docs/uganke.md, PRIMERI, vsi zapisi banke vaj in 300 minimalnih ugank.
//   - Uganka, ki ni »Presega tehnike«: ista težavnost, iste tehnike poti ocene, isti dnevnik
//     solve() (ves).
//   - Uganka »Presega tehnike«: ostane »Presega tehnike« ali postane »Ekstrem«; dnevnik solve()
//     je do prvega poskusa v posnetku enak (veriga pride šele tam, kjer je bil poskus).
// Traja pribl. 15 s, zato je med počasnimi.
// Zagon (vsi testi): node --test "tests/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { nalozi, oceni, beriPosnetek } = require('../stopnje-ugank.js');

const E = nalozi();
const posnetek = beriPosnetek();
const zgosti = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

test('posnetek: vse skupine ugank so zajete', () => {
  const skupine = {};
  for (const z of posnetek) {
    const s = z.izvor.split(':')[0];
    skupine[s] = (skupine[s] || 0) + 1;
  }
  assert.equal(skupine.banka, 356);
  assert.equal(skupine.minimalna, 300);
  assert.equal(skupine.PRIMERI, 15);
  assert.ok(skupine['uganke.md'] >= 9, JSON.stringify(skupine));
});

test('stopnja ugank, ki niso »Presega tehnike«, se ne spremeni; dnevnik do prvega poskusa je enak', () => {
  const razlike = [];
  for (const z of posnetek) {
    const zdaj = oceni(E, z.danosti);
    if (z.tezavnost !== 'Presega tehnike') {
      if (zdaj.tezavnost !== z.tezavnost) razlike.push(`${z.izvor}: ${z.tezavnost} → ${zdaj.tezavnost}`);
      else if (JSON.stringify(zdaj.tehnike) !== JSON.stringify(z.tehnike)) {
        razlike.push(`${z.izvor}: tehnike ${z.tehnike} → ${zdaj.tehnike}`);
      } else if (zdaj.poskus !== z.poskus || zdaj.dnevnik !== z.dnevnik) {
        razlike.push(`${z.izvor}: dnevnik solve()`);
      }
      continue;
    }
    if (!['Presega tehnike', 'Ekstrem'].includes(zdaj.tezavnost)) {
      razlike.push(`${z.izvor}: Presega tehnike → ${zdaj.tezavnost}`);
    }
    // Dnevnik do mesta prvega poskusa v posnetku.
    const { log } = E.solve(z.danosti);
    const pred = z.poskus < 0 ? log : log.slice(0, z.poskus);
    const dnevnik = zgosti(JSON.stringify(pred.map(k =>
      [k.technique, k.cells, k.assign, k.eliminate, k.message])));
    if (dnevnik !== z.dnevnik) razlike.push(`${z.izvor}: dnevnik do prvega poskusa`);
  }
  assert.deepEqual(razlike, []);
});
