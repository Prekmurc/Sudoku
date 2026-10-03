/* ==================== MREŽA: izris ====================
   Izris igralne mreže 9 × 9 in seznamov manjkajočih števk, skupen igri (igra/) in
   treningu (»Vadi v uganki«, vaje E1, E2, 1 in 2 v »Spoznaj«). Samo izris: brez stanja igre, brez shrambe in brez
   vnosa - kaj se izriše, pove aplikacija s "pogledom" ob vsakem izrisu. Slogi so v
   mreza.css (razredi .mreza, .celica, .kandidati, .kand ...). Naloži se za
   engine.js (PEERS, ROWS, COLS) in stanje.js (dejanjaKoraka). */

// Zgradi 81 celic v elementu `el` (vrstni red po vrsticah, data-r/data-c za debele
// črte blokov). `obKliku(i, e)` se pokliče ob kliku celice, ki je vidna in ni
// neaktivna (glej pogled.vidne, pogled.neaktivne). Vrne { el, celice, izrisi(pogled) }.
// `robovi: true` (trening, vaji 1 in 2): `el` postane okvir (razred mreza-robovi) z
// oznakami S1-S9 zgoraj in V1-V9 levo, celice so v notranjem div.mreza - ta je vrnjeni
// `el`. Oznaka vrstice ali stolpca, ki je ob pogled.vidne v celoti viden, dobi razred
// "akt". Brez robov (igra) je `el` sama mreža, kot doslej. Okvir z robovi je lahko v
// .mreza-okvir s seznami (mreza.css).
//
// pogled = {
//   prazna      - ni odprte uganke: celice so prazne, mreža ima razred "prazna"
//   zaklenjena  - mreža samo za ogled (razred "zaklenjena")
//   grid        - 81 števk (0 = prazna celica)
//   danosti     - niz 81 znakov, '0' = prazno (dana števka je temna, vpis moder)
//   kandidati   - 81 mask kandidatov (bit d = števka d) ali null: brez kandidatov -
//                 prazna celica z oznako vpisa (oznake.vpis) takrat pokaže števko
//   celiceKandidatov - celice, v katerih se kandidati izrišejo, ali null = vse (igra:
//                 izklopljeni kandidati in prikazan korak - kandidati samo v celicah
//                 koraka); druge prazne celice so kot pri kandidati = null
//   barva(d)    - barva poudarka števke d (0..3) ali -1
//   izbrane     - izbrane celice
//   sosede      - celica, katere vrstica/stolpec/blok se senčijo, ali null
//   oznake      - oznake koraka (oznakeKoraka) ali null
//   vidne       - celice, ki se prikažejo (Set ali seznam), ali null = vse. Ostale
//                 so prazne, imajo razred "izven" in se na klik ne odzovejo, mreža
//                 pa razred "delna" - za prikaz dela mreže na pravih mestih (npr.
//                 samo dveh enot vaje).
//   oznacene    - celice z modrikasto podlago (razred "oznacena"; postopnost v
//                 treningu - označena enota ali celica) ali null
//   neaktivne   - celice, ki jih ni mogoče izbrati: razred "neaktivna" (zatemnjene,
//                 brez kazalca z roko), klik se ne sporoči; ali null
//   precrtani   - 81 mask kandidatov, ki se pokažejo prečrtani (razred "precrtan"; v
//                 celici jih ni več - trening »Vadi v uganki«: kandidati, odstranjeni pred
//                 vajo, in izbrisi koraka po pravilnem odgovoru) ali null; kandidat, ki
//                 je v `kandidati`, se izriše kot navaden
//   obmocje     - { celice, vrstice, stolpci } ali null: območje vaje (trening »Vadi v
//                 uganki« in E1/E2 v »Spoznaj«) - celice ob zunanjem robu območja dobijo
//                 razrede obm-g/-d/-l/-r (temen okvir, viden tudi brez barve, nad izbiro
//                 in poudarkom), oznake roba (robovi) navedenih vrstic in stolpcev (0-8)
//                 razred "obm" (temno polje)
//   zaznamovane - celice, ki jih je igralec zaznamoval (razred "zaznamovana" - oranžna
//                 črtkana obroba; plošča, gumb »Označi izbrane«) ali null
//   predlog     - { celica, stevka } ali null: prazna celica brez kandidatov pokaže
//                 števko predloga (razred "predlog"; trening »Vadi v uganki«, E1/E2 -
//                 odgovor, ki še ni poteza)
//   zasencene   - celice s šrafuro (razred "zasencena"; senčenje, kamor poudarjena
//                 števka ne more - plošča, kljukica "senči") ali null; na celicah z
//                 oznakami koraka se ne riše (oznake imajo prednost)
// }
function ustvariMrezo(el, { obKliku, robovi = false } = {}) {
  const celice = [];
  let vidne = null;
  let neaktivne = null;
  const oznakeRoba = { vrstice: [], stolpci: [] };
  if (robovi) {
    el.classList.add('mreza-robovi');
    el.appendChild(document.createElement('div'));
    const zgoraj = document.createElement('div');
    zgoraj.className = 'rob-s';
    const levo = document.createElement('div');
    levo.className = 'rob-v';
    for (let k = 0; k < 9; k++) {
      const s = document.createElement('span');
      s.textContent = `S${k + 1}`;
      zgoraj.appendChild(s);
      oznakeRoba.stolpci.push(s);
      const v = document.createElement('span');
      v.textContent = `V${k + 1}`;
      levo.appendChild(v);
      oznakeRoba.vrstice.push(v);
    }
    const notranja = document.createElement('div');
    notranja.className = 'mreza';
    el.appendChild(zgoraj);
    el.appendChild(levo);
    el.appendChild(notranja);
    el = notranja;
  }
  for (let i = 0; i < 81; i++) {
    const c = document.createElement('div');
    c.className = 'celica';
    c.dataset.r = Math.floor(i / 9);
    c.dataset.c = i % 9;
    c.setAttribute('role', 'gridcell');
    c.addEventListener('click', (e) => {
      if (vidne && !vidne.has(i)) return;
      if (neaktivne && neaktivne.has(i)) return;
      if (obKliku) obKliku(i, e);
    });
    el.appendChild(c);
    celice.push(c);
  }

  function izrisi(p) {
    el.classList.toggle('prazna', !!p.prazna);
    el.classList.toggle('zaklenjena', !!p.zaklenjena);
    vidne = p.vidne ? new Set(p.vidne) : null;
    neaktivne = p.neaktivne ? new Set(p.neaktivne) : null;
    const oznacene = p.oznacene ? new Set(p.oznacene) : null;
    const zasencene = p.zasencene ? new Set(p.zasencene) : null;
    const obm = p.obmocje && p.obmocje.celice ? new Set(p.obmocje.celice) : null;
    const zaznamovane = p.zaznamovane ? new Set(p.zaznamovane) : null;
    const celiceKandidatov = p.celiceKandidatov ? new Set(p.celiceKandidatov) : null;
    el.classList.toggle('delna', !!vidne);
    // Oznaka roba je krepka, kadar je vsa vrstica ali ves stolpec viden (enota vaje).
    if (robovi) for (let k = 0; k < 9; k++) {
      const vsaVrstica = !!vidne && !p.prazna && ROWS[k].every(c => vidne.has(c));
      const vesStolpec = !!vidne && !p.prazna && COLS[k].every(c => vidne.has(c));
      oznakeRoba.vrstice[k].className = vsaVrstica ? 'akt' : '';
      oznakeRoba.stolpci[k].className = vesStolpec ? 'akt' : '';
      // Vrstice in stolpci območja vaje: temno polje (vidno tudi brez barve).
      if (p.obmocje && !p.prazna && (p.obmocje.vrstice || []).includes(k)) oznakeRoba.vrstice[k].className = 'obm';
      if (p.obmocje && !p.prazna && (p.obmocje.stolpci || []).includes(k)) oznakeRoba.stolpci[k].className = 'obm';
    }
    const o = p.oznake || { vzorec: new Set(), izbris: new Set(), izbrisCelice: new Set(), vpis: new Map() };
    const izbrane = new Set(p.izbrane || []);
    const sosede = p.sosede === undefined ? null : p.sosede;
    const barva = p.barva || (() => -1);
    for (let i = 0; i < 81; i++) {
      const c = celice[i];
      c.innerHTML = '';
      c.className = 'celica';
      if (p.prazna) continue;
      if (vidne && !vidne.has(i)) {
        c.classList.add('izven');
        continue;
      }
      const v = p.grid[i];
      if (v) {
        c.textContent = v;
        c.classList.add(p.danosti[i] !== '0' ? 'dana' : 'vpis');
        const b = barva(v);
        if (b >= 0) c.classList.add('poud-stevka', `b${b}`);
      } else if (p.kandidati && (!celiceKandidatov || celiceKandidatov.has(i))) {
        const k = p.kandidati[i];
        const m = document.createElement('div');
        m.className = 'kandidati';
        for (let d = 1; d <= 9; d++) {
          const s = document.createElement('span');
          s.className = 'kand';
          if (k & (1 << d)) {
            s.textContent = d;
            const b = barva(d);
            if (b >= 0) s.classList.add('poud', `b${b}`);
            if (o.izbris.has(i * 10 + d)) s.classList.add('k-izbris');
            if (o.vpis.get(i) === d) s.classList.add('k-vpis');
          } else if (p.precrtani && (p.precrtani[i] & (1 << d))) {
            // Kandidat, ki ga ni več (npr. odstranjen pred vajo), prečrtan; izbris
            // prikazanega koraka rdeče (k-izbris).
            s.textContent = d;
            s.classList.add('precrtan');
            if (o.izbris.has(i * 10 + d)) s.classList.add('k-izbris');
          }
          m.appendChild(s);
        }
        c.appendChild(m);
      } else if (o.vpis.has(i)) {
        // Brez kandidatov (trening, enojčka; igra z izklopljenimi kandidati): števka za
        // vpis se pokaže v celici.
        c.textContent = o.vpis.get(i);
      } else if (p.predlog && p.predlog.celica === i) {
        // Predlog vpisa (trening »Vadi v uganki«, E1/E2) - ni poteza, drugačen videz.
        c.textContent = p.predlog.stevka;
        c.classList.add('predlog');
      }
      if (oznacene && oznacene.has(i)) c.classList.add('oznacena');
      if (neaktivne && neaktivne.has(i)) c.classList.add('neaktivna');
      if (o.vpis.has(i)) c.classList.add('k-vpis');
      else if (o.vzorec.has(i)) c.classList.add('k-vzorec');
      else if (o.izbrisCelice.has(i)) c.classList.add('k-izbris');
      if (zasencene && zasencene.has(i) && !o.vpis.has(i) && !o.vzorec.has(i) && !o.izbrisCelice.has(i)) {
        c.classList.add('zasencena');
      }
      // Okvir območja: stranice celice, ki mejijo na celico zunaj območja ali na rob mreže.
      if (obm && obm.has(i)) {
        const r = Math.floor(i / 9), s = i % 9;
        c.classList.add('obm');
        if (r === 0 || !obm.has(i - 9)) c.classList.add('obm-g');
        if (r === 8 || !obm.has(i + 9)) c.classList.add('obm-d');
        if (s === 0 || !obm.has(i - 1)) c.classList.add('obm-l');
        if (s === 8 || !obm.has(i + 1)) c.classList.add('obm-r');
      }
      if (zaznamovane && zaznamovane.has(i)) c.classList.add('zaznamovana');
      if (izbrane.has(i)) c.classList.add('izbrana');
      else if (sosede !== null && PEERS[sosede].has(i)) c.classList.add('soseda');
    }
  }

  return { el, celice, izrisi };
}

