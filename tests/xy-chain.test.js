'use strict';
// Testi tehnike XY-veriga (shared/engine.js xyChain, docs/xy-veriga-nacrt.md, korak 1).
// Zagon iz korena projekta: node --test "tests/*.test.js"
//
// Testne pozicije niso sestavljene na pamet: so posnetki stanja kandidatov (snapshotGrid/
// snapshotCand v dnevniku solve()) tik pred prvim poskusom s protislovjem pri ugankah iz
// docs/uganke.md, posneti 2026-10-07, ko XY-verige še ni bilo v ALL_TECHNIQUES. Da so
// skladne z uganko, preveri test (vpisi so števke rešitve, števka rešitve je med kandidati).
//
// Pričakovani koraki so iz NEODVISNEGA iskanja spodaj (vse preproste poti po celicah z
// dvema kandidatoma, pravilo vzorca zapisano posebej), ne iz kode funkcije.
// Varnost na stanjih 300 minimalnih ugank preverja tests/pocasni/xy-chain-uganke.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles, boardFromText } = require('./load-engine.js');
const { verigeNeodvisno: neodvisno } = require('./xy-veriga-neodvisno.js');

const E = loadEngine(undefined, { names: ['xyChain', 'solutionOf', 'cellsLabel', 'stepHint'] });
const plain = x => JSON.parse(JSON.stringify(x));
const L = c => E.cellLabel(c);
const opis = step => ({
  cells: step.cells.map(L),
  eliminate: step.eliminate.map(([c, d]) => `${L(c)}≠${d}`),
});
const verigeNeodvisno = (b, najmanj, najvec) => neodvisno(b, najmanj, najvec, L);
const UGANKE = Object.fromEntries(loadPuzzles().map(u => [u.ime, u.danosti]));

// xy-veriga-17, stanje pred korakom 31 od 77 (poskus V4S2≠8).
const XY17_POS = `
[3457] [347] [135] 2 [13479] 6 [3479] 8 [137]
[2347] 6 [1238] [139] [134789] [134789] [3479] 5 [1237]
[2347] 9 [1238] 5 [13478] [13478] [347] 6 [1237]
1 [38] 6 7 [389] [389] 5 2 4
[357] [28] [35] [13] [248] [248] 6 [17] 9
9 [27] 4 6 5 [12] [38] [17] [38]
8 5 7 [139] [139] [139] 2 4 6
6 [34] [23] [48] [27] 5 1 9 [78]
[24] 1 9 [48] 6 [27] [78] 3 5`;

// example-app, stanje pred korakom 53 od 79 (poskus V1S6≠7) - isto kot NO_PATTERN_POS
// v tests/xy-wing.test.js.
const EXAMPLE_POS = `
4 6 3 8 9 [17] [17] 2 5
9 1 [28] 5 [34] [237] 6 [37] [48]
7 5 [28] 6 [134] [123] [138] 9 [148]
6 2 4 3 [18] [18] 9 5 7
8 9 1 7 2 5 4 6 3
5 3 7 9 6 4 [12] 8 [12]
[13] 4 9 [12] 5 6 [2378] [37] [28]
[13] 8 5 [12] 7 9 [23] 4 6
2 7 6 4 [38] [38] 5 1 9`;

// oakever-ekstrem-17-a, stanje pred korakom 49 od 75 (poskus V1S5≠2).
const OAKEVER17A_POS = `
8 1 5 7 [24] [24] 3 6 9
6 [37] [37] 1 5 9 4 2 8
4 9 2 8 [36] [36] 7 1 5
7 [68] 1 4 [28] 5 9 3 [26]
2 [34] 9 6 [37] 1 8 5 [47]
5 [48] [36] 9 [78] [23] 1 [47] [26]
1 [67] [467] 2 9 8 5 [47] 3
3 2 8 5 1 [47] 6 9 [47]
9 5 [47] 3 [46] [467] 2 8 1`;

// oakever-ekstrem-lv4, stanje z XY-krilom (XYWING_POS iz tests/xy-wing.test.js).
const XYWING_POS = `
8 5 [349] [349] 2 1 7 6 [39]
2 [34] 7 6 [349] 8 5 [49] 1
6 [1349] [1349] 7 [349] 5 [34] 2 8
1 7 2 8 [349] [349] 6 [49] 5
[34] 8 [349] 5 6 [349] 2 1 7
5 [349] 6 1 7 2 [34] 8 [39]
[349] 2 5 [349] 1 [349] 8 7 6
[49] 6 8 [49] 5 7 1 3 2
7 [13] [13] 2 8 6 9 5 4`;

