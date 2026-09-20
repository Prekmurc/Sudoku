'use strict';
// Testi funkcij motorja za igro: nextStep() (en naslednji korak, ki ga uporablja
// tudi solve()), solutionOf() (rešitev uganke za "Preveri") in stepHint() (namig
// za drugo stopnjo postopne pomoči), na ugankah iz
// docs/uganke.md (nova uganka tam je samodejno vključena).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, { names: ['nextStep', 'solutionOf', 'applyStep', 'stepHint', 'techniqueGroup'] });

const uganke = loadPuzzles().map(p => {
  const danosti = p.danosti.replace(/\./g, '0');
  const r = E.solve(danosti);
  const tehnike = r.solutionCount === 1
    ? E.ALL_TECHNIQUES
    : E.ALL_TECHNIQUES.filter(([ime]) => ime !== 'Unique Rectangle');
  return { ime: p.ime, danosti, r, tehnike };
});

// Korak brez polj, ki jih doda solve() (posnetek stanja, usidrana številka).
const jedro = s => s && JSON.parse(JSON.stringify({
  technique: s.technique, message: s.message, cells: s.cells, assign: s.assign, eliminate: s.eliminate,
}));
const stevke = s => new Set([...s.assign.map(([, d]) => d), ...s.eliminate.map(([, d]) => d)]);

