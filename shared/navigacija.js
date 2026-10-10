/* shared/navigacija.js — navigacija po straneh (naloga 4c, docs/navigacija-nacrt.md): kazalo tehnik
   (meni treninga – O4; okno Pomoč – O2, korak 3) in okrogel plavajoč gumb »↑« (meni treninga – O5).
   Logika (seznam kazala, pravilo vidnosti gumba) je v funkcijah brez DOM-a; razporeditev in drsenje
   preverja tools/preveri-navigacija-brskalnik.js. Slogi so v shared/base.css. Naloži se za engine.js. */

// Postavke kazala tehnik: E1, E2, 1–13 v vrstnem redu kartic treninga (TRENING_ENOJCKA, TRENING_TEHNIKE).
// kljuc = način vaje (data-mode kartice), tehnika = ključ ALL_TECHNIQUES, oznaka = »E1« / »4«,
// ime = »4 · Skriti par (Hidden Pair)« (namig miške in bralnik zaslona), razred = barva ravni (tagClass()).
function kazaloTehnik() {
  return [...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([kljuc, tehnika]) => ({
    kljuc, tehnika, oznaka: oznakaTehnike(kljuc), ime: imeTehnike(tehnika, { stevilka: true }), razred: tagClass(tehnika),
  }));
}

// Pomik strani: gladko, pri prefers-reduced-motion takoj.
function nacinPomika() {
  const m = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)');
  return m && m.matches ? 'auto' : 'smooth';
}

// Kazalo v el (vsebina se zamenja): za vsako postavko gumb z oznako v barvi ravni (.tag.t-*); klik
// pokliče obKliku(postavka) – kam pomakne, pove aplikacija.
function izrisiKazaloTehnik(el, obKliku) {
  el.textContent = '';
  for (const p of kazaloTehnik()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `tag ${p.razred}`;
    b.textContent = p.oznaka;
    b.title = p.ime;
    b.setAttribute('aria-label', p.ime);
    b.dataset.kazalo = p.kljuc;
    b.addEventListener('click', () => obKliku(p));
    el.appendChild(b);
  }
}

// Gumb »↑« je viden, ko je stran pomaknjena več kot en zaslon in je aktiven (npr. meni, ne vaja).
function naVrhViden(scrollY, visinaOkna, aktiven) {
  return !!aktiven && scrollY > visinaOkna;
}

// Okrogel plavajoč gumb »↑« (44 × 44 px spodaj desno, v <body>): aktiven() pove, ali je gumb na tej
// strani smiseln; klik pomakne na vrh in pokliče obKliku() (npr. fokus na kazalo). Vidnost se osveži ob
// drsenju in spremembi velikosti okna; aplikacija pokliče osvezi() še ob preklopu pogleda (meni ↔ vaja),
// ker pomik na isti položaj dogodka scroll ne sproži.
function ustvariNaVrh(aktiven, obKliku) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'na-vrh';
  b.textContent = '↑';
  b.title = 'Na vrh';
  b.setAttribute('aria-label', 'Na vrh');
  const osvezi = () => { b.hidden = !naVrhViden(window.scrollY || 0, window.innerHeight || 0, aktiven()); };
  b.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: nacinPomika() });
    if (obKliku) obKliku();
  });
  window.addEventListener('scroll', osvezi, { passive: true });
  window.addEventListener('resize', osvezi);
  document.body.appendChild(b);
  osvezi();
  return { el: b, osvezi };
}
