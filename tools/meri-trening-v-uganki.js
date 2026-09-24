'use strict';
// Meritev za "Vadi v uganki" (docs/trening-v-uganki.md): kako hitro najdemo PRAVO stanje
// uganke, v katerem je naslednji korak motorja izbrana tehnika (E1, E2, 1-12).
//
// Zagon iz korena projekta:
//   node tools/meri-trening-v-uganki.js [--ugank N] [--seme S] [--json pot.json]
//
// Postopek (za vsako seme S, S+1, ... S+N-1):
//   1. uganka: naključna polna mreža, iz katere se v naključnem vrstnem redu odstranjujejo
//      celice, dokler je rešitev ena (ista zanka kot v ustvariUganko() v shared/generator.js,
//      le brez ocene stopnje na vsakem koraku - zato je hitrejša; isto seme da isto polno
//      mrežo in isti vrstni red kot ustvariUganko(), torej zadnjo uganko na njegovi poti);
//   2. pot: od danosti se ponavlja nextStep(b) BREZ prednosti števke (čisti vrstni red
//      ALL_TECHNIQUES). Pot se ustavi pri rešitvi ali pri prvem poskusu s protislovjem
//      (stanja za njim imajo kandidate, izbrisane z ugibanjem, zato za vajo niso primerna);
//   3. razvrstitev uganke po stopnji (oceniUganko(), pokrivajoče merilo - enako kot gumb
//      "Oceni zbirko"). Razvrstitev NI del merjenega časa iskanja - aplikacija je ne
//      potrebuje.
//
// Dve definiciji "tehnika T je naslednji korak" v stanju na poti:
//   strogo  - nextStep(b) brez prednosti števke vrne korak tehnike T: vse tehnike pred T
//             (po ALL_TECHNIQUES) v tem stanju ne najdejo ničesar;
//   skupina - T nekaj najde in je v NAJLAŽJI skupini TECHNIQUE_GROUPS, ki sploh kaj najde
//             (lažje skupine ne najdejo ničesar, tehnike iz iste skupine pa lahko). To je
//             pravilo sidra v nextStep(): znotraj skupine lahko prednost števke izbere
//             katero koli tehniko skupine.
//
// Čas iskanja tehnike T se simulira na zaporedju ugank: poskus se začne pri uganki i in
// sešteva čas ustvarjanja + čas poti vsake uganke, dokler se T ne pojavi (pri uganki s T
// šteje čas poti samo do prvega stanja s T - tam bi se aplikacija ustavila). Nato se začne
// nov poskus. Delež uspehov v meji je delež poskusov, ki so se končali v meji.
//
// "Čisto stanje" = stanje, pred katerim so bili na poti sami enojčki: kandidati so takrat
// natanko tisti, ki jih dovolijo števke (kot v igri brez ročno odstranjenih kandidatov).
//
// Pri prvem strogem stanju vsake tehnike v uganki se zabeleži še (ni del časa iskanja):
// koliko različnih korakov T je v stanju, koliko izbrisov ima korak nextStep() in ali v
// stanju kaj najde tudi katera druga (težja) tehnika - to je podlaga za preverjanje odgovora.

const { loadEngine } = require('../tests/load-engine.js');
const fs = require('node:fs');

const E = loadEngine(undefined, {
  files: ['shared/generator.js'],
  names: ['nextStep', 'applyStep', 'genPrng', 'genPremesaj', 'genPolnaMreza', 'oceniUganko',
    'TRENING_TEHNIKE', 'TECHNIQUE_GROUPS', 'techniqueGroup'],
});

const args = process.argv.slice(2);
const arg = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? args[i + 1] : privzeto;
};
const N = Number(arg('--ugank', 300));
const SEME = Number(arg('--seme', 1));
const JSON_POT = arg('--json', null);

// Tehnike v vrstnem redu treninga: [oznaka, ime v motorju].
const TEHNIKE = [
  ['E1', 'Gol enojček'],
  ['E2', 'Skriti enojček'],
  ...E.TRENING_TEHNIKE.map(([, ime], i) => [String(i + 1), ime]),
];
const FN = new Map(E.ALL_TECHNIQUES);
const ENOJCKA = ['Gol enojček', 'Skriti enojček'];
const POSKUS = 'Poskus in protislovje (forcing chain)';
// Stopnje in oznaka uganke, ki jo motor reši samo z ugibanjem (oceniUganko()).
const STOPNJE = ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Presega tehnike'];

const zdaj = () => Number(process.hrtime.bigint()) / 1e6; // ms

function minimalnaUganka(seme) {
  const rnd = E.genPrng(seme);
  const g = E.genPolnaMreza(rnd);
  for (const c of E.genPremesaj([...Array(81).keys()], rnd)) {
    const v = g[c];
    g[c] = 0;
    if (E.countSolutions(g.join('')) !== 1) g[c] = v;
  }
  return g.join('');
}

