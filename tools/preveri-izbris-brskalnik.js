'use strict';
// »Spoznaj«: druga faza – izbris (docs/izbris-nacrt.md) v pravem brskalniku; raste po korakih načrta.
// Korak 4 – isto še pri 1 · Izločitev izven bloka in 2 · Izločitev v bloku (delna mreža iz shared/mreza.js – celice
// .vaja-presek .celica): po 1. fazi vzorec jantaren, brez poudarka in rožnatih celic; oznaka ima slog .kand.k-izbris,
// celica ostane bela; izbrana celica vzorca jantarna z modrim okvirjem; končno stanje enako izhodišču. 1: »Rešitev« v
// 2. fazi (napačna oznaka k-napacna z obročem, rožnate celice izbrisa, legenda). Popravek okvirja: izbrana zelena celica
// vzorca ima okvir 2,5 px (pri 7 in 8 2 px) in pri 375 px ne prekriva malih števk bolj kot zelen okvir brez izbire
// (meritev s štirimi posnetki celice pri 4, 6 in 12 – izpiše tudi prejšnji okvir 3 px). Posnetek D6a: 1-oznake-375.png
// (12-oznake-375.png se posname znova).
// Korak 3 – isto še pri 7 · X-krilo, 8 · Mečarica (mreža ene števke – oznaka prečrta števko celice, celica ostane
// bela), 10 · W-krilo, 12 · Edinstveni pravokotnik in 13 · XY-veriga (mreža 9 × 9; pri 375 px celica vsaj 24 px, pri
// 13 številke verige že po 1. fazi): 1. faza, oznake, izbrana zelena celica vzorca (7, 8, 12), končno stanje enako
// izhodišču (izvzeta še navodila 9–13 in opisa vaj 7, 8 – NAVODILA_NAZAJ); 8 · Mečarica: »Rešitev« v 2. fazi z
// napačno oznako (obroč okoli števke celice); posnetka D5: 8-oznake-375.png in 12-oznake-375.png.
// Korak 2 – 3 · Očitni par, 4 · Skriti par, 5 · Očitna trojica, 6 · Skrita trojica pri 375 px (posnemanje
// telefona, pravi dotik – tapni()) in 1280 px (prava miška), vaja 3 kroga z Math.random s semenom:
//   - 1. faza s pravimi dotiki/kliki celic in »Preveri« → »Vzorec je pravilen.«, niz »Izbriši kandidata« z
//     devetimi gumbi v kartici vaje (gumbi vsaj 24 × 24 px), brez vodoravnega preliva;
//   - oznaka s pravim dotikom/klikom celice in gumba števke ter s Shift+števka (par key/code QWERTZ): izračunan
//     slog male števke je enak izbrisani števki (.cd.elim – rdeča, prečrtana, krepka); drugi Shift+števka jo
//     odstrani (↺); pri 4 in 6 je izbrana zelena celica vzorca vidno izbrana (moder okvir, zelena podlaga);
//   - pravilna 2. faza (pravi kliki prek tools/odgovor-spoznaj-brskalnik.js) → niza ni več v DOM-u; končno stanje
//     (innerHTML območja vaje in izračunani slogi) je enako izhodišču po pravilnem odgovoru (--izhodisce, privzeto
//     705349a – zaključek naloge 4a). Izvzeto izrecno (D1): navodila 3–6 (NAVODILA_NAZAJ v primerjava-slogov.js – preslikava v strani pred meritvijo) in
//     razdelek .phase2 izhodišča (izbira števk pri 4 in 6, O5); kot v drugih primerjavah skriti »Shema«, ime tehnike
//     in vrstica »Namig«/»Rešitev«;
//   - 5 · Očitna trojica: »Rešitev« v 2. fazi z eno pravilno in eno napačno oznako – kandidati za izbris rdeče
//     prečrtani, napačna oznaka brez črte s temno rdečim obročem (izračunan slog), legenda;
//   - brez napak JS.
// Posnetka za pregled (D2, 375 px, dvojna ločljivost) v docs/slike/izbris/: 3-oznake-375.png (3 · Očitni par z
// oznakami pred »Preveri«) in 5-resitev-375.png (5 · Očitna trojica, »Rešitev« z eno pravilno in eno napačno oznako).
//
//   node tools/preveri-izbris-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome), pribl. 5 min.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa, odmakniMisko, vaja3, NAVODILA_NAZAJ } = require('./primerjava-slogov.js');
const { spremljajVajo, dokoncajOdgovor, dokoncajDrugoFazo } = require('./odgovor-spoznaj-brskalnik.js');

