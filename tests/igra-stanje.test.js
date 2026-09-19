'use strict';
// Testi stanja igre (igra/stanje.js): odigravanje potez, samodejni in ročno odstranjeni
// kandidati, dovoljene poteze, razveljavi/ponovi, zapis za shrambo.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine, loadPuzzles } = require('./load-engine.js');

const E = loadEngine(undefined, {
  files: ['igra/stanje.js'],
  names: ['novaIgra', 'stanjeIgre', 'mozneAkcije', 'dodajPotezo', 'razveljavi', 'ponovi',
    'lahkoRazveljavi', 'lahkoPonovi', 'seManjka', 'manjkajoceVEnotah', 'steviloVpisanih', 'jeResena',
    'igraVZapis', 'igraIzZapisa', 'prvaNapaka', 'solutionOf', 'skupniKandidati'],
});

// Uganka, ki jo solve() reši v celoti brez ugibanja - njena rešitev je znana.
const uganka = loadPuzzles().find(p => p.ime === 'oakever-ekstrem-lv4');
const danosti = uganka.danosti.replace(/\./g, '0');
const resitev = [...E.solve(danosti).board.grid];
assert.ok(resitev.every(v => v !== 0), 'solve() mora uganko rešiti v celoti');

const bits = m => [...E.bitsOf(m)];
const prve = danosti.split('').map((ch, c) => c).filter(c => danosti[c] === '0');
// Prazna celica in njen sosed (prazen), ki imata skupnega kandidata.
function parSosedov(stanje) {
  for (const a of prve) for (const b of E.PEERS[a]) {
    if (danosti[b] !== '0') continue;
    const skupni = stanje.kandidati[a] & stanje.kandidati[b];
    if (skupni && E.popcount(stanje.kandidati[b]) > 1) return { a, b, d: bits(skupni)[0] };
  }
  throw new Error('ni para sosedov');
}

test('nova igra: kandidati so enaki kot new Board(danosti)', () => {
  const igra = E.novaIgra(danosti);
  const s = E.stanjeIgre(igra);
  const b = new E.Board(danosti);
  for (let c = 0; c < 81; c++) {
    assert.equal(s.grid[c], b.grid[c]);
    assert.equal(s.kandidati[c], b.grid[c] ? 0 : b.cand[c]);
  }
  const danih = danosti.replace(/0/g, '').length;
  assert.equal(E.steviloVpisanih(s), danih);
  const manjka = [...E.seManjka(s)];
  assert.equal(manjka.slice(1).reduce((x, y) => x + y, 0), 81 - danih);
  assert.equal(E.lahkoRazveljavi(igra), false);
  assert.equal(E.lahkoPonovi(igra), false);
});

test('vpis: dovoljen je samo kandidat prazne celice; sosedi izgubijo kandidata, brisanje ga vrne', () => {
  const igra = E.novaIgra(danosti);
  let s = E.stanjeIgre(igra);
  const { a, b, d } = parSosedov(s);
  const dana = danosti.indexOf(danosti.split('').find(ch => ch !== '0'));

  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: dana, stevka: 1 }), false, 'dane celice ni mogoče spremeniti');
  const ni = bits(E.FULL & ~s.kandidati[a])[0];
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: ni }), false, 'števke, ki ni kandidat, ni mogoče vpisati');
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: 0 }), false, 'prazne celice ni mogoče brisati');
  assert.equal(igra.poteze.length, 0);

  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: d }), true);
  s = E.stanjeIgre(igra);
  assert.equal(s.grid[a], d);
  assert.equal(s.vpisi[a], d);
  assert.equal(s.kandidati[b] & (1 << d), 0, 'sosed izgubi kandidata');
  const ak = E.mozneAkcije(s, a);
  assert.deepEqual([ak.vpis, ak.odstrani, ak.vrni, ak.zbrisi], [0, 0, 0, true]);
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: b, stevka: d }), false, 'kršitve pravil ni mogoče vpisati');

  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: 0 }), true);
  s = E.stanjeIgre(igra);
  assert.equal(s.grid[a], 0);
  assert.notEqual(s.kandidati[b] & (1 << d), 0, 'po brisanju se kandidat vrne');
});

