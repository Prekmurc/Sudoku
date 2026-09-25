/* ==================== STANJE IGRE ====================
   Brez DOM-a in brez shrambe (testabilno v Node, glej tests/igra-stanje.test.js),
   skupno igri in treningu. Naloži se za shared/engine.js (uporablja Board, PEERS,
   FULL, ROWS, COLS, BOXES) in pred shared/zbirka.js, ki iz odigrajPoteze() šteje
   stanje shranjenih iger. Shranjevanje igre je v igra/shramba.js - v
   sudoku.igra.v1 piše samo igra.

   Igra = { danosti, poteze, kazalec, znova, zacetnihPotez }:
   - danosti: 81 znakov, '0' = prazna celica,
   - poteze: zaporedje potez od začetka igre,
   - kazalec: koliko potez je trenutno odigranih (poteze za njim so "ponovi" rep),
   - zacetnihPotez: koliko prvih potez je del izhodišča (vaja v treningu - koraki
     poti do stanja vaje); "Razveljavi" in "Začni znova" ne gresta pod njih, njihovih
     vpisov in izbrisov ni mogoče vrniti. Pri igri je 0.
   Poteza je { tip: 'vpis', celica, stevka } (stevka 0 = brisanje vpisa) ali
   { tip: 'kandidat', celica, stevka, odstrani: true|false } (ročno odstrani ali vrne
   kandidata) ali { tip: 'kandidati', celice, stevka, odstrani: true } (odstrani isto
   števko iz več celic v eni potezi; celice urejene, vsaj dve). Trenutno stanje se
   vedno izračuna z odigravanjem potez od danosti. */

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

// `znova` = igralec je pravkar kliknil "Začni znova" (kazalec na začetku, zgodovina
// pa ostane za "Ponovi"). Loči namerno prazno mrežo od stanja, ko je vse
// razveljavljeno s puščico nazaj - glej igraIzZapisa() v igra/shramba.js.
function novaIgra(danosti) {
  return { danosti, poteze: [], kazalec: 0, znova: false, zacetnihPotez: 0 };
}

function zacetnihPotez(igra) {
  return igra.zacetnihPotez || 0;
}

// Igra, v kateri so podane poteze že odigrane in zaklenjene kot izhodišče
// (zacetnihPotez). Vrne null, če katera od potez ni dovoljena.
function igraZZacetkom(danosti, poteze) {
  const igra = novaIgra(danosti);
  let stanje = stanjeIgre(igra);
  for (const p of poteze) {
    if (!dodajPotezo(igra, p, stanje)) return null;
    stanje = stanjeIgre(igra);
  }
  igra.zacetnihPotez = igra.kazalec;
  return igra;
}

// Stanje po odigranih potezah igre (do kazalca):
// - grid: danosti + vpisi (0 = prazna celica),
// - samodejni[c]: kandidati, ki jih dovolijo danosti in vpisi (kot new Board),
// - kandidati[c]: samodejni brez ročno odstranjenih (to vidi igralec),
// - deska: Board s temi kandidati (za motor),
// - zacetni: { vpisi, odstranjeni } po začetnih potezah (zacetnihPotez) - teh
//   vpisov ni mogoče zbrisati in teh kandidatov ne vrniti (pri igri same ničle).
function stanjeIgre(igra) {
  const { vpisi, odstranjeni } = odigrajPoteze(igra.danosti, igra.poteze, igra.kazalec);
  const zacetni = odigrajPoteze(igra.danosti, igra.poteze, Math.min(zacetnihPotez(igra), igra.kazalec));
  const niz = igra.danosti.split('').map((ch, c) => (ch !== '0' ? ch : String(vpisi[c]))).join('');
  const osnova = new Board(niz);
  const deska = osnova.clone();
  const kandidati = new Array(81).fill(0);
  for (let c = 0; c < 81; c++) {
    if (deska.grid[c] === 0) deska.cand[c] &= ~odstranjeni[c];
    kandidati[c] = deska.grid[c] === 0 ? deska.cand[c] : 0;
  }
  return {
    danosti: igra.danosti,
    grid: deska.grid,
    vpisi,
    odstranjeni,
    samodejni: osnova.cand,
    kandidati,
    deska,
    zacetni,
  };
}

