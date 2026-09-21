/* ==================== IGRA: UI ====================
   Izris mreže in nizov gumbov, izbira celice, vpis/odstranjevanje kandidatov,
   razveljavi/ponovi, poudarjanje števke, seznami manjkajočih števk (vrstice,
   stolpci, bloki), pomoč (Naslednji korak, Preveri), zbirka in vnos nove
   uganke. Stanje in poteze so v stanje.js, hramba zbirke v ../shared/zbirka.js,
   korak in rešitev da motor (../shared/engine.js). */

const mrezaEl = document.getElementById('mreza');
const nizPoudariEl = document.getElementById('nizPoudari');
const nizVpisiEl = document.getElementById('nizVpisi');
const nizOdstraniEl = document.getElementById('nizOdstrani');
const razveljaviBtn = document.getElementById('razveljaviBtn');
const ponoviBtn = document.getElementById('ponoviBtn');
const zbrisiBtn = document.getElementById('zbrisiBtn');
const znovaBtn = document.getElementById('znovaBtn');
const stevecPotezEl = document.getElementById('stevecPotez');
const opisUgankeEl = document.getElementById('opisUganke');
const statusEl = document.getElementById('status');
const zbirkaBtn = document.getElementById('zbirkaBtn');
const razlogNizovEl = document.getElementById('razlogNizov');
const korakBtn = document.getElementById('korakBtn');
const preveriBtn = document.getElementById('preveriBtn');
const pomocEl = document.getElementById('pomocVsebina');
const vecHkratiEl = document.getElementById('vecHkrati');
const vecCelicEl = document.getElementById('vecCelic');
const igraLayoutEl = document.getElementById('igraLayout');

let igra = null;        // { danosti, poteze, kazalec } - glej stanje.js
let stanje = null;      // stanjeIgre(igra), osveženo po vsaki spremembi
// Izbrane celice v vrstnem redu izbire. Več celic (kljukica "več celic" ali
// Ctrl+klik) je samo za odstranjevanje istega kandidata iz vseh; izbira ostane,
// dokler je igralec ne počisti (Escape, izklop kljukice, navaden klik).
let izbrane = [];
let vecCelic = false;
let zadnjaIzbrana = null; // celica, iz katere je bila izbira izklopljena po vpisu
// Poudarjene števke po vrstnem redu izbire: [{ stevka, barva }], barva 0..3 =
// rumena, zelena, oranžna, modra (--poud, --poud2 ... v igra.css). Brez kljukice
// "več hkrati" je poudarjena kvečjemu ena števka (rumena).
let poudarjene = [];
let vecHkrati = false;
const BARV_POUDARKA = 4;
let sporocilo = null;   // { besedilo, razred } - enkratno sporočilo v kartici Uganka
// Vsebina kartice Pomoč: null, { korak, fokus, stopnja, izhodisce } (prikazan korak
// motorja; fokus = zadnja izbrana poudarjena števka ob iskanju; stopnja 1 = ime
// tehnike, 2 = + enota in števka (stepHint), 3 = + razlaga, poudarki na mreži in
// seznam dejanj; izhodisce = stanje igre, v katerem je bil korak najden) ali
// { besedilo, razred, znak, vrniPred } (vrniPred = številka poteze za gumb "Vrni na
// stanje pred potezo"). Sporočilo izgine ob vsaki spremembi igre, korak pa ostane,
// dokler niso izvedena vsa njegova dejanja, "Skrij" ali vrnitev pred izhodišče (osvezi).
let pomoc = null;
// Števka prejšnjega najdenega koraka: pri naslednjem iskanju ima prednost (kot
// v reševalcu), razen če je poudarjena druga števka. Nova uganka jo pozabi.
let sidro = null;
// Vgrajeni primeri (PRIMERI v ../shared/zbirka.js) s '0' namesto '.' - tako so
// danosti v igri in v zbirki.
const primeriIgre = PRIMERI.map(p => ({ ime: p.ime, danosti: p.danosti.split('.').join('0') }));
let resitevIgre = null; // { danosti, resitev } - solutionOf(), izračunan ob prvi potrebi

/* ---------- gradnja mreže in nizov ---------- */

const celice = [];
for (let i = 0; i < 81; i++) {
  const el = document.createElement('div');
  el.className = 'celica';
  el.dataset.r = Math.floor(i / 9);
  el.dataset.c = i % 9;
  el.setAttribute('role', 'gridcell');
  el.addEventListener('click', (e) => {
    if (!igra) return;
    if (vecCelic || e.ctrlKey || e.metaKey) preklopiVIzbiri(i);
    else izbrane = enaIzbrana() === i ? [] : [i]; // ponoven klik prekliče izbiro
    izrisi();
  });
  mrezaEl.appendChild(el);
  celice.push(el);
}

// Edina izbrana celica ali null (tudi pri več izbranih) - vpis, brisanje vpisa,
// vračanje kandidata in puščice delujejo samo na eni celici.
function enaIzbrana() {
  return izbrane.length === 1 ? izbrane[0] : null;
}

// Izbira več celic: izbrana celica se odstrani, prazna doda. Dana celica in celica
// z vpisom nimata kandidatov, zato se ne dodata (in izpadeta iz izbire, v katero
// se doda nova celica).
function preklopiVIzbiri(i) {
  if (izbrane.includes(i)) izbrane = izbrane.filter(c => c !== i);
  else if (!stanje.grid[i]) izbrane = [...izbrane.filter(c => !stanje.grid[c]), i];
}

function narediNiz(el, obKliku) {
  const gumbi = [];
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', () => obKliku(d));
    el.appendChild(b);
    gumbi.push(b);
  }
  return gumbi;
}

const gumbiPoudari = narediNiz(nizPoudariEl, d => poudari(d));
const gumbiVpisi = narediNiz(nizVpisiEl, d => izvedi({ tip: 'vpis', celica: enaIzbrana(), stevka: d }));
const gumbiOdstrani = narediNiz(nizOdstraniEl, d => odstraniAliVrni(d));

gumbiVpisi.forEach((b, i) => { b.textContent = i + 1; });

/* ---------- seznami manjkajočih števk ---------- */

// Kvadratek s števkami na stalnih mestih (kot kandidati v celici). Vrne
// { el, stevke }, stevke[d - 1] = span za števko d.
function narediPolje(el) {
  const polje = document.createElement('div');
  polje.className = 'seznam-polje';
  const mreza = document.createElement('div');
  mreza.className = 'kandidati';
  const stevke = [];
  for (let d = 1; d <= 9; d++) {
    const s = document.createElement('span');
    s.className = 'kand';
    mreza.appendChild(s);
    stevke.push(s);
  }
  polje.appendChild(mreza);
  el.appendChild(polje);
  return { el: polje, stevke };
}

// Trije ločeni prikazi; vsak ima 9 kvadratkov v vrstnem redu ROWS/COLS/BOXES
// (bloki od leve proti desni, od zgoraj navzdol - kot v veliki mreži).
const SEZNAMI = [
  { kljuc: 'vrstice', el: document.getElementById('seznamVrstic'), stikalo: document.getElementById('stikaloVrstice'), ime: 'Vrstica', polna: 'polna' },
  { kljuc: 'stolpci', el: document.getElementById('seznamStolpcev'), stikalo: document.getElementById('stikaloStolpci'), ime: 'Stolpec', polna: 'poln' },
  { kljuc: 'bloki', el: document.getElementById('seznamBlokov'), stikalo: document.getElementById('stikaloBloki'), ime: 'Blok', polna: 'poln' },
];
for (const s of SEZNAMI) s.polja = Array.from({ length: 9 }, () => narediPolje(s.el));

