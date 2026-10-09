'use strict';
// Shema vzorca pri razlagi tehnik (faza 3a, docs/faza3a-nacrt.md; shared/sheme.js):
//   - sheme so pri vseh tehnikah 1-12 (TRENING_TEHNIKE), E1 in E2 je nimata;
//   - motor: na deski iz sheme (črke -> števke, »…« -> vse druge števke, celice izseka brez črk
//     vpisane, celice zunaj izseka prazne z vsemi kandidati; pri 10-12 imajo vse celice razen
//     celic vzorca še vse druge števke) funkcija tehnike najde natanko en korak - celice vzorca
//     in izbrise sheme (pri 9 še podtip po naslovu risbe);
//   - napis o črkah našteje samo črke na shemi (dodatek 1), vrstica »Enako velja …« pri 1-8
//     (dodatek 2), izris v nadomestnem DOM-u;
//   - popravki po pregledu koraka 1: trojici imata celice z dvema in s tremi črkami in opombo
//     »Celica trojice ima dve ali vse tri črke.«, legenda ima rožnato »celica izbrisa«, kadar je
//     taka celica na shemi;
//   - razdelek »Shema« v treningu (dodatek 4): nad mrežo vaje za »Razlaga«, v »Spoznaj« odprt
//     (od popravka po pregledu koraka 2 pri vseh tehnikah, tudi 9 × 9), v »Vadi v uganki« zaprt,
//     stanje ostane ob naslednji vaji kroga, E1 brez razdelka;
//   - korak 2: sheme 1, 2 (pas) in 7, 8 (9 × 9) samo z x - lažje tehnike in skriti enojček na
//     njih ne najdejo ničesar (tudi osamljenega x v enoti ni - motor ga pri celicah s samim x ne
//     javi), pri 9 × 9 se prazne vrstice, stolpci in bloki ujemajo z vpisanimi črkami;
//   - korak 3: sheme 9 (dve risbi), 10, 11, 12 s povezavami - črte ne gredo čez celice s črkami,
//     povezava je vrstica ali stolpec z dvema celicama s črko, »vidita« in »vidi« se res vidita;
//   - popravek po pregledu koraka 3: pri W-krilu se celici povezave ločita od celic para, pri
//     XY-krilu pivot od kril (celica vzorca druge vrste »+«, svoja postavka v legendi), pri
//     W-krilu vrstica s sklepom;
//   - popravki po ročnem pregledu faze 3a: pri XY-krilu je pivot poln, krili bledejši s polnim
//     okvirjem, sklep pri 11 in pod vsako risbo pri 9; nato tudi pri W-krilu poln okvir (celice
//     druge vrste se ločijo samo po podlagi).
//   - XY-veriga, korak 4 (docs/xy-veriga-nacrt.md, razdelek 6): shema 13 (9 × 9, veriga petih
//     celic, konca druge vrste, povezave »vidita« in »vidi«, sklep, opomba). Tehnika še ni v
//     ALL_TECHNIQUES in TRENING_TEHNIKE (vklop je korak 6), zato so ključi shem tehnike 1-12 iz
//     TRENING_TEHNIKE in XY-veriga - testi veljajo pred vklopom in po njem.
// Videz (SVG, barve, 375 px) preverja tools/preveri-sheme-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

const motor = loadContext(['shared/engine.js', 'shared/sheme.js']).run;
const iz = izraz => JSON.parse(motor(`JSON.stringify(${izraz})`));
const SHEME = iz('SHEME_TEHNIK');
const TRENING = iz('TRENING_TEHNIKE');
// Tehnike s shemo: 1-12 iz TRENING_TEHNIKE in XY-veriga (13) - pred vklopom (korak 6) še ni v
// TRENING_TEHNIKE, po njem je v njem zadnja; seznam je v obeh primerih isti.
const TEHNIKE_SHEM = TRENING.some(([k]) => k === 'xy-chain') ? TRENING : [...TRENING, ['xy-chain', 'XY-Chain']];
// Funkcija tehnike v motorju (izraz za iz()): iz ALL_TECHNIQUES, XY-veriga pred vklopom xyChain.
const FUNKCIJA = ime => `(ALL_TECHNIQUES.find(([n]) => n === ${JSON.stringify(ime)}) || [, ${ime === 'XY-Chain' ? 'xyChain' : 'null'}])[1]`;
// Lažje tehnike: vse v ALL_TECHNIQUES pred tehniko (XY-veriga pred vklopom - vse).
const KONEC_LAZJIH = ime => `(i => i < 0 ? ALL_TECHNIQUES.length : i)(ALL_TECHNIQUES.findIndex(([n]) => n === ${JSON.stringify(ime)}))`;
const IZSEKI = { vrstica: [1, 9], pas: [3, 9], mreza: [9, 9] };
// Pet različnih števk - shema XY-verige ima vseh pet črk.
const STEVKA = { x: 1, y: 2, z: 3, a: 4, b: 5 };
const risbe = k => SHEME[k].risbe || [SHEME[k]];
const boxOf = i => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
const vidita = (i, j) => Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9 || boxOf(i) === boxOf(j);
const indeks = oznaka => { const [, r, c] = oznaka.match(/^V(\d)S(\d)$/); return (r - 1) * 9 + (c - 1); };
// Vse risbe kot [ključ, n, naslov].
const VSE_RISBE = Object.keys(SHEME).flatMap(k => risbe(k).map((r, n) => [k, n, r.naslov || '']));

// Zapis celice: žetoni, »-« = izbris, »*« = celica vzorca, »+« = celica vzorca druge vrste (glej
// shared/sheme.js) - tu neodvisno od shemaCelica().
function celica(zapis) {
  const vzorec2 = zapis.startsWith('+'), vzorec = vzorec2 || zapis.startsWith('*');
  const zetoni = zapis.replace(/^[*+]/, '').split(' ').filter(Boolean);
  return { vzorec, vzorec2, zetoni: zetoni.map(t => ({ z: t.replace(/^-/, ''), izbris: t.startsWith('-') })) };
}
const crkeCelice = zapis => celica(zapis).zetoni.map(t => t.z).filter(z => z !== '…');

