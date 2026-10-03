'use strict';
// Trening »Vadi v uganki« (trening/v-uganki.js, docs/vadi-v-uganki-nacrt.md) v pravem
// brskalniku, pri širini 375 in 1200 px: gumba načina na vseh karticah (klik kartice je
// "Spoznaj"), "Iščem vajo …" in vaja (sproti in iz banke), plošča v
// kartici brez vodoravnega drsnika (tudi z vsemi tremi seznami), kandidati pri 1-12,
// prečrtani kandidati (izračunan slog), E1/E2 brez kandidatov, pravi kliki, brez napak
// JS; odgovor pri 1-12 in E1/E2 (predlog) s pravimi kliki in tipkami (pari QWERTZ), pomoč,
// senčenje pri E2; posnetki zaslona v mapi (--mapa, privzeto začasna).
//
// "Spoznaj" mora ostati enak: z Math.random s semenom se prva vaja vseh 14 tehnik
// izriše v izhodišču (izvleček commita --izhodisce z git archive, privzeto 5b9ae6f -
// zadnji commit pred delom 6) in v trenutni kodi; primerja se innerHTML območja vaje in
// izračunani slogi vseh njegovih elementov (meni ima od dela 6 gumba načina).
//
// Vaji 1 in 2 imata od točke 16 (izbira uganke po stopnji) svoje izhodišče
// (--izhodisce-presek, privzeto IZHODISCE_PRESEK spodaj).
//
//   node tools/preveri-vadi-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>] [--izhodisce-presek <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa } = require('./primerjava-slogov.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-vadi'));
const izhodisce = arg('--izhodisce', '5b9ae6f');
// Vaji 1 in 2 v "Spoznaj" sta od izbire uganke po stopnji (načrt, točka 16) iz drugih ugank
// banke, zato imata svoje izhodišče (prazno = ne primerjata se).
const IZHODISCE_PRESEK = 'dd316bd';
const izhodiscePresek = arg('--izhodisce-presek', IZHODISCE_PRESEK);
// E1 in E2 v "Spoznaj" imata od točke 17 (okvir območja pri vajah 1-6) svoje izhodišče
// (prazno = ne primerjata se).
const IZHODISCE_ENOJCKI = '0d457e8';
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
    preveri('besedilo: prečrtani niso del naloge', /^Prečrtane kandidate \(\d+\) so odstranili prejšnji koraki – niso del naloge\.$/.test(await b.izvedi(`document.querySelector('.prej-odstranjeni').textContent`)));
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
  preveri('pravilen predlog: poteza vpis, zelena celica', p.fb === 'fb ok' && p.grid === kd && p.razred.includes('k-vpis') && p.bg === 'rgb(210, 237, 223)', p);
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
  preveri('legenda: celice vzorca, izbrisani kandidati', leg && leg.visina > 0 && /celice vzorca.*izbrisani kandidati \(odstranjeni\)/.test(leg.besedilo), leg);
  preveri('Razveljavi/Ponovi/Začni znova skriti', p.akcije === 0, p.akcije);
  preveri('izbrisi koraka rdeče prečrtani', p.kIzbris === 'kand precrtan k-izbris' && p.barva === 'rgb(176, 46, 46)' && p.crta === 'line-through', p);
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
  preveri('Rešitev: sporočilo koraka in oznake na mreži', p.besedilo.startsWith('Rešitev: ') && p.izbris === 'rgb(176, 46, 46)' && p.vzorec > 0, p);
  preveri('Rešitev: opravljeni izbris v seznamu', /Opravljeno: \d+ od \d+/.test(p.besedilo) || /Korak je izveden/.test(p.besedilo), p.besedilo);
  preveri('pomoč v kartici, brez drsnika', p.vKartici && p.sirina === sirina, p);
  await b.posnetek(path.join(mapa, `hidden-pair-resitev-${sirina}.png`));
  await klikniGumb(b, 'Skrij');
  p = await b.izvedi(`({ skrito: document.querySelector('.vadi-pomoc').hidden, oznak: document.querySelectorAll('.vaja-uganka .k-vzorec, .vaja-uganka .k-izbris').length })`);
  preveri('Skrij: okvir in oznake izginejo', p.skrito && p.oznak === 0, p);
}

