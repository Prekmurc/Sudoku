'use strict';
// Vaji E1 · Očitni enojček in E2 · Skriti enojček v načinu "Spoznaj" v pravem brskalniku
// (docs/pripomocki-e1-e2-nacrt.md), pri širini 375 in 1200 px, vse tri stopnje
// postopnosti (vaje 1, 4, 7): plošča iz shared/plosca.js v kartici brez vodoravnega
// drsnika (tudi z vsemi tremi seznami), mreža brez kandidatov, števke iz vaje, označena
// enota ali celica modrikasta, neaktivne celice sive, pravi kliki (neaktivna celica se ne
// izbere, dovoljena se), poudarek v barvi --poud, seznami, prave tipke (tudi pari
// key/code slovenske razporeditve QWERTZ), pravilen odgovor s pravimi kliki (mreža
// zaklenjena brez zelene obrobe), brez napak JS; posnetki zaslona v mapi (--mapa,
// privzeto začasna).
//
// Posebej: senčenje (kljukica "senči" - šrafura, pomoč pri E2, pri E1 ne) in poudarek
// po pravilnem odgovoru (podlaga poudarka in zelen okvir); stikala seznamov s pravimi
// kliki in ohranitev po osvežitvi; barve poudarka iz nastavitev igre (sudoku.igra.poud)
// pri E1 in pri vajah 1 in 2.
//
// Druge tehnike (3-12; 1 in 2 od točke 16 v docs/vadi-v-uganki-nacrt.md primerja
// preveri-vadi-brskalnik.js) morajo ostati enake: z Math.random s semenom se vsaka vaja
// izriše v izhodišču (izvleček commita --izhodisce z git archive, privzeto 4e1e4dc -
// zadnji commit faze 5 »videz«, docs/faza5-nacrt.md; prej 10503c2) in v trenutni kodi; primerja se innerHTML območja vaje in
// izračunani slogi vseh njegovih elementov.
//
//   node tools/preveri-enojcki-brskalnik.js [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa, odmakniMisko } = require('./primerjava-slogov.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-enojcki'));
const izhodisce = arg('--izhodisce', '4c47cc0');
const KOREN = path.join(__dirname, '..');

