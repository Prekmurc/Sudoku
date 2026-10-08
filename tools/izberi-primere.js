'use strict';
// Izbor vgrajenih primerov (PRIMERI v shared/zbirka.js): po en primer za vsako stopnjo in
// vsako tehniko. Ponovi ga ob novi tehniki ali spremembi motorja / generatorja.
//
// Zagon iz korena projekta:
//   node tools/izberi-primere.js [--zelotezka-semen 2000] [--presega-semen 500] [--vir-semen 30000] [--danosti] [--json pot]
// (pribl. 5 min - večino časa vzame iskanje X-krila v viru banke)
//
// Sestava:
//   - lahka: uganka iz banke vaj (shared/vaje-banka.js) stopnje Lahka z obema enojčkoma;
//   - srednja: za vsako tehniko iz GEN_SREDNJE uganka iz banke stopnje Srednja s to
//     tehniko in še vsaj eno drugo srednjo, skupaj največ GLAVNA_SREDNJE_NAJVEC srednjih;
//   - težka: za vsako tehniko iz GEN_NAPREDNE uganka iz banke stopnje Težka, ki ima to
//     napredno tehniko, vsaj GEN_NAJMANJ_SREDNJIH srednjih in skupaj največ
//     GEN_TEZKA_NAJVEC tehnik nad enojčki (meje generatorja - ustrezaIskanju);
//   - zelo težka: generator (ustvariUganko('zelotezka', seme)) z natanko dvema naprednima;
//   - ekstrem: za vsako tehniko iz GEN_EKSPERTNE uganka iz banke stopnje Ekstrem (če je ni, iz
//     vira banke), v kateri reševalec to tehniko uporabi natanko enkrat, brez napredne tehnike na
//     poti in z vsaj GEN_NAJMANJ_SREDNJIH srednjimi (O10 v docs/xy-veriga-nacrt.md - ekspertna
//     tehnika je edina »težka«); med njimi najkrajša veriga (najmanj celic), nato najnižje seme;
//   - srednja ali težka tehnika brez ustrezne uganke v banki: iz vira banke (glej izberi());
//   - presega tehnike: banka takih ugank nima, zato iz istega vira kot banka
//     (genMinimalnaUganka(seme)), uganka, pri kateri motor obtiči.
// Pogoj pri vseh: reševalec (dnevnik solve()) uporabi natanko iste tehnike kot pot, ki je
// določila stopnjo (mere.uporabljene - od tod oznaka "tehnike:" pri težki uganki), enojčki
// vključeni. Pri presega tehnike je oznaka iz dnevnika solve(), zato pogoj velja sam.
// Izbira med ustreznimi (srednja, težka): pri presekih (glavna tehnika 1 ali 2 - GEN_PRESEKI)
// najprej uganka z najlažjimi drugimi srednjimi tehnikami (najlažja srednja uganka, brez
// 4, 5 in 6, če gre); nato glavna tehnika je najtežja na poti, če taka obstaja, nato največ
// uporab glavne tehnike v dnevniku, nato najnižje seme. Ista uganka ni primer dvakrat.

const { loadEngine } = require('../tests/load-engine.js');

const E = loadEngine(undefined, {
  files: ['shared/generator.js', 'shared/vaje-banka.js'],
  names: ['VAJE_BANKA', 'genRazvrsti', 'oceniTezavnost', 'ustvariUganko', 'genMinimalnaUganka',
    'GEN_LAHKE', 'GEN_PRESEKI', 'GEN_SREDNJE', 'GEN_NAPREDNE', 'GEN_EKSPERTNE', 'GEN_NAJMANJ_SREDNJIH', 'GEN_TEZKA_NAJVEC',
    'OCENA_PRESEGA', 'imeTehnike', 'redTehnike', 'TRENING_TEHNIKE'],
});

const args = process.argv.slice(2);
const arg = (ime, privzeto) => {
  const i = args.indexOf(ime);
  return i >= 0 ? Number(args[i + 1]) : privzeto;
};
const ZELOTEZKA_SEMEN = arg('--zelotezka-semen', 2000);
const PRESEGA_SEMEN = arg('--presega-semen', 500);
const VIR_SEMEN = arg('--vir-semen', 30000);
const GLAVNA_SREDNJE_NAJVEC = 3;

const uredi = (imena) => [...imena].sort((a, b) => E.redTehnike(a) - E.redTehnike(b));
const POSKUS = /protislovje/;
// Oznaka iz ključa ALL_TECHNIQUES: E1, E2 (GEN_LAHKE) ali številka iz TRENING_TEHNIKE.
const oz = (t) => E.GEN_LAHKE.includes(t) ? 'E' + (E.GEN_LAHKE.indexOf(t) + 1)
  : String(E.TRENING_TEHNIKE.findIndex(([, k]) => k === t) + 1);

