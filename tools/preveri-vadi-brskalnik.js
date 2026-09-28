'use strict';
// Trening »Vadi v uganki« (trening/v-uganki.js, docs/vadi-v-uganki-nacrt.md) v pravem
// brskalniku, pri širini 375 in 1200 px: gumba načina na kartici samo z zastavico
// ?vadi=1 (do konca dela 6), "Iščem vajo …" in vaja (sproti in iz banke), plošča v
// kartici brez vodoravnega drsnika (tudi z vsemi tremi seznami), kandidati pri 1-12,
// prečrtani kandidati (izračunan slog), E1/E2 brez kandidatov, pravi kliki, brez napak
// JS; posnetki zaslona v mapi (--mapa, privzeto začasna).
//
// "Spoznaj" mora ostati enak: z Math.random s semenom se prva vaja vseh 14 tehnik
// izriše v izhodišču (izvleček commita --izhodisce z git archive, privzeto 5b9ae6f -
// zadnji commit pred delom 6) in v trenutni kodi; primerja se innerHTML območja vaje in
// izračunani slogi vseh njegovih elementov ter meni brez zastavice.
//
//   node tools/preveri-vadi-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-vadi'));
const izhodisce = arg('--izhodisce', '5b9ae6f');
const KOREN = path.join(__dirname, '..');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Math.random s semenom (mulberry32) v strani.
const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; return true; })()`;

const TEHNIKE = ['naked-single', 'hidden-single', 'pointing', 'box-line', 'naked-pair', 'hidden-pair', 'naked-triple',
  'hidden-triple', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
const ENOJCKA = ['naked-single', 'hidden-single'];

// Odpre trening z zastavico in s pravim klikom na "Vadi v uganki" začne krog tehnike.
// banka: meja iskanja je takoj presežena. Počaka na vajo.
async function vadi(b, mode, sirina, { banka = false, seme = 7, shramba = {} } = {}) {
  const mobilno = sirina < 500;
  await b.odpri('trening/index.html?vadi=1', { sirina, visina: 1000, mobilno });
  await b.izvedi(`localStorage.clear(); ${Object.entries(shramba).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} true`);
  await b.odpri('trening/index.html?vadi=1', { sirina, visina: 1000, mobilno });
  await b.izvedi(SEME(seme));
  if (banka) await b.izvedi('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })(); true');
  await b.klikni(`.menu-card[data-mode="${mode}"] .nacin-btn.vadi`);
  const isce = await b.izvedi(`document.querySelector('.vadi-isce') ? document.querySelector('.vadi-isce').textContent : ''`);
  await b.cakaj('vadi !== null', 15000);
  return isce;
}

const stanjeStrani = b => b.izvedi(`(() => {
  const kartica = document.querySelector('.exercise').getBoundingClientRect();
  const w = document.querySelector('.vaja-uganka').getBoundingClientRect();
  const seznami = [...document.querySelectorAll('.vaja-uganka .seznam')];
  const vKartici = r => r.left >= kartica.left - 0.5 && r.right <= kartica.right + 0.5;
  return {
    sirinaStrani: document.documentElement.scrollWidth,
    vKartici: vKartici(w) && seznami.filter(s => !s.hidden).every(s => vKartici(s.getBoundingClientRect())),
    seznamiVidni: seznami.map(s => !s.hidden && s.getBoundingClientRect().width > 0),
    kandidatov: document.querySelectorAll('.vaja-uganka .mreza .kand:not(:empty)').length,
    pricakovanih: vadi.stanje.kandidati.reduce((s, m) => s + [1,2,3,4,5,6,7,8,9].filter(d => m & (1 << d)).length, 0),
    celica: vadi.plosca.mreza.celice[0].getBoundingClientRect().width,
    oznaka: document.querySelector('.ex-label').textContent,
  };
})()`);

async function meni(b) {
  console.log('Meni');
  await b.odpri('trening/index.html', { sirina: 375, visina: 900, mobilno: true });
  preveri('brez zastavice ni gumbov načina', (await b.izvedi(`document.querySelectorAll('.nacin-btn').length`)) === 0);
  await b.odpri('trening/index.html?vadi=1', { sirina: 375, visina: 900, mobilno: true });
  preveri('z ?vadi=1 gumba na vseh 14 karticah', (await b.izvedi(`[...document.querySelectorAll('.menu-card')].every(k => k.querySelectorAll('.nacin-btn').length === 2)`)) === true);
  preveri('meni brez drsnika', (await b.izvedi('document.documentElement.scrollWidth')) === 375);
  await b.posnetek(path.join(mapa, 'meni-375.png'));
  // Klik kartice (ne gumba) je "Spoznaj", gumb "Spoznaj" tudi.
  await b.klikni('.menu-card[data-mode="naked-pair"] h3');
  preveri('klik kartice = Spoznaj', (await b.izvedi(`nacin === 'spoznaj' && !!document.querySelector('.layout-row, .layout-col, .layout-block')`)) === true);
  await b.klikni('#backBtn');
  await b.klikni('.menu-card[data-mode="naked-pair"] .nacin-btn:not(.vadi)');
  preveri('gumb Spoznaj = Spoznaj', (await b.izvedi(`nacin === 'spoznaj'`)) === true);
}

async function vaja1do12(b, mode, sirina) {
  console.log(`${mode}, ${sirina} px`);
  const isce = await vadi(b, mode, sirina);
  preveri('med iskanjem "Iščem vajo …"', isce === 'Iščem vajo …', isce);
  let s = await stanjeStrani(b);
  preveri('brez vodoravnega drsnika', s.sirinaStrani === sirina, s.sirinaStrani);
  preveri('plošča v kartici', s.vKartici);
  preveri('kandidati so kandidati stanja vaje', s.kandidatov === s.pricakovanih && s.kandidatov > 0, [s.kandidatov, s.pricakovanih]);
  preveri('oznaka vaje', /· Vadi v uganki · Vaja 1 \/ 9$/.test(s.oznaka), s.oznaka);
  // Pokaži prečrtane (pravi klik), vsi trije seznami.
  const n = await b.izvedi('vadi.v.prejOdstranjenih');
  if (n) {
    await b.klikni('.vaja-info input');
    const p = await b.izvedi(`(() => { const e = [...document.querySelectorAll('.vaja-uganka .kand.precrtan')];
      const s = e.length ? getComputedStyle(e[0]) : null;
      return { n: e.length, barva: s && s.color, crta: s && s.textDecorationLine }; })()`);
    preveri('prečrtani: število in slog', p.n === n && p.barva === 'rgb(169, 178, 188)' && p.crta === 'line-through', p);
  }
  for (const k of ['Vrstice', 'Stolpci', 'Bloki']) {
    await b.izvedi(`[...document.querySelectorAll('.vaja-uganka .seznami-stikala label')].find(l => l.textContent.trim() === '${k}').setAttribute('data-k', '${k}'); true`);
    await b.klikni(`.vaja-uganka .seznami-stikala label[data-k="${k}"] input`);
  }
  s = await stanjeStrani(b);
  preveri('vsi trije seznami vidni', s.seznamiVidni.every(Boolean), s.seznamiVidni);
  preveri('s seznami brez drsnika in v kartici', s.sirinaStrani === sirina && s.vKartici, s);
  // Pravi klik celice izbere celico (1-12: vsako).
  await b.klikni('.vaja-uganka .celica[data-r="4"][data-c="4"]');
  preveri('klik izbere celico', JSON.stringify(await b.izvedi('vadi.plosca.izbrane')) === '[40]');
  await b.posnetek(path.join(mapa, `${mode}-${sirina}.png`));
}

async function enojcek(b, mode, sirina) {
  console.log(`${mode}, ${sirina} px`);
  await vadi(b, mode, sirina);
  const s = await stanjeStrani(b);
  preveri('brez vodoravnega drsnika, v kartici', s.sirinaStrani === sirina && s.vKartici, s);
  preveri('v mreži ni kandidatov', s.kandidatov === 0, s.kandidatov);
  preveri('ni vrstice o prej odstranjenih', (await b.izvedi(`document.querySelector('.vaja-info').children.length`)) === 1);
  const g = await b.izvedi('vadi.stanje.grid');
  const polna = g.findIndex(v => v), prazna = g.findIndex(v => !v);
  await b.klikni(`.vaja-uganka .celica[data-r="${Math.floor(polna / 9)}"][data-c="${polna % 9}"]`);
  preveri('polne celice ni mogoče izbrati', JSON.stringify(await b.izvedi('vadi.plosca.izbrane')) === '[]');
  await b.klikni(`.vaja-uganka .celica[data-r="${Math.floor(prazna / 9)}"][data-c="${prazna % 9}"]`);
  preveri('prazna celica se izbere', JSON.stringify(await b.izvedi('vadi.plosca.izbrane')) === `[${prazna}]`);
  await b.posnetek(path.join(mapa, `${mode}-${sirina}.png`));
}

async function banka(b) {
  console.log('Banka ob preseženi meji');
  await vadi(b, 'swordfish', 375, { banka: true });
  preveri('vaja iz banke', (await b.izvedi('vadi.v.izvor.vrsta')) === 'banka');
  preveri('v S0 je naslednji korak Mečarica', (await b.izvedi('nextStep(vadi.v.S0.deska).technique')) === 'Swordfish');
  preveri('izvor v title', /^Vaja iz banke \(seme \d+\)$/.test(await b.izvedi(`document.querySelector('.vaja-info span').title`)));
}

// "Spoznaj": prva vaja vsake tehnike z istim semenom - innerHTML in izračunani slogi.
const SLOGI = ['width', 'height', 'background-color', 'color', 'font-size', 'font-weight', 'font-family',
  'border-top-width', 'border-left-color', 'box-shadow', 'display', 'visibility', 'margin-top', 'padding-left',
  'text-decoration-line'];
async function izris(b, mode, sirina) {
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  const menu = await b.izvedi(`document.getElementById('menu').innerHTML`);
  await b.izvedi(SEME(4242));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  // Pisave (Google Fonts, tudi latin-ext za č/š/ž) se lahko naložijo šele po kliku - širina
  // besedila bi se razlikovala zaradi nalaganja, ne zaradi kode.
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    const a = document.getElementById('exerciseArea');
    const slogi = [...a.querySelectorAll('*')].map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    return { html: a.innerHTML, slogi };
  })()`).then(r => ({ ...r, menu }));
}

