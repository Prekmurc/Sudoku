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
// modra, zelena, rumena, oranžna (--poud, --poud2 ... v igra.css). Brez kljukice
// "več hkrati" je poudarjena kvečjemu ena števka (modra).
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

function izvedi(poteza) {
  if (!igra || !dodajPotezo(igra, poteza, stanje)) return;
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

// Po vsaki spremembi igre: novo stanje, shrani, izriši.
function osvezi() {
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
  izrisi();
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
  if (!igra || !lahkoRazveljavi(igra)) return;
  razveljavi(igra);
  sporocilo = null;
  osvezi();
});
ponoviBtn.addEventListener('click', () => {
  if (!igra || !lahkoPonovi(igra)) return;
  ponovi(igra);
  sporocilo = null;
  osvezi();
});
zbrisiBtn.addEventListener('click', zbrisiVpis);
znovaBtn.addEventListener('click', () => {
  if (!igra || igra.kazalec === 0) return;
  if (!confirm('Začnem znova? Vse poteze bodo razveljavljene. Z »Ponovi« jih lahko vrneš, dokler ne narediš nove poteze.')) return;
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
  const a = !igra ? mozneAkcije(null, null)
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
  razveljaviBtn.disabled = !igra || !lahkoRazveljavi(igra);
  ponoviBtn.disabled = !igra || !lahkoPonovi(igra);
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
  const deli = [z.tezavnost || 'težavnost ni določena', `dodana ${zbirkaPrikazDatuma(z.dodano)}`, `danih števk: ${danih}`,
    zbirkaOznakaTehnik(z)];
  return deli.join(' · ') + (z.opomba ? ` — ${z.opomba}` : '');
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
  const fokus = zadnjaPoudarjena();
  const prednost = fokus !== null ? fokus : sidro;
  setTimeout(() => {
    if (pomoc !== iskanje) return; // vmes poteza, Skrij ali Preveri
    const korak = nextStep(stanje.deska, ALL_TECHNIQUES, prednost);
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
  osvezi();
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
function zapriDialog(el) { el.classList.remove('odprt'); }

document.querySelectorAll('.dialog').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-zapri]')) zapriDialog(el);
  });
});

/* ---------- zbirka ---------- */

const zbirkaDialog = document.getElementById('zbirkaDialog');
const zbirkaSeznamEl = document.getElementById('zbirkaSeznam');
const primeriSeznamEl = document.getElementById('primeriSeznam');
const zbirkaStatusEl = document.getElementById('zbirkaStatus');

function osveziGumbZbirke() {
  zbirkaBtn.textContent = `Zbirka (${zbirkaBeri().length})`;
}

function zbirkaStatusIgre(danosti, zapis) {
  if (!zapis) return { besedilo: 'nova', razred: '' };
  const { vpisi } = odigrajPoteze(danosti, zapis.poteze || [], zapis.kazalec || 0);
  const izpolnjenih = danosti.split('').filter((ch, c) => ch !== '0' || vpisi[c]).length;
  if (izpolnjenih === 81) return { besedilo: 'rešeno ✓', razred: 'reseno' };
  return { besedilo: `v teku: ${izpolnjenih}/81`, razred: 'v-teku' };
}

// Vrstica "danih: N · nova / v teku / rešeno · trenutno odprta" in gumb
// Igraj/Nadaljuj - enako za vgrajene primere in uganke iz zbirke.
function infoUganke(danosti, zapis, trenutna) {
  const st = zbirkaStatusIgre(danosti, zapis);
  const info = document.createElement('div');
  info.className = 'zb-info';
  const oznaka = document.createElement('span');
  oznaka.className = st.razred;
  oznaka.textContent = st.besedilo;
  info.append(`danih: ${danosti.replace(/0/g, '').length} · `, oznaka, trenutna ? ' · trenutno odprta' : '');
  return info;
}