// Stanje stikal si zapomni brskalnik; privzeto so vsi seznami izklopljeni.
const SEZNAMI_KLJUC = 'sudoku.igra.seznami';
function seznamiBeri() {
  try {
    const v = JSON.parse(localStorage.getItem(SEZNAMI_KLJUC) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) { return {}; }
}
function seznamiPisi() {
  const v = {};
  for (const s of SEZNAMI) v[s.kljuc] = s.stikalo.checked;
  try { localStorage.setItem(SEZNAMI_KLJUC, JSON.stringify(v)); } catch (e) { /* velja do osvežitve */ }
}
const shranjeniSeznami = seznamiBeri();
for (const s of SEZNAMI) {
  s.stikalo.checked = shranjeniSeznami[s.kljuc] === true;
  s.stikalo.addEventListener('change', () => {
    seznamiPisi();
    izrisiSezname();
  });
}

/* ---------- poudarjanje števk ---------- */

// Barva poudarka števke (0..3) ali -1, če ni poudarjena.
function barvaPoudarka(d) {
  const p = poudarjene.find(x => x.stevka === d);
  return p ? p.barva : -1;
}

// Zadnja izbrana poudarjena števka ali null (ima prednost pri Naslednji korak).
function zadnjaPoudarjena() {
  return poudarjene.length ? poudarjene[poudarjene.length - 1].stevka : null;
}

// Brez "več hkrati" nova izbira zamenja prejšnjo, ponoven klik jo prekliče.
// Z "več hkrati" se izbire seštevajo, ponoven klik števko odstrani; nova
// števka dobi prvo prosto barvo po vrsti, ko so zasedene vse, se barve ponovijo.
function poudari(d) {
  const i = poudarjene.findIndex(x => x.stevka === d);
  if (!vecHkrati) {
    poudarjene = i >= 0 && poudarjene.length === 1 ? [] : [{ stevka: d, barva: 0 }];
  } else if (i >= 0) {
    poudarjene.splice(i, 1);
  } else {
    const zasedene = new Set(poudarjene.map(x => x.barva));
    let barva = [...Array(BARV_POUDARKA).keys()].find(b => !zasedene.has(b));
    if (barva === undefined) barva = poudarjene.length % BARV_POUDARKA;
    poudarjene.push({ stevka: d, barva });
  }
  izrisi();
}

// Izklop kljukice "več celic" pomeni, da je izbiranje končano: izbira se počisti.
vecCelicEl.addEventListener('change', () => {
  vecCelic = vecCelicEl.checked;
  if (!vecCelic) izbrane = [];
  izrisi();
});

// Ob izklopu ostane poudarjena samo zadnja izbrana števka (modra).
vecHkratiEl.addEventListener('change', () => {
  vecHkrati = vecHkratiEl.checked;
  if (!vecHkrati && poudarjene.length) poudarjene = [{ stevka: zadnjaPoudarjena(), barva: 0 }];
  izrisi();
});

/* ---------- poteze ---------- */

// Rešena uganka (vseh 81 celic izpolnjenih in brez napake) se ne spreminja več -
// mreža je samo za ogled. Edina pot naprej je "Začni znova".
function samoZaOgled() {
  return !!igra && !!stanje && jeResena(stanje);
}

function izvedi(poteza) {
  if (!igra || samoZaOgled() || !dodajPotezo(igra, poteza, stanje)) return;
  // Po vpisu števke se izbira celice izklopi (puščice nadaljujejo od nje).
  if (poteza.tip === 'vpis' && poteza.stevka) {
    zadnjaIzbrana = poteza.celica;
    izbrane = [];
  }
  sporocilo = null;
  osvezi();
}

// Niz "Odstrani": trenutni kandidat se odstrani, ročno odstranjen se vrne. Pri
// več izbranih celicah se števka v eni potezi odstrani iz vseh (izbira ostane).
function odstraniAliVrni(d) {
  if (!igra) return;
  if (izbrane.length > 1) {
    izvedi({ tip: 'kandidati', celice: [...izbrane].sort((x, y) => x - y), stevka: d, odstrani: true });
    return;
  }
  const celica = enaIzbrana();
  const a = mozneAkcije(stanje, celica);
  const bit = 1 << d;
  if (a.odstrani & bit) izvedi({ tip: 'kandidat', celica, stevka: d, odstrani: true });
  else if (a.vrni & bit) izvedi({ tip: 'kandidat', celica, stevka: d, odstrani: false });
}

function zbrisiVpis() {
  izvedi({ tip: 'vpis', celica: enaIzbrana(), stevka: 0 });
}

// Po vsaki spremembi igre: novo stanje, shrani, izriši. `jePoteza` je false samo
// ob odprtju uganke (zacniIgro) - takrat se čas mojega zadnjega reševanja v zbirki
// ne premakne, ker še nisem naredil poteze.
function osvezi(jePoteza = true) {
  const prej = stanje && stanje.danosti === igra.danosti ? seManjka(stanje) : null;
  stanje = stanjeIgre(igra);
  pomoc = pomocPoSpremembi();
  // Sprememba, ki števko dokonča (deveti vpis), izklopi njen poudarek - ni več
  // kandidatov. Poudarek, ki ga igralec vklopi pri že dokončani števki, ostane.
  if (prej) {
    const zdaj = seManjka(stanje);
    poudarjene = poudarjene.filter(p => !(prej[p.stevka] > 0 && zdaj[p.stevka] === 0));
  }
  if (!igraShrani(igra)) {
    sporocilo = { besedilo: 'Igre ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', razred: 'err' };
  }
  if (jePoteza) shraniIgranje();
  izrisi();
}

// Med vpisi je števka, ki se ne ujema z rešitvijo. Ročno odstranjeni kandidati tu
// ne štejejo (za razliko od gumba "Preveri") - stanje uganke pove, kaj je na mreži.
function napacenVpis(stanje, res) {
  return !!res && stanje.vpisi.some((v, c) => v && v !== res[c]);
}

// Podatki o MOJEM reševanju gredo v zbirko (uganka, ki je v zbirki ni - npr.
// vgrajeni primer -, ostane brez njih; njen napredek je v shranjenih igrah).
function shraniIgranje() {
  zbirkaShraniIgranje(igra.danosti, igraZdaj(), steviloVpisanih(stanje), napacenVpis(stanje, resitev()));
}

// Uganke, ki sem jih igral, preden so se ti podatki shranjevali (ali v drugem
// zavihku), dopolnimo iz shranjenih iger. Uganka, ki je bila samo odprta (brez
// potez), za igrano ne velja.
function uskladiIgranje() {
  const igre = igreBeri().igre;
  for (const z of zbirkaBeri()) {
    const zapis = igre[z.danosti];
    if (!zapis || !zapis.nazadnje || !zacetaIgra(zapis)) continue;
    if (z.igrano && z.igrano >= zapis.nazadnje) continue;
    if (zbirkaStanjeIgre(z).kljuc === 'resena') continue; // zapis rešene uganke je zamrznjen
    const { vpisi } = odigrajPoteze(z.danosti, zapis.poteze, zapis.kazalec || 0);
    const izpolnjeno = z.danosti.split('').filter((ch, c) => ch !== '0' || vpisi[c]).length;
    const res = solutionOf(z.danosti);
    const napaka = !!res && vpisi.some((v, c) => v && v !== res[c]);
    zbirkaShraniIgranje(z.danosti, zapis.nazadnje, izpolnjeno, napaka);
  }
}

// Korak ostane prikazan ob vsaki potezi (tudi nepovezani); ko so izvedena vsa
// njegova dejanja, ga zamenja potrditev. Ob vrnitvi pred stanje, v katerem je bil
// najden, izgine - tam morda ne velja.
function pomocPoSpremembi() {
  if (!pomoc || !pomoc.korak || !veljaIzhodisce(pomoc.izhodisce)) return null;
  if (dejanjaKoraka(pomoc.korak).every(a => a.opravljeno)) {
    return { besedilo: 'Korak je izveden.', razred: 'ok', znak: 'ok' };
  }
  return pomoc;
}

// Izhodišče koraka: igra, število odigranih potez in zadnja od njih. Nova poteza
// odreže samo "ponovi" rep, zato je trenutno stanje nadaljevanje izhodišča,
// dokler kazalec ni pred njim in je na njegovem mestu ista poteza.
function trenutnoIzhodisce() {
  return { igra, kazalec: igra.kazalec, poteza: igra.kazalec ? igra.poteze[igra.kazalec - 1] : null };
}
function veljaIzhodisce(izh) {
  return !!izh && izh.igra === igra && igra.kazalec >= izh.kazalec
    && (izh.kazalec === 0 || igra.poteze[izh.kazalec - 1] === izh.poteza);
}

// Dejanja koraka s stanjem v trenutni mreži: izbris je izveden, ko števka ni več
// kandidat celice (tudi zaradi vpisa), vpis, ko je v celici ta števka.
function dejanjaKoraka(k) {
  return [
    ...k.assign.map(([celica, stevka]) => ({ tip: 'vpis', celica, stevka, opravljeno: stanje.grid[celica] === stevka })),
    ...k.eliminate.map(([celica, stevka]) => ({ tip: 'izbris', celica, stevka, opravljeno: !(stanje.kandidati[celica] & (1 << stevka)) })),
  ];
}

razveljaviBtn.addEventListener('click', () => {
  if (!igra || samoZaOgled() || !lahkoRazveljavi(igra)) return;
  razveljavi(igra);
  sporocilo = null;
  osvezi();
});
ponoviBtn.addEventListener('click', () => {
  if (!igra || samoZaOgled() || !lahkoPonovi(igra)) return;
  ponovi(igra);
  sporocilo = null;
  osvezi();
});
zbrisiBtn.addEventListener('click', zbrisiVpis);
znovaBtn.addEventListener('click', () => {
  if (!igra || igra.kazalec === 0) return;
  const vprasanje = samoZaOgled()
    ? 'Uganka je rešena. Če začneš znova, se mreža izprazni in jo lahko rešuješ še enkrat; v zbirki ostane zapisana kot rešena, s časom prve rešitve. Nadaljujem?'
    : 'Začnem znova? Vse poteze bodo razveljavljene. Z »Ponovi« jih lahko vrneš, dokler ne narediš nove poteze.';
  if (!confirm(vprasanje)) return;
  igra.kazalec = 0;
  sporocilo = { besedilo: 'Začel si znova - prejšnje poteze so na voljo s »Ponovi«.', razred: '' };
  osvezi();
});

/* ---------- izris ---------- */

function izrisi() {
  izrisiMrezo();
  izrisiNize();
  izrisiSezname();
  izrisiStanje();
  izrisiPomoc();
}

// Seznami manjkajočih števk: vidni so samo vklopljeni, polna enota ima prazen
// kvadratek, poudarjena števka je obarvana enako kot v mreži.
function izrisiSezname() {
  // Seznam vrstic doda mreži 10. stolpec - celice se pomanjšajo (igra.css).
  igraLayoutEl.classList.toggle('z-vrsticami', SEZNAMI[0].stikalo.checked);
  const m = igra ? manjkajoceVEnotah(stanje) : null;
  for (const s of SEZNAMI) {
    s.el.hidden = !s.stikalo.checked;
    if (s.el.hidden) continue;
    s.polja.forEach((p, i) => {
      const maska = m ? m[s.kljuc][i] : 0;
      const manjkajo = [];
      for (let d = 1; d <= 9; d++) {
        const el = p.stevke[d - 1];
        el.className = 'kand';
        el.textContent = '';
        if (!(maska & (1 << d))) continue;
        el.textContent = d;
        manjkajo.push(d);
        const b = barvaPoudarka(d);
        if (b >= 0) el.classList.add('poud', `b${b}`);
      }
      p.el.title = !igra ? '' : manjkajo.length ? `${s.ime} ${i + 1}: manjkajo ${manjkajo.join(', ')}` : `${s.ime} ${i + 1} je ${s.polna}`;
      p.el.setAttribute('aria-label', p.el.title || `${s.ime} ${i + 1}`);
    });
  }
}

function izrisiMrezo() {
  mrezaEl.classList.toggle('prazna', !igra);
  // Prikazan korak: celice vzorca, kandidati za izbris, števke za vpis.
  const korak = pomoc && pomoc.korak && pomoc.stopnja === 3 ? pomoc.korak : null;
  const vzorec = new Set(korak ? korak.cells : []);
  // Samo še neizvedena dejanja: izveden izbris v celici ni več viden, celica brez
  // odprtih izbrisov izgubi rdečkasto podlago.
  const odprta = korak ? dejanjaKoraka(korak).filter(a => !a.opravljeno) : [];
  const izbris = new Set(odprta.filter(a => a.tip === 'izbris').map(a => a.celica * 10 + a.stevka));
  const izbrisCelice = new Set(odprta.filter(a => a.tip === 'izbris').map(a => a.celica));
  const zaVpis = new Map(odprta.filter(a => a.tip === 'vpis').map(a => [a.celica, a.stevka]));
  // Sosede izbrane celice se senčijo samo pri eni izbrani celici.
  const izbraneSet = new Set(izbrane);
  const ena = enaIzbrana();
  for (let i = 0; i < 81; i++) {
    const el = celice[i];
    el.innerHTML = '';
    el.className = 'celica';
    if (!igra) continue;
    const v = stanje.grid[i];
    if (v) {
      el.textContent = v;
      el.classList.add(igra.danosti[i] !== '0' ? 'dana' : 'vpis');
      const b = barvaPoudarka(v);
      if (b >= 0) el.classList.add('poud-stevka', `b${b}`);
    } else {
      const k = stanje.kandidati[i];
      const mreza = document.createElement('div');
      mreza.className = 'kandidati';
      for (let d = 1; d <= 9; d++) {
        const s = document.createElement('span');
        s.className = 'kand';
        if (k & (1 << d)) {
          s.textContent = d;
          const b = barvaPoudarka(d);
          if (b >= 0) s.classList.add('poud', `b${b}`);
          if (izbris.has(i * 10 + d)) s.classList.add('k-izbris');
          if (zaVpis.get(i) === d) s.classList.add('k-vpis');
        }
        mreza.appendChild(s);
      }
      el.appendChild(mreza);
    }
    if (zaVpis.has(i)) el.classList.add('k-vpis');
    else if (vzorec.has(i)) el.classList.add('k-vzorec');
    else if (izbrisCelice.has(i)) el.classList.add('k-izbris');
    if (izbraneSet.has(i)) el.classList.add('izbrana');
    else if (ena !== null && PEERS[ena].has(i)) el.classList.add('soseda');
  }
}

function izrisiNize() {
  const manjka = igra ? seManjka(stanje) : new Array(10).fill(0);
  // Pri več izbranih celicah je mogoče samo odstraniti števko, ki je kandidat v vseh.
  const ogled = samoZaOgled();
  const a = !igra || ogled ? mozneAkcije(null, null)
    : izbrane.length > 1 ? { vpis: 0, odstrani: skupniKandidati(stanje, izbrane), vrni: 0, zbrisi: false }
    : mozneAkcije(stanje, enaIzbrana());
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << d;

    const p = gumbiPoudari[d - 1];
    const b = barvaPoudarka(d);
    p.innerHTML = `<span>${d}</span><span class="manjka">${igra ? manjka[d] : ''}</span>`;
    // Tudi števka, vpisana že devetkrat, se da poudariti - poudarek pokaže vse
    // celice z njo (za hiter pregled).
    p.disabled = !igra;
    p.className = b >= 0 ? `aktiven b${b}` : '';
    p.setAttribute('aria-pressed', b >= 0 ? 'true' : 'false');
    p.title = !igra ? '' : manjka[d] === 0 ? `Poudari ${d} (vpisana devetkrat)` : `Poudari ${d} (še manjka: ${manjka[d]})`;

    const v = gumbiVpisi[d - 1];
    v.disabled = !(a.vpis & bit);
    v.title = v.disabled ? '' : `Vpiši ${d}`;

    const o = gumbiOdstrani[d - 1];
    o.textContent = d;
    o.classList.toggle('odstrani', !!(a.odstrani & bit));
    o.classList.toggle('vrni', !!(a.vrni & bit));
    o.disabled = !((a.odstrani | a.vrni) & bit);
    o.title = (a.odstrani & bit) ? `Odstrani kandidata ${d}` : (a.vrni & bit) ? `Vrni kandidata ${d}` : '';
    o.setAttribute('aria-label', o.title || String(d));
  }
  razlogNizovEl.textContent = razlogNizov(a);
  zbrisiBtn.disabled = !a.zbrisi;
  razveljaviBtn.disabled = !igra || ogled || !lahkoRazveljavi(igra);
  ponoviBtn.disabled = !igra || ogled || !lahkoPonovi(igra);
  znovaBtn.disabled = !igra || igra.kazalec === 0;
  // Gumb pove, kaj sledi; ko je korak prikazan v celoti, počaka na potezo ali Skrij.
  const stopnja = pomoc && pomoc.korak ? pomoc.stopnja : 0;
  korakBtn.textContent = stopnja === 1 ? 'Pokaži več' : stopnja === 2 ? 'Pokaži rešitev' : 'Naslednji korak';
  korakBtn.disabled = !igra || stopnja === 3;
  preveriBtn.disabled = !igra;
  stevecPotezEl.textContent = igra ? `poteza ${igra.kazalec} / ${igra.poteze.length}` : '';
}

