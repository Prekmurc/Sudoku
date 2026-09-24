/* ==================== KARTICA UGANKE (skupni izris) ====================
   Izris uganke v seznamu zbirke - enak v reševalcu (app/zbirka.js) in igri
   (igra/igra.js, tudi vgrajeni primeri). Podatke da zbirkaKartica() v
   shared/zbirka.js (brez DOM-a), gumbe pa aplikacija: reševalec Odpri/Izbriši,
   igra Igraj/Nadaljuj/Poglej. Slogi so v shared/zbirka.css.
   Naloži se za shared/zbirka.js. */

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

// Element <li> kartice. `k` je rezultat zbirkaKartica(); `trenutna` = uganka je
// odprta (v igri na mreži, v reševalcu v vnosni mreži) - kartica dobi modro črto in
// značko "trenutno odprta" v prvi vrstici; `gumbi` = [{ napis, razred, obKliku }].
// Vrstice: naslov, stanje, info (danih · tehnike · koraki), opomba, gumbi.
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

  const s = k.stanje;
  const stanje = document.createElement('div');
  stanje.className = 'zb-casi';
  stanje.append(s.predpona ? `${s.predpona} · ` : '', ...zbirkaOznakaStanja(s.kljuc, s.besedilo, s.napaka));
  if (k.namig) stanje.title = k.namig;
  li.appendChild(stanje);

  const info = document.createElement('div');
  info.className = 'zb-info';
  info.textContent = k.info;
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
