'use strict';
// Izris korakov ostane do znaka enak (XY-veriga, korak 3 - docs/xy-veriga-nacrt.md): mala
// mreža reševalca z legendo in mreža igre (s kandidati in brez njih) za vse korake vseh ugank
// iz docs/uganke.md in rešena mreža se primerjajo s posnetkom tests/posnetki/izris-korakov.json,
// narejenim na kodi pred prikazom zaporedja verige (pomožna datoteka tests/izris-korakov.js).
// Zaporedne številke verige ne smejo spremeniti prikaza drugih tehnik. Nov posnetek ob vklopu
// XY-verige (korak 6): prej se je razlikoval samo pri example-app (od koraka 53),
// oakever-ekstrem-17-a (od 49) in xy-veriga-17 (od 31) - tam je namesto poskusa veriga.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { posnetek, POSNETEK } = require('./izris-korakov.js');

test('izris korakov: mala mreža reševalca in mreža igre do znaka enaki posnetku', () => {
  const shranjen = JSON.parse(fs.readFileSync(POSNETEK, 'utf8'));
  const zdaj = posnetek();
  assert.deepEqual(Object.keys(zdaj), Object.keys(shranjen), 'iste uganke');
  for (const [ime, p] of Object.entries(shranjen)) {
    const z = zdaj[ime];
    assert.equal(z.koraki.length, p.koraki.length, `${ime}: število korakov s posnetkom`);
    p.koraki.forEach((k, i) => {
      const [st, res, igra, brez] = k.split(':');
      const [, zres, zigra, zbrez] = z.koraki[i].split(':');
      assert.equal(z.koraki[i].split(':')[0], st, `${ime}: številka koraka`);
      assert.equal(zres, res, `${ime}, korak ${st}: mala mreža reševalca ali legenda`);
      assert.equal(zigra, igra, `${ime}, korak ${st}: mreža igre s kandidati`);
      assert.equal(zbrez, brez, `${ime}, korak ${st}: mreža igre z izklopljenimi kandidati`);
    });
    assert.equal(z.resena, p.resena, `${ime}: rešena mreža`);
  }
});
