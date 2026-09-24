# Uskladitev reševalca, treninga in igre – popis neskladij

Popis razlik med aplikacijami `app/` (reševalec), `trening/` (trening tehnik) in `igra/`
(igra), ki so nastajale ločeno. **Samo analiza** – koda ni spremenjena. Stanje kode: commit
`4a0efc7` (2026-09-23). Odločitve pri odprtih točkah so zapisane 2026-09-23 (razdelek
»Odločitve, ki so tvoje«) in upoštevane v predlogih.

Pri vsaki točki: **Kje** (datoteka, aplikacija), **Zdaj** (kako je v posamezni aplikaciji),
**Predlog** (enotna rešitev) in **Obseg**:

- **majhno** – ena datoteka ali nekaj vrstic, brez sprememb testov ali z enim testom,
- **srednje** – več datotek ali nova skupna funkcija v `shared/`, popravki testov,
- **veliko** – preoblikovanje prikaza ali podatkov v več aplikacijah.

Oznake točk (npr. 1.5) uporablja razdelek »Vrstni red popravkov« na koncu.

---

## 0. Napake, najdene med popisom

Niso neskladja, vendar jih je vredno popraviti najprej, ker so vidne pri uporabi.

**Obe popravljeni 2026-09-23** (0.1: `app/zbirka.js` + test `tests/app-zbirka.test.js`;
0.2: pravilo `[hidden]` v `shared/base.css`, izjema `.seznam[hidden]` v `igra.css`
odstranjena). Pregled vseh elementov z atributom `hidden` v treh aplikacijah: pravilo z
`display` je imel poleg `#ocenaGumbi` samo še `.seznam` (že prej popravljen z izjemo);
gumba »Prekini«, izbirnika datotek in `<option>` »Primer« težava ni zadevala.

### 0.1 Reševalec: »Naloži« in »Izbriši« v zbirki ne delujeta

- **Kje:** `app/zbirka.js:142` in `app/zbirka.js:150` (reševalec, okno »Zbirka ugank«).
- **Zdaj:** obe besedili uporabljata spremenljivko `datum`, ki v `zbirkaIzrisiSeznam()` ni
  definirana. Nastala je v commitu `83c6ef4` (2026-09-20), ko je glava vrstice prešla na
  `zbirkaPrikazCasov()`. Klik na »Naloži« ali »Izbriši« vrže `ReferenceError`, zato se
  uganka ne naloži in ne izbriše. Brisanje ugank je mogoče samo v reševalcu, zato ga zdaj
  ni mogoče opraviti nikjer.
- **Predlog:** namesto `datum` uporabi `zbirkaPrikazDatuma(z.dodano)` (»21. 9. 2026 ob
  16:33«). Dodaj test v nadomestnem DOM-u (`tests/dom-stub.js`), ki klikne
  »Naloži« v reševalcu.
- **Obseg:** majhno.

### 0.2 Igra: vrstica »Zapiši ocene (0) / Prekliči« je vedno vidna (opažanje 4)

- **Kje:** `igra/igra.css:649` (`.dialog-gumbi{ display:flex }`), `igra/index.html:122`
  (`<div id="ocenaGumbi" class="dialog-gumbi" hidden>`).
- **Zdaj:** `osveziOcenoGumbe()` (`igra/igra.js:1187`) pravilno nastavi `hidden = true`,
  kadar ni predlaganih sprememb. Pravilo `display:flex` iz `igra.css` pa povozi privzeti
  `[hidden]{display:none}` brskalnika, zato vrstica ostane vidna. Z oznako »(0)« je vidna
  od odprtja okna naprej, tudi ko nič ni bilo ocenjeno. Testi tega ne ujamejo, ker
  nadomestni DOM ne uporablja CSS. Enaka težava je bila pri seznamih že odpravljena z
  `.seznam[hidden]{ display:none; }` (`igra/igra.css:365`).
- **Predlog:** v `shared/base.css` dodaj splošno pravilo `[hidden]{ display:none !important; }`.
  To velja za vse tri aplikacije, zato je izjema pri `.seznam` odveč.
- **Obseg:** majhno.

---

## 1. Poimenovanja

### 1.1 Štiri različne lestvice težavnosti

- **Kje:** `shared/generator.js` (`STOPNJE_UGANK`), `shared/zbirka.js` (`TEZAVNOSTI`),
  `trening/index.html` (značke), `shared/engine.js` (`TECHNIQUE_GROUPS`, `tagClass()`).
- **Zdaj:**

  | Kje | Lestvica | Kaj razvršča |
  |---|---|---|
  | igra, zbirka (obe aplikaciji) | Lahka · Srednja · Težka · Zelo težka · Ekstrem · Drugo | uganke |
  | trening, značke kartic | LAŽJE · SREDNJE · ZAHTEVNO · NAPREDNO | tehnike |
  | motor, `TECHNIQUE_GROUPS` | 5 skupin (enojčki · Naked pair · preseki · pare/trojice · napredne) | tehnike (sidranje) |
  | reševalec in igra, barva oznake koraka (`tagClass`) | t-single · t-pair · t-advanced · t-chain | tehnike (barva) |

  Razdelitve se med seboj ne ujemajo:
  - X-Wing in Swordfish sta v treningu »ZAHTEVNO«, pri stopnjah ugank pa sta »napredni«
    tehniki (kot Turbot Fish in W-Wing, ki sta v treningu »NAPREDNO«).
  - Skrita para je v treningu »LAŽJE« (št. 2), v `TECHNIQUE_GROUPS` pa v skupini za preseki
    (tehniki 3 in 4). To je po `CLAUDE.md` namerno (vrstni red kartic ≠ vrstni red
    reševalca), vendar igralec pri uganki »tehnike: 2« ne ve, da je 2 težja od 3.
  - Barve se ne ujemajo: jantarna je v treningu značka »ZAHTEVNO«, v oznaki koraka pa
    »para/trojica/presek«. Zelena je v treningu »LAŽJE« (očitna para), v koraku pa
    »enojček«, medtem ko je očitna para v koraku jantarna.
  - Izraza »osnovne« in »napredne« tehnike (`docs/tehnike.md`, merila generatorja) igralec
    nikjer ne vidi.
- **Predlog (po odločitvi 2026-09-23):** v `shared/engine.js` ena delitev tehnik na
  **štiri ravni**, poimenovane kot stopnje ugank:

  | Raven | Tehnike | Stopnja uganke, če je to najtežja potrebna raven |
  |---|---|---|
  | lahke | očitni in skriti enojček | Lahka |
  | srednje | 1–6 | Srednja |
  | napredne | 7–12 | Težka ali Zelo težka (ločita se po številu tehnik, kot zdaj) |
  | ekspertne | XY-Chain in poznejše verige – **zaenkrat prazno** | določi se ob uvedbi XY-Chain (glej spodaj) |

  Uganka, ki zahteva ugibanje, ostane Ekstrem. Pravilo »stopnja uganke izhaja iz najtežje
  ravni potrebnih tehnik« je enako današnjemu pokrivajočemu merilu `ustreza()`
  (`skupina` 0 = lahke, 1–3 = srednje, 4 = napredne), zato se merila in razvrstitev ugank
  **ne spremenijo** – spremenijo se samo imena. Iz ene delitve:
  - raven kot polje tehnike (npr. v `TRENING_TEHNIKE` ali `TEHNIKE_OPISI`), funkcija
    `ravenTehnike(kljuc)`;
  - v treningu značke SREDNJA (1–6) in NAPREDNA (7–12); X-Wing in Swordfish gresta iz
    »ZAHTEVNO« med napredne, skriti par iz »LAŽJE« med srednje. Lahkih tehnik trening
    nima (enojčki nimajo vaje). Značka EKSPERTNA pride skupaj z XY-Chain;
  - `tagClass()` z isto delitvijo in istimi barvami kot značke (lahke – `t-single`,
    srednje – `t-pair`, napredne – `t-advanced`; poskus s protislovjem ostane `t-chain`,
    ekspertna raven dobi svojo barvo ob uvedbi);
  - v merilih stopenj in dokumentaciji izraz »osnovne« zamenja »srednje«:
    `GEN_NAJMANJ_OSNOVNIH` → `GEN_NAJMANJ_SREDNJIH`, opisi v `STOPNJE_UGANK[].opis`,
    komentarji v `shared/generator.js`, `tests/generator.test.js`, `docs/tehnike.md`,
    `docs/uganke.md` in `CLAUDE.md`;
  - v pomoči igre ena poved: »tehnike 1–6 so srednje, 7–12 napredne; stopnja uganke je
    raven njene najtežje tehnike«.

  `TECHNIQUE_GROUPS` ostane (sidranje potrebuje finejšo delitev), vendar notranje; raven
  je unija njegovih skupin (skupine 1–3 = srednje).

  **Odprto ob uvedbi XY-Chain:** katera stopnja pripada uganki z ekspertno tehniko (Zelo
  težka ali nova stopnja med Zelo težko in Ekstremom). Nova stopnja bi pomenila novo ime v
  `TEZAVNOSTI` in v `STOPNJE_UGANK` ter novo meritev porazdelitve. **Odločeno 2026-09-24**
  (razdelek 7): ekspertna raven (13) je stopnja Ekstrem.
- **Delno narejeno 2026-09-24** (vrstni red in preštevilčenje): znotraj ravni velja vrstni
  red po zahtevnosti, povsod enak – motor, »Naslednji korak«, številke v treningu in pri
  ugankah (`docs/tehnike.md`, razdelek »Vrstni red znotraj ravni«). `TECHNIQUE_GROUPS` so
  zdaj enojčki · preseki · para · trojici · napredne (meje ravni ostanejo). Značke v
  treningu sta samo še SREDNJA (1–6) in NAPREDNA (7–12). Odprto: raven kot polje tehnike,
  `tagClass()`, izraz »osnovne« → »srednje«, poved v pomoči igre.
- **Obseg:** srednje (engine, generator, trening, CSS obeh aplikacij, testa
  `trening-tehnike.test.js` in `generator.test.js`, dokumentacija).

### 1.2 Ročno vnesena uganka dobi težavnost »Ekstrem«

- **Kje:** `shared/zbirka.js:226` (`PRIVZETA_TEZAVNOST`), `app/zbirka.js:49` (reševalec,
  »Reši«), `igra/igra.js:1582` (igra, »Ali vnesi svojo« → `dodajVZbirko(danosti, '', 'rocno')`).
- **Zdaj:** `Ekstrem` pomeni »zahteva ugibanje«. Vsaka ročno vnesena uganka (tudi taka, ki
  se reši z enojčki) pa ga dobi kot privzeto vrednost in ga obdrži, dokler v igri ne
  poženeš »Oceni zbirko«. Samo ustvarjena uganka dobi pravo stopnjo. V reševalcu lahko
  težavnost v spustnem seznamu izbereš ročno med vsemi šestimi vrednostmi, tudi v
  nasprotju z merilom.
