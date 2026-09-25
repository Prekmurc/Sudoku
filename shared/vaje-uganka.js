/* ==================== VAJE IZ UGANKE ====================
   Trening "Vadi v uganki" (docs/trening-v-uganki-nacrt.md, del 2): pravo stanje
   uganke, v katerem je naslednji korak motorja izbrana tehnika. Brez DOM-a
   (testabilno v Node, glej tests/vaje-uganka.test.js). Naloži se za
   shared/engine.js, shared/generator.js (genMinimalnaUganka, genMere, STOPNJE_UGANK)
   in shared/stanje.js (igraZZacetkom, stanjeIgre).

   Tehnika je vedno ključ iz ALL_TECHNIQUES ('Gol enojček', 'Swordfish' ...), ime za
   prikaz da imeTehnike().

   - stanjaVUganki(danosti, kljuc): stanja na poti motorja, v katerih je naslednji
     korak tehnika kljuc;
   - vajaIzStanja(danosti, kljuc, stanje, stopnja): vaja kot igra z začetnimi
     potezami (vpisi in izbrisi poti), ki jih "Razveljavi" ne vrne;
   - vajaIzUganke(danosti, kljuc, rnd): naključno ustrezno stanje uganke kot vaja;
   - preveriVajo(vaja, stanje, predlog): presoja odgovora (tabela 3.2 v
     docs/trening-v-uganki.md in vrstni red izidov v načrtu);
   - preveriEnojcek(), namigEnojcka(): presoja in namig pri enojčkih - skupni z
     načinom "Spoznaj" (trening/generators.js). */

const ENOJCKA_KLJUCI = ['Gol enojček', 'Skriti enojček'];
// V vaji E1 mora biti vsaj toliko praznih celic (ne tik pred koncem, ko so očitni
// enojčki povsod) - isto kot ENOJCEK_NAJMANJ_PRAZNIH v "Spoznaj".
const VAJA_E1_NAJMANJ_PRAZNIH = 30;

const jeEnojcek = kljuc => ENOJCKA_KLJUCI.includes(kljuc);
const jePoskus = k => !k || k.technique.startsWith(POSKUS_KLJUC);

/* ---------- stanja na poti ---------- */

// Pot od danosti z nextStep(b) BREZ prednosti števke (strogo: kljuc je prva tehnika
// po ALL_TECHNIQUES, ki v stanju kaj najde), do rešitve ali do prvega poskusa s
// protislovjem - stanja za njim imajo kandidate, izbrisane z ugibanjem. Stanja pred
// poskusom so veljavna (uganka je lahko "Presega tehnike").
// Vrne { stanja, poskus, stopnja }:
// - stanja: [{ grid, cand, praznih, cisto }] - vsa stanja, v katerih je naslednji korak
//   kljuc; cisto = pred njim so bili na poti sami enojčki (kandidati so natanko tisti,
//   ki jih dovolijo števke). Pri E1 in E2 so samo čista stanja (vaja je brez
//   kandidatov, igralec ne sme potrebovati izbrisov, ki jih ne vidi), pri E1 še z
//   vsaj VAJA_E1_NAJMANJ_PRAZNIH praznimi celicami;
// - poskus: pot se je ustavila pri poskusu s protislovjem (ali se je zataknila);
// - stopnja: ime stopnje uganke iz tehnik na poti ali "Presega tehnike" - samo
//   informacija (pot je ista kot genPot() v oceniTezavnost(); ena rešitev je pogoj
//   klicatelja, genMinimalnaUganka() jo zagotovi).
function stanjaVUganki(danosti, kljuc) {
  const b = new Board(danosti);
  const stanja = [];
  const uporabljene = new Set();
  let samiEnojcki = true;
  let poskus = false;
  for (let i = 0; i < 500 && !b.isSolved(); i++) {
    const k = nextStep(b);
    if (jePoskus(k)) { poskus = true; break; }
    if (k.technique === kljuc) {
      const praznih = b.grid.filter(v => v === 0).length;
      const ustreza = !jeEnojcek(kljuc)
        || (samiEnojcki && (kljuc !== 'Gol enojček' || praznih >= VAJA_E1_NAJMANJ_PRAZNIH));
      if (ustreza) stanja.push({ grid: b.grid.slice(), cand: b.cand.slice(), praznih, cisto: samiEnojcki });
    }
    uporabljene.add(k.technique);
    if (!jeEnojcek(k.technique)) samiEnojcki = false;
    applyStep(b, k);
  }
  if (!b.isSolved()) poskus = true;
  let stopnja = OCENA_PRESEGA;
  if (!poskus) {
    const mere = genMere(uporabljene);
    const s = STOPNJE_UGANK.find(x => x.ustreza(mere));
    stopnja = s ? s.ime : '';
  }
  return { stanja, poskus, stopnja };
}

