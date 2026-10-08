'use strict';
// Faza 7 v pravem brskalniku (docs/faza7-nacrt.md). Scenarij raste po korakih:
//   korak 2 (6.6, dopolnitev D1) - sporočila o številu rešitev v igri: vrstica ocene v
//     seznamu zbirke po »Oceni zbirko« (najdaljša: »· enoličnosti ni bilo mogoče preveriti
//     v razumnem času«) in sporočilo »Začni igro« v oknu »Nova uganka« pri 320 in 375 px -
//     besedilo se prelomi v svoji kartici, stran in okno nimata vodoravnega preliva.
// Uganke brez rešitve in z več rešitvami izpelje program (countSolutions()) iz uganke v
// docs/uganke.md; 'unknown' da nadomestni countSolutions v strani. Ocena teče v glavni
// niti (Worker v strani onemogočen - nadomestna pot igre za file://), ker delavec
// nadomestnega countSolutions ne vidi. Gumbi s pravim klikom.
//   korak 3 (6.5) - gumba »Izvozi« in »Uvozi« v reševalcu in igri pri 375 in 1280 px, vse s
//     pravim klikom: izvoz prenese datoteko (prenos v mapo prek DevTools), »Izbriši vse« (pravo
//     okno confirm, potrdi ga DevTools), »Uvozi« odpre izbirnik datotek (DevTools mu da
//     preneseno datoteko), sporočilo, seznam, števec, prazna vrednost polja, ista datoteka znova,
//     zbirka po uvozu = zbirka pred izvozom; uvoz opombe odprte uganke osveži vrstico pod rešitvijo
//     (reševalec) oziroma kartico »Uganka« (igra); datoteka brez ugank. Opažanja se primerjajo
//     z izhodiščem (--izhodisce, privzeto 2fdb542 - pred fazo 7; izvleček z git archive) -
//     obnašanje mora biti enako.
//   korak 4 (6.8) - okno zbirke v reševalcu na skupnih razredih .dialog pri 320, 375 in 1280 px:
//     odprto okno z dvema ugankama in zelenim statusom (pravi klik na »Zbirka« in »Izvozi«)
//     primerjano z izhodiščem - izhodišče z dodano odločitvijo O2 (odmik pod glavo 10 px) mora
//     biti enako v drevesu, izračunanih slogih (vse lastnosti), položajih in do piksla; izhodišče
//     brez O2 se razlikuje samo v odmiku pod glavo (in višini panela). Obnašanje (✕, klik ob
//     panelu, Escape - tudi ob povečanem prikazu -, Pomoč) enako izhodišču.
//   korak 5 (1.1) - raven kot podatek tehnike pri 375 in 1280 px: značke na karticah treninga
//     (vrstni red, razred, besedilo, vse lastnosti izračunanega sloga), značke ravni v oknu Pomoč
//     vseh treh aplikacij (pravi klik na gumb) in oznake korakov v reševalcu po »Reši« na P_14
//     in P_15 (razred, barva, podlaga) - enake izhodišču. Od XY-verige, korak 2 (docs/xy-veriga-nacrt.md,
//     razdelek 7) se smeta razlikovati samo barvi pisave lahke in srednje ravni (--green-ink, --amber-ink);
//     značke težavnosti (zbirkaZnacka() za vseh osem, na beli podlagi in na kartici) in ekspertne ravni
//     (.tag.t-expert, .badge-ekspertna): izračunan slog = barve iz shared/base.css, kontrast vsaj 4,5 : 1,
//     »Ekstrem« ≠ »Presega tehnike«; posnetek vrstice značk znacke-tezavnosti.png (dvojna ločljivost).
//
//   node tools/preveri-faza7-brskalnik.js [--mapa <mapa>] [--korak 2|3|4|5] [--izhodisce <commit>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { zazeni } = require('./brskalnik.js');
const { loadContext, loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const arg = (ime, privzeto) => (args.includes(ime) ? args[args.indexOf(ime) + 1] : privzeto);
const mapa = arg('--mapa', path.join(os.tmpdir(), 'sudoku-preveri-faza7'));
const korak = arg('--korak', null);
const izhodisce = arg('--izhodisce', '2fdb542');
const KOREN = path.join(__dirname, '..');

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

// Uganke s 0 in 2 rešitvama ter uganka za 'unknown' (kot v tests/igra-ui.test.js).
function uganke() {
  const { run } = loadContext(['shared/engine.js']);
  const vse = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'));
  const danosti = vse[0];
  const st = d => run(`countSolutions(${JSON.stringify(d)})`);
  let vec = danosti;
  for (let i = 0; i < 81 && st(vec) === 1; i++) if (vec[i] !== '0') vec = vec.slice(0, i) + '0' + vec.slice(i + 1);
  const resitev = run(`solutionOf(${JSON.stringify(danosti)})`);
  const b = run(`new Board(${JSON.stringify(danosti)})`);
  const c = [...danosti].findIndex((ch, i) => ch === '0' && (b.cand[i] & ~(1 << Number(resitev[i])) & 0x3fe));
  const dd = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => x !== Number(resitev[c]) && (b.cand[c] & (1 << x)));
  const brez = danosti.slice(0, c) + dd + danosti.slice(c + 1);
  const neznana = vse.slice(1).find(d => st(d) === 1);
  if (st(brez) !== 0 || st(vec) !== 2) throw new Error('uganki brez rešitve in z več rešitvami nista taki');
  return { 0: brez, 2: vec, unknown: neznana };
}
const U = uganke();
const OCENA = {
  0: 'ocena: Težka → Brez rešitve · nima rešitve',
  2: 'ocena: Težka → Več rešitev · ima več kot eno rešitev',
  unknown: 'ocena: brez sprememb · enoličnosti ni bilo mogoče preveriti v razumnem času',
};

const NADOMESTNI = `(() => { const prava = countSolutions;
  countSolutions = (g, ...r) => g === ${JSON.stringify(U.unknown)} ? 'unknown' : prava(g, ...r);
  window.Worker = function () { throw new Error('brez delavca'); }; })()`;