test('ročno odstranjen kandidat: ostane odstranjen, vrniti ga je mogoče le, če bi ga celica sicer imela', () => {
  const igra = E.novaIgra(danosti);
  let s = E.stanjeIgre(igra);
  const { a, b, d } = parSosedov(s);

  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: b, stevka: d, odstrani: false }), false, 'vrniti ni česa');
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: b, stevka: d, odstrani: true }), true);
  s = E.stanjeIgre(igra);
  assert.equal(s.kandidati[b] & (1 << d), 0);
  assert.equal(s.deska.cand[b] & (1 << d), 0, 'motor vidi iste kandidate kot igralec');
  let ak = E.mozneAkcije(s, b);
  assert.equal(ak.vpis & (1 << d), 0, 'odstranjenega kandidata ni mogoče vpisati');
  assert.equal(ak.odstrani & (1 << d), 0);
  assert.notEqual(ak.vrni & (1 << d), 0);
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: b, stevka: d, odstrani: true }), false, 'dvakrat odstraniti ni mogoče');

  // Sosed dobi vpis d: kandidat je zdaj izločen samodejno, zato ga ni mogoče vrniti.
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: d }), true);
  s = E.stanjeIgre(igra);
  ak = E.mozneAkcije(s, b);
  assert.equal(ak.vrni & (1 << d), 0);
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: b, stevka: d, odstrani: false }), false);

  // Po brisanju vpisa ostane ročno odstranjen in ga je spet mogoče vrniti.
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: a, stevka: 0 }), true);
  s = E.stanjeIgre(igra);
  assert.equal(s.kandidati[b] & (1 << d), 0);
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: b, stevka: d, odstrani: false }), true);
  s = E.stanjeIgre(igra);
  assert.notEqual(s.kandidati[b] & (1 << d), 0);
});

test('razveljavi / ponovi po posameznih potezah; nova poteza odreže rep', () => {
  const igra = E.novaIgra(danosti);
  const cilji = prve.slice(0, 3);
  for (const c of cilji) assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: resitev[c] }), true);
  assert.equal(igra.kazalec, 3);

  E.razveljavi(igra);
  E.razveljavi(igra);
  let s = E.stanjeIgre(igra);
  assert.deepEqual(cilji.map(c => s.grid[c]), [resitev[cilji[0]], 0, 0]);
  assert.equal(E.lahkoPonovi(igra), true);

  E.ponovi(igra);
  s = E.stanjeIgre(igra);
  assert.deepEqual(cilji.map(c => s.grid[c]), [resitev[cilji[0]], resitev[cilji[1]], 0]);

  const drug = prve[5];
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: drug, stevka: resitev[drug] }), true);
  assert.equal(igra.poteze.length, 3);
  assert.equal(E.lahkoPonovi(igra), false, 'rep je odrezan');
  s = E.stanjeIgre(igra);
  assert.equal(s.grid[cilji[2]], 0);

  while (E.lahkoRazveljavi(igra)) E.razveljavi(igra);
  E.razveljavi(igra);
  assert.equal(igra.kazalec, 0);
});

test('zapis za shrambo: krožno ohrani poteze in "ponovi" rep; poškodovan zapis se odreže', () => {
  const igra = E.novaIgra(danosti);
  for (const c of prve.slice(0, 4)) E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: resitev[c] });
  const c5 = prve[6];
  const napacna = bits(E.stanjeIgre(igra).kandidati[c5]).find(d => d !== resitev[c5]);
  E.dodajPotezo(igra, { tip: 'kandidat', celica: c5, stevka: napacna, odstrani: true });
  E.razveljavi(igra);
  E.razveljavi(igra);

  const zapis = JSON.parse(JSON.stringify(E.igraVZapis(igra, null, '2026-09-18 10:00')));
  assert.equal(zapis.zacetek, '2026-09-18 10:00');
  const nazaj = E.igraIzZapisa(danosti, zapis);
  assert.equal(nazaj.kazalec, 3);
  assert.equal(nazaj.poteze.length, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(nazaj.poteze)), JSON.parse(JSON.stringify(igra.poteze)));
  assert.deepEqual([...E.stanjeIgre(nazaj).grid], [...E.stanjeIgre(igra).grid]);

  // Nedovoljena poteza (vpis v dano celico) prekine odigravanje; kazalec se omeji.
  const dana = danosti.split('').findIndex(ch => ch !== '0');
  zapis.poteze.splice(2, 0, { tip: 'vpis', celica: dana, stevka: 1 });
  zapis.kazalec = 5;
  const odrezan = E.igraIzZapisa(danosti, zapis);
  assert.equal(odrezan.poteze.length, 2);
  assert.equal(odrezan.kazalec, 2);
  assert.equal(E.igraIzZapisa(danosti, null).poteze.length, 0);
});

