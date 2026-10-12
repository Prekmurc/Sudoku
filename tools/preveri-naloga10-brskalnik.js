'use strict';
// Naloga 10 »Filtri in razvrščanje v zbirki« (docs/naloga10-nacrt.md) v pravem brskalniku; raste po korakih.
//
// Testna zbirka (kot v prototipu načrta): 32 ugank – 24 iz generatorja (ustvariUganko() s stalnimi semeni, po 8
// lahkih, srednjih in težkih; vsaka preverjena s countSolutions()) in 8 iz docs/uganke.md (brez vgrajenih primerov);
// zapisi iz zbirkaShraniResitev(), v teku je vsaka tretja, rešena vsaka peta (podatki v zapisu, brez shranjene igre).
// Sestavi jo scenarij v Node in jo vpiše v localStorage strani.
//
// Korak 2 – igra, okno »Zbirka ugank«, pri 320, 375 (posnemanje telefona, pravi dotik) in 1280 px (miška):
//   - okenca v mreži dva po dva (Težavnost · Stanje / Tehnika · Razvrsti), enako široka, ime nad okencem, vsako v
//     svojem <label>; vsebnik med vrstico sporočil in prvo kartico; brez preliva strani, okna in plošče; pisava
//     Inter 14 px, odmik 6 px, text-overflow: ellipsis; kontrast imen na podlagi okna vsaj 4,5 : 1; vrstica
//     »Prikazanih 32 od 32« vsaj 32 px, brez »Počisti filtre«;
//   - pravi dotik/klik okenca Težavnost, dvakrat puščica dol in Enter → change: seznam se osveži brez gumba (kartice in
//     vrstni red enaki logiki zbirkaFiltriraj() v strani), modra obroba 2 px (kontrast na beli vsaj 3 : 1), okence
//     ostane enako veliko, »Počisti filtre« viden v plošči, izbira v shrambi; tipkovnica (fokus, puščica dol) v
//     okencih Tehnika in Razvrsti → change, seznam in vrstni red po logiki; višina vsebnika se ne spremeni;
//   - Escape s fokusom v okencu zapre okno; ponovno odprtje okna in ponovno odprta stran – ista izbira in seznam;
//   - »Počisti filtre« s pravim dotikom/klikom: filtri izklopljeni, Razvrsti ostane, gumb skrit;
//   - prazen izid (»Nobena uganka ne ustreza izbranim filtrom.«);
//   - vrh prve kartice in število celih kartic v oknu: izhodišče (--izhodisce, privzeto 9e07401 – pred korakom 2)
//     → zdaj; posnetki filtri-<širina>-brez.png, filtri-<širina>-izbrani.png, filtri-<širina>-prazno.png;
//   - brez napak JS (tudi v izhodišču).
// --korak N požene korake do N (privzeto 2), --samo N samo korak N.
//
//   node tools/preveri-naloga10-brskalnik.js [--korak N | --samo N] [--mapa <mapa>] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome); pribl. 1 min.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { loadContext, loadPuzzles } = require('../tests/load-engine.js');

const KOREN = path.join(__dirname, '..');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-naloga10'));
const korak = Number(arg('--korak', '2'));
const izhodisce = arg('--izhodisce', '9e07401');
const samo = args.includes('--samo') ? Number(arg('--samo')) : null;
const tece = n => (samo === null ? korak >= n : samo === n);

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const J = v => JSON.stringify(v);
const pocakaj = (b, ms = 300) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);
const pritisni = (b, izb, dotik) => (dotik ? b.tapni(izb) : b.klikni(izb));

