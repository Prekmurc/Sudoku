'use strict';
// Zapis uganke v zbirki (shared/zbirka.js):
//   - težavnosti (TEZAVNOSTI): prve štiri so natanko stopnje generatorja, "Ekstrem"
//     ostane za uganke z ugibanjem, stara imena (Začetnik, Preprosto, Srednje, Težko,
//     Ekspert) se preslikajo v nova - ob branju zbirke in ob uvozu iz Markdowna;
//   - izvor (ZBIRKA_IZVORI): ali je uganko ustvaril generator ali je vnesena ročno;
//     zapiše se ob nastanku zapisa in se pozneje ne spreminja.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

// Nadomestni localStorage: shared/zbirka.js ga uporablja samo v zbirkaBeri/zbirkaPisi.
const shramba = new Map();
const E = loadEngine(undefined, {
  files: ['shared/zbirka.js', 'shared/generator.js'],
  globals: {
    localStorage: {
      getItem: k => (shramba.has(k) ? shramba.get(k) : null),
      setItem: (k, v) => shramba.set(k, String(v)),
      removeItem: k => shramba.delete(k),
    },
  },
  names: ['TEZAVNOSTI', 'PRIVZETA_TEZAVNOST', 'STARE_TEZAVNOSTI', 'zbirkaTezavnost',
    'zbirkaIzMarkdowna', 'zbirkaVMarkdown', 'STOPNJE_UGANK', 'ZBIRKA_IZVORI', 'ZBIRKA_POLJA',
    'zbirkaIzvor', 'zbirkaOpisIzvora', 'zbirkaShraniResitev', 'zbirkaBeri'],
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

/* ---------- izvor uganke (generator ali ročni vnos) ---------- */

test('zbirkaIzvor(): ključ, besedilo iz izvoza ali nič', () => {
  assert.deepEqual({ ...E.ZBIRKA_IZVORI }, { generator: 'ustvaril generator', rocno: 'ročni vnos' });
  assert.ok([...E.ZBIRKA_POLJA].includes('izvor'), 'izvor je med polji zapisa');
  assert.equal(E.zbirkaIzvor('generator'), 'generator');
  assert.equal(E.zbirkaIzvor('rocno'), 'rocno');
  assert.equal(E.zbirkaIzvor('ustvaril generator'), 'generator', 'besedilo iz izvoza');
  assert.equal(E.zbirkaIzvor('ročni vnos'), 'rocno');
  assert.equal(E.zbirkaIzvor(''), '');
  assert.equal(E.zbirkaIzvor(undefined), '');
  assert.equal(E.zbirkaIzvor('Oakever, Ekstrem (Lv4)'), '', 'neznano besedilo');
  assert.equal(E.zbirkaOpisIzvora({ izvor: 'generator' }), 'ustvaril generator');
  assert.equal(E.zbirkaOpisIzvora({ izvor: '' }), '', 'starejši zapis brez podatka');
  assert.equal(E.zbirkaOpisIzvora({}), '');
});

test('zbirkaShraniResitev(): izvor se zapiše ob nastanku in se pozneje ne spreminja', () => {
  shramba.clear();
  const { board, log } = E.solve(danosti);

  const nov = E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Lahka', izvor: 'generator' });
  assert.ok(nov, 'zapis je shranjen');
  assert.equal(nov.izvor, 'generator');
  assert.equal(nov.tezavnost, 'Lahka');

  // Ponovno reševanje (npr. iste uganke v reševalcu) izvora in težavnosti ne povozi.
  const znova = E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Ekstrem', izvor: 'rocno' });
  assert.equal(znova.izvor, 'generator', 'izvor ostane');
  assert.equal(znova.tezavnost, 'Lahka', 'težavnost ostane');
  assert.equal(E.zbirkaBeri().length, 1, 'ista uganka se ne podvoji');

  // Brez podatka o izvoru (starejša pot) ostane prazen.
  shramba.clear();
  assert.equal(E.zbirkaShraniResitev(danosti, board, log).izvor, '');
});

test('izvoz in uvoz: vrstica Izvor gre skozi datoteko', () => {
  const zbirka = [
    { danosti, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-20 10:00', nazadnje: '', opomba: '' },
    { danosti: danosti.replace('8', '0'), tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-09-20 11:00', nazadnje: '', opomba: '' },
    { danosti: danosti.replace('7', '0'), tezavnost: 'Težka', izvor: '', dodano: '2026-09-20 12:00', nazadnje: '', opomba: '' },
  ];
  const md = E.zbirkaVMarkdown(zbirka);
  assert.ok(md.includes('- **Izvor:** ustvaril generator'), 'izvoz generatorjeve uganke');
  assert.ok(md.includes('- **Izvor:** ročni vnos'), 'izvoz ročno vnesene');
  const { zapisi, neveljavni } = E.zbirkaIzMarkdowna(md);
  assert.equal(neveljavni, 0);
  // [...] - polje je iz vm konteksta, deepEqual zahteva polje iz tega realma.
  assert.deepEqual([...zapisi].map(z => z.izvor).sort(), ['', 'generator', 'rocno']);
});

test('uvoz: vrstica Vir iz docs/uganke.md ne postane izvor', () => {
  const md = [
    `- **Danosti:** \`${danosti.replace(/0/g, '.')}\``,
    '- **Vir:** Oakever, Ekstrem (Lv4); posredoval uporabnik',
  ].join('\n');
  assert.equal(E.zbirkaIzMarkdowna(md).zapisi[0].izvor, '');
});