// Ob prvem strogem stanju tehnike: podatki za preverjanje odgovora.
function opisStanja(b, korak) {
  const koraki = FN.get(korak.technique)(b);
  const drugi = E.ALL_TECHNIQUES.filter(([ime, fn]) => ime !== korak.technique && fn(b).length).map(([ime]) => ime);
  return { korakov: koraki.length, izbrisov: korak.eliminate.length + korak.assign.length, drugi };
}

// Pot brez prednosti števke. Za vsako definicijo (strogo, skupina) vrne Map(ime -> { prvic:
// ms od začetka poti do prvega stanja, stanj, cisto, praznih }). Čas pri "skupina" vključuje
// še preizkus preostalih tehnik skupine (to bi moralo narediti tudi iskanje v aplikaciji).
function pot(danosti) {
  const b = new E.Board(danosti);
  const strogo = new Map();
  const skupina = new Map();
  const opisi = new Map();
  let tStrogo = 0;
  let tSkupina = 0;
  let samiEnojcki = true;
  let korakov = 0;
  let poskus = false;
  const zabelezi = (m, ime, t, praznih) => {
    let z = m.get(ime);
    if (!z) { z = { prvic: t, stanj: 0, cisto: false, praznih }; m.set(ime, z); }
    z.stanj++;
    if (samiEnojcki) z.cisto = true;
  };
  while (!b.isSolved() && korakov < 500) {
    let t0 = zdaj();
    const k = E.nextStep(b, E.ALL_TECHNIQUES);
    const tKorak = zdaj() - t0;
    tStrogo += tKorak;
    tSkupina += tKorak;
    if (!k || k.technique === POSKUS) { poskus = !!k; break; }
    const praznih = b.grid.filter(v => v === 0).length;
    zabelezi(strogo, k.technique, tStrogo, praznih);
    // Skupina: tehnike iz iste skupine ZA najdeno (tiste pred njo ne najdejo ničesar).
    t0 = zdaj();
    const g = E.techniqueGroup(k.technique);
    const vSkupini = [k.technique];
    let za = false;
    for (const [ime, fn] of E.ALL_TECHNIQUES) {
      if (ime === k.technique) { za = true; continue; }
      if (za && E.techniqueGroup(ime) === g && fn(b).length) vSkupini.push(ime);
    }
    tSkupina += zdaj() - t0;
    for (const ime of vSkupini) zabelezi(skupina, ime, tSkupina, praznih);
    if (!opisi.has(k.technique)) opisi.set(k.technique, opisStanja(b, k));
    if (!ENOJCKA.includes(k.technique)) samiEnojcki = false;
    E.applyStep(b, k);
    korakov++;
  }
  return { strogo, skupina, opisi, tStrogo, tSkupina, korakov, poskus };
}

/* ---------- zbiranje ---------- */

const uganke = [];
const tZacetek = zdaj();
for (let i = 0; i < N; i++) {
  const seme = SEME + i;
  const t0 = zdaj();
  const danosti = minimalnaUganka(seme);
  const tGen = zdaj() - t0;
  const p = pot(danosti);
  const o = E.oceniUganko(danosti);
  uganke.push({ seme, danosti, tGen, ...p, stopnja: o.tezavnost });
  if ((i + 1) % 500 === 0) process.stderr.write(`  ${i + 1}/${N} (${((zdaj() - tZacetek) / 1000).toFixed(0)} s)\n`);
}

/* ---------- analiza ---------- */

const povp = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const kvantil = (a, q) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const odst = (a, b) => (b ? (100 * a / b).toFixed(1).replace('.', ',') + ' %' : '–');
const sek = ms => (Number.isFinite(ms) ? (ms / 1000).toFixed(2).replace('.', ',') + ' s' : '–');
const dec = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n).replace('.', ',') : '–');

const tGenPovp = povp(uganke.map(u => u.tGen));
const tPotPovp = povp(uganke.map(u => u.tStrogo));
const poStopnjah = Object.fromEntries(STOPNJE.map(s => [s, uganke.filter(u => u.stopnja === s).length]));

// Poskusi iskanja tehnike po zaporedju ugank (def = 'strogo' | 'skupina').
function poskusi(ime, def, samoCisto) {
  const casi = [];
  let tek = 0;
  for (const u of uganke) {
    const z = u[def].get(ime);
    if (z && (!samoCisto || z.cisto)) {
      casi.push(tek + u.tGen + z.prvic);
      tek = 0;
    } else {
      tek += u.tGen + (def === 'strogo' ? u.tStrogo : u.tSkupina);
    }
  }
  return casi;
}

function vrstica(ime, def) {
  const z = uganke.filter(u => u[def].has(ime));
  const casi = poskusi(ime, def, false);
  const casiC = poskusi(ime, def, true);
  const iz = Object.fromEntries(STOPNJE.map(s => [s, z.filter(u => u.stopnja === s).length]));
  return {
    ugank: z.length,
    stanjNaUganko: povp(z.map(u => u[def].get(ime).stanj)),
    praznih: povp(z.map(u => u[def].get(ime).praznih)),
    ugankCisto: z.filter(u => u[def].get(ime).cisto).length,
    poskusov: casi.length,
    casPovp: povp(casi),
    casP90: kvantil(casi, 0.9),
    v2: casi.filter(t => t <= 2000).length,
    v10: casi.filter(t => t <= 10000).length,
    casPovpCisto: povp(casiC),
    poskusovCisto: casiC.length,
    v2Cisto: casiC.filter(t => t <= 2000).length,
    iz,
    pogojno: Object.fromEntries(STOPNJE.map(s => [s, poStopnjah[s] ? iz[s] / poStopnjah[s] : 0])),
  };
}