// ---------- testna zbirka ----------
const SEMENA = { lahka: [1, 2, 3, 4, 5, 6, 7, 8], srednja: [5, 17, 18, 21, 32, 42, 46, 56], tezka: [7, 25, 38, 41, 48, 53, 57, 60] };
function testnaZbirka() {
  const shramba = new Map();
  const { run } = loadContext(['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/zbirka.js'], {
    localStorage: { getItem: k => (shramba.has(k) ? shramba.get(k) : null), setItem: (k, v) => shramba.set(k, String(v)), removeItem: k => shramba.delete(k) },
  });
  // Vgrajeni primer v zbirko ne gre, ista uganka dvakrat tudi ne – taka se preskoči (seme 2 pri lahki da primer,
  // lahka-seme-1 iz docs/uganke.md je seme 1); manjkajoče dopolnijo naslednja semena (pri lahki je iskanje hitro).
  const uganke = [];
  const ustreza = d => !run(`zbirkaPrimerZa(${J(d)})`) && !uganke.some(u => u.danosti === d);
  for (const [kljuc, semena] of Object.entries(SEMENA)) {
    const ime = run(`STOPNJE_UGANK.find(s => s.kljuc === ${J(kljuc)}).ime`);
    let n = 0;
    for (let i = 0, seme = semena[0]; n < 8; i++) {
      seme = i < semena.length ? semena[i] : seme + 1;
      if (i > 200) throw new Error(`premalo ugank ${kljuc} (generator se je spremenil – poišči nova semena)`);
      const u = run(`ustvariUganko(${J(kljuc)}, ${seme})`);
      if (!u || !ustreza(u.danosti)) continue;
      uganke.push({ danosti: u.danosti, tezavnost: ime, izvor: 'generator' });
      n++;
    }
  }
  for (const p of loadPuzzles()) {
    const d = p.danosti.replace(/\./g, '0');
    if (uganke.length < 32 && ustreza(d)) uganke.push({ danosti: d, izvor: 'rocno' });
  }
  if (uganke.length !== 32) throw new Error(`testna zbirka ima ${uganke.length} ugank, ne 32`);
  uganke.forEach((u, i) => {
    if (run(`countSolutions(${J(u.danosti)})`) !== 1) throw new Error(`uganka ${i} nima natanko ene rešitve`);
    run(`zbirkaZdaj = () => ${J(`2026-09-${String(1 + Math.floor(i / 2)).padStart(2, '0')} ${String(8 + (i % 2)).padStart(2, '0')}:00`)}`);
    run(`(() => { const r = solve(${J(u.danosti)}); zbirkaShraniResitev(${J(u.danosti)}, r.board, r.log, ${J({ tezavnost: u.tezavnost, izvor: u.izvor })}); })()`);
    const praznih = [...u.danosti].filter(c => c === '0').length;
    const cas = `2026-10-${String(1 + (i % 28)).padStart(2, '0')} 10:00`;
    if (i % 5 === 0) run(`zbirkaShraniIgranje(${J(u.danosti)}, ${J(cas)}, 81, false)`);
    else if (i % 3 === 0) run(`zbirkaShraniIgranje(${J(u.danosti)}, ${J(cas)}, ${81 - praznih + Math.floor(praznih / 2)}, false)`);
  });
  return shramba.get('sudoku.zbirka.v1');
}

