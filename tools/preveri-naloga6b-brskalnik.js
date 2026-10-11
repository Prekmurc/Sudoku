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
//
// Korak 2 (O4–O6, O12, O13; 2.5) – trening, kazalo tehnik s seznamom in zadnja tehnika, pri 320, 375 (dotik) in 1280 px (miška):
//   - kazalo: razred z-imeni, 15 vrstic (gumb .kazalo-vrstica) v vrstnem redu kartic; slovensko ime, angleško ime in
//     aria-label iz virov (imeTehnike(), TEHNIKE_OPISI), brez title; 1, 1 in 2 stolpca – pri dveh levo E1–6, desno 7–13;
//     nobeno ime odrezano (scrollWidth) ali prelomljeno, vrstice vsaj 44 px, oznake vsaj 36 × 32 px v barvi značke
//     ravni, slovensko krepko, kontrast angleškega vsaj 4,5 : 1; pod glavo, nad prvo kartico, v širini menija, brez
//     preliva; pravi dotik/klik vsake vrstice – kartica 12 px pod vrhom okna (ali stran do konca), vaja se ne začne,
//     fokus na »Spoznaj«;
//   - zadnja tehnika: ob prvem odprtju brez oznake; po krogu 11 in »Nazaj na izbiro« okvir natanko na kartici in vrstici
//     11 (obroba 1 px in senca 1 px rgb(74, 134, 216), kontrast vsaj 3 : 1 na podlagi), višine kartic enake, kartica v
//     oknu, aria-label s pripisom; pri 1280 px miška na kartici 10 – ta turkizna, 11 modra; miška na 11 in na vrstici –
//     ostane modra; »Vadi v uganki« 3 premakne okvir, ključ sudoku.trening.zadnja; ponovno odprta stran (3 in 11) – meni
//     na vrhu, okvir na kartici in vrstici, mesto vrstice izpiše; neznan ključ – nič;
//   - okno Pomoč igre, reševalca in treninga (375, 1280 px): kazalo tehnik enako izhodišču (--izhodisce, privzeto
//     e52f994 – pred korakom 2; drevo, HTML, vsi izračunani slogi, položaji glede na kazalo), pri igri in reševalcu
//     vse okno; posnetki kazalo-, zadnja-, ponovno-<širina>.png; brez napak JS.
// --korak N požene korake 1 … N (privzeto 2), --samo N samo korak N.
//
//   node tools/preveri-naloga6b-brskalnik.js [--korak N | --samo N] [--mapa <mapa>] [--izhodisce <commit>]
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
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-naloga6b'));
const korak = Number(arg('--korak', '2'));
const izhodisce = arg('--izhodisce', 'e52f994');
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

