/* ==================== ZBIRKA UGANK (skupna koda) ====================
   Hramba zbirke ugank v localStorage tega brskalnika, podatki ob reševanju ter
   izvoz/uvoz v datoteko Markdown v enaki obliki kot docs/uganke.md. Uganke se
   ločijo po 81-znakovnem nizu danosti (interno '0' = prazna celica, v datoteki '.').
   Brez DOM-a (razen zbirkaPrenesi() za prenos datoteke) - uporabljata jo
   app/zbirka.js (UI zbirke v reševalcu) in igra/, tudi za gumba Izvozi/Uvozi.
   Tu je tudi seznam vgrajenih primerov (PRIMERI) - reševalec jih ponudi v
   spustnem seznamu "Primeri po težavnosti", igra v oknu "Zbirka ugank" - in podatki kartice
   uganke v seznamu (zbirkaKartica); izriše jo shared/zbirka-ui.js.
   Tu je tudi stanje mojega reševanja uganke (zbirkaStanjeUganke - nova / v teku /
   rešena) za vse prikaze in izvoz ter branje shranjenih iger igre (igreBeri), iz
   katerih se stanje izračuna.
   Naloži se za shared/engine.js (uporablja ALL_UNITS, ALL_TECHNIQUES, TRENING_TEHNIKE,
   solutionOf). Za težavnost nove uganke in uvožene uganke brez znane težavnosti
   potrebuje še oceniTezavnost iz shared/generator.js (naloži se lahko tudi za to
   datoteko - kliče se šele ob shranjevanju in uvozu). */

const ZBIRKA_KLJUC = 'sudoku.zbirka.v1';
// Težavnosti (opredelitev 2026-09-24, docs/uskladitev.md, razdelek 7): prvih pet so
// natanko stopnje (STOPNJE_UGANK v shared/generator.js, polje `ime`; Ekstrem =
// ekspertna tehnika), sledijo oznake uganke brez stopnje iz oceniTezavnost():
// "Presega tehnike" (motor bi moral ugibati), "Več rešitev" in "Brez rešitve".
// Težavnost, ki je ni mogoče določiti (neznana vrednost iz uvoza, nepreverjena
// enoličnost), je prazna - "težavnost ni določena".
const TEZAVNOSTI = ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstrem',
  'Presega tehnike', 'Več rešitev', 'Brez rešitve'];
// Imena težavnosti iz starejših zapisov (shramba tega brskalnika in stari izvozi).
// Preslikajo se ob branju zbirke in ob uvozu; v shrambo se novo ime zapiše ob
// prvem naslednjem shranjevanju.
const STARE_TEZAVNOSTI = {
  'Začetnik': 'Lahka',
  'Preprosto': 'Lahka',
  'Srednje': 'Srednja',
  'Težko': 'Težka',
  'Ekspert': 'Zelo težka',
};

// Težavnost v veljavnem zapisu: novo ime, staro ime preslikano, prazno ostane
// prazno, karkoli drugega (tudi nekdanja oznaka "Drugo") postane prazno - uvoz tako
// težavnost izračuna (zbirkaUvozi). Stari "Ekstrem" (prej: ugibanje) ostane; popravi
// ga gumb "Oceni zbirko" v igri.
function zbirkaTezavnost(v) {
  if (zbirkaPrazno(v)) return '';
  if (TEZAVNOSTI.includes(v)) return v;
  return STARE_TEZAVNOSTI[v] || '';
}
// Polja zapisa v stalnem vrstnem redu (tudi vrstni red pri uvozu/dopolnjevanju).
// Ločena sta dva para podatkov: PROGRAM (`nazadnje` = kdaj je solve() uganko
// nazadnje ocenil - izvoz "Ocenjeno"; `reseno` = kako daleč je prišel - izvoz
// "Program rešil") in MOJE REŠEVANJE v igri (`igrano` = čas moje zadnje poteze,
// `izpolnjeno` = koliko celic je izpolnjenih, `napaka` = med vpisi je vsaj ena
// števka, ki se ne ujema z rešitvijo).
const ZBIRKA_POLJA = ['danosti', 'tezavnost', 'izvor', 'dodano', 'igrano', 'izpolnjeno', 'napaka',
  'nazadnje', 'reseno', 'koraki', 'ugibanje', 'tehnike', 'opomba'];

// Od kod je uganka v zbirki: 'generator' (ustvaril jo je generator v igri),
// 'rocno' (vnesel jo je uporabnik - vnos v igri ali reševanje v reševalcu), ''
// (starejši zapisi, ki podatka nimajo). Izvor se zapiše samo ob NASTANKU zapisa in
// se pozneje ne spreminja. Vgrajenih primerov v zbirki ni (glej PRIMERI), zato
// zanje ni izvora. V izvozu je ključ "Izvor" z besedilom spodaj - "Vir" je v
// docs/uganke.md že zaseden za prosto besedilo o poreklu.
const ZBIRKA_IZVORI = { generator: 'ustvaril generator', rocno: 'ročni vnos' };

// Shranjena vrednost izvora iz zapisa ali iz uvoženega besedila; neznano -> ''.
function zbirkaIzvor(v) {
  if (zbirkaPrazno(v)) return '';
  if (ZBIRKA_IZVORI[v]) return v;
  const kljuc = Object.keys(ZBIRKA_IZVORI).find(k => ZBIRKA_IZVORI[k] === String(v).trim());
  return kljuc || '';
}

// Besedilo izvora za prikaz in izvoz ('' pri zapisu brez podatka).
function zbirkaOpisIzvora(z) {
  return (z && ZBIRKA_IZVORI[z.izvor]) || '';
}

