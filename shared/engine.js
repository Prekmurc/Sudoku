/* ==================== MOTOR ZA REŠEVANJE (glej sudoku_resevalec.py za Python različico) ==================== */
'use strict';
/* Sudoku reševalec s pojasnili - JS različica (za brskalnik). */

const FULL = 0b1111111110; // biti 1..9

function popcount(x) {
  let n = 0;
  while (x) { x &= x - 1; n++; }
  return n;
}
function bitsOf(x) {
  const out = [];
  for (let d = 1; d <= 9; d++) if (x & (1 << d)) out.push(d);
  return out;
}
function onlyBit(x) { return bitsOf(x)[0]; }

function buildUnits() {
  const rows = [], cols = [], boxes = [];
  for (let r = 0; r < 9; r++) {
    const u = []; for (let c = 0; c < 9; c++) u.push(r * 9 + c);
    rows.push(u);
  }
  for (let c = 0; c < 9; c++) {
    const u = []; for (let r = 0; r < 9; r++) u.push(r * 9 + c);
    cols.push(u);
  }
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const u = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      u.push((br * 3 + r) * 9 + (bc * 3 + c));
    boxes.push(u);
  }
  return { rows, cols, boxes };
}

const { rows: ROWS, cols: COLS, boxes: BOXES } = buildUnits();
const ALL_UNITS = [...ROWS, ...COLS, ...BOXES];

const UNITS_OF = Array.from({ length: 81 }, () => []);
for (const u of ALL_UNITS) for (const c of u) UNITS_OF[c].push(u);

const PEERS = Array.from({ length: 81 }, (_, cell) => {
  const s = new Set();
  for (const u of UNITS_OF[cell]) for (const c of u) s.add(c);
  s.delete(cell);
  return s;
});

function boxOf(cell) {
  const r = Math.floor(cell / 9), c = cell % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

function rc(cell) { return [Math.floor(cell / 9) + 1, (cell % 9) + 1]; }
function cellLabel(cell) { const [r, c] = rc(cell); return `V${r}S${c}`; }
function cellsLabel(cells) {
  return [...cells].sort((a, b) => a - b).map(cellLabel).join(', ');
}

// Ime enote v mestniku ("v vrstici 3", "v stolpcu 4", "v bloku 5") - v sporočilih
// se enota vedno pojavi za predlogom "v".
function unitNameLoc(unit) {
  const r0 = Math.floor(unit[0] / 9);
  if (unit.every(c => Math.floor(c / 9) === r0)) return `vrstici ${r0 + 1}`;
  const c0 = unit[0] % 9;
  if (unit.every(c => c % 9 === c0)) return `stolpcu ${c0 + 1}`;
  return `bloku ${boxOf(unit[0]) + 1}`;
}

// Naštevanje številk enot: "2", "2 in 4", "2, 4 in 7".
function numsLabel(nums) {
  const a = [...nums].sort((x, y) => x - y);
  return a.length < 2 ? String(a[0]) : `${a.slice(0, -1).join(', ')} in ${a[a.length - 1]}`;
}

// Oblika besede po številu n (po zadnjih dveh mestih - 101 je kot 1): oblike
// [1, 2, 3-4, 0 in 5+], npr. sklanjaj(n, ['korak', 'koraka', 'koraki', 'korakov'])
// ali glagol sklanjaj(n, ['je', 'sta', 'so', 'je']). Skupno vsem trem aplikacijam.
function sklanjaj(n, [ena, dve, triStiri, pet]) {
  const m = n % 100;
  return m === 1 ? ena : m === 2 ? dve : m === 3 || m === 4 ? triStiri : pet;
}

// Naštevanje izbrisov po celicah: "V1S2 (2), V5S2 (4,7)". Uporabno pri tehnikah,
// kjer ista celica izgubi več kandidatov (Naked/Hidden par in trojica).
function elimLabel(elim) {
  const byCell = new Map();
  for (const [cell, d] of elim) {
    if (!byCell.has(cell)) byCell.set(cell, []);
    byCell.get(cell).push(d);
  }
  return [...byCell.keys()].sort((a, b) => a - b)
    .map(c => `${cellLabel(c)} (${byCell.get(c).sort((a, b) => a - b).join(', ')})`).join(', ');
}

class Board {
  constructor(givens) {
    this.grid = new Array(81).fill(0);
    this.cand = new Array(81).fill(FULL);
    for (let i = 0; i < 81; i++) {
      const ch = givens[i];
      if (ch !== '0' && ch !== '.') this.assign(i, parseInt(ch, 10));
    }
  }
  clone() {
    const b = Object.create(Board.prototype);
    b.grid = this.grid.slice();
    b.cand = this.cand.slice();
    return b;
  }
  isSolved() { return this.grid.every(v => v !== 0); }
  assign(cell, d) {
    this.grid[cell] = d;
    this.cand[cell] = 1 << d;
    for (const p of PEERS[cell]) {
      if (this.grid[p] === 0) this.cand[p] &= ~(1 << d);
    }
  }
  eliminate(cell, d) {
    const before = this.cand[cell];
    this.cand[cell] &= ~(1 << d);
    return this.cand[cell] !== before;
  }
  isValid() {
    for (let i = 0; i < 81; i++) if (this.grid[i] === 0 && this.cand[i] === 0) return false;
    for (const u of ALL_UNITS) {
      const seen = new Set();
      for (const c of u) {
        if (this.grid[c] !== 0) {
          if (seen.has(this.grid[c])) return false;
          seen.add(this.grid[c]);
        }
      }
    }
    return true;
  }
}

function combinations(arr, k) {
  const res = [];
  const n = arr.length;
  function rec(start, combo) {
    if (combo.length === k) { res.push(combo.slice()); return; }
    for (let i = start; i < n; i++) { combo.push(arr[i]); rec(i + 1, combo); combo.pop(); }
  }
  rec(0, []);
  return res;
}

/* ===================== TEHNIKE ===================== */

function nakedSingles(b) {
  const steps = [];
  for (let i = 0; i < 81; i++) {
    if (b.grid[i] === 0 && popcount(b.cand[i]) === 1) {
      const d = onlyBit(b.cand[i]);
      steps.push({
        technique: 'Gol enojček', cells: [i], assign: [[i, d]], eliminate: [],
        message: `${cellLabel(i)} ima samo še en mogoč kandidat (${d}) → ${cellLabel(i)} = ${d}.`
      });
    }
  }
  // hint: podatki za postopno pomoč v igri (glej stepHint) - tu število takih celic.
  for (const s of steps) s.hint = { count: steps.length };
  return steps;
}

function hiddenSingles(b) {
  const steps = [];
  for (const unit of ALL_UNITS) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      const spots = unit.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
      if (spots.length === 1) {
        const cell = spots[0];
        if (popcount(b.cand[cell]) > 1) {
          steps.push({
            technique: 'Skriti enojček', cells: [cell], assign: [[cell, d]], eliminate: [],
            // Samo enota: enota in števka skupaj že določita celico (odgovor).
            hint: { unit },
            message: `V ${unitNameLoc(unit)} je števka ${d} mogoča samo še v ${cellLabel(cell)} → ${cellLabel(cell)} = ${d}.`
          });
        }
      }
    }
  }
  return steps;
}

function pointing(b) {
  const steps = [];
  for (const box of BOXES) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      const spots = box.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
      if (spots.length < 2 || spots.length > 3) continue;
      const rowsSet = new Set(spots.map(s => Math.floor(s / 9)));
      const colsSet = new Set(spots.map(s => s % 9));
      let target = null;
      if (rowsSet.size === 1) target = ROWS[[...rowsSet][0]];
      else if (colsSet.size === 1) target = COLS[[...colsSet][0]];
      if (!target) continue;
      const elim = target.filter(c => !box.includes(c) && b.grid[c] === 0 && (b.cand[c] & bit)).map(c => [c, d]);
      if (elim.length) {
        steps.push({
          technique: 'Pointing pair/triple', cells: spots, assign: [], eliminate: elim,
          // Samo blok: blok in števka skupaj takoj pokažeta vzorec.
          hint: { unit: box },
          message: `V ${unitNameLoc(box)} je kandidat ${d} mogoč samo v ${cellsLabel(spots)}, ${spots.length === 2 ? 'ki obe ležita' : 'ki vse ležijo'} v ${unitNameLoc(target)} → ${d} lahko izbrišeš iz preostanka te enote zunaj bloka (${cellsLabel(elim.map(e => e[0]))}).`
        });
      }
    }
  }
  return steps;
}

