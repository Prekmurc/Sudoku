'use strict';
// Shema vzorca pri razlagi tehnik (faza 3a, docs/faza3a-nacrt.md; shared/sheme.js):
//   - sheme so samo pri tehnikah 1-12 (TRENING_TEHNIKE), E1 in E2 je nimata;
//   - motor: na deski iz sheme (črke -> števke, »…« -> vse druge števke, celice izseka brez črk
//     vpisane, celice zunaj izseka prazne z vsemi kandidati) funkcija tehnike najde natanko en
//     korak - celice vzorca in izbrise sheme;
//   - napis o črkah našteje samo črke na shemi (dodatek 1), vrstica »Enako velja …« pri 1-8
//     (dodatek 2), izris v nadomestnem DOM-u;
//   - popravki po pregledu koraka 1: trojici imata celice z dvema in s tremi črkami in opombo
//     »Celica trojice ima dve ali vse tri črke.«, legenda ima rožnato »celica izbrisa«, kadar je
//     taka celica na shemi;
//   - razdelek »Shema« v treningu (dodatek 4): nad mrežo vaje za »Razlaga«, v »Spoznaj« odprt,
//     v »Vadi v uganki« zaprt, stanje ostane ob naslednji vaji kroga, E1 brez razdelka;
//   - korak 2: sheme 1, 2 (pas) in 7, 8 (9 × 9) samo z x - lažje tehnike in skriti enojček na
//     njih ne najdejo ničesar, pri 9 × 9 se prazne vrstice, stolpci in bloki ujemajo z vpisanimi x;
//     razdelek »Shema« pri 9 × 9 tudi v »Spoznaj« privzeto zaprt, pri pasu odprt.
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
const IZSEKI = { vrstica: [1, 9], pas: [3, 9], mreza: [9, 9] };
const STEVKA = { x: 1, y: 2, z: 3, a: 1, b: 2 };

// Zapis celice: žetoni, »-« = izbris, »*« = celica vzorca (glej shared/sheme.js) - tu
// neodvisno od shemaCelica().
function celica(zapis) {
  const vzorec = zapis.startsWith('*');
  const zetoni = zapis.replace(/^\*/, '').split(' ').filter(Boolean);
  return { vzorec, zetoni: zetoni.map(t => ({ z: t.replace(/^-/, ''), izbris: t.startsWith('-') })) };
}

// Deska iz sheme in pričakovani korak { celice, izbrisi } (celice 0-80, izbrisi "celica:števka").
function deskaIzSheme(kljuc) {
  const s = SHEME[kljuc];
  const [V, S] = IZSEKI[s.izsek];
  const crke = new Set(s.celice.flatMap(z => celica(z).zetoni.map(t => t.z)).filter(z => z !== '…'));
  const stevkeCrk = new Set([...crke].map(c => STEVKA[c]));
  const druge = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !stevkeCrk.has(d));
  const grid = Array(81).fill(0), cand = Array(81).fill(0x3FE);
  const celice = [], izbrisi = [];
  s.celice.forEach((zapis, i) => {
    const r = Math.floor(i / S), c = i % S, idx = r * 9 + c;
    const cel = celica(zapis);
    if (!cel.zetoni.length) { grid[idx] = 9; cand[idx] = 1 << 9; return; }
    let m = 0;
    for (const t of cel.zetoni) {
      const ds = t.z === '…' ? druge : [STEVKA[t.z]];
      for (const d of ds) {
        m |= 1 << d;
        if (t.izbris) izbrisi.push(`${idx}:${d}`);
      }
    }
    cand[idx] = m;
    if (cel.vzorec) celice.push(idx);
  });
  assert.equal(s.celice.length, V * S, `${kljuc}: število celic izseka`);
  return { grid, cand, celice: celice.sort((a, b) => a - b), izbrisi: izbrisi.sort() };
}

