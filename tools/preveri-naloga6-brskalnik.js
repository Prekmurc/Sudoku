'use strict';
// Naloga 6 »Podlage, legenda, Escape« v pravem brskalniku (docs/naloga6-nacrt.md), raste po
// korakih (--korak N, privzeto vsi narejeni).
//
// Korak 1 - podlagi vzorca in izbrisa (O1-O4) pri 375 px (posnemanje telefona) in 1280 px:
// igra (mreža koraka na tretji stopnji »Naslednjega koraka«, legenda pod korakom, kvadrat
// poudarka v jantarni celici, čipa »jantarne« in »rdeče prečrtani« v oknu Pomoč), reševalec
// (mala mreža koraka z izbrisom in legenda, povečan prikaz) in trening (spremenljivki) -
// izračunane podlage = #EFD8A0 / #F0B4AA, vzorček legende = celica, kandidati v obarvanih
// celicah --kand-ink (v reševalcu drugi kandidati --pencil, prečrtani rdeči), kontrasti iz
// tabele 2.1 načrta, shema v Pomoči v istih barvah; brez vodoravnega preliva in napak JS;
// posnetki igre in reševalca.
//
// Korak 2 (legenda »tvoje oznake«, O5) ni narejen (odločitev 2026-10-11).
//
// Korak 3 - Escape v reševalcu (O6, O7) pri 375 px (pravi dotik) in 1280 px (miška), pravi Escape:
// zapre povečavo rešitve in koraka; ob povečavi in oknu pod njo (zbirka, Pomoč - odprta s
// tipkovnico) prvi Escape povečavo, drugi okno; ob fokusu v polju Niz zapre povečavo in polje
// pusti; brez povečave okni kot prej; ✕ in dotik povečavo še zapreta; poved v Pomoči.
//
//   node tools/preveri-naloga6-brskalnik.js [--korak N] [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-naloga6'));
const KORAK = Number(arg('--korak', 3));
const D = JSON.stringify(loadPuzzles()[0].danosti.replace(/\./g, '0'));

const VZOREC = 'rgb(239, 216, 160)';   // #EFD8A0
const IZBRIS = 'rgb(240, 180, 170)';   // #F0B4AA
const KAND_INK = 'rgb(74, 85, 97)';    // #4A5561
const PENCIL = 'rgb(138, 148, 160)';   // #8A94A0
const RDECA = 'rgb(178, 58, 46)';      // --red
const INK = 'rgb(36, 48, 61)';         // --ink

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Kontrast po WCAG med dvema barvama rgb(...) - v strani in v Node.
const KONTRAST = `(a, b) => {
  const lum = rgb => { const k = rgb.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]; };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }`;
const kontrast = eval(KONTRAST);
const blizu = (x, y) => Math.abs(x - y) < 0.015;

const preliv = b => b.izvedi('document.documentElement.scrollWidth > document.documentElement.clientWidth');

