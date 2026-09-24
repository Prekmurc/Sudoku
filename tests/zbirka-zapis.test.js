'use strict';
// Zapis uganke v zbirki (shared/zbirka.js):
//   - težavnosti (TEZAVNOSTI): prve štiri so natanko stopnje generatorja, "Ekstrem"
//     ostane za uganke z ugibanjem, stara imena (Začetnik, Preprosto, Srednje, Težko,
//     Ekspert) se preslikajo v nova - ob branju zbirke in ob uvozu iz Markdowna;
//   - izvor (ZBIRKA_IZVORI): ali je uganko ustvaril generator ali je vnesena ročno;
//     zapiše se ob nastanku zapisa in se pozneje ne spreminja;
//   - vgrajeni primeri niso del zbirke: zbirkaShraniResitev in uvoz jih ne shranita,
//     zbirkaBeri stare zapise primerov odstrani (igra primera ostane);
//   - brisanje (zbirkaIzbrisi, zbirkaIzbrisiVse): zapis in shranjena igra; "Izbriši
//     vse" odstrani vse igre razen iger primerov, tudi sirote; besedilo potrditve;
//   - števec programa "delno (36/57)" (zbirkaProgramResil) v izvozu in uvozu (tudi
//     stara oblika "delno (60 od 81 celic)");
//   - podatki kartice uganke v seznamu (zbirkaKartica) - skupni za igro in reševalec;
//   - moje reševanje v igri (igrano/izpolnjeno/napaka, zbirkaShraniIgranje) proti
//     programovemu (nazadnje = "Ocenjeno", reseno = "Program rešil"), prikaz v dveh
//     vrsticah in izvoz/uvoz obojega (uvoz bere tudi stari imeni "Nazadnje rešeno"
//     in "Rešeno" ter stari obliki stanja "45 od 81" in "izpolnjena z napako");
//   - stanje uganke (zbirkaStanjeUganke, zbirkaPovzetekIgre, zbirkaKazalecZapisa):
//     tri stanja nova / v teku / rešena, števec "12/57" (moji vpisi / prazne celice),
//     podoznaka "· napaka" pri polni mreži z napako, gumb iz istega vira; shranjena
//     igra ima prednost pred zapisom v zbirki, brez nje je gumb "Igraj"; ponovno
//     reševanje rešene uganke ("rešena … · znova v teku (12/57)").
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
    'zbirkaStanjeUganke', 'zbirkaPovzetekIgre', 'zbirkaPovzetekZapisa', 'zbirkaKazalecZapisa',
    'zbirkaPrikazCasov', 'zbirkaNamigCasov', 'zbirkaShraniIgranje',
    'zbirkaZaSeznam', 'zbirkaVrsticaIgranja', 'PRIMERI', 'zbirkaPrimerZa', 'zbirkaProgramResil',
    'zbirkaKartica', 'zbirkaUvozi', 'zbirkaIzbrisi', 'zbirkaIzbrisiVse', 'zbirkaVprasanjeIzbrisi',
    'zbirkaVprasanjeIzbrisiVse', 'igreBeri', 'IGRA_KLJUC', 'ZBIRKA_KLJUC'],
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
  assert.equal(E.zbirkaIzvor('vgrajeni primer'), '', 'primeri niso del zbirke, izvora zanje ni');
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

// Prazne celice in rešitev testne uganke - za zapis "v teku (12/57)" in za poteze.
const danih = danosti.replace(/0/g, '').length;
const praznih = 81 - danih;
const prazne = [...danosti].map((ch, c) => (ch === '0' ? c : -1)).filter(c => c >= 0);
const resitev = [...E.solve(danosti).board.grid];
assert.ok(resitev.every(v => v !== 0), 'solve() mora testno uganko rešiti v celoti');
// Poteze, ki vpišejo pravilne števke v prvih n praznih celic.
const vpisi = n => prazne.slice(0, n).map(c => ({ tip: 'vpis', celica: c, stevka: resitev[c] }));
// Vse prazne celice izpolnjene, zadnja z napačno števko.
const vpisiZNapako = () => vpisi(praznih).map((p, i) =>
  (i === praznih - 1 ? { ...p, stevka: p.stevka % 9 + 1 } : p));
const cas = '2026-09-22 10:05';
// Kopija iz vm konteksta (deepEqual zahteva objekt iz tega realma).
const stanje = (z, povzetek) => ({ ...E.zbirkaStanjeUganke(danosti, z, povzetek) });
const zapisIgre = (poteze, dodatno = {}) => ({ poteze, kazalec: poteze.length, ...dodatno });
const povzetekIgre = (poteze, dodatno) => E.zbirkaPovzetekZapisa(danosti, zapisIgre(poteze, dodatno));

