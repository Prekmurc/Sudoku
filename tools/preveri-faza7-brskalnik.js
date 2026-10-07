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
//
//   node tools/preveri-faza7-brskalnik.js [--mapa <mapa>] [--korak 2|3] [--izhodisce <commit>]
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

(async () => {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    if (!korak || korak === '2') for (const s of [320, 375]) await igra(b, s);
    if (!korak || korak === '3') await korak3(b);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `Ne drži: ${napak}.` : 'Vse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
