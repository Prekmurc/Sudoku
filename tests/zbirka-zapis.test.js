'use strict';
// Zapis uganke v zbirki (shared/zbirka.js):
//   - težavnosti (TEZAVNOSTI): prve štiri so natanko stopnje generatorja, "Ekstrem"
//     ostane za uganke z ugibanjem, stara imena (Začetnik, Preprosto, Srednje, Težko,
//     Ekspert) se preslikajo v nova - ob branju zbirke in ob uvozu iz Markdowna;
//   - izvor (ZBIRKA_IZVORI): ali je uganko ustvaril generator ali je vnesena ročno;
//     zapiše se ob nastanku zapisa in se pozneje ne spreminja;
//   - moje reševanje v igri (igrano/izpolnjeno/napaka, zbirkaStanjeIgre,
//     zbirkaShraniIgranje) proti programovemu (nazadnje = "Ocenjeno", reseno =
//     "Program rešil"), prikaz v dveh vrsticah in izvoz/uvoz obojega (uvoz bere
//     tudi stari imeni "Nazadnje rešeno" in "Rešeno").
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
    'zbirkaIzvor', 'zbirkaOpisIzvora', 'zbirkaShraniResitev', 'zbirkaBeri', 'zbirkaPisi',
    'zbirkaStanjeIgre', 'zbirkaPrikazCasov', 'zbirkaNamigCasov', 'zbirkaShraniIgranje',
    'zbirkaZaSeznam', 'zbirkaVrsticaIgranja'],
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

/* ---------- moje reševanje v igri (igrano / izpolnjeno / napaka) ---------- */

test('ZBIRKA_POLJA: polja mojega reševanja so med polji zapisa', () => {
  for (const k of ['igrano', 'izpolnjeno', 'napaka']) {
    assert.ok([...E.ZBIRKA_POLJA].includes(k), k);
  }
});

test('zbirkaStanjeIgre(): nova, v teku, rešena, izpolnjena z napako', () => {
  const cas = '2026-09-22 10:05';
  assert.deepEqual({ ...E.zbirkaStanjeIgre({}) }, { kljuc: 'nova', besedilo: 'nova' });
  assert.deepEqual({ ...E.zbirkaStanjeIgre({ izpolnjeno: 45 }) }, { kljuc: 'nova', besedilo: 'nova' },
    'brez časa reševanja je uganka nova, tudi če ima število celic iz uvoza');
  assert.deepEqual({ ...E.zbirkaStanjeIgre({ igrano: cas, izpolnjeno: 45 }) },
    { kljuc: 'v-teku', besedilo: 'v teku (45 od 81)' });
  assert.deepEqual({ ...E.zbirkaStanjeIgre({ igrano: cas, izpolnjeno: 81 }) },
    { kljuc: 'resena', besedilo: 'rešena' });
  // Vseh 81 celic izpolnjenih, a vsaj ena ni pravilna: to ni rešena uganka.
  assert.deepEqual({ ...E.zbirkaStanjeIgre({ igrano: cas, izpolnjeno: 81, napaka: true }) },
    { kljuc: 'napaka', besedilo: 'izpolnjena z napako' });
});

test('zbirkaPrikazCasov(): dve vrstici, brez reševanja samo prva', () => {
  const z = { dodano: '2026-09-21 16:33', igrano: '2026-09-22 10:05', izpolnjeno: 45, nazadnje: '2026-09-21 16:33' };
  const casi = E.zbirkaPrikazCasov(z);
  assert.equal(casi.dodana, 'dodana 21. 9. 2026 ob 16:33');
  assert.equal(casi.igranje.predpona, 'zadnje reševanje 22. 9. 2026 ob 10:05');
  assert.equal(casi.igranje.besedilo, 'v teku (45 od 81)');
  assert.equal(casi.igranje.kljuc, 'v-teku');
  assert.equal(E.zbirkaVrsticaIgranja(z), 'zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (45 od 81)');
  // Čas, ko je uganko ocenil program, v seznamu ni - je samo v namigu miške.
  assert.ok(!(casi.dodana + ' ' + E.zbirkaVrsticaIgranja(z)).includes('ocenjeno'));
  assert.ok(E.zbirkaNamigCasov(z).includes('Ocenjeno: 2026-09-21 16:33'));

  const brez = E.zbirkaPrikazCasov({ dodano: '2026-09-21 16:33' });
  assert.equal(brez.igranje, null, 'uganke še nisem igral - druge vrstice ni');
  assert.equal(E.zbirkaVrsticaIgranja({ dodano: '2026-09-21 16:33' }), '');
  assert.equal(E.zbirkaPrikazCasov({}).dodana, '—');
});

