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
// Od popravka po ročnem pregledu (korak 5) je prečrtan kandidat za izbris temen (--ink), krepak, z
// rdečo črto 2 px - pričakovanja koraka 1 so temu prilagojena.
//
// Korak 3 - Escape v reševalcu (O6, O7) pri 375 px (pravi dotik) in 1280 px (miška), pravi Escape:
// zapre povečavo rešitve in koraka; ob povečavi in oknu pod njo (zbirka, Pomoč - odprta s
// tipkovnico) prvi Escape povečavo, drugi okno; ob fokusu v polju Niz zapre povečavo in polje
// pusti; brez povečave okni kot prej; ✕ in dotik povečavo še zapreta; poved v Pomoči.
//
// Korak 5 - popravek po ročnem pregledu: kandidat za izbris pri prikazanem koraku ima temno krepko
// števko (--ink) in rdečo črto 2 px (izračunan slog) povsod - mreža igre (rožnata celica in rumen
// poudarek), čip v Pomoči igre, mala mreža, povečava in legenda reševalca, »Spoznaj« 3 · Očitni par
// (.cd, legenda), 7 · X-krilo (.xw-cell), 9 · Veriga ene števke (.cd.hl-plum, če je), 1 · Izločitev
// izven bloka (poudarjena števka na delni mreži), »Vadi v uganki« 4 (»Rešitev«); siva prečrtana
// števka »Vadi v uganki« ostane. Črta je narisana in vidna: posnetek z njo in brez nje (prozorna
// barva črte), štetje spremenjenih pikslov in kontrast najbolj spremenjenega piksla proti podlagi pod
// njim - vsaj 3 (rumen poudarek 3,53, rožnata 3,34); pri drugih treh barvah poudarka samo izpis.
//
//   node tools/preveri-naloga6-brskalnik.js [--korak N | --samo N] [--mapa <mapa>]
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
const KORAK = Number(arg('--korak', 5));
const SAMO = args.includes('--samo') ? Number(arg('--samo')) : null;
const korak = n => (SAMO ? SAMO === n : KORAK >= n);
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
  preveri('prečrtan kandidat temen, krepek, prečrtan (od koraka 5 - črta rdeča)',
    M.precrtani.length > 0 && M.precrtani.every(([c, t, w]) => c === INK && t.includes('line-through') && +w >= 700), M.precrtani);
  preveri('vzorčka legende = celici', M.swVzorec === VZOREC && M.swIzbris === IZBRIS, [M.swVzorec, M.swIzbris]);
  const kv = kontrast(KAND_INK, VZOREC), ki = kontrast(KAND_INK, IZBRIS), kr = kontrast(INK, IZBRIS);
  preveri(`kontrasti kot v tabeli 2.1: kandidat ${kv.toFixed(2)} / ${ki.toFixed(2)}, prečrtan ${kr.toFixed(2)}`,
    blizu(kv, 5.43) && blizu(ki, 4.28) && blizu(kr, 7.55));
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
  preveri('čip »rdeče prečrtani«: podlaga celice, prečrtano (od koraka 5 temna pisava, rdeča črta)',
    C.iz.podlaga === IZBRIS && C.iz.barva === INK && C.iz.crta.includes('line-through'), C.iz);
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
    preveri(`${ime}: prečrtani kandidati temni, prečrtani (od koraka 5)`, m.nElim > 0 && m.elim.every(e => e.startsWith(INK) && e.includes('line-through')), m.elim);
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

// Korak 5: prečrtan kandidat za izbris. Element meritve ima data-meri (nastavi ga oznaci()).
const OZNACI = izbirnik => `(() => { document.querySelectorAll('[data-meri]').forEach(e => e.removeAttribute('data-meri'));
  const el = document.querySelector(${JSON.stringify(izbirnik)}); if (!el) return false; el.dataset.meri = '1'; return true; })()`;
const SLOG = `(() => { const g = getComputedStyle(document.querySelector('[data-meri]'));
  return { barva: g.color, debelina: g.fontWeight, crta: g.textDecorationLine, crtaBarva: g.textDecorationColor, crtaDebelina: g.textDecorationThickness }; })()`;
