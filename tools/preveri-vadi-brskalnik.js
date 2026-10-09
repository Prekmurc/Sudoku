'use strict';
// Trening »Vadi v uganki« (trening/v-uganki.js, docs/vadi-v-uganki-nacrt.md) v pravem
// brskalniku, pri širini 375 in 1200 px: gumba načina na vseh karticah (klik kartice je
// "Spoznaj"), "Iščem vajo …" in vaja (sproti in iz banke), plošča v
// kartici brez vodoravnega drsnika (tudi z vsemi tremi seznami), kandidati pri 1-12,
// prečrtani kandidati (izračunan slog), E1/E2 brez kandidatov, pravi kliki, brez napak
// JS; odgovor pri 1-12 in E1/E2 (predlog) s pravimi kliki in tipkami (pari QWERTZ), pomoč,
// senčenje pri E2; posnetki zaslona v mapi (--mapa, privzeto začasna).
//
// Oznake (docs/oznake-nacrt.md, različica C3) pri 375 in 1280 px: slog okvirja (3 px črtkan,
// vijoličen, čez mrežno črto), okvir ne zakrije nobenega vidnega piksla male števke ne v
// označeni ne v sosednji celici (meritev na posnetkih, tudi na sestavljenem najslabšem
// primeru), okvir je viden na vseh štirih barvah poudarka in ob izbiri, podlagi vzorca in
// izbrisa v treningu močnejši, v igri nespremenjeni.
//
// "Spoznaj" mora ostati enak: z Math.random s semenom se prva vaja vseh 14 tehnik
// izriše v izhodišču (izvleček commita --izhodisce z git archive, privzeto 4e1e4dc -
// zadnji commit faze 5 »videz«, docs/faza5-nacrt.md, ki je spremenila videz treninga;
// prej 5b9ae6f, zadnji commit pred delom 6) in v trenutni kodi; primerja se innerHTML območja vaje in
// izračunani slogi vseh njegovih elementov (meni ima od dela 6 gumba načina).
//
// Vaji 1 in 2 ter E1 in E2 imata svoje izhodišče (--izhodisce-presek, --izhodisce-enojcki,
// privzeto IZHODISCE_PRESEK in IZHODISCE_ENOJCKI spodaj) - od faze 5 isto kot druge tehnike.
//
//   node tools/preveri-vadi-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>] [--izhodisce-presek <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa, odmakniMisko, vaja3, NAVODILA_NAZAJ } = require('./primerjava-slogov.js');
const { spremljajVajo, dokoncajOdgovor } = require('./odgovor-spoznaj-brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-vadi'));
const izhodisce = arg('--izhodisce', '4c47cc0');
// Vaji 1 in 2 v "Spoznaj" sta od izbire uganke po stopnji (načrt, točka 16) iz drugih ugank
// banke, zato sta imeli svoje izhodišče (dd316bd; prazno = ne primerjata se); od faze 5 je
// to zadnji commit faze 5, od faze 6 (korak c) zadnji commit koraka b.
const IZHODISCE_PRESEK = '4c47cc0';
const izhodiscePresek = arg('--izhodisce-presek', IZHODISCE_PRESEK);
// E1 in E2 v "Spoznaj" imata od točke 17 (okvir območja pri vajah 1-6) svoje izhodišče
// (0d457e8; prazno = ne primerjata se); od faze 5 je to zadnji commit faze 5, od faze 6 (korak c)
// zadnji commit koraka b.
const IZHODISCE_ENOJCKI = '4c47cc0';
const izhodisceEnojcki = arg('--izhodisce-enojcki', IZHODISCE_ENOJCKI);
const PRESEK = ['pointing', 'box-line'];
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
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno });
  await b.izvedi(`localStorage.clear(); ${Object.entries(shramba).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} true`);
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno });
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
  preveri('gumba na vseh 14 karticah', (await b.izvedi(`[...document.querySelectorAll('.menu-card')].every(k => k.querySelectorAll('.nacin-btn').length === 2)`)) === true);
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
    preveri('besedilo: prečrtani niso del naloge', /^Prečrtane kandidate \(\d+\) so izbrisali prejšnji koraki – niso del naloge\.$/.test(await b.izvedi(`document.querySelector('.prej-odstranjeni').textContent`)));
  }
  for (const k of ['Vrstice', 'Stolpci', 'Bloki']) {
    await b.izvedi(`[...document.querySelectorAll('.vaja-uganka .seznami-stikala label')].find(l => l.textContent.trim() === '${k}').setAttribute('data-k', '${k}'); true`);
    await b.klikni(`.vaja-uganka .seznami-stikala label[data-k="${k}"] input`);
  }
  s = await stanjeStrani(b);
  preveri('vsi trije seznami vidni', s.seznamiVidni.every(Boolean), s.seznamiVidni);
  preveri('s seznami brez drsnika in v kartici', s.sirinaStrani === sirina && s.vKartici, s);
  // Pravi klik celice izbere celico (1-12: vsako).
  // Prazna celica (ob privzeto vklopljenem »več celic« se polna celica ne izbere).
  const prazna = await b.izvedi('vadi.stanje.grid.findIndex(x => !x)');
  await b.klikni(celicaSel(prazna));
  preveri('klik izbere celico', JSON.stringify(await b.izvedi('vadi.plosca.izbrane')) === `[${prazna}]`);
  await b.posnetek(path.join(mapa, `${mode}-${sirina}.png`));
}

