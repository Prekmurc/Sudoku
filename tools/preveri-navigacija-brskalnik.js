'use strict';
// Naloga 4c »Navigacija po straneh« (docs/navigacija-nacrt.md) v pravem brskalniku; raste po korakih.
//
// Korak 1 (O6, O7) – »Nazaj na izbiro« na dnu vaje v treningu, pri 375 px (posnemanje telefona, pravi
// dotik) in 1280 px (prava miška):
//   - »Spoznaj« vseh 15 tehnik (vaja 1 in vaja 3), »Vadi v uganki« E1, 4, 8, 11, 13 in »Končano!«:
//     spodnji gumb je viden, pod kartico vaje (pod vsem v #exerciseArea), vsaj 24 px pod najnižjim
//     gumbom vaje, v širini strani, enakega videza kot zgornji (izračunan slog), cilj za dotik vsaj
//     24 px; ko je stran pomaknjena do konca, je ves v oknu; stran brez vodoravnega preliva;
//   - pravi dotik/klik spodnjega gumba vrne v meni na položaj ob odhodu (menuPolozaj), kartica tehnike
//     je v oknu, vaja skrita;
//   - »Vadi v uganki«: dotik/klik med »Iščem vajo …« iskanje prekine (po 2 s vaje ni, meni ostane);
//   - brez napak JS.
//
// Korak 2 (O4, O5, D3) – meni treninga pri 320, 375 (posnemanje telefona, pravi dotik) in 1280 px (miška):
//   - kazalo tehnik: 15 oznak E1 … 13 v vrstnem redu kartic, pod glavo in nad prvo kartico, v širini menija,
//     brez preliva, ime v aria-label (od naloge 6b je kazalo seznam z vidnimi imeni – oznaka in barva sta na .tag
//     v vrstici, title ni), barve = značka ravni na kartici, oznake vsaj 32 px visoke
//     (D3 – mere izpiše na koncu); pravi dotik/klik vsake oznake: kartica 12 px pod vrhom okna (ali stran do
//     konca), vaja se ne začne, fokus na »Spoznaj«; pri prefers-reduced-motion pomik takoj;
//   - gumb »↑«: na vrhu in po natanko enem zaslonu skrit, po pravem drsenju (poteg prsta / kolesce) viden,
//     44 × 44 px, okrogel, 16 px od desnega roba; drsenje po vsem meniju po 20 px – viden natanko po pravilu
//     in ne prekrije gumbov »Spoznaj« / »Vadi v uganki« (pravokotniki, najmanjši razmik izpiše); pravi
//     dotik/klik → vrh, skrit, fokus na kazalu; v vaji (»Spoznaj« 13, »Vadi v uganki« 8, pomaknjeni do
//     konca) skrit; po »Nazaj na izbiro« (zgornji in spodnji) na položaj nižje od zaslona viden brez
//     drsenja, blizu vrha skrit; posnetka meni-kazalo-<širina>.png in meni-na-vrh-<širina>.png (320, 375).
//
// Korak 3 (O1–O3, D1, D3) – okno Pomoč v igri, reševalcu in treningu pri 320, 375 (posnemanje telefona, pravi
// dotik) in 1280 px (miška):
//   - glava okna (»Pomoč«, »↑ Na vrh«, ✕) je lepljiva, z neprozorno podlago, v panelu; kazalo razdelkov tik pod
//     njo (gumbi = naslovi razdelkov v vrstnem redu), kazalo tehnik v »Tehnike« (od naloge 11a v obliki treninga –
//     15 vrstic z oznako in imeni, ime v aria-label, brez title, barve = značka ravni), oba v panelu, brez preliva strani in okna, gumbi vsaj 32 px (D3 – mere
//     in višine kazal izpiše na koncu);
//   - pravi dotik/klik vsakega razdelka in vsake oznake (brez predhodnega pomika, element zadet – ni pod glavo):
//     naslov oz. tehnika pristane pod glavo (ne za njo), v oknu, s fokusom; »Shema« pri 7 se odpre;
//   - drsenje po vsem oknu po 50 px: glava na vrhu okna, »↑ Na vrh« viden natanko po 400 px; pravo drsenje
//     (poteg prsta / kolesce) do konca – ✕ ves v oknu, zadet, zapre okno; ob ponovnem odprtju okno na vrhu;
//     »↑ Na vrh« → vrh, fokus na kazalo; Escape in klik ob panelu zapreta okno; prefers-reduced-motion takoj;
//     posnetka pomoc-<aplikacija>-<širina>.png in pomoc-<aplikacija>-dno-<širina>.png (320, 375);
//   - D1: okna »Zbirka ugank« in »Nova uganka« v igri ter okno zbirke v reševalcu (375, 1280 px) so enaka
//     izhodišču (--izhodisce, privzeto cb19f46 – naloga 11a, korak 1, ki je namerno spremenila »Ekstrem« v
//     »Ekstremna«, ime 9 in opise stopenj; prej 6fadd53 – slogi glave okna iz nalog 4c in 6, filtri in krajši namig
//     naloge 10; ob nalogi je bilo 5f59f09 – korak 2; izvleček z
//     git archive): drevo, HTML, vse izračunane lastnosti vseh elementov in položaji.
// Korak 4 (O8–O14, D2, D4) – povezave med aplikacijami:
//   - glava vseh treh pri 320, 375, 430 in 1280 px: tri zavihke v eni vrstici, prvi otrok glave nad nadnaslovom,
//     28 px, trenutni s podlago kartice in obrobo, druga dva modra (kontrast vsaj 4,5), brez preliva; glava višja
//     za natanko 32 px kot v izhodišču (--izhodisce4, privzeto bfd2ccc – korak 3); igra pri 375 × 667 z uganko:
//     kaj je vidno brez drsenja (mreža, niza »Vpiši« in »Izbriši kandidata«) pred korakom in po njem – izpiše;
//     posnetki glava-<mapa>-<širina>.png (320, 375) in igra-375x667.png;
//   - pravi dotiki (375 px) in kliki (1280 px) med vsemi šestimi pari aplikacij: druga stran, brez vprašanja,
//     zbirka (števec, shramba) in igra (uganka, poteze, kazalec) enaki; trenutni zavihek ne naredi nič;
//   - pravo okno confirm: trening pri vaji 1 brez »Preveri« ne vpraša (D2), po »Preveri« vpraša – preklic pusti
//     krog, potrditev odpre igro, »Nazaj« (izpiše, ali se krog obnovi); reševalec – prazna mreža ne vpraša,
//     vtipkana uganka vpraša (preklic pusti mrežo), po »Reši« ne; igra ne vpraša;
//   - O13: igra → reševalec → izbris odprte uganke → »Nazaj«: igra prazna, števec 0 – z dogodkom »storage« in
//     brez njega (ustavi ga zajemni poslušalec, igro izprazni pageshow);
//   - D4: file:// – dotik/klik zavihka odpre stran, ne seznama datotek (375, 1280 px); koren prek file:// in
//     HTTP preusmeri na igro; brez napak JS.
// Korak 5 – popravka po ročnem pregledu, pri 320, 375 (pravi dotik) in 1280 px (miška):
//   - A: okno Pomoč vseh treh – tik nad mejo (spodnji rob vrstice oznak tehnik na spodnjem robu glave) »↑ Na vrh«,
//     pod njo »↑ Tehnike«; glava, gumb, naslov in ✕ enaki pri obeh napisih, brez preliva; pravi dotik/klik oznake 9,
//     »↑ Tehnike« → vrstica oznak pod glavo, fokus na E1, nato »↑ Na vrh« → vrh; posnetek pomoc-tehnike-<širina>.png;
//   - B: trening – na dnu vaje (»Spoznaj« 15 tehnik, »Vadi v uganki« E1, 4, 8, 13, »Končano!«) »← Nazaj na izbiro« in
//     desno »↑ Na vrh« v eni vrstici, istega videza kot zgornji gumb, brez preliva, okrogel »↑« skrit; pravi
//     dotik/klik → stran na vrhu, vaja ostane; posnetek dno-vrstica-<širina>.png.
// --korak N požene korake 1 … N (privzeto 5), --samo N samo korak N.
//
//   node tools/preveri-navigacija-brskalnik.js [--korak N | --samo N] [--mapa <mapa>] [--izhodisce <commit>] [--izhodisce4 <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');

const KOREN = path.join(__dirname, '..');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-navigacija'));
const korak = Number(arg('--korak', '5'));
const izhodisce = arg('--izhodisce', 'cb19f46');
// --samo N: samo korak N (za sprotno delo).
const samo = args.includes('--samo') ? Number(arg('--samo')) : null;
const tece = n => (samo === null ? korak >= n : samo === n);

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const SEME = s => `(() => { let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return true; })()`;
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

// Meritev spodnjega gumba v vaji (položaji glede na stran, ne okno).
const MERI = `(() => {
  const g = document.getElementById('backBtnDno'), z = document.getElementById('backBtn');
  const area = document.getElementById('exerciseArea');
  const y = window.scrollY, r = g.getBoundingClientRect();
  const vidni = [...area.querySelectorAll('*')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
  const dnoVaje = Math.max(...vidni.map(e => e.getBoundingClientRect().bottom + y), area.getBoundingClientRect().bottom + y);
  const gumbi = [...area.querySelectorAll('button')].filter(e => e.offsetParent !== null);
  const dnoGumbov = gumbi.length ? Math.max(...gumbi.map(e => e.getBoundingClientRect().bottom + y)) : null;
  const sz = getComputedStyle(z), sg = getComputedStyle(g);
  const LAST = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
    'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'height', 'width'];
  // display ni v seznamu: spodnji gumb je od popravka B element vrstice flex (.dno-vaje), zato block namesto inline-block – videz enak.
  const razlike = LAST.filter(l => sz[l] !== sg[l]).map(l => l + ': ' + sz[l] + ' → ' + sg[l]);
  return {
    napis: g.textContent, viden: g.offsetParent !== null, vrh: r.top + y, dno: r.bottom + y, levo: r.left, desno: r.right,
    visina: r.height, sirina: r.width, dnoVaje, dnoGumbov, razlike,
    sirinaStrani: document.documentElement.clientWidth,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    vrhZgornjega: z.getBoundingClientRect().top + y,
  };
})()`;
// Stran do konca, nato položaj gumba v oknu.
const NA_DNO = `(() => { window.scrollTo(0, document.documentElement.scrollHeight); const r = document.getElementById('backBtnDno').getBoundingClientRect();
  return { vrh: r.top, dno: r.bottom, okno: window.innerHeight, scrollY: window.scrollY }; })()`;
const V_MENIJU = mode => `(() => { const k = document.querySelector('.menu-card[data-mode="${mode}"]').getBoundingClientRect();
  return { meni: getComputedStyle(document.getElementById('menu')).display, trener: getComputedStyle(document.getElementById('trainer')).display,
    scrollY: window.scrollY, karticaVOknu: k.top >= 0 && k.bottom <= window.innerHeight, mode, vadi: typeof vadi === 'undefined' ? 'ni' : vadi === null }; })()`;

function pregled(ime, m, naDnu) {
  preveri(`${ime}: spodnji gumb viden, napis »← Nazaj na izbiro«`, m.viden && m.napis === '← Nazaj na izbiro', m);
  preveri(`${ime}: pod vso vajo (vrh ${Math.round(m.vrh)} ≥ dno vaje ${Math.round(m.dnoVaje)})`, m.vrh >= m.dnoVaje - 0.5, m);
  preveri(`${ime}: vsaj 24 px pod gumbi vaje (${m.dnoGumbov === null ? 'brez gumbov' : Math.round(m.vrh - m.dnoGumbov) + ' px'})`,
    m.dnoGumbov === null || m.vrh - m.dnoGumbov >= 24, m);
  preveri(`${ime}: v širini strani, brez preliva`, m.levo >= 0 && m.desno <= m.sirinaStrani && !m.preliv, m);
  preveri(`${ime}: enak videz kot zgornji, cilj vsaj 24 px (${Math.round(m.sirina)} × ${Math.round(m.visina)})`,
    m.razlike.length === 0 && m.visina >= 24, m.razlike);
  preveri(`${ime}: na dnu strani ves v oknu (${Math.round(naDnu.vrh)}–${Math.round(naDnu.dno)} od ${naDnu.okno})`,
    naDnu.vrh >= 0 && naDnu.dno <= naDnu.okno, naDnu);
}

