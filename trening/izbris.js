/* trening/izbris.js — 2. faza vaj »Spoznaj« (docs/izbris-nacrt.md, O13): po pravilni izbiri vzorca
   igralec označi kandidate, ki zaradi vzorca odpadejo. Brez logike tehnik - izbris (pari [celica, števka])
   da trening.js iz motorja ali generatorja. Tu so presoja oznak brez DOM-a, besedila, namig in niz
   »Izbriši kandidata« (O1, O2: izbereš celice, nato števko - ali Shift+števka, O12).
   Oznaka kandidat samo rdeče prečrta (O3, možnost A) - kandidati vaje se ne spremenijo; ponoven klik
   oznako odstrani (↺). Celica je indeks v vaji (pri 3-6 indeks v ex.slots); ključ kandidata je
   celica * 10 + števka. Potrebuje shared/engine.js (sklanjaj) in shared/vaje-uganka.js
   (steviloIzbrisov); naloži se pred trening.js. */

const kljucIzbrisa = (c, d) => c * 10 + d;

// Presoja oznak (Set ključev) glede na izbris vzorca → { izid, manjka }:
// prazno (brez oznake), napacno (vsaj ena oznaka zunaj izbrisa), delno (vse oznake v izbrisu,
// manjka jih še `manjka`), pravilno (natanko izbris).
function presodiIzbris(izbris, oznake) {
  const cilj = new Set(izbris.map(([c, d]) => kljucIzbrisa(c, d)));
  const manjka = [...cilj].filter(k => !oznake.has(k)).length;
  if (!oznake.size) return { izid: 'prazno', manjka };
  if ([...oznake].some(k => !cilj.has(k))) return { izid: 'napacno', manjka };
  return { izid: manjka ? 'delno' : 'pravilno', manjka };
}

// Besedila 2. faze (O4, O11). Sporočilo napačnega odgovora doda še posledico tehnike.
const IZBRIS_VZOREC_PRAVILEN = '<b>Vzorec je pravilen.</b> Zdaj izbriši kandidate, ki zaradi njega odpadejo.';
const IZBRIS_PRAZEN_VZOREC = 'Ta vzorec ne izbriše nobenega kandidata.';
function sporociloIzbrisa(r, posledica) {
  if (r.izid === 'prazno') return 'Izberi celico in izbriši kandidata, ki zaradi vzorca odpade.';
  if (r.izid === 'delno') {
    return `<b>Še ne.</b> Označeni kandidati res odpadejo, ${sklanjaj(r.manjka, ['manjka', 'manjkata', 'manjkajo', 'manjka'])} pa še ${steviloIzbrisov(r.manjka)}.`;
  }
  if (r.izid === 'napacno') return `<b>Ni pravilno.</b> Med označenimi je kandidat, ki zaradi vzorca ne odpade. ${posledica}`;
  return '';
}

// Naštevanje števk: "3", "3 in 8", "3, 5 in 8".
function nastejStevke(ds) {
  return ds.length < 2 ? ds.join('') : `${ds.slice(0, -1).join(', ')} in ${ds[ds.length - 1]}`;
}
// Namig v 2. fazi (O8): koliko kandidatov in katere števke, brez celic.
function namigIzbrisa(izbris) {
  const n = izbris.length, ds = [...new Set(izbris.map(([, d]) => d))].sort((a, b) => a - b);
  return `Izbrisati je treba ${n} ${sklanjaj(n, ['kandidata', 'kandidata', 'kandidate', 'kandidatov'])} – ${sklanjaj(ds.length, ['števka', 'števki', 'števke', 'števke'])} ${nastejStevke(ds)}.`;
}

