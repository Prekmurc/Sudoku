'use strict';
// Pravilen odgovor v »Spoznaj« 1-13 do konca vaje s pravimi kliki v brskalniku brez glave
// (tools/brskalnik.js) – skupno scenarijem, ki v »Spoznaj« odgovorijo pravilno (docs/izbris-nacrt.md,
// korak 1). Naslednji koraki načrta (2. faza – izbris) spremenijo samo to datoteko. Ista pomožna
// funkcija teče tudi v izhodišču (primerjave z izhodiščem), zato faze prepozna iz strani, ne iz
// različice kode.
//
// 1. faza je izbira celic vzorca in »Preveri«; od koraka 2 sledi pri 3–6 (od koraka 3 tudi pri 7–13, od koraka 4 pri 1 in 2) 2. faza – izbris. V izhodiščih pred korakom 2 pri 4 · Skriti par in 6 · Skrita trojica sledi
// še izbira števk vzorca (razdelek .phase2) in »Preveri dve števki« / »Preveri tri števke«.
//
//   spremljajVajo(b)    – po b.odpri() strani treninga, pred izrisom vaje: window.vajaNaZaslonu je vaja,
//                         ki jo je izrisal renderExercise() (genPoShemi() – v starejših izhodiščih je ni –
//                         ali MODES[].gen); potrebna je samo za faze po 1. (števke vzorca pri 4 in 6);
//   dokoncajOdgovor(b)  – celice vzorca so že izbrane s pravimi kliki: pravi klik »Preveri« in nadaljnje
//                         faze s pravimi kliki. Po vsakem kliku se miška umakne v kot (:hover s prehodom
//                         ne vpliva na meritve in primerjave).
//
// Funkcije ne preverjajo izida – to naredi scenarij.

const { odmakniMisko } = require('./primerjava-slogov.js');

async function spremljajVajo(b) {
  await b.izvedi(`(() => { window.vajaNaZaslonu = null;
    if (typeof genPoShemi === 'function') { const gp = genPoShemi; genPoShemi = (m, n) => { const ex = gp(m, n); if (ex) window.vajaNaZaslonu = ex; return ex; }; }
    for (const k of Object.keys(MODES)) { const g = MODES[k].gen; if (g) MODES[k].gen = n => (window.vajaNaZaslonu = g(n)); }
    return true; })()`);
}

// Celica vaje: pri 3–6 in 9–13 .gc z indeksom v ex.slots, pri 7 in 8 (mreža ene števke) .xw-cell z indeksom 0–80,
// pri 1 in 2 (delna mreža iz shared/mreza.js, od koraka 4) .celica v .vaja-presek z indeksom 0–80.
const celicaVaje = c => `#exerciseArea :is(.gc[data-si="${c}"], .xw-cell[data-idx="${c}"], .vaja-presek .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"])`;

async function klikniGumb(b, napis) {
  const ima = await b.izvedi(`(() => { const g = [...document.querySelectorAll('#exerciseArea button')].find(x => x.textContent === ${JSON.stringify(napis)});
    if (g) g.setAttribute('data-odgovor', '1'); return !!g; })()`);
  if (!ima) throw new Error(`gumb "${napis}"`);
  await b.klikni('#exerciseArea button[data-odgovor="1"]');
  await b.izvedi(`document.querySelectorAll('[data-odgovor]').forEach(e => e.removeAttribute('data-odgovor')); true`);
  await odmakniMisko(b);
}

// 2. faza: izbris (niz .izbris-faza, od koraka 2 pri 3–6, od koraka 3 pri 7–13) – po števkah Escape, pravi kliki celic izbrisa
// sprejetega vzorca (izbrisVaje.izbris) in pravi klik gumba števke, nato »Preveri«; vrne oznake kot
// ["celica:d", ...]. V kodi pred korakom 2 pri 4 in 6 izbira števk (razdelek .phase2 je viden šele po
// sprejeti 1. fazi) – vrne števke. Brez 2. faze null.
async function dokoncajDrugoFazo(b) {
  const pari = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .izbris-faza');
    return f && !f.hidden && typeof izbrisVaje !== 'undefined' && izbrisVaje ? izbrisVaje.izbris : null; })()`);
  if (pari) {
    // Po parih (celica, nato gumb števke) - deluje z vklopljeno in izklopljeno kljukico »več celic«.
    for (const [c, d] of pari) {
      await b.tipka('Escape', { code: 'Escape' });
      await b.klikni(celicaVaje(c));
      await b.klikni(`#exerciseArea .izbris-faza button[data-d="${d}"]`);
      await odmakniMisko(b);
    }
    await b.tipka('Escape', { code: 'Escape' });
    await klikniGumb(b, 'Preveri');
    return pari.map(([si, d]) => `${si}:${d}`);
  }
  const ds = await b.izvedi(`(() => { const f = document.querySelector('#exerciseArea .phase2');
    if (!f || getComputedStyle(f).display === 'none') return null;
    if (!window.vajaNaZaslonu) return 'brez';
    return [...window.vajaNaZaslonu.targetDigits]; })()`);
  if (ds === null) return null;
  if (ds === 'brez') throw new Error('spremljajVajo() pred izrisom vaje');
  for (const d of ds) {
    await b.klikni(`#exerciseArea .phase2 .digit-btns button[data-d="${d}"]`);
    await odmakniMisko(b);
  }
  await klikniGumb(b, ds.length === 2 ? 'Preveri dve števki' : 'Preveri tri števke');
  return ds;
}

// Vrne podatke 2. faze (zdaj števke pri 4 in 6) ali null.
async function dokoncajOdgovor(b) {
  await klikniGumb(b, 'Preveri');
  return dokoncajDrugoFazo(b);
}

module.exports = { spremljajVajo, dokoncajOdgovor, dokoncajDrugoFazo };
