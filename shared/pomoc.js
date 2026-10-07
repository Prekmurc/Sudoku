/* shared/pomoc.js — okno Pomoč, skupno igri, reševalcu in treningu (faza 6, korak c,
   docs/faza6-nacrt.md): odpiranje in zapiranje okna, seznam »Tehnike« in seznam stopenj ugank.
   Slogi okna so v shared/pomoc.css. Potrebuje DOM; naloži se za shared/engine.js (imena, oznake in
   opisi tehnik), shared/generator.js (STOPNJE_UGANK - samo za izpisiStopnje()) in shared/sheme.js
   (shema vzorca v seznamu »Tehnike« - faza 3a, korak 4; brez nje seznam nima shem). */

// Okno Pomoč (element z razredom .dialog; odprto = razred "odprt"): gumbi ga odprejo, zapre ga
// gumb z [data-zapri] (✕), klik ob oknu in Escape. Escape ob odprtem oknu ne pride do drugih
// poslušalcev (tipkovnica plošče) - poslušalec je v fazi zajema. Vrne { odpri, zapri, odprto }.
// Oznaka različice iz ?v= te skripte (tools/oznaci-razlicico.js), npr. »2026-10-05.1432«, ali ''.
const RAZLICICA = (() => {
  const s = typeof document !== 'undefined' && document.currentScript && document.currentScript.src;
  const m = s && /[?&]v=([^&#]+)/.exec(s);
  return m ? decodeURIComponent(m[1]) : '';
})();

// »Različica 2026-10-05 14:32« za dno okna Pomoč ('' brez oznake).
function razlicicaZaPrikaz(oznaka) {
  const m = /^(\d{4}-\d{2}-\d{2})\.(\d{2})(\d{2})([a-z]?)$/.exec(oznaka || '');
  return m ? `Različica ${m[1]} ${m[2]}:${m[3]}${m[4]}` : (oznaka ? `Različica ${oznaka}` : '');
}

function ustvariPomoc(okno, gumbi) {
  // Na dnu panela različica aplikacije - po objavi se vidi, ali brskalnik kaže novo.
  const panel = okno.querySelector && okno.querySelector('.dialog-panel');
  if (panel && RAZLICICA) {
    const p = document.createElement('p');
    p.className = 'dialog-razlicica';
    p.textContent = razlicicaZaPrikaz(RAZLICICA);
    panel.appendChild(p);
  }
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

// Razdelek »Tehnike« v okno Pomoč (element el): poved o ravneh in seznam E1, E2, 1-12 z oznako,
// imenom (angleško ime v oklepaju), značko ravni ter razlago in posledico v dveh odstavkih
// (TEHNIKE_OPISI - popravek po ročnem pregledu faze 6) - vse iz shared/engine.js, zato je enako
// v vseh treh aplikacijah. Pod posledico pri 1-12 zložljivo »Shema«, privzeto zaprto
// (izrisiShemo() iz shared/sheme.js; faza 3a, korak 4 - 12 odprtih shem bi okno na telefonu
// podaljšalo za več zaslonov).
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
    // Značka ravni (ravenTehnike()) v barvi oznake koraka (.tag.t-* v shared/base.css) - kot
    // značke na karticah treninga (docs/faza7-nacrt.md, točka 1.1).
    const raven = document.createElement('span');
    raven.className = `tag ${tagClass(tehnika)} tehnika-raven`;
    raven.textContent = ravenTehnike(tehnika);
    const razlaga = document.createElement('p');
    razlaga.textContent = TEHNIKE_OPISI[kljuc].razlaga;
    const posledica = document.createElement('p');
    posledica.textContent = TEHNIKE_OPISI[kljuc].posledica;
    li.append(oznaka, ime, ' ', raven, razlaga, posledica);
    const shema = typeof izrisiShemo === 'function' ? izrisiShemo(kljuc) : null;
    if (shema) {
      const d = document.createElement('details');
      d.className = 'tehnika-shema';
      const s = document.createElement('summary');
      s.textContent = 'Shema';
      d.append(s, shema);
      li.appendChild(d);
    }
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