// ---------- meritve v strani ----------
const KONTRAST = `const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const kontrast = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };`;
const MERI = `(() => {
  ${KONTRAST}
  const r = e => { if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return { levo: q.left, desno: q.right, vrh: q.top, dno: q.bottom, sirina: q.width, visina: q.height }; };
  const panel = document.querySelector('#zbirkaDialog .dialog-panel'), dialog = document.getElementById('zbirkaDialog');
  const filtri = document.getElementById('zbirkaFiltri');
  const kartice = [...document.querySelectorAll('#zbirkaSeznam > li')];
  const prva = kartice[0];
  const oznake = filtri ? [...filtri.querySelectorAll('label.zb-filter')] : [];
  const sel = oznake.length ? oznake[0].querySelector('select') : null;
  const s = sel ? getComputedStyle(sel) : null;
  const pocisti = filtri ? filtri.querySelector('.zb-prikazanih button') : null;
  const ozadje = getComputedStyle(panel).backgroundColor;
  return {
    filtri: filtri ? r(filtri) : null, mreza: filtri ? r(filtri.querySelector('.zb-filtri-mreza')) : null,
    oznake: oznake.map(l => ({ ime: l.firstChild.textContent, imeR: r(l.firstChild), sel: r(l.querySelector('select')), lab: r(l),
      vLabel: l.querySelector('select').parentElement === l, filter: l.querySelector('select').dataset.filter })),
    vrstica: filtri ? r(filtri.querySelector('.zb-prikazanih')) : null, napis: filtri ? filtri.querySelector('.zb-prikazanih span').textContent : null,
    pocisti: pocisti && !pocisti.hidden ? r(pocisti) : null,
    status: r(document.getElementById('zbirkaStatus')), ocenaGumbi: r(document.getElementById('ocenaGumbi')),
    prva: r(prva), prvaPrazno: prva ? prva.className === 'prazno' : null, prvaBesedilo: prva ? prva.textContent : null,
    kartic: kartice.length, celih: kartice.filter(li => { const q = li.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight; }).length,
    okno: [innerWidth, innerHeight], panel: r(panel),
    slog: s ? { pisava: s.fontFamily, velikost: s.fontSize, odmik: s.paddingLeft, prelom: s.textOverflow, obroba: s.borderTopWidth, barvaObrobe: s.borderTopColor } : null,
    inter: document.fonts.check('14px Inter'),
    kontrastImen: oznake.length ? kontrast(getComputedStyle(oznake[0].firstChild).color, ozadje) : null,
    preliv: document.documentElement.scrollWidth > document.documentElement.clientWidth || dialog.scrollWidth > dialog.clientWidth || panel.scrollWidth > panel.clientWidth,
  };
})()`;
// Okenca: vrednost, razred, obroba (izračunana), velikost; logika strani za primerjavo seznama.
const OKENCA = `(() => {
  ${KONTRAST}
  const v = document.createElement('i'); v.style.color = 'var(--blue)'; document.body.appendChild(v); const modra = getComputedStyle(v).color; v.remove();
  return [...document.querySelectorAll('#zbirkaFiltri select')].map(s => { const c = getComputedStyle(s), q = s.getBoundingClientRect();
    return { filter: s.dataset.filter, vrednost: s.value, napis: s.selectedOptions[0] ? s.selectedOptions[0].textContent : null, vklopljen: s.classList.contains('vklopljen'),
      obroba: c.borderTopWidth, barva: c.borderTopColor, modra, kontrast: kontrast(c.borderTopColor, 'rgb(255, 255, 255)'), sirina: q.width, visina: q.height }; });
})()`;
const SEZNAM = `(() => {
  const izbira = zbirkaFiltriBeri(), lastnosti = zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre), pricakovane = zbirkaFiltriraj(lastnosti, izbira);
  const li = [...document.querySelectorAll('#zbirkaSeznam > li')];
  return { izbira, vSeznamu: [...zbirkaVrstice.keys()], pricakovano: pricakovane.map(l => l.z.danosti),
    enakDom: [...zbirkaVrstice.values()].every((x, i) => x === li[i]), napis: document.querySelector('.zb-prikazanih span').textContent,
    pricakovanNapis: zbirkaNapisPrikazanih(pricakovane.length, lastnosti.length) };
})()`;

async function odpriIgro(b, sirina, zbirka) {
  const dotik = sirina < 500;
  const okno = { sirina, visina: { 320: 640, 375: 667 }[sirina] || 800, mobilno: dotik };
  await b.odpri('igra/index.html', okno);
  await b.izvedi(`(localStorage.clear(), localStorage.setItem('sudoku.zbirka.v1', ${J(zbirka)}), true)`);
  await b.odpri('igra/index.html', okno);
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  return okno;
}
async function odpriZbirko(b, dotik) {
  await pritisni(b, '#zbirkaBtn', dotik);
  await pocakaj(b, 300);
  await b.izvedi('document.fonts.ready.then(() => true)');
  await b.izvedi('(document.getElementById("zbirkaDialog").scrollTop = 0, true)');
}

// ---------- Korak 2 – igra ----------
const meritve2 = [];
const izhodiscne = {};

