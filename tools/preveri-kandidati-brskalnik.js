'use strict';
// Stikalo »Kandidati v celicah« v pravem brskalniku (naloga 5a,
// docs/kandidati-stikalo-nacrt.md): igra pri 375 in 1280 px v obeh stanjih stikala -
// kartica »Prikaz«, mreža z kandidati in brez njih, skrit niz »Odstrani« (izračunan
// slog), vseh 9 števk v nizu »Vpiši«, zavrnjen vpis z razlogom, Shift+števka (par
// QWERTZ) in Ctrl+klik brez učinka, vpis kandidata s tipko, poudarek samo vpisanih
// števk, korak na tretji stopnji (kandidati samo v celicah koraka, rdeče prečrtan
// izbris, opomba) in gumb »Vklopi kandidate« (vklopi in shrani, korak ostane, izbrisi
// s pravimi kliki), shranjevanje (osvežitev strani v obeh stanjih), brez vodoravnega
// preliva. Nato trening in reševalec z izklopljeno nastavitvijo igre: trening ostane
// kakor brez nje (»Vadi v uganki« 4 s kandidati, »Spoznaj« E1 brez), stikala nimata,
// ključa ne spremenita. Brez napak JS. Posnetki zaslona v mapo (--mapa).
//
//   node tools/preveri-kandidati-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-kandidati');
const D = JSON.stringify(loadPuzzles()[0].danosti.replace(/\./g, '0'));
const KLJUC = 'sudoku.igra.kandidati';
// Shift+števka na slovenski razporeditvi (key je znak na tipki, code fizična tipka).
const QWERTZ = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

const celicaSel = c => `#mreza .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]`;