test('zbirkaStanjeUganke() iz zapisa v zbirki: tri stanja, "12/57", podoznaka napaka', () => {
  const z = dodatno => ({ danosti, ...dodatno });
  const nova = stanje(z({}));
  assert.equal(nova.kljuc, 'nova');
  assert.equal(nova.besedilo, 'nova');
  assert.equal(nova.gumb, 'Igraj');
  assert.equal(stanje(z({ izpolnjeno: 45 })).kljuc, 'nova',
    'brez časa reševanja je uganka nova, tudi če ima število celic iz uvoza');

  // izpolnjeno šteje tudi danosti, prikaz samo moje vpise.
  const vTeku = stanje(z({ igrano: cas, izpolnjeno: danih + 12 }));
  assert.equal(vTeku.kljuc, 'v-teku');
  assert.equal(vTeku.besedilo, `v teku (12/${praznih})`);
  assert.equal(vTeku.napredek, vTeku.besedilo);
  assert.equal(vTeku.napaka, false);
  assert.equal(vTeku.vpisanih, 12);
  assert.equal(vTeku.praznih, praznih);

  const resena = stanje(z({ igrano: cas, izpolnjeno: 81 }));
  assert.equal(resena.kljuc, 'resena');
  assert.equal(resena.besedilo, 'rešena');
  assert.equal(resena.resena, cas, 'čas prve rešitve');

  // Polna mreža z napako ni četrto stanje, ampak "v teku" s podoznako.
  const napaka = stanje(z({ igrano: cas, izpolnjeno: 81, napaka: true }));
  assert.equal(napaka.kljuc, 'v-teku');
  assert.equal(napaka.napaka, true);
  assert.equal(napaka.napredek, `v teku (${praznih}/${praznih})`);
  assert.equal(napaka.besedilo, `v teku (${praznih}/${praznih}) · napaka`);
  assert.equal(napaka.resena, null);
  // Napaka pri nepolni mreži se ne kaže (uganka je preprosto v teku).
  assert.equal(stanje(z({ igrano: cas, izpolnjeno: danih + 3, napaka: true })).besedilo, `v teku (3/${praznih})`);

  // Brez shranjene igre (npr. uvoz z druge naprave) ni česa nadaljevati: gumb je "Igraj".
  assert.equal(vTeku.gumb, 'Igraj');
  assert.equal(resena.gumb, 'Igraj');
  assert.equal(napaka.gumb, 'Igraj');
  // Stari zapis z manj izpolnjenimi celicami, kot je danosti (uvoz "0 od 81"), ne da negativnega števca.
  assert.equal(stanje(z({ igrano: cas, izpolnjeno: 0 })).besedilo, `v teku (0/${praznih})`);
});

test('zbirkaPovzetekIgre(): vpisi, prazne celice, polna mreža in napaka', () => {
  const p = E.zbirkaPovzetekIgre(danosti, vpisi(5), 5);
  assert.deepEqual({ ...p }, { zaceta: true, vpisanih: 5, praznih, izpolnjeno: danih + 5, polna: false, napaka: false });
  // Kazalec: odigrane so samo poteze do njega, zgodovina pa vseeno pomeni začeto igro.
  assert.equal(E.zbirkaPovzetekIgre(danosti, vpisi(5), 2).vpisanih, 2);
  assert.equal(E.zbirkaPovzetekIgre(danosti, vpisi(5), 0).zaceta, true);
  assert.equal(E.zbirkaPovzetekIgre(danosti, [], 0).zaceta, false);
  // Brisanje vpisa in odstranjen kandidat.
  const c = prazne[0];
  assert.equal(E.zbirkaPovzetekIgre(danosti, [...vpisi(1), { tip: 'vpis', celica: c, stevka: 0 }], 2).vpisanih, 0);
  assert.equal(E.zbirkaPovzetekIgre(danosti, [{ tip: 'kandidat', celica: c, stevka: resitev[c], odstrani: true }], 1).vpisanih, 0);

  const polna = E.zbirkaPovzetekIgre(danosti, vpisi(praznih), praznih);
  assert.equal(polna.polna, true);
  assert.equal(polna.izpolnjeno, 81);
  assert.equal(polna.napaka, false);
  assert.equal(E.zbirkaPovzetekIgre(danosti, vpisiZNapako(), praznih).napaka, true, 'rešitev se poišče sama');
  // Z rešitvijo se napaka preveri tudi pri nepolni mreži (za zapis v zbirki).
  const napacen = [{ tip: 'vpis', celica: c, stevka: resitev[c] % 9 + 1 }];
  assert.equal(E.zbirkaPovzetekIgre(danosti, napacen, 1, resitev).napaka, true);
  assert.equal(E.zbirkaPovzetekIgre(danosti, napacen, 1).napaka, false, 'brez rešitve samo pri polni mreži');
});