function gumbiUganke(danosti, zapis) {
  const gumbi = document.createElement('div');
  gumbi.className = 'zb-gumbi';
  const igraj = document.createElement('button');
  igraj.type = 'button';
  igraj.className = 'primary';
  igraj.textContent = zapis ? 'Nadaljuj' : 'Igraj';
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

function izrisiZbirko() {
  const zbirka = zbirkaBeri();
  const igre = igreBeri().igre;
  izrisiPrimere(igre);
  zbirkaSeznamEl.innerHTML = '';
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
    vrstica.textContent = `${zbirkaPrikazDatuma(z.nazadnje || z.dodano)} · ${tezavnost}`;
    li.appendChild(vrstica);

    li.appendChild(infoUganke(z.danosti, igre[z.danosti], trenutna));

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
  izrisiZbirko();
  odpriDialog(zbirkaDialog);
});

// Izvoz/uvoz: enako kot v reševalcu (logika v ../shared/zbirka.js).
document.getElementById('zbirkaIzvoziBtn').addEventListener('click', () => {
  const izvoz = zbirkaIzvozi();
  if (izvoz.besedilo) zbirkaPrenesi(izvoz.besedilo);
  zbirkaStatus(izvoz.sporocilo, izvoz.napaka);
});

const zbirkaDatotekaEl = document.getElementById('zbirkaDatoteka');
document.getElementById('zbirkaUvoziBtn').addEventListener('click', () => zbirkaDatotekaEl.click());
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

/* ---------- nova uganka ---------- */

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
      // Nova uganka gre v zbirko (enako kot ob "Reši" v reševalcu); obstoječega
      // zapisa ne spreminjamo.
      if (!zbirkaBeri().some(z => z.danosti === danosti)) {
        const { board, log } = solve(danosti);
        zbirkaShraniResitev(danosti, board, log);
        osveziGumbZbirke();
      }
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
  odpriDialog(novaDialog);
  novaNizEl.focus();
});

/* ---------- barva poudarka (za nastavljanje) ---------- */

// Preizkus barve poudarka (--poud): vnos hex vrednosti ali izbirnik barv,
// velja takoj, zapomni si jo brskalnik. Privzeta barva je v igra.css.
const POUD_KLJUC = 'sudoku.igra.poud';
const poudBarvaEl = document.getElementById('poudBarva');
const poudHexEl = document.getElementById('poudHex');
const privzetaPoud = getComputedStyle(document.documentElement).getPropertyValue('--poud').trim().toUpperCase();

// '#abc', 'abc', '#aabbcc' ali 'aabbcc' -> '#AABBCC'; drugače null.
function normalizirajHex(v) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, ch => ch + ch) : m[1];
  return '#' + h.toUpperCase();
}

// barva = null -> privzeta iz igra.css.
function nastaviPoud(barva, shrani) {
  if (barva) document.documentElement.style.setProperty('--poud', barva);
  else document.documentElement.style.removeProperty('--poud');
  const trenutna = barva || privzetaPoud;
  poudBarvaEl.value = trenutna.toLowerCase();
  if (document.activeElement !== poudHexEl) poudHexEl.value = trenutna;
  poudHexEl.classList.remove('napacno');
  if (!shrani) return;
  try {
    if (barva) localStorage.setItem(POUD_KLJUC, barva);
    else localStorage.removeItem(POUD_KLJUC);
  } catch (e) { /* brez shrambe velja barva samo do osvežitve */ }
}

poudHexEl.addEventListener('input', () => {
  const barva = normalizirajHex(poudHexEl.value);
  if (barva) nastaviPoud(barva === privzetaPoud ? null : barva, true);
  else poudHexEl.classList.add('napacno');
});
// Nedokončan ali napačen vnos se ob odhodu iz polja vrne na veljavno barvo.
poudHexEl.addEventListener('blur', () => {
  poudHexEl.value = normalizirajHex(poudBarvaEl.value);
  poudHexEl.classList.remove('napacno');
});
poudBarvaEl.addEventListener('input', () => {
  const barva = normalizirajHex(poudBarvaEl.value);
  nastaviPoud(barva === privzetaPoud ? null : barva, true);
  poudHexEl.value = barva;
});
document.getElementById('poudPrivzeto').addEventListener('click', () => {
  nastaviPoud(null, true);
  poudHexEl.value = privzetaPoud;
});

let shranjenaPoud = null;
try { shranjenaPoud = normalizirajHex(localStorage.getItem(POUD_KLJUC) || ''); } catch (e) { /* brez shrambe */ }
nastaviPoud(shranjenaPoud, false);

/* ---------- zagon ---------- */

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