async function enojcek(b, mode, sirina) {
  console.log(`${mode}, ${sirina} px`);
  await vadi(b, mode, sirina);
  // Vaja 1: območje - označena enota, prazne celice zunaj nje zatemnjene in neizbirljive.
  const o = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice, e = vadi.ob.enota, g = vadi.stanje.grid;
    const zunaj = g.findIndex((x, i) => !x && !e.includes(i));
    return { navodilo: document.querySelector('.exercise h3').textContent, oznacenih: c.filter(x => x.classList.contains('oznacena')).length,
      barva: getComputedStyle(c[e[0]]).backgroundColor, zunaj, neaktivna: zunaj >= 0 && c[zunaj].classList.contains('neaktivna') }; })()`);
  preveri('vaja 1: navodilo z enoto', /^V (vrstici|stolpcu|bloku) \d poišči /.test(o.navodilo), o.navodilo);
  preveri('vaja 1: enota označena (modrikasto), zunaj zatemnjeno', o.oznacenih === 9 && o.neaktivna, o);
  if (o.zunaj >= 0) {
    await b.klikni(celicaSel(o.zunaj));
    preveri('celica zunaj enote se ne izbere', JSON.stringify(await b.izvedi('vadi.plosca.izbrane')) === '[]');
  }
  await b.posnetek(path.join(mapa, `${mode}-vaja1-${sirina}.png`));
  // Nadaljevanje na celi uganki (vaja 7).
  await b.izvedi('exNum = 6; renderExercise(); true');
  await b.cakaj('vadi !== null', 15000);
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

  // Predlog: niz Vpiši (vseh 9 števk), tipka s števko, Backspace; videz ni moder.
  const [kc, kd] = await b.izvedi('vadi.v.KT[0].assign[0]');
  await b.klikni(celicaSel(kc));
  preveri('niz Vpiši: vseh 9 števk omogočenih', (await b.izvedi(`[...document.querySelectorAll('.vaja-uganka .niz-vpisi button')].every(g => !g.disabled)`)) === true);
  const druga = kd === 9 ? 8 : kd + 1;
  await b.klikni(`.vaja-uganka .niz-vpisi button:nth-child(${druga})`);
  let p = await b.izvedi(`(() => { const e = vadi.plosca.mreza.celice[${kc}], s = getComputedStyle(e), vp = document.querySelector('.vaja-uganka .celica.vpis');
    return { besedilo: e.textContent, razred: e.className, barva: s.color, obroba: s.outlineStyle, vpis: vp ? getComputedStyle(vp).color : null, poteze: vadi.v.igra.kazalec - vadi.v.igra.zacetnihPotez }; })()`);
  preveri('predlog v celici, ni poteza', p.besedilo === String(druga) && p.razred.includes('predlog') && p.poteze === 0, p);
  preveri('predlog ni moder kot vpisi poti (vijoličen, črtkan okvir)', p.barva === 'rgb(104, 64, 160)' && p.barva !== p.vpis && p.obroba === 'dashed', p);
  await b.posnetek(path.join(mapa, `${mode}-predlog-${sirina}.png`));
  await b.tipka('Backspace');
  preveri('Backspace pobriše predlog', (await b.izvedi(`vadi.plosca.mreza.celice[${kc}].textContent`)) === '');
  await b.tipka(String(kd), { code: `Digit${kd}` });
  await klikniGumb(b, 'Preveri');
  p = await b.izvedi(`(() => { const e = vadi.plosca.mreza.celice[${kc}];
    return { fb: document.querySelector('.fb').className, razred: e.className, bg: getComputedStyle(e).backgroundColor, grid: vadi.stanje.grid[${kc}], sirina: document.documentElement.scrollWidth }; })()`);
  preveri('pravilen predlog: poteza vpis, zelena celica', p.fb === 'fb ok' && p.grid === kd && p.razred.includes('k-vpis') && p.bg === 'rgb(220, 238, 229)', p);
  preveri('brez drsnika po odgovoru', p.sirina === sirina, p.sirina);
}

// E2: senčenje s pravimi kliki (kljukica, poudarek) je pomoč; šrafura na zasenčenih celicah.
async function sencenjeE2(b, sirina) {
  console.log(`hidden-single, senčenje, ${sirina} px`);
  await vadi(b, 'hidden-single', sirina, { banka: true, seme: 9 });
  await b.izvedi(`[...document.querySelectorAll('.vaja-uganka .kljukice label')].find(l => l.textContent.trim() === 'senči').setAttribute('data-k', 's'); true`);
  await b.klikni('.vaja-uganka .kljukice label[data-k="s"] input');
  const d = await b.izvedi('vadi.v.KT[0].assign[0][1]');
  await b.klikni(`.vaja-uganka .niz-poudari button:nth-child(${d})`);
  const p = await b.izvedi(`(() => { const z = [...document.querySelectorAll('.vaja-uganka .celica.zasencena')];
    return { n: z.length, sraf: z.length && getComputedStyle(z[0], '::after').backgroundImage.includes('repeating-linear-gradient'),
      pomoc: document.getElementById('scorePomoc').textContent }; })()`);
  preveri('šrafura na zasenčenih celicah', p.n > 0 && p.sraf, p);
  preveri('senčenje pri E2 = s pomočjo', p.pomoc === ' · s pomočjo: 1', p.pomoc);
  await b.posnetek(path.join(mapa, `hidden-single-sencenje-${sirina}.png`));
}

// Druga možnost videza predloga (samo posnetek za odločitev): siva števka s črtkanim okvirjem.
async function predlogSiv(b) {
  await vadi(b, 'naked-single', 375, { banka: true, seme: 7 });
  const [kc, kd] = await b.izvedi('vadi.v.KT[0].assign[0]');
  await b.izvedi(`(() => { const s = document.createElement('style'); s.textContent = '.celica.predlog{color:#6B7682 !important;font-style:normal !important;outline-color:#8A96A3 !important}'; document.head.appendChild(s); return true; })()`);
  await b.klikni(celicaSel(kc));
  await b.klikni(`.vaja-uganka .niz-vpisi button:nth-child(${kd})`);
  await b.posnetek(path.join(mapa, 'naked-single-predlog-siv-375.png'));
}

// 1-12: odgovor s pravimi kliki (celica + niz "Odstrani") in tipkami (pari QWERTZ):
// napačen odgovor, "Poskusi znova", pravilen odgovor z zaklepom in oznakami koraka.
const celicaSel = c => `.vaja-uganka .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]`;
async function odstraniKlik(b, [c, d]) {
  if ((await b.izvedi('vadi.plosca.enaIzbrana()')) !== c) await b.klikni(celicaSel(c));
  await b.klikni(`.vaja-uganka .niz-odstrani button:nth-child(${d})`);
}
const gumbSel = napis => `[...document.querySelectorAll('#exerciseArea button')].find(g => g.textContent === ${JSON.stringify(napis)})`;
async function klikniGumb(b, napis) {
  await b.izvedi(`(${gumbSel(napis)}).setAttribute('data-klik', '1'); true`);
  await b.klikni('#exerciseArea button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
}
async function odgovor1do12(b, sirina) {
  console.log(`hidden-pair, odgovor, ${sirina} px`);
  await vadi(b, 'hidden-pair', sirina, { banka: true, seme: 11 });
  // Odgovor s posameznimi celicami: »več celic« (pri skritem paru privzeto vklopljen,
  // točka 18) izklopljen s pravim klikom; izbiro več celic preverja zaznamki().
  if (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) await b.klikni('.vaja-uganka .glava-s-kljukico input');
  const I = await b.izvedi(`(() => { const v = vadi.v; let prava = null;
    for (let c = 0; c < 81 && !prava; c++) if (!v.S0.grid[c] && (v.S0.kandidati[c] & (1 << v.resitev[c]))) prava = [c, v.resitev[c]];
    return { korak: v.KT[0].eliminate, prava }; })()`);
  // Napačen odgovor s tipko Shift+števka (par QWERTZ), "Poskusi znova".
  const QWERTZ = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
  await b.klikni(celicaSel(I.prava[0]));
  await b.tipka(QWERTZ[I.prava[1]], { code: `Digit${I.prava[1]}`, shift: true });
  preveri('Shift+števka (QWERTZ) odstrani kandidata', (await b.izvedi(`vadi.stanje.kandidati[${I.prava[0]}] & ${1 << I.prava[1]}`)) === 0);
  await klikniGumb(b, 'Preveri');
  preveri('napačen odgovor', (await b.izvedi(`document.querySelector('.fb').className`)) === 'fb err');
  await klikniGumb(b, 'Poskusi znova');
  preveri('"Poskusi znova" vrne na začetek vaje', (await b.izvedi('vadi.v.igra.kazalec === vadi.v.igra.zacetnihPotez')) === true);
  // Ctrl+Z na QWERTZ (tipka Z: key 'z', code 'KeyY') po izbrisu.
  await odstraniKlik(b, I.korak[0]);
  await b.tipka('z', { code: 'KeyY', ctrl: true });
  preveri('Ctrl+Z (QWERTZ) razveljavi izbris', (await b.izvedi(`!!(vadi.stanje.kandidati[${I.korak[0][0]}] & ${1 << I.korak[0][1]})`)) === true);
  // Pravilen odgovor s pravimi kliki.
  for (const e of I.korak) {
    if (await b.izvedi(`!!(vadi.stanje.kandidati[${e[0]}] & ${1 << e[1]})`)) await odstraniKlik(b, e);
  }
  await klikniGumb(b, 'Preveri');
  const p = await b.izvedi(`(() => {
    const fb = document.querySelector('.fb'), [c, d] = vadi.v.KT[0].eliminate[0];
    const k = vadi.plosca.mreza.celice[c].querySelectorAll('.kand')[d - 1];
    return { fb: fb.className, akcije: document.querySelector('.vaja-uganka .akcije').getBoundingClientRect().height,
      kIzbris: k.className, barva: getComputedStyle(k).color, crta: getComputedStyle(k).textDecorationLine,
      vzorec: vadi.v.KT[0].cells.every(x => vadi.plosca.mreza.celice[x].classList.contains('k-vzorec')),
      obroba: getComputedStyle(document.querySelector('.vaja-uganka .mreza')).outlineStyle, sirina: document.documentElement.scrollWidth };
  })()`);
  preveri('pravilen odgovor', p.fb === 'fb ok', p.fb);
  const leg = await b.izvedi(`(() => { const l = document.querySelector('.fb .legenda-vaje'); return l ? { besedilo: l.textContent, visina: l.getBoundingClientRect().height } : null; })()`);
  preveri('legenda: celice vzorca, izbrisani kandidati', leg && leg.visina > 0 && /celice vzorca.*izbrisani kandidati$/.test(leg.besedilo), leg);
  preveri('Razveljavi/Ponovi/Začni znova skriti', p.akcije === 0, p.akcije);
  preveri('izbrisi koraka rdeče prečrtani', p.kIzbris === 'kand precrtan k-izbris' && p.barva === 'rgb(178, 58, 46)' && p.crta === 'line-through', p);
  preveri('vzorec koraka jantarno, brez zelene obrobe', p.vzorec && p.obroba === 'none', p);
  preveri('brez drsnika', p.sirina === sirina, p.sirina);
  await b.posnetek(path.join(mapa, `hidden-pair-pravilno-${sirina}.png`));
}

// 1-12: pomoč s pravimi kliki - Namig in Rešitev ostaneta do "Skrij", oznake koraka.
async function pomoc1do12(b, sirina) {
  console.log(`hidden-pair, pomoč, ${sirina} px`);
  await vadi(b, 'hidden-pair', sirina, { banka: true, seme: 5 });
  // Odgovor s posameznimi celicami: »več celic« (pri skritem paru privzeto vklopljen,
  // točka 18) izklopljen s pravim klikom; izbiro več celic preverja zaznamki().
  if (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) await b.klikni('.vaja-uganka .glava-s-kljukico input');
  // Korak v območju z vsaj dvema izbrisoma (po prvem izbrisu ostane na mreži še rdeč
  // izbris); vaja brez takega koraka se zamenja z naslednjo.
  for (let i = 0; i < 9 && !(await b.izvedi('vadi.KTob.some(k => k.eliminate.length > 1)')); i++) {
    await b.izvedi('exNum++; renderExercise(); true');
    await b.cakaj('vadi !== null', 15000);
  }
  // Isti korak izbere tudi pomoč (največ igralčevih izbrisov - korakPomoci()).
  const e0 = await b.izvedi('vadi.KTob.find(k => k.eliminate.length > 1).eliminate[0]');
  await odstraniKlik(b, e0);
  await klikniGumb(b, 'Namig');
  let p = await b.izvedi(`(() => { const o = document.querySelector('.vadi-pomoc'); return { vidno: !o.hidden && o.getBoundingClientRect().height > 0, besedilo: o.textContent, pomoc: document.getElementById('scorePomoc').textContent }; })()`);
  preveri('Namig ostane prikazan po kliku', p.vidno && p.besedilo.startsWith('Namig: '), p);
  preveri('vaja s pomočjo', p.pomoc === ' · s pomočjo: 1', p.pomoc);
  await klikniGumb(b, 'Rešitev');
  p = await b.izvedi(`(() => { const o = document.querySelector('.vadi-pomoc'), k = document.querySelector('.vaja-uganka .kand.k-izbris');
    return { besedilo: o.textContent, izbris: k ? getComputedStyle(k).color : null, vzorec: document.querySelectorAll('.vaja-uganka .celica.k-vzorec').length,
      sirina: document.documentElement.scrollWidth, vKartici: o.getBoundingClientRect().right <= document.querySelector('.exercise').getBoundingClientRect().right }; })()`);
  preveri('Rešitev: sporočilo koraka in oznake na mreži', p.besedilo.startsWith('Rešitev: ') && p.izbris === 'rgb(178, 58, 46)' && p.vzorec > 0, p);
  preveri('Rešitev: opravljeni izbris v seznamu', /Opravljeno: \d+ od \d+/.test(p.besedilo) || /Korak je izveden/.test(p.besedilo), p.besedilo);
  preveri('pomoč v kartici, brez drsnika', p.vKartici && p.sirina === sirina, p);
  await b.posnetek(path.join(mapa, `hidden-pair-resitev-${sirina}.png`));
  await klikniGumb(b, 'Skrij');
  p = await b.izvedi(`({ skrito: document.querySelector('.vadi-pomoc').hidden, oznak: document.querySelectorAll('.vaja-uganka .k-vzorec, .vaja-uganka .k-izbris').length })`);
  preveri('Skrij: okvir in oznake izginejo', p.skrito && p.oznak === 0, p);
}

// Območje pri vaji 1: enota modrikasta (1-6), števka poudarjena (7-9), pivot, bloka.
// Geometrija okvira območja (popravek 6): pasovi ::before (iz izračunanega sloga - odmiki in debeline
// obrob glede na notranji rob celice), pravokotniki besedila vseh števk v mreži (Range) in notranjost
// (padding box) vseh celic.
const GEOMETRIJA_OKVIRA = `(() => { const c = vadi.plosca.mreza.celice;
  const notranjost = x => { const r = x.getBoundingClientRect(), s = getComputedStyle(x);
    return { l: r.left + parseFloat(s.borderLeftWidth), t: r.top + parseFloat(s.borderTopWidth), r: r.right - parseFloat(s.borderRightWidth), b: r.bottom - parseFloat(s.borderBottomWidth) }; };
  const pasovi = [];
  for (const x of c.filter(x => x.classList.contains('obm'))) {
    const p = notranjost(x), s = getComputedStyle(x, '::before');
    const o = { l: p.l + parseFloat(s.left), t: p.t + parseFloat(s.top), r: p.r - parseFloat(s.right), b: p.b - parseFloat(s.bottom) };
    const w = k => parseFloat(s['border' + k + 'Width']);
    if (w('Top')) pasovi.push({ l: o.l, r: o.r, t: o.t, b: o.t + w('Top'), d: w('Top') });
    if (w('Bottom')) pasovi.push({ l: o.l, r: o.r, t: o.b - w('Bottom'), b: o.b, d: w('Bottom') });
    if (w('Left')) pasovi.push({ l: o.l, r: o.l + w('Left'), t: o.t, b: o.b, d: w('Left') });
    if (w('Right')) pasovi.push({ l: o.r - w('Right'), r: o.r, t: o.t, b: o.b, d: w('Right') });
  }
  const znaki = [];
  for (const x of c) {
    const w = document.createTreeWalker(x, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect();
      if (q.width) znaki.push({ l: q.left, t: q.top, r: q.right, b: q.bottom }); }
  }
  const seka = (a, b) => a.l < b.r - 0.01 && b.l < a.r - 0.01 && a.t < b.b - 0.01 && b.t < a.b - 0.01;
  const notr = c.map(notranjost);
  return { pasov: pasovi.length, debelina: [...new Set(pasovi.map(p => p.d))], debela: getComputedStyle(c[3]).borderLeftWidth,
    barvaCrte: getComputedStyle(c[3]).borderLeftColor, znakov: znaki.length,
    vNotranjosti: pasovi.filter(p => notr.some(q => seka(p, q))).length,
    // samo za izpis: pravokotniki besedila (z višino pisave) segajo 1-3 px čez notranjost celice, števka ne
    besediloVPasu: pasovi.filter(p => znaki.some(q => seka(p, q))).length };
})()`;

async function obmocje(b, sirina) {
  for (const [mode, vrsta] of [['hidden-pair', 'enota'], ['x-wing', 'stevke'], ['xy-wing', 'pivot'], ['unique-rectangle', 'bloki']]) {
    console.log(`${mode}, območje, ${sirina} px`);
    await vadi(b, mode, sirina, { banka: true, seme: 3 });
    const o = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice, ob = vadi.ob;
      const ozn = c.filter(x => x.classList.contains('oznacena'));
      const poud = ob.stevke ? ob.stevke.map(d => [...document.querySelectorAll('.vaja-uganka .niz-poudari button')][d - 1].getAttribute('aria-pressed')) : [];
      return { vrsta: ob.vrsta, opis: ob.opis, navodilo: document.querySelector('.exercise h3').textContent, oznacenih: ozn.length, pricakovanih: ob.celice ? ob.celice.length : 0,
        barva: ozn.length ? getComputedStyle(ozn.find(x => !x.classList.contains('dana') && !x.classList.contains('vpis')) || ozn[0]).backgroundColor : null, poud,
        sirina: document.documentElement.scrollWidth }; })()`);
    preveri(`${mode}: vrsta območja ${vrsta}`, o.vrsta === vrsta, o.vrsta);
    preveri(`${mode}: navodilo pove območje`, o.navodilo.toLowerCase().includes(o.opis.toLowerCase()), o.navodilo);
    if (vrsta === 'stevke') preveri(`${mode}: števka poudarjena`, o.poud.length && o.poud.every(x => x === 'true'), o.poud);
    else preveri(`${mode}: območje modrikasto`, o.oznacenih === o.pricakovanih && o.barva === 'rgb(227, 238, 251)', o);
    // Točka 17: okvir ob robu območja (::before) in oznake roba v barvi okvira; pri števkah obroč
    // na gumbu v nizu Poudari. Okvir ostane ob izbrani celici in poudarku. Popravek 6 po ročnem
    // pregledu naloge 4a: okvir 2 px (kot debela črta mreže) v močno modri #1565C0, na mrežni črti -
    // ne sega v notranjost nobene celice in ne prekrije nobene števke (pravokotniki besedila).
    if (vrsta !== 'stevke') {
      const c0 = await b.izvedi('vadi.ob.celice.find(c => !vadi.stanje.grid[c])');
      if (c0 !== undefined) await b.klikni(celicaSel(c0));
      await b.izvedi('vadi.plosca.poudari(vadi.KTob[0].eliminate[0][1]); true');
    }
    const k = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice;
      const rob = c.filter(x => x.classList.contains('obm-g') || x.classList.contains('obm-l'));
      const okvir = rob.map(x => { const s = getComputedStyle(x, '::before'); return x.classList.contains('obm-g') ? [s.borderTopWidth, s.borderTopColor] : [s.borderLeftWidth, s.borderLeftColor]; });
      const izbrana = c.find(x => x.classList.contains('izbrana') && x.classList.contains('obm'));
      const oznake = [...document.querySelectorAll('.vaja-uganka .rob-s span.obm, .vaja-uganka .rob-v span.obm')].map(s => [getComputedStyle(s).backgroundColor, getComputedStyle(s).color]);
      const obroc = [...document.querySelectorAll('.vaja-uganka .niz-poudari button.obm-stevka')].map(g => getComputedStyle(g).boxShadow);
      return { robnih: rob.length, okvir: [...new Set(okvir.map(x => x.join(' ')))], izbranaOkvir: izbrana ? getComputedStyle(izbrana, '::before').borderTopWidth + getComputedStyle(izbrana, '::before').borderLeftWidth : null,
        oznake: [...new Set(oznake.map(x => x.join(' ')))], stOznak: oznake.length, obroc }; })()`);
    if (vrsta === 'stevke') {
      preveri(`${mode}: obroč števke v nizu Poudari`, k.obroc.length === 1 && k.obroc[0].includes('rgb(21, 101, 192)'), k.obroc);
    } else {
      preveri(`${mode}: okvir 2 px močno moder`, k.robnih > 0 && k.okvir.length === 1 && k.okvir[0] === '2px rgb(21, 101, 192)', k);
      preveri(`${mode}: oznake roba v polju barve okvira`, k.stOznak > 0 && k.oznake.length === 1 && k.oznake[0] === 'rgb(21, 101, 192) rgb(255, 255, 255)', k);
      if (k.izbranaOkvir !== null) preveri(`${mode}: okvir viden tudi na izbrani celici`, k.izbranaOkvir !== '0px0px', k.izbranaOkvir);
      const g = await b.izvedi(GEOMETRIJA_OKVIRA);
      preveri(`${mode}: okvir enako debel kot debela črta mreže (${g.debelina.join(', ')} px, črta ${g.debela}), barva ni barva črte`,
        g.pasov > 0 && g.debelina.length === 1 && g.debelina[0] === parseFloat(g.debela) && g.barvaCrte !== 'rgb(21, 101, 192)', g);
      preveri(`${mode}: okvir na mrežni črti – ne sega v notranjost nobene celice (${g.pasov} pasov)`, g.vNotranjosti === 0, g);
      const z = await zakritiPiksli(b, OBMOCJE_SKRITO, VSE_STEVKE_SKRITE);
      preveri(`${mode}: okvir ne zakrije nobenega piksla števke (stik ${z.stik})`, z.zakritih === 0, z);
    }
    preveri(`${mode}: brez drsnika`, o.sirina === sirina, o.sirina);
    await b.posnetek(path.join(mapa, `${mode}-obmocje-${sirina}.png`));
  }
}

// Zaznamki (točka 17.2) s pravimi kliki: kljukica "več celic", celice vzorca, gumb, nato
// tipka O na QWERTZ; oranžna črtkana obroba; izbira je spet prosta.
async function zaznamki(b, sirina) {
  console.log(`swordfish, zaznamki, ${sirina} px`);
  await vadi(b, 'swordfish', sirina, { banka: true, seme: 4 });
  await b.izvedi('exNum = 6; renderExercise(); true');
  await b.cakaj('vadi !== null', 15000);
  const k = await b.izvedi('vadi.v.KT[0]');
  // "Več celic" je pri mečarici privzeto vklopljen (točka 18) - izbira več celic brez Ctrl.
  preveri('»več celic« pri mečarici privzeto vklopljen', (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) === true);
  for (const c of k.cells) await b.klikni(celicaSel(c));
  await klikniGumb(b, '◩ Označi izbrane (O)');
  let z = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice.filter(x => x.classList.contains('zaznamovana'));
    const s = c.length ? getComputedStyle(c[0], '::after') : null;
    return { n: c.length, izbrane: vadi.plosca.izbrane.length, slog: s ? s.borderTopStyle + ' ' + s.borderTopWidth + ' ' + s.borderTopColor : '' }; })()`);
  preveri('zaznamovane celice vzorca, izbira prazna', z.n === k.cells.length && z.izbrane === 0, z);
  preveri('vijoličen črtkan okvir 3 px', z.slog === 'dashed 3px rgb(94, 43, 151)', z.slog);
  await b.klikni('.vaja-uganka .glava-s-kljukico input');
  await b.klikni(celicaSel(k.cells[0]));
  await b.tipka('o', { code: 'KeyO' });
  z = await b.izvedi(`vadi.plosca.mreza.celice.filter(x => x.classList.contains('zaznamovana')).length`);
  preveri('tipka O (QWERTZ) odznači', z === k.cells.length - 1, z);
  await b.posnetek(path.join(mapa, `swordfish-zaznamki-${sirina}.png`));
  // Izklop "več celic" (zgoraj) ostane do konca kroga - tudi v naslednji vaji.
  await b.izvedi('exNum++; renderExercise(); true');
  await b.cakaj('vadi !== null', 15000);
  preveri('izklop »več celic« ostane v naslednji vaji', (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) === false);
}

