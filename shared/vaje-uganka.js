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
   - tehnikeVUganki(danosti): vse tehnike, za katere ima uganka stanje vaje (ena
     pot; banka vaj shared/vaje-banka.js, del 3);
   - vajaIzStanja(danosti, kljuc, stanje, stopnja): vaja kot igra z začetnimi
     potezami (vpisi in izbrisi poti), ki jih "Razveljavi" ne vrne;
   - vajaIzUganke(danosti, kljuc, rnd): naključno ustrezno stanje uganke kot vaja;
   - preveriVajo(vaja, stanje, predlog): presoja odgovora (tabela 3.2 v
     docs/trening-v-uganki.md in vrstni red izidov v načrtu);
   - stopnjaTehnike(), rangUganke(), izberiIzBanke(), najnizjiRangBanke(): izbira uganke
     po stopnji - osnovna stopnja tehnike (iz ravni v shared/generator.js), nato višje,
     "Presega tehnike" zadnja (banka vaj in sprotno iskanje v treningu);
   - korakVecCelic(), vecCelicVStanjih(), delezVecCelic(): ali korak izbriše isto števko
     iz več celic, štetje v uganki (banka) in delež tehnike iz banke - privzeti vklop
     kljukice "več celic" v treningu;
   - obmocjeKoraka(), vObmocju(): območje koraka za postopnost v krogu (vaje 1-6 v
     "Vadi v uganki" - enota, števka, par, pivot ali bloka); presoja se zaradi njega ne
     spremeni, pravilen je tudi korak zunaj območja;
   - preveriEnojcek(), namigEnojcka(): presoja in namig pri enojčkih - skupni z
     načinom "Spoznaj" (trening/generators.js; tam tudi namig po stopnji postopnosti). */

const ENOJCKA_KLJUCI = ['Gol enojček', 'Skriti enojček'];
// V vaji E1 mora biti vsaj toliko praznih celic (ne tik pred koncem, ko so očitni
// enojčki povsod) - isto kot ENOJCEK_NAJMANJ_PRAZNIH v "Spoznaj".
const VAJA_E1_NAJMANJ_PRAZNIH = 30;

const jeEnojcek = kljuc => ENOJCKA_KLJUCI.includes(kljuc);
const jePoskus = k => !k || k.technique.startsWith(POSKUS_KLJUC);

/* ---------- stanja na poti ---------- */

// Stanje na poti, v katerem je naslednji korak tehnika kljuc, je primerno za vajo:
// pri E1 in E2 samo čisto stanje (vaja je brez kandidatov, igralec ne sme potrebovati
// izbrisov, ki jih ne vidi), pri E1 še z vsaj VAJA_E1_NAJMANJ_PRAZNIH praznimi celicami.
function ustrezaVaji(kljuc, samiEnojcki, praznih) {
  return !jeEnojcek(kljuc)
    || (samiEnojcki && (kljuc !== 'Gol enojček' || praznih >= VAJA_E1_NAJMANJ_PRAZNIH));
}