/* ---------- vaja kot igra ---------- */

// Vaja iz stanja na poti: stanje je zapisano kot igra - vpisi poti so poteze 'vpis',
// izbrisi poti (razlika med kandidati, ki jih dovolijo števke, in kandidati na poti)
// so poteze 'kandidat'. Vse so začetne poteze (igraZZacetkom): "Razveljavi" jih ne
// vrne, izbrisanih kandidatov ni mogoče vrniti. Tako je vaja isto stanje igre, v
// katerem bi igralec te poteze naredil sam.
// Vrne { danosti, kljuc, igra, S0, KT, KV, resitev, stopnja, prejOdstranjenih } ali
// null (poteze niso dovoljene - ne bi se smelo zgoditi):
// - S0: stanjeIgre() na začetku vaje,
// - KT: vsi koraki tehnike kljuc v S0 (ne samo prvi - pravilen je vsak),
// - KV: koraki vseh tehnik v S0 (po vrstnem redu ALL_TECHNIQUES),
// - resitev: solutionOf(danosti) (81 števk),
// - prejOdstranjenih: koliko kandidatov je odstranjenih pred vajo (vrstica nad mrežo).
function vajaIzStanja(danosti, kljuc, stanje, stopnja = '') {
  const vpisi = [];
  const izbrisi = [];
  const osnova = new Board(stanje.grid.join(''));
  for (let c = 0; c < 81; c++) {
    if (danosti[c] === '0' && stanje.grid[c]) vpisi.push({ tip: 'vpis', celica: c, stevka: stanje.grid[c] });
  }
  for (let c = 0; c < 81; c++) {
    if (stanje.grid[c]) continue;
    for (const d of bitsOf(osnova.cand[c] & ~stanje.cand[c])) {
      izbrisi.push({ tip: 'kandidat', celica: c, stevka: d, odstrani: true });
    }
  }
  const igra = igraZZacetkom(danosti, [...vpisi, ...izbrisi]);
  if (!igra) return null;
  const S0 = stanjeIgre(igra);
  const fn = ALL_TECHNIQUES.find(([ime]) => ime === kljuc)[1];
  return {
    danosti,
    kljuc,
    igra,
    S0,
    KT: fn(S0.deska),
    KV: ALL_TECHNIQUES.flatMap(([, f]) => f(S0.deska)),
    resitev: solutionOf(danosti),
    stopnja,
    prejOdstranjenih: izbrisi.length,
  };
}

// Naključno ustrezno stanje uganke kot vaja (iz ene uganke jih je pri E1, E2 in
// Pointing več, zato ne vedno prvo) ali null, če ga v uganki ni.
function vajaIzUganke(danosti, kljuc, rnd = Math.random) {
  const { stanja, stopnja } = stanjaVUganki(danosti, kljuc);
  if (!stanja.length) return null;
  return vajaIzStanja(danosti, kljuc, stanja[Math.floor(rnd() * stanja.length)], stopnja);
}

/* ---------- presoja odgovora ---------- */

// "1 izbris", "2 izbrisa", "3 izbrisi", "5 izbrisov".
function steviloIzbrisov(n) {
  const m = n % 100;
  return `${n} ${m === 1 ? 'izbris' : m === 2 ? 'izbrisa' : m === 3 || m === 4 ? 'izbrisi' : 'izbrisov'}`;
}
function manjkaIzbrisov(n) {
  const m = n % 100;
  const glagol = m === 1 ? 'manjka' : m === 2 ? 'manjkata' : m === 3 || m === 4 ? 'manjkajo' : 'manjka';
  return `${glagol} še ${steviloIzbrisov(n)}`;
}
function izbrisDrzi(n) {
  if (n === 1) return 'Izbris drži, a ga v tem koraku ne utemelji nobena tehnika.';
  if (n === 2) return 'Izbrisa držita, a ju v tem koraku ne utemelji nobena tehnika.';
  return 'Izbrisi držijo, a jih v tem koraku ne utemelji nobena tehnika.';
}
const kratkoIme = kljuc => imeTehnike(kljuc, { stevilka: true, anglesko: false });

