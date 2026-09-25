'use strict';
// Posnetek DOM igre (igra/) za preverjanje, da se ob preureditvi kode (npr. izločitev
// mreže ali vnosa v shared/) igra obnaša popolnoma enako.
//
//   node tools/posnetek-igre.js --shrani <pot.json>     posnetek pred spremembo
//   node tools/posnetek-igre.js --primerjaj <pot.json>  po spremembi: izpiše razlike
//
// Igra se naloži v nadomestni DOM (tests/dom-stub.js) v vrstnem redu <script> iz
// igra/index.html (zato se sprememba nalagalnega seznama upošteva sama). Scenarij
// igra samo prek dogodkov, kot igralec: klik celice (tudi Ctrl+klik), gumbi nizov,
// tipkovnica, kljukice in stikala, Razveljavi/Ponovi/Zbriši/Začni znova, Naslednji
// korak in Preveri. Po vsakem koraku se zapiše drevo elementov plošče in stranskih
// kartic (razredi, besedilo, atributi, onemogočenost, skritost) in spremenljivke CSS
// na <html> (barve poudarka). Nadomestni DOM ne pozna CSS - videz je treba pogledati
// ročno.

const fs = require('node:fs');
const path = require('node:path');
const { loadContext, loadPuzzles } = require('../tests/load-engine.js');
const { makeDom, Element } = require('../tests/dom-stub.js');

// Tipkovnica (Ctrl+Z/Y) kliče el.click() - nadomestni DOM ga nima.
if (!Element.prototype.click) Element.prototype.click = function () { this.sprozi('click'); };

const KOREN = path.join(__dirname, '..');