// Pojasnilo pod nizoma, kadar za izbrano celico ni kaj vpisati ali odstraniti.
function razlogNizov(a) {
  if (!igra) return '';
  if (samoZaOgled()) return 'Uganka je rešena – mreža je samo za ogled. Z »Začni znova« jo lahko rešuješ še enkrat.';
  if (!izbrane.length) return 'Izberi celico v mreži.';
  if (izbrane.length > 1) {
    // Celica v izbiri je lahko polna, če je "Razveljavi"/"Ponovi" vrnil vpis.
    const polna = izbrane.find(c => stanje.grid[c]);
    if (polna !== undefined) return `V ${cellLabel(polna)} je vpis – odstrani jo iz izbire.`;
    if (!a.odstrani) return 'Izbrane celice nimajo skupnega kandidata.';
    return `Izbrane celice: ${izbrane.length} – odstrani števko, ki je kandidat v vseh.`;
  }
  const izbrana = izbrane[0];
  const ime = cellLabel(izbrana);
  const v = stanje.grid[izbrana];
  if (igra.danosti[izbrana] !== '0') return `${ime} je dana števka (${v}) – ne spreminja se.`;
  if (v) return `V ${ime} je tvoj vpis (${v}) – za spremembo ga najprej zbriši.`;
  if (!a.vpis) {
    return a.vrni ? `V ${ime} ni več kandidatov – vrni odstranjenega (↺) ali razveljavi.`
      : `V ${ime} ni več kandidatov – razveljavi zadnje poteze.`;
  }
  return '';
}

function izrisiStanje() {
  if (!igra) {
    opisUgankeEl.textContent = 'Ni odprte uganke.';
    nastaviStatus(sporocilo ? sporocilo.besedilo : 'Izberi uganko v zbirki ali vnesi novo (gumba zgoraj).', sporocilo ? sporocilo.razred : '');
    return;
  }
  opisUgankeEl.textContent = opisUganke(igra.danosti);
  if (sporocilo) nastaviStatus(sporocilo.besedilo, sporocilo.razred);
  else if (jeResena(stanje)) nastaviStatus('Uganka je rešena. Čestitam!', 'ok');
  else nastaviStatus(`Izpolnjenih ${steviloVpisanih(stanje)} od 81 celic.`, '');
}

function nastaviStatus(besedilo, razred) {
  statusEl.textContent = besedilo;
  statusEl.className = razred || '';
}

function opisUganke(danosti) {
  const danih = danosti.replace(/0/g, '').length;
  const z = zbirkaBeri().find(x => x.danosti === danosti);
  const primer = primeriIgre.find(p => p.danosti === danosti);
  if (!z) return primer ? `Vgrajeni primer »${primer.ime}«. Danih števk: ${danih}.` : `Danih števk: ${danih}. Uganke ni v zbirki.`;
  const casi = zbirkaPrikazCasov(z);
  const deli = [z.tezavnost || 'težavnost ni določena', zbirkaOpisIzvora(z),
    casi.dodana, `danih števk: ${danih}`,
    zbirkaOznakaTehnik(z)].filter(Boolean);
  // Moje reševanje je v svoji vrstici pod prvo (.opis-uganke ima white-space: pre-line).
  const igranje = zbirkaVrsticaIgranja(z);
  return deli.join(' · ') + (igranje ? `\n${igranje}` : '') + (z.opomba ? ` — ${z.opomba}` : '');
}

/* ---------- pomoč: Naslednji korak, Preveri ---------- */

function resitev() {
  if (!resitevIgre || resitevIgre.danosti !== igra.danosti) {
    resitevIgre = { danosti: igra.danosti, resitev: solutionOf(igra.danosti) };
  }
  return resitevIgre.resitev;
}

function nastaviPomoc(p) {
  pomoc = p;
  izrisi();
}

// Postopna pomoč: prvi klik poišče korak in pokaže ime tehnike, drugi doda
// enoto in števko, tretji razlago in poudarke. Poskus in protislovje nima
// namiga (stepHint = null) in se pokaže takoj v celoti.
korakBtn.addEventListener('click', () => {
  if (!igra) return;
  if (pomoc && pomoc.korak) {
    if (pomoc.stopnja < 3) nastaviPomoc({ ...pomoc, stopnja: pomoc.stopnja + 1 });
    return;
  }
  if (jeResena(stanje)) return nastaviPomoc({ besedilo: 'Uganka je rešena - ni več korakov.', razred: 'ok' });
  const res = resitev();
  if (!res) return nastaviPomoc({ besedilo: 'Rešitve uganke ni bilo mogoče izračunati.', razred: 'err' });
  // Korak na napačni mreži bi temeljil na napačnih kandidatih - ne pokažemo ga.
  if (prvaNapaka(igra, res) !== null) {
    return nastaviPomoc({ besedilo: 'Na mreži je napaka, zato korak ne bi bil zanesljiv. Pritisni »Preveri«.', razred: 'err' });
  }
  const iskanje = { besedilo: 'Iščem korak ...', razred: '' };
  nastaviPomoc(iskanje);
  // Prednost ima poudarjena števka, sicer števka prejšnjega koraka (sidro).
  // Poudarek je izrecna izbira igralca, zato prebije skupine tehnik (dobi korak
  // s to števko, tudi če je zahtevnejši); sidro popusti lažji skupini.
  const fokus = zadnjaPoudarjena();
  const prednost = fokus !== null ? fokus : sidro;
  setTimeout(() => {
    if (pomoc !== iskanje) return; // vmes poteza, Skrij ali Preveri
    const korak = nextStep(stanje.deska, ALL_TECHNIQUES, prednost, fokus !== null);
    if (korak) sidro = sidroPoKoraku(korak, prednost);
    nastaviPomoc(korak ? { korak, fokus, stopnja: stepHint(korak) ? 1 : 3, izhodisce: trenutnoIzhodisce() }
      : { besedilo: 'Noben znan korak ne najde ničesar.', razred: 'err' });
  }, 20);
});