function boxLineReduction(b) {
  const steps = [];
  for (const unit of [...ROWS, ...COLS]) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      const spots = unit.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
      if (spots.length < 2 || spots.length > 3) continue;
      const boxesSet = new Set(spots.map(boxOf));
      if (boxesSet.size !== 1) continue;
      const box = BOXES[[...boxesSet][0]];
      const elim = box.filter(c => !unit.includes(c) && b.grid[c] === 0 && (b.cand[c] & bit)).map(c => [c, d]);
      if (elim.length) {
        steps.push({
          technique: 'Box-line reduction', cells: spots, assign: [], eliminate: elim,
          // Samo enota: enota in števka skupaj takoj pokažeta vzorec.
          hint: { unit },
          message: `V ${unitNameLoc(unit)} je kandidat ${d} mogoč samo znotraj enega bloka (${cellsLabel(spots)}) → ${d} lahko izbrišeš iz preostanka tega bloka (${cellsLabel(elim.map(e => e[0]))}).`
        });
      }
    }
  }
  return steps;
}

function nakedSubsets(b, size, name) {
  const steps = [];
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => b.grid[c] === 0);
    const candidatesHere = empties.filter(c => { const n = popcount(b.cand[c]); return n >= 2 && n <= size; });
    for (const combo of combinations(candidatesHere, size)) {
      let union = 0;
      for (const c of combo) union |= b.cand[c];
      if (popcount(union) === size) {
        const elim = [];
        for (const c of empties) {
          if (combo.includes(c)) continue;
          for (const d of bitsOf(union)) if (b.cand[c] & (1 << d)) elim.push([c, d]);
        }
        if (elim.length) {
          steps.push({
            // unit: enota, v kateri je vzorec najden (referenca iz ALL_UNITS). Isti
            // celice so lahko veljaven vzorec v dveh enotah hkrati (npr. par v vrstici,
            // ki leži tudi v istem bloku), zato je enota del identitete koraka.
            technique: name, cells: combo.slice(), unit, assign: [], eliminate: elim,
            hint: { unit },
            message: `V ${unitNameLoc(unit)} ${size === 2 ? 'imata celici' : 'imajo celice'} ${cellsLabel(combo)} skupaj natanko ${size === 2 ? 'kandidata' : 'kandidate'} {${bitsOf(union).join(', ')}} (${size === 2 ? 'dve celici, dve števki' : 'tri celice, tri števke'}) → te števke lahko izbrišeš iz preostanka enote: ${elimLabel(elim)}.`
          });
        }
      }
    }
  }
  return steps;
}
const nakedPairs = b => nakedSubsets(b, 2, 'Naked pair');
const nakedTriples = b => nakedSubsets(b, 3, 'Naked triple');

function hiddenSubsets(b, size, name) {
  const steps = [];
  const digitsAll = [1,2,3,4,5,6,7,8,9];
  for (const unit of ALL_UNITS) {
    const empties = unit.filter(c => b.grid[c] === 0);
    for (const digits of combinations(digitsAll, size)) {
      let spots = new Set();
      let ok = true;
      for (const d of digits) {
        const bit = 1 << d;
        const where = empties.filter(c => b.cand[c] & bit);
        if (where.length === 0) { ok = false; break; }
        where.forEach(c => spots.add(c));
      }
      if (!ok || spots.size !== size) continue;
      const digitMask = digits.reduce((m, d) => m | (1 << d), 0);
      const elim = [];
      for (const c of spots) {
        for (const d of bitsOf(b.cand[c])) if (!(digitMask & (1 << d))) elim.push([c, d]);
      }
      if (elim.length) {
        steps.push({
          // unit: glej opombo pri nakedSubsets.
          technique: name, cells: [...spots], unit, assign: [], eliminate: elim,
          hint: { unit },
          message: `V ${unitNameLoc(unit)} ${size === 2 ? 'sta števki' : 'so števke'} {${digits.join(', ')}} ${size === 2 ? 'mogoči' : 'mogoče'} samo v celicah ${cellsLabel(spots)} → vse druge kandidate v teh celicah lahko izbrišeš: ${elimLabel(elim)}.`
        });
      }
    }
  }
  return steps;
}
const hiddenPairs = b => hiddenSubsets(b, 2, 'Hidden pair');
const hiddenTriples = b => hiddenSubsets(b, 3, 'Hidden triple');

function xWing(b) {
  const steps = [];
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << d;
    // baseName: mestnik množine ("v vrsticah 2 in 4"), crossName: rodilnik množine
    // ("iz preostanka stolpcev 5 in 8"); baseIndex/crossIndex dasta številko enote (0-based).
    for (const [baseUnits, crossUnits, baseName, crossName, baseIndex, crossIndex] of [
      [ROWS, COLS, 'vrsticah', 'stolpcev', c => Math.floor(c / 9), c => c % 9],
      [COLS, ROWS, 'stolpcih', 'vrstic', c => c % 9, c => Math.floor(c / 9)],
    ]) {
      const lines = [];
      for (const u of baseUnits) {
        const spots = u.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
        if (spots.length === 2) lines.push([u, spots]);
      }
      for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
        const [u1, s1] = lines[i], [u2, s2] = lines[j];
        const idx1 = new Set(s1.map(crossIndex));
        const idx2 = new Set(s2.map(crossIndex));
        if (idx1.size !== 2 || [...idx1].sort().join() !== [...idx2].sort().join()) continue;
        const elim = [];
        for (const idx of idx1) {
          const line = crossUnits[idx];
          for (const c of line) {
            if (s1.includes(c) || s2.includes(c)) continue;
            if (b.grid[c] === 0 && (b.cand[c] & bit)) elim.push([c, d]);
          }
        }
        if (elim.length) {
          steps.push({
            technique: 'X-Wing', cells: [...s1, ...s2], assign: [], eliminate: elim,
            // Števka in smer: naštete vrstice/stolpci bi takoj pokazali vzorec.
            hint: { digits: [d], lines: baseName, lineCount: 2 },
            message: `Kandidat ${d} je v ${baseName} ${numsLabel([u1, u2].map(u => baseIndex(u[0]) + 1))} mogoč samo v celicah ${cellsLabel([...s1, ...s2])} → tvori X-krilo. ${d} lahko izbrišeš iz preostanka ${crossName} ${numsLabel([...idx1].map(i => i + 1))}: ${cellsLabel(elim.map(e => e[0]))}.`
          });
        }
      }
    }
  }
  return steps;
}

function swordfish(b) {
  const steps = [];
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << d;
    for (const [baseUnits, crossUnits, baseName, crossName, baseIndex, crossIndex] of [
      [ROWS, COLS, 'vrsticah', 'stolpcev', c => Math.floor(c / 9), c => c % 9],
      [COLS, ROWS, 'stolpcih', 'vrstic', c => c % 9, c => Math.floor(c / 9)],
    ]) {
      const lines = [];
      for (const u of baseUnits) {
        const spots = u.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
        if (spots.length >= 2 && spots.length <= 3) lines.push([u, spots]);
      }
      for (const combo of combinations(lines, 3)) {
        const [[u1, s1], [u2, s2], [u3, s3]] = combo;
        const idxUnion = new Set([...s1, ...s2, ...s3].map(crossIndex));
        if (idxUnion.size !== 3) continue;
        const elim = [];
        for (const idx of idxUnion) {
          const line = crossUnits[idx];
          for (const c of line) {
            if (s1.includes(c) || s2.includes(c) || s3.includes(c)) continue;
            if (b.grid[c] === 0 && (b.cand[c] & bit)) elim.push([c, d]);
          }
        }
        if (elim.length) {
          steps.push({
            technique: 'Swordfish', cells: [...s1, ...s2, ...s3], assign: [], eliminate: elim,
            hint: { digits: [d], lines: baseName, lineCount: 3 },
            message: `Kandidat ${d} je v ${baseName} ${numsLabel([u1, u2, u3].map(u => baseIndex(u[0]) + 1))} mogoč samo v celicah ${cellsLabel([...s1, ...s2, ...s3])} → tvori mečarico. ${d} lahko izbrišeš iz preostanka ${crossName} ${numsLabel([...idxUnion].map(i => i + 1))}: ${cellsLabel(elim.map(e => e[0]))}.`
          });
        }
      }
    }
  }
  return steps;
}