test('sheme so samo pri tehnikah 1-12, E1 in E2 je nimata; korak 2: sheme 1-8', () => {
  const kljuci = TRENING.map(([k]) => k);
  for (const k of Object.keys(SHEME)) assert.ok(kljuci.includes(k), `${k} ni tehnika 1-12`);
  for (const k of ['naked-single', 'hidden-single']) assert.equal(SHEME[k], undefined, k);
  for (const [k] of TRENING.slice(0, 8)) assert.ok(SHEME[k], `${k} nima sheme`);
  const izseki = Object.fromEntries(TRENING.slice(0, 8).map(([k]) => [k, SHEME[k].izsek]));
  assert.deepEqual(izseki, { 'pointing': 'pas', 'box-line': 'pas', 'naked-pair': 'vrstica', 'hidden-pair': 'vrstica',
    'naked-triple': 'vrstica', 'hidden-triple': 'vrstica', 'x-wing': 'mreza', 'swordfish': 'mreza' });
});

for (const kljuc of Object.keys(SHEME)) {
  test(`motor: shema ${kljuc} - funkcija tehnike najde natanko vzorec in izbrise sheme`, () => {
    const d = deskaIzSheme(kljuc);
    const ime = TRENING.find(([k]) => k === kljuc)[1];
    const koraki = iz(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(d.grid)}; b.cand = ${JSON.stringify(d.cand)};
      return ALL_TECHNIQUES.find(([n]) => n === ${JSON.stringify(ime)})[1](b)
        .map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbrisi: k.eliminate.map(([c, s]) => c + ':' + s).sort() })); })()`);
    assert.equal(koraki.length, 1, `${kljuc}: en sam korak (${JSON.stringify(koraki)})`);
    assert.deepEqual(koraki[0].celice, d.celice, `${kljuc}: celice vzorca`);
    assert.deepEqual(koraki[0].izbrisi, d.izbrisi, `${kljuc}: izbrisi`);
    assert.ok(d.izbrisi.length > 0);
  });
}

// Sheme ene števke (1, 2, 7, 8): samo x; lažja tehnika ali skriti enojček na deski iz sheme bi
// pomenila, da vzorec ni potreben (npr. kot vogal X-krila, ki je edini x v bloku).
const ENA_STEVKA = ['pointing', 'box-line', 'x-wing', 'swordfish'];
for (const kljuc of ENA_STEVKA) {
  test(`shema ${kljuc}: samo x, lažje tehnike in skriti enojček ne najdejo ničesar`, () => {
    const znaki = new Set(SHEME[kljuc].celice.flatMap(z => celica(z).zetoni.map(t => t.z)));
    assert.deepEqual([...znaki], ['x'], kljuc);
    const d = deskaIzSheme(kljuc);
    const ime = TRENING.find(([k]) => k === kljuc)[1];
    const najdene = iz(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(d.grid)}; b.cand = ${JSON.stringify(d.cand)};
      const i = ALL_TECHNIQUES.findIndex(([n]) => n === ${JSON.stringify(ime)});
      // Gol enojček izpustimo: na shemi so narisani samo kandidati x.
      return ALL_TECHNIQUES.slice(1, i).filter(([, f]) => f(b).length).map(([n]) => n); })()`);
    assert.deepEqual(najdene, [], kljuc);
  });
}

test('sheme 9 × 9: prazne vrstice, stolpci in bloki se ujemajo z vpisanimi x (en x na vrstico, stolpec in blok)', () => {
  for (const kljuc of ENA_STEVKA.filter(k => SHEME[k].izsek === 'mreza')) {
    const x = SHEME[kljuc].celice.map(z => celica(z).zetoni.length > 0);
    const prazne = f => [...Array(9).keys()].filter(e => !x.some((ima, i) => ima && f(i) === e));
    const vr = prazne(i => Math.floor(i / 9)), st = prazne(i => i % 9);
    const bl = prazne(i => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3));
    assert.equal(vr.length, st.length, kljuc);
    assert.equal(vr.length, bl.length, kljuc);
    const perm = a => a.length <= 1 ? [a] : a.flatMap((e, i) => perm([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [e, ...p]));
    const ok = perm(st).some(p => {
      const b = vr.map((r, i) => Math.floor(r / 3) * 3 + Math.floor(p[i] / 3));
      return new Set(b).size === b.length && b.every(e => bl.includes(e));
    });
    assert.ok(ok, `${kljuc}: vrstice ${vr}, stolpci ${st}, bloki ${bl}`);
  }
});