// Kot "usidranje" v solve(): če korak vsebuje števko s prednostjo, ostane ta,
// sicer se igra usidra na najmanjšo števko koraka.
function sidroPoKoraku(korak, prednost) {
  const stevke = digitsOfStep(korak);
  if (prednost !== null && stevke.has(prednost)) return prednost;
  return stevke.size ? Math.min(...stevke) : null;
}

preveriBtn.addEventListener('click', () => {
  if (!igra) return;
  const res = resitev();
  if (!res) return nastaviPomoc({ besedilo: 'Rešitve uganke ni bilo mogoče izračunati.', razred: 'err' });
  const n = prvaNapaka(igra, res);
  if (n === null) {
    return nastaviPomoc(jeResena(stanje)
      ? { besedilo: 'Uganka je rešena brez napak.', razred: 'ok', znak: 'ok' }
      : { besedilo: 'Med vpisanimi števkami in odstranjenimi kandidati ni napake.', razred: 'ok', znak: 'ok' });
  }
  nastaviPomoc({
    besedilo: `Na mreži je napaka. Nastala je pri potezi ${n} (od ${igra.kazalec}) – od takrat je na mreži ves čas vsaj ena napaka.`,
    razred: 'err',
    znak: 'napaka',
    vrniPred: n,
  });
});

function vrniPredPotezo(n) {
  igra.kazalec = n - 1;
  sporocilo = null;
  osvezi();
  nastaviPomoc({
    besedilo: `Vrnjeno na stanje pred potezo ${n}, na mreži ni napake. Razveljavljene poteze lahko vrneš s »Ponovi«, dokler ne narediš nove poteze.`,
    razred: 'ok',
  });
}

// Tretja stopnja koraka: razlaga in legenda barv na mreži.
function izrisiRazlago(k) {
  const msg = document.createElement('p');
  msg.className = 'pomoc-msg';
  msg.textContent = k.message;
  pomocEl.appendChild(msg);
  const legenda = document.createElement('div');
  legenda.className = 'pomoc-legenda';
  const del = (razred, besedilo) => `<span><span class="sw ${razred}"></span>${besedilo}</span>`;
  // Celica za vpis je obarvana zeleno, tudi če je del vzorca (enojčki).
  const vzorec = k.cells.some(c => !k.assign.some(([a]) => a === c));
  legenda.innerHTML = (vzorec ? del('sw-vzorec', 'celice vzorca') : '')
    + (k.eliminate.length ? del('sw-izbris', 'kandidat za izbris') : '')
    + (k.assign.length ? del('sw-vpis', 'števka za vpis') : '');
  pomocEl.appendChild(legenda);
}

// Tretja stopnja: seznam dejanj koraka z oznako izvedenih (pri koraku z več
// dejanji), da je po prvem izbrisu jasno, kaj še ostane.
function izrisiDejanja(k) {
  const dejanja = dejanjaKoraka(k);
  if (dejanja.length < 2) return;
  const opravljenih = dejanja.filter(a => a.opravljeno).length;
  const glava = document.createElement('p');
  glava.className = 'pomoc-opomba';
  glava.textContent = `Opravljeno: ${opravljenih} od ${dejanja.length}`;
  pomocEl.appendChild(glava);
  const seznam = document.createElement('ul');
  seznam.className = 'pomoc-dejanja';
  for (const a of dejanja) {
    const li = document.createElement('li');
    if (a.opravljeno) li.className = 'opravljeno';
    const znak = document.createElement('span');
    znak.className = 'dejanje-znak';
    znak.textContent = a.opravljeno ? '✓' : '';
    znak.setAttribute('aria-hidden', 'true');
    const besedilo = document.createElement('span');
    besedilo.textContent = a.tip === 'vpis' ? `vpiši ${a.stevka} v ${cellLabel(a.celica)}` : `izbriši ${a.stevka} iz ${cellLabel(a.celica)}`;
    li.append(znak, besedilo);
    li.setAttribute('aria-label', besedilo.textContent + (a.opravljeno ? ' – opravljeno' : ''));
    seznam.appendChild(li);
  }
  pomocEl.appendChild(seznam);
}

function izrisiPomoc() {
  pomocEl.innerHTML = '';
  if (!pomoc) return;
  if (pomoc.korak) {
    const k = pomoc.korak;
    const tag = document.createElement('span');
    tag.className = `tag ${tagClass(k.technique)}`;
    tag.textContent = k.technique;
    pomocEl.appendChild(tag);
    if (pomoc.fokus !== null && !k.assign.concat(k.eliminate).some(([, d]) => d === pomoc.fokus)) {
      const op = document.createElement('p');
      op.className = 'pomoc-opomba';
      op.textContent = `Za poudarjeno števko ${pomoc.fokus} ni koraka – prikazan je korak z drugo števko.`;
      pomocEl.appendChild(op);
    }
    const namig = stepHint(k);
    if (pomoc.stopnja >= 2 && namig) {
      const h = document.createElement('p');
      h.className = 'pomoc-msg pomoc-namig';
      h.textContent = namig;
      pomocEl.appendChild(h);
    }
    if (pomoc.stopnja === 3) {
      izrisiRazlago(k);
      izrisiDejanja(k);
    }
  } else {
    const p = document.createElement('p');
    p.className = `pomoc-msg ${pomoc.razred || ''}`;
    p.textContent = pomoc.besedilo;
    if (pomoc.znak) {
      // Rezultat "Preveri": zelena kljukica ali rdeč križec pred besedilom.
      const vrstica = document.createElement('div');
      vrstica.className = 'pomoc-rezultat';
      const znak = document.createElement('span');
      znak.className = `pomoc-znak ${pomoc.znak}`;
      znak.textContent = pomoc.znak === 'ok' ? '✓' : '✗';
      znak.setAttribute('aria-hidden', 'true');
      vrstica.append(znak, p);
      pomocEl.appendChild(vrstica);
    } else {
      pomocEl.appendChild(p);
    }
  }
  const gumbi = document.createElement('div');
  gumbi.className = 'pomoc-gumbi';
  if (pomoc.vrniPred) {
    const n = pomoc.vrniPred;
    const vrni = document.createElement('button');
    vrni.type = 'button';
    vrni.className = 'majhen';
    vrni.textContent = `Vrni na stanje pred potezo ${n}`;
    vrni.addEventListener('click', () => vrniPredPotezo(n));
    gumbi.appendChild(vrni);
  }
  const skrij = document.createElement('button');
  skrij.type = 'button';
  skrij.className = 'majhen';
  skrij.textContent = 'Skrij';
  skrij.addEventListener('click', () => nastaviPomoc(null));
  gumbi.appendChild(skrij);
  pomocEl.appendChild(gumbi);
}

/* ---------- začetek igre ---------- */

// Odpre uganko: shranjena igra se nadaljuje, sicer se začne nova. Enoličnost
// mora biti preverjena prej (klicatelj).
function zacniIgro(danosti) {
  const shranjena = igraNalozi(danosti);
  igra = shranjena || novaIgra(danosti);
  izbrane = [];
  zadnjaIzbrana = null;
  pomoc = null;
  sidro = null;
  poudarjene = [];
  sporocilo = shranjena && shranjena.poteze.length
    ? { besedilo: `Nadaljuješ shranjeno igro (poteza ${shranjena.kazalec} / ${shranjena.poteze.length}).`, razred: '' }
    : null;
  osvezi(false); // samo odprtje uganke ni poteza
}

/* ---------- tipkovnica ---------- */

function odprtDialog() {
  return document.querySelector('.dialog.odprt');
}

document.addEventListener('keydown', (e) => {
  const dialog = odprtDialog();
  if (dialog) {
    if (e.key === 'Escape') zapriDialog(dialog);
    return;
  }
  if (!igra) return;
  // Tipkanje v besedilno polje (npr. barva poudarka) ni poteza; kljukica
  // "več hkrati" ali izbirnik barv pa tipkovnice igre ne smeta blokirati.
  if (e.target instanceof HTMLTextAreaElement || (e.target instanceof HTMLInputElement && e.target.type === 'text')) return;

  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && !e.altKey && e.code === 'KeyZ') {
    e.preventDefault();
    (e.shiftKey ? ponoviBtn : razveljaviBtn).click();
    return;
  }
  if (ctrl && !e.altKey && e.code === 'KeyY') {
    e.preventDefault();
    ponoviBtn.click();
    return;
  }
  if (ctrl || e.altKey) return;

  const premik = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
  if (premik) {
    e.preventDefault();
    // Pri več izbranih celicah puščice ne naredijo nič (izbire ne podrejo po nesreči).
    if (izbrane.length > 1) return;
    // Po vpisu (izbira izklopljena) se premik nadaljuje od zadnje izbrane celice.
    const od = izbrane.length ? izbrane[0] : zadnjaIzbrana;
    if (od === null) izbrane = [0];
    else {
      const r = Math.min(8, Math.max(0, Math.floor(od / 9) + premik[0]));
      const c = Math.min(8, Math.max(0, od % 9 + premik[1]));
      izbrane = [r * 9 + c];
    }
    izrisi();
    return;
  }

  // Fizična tipka (e.code), da Shift+števka deluje tudi na slovenski razporeditvi.
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (m) {
    e.preventDefault();
    const d = +m[1];
    if (e.shiftKey) odstraniAliVrni(d);
    else izvedi({ tip: 'vpis', celica: enaIzbrana(), stevka: d });
    return;
  }
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    zbrisiVpis();
    return;
  }
  if (e.key === 'Escape' && izbrane.length) {
    izbrane = [];
    izrisi();
  }
});

