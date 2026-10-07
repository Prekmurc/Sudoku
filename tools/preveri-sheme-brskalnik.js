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
// Korak 2: sheme 1, 2 (pas) in 7, 8 (9 × 9), opomba pri 1, 2, 5, 6, 8; vaja začne na vrhu strani
// (glava v oknu); pri 375 px izpiše, kje se začne mreža vaje in kje je gumb »Preveri« (pod višino
// 667 in 812 px – telefon), brez preverjanja.
// Popravka po pregledu koraka 2: razdelek je v »Spoznaj« odprt pri vseh tehnikah (tudi 9 × 9);
// prečrtan kandidat je temna črka z rdečo črto (izračunan slog, tudi v legendi).
// Korak 3: sheme 9 (dve risbi z naslovom), 10, 11, 12 – vse risbe v kartici, povezave (barva in
// črtkanje, vzorčki v legendi), vsaka črka v svoji celici.
// Popravek po pregledu koraka 3: celice vzorca druge vrste (W-krilo: celici povezave, XY-krilo:
// pivot) – bledejša podlaga in črtkan okvir (izračunan slog), svoja postavka v legendi; sklep pri
// W-krilu.
// Korak 4: sheme v oknu Pomoč (»Tehnike«) v igri, reševalcu in treningu pri 375 in 1280 px – pri
// 1–12 zložljivo »Shema«, privzeto zaprto, E1 in E2 brez; pravi klik na »Shema« odpre risbo, ki je
// v panelu, največ 327 px, brez vodoravnega drsnika (stran in okno), z istimi meritvami kot v
// treningu (črke v celicah, barve, legenda, napisi); izpiše višino okna z zaprtimi in z vsemi
// odprtimi shemami.
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
const izmerjeno = [];
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const pocakaj = (b, ms = 250) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