const precrtanSlog = s => s.barva === INK && +s.debelina >= 700 && s.crta.includes('line-through') && s.crtaBarva === RDECA && s.crtaDebelina === '2px';

// Posnetek elementa [data-meri] z dodanim slogom (dvojna ločljivost).
async function posnetekMeri(b, slog) {
  await b.izvedi(`(() => { let s = document.getElementById('meritev'); if (!s) { s = document.createElement('style'); s.id = 'meritev'; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(slog)}; return true; })()`);
  await b.izvedi('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
  const r = await b.izvedi(`(() => { const q = document.querySelector('[data-meri]').getBoundingClientRect();
    return { x: Math.floor(q.left + scrollX) - 1, y: Math.floor(q.top + scrollY) - 1, width: Math.ceil(q.width) + 2, height: Math.ceil(q.height) + 2 }; })()`);
  return (await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...r, scale: 2 } })).data;
}
// Črta je narisana: piksli, ki jih spremeni prozorna barva črte (n), in piksel črte z največjim kontrastom
// proti istemu pikslu brez črte - črta ob števki na podlagi celice (kjer črta prečka temno števko, je kontrast
// rdeče proti --ink 2,26 in se ne šteje).
async function crta(b) {
  await b.izvedi(`document.querySelector('[data-meri]').scrollIntoView({ block: 'center' }); true`);
  const A = await posnetekMeri(b, '');
  const B = await posnetekMeri(b, '[data-meri]{ text-decoration-color: transparent !important; }');
  await posnetekMeri(b, '');
  const r = await b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [a, bb] = await Promise.all([${JSON.stringify(A)}, ${JSON.stringify(B)}].map(slika));
    const kontrast = ${KONTRAST};
    const rgbk = (p, k) => 'rgb(' + p.data[k] + ', ' + p.data[k + 1] + ', ' + p.data[k + 2] + ')';
    let n = 0, naj = -1, k0 = 0;
    for (let k = 0; k < a.data.length; k += 4) {
      const d = Math.max(Math.abs(a.data[k] - bb.data[k]), Math.abs(a.data[k + 1] - bb.data[k + 1]), Math.abs(a.data[k + 2] - bb.data[k + 2]));
      if (d <= 8) continue;
      n++;
      const c = kontrast(rgbk(a, k), rgbk(bb, k));
      if (c > naj) { naj = c; k0 = k; }
    }
    const rgb = (p, k) => 'rgb(' + p.data[k] + ', ' + p.data[k + 1] + ', ' + p.data[k + 2] + ')';
    return { n, crta: rgb(a, k0), podlaga: rgb(bb, k0) }; })()`);
  r.kontrast = +kontrast(r.crta, r.podlaga).toFixed(2);
  return r;
}
// Slog in črta elementa; vrne meritev črte.
async function preveriPrecrtano(b, ime, izbirnik, { vidna = true } = {}) {
  if (!(await b.izvedi(OZNACI(izbirnik)))) { preveri(`${ime}: element ${izbirnik} obstaja`, false); return null; }
  const s = await b.izvedi(SLOG);
  preveri(`${ime}: števka temna, krepka, črta rdeča 2 px`, precrtanSlog(s), s);
  if (!vidna) return null;
  const c = await crta(b);
  preveri(`${ime}: črta narisana (${c.n} pikslov), kontrast proti podlagi ${c.kontrast} ≥ 3`, c.n >= 8 && c.kontrast >= 3, c);
  return c;
}

async function precrtanoIgra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const mobilno = sirina < 500;
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  await b.izvedi(`dodajVZbirko(${D}, 'Težka', 'generator'); zacniIgro(${D}); true`);
  await b.izvedi(`(() => { for (;;) { const k = nextStep(stanje.deska, ALL_TECHNIQUES); if (!k || k.eliminate.length) break;
    for (const [c, d] of k.assign) plosca.izvedi({ tip: 'vpis', celica: c, stevka: d }); } return true; })()`);
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.korak');
  await b.klikni('#korakBtn');
  await b.klikni('#korakBtn');
  await b.cakaj('pomoc && pomoc.stopnja === 3', 3000);
  await preveriPrecrtano(b, 'mreža igre, rožnata celica', '#mreza .celica.k-izbris .kand.k-izbris');
  await b.posnetek(path.join(mapa, `5-igra-korak-${sirina}.png`), { vsaStran: false });
  // Poudarek števke izbrisa: rumen kvadrat pod prečrtano števko.
  const d = await b.izvedi('pomoc.korak.eliminate[0][1]');
  await b.klikni(`#nizPoudari button:nth-child(${d})`);
  const izb = '#mreza .celica.k-izbris .kand.k-izbris.poud';
  const c = await preveriPrecrtano(b, 'mreža igre, rumen poudarek', izb);
  if (c) preveri(`rumen poudarek: podlaga pod črto je poudarek (${c.podlaga})`, c.podlaga.match(/\d+/g).every((v, i) => Math.abs(v - [246, 192, 38][i]) <= 10), c.podlaga); // glajenje ob robu števke
  await posnetekElementa(b, '#mrezaOkvir', path.join(mapa, `5-igra-poudarek-${sirina}.png`));
  // Druge tri barve poudarka (igralec jih izbere sam) - samo izpis.
  for (const v of ['--poud2', '--poud3', '--poud4']) {
    await b.izvedi(`document.documentElement.style.setProperty('--poud', getComputedStyle(document.documentElement).getPropertyValue('${v}').trim()); true`);
    await b.izvedi(OZNACI(izb));
    const m = await crta(b);
    console.log(`     poudarek ${v} (${m.podlaga}): črta ${m.n} pikslov, kontrast ${m.kontrast}`);
  }
  await b.izvedi(`document.documentElement.style.removeProperty('--poud'); true`);
  // Čip v Pomoči igre.
  await b.klikni('#navodilaBtn');
  await b.cakaj(`getComputedStyle(document.getElementById('navodilaDialog')).display !== 'none'`, 3000);
  await preveriPrecrtano(b, 'čip »rdeče prečrtani« v Pomoči igre', '#navodilaDialog .vzorec-izbris');
  preveri('igra: brez vodoravnega preliva', !(await preliv(b)));
}

