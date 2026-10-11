'use strict';
// Naloga 6b »Pripomočki za uporabo« (docs/naloga6b-nacrt.md) v pravem brskalniku; raste po korakih.
//
// Korak 1 (O1–O3) – trening, prehod med načinoma, pri 320, 375 (posnemanje telefona, pravi dotik) in 1280 px (miška):
//   - zgornja vrstica vaje: levo »← Nazaj na izbiro«, desno »↔ Vadi v uganki« (v »Spoznaj«) oziroma »↔ Spoznaj«
//     (v »Vadi v uganki«) – v eni vrstici, kadar gresta vanjo (širini + 8 px ≤ širina vrstice), sicer drugi v novi
//     vrstici 8 px nižje, desno (popravek P1 = A); enako visoka kot spodnji »Nazaj na izbiro« (napis se ne prelomi),
//     istega videza (izračunan slog), desni ob desnem robu vrstice, razmik vsaj 8 px, oba v širini strani, brez
//     preliva; pisava gumba je Inter (znak »↔« v pisavi);
//   - vseh 15 tehnik v obeh smereh s pravim dotikom/klikom: nov krog iste tehnike v drugem načinu, vaja 1, rezultat
//     0 / 0, stran na vrhu, meni skrit; iz »Vadi v uganki« pri lihih tehnikah med »Iščem vajo …« (iskanje prekinjeno –
//     po 1,5 s je vaja še »Spoznaj«), pri sodih po najdeni vaji; nato pravi dotik/klik zgornjega »Nazaj na izbiro« –
//     meni na položaju ob odhodu iz menija, kartica tehnike v oknu;
//   - »Končano!«: gumb je v vrstici in začne krog v drugem načinu;
//   - posnetki vrh-vaje-<širina>-<način>.png (320, 375, 1280; »Spoznaj« in »Vadi v uganki«); brez napak JS.
// --korak N požene korake 1 … N (privzeto 1), --samo N samo korak N.
//
//   node tools/preveri-naloga6b-brskalnik.js [--korak N | --samo N] [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-naloga6b'));
const korak = Number(arg('--korak', '1'));
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
const pritisni = (b, izb, dotik) => (dotik ? b.tapni(izb) : b.klikni(izb));

// ---------- Korak 1 – prehod med načinoma ----------
const VRH = `(() => {
  const n = document.getElementById('backBtn'), d = document.getElementById('drugiNacin'), vr = n.parentElement, r = e => e.getBoundingClientRect();
  const LAST = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
    'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'height', 'position', 'display'];
  const sn = getComputedStyle(n), sd = getComputedStyle(d);
  return {
    napisa: [n.textContent, d.textContent], isti: vr === d.parentElement, razred: vr.className,
    nadRezultatom: r(vr).bottom <= r(document.querySelector('.score-bar')).top,
    n: { vrh: r(n).top, dno: r(n).bottom, levo: r(n).left, desno: r(n).right, sirina: r(n).width, visina: r(n).height },
    d: { vrh: r(d).top, dno: r(d).bottom, levo: r(d).left, desno: r(d).right, sirina: r(d).width, visina: r(d).height },
    vrstica: { levo: r(vr).left, desno: r(vr).right }, visinaDno: r(document.getElementById('backBtnDno')).height,
    razlike: LAST.filter(l => sn[l] !== sd[l]).map(l => l + ': ' + sn[l] + ' → ' + sd[l]),
    inter: document.fonts.check('15px Inter', '↔'),
    sirinaStrani: document.documentElement.clientWidth, preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
})()`;
const STANJE = `({ mode, nacin, exNum, scoreRight, scoreTotal, scrollY: window.scrollY,
  rezultat: document.getElementById('scoreRight').textContent + ' / ' + document.getElementById('scoreTotal').textContent,
  meni: getComputedStyle(document.getElementById('menu')).display, trener: getComputedStyle(document.getElementById('trainer')).display,
  vadi: vadi !== null, uganka: !!document.querySelector('#exerciseArea .vaja-uganka'), isce: /Iščem vajo/.test(document.getElementById('exerciseArea').textContent),
  menuPolozaj })`;