// Pravi klik s pritisnjeno tipko Ctrl (brskalnik.js klikne brez modifikatorjev).
async function klikniCtrl(b, izbirnik) {
  const t = await b.izvedi(`(() => { const el = document.querySelector(${JSON.stringify(izbirnik)});
    el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type, x: t.x, y: t.y, button: 'left', clickCount: 1, modifiers: 2 });
  }
}

// Gumb v kartici Pomoč po napisu - pravi klik.
async function klikniGumbPomoci(b, napis) {
  const ima = await b.izvedi(`(() => { const g = [...document.querySelectorAll('#pomocVsebina button')].find(x => x.textContent === ${JSON.stringify(napis)});
    if (g) g.setAttribute('data-klik', '1'); return !!g; })()`);
  if (!ima) return false;
  await b.klikni('#pomocVsebina button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
  return true;
}

const stanjeIgreStrani = b => b.izvedi(`(() => ({
  stikalo: document.getElementById('stikaloKandidati').checked,
  shramba: localStorage.getItem(${JSON.stringify(KLJUC)}),
  kand: document.querySelectorAll('#mreza .kand:not(:empty)').length,
  pricakovanih: stanje.kandidati.reduce((s, m) => s + [1,2,3,4,5,6,7,8,9].filter(d => m & (1 << d)).length, 0),
  odstrani: getComputedStyle(document.getElementById('nizOdstrani')).display,
  glava: getComputedStyle(document.getElementById('odstraniGlava')).display,
  preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  razlog: document.getElementById('razlogNizov').textContent,
  vpisiOmogocenih: [...document.querySelectorAll('#nizVpisi button')].filter(g => !g.disabled).length,
  poteze: igra.poteze.length,
}))()`);

async function igraStikalo(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const mobilno = sirina < 500;
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  await b.izvedi(`dodajVZbirko(${D}, 'Težka', 'generator'); zacniIgro(${D}); true`);

  // Kartica »Prikaz«: kljukica, pod njo oznaka »Manjkajoče števke« in stikala seznamov.
  const kartica = await b.izvedi(`(() => { const k = document.getElementById('stikaloKandidati').closest('.card');
    const st = k.querySelector('.seznami-stikala');
    return { naslov: k.querySelector('h2').textContent, napis: document.getElementById('stikaloKandidati').parentElement.textContent.trim(),
      oznaka: st.children[1].textContent, stikala: st.querySelectorAll('input').length }; })()`);
  preveri('kartica »Prikaz« s kljukico »Kandidati v celicah«, oznako in tremi stikali',
    kartica.naslov === 'Prikaz' && kartica.napis === 'Kandidati v celicah' && kartica.oznaka === 'Manjkajoče števke' && kartica.stikala === 4, kartica);

  let s = await stanjeIgreStrani(b);
  preveri('privzeto vklopljeno: kandidati v praznih celicah, niz Odstrani viden',
    s.stikalo && s.shramba === null && s.kand > 0 && s.kand === s.pricakovanih && s.odstrani !== 'none' && s.glava !== 'none', s);
  preveri('vklopljeno: brez vodoravnega preliva', !s.preliv);

  // Izklop s pravim klikom.
  await b.klikni('#stikaloKandidati');
  s = await stanjeIgreStrani(b);
  preveri('izklop: brez kandidatov v mreži, shranjeno, niz in oznaka Odstrani skrita',
    !s.stikalo && s.shramba === 'false' && s.kand === 0 && s.odstrani === 'none' && s.glava === 'none', s);
  preveri('izklopljeno: brez vodoravnega preliva', !s.preliv);
  await b.posnetek(path.join(mapa, `igra-${sirina}-izklop.png`));

  // Prazna celica, v vrstici katere je dana števka, ki ni kandidat; druga prazna celica.
  const I = await b.izvedi(`(() => {
    const c = stanje.grid.findIndex((v, i) => !v && ROWS[Math.floor(i / 9)].some(x => stanje.grid[x]));
    const kje = ROWS[Math.floor(c / 9)].find(x => stanje.grid[x]);
    const druga = stanje.grid.findIndex((v, i) => !v && i !== c);
    return { c, d: stanje.grid[kje], kje: cellLabel(kje), vrstica: Math.floor(c / 9) + 1, kand: stanje.kandidati[c],
      druga, resDruga: resitev()[druga] };
  })()`);
  await b.klikni(celicaSel(I.c));
  s = await stanjeIgreStrani(b);
  preveri('izbrana prazna celica: v nizu Vpiši vseh 9 števk', s.vpisiOmogocenih === 9, s.vpisiOmogocenih);
  const poteze = s.poteze;
  await b.klikni(`#nizVpisi button:nth-child(${I.d})`);
  s = await stanjeIgreStrani(b);
  preveri('števka v vrstici: ni vpisa, razlog pod nizi',
    s.poteze === poteze && s.razlog === `Števka ${I.d} je v vrstici ${I.vrstica} že vpisana (${I.kje}).`, s.razlog);
  const kd = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => I.kand & (1 << d));
  await b.tipka(QWERTZ[kd], { code: `Digit${kd}`, shift: true });
  preveri('Shift+števka (QWERTZ) ne naredi nič',
    (await b.izvedi(`stanje.kandidati[${I.c}]`)) === I.kand && (await stanjeIgreStrani(b)).poteze === poteze);
  await klikniCtrl(b, celicaSel(I.druga));
  preveri('Ctrl+klik ne doda celice v izbiro', JSON.stringify(await b.izvedi('plosca.izbrane')) === JSON.stringify([I.druga]));
  await b.tipka(String(I.resDruga), { code: `Digit${I.resDruga}` });
  preveri('tipka s števko vpiše kandidata', (await b.izvedi(`stanje.grid[${I.druga}]`)) === I.resDruga && (await stanjeIgreStrani(b)).poteze === poteze + 1);

  // Poudarek: podlago poudarka imajo samo celice z vpisano števko, prazne ne.
  await b.klikni(`#nizPoudari button:nth-child(${I.resDruga})`);
  const p = await b.izvedi(`(() => { const d = ${I.resDruga}; const bg = i => getComputedStyle(plosca.mreza.celice[i]).backgroundColor;
    const zD = [...Array(81).keys()].filter(i => stanje.grid[i] === d).map(bg);
    const prazne = [...Array(81).keys()].filter(i => !stanje.grid[i]).map(bg);
    return { barva: zD[0], enake: zD.every(x => x === zD[0]), vPraznih: prazne.filter(x => x === zD[0]).length }; })()`);
  preveri('poudarek obarva samo vpisane in dane števke', p.enake && p.barva !== 'rgb(255, 255, 255)' && p.vPraznih === 0, p);
  await b.klikni(`#nizPoudari button:nth-child(${I.resDruga})`);
  await b.izvedi('plosca.pocistiIzbiro(); izrisi(); true');

  // Enojčki do koraka z izbrisom, nato »Naslednji korak« do tretje stopnje.
  await b.izvedi(`(() => { for (;;) { const k = nextStep(stanje.deska, ALL_TECHNIQUES); if (!k || k.eliminate.length) break;
    for (const [c, d] of k.assign) plosca.izvedi({ tip: 'vpis', celica: c, stevka: d }); } return true; })()`);
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.korak');
  await b.klikni('#korakBtn');
  await b.klikni('#korakBtn');
  const K = await b.izvedi(`(() => { const k = pomoc.korak; const vpis = new Set(k.assign.map(([c]) => c));
    const vKoraku = new Set([...k.cells, ...k.eliminate.map(([c]) => c)].filter(c => !vpis.has(c)));
    const zKand = [...Array(81).keys()].filter(i => plosca.mreza.celice[i].querySelector('.kand:not(:empty)'));
    const [c0, d0] = k.eliminate[0];
    const izbris = plosca.mreza.celice[c0].querySelector('.kandidati').children[d0 - 1];
    const op = document.querySelector('#pomocVsebina .pomoc-kandidati');
    const kartica = document.getElementById('pomocVsebina').closest('.card').getBoundingClientRect();
    const g = op && op.querySelector('button').getBoundingClientRect();
    return { stopnja: pomoc.stopnja, eliminate: k.eliminate, zKand, vKoraku: [...vKoraku],
      izbrisBarva: getComputedStyle(izbris).color, izbrisCrta: getComputedStyle(izbris).textDecorationLine,
      opomba: op ? op.querySelector('p').textContent : '', gumbVKartici: !!g && g.left >= kartica.left && g.right <= kartica.right && g.width > 0 }; })()`);
  preveri('tretja stopnja: kandidati samo v celicah vzorca in izbrisov',
    K.stopnja === 3 && JSON.stringify(K.zKand) === JSON.stringify([...K.vKoraku].sort((a, b) => a - b)), K);
  preveri('kandidat za izbris rdeč in prečrtan', K.izbrisBarva === 'rgb(178, 58, 46)' && K.izbrisCrta.includes('line-through'), [K.izbrisBarva, K.izbrisCrta]);
  preveri('opomba z gumbom »Vklopi kandidate« v kartici',
    K.opomba === 'Kandidati so skriti: izbrise izvedeš, ko jih vklopiš – dotlej »Naslednji korak« najde isti korak.' && K.gumbVKartici, K.opomba);
  preveri('korak: brez vodoravnega preliva', !(await stanjeIgreStrani(b)).preliv);
  await b.posnetek(path.join(mapa, `igra-${sirina}-korak.png`));

  // »Vklopi kandidate«: vklopi in shrani, korak ostane, izbrisi s pravimi kliki.
  await klikniGumbPomoci(b, 'Vklopi kandidate');
  s = await stanjeIgreStrani(b);
  preveri('»Vklopi kandidate«: stikalo vklopljeno in shranjeno, kandidati in niz Odstrani vidni',
    s.stikalo && s.shramba === 'true' && s.kand === s.pricakovanih && s.odstrani !== 'none', s);
  preveri('»Vklopi kandidate«: korak ostane prikazan, opombe ni več',
    (await b.izvedi("pomoc && pomoc.korak && pomoc.stopnja === 3 && !document.querySelector('#pomocVsebina .pomoc-kandidati')")) === true);
  for (const [c, d] of K.eliminate) {
    if ((await b.izvedi('plosca.enaIzbrana()')) !== c) await b.klikni(celicaSel(c));
    await b.klikni(`#nizOdstrani button:nth-child(${d})`);
  }
  preveri('izbrisi izvedeni s pravimi kliki: »Korak je izveden.«',
    (await b.izvedi("document.getElementById('pomocVsebina').textContent")).includes('Korak je izveden.'));

  // Shranjevanje: izklop in vklop preživita osvežitev strani.
  await b.klikni('#stikaloKandidati');
  await odpri();
  s = await stanjeIgreStrani(b);
  preveri('osvežitev: izklop ostane (igra se nadaljuje brez kandidatov)', !s.stikalo && s.kand === 0 && s.odstrani === 'none' && s.poteze > 0, s);
  await b.klikni('#stikaloKandidati');
  await odpri();
  s = await stanjeIgreStrani(b);
  preveri('osvežitev: vklop ostane', s.stikalo && s.shramba === 'true' && s.kand === s.pricakovanih && s.odstrani !== 'none', s);
}

