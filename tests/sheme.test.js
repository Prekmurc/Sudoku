'use strict';
// Shema vzorca pri razlagi tehnik (faza 3a, docs/faza3a-nacrt.md; shared/sheme.js):
//   - sheme so samo pri tehnikah 1-12 (TRENING_TEHNIKE), E1 in E2 je nimata;
//   - motor: na deski iz sheme (črke -> števke, »…« -> vse druge števke, celice izseka brez črk
//     vpisane, celice zunaj izseka prazne z vsemi kandidati) funkcija tehnike najde natanko en
//     korak - celice vzorca in izbrise sheme;
//   - napis o črkah našteje samo črke na shemi (dodatek 1), vrstica »Enako velja …« pri 1-8
//     (dodatek 2), izris v nadomestnem DOM-u;
//   - razdelek »Shema« v treningu (dodatek 4): nad mrežo vaje za »Razlaga«, v »Spoznaj« odprt,
//     v »Vadi v uganki« zaprt, stanje ostane ob naslednji vaji kroga, E1 brez razdelka.
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

test('sheme so samo pri tehnikah 1-12, E1 in E2 je nimata; korak 1: sheme 3-6', () => {
  const kljuci = TRENING.map(([k]) => k);
  for (const k of Object.keys(SHEME)) assert.ok(kljuci.includes(k), `${k} ni tehnika 1-12`);
  for (const k of ['naked-single', 'hidden-single']) assert.equal(SHEME[k], undefined, k);
  for (const k of ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple']) assert.ok(SHEME[k], `${k} nima sheme`);
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

test('napis o črkah našteje samo črke na shemi, »…« samo, če je na njej; »Enako velja« pri 1-8', () => {
  const PRICAKOVANO = {
    'naked-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'hidden-pair': 'x, y – poljubni različni števki; … – drugi kandidati; prazna celica – brez x in y.',
    'naked-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
    'hidden-triple': 'x, y, z – poljubne različne števke; … – drugi kandidati; prazna celica – brez x, y in z.',
  };
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
  assert.equal(run('g.children[1].children.map(c => c.textContent).join(" | ")'), 'celici para | xkandidat za izbris');
  assert.equal(run('izrisiShemo("naked-single")'), null);
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
});