// Turbot Fish: dve močni povezavi za isto številko d (vrstica ali stolpec, kjer je d
// mogoč v natanko dveh celicah), A-B in C-D, pri čemer se konca B in C vidita.
// Če B ni d, je d v A; če je B = d, C ni d in je d v D - vsaj ena od A, D je torej d,
// zato d izbrišemo iz celic, ki vidijo obe. Podtipi (glede na obliko):
//   Skyscraper - vzporedni povezavi (dve vrstici ali dva stolpca), B in C v isti liniji,
//   Two-String Kite (Zmaj z dvema vrvicama) - vrstica + stolpec, B in C v istem bloku,
//     A in D zunaj njega,
//   ostalo - splošni Turbot Fish.
// Močne povezave znotraj bloka niso vključene.
function turbotFish(b) {
  const steps = [];
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << d;
    const links = [];
    for (const [units, kind] of [[ROWS, 'row'], [COLS, 'col']]) {
      for (const u of units) {
        const spots = u.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
        if (spots.length === 2) links.push({ unit: u, kind, cells: spots });
      }
    }
    for (let i = 0; i < links.length; i++) for (let j = i + 1; j < links.length; j++) {
      const L1 = links[i], L2 = links[j];
      if (L1.cells.some(c => L2.cells.includes(c))) continue;
      for (const [bEnd, aEnd] of [[L1.cells[0], L1.cells[1]], [L1.cells[1], L1.cells[0]]]) {
        for (const [cEnd, dEnd] of [[L2.cells[0], L2.cells[1]], [L2.cells[1], L2.cells[0]]]) {
          if (!PEERS[bEnd].has(cEnd)) continue;
          const pattern = [aEnd, bEnd, cEnd, dEnd];
          const elim = [];
          for (let c = 0; c < 81; c++) {
            if (pattern.includes(c) || b.grid[c] !== 0 || !(b.cand[c] & bit)) continue;
            if (PEERS[aEnd].has(c) && PEERS[dEnd].has(c)) elim.push([c, d]);
          }
          if (!elim.length) continue;
          let variant = 'Turbot Fish';
          if (L1.kind === L2.kind) {
            const sameLine = L1.kind === 'row' ? bEnd % 9 === cEnd % 9
              : Math.floor(bEnd / 9) === Math.floor(cEnd / 9);
            if (sameLine) variant = 'Skyscraper';
          } else if (boxOf(bEnd) === boxOf(cEnd) && boxOf(aEnd) !== boxOf(bEnd) && boxOf(dEnd) !== boxOf(bEnd)) {
            variant = 'Two-String Kite';
          }
          const patternName = {
            'Skyscraper': 'vzorec Nebotičnik (Skyscraper, veriga ene števke)',
            'Two-String Kite': 'vzorec Zmaj z dvema vrvicama (2-String Kite, veriga ene števke)',
            'Turbot Fish': 'verigo ene števke (Turbot Fish)',
          }[variant];
          // Enota, ki povezuje B in C: prednost ima vrstica/stolpec (UNITS_OF je v
          // vrstnem redu vrstice, stolpci, bloki).
          const linkUnit = UNITS_OF[bEnd].find(u => u.includes(cEnd));
          const [bc1, bc2] = [bEnd, cEnd].sort((x, y) => x - y);
          steps.push({
            technique: 'Turbot Fish', variant, cells: pattern, assign: [], eliminate: elim,
            // Samo števka: enoti povezav bi takoj pokazali vzorec.
            hint: { digits: [d] },
            message: `Kandidat ${d} je v ${unitNameLoc(L1.unit)} mogoč samo v celicah ${cellsLabel(L1.cells)}, v ${unitNameLoc(L2.unit)} pa samo v celicah ${cellsLabel(L2.cells)}. Celici ${cellLabel(bc1)} in ${cellLabel(bc2)} ležita v ${unitNameLoc(linkUnit)}, zato je vsaj ena od celic ${cellsLabel([aEnd, dEnd])} enaka ${d} → tvori ${patternName}. ${d} lahko izbrišeš iz celic, ki vidijo obe: ${cellsLabel(elim.map(e => e[0]))}.`
          });
        }
      }
    }
  }
  return steps;
}

// W-Wing (v aplikaciji Oakever "Krilo W"): dve celici z natanko istim parom kandidatov
// {a,b}, ki se med sabo ne vidita, in močna povezava na b - enota, kjer je b mogoč samo
// v dveh celicah X in Y (nobena od njiju ni celica para), pri čemer X vidi prvo celico
// para, Y pa drugo. Če nobena od celic para ni a, sta obe b; potem X ni b (vidi prvo) in
// Y ni b (vidi drugo), pa bi enota ostala brez b - protislovje. Vsaj ena od celic para je
// torej a, zato a izbrišemo iz vseh celic, ki vidijo obe.
function wWing(b) {
  const steps = [];
  const pairs = new Map();
  for (let c = 0; c < 81; c++) {
    if (b.grid[c] === 0 && popcount(b.cand[c]) === 2) {
      if (!pairs.has(b.cand[c])) pairs.set(b.cand[c], []);
      pairs.get(b.cand[c]).push(c);
    }
  }
  for (const [mask, cells] of pairs) {
    const digits = bitsOf(mask);
    for (const [p1, p2] of combinations(cells, 2)) {
      if (PEERS[p1].has(p2)) continue;
      // Vlogi števk: ena je povezovalna (linkD, močna povezava), druga izbrisana (elimD).
      for (const [elimD, linkD] of [digits, [digits[1], digits[0]]]) {
        const bit = 1 << linkD;
        for (const unit of ALL_UNITS) {
          const spots = unit.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
          if (spots.length !== 2) continue;
          if (spots.includes(p1) || spots.includes(p2)) continue;
          let x = null, y = null; // x vidi p1, y vidi p2
          if (PEERS[spots[0]].has(p1) && PEERS[spots[1]].has(p2)) [x, y] = spots;
          else if (PEERS[spots[1]].has(p1) && PEERS[spots[0]].has(p2)) [x, y] = [spots[1], spots[0]];
          else continue;
          const elim = [];
          for (let c = 0; c < 81; c++) {
            if (c === p1 || c === p2 || b.grid[c] !== 0 || !(b.cand[c] & (1 << elimD))) continue;
            if (PEERS[p1].has(c) && PEERS[p2].has(c)) elim.push([c, elimD]);
          }
          if (!elim.length) continue;
          steps.push({
            technique: 'W-Wing', cells: [p1, p2, x, y], assign: [], eliminate: elim,
            hint: { digits },
            message: `Celici ${cellsLabel([p1, p2])} imata natanko kandidata {${digits.join(', ')}} in se ne vidita. V ${unitNameLoc(unit)} je kandidat ${linkD} mogoč samo v celicah ${cellsLabel([x, y])}, pri čemer ${cellLabel(x)} vidi ${cellLabel(p1)}, ${cellLabel(y)} pa ${cellLabel(p2)} → tvori W-krilo in vsaj ena od celic ${cellsLabel([p1, p2])} je enaka ${elimD}. ${elimD} lahko izbrišeš iz celic, ki vidijo obe: ${cellsLabel(elim.map(e => e[0]))}.`
          });
        }
      }
    }
  }
  return steps;
}

function xyWing(b) {
  const steps = [];
  const bivalue = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0 && popcount(b.cand[c]) === 2) bivalue.push(c);
  const bivalueSet = new Set(bivalue);
  for (const pivot of bivalue) {
    const [x, y] = bitsOf(b.cand[pivot]);
    const wings = [...PEERS[pivot]].filter(c => bivalueSet.has(c));
    for (const w1 of wings) {
      const s1 = b.cand[w1];
      let z1 = null;
      if ((s1 & (1 << x)) && !(s1 & (1 << y))) z1 = bitsOf(s1 & ~(1 << x))[0];
      else if ((s1 & (1 << y)) && !(s1 & (1 << x))) z1 = bitsOf(s1 & ~(1 << y))[0];
      else continue;
      const need = (s1 & (1 << x)) ? y : x;
      for (const w2 of wings) {
        if (w2 === w1) continue;
        const s2 = b.cand[w2];
        if ((s2 & (1 << need)) && (s2 & (1 << z1)) && popcount(s2) === 2 && s2 !== s1) {
          const z = z1;
          const common = [...PEERS[w1]].filter(c => PEERS[w2].has(c));
          const elim = common.filter(c => c !== pivot && c !== w1 && c !== w2 && b.grid[c] === 0 && (b.cand[c] & (1 << z))).map(c => [c, z]);
          if (elim.length) {
            steps.push({
              technique: 'XY-Wing', cells: [pivot, w1, w2], assign: [], eliminate: elim,
              hint: { digits: [x, y] },
              message: `Pivot ${cellLabel(pivot)} {${x}, ${y}} ima dve krili: ${cellLabel(w1)} in ${cellLabel(w2)}, ki obe delita kandidata ${z} → ${z} lahko izbrišeš iz celic, ki vidijo obe krili (${cellsLabel(elim.map(e => e[0]))}).`
            });
          }
        }
      }
    }
  }
  return steps;
}