/* ---------- dialogi ---------- */

function odpriDialog(el) { el.classList.add('odprt'); }
function zapriDialog(el) {
  el.classList.remove('odprt');
  // Zaprtje okna "Nova uganka" ustavi iskanje uganke (gumb "Ustvari uganko"),
  // zaprtje okna "Zbirka ugank" pa ocenjevanje in nepotrjeni predlog ocen.
  if (el === novaDialog) ustaviIskanje();
  if (el === zbirkaDialog) { ustaviOcenjevanje(); ocenaPocisti(); }
}

document.querySelectorAll('.dialog').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-zapri]')) zapriDialog(el);
  });
});

/* ---------- navodila (okno Pomoč) ---------- */

const navodilaDialog = document.getElementById('navodilaDialog');
// Razdelek "Tehnike": številke, imena in razlage so v shared/engine.js
// (TRENING_TEHNIKE + TEHNIKE_OPISI), zato so iste kot v treningu. Vrstni red
// seznama <ol> da številke 1..12.
const tehnikeSeznamEl = document.getElementById('tehnikeSeznam');
for (const [kljuc] of TRENING_TEHNIKE) {
  const li = document.createElement('li');
  const ime = document.createElement('b');
  ime.textContent = TEHNIKE_OPISI[kljuc].ime;
  const razlaga = document.createElement('p');
  razlaga.textContent = opisTehnike(kljuc);
  li.append(ime, razlaga);
  tehnikeSeznamEl.appendChild(li);
}

for (const el of [document.getElementById('navodilaBtn'), document.getElementById('navodilaKarticaBtn')]) {
  el.addEventListener('click', () => odpriDialog(navodilaDialog));
}

/* ---------- zbirka ---------- */

const zbirkaDialog = document.getElementById('zbirkaDialog');
const zbirkaSeznamEl = document.getElementById('zbirkaSeznam');
const primeriSeznamEl = document.getElementById('primeriSeznam');
const zbirkaStatusEl = document.getElementById('zbirkaStatus');
// Vrstica seznama po danostih - da med ocenjevanjem osvežimo samo njo.
const zbirkaVrstice = new Map();

function osveziGumbZbirke() {
  zbirkaBtn.textContent = `Zbirka (${zbirkaBeri().length})`;
}

// Ali sem uganko že igral: sam zapis igre ne zadostuje, ker nastane že ob odprtju
// (igraShrani v osvezi). Šteje šele prva poteza - takrat dobi zapis "poteze".
function zacetaIgra(zapis) {
  return !!zapis && (zapis.poteze || []).length > 0;
}

function zbirkaStatusIgre(danosti, zapis) {
  if (!zacetaIgra(zapis)) return { besedilo: 'nova', razred: '' };
  const { vpisi } = odigrajPoteze(danosti, zapis.poteze || [], zapis.kazalec || 0);
  const izpolnjenih = danosti.split('').filter((ch, c) => ch !== '0' || vpisi[c]).length;
  if (izpolnjenih === 81) return { besedilo: 'rešeno ✓', razred: 'reseno' };
  return { besedilo: `v teku: ${izpolnjenih}/81`, razred: 'v-teku' };
}

// Vrstica "danih: N · nova / v teku / rešeno · trenutno odprta" in gumb
// Igraj/Nadaljuj. Pri ugankah iz zbirke je stanje že v vrstici s časi
// (sStanjem = false), pri vgrajenih primerih, ki zapisa v zbirki nimajo, pa tu.
function infoUganke(danosti, zapis, trenutna, sStanjem = true) {
  const info = document.createElement('div');
  info.className = 'zb-info';
  info.append(`danih: ${danosti.replace(/0/g, '').length}`);
  if (sStanjem) {
    const st = zbirkaStatusIgre(danosti, zapis);
    const oznaka = document.createElement('span');
    oznaka.className = st.razred;
    oznaka.textContent = st.besedilo;
    info.append(' · ', oznaka);
  }
  info.append(trenutna ? ' · trenutno odprta' : '');
  return info;
}

function gumbiUganke(danosti, zapis) {
  const gumbi = document.createElement('div');
  gumbi.className = 'zb-gumbi';
  const igraj = document.createElement('button');
  igraj.type = 'button';
  igraj.className = 'primary';
  igraj.textContent = zacetaIgra(zapis) ? 'Nadaljuj' : 'Igraj';
  igraj.addEventListener('click', () => igrajIzZbirke(danosti));
  gumbi.appendChild(igraj);
  return gumbi;
}

// Vgrajeni primeri (PRIMERI v ../shared/zbirka.js): igrajo se enako kot uganke
// iz zbirke, napredek se shrani po danostih.
function izrisiPrimere(igre) {
  primeriSeznamEl.innerHTML = '';
  for (const p of primeriIgre) {
    const li = document.createElement('li');
    const trenutna = igra && igra.danosti === p.danosti;
    if (trenutna) li.className = 'trenutna';
    const vrstica = document.createElement('div');
    vrstica.className = 'zb-vrstica';
    vrstica.textContent = p.ime;
    li.append(vrstica, infoUganke(p.danosti, igre[p.danosti], trenutna), gumbiUganke(p.danosti, igre[p.danosti]));
    primeriSeznamEl.appendChild(li);
  }
}

// Druga vrstica zapisa v seznamu: "zadnje reševanje 22. 9. 2026 ob 10:05 · v teku
// (45 od 81)". Vrne null, kadar uganke še nisem igral.
function vrsticaIgranja(z) {
  const i = zbirkaPrikazCasov(z).igranje;
  if (!i) return null;
  const el = document.createElement('div');
  el.className = 'zb-casi';
  const oznaka = document.createElement('span');
  oznaka.className = i.kljuc;
  oznaka.textContent = i.besedilo;
  el.append(i.predpona ? `${i.predpona} · ` : '', oznaka);
  return el;
}

function izrisiZbirko() {
  uskladiIgranje();
  const zbirka = zbirkaBeri();
  const igre = igreBeri().igre;
  izrisiPrimere(igre);
  zbirkaSeznamEl.innerHTML = '';
  zbirkaVrstice.clear();
  if (!zbirka.length) {
    const li = document.createElement('li');
    li.className = 'prazno';
    li.textContent = 'Zbirka je prazna. Uganko dodaš z gumbom »Nova uganka« ali z reševanjem v reševalcu.';
    zbirkaSeznamEl.appendChild(li);
    return;
  }
  for (const z of zbirkaZaSeznam(zbirka)) {
    const li = document.createElement('li');
    const trenutna = igra && igra.danosti === z.danosti;
    if (trenutna) li.className = 'trenutna';
    const tezavnost = z.tezavnost || 'težavnost ni določena';

    const vrstica = document.createElement('div');
    vrstica.className = 'zb-vrstica';
    vrstica.textContent = [zbirkaPrikazCasov(z).dodana, tezavnost, zbirkaOpisIzvora(z)]
      .filter(Boolean).join(' · ');
    vrstica.title = zbirkaNamigCasov(z);
    li.appendChild(vrstica);

    // Čas mojega zadnjega reševanja in stanje - v svoji vrstici pod časom dodajanja.
    const igranje = vrsticaIgranja(z);
    if (igranje) li.appendChild(igranje);

    li.appendChild(infoUganke(z.danosti, igre[z.danosti], trenutna, false));

    // Katere tehnike uganka zahteva (številke iz treninga).
    const tehnike = document.createElement('div');
    tehnike.className = 'zb-info zb-tehnike';
    tehnike.textContent = zbirkaOznakaTehnik(z);
    li.appendChild(tehnike);

    if (z.opomba) {
      const op = document.createElement('div');
      op.className = 'zb-opomba';
      op.textContent = z.opomba;
      li.appendChild(op);
    }

    li.appendChild(gumbiUganke(z.danosti, igre[z.danosti]));

    zbirkaVrstice.set(z.danosti, li);
    izrisiOceno(z.danosti, z);
    zbirkaSeznamEl.appendChild(li);
  }
}

function igrajIzZbirke(danosti) {
  // Uvožene uganke v zbirki niso nujno preverjene - shranjena igra pa je bila.
  if (!igraNalozi(danosti)) {
    const n = countSolutions(danosti);
    if (n !== 1) {
      zbirkaStatus(n === 0 ? 'Te uganke ni mogoče igrati: nima rešitve.'
        : n === 'unknown' ? 'Te uganke ni mogoče igrati: enoličnosti ni bilo mogoče preveriti v razumnem času.'
        : 'Te uganke ni mogoče igrati: ima več kot eno rešitev.', true);
      return;
    }
  }
  zapriDialog(zbirkaDialog);
  zacniIgro(danosti);
}

function zbirkaStatus(besedilo, napaka) {
  zbirkaStatusEl.textContent = besedilo;
  zbirkaStatusEl.className = 'dialog-status' + (napaka ? ' err' : '');
}

zbirkaBtn.addEventListener('click', () => {
  zbirkaStatus('');
  ocenaPocisti();
  izrisiZbirko();
  odpriDialog(zbirkaDialog);
});

// Izvoz/uvoz: enako kot v reševalcu (logika v ../shared/zbirka.js).
const zbirkaIzvoziBtn = document.getElementById('zbirkaIzvoziBtn');
const zbirkaUvoziBtn = document.getElementById('zbirkaUvoziBtn');
zbirkaIzvoziBtn.addEventListener('click', () => {
  const izvoz = zbirkaIzvozi();
  if (izvoz.besedilo) zbirkaPrenesi(izvoz.besedilo);
  zbirkaStatus(izvoz.sporocilo, izvoz.napaka);
});

