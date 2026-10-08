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

function razlikeIzrisa(star, nov, lastnosti) {
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

module.exports = { razlikeIzrisa, odmakniMisko, vaja3 };