const KOREN = path.join(__dirname, '..');
const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-izbris'));
const izhodisce = arg('--izhodisce', '705349a');
const SLIKE = path.join(KOREN, 'docs', 'slike', 'izbris');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const SEME = s => `(() => { let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return true; })()`;
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);
const TEHNIKE = ['pointing', 'box-line', 'naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish', 'w-wing', 'unique-rectangle', 'xy-chain'];
const ENA = m => m === 'x-wing' || m === 'swordfish';
const PRESEK = m => m === 'pointing' || m === 'box-line';
// Celica vaje: pri 3–6 in 9–13 .gc z indeksom v ex.slots, pri 7 in 8 (mreža ene števke) .xw-cell z indeksom 0–80.
// Pri 1 in 2 (delna mreža iz shared/mreza.js, korak 4) .celica v .vaja-presek z indeksom 0–80.
const celicaVaje = c => `#exerciseArea :is(.gc[data-si="${c}"], .xw-cell[data-idx="${c}"], .vaja-presek .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"])`;
const MREZA = '#exerciseArea :is(.vaja-presek, .layout-row, .layout-col, .layout-block, .xw-grid, .g9)';
const SIRINE = [375, 1280];
const SHIFT = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
const SLOGI = ['background-color', 'box-shadow', 'color', 'border-top-color', 'border-top-width', 'text-decoration-line', 'font-weight', 'visibility', 'display', 'width', 'height'];
const MODRA = 'rgb(74, 134, 216)', ZELENA_BG = 'rgb(220, 238, 229)', RDECA_OKVIR = 'rgb(142, 27, 27)', JANTARNA_BG = 'rgb(239, 216, 160)';

