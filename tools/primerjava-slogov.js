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

module.exports = { razlikeIzrisa };