- **Predlog:** ob nastanku zapisa izračunaj težavnost z `oceniUganko()`. Reševalec ima
  rezultat `solve()` že v roki, zato potrebuje samo še `genRazvrsti()` iz
  `shared/generator.js`, ki ga mora zato naložiti. `PRIVZETA_TEZAVNOST` ostane samo kot
  zasilna vrednost. Ročna izbira v reševalcu lahko ostane, a naj bo ob njej vidna
  izračunana stopnja (npr. »izračunano: Lahka«).
- **Obseg:** srednje (`app/index.html`, `app/zbirka.js`, `igra/igra.js`, testi zbirke in
  igre).

### 1.3 Ime tehnike ima štiri oblike

- **Kje:** `shared/engine.js` (`ALL_TECHNIQUES`, `TEHNIKE_OPISI[].ime`), `trening/generators.js`
  (`MODES[].name`), `trening/index.html` (naslovi kartic), `docs/tehnike.md`.
- **Zdaj:**

  | Tehnika | `ALL_TECHNIQUES` (oznaka koraka v reševalcu in igri, izvoz »Tehnike«) | `TEHNIKE_OPISI.ime` (kartica v treningu, okno Pomoč v igri) | `MODES.name` (vrstica nad vajo v treningu) |
  |---|---|---|---|
  | 1 | Naked pair | Očitna para (Naked Pair) | Očitna para |
  | 2 | Hidden pair | Skrita para (Hidden Pair) | Skrita para |
  | 5 | Naked triple | Očitna trojica (Naked Triple) | Očitna trojica |
  | 6 | Hidden triple | Skrita trojica (Hidden Triple) | Skrita trojica |
  | 8 | Swordfish | Tehnika mečarice (Swordfish) | Swordfish |
  | 9 | Turbot Fish | Turbot Fish (Skyscraper, Zmaj z dvema vrvicama) | Turbot Fish |
  | 10 | W-Wing | W-Wing (Krilo W) | W-Wing |
  | – | Gol enojček, Skriti enojček, Poskus in protislovje | (ni) | (ni) |

  V igri »Naslednji korak« pokaže oznako »Hidden pair«, seznam »Tehnike« v oknu Pomoč pa
  »2. Skrita para (Hidden Pair)«, zato igralec korak težko poveže s tehniko iz seznama in
  s številko iz oznake »tehnike: 2, 5«. Tudi velike začetnice niso enotne (»Naked pair«
  proti »Naked Pair«). Pointing pair/triple in Box-line reduction nimata slovenskega imena
  nikjer.
- **Predlog (po odločitvi 2026-09-23):** povsod, kjer ime vidi uporabnik, slovensko ime
  in angleško v oklepaju. Dogovorjena imena:

  | Št. | Ime za prikaz | Ključ v `ALL_TECHNIQUES` zdaj |
  |---|---|---|
  | – | Očitni enojček (Naked Single) | Gol enojček |
  | – | Skriti enojček (Hidden Single) | Skriti enojček |
  | 1 | Izločitev izven bloka (Pointing Pair/Triple) | Pointing pair/triple |
  | 2 | Izločitev v bloku (Box-Line Reduction) | Box-line reduction |
  | 3 | Očitni par (Naked Pair) | Naked pair |
  | 4 | Skriti par (Hidden Pair) | Hidden pair |
  | 5 | Očitna trojica (Naked Triple) | Naked triple |
  | 6 | Skrita trojica (Hidden Triple) | Hidden triple |
  | 7 | X-krilo (X-Wing) | X-Wing |
  | 8 | Mečarica (Swordfish) | Swordfish |
  | 9 | Veriga ene števke (Turbot Fish) | Turbot Fish |
  | 10 | W-krilo (W-Wing) | W-Wing |
  | 11 | XY-krilo (XY-Wing, Y-Wing) | XY-Wing |
  | 12 | Edinstveni pravokotnik (Unique Rectangle) | Unique Rectangle |

  Številke so od 2026-09-24 po vrstnem redu znotraj ravni (1.1); prej sta bila očitni in
  skriti par 1 in 2, preseka pa 3 in 4. V tabeli `Zdaj` zgoraj so številke še stare.

  Sopomenke (Krilo W, Skyscraper, Zmaj z dvema vrvicama, Locked Candidates …) so v
  `docs/tehnike.md`, razdelek »Imena in sopomenke«. Podtipa verige ene števke (Skyscraper,
  Zmaj z dvema vrvicama) ostaneta v sporočilu koraka. »Poskus in protislovje« ostane, kot
  je (ni tehnika s številko).

  Izvedba: `ALL_TECHNIQUES` ostane notranji ključ (dnevnik, sidranje, `tagClass()`, testi).
  V `TEHNIKE_OPISI` se `ime` zamenja z dogovorjenim imenom, dodajo se vnosi za oba
  enojčka in poskus s protislovjem. Funkcija `imeTehnike(kljuc)` v `shared/engine.js` vrne
  ime za prikaz (po želji s številko: »2 · Skriti par (Hidden Pair)«). Iz nje berejo
  oznaka koraka (reševalec, igra), povzetek v reševalcu (»3× Naked pair«), `MODES.name`,
  naslovi kartic v treningu (vpiše jih `trening.js`, tako kot številko) in seznam tehnik
  v pomoči igre. Test `trening-tehnike.test.js` naj preverja, da je naslov kartice
  enak `imeTehnike()`.

  Izvoz v Markdown (`**Tehnike:**`) ima danes ključe iz `ALL_TECHNIQUES`. Predlog: izvoz
  zapiše dogovorjena imena, uvoz pa bere oboje (preslikava starih ključev, kot
  `STARE_TEZAVNOSTI`), da stari izvozi in `docs/uganke.md` ostanejo berljivi.

  Sprememba spola (»Očitna para« → »Očitni par«, »Skrita para« → »Skriti par«) velja tudi
  za besedila razlag v `TEHNIKE_OPISI`, namigov (`stepHint`) in sporočil korakov –
  pregledati jih je treba skupaj z 1.4.
- **Obseg:** srednje (engine, reševalec, igra, trening, izvoz/uvoz, testi, ki primerjajo
  oznake in sporočila).

### 1.4 »Števka« in »številka«

- **Kje:** vse tri aplikacije in sporočila korakov v `shared/engine.js`.
- **Zdaj:** `CLAUDE.md` in `TEHNIKE_OPISI` določata »števka«, igra jo dosledno uporablja.
  Drugje je »številka«:
  - reševalec: `app/index.html:20`, `:39`, `:95`, `app/app.js:296`, `:344`, `:358`, `:363`,
    `:404` (»ista številka se ponavlja«, »danih številk«);
  - trening: `trening/trening.js` (»Označena številka«, »dve številki«, »Izberi natanko 2
    številki«, povratne informacije), `trening/generators.js:128`, `:473`, `:566`, `:814`
    (besedila vaj in naslovi »X-Wing za številko 5«), opisi na karticah v
    `trening/index.html`. Na istem zaslonu vaje sta tako oba izraza: opis iz
    `TEHNIKE_OPISI` govori o »števki«, oznaka nad mrežo o »številki«;
  - motor: sporočila korakov (npr. `shared/engine.js:175` »je številka 5 možna samo še v«,
    `:292` »sta številki … možni samo v celicah«). Igra jih pokaže v 3. stopnji pomoči, zato
    se izraz menja celo znotraj igre;
  - `docs/tehnike.md` (stolpec »Kaj počne«).

  »Številka« pravilno ostane pri številki tehnike (»tehnike: 1, 3, 7«) in številki poteze.
- **Predlog:** v besedilih za uporabnika povsod »števka«. Test `trening-tehnike.test.js`
  že preverja `TEHNIKE_OPISI` – razširi ga na besedila vaj v `MODES` in na sporočila korakov
  (vzorec `/številk/` v sporočilu `solve()` na ugankah iz `docs/uganke.md`).
- **Obseg:** srednje (veliko besedil, testi, ki primerjajo sporočila korakov).

### 1.5 Stanja uganke imajo dve besedili (opažanje 1)

- **Kje:** `shared/zbirka.js:98` (`zbirkaStanjeIgre()` – iz zapisa v zbirki),
  `igra/igra.js:915` (`zbirkaStatusIgre()` – iz shranjene igre), `igra/igra.js:540`
  (kartica »Uganka«), `app/zbirka.js`.
- **Zdaj:**

  | Stanje | Tvoja zbirka (seznam, kartica »Uganka«, izvoz) | Vgrajeni primeri (igra) | Kartica »Uganka«, status |
  |---|---|---|---|
  | nova | brez vrstice | »nova« | – |
  | v teku | »zadnje reševanje … · v teku (24 od 81)« | »v teku: 19/81« | »Izpolnjenih 24 od 81 celic.« |
  | rešena | »rešena 21. 9. 2026 ob 17:48« | »rešeno ✓« | »Uganka je rešena. Čestitam! …« |
  | napaka | »izpolnjena z napako« | »izpolnjeno z napako« | – |

  Zbirka torej uporablja ženski spol (uganka), primeri srednji spol, števec je v dveh
  oblikah (»24 od 81« / »19/81«), CSS razreda pa sta dva (`resena` / `reseno`). Isto
  velja za programove podatke: reševalec piše »program rešil delno (60/81)«, izvoz in
  namig »delno (60 od 81 celic)«, sporočilo ob shranjevanju »rešeno delno: 60 od 81
  celic«.

  Gumb »Igraj / Nadaljuj / Poglej« (`gumbiUganke()`) se določa iz **shranjene igre**
  (`zbirkaStatusIgre`), vrstica s stanjem pa iz **zapisa v zbirki**. Ta dva vira se lahko
  razlikujeta – glej 2.3.
- **Predlog:** ena funkcija v `shared/zbirka.js` vrne `{ kljuc, besedilo, kratko, gumb }`
  za vsa mesta (seznam, primeri, kartica »Uganka«, izvoz). Po odločitvi pri 1.6 so stanja
  samo tri, povsod v ženskem spolu (»nova«, »v teku (12/57)«, »rešena«), polna mreža z
  napako pa ima znotraj stanja »v teku« podoznako: »v teku (57/57) · napaka«. Napis in
  gumb izhajata iz istega pogoja. Funkcija vrne podoznako kot posebno polje (npr.
  `napaka: true`), da jo seznam lahko obarva. Programovi podatki povsod v obliki izvoza.
  `zbirkaStatusIgre()` v igri se odstrani (glej 6.2).
- **Obseg:** srednje (igra, reševalec, testi `igra-ui` in `zbirka-zapis`).
- **Delno narejeno 2026-09-23** (glej 6.2): stanja uganke imajo eno besedilo povsod (seznama,
  primeri, kartica »Uganka«, izvoz), razred `reseno` je postal `resena`. Odprto: programovi
  podatki (»program rešil delno (60/81)« / »delno (60 od 81 celic)«).