async function odpri(b, mode, sirina, seme = 4242) {
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500, skala: sirina < 500 ? 2 : 1 });
  await b.izvedi(SEME(seme));
  await spremljajVajo(b);
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await vaja3(b, SEME(seme));
  await odmakniMisko(b);
  await b.cakaj('document.fonts.status === "loaded"', 15000);
}
const dotakni = (b, sirina, sel) => (sirina < 500 ? b.tapni(sel) : b.klikni(sel));
async function klikniGumb(b, sirina, napis) {
  await b.izvedi(`[...document.querySelectorAll('#exerciseArea button')].find(x => x.textContent === ${JSON.stringify(napis)}).setAttribute('data-klik', '1'); true`);
  await dotakni(b, sirina, '#exerciseArea button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
  await odmakniMisko(b);
}
// 1. faza: celice vzorca vaje (generator) s pravimi dotiki/kliki.
async function prvaFaza(b, sirina) {
  const cells = await b.izvedi(`(() => { const ex = vajaNaZaslonu, M = MODES[mode];
    return M.isXWing || M.isSwordfish ? (ex.rect || ex.sfCells).map(([r, c]) => r * 9 + c)
      : M.isPointing || M.isBoxLine ? [...ex.solutionCells]
      : ex.solutionCells ? ex.solutionCells.map(c => ex.slots.findIndex(s => s.idx === c)) : [...ex.targetSlots]; })()`);
  for (const c of cells) await dotakni(b, sirina, celicaVaje(c));
  await odmakniMisko(b);
  return cells;
}
// Izris območja vaje za primerjavo z izhodiščem (kot preveri-presek-brskalnik.js).
async function izris(b) {
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    ${NAVODILA_NAZAJ}
    const a = document.getElementById('exerciseArea'), k = a.cloneNode(true);
    k.querySelectorAll('.shema-razdelek, .peek-row, .phase2').forEach(e => e.remove());
    const sk = [...a.querySelectorAll('.shema-razdelek, .ex-label, .peek-row, .phase2')]; sk.forEach(e => { e.style.display = 'none'; });
    const slogi = [...a.querySelectorAll('*')].filter(e => !e.closest('.shema-razdelek, .ex-label, .peek-row, .phase2')).map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    sk.forEach(e => { e.style.display = ''; });
    return { html: k.innerHTML, slogi };
  })()`);
}
// Slog male števke (c, d) in referenčne izbrisane števke (.cd.elim v isti postavitvi); pri 7 in 8 (mreža ene števke)
// števke celice in referenčne celice izbrisa po pravilnem odgovoru (.xw-cell.xw-elim).
const slogStevke = (b, c, d) => b.izvedi(`(() => {
  const celica = document.querySelector(${JSON.stringify(celicaVaje(c))});
  const xw = celica.classList.contains('xw-cell'), pr = celica.classList.contains('celica');
  const cd = xw ? celica : pr ? celica.querySelector('.kandidati').children[${d} - 1] : celica.querySelector('.cd[data-d="${d}"]'), s = getComputedStyle(cd);
  const ref = cd.cloneNode(true); ref.className = xw ? 'xw-cell has-digit xw-elim' : pr ? 'kand k-izbris' : 'cd elim'; cd.parentNode.appendChild(ref); const r = getComputedStyle(ref);
  const out = { oznacena: cd.classList.contains(pr ? 'k-izbris' : 'oznaka'), barva: s.color, crta: s.textDecorationLine, debelina: s.fontWeight, obroc: s.boxShadow, slika: s.backgroundImage, razredi: cd.className,
    ref: { barva: r.color, crta: r.textDecorationLine, debelina: r.fontWeight } };
  ref.remove(); return out; })()`);
const STRAN = `(() => { const e = document.querySelector('#exerciseArea .exercise').getBoundingClientRect();
  const n = document.querySelector('#exerciseArea .izbris-faza');
  const g = n ? [...n.querySelectorAll('button')].map(x => x.getBoundingClientRect()) : [];
  const cel = [...document.querySelectorAll('#exerciseArea :is(.gc[data-si], .xw-cell.has-digit, .vaja-presek .celica:not(.izven))')].map(x => x.getBoundingClientRect());
  return { preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth, niz: !!n,
    celica: cel.length ? Math.min(...cel.map(r => Math.min(r.width, r.height))) : 0,
    gumbov: g.length, vKartici: g.every(r => r.left >= e.left && r.right <= e.right),
    min: g.length ? Math.min(...g.map(r => Math.min(r.width, r.height))) : 0,
    fb: (document.querySelector('#exerciseArea .fb') || {}).textContent || '' }; })()`;

async function vajaNova(b, mode, sirina) {
  await odpri(b, mode, sirina);
  await prvaFaza(b, sirina);
  await klikniGumb(b, sirina, 'Preveri');
  let s = await b.izvedi(STRAN);
  preveri(`${mode}, ${sirina} px: po 1. fazi »Vzorec je pravilen« in niz z 9 gumbi v kartici`, s.fb.startsWith('Vzorec je pravilen') && !s.fb.includes('izbrišeš') && s.niz && s.gumbov === 9 && s.vKartici, s);
  if (mode === 'xy-chain') {
    const st = await b.izvedi(`[[...document.querySelectorAll('#exerciseArea .cd.veriga-st')].map(e => e.textContent).sort().join(), vajaNaZaslonu.solutionCells.length]`);
    preveri(`${mode}, ${sirina} px: po 1. fazi zaporedne številke verige (${st[0]})`, st[0] === Array.from({ length: st[1] }, (_, j) => j + 1).join(), st);
  }
  if (PRESEK(mode)) {
    const p = await b.izvedi(`(() => { const c = [...document.querySelectorAll('#exerciseArea .vaja-presek .celica')];
      return { vzorec: c.map((e, i) => e.classList.contains('k-vzorec') ? i : -1).filter(i => i >= 0).join(), cilj: [...vajaNaZaslonu.solutionCells].sort((a, b) => a - b).join(),
        poud: document.querySelectorAll('#exerciseArea .vaja-presek .kand.poud').length, roza: document.querySelectorAll('#exerciseArea .vaja-presek .celica.k-izbris').length }; })()`);
    preveri(`${mode}, ${sirina} px: po 1. fazi vzorec jantaren, brez poudarka, brez rožnatih celic`, p.vzorec === p.cilj && !p.poud && !p.roza, p);
  }
  preveri(`${mode}, ${sirina} px: gumbi niza vsaj 24 px (najmanjši ${s.min.toFixed(1)} px), celice vsaj 24 px (${s.celica.toFixed(1)} px), brez preliva`, s.min >= 24 && s.celica >= 24 && !s.preliv, s);
  const izbris = await b.izvedi('izbrisVaje.izbris');
  const [si, d] = izbris[0];
  // Oznaka s pravim dotikom/klikom celice in gumba števke.
  await dotakni(b, sirina, celicaVaje(si));
  await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  await odmakniMisko(b);
  let st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: oznaka (gumb) ima slog izbrisane števke (${st.barva}, ${st.crta}, ${st.debelina})`,
    st.oznacena && st.barva === st.ref.barva && st.crta === st.ref.crta && st.debelina === st.ref.debelina && st.crta.includes('line-through'), st);
  if (PRESEK(mode)) {
    const roza = await b.izvedi(`document.querySelector(${JSON.stringify(celicaVaje(si))}).classList.contains('k-izbris')`);
    preveri(`${mode}, ${sirina} px: označena celica ostane bela (rožnata šele po pravilnem odgovoru)`, !roza, roza);
  }
  if (ENA(mode)) {
    const bg = await b.izvedi(`getComputedStyle(document.querySelector(${JSON.stringify(celicaVaje(si))})).backgroundColor`);
    preveri(`${mode}, ${sirina} px: označena celica ni rožnata (rožnata šele po pravilnem odgovoru)`, bg !== 'rgb(240, 180, 170)', bg);
  }
  // ↺ z gumbom, nato Shift+števka (QWERTZ) označi in drugi Shift+števka odstrani.
  await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: ↺ odstrani oznako`, !st.oznacena && st.crta === 'none', st);
  await b.tipka(SHIFT[d], { code: `Digit${d}`, shift: true });
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: Shift+${d} (key »${SHIFT[d]}«, code Digit${d}) označi`, st.oznacena && st.crta.includes('line-through'), st);
  await b.tipka(SHIFT[d], { code: `Digit${d}`, shift: true });
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: drugi Shift+${d} oznako odstrani`, !st.oznacena, st);
  await b.tipka('Escape', { code: 'Escape' });
  // Izbrana zelena celica vzorca (pri 4, 6 in 12 je izbris v njej; pri 7 in 8 celica xw-cell).
  if (mode.startsWith('hidden') || mode === 'unique-rectangle' || ENA(mode)) {
    const vz = await b.izvedi('izbrisVaje.vzorec[0]');
    await dotakni(b, sirina, celicaVaje(vz));
    await odmakniMisko(b);
    await pocakaj(b);
    const c = await b.izvedi(`(() => { const s = getComputedStyle(document.querySelector(${JSON.stringify(celicaVaje(vz))})); return { bg: s.backgroundColor, bs: s.boxShadow }; })()`);
    // Okvir kot navadna izbira: 2,5 px (.gc), pri 7 in 8 2 px (.xw-cell) – popravek v koraku 4 (prej 3 px).
    preveri(`${mode}, ${sirina} px: izbrana zelena celica vzorca – zelena podlaga, moder okvir ${ENA(mode) ? 2 : 2.5} px`, c.bg === ZELENA_BG && c.bs.startsWith(MODRA) && c.bs.endsWith(`${ENA(mode) ? 2 : 2.5}px inset`), c);
    await b.tipka('Escape', { code: 'Escape' });
  }
  // Delna mreža (1, 2): celica vzorca se izbere – jantarna z modrim okvirjem izbire iz shared/mreza.css.
  if (PRESEK(mode)) {
    const vz = await b.izvedi('izbrisVaje.vzorec[0]');
    await dotakni(b, sirina, celicaVaje(vz));
    await odmakniMisko(b);
    await pocakaj(b);
    const c = await b.izvedi(`(() => { const e = document.querySelector(${JSON.stringify(celicaVaje(vz))}), s = getComputedStyle(e); return { izbrana: e.classList.contains('izbrana'), bg: s.backgroundColor, bs: s.boxShadow }; })()`);
    preveri(`${mode}, ${sirina} px: izbrana celica vzorca – jantarna podlaga, moder okvir`, c.izbrana && c.bg === JANTARNA_BG && c.bs.startsWith(MODRA), c);
    await b.tipka('Escape', { code: 'Escape' });
  }
  const oznake = await dokoncajDrugoFazo(b);
  s = await b.izvedi(STRAN);
  preveri(`${mode}, ${sirina} px: pravilna 2. faza (${oznake.length} oznak) → »Pravilno!«, niza ni več`, s.fb.startsWith('Pravilno!') && !s.niz, s);
  return izris(b);
}
async function vajaStara(b, mode, sirina) {
  await odpri(b, mode, sirina);
  await prvaFaza(b, sirina);
  await dokoncajOdgovor(b);
  return izris(b);
}

// 5 · Očitna trojica: »Rešitev« v 2. fazi z eno pravilno in eno napačno oznako (in posnetek D2b).
async function resitevOznake(b, sirina) {
  await odpri(b, 'naked-triple', sirina);
  await prvaFaza(b, sirina);
  await klikniGumb(b, sirina, 'Preveri');
  const { izbris, napacna } = await b.izvedi(`(() => { const iz = izbrisVaje.izbris, k = new Set(iz.map(([c, d]) => c * 10 + d)), vz = new Set(izbrisVaje.vzorec);
    const ex = vajaNaZaslonu; let nap = null;
    ex.slots.forEach((s, si) => { if (!nap && s.c && !vz.has(si)) { const d = s.c.find(x => !k.has(si * 10 + x)); if (d) nap = [si, d]; } });
    return { izbris: iz, napacna: nap }; })()`);
  preveri(`5, ${sirina} px: vaja ima kandidat zunaj izbrisa`, !!napacna);
  for (const [si, d] of [izbris[0], napacna]) {
    await b.tipka('Escape', { code: 'Escape' });
    await dotakni(b, sirina, `#exerciseArea .gc[data-si="${si}"]`);
    await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  }
  await b.tipka('Escape', { code: 'Escape' });
  await odmakniMisko(b);
  await klikniGumb(b, sirina, 'Rešitev');
  await pocakaj(b);
  const prav = await slogStevke(b, ...izbris[0]), nap = await slogStevke(b, ...napacna);
  const drugi = izbris.length > 1 ? await slogStevke(b, ...izbris[1]) : prav;
  preveri(`5, ${sirina} px: ob »Rešitvi« pravilna oznaka in neoznačen kandidat za izbris rdeče prečrtana`,
    [prav, drugi].every(x => x.crta.includes('line-through') && x.barva === x.ref.barva), [prav, drugi]);
  preveri(`5, ${sirina} px: napačna oznaka brez črte, s temno rdečim obročem (${nap.obroc})`,
    nap.crta === 'none' && nap.obroc.startsWith(RDECA_OKVIR) && nap.razredi.includes('peek-napacna'), nap);
  const leg = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .peek-overlay.visible .legenda-vaje > span')].map(s => s.textContent.replace(/^\\d/, ''))`);
  preveri(`5, ${sirina} px: legenda (tvoj vzorec, celica izbrisa, kandidat za izbris, napačno označen kandidat)`,
    JSON.stringify(leg) === JSON.stringify(['tvoj vzorec', 'celica izbrisa', 'kandidat za izbris', 'napačno označen kandidat']), leg);
  const s = await b.izvedi(STRAN);
  preveri(`5, ${sirina} px: brez preliva`, !s.preliv, s);
  if (sirina < 500) {
    await b.izvedi(`document.querySelector('#exerciseArea .layout-row, #exerciseArea .layout-col, #exerciseArea .layout-block').scrollIntoView({ block: 'start' }); true`);
    await b.posnetek(path.join(SLIKE, '5-resitev-375.png'));
  }
}