const meritve1 = [];

function vrstica(ime, m, napis) {
  // Ena vrstica, kadar gumba gresta vanjo z razmikom 8 px; sicer drugi v novi vrstici, desno (P1 = A).
  const ena = m.n.sirina + 8 + m.d.sirina <= m.vrstica.desno - m.vrstica.levo + 0.5;
  preveri(`${ime}: »← Nazaj na izbiro« levo, »${napis}« desno, ${ena ? 'v isti vrstici' : 'v novi vrstici 8 px nižje'} nad rezultatom`,
    JSON.stringify(m.napisa) === JSON.stringify(['← Nazaj na izbiro', napis]) && m.isti && m.razred === 'vrh-vaje' && m.nadRezultatom
      && (ena ? Math.abs(m.n.vrh - m.d.vrh) < 0.5 && Math.abs(m.n.dno - m.d.dno) < 0.5 : Math.abs(m.d.vrh - m.n.dno - 8) < 0.5), m);
  preveri(`${ime}: enako visoka kot spodnji »Nazaj« (napis ni prelomljen), istega videza (${Math.round(m.n.sirina)} in ${Math.round(m.d.sirina)} × ${Math.round(m.d.visina)} px), pisava Inter`,
    m.razlike.length === 0 && m.d.visina >= 24 && Math.abs(m.n.visina - m.visinaDno) < 0.5 && m.inter, { razlike: m.razlike, inter: m.inter, visina: m.n.visina, visinaDno: m.visinaDno });
  preveri(`${ime}: desni ob desnem robu vrstice${ena ? `, razmik ${Math.round(m.d.levo - m.n.desno)} px (vsaj 8)` : ''}, v širini strani, brez preliva`,
    Math.abs(m.d.desno - m.vrstica.desno) < 0.5 && Math.abs(m.n.levo - m.vrstica.levo) < 0.5 && (!ena || m.d.levo - m.n.desno >= 7.5)
      && m.n.levo >= 0 && m.d.desno <= m.sirinaStrani && !m.preliv, m);
  return ena;
}

async function vstopi(b, mode, dotik) {
  await b.izvedi(`document.querySelector('.menu-card[data-mode="${mode}"]').scrollIntoView({ block: 'center' }); true`);
  await pritisni(b, `.menu-card[data-mode="${mode}"] .nacin-btn:not(.vadi)`, dotik);
  await pocakaj(b, 200);
  return b.izvedi('menuPolozaj');
}