async function spoznaj(sirine) {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  const bNov = await zazeni();
  try {
    for (const sirina of sirine) {
      console.log(`Spoznaj, ${sirina} px (izhodišče ${izhodisce})`);
      for (const m of TEHNIKE) {
        const s = await izris(bStar, m, sirina);
        const n = await izris(bNov, m, sirina);
        const razl = s.slogi.findIndex((x, i) => x !== n.slogi[i]);
        preveri(`${m}: izris enak`, s.html === n.html && s.slogi.length === n.slogi.length && razl < 0,
          s.html !== n.html ? 'innerHTML' : razl >= 0 ? `element ${razl}: ${s.slogi[razl]} → ${n.slogi[razl]}` : 'število elementov');
        if (m === TEHNIKE[0]) preveri('meni brez zastavice enak', s.menu === n.menu);
      }
    }
  } finally {
    await bStar.zapri();
    await bNov.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
  for (const n of [...bStar.napake, ...bNov.napake]) { console.log(`  ✗ ${n}`); napak++; }
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    await meni(b);
    for (const sirina of [375, 1200]) {
      for (const mode of ['hidden-pair', 'swordfish', 'unique-rectangle']) await vaja1do12(b, mode, sirina);
      for (const mode of ENOJCKA) await enojcek(b, mode, sirina);
    }
    await banka(b);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  if (!args.includes('--brez-spoznaj')) await spoznaj([375, 1200]);
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