function uniqueRectangle(b) {
  const steps = [];
  const pairs = new Map();
  for (let c = 0; c < 81; c++) {
    if (b.grid[c] === 0 && popcount(b.cand[c]) === 2) {
      const key = b.cand[c];
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(c);
    }
  }
  for (const [digitsMask, cells] of pairs) {
    if (cells.length < 3) continue;
    for (const trio of combinations(cells, 3)) {
      const rowsSet = new Set(trio.map(t => Math.floor(t / 9)));
      const colsSet = new Set(trio.map(t => t % 9));
      if (rowsSet.size !== 2 || colsSet.size !== 2) continue;
      const [r1, r2] = [...rowsSet];
      const [c1, c2] = [...colsSet];
      let fourth = null;
      for (const [rr, cc] of [[r1, c1], [r1, c2], [r2, c1], [r2, c2]]) {
        const cand = rr * 9 + cc;
        if (!trio.includes(cand)) fourth = cand;
      }
      if (fourth === null) continue;
      const boxesSet = new Set([...trio.map(boxOf), boxOf(fourth)]);
      if (boxesSet.size !== 2) continue;
      if (b.grid[fourth] !== 0) continue;
      if ((b.cand[fourth] & digitsMask) !== digitsMask) continue;
      if (popcount(b.cand[fourth]) === 2) continue;
      const elim = bitsOf(digitsMask).map(d => [fourth, d]);
      steps.push({
        technique: 'Unique Rectangle', cells: [...trio, fourth], assign: [], eliminate: elim,
        hint: { digits: bitsOf(digitsMask) },
        message: `Celice ${cellsLabel(trio)} imajo natanko kandidata {${bitsOf(digitsMask).join(', ')}}, ${cellLabel(fourth)} pa poleg njiju še dodatne. Če bi imela tudi ${cellLabel(fourth)} samo {${bitsOf(digitsMask).join(', ')}}, bi uganka imela dve rešitvi → ${numsLabel(bitsOf(digitsMask))} lahko izbrišeš iz ${cellLabel(fourth)}.`
      });
    }
  }
  return steps;
}

// XY-veriga (XY-Chain, docs/xy-veriga-nacrt.md): celice c1, c2, ..., cn, vsaka z natanko
// dvema kandidatoma; zaporedni celici se vidita in imata skupen kandidat, ki ju povezuje:
// c1 = {z, a}, c2 = {a, b}, ..., cn = {..., z}. Če c1 ni z, je a; potem c2 ni a, torej je
// b; ... in cn je z. Vsaj en konec je z, zato z izbrišemo iz celic, ki vidijo oba konca.
// Celica se v verigi ne ponovi. Od 4 celic naprej (3 celice so XY-Wing), največ 8 (daljše
// iskanje raste eksponentno, meritev v načrtu, odločitev O2).
// Za vsak par koncev in števko z ostane ena veriga: najkrajša, pri enaki dolžini
// leksikografsko najmanjše zaporedje celic. Veriga je zapisana od konca z nižjim
// položajem. Koraki so urejeni (O3): najkrajša, več izbrisov, prva celica, z, zadnja celica.
const XY_VERIGA_NAJMANJ = 4;
const XY_VERIGA_NAJVEC = 8;
function xyChain(b) {
  const bival = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0 && popcount(b.cand[c]) === 2) bival.push(c);
  if (bival.length < XY_VERIGA_NAJMANJ) return [];
  const sosedi = new Map();
  for (const c of bival) sosedi.set(c, bival.filter(p => p !== c && PEERS[c].has(p) && (b.cand[p] & b.cand[c])));
  const druga = (c, d) => onlyBit(b.cand[c] & ~(1 << d));
  const manjsa = (p, q) => { for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return p[i] < q[i]; return false; };
  const najdene = new Map(); // `${z}|${prvi}|${zadnji}` -> { celice, z }
  const zabelezi = (pot, z) => {
    const celice = pot[0] < pot[pot.length - 1] ? pot.slice() : pot.slice().reverse();
    const kljuc = `${z}|${celice[0]}|${celice[celice.length - 1]}`;
    const prej = najdene.get(kljuc);
    if (!prej || celice.length < prej.celice.length
      || (celice.length === prej.celice.length && manjsa(celice, prej.celice))) najdene.set(kljuc, { celice, z });
  };
  for (const s of bival) {
    for (const z of bitsOf(b.cand[s])) {
      const pot = [s];
      const v = new Uint8Array(81); v[s] = 1;
      // c je zadnja celica poti, e števka, ki jo mora c izločiti v naslednji celici
      const dfs = (c, e) => {
        if (pot.length >= XY_VERIGA_NAJVEC) return;
        for (const n of sosedi.get(c)) {
          if (v[n] || !(b.cand[n] & (1 << e))) continue;
          const naprej = druga(n, e);
          pot.push(n); v[n] = 1;
          if (naprej === z && pot.length >= XY_VERIGA_NAJMANJ) zabelezi(pot, z);
          dfs(n, naprej);
          pot.pop(); v[n] = 0;
        }
      };
      dfs(s, druga(s, z));
    }
  }
  const steps = [];
  for (const { celice, z } of najdene.values()) {
    const s = celice[0], n = celice[celice.length - 1];
    const elim = [];
    for (let c = 0; c < 81; c++) {
      if (c === s || c === n || b.grid[c] !== 0 || !(b.cand[c] & (1 << z))) continue;
      if (PEERS[s].has(c) && PEERS[n].has(c)) elim.push([c, z]);
    }
    if (!elim.length) continue;
    const opis = celice.map(c => `${cellLabel(c)} {${bitsOf(b.cand[c]).join(', ')}}`).join(' – ');
    // Če c1 ni z, je vsaka celica druga števka od tiste, ki jo je izločila prejšnja.
    const vrednosti = [];
    let d = z;
    for (const c of celice) { d = druga(c, d); vrednosti.push(d); }
    const sklep = celice.slice(1).map((c, i) => `${cellLabel(c)} je ${vrednosti[i + 1]}`);
    steps.push({
      // veriga: celice so v vrstnem redu verige - na mreži dobijo zaporedne številke (O4).
      technique: 'XY-Chain', cells: celice, assign: [], eliminate: elim, veriga: true,
      // Števka z in dolžina (O6); konca bi skoraj določila odgovor.
      hint: { digits: [z], celic: celice.length },
      message: `Celice ${opis} tvorijo XY-verigo: vsaka ima natanko dva kandidata, zaporedni celici se vidita in imata skupen kandidat. Če ${cellLabel(s)} ni ${z}, je ${vrednosti[0]} → ${sklep.join(' → ')}. Vsaj eden od koncev ${cellLabel(s)} in ${cellLabel(n)} je torej ${z} → ${z} lahko izbrišeš iz celic, ki vidijo oba konca: ${cellsLabel(elim.map(e => e[0]))}.`
    });
  }
  const zadnja = st => st.cells[st.cells.length - 1];
  steps.sort((p, q) => p.cells.length - q.cells.length || q.eliminate.length - p.eliminate.length
    || p.cells[0] - q.cells[0] || p.hint.digits[0] - q.hint.digits[0] || zadnja(p) - zadnja(q));
  return steps;
}

// Prikaz verige na mreži (O4, docs/xy-veriga-nacrt.md, razdelek 5): korak s poljem veriga ima
// v vsaki celici zaporedno številko 1…n (vrstni red korak.cells) na praznem mestu kandidata -
// celica verige ima dva kandidata, torej sedem praznih mest. Mesto 5, sicer prvo prosto po
// vrstnem redu spodaj. Isto pravilo v vseh treh izrisih mreže (app/app.js, shared/mreza.js,
// trening/trening.js). `zasedeno(d)` pove, ali je mesto d zasedeno (kandidat, prečrtan kandidat).
const MESTA_STEVILKE_VERIGE = [5, 8, 2, 4, 6, 1, 3, 7, 9];
function mestoStevilkeVerige(zasedeno) {
  return MESTA_STEVILKE_VERIGE.find(d => !zasedeno(d)) || 0;
}

