/* shared/navigacija.js — navigacija po straneh (naloga 4c, docs/navigacija-nacrt.md): kazalo tehnik
   (meni treninga – O4 in okno Pomoč – O2, korak 3; od naloge 11a v obeh ista oblika – skupine z vrsticami), okrogel
   plavajoč gumb »↑« (meni treninga – O5) in vprašanje pred odhodom po povezavah med aplikacijami (O11, O12; korak 4).
   Logika (seznam kazala, pravilo vidnosti gumba) je v funkcijah brez DOM-a; razporeditev in drsenje
   preverja tools/preveri-navigacija-brskalnik.js. Slogi so v shared/base.css. Naloži se za engine.js in
   generator.js (težavnost skupine v kazalu). */

// Postavke kazala tehnik: E1, E2, 1–13 v vrstnem redu kartic treninga (TRENING_ENOJCKA, TRENING_TEHNIKE).
// kljuc = način vaje (data-mode kartice), tehnika = ključ ALL_TECHNIQUES, oznaka = »E1« / »4«,
// ime = »4 · Skriti par (Hidden Pair)« (bralnik zaslona), razred = barva ravni (tagClass()),
// slovensko = »Skriti par«, anglesko = »Hidden Pair« (vidni imeni v vrstici – naloga 6b, korak 2),
// skupina = ključ skupine (SKUPINE_TEHNIK – naloga 11a).
function kazaloTehnik() {
  return [...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([kljuc, tehnika]) => ({
    kljuc, tehnika, oznaka: oznakaTehnike(kljuc), ime: imeTehnike(tehnika, { stevilka: true }), razred: tagClass(tehnika),
    slovensko: imeTehnike(tehnika, { anglesko: false }), anglesko: TEHNIKE_OPISI[kljuc].anglesko,
    skupina: skupinaTehnike(tehnika).kljuc,
  }));
}

// Pomik strani: gladko, pri prefers-reduced-motion takoj.
function nacinPomika() {
  const m = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)');
  return m && m.matches ? 'auto' : 'smooth';
}

// Kazalo v el (vsebina se zamenja) – ena oblika za meni treninga in okno Pomoč (naloga 11a, korak 2,
// docs/naloga11a-nacrt.md, 1.6; prej v Pomoči vrstica samih oznak): dva stolpca .kazalo-stolpec – levo skupine
// težavnosti Lahka in Srednja, desno Težka in Ekstremna (ali sta stolpca drug ob drugem, pove širina –
// shared/base.css); v njih skupine SKUPINE_TEHNIK (.kazalo-skupina, role group) z naslovom .kazalo-naslov (ime
// skupine in značka težavnosti v barvi ravni – tezavnostTehnike() iz shared/generator.js) in vrsticami
// .kazalo-vrstica: oznaka v barvi ravni (.tag.t-*) in pod seboj slovensko in angleško ime (.kazalo-imena .si, .en;
// naloga 6b, 2.5); imeni sta vidni, zato brez title. Klik vrstice pokliče obKliku(postavka) – kam pomakne, pove
// aplikacija. Vrne gumbe vrstic v vrstnem redu postavk.
const RAVNI_LEVEGA_STOLPCA = ['lahka', 'srednja'];
function izrisiKazaloTehnik(el, obKliku) {
  el.textContent = '';
  const postavke = kazaloTehnik();
  const stolpca = [0, 1].map(() => {
    const st = document.createElement('div');
    st.className = 'kazalo-stolpec';
    el.appendChild(st);
    return st;
  });
  const vrstice = [];
  for (const s of SKUPINE_TEHNIK) {
    const g = document.createElement('div');
    g.className = 'kazalo-skupina';
    g.dataset.skupina = s.kljuc;
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', imeSkupine(s));
    const naslov = document.createElement('p');
    naslov.className = 'kazalo-naslov';
    const ime = document.createElement('span');
    ime.className = 'kazalo-skupina-ime';
    ime.textContent = imeSkupine(s);
    const znacka = document.createElement('span');
    znacka.className = `tag ${tagClass(s.tehnike[0])} kazalo-tezavnost`;
    znacka.textContent = napisTezavnosti(tezavnostTehnike(s.tehnike[0])).toUpperCase();
    naslov.append(ime, znacka);
    g.appendChild(naslov);
    for (const p of postavke.filter(x => x.skupina === s.kljuc)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kazalo-vrstica';
      const oznaka = document.createElement('span');
      oznaka.className = `tag ${p.razred}`;
      oznaka.textContent = p.oznaka;
      const imena = document.createElement('span');
      imena.className = 'kazalo-imena';
      for (const [razred, besedilo] of [['si', p.slovensko], ['en', p.anglesko]]) {
        const e = document.createElement('span');
        e.className = razred;
        e.textContent = besedilo;
        imena.appendChild(e);
      }
      b.append(oznaka, imena);
      b.setAttribute('aria-label', p.ime);
      b.dataset.kazalo = p.kljuc;
      b.addEventListener('click', () => obKliku(p));
      g.appendChild(b);
      vrstice.push(b);
    }
    stolpca[RAVNI_LEVEGA_STOLPCA.includes(ravenTehnike(s.tehnike[0])) ? 0 : 1].appendChild(g);
  }
  return vrstice;
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

// Povezave med aplikacijami (O8–O12): vrstica zavihkov nav#aplikacije v glavi je statičen HTML (O9),
// tu je samo vprašanje pred odhodom. vprasanje() vrne besedilo (npr. krog v treningu, neshranjena uganka
// v reševalcu) ali null – igra ga ne poda, ker je vse shranjeno. Klik trenutnega zavihka ne naredi nič
// (stran bi se znova naložila in krog bi se izgubil). Klik z modifikatorjem ali srednjim gumbom odpre
// nov zavihek ali okno – ta stran ostane, zato brez vprašanja.
function odhodDovoljen(trenutni, besedilo, potrdi) {
  if (trenutni) return false;
  return !besedilo || !!potrdi(besedilo);
}
function poveziAplikacije(vprasanje) {
  const nav = document.getElementById('aplikacije');
  if (!nav) return;
  nav.addEventListener('click', (e) => {
    const a = e.target && (e.target.closest ? e.target.closest('a') : e.target);
    if (!a || a.tagName !== 'A') return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (e.button || 0) !== 0) return;
    const trenutni = a.getAttribute('aria-current') === 'page';
    if (!odhodDovoljen(trenutni, trenutni || !vprasanje ? null : vprasanje(), t => confirm(t))) e.preventDefault();
  });
}