// Dnevnik solve(): { mnozica tehnik brez poskusa, uporabe po tehnikah, poskusov, celic - največ
// celic v koraku tehnike (dolžina verige) }.
function dnevnik(danosti) {
  const { log } = E.solve(danosti);
  const uporabe = {}, celic = {};
  let poskusov = 0;
  for (const k of log) {
    if (POSKUS.test(k.technique)) { poskusov++; continue; }
    uporabe[k.technique] = (uporabe[k.technique] || 0) + 1;
    celic[k.technique] = Math.max(celic[k.technique] || 0, k.cells.length);
  }
  return { mnozica: new Set(Object.keys(uporabe)), uporabe, poskusov, celic };
}

const enaki = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

function opisi(danosti, stopnja, glavna, vir) {
  const o = E.oceniTezavnost(danosti);
  const d = dnevnik(danosti);
  const pot = o.mere ? o.mere.uporabljene : null;
  return {
    danosti, stopnja: o.tezavnost, glavna, vir, mere: o.mere,
    tehnike: uredi(pot || d.mnozica), poskusov: d.poskusov,
    ujemanje: pot ? enaki(pot, d.mnozica) : true, uporabe: d.uporabe, celic: d.celic,
    danih: [...danosti].filter(c => c !== '0' && c !== '.').length,
  };
}

const zBanke = (stopnja) => E.VAJE_BANKA.filter(z => z.stopnja === stopnja)
  .map(z => ({ ...opisi(z.danosti, stopnja, null, 'banka, seme ' + z.seme), seme: z.seme }));

const najtezja = (r, raven) => uredi([...r.mere.uporabljene].filter(t => raven.includes(t))).pop();
// Položaji drugih srednjih tehnik od najtežje navzdol (za primerjavo po vrsti).
const druge = (r, glavna) => [...r.mere.uporabljene].filter(t => t !== glavna && E.GEN_SREDNJE.includes(t))
  .map(t => E.redTehnike(t)).sort((x, y) => y - x);
const lazjeDruge = (a, b, glavna) => {
  const da = druge(a, glavna), db = druge(b, glavna);
  for (let i = 0; i < Math.max(da.length, db.length); i++) {
    if (da[i] !== db[i]) return (da[i] ?? -1) - (db[i] ?? -1);
  }
  return 0;
};
const boljsi = (glavna, raven) => (a, b) =>
  (E.GEN_PRESEKI.includes(glavna) ? lazjeDruge(a, b, glavna) : 0)
  || (najtezja(b, raven) === glavna) - (najtezja(a, raven) === glavna)
  || (b.uporabe[glavna] || 0) - (a.uporabe[glavna] || 0)
  || a.seme - b.seme;

const izbor = [];
const manjka = [];

// Lahka
const lahke = zBanke('Lahka').filter(r => r.ujemanje && E.GEN_LAHKE.every(t => r.mere.uporabljene.has(t)))
  .sort((a, b) => a.seme - b.seme);
if (lahke.length) izbor.push({ ...lahke[0], glavna: null, kandidatov: lahke.length });
else manjka.push('Lahka (E1 in E2)');

// Srednja in težka: najprej iz banke; če tam ni nobene ustrezne, iz vira banke
// (genMinimalnaUganka(seme), od semena 1 do prve ustrezne ali --vir-semen) - banka hrani uganke
// po stanjih vaje, ne po poti ocene (pri X-krilu ocena vseh njenih ugank izbere drugo napredno).
const opisTeh = (t) => E.imeTehnike(t, { stevilka: true, anglesko: false });
function izberi(stopnja, raven, pogoj) {
  const banka = zBanke(stopnja);
  for (const t of raven) {
    const ok = banka.filter(r => r.ujemanje && pogoj(t, r) && !izbor.some(p => p.danosti === r.danosti))
      .sort(boljsi(t, raven));
    if (ok.length) { izbor.push({ ...ok[0], glavna: t, kandidatov: ok.length }); continue; }
    let najden = null;
    for (let s = 1; s <= VIR_SEMEN && !najden; s++) {
      const d = E.genMinimalnaUganka(s);
      if (E.oceniTezavnost(d).tezavnost !== stopnja) continue;
      const r = { ...opisi(d, stopnja, t, 'genMinimalnaUganka, seme ' + s), seme: s };
      if (r.ujemanje && pogoj(t, r)) najden = r;
    }
    if (najden) {
      izbor.push({ ...najden, kandidatov: '0 v banki' });
      manjka.push(`${stopnja}, ${opisTeh(t)}: v banki ni ustrezne uganke - vzeta je iz vira banke (${najden.vir}).`);
    } else {
      const blizu = banka.filter(r => r.mere.uporabljene.has(t)).sort(boljsi(t, raven));
      manjka.push(`${stopnja}, ${opisTeh(t)}: ni primera (banka in semena 1-${VIR_SEMEN}); v banki s tehniko ${blizu.length} ugank`
        + (blizu.length ? ` (npr. seme ${blizu[0].seme}: ${blizu[0].tehnike.map(oz).join(', ')})` : ''));
    }
  }
}
izberi('Srednja', E.GEN_SREDNJE, (t, r) => r.mere.uporabljene.has(t)
  && r.mere.srednje >= 2 && r.mere.srednje <= GLAVNA_SREDNJE_NAJVEC);