// ---------- Korak 2 – kazalo tehnik s seznamom in zadnja tehnika ----------
const J = JSON.stringify;
const ZADNJA = 'sudoku.trening.zadnja';
const OZN = ['E1', 'E2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const MODRA = 'rgb(74, 134, 216)'; // --izbira
const MIRUJE = `new Promise(r => { let prej = -1, enako = 0; const t = () => {
  if (window.scrollY === prej) { if (++enako >= 4) return r(window.scrollY); } else { enako = 0; prej = window.scrollY; }
  setTimeout(t, 60); }; setTimeout(t, 60); })`;
// Kontrast dveh barv »rgb(r, g, b)« (WCAG).
function kontrast(a, b) {
  const L = s => {
    const [r, g, bl] = s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const KAZALO = `(() => {
  const nav = document.getElementById('kazaloTehnik'), vr = [...nav.children], r = e => e.getBoundingClientRect(), y = window.scrollY;
  const kartice = [...document.querySelectorAll('#menu .menu-card')], meni = r(document.getElementById('menu'));
  const levi = [...new Set(vr.map(v => Math.round(r(v).left)))].sort((a, b) => a - b);
  const imena = v => [...v.querySelectorAll('.si, .en')];
  const s = e => getComputedStyle(e);
  return {
    razred: nav.className, tip: vr.map(v => v.tagName + ':' + v.type + ':' + v.className.replace(' zadnja', '')),
    kljuci: vr.map(v => v.dataset.kazalo), kartice: kartice.map(k => k.dataset.mode),
    oznake: vr.map(v => v.querySelector('.tag').textContent), si: vr.map(v => v.querySelector('.si').textContent),
    en: vr.map(v => v.querySelector('.en').textContent), aria: vr.map(v => v.getAttribute('aria-label')), title: vr.map(v => v.title),
    imeVir: vr.map(v => imeTehnike(TEHNIKA_VAJE[v.dataset.kazalo], { anglesko: false })),
    enVir: vr.map(v => TEHNIKE_OPISI[v.dataset.kazalo].anglesko),
    ariaVir: vr.map(v => imeTehnike(TEHNIKA_VAJE[v.dataset.kazalo], { stevilka: true })),
    stolpec: vr.map(v => levi.indexOf(Math.round(r(v).left))), stolpcev: levi.length,
    visine: vr.map(v => r(v).height), sirinaStolpca: r(vr[0]).width,
    odrezana: vr.flatMap(v => imena(v).filter(e => e.scrollWidth > e.clientWidth + 0.5 || r(e).right > r(v).right + 0.5).map(e => e.textContent)),
    prelomljena: vr.flatMap(v => imena(v).filter(e => r(e).height > parseFloat(s(e).lineHeight) * 1.5).map(e => e.textContent)),
    najsirse: Math.max(...vr.flatMap(v => imena(v).map(e => e.scrollWidth))),
    vMeniju: vr.every(v => r(v).left >= meni.left - 0.5 && r(v).right <= meni.right + 0.5),
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    barve: vr.map(v => { const t = s(v.querySelector('.tag')), z = s(document.querySelector('.menu-card[data-mode="' + v.dataset.kazalo + '"] .badge'));
      return t.backgroundColor === z.backgroundColor && t.color === z.color ? null : v.dataset.kazalo; }).filter(Boolean),
    oznakaMere: vr.map(v => r(v.querySelector('.tag'))).map(q => Math.round(q.width) + '×' + Math.round(q.height)),
    pisava: [s(vr[0].querySelector('.si')).fontWeight, s(vr[0].querySelector('.si')).fontSize, s(vr[0].querySelector('.en')).fontSize, s(vr[0].querySelector('.en')).color],
    navVisina: r(nav).height, navDno: r(nav).bottom + y, navVrh: r(nav).top + y, prvaVrh: r(kartice[0]).top + y,
    glavaDno: r(document.querySelector('header.top')).bottom + y, strani: document.documentElement.scrollHeight,
    zadnjeK: kartice.filter(k => k.classList.contains('zadnja')).map(k => k.dataset.mode),
    zadnjeV: vr.filter(v => v.classList.contains('zadnja')).map(v => v.dataset.kazalo),
    visineKartic: kartice.map(k => r(k).height),
  };
})()`;
// Okvir elementa (izračunan slog), podlaga (lastna ali prvega prednika z barvo) in položaj v oknu.
const OKVIR = izb => `(() => { const e = document.querySelector(${J(izb)}), s = getComputedStyle(e), r = e.getBoundingClientRect();
  let p = e, podlaga = 'rgba(0, 0, 0, 0)';
  while (p && (podlaga === 'rgba(0, 0, 0, 0)' || podlaga === 'transparent')) { podlaga = getComputedStyle(p).backgroundColor; p = p.parentElement; }
  return { barva: s.borderTopColor, sirina: s.borderTopWidth, senca: s.boxShadow, podlaga,
    vrh: r.top, dno: r.bottom, okno: innerHeight, aria: e.getAttribute('aria-label') }; })()`;
const meritve2 = [];

async function korak2(b, sirina) {
  const dotik = sirina < 500, odpri = () => b.odpri('trening/index.html', { sirina, visina: dotik ? 667 : 800, mobilno: dotik });
  console.log(`\nKorak 2 – kazalo tehnik s seznamom in zadnja tehnika, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await odpri();
  await b.izvedi(`localStorage.removeItem(${J(ZADNJA)}); true`);
  await odpri();
  await b.izvedi(SEME(20261012));
  await b.cakaj('document.fonts.status === "loaded"', 15000);

  // Seznam: vsebina iz virov, stolpci, vrstni red po stolpcih, imena cela.
  const k = await b.izvedi(KAZALO);
  const stolpcev = sirina < 500 ? 1 : 2;
  preveri('kazalo: razred z-imeni, 15 vrstic (gumb .kazalo-vrstica) v vrstnem redu kartic, oznake E1 … 13',
    k.razred === 'kazalo-tehnik z-imeni' && k.tip.every(t => t === 'BUTTON:button:kazalo-vrstica') && J(k.kljuci) === J(k.kartice) && J(k.oznake) === J(OZN), k);
  preveri('kazalo: slovensko ime = imeTehnike(…, { anglesko: false }), angleško = TEHNIKE_OPISI, aria-label = imeTehnike(…, { stevilka: true }), brez title',
    J(k.si) === J(k.imeVir) && J(k.en) === J(k.enVir) && J(k.aria) === J(k.ariaVir) && k.title.every(t => t === ''), k);
  preveri(`kazalo: ${stolpcev} ${stolpcev === 1 ? 'stolpec' : 'stolpca – levo E1–6, desno 7–13'}`,
    k.stolpcev === stolpcev && (stolpcev === 1 ? k.stolpec.every(x => x === 0) : J(k.stolpec) === J([...Array(8).fill(0), ...Array(7).fill(1)])), k.stolpec);
  preveri(`kazalo: nobeno ime odrezano ali prelomljeno (najširše ${k.najsirse} px, stolpec ${Math.round(k.sirinaStolpca)} px)`,
    k.odrezana.length === 0 && k.prelomljena.length === 0, { odrezana: k.odrezana, prelomljena: k.prelomljena });
  preveri(`kazalo: vrstice vsaj 44 px (${Math.min(...k.visine)}–${Math.max(...k.visine)}), oznake ${[...new Set(k.oznakaMere)].join(', ')} px, barve = značka ravni`,
    Math.min(...k.visine) >= 44 && k.oznakaMere.every(m => +m.split('×')[1] >= 32 && +m.split('×')[0] >= 36) && k.barve.length === 0, { barve: k.barve, mere: k.oznakaMere });
  const kEn = kontrast(k.pisava[3], 'rgb(255, 255, 255)');
  preveri(`kazalo: slovensko krepko (${k.pisava[0]}, ${k.pisava[1]}), angleško ${k.pisava[2]}, kontrast angleškega ${kEn.toFixed(2)} : 1 (vsaj 4,5)`,
    +k.pisava[0] >= 700 && kEn >= 4.5, k.pisava);
  preveri(`kazalo: pod glavo, nad prvo kartico, v širini menija, brez preliva (${Math.round(k.navVisina)} px visoko)`,
    k.navVrh >= k.glavaDno && k.navDno <= k.prvaVrh && k.vMeniju && !k.preliv, k);
  preveri('ob prvem odprtju (brez ključa) nobena kartica in vrstica nista označeni', k.zadnjeK.length === 0 && k.zadnjeV.length === 0, k);
  meritve2.push(`${sirina} px: kazalo ${Math.round(k.navVisina)} px (vrh ${Math.round(k.navVrh)}), ${k.stolpcev} ${k.stolpcev === 1 ? 'stolpec' : 'stolpca'} po ${Math.round(k.sirinaStolpca)} px, vrstice ${Math.min(...k.visine)} px, najširše ime ${k.najsirse} px, prva kartica ${Math.round(k.prvaVrh)} px, stran ${k.strani} px`);
  await b.posnetek(path.join(mapa, `kazalo-${sirina}.png`), { vsaStran: false });

  // Pravi dotik/klik vsake vrstice → kartica 12 px pod vrhom okna (ali stran do konca), vaja se ne začne, fokus »Spoznaj«.
  const odmiki = [];
  for (const [i, o] of OZN.entries()) {
    await b.izvedi('window.scrollTo(0, 0); true');
    await pritisni(b, `#kazaloTehnik button:nth-child(${i + 1})`, dotik);
    await b.izvedi(MIRUJE);
    const s = await b.izvedi(`(() => { const m = document.getElementById('kazaloTehnik').children[${i}].dataset.kazalo;
      const k = document.querySelector('.menu-card[data-mode="' + m + '"]'), r = k.getBoundingClientRect();
      return { m, vrh: r.top, dno: r.bottom, okno: innerHeight, scrollY: window.scrollY, maks: document.documentElement.scrollHeight - innerHeight,
        mode, meni: getComputedStyle(document.getElementById('menu')).display, fokus: document.activeElement === k.querySelector('.nacin-btn') }; })()`);
    const naVrhu = Math.abs(s.vrh - 12) <= 1, doKonca = Math.abs(s.scrollY - s.maks) <= 1 && s.vrh >= 0 && s.dno <= s.okno;
    odmiki.push(naVrhu ? '12 px' : `${o} do konca`);
    preveri(`${dotik ? 'dotik' : 'klik'} vrstice ${o}: kartica ${s.m} 12 px pod vrhom okna ali stran do konca, vaja se ne začne, fokus na »Spoznaj«`,
      (naVrhu || doKonca) && s.mode === null && s.meni === 'block' && s.fokus, s);
  }
  console.log(`  položaj kartice po pomiku: ${[...new Set(odmiki)].join(', ')}`);

  // Zadnja tehnika: krog 11 · XY-krilo, »Nazaj na izbiro« – natanko ena kartica in ena vrstica z okvirjem.
  await b.izvedi('window.scrollTo(0, 0); true');
  await pritisni(b, '.menu-card[data-mode="xy-wing"] .nacin-btn:not(.vadi)', dotik);
  await pocakaj(b, 200);
  await pritisni(b, '#backBtn', dotik);
  await pocakaj(b, 300);
  let z = await b.izvedi(KAZALO);
  preveri('po »Nazaj na izbiro« iz 11: okvir natanko na kartici in vrstici xy-wing', J(z.zadnjeK) === J(['xy-wing']) && J(z.zadnjeV) === J(['xy-wing']), z);
  preveri('višine kartic z okvirjem in brez enake (brez premika vsebine)', J(z.visineKartic) === J(k.visineKartic), { prej: k.visineKartic, zdaj: z.visineKartic });
  const kk = await b.izvedi(OKVIR('.menu-card[data-mode="xy-wing"]')), kv = await b.izvedi(OKVIR('#kazaloTehnik [data-kazalo="xy-wing"]'));
  for (const [ime, o] of [['kartica', kk], ['vrstica', kv]]) {
    preveri(`${ime}: obroba 1 px in senca 1 px ${o.barva} (--izbira), kontrast ${kontrast(MODRA, o.podlaga).toFixed(2)} : 1 na ${o.podlaga} (vsaj 3)`,
      o.barva === MODRA && o.sirina === '1px' && o.senca === `${MODRA} 0px 0px 0px 1px` && kontrast(MODRA, o.podlaga) >= 3, o);
  }
  preveri(`kartica 11 v oknu (${Math.round(kk.vrh)}–${Math.round(kk.dno)} od ${kk.okno} px)`, kk.vrh >= 0 && kk.dno <= kk.okno, kk);
  preveri('vrstica 11: aria-label s pripisom »– nazadnje vadena«', kv.aria === '11 · XY-krilo (XY-Wing, Y-Wing) – nazadnje vadena', kv.aria);
  meritve2.push(`${sirina} px: po »Nazaj« iz 11 kartica na ${Math.round(kk.vrh)}–${Math.round(kk.dno)} px okna; kontrast okvirja ${kontrast(MODRA, kk.podlaga).toFixed(2)} (kartica), ${kontrast(MODRA, kv.podlaga).toFixed(2)} (vrstica)`);
  if (!dotik) {
    // Okvir se loči od poudarka pod miško (turkizen): miška na sosednji kartici, nato na zadnji in na vrstici.
    const na = async izb => {
      const t = await b.izvedi(`(() => { const r = document.querySelector(${J(izb)}).getBoundingClientRect(); return { x: r.left + 20, y: r.top + 10 }; })()`);
      await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
      await pocakaj(b, 250);
    };
    await na('.menu-card[data-mode="w-wing"]');
    const sosed = await b.izvedi(OKVIR('.menu-card[data-mode="w-wing"]')), zad = await b.izvedi(OKVIR('.menu-card[data-mode="xy-wing"]'));
    preveri(`miška na kartici 10: ta turkizna (${sosed.barva}), kartica 11 modra`, sosed.barva === 'rgb(14, 122, 122)' && zad.barva === MODRA, { sosed, zad });
    await b.posnetek(path.join(mapa, `zadnja-${sirina}.png`), { vsaStran: false });
    await na('.menu-card[data-mode="xy-wing"]');
    const pod = await b.izvedi(OKVIR('.menu-card[data-mode="xy-wing"]'));
    preveri('miška na kartici 11: okvir ostane moder', pod.barva === MODRA && pod.senca === `${MODRA} 0px 0px 0px 1px`, pod);
    await b.izvedi('window.scrollTo(0, 0); true');
    await na('#kazaloTehnik [data-kazalo="xy-wing"]');
    const podV = await b.izvedi(OKVIR('#kazaloTehnik [data-kazalo="xy-wing"]'));
    preveri('miška na vrstici 11: okvir ostane moder', podV.barva === MODRA && podV.senca === `${MODRA} 0px 0px 0px 1px`, podV);
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  } else await b.posnetek(path.join(mapa, `zadnja-${sirina}.png`), { vsaStran: false });

  // Druga tehnika (»Vadi v uganki« 3) – okvir se premakne; ključ v shrambi.
  await b.izvedi('window.scrollTo(0, 0); true');
  await pritisni(b, '.menu-card[data-mode="naked-pair"] .nacin-btn.vadi', dotik);
  await pocakaj(b, 200);
  await pritisni(b, '#backBtn', dotik);
  await pocakaj(b, 300);
  z = await b.izvedi(KAZALO);
  const kljuc = await b.izvedi(`localStorage.getItem(${J(ZADNJA)})`);
  preveri(`»Vadi v uganki« 3: okvir na kartici in vrstici naked-pair, ključ »${kljuc}«`,
    J(z.zadnjeK) === J(['naked-pair']) && J(z.zadnjeV) === J(['naked-pair']) && kljuc === 'naked-pair', { z: [z.zadnjeK, z.zadnjeV], kljuc });

  // Ponovno odprta stran (O6 B): meni na vrhu, okvir na kartici in vrstici; mesto vrstice izpiše (O13 A).
  for (const [mode, oznaka] of [['naked-pair', '3'], ['xy-wing', '11']]) {
    if (mode === 'xy-wing') await b.izvedi(`localStorage.setItem(${J(ZADNJA)}, 'xy-wing'); true`);
    await odpri();
    await b.cakaj('document.fonts.status === "loaded"', 15000);
    z = await b.izvedi(KAZALO);
    const v = await b.izvedi(OKVIR(`#kazaloTehnik [data-kazalo="${mode}"]`));
    const st = await b.izvedi('({ scrollY: window.scrollY, mode, meni: getComputedStyle(document.getElementById("menu")).display })');
    preveri(`ponovno odprta stran (${oznaka}): meni na vrhu, okvir na kartici in vrstici ${mode}, brez preliva`,
      st.scrollY === 0 && st.mode === null && st.meni === 'block' && J(z.zadnjeK) === J([mode]) && J(z.zadnjeV) === J([mode]) && v.barva === MODRA && !z.preliv,
      { st, z: [z.zadnjeK, z.zadnjeV], preliv: z.preliv });
    meritve2.push(`${sirina} px: ponovno odprta stran, vrstica ${oznaka} na ${Math.round(v.vrh)}–${Math.round(v.dno)} px (okno ${v.okno}) – ${v.dno <= v.okno ? 'v oknu' : 'pod oknom'}`);
    if (mode === 'xy-wing') await b.posnetek(path.join(mapa, `ponovno-${sirina}.png`), { vsaStran: false });
  }
  // Neznan ključ – nič, brez napake.
  await b.izvedi(`localStorage.setItem(${J(ZADNJA)}, 'neznana'); true`);
  await odpri();
  z = await b.izvedi(KAZALO);
  preveri('neznan ključ: nobena kartica in vrstica nista označeni', z.zadnjeK.length === 0 && z.zadnjeV.length === 0, z);
}

// Okno Pomoč vseh treh: kazalo tehnik (vrstica oznak) enako izhodišču – drevo, HTML, izračunani slogi in položaji
// glede na kazalo; igra in reševalec še vse okno (HTML in slogi).
const POMOC = [
  { ime: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog', celo: true },
  { ime: 'reševalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog', celo: true },
  { ime: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog', celo: false },
];
async function pomocKazalo(b, a, sirina) {
  await b.odpri(a.stran, { sirina, visina: 800, mobilno: sirina < 500 });
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  await b.klikni(a.gumb);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await b.izvedi('(document.activeElement && document.activeElement.blur && document.activeElement.blur(), new Promise(r => setTimeout(() => r(true), 300)))');
  return b.izvedi(`(() => {
    const okno = document.querySelector(${J(a.okno)}), nav = okno.querySelector('.kazalo-tehnik');
    const slog = e => { const s = getComputedStyle(e); return [...s].filter(p => p !== '-webkit-tap-highlight-color').sort().map(p => p + ':' + s.getPropertyValue(p)).join(';'); };
    const n = nav.getBoundingClientRect();
    const pol = e => { const r = e.getBoundingClientRect(); return [r.left - n.left, r.top - n.top, r.width, r.height].map(v => Math.round(v * 100) / 100).join(','); };
    const vsi = [nav, ...nav.querySelectorAll('*')], celo = [okno, ...okno.querySelectorAll('*')];
    return { drevo: vsi.map(e => e.tagName + '.' + e.className + '[' + (e.title || '') + ']'), html: nav.outerHTML, slogi: vsi.map(slog), polozaji: vsi.map(pol),
      celoHtml: ${a.celo} ? okno.outerHTML : '', celoSlogi: ${a.celo} ? celo.map(slog) : [] };
  })()`);
}
async function korak2Pomoc(b) {
  const nova = {};
  for (const s of [375, 1280]) for (const a of POMOC) nova[`${a.ime} ${s}`] = await pomocKazalo(b, a, s);
  console.log(`\nKorak 2 – okno Pomoč vseh treh enako izhodišču ${izhodisce} (kazalo tehnik; igra in reševalec vse okno)`);
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  try {
    for (const s of [375, 1280]) for (const a of POMOC) {
      const n = nova[`${a.ime} ${s}`], st = await pomocKazalo(bStar, a, s);
      const razSlogi = st.slogi.map((x, i) => (x !== n.slogi[i] ? n.drevo[i] : null)).filter(Boolean);
      const razPol = st.polozaji.map((x, i) => (x !== n.polozaji[i] ? `${n.drevo[i]} ${x} → ${n.polozaji[i]}` : null)).filter(Boolean);
      const razCelo = st.celoSlogi.filter((x, i) => x !== n.celoSlogi[i]).length;
      preveri(`${a.ime}, ${s} px: kazalo tehnik v oknu Pomoč (${n.drevo.length} elementov) – drevo, HTML, slogi, položaji enaki izhodišču${a.celo ? '; vse okno enako' : ''}`,
        J(n.drevo) === J(st.drevo) && n.html === st.html && razSlogi.length === 0 && razPol.length === 0
          && n.celoHtml === st.celoHtml && st.celoSlogi.length === n.celoSlogi.length && razCelo === 0,
        { razSlogi: razSlogi.slice(0, 5), razPol: razPol.slice(0, 5), html: n.html === st.html, celoHtml: n.celoHtml === st.celoHtml, razCelo });
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
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
    if (tece(2)) {
      for (const s of [320, 375, 1280]) await korak2(b, s);
      await korak2Pomoc(b);
      console.log('\nKorak 2 – meritve:');
      for (const v of meritve2) console.log('  ' + v);
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