test('zbirkaKazalecZapisa(): kot ob odprtju igre', () => {
  assert.equal(E.zbirkaKazalecZapisa({ poteze: vpisi(3), kazalec: 2 }), 2, 'delno razveljavljeno ostane');
  assert.equal(E.zbirkaKazalecZapisa({ poteze: vpisi(3), kazalec: 0 }), 3, '"vse razveljavljeno" se vrne na konec');
  assert.equal(E.zbirkaKazalecZapisa({ poteze: vpisi(3), kazalec: 0, znova: true }), 0, 'po "Začni znova" ostane 0');
  assert.equal(E.zbirkaKazalecZapisa({ poteze: vpisi(3) }), 3, 'brez kazalca: konec zgodovine');
  assert.equal(E.zbirkaKazalecZapisa({ poteze: vpisi(3), kazalec: 9 }), 3);
  assert.equal(E.zbirkaKazalecZapisa(null), 0);
});

test('zbirkaStanjeUganke() iz shranjene igre: napis in gumb iz istega vira', () => {
  // Zapis igre brez poteze (uganka je bila samo odprta) je nova.
  const odprta = stanje(null, povzetekIgre([]));
  assert.equal(odprta.kljuc, 'nova');
  assert.equal(odprta.gumb, 'Igraj');

  // Samo odstranjen kandidat je že poteza: v teku (0/57).
  const c = prazne[0];
  const kandidat = stanje(null, povzetekIgre([{ tip: 'kandidat', celica: c, stevka: resitev[c], odstrani: true }]));
  assert.equal(kandidat.besedilo, `v teku (0/${praznih})`);
  assert.equal(kandidat.gumb, 'Nadaljuj');

  const vTeku = stanje(null, povzetekIgre(vpisi(12)));
  assert.equal(vTeku.besedilo, `v teku (12/${praznih})`);
  assert.equal(vTeku.gumb, 'Nadaljuj');

  const resena = stanje(null, povzetekIgre(vpisi(praznih)));
  assert.equal(resena.kljuc, 'resena');
  assert.equal(resena.gumb, 'Poglej');

  const napaka = stanje(null, povzetekIgre(vpisiZNapako()));
  assert.equal(napaka.kljuc, 'v-teku');
  assert.equal(napaka.besedilo, `v teku (${praznih}/${praznih}) · napaka`);
  assert.equal(napaka.gumb, 'Nadaljuj');

  // Kazalec kot ob odprtju: "vse razveljavljeno" šteje do konca, po "Začni znova" nič.
  assert.equal(stanje(null, povzetekIgre(vpisi(3), { kazalec: 0 })).besedilo, `v teku (3/${praznih})`);
  assert.equal(stanje(null, povzetekIgre(vpisi(3), { kazalec: 0, znova: true })).besedilo, `v teku (0/${praznih})`);
});

test('zbirkaStanjeUganke(): shranjena igra ima prednost pred zapisom v zbirki', () => {
  const z = { danosti, igrano: cas, izpolnjeno: danih + 40, napaka: false };
  assert.equal(stanje(z, povzetekIgre(vpisi(3))).besedilo, `v teku (3/${praznih})`);
  // Igra brez poteze ne šteje - velja zapis (a gumb je "Igraj", ni česa nadaljevati).
  const brezPoteze = stanje(z, povzetekIgre([]));
  assert.equal(brezPoteze.besedilo, `v teku (40/${praznih})`);
  assert.equal(brezPoteze.gumb, 'Igraj');

  // Rešena uganka, ki jo po "Začni znova" rešujem znova: zapis je zamrznjen, igra v teku.
  const resenZapis = { danosti, igrano: '2026-09-21 17:48', izpolnjeno: 81, napaka: false };
  const znova = stanje(resenZapis, povzetekIgre(vpisi(12)));
  assert.equal(znova.kljuc, 'v-teku');
  assert.equal(znova.besedilo, `v teku (12/${praznih})`);
  assert.equal(znova.gumb, 'Nadaljuj', 'napis in gumb iz istega pogoja');
  assert.equal(znova.resena, '2026-09-21 17:48', 'čas prve rešitve ostane');
  const spetResena = stanje(resenZapis, povzetekIgre(vpisi(praznih)));
  assert.equal(spetResena.kljuc, 'resena');
  assert.equal(spetResena.gumb, 'Poglej');
});