// Meritev sheme: razdelek (details), odprtost, mere risbe glede na kartico (ex – kartica vaje ali
// panel okna Pomoč), črke v celicah, barve. zaIzraz pove, ali je razdelek na pravem mestu; barve
// so imena spremenljivk, s katerimi se primerjajo barve celic (v treningu legenda treninga, v igri
// in reševalcu, kjer je ni, spremenljivke sheme - te so v treningu že primerjane z legendo).
const BARVE_TRENING = { vzorec: '--k-vzorec-bg', okvir: '--okvir-vzorec', izbris: '--k-izbris-bg' };
const BARVE_SHEME = { vzorec: '--shema-vzorec-bg', okvir: '--shema-vzorec-okvir', izbris: '--shema-izbris-bg' };
const meri = (exIzraz, dIzraz, zaIzraz, barve) => `(() => {
  const ex = ${exIzraz}, d = ex && ${dIzraz};
  if (!d) return { razdelek: false };
  const svgi = [...d.querySelectorAll('svg.shema-risba')], e = ex.getBoundingClientRect();
  const sonda = (lastnost, v) => { const s = document.createElement('span'); s.style[lastnost] = 'var(' + v + ')'; document.body.appendChild(s);
    const c = getComputedStyle(s)[lastnost]; s.remove(); return c; };
  const out = { razdelek: true, odprt: d.open, povzetek: d.querySelector('summary').textContent };
  out.zaRazlago = ${zaIzraz};
  if (!d.open) return out;
  const de = document.documentElement, dlg = d.closest('.dialog');
  out.preliv = de.scrollWidth > de.clientWidth || (!!dlg && dlg.scrollWidth > dlg.clientWidth);
  out.risb = svgi.length; out.kartica = [e.left, e.right];
  const st = getComputedStyle(ex), notranja = [e.left + parseFloat(st.paddingLeft), e.right - parseFloat(st.paddingRight)];
  out.risbe = svgi.map(svg => { const r = svg.getBoundingClientRect(); return [r.left, r.right, r.width, r.height]; });
  out.vKartici = out.risbe.every(r => r[0] >= notranja[0] - 0.5 && r[1] <= notranja[1] + 0.5);
  out.naslovi = [...d.querySelectorAll('.shema-naslov')].map(n => n.textContent);
  const vse = (sel) => svgi.flatMap(svg => [...svg.querySelectorAll(sel)]);
  const svg = svgi[0], k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  // Celice: vsak <text> mora biti v pravokotniku svoje celice (36 enot, rob 1.5).
  out.crkeVCelicah = vse('text').every(t => {
    const b = t.getBBox(), x = +t.getAttribute('x'), c = Math.floor((x - 1.5) / 36), y = +t.getAttribute('y'), v = Math.floor((y - 1.5) / 36);
    return b.x >= 1.5 + c * 36 && b.x + b.width <= 1.5 + (c + 1) * 36 && b.y >= 1.5 + v * 36 && b.y + b.height <= 1.5 + (v + 1) * 36;
  });
  out.zetonov = vse('text').length;
  // Črke v celici vzorca ne segajo v zlati okvir (pravokotnik z odmikom 1,75 in črto 2,5 - notranji
  // rob je 3 enote od roba celice).
  out.crkeVOkvirju = svgi.every(svg => [...svg.querySelectorAll('.sh-vzorec')].every(p => {
    const x = +p.getAttribute('x') + 1.25, y = +p.getAttribute('y') + 1.25, w = +p.getAttribute('width') - 2.5, h = +p.getAttribute('height') - 2.5;
    return [...svg.querySelectorAll('text')].filter(t => { const tx = +t.getAttribute('x'), ty = +t.getAttribute('y'); return tx > x && tx < x + w && ty > y && ty < y + h; })
      .every(t => { const b = t.getBBox(); return b.x >= x && b.x + b.width <= x + w; });
  }));
  out.triCrke = svgi.some(svg => [...svg.querySelectorAll('.sh-vzorec')].some(p => {
    const x = +p.getAttribute('x'), y = +p.getAttribute('y');
    return [...svg.querySelectorAll('text')].filter(t => { const tx = +t.getAttribute('x'), ty = +t.getAttribute('y'); return tx > x && tx < x + 33 && ty > y && ty < y + 33; }).length === 3;
  }));
  out.velikostCrke = svg.querySelector('text') ? parseFloat(getComputedStyle(svg.querySelector('text')).fontSize) * k : 0;
  const vz = svg.querySelector('.sh-vzorec:not(.sh-vzorec2)'), iz = vse('.sh-izbris')[0], pr = vse('text.sh-precrtan')[0], crta = vse('.sh-crta-izbris')[0];
  // Pike »…« (krožci) in prečrtanja v svoji celici.
  out.pikeVCelicah = vse('circle, .sh-crta-izbris').every(o => {
    const b = o.getBBox(), c = Math.floor((b.x + b.width / 2 - 1.5) / 36), v = Math.floor((b.y + b.height / 2 - 1.5) / 36);
    return b.x >= 1.5 + c * 36 && b.x + b.width <= 1.5 + (c + 1) * 36 && b.y >= 1.5 + v * 36 && b.y + b.height <= 1.5 + (v + 1) * 36;
  });
  const vzorec = { fill: getComputedStyle(vz).fill, stroke: getComputedStyle(vz).stroke };
  out.barve = {
    vzorecBg: vzorec.fill === sonda('backgroundColor', '${barve.vzorec}'),
    vzorecOkvir: vzorec.stroke === sonda('backgroundColor', '${barve.okvir}'),
    izbris: !iz || getComputedStyle(iz).fill === sonda('backgroundColor', '${barve.izbris}'),
    // Prečrtan kandidat: črka temna (kot druge), črta rdeča; v legendi enako (popravek 2).
    precrtanCrka: !pr || getComputedStyle(pr).fill === sonda('color', '--ink'),
    precrtanCrta: !!crta && getComputedStyle(crta).stroke === sonda('color', '--red') && parseFloat(getComputedStyle(crta).strokeWidth) >= 2,
    legendaPrecrtan: !d.querySelector('.shema-izbris') || (getComputedStyle(d.querySelector('.shema-izbris')).color === sonda('color', '--ink')
      && getComputedStyle(d.querySelector('.shema-izbris')).textDecorationColor === sonda('color', '--red')
      && getComputedStyle(d.querySelector('.shema-izbris')).textDecorationLine === 'line-through'),
    legendaVzorec: getComputedStyle(d.querySelector('.shema-sw-vzorec')).backgroundColor === sonda('backgroundColor', '${barve.vzorec}'),
    legendaIzbris: !iz || getComputedStyle(d.querySelector('.shema-sw-izbris')).backgroundColor === sonda('backgroundColor', '${barve.izbris}'),
  };
  // Celice vzorca druge vrste (popravek po pregledu koraka 3): bledejša podlaga, isti zlati okvir,
  // črtkan; v legendi enako.
  const v2 = vse('.sh-vzorec2'), sw2 = d.querySelector('.shema-sw-vzorec2');
  out.vzorec2 = v2.length;
  if (v2.length) {
    const c = getComputedStyle(v2[0]), l = sw2 && getComputedStyle(sw2);
    out.barve.vzorec2 = c.fill === sonda('backgroundColor', '--shema-vzorec2-bg') && c.fill !== vzorec.fill
      && c.stroke === vzorec.stroke && c.strokeDasharray !== 'none';
    out.barve.legendaVzorec2 = !!l && l.backgroundColor === c.fill && l.borderTopStyle === 'dashed' && l.borderTopColor === vzorec.stroke;
  } else out.barve.brezVzorca2 = !sw2;
  out.rozna = !!iz;
  // Povezave: barva, debelina, črtkanje; vzorček v legendi v istem slogu.
  const slog = el => { const c = getComputedStyle(el); return [c.stroke, c.strokeWidth, c.strokeDasharray].join(' '); };
  out.povezave = {};
  for (const r of ['sh-povezava', 'sh-vidita', 'sh-vidi']) {
    const na = vse('.' + r), v = d.querySelector('.shema-legenda .' + r);
    out.povezave[r] = { stevilo: na.length, legenda: !!v, enako: na.length === 0 ? !v : !!v && slog(v) === slog(na[0]),
      barva: na.length ? getComputedStyle(na[0]).stroke : null, crtkana: na.length ? getComputedStyle(na[0]).strokeDasharray !== 'none' : null };
  }
  out.barvaPovezave = sonda('color', '--shema-povezava'); out.rdeca = sonda('color', '--red');
  out.napisi = [...d.querySelectorAll('.shema-legenda > span, .shema-sklep, .shema-crke, .shema-opomba, .shema-enako')].map(e => e.textContent);
  return out;
})()`;
// V treningu: razdelek v kartici vaje, takoj za »Razlaga« (pred mrežo vaje).
const MERI = meri(`document.querySelector('#exerciseArea .exercise')`, `ex.querySelector('.shema-razdelek')`,
  `(() => { const o = [...ex.children]; return o.indexOf(d) === o.findIndex(x => x.classList.contains('razlaga-tehnike')) + 1; })()`, BARVE_TRENING);
