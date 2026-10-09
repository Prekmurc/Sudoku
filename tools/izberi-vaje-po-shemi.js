'use strict';
// Seznam semen za vaji 1 in 2 »Spoznaj« po shemi pri 1 · Izločitev izven bloka in 2 · Izločitev v bloku
// (docs/trening-ucenje-nacrt.md, 1.6 in korak 5): PRESEK_PO_SHEMI v trening/generators.js.
//
// Zagon iz korena projekta:
//   node tools/izberi-vaje-po-shemi.js            (izpiše seznam)
//   node tools/izberi-vaje-po-shemi.js --zapisi   (in ga zapiše v trening/generators.js)
//
// Pregleda vse uganke banke vaj (shared/vaje-banka.js) s tehniko: seme je primerno, če ima uganka na
// poti korak z obliko sheme, ki je na delni mreži edini s to števko (primerenKorakPreseka() v
// trening/generators.js - isto merilo kot trening), in če iz njega nastaneta vaja 1 in vaja 2 na
// mestih sheme (presekPoShemiIzSemena() - premik s simetrijo, korak motorja na premaknjenem stanju).
// Preveri še, da genMinimalnaUganka(seme) da uganko iz banke.
//
// Orodje se požene znova ob vsaki spremembi motorja (shared/engine.js) ali generatorja
// (shared/generator.js) - takrat pade test tests/pocasni/trening-po-shemi.test.js (»vsako seme«) - in
// po vsaki novi banki vaj (tools/ustvari-banko-vaj.js). Seznama se ne ureja ročno.

const { loadContext } = require('../tests/load-engine.js');
const { makeDom } = require('../tests/dom-stub.js');
const fs = require('node:fs');
const path = require('node:path');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/sheme.js', 'trening/generators.js'];
const { run } = loadContext(DATOTEKE, makeDom().globals);
const ZAPISI = process.argv.includes('--zapisi');
const GENERATORJI = path.join(__dirname, '..', 'trening', 'generators.js');

const t0 = Date.now();
const seznam = {};
for (const mode of ['pointing', 'box-line']) {
  const t1 = Date.now();
  const izid = JSON.parse(run(`JSON.stringify((() => {
    const kljuc = PRESEK_KLJUC['${mode}'];
    const uganke = VAJE_BANKA.filter(z => z.tehnike.includes(kljuc));
    const semena = [], napake = [];
    for (const z of uganke) {
      if (!primerenKorakPreseka('${mode}', z.danosti)) continue;
      if (genMinimalnaUganka(z.seme) !== z.danosti) { napake.push(z.seme + ': uganka semena ni uganka iz banke'); continue; }
      if (!presekPoShemiIzSemena('${mode}', z.seme, false) || !presekPoShemiIzSemena('${mode}', z.seme, true)) { napake.push(z.seme + ': vaja ni nastala'); continue; }
      semena.push(z.seme);
    }
    return { ugank: uganke.length, semena, napake };
  })())`));
  seznam[mode] = izid.semena;
  console.log(`${mode}: ${izid.ugank} ugank v banki, primernih semen ${izid.semena.length} (${((Date.now() - t1) / 1000).toFixed(1)} s)`);
  for (const n of izid.napake) console.log(`  ! ${n}`);
}
if (seznam.pointing.length < 2 || seznam['box-line'].length < 2) {
  console.error('Premalo semen (vaji 1 in 2 imata različni semeni) - seznam ni zapisan.');
  process.exit(1);
}
const vrstica = `const PRESEK_PO_SHEMI={pointing:[${seznam.pointing.join(',')}],'box-line':[${seznam['box-line'].join(',')}]};`;
console.log(vrstica);
console.log(`Skupaj ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
if (ZAPISI) {
  const besedilo = fs.readFileSync(GENERATORJI, 'utf8');
  const nova = besedilo.replace(/^const PRESEK_PO_SHEMI=.*;$/m, vrstica);
  if (nova === besedilo && !besedilo.includes(vrstica)) { console.error('Vrstice PRESEK_PO_SHEMI v trening/generators.js ni.'); process.exit(1); }
  fs.writeFileSync(GENERATORJI, nova);
  console.log('Zapisano v trening/generators.js.');
}