- **Programovi podatki narejeni 2026-09-24** (faza 2, odločitev pri načrtu): števec programa
  ima isto obliko kot moj napredek – samo celice, ki jih je treba izpolniti: »program rešil
  delno (36/57)« v kartici, `**Program rešil:** delno (36/57)` v izvozu in namigu, isto v
  sporočilu ob shranjevanju in v statusu reševalca (`zbirkaProgramResil()`). Uvoz bere tudi
  staro obliko »delno (60 od 81 celic)«.

### 1.6 Števec »v teku (24 od 81)« šteje tudi danosti (opažanje 3)

- **Kje:** `igra/stanje.js:155` (`steviloVpisanih()` = vse izpolnjene celice),
  `igra/igra.js:277` (`shraniIgranje()`), `igra/igra.js:285` (`uskladiIgranje()`),
  `shared/zbirka.js:105`.
- **Zdaj:** »izpolnjeno« šteje vse polne celice, torej tudi dane. Uganka s 24 danostmi
  pokaže »v teku (24 od 81)«, čeprav nisem vpisal nič. To se zgodi, kadar je bila edina
  poteza odstranitev kandidata ali kadar sem kliknil »Začni znova« (zgodovina potez ostane,
  zato igra velja za začeto). Številka je videti kot napredek, v resnici pa pomeni
  »danosti + moji vpisi«. Pri uganki s 17 danostmi in uganki s 32 danostmi ista številka
  pomeni različen napredek.
- **Predlog (po odločitvi 2026-09-23):**
  - **Zapis napredka:** »12/57«, kjer je 57 = 81 − število danosti (prazne celice), 12 pa
    število mojih vpisov. Polje `izpolnjeno` v zapisu ostane (iz njega izhaja »rešena«),
    prikaz odšteje danosti: vpisov = `izpolnjeno − danih`.
  - **Tri stanja:**

    | Stanje | Pogoj | Napis | Gumb v zbirki |
    |---|---|---|---|
    | nova | igra nima nobene poteze | »nova« | Igraj |
    | v teku | od prve poteze (tudi če so bili samo odstranjeni kandidati) do rešitve | »v teku (12/57)« | Nadaljuj |
    | v teku, polna mreža z napako | vse prazne celice izpolnjene, vsaj ena napačna | »v teku (57/57) · napaka« | Nadaljuj |
    | rešena | vse prazne celice izpolnjene in pravilne | »rešena« | Poglej |

    »Poteza« je katerakoli poteza v zgodovini igre, tudi razveljavljena (v repu za
    »Ponovi«) ali pred »Začni znova« – to je današnji `zacetaIgra()`. Uganka s samimi
    odstranjenimi kandidati je torej »v teku (0/57)«.
  - **Polna mreža z napako** (popravek odločitve 2026-09-23): ni četrto stanje, ampak
    poseben primer znotraj »v teku« s podoznako »· napaka«. Od mreže, ki še čaka vpise, se
    loči zato, ker igralec nima več kam vpisovati in mora napako poiskati (»Preveri«).
    Napis in gumb (»Nadaljuj«) izhajata iz istega vira kot pri ostalih »v teku«, doda se
    samo podoznaka. Podoznaka je obarvana kot današnje »izpolnjena z napako« (razred
    `napaka`). Polje `napaka` v zapisu ostane – iz njega izhajata podoznaka in razlika do
    »rešena«.
  - **Napis in gumb morata slediti istemu pogoju.** Zdaj se napis določa iz zapisa v
    zbirki (`zbirkaStanjeIgre()`), gumb pa iz shranjene igre (`zbirkaStatusIgre()`), zato
    se razlikujeta (2.3). Enotno: oba da ena funkcija (1.5) iz enega vira – shranjene igre,
    kadar obstaja, sicer zapisa v zbirki (uganka, uvožena iz drugega brskalnika, nima
    shranjene igre). Zamrznjen čas prve rešitve je poseben podatek (2.3), ne stanje.
  - **Izvoz in uvoz:** `**Stanje:** v teku (12/57)` oziroma `**Stanje:** v teku (57/57) ·
    napaka`. Uvoz bere tudi stari obliki »v teku (45 od 81)« (izpolnjeno = 45) in
    »izpolnjena z napako« (izpolnjeno = 81, napaka), nova oblika pa se preračuna v
    `izpolnjeno = danih + 12`, »· napaka« pa v `napaka = true`.
- **Obseg:** srednje (igra, `shared/zbirka.js`, izvoz/uvoz, testa `igra-ui` in
  `zbirka-zapis`).
- **Narejeno 2026-09-23** (glej 6.2). Kartica »Uganka« kaže »Nova uganka (0/57).« /
  »V teku (12/57).« / »V teku (57/57) · napaka – poišči jo s »Preveri«.«. Zapis brez
  shranjene igre (uvoz z druge naprave) kaže napis iz zapisa, gumb pa je »Igraj« (ni česa
  nadaljevati). **Ugotovitev:** v igri polne mreže z napako ni mogoče dobiti z dovoljenimi
  potezami – vpis je samo trenutni kandidat, polna mreža brez sporov pa je pri enolični uganki
  rešitev. Podoznaka »· napaka« se zato pokaže samo pri starejših ali uvoženih podatkih.

### 1.7 Oznake gumbov

- **Kje:** vse tri aplikacije.
- **Zdaj:**

  | Namen | Reševalec | Trening | Igra |
  |---|---|---|---|
  | odpri uganko iz zbirke | Naloži | – | Igraj / Nadaljuj / Poglej |
  | pokaži/skrij | »Prikaži kandidate«, »Prikaži korake reševanja«, »Pokaži na mreži ▾«, »Skrij mrežo ▴« | »Pokaži število kandidatov« | »Pokaži več«, »Pokaži rešitev«, »Skrij« |
  | namig/rešitev | – | »Namig (drži)«, »Rešitev (drži)« | »Naslednji korak« → »Pokaži več« → »Pokaži rešitev« |
  | preverjanje | – | »Preveri« (odgovor vaje) | »Preveri« (napake na mreži) |
  | izpraznitev | »Počisti« (vnos) | – | »Počisti« (vnos), »Začni znova« (igra) |
  | nazaj/konec | – | »← Nazaj na izbiro«, »Končaj« | – |

  »Prikaži« in »Pokaži« se mešata, v reševalcu celo v isti kartici.
- **Predlog:** povsod »Pokaži … / Skrij …«. V reševalcu naj bo »Naloži« → »Odpri v
  reševalcu« (ker naloži samo danosti, igra pa odpre igro). Oznaki »Namig« in »Rešitev« v
  treningu lahko ostaneta, ker delujeta drugače (drži za ogled).
- **Obseg:** majhno.
- **Delno narejeno 2026-09-24** (faza 2): gumb v seznamu zbirke reševalca je »Odpri«
  (odločitev: ne »Odpri v reševalcu«, ker je uganka že v reševalcu). Poenotenje
  »Prikaži«/»Pokaži« ostaja odprto.

---

## 2. Zbirka: prikaz uganke

### 2.1 Kartica uganke v seznamu se razlikuje

- **Kje:** `app/zbirka.js:85` (`zbirkaIzrisiSeznam()`), `igra/igra.js:990` (`izrisiZbirko()`),
  `igra/igra.js:962` (`izrisiPrimere()`).
- **Zdaj:**

  | Vrstica | Reševalec (zbirka) | Igra (tvoja zbirka) | Igra (vgrajeni primeri) |
  |---|---|---|---|
  | 1 | dodana … · težavnost · izvor | dodana … · težavnost · izvor | ime primera |
  | 2 | zadnje reševanje … · stanje (brez barve) | zadnje reševanje … · stanje (obarvano) | – |
  | danosti | ni | »danih: 24« | »danih: 19« |
  | napredek | v 2. vrstici | v 2. vrstici | »v teku: 19/81« v vrstici z danostmi |
  | tehnike | ni | »tehnike: 1, 3, 7 + poskus« | ni |
  | program | »42 korakov · brez ugibanja · program rešil delno (60/81)« | ni (samo namig miške) | ni |
  | trenutna uganka | ni oznake | »trenutno odprta« + modra črta | isto |
  | opomba | da | da | – |
  | gumbi | Naloži, Izbriši | Igraj / Nadaljuj / Poglej | isto |
  | prazen seznam | »Zbirka je prazna. Uganka se shrani samodejno ob reševanju …« | »Zbirka je prazna. Uganko dodaš z gumbom »Nova uganka« ali z reševanjem v reševalcu.« | – |

  Poleg tega je »ugibal 2×« (reševalec) isti podatek kot »+ poskus ×2« (igra). Status
  okna je v reševalcu privzeto zelen (`.lib-status`), v igri siv (`.dialog-status`).
- **Predlog:** ena skupna funkcija za izris kartice (glej 6.1) z istimi vrsticami v obeh
  aplikacijah: (1) težavnost · izvor · dodana, (2) moje reševanje, (3) »danih N ·
  tehnike: 1, 3, 7 · 42 korakov«, (4) opomba. Različni so samo gumbi. En izraz za
  ugibanje (»+ poskus«, ker ga že uporablja oznaka tehnik).
- **Obseg:** srednje (skupaj s 6.1).
- **Narejeno 2026-09-24** (glej 6.1). Odločitve pri načrtu: 2. vrstica je **vedno**, tudi
  pri novi uganki (»nova«); 3. vrstica »danih 24 · tehnike: 1, 3, 7 + poskus · 42 korakov«,
  pri delni rešitvi programa še »· program rešil delno (36/57)« (1.5); »ugibal 2×« odpade.
  »Trenutno odprta« je na enem mestu: modra črta in značka v 1. vrstici (v reševalcu je
  trenutna uganka v vnosni mreži). Prazen seznam ima v obeh aplikacijah razred `prazno`,
  besedili ostaneta različni.

### 2.2 Vgrajeni primeri so prikazani drugače kot uganke iz zbirke (opažanje 1)

- **Kje:** `igra/igra.js:932` (`infoUganke()`), `igra/igra.js:962` (`izrisiPrimere()`).
- **Zdaj:** primer nima zapisa v zbirki, zato igra stanje izračuna iz shranjene igre z
  `zbirkaStatusIgre()` in ga izpiše v vrstici z danostmi (»danih: 19 · v teku: 19/81«,
  »rešeno ✓«, »nova«). Zbirka ima vrstico s časom in stanjem (»v teku (24 od 81)«,
  »rešena 21. 9. …«), pri novi uganki pa nič. Primer tudi nima težavnosti, tehnik in
  časa zadnjega reševanja, čeprav je čas v shranjeni igri (`nazadnje`).
- **Predlog:** primer prikaži z isto kartico kot uganko iz zbirke (2.1). Podatke sestavi
  iz shranjene igre (`igrano` = `zapis.nazadnje`, izpolnjeno/napaka iz potez), težavnost
  in tehnike pa iz `PRIMERI` (glej 3) ali iz zapisa v zbirki, če je primer tam z izvorom
  `primer` (2.5). Oba seznama kažeta ista besedila stanj iz 1.6: »nova«, »v teku
  (12/57)«, »v teku (57/57) · napaka« in »rešena« (namesto »rešeno ✓«, »izpolnjeno z
  napako«).