const ALL_TECHNIQUES = [
  ['Gol enojček', nakedSingles],
  ['Skriti enojček', hiddenSingles],
  ['Pointing pair/triple', pointing],
  ['Box-line reduction', boxLineReduction],
  ['Naked pair', nakedPairs],
  ['Hidden pair', hiddenPairs],
  ['Naked triple', nakedTriples],
  ['Hidden triple', hiddenTriples],
  ['X-Wing', xWing],
  ['Swordfish', swordfish],
  ['Turbot Fish', turbotFish],
  ['W-Wing', wWing],
  ['XY-Wing', xyWing],
  ['Unique Rectangle', uniqueRectangle],
];

// Ravni tehnik (docs/faza7-nacrt.md, točka 1.1) - edini vir: stopnja uganke (GEN_LAHKE ...
// GEN_EKSPERTNE v shared/generator.js so te ravni), barva oznake koraka (tagClass()) in značka
// ravni v treningu in v oknu Pomoč. Ključi ALL_TECHNIQUES v vrstnem redu tehnik - vrstni red
// znotraj ravni šteje (genMerePoti() preizkuša napredne po vrsti, »prva, ki zadošča«). Nova
// tehnika gre v natanko eno raven (XY-veriga med ekspertne).
const RAVNI_TEHNIK = {
  lahka: ['Gol enojček', 'Skriti enojček'],                                                  // E1, E2
  srednja: ['Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'Hidden pair',
    'Naked triple', 'Hidden triple'],                                                        // 1-6
  napredna: ['X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle'], // 7-12
  ekspertna: [],                                                                             // 13 XY-veriga, ko bo v motorju
};
// Ključ ravni ('lahka', 'srednja', 'napredna', 'ekspertna') ali null (poskus s protislovjem,
// OBSTALO, NAPAKA, neznan ključ).
function ravenTehnike(kljuc) {
  for (const raven in RAVNI_TEHNIK) if (RAVNI_TEHNIK[raven].includes(kljuc)) return raven;
  return null;
}

// Skupine tehnik po težavnosti - samo za sidranje na številko (glej nextStep).
// So zaporedni odseki ALL_TECHNIQUES, zato vrstni red tehnik ostane nespremenjen:
// korak iz lažje skupine ima vedno prednost pred sidranim korakom iz težje, sidro
// pa odloča znotraj skupine. Tako reševalec dela tako kot človek - najprej naredi
// najlažje, šele nato nadaljuje z isto številko.
// Srednje tehnike (1-6 v TRENING_TEHNIKE) so razdeljene na tri skupine po vrsti
// vzorca: preseki, para, trojici. Indeksi 0 (enojčki), 1-3 (srednje) in 4 (napredne)
// so meje ravni (vsaka skupina je v eni ravni RAVNI_TEHNIK - tests/ravni-tehnik.test.js);
// stopnje ugank pa shared/generator.js računa iz ravni, ne iz teh skupin.
const TECHNIQUE_GROUPS = [
  ['Gol enojček', 'Skriti enojček'],
  ['Pointing pair/triple', 'Box-line reduction'],
  ['Naked pair', 'Hidden pair'],
  ['Naked triple', 'Hidden triple'],
  ['X-Wing', 'Swordfish', 'Turbot Fish', 'W-Wing', 'XY-Wing', 'Unique Rectangle'],
];
const TECHNIQUE_GROUP_OF = new Map();
TECHNIQUE_GROUPS.forEach((imena, i) => imena.forEach(ime => TECHNIQUE_GROUP_OF.set(ime, i)));
// Neznana tehnika (npr. dodana pozneje) šteje za najtežjo - sidro je pri njej brez moči.
function techniqueGroup(name) {
  const g = TECHNIQUE_GROUP_OF.get(name);
  return g === undefined ? TECHNIQUE_GROUPS.length : g;
}

// Tehnike s številkami: [oznaka kartice v trening/index.html (data-mode), ime v
// ALL_TECHNIQUES]. Številka tehnike je položaj v tem seznamu (1 = prvi) - trening po
// njem razvrsti in oštevilči kartice, igra in reševalec pa pri uganki izpišeta »Tehnike: E1,
// E2, 1 Izločitev izven bloka in 3 Očitni par« (zbirkaKratkoImeTehnike v shared/zbirka.js).
// Edino mesto teh številk. Vrstni red je
// ISTI kot v ALL_TECHNIQUES (brez enojčkov): znotraj ravni po zahtevnosti - srednje
// 1-6 po Sudoku Explainerju, napredne 7-12 po Sudoku Explainerju, Turbot Fish in
// W-Wing (SE ju ne ocenjuje) po točkah HoDoKu (docs/tehnike.md, odločitev 2026-09-24).
// Številke niso shranjene nikjer (zbirka in izvoz hranita imena), zato stari izvozi
// po preštevilčenju pokažejo nove številke.
// Enojčka sta v treningu z oznakama E1 in E2 (TRENING_ENOJCKA spodaj), poskusa s
// protislovjem v treningu ni (tests/trening-tehnike.test.js).
const TRENING_TEHNIKE = [
  ['pointing', 'Pointing pair/triple'],
  ['box-line', 'Box-line reduction'],
  ['naked-pair', 'Naked pair'],
  ['hidden-pair', 'Hidden pair'],
  ['naked-triple', 'Naked triple'],
  ['hidden-triple', 'Hidden triple'],
  ['x-wing', 'X-Wing'],
  ['swordfish', 'Swordfish'],
  ['turbot-fish', 'Turbot Fish'],
  ['w-wing', 'W-Wing'],
  ['xy-wing', 'XY-Wing'],
  ['unique-rectangle', 'Unique Rectangle'],
];

// Enojčka v treningu (raven lahke, docs/uskladitev.md 1.1): oznaki E1 in E2 namesto
// številke, zato nista v TRENING_TEHNIKE - številke 1-12 ostanejo brez enojčkov. Drugi element je ključ v ALL_TECHNIQUES kot pri
// TRENING_TEHNIKE; ime za prikaz da imeTehnike() ("Gol enojček" -> "Očitni enojček").
const TRENING_ENOJCKA = [
  ['naked-single', 'Gol enojček'],
  ['hidden-single', 'Skriti enojček'],
];

// Oznaka tehnike v treningu in v oknu Pomoč v igri: "E1", "E2" ali "1".."12".
function oznakaTehnike(kljuc) {
  const e = TRENING_ENOJCKA.findIndex(([k]) => k === kljuc);
  if (e >= 0) return 'E' + (e + 1);
  const i = TRENING_TEHNIKE.findIndex(([k]) => k === kljuc);
  return i >= 0 ? String(i + 1) : '';
}

