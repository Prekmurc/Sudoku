/* ==================== ZBIRKA UGANK (skupna koda) ====================
   Hramba zbirke ugank v localStorage tega brskalnika, podatki ob reševanju ter
   izvoz/uvoz v datoteko Markdown v enaki obliki kot docs/uganke.md. Uganke se
   ločijo po 81-znakovnem nizu danosti (interno '0' = prazna celica, v datoteki '.').
   Brez DOM-a (razen zbirkaPrenesi() za prenos datoteke) - uporabljata jo
   app/zbirka.js (UI zbirke v reševalcu) in igra/, tudi za gumba Izvozi/Uvozi.
   Tu je tudi seznam vgrajenih primerov (PRIMERI) - reševalec jih ponudi v
   spustnem seznamu "Primer", igra v oknu "Zbirka ugank" - in podatki kartice
   uganke v seznamu (zbirkaKartica); izriše jo shared/zbirka-ui.js.
   Tu je tudi stanje mojega reševanja uganke (zbirkaStanjeUganke - nova / v teku /
   rešena) za vse prikaze in izvoz ter branje shranjenih iger igre (igreBeri), iz
   katerih se stanje izračuna.
   Naloži se za shared/engine.js (uporablja ALL_UNITS, ALL_TECHNIQUES, TRENING_TEHNIKE,
   solutionOf). */