- **Obseg:** srednje (skupaj z 1.5 in 6.1).
- **Delno narejeno 2026-09-23** (glej 6.2): primeri kažejo ista besedila stanj kot zbirka.
  Odprto (faza 2): ista kartica, težavnost, tehnike in čas.
- **Narejeno 2026-09-24:** primeri imajo isto kartico kot zbirka. Primer, ki je v zbirki (izvor
  `primer`, 2.5), kaže podatke iz zapisa (dodana, čas reševanja, tehnike, koraki). Primer brez
  zapisa kaže samo ime, stanje in »danih N«: brez časa, ker se `nazadnje` v shranjeni igri
  osveži že ob odprtju igre, in brez tehnik, ker bi jih moral vsakič izračunati s `solve()`.
  Od spremembe 2.5 (primeri niso del zbirke) ima primer vedno samo to kartico brez zapisa.

### 2.3 Ponovno reševanje rešene uganke ni vidno (opažanje 2)

- **Kje:** `shared/zbirka.js:242` (zamrznjen zapis), `igra/igra.js:947` (`gumbiUganke()`),
  `igra/igra.js:978` (`vrsticaIgranja()`).
- **Zdaj:** po »Začni znova« pri rešeni uganki je zapis v zbirki zamrznjen (namerno – čas
  prve rešitve), zato vrstica kaže zeleno »rešena 21. 9. 2026 ob 17:48«. Gumb pa se
  določa iz shranjene igre, ki ni več polna, zato je »Nadaljuj«. Igralec vidi zeleno
  »rešena« in »Nadaljuj« hkrati, podatka o ponovnem reševanju pa ni nikjer. Okno Pomoč
  (`igra/index.html:165`) pravi, da ima rešena uganka gumb »Poglej«, kar po »Začni znova«
  ne velja več.
- **Predlog:** zapis ostane zamrznjen, druga vrstica pa dobi podatek iz shranjene igre:
  »rešena 21. 9. 2026 ob 17:48 · znova v teku (12/57)«, pri polni mreži z napako
  »… · znova v teku (57/57) · napaka«. Enako v kartici »Uganka«. Napis
  »v teku« in gumb »Nadaljuj« izhajata iz istega pogoja (1.6), čas prve rešitve pa ostane
  kot dodaten podatek. Pomoč v igri dopolni.
- **Obseg:** srednje (igra, test `igra-ui.test.js`, ki preverja ponovno reševanje).
- **Narejeno 2026-09-23** (glej 6.2): seznam v igri in reševalcu ter kartica »Uganka«,
  pomoč v igri dopolnjena. Izvoz ostane iz zapisa v zbirki (»rešena«).

### 2.4 Oblika časa

- **Kje:** `shared/zbirka.js:87` (`zbirkaPrikazDatuma()`), `shared/zbirka.js:137`
  (`zbirkaNamigCasov()`).
- **Zdaj:** seznam in kartica »Uganka« kažeta »21. 9. 2026 ob 16:33«, namig miške nad
  isto vrstico pa »Dodano: 2026-09-21 16:33 · … · Ocenjeno: 2026-09-22 10:05«. Izvoz ima
  obliko `2026-09-21 16:33` (namerno, zaradi uvoza).
- **Predlog:** namig miške v isti obliki kot seznam (`zbirkaPrikazDatuma()`), izvoz ostane
  nespremenjen.
- **Obseg:** majhno.
- **Narejeno 2026-09-24** (`zbirkaNamigCasov()`).

### 2.5 Reševalec shrani vgrajeni primer v zbirko, igra ne

- **Kje:** `app/zbirka.js:45` (`zbirkaPoResevanju()`), `igra/index.html:165`
  (»Vgrajeni primeri se v zbirko ne dodajo«).
- **Zdaj:** primer, izbran v reševalcu (»Primer«) in rešen z »Reši«, se shrani v zbirko
  z izvorom »ročni vnos« in s težavnostjo »Ekstrem«. V igri je nato isti primer dvakrat:
  pod »Vgrajeni primeri« in pod »Tvoja zbirka«. Napredek si delita (iste danosti), prikaz
  pa je različen (2.2).
- **Predlog (po odločitvi 2026-09-23):** vgrajeni primer, rešen v reševalcu, se shrani v
  zbirko z izvorom **`primer`**:
  - `ZBIRKA_IZVORI` dobi vrednost `primer` (besedilo »vgrajeni primer«); `zbirkaIzvor()`
    jo bere tudi iz izvoza;
  - reševalec v `zbirkaPoResevanju()` preveri, ali so danosti v `PRIMERI`, in namesto
    `rocno` poda `primer`. Težavnost dobi iz `PRIMERI` (3) ali iz `oceniUganko()` (1.2);
  - obstoječi zapisi: primer, ki je že v zbirki z izvorom `rocno` ali `''`, se ob branju
    zbirke prepozna po danostih in dobi `primer` (enkratni popravek, kot pri starih
    težavnostih). Izvor se sicer po nastanku ne spreminja, zato je to edina izjema;
  - igra pokaže primer **samo enkrat** – pod »Vgrajeni primeri«, s podatki iz zapisa v
    zbirki, kadar obstaja (2.2). Pod »Tvoja zbirka« se zapisi z izvorom `primer` ne
    izpišejo (v izvozu in v reševalcu pa so, tam jih lahko tudi izbrišeš);
  - igra sama primerov v zbirko še naprej ne dodaja (besedilo pomoči
    `igra/index.html:165` to pove) – odločitev velja za reševalec.

  **Odločitev spremenjena 2026-09-24: primeri niso del zbirke.** Izvor `primer` je naredil
  model, ki ga ni bilo mogoče razložiti: ista hramba je v igri kazala 54 ugank, v
  reševalcu 58. Razlika so bili zapisi, katerih danosti so v `PRIMERI` – igra jih je iz
  »Tvoje zbirke« in števca skrila (`mojaZbirka()`), reševalec pa ne. Tak zapis je nastal
  tudi tiho: testna uganka iz `docs/uganke.md`, ki je hkrati primer (npr. `lahka-seme-1`),
  je z »Reši« ali z uvozom prišla v zbirko kot navadna, `zbirkaBeri()` pa ji je nastavil
  izvor `primer`, zato je izginila iz števca v igri. Nov, preprost model:
  - **ena zbirka, povsod enaka**: isti seznam, isto število na gumbu »Zbirka« in iste
    kartice v igri in reševalcu (`mojaZbirka()` odpade);
  - **primeri niso del zbirke**: nikoli se ne shranijo (`zbirkaShraniResitev()` vrne `null`,
    reševalec pokaže »Vgrajeni primer – v zbirko se ne shrani.«, uvoz jih preskoči in
    to pove) in se ne štejejo. V igri ostanejo v zloženem razdelku na dnu okna, v
    reševalcu v izbiri »Primer«. `zbirkaBeri()` obstoječe zapise primerov odstrani in
    zbirko enkrat prepiše; napredek igranja primera (`sudoku.igra.v1`) ostane. Izvor
    `primer` odpade (`ZBIRKA_IZVORI` ima samo `generator` in `rocno`), polje `tezavnost` v
    `PRIMERI` ostane;
  - **brisanje v obeh aplikacijah**: gumb »Izbriši« na kartici (s potrditvijo) tudi v
    igri, in gumb »Izbriši vse« ob »Izvozi«/»Uvozi« (potrditev navede število ugank in
    priporoči izvoz). Brisanje odstrani tudi shranjeno igro teh ugank, igre primerov pa ne
    (`zbirkaIzbrisi()`, `zbirkaIzbrisiVse()` v `shared/zbirka.js`). »Izbriši vse« odstrani
    **vse** shranjene igre razen iger primerov – tako počisti tudi sirote (igre ugank, ki
    jih je reševalec izbrisal pred novim modelom, ko brisanje igre še ni odstranilo). To velja tudi pri prazni zbirki: kadar so shranjene
    samo sirote, potrditev pove, da gre za napredek izbrisanih ugank; »Zbirka je že
    prazna.« piše šele, ko ni ne ugank ne sirot. Če je izbrisana uganka
    odprta v igri, se mreža izprazni kot ob prvem zagonu – sicer bi naslednja poteza
    znova zapisala shranjeno igro brez zapisa v zbirki;
  - **drug zavihek**: igra in reševalec poslušata dogodek `storage`
    (`zbirkaObSpremembiDrugje()` v `shared/zbirka-ui.js`) in osvežita števec in odprt
    seznam; uganka, izbrisana v drugem zavihku, izprazni mrežo tudi v igri. Prej se je
    števec osvežil samo ob zagonu, uvozu in dodajanju, zato je lahko kazal zastarelo
    število.

  **Oblika zapisa ugank (pregled 2026-09-23).** Uganke vnašaš kot niz 81 znakov, pika =
  prazna celica. Dejansko stanje:

  | Mesto | Prazna celica | Opomba |
  |---|---|---|
  | `PRIMERI` v `shared/zbirka.js` | **mešano**: Primer 1 `0`, Primeri 2–5 `.` | igra jih pretvori v `0` (`igra/igra.js:56`), reševalec bere oboje (`app/app.js:271`) |
  | zbirka v `localStorage` (`sudoku.zbirka.v1`) | `0` | niz danosti je ključ zapisa |
  | igre v `localStorage` (`sudoku.igra.v1`) | `0` | niz danosti je ključ igre (`s.igre[danosti]`) |
  | motor (`Board`, `solve()`, `countSolutions()`) | sprejme `0` in `.` | `shared/engine.js:96` |
  | generator (`ustvariUganko()`) | `0` | |
  | izvoz Markdown (`zbirkaIzvozi()`) | `.` | `shared/zbirka.js:270`; uvoz sprejme oboje (`:329`) |
  | `docs/uganke.md` | `.` | |
  | `tools/ustvari-uganko.js` (izpis) | `.` | `tools/analiziraj-zbirko.js` bere oboje |
  | igra, polje »Niz« (»Nova uganka«) | sprejme `0` in `.` | druge znake (presledke, nove vrstice) izpusti |
  | reševalec, vnos | – | **polja za niz ni**, samo mreža 81 polj; niza tudi ni mogoče kopirati |

  **Predlog:** ne povsod enako, ampak dve plasti z eno pretvorbo:
  - **zunanja oblika** (vse, kar človek vidi, vnaša ali shrani v datoteko): pika. Sem
    spadajo `PRIMERI` v kodi (Primer 1 pretvoriti v `.`), izvoz, `docs/uganke.md`, orodja
    in prikaz niza v aplikacijah;
  - **notranja oblika** (shramba in motor): ostane `0`. Niz danosti je ključ v obeh
    shrambah; sprememba bi zahtevala selitev obeh ključev hkrati, sicer se shranjene igre
    ločijo od zapisov v zbirki – korist za uporabnika pa je nič, ker notranjega niza ne
    vidi;
  - pretvorba na enem mestu v `shared/`: `danostiIzNiza(niz)` (sprejme `.` in `0`,
    izpusti presledke in nove vrstice, vrne 81 znakov z `0` ali `null`) in
    `danostiZaPrikaz(danosti)` (`0` → `.`). Uporabijo jih polje »Niz« v igri, uvoz,
    `PRIMERI` (`igra/igra.js:56`) in orodja namesto svojih pretvorb;
  - reševalec dobi polje »Niz« kot igra (skupaj s 6.4, skupna vnosna mreža).

  Dopolnitev primerov za vse stopnje in tehnike je **ločena naloga** (glej 3); nove
  uganke samo z orodji v `tools/` (`ustvari-uganko.js`, `analiziraj-zbirko.js`), ne
  sestavljene na pamet.