// 3 · Očitni par: oznake pred »Preveri« (posnetek D2a).
async function oznakePredPreveri(b) {
  await odpri(b, 'naked-pair', 375);
  await prvaFaza(b, 375);
  await klikniGumb(b, 375, 'Preveri');
  const izbris = await b.izvedi('izbrisVaje.izbris');
  for (const d of [...new Set(izbris.map(([, x]) => x))]) {
    await b.tipka('Escape', { code: 'Escape' });
    for (const [si] of izbris.filter(([, x]) => x === d)) await b.tapni(`#exerciseArea .gc[data-si="${si}"]`);
    await b.tapni(`#exerciseArea .izbris-faza button[data-d="${d}"]`);
  }
  // Zadnja izbira ostane (izbira je po oznaki vidna) - na posnetku se vidi tudi ↺ na gumbu.
  await odmakniMisko(b);
  const n = await b.izvedi(`document.querySelectorAll('#exerciseArea .cd.oznaka').length`);
  preveri(`3, 375 px: označenih ${n} od ${izbris.length} kandidatov`, n === izbris.length, n);
  await b.posnetek(path.join(SLIKE, '3-oznake-375.png'));
}

// Korak 3: oznake s pravimi dotiki (po števkah Escape, celice, gumb števke); zadnja izbira ostane.
async function oznaciDotiki(b, sirina, pari) {
  for (const d of [...new Set(pari.map(([, x]) => x))]) {
    await b.tipka('Escape', { code: 'Escape' });
    for (const [c] of pari.filter(([, x]) => x === d)) await dotakni(b, sirina, celicaVaje(c));
    await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  }
  await odmakniMisko(b);
}

