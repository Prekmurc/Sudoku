'use strict';
// Shema vzorca pri razlagi tehnik (faza 3a, docs/faza3a-nacrt.md; shared/sheme.js, slogi v
// shared/pomoc.css) v pravem brskalniku: trening pri 375 in 1280 px. Za vsako tehniko s shemo
// (SHEME_TEHNIK) razdelek »Shema« nad mrežo vaje – v »Spoznaj« odprt, v »Vadi v uganki« zaprt,
// stanje ostane ob naslednji vaji –; risba v kartici vaje, največ 327 px, brez vodoravnega
// preliva; vsaka črka in »…« v svoji celici; barve celic vzorca in izbrisa ter prečrtanega
// kandidata enake legendi treninga (izračunan slog); napisi; E1 brez razdelka; brez napak JS.
// Popravki po pregledu koraka 1 (razdelek 8 načrta): črke v celici vzorca ne segajo v zlati okvir
// (tudi tri črke pri trojicah), opomba pri trojicah, rožnata »celica izbrisa« v legendi (barva),
// ime tehnike nad vajo (.ex-label) s kontrastom vsaj 4,5 : 1 in črkami vsaj 14 px (»Spoznaj« in
// »Vadi v uganki«), »Nazaj na izbiro« pusti meni pri kartici tehnike, iz katere si prišel.
// Posnetke zaslona shrani v mapo (--mapa, privzeto začasna).
//
//   node tools/preveri-sheme-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-sheme');
const SIRINE = [375, 1280];

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const pocakaj = (b, ms = 250) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

// Meritev sheme v vaji: razdelek, odprtost, mere risbe glede na kartico, črke v celicah, barve.
const MERI = `(() => {
  const ex = document.querySelector('#exerciseArea .exercise'), d = ex && ex.querySelector('.shema-razdelek');
  if (!d) return { razdelek: false };
  const svg = d.querySelector('svg.shema-risba'), e = ex.getBoundingClientRect(), r = svg ? svg.getBoundingClientRect() : null;
  const sonda = (lastnost, v) => { const s = document.createElement('span'); s.style[lastnost] = 'var(' + v + ')'; document.body.appendChild(s);
    const c = getComputedStyle(s)[lastnost]; s.remove(); return c; };
  const out = { razdelek: true, odprt: d.open, povzetek: d.querySelector('summary').textContent };
  // Razdelek je pred mrežo vaje (za njim ni več elementov z besedilom naloge).
  const otroci = [...ex.children]; out.zaRazlago = otroci.indexOf(d) === otroci.findIndex(o => o.classList.contains('razlaga-tehnike')) + 1;
  if (!d.open) return out;
  const de = document.documentElement;
  out.preliv = de.scrollWidth > de.clientWidth;
  out.risba = [r.left, r.right, r.width, r.height]; out.kartica = [e.left, e.right];
  const st = getComputedStyle(ex), notranja = [e.left + parseFloat(st.paddingLeft), e.right - parseFloat(st.paddingRight)];
  out.vKartici = r.left >= notranja[0] - 0.5 && r.right <= notranja[1] + 0.5;
  // Celice: vsak <text> mora biti v pravokotniku svoje celice (36 enot, rob 1.5).
  const vb = svg.viewBox.baseVal, k = r.width / vb.width;
  out.crkeVCelicah = [...svg.querySelectorAll('text')].every(t => {
    const b = t.getBBox(), x = +t.getAttribute('x'), c = Math.floor((x - 1.5) / 36), y = +t.getAttribute('y'), v = Math.floor((y - 1.5) / 36);
    return b.x >= 1.5 + c * 36 && b.x + b.width <= 1.5 + (c + 1) * 36 && b.y >= 1.5 + v * 36 && b.y + b.height <= 1.5 + (v + 1) * 36;
  });
  out.zetonov = svg.querySelectorAll('text').length;
  // Črke v celici vzorca ne segajo v zlati okvir (pravokotnik z odmikom 1,75 in črto 2,5 - notranji
  // rob je 3 enote od roba celice).
  out.crkeVOkvirju = [...svg.querySelectorAll('.sh-vzorec')].every(p => {
    const x = +p.getAttribute('x') + 1.25, y = +p.getAttribute('y') + 1.25, w = +p.getAttribute('width') - 2.5, h = +p.getAttribute('height') - 2.5;
    return [...svg.querySelectorAll('text')].filter(t => { const tx = +t.getAttribute('x'), ty = +t.getAttribute('y'); return tx > x && tx < x + w && ty > y && ty < y + h; })
      .every(t => { const b = t.getBBox(); return b.x >= x && b.x + b.width <= x + w; });
  });
  out.triCrke = [...svg.querySelectorAll('.sh-vzorec')].some(p => {
    const x = +p.getAttribute('x'), y = +p.getAttribute('y');
    return [...svg.querySelectorAll('text')].filter(t => { const tx = +t.getAttribute('x'), ty = +t.getAttribute('y'); return tx > x && tx < x + 33 && ty > y && ty < y + 33; }).length === 3;
  });
  out.velikostCrke = svg.querySelector('text') ? parseFloat(getComputedStyle(svg.querySelector('text')).fontSize) * k : 0;
  const vz = svg.querySelector('.sh-vzorec'), iz = svg.querySelector('.sh-izbris'), pr = svg.querySelector('.sh-precrtan');
  // Pike »…« (krožci) in prečrtanja v svoji celici.
  out.pikeVCelicah = [...svg.querySelectorAll('circle, .sh-crta-izbris')].every(o => {
    const b = o.getBBox(), c = Math.floor((b.x + b.width / 2 - 1.5) / 36), v = Math.floor((b.y + b.height / 2 - 1.5) / 36);
    return b.x >= 1.5 + c * 36 && b.x + b.width <= 1.5 + (c + 1) * 36 && b.y >= 1.5 + v * 36 && b.y + b.height <= 1.5 + (v + 1) * 36;
  });
  const vzorec = { fill: getComputedStyle(vz).fill, stroke: getComputedStyle(vz).stroke };
  out.barve = {
    vzorecBg: vzorec.fill === sonda('backgroundColor', '--k-vzorec-bg'),
    vzorecOkvir: vzorec.stroke === sonda('backgroundColor', '--okvir-vzorec'),
    izbris: !iz || getComputedStyle(iz).fill === sonda('backgroundColor', '--k-izbris-bg'),
    precrtan: !!pr && getComputedStyle(pr).fill === sonda('color', '--red'),
    legendaVzorec: getComputedStyle(d.querySelector('.shema-sw-vzorec')).backgroundColor === sonda('backgroundColor', '--k-vzorec-bg'),
    legendaIzbris: !iz || getComputedStyle(d.querySelector('.shema-sw-izbris')).backgroundColor === sonda('backgroundColor', '--k-izbris-bg'),
  };
  out.rozna = !!iz;
  out.napisi = [...d.querySelectorAll('.shema-legenda > span, .shema-crke, .shema-opomba, .shema-enako')].map(e => e.textContent);
  return out;
})()`;