test('zbirkaPrikazCasov(): rešena uganka ima samo "rešena <čas>"', () => {
  const z = { dodano: '2026-09-21 16:33', igrano: '2026-09-21 17:48', izpolnjeno: 81 };
  const i = E.zbirkaPrikazCasov(z).igranje;
  assert.equal(i.predpona, '', 'pri rešeni uganki ni "zadnje reševanje"');
  assert.equal(i.besedilo, 'rešena 21. 9. 2026 ob 17:48');
  assert.equal(i.kljuc, 'resena');
  assert.equal(E.zbirkaVrsticaIgranja(z), 'rešena 21. 9. 2026 ob 17:48');
  // Izpolnjena z napako pa ostane pri paru "zadnje reševanje ... · stanje".
  const napaka = E.zbirkaPrikazCasov({ ...z, napaka: true }).igranje;
  assert.equal(napaka.predpona, 'zadnje reševanje 21. 9. 2026 ob 17:48');
  assert.equal(napaka.besedilo, 'izpolnjena z napako');
});

test('zbirkaShraniIgranje(): zapiše moje reševanje, uganke izven zbirke ne doda', () => {
  shramba.clear();
  const { board, log } = E.solve(danosti);
  E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Lahka', izvor: 'generator' });

  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-22 10:05', 45, false), true);
  let z = E.zbirkaBeri()[0];
  assert.equal(z.igrano, '2026-09-22 10:05');
  assert.equal(z.izpolnjeno, 45);
  assert.equal(z.napaka, false);
  assert.equal(E.zbirkaStanjeIgre(z).besedilo, 'v teku (45 od 81)');
  // Program in igralec sta ločena: podatki solve() ostanejo nedotaknjeni.
  assert.equal(z.reseno, 81);
  assert.equal(z.nazadnje, z.dodano);

  // Enak zapis se ne shranjuje znova.
  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-22 10:05', 45, false), false);
  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-22 10:31', 81, true), true);
  z = E.zbirkaBeri()[0];
  assert.equal(E.zbirkaStanjeIgre(z).besedilo, 'izpolnjena z napako');

  // Uganka, ki je v zbirki ni (npr. vgrajeni primer), se ne doda.
  assert.equal(E.zbirkaShraniIgranje(danosti.replace('8', '0'), '2026-09-22 11:00', 30, false), false);
  assert.equal(E.zbirkaBeri().length, 1);
});

test('zbirkaShraniIgranje(): zapis rešene uganke je zamrznjen', () => {
  shramba.clear();
  const { board, log } = E.solve(danosti);
  E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Lahka', izvor: 'generator' });

  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-21 17:48', 81, false), true);
  assert.equal(E.zbirkaStanjeIgre(E.zbirkaBeri()[0]).besedilo, 'rešena');

  // Nadaljnje reševanje (npr. po "Začni znova") časa in stanja ne spremeni.
  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-23 09:00', 30, false), false);
  const z = E.zbirkaBeri()[0];
  assert.equal(z.igrano, '2026-09-21 17:48', 'ohrani se čas prve rešitve');
  assert.equal(z.izpolnjeno, 81);
  assert.equal(E.zbirkaStanjeIgre(z).besedilo, 'rešena');
});