async function nazaj(b, ime, mode, dotik, polozaj) {
  if (dotik) await b.tapni('#backBtnDno'); else await b.klikni('#backBtnDno');
  await pocakaj(b);
  const s = await b.izvedi(V_MENIJU(mode));
  preveri(`${ime}: ${dotik ? 'dotik' : 'klik'} vrne v meni, vaja skrita`, s.meni === 'block' && s.trener === 'none', s);
  preveri(`${ime}: meni na položaju ob odhodu (${polozaj}), kartica v oknu`, s.scrollY === polozaj && s.karticaVOknu, s);
}

// Vstop v vajo s pravim dotikom/klikom gumba na kartici; vrne položaj menija ob odhodu.
async function vstopi(b, mode, nacin, dotik) {
  await b.izvedi(`document.querySelector('.menu-card[data-mode="${mode}"]').scrollIntoView({ block: 'center' }); true`);
  const izb = `.menu-card[data-mode="${mode}"] .nacin-btn${nacin === 'uganka' ? '.vadi' : ':not(.vadi)'}`;
  if (dotik) await b.tapni(izb); else await b.klikni(izb);
  await pocakaj(b, 200);
  return b.izvedi('menuPolozaj');
}

async function korak1(b, sirina) {
  const dotik = sirina < 500;
  console.log(`\nKorak 1 – »Nazaj na izbiro« na dnu vaje, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await b.odpri('trening/index.html', { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  await b.izvedi(SEME(20261010));
  const modes = await b.izvedi('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([k]) => k)');
  preveri('15 tehnik', modes.length === 15, modes);
  const razmiki = [];

  for (const mode of modes) {
    const polozaj = await vstopi(b, mode, 'spoznaj', dotik);
    for (const n of [0, 2]) {
      if (n) await b.izvedi(`exNum = ${n}; renderExercise(); window.scrollTo(0, 0); true`);
      const ime = `Spoznaj ${mode}, vaja ${n + 1}`;
      const m = await b.izvedi(MERI);
      if (m.dnoGumbov !== null) razmiki.push(m.vrh - m.dnoGumbov);
      pregled(ime, m, await b.izvedi(NA_DNO));
      if (mode === 'x-wing' && n === 0) await b.posnetek(path.join(mapa, `dno-x-wing-${sirina}.png`), { vsaStran: false });
    }
    await nazaj(b, `Spoznaj ${mode}`, mode, dotik, polozaj);
  }

  for (const mode of ['naked-single', 'hidden-pair', 'swordfish', 'xy-wing', 'xy-chain']) {
    const polozaj = await vstopi(b, mode, 'uganka', dotik);
    await b.cakaj('vadi !== null', 15000);
    await pocakaj(b);
    const ime = `Vadi v uganki ${mode}`;
    const m = await b.izvedi(MERI);
    if (m.dnoGumbov !== null) razmiki.push(m.vrh - m.dnoGumbov);
    pregled(ime, m, await b.izvedi(NA_DNO));
    await nazaj(b, ime, mode, dotik, polozaj);
  }

  // »Končano!« – krog končan, gumb na dnu ostane.
  {
    const polozaj = await vstopi(b, 'naked-pair', 'spoznaj', dotik);
    await b.izvedi('exNum = MAX_EX; renderExercise(); window.scrollTo(0, 0); true');
    const besedilo = await b.izvedi(`document.getElementById('exerciseArea').textContent`);
    preveri('»Končano!« je izrisan', besedilo.includes('Končano!'), besedilo);
    pregled('Končano!', await b.izvedi(MERI), await b.izvedi(NA_DNO));
    await nazaj(b, 'Končano!', 'naked-pair', dotik, polozaj);
  }

  // »Vadi v uganki« – dotik/klik med iskanjem vaje: iskanje se prekine.
  {
    // Iskanje teče, dokler ga gumb ne prekine: meja 1 s se ne doseže, uganke nimajo stanj te tehnike
    // (stran se po tem preizkusu ne uporablja več).
    await b.izvedi('vadiZdaj = () => 0; stanjaVUganki = () => ({ stanja: [], poskus: false, stopnja: "" }); true');
    const polozaj = await vstopi(b, 'swordfish', 'uganka', dotik);
    const isce = await b.izvedi(`document.querySelector('.vadi-isce') ? document.querySelector('.vadi-isce').textContent : ''`);
    preveri('med iskanjem »Iščem vajo …«', isce === 'Iščem vajo …', isce);
    await nazaj(b, 'med iskanjem', 'swordfish', dotik, polozaj);
    await pocakaj(b, 2000);
    const s = await b.izvedi(V_MENIJU('swordfish'));
    preveri('po 2 s: iskanje prekinjeno (vaje ni), meni ostane', s.vadi === true && s.meni === 'block' && s.trener === 'none', s);
  }

  console.log(`  razmik od najnižjega gumba vaje do spodnjega gumba: ${Math.round(Math.min(...razmiki))}–${Math.round(Math.max(...razmiki))} px`);
}

// ---------- Korak 2 (O4, O5, D3) – meni treninga: kazalo tehnik in okrogel »↑« ----------

// Stran miruje (gladek pomik je končan): položaj se 4-krat zapored ne spremeni.
const MIRUJE = `new Promise(r => { let prej = -1, enako = 0; const t = () => {
  if (window.scrollY === prej) { if (++enako >= 4) return r(window.scrollY); } else { enako = 0; prej = window.scrollY; }
  setTimeout(t, 60); }; setTimeout(t, 60); })`;

const KAZALO = `(() => {
  // Od naloge 11a so vrstice v skupinah in stolpcih (prvi otrok kazala ni gumb).
  const nav = document.getElementById('kazaloTehnik'), gumbi = [...nav.querySelectorAll('.kazalo-vrstica')], y = window.scrollY;
  const kartice = [...document.querySelectorAll('#menu .menu-card')];
  const meni = document.getElementById('menu').getBoundingClientRect(), r = nav.getBoundingClientRect();
  const pr = g => g.getBoundingClientRect();
  // Od naloge 6b (seznam z imeni) je oznaka .tag v vrstici; brez imen je gumb sam .tag.
  const tag = g => g.querySelector('.tag') || g;
  return {
    oznake: gumbi.map(g => tag(g).textContent), zImeni: !!nav.querySelector('.kazalo-imena'), kljuci: gumbi.map(g => g.dataset.kazalo), kartice: kartice.map(k => k.dataset.mode),
    naslovi: gumbi.map(g => g.title), aria: gumbi.map(g => g.getAttribute('aria-label')), tip: gumbi.map(g => g.type),
    visine: gumbi.map(g => pr(g).height), sirine: gumbi.map(g => pr(g).width),
    navVisina: r.height, navDno: r.bottom + y, prvaVrh: kartice[0].getBoundingClientRect().top + y,
    glavaDno: document.querySelector('header.top').getBoundingClientRect().bottom + y,
    vMeniju: gumbi.every(g => pr(g).left >= meni.left - 0.5 && pr(g).right <= meni.right + 0.5),
    vrstice: new Set(gumbi.map(g => Math.round(pr(g).top))).size,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    pisava: getComputedStyle(gumbi[0]).fontSize + ' ' + getComputedStyle(gumbi[0]).fontFamily.split(',')[0],
    barve: gumbi.map(g => { const s = getComputedStyle(tag(g)), z = getComputedStyle(document.querySelector('.menu-card[data-mode="' + g.dataset.kazalo + '"] .badge'));
      return { oznaka: tag(g).textContent, bg: s.backgroundColor, c: s.color, zbg: z.backgroundColor, zc: z.color }; }),
  };
})()`;

// Gumb »↑«: vidnost, pravokotnik in položaj strani.
const NA_VRH = `(() => { const g = document.querySelector('button.na-vrh'), r = g.getBoundingClientRect(), s = getComputedStyle(g);
  return { viden: s.display !== 'none' && !g.hidden, levo: r.left, desno: r.right, vrh: r.top, dno: r.bottom, sirina: r.width, visina: r.height,
    radij: s.borderTopLeftRadius, napis: g.textContent, title: g.title, aria: g.getAttribute('aria-label'),
    okno: window.innerHeight, oknoSirina: document.documentElement.clientWidth, scrollY: window.scrollY,
    maks: document.documentElement.scrollHeight - window.innerHeight }; })()`;

// Drsenje po vsem meniju v korakih po 20 px: na vsakem položaju (po dogodku scroll – dva okvirja) je gumb
// »↑« viden natanko po pravilu in ne prekrije nobenega gumba »Spoznaj« / »Vadi v uganki« v oknu.
const PREKRIVANJE = `(async () => {
  const g = document.querySelector('button.na-vrh'), maks = document.documentElement.scrollHeight - window.innerHeight;
  const okvir = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  let polozajev = 0, vidnih = 0, najmanjRazmik = Infinity, gumbovObGumbu = 0;
  const prekrivanja = [], napacnaVidnost = [];
  for (let y = 0; y <= maks + 19; y += 20) {
    window.scrollTo(0, Math.min(y, maks)); await okvir(); polozajev++;
    const viden = getComputedStyle(g).display !== 'none';
    if (viden !== window.scrollY > window.innerHeight) napacnaVidnost.push(window.scrollY);
    if (!viden) continue;
    vidnih++;
    const a = g.getBoundingClientRect();
    for (const b of document.querySelectorAll('#menu .nacin-btn')) {
      const q = b.getBoundingClientRect();
      if (q.bottom <= 0 || q.top >= window.innerHeight) continue;
      const navpicno = q.bottom > a.top && q.top < a.bottom;
      if (navpicno) { gumbovObGumbu++; najmanjRazmik = Math.min(najmanjRazmik, a.left - q.right); }
      if (navpicno && q.right > a.left && q.left < a.right) prekrivanja.push(window.scrollY + ' ' + b.textContent);
    }
  }
  window.scrollTo(0, 0); await okvir();
  return { polozajev, vidnih, prekrivanja, napacnaVidnost, najmanjRazmik: najmanjRazmik === Infinity ? null : najmanjRazmik, gumbovObGumbu };
})()`;

const d3 = [];

async function korak2(b, sirina) {
  const dotik = sirina < 500;
  console.log(`\nKorak 2 – meni treninga (kazalo tehnik, »↑«), ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await b.odpri('trening/index.html', { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  await b.izvedi(SEME(20261010));
  const OZN = ['E1', 'E2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

  // Kazalo: vsebina, mesto, velikost (D3), barve ravni.
  const k = await b.izvedi(KAZALO);
  preveri('kazalo: 15 oznak E1 … 13', JSON.stringify(k.oznake) === JSON.stringify(OZN), k.oznake);
  preveri('kazalo: v vrstnem redu kartic', JSON.stringify(k.kljuci) === JSON.stringify(k.kartice), { kljuci: k.kljuci, kartice: k.kartice });
  preveri(`kazalo: gumbi (type=button), ime v aria-label (»4 · Skriti par (Hidden Pair)«)${k.zImeni ? ', imena vidna – brez title' : ' in title'}`,
    k.tip.every(t => t === 'button') && k.aria.every((t, i) => t.startsWith(OZN[i] + ' · ') && t.includes('(') && k.naslovi[i] === (k.zImeni ? '' : t)), k.aria);
  preveri(`kazalo: pod glavo, nad prvo kartico (dno ${Math.round(k.navDno)} ≤ kartica ${Math.round(k.prvaVrh)})`,
    k.navDno <= k.prvaVrh && k.navDno - k.navVisina >= k.glavaDno, k);
  preveri('kazalo: v širini menija, stran brez vodoravnega preliva', k.vMeniju && !k.preliv, k);
  const minV = Math.min(...k.visine), maxV = Math.max(...k.visine), minS = Math.min(...k.sirine), maxS = Math.max(...k.sirine);
  preveri(`kazalo: oznake vsaj 32 px visoke (D3; ${minV}–${maxV} px)`, minV >= 32, k.visine);
  const razlBarv = k.barve.filter(x => x.bg !== x.zbg || x.c !== x.zc);
  preveri('kazalo: barve oznak = značka ravni na kartici (podlaga in pisava)', razlBarv.length === 0, razlBarv);
  d3.push(`${sirina} px: oznake ${minV}–${maxV} × ${Math.round(minS)}–${Math.round(maxS)} px, kazalo ${Math.round(k.navVisina)} px v ${k.vrstice} vrsticah, pisava ${k.pisava}`);
  if (dotik) await b.posnetek(path.join(mapa, `meni-kazalo-${sirina}.png`), { vsaStran: false });

  // »↑« na vrhu skrit, napis.
  let g = await b.izvedi(NA_VRH);
  preveri('»↑« na vrhu menija skrit', !g.viden, g);
  preveri('»↑«: napis, »Na vrh« v title in aria-label', g.napis === '↑' && g.title === 'Na vrh' && g.aria === 'Na vrh', g);

  // Pravi dotik/klik vsake oznake: kartica 12 px pod vrhom okna (ali stran do konca), vaja se ne začne.
  const odmiki = [];
  for (const [i, o] of OZN.entries()) {
    await b.izvedi('window.scrollTo(0, 0); true');
    const izb = `#kazaloTehnik [data-kazalo="${k.kljuci[i]}"]`;
    if (dotik) await b.tapni(izb); else await b.klikni(izb);
    await b.izvedi(MIRUJE);
    const s = await b.izvedi(`(() => { const m = document.querySelectorAll('#kazaloTehnik .kazalo-vrstica')[${i}].dataset.kazalo;
      const k = document.querySelector('.menu-card[data-mode="' + m + '"]'), r = k.getBoundingClientRect();
      return { m, vrh: r.top, dno: r.bottom, okno: window.innerHeight, scrollY: window.scrollY,
        maks: document.documentElement.scrollHeight - window.innerHeight, mode, meni: getComputedStyle(document.getElementById('menu')).display,
        trener: getComputedStyle(document.getElementById('trainer')).display,
        fokus: document.activeElement === k.querySelector('.nacin-btn') }; })()`);
    const naVrhu = Math.abs(s.vrh - 12) <= 1, doKonca = Math.abs(s.scrollY - s.maks) <= 1 && s.vrh >= 0 && s.dno <= s.okno;
    odmiki.push(naVrhu ? '12 px' : `${o} do konca (${Math.round(s.vrh)} px)`);
    preveri(`${dotik ? 'dotik' : 'klik'} ${o}: kartica 12 px pod vrhom okna ali stran do konca, vaja se ne začne, fokus na »Spoznaj«`,
      (naVrhu || doKonca) && s.mode === null && s.meni === 'block' && s.trener === 'none' && s.fokus, s);
  }
  console.log(`  položaj kartice po pomiku: ${[...new Set(odmiki)].join(', ')}`);

  // »↑«: prag en zaslon (programsko), nato pravo drsenje (poteg prsta / kolesce).
  await b.izvedi('window.scrollTo(0, window.innerHeight); true'); await pocakaj(b, 150);
  g = await b.izvedi(NA_VRH);
  preveri('»↑« po natanko enem zaslonu še skrit', !g.viden, g);
  await b.izvedi('window.scrollTo(0, 0); true'); await pocakaj(b, 150);
  if (dotik) await b.cdp.poslji('Input.synthesizeScrollGesture', { x: Math.round(sirina / 2), y: 600, yDistance: -(g.okno + 150), speed: 3000 });
  else await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 500, deltaX: 0, deltaY: g.okno + 150 });
  await b.izvedi(MIRUJE);
  g = await b.izvedi(NA_VRH);
  preveri(`»↑« po pravem drsenju (${dotik ? 'poteg prsta' : 'kolesce'}) čez en zaslon viden (scrollY ${g.scrollY})`, g.scrollY > g.okno && g.viden, g);
  // Desno (naloga 6b, popravek P2): 16 px desno od stolpca menija, kadar je ob njem prostor, sicer 16 px od roba okna.
  const stolpec = await b.izvedi('document.querySelector("#menu .menu-card").getBoundingClientRect().width');
  const desno = Math.max(16, (g.oknoSirina - stolpec) / 2 - 60);
  preveri(`»↑«: 44 × 44 px, okrogel, ${desno > 16 ? '16 px desno od stolpca menija' : '16 px od desnega roba'}, v oknu (${g.levo}–${g.desno}, ${g.vrh}–${g.dno})`,
    g.sirina === 44 && g.visina === 44 && g.radij === '50%' && Math.abs(g.oknoSirina - g.desno - desno) <= 0.5 && g.dno <= g.okno && g.vrh >= 0, { g, desno });
  if (dotik) await b.posnetek(path.join(mapa, `meni-na-vrh-${sirina}.png`), { vsaStran: false });

  // Prekrivanje z gumboma kartic med drsenjem.
  const p = await b.izvedi(PREKRIVANJE);
  preveri(`»↑« viden natanko po enem zaslonu na vseh ${p.polozajev} položajih`, p.napacnaVidnost.length === 0, p.napacnaVidnost);
  preveri(`»↑« ne prekrije »Spoznaj« / »Vadi v uganki« (${p.vidnih} položajev z vidnim gumbom; ${p.gumbovObGumbu}-krat gumb kartice v isti višini, najmanjši razmik ${p.najmanjRazmik === null ? '-' : Math.round(p.najmanjRazmik) + ' px'})`,
    p.prekrivanja.length === 0 && p.vidnih > 0, p.prekrivanja);
  d3.push(`${sirina} px: »↑« ${p.najmanjRazmik === null ? 'nikoli v višini gumbov kartice' : 'najmanj ' + Math.round(p.najmanjRazmik) + ' px desno od gumbov kartice'}`);

  // Pravi dotik/klik »↑« → vrh, skrit, fokus na prvi oznaki kazala.
  await b.izvedi('window.scrollTo(0, 2000); true'); await pocakaj(b, 150);
  if (dotik) await b.tapni('button.na-vrh'); else await b.klikni('button.na-vrh');
  await b.izvedi(MIRUJE); await pocakaj(b, 150);
  g = await b.izvedi(NA_VRH);
  const fokus = await b.izvedi(`document.activeElement === document.querySelector('#kazaloTehnik button')`);
  preveri(`${dotik ? 'dotik' : 'klik'} »↑«: stran na vrhu, gumb skrit, fokus na kazalu`, g.scrollY === 0 && !g.viden && fokus, { ...g, fokus });

  // V vaji »↑« ni viden – tudi pri vaji, daljši od zaslona, pomaknjeni do konca.
  for (const [mode, nacin] of [['xy-chain', 'spoznaj'], ['swordfish', 'uganka']]) {
    await vstopi(b, mode, nacin, dotik);
    if (nacin === 'uganka') await b.cakaj('vadi !== null', 15000);
    await pocakaj(b);
    if (dotik) await b.cdp.poslji('Input.synthesizeScrollGesture', { x: Math.round(sirina / 2), y: 600, yDistance: -3000, speed: 4000 });
    else await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 500, deltaX: 0, deltaY: 3000 });
    await b.izvedi(MIRUJE);
    g = await b.izvedi(NA_VRH);
    preveri(`vaja ${mode} (${nacin}), pomaknjena do konca (${g.scrollY} od ${g.maks}, okno ${g.okno}): »↑« ni viden`, !g.viden && g.scrollY === g.maks, g);
    await b.izvedi(`document.getElementById('backBtn').click(); true`);
    await pocakaj(b, 200);
  }

  // »Nazaj na izbiro« (zgornji in spodnji, pravi dotik/klik): meni nižje od enega zaslona → »↑« viden takoj,
  // brez drsenja; meni blizu vrha → skrit.
  for (const [mode, gumb] of [['xy-wing', '#backBtnDno'], ['unique-rectangle', '#backBtn'], ['naked-single', '#backBtnDno']]) {
    const polozaj = await vstopi(b, mode, 'spoznaj', dotik);
    if (dotik) await b.tapni(gumb); else await b.klikni(gumb);
    await pocakaj(b, 250);
    g = await b.izvedi(NA_VRH);
    const vidno = polozaj > g.okno;
    preveri(`»Nazaj na izbiro« (${gumb}) iz ${mode}: meni na ${polozaj} px (okno ${g.okno}) – »↑« ${vidno ? 'viden brez drsenja' : 'skrit'}`,
      g.scrollY === polozaj && g.viden === vidno, g);
  }

  // prefers-reduced-motion: pomik takoj (ne gladko).
  await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await b.izvedi('window.scrollTo(0, 0); true');
  await b.izvedi(`document.querySelector('#kazaloTehnik [data-kazalo="x-wing"]').click(); true`);
  const takoj = await b.izvedi(`document.querySelector('.menu-card[data-mode="x-wing"]').getBoundingClientRect().top`);
  preveri(`prefers-reduced-motion: pomik takoj (kartica ${Math.round(takoj)} px od vrha)`, Math.abs(takoj - 12) <= 1, takoj);
  await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
}

