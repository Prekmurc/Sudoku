'use strict';
// Filtri in razvrščanje v seznamu zbirke (naloga 10, docs/naloga10-nacrt.md, korak 1) - logika brez DOM-a v
// shared/zbirka.js:
//   - lastnosti uganke za filtre (zbirkaLastnostiUganke): težavnost, stanje (kot napis in gumb - rešena uganka,
//     ki jo rešuješ znova, je »v teku«, O3), tehnike kot na kartici (O4) brez E1, E2 in ugibanja (O5), število
//     danih, povzetek shranjene igre (izračuna se enkrat in gre naprej v kartico);
//   - možnosti filtrov (zbirkaMoznostiFiltrov): samo vrednosti, ki so v zbirki, v stalnem vrstnem redu, prazna
//     težavnost kot »Ni določena« na koncu (O6); število ob upoštevanju drugih dveh filtrov (O2) - izbrana
//     možnost ima število prikazanih; izbrana vrednost, ki je v zbirki ni več, ostane z »(0)« (O7);
//   - filtriranje (IN) in razvrščanje (Nazadnje, Težavnost, Število danih, Datum dodajanja; ob enakem ključu
//     velja »Nazadnje«);
//   - shramba izbire (sudoku.zbirka.filtri): branje, zapis, pokvarjen zapis, izpraznitev odsotnih vrednosti;
//   - napis »Prikazanih N od M« s sklanjanjem; rešitev uganke se izračuna enkrat na stran (O11).
// Uganke so iz docs/uganke.md in njihove kopije z zamenjanimi števkami (zamenjava ohrani enolično rešitev -
// preverjeno s countSolutions()); zapisi so iz zbirkaShraniResitev().
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');

const shramba = new Map();
const { run } = loadContext(['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/zbirka.js'], {
  localStorage: {
    getItem: k => (shramba.has(k) ? shramba.get(k) : null),
    setItem: (k, v) => shramba.set(k, String(v)),
    removeItem: k => shramba.delete(k),
  },
});
// Vrednosti iz konteksta prek JSON (polja iz drugega konteksta imajo drug prototip).
const J = izraz => JSON.parse(JSON.stringify(run(izraz)));
const S = v => JSON.stringify(v);

// ---------- testna zbirka ----------

const ZAMENJAVA = '987654321';
const uganke = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'))
  .filter(d => !run(`zbirkaPrimerZa(${S(d)})`));
// Kopiji prvih dveh z zamenjanimi števkami: ista težavnost, isto število danih (enaki ključi pri razvrščanju).
const kopije = uganke.slice(0, 2).map(d => d.replace(/[1-9]/g, c => ZAMENJAVA[Number(c) - 1]));
for (const d of kopije) assert.equal(run(`countSolutions(${S(d)})`), 1, 'kopija ima natanko eno rešitev');
const vse = [...uganke, ...kopije];

// Časi dodajanja: po vrsti, zadnji dve (kopiji) ob isti minuti.
const DODANO = vse.map((_, i) => (i < vse.length - 1 ? `2026-09-${String(10 + i).padStart(2, '0')} 08:00` : `2026-09-${String(10 + i - 1).padStart(2, '0')} 08:00`));
vse.forEach((d, i) => {
  run(`zbirkaZdaj = () => ${S(DODANO[i])}`);
  assert.ok(run(`(() => { const r = solve(${S(d)}); return !!zbirkaShraniResitev(${S(d)}, r.board, r.log, { izvor: 'rocno' }); })()`));
});

// Stanja: [1] v teku iz zapisa, [2] rešena iz zapisa, [3] rešena in znova v teku (shranjena igra), [4] začeta
// igra s samimi vpisi; druge nove. Zadnja (kopija) ima prazno težavnost (stari zapis z neznanim imenom).
const praznih = d => [...d].filter(c => c === '0').length;
const danih = d => 81 - praznih(d);
run(`zbirkaShraniIgranje(${S(vse[1])}, '2026-10-01 10:00', ${danih(vse[1]) + 5}, false)`);
run(`zbirkaShraniIgranje(${S(vse[2])}, '2026-10-02 10:00', 81, false)`);
run(`zbirkaShraniIgranje(${S(vse[3])}, '2026-10-03 10:00', 81, false)`);
const poteze = (d, n) => {
  const res = J(`solutionOf(${S(d)})`);
  return [...d].map((c, i) => i).filter(i => d[i] === '0').slice(0, n)
    .map(celica => ({ tip: 'vpis', celica, stevka: res[celica] }));
};
shramba.set(run('IGRA_KLJUC'), JSON.stringify({ zadnja: null, igre: {
  [vse[3]]: { poteze: poteze(vse[3], 4), kazalec: 4 },
  [vse[4]]: { poteze: poteze(vse[4], 3), kazalec: 3 },
} }));
{
  const z = JSON.parse(shramba.get(run('ZBIRKA_KLJUC')));
  z.find(x => x.danosti === vse[vse.length - 1]).tezavnost = 'Drugo';
  shramba.set(run('ZBIRKA_KLJUC'), JSON.stringify(z));
}