// Vgrajeni primeri (reševalec: spustni seznam "Primeri po težavnosti", igra: razdelek
// "Vgrajeni primeri" v oknu Zbirka ugank). Primeri NISO del zbirke: nikoli se ne shranijo
// v zbirko (tudi ne, ko jih reši reševalec, ali z uvozom) in se ne štejejo; napredek
// igranja primera je samo v shranjenih igrah (sudoku.igra.v1). '.' = prazna celica.
// Seznam ustvari izbor tools/izberi-primere.js (ponovi ga ob novi tehniki ali spremembi
// motorja / generatorja): en primer za vsako stopnjo in vsako tehniko E1, E2, 1-12 - lahka,
// srednja za vsako tehniko 1-6, težka za vsako tehniko 7-12, zelo težka in presega
// tehnike. Urejeni so po stopnji in nato po tehniki. Polja: `tezavnost` (oceniUganko() iz
// shared/generator.js), `glavna` (tehnike, po katerih je primer izbran; pri lahki in pri
// presega tehnike prazno), `tehnike` (pot ocene - pri vseh primerih natanko tehnike
// dnevnika solve() -, pri presega tehnike tehnike dnevnika brez poskusa), `ugibanje`
// (število poskusov s protislovjem v dnevniku solve()). Vse preverja tests/pocasni/generator.test.js.
const PRIMERI = [
  { ime: 'P_1', tezavnost: 'Lahka', glavna: [], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček'],
    danosti: '..2......7.12...943.........2....7....6.31..5....6...9.4.6732..8.............4..1' }, // banka, seme 2
  { ime: 'P_2', tezavnost: 'Srednja', glavna: ['Pointing pair/triple'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Naked pair'],
    danosti: '....85...375.4.....49.2..3......2..3.1.95..8.9.3...2......3...7..6..4.1....1..8..' }, // banka, seme 219
  { ime: 'P_3', tezavnost: 'Srednja', glavna: ['Box-line reduction'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Naked pair'],
    danosti: '.4.......2..8..37.1.......6......95..5.7......3..8.2.....53....8...1..9......94.1' }, // banka, seme 17
  { ime: 'P_4', tezavnost: 'Srednja', glavna: ['Naked pair'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Naked pair'],
    danosti: '.7..3........7...28.34......3.1.9....6....3.1...38.6....7...2.9.1.6.2..3...84....' }, // banka, seme 157
  { ime: 'P_5', tezavnost: 'Srednja', glavna: ['Hidden pair'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Hidden pair'],
    danosti: '..3.......1...3..29..4.1...73...9.......85.1..6.....7...8.5..21....9..6........37' }, // banka, seme 572
  { ime: 'P_6', tezavnost: 'Srednja', glavna: ['Naked triple'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Hidden pair', 'Naked triple'],
    danosti: '.....17.....68...4....53.122..1.5.....4..9..6..38...75..27....86.5...3...4......7' }, // banka, seme 7873
  { ime: 'P_7', tezavnost: 'Srednja', glavna: ['Hidden triple'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Hidden triple'],
    danosti: '...2..67..7.5.9..2....4....4..........56..1....2.57....34..2..12..8.......7..6.8.' }, // banka, seme 1478
  { ime: 'P_8', tezavnost: 'Težka', glavna: ['X-Wing'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Naked pair', 'Hidden pair', 'X-Wing'],
    danosti: '.....156..1.53.7..46..........8..64..7......1..2..........8.93.....1...7..82.9..5' }, // genMinimalnaUganka, seme 6582
  { ime: 'P_9', tezavnost: 'Težka', glavna: ['Swordfish'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Naked triple', 'Swordfish'],
    danosti: '89......6.......8...5....47....3......76.9..2381..7....1826..7.....5......24.1..5' }, // banka, seme 1229
  { ime: 'P_10', tezavnost: 'Težka', glavna: ['Turbot Fish'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Hidden pair', 'Turbot Fish'],
    danosti: '4....8.....3.1..62.82........8....3.74..5.2........9.7....65...2.....3.6.7...4.5.' }, // banka, seme 730
  { ime: 'P_11', tezavnost: 'Težka', glavna: ['W-Wing'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'W-Wing'],
    danosti: '7.....2....34.59...4.9..3.....7...1.4...8.....1..4..7.69.8.....8....7..435.1.....' }, // banka, seme 2448
  { ime: 'P_12', tezavnost: 'Težka', glavna: ['XY-Wing'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Hidden pair', 'XY-Wing'],
    danosti: '.7.....5....85.2.....6..8.34....9..7..13.......9..53.6......64215.4.....2........' }, // banka, seme 7
  { ime: 'P_13', tezavnost: 'Težka', glavna: ['Unique Rectangle'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'Unique Rectangle'],
    danosti: '......78.645......2..1...6..982..5...2...1.73.....6.....2....9....8..6..1..642...' }, // banka, seme 1799
  { ime: 'P_14', tezavnost: 'Zelo težka', glavna: ['Turbot Fish', 'XY-Wing'], ugibanje: 0,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Naked pair', 'Hidden pair', 'Turbot Fish', 'XY-Wing'],
    danosti: '741.89................3...8..8..7.9....4...759.....6.2.65913....7.........3....5.' }, // generator, seme 59
  { ime: 'P_15', tezavnost: 'Presega tehnike', glavna: [], ugibanje: 1,
    tehnike: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple', 'Box-line reduction', 'Naked pair', 'Unique Rectangle'],
    danosti: '..3.98.....2...67......5...9..7..4..1....2....6..3..1...4..79...1..6...5.8....1..' }, // genMinimalnaUganka, seme 12
];

// Danosti primerov do 2026-10-05 (»Primer 1 (z ugibanjem)« … »Primer 5 (lahka)«). Shranjeni
// napredek pri njih igra ob zagonu enkrat počisti (zbirkaPocistiStarePrimere()), ker bi
// sicer ostal kot napredek uganke, ki je ni nikjer.
const STARI_PRIMERI = [
  '000800020900000600000000000604000900000720003500000000000056000080009000070000010',
  '800001000000600500000700000100000600000500200000070000025000070060000030000080004',
  '073004002049060800105800000000000026000090370387002000492070600000009050500206907',
  '004007025100003000070800000800090034040005009960000572001006000000000000000004761',
  '876000004000000700000200580034010800210069000000305070000000600040076900008000040',
];

// Vgrajeni primer s temi danostmi ('0' ali '.' = prazna celica) ali null.
function zbirkaPrimerZa(danosti) {
  const d = String(danosti || '').replace(/\./g, '0');
  return PRIMERI.find(p => p.danosti.replace(/\./g, '0') === d) || null;
}

// Shranjeni napredek starih primerov (STARI_PRIMERI) - kliče ga igra ob zagonu. Igra uganke, ki je
// medtem v zbirki (npr. vnesena znova), ostane. Vrne true, če je zapisano (ali ni bilo česa).
function zbirkaPocistiStarePrimere() {
  const vZbirki = new Set(zbirkaBeri().map(z => z.danosti));
  return zbirkaIzbrisiIgre(STARI_PRIMERI.filter(d => !vZbirki.has(d)));
}

// Naštevanje z vejicami in »in« pred zadnjim: »E1, E2, 1 Izločitev izven bloka in 3 Očitni par«.
function zbirkaNastej(deli) {
  return deli.length < 2 ? deli.join('') : deli.slice(0, -1).join(', ') + ' in ' + deli[deli.length - 1];
}

// Kratko ime tehnike za naštevanje (»Tehnike:« v reševalcu pod seznamom primerov, v igri v kartici
// »Uganka« in pri vgrajenih primerih): enojčka samo z oznako (»E1«, »E2«), druge s številko in
// imenom brez angleškega (»7 X-krilo«); ime, ki ga ni med tehnikami, ostane.
function zbirkaKratkoImeTehnike(kljuc) {
  const e = TRENING_ENOJCKA.findIndex(([, t]) => t === kljuc);
  if (e >= 0) return 'E' + (e + 1);
  const i = TRENING_TEHNIKE.findIndex(([, t]) => t === kljuc);
  return i >= 0 ? `${i + 1} ${imeTehnike(kljuc, { anglesko: false })}` : kljuc;
}

// Deli naštevanja tehnik: [{ besedilo, glavna }] po vrstnem redu tehnik (redTehnike()), na koncu
// »ugibanje«, če ga reševalec potrebuje. `glavna` = tehnika je glavna tehnika primera (krepko).
function zbirkaDeliTehnik(kljuci, { glavne = [], ugibanje = 0 } = {}) {
  const deli = [...kljuci].sort((a, b) => redTehnike(a) - redTehnike(b))
    .map(k => ({ besedilo: zbirkaKratkoImeTehnike(k), glavna: glavne.includes(k) }));
  if (ugibanje) deli.push({ besedilo: 'ugibanje', glavna: false });
  return deli;
}

// Tehnike vgrajenega primera z glavno tehniko.
function zbirkaTehnikePrimera(p) {
  return zbirkaDeliTehnik(p.tehnike, { glavne: p.glavna, ugibanje: p.ugibanje });
}

// Tehnike uganke v zbirki (kartica »Uganka« v igri, kartica v seznamu zbirke): pri težki uganki pot
// ocene (zbirkaPotTezke() - pot z eno samo napredno tehniko, ki zadošča; dnevnik solve() ima lahko
// dve, npr. »9, 10«), sicer dnevnik reševanja (z.tehnike); poskus
// s protislovjem je »ugibanje«. Brez podatka (tudi prazen seznam) null.
function zbirkaTehnikeZapisa(z) {
  const pot = z && z.tezavnost === 'Težka' ? zbirkaPotTezke(z) : null;
  if (pot) return zbirkaDeliTehnik(pot);
  if (!z || !Array.isArray(z.tehnike)) return null;
  if (!z.tehnike.length) return null;
  const poskus = ([ime]) => /protislovje/.test(ime);
  return zbirkaDeliTehnik(z.tehnike.filter(t => !poskus(t)).map(([ime]) => ime),
    { ugibanje: z.tehnike.filter(poskus).reduce((s, [, n]) => s + n, 0) });
}

// Besedilo naštevanja (brez krepkega): »Tehnike: E1, E2 in 3 Očitni par«.
function zbirkaBesediloTehnik(deli) {
  return 'Tehnike: ' + (deli ? zbirkaNastej(deli.map(d => d.besedilo)) : 'ni podatkov');
}

// Vrstica primera v seznamu: »P_8 · 7 X-krilo«, »P_14 · 9 Veriga ene števke in 11 XY-krilo«,
// pri lahki »P_1 · enojčki«, pri presega tehnike »P_15 · z ugibanjem«.
function zbirkaNaslovPrimera(p) {
  const glavna = p.glavna.length ? zbirkaNastej(p.glavna.map(zbirkaKratkoImeTehnike))
    : p.tezavnost === 'Lahka' ? 'enojčki' : 'z ugibanjem';
  return `${p.ime} · ${glavna}`;
}

// Primeri po skupinah stopnje (vrstni red iz PRIMERI): [{ tezavnost, naslov, primeri }]. Naslov
// skupine »Srednja · tehnika«, kadar ima vsak primer eno glavno tehniko, sicer »· tehnike« (lahka:
// enojčka, zelo težka: dve napredni); pri presega tehnike samo stopnja.
function zbirkaSkupinePrimerov() {
  const skupine = [];
  for (const p of PRIMERI) {
    let s = skupine.find(x => x.tezavnost === p.tezavnost);
    if (!s) skupine.push(s = { tezavnost: p.tezavnost, primeri: [] });
    s.primeri.push(p);
  }
  for (const s of skupine) {
    s.naslov = s.tezavnost === 'Presega tehnike' ? s.tezavnost
      : `${s.tezavnost} · ${s.primeri.every(p => p.glavna.length === 1) ? 'tehnika' : 'tehnike'}`;
  }
  return skupine;
}

// Niz danosti iz polja "Niz" (igra: okno "Nova uganka"; reševalec: nad vnosno
// mrežo). Veljavni so znaki 0-9 in '.', vse drugo se izpusti - tudi presledki,
// prelomi vrstic in ločila mreže (|, +, -), zato se da prilepiti tudi mrežo,
// zapisano v vrsticah. Vrne { danosti, veljavnih, neveljavni, sporocilo, napaka }:
// `danosti` je 81 znakov z '0' za prazno celico ali null (veljavnih ni natanko 81);
// `neveljavni` so izpuščeni znaki razen presledkov in ločil mreže (vsak enkrat, po
// vrstnem redu pojavitve); `sporocilo` je '' (prazno polje ali samo presledki in
// ločila), "Niz je vpisan v mrežo." ali napaka s številom veljavnih znakov in
// naštetimi neveljavnimi.
function zbirkaNizDanosti(besedilo) {
  const s = String(besedilo || '');
  const znaki = s.replace(/[^0-9.]/g, '');
  const neveljavni = [...new Set(s.replace(/[0-9.\s|+\-]/g, ''))];
  const veljavnih = znaki.length;
  if (veljavnih === 81) {
    return { danosti: znaki.replace(/\./g, '0'), veljavnih, neveljavni, sporocilo: 'Niz je vpisan v mrežo.', napaka: false };
  }
  if (!veljavnih && !neveljavni.length) {
    return { danosti: null, veljavnih, neveljavni, sporocilo: '', napaka: false };
  }
  return {
    danosti: null, veljavnih, neveljavni, napaka: true,
    sporocilo: `Veljavnih znakov v nizu: ${veljavnih} (potrebnih je 81).`
      + (neveljavni.length ? ' ' + zbirkaNeveljavniZnaki(neveljavni) : ''),
  };
}

// "Neveljaven znak »x« je izpuščen - ..." (1, 2, 3 ali več znakov; največ 8).
function zbirkaNeveljavniZnaki(znaki) {
  const naj = 8;
  const z = znaki.slice(0, naj).map(c => `»${c}«`);
  const seznam = z.length === 1 ? z[0] : z.slice(0, -1).join(', ') + ' in ' + z[z.length - 1];
  const vec = znaki.length > naj ? ` (in še ${znaki.length - naj})` : '';
  const del = z.length === 1 ? `Neveljaven znak ${seznam} je izpuščen`
    : z.length === 2 ? `Neveljavna znaka ${seznam} sta izpuščena`
    : `Neveljavni znaki ${seznam}${vec} so izpuščeni`;
  return `${del} – prazna celica je 0 ali pika.`;
}

/* ---------- pomožne ---------- */

function zbirkaZdaj() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// '2026-09-15 14:32' -> '15. 9. 2026 ob 14:32'. Ura je neobvezna: uvoz iz Markdowna
// sprejme tudi zapis brez nje (glej `datum` v zbirkaIzMarkdowna) in tak zapis ostane
// samo datum.
function zbirkaPrikazDatuma(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/.exec(s || '');
  if (!m) return '—';
  const dan = `${+m[3]}. ${+m[2]}. ${m[1]}`;
  return m[4] ? `${dan} ob ${m[4]}` : dan;
}

/* ---------- shranjene igre (sudoku.igra.v1) ---------- */

// Igra (igra/shramba.js) shranjuje napredek vsake uganke posebej: { zadnja, igre:
// { [danosti]: { poteze, kazalec, znova, zacetek, nazadnje } } }. Piše samo igra;
// tu je branje, ker stanje uganke (spodaj) potrebuje tudi reševalec, ki
// igra/shramba.js ne naloži. Poteze odigra odigrajPoteze() iz shared/stanje.js,
// ki se naloži pred to datoteko.
const IGRA_KLJUC = 'sudoku.igra.v1';

function igreBeri() {
  try {
    const s = JSON.parse(localStorage.getItem(IGRA_KLJUC) || 'null');
    if (s && typeof s === 'object' && s.igre && typeof s.igre === 'object') return s;
  } catch (e) { /* brez shrambe */ }
  return { zadnja: null, igre: {} };
}

// Kazalec, na katerem se shranjena igra odpre (igraIzZapisa v igra/shramba.js). Ostane,
// kakor je bil shranjen (npr. 2 od 3 po "Razveljavi"), razen v stanju "vse
// razveljavljeno" (0 ob neprazni zgodovini in brez "Začni znova"): prazna mreža s
// skrito zgodovino je videti kot izgubljen napredek, zato se igra vrne na konec.
function zbirkaKazalecZapisa(zapis) {
  const poteze = zapis && Array.isArray(zapis.poteze) ? zapis.poteze : [];
  const k = zapis && Number.isInteger(zapis.kazalec) ? zapis.kazalec : poteze.length;
  if (k === 0 && poteze.length > 0 && !zapis.znova) return poteze.length;
  return Math.max(0, Math.min(k, poteze.length));
}

/* ---------- stanje uganke (moje reševanje) ---------- */

// Povzetek igre - edino mesto, kjer se iz potez štejejo vpisi:
//   { zaceta, vpisanih, praznih, izpolnjeno, polna, napaka }
// `zaceta` = v zgodovini je vsaj ena poteza (tudi razveljavljena ali pred "Začni
// znova"; zapis igre nastane že ob odprtju, zato sam ne zadostuje), `vpisanih` =
// moji vpisi, `praznih` = 81 - danosti, `izpolnjeno` = danosti + vpisi (tako ga
// hrani zbirka). `napaka` = vsaj en vpis se ne ujema z rešitvijo; brez podane
// rešitve se ta poišče (solutionOf) samo pri polni mreži, ker jo prikaz potrebuje
// samo tam.
function zbirkaPovzetekIgre(danosti, poteze, kazalec, resitev) {
  const p = Array.isArray(poteze) ? poteze : [];
  const { vpisi } = odigrajPoteze(danosti, p, Math.min(kazalec, p.length));
  let praznih = 0;
  let vpisanih = 0;
  for (let c = 0; c < 81; c++) {
    if (danosti[c] !== '0') continue;
    praznih++;
    if (vpisi[c]) vpisanih++;
  }
  const polna = vpisanih === praznih;
  const res = resitev || (polna ? solutionOf(danosti) : null);
  const napaka = !!res && vpisi.some((v, c) => v && danosti[c] === '0' && v !== res[c]);
  return { zaceta: p.length > 0, vpisanih, praznih, izpolnjeno: 81 - praznih + vpisanih, polna, napaka };
}

// Povzetek shranjene igre (zapis iz igreBeri().igre) na kazalcu, na katerem se
// odpre; null, kadar zapisa ni.
function zbirkaPovzetekZapisa(danosti, zapis, resitev) {
  if (!zapis) return null;
  return zbirkaPovzetekIgre(danosti, zapis.poteze, zbirkaKazalecZapisa(zapis), resitev);
}

// Stanje MOJEGA reševanja uganke (ne programovega) - edini vir za napis, gumb in
// izvoz v vseh aplikacijah. `z` je zapis v zbirki ali null (vgrajeni primer),
// `povzetek` iz zbirkaPovzetekIgre/zbirkaPovzetekZapisa ali null. Vrne
//   { kljuc: 'nova' | 'v-teku' | 'resena', napaka, vpisanih, praznih,
//     napredek: 'v teku (12/57)', besedilo: 'v teku (12/57) · napaka',
//     gumb: 'Igraj' | 'Nadaljuj' | 'Poglej', resena: čas prve rešitve ali null }
// Vir: začeta igra, kadar obstaja, sicer zapis v zbirki (uvoz z druge naprave).
// Tri stanja: nova (brez poteze), v teku (od prve poteze - tudi samo odstranjeni
// kandidati - do rešitve), rešena (vse prazne celice izpolnjene in pravilne). Polna
// mreža z napako je "v teku" s podoznako "· napaka" (`napaka: true`). Gumb sledi
// stanju, a brez začete igre je vedno "Igraj" - ni česa nadaljevati ali pogledati.
// `resena` je čas iz zapisa v zbirki, kadar je ta rešen (zapis je zamrznjen): pri
// "v teku" pomeni, da uganko rešujem znova. Ključ je hkrati razred za barvo (igra.css).
function zbirkaStanjeUganke(danosti, z, povzetek) {
  const praznih = danosti.split('').filter(ch => ch === '0').length;
  const izpolnjenoZapisa = z && z.igrano ? (z.izpolnjeno || 0) : 0;
  const resena = z && z.igrano && izpolnjenoZapisa >= 81 && !z.napaka ? z.igrano : null;
  const igra = !!(povzetek && povzetek.zaceta);
  let p = null;
  if (igra) p = povzetek;
  else if (z && z.igrano) {
    // Shranjena igra brez poteze (uganka je bila samo odprta) in zapis brez mojih
    // vpisov: ni česa pokazati - uganka je nova (stari zapisi so čas reševanja
    // dobili že ob odprtju). Brez shranjene igre (uvoz, izvoz) velja zapis.
    const vpisanih = Math.max(0, Math.min(praznih, izpolnjenoZapisa - (81 - praznih)));
    if (vpisanih > 0 || !povzetek) p = { vpisanih, polna: izpolnjenoZapisa >= 81, napaka: !!z.napaka };
  }
  if (!p) {
    return { kljuc: 'nova', napaka: false, vpisanih: null, praznih,
      napredek: 'nova', besedilo: 'nova', gumb: 'Igraj', resena: null };
  }
  if (p.polna && !p.napaka) {
    return { kljuc: 'resena', napaka: false, vpisanih: praznih, praznih,
      napredek: 'rešena', besedilo: 'rešena', gumb: igra ? 'Poglej' : 'Igraj', resena };
  }
  const napaka = !!(p.polna && p.napaka);
  const napredek = `v teku (${p.vpisanih}/${praznih})`;
  return { kljuc: 'v-teku', napaka, vpisanih: p.vpisanih, praznih,
    napredek, besedilo: napaka ? `${napredek} · napaka` : napredek,
    gumb: igra ? 'Nadaljuj' : 'Igraj', resena };
}

// Časi in stanje zapisa za prikaz (seznam zbirke v igri in reševalcu, kartica
// "Uganka"): dve vrstici drugo pod drugo. `povzetek` je povzetek igre te uganke
// (glej zbirkaStanjeUganke) ali nič. Vrne
//   { dodana: 'dodana 21. 9. 2026 ob 16:33',
//     igranje: null | { predpona, besedilo, kljuc, napaka } }
// Druge vrstice ni, kadar je uganka nova (`igranje` je null); sicer je vrstica
// "predpona · besedilo · napaka", kjer je besedilo stanje (v seznamu obarvano po
// `kljuc`) in "napaka" podoznaka polne mreže z napako. Rešena uganka ima namesto
// para "zadnje reševanje … · rešena" samo "rešena 21. 9. 2026 ob 17:48" - njen
// zapis je zamrznjen, zato je to čas prve rešitve; kadar jo rešujem znova, je
// vrstica "rešena 21. 9. 2026 ob 17:48 · znova v teku (12/57)". Čas je vedno iz
// zapisa v zbirki (`igrano`, čas moje zadnje poteze), ne iz shranjene igre, ki se
// osveži že ob odprtju. Čas, ko je program uganko ocenil (`nazadnje`), v seznamu
// ni: je samo v namigu miške in v izvozu.
function zbirkaPrikazCasov(z, povzetek) {
  const dodana = z && z.dodano ? `dodana ${zbirkaPrikazDatuma(z.dodano)}` : '—';
  if (!z) return { dodana, igranje: null };
  const st = zbirkaStanjeUganke(z.danosti, z, povzetek);
  if (st.kljuc === 'nova') return { dodana, igranje: null };
  const cas = z.igrano ? ` ${zbirkaPrikazDatuma(z.igrano)}` : '';
  let igranje;
  if (st.kljuc === 'resena') {
    igranje = { predpona: '', besedilo: `rešena${cas}`, kljuc: st.kljuc, napaka: false };
  } else if (st.resena) {
    igranje = { predpona: `rešena ${zbirkaPrikazDatuma(st.resena)}`, besedilo: `znova ${st.napredek}`, kljuc: st.kljuc, napaka: st.napaka };
  } else {
    igranje = { predpona: cas ? `zadnje reševanje${cas}` : '', besedilo: st.napredek, kljuc: st.kljuc, napaka: st.napaka };
  }
  return { dodana, igranje };
}

// Druga vrstica kot navadno besedilo (kartica "Uganka" v igri, seznam v reševalcu);
// seznam v igri stanje obarva, zato sestavi vrstico sam.
function zbirkaVrsticaIgranja(z, povzetek) {
  const i = zbirkaPrikazCasov(z, povzetek).igranje;
  return i ? [i.predpona, i.besedilo, i.napaka ? 'napaka' : ''].filter(Boolean).join(' · ') : '';
}

// Namig miške pri uganki v seznamu (igra in reševalec): poleg obeh mojih podatkov
// še oba programova - kdaj je uganko nazadnje ocenil in kako daleč je prišel.
// Časi so v isti obliki kot v seznamu ("21. 9. 2026 ob 16:33"), izvoz pa ostane
// v obliki "2026-09-21 16:33".
function zbirkaNamigCasov(z, povzetek) {
  const st = zbirkaStanjeUganke(z.danosti, z, povzetek);
  return [
    `Dodano: ${zbirkaPrikazDatuma(z.dodano)}`,
    `Zadnje reševanje: ${zbirkaPrikazDatuma(z.igrano)}`,
    `Stanje: ${st.kljuc === 'v-teku' && st.resena ? `rešena, znova ${st.besedilo}` : st.besedilo}`,
    `Ocenjeno: ${zbirkaPrikazDatuma(z.nazadnje)}`,
    `Program rešil: ${zbirkaProgramResil(z) || '–'}`,
  ].join(' · ');
}

// Kako daleč je uganko rešil program (solve()), z istim števcem kot moj napredek:
// samo celice, ki jih je treba izpolniti - "v celoti" ali "delno (36/57)". V zapisu
// je `reseno` število vseh izpolnjenih celic (z danostmi). '' brez podatka.
function zbirkaProgramResil(z) {
  if (!z || zbirkaPrazno(z.reseno)) return '';
  if (z.reseno >= 81) return 'v celoti';
  const praznih = z.danosti.split('').filter(ch => ch === '0').length;
  const resenih = Math.max(0, Math.min(praznih, z.reseno - (81 - praznih)));
  return `delno (${resenih}/${praznih})`;
}

// Podatki kartice uganke v seznamu (seznam zbirke v igri in reševalcu, vgrajeni
// primeri v igri) - izriše jo zbirkaIzrisiKartico() v shared/zbirka-ui.js, gumbe
// doda aplikacija. `z` je zapis v zbirki ali null (vgrajeni primer - ta v zbirki
// nikoli ni), `povzetek` povzetek shranjene igre ali null. Vrne
//   { primer, naslov, stanje: { predpona, besedilo, kljuc, napaka }, info, opomba,
//     namig, gumb }
// 1. vrstica (naslov): "ročni vnos · dodana 21. 9. 2026 ob 16:33", pri
//    vgrajenem primeru ime z glavno tehniko (zbirkaNaslovPrimera() - "P_8 · 7 X-krilo");
// 2. vrstica (stanje) je vedno: "nova", "zadnje reševanje … · v teku (12/57)",
//    "rešena …" ali "rešena … · znova v teku (12/57)" (zbirkaPrikazCasov); primer
//    je brez časa (čas shranjene igre se osveži že ob odprtju);
// 3. vrstica (info): "danih 24 · Tehnike: E1, E2, 1 Izločitev izven bloka in 7 X-krilo · 42 korakov"
//    (zbirkaBesediloTehnik(zbirkaTehnikeZapisa()), poskus s protislovjem "in ugibanje"), pri delni
//    rešitvi še "· program rešil delno (36/57)"; primer "danih 17" (podatkov reševanja
//    nima), izris pa doda vse tehnike (`tehnike` - zbirkaTehnikePrimera(), glavna krepko).
//    Pred 3. vrstico je značka težavnosti (`znacka` - primer in uganka v zbirki enako;
//    uganka brez težavnosti je brez značke).
// `gumb` (Igraj / Nadaljuj / Poglej) je iz istega stanja kot 2. vrstica.
function zbirkaKartica(danosti, z, povzetek) {
  const primer = zbirkaPrimerZa(danosti);
  const st = zbirkaStanjeUganke(danosti, z, povzetek);
  const dodana = z && z.dodano ? `dodana ${zbirkaPrikazDatuma(z.dodano)}` : '';
  const naslov = primer ? zbirkaNaslovPrimera(primer)
    : [zbirkaOpisIzvora(z), dodana].filter(Boolean).join(' · ');

  let stanje = z ? zbirkaPrikazCasov(z, povzetek).igranje : null;
  if (!stanje) stanje = { predpona: '', besedilo: st.napredek, kljuc: st.kljuc, napaka: st.napaka };

  const info = [`danih ${81 - st.praznih}`];
  if (z) {
    info.push(zbirkaBesediloTehnik(zbirkaTehnikeZapisa(z)));
    if (!zbirkaPrazno(z.koraki)) info.push(zbirkaStKorakov(z.koraki));
    if (!zbirkaPrazno(z.reseno) && z.reseno < 81) info.push(`program rešil ${zbirkaProgramResil(z)}`);
  }
  return {
    primer: primer ? primer.ime : null,
    naslov,
    znacka: primer ? primer.tezavnost : (z && z.tezavnost) || null,
    tehnike: primer ? zbirkaTehnikePrimera(primer) : null,
    stanje,
    info: info.join(' · '),
    opomba: (z && z.opomba) || '',
    namig: z ? zbirkaNamigCasov(z, povzetek) : '',
    gumb: st.gumb,
  };
}

function zbirkaStKorakov(n) {
  const r = n % 100;
  const beseda = r === 1 ? 'korak' : r === 2 ? 'koraka' : (r === 3 || r === 4) ? 'koraki' : 'korakov';
  return `${n} ${beseda}`;
}

function zbirkaPrazno(v) {
  return v === null || v === undefined || v === '';
}

function zbirkaBrezKonfliktov(danosti) {
  for (const unit of ALL_UNITS) {
    const seen = new Set();
    for (const c of unit) {
      const v = danosti[c];
      if (v === '0') continue;
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  return true;
}

/* ---------- hramba ---------- */

function zbirkaBeri() {
  let a;
  try {
    a = JSON.parse(localStorage.getItem(ZBIRKA_KLJUC) || '[]');
  } catch (e) {
    return [];
  }
  if (!Array.isArray(a)) return [];
  // Vgrajeni primeri niso del zbirke. Zapise primerov, ki jih je reševalec shranil
  // prej (ali so prišli z uvozom), odstranimo in zbirko enkrat prepišemo; shranjena
  // igra primera (sudoku.igra.v1) ostane.
  const zbirka = a.filter(z => z && !zbirkaPrimerZa(z.danosti));
  if (zbirka.length !== a.length) zbirkaPisi(zbirka);
  // Stara imena težavnosti preslikamo ob branju (zapišejo se ob prvem shranjevanju).
  for (const z of zbirka) if (z.tezavnost) z.tezavnost = zbirkaTezavnost(z.tezavnost);
  return zbirka;
}

function zbirkaPisi(zbirka) {
  try {
    localStorage.setItem(ZBIRKA_KLJUC, JSON.stringify(zbirka));
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------- shranjevanje ob reševanju ---------- */

// Seznam [[ime, n], ...] po vrstnem redu tehnik (redTehnike() v shared/engine.js);
// zapisi, shranjeni prej (po pogostosti), se uredijo ob naslednjem shranjevanju in že
// v izvozu.
function zbirkaUrediTehnike(tehnike) {
  return [...tehnike].sort((a, b) => redTehnike(a[0]) - redTehnike(b[0]));
}

// Ključ poskusa s protislovjem v dnevniku solve(); starejši zapisi imajo namesto
// "(forcing chain)" celico ("Poskus in protislovje (V1S1 = 5)").
const ZBIRKA_POSKUS = POSKUS_KLJUC + ' (forcing chain)';

// Tehnike za izvoz "**Tehnike:**": slovensko ime brez oklepaja (imeTehnike() v
// shared/engine.js - angleško ime ne gre, ker "XY-Wing, Y-Wing" vsebuje vejico, po
// kateri uvoz loči tehnike). Vsi ključi poskusa so ena postavka "Poskus in
// protislovje N", neznan ključ ostane. V shrambi ostanejo ključi.
function zbirkaTehnikeZaIzvoz(tehnike) {
  const skupaj = new Map();
  for (const [t, n] of zbirkaUrediTehnike(tehnike)) {
    const ime = imeTehnike(t, { anglesko: false });
    skupaj.set(ime, (skupaj.get(ime) || 0) + n);
  }
  return [...skupaj].map(([ime, n]) => `${ime} ${n}`).join(', ');
}

// Ključ motorja iz imena tehnike v uvozu: novo slovensko ime (izvoz od faze 4) ali
// stari ključ (starejši izvozi), brez presledkov na robovih in ne glede na velike in
// male črke. Vsak poskus je ZBIRKA_POSKUS; neznano ime ostane, kot je.
function zbirkaKljucTehnike(ime) {
  const norm = s => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const iskano = norm(ime);
  if (iskano.startsWith(norm(POSKUS_KLJUC))) return ZBIRKA_POSKUS;
  for (const [k] of ALL_TECHNIQUES) {
    if (norm(k) === iskano || norm(imeTehnike(k, { anglesko: false })) === iskano) return k;
  }
  return ime.trim();
}

// Podatki iz dnevnika solve(). Psevdo-koraka 'OBSTALO'/'NAPAKA' (reševalec
// se je ustavil) nista pravi koraki, zato ju ne štejemo. Tehnike so po vrstnem redu
// tehnik, ne po pogostosti.
function zbirkaPodatkiResevanja(board, log) {
  const pravi = log.filter(s => s.technique !== 'OBSTALO' && s.technique !== 'NAPAKA');
  const stevci = {};
  pravi.forEach(s => { stevci[s.technique] = (stevci[s.technique] || 0) + 1; });
  return {
    reseno: board.grid.filter(v => v !== 0).length,
    koraki: pravi.length,
    ugibanje: pravi.filter(s => s.technique.startsWith('Poskus in protislovje')).length,
    tehnike: zbirkaUrediTehnike(Object.entries(stevci)),
  };
}

// Tehnike poti, ki je določila stopnjo (mere.uporabljene iz oceniTezavnost() v
// shared/generator.js), po vrstnem redu tehnik, ali null (uganka brez stopnje). Iz te poti je
// oznaka »tehnike:« pri težki uganki - pot z eno samo napredno tehniko, z najnižjo številko,
// ki zadošča (popravek po ročnem pregledu faze 6); dnevnik solve() ima lahko dve.
function zbirkaPotIzOcene(o) {
  return o && o.mere ? [...o.mere.uporabljene].sort((a, b) => redTehnike(a) - redTehnike(b)) : null;
}

// Nova uganka dobi težavnost in izvor iz `dodatno` ({ tezavnost, izvor }); brez
// težavnosti (ročni vnos) se ta izračuna z oceniTezavnost() iz shared/generator.js,
// prav tako pri že shranjeni uganki, ki težavnosti nima. Zapis dobi tudi pot ocene
// (`potOcene` - zbirkaPotIzOcene()), če je še nima. Pri že shranjeni se
// posodobijo samo datum zadnjega reševanja in izračunani podatki
// (težavnost, izvor in opomba ostanejo - izvor pove, kako je uganka nastala, ne kdaj
// je bila nazadnje rešena). Vrne shranjeni zapis ali null, če brskalnik ne dovoli
// shranjevanja ali če je uganka vgrajeni primer (ta se v zbirko nikoli ne shrani).
function zbirkaShraniResitev(givens, board, log, dodatno = {}) {
  if (zbirkaPrimerZa(givens)) return null;
  const zbirka = zbirkaBeri();
  const cas = zbirkaZdaj();
  const podatki = zbirkaPodatkiResevanja(board, log);
  let zapis = zbirka.find(z => z.danosti === givens);
  if (zapis) {
    Object.assign(zapis, podatki, { nazadnje: cas });
    if (!zapis.tezavnost || !Array.isArray(zapis.potOcene)) {
      const o = oceniTezavnost(givens);
      if (!zapis.tezavnost) zapis.tezavnost = o.tezavnost;
      zapis.potOcene = zbirkaPotIzOcene(o);
    }
  } else {
    const o = oceniTezavnost(givens);
    zapis = {
      danosti: givens,
      tezavnost: dodatno.tezavnost || o.tezavnost,
      izvor: zbirkaIzvor(dodatno.izvor),
      dodano: cas, nazadnje: cas, ...podatki, potOcene: zbirkaPotIzOcene(o), opomba: '',
    };
    zbirka.push(zapis);
  }
  return zbirkaPisi(zbirka) ? zapis : null;
}

/* ---------- moje reševanje (igra) ---------- */

// Zapiše podatke o MOJEM reševanju uganke v igri: čas zadnje poteze, koliko celic
// je izpolnjenih in ali je med vpisi napaka. Uganko, ki je v zbirki ni (npr.
// vgrajeni primer), pusti pri miru. Vrne true, če je zapis spremenjen in shranjen.
// Zapis rešene uganke je ZAMRZNJEN: čas in stanje se ne spreminjata več, zato
// ostane zapisan čas prve rešitve (tudi če uganko pozneje rešujem še enkrat).
function zbirkaShraniIgranje(danosti, cas, izpolnjeno, napaka) {
  const zbirka = zbirkaBeri();
  const zapis = zbirka.find(z => z.danosti === danosti);
  if (!zapis) return false;
  if (zbirkaStanjeUganke(zapis.danosti, zapis).kljuc === 'resena') return false;
  if (zapis.igrano === cas && zapis.izpolnjeno === izpolnjeno && !!zapis.napaka === !!napaka) return false;
  Object.assign(zapis, { igrano: cas, izpolnjeno, napaka: !!napaka });
  return zbirkaPisi(zbirka);
}

/* ---------- brisanje (reševalec in igra) ---------- */

// Iz shranjenih iger (sudoku.igra.v1) odstrani igre teh ugank: brisanje uganke iz
// zbirke pobriše tudi njen napredek, da ne ostane shranjena igra brez zapisa. Igre
// vgrajenih primerov ostanejo. Edino mesto, kjer v shranjene igre piše shared/
// (sicer jih piše samo igra/shramba.js). Vrne true, če je zapisano.
function zbirkaIzbrisiIgre(danosti) {
  const s = igreBeri();
  let spremenjeno = false;
  for (const d of danosti) {
    if (!s.igre[d] || zbirkaPrimerZa(d)) continue;
    delete s.igre[d];
    spremenjeno = true;
  }
  if (!spremenjeno) return true;
  if (s.zadnja && !s.igre[s.zadnja]) s.zadnja = null;
  try {
    localStorage.setItem(IGRA_KLJUC, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}

// Izbriše uganko iz zbirke in njeno shranjeno igro. Vrne true, če je zapisano.
function zbirkaIzbrisi(danosti) {
  const ok = zbirkaPisi(zbirkaBeri().filter(z => z.danosti !== danosti));
  return zbirkaIzbrisiIgre([danosti]) && ok;
}

// Sirote: danosti shranjenih iger, ki niso vgrajeni primeri in jih v zbirki ni
// (uganka je bila izbrisana, preden je brisanje odstranilo tudi igro).
function zbirkaSirote() {
  const v = new Set(zbirkaBeri().map(z => z.danosti));
  return Object.keys(igreBeri().igre).filter(d => !v.has(d) && !zbirkaPrimerZa(d));
}

// Izbriše vso zbirko in VSE shranjene igre razen iger vgrajenih primerov - tudi
// sirote. Deluje tudi pri prazni zbirki (počisti samo sirote). Vrne
// { stevilo, sirot, ok }: število izbrisanih ugank, izbrisanih sirot in ali je zapisano.
function zbirkaIzbrisiVse() {
  const zbirka = zbirkaBeri();
  const sirot = zbirkaSirote().length;
  const ok = zbirkaPisi([]);
  return { stevilo: zbirka.length, sirot, ok: zbirkaIzbrisiIgre(Object.keys(igreBeri().igre)) && ok };
}

// Besedili potrditve brisanja - enaki v reševalcu in igri.
function zbirkaVprasanjeIzbrisi(z) {
  return `Izbrišem uganko, dodano ${zbirkaPrikazDatuma(z.dodano)} (${z.tezavnost || 'težavnost ni določena'})? ` +
    'Izbriše se tudi njen shranjeni napredek.';
}

// `n` = ugank v zbirki, `sirot` = shranjenih iger izbrisanih ugank. Pri prazni
// zbirki gre samo za napredek izbrisanih ugank (ni česa izvoziti); null, kadar ni
// ne ugank ne sirot - takrat aplikacija pove "Zbirka je že prazna."
function zbirkaVprasanjeIzbrisiVse(n, sirot = 0) {
  if (!n && !sirot) return null;
  if (!n) {
    return `Zbirka je prazna, shranjen pa je še napredek izbrisanih ugank (${sirot}). Izbrišem ta napredek? ` +
      'Vgrajeni primeri in napredek pri njih ostanejo. Izbrisa ni mogoče razveljaviti.';
  }
  return `Izbrišem vse uganke iz zbirke (${n}) in ves shranjeni napredek? Vgrajeni primeri in napredek pri njih ostanejo. ` +
    'Priporočam, da zbirko najprej izvoziš (gumb »Izvozi«) – izbrisa ni mogoče razveljaviti.';
}

// Sporočilo po "Izbriši vse" (rezultat zbirkaIzbrisiVse).
function zbirkaSporociloIzbrisiVse(r) {
  if (!r.ok) return 'Brisanja ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).';
  const sirote = `napredek izbrisanih ugank: ${r.sirot}`;
  if (!r.stevilo) return `Izbrisan ${sirote}.`;
  return `Izbrisanih ugank: ${r.stevilo}.` + (r.sirot ? ` Izbrisan je tudi ${sirote}.` : '');
}

/* ---------- izvoz v Markdown ---------- */

// Urejeno po datumu dodajanja (stalen), da se nove uganke dodajajo na konec
// datoteke in so razlike v gitu majhne.
function zbirkaVMarkdown(zbirka) {
  const urejena = zbirka.slice().sort((a, b) =>
    (a.dodano || '').localeCompare(b.dodano || '') || a.danosti.localeCompare(b.danosti));
  const vrstice = [
    '# Zbirka ugank',
    '',
    'Izvoz zbirke ugank (reševalec `app/` ali igra `igra/`, gumb "Zbirka" -> "Izvozi"). Datoteko je mogoče',
    'uvoziti nazaj (gumb "Uvozi"), ki razbere vrstice oblike `- **Ključ:** vrednost`.',
    'Uganke, pri katerih je navedeno "Preverjeno", imajo enolično rešitev.',
    '"Zadnje reševanje" in "Stanje" se nanašata na moje reševanje v igri,',
    '"Ocenjeno" in "Program rešil" pa na `solve()` iz `shared/engine.js`.',
  ];
  for (const z of urejena) {
    vrstice.push('', `### ${[z.dodano, z.tezavnost].filter(Boolean).join(' · ') || 'uganka'}`, '');
    vrstice.push(`- **Danosti:** \`${z.danosti.replace(/0/g, '.')}\``);
    if (z.tezavnost) vrstice.push(`- **Težavnost:** ${z.tezavnost}`);
    if (zbirkaOpisIzvora(z)) vrstice.push(`- **Izvor:** ${zbirkaOpisIzvora(z)}`);
    if (z.dodano) vrstice.push(`- **Dodano:** ${z.dodano}`);
    // Moje reševanje v igri.
    if (z.igrano) {
      vrstice.push(`- **Zadnje reševanje:** ${z.igrano}`);
      // Iz zapisa v zbirki (zamrznjen pri rešeni uganki), ne iz shranjene igre.
      vrstice.push(`- **Stanje:** ${zbirkaStanjeUganke(z.danosti, z).besedilo}`);
    }
    // Reševanje s programom.
    if (z.nazadnje) vrstice.push(`- **Ocenjeno:** ${z.nazadnje}`);
    if (!zbirkaPrazno(z.reseno)) {
      vrstice.push(`- **Program rešil:** ${zbirkaProgramResil(z)}`);
    }
    if (!zbirkaPrazno(z.koraki)) vrstice.push(`- **Koraki:** ${z.koraki}`);
    if (!zbirkaPrazno(z.ugibanje)) vrstice.push(`- **Ugibanje:** ${z.ugibanje}`);
    if (!zbirkaPrazno(z.tehnike)) {
      vrstice.push(`- **Tehnike:** ${z.tehnike.length ? zbirkaTehnikeZaIzvoz(z.tehnike) : '(brez)'}`);
    }
    if (z.opomba) vrstice.push(`- **Opomba:** ${z.opomba}`);
    // Zapis z "Rešeno" je nastal ob reševanju, ki se shrani le pri enolični rešitvi.
    if (!zbirkaPrazno(z.reseno)) vrstice.push('- **Preverjeno:** enolična rešitev (`countSolutions() === 1`)');
  }
  return vrstice.join('\n') + '\n';
}

/* ---------- uvoz iz Markdowna ---------- */

// Iz besedila pobere vse razdelke, ki imajo vrstico "- **Danosti:** ...".
// Razdelek se začne z naslovom (#...) ali z novo vrstico Danosti. Neznane
// vrstice (npr. **Vir**, **Značilnost** v docs/uganke.md) se preskočijo, prav tako
// vgrajeni primeri (niso del zbirke). Vrne { zapisi, neveljavni, primerov }.
function zbirkaIzMarkdowna(besedilo) {
  const surovi = [];
  let tren = null;
  for (const vrstica of besedilo.split(/\r?\n/)) {
    if (/^#/.test(vrstica)) { tren = null; continue; }
    const m = /^\s*[-*]\s+\*\*(.+?):\*\*\s*(.*)$/.exec(vrstica);
    if (!m) continue;
    // "Danosti (17)" -> "danosti"
    const kljuc = m[1].replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
    if (!tren || (kljuc === 'danosti' && tren.danosti !== undefined)) {
      tren = {};
      surovi.push(tren);
    }
    tren[kljuc] = m[2].trim();
  }

  const zapisi = [];
  let neveljavni = 0;
  let primerov = 0;
  for (const s of surovi) {
    if (s.danosti === undefined) continue;
    const z = zbirkaPretvoriUvozeni(s);
    if (!z) neveljavni++;
    else if (zbirkaPrimerZa(z.danosti)) primerov++; // primeri niso del zbirke
    else zapisi.push(z);
  }
  return { zapisi, neveljavni, primerov };
}

function zbirkaPretvoriUvozeni(s) {
  const danosti = s.danosti.replace(/`/g, '').trim().replace(/\./g, '0');
  if (!/^[0-9]{81}$/.test(danosti) || !zbirkaBrezKonfliktov(danosti)) return null;

  const stevilo = v => (/^\d+$/.test(v || '') ? parseInt(v, 10) : null);
  const datum = v => (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(v || '') ? v : '');

  const tezavnost = zbirkaTezavnost(s['težavnost']);
  const izvor = zbirkaIzvor(s.izvor);

  // "Program rešil" se je prej imenoval "Rešeno" - staro ime beremo še naprej. Nova
  // oblika "delno (36/57)" šteje samo prazne celice (reseno = danosti + 36), stara
  // "delno (60 od 81 celic)" vse izpolnjene.
  const danih = danosti.replace(/0/g, '').length;
  let reseno = null;
  const r = s['program rešil'] || s['rešeno'] || '';
  const rStara = /(\d+)\s+od\s+81/.exec(r);
  const rNova = /(\d+)\s*\/\s*\d+/.exec(r);
  if (r === 'v celoti') reseno = 81;
  else if (rStara) reseno = parseInt(rStara[1], 10);
  else if (rNova) reseno = Math.min(81, danih + parseInt(rNova[1], 10));

  // Moje reševanje: iz vrstice "Stanje" razberem število izpolnjenih celic in napako.
  // Nova oblika "v teku (12/57)" šteje samo moje vpise (izpolnjeno = danosti + 12),
  // "· napaka" je polna mreža z napako. Stari obliki "v teku (45 od 81)" (vse
  // izpolnjene celice) in "izpolnjena z napako" beremo še naprej.
  const igrano = datum(s['zadnje reševanje']);
  const st = (s.stanje || '').trim();
  let izpolnjeno = null;
  let napaka = null;
  if (igrano) {
    const nova = /(\d+)\s*\/\s*\d+/.exec(st);
    const stara = /(\d+)\s+od\s+81/.exec(st);
    if (st === 'rešena') { izpolnjeno = 81; napaka = false; }
    else if (st === 'izpolnjena z napako') { izpolnjeno = 81; napaka = true; }
    else if (nova) { izpolnjeno = Math.min(81, danih + parseInt(nova[1], 10)); napaka = /·\s*napaka/.test(st); }
    else if (stara) { izpolnjeno = parseInt(stara[1], 10); napaka = false; }
    else { izpolnjeno = 0; napaka = false; }
  }

  let tehnike = null;
  if (s.tehnike === '(brez)') {
    tehnike = [];
  } else if (s.tehnike) {
    // Imena v ključe (novo slovensko ime ali stari ključ); ista tehnika dvakrat -
    // npr. dva stara zapisa poskusa s celico - se sešteje.
    const deli = s.tehnike.split(',').map(t => /^(.*\S)\s+(\d+)$/.exec(t.trim()));
    if (deli.every(Boolean)) {
      const stevci = new Map();
      for (const m of deli) {
        const k = zbirkaKljucTehnike(m[1]);
        stevci.set(k, (stevci.get(k) || 0) + parseInt(m[2], 10));
      }
      tehnike = zbirkaUrediTehnike([...stevci]);
    }
  }

  return {
    danosti,
    tezavnost,
    izvor,
    dodano: datum(s.dodano),
    igrano,
    izpolnjeno,
    napaka,
    // "Ocenjeno" se je prej imenovalo "Nazadnje rešeno".
    nazadnje: datum(s.ocenjeno || s['nazadnje rešeno']),
    reseno,
    koraki: stevilo(s.koraki),
    ugibanje: stevilo(s.ugibanje),
    tehnike,
    opomba: s.opomba || '',
  };
}

// Uvožene zapise doda v `zbirka` (spremeni jo na mestu). Nove uganke doda;
// pri obstoječih danostih ohrani obstoječi zapis in dopolni le prazna polja.
function zbirkaZdruzi(zbirka, uvozeni, cas) {
  const porocilo = { novi: 0, dopolnjeni: 0, nespremenjeni: 0 };
  for (const u of uvozeni) {
    const obst = zbirka.find(z => z.danosti === u.danosti);
    if (!obst) {
      if (!u.dodano) u.dodano = cas;
      zbirka.push(u);
      porocilo.novi++;
      continue;
    }
    let spremenjen = false;
    for (const k of ZBIRKA_POLJA) {
      if (zbirkaPrazno(obst[k]) && !zbirkaPrazno(u[k])) { obst[k] = u[k]; spremenjen = true; }
    }
    if (spremenjen) porocilo.dopolnjeni++; else porocilo.nespremenjeni++;
  }
  return porocilo;
}

/* ---------- izvoz/uvoz za gumba v UI (reševalec in igra) ---------- */

const ZBIRKA_DATOTEKA = 'zbirka-ugank.md';

// Izvoz zbirke iz tega brskalnika. Vrne { besedilo, sporocilo } ali, če je
// zbirka prazna, { besedilo: null, sporocilo, napaka: true }. Datoteko prenese
// zbirkaPrenesi().
function zbirkaIzvozi() {
  const zbirka = zbirkaBeri();
  if (!zbirka.length) return { besedilo: null, sporocilo: 'Zbirka je prazna – ni česa izvoziti.', napaka: true };
  return {
    besedilo: zbirkaVMarkdown(zbirka),
    sporocilo: `Izvoženih ugank: ${zbirka.length} (datoteka ${ZBIRKA_DATOTEKA}).`,
    napaka: false,
  };
}

// Uvoz besedila datoteke (Markdown) v zbirko tega brskalnika: nove uganke
// doda, obstoječe le dopolni (zbirkaZdruzi). Uvožena uganka, ki po združitvi
// nima težavnosti (v datoteki je ni ali je neznana), jo dobi z oceniTezavnost() -
// kot ob ročnem vnosu; znana vrednost ostane. Vrne { sporocilo, napaka,
// spremenjeno } - spremenjeno = zbirka je bila zapisana (osveži prikaz).
function zbirkaUvozi(besedilo) {
  const { zapisi, neveljavni, primerov } = zbirkaIzMarkdowna(besedilo);
  if (!zapisi.length && !neveljavni && !primerov) {
    return { sporocilo: 'V datoteki ni nobene uganke (pričakujem vrstice oblike »- **Danosti:** `…`«).', napaka: true, spremenjeno: false };
  }
  const zbirka = zbirkaBeri();
  const p = zbirkaZdruzi(zbirka, zapisi, zbirkaZdaj());
  const uvozene = new Set(zapisi.map(z => z.danosti));
  let ocenjenih = 0;
  for (const z of zbirka) {
    if (!uvozene.has(z.danosti) || z.tezavnost) continue;
    z.tezavnost = oceniTezavnost(z.danosti).tezavnost;
    if (z.tezavnost) ocenjenih++; // '' = enoličnosti ni bilo mogoče preveriti
  }
  if (!zbirkaPisi(zbirka)) {
    return { sporocilo: 'Uvoza ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', napaka: true, spremenjeno: false };
  }
  return {
    sporocilo: `Uvoz končan – novih: ${p.novi} · dopolnjenih: ${p.dopolnjeni} · že obstoječih brez sprememb: ${p.nespremenjeni}` +
      (ocenjenih ? ` · težavnost izračunana: ${ocenjenih}` : '') +
      (neveljavni ? ` · neveljavnih (preskočenih): ${neveljavni}` : '') +
      (primerov ? ` · vgrajenih primerov (niso del zbirke, preskočenih): ${primerov}` : '') + '.',
    napaka: neveljavni > 0,
    spremenjeno: true,
  };
}

// Prenos besedila kot datoteke v brskalniku. Edina funkcija v tej datoteki,
// ki potrebuje brskalnik (document, Blob) - kličeta jo samo UI-ja.
function zbirkaPrenesi(besedilo, ime = ZBIRKA_DATOTEKA) {
  const blob = new Blob([besedilo], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ime;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- oznaka tehnik za prikaz ---------- */

// Pot ocene za oznako težke uganke: shranjena (`potOcene`) ali - pri starejšem ali uvoženem
// zapisu - izračunana enkrat na stran (oceniTezavnost() iz shared/generator.js, pribl. 10 ms;
// brez generatorja null).
const ZBIRKA_POTI = new Map();
function zbirkaPotTezke(z) {
  if (Array.isArray(z.potOcene)) return z.potOcene;
  if (!z.danosti || typeof oceniTezavnost !== 'function') return null;
  if (!ZBIRKA_POTI.has(z.danosti)) ZBIRKA_POTI.set(z.danosti, zbirkaPotIzOcene(oceniTezavnost(z.danosti)));
  return ZBIRKA_POTI.get(z.danosti);
}

/* ---------- vrstni red za prikaz ---------- */

// Vrstni red v seznamu zbirke: po mojem zadnjem dogodku z uganko, najnovejši na
// vrhu - pri reševani uganki je to čas reševanja, pri nereševani čas dodajanja.
// Ključa nista ločeni skupini, ker bi nova uganka (ki je še nisem igral) padla
// pod vse že reševane in je v daljši zbirki ne bi našel. Čas, ko je uganko ocenil
// program (`nazadnje`), na vrstni red ne vpliva - vrstni red je moj, ne programov.
// Vrne novo polje zapisov.
function zbirkaZaSeznam(zbirka) {
  const kljuc = z => z.igrano || z.dodano || '';
  return zbirka.map((z, i) => ({ z, i })).sort((a, b) =>
    kljuc(b.z).localeCompare(kljuc(a.z)) ||
    (b.z.dodano || '').localeCompare(a.z.dodano || '') ||
    b.i - a.i).map(x => x.z);
}