async function izhodisceIgre(zbirka) {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  try {
    console.log(`\nKorak 2 – izhodišče ${izhodisce}: vrh prve kartice v oknu zbirke igre`);
    for (const s of [320, 375, 1280]) {
      await odpriIgro(bStar, s, zbirka);
      await odpriZbirko(bStar, s < 500);
      izhodiscne[s] = await bStar.izvedi(MERI);
      preveri(`izhodišče ${s} px: 32 kartic, brez filtrov`, izhodiscne[s].kartic === 32 && !izhodiscne[s].filtri, { kartic: izhodiscne[s].kartic });
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
}

async function korak2(b, sirina, zbirka) {
  const dotik = sirina < 500;
  console.log(`\nKorak 2 – igra, okno »Zbirka ugank«, ${sirina} px (${dotik ? 'dotik' : 'miška'})`);
  await odpriIgro(b, sirina, zbirka);
  await odpriZbirko(b, dotik);
  const m = await b.izvedi(MERI);
  const o = m.oznake;
  preveri('štiri okenca v oznakah: Težavnost, Stanje, Tehnika, Razvrsti',
    J(o.map(x => [x.ime, x.filter, x.vLabel])) === J([['Težavnost', 'tezavnost', true], ['Stanje', 'stanje', true], ['Tehnika', 'tehnika', true], ['Razvrsti', 'razvrsti', true]]), o.map(x => x.ime));
  const p = (a, c) => Math.abs(a - c) < 0.5;
  preveri(`mreža dva po dva, okenca enako široka (${o.length ? Math.round(o[0].sel.sirina) : '?'} × ${o.length ? Math.round(o[0].sel.visina) : '?'} px), čez vso širino stolpca, ime nad okencem`,
    o.length === 4 && p(o[0].lab.vrh, o[1].lab.vrh) && p(o[2].lab.vrh, o[3].lab.vrh) && o[2].lab.vrh > o[0].lab.dno
      && o.every(x => p(x.sel.sirina, o[0].sel.sirina) && p(x.sel.sirina, x.lab.sirina) && x.imeR.dno <= x.sel.vrh + 0.5)
      && p(o[0].lab.levo, m.mreza.levo) && p(o[1].lab.desno, m.mreza.desno) && p(o[2].lab.levo, m.mreza.levo) && p(o[3].lab.desno, m.mreza.desno), o);
  preveri('vsebnik med vrstico sporočil in prvo kartico, v plošči okna; brez preliva strani, okna in plošče',
    m.filtri && m.status.dno <= m.filtri.vrh + 0.5 && m.filtri.dno <= m.prva.vrh + 0.5 && m.filtri.levo >= m.panel.levo && m.filtri.desno <= m.panel.desno && !m.preliv, m);
  preveri(`okence: pisava Inter 14 px, odmik 6 px, »…« pri predolgem napisu (${m.slog && m.slog.pisava})`,
    m.slog && /^Inter/.test(m.slog.pisava) && m.slog.velikost === '14px' && m.slog.odmik === '6px' && m.slog.prelom === 'ellipsis' && m.inter, m.slog);
  preveri(`kontrast imen okenc na podlagi okna ${m.kontrastImen} : 1 (vsaj 4,5)`, m.kontrastImen >= 4.5, m.kontrastImen);
  preveri(`vrstica »${m.napis}« (${m.vrstica && Math.round(m.vrstica.visina)} px, vsaj 32), brez »Počisti filtre«`,
    m.napis === 'Prikazanih 32 od 32' && m.vrstica.visina >= 31.5 && !m.pocisti && m.kartic === 32, m);
  await b.posnetek(path.join(mapa, `filtri-${sirina}-brez.png`), { vsaStran: false });

  // Pravi dotik/klik okenca Težavnost, dvakrat puščica dol in Enter → change; seznam se osveži brez gumba.
  await pritisni(b, '#zbirkaFiltri select[data-filter="tezavnost"]', dotik);
  await pocakaj(b, 200);
  await b.tipka('ArrowDown');
  await b.tipka('ArrowDown');
  await b.tipka('Enter');
  await pocakaj(b, 200);
  let ok = await b.izvedi(OKENCA), sez = await b.izvedi(SEZNAM);
  const tez = ok[0];
  preveri(`${dotik ? 'dotik' : 'klik'} okenca Težavnost, dvakrat puščica dol, Enter → »${tez.napis}«; seznam (${sez.vSeznamu.length}) in vrstica »${sez.napis}« po logiki`,
    tez.vrednost !== '' && J(sez.vSeznamu) === J(sez.pricakovano) && sez.enakDom && sez.napis === sez.pricakovanNapis && sez.vSeznamu.length < 32
      && sez.izbira.tezavnost === tez.vrednost.slice(1), { tez, sez });
  preveri(`vklopljeno okence: modra obroba ${tez.obroba} (${tez.barva}, kontrast na beli ${tez.kontrast} : 1, vsaj 3), velikost enaka (${Math.round(tez.sirina)} × ${Math.round(tez.visina)} px)`,
    tez.vklopljen && tez.obroba === '2px' && tez.barva === tez.modra && tez.kontrast >= 3 && !ok[1].vklopljen && ok[1].obroba === '1px'
      && Math.abs(tez.sirina - ok[1].sirina) < 0.5 && Math.abs(tez.visina - ok[1].visina) < 0.5, ok);
  let m2 = await b.izvedi(MERI);
  preveri('»Počisti filtre« viden v vrstici, v plošči; višina vsebnika enaka',
    m2.pocisti && m2.pocisti.desno <= m2.panel.desno && m2.pocisti.vrh >= m2.vrstica.vrh - 0.5 && m2.pocisti.dno <= m2.vrstica.dno + 0.5
      && Math.abs(m2.filtri.visina - m.filtri.visina) < 0.5 && !m2.preliv, { pocisti: m2.pocisti, vrstica: m2.vrstica, filtri: [m.filtri.visina, m2.filtri.visina] });

  // Tipkovnica: fokus in puščica dol v okencih Tehnika in Razvrsti (dvakrat – »Število danih«).
  await b.fokus('#zbirkaFiltri select[data-filter="tehnika"]');
  await b.tipka('ArrowDown');
  await pocakaj(b, 150);
  await b.fokus('#zbirkaFiltri select[data-filter="razvrsti"]');
  await b.tipka('ArrowDown');
  await b.tipka('ArrowDown');
  await pocakaj(b, 150);
  ok = await b.izvedi(OKENCA);
  sez = await b.izvedi(SEZNAM);
  preveri(`tipkovnica: Tehnika »${ok[2].napis}«, Razvrsti »${ok[3].napis}«; seznam (${sez.vSeznamu.length}) in vrstni red po logiki, vrstica »${sez.napis}«`,
    ok[2].vrednost !== '' && ok[2].vklopljen && ok[3].vrednost === 'danih' && !ok[3].vklopljen && sez.izbira.tehnika === ok[2].vrednost.slice(1) && sez.izbira.razvrsti === 'danih'
      && J(sez.vSeznamu) === J(sez.pricakovano) && sez.vSeznamu.length > 1 && sez.enakDom && sez.napis === sez.pricakovanNapis, { ok, sez });
  await b.izvedi('(document.getElementById("zbirkaDialog").scrollTop = 0, true)');
  await b.posnetek(path.join(mapa, `filtri-${sirina}-izbrani.png`), { vsaStran: false });
  const izbrane = ok.map(x => x.napis);

  // Escape s fokusom v okencu zapre okno; ponovno odprtje okna in strani – ista izbira.
  await b.fokus('#zbirkaFiltri select[data-filter="stanje"]');
  await b.tipka('Escape');
  await pocakaj(b, 150);
  preveri('Escape s fokusom v okencu zapre okno', !(await b.izvedi('document.getElementById("zbirkaDialog").classList.contains("odprt")')));
  await odpriZbirko(b, dotik);
  ok = await b.izvedi(OKENCA);
  sez = await b.izvedi(SEZNAM);
  preveri('ponovno odprto okno: ista izbira in seznam', J(ok.map(x => x.napis)) === J(izbrane) && J(sez.vSeznamu) === J(sez.pricakovano), ok.map(x => x.napis));
  await b.odpri('igra/index.html', { sirina, visina: { 320: 640, 375: 667 }[sirina] || 800, mobilno: dotik });
  await b.cakaj('document.fonts.status === "loaded"', 15000);
  await odpriZbirko(b, dotik);
  ok = await b.izvedi(OKENCA);
  sez = await b.izvedi(SEZNAM);
  preveri('ponovno odprta stran: ista izbira in seznam', J(ok.map(x => x.napis)) === J(izbrane) && J(sez.vSeznamu) === J(sez.pricakovano) && sez.enakDom, ok.map(x => x.napis));

  // »Počisti filtre« s pravim dotikom/klikom: filtri izklopljeni, Razvrsti ostane.
  await pritisni(b, '#zbirkaFiltri .zb-prikazanih button', dotik);
  await pocakaj(b, 150);
  ok = await b.izvedi(OKENCA);
  sez = await b.izvedi(SEZNAM);
  m2 = await b.izvedi(MERI);
  preveri(`»Počisti filtre« (${dotik ? 'dotik' : 'klik'}): filtri izklopljeni, Razvrsti »${ok[3].napis}«, gumb skrit, »${sez.napis}«`,
    ok.slice(0, 3).every(x => x.vrednost === '' && !x.vklopljen) && ok[3].vrednost === 'danih' && !m2.pocisti && sez.napis === 'Prikazanih 32 od 32'
      && J(sez.vSeznamu) === J(sez.pricakovano) && sez.vSeznamu.length === 32, { ok, napis: sez.napis });

  // Prazen izid: Rešena in tehnika, ki je nima nobena rešena uganka.
  const prazno = await b.izvedi(`(() => {
    const l = zbirkaLastnostiZbirke(zbirkaBeri(), igreBeri().igre);
    const t = zbirkaMoznostiFiltrov(l, { ...zbirkaFiltriBeri(), stanje: 'resena' }).tehnika.find(x => x.n === 0);
    if (!t) return null;
    const nastavi = (f, v) => { const s = document.querySelector('#zbirkaFiltri select[data-filter="' + f + '"]'); s.value = v; s.dispatchEvent(new Event('change')); };
    nastavi('stanje', '=resena'); nastavi('tehnika', '=' + t.vrednost);
    return t.napis;
  })()`);
  m2 = await b.izvedi(MERI);
  preveri(`prazen izid (Rešena, ${prazno}): »Nobena uganka ne ustreza izbranim filtrom.«, »Prikazanih 0 od 32«`,
    prazno && m2.kartic === 1 && m2.prvaPrazno && m2.prvaBesedilo === 'Nobena uganka ne ustreza izbranim filtrom.' && m2.napis === 'Prikazanih 0 od 32' && !m2.preliv, m2);
  await b.posnetek(path.join(mapa, `filtri-${sirina}-prazno.png`), { vsaStran: false });

  const iz = izhodiscne[sirina];
  meritve2.push(`${sirina} × ${m.okno[1]} px: okence ${Math.round(o[0].sel.sirina)} × ${Math.round(o[0].sel.visina)} px, vsebnik ${Math.round(m.filtri.visina)} px `
    + `(mreža ${Math.round(m.mreza.visina)} + vrstica ${Math.round(m.vrstica.visina)}); vrh prve kartice ${iz ? Math.round(iz.prva.vrh) : '?'} → ${Math.round(m.prva.vrh)} px, `
    + `celih kartic ${iz ? iz.celih : '?'} → ${m.celih}; kontrast imen ${m.kontrastImen} : 1, obrobe ${tez.kontrast} : 1`);
}

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const t = Date.now();
  const zbirka = testnaZbirka();
  console.log(`Testna zbirka: ${JSON.parse(zbirka).length} ugank (${Math.round((Date.now() - t) / 1000)} s)`);
  if (tece(2)) await izhodisceIgre(zbirka);
  const b = await zazeni();
  try {
    if (tece(2)) {
      for (const s of [320, 375, 1280]) await korak2(b, s, zbirka);
      console.log('\nKorak 2 – meritve (izhodišče → zdaj):');
      for (const v of meritve2) console.log('  ' + v);
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } catch (e) {
    console.error(e);
    napak++;
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})();