async function precrtanoResevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi(`naloziDanosti(${D}, ''); true`);
  await b.klikni('#solveBtn');
  await b.cakaj('!!lastSolve', 20000);
  await b.klikni('#openStepsBtn');
  const li = '#steps > li:nth-child(11)';
  await b.klikni(`${li} .mini-toggle`);
  await preveriPrecrtano(b, 'mala mreža', `${li} .mini-grid .mcand-elim`);
  await preveriPrecrtano(b, 'legenda male mreže', `${li} .mini-legend .sw-izbris`);
  await posnetekElementa(b, `${li} .mini-container`, path.join(mapa, `5-resevalec-mala-${sirina}.png`));
  await b.klikni(`${li} .mini-grid`);
  await b.cakaj(`getComputedStyle(document.getElementById('lightbox')).display === 'block'`, 3000);
  await preveriPrecrtano(b, 'povečava', '#lightboxInner .mcand-elim');
  await b.klikni('#lightboxClose');
  preveri('reševalec: brez vodoravnega preliva', !(await preliv(b)));
}

// »Spoznaj« vaja 1 tehnike s pravim klikom na kartico, nato »Rešitev«.
async function spoznajResitev(b, sirina, mode) {
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi('localStorage.clear(); true');
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await b.izvedi(`[...document.querySelectorAll('.peek-btn')].find(x => x.textContent === 'Rešitev').dataset.klik = '1'; true`);
  await b.klikni('.peek-btn[data-klik="1"]');
  await b.izvedi('new Promise(r => setTimeout(() => r(true), 300))'); // prehod podlage celic
  await b.izvedi('document.activeElement && document.activeElement.blur(); true');
}