// V oknu Pomoč: razdelek tehnike k v panelu, takoj za odstavkom posledice.
const MERI_POMOC = (okno, k) => meri(`document.querySelector(${JSON.stringify(okno)} + ' .dialog-panel')`,
  `[...ex.querySelectorAll('.tehnika-shema')].find(x => x.querySelector('.shema').dataset.tehnika === ${JSON.stringify(k)})`,
  `d.parentElement.tagName === 'LI' && d.previousElementSibling.tagName === 'P' && d.parentElement.lastElementChild === d`, BARVE_SHEME);

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

// Vrh strani ob vstopu v vajo in spodnji rob gumba »Preveri« (od vrha strani).
const VRH = `(() => { const g = document.querySelector('header.top').getBoundingClientRect(), p = [...document.querySelectorAll('#exerciseArea button')].find(b => b.textContent === 'Preveri');
  const s = document.querySelector('#exerciseArea .shema-razdelek'), m = s && s.nextElementSibling;
  return { y: scrollY, glava: g.top, preveri: p ? Math.round(p.getBoundingClientRect().bottom + scrollY) : null,
    mreza: m ? Math.round(m.getBoundingClientRect().top + scrollY) : null, mrezaRazred: m ? m.className : null }; })()`;

// Pregled meritve sheme (trening in Pomoč): risbe, naslovi, povezave, črke, barve, legenda, napisi.
function pregledMeritve(kljuc, m, info) {
  const trojica = kljuc.endsWith('triple');
  const { vzorec, vzorec2, sklep, opomba, enako } = info[kljuc];
  preveri(`${kljuc}: ${m.risb} ${m.risb === 1 ? 'risba' : 'risbi'} v kartici, največ 327 px, brez preliva`,
    m.vKartici && m.risb === info[kljuc].risb && m.risbe.every(r => r[2] <= 327.5) && !m.preliv, m);
  if (info[kljuc].naslovi.length) preveri(`${kljuc}: naslova risb`, JSON.stringify(m.naslovi) === JSON.stringify(info[kljuc].naslovi), m.naslovi);
  const pov = Object.entries(m.povezave);
  preveri(`${kljuc}: povezave ${pov.map(([r, p]) => p.stevilo).join('/')} – barva, črtkanje, vzorček v legendi`,
    pov.every(([r, p]) => p.stevilo === info[kljuc].povezave[r] && p.enako && (p.stevilo === 0
      || (p.barva === (r === 'sh-vidi' ? m.rdeca : m.barvaPovezave) && p.crtkana === (r !== 'sh-povezava')))), m.povezave);
  preveri(`${kljuc}: ${m.zetonov} črk, vsaka črka, pika in prečrtanje v svoji celici, črke ${m.velikostCrke && m.velikostCrke.toFixed(1)} px`,
    m.crkeVCelicah && m.pikeVCelicah && m.zetonov === info[kljuc].stevilo && m.velikostCrke >= 11, m);
  preveri(`${kljuc}: barve celic in legende${m.vzorec2 ? `, ${m.vzorec2} ${m.vzorec2 === 1 ? 'celica' : 'celici'} druge vrste (${vzorec2}) bledejši s črtkanim okvirjem` : ''}`,
    Object.values(m.barve).every(Boolean) && m.vzorec2 === info[kljuc].vzorec2Celic, m.barve);
  const crte = [['sh-povezava', 'povezava'], ['sh-vidita', 'se vidita'], ['sh-vidi', 'celica izbrisa vidi']].filter(([r]) => info[kljuc].povezave[r]).map(([, n]) => n);
  const napisi = [vzorec, ...(vzorec2 ? [vzorec2] : []), ...(m.rozna ? ['celica izbrisa'] : []), 'za izbris', ...crte, ...(sklep ? [sklep] : []), 'poljubn', ...(opomba ? [opomba] : []), ...(enako ? ['Enako velja'] : [])];
  preveri(`${kljuc}: legenda (${m.rozna ? 'z rožnato celico izbrisa' : 'brez rožnate celice'}) in napisi${opomba ? ' z opombo' : ''}`,
    m.napisi.length === napisi.length && napisi.every((n, i) => m.napisi[i].includes(n)), m.napisi);
  preveri(`${kljuc}: črke v celici vzorca ne segajo v zlati okvir${trojica ? ', celica s tremi črkami' : ''}`, m.crkeVOkvirju && m.triCrke === trojica, m);
}