// Ocena po geometrijski porazdelitvi (za tehnike z malo poskusi): verjetnost p, da ima
// uganka stanje s T, in povprečen čas na uganko t -> v meji M je uspeh 1 - (1-p)^(M/t).
const tNaUganko = tGenPovp + tPotPovp;
const geom = (p, meja) => (p > 0 ? 1 - Math.pow(1 - p, meja / tNaUganko) : 0);

const rezultat = TEHNIKE.map(([oznaka, ime]) => {
  const opisi = uganke.map(u => u.opisi.get(ime)).filter(Boolean);
  const drugi = {};
  for (const o of opisi) for (const d of o.drugi) drugi[d] = (drugi[d] || 0) + 1;
  return {
    oznaka, ime,
    strogo: vrstica(ime, 'strogo'),
    skupina: vrstica(ime, 'skupina'),
    korakovT: povp(opisi.map(o => o.korakov)),
    izbrisov: povp(opisi.map(o => o.izbrisov)),
    zDrugo: opisi.filter(o => o.drugi.filter(d => !ENOJCKA.includes(d) || ENOJCKA.includes(ime)).length).length / (opisi.length || 1),
    drugi,
  };
});

/* ---------- izpis ---------- */

console.log(`Ugank: ${N} (semena ${SEME}–${SEME + N - 1}), skupni čas ${sek(zdaj() - tZacetek)}`);
console.log(`Povprečen čas na uganko: ustvarjanje ${dec(tGenPovp, 1)} ms, pot ${dec(tPotPovp, 1)} ms`);
console.log(`Uganke po stopnjah: ${STOPNJE.map(s => `${s} ${poStopnjah[s]} (${odst(poStopnjah[s], N)})`).join(', ')}`);
console.log(`Pot se je ustavila pri poskusu s protislovjem: ${uganke.filter(u => u.poskus).length}`);

for (const def of ['strogo', 'skupina']) {
  console.log('');
  console.log(`### Definicija: ${def}`);
  console.log('| Tehnika | ugank s stanjem | stanj na uganko | praznih celic | čisto stanje | povp. čas | 90 % v | v 2 s | v 10 s | v 2 s (geom.) | v 10 s (geom.) | povp. čas (čisto) |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of rezultat) {
    const v = r[def];
    const p = v.ugank / N;
    console.log(`| ${r.oznaka} ${r.ime} | ${v.ugank} (${odst(v.ugank, N)}) | ${dec(v.stanjNaUganko)} | ${dec(v.praznih, 0)} | ${odst(v.ugankCisto, N)} | ${sek(v.casPovp)} | ${sek(v.casP90)} | ${odst(v.v2, v.poskusov)} | ${odst(v.v10, v.poskusov)} | ${odst(geom(p, 2000), 1)} | ${odst(geom(p, 10000), 1)} | ${sek(v.casPovpCisto)} |`);
  }
  console.log('');
  console.log(`Iz katerih stopenj pridejo stanja (${def}): delež ugank s stanjem po stopnji · verjetnost stanja v uganki te stopnje`);
  console.log(`| Tehnika | ${STOPNJE.join(' | ')} |`);
  console.log(`|---|${STOPNJE.map(() => '---:').join('|')}|`);
  for (const r of rezultat) {
    const v = r[def];
    console.log(`| ${r.oznaka} | ${STOPNJE.map(s => `${odst(v.iz[s], v.ugank)} · ${odst(v.pogojno[s] * 100, 100)}`).join(' | ')} |`);
  }
}

console.log('');
console.log('### Prvo strogo stanje: večznačnost odgovora');
console.log('| Tehnika | korakov T v stanju | izbrisov/vpisov v koraku | stanj, kjer kaj najde še druga tehnika | najpogostejše druge |');
console.log('|---|---:|---:|---:|---|');
for (const r of rezultat) {
  const top = Object.entries(r.drugi).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k} (${n})`).join(', ');
  console.log(`| ${r.oznaka} ${r.ime} | ${dec(r.korakovT)} | ${dec(r.izbrisov)} | ${odst(r.zDrugo * 100, 100)} | ${top} |`);
}

if (JSON_POT) {
  const mapa = m => Object.fromEntries([...m]);
  fs.writeFileSync(JSON_POT, JSON.stringify({
    N, SEME, tGenPovp, tPotPovp, poStopnjah, rezultat,
    uganke: uganke.map(u => ({ seme: u.seme, stopnja: u.stopnja, tGen: u.tGen, tStrogo: u.tStrogo, tSkupina: u.tSkupina,
      poskus: u.poskus, strogo: mapa(u.strogo), skupina: mapa(u.skupina) })),
  }));
}