// Skripte igre v vrstnem redu iz igra/index.html, poti od korena projekta.
function datotekeIgre() {
  const html = fs.readFileSync(path.join(KOREN, 'igra', 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map(m => path.posix.normalize(path.posix.join('igra', m[1])));
}

// Elementi, ki se posnamejo (po id).
const ELEMENTI = [
  'igraLayout', 'mreza', 'seznamVrstic', 'seznamStolpcev', 'seznamBlokov',
  'nizPoudari', 'nizVpisi', 'nizOdstrani', 'razlogNizov',
  'razveljaviBtn', 'ponoviBtn', 'zbrisiBtn', 'znovaBtn', 'stevecPotez',
  'korakBtn', 'preveriBtn', 'pomocVsebina', 'opisUganke', 'status',
  'vecHkrati', 'vecCelic', 'stikaloVrstice', 'stikaloStolpci', 'stikaloBloki',
];

function drevo(el) {
  if (!el || el.tagName === undefined) return { besedilo: el ? el.textContent : null };
  const o = { tag: el.tagName };
  if (el.className) o.razred = el.className;
  if (el.lastna) o.besedilo = el.lastna;
  if (el.html) o.html = el.html;
  if (el.hidden) o.skrit = true;
  if (el.disabled) o.onemogocen = true;
  if (el.checked) o.obkljukan = true;
  if (el.title) o.title = el.title;
  if (Object.keys(el.attrs).length) o.atributi = { ...el.attrs };
  if (Object.keys(el.dataset).length) o.data = { ...el.dataset };
  if (el.children.length) o.otroci = el.children.map(drevo);
  return o;
}

function posnemi(dom) {
  const o = {};
  for (const id of ELEMENTI) o[id] = drevo(dom.el(id));
  o.cssHtml = { ...dom.document.documentElement.style.vrednosti };
  return o;
}

const cakaj = ms => new Promise(r => setTimeout(r, ms));

async function scenarij() {
  const datoteke = datotekeIgre();
  const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
  const koraki = [];

  // Lastne barve poudarka (kot iz razdelka "Barve poudarka") že v shrambi.
  const shramba = new Map([['sudoku.igra.poud', JSON.stringify({ 1: '#FFAA00', 3: '#CC88FF' })]]);
  let dom = makeDom(shramba);
  let { run } = loadContext(datoteke, dom.globals);
  const zapisi = (ime) => koraki.push({ ime, posnetek: posnemi(dom) });

  const celica = i => dom.el('mreza').children[i];
  const klikCelice = (i, dogodek = {}) => celica(i).sprozi('click', dogodek);
  const niz = (id, d) => dom.el(id).children[d - 1].sprozi('click');
  const kljukica = (id, v) => { dom.el(id).checked = v; dom.el(id).sprozi('change'); };
  const tipka = (key, code, dodatno = {}) => dom.tipka({ key, code, ...dodatno });
  const gumbPomoci = napis => {
    const najdi = el => {
      if (!el.children) return null;
      for (const c of el.children) {
        if (c.tagName === 'BUTTON' && c.textContent === napis) return c;
        const g = najdi(c);
        if (g) return g;
      }
      return null;
    };
    const g = najdi(dom.el('pomocVsebina'));
    if (!g) throw new Error(`Gumba »${napis}« v pomoči ni.`);
    g.sprozi('click');
  };

  zapisi('zagon brez igre');
  klikCelice(10);
  zapisi('klik celice brez igre');

  run(`dodajVZbirko(${JSON.stringify(danosti)}, 'Težka', 'generator')`);
  run(`zacniIgro(${JSON.stringify(danosti)})`);
  zapisi('odprta uganka');

  const res = run('resitev()');
  const prazne = [...danosti].map((ch, i) => (ch === '0' ? i : -1)).filter(i => i >= 0);
  const dana = danosti.split('').findIndex(ch => ch !== '0');
  const [p0, p1, p2, p3] = prazne;

  klikCelice(p0);
  zapisi('izbrana prazna celica');
  klikCelice(dana);
  zapisi('izbrana dana celica');
  klikCelice(dana);
  zapisi('ponoven klik prekliče izbiro');
  klikCelice(p0);
  niz('nizVpisi', res[p0]);
  zapisi('vpis pravilne števke');
  tipka('ArrowRight', 'ArrowRight');
  zapisi('puščica od zadnje izbrane');
  tipka('ArrowDown', 'ArrowDown');
  zapisi('puščica dol');

  kljukica('stikaloVrstice', true);
  zapisi('seznam vrstic');
  kljukica('stikaloStolpci', true);
  kljukica('stikaloBloki', true);
  zapisi('vsi trije seznami');

  niz('nizPoudari', res[p1]);
  zapisi('poudarek ene števke');
  kljukica('vecHkrati', true);
  niz('nizPoudari', res[p2] === res[p1] ? (res[p1] % 9) + 1 : res[p2]);
  niz('nizPoudari', res[p0]);
  zapisi('več hkrati: tri števke');

  klikCelice(p1);
  const k1 = run(`stanje.kandidati[${p1}]`);
  const odstrani1 = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => (k1 & (1 << d)) && d !== res[p1]);
  niz('nizOdstrani', odstrani1);
  zapisi('odstranjen kandidat');
  niz('nizOdstrani', odstrani1);
  zapisi('kandidat vrnjen');
  tipka('!', `Digit${odstrani1}`, { shiftKey: true });
  zapisi('Shift+števka odstrani');

  kljukica('vecCelic', true);
  klikCelice(p2);
  klikCelice(p3);
  zapisi('več celic izbranih');
  const skupni = run(`skupniKandidati(stanje, izbrane)`);
  const sd = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => (skupni & (1 << d)) && d !== res[p2] && d !== res[p3]);
  if (sd) niz('nizOdstrani', sd);
  zapisi('odstranitev iz več celic');
  klikCelice(dana);
  zapisi('dana celica se ne doda');
  kljukica('vecCelic', false);
  zapisi('izklop več celic');
  klikCelice(p2, { ctrlKey: true });
  klikCelice(p3, { ctrlKey: true });
  zapisi('Ctrl+klik');
  tipka('Escape', 'Escape');
  zapisi('Escape');

  tipka('z', 'KeyZ', { ctrlKey: true });
  zapisi('Ctrl+Z');
  dom.klikni('razveljaviBtn');
  zapisi('Razveljavi');
  dom.klikni('ponoviBtn');
  tipka('y', 'KeyY', { ctrlKey: true });
  zapisi('Ponovi dvakrat');

  // Napačen vpis, Preveri, Vrni.
  // Celica z vsaj enim napačnim kandidatom.
  const kn = prazne.find(i => !run(`stanje.grid[${i}]`) && (run(`stanje.kandidati[${i}]`) & ~(1 << res[i]) & 0x3fe));
  klikCelice(kn);
  const napacna = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => d !== res[kn] && (run(`stanje.kandidati[${kn}]`) & (1 << d)));
  tipka(String(napacna), `Digit${napacna}`);
  zapisi('napačen vpis s tipkovnico');
  dom.klikni('korakBtn');
  zapisi('Naslednji korak ob napaki');
  dom.klikni('preveriBtn');
  zapisi('Preveri z napako');
  gumbPomoci(`Vrni na stanje pred potezo ${run('pomoc.vrniPred')}`);
  zapisi('Vrni pred napako');
  klikCelice(p0);
  tipka('Backspace', 'Backspace');
  zapisi('Zbriši vpis');
  dom.klikni('razveljaviBtn');
  zapisi('razveljavljen izbris vpisa');

  // Postopna pomoč brez poudarka in s poudarkom.
  kljukica('vecHkrati', false);
  zapisi('izklop več hkrati');
  niz('nizPoudari', run('zadnjaPoudarjena()'));
  zapisi('poudarek izklopljen');
  dom.klikni('korakBtn');
  await cakaj(60);
  zapisi('Naslednji korak: ime');
  dom.klikni('korakBtn');
  zapisi('Naslednji korak: namig');
  dom.klikni('korakBtn');
  zapisi('Naslednji korak: rešitev na mreži');
  const dejanja = run('dejanjaKoraka(pomoc.korak, stanje)');
  const prvo = dejanja[0];
  if (prvo) {
    klikCelice(prvo.celica);
    if (prvo.tip === 'vpis') niz('nizVpisi', prvo.stevka); else niz('nizOdstrani', prvo.stevka);
    zapisi('prvo dejanje koraka izvedeno');
  }
  gumbPomoci('Skrij');
  zapisi('Skrij');
  niz('nizPoudari', 5);
  dom.klikni('korakBtn');
  await cakaj(60);
  dom.klikni('korakBtn');
  dom.klikni('korakBtn');
  zapisi('korak s poudarjeno števko 5');
  dom.klikni('preveriBtn');
  zapisi('Preveri brez napake');

  // Osvežitev strani: seznami, barve in igra se obnovijo.
  dom = makeDom(dom.shramba);
  ({ run } = loadContext(datoteke, dom.globals));
  zapisi('osvežitev strani');

  // Rešitev do konca: mreža se zaklene.
  for (const i of prazne) {
    if (run(`stanje.grid[${i}]`)) continue;
    klikCelice(i);
    niz('nizVpisi', res[i]);
  }
  zapisi('rešena uganka');
  klikCelice(p1);
  zapisi('klik celice rešene uganke');
  dom.potrdi(false);
  dom.klikni('znovaBtn');
  zapisi('Začni znova - preklic');
  dom.potrdi(true);
  dom.klikni('znovaBtn');
  zapisi('Začni znova');
  kljukica('stikaloVrstice', false);
  kljukica('stikaloStolpci', false);
  kljukica('stikaloBloki', false);
  zapisi('seznami izklopljeni');
  return koraki;
}

