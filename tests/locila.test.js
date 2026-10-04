'use strict';
// Ločila v besedilih za uporabnika (faza 6, docs/uskladitev.md 4.6): pomišljaj » – « (ne vezaj
// z razmikom » - « in ne dolgi pomišljaj »—«), slovenski narekovaji »…« (ne ravni "…"),
// tropičje »…« (ne tri pike), puščica »→« (ne »->«). Pregleda nize v JS (brez komentarjev;
// izrazi v ${…} predlog se pregledajo kot koda, njihovi nizi pa kot besedilo) in besedilo HTML
// treh aplikacij (z atributi title, placeholder, aria-label). Besedilo je niz s črko in
// presledkom - nizi brez presledka so ključi, izbirniki, razredi.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const { JS, HTML, nizi, jeBesedilo } = require('./besedila-js.js');

// Izjeme: [datoteka, začetek niza, razlog].
const IZJEME = [
  ['shared/zbirka.js', 'Izvoz zbirke ugank (', 'glava izvožene datoteke Markdown (zapis v datoteki, ne v vmesniku)'],
  ['shared/zbirka.js', 'uvoziti nazaj (gumb', 'glava izvožene datoteke Markdown'],
  ['shared/zbirka.js', 'Uganke, pri katerih je navedeno', 'glava izvožene datoteke Markdown'],
  ['shared/zbirka.js', '"Zadnje reševanje"', 'glava izvožene datoteke Markdown'],
  ['shared/zbirka.js', '"Ocenjeno" in', 'glava izvožene datoteke Markdown'],
];

const PRAVILA = [
  ['vezaj z razmikom (» – «)', s => / - /.test(s)],
  ['dolgi pomišljaj (» – «)', s => /—/.test(s)],
  // atributi HTML (class="…") in vrednosti CSS (font-family:"…") niso besedilo
  ['ravni narekovaj (»…«)', s => /"/.test(s.replace(/[\w-]+="[^"]*"/g, '').replace(/:\s*"[^"]*"/g, ''))],
  ['tri pike (»…«)', s => /(^|[^.])\.\.\.(?!\.)/.test(s)],
  ['puščica (»→«)', s => /->/.test(s)],
];

function preveri(f, vrstica, s, najdbe) {
  if (IZJEME.some(([d, zacetek]) => d === f && s.startsWith(zacetek))) return;
  for (const [ime, je] of PRAVILA) {
    if (je(s)) najdbe.push(`${f}:${vrstica} ${ime}: ${s.replace(/\s+/g, ' ').slice(0, 120)}`);
  }
}

test('ločila: nizi v JS', () => {
  const najdbe = [];
  let besedil = 0;
  for (const f of JS) {
    for (const { vrstica, s } of nizi(fs.readFileSync(path.join(KOREN, f), 'utf8'))) {
      if (!jeBesedilo(s)) continue;
      besedil++;
      preveri(f, vrstica, s, najdbe);
    }
  }
  assert.ok(besedil > 500, `pregledanih nizov: ${besedil}`);
  assert.deepEqual(najdbe, []);
});

test('ločila: besedilo HTML', () => {
  const najdbe = [];
  for (const f of HTML) {
    // Skripte, slogi in komentarji (tudi čez več vrstic) ostanejo samo kot prelomi vrstic.
    const html = fs.readFileSync(path.join(KOREN, f), 'utf8')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));
    html.split('\n').forEach((v, k) => {
      const atributi = [...v.matchAll(/\b(?:title|placeholder|aria-label)="([^"]*)"/g)].map(m => m[1]);
      for (const s of [v.replace(/<[^>]*>/g, ' '), ...atributi]) {
        // vzorec niza v placeholder (»8....1......«) ni tropičje - pravilo tri pike je natančno
        if (jeBesedilo(s)) preveri(f, k + 1, s, najdbe);
      }
    });
  }
  assert.deepEqual(najdbe, []);
});

test('ločila: tokenizator najde nize, izraze v predlogah in preskoči komentarje', () => {
  const src = "// a - b\nconst x = 'ena - dve'; /* \"c\" */ const y = `tri ${p ? 'štiri - pet' : ''} šest`;\nconst r = /a - b/g;";
  assert.deepEqual(nizi(src).map(o => o.s), ['ena - dve', 'štiri - pet', '', 'tri · šest']);
});
