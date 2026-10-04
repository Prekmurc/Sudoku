'use strict';
// Izrazi v besedilih za uporabnika (popravki po ročnem pregledu faze 6): »dane števke« (ne
// »danosti«, ne »začetne števke«), »kljukica« (ne »stikalo«), brez razvijalskih podrobnosti
// (lokalni strežnik, odpiranje neposredno iz datotek, ločena nit). Pregleda nize v JS treh
// aplikacij in shared/ ter besedilo HTML (z atributi title, placeholder, aria-label) - isti
// tokenizator kot tests/locila.test.js (tests/besedila-js.js).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JS, HTML, nizi, jeBesedilo } = require('./besedila-js.js');

const KOREN = path.join(__dirname, '..');

const PRAVILA = [
  ['»dane števke«, ne »danosti«', s => /danost/i.test(s)],
  ['»dane števke«, ne »začetne števke«', s => /začetn\w* števk/i.test(s)],
  ['»kljukica«, ne »stikalo«', s => /stikal/i.test(s)],
  ['razvijalska podrobnost (lokalni strežnik)', s => /lokaln\w* strežnik/i.test(s)],
  ['razvijalska podrobnost (neposredno iz datotek)', s => /neposredno iz datotek/i.test(s)],
  ['razvijalska podrobnost (ločena nit)', s => /ločen\w* nit/i.test(s)],
];

// Izjeme: [datoteka, začetek niza, razlog].
const IZJEME = [
  ['shared/zbirka.js', '- **Danosti:**', 'ključ v izvoženi datoteki Markdown (oblika docs/uganke.md, uvoz ga bere)'],
  ['shared/zbirka.js', 'V datoteki ni nobene uganke', 'sporočilo uvoza navede ključ datoteke »- **Danosti:**«'],
];

function preveri(f, vrstica, s, najdbe) {
  if (IZJEME.some(([d, zacetek]) => d === f && s.startsWith(zacetek))) return;
  for (const [ime, je] of PRAVILA) {
    if (je(s)) najdbe.push(`${f}:${vrstica} ${ime}: ${s.replace(/\s+/g, ' ').slice(0, 120)}`);
  }
}

test('izrazi: nizi v JS', () => {
  const najdbe = [];
  for (const f of JS) {
    for (const { vrstica, s } of nizi(fs.readFileSync(path.join(KOREN, f), 'utf8'))) {
      if (jeBesedilo(s)) preveri(f, vrstica, s, najdbe);
    }
  }
  assert.deepEqual(najdbe, []);
});

test('izrazi: besedilo HTML', () => {
  const najdbe = [];
  for (const f of HTML) {
    const html = fs.readFileSync(path.join(KOREN, f), 'utf8')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));
    html.split('\n').forEach((v, k) => {
      const atributi = [...v.matchAll(/\b(?:title|placeholder|aria-label)="([^"]*)"/g)].map(m => m[1]);
      for (const s of [v.replace(/<[^>]*>/g, ' '), ...atributi]) {
        if (jeBesedilo(s)) preveri(f, k + 1, s, najdbe);
      }
    });
  }
  assert.deepEqual(najdbe, []);
});

test('izrazi: pravila najdejo prepovedane izraze', () => {
  const najdbe = [];
  for (const s of ['Vtipkaj danosti v mrežo.', 'Vnesi začetne števke.', 'Stanje stikal si brskalnik zapomni.',
    'z lokalnim strežnikom', 'odpreš neposredno iz datotek', 'teče v ločeni niti']) preveri('x.js', 1, s, najdbe);
  assert.equal(najdbe.length, 6, najdbe.join('\n'));
  const dovoljeno = [];
  preveri('x.js', 1, 'Vtipkaj dane števke v mrežo. S kljukico skriješ kandidate.', dovoljeno);
  assert.deepEqual(dovoljeno, []);
});