test('zbirkaPrikazCasov(): dve vrstici, brez reševanja samo prva', () => {
  const z = { danosti, dodano: '2026-09-21 16:33', igrano: cas, izpolnjeno: danih + 12, nazadnje: '2026-09-21 16:33' };
  const casi = E.zbirkaPrikazCasov(z);
  assert.equal(casi.dodana, 'dodana 21. 9. 2026 ob 16:33');
  assert.equal(casi.igranje.predpona, 'zadnje reševanje 22. 9. 2026 ob 10:05');
  assert.equal(casi.igranje.besedilo, `v teku (12/${praznih})`);
  assert.equal(casi.igranje.kljuc, 'v-teku');
  assert.equal(casi.igranje.napaka, false);
  assert.equal(E.zbirkaVrsticaIgranja(z), `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (12/${praznih})`);
  // Čas, ko je uganko ocenil program, v seznamu ni - je samo v namigu miške.
  assert.ok(!(casi.dodana + ' ' + E.zbirkaVrsticaIgranja(z)).includes('ocenjeno'));
  assert.ok(E.zbirkaNamigCasov(z).includes('Ocenjeno: 21. 9. 2026 ob 16:33'), 'namig v isti obliki kot seznam');
  assert.ok(E.zbirkaNamigCasov(z).includes('Dodano: 21. 9. 2026 ob 16:33'));
  assert.ok(E.zbirkaNamigCasov(z).includes(`Stanje: v teku (12/${praznih})`));
  // Iz shranjene igre: napredek iz potez, čas še vedno iz zapisa.
  assert.equal(E.zbirkaVrsticaIgranja(z, povzetekIgre(vpisi(3))), `zadnje reševanje 22. 9. 2026 ob 10:05 · v teku (3/${praznih})`);

  const brez = { danosti, dodano: '2026-09-21 16:33' };
  assert.equal(E.zbirkaPrikazCasov(brez).igranje, null, 'uganke še nisem igral - druge vrstice ni');
  assert.equal(E.zbirkaVrsticaIgranja(brez), '');
  assert.equal(E.zbirkaVrsticaIgranja(brez, povzetekIgre([])), '', 'samo odprta uganka');
  assert.equal(E.zbirkaPrikazCasov(null).dodana, '—');
});

test('zbirkaPrikazCasov(): rešena, znova v teku in polna mreža z napako', () => {
  const z = { danosti, dodano: '2026-09-21 16:33', igrano: '2026-09-21 17:48', izpolnjeno: 81 };
  const i = E.zbirkaPrikazCasov(z).igranje;
  assert.equal(i.predpona, '', 'pri rešeni uganki ni "zadnje reševanje"');
  assert.equal(i.besedilo, 'rešena 21. 9. 2026 ob 17:48');
  assert.equal(i.kljuc, 'resena');
  assert.equal(E.zbirkaVrsticaIgranja(z), 'rešena 21. 9. 2026 ob 17:48');

  // Po "Začni znova": čas prve rešitve ostane, doda se napredek ponovnega reševanja.
  const znova = E.zbirkaPrikazCasov(z, povzetekIgre(vpisi(12))).igranje;
  assert.equal(znova.predpona, 'rešena 21. 9. 2026 ob 17:48');
  assert.equal(znova.besedilo, `znova v teku (12/${praznih})`);
  assert.equal(znova.kljuc, 'v-teku');
  assert.equal(E.zbirkaVrsticaIgranja(z, povzetekIgre(vpisiZNapako())),
    `rešena 21. 9. 2026 ob 17:48 · znova v teku (${praznih}/${praznih}) · napaka`);
  assert.ok(E.zbirkaNamigCasov(z, povzetekIgre(vpisi(12))).includes(`Stanje: rešena, znova v teku (12/${praznih})`));

  // Polna mreža z napako ostane pri paru "zadnje reševanje ... · stanje" s podoznako.
  const napaka = E.zbirkaPrikazCasov({ ...z, napaka: true }).igranje;
  assert.equal(napaka.predpona, 'zadnje reševanje 21. 9. 2026 ob 17:48');
  assert.equal(napaka.besedilo, `v teku (${praznih}/${praznih})`);
  assert.equal(napaka.napaka, true);
  assert.equal(E.zbirkaVrsticaIgranja({ ...z, napaka: true }),
    `zadnje reševanje 21. 9. 2026 ob 17:48 · v teku (${praznih}/${praznih}) · napaka`);
});