// ---------- Korak 3 (O1–O3, D1, D3) – okno Pomoč v vseh treh aplikacijah ----------

const J = JSON.stringify;
const POMOC = [
  { ime: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog' },
  { ime: 'reševalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
  { ime: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
];

// Pravi dotik/klik na element BREZ predhodnega pomika (brskalnik.klikni() element najprej pomakne v
// sredino – pri lepljivi glavi bi to okno vrnilo na vrh). Vrne { vOknu, zadet }: element je ves v oknu in
// je v svojem središču najvišji (ga ne prekriva npr. lepljiva glava).
async function pritisni(b, izb, dotik) {
  const t = await b.izvedi(`(() => { const el = document.querySelector(${J(izb)}); if (!el) return null;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, v = document.elementFromPoint(x, y);
    return { x, y, vOknu: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, zadet: !!v && (v === el || el.contains(v)) }; })()`);
  if (!t) throw new Error(`Ni elementa ${izb}.`);
  if (dotik) {
    await b.cdp.poslji('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.x, y: t.y }] });
    await b.cdp.poslji('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    for (const type of ['mousePressed', 'mouseReleased']) await b.cdp.poslji('Input.dispatchMouseEvent', { type, x: t.x, y: t.y, button: 'left', clickCount: 1 });
  }
  return t;
}
// Okno miruje (gladek pomik je končan): scrollTop se 4-krat zapored ne spremeni.
const OKNO_MIRUJE = okno => `new Promise(r => { const o = document.querySelector(${J(okno)}); let prej = -1, enako = 0; const t = () => {
  if (o.scrollTop === prej) { if (++enako >= 4) return r(o.scrollTop); } else { enako = 0; prej = o.scrollTop; }
  setTimeout(t, 60); }; setTimeout(t, 60); })`;
// Pravo drsenje v oknu (poteg prsta / kolesce) za dy px navzdol.
async function podrsaj(b, dotik, sirina, dy) {
  if (dotik) await b.cdp.poslji('Input.synthesizeScrollGesture', { x: Math.round(sirina / 2), y: 500, yDistance: -dy, speed: 4000 });
  else await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(sirina / 2), y: 500, deltaX: 0, deltaY: dy });
}

// Stanje okna: glava, »↑ Na vrh«, kazali, preliv, fokus, element `cilj` (izbirnik) glede na glavo.
const POMOC_STANJE = (okno, cilj = null) => `(() => {
  const o = document.querySelector(${J(okno)}), p = o.querySelector('.dialog-panel'), g = o.querySelector('.dialog-glava');
  const r = e => e.getBoundingClientRect(), cs = getComputedStyle(p);
  const notri = [r(p).left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), r(p).right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)];
  const vPanelu = e => r(e).left >= notri[0] - 0.5 && r(e).right <= notri[1] + 0.5;
  const gor = g.querySelector('.dialog-na-vrh'), x = g.querySelector('[data-zapri]');
  const k = o.querySelector('.pomoc-kazalo'), kg = [...k.querySelectorAll('button')];
  const kt = o.querySelector('.kazalo-tehnik'), ktg = [...kt.querySelectorAll('.kazalo-vrstica')];
  const tag = e => e.querySelector('.tag');
  const c = ${cilj || 'null'};
  const d = document.documentElement, a = document.activeElement;
  return {
    odprto: o.classList.contains('odprt'), scrollTop: o.scrollTop, maks: o.scrollHeight - o.clientHeight, okno: innerHeight,
    glava: { vrh: r(g).top, dno: r(g).bottom, otroci: [...g.children].map(e => e.tagName + (e.className ? '.' + e.className : '')),
      podlaga: getComputedStyle(g).backgroundColor, polozaj: getComputedStyle(g).position, vPanelu: vPanelu(g) },
    naVrh: { viden: getComputedStyle(gor).display !== 'none', napis: gor.dataset.napis, sirina: r(gor).width, visina: r(gor).height,
      vidno: [...gor.children].filter(e => getComputedStyle(e).visibility !== 'hidden').map(e => e.textContent).join('|'), aria: gor.getAttribute('aria-label') },
    podKazalomTehnik: r(kt).bottom <= r(g).bottom,
    zapri: { vrh: r(x).top, dno: r(x).bottom },
    kazalo: { napisi: kg.map(e => e.textContent), naslovi: [...o.querySelectorAll('h3.navodila-razdelek')].map(e => e.textContent),
      vrh: r(k).top, visina: r(k).height, vrstic: new Set(kg.map(e => Math.round(r(e).top))).size, vPanelu: kg.every(vPanelu),
      visine: kg.map(e => r(e).height), prejsnji: k.previousElementSibling === g, naslednji: k.nextElementSibling && k.nextElementSibling.tagName },
    oznake: { napisi: ktg.map(e => tag(e).textContent), kljuci: ktg.map(e => e.dataset.kazalo), visine: ktg.map(e => r(tag(e)).height), sirine: ktg.map(e => r(tag(e)).width), visina: r(kt).height,
      vrstic: new Set(ktg.map(e => Math.round(r(e).top))).size, vPanelu: ktg.every(vPanelu),
      barve: ktg.map(e => { const s = getComputedStyle(tag(e)); const z = o.querySelectorAll('.tehnike li')[ktg.indexOf(e)].querySelector('.tehnika-raven');
        return s.backgroundColor === getComputedStyle(z).backgroundColor && s.color === getComputedStyle(z).color; }),
      title: ktg.map(e => e.title), aria: ktg.map(e => e.getAttribute('aria-label')) },
    preliv: d.scrollWidth > d.clientWidth, oknoPreliv: o.scrollWidth > o.clientWidth,
    cilj: c ? { vrh: r(c).top, dno: r(c).bottom, fokus: a === c } : null,
    fokusPrvi: a === kg[0],
  };
})()`;

const d3pomoc = [];

async function korak3(b, sirina) {
  const dotik = sirina < 500;
  const OZN = ['E1', 'E2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
  for (const a of POMOC) {
    console.log(`\nKorak 3 – okno Pomoč, ${a.ime}, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
    await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await b.odpri(a.stran, { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
    await b.cakaj('document.fonts.status === "loaded"', 15000);
    await pritisni(b, a.gumb, dotik);
    await pocakaj(b, 250);
    let s = await b.izvedi(POMOC_STANJE(a.okno));
    preveri('pravi dotik/klik »Pomoč« odpre okno, okno na vrhu', s.odprto && s.scrollTop === 0, s);
    const g0 = s.glava.vrh; // naravni položaj glave (odmik okna in panela)

    // Glava in kazali.
    preveri('glava: »Pomoč«, »↑ Na vrh«, ✕; lepljiva, neprozorna podlaga, v panelu',
      J(s.glava.otroci) === J(['H2', 'BUTTON.dialog-na-vrh', 'BUTTON.dialog-zapri']) && s.glava.polozaj === 'sticky'
        && !/rgba\(.*, 0\)|transparent/.test(s.glava.podlaga) && s.glava.vPanelu, s.glava);
    preveri('»↑ Na vrh« na vrhu okna skrit', !s.naVrh.viden, s.naVrh);
    preveri(`kazalo razdelkov: tik pod glavo, pred prvim razdelkom, gumbi = naslovi (${s.kazalo.napisi.join(' · ')})`,
      s.kazalo.prejsnji && s.kazalo.naslednji === 'H3' && J(s.kazalo.napisi) === J(s.kazalo.naslovi) && s.kazalo.napisi.length >= 5, s.kazalo);
    preveri('kazalo razdelkov v panelu, brez preliva strani in okna', s.kazalo.vPanelu && !s.preliv && !s.oknoPreliv, s);
    preveri('kazalo razdelkov: gumbi vsaj 32 px visoki', Math.min(...s.kazalo.visine) >= 32, s.kazalo.visine);
    // Naloga 11a: kazalo v obliki treninga – vrstice z vidnimi imeni, ime v aria-label, brez title.
    preveri('kazalo tehnik: 15 vrstic E1 … 13, ime v aria-label (imeni vidni – brez title), barve = značka ravni',
      J(s.oznake.napisi) === J(OZN) && s.oznake.aria.every((t, i) => t.startsWith(OZN[i] + ' · ') && s.oznake.title[i] === '') && s.oznake.barve.every(Boolean), s.oznake);
    preveri('kazalo tehnik v panelu', s.oznake.vPanelu, s.oznake);
    const minV = Math.min(...s.oznake.visine), maxV = Math.max(...s.oznake.visine);
    preveri(`kazalo tehnik: oznake vsaj 32 px visoke (D3; ${minV}–${maxV} px)`, minV >= 32, s.oznake.visine);
    d3pomoc.push(`${a.ime}, ${sirina} px: kazalo razdelkov ${Math.round(s.kazalo.visina)} px v ${s.kazalo.vrstic} vrsticah; `
      + `oznake tehnik ${minV}–${maxV} × ${Math.round(Math.min(...s.oznake.sirine))}–${Math.round(Math.max(...s.oznake.sirine))} px, kazalo tehnik ${Math.round(s.oznake.visina)} px v ${s.oznake.vrstic} vrsticah; glava ${Math.round(s.glava.dno - s.glava.vrh)} px`);
    if (dotik) await b.posnetek(path.join(mapa, `pomoc-${a.ime}-${sirina}.png`), { vsaStran: false });

    // Pravi dotik/klik vsakega razdelka: naslov pod glavo (ne za njo), v oknu, s fokusom; glava na vrhu.
    const razmiki = [];
    for (let i = 0; i < s.kazalo.napisi.length; i++) {
      await b.izvedi(`document.querySelector(${J(a.okno)}).scrollTop = 0; true`);
      await pocakaj(b, 50);
      const izb = `${a.okno} .pomoc-kazalo button:nth-child(${i + 1})`;
      const t = await pritisni(b, izb, dotik);
      await b.izvedi(OKNO_MIRUJE(a.okno));
      const st = await b.izvedi(POMOC_STANJE(a.okno, `o.querySelectorAll('h3.navodila-razdelek')[${i}]`));
      const glavaOk = Math.abs(st.glava.vrh - Math.max(0, g0 - st.scrollTop)) <= 0.5;
      razmiki.push(Math.round(st.cilj.vrh - st.glava.dno));
      preveri(`razdelek »${s.kazalo.napisi[i]}«: gumb zadet, naslov pod glavo (${Math.round(st.cilj.vrh - st.glava.dno)} px pod njo), v oknu, fokus, glava na vrhu`,
        t.vOknu && t.zadet && st.cilj.vrh >= st.glava.dno - 0.5 && st.cilj.dno <= st.okno && st.cilj.fokus && glavaOk, { t, st: { cilj: st.cilj, glava: st.glava, scrollTop: st.scrollTop } });
    }
    console.log(`  naslov razdelka pod glavo: ${razmiki.join(', ')} px`);

    // Pravi dotik/klik vsake oznake tehnike: tehnika pod glavo, v oknu, s fokusom.
    const razmikiT = [];
    for (let i = 0; i < OZN.length; i++) {
      // Od naloge 11a je kazalo na telefonu višje od okna – na sredino gre vrstica, ki jo dotik/klik zadene.
      await b.izvedi(`(() => { const o = document.querySelector(${J(a.okno)}); o.querySelector('.kazalo-tehnik [data-kazalo="${s.oznake.kljuci[i]}"]').scrollIntoView({ block: 'center' }); return true; })()`);
      await pocakaj(b, 50);
      const t = await pritisni(b, `${a.okno} .kazalo-tehnik [data-kazalo="${s.oznake.kljuci[i]}"]`, dotik);
      await b.izvedi(OKNO_MIRUJE(a.okno));
      const st = await b.izvedi(POMOC_STANJE(a.okno, `o.querySelectorAll('.tehnike > li')[${i}]`));
      razmikiT.push(Math.round(st.cilj.vrh - st.glava.dno));
      preveri(`oznaka ${OZN[i]}: zadeta, tehnika pod glavo, v oknu, fokus, glava na vrhu`,
        t.vOknu && t.zadet && st.cilj.vrh >= st.glava.dno - 0.5 && st.cilj.vrh < st.okno && st.cilj.fokus && st.glava.vrh === 0, { t, cilj: st.cilj, glava: st.glava });
      if (OZN[i] === '7') {
        // Shema se odpre s pravim dotikom/klikom na »Shema« (povzetek ni pod glavo).
        const sh = `${a.okno} .tehnike > li:nth-child(${i + 1}) summary`;
        const ts = await pritisni(b, sh, dotik);
        await pocakaj(b, 150);
        const odprta = await b.izvedi(`document.querySelector(${J(sh)}).parentElement.open`);
        preveri('7 · X-krilo: »Shema« zadeta in se odpre', ts.zadet && odprta, { ts, odprta });
        await b.izvedi(`document.querySelector(${J(sh)}).parentElement.open = false; true`);
      }
    }
    console.log(`  tehnika pod glavo: ${razmikiT.join(', ')} px`);

    // Drsenje po vsem oknu po 50 px: glava na vrhu okna, »↑ Na vrh« viden natanko po 400 px.
    const drsenje = await b.izvedi(`(async () => {
      const o = document.querySelector(${J(a.okno)}), g = o.querySelector('.dialog-glava'), gor = g.querySelector('.dialog-na-vrh');
      const kt = o.querySelector('.kazalo-tehnik');
      const okvir = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const maks = o.scrollHeight - o.clientHeight, napake = [];
      let polozajev = 0;
      for (let y = 0; y <= maks + 49; y += 50) {
        o.scrollTop = Math.min(y, maks); await okvir(); polozajev++;
        const vrh = g.getBoundingClientRect().top, viden = getComputedStyle(gor).display !== 'none';
        if (Math.abs(vrh - Math.max(0, ${g0} - o.scrollTop)) > 0.5) napake.push('glava ' + o.scrollTop + ': ' + vrh);
        const pricakovan = kt.getBoundingClientRect().bottom <= g.getBoundingClientRect().bottom ? 'tehnike' : o.scrollTop > 400 ? 'vrh' : null;
        if (viden !== !!pricakovan || (viden && gor.dataset.napis !== pricakovan)) napake.push('gumb ' + o.scrollTop + ': ' + (viden ? gor.dataset.napis : 'skrit') + ' ≠ ' + pricakovan);
      }
      o.scrollTop = 0; await okvir();
      return { polozajev, maks, napake };
    })()`);
    preveri(`drsenje po vsem oknu (${drsenje.polozajev} položajev do ${drsenje.maks} px): glava na vrhu, »↑ Na vrh« natanko po 400 px, pod vrstico oznak »↑ Tehnike« (popravek A)`,
      drsenje.napake.length === 0, drsenje.napake.slice(0, 6));

    // Pravo drsenje do konca (poteg prsta / kolesce): glava na vrhu, ✕ zadet in zapre okno.
    await b.izvedi(`document.querySelector(${J(a.okno)}).scrollTop = 0; true`);
    await podrsaj(b, dotik, sirina, 350);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    s = await b.izvedi(POMOC_STANJE(a.okno));
    preveri(`pravo drsenje (${dotik ? 'poteg prsta' : 'kolesce'}) do ${s.scrollTop} px: »↑ Na vrh« ${s.scrollTop > 400 ? 'viden' : 'skrit'}`,
      s.scrollTop > 0 && s.naVrh.viden === s.scrollTop > 400, s.naVrh);
    for (let n = 0; n < 40 && s.scrollTop < s.maks; n++) {
      await podrsaj(b, dotik, sirina, 6000);
      await b.izvedi(OKNO_MIRUJE(a.okno));
      s = await b.izvedi(POMOC_STANJE(a.okno));
    }
    preveri(`pravo drsenje do konca (${s.scrollTop} od ${s.maks}): glava na vrhu okna, gumb viden z napisom »↑ Tehnike« (popravek A)`,
      s.scrollTop === s.maks && s.glava.vrh === 0 && s.naVrh.viden && s.naVrh.napis === 'tehnike' && s.naVrh.vidno === '↑ Tehnike', { scrollTop: s.scrollTop, maks: s.maks, glava: s.glava, naVrh: s.naVrh });
    if (dotik) await b.posnetek(path.join(mapa, `pomoc-${a.ime}-dno-${sirina}.png`), { vsaStran: false });
    const zaprto = s.scrollTop;
    let t = await pritisni(b, `${a.okno} [data-zapri]`, dotik);
    await pocakaj(b, 200);
    s = await b.izvedi(POMOC_STANJE(a.okno));
    preveri('na koncu okna: ✕ ves v oknu, zadet, zapre okno', t.vOknu && t.zadet && !s.odprto, { t, odprto: s.odprto });

    // Ponovno odprtje: okno je na istem mestu kot ob zaprtju (kot pred korakom 3), glava na vrhu, gumb viden
    // (»↑ Tehnike« – konec okna je v »Tehnike«); pravi dotik/klik → vrstica oznak (popravek A), nato »↑ Na vrh« →
    // vrh, fokus na kazalo.
    await pritisni(b, a.gumb, dotik);
    await pocakaj(b, 250);
    s = await b.izvedi(POMOC_STANJE(a.okno));
    preveri(`ponovno odprto okno: na istem mestu (${s.scrollTop} px), glava na vrhu, gumb v glavi viden`,
      s.odprto && s.scrollTop === zaprto && s.glava.vrh === 0 && s.naVrh.viden, { scrollTop: s.scrollTop, zaprto, naVrh: s.naVrh });
    await podrsaj(b, dotik, sirina, 2000);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    t = await pritisni(b, `${a.okno} .dialog-na-vrh`, dotik);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    await pocakaj(b, 100);
    s = await b.izvedi(POMOC_STANJE(a.okno, `o.querySelector('.kazalo-tehnik')`));
    preveri(`»↑ Tehnike« zadet: vrstica oznak pod glavo (${Math.round(s.cilj.vrh - s.glava.dno)} px), gumb »↑ Na vrh«`,
      t.vOknu && t.zadet && s.cilj.vrh >= s.glava.dno - 0.5 && s.cilj.vrh - s.glava.dno < 20 && s.naVrh.napis === 'vrh' && s.naVrh.vidno === '↑ Na vrh' && s.odprto,
      { t, cilj: s.cilj, glava: s.glava, naVrh: s.naVrh });
    t = await pritisni(b, `${a.okno} .dialog-na-vrh`, dotik);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    await pocakaj(b, 100);
    s = await b.izvedi(POMOC_STANJE(a.okno));
    preveri(`»↑ Na vrh« (${Math.round(s.naVrh.sirina || 0)} × 36 px) zadet: okno na vrhu, gumb skrit, fokus na kazalu, okno odprto`,
      t.vOknu && t.zadet && s.scrollTop === 0 && !s.naVrh.viden && s.fokusPrvi && s.odprto, { t, s: { scrollTop: s.scrollTop, naVrh: s.naVrh, fokus: s.fokusPrvi } });

    // Escape in klik ob panelu zapreta okno (tudi po drsenju).
    await podrsaj(b, dotik, sirina, 1500);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    await b.tipka('Escape');
    await pocakaj(b, 150);
    preveri('Escape po drsenju zapre okno', !(await b.izvedi(POMOC_STANJE(a.okno))).odprto);
    await pritisni(b, a.gumb, dotik);
    await pocakaj(b, 250);
    for (const type of ['mousePressed', 'mouseReleased']) await b.cdp.poslji('Input.dispatchMouseEvent', { type, x: 4, y: 300, button: 'left', clickCount: 1 });
    await pocakaj(b, 150);
    preveri('klik ob panelu zapre okno', !(await b.izvedi(POMOC_STANJE(a.okno))).odprto);

    // prefers-reduced-motion: pomik takoj.
    await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await b.izvedi(`document.querySelector(${J(a.gumb)}).click(); true`);
    const takoj = await b.izvedi(`(() => { const o = document.querySelector(${J(a.okno)}); o.querySelector('.pomoc-kazalo button:last-child').click();
      const h = [...o.querySelectorAll('h3.navodila-razdelek')].pop(), g = o.querySelector('.dialog-glava');
      return { scrollTop: o.scrollTop, razmik: h.getBoundingClientRect().top - g.getBoundingClientRect().bottom }; })()`);
    preveri(`prefers-reduced-motion: pomik takoj (»Tehnike« ${Math.round(takoj.razmik)} px pod glavo)`, takoj.scrollTop > 0 && takoj.razmik >= -0.5 && takoj.razmik < 40, takoj);
    await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  }
}

// D1: okna »Zbirka ugank« in »Nova uganka« v igri ter okno zbirke v reševalcu ostanejo enaka izhodišču –
// drevo, vse izračunane lastnosti vseh elementov in položaji (odprto okno, prazna zbirka).
const DRUGA_OKNA = [
  { ime: 'igra – Zbirka ugank', stran: 'igra/index.html', gumb: '#zbirkaBtn', okno: '#zbirkaDialog' },
  { ime: 'igra – Nova uganka', stran: 'igra/index.html', gumb: '#novaBtn', okno: '#novaDialog' },
  { ime: 'reševalec – Zbirka', stran: 'app/index.html', gumb: '#libraryBtn', okno: '#library' },
];
async function drugoOkno(b, o, sirina) {
  await b.odpri(o.stran, { sirina, visina: 800, mobilno: sirina < 500 });
  await b.izvedi('localStorage.clear(); true');
  await b.odpri(o.stran, { sirina, visina: 800, mobilno: sirina < 500 });
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  await b.klikni(o.gumb);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await b.izvedi(`(document.activeElement && document.activeElement.blur && document.activeElement.blur(), new Promise(r => setTimeout(() => r(true), 300)))`);
  return b.izvedi(`(() => {
    const okno = document.querySelector(${J(o.okno)}), vsi = [okno, ...okno.querySelectorAll('*')];
    const slog = e => { const s = getComputedStyle(e); return [...s].filter(p => p !== '-webkit-tap-highlight-color').sort().map(p => p + ':' + s.getPropertyValue(p)).join(';'); };
    const pol = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 100) / 100).join(','); };
    return { odprto: getComputedStyle(okno).display !== 'none', drevo: vsi.map(e => e.tagName + '#' + e.id + '.' + e.className), slogi: vsi.map(slog), polozaji: vsi.map(pol), html: okno.innerHTML };
  })()`);
}
async function korak3D1(b) {
  const nova = {};
  for (const s of [375, 1280]) for (const o of DRUGA_OKNA) nova[`${o.ime} ${s}`] = await drugoOkno(b, o, s);
  console.log(`\nKorak 3, D1 – druga okna .dialog enaka izhodišču ${izhodisce}`);
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  try {
    for (const s of [375, 1280]) for (const o of DRUGA_OKNA) {
      const n = nova[`${o.ime} ${s}`], st = await drugoOkno(bStar, o, s);
      const razSlogi = st.slogi.map((x, i) => (x !== n.slogi[i] ? n.drevo[i] : null)).filter(Boolean);
      const razPol = st.polozaji.map((x, i) => (x !== n.polozaji[i] ? `${n.drevo[i]} ${x} → ${n.polozaji[i]}` : null)).filter(Boolean);
      preveri(`${o.ime}, ${s} px: odprto, drevo in HTML (${n.drevo.length} elementov), vse izračunane lastnosti in položaji enaki izhodišču`,
        n.odprto && st.odprto && J(n.drevo) === J(st.drevo) && n.html === st.html && razSlogi.length === 0 && razPol.length === 0,
        { razSlogi: razSlogi.slice(0, 5), razPol: razPol.slice(0, 5), drevo: J(n.drevo) === J(st.drevo), html: n.html === st.html });
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
}

// ---------- Korak 4 (O8–O14, D2, D4) – povezave med aplikacijami ----------

const izhodisce4 = arg('--izhodisce4', 'bfd2ccc');
const APL = [
  { ime: 'igra', mapa: 'igra', stevec: '#zbirkaBtn' },
  { ime: 'reševalec', mapa: 'app', stevec: '#libraryBtn' },
  { ime: 'trening', mapa: 'trening', stevec: null },
];
const ZAVIHEK = mapa => `nav.aplikacije a[href="../${mapa}/index.html"]`;
// Dve uganki iz docs/uganke.md, ki nista vgrajena primera in imata eno rešitev (izračuna program).
const [UG_P, UG_Q] = (() => {
  const { loadContext, loadPuzzles } = require('../tests/load-engine.js');
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/generator.js']);
  return loadPuzzles().map(p => p.danosti.replace(/\./g, '0'))
    .filter(d => !run(`!!zbirkaPrimerZa(${J(d)})`) && run(`countSolutions(${J(d)})`) === 1);
})();

// Kontrast po WCAG iz »rgb(r, g, b)«.
function kontrast(a, b) {
  const L = s => {
    const [r, g, c] = s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => v / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * c;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const GLAVA = `(() => {
  const h = document.querySelector('header.top'), n = document.querySelector('nav.aplikacije'), eb = document.querySelector('header.top .eyebrow');
  const r = e => e.getBoundingClientRect();
  const korenS = getComputedStyle(document.documentElement);
  return {
    visina: r(h).height, levo: r(h).left, desno: r(h).right, eyebrowVrh: r(eb).top,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    nav: n && { vrh: r(n).top, dno: r(n).bottom, levo: r(n).left, desno: r(n).right, prviOtrok: h.firstElementChild === n },
    povezave: n ? [...n.querySelectorAll('a')].map(a => { const s = getComputedStyle(a), q = r(a); return {
      napis: a.textContent, trenutna: a.getAttribute('aria-current'), vrh: q.top, dno: q.bottom, levo: q.left, desno: q.right, visina: q.height,
      barva: s.color, podlaga: s.backgroundColor, obroba: s.borderTopColor, pisava: s.fontSize }; }) : [],
    podlagaStrani: getComputedStyle(document.body).backgroundColor,
    card: korenS.getPropertyValue('--card').trim(), line: korenS.getPropertyValue('--line').trim(),
  };
})()`;
const hex = s => `rgb(${s.slice(1).match(/../g).map(x => parseInt(x, 16)).join(', ')})`;

// Igra pri 375 × 667 z uganko: kaj je vidno brez drsenja (dno elementov glede na okno).
const IGRA_VIDNO = `(() => { const r = id => document.getElementById(id).getBoundingClientRect();
  return { okno: innerHeight, scrollY, mrezaVrh: r('mreza').top, mreza: r('mreza').bottom, vpisiVrh: r('nizVpisi').top, vpisi: r('nizVpisi').bottom,
    odstraniVrh: r('nizOdstrani').top, odstrani: r('nizOdstrani').bottom, glava: document.querySelector('header.top').getBoundingClientRect().height }; })()`;

const meritve4 = [];

async function glaveInIgra(b, ime) {
  const izid = {};
  for (const s of [320, 375, 430, 1280]) for (const a of APL) {
    await b.odpri(`${a.mapa}/index.html`, { sirina: s, visina: s < 500 ? 667 : 800, mobilno: s < 500 });
    izid[`${a.ime} ${s}`] = await b.izvedi(GLAVA);
    if (ime === 'novo' && (s === 320 || s === 375)) await b.posnetek(path.join(mapa, `glava-${a.mapa}-${s}.png`), { vsaStran: false });
  }
  await b.odpri('igra/index.html', { sirina: 375, visina: 667, mobilno: true });
  await b.izvedi(`zacniIgro(${J(UG_P)}); true`);
  await pocakaj(b, 200);
  izid.igra = await b.izvedi(IGRA_VIDNO);
  if (ime === 'novo') await b.posnetek(path.join(mapa, 'igra-375x667.png'), { vsaStran: false });
  await b.izvedi('localStorage.clear(); true');
  return izid;
}

async function korak4Glava(b) {
  console.log(`\nKorak 4 – glava z zavihki pri 320, 375, 430, 1280 px; primerjava z izhodiščem ${izhodisce4}`);
  const novo = await glaveInIgra(b, 'novo');
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce4], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star });
  const bStar = await zazeni({ koren: star });
  let staro;
  try {
    staro = await glaveInIgra(bStar, 'staro');
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
  for (const s of [320, 375, 430, 1280]) for (const a of APL) {
    const g = novo[`${a.ime} ${s}`], st = staro[`${a.ime} ${s}`], ime = `${a.ime}, ${s} px`;
    const p = g.povezave;
    preveri(`${ime}: tri povezave Igra · Reševalec · Trening, trenutna ${a.ime}`,
      J(p.map(x => x.napis)) === J(['Igra', 'Reševalec', 'Trening']) && J(p.map(x => x.trenutna)) === J(APL.map(x => (x === a ? 'page' : null))), p);
    preveri(`${ime}: vrstica je prvi otrok glave, nad nadnaslovom, v širini glave`,
      g.nav && g.nav.prviOtrok && g.nav.dno <= g.eyebrowVrh && g.nav.levo >= g.levo - 0.5 && g.nav.desno <= g.desno + 0.5, g.nav);
    preveri(`${ime}: zavihki v eni vrstici, vsi v vrstici, 28 px visoki`,
      p.every(x => Math.abs(x.vrh - p[0].vrh) < 0.5 && x.visina >= 27.5 && x.desno <= g.nav.desno + 0.5), p.map(x => [x.vrh, x.visina, x.desno]));
    preveri(`${ime}: stran brez vodoravnega preliva`, !g.preliv);
    const tr = p.find(x => x.trenutna), dr = p.filter(x => !x.trenutna);
    preveri(`${ime}: trenutni zavihek s podlago kartice in obrobo, druga dva modri povezavi s kontrastom vsaj 4,5`,
      tr.podlaga === hex(g.card) && tr.obroba === hex(g.line) && dr.every(x => x.barva === 'rgb(31, 95, 168)' && kontrast(x.barva, g.podlagaStrani) >= 4.5)
      && kontrast(tr.barva, tr.podlaga) >= 4.5, { tr, dr: dr.map(x => x.barva) });
    preveri(`${ime}: glava višja za 32 px (${Math.round(st.visina)} → ${Math.round(g.visina)})`, Math.abs(g.visina - st.visina - 32) < 0.5, [st.visina, g.visina]);
    if (s === 320 && a.ime === 'igra') meritve4.push(`320 px: zavihki od ${Math.round(p[0].levo)} do ${Math.round(p[2].desno)} px (glava do ${Math.round(g.desno)} px), ena vrstica, preliva ni`);
  }
  // Igra pri 375 × 667: kaj je vidno brez drsenja pred korakom in po njem.
  const opis = (v, kaj) => {
    const d = v[kaj], vrh = v[kaj + 'Vrh'] ?? v.mrezaVrh;
    return d <= v.okno ? `ves viden (dno ${Math.round(d)} px)` : vrh >= v.okno ? `ni viden (vrh ${Math.round(vrh)} px)` : `delno viden (${Math.round(v.okno - vrh)} od ${Math.round(d - vrh)} px)`;
  };
  for (const [kaj, napis] of [['mreza', 'mreža'], ['vpisi', 'niz »Vpiši«'], ['odstrani', 'niz »Izbriši kandidata«']]) {
    meritve4.push(`igra 375 × 667, ${napis}: pred ${opis(staro.igra, kaj)}, po ${opis(novo.igra, kaj)}`);
  }
  preveri('igra 375 × 667: mreža in niza so nižje natanko za 32 px', ['mreza', 'vpisi', 'odstrani'].every(k => Math.abs(novo.igra[k] - staro.igra[k] - 32) < 0.5),
    { staro: staro.igra, novo: novo.igra });
}

// Okno confirm() potrdi ali prekliče DevTools (b.odgovor); vprašanja se zapišejo v b.vprasanja.
function poslusajVprasanja(b) {
  if (b.vprasanja) return;
  b.vprasanja = [];
  b.odgovor = true;
  b.cdp.naDogodek(s => {
    if (s.method !== 'Page.javascriptDialogOpening') return;
    b.vprasanja.push(s.params.message);
    b.cdp.poslji('Page.handleJavaScriptDialog', { accept: b.odgovor });
  });
}
// Čaka, da je odprta stran v mapi (tudi po obnovi iz predpomnilnika, ko loadEventFired ne pride).
async function pocakajStran(b, mapaStrani, ms = 10000) {
  const konec = Date.now() + ms;
  while (Date.now() < konec) {
    try {
      if (await b.izvedi(`location.pathname.endsWith('/${mapaStrani}/index.html') && document.readyState === 'complete'`)) {
        await b.izvedi('document.fonts ? document.fonts.ready.then(() => true) : true');
        return true;
      }
    } catch { /* stran se ravno menja */ }
    await pocakaj(b, 50);
  }
  return false;
}
// Pravi dotik/klik zavihka. Vrne true, če se je odprla stran ciljne aplikacije.
async function zavihek(b, cilj, dotik, { pricakujOdhod = true } = {}) {
  await b.izvedi('window.__ostal = 1; true');
  if (dotik) await b.tapni(ZAVIHEK(cilj)); else await b.klikni(ZAVIHEK(cilj));
  if (!pricakujOdhod) { await pocakaj(b, 600); return false; }
  return pocakajStran(b, cilj);
}
// Pred odhodom: zapomni si obnovo iz predpomnilnika (pageshow.persisted) in štej dogodke "storage".
const OZNACI = `(() => { window.__obnova = null; window.__storage = 0;
  addEventListener('pageshow', e => { window.__obnova = e.persisted; });
  addEventListener('storage', () => { window.__storage++; }); return true; })()`;

async function korak4Pari(b, sirina) {
  const dotik = sirina < 500;
  console.log(`\nKorak 4 – pravi ${dotik ? 'dotiki' : 'kliki'} med aplikacijami, ${sirina} px`);
  poslusajVprasanja(b);
  const odpri = s => b.odpri(s, { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  await odpri('igra/index.html');
  await b.izvedi('localStorage.clear(); true');
  await odpri('igra/index.html');
  await b.izvedi(`dodajVZbirko(${J(UG_P)}, '', 'rocno'); zacniIgro(${J(UG_P)});
    const prazne = [...igra.danosti].map((d, i) => (d === '0' ? i : -1)).filter(i => i >= 0).slice(0, 3);
    for (const c of prazne) izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] });
    plosca.razveljavi(); true`);
  const IGRA_STANJE = `({ danosti: igra && igra.danosti, poteze: igra && igra.poteze.length, kazalec: igra && igra.kazalec, stevec: document.getElementById('zbirkaBtn').textContent })`;
  const zacetek = await b.izvedi(IGRA_STANJE);
  const zbirka0 = await b.izvedi("localStorage.getItem('sudoku.zbirka.v1')");
  preveri('izhodišče: uganka v zbirki, 3 poteze, ena razveljavljena', zacetek.danosti === UG_P && zacetek.poteze === 3 && zacetek.kazalec === 2 && zacetek.stevec === 'Zbirka (1)', zacetek);
  b.vprasanja.length = 0;

  // Vseh šest parov: igra → reševalec → trening → igra → trening → reševalec → igra.
  const pot = ['igra', 'app', 'trening', 'igra', 'trening', 'app', 'igra'];
  for (let i = 1; i < pot.length; i++) {
    const [od, cilj] = [pot[i - 1], pot[i]];
    const ime = `${APL.find(a => a.mapa === od).ime} → ${APL.find(a => a.mapa === cilj).ime}`;
    const ok = await zavihek(b, cilj, dotik);
    preveri(`${ime}: odpre se druga aplikacija, brez vprašanja`, ok && b.vprasanja.length === 0, { ok, vprasanja: b.vprasanja });
    const st = APL.find(a => a.mapa === cilj).stevec;
    if (st) preveri(`${ime}: zbirka enaka (${st} »Zbirka (1)«)`, (await b.izvedi(`document.querySelector('${st}').textContent`)) === 'Zbirka (1)');
    if (cilj === 'igra') {
      const s = await b.izvedi(IGRA_STANJE);
      preveri(`${ime}: igra enaka (uganka, 3 poteze, kazalec 2)`, J(s) === J(zacetek), s);
    }
    preveri(`${ime}: zbirka v shrambi enaka`, (await b.izvedi("localStorage.getItem('sudoku.zbirka.v1')")) === zbirka0);
    // Trenutni zavihek ne naredi nič.
    await zavihek(b, cilj, dotik, { pricakujOdhod: false });
    preveri(`${APL.find(a => a.mapa === cilj).ime}: trenutni zavihek ne naredi nič`, (await b.izvedi('window.__ostal === 1 && location.pathname')) === `/${cilj}/index.html` && b.vprasanja.length === 0);
  }

  // Trening: vaja 1 brez »Preveri« (D2) – brez vprašanja.
  await odpri('trening/index.html');
  await vstopi(b, 'naked-pair', 'spoznaj', dotik);
  preveri('trening, vaja 1 brez »Preveri«: odide brez vprašanja (D2)', (await zavihek(b, 'igra', dotik)) && b.vprasanja.length === 0, b.vprasanja);
  // Po »Preveri«: pravo okno, preklic → krog enak.
  await odpri('trening/index.html');
  await vstopi(b, 'naked-pair', 'spoznaj', dotik);
  await b.izvedi(`[...document.querySelectorAll('#exerciseArea button')].find(g => g.textContent === 'Preveri').id = 'preveriTest'; true`);
  if (dotik) await b.tapni('#preveriTest'); else await b.klikni('#preveriTest');
  await pocakaj(b, 200);
  const KROG = `({ mode, nacin, exNum, scoreRight, scoreTotal, trener: getComputedStyle(document.getElementById('trainer')).display,
    vaja: document.getElementById('exerciseArea').innerHTML.length })`;
  const krog = await b.izvedi(KROG);
  const besedilo = `Zapustiš trening? Krog 3 · Očitni par (vaja 1 / 9, pravilno ${krog.scoreRight} / ${krog.scoreTotal}) se ne shrani.`;
  b.odgovor = false;
  await zavihek(b, 'igra', dotik, { pricakujOdhod: false });
  const poPreklicu = await b.izvedi(KROG);
  preveri(`trening po »Preveri«: pravo okno z besedilom »${besedilo}«`, J(b.vprasanja) === J([besedilo]), b.vprasanja);
  preveri('trening, »Prekliči«: stran ostane, krog in vaja enaka',
    (await b.izvedi('window.__ostal === 1 && location.pathname')) === '/trening/index.html' && J(poPreklicu) === J(krog), { krog, poPreklicu });
  b.odgovor = true;
  await b.izvedi(OZNACI);
  preveri('trening, potrditev: odpre se igra', await zavihek(b, 'igra', dotik), b.vprasanja);
  preveri('trening, potrditev: drugo vprašanje enako', b.vprasanja.length === 2 && b.vprasanja[1] === besedilo, b.vprasanja);
  // Gumb brskalnika »Nazaj«: kaj se obnovi.
  await b.izvedi('history.back(); true');
  const nazajT = await pocakajStran(b, 'trening');
  const obnova = nazajT ? await b.izvedi(`({ obnova: window.__obnova, ostal: window.__ostal === 1, mode: typeof mode === 'undefined' ? null : mode, exNum: typeof exNum === 'undefined' ? null : exNum })`) : null;
  preveri('»Nazaj« vrne v trening', nazajT);
  meritve4.push(`${sirina} px, »Nazaj« iz igre v trening sredi kroga: ${obnova && obnova.obnova ? `obnova iz predpomnilnika (pageshow.persisted), krog ${obnova.mode === 'naked-pair' && obnova.exNum === 0 ? 'ostane (3 · Očitni par, vaja 1)' : 'se izgubi'}` : `stran se naloži znova (${J(obnova)})`}`);

  // Reševalec: prazna mreža brez vprašanja; vtipkana uganka vpraša; po »Reši« (v zbirki) ne.
  await odpri('app/index.html');
  preveri('reševalec, prazna mreža: odide brez vprašanja', (await zavihek(b, 'igra', dotik)) && b.vprasanja.length === 2, b.vprasanja);
  await odpri('app/index.html');
  await b.fokus('#nizDanosti');
  await b.vtipkaj(UG_Q);
  await pocakaj(b, 150);
  b.odgovor = false;
  await zavihek(b, 'igra', dotik, { pricakujOdhod: false });
  preveri('reševalec, vtipkana uganka: pravo okno »Zapustiš reševalec? Uganka v mreži ni shranjena v zbirko.«',
    b.vprasanja.length === 3 && b.vprasanja[2] === 'Zapustiš reševalec? Uganka v mreži ni shranjena v zbirko.', b.vprasanja);
  preveri('reševalec, »Prekliči«: stran in mreža ostaneta',
    (await b.izvedi(`window.__ostal === 1 && location.pathname === '/app/index.html' && currentGivens() === ${J(UG_Q)}`)));
  b.odgovor = true;
  if (dotik) await b.tapni('#solveBtn'); else await b.klikni('#solveBtn');
  await b.cakaj(`document.getElementById('libraryBtn').textContent === 'Zbirka (2)'`);
  preveri('reševalec po »Reši« (uganka v zbirki): odide brez vprašanja', (await zavihek(b, 'igra', dotik)) && b.vprasanja.length === 3, b.vprasanja);
  // Igra ne vpraša.
  preveri('igra z odprto uganko: odide brez vprašanja', (await zavihek(b, 'trening', dotik)) && b.vprasanja.length === 3, b.vprasanja);
}

// O13: igra → reševalec, tam izbris odprte uganke, »Nazaj«. Z dostavljenim dogodkom "storage" in brez
// njega – ustavi ga poslušalec, ki ga skripta, vstavljena pred skriptami strani (addScriptToEvaluateOnNewDocument),
// registrira prvi; takrat igro izprazni samo pageshow.
async function korak4Nazaj(b) {
  console.log('\nKorak 4 – O13: vrnitev z »Nazaj« po izbrisu uganke v reševalcu, 375 px');
  for (const brezStorage of [false, true]) {
    const ime = brezStorage ? 'brez dogodka »storage«' : 'z dogodkom »storage«';
    const vstavljena = brezStorage ? await b.cdp.poslji('Page.addScriptToEvaluateOnNewDocument', {
      source: "addEventListener('storage', e => { window.__ustavljen = (window.__ustavljen || 0) + 1; e.stopImmediatePropagation(); }, true);" }) : null;
    await b.odpri('igra/index.html', { sirina: 375, visina: 667, mobilno: true });
    await b.izvedi('localStorage.clear(); true');
    await b.odpri('igra/index.html', { sirina: 375, visina: 667, mobilno: true });
    await b.izvedi(`dodajVZbirko(${J(UG_P)}, '', 'rocno'); zacniIgro(${J(UG_P)});
      const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); true`);
    await b.izvedi(OZNACI);
    await zavihek(b, 'app', true);
    await b.izvedi(`zbirkaIzbrisi(${J(UG_P)}); true`);
    await b.izvedi('history.back(); true');
    const ok = await pocakajStran(b, 'igra');
    await pocakaj(b, 300);
    const s = await b.izvedi(`({ obnova: window.__obnova, storage: window.__storage, ustavljen: window.__ustavljen || 0, igra: igra === null ? null : igra.danosti,
      stevec: document.getElementById('zbirkaBtn').textContent, opis: document.getElementById('opisUganke').textContent,
      zapis: !!igreBeri().igre[${J(UG_P)}] })`);
    meritve4.push(`O13, ${ime}: obnova iz predpomnilnika ${s.obnova}, dostavljenih dogodkov »storage« ${s.storage}${brezStorage ? ` (ustavljenih ${s.ustavljen})` : ''}`);
    preveri(`O13, ${ime}: igra obnovljena iz predpomnilnika`, ok && s.obnova === true, s);
    preveri(`O13, ${ime}: mreža prazna, števec 0, brez zapisa igre`, s.igra === null && s.stevec === 'Zbirka (0)' && s.opis === 'Ni odprte uganke.' && !s.zapis, s);
    if (brezStorage) {
      preveri(`O13, ${ime}: dogodek do igre ni prišel (ustavljen pred vsemi poslušalci strani)`, s.storage === 0, s);
      await b.cdp.poslji('Page.removeScriptToEvaluateOnNewDocument', { identifier: vstavljena.identifier });
    }
  }
}

// D4: file:// – povezave odprejo stran, ne seznama datotek; koren preusmeri na igro (tudi prek HTTP).
async function korak4File(b) {
  console.log('\nKorak 4 – D4: file:// in koren');
  const url = p => 'file:///' + path.join(KOREN, p).replace(/\\/g, '/');
  for (const s of [375, 1280]) {
    const dotik = s < 500;
    await b.odpri('igra/index.html', { sirina: s, visina: dotik ? 667 : 800, mobilno: dotik });
    const nal = b.cdp.dogodek('Page.loadEventFired');
    await b.cdp.poslji('Page.navigate', { url: url('igra/index.html') });
    await nal;
    await b.izvedi("localStorage.setItem('sudoku.test.file', 'igra'); true");
    for (const [cilj, el] of [['app', 'solveBtn'], ['trening', 'menu'], ['igra', 'mreza']]) {
      const ok = await zavihek(b, cilj, dotik);
      const st = await b.izvedi(`({ href: location.href, protokol: location.protocol, stran: !!document.getElementById('${el}'), zavihki: document.querySelectorAll('nav.aplikacije a').length, shramba: localStorage.getItem('sudoku.test.file') })`);
      preveri(`file://, ${s} px, ${dotik ? 'dotik' : 'klik'} »${APL.find(a => a.mapa === cilj).ime}«: odpre se stran (${cilj}/index.html), ne seznam datotek`,
        ok && st.protokol === 'file:' && st.href === url(`${cilj}/index.html`) && st.stran && st.zavihki === 3, st);
      if (s === 375 && cilj === 'app') meritve4.push(`file://: shramba igre ${st.shramba === 'igra' ? 'je' : 'ni'} vidna v reševalcu (Chromium)`);
    }
  }
  // Koren prek file:// in prek HTTP preusmeri na igro.
  await b.cdp.poslji('Page.navigate', { url: url('index.html') });
  preveri('koren file://index.html preusmeri na igro', await pocakajStran(b, 'igra'));
  await b.cdp.poslji('Page.navigate', { url: b.osnova + 'index.html' });
  preveri('koren http://…/index.html preusmeri na igro', await pocakajStran(b, 'igra'));
  preveri('koren prek HTTP: igra deluje (mreža izrisana)', await b.izvedi("location.protocol === 'http:' && document.querySelectorAll('#mreza .celica').length === 81"));
}

