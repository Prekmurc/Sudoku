/* ==================== KARTICA UGANKE (skupni izris) ====================
   Izris uganke v seznamu zbirke - enak v reševalcu (app/zbirka.js) in igri
   (igra/igra.js, tudi vgrajeni primeri). Podatke da zbirkaKartica() v
   shared/zbirka.js (brez DOM-a), gumbe pa aplikacija: reševalec Odpri/Izbriši,
   igra Igraj/Nadaljuj/Poglej/Izbriši. Slogi so v shared/zbirka.css.
   Tu je tudi vezava gumbov »Izvozi«/»Uvozi« (zbirkaPoveziIzvozUvoz), poslušalec sprememb zbirke v drugem zavihku (zbirkaObSpremembiDrugje), značka
   težavnosti (zbirkaZnacka) in naštevanje tehnik (zbirkaIzrisiTehnike).
   Naloži se za shared/zbirka.js. */

// Zbirko (sudoku.zbirka.v1) in shranjene igre (sudoku.igra.v1) si delita reševalec
// in igra, lahko odprta v več zavihkih. Brskalnik ob zapisu v drugem zavihku sproži
// dogodek "storage" (v zavihku, ki je pisal, ne) - takrat aplikacija osveži števec
// na gumbu "Zbirka" in odprt seznam. `e.key === null` pomeni localStorage.clear().
function zbirkaObSpremembiDrugje(obSpremembi) {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === ZBIRKA_KLJUC || e.key === IGRA_KLJUC) obSpremembi(e);
  });
}

// Gumba »Izvozi« in »Uvozi« v oknu zbirke - vezava na DOM, enaka v reševalcu in igri (logika je
// v shared/zbirka.js: zbirkaIzvozi, zbirkaUvozi, zbirkaPrenesi). `izvozi`/`uvozi` sta gumba,
// `datoteka` skrito polje <input type="file">, `status(besedilo, napaka)` izpiše sporočilo,
// `poUvozu()` osveži prikaz, kadar je uvoz zbirko spremenil (aplikacija ve, kaj). Onemogočenost
// gumbov (igra med ocenjevanjem) nastavlja aplikacija.
function zbirkaPoveziIzvozUvoz({ izvozi, uvozi, datoteka, status, poUvozu }) {
  izvozi.addEventListener('click', () => {
    const izvoz = zbirkaIzvozi();
    if (izvoz.besedilo) zbirkaPrenesi(izvoz.besedilo);
    status(izvoz.sporocilo, izvoz.napaka);
  });
  uvozi.addEventListener('click', () => datoteka.click());
  datoteka.addEventListener('change', () => {
    const f = datoteka.files[0];
    datoteka.value = ''; // da gre ista datoteka lahko znova skozi "change"
    if (!f) return;
    f.text().then(besedilo => {
      const uvoz = zbirkaUvozi(besedilo);
      status(uvoz.sporocilo, uvoz.napaka);
      if (uvoz.spremenjeno) poUvozu();
    }).catch(e => status('Datoteke ni bilo mogoče prebrati: ' + e.message, true));
  });
}

// Stanje kot obarvani del vrstice: "v teku (12/57)", po potrebi še " · napaka".
// Ključ stanja (nova / v-teku / resena) je hkrati razred za barvo.
function zbirkaOznakaStanja(kljuc, besedilo, napaka) {
  const oznaka = document.createElement('span');
  oznaka.className = kljuc;
  oznaka.textContent = besedilo;
  if (!napaka) return [oznaka];
  const pod = document.createElement('span');
  pod.className = 'napaka';
  pod.textContent = 'napaka';
  return [oznaka, ' · ', pod];
}

// Značka težavnosti v barvi ravni (oznake korakov .tag.t-* iz shared/base.css): lahka zelena,
// srednja jantarna, težka vijolična, zelo težka srednje močna vijolična (--purple-dark), ekstrem jasno turkizna
// (--turq-dark), drugo rdeča. Reševalec (pod seznamom primerov) in igra (kartica »Uganka«, vgrajeni primeri).
const ZNACKA_TEZAVNOSTI = { 'Lahka': 't-single', 'Srednja': 't-pair', 'Težka': 't-advanced', 'Zelo težka': 't-advanced znacka-zelo-tezka',
  'Ekstrem': 't-expert znacka-ekstrem' };