// Prazna celica (po vrsti iz `prve`, od indeksa `od`) z napačnim kandidatom.
function napacenKandidat(igra, od = 0) {
  const s = E.stanjeIgre(igra);
  for (const c of prve.slice(od)) {
    if (s.grid[c]) continue;
    const w = bits(s.kandidati[c]).find(d => d !== resitev[c]);
    if (w) return { c, w };
  }
  throw new Error('ni napačnega kandidata');
}
const vpis = (igra, c, d) => assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: d }), true, `vpis ${d} v ${E.cellLabel(c)}`);
const kand = (igra, c, d, odstrani) => assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: c, stevka: d, odstrani }), true);
// Celice brez napak za "polnilne" poteze (pravilni vpisi), ločene od celic z napakami.
const pravilne = prve.slice(40);

test('solutionOf: rešitev uganke je enaka rešitvi iz solve()', () => {
  assert.deepEqual([...E.solutionOf(danosti)], resitev);
});

test('prvaNapaka: pravilni vpisi in odstranjeni napačni kandidati niso napaka', () => {
  const igra = E.novaIgra(danosti);
  assert.equal(E.prvaNapaka(igra, resitev), null);
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  const { c, w } = napacenKandidat(igra);
  kand(igra, c, w, true);
  vpis(igra, pravilne[1], resitev[pravilne[1]]);
  assert.equal(E.prvaNapaka(igra, resitev), null);
});

test('prvaNapaka: napačen vpis - številka poteze; vrnitev pred njo da stanje brez napake, poteze ostanejo v "ponovi"', () => {
  const igra = E.novaIgra(danosti);
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  vpis(igra, pravilne[1], resitev[pravilne[1]]);
  const { c, w } = napacenKandidat(igra);
  vpis(igra, c, w); // poteza 3
  vpis(igra, pravilne[2], resitev[pravilne[2]]);
  vpis(igra, pravilne[3], resitev[pravilne[3]]);
  assert.equal(E.prvaNapaka(igra, resitev), 3);

  igra.kazalec = 3 - 1;
  assert.equal(E.prvaNapaka(igra, resitev), null);
  assert.equal(igra.poteze.length, 5);
  E.ponovi(igra);
  assert.equal(E.prvaNapaka(igra, resitev), 3, 'napaka v "ponovi" repu se ne šteje, dokler je ne ponoviš');
});

test('prvaNapaka: napaka, ki jo je igralec sam popravil, se ne šteje', () => {
  const igra = E.novaIgra(danosti);
  const { c, w } = napacenKandidat(igra);
  vpis(igra, c, w);
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  vpis(igra, c, 0);
  vpis(igra, c, resitev[c]);
  assert.equal(E.prvaNapaka(igra, resitev), null);
});

test('prvaNapaka: ročno odstranjen pravilni kandidat je napaka; ko ga vrneš, ni več', () => {
  const igra = E.novaIgra(danosti);
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  const c = prve.find(x => E.popcount(E.stanjeIgre(igra).kandidati[x]) > 1);
  kand(igra, c, resitev[c], true); // poteza 2
  vpis(igra, pravilne[1], resitev[pravilne[1]]);
  assert.equal(E.prvaNapaka(igra, resitev), 2);
  kand(igra, c, resitev[c], false);
  assert.equal(E.prvaNapaka(igra, resitev), null);

  // Odstrani, vrni in spet odstrani: šteje zadnja odstranitev. Nato napačen
  // vpis v to celico in njegovo brisanje - napaka je na mreži ves čas, od
  // poteze, ki je kandidata odstranila.
  const igra2 = E.novaIgra(danosti);
  kand(igra2, c, resitev[c], true); // poteza 1
  kand(igra2, c, resitev[c], false);
  kand(igra2, c, resitev[c], true); // poteza 3
  assert.equal(E.prvaNapaka(igra2, resitev), 3);
  const w = bits(E.stanjeIgre(igra2).kandidati[c])[0];
  vpis(igra2, c, w); // napačen vpis (pravilni kandidat je odstranjen)
  vpis(igra2, c, 0);
  assert.equal(E.prvaNapaka(igra2, resitev), 3, 'napaka je na mreži neprekinjeno od poteze 3');
});

