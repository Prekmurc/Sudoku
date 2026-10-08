'use strict';
// XY-veriga, korak 6 (vklop - docs/xy-veriga-nacrt.md) v pravem brskalniku pri 375 in 1280 px:
//   - reševalec, preizkusna uganka xy-veriga-17: »Reši« brez poskusa, korak 31 je veriga V5S4 – V6S6 –
//     V9S6 – V8S5 – V8S3 z oznako »13 · XY-veriga« (turkizna t-expert, celo ime v namigu), na mali
//     mreži zaporedne številke 1–5 v celicah verige, korak 34 veriga šestih celic, povzetek z 13;
//   - igra, ista uganka: po 30 korakih dnevnika »Naslednji korak« (brez posega v kodo) najde verigo
//     - oznaka »13 · XY-veriga«, tretja stopnja s številkami;
//   - trening: kartica 13 (značka EKSPERTNA v turkizni, naslov, številka), »Spoznaj« s pravimi kliki
//     (izbira celic verige, »Preveri« → »Pravilno!«, številke ostanejo), »Vadi v uganki« s pravimi
//     kliki in tipko Shift+števka na QWERTZ (vaja najdena, oznaka, navodilo »Za števko z poišči
//     XY-verigo …«, izbris koraka → »Pravilno!«);
//   - Pomoč v vseh treh aplikacijah: Ekstrem v seznamu stopenj (reševalec, igra), »Tehnike« s 15
//     tehnikami, zadnja »13 · XY-veriga (XY-Chain)« z značko »ekspertna«;
//   - brez vodoravnega preliva in brez napak JS. Posnetki v mapo (--mapa).
//
//   node tools/preveri-vklop-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-vklop');
const D = JSON.stringify(loadPuzzles().find(u => u.ime === 'xy-veriga-17').danosti.replace(/\./g, '0'));
const PREIZKUSNA = [39, 50, 77, 67, 65]; // V5S4 – V6S6 – V9S6 – V8S5 – V8S3
const MESTA = [5, 8, 2, 4, 6, 1, 3, 7, 9];
// Shift+števka na slovenski QWERTZ: e.key je znak, e.code DigitN.
const SHIFT_QWERTZ = { 1: '!', 2: '"', 3: '#', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')' };
const TURQ = 'rgb(11, 107, 107)', TURQ_BG = 'rgb(210, 239, 239)';

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const preliv = b => b.izvedi('document.documentElement.scrollWidth > document.documentElement.clientWidth');
const pocakaj = ms => new Promise(r => setTimeout(r, ms));

// Številke verige v elementu: [{ besedilo, celica (0-80), mesto, kandidati }] po vrsti številk.
const STEVILKE = `(koren, oznaka, celica) => [...document.querySelector(koren).querySelectorAll(oznaka)].map(o => {
  const c = o.closest(celica);
  const sosedi = [...o.parentElement.children].filter(x => x !== o && x.textContent.trim() && getComputedStyle(x).visibility !== 'hidden');
  return { besedilo: o.textContent, celica: +c.dataset.r * 9 + +c.dataset.c, mesto: [...o.parentElement.children].indexOf(o) + 1,
    kandidati: sosedi.map(x => +x.textContent) };
}).sort((a, b) => a.besedilo - b.besedilo)`;
function pregledStevilk(ime, m, celice) {
  preveri(`${ime}: številke 1–${celice.length} v celicah verige po vrsti`,
    JSON.stringify(m.map(o => [o.besedilo, o.celica])) === JSON.stringify(celice.map((c, j) => [String(j + 1), c])),
    m.map(o => [o.besedilo, o.celica]));
  preveri(`${ime}: mesto 5, sicer prvo prosto`, m.every(o => o.mesto === MESTA.find(d => !o.kandidati.includes(d))),
    m.map(o => [o.mesto, o.kandidati]));
}