// Ime tehnike nad vajo (.ex-label): barva, podlaga kartice, kontrast po WCAG, velikost črk.
const IME = `(() => {
  const e = document.querySelector('#exerciseArea .ex-label'), s = getComputedStyle(e), ex = e.closest('.exercise');
  const rgb = c => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const sv = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [a, b] = [sv(s.color), sv(getComputedStyle(ex).backgroundColor)].sort((x, y) => y - x);
  return { besedilo: e.textContent, barva: s.color, podlaga: getComputedStyle(ex).backgroundColor, kontrast: (a + 0.05) / (b + 0.05), velikost: parseFloat(s.fontSize) };
})()`;

// Meni: položaj in ali je kartica tehnike vsa v oknu.
const MENI = kljuc => `(() => { const r = document.querySelector('.menu-card[data-mode="${kljuc}"]').getBoundingClientRect();
  return { y: scrollY, vidna: r.top >= 0 && r.bottom <= innerHeight, meni: getComputedStyle(document.getElementById('menu')).display }; })()`;

async function sirina(b, sir, kljuci, stevilo) {
  console.log(`trening, ${sir} px`);
  await b.odpri('trening/index.html', { sirina: sir, visina: 900, mobilno: sir < 500 });
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  for (const kljuc of kljuci) {
    // »Spoznaj« (klik kartice): razdelek odprt. Kartica najprej na sredino okna (meni se mora
    // po vrnitvi vrniti sem, ne na začetek).
    await b.izvedi(`document.querySelector('.menu-card[data-mode="${kljuc}"]').scrollIntoView({ block: 'center' }); true`);
    await pocakaj(b, 100);
    const pred = await b.izvedi(MENI(kljuc));
    await b.klikni(`.menu-card[data-mode="${kljuc}"]`);
    await pocakaj(b);
    const m = await b.izvedi(MERI);
    preveri(`${kljuc}, Spoznaj: razdelek »Shema« odprt, takoj za »Razlaga«`, m.razdelek && m.odprt && m.povzetek === 'Shema' && m.zaRazlago, m);
    preveri(`${kljuc}: risba v kartici, največ 327 px, brez preliva`, m.vKartici && m.risba[2] <= 327.5 && !m.preliv, m);
    preveri(`${kljuc}: ${m.zetonov} črk, vsaka črka, pika in prečrtanje v svoji celici, črke ${m.velikostCrke && m.velikostCrke.toFixed(1)} px`,
      m.crkeVCelicah && m.pikeVCelicah && m.zetonov === stevilo[kljuc] && m.velikostCrke >= 11, m);
    preveri(`${kljuc}: barve kot legenda treninga`, Object.values(m.barve).every(Boolean), m.barve);
    const trojica = kljuc.endsWith('triple');
    const napisi = ['celic', ...(m.rozna ? ['celica izbrisa'] : []), 'za izbris', 'poljubn', ...(trojica ? ['Celica trojice ima dve ali vse tri črke.'] : []), 'Enako velja'];
    preveri(`${kljuc}: legenda (${m.rozna ? 'z rožnato celico izbrisa' : 'brez rožnate celice'}) in napisi${trojica ? ' z opombo' : ''}`,
      m.napisi.length === napisi.length && napisi.every((n, i) => m.napisi[i].includes(n)), m.napisi);
    preveri(`${kljuc}: črke v celici vzorca ne segajo v zlati okvir${trojica ? ', celica s tremi črkami' : ''}`, m.crkeVOkvirju && m.triCrke === trojica, m);
    const ime = await b.izvedi(IME);
    preveri(`${kljuc}, Spoznaj: ime tehnike kontrast ${ime.kontrast.toFixed(1)} : 1, ${ime.velikost} px`, ime.kontrast >= 4.5 && ime.velikost >= 14, ime);
    await b.izvedi(`document.querySelector('.shema-razdelek').scrollIntoView({ block: 'start' }); true`);
    await pocakaj(b, 100);
    await b.posnetek(path.join(mapa, `shema-${kljuc}-${sir}.png`), { vsaStran: false });
    // Zaprt razdelek ostane zaprt v naslednji vaji.
    await b.izvedi(`document.querySelector('.shema-razdelek summary').scrollIntoView({ block: 'center' }); true`);
    await b.klikni('.shema-razdelek summary');
    await pocakaj(b, 100);
    // Naslednja vaja kot gumb »Naslednja vaja →« (ta je viden šele po odgovoru).
    await b.izvedi(`(() => { exNum++; renderExercise(); return true; })()`);
    await pocakaj(b);
    const m2 = await b.izvedi(MERI);
    preveri(`${kljuc}: zaprt razdelek ostane zaprt v naslednji vaji`, m2.razdelek && !m2.odprt, m2);
    await b.klikni('#backBtn');
    await pocakaj(b);
    const n1 = await b.izvedi(MENI(kljuc));
    preveri(`${kljuc}: po »Nazaj na izbiro« (Spoznaj) meni pri tej kartici, položaj kot prej (${pred.y} → ${n1.y})`, n1.vidna && n1.y === pred.y && n1.meni === 'block', { pred, n1 });
    // »Vadi v uganki«: razdelek zaprt. Gumb na sredino okna (klik bi sicer stran pred klikom
    // pomaknil do gumba).
    await b.izvedi(`document.querySelector('.menu-card[data-mode="${kljuc}"] .nacin-btn.vadi').scrollIntoView({ block: 'center' }); true`);
    await pocakaj(b, 100);
    const pred2 = await b.izvedi(MENI(kljuc));
    await b.klikni(`.menu-card[data-mode="${kljuc}"] .nacin-btn.vadi`);
    await b.cakaj(`!!document.querySelector('#exerciseArea .vaja-uganka')`, 15000);
    const m3 = await b.izvedi(MERI);
    preveri(`${kljuc}, Vadi v uganki: razdelek »Shema« zaprt`, m3.razdelek && !m3.odprt && m3.zaRazlago, m3);
    const ime3 = await b.izvedi(IME);
    preveri(`${kljuc}, Vadi v uganki: ime tehnike kontrast ${ime3.kontrast.toFixed(1)} : 1, ${ime3.velikost} px`, ime3.kontrast >= 4.5 && ime3.velikost >= 14, ime3);
    await b.klikni('#backBtn');
    await pocakaj(b);
    const n2 = await b.izvedi(MENI(kljuc));
    preveri(`${kljuc}: po »Nazaj na izbiro« (Vadi v uganki) meni pri tej kartici`, n2.vidna && n2.y === pred2.y, { pred2, n2 });
  }
  await b.klikni('.menu-card[data-mode="naked-single"]');
  await pocakaj(b);
  preveri('E1: brez razdelka »Shema«', (await b.izvedi(MERI)).razdelek === false);
  await b.klikni('#backBtn');
  await pocakaj(b);
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    await b.odpri('trening/index.html', { sirina: 1280, visina: 900 });
    const kljuci = await b.izvedi('Object.keys(SHEME_TEHNIK)');
    const stevilo = await b.izvedi(`Object.fromEntries(Object.keys(SHEME_TEHNIK).map(k => [k,
      SHEME_TEHNIK[k].celice.reduce((n, z) => n + shemaCelica(z).zetoni.filter(t => t.z !== '…').length, 0)]))`);
    for (const s of SIRINE) await sirina(b, s, kljuci, stevilo);
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `NAPAK: ${napak}` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
