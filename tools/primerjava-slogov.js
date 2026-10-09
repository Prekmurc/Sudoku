'use strict';
// Primerjava izrisa z izhodiščem v scenarijih brskalnika (preveri-presek-, -enojcki-,
// -vadi-brskalnik.js): izris = { html, slogi }, kjer je slogi seznam nizov
// "vrednost|vrednost|..." po elementih (lastnosti v vrstnem redu `lastnosti`).
// Vrne seznam razlik za izpis - prazen, kadar sta izrisa enaka. Razlike v slogih so
// povzete po lastnostih (število elementov in do dva primera), da se pri spremembi
// videza (faza 5, docs/faza5-nacrt.md) vidi, katere lastnosti so se spremenile.

// Vrednosti sta enaki, tudi če se številke v njih razlikujejo za manj kot 0,05 (px): širina
// besedila (npr. gumb »Preveri«) med dvema zagonoma brskalnika niha za 1/64 px.
function enako(a, b) {
  if (a === b) return true;
  const st = /-?\d+(\.\d+)?/g;
  if (a.replace(st, '#') !== b.replace(st, '#')) return false;
  const x = a.match(st) || [], y = b.match(st) || [];
  return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < 0.05);
}

// Opisi tehnik iz shared/engine.js (povzetek in sedanje navodilo) in navodila pred nalogo 4b (izhodišča).
const OPISI = JSON.parse(require('../tests/load-engine.js').loadContext(['shared/engine.js']).run('JSON.stringify(TEHNIKE_OPISI)'));
const NAVODILA_PRED_4B = {
  'naked-pair': 'Izberi obe celici para.',
  'hidden-pair': 'Izberi obe celici, nato še obe števki para.',
  'naked-triple': 'Izberi vse tri celice trojice.',
  'hidden-triple': 'Izberi vse tri celice, nato še vse tri števke trojice.',
  // Korak 3 (7–13): navodila 9–13 so pod nalogo (pri 7 in 8 je pod nalogo lasten opis vaje - DODATEK_78).
  'x-wing': 'Izberi vse štiri vogale.',
  'swordfish': 'Izberi vse celice vzorca.',
  'turbot-fish': 'Števka je označena. Izberi vse štiri konce obeh povezav.',
  'w-wing': 'Izberi obe celici para in obe celici povezave (štiri celice).',
  'xy-wing': 'Izberi pivot in obe krili (tri celice).',
  'unique-rectangle': 'Izberi vse štiri vogale pravokotnika.',
  'xy-chain': 'Izberi vse celice verige.',
};
// Lasten opis vaje pri 7 · X-krilo in 8 · Mečarica (ex.desc iz trening/generators.js - s števko in smerjo vaje)
// ima od koraka 3 na koncu drugi del; preslika se nazaj samo pri teh dveh tehnikah (začetek je njun povzetek).
const DODATEK_78 = ', nato izbriši kandidate, ki zaradi vzorca odpadejo.';
const POVZETKI_78 = ['x-wing', 'swordfish'].map(m => OPISI[m].povzetek + ' ');

