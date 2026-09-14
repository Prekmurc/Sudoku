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

// Naštevanje izbrisov po celicah: "V1S2 (2), V5S2 (4,7)". Uporabno pri tehnikah,
// kjer ista celica izgubi več kandidatov (Naked/Hidden par in trojica).
function elimLabel(elim) {
  const byCell = new Map();
  for (const [cell, d] of elim) {
    if (!byCell.has(cell)) byCell.set(cell, []);
    byCell.get(cell).push(d);
  }
  return [...byCell.keys()].sort((a, b) => a - b)
    .map(c => `${cellLabel(c)} (${byCell.get(c).sort((a, b) => a - b).join(',')})`).join(', ');
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
        message: `${cellLabel(i)} ima samo še en možen kandidat (${d}) -> ${cellLabel(i)} = ${d}.`
      });
    }
  }
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
            message: `V ${unitNameLoc(unit)} je številka ${d} možna samo še v ${cellLabel(cell)} -> ${cellLabel(cell)} = ${d}.`
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
          message: `V ${unitNameLoc(box)} je kandidat ${d} možen samo v ${cellsLabel(spots)}, ${spots.length === 2 ? 'ki obe ležita' : 'ki vse ležijo'} v ${unitNameLoc(target)} -> ${d} lahko izbrišemo iz preostanka te enote zunaj bloka (${cellsLabel(elim.map(e => e[0]))}).`
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
          message: `V ${unitNameLoc(unit)} je kandidat ${d} možen samo znotraj enega bloka (${cellsLabel(spots)}) -> ${d} lahko izbrišemo iz preostanka tega bloka (${cellsLabel(elim.map(e => e[0]))}).`
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
            technique: name, cells: combo.slice(), assign: [], eliminate: elim,
            message: `V ${unitNameLoc(unit)} ${size === 2 ? 'imata celici' : 'imajo celice'} ${cellsLabel(combo)} skupaj natanko ${size === 2 ? 'kandidata' : 'kandidate'} ${bitsOf(union).join(',')} (${size} ${size === 2 ? 'celici' : 'celice'}, ${size} ${size === 2 ? 'številki' : 'številke'}) -> te številke lahko izbrišemo iz preostanka enote: ${elimLabel(elim)}.`
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
          technique: name, cells: [...spots], assign: [], eliminate: elim,
          message: `V ${unitNameLoc(unit)} ${size === 2 ? 'sta številki' : 'so številke'} ${digits.join(',')} ${size === 2 ? 'možni' : 'možne'} samo v celicah ${cellsLabel(spots)} -> vse ostale kandidate v teh celicah lahko izbrišemo: ${elimLabel(elim)}.`
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
            message: `Kandidat ${d} je v ${baseName} ${numsLabel([u1, u2].map(u => baseIndex(u[0]) + 1))} mogoč samo v celicah ${cellsLabel([...s1, ...s2])} -> tvori X-Wing. ${d} lahko izbrišemo iz preostanka ${crossName} ${numsLabel([...idx1].map(i => i + 1))}: ${cellsLabel(elim.map(e => e[0]))}.`
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
            message: `Kandidat ${d} je v ${baseName} ${numsLabel([u1, u2, u3].map(u => baseIndex(u[0]) + 1))} mogoč samo v celicah ${cellsLabel([...s1, ...s2, ...s3])} -> tvori Swordfish. ${d} lahko izbrišemo iz preostanka ${crossName} ${numsLabel([...idxUnion].map(i => i + 1))}: ${cellsLabel(elim.map(e => e[0]))}.`
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
              message: `Pivot ${cellLabel(pivot)} {${x},${y}} ima dve krili: ${cellLabel(w1)} in ${cellLabel(w2)}, ki obe delita kandidata ${z} -> ${z} lahko izbrišemo iz celic, ki vidijo obe krili (${cellsLabel(elim.map(e => e[0]))}).`
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
        message: `Celice ${cellsLabel(trio)} imajo natanko kandidata ${bitsOf(digitsMask).join(',')}, ${cellLabel(fourth)} pa poleg njiju še dodatne. Če bi imela tudi ${cellLabel(fourth)} samo ${bitsOf(digitsMask).join(',')}, bi uganka imela dve rešitvi -> ${bitsOf(digitsMask).join(',')} lahko izbrišemo iz ${cellLabel(fourth)}.`
      });
    }
  }
  return steps;
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
  ['XY-Wing', xyWing],
  ['Unique Rectangle', uniqueRectangle],
];

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
          message: `Če bi ${cellLabel(cell)} = ${d}, iz tega po verigi sklepanj ne obstaja nobena veljavna rešitev (pride do protislovja) -> ${d} v ${cellLabel(cell)} ni mogoč in ga izbrišemo.`
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

function digitsOfStep(step) {
  const ds = new Set();
  for (const [, d] of step.assign) ds.add(d);
  for (const [, d] of step.eliminate) ds.add(d);
  return ds;
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
    let found = null;

    // Najprej poskusimo ostati pri trenutno "aktivni" številki - gremo skozi
    // VSE tehnike (od najpreprostejših do najzahtevnejših), a upoštevamo
    // samo korake, ki se tičejo focusDigit. Tako se dokončajo vse možne
    // poteze za eno številko, preden preskočimo na naslednjo.
    if (focusDigit !== null) {
      for (const [name, fn] of techniques) {
        const steps = fn(b).filter(s => digitsOfStep(s).has(focusDigit));
        if (steps.length) { found = steps[0]; break; }
      }
    }

    // Če za trenutno številko ni več nič najti, izberemo novo (karkoli je
    // na vrsti po običajni prioriteti) in se "usidramo" nanjo naprej.
    if (!found) {
      for (const [name, fn] of techniques) {
        const steps = fn(b);
        if (steps.length) { found = steps[0]; break; }
      }
      if (!found) found = tryBifurcation(b);
      if (found) {
        const ds = [...digitsOfStep(found)];
        focusDigit = ds.length ? Math.min(...ds) : null;
      }
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