async function klikniTocko(b, x, y, modifiers = 0) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1, modifiers });
  }
}
// Pravi klik na element, ki ga vrne izraz (središče, pomaknjeno v okno).
async function klikniEl(b, izraz) {
  const t = await b.izvedi(`(() => { const el = ${izraz}; el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await klikniTocko(b, t.x, t.y);
  await pocakaj(80);
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(`naloziDanosti(${D}, ''); true`);
  await b.klikni('#solveBtn');
  await b.cakaj('!!lastSolve', 20000);
  const log = await b.izvedi(`lastSolve.log.map(k => k.technique)`);
  preveri('rešena brez poskusa, 78 korakov', log.length === 78 && !log.some(t => t.startsWith('Poskus')), [log.length, log.filter(t => t.startsWith('Poskus'))]);
  preveri('koraka 31 in 34 sta XY-veriga', log[30] === 'XY-Chain' && log[33] === 'XY-Chain', [log[30], log[33]]);
  const celice31 = await b.izvedi('lastSolve.log[30].cells');
  preveri('korak 31: veriga V5S4 – V6S6 – V9S6 – V8S5 – V8S3', JSON.stringify(celice31) === JSON.stringify(PREIZKUSNA), celice31);
  await b.klikni('#openStepsBtn');
  const li = '#steps > li:nth-child(31)';
  const tag = await b.izvedi(`(() => { const t = document.querySelector('${li} .tag'); const s = getComputedStyle(t);
    return { besedilo: t.textContent, title: t.title, razred: t.className, barva: s.color, ozadje: s.backgroundColor }; })()`);
  preveri('oznaka koraka »13 · XY-veriga«, namig »13 · XY-veriga (XY-Chain)«',
    tag.besedilo === '13 · XY-veriga' && tag.title === '13 · XY-veriga (XY-Chain)', tag);
  preveri('oznaka koraka turkizna (t-expert)', tag.razred.includes('t-expert') && tag.barva === TURQ && tag.ozadje === TURQ_BG, tag);
  preveri('nikjer v seznamu korakov ključ »XY-Chain« zunaj oklepaja',
    await b.izvedi(`!/(^|[^(])XY-Chain/.test(document.getElementById('steps').innerText)`));
  await b.klikni(`${li} .mini-toggle`);
  pregledStevilk('korak 31, mala mreža', await b.izvedi(`(${STEVILKE})('${li} .mini-grid', '.mcand-veriga', '.mcell')`), PREIZKUSNA);
  const naslov = await b.izvedi(`(() => { const e = document.querySelector('${li} .mini-title, ${li} .mini-container'); return e ? e.innerText : ''; })()`);
  preveri('naslov male mreže s »13 · XY-veriga«', naslov.includes('13 · XY-veriga'), naslov.slice(0, 80));
  const celice34 = await b.izvedi('lastSolve.log[33].cells');
  await b.klikni('#steps > li:nth-child(34) .mini-toggle');
  pregledStevilk('korak 34 (šest celic)', await b.izvedi(`(${STEVILKE})('#steps > li:nth-child(34) .mini-grid', '.mcand-veriga', '.mcell')`), celice34);
  const povzetek = await b.izvedi(`document.body.innerText.includes('13 · XY-veriga (XY-Chain) – 2×')`);
  preveri('povzetek »13 · XY-veriga (XY-Chain) – 2×«', povzetek);
  preveri('brez vodoravnega preliva', !(await preliv(b)));
  await b.izvedi(`document.querySelector('${li}').scrollIntoView({ block: 'start' }); true`);
  await b.posnetek(path.join(mapa, `resevalec-korak31-${sirina}.png`), { vsaStran: false });
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  await b.izvedi(`(() => { dodajVZbirko(${D}, '', 'rocno'); zacniIgro(${D});
    for (const s of solve(${D}).log.slice(0, 30)) {
      for (const [celica, stevka] of s.assign) { dodajPotezo(igra, { tip: 'vpis', celica, stevka }, stanje); stanje = stanjeIgre(igra); }
      for (const [celica, stevka] of s.eliminate) { if (dodajPotezo(igra, { tip: 'kandidat', celica, stevka, odstrani: true }, stanje)) stanje = stanjeIgre(igra); }
    }
    osvezi(); return true; })()`);
  // »Naslednji korak« išče korak asinhrono (»Iščem korak …«) - počakaj na korak.
  await b.klikni('#korakBtn');
  await b.cakaj('!!(pomoc && pomoc.korak && pomoc.stopnja === 1)', 10000);
  const tag = await b.izvedi(`(() => { const t = document.querySelector('#pomocEl .tag, .tag'); return t && { besedilo: t.textContent, title: t.title, razred: t.className }; })()`);
  const p = await b.izvedi('pomoc && { tehnika: pomoc.korak.technique, celice: pomoc.korak.cells }');
  preveri('»Naslednji korak« najde verigo preizkusne uganke', p && p.tehnika === 'XY-Chain' && JSON.stringify(p.celice) === JSON.stringify(PREIZKUSNA), p);
  const oznaka = await b.izvedi(`[...document.querySelectorAll('.tag')].map(t => [t.textContent, t.title, t.className]).find(t => t[0].startsWith('13'))`);
  preveri('oznaka »13 · XY-veriga« (t-expert), namig s celim imenom',
    oznaka && oznaka[0] === '13 · XY-veriga' && oznaka[1] === '13 · XY-veriga (XY-Chain)' && oznaka[2].includes('t-expert'), oznaka || tag);
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.stopnja === 2', 5000);
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.stopnja === 3', 5000);
  pregledStevilk('tretja stopnja', await b.izvedi(`(${STEVILKE})('#mreza', '.kand.k-veriga', '.celica')`), PREIZKUSNA);
  preveri('brez vodoravnega preliva', !(await preliv(b)));
}

async function trening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  const k = await b.izvedi(`(() => { const c = document.querySelector('.menu-card[data-mode="xy-chain"]'); const z = c.querySelector('.badge');
    const s = getComputedStyle(z); const h = c.querySelector('h3');
    return { kartic: document.querySelectorAll('.menu-card').length, zadnja: [...document.querySelectorAll('.menu-card')].pop() === c,
      znacka: z.textContent, razred: z.className, barva: s.color, ozadje: s.backgroundColor,
      naslov: h.textContent, stevilka: getComputedStyle(h, '::before').content, povzetek: c.querySelector('p').textContent }; })()`);
  preveri('15 kartic, kartica 13 zadnja', k.kartic === 15 && k.zadnja, k);
  preveri('značka EKSPERTNA v turkizni', k.znacka === 'EKSPERTNA' && k.razred === 'badge badge-ekspertna' && k.barva === TURQ && k.ozadje === TURQ_BG, k);
  preveri('naslov »XY-veriga (XY-Chain)« s številko 13', k.naslov === 'XY-veriga (XY-Chain)' && k.stevilka.includes('13'), [k.naslov, k.stevilka]);
  preveri('brez vodoravnega preliva (meni)', !(await preliv(b)));

  // »Spoznaj« s pravimi kliki.
  await b.izvedi(`{ const g = MODES['xy-chain'].gen; MODES['xy-chain'].gen = n => (window.zadnjaVaja = g(n)); } true`);
  await klikniEl(b, `[...document.querySelector('.menu-card[data-mode="xy-chain"]').querySelectorAll('.nacin-btn')].find(x => x.textContent === 'Spoznaj')`);
  const ex = await b.izvedi('({ celice: zadnjaVaja.solutionCells, oznaka: document.querySelector(".ex-label").textContent })');
  preveri('»Spoznaj«: oznaka »13 · XY-veriga (XY-Chain) · Vaja 1 / …«', ex.oznaka.startsWith('13 · XY-veriga (XY-Chain) · Vaja 1 /'), ex.oznaka);
  for (const c of ex.celice) {
    await klikniEl(b, `document.querySelector('.g9 .gc[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]')`);
  }
  const izbranih = await b.izvedi(`document.querySelectorAll('.g9 .gc.selected-turq').length`);
  preveri(`»Spoznaj«: izbranih ${ex.celice.length} celic`, izbranih === ex.celice.length, izbranih);
  await klikniEl(b, `[...document.querySelectorAll('#exerciseArea button')].find(x => x.textContent === 'Preveri')`);
  const fb = await b.izvedi(`document.querySelector('#exerciseArea .fb').innerText`);
  preveri('»Spoznaj«: »Pravilno!«', fb.startsWith('Pravilno!'), fb.slice(0, 80));
  const m = await b.izvedi(`(${STEVILKE})('.g9', '.cd.veriga-st', '.gc')`);
  preveri('»Spoznaj«: številke verige po pravilnem odgovoru', m.length === ex.celice.length && m.every((o, j) => o.besedilo === String(j + 1)), m);
  preveri('brez vodoravnega preliva (Spoznaj)', !(await preliv(b)));
  await b.posnetek(path.join(mapa, `spoznaj-${sirina}.png`), { vsaStran: true });

  // »Vadi v uganki« s pravimi kliki in tipkami.
  await klikniEl(b, `document.getElementById('backBtn')`);
  await klikniEl(b, `[...document.querySelector('.menu-card[data-mode="xy-chain"]').querySelectorAll('.nacin-btn')].find(x => x.textContent === 'Vadi v uganki')`);
  await b.cakaj('!!(vadi && vadi.plosca)', 15000);
  const v = await b.izvedi(`({ oznaka: document.querySelector('.ex-label').textContent,
    navodilo: document.getElementById('exerciseArea').innerText, ob: vadi.ob && vadi.ob.opis,
    korak: (vadi.KTob && vadi.KTob.length ? vadi.KTob : vadi.v.KT)[0] })`);
  preveri('»Vadi v uganki«: oznaka »13 · XY-veriga (XY-Chain) · Vadi v uganki · Vaja 1 / 9«',
    v.oznaka === '13 · XY-veriga (XY-Chain) · Vadi v uganki · Vaja 1 / 9', v.oznaka);
  const navodilo = v.ob ? `${v.ob[0].toUpperCase()}${v.ob.slice(1)} poišči XY-verigo in izbriši kandidate, ki zaradi nje odpadejo.` : '';
  preveri('»Vadi v uganki«: območje »za števko z« in navodilo', /^za števko \d$/.test(v.ob || '') && v.navodilo.includes(navodilo), [v.ob, navodilo]);
  for (const [c] of v.korak.eliminate) {
    await klikniEl(b, `document.querySelector('#exerciseArea .mreza .celica[data-r="${Math.floor(c / 9)}"][data-c="${c % 9}"]')`);
  }
  const d = v.korak.eliminate[0][1];
  await b.tipka(SHIFT_QWERTZ[d], { code: 'Digit' + d, shift: true });
  await pocakaj(100);
  await klikniEl(b, `[...document.querySelectorAll('#exerciseArea button')].find(x => x.textContent === 'Preveri')`);
  const fb2 = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .fb')].map(e => e.innerText).join(' | ')`);
  preveri('»Vadi v uganki«: izbris koraka verige → »Pravilno!«', /Pravilno!/.test(fb2), fb2.slice(0, 120));
  const st = await b.izvedi(`(${STEVILKE})('#exerciseArea .mreza', '.kand.k-veriga', '.celica')`);
  preveri('»Vadi v uganki«: zaporedne številke verige po pravilnem odgovoru', st.length === v.korak.cells.length
    && JSON.stringify(st.map(o => o.celica)) === JSON.stringify(v.korak.cells), st.map(o => o.celica));
  preveri('brez vodoravnega preliva (Vadi v uganki)', !(await preliv(b)));
  await b.posnetek(path.join(mapa, `vadi-${sirina}.png`), { vsaStran: true });
}

// Pomoč: seznam stopenj (če ga aplikacija ima) in »Tehnike«.
async function pomoc(b, sirina, stran, gumb, stopnjeId, tehnikeId) {
  console.log(`Pomoč, ${stran}, ${sirina} px`);
  await b.odpri(stran, { sirina, visina: 900, mobilno: sirina < 500 });
  await b.klikni(gumb);
  if (stopnjeId) {
    const s = await b.izvedi(`[...document.querySelectorAll('#${stopnjeId} > li')].map(li => li.textContent)`);
    preveri(`${stran}: pet stopenj, zadnja Ekstrem`, s.length === 5 && s[4] === 'ekstrem potrebuje ekspertno tehniko (13 – XY-veriga)', s);
  }
  const t = await b.izvedi(`(() => { const el = document.getElementById('${tehnikeId}'); const lis = el.querySelectorAll('ul.tehnike > li');
    const z = lis[lis.length - 1]; const r = z.querySelector('.tehnika-raven'); const s = getComputedStyle(r);
    return { uvod: el.querySelector('p').textContent, n: lis.length, oznaka: z.querySelector('.tehnika-oznaka').textContent, ime: z.querySelector('b').textContent,
      raven: r.textContent, barva: s.color, ozadje: s.backgroundColor, shema: !!z.querySelector('details.tehnika-shema') }; })()`);
  preveri(`${stran}: uvod »v štirih ravneh … ekspertne (13)«`, t.uvod.startsWith('Tehnike so v štirih ravneh: lahke (E1, E2), srednje (1–6), napredne (7–12) in ekspertne (13)'), t.uvod);
  preveri(`${stran}: 15 tehnik, zadnja »13 · XY-veriga (XY-Chain)« z značko »ekspertna« v turkizni in shemo`,
    t.n === 15 && t.oznaka === '13 · ' && t.ime === 'XY-veriga (XY-Chain)' && t.raven === 'ekspertna' && t.barva === TURQ && t.ozadje === TURQ_BG && t.shema, t);
  preveri(`${stran}: brez vodoravnega preliva`, !(await preliv(b)));
}

(async () => {
  const b = await zazeni();
  fs.mkdirSync(mapa, { recursive: true });
  try {
    for (const sirina of [375, 1280]) {
      await resevalec(b, sirina);
      await igra(b, sirina);
      await trening(b, sirina);
      await pomoc(b, sirina, 'app/index.html', '#pomocBtn', 'pomocStopnje', 'pomocTehnike');
      await pomoc(b, sirina, 'igra/index.html', '#navodilaBtn', 'stopnjeOcena', 'tehnikeSeznam');
      await pomoc(b, sirina, 'trening/index.html', '#pomocBtn', null, 'pomocTehnike');
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