const lastnosti = () => J(`zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre)`);
const BREZ = { tezavnost: null, stanje: null, tehnika: null, razvrsti: 'nazadnje' };
const KRATKO = k => run(`zbirkaKratkoImeTehnike(${S(k)})`);
const TEHNIKE_S_STEVILKO = J('TRENING_TEHNIKE.map(([, t]) => t)');

// Neodvisno štetje (brez funkcij filtrov): ali lastnost ustreza izbiri, razen polja `razen`.
function ustreza(l, f, razen) {
  if (razen !== 'tezavnost' && f.tezavnost !== null && l.tezavnost !== f.tezavnost) return false;
  if (razen !== 'stanje' && f.stanje !== null && l.stanje !== f.stanje) return false;
  if (razen !== 'tehnika' && f.tehnika !== null && !l.tehnike.includes(f.tehnika)) return false;
  return true;
}
const ima = (l, polje, v) => (polje === 'tehnika' ? l.tehnike.includes(v) : l[polje] === v);

// ---------- lastnosti ----------

test('lastnosti: težavnost, stanje, število danih, povzetek; vrstni red »Nazadnje«', () => {
  const L = lastnosti();
  assert.equal(L.length, vse.length);
  assert.deepEqual(L.map(l => l.z.danosti), J('zbirkaZaSeznam(zbirkaBeri()).map(z => z.danosti)'));
  const po = d => L.find(l => l.z.danosti === d);
  for (const l of L) {
    assert.equal(l.danih, danih(l.z.danosti));
    assert.equal(l.tezavnost, l.z.tezavnost || '');
  }
  assert.equal(po(vse[0]).stanje, 'nova');
  assert.equal(po(vse[1]).stanje, 'v-teku');
  assert.equal(po(vse[2]).stanje, 'resena');
  assert.equal(po(vse[4]).stanje, 'v-teku');
  assert.equal(po(vse[4]).povzetek.vpisanih, 3);
  assert.equal(po(vse[vse.length - 1]).tezavnost, '', 'neznano ime težavnosti je prazno');
  assert.equal(po(vse[0]).povzetek, null, 'brez shranjene igre ni povzetka');
});

test('lastnosti: rešena uganka, ki jo rešuješ znova, je »v teku« – kot napis in gumb (O3)', () => {
  const l = lastnosti().find(x => x.z.danosti === vse[3]);
  assert.equal(l.stanje, 'v-teku');
  const st = J(`zbirkaStanjeUganke(${S(vse[3])}, zbirkaBeri().find(z => z.danosti === ${S(vse[3])}),
    zbirkaPovzetekZapisa(${S(vse[3])}, igreBeri().igre[${S(vse[3])}]))`);
  assert.equal(st.kljuc, 'v-teku');
  assert.equal(st.gumb, 'Nadaljuj');
  assert.ok(st.resena, 'zapis je rešen');
});

test('lastnosti: tehnike kot na kartici, brez E1, E2 in ugibanja (O4, O5)', () => {
  for (const l of lastnosti()) {
    const deli = J(`zbirkaTehnikeZapisa(zbirkaBeri().find(z => z.danosti === ${S(l.z.danosti)}))`) || [];
    const naKartici = deli.map(d => d.besedilo).filter(b => !/^E[12]$/.test(b) && b !== 'ugibanje');
    assert.deepEqual(l.tehnike.map(KRATKO), naKartici, l.z.danosti);
    for (const k of l.tehnike) assert.ok(TEHNIKE_S_STEVILKO.includes(k), k);
  }
  // Pri težki uganki pot ocene (ena napredna), ne ves dnevnik solve().
  const tezka = lastnosti().find(l => l.tezavnost === 'Težka');
  if (tezka) assert.deepEqual(tezka.tehnike, J(`zbirkaPotTezke(zbirkaBeri().find(z => z.danosti === ${S(tezka.z.danosti)}))`)
    .filter(k => TEHNIKE_S_STEVILKO.includes(k)));
});