// Element je v svojem vsebniku, stran in vsebnik brez vodoravnega preliva.
const meritev = (izbirnik, vsebnik) => `(() => {
  const el = document.querySelector(${JSON.stringify(izbirnik)});
  const v = el.closest(${JSON.stringify(vsebnik)});
  const r = el.getBoundingClientRect(), k = v.getBoundingClientRect();
  const panel = el.closest('.dialog-panel');
  const vrstica = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.2;
  return {
    vVsebniku: r.left >= k.left - 0.5 && r.right <= k.right + 0.5,
    elPreliv: el.scrollWidth - el.clientWidth,
    vrstic: Math.round(r.height / vrstica),
    stran: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panel: panel ? panel.scrollWidth - panel.clientWidth : 0,
    okno: innerWidth,
  };
})()`;

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px – vrstica ocene (D1)`);
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: true });
  await b.izvedi('localStorage.clear()');
  await b.odpri('igra/index.html', { sirina, visina: 800, mobilno: true });
  await b.izvedi(NADOMESTNI);
  const md = Object.values(U).map(d => [`- **Danosti:** \`${d.replace(/0/g, '.')}\``,
    '- **Težavnost:** Težka', '- **Dodano:** 2026-09-20 10:00'].join('\n')).join('\n\n');
  const p = await b.izvedi(`zbirkaUvozi(${JSON.stringify(md)})`);
  preveri('uvoz treh ugank', !p.napaka && (await b.izvedi('zbirkaBeri().length')) === 3, p);
  await b.klikni('#zbirkaBtn');
  await b.klikni('#oceniBtn');
  await b.cakaj('!ocenjevanje && document.querySelectorAll(".zb-ocena").length === 3', 20000);
  for (const [primer, d] of Object.entries(U)) {
    const id = `ocena-${primer}`;
    const besedilo = await b.izvedi(`(() => { const li = zbirkaVrstice.get(${JSON.stringify(d)});
      const el = li.querySelector('.zb-ocena'); el.id = '${id}'; return el.textContent; })()`);
    preveri(`besedilo vrstice ocene (${primer})`, besedilo === OCENA[primer], besedilo);
    const m = await b.izvedi(meritev(`#${id}`, 'li'));
    preveri(`vrstica ocene v kartici uganke, brez preliva (${primer}, ${m.vrstic} ${m.vrstic === 1 ? 'vrstica' : 'vrstice'})`,
      m.vVsebniku && m.elPreliv <= 0 && m.stran <= 0 && m.panel <= 0, m);
    if (primer === 'unknown') preveri('najdaljše besedilo se prelomi', m.vrstic >= 2, m);
  }
  await b.izvedi(`document.getElementById('ocena-unknown').scrollIntoView({ block: 'center' })`);
  await b.posnetek(path.join(mapa, `ocena-${sirina}.png`), { vsaStran: false });
  await b.klikni('#zbirkaDialog [data-zapri]');

  console.log(`Igra, ${sirina} px – »Začni igro«`);
  for (const [primer, d] of Object.entries(U)) {
    await b.klikni('#novaBtn');
    await b.fokus('#novaNiz');
    await b.vtipkaj(d.replace(/0/g, '.'));
    await b.klikni('#novaZacni');
    await b.cakaj(`document.getElementById('novaStatus').textContent.startsWith('Te uganke')`, 10000);
    const s = await b.izvedi(`document.getElementById('novaStatus').textContent`);
    preveri(`sporočilo (${primer})`, s.startsWith('Te uganke ni mogoče igrati: '), s);
    const m = await b.izvedi(meritev('#novaStatus', '.dialog-panel'));
    preveri(`sporočilo v oknu, brez preliva (${primer}, ${m.vrstic} vrstic)`,
      m.vVsebniku && m.elPreliv <= 0 && m.stran <= 0 && m.panel <= 0, m);
    if (primer === 'unknown') {
      await b.izvedi(`document.getElementById('novaStatus').scrollIntoView({ block: 'center' })`);
      await b.posnetek(path.join(mapa, `nova-${sirina}.png`), { vsaStran: false });
    }
    await b.klikni('#novaDialog [data-zapri]');
  }
  preveri('brez napak JS', b.napake.length === 0, b.napake);
}

/* ---------- korak 3: izvoz in uvoz ---------- */

const VSE = loadPuzzles().map(p => p.danosti.replace(/\./g, '0'));
const IZVOZ = [
  { danosti: VSE[0], tezavnost: 'Težka', izvor: 'rocno', dodano: '2026-09-21 16:33', opomba: '' },
  { danosti: VSE[1], tezavnost: 'Lahka', izvor: 'generator', dodano: '2026-09-22 10:05', opomba: 'druga' },
];
const APP = {
  'reševalec': { stran: 'app/index.html', zbirka: '#libraryBtn', izvozi: '#libExport', uvozi: '#libImport', datoteka: 'libFile',
    status: 'libStatus', seznam: 'libList', izbrisiVse: '#libDeleteAll', zapri: '#libClose' },
  igra: { stran: 'igra/index.html', zbirka: '#zbirkaBtn', izvozi: '#zbirkaIzvoziBtn', uvozi: '#zbirkaUvoziBtn', datoteka: 'zbirkaDatoteka',
    status: 'zbirkaStatus', seznam: 'zbirkaSeznam', izbrisiVse: '#zbirkaIzbrisiVseBtn', zapri: '#zbirkaDialog [data-zapri]' },
};

// Datoteka v obliki izvoza (zbirkaVMarkdown iz shared/zbirka.js v Node).
function markdown(zapisi) {
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js']);
  return run(`zbirkaVMarkdown(${JSON.stringify(zapisi)})`);
}