test('zbirkaShraniIgranje(): zapiše moje reševanje, uganke izven zbirke ne doda', () => {
  shramba.clear();
  const { board, log } = E.solve(danosti);
  E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Lahka', izvor: 'generator' });

  assert.equal(E.zbirkaShraniIgranje(danosti, cas, danih + 12, false), true);
  let z = E.zbirkaBeri()[0];
  assert.equal(z.igrano, cas);
  assert.equal(z.izpolnjeno, danih + 12, 'v zapisu ostane število izpolnjenih celic (z danostmi)');
  assert.equal(z.napaka, false);
  assert.equal(E.zbirkaStanjeUganke(danosti, z).besedilo, `v teku (12/${praznih})`);
  // Program in igralec sta ločena: podatki solve() ostanejo nedotaknjeni.
  assert.equal(z.reseno, 81);
  assert.equal(z.nazadnje, z.dodano);

  // Enak zapis se ne shranjuje znova.
  assert.equal(E.zbirkaShraniIgranje(danosti, cas, danih + 12, false), false);
  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-22 10:31', 81, true), true);
  z = E.zbirkaBeri()[0];
  assert.equal(E.zbirkaStanjeUganke(danosti, z).besedilo, `v teku (${praznih}/${praznih}) · napaka`);

  // Uganka, ki je v zbirki ni (npr. vgrajeni primer), se ne doda.
  assert.equal(E.zbirkaShraniIgranje(danosti.replace('8', '0'), '2026-09-22 11:00', 30, false), false);
  assert.equal(E.zbirkaBeri().length, 1);
});

test('zbirkaShraniIgranje(): zapis rešene uganke je zamrznjen', () => {
  shramba.clear();
  const { board, log } = E.solve(danosti);
  E.zbirkaShraniResitev(danosti, board, log, { tezavnost: 'Lahka', izvor: 'generator' });

  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-21 17:48', 81, false), true);
  assert.equal(E.zbirkaStanjeUganke(danosti, E.zbirkaBeri()[0]).besedilo, 'rešena');

  // Nadaljnje reševanje (npr. po "Začni znova") časa in stanja ne spremeni.
  assert.equal(E.zbirkaShraniIgranje(danosti, '2026-09-23 09:00', 30, false), false);
  const z = E.zbirkaBeri()[0];
  assert.equal(z.igrano, '2026-09-21 17:48', 'ohrani se čas prve rešitve');
  assert.equal(z.izpolnjeno, 81);
  assert.equal(E.zbirkaStanjeUganke(danosti, z).besedilo, 'rešena');
});

test('izvoz in uvoz: Zadnje reševanje, Stanje ("12/57", "· napaka"), Ocenjeno in Program rešil', () => {
  const d2 = danosti.replace('8', '0');
  const d3 = danosti.replace('7', '0');
  const zbirka = [
    { danosti, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-21 16:33',
      igrano: cas, izpolnjeno: danih + 12, napaka: false,
      nazadnje: '2026-09-21 16:40', reseno: 81, koraki: 34, ugibanje: 0, tehnike: [], opomba: '' },
    { danosti: d2, tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-09-21 17:00',
      igrano: '2026-09-22 11:00', izpolnjeno: 81, napaka: true, nazadnje: '', opomba: '' },
    { danosti: d3, tezavnost: 'Težka', izvor: '', dodano: '2026-09-21 18:00',
      igrano: '2026-09-22 12:00', izpolnjeno: 81, napaka: false, nazadnje: '', opomba: '' },
  ];
  const md = E.zbirkaVMarkdown(zbirka);
  assert.ok(md.includes(`- **Zadnje reševanje:** ${cas}`));
  assert.ok(md.includes(`- **Stanje:** v teku (12/${praznih})`), md);
  assert.ok(md.includes(`- **Stanje:** v teku (${praznih + 1}/${praznih + 1}) · napaka`), md);
  assert.ok(md.includes('- **Stanje:** rešena'));
  assert.ok(!md.includes('od 81)'), 'stara oblika števca se ne izvaža več');
  assert.ok(!md.includes('izpolnjena z napako'), 'staro stanje se ne izvaža več');
  assert.ok(md.includes('- **Ocenjeno:** 2026-09-21 16:40'));
  assert.ok(md.includes('- **Program rešil:** v celoti'));
  assert.ok(!md.includes('- **Nazadnje rešeno:**'), 'staro ime se ne izvaža več');
  assert.ok(!md.includes('- **Rešeno:**'), 'staro ime se ne izvaža več');

  const { zapisi, neveljavni } = E.zbirkaIzMarkdowna(md);
  assert.equal(neveljavni, 0);
  assert.equal(zapisi.length, 3);
  const [a, b, c] = [...zapisi];
  assert.equal(a.igrano, cas);
  assert.equal(a.izpolnjeno, danih + 12, 'iz "12/57" nazaj v izpolnjene celice');
  assert.equal(a.napaka, false);
  assert.equal(a.nazadnje, '2026-09-21 16:40');
  assert.equal(a.reseno, 81);
  assert.equal(b.izpolnjeno, 81);
  assert.equal(b.napaka, true, '"· napaka" nazaj v napako');
  assert.equal(E.zbirkaStanjeUganke(d2, b).besedilo, `v teku (${praznih + 1}/${praznih + 1}) · napaka`);
  assert.equal(E.zbirkaStanjeUganke(d3, c).besedilo, 'rešena');
});