// Deska iz risbe sheme in pričakovani korak { celice, izbrisi } (celice 0-80, izbrisi "celica:števka").
function deskaIzSheme(kljuc, n = 0) {
  const s = SHEME[kljuc], r = risbe(kljuc)[n];
  const [V, S] = IZSEKI[s.izsek];
  const crke = new Set(r.celice.flatMap(crkeCelice));
  const stevkeCrk = new Set([...crke].map(c => STEVKA[c]));
  const druge = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !stevkeCrk.has(d));
  const drugeMaska = druge.reduce((m, d) => m | (1 << d), 0);
  const grid = Array(81).fill(0), cand = Array(81).fill(0x3FE);
  const celice = [], izbrisi = [];
  assert.equal(r.celice.length, V * S, `${kljuc}: število celic izseka`);
  r.celice.forEach((zapis, i) => {
    const idx = Math.floor(i / S) * 9 + i % S;
    const cel = celica(zapis);
    if (cel.vzorec) celice.push(idx);
    let m = 0;
    for (const t of cel.zetoni) {
      const ds = t.z === '…' ? druge : [STEVKA[t.z]];
      for (const d of ds) {
        m |= 1 << d;
        if (t.izbris) izbrisi.push(`${idx}:${d}`);
      }
    }
    // 10-12: drugi kandidati so narisani samo v celicah vzorca - drugod so vsi.
    if (s.drugiVVzorcu && !cel.vzorec) m |= drugeMaska;
    if (!m) { grid[idx] = 9; cand[idx] = 1 << 9; return; }
    cand[idx] = m;
  });
  return { grid, cand, celice: celice.sort((a, b) => a - b), izbrisi: izbrisi.sort() };
}

// Različni koraki funkcije tehnike na deski (XY-krilo vrne isti vzorec dvakrat - krili v obeh vrstnih redih).
function koraki(d, ime) {
  const vsi = iz(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(d.grid)}; b.cand = ${JSON.stringify(d.cand)};
    return ${FUNKCIJA(ime)}(b)
      .map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbrisi: k.eliminate.map(([c, s]) => c + ':' + s).sort(), podtip: k.variant || '' })); })()`);
  return [...new Map(vsi.map(k => [JSON.stringify(k), k])).values()];
}
const imeMotorja = kljuc => TEHNIKE_SHEM.find(([k]) => k === kljuc)[1];

test('sheme so pri vseh tehnikah 1-12 in pri XY-verigi, E1 in E2 je nimata; pri 9 dve risbi', () => {
  const kljuci = TEHNIKE_SHEM.map(([k]) => k);
  assert.deepEqual(kljuci.slice(-2), ['unique-rectangle', 'xy-chain'], 'XY-veriga zadnja');
  assert.deepEqual(Object.keys(SHEME).sort(), [...kljuci].sort());
  for (const k of ['naked-single', 'hidden-single']) assert.equal(SHEME[k], undefined, k);
  const izseki = Object.fromEntries(kljuci.map(k => [k, SHEME[k].izsek]));
  assert.deepEqual(izseki, { 'pointing': 'pas', 'box-line': 'pas', 'naked-pair': 'vrstica', 'hidden-pair': 'vrstica',
    'naked-triple': 'vrstica', 'hidden-triple': 'vrstica', 'x-wing': 'mreza', 'swordfish': 'mreza',
    'turbot-fish': 'mreza', 'w-wing': 'mreza', 'xy-wing': 'mreza', 'unique-rectangle': 'mreza', 'xy-chain': 'mreza' });
  assert.deepEqual(risbe('turbot-fish').map(r => r.naslov), ['Nebotičnik (Skyscraper)', 'Zmaj z dvema vrvicama (2-String Kite)']);
  for (const k of kljuci.filter(k => k !== 'turbot-fish')) assert.equal(SHEME[k].risbe, undefined, k);
});

for (const [kljuc, n, naslov] of VSE_RISBE) {
  test(`motor: shema ${kljuc}${naslov ? ` (${naslov})` : ''} - funkcija tehnike najde natanko vzorec in izbrise sheme`, () => {
    const d = deskaIzSheme(kljuc, n);
    const k = koraki(d, imeMotorja(kljuc));
    assert.equal(k.length, 1, `${kljuc}: en sam korak (${JSON.stringify(k)})`);
    assert.deepEqual(k[0].celice, d.celice, `${kljuc}: celice vzorca`);
    assert.deepEqual(k[0].izbrisi, d.izbrisi, `${kljuc}: izbrisi`);
    assert.ok(d.izbrisi.length > 0);
    if (kljuc === 'turbot-fish') assert.equal(k[0].podtip, ['Skyscraper', 'Two-String Kite'][n], 'podtip po naslovu risbe');
  });
}

// Lažje tehnike (vse pred tehniko sheme) na deski iz sheme ne najdejo ničesar - sicer vzorec ne
// bi bil potreben (npr. kot vogal X-krila, ki je edini x v bloku). Sheme ene števke (1, 2, 7-9):
// samo x, gol enojček izpustimo (narisani so samo kandidati x), osamljen x v enoti (skriti enojček,
// ki ga motor pri celici s samim x ne javi) preverimo posebej. Sheme 3-6 v vrstici: lažje tehnike
// tu niso del preverbe (vrstica je del mreže s praznimi celicami).
const ENA_STEVKA = ['pointing', 'box-line', 'x-wing', 'swordfish', 'turbot-fish'];
for (const [kljuc, n, naslov] of VSE_RISBE.filter(([k]) => SHEME[k].izsek !== 'vrstica')) {
  test(`shema ${kljuc}${naslov ? ` (${naslov})` : ''}: lažje tehnike in skriti enojček ne najdejo ničesar`, () => {
    const r = risbe(kljuc)[n];
    const znaki = new Set(r.celice.flatMap(z => celica(z).zetoni.map(t => t.z)));
    if (ENA_STEVKA.includes(kljuc)) assert.deepEqual([...znaki], ['x'], kljuc);
    const d = deskaIzSheme(kljuc, n);
    const od = ENA_STEVKA.includes(kljuc) ? 1 : 0;
    const najdene = iz(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(d.grid)}; b.cand = ${JSON.stringify(d.cand)};
      const i = ${KONEC_LAZJIH(imeMotorja(kljuc))};
      return ALL_TECHNIQUES.slice(${od}, i).filter(([, f]) => f(b).length).map(([n]) => n); })()`);
    assert.deepEqual(najdene, [], kljuc);
    if (ENA_STEVKA.includes(kljuc)) {
      // Enote v celoti v izseku: vrstice, bloki, pri 9 × 9 še stolpci.
      const [V, S] = IZSEKI[SHEME[kljuc].izsek];
      const x = r.celice.map((z, i) => [Math.floor(i / S) * 9 + i % S, crkeCelice(z).length > 0]).filter(([, ima]) => ima).map(([i]) => i);
      const enote = [['vrstica', i => Math.floor(i / 9)], ['blok', boxOf], ...(V === 9 ? [['stolpec', i => i % 9]] : [])];
      for (const [ime, f] of enote) for (let e = 0; e < 9; e++) {
        assert.notEqual(x.filter(i => f(i) === e).length, 1, `${kljuc}: ${ime} ${e + 1} ima en sam x`);
      }
    }
  });
}