const ZBIRKA_KLJUC = 'sudoku.zbirka.v1';
// Težavnosti: prve štiri so natanko stopnje generatorja (STOPNJE_UGANK v
// shared/generator.js, polje `ime`), "Ekstrem" je uganka, ki zahteva ugibanje,
// "Drugo" pa vrednost iz uvoza, ki je ne prepoznamo.
const TEZAVNOSTI = ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstrem', 'Drugo'];
const PRIVZETA_TEZAVNOST = 'Ekstrem';
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
// prazno, karkoli drugega je 'Drugo'.
function zbirkaTezavnost(v) {
  if (zbirkaPrazno(v)) return '';
  if (TEZAVNOSTI.includes(v)) return v;
  return STARE_TEZAVNOSTI[v] || 'Drugo';
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

// Vgrajeni primeri (reševalec: spustni seznam "Primer", igra: razdelek "Vgrajeni
// primeri" v oknu Zbirka ugank). Primeri NISO del zbirke: nikoli se ne shranijo v
// zbirko (tudi ne, ko jih reši reševalec, ali z uvozom) in se ne štejejo; napredek
// igranja primera je samo v shranjenih igrah (sudoku.igra.v1). Nov primer = nova
// vrstica tu. Danosti morajo biti preverjene (countSolutions() === 1) in zapisane v
// docs/uganke.md; '0' ali '.' = prazna celica. `tezavnost` je rezultat oceniUganko()
// (shared/generator.js) - to preverja tests/generator.test.js.
const PRIMERI = [
  { ime: 'Primer 1 (z ugibanjem)', tezavnost: 'Ekstrem', danosti: '000800020900000600000000000604000900000720003500000000000056000080009000070000010' }, // example-app
  { ime: 'Primer 2 (Ekstrem, brez ugibanja)', tezavnost: 'Zelo težka', danosti: '8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4' }, // oakever-ekstrem-lv4
  { ime: 'Primer 3 (srednja – presek)', tezavnost: 'Srednja', danosti: '.73..4..2.49.6.8..1.58............26....9.37.387..2...492.7.6.......9.5.5..2.69.7' }, // lahka-seme-197
  { ime: 'Primer 4 (srednja – trojica)', tezavnost: 'Srednja', danosti: '..4..7.251....3....7.8.....8...9..34.4...5..996....572..1..6.................4761' }, // srednja-a
  { ime: 'Primer 5 (lahka)', tezavnost: 'Lahka', danosti: '876.....4......7.....2..58..34.1.8..21..69......3.5.7.......6...4..769....8....4.' }, // lahka-seme-1
];

// Vgrajeni primer s temi danostmi ('0' ali '.' = prazna celica) ali null.
function zbirkaPrimerZa(danosti) {
  const d = String(danosti || '').replace(/\./g, '0');
  return PRIMERI.find(p => p.danosti.replace(/\./g, '0') === d) || null;
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

// Igra (igra/stanje.js) shranjuje napredek vsake uganke posebej: { zadnja, igre:
// { [danosti]: { poteze, kazalec, znova, zacetek, nazadnje } } }. Piše samo igra;
// tu je branje in odigravanje potez, ker stanje uganke (spodaj) potrebuje tudi
// reševalec, ki igra/stanje.js ne naloži.
const IGRA_KLJUC = 'sudoku.igra.v1';

// Odigra eno potezo: vpisi[c] = uporabnikova števka (0 = brez vpisa),
// odstranjeni[c] = maska ročno odstranjenih kandidatov.
function odigrajPotezo(vpisi, odstranjeni, p) {
  if (p.tip === 'vpis') vpisi[p.celica] = p.stevka;
  else if (p.tip === 'kandidati') for (const c of p.celice) odstranjeni[c] |= 1 << p.stevka;
  else if (p.odstrani) odstranjeni[p.celica] |= 1 << p.stevka;
  else odstranjeni[p.celica] &= ~(1 << p.stevka);
}

// Odigra prvih n potez.
function odigrajPoteze(danosti, poteze, n) {
  const vpisi = new Array(81).fill(0);
  const odstranjeni = new Array(81).fill(0);
  for (let i = 0; i < n; i++) odigrajPotezo(vpisi, odstranjeni, poteze[i]);
  return { vpisi, odstranjeni };
}

function igreBeri() {
  try {
    const s = JSON.parse(localStorage.getItem(IGRA_KLJUC) || 'null');
    if (s && typeof s === 'object' && s.igre && typeof s.igre === 'object') return s;
  } catch (e) { /* brez shrambe */ }
  return { zadnja: null, igre: {} };
}

// Kazalec, na katerem se shranjena igra odpre (igraIzZapisa v igra/stanje.js). Ostane,
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
    const vpisanih = Math.max(0, Math.min(praznih, izpolnjenoZapisa - (81 - praznih)));
    p = { vpisanih, polna: izpolnjenoZapisa >= 81, napaka: !!z.napaka };
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
    `Program rešil: ${zbirkaProgramResil(z) || '—'}`,
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
// 1. vrstica (naslov): "Težka · ročni vnos · dodana 21. 9. 2026 ob 16:33", pri
//    vgrajenem primeru njegovo ime;
// 2. vrstica (stanje) je vedno: "nova", "zadnje reševanje … · v teku (12/57)",
//    "rešena …" ali "rešena … · znova v teku (12/57)" (zbirkaPrikazCasov); primer
//    je brez časa (čas shranjene igre se osveži že ob odprtju);
// 3. vrstica (info): "danih 24 · tehnike: 1, 3, 7 + poskus · 42 korakov", pri delni
//    rešitvi še "· program rešil delno (36/57)"; primer samo "danih 17" (podatkov
//    reševanja nima).
// `gumb` (Igraj / Nadaljuj / Poglej) je iz istega stanja kot 2. vrstica.
function zbirkaKartica(danosti, z, povzetek) {
  const primer = zbirkaPrimerZa(danosti);
  const st = zbirkaStanjeUganke(danosti, z, povzetek);
  const dodana = z && z.dodano ? `dodana ${zbirkaPrikazDatuma(z.dodano)}` : '';
  const naslov = primer ? primer.ime
    : [(z && z.tezavnost) || 'težavnost ni določena', zbirkaOpisIzvora(z), dodana].filter(Boolean).join(' · ');

  let stanje = z ? zbirkaPrikazCasov(z, povzetek).igranje : null;
  if (!stanje) stanje = { predpona: '', besedilo: st.napredek, kljuc: st.kljuc, napaka: st.napaka };

  const info = [`danih ${81 - st.praznih}`];
  if (z) {
    info.push(zbirkaOznakaTehnik(z));
    if (!zbirkaPrazno(z.koraki)) info.push(zbirkaStKorakov(z.koraki));
    if (!zbirkaPrazno(z.reseno) && z.reseno < 81) info.push(`program rešil ${zbirkaProgramResil(z)}`);
  }
  return {
    primer: primer ? primer.ime : null,
    naslov,
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

// Podatki iz dnevnika solve(). Psevdo-koraka 'OBSTALO'/'NAPAKA' (reševalec
// se je ustavil) nista pravi koraki, zato ju ne štejemo.
function zbirkaPodatkiResevanja(board, log) {
  const pravi = log.filter(s => s.technique !== 'OBSTALO' && s.technique !== 'NAPAKA');
  const stevci = {};
  pravi.forEach(s => { stevci[s.technique] = (stevci[s.technique] || 0) + 1; });
  return {
    reseno: board.grid.filter(v => v !== 0).length,
    koraki: pravi.length,
    ugibanje: pravi.filter(s => s.technique.startsWith('Poskus in protislovje')).length,
    tehnike: Object.entries(stevci).sort((a, b) => b[1] - a[1]),
  };
}

// Nova uganka dobi privzeto težavnost in izvor iz `dodatno` ({ tezavnost, izvor });
// pri že shranjeni se posodobijo samo datum zadnjega reševanja in izračunani podatki
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
    if (!zapis.tezavnost) zapis.tezavnost = PRIVZETA_TEZAVNOST;
  } else {
    zapis = {
      danosti: givens,
      tezavnost: dodatno.tezavnost || PRIVZETA_TEZAVNOST,
      izvor: zbirkaIzvor(dodatno.izvor),
      dodano: cas, nazadnje: cas, ...podatki, opomba: '',
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
// (sicer jih piše samo igra/stanje.js). Vrne true, če je zapisano.
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

// Izbriše vso zbirko in shranjene igre njenih ugank (igre primerov ostanejo).
// Vrne { stevilo, ok }: število izbrisanih ugank in ali je zapisano.
function zbirkaIzbrisiVse() {
  const zbirka = zbirkaBeri();
  const ok = zbirkaPisi([]);
  return { stevilo: zbirka.length, ok: zbirkaIzbrisiIgre(zbirka.map(z => z.danosti)) && ok };
}

// Besedili potrditve brisanja - enaki v reševalcu in igri.
function zbirkaVprasanjeIzbrisi(z) {
  return `Izbrišem uganko, dodano ${zbirkaPrikazDatuma(z.dodano)} (${z.tezavnost || 'težavnost ni določena'})? ` +
    'Izbriše se tudi njen shranjeni napredek.';
}

function zbirkaVprasanjeIzbrisiVse(n) {
  return `Izbrišem vse uganke iz zbirke (${n}) in njihov shranjeni napredek? Vgrajeni primeri ostanejo. ` +
    'Priporočam, da zbirko najprej izvoziš (gumb »Izvozi«) – izbrisa ni mogoče razveljaviti.';
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
      vrstice.push(`- **Tehnike:** ${z.tehnike.length ? z.tehnike.map(([t, n]) => `${t} ${n}`).join(', ') : '(brez)'}`);
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
    const deli = s.tehnike.split(',').map(t => /^(.*\S)\s+(\d+)$/.exec(t.trim()));
    if (deli.every(Boolean)) tehnike = deli.map(m => [m[1], parseInt(m[2], 10)]);
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
  if (!zbirka.length) return { besedilo: null, sporocilo: 'Zbirka je prazna - ni česa izvoziti.', napaka: true };
  return {
    besedilo: zbirkaVMarkdown(zbirka),
    sporocilo: `Izvoženih ugank: ${zbirka.length} (datoteka ${ZBIRKA_DATOTEKA}).`,
    napaka: false,
  };
}

// Uvoz besedila datoteke (Markdown) v zbirko tega brskalnika: nove uganke
// doda, obstoječe le dopolni (zbirkaZdruzi). Vrne { sporocilo, napaka,
// spremenjeno } - spremenjeno = zbirka je bila zapisana (osveži prikaz).
function zbirkaUvozi(besedilo) {
  const { zapisi, neveljavni, primerov } = zbirkaIzMarkdowna(besedilo);
  if (!zapisi.length && !neveljavni && !primerov) {
    return { sporocilo: 'V datoteki ni nobene uganke (pričakujem vrstice oblike "- **Danosti:** `...`").', napaka: true, spremenjeno: false };
  }
  const zbirka = zbirkaBeri();
  const p = zbirkaZdruzi(zbirka, zapisi, zbirkaZdaj());
  if (!zbirkaPisi(zbirka)) {
    return { sporocilo: 'Uvoza ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', napaka: true, spremenjeno: false };
  }
  return {
    sporocilo: `Uvoz končan - novih: ${p.novi} · dopolnjenih: ${p.dopolnjeni} · že obstoječih brez sprememb: ${p.nespremenjeni}` +
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

// Katere tehnike uganka zahteva, s številkami iz treninga (TRENING_TEHNIKE v
// shared/engine.js): "tehnike: 1, 3, 7 + poskus". Iz polja z.tehnike ([[ime,
// število], ...] iz reševanja). Enojčki se ne izpišejo (osnova vsake uganke),
// poskus s protislovjem je oznaka "+ poskus" (pri več "+ poskus ×2"); ime, ki ga
// ni med tehnikami (npr. iz starejšega izvoza), se izpiše kar z imenom.
function zbirkaOznakaTehnik(z) {
  if (!z || !Array.isArray(z.tehnike)) return 'tehnike: ni podatkov';
  const stevilke = [];
  const neznane = [];
  let poskusi = 0;
  for (const [ime, n] of z.tehnike) {
    const i = TRENING_TEHNIKE.findIndex(([, t]) => t === ime);
    if (i >= 0) stevilke.push(i + 1);
    else if (/protislovje/.test(ime)) poskusi += n;
    else if (!ALL_TECHNIQUES.some(([t]) => t === ime)) neznane.push(ime);
  }
  const deli = stevilke.sort((a, b) => a - b).map(String).concat(neznane);
  let s = deli.length ? deli.join(', ') : 'samo enojčki';
  if (poskusi) s += ' + poskus' + (poskusi > 1 ? ` ×${poskusi}` : '');
  return 'tehnike: ' + s;
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