test('izvoz in uvoz: Zadnje reševanje, Stanje, Ocenjeno in Program rešil', () => {
  const zbirka = [
    { danosti, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-21 16:33',
      igrano: '2026-09-22 10:05', izpolnjeno: 45, napaka: false,
      nazadnje: '2026-09-21 16:40', reseno: 81, koraki: 34, ugibanje: 0, tehnike: [], opomba: '' },
    { danosti: danosti.replace('8', '0'), tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-09-21 17:00',
      igrano: '2026-09-22 11:00', izpolnjeno: 81, napaka: true, nazadnje: '', opomba: '' },
    { danosti: danosti.replace('7', '0'), tezavnost: 'Težka', izvor: '', dodano: '2026-09-21 18:00',
      igrano: '2026-09-22 12:00', izpolnjeno: 81, napaka: false, nazadnje: '', opomba: '' },
  ];
  const md = E.zbirkaVMarkdown(zbirka);
  assert.ok(md.includes('- **Zadnje reševanje:** 2026-09-22 10:05'));
  assert.ok(md.includes('- **Stanje:** v teku (45 od 81)'));
  assert.ok(md.includes('- **Stanje:** izpolnjena z napako'));
  assert.ok(md.includes('- **Stanje:** rešena'));
  assert.ok(md.includes('- **Ocenjeno:** 2026-09-21 16:40'));
  assert.ok(md.includes('- **Program rešil:** v celoti'));
  assert.ok(!md.includes('- **Nazadnje rešeno:**'), 'staro ime se ne izvaža več');
  assert.ok(!md.includes('- **Rešeno:**'), 'staro ime se ne izvaža več');

  const { zapisi, neveljavni } = E.zbirkaIzMarkdowna(md);
  assert.equal(neveljavni, 0);
  assert.equal(zapisi.length, 3);
  const [a, b, c] = [...zapisi];
  assert.equal(a.igrano, '2026-09-22 10:05');
  assert.equal(a.izpolnjeno, 45);
  assert.equal(a.napaka, false);
  assert.equal(a.nazadnje, '2026-09-21 16:40');
  assert.equal(a.reseno, 81);
  assert.equal(E.zbirkaStanjeIgre(b).besedilo, 'izpolnjena z napako');
  assert.equal(E.zbirkaStanjeIgre(c).besedilo, 'rešena');
});

test('uvoz: stari imeni "Nazadnje rešeno" in "Rešeno" se še bereta', () => {
  const md = [
    '- **Danosti:** `' + danosti.replace(/0/g, '.') + '`',
    '- **Dodano:** 2026-09-15 10:00',
    '- **Nazadnje rešeno:** 2026-09-16 11:00',
    '- **Rešeno:** delno (62 od 81 celic)',
  ].join('\n');
  const z = [...E.zbirkaIzMarkdowna(md).zapisi][0];
  assert.equal(z.nazadnje, '2026-09-16 11:00');
  assert.equal(z.reseno, 62);
  assert.equal(z.igrano, '', 'uganke iz starega izvoza še nisem igral');
  assert.equal(E.zbirkaStanjeIgre(z).besedilo, 'nova');
});

test('uvoz: čas reševanja brez vrstice Stanje', () => {
  const md = [
    '- **Danosti:** `' + danosti.replace(/0/g, '.') + '`',
    '- **Zadnje reševanje:** 2026-09-22 10:05',
  ].join('\n');
  const z = [...E.zbirkaIzMarkdowna(md).zapisi][0];
  assert.equal(z.igrano, '2026-09-22 10:05');
  assert.equal(E.zbirkaStanjeIgre(z).besedilo, 'v teku (0 od 81)');
});

test('zbirkaZaSeznam(): najprej reševane (po času reševanja), nato nereševane (po dodajanju)', () => {
  const zbirka = [
    { danosti: 'a', dodano: '2026-09-10 10:00', igrano: '2026-09-20 08:00', nazadnje: '2026-09-22 23:00' },
    { danosti: 'b', dodano: '2026-09-21 16:33' },
    { danosti: 'c', dodano: '2026-09-11 10:00', igrano: '2026-09-22 10:05' },
    { danosti: 'd', dodano: '2026-09-19 09:00' },
  ];
  assert.deepEqual([...E.zbirkaZaSeznam(zbirka)].map(z => z.danosti), ['c', 'a', 'b', 'd']);
  // Čas, ko je uganko ocenil program (nazadnje), na vrstni red ne vpliva.
  assert.deepEqual([...E.zbirkaZaSeznam([...zbirka].reverse())].map(z => z.danosti), ['c', 'a', 'b', 'd']);
});