izberi('Težka', E.GEN_NAPREDNE, (t, r) => r.mere.uporabljene.has(t) && r.mere.napredne === 1
  && r.mere.srednje >= E.GEN_NAJMANJ_SREDNJIH && r.mere.tehNad <= E.GEN_TEZKA_NAJVEC);

// Zelo težka (generator)
let zelo = null;
for (let s = 1; s <= ZELOTEZKA_SEMEN && !zelo; s++) {
  const u = E.ustvariUganko('zelotezka', s);
  if (!u || u.mere.napredne !== 2) continue;
  const r = opisi(u.danosti, 'Zelo težka', null, 'generator, seme ' + s);
  if (r.ujemanje && r.stopnja === 'Zelo težka') zelo = { ...r, seme: s, glavna: uredi([...r.mere.uporabljene].filter(t => E.GEN_NAPREDNE.includes(t))) };
}
if (zelo) izbor.push(zelo);
else manjka.push(`Zelo težka: v semenih 1-${ZELOTEZKA_SEMEN} ni primera`);

// Ekstrem: za vsako ekspertno tehniko (banka, sicer vir banke).
const ekstremPogoj = (t, r) => r.ujemanje && r.uporabe[t] === 1 && r.mere.napredne === 0
  && r.mere.srednje >= E.GEN_NAJMANJ_SREDNJIH && !izbor.some(p => p.danosti === r.danosti);
const krajsa = (t) => (a, b) => a.celic[t] - b.celic[t] || a.seme - b.seme;
for (const t of E.GEN_EKSPERTNE) {
  const ok = zBanke('Ekstrem').filter(r => ekstremPogoj(t, r)).sort(krajsa(t));
  if (ok.length) { izbor.push({ ...ok[0], glavna: t, kandidatov: ok.length }); continue; }
  let najden = null;
  for (let s = 1; s <= VIR_SEMEN && !najden; s++) {
    const d = E.genMinimalnaUganka(s);
    if (E.oceniTezavnost(d).tezavnost !== 'Ekstrem') continue;
    const r = { ...opisi(d, 'Ekstrem', t, 'genMinimalnaUganka, seme ' + s), seme: s };
    if (ekstremPogoj(t, r)) najden = r;
  }
  if (najden) {
    izbor.push({ ...najden, kandidatov: '0 v banki' });
    manjka.push(`Ekstrem, ${opisTeh(t)}: v banki ni ustrezne uganke - vzeta je iz vira banke (${najden.vir}).`);
  } else manjka.push(`Ekstrem, ${opisTeh(t)}: ni primera (banka in semena 1-${VIR_SEMEN})`);
}

// Presega tehnike (vir banke: genMinimalnaUganka) - prednost en sam poskus
let presega = null;
for (let s = 1; s <= PRESEGA_SEMEN; s++) {
  const d = E.genMinimalnaUganka(s);
  if (E.oceniTezavnost(d).tezavnost !== E.OCENA_PRESEGA) continue;
  const r = { ...opisi(d, E.OCENA_PRESEGA, null, 'genMinimalnaUganka, seme ' + s), seme: s };
  if (!presega || (r.poskusov === 1 && presega.poskusov !== 1)) presega = r;
  if (presega.poskusov === 1) break;
}
if (presega) izbor.push(presega);
else manjka.push('Presega tehnike: ni primera');

// Izpis
const glavnaBesedilo = (r) => r.glavna == null ? (r.stopnja === 'Lahka' ? 'enojčki' : 'z ugibanjem')
  : Array.isArray(r.glavna) ? r.glavna.map(t => E.imeTehnike(t, { stevilka: true, anglesko: false }).replace(' · ', ' ')).join(' in ')
  : E.imeTehnike(r.glavna, { stevilka: true, anglesko: false }).replace(' · ', ' ');
console.log('| Primer | Stopnja | Glavna tehnika | Vse tehnike | Danih | Vir | Ustreznih |');
console.log('|---|---|---|---|---|---|---|');
izbor.forEach((r, i) => {
  const teh = r.tehnike.map(oz).join(', ') + (r.poskusov ? ` + ugibanje (${r.poskusov}×)` : '');
  console.log(`| P_${i + 1} | ${r.stopnja} | ${glavnaBesedilo(r)} | ${teh} | ${r.danih} | ${r.vir} | ${r.kandidatov || '–'} |`);
});
if (manjka.length) { console.log('\nManjka:'); for (const m of manjka) console.log('  ' + m); }
const jsonPot = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
if (jsonPot) {
  require('node:fs').writeFileSync(jsonPot, JSON.stringify(izbor.map((r, i) => ({
    ime: 'P_' + (i + 1), tezavnost: r.stopnja, glavna: r.glavna, tehnike: r.tehnike,
    poskusov: r.poskusov, danih: r.danih, vir: r.vir, danosti: r.danosti,
  })), null, 2) + '\n');
}
if (args.includes('--danosti')) for (const [i, r] of izbor.entries()) console.log(`P_${i + 1} ${r.danosti}`);