// Niz »Izbriši kandidata« in stanje 2. faze. o:
//   izbris            - pari [celica, števka] najdenega vzorca (O10),
//   kandidati(c)      - kandidati celice (polje števk; prazno - celice ni mogoče izbrati),
//   izrisiMrezo(izbrane, oznake) - aplikacija pokaže izbiro (Set celic) in oznake (Set ključev),
//   poSpremembi()     - po spremembi izbire ali oznak (osvežitev odprte Rešitve),
//   vecCelic          - začetno stanje kljukice »več celic« (popravek po ročnem pregledu 2026-10-10),
//   obVecCelic(v)     - igralec je kljukico spremenil (aplikacija si stanje zapomni do konca kroga).
// Kljukica »več celic« (kot v »Vadi v uganki«): vklopljena - klik celico doda v izbiro ali jo odstrani; izklopljena -
// klik izbere samo to celico, klik edine izbrane jo odizbere; izklop počisti izbiro.
// Vrne { el, izbris, izbrane, oznake, izberi, stevka, pocistiIzbiro, pocisti, presodi, obTipki, izrisi }.
// Gumb števke je omogočen, kadar je števka kandidat v vseh izbranih celicah (presek, O2a); če je v vseh
// že označena, ima ↺ in klik oznako odstrani.
function ustvariIzbris(o) {
  const izbrane = new Set(), oznake = new Set();
  const el = document.createElement('div'); el.className = 'izbris-faza';
  const glava = document.createElement('div'); glava.className = 'niz-oznaka glava-s-kljukico';
  const napis = document.createElement('span');
  const poj = document.createElement('span'); poj.className = 'niz-pojasnilo';
  const vrni = document.createElement('span'); vrni.className = 'vzorec-vrni'; vrni.textContent = '↺';
  poj.append('· ', vrni, ' = vrni');
  napis.append('Izbriši kandidata ', poj);
  const kljukica = document.createElement('label'); kljukica.className = 'vec-hkrati';
  kljukica.title = 'Izberi več celic in izbriši isto števko iz vseh';
  const vec = document.createElement('input'); vec.type = 'checkbox'; vec.checked = !!o.vecCelic;
  kljukica.append(vec, ' več celic');
  vec.addEventListener('change', () => {
    if (o.obVecCelic) o.obVecCelic(vec.checked);
    if (!vec.checked && izbrane.size) { izbrane.clear(); spremenjeno(); }
  });
  glava.append(napis, kljukica);
  const niz = document.createElement('div'); niz.className = 'niz niz-odstrani';
  niz.setAttribute('role', 'group'); niz.setAttribute('aria-label', 'Izbriši kandidata');
  const gumbi = [];
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = d; b.dataset.d = d;
    b.addEventListener('click', () => stevka(d));
    niz.appendChild(b); gumbi.push(b);
  }
  const razlog = document.createElement('div'); razlog.className = 'niz-razlog'; razlog.setAttribute('aria-live', 'polite');
  el.append(glava, niz, razlog);

  const kand = c => o.kandidati(c) || [];
  // Za števko d: v vseh izbranih celicah kandidat (omogočen) in v vseh že označena (↺).
  function stanjeStevke(d) {
    const cs = [...izbrane];
    const mogoca = cs.length > 0 && cs.every(c => kand(c).includes(d));
    return { mogoca, vrni: mogoca && cs.every(c => oznake.has(kljucIzbrisa(c, d))) };
  }
  function izrisi() {
    let skupnih = 0;
    gumbi.forEach((b, i) => {
      const d = i + 1, s = stanjeStevke(d);
      if (s.mogoca) skupnih++;
      b.disabled = !s.mogoca;
      b.classList.toggle('odstrani', s.mogoca && !s.vrni);
      b.classList.toggle('vrni', s.vrni);
      b.title = !s.mogoca ? '' : s.vrni ? `Vrni kandidata ${d}` : `Izbriši kandidata ${d}`;
      b.setAttribute('aria-label', b.title || String(d));
    });
    razlog.textContent = !izbrane.size ? 'Izberi celico, nato števko, ki zaradi vzorca odpade.'
      : izbrane.size === 1 ? ''
      : skupnih ? `Izbrane celice: ${izbrane.size} – izbriši števko, ki je kandidat v vseh.`
      : 'Izbrane celice nimajo skupnega kandidata.';
    o.izrisiMrezo(izbrane, oznake);
  }
  function spremenjeno() { izrisi(); if (o.poSpremembi) o.poSpremembi(); }
  // Klik celice: z »več celic« doda v izbiro ali odstrani, brez nje izbere samo to celico (klik edine izbrane jo
  // odizbere). Celica brez kandidatov se ne izbere.
  function izberi(c) {
    if (izbrane.has(c) && (vec.checked || izbrane.size === 1)) izbrane.delete(c);
    else if (!kand(c).length) return;
    else { if (!vec.checked) izbrane.clear(); izbrane.add(c); }
    spremenjeno();
  }
  // Klik števke: označi v vseh izbranih celicah ali (↺) oznako odstrani. Izbira ostane.
  function stevka(d) {
    const s = stanjeStevke(d);
    if (!s.mogoca) return;
    for (const c of izbrane) {
      if (s.vrni) oznake.delete(kljucIzbrisa(c, d)); else oznake.add(kljucIzbrisa(c, d));
    }
    spremenjeno();
  }
  function pocistiIzbiro() { if (!izbrane.size) return false; izbrane.clear(); spremenjeno(); return true; }
  // Napačen odgovor (O3): vse oznake in izbira naenkrat.
  function pocisti() { izbrane.clear(); oznake.clear(); spremenjeno(); }
  // Tipkovnica v 2. fazi (O12): Shift+števka po fizični tipki (e.code - pari QWERTZ), Escape izbiro
  // počisti; števka brez Shift ne naredi nič. Vrne true, če je tipko porabil.
  function obTipki(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '');
    if (m) {
      if (!e.shiftKey) return false;
      if (e.preventDefault) e.preventDefault();
      stevka(+m[1]);
      return true;
    }
    if (e.key === 'Escape') return pocistiIzbiro();
    return false;
  }
  izrisi();
  return {
    el, izbris: o.izbris, izbrane, oznake, vecCelic: vec, izberi, stevka, pocistiIzbiro, pocisti, obTipki, izrisi,
    presodi: () => presodiIzbris(o.izbris, oznake),
  };
}
