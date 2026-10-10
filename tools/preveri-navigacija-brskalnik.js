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
//     brez preliva, ime v title in aria-label, barve = značka ravni na kartici, oznake vsaj 32 px visoke
//     (D3 – mere izpiše na koncu); pravi dotik/klik vsake oznake: kartica 12 px pod vrhom okna (ali stran do
//     konca), vaja se ne začne, fokus na »Spoznaj«; pri prefers-reduced-motion pomik takoj;
//   - gumb »↑«: na vrhu in po natanko enem zaslonu skrit, po pravem drsenju (poteg prsta / kolesce) viden,
//     44 × 44 px, okrogel, 16 px od desnega roba; drsenje po vsem meniju po 20 px – viden natanko po pravilu
//     in ne prekrije gumbov »Spoznaj« / »Vadi v uganki« (pravokotniki, najmanjši razmik izpiše); pravi
//     dotik/klik → vrh, skrit, fokus na kazalu; v vaji (»Spoznaj« 13, »Vadi v uganki« 8, pomaknjeni do
//     konca) skrit; po »Nazaj na izbiro« (zgornji in spodnji) na položaj nižje od zaslona viden brez
//     drsenja, blizu vrha skrit; posnetka meni-kazalo-<širina>.png in meni-na-vrh-<širina>.png (320, 375).
// --korak N požene korake 1 … N (privzeto 2).
//
//   node tools/preveri-navigacija-brskalnik.js [--korak N] [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-navigacija'));
const korak = Number(arg('--korak', '2'));

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
    'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'height', 'width', 'display'];
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
  const nav = document.getElementById('kazaloTehnik'), gumbi = [...nav.querySelectorAll('button')], y = window.scrollY;
  const kartice = [...document.querySelectorAll('#menu .menu-card')];
  const meni = document.getElementById('menu').getBoundingClientRect(), r = nav.getBoundingClientRect();
  const pr = g => g.getBoundingClientRect();
  return {
    oznake: gumbi.map(g => g.textContent), kljuci: gumbi.map(g => g.dataset.kazalo), kartice: kartice.map(k => k.dataset.mode),
    naslovi: gumbi.map(g => g.title), aria: gumbi.map(g => g.getAttribute('aria-label')), tip: gumbi.map(g => g.type),
    visine: gumbi.map(g => pr(g).height), sirine: gumbi.map(g => pr(g).width),
    navVisina: r.height, navDno: r.bottom + y, prvaVrh: kartice[0].getBoundingClientRect().top + y,
    glavaDno: document.querySelector('header.top').getBoundingClientRect().bottom + y,
    vMeniju: gumbi.every(g => pr(g).left >= meni.left - 0.5 && pr(g).right <= meni.right + 0.5),
    vrstice: new Set(gumbi.map(g => Math.round(pr(g).top))).size,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    pisava: getComputedStyle(gumbi[0]).fontSize + ' ' + getComputedStyle(gumbi[0]).fontFamily.split(',')[0],
    barve: gumbi.map(g => { const s = getComputedStyle(g), z = getComputedStyle(document.querySelector('.menu-card[data-mode="' + g.dataset.kazalo + '"] .badge'));
      return { oznaka: g.textContent, bg: s.backgroundColor, c: s.color, zbg: z.backgroundColor, zc: z.color }; }),
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
  preveri('kazalo: gumbi (type=button), ime v title in aria-label (»4 · Skriti par (Hidden Pair)«)',
    k.tip.every(t => t === 'button') && k.naslovi.every((t, i) => t.startsWith(OZN[i] + ' · ') && t.includes('(') && k.aria[i] === t), k.naslovi);
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
    const izb = `#kazaloTehnik button:nth-child(${i + 1})`;
    if (dotik) await b.tapni(izb); else await b.klikni(izb);
    await b.izvedi(MIRUJE);
    const s = await b.izvedi(`(() => { const m = document.querySelectorAll('#kazaloTehnik button')[${i}].dataset.kazalo;
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
  preveri(`»↑«: 44 × 44 px, okrogel, 16 px od desnega roba, v oknu (${g.levo}–${g.desno}, ${g.vrh}–${g.dno})`,
    g.sirina === 44 && g.visina === 44 && g.radij === '50%' && Math.abs(g.oknoSirina - g.desno - 16) <= 0.5 && g.dno <= g.okno && g.vrh >= 0, g);
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

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (korak >= 1) for (const s of [375, 1280]) await korak1(b, s);
    if (korak >= 2) {
      for (const s of [320, 375, 1280]) await korak2(b, s);
      console.log('\nD3 – meritev kazala in »↑«:');
      for (const v of d3) console.log('  ' + v);
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