async function korak1(b, sirina) {
  const dotik = sirina < 500;
  console.log(`\nKorak 1 – prehod med načinoma, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await b.odpri('trening/index.html', { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  await b.izvedi(SEME(20261011));
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  const modes = await b.izvedi('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([k]) => k)');
  for (const [i, mode] of modes.entries()) {
    const polozaj = await vstopi(b, mode, dotik);
    let m = await b.izvedi(VRH);
    let ena = vrstica(`Spoznaj ${mode}`, m, '↔ Vadi v uganki');
    if (i === 0) meritve1.push(`${sirina} px, Spoznaj: Nazaj ${Math.round(m.n.levo)}–${Math.round(m.n.desno)} × ${Math.round(m.n.visina)}, drugi način ${Math.round(m.d.levo)}–${Math.round(m.d.desno)} × ${Math.round(m.d.visina)} px, ${ena ? `razmik ${Math.round(m.d.levo - m.n.desno)} px` : `v novi vrstici ${Math.round(m.d.vrh - m.n.dno)} px nižje`} (stran ${m.sirinaStrani} px)`);
    if (mode === 'hidden-pair') await b.posnetek(path.join(mapa, `vrh-vaje-${sirina}-spoznaj.png`), { vsaStran: false });

    // Sredi kroga (vaja 3, rezultat 2 / 3), stran pomaknjena – pravi dotik/klik → »Vadi v uganki«.
    await b.izvedi('exNum = 2; scoreRight = 2; scoreTotal = 3; updateScore(); renderExercise(); window.scrollTo(0, 0); true');
    await pritisni(b, '#drugiNacin', dotik);
    await pocakaj(b, 100);
    let s = await b.izvedi(STANJE);
    preveri(`Spoznaj ${mode}: ${dotik ? 'dotik' : 'klik'} → Vadi v uganki iste tehnike, vaja 1, rezultat 0 / 0, vrh strani, meni skrit`,
      s.mode === mode && s.nacin === 'uganka' && s.exNum === 0 && s.scoreTotal === 0 && s.rezultat === '0 / 0' && s.scrollY === 0
        && s.meni === 'none' && s.trener === 'block' && s.menuPolozaj === polozaj, s);
    const medIskanjem = i % 2 === 0;
    if (!medIskanjem) { await b.cakaj('vadi !== null', 15000); await pocakaj(b, 100); }
    m = await b.izvedi(VRH);
    ena = vrstica(`Vadi v uganki ${mode}${medIskanjem ? ' (Iščem vajo …)' : ''}`, m, '↔ Spoznaj');
    if (i === 0) meritve1.push(`${sirina} px, Vadi v uganki: drugi način ${Math.round(m.d.levo)}–${Math.round(m.d.desno)} × ${Math.round(m.d.visina)} px, ${ena ? `razmik ${Math.round(m.d.levo - m.n.desno)} px` : `v novi vrstici ${Math.round(m.d.vrh - m.n.dno)} px nižje`}`);
    if (mode === 'hidden-pair') await b.posnetek(path.join(mapa, `vrh-vaje-${sirina}-uganka.png`), { vsaStran: false });

    // Nazaj v »Spoznaj« (pri lihih med iskanjem – iskanje se prekine).
    await pritisni(b, '#drugiNacin', dotik);
    await pocakaj(b, medIskanjem ? 1500 : 100);
    s = await b.izvedi(STANJE);
    preveri(`Vadi v uganki ${mode}: ${dotik ? 'dotik' : 'klik'} → Spoznaj iste tehnike, vaja 1${medIskanjem ? ', iskanje prekinjeno (po 1,5 s še »Spoznaj«)' : ''}`,
      s.mode === mode && s.nacin === 'spoznaj' && s.exNum === 0 && s.rezultat === '0 / 0' && !s.vadi && !s.uganka && !s.isce && s.scrollY === 0, s);

    // Zgornji »Nazaj na izbiro« → meni na položaju ob odhodu iz menija.
    await pritisni(b, '#backBtn', dotik);
    await pocakaj(b);
    const k = await b.izvedi(`(() => { const r = document.querySelector('.menu-card[data-mode="${mode}"]').getBoundingClientRect();
      return { meni: getComputedStyle(document.getElementById('menu')).display, scrollY: window.scrollY, vOknu: r.top >= 0 && r.bottom <= innerHeight }; })()`);
    preveri(`${mode}: »Nazaj na izbiro« po prehodu – meni na ${polozaj} px, kartica v oknu`, k.meni === 'block' && k.scrollY === polozaj && k.vOknu, k);
  }
  // »Končano!« – gumb v vrstici, začne krog v drugem načinu.
  await vstopi(b, 'naked-pair', dotik);
  await b.izvedi('exNum = MAX_EX; renderExercise(); true');
  vrstica('Končano!', await b.izvedi(VRH), '↔ Vadi v uganki');
  await pritisni(b, '#drugiNacin', dotik);
  await pocakaj(b, 100);
  const s = await b.izvedi(STANJE);
  preveri(`Končano!: ${dotik ? 'dotik' : 'klik'} → Vadi v uganki, vaja 1`, s.mode === 'naked-pair' && s.nacin === 'uganka' && s.exNum === 0, s);
  await b.izvedi('nazajNaIzbiro(); true');
}

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (tece(1)) {
      for (const s of [320, 375, 1280]) await korak1(b, s);
      console.log('\nKorak 1 – meritve:');
      for (const v of meritve1) console.log('  ' + v);
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } catch (e) {
    console.error(e);
    napak++;
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})();