// Prazne enote (brez črke) se ujemajo z vpisanimi črkami: za vsako črko se da vrstice brez nje
// razporediti po stolpcih brez nje tako, da so bloki natanko bloki brez nje, v celicah brez črk in
// različne črke v različnih celicah.
test('sheme 9 × 9: prazne vrstice, stolpci in bloki se ujemajo z vpisanimi črkami', () => {
  for (const [kljuc, n, naslov] of VSE_RISBE.filter(([k]) => SHEME[k].izsek === 'mreza')) {
    const cel = risbe(kljuc)[n].celice;
    const crke = [...new Set(cel.flatMap(crkeCelice))];
    const enote = crke.map(c => {
      const ima = cel.map(z => crkeCelice(z).includes(c));
      const prazne = f => [...Array(9).keys()].filter(e => !ima.some((h, i) => h && f(i) === e));
      return { vr: prazne(i => Math.floor(i / 9)), st: prazne(i => i % 9), bl: prazne(boxOf) };
    });
    const ime = `${kljuc}${naslov ? ` (${naslov})` : ''}`;
    for (const e of enote) assert.ok(e.vr.length === e.st.length && e.vr.length === e.bl.length, `${ime}: ${JSON.stringify(e)}`);
    const zasedene = new Set();
    const crka = k => {
      if (k === crke.length) return true;
      const { vr, st, bl } = enote[k];
      const korak = (j, stolpci, bloki) => {
        if (j === vr.length) return crka(k + 1);
        for (const c of st) {
          const i = vr[j] * 9 + c;
          if (stolpci.includes(c) || bloki.includes(boxOf(i)) || !bl.includes(boxOf(i))) continue;
          if (crkeCelice(cel[i]).length || zasedene.has(i)) continue;
          zasedene.add(i);
          if (korak(j + 1, [...stolpci, c], [...bloki, boxOf(i)])) return true;
          zasedene.delete(i);
        }
        return false;
      };
      return korak(0, [], []);
    };
    assert.ok(crka(0), `${ime}: razporeditev vpisanih črk`);
  }
});

// Povezave (9-11, 13): črte ne gredo čez celice s črkami; povezava je vrstica ali stolpec, kjer je ena
// od črk obeh celic samo v njiju; »vidita« - celici vzorca se vidita; »vidi« - od celice izbrisa
// do celice vzorca, ki jo vidi.
test('povezave pri 9-11 in 13: pomen in črte brez črk na poti', () => {
  const s = k => VSE_RISBE.filter(([kk]) => kk === k).map(([, n]) => risbe(k)[n]);
  const S_POVEZAVAMI = ['turbot-fish', 'w-wing', 'xy-wing', 'xy-chain'];
  for (const k of S_POVEZAVAMI) for (const r of s(k)) {
    assert.ok((r.vidi || []).length >= 2, `${k}: črte »vidi«`);
    assert.ok((r.vidita || []).length + (r.povezave || []).length >= 2, `${k}: povezave med celicami vzorca`);
  }
  for (const k of Object.keys(SHEME).filter(k => !S_POVEZAVAMI.includes(k))) {
    for (const r of risbe(k)) for (const p of ['povezave', 'vidita', 'vidi']) assert.equal(r[p], undefined, `${k}: brez povezav`);
  }
  for (const [k, n] of VSE_RISBE) {
    const r = risbe(k)[n];
    const cel = i => celica(r.celice[i]);
    for (const [p, pari] of [['povezave', r.povezave], ['vidita', r.vidita], ['vidi', r.vidi]]) {
      for (const par of pari || []) {
        const [i, j] = par.split(' ').map(indeks);
        const ime = `${k} ${p} ${par}`;
        if (p === 'vidi') assert.ok(!cel(i).vzorec && cel(i).zetoni.some(t => t.izbris), `${ime}: začne se v celici izbrisa`);
        else assert.ok(cel(i).vzorec, `${ime}: celica vzorca`);
        assert.ok(cel(j).vzorec, `${ime}: konča se v celici vzorca`);
        assert.ok(vidita(i, j), `${ime}: celici se vidita`);
        if (p === 'povezave') {
          const enota = Math.floor(i / 9) === Math.floor(j / 9) ? c => Math.floor(c / 9) === Math.floor(i / 9) : c => c % 9 === i % 9;
          assert.ok(Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9, `${ime}: vrstica ali stolpec`);
          const skupne = crkeCelice(r.celice[i]).filter(c => crkeCelice(r.celice[j]).includes(c));
          assert.ok(skupne.some(c => r.celice.filter((z, x) => enota(x) && crkeCelice(z).includes(c)).length === 2), `${ime}: črka samo v teh dveh celicah`);
        }
        // Celice, čez katere gre črta (brez koncev), so brez črk.
        const [r1, c1, r2, c2] = [Math.floor(i / 9), i % 9, Math.floor(j / 9), j % 9];
        for (let t = 1; t < 40; t++) {
          const x = Math.round(r1 + (r2 - r1) * t / 40) * 9 + Math.round(c1 + (c2 - c1) * t / 40);
          if (x !== i && x !== j) assert.equal(r.celice[x], '', `${ime}: črta gre čez celico ${x} s črkami`);
        }
      }
    }
  }
});

