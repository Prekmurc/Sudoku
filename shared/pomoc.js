/* shared/pomoc.js — okno Pomoč, skupno igri, reševalcu in treningu (faza 6, korak c,
   docs/faza6-nacrt.md): odpiranje in zapiranje okna, seznam »Tehnike« in seznam stopenj ugank.
   Slogi okna so v shared/pomoc.css. Potrebuje DOM; naloži se za shared/engine.js (imena, oznake in
   opisi tehnik), shared/generator.js (STOPNJE_UGANK - samo za izpisiStopnje()) in shared/sheme.js
   (shema vzorca v seznamu »Tehnike« - faza 3a, korak 4; brez nje seznam nima shem) in shared/navigacija.js
   (kazalo tehnik v razdelku »Tehnike« in način pomika - naloga 4c, korak 3; brez nje seznam nima kazala). */

// Okno Pomoč (element z razredom .dialog; odprto = razred "odprt"): gumbi ga odprejo, zapre ga
// gumb z [data-zapri] (✕), klik ob oknu in Escape. Escape ob odprtem oknu ne pride do drugih
// poslušalcev (tipkovnica plošče) - poslušalec je v fazi zajema. Vrne { odpri, zapri, odprto }.
// Naloga 4c, korak 3 (docs/navigacija-nacrt.md, O1, O3): pod glavo okna kazalo razdelkov (gumbi z naslovi
// h3.navodila-razdelek - iz HTML, zato je v vseh treh aplikacijah enako sestavljeno), v glavi pred ✕ gumb
// »↑ Na vrh«, viden po 400 px (naVrhPomociViden()); glava je lepljiva (shared/pomoc.css, samo v oknu Pomoč).
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

// »↑ Na vrh« v glavi okna Pomoč je viden, ko je okno pomaknjeno več kot 400 px.
const POMOC_NA_VRH_PO = 400;
function naVrhPomociViden(scrollTop) {
  return scrollTop > POMOC_NA_VRH_PO;
}
// Napis gumba v glavi (popravek A po ročnem pregledu naloge 4c): 'tehnike' – okno je v razdelku »Tehnike« pod
// kazalom tehnik (»↑ Tehnike« vrne k njemu), 'vrh' – pomaknjeno več kot 400 px (»↑ Na vrh«), null – skrit.
function gumbGlavePomoci(scrollTop, podKazalomTehnik) {
  if (podKazalomTehnik) return 'tehnike';
  return naVrhPomociViden(scrollTop) ? 'vrh' : null;
}
const NAPISI_GLAVE_POMOCI = { vrh: '↑ Na vrh', tehnike: '↑ Tehnike' };