// Kaj je za celico v danem stanju dovoljeno (maske števk):
// - vpis: števke, ki jih lahko vpišemo (trenutni kandidati prazne celice),
// - odstrani: kandidati, ki jih lahko ročno odstranimo (isti kot vpis),
// - vrni: ročno odstranjeni kandidati, ki bi jih sicer celica imela (razen
//   odstranjenih v začetnih potezah),
// - zbrisi: ali ima celica uporabnikov vpis (vpisa iz začetnih potez ne).
function mozneAkcije(stanje, celica) {
  const prazno = { vpis: 0, odstrani: 0, vrni: 0, zbrisi: false };
  if (celica === null || celica === undefined || celica < 0 || celica > 80) return prazno;
  if (stanje.danosti[celica] !== '0') return prazno;
  if (stanje.vpisi[celica]) return { ...prazno, zbrisi: !stanje.zacetni.vpisi[celica] };
  return {
    vpis: stanje.kandidati[celica],
    odstrani: stanje.kandidati[celica],
    vrni: stanje.samodejni[celica] & stanje.odstranjeni[celica] & ~stanje.zacetni.odstranjeni[celica],
    zbrisi: false,
  };
}

// Števke, ki so kandidat v vseh podanih celicah (maska; 0, če je katera od njih
// dana, ima vpis ali ni veljavna celica). Pri odstranjevanju iz več celic so to
// edine dovoljene števke.
function skupniKandidati(stanje, celice) {
  if (!celice.length) return 0;
  let m = FULL;
  for (const c of celice) m &= mozneAkcije(stanje, c).odstrani;
  return m;
}

// Celice za potezo 'kandidati': urejene, brez ponovitev, vsaj dve.
function soCeliceSkupine(celice) {
  return Array.isArray(celice) && celice.length >= 2
    && celice.every((c, i) => Number.isInteger(c) && (i === 0 || c > celice[i - 1]));
}

function jeDovoljenaPoteza(stanje, p) {
  if (p && p.tip === 'kandidati') {
    return soCeliceSkupine(p.celice) && p.odstrani === true && Number.isInteger(p.stevka)
      && p.stevka >= 1 && p.stevka <= 9 && !!(skupniKandidati(stanje, p.celice) & (1 << p.stevka));
  }
  if (!p || !Number.isInteger(p.celica) || !Number.isInteger(p.stevka)) return false;
  const a = mozneAkcije(stanje, p.celica);
  if (p.tip === 'vpis') {
    if (p.stevka === 0) return a.zbrisi;
    return p.stevka >= 1 && p.stevka <= 9 && !!(a.vpis & (1 << p.stevka));
  }
  if (p.tip === 'kandidat') {
    if (p.stevka < 1 || p.stevka > 9) return false;
    return !!((p.odstrani ? a.odstrani : a.vrni) & (1 << p.stevka));
  }
  return false;
}

// Doda potezo za kazalcem (odreže "ponovi" rep). Vrne true, če je poteza
// dovoljena in je bila dodana; nedovoljena ali prazna poteza se ne zapiše.
function dodajPotezo(igra, poteza, stanje = stanjeIgre(igra)) {
  if (!jeDovoljenaPoteza(stanje, poteza)) return false;
  const p = poteza.tip === 'kandidati'
    ? { tip: 'kandidati', celice: [...poteza.celice], stevka: poteza.stevka, odstrani: true }
    : { tip: poteza.tip, celica: poteza.celica, stevka: poteza.stevka };
  if (poteza.tip === 'kandidat') p.odstrani = !!poteza.odstrani;
  igra.poteze.length = igra.kazalec;
  igra.poteze.push(p);
  igra.kazalec++;
  igra.znova = false;
  return true;
}

function lahkoRazveljavi(igra) { return igra.kazalec > zacetnihPotez(igra); }
function lahkoPonovi(igra) { return igra.kazalec < igra.poteze.length; }
function razveljavi(igra) { if (lahkoRazveljavi(igra)) { igra.kazalec--; igra.znova = false; } }
function ponovi(igra) { if (lahkoPonovi(igra)) { igra.kazalec++; igra.znova = false; } }