const POZICIJE = [
  ['xy-veriga-17', XY17_POS],
  ['example-app', EXAMPLE_POS],
  ['oakever-ekstrem-17-a', OAKEVER17A_POS],
  ['oakever-ekstrem-lv4', XYWING_POS],
];

test('pozicije so skladne s svojo uganko (vpisi iz rešitve, števka rešitve med kandidati)', () => {
  const danosti = { ...UGANKE };
  for (const [ime, poz] of POZICIJE) {
    assert.ok(danosti[ime], `uganka ${ime} je v docs/uganke.md`);
    assert.equal(E.countSolutions(danosti[ime]), 1, ime);
    const res = E.solutionOf(danosti[ime]);
    const b = boardFromText(E, poz);
    for (let c = 0; c < 81; c++) {
      if (b.grid[c]) assert.equal(b.grid[c], res[c], `${ime} ${L(c)}`);
      else assert.ok(b.cand[c] & (1 << res[c]), `${ime} ${L(c)}: števka rešitve ${res[c]} je kandidat`);
    }
  }
});

test('preizkusna uganka: prvi korak je veriga V5S4 – V6S6 – V9S6 – V8S5 – V8S3, izbriše 3 iz V5S3', () => {
  const koraki = E.xyChain(boardFromText(E, XY17_POS));
  assert.equal(koraki[0].technique, 'XY-Chain');
  assert.deepEqual(plain(opis(koraki[0])), {
    cells: ['V5S4', 'V6S6', 'V9S6', 'V8S5', 'V8S3'], eliminate: ['V5S3≠3'],
  });
  assert.equal(koraki[0].message,
    'Celice V5S4 {1, 3} – V6S6 {1, 2} – V9S6 {2, 7} – V8S5 {2, 7} – V8S3 {2, 3} tvorijo XY-verigo: ' +
    'vsaka ima natanko dva kandidata, zaporedni celici se vidita in imata skupen kandidat. ' +
    'Če V5S4 ni 3, je 1 → V6S6 je 2 → V9S6 je 7 → V8S5 je 2 → V8S3 je 3. Vsaj eden od koncev ' +
    'V5S4 in V8S3 je torej 3 → 3 lahko izbrišeš iz celic, ki vidijo oba konca: V5S3.');
  assert.deepEqual(plain(koraki[0].assign), []);
  // Štiri verige do 8 celic (razdelek 2 načrta), druga je veriga šestih celic iz 34. koraka.
  assert.deepEqual(plain(koraki.map(k => k.cells.length)), [5, 6, 7, 8]);
  assert.deepEqual(plain(opis(koraki[1])), {
    cells: ['V5S2', 'V4S2', 'V8S2', 'V8S4', 'V8S9', 'V8S5'], eliminate: ['V5S5≠2'],
  });
});

test('na vseh pozicijah: koraki so natanko verige neodvisnega iskanja (4–8 celic) v istem vrstnem redu', () => {
  for (const [ime, poz] of POZICIJE) {
    const b = boardFromText(E, poz);
    assert.deepEqual(plain(E.xyChain(b).map(opis)), verigeNeodvisno(b, 4, 8), ime);
  }
  // Primer s krajšimi verigami in več izbrisi pred daljšimi (example-app: 4 celice, 2 izbrisa).
  const ex = E.xyChain(boardFromText(E, EXAMPLE_POS));
  assert.equal(ex.length, 15);
  assert.deepEqual(plain(opis(ex[0])), {
    cells: ['V1S7', 'V6S7', 'V8S7', 'V7S8'], eliminate: ['V2S8≠7', 'V7S7≠7'],
  });
});

test('XY-krilo (3 celice) ni korak verige', () => {
  const b = boardFromText(E, XYWING_POS);
  const trojice = verigeNeodvisno(b, 3, 3);
  // Pivot V2S8 {4, 9} s kriloma V1S9 {3, 9} in V2S2 {3, 4} izbriše 3 iz V1S3 (tests/xy-wing.test.js).
  assert.ok(trojice.some(v => v.cells.join() === 'V1S9,V2S8,V2S2' && v.eliminate.join() === 'V1S3≠3'));
  assert.ok(E.xyWing(b).length > 0);
  const koraki = E.xyChain(b);
  assert.ok(koraki.every(k => k.cells.length >= 4));
  assert.ok(!koraki.some(k => k.cells.length === 3));
});