// 8 · Mečarica: »Rešitev« v 2. fazi z eno pravilno in eno napačno oznako – števka celice izbrisa rdeče prečrtana,
// napačna oznaka (celica vzorca) brez črte s temno rdečim obročem okoli števke, legenda.
async function resitevMecarica(b, sirina) {
  await odpri(b, 'swordfish', sirina);
  await prvaFaza(b, sirina);
  await klikniGumb(b, sirina, 'Preveri');
  const { izbris, napacna } = await b.izvedi('({ izbris: izbrisVaje.izbris, napacna: [izbrisVaje.vzorec[0], vajaNaZaslonu.digit] })');
  await oznaciDotiki(b, sirina, [izbris[0]]);
  await oznaciDotiki(b, sirina, [napacna]);
  await b.tipka('Escape', { code: 'Escape' });
  await klikniGumb(b, sirina, 'Rešitev');
  await pocakaj(b);
  const prav = await slogStevke(b, ...izbris[0]), nap = await slogStevke(b, ...napacna);
  const drugi = izbris.length > 1 ? await slogStevke(b, ...izbris[1]) : prav;
  preveri(`8, ${sirina} px: ob »Rešitvi« pravilna oznaka in neoznačena celica izbrisa rdeče prečrtani`,
    [prav, drugi].every(x => x.crta.includes('line-through') && x.barva === x.ref.barva), [prav, drugi]);
  preveri(`8, ${sirina} px: napačna oznaka brez črte, s temno rdečim obročem okoli števke`,
    nap.crta === 'none' && nap.razredi.includes('peek-napacna') && /radial-gradient/.test(nap.slika) && nap.slika.includes(RDECA_OKVIR), nap);
  const leg = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .peek-overlay.visible .legenda-vaje > span')].map(s => s.textContent.replace(/^\\d/, ''))`);
  preveri(`8, ${sirina} px: legenda (tvoj vzorec, celica izbrisa, kandidat za izbris, napačno označen kandidat)`,
    JSON.stringify(leg) === JSON.stringify(['tvoj vzorec', 'celica izbrisa', 'kandidat za izbris', 'napačno označen kandidat']), leg);
  const s = await b.izvedi(STRAN);
  preveri(`8, ${sirina} px: brez preliva`, !s.preliv, s);
}