// Oznake prikazanega koraka motorja v danem stanju (stanjeIgre): celice vzorca,
// kandidati za izbris (celica * 10 + števka), celice z izbrisom in števke za vpis.
// Samo še neizvedena dejanja (dejanjaKoraka): izveden izbris ni več označen, celica
// brez odprtih izbrisov izgubi rdečkasto podlago. Brez koraka null.
function oznakeKoraka(korak, stanje) {
  if (!korak) return null;
  const odprta = dejanjaKoraka(korak, stanje).filter(a => !a.opravljeno);
  const izbrisi = odprta.filter(a => a.tip === 'izbris');
  return {
    vzorec: new Set(korak.cells),
    izbris: new Set(izbrisi.map(a => a.celica * 10 + a.stevka)),
    izbrisCelice: new Set(izbrisi.map(a => a.celica)),
    vpis: new Map(odprta.filter(a => a.tip === 'vpis').map(a => [a.celica, a.stevka])),
  };
}

/* ---------- seznami manjkajočih števk ---------- */

// Kvadratek s števkami na stalnih mestih (kot kandidati v celici). Vrne
// { el, stevke }, stevke[d - 1] = span za števko d.
function narediPoljeSeznama(el) {
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

// Trije ločeni seznami v elementih { vrstice, stolpci, bloki }; vsak ima 9
// kvadratkov v vrstnem redu ROWS/COLS/BOXES (bloki od leve proti desni, od zgoraj
// navzdol - kot v veliki mreži). Vrne { izrisi({ maske, vidni, barva }) }:
// maske = manjkajoceVEnotah(stanje) ali null (ni odprte uganke), vidni = { vrstice,
// stolpci, bloki } (true = prikazan), barva(d) kot v pogledu mreže.
function ustvariSezname(elementi) {
  const seznami = [
    { kljuc: 'vrstice', ime: 'Vrstica', polna: 'polna' },
    { kljuc: 'stolpci', ime: 'Stolpec', polna: 'poln' },
    { kljuc: 'bloki', ime: 'Blok', polna: 'poln' },
  ];
  for (const s of seznami) {
    s.el = elementi[s.kljuc];
    s.polja = Array.from({ length: 9 }, () => narediPoljeSeznama(s.el));
  }

  // Vidni so samo vklopljeni, polna enota ima prazen kvadratek, poudarjena števka
  // je obarvana enako kot v mreži.
  function izrisi({ maske, vidni, barva }) {
    for (const s of seznami) {
      s.el.hidden = !vidni[s.kljuc];
      if (s.el.hidden) continue;
      s.polja.forEach((p, i) => {
        const maska = maske ? maske[s.kljuc][i] : 0;
        const manjkajo = [];
        for (let d = 1; d <= 9; d++) {
          const el = p.stevke[d - 1];
          el.className = 'kand';
          el.textContent = '';
          if (!(maska & (1 << d))) continue;
          el.textContent = d;
          manjkajo.push(d);
          const b = barva ? barva(d) : -1;
          if (b >= 0) el.classList.add('poud', `b${b}`);
        }
        p.el.title = !maske ? '' : manjkajo.length ? `${s.ime} ${i + 1}: manjkajo ${manjkajo.join(', ')}` : `${s.ime} ${i + 1} je ${s.polna}`;
        p.el.setAttribute('aria-label', p.el.title || `${s.ime} ${i + 1}`);
      });
    }
  }

  return { izrisi };
}