// Območje pri vaji 1: enota modrikasta (1-6), števka poudarjena (7-9), pivot, bloka.
async function obmocje(b, sirina) {
  for (const [mode, vrsta] of [['hidden-pair', 'enota'], ['x-wing', 'stevke'], ['xy-wing', 'pivot'], ['unique-rectangle', 'bloki']]) {
    console.log(`${mode}, območje, ${sirina} px`);
    await vadi(b, mode, sirina, { banka: true, seme: 3 });
    const o = await b.izvedi(`(() => { const c = vadi.plosca.mreza.celice, ob = vadi.ob;
      const ozn = c.filter(x => x.classList.contains('oznacena'));
      const poud = ob.stevke ? ob.stevke.map(d => [...document.querySelectorAll('.vaja-uganka .niz-poudari button')][d - 1].getAttribute('aria-pressed')) : [];
      return { vrsta: ob.vrsta, navodilo: document.querySelector('.exercise h3').textContent, oznacenih: ozn.length, pricakovanih: ob.celice ? ob.celice.length : 0,
        barva: ozn.length ? getComputedStyle(ozn.find(x => !x.classList.contains('dana') && !x.classList.contains('vpis')) || ozn[0]).backgroundColor : null, poud,
        sirina: document.documentElement.scrollWidth }; })()`);
    preveri(`${mode}: vrsta območja ${vrsta}`, o.vrsta === vrsta, o.vrsta);
    preveri(`${mode}: navodilo pove območje`, !/^Poišči korak tehnike/.test(o.navodilo), o.navodilo);
    if (vrsta === 'stevke') preveri(`${mode}: števka poudarjena`, o.poud.length && o.poud.every(x => x === 'true'), o.poud);
    else preveri(`${mode}: območje modrikasto`, o.oznacenih === o.pricakovanih && o.barva === 'rgb(227, 238, 251)', o);
    // Točka 17: okvir ob robu območja (::before, 3 px temen) in temne oznake roba; pri
    // števkah obroč na gumbu v nizu Poudari. Okvir ostane ob izbrani celici in poudarku.
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
      preveri(`${mode}: obroč števke v nizu Poudari`, k.obroc.length === 1 && k.obroc[0].includes('rgb(29, 63, 107)'), k.obroc);
    } else {
      preveri(`${mode}: okvir 3 px temen`, k.robnih > 0 && k.okvir.length === 1 && k.okvir[0] === '3px rgb(29, 63, 107)', k);
      preveri(`${mode}: oznake roba v temnem polju`, k.stOznak > 0 && k.oznake.length === 1 && k.oznake[0] === 'rgb(29, 63, 107) rgb(255, 255, 255)', k);
      if (k.izbranaOkvir !== null) preveri(`${mode}: okvir viden tudi na izbrani celici`, k.izbranaOkvir !== '0px0px', k.izbranaOkvir);
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
    return { n: c.length, izbrane: vadi.plosca.izbrane.length, slog: c.length ? getComputedStyle(c[0]).outlineStyle + ' ' + getComputedStyle(c[0]).outlineColor : '' }; })()`);
  preveri('zaznamovane celice vzorca, izbira prazna', z.n === k.cells.length && z.izbrane === 0, z);
  preveri('oranžna črtkana obroba', z.slog === 'dashed rgb(180, 83, 9)', z.slog);
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

// "Več celic" privzeto po tehniki (točka 18): izklopljen pri edinstvenem pravokotniku.
async function vecCelicPrivzeto(b) {
  console.log('»Več celic« privzeto po tehniki');
  await vadi(b, 'unique-rectangle', 375, { banka: true });
  preveri('»več celic« pri edinstvenem pravokotniku privzeto izklopljen', (await b.izvedi(`document.querySelector('.vaja-uganka .glava-s-kljukico input').checked`)) === false);
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
  // Pisave (Google Fonts, tudi latin-ext za č/š/ž) se lahko naložijo šele po kliku - širina
  // besedila bi se razlikovala zaradi nalaganja, ne zaradi kode.
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    const a = document.getElementById('exerciseArea');
    const slogi = [...a.querySelectorAll('*')].map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    return { html: a.innerHTML, slogi };
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