// Posnetek elementa (dvojna ločljivost).
async function posnetekElementa(b, izbirnik, pot) {
  const r = await b.izvedi(`(() => { const el = document.querySelector(${JSON.stringify(izbirnik)}); el.scrollIntoView({ block: 'center' });
    const q = el.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, width: q.width, height: q.height }; })()`);
  const s = await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...r, scale: 2 } });
  fs.mkdirSync(mapa, { recursive: true });
  fs.writeFileSync(pot, Buffer.from(s.data, 'base64'));
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const mobilno = sirina < 500;
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  await b.izvedi(`dodajVZbirko(${D}, 'Težka', 'generator'); zacniIgro(${D}); true`);
  // Enojčki do koraka z izbrisom, nato »Naslednji korak« (pravi kliki) do tretje stopnje.
  await b.izvedi(`(() => { for (;;) { const k = nextStep(stanje.deska, ALL_TECHNIQUES); if (!k || k.eliminate.length) break;
    for (const [c, d] of k.assign) plosca.izvedi({ tip: 'vpis', celica: c, stevka: d }); } return true; })()`);
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.korak');
  await b.klikni('#korakBtn');
  await b.klikni('#korakBtn');
  const M = await b.izvedi(`(() => { const kontrast = ${KONTRAST};
    const k = pomoc.korak, cel = plosca.mreza.celice;
    const vz = [...document.querySelectorAll('#mreza .celica.k-vzorec')], iz = [...document.querySelectorAll('#mreza .celica.k-izbris')];
    const bg = el => getComputedStyle(el).backgroundColor;
    const kand = c => [...c.querySelectorAll('.kand')].filter(x => x.textContent.trim() && !x.classList.contains('k-izbris'));
    const prec = [...document.querySelectorAll('#mreza .celica.k-izbris .kand.k-izbris')];
    const sw = s => { const e = document.querySelector('#pomocVsebina .pomoc-legenda ' + s); return e && bg(e); };
    const kandV = vz.flatMap(kand), kandI = iz.flatMap(kand);
    return { tehnika: k.technique, stopnja: pomoc.stopnja,
      vzorec: [...new Set(vz.map(bg))], izbris: [...new Set(iz.map(bg))],
      kandVBarve: [...new Set(kandV.map(x => getComputedStyle(x).color))], kandIBarve: [...new Set(kandI.map(x => getComputedStyle(x).color))],
      kandV: kandV.length, kandI: kandI.length,
      precrtani: prec.map(x => [getComputedStyle(x).color, getComputedStyle(x).textDecorationLine, getComputedStyle(x).fontWeight]),
      swVzorec: sw('.sw-vzorec'), swIzbris: sw('.sw-izbris'),
      stevkaVzorca: (() => { for (const c of k.cells) { const m = stanje.kandidati[c]; for (let d = 1; d <= 9; d++) if (m & (1 << d)) return d; } return 0; })() }; })()`);
  preveri(`korak na tretji stopnji z izbrisom (${M.tehnika})`, M.stopnja === 3 && M.vzorec.length > 0 && M.izbris.length > 0, M);
  preveri('celice vzorca #EFD8A0', JSON.stringify(M.vzorec) === JSON.stringify([VZOREC]), M.vzorec);
  preveri('celice izbrisa #F0B4AA', JSON.stringify(M.izbris) === JSON.stringify([IZBRIS]), M.izbris);
  preveri('kandidati v obarvanih celicah --kand-ink',
    M.kandV > 0 && M.kandI > 0 && [...M.kandVBarve, ...M.kandIBarve].every(c => c === KAND_INK), [M.kandVBarve, M.kandIBarve]);
  preveri('prečrtan kandidat rdeč, krepek, prečrtan',
    M.precrtani.length > 0 && M.precrtani.every(([c, t, w]) => c === RDECA && t.includes('line-through') && +w >= 700), M.precrtani);
  preveri('vzorčka legende = celici', M.swVzorec === VZOREC && M.swIzbris === IZBRIS, [M.swVzorec, M.swIzbris]);
  const kv = kontrast(KAND_INK, VZOREC), ki = kontrast(KAND_INK, IZBRIS), kr = kontrast(RDECA, IZBRIS);
  preveri(`kontrasti kot v tabeli 2.1: kandidat ${kv.toFixed(2)} / ${ki.toFixed(2)}, prečrtan ${kr.toFixed(2)}`,
    blizu(kv, 5.43) && blizu(ki, 4.28) && blizu(kr, 3.34));
  preveri('brez vodoravnega preliva (korak)', !(await preliv(b)));
  await posnetekElementa(b, '#mrezaOkvir', path.join(mapa, `1-igra-korak-${sirina}.png`));

  // O4: poudarek števke vzorca - kvadrat poudarka ostane (kontrast podlag samo izpiše).
  await b.klikni(`#nizPoudari button:nth-child(${M.stevkaVzorca})`);
  const P = await b.izvedi(`(() => { const p = document.querySelector('#mreza .celica.k-vzorec .kand.poud');
    return p ? { kvadrat: getComputedStyle(p).backgroundColor, celica: getComputedStyle(p.closest('.celica')).backgroundColor } : null; })()`);
  preveri('O4: poudarjen kandidat v jantarni celici ima podlago poudarka', !!P && P.kvadrat !== P.celica && P.celica === VZOREC, P);
  if (P) console.log(`     poudarek ${P.kvadrat} ob celici ${P.celica}: kontrast podlag ${kontrast(P.kvadrat, P.celica).toFixed(2)} (načrt: 1,20)`);
  await b.posnetek(path.join(mapa, `1-igra-poudarek-${sirina}.png`), { vsaStran: false });

  // O3: čipa v besedilu Pomoči igre.
  await b.klikni('#navodilaBtn');
  await b.cakaj(`getComputedStyle(document.getElementById('navodilaDialog')).display !== 'none'`, 3000);
  const C = await b.izvedi(`(() => { const f = s => { const e = document.querySelector('#navodilaDialog ' + s); const g = getComputedStyle(e);
      return { podlaga: g.backgroundColor, barva: g.color, crta: g.textDecorationLine }; };
    const sh = s => { const e = document.querySelector('#navodilaDialog ' + s); return e && getComputedStyle(e).backgroundColor; };
    return { vz: f('.vzorec-vzorec'), iz: f('.vzorec-izbris'), shVz: sh('.shema-sw-vzorec'), shIz: sh('.shema-sw-izbris'),
      panel: (() => { const p = document.querySelector('#navodilaDialog .dialog-panel'); return p.scrollWidth > p.clientWidth; })() }; })()`);
  preveri('čip »jantarne«: podlaga celice, temna pisava', C.vz.podlaga === VZOREC && C.vz.barva === INK, C.vz);
  preveri('čip »rdeče prečrtani«: podlaga celice, rdeče prečrtano',
    C.iz.podlaga === IZBRIS && C.iz.barva === RDECA && C.iz.crta.includes('line-through'), C.iz);
  const kc = kontrast(INK, VZOREC);
  preveri(`kontrast čipa »jantarne« ${kc.toFixed(2)} (načrt 9,58)`, blizu(kc, 9.58));
  preveri('shema v Pomoči v istih barvah', C.shVz === VZOREC && C.shIz === IZBRIS, [C.shVz, C.shIz]);
  preveri('okno Pomoč brez vodoravnega preliva', !C.panel && !(await preliv(b)));
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi(`naloziDanosti(${D}, ''); true`);
  await b.klikni('#solveBtn');
  await b.cakaj('!!lastSolve', 20000);
  await b.klikni('#openStepsBtn');
  // Korak 11 je 1 · Izločitev izven bloka (načrt, razdelek 2).
  const li = '#steps > li:nth-child(11)';
  preveri('korak 11 je Pointing pair/triple', (await b.izvedi('lastSolve.log[10].technique')) === 'Pointing pair/triple');
  await b.klikni(`${li} .mini-toggle`);
  const MERI = `(koren) => { const kontrast = ${KONTRAST};
    const el = document.querySelector(koren), bg = e => getComputedStyle(e).backgroundColor, barva = e => getComputedStyle(e).color;
    const vz = [...el.querySelectorAll('.mcell.hl-source')], iz = [...el.querySelectorAll('.mcell.hl-elimonly')];
    const navadni = c => [...c.querySelectorAll('.mcand:not(.mcand-empty):not(.mcand-elim):not(.mcand-veriga)')];
    const obarvane = new Set([...vz, ...iz]);
    const drugi = [...el.querySelectorAll('.mcell')].filter(c => !obarvane.has(c)).flatMap(navadni);
    const elim = [...el.querySelectorAll('.mcand-elim')];
    return { vzorec: [...new Set(vz.map(bg))], izbris: [...new Set(iz.map(bg))],
      kandObarvane: [...new Set([...vz, ...iz].flatMap(navadni).map(barva))], nObarvane: [...vz, ...iz].flatMap(navadni).length,
      kandDrugi: [...new Set(drugi.map(barva))], nDrugi: drugi.length,
      elim: [...new Set(elim.map(e => barva(e) + ' ' + getComputedStyle(e).textDecorationLine))], nElim: elim.length }; }`;
  const pregled = (ime, m) => {
    preveri(`${ime}: celice vzorca #EFD8A0`, JSON.stringify(m.vzorec) === JSON.stringify([VZOREC]), m.vzorec);
    preveri(`${ime}: celice izbrisa #F0B4AA`, JSON.stringify(m.izbris) === JSON.stringify([IZBRIS]), m.izbris);
    preveri(`${ime}: kandidati v obarvanih celicah --kand-ink (O2)`, m.nObarvane > 0 && JSON.stringify(m.kandObarvane) === JSON.stringify([KAND_INK]), m.kandObarvane);
    preveri(`${ime}: drugi kandidati ostanejo --pencil`, m.nDrugi > 0 && JSON.stringify(m.kandDrugi) === JSON.stringify([PENCIL]), m.kandDrugi);
    preveri(`${ime}: prečrtani kandidati rdeči`, m.nElim > 0 && m.elim.every(e => e.startsWith(RDECA) && e.includes('line-through')), m.elim);
  };
  const m = await b.izvedi(`(${MERI})(${JSON.stringify(li + ' .mini-grid')})`);
  pregled('mala mreža', m);
  const L = await b.izvedi(`(() => { const s = x => { const e = document.querySelector(${JSON.stringify(li)} + ' .mini-legend ' + x); return e && getComputedStyle(e).backgroundColor; };
    return { vz: s('.sw-vzorec'), iz: s('.sw-izbris') }; })()`);
  preveri('vzorčka legende = celici', L.vz === VZOREC && L.iz === IZBRIS, L);
  preveri('brez vodoravnega preliva', !(await preliv(b)));
  await posnetekElementa(b, `${li} .mini-container`, path.join(mapa, `1-resevalec-mala-${sirina}.png`));

  await b.klikni(`${li} .mini-grid`);
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  pregled('povečava', await b.izvedi(`(${MERI})('#lightboxInner')`));
  await b.posnetek(path.join(mapa, `1-resevalec-povecava-${sirina}.png`), { vsaStran: false });
  await b.klikni('#lightboxClose');

  // Shema v Pomoči reševalca: iste podlagi (spremenljivki --shema-* iz palete).
  const S = await b.izvedi(`(() => { const s = x => { const e = document.querySelector('#pomocDialog ' + x); return e && getComputedStyle(e).backgroundColor; };
    return { vz: s('.shema-sw-vzorec'), iz: s('.shema-sw-izbris') }; })()`);
  preveri('shema v Pomoči reševalca v istih barvah', S.vz === VZOREC && S.iz === IZBRIS, S);
}