// Posnetka D5 (375 px, dvojna ločljivost): a) 8 · Mečarica z oznakami pred »Preveri«, b) 12 · Edinstveni
// pravokotnik z obema oznakama v četrtem vogalu pred »Preveri«.
async function posnetkaD5(b) {
  await odpri(b, 'swordfish', 375);
  await prvaFaza(b, 375);
  await klikniGumb(b, 375, 'Preveri');
  let izbris = await b.izvedi('izbrisVaje.izbris');
  await oznaciDotiki(b, 375, izbris);
  let n = await b.izvedi(`document.querySelectorAll('#exerciseArea .xw-cell.oznaka').length`);
  preveri(`8, 375 px: označenih ${n} od ${izbris.length} celic`, n === izbris.length, n);
  await b.izvedi(`document.querySelector(${JSON.stringify(MREZA)}).scrollIntoView({ block: 'start' }); true`);
  await b.posnetek(path.join(SLIKE, '8-oznake-375.png'));

  await odpri(b, 'unique-rectangle', 375);
  await prvaFaza(b, 375);
  await klikniGumb(b, 375, 'Preveri');
  izbris = await b.izvedi('izbrisVaje.izbris');
  const vogal = izbris[0][0];
  preveri('12, 375 px: obe števki iz četrtega vogala (celica vzorca)', izbris.length === 2 && izbris[1][0] === vogal
    && await b.izvedi(`izbrisVaje.vzorec.includes(${vogal})`), izbris);
  await b.tipka('Escape', { code: 'Escape' });
  await b.tapni(celicaVaje(vogal));
  for (const [, d] of izbris) await b.tapni(`#exerciseArea .izbris-faza button[data-d="${d}"]`);
  await odmakniMisko(b);
  const st = await Promise.all(izbris.map(p => slogStevke(b, ...p)));
  preveri('12, 375 px: obe oznaki v četrtem vogalu rdeče prečrtani', st.every(x => x.oznacena && x.crta.includes('line-through') && x.barva === x.ref.barva), st);
  await b.izvedi(`document.querySelector(${JSON.stringify(MREZA)}).scrollIntoView({ block: 'start' }); true`);
  await b.posnetek(path.join(SLIKE, '12-oznake-375.png'));
}