// Namerne razlike od izhodišča (popravka 5 in 6 po ročnem pregledu naloge 4a, docs/trening-ucenje-nacrt.md,
// razdelek 7): besedila W-krila s črkama x, y (prej a, b) in barva območja #1565C0 (prej #1D3F6B - oznake roba
// pri E1/E2). Pred primerjavo se v novem izrisu preslikajo nazaj, vse drugo se primerja kot prej; spremembi
// preverjata tests/trening-shema-vaja.test.js in obmocje() v preveri-vadi-brskalnik.js.
const ZNANE_RAZLIKE = [
  ['Dve celici z istim parom {x, y}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je y mogoč samo v dveh celicah – x izbrišeš iz celic, ki vidijo obe celici para.',
    'Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para.'],
  ['Poišči dve celici z natanko istima kandidatoma {x, y}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je y mogoč samo v dveh celicah, ki nista celici para.',
    'Poišči dve celici z natanko istima kandidatoma {a, b}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je b mogoč samo v dveh celicah, ki nista celici para.'],
  ['Celici para ne moreta biti obe y: obe celici povezave bi takrat videli y in v povezavi y ne bi bil mogoč nikjer. Torej je vsaj v eni celici para x. Iz vseh celic, ki vidijo obe celici para, x izbrišeš.',
    'Celici para ne moreta biti obe b: obe celici povezave bi takrat videli b in v povezavi b ne bi bil mogoč nikjer. Torej je vsaj v eni celici para a. Iz vseh celic, ki vidijo obe celici para, a izbrišeš.'],
  ['rgb(21, 101, 192)', 'rgb(29, 63, 107)'],
];
// Navodila vaj z 2. fazo (naloga 4b, docs/izbris-nacrt.md, O11 in D1): besedilo pod nalogo (.desc) je povzetek in
// navodilo; povzetek se ne spremeni, zato se preslika cela poved (navodilo 3 in 4 ter 5 in 6 je zdaj enako). Daljše
// navodilo se lahko prelomi v vrstico več, zato se preslika v strani, pred meritvijo (izraz NAVODILA_NAZAJ na
// začetku kode zajema izrisa) - tudi višine so potem kot v izhodišču; v izhodišču se nič ne spremeni.
const NAVODILA = Object.entries(NAVODILA_PRED_4B).map(([m, prej]) => [`${OPISI[m].povzetek} ${OPISI[m].navodilo}`, `${OPISI[m].povzetek} ${prej}`]);
const NAVODILA_NAZAJ = `document.querySelectorAll('#exerciseArea .exercise > .desc').forEach(p => { const m = ${JSON.stringify(NAVODILA)}.find(([n]) => n === p.textContent); if (m) p.textContent = m[1];
  else if (${JSON.stringify(POVZETKI_78)}.some(z => p.textContent.startsWith(z)) && p.textContent.endsWith(${JSON.stringify(DODATEK_78)})) p.textContent = p.textContent.slice(0, -${DODATEK_78.length}) + '.'; });`;
const nazaj = s => ZNANE_RAZLIKE.reduce((t, [n, st]) => t.split(n).join(st), s);

// znaneRazlike: false - izhodišče že ima popravka 5 in 6 (npr. 705349a v preveri-izbris-brskalnik.js), zato se
// ZNANE_RAZLIKE ne preslikajo (sicer bi preslikava sama naredila razliko).
function razlikeIzrisa(star, nov, lastnosti, { znaneRazlike = true } = {}) {
  if (znaneRazlike) nov = { html: nazaj(nov.html), slogi: nov.slogi.map(nazaj) };
  const razlike = [];
  if (star.html !== nov.html) razlike.push('innerHTML');
  if (star.slogi.length !== nov.slogi.length) {
    razlike.push(`število elementov ${star.slogi.length} → ${nov.slogi.length}`);
    return razlike;
  }
  const poLastnostih = new Map();
  star.slogi.forEach((s, i) => {
    if (s === nov.slogi[i]) return;
    const a = s.split('|'), b = nov.slogi[i].split('|');
    lastnosti.forEach((p, k) => {
      if (enako(a[k], b[k])) return;
      const r = poLastnostih.get(p) || { n: 0, primeri: new Set() };
      r.n++;
      if (r.primeri.size < 2) r.primeri.add(`${a[k]} → ${b[k]}`);
      poLastnostih.set(p, r);
    });
  });
  for (const [p, r] of poLastnostih) razlike.push(`${p} ${r.n}× (${[...r.primeri].join('; ')})`);
  return razlike;
}

// Po pravem kliku (npr. na kartico tehnike) miška obstane na istem mestu - po izrisu vaje je
// lahko nad celico s :hover in prehodom (transition), ki bi ga primerjava ujela na pol poti.
// Odmakne miško v kot okna in počaka, da se prehod konča.
async function odmakniMisko(b) {
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await b.izvedi('new Promise(r => setTimeout(r, 300))');
}

// Vaja 3 kroga »Spoznaj« (docs/trening-ucenje-nacrt.md, korak 2): vaji 1 in 2 sta od dela A po
// shemi in se od izhodišča namerno razlikujeta, zato primerjave z izhodiščem izrišejo vajo 3 (z istim
// generatorjem kot v izhodišču). Math.random s semenom (koda seme) se nastavi po vaji 2; pri 1 in 2
// je trojica nastavljena izrecno (nobena vsiljena) in banka brez uporabljenih, kot ob začetku kroga -
// vaji 1 in 2 tega stanja ne smeta spremeniti.
async function vaja3(b, seme) {
  await b.izvedi(`exNum = 2; presekTrojica.pointing = presekTrojica['box-line'] = -1;
    presekUporabljene.pointing.clear(); presekUporabljene['box-line'].clear(); ${seme}; renderExercise(); true`);
}

module.exports = { razlikeIzrisa, odmakniMisko, vaja3, NAVODILA_NAZAJ };