function zbirkaZnacka(tezavnost) {
  const el = document.createElement('span');
  el.className = `tag ${ZNACKA_TEZAVNOSTI[tezavnost] || 't-chain'} znacka-tezavnosti`;
  el.textContent = tezavnost;
  return el;
}

// Naštevanje tehnik v element: »Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par« -
// deli iz zbirkaDeliTehnik() (shared/zbirka.js), glavna tehnika krepko; brez podatka »ni podatkov«.
function zbirkaIzrisiTehnike(el, deli) {
  el.append('Tehnike: ');
  if (!deli) { el.append('ni podatkov'); return; }
  deli.forEach((d, i) => {
    if (i) el.append(i === deli.length - 1 ? ' in ' : ', ');
    if (!d.glavna) { el.append(d.besedilo); return; }
    const b = document.createElement('b');
    b.textContent = d.besedilo;
    el.append(b);
  });
}

// Element <li> kartice. `k` je rezultat zbirkaKartica(); `trenutna` = uganka je
// odprta (v igri na mreži, v reševalcu v vnosni mreži) - kartica dobi modro črto in
// značko "trenutno odprta" v prvi vrstici; `gumbi` = [{ napis, razred, obKliku }].
// Vrstice: naslov, stanje (ne pri novi uganki), info (značka težavnosti, danih · tehnike · koraki; pri primeru
// danih in vse tehnike), opomba, gumbi.
function zbirkaIzrisiKartico(k, { trenutna = false, gumbi = [] } = {}) {
  const li = document.createElement('li');
  if (trenutna) li.className = 'trenutna';

  const naslov = document.createElement('div');
  naslov.className = 'zb-vrstica';
  naslov.append(k.naslov);
  if (trenutna) {
    const znacka = document.createElement('span');
    znacka.className = 'zb-trenutna';
    znacka.textContent = 'trenutno odprta';
    naslov.append(' ', znacka);
  }
  if (k.namig) naslov.title = k.namig;
  li.appendChild(naslov);

  // Stanje samo pri uganki v teku ali rešeni - »nova« se ne izpiše (kartica je brez te vrstice).
  const s = k.stanje;
  if (s.kljuc !== 'nova') {
    const stanje = document.createElement('div');
    stanje.className = 'zb-casi';
    stanje.append(s.predpona ? `${s.predpona} · ` : '', ...zbirkaOznakaStanja(s.kljuc, s.besedilo, s.napaka));
    if (k.namig) stanje.title = k.namig;
    li.appendChild(stanje);
  }

  const info = document.createElement('div');
  info.className = 'zb-info';
  // Značka težavnosti (primer in uganka v zbirki enako; brez težavnosti je ni), nato
  // podatki - pri primeru »danih 24« in vse tehnike z glavno krepko.
  if (k.znacka) info.append(zbirkaZnacka(k.znacka), ' ');
  if (k.tehnike) {
    info.append(k.info + ' · ');
    zbirkaIzrisiTehnike(info, k.tehnike);
  } else info.append(k.info);
  li.appendChild(info);

  if (k.opomba) {
    const opomba = document.createElement('div');
    opomba.className = 'zb-opomba';
    opomba.textContent = k.opomba;
    li.appendChild(opomba);
  }

  if (gumbi.length) {
    const vrstica = document.createElement('div');
    vrstica.className = 'zb-gumbi';
    for (const g of gumbi) {
      const b = document.createElement('button');
      b.type = 'button';
      if (g.razred) b.className = g.razred;
      b.textContent = g.napis;
      b.addEventListener('click', g.obKliku);
      vrstica.appendChild(b);
    }
    li.appendChild(vrstica);
  }
  return li;
}