test('napis o črkah našteje samo črke na shemi, »…« samo, če je na njej; »Enako velja« pri 1-8', () => {
  const PRICAKOVANO = {
    'naked-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'hidden-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'naked-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
    'hidden-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
    'pointing': 'x – poljubna števka; prazna celica – brez x.',
    'box-line': 'x – poljubna števka; prazna celica – brez x.',
    'x-wing': 'x – poljubna števka; prazna celica – brez x.',
    'swordfish': 'x – poljubna števka; prazna celica – brez x.',
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
    const naShemi = [...new Set(SHEME[k].celice.flatMap(z => celica(z).zetoni.map(t => t.z)).filter(z => z !== '…'))].sort();
    assert.deepEqual([...crke].sort(), naShemi, k);
    const n = TRENING.findIndex(([t]) => t === k) + 1;
    assert.equal(!!SHEME[k].enako, n <= 8, `${k}: vrstica »Enako velja« pri 1-8`);
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

test('trening: razdelek »Shema« za »Razlaga«; Spoznaj odprt, Vadi v uganki zaprt, stanje ostane v krogu, E1 brez', () => {
  const { run, izprazni, vaja, shema } = trening();
  run('zacniKrog("naked-triple", "spoznaj")');
  const otroci = vaja().children;
  const i = otroci.findIndex(e => e.className === 'shema-razdelek');
  assert.equal(otroci[i - 1].className, 'razlaga-tehnike', 'takoj za »Razlaga«');
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

  // Korak 2: pas (1, 2) v »Spoznaj« odprt, 9 × 9 (7, 8) tudi v »Spoznaj« zaprt.
  for (const [k, odprt] of [['pointing', true], ['box-line', true], ['x-wing', false], ['swordfish', false]]) {
    run(`zacniKrog(${JSON.stringify(k)}, "spoznaj")`);
    assert.equal(shema().open, odprt, `${k}: Spoznaj`);
    run(`zacniKrog(${JSON.stringify(k)}, "uganka")`);
    izprazni();
    assert.equal(shema().open, false, `${k}: Vadi v uganki`);
  }
  run('zacniKrog("x-wing", "spoznaj")');
  shema().open = true; shema().sprozi('toggle');
  run('exNum++; renderExercise()');
  assert.equal(shema().open, true, 'X-krilo: odprt ostane v naslednji vaji');
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
  const dom = makeDom();
  const { run } = loadContext(['shared/engine.js', 'shared/sheme.js'], dom.globals);
  for (const k of Object.keys(SHEME)) {
    run(`var f = izrisiShemo(${JSON.stringify(k)})`);
    const deli = JSON.parse(run('JSON.stringify(f.children.map(c => c.className))'));
    const pricakovano = ['shema-okvir', 'shema-legenda', 'shema-crke', ...(SHEME[k].opomba ? ['shema-opomba'] : []), 'shema-enako'];
    assert.deepEqual(deli, pricakovano, k);
    if (SHEME[k].opomba) assert.equal(run('f.children[3].textContent'), SHEME[k].opomba, k);
    const rozna = SHEME[k].celice.map(celica).some(c => !c.vzorec && c.zetoni.some(t => t.izbris));
    const legenda = run('f.children[1].children.map(c => c.textContent).join(" | ")');
    assert.equal(legenda.includes('celica izbrisa'), rozna, `${k}: ${legenda}`);
    // Na risbi je rožnata celica natanko takrat, ko je v legendi.
    assert.equal(run('f.children[0].innerHTML').includes('class="sh-izbris"'), rozna, k);
  }
});