test('napis o črkah našteje samo črke na shemi, »…« samo, če je na njej; »Enako velja« pri 1-8', () => {
  const DRUGI = ' Drugi kandidati so narisani samo v celicah vzorca.';
  const PRICAKOVANO = {
    'naked-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'hidden-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'naked-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
    'hidden-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
    'pointing': 'x – poljubna števka; prazna celica – brez x.',
    'box-line': 'x – poljubna števka; prazna celica – brez x.',
    'x-wing': 'x – poljubna števka; prazna celica – brez x.',
    'swordfish': 'x – poljubna števka; prazna celica – brez x.',
    'turbot-fish': 'x – poljubna števka; prazna celica – brez x.',
    'w-wing': 'a, b – poljubni različni števki; … – drugi kandidati; prazna celica – brez a in b.' + DRUGI,
    'xy-wing': 'x, y, z – poljubne različne števke; prazna celica – brez x, y in z.' + DRUGI,
    'unique-rectangle': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.' + DRUGI,
    'xy-chain': 'x, y, z, a, b – poljubne različne števke; prazna celica – brez x, y, z, a in b.' + DRUGI,
  };
  const ENAKO = {
    'pointing': 'Enako velja za stolpec namesto vrstice.',
    'box-line': 'Enako velja za stolpec namesto vrstice.',
    'x-wing': 'Enako velja z zamenjanimi vrsticami in stolpci.',
    'swordfish': 'Enako velja z zamenjanimi vrsticami in stolpci.',
  };
  for (const [k, p] of Object.entries(ENAKO)) assert.equal(SHEME[k].enako, p, k);
  for (const [k, p] of Object.entries(PRICAKOVANO)) assert.equal(motor(`shemaNapisCrk(${JSON.stringify(k)})`), p, k);
  for (const k of Object.keys(SHEME)) {
    const crke = motor(`shemaNapisCrk(${JSON.stringify(k)})`).split(' – ')[0].split(', ');
    const naShemi = [...new Set(risbe(k).flatMap(r => r.celice).flatMap(crkeCelice))].sort();
    assert.deepEqual([...crke].sort(), naShemi, k);
    const n = TEHNIKE_SHEM.findIndex(([t]) => t === k) + 1;
    assert.equal(!!SHEME[k].enako, n <= 8, `${k}: vrstica »Enako velja« pri 1-8`);
    assert.equal(!!SHEME[k].drugiVVzorcu, n >= 10, `${k}: drugi kandidati samo v celicah vzorca pri 10-13`);
  }
});