// Pot od danosti z nextStep(b) BREZ prednosti števke (strogo: tehnika koraka je prva
// po ALL_TECHNIQUES, ki v stanju kaj najde), do rešitve ali do prvega poskusa s
// protislovjem - stanja za njim imajo kandidate, izbrisane z ugibanjem. Stanja pred
// poskusom so veljavna (uganka je lahko "Presega tehnike"). Pred vsakim korakom
// pokliče obKoraku(k, b, samiEnojcki, praznih) - samiEnojcki = pred tem stanjem so
// bili na poti sami enojčki (kandidati so natanko tisti, ki jih dovolijo števke).
// Vrne { poskus, stopnja }:
// - poskus: pot se je ustavila pri poskusu s protislovjem (ali se je zataknila);
// - stopnja: ime stopnje uganke iz tehnik na poti ali "Presega tehnike" - samo
//   informacija (pot je ista kot genPot() v oceniTezavnost(); ena rešitev je pogoj
//   klicatelja, genMinimalnaUganka() jo zagotovi).
function prehodiPot(danosti, obKoraku) {
  const b = new Board(danosti);
  const uporabljene = new Set();
  let samiEnojcki = true;
  let poskus = false;
  for (let i = 0; i < 500 && !b.isSolved(); i++) {
    const k = nextStep(b);
    if (jePoskus(k)) { poskus = true; break; }
    obKoraku(k, b, samiEnojcki, b.grid.filter(v => v === 0).length);
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
  return { poskus, stopnja };
}

// Stanja uganke za vajo tehnike kljuc. Vrne { stanja, poskus, stopnja } (poskus in
// stopnja kot pri prehodiPot()):
// - stanja: [{ grid, cand, praznih, cisto }] - vsa stanja na poti, v katerih je
//   naslednji korak kljuc in ki ustrezajo vaji (ustrezaVaji()); cisto = pred njim so
//   bili na poti sami enojčki.
function stanjaVUganki(danosti, kljuc) {
  const stanja = [];
  const { poskus, stopnja } = prehodiPot(danosti, (k, b, samiEnojcki, praznih) => {
    if (k.technique === kljuc && ustrezaVaji(kljuc, samiEnojcki, praznih)) {
      stanja.push({ grid: b.grid.slice(), cand: b.cand.slice(), praznih, cisto: samiEnojcki });
    }
  });
  return { stanja, poskus, stopnja };
}

// Vse tehnike, za katere ima uganka vsaj eno stanje vaje (stanjaVUganki() ni prazen),
// z eno samo potjo - za banko vaj (tools/ustvari-banko-vaj.js, shared/vaje-banka.js).
// Vrne { tehnike, poskus, stopnja }; tehnike so ključi po vrstnem redu ALL_TECHNIQUES.
function tehnikeVUganki(danosti) {
  const najdene = new Set();
  const { poskus, stopnja } = prehodiPot(danosti, (k, b, samiEnojcki, praznih) => {
    if (ustrezaVaji(k.technique, samiEnojcki, praznih)) najdene.add(k.technique);
  });
  return { tehnike: ALL_TECHNIQUES.map(([k]) => k).filter(k => najdene.has(k)), poskus, stopnja };
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
    return { izid: 'prazno', sporocilo: 'Izbriši kandidate, ki zaradi iskanega koraka odpadejo.', korak: null, razveljavi: [] };
  }

  const napaka = R.find(([c, d]) => vaja.resitev[c] === d);
  if (napaka) {
    const [c, d] = napaka;
    return {
      izid: 'napacno',
      sporocilo: `Števka ${d} je v ${cellLabel(c)} prava – tega kandidata ne smeš izbrisati.`,
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

/* ---------- stopnja uganke za vajo (docs/vadi-v-uganki-nacrt.md, točka 16) ---------- */

// Stopnje v vrstnem redu izbire: STOPNJE_UGANK (Lahka ... Ekstrem), nato "Presega tehnike".
function stopnjeZaVajo() {
  return [...STOPNJE_UGANK.map(s => s.ime), OCENA_PRESEGA];
}

// Osnovna stopnja tehnike: stopnja uganke, ki uporabi samo to tehniko (poleg enojčkov) -
// iz ravni GEN_LAHKE ... GEN_EKSPERTNE in STOPNJE_UGANK v shared/generator.js, zato velja
// tudi za pozneje dodane tehnike. Uganka, ki tehniko uporabi na poti, nima nižje stopnje.
function stopnjaTehnike(kljuc) {
  const s = STOPNJE_UGANK.find(x => x.ustreza(genMere(new Set([kljuc]))));
  return s ? s.ime : OCENA_PRESEGA;
}

// Rang uganke za vajo tehnike: 0 = osnovna stopnja, 1, 2 ... = višje stopnje,
// "Presega tehnike" je zadnja; neznana stopnja ('') je za njo.
function rangUganke(stopnja, kljuc) {
  const red = stopnjeZaVajo();
  const i = red.indexOf(stopnja);
  if (i < 0) return red.length;
  return Math.max(0, i - red.indexOf(stopnjaTehnike(kljuc)));
}

// Najnižji rang med zapisi banke s tehniko, ki v seji še niso bili uporabljeni
// (uporabljene = Set semen; če so uporabljeni vsi, med vsemi), ali Infinity, če tehnike v
// banki ni.
function najnizjiRangBanke(banka, kljuc, uporabljene) {
  const zapisi = banka.filter(z => z.tehnike.includes(kljuc));
  const proste = zapisi.filter(z => !uporabljene.has(z.seme));
  return Math.min(...(proste.length ? proste : zapisi).map(z => rangUganke(z.stopnja, kljuc)));
}

// Zapis banke za vajo tehnike: najnižji rang med neuporabljenimi (osnovna stopnja, ko je
// zmanjka, naslednja ... "Presega tehnike" zadnja), v njem naključen zapis; ko so
// uporabljeni vsi zapisi s tehniko, se izbira začne znova (uporabljene se izpraznijo).
// Izbrani zapis se doda v uporabljene. Vrne zapis ali null (tehnike ni v banki).
function izberiIzBanke(banka, kljuc, uporabljene, rnd = Math.random) {
  const zapisi = banka.filter(z => z.tehnike.includes(kljuc));
  if (!zapisi.length) return null;
  let proste = zapisi.filter(z => !uporabljene.has(z.seme));
  if (!proste.length) {
    uporabljene.clear();
    proste = zapisi;
  }
  const rang = Math.min(...proste.map(z => rangUganke(z.stopnja, kljuc)));
  const kandidati = proste.filter(z => rangUganke(z.stopnja, kljuc) === rang);
  const z = kandidati[Math.floor(rnd() * kandidati.length)];
  uporabljene.add(z.seme);
  return z;
}

/* ---------- "več celic" privzeto po tehniki (docs/vadi-v-uganki-nacrt.md, točka 18) ---------- */

// Korak potrebuje izbiro več celic, če je ista števka izbrisana iz 2 ali več celic.
function korakVecCelic(korak) {
  const celic = {};
  for (const [c, d] of korak.eliminate) (celic[d] = celic[d] || new Set()).add(c);
  return Object.values(celic).some(s => s.size >= 2);
}

// [korakov, z isto števko iz 2+ celic] čez vsa stanja vaje tehnike v uganki (vsi koraki
// KT) - zapis vecCelic v banki (tools/ustvari-banko-vaj.js).
function vecCelicVStanjih(danosti, kljuc) {
  const { stanja, stopnja } = stanjaVUganki(danosti, kljuc);
  let korakov = 0, vec = 0;
  for (const st of stanja) {
    const v = vajaIzStanja(danosti, kljuc, st, stopnja);
    if (!v) continue;
    korakov += v.KT.length;
    vec += v.KT.filter(korakVecCelic).length;
  }
  return [korakov, vec];
}

// Delež korakov tehnike z isto števko iz 2+ celic, seštet iz zapisov banke (polje
// vecCelic, vzporedno s tehnike), ali null, če podatka ni.
function delezVecCelic(banka, kljuc) {
  let korakov = 0, vec = 0;
  for (const z of banka) {
    const i = z.tehnike.indexOf(kljuc);
    if (i < 0 || !z.vecCelic) continue;
    korakov += z.vecCelic[i][0];
    vec += z.vecCelic[i][1];
  }
  return korakov ? vec / korakov : null;
}

/* ---------- območje koraka (postopnost v "Vadi v uganki") ---------- */

// Območje, v katerem naj igralec išče korak (vaje 1-6 kroga, docs/vadi-v-uganki-nacrt.md,
// točka 15): pri tehnikah z enoto enota koraka (E2, 1-6), pri E1 naključna vrstica,
// stolpec ali blok celice koraka (kot "Spoznaj" vaje 4-6), pri 7-9 števka, pri W-krilu
// par števk, pri XY-krilu pivot, pri edinstvenem pravokotniku bloka. Vrne
// { vrsta: 'enota' | 'stevke' | 'pivot' | 'bloki', enota, stevke, celica, bloki,
// celice (za oznako na mreži ali null), opis ("v stolpcu 5", "na števki 3", "s parom 3 in
// 7", "s pivotom V8S1", "v blokih 1 in 2") } ali null (neznana tehnika).
function obmocjeKoraka(korak, rnd = Math.random) {
  const t = korak.technique;
  if (t === 'Gol enojček') {
    const u = UNITS_OF[korak.assign[0][0]][Math.floor(rnd() * 3)];
    return { vrsta: 'enota', enota: u, celice: u, opis: `v ${unitNameLoc(u)}` };
  }
  const u = korak.unit || (korak.hint && korak.hint.unit);
  if (u) return { vrsta: 'enota', enota: u, celice: u, opis: `v ${unitNameLoc(u)}` };
  if (t === 'X-Wing' || t === 'Swordfish' || t === 'Turbot Fish') {
    const d = korak.hint.digits[0];
    return { vrsta: 'stevke', stevke: [d], celice: null, opis: `za števko ${d}` };
  }
  if (t === 'W-Wing') {
    const s = [...korak.hint.digits].sort((a, b) => a - b);
    return { vrsta: 'stevke', stevke: s, celice: null, opis: `za par {${s[0]}, ${s[1]}}` };
  }
  if (t === 'XY-Wing') {
    const p = korak.cells[0];
    return { vrsta: 'pivot', celica: p, celice: [p], opis: `s pivotom ${cellLabel(p)}` };
  }
  if (t === 'Unique Rectangle') {
    const b = [...new Set(korak.cells.map(boxOf))].sort((x, y) => x - y);
    return { vrsta: 'bloki', bloki: b, celice: b.flatMap(i => BOXES[i]), opis: `v blokih ${b[0] + 1} in ${b[1] + 1}` };
  }
  return null;
}

// Ali je korak v območju (brez območja vedno). Enojčka: celica koraka je v enoti; druge
// tehnike z enoto: ista enota; števke, pivot, bloka: isti.
function vObmocju(korak, ob) {
  if (!ob) return true;
  if (ob.vrsta === 'enota') {
    if (jeEnojcek(korak.technique)) return ob.enota.includes(korak.assign[0][0]);
    return (korak.unit || (korak.hint && korak.hint.unit)) === ob.enota;
  }
  const o = obmocjeKoraka(korak, () => 0);
  if (!o || o.vrsta !== ob.vrsta) return false;
  if (ob.vrsta === 'stevke') return o.stevke.join() === ob.stevke.join();
  if (ob.vrsta === 'pivot') return o.celica === ob.celica;
  return o.bloki.join() === ob.bloki.join();
}

/* ---------- enojčka (skupno s "Spoznaj") ---------- */

// Enota za namig: "vrstico 4" / "stolpec 7" / "blok 5" in zaimek v mestniku.
function enotaZaNamig(unit) {
  const loc = unitNameLoc(unit), [vrsta, st] = loc.split(' ');
  if (vrsta === 'vrstici') return { tozilnik: `vrstico ${st}`, vNjej: 'v njej' };
  return { tozilnik: `${vrsta === 'stolpcu' ? 'stolpec' : 'blok'} ${st}`, vNjej: 'v njem' };
}
function celicZEnoStevko(n) {
  const v = n === 1 ? 'v kateri' : 'v katerih';
  return (n === 1 ? 'je 1 celica' : n === 2 ? 'sta 2 celici' : n <= 4 ? `so ${n} celice` : `je ${n} celic`)
    + `, ${v} je mogoča samo ena števka`;
}

// Števke 1-9, ki v enoti še niso vpisane.
function manjkajoceStevke(grid, unit) {
  const v = new Set(unit.map(c => grid[c]));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !v.has(d));
}
function manjkaStevk(a) {
  return a.length === 1 ? `manjka števka ${a[0]}` : a.length === 2 ? `manjkata števki ${numsLabel(a)}`
    : a.length <= 4 ? `manjkajo števke ${numsLabel(a)}` : `manjka ${a.length} števk: ${numsLabel(a)}`;
}

// Namig pri enojčkih: `koraki` = vsi koraki tehnike v stanju, `korak` = izbrani.
// Brez oznake (cela mreža): E1 koliko celic ima eno samo možno števko in blok ene od
// njih, E2 samo enota. Postopnost v "Spoznaj" (trening/generators.js) poda `oznaka` =
// { celica, enota, stevka } in `grid`: namig pove samo to, česar oznaka še ne pove.
function namigEnojcka(gol, koraki, korak, oznaka, grid) {
  const o = oznaka || {};
  if (gol && o.celica != null) {
    return `Preglej vrstico, stolpec in blok celice ${cellLabel(o.celica)}: katera števka ni v nobenem od njih?`;
  }
  if (gol && o.enota) {
    const celic = new Set(koraki.map(s => s.assign[0][0]).filter(c => o.enota.includes(c))).size;
    return `V ${unitNameLoc(o.enota)} ${celicZEnoStevko(celic)}. Za vsako prazno celico ${enotaZaNamig(o.enota).vNjej} preglej, katere števke so že v njeni vrstici, stolpcu in bloku.`;
  }
  if (!gol && o.enota && o.stevka) {
    const loc = unitNameLoc(o.enota), vrsta = loc.split(' ')[0];
    const [kjer, rod] = vrsta === 'vrstici' ? ['stolpcih in blokih', 'vrstice']
      : vrsta === 'stolpcu' ? ['vrsticah in blokih', 'stolpca'] : ['vrsticah in stolpcih', 'bloka'];
    return `Kje v ${loc} števka ${o.stevka} ni mogoča? Celice ${rod} v ${kjer}, kjer je ${o.stevka} že vpisana, odpadejo – ostane ena sama.`;
  }
  if (!gol && o.enota) {
    return `V ${unitNameLoc(o.enota)} ${manjkaStevk(manjkajoceStevke(grid, o.enota))}. Za vsako preveri, na koliko praznih mestih ${enotaZaNamig(o.enota).vNjej} je mogoča.`;
  }
  if (gol) {
    const celic = new Set(koraki.map(s => s.assign[0][0])).size;
    return `V mreži ${celicZEnoStevko(celic)}. Ena je v bloku ${boxOf(korak.assign[0][0]) + 1}.`;
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
