'use strict';
// Vaji 1 · Izločitev izven bloka in 2 · Izločitev v bloku v načinu "Spoznaj" na pravi
// mreži (docs/geometrija-1-2-nacrt.md): generator genPresek() v trening/generators.js
// vzame stanje prave uganke iz banke vaj (shared/vaje-banka.js) in korak motorja, na
// mreži sta vidna samo blok in vrstica/stolpec koraka. Nič ni sestavljeno na pamet -
// uganke so iz banke (ena rešitev preverja tests/vaje-banka.test.js), korake izračuna
// motor. Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js',
  'shared/vaje-banka.js', 'trening/generators.js'];

// Kontekst z Math.random s semenom (mulberry32) - vaje so ponovljive.
function pripravi(seme) {
  const { run } = loadContext(DATOTEKE);
  run(`var seme = ${seme}; Math.random = () => {
    seme = (seme + 0x6D2B79F5) | 0;
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };`);
  // Vrednosti iz konteksta v navadne objekte tega procesa (deepEqual primerja tudi prototipe).
  return izraz => JSON.parse(JSON.stringify(run(izraz)));
}

const KROGOV = 12; // po 9 vaj
const MODE = { pointing: 'Pointing pair/triple', 'box-line': 'Box-line reduction' };

for (const [mode, kljuc] of Object.entries(MODE)) {
  test(`${mode}: vaja je korak motorja v stanju prave uganke, vidna sta samo blok in enota`, () => {
    const run = pripravi(20260927);
    const t0 = process.hrtime.bigint();
    const vaje = run(`Array.from({ length: ${KROGOV * 9} }, (_, i) => genPresek(i % 9, '${mode}'))`);
    const msNaVajo = Number(process.hrtime.bigint() - t0) / 1e6 / vaje.length;
    const banka = run(`VAJE_BANKA.filter(z => z.tehnike.includes('${kljuc}')).map(z => z.danosti)`);
    const [ROWS, COLS, BOXES] = run('[ROWS, COLS, BOXES]');
    const PEERS = run('PEERS.map(s => [...s])');

    for (const [i, ex] of vaje.entries()) {
      const ime = `vaja ${i}`;
      assert.ok(banka.includes(ex.danosti), `${ime}: uganka je iz banke`);
      // Stanje in korak znova izračuna motor: S0 (vpisi in kandidati) je stanje na poti,
      // korak mora biti med koraki tehnike v njem.
      const pravi = run(`(() => {
        const D = ${JSON.stringify(ex.danosti)};
        for (const S of stanjaVUganki(D, '${kljuc}').stanja) {
          const v = vajaIzStanja(D, '${kljuc}', S, '');
          if (v.S0.grid.join() === ${JSON.stringify(ex.grid.join())} && v.S0.kandidati.join() === ${JSON.stringify(ex.kandidati.join())}) {
            return { KT: v.KT.map(k => ({ cells: k.cells, eliminate: k.eliminate })) };
          }
        }
        return null;
      })()`);
      assert.ok(pravi, `${ime}: stanje (vpisi in kandidati) je na poti motorja`);
      // (Iste celice ima lahko tudi korak z drugo števko, zato se primerja še izbrise.)
      const korak = pravi.KT.find(k => k.cells.join() === ex.solutionCells.join() && JSON.stringify(k.eliminate) === JSON.stringify(ex.solutionEliminate));
      assert.ok(korak, `${ime}: korak vaje (celice in izbrisi) je korak tehnike v S0`);
      assert.equal(ex.digit, korak.eliminate[0][1]);

      // Vidne celice: natanko blok ∪ vrstica/stolpec koraka (15 celic).
      const enota = ex.jeVrstica ? ROWS[ex.enotaSt] : COLS[ex.enotaSt];
      const blok = BOXES[ex.blok];
      const vidne = new Set(ex.vidne);
      assert.equal(vidne.size, 15, `${ime}: 15 vidnih celic`);
      assert.deepEqual([...vidne].sort((a, b) => a - b), [...new Set([...blok, ...enota])].sort((a, b) => a - b));
      // Celice koraka so v preseku, izbrisi v vidnem delu druge enote (zunaj primarne).
      const primarna = mode === 'pointing' ? blok : enota;
      const druga = mode === 'pointing' ? enota : blok;
      assert.deepEqual([...ex.primaryCells], primarna);
      for (const c of ex.solutionCells) assert.ok(blok.includes(c) && enota.includes(c), `${ime}: celica ${c} v preseku`);
      for (const [c] of ex.solutionEliminate) assert.ok(druga.includes(c) && !primarna.includes(c), `${ime}: izbris ${c}`);
      // Kandidat d je v primarni enoti natanko v celicah koraka - vzorec se vidi na mreži.
      const zD = primarna.filter(c => !ex.grid[c] && (ex.kandidati[c] & (1 << ex.digit)));
      assert.deepEqual(zD, ex.solutionCells, `${ime}: kandidat ${ex.digit} v primarni enoti`);
      // Skladnost: noben kandidat vidne celice ni števka, vpisana v vidni sosedi.
      for (const c of vidne) {
        if (ex.grid[c]) continue;
        for (const p of PEERS[c]) {
          if (vidne.has(p) && ex.grid[p]) assert.ok(!(ex.kandidati[c] & (1 << ex.grid[p])), `${ime}: kandidat ${ex.grid[p]} v ${c}`);
        }
      }
      // Odgovor je enoličen: noben drug korak tehnike s to števko ni v celoti med vidnimi.
      const drugi = pravi.KT.filter(k => k !== korak && k.eliminate[0][1] === ex.digit && k.cells.every(c => vidne.has(c)));
      assert.equal(drugi.length, 0, `${ime}: drug vzorec iste števke med vidnimi`);
      // Besedila se ujemajo z blokom, enoto in števko.
      const lineLabel = `${ex.jeVrstica ? 'Vrstica' : 'Stolpec'} ${ex.enotaSt + 1}`;
      assert.equal(ex.unitLabel, mode === 'pointing' ? `Blok ${ex.blok + 1} → ${lineLabel}` : `${lineLabel} → Blok ${ex.blok + 1}`);
      assert.ok(ex.desc.startsWith(`Števka ${ex.digit}: v `), ex.desc);
      assert.ok(ex.desc.includes(mode === 'pointing' ? `bloku ${ex.blok + 1}` : `${ex.jeVrstica ? 'vrstici' : 'stolpcu'} ${ex.enotaSt + 1}`), ex.desc);
    }
    // Raznolikost: več različnih ugank, vrstice in stolpci.
    assert.ok(new Set(vaje.map(v => v.danosti)).size > vaje.length / 2, 'različne uganke');
    assert.ok(vaje.some(v => v.jeVrstica) && vaje.some(v => !v.jeVrstica), 'vrstice in stolpci');
    assert.ok(msNaVajo < 200, `čas na vajo ${msNaVajo.toFixed(0)} ms`);
  });

  test(`${mode}: v vsakem krogu 9 vaj je vsaj ena vaja s tremi celicami, druge po resnični pogostosti`, () => {
    const run = pripravi(7);
    const krogi = run(`Array.from({ length: ${KROGOV} }, () => Array.from({ length: 9 }, (_, n) => {
      const ex = genPresek(n, '${mode}');
      return { n, trojica: ex.solutionCells.length === 3, izbrana: n === presekTrojica['${mode}'] };
    }))`);
    let ostalih = 0, ostalihTrojic = 0;
    const mesta = new Set();
    for (const [r, krog] of krogi.entries()) {
      assert.ok(krog.some(v => v.trojica), `krog ${r}: vsaj ena trojica`);
      const izbrana = krog.filter(v => v.izbrana);
      assert.equal(izbrana.length, 1, `krog ${r}: ena izbrana vaja`);
      assert.ok(izbrana[0].trojica, `krog ${r}: izbrana vaja ima tri celice`);
      mesta.add(izbrana[0].n);
      for (const v of krog.filter(v => !v.izbrana)) { ostalih++; if (v.trojica) ostalihTrojic++; }
    }
    // Mesto vaje s trojico v krogu ni vedno isto.
    assert.ok(mesta.size > 1, `mesta trojice: ${[...mesta]}`);
    // Ostale vaje niso prisiljene v trojice (resnična pogostost je pribl. 1 od 10).
    assert.ok(ostalihTrojic < ostalih / 3, `trojic med ostalimi: ${ostalihTrojic} / ${ostalih}`);
  });
}
