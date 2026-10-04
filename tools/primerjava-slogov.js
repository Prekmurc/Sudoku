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

// Izris območja vaje za primerjavo z izhodiščem (koda za stran - vstavi se v b.izvedi()): klon
// brez elementov, ki jih je faza 6 (korak b, docs/faza6-besedila.md) spremenila namenoma - naslov
// (h3) in opis naloge (.desc), razdelek »Razlaga«, legenda -, in z izpraznjenim besedilom sporočil
// (.fb, .peek-overlay: sporočila korakov imajo zdaj »izbrišeš«, pare {x, y}). Vrne { html,
// elementi, slogi }: elementi so živi elementi zunaj izpuščenih, slogi njihove izračunane vrednosti
// lastnosti (niz "vrednost|vrednost|...") - elementu, ki vsebuje izpuščen element (kartica vaje),
// višina ne šteje, ker je opis pod nalogo druge dolžine. Izhodišče teh elementov nima ali ima drugo
// besedilo, zato bi primerjava sicer javila namerne spremembe.
const PRIMERJALNI_IZRIS = `((a, lastnosti) => {
  const izpusti = '.desc, h3, details.razlaga-tehnike, .legenda-vaje', brez = '.fb, .peek-overlay';
  const k = a.cloneNode(true);
  k.querySelectorAll(izpusti).forEach(e => e.remove());
  k.querySelectorAll(brez).forEach(e => { e.textContent = ''; });
  const elementi = [...a.querySelectorAll('*')].filter(e => !e.closest(izpusti) && !(e.parentElement && e.parentElement.closest(brez)));
  const slogi = elementi.map(e => { const s = getComputedStyle(e), vsebnik = !!e.querySelector(izpusti);
    return (lastnosti || []).map(p => (vsebnik && p === 'height' ? '' : s.getPropertyValue(p))).join('|'); });
  return { html: k.innerHTML, elementi, slogi };
})`;

module.exports = { razlikeIzrisa, odmakniMisko, PRIMERJALNI_IZRIS };
