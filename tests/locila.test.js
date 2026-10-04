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
const JS = [
  'app/app.js', 'app/zbirka.js',
  'igra/igra.js', 'igra/shramba.js', 'igra/generator-worker.js', 'igra/oceni-worker.js',
  'trening/trening.js', 'trening/generators.js', 'trening/v-uganki.js',
  'shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js',
  'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/mreza.js', 'shared/plosca.js',
];
const HTML = ['app/index.html', 'igra/index.html', 'trening/index.html'];

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

// Nizi v JS: { vrstica, s }. Preprost tokenizator: komentarji, regularni izrazi (po znaku
// pred poševnico), nizi '…', "…" in `…`; izraz ${…} v predlogi se pregleda rekurzivno, v
// nizu ga nadomesti »·«.
function nizi(src, zacetnaVrstica = 1) {
  const out = [];
  let i = 0, vrstica = zacetnaVrstica, prej = '\n';
  const n = src.length;
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === '\n') { vrstica++; i++; continue; }
    if (c === '/' && c2 === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') vrstica++; i++; }
      i += 2; continue;
    }
    if (c === '/' && /[=(,:;!&|?{}[\n+]/.test(prej)) {
      let razred = false;
      for (i++; i < n && src[i] !== '\n'; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '[') razred = true;
        else if (src[i] === ']') razred = false;
        else if (src[i] === '/' && !razred) break;
      }
      i++; prej = 'r'; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const zacetek = vrstica;
      let s = '';
      for (i++; i < n && src[i] !== c; i++) {
        if (src[i] === '\\') { s += src[i] + src[i + 1]; i++; continue; }
        if (src[i] === '\n') vrstica++;
        if (c === '`' && src[i] === '$' && src[i + 1] === '{') {
          const od = i + 2, vrIzraza = vrstica;
          let globina = 1;
          for (i += 2; i < n && globina; i++) {
            if (src[i] === '{') globina++;
            else if (src[i] === '}') globina--;
            else if (src[i] === '\n') vrstica++;
          }
          out.push(...nizi(src.slice(od, i - 1), vrIzraza));
          s += '·';
          i--;
          continue;
        }
        s += src[i];
      }
      i++;
      out.push({ vrstica: zacetek, s });
      prej = 's';
      continue;
    }
    if (!/\s/.test(c)) prej = c;
    i++;
  }
  return out;
}

const jeBesedilo = s => /[A-Za-zČŠŽčšž]/.test(s) && / /.test(s);

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