for (const u of uganke) {
  test(`${u.ime}: zaporedje nextStep() da isti dnevnik kot solve()`, () => {
    const b = new E.Board(u.danosti);
    let fokus = null;
    for (const s of u.r.log) {
      if (s.technique === 'OBSTALO' || s.technique === 'NAPAKA') break;
      const pred = JSON.stringify([b.grid, b.cand]);
      const k = E.nextStep(b, u.tehnike, fokus);
      assert.equal(JSON.stringify([b.grid, b.cand]), pred, 'nextStep ne spremeni deske');
      assert.deepEqual(jedro(k), jedro(s));
      E.applyStep(b, k);
      fokus = s.focusDigit;
    }
  });

  // Sidranje na številko velja samo znotraj najlažje skupine tehnik, ki kaj najde
  // (TECHNIQUE_GROUPS): korak iz lažje skupine je pred sidranim korakom iz težje.
  test(`${u.ime}: poudarjena številka ima prednost znotraj najlažje skupine, ne čez njo`, () => {
    const b = new E.Board(u.danosti);
    const brez = E.nextStep(b, u.tehnike);
    assert.deepEqual(jedro(brez), jedro(u.r.log[0]), 'brez številke: prvi korak solve()');
    const skupina = E.techniqueGroup(brez.technique);
    for (let d = 1; d <= 9; d++) {
      const vSkupini = u.tehnike.some(([ime, fn]) =>
        E.techniqueGroup(ime) === skupina && fn(b).some(s => stevke(s).has(d)));
      const k = E.nextStep(b, u.tehnike, d);
      assert.equal(E.techniqueGroup(k.technique), skupina, `številka ${d}: korak ostane v najlažji skupini`);
      if (vSkupini) assert.ok(stevke(k).has(d), `korak za številko ${d}`);
      else assert.deepEqual(jedro(k), jedro(brez), `številke ${d} v tej skupini ni - korak je enak kot brez nje`);
    }
  });

  // Poudarek (izrecna izbira igralca) pa skupine prebije: korak s to številko
  // dobimo, če sploh obstaja, tudi iz zahtevnejše skupine.
  test(`${u.ime}: poudarjena številka (acrossGroups) prebije skupine`, () => {
    const b = new E.Board(u.danosti);
    const brez = E.nextStep(b, u.tehnike);
    for (let d = 1; d <= 9; d++) {
      const obstaja = u.tehnike.some(([, fn]) => fn(b).some(s => stevke(s).has(d)));
      const k = E.nextStep(b, u.tehnike, d, true);
      if (obstaja) assert.ok(stevke(k).has(d), `korak za številko ${d}`);
      else assert.deepEqual(jedro(k), jedro(brez), `za številko ${d} ni koraka - enak kot brez nje`);
    }
  });

  test(`${u.ime}: solutionOf() da veljavno rešitev, skladno z danostmi`, () => {
    const res = E.solutionOf(u.danosti);
    assert.ok(res, 'rešitev obstaja');
    for (let c = 0; c < 81; c++) if (u.danosti[c] !== '0') assert.equal(res[c], +u.danosti[c]);
    for (const enota of [...E.ROWS, ...E.COLS, ...E.BOXES]) {
      assert.deepEqual([...enota.map(c => res[c])].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    if (u.r.board.isSolved()) assert.deepEqual([...res], [...u.r.board.grid], 'enaka kot rešitev iz solve()');
  });
}

test('stepHint(): vsak korak iz solve() ima namig za drugo stopnjo, razen poskusa in protislovja', () => {
  const videne = new Set();
  for (const u of uganke) {
    for (const s of u.r.log) {
      if (s.technique === 'OBSTALO' || s.technique === 'NAPAKA') continue;
      const namig = E.stepHint(s);
      if (s.technique.includes('protislovje')) { assert.equal(namig, null); continue; }
      videne.add(s.technique);
      assert.equal(typeof namig, 'string', `${u.ime}: ${s.technique}`);
      assert.match(namig, /\.$/);
      // Namig ne izda celice (V?S?) - to pride šele z razlago.
      assert.doesNotMatch(namig, /V\dS\d/, `${u.ime}: ${s.technique}: ${namig}`);
      // Namig nikoli ne da enote skupaj s števko - to bi (skoraj) določilo odgovor.
      assert.ok(!(s.hint.unit && s.hint.digits), `${s.technique}: enota in števka`);
      if (['Skriti enojček', 'Pointing pair/triple', 'Box-line reduction'].includes(s.technique)) {
        assert.match(namig, /^V (vrstici|stolpcu|bloku) \d\.$/);
      }
      if (['X-Wing', 'Swordfish', 'Turbot Fish'].includes(s.technique)) {
        assert.match(namig, /^Števka \d(, v (dveh|treh) (vrsticah|stolpcih))?\.$/);
        assert.equal(s.hint.unit, undefined);
      }
      if (s.technique === 'Gol enojček') {
        // Število golih enojčkov v mreži tik pred korakom.
        const b = Object.assign(Object.create(E.Board.prototype), { grid: s.snapshotGrid, cand: s.snapshotCand });
        const n = E.ALL_TECHNIQUES.find(([ime]) => ime === 'Gol enojček')[1](b).length;
        assert.equal(s.hint.count, n);
      }
      if (s.hint.digits && !['XY-Wing', 'W-Wing', 'Unique Rectangle'].includes(s.technique)) {
        assert.ok(s.hint.digits.every(d => namig.includes(String(d))), namig);
      }
    }
  }
  assert.ok(videne.size >= 8, `pokritih tehnik: ${[...videne].join(', ')}`);
});

test('stepHint(): besedila namigov', () => {
  const hint = (technique, h) => E.stepHint({ technique, hint: h });
  assert.equal(hint('Skriti enojček', { unit: E.ROWS[3] }), 'V vrstici 4.');
  assert.equal(hint('Pointing pair/triple', { unit: E.BOXES[4] }), 'V bloku 5.');
  assert.equal(hint('Box-line reduction', { unit: E.COLS[2] }), 'V stolpcu 3.');
  assert.equal(hint('Naked pair', { unit: E.COLS[1] }), 'V stolpcu 2.');
  assert.equal(hint('X-Wing', { digits: [9], lines: 'stolpcih', lineCount: 2 }), 'Števka 9, v dveh stolpcih.');
  assert.equal(hint('Swordfish', { digits: [5], lines: 'vrsticah', lineCount: 3 }), 'Števka 5, v treh vrsticah.');
  assert.equal(hint('Turbot Fish', { digits: [4] }), 'Števka 4.');
  assert.equal(hint('XY-Wing', { digits: [3, 8] }), 'Pivot ima kandidata 3 in 8.');
  assert.equal(hint('W-Wing', { digits: [1, 6] }), 'Celici para imata kandidata 1 in 6.');
  assert.equal(hint('Unique Rectangle', { digits: [2, 7] }), 'Pravokotnik tvorita števki 2 in 7.');
  assert.equal(hint('Gol enojček', { count: 1 }), 'V mreži je 1 celica z enim samim kandidatom.');
  assert.equal(hint('Gol enojček', { count: 2 }), 'V mreži sta 2 celici z enim samim kandidatom.');
  assert.equal(hint('Gol enojček', { count: 4 }), 'V mreži so 4 celice z enim samim kandidatom.');
  assert.equal(hint('Gol enojček', { count: 5 }), 'V mreži je 5 celic z enim samim kandidatom.');
  assert.equal(E.stepHint({ technique: 'Poskus in protislovje (forcing chain)' }), null);
});

test('solutionOf(): danosti s protislovjem nimajo rešitve', () => {
  const d = uganke[0].danosti;
  // V vrstico prve dane števke dodamo še enkrat isto števko (v prazno celico).
  const dana = d.split('').findIndex(ch => ch !== '0');
  const vrsta = Math.floor(dana / 9);
  const prazna = E.ROWS[vrsta].find(c => d[c] === '0');
  const pokvarjene = d.slice(0, prazna) + d[dana] + d.slice(prazna + 1);
  assert.equal(E.solutionOf(pokvarjene), null);
});
