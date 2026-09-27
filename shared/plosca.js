/* ==================== PLOŠČA: vnos ====================
   Igralna plošča - mreža z izbiro celic in poudarki števk -, skupna igri (igra/) in
   treningu (»Vadi v uganki«). Igre ne ustvarja, ne računa njenega stanja in je ne
   shranjuje: igro in stanje (stanjeIgre) ima aplikacija in jih plošči da prek
   povratnega klica vir(). Plošča ima samo stanje vnosa (izbira, poudarki). Izris
   mreže je v mreza.js. Naloži se za engine.js, stanje.js in mreza.js. */

// o = {
//   mreza       - element mreže (obvezen)
//   vecCelic    - kljukica "več celic" (neobvezna)
//   vecHkrati   - kljukica "več hkrati" (neobvezna)
//   vir()       - { igra, stanje }: igra ali null, stanje = stanjeIgre(igra)
//   izrisi()    - celoten izris aplikacije (privzeto izris plošče)
//   samoZaOgled() - mreža je zaklenjena (privzeto false)
//   oznake()    - oznake koraka za mrežo (oznakeKoraka) ali null
// }
function ustvariPlosco(o) {
  const vir = o.vir;
  const samoZaOgled = o.samoZaOgled || (() => false);
  const oznake = o.oznake || (() => null);
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

  function izrisi() {
    izrisiMrezo();
  }

  return {
    mreza,
    get izbrane() { return izbrane; },
    get zadnjaIzbrana() { return zadnjaIzbrana; },
    // Začasno (del 5, korak 1): igra še sama vpisuje in premika izbiro s puščicami.
    nastaviIzbiro(nove, zadnja = zadnjaIzbrana) { izbrane = nove; zadnjaIzbrana = zadnja; },
    enaIzbrana,
    poudari,
    barvaPoudarka,
    zadnjaPoudarjena,
    poSpremembi,
    ponastavi,
    izrisi,
  };
}