// Opisi tehnik - edini vir teh besedil (trening in okno "Pomoč" v igri; docs/faza6-besedila.md):
// - ime: slovensko ime, anglesko: angleško ime (docs/uskladitev.md 1.3) - za prikaz
//   ju sestavi imeTehnike() ("Skriti par (Hidden Pair)" = naslov kartice v
//   trening/index.html),
// - povzetek: ena kratka poved - kartica v meniju treninga in besedilo pod nalogo
//   (trening/index.html ima nadomestek, enak polju; izpolni ga trening.js),
// - razlaga: kako vzorec prepoznaš,
// - posledica: kaj izbrišeš (pri enojčkih vpišeš) in zakaj,
// - navodilo: kaj izbereš v vaji "Spoznaj".
// Razlaga in posledica sta v treningu v zložljivem razdelku "Razlaga" pod nalogo, v igri v
// oknu Pomoč (opisTehnike()); pod nalogo je povzetek z navodilom (opisVaje()).
// Pravila besedil (faza 6): glagol "izbriši" (ne "odstrani", "izloči"), druga oseba ednine,
// števila z besedo, pari v zavitih oklepajih {x, y}, "enota" in "vidi" razložena ob prvi
// omembi. Izraz je povsod "števka" (glej razpredelnico izrazov v CLAUDE.md).
const TEHNIKE_OPISI = {
  'naked-single': {
    ime: 'Očitni enojček',
    anglesko: 'Naked Single',
    povzetek: 'Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.',
    razlaga: 'Za prazno celico preglej njeno vrstico, stolpec in blok. Če je v njih skupaj vpisanih osem različnih števk, je v celici mogoča samo še deveta.',
    posledica: 'To števko vpišeš v celico, ker nobena druga tam ni mogoča. Če imaš zapisane kandidate, je to celica z enim samim kandidatom.',
    navodilo: 'Izberi celico in nato števko, ki jo vpišeš.',
  },
  'hidden-single': {
    ime: 'Skriti enojček',
    anglesko: 'Hidden Single',
    povzetek: 'Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.',
    razlaga: 'Poglej vrstico, stolpec ali blok – vsak od njih je enota – in števko, ki v enoti še ni vpisana. Za vsako prazno celico enote preveri, ali je ta števka že v vrstici, stolpcu ali bloku celice. Če ostane ena sama celica, kjer je števka mogoča, si našel skriti enojček.',
    posledica: 'Števko vpišeš v to celico: v enoti mora biti, drugje pa ne more. Druge števke, ki bi bile v celici sicer mogoče, tam zato ne morejo biti.',
    navodilo: 'Izberi celico in nato števko, ki jo vpišeš.',
  },
  'naked-pair': {
    ime: 'Očitni par',
    anglesko: 'Naked Pair',
    povzetek: 'Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka.',
    razlaga: 'Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve celici, ki imata natanko ista dva kandidata {x, y} in nobenega drugega.',
    posledica: 'V eni celici bo x, v drugi y – drugih možnosti nimata. Zato x in y v enoti ne moreta biti nikjer drugje: iz vseh drugih celic enote ju izbrišeš.',
    navodilo: 'Izberi obe celici para.',
  },
  'hidden-pair': {
    ime: 'Skriti par',
    anglesko: 'Hidden Pair',
    povzetek: 'Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate.',
    razlaga: 'Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve števki, ki sta mogoči samo v istih dveh celicah. V teh celicah so lahko še drugi kandidati, zato se par na prvi pogled ne vidi – je skrit.',
    posledica: 'Obe števki morata biti v enoti, mogoči pa sta samo v teh dveh celicah – torej ju zasedeta. Za druge števke v teh dveh celicah ni prostora: iz obeh celic izbrišeš vse druge kandidate.',
    navodilo: 'Izberi obe celici, nato še obe števki para.',
  },
  'pointing': {
    ime: 'Izločitev izven bloka',
    anglesko: 'Pointing Pair/Triple',
    povzetek: 'Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka.',
    razlaga: 'Poglej blok in v njem eno števko. Če ležijo vse celice bloka, kjer je ta števka še kandidat, v isti vrstici (ali v istem stolpcu), si našel vzorec – dve ali tri celice. Smer: iz bloka v vrstico.',
    posledica: 'V bloku mora biti števka v eni od teh celic, torej v tej vrstici. Zato v vrstici zunaj bloka ne more biti – tam jo izbrišeš. Pri stolpcu enako.',
    navodilo: 'Izberi celice vzorca – dve ali tri.',
  },
  'box-line': {
    ime: 'Izločitev v bloku',
    anglesko: 'Box-Line Reduction',
    povzetek: 'Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka.',
    razlaga: 'Poglej vrstico (ali stolpec) in v njej eno števko. Če ležijo vse celice vrstice, kjer je ta števka še kandidat, v istem bloku, si našel vzorec – dve ali tri celice. Smer: iz vrstice v blok.',
    posledica: 'V vrstici mora biti števka v eni od teh celic, torej v tem bloku. Zato drugje v bloku ne more biti – iz celic bloka zunaj vrstice jo izbrišeš. Pri stolpcu enako.',
    navodilo: 'Izberi celice vzorca – dve ali tri.',
  },
  'naked-triple': {
    ime: 'Očitna trojica',
    anglesko: 'Naked Triple',
    povzetek: 'Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka.',
    razlaga: 'Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri celice, ki imajo skupaj samo tri različne kandidate {x, y, z}. Posamezna celica ima lahko vse tri ali samo dva od njih, npr. {x, y}, {y, z} in {x, z}.',
    posledica: 'Tri celice potrebujejo tri različne števke, na voljo pa imajo samo x, y in z – torej jih zasedejo. Zato teh treh števk v enoti ni nikjer drugje: iz vseh drugih celic enote jih izbrišeš.',
    navodilo: 'Izberi vse tri celice trojice.',
  },
  'hidden-triple': {
    ime: 'Skrita trojica',
    anglesko: 'Hidden Triple',
    povzetek: 'Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate.',
    razlaga: 'Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri števke, ki so mogoče samo v istih treh celicah. Posamezna števka je lahko mogoča tudi samo v dveh od teh celic, v celicah pa so lahko še drugi kandidati – zato je trojica skrita.',
    posledica: 'Vse tri števke morajo biti v enoti, mogoče pa so samo v teh treh celicah – torej jih zasedejo. Za druge števke v njih ni prostora: iz teh treh celic izbrišeš vse druge kandidate.',
    navodilo: 'Izberi vse tri celice, nato še vse tri števke trojice.',
  },
  'x-wing': {
    ime: 'X-krilo',
    anglesko: 'X-Wing',
    povzetek: 'Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci).',
    razlaga: 'Poišči dve vrstici, v katerih je števka mogoča samo v dveh celicah – v obeh vrsticah v istih dveh stolpcih. Te štiri celice so vogali pravokotnika. Enako deluje z zamenjanimi vlogami: dva stolpca, v katerih je števka mogoča samo v istih dveh vrsticah.',
    posledica: 'V vsaki od obeh vrstic mora biti števka v enem od dveh vogalov. V istem stolpcu ne moreta biti obe, zato je ena v prvem, druga v drugem stolpcu – oba stolpca imata števko že v vogalih. Iz vseh drugih celic obeh stolpcev jo izbrišeš. Pri dveh stolpcih (vlogi zamenjani) jo enako izbrišeš iz obeh vrstic zunaj vogalov.',
    navodilo: 'Izberi vse štiri vogale.',
  },
  'swordfish': {
    ime: 'Mečarica',
    anglesko: 'Swordfish',
    povzetek: 'Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah.',
    razlaga: 'Poišči tri vrstice, v katerih je števka mogoča samo v istih treh stolpcih. V posamezni vrstici je lahko mogoča v vseh treh ali samo v dveh od teh stolpcev. Enako deluje z zamenjanimi vlogami: trije stolpci, v katerih je števka mogoča samo v istih treh vrsticah.',
    posledica: 'V vsaki od treh vrstic mora biti števka v enem od teh treh stolpcev, in to vsakič v drugem – torej ima vsak od treh stolpcev števko že v vzorcu. Iz vseh drugih celic teh treh stolpcev jo izbrišeš. Pri treh stolpcih (vlogi zamenjani) jo enako izbrišeš iz treh vrstic zunaj vzorca.',
    navodilo: 'Izberi vse celice vzorca.',
  },
  'turbot-fish': {
    ime: 'Veriga ene števke',
    anglesko: 'Turbot Fish',
    povzetek: 'Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.)',
    razlaga: 'Za eno števko poišči dve povezavi. Povezava je vrstica ali stolpec, v katerem je števka mogoča samo v dveh celicah – to sta konca povezave. Povezavi sta lahko dve vrstici, dva stolpca ali vrstica in stolpec. En konec prve povezave mora videti en konec druge: celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Če sta povezavi dve vrstici (ali dva stolpca) in sta konca, ki se vidita, v istem stolpcu (ali vrstici), je to Nebotičnik (Skyscraper). Če sta povezavi vrstica in stolpec in sta konca, ki se vidita, v istem bloku, je to Zmaj z dvema vrvicama (2-String Kite).',
    posledica: 'Konca, ki se vidita, ne moreta imeti števke oba. Če je ni na enem od njiju, je na drugem koncu njegove povezave – zato je števka vsaj na enem od preostalih dveh koncev. Iz celic, ki vidijo oba ta konca, jo izbrišeš.',
    navodilo: 'Števka je označena. Izberi vse štiri konce obeh povezav.',
  },
  'w-wing': {
    ime: 'W-krilo',
    anglesko: 'W-Wing',
    povzetek: 'Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para.',
    razlaga: 'Poišči dve celici z natanko istima kandidatoma {a, b}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je b mogoč samo v dveh celicah, ki nista celici para. To je povezava: ena njena celica mora videti prvo celico para, druga drugo.',
    posledica: 'Celici para ne moreta biti obe b: obe celici povezave bi takrat videli b in v povezavi b ne bi bil mogoč nikjer. Torej je vsaj v eni celici para a. Iz vseh celic, ki vidijo obe celici para, a izbrišeš.',
    navodilo: 'Izberi obe celici para in obe celici povezave (štiri celice).',
  },
  'xy-wing': {
    ime: 'XY-krilo',
    anglesko: 'XY-Wing, Y-Wing',
    povzetek: 'Pivot (osrednja celica) {x, y} vidi krili {x, z} in {y, z} – z izbrišeš iz celic, ki vidijo obe krili.',
    razlaga: 'Poišči pivot (osrednjo celico) z natanko dvema kandidatoma {x, y}. Nato poišči dve krili – celici z natanko dvema kandidatoma, ki ju pivot vidi (sta z njim v isti vrstici, stolpcu ali bloku): eno krilo ima {x, z}, drugo {y, z}. Krili si delita števko z, ki je pivot nima.',
    posledica: 'Če je v pivotu x, krilo {x, z} ne more biti x, zato je z. Če je v pivotu y, je z v krilu {y, z}. V enem od kril je torej z – iz vseh celic, ki vidijo obe krili, z izbrišeš.',
    navodilo: 'Izberi pivot in obe krili (tri celice).',
  },
  'unique-rectangle': {
    ime: 'Edinstveni pravokotnik',
    anglesko: 'Unique Rectangle',
    povzetek: 'Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi.',
    razlaga: 'Poišči štiri celice, ki so vogali pravokotnika: ležijo v dveh vrsticah in dveh stolpcih, vse skupaj pa v natanko dveh blokih. Trije vogali imajo natanko ista kandidata {x, y}, četrti pa ima poleg x in y še vsaj enega kandidata.',
    posledica: 'Če bi bila v četrtem vogalu x ali y, bi v vseh štirih vogalih ostala samo x in y. Potem bi ju lahko po vogalih zamenjal in dobil drugo rešitev, uganka pa ima natanko eno. Zato četrti vogal ne more biti ne x ne y – oba izbrišeš iz njega.',
    navodilo: 'Izberi vse štiri vogale pravokotnika.',
  },
};

