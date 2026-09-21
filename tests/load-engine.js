'use strict';
// Naloži shared/engine.js (skripta za brskalnik, brez exportov) v ločen vm kontekst
// in vrne njegove funkcije/razrede. Lahko naloži tudi drugo kodo motorja (npr.
// starejšo različico iz gita) - podaj jo kot niz.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const NAMES = [
  'Board', 'solve', 'countSolutions', 'ALL_TECHNIQUES', 'PEERS', 'ROWS', 'COLS', 'BOXES',
  'cellLabel', 'bitsOf', 'popcount', 'FULL', 'turbotFish', 'wWing', 'xyWing',
];

// extra.files: dodatne skripte (pot od korena projekta, npr. 'trening/generators.js'),
// naložene za motorjem v isti kontekst - kot zaporedni <script> v brskalniku (delijo si
// globalne const/let). extra.names: dodatna imena, ki jih vrne. extra.globals: globalne
// vrednosti, ki jih kontekst dobi pred nalaganjem (npr. nadomestni localStorage za
// shared/zbirka.js).
function loadEngine(code, extra = {}) {
  if (code === undefined) {
    code = fs.readFileSync(path.join(__dirname, '..', 'shared', 'engine.js'), 'utf8');
  }
  const ctx = vm.createContext({ ...(extra.globals || {}) });
  vm.runInContext(code, ctx);
  for (const f of extra.files || []) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  }
  const names = [...NAMES, ...(extra.names || [])];
  return vm.runInContext('({' + names.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ') + '})', ctx);
}

// Kontekst za teste, ki morajo brati spremenljivke MED tekom (npr. `igra` in
// `stanje` v igra/igra.js, ki se s potezami spreminjata) ali klicati funkcije UI.
// `files` so poti od korena projekta v vrstnem redu nalaganja (kot <script> v
// strani, vključno s shared/engine.js), `globals` pa globalne vrednosti konteksta
// (npr. nadomestni DOM iz dom-stub.js). Vrne { run, ctx }: run('izraz') ovrednoti
// izraz v istem kontekstu.
function loadContext(files, globals = {}) {
  const ctx = vm.createContext({ ...globals });
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  }
  return { ctx, run: (izraz) => vm.runInContext(izraz, ctx) };
}

// Uganke iz docs/uganke.md: [{ ime, danosti }] (naslov ### + vrstica **Danosti...:** `...`).
function loadPuzzles() {
  const md = fs.readFileSync(path.join(__dirname, '..', 'docs', 'uganke.md'), 'utf8');
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

// Posnetek stanja kandidatov v berljivem zapisu: 81 žetonov (po 9 v vrstici),
// vpisana številka = "5", prazna celica = "[247]" (njeni kandidati).
function boardToText(engine, grid, cand) {
  const rows = [];
  for (let r = 0; r < 9; r++) {
    const t = [];
    for (let c = 0; c < 9; c++) {
      const i = r * 9 + c;
      t.push(grid[i] ? String(grid[i]) : `[${engine.bitsOf(cand[i]).join('')}]`);
    }
    rows.push(t.join(' '));
  }
  return rows.join('\n');
}

function boardFromText(engine, text) {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length !== 81) throw new Error(`Pričakovanih 81 žetonov, dobljenih ${tokens.length}.`);
  const b = Object.create(engine.Board.prototype);
  b.grid = new Array(81).fill(0);
  b.cand = new Array(81).fill(0);
  tokens.forEach((t, i) => {
    if (/^[1-9]$/.test(t)) { b.grid[i] = +t; b.cand[i] = 1 << +t; }
    else for (const ch of t.replace(/[\[\]]/g, '')) b.cand[i] |= 1 << +ch;
  });
  return b;
}

module.exports = { loadEngine, loadContext, loadPuzzles, boardToText, boardFromText };