const BARVA = { oznacena: 'rgb(227, 238, 251)', neaktivna: 'rgb(233, 235, 238)', poud: 'rgb(246, 192, 38)', lastna: 'rgb(255, 128, 128)' };
let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Math.random s semenom (mulberry32) v strani - pred klikom na kartico tehnike.
const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; return true; })()`;

const celica = i => `.vaja-enojcek .celica[data-r="${Math.floor(i / 9)}"][data-c="${i % 9}"]`;
const IME = { 'naked-single': 'E1', 'hidden-single': 'E2' };

// Odpre stran (shramba: vrednosti localStorage pred nalaganjem) in vajo n tehnike;
// generator si zapomni vajo v window.zadnja.
async function odpri(b, mode, n, sirina, seme, shramba = {}) {
  const mobilno = sirina < 500;
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno });
  await b.izvedi(`localStorage.clear(); ${Object.entries(shramba).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} true`);
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno });
  await b.izvedi(SEME(seme));
  await b.izvedi(`(() => { const g = MODES[${JSON.stringify(mode)}].gen; MODES[${JSON.stringify(mode)}].gen = n => (window.zadnja = g(n)); return true; })()`);
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  if (n) await b.izvedi(`exNum = ${n}; renderExercise(); true`);
}

const stanjeStrani = b => b.izvedi(`(() => {
  const c = enojcek.plosca.mreza.celice, bg = e => getComputedStyle(e).backgroundColor;
  const kartica = document.querySelector('.exercise').getBoundingClientRect();
  const w = document.querySelector('.vaja-enojcek').getBoundingClientRect();
  const seznami = [...document.querySelectorAll('.vaja-enojcek .seznam')];
  return {
    sirinaStrani: document.documentElement.scrollWidth,
    vKartici: w.left >= kartica.left && w.right <= kartica.right
      && seznami.every(s => { const r = s.getBoundingClientRect(); return r.left >= kartica.left && r.right <= kartica.right; }),
    seznamiVidni: seznami.map(s => !s.hidden && s.getBoundingClientRect().width > 0),
    kandidatov: document.querySelectorAll('.vaja-enojcek .mreza .kand').length,
    besedila: c.map(e => e.textContent),
    oznacene: c.map((e, i) => e.classList.contains('oznacena') ? i : -1).filter(i => i >= 0),
    neaktivne: c.map((e, i) => e.classList.contains('neaktivna') ? i : -1).filter(i => i >= 0),
    bgOznacena: c.filter(e => e.classList.contains('oznacena') && !e.classList.contains('izbrana')).map(bg),
    bgNeaktivna: c.filter(e => e.classList.contains('neaktivna')).map(bg),
    izbrane: [...enojcek.plosca.izbrane],
    stevka: [...pickedDigits],
    velikost: c[0].getBoundingClientRect().width,
    grid: [...zadnja.boardGrid],
    oznaka: zadnja.oznaka,
    korak: zadnja.korak.assign[0],
  };
})()`);

async function vaja(b, mode, n, sirina) {
  console.log(`Trening, ${IME[mode]} vaja ${n + 1}, ${sirina} px`);
  const vsi = JSON.stringify({ vrstice: true, stolpci: true, bloki: true });
  await odpri(b, mode, n, sirina, 20260928 + n * 7 + sirina, { 'sudoku.trening.seznami': vsi });
  const s = await stanjeStrani(b);
  const o = s.oznaka;
  const prazne = s.grid.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  const oznacena = i => !!o && (o.celica != null ? i === o.celica : o.enota.includes(i));
  const dovoljene = prazne.filter(i => !o || (o.celica == null && oznacena(i)));
  const neaktivne = prazne.filter(i => !dovoljene.includes(i) && !oznacena(i));

  preveri('ni vodoravnega drsnika (vsi trije seznami)', s.sirinaStrani === sirina, s.sirinaStrani);
  preveri('plošča in seznami so v kartici', s.vKartici);
  preveri('seznami so vidni', s.seznamiVidni.every(Boolean), s.seznamiVidni);
  preveri('v mreži ni kandidatov', s.kandidatov === 0, s.kandidatov);
  preveri('števke so iz vaje', s.besedila.every((t, i) => t === (s.grid[i] ? String(s.grid[i]) : '')));
  preveri('označene celice', JSON.stringify(s.oznacene) === JSON.stringify([...Array(81).keys()].filter(oznacena)), s.oznacene);
  preveri('označene so modrikaste', s.bgOznacena.every(x => x === BARVA.oznacena), s.bgOznacena);
  preveri('neaktivne celice', JSON.stringify(s.neaktivne) === JSON.stringify(neaktivne), s.neaktivne.length);
  preveri('neaktivne so sive', s.bgNeaktivna.every(x => x === BARVA.neaktivna), [...new Set(s.bgNeaktivna)]);
  console.log(`    velikost celice ${s.velikost.toFixed(1)} px, dovoljenih ${dovoljene.length}, neaktivnih ${neaktivne.length}`);

  // Pravi kliki: neaktivna se ne izbere, dovoljena se (ali ostane vnaprej izbrana celica).
  if (neaktivne.length) {
    await b.klikni(celica(neaktivne[0]));
    preveri('klik neaktivne celice ne spremeni izbire', JSON.stringify((await stanjeStrani(b)).izbrane) === JSON.stringify(s.izbrane));
  }
  if (dovoljene.length) {
    await b.klikni(celica(dovoljene[0]));
    preveri('klik dovoljene celice jo izbere', JSON.stringify((await stanjeStrani(b)).izbrane) === JSON.stringify([dovoljene[0]]));
    const izbira = await b.izvedi(`getComputedStyle(document.querySelector('${celica(dovoljene[0])}')).boxShadow`);
    preveri('izbrana celica ima 3 px modro obrobo', /3px/.test(izbira), izbira);
  } else {
    preveri('vnaprej izbrana celica', JSON.stringify(s.izbrane) === JSON.stringify([o.celica]), s.izbrane);
  }

  // Poudarek s pravim klikom: celice s to števko v barvi --poud.
  const d = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => s.grid.includes(x));
  await b.klikni(`.vaja-enojcek .niz-poudari button:nth-child(${d})`);
  const bgPoud = await b.izvedi(`getComputedStyle(document.querySelector('${celica(s.grid.indexOf(d))}')).backgroundColor`);
  preveri(`poudarek števke ${d} v barvi --poud`, bgPoud === BARVA.poud, bgPoud);
  await b.posnetek(path.join(mapa, `${IME[mode]}-${n + 1}-${sirina}.png`));

  // Tipkovnica (ameriška in slovenska razporeditev).
  const st = () => stanjeStrani(b);
  if (!o || !o.stevka) {
    await b.tipka('4');
    preveri('tipka 4 izbere števko 4', JSON.stringify((await st()).stevka) === '[4]');
    await b.tipka('7', { code: 'Numpad7' });
    preveri('Numpad 7 izbere števko 7', JSON.stringify((await st()).stevka) === '[7]');
    await b.tipka('"', { code: 'Digit2', shift: true });
    preveri('QWERTZ Shift+2 (key ", code Digit2) ne izbere števke', JSON.stringify((await st()).stevka) === '[7]');
  } else {
    await b.tipka(String(o.stevka === 1 ? 2 : 1));
    preveri('označena števka se s tipko ne zamenja', JSON.stringify((await st()).stevka) === `[${o.stevka}]`);
  }
  const pred = (await st()).besedila.join();
  await b.tipka('z', { code: 'KeyY', ctrl: true });
  await b.tipka('y', { code: 'KeyZ', ctrl: true });
  await b.tipka('Backspace');
  preveri('QWERTZ Ctrl+Z / Ctrl+Y in Backspace ne spremenijo mreže', (await st()).besedila.join() === pred);
  if (o && o.celica != null) {
    for (const k of ['ArrowRight', 'ArrowDown', 'Escape']) await b.tipka(k);
    preveri('vnaprej izbrana celica ostane (puščice, Escape)', JSON.stringify((await st()).izbrane) === `[${o.celica}]`);
  } else {
    await b.tipka('Escape');
    preveri('Escape počisti izbiro', (await st()).izbrane.length === 0);
    await b.tipka('ArrowRight');
    preveri('puščica izbere prvo dovoljeno celico', JSON.stringify((await st()).izbrane) === `[${dovoljene[0]}]`);
    const naprej = dovoljene.find(i => Math.floor(i / 9) === Math.floor(dovoljene[0] / 9) && i > dovoljene[0]);
    await b.tipka('ArrowRight');
    preveri('puščica preskoči celice, ki jih ni mogoče izbrati',
      JSON.stringify((await st()).izbrane) === `[${naprej === undefined ? dovoljene[0] : naprej}]`);
  }

  // Pravilen odgovor s pravimi kliki.
  const [kc, kd] = s.korak;
  if (!(await st()).izbrane.includes(kc)) {
    if ((await st()).izbrane.length) await b.tipka('Escape');
    await b.klikni(celica(kc));
  }
  if ((await st()).stevka[0] !== kd) await b.klikni(`.digit-btns button:nth-child(${kd})`);
  await b.izvedi(`[...document.querySelectorAll('button')].find(g => g.textContent === 'Preveri').dataset.test = 'preveri'; true`);
  await b.klikni('[data-test="preveri"]');
  const po = await b.izvedi(`(() => {
    const fb = document.querySelector('.fb'), m = enojcek.plosca.mreza.el, c = enojcek.plosca.mreza.celice[${kc}];
    return { fb: fb.className, besedilo: fb.textContent, stevka: c.textContent, zelena: c.classList.contains('k-vpis'),
      zaklenjena: m.classList.contains('zaklenjena'), obroba: getComputedStyle(m).outlineStyle,
      rezultat: document.getElementById('scoreRight').textContent + '/' + document.getElementById('scoreTotal').textContent };
  })()`);
  preveri('pravilen odgovor → »Pravilno!«', po.fb.includes('ok') && po.besedilo.startsWith('Pravilno!'), po.besedilo);
  preveri('celica ima števko in je zelena', po.stevka === String(kd) && po.zelena, po);
  preveri('mreža zaklenjena brez zelene obrobe', po.zaklenjena && po.obroba === 'none', po);
  preveri('rezultat 1/1', po.rezultat === '1/1', po.rezultat);
  await b.posnetek(path.join(mapa, `${IME[mode]}-${n + 1}-${sirina}-pravilno.png`));
}

// Stikala seznamov s pravimi kliki in ohranitev po osvežitvi; "Rešitev" (stikalo).
async function stikalaInResitev(b) {
  console.log('Trening, E2 vaja 1, 375 px: stikala, osvežitev, Rešitev');
  await odpri(b, 'hidden-single', 0, 375, 77);
  const vidni = () => b.izvedi(`[...document.querySelectorAll('.vaja-enojcek .seznam')].map(s => !s.hidden)`);
  preveri('privzeto so seznami skriti', (await vidni()).every(v => !v));
  await b.klikni('.seznami-stikala label:nth-of-type(1) input');
  await b.klikni('.seznami-stikala label:nth-of-type(3) input');
  preveri('stikali Vrstice in Bloki pokažeta seznama', JSON.stringify(await vidni()) === '[true,false,true]', await vidni());
  await b.odpri('trening/index.html', { sirina: 375, visina: 1000, mobilno: true });
  await b.klikni('.menu-card[data-mode="hidden-single"]');
  preveri('po osvežitvi ostaneta vklopljena', JSON.stringify(await vidni()) === '[true,false,true]', await vidni());
  // »Rešitev« je od naloge trening-ucenje (korak 1) stikalo: pravi klik odpre, drugi zapre.
  await b.klikni('.peek-row .peek-btn:nth-child(2)');
  const r = await b.izvedi(`(() => { const c = enojcek.plosca.mreza.celice;
    return { vpis: c.filter(e => e.classList.contains('k-vpis')).length, vzorec: c.filter(e => e.classList.contains('k-vzorec')).length }; })()`);
  preveri('»Rešitev«: celica koraka zeleno, enota jantarno', r.vpis === 1 && r.vzorec >= 1, r);
  await b.posnetek(path.join(mapa, 'E2-1-375-resitev.png'));
  await b.klikni('.peek-row .peek-btn:nth-child(2)');
  const r2 = await b.izvedi(`enojcek.plosca.mreza.celice.filter(e => e.classList.contains('k-vpis') || e.classList.contains('k-vzorec')).length`);
  preveri('po drugem kliku ni oznak', r2 === 0, r2);
}

// Senčenje (kljukica "senči", dopolnitev D2) in poudarek po pravilnem odgovoru (D1):
// glava z dvema kljukicama v eni vrstici, šrafura natanko na celicah, kamor poudarjena
// števka ne more, pomoč pri E2 (pri E1 ne), celica odgovora s podlago poudarka in zelenim
// okvirjem.
async function sencenje(b, mode, n, sirina) {
  console.log(`Trening, ${IME[mode]} vaja ${n + 1}, ${sirina} px: senčenje in poudarek po odgovoru`);
  await odpri(b, mode, n, sirina, 31 + n + sirina);
  const glava = await b.izvedi(`(() => {
    const k = [...document.querySelectorAll('.poudari-glava input')].map(i => i.getBoundingClientRect());
    const g = document.querySelector('.poudari-glava').getBoundingClientRect(), kartica = document.querySelector('.exercise').getBoundingClientRect();
    return { kljukic: k.length, enaVrstica: k.length === 2 && Math.abs(k[0].top - k[1].top) < 2, vKartici: g.right <= kartica.right };
  })()`);
  preveri('glava: kljukici »senči« in »več hkrati« v eni vrstici, v kartici', glava.kljukic === 2 && glava.enaVrstica && glava.vKartici, glava);
  const [kc, kd] = await b.izvedi('zadnja.korak.assign[0]');
  await b.klikni('.poudari-glava .kljukice label:nth-child(1) input');
  await b.klikni(`.vaja-enojcek .niz-poudari button:nth-child(${kd})`);
  const s = await b.izvedi(`(() => {
    const c = enojcek.plosca.mreza.celice, g = zadnja.boardGrid, d = ${kd};
    const vidi = (i, j) => Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9
      || (Math.floor(i / 27) === Math.floor(j / 27) && Math.floor(i % 9 / 3) === Math.floor(j % 9 / 3));
    const prav = c.map((e, i) => g[i] !== d && (g[i] !== 0 || g.some((v, j) => v === d && vidi(i, j))));
    const sraf = c.map(e => getComputedStyle(e, '::after').backgroundImage.includes('repeating-linear-gradient'));
    return { prav: prav.filter(Boolean).length, enako: prav.every((p, i) => p === sraf[i]), odgovor: sraf[${kc}],
      pomoc: document.getElementById('scorePomoc').textContent };
  })()`);
  preveri(`šrafura natanko na celicah, kamor ${kd} ne more (${s.prav})`, s.enako && s.prav > 0, s);
  preveri('celica odgovora ni zasenčena', !s.odgovor);
  preveri(mode === 'hidden-single' ? 'E2: senčenje je pomoč' : 'E1: senčenje ni pomoč',
    s.pomoc === (mode === 'hidden-single' ? ' · s pomočjo: 1' : ''), s.pomoc);
  await b.posnetek(path.join(mapa, `${IME[mode]}-${n + 1}-${sirina}-sencenje.png`));

  // Pravilen odgovor ob poudarjeni števki odgovora: podlaga poudarka in zelen okvir.
  if (!(await b.izvedi('enojcek.plosca.izbrane')).includes(kc)) await b.klikni(celica(kc));
  if ((await b.izvedi('pickedDigits[0]')) !== kd) await b.klikni(`.digit-btns button:nth-child(${kd})`);
  await b.izvedi(`[...document.querySelectorAll('button')].find(g => g.textContent === 'Preveri').dataset.test = 'preveri'; true`);
  await b.klikni('[data-test="preveri"]');
  const po = await b.izvedi(`(() => { const s = getComputedStyle(enojcek.plosca.mreza.celice[${kc}]);
    return { bg: s.backgroundColor, okvir: s.boxShadow, fb: document.querySelector('.fb').textContent }; })()`);
  preveri('pravilen odgovor', po.fb.startsWith('Pravilno!'), po.fb);
  preveri('celica odgovora: podlaga poudarka in zelen okvir', po.bg === BARVA.poud && po.okvir.includes('rgb(46, 125, 92)') && /3px/.test(po.okvir), po);
  await b.posnetek(path.join(mapa, `${IME[mode]}-${n + 1}-${sirina}-pravilno-poudarek.png`));
}

// Barve poudarka iz nastavitev igre veljajo pri E1 in pri vajah 1 in 2.
async function barve(b) {
  console.log('Trening, barve poudarka iz nastavitev igre (sudoku.igra.poud)');
  const shramba = { 'sudoku.igra.poud': JSON.stringify({ 1: '#FF8080' }) };
  await odpri(b, 'naked-single', 6, 1200, 5, shramba);
  const g = await b.izvedi('[...zadnja.boardGrid]');
  const d = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => g.includes(x));
  await b.klikni(`.vaja-enojcek .niz-poudari button:nth-child(${d})`);
  const e1 = await b.izvedi(`getComputedStyle(document.querySelector('${celica(g.indexOf(d))}')).backgroundColor`);
  preveri('E1: poudarek v barvi iz nastavitev igre', e1 === BARVA.lastna, e1);
  for (const mode of ['pointing', 'box-line']) {
    await odpri(b, mode, 0, 1200, 5, shramba);
    const p = await b.izvedi(`(() => { const k = document.querySelector('.vaja-presek .kand.poud'); return k ? getComputedStyle(k).backgroundColor : ''; })()`);
    preveri(`${mode === 'pointing' ? '1' : '2'}: poudarek števke vaje v barvi iz nastavitev igre`, p === BARVA.lastna, p);
  }
  preveri('trening barv ne zapiše', (await b.izvedi(`localStorage.getItem('sudoku.igra.poud')`)) === shramba['sudoku.igra.poud']);
}

// Izris vaje z danim semenom: innerHTML območja vaje in izračunani slogi njegovih elementov.
const SLOGI = ['width', 'height', 'background-color', 'color', 'font-size', 'font-weight', 'font-family',
  'border-top-width', 'border-left-color', 'box-shadow', 'display', 'visibility', 'margin-top', 'padding-left'];
async function izris(b, mode, sirina) {
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.izvedi(SEME(4242));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await odmakniMisko(b); // :hover s prehodom pod miško ne sme vplivati na primerjavo
  // Pisave (Google Fonts) se lahko naložijo šele po kliku - širina besedila bi se
  // razlikovala zaradi nalaganja, ne zaradi kode (kot v preveri-presek-brskalnik.js).
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return b.izvedi(`(() => {
    // Razdelek »Shema« (faza 3a) v izhodišču ni - med meritvijo je skrit (višina kartice je
    // potem kot v izhodišču), primerja se vse drugo. Enako vrstica z imenom tehnike (.ex-label):
    // od popravkov po koraku 1 faze 3a je večja in temna.
    const a = document.getElementById('exerciseArea'), k = a.cloneNode(true);
    k.querySelectorAll('.shema-razdelek, .peek-row').forEach(e => e.remove());
    const sk = [...a.querySelectorAll('.shema-razdelek, .ex-label, .peek-row')]; sk.forEach(e => { e.style.display = 'none'; });
    const slogi = [...a.querySelectorAll('*')].filter(e => !e.closest('.shema-razdelek, .ex-label, .peek-row')).map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); });
    sk.forEach(e => { e.style.display = ''; });
    return { html: k.innerHTML, slogi };
  })()`);
}

async function drugeTehnike(sirine) {
  const html = fs.readFileSync(path.join(KOREN, 'trening', 'index.html'), 'utf8');
  // Vaji 1 in 2 sta od izbire uganke po stopnji (docs/vadi-v-uganki-nacrt.md, točka 16) iz
  // drugih ugank banke - primerja ju tools/preveri-vadi-brskalnik.js s svojim izhodiščem.
  const vse = [...html.matchAll(/data-mode="([^"]+)"/g)].map(m => m[1]).filter(m => !IME[m]);
  preveri('druge tehnike: 12 kartic (1-12)', vse.length === 12, vse);
  const nacini = vse.filter(m => m !== 'pointing' && m !== 'box-line');

  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  const bNov = await zazeni();
  try {
    for (const sirina of sirine) {
      console.log(`Druge tehnike, ${sirina} px (izhodišče ${izhodisce})`);
      for (const m of nacini) {
        const s = await izris(bStar, m, sirina);
        const n = await izris(bNov, m, sirina);
        const razl = razlikeIzrisa(s, n, SLOGI);
        preveri(`${m}: izris enak`, razl.length === 0, razl);
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
    for (const sirina of [375, 1200]) {
      for (const mode of ['naked-single', 'hidden-single']) {
        for (const n of [0, 3, 6]) await vaja(b, mode, n, sirina);
      }
    }
    for (const sirina of [375, 1200]) {
      await sencenje(b, 'hidden-single', 3, sirina);
      await sencenje(b, 'naked-single', 6, sirina);
    }
    await stikalaInResitev(b);
    await barve(b);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  await drugeTehnike([375, 1200]);
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