test('prvaNapaka: več napak - šteje najzgodnejša, ki je od takrat neprekinjeno na mreži', () => {
  const igra = E.novaIgra(danosti);
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  const a = napacenKandidat(igra);
  vpis(igra, a.c, a.w); // poteza 2
  vpis(igra, pravilne[1], resitev[pravilne[1]]);
  const b = napacenKandidat(igra, prve.indexOf(a.c) + 1);
  vpis(igra, b.c, b.w); // poteza 4
  assert.equal(E.prvaNapaka(igra, resitev), 2);

  // Prvo napako popravi, druga ostane: stanje pred potezo 4 še vsebuje prvo
  // napako, zato je stanje brez napake šele pred potezo 2.
  vpis(igra, a.c, 0);
  assert.equal(E.prvaNapaka(igra, resitev), 2);
  // Druga napaka popravljena, nova napaka pozneje: šteje samo nova.
  vpis(igra, b.c, 0);
  vpis(igra, pravilne[2], resitev[pravilne[2]]);
  vpis(igra, a.c, a.w); // poteza 8
  assert.equal(E.prvaNapaka(igra, resitev), 8);
});

test('vpis celotne rešitve: uganka je rešena, števci so 0', () => {
  const igra = E.novaIgra(danosti);
  for (const c of prve) assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: resitev[c] }), true, `vpis v ${E.cellLabel(c)}`);
  const s = E.stanjeIgre(igra);
  assert.equal(E.jeResena(s), true);
  assert.deepEqual([...E.seManjka(s)], new Array(10).fill(0));
});

test('manjkajoceVEnotah: seznami vrstic, stolpcev in blokov sledijo vpisom, brisanju in razveljavi', () => {
  // Neodvisen izračun iz niza: števke 1..9, ki jih v enoti ni (bloki od leve proti desni, od zgoraj navzdol).
  const pricakovano = (niz) => {
    const vEnoti = (celice) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !celice.some(c => niz[c] === String(d)));
    const obseg = [...Array(9).keys()];
    return {
      vrstice: obseg.map(r => vEnoti(obseg.map(c => r * 9 + c))),
      stolpci: obseg.map(c => vEnoti(obseg.map(r => r * 9 + c))),
      bloki: obseg.map(b => vEnoti(obseg.map(i => (Math.floor(b / 3) * 3 + Math.floor(i / 3)) * 9 + (b % 3) * 3 + i % 3))),
    };
  };
  const vStevke = (m) => ({ vrstice: [...m.vrstice].map(bits), stolpci: [...m.stolpci].map(bits), bloki: [...m.bloki].map(bits) });
  const niz = (s) => s.grid.join('');

  const igra = E.novaIgra(danosti);
  let s = E.stanjeIgre(igra);
  assert.deepEqual(vStevke(E.manjkajoceVEnotah(s)), pricakovano(danosti), 'na začetku');

  // Vpis: števka izgine iz vrstice, stolpca in bloka celice.
  const c = prve[0], d = resitev[c];
  const r = Math.floor(c / 9), st = c % 9, b = Math.floor(r / 3) * 3 + Math.floor(st / 3);
  const bit = 1 << d;
  let m = E.manjkajoceVEnotah(s);
  assert.ok(m.vrstice[r] & bit && m.stolpci[st] & bit && m.bloki[b] & bit);
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: d }), true);
  s = E.stanjeIgre(igra);
  m = E.manjkajoceVEnotah(s);
  assert.equal(m.vrstice[r] & bit, 0);
  assert.equal(m.stolpci[st] & bit, 0);
  assert.equal(m.bloki[b] & bit, 0);
  assert.deepEqual(vStevke(m), pricakovano(niz(s)), 'po vpisu');

  // Ročno odstranjen kandidat na seznam ne vpliva.
  const druga = prve.find(x => E.popcount(s.kandidati[x]) > 1);
  const odstrani = bits(s.kandidati[druga])[0];
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidat', celica: druga, stevka: odstrani, odstrani: true }), true);
  assert.deepEqual(vStevke(E.manjkajoceVEnotah(E.stanjeIgre(igra))), pricakovano(niz(s)), 'ročni izbris ne vpliva');

  // Brisanje vpisa in razveljavi števko vrneta.
  assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: 0 }), true);
  assert.deepEqual(vStevke(E.manjkajoceVEnotah(E.stanjeIgre(igra))), pricakovano(danosti), 'po brisanju vpisa');
  E.razveljavi(igra);
  assert.deepEqual(vStevke(E.manjkajoceVEnotah(E.stanjeIgre(igra))), pricakovano(niz(s)), 'razveljavi brisanje');
  E.razveljavi(igra);
  E.razveljavi(igra);
  assert.deepEqual(vStevke(E.manjkajoceVEnotah(E.stanjeIgre(igra))), pricakovano(danosti), 'razveljavi vpis');

  // Polna mreža: vse enote so polne, vse maske 0.
  const polna = E.novaIgra(danosti);
  for (const x of prve) E.dodajPotezo(polna, { tip: 'vpis', celica: x, stevka: resitev[x] });
  m = E.manjkajoceVEnotah(E.stanjeIgre(polna));
  assert.deepEqual([...m.vrstice, ...m.stolpci, ...m.bloki], new Array(27).fill(0));
});