test('uvoz: stari obliki stanja "45 od 81" in "izpolnjena z napako" se še bereta', () => {
  const vrstice = st => [
    '- **Danosti:** `' + danosti.replace(/0/g, '.') + '`',
    `- **Zadnje reševanje:** ${cas}`,
    `- **Stanje:** ${st}`,
  ].join('\n');
  const staro = [...E.zbirkaIzMarkdowna(vrstice('v teku (45 od 81)')).zapisi][0];
  assert.equal(staro.izpolnjeno, 45, 'stara oblika je štela vse izpolnjene celice');
  assert.equal(staro.napaka, false);
  assert.equal(E.zbirkaStanjeUganke(danosti, staro).besedilo, `v teku (${45 - danih}/${praznih})`);
  const napaka = [...E.zbirkaIzMarkdowna(vrstice('izpolnjena z napako')).zapisi][0];
  assert.equal(napaka.izpolnjeno, 81);
  assert.equal(napaka.napaka, true);
  assert.equal(E.zbirkaStanjeUganke(danosti, napaka).besedilo, `v teku (${praznih}/${praznih}) · napaka`);
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
  assert.equal(E.zbirkaStanjeUganke(danosti, z).besedilo, 'nova');
});

test('uvoz: čas reševanja brez vrstice Stanje', () => {
  const md = [
    '- **Danosti:** `' + danosti.replace(/0/g, '.') + '`',
    `- **Zadnje reševanje:** ${cas}`,
  ].join('\n');
  const z = [...E.zbirkaIzMarkdowna(md).zapisi][0];
  assert.equal(z.igrano, cas);
  assert.equal(E.zbirkaStanjeUganke(danosti, z).besedilo, `v teku (0/${praznih})`);
});

test('zbirkaZaSeznam(): po mojem zadnjem dogodku - reševanju, sicer dodajanju', () => {
  const zbirka = [
    { danosti: 'a', dodano: '2026-09-10 10:00', igrano: '2026-09-20 08:00', nazadnje: '2026-09-22 23:00' },
    { danosti: 'b', dodano: '2026-09-21 16:33' },
    { danosti: 'c', dodano: '2026-09-11 10:00', igrano: '2026-09-22 10:05' },
    { danosti: 'd', dodano: '2026-09-19 09:00' },
  ];
  assert.deepEqual([...E.zbirkaZaSeznam(zbirka)].map(z => z.danosti), ['c', 'b', 'a', 'd']);
  // Čas, ko je uganko ocenil program (nazadnje), na vrstni red ne vpliva.
  assert.deepEqual([...E.zbirkaZaSeznam([...zbirka].reverse())].map(z => z.danosti), ['c', 'b', 'a', 'd']);

  // Pravkar dodana uganka, ki je še nisem igral, mora biti na vrhu - sicer je v
  // daljši zbirki pod vsemi reševanimi in je videti, kot da je sploh ni.
  const nova = { danosti: 'nova', dodano: '2026-09-22 19:30' };
  assert.equal([...E.zbirkaZaSeznam([...zbirka, nova])][0].danosti, 'nova');
});

/* ---------- vgrajeni primeri niso del zbirke ---------- */

test('zbirkaPrimerZa(): primer po danostih, s piko ali ničlo', () => {
  const p = E.PRIMERI[2];
  assert.equal(E.zbirkaPrimerZa(p.danosti).ime, p.ime);
  assert.equal(E.zbirkaPrimerZa(p.danosti.replace(/\./g, '0')).ime, p.ime);
  assert.equal(E.zbirkaPrimerZa(danosti), null);
});

// Danosti primera v notranji obliki ('0' = prazna celica).
const danostiPrimera = i => E.PRIMERI[i].danosti.replace(/\./g, '0');
const igra = (poteze = 1) => ({ poteze: Array.from({ length: poteze }, () => ({ tip: 'kandidat', celica: 0, stevka: 1, odstrani: true })), kazalec: poteze });