// Pomik okna do elementa v njem (naslov razdelka, tehnika): gladko (pri prefers-reduced-motion takoj),
// naslov pristane pod lepljivo glavo (scroll-margin-top v shared/pomoc.css), fokus gre nanj - brez
// drugega pomika. Naslov strani se ne spremeni (brez #), zato »Nazaj« brskalnika ne hodi po razdelkih.
function pomakniVPomoci(el) {
  el.setAttribute('tabindex', '-1');
  el.scrollIntoView({ behavior: typeof nacinPomika === 'function' ? nacinPomika() : 'auto', block: 'start' });
  el.focus({ preventScroll: true });
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
  // Kazalo razdelkov tik pred prvim razdelkom (pod glavo).
  const naslovi = panel ? [...panel.querySelectorAll('h3.navodila-razdelek')] : [];
  let kazalo = null;
  if (naslovi.length) {
    kazalo = document.createElement('nav');
    kazalo.className = 'pomoc-kazalo';
    kazalo.setAttribute('aria-label', 'Kazalo razdelkov');
    for (const h of naslovi) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = h.textContent;
      b.addEventListener('click', () => pomakniVPomoci(h));
      kazalo.appendChild(b);
    }
    naslovi[0].parentNode.insertBefore(kazalo, naslovi[0]);
  }
  // »↑ Na vrh« v glavi pred ✕ (samo okno s kazalom - Pomoč): vrne na vrh, fokus na kazalo. Popravek A po ročnem
  // pregledu naloge 4c: v razdelku »Tehnike« pod kazalom tehnik (kazalo je vse nad spodnjim robom glave) je napis
  // »↑ Tehnike« in klik vrne h kazalu tehnik (fokus na prvo vrstico, E1). Gumb ima oba napisa enega nad drugim, neaktivni je
  // neviden (shared/pomoc.css) – gumb je zato vedno enako širok in glava se ne spremeni.
  const glava = kazalo && okno.querySelector('.dialog-glava');
  const zapriGumb = glava && okno.querySelector('[data-zapri]');
  let osveziNaVrh = () => {};
  if (zapriGumb) {
    const gor = document.createElement('button');
    gor.type = 'button';
    gor.className = 'dialog-na-vrh';
    for (const [k, t] of Object.entries(NAPISI_GLAVE_POMOCI)) {
      const s = document.createElement('span');
      s.className = 'napis-' + k;
      s.textContent = t;
      gor.appendChild(s);
    }
    gor.dataset.napis = 'vrh';
    gor.setAttribute('aria-label', NAPISI_GLAVE_POMOCI.vrh);
    glava.insertBefore(gor, zapriGumb);
    // Kazalo tehnik (izriše ga izrisiTehnike() - pred tem ali po tem klicu).
    const kazaloTehnik = () => okno.querySelector('.kazalo-tehnik');
    const podKazalomTehnik = () => {
      const kt = kazaloTehnik();
      if (!kt || !kt.getBoundingClientRect || !glava.getBoundingClientRect) return false;
      const g = glava.getBoundingClientRect();
      return g.height > 0 && kt.getBoundingClientRect().bottom <= g.bottom;
    };
    osveziNaVrh = () => {
      const napis = gumbGlavePomoci(okno.scrollTop || 0, podKazalomTehnik());
      gor.hidden = !napis;
      if (napis) {
        gor.dataset.napis = napis;
        gor.setAttribute('aria-label', NAPISI_GLAVE_POMOCI[napis]);
      }
    };
    gor.addEventListener('click', () => {
      const pomik = typeof nacinPomika === 'function' ? nacinPomika() : 'auto';
      const kt = gor.dataset.napis === 'tehnike' && kazaloTehnik();
      if (kt) {
        kt.scrollIntoView({ behavior: pomik, block: 'start' });
        // Prva vrstica kazala (E1) – prvi otrok kazala je stolpec s skupinami (naloga 11a).
        const e1 = kt.querySelector('.kazalo-vrstica');
        if (e1) e1.focus({ preventScroll: true });
        return;
      }
      okno.scrollTo({ top: 0, behavior: pomik });
      const prvi = kazalo.children[0];
      if (prvi) prvi.focus({ preventScroll: true });
    });
    okno.addEventListener('scroll', osveziNaVrh, { passive: true });
    osveziNaVrh();
  }
  const odprto = () => okno.classList.contains('odprt');
  const odpri = () => {
    okno.classList.add('odprt');
    osveziNaVrh();
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

// Razpon oznak tehnik ene ravni (RAVNI_TEHNIK): »E1–E2«, »1–6«, »13« - iz podatkov, brez
// dobesednih številk (naloga 11a, razdelek 4).
function razponRavni(raven) {
  const oznake = [...TRENING_ENOJCKA, ...TRENING_TEHNIKE].filter(([, t]) => RAVNI_TEHNIK[raven].includes(t))
    .map(([k]) => oznakaTehnike(k));
  return oznake.length > 1 ? `${oznake[0]}–${oznake[oznake.length - 1]}` : oznake[0];
}

// Razdelek »Tehnike« v okno Pomoč (element el): uvod o težavnosti tehnik (pomen značke, razponi
// iz RAVNI_TEHNIK, stavek o Zelo težki - naloga 11a, 1.5) in seznam E1, E2, 1-13 z oznako,
// imenom (angleško ime v oklepaju), značko težavnosti (kot na kartici v treningu), pri 1, 2, 9
// in 11 vrstico dodatnih angleških imen (TEHNIKE_OPISI.drugaAngleska - samo tu) ter razlago in
// posledico v dveh odstavkih
// (TEHNIKE_OPISI - popravek po ročnem pregledu faze 6) - vse iz shared/engine.js, zato je enako
// v vseh treh aplikacijah. Pod posledico pri 1-13 zložljivo »Shema«, privzeto zaprto
// (izrisiShemo() iz shared/sheme.js; faza 3a, korak 4 - 12 odprtih shem bi okno na telefonu
// podaljšalo za več zaslonov).
// Pred prvo tehniko vsake skupine (SKUPINE_TEHNIK) naslov skupine s številkami, enak naslovu nad karticami v
// treningu (naloga 11a, O7). Nad seznamom kazalo tehnik (izrisiKazaloTehnik() iz shared/navigacija.js - ista
// sestavina in od naloge 11a ista oblika kot kazalo v meniju treninga; naloga 4c, korak 3, O2): klik pomakne do tehnike.
function izrisiTehnike(el) {
  const uvod = document.createElement('p');
  const ravni = Object.keys(RAVNI_TEHNIK)
    .map(r => `${tezavnostTehnike(RAVNI_TEHNIK[r][0]).ime.toLowerCase()} (${razponRavni(r)})`);
  uvod.textContent = 'Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje: '
    + `${ravni.slice(0, -1).join(', ')} in ${ravni[ravni.length - 1]}. `
    + 'Težavnost uganke je težavnost njene najtežje tehnike. '
    + `Zelo težka je uganka, ki potrebuje vsaj dve različni tehniki ${razponRavni('napredna')}.`;
  const ul = document.createElement('ul');
  ul.className = 'tehnike';
  const poKljucu = {};
  for (const [kljuc, tehnika] of [...TRENING_ENOJCKA, ...TRENING_TEHNIKE]) {
    const li = document.createElement('li');
    poKljucu[kljuc] = li;
    const oznaka = document.createElement('span');
    oznaka.className = 'tehnika-oznaka';
    oznaka.textContent = oznakaTehnike(kljuc) + ' · ';
    const ime = document.createElement('b');
    ime.textContent = imeTehnike(tehnika);
    // Značka težavnosti (tezavnostTehnike() iz shared/generator.js) v barvi oznake koraka
    // (.tag.t-* v shared/base.css) - kot značke na karticah treninga.
    const raven = document.createElement('span');
    raven.className = `tag ${tagClass(tehnika)} tehnika-raven`;
    raven.textContent = napisTezavnosti(tezavnostTehnike(tehnika)).toUpperCase();
    const druga = TEHNIKE_OPISI[kljuc].drugaAngleska;
    const razlaga = document.createElement('p');
    razlaga.textContent = TEHNIKE_OPISI[kljuc].razlaga;
    const posledica = document.createElement('p');
    posledica.textContent = TEHNIKE_OPISI[kljuc].posledica;
    // Pred prvo tehniko skupine naslov skupine – isto besedilo kot nad karticami v treningu (naloga 11a, O7);
    // naslov je v vrstici prve tehnike, zato ima seznam še vedno eno vrstico na tehniko in pomik k njej ga pokaže.
    const skupina = skupinaTehnike(tehnika);
    if (skupina && skupina.tehnike[0] === tehnika) {
      const h = document.createElement('h4');
      h.className = 'tehnike-skupina';
      h.textContent = imeSkupine(skupina, { stevilke: true });
      li.appendChild(h);
    }
    li.append(oznaka, ime, ' ', raven);
    if (druga) {
      const p = document.createElement('p');
      p.className = 'tehnika-druga';
      p.textContent = (druga.length > 1 ? 'Druga angleška imena: ' : 'Drugo angleško ime: ') + druga.join(', ');
      li.appendChild(p);
    }
    li.append(razlaga, posledica);
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
  if (typeof izrisiKazaloTehnik === 'function') {
    const nav = document.createElement('nav');
    nav.className = 'kazalo-tehnik';
    nav.setAttribute('aria-label', 'Kazalo tehnik');
    izrisiKazaloTehnik(nav, p => pomakniVPomoci(poKljucu[p.kljuc]));
    el.append(uvod, nav, ul);
  } else el.append(uvod, ul);
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

// Stopnje, ki jih uganka lahko dobi: Ekstremna (ekspertna tehnika) šele, ko jo motor pozna.
function stopnjeZaPomoc() {
  return STOPNJE_UGANK.filter(s => s.kljuc !== 'ekstrem' || GEN_EKSPERTNE.length);
}