- **Obseg:** majhno (izvor `primer`), majhno (pretvorba in `PRIMERI`), polje »Niz« v
  reševalcu srednje (s 6.4).
- **Izvor `primer` narejen 2026-09-24** (skupaj s fazo 2): reševalec shrani rešen primer z
  izvorom `primer` in težavnostjo iz `PRIMERI` (3); `zbirkaBeri()` stare zapise primerov
  (`rocno` ali `''`) popravi v `primer` s težavnostjo primera; igra primer pokaže samo pod
  »Vgrajeni primeri« (»Tvoja zbirka«, števec na gumbu »Zbirka« in »Oceni zbirko« so brez
  primerov), sama ga v zbirko ne doda; reševalec ga kaže v seznamu z imenom primera (tam ga
  lahko izbrišeš). Odprto: pretvorba danosti (pika navzven, `danostiIzNiza()`) in polje »Niz«
  v reševalcu.
- **Nadomeščeno isti dan** z odločitvijo »primeri niso del zbirke« (zgoraj): izvor
  `primer`, popravek v `zbirkaBeri()` in `mojaZbirka()` so odstranjeni.

### 2.6 Vrstica »Zapiši ocene (0)«

Glej 0.2 (vzrok je CSS, ne logika).

---

## 3. Vgrajeni primeri

- **Kje:** `shared/zbirka.js:68` (`PRIMERI`), `app/app.js:285` (spustni seznam »Primer«),
  `igra/igra.js:962` (razdelek »Vgrajeni primeri«), `docs/uganke.md` (vir).
- **Zdaj:** stopnja je zapisana v imenu primera, ročno in po starih merilih. Ocena
  `oceniUganko()` na današnji kodi (izmerjeno 2026-09-23):

  Številke v stolpcu »Tehnike« so po oštevilčenju do 2026-09-24 (1 očitna para … 4 box-line).

  | Ime zdaj | Vir v `docs/uganke.md` | Danih | `oceniUganko()` danes | Tehnike | Skladno? |
  |---|---|---|---|---|---|
  | Primer 1 (z ugibanjem) | example-app | 17 | Ekstrem | 1, 2, 3, 4 + poskus | da, a brez imena stopnje |
  | Primer 2 (Ekstrem, brez ugibanja) | oakever-ekstrem-lv4 | 17 | **Zelo težka** | 1, 7, 9, 10, 12 | **ne** – »Ekstrem« je ime stopnje iz aplikacije Oakever; pri nas Ekstrem pomeni ugibanje, »brez ugibanja« si zato nasprotuje |
  | Primer 3 (srednja – presek) | lahka-seme-197 | 32 | Srednja | 3 | da (ime vira »lahka« je zgodovinsko, glej `docs/uganke.md`) |
  | Primer 4 (srednja – trojica) | srednja-a | 26 | Srednja | 1, 5, 6 | da |
  | Primer 5 (lahka) | lahka-seme-1 | 26 | Lahka | samo enojčki | da, a z malo začetnico |

  Dodatno:
  - vrstni red je od najtežjega k najlažjemu, stopnje drugod pa od lahke k težji;
  - zapis ni enoten (»Ekstrem« z veliko, »srednja«/»lahka« z malo začetnico, enkrat
    vejica, drugič pomišljaj);
  - reševalec v spustnem seznamu kaže celo ime, igra enako ime in brez težavnosti –
    stopnjo primera razbereš samo iz imena;
  - Primer 3 uporabi eno samo tehniko nad enojčki (3). Po pokrivajočem merilu je srednji,
    generator pa take uganke ne bi ustvaril (`ustrezaIskanju` zahteva vsaj dve osnovni).
    To ni napaka, a je vredno vedeti, če naj primeri kažejo tipično uganko stopnje.
- **Predlog:**
  - `PRIMERI` dobijo polje `tezavnost` (ime iz `TEZAVNOSTI`) in kratek opis brez stopnje,
    npr. `{ tezavnost: 'Srednja', opis: 'presek' }`. Prikazno ime sestavi koda:
    »Srednja – presek«, »Zelo težka«, »Ekstrem – z ugibanjem«;
  - vrstni red Lahka → Srednja → Srednja → Zelo težka → Ekstrem;
  - test v `tests/generator.test.js`: za vsak primer `oceniUganko(danosti).tezavnost ===
    p.tezavnost`. Ob spremembi meril test takoj pokaže, da je ime zastarelo;
  - v igri naj kartica primera kaže težavnost in tehnike enako kot uganka iz zbirke (2.2);
  - danosti vseh primerov v zunanji obliki s piko (2.5).

  **Delno narejeno 2026-09-24:** `PRIMERI` imajo polje `tezavnost` (vrednosti iz
  `oceniUganko()`: Ekstrem, Zelo težka, Srednja, Srednja, Lahka) s testom v
  `tests/generator.test.js`; iz njega dobi težavnost zapis primera, ki ga shrani reševalec
  (2.5). Odprto: ime brez stopnje (`opis`), vrstni red, oblika s piko.

  **Ločena naloga (odločitev 2026-09-23):** dopolnitev primerov, da bo pokrita vsaka
  stopnja (tudi Težka) in vsaka tehnika 1–12. Uganke samo z orodji v `tools/`
  (`ustvari-uganko.js`, izbor z `analiziraj-zbirko.js`), preverjene s `countSolutions()`
  in zapisane v `docs/uganke.md` – ne sestavljene na pamet.
- **Obseg:** majhno (brez 2.2), srednje (z 2.2).

### 3.1 Vgrajeni primeri v igri: na dnu okna, zložljivi (odločitev 2026-09-24)

- **Kje:** `igra/index.html` (okno »Zbirka ugank«), `igra/igra.js` (`primeriOdprti()`,
  poslušalec gumba »Zbirka«), `igra/igra.css` (`.primeri-razdelek`).
- **Prej:** razdelek »Vgrajeni primeri« je bil na vrhu okna, vedno odprt, »Tvoja zbirka«
  pa pod njim – pri daljši zbirki je bilo pet primerov vedno prvo, kar igralec vidi.
- **Odločitev:** samo igra; reševalec obdrži spustni seznam »Primer«.
  - Razdelek je na dnu okna, pod mojo zbirko, kot zložljiv `<details>` z naslovom
    »Vgrajeni primeri (N)« (N = `PRIMERI.length`).
  - Privzeto je zaprt. Ob odprtju okna je odprt samo, kadar je moja zbirka prazna (nov
    igralec takoj vidi, kaj lahko igra) ali kadar je trenutno odprta uganka primer (da je
    oznaka »trenutno odprta« vidna).
  - Stanje se določi samo ob odprtju okna; ponoven izris seznama (uvoz, ocenjevanje) ga ne
    spremeni, zato igralčeva izbira med delom v oknu ostane.
  - Kartice primerov so nespremenjene (stanje, gumb »Igraj«/»Nadaljuj«/»Poglej«).
  - Sporočilo pri prazni zbirki napoti na primere spodaj; okno Pomoč opisuje novo
    postavitev.
- **Testi:** `tests/igra-ui.test.js` (privzeto zaprt, odprt pri prazni zbirki, odprt pri
  odprtem primeru).
- **Vpliv na fazo 3:** ko bo primer, rešen v reševalcu, v zbirki z izvorom `primer` (2.5),
  se bo pokazal v zbirki na vrhu in v zaprtem razdelku spodaj – »pokaži enkrat« iz faze 3
  ostane odprto. **Rešeno 2026-09-24** (2.5): primer je samo v razdelku spodaj; razdelek je
  odprt tudi, kadar so v zbirki samo primeri (moja zbirka je takrat prazna).
- **Odločitev spremenjena 2026-09-24** (2.5, »primeri niso del zbirke«): primerov v zbirki ni
  več, zato razdelek na dnu ni več »druga polovica« zbirke, ampak edino mesto primerov v
  igri. Razlog: dve različni števili (igra 54, reševalec 58) iz iste hrambe in skriti
  zapisi, ki jih igralec ni mogel ne videti ne izbrisati. Postavitev ostane: razdelek je
  na dnu, zložen, odprt ob prazni zbirki ali ko je odprta uganka primer (pogoj je zdaj
  `!zbirkaBeri().length`). Kartice primerov nimajo gumba »Izbriši« in so vedno brez zapisa
  (ime, stanje iz shranjene igre, »danih N«).

---

## 4. Videz

### 4.1 Paleta barv

