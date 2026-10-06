'use strict';
// Besedila za uporabnika v JS in HTML treh aplikacij - skupno testoma tests/locila.test.js (ločila)
// in tests/izrazi.test.js (izrazi). Seznama datotek, tokenizator nizov v JS in merilo »besedilo«
// (niz s črko in presledkom - nizi brez presledka so ključi, izbirniki, razredi).

const JS = [
  'app/app.js', 'app/zbirka.js',
  'igra/igra.js', 'igra/shramba.js', 'igra/generator-worker.js', 'igra/oceni-worker.js',
  'trening/trening.js', 'trening/generators.js', 'trening/v-uganki.js',
  'shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js',
  'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js',
];
const HTML = ['app/index.html', 'igra/index.html', 'trening/index.html'];

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

module.exports = { JS, HTML, nizi, jeBesedilo };