// Izvozi, izbriše vse in uvozi v aplikaciji; vrne opažanja [korak, vrednost] za primerjavo z
// izhodiščem. `oznaka` loči imena datotek in posnetkov.
async function izvozUvoz(b, app, sirina, oznaka) {
  const a = APP[app];
  const opazeno = [];
  const zapisi = (ime, vrednost) => { opazeno.push([ime, vrednost]); return vrednost; };
  const stanje = () => b.izvedi(`(() => {
    const st = document.getElementById('${a.status}');
    const polje = document.getElementById('${a.datoteka}');
    return { status: st.textContent, napaka: st.classList.contains('err'),
      kartic: [...document.getElementById('${a.seznam}').children].filter(li => li.className !== 'prazno').length,
      gumb: document.querySelector('${a.zbirka}').textContent, polje: polje.value };
  })()`);
  const uvozi = async (pot, ime) => {
    await b.izvedi(`document.getElementById('${a.status}').textContent = ''`);
    await b.izberiDatoteko(a.uvozi, [pot]);
    await b.cakaj(`document.getElementById('${a.status}').textContent !== ''`, 10000);
    return zapisi(ime, await stanje());
  };

  await b.odpri(a.stran, { sirina, visina: 800, mobilno: sirina < 600 });
  await b.izvedi('localStorage.clear()');
  await b.izvedi(`localStorage.setItem('sudoku.zbirka.v1', ${JSON.stringify(JSON.stringify(IZVOZ))})`);
  await b.odpri(a.stran, { sirina, visina: 800, mobilno: sirina < 600 });
  // »Izbriši vse« vpraša s pravim oknom confirm() - potrdi ga DevTools (poslušalec enkrat na brskalnik).
  if (!b.vprasanja) {
    b.vprasanja = [];
    b.cdp.naDogodek(s => {
      if (s.method !== 'Page.javascriptDialogOpening') return;
      b.vprasanja.push(s.params.message);
      b.cdp.poslji('Page.handleJavaScriptDialog', { accept: true });
    });
  }
  const vprasanja = b.vprasanja;
  vprasanja.length = 0;

  await b.klikni(a.zbirka);
  const p = await b.prenos(a.izvozi);
  const izvoz = await b.izvedi('zbirkaIzvozi().besedilo');
  zapisi('ime prenesene datoteke', p.ime);
  zapisi('prenesena datoteka = zbirkaIzvozi()', p.besedilo === izvoz);
  preveri('izvoz: datoteka zbirka-ugank.md z besedilom zbirkaIzvozi()', p.ime === 'zbirka-ugank.md' && p.besedilo === izvoz, p.ime);
  const poIzvozu = zapisi('po izvozu', await stanje());
  preveri('izvoz: sporočilo', poIzvozu.status === 'Izvoženih ugank: 2 (datoteka zbirka-ugank.md).' && !poIzvozu.napaka, poIzvozu);

  await b.klikni(a.izbrisiVse);
  await b.cakaj('zbirkaBeri().length === 0', 5000);
  const poBrisanju = zapisi('po »Izbriši vse«', await stanje());
  zapisi('vprašanj', vprasanja.length);
  preveri('»Izbriši vse«: vpraša, zbirka prazna, števec 0', vprasanja.length === 1 && poBrisanju.kartic === 0 && poBrisanju.gumb === 'Zbirka (0)', { vprasanja, poBrisanju });

  const prvi = await uvozi(p.pot, 'po uvozu');
  preveri('uvoz: sporočilo', prvi.status === 'Uvoz končan – novih: 2 · dopolnjenih: 0 · že obstoječih brez sprememb: 0.' && !prvi.napaka, prvi);
  preveri('uvoz: seznam (2 kartici), števec, prazna vrednost polja', prvi.kartic === 2 && prvi.gumb === 'Zbirka (2)' && prvi.polje === '', prvi);
  preveri('uvoz: zbirka je enaka zbirki pred izvozom', zapisi('izvoz po uvozu = izvoz pred njim', (await b.izvedi('zbirkaIzvozi().besedilo')) === izvoz));
  const drugi = await uvozi(p.pot, 'ista datoteka znova');
  preveri('ista datoteka znova: sporočilo', drugi.status === 'Uvoz končan – novih: 0 · dopolnjenih: 0 · že obstoječih brez sprememb: 2.' && drugi.polje === '', drugi);
  await b.posnetek(path.join(mapa, `uvoz-${app === 'igra' ? 'igra' : 'resevalec'}-${sirina}${oznaka}.png`), { vsaStran: false });

  // Uvoz, ki dopolni odprto uganko (opomba), osveži njen prikaz.
  const opomba = path.join(mapa, `opomba${oznaka}.md`);
  fs.writeFileSync(opomba, markdown([{ ...IZVOZ[0], opomba: 'iz datoteke' }]));
  const D = JSON.stringify(VSE[0]);
  await b.izvedi(`(() => { const li = [...document.querySelectorAll('#${a.seznam} > li')]
    .find(li => li.textContent.includes('16:33')); li.querySelector('.zb-gumbi button').id = 'odpriA'; })()`);
  await b.klikni('#odpriA');
  if (app === 'igra') {
    await b.cakaj(`igra && igra.danosti === ${D}`, 5000);
  } else {
    await b.klikni('#solveBtn');
    await b.cakaj(`document.getElementById('saveMsg').textContent === '✓ Shranjeno v zbirko'`, 10000);
  }
  await b.klikni(a.zbirka);
  const tretji = await uvozi(opomba, 'uvoz opombe');
  preveri('uvoz opombe: »dopolnjenih: 1«', tretji.status === 'Uvoz končan – novih: 0 · dopolnjenih: 1 · že obstoječih brez sprememb: 0.', tretji);
  const prikaz = zapisi('prikaz odprte uganke', app === 'igra'
    ? await b.izvedi(`[...document.querySelectorAll('#opisUganke .opis-opomba')].map(el => el.textContent).join('|')`)
    : await b.izvedi(`document.getElementById('saveNote').value`));
  preveri(`uvoz opombe osveži ${app === 'igra' ? 'kartico »Uganka«' : 'vrstico »Shranjeno v zbirko«'}`, prikaz === 'iz datoteke', prikaz);

  const prazna = path.join(mapa, `prazna${oznaka}.md`);
  fs.writeFileSync(prazna, '# Nekaj\n\nbrez ugank\n');
  const cetrti = await uvozi(prazna, 'datoteka brez ugank');
  preveri('datoteka brez ugank: sporočilo z napako, zbirka ostane', cetrti.napaka && cetrti.status.startsWith('V datoteki ni nobene uganke') && cetrti.kartic === 2, cetrti);
  await b.klikni(a.zapri);
  return opazeno;
}