// Datumi in ure (»25. 9. 2026 ob 21:26«) so odvisni od trenutka zagona - pri
// primerjavi se ne upoštevajo.
const brezCasa = v => (typeof v === 'string' ? v.replace(/\d{1,2}\. \d{1,2}\. \d{4} ob \d{1,2}:\d{2}/g, '<čas>') : v);

function primerjaj(a, b, pot, razlike) {
  if (razlike.length >= 40) return;
  a = brezCasa(a);
  b = brezCasa(b);
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    if (a !== b) razlike.push(`${pot}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
    return;
  }
  const kljuci = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of kljuci) primerjaj(a[k], b[k], `${pot}.${k}`, razlike);
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.findIndex(a => a === '--shrani' || a === '--primerjaj');
  if (i < 0 || !args[i + 1]) {
    console.error('Uporaba: node tools/posnetek-igre.js --shrani <pot.json> | --primerjaj <pot.json>');
    process.exit(2);
  }
  const pot = args[i + 1];
  const koraki = await scenarij();
  if (args[i] === '--shrani') {
    fs.writeFileSync(pot, JSON.stringify(koraki));
    console.log(`Shranjenih ${koraki.length} posnetkov v ${pot}.`);
    return;
  }
  const prej = JSON.parse(fs.readFileSync(pot, 'utf8'));
  let napak = 0;
  if (prej.length !== koraki.length) {
    console.log(`Število korakov: ${prej.length} → ${koraki.length}`);
    napak++;
  }
  for (let k = 0; k < Math.min(prej.length, koraki.length); k++) {
    const razlike = [];
    if (prej[k].ime !== koraki[k].ime) razlike.push(`ime: ${prej[k].ime} → ${koraki[k].ime}`);
    primerjaj(prej[k].posnetek, koraki[k].posnetek, '', razlike);
    if (razlike.length) {
      napak++;
      console.log(`\n[${k + 1}] ${koraki[k].ime}:`);
      for (const r of razlike) console.log('  ' + r);
    }
  }
  console.log(napak ? `\nRazlike v ${napak} korakih.` : `Enako: ${koraki.length} posnetkov.`);
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