// Ime tehnike za prikaz iz ključa v ALL_TECHNIQUES (tudi iz dnevnika solve() in
// zbirke) - edini vir imen, ki jih vidi uporabnik (docs/faza4-nacrt.md, del 1):
// - privzeto "Skriti par (Hidden Pair)" (naslov kartice v treningu),
// - { stevilka: true } "4 · Skriti par (Hidden Pair)", "E1 · Očitni enojček (...)",
// - { anglesko: false } brez oklepaja ("4 · Skriti par" - oznaka koraka).
// Poskus s protislovjem (ključ se začne s "Poskus in protislovje", stari zapisi imajo
// za njim še celico) je vedno brez številke. Neznan ključ (OBSTALO, NAPAKA, tehnika,
// ki je ni več) vrne nespremenjenega.
const POSKUS_KLJUC = 'Poskus in protislovje';
function imeTehnike(kljuc, { stevilka = false, anglesko = true } = {}) {
  if (typeof kljuc === 'string' && kljuc.startsWith(POSKUS_KLJUC)) {
    return anglesko ? POSKUS_KLJUC + ' (Trial and Error)' : POSKUS_KLJUC;
  }
  const par = [...TRENING_ENOJCKA, ...TRENING_TEHNIKE].find(([, k]) => k === kljuc);
  if (!par) return kljuc;
  const o = TEHNIKE_OPISI[par[0]];
  const ime = anglesko ? `${o.ime} (${o.anglesko})` : o.ime;
  return stevilka ? `${oznakaTehnike(par[0])} · ${ime}` : ime;
}

// Položaj tehnike za urejanje seznamov (povzetek v reševalcu, tehnike v zbirki):
// vrstni red ALL_TECHNIQUES, za njimi poskus s protislovjem, na koncu neznane.
function redTehnike(kljuc) {
  const i = ALL_TECHNIQUES.findIndex(([k]) => k === kljuc);
  if (i >= 0) return i;
  if (typeof kljuc === 'string' && kljuc.startsWith(POSKUS_KLJUC)) return ALL_TECHNIQUES.length;
  return ALL_TECHNIQUES.length + 1;
}

// Besedilo pod nalogo v treningu (povzetek + navodilo) in razlaga tehnike (razlaga +
// posledica) - razdelek "Razlaga" v treningu in okno Pomoč v igri.
function opisVaje(kljuc) {
  const o = TEHNIKE_OPISI[kljuc];
  return [o.povzetek, o.navodilo].filter(Boolean).join(' ');
}
function opisTehnike(kljuc) {
  const o = TEHNIKE_OPISI[kljuc];
  return [o.razlaga, o.posledica].filter(Boolean).join(' ');
}

// Skupina tehnike za barvo oznake v prikazu koraka (CSS razredi .tag.t-* v
// shared/base.css) iz ravni (RAVNI_TEHNIK): lahka t-single, srednja t-pair, napredna
// t-advanced, ekspertna t-expert (turkizna); poskus s protislovjem t-chain, drugo (OBSTALO,
// NAPAKA, neznan ključ) t-basic.
const RAZRED_RAVNI = { lahka: 't-single', srednja: 't-pair', napredna: 't-advanced', ekspertna: 't-expert' };
function tagClass(tech) {
  if (typeof tech === 'string' && tech.startsWith(POSKUS_KLJUC)) return 't-chain';
  return RAZRED_RAVNI[ravenTehnike(tech)] || 't-basic';
}

// Namig za drugo stopnjo postopne pomoči v igri (prva je samo ime tehnike, tretja
// razlaga) iz polja step.hint. Namig ne sme skoraj določiti odgovora: kjer bi ga
// enota in števka skupaj (skriti enojček, Pointing, Box-line), pove samo enoto;
// pri X-Wing in Swordfish samo števko in smer, pri Turbot Fish samo števko
// (naštete enote bi takoj pokazale vzorec). null = tehnika nima namiga in se
// pokaže takoj v celoti (poskus in protislovje).
function stepHint(step) {
  const h = step.hint;
  if (!h) return null;
  if (h.count !== undefined) {
    const n = h.count;
    return `V mreži ${sklanjaj(n, ['je', 'sta', 'so', 'je'])} ${n} ${sklanjaj(n, ['celica', 'celici', 'celice', 'celic'])} z enim samim kandidatom.`;
  }
  if (h.unit) return `V ${unitNameLoc(h.unit)}.`;
  const stevke = numsLabel(h.digits);
  const par = `{${[...h.digits].sort((a, b) => a - b).join(', ')}}`;
  if (step.technique === 'XY-Wing') return `Pivot ima kandidata ${par}.`;
  if (step.technique === 'W-Wing') return `Celici para imata kandidata ${par}.`;
  if (step.technique === 'Unique Rectangle') return `Pravokotnik tvori par ${par}.`;
  if (h.lines) return `Števka ${stevke}, v ${h.lineCount === 2 ? 'dveh' : 'treh'} ${h.lines}.`;
  return `Števka ${stevke}.`;
}

/* ===================== BIFURKACIJA (forcing chain) ===================== */

function applyStep(b, step) {
  for (const [cell, d] of step.assign) b.assign(cell, d);
  for (const [cell, d] of step.eliminate) b.eliminate(cell, d);
}

function fastPropagate(b) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < 81; i++) {
      if (b.grid[i] === 0) {
        const n = popcount(b.cand[i]);
        if (n === 0) return false;
        if (n === 1) { b.assign(i, onlyBit(b.cand[i])); changed = true; }
      }
    }
    for (const unit of ALL_UNITS) {
      const placed = new Set(unit.filter(c => b.grid[c] !== 0).map(c => b.grid[c]));
      for (let d = 1; d <= 9; d++) {
        if (placed.has(d)) continue;
        const bit = 1 << d;
        const spots = unit.filter(c => b.grid[c] === 0 && (b.cand[c] & bit));
        if (spots.length === 0) return false;
        if (spots.length === 1 && popcount(b.cand[spots[0]]) > 1) {
          b.assign(spots[0], d); changed = true;
        }
      }
    }
  }
  return true;
}

function hasSolution(b, budget) {
  if (budget[0] <= 0) return true;
  budget[0]--;
  if (!fastPropagate(b)) return false;
  if (b.isSolved()) return true;
  const empties = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0) empties.push(c);
  empties.sort((a, c) => popcount(b.cand[a]) - popcount(b.cand[c]));
  const cell = empties[0];
  for (const d of bitsOf(b.cand[cell])) {
    const branch = b.clone();
    branch.assign(cell, d);
    if (hasSolution(branch, budget)) return true;
  }
  return false;
}

