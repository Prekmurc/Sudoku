'use strict';
// Analiza izvožene zbirke ugank (app/ -> gumb "Zbirka" -> "Izvozi") glede na pokritost
// tehnik v docs/uganke.md. Za vsako uganko požene countSolutions() in solve() ter pove,
// katere tehnike sproži in katere od njih so v docs/uganke.md zdaj slabo pokrite -
// torej katero uganko se splača dodati.
//
// Zagon iz korena projekta:
//   node tools/analiziraj-zbirko.js <pot-do-zbirke.md> [--najdene]
//
// --najdene: pri vsaki uganki poišče tudi tehnike, ki jih solve() NE uporabi, a jih
// njihova funkcija v kakem vmesnem stanju najde (počasneje - pregleda vsak korak).
const path = require('node:path');
const fs = require('node:fs');
const { loadEngine, loadPuzzles } = require('../tests/load-engine.js');

const E = loadEngine();
const args = process.argv.slice(2);
const zNajdenimi = args.includes('--najdene');
const file = args.find(a => !a.startsWith('--'));
if (!file) {
  console.error('Uporaba: node tools/analiziraj-zbirko.js <pot-do-zbirke.md> [--najdene]');
  process.exit(2);
}

// Uganke iz poljubne Markdown datoteke: naslov "### ..." + vrstica "- **Danosti...:** `...`".
// Isti zapis uporabljata docs/uganke.md in izvoz zbirke, zato zadošča en bralnik.
function preberi(p) {
  const md = fs.readFileSync(p, 'utf8');
  const out = [];
  let ime = null;
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^###\s+(.+?)\s*$/);
    if (h) { ime = h[1]; continue; }
    const g = line.match(/\*\*Danosti[^*]*\*\*\s*`([0-9.]{81})`/);
    if (g && ime) { out.push({ ime, danosti: g[1] }); ime = null; }
  }
  return out;
}

const VSE = E.ALL_TECHNIQUES.map(([n]) => n);

// Kolikokrat (v koliko ugankah) je tehnika dejansko uporabljena v dnevniku solve().
function pokritost(uganke) {
  const st = Object.fromEntries(VSE.map(n => [n, []]));
  for (const { ime, danosti } of uganke) {
    const { log } = E.solve(danosti);
    for (const n of new Set(log.map(s => s.technique))) if (st[n]) st[n].push(ime);
  }
  return st;
}

function analiziraj(danosti) {
  const enolicnost = E.countSolutions(danosti);
  const { board, log } = E.solve(danosti);
  const uporabljene = {};
  for (const s of log) uporabljene[s.technique] = (uporabljene[s.technique] || 0) + 1;
  const najdene = new Set();
  if (zNajdenimi) {
    for (const s of log) {
      const b = Object.create(E.Board.prototype);
      b.grid = s.snapshotGrid.slice(); b.cand = s.snapshotCand.slice();
      for (const [n, fn] of E.ALL_TECHNIQUES) {
        if (uporabljene[n] || najdene.has(n)) continue;
        if (fn(b).length) najdene.add(n);
      }
    }
  }
  // Ali kateri korak izbriše ali vpiše napačno številko (uganka ima eno rešitev,
  // zato je rešena mreža ravno ta rešitev).
  let napacen = false;
  if (board.isSolved()) {
    for (const s of log) {
      for (const [c, d] of s.assign) if (board.grid[c] !== d) napacen = true;
      for (const [c, d] of s.eliminate) if (board.grid[c] === d) napacen = true;
    }
  }
  return {
    enolicnost, log, uporabljene, najdene,
    resena: board.isSolved() && board.isValid(),
    obstalo: log.some(s => s.technique === 'OBSTALO' || s.technique === 'NAPAKA'),
    napacen,
    ugibanj: uporabljene['Poskus in protislovje (forcing chain)'] || 0,
  };
}

const docsPot = path.join(__dirname, '..', 'docs', 'uganke.md');
const docs = loadPuzzles();
// Prazna celica je lahko zapisana kot "." ali "0" (docs/uganke.md in izvoz zbirke
// uporabljata piko, polje PRIMERI v app/app.js pa ničlo), zato pred primerjavo
// zapis poenotimo.
const norm = g => g.replace(/0/g, '.');
const docsDanosti = new Set(docs.map(p => norm(p.danosti)));
const pokr = pokritost(docs);
const NEPOKRITE = VSE.filter(n => pokr[n].length === 0);
const SIBKE = VSE.filter(n => pokr[n].length === 1);