test('zbirkaTehnikeZapisa(): obnašanje kartice ostane (skupna pomožna funkcija)', () => {
  const z = { danosti: vse[0], tezavnost: 'Srednja', tehnike: [['Gol enojček', 9], ['Pointing pair/triple', 2], ['Poskus in protislovje', 1]] };
  assert.deepEqual(J(`zbirkaTehnikeZapisa(${S(z)})`), [
    { besedilo: 'E1', glavna: false }, { besedilo: '1 Izločitev izven bloka', glavna: false }, { besedilo: 'ugibanje', glavna: false }]);
  assert.equal(run(`zbirkaTehnikeZapisa(${S({ ...z, tehnike: [] })})`), null);
  assert.deepEqual(J(`zbirkaTehnikeFiltra(${S(z)})`), ['Pointing pair/triple']);
  assert.deepEqual(J(`zbirkaTehnikeFiltra(${S({ ...z, tehnike: undefined })})`), []);
});

// ---------- možnosti ----------

test('možnosti: samo vrednosti iz zbirke, v stalnem vrstnem redu, napis s številom', () => {
  const L = lastnosti();
  const m = J(`zbirkaMoznostiFiltrov(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(BREZ)})`);
  const red = [...J('TEZAVNOSTI'), ''];
  assert.deepEqual(m.tezavnost.map(o => o.vrednost), red.filter(t => L.some(l => l.tezavnost === t)));
  assert.equal(m.tezavnost[m.tezavnost.length - 1].vrednost, '');
  assert.equal(m.tezavnost[m.tezavnost.length - 1].ime, 'Ni določena', 'prazna težavnost na koncu (O6)');
  assert.deepEqual(m.stanje.map(o => o.vrednost), ['nova', 'v-teku', 'resena']);
  assert.deepEqual(m.stanje.map(o => o.ime), ['Nova', 'V teku', 'Rešena']);
  assert.deepEqual(m.tehnika.map(o => o.vrednost), TEHNIKE_S_STEVILKO.filter(k => L.some(l => l.tehnike.includes(k))));
  for (const o of m.tehnika) assert.equal(o.ime, KRATKO(o.vrednost));
  for (const o of [...m.tezavnost, ...m.stanje, ...m.tehnika]) {
    assert.equal(o.napis, `${o.ime} (${o.n})`);
    assert.ok(o.n > 0, 'brez filtrov ima vsaka prisotna vrednost vsaj eno uganko');
  }
  assert.ok(m.tehnika.length >= 3, 'testna zbirka ima več tehnik');
});

test('možnosti: število upošteva druga dva filtra; izbrana ima število prikazanih (O2)', () => {
  const L = lastnosti();
  const vzorci = [
    BREZ,
    { ...BREZ, tezavnost: L[0].tezavnost },
    { ...BREZ, stanje: 'v-teku' },
    { ...BREZ, tehnika: L.find(l => l.tehnike.length).tehnike[0] },
    { tezavnost: L[0].tezavnost, stanje: 'nova', tehnika: L.find(l => l.tehnike.length).tehnike[0], razvrsti: 'danih' },
  ];
  for (const f of vzorci) {
    const m = J(`zbirkaMoznostiFiltrov(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(f)})`);
    const prikazanih = J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(f)})`).length;
    assert.equal(prikazanih, L.filter(l => ustreza(l, f)).length);
    for (const polje of ['tezavnost', 'stanje', 'tehnika']) {
      for (const o of m[polje]) {
        assert.equal(o.n, L.filter(l => ustreza(l, f, polje) && ima(l, polje, o.vrednost)).length, `${polje} ${o.vrednost}`);
      }
      if (f[polje] !== null) assert.equal(m[polje].find(o => o.vrednost === f[polje]).n, prikazanih);
    }
  }
});

test('možnosti: izbrana vrednost, ki je v zbirki ni, ostane z »(0)« (O7); nobena ni dvakrat', () => {
  const f = { ...BREZ, tezavnost: 'Brez rešitve', tehnika: 'Swordfish' };
  const L = lastnosti();
  assert.ok(!L.some(l => l.tezavnost === 'Brez rešitve'));
  const m = J(`zbirkaMoznostiFiltrov(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(f)})`);
  const o = m.tezavnost.find(x => x.vrednost === 'Brez rešitve');
  assert.deepEqual([o.n, o.napis], [0, 'Brez rešitve (0)']);
  if (!L.some(l => l.tehnike.includes('Swordfish'))) {
    assert.equal(m.tehnika.find(x => x.vrednost === 'Swordfish').napis, '8 Mečarica (0)');
  }
  for (const polje of ['tezavnost', 'stanje', 'tehnika']) {
    const v = m[polje].map(x => x.vrednost);
    assert.equal(new Set(v).size, v.length);
  }
  assert.deepEqual(J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(f)})`), []);
});