function tryBifurcation(b, budgetPerTry = 20000) {
  const empties = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0) empties.push(c);
  empties.sort((a, c) => popcount(b.cand[a]) - popcount(b.cand[c]));
  for (const cell of empties) {
    for (const d of bitsOf(b.cand[cell])) {
      const trial = b.clone();
      trial.assign(cell, d);
      const budget = [budgetPerTry];
      if (!hasSolution(trial, budget)) {
        return {
          technique: 'Poskus in protislovje (forcing chain)', cells: [cell], assign: [], eliminate: [[cell, d]],
          message: `Če bi ${cellLabel(cell)} = ${d}, iz tega po verigi sklepanj ne obstaja nobena veljavna rešitev (pride do protislovja) → ${d} v ${cellLabel(cell)} ni mogoč in ga izbrišeš.`
        };
      }
    }
  }
  return null;
}

/* ===================== ŠTETJE REŠITEV (preverjanje enoličnosti) ===================== */

// Prešteje rešitve dane uganke (z backtrackingom + propagacijo), a se ustavi
// takoj, ko najde `limit` rešitev - za vprašanje "ali je rešitev natanko ena"
// ni treba iskati dlje. `attemptBudget` je varovalo proti predolgemu iskanju
// pri patoloških mrežah: če se izčrpa, preden je iskanje končano ali preden
// je najdenih `limit` rešitev, dejanskega števila ni mogoče zanesljivo
// določiti in funkcija vrne niz 'unknown'.
function countSolutionsRec(b, limit, budget, counter) {
  if (counter.count >= limit) return;
  if (budget[0] <= 0) { counter.unknown = true; return; }
  budget[0]--;
  if (!fastPropagate(b)) return; // protislovje na tej veji -> 0 rešitev od tu naprej
  if (b.isSolved()) { counter.count++; return; }
  const empties = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0) empties.push(c);
  empties.sort((a, c) => popcount(b.cand[a]) - popcount(b.cand[c]));
  const cell = empties[0];
  for (const d of bitsOf(b.cand[cell])) {
    if (counter.count >= limit || counter.unknown) return;
    const branch = b.clone();
    branch.assign(cell, d);
    countSolutionsRec(branch, limit, budget, counter);
  }
}

// Vrne 0, 1 ali `limit` (kar pomeni "limit ali več") najdenih rešitev za
// dane začetne danosti (`givens`), ali niz 'unknown', če varovalo prekine
// iskanje, preden je odgovor zanesljivo znan.
function countSolutions(givens, limit = 2, attemptBudget = 50000) {
  const b = new Board(givens);
  if (!b.isValid()) return 0; // takojšnje protislovje med samimi danostmi
  const counter = { count: 0, unknown: false };
  countSolutionsRec(b, limit, [attemptBudget], counter);
  if (counter.unknown && counter.count < limit) return 'unknown';
  return counter.count;
}

// Vzrok, zakaj uganke ni mogoče igrati, iz rezultata countSolutions(): '' pri eni
// rešitvi (in brez rezultata), sicer del povedi za igro (»Te uganke ni mogoče igrati:
// nima rešitve.«, vrstica ocene »· ima več kot eno rešitev«). Reševalec ima svoja
// sporočila (rešitev kljub temu prikaže).
function opisSteviloResitev(n) {
  if (n === 1 || n === undefined) return '';
  if (n === 0) return 'nima rešitve';
  if (n === 'unknown') return 'enoličnosti ni bilo mogoče preveriti v razumnem času';
  return 'ima več kot eno rešitev';
}

// Rešitev uganke kot polje 81 števk ali null, če je nima (ali če varovalo
// prekine iskanje). Pri uganki z več rešitvami vrne prvo najdeno - enoličnost
// preveri countSolutions().
function solutionOf(givens, attemptBudget = 50000) {
  const budget = [attemptBudget];
  const rec = (b) => {
    if (budget[0] <= 0) return null;
    budget[0]--;
    if (!fastPropagate(b)) return null;
    if (b.isSolved()) return b.grid.slice();
    const empties = [];
    for (let c = 0; c < 81; c++) if (b.grid[c] === 0) empties.push(c);
    empties.sort((a, c) => popcount(b.cand[a]) - popcount(b.cand[c]));
    const cell = empties[0];
    for (const d of bitsOf(b.cand[cell])) {
      const branch = b.clone();
      branch.assign(cell, d);
      const res = rec(branch);
      if (res) return res;
    }
    return null;
  };
  const b = new Board(givens);
  return b.isValid() ? rec(b) : null;
}

function digitsOfStep(step) {
  const ds = new Set();
  for (const [, d] of step.assign) ds.add(d);
  for (const [, d] of step.eliminate) ds.add(d);
  return ds;
}

// En naslednji korak na deski `b` (deske ne spremeni) ali null. Tehnike se
// preizkušajo po vrstnem redu v `techniques`, na koncu tryBifurcation().
// `focusDigit` da prednost korakom s to številko, na dva načina:
//   acrossGroups = false (privzeto, "sidro"): prednost velja samo znotraj
//     NAJLAŽJE skupine tehnik, ki sploh kaj najde (TECHNIQUE_GROUPS) - korak iz
//     lažje skupine je vedno pred sidranim korakom iz težje. Tako dela človek:
//     najprej najlažje, šele nato nadaljuje z isto številko. Tako se "usidra"
//     solve() in igra, kadar igralec ni poudaril nobene števke.
//   acrossGroups = true ("poudarek"): prednost prebije skupine - gremo skozi vse
//     tehnike in vzamemo prvi korak s to številko. To je izrecna izbira igralca
//     v igri (niz "Poudari"): ko poudari števko, hoče korak z njo.
// Znotraj skupine prednost prevlada nad vrstnim redom tehnik; brez številke (ali
// če koraka z njo ni) velja običajna prioriteta.
function nextStep(b, techniques = ALL_TECHNIQUES, focusDigit = null, acrossGroups = false) {
  if (focusDigit !== null && acrossGroups) {
    for (const [, fn] of techniques) {
      const steps = fn(b).filter(s => digitsOfStep(s).has(focusDigit));
      if (steps.length) return steps[0];
    }
  }
  let found = null;       // prvi korak po običajni prioriteti
  let foundGroup = null;  // njegova skupina - dlje od nje ne gremo
  for (const [name, fn] of techniques) {
    const group = techniqueGroup(name);
    if (found !== null && group !== foundGroup) break;
    const steps = fn(b);
    if (!steps.length) continue;
    if (focusDigit !== null) {
      const sidran = steps.find(s => digitsOfStep(s).has(focusDigit));
      if (sidran) return sidran;
    }
    if (found === null) { found = steps[0]; foundGroup = group; }
  }
  return found !== null ? found : tryBifurcation(b);
}

function solve(givens, maxSteps = 500) {
  const b = new Board(givens);
  const log = [];
  let focusDigit = null;

  // Enoličnost se preveri ENKRAT na uganko, na vnesenih danostih (`givens`),
  // ne pri vsakem koraku in ne na mreži, ki se med reševanjem spreminja.
  // Unique Rectangle sklepa "če bi bilo tudi tu ..., bi uganka imela dve
  // rešitvi" - ta sklep drži samo, če ima uganka dejansko natanko eno
  // rešitev, zato jo pri vsem drugem izpustimo.
  const solutionCount = countSolutions(givens, 2);
  const techniques = solutionCount === 1
    ? ALL_TECHNIQUES
    : ALL_TECHNIQUES.filter(([name]) => name !== 'Unique Rectangle');

  for (let iter = 0; iter < maxSteps; iter++) {
    if (b.isSolved()) break;
    const found = nextStep(b, techniques, focusDigit);

    // Če za trenutno številko ni bilo več nič najti, je korak z drugo
    // številko (karkoli je na vrsti po običajni prioriteti) - "usidramo" se
    // na novo številko naprej.
    if (found && (focusDigit === null || !digitsOfStep(found).has(focusDigit))) {
      const ds = [...digitsOfStep(found)];
      focusDigit = ds.length ? Math.min(...ds) : null;
    }

    if (!found) {
      log.push({ technique: 'OBSTALO', cells: [], assign: [], eliminate: [], message: 'Noben znan korak ne najde ničesar.' });
      break;
    }
    // Posnetek stanja TIK PRED izvedbo koraka - potreben za grafični prikaz
    // (kandidati, ki so v tistem trenutku dejansko obstajali).
    found.snapshotGrid = b.grid.slice();
    found.snapshotCand = b.cand.slice();
    applyStep(b, found);
    found.focusDigit = focusDigit;
    log.push(found);
    if (!b.isValid()) {
      log.push({ technique: 'NAPAKA', cells: [], assign: [], eliminate: [], message: 'Zaznano protislovje po tem koraku.' });
      break;
    }
  }
  return { board: b, log, solutionCount };
}