test('izris v nadomestnem DOM-u: risba, legenda, napisi; brez sheme null', () => {
  const dom = makeDom();
  const { run } = loadContext(['shared/engine.js', 'shared/sheme.js'], dom.globals);
  run('var f = izrisiShemo("hidden-pair")');
  assert.equal(run('f.tagName'), 'FIGURE');
  assert.equal(run('f.className'), 'shema');
  const svg = run('f.children[0].innerHTML');
  assert.match(svg, /^<svg class="shema-risba" viewBox="0 0 327 39" [^>]*aria-label="Shema vzorca: Skriti par">/);
  assert.equal((svg.match(/<text /g) || []).length, 4, 'štiri črke (x y v dveh celicah)');
  assert.equal((svg.match(/class="sh-vzorec"/g) || []).length, 2, 'dve celici vzorca');
  assert.equal((svg.match(/class="sh-drugi sh-precrtan"/g) || []).length, 2, 'prečrtani »…« v obeh celicah vzorca');
  assert.equal(run('f.children[1].children.map(c => c.textContent).join(" | ")'), 'celici para | drugi kandidati za izbris');
  assert.equal(run('f.children[2].textContent'), 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.');
  assert.equal(run('f.children[3].textContent'), 'Enako velja za stolpec ali blok.');
  run('var g = izrisiShemo("naked-pair")');
  assert.equal(run('g.children[1].children.map(c => c.textContent).join(" | ")'), 'celici para | celica izbrisa | xkandidat za izbris');
  assert.equal(run('g.children[1].children[1].children[0].className'), 'shema-sw shema-sw-izbris');
  assert.equal(run('izrisiShemo("naked-single")'), null);
  assert.match(run('izrisiShemo("pointing").children[0].innerHTML'), /viewBox="0 0 327 111"/, 'pas 3 × 9');
  assert.match(run('izrisiShemo("x-wing").children[0].innerHTML'), /viewBox="0 0 327 327"/, 'mreža 9 × 9');
  run('var x = izrisiShemo("x-wing")');
  assert.equal(run('x.children[1].children.map(c => c.textContent).join(" | ")'), 'vogali X-krila | celica izbrisa | xkandidat za izbris');
  const xs = run('x.children[0].innerHTML');
  assert.equal((xs.match(/<text /g) || []).length, 21, 'X-krilo: 21 x');
  assert.equal((xs.match(/class="sh-vzorec"/g) || []).length, 4, 'štirje vogali');
  assert.equal((xs.match(/class="sh-izbris"/g) || []).length, 4, 'štiri celice izbrisa');
  // Prečrtan kandidat (popravek po pregledu koraka 2): črka sh-crka sh-precrtan, čez njo črta sh-crta-izbris.
  assert.equal((xs.match(/class="sh-crta-izbris"/g) || []).length, 4, 'X-krilo: štiri črte izbrisa');

  // Korak 3: pri 9 dve risbi z naslovom, povezave, legenda z vrstami povezav.
  run('var t = izrisiShemo("turbot-fish")');
  assert.deepEqual(JSON.parse(run('JSON.stringify(t.children.map(c => c.className))')),
    ['shema-naslov', 'shema-okvir', 'shema-sklep', 'shema-naslov', 'shema-okvir', 'shema-sklep', 'shema-legenda', 'shema-crke', 'shema-opomba']);
  assert.equal(run('t.children[0].textContent'), 'Nebotičnik (Skyscraper)');
  assert.equal(run('t.children[3].textContent'), 'Zmaj z dvema vrvicama (2-String Kite)');
  // Popravek po ročnem pregledu faze 3a: pod vsako risbo enak sklep z izrazi iz razlage tehnike.
  const SKLEP9 = 'Konca, ki se vidita, ne moreta biti oba x, zato je vsaj eden od preostalih dveh koncev x in x izbrišeš iz celic, ki vidijo oba ta konca.';
  assert.equal(run('t.children[2].textContent'), SKLEP9);
  assert.equal(run('t.children[5].textContent'), SKLEP9);
  assert.equal(run('t.children[6].children.map(c => c.textContent).join(" | ")'),
    'konca povezav | celica izbrisa | xkandidat za izbris | povezava | celici se vidita | celica izbrisa vidi');
  for (const [n, i] of [[0, 1], [1, 4]]) {
    const s = run(`t.children[${i}].innerHTML`);
    const r = risbe('turbot-fish')[n];
    assert.match(s, new RegExp(`aria-label="Shema vzorca: Veriga ene števke – ${r.naslov.replace(/[()]/g, '\\$&')}"`));
    assert.equal((s.match(/class="sh-povezava"/g) || []).length, r.povezave.length, `risba ${n}: povezave`);
    assert.equal((s.match(/class="sh-vidita"/g) || []).length, r.vidita.length, `risba ${n}: vidita`);
    assert.equal((s.match(/class="sh-vidi"/g) || []).length, r.vidi.length, `risba ${n}: vidi`);
    // Črte povezav so za mrežnimi črtami in pred črkami.
    assert.ok(s.lastIndexOf('sh-debela') < s.indexOf('sh-povezava') && s.lastIndexOf('sh-vidi"') < s.indexOf('<text'), `risba ${n}: vrstni red`);
  }
  // Skrajšana črta: konca sta 12 enot od središč celic.
  const s0 = run('t.children[1].innerHTML');
  const crta = s0.match(/<line class="sh-povezava" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"\/>/).slice(1).map(Number);
  assert.deepEqual(crta, [1.5 + 36 + 18, 1.5 + 36 + 18 + 12, 1.5 + 36 + 18, 1.5 + 7 * 36 + 18 - 12], 'V2S2 V8S2');
  // Popravek po pregledu koraka 3: W-krilo - celici povezave ločeni od celic para, sklep pod legendo.
  run('var w = izrisiShemo("w-wing")');
  assert.deepEqual(JSON.parse(run('JSON.stringify(w.children.map(c => c.className))')),
    ['shema-okvir', 'shema-legenda', 'shema-sklep', 'shema-crke', 'shema-opomba']);
  assert.equal(run('w.children[1].children.map(c => c.textContent).join(" | ")'),
    'celici para | celici povezave | celica izbrisa | akandidat za izbris | povezava | celici se vidita | celica izbrisa vidi');
  assert.equal(run('w.children[1].children[1].children[0].className'), 'shema-sw shema-sw-vzorec2');
  assert.equal(run('w.children[2].textContent'), 'Vsaj ena celica para je a, zato a izbrišeš iz celic, ki vidijo obe.');
  const ws = run('w.children[0].innerHTML');
  assert.equal((ws.match(/class="sh-vzorec"/g) || []).length, 2, 'W-krilo: celici para');
  assert.equal((ws.match(/class="sh-vzorec sh-vzorec2"/g) || []).length, 2, 'W-krilo: celici povezave, poln okvir');
  assert.doesNotMatch(ws, /crtkan/, 'W-krilo: brez črtkanega okvirja celic');
  // Popravek po ročnem pregledu faze 3a: XY-krilo - pivot poln, krili bledejši s polnim okvirjem, sklep.
  run('var y = izrisiShemo("xy-wing")');
  assert.deepEqual(JSON.parse(run('JSON.stringify(y.children.map(c => c.className))')),
    ['shema-okvir', 'shema-legenda', 'shema-sklep', 'shema-crke', 'shema-opomba']);
  assert.equal(run('y.children[1].children.map(c => c.textContent).join(" | ")'),
    'pivot | krili | celica izbrisa | zkandidat za izbris | celici se vidita | celica izbrisa vidi');
  assert.equal(run('y.children[1].children[1].children[0].className'), 'shema-sw shema-sw-vzorec2');
  assert.equal(run('y.children[2].textContent'), 'Eno od kril je z, zato z izbrišeš iz celic, ki vidijo obe krili.');
  const ys = run('y.children[0].innerHTML');
  assert.equal((ys.match(/class="sh-vzorec"/g) || []).length, 1, 'XY-krilo: pivot');
  assert.equal((ys.match(/class="sh-vzorec sh-vzorec2"/g) || []).length, 2, 'XY-krilo: krili, poln okvir');
  // XY-veriga (korak 4): celice verige polne, konca bledejša s polnim okvirjem, sklep in opomba.
  run('var v = izrisiShemo("xy-chain")');
  assert.deepEqual(JSON.parse(run('JSON.stringify(v.children.map(c => c.className))')),
    ['shema-okvir', 'shema-legenda', 'shema-sklep', 'shema-crke', 'shema-opomba']);
  assert.equal(run('v.children[1].children.map(c => c.textContent).join(" | ")'),
    'celice verige | konca | celica izbrisa | zkandidat za izbris | celici se vidita | celica izbrisa vidi');
  assert.equal(run('v.children[1].children[1].children[0].className'), 'shema-sw shema-sw-vzorec2');
  assert.equal(run('v.children[2].textContent'), 'Vsaj en konec je z, zato z izbrišeš iz celic, ki vidijo oba konca.');
  assert.equal(run('v.children[4].textContent'), 'Veriga je lahko daljša ali krajša (vsaj štiri celice).');
  const vs = run('v.children[0].innerHTML');
  assert.match(vs, /^<svg class="shema-risba" viewBox="0 0 327 327" [^>]*aria-label="Shema vzorca: XY-veriga">/);
  assert.equal((vs.match(/class="sh-vzorec"/g) || []).length, 3, 'XY-veriga: tri vmesne celice');
  assert.equal((vs.match(/class="sh-vzorec sh-vzorec2"/g) || []).length, 2, 'XY-veriga: konca, poln okvir');
  assert.equal((vs.match(/class="sh-vidita"/g) || []).length, 4, 'XY-veriga: štiri povezave med zaporednimi celicami');
  assert.equal((vs.match(/class="sh-vidi"/g) || []).length, 2, 'XY-veriga: celica izbrisa vidi oba konca');
  assert.doesNotMatch(vs, /sh-povezava/, 'XY-veriga: brez močnih povezav');
  run('var u = izrisiShemo("unique-rectangle")');
  assert.equal(run('u.children[1].children.map(c => c.textContent).join(" | ")'), 'vogali pravokotnika | xkandidat za izbris');
  assert.doesNotMatch(run('u.children[0].innerHTML'), /sh-povezava|sh-vidi/, 'pravokotnik brez povezav');
});

// Trening v nadomestnem DOM-u; setTimeout gre v vrsto (iskanje vaje »Vadi v uganki«), ura
// je takoj čez mejo - vaja iz banke.
function trening() {
  const dom = makeDom();
  const vrsta = [];
  dom.globals.setTimeout = f => { vrsta.push(f); return vrsta.length; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })()');
  const izprazni = () => { for (let i = 0; i < 10000 && vrsta.length; i++) vrsta.shift()(); };
  const vsi = (el, out = []) => { for (const c of el.children || []) { out.push(c); vsi(c, out); } return out; };
  const vaja = () => vsi(dom.el('exerciseArea')).find(e => e.className === 'exercise');
  const shema = () => vsi(dom.el('exerciseArea')).find(e => e.className === 'shema-razdelek');
  return { run, izprazni, vaja, shema };
}

// Od popravka po ročnem pregledu naloge 4a je razdelek tik nad mrežo vaje, med »Razlaga« in njim je
// vrstica s preslikavo vaje po shemi (tests/trening-shema-vaja.test.js).
test('trening: razdelek »Shema« za »Razlaga« (pri vaji po shemi za vrstico s preslikavo); Spoznaj odprt, Vadi v uganki zaprt, stanje ostane v krogu, E1 brez', () => {
  const { run, izprazni, vaja, shema } = trening();
  run('zacniKrog("naked-triple", "spoznaj")');
  const otroci = vaja().children;
  const i = otroci.findIndex(e => e.className === 'shema-razdelek');
  assert.deepEqual(otroci.slice(i - 2, i).map(e => e.className), ['razlaga-tehnike', 'po-shemi'], 'za »Razlaga« in vrstico s preslikavo');
  assert.equal(shema().tagName, 'DETAILS');
  assert.equal(shema().children[0].textContent, 'Shema');
  assert.equal(shema().children[1].className, 'shema');
  assert.equal(shema().open, true, 'Spoznaj: privzeto odprt');
  assert.equal(run('pomocVaje'), false, 'ogled ni pomoč');
  shema().open = false; shema().sprozi('toggle');
  run('exNum++; renderExercise()');
  assert.equal(shema().open, false, 'zaprt ostane v naslednji vaji');
  run('zacniKrog("naked-triple", "spoznaj")');
  assert.equal(shema().open, true, 'nov krog Spoznaj - spet odprt');

  run('zacniKrog("hidden-pair", "uganka")');
  izprazni();
  assert.equal(shema().open, false, 'Vadi v uganki: privzeto zaprt');
  shema().open = true; shema().sprozi('toggle');
  run('exNum++; renderExercise()');
  izprazni();
  assert.equal(shema().open, true, 'odprt ostane v naslednji vaji');

  run('zacniKrog("naked-single", "spoznaj")');
  assert.equal(shema(), undefined, 'E1 nima sheme');

  // Popravek po pregledu koraka 2: v »Spoznaj« odprt pri vseh tehnikah, tudi pri shemah 9 × 9.
  for (const [k] of TRENING) {
    run(`zacniKrog(${JSON.stringify(k)}, "spoznaj")`);
    assert.equal(shema().open, true, `${k}: Spoznaj`);
    run(`zacniKrog(${JSON.stringify(k)}, "uganka")`);
    izprazni();
    assert.equal(shema().open, false, `${k}: Vadi v uganki`);
  }
  run('zacniKrog("turbot-fish", "spoznaj")');
  // Ob vaji odprta samo risba vaje, druga oblika na zahtevo (popravek po ročnem pregledu naloge 4a).
  assert.equal(shema().children[1].children.filter(c => c.className === 'shema-okvir').length, 1, 'veriga ene števke: ena odprta risba');
  assert.equal(shema().children[1].children.filter(c => c.className === 'shema-druga').length, 1, 'veriga ene števke: druga oblika');
  shema().open = false; shema().sprozi('toggle');
  run('exNum++; renderExercise()');
  assert.equal(shema().open, false, 'veriga ene števke: zaprt ostane v naslednji vaji');
});

test('trojici in sheme 1, 2, 8: celice z dvema in s tremi črkami (celicami), opomba pod napisom o črkah; legenda »celica izbrisa« samo z rožnato celico', () => {
  for (const k of ['naked-triple', 'hidden-triple']) {
    const stevila = SHEME[k].celice.map(celica).filter(c => c.vzorec).map(c => c.zetoni.filter(t => t.z !== '…').length);
    assert.ok(stevila.includes(2) && stevila.includes(3), `${k}: celice vzorca z dvema in s tremi črkami (${stevila})`);
    assert.equal(SHEME[k].opomba, 'Celica trojice ima dve ali vse tri črke.', k);
  }
  for (const k of ['naked-pair', 'hidden-pair', 'x-wing']) assert.equal(SHEME[k].opomba, undefined, k);
  // Pas: vzorec z dvema in s tremi celicami; mečarica: vrstica z dvema in s tremi x.
  const vzorcev = k => SHEME[k].celice.map(celica).filter(c => c.vzorec).length;
  assert.deepEqual([vzorcev('pointing'), vzorcev('box-line')], [2, 3]);
  for (const k of ['pointing', 'box-line']) assert.equal(SHEME[k].opomba, 'Vzorec ima dve ali tri celice.', k);
  const vVrstici = [...Array(9).keys()].map(r => SHEME.swordfish.celice.slice(r * 9, r * 9 + 9).map(celica).filter(c => c.vzorec).length).filter(Boolean);
  assert.deepEqual(vVrstici.sort(), [2, 2, 3]);
  assert.equal(SHEME.swordfish.opomba, 'V vrstici vzorca je x v dveh ali vseh treh stolpcih.');
  // Korak 3: vzorec z več oblikami ima opombo.
  for (const k of ['turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain']) assert.ok(SHEME[k].opomba, k);
  const dom = makeDom();
  const { run } = loadContext(['shared/engine.js', 'shared/sheme.js'], dom.globals);
  for (const k of Object.keys(SHEME)) {
    run(`var f = izrisiShemo(${JSON.stringify(k)})`);
    const deli = JSON.parse(run('JSON.stringify(f.children.map(c => c.className))'));
    const zacetek = risbe(k).flatMap(r => [...(r.naslov ? ['shema-naslov'] : []), 'shema-okvir', ...(r !== SHEME[k] && r.sklep ? ['shema-sklep'] : [])]);
    const pricakovano = [...zacetek, 'shema-legenda', ...(SHEME[k].sklep ? ['shema-sklep'] : []), 'shema-crke', ...(SHEME[k].opomba ? ['shema-opomba'] : []), ...(SHEME[k].enako ? ['shema-enako'] : [])];
    assert.deepEqual(deli, pricakovano, k);
    const leg = zacetek.length;
    if (SHEME[k].opomba) assert.equal(run(`f.children[${leg + 2 + (SHEME[k].sklep ? 1 : 0)}].textContent`), SHEME[k].opomba, k);
    const rozna = risbe(k).flatMap(r => r.celice).map(celica).some(c => !c.vzorec && c.zetoni.some(t => t.izbris));
    const legenda = run(`f.children[${leg}].children.map(c => c.textContent).join(" | ")`);
    assert.equal(legenda.includes('celica izbrisa'), rozna, `${k}: ${legenda}`);
    // Na risbi je rožnata celica natanko takrat, ko je v legendi.
    const okvirji = zacetek.map((c, i) => [c, i]).filter(([c]) => c === 'shema-okvir').map(([, i]) => i);
    const svg = okvirji.map(i => run(`f.children[${i}].innerHTML`)).join('');
    assert.equal(svg.includes('class="sh-izbris"'), rozna, k);
  }
});

// Popravek po pregledu koraka 3: celice vzorca druge vrste (»+«) - pri W-krilu celici povezave
// (vrstica, kjer je b samo v njiju, vsaka vidi svojo celico para), pri XY-krilu krili (po ročnem
// pregledu faze 3a; obe vidita pivot, ki je poln) – obe s polnim okvirjem; druge sheme
// jih nimajo. Druga vrsta ima svoj napis v legendi. Sklep pri 10 in 11, pri 9 pod vsako risbo.
test('W-krilo in XY-krilo: celice vzorca druge vrste (povezava, krili), sklep pri 9, 10 in 11', () => {
  const vrste = k => risbe(k).flatMap(r => r.celice).map((z, i) => [i, celica(z)]).filter(([, c]) => c.vzorec);
  const w = vrste('w-wing'), y = vrste('xy-wing');
  const povezava = w.filter(([, c]) => c.vzorec2).map(([i]) => i), par = w.filter(([, c]) => !c.vzorec2).map(([i]) => i);
  assert.deepEqual(povezava, SHEME['w-wing'].povezave[0].split(' ').map(indeks), 'W-krilo: celici povezave sta konca povezave');
  assert.equal(par.length, 2);
  for (const [i] of w) assert.deepEqual(crkeCelice(SHEME['w-wing'].celice[i]).sort(), povezava.includes(i) ? ['b'] : ['a', 'b']);
  const pivot = y.filter(([, c]) => !c.vzorec2).map(([i]) => i), krili = y.filter(([, c]) => c.vzorec2).map(([i]) => i);
  assert.equal(pivot.length, 1);
  assert.equal(krili.length, 2);
  assert.deepEqual(crkeCelice(SHEME['xy-wing'].celice[pivot[0]]).sort(), ['x', 'y'], 'pivot {x, y}');
  assert.ok(krili.every(i => vidita(i, pivot[0]) && crkeCelice(SHEME['xy-wing'].celice[i]).includes('z')), 'krili vidita pivot, imata z');
  assert.deepEqual([SHEME['w-wing'].vzorec, SHEME['w-wing'].vzorec2], ['celici para', 'celici povezave']);
  assert.deepEqual([SHEME['xy-wing'].vzorec, SHEME['xy-wing'].vzorec2], ['pivot', 'krili']);
  for (const k of Object.keys(SHEME).filter(k => !['w-wing', 'xy-wing', 'xy-chain'].includes(k))) {
    assert.ok(!vrste(k).some(([, c]) => c.vzorec2), `${k}: brez druge vrste`);
    assert.equal(SHEME[k].vzorec2, undefined, k);
  }
  assert.deepEqual(Object.keys(SHEME).filter(k => SHEME[k].sklep), ['w-wing', 'xy-wing', 'xy-chain']);
  assert.deepEqual(risbe('turbot-fish').map(r => !!r.sklep), [true, true], '9: sklep pod vsako risbo');
});

// XY-veriga (korak 4, docs/xy-veriga-nacrt.md, razdelek 6): veriga petih celic {z, x} - {x, y} -
// {y, a} - {a, b} - {b, z}; povezave »vidita« tečejo po verigi od konca do konca (zaporedni celici
// se vidita in imata skupno črko), konca sta celici druge vrste in imata z, celica izbrisa vidi
// oba konca in ima samo prečrtan z. Motor da celice v vrstnem redu verige - isti kot po povezavah.
test('XY-veriga: pet celic po vrsti, konca druge vrste z z, celica izbrisa vidi oba konca', () => {
  const s = SHEME['xy-chain'], cel = s.celice.map(celica);
  assert.deepEqual([s.vzorec, s.vzorec2], ['celice verige', 'konca']);
  assert.equal(s.drugiVVzorcu, true);
  assert.equal(s.povezave, undefined);
  // Pot po povezavah »vidita«: zaporedni pari, prvi in zadnji sta konca.
  const pari = s.vidita.map(p => p.split(' ').map(indeks));
  const pot = [pari[0][0], ...pari.map(([i, j], n) => { if (n) assert.equal(i, pari[n - 1][1], 'povezave po vrsti'); return j; })];
  assert.equal(pot.length, 5, 'pet celic');
  assert.equal(new Set(pot).size, 5, 'celica se ne ponovi');
  const vzorca = cel.map((c, i) => [i, c]).filter(([, c]) => c.vzorec);
  assert.deepEqual(vzorca.map(([i]) => i).sort((a, b) => a - b), [...pot].sort((a, b) => a - b), 'celice vzorca so celice verige');
  assert.deepEqual(vzorca.filter(([, c]) => c.vzorec2).map(([i]) => i).sort((a, b) => a - b), [pot[0], pot[4]].sort((a, b) => a - b), 'konca druge vrste');
  const crke = pot.map(i => crkeCelice(s.celice[i]));
  assert.deepEqual(crke, [['z', 'x'], ['x', 'y'], ['y', 'a'], ['a', 'b'], ['b', 'z']], 'črke po vrsti verige');
  for (let n = 1; n < 5; n++) assert.ok(vidita(pot[n - 1], pot[n]), `celici ${n} in ${n + 1} se vidita`);
  const izbris = cel.map((c, i) => [i, c]).filter(([, c]) => c.zetoni.some(t => t.izbris));
  assert.equal(izbris.length, 1, 'ena celica izbrisa');
  const [ie, ce] = izbris[0];
  assert.deepEqual(ce.zetoni, [{ z: 'z', izbris: true }], 'celica izbrisa: samo prečrtan z');
  assert.ok(vidita(ie, pot[0]) && vidita(ie, pot[4]), 'celica izbrisa vidi oba konca');
  assert.deepEqual(s.vidi.map(p => p.split(' ').map(indeks)), [[ie, pot[0]], [ie, pot[4]]]);
  // Motor: celice v vrstnem redu verige (od konca z nižjim položajem) so pot po povezavah.
  const d = deskaIzSheme('xy-chain');
  const k = iz(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(d.grid)}; b.cand = ${JSON.stringify(d.cand)};
    return xyChain(b).map(k => ({ cells: k.cells, veriga: k.veriga, hint: k.hint })); })()`);
  assert.equal(k.length, 1);
  assert.deepEqual(k[0].cells, pot[0] < pot[4] ? pot : [...pot].reverse());
  assert.deepEqual(k[0].hint, { digits: [STEVKA.z], celic: 5 });
  // Popravek po pregledu koraka 4: razlaga in posledica uporabljata črke sheme - pari v razlagi
  // sta prvi dve celici verige, posledica sledi vrednostim po verigi.
  const opis = iz('TEHNIKE_OPISI["xy-chain"]');
  const pariRazlage = [...opis.razlaga.matchAll(/\{([a-z]), ([a-z])\}/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(pariRazlage, crke.slice(0, 2), 'pari v razlagi = prvi dve celici sheme');
  assert.match(opis.razlaga, new RegExp(`si delita ${crke[0][1]}, druga in tretja ${crke[1][1]},`));
  assert.ok(opis.posledica.startsWith(`Če prva celica ni z, je ${crke[0][1]}. Potem druga ni ${crke[0][1]}, torej je ${crke[1][1]}, tretja ni ${crke[1][1]} … in zadnja celica je z.`), opis.posledica);
});
