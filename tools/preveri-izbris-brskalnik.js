'use strict';
// »Spoznaj«: druga faza – izbris (docs/izbris-nacrt.md) v pravem brskalniku; raste po korakih načrta.
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
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome), pribl. 2 min.

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
const TEHNIKE = ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple'];
const SIRINE = [375, 1280];
const SHIFT = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
const SLOGI = ['background-color', 'box-shadow', 'color', 'border-top-color', 'border-top-width', 'text-decoration-line', 'font-weight', 'visibility', 'display', 'width', 'height'];
const MODRA = 'rgb(74, 134, 216)', ZELENA_BG = 'rgb(220, 238, 229)', RDECA_OKVIR = 'rgb(142, 27, 27)';

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
  const cells = await b.izvedi('[...vajaNaZaslonu.targetSlots]');
  for (const si of cells) await dotakni(b, sirina, `#exerciseArea .gc[data-si="${si}"]`);
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
// Slog male števke (si, d) in referenčne izbrisane števke (.cd.elim v isti postavitvi).
const slogStevke = (b, si, d) => b.izvedi(`(() => {
  const cd = document.querySelector('#exerciseArea .gc[data-si="${si}"] .cd[data-d="${d}"]'), s = getComputedStyle(cd);
  const ref = cd.cloneNode(true); ref.className = 'cd elim'; cd.parentNode.appendChild(ref); const r = getComputedStyle(ref);
  const out = { barva: s.color, crta: s.textDecorationLine, debelina: s.fontWeight, obroc: s.boxShadow, razredi: cd.className,
    ref: { barva: r.color, crta: r.textDecorationLine, debelina: r.fontWeight } };
  ref.remove(); return out; })()`);
const STRAN = `(() => { const e = document.querySelector('#exerciseArea .exercise').getBoundingClientRect();
  const n = document.querySelector('#exerciseArea .izbris-faza');
  const g = n ? [...n.querySelectorAll('button')].map(x => x.getBoundingClientRect()) : [];
  return { preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth, niz: !!n,
    gumbov: g.length, vKartici: g.every(r => r.left >= e.left && r.right <= e.right),
    min: g.length ? Math.min(...g.map(r => Math.min(r.width, r.height))) : 0,
    fb: (document.querySelector('#exerciseArea .fb') || {}).textContent || '' }; })()`;

async function vajaNova(b, mode, sirina) {
  await odpri(b, mode, sirina);
  await prvaFaza(b, sirina);
  await klikniGumb(b, sirina, 'Preveri');
  let s = await b.izvedi(STRAN);
  preveri(`${mode}, ${sirina} px: po 1. fazi »Vzorec je pravilen.« in niz z 9 gumbi v kartici`, s.fb.startsWith('Vzorec je pravilen.') && s.niz && s.gumbov === 9 && s.vKartici, s);
  preveri(`${mode}, ${sirina} px: gumbi niza vsaj 24 px (najmanjši ${s.min.toFixed(1)} px), brez preliva`, s.min >= 24 && !s.preliv, s);
  const izbris = await b.izvedi('izbrisVaje.izbris');
  const [si, d] = izbris[0];
  // Oznaka s pravim dotikom/klikom celice in gumba števke.
  await dotakni(b, sirina, `#exerciseArea .gc[data-si="${si}"]`);
  await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  await odmakniMisko(b);
  let st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: oznaka (gumb) ima slog izbrisane števke (${st.barva}, ${st.crta}, ${st.debelina})`,
    st.razredi.includes('oznaka') && st.barva === st.ref.barva && st.crta === st.ref.crta && st.debelina === st.ref.debelina && st.crta.includes('line-through'), st);
  // ↺ z gumbom, nato Shift+števka (QWERTZ) označi in drugi Shift+števka odstrani.
  await dotakni(b, sirina, `#exerciseArea .izbris-faza button[data-d="${d}"]`);
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: ↺ odstrani oznako`, !st.razredi.includes('oznaka') && st.crta === 'none', st);
  await b.tipka(SHIFT[d], { code: `Digit${d}`, shift: true });
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: Shift+${d} (key »${SHIFT[d]}«, code Digit${d}) označi`, st.razredi.includes('oznaka') && st.crta.includes('line-through'), st);
  await b.tipka(SHIFT[d], { code: `Digit${d}`, shift: true });
  st = await slogStevke(b, si, d);
  preveri(`${mode}, ${sirina} px: drugi Shift+${d} oznako odstrani`, !st.razredi.includes('oznaka'), st);
  await b.tipka('Escape', { code: 'Escape' });
  if (mode.startsWith('hidden')) {
    const vz = await b.izvedi('izbrisVaje.vzorec[0]');
    await dotakni(b, sirina, `#exerciseArea .gc[data-si="${vz}"]`);
    await odmakniMisko(b);
    await pocakaj(b);
    const c = await b.izvedi(`(() => { const s = getComputedStyle(document.querySelector('#exerciseArea .gc[data-si="${vz}"]')); return { bg: s.backgroundColor, bs: s.boxShadow }; })()`);
    preveri(`${mode}, ${sirina} px: izbrana zelena celica vzorca – zelena podlaga, moder okvir`, c.bg === ZELENA_BG && c.bs.startsWith(MODRA), c);
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
        const r = razlikeIzrisa(star, nov, SLOGI);
        preveri(`${mode}, ${sirina} px: končno stanje po 2. fazi enako izhodišču (${izhodisce}) po pravilnem odgovoru`, r.length === 0, r);
      }
      console.log(`naked-triple, »Rešitev« v 2. fazi, ${sirina} px`);
      await resitevOznake(b, sirina);
    }
    console.log('naked-pair, oznake pred »Preveri«, 375 px');
    await oznakePredPreveri(b);
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
