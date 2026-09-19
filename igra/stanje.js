/* ==================== STANJE IGRE ====================
   Brez DOM-a (testabilno v Node, glej tests/igra-stanje.test.js). Naloži se za
   shared/engine.js (uporablja Board, PEERS, FULL, ROWS, COLS, BOXES).

   Igra = { danosti, poteze, kazalec }:
   - danosti: 81 znakov, '0' = prazna celica,
   - poteze: zaporedje potez od začetka igre,
   - kazalec: koliko potez je trenutno odigranih (poteze za njim so "ponovi" rep).
   Poteza je { tip: 'vpis', celica, stevka } (stevka 0 = brisanje vpisa) ali
   { tip: 'kandidat', celica, stevka, odstrani: true|false } (ročno odstrani ali vrne
   kandidata). Trenutno stanje se vedno izračuna z odigravanjem potez od danosti. */

const IGRA_KLJUC = 'sudoku.igra.v1';

function novaIgra(danosti) {
  return { danosti, poteze: [], kazalec: 0 };
}

// Odigra eno potezo: vpisi[c] = uporabnikova števka (0 = brez vpisa),
// odstranjeni[c] = maska ročno odstranjenih kandidatov.
function odigrajPotezo(vpisi, odstranjeni, p) {
  if (p.tip === 'vpis') vpisi[p.celica] = p.stevka;
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

// Stanje po odigranih potezah igre (do kazalca):
// - grid: danosti + vpisi (0 = prazna celica),
// - samodejni[c]: kandidati, ki jih dovolijo danosti in vpisi (kot new Board),
// - kandidati[c]: samodejni brez ročno odstranjenih (to vidi igralec),
// - deska: Board s temi kandidati (za motor).
function stanjeIgre(igra) {
  const { vpisi, odstranjeni } = odigrajPoteze(igra.danosti, igra.poteze, igra.kazalec);
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
  };
}

// Kaj je za celico v danem stanju dovoljeno (maske števk):
// - vpis: števke, ki jih lahko vpišemo (trenutni kandidati prazne celice),
// - odstrani: kandidati, ki jih lahko ročno odstranimo (isti kot vpis),
// - vrni: ročno odstranjeni kandidati, ki bi jih sicer celica imela,
// - zbrisi: ali ima celica uporabnikov vpis.
function mozneAkcije(stanje, celica) {
  const prazno = { vpis: 0, odstrani: 0, vrni: 0, zbrisi: false };
  if (celica === null || celica === undefined || celica < 0 || celica > 80) return prazno;
  if (stanje.danosti[celica] !== '0') return prazno;
  if (stanje.vpisi[celica]) return { ...prazno, zbrisi: true };
  return {
    vpis: stanje.kandidati[celica],
    odstrani: stanje.kandidati[celica],
    vrni: stanje.samodejni[celica] & stanje.odstranjeni[celica],
    zbrisi: false,
  };
}

function jeDovoljenaPoteza(stanje, p) {
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
  const p = { tip: poteza.tip, celica: poteza.celica, stevka: poteza.stevka };
  if (poteza.tip === 'kandidat') p.odstrani = !!poteza.odstrani;
  igra.poteze.length = igra.kazalec;
  igra.poteze.push(p);
  igra.kazalec++;
  return true;
}

function lahkoRazveljavi(igra) { return igra.kazalec > 0; }
function lahkoPonovi(igra) { return igra.kazalec < igra.poteze.length; }
function razveljavi(igra) { if (lahkoRazveljavi(igra)) igra.kazalec--; }
function ponovi(igra) { if (lahkoPonovi(igra)) igra.kazalec++; }

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
// igralec vmes že sam popravil, se ne štejejo.
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

/* ---------- shranjevanje ---------- */

function igraZdaj() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Zapis za shrambo: { poteze, kazalec, zacetek, nazadnje }.
function igraVZapis(igra, zacetek, cas) {
  return { poteze: igra.poteze.map(p => ({ ...p })), kazalec: igra.kazalec, zacetek: zacetek || cas, nazadnje: cas };
}

// Iz shranjenega zapisa zgradi igro. Poteze odigra eno za drugo in se ustavi
// pri prvi, ki ni dovoljena (poškodovan zapis) - vse do nje ostanejo.
function igraIzZapisa(danosti, zapis) {
  const igra = novaIgra(danosti);
  const poteze = zapis && Array.isArray(zapis.poteze) ? zapis.poteze : [];
  const kazalec = zapis && Number.isInteger(zapis.kazalec) ? zapis.kazalec : poteze.length;
  let stanje = stanjeIgre(igra);
  for (const p of poteze) {
    if (!dodajPotezo(igra, p, stanje)) break;
    stanje = stanjeIgre(igra);
  }
  igra.kazalec = Math.max(0, Math.min(kazalec, igra.poteze.length));
  return igra;
}

function igreBeri() {
  try {
    const s = JSON.parse(localStorage.getItem(IGRA_KLJUC) || 'null');
    if (s && typeof s === 'object' && s.igre && typeof s.igre === 'object') return s;
  } catch (e) { /* brez shrambe */ }
  return { zadnja: null, igre: {} };
}

function igrePisi(s) {
  try {
    localStorage.setItem(IGRA_KLJUC, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}

// Shrani igro in jo označi kot zadnjo odprto. Vrne false, če brskalnik ne
// dovoli shranjevanja.
function igraShrani(igra) {
  const s = igreBeri();
  const prej = s.igre[igra.danosti];
  s.igre[igra.danosti] = igraVZapis(igra, prej && prej.zacetek, igraZdaj());
  s.zadnja = igra.danosti;
  return igrePisi(s);
}

// Shranjena igra za dane danosti ali null.
function igraNalozi(danosti) {
  const zapis = igreBeri().igre[danosti];
  return zapis ? igraIzZapisa(danosti, zapis) : null;
}

function igraZadnja() {
  const s = igreBeri();
  return s.zadnja && s.igre[s.zadnja] ? igraIzZapisa(s.zadnja, s.igre[s.zadnja]) : null;
}