async function sirina(b, sir, kljuci, info) {
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
    const vrh = await b.izvedi(VRH);
    preveri(`${kljuc}, Spoznaj: vaja začne na vrhu strani, glava v oknu (prej ${pred.y})`, vrh.y === 0 && vrh.glava >= 0, vrh);
    if (sir < 500) console.log(`    · ${kljuc}: mreža vaje (${vrh.mrezaRazred}) od ${vrh.mreza} px, spodnji rob »Preveri« ${vrh.preveri} px od vrha (${vrh.preveri > 667 ? 'pod' : 'nad'} 667, ${vrh.preveri > 812 ? 'pod' : 'nad'} 812)`);
    izmerjeno.push({ kljuc, sir, ...vrh });
    const m = await b.izvedi(MERI);
    preveri(`${kljuc}, Spoznaj: razdelek »Shema« odprt, takoj za »Razlaga«`, m.razdelek && m.odprt && m.povzetek === 'Shema' && m.zaRazlago, m);
    pregledMeritve(kljuc, m, info);
    const ime = await b.izvedi(IME);
    preveri(`${kljuc}, Spoznaj: ime tehnike kontrast ${ime.kontrast.toFixed(1)} : 1, ${ime.velikost} px`, ime.kontrast >= 4.5 && ime.velikost >= 14, ime);
    await b.izvedi(`document.querySelector('.shema-razdelek').scrollIntoView({ block: 'start' }); true`);
    await pocakaj(b, 100);
    await b.posnetek(path.join(mapa, `shema-${kljuc}-${sir}.png`), { vsaStran: false });
    if (info[kljuc].risb > 1) {
      await b.izvedi(`document.querySelectorAll('.shema-razdelek .shema-naslov')[1].scrollIntoView({ block: 'start' }); true`);
      await pocakaj(b, 100);
      await b.posnetek(path.join(mapa, `shema-${kljuc}-2-${sir}.png`), { vsaStran: false });
    }
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

// Korak 4: sheme v oknu Pomoč (»Tehnike«) v vseh treh aplikacijah.
const APLIKACIJE = [
  { ime: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog' },
  { ime: 'reševalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
  { ime: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
];
async function pomoc(b, a, sir, kljuci, info) {
  console.log(`Pomoč, ${a.ime}, ${sir} px`);
  await b.odpri(a.stran, { sirina: sir, visina: 800, mobilno: sir < 500 });
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  await b.klikni(a.gumb);
  await pocakaj(b);
  const okno = JSON.stringify(a.okno);
  const zacetek = await b.izvedi(`(() => { const o = document.querySelector(${okno}), li = [...o.querySelectorAll('.tehnike li')];
    return { odprto: o.classList.contains('odprt'), visina: o.querySelector('.dialog-panel').scrollHeight,
      sheme: li.map(l => { const d = l.querySelector('details.tehnika-shema'); return d ? [d.querySelector('.shema').dataset.tehnika, d.open, d.querySelector('summary').textContent] : null; }) }; })()`);
  const sheme = zacetek.sheme.filter(Boolean);
  preveri(`okno odprto; »Shema« pri ${sheme.length} tehnikah (1–12), E1 in E2 brez, vse zaprte`,
    zacetek.odprto && zacetek.sheme.length === 14 && zacetek.sheme[0] === null && zacetek.sheme[1] === null
    && JSON.stringify(sheme.map(x => x[0])) === JSON.stringify(kljuci) && sheme.every(x => x[1] === false && x[2] === 'Shema'), zacetek);
  for (const kljuc of kljuci) {
    const sel = `${a.okno} .tehnika-shema:has(.shema[data-tehnika="${kljuc}"]) > summary`;
    await b.izvedi(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({ block: 'start' }); true`);
    await pocakaj(b, 100);
    await b.klikni(sel);
    await pocakaj(b, 150);
    const m = await b.izvedi(MERI_POMOC(a.okno, kljuc));
    preveri(`${kljuc}: pravi klik odpre »Shema« pod posledico`, m.razdelek && m.odprt && m.povzetek === 'Shema' && m.zaRazlago, m);
    if (!m.odprt) continue;
    pregledMeritve(kljuc, m, info);
    if (sir < 500 && a.ime === 'igra') await b.posnetek(path.join(mapa, `pomoc-${kljuc}-${sir}.png`), { vsaStran: false });
  }
  const konec = await b.izvedi(`(() => { const o = document.querySelector(${okno}), d = document.documentElement;
    return { visina: o.querySelector('.dialog-panel').scrollHeight, preliv: d.scrollWidth > d.clientWidth || o.scrollWidth > o.clientWidth }; })()`);
  preveri('vse sheme odprte: brez vodoravnega drsnika', !konec.preliv, konec);
  console.log(`    · višina panela: z zaprtimi shemami ${zacetek.visina} px, z vsemi odprtimi ${konec.visina} px`);
  izmerjeno.push({ pomoc: a.ime, sir, zaprte: zacetek.visina, odprte: konec.visina });
  await b.tipka('Escape');
  await pocakaj(b);
  preveri('Escape zapre okno', !(await b.izvedi(`document.querySelector(${okno}).classList.contains('odprt')`)));
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    await b.odpri('trening/index.html', { sirina: 1280, visina: 900 });
    const kljuci = await b.izvedi('Object.keys(SHEME_TEHNIK)');
    const info = await b.izvedi(`Object.fromEntries(Object.keys(SHEME_TEHNIK).map(k => [k, {
      stevilo: shemaRisbe(k).flatMap(r => r.celice).reduce((n, z) => n + shemaCelica(z).zetoni.filter(t => t.z !== '…').length, 0),
      risb: shemaRisbe(k).length, naslovi: shemaRisbe(k).map(r => r.naslov).filter(Boolean),
      povezave: Object.fromEntries(SHEMA_POVEZAVE.map(([p, r]) => [r, shemaRisbe(k).reduce((n, x) => n + (x[p] || []).length, 0)])),
      vzorec: SHEME_TEHNIK[k].vzorec, vzorec2: SHEME_TEHNIK[k].vzorec2 || null, sklep: SHEME_TEHNIK[k].sklep || null,
      vzorec2Celic: shemaRisbe(k).flatMap(r => r.celice).filter(z => shemaCelica(z).vzorec2).length, opomba: SHEME_TEHNIK[k].opomba || null, enako: !!SHEME_TEHNIK[k].enako, izsek: SHEME_TEHNIK[k].izsek }]))`);
    for (const s of SIRINE) await sirina(b, s, kljuci, info);
    for (const s of SIRINE) for (const a of APLIKACIJE) await pomoc(b, a, s, kljuci, info);
    const t = izmerjeno.find(x => x.kljuc === 'turbot-fish' && x.sir === 375);
    if (t) console.log(`\n9 · Veriga ene števke pri 375 px, obe risbi odprti: mreža vaje (${t.mrezaRazred}) se začne ${t.mreza} px od vrha strani, spodnji rob »Preveri« ${t.preveri} px.`);
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `NAPAK: ${napak}` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
