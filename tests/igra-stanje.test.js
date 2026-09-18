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
    'lahkoRazveljavi', 'lahkoPonovi', 'seManjka', 'steviloVpisanih', 'jeResena',
    'igraVZapis', 'igraIzZapisa'],
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

test('vpis celotne rešitve: uganka je rešena, števci so 0', () => {
  const igra = E.novaIgra(danosti);
  for (const c of prve) assert.equal(E.dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: resitev[c] }), true, `vpis v ${E.cellLabel(c)}`);
  const s = E.stanjeIgre(igra);
  assert.equal(E.jeResena(s), true);
  assert.deepEqual([...E.seManjka(s)], new Array(10).fill(0));
});