// ---------- filtriranje in razvrščanje ----------

test('filtriranje: brez filtrov vse v vrstnem redu »Nazadnje«, filtri se seštevajo (IN)', () => {
  const L = lastnosti();
  const f0 = J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(BREZ)})`);
  assert.deepEqual(f0.map(l => l.z.danosti), L.map(l => l.z.danosti));
  const teh = L.find(l => l.tehnike.length).tehnike[0];
  for (const f of [{ ...BREZ, stanje: 'nova' }, { ...BREZ, stanje: 'nova', tehnika: teh },
    { ...BREZ, tezavnost: '', stanje: 'nova' }, { ...BREZ, tezavnost: L[0].tezavnost, tehnika: teh }]) {
    const r = J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S(f)})`);
    assert.deepEqual(r.map(l => l.z.danosti), L.filter(l => ustreza(l, f)).map(l => l.z.danosti), S(f));
  }
});

test('razvrščanje: štirje načini, ob enakem ključu »Nazadnje«', () => {
  const L = lastnosti();
  const nazadnje = L.map(l => l.z.danosti);
  const redT = t => { const i = J('TEZAVNOSTI').indexOf(t); return i < 0 ? 99 : i; };
  const kljuc = {
    tezavnost: l => redT(l.tezavnost),
    danih: l => l.danih,
    dodano: l => -Date.parse((l.z.dodano || '1970-01-01 00:00').replace(' ', 'T')),
  };
  assert.deepEqual(J('ZBIRKA_RAZVRSTI').map(r => [r.kljuc, r.ime]),
    [['nazadnje', 'Nazadnje'], ['tezavnost', 'Težavnost'], ['danih', 'Število danih'], ['dodano', 'Datum dodajanja']]);
  for (const [nacin, k] of Object.entries(kljuc)) {
    const r = J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S({ ...BREZ, razvrsti: nacin })})`);
    assert.equal(r.length, L.length);
    for (let i = 1; i < r.length; i++) {
      const a = k(r[i - 1]), b = k(r[i]);
      assert.ok(a <= b, `${nacin}: vrstni red na mestu ${i}`);
      if (a === b) assert.ok(nazadnje.indexOf(r[i - 1].z.danosti) < nazadnje.indexOf(r[i].z.danosti), `${nacin}: enak ključ po »Nazadnje«`);
    }
  }
  // Testna zbirka ima enake ključe (kopiji: ista težavnost in število danih, enak čas dodajanja).
  assert.ok(L.some((l, i) => L.some((m, j) => i !== j && l.danih === m.danih)));
  const tez = J(`zbirkaFiltriraj(zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), ${S({ ...BREZ, razvrsti: 'tezavnost' })})`);
  assert.equal(tez[tez.length - 1].tezavnost, '', 'brez težavnosti na koncu');
});

// ---------- shramba izbire ----------

test('shramba: ključ, privzeta izbira, zapis in branje, pokvarjen zapis', () => {
  const K = run('ZBIRKA_FILTRI_KLJUC');
  assert.equal(K, 'sudoku.zbirka.filtri');
  shramba.delete(K);
  assert.deepEqual(J('zbirkaFiltriBeri()'), BREZ);
  const f = { tezavnost: '', stanje: 'resena', tehnika: 'X-Wing', razvrsti: 'dodano' };
  assert.equal(run(`zbirkaFiltriPisi(${S(f)})`), true);
  assert.deepEqual(JSON.parse(shramba.get(K)), f);
  assert.deepEqual(J('zbirkaFiltriBeri()'), f);
  // Staro ime težavnosti se preslika kot v zbirki (STARE_TEZAVNOSTI - naloga 11a), sicer bi
  // shranjeni filter »Ekstrem« ob odprtju okna izginil.
  shramba.set(K, JSON.stringify({ ...f, tezavnost: 'Ekstrem' }));
  assert.deepEqual(J('zbirkaFiltriBeri()'), { ...f, tezavnost: 'Ekstremna' });
  shramba.set(K, '{pokvarjeno');
  assert.deepEqual(J('zbirkaFiltriBeri()'), BREZ);
  shramba.set(K, JSON.stringify({ tezavnost: 5, stanje: 'neznano', tehnika: ['x'], razvrsti: 'abc', drugo: 1 }));
  assert.deepEqual(J('zbirkaFiltriBeri()'), BREZ);
  shramba.set(K, JSON.stringify([1, 2]));
  assert.deepEqual(J('zbirkaFiltriBeri()'), BREZ);
  shramba.delete(K);
  assert.equal(run(`zbirkaImaFilter(${S(BREZ)})`), false);
  assert.equal(run(`zbirkaImaFilter(${S({ ...BREZ, tezavnost: '' })})`), true, '»Ni določena« je vklopljen filter');
  assert.equal(run(`zbirkaImaFilter(${S({ ...BREZ, razvrsti: 'danih' })})`), false, 'Razvrsti ni filter');
});

test('ob odprtju: vrednost, ki je v zbirki ni, se izprazni; prisotne ostanejo', () => {
  const L = lastnosti();
  const teh = L.find(l => l.tehnike.length).tehnike[0];
  const f = { tezavnost: 'Brez rešitve', stanje: 'resena', tehnika: teh, razvrsti: 'danih' };
  assert.deepEqual(J(`zbirkaFiltriVeljavni(${S(f)}, zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre))`),
    { tezavnost: null, stanje: 'resena', tehnika: teh, razvrsti: 'danih' });
  const g = { tezavnost: '', stanje: 'nova', tehnika: 'Neznana tehnika', razvrsti: 'nazadnje' };
  assert.deepEqual(J(`zbirkaFiltriVeljavni(${S(g)}, zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre))`),
    { tezavnost: '', stanje: 'nova', tehnika: null, razvrsti: 'nazadnje' });
  assert.deepEqual(J(`zbirkaFiltriVeljavni(${S(f)}, [])`), { ...BREZ, razvrsti: 'danih' });
});

// ---------- napis in hitrost ----------

test('napis »Prikazanih N od M« s sklanjanjem', () => {
  const N = (n, m) => run(`zbirkaNapisPrikazanih(${n}, ${m})`);
  assert.equal(N(0, 32), 'Prikazanih 0 od 32');
  assert.equal(N(1, 32), 'Prikazana 1 od 32');
  assert.equal(N(2, 32), 'Prikazani 2 od 32');
  assert.equal(N(3, 32), 'Prikazane 3 od 32');
  assert.equal(N(4, 32), 'Prikazane 4 od 32');
  assert.equal(N(5, 32), 'Prikazanih 5 od 32');
  assert.equal(N(32, 32), 'Prikazanih 32 od 32');
  assert.equal(N(101, 120), 'Prikazana 101 od 120');
});

test('rešitev uganke se izračuna enkrat na stran (O11); povzetek polne igre jo uporabi', () => {
  const d = vse[5];
  const polne = poteze(d, praznih(d)); // pred štetjem - pomožna funkcija sama kliče solutionOf()
  run('var klicevResitve = 0; const prvotnaResitev = solutionOf; solutionOf = (...a) => { klicevResitve++; return prvotnaResitev(...a); };');
  try {
    const res = J(`zbirkaResitev(${S(d)})`);
    assert.deepEqual(res, J(`prvotnaResitev(${S(d)})`));
    J(`zbirkaResitev(${S(d)})`);
    for (let i = 0; i < 3; i++) {
      const p = J(`zbirkaPovzetekIgre(${S(d)}, ${S(polne)}, ${polne.length})`);
      assert.deepEqual([p.polna, p.napaka], [true, false]);
    }
    assert.equal(run('klicevResitve'), 1, 'solutionOf() samo enkrat za to uganko');
  } finally {
    run('solutionOf = prvotnaResitev');
  }
});
