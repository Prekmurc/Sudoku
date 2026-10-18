/* ==================== KARTICA UGANKE (skupni izris) ====================
   Izris uganke v seznamu zbirke - enak v reševalcu (app/zbirka.js) in igri
   (igra/igra.js, tudi vgrajeni primeri). Podatke da zbirkaKartica() v
   shared/zbirka.js (brez DOM-a), gumbe pa aplikacija: reševalec Odpri/Izbriši,
   igra Igraj/Nadaljuj/Poglej/Izbriši. Slogi so v shared/zbirka.css.
   Tu je tudi vezava gumbov »Izvozi«/»Uvozi« (zbirkaPoveziIzvozUvoz), poslušalec sprememb zbirke v drugem zavihku (zbirkaObSpremembiDrugje), značka
   težavnosti (zbirkaZnacka), naštevanje tehnik (zbirkaIzrisiTehnike) in filtri nad seznamom (zbirkaUstvariFiltre).
   Naloži se za shared/zbirka.js. */

// Zbirko (sudoku.zbirka.v1) in shranjene igre (sudoku.igra.v1) si delita reševalec
// in igra, lahko odprta v več zavihkih. Brskalnik ob zapisu v drugem zavihku sproži
// dogodek "storage" (v zavihku, ki je pisal, ne) - takrat aplikacija osveži števec
// na gumbu "Zbirka" in odprt seznam. `e.key === null` pomeni localStorage.clear().
// Vrnitev z gumbom brskalnika »Nazaj« (stran iz predpomnilnika – pageshow s persisted; naloga 4c, O13 v
// docs/navigacija-nacrt.md): za ključ, ki se je od odhoda (pagehide) spremenil, isti odziv, kot da bi prišel
// dogodek "storage" s staro vrednostjo – za brskalnike, ki dogodka ob obnovi ne dostavijo (Chromium ga dostavi;
// dvojni klic je neškodljiv). Sicer bi se v igro vrnil z uganko, ki si jo vmes izbrisal v reševalcu.
function zbirkaObSpremembiDrugje(obSpremembi) {
  const KLJUCA = [ZBIRKA_KLJUC, IGRA_KLJUC];
  const beri = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  let obOdhodu = null;
  window.addEventListener('storage', (e) => {
    if (e.key === null || KLJUCA.includes(e.key)) obSpremembi(e);
  });
  window.addEventListener('pagehide', () => { obOdhodu = KLJUCA.map(beri); });
  window.addEventListener('pageshow', (e) => {
    const prej = obOdhodu;
    obOdhodu = null;
    if (!e.persisted || !prej) return;
    KLJUCA.forEach((key, i) => {
      const newValue = beri(key);
      if (newValue !== prej[i]) obSpremembi({ key, oldValue: prej[i], newValue });
    });
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

// Filtri in razvrščanje nad seznamom zbirke (naloga 10; logika v shared/zbirka.js): v `vsebnik` izriše štiri
// okenca v mreži dva po dva (Težavnost · Stanje / Tehnika · Razvrsti; vsako v svojem <label> z imenom nad
// okencem) in vrstico »Prikazanih N od M« s »Počisti filtre« (samo pri vklopljenem filtru). Sprememba okenca
// zapiše izbiro (sudoku.zbirka.filtri) in pokliče `obSpremembi()` - aplikacija znova izriše seznam z uporabi().
// Vrne { odpri, uporabi, pripis }:
//   - odpri(): ob odprtju okna prebere izbiro iz shrambe; naslednji uporabi() izprazni vrednosti, ki jih v zbirki
//     ni (tudi v shrambi). Med odprtim oknom izbrana vrednost ostane, tudi če izgine (»(0)«, O7);
//   - uporabi(zbirka, igre): lastnosti ugank (zbirkaLastnostiUganke - s povzetkom igre za kartico), ki ustrezajo
//     izbiri, v izbranem vrstnem redu; osveži možnosti s števili, razred `vklopljen`, vrstico in gumb; pri prazni
//     zbirki skrije vsebnik;
//   - pripis(besedilo): dopis v vrstici za » · « (igra: skriti predlogi ocene, O8); '' ga pobriše.
// Vrednost možnosti: '' = filter izklopljen, sicer '=' + vrednost (prazna težavnost »Ni določena« je '=').
function zbirkaUstvariFiltre(vsebnik, { obSpremembi }) {
  const OKENCA = [['tezavnost', 'Težavnost'], ['stanje', 'Stanje'], ['tehnika', 'Tehnika'], ['razvrsti', 'Razvrsti']];
  let izbira = zbirkaFiltriBeri();
  let obOdprtju = false;
  let pripisBesedilo = '';
  let napis = '';

  const spremeni = (nova) => {
    izbira = nova;
    zbirkaFiltriPisi(izbira);
    obSpremembi();
  };

  const mreza = document.createElement('div');
  mreza.className = 'zb-filtri-mreza';
  const okenca = {};
  for (const [polje, ime] of OKENCA) {
    const oznaka = document.createElement('label');
    oznaka.className = 'zb-filter';
    const imeEl = document.createElement('span');
    imeEl.textContent = ime;
    const sel = document.createElement('select');
    sel.dataset.filter = polje;
    sel.addEventListener('change', () => {
      const v = polje === 'razvrsti' ? sel.value : (sel.value === '' ? null : sel.value.slice(1));
      spremeni({ ...izbira, [polje]: v });
    });
    oznaka.append(imeEl, sel);
    mreza.appendChild(oznaka);
    okenca[polje] = sel;
  }

  const vrstica = document.createElement('div');
  vrstica.className = 'zb-prikazanih';
  const prikazanih = document.createElement('span');
  const pocisti = document.createElement('button');
  pocisti.type = 'button';
  pocisti.className = 'majhen';
  pocisti.textContent = 'Počisti filtre';
  pocisti.hidden = true;
  // Izklopi vse tri filtre; Razvrsti ni filter, zato ostane.
  pocisti.addEventListener('click', () => spremeni({ ...ZBIRKA_BREZ_FILTROV, razvrsti: izbira.razvrsti }));
  vrstica.append(prikazanih, pocisti);
  vsebnik.append(mreza, vrstica);

  const izpisi = () => { prikazanih.textContent = napis + (pripisBesedilo ? ` · ${pripisBesedilo}` : ''); };

  const izpolni = (sel, moznosti, vrednost) => {
    sel.innerHTML = '';
    for (const m of moznosti) {
      const o = document.createElement('option');
      o.value = m.vrednost;
      o.textContent = m.napis;
      sel.appendChild(o);
    }
    sel.value = vrednost;
  };

  return {
    odpri() {
      izbira = zbirkaFiltriBeri();
      obOdprtju = true;
    },
    uporabi(zbirka, igre) {
      const lastnosti = zbirkaLastnostiZbirke(zbirka, igre);
      if (obOdprtju) {
        obOdprtju = false;
        const veljavna = zbirkaFiltriVeljavni(izbira, lastnosti);
        if (JSON.stringify(veljavna) !== JSON.stringify(izbira)) zbirkaFiltriPisi(veljavna);
        izbira = veljavna;
      }
      vsebnik.hidden = !zbirka.length;
      const moznosti = zbirkaMoznostiFiltrov(lastnosti, izbira);
      for (const p of ZBIRKA_FILTRI) {
        const izbrana = izbira[p];
        izpolni(okenca[p], [{ vrednost: '', napis: '' }, ...moznosti[p].map(m => ({ vrednost: '=' + m.vrednost, napis: m.napis }))],
          izbrana === null || izbrana === undefined ? '' : '=' + izbrana);
        okenca[p].classList.toggle('vklopljen', izbrana !== null && izbrana !== undefined);
      }
      izpolni(okenca.razvrsti, ZBIRKA_RAZVRSTI.map(r => ({ vrednost: r.kljuc, napis: r.ime })), izbira.razvrsti);
      const prikazane = zbirkaFiltriraj(lastnosti, izbira);
      napis = zbirkaNapisPrikazanih(prikazane.length, lastnosti.length);
      izpisi();
      pocisti.hidden = !zbirkaImaFilter(izbira);
      return prikazane;
    },
    pripis(besedilo) {
      pripisBesedilo = besedilo;
      izpisi();
    },
  };
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
// srednja jantarna, težka vijolična, zelo težka srednje močna vijolična (--purple-dark), ekstremna jasno turkizna
// (--turq-dark), drugo rdeča. Reševalec (pod seznamom primerov) in igra (kartica »Uganka«, vgrajeni primeri).
const ZNACKA_TEZAVNOSTI = { 'Lahka': 't-single', 'Srednja': 't-pair', 'Težka': 't-advanced', 'Zelo težka': 't-advanced znacka-zelo-tezka',
  'Ekstremna': 't-expert znacka-ekstrem' };

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