// ---------- Korak 5 – popravka po ročnem pregledu (A: »↑ Tehnike« v glavi okna Pomoč, B: »↑ Na vrh« na dnu vaje) ----------

// A: glava okna Pomoč – mere glave in gumba, vidni napis (oba napisa sta v gumbu, neaktivni neviden).
const GLAVA_A = okno => `(() => {
  const o = document.querySelector(${J(okno)}), g = o.querySelector('.dialog-glava'), gor = g.querySelector('.dialog-na-vrh');
  const h = g.querySelector('h2'), x = g.querySelector('[data-zapri]'), kt = o.querySelector('.kazalo-tehnik'), r = e => e.getBoundingClientRect();
  const cs = getComputedStyle(gor), notri = r(gor).width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return {
    scrollTop: o.scrollTop, napis: gor.dataset.napis, viden: cs.display !== 'none', aria: gor.getAttribute('aria-label'),
    vidno: [...gor.children].filter(e => getComputedStyle(e).visibility !== 'hidden').map(e => e.textContent),
    napisi: [...gor.children].map(e => ({ t: e.textContent, sirina: r(e).width })),
    notri, gor: [r(gor).left, r(gor).width, r(gor).height], h2: [r(h).left, r(h).width], x: [r(x).left, r(x).width],
    glava: [r(g).left, r(g).width, r(g).height], glavaDno: r(g).bottom, ktDno: r(kt).bottom, ktVrh: r(kt).top,
    fokusE1: document.activeElement === kt.querySelector('button'),
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth, oknoPreliv: o.scrollWidth > o.clientWidth,
  };
})()`;
const meritve5 = [];

