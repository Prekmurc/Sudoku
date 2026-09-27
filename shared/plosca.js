/* ==================== PLOŠČA: vnos ====================
   Igralna plošča - mreža z izbiro celic, nizi gumbov (Poudari, Vpiši, Odstrani),
   poteze z Razveljavi/Ponovi/Zbriši vpis/Začni znova in vrstica pod nizi -, skupna
   igri (igra/) in treningu (»Vadi v uganki«). Igre ne ustvarja, ne računa njenega
   stanja in je ne shranjuje: igro in stanje (stanjeIgre) ima aplikacija in jih
   plošči da prek povratnega klica vir(); po vsaki spremembi igre plošča pokliče
   obSpremembi(vrsta) in aplikacija izračuna novo stanje, shrani in izriše. Plošča
   ima samo stanje vnosa (izbira, poudarki). Izris mreže je v mreza.js. Naloži se
   za engine.js, stanje.js in mreza.js. */

// o = {
//   mreza         - element mreže (obvezen); vsi drugi elementi so neobvezni -
//                   česar ni, plošča ne ponudi
//   nizPoudari, nizVpisi, nizOdstrani - elementi nizov (po 9 gumbov)
//   razlogNizov   - vrstica s pojasnilom pod nizi
//   razveljavi, ponovi, zbrisi, znova - gumbi; stevec - "poteza k / n"
//   vecCelic, vecHkrati - kljukici "več celic" in "več hkrati"
//   vir()         - { igra, stanje }: igra ali null, stanje = stanjeIgre(igra)
//   obSpremembi(vrsta) - igra je spremenjena ('poteza', 'razveljavi', 'ponovi',
//                   'znova'): aplikacija izračuna stanje, pokliče poSpremembi(),
//                   shrani in izriše
//   izrisi()      - celoten izris aplikacije (privzeto izris plošče)
//   samoZaOgled() - mreža je zaklenjena, poteze ne delajo (privzeto false)
//   oznake()      - oznake koraka za mrežo (oznakeKoraka) ali null
//   razlog()      - besedilo pod nizi, ki ima prednost pred privzetim, ali null
//   opozorilo()   - rdeče opozorilo pod nizi (prednost pred vsem) ali ''
//   potrdiZnova() - vprašanje pred "Začni znova" (false = ne začni); privzeto brez
// }
function ustvariPlosco(o) {
  const vir = o.vir;
  const samoZaOgled = o.samoZaOgled || (() => false);
  const oznake = o.oznake || (() => null);
  const razlog = o.razlog || (() => null);
  const opozorilo = o.opozorilo || (() => '');
  const potrdiZnova = o.potrdiZnova || (() => true);
  const obSpremembi = o.obSpremembi || (() => {});
  const izrisiVse = () => (o.izrisi || izrisi)();

  // Izbrane celice v vrstnem redu izbire. Več celic (kljukica "več celic" ali
  // Ctrl+klik) je samo za odstranjevanje istega kandidata iz vseh; izbira ostane,
  // dokler je igralec ne počisti (Escape, izklop kljukice, navaden klik).
  let izbrane = [];
  let vecCelic = false;
  let zadnjaIzbrana = null; // celica, iz katere je bila izbira izklopljena po vpisu
  // Poudarjene števke po vrstnem redu izbire: [{ stevka, barva }], barva 0..3 =
  // rumena, zelena, oranžna, modra (--poud, --poud2 ... v mreza.css). Brez kljukice
  // "več hkrati" je poudarjena kvečjemu ena števka (rumena).
  let poudarjene = [];
  let vecHkrati = false;
  const BARV_POUDARKA = 4;

  /* ---------- mreža in izbira ---------- */

  const mreza = ustvariMrezo(o.mreza, {
    obKliku: (i, e) => {
      if (!vir().igra) return;
      if (vecCelic || e.ctrlKey || e.metaKey) preklopiVIzbiri(i);
      else izbrane = enaIzbrana() === i ? [] : [i]; // ponoven klik prekliče izbiro
      izrisiVse();
    },
  });

  // Edina izbrana celica ali null (tudi pri več izbranih) - vpis, brisanje vpisa,
  // vračanje kandidata in puščice delujejo samo na eni celici.
  function enaIzbrana() {
    return izbrane.length === 1 ? izbrane[0] : null;
  }

  // Izbira več celic: izbrana celica se odstrani, prazna doda. Dana celica in celica
  // z vpisom nimata kandidatov, zato se ne dodata (in izpadeta iz izbire, v katero
  // se doda nova celica).
  function preklopiVIzbiri(i) {
    const { stanje } = vir();
    if (izbrane.includes(i)) izbrane = izbrane.filter(c => c !== i);
    else if (!stanje.grid[i]) izbrane = [...izbrane.filter(c => !stanje.grid[c]), i];
  }

  // Izklop kljukice "več celic" pomeni, da je izbiranje končano: izbira se počisti.
  if (o.vecCelic) {
    o.vecCelic.addEventListener('change', () => {
      vecCelic = o.vecCelic.checked;
      if (!vecCelic) izbrane = [];
      izrisiVse();
    });
  }

  /* ---------- nizi gumbov ---------- */

  function narediNiz(el, obKliku) {
    const gumbi = [];
    if (!el) return gumbi;
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => obKliku(d));
      el.appendChild(b);
      gumbi.push(b);
    }
    return gumbi;
  }

  const gumbi = {
    poudari: narediNiz(o.nizPoudari, d => poudari(d)),
    vpisi: narediNiz(o.nizVpisi, d => izvedi({ tip: 'vpis', celica: enaIzbrana(), stevka: d })),
    odstrani: narediNiz(o.nizOdstrani, d => odstraniAliVrni(d)),
  };
  gumbi.vpisi.forEach((b, i) => { b.textContent = i + 1; });

  /* ---------- poudarjanje števk ---------- */

  // Barva poudarka števke (0..3) ali -1, če ni poudarjena.
  function barvaPoudarka(d) {
    const p = poudarjene.find(x => x.stevka === d);
    return p ? p.barva : -1;
  }

  // Zadnja izbrana poudarjena števka ali null (ima prednost pri Naslednji korak).
  function zadnjaPoudarjena() {
    return poudarjene.length ? poudarjene[poudarjene.length - 1].stevka : null;
  }

  // Brez "več hkrati" nova izbira zamenja prejšnjo, ponoven klik jo prekliče.
  // Z "več hkrati" se izbire seštevajo, ponoven klik števko odstrani; nova
  // števka dobi prvo prosto barvo po vrsti, ko so zasedene vse, se barve ponovijo.
  function poudari(d) {
    const i = poudarjene.findIndex(x => x.stevka === d);
    if (!vecHkrati) {
      poudarjene = i >= 0 && poudarjene.length === 1 ? [] : [{ stevka: d, barva: 0 }];
    } else if (i >= 0) {
      poudarjene.splice(i, 1);
    } else {
      const zasedene = new Set(poudarjene.map(x => x.barva));
      let barva = [...Array(BARV_POUDARKA).keys()].find(b => !zasedene.has(b));
      if (barva === undefined) barva = poudarjene.length % BARV_POUDARKA;
      poudarjene.push({ stevka: d, barva });
    }
    izrisiVse();
  }

  // Ob izklopu ostane poudarjena samo zadnja izbrana števka.
  if (o.vecHkrati) {
    o.vecHkrati.addEventListener('change', () => {
      vecHkrati = o.vecHkrati.checked;
      if (!vecHkrati && poudarjene.length) poudarjene = [{ stevka: zadnjaPoudarjena(), barva: 0 }];
      izrisiVse();
    });
  }

  // Aplikacija pokliče po izračunu novega stanja; `prej` je stanje pred spremembo
  // iste uganke ali null. Sprememba, ki števko dokonča (deveti vpis), izklopi njen
  // poudarek - ni več kandidatov. Poudarek, ki ga igralec vklopi pri že dokončani
  // števki, ostane.
  function poSpremembi(prej) {
    if (!prej) return;
    const bilo = seManjka(prej);
    const zdaj = seManjka(vir().stanje);
    poudarjene = poudarjene.filter(p => !(bilo[p.stevka] > 0 && zdaj[p.stevka] === 0));
  }

  // Nova uganka ali prazna mreža: brez izbire in poudarkov (kljukici ostaneta).
  function ponastavi() {
    izbrane = [];
    zadnjaIzbrana = null;
    poudarjene = [];
  }

  /* ---------- poteze ---------- */

  function izvedi(poteza) {
    const { igra, stanje } = vir();
    if (!igra || samoZaOgled() || !dodajPotezo(igra, poteza, stanje)) return;
    // Po vpisu števke se izbira celice izklopi (puščice nadaljujejo od nje).
    if (poteza.tip === 'vpis' && poteza.stevka) {
      zadnjaIzbrana = poteza.celica;
      izbrane = [];
    }
    obSpremembi('poteza');
  }

  // Niz "Odstrani": trenutni kandidat se odstrani, ročno odstranjen se vrne. Pri
  // več izbranih celicah se števka v eni potezi odstrani iz vseh (izbira ostane).
  function odstraniAliVrni(d) {
    const { igra, stanje } = vir();
    if (!igra) return;
    if (izbrane.length > 1) {
      izvedi({ tip: 'kandidati', celice: [...izbrane].sort((x, y) => x - y), stevka: d, odstrani: true });
      return;
    }
    const celica = enaIzbrana();
    const a = mozneAkcije(stanje, celica);
    const bit = 1 << d;
    if (a.odstrani & bit) izvedi({ tip: 'kandidat', celica, stevka: d, odstrani: true });
    else if (a.vrni & bit) izvedi({ tip: 'kandidat', celica, stevka: d, odstrani: false });
  }

  function zbrisiVpis() {
    izvedi({ tip: 'vpis', celica: enaIzbrana(), stevka: 0 });
  }

  function razveljaviPotezo() {
    const { igra } = vir();
    if (!igra || samoZaOgled() || !lahkoRazveljavi(igra)) return;
    razveljavi(igra);
    obSpremembi('razveljavi');
  }

  function ponoviPotezo() {
    const { igra } = vir();
    if (!igra || samoZaOgled() || !lahkoPonovi(igra)) return;
    ponovi(igra);
    obSpremembi('ponovi');
  }

  // Kazalec na začetek (pri vaji na začetne poteze); poteze ostanejo v "Ponovi".
  function zacniZnovaIgro() {
    const { igra } = vir();
    if (!igra || !lahkoZacniZnova(igra)) return;
    if (!potrdiZnova()) return;
    zacniZnova(igra);
    obSpremembi('znova');
  }

  if (o.razveljavi) o.razveljavi.addEventListener('click', razveljaviPotezo);
  if (o.ponovi) o.ponovi.addEventListener('click', ponoviPotezo);
  if (o.zbrisi) o.zbrisi.addEventListener('click', () => zbrisiVpis());
  if (o.znova) o.znova.addEventListener('click', zacniZnovaIgro);

  /* ---------- izris ---------- */

  // Prikazan korak: celice vzorca, kandidati za izbris, števke za vpis (oznake()).
  // Sosede izbrane celice se senčijo samo pri eni izbrani celici.
  function izrisiMrezo() {
    const { igra, stanje } = vir();
    mreza.izrisi(!igra ? { prazna: true, zaklenjena: false } : {
      zaklenjena: samoZaOgled(),
      grid: stanje.grid,
      danosti: igra.danosti,
      kandidati: stanje.kandidati,
      barva: barvaPoudarka,
      izbrane,
      sosede: enaIzbrana(),
      oznake: oznake(),
    });
  }

  function izrisiNize() {
    const { igra, stanje } = vir();
    const manjka = igra ? seManjka(stanje) : new Array(10).fill(0);
    // Pri več izbranih celicah je mogoče samo odstraniti števko, ki je kandidat v vseh.
    const ogled = samoZaOgled();
    const a = !igra || ogled ? mozneAkcije(null, null)
      : izbrane.length > 1 ? { vpis: 0, odstrani: skupniKandidati(stanje, izbrane), vrni: 0, zbrisi: false }
      : mozneAkcije(stanje, enaIzbrana());
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;

      const p = gumbi.poudari[d - 1];
      if (p) {
        const b = barvaPoudarka(d);
        p.innerHTML = `<span>${d}</span><span class="manjka">${igra ? manjka[d] : ''}</span>`;
        // Tudi števka, vpisana že devetkrat, se da poudariti - poudarek pokaže vse
        // celice z njo (za hiter pregled).
        p.disabled = !igra;
        p.className = b >= 0 ? `aktiven b${b}` : '';
        p.setAttribute('aria-pressed', b >= 0 ? 'true' : 'false');
        p.title = !igra ? '' : manjka[d] === 0 ? `Poudari ${d} (vpisana devetkrat)` : `Poudari ${d} (še manjka: ${manjka[d]})`;
      }

      const v = gumbi.vpisi[d - 1];
      if (v) {
        v.disabled = !(a.vpis & bit);
        v.title = v.disabled ? '' : `Vpiši ${d}`;
      }

      const x = gumbi.odstrani[d - 1];
      if (x) {
        x.textContent = d;
        x.classList.toggle('odstrani', !!(a.odstrani & bit));
        x.classList.toggle('vrni', !!(a.vrni & bit));
        x.disabled = !((a.odstrani | a.vrni) & bit);
        x.title = (a.odstrani & bit) ? `Odstrani kandidata ${d}` : (a.vrni & bit) ? `Vrni kandidata ${d}` : '';
        x.setAttribute('aria-label', x.title || String(d));
      }
    }
    const opoz = opozorilo();
    if (o.razlogNizov) {
      o.razlogNizov.textContent = opoz ? `⚠ ${opoz}` : razlogNizov(a);
      // Vidna oznaka zaklepa: vrstica z razlogom dobi izstopajoč slog - da je jasno,
      // zakaj nizi ne delujejo.
      o.razlogNizov.classList.toggle('zaklenjeno', ogled && !opoz);
      o.razlogNizov.classList.toggle('opozorilo', !!opoz);
    }
    if (o.zbrisi) o.zbrisi.disabled = !a.zbrisi;
    if (o.razveljavi) o.razveljavi.disabled = !igra || ogled || !lahkoRazveljavi(igra);
    if (o.ponovi) o.ponovi.disabled = !igra || ogled || !lahkoPonovi(igra);
    if (o.znova) {
      o.znova.classList.toggle('primary', ogled);
      o.znova.disabled = !igra || !lahkoZacniZnova(igra);
    }
    if (o.stevec) o.stevec.textContent = igra ? `poteza ${igra.kazalec} / ${igra.poteze.length}` : '';
  }

  // Pojasnilo pod nizoma, kadar za izbrano celico ni kaj vpisati ali odstraniti.
  // Besedilo aplikacije (razlog(), npr. zaklenjena mreža) ima prednost.
  function razlogNizov(a) {
    const { igra, stanje } = vir();
    if (!igra) return '';
    const prednost = razlog();
    if (prednost) return prednost;
    if (!izbrane.length) return 'Izberi celico v mreži.';
    if (izbrane.length > 1) {
      // Celica v izbiri je lahko polna, če je "Razveljavi"/"Ponovi" vrnil vpis.
      const polna = izbrane.find(c => stanje.grid[c]);
      if (polna !== undefined) return `V ${cellLabel(polna)} je vpis – odstrani jo iz izbire.`;
      if (!a.odstrani) return 'Izbrane celice nimajo skupnega kandidata.';
      return `Izbrane celice: ${izbrane.length} – odstrani števko, ki je kandidat v vseh.`;
    }
    const izbrana = izbrane[0];
    const ime = cellLabel(izbrana);
    const v = stanje.grid[izbrana];
    if (igra.danosti[izbrana] !== '0') return `${ime} je dana števka (${v}) – ne spreminja se.`;
    if (v) return `V ${ime} je tvoj vpis (${v}) – za spremembo ga najprej zbriši.`;
    if (!a.vpis) {
      return a.vrni ? `V ${ime} ni več kandidatov – vrni odstranjenega (↺) ali razveljavi.`
        : `V ${ime} ni več kandidatov – razveljavi zadnje poteze.`;
    }
    return '';
  }

  function izrisi() {
    izrisiMrezo();
    izrisiNize();
  }

  return {
    mreza,
    gumbi,
    get izbrane() { return izbrane; },
    get zadnjaIzbrana() { return zadnjaIzbrana; },
    // Začasno (del 5, korak 2): igra še sama premika izbiro s puščicami.
    nastaviIzbiro(nove, zadnja = zadnjaIzbrana) { izbrane = nove; zadnjaIzbrana = zadnja; },
    enaIzbrana,
    poudari,
    barvaPoudarka,
    zadnjaPoudarjena,
    izvedi,
    odstraniAliVrni,
    zbrisiVpis,
    razveljavi: razveljaviPotezo,
    ponovi: ponoviPotezo,
    poSpremembi,
    ponastavi,
    izrisi,
  };
}