- **Kje:** `app/app.css:3`, `igra/igra.css:4`, `trening/trening.css:3`.
- **Zdaj:** reševalec in igra imata isto paleto, vsak v svoji kopiji. Trening ima
  drugačne vrednosti istih imen (npr. `--ink` #1E2D3D proti #24303D, `--green` #1F7A56
  proti #2E7D5C, `--blue` #1758A8 proti #1F5FA8, `--line` #C4CCD4 proti #C7CFD6) in
  dodatne barve tehnik (`--teal`, `--indigo`, `--cyan`, `--orange`, `--plum`, `--olive`).
- **Predlog:** `shared/theme.css` (ali razširjen `shared/base.css`) s skupnimi barvami.
  Trening obdrži samo svoje dodatne barve tehnik.
- **Obseg:** srednje (trening se vizualno malo spremeni).

### 4.2 Ozadje, širina, glava

- **Kje:** `app/app.css`, `igra/igra.css`, `trening/trening.css`, glave v treh `index.html`.
- **Zdaj:**

  | | Reševalec | Trening | Igra |
  |---|---|---|---|
  | ozadje strani | #E9EDF0 z mrežnim vzorcem 22 px | #EAEEF2 enobarvno | #FFFFFF (po Oakever) |
  | največja širina | 480 px | 560 px | 960 px (dva stolpca) |
  | glava | nadnaslov (JetBrains Mono) + gumb »Zbirka« + h1 24 px + opis | h1 22 px + opis, brez nadnaslova | nadnaslov + gumbi »Pomoč«, »Nova uganka«, »Zbirka« + h1 24 px |
  | noga | `footer.note` levo | ni | `footer.note` sredinsko |
  | kartica | padding 18 px, razmik 16 px | `.exercise` 18 px / 16 px | padding 16 px, razmik 12 px |
  | Google Fonts | s `preconnect` | brez `preconnect` | s `preconnect` |

- **Predlog (po odločitvi 2026-09-23):** povsod **bela podlaga kot v igri** (#FFFFFF,
  brez mrežnega vzorca) v `shared/`; reševalec izgubi sivo podlago z mrežnim vzorcem,
  trening sivo enobarvno. Kartice imajo v vseh treh aplikacijah že obrobo (`--line`),
  zato na beli podlagi ostanejo ločene; `--card` in `--bg` sta potem enaki. Ista glava (nadnaslov, naslov, gumbi desno), ista
  noga in iste mere kartic v `shared/`. Širina ostane po aplikaciji (igra potrebuje dva
  stolpca).
- **Obseg:** srednje.

### 4.3 Navigacija med aplikacijami

- **Kje:** vse tri `index.html`.
- **Zdaj:** med aplikacijami ni nobene povezave, v korenu ni vstopne strani. Igra v
  besedilih omenja reševalec in trening (»Zbirko si deli z reševalcem (`app/`)«,
  »Uganke brišeš v reševalcu«, »Številke so iste kot v treningu (`trening/`)«), povezave pa
  ni. Brisanje uganke iz igre torej pomeni ročno spremembo naslova v brskalniku.
- **Predlog:** v glavi vseh treh strani enaka vrstica povezav »Igra · Reševalec ·
  Trening« (trenutna označena). Po želji še `index.html` v korenu kot vstopna stran.
  Povezave so relativne (`../igra/`), zato delujejo z lokalnim strežnikom in s `file://`.
- **Obseg:** majhno (brez skupne glave), srednje (s 4.2).

### 4.4 Gumbi

- **Kje:** `app/app.css:176`, `igra/igra.css:90`, `trening/trening.css:178–195`.
- **Zdaj:** reševalec: padding 11 × 16 px, `.primary` ima vedno `flex:1`, pritisk
  `opacity:.85`, onemogočen gumb nima sloga. Igra: padding 10 × 14 px, `.primary` brez
  `flex`, `:disabled` s prosojnostjo 0,4, `.majhen`. Trening nima splošnega sloga gumba:
  `.pri-*` (barva tehnike), `.sm-btn`, `.back-btn`, `.peek-btn` (črtkan rob), gumbi
  števk.
- **Predlog:** osnovni `button`, `.primary`, `.majhen` in `:disabled` v `shared/base.css`
  (po vzoru igre). Trening obdrži barve tehnik kot različice `.primary`.
- **Obseg:** srednje.

### 4.5 Barva danosti in vpisov je v reševalcu obrnjena

- **Kje:** `app/app.css:247` (`.was-given`), `app/app.css:446` (`.mcell.given`),
  `igra/igra.css:281`, `trening/trening.css:92`.
- **Zdaj:** reševalec: dana števka je **modra** na modri podlagi (legenda »tvoj vnos«),
  izpeljana črna. Igra: dana števka je **črna** in krepka, moj vpis **moder**. Trening:
  dana (»fixed«) je siva. Kdor prehaja med reševalcem in igro, vidi modro enkrat kot
  »dano« in enkrat kot »moje«.
- **Predlog:** povsod dana = temna in krepka, izračunana ali vpisana = modra. V reševalcu
  se spremenita legenda (»dano« / »izpeljano«) in besedilo noge.
- **Obseg:** majhno.

### 4.6 Ločila in narekovaji

- **Kje:** besedila v vseh treh aplikacijah.
- **Zdaj:** reševalec uporablja vezaj z razmikom » - « in ravne narekovaje (»pritisni
  "Reši"«). Igra uporablja slovenske narekovaje »…«, pomišljaj pa enkrat » – «, drugič
  » - « (npr. `igra/igra.js:586` »Uganka je rešena - ni več korakov.« proti `:511`
  »… rešena – mreža je zaklenjena«). Trening uporablja pomišljaj.
- **Predlog:** povsod »…« in pomišljaj » – «.
- **Obseg:** majhno.

---

## 5. Navodila in pomoč

### 5.1 Tri različna besedila o tehnikah

- **Kje:** `trening/index.html` (opis na kartici), `shared/engine.js` (`TEHNIKE_OPISI` –
  besedilo vaje v treningu, okno Pomoč v igri), `docs/tehnike.md`.
- **Zdaj:** opis na kartici v treningu je samostojno besedilo, ki se od `razlaga` v
  `TEHNIKE_OPISI` razlikuje. Primeri:
  - Skrita para – kartica: »Najdi dve številki, ki se pojavljata samo v istih dveh
    celicah.«, `razlaga`: »Najdi 2 celici, ki skrivata par.«;
  - Swordfish – kartica: »Razširjen X-Wing: 3 vrstice × 3 stolpci.«, `razlaga`: »Najdi 3
    vrstice (ali stolpce), kjer se števka pojavi samo na istih 3 stolpcih.«

  Kartici Turbot Fish in W-Wing omenjata aplikacijo Oakever, `TEHNIKE_OPISI` in igra ne.
  Test `trening-tehnike.test.js` preverja samo naslov kartice, ne opisa.
- **Predlog:** v `TEHNIKE_OPISI` dodaj polje `povzetek` (ena poved za kartico) in ga v
  kartico vpiše `trening.js`, tako kot že številko. Ali pa kartica pokaže `razlaga`. Omembo
  Oakevra dodaj v `TEHNIKE_OPISI` (vidna tudi v igri) ali jo odstrani s kartic.
- **Obseg:** majhno.

### 5.2 Opis stopenj ugank v treh različicah

- **Kje:** `shared/generator.js:66–87` (`STOPNJE_UGANK[].opis` – namig miške na gumbu
  stopnje), `igra/index.html:186` (namig v oknu »Nova uganka«), `igra/index.html:166`
  (okno Pomoč).
- **Zdaj:** namig na gumbu opisuje **merilo generatorja** (`ustrezaIskanju`: srednja
  »vsaj dve različni tehniki«, težka in zelo težka »… in vsaj dve osnovni«). Besedilo v
  oknu »Nova uganka« in v Pomoči opisuje **pokrivajoče merilo** (`ustreza`: zelo težka »dve
  napredni tehniki ali pet različnih tehnik nad enojčki«). V oknu, kjer generator
  ustvarja uganko, je zato opisano merilo, ki ga generator ne uporablja (zelo težke s
  petimi osnovnimi tehnikami ne ustvari nikoli), namig na gumbu tik pod njim pa pove
  drugače. Besedilo v HTML je dvakrat skoraj enako.
- **Predlog:** oba opisa v `shared/generator.js` (`opis` = razvrščanje, `opisIskanja` =
  generator). HTML ju izpiše iz JS: okno »Nova uganka« opis generatorja, okno Pomoč oba
  in eno poved o razliki (»Oceni zbirko« razvršča širše kot generator). V opisih izraz
  »srednje« namesto »osnovne« (1.1) in imena tehnik po 1.3.
- **Obseg:** majhno.

### 5.3 Pomoč v igri o gumbu »Poglej«

Glej 2.3 – besedilo v `igra/index.html:165` ne velja po »Začni znova« pri rešeni uganki.
Popravi se skupaj z 2.3.

### 5.4 Imena tehnik v pomoči igre

Glej 1.3 – oznaka koraka pri »Naslednji korak« (»Hidden pair«) se ne ujema s seznamom
»Tehnike« v istem oknu (»2. Skrita para (Hidden Pair)«). Popravi se skupaj z 1.3.

### 5.5 Reševalec in trening nimata pomoči, besedila kažejo razvojne poti

- **Kje:** `app/index.html:20`, `:39`, `:89`, `igra/index.html:113`, `:164`, `:174`,
  `trening/index.html:14`.
- **Zdaj:**
  - reševalec ima samo opis v glavi, trening eno poved. Številke tehnik in značke v
    treningu niso razložene; trening ne pove, da iste številke kaže igra;
  - besedila za uporabnika kažejo razvojne podatke: »enaka oblika kot docs/uganke.md«
    (reševalec, zbirka), »reševalec (`app/`)«, »trening (`trening/`)«, »(`localStorage`)«
    (igra);
  - `app/index.html:39` »enako kot "hitri svinčnik" v aplikaciji« – ni jasno, v kateri
    aplikaciji (verjetno Oakever).
- **Predlog:** v besedilih imena aplikacij (»reševalec«, »trening«) s povezavami (4.3),
  brez poti in imen datotek. Reševalec in trening dobita kratko okno »Pomoč«, lahko s
  skupnim razdelkom »Tehnike« iz igre (izris že obstaja v `igra/igra.js:882`).
- **Obseg:** srednje.

### 5.6 Zastarela besedila v kodi in dokumentaciji

- **Kje in kaj:**
  - `shared/base.css:1` – »skupne osnove za obe Sudoku aplikaciji (reševalec in trening
    tehnik)«; `base.css` uporablja tudi igra;
  - `CLAUDE.md` – »`shared/` – skupna osnova za obe aplikaciji«, »`base.css` … ki ga
    uvozita `app/` in `trening/`«, »`app/` in `trening/` jo le kličeta«; aplikacije so tri;
  - `igra/igra.js:200` – komentar »ostane poudarjena samo zadnja izbrana števka (modra)«;
    prva barva poudarka je rumena (`--poud`);
  - `docs/tehnike.md` – stolpec »Slovensko ime« ima pri šestih tehnikah angleško ime
    (Naked pair, Hidden pair …), besedila uporabljajo »številka« (1.4). Dogovorjena imena
    in sopomenke so od 2026-09-23 v razdelku »Imena in sopomenke«; tabela in izraz
    »osnovne« se popravita ob 1.3 in 1.1, ko se spremeni koda.
- **Predlog:** popravi ob sklopu, ki se ga tiče (1.3, 1.4, 6.8), ali v enem commitu
  »dokumentacija«.
- **Obseg:** majhno.

---

## 6. Koda: podvojeno namesto v `shared/`

### 6.1 Izris kartice uganke v zbirki

- **Kje:** `app/zbirka.js:85–162` (`zbirkaIzrisiSeznam()`), `igra/igra.js:932–1042`
  (`infoUganke()`, `gumbiUganke()`, `vrsticaIgranja()`, `izrisiZbirko()`).
- **Zdaj:** dve implementaciji istega seznama z različnimi vrsticami (2.1), različnimi
  razredi CSS (`.lib-line`/`.lib-casi`/`.lib-info` proti `.zb-vrstica`/`.zb-casi`/`.zb-info`)
  in istimi slogi v dveh datotekah CSS.
- **Predlog:** `shared/zbirka-ui.js` s funkcijo, ki za zapis vrne element kartice, gumbe
  pa doda klicatelj. Slogi seznama v `shared/`.
- **Obseg:** srednje.
- **Narejeno 2026-09-24:** podatki kartice so v `shared/zbirka.js` (`zbirkaKartica()` – brez
  DOM-a, ker `zbirka.js` nalaga tudi `oceni-worker.js`), izris v `shared/zbirka-ui.js`
  (`zbirkaIzrisiKartico(k, { trenutna, gumbi })`), slogi v `shared/zbirka.css`. Razredi so
  povsod `.zbirka-seznam`/`.zb-*` (`.lib-line`, `.lib-casi`, `.lib-info`, `.lib-note` in
  `.lib-actions` so odstranjeni). Iz igre so odstranjeni `oznakaStanja`, `infoUganke`,
  `vrsticaIgranja`, `gumbiUganke` in `stanjeVSeznamu`.

### 6.2 Stanje igre se računa na treh mestih

- **Kje:** `shared/zbirka.js:98` (`zbirkaStanjeIgre()`), `igra/igra.js:915`
  (`zbirkaStatusIgre()`), `igra/igra.js:285` (`uskladiIgranje()`), `igra/igra.js:269`
  (`napacenVpis()`).
- **Zdaj:** štetje izpolnjenih celic iz potez je dvakrat (`zbirkaStatusIgre`,
  `uskladiIgranje`), tretjič iz stanja (`steviloVpisanih`). Preverjanje napačnega vpisa
  je trikrat (`napacenVpis`, `uskladiIgranje`, `zbirkaStatusIgre`). Iz tega izhaja 1.5.
- **Predlog:** v `igra/stanje.js` funkcija `povzetekIgre(danosti, zapisIgre, resitev)` →
  `{ izpolnjeno, vpisanih, napaka }`. Iz nje gredo `shraniIgranje`, `uskladiIgranje` in
  prikaz. Besedila stanja da samo `shared/zbirka.js` (1.5).
- **Obseg:** srednje (skupaj z 1.5).
- **Narejeno 2026-09-23** (skupaj z 1.6 in deli 1.5, 2.2, 2.3). Povzetek je v
  `shared/zbirka.js`, ne v `igra/stanje.js`, ker ga potrebuje tudi reševalec:
  `zbirkaPovzetekIgre(danosti, poteze, kazalec, resitev?)` →
  `{ zaceta, vpisanih, praznih, izpolnjeno, polna, napaka }` (edino štetje iz potez) in
  `zbirkaStanjeUganke(danosti, z, povzetek)` → `{ kljuc, napaka, napredek, besedilo, gumb,
  resena, … }` (edini vir napisa, gumba in izvoza). Skupaj z njima so se v `shared/` preselili
  `odigrajPotezo`/`odigrajPoteze`, `igreBeri`, `IGRA_KLJUC` in pravilo kazalca shranjene igre
  (`zbirkaKazalecZapisa`, uporablja ga tudi `igraIzZapisa`). Odstranjeni: `zbirkaStanjeIgre`,
  `zbirkaStatusIgre`, `zacetaIgra`, `napacenVpis`. Reševalec zdaj bere tudi `sudoku.igra.v1`
  (samo bere). Seznam prej ni upošteval pravila »vse razveljavljeno« in je kazal manj, kot se
  je odprlo – zdaj ga upošteva. Trening ni prizadet (ne pozna zbirke).

### 6.3 Trenutni čas

- **Kje:** `igra/stanje.js:194` (`igraZdaj()`), `shared/zbirka.js:78` (`zbirkaZdaj()`).
- **Zdaj:** funkciji sta enaki.
- **Predlog:** igra uporablja `zbirkaZdaj()` (ali preimenovano `zdaj()` v `shared/`).
- **Obseg:** majhno.

### 6.4 Vnosna mreža in preverjanje konfliktov

- **Kje:** `app/app.js:3–63` (`inputs`, `checkConflicts()`), `igra/igra.js:1493–1540`
  (`vnosi`, `oznaciKonflikte()`), `shared/zbirka.js:158` (`zbirkaBrezKonfliktov()`), CSS
  `#inputGrid` (`app/app.css`) in `.vnosna-mreza` (`igra/igra.css:741`).
- **Zdaj:** dve kopiji mreže 81 polj s premikanjem s puščicami, samodejnim skokom naprej
  in rdečim označevanjem ponovitev. Obnašanje se malo razlikuje (v igri Enter začne igro,
  v reševalcu ne; reševalec ima `given-style`). Tretja kopija preverjanja konfliktov je v
  zbirki, četrta v `Board`.
- **Predlog:** `shared/vnos.js`: `ustvariVnosnoMrezo(el, { obEnter })` in
  `konfliktneCelice(danosti)` (brez DOM-a, za zbirko in obe mreži). CSS vnosne mreže v
  `shared/`.
- **Obseg:** srednje.

### 6.5 Gumba »Izvozi« in »Uvozi«

- **Kje:** `app/zbirka.js:178–197`, `igra/igra.js:1071–1094`.
- **Zdaj:** skoraj enaka koda (izbira datoteke, `text()`, status, ponastavitev
  `value = ''`). Logika je že v `shared/zbirka.js`, podvojeno je samo vezanje na DOM.
- **Predlog:** `zbirkaPoveziIzvozUvoz({ izvozi, uvozi, datoteka, status, obSpremembi })` v
  `shared/zbirka.js` (poleg `zbirkaPrenesi()`, ki tudi potrebuje brskalnik).
- **Obseg:** majhno.

### 6.6 Sporočila o številu rešitev

- **Kje:** `igra/igra.js:1049` (`igrajIzZbirke`), `:1577` (vnos nove uganke), `:1120`
  (`opisResitev`), `app/app.js:403–411`.
- **Zdaj:** isti trije primeri (0 rešitev / več / »unknown«) so v igri trikrat z različnim
  besedilom, v reševalcu četrtič.
- **Predlog:** `opisSteviloResitev(n)` v `shared/engine.js` (poleg `countSolutions()`).
  Klicatelj doda samo začetek (»Te uganke ni mogoče igrati: …«).
- **Obseg:** majhno.

### 6.7 Sklanjanje po številu

- **Kje:** `shared/zbirka.js:148` (`zbirkaStKorakov`), `igra/igra.js:1112` (`stUgank`),
  `shared/engine.js:746` (`stepHint`, celice), `trening/trening.js:693` (števke).
- **Zdaj:** štiri lastne različice pravila ednina/dvojina/množina.
- **Predlog:** `sklanjaj(n, ['korak', 'koraka', 'koraki', 'korakov'])` v `shared/engine.js`.
- **Obseg:** majhno.

### 6.8 CSS

- **Kje:** `app/app.css`, `igra/igra.css`, `trening/trening.css`.
- **Zdaj:** podvojeni so `:root` z barvami (4.1), `header.top` in `.top-row`, `button`
  (4.4), `.card`, oznake korakov `.tag.t-*` (enake v reševalcu in igri), okno
  (`#library`/`.lib-panel` proti `.dialog`/`.dialog-panel` – isti videz), seznam zbirke
  (`.lib-*` proti `.zb-*`), vnosna mreža (6.4) in `footer.note`. `shared/base.css` ima samo
  reset in `body`.
- **Predlog:** v `shared/base.css` (ali `shared/theme.css` + `shared/components.css`):
  barve, glava, gumbi, kartica, okno, oznake korakov, seznam zbirke, vnosna mreža, noga,
  `[hidden]` (0.2). V datotekah aplikacij ostane samo, kar je njihovo (mreža igre, vaje
  treninga, koraki reševalca).
- **Obseg:** srednje.

### 6.9 Ime tehnike in opis na kartici

Glej 1.3 (`MODES[].name`) in 5.1 (opis na kartici v `trening/index.html`) – oboje je
kopija podatka, ki bi moral priti iz `TEHNIKE_OPISI`.

### 6.10 Nadomestna pot za Web Worker

- **Kje:** `igra/igra.js:1238` (`ocenjevanjeVGlavniNiti`), `igra/igra.js:1431`
  (`iskanjeVGlavniNiti`) in pripadajoča zagona delavca.
- **Zdaj:** isti vzorec (delavec → ob napaki glavna nit po en korak na `setTimeout`)
  dvakrat, oboje v igri.
- **Predlog:** pomožna funkcija v igri `zazeniDelavca(url, sporocilo, korakVGlavniNiti,
  obSporocilu)`. Nizka prednost – podvojitev je znotraj ene aplikacije.
- **Obseg:** majhno.

---

## 7. Opredelitve stopenj ugank (odločitev 2026-09-24)

**Samo zapis** – koda zanj še ni spremenjena. Razlike do današnje kode so naštete na koncu
razdelka in se odpravijo v posebni nalogi. Ločeno od te opredelitve je bil isti dan izveden
vrstni red tehnik znotraj ravni s preštevilčenjem 1–12 (1.1, `docs/tehnike.md`).

### 7.1 Ocena uganke

1. **Najprej število rešitev** (`countSolutions()`). Uganka brez natanko ene rešitve ne dobi
   stopnje, ampak eno od dveh oznak (namesto današnje »Drugo«):
   - **Brez rešitve** – 0 rešitev (danosti si nasprotujejo);
   - **Več rešitev** – dve ali več rešitev.
2. **Nato motor v stalnem vrstnem redu** (`ALL_TECHNIQUES`): uganko reši motor, ki vedno
   poskusi tehnike v istem vrstnem redu, od najlažje navzgor.
3. **Šteje se množica različnih uporabljenih tehnik**, ne število korakov: uganka, ki
   dvajsetkrat uporabi Izločitev izven bloka, ima eno srednjo tehniko.

### 7.2 Stopnja po najtežji uporabljeni ravni

| Stopnja | Pogoj (iz množice uporabljenih tehnik) |
|---|---|
| **Lahka** | samo enojčki |
| **Srednja** | najtežja raven so srednje tehnike (1–6) |
| **Težka** | natanko **ena** različna napredna tehnika (7–12) |
| **Zelo težka** | vsaj **dve** različni napredni tehniki |
| **Ekstrem** | ekspertna tehnika (13, XY-veriga – ko bo uvedena) |

Število srednjih tehnik stopnje ne spremeni: Težka ostane Težka, ne glede na to, koliko
srednjih tehnik uporabi.

### 7.3 Ugibanje ni tehnika

Poskus s protislovjem (`tryBifurcation`) ni tehnika in ni raven. Če ga motor potrebuje,
uganka ne dobi stopnje, ampak oznako **»Presega tehnike«**: z danimi tehnikami je ni mogoče
rešiti. Ekstrem od tu naprej pomeni ekspertno raven, ne ugibanja.

### 7.4 Pogoji generatorja (ločeni od stopnje)

Stopnja razvrsti **vsako** uganko (tudi uvoženo ali ročno vneseno). Generator pa izbira med
ugankami, ki stopnji ustrezajo, in dodatno zahteva, da je uganka za svojo stopnjo tipična.
Pogoji generatorja morajo biti zato **podmnožica** stopnje: ustvarjena uganka mora pri
oceni dobiti isto stopnjo.

| Stopnja | Pogoj generatorja poleg stopnje |
|---|---|
| Lahka | – (stopnja sama: samo enojčki) |
| Srednja | vsaj **2 različni srednji** tehniki |
| Težka | vsaj **2 različni srednji**, skupaj **največ 4 različne** tehnike nad enojčki |
| Zelo težka | vsaj **2 različni srednji** |
| Ekstrem | določi se ob uvedbi XY-verige |

**Spodnja meja (vsaj 2 srednji):** brez nje generator pogosto ponudi uganko, ki nad enojčki
stoji na eni sami tehniki. Meritev 2026-09-21 (`docs/tehnike.md`): med ugankami brez
napredne tehnike jih 61 % uporabi eno samo srednjo, med ugankami z eno napredno 35 %
nobene ali eno.

**Zakaj je pri Težki meja največ 4 različne tehnike nad enojčki.** Z eno napredno in vsaj
dvema srednjima to pomeni dve ali tri srednje tehnike.
- *Težavnost:* stopnja Težka po 7.2 nima zgornje meje števila srednjih tehnik. Uganka z eno
  napredno in štirimi ali več srednjimi pa od igralca zahteva pet ali več različnih
  vzorcev – več kot najmanjša Zelo težka uganka, ki jo ponudi generator (dve napredni in dve
  srednji, skupaj štiri). Generator take uganke kot Težke ne ponudi, da ustvarjena Težka
  ostane jasno pod Zelo težko.
- *Cena je majhna:* takih ugank je malo – med 660 naključnimi minimalnimi ugankami jih ima
  eno napredno in vsaj štiri srednje 10 (1,5 %; med ugankami z eno napredno 10 %), zato meja
  iskanja skoraj ne podaljša.
- *Skladnost:* današnji generator ima isto mejo, zato ustvarjene Težke uganke v zbirkah
  ustrezajo tudi novi opredelitvi.

### 7.5 Razlike do današnje kode (odpravijo se v naslednji nalogi)

- **Pravilo »5 ali več tehnik → Zelo težka«:** `STOPNJE_UGANK` (`shared/generator.js`) ima
  pri Zelo težki `napredne >= 2 || tehNad >= 5` in pri Težki zgornjo mejo `tehNad <= 4` tudi
  v merilu stopnje (`ustreza`), ne samo v generatorju. Po 7.2 je uganka z eno napredno in
  petimi ali več tehnikami Težka.
- **Ekstrem pomeni ugibanje:** danes dobi Ekstrem uganka, ki je `solve()` ne reši brez
  poskusa s protislovjem (in ročno vnesena uganka kot privzeto, `PRIVZETA_TEZAVNOST`). Po
  7.3 je to »Presega tehnike«, Ekstrem pa je ekspertna raven.
- **»Drugo«:** danes ena oznaka za 0 rešitev, več rešitev in neprepoznano vrednost iz uvoza.
  Po 7.1 »Brez rešitve« in »Več rešitev«; odprto ostane, kako označiti uganko, katere
  enoličnosti `countSolutions()` ni mogel preveriti (`'unknown'`), in neznano vrednost iz
  uvoza.
- **Vir množice tehnik:** danes `genRazvrsti()` – najkrajša predpona skupin
  `TECHNIQUE_GROUPS`, s katero pot uganko reši, in tehnike te poti. Dnevnik `solve()`
  (pokaže ga oznaka »tehnike: 1, 3, 7«) se lahko razlikuje, ker `solve()` sidra na števko.
  Po 7.1 je vir motor v stalnem vrstnem redu; odločiti je treba, ali je to pot z vsemi
  tehnikami brez sidranja (`genPot()` z `ALL_TECHNIQUES`) ali dnevnik `solve()`.
- **Imena v zbirki:** `TEZAVNOSTI` dobi »Presega tehnike«, »Več rešitev« in »Brez
  rešitve«; stari zapisi z »Ekstrem« (= ugibanje) in »Drugo« se morajo preslikati ali
  ponovno oceniti (»Oceni zbirko«).

---

## Odločitve, ki so tvoje

Vse odločitve so sprejete **2026-09-23**. Predlogi v navedenih točkah so jim prilagojeni.

1. **1.1 – ravni tehnik:** štiri ravni, poimenovane kot stopnje ugank: *lahke* (enojčki),
   *srednje* (1–6), *napredne* (7–12), *ekspertne* (XY-Chain in poznejše verige –
   zaenkrat prazno). Stopnja uganke izhaja iz najtežje ravni potrebnih tehnik (to je
   današnje pokrivajoče merilo, razvrstitev se ne spremeni). V treningu znački SREDNJA in
   NAPREDNA, EKSPERTNA pride z XY-Chain. V merilih stopenj izraz »osnovne« zamenja
   »srednje«. Odprto ostane, katera stopnja pripada uganki z ekspertno tehniko – odloči se
   ob uvedbi XY-Chain.
2. **1.3 – imena tehnik:** povsod slovensko, angleško v oklepaju: Očitni enojček (Naked
   Single), Skriti enojček (Hidden Single), 1 Izločitev izven bloka (Pointing
   Pair/Triple), 2 Izločitev v bloku (Box-Line Reduction), 3 Očitni par (Naked Pair),
   4 Skriti par (Hidden Pair), 5 Očitna trojica (Naked Triple), 6 Skrita trojica (Hidden
   Triple), 7 X-krilo (X-Wing), 8 Mečarica (Swordfish), 9 Veriga ene števke (Turbot Fish),
   10 W-krilo (W-Wing), 11 XY-krilo (XY-Wing, Y-Wing), 12 Edinstveni pravokotnik (Unique
   Rectangle). Sopomenke so v `docs/tehnike.md`. **Preštevilčeno 2026-09-24** (vrstni red
   znotraj ravni po zahtevnosti, 1.1): preseka sta 1 in 2, para 3 in 4.
3. **1.6 – napredek in stanja:** zapis »12/57« (57 = 81 − danosti, 12 = moji vpisi). Tri
   stanja: *nova* (brez poteze), *v teku* (od prve poteze, tudi če so bili samo
   odstranjeni kandidati, do rešitve), *rešena*. Napis stanja in gumb sledita istemu
   pogoju. **Popravek (isti dan):** »izpolnjena z napako« ne odpade – polna mreža z
   napako je poseben primer znotraj »v teku«, zapis »v teku (57/57) · napaka«, gumb
   »Nadaljuj«; napis in gumb iz istega vira, doda se samo podoznaka.
4. **2.5 – primeri:** vgrajeni primer, rešen v reševalcu, se shrani v zbirko z izvorom
   `primer`. **Spremenjeno 2026-09-24:** primeri niso del zbirke (nikoli se ne shranijo,
   ne štejejo se, stari zapisi se odstranijo); zbirka je v obeh aplikacijah ista, brisanje
   (»Izbriši«, »Izbriši vse«) je v obeh – razlog v 2.5. Uganke vnašaš kot niz 81 znakov s piko za prazno celico; pregled oblik in
   predlog (pika navzven, `0` v shrambi, ena pretvorba) je v 2.5. **Potrjeno:** uganke
   v shrambi (`sudoku.zbirka.v1`, `sudoku.igra.v1`) ostanejo z `0`. Dopolnitev primerov za
   vse stopnje in tehnike je ločena naloga (3), uganke samo z orodji v `tools/`.
5. **4.2 – podlaga:** povsod bela, kot v igri.

---

## Vrstni red popravkov

Najprej napake, nato podatki in besedila (od njih je odvisen prikaz), nato skupne
komponente, na koncu videz in pomoč.

| Faza | Točke | Zakaj v tem vrstnem redu | Obseg |
|---|---|---|---|
| **0 – napake** | 0.1, 0.2 | vidni napaki, popravek je nekaj vrstic, brez odločitev | majhno |
| **1 – stanje uganke** | 6.2, 6.3, 1.6, 1.5, 2.3 | pokrije opažanja 1–3; najprej en vir podatkov (6.2), nato števec »12/57« in tri stanja (1.6), besedila (1.5) in ponovno reševanje (2.3); na tem gradita fazi 2 in 3 | srednje |
| **2 – kartica zbirke** (narejeno 2026-09-24, z izvorom `primer` iz 2.5 in težavnostjo primerov iz 3; od 1.7 samo gumb »Odpri«) | 6.1, 2.1, 2.2, 2.4, 1.7 | ko so podatki enotni, se izris združi v eno funkcijo za obe aplikaciji in za primere | srednje |
| **3 – primeri in težavnost** | 3, 2.5, 1.2 | primeri dobijo težavnost s testom in obliko s piko, ročni vnos dobi pravo stopnjo; primeri niso del zbirke (odločitev spremenjena 2026-09-24, narejeno: ena zbirka, brisanje v obeh aplikacijah, dogodek `storage`) | majhno–srednje |
| **3a – dopolnitev primerov** (ločena naloga) | 3 | nove uganke z orodji v `tools/` za vse stopnje in tehnike; šele ko imajo primeri polje `tezavnost` in test iz faze 3 | srednje |
| **4 – imena tehnik in izrazi** | 1.3, 1.4, 1.1, 5.1, 5.2, 5.4, 6.9 | 1.3 in 1.4 v istem prehodu (sprememba spola »par« in »števka« zadeneta ista besedila); 1.1 za njima (raven v istih podatkih kot ime, preimenovanje »osnovne« → »srednje«); besedila so neodvisna od prikaza, a spremenijo veliko nizov in testov | srednje |
| **5 – videz** | 6.8, 4.1, 4.4, 4.2, 4.5, 4.6, 4.3 | najprej skupni CSS (6.8), nato poenotenje nad njim (bela podlaga je v 6.8 lahko kar privzeta); navigacija na koncu, ko je glava skupna | srednje |
| **6 – pomoč** | 5.3, 5.5, 5.6 | besedila pomoči opisujejo končno stanje, zato zadnja | majhno–srednje |
| **7 – ostala koda** | 6.4, 6.5, 6.6, 6.7, 6.10 | čiščenje brez vidne spremembe; lahko kadarkoli vmes (6.4 prinese polje »Niz« v reševalec, 2.5) | majhno–srednje |

Faze 1–3 odpravijo vsa štiri opažanja iz igre. Fazi 4 in 5 sta največji po številu
spremenjenih datotek, ne po tveganju: logika tehnik in reševanja se v nobeni ne spremeni.

**Vpliv odločitev 2026-09-23 na vrstni red:** zaporedje faz ostane. Spremembe:

- v fazi 1 gre 6.2 na začetek – pogoj »napis in gumb iz istega vira« (1.6) je izveden
  šele, ko je en vir; 1.6 zdaj obsega tudi izvoz/uvoz nove oblike »12/57« in podoznako
  »· napaka« namesto posebnega stanja »izpolnjena z napako«;
- faza 3 dobi pretvorbo oblike danosti in izvor `primer`; oboje je odvisno od kartice iz
  faze 2 (primer samo enkrat);
- dopolnitev primerov je nova ločena naloga 3a za fazo 3;
- v fazi 4 je jasen notranji vrstni red (1.3 + 1.4, nato 1.1); ker so imena in ravni
  določeni, faza 4 in 5 nista več odvisni od odločitev. Edino odprto vprašanje (stopnja
  uganke z ekspertno tehniko) ne zadeva nobene faze – pride z XY-Chain.