/* ---------- odstranjevanje istega kandidata iz več celic (poteza 'kandidati') ---------- */

// Enota s števko d, ki je kandidat v vsaj treh praznih celicah: prava = celica, kjer
// je d rešitev, napacne = ostale celice enote s kandidatom d (v njih d ni rešitev).
function enotaSKandidatom(stanje) {
  for (const u of [...E.ROWS, ...E.COLS, ...E.BOXES]) {
    for (let d = 1; d <= 9; d++) {
      const s = u.filter(c => stanje.kandidati[c] & (1 << d));
      const prava = s.find(c => resitev[c] === d);
      if (s.length >= 4 && prava !== undefined) return { d, prava, napacne: s.filter(c => c !== prava) };
    }
  }
  throw new Error('ni enote s števko v vsaj štirih celicah');
}
const skupina = (celice, stevka) => ({ tip: 'kandidati', celice: [...celice].sort((x, y) => x - y), stevka, odstrani: true });

test('skupniKandidati: presek kandidatov izbranih celic; polna celica da 0', () => {
  const igra = E.novaIgra(danosti);
  const s = E.stanjeIgre(igra);
  const celice = prve.slice(0, 3);
  assert.equal(E.skupniKandidati(s, celice), celice.reduce((m, c) => m & s.kandidati[c], E.FULL));
  assert.equal(E.skupniKandidati(s, [celice[0]]), s.kandidati[celice[0]]);
  assert.equal(E.skupniKandidati(s, []), 0);
  const dana = danosti.split('').findIndex(ch => ch !== '0');
  assert.equal(E.skupniKandidati(s, [celice[0], dana]), 0, 'dana celica nima kandidatov');
  vpis(igra, celice[1], resitev[celice[1]]);
  assert.equal(E.skupniKandidati(E.stanjeIgre(igra), celice), 0, 'celica z vpisom nima kandidatov');
});

test('poteza kandidati: odstrani števko iz vseh celic v eni potezi; razveljavi in ponovi vse naenkrat', () => {
  const igra = E.novaIgra(danosti);
  let s = E.stanjeIgre(igra);
  const { d, napacne } = enotaSKandidatom(s);
  const celice = napacne.slice(0, 3);
  const prej = celice.map(c => s.kandidati[c]);

  assert.equal(E.dodajPotezo(igra, skupina(celice, d)), true);
  assert.equal(igra.kazalec, 1, 'ena poteza');
  s = E.stanjeIgre(igra);
  celice.forEach((c, i) => assert.equal(s.kandidati[c], prej[i] & ~(1 << d), `${E.cellLabel(c)} brez ${d}`));
  assert.equal(E.skupniKandidati(s, celice) & (1 << d), 0);
  assert.equal(E.dodajPotezo(igra, skupina(celice, d)), false, 'dvakrat odstraniti ni mogoče');

  E.razveljavi(igra);
  s = E.stanjeIgre(igra);
  celice.forEach((c, i) => assert.equal(s.kandidati[c], prej[i], 'razveljavi vrne vse celice'));
  E.ponovi(igra);
  s = E.stanjeIgre(igra);
  celice.forEach((c, i) => assert.equal(s.kandidati[c], prej[i] & ~(1 << d), 'ponovi spet odstrani iz vseh'));
  // Posamezno vračanje odstranjenega kandidata deluje tudi po skupinski potezi.
  kand(igra, celice[0], d, false);
  assert.notEqual(E.stanjeIgre(igra).kandidati[celice[0]] & (1 << d), 0);
});