const zbirkaDatotekaEl = document.getElementById('zbirkaDatoteka');
zbirkaUvoziBtn.addEventListener('click', () => zbirkaDatotekaEl.click());
zbirkaDatotekaEl.addEventListener('change', () => {
  const datoteka = zbirkaDatotekaEl.files[0];
  zbirkaDatotekaEl.value = ''; // da gre ista datoteka lahko znova skozi "change"
  if (!datoteka) return;
  datoteka.text().then(besedilo => {
    const uvoz = zbirkaUvozi(besedilo);
    zbirkaStatus(uvoz.sporocilo, uvoz.napaka);
    if (!uvoz.spremenjeno) return;
    izrisiZbirko();
    osveziGumbZbirke();
    if (igra) izrisiStanje(); // uvoz lahko dopolni težavnost/opombo odprte uganke
  }).catch(e => zbirkaStatus('Datoteke ni bilo mogoče prebrati: ' + e.message, true));
});

/* ---------- ocena zbirke ---------- */

// Gumb "Oceni zbirko": za vsako uganko v zbirki požene razvrstitev (oceniUganko v
// ../shared/generator.js) in podatke reševanja. Ocenjevanje teče v ločeni niti
// (oceni-worker.js; pri file:// v glavni niti po eno uganko na setTimeout) in v
// zbirko samo po sebi NE piše: predlagane spremembe se sproti izpisujejo pri
// ugankah v seznamu, zapiše jih šele gumb "Zapiši ocene".
const oceniBtn = document.getElementById('oceniBtn');
const oceniPrekiniBtn = document.getElementById('oceniPrekiniBtn');
const ocenaGumbiEl = document.getElementById('ocenaGumbi');
const oceniZapisiBtn = document.getElementById('oceniZapisiBtn');
const oceniPreklicBtn = document.getElementById('oceniPreklicBtn');

let ocenjevanje = null; // { danosti: [...], zapisi, i, worker } ali { ..., vGlavniNiti: true }
const ocene = new Map(); // danosti -> { tezavnost, podatki } (nepotrjeni predlog)

function stUgank(n) {
  const r = n % 100;
  const beseda = r === 1 ? 'uganka' : r === 2 ? 'uganki' : (r === 3 || r === 4) ? 'uganke' : 'ugank';
  return `${n} ${beseda}`;
}

// Zakaj uganka ni dobila stopnje: countSolutions() v oceniUganko(). Uganke brez
// natanko ene rešitve (pridejo lahko z uvozom) ni mogoče igrati, zato dobi "Drugo".
function opisResitev(resitve) {
  if (resitve === 1 || resitve === undefined) return '';
  if (resitve === 0) return 'nima rešitve';
  if (resitve === 'unknown') return 'enoličnosti ni bilo mogoče preveriti';
  return 'več kot ena rešitev';
}

// Kaj bi se iz ocene zapisalo v uganko. Uganka brez natanko ene rešitve dobi samo
// težavnost "Drugo": podatki reševanja bi bili iz ene od več poti (reševalec jih
// pri taki uganki tudi ne shrani - glej zbirkaPoResevanju v app/zbirka.js).
function ocenaZapis(o) {
  return o.resitve === 1 ? { ...o.podatki, tezavnost: o.tezavnost } : { tezavnost: o.tezavnost };
}

// Kaj bi se pri uganki spremenilo, če oceno zapišemo. Vrne besedilo za izpis ali
// '' (zapis je že enak oceni).
function ocenaSprememba(z, o) {
  const zapis = ocenaZapis(o);
  const deli = [];
  if ((z.tezavnost || '') !== zapis.tezavnost) {
    deli.push(`${z.tezavnost || 'brez težavnosti'} → ${zapis.tezavnost}`);
  }
  if (zapis.tehnike) {
    const nova = zbirkaOznakaTehnik({ tehnike: zapis.tehnike });
    if (zbirkaOznakaTehnik(z) !== nova) deli.push(nova);
    else if (z.reseno !== zapis.reseno || z.koraki !== zapis.koraki || z.ugibanje !== zapis.ugibanje) {
      deli.push('podatki reševanja');
    }
  }
  return deli.join(' · ');
}

function ocenaSprememb() {
  let n = 0;
  for (const z of zbirkaBeri()) {
    const o = ocene.get(z.danosti);
    if (o && ocenaSprememba(z, o)) n++;
  }
  return n;
}

// Vrstica z oceno pri uganki v seznamu (nad gumbom Igraj/Nadaljuj).
function izrisiOceno(danosti, zapis) {
  const li = zbirkaVrstice.get(danosti);
  if (!li) return;
  const staro = li.querySelector('.zb-ocena');
  if (staro) staro.remove();
  const o = ocene.get(danosti);
  if (!o) return;
  const z = zapis || zbirkaBeri().find(x => x.danosti === danosti);
  if (!z) return;
  const sprememba = ocenaSprememba(z, o);
  const razlog = opisResitev(o.resitve);
  const el = document.createElement('div');
  el.className = 'zb-info zb-ocena' + (sprememba ? ' zb-ocena-nova' : '');
  el.textContent = (sprememba ? `ocena: ${sprememba}` : 'ocena: brez sprememb')
    + (razlog ? ` · ${razlog}` : '');
  li.insertBefore(el, li.querySelector('.zb-gumbi'));
}

function osveziOcenoGumbe() {
  const tece = !!ocenjevanje;
  oceniBtn.disabled = tece;
  oceniPrekiniBtn.hidden = !tece;
  zbirkaIzvoziBtn.disabled = tece;
  zbirkaUvoziBtn.disabled = tece;
  const sprememb = tece ? 0 : ocenaSprememb();
  ocenaGumbiEl.hidden = tece || !sprememb;
  oceniZapisiBtn.textContent = `Zapiši ocene (${sprememb})`;
}

// Pozabi nepotrjeni predlog (zaprtje okna, preklic, zapis).
function ocenaPocisti() {
  ocene.clear();
  osveziOcenoGumbe();
}

function izpisiOcenoNapredek() {
  if (!ocenjevanje) return;
  zbirkaStatus(`Ocenjujem … ${ocenjevanje.i} od ${ocenjevanje.danosti.length}.`);
}

// Sporočila delavca in ocenjevanja v glavni niti so enaka (glej oceni-worker.js).
function obdelajOceno(m) {
  if (!ocenjevanje) return;
  if (m.tip === 'ocena') {
    ocene.set(m.danosti, { tezavnost: m.tezavnost, resitve: m.resitve, podatki: m.podatki });
    ocenjevanje.i = m.i + 1;
    izrisiOceno(m.danosti, ocenjevanje.zapisi.get(m.danosti));
    izpisiOcenoNapredek();
    return;
  }
  const ocenjenih = ocene.size;
  ustaviOcenjevanje();
  if (m.tip === 'napaka') {
    zbirkaStatus('Ocenjevanje ni uspelo: ' + (m.sporocilo || 'neznana napaka'), true);
    return;
  }
  const sprememb = ocenaSprememb();
  const brezEnolicne = [...ocene.values()].filter(o => opisResitev(o.resitve)).length;
  zbirkaStatus((sprememb
    ? `Ocenjeno: ${stUgank(ocenjenih)}, predlaganih sprememb: ${sprememb}. Preglej jih v seznamu in potrdi.`
    : `Ocenjeno: ${stUgank(ocenjenih)}. Vse ocene so že zapisane.`)
    + (brezEnolicne ? ` Brez natanko ene rešitve: ${brezEnolicne} (teh ni mogoče igrati, zato dobijo »Drugo«).` : ''));
}

// Ustavi ocenjevanje (gumb Prekini, zaprtje okna, konec). Že prejete ocene ostanejo
// v predlogu; z besedilom izpiše še sporočilo.
function ustaviOcenjevanje(besedilo) {
  if (!ocenjevanje) return;
  if (ocenjevanje.worker) ocenjevanje.worker.terminate();
  if (ocenjevanje.casovnik) clearTimeout(ocenjevanje.casovnik);
  ocenjevanje = null;
  osveziOcenoGumbe();
  if (besedilo) zbirkaStatus(besedilo);
}

// Nadomestna pot za file://: ena uganka na setTimeout, da se stran vmes osveži.
function ocenjevanjeVGlavniNiti() {
  ocenjevanje.vGlavniNiti = true;
  const korak = () => {
    if (!ocenjevanje || !ocenjevanje.vGlavniNiti) return;
    const i = ocenjevanje.i;
    if (i >= ocenjevanje.danosti.length) return obdelajOceno({ tip: 'konec', ocenjenih: i });
    const danosti = ocenjevanje.danosti[i];
    try {
      const o = oceniUganko(danosti);
      obdelajOceno({ tip: 'ocena', i, danosti, tezavnost: o.tezavnost, resitve: o.resitve,
        podatki: zbirkaPodatkiResevanja(o.board, o.log) });
    } catch (e) {
      return obdelajOceno({ tip: 'napaka', sporocilo: e.message });
    }
    if (ocenjevanje) ocenjevanje.casovnik = setTimeout(korak, 0);
  };
  ocenjevanje.casovnik = setTimeout(korak, 0);
}

oceniBtn.addEventListener('click', () => {
  if (ocenjevanje) return;
  const zbirka = zbirkaBeri();
  if (!zbirka.length) { zbirkaStatus('Zbirka je prazna - ni česa oceniti.'); return; }
  ocene.clear();
  ocenjevanje = {
    danosti: zbirka.map(z => z.danosti),
    zapisi: new Map(zbirka.map(z => [z.danosti, z])),
    i: 0,
  };
  izrisiZbirko(); // pobriše ocene prejšnjega ocenjevanja iz seznama
  osveziOcenoGumbe();
  izpisiOcenoNapredek();
  try {
    const w = new Worker('oceni-worker.js');
    w.onmessage = (e) => obdelajOceno(e.data);
    w.onerror = () => {
      // Delavec se ni naložil (npr. file://) - ocenjujemo v glavni niti.
      if (!ocenjevanje) return;
      w.terminate();
      ocenjevanje.worker = null;
      ocenjevanjeVGlavniNiti();
    };
    w.postMessage({ danosti: ocenjevanje.danosti });
    ocenjevanje.worker = w;
  } catch (e) {
    ocenjevanjeVGlavniNiti();
  }
});