test('zbirkaBeri(): stari zapisi primerov se odstranijo, igra primera ostane', () => {
  shramba.clear();
  const d = danostiPrimera(4);
  shramba.set(E.ZBIRKA_KLJUC, JSON.stringify([
    { danosti: d, tezavnost: 'Lahka', izvor: 'primer', dodano: '2026-09-20 10:00' },
    { danosti: danostiPrimera(0), tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-09-20 10:30' },
    { danosti, tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-09-20 11:00' },
  ]));
  shramba.set(E.IGRA_KLJUC, JSON.stringify({ zadnja: d, igre: { [d]: igra() } }));

  const zbirka = [...E.zbirkaBeri()];
  assert.deepEqual(zbirka.map(z => z.danosti), [danosti], 'ostane samo navadna uganka');
  assert.equal(JSON.parse(shramba.get(E.ZBIRKA_KLJUC)).length, 1, 'zbirka je enkrat prepisana brez primerov');
  assert.ok(E.igreBeri().igre[d], 'napredek igranja primera ostane');
  assert.equal(E.igreBeri().zadnja, d);
});

test('primer se ne shrani: zbirkaShraniResitev in uvoz ga preskočita', () => {
  shramba.clear();
  const d = danostiPrimera(4);
  const { board, log } = E.solve(d);
  assert.equal(E.zbirkaShraniResitev(d, board, log, { izvor: 'rocno' }), null);
  assert.equal(E.zbirkaBeri().length, 0);
  assert.equal(shramba.has(E.ZBIRKA_KLJUC), false, 'v shrambo se nič ne zapiše');

  // Uvoz (npr. star izvoz z zapisi primerov ali docs/uganke.md) primere preskoči.
  const md = [
    `- **Danosti:** \`${E.PRIMERI[4].danosti}\``, '- **Izvor:** vgrajeni primer', '',
    `- **Danosti:** \`${danosti.replace(/0/g, '.')}\``, '- **Težavnost:** Težka',
  ].join('\n');
  assert.equal(E.zbirkaIzMarkdowna(md).primerov, 1);
  const u = E.zbirkaUvozi(md);
  assert.equal(u.napaka, false, u.sporocilo);
  assert.match(u.sporocilo, /novih: 1 .*vgrajenih primerov \(niso del zbirke, preskočenih\): 1/);
  assert.deepEqual([...E.zbirkaBeri()].map(z => z.danosti), [danosti]);
  // Datoteka s samimi primeri ni "brez ugank" - pove, da so preskočeni.
  shramba.clear();
  const samo = E.zbirkaUvozi(`- **Danosti:** \`${E.PRIMERI[1].danosti}\``);
  assert.match(samo.sporocilo, /novih: 0 .*preskočenih\): 1/);
  assert.equal(E.zbirkaBeri().length, 0);
});

/* ---------- brisanje ---------- */

// Zbirka z dvema ugankama in shranjene igre obeh ter enega primera.
const druga = loadPuzzles()[3].danosti.replace(/\./g, '0');
// Sirota: shranjena igra uganke, ki je v zbirki ni (izbrisana pred novim modelom).
const sirota = loadPuzzles()[4].danosti.replace(/\./g, '0');
// Zbirka z dvema ugankama, shranjene igre obeh, sirote in dveh primerov. Vrne
// danosti primerov (urejene).
function zbirkaZIgrami(zadnja) {
  shramba.clear();
  const p = [danostiPrimera(4), danostiPrimera(0)];
  shramba.set(E.ZBIRKA_KLJUC, JSON.stringify([
    { danosti, tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-20 10:00' },
    { danosti: druga, tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-21 10:00' },
  ]));
  shramba.set(E.IGRA_KLJUC, JSON.stringify({ zadnja,
    igre: { [danosti]: igra(), [druga]: igra(2), [sirota]: igra(), [p[0]]: igra(3), [p[1]]: igra() } }));
  return p.sort();
}

test('zbirkaIzbrisi(): zapis in shranjena igra te uganke, drugo ostane', () => {
  const p = zbirkaZIgrami(danosti);
  assert.equal(E.zbirkaIzbrisi(danosti), true);
  assert.deepEqual([...E.zbirkaBeri()].map(z => z.danosti), [druga]);
  const igre = E.igreBeri();
  assert.deepEqual(Object.keys(igre.igre).sort(), [druga, sirota, ...p].sort(), 'igra izbrisane uganke je odstranjena, druge ostanejo');
  assert.equal(igre.zadnja, null, 'zadnja igra je bila izbrisana - ob zagonu je mreža prazna');

  // Zadnja igra, ki ni izbrisana, ostane zadnja.
  zbirkaZIgrami(druga);
  E.zbirkaIzbrisi(danosti);
  assert.equal(E.igreBeri().zadnja, druga);
});

test('zbirkaIzbrisiVse(): vsa zbirka in vse igre razen iger primerov (tudi sirote)', () => {
  const p = zbirkaZIgrami(sirota);
  const r = E.zbirkaIzbrisiVse();
  assert.deepEqual({ ...r }, { stevilo: 2, ok: true });
  assert.equal(E.zbirkaBeri().length, 0);
  const igre = E.igreBeri();
  assert.deepEqual(Object.keys(igre.igre).sort(), p, 'ostanejo samo igre primerov');
  assert.equal(igre.zadnja, null, 'zadnja igra (sirota) je izbrisana');
});

test('besedili potrditve brisanja', () => {
  assert.equal(E.zbirkaVprasanjeIzbrisi({ dodano: '2026-09-21 16:33', tezavnost: 'Težka' }),
    'Izbrišem uganko, dodano 21. 9. 2026 ob 16:33 (Težka)? Izbriše se tudi njen shranjeni napredek.');
  const v = E.zbirkaVprasanjeIzbrisiVse(58);
  assert.ok(v.includes('(58)'), 'navede število ugank');
  assert.ok(v.includes('ves shranjeni napredek'), 'izbriše ves napredek, tudi sirote');
  assert.ok(v.includes('Vgrajeni primeri in napredek pri njih ostanejo'));
  assert.ok(v.includes('najprej izvoziš'), 'priporoči izvoz');
});

/* ---------- števec programa ---------- */

test('zbirkaProgramResil(): "v celoti" ali "delno (36/57)" - samo prazne celice', () => {
  assert.equal(E.zbirkaProgramResil({ danosti, reseno: 81 }), 'v celoti');
  assert.equal(E.zbirkaProgramResil({ danosti, reseno: danih + 36 }), `delno (36/${praznih})`);
  assert.equal(E.zbirkaProgramResil({ danosti, reseno: null }), '');
  assert.equal(E.zbirkaProgramResil({ danosti }), '');

  const z = { danosti, dodano: '2026-09-21 16:33', reseno: danih + 36 };
  const md = E.zbirkaVMarkdown([z]);
  assert.ok(md.includes(`- **Program rešil:** delno (36/${praznih})`), md);
  assert.ok(!md.includes('od 81'), 'stara oblika se ne izvaža več');
  assert.equal([...E.zbirkaIzMarkdowna(md).zapisi][0].reseno, danih + 36, 'iz "36/57" nazaj v izpolnjene celice');
  // Stara oblika "delno (60 od 81 celic)" se še bere.
  const staro = ['- **Danosti:** `' + danosti.replace(/0/g, '.') + '`', '- **Program rešil:** delno (60 od 81 celic)'].join('\n');
  assert.equal([...E.zbirkaIzMarkdowna(staro).zapisi][0].reseno, 60);
});

/* ---------- kartica uganke ---------- */

test('zbirkaKartica(): tri vrstice, gumb iz istega stanja', () => {
  const z = { danosti, tezavnost: 'Težka', izvor: 'generator', dodano: '2026-09-21 16:33',
    reseno: 81, koraki: 42, ugibanje: 1, tehnike: [['Poskus in protislovje (V1S1 = 5)', 1]], opomba: 'op' };
  const k = E.zbirkaKartica(danosti, z, null);
  assert.equal(k.primer, null);
  assert.equal(k.naslov, 'Težka · ustvaril generator · dodana 21. 9. 2026 ob 16:33');
  assert.deepEqual({ ...k.stanje }, { predpona: '', besedilo: 'nova', kljuc: 'nova', napaka: false }, 'nova uganka ima 2. vrstico');
  assert.equal(k.info, `danih ${danih} · tehnike: samo enojčki + poskus · 42 korakov`, 'ugibanje je "+ poskus"');
  assert.equal(k.opomba, 'op');
  assert.equal(k.gumb, 'Igraj');
  assert.ok(k.namig.startsWith('Dodano: 21. 9. 2026 ob 16:33'));

  // V teku iz shranjene igre: stanje in gumb iz istega vira.
  const vTeku = E.zbirkaKartica(danosti, { ...z, igrano: cas, izpolnjeno: danih + 2 }, povzetekIgre(vpisi(3)));
  assert.equal(vTeku.stanje.predpona, 'zadnje reševanje 22. 9. 2026 ob 10:05');
  assert.equal(vTeku.stanje.besedilo, `v teku (3/${praznih})`);
  assert.equal(vTeku.gumb, 'Nadaljuj');

  // Brez težavnosti in izvora; delna rešitev programa.
  const brez = E.zbirkaKartica(danosti, { danosti, dodano: '2026-09-21 16:33', reseno: danih + 36, koraki: 1 }, null);
  assert.equal(brez.naslov, 'težavnost ni določena · dodana 21. 9. 2026 ob 16:33');
  assert.equal(brez.info, `danih ${danih} · tehnike: ni podatkov · 1 korak · program rešil delno (36/${praznih})`);
});

test('zbirkaKartica(): vgrajeni primer (brez zapisa)', () => {
  const p = E.PRIMERI[4];
  const d = p.danosti.replace(/\./g, '0');
  const danihP = d.replace(/0/g, '').length;
  const brez = E.zbirkaKartica(d, null, null);
  assert.equal(brez.primer, p.ime);
  assert.equal(brez.naslov, p.ime);
  assert.equal(brez.stanje.besedilo, 'nova');
  assert.equal(brez.info, `danih ${danihP}`, 'brez zapisa ni podatkov reševanja');
  assert.equal(brez.namig, '');
});