// Korak 4 – 1 · Izločitev izven bloka: »Rešitev« v 2. fazi na delni mreži z eno pravilno in eno napačno oznako (napačna:
// števka vaje v celici vzorca) – izbris rdeče prečrtan, napačna oznaka brez črte s temno rdečim obročem, celice izbrisa
// rožnate, legenda.
async function resitevPresek(b, sirina) {
  await odpri(b, 'pointing', sirina);
  await prvaFaza(b, sirina);
  await klikniGumb(b, sirina, 'Preveri');
  const { izbris, napacna } = await b.izvedi('({ izbris: izbrisVaje.izbris, napacna: [izbrisVaje.vzorec[0], vajaNaZaslonu.digit] })');
  await oznaciDotiki(b, sirina, [izbris[0]]);
  await oznaciDotiki(b, sirina, [napacna]);
  await b.tipka('Escape', { code: 'Escape' });
  await klikniGumb(b, sirina, 'Rešitev');
  await pocakaj(b);
  const prav = await Promise.all(izbris.map(x => slogStevke(b, ...x))), nap = await slogStevke(b, ...napacna);
  preveri(`1, ${sirina} px: ob »Rešitvi« vsi kandidati za izbris (${izbris.length}) rdeče prečrtani`,
    prav.every(x => x.crta.includes('line-through') && x.barva === x.ref.barva), prav);
  preveri(`1, ${sirina} px: napačna oznaka brez črte, s temno rdečim obročem (${nap.obroc})`,
    nap.crta === 'none' && nap.obroc.startsWith(RDECA_OKVIR) && nap.razredi.includes('k-napacna'), nap);
  const roza = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .vaja-presek .celica')].map((e, i) => e.classList.contains('k-izbris') ? i : -1).filter(i => i >= 0).join()`);
  preveri(`1, ${sirina} px: celice izbrisa rožnate`, roza === [...new Set(izbris.map(([c]) => c))].sort((x, y) => x - y).join(), roza);
  const leg = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .peek-overlay.visible .legenda-vaje > span')].map(s => s.textContent.replace(/^\\d/, ''))`);
  preveri(`1, ${sirina} px: legenda (celice vzorca, celica izbrisa, kandidat za izbris, napačno označen kandidat)`,
    JSON.stringify(leg) === JSON.stringify(['celice vzorca', 'celica izbrisa', 'kandidat za izbris', 'napačno označen kandidat']), leg);
  const st = await b.izvedi(STRAN);
  preveri(`1, ${sirina} px: brez preliva`, !st.preliv, st);
}

// Posnetek D6a (375 px, dvojna ločljivost): 1 · Izločitev izven bloka z oznakami pred »Preveri«; zadnja izbira ostane.
async function posnetekD6a(b) {
  await odpri(b, 'pointing', 375);
  await prvaFaza(b, 375);
  await klikniGumb(b, 375, 'Preveri');
  const izbris = await b.izvedi('izbrisVaje.izbris');
  await oznaciDotiki(b, 375, izbris);
  const n = await b.izvedi(`document.querySelectorAll('#exerciseArea .vaja-presek .kand.k-izbris').length`);
  preveri(`1, 375 px: označenih ${n} od ${izbris.length} kandidatov`, n === izbris.length, n);
  await b.posnetek(path.join(SLIKE, '1-oznake-375.png'));
}