async function trening(b) {
  console.log('Trening');
  await b.odpri('trening/index.html', { sirina: 1280, visina: 900 });
  const T = await b.izvedi(`(() => { const g = getComputedStyle(document.documentElement);
    return [g.getPropertyValue('--k-vzorec-bg'), g.getPropertyValue('--k-izbris-bg'), g.getPropertyValue('--kand-ink')].map(v => v.trim().toUpperCase()); })()`);
  preveri('trening: spremenljivke nespremenjene (#EFD8A0, #F0B4AA, #4A5561)', JSON.stringify(T) === JSON.stringify(['#EFD8A0', '#F0B4AA', '#4A5561']), T);
}

// Pravi Enter kot s tipkovnice: keyDown z znakom \r - šele ta sproži gumb s fokusom (tipka('Enter')
// iz brskalnik.js pošlje rawKeyDown brez znaka, ki gumba ne sproži).
async function enter(b) {
  const o = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 };
  await b.cdp.poslji('Input.dispatchKeyEvent', { type: 'keyDown', text: '\r', ...o });
  await b.cdp.poslji('Input.dispatchKeyEvent', { type: 'keyUp', ...o });
}

// Korak 3 - Escape v reševalcu (O6 A, O7 A): pravi Escape (Input.dispatchKeyEvent) zapre povečavo
// rešitve in koraka (odprto s pravim dotikom / klikom), ob povečavi in oknu pod njo (zbirka, Pomoč -
// odprta s tipkovnico: fokus na gumb in Enter) prvi Escape povečavo, drugi okno; ob fokusu v polju Niz
// povečavo zapre in polje pusti; brez povečave okni kot prej; ✕ in dotik povečavo še zapreta.
async function escape(b, sirina) {
  console.log(`Reševalec - Escape, ${sirina} px`);
  const mobilno = sirina < 500;
  const pritisni = izb => (mobilno ? b.tapni(izb) : b.klikni(izb));
  await b.odpri('app/index.html', { sirina, visina: 1000, mobilno });
  await b.izvedi('localStorage.clear(); true');
  await b.odpri('app/index.html', { sirina, visina: 1000, mobilno });
  await b.izvedi(`naloziDanosti(${D}, ''); true`);
  await pritisni('#solveBtn');
  await b.cakaj('!!lastSolve', 20000);

  const stanje = () => b.izvedi(`(() => ({ povecava: getComputedStyle(document.getElementById('lightbox')).display === 'block',
    zbirka: document.getElementById('library').classList.contains('odprt'),
    pomoc: document.getElementById('pomocDialog').classList.contains('odprt'),
    vrh: (() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return e && e.closest('#lightbox') ? 'povečava' : e && e.closest('.dialog') ? 'okno' : 'stran'; })() }))()`);
  const je = (s, povecava, zbirka, pomoc) => s.povecava === povecava && s.zbirka === zbirka && s.pomoc === pomoc;

  // Povečava rešitve.
  await pritisni('#solvedGrid');
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  await enter(b);
  preveri('povečava rešitve: Enter je ne zapre', je(await stanje(), true, false, false), await stanje());
  await b.tipka('Escape');
  preveri('povečava rešitve: Escape jo zapre', je(await stanje(), false, false, false), await stanje());
  await b.tipka('Escape');
  preveri('Escape brez povečave in oken ne odpre ničesar', je(await stanje(), false, false, false), await stanje());

  // Povečava koraka (korak 11, mala mreža s pravim dotikom / klikom).
  await pritisni('#openStepsBtn');
  const li = '#steps > li:nth-child(11)';
  await pritisni(`${li} .mini-toggle`);
  await pritisni(`${li} .mini-grid`);
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  preveri('povečava koraka je odprta', je(await stanje(), true, false, false), await stanje());
  await b.tipka('Escape');
  preveri('povečava koraka: Escape jo zapre', je(await stanje(), false, false, false), await stanje());

  // Povečava in okno pod njo, odprto s tipkovnico (fokus na gumb v glavi, Enter).
  for (const [gumb, ime] of [['#libraryBtn', 'zbirka'], ['#pomocBtn', 'Pomoč']]) {
    await pritisni('#solvedGrid');
    await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
    await b.izvedi(`document.querySelector(${JSON.stringify(gumb)}).focus(); true`);
    await enter(b);
    const s0 = await stanje();
    preveri(`povečava in ${ime}: obe odprti, povečava zgoraj`,
      je(s0, true, ime === 'zbirka', ime === 'Pomoč') && s0.vrh === 'povečava', s0);
    await b.tipka('Escape');
    const s1 = await stanje();
    preveri(`povečava in ${ime}: prvi Escape zapre povečavo, okno ostane`,
      je(s1, false, ime === 'zbirka', ime === 'Pomoč') && s1.vrh === 'okno', s1);
    await b.tipka('Escape');
    preveri(`povečava in ${ime}: drugi Escape zapre okno`, je(await stanje(), false, false, false), await stanje());
  }

  // Fokus v polju Niz (za povečavo - s tipkovnico ali skripto).
  await pritisni('#solvedGrid');
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  await b.izvedi(`(() => { const n = document.getElementById('nizDanosti'); n.value = '12'; n.focus(); return true; })()`);
  await b.tipka('Escape');
  const N = await b.izvedi(`({ fokus: document.activeElement && document.activeElement.id, vrednost: document.getElementById('nizDanosti').value })`);
  preveri('fokus v polju Niz: Escape zapre povečavo, polje ostane', je(await stanje(), false, false, false) && N.fokus === 'nizDanosti' && N.vrednost === '12', [await stanje(), N]);
  await b.izvedi(`document.getElementById('nizDanosti').value = ''; document.activeElement.blur(); true`);

  // Brez povečave: okni kot prej (pravi dotik / klik gumba, Escape).
  for (const [gumb, ime] of [['#libraryBtn', 'zbirka'], ['#pomocBtn', 'Pomoč']]) {
    await pritisni(gumb);
    preveri(`${ime} brez povečave je odprta`, je(await stanje(), false, ime === 'zbirka', ime === 'Pomoč'), await stanje());
    await b.tipka('Escape');
    preveri(`${ime} brez povečave: Escape jo zapre`, je(await stanje(), false, false, false), await stanje());
  }

  // Dotik / klik in ✕ povečavo še zapreta.
  await pritisni('#solvedGrid');
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  await pritisni('#lightboxClose');
  preveri('✕ zapre povečavo', je(await stanje(), false, false, false), await stanje());
  await pritisni('#solvedGrid');
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  await pritisni('#lightboxInner');
  preveri(`${mobilno ? 'dotik' : 'klik'} mreže zapre povečavo`, je(await stanje(), false, false, false), await stanje());

  // O7: poved v Pomoči reševalca.
  const P = await b.izvedi(`[...document.querySelectorAll('#pomocDialog p')].map(p => p.textContent).find(t => t.includes('Povečano mrežo')) || ''`);
  preveri('Pomoč: »Povečano mrežo zapreš z dotikom, z ✕ ali s tipko Esc.«', P === 'Povečano mrežo zapreš z dotikom, z ✕ ali s tipko Esc.', P);
  preveri('brez vodoravnega preliva', !(await preliv(b)));
}

async function main() {
  const b = await zazeni();
  try {
    if (KORAK >= 1) {
      console.log('— Korak 1: podlagi (O1-O4)');
      for (const sirina of [375, 1280]) { await igra(b, sirina); await resevalec(b, sirina); }
      await trening(b);
    }
    // Korak 2 (legenda »tvoje oznake«, O5) ni narejen - odločitev 2026-10-11, docs/naloga6-nacrt.md.
    if (KORAK >= 3) {
      console.log('— Korak 3: Escape (O6, O7)');
      for (const sirina of [375, 1280]) await escape(b, sirina);
    }
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(`\nPosnetki: ${mapa}`);
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
