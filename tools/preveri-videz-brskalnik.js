'use strict';
// Faza 5 – videz (docs/faza5-nacrt.md) v pravem brskalniku: vse tri aplikacije pri 320,
// 375, 430 in 1280 px v več stanjih. Preveri, da stran nima vodoravnega preliva
// (scrollWidth <= clientWidth), da noben element ne sega čez svojo kartico (ali ploščo,
// okno), da povečan prikaz in okna pokrijejo celo okno in nimajo vodoravnega drsnika
// (razen notranjosti povečanega prikaza - tam je povečava namen) ter da v strani ni napak JS.
// Pri 375 in 1280 px še slog izbrane celice (igra, trening, fokus vnosnih mrež).
//
//   node tools/preveri-videz-brskalnik.js [--mapa <mapa za posnetke>] [--sirine 320,375]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).
// Brskalnik brez glave skrije drsnike, zato preliv zaradi širine drsnika na namizju tu ni
// viden (ročni pregled).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto;
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-videz'));
const SIRINE = arg('--sirine', '320,375,430,1280').split(',').map(Number);

// Math.random s semenom (mulberry32) v strani - vaje treninga so ponovljive.
const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0; let t = seme;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })()`;

// Tehnike treninga (data-mode kartic) - »Spoznaj« vseh in »Vadi v uganki« treh.
const TEHNIKE = ['naked-single', 'hidden-single', 'pointing', 'box-line', 'naked-pair', 'hidden-pair',
  'naked-triple', 'hidden-triple', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
const VADI = ['naked-pair', 'swordfish', 'naked-single'];

// ime posnetka: brez šumnikov in presledkov
const datoteka = ime => ime.replace(/č/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/[^a-z0-9-]+/gi, '-');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Meritev v strani: širina strani, elementi čez okno, elementi čez svojo posodo (kartica,
// plošča, okno) - samo najvišji, ki seže čez (njegovi otroci se ne naštevajo).
const MERITEV = `(() => {
  const d = document.documentElement;
  const ime = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : '');
  const vidno = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const cez = (r, p) => r.right > p.right + 0.5 || r.left < p.left - 0.5;
  const posode = [...document.querySelectorAll('.card, .exercise, .menu-card, .score-bar, .plosca, .stranski, .dialog-panel, .lib-panel, #steps li')]
    .filter(p => vidno(p) && !p.closest('#lightbox'));
  const izPosod = [];
  for (const p of posode) {
    const pr = p.getBoundingClientRect();
    for (const el of p.querySelectorAll('*')) {
      if (!vidno(el)) continue;
      const r = el.getBoundingClientRect();
      if (!cez(r, pr)) continue;
      if (el.parentElement !== p && cez(el.parentElement.getBoundingClientRect(), pr)) continue;
      izPosod.push(ime(p) + ' > ' + ime(el) + ' [' + Math.round(r.left - pr.left) + ', ' + Math.round(r.right - pr.right) + ']');
    }
  }
  return { sw: d.scrollWidth, cw: d.clientWidth, izPosod: [...new Set(izPosod)].slice(0, 6) };
})()`;

async function meri(b, ime, sirina, posnetek = false) {
  const r = await b.izvedi(MERITEV);
  preveri(`${ime}: brez vodoravnega preliva strani`, r.sw <= r.cw, `${r.sw} > ${r.cw}`);
  preveri(`${ime}: nič ne sega čez svojo kartico`, r.izPosod.length === 0, r.izPosod);
  if (posnetek) await b.posnetek(path.join(mapa, `${datoteka(ime)}-${sirina}.png`));
}

// Fiksno okno (povečan prikaz, zbirka, okna igre) pokrije celo okno brskalnika in nima
// vodoravnega drsnika; `notranji` je element z namenskim drsnikom (povečava), ki se ne šteje.
async function okno(b, izbirnik, ime, sirina) {
  const r = await b.izvedi(`(() => {
    const o = document.querySelector(${JSON.stringify(izbirnik)});
    if (!o || getComputedStyle(o).display === 'none') return null;
    const p = o.getBoundingClientRect();
    return { l: p.left, t: p.top, w: p.width, h: p.height, iw: innerWidth, ih: innerHeight, sw: o.scrollWidth, cw: o.clientWidth,
      fixed: getComputedStyle(o).position };
  })()`);
  preveri(`${ime}: okno je odprto`, r !== null);
  if (!r) return;
  preveri(`${ime}: pokrije celo okno`, r.fixed === 'fixed' && Math.abs(r.l) < 0.5 && Math.abs(r.t) < 0.5
    && Math.abs(r.w - r.iw) < 0.5 && Math.abs(r.h - r.ih) < 0.5, r);
  preveri(`${ime}: brez vodoravnega drsnika v oknu`, r.sw <= r.cw, `${r.sw} > ${r.cw}`);
  await b.posnetek(path.join(mapa, `${datoteka(ime)}-${sirina}.png`), { vsaStran: false });
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'reševalec prazen', sirina);
  await b.izvedi(`(() => { const sel = document.getElementById('exampleSelect'); sel.value = '2'; sel.dispatchEvent(new Event('change')); })()`);
  await b.klikni('#candBtn');
  await b.klikni('#solveBtn');
  await b.cakaj(`document.getElementById('results').style.display === 'block'`, 20000);
  await b.klikni('#openStepsBtn');
  // male mreže koraka: prvih nekaj in ena pozneje (več kandidatov)
  await b.izvedi(`(() => { const t = [...document.querySelectorAll('.mini-toggle')]; [0, 1, 4, Math.floor(t.length / 2)].forEach(i => t[i] && t[i].click()); })()`);
  const mreze = await b.izvedi(`document.querySelectorAll('.mini-container .mini-grid').length`);
  preveri('reševalec: male mreže koraka so odprte', mreze >= 3, mreze);
  await meri(b, 'reševalec z rešitvijo in koraki', sirina, true);
  await b.klikni('#libraryBtn');
  await okno(b, '#library', 'reševalec, okno zbirke', sirina);
  await b.klikni('#libClose');
  await b.klikni('#solvedGrid');
  await okno(b, '#lightbox', 'reševalec, povečan prikaz rešitve', sirina);
  await b.klikni('#lightboxClose');
  await b.klikni('.mini-container .mini-grid');
  await okno(b, '#lightbox', 'reševalec, povečan prikaz koraka', sirina);
  await b.klikni('#lightboxClose');
  // okno Pomoč (shared/pomoc.js, faza 6)
  await b.klikni('#pomocBtn');
  await okno(b, '#pomocDialog.odprt', 'reševalec, okno pomoč', sirina);
  await b.izvedi(`document.querySelector('#pomocDialog [data-zapri]').click()`);
  await meri(b, 'reševalec po zaprtju oken', sirina);
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'igra prazna', sirina);
  await b.izvedi('zacniIgro(PRIMERI[0].danosti)');
  for (const id of ['stikaloVrstice', 'stikaloStolpci', 'stikaloBloki']) {
    if (!await b.izvedi(`document.getElementById('${id}').checked`)) await b.klikni('#' + id);
  }
  await b.klikni('#mreza .celica[data-r="4"][data-c="5"]');
  await b.klikni('#korakBtn');
  await b.klikni('.nastavi-poud summary');
  preveri('igra: razdelek »Barve poudarka« je odprt', await b.izvedi(`document.querySelector('.nastavi-poud').open`));
  await meri(b, 'igra z uganko, seznami in barvami poudarka', sirina, true);
  for (const [gumb, id, ime] of [['#zbirkaBtn', '#zbirkaDialog', 'igra, okno zbirke'], ['#novaBtn', '#novaDialog', 'igra, okno nova uganka'],
    ['#navodilaBtn', '#navodilaDialog', 'igra, okno pomoč']]) {
    await b.klikni(gumb);
    if (id === '#zbirkaDialog') await b.izvedi(`document.getElementById('primeriRazdelek').open = true`);
    await okno(b, `${id}.odprt`, ime, sirina);
    const r = await b.izvedi(MERITEV);
    preveri(`${ime}: nič ne sega čez okno`, r.izPosod.length === 0, r.izPosod);
    await b.izvedi(`document.querySelector('${id} [data-zapri]').click()`);
  }
}

async function trening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 800, mobilno: sirina < 500 });
  await meri(b, 'trening meni', sirina);
  // okno Pomoč (shared/pomoc.js, faza 6)
  await b.klikni('#pomocBtn');
  await okno(b, '#pomocDialog.odprt', 'trening, okno pomoč', sirina);
  await b.izvedi(`document.querySelector('#pomocDialog [data-zapri]').click()`);
  for (const m of TEHNIKE) {
    await b.izvedi(SEME(4242));
    await b.izvedi(`zacniKrog('${m}', 'spoznaj')`);
    await meri(b, `trening Spoznaj ${m}`, sirina, m === 'naked-pair');
    await b.klikni('#backBtn');
  }
  for (const m of VADI) {
    await b.izvedi(SEME(4242));
    await b.izvedi(`zacniKrog('${m}', 'uganka')`);
    await b.cakaj(`!document.querySelector('.vadi-isce')`, 15000);
    await meri(b, `trening Vadi ${m}`, sirina);
    await b.klikni('#backBtn');
  }
}

// Slog izbrane celice (odločitev A2, docs/faza5-nacrt.md): modrikasta podlaga --izbira-bg in
// 3 px obroba --izbira (#4A86D8); na poudarjeni celici podlaga poudarka in še bel notranji rob.
// Fokus v vnosni mreži (reševalec, okno »Nova uganka«) je enak izbrani celici.
const OBROBA = 'rgb(74, 134, 216) 0px 0px 0px 3px inset';
const OBROBA_POUD = 'rgb(74, 134, 216) 0px 0px 0px 3px inset, rgb(255, 255, 255) 0px 0px 0px 4px inset';
const SLOG_IZBIRE = izraz => `(() => {
  const el = ${izraz};
  if (!el) return null;
  const s = getComputedStyle(el);
  const barva = v => { const p = document.createElement('div'); p.style.background = v; document.body.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; };
  return { bg: s.backgroundColor, senca: s.boxShadow, obroba: s.outlineStyle, izbiraBg: barva('var(--izbira-bg)'), peerBg: barva('var(--peer-bg)'), poud: barva('var(--poud)') };
})()`;
// Označi element, da ga pravi klik najde po izbirniku.
const OZNACI = izraz => `(() => { document.querySelectorAll('[data-videz]').forEach(e => e.removeAttribute('data-videz')); const el = ${izraz}; if (el) el.setAttribute('data-videz', ''); return !!el; })()`;

async function izbiraCelice(b, sirina) {
  console.log(`Izbira celice, ${sirina} px`);
  const mobilno = sirina < 500;
  const navadna = (ime, s) => preveri(`${ime}: modrikasta podlaga in 3 px obroba`,
    s && s.bg === s.izbiraBg && s.bg !== s.peerBg && s.senca === OBROBA && s.obroba === 'none', s);

  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno });
  await b.izvedi('zacniIgro(PRIMERI[0].danosti)');
  await b.klikni('#mreza .celica[data-r="4"][data-c="5"]');
  navadna('igra, prazna celica', await b.izvedi(SLOG_IZBIRE(`document.querySelector('#mreza .celica.izbrana')`)));
  await b.klikni('#nizPoudari button:nth-child(4)');
  await b.izvedi(OZNACI(`document.querySelectorAll('#mreza .celica')[PRIMERI[0].danosti.indexOf('4')]`));
  await b.klikni('[data-videz]');
  const p = await b.izvedi(SLOG_IZBIRE(`document.querySelector('#mreza .celica.izbrana')`));
  preveri('igra, poudarjena dana števka: podlaga poudarka, obroba z belim robom', p && p.bg === p.poud && p.senca === OBROBA_POUD, p);
  await b.cdp.poslji('Emulation.setFocusEmulationEnabled', { enabled: true });
  await b.klikni('#novaBtn');
  await b.klikni('#novaMreza input[data-r="0"][data-c="0"]');
  navadna('igra, fokus v vnosni mreži okna »Nova uganka«', await b.izvedi(SLOG_IZBIRE('document.activeElement')));

  await b.odpri('app/index.html', { sirina, visina: 800, mobilno });
  await b.cdp.poslji('Emulation.setFocusEmulationEnabled', { enabled: true });
  await b.klikni('#inputGrid input[data-r="4"][data-c="4"]');
  navadna('reševalec, fokus v vnosni mreži', await b.izvedi(SLOG_IZBIRE('document.activeElement')));

  await b.odpri('trening/index.html', { sirina, visina: 800, mobilno });
  await b.izvedi(SEME(4242));
  await b.izvedi(`zacniKrog('pointing', 'spoznaj')`);
  await b.izvedi(OZNACI(`document.querySelector('.vaja-presek .celica:not(.izven):not(.dana):not(.vpis)')`));
  await b.klikni('[data-videz]');
  navadna('trening, 1 · Izločitev izven bloka', await b.izvedi(SLOG_IZBIRE(`document.querySelector('.vaja-presek .celica.izbrana')`)));
  await b.klikni('#backBtn');
  await b.izvedi(SEME(4242));
  await b.izvedi(`zacniKrog('naked-single', 'spoznaj')`);
  navadna('trening, E1 (vnaprej izbrana celica)', await b.izvedi(SLOG_IZBIRE(`document.querySelector('.vaja-enojcek .celica.izbrana')`)));
  await b.klikni('#backBtn');
  await b.izvedi(SEME(4242));
  await b.izvedi(`zacniKrog('naked-pair', 'uganka')`);
  await b.cakaj(`!document.querySelector('.vadi-isce')`, 15000);
  await b.izvedi(OZNACI(`vadi.plosca.mreza.celice.find((e, i) => !vadi.stanje.grid[i])`));
  await b.klikni('[data-videz]');
  navadna('trening, Vadi v uganki 3', await b.izvedi(SLOG_IZBIRE(`document.querySelector('.vaja-uganka .celica.izbrana')`)));
}

// Skupni videz (N1, N2): paleta iz shared/base.css je v vseh treh aplikacijah enaka, podlaga
// strani je bela brez vzorca.
const PALETA = ['--paper', '--card', '--ink', '--ink2', '--line', '--pencil', '--red', '--red-bg', '--blue', '--blue-bg',
  '--green', '--green-bg', '--amber', '--amber-bg', '--purple', '--purple-bg', '--izbira', '--izbira-bg'];
const STRANI = { reševalec: 'app/index.html', igra: 'igra/index.html', trening: 'trening/index.html' };

// Skupne sestavine (N3-N7) iz shared/base.css: izbirnik po aplikaciji (null = aplikacija je
// nima) in lastnosti, ki morajo biti v vseh enake.
const SESTAVINE = {
  naslov: { izbirniki: ['header.top h1', 'header.top h1', 'header.top h1'], lastnosti: ['font-family', 'font-size', 'font-weight', 'color'] },
  nadnaslov: { izbirniki: ['header.top .eyebrow', 'header.top .eyebrow', 'header.top .eyebrow'], lastnosti: ['font-family', 'font-size', 'letter-spacing', 'text-transform', 'color'] },
  glava: { izbirniki: ['header.top', 'header.top', 'header.top'], lastnosti: ['padding-top', 'padding-left', 'padding-bottom'] },
  kartica: { izbirniki: ['.card', '.card', '.menu-card'], lastnosti: ['background-color', 'border-top-width', 'border-top-color', 'border-radius', 'padding-top', 'padding-left'] },
  'naslov kartice': { izbirniki: ['#stepsCard h2', '.card h2', null], lastnosti: ['font-family', 'font-size', 'font-weight', 'margin-bottom'] },
  gumb: { izbirniki: ['#clearBtn', '#preveriBtn', '.nacin-btn:not(.vadi)'], lastnosti: ['font-family', 'font-size', 'font-weight', 'padding-top', 'padding-left', 'border-radius', 'border-top-color', 'background-color', 'color'] },
  'glavni gumb': { izbirniki: ['#solveBtn', '#korakBtn', null], lastnosti: ['font-size', 'padding-top', 'padding-left', 'border-radius', 'background-color', 'color'] },
  'gumb v glavi': { izbirniki: ['#libraryBtn', '#zbirkaBtn', null], lastnosti: ['font-size', 'padding-top', 'padding-left', 'border-radius', 'color'] },
  noga: { izbirniki: ['footer.note', 'footer.note', null], lastnosti: ['font-size', 'color', 'text-align', 'line-height'] },
};

async function skupniVidez(b) {
  console.log('Skupni videz (1280 px)');
  const v = {};
  const imena = Object.keys(STRANI);
  for (const [k, [ime, stran]] of Object.entries(STRANI).entries()) {
    await b.odpri(stran, { sirina: 1280, visina: 900 });
    const izbirniki = Object.fromEntries(Object.entries(SESTAVINE).map(([s, d]) => [s, [d.izbirniki[k], d.lastnosti]]));
    v[ime] = await b.izvedi(`(() => {
      const r = getComputedStyle(document.documentElement), t = getComputedStyle(document.body);
      const sestavine = {};
      for (const [s, [izb, lastnosti]] of Object.entries(${JSON.stringify(izbirniki)})) {
        if (!izb) continue;
        const el = document.querySelector(izb);
        sestavine[s] = el ? lastnosti.map(p => p + ': ' + getComputedStyle(el).getPropertyValue(p)).join('; ') : 'ni elementa ' + izb;
      }
      return { paleta: ${JSON.stringify(PALETA)}.map(p => p + ': ' + r.getPropertyValue(p).trim()),
        podlaga: t.backgroundColor + ' ' + t.backgroundImage, sestavine };
    })()`);
  }
  const [prva, ...druge] = imena;
  for (const ime of druge) preveri(`paleta: ${ime} = ${prva}`, JSON.stringify(v[ime].paleta) === JSON.stringify(v[prva].paleta),
    v[ime].paleta.filter((x, i) => x !== v[prva].paleta[i]));
  for (const ime of imena) preveri(`${ime}: bela podlaga brez vzorca`, v[ime].podlaga === 'rgb(255, 255, 255) none', v[ime].podlaga);
  for (const s of Object.keys(SESTAVINE)) {
    const ima = imena.filter(ime => v[ime].sestavine[s] !== undefined);
    const vrednosti = ima.map(ime => v[ime].sestavine[s]);
    preveri(`${s}: enako v ${ima.join(', ')}`, vrednosti.every(x => x === vrednosti[0] && !x.startsWith('ni elementa')),
      Object.fromEntries(ima.map(ime => [ime, v[ime].sestavine[s]])));
  }
}

// Barva danosti (N9): v reševalcu je dana števka temna in krepka, izpeljana modra - enako kot
// dana in vpisana števka v igri; brez modre podlage danosti.
async function danostiResevalca(b) {
  console.log('Barve danosti (1280 px)');
  await b.odpri('igra/index.html', { sirina: 1280, visina: 900 });
  await b.izvedi('zacniIgro(PRIMERI[0].danosti)');
  await b.izvedi(OZNACI(`document.querySelectorAll('#mreza .celica')[PRIMERI[0].danosti.indexOf('0')]`));
  await b.klikni('[data-videz]');
  await b.klikni('#nizVpisi button:not(:disabled)');
  const igra = await b.izvedi(`(() => { const s = e => { const c = getComputedStyle(e); return c.color + ' ' + c.fontWeight; };
    return { dana: s(document.querySelector('#mreza .celica.dana')), vpis: s(document.querySelector('#mreza .celica.vpis')) }; })()`);
  await b.odpri('app/index.html', { sirina: 1280, visina: 900 });
  await b.izvedi(`(() => { const sel = document.getElementById('exampleSelect'); sel.value = '2'; sel.dispatchEvent(new Event('change')); })()`);
  await b.klikni('#candBtn');
  await b.klikni('#solveBtn');
  await b.cakaj(`document.getElementById('results').style.display === 'block'`, 20000);
  await b.klikni('#openStepsBtn');
  await b.izvedi(`document.querySelectorAll('.mini-toggle')[4].click()`);
  const r = await b.izvedi(`(() => {
    const s = izb => { const e = document.querySelector(izb), c = getComputedStyle(e); return { barva: c.color + ' ' + c.fontWeight, podlaga: c.backgroundColor }; };
    const vnos = [...document.querySelectorAll('#inputGrid input')].find(i => i.value);
    return { vnos: getComputedStyle(vnos).color, dana: s('#solvedGrid .was-given'), izpeljana: s('#solvedGrid .was-solved'),
      kandDana: s('#candidateGrid .ccell.given'), miniDana: s('.mini-container .mcell.given'), miniIzpeljana: s('.mini-container .mcell.solved-num'),
      legenda: document.querySelector('.legend-grid').textContent.replace(/\\s+/g, ' ').trim() };
  })()`);
  const bela = x => x.podlaga === 'rgba(0, 0, 0, 0)' || x.podlaga === 'rgb(255, 255, 255)';
  preveri('reševalec: dana števka v rešitvi kot dana v igri, brez modre podlage', r.dana.barva === igra.dana && bela(r.dana), { r: r.dana, igra: igra.dana });
  preveri('reševalec: izpeljana števka v rešitvi modra kot vpis v igri', r.izpeljana.barva.split(' ')[0] === igra.vpis.split(' ')[0] && bela(r.izpeljana), { r: r.izpeljana, igra: igra.vpis });
  preveri('reševalec: dana v kandidatih in mali mreži kot dana v igri', r.kandDana.barva === igra.dana && r.miniDana.barva === igra.dana && bela(r.kandDana) && bela(r.miniDana), r);
  preveri('reševalec: izpeljana v mali mreži modra', r.miniIzpeljana.barva.split(' ')[0] === igra.vpis.split(' ')[0], r.miniIzpeljana);
  preveri('reševalec: števke vnosne mreže temne', r.vnos === 'rgb(36, 48, 61)', r.vnos);
  preveri('reševalec: legenda »dana / izpeljana«', r.legenda === '5dana 5izpeljana', r.legenda);
}

// Značke ravni v treningu (N10) imajo barve oznake koraka (.tag.t-*), okno zbirke v reševalcu
// ima opis nad gumbi kot v igri (N11).
async function znackeInOkno(b) {
  console.log('Značke ravni in okno zbirke (1280 px)');
  await b.odpri('trening/index.html', { sirina: 1280, visina: 900 });
  const z = await b.izvedi(`(() => {
    const barva = e => { const c = getComputedStyle(e); return c.backgroundColor + ' / ' + c.color; };
    return [['lahka', 't-single'], ['srednja', 't-pair'], ['napredna', 't-advanced']].map(([r, t]) => {
      const oznaka = document.createElement('span'); oznaka.className = 'tag ' + t; document.body.appendChild(oznaka);
      const v = { raven: r, znacka: barva(document.querySelector('.badge-' + r)), oznaka: barva(oznaka) };
      oznaka.remove(); return v;
    });
  })()`);
  for (const v of z) preveri(`značka ${v.raven}: barva kot oznaka koraka`, v.znacka === v.oznaka, v);
  const prej = (a, c) => `!!(document.querySelector('${a}').compareDocumentPosition(document.querySelector('${c}')) & Node.DOCUMENT_POSITION_FOLLOWING)`;
  await b.odpri('igra/index.html', { sirina: 1280, visina: 900 });
  preveri('igra, okno zbirke: opis nad gumbi', await b.izvedi(prej('#zbirkaDialog .namig', '#zbirkaDialog .zbirka-gumbi')));
  await b.odpri('app/index.html', { sirina: 1280, visina: 900 });
  preveri('reševalec, okno zbirke: opis nad gumbi', await b.izvedi(prej('#library .cand-hint', '#library .lib-tools')));
}

async function main() {
  const b = await zazeni();
  try {
    await skupniVidez(b);
    await danostiResevalca(b);
    await znackeInOkno(b);
    for (const sirina of SIRINE) {
      await resevalec(b, sirina);
      await igra(b, sirina);
      await trening(b, sirina);
    }
    for (const sirina of SIRINE.filter(s => s === 375 || s === 1280)) await izbiraCelice(b, sirina);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