// Presoja odgovora ob "Preveri". `stanje` = stanjeIgre() trenutne igre vaje, `predlog`
// = { celica, stevka } pri E1/E2 (vpis je predlog, ne poteza). Vrne { izid, sporocilo,
// korak, razveljavi }; `razveljavi` = [[celica, števka], ...] - izbrisi, ki jih UI
// samodejno razveljavi (vrne kandidata), sporočilo jih našteje.
//
// E1/E2: preveriEnojcek() - izid 'pravilno', 'nevtralno' (prava števka, ki je ta
// tehnika ne dokaže; ne šteje) ali 'napacno'; brez predloga 'prazno'.
//
// 1-12: odgovor R so kandidati, ki so bili v S0 in jih je igralec ročno odstranil (v
// celicah, ki so še prazne; vpisov ta vaja ne presoja - niz "Vpiši" je skrit).
// Vrstni red izidov (velja prvi, ki drži; odločitev 2026-09-25):
//   prazno        R je prazen;
//   napacno       v R je prava števka celice (rešitev) - "Poskusi znova" vrne na S0;
//   neutemeljeno  v R je izbris, ki ga ne utemelji noben korak iz KV (kandidat ni
//                 prava števka, a iz S0 ne sledi v enem koraku) - ni napaka, ne šteje;
//   druga-tehnika vsak izbris zunaj KT utemelji kak korak iz KV - ne šteje;
//   delno         vsi izbrisi so iz korakov KT, noben korak pa ni cel;
//   pravilno      vsi izbrisi so iz korakov KT in vsaj en korak je cel (dodatni
//                 izbrisi iz drugega koraka KT niso napaka - utemelji jih ista tehnika).
// Pri neutemeljeno in druga-tehnika se razveljavijo VSI izbrisi zunaj KT (tudi tisti,
// ki bi jih utemeljila druga tehnika), izbrisi iz KT ostanejo.
function preveriVajo(vaja, stanje, predlog = null) {
  const S0 = vaja.S0;
  if (jeEnojcek(vaja.kljuc)) {
    if (!predlog) return { izid: 'prazno', sporocilo: 'Izberi celico in vpiši števko.', korak: null, razveljavi: [] };
    const ex = {
      vrsta: vaja.kljuc === 'Gol enojček' ? 'naked' : 'hidden',
      boardGrid: S0.grid, boardCand: S0.kandidati, resitev: vaja.resitev.join(''),
    };
    const r = preveriEnojcek(ex, predlog.celica, predlog.stevka);
    const izid = { prav: 'pravilno', nevtralno: 'nevtralno', narobe: 'napacno' }[r.izid];
    return { izid, sporocilo: r.sporocilo, korak: r.korak || null, razveljavi: [] };
  }

  const R = [];
  for (let c = 0; c < 81; c++) {
    if (S0.grid[c] || stanje.grid[c]) continue;
    for (const d of bitsOf(S0.kandidati[c] & stanje.odstranjeni[c])) R.push([c, d]);
  }
  const kljucIzbrisa = ([c, d]) => c * 10 + d;
  const vR = new Set(R.map(kljucIzbrisa));
  if (!R.length) {
    return { izid: 'prazno', sporocilo: 'Odstrani kandidate, ki jih tehnika izloči.', korak: null, razveljavi: [] };
  }

  const napaka = R.find(([c, d]) => vaja.resitev[c] === d);
  if (napaka) {
    const [c, d] = napaka;
    return {
      izid: 'napacno',
      sporocilo: `Števka ${d} je v ${cellLabel(c)} prava – tega kandidata ne smeš odstraniti.`,
      korak: null, razveljavi: [],
    };
  }

  const vKT = new Set(vaja.KT.flatMap(k => k.eliminate.map(kljucIzbrisa)));
  const zunaj = R.filter(e => !vKT.has(kljucIzbrisa(e)));
  const utemelji = e => vaja.KV.find(k => k.eliminate.some(x => kljucIzbrisa(x) === kljucIzbrisa(e))) || null;
  const neutemeljeni = zunaj.filter(e => !utemelji(e));
  if (neutemeljeni.length) {
    return {
      izid: 'neutemeljeno',
      sporocilo: `${izbrisDrzi(neutemeljeni.length)} Razveljavljeno: ${elimLabel(zunaj)}.`,
      korak: null, razveljavi: zunaj,
    };
  }
  if (zunaj.length) {
    const korak = utemelji(zunaj[0]);
    return {
      izid: 'druga-tehnika',
      sporocilo: `To drži, a je to korak tehnike ${kratkoIme(korak.technique)}, ne ${kratkoIme(vaja.kljuc)}. Razveljavljeno: ${elimLabel(zunaj)}.`,
      korak, razveljavi: zunaj,
    };
  }

  const manjka = k => k.eliminate.filter(e => !vR.has(kljucIzbrisa(e))).length;
  const cel = vaja.KT.find(k => manjka(k) === 0);
  if (cel) return { izid: 'pravilno', sporocilo: `Pravilno! ${cel.message}`, korak: cel, razveljavi: [] };
  let najblizji = null;
  for (const k of vaja.KT) {
    if (!k.eliminate.some(e => vR.has(kljucIzbrisa(e)))) continue;
    if (!najblizji || manjka(k) < manjka(najblizji)) najblizji = k;
  }
  return {
    izid: 'delno',
    sporocilo: `Prav, a to še ni ves korak – ${manjkaIzbrisov(manjka(najblizji))}.`,
    korak: najblizji, razveljavi: [],
  };
}