// "Začni znova": vrne na izhodišče (pri igri prazna mreža, pri vaji stanje vaje),
// poteze ostanejo za "Ponovi". `znova` pove, da je izhodišče namerno.
function lahkoZacniZnova(igra) { return igra.kazalec > zacetnihPotez(igra); }
function zacniZnova(igra) {
  if (!lahkoZacniZnova(igra)) return false;
  igra.kazalec = zacetnihPotez(igra);
  igra.znova = true;
  return true;
}

// seManjka[d] (d = 1..9): kolikokrat mora biti števka d še vpisana.
function seManjka(stanje) {
  const n = new Array(10).fill(9);
  n[0] = 0;
  for (let c = 0; c < 81; c++) if (stanje.grid[c]) n[stanje.grid[c]]--;
  return n;
}

// Seznami manjkajočih števk: za vsako vrstico, stolpec in blok (po 9, v istem
// vrstnem redu kot ROWS/COLS/BOXES) maska števk, ki v enoti še niso vpisane
// (danosti in vpisi). Kandidati in ročni izbrisi ne vplivajo; polna enota ima 0.
function manjkajoceVEnotah(stanje) {
  const maske = enote => enote.map(u => u.reduce((m, c) => m & ~(1 << stanje.grid[c]), FULL));
  return { vrstice: maske(ROWS), stolpci: maske(COLS), bloki: maske(BOXES) };
}

function steviloVpisanih(stanje) {
  return stanje.grid.filter(v => v !== 0).length;
}

function jeResena(stanje) {
  return stanje.grid.every(v => v !== 0) && stanje.deska.isValid();
}

/* ---------- preverjanje (resitev = solutionOf(danosti)) ---------- */

// Ali je v stanju (vpisi, odstranjeni) napaka: vpis, ki ni enak rešitvi, ali
// prazna celica, iz katere je ročno odstranjen njen pravilni kandidat (tudi
// taka uganka ni več rešljiva).
function imaNapako(danosti, vpisi, odstranjeni, resitev) {
  for (let c = 0; c < 81; c++) {
    if (danosti[c] !== '0') continue;
    if (vpisi[c] ? vpisi[c] !== resitev[c] : (odstranjeni[c] & (1 << resitev[c]))) return true;
  }
  return false;
}

// Številka poteze (1 = prva), pri kateri je nastala napaka, ki je na mreži
// zdaj, ali null, če je mreža brez napak. To je poteza tik za zadnjim stanjem
// brez napake: od nje naprej je na mreži ves čas vsaj ena napaka, vrnitev na
// stanje pred njo pa da najpoznejše stanje brez napake. Napake, ki jih je
// igralec vmes že sam popravil, se ne štejejo. Začetne poteze (koraki motorja) so
// brez napake, zato je številka vedno za njimi.
function prvaNapaka(igra, resitev) {
  const vpisi = new Array(81).fill(0);
  const odstranjeni = new Array(81).fill(0);
  let zadnjeBrez = 0; // zadnje stanje (število odigranih potez) brez napake
  for (let i = 0; i < igra.kazalec; i++) {
    odigrajPotezo(vpisi, odstranjeni, igra.poteze[i]);
    if (!imaNapako(igra.danosti, vpisi, odstranjeni, resitev)) zadnjeBrez = i + 1;
  }
  return zadnjeBrez === igra.kazalec ? null : zadnjeBrez + 1;
}

/* ---------- dejanja koraka motorja ---------- */

// Dejanja koraka (nextStep) s stanjem v podani mreži: izbris je izveden, ko števka
// ni več kandidat celice (tudi zaradi vpisa), vpis, ko je v celici ta števka.
function dejanjaKoraka(k, stanje) {
  return [
    ...k.assign.map(([celica, stevka]) => ({ tip: 'vpis', celica, stevka, opravljeno: stanje.grid[celica] === stevka })),
    ...k.eliminate.map(([celica, stevka]) => ({ tip: 'izbris', celica, stevka, opravljeno: !(stanje.kandidati[celica] & (1 << stevka)) })),
  ];
}