// Oznake (docs/oznake-nacrt.md, C3): ali okvir oznake zakrije kak piksel male števke. Štirje
// posnetki mreže: končni, brez okvirja, brez malih števk (.kand prozoren - tudi prečrtani) in
// brez obojega. Piksel števke je tisti, ki ga števka spremeni (brez okvirja); okvir ga zakrije,
// če je na končni sliki enak sliki brez števk. Rob glajenja, ki ga števka spremeni za največ
// 3/255 (nevidno), se ne šteje - na skoraj prozornem robu se mešanica z okvirjem zaokroži v
// barvo okvirja. Vrne število zakritih pikslov, celice in stik (piksli, ki jih spremenita
// oba - števka nad okvirjem).
const OKVIR_SKRIT = '.celica.zaznamovana::after{ border-color:transparent !important; }';
const STEVKE_SKRITE = '.vaja-uganka .kand{ color:transparent !important; }';
async function posnetekMreze(b, slog) {
  await b.izvedi(`(() => { let s = document.getElementById('meritev'); if (!s) { s = document.createElement('style'); s.id = 'meritev'; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(slog)}; return true; })()`);
  const r = await b.izvedi(`(() => { const q = document.querySelector('.vaja-uganka .mreza').getBoundingClientRect();
    return { x: Math.floor(q.left + scrollX) - 6, y: Math.floor(q.top + scrollY) - 6, w: Math.ceil(q.width) + 12, h: Math.ceil(q.height) + 12 }; })()`);
  const s = await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  return { b64: s.data, x: r.x, y: r.y };
}
// Okvir območja (popravek 6) se meri enako: skrit je okvir območja, skrite so vse števke (male in velike).
const OBMOCJE_SKRITO = '.celica.obm::before{ border-color:transparent !important; }';
const VSE_STEVKE_SKRITE = '.vaja-uganka .kand, .vaja-uganka .celica{ color:transparent !important; }';
async function zakritiPiksli(b, okvirSkrit = OKVIR_SKRIT, stevkeSkrite = STEVKE_SKRITE) {
  const F = await posnetekMreze(b, '');
  const A = await posnetekMreze(b, okvirSkrit);
  const B = await posnetekMreze(b, okvirSkrit + stevkeSkrite);
  const C = await posnetekMreze(b, stevkeSkrite);
  await posnetekMreze(b, '');
  return b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [f, a, bb, c] = await Promise.all([${[F, A, B, C].map(s => JSON.stringify(s.b64)).join(', ')}].map(slika));
    const celice = vadi.plosca.mreza.celice.map(el => { const q = el.getBoundingClientRect(); return { x1: q.left + scrollX - ${F.x}, y1: q.top + scrollY - ${F.y}, x2: q.right + scrollX - ${F.x}, y2: q.bottom + scrollY - ${F.y} }; });
    const raz = (p, q, k) => Math.max(Math.abs(p.data[k] - q.data[k]), Math.abs(p.data[k + 1] - q.data[k + 1]), Math.abs(p.data[k + 2] - q.data[k + 2]));
    const r = { zakritih: 0, stik: 0, celice: [] };
    for (let y = 0; y < f.height; y++) for (let x = 0; x < f.width; x++) {
      const k = (y * f.width + x) * 4, stevka = raz(a, bb, k), okvir = raz(bb, c, k);
      if (!stevka || !okvir) continue;
      r.stik++;
      if (stevka > 3 && raz(f, c, k) === 0) {
        r.zakritih++;
        const i = celice.findIndex(q => x + 0.5 >= q.x1 && x + 0.5 < q.x2 && y + 0.5 >= q.y1 && y + 0.5 < q.y2);
        if (!r.celice.includes(i)) r.celice.push(i);
      }
    }
    return r;
  })()`);
}
// Kontrast (WCAG) dveh barv rgb(...).
function kontrast(p, q) {
  const L = s => { const [r, g, b] = s.match(/\d+/g).slice(0, 3).map(v => +v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [x, y] = [L(p), L(q)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
async function oznake(b, sirina) {
  console.log(`swordfish, oznake (C3), ${sirina} px`);
  const nalozi = async () => {
    await vadi(b, 'swordfish', sirina, { banka: true, seme: 4 });
    await b.izvedi('exNum = 6; renderExercise(); true');
    await b.cakaj('vadi !== null', 15000);
    return b.izvedi('vadi.v.KT[0]');
  };
  const oznaciVzorec = async k => {
    if (!(await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`))) await b.klikni('.vaja-uganka .glava-s-kljukico input');
    for (const c of k.cells) await b.klikni(celicaSel(c));
    await klikniGumb(b, '◩ Označi izbrane (O)');
  };
  const izbrisi = async k => {
    for (const [c] of k.eliminate) await b.klikni(celicaSel(c));
    await b.klikni(`.vaja-uganka .niz-odstrani button:nth-child(${k.eliminate[0][1]})`);
    await b.tipka('Escape');
  };
  const ime = i => `V${Math.floor(i / 9) + 1}S${i % 9 + 1}`;
  const nicZakritih = async opis => {
    const r = await zakritiPiksli(b);
    preveri(`${opis}: okvir ne zakrije nobenega piksla male števke (stik ${r.stik})`, r.zakritih === 0, { zakritih: r.zakritih, celice: r.celice.map(ime) });
  };
  let k = await nalozi();
  // Podlagi vzorca in izbrisa ob odprti "Rešitvi" (pred izbrisi) in kvadratek legende.
  await klikniGumb(b, 'Rešitev');
  let p = await b.izvedi(`(() => { const bg = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).backgroundColor : null; };
    return { vzorec: bg('.vaja-uganka .celica.k-vzorec'), izbris: bg('.vaja-uganka .celica.k-izbris'), legenda: bg('.vadi-pomoc .sw-vzorec') }; })()`);
  preveri('»Rešitev«: podlaga vzorca #EFD8A0, izbrisa #F0B4AA, legenda kot vzorec',
    p.vzorec === 'rgb(239, 216, 160)' && p.izbris === 'rgb(240, 180, 170)' && p.legenda === p.vzorec, p);
  await klikniGumb(b, 'Skrij');
  // Slog okvirja in plasti: okvir na ::after (z-index 2) 2 px zunaj celice, male števke nad njim.
  await oznaciVzorec(k);
  p = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice[${k.cells[0]}], s = getComputedStyle(c, '::after'), m = getComputedStyle(c.querySelector('.kandidati'));
    return { okvir: [s.borderTopStyle, s.borderTopWidth, s.borderTopColor, s.top, s.left, s.zIndex].join(' '), stevke: m.position + ' ' + m.zIndex }; })()`);
  preveri('okvir: črtkan 3 px #5E2B97, 3 px čez notranji rob obrobe, z-index 2', p.okvir === 'dashed 3px rgb(94, 43, 151) -3px -3px 2', p.okvir);
  // z-index 5 od popravka 6 po ročnem pregledu naloge 4a (nad zaznamkom 2 in nad okvirjem območja 4; prej 3).
  preveri('male števke nad okvirjem oznake in območja (z-index 5)', p.stevke === 'relative 5', p.stevke);
  await izbrisi(k);
  await nicZakritih('oznaka, izbrisi izvedeni');
  // Izbrana in označena celica: obroba izbire in okvir oznake sta oba vidna.
  await b.klikni(celicaSel(k.cells[2])); await b.klikni(celicaSel(k.cells[3])); await b.klikni(celicaSel(71));
  p = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice[${k.cells[2]}];
    return { cls: c.className, senca: getComputedStyle(c).boxShadow, okvir: getComputedStyle(c, '::after').borderTopStyle }; })()`);
  preveri('izbrana in označena: obroba izbire 3 px in okvir oznake', /izbrana/.test(p.cls) && /zaznamovana/.test(p.cls)
    && p.senca === 'rgb(74, 134, 216) 0px 0px 0px 3px inset' && p.okvir === 'dashed', p);
  await nicZakritih('oznaka in izbira');
  await b.posnetek(path.join(mapa, `oznake-izbira-${sirina}.png`));
  await b.tipka('Escape');
  await klikniGumb(b, 'Preveri');
  await b.cakaj(`document.querySelector('.fb.ok')`);
  p = await b.izvedi(`({ vzorec: getComputedStyle(vadi.plosca.mreza.celice[${k.cells[0]}]).backgroundColor, legenda: getComputedStyle(document.querySelector('.fb .sw-vzorec')).backgroundColor,
    oznak: vadi.plosca.mreza.celice.filter(c => c.classList.contains('zaznamovana')).length, sirina: document.documentElement.scrollWidth })`);
  preveri('rešena vaja: oznake ostanejo, podlaga vzorca in legenda #EFD8A0', p.oznak === k.cells.length && p.vzorec === 'rgb(239, 216, 160)' && p.legenda === p.vzorec, p);
  preveri('brez vodoravnega drsnika', p.sirina === sirina, p.sirina);
  await nicZakritih('rešena vaja');
  await b.posnetek(path.join(mapa, `oznake-resena-${sirina}.png`));
  // Najslabši primer (sestavljen v DOM-u): v vsaki prazni celici vseh 9 kandidatov, označene
  // vse celice in obe šahovnici (vsaka meja označena / neoznačena celica v obe smeri).
  k = await nalozi();
  await b.izvedi(`(() => { for (const c of vadi.plosca.mreza.celice) c.querySelectorAll('.kand').forEach((s, j) => { if (!s.textContent) s.textContent = j + 1; }); return true; })()`);
  for (const [opis, pogoj] of [['vse označene', 'true'], ['šahovnica 1', '(r + s) % 2 === 0'], ['šahovnica 2', '(r + s) % 2 === 1']]) {
    await b.izvedi(`(() => { vadi.plosca.mreza.celice.forEach((c, i) => { const r = Math.floor(i / 9), s = i % 9; c.classList.toggle('zaznamovana', ${pogoj}); }); return true; })()`);
    await nicZakritih(`najslabši primer, ${opis}, vsi kandidati`);
  }
  // Oznaka na vseh štirih barvah poudarka: po ena polna celica števk 3, 1, 2, 6 ("več hkrati").
  k = await nalozi();
  await oznaciVzorec(k);
  await izbrisi(k);
  await b.klikni('.vaja-uganka .poudari-glava .vec-hkrati input');
  for (const d of [3, 1, 2, 6]) await b.klikni(`.vaja-uganka .niz-poudari button:nth-child(${d})`);
  if (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) await b.klikni('.vaja-uganka .glava-s-kljukico input');
  const polne = await b.izvedi(`[3, 1, 2, 6].map(d => vadi.stanje.grid.findIndex((x, i) => x === d && i >= 9 && i < 72))`);
  for (const c of polne) { await b.klikni(celicaSel(c)); await b.tipka('o', { code: 'KeyO' }); }
  p = await b.izvedi(`${JSON.stringify(polne)}.map(i => { const c = vadi.plosca.mreza.celice[i];
    return { cls: c.className, podlaga: getComputedStyle(c).backgroundColor, okvir: getComputedStyle(c, '::after').borderTopColor }; })`);
  const barve = p.map(x => x.podlaga);
  preveri('štiri polne celice v štirih barvah poudarka, označene', new Set(barve).size === 4 && p.every(x => /poud-stevka/.test(x.cls) && /zaznamovana/.test(x.cls)), p);
  const kontrasti = p.map(x => +kontrast(x.okvir, x.podlaga).toFixed(1));
  preveri('kontrast okvirja z barvo poudarka vsaj 3', kontrasti.every(x => x >= 3), kontrasti);
  // Okvir je na posnetku res narisan nad podlago poudarka: v vsaki od štirih celic ga je
  // videti (piksli, ki jih okvir spremeni).
  const A = await posnetekMreze(b, OKVIR_SKRIT), F = await posnetekMreze(b, '');
  const vidno = await b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [a, f] = await Promise.all([${JSON.stringify(A.b64)}, ${JSON.stringify(F.b64)}].map(slika));
    return ${JSON.stringify(polne)}.map(i => { const q = vadi.plosca.mreza.celice[i].getBoundingClientRect(); let n = 0;
      for (let y = Math.ceil(q.top + scrollY - ${F.y}); y < q.bottom + scrollY - ${F.y}; y++) for (let x = Math.ceil(q.left + scrollX - ${F.x}); x < q.right + scrollX - ${F.x}; x++) {
        const k = (y * f.width + x) * 4; if (Math.abs(a.data[k] - f.data[k]) + Math.abs(a.data[k + 1] - f.data[k + 1]) + Math.abs(a.data[k + 2] - f.data[k + 2]) > 60) n++; }
      return n; });
  })()`);
  preveri('okvir viden na vseh štirih barvah poudarka', vidno.every(n => n >= 20), vidno);
  await posnetekMreze(b, '');
  await nicZakritih('oznake na štirih barvah poudarka');
  await b.posnetek(path.join(mapa, `oznake-poudarek-${sirina}.png`));
  // Podlagi v "Spoznaj" (E1, E2, 1 in 2 - mreže iz shared/mreza.js) iz istih spremenljivk.
  p = await b.izvedi(`(() => { const r = {};
    for (const ovoj of ['vaja-presek', 'vaja-enojcek']) { const o = document.createElement('div'); o.className = ovoj; o.innerHTML = '<div class="mreza"><div class="celica k-vzorec"></div><div class="celica k-izbris"></div></div>';
      document.body.appendChild(o); r[ovoj] = [...o.querySelectorAll('.celica')].map(c => getComputedStyle(c).backgroundColor).join(' / '); o.remove(); }
    return r; })()`);
  preveri('»Spoznaj« (1, 2, E1, E2): podlagi kot v »Vadi v uganki«', Object.values(p).every(x => x === 'rgb(239, 216, 160) / rgb(240, 180, 170)'), p);
}

// "Spoznaj" 3-12 (docs/oznake-nacrt.md, O2): mreže sestavljenih vaj (.gc, .xw-cell). "Rešitev
// (drži)" s pravim pritiskom miške (gumb se odzove na mousedown/mouseup) - podlagi vzorca in
// izbrisa, kontrast vsega besedila v teh celicah (zelene celice pravilnega odgovora - .correct - so
// nespremenjene in se ne merijo); pravilen odgovor pri 3, 7 in 11 s pravimi
// kliki na celice, ki jih je pokazala "Rešitev" - podlaga izbrisa po odgovoru.
const SPOZNAJ_3_12 = TEHNIKE.filter(m => !ENOJCKA.includes(m) && !PRESEK.includes(m));
const ODGOVOR_3_12 = ['naked-pair', 'x-wing', 'xy-wing'];
// Stran pred pritiskom ne sme biti pomaknjena do konca: okvir z rešitvijo, ki se ob pritisku
// pokaže pod gumbom, jo sicer zamakne za svojo višino, gumb uide izpod miške in mouseleave
// rešitev skrije (tudi v izhodišču 4e1e4dc - docs/oznake-nacrt.md, razdelek 8). Prostor pod
// vsebino to prepreči, mreže ne spremeni.
// Od naloge trening-ucenje (korak 1, docs/trening-ucenje-nacrt.md) je »Rešitev« stikalo: pravi
// klik jo odpre, pravi klik na »Skrij rešitev« zapre (prostor pod vsebino ni več potreben).
// Pritisk miške ostane za gumb »Rešitev (drži)« (izhodišče).
async function klikniPomoc(b, napis) {
  await b.izvedi(`[...document.querySelectorAll('.peek-btn')].find(x => x.textContent === ${JSON.stringify(napis)}).setAttribute('data-klik', '1'); true`);
  await b.klikni('.peek-btn[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
}
async function drziResitev(b, fn) {
  if (!(await b.izvedi(`[...document.querySelectorAll('.peek-btn')].some(x => x.textContent === 'Rešitev (drži)')`))) {
    await klikniPomoc(b, 'Rešitev');
    try { return await fn(); } finally { await klikniPomoc(b, 'Skrij rešitev'); }
  }
  await b.izvedi("document.body.style.paddingBottom = '800px'; true");
  const t = await b.izvedi(`(() => { const g = [...document.querySelectorAll('.peek-btn')].find(x => x.textContent === 'Rešitev (drži)');
    g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  try { return await fn(); } finally {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  }
}
// Podlage celic z danimi razredi in najmanjši kontrast besedila v njih (vsak element z
// lastnim vidnim besedilom proti podlagi celice).
const podlageInKontrast = razredi => `(() => { const kontrast = ${kontrast.toString()};
  const celice = [...document.querySelectorAll(${JSON.stringify(razredi.map(r => '#exerciseArea ' + r).join(', '))})];
  let najmanj = 99, kje = '';
  for (const c of celice) { const bg = getComputedStyle(c).backgroundColor;
    for (const e of [c, ...c.querySelectorAll('*')]) {
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(e); if (s.visibility !== 'visible') continue;
      const k = kontrast(s.color, bg); if (k < najmanj) { najmanj = k; kje = (e.className || e.tagName) + ': ' + s.color + ' na ' + bg; } } }
  return { razredi: Object.fromEntries(${JSON.stringify(razredi)}.map(r => [r, [...new Set([...document.querySelectorAll('#exerciseArea ' + r)].map(c => getComputedStyle(c).backgroundColor))]])),
    stevilo: Object.fromEntries(${JSON.stringify(razredi)}.map(r => [r, document.querySelectorAll('#exerciseArea ' + r).length])),
    najmanj: +najmanj.toFixed(2), kje, sirina: document.documentElement.scrollWidth }; })()`;
const VZOREC_BG = 'rgb(239, 216, 160)', IZBRIS_BG = 'rgb(240, 180, 170)';
// Celice .gc in .xw-cell imajo prehod podlage (0,12 s) - barvo beri, ko se konča.
const poPrehodu = b => b.izvedi('new Promise(r => setTimeout(() => r(true), 300))');
async function oznakeSpoznaj(b, sirina) {
  console.log(`Spoznaj 3-12, podlagi vzorca in izbrisa, ${sirina} px`);
  for (const m of SPOZNAJ_3_12) {
    await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
    await b.izvedi(SEME(4242));
    await spremljajVajo(b);
    await b.klikni(`.menu-card[data-mode="${m}"]`);
    await odmakniMisko(b);
    const p = await drziResitev(b, async () => {
      // Celice vzorca si zapomni za odgovor (po spustu oznak ni več).
      await b.izvedi(`document.querySelectorAll('#exerciseArea .peek-hl').forEach((c, i) => c.dataset.cilj = i); true`);
      await poPrehodu(b);
      // Pri edinstvenem pravokotniku je celica izbrisa tudi celica vzorca - prednost ima vzorec
      // (kot pred nalogo), zato se izbris meri na celicah, ki niso vzorec.
      const r = await b.izvedi(podlageInKontrast(['.peek-hl', '.peek-elim:not(.peek-hl)', '.peek-elim']));
      r.obroba = await b.izvedi(`[...new Set([...document.querySelectorAll('#exerciseArea .peek-hl')].map(c => getComputedStyle(c).boxShadow))]`);
      await b.posnetek(path.join(mapa, `spoznaj-${m}-resitev-${sirina}.png`));
      return r;
    });
    const vz = p.razredi['.peek-hl'], iz = p.razredi['.peek-elim:not(.peek-hl)'];
    preveri(`${m}: »Rešitev (drži)« – vzorec ${p.stevilo['.peek-hl']} celic #EFD8A0 z obrobo #C8A020, izbris ${p.stevilo['.peek-elim:not(.peek-hl)']} celic #F0B4AA`,
      p.stevilo['.peek-hl'] > 0 && vz.length === 1 && vz[0] === VZOREC_BG && p.obroba.every(o => o.startsWith('rgb(200, 160, 32)'))
        && iz.every(x => x === IZBRIS_BG), p);
    preveri(`${m}: besedilo v celicah vzorca in izbrisa s kontrastom vsaj 3 (najmanj ${p.najmanj})`, p.najmanj >= 3, p.kje);
    preveri(`${m}: brez vodoravnega drsnika`, p.sirina === sirina, p.sirina);
    if (!ODGOVOR_3_12.includes(m)) continue;
    const n = await b.izvedi(`document.querySelectorAll('#exerciseArea [data-cilj]').length`);
    for (let i = 0; i < n; i++) await b.klikni(`#exerciseArea [data-cilj="${i}"]`);
    await dokoncajOdgovor(b);
    await poPrehodu(b);
    const q = await b.izvedi(podlageInKontrast(['.elimcell', '.xw-elim']));
    q.pravilnih = await b.izvedi(`document.querySelectorAll('#exerciseArea .correct, #exerciseArea .xw-correct').length`);
    q.ok = await b.izvedi(`!!document.querySelector('#exerciseArea .fb.ok')`);
    const elim = [...q.razredi['.elimcell'], ...q.razredi['.xw-elim']];
    preveri(`${m}: pravilen odgovor – izbrane celice zelene, izbris #F0B4AA (${q.stevilo['.elimcell'] + q.stevilo['.xw-elim']} celic)`,
      q.ok && q.pravilnih === n && elim.every(x => x === IZBRIS_BG) && (m === 'naked-pair' || elim.length === 1), q);
    if (elim.length) preveri(`${m}: po odgovoru besedilo v celicah izbrisa s kontrastom vsaj 3 (najmanj ${q.najmanj})`, q.najmanj >= 3, q.kje);
    await b.posnetek(path.join(mapa, `spoznaj-${m}-pravilno-${sirina}.png`));
  }
}
// Vsi razredi oznak v mrežah 3-12 (tudi tisti, ki jih zgoraj ni na posnetih vajah).
async function oznakeSpoznajRazredi(b) {
  console.log('Spoznaj 3-12: razredi oznak');
  await b.odpri('trening/index.html', { sirina: 1280, visina: 900 });
  const p = await b.izvedi(`(() => { const o = document.createElement('div'); o.id = 'exerciseArea2';
    o.innerHTML = ['gc peek-hl', 'xw-cell peek-hl', 'gc peek-elim', 'xw-cell peek-elim', 'gc elimcell', 'xw-cell xw-elim', 'gc correct', 'xw-cell xw-correct']
      .map(r => '<div class="' + r + '"><span class="cd">1</span><span class="cd elim">2</span><span class="cd hl hl-plum">3</span></div>').join('');
    document.body.appendChild(o);
    const r = Object.fromEntries([...o.children].map(c => [c.className, [getComputedStyle(c).backgroundColor, ...[...c.children].map(s => getComputedStyle(s).color)].join(' / ')]));
    o.remove(); return r; })()`);
  const pricakovano = {
    'gc peek-hl': `${VZOREC_BG} / rgb(74, 85, 97) / rgb(178, 58, 46) / rgb(138, 47, 122)`,
    'xw-cell peek-hl': VZOREC_BG,
    'gc peek-elim': `${IZBRIS_BG} / rgb(74, 85, 97) / rgb(178, 58, 46) / rgb(138, 47, 122)`,
    'xw-cell peek-elim': IZBRIS_BG,
    'gc elimcell': `${IZBRIS_BG} / rgb(74, 85, 97) / rgb(178, 58, 46) / rgb(138, 47, 122)`,
    'xw-cell xw-elim': IZBRIS_BG,
    'gc correct': 'rgb(220, 238, 229) / rgb(138, 148, 160) / rgb(178, 58, 46) / rgb(138, 47, 122)',
    'xw-cell xw-correct': 'rgb(220, 238, 229)',
  };
  for (const [r, v] of Object.entries(pricakovano)) {
    preveri(`.${r.replace(' ', '.')}: ${v.split(' / ')[0]}${r.startsWith('gc') ? ', kandidati' : ''}`, p[r].startsWith(v), p[r]);
  }
}

// Igra: podlagi vzorca in izbrisa ostaneta (--amber-bg, --red-bg), male števke brez plasti.
async function oznakeIgra(b) {
  console.log('igra: podlagi oznak koraka nespremenjeni');
  await b.odpri('igra/index.html', { sirina: 1280, visina: 900 });
  const p = await b.izvedi(`(() => { const o = document.createElement('div'); o.className = 'mreza';
    o.innerHTML = '<div class="celica k-vzorec"><div class="kandidati"></div></div><div class="celica k-izbris"></div>'; document.body.appendChild(o);
    const c = [...o.querySelectorAll('.celica')], m = getComputedStyle(o.querySelector('.kandidati'));
    const r = { podlagi: c.map(e => getComputedStyle(e).backgroundColor).join(' / '), stevke: m.position + ' ' + m.zIndex }; o.remove(); return r; })()`);
  preveri('igra: podlagi #F1E5C9 / #F3DEDA, male števke brez z-index', p.podlagi === 'rgb(241, 229, 201) / rgb(243, 222, 218)' && p.stevke === 'static auto', p);
}

// "Več celic" pri 1-12 privzeto vklopljen (popravek po ročnem pregledu faze 6; prej po tehniki -
// točka 18 - pri edinstvenem pravokotniku izklopljen).
async function vecCelicPrivzeto(b) {
  console.log('»Več celic« privzeto vklopljen');
  await vadi(b, 'unique-rectangle', 375, { banka: true });
  preveri('»več celic« pri edinstvenem pravokotniku privzeto vklopljen', (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) === true);
}

async function banka(b) {
  console.log('Banka ob preseženi meji');
  await vadi(b, 'swordfish', 375, { banka: true });
  preveri('vaja iz banke', (await b.izvedi('vadi.v.izvor.vrsta')) === 'banka');
  preveri('v S0 je naslednji korak Mečarica', (await b.izvedi('nextStep(vadi.v.S0.deska).technique')) === 'Swordfish');
  // Izbira po stopnji (točka 16): najprej uganka osnovne stopnje tehnike (Težka).
  preveri('uganka osnovne stopnje (Težka) in oznaka', (await b.izvedi(`vadi.v.stopnja === 'Težka' && document.querySelector('.vaja-info span').textContent === 'Uganka: Težka'`)) === true);
  preveri('izvor v title', /^Vaja iz banke \(seme \d+\)$/.test(await b.izvedi(`document.querySelector('.vaja-info span').title`)));
}

// "Spoznaj": prva vaja vsake tehnike z istim semenom - innerHTML in izračunani slogi.
const SLOGI = ['width', 'height', 'background-color', 'color', 'font-size', 'font-weight', 'font-family',
  'border-top-width', 'border-left-color', 'box-shadow', 'display', 'visibility', 'margin-top', 'padding-left',
  'text-decoration-line'];
async function izris(b, mode, sirina) {
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(SEME(4242));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await vaja3(b, SEME(4242)); // vaji 1 in 2 sta po shemi - primerja se vaja 3
  await odmakniMisko(b); // :hover s prehodom pod miško ne sme vplivati na primerjavo
  // Pisave (Google Fonts, tudi latin-ext za č/š/ž) se lahko naložijo šele po kliku - širina
  // besedila bi se razlikovala zaradi nalaganja, ne zaradi kode.
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    // Razdelek »Shema« (faza 3a) v izhodišču ni - med meritvijo je skrit (višina kartice je
    // potem kot v izhodišču), primerja se vse drugo. Enako vrstica z imenom tehnike (.ex-label):
    // od popravkov po koraku 1 faze 3a je večja in temna. Razdelek .phase2 (izbira števk pri 4 in 6) je
    // samo v izhodiščih pred nalogo 4b, korak 2 (docs/izbris-nacrt.md, O5) - izvzet izrecno.
    ${NAVODILA_NAZAJ}
    const a = document.getElementById('exerciseArea'), k = a.cloneNode(true);
    k.querySelectorAll('.shema-razdelek, .peek-row, .phase2').forEach(e => e.remove());
    const sk = [...a.querySelectorAll('.shema-razdelek, .ex-label, .peek-row, .phase2')]; sk.forEach(e => { e.style.display = 'none'; });
    const slogi = [...a.querySelectorAll('*')].filter(e => !e.closest('.shema-razdelek, .ex-label, .peek-row, .phase2')).map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    sk.forEach(e => { e.style.display = ''; });
    return { html: k.innerHTML, slogi };
  })()`);
}

// Izvleček commita v začasno mapo in brskalnik nad njim.
async function izhodisceBrskalnik(commit) {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), commit], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  return { star, b: await zazeni({ koren: star }) };
}

async function spoznaj(sirine) {
  const izh = { [izhodisce]: await izhodisceBrskalnik(izhodisce) };
  if (izhodiscePresek && !izh[izhodiscePresek]) izh[izhodiscePresek] = await izhodisceBrskalnik(izhodiscePresek);
  if (izhodisceEnojcki && !izh[izhodisceEnojcki]) izh[izhodisceEnojcki] = await izhodisceBrskalnik(izhodisceEnojcki);
  const bNov = await zazeni();
  try {
    for (const sirina of sirine) {
      console.log(`Spoznaj, ${sirina} px (izhodišče ${izhodisce}; 1 in 2: ${izhodiscePresek || 'brez primerjave'}; E1 in E2: ${izhodisceEnojcki || 'brez primerjave'})`);
      for (const m of TEHNIKE) {
        const commit = PRESEK.includes(m) ? izhodiscePresek : ENOJCKA.includes(m) ? izhodisceEnojcki : izhodisce;
        if (!commit) { console.log(`  - ${m}: brez izhodišča (točka 16 ali 17)`); continue; }
        const s = await izris(izh[commit].b, m, sirina);
        const n = await izris(bNov, m, sirina);
        const razl = razlikeIzrisa(s, n, SLOGI);
        preveri(`${m}: izris enak (${commit})`, razl.length === 0, razl);
      }
    }
  } finally {
    for (const { star, b } of Object.values(izh)) {
      await b.zapri();
      for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
      fs.rmSync(star, { recursive: true, force: true });
    }
    await bNov.zapri();
  }
  for (const n of bNov.napake) { console.log(`  ✗ ${n}`); napak++; }
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    await meni(b);
    for (const sirina of [375, 1200]) {
      for (const mode of ['hidden-pair', 'swordfish', 'unique-rectangle']) await vaja1do12(b, mode, sirina);
      for (const mode of ENOJCKA) await enojcek(b, mode, sirina);
      await odgovor1do12(b, sirina);
      await pomoc1do12(b, sirina);
      await sencenjeE2(b, sirina);
      await obmocje(b, sirina);
      await zaznamki(b, sirina);
    }
    for (const sirina of [375, 1280]) await oznake(b, sirina);
    for (const sirina of [375, 1280]) await oznakeSpoznaj(b, sirina);
    await oznakeSpoznajRazredi(b);
    await oznakeIgra(b);
    await banka(b);
    await vecCelicPrivzeto(b);
    await predlogSiv(b);
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