/* ---------- enojčka (skupno s "Spoznaj") ---------- */

// Enota za namig: "vrstico 4" / "stolpec 7" / "blok 5" in zaimek v mestniku.
function enotaZaNamig(unit) {
  const loc = unitNameLoc(unit), [vrsta, st] = loc.split(' ');
  if (vrsta === 'vrstici') return { tozilnik: `vrstico ${st}`, vNjej: 'v njej' };
  return { tozilnik: `${vrsta === 'stolpcu' ? 'stolpec' : 'blok'} ${st}`, vNjej: 'v njem' };
}
function celicZEnoStevko(n) {
  return n === 1 ? 'je 1 celica' : n === 2 ? 'sta 2 celici' : n <= 4 ? `so ${n} celice` : `je ${n} celic`;
}

// Namig pri enojčkih: `koraki` = vsi koraki tehnike v stanju, `korak` = izbrani.
// E1: koliko celic ima eno samo možno števko in blok ene od njih; E2: samo enota.
function namigEnojcka(gol, koraki, korak) {
  if (gol) {
    const celic = new Set(koraki.map(s => s.assign[0][0])).size;
    return `V mreži ${celicZEnoStevko(celic)} z eno samo možno števko. Ena je v bloku ${boxOf(korak.assign[0][0]) + 1}.`;
  }
  const e = enotaZaNamig(korak.hint.unit);
  return `Poglej ${e.tozilnik}: katera števka, ki je ${e.vNjej} še ni, je mogoča samo na enem mestu?`;
}

// Preverjanje odgovora pri enojčkih (vpis števke v celico). `ex` = { vrsta: 'naked' |
// 'hidden', boardGrid, boardCand, resitev (niz 81 števk) } - vaja iz "Spoznaj" ali
// preveriVajo() zgoraj. Vrne { izid, sporocilo, korak }: izid 'prav' (korak te
// tehnike na mreži vaje), 'nevtralno' (števka je prava, a je ta tehnika še ne dokaže -
// ne šteje se) ali 'narobe'.
function preveriEnojcek(ex, celica, stevka) {
  const b = { grid: ex.boardGrid, cand: ex.boardCand };
  const lbl = cellLabel(celica);
  if (b.grid[celica] !== 0) return { izid: 'nevtralno', sporocilo: `${lbl} je že izpolnjena – izberi prazno celico.` };
  const gol = ex.vrsta === 'naked';
  const korak = (gol ? nakedSingles : hiddenSingles)(b).find(s => s.assign[0][0] === celica && s.assign[0][1] === stevka);
  if (korak) return { izid: 'prav', sporocilo: korak.message, korak };
  // Kandidati izhajajo samo iz števk na mreži: števka, ki ni kandidat, je v kaki enoti celice že vpisana.
  if (!(b.cand[celica] & (1 << stevka))) {
    const u = UNITS_OF[celica].find(u => u.some(c => b.grid[c] === stevka));
    const kje = u.find(c => b.grid[c] === stevka);
    return { izid: 'narobe', sporocilo: `Števka ${stevka} je v ${unitNameLoc(u)} že vpisana (${cellLabel(kje)}).` };
  }
  if (+ex.resitev[celica] === stevka) {
    if (gol) {
      const skriti = hiddenSingles(b).some(s => s.assign[0][0] === celica && s.assign[0][1] === stevka);
      return {
        izid: 'nevtralno', sporocilo: skriti
          ? `Števka je prava, a to je skriti enojček: v ${lbl} so mogoče še druge števke. Poišči celico, v kateri ostane ena sama.`
          : `Števka je prava, a v ${lbl} so mogoče še druge števke – očitni enojček je še ne dokaže.`,
      };
    }
    return { izid: 'nevtralno', sporocilo: `Števka je prava, a skriti enojček je še ne dokaže: ${stevka} je v vrstici, stolpcu in bloku celice ${lbl} mogoča še drugje.` };
  }
  return {
    izid: 'narobe', sporocilo: gol
      ? `V ${lbl} je mogočih več števk, zato to ni očitni enojček.`
      : `Števka ${stevka} je v vrstici, stolpcu in bloku celice ${lbl} mogoča še drugje, zato to ni skriti enojček.`,
  };
}
