'use strict';
// Imena težavnosti v zbirki (TEZAVNOSTI v shared/zbirka.js): prve štiri so natanko
// stopnje generatorja, "Ekstrem" ostane za uganke z ugibanjem. Stara imena
// (Začetnik, Preprosto, Srednje, Težko, Ekspert) se preslikajo v nova - ob branju
// zbirke in ob uvozu iz Markdowna.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/zbirka.js', 'shared/generator.js'],
  names: ['TEZAVNOSTI', 'PRIVZETA_TEZAVNOST', 'STARE_TEZAVNOSTI', 'zbirkaTezavnost',
    'zbirkaIzMarkdowna', 'STOPNJE_UGANK'],
});

const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');

test('TEZAVNOSTI: štiri stopnje, Ekstrem in Drugo', () => {
  assert.deepEqual([...E.TEZAVNOSTI], ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstrem', 'Drugo']);
  assert.equal(E.PRIVZETA_TEZAVNOST, 'Ekstrem');
  // Prve štiri so imena stopenj iz shared/generator.js.
  assert.deepEqual([...E.TEZAVNOSTI].slice(0, 4), [...E.STOPNJE_UGANK].map(s => s.ime));
});

test('zbirkaTezavnost(): stara imena se preslikajo, nova ostanejo', () => {
  assert.deepEqual({ ...E.STARE_TEZAVNOSTI }, {
    'Začetnik': 'Lahka',
    'Preprosto': 'Lahka',
    'Srednje': 'Srednja',
    'Težko': 'Težka',
    'Ekspert': 'Zelo težka',
  });
  for (const [staro, novo] of Object.entries(E.STARE_TEZAVNOSTI)) {
    assert.equal(E.zbirkaTezavnost(staro), novo, staro);
  }
  for (const t of E.TEZAVNOSTI) assert.equal(E.zbirkaTezavnost(t), t, t);
  assert.equal(E.zbirkaTezavnost(''), '', 'prazno ostane prazno');
  assert.equal(E.zbirkaTezavnost(undefined), '');
  assert.equal(E.zbirkaTezavnost('Lv4'), 'Drugo', 'neznano ime');
});

test('uvoz iz Markdowna: staro ime težavnosti se preslika v novo', () => {
  const md = [
    '### 2026-09-15 10:00 · Ekspert',
    '',
    `- **Danosti:** \`${danosti.replace(/0/g, '.')}\``,
    '- **Težavnost:** Ekspert',
    '- **Dodano:** 2026-09-15 10:00',
  ].join('\n');
  const { zapisi, neveljavni } = E.zbirkaIzMarkdowna(md);
  assert.equal(neveljavni, 0);
  assert.equal(zapisi.length, 1);
  assert.equal(zapisi[0].tezavnost, 'Zelo težka');
});

test('uvoz iz Markdowna: neznano ime težavnosti postane Drugo, novo ostane', () => {
  const vrstice = t => [
    `- **Danosti:** \`${danosti.replace(/0/g, '.')}\``,
    `- **Težavnost:** ${t}`,
  ].join('\n');
  assert.equal(E.zbirkaIzMarkdowna(vrstice('Oakever Lv4')).zapisi[0].tezavnost, 'Drugo');
  assert.equal(E.zbirkaIzMarkdowna(vrstice('Zelo težka')).zapisi[0].tezavnost, 'Zelo težka');
  assert.equal(E.zbirkaIzMarkdowna(vrstice('Ekstrem')).zapisi[0].tezavnost, 'Ekstrem');
});
