'use strict';
// Vrstica z imenom tehnike nad vajo v treningu (».ex-label«, »Spoznaj« in »Vadi v uganki«):
// temno besedilo in dovolj velike črke - kontrast vsaj 4,5 : 1 (WCAG AA za navadno besedilo) na
// podlagi kartice vaje (.exercise) in velikost vsaj 14 px. Popravek po pregledu koraka 1 faze 3a
// (docs/faza3a-nacrt.md, razdelek 8): prej 11 px sivo (--pencil) na --card, kontrast 2,9.
// Barve se preberejo iz CSS (spremenljivke iz :root v shared/base.css in trening/trening.css);
// izračunan slog v brskalniku preverja tools/preveri-sheme-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const brez = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const BASE = brez(fs.readFileSync(path.join(KOREN, 'shared', 'base.css'), 'utf8'));
const TRENING = brez(fs.readFileSync(path.join(KOREN, 'trening', 'trening.css'), 'utf8'));

// Spremenljivke iz :root (trening ima zadnjo besedo, ker se naloži za base.css).
const spremenljivke = {};
for (const css of [BASE, TRENING]) {
  for (const blok of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const [, ime, vr] of blok[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) spremenljivke[ime] = vr.trim();
  }
}
const razresi = v => {
  for (let i = 0; i < 10; i++) {
    const m = /^var\((--[\w-]+)\)$/.exec(v.trim());
    if (!m) return v.trim();
    v = spremenljivke[m[1]];
    assert.ok(v, `spremenljivka ${m[1]} ni definirana`);
  }
  throw new Error('preveč ugnezdenih var()');
};
// Lastnost iz pravila z natanko tem izbirnikom.
function lastnost(css, izbirnik, ime) {
  const re = new RegExp(`(?:^|})\\s*${izbirnik.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
  let vr;
  for (const [, telo] of css.matchAll(re)) {
    for (const [, k, v] of telo.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) if (k === ime) vr = v.trim();
  }
  return vr;
}
function hex(barva) {
  const m = /^#([0-9a-f]{6})$/i.exec(barva);
  assert.ok(m, `barva ${barva} ni #RRGGBB`);
  return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
}
// Relativna svetlost in kontrast po WCAG 2.
const svetlost = rgb => {
  const [r, g, b] = rgb.map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (a, b) => {
  const [l1, l2] = [svetlost(a), svetlost(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

test('kontrast: izračun po WCAG (črna na beli 21, siva #777 na beli pribl. 4,48)', () => {
  assert.equal(Math.round(kontrast([0, 0, 0], [255, 255, 255])), 21);
  assert.ok(Math.abs(kontrast(hex('#777777'), hex('#FFFFFF')) - 4.48) < 0.01);
});

test('ime tehnike nad vajo (.ex-label): kontrast vsaj 4,5 : 1 na podlagi kartice, črke vsaj 14 px', () => {
  const barva = razresi(lastnost(TRENING, '.ex-label', 'color'));
  const podlaga = razresi(lastnost(TRENING, '.exercise', 'background'));
  const k = kontrast(hex(barva), hex(podlaga));
  assert.ok(k >= 4.5, `kontrast ${k.toFixed(2)} (${barva} na ${podlaga})`);
  // Tudi na beli podlagi strani (če bi bila vrstica kdaj zunaj kartice).
  assert.ok(kontrast(hex(barva), hex(razresi('var(--paper)'))) >= 4.5);
  const velikost = lastnost(TRENING, '.ex-label', 'font-size');
  assert.match(velikost, /^\d+(\.\d+)?px$/);
  assert.ok(parseFloat(velikost) >= 14, `velikost ${velikost}`);
  // Brez velikih tiskanih črk (slabše berljivo pri dolgem imenu).
  assert.notEqual(lastnost(TRENING, '.ex-label', 'text-transform'), 'uppercase');
});