async function precrtanoTrening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  await spoznajResitev(b, sirina, 'naked-pair');
  await preveriPrecrtano(b, 'Spoznaj 3 · Očitni par, »Rešitev«', '#exerciseArea .cd.peek-izbris');
  await preveriPrecrtano(b, 'Spoznaj 3, legenda', '#exerciseArea .legenda-vaje .izbris-vzorec');
  await b.posnetek(path.join(mapa, `5-spoznaj-3-${sirina}.png`), { vsaStran: false });
  await spoznajResitev(b, sirina, 'x-wing');
  await preveriPrecrtano(b, 'Spoznaj 7 · X-krilo, »Rešitev«', '#exerciseArea .xw-cell.peek-elim');
  await spoznajResitev(b, sirina, 'turbot-fish');
  if (await b.izvedi(`!!document.querySelector('#exerciseArea .cd.hl-plum.peek-izbris')`)) {
    await preveriPrecrtano(b, 'Spoznaj 9 · Veriga ene števke (označena števka), »Rešitev«', '#exerciseArea .cd.hl-plum.peek-izbris');
  } else {
    await preveriPrecrtano(b, 'Spoznaj 9 · Veriga ene števke, »Rešitev«', '#exerciseArea .cd.peek-izbris');
  }
  await spoznajResitev(b, sirina, 'pointing');
  const c = await preveriPrecrtano(b, 'Spoznaj 1 · Izločitev izven bloka, poudarjena števka, »Rešitev«', '#exerciseArea .vaja-presek .kand.poud.k-izbris');
  if (c) console.log(`     podlaga pod črto ${c.podlaga}`);
  await posnetekElementa(b, '#exerciseArea .vaja-presek', path.join(mapa, `5-spoznaj-1-${sirina}.png`));

  // »Vadi v uganki« 4 · Skriti par: »Rešitev« (izbris prečrtan) in siva prečrtana števka (ostane).
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })(); true');
  await b.klikni('.menu-card[data-mode="hidden-pair"] .nacin-btn.vadi');
  await b.cakaj('vadi !== null', 15000);
  const pk = await b.izvedi(`(() => { const l = [...document.querySelectorAll('label')].find(x => x.textContent.includes('pokaži jih prečrtane'));
    if (!l) return false; l.querySelector('input').dataset.klik = 'pk'; return true; })()`);
  if (pk) {
    await b.klikni('input[data-klik="pk"]');
    const g = await b.izvedi(`(() => { const e = document.querySelector('.vaja-uganka .kand.precrtan:not(.k-izbris)'); if (!e) return null; const s = getComputedStyle(e);
      return { barva: s.color, crta: s.textDecorationLine, crtaBarva: s.textDecorationColor, debelina: s.textDecorationThickness }; })()`);
    preveri('Vadi v uganki: siva prečrtana števka ostane (#A9B2BC, 1 px)',
      !!g && g.barva === 'rgb(169, 178, 188)' && g.crta.includes('line-through') && g.crtaBarva === g.barva && g.debelina === '1px', g);
  } else preveri('Vadi v uganki: vaja ima prej izbrisane kandidate', false);
  await b.izvedi(`[...document.querySelectorAll('.sm-btn')].find(x => x.textContent === 'Rešitev').dataset.klik = 'res'; true`);
  await b.klikni('.sm-btn[data-klik="res"]');
  await preveriPrecrtano(b, 'Vadi v uganki 4, »Rešitev«', '.vaja-uganka .kand.k-izbris');
  await b.posnetek(path.join(mapa, `5-vadi-4-${sirina}.png`), { vsaStran: false });
  preveri('trening: brez vodoravnega preliva', !(await preliv(b)));
}

async function main() {
  const b = await zazeni();
  try {
    if (korak(1)) {
      console.log('— Korak 1: podlagi (O1-O4)');
      for (const sirina of [375, 1280]) { await igra(b, sirina); await resevalec(b, sirina); }
      await trening(b);
    }
    // Korak 2 (legenda »tvoje oznake«, O5) ni narejen - odločitev 2026-10-11, docs/naloga6-nacrt.md.
    if (korak(3)) {
      console.log('— Korak 3: Escape (O6, O7)');
      for (const sirina of [375, 1280]) await escape(b, sirina);
    }
    // Korak 4 je zaključek (brez scenarija).
    if (korak(5)) {
      console.log('— Korak 5: prečrtan kandidat za izbris (popravek po ročnem pregledu)');
      for (const sirina of [375, 1280]) {
        await precrtanoIgra(b, sirina);
        await precrtanoResevalec(b, sirina);
        await precrtanoTrening(b, sirina);
      }
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