// Popravek okvirja (korak 4): prekrivanje modrega okvirja izbrane zelene celice vzorca z malimi števkami pri 375 px –
// kot pri nalogi »izbira« (tools/preveri-izbira-brskalnik.js): štirje posnetki celice (končni, brez okvirja, brez okvirja
// in števk, brez števk); stik = pikslov, ki ju spremenita oba, zakritih = pikslov števke, ki se na okvirju ne vidijo.
// Primerja se ista celica: zelena brez izbire (2,5 px zeleno), izbrana (2,5 px modro) in izbrana s prejšnjimi 3 px.
// Drugi izbirnik ima specifičnost STARI_OKVIR (za njim), da skrije tudi prejšnji okvir.
const OKVIR_SKRIT = '#exerciseArea .gc, #exerciseArea .gc.correct.izbrana-izbris { box-shadow: none !important; }';
const STEVKE_SKRITE = '#exerciseArea .cd { color: transparent !important; }';
const STARI_OKVIR = '#exerciseArea .gc.correct.izbrana-izbris { box-shadow: inset 0 0 0 3px var(--izbira) !important; }';
async function prekrivanjeCelice(b, sel, dodatno = '') {
  const pos = async slog => {
    await b.izvedi(`(() => { let s = document.getElementById('meritev'); if (!s) { s = document.createElement('style'); s.id = 'meritev'; document.head.appendChild(s); }
      s.textContent = ${JSON.stringify(dodatno)} + ${JSON.stringify(slog)}; return new Promise(r => setTimeout(() => r(true), 300)); })()`);
    const r = await b.izvedi(`(() => { const q = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
      return { x: Math.floor(q.left + scrollX), y: Math.floor(q.top + scrollY), w: Math.ceil(q.width), h: Math.ceil(q.height) }; })()`);
    return (await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })).data;
  };
  const F = await pos(''), A = await pos(OKVIR_SKRIT), B = await pos(OKVIR_SKRIT + STEVKE_SKRITE), C = await pos(STEVKE_SKRITE);
  await b.izvedi(`document.getElementById('meritev').textContent = ''; new Promise(r => setTimeout(() => r(true), 300))`);
  return b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [f, a, bb, c] = await Promise.all([${[F, A, B, C].map(x => JSON.stringify(x)).join(', ')}].map(slika));
    const raz = (p, q, k) => Math.max(Math.abs(p.data[k] - q.data[k]), Math.abs(p.data[k + 1] - q.data[k + 1]), Math.abs(p.data[k + 2] - q.data[k + 2]));
    let stik = 0, zakritih = 0;
    for (let k = 0; k < f.data.length; k += 4) { const st = raz(a, bb, k), ok = raz(bb, c, k); if (!st || !ok) continue; stik++; if (st > 3 && raz(f, c, k) === 0) zakritih++; }
    return { stik, zakritih };
  })()`);
}
const meritve = [];
async function meritevOkvirja(b, mode) {
  await odpri(b, mode, 375);
  await prvaFaza(b, 375);
  await klikniGumb(b, 375, 'Preveri');
  // Celica vzorca z izbrisom (pri 12 četrti vogal, pri 4 in 6 celica vzorca z največ izbrisi).
  const vz = await b.izvedi('(() => { const n = c => izbrisVaje.izbris.filter(([x]) => x === c).length; return [...izbrisVaje.vzorec].sort((x, y) => n(y) - n(x))[0]; })()');
  const sel = celicaVaje(vz);
  await b.tipka('Escape', { code: 'Escape' });
  await odmakniMisko(b);
  const zelena = await prekrivanjeCelice(b, sel);
  await b.tapni(sel);
  await odmakniMisko(b);
  const izbrana = await prekrivanjeCelice(b, sel);
  const stari = await prekrivanjeCelice(b, sel, STARI_OKVIR);
  const bs = await b.izvedi(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).boxShadow`);
  meritve.push({ mode, zelena, izbrana, stari });
  preveri(`${mode}, 375 px: prekrivanje okvirja izbrane zelene celice z malimi števkami ni večje kot pri zelenem okvirju brez izbire (stik ${izbrana.stik} ≤ ${zelena.stik}, zakritih ${izbrana.zakritih} ≤ ${zelena.zakritih}; prej 3 px: stik ${stari.stik}, zakritih ${stari.zakritih})`,
    izbrana.stik <= zelena.stik && izbrana.zakritih <= zelena.zakritih && bs.endsWith('2.5px inset'), { zelena, izbrana, stari, bs });
}

async function izhodisceBrskalnik(commit) {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), commit], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star });
  return { star, b: await zazeni({ koren: star }) };
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  fs.mkdirSync(SLIKE, { recursive: true });
  const izh = await izhodisceBrskalnik(izhodisce);
  const b = await zazeni();
  try {
    for (const sirina of SIRINE) {
      for (const mode of TEHNIKE) {
        console.log(`${mode}, ${sirina} px`);
        const nov = await vajaNova(b, mode, sirina);
        const star = await vajaStara(izh.b, mode, sirina);
        // Izhodišče 705349a že ima popravka 5 in 6 naloge 4a (besedila W-krila z x, y) - brez ZNANE_RAZLIKE.
        const r = razlikeIzrisa(star, nov, SLOGI, { znaneRazlike: false });
        preveri(`${mode}, ${sirina} px: končno stanje po 2. fazi enako izhodišču (${izhodisce}) po pravilnem odgovoru`, r.length === 0, r);
      }
      console.log(`naked-triple, »Rešitev« v 2. fazi, ${sirina} px`);
      await resitevOznake(b, sirina);
      console.log(`swordfish, »Rešitev« v 2. fazi, ${sirina} px`);
      await resitevMecarica(b, sirina);
      console.log(`pointing, »Rešitev« v 2. fazi, ${sirina} px`);
      await resitevPresek(b, sirina);
    }
    console.log('naked-pair, oznake pred »Preveri«, 375 px');
    await oznakePredPreveri(b);
    console.log('swordfish in unique-rectangle, oznake pred »Preveri«, 375 px (D5)');
    await posnetkaD5(b);
    console.log('pointing, oznake pred »Preveri«, 375 px (D6a)');
    await posnetekD6a(b);
    console.log('popravek okvirja: prekrivanje z malimi števkami pri 375 px (hidden-pair, hidden-triple, unique-rectangle)');
    for (const m of ['hidden-pair', 'hidden-triple', 'unique-rectangle']) await meritevOkvirja(b, m);
    console.log(JSON.stringify(meritve));
    preveri('brez napak JS', b.napake.length === 0 && izh.b.napake.length === 0, [...b.napake, ...izh.b.napake]);
  } finally {
    await b.zapri();
    await izh.b.zapri();
    fs.rmSync(izh.star, { recursive: true, force: true });
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  process.exit(napak ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