console.log(`Referenca pokritosti: ${path.relative(process.cwd(), docsPot)} (${docs.length} ugank)`);
console.log(`  nepokrite tehnike (0 ugank):   ${NEPOKRITE.join(', ') || '—'}`);
console.log(`  šibko pokrite  (1 uganka):     ${SIBKE.map(n => `${n} [${pokr[n][0]}]`).join(', ') || '—'}`);
console.log(`\nZbirka: ${file}`);

const zbirka = preberi(file);
if (!zbirka.length) {
  console.error('V datoteki ni bilo najdene nobene uganke (pričakovan zapis "- **Danosti:** `...`").');
  process.exit(1);
}

const kandidati = [];
zbirka.forEach((u, i) => {
  const a = analiziraj(u.danosti);
  const ze = docsDanosti.has(norm(u.danosti));
  const prispevek = Object.keys(a.uporabljene).filter(n => NEPOKRITE.includes(n) || SIBKE.includes(n));

  console.log(`\n--- [${i + 1}] ${u.ime}`);
  console.log(`    ${u.danosti}`);
  const opozorila = [];
  if (a.enolicnost !== 1) opozorila.push(`ENOLIČNOST: ${a.enolicnost}`);
  if (!a.resena) opozorila.push('NI REŠENA');
  if (a.obstalo) opozorila.push('OBSTALO/NAPAKA');
  if (a.napacen) opozorila.push('NAPAČEN KORAK');
  console.log(`    korakov ${a.log.length}, ugibanj ${a.ugibanj}${opozorila.length ? '  ⚠ ' + opozorila.join('; ') : ''}`);
  console.log('    tehnike: ' + Object.entries(a.uporabljene).sort((x, y) => y[1] - x[1])
    .map(([n, v]) => `${n} ${v}`).join(', '));
  if (zNajdenimi && a.najdene.size) console.log('    samo najdene (neuporabljene): ' + [...a.najdene].join(', '));

  if (ze) { console.log('    => že v docs/uganke.md'); return; }
  if (a.enolicnost !== 1 || !a.resena || a.obstalo || a.napacen) { console.log('    => NE DODAJATI (glej opozorila)'); return; }
  if (!prispevek.length) { console.log('    => ne prispeva nič novega (same tehnike, pokrite z >= 2 ugankami)'); return; }
  console.log('    => PRIPOROČENA, zapre vrzel pri: ' + prispevek
    .map(n => `${n} (zdaj ${pokr[n].length})`).join(', '));
  kandidati.push({ ime: u.ime, danosti: u.danosti, prispevek, ugibanj: a.ugibanj, korakov: a.log.length });
});

// Požrešni izbor: najmanj ugank za največ vrzeli. Ob enakem prispevku ima prednost
// uganka brez ugibanja (bolj uporabna kot regresijski primer).
console.log('\n=== Predlog (najmanj ugank za največ vrzeli) ===');
const odprte = new Set([...NEPOKRITE, ...SIBKE]);
const izbrani = [];
let ostali = kandidati.slice();
while (ostali.length) {
  ostali.sort((a, b) => {
    const da = a.prispevek.filter(n => odprte.has(n)).length;
    const db = b.prispevek.filter(n => odprte.has(n)).length;
    return db - da || a.ugibanj - b.ugibanj;
  });
  const best = ostali[0];
  const nove = best.prispevek.filter(n => odprte.has(n));
  if (!nove.length) break;
  izbrani.push({ ...best, nove });
  nove.forEach(n => odprte.delete(n));
  ostali = ostali.slice(1);
}
if (!izbrani.length) console.log('  Nobena uganka iz te zbirke ne zapre nobene vrzeli.');
for (const z of izbrani) console.log(`  + ${z.ime}  ->  ${z.nove.join(', ')}`);
const preostale = [...odprte];
console.log('  Še vedno odprto po tem: ' + (preostale.join(', ') || '—'));