async function korak5A(b, sirina) {
  const dotik = sirina < 500;
  for (const a of POMOC) {
    console.log(`\nKorak 5, popravek A – »↑ Tehnike« v glavi okna Pomoč, ${a.ime}, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
    await b.cdp.poslji('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await b.odpri(a.stran, { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
    await b.cakaj('document.fonts.status === "loaded"', 15000);
    await pritisni(b, a.gumb, dotik);
    await pocakaj(b, 250);
    // Meja: položaj okna, pri katerem je spodnji rob vrstice oznak na spodnjem robu lepljive glave.
    const meja = await b.izvedi(`(() => { const o = document.querySelector(${J(a.okno)}), g = o.querySelector('.dialog-glava');
      o.scrollTop = 1000; const kt = o.querySelector('.kazalo-tehnik'); return o.scrollTop + kt.getBoundingClientRect().bottom - g.getBoundingClientRect().bottom; })()`);
    const na = async y => {
      await b.izvedi(`(async () => { const o = document.querySelector(${J(a.okno)}); o.scrollTop = ${y};
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return true; })()`);
      return b.izvedi(GLAVA_A(a.okno));
    };
    const vrh = await na(Math.floor(meja) - 1), teh = await na(Math.ceil(meja) + 1), zgoraj = await na(450), nic = await na(0);
    preveri(`tik nad mejo (${vrh.scrollTop} px, vrstica oznak ${Math.round(vrh.ktDno - vrh.glavaDno)} px pod glavo): »↑ Na vrh«`,
      vrh.viden && vrh.napis === 'vrh' && J(vrh.vidno) === J(['↑ Na vrh']) && vrh.aria === '↑ Na vrh', vrh);
    preveri(`pod vrstico oznak (${teh.scrollTop} px): »↑ Tehnike«`,
      teh.viden && teh.napis === 'tehnike' && J(teh.vidno) === J(['↑ Tehnike']) && teh.aria === '↑ Tehnike', teh);
    preveri('pred »Tehnike« nad 400 px »↑ Na vrh«, na vrhu skrit', zgoraj.viden && zgoraj.napis === 'vrh' && !nic.viden, { zgoraj, nic });
    // Glava ostane enako široka: gumb, naslov in ✕ na istem mestu in iste širine pri obeh napisih.
    preveri(`glava enaka pri obeh napisih (gumb ${Math.round(teh.gor[1])} × ${Math.round(teh.gor[2])} px, glava ${Math.round(teh.glava[1])} × ${Math.round(teh.glava[2])} px)`,
      J(vrh.gor) === J(teh.gor) && J(vrh.h2) === J(teh.h2) && J(vrh.x) === J(teh.x) && J(vrh.glava) === J(teh.glava), { vrh, teh });
    preveri('oba napisa v gumbu, gumb desno od naslova, brez preliva strani in okna',
      teh.napisi.every(n => n.sirina <= teh.notri + 0.5) && !teh.preliv && !teh.oknoPreliv && teh.h2[0] + teh.h2[1] <= teh.gor[0], teh);
    meritve5.push(`A ${a.ime}, ${sirina} px: gumb ${Math.round(teh.gor[1])} × ${Math.round(teh.gor[2])} px (napisa ${teh.napisi.map(n => Math.round(n.sirina)).join(' / ')} px), glava ${Math.round(teh.glava[2])} px`);
    // Pravi dotik/klik oznake 9 (okno pod vrstico oznak), nato »↑ Tehnike« → vrstica oznak pod glavo, fokus na E1;
    // nato »↑ Na vrh« → vrh.
    await b.izvedi(`(() => { document.querySelector(${J(a.okno)}).querySelector('.kazalo-tehnik').scrollIntoView({ block: 'center' }); return true; })()`);
    await pocakaj(b, 50);
    await pritisni(b, `${a.okno} .kazalo-tehnik [data-kazalo="turbot-fish"]`, dotik);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    let s = await b.izvedi(GLAVA_A(a.okno));
    preveri('po dotiku/kliku oznake 9: »↑ Tehnike«', s.napis === 'tehnike' && J(s.vidno) === J(['↑ Tehnike']), s);
    if (dotik && a.ime === 'igra') await b.posnetek(path.join(mapa, `pomoc-tehnike-${sirina}.png`), { vsaStran: false });
    let t = await pritisni(b, `${a.okno} .dialog-na-vrh`, dotik);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    s = await b.izvedi(GLAVA_A(a.okno));
    preveri(`»↑ Tehnike« zadet: vrstica oznak ${Math.round(s.ktVrh - s.glavaDno)} px pod glavo, fokus na E1, napis »↑ Na vrh«`,
      t.vOknu && t.zadet && s.ktVrh >= s.glavaDno - 0.5 && s.ktVrh - s.glavaDno < 20 && s.fokusE1 && s.napis === 'vrh' && J(s.vidno) === J(['↑ Na vrh']), { t, s });
    t = await pritisni(b, `${a.okno} .dialog-na-vrh`, dotik);
    await b.izvedi(OKNO_MIRUJE(a.okno));
    s = await b.izvedi(GLAVA_A(a.okno));
    preveri('nato »↑ Na vrh«: okno na vrhu, gumb skrit', t.zadet && s.scrollTop === 0 && !s.viden, s);
  }
}

// B: vrstica na dnu vaje – »← Nazaj na izbiro« in »↑ Na vrh«.
const DNO_B = `(() => {
  const n = document.getElementById('backBtnDno'), v = document.getElementById('naVrhDno'), z = document.getElementById('backBtn');
  const vr = n.parentElement, r = e => e.getBoundingClientRect();
  const LAST = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
    'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'height', 'position']; // display: element vrstice flex je block – videz enak
  const sz = getComputedStyle(z);
  const razlike = e => LAST.filter(l => sz[l] !== getComputedStyle(e)[l]).map(l => l + ': ' + sz[l] + ' → ' + getComputedStyle(e)[l]);
  const plav = document.querySelector('button.na-vrh');
  return {
    napisa: [n.textContent, v.textContent], isti: vr === v.parentElement, razred: vr.className,
    n: { vrh: r(n).top, dno: r(n).bottom, levo: r(n).left, desno: r(n).right },
    v: { vrh: r(v).top, dno: r(v).bottom, levo: r(v).left, desno: r(v).right, sirina: r(v).width, visina: r(v).height },
    vrstica: { levo: r(vr).left, desno: r(vr).right }, razlikeN: razlike(n), razlikeV: razlike(v),
    sirinaStrani: document.documentElement.clientWidth, preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    okno: innerHeight, scrollY: window.scrollY, maks: document.documentElement.scrollHeight - innerHeight, plavajoc: !!plav && getComputedStyle(plav).display !== 'none',
    vaja: getComputedStyle(document.getElementById('trainer')).display === 'block',
  };
})()`;

async function korak5B(b, sirina) {
  const dotik = sirina < 500;
  console.log(`\nKorak 5, popravek B – »↑ Na vrh« na dnu vaje, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await b.odpri('trening/index.html', { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  await b.izvedi(SEME(20261011));
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  const modes = await b.izvedi('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([k]) => k)');
  const primeri = [...modes.map(m => [m, 'spoznaj']), ...['naked-single', 'hidden-pair', 'swordfish', 'xy-chain'].map(m => [m, 'uganka']), ['naked-pair', 'konec']];
  for (const [mode, nacin] of primeri) {
    const ime = nacin === 'konec' ? 'Končano!' : `${nacin === 'uganka' ? 'Vadi v uganki' : 'Spoznaj'} ${mode}`;
    await vstopi(b, mode, nacin === 'uganka' ? 'uganka' : 'spoznaj', dotik);
    if (nacin === 'uganka') { await b.cakaj('vadi !== null', 15000); await pocakaj(b); }
    if (nacin === 'konec') await b.izvedi('exNum = MAX_EX; renderExercise(); true');
    // Pravo drsenje do konca strani (poteg prsta / kolesce).
    for (let i = 0; i < 30; i++) {
      const st = await b.izvedi('({ y: window.scrollY, maks: document.documentElement.scrollHeight - innerHeight })');
      if (st.y >= st.maks) break;
      if (dotik) await b.cdp.poslji('Input.synthesizeScrollGesture', { x: Math.round(sirina / 2), y: 500, yDistance: -3000, speed: 6000 });
      else await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(sirina / 2), y: 400, deltaX: 0, deltaY: 3000 });
      await b.izvedi(MIRUJE);
    }
    const m = await b.izvedi(DNO_B);
    preveri(`${ime}: »← Nazaj na izbiro« in »↑ Na vrh« v isti vrstici`,
      J(m.napisa) === J(['← Nazaj na izbiro', '↑ Na vrh']) && m.isti && m.razred === 'dno-vaje' && Math.abs(m.n.vrh - m.v.vrh) < 0.5 && Math.abs(m.n.dno - m.v.dno) < 0.5, m);
    preveri(`${ime}: »↑ Na vrh« desno (${Math.round(m.v.levo - m.n.desno)} px razmika), ob desnem robu vrstice`,
      m.v.levo >= m.n.desno + 7.5 && Math.abs(m.v.desno - m.vrstica.desno) < 0.5, m);
    preveri(`${ime}: oba istega videza kot zgornji »Nazaj na izbiro«, ni plavajoč (${Math.round(m.v.sirina)} × ${Math.round(m.v.visina)} px)`,
      m.razlikeN.length === 0 && m.razlikeV.length === 0 && m.v.visina >= 24, { n: m.razlikeN, v: m.razlikeV });
    // Stran, krajša od okna (»Končano!« pri 375 px), se ne pomakne – takrat je scrollY 0.
    preveri(`${ime}: v širini strani, brez preliva; na dnu strani (${m.scrollY} od ${m.maks} px) oba v oknu; okrogel »↑« skrit`,
      m.n.levo >= 0 && m.v.desno <= m.sirinaStrani && !m.preliv && m.v.vrh >= 0 && m.v.dno <= m.okno && !m.plavajoc && m.scrollY === Math.max(0, m.maks), m);
    if (mode === 'x-wing' && dotik) await b.posnetek(path.join(mapa, `dno-vrstica-${sirina}.png`), { vsaStran: false });
    if (mode === modes[0] || nacin !== 'spoznaj') {
      meritve5.push(`B ${ime}, ${sirina} px: Nazaj ${Math.round(m.n.levo)}–${Math.round(m.n.desno)}, Na vrh ${Math.round(m.v.levo)}–${Math.round(m.v.desno)} px (stran ${m.sirinaStrani} px)`);
    }
    // Pravi dotik/klik »↑ Na vrh« → stran na vrhu, vaja ostane.
    if (dotik) await b.tapni('#naVrhDno'); else await b.klikni('#naVrhDno');
    await b.izvedi(MIRUJE);
    const po = await b.izvedi(DNO_B);
    preveri(`${ime}: ${dotik ? 'dotik' : 'klik'} »↑ Na vrh« → stran na vrhu, vaja ostane`, po.scrollY === 0 && po.vaja && !po.plavajoc, { scrollY: po.scrollY, vaja: po.vaja });
    await b.izvedi('nazajNaIzbiro(); true');
  }
}

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (tece(1)) for (const s of [375, 1280]) await korak1(b, s);
    if (tece(2)) {
      for (const s of [320, 375, 1280]) await korak2(b, s);
      console.log('\nD3 – meritev kazala in »↑«:');
      for (const v of d3) console.log('  ' + v);
    }
    if (tece(3)) {
      for (const s of [320, 375, 1280]) await korak3(b, s);
      await korak3D1(b);
      console.log('\nD3 – meritev okna Pomoč:');
      for (const v of d3pomoc) console.log('  ' + v);
    }
    if (tece(4)) {
      await korak4Glava(b);
      for (const s of [375, 1280]) await korak4Pari(b, s);
      await korak4Nazaj(b);
      await korak4File(b);
      console.log('\nKorak 4 – meritve:');
      for (const v of meritve4) console.log('  ' + v);
    }
    if (tece(5)) {
      for (const s of [320, 375, 1280]) await korak5A(b, s);
      for (const s of [320, 375, 1280]) await korak5B(b, s);
      console.log('\nKorak 5 – meritve:');
      for (const v of meritve5) console.log('  ' + v);
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } catch (e) {
    console.error(e);
    napak++;
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  process.exit(napak ? 1 : 0);
})();
