'use strict';
// Scenarij naloge »enotna izbira v Spoznaj 3-12« (docs/izbira-spoznaj-nacrt.md) v brskalniku brez
// glave - vaje 3-12 pri 375 in 1280 px, pravi kliki na celice in pravi pritisk miške na
// »Rešitev (drži)«:
//   - pred »Preveri« je izbira modra (--izbira-bg, obroba --izbira 2,5 px, pri X-krilu in
//     mečarici 2 px);
//   - med »Rešitvijo« okvir pove, ali je izbira pravilna: pravilno izbrana celica vzorca jantarna
//     z zelenim okvirjem, napačno izbrana bela s temno rdečim, napačno izbrana celica izbrisa
//     rožnata s temno rdečim, spregledana jantarna z zlatim, izbris rožnat brez okvirja; kontrast
//     rdeče na beli in rožnati vsaj 3; po spustu spet modra;
//   - pri 375 px se okvir z malimi števkami ne prekriva bolj kot v izhodišču (meritev na
//     posnetkih po vzoru docs/oznake-nacrt.md: piksli, ki jih spremenita okvir in števka, in
//     piksli števke, ki se na okvirju ne vidijo; prečrtane števke so med meritvijo navadne -
//     krepkejša števka bi štela kot več prekrivanja, čeprav je okvir enak); izbira je v obeh
//     brskalnikih ista (izbere jo nova koda);
//   - prečrtanje števke izbrisa (docs/precrtanje-resitev-nacrt.md): ob »Rešitvi« brez izbire so
//     rdeče prečrtane natanko števke, ki so prečrtane po pravilnem odgovoru (celice vzorca s
//     pravimi kliki, pri 4 in 6 še 2. faza s števkami iz besedila »Rešitve«) - neodvisno merilo;
//     slog (barva, debelina pisave, črta) je enak kot pri 2 (.kand.k-izbris); po spustu ni
//     prečrtane števke, po pravilnem odgovoru ostanejo (tudi ob »Rešitvi« po njem in spustu); pri
//     7 in 8 je števka izbrisa prečrtana tudi po pravilnem odgovoru;
//   - izris brez izbire, »Rešitev« brez izbire, pravilen odgovor in »Rešitev« po njem so enaki
//     izhodišču (zadnji commit pred nalogo prečrtanja) - razlike so dovoljene samo pri prečrtanih
//     števkah (barva, črta) in pri 3, 5 v celicah izbrisa (rožnata podlaga, temnejše male števke);
//     pri 8 · Mečarica so celice po pravilnem odgovoru zelene kot pri X-krilu;
//   - pri 8 · Mečarica (»Rešitev« pokaže veljaven vzorec, ki se ujema z izbiro): drug veljaven
//     vzorec, izbran s pravimi kliki, je ob »Rešitvi« ves zelen, »Preveri« ga sprejme;
//   - brez vodoravnega drsnika in brez napak JS.
// Zagon iz korena projekta (pribl. 3 min):
//   node tools/preveri-izbira-brskalnik.js [--mapa <mapa za posnetke>] [--izhodisce <commit>]
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { razlikeIzrisa, odmakniMisko } = require('./primerjava-slogov.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-izbira'));
// zadnji commit pred nalogo prečrtanja (docs/precrtanje-resitev-nacrt.md; pred nalogo izbire 85adb6b)
const izhodisce = arg('--izhodisce', '4c47cc0');
const KOREN = path.join(__dirname, '..');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

const SEME = s => `(() => { let seme = ${s}; Math.random = () => {
  seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; return true; })()`;

const TEHNIKE = ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish', 'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle'];
const SIRINE = [375, 1280];
const CELICE = '#exerciseArea .gc.selectable, #exerciseArea .xw-cell.has-digit';
const IZBIRA_BG = 'rgb(221, 231, 243)', VZOREC_BG = 'rgb(239, 216, 160)', IZBRIS_BG = 'rgb(240, 180, 170)', BELA = 'rgb(255, 255, 255)';
const okvir = (barva, px) => `${barva} 0px 0px 0px ${px}px inset`;
const MODRA = 'rgb(74, 134, 216)', ZLATA = 'rgb(200, 160, 32)', ZELENA = 'rgb(46, 125, 92)', RDECA = 'rgb(142, 27, 27)';

