/* shared/pomoc.js — okno Pomoč, skupno igri, reševalcu in treningu (faza 6, korak c,
   docs/faza6-nacrt.md): odpiranje in zapiranje okna, seznam »Tehnike« in seznam stopenj ugank.
   Slogi okna so v shared/pomoc.css. Potrebuje DOM; naloži se za shared/engine.js (imena, oznake in
   opisi tehnik) in shared/generator.js (STOPNJE_UGANK - samo za izpisiStopnje()). */

// Okno Pomoč (element z razredom .dialog; odprto = razred "odprt"): gumbi ga odprejo, zapre ga
// gumb z [data-zapri] (✕), klik ob oknu in Escape. Escape ob odprtem oknu ne pride do drugih
// poslušalcev (tipkovnica plošče) - poslušalec je v fazi zajema. Vrne { odpri, zapri, odprto }.
function ustvariPomoc(okno, gumbi) {
  const odprto = () => okno.classList.contains('odprt');
  const odpri = () => {
    okno.classList.add('odprt');
    // Fokus na ✕: tipke ne gredo več v polje ali mrežo za oknom.
    const x = okno.querySelector('[data-zapri]');
    if (x && x.focus) x.focus();
  };
  const zapri = () => okno.classList.remove('odprt');
  for (const g of gumbi) if (g) g.addEventListener('click', odpri);
  okno.addEventListener('click', e => {
    if (e.target === okno || (e.target.closest && e.target.closest('[data-zapri]'))) zapri();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !odprto()) return;
    zapri();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }, true);
  return { odpri, zapri, odprto };
}

// Raven tehnike za značko v seznamu »Tehnike« - iste barve kot oznaka koraka (.tag.t-* v
// shared/base.css) in značke na karticah treninga (docs/uskladitev.md 1.1).
const POMOC_RAVNI = { 't-single': 'lahka', 't-pair': 'srednja', 't-advanced': 'napredna' };

// Razdelek »Tehnike« v okno Pomoč (element el): poved o ravneh in seznam E1, E2, 1-12 z oznako,
// imenom (angleško ime v oklepaju), značko ravni ter razlago in posledico (opisTehnike()) - vse
// iz shared/engine.js, zato je enako v vseh treh aplikacijah.
function izrisiTehnike(el) {
  const uvod = document.createElement('p');
  uvod.textContent = 'Tehnike so v treh ravneh: lahke (E1, E2), srednje (1–6) in napredne (7–12) – '
    + 'v treningu jih kažejo značke na karticah. Stopnja uganke je raven njene najtežje tehnike.';
  const ul = document.createElement('ul');
  ul.className = 'tehnike';
  for (const [kljuc, tehnika] of [...TRENING_ENOJCKA, ...TRENING_TEHNIKE]) {
    const li = document.createElement('li');
    const oznaka = document.createElement('span');
    oznaka.className = 'tehnika-oznaka';
    oznaka.textContent = oznakaTehnike(kljuc) + ' · ';
    const ime = document.createElement('b');
    ime.textContent = imeTehnike(tehnika);
    const razred = tagClass(tehnika);
    const raven = document.createElement('span');
    raven.className = `tag ${razred} tehnika-raven`;
    raven.textContent = POMOC_RAVNI[razred];
    const opis = document.createElement('p');
    opis.textContent = opisTehnike(kljuc);
    li.append(oznaka, ime, ' ', raven, opis);
    ul.appendChild(li);
  }
  el.append(uvod, ul);
}

// Seznam stopenj (element ul): pri vsaki stopnji ime z malo začetnico in opis iz STOPNJE_UGANK
// (polje "opis" - merilo ocene, ali "opisIskanja" - merilo generatorja; docs/uskladitev.md 5.2).
function izpisiStopnje(el, stopnje, polje) {
  for (const s of stopnje) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = s.ime.toLowerCase();
    li.append(b, ' ' + s[polje]);
    el.appendChild(li);
  }
}

// Stopnje, ki jih uganka lahko dobi: Ekstrem (ekspertna tehnika) šele, ko jo motor pozna.
function stopnjeZaPomoc() {
  return STOPNJE_UGANK.filter(s => s.kljuc !== 'ekstrem' || GEN_EKSPERTNE.length);
}