oceniPrekiniBtn.addEventListener('click', () => {
  const ocenjenih = ocene.size;
  ustaviOcenjevanje();
  const sprememb = ocenaSprememb();
  zbirkaStatus(`Ocenjevanje prekinjeno po ${stUgank(ocenjenih)}.`
    + (sprememb ? ` Predlaganih sprememb: ${sprememb}.` : ''));
});

// Zapis predloga v zbirko: samo uganke, pri katerih bi se kaj spremenilo. Datum
// dodajanja, podatki o mojem reševanju in opomba ostanejo nedotaknjeni, datum
// "Ocenjeno" (nazadnje) pa se osveži - ocenil jih je program zdaj.
oceniZapisiBtn.addEventListener('click', () => {
  const zbirka = zbirkaBeri();
  const cas = igraZdaj();
  let n = 0;
  for (const z of zbirka) {
    const o = ocene.get(z.danosti);
    if (!o || !ocenaSprememba(z, o)) continue;
    Object.assign(z, ocenaZapis(o), { nazadnje: cas });
    n++;
  }
  if (!zbirkaPisi(zbirka)) {
    zbirkaStatus('Ocen ni bilo mogoče zapisati (brskalnik ne dovoli shranjevanja).', true);
    return;
  }
  ocenaPocisti();
  izrisiZbirko();
  if (igra) izrisiStanje(); // kartica "Uganka" kaže težavnost in tehnike
  zbirkaStatus(`Zapisano: ${stUgank(n)}.`);
});

oceniPreklicBtn.addEventListener('click', () => {
  ocenaPocisti();
  izrisiZbirko();
  zbirkaStatus('Ocene zavržene, zbirka ostaja nespremenjena.');
});

/* ---------- nova uganka: ustvarjanje po stopnjah ---------- */

// Iskanje teče v ločeni niti (generator-worker.js), da stran ostane odzivna in
// je prekinitev takojšnja (terminate). Pri odpiranju datoteke prek file:// Chrome
// workerja ne dovoli - takrat se išče v glavni niti po eno seme na setTimeout.
const MEJA_ISKANJA = 30000;
const STOPNJA_KLJUC = 'sudoku.igra.stopnja';
const stopnjeGumbiEl = document.getElementById('stopnjeGumbi');
const ustvariBtn = document.getElementById('ustvariBtn');
const prekiniBtn = document.getElementById('prekiniBtn');
const ustvariStatusEl = document.getElementById('ustvariStatus');
let izbranaStopnja = STOPNJE_UGANK[0].kljuc;
let iskanje = null; // { stopnja, zacetek, poskusi, worker } ali { ..., vGlavniNiti: true }

try {
  const shranjena = localStorage.getItem(STOPNJA_KLJUC);
  if (stopnjaUganke(shranjena)) izbranaStopnja = shranjena;
} catch (e) { /* privzeta stopnja */ }

const stopnjeGumbi = STOPNJE_UGANK.map(s => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'stopnja';
  b.textContent = s.ime;
  b.title = s.opis;
  b.addEventListener('click', () => {
    if (iskanje) return;
    izbranaStopnja = s.kljuc;
    try { localStorage.setItem(STOPNJA_KLJUC, s.kljuc); } catch (e) { /* velja do osvežitve */ }
    ustvariBtn.textContent = 'Ustvari uganko';
    ustvariStatus('');
    osveziStopnje();
  });
  stopnjeGumbiEl.appendChild(b);
  return { kljuc: s.kljuc, el: b };
});
osveziStopnje();

function osveziStopnje() {
  for (const g of stopnjeGumbi) {
    g.el.classList.toggle('izbrana', g.kljuc === izbranaStopnja);
    g.el.setAttribute('aria-pressed', String(g.kljuc === izbranaStopnja));
    g.el.disabled = !!iskanje;
  }
  ustvariBtn.disabled = !!iskanje;
  prekiniBtn.hidden = !iskanje;
}

function ustvariStatus(besedilo, napaka) {
  ustvariStatusEl.textContent = besedilo;
  ustvariStatusEl.className = 'dialog-status' + (napaka ? ' err' : '');
}

function izpisiNapredek() {
  if (!iskanje) return;
  const s = stopnjaUganke(iskanje.stopnja);
  const sekunde = Math.round((Date.now() - iskanje.zacetek) / 1000);
  ustvariStatus(`Iščem uganko stopnje »${s.ime}« … ${sekunde} s, poskusov ${iskanje.poskusi}.`);
}

// Sporočila workerja in iskanja v glavni niti so enaka (glej generator-worker.js).
function obdelajIskanje(m) {
  if (!iskanje) return;
  if (m.tip === 'napredek') {
    iskanje.poskusi = m.poskusi;
    izpisiNapredek();
    return;
  }
  if (m.tip === 'najdena') {
    const stopnja = stopnjaUganke(m.stopnja);
    ustaviIskanje();
    ustvariStatus('');
    dodajVZbirko(m.danosti, stopnja.ime, 'generator');
    zapriDialog(novaDialog);
    zacniIgro(m.danosti);
    sporocilo = {
      besedilo: `Ustvarjena uganka stopnje »${stopnja.ime}« (danih ${m.danosti.replace(/0/g, '').length}). Dodana je v zbirko.`,
      razred: 'ok',
    };
    osvezi();
    return;
  }
  const s = stopnjaUganke(iskanje.stopnja);
  const poskusi = m.poskusi;
  ustaviIskanje();
  if (m.tip === 'obup') {
    ustvariBtn.textContent = 'Poskusi znova';
    ustvariStatus(`V ${Math.round(MEJA_ISKANJA / 1000)} s nisem našel uganke stopnje »${s.ime}« (poskusov ${poskusi}). Poskusi znova - vsak poskus začne z drugo mrežo.`, true);
  } else {
    ustvariStatus('Iskanje ni uspelo: ' + (m.sporocilo || 'neznana napaka'), true);
  }
}

// Ustavi iskanje (gumb Prekini, zaprtje okna, najdena uganka). Z besedilom izpiše
// še sporočilo; brez njega status pusti pri miru.
function ustaviIskanje(besedilo) {
  if (!iskanje) return;
  if (iskanje.worker) iskanje.worker.terminate();
  if (iskanje.casovnik) clearTimeout(iskanje.casovnik);
  if (iskanje.tiktak) clearInterval(iskanje.tiktak);
  iskanje = null;
  osveziStopnje();
  if (besedilo) ustvariStatus(besedilo);
}

// Nadomestna pot za file://: eno seme na setTimeout, da se stran vmes osveži in
// gumb Prekini deluje (med enim semenom je zamrznjena pribl. 0,2 s).
function iskanjeVGlavniNiti() {
  iskanje.vGlavniNiti = true;
  const korak = () => {
    if (!iskanje || !iskanje.vGlavniNiti) return;
    const u = ustvariUgankoNaklucno(iskanje.stopnja);
    const poskusi = iskanje.poskusi + 1;
    const ms = Date.now() - iskanje.zacetek;
    if (u) return obdelajIskanje({ tip: 'najdena', danosti: u.danosti, stopnja: iskanje.stopnja, seme: u.seme, poskusi, ms });
    if (ms >= MEJA_ISKANJA) return obdelajIskanje({ tip: 'obup', poskusi, ms });
    obdelajIskanje({ tip: 'napredek', poskusi, ms });
    if (iskanje) iskanje.casovnik = setTimeout(korak, 0);
  };
  iskanje.casovnik = setTimeout(korak, 0);
}

ustvariBtn.addEventListener('click', () => {
  if (iskanje) return;
  ustvariBtn.textContent = 'Ustvari uganko'; // po neuspehu piše "Poskusi znova"
  iskanje = { stopnja: izbranaStopnja, zacetek: Date.now(), poskusi: 0 };
  iskanje.tiktak = setInterval(izpisiNapredek, 500); // ura teče tudi med dolgim semenom
  osveziStopnje();
  izpisiNapredek();
  try {
    const w = new Worker('generator-worker.js');
    w.onmessage = (e) => obdelajIskanje(e.data);
    w.onerror = () => {
      // Worker se ni naložil (npr. file://) - iskanje nadaljujemo v glavni niti.
      if (!iskanje) return;
      w.terminate();
      iskanje.worker = null;
      iskanjeVGlavniNiti();
    };
    w.postMessage({ stopnja: iskanje.stopnja, meja: MEJA_ISKANJA });
    iskanje.worker = w;
  } catch (e) {
    iskanjeVGlavniNiti();
  }
});

prekiniBtn.addEventListener('click', () => {
  ustvariBtn.textContent = 'Ustvari uganko';
  ustaviIskanje('Iskanje prekinjeno.');
});

// Uganko doda v zbirko (enako kot "Reši" v reševalcu); obstoječega zapisa ne
// spreminjamo. Ustvarjena uganka dobi težavnost svoje stopnje namesto privzete,
// izvor pa pove, ali jo je ustvaril generator ali si jo vnesel sam.
function dodajVZbirko(danosti, tezavnost, izvor) {
  if (zbirkaBeri().some(z => z.danosti === danosti)) return;
  const { board, log } = solve(danosti);
  zbirkaShraniResitev(danosti, board, log, { tezavnost, izvor });
  osveziGumbZbirke();
}

/* ---------- nova uganka: vnos danosti ---------- */

const novaDialog = document.getElementById('novaDialog');
const novaMrezaEl = document.getElementById('novaMreza');
const novaNizEl = document.getElementById('novaNiz');
const novaStatusEl = document.getElementById('novaStatus');
const novaZacniBtn = document.getElementById('novaZacni');