// Kontrast (WCAG) dveh barv rgb(...).
function kontrast(p, q) {
  const L = s => { const [r, g, b] = s.match(/\d+/g).slice(0, 3).map(v => +v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [x, y] = [L(p), L(q)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);

async function odpri(b, mode, sirina) {
  await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi(SEME(4242));
  await b.klikni(`.menu-card[data-mode="${mode}"]`);
  await odmakniMisko(b);
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  // Stran ne sme biti pomaknjena do konca, sicer okvir z rešitvijo gumb ob pritisku odmakne
  // izpod miške (docs/uskladitev.md, »Kasneje«) - prostor pod vsebino tega ne dopusti.
  await b.izvedi("document.body.style.paddingBottom = '800px'; true");
}
// Pravi pritisk miške na »Rešitev (drži)«; fn se izvede med držanjem.
async function drziResitev(b, fn) {
  const t = await b.izvedi(`(() => { const g = [...document.querySelectorAll('.peek-btn')].find(x => x.textContent === 'Rešitev (drži)');
    g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x, y: t.y });
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', clickCount: 1 });
  try { await pocakaj(b); return await fn(); } finally {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', clickCount: 1 });
    await odmakniMisko(b);
  }
}
// »Rešitev« z dogodkom v strani (brez miške) - za posnetke s captureBeyondViewport, ki med pravim
// pritiskom za trenutek spremenijo okno: gumb dobi mouseleave in »Rešitev« se skrije.
async function resitevBrezMiske(b, fn) {
  const sprozi = tip => b.izvedi(`[...document.querySelectorAll('.peek-btn')].find(x => x.textContent === 'Rešitev (drži)')
    .dispatchEvent(new MouseEvent('${tip}', { bubbles: true, cancelable: true })); true`);
  await sprozi('mousedown');
  try { await pocakaj(b); return await fn(); } finally { await sprozi('mouseup'); await pocakaj(b); }
}
async function klikniGumb(b, napis) {
  await b.izvedi(`[...document.querySelectorAll('#exerciseArea button')].find(g => g.textContent === ${JSON.stringify(napis)}).setAttribute('data-klik', '1'); true`);
  await b.klikni('#exerciseArea button[data-klik="1"]');
  await b.izvedi(`document.querySelectorAll('[data-klik]').forEach(e => e.removeAttribute('data-klik')); true`);
}
// Prečrtane števke v mreži vaje (izračunan slog: text-decoration-line vsebuje line-through):
// male števke .cd in pri X-krilu in mečarici celica sama (števka je njeno besedilo). Ključ je
// "indeks celice:števka" (indeks med vsemi .gc in .xw-cell - ti se ne dodajajo in ne odstranjujejo).
const precrtane = b => b.izvedi(`(() => { const out = [];
  [...document.querySelectorAll('#exerciseArea .gc, #exerciseArea .xw-cell')].forEach((cel, i) => {
    for (const e of cel.classList.contains('xw-cell') ? [cel] : cel.querySelectorAll('.cd:not(.hide)')) {
      const s = getComputedStyle(e); if (!s.textDecorationLine.includes('line-through')) continue;
      out.push({ k: i + ':' + e.textContent.trim(), barva: s.color, debelina: s.fontWeight, crta: s.textDecorationLine }); } });
  return out.sort((a, b) => (a.k < b.k ? -1 : 1)); })()`);
const kljuci = p => p.map(x => x.k).join(' ');
// Slog prečrtane števke pri 2 · Izločitev v bloku ob »Rešitvi« (.kand.k-izbris v shared/mreza.css).
async function slogIzbrisa2(b, sirina) {
  await odpri(b, 'box-line', sirina);
  return drziResitev(b, () => b.izvedi(`(() => { const e = document.querySelector('#exerciseArea .kand.k-izbris'); if (!e) return null;
    const s = getComputedStyle(e); return { barva: s.color, debelina: s.fontWeight, crta: s.textDecorationLine }; })()`));
}
// Celice vzorca in izbrisa, ki jih pokaže »Rešitev« brez izbire: data-vz / data-iz; še prečrtane
// števke in besedilo »Rešitve« (pri skritih števke vzorca za 2. fazo).
async function oznaciVzorec(b) {
  return drziResitev(b, async () => {
    const r = await b.izvedi(`(() => { const c = [...document.querySelectorAll(${JSON.stringify(CELICE)})];
      c.forEach((e, i) => { e.dataset.i = i; if (e.classList.contains('peek-hl')) e.dataset.vz = 1; if (e.classList.contains('peek-elim')) e.dataset.iz = 1; });
      return { vzorec: c.filter(e => e.dataset.vz).length, izbris: c.filter(e => e.dataset.iz && !e.dataset.vz).length, vseh: c.length,
        besedilo: [...document.querySelectorAll('#exerciseArea .peek-overlay.visible')].map(e => e.innerHTML).join('') }; })()`);
    r.precrtane = await precrtane(b);
    return r;
  });
}
// Izbira s pravimi kliki: pravilna celica vzorca (pri 12 vogal z izbrisom), napačna celica zunaj
// vzorca in izbrisa ter - kjer je prostor (pickN) - napačno izbrana celica izbrisa. Z dani
// (indeksi data-i) izbere te celice - izhodišče dobi isto izbiro kot nova koda.
async function izberi(b, mode, dani) {
  const izb = await b.izvedi(`(() => { const c = [...document.querySelectorAll(${JSON.stringify(CELICE)})];
    const vz = c.filter(e => e.dataset.vz), iz = c.filter(e => e.dataset.iz && !e.dataset.vz), pr = c.filter(e => !e.dataset.vz && !e.dataset.iz);
    const n = MODES[${JSON.stringify(mode)}].pickN, dani = ${JSON.stringify(dani || null)};
    const izbrane = dani ? c.filter(e => dani.includes(e.dataset.i)) : [vz.find(e => e.dataset.iz) || vz[0], pr[0], iz[0]].filter(Boolean).slice(0, n);
    izbrane.forEach(e => e.dataset.izb = 1); return izbrane.map(e => e.dataset.i); })()`);
  for (const i of izb) await b.klikni(`#exerciseArea [data-i="${i}"]`);
  await odmakniMisko(b);
  return izb;
}
// Legenda oznak (faza 6, korak b) v elementu kje (okvir »Rešitve« ali sporočilo): za vsako
// postavko besedilo in izračunani slog vzorčka; vznotraj = legenda ne sega čez kartico vaje.
const legendaSlogi = (b, kje) => b.izvedi(`(() => { const l = document.querySelector('#exerciseArea ' + ${JSON.stringify(kje)} + ' .legenda-vaje');
  if (!l) return null; const ex = document.querySelector('#exerciseArea .exercise').getBoundingClientRect(), r = l.getBoundingClientRect();
  return { vznotraj: r.left >= ex.left - 0.5 && r.right <= ex.right + 0.5, postavke: [...l.children].map(p => { const sw = p.children[0], st = getComputedStyle(sw);
    return { besedilo: p.textContent.slice(sw.textContent.length), bg: st.backgroundColor, obroba: st.borderTopColor, barva: st.color, crta: st.textDecorationLine }; }) }; })()`);
// Barva okvirja celice iz box-shadow (»rgb(…) 0px 0px 0px 2.5px inset«) ali null.
const barvaOkvirja = bs => (bs.match(/^rgba?\([^)]*\)/) || [null])[0];
// Slogi celic: izbrana (data-izb), med »Rešitvijo« tudi razreda peek-hl / peek-elim.
const slogiCelic = b => b.izvedi(`[...document.querySelectorAll(${JSON.stringify(CELICE)})].map(e => { const s = getComputedStyle(e);
  return { i: e.dataset.i, izb: !!e.dataset.izb, vz: e.classList.contains('peek-hl'), iz: e.classList.contains('peek-elim'), xw: e.classList.contains('xw-cell'), bg: s.backgroundColor, bs: s.boxShadow }; })`);

// Meritev prekrivanja okvirja z malimi števkami (pikslov, ki ju spremenita oba; pikslov števke,
// ki se na okvirju ne vidijo) na mreži vaje - štirje posnetki: končni, brez okvirjev, brez
// obojega, brez števk.
const OKVIR_SKRIT = '#exerciseArea .gc, #exerciseArea .xw-cell { box-shadow: none !important; }';
const STEVKE_SKRITE = '#exerciseArea .cd, #exerciseArea .xw-cell { color: transparent !important; }';
// Prečrtana števka med meritvijo kot navadna (docs/precrtanje-resitev-nacrt.md, razdelek 4): male
// števke izgubijo peek-izbris (prejšnji slog, tudi .hl pri 9), celica X-krila in mečarice brez
// rdeče črte - brez !important, da STEVKE_SKRITE še velja; v izhodišču brez učinka.
const PRECRTANE_NAVADNE = '#exerciseArea .xw-cell.peek-elim { color: var(--ink); text-decoration: none; }';
// Med meritvijo sta glava strani in besedilo nad mrežo (naslov, opis, razdelek »Razlaga«) skrita v obeh brskalnikih: mreža
// je tako na istem mestu, sicer drugačna višina besedila (faza 6) premakne mrežo za del piksla in
// spremeni glajenje robov na posnetku - meritev naj meri okvir in števke, ne besedila.
const BESEDILO_SKRITO = 'header.top, #exerciseArea .exercise > h3, #exerciseArea .exercise > .desc, #exerciseArea .razlaga-tehnike { display: none !important; }';
async function prekrivanje(b) {
  await b.izvedi(`document.querySelectorAll('#exerciseArea .peek-izbris').forEach(e => { e.classList.remove('peek-izbris'); e.dataset.pi = 1; }); true`);
  try { return await prekrivanjeMeritev(b); } finally {
    await b.izvedi(`document.querySelectorAll('#exerciseArea [data-pi]').forEach(e => { e.classList.add('peek-izbris'); delete e.dataset.pi; }); true`);
  }
}
async function prekrivanjeMeritev(b) {
  const pos = async slog => {
    await b.izvedi(`(() => { let s = document.getElementById('meritev'); if (!s) { s = document.createElement('style'); s.id = 'meritev'; document.head.appendChild(s); }
      s.textContent = ${JSON.stringify(PRECRTANE_NAVADNE + BESEDILO_SKRITO)} + ${JSON.stringify(slog)}; return new Promise(r => setTimeout(() => r(true), 250)); })()`);
    const r = await b.izvedi(`(() => { const q = document.querySelector('#exerciseArea :is(.layout-row, .layout-col, .layout-block, .xw-grid, .g9)').getBoundingClientRect();
      return { x: Math.floor(q.left + scrollX), y: Math.floor(q.top + scrollY), w: Math.ceil(q.width), h: Math.ceil(q.height) }; })()`);
    return (await b.cdp.poslji('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })).data;
  };
  const resitev = [];
  const F = await pos(''); resitev.push(await b.izvedi('!!document.querySelector("#exerciseArea .peek-hl")'));
  const A = await pos(OKVIR_SKRIT), B = await pos(OKVIR_SKRIT + STEVKE_SKRITE), C = await pos(STEVKE_SKRITE);
  resitev.push(await b.izvedi('!!document.querySelector("#exerciseArea .peek-hl")'));
  await b.izvedi(`document.getElementById('meritev').textContent = ''; new Promise(r => setTimeout(() => r(true), 250))`);
  const r = await b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [f, a, bb, c] = await Promise.all([${[F, A, B, C].map(s => JSON.stringify(s)).join(', ')}].map(slika));
    const raz = (p, q, k) => Math.max(Math.abs(p.data[k] - q.data[k]), Math.abs(p.data[k + 1] - q.data[k + 1]), Math.abs(p.data[k + 2] - q.data[k + 2]));
    let stik = 0, zakritih = 0;
    for (let k = 0; k < f.data.length; k += 4) { const st = raz(a, bb, k), ok = raz(bb, c, k); if (!st || !ok) continue; stik++; if (st > 3 && raz(f, c, k) === 0) zakritih++; }
    return { stik, zakritih };
  })()`);
  return { ...r, resitev: resitev.every(Boolean) ? true : resitev.some(Boolean) ? 'delno' : false };
}

// Izris območja vaje (innerHTML in izračunani slogi) za primerjavo z izhodiščem. dovoljeno: za
// element (indeks) lastnosti, ki se od izhodišča smejo razlikovati (docs/precrtanje-resitev-nacrt.md):
// prečrtana števka (peek-izbris, pri 7 in 8 celica izbrisa) barvo in črto (border-top-color je
// currentColor), pri 3 in 5 (ocitni) celica izbrisa podlago in njene male števke barvo.
const SLOGI = ['background-color', 'box-shadow', 'color', 'border-top-color', 'border-top-width', 'text-decoration-line', 'visibility', 'display'];
const OCITNI = ['naked-pair', 'naked-triple'];
const izris = (b, mode) => b.izvedi(`(() => { const a = document.getElementById('exerciseArea'), vsi = [...a.querySelectorAll('*')], ocitni = ${OCITNI.includes(mode)};
  const dovoljeno = {};
  vsi.forEach((e, i) => {
    if (e.matches('.cd.peek-izbris, .xw-cell.peek-elim, .xw-cell.xw-elim')) dovoljeno[i] = ['color', 'border-top-color', 'text-decoration-line'];
    else if (ocitni && e.matches('.gc.peek-elim:not(.peek-hl)')) dovoljeno[i] = ['background-color'];
    else if (ocitni && e.matches('.gc.peek-elim:not(.peek-hl) .cd')) dovoljeno[i] = ['color', 'border-top-color'];
  });
  return { html: a.innerHTML.replace(/ data-(i|vz|iz|izb)="[^"]*"/g, ''), dovoljeno,
    slogi: vsi.map(e => { const s = getComputedStyle(e); return ${JSON.stringify(SLOGI)}.map(p => s.getPropertyValue(p)).join('|'); }) }; })()`);
// Razlike nove kode od izhodišča razen dovoljenih: razred peek-izbris (pri 3 in 5 še peek-elim) se
// odstrani v obeh izrisih, dovoljene lastnosti so kot v izhodišču - tako primerjava velja z
// izhodiščem pred nalogo prečrtanja (06e64e5) in po njej (od faze 6 privzeto 4c47cc0).
function razlikeBrezPrecrtanja(star, nov, mode) {
  const brez = h => { let x = h.replace(/ peek-izbris(?=[ "])/g, ''); if (OCITNI.includes(mode)) x = x.replace(/ peek-elim(?=[ "])/g, ''); return x; };
  const html = brez(nov.html);
  star = { ...star, html: brez(star.html) };
  const slogi = nov.slogi.map((s, i) => {
    const d = nov.dovoljeno[i];
    if (!d || star.slogi[i] === undefined) return s;
    const a = s.split('|'), z = star.slogi[i].split('|');
    for (const p of d) a[SLOGI.indexOf(p)] = z[SLOGI.indexOf(p)];
    return a.join('|');
  });
  return razlikeIzrisa(star, { html, slogi }, SLOGI);
}
// Prečrtane števke: neprazno, slog kot pri 2 (ref).
function preveriSlogPrecrtanih(kdaj, p, ref) {
  const slab = p.filter(x => x.barva !== ref.barva || x.debelina !== ref.debelina || x.crta !== ref.crta);
  preveri(`${kdaj}: ${p.length} prečrtanih števk, slog kot pri 2 (${ref.barva}, ${ref.debelina}, ${ref.crta})`, p.length > 0 && slab.length === 0, slab.length ? slab : p);
}

// Izvleček commita v začasno mapo in brskalnik nad njim.
async function izhodisceBrskalnik(commit) {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), commit], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  return { star, b: await zazeni({ koren: star }) };
}

// Vaja v obeh brskalnikih (nova koda, izhodišče - z isto izbiro): izbira, »Rešitev«, meritev.
async function vaja(bNov, bStar, mode, sirina) {
  const rez = {};
  for (const [ime, b] of [['nov', bNov], ['star', bStar]]) {
    await odpri(b, mode, sirina);
    const r = rez[ime] = {};
    r.prazen = await izris(b, mode);
    r.vzorec = await oznaciVzorec(b);
    r.resitevBrez = await drziResitev(b, async () => ({ ...(await izris(b, mode)), precrtane: await precrtane(b) }));
    r.poSpustuBrez = await precrtane(b);
    r.izbrane = await izberi(b, mode, ime === 'star' ? rez.nov.izbrane : null);
    await pocakaj(b);
    r.pred = await slogiCelic(b);
    if (sirina < 500) r.prekrivanjePred = await prekrivanje(b);
    r.med = await drziResitev(b, async () => {
      const s = await slogiCelic(b);
      s.sirina = await b.izvedi('document.documentElement.scrollWidth');
      if (ime === 'nov') await b.posnetek(path.join(mapa, `${mode}-resitev-${sirina}.png`), { vsaStran: false });
      s.seVedno = await b.izvedi('!!document.querySelector("#exerciseArea .peek-hl")');
      s.legenda = await legendaSlogi(b, '.peek-overlay.visible');
      return s;
    });
    await pocakaj(b);
    r.po = await slogiCelic(b);
    r.poSpustu = await precrtane(b);
    if (sirina < 500) r.prekrivanjeMed = await resitevBrezMiske(b, () => prekrivanje(b));
  }
  return rez;
}

// ref: slog prečrtane števke pri 2 (slogIzbrisa2).
async function preveriVajo(bNov, bStar, mode, sirina, ref) {
  console.log(`${mode}, ${sirina} px`);
  const { star, nov } = await vaja(bNov, bStar, mode, sirina);
  preveri('izris brez izbire enak izhodišču', razlikeIzrisa(star.prazen, nov.prazen, SLOGI).length === 0, razlikeIzrisa(star.prazen, nov.prazen, SLOGI));
  const rb = razlikeBrezPrecrtanja(star.resitevBrez, nov.resitevBrez, mode);
  preveri('»Rešitev« brez izbire enaka izhodišču razen prečrtanja (in pri 3, 5 celic izbrisa)', rb.length === 0, rb);
  preveriSlogPrecrtanih('»Rešitev« brez izbire', nov.resitevBrez.precrtane, ref);
  preveri(`»Rešitev« brez izbire: prečrtane iste števke kot v izhodišču (ali izhodišče pred prečrtanjem brez njih: ${star.resitevBrez.precrtane.length})`,
    star.resitevBrez.precrtane.length === 0 || kljuci(star.resitevBrez.precrtane) === kljuci(nov.resitevBrez.precrtane));
  if (OCITNI.includes(mode)) {
    const iz = nov.vzorec.izbris;
    preveri(`3, 5: »Rešitev« brez izbire pokaže ${iz} rožnatih celic izbrisa (izhodišče ${star.vzorec.izbris})`, iz > 0 && (star.vzorec.izbris === 0 || star.vzorec.izbris === iz));
  }
  preveri('po spustu ni prečrtanih števk (brez izbire in z izbiro)', nov.poSpustuBrez.length === 0 && nov.poSpustu.length === 0, [nov.poSpustuBrez, nov.poSpustu]);
  const izbrane = nov.pred.filter(c => c.izb);
  const px = c => (c.xw ? 2 : 2.5);
  preveri(`pred »Preveri«: ${izbrane.length} izbrane celice modre (${IZBIRA_BG}, obroba ${MODRA})`,
    izbrane.length >= 2 && izbrane.every(c => c.bg === IZBIRA_BG && c.bs === okvir(MODRA, px(c))), izbrane);
  // Med »Rešitvijo«: vrsta celice iz razredov v tem trenutku.
  const vrsta = c => c.izb ? (c.vz ? 'pravilna' : c.iz ? 'napacnaIzbris' : 'napacna') : (c.vz ? 'spregledana' : c.iz ? 'izbris' : null);
  const PRICAKOVANO = {
    pravilna: c => c.bg === VZOREC_BG && c.bs === okvir(ZELENA, 2.5),
    napacna: c => c.bg === BELA && c.bs === okvir(RDECA, 2.5),
    napacnaIzbris: c => c.bg === IZBRIS_BG && c.bs === okvir(RDECA, 2.5),
    spregledana: c => c.bg === VZOREC_BG && c.bs === okvir(ZLATA, 2.5),
    izbris: c => c.bg === IZBRIS_BG && c.bs === 'none',
  };
  const poVrsti = {};
  for (const c of nov.med) { const v = vrsta(c); if (v) (poVrsti[v] = poVrsti[v] || []).push(c); }
  for (const [v, f] of Object.entries(PRICAKOVANO)) {
    if (!poVrsti[v]) continue;
    preveri(`med »Rešitvijo«: ${v} (${poVrsti[v].length})`, poVrsti[v].every(f), poVrsti[v].filter(c => !f(c)));
  }
  preveri('med »Rešitvijo«: vsaj ena pravilno in ena napačno izbrana', !!poVrsti.pravilna && !!(poVrsti.napacna || poVrsti.napacnaIzbris), Object.keys(poVrsti));
  if (['turbot-fish', 'w-wing', 'xy-wing'].includes(mode)) preveri('med »Rešitvijo«: napačno izbrana celica izbrisa', !!poVrsti.napacnaIzbris, Object.keys(poVrsti));
  if (mode === 'unique-rectangle') preveri('12: izbrani vogal z izbrisom je pravilno izbran (vzorec ima prednost)', (poVrsti.pravilna || []).some(c => c.iz), poVrsti.pravilna);
  for (const c of [...(poVrsti.napacna || []), ...(poVrsti.napacnaIzbris || [])]) {
    preveri(`rdeči okvir na ${c.bg === BELA ? 'beli' : 'rožnati'} podlagi: kontrast ${kontrast(RDECA, c.bg).toFixed(2)} ≥ 3`, kontrast(RDECA, c.bg) >= 3);
  }
  // Legenda (faza 6): postavke so natanko vrste celic na mreži, vzorček ima barvo celice.
  const OZNAKA = { pravilna: 'pravilno izbrana celica', spregledana: 'spregledana celica vzorca', napacna: 'napačno izbrana celica',
    napacnaIzbris: 'napačno izbrana celica izbrisa', izbris: 'celica izbrisa' };
  const leg = nov.med.legenda;
  preveri('med »Rešitvijo«: legenda je v okvirju in v kartici', !!leg && leg.vznotraj, leg);
  if (leg) {
    const brezStevke = leg.postavke.filter(p => p.besedilo !== 'kandidat za izbris').map(p => p.besedilo).sort();
    const vrste = Object.keys(OZNAKA).filter(v => poVrsti[v]);
    preveri(`med »Rešitvijo«: legenda našteje natanko vrste na mreži (${vrste.join(', ')})`,
      JSON.stringify(brezStevke) === JSON.stringify(vrste.map(v => OZNAKA[v]).sort()), leg.postavke.map(p => p.besedilo));
    for (const v of vrste) {
      const p = leg.postavke.find(x => x.besedilo === OZNAKA[v]), c = poVrsti[v][0];
      const ok = p && p.bg === c.bg && (v === 'izbris' || p.obroba === barvaOkvirja(c.bs));
      preveri(`legenda »${OZNAKA[v]}«: barva kot celica (${c.bg}, ${barvaOkvirja(c.bs) || 'brez okvirja'})`, ok, p);
    }
    const st = leg.postavke.find(p => p.besedilo === 'kandidat za izbris');
    preveri('legenda »kandidat za izbris«: rdeče prečrtana kot števka izbrisa', !!st && st.barva === ref.barva && st.crta.includes('line-through'), st);
  }
  preveri('brez vodoravnega drsnika', nov.med.sirina === sirina, nov.med.sirina);
  preveri('»Rešitev« prikazana ves čas pritiska (tudi po posnetku)', nov.med.seVedno === true);
  const poSpustu = nov.po.filter(c => c.izb);
  preveri('po spustu spet modra izbira', poSpustu.every(c => c.bg === IZBIRA_BG && c.bs === okvir(MODRA, px(c))), poSpustu);
  if (sirina < 500) {
    for (const [st, kdaj, res] of [['prekrivanjePred', 'pred »Preveri«', false], ['prekrivanjeMed', 'med »Rešitvijo«', true]]) {
      const s = star[st], n = nov[st];
      preveri(`${kdaj}: okvir in male števke - stik ${s.stik} → ${n.stik}, nevidnih ${s.zakritih} → ${n.zakritih} (ne več kot v izhodišču)`,
        n.stik <= s.stik && n.zakritih <= s.zakritih && s.resitev === res && n.resitev === res, { star: s, nov: n });
    }
  }
}

// Pravilen odgovor (celice vzorca s pravimi kliki; pri 4 in 6 še 2. faza s števkami iz besedila
// »Rešitve«) in »Rešitev« po njem - enako izhodišču razen prečrtanja. Neodvisno merilo prečrtanja:
// po pravilnem odgovoru so prečrtane iste števke kot ob »Rešitvi« brez izbire; ostanejo ob
// »Rešitvi« po odgovoru in po spustu. Pri 8 so celice po odgovoru zelene kot pri 7.
async function pravilenOdgovor(bNov, bStar, mode, sirina, ref) {
  const rez = {};
  for (const [ime, b] of [['star', bStar], ['nov', bNov]]) {
    await odpri(b, mode, sirina);
    const vzorec = await oznaciVzorec(b);
    const vz = await b.izvedi(`[...document.querySelectorAll('#exerciseArea [data-vz]')].map(e => e.dataset.i)`);
    for (const i of vz) await b.klikni(`#exerciseArea [data-i="${i}"]`);
    await odmakniMisko(b);
    await klikniGumb(b, 'Preveri');
    await pocakaj(b);
    const r = rez[ime] = { vzorec };
    if (await b.izvedi(`MODES[${JSON.stringify(mode)}].hasPhase2 === true`)) {
      const m = vzorec.besedilo.match(/Števke:<\/b> \{([\d, ]+)\}/);
      r.stevke = m ? m[1].split(', ') : [];
      for (const d of r.stevke) await b.klikni(`#exerciseArea .phase2 .digit-btns button[data-d="${d}"]`);
      await odmakniMisko(b);
      await klikniGumb(b, r.stevke.length === 2 ? 'Preveri dve števki' : 'Preveri tri števke');
      await pocakaj(b);
    }
    r.ok = await b.izvedi(`!!document.querySelector('#exerciseArea .fb.ok') && document.querySelector('#exerciseArea .fb.ok').textContent.startsWith('Pravilno!')`);
    r.legenda = await legendaSlogi(b, '.fb');
    r.pravilne = await b.izvedi(`[...document.querySelectorAll('#exerciseArea :is(.gc.correct, .xw-cell.xw-correct, .xw-cell.xw-sf-correct)')].map(e => { const s = getComputedStyle(e); return { bg: s.backgroundColor, bs: s.boxShadow }; })`);
    r.po = await izris(b, mode);
    r.celice = await slogiCelic(b);
    r.precrtanePo = await precrtane(b);
    r.resitev = await drziResitev(b, async () => ({ ...(await izris(b, mode)), precrtane: await precrtane(b) }));
    r.poSpustu = await precrtane(b);
  }
  const { star, nov } = rez;
  preveri(`${mode}, ${sirina} px: pravilen odgovor sprejet${nov.stevke ? ` (2. faza: ${nov.stevke.join(', ')})` : ''}`, star.ok && nov.ok);
  const res = kljuci(nov.vzorec.precrtane), po = kljuci(nov.precrtanePo);
  preveri(`${mode}: po pravilnem odgovoru prečrtane iste števke kot ob »Rešitvi« brez izbire (${nov.precrtanePo.length})`, res !== '' && res === po, { resitev: res, po });
  preveriSlogPrecrtanih(`${mode}: po pravilnem odgovoru`, nov.precrtanePo, ref);
  preveri(`${mode}: »Rešitev« po odgovoru in spust prečrtanih ne spremenita`, kljuci(nov.resitev.precrtane) === po && kljuci(nov.poSpustu) === po,
    { resitev: kljuci(nov.resitev.precrtane), poSpustu: kljuci(nov.poSpustu), po });
  if (['x-wing', 'swordfish'].includes(mode)) {
    preveri(`${mode}: po odgovoru prečrtane kot v izhodišču (ali izhodišče pred prečrtanjem brez njih: ${star.precrtanePo.length})`,
      star.precrtanePo.length === 0 || kljuci(star.precrtanePo) === kljuci(nov.precrtanePo));
  }
  if (mode === 'swordfish') {
    const zelene = nov.celice.filter(c => c.bg === 'rgb(220, 238, 229)');
    preveri(`${mode}: po pravilnem odgovoru ${zelene.length} celic zelenih kot pri X-krilu (--green-bg, obroba --green)`,
      zelene.length >= 6 && zelene.every(c => c.bs === okvir(ZELENA, 2)), nov.celice.filter(c => c.bg !== 'rgb(255, 255, 255)'));
  }
  // Legenda po odgovoru (faza 6): izbrane celice (zelene), celice z izbrisom (pri 3-6 brez
  // podlage), izbrisani kandidati - barve kot celice na mreži.
  const lp = nov.legenda;
  preveri(`${mode}, ${sirina} px: legenda pod »Pravilno!« v kartici`, !!lp && lp.vznotraj, lp);
  if (lp) {
    const zSCelico = !['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple'].includes(mode);
    preveri(`${mode}: legenda po odgovoru`, JSON.stringify(lp.postavke.map(p => p.besedilo))
      === JSON.stringify(zSCelico ? ['izbrane celice', 'celica z izbrisom', 'izbrisani kandidati'] : ['izbrane celice', 'izbrisani kandidati']), lp.postavke.map(p => p.besedilo));
    const pravilna = nov.pravilne.find(c => c.bg === 'rgb(220, 238, 229)');
    const pi = lp.postavke.find(p => p.besedilo === 'izbrane celice');
    preveri(`${mode}: legenda »izbrane celice« kot celica odgovora`, !!pravilna && !!pi && pi.bg === pravilna.bg && pi.obroba === barvaOkvirja(pravilna.bs), { pi, pravilna });
    if (zSCelico) {
      const izb = nov.celice.find(c => c.bg === IZBRIS_BG), pz = lp.postavke.find(p => p.besedilo === 'celica z izbrisom');
      preveri(`${mode}: legenda »celica z izbrisom« kot celica izbrisa`, !!izb && !!pz && pz.bg === izb.bg && (barvaOkvirja(izb.bs) === null || pz.obroba === barvaOkvirja(izb.bs)), { pz, izb });
    }
    const pk = lp.postavke.find(p => p.besedilo === 'izbrisani kandidati');
    preveri(`${mode}: legenda »izbrisani kandidati« rdeče prečrtana`, !!pk && pk.barva === ref.barva && pk.crta.includes('line-through'), pk);
  }
  const r1 = razlikeBrezPrecrtanja(star.po, nov.po, mode), r2 = razlikeBrezPrecrtanja(star.resitev, nov.resitev, mode);
  preveri(`${mode}, ${sirina} px: po pravilnem odgovoru enako izhodišču razen prečrtanja`, r1.length === 0, r1);
  preveri(`${mode}, ${sirina} px: »Rešitev« po pravilnem odgovoru enaka izhodišču razen prečrtanja (in pri 3, 5 celic izbrisa)`, r2.length === 0, r2);
}

// 8 · Mečarica: drug veljaven vzorec (swordfish() na mreži iz celic s števko - kot »Preveri«),
// izbran s pravimi kliki, je ob »Rešitvi« ves zelen; »Preveri« ga sprejme.
async function drugVzorec(b, sirina) {
  console.log(`swordfish, drug veljaven vzorec, ${sirina} px`);
  let najden = null;
  for (let seme = 4242; seme < 4262 && !najden; seme++) {
    await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
    await b.izvedi(SEME(seme));
    await b.klikni('.menu-card[data-mode="swordfish"]');
    await odmakniMisko(b);
    await b.izvedi("document.body.style.paddingBottom = '800px'; true");
    await oznaciVzorec(b);
    najden = await b.izvedi(`(() => { const c = [...document.querySelectorAll('#exerciseArea .xw-cell')];
      const vz = c.filter(e => e.dataset.vz).map(e => +e.dataset.idx).sort((x, y) => x - y).join();
      const d = swordfish({ grid: new Array(81).fill(0), cand: c.map(e => e.classList.contains('has-digit') ? 2 : 0) })
        .map(s => s.cells).find(s => [...s].sort((x, y) => x - y).join() !== vz);
      return d ? { d, seme: ${seme} } : null; })()`);
  }
  preveri('vaja z drugim veljavnim vzorcem (seme 4242-4261)', !!najden);
  if (!najden) return;
  for (const idx of najden.d) await b.klikni(`#exerciseArea .xw-cell[data-idx="${idx}"]`);
  await odmakniMisko(b);
  const med = await drziResitev(b, () => slogiCelic(b));
  const izb = await b.izvedi(`[...document.querySelectorAll('#exerciseArea .xw-cell')].filter(e => [${najden.d}].includes(+e.dataset.idx)).map(e => e.dataset.i)`);
  const celice = med.filter(c => izb.includes(c.i));
  preveri(`ob »Rešitvi« vseh ${celice.length} izbranih celic jantarnih z zelenim okvirjem (seme ${najden.seme})`,
    celice.length === najden.d.length && celice.every(c => c.vz && c.bg === VZOREC_BG && c.bs === okvir(ZELENA, 2.5)), celice);
  preveri('ob »Rešitvi« nobena celica z rdečim okvirjem', !med.some(c => c.bs.startsWith(RDECA)), med.filter(c => c.bs.startsWith(RDECA)));
  await klikniGumb(b, 'Preveri');
  preveri('»Preveri« drug vzorec sprejme', await b.izvedi(`!!document.querySelector('#exerciseArea .fb.ok')`));
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const izh = await izhodisceBrskalnik(izhodisce);
  const bNov = await zazeni();
  try {
    // Slog prečrtane števke pri 2 · Izločitev v bloku (.kand.k-izbris) - merilo za 3-12.
    const ref = {};
    for (const sirina of SIRINE) {
      const r = await slogIzbrisa2(bNov, sirina);
      preveri(`2 · Izločitev v bloku, ${sirina} px: »Rešitev« prečrta števko izbrisa (${JSON.stringify(r)})`,
        !!r && r.barva === 'rgb(178, 58, 46)' && r.crta === 'line-through' && r.debelina === '700', r);
      ref[sirina] = r || { barva: 'rgb(178, 58, 46)', debelina: '700', crta: 'line-through' };
    }
    for (const sirina of SIRINE) for (const m of TEHNIKE) await preveriVajo(bNov, izh.b, m, sirina, ref[sirina]);
    console.log(`Pravilen odgovor (izhodišče ${izhodisce})`);
    for (const sirina of SIRINE) for (const m of TEHNIKE) await pravilenOdgovor(bNov, izh.b, m, sirina, ref[sirina]);
    for (const sirina of SIRINE) await drugVzorec(bNov, sirina);
  } finally {
    for (const b of [izh.b, bNov]) {
      await b.zapri();
      for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
    }
    fs.rmSync(izh.star, { recursive: true, force: true });
  }
  console.log(napak ? `\n${napak} napak (posnetki v ${mapa})` : `\nVse drži (posnetki v ${mapa})`);
  process.exitCode = napak ? 1 : 0;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