test('poteza kandidati: zavrnjena, če števka ni kandidat v vseh celicah ali celice niso veljavne', () => {
  const igra = E.novaIgra(danosti);
  const s = E.stanjeIgre(igra);
  const { d, napacne } = enotaSKandidatom(s);
  const [a, b] = napacne;
  const brez = prve.find(c => !(s.kandidati[c] & (1 << d)) && c !== a && c !== b);
  const dana = danosti.split('').findIndex(ch => ch !== '0');

  assert.equal(E.dodajPotezo(igra, skupina([a, b, brez], d)), false, 'v eni celici števka ni kandidat');
  assert.equal(E.dodajPotezo(igra, skupina([a, dana], d)), false, 'dana celica');
  assert.equal(E.dodajPotezo(igra, skupina([a], d)), false, 'manj kot dve celici');
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidati', celice: [a, a], stevka: d, odstrani: true }), false, 'ponovljena celica');
  assert.equal(E.dodajPotezo(igra, { tip: 'kandidati', celice: [Math.max(a, b), Math.min(a, b)], stevka: d, odstrani: true }), false, 'neurejene celice');
  assert.equal(E.dodajPotezo(igra, { ...skupina([a, b], d), odstrani: false }), false, 'vračanja v več celicah ni');
  assert.equal(E.dodajPotezo(igra, skupina([a, b], 0)), false, 'števka 0');
  vpis(igra, a, resitev[a]);
  assert.equal(E.dodajPotezo(igra, skupina([a, b], d)), false, 'celica z vpisom');
  assert.equal(igra.poteze.length, 1);
});

test('poteza kandidati: zapis za shrambo krožno; poškodovana skupinska poteza se odreže', () => {
  const igra = E.novaIgra(danosti);
  const { d, napacne } = enotaSKandidatom(E.stanjeIgre(igra));
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  assert.equal(E.dodajPotezo(igra, skupina(napacne.slice(0, 2), d)), true);
  vpis(igra, pravilne[1], resitev[pravilne[1]]);

  const zapis = JSON.parse(JSON.stringify(E.igraVZapis(igra, null, '2026-09-19 10:00')));
  const nazaj = E.igraIzZapisa(danosti, zapis);
  assert.equal(nazaj.poteze.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(nazaj.poteze)), JSON.parse(JSON.stringify(igra.poteze)));
  assert.deepEqual([...E.stanjeIgre(nazaj).kandidati], [...E.stanjeIgre(igra).kandidati]);
  nazaj.poteze[1].celice.push(80);
  assert.equal(igra.poteze[1].celice.length, 2, 'zapis ima svojo kopijo celic');

  zapis.poteze[1].celice.reverse();
  const odrezan = E.igraIzZapisa(danosti, zapis);
  assert.equal(odrezan.poteze.length, 1, 'neurejene celice - odigravanje se ustavi');
});

test('prvaNapaka: skupinska poteza, ki odstrani pravilni kandidat v eni od celic, je napaka', () => {
  const igra = E.novaIgra(danosti);
  const { d, prava, napacne } = enotaSKandidatom(E.stanjeIgre(igra));
  vpis(igra, pravilne[0], resitev[pravilne[0]]);
  assert.equal(E.dodajPotezo(igra, skupina(napacne.slice(0, 2), d)), true);
  assert.equal(E.prvaNapaka(igra, resitev), null, 'odstranjeni napačni kandidati niso napaka');
  assert.equal(E.dodajPotezo(igra, skupina([napacne[2], prava], d)), true); // poteza 3
  vpis(igra, pravilne[1], resitev[pravilne[1]]);
  assert.equal(E.prvaNapaka(igra, resitev), 3);
  kand(igra, prava, d, false);
  assert.equal(E.prvaNapaka(igra, resitev), null, 'ko pravilni kandidat vrneš, napake ni več');
});