async function korak3(b) {
  const opazanja = {};
  for (const app of Object.keys(APP)) for (const s of [375, 1280]) {
    console.log(`${app[0].toUpperCase() + app.slice(1)}, ${s} px – izvoz in uvoz (6.5)`);
    opazanja[`${app} ${s}`] = await izvozUvoz(b, app, s, '');
  }
  preveri('brez napak JS', b.napake.length === 0, b.napake);

  // Isti scenarij na izhodišču (njegova preverjanja se izpišejo in štejejo), nato primerjava opažanj.
  console.log(`Izhodišče ${izhodisce} – isti scenarij`);
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  const bStar = await zazeni({ koren: star });
  try {
    const stara = {};
    for (const app of Object.keys(APP)) for (const s of [375, 1280]) stara[`${app} ${s}`] = await izvozUvoz(bStar, app, s, '-izhodisce');
    console.log(`Primerjava z izhodiščem ${izhodisce}`);
    for (const [k, staro] of Object.entries(stara)) {
      const novo = opazanja[k];
      const razlike = staro.map(([ime, v], i) => [ime, v, novo[i] && novo[i][1]])
        .filter(([, v, n]) => JSON.stringify(v) !== JSON.stringify(n));
      preveri(`${k} px: obnašanje enako izhodišču (${staro.length} opažanj)`, razlike.length === 0 && staro.length === novo.length, razlike);
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
}

/* ---------- korak 4: okno zbirke v reševalcu na skupnih razredih .dialog ---------- */

// Izvleček izhodišča (git archive) v začasno mapo; vrne pot.
function izvleciIzhodisce() {
  const star = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-izhodisce-'));
  execFileSync('git', ['archive', '--format=tar', '-o', path.join(star, 'izhodisce.tar'), izhodisce], { cwd: KOREN });
  execFileSync('tar', ['-xf', 'izhodisce.tar'], { cwd: star }); // relativno ime: GNU tar bi "C:" bral kot strežnik
  return star;
}

// Visoko okno, da je ves panel na posnetku (okno s fiksnim položajem posnetek vse strani prereže).
const VISINA4 = 1600;
// Odločitev O2 na izhodišču: z njo mora biti okno izhodišča enako novemu do piksla.
const O2 = '.lib-header{ margin-bottom:10px; }';

// Odprto okno zbirke z dvema ugankama in zelenim statusom (pravi klik na »Zbirka« in »Izvozi«):
// posnetek (base64), drevo, izračunani slogi (vse lastnosti) in položaji vseh elementov okna.
// `slog` se doda v stran pred odprtjem (O2 na izhodišču).
async function oknoZbirke(b, sirina, ime, slog = '') {
  await b.odpri('app/index.html', { sirina, visina: VISINA4, mobilno: sirina < 600 });
  await b.izvedi('localStorage.clear()');
  await b.izvedi(`localStorage.setItem('sudoku.zbirka.v1', ${JSON.stringify(JSON.stringify(IZVOZ))})`);
  await b.odpri('app/index.html', { sirina, visina: VISINA4, mobilno: sirina < 600 });
  if (slog) await b.izvedi(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(slog)}; document.head.appendChild(s); return true; })()`);
  await b.klikni('#libraryBtn');
  await b.prenos('#libExport');
  await b.cakaj(`document.getElementById('libStatus').textContent !== ''`, 5000);
  // Miška stran od gumbov (:hover), brez fokusa.
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await b.izvedi(`(document.activeElement && document.activeElement.blur && document.activeElement.blur(), new Promise(r => setTimeout(() => r(true), 300)))`);
  const podatki = await b.izvedi(`(() => {
    const okno = document.getElementById('library');
    const vsi = [okno, ...okno.querySelectorAll('*')];
    // -webkit-tap-highlight-color ne nastavi noben slog aplikacije; privzeta vrednost brskalnika je
    // odvisna od prejšnjega posnemanja telefona v istem brskalniku (koraka 2 in 3 tečeta samo v novem).
    const slog = e => { const s = getComputedStyle(e); return [...s].filter(p => p !== '-webkit-tap-highlight-color').sort().map(p => p + ':' + s.getPropertyValue(p)); };
    const pol = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 100) / 100); };
    // Razredi izhodišča → novi; razreda okna in ✕ (dialog, dialog-zapri) ter "odprt" so novi
    // (odpiranje z razredom) - v drevesu se ne primerjajo.
    const preimenuj = { 'lib-panel': 'dialog-panel', 'lib-header': 'dialog-glava' };
    const razredi = e => String(e.className).split(' ').map(c => preimenuj[c] || c)
      .filter(c => c && !['dialog', 'dialog-zapri', 'odprt'].includes(c)).sort().join('.');
    const glava = okno.querySelector('.lib-header, .dialog-glava').getBoundingClientRect();
    return {
      drevo: vsi.map(e => e.tagName + '#' + e.id + '.' + razredi(e)),
      slogi: vsi.map(slog), polozaji: vsi.map(pol),
      podGlavo: vsi.map(e => e.getBoundingClientRect().top >= glava.bottom - 0.5),
      inline: okno.getAttribute('style'),
      status: document.getElementById('libStatus').textContent,
      kartic: document.getElementById('libList').children.length,
    };
  })()`);
  const png = (await b.cdp.poslji('Page.captureScreenshot', { format: 'png' })).data;
  fs.writeFileSync(path.join(mapa, `okno-zbirke-${sirina}${ime}.png`), Buffer.from(png, 'base64'));
  return { ...podatki, png };
}

// Razlike slogov po elementih: "element lastnost:staro → novo".
function razlikeSlogov(st, n) {
  const raz = [];
  st.slogi.forEach((a, i) => {
    const bb = n.slogi[i] || [];
    for (const x of a) if (!bb.includes(x)) {
      const p = x.split(':')[0];
      raz.push(`${st.drevo[i]} ${x} → ${(bb.find(y => y.startsWith(p + ':')) || '').slice(p.length + 1)}`);
    }
  });
  return raz;
}

// Različni piksli med posnetkoma (v brskalniku, OffscreenCanvas). `vogal` = [x, y] zgornjega levega
// vogala panela: glajenje zaobljenega vogala (polmer 10 px) se med dvema zagonoma brskalnika
// razlikuje za 1-2 v kanalu tudi pri isti kodi (preizkušeno: nova koda v dveh zagonih pri
// 375 px, izhodišče z O2 v dveh zagonih pri 1280 px). `zunaj` = različni piksli zunaj kvadrata
// 10 × 10 px v tem vogalu ali z razliko nad 2.
async function razlicnihPikslov(b, a, c, vogal) {
  return b.izvedi(`(async () => {
    const slika = async b64 => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const [s, n] = await Promise.all([${JSON.stringify(a)}, ${JSON.stringify(c)}].map(slika));
    if (s.width !== n.width || s.height !== n.height) return { mere: [s.width, s.height, n.width, n.height] };
    const [vx, vy] = ${JSON.stringify(vogal)};
    let razlicnih = 0, zunaj = 0, najvec = 0; const vrstice = new Set();
    for (let k = 0; k < s.data.length; k += 4) {
      const r = Math.max(Math.abs(s.data[k] - n.data[k]), Math.abs(s.data[k + 1] - n.data[k + 1]), Math.abs(s.data[k + 2] - n.data[k + 2]));
      if (!r) continue;
      const x = (k / 4) % s.width, y = Math.floor(k / 4 / s.width);
      razlicnih++; vrstice.add(y); najvec = Math.max(najvec, r);
      if (r > 2 || x < vx || x >= vx + 10 || y < vy || y >= vy + 10) zunaj++;
    }
    const v = [...vrstice];
    return { razlicnih, zunaj, najvec, vrstic: v.length, od: v.length ? Math.min(...v) : null, do: v.length ? Math.max(...v) : null };
  })()`);
}

// Obnašanje okna (pravi kliki in tipke): ✕, klik ob panelu, Escape, Escape pri povečanem prikazu,
// Pomoč. Vrne opažanja [korak, { zbirka, povecava, pomoc }] za primerjavo z izhodiščem.
async function obnasanjeOkna(b, sirina) {
  const opazeno = [];
  const zapisi = async ime => { opazeno.push([ime, await b.izvedi(`(() => {
    const vidno = id => getComputedStyle(document.getElementById(id)).display !== 'none';
    return { zbirka: vidno('library'), povecava: vidno('lightbox'), pomoc: vidno('pomocDialog') }; })()`)]); };
  const klikObPanelu = async () => {
    for (const type of ['mousePressed', 'mouseReleased']) await b.cdp.poslji('Input.dispatchMouseEvent', { type, x: 4, y: 4, button: 'left', clickCount: 1 });
  };
  await b.odpri('app/index.html', { sirina, visina: 800, mobilno: sirina < 600 });
  await b.izvedi('localStorage.clear()');
  await b.izvedi(`localStorage.setItem('sudoku.zbirka.v1', ${JSON.stringify(JSON.stringify(IZVOZ))})`);
  await b.odpri('app/index.html', { sirina, visina: 800, mobilno: sirina < 600 });

  await zapisi('ob zagonu');
  await b.klikni('#libraryBtn'); await zapisi('»Zbirka«');
  await b.klikni('#libList .zb-vrstica'); await zapisi('klik v panelu');
  await b.klikni('#libClose'); await zapisi('✕');
  await b.klikni('#libraryBtn'); await klikObPanelu(); await zapisi('klik ob panelu');
  await b.klikni('#libraryBtn'); await b.tipka('Escape'); await zapisi('Escape');
  await b.tipka('Escape'); await zapisi('Escape pri zaprtem oknu');

  // Povečan prikaz rešitve odprt, zbirka odprta s klikom v strani (gumb je pod povečavo):
  // Escape zapre samo zbirko.
  await b.izvedi(`naloziDanosti(${JSON.stringify(VSE[0])}, ''), true`);
  await b.klikni('#solveBtn');
  await b.cakaj(`document.querySelectorAll('#solvedGrid > *').length > 0`, 10000);
  await b.klikni('#solvedGrid');
  await b.izvedi(`document.getElementById('libraryBtn').click(), true`);
  await zapisi('povečava in zbirka');
  await b.tipka('Escape'); await zapisi('Escape (povečava in zbirka)');
  await b.klikni('#lightboxClose'); await zapisi('✕ povečave');

  // Pomoč: pravi klik, Escape, ✕, klik ob panelu.
  await b.klikni('#pomocBtn'); await zapisi('»Pomoč«');
  await b.tipka('Escape'); await zapisi('Escape (Pomoč)');
  await b.klikni('#pomocBtn'); await b.klikni('#pomocDialog [data-zapri]'); await zapisi('✕ Pomoči');
  await b.klikni('#pomocBtn'); await klikObPanelu(); await zapisi('klik ob panelu Pomoči');
  return opazeno;
}

// [zbirka, povečava, Pomoč] odprta (1) ali zaprta (0).
const PRICAKOVANO4 = {
  'ob zagonu': [0, 0, 0], '»Zbirka«': [1, 0, 0], 'klik v panelu': [1, 0, 0], '✕': [0, 0, 0], 'klik ob panelu': [0, 0, 0],
  'Escape': [0, 0, 0], 'Escape pri zaprtem oknu': [0, 0, 0], 'povečava in zbirka': [1, 1, 0], 'Escape (povečava in zbirka)': [0, 1, 0],
  '✕ povečave': [0, 0, 0], '»Pomoč«': [0, 0, 1], 'Escape (Pomoč)': [0, 0, 0], '✕ Pomoči': [0, 0, 0], 'klik ob panelu Pomoči': [0, 0, 0],
};
// Lastnosti, ki sledijo višini panela (2 px nižji zaradi O2).
const VISINA_PANELA = ['block-size', 'height', 'perspective-origin', 'transform-origin'];

async function korak4(b) {
  const sirine = [320, 375, 1280];
  const nova = {}, obn = {};
  for (const s of sirine) {
    console.log(`Reševalec, ${s} px – okno zbirke (6.8)`);
    nova[s] = await oknoZbirke(b, s, '');
    preveri('okno brez sloga v atributu style', nova[s].inline === null, nova[s].inline);
    preveri('okno ima dve uganki in zeleni status', nova[s].kartic === 2 && nova[s].status.startsWith('Izvoženih ugank: 2'), [nova[s].kartic, nova[s].status]);
    obn[s] = await obnasanjeOkna(b, s);
    for (const [ime, v] of obn[s]) {
      const p = PRICAKOVANO4[ime], d = [v.zbirka, v.povecava, v.pomoc].map(Number);
      preveri(`${ime}: zbirka ${p[0] ? 'odprta' : 'zaprta'}, povečava ${p[1] ? 'odprta' : 'zaprta'}, Pomoč ${p[2] ? 'odprta' : 'zaprta'}`,
        JSON.stringify(d) === JSON.stringify(p), v);
    }
  }
  preveri('brez napak JS', b.napake.length === 0, b.napake);

  console.log(`Izhodišče ${izhodisce} – okno zbirke in obnašanje`);
  const star = izvleciIzhodisce();
  const bStar = await zazeni({ koren: star });
  try {
    for (const s of sirine) {
      const n = nova[s];
      const st = await oknoZbirke(bStar, s, '-izhodisce');
      const stO2 = await oknoZbirke(bStar, s, '-izhodisce-O2', O2);
      console.log(`Primerjava z izhodiščem ${izhodisce}, ${s} px`);
      const drevo = d => d.drevo.map((x, i) => (x !== n.drevo[i] ? `${x} → ${n.drevo[i]}` : null)).filter(Boolean);
      preveri(`drevo elementov okna enako (${n.drevo.length}; lib-panel/lib-header → dialog-panel/dialog-glava)`,
        n.drevo.length === st.drevo.length && drevo(st).length === 0, drevo(st));

      // 1. Izhodišče z O2 = novo: vse lastnosti vseh elementov, položaji, vsak piksel.
      const rO2 = razlikeSlogov(stO2, n);
      preveri(`izhodišče z O2: izračunani slogi enaki (${n.slogi.length} elementov, vse lastnosti)`, rO2.length === 0, rO2.slice(0, 8));
      const pO2 = stO2.polozaji.map((a, i) => (JSON.stringify(a) !== JSON.stringify(n.polozaji[i]) ? `${n.drevo[i]} ${a} → ${n.polozaji[i]}` : null)).filter(Boolean);
      preveri('izhodišče z O2: položaji enaki', pO2.length === 0, pO2.slice(0, 8));
      const vogal = n.polozaji[1].slice(0, 2).map(Math.floor); // panel
      const pikO2 = await razlicnihPikslov(b, stO2.png, n.png, vogal);
      preveri(`izhodišče z O2: posnetek enak do piksla${pikO2.razlicnih ? ` (razen ${pikO2.razlicnih} v zaobljenem vogalu panela, največ ${pikO2.najvec} – glajenje niha med zagoni brskalnika)` : ''}`,
        pikO2.zunaj === 0, pikO2);

      // 2. Izhodišče brez O2: razlika je samo odmik pod glavo in to, kar iz njega sledi.
      const r = razlikeSlogov(st, n);
      const izGlave = x => /^DIV#\.dialog-glava margin-(bottom|block-end):12px → 10px$/.test(x);
      const izPanela = x => x.startsWith('DIV#.dialog-panel ') && VISINA_PANELA.includes(x.split(' ')[1].split(':')[0]);
      preveri('izhodišče: slogi – samo margin-bottom glave 12 → 10 px (in višina panela, ki iz njega sledi)',
        r.some(izGlave) && r.every(x => izGlave(x) || izPanela(x)), r.filter(x => !izGlave(x) && !izPanela(x)).slice(0, 8));
      const pol = st.polozaji.map((a, i) => {
        const bb = n.polozaji[i], dy = st.podGlavo[i] ? -2 : 0, dh = i === 1 ? -2 : 0;
        const ok = Math.abs(bb[0] - a[0]) < 0.05 && Math.abs(bb[1] - (a[1] + dy)) < 0.05 && Math.abs(bb[2] - a[2]) < 0.05 && Math.abs(bb[3] - (a[3] + dh)) < 0.05;
        return ok ? null : `${n.drevo[i]} ${a} → ${bb}`;
      }).filter(Boolean);
      preveri('izhodišče: položaji nad glavo in glava enaki, pod njo 2 px višje, panel 2 px nižji', pol.length === 0, pol.slice(0, 8));
      const pik = await razlicnihPikslov(b, st.png, n.png, vogal);
      console.log(`    (izhodišče brez O2: različnih pikslov ${pik.razlicnih} v ${pik.vrstic} vrsticah, ${pik.od}–${pik.do})`);

      const obStar = await obnasanjeOkna(bStar, s);
      preveri(`obnašanje (zbirka, povečava, Pomoč – ${obStar.length} opažanj) enako izhodišču`,
        JSON.stringify(obStar) === JSON.stringify(obn[s]), obStar.filter((o, i) => JSON.stringify(o) !== JSON.stringify(obn[s][i])));
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
}

/* ---------- korak 5: raven kot podatek tehnike (1.1) ---------- */

// Izračunan slog elementa (vse lastnosti) kot niz - za primerjavo z izhodiščem.
const SLOG = `el => { const cs = getComputedStyle(el); const o = {};
  for (let i = 0; i < cs.length; i++) o[cs[i]] = cs.getPropertyValue(cs[i]); return o; }`;
const POMOC5 = [
  { ime: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog' },
  { ime: 'reševalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
  { ime: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
];

// Opažanja ene različice (nova ali izhodišče) pri dani širini: značke na karticah treninga (vrstni
// red, razred, besedilo, slog), značke ravni v oknu Pomoč vseh treh aplikacij (pravi klik na
// gumb) in oznake korakov v reševalcu po »Reši« na primerih P_14 (dve napredni) in P_15 (poskus).
async function znacke(b, sirina) {
  const o = { sirina };
  const pocakajPisave = () => b.cakaj('document.fonts.status === "loaded"', 5000);
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await pocakajPisave();
  o.trening = await b.izvedi(`[...document.querySelectorAll('#menu .menu-card')].map(k => { const z = k.querySelector('.badge');
    return { mode: k.dataset.mode, razred: z.className, besedilo: z.textContent, slog: (${SLOG})(z) }; })`);
  o.pomoc = {};
  for (const a of POMOC5) {
    await b.odpri(a.stran, { sirina, visina: 900, mobilno: sirina < 500 });
    await pocakajPisave();
    await b.klikni(a.gumb);
    await b.cakaj(`!document.querySelector('${a.okno}').hidden`, 3000);
    o.pomoc[a.ime] = await b.izvedi(`[...document.querySelectorAll('${a.okno} .tehnika-raven')].map(z => ({
      razred: z.className, besedilo: z.textContent, slog: (${SLOG})(z) }))`);
  }
  o.koraki = {};
  for (const p of ['P_14', 'P_15']) {
    await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
    await pocakajPisave();
    await b.izvedi(`(() => { const s = document.getElementById('exampleSelect');
      s.value = [...s.options].find(x => x.textContent.startsWith('${p} ')).value; s.dispatchEvent(new Event('change')); })()`);
    await b.klikni('#solveBtn');
    await b.cakaj('document.querySelectorAll(".tag").length > 0', 10000);
    o.koraki[p] = await b.izvedi(`[...document.querySelectorAll('.tag')].map(z => ({ razred: z.className, besedilo: z.textContent,
      barva: getComputedStyle(z).color, podlaga: getComputedStyle(z).backgroundColor }))`);
  }
  return o;
}

// Barve iz :root v shared/base.css (#RRGGBB → »rgb(r, g, b)« kot getComputedStyle).
function barveIzBase() {
  const css = fs.readFileSync(path.join(KOREN, 'shared', 'base.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const o = {};
  for (const [, ime, h] of css.matchAll(/(--[\w-]+)\s*:\s*#([0-9a-f]{6})\s*;/gi)) {
    o[ime] = `rgb(${[0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ')})`;
  }
  return o;
}
function kontrastRgb(a, c) {
  const L = x => {
    const [r, g, bl] = x.match(/\d+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [L(a), L(c)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Značke težavnosti (prava zbirkaZnacka() in slogi reševalca) na beli podlagi in na kartici, oznaka
// koraka .tag.t-expert (reševalec) in .badge-ekspertna (kartica treninga): izračunan slog. Z `posnetek`
// še posnetek vrstice značk v dvojni ločljivosti.
async function znackeTezavnosti(b, sirina, posnetek) {
  await b.odpri('app/index.html', { sirina, visina: posnetek ? 165 : 900, mobilno: sirina < 500, skala: posnetek ? 2 : 1 });
  await b.cakaj('document.fonts.status === "loaded"', 5000);
  const o = await b.izvedi(`(() => {
    const plosca = document.createElement('div');
    plosca.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--paper);padding:16px;overflow:auto';
    const vrstica = (oznaka, v) => {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0 0 10px;font-size:13px;color:var(--ink2)';
      p.textContent = oznaka;
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center';
      for (const t of TEZAVNOSTI) r.append(zbirkaZnacka(t));
      v.append(p, r);
    };
    vrstica('Na beli podlagi (stran, moje uganke v seznamu zbirke)', plosca);
    const kartica = document.createElement('div');
    kartica.className = 'card';
    vrstica('Na podlagi kartice (kartica »Uganka«, vgrajeni primeri)', kartica);
    plosca.append(kartica);
    document.body.append(plosca);
    const slog = z => ({ besedilo: z.textContent, razred: z.className, barva: getComputedStyle(z).color,
      podlaga: getComputedStyle(z).backgroundColor });
    const raven = document.createElement('span');
    raven.className = 'tag t-expert';
    raven.textContent = '13 · XY-veriga';
    kartica.append(raven);
    const r = { znacke: [...plosca.querySelectorAll('.znacka-tezavnosti')].map(slog), raven: slog(raven) };
    raven.remove();
    return r;
  })()`);
  if (posnetek) await b.posnetek(posnetek, { vsaStran: false });
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  o.badge = await b.izvedi(`(() => { const z = document.createElement('span'); z.className = 'badge badge-ekspertna';
    z.textContent = 'EKSPERTNA'; document.querySelector('#menu .menu-card').append(z);
    const s = { barva: getComputedStyle(z).color, podlaga: getComputedStyle(z).backgroundColor }; z.remove(); return s; })()`);
  return o;
}

async function korak5(b) {
  const sirine = [375, 1280];
  const nova = {};
  const B = barveIzBase();
  const PRICAKOVANO = { 'Lahka': ['--green-ink', '--green-bg'], 'Srednja': ['--amber-ink', '--amber-bg'], 'Težka': ['--purple', '--purple-bg'],
    'Zelo težka': ['--purple-dark-ink', '--purple-dark'], 'Ekstrem': ['--turq-dark-ink', '--turq-dark'] };
  for (const s of [...sirine, 'posnetek']) {
    const z = await znackeTezavnosti(b, s === 'posnetek' ? 900 : s, s === 'posnetek' ? path.join(mapa, 'znacke-tezavnosti.png') : null);
    console.log(`Značke težavnosti in ekspertne ravni, ${s === 'posnetek' ? '900 px, posnetek' : `${s} px`} (XY-veriga, korak 2)`);
    preveri('16 značk (osem na beli, osem na kartici)', z.znacke.length === 16, z.znacke.map(x => x.besedilo));
    for (const x of z.znacke) {
      const [pis, pod] = PRICAKOVANO[x.besedilo] || ['--red', '--red-bg'];
      const k = kontrastRgb(x.barva, x.podlaga);
      preveri(`${x.besedilo}: pisava ${pis} na ${pod}, kontrast ${k.toFixed(2)} ≥ 4,5`, x.barva === B[pis] && x.podlaga === B[pod] && k >= 4.5,
        [x.barva, x.podlaga]);
    }
    const po = t => z.znacke.find(x => x.besedilo === t);
    preveri('»Ekstrem« ≠ »Presega tehnike«', po('Ekstrem').podlaga !== po('Presega tehnike').podlaga && po('Ekstrem').barva !== po('Presega tehnike').barva);
    preveri('»Zelo težka« ≠ »Težka«', po('Zelo težka').podlaga !== po('Težka').podlaga);
    for (const [ime, x] of [['oznaka koraka .tag.t-expert', z.raven], ['značka .badge-ekspertna (trening)', z.badge]]) {
      const k = kontrastRgb(x.barva, x.podlaga);
      preveri(`${ime}: pisava --turq na --turq-bg, kontrast ${k.toFixed(2)} ≥ 4,5`, x.barva === B['--turq'] && x.podlaga === B['--turq-bg'] && k >= 4.5,
        [x.barva, x.podlaga]);
    }
  }
  for (const s of sirine) {
    console.log(`Značke ravni, ${s} px (1.1)`);
    const n = nova[s] = await znacke(b, s);
    const ravni = n.trening.map(k => k.besedilo).join(' ');
    preveri('trening: 14 kartic, značke LAHKA ×2, SREDNJA ×6, NAPREDNA ×6 v vrstnem redu kartic',
      ravni === ['LAHKA', 'LAHKA', ...Array(6).fill('SREDNJA'), ...Array(6).fill('NAPREDNA')].join(' '), ravni);
    preveri('trening: razred značke ustreza besedilu', n.trening.every(k => k.razred === `badge badge-${k.besedilo.toLowerCase()}`),
      n.trening.map(k => k.razred));
    for (const a of POMOC5) {
      const z = n.pomoc[a.ime].map(x => x.besedilo).join(' ');
      preveri(`Pomoč (${a.ime}): 14 značk lahka ×2, srednja ×6, napredna ×6`,
        z === ['lahka', 'lahka', ...Array(6).fill('srednja'), ...Array(6).fill('napredna')].join(' '), z);
    }
    for (const p of Object.keys(n.koraki)) preveri(`reševalec ${p}: oznake korakov (${n.koraki[p].length})`, n.koraki[p].length > 10);
  }
  preveri('brez napak JS', b.napake.length === 0, b.napake);

  console.log(`Izhodišče ${izhodisce} – značke in oznake korakov`);
  const star = izvleciIzhodisce();
  const bStar = await zazeni({ koren: star });
  try {
    for (const s of sirine) {
      const st = await znacke(bStar, s), n = nova[s];
      console.log(`Primerjava z izhodiščem ${izhodisce}, ${s} px`);
      // Dovoljena razlika (XY-veriga, korak 2): barva pisave lahke in srednje ravni - lastnosti z
      // »color« (tudi izpeljane iz currentColor) ali »barva«, natanko stara → nova vrednost.
      const BARVA_RAVNI = [[/t-single|badge-lahka/, 'rgb(46, 125, 92)', 'rgb(42, 115, 85)'],
        [/t-pair|badge-srednja/, 'rgb(156, 107, 18)', 'rgb(134, 92, 15)']];
      // Še nova »Zelo težka« (značka pod seznamom primerov v reševalcu pri P_14) in spremenljivki njenih
      // barv, ki ju vsak element podeduje iz :root.
      const ZELO_TEZKA = { '--purple-dark': ['#53307E', '#B494D1'], '--purple-dark-ink': ['#FFFFFF', '#2A1545'],
        podlaga: ['rgb(83, 48, 126)', 'rgb(180, 148, 209)'], barva: ['rgb(255, 255, 255)', 'rgb(42, 21, 69)'] };
      const dovoljeno = (x, l, st, nv) => ((l === 'barva' || l.includes('color'))
        && BARVA_RAVNI.some(([re, s, n]) => re.test(x.razred) && st === s && nv === n))
        || (l.startsWith('--') && ZELO_TEZKA[l] && ZELO_TEZKA[l][0] === st && ZELO_TEZKA[l][1] === nv)
        || (/znacka-zelo-tezka/.test(x.razred) && ZELO_TEZKA[l] && ZELO_TEZKA[l][0] === st && ZELO_TEZKA[l][1] === nv);
      const razlike = (a, c) => {
        const out = [];
        a.forEach((x, i) => {
          const y = c[i];
          if (!y) { out.push(`${i}: manjka`); return; }
          for (const k of Object.keys(x)) if (k !== 'slog' && x[k] !== y[k] && !dovoljeno(x, k, x[k], y[k])) out.push(`${i} ${k}: ${x[k]} → ${y[k]}`);
          if (x.slog) for (const l of Object.keys(x.slog)) if (x.slog[l] !== y.slog[l] && !dovoljeno(x, l, x.slog[l], y.slog[l])) out.push(`${i} ${l}: ${x.slog[l]} → ${y.slog[l]}`);
        });
        if (c.length !== a.length) out.push(`število ${a.length} → ${c.length}`);
        return out;
      };
      const rT = razlike(st.trening, n.trening);
      preveri(`trening: značke (vrstni red, razred, besedilo, vse lastnosti sloga) enake izhodišču razen pisave lahke in srednje`, rT.length === 0, rT.slice(0, 8));
      for (const a of POMOC5) {
        const r = razlike(st.pomoc[a.ime], n.pomoc[a.ime]);
        preveri(`Pomoč (${a.ime}): značke ravni (razred, besedilo, vse lastnosti sloga) enake izhodišču razen pisave lahke in srednje`, r.length === 0, r.slice(0, 8));
      }
      for (const p of Object.keys(n.koraki)) {
        const r = razlike(st.koraki[p], n.koraki[p]);
        preveri(`reševalec ${p}: oznake korakov (razred, besedilo, barva, podlaga) enake izhodišču razen pisave lahke in srednje`, r.length === 0, r.slice(0, 8));
      }
    }
    preveri('izhodišče brez napak JS', bStar.napake.length === 0, bStar.napake);
  } finally {
    await bStar.zapri();
    fs.rmSync(star, { recursive: true, force: true });
  }
}

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (!korak || korak === '2') for (const s of [320, 375]) await igra(b, s);
    if (!korak || korak === '3') await korak3(b);
    if (!korak || korak === '4') await korak4(b);
    if (!korak || korak === '5') await korak5(b);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