test('veriga z devetimi celicami ni najdena (meja 8)', () => {
  const b = boardFromText(E, XY17_POS);
  const do11 = verigeNeodvisno(b, 4, 11);
  const dolge = do11.filter(v => v.cells.length > 8);
  // Neodvisno iskanje brez meje najde deset verig (5-11 celic), pet z devetimi.
  assert.equal(do11.length, 10);
  assert.equal(dolge.filter(v => v.cells.length === 9).length, 5);
  // Konca in števka z določajo verigo (za vsak tak trojček ena); nobena od dolgih ni korak.
  const kljuc = v => `${v.cells[0]}|${v.cells[v.cells.length - 1]}|${v.eliminate[0].split('≠')[1]}`;
  const najdene = new Set(E.xyChain(b).map(opis).map(kljuc));
  assert.equal(najdene.size, 4);
  for (const v of dolge) assert.ok(!najdene.has(kljuc(v)), `veriga ${kljuc(v)} ni korak`);
  assert.ok(E.xyChain(b).every(k => k.cells.length <= 8));
});

test('isto stanje da vedno iste korake; vrstni red po pravilu (dolžina, izbrisi, prva celica, z, zadnja)', () => {
  for (const [ime, poz] of POZICIJE) {
    const b = boardFromText(E, poz);
    const prvic = plain(E.xyChain(b));
    assert.deepEqual(plain(E.xyChain(b.clone())), prvic, ime);
    for (let i = 1; i < prvic.length; i++) {
      const p = prvic[i - 1], q = prvic[i];
      const kljuc = k => [k.cells.length, -k.eliminate.length, k.cells[0], k.eliminate[0][1], k.cells[k.cells.length - 1]];
      const [kp, kq] = [kljuc(p), kljuc(q)];
      const j = kp.findIndex((x, t) => x !== kq[t]);
      assert.ok(j >= 0 && kp[j] < kq[j], `${ime}: korak ${i} je za korakom ${i - 1}`);
    }
  }
});

test('besedilo koraka: veriga v vrstnem redu, sklep »če … potem«, pravila faze 6; namig', () => {
  for (const [ime, poz] of POZICIJE) {
    const b = boardFromText(E, poz);
    const kand = c => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => b.cand[c] & (1 << d));
    for (const k of E.xyChain(b)) {
      const z = k.eliminate[0][1];
      const celice = k.cells;
      assert.ok(k.eliminate.every(([, d]) => d === z), ime);
      const nastej = celice.map(c => `${L(c)} {${kand(c).join(', ')}}`).join(' – ');
      // Če prva ni z, je druga števka prve; vsaka naslednja je druga od prejšnje vrednosti.
      const vrednosti = [];
      let d = z;
      for (const c of celice) { d = kand(c).find(x => x !== d); vrednosti.push(d); }
      assert.equal(vrednosti[vrednosti.length - 1], z, `${ime}: zadnja celica je z`);
      const sklep = celice.slice(1).map((c, i) => `${L(c)} je ${vrednosti[i + 1]}`).join(' → ');
      assert.equal(k.message,
        `Celice ${nastej} tvorijo XY-verigo: vsaka ima natanko dva kandidata, zaporedni celici se vidita ` +
        `in imata skupen kandidat. Če ${L(celice[0])} ni ${z}, je ${vrednosti[0]} → ${sklep}. Vsaj eden od ` +
        `koncev ${L(celice[0])} in ${L(celice[celice.length - 1])} je torej ${z} → ${z} lahko izbrišeš iz ` +
        `celic, ki vidijo oba konca: ${E.cellsLabel(k.eliminate.map(e => e[0]))}.`);
      assert.doesNotMatch(k.message, /številk|XY-Chain| - |->|"/, ime);
      // Namig (O6): števka z in dolžina; besedilo namiga doda korak 4 načrta.
      assert.deepEqual(plain(k.hint), { digits: [z], celic: celice.length });
      assert.equal(typeof E.stepHint(k), 'string');
    }
  }
});

test('brez celic z dvema kandidatoma ni verige', () => {
  const b = boardFromText(E, XY17_POS);
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0) b.cand[c] |= 0b1110;
  assert.deepEqual(plain(E.xyChain(b)), []);
});
