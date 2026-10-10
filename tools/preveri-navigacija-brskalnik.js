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
//   node tools/preveri-navigacija-brskalnik.js [--korak 1] [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-navigacija'));
const korak = Number(arg('--korak', '1'));

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

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (korak >= 1) for (const s of [375, 1280]) await korak1(b, s);
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