// Trening in reševalec z izklopljeno nastavitvijo igre: brez stikala, kot brez nje.
async function drugeAplikacije(b) {
  console.log('Trening in reševalec z izklopljeno nastavitvijo igre');
  await b.odpri('trening/index.html', { sirina: 1200, visina: 1000 });
  await b.izvedi(`localStorage.clear(); localStorage.setItem(${JSON.stringify(KLJUC)}, 'false'); true`);
  await b.odpri('trening/index.html', { sirina: 1200, visina: 1000 });
  await b.izvedi('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })(); true');
  await b.klikni('.menu-card[data-mode="hidden-pair"] .nacin-btn.vadi');
  await b.cakaj('vadi !== null', 15000);
  const v = await b.izvedi(`({ kand: document.querySelectorAll('.vaja-uganka .mreza .kand:not(:empty):not(.precrtan)').length,
    pricakovanih: vadi.stanje.kandidati.reduce((s, m) => s + [1,2,3,4,5,6,7,8,9].filter(d => m & (1 << d)).length, 0),
    stikalo: !!document.getElementById('stikaloKandidati') })`);
  preveri('»Vadi v uganki« 4: kandidati stanja, brez stikala', v.kand > 0 && v.kand === v.pricakovanih && !v.stikalo, v);
  await b.klikni('#backBtn');
  await b.klikni('.menu-card[data-mode="naked-single"] .nacin-btn:not(.vadi)');
  const e1 = await b.izvedi(`({ kandidati: document.querySelectorAll('#exerciseArea .mreza .kandidati').length,
    celic: document.querySelectorAll('#exerciseArea .mreza .celica').length })`);
  preveri('»Spoznaj« E1: brez kandidatov (kot prej)', e1.celic === 81 && e1.kandidati === 0, e1);
  preveri('trening ključa ne spremeni', (await b.izvedi(`localStorage.getItem(${JSON.stringify(KLJUC)})`)) === 'false');
  await b.odpri('app/index.html', { sirina: 1200, visina: 1000 });
  preveri('reševalec: brez stikala, ključ nespremenjen',
    (await b.izvedi(`!document.getElementById('stikaloKandidati') && localStorage.getItem(${JSON.stringify(KLJUC)}) === 'false'`)) === true);
}

async function main() {
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) await igraStikalo(b, sirina);
    await drugeAplikacije(b);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
