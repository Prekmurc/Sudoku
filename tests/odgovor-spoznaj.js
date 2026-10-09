'use strict';
// Pomožne funkcije testov »Spoznaj« 1-13 (trening/trening.js): pravilen odgovor do konca vaje,
// kakor ga vaja zahteva (docs/izbris-nacrt.md, korak 1). Testi, ki v »Spoznaj« odgovorijo
// pravilno, gredo prek njih, zato naslednji koraki načrta (2. faza – izbris) spremenijo samo to
// datoteko, ne pričakovanj testov.
//
// Zdaj: 1. faza je izbira celic vzorca in »Preveri«; pri 4 · Skriti par in 6 · Skrita trojica
// sledi še izbira števk vzorca in »Preveri dve števki« / »Preveri tri števke«.
//
//   spremljajVajo(run)        – pred izrisom vaje: vajaNaZaslonu (v kontekstu) je vaja, ki jo je
//                               izrisal renderExercise() – iz genPoShemi() ali MODES[].gen;
//   izberiVzorec(run)         – selected = vzorec vaje na zaslonu (kot ga je sestavil generator);
//   dokoncajOdgovor(dom, run) – izbira je že nastavljena (s kliki ali s stanjem): »Preveri« in
//                               vse nadaljnje faze;
//   dokoncajDrugoFazo(dom, run) – po sprejeti 1. fazi: nadaljnje faze (pri vaji z eno fazo nič);
//   odgovoriPravilno(dom, run) – izberiVzorec() in dokoncajOdgovor().
//
// Funkcije ne preverjajo izida – to naredi test.

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
function gumb(dom, napis) {
  const g = vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
  if (!g) throw new Error(`gumb "${napis}"`);
  return g;
}

function spremljajVajo(run) {
  run(`var vajaNaZaslonu = null; {
    const gp = genPoShemi; genPoShemi = (m, n) => { const ex = gp(m, n); if (ex) vajaNaZaslonu = ex; return ex; };
    for (const k of Object.keys(MODES)) { const g = MODES[k].gen; if (g) MODES[k].gen = n => (vajaNaZaslonu = g(n)); } }`);
}

function izberiVzorec(run) {
  if (!run('vajaNaZaslonu')) throw new Error('spremljajVajo() pred izrisom vaje');
  run(`{ const ex = vajaNaZaslonu, M = MODES[mode];
    selected = M.isXWing || M.isSwordfish ? (ex.rect || ex.sfCells).map(([r, c]) => r * 9 + c)
      : M.isPointing || M.isBoxLine ? [...ex.solutionCells]
      : M.isXYWing || M.isUR || M.isTurbot || M.isWWing || M.isXYChain ? ex.solutionCells.map(c => ex.slots.findIndex(s => s.idx === c))
      : [...ex.targetSlots]; }`);
}

// 2. faza pri 4 in 6 (razdelek .phase2 je viden šele po sprejeti 1. fazi).
function dokoncajDrugoFazo(dom, run) {
  const faza2 = vsi(dom.el('exerciseArea')).find(e => e.className === 'phase2');
  if (!faza2 || faza2.style.display !== 'block') return;
  if (!run('vajaNaZaslonu')) throw new Error('spremljajVajo() pred izrisom vaje');
  const ds = run('[...vajaNaZaslonu.targetDigits]');
  for (const d of ds) vsi(faza2).find(e => e.tagName === 'BUTTON' && String(e.dataset.d) === String(d)).sprozi('click');
  gumb(dom, ds.length === 2 ? 'Preveri dve števki' : 'Preveri tri števke').sprozi('click');
}

function dokoncajOdgovor(dom, run) {
  gumb(dom, 'Preveri').sprozi('click');
  dokoncajDrugoFazo(dom, run);
}

function odgovoriPravilno(dom, run) {
  izberiVzorec(run);
  dokoncajOdgovor(dom, run);
}

module.exports = { spremljajVajo, izberiVzorec, dokoncajOdgovor, dokoncajDrugoFazo, odgovoriPravilno };