const vnosi = [];
for (let i = 0; i < 81; i++) {
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'numeric';
  inp.autocomplete = 'off';
  inp.maxLength = 1;
  inp.dataset.r = Math.floor(i / 9);
  inp.dataset.c = i % 9;
  inp.setAttribute('aria-label', cellLabel(i));
  inp.addEventListener('focus', () => inp.select());
  inp.addEventListener('input', () => {
    const v = inp.value.replace(/[^1-9]/g, '').slice(-1);
    inp.value = v;
    oznaciKonflikte();
    if (v && i < 80) vnosi[i + 1].focus();
  });
  inp.addEventListener('keydown', (e) => {
    const cilj = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 9, ArrowUp: i - 9 }[e.key];
    if (cilj !== undefined && cilj >= 0 && cilj < 81) { e.preventDefault(); vnosi[cilj].focus(); }
    else if (e.key === 'Backspace' && !inp.value && i > 0) vnosi[i - 1].focus();
    else if (e.key === 'Enter') novaZacniBtn.click();
  });
  novaMrezaEl.appendChild(inp);
  vnosi.push(inp);
}

function vneseneDanosti() {
  return vnosi.map(inp => inp.value || '0').join('');
}

function oznaciKonflikte() {
  vnosi.forEach(inp => inp.classList.remove('konflikt'));
  let ok = true;
  for (const unit of ALL_UNITS) {
    const videne = {};
    for (const c of unit) {
      const v = vnosi[c].value;
      if (!v) continue;
      if (videne[v] !== undefined) {
        vnosi[c].classList.add('konflikt');
        vnosi[videne[v]].classList.add('konflikt');
        ok = false;
      } else videne[v] = c;
    }
  }
  return ok;
}

function novaStatus(besedilo, napaka) {
  novaStatusEl.textContent = besedilo;
  novaStatusEl.className = 'dialog-status' + (napaka ? ' err' : '');
}

novaNizEl.addEventListener('input', () => {
  const znaki = novaNizEl.value.replace(/[^0-9.]/g, '');
  if (znaki.length === 81) {
    znaki.split('').forEach((ch, i) => { vnosi[i].value = (ch === '0' || ch === '.') ? '' : ch; });
    oznaciKonflikte();
    novaStatus('Niz je vpisan v mrežo.');
  } else if (znaki.length) {
    novaStatus(`Veljavnih znakov v nizu: ${znaki.length} (potrebnih je 81).`, true);
  } else {
    novaStatus('');
  }
});

document.getElementById('novaPocisti').addEventListener('click', () => {
  vnosi.forEach(inp => { inp.value = ''; inp.classList.remove('konflikt'); });
  novaNizEl.value = '';
  novaStatus('');
  vnosi[0].focus();
});

novaZacniBtn.addEventListener('click', () => {
  const danosti = vneseneDanosti();
  if (!/[1-9]/.test(danosti)) { novaStatus('Najprej vnesi danosti.', true); return; }
  if (!oznaciKonflikte()) { novaStatus('Popravi rdeče označene celice - ista števka se ponavlja v vrstici, stolpcu ali bloku.', true); return; }
  novaStatus('Preverjam, ali ima uganka natanko eno rešitev ...');
  novaZacniBtn.disabled = true;
  setTimeout(() => {
    try {
      const n = countSolutions(danosti);
      if (n !== 1) {
        novaStatus(n === 0 ? 'Uganka nima rešitve - preveri danosti.'
          : n === 'unknown' ? 'Enoličnosti ni bilo mogoče preveriti v razumnem času, zato uganke ne morem ponuditi za igro.'
          : 'Uganka ima več kot eno rešitev - za igro potrebujem uganko z natanko eno rešitvijo.', true);
        return;
      }
      dodajVZbirko(danosti, '', 'rocno');
      zapriDialog(novaDialog);
      zacniIgro(danosti);
    } catch (e) {
      novaStatus('Prišlo je do napake: ' + e.message, true);
    } finally {
      novaZacniBtn.disabled = false;
    }
  }, 30);
});

document.getElementById('novaBtn').addEventListener('click', () => {
  novaStatus('');
  ustvariStatus('');
  ustvariBtn.textContent = 'Ustvari uganko';
  odpriDialog(novaDialog);
  novaNizEl.focus();
});

/* ---------- barve poudarka (za nastavljanje) ---------- */

// Preizkus vseh štirih barv poudarka (--poud, --poud2, --poud3, --poud4): najprej
// gumb 1-4 (katero barvo nastavljam), nato izbirnik barv ali hex vnos. Velja takoj
// in si ga zapomni brskalnik (sudoku.igra.poud: { "1": "#RRGGBB", ... }, samo
// spremenjene). "Privzeto" vrne vse štiri na vrednosti iz igra.css.
const POUD_KLJUC = 'sudoku.igra.poud';
const POUD_SPREMENLJIVKE = ['--poud', '--poud2', '--poud3', '--poud4'];
const poudGumbiEl = document.getElementById('poudGumbi');
const poudBarvaEl = document.getElementById('poudBarva');
const poudHexEl = document.getElementById('poudHex');
const privzetePoud = POUD_SPREMENLJIVKE.map(
  v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toUpperCase());
// Nastavljene barve po mestih (null = privzeta iz igra.css) in mesto, ki ga
// trenutno nastavljam.
const poudBarve = POUD_SPREMENLJIVKE.map(() => null);
let poudMesto = 0;

// '#abc', 'abc', '#aabbcc' ali 'aabbcc' -> '#AABBCC'; drugače null.
function normalizirajHex(v) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, ch => ch + ch) : m[1];
  return '#' + h.toUpperCase();
}

const poudGumbi = POUD_SPREMENLJIVKE.map((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'poud-gumb';
  b.textContent = i + 1;
  b.title = `Nastavi ${i + 1}. barvo poudarka`;
  b.addEventListener('click', () => {
    poudMesto = i;
    osveziPoudVnose();
  });
  poudGumbiEl.appendChild(b);
  return b;
});

function barvaMesta(i) {
  return poudBarve[i] || privzetePoud[i];
}

// Gumbi 1-4 kažejo trenutne barve, vnosa pa barvo izbranega mesta.
function osveziPoudVnose() {
  poudGumbi.forEach((b, i) => {
    b.style.background = barvaMesta(i);
    b.classList.toggle('izbran', i === poudMesto);
    b.setAttribute('aria-pressed', String(i === poudMesto));
  });
  const trenutna = barvaMesta(poudMesto);
  poudBarvaEl.value = trenutna.toLowerCase();
  if (document.activeElement !== poudHexEl) poudHexEl.value = trenutna;
  poudHexEl.classList.remove('napacno');
}

function poudShrani() {
  const v = {};
  poudBarve.forEach((barva, i) => { if (barva) v[i + 1] = barva; });
  try {
    if (Object.keys(v).length) localStorage.setItem(POUD_KLJUC, JSON.stringify(v));
    else localStorage.removeItem(POUD_KLJUC);
  } catch (e) { /* brez shrambe veljajo barve samo do osvežitve */ }
}

// barva = null -> privzeta iz igra.css.
function nastaviPoud(i, barva, shrani) {
  poudBarve[i] = barva;
  if (barva) document.documentElement.style.setProperty(POUD_SPREMENLJIVKE[i], barva);
  else document.documentElement.style.removeProperty(POUD_SPREMENLJIVKE[i]);
  osveziPoudVnose();
  if (shrani) poudShrani();
}

// Vnesena barva, enaka privzeti, se shrani kot "privzeta" (null).
function nastaviIzbrano(barva) {
  nastaviPoud(poudMesto, barva === privzetePoud[poudMesto] ? null : barva, true);
}

poudHexEl.addEventListener('input', () => {
  const barva = normalizirajHex(poudHexEl.value);
  if (barva) nastaviIzbrano(barva);
  else poudHexEl.classList.add('napacno');
});
// Nedokončan ali napačen vnos se ob odhodu iz polja vrne na veljavno barvo.
poudHexEl.addEventListener('blur', () => {
  poudHexEl.value = barvaMesta(poudMesto);
  poudHexEl.classList.remove('napacno');
});
poudBarvaEl.addEventListener('input', () => {
  const barva = normalizirajHex(poudBarvaEl.value);
  if (barva) nastaviIzbrano(barva);
});
document.getElementById('poudPrivzeto').addEventListener('click', () => {
  POUD_SPREMENLJIVKE.forEach((_, i) => nastaviPoud(i, null, false));
  poudShrani();
});

// Shranjeno: { "1": "#RRGGBB", ... }. Star zapis (sam hex niz) je bil barva
// prvega poudarka - preberemo ga kot mesto 1.
function poudPreberiShranjeno() {
  let zapis = null;
  try { zapis = localStorage.getItem(POUD_KLJUC); } catch (e) { return; }
  if (!zapis) return;
  const star = normalizirajHex(zapis);
  if (star) { poudBarve[0] = star; return; }
  let v = null;
  try { v = JSON.parse(zapis); } catch (e) { return; }
  if (!v || typeof v !== 'object') return;
  POUD_SPREMENLJIVKE.forEach((_, i) => {
    const barva = typeof v[i + 1] === 'string' ? normalizirajHex(v[i + 1]) : null;
    if (barva) poudBarve[i] = barva;
  });
}

poudPreberiShranjeno();
POUD_SPREMENLJIVKE.forEach((_, i) => { if (poudBarve[i]) nastaviPoud(i, poudBarve[i], false); });
osveziPoudVnose();

/* ---------- zagon ---------- */

uskladiIgranje(); // uganke, igrane pred uvedbo teh podatkov (ali v drugem zavihku)
osveziGumbZbirke();
const zadnja = igraZadnja();
if (zadnja) {
  igra = zadnja;
  stanje = stanjeIgre(igra);
  sporocilo = zadnja.poteze.length
    ? { besedilo: `Nadaljuješ zadnjo igro (poteza ${zadnja.kazalec} / ${zadnja.poteze.length}).`, razred: '' }
    : null;
}
izrisi();
