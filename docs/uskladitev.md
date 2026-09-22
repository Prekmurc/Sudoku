# Uskladitev reševalca, treninga in igre – popis neskladij

Popis razlik med aplikacijami `app/` (reševalec), `trening/` (trening tehnik) in `igra/`
(igra), ki so nastajale ločeno. **Samo analiza** – koda ni spremenjena. Stanje kode: commit
`4a0efc7` (2026-09-23).

Pri vsaki točki: **Kje** (datoteka, aplikacija), **Zdaj** (kako je v posamezni aplikaciji),
**Predlog** (enotna rešitev) in **Obseg**:

- **majhno** – ena datoteka ali nekaj vrstic, brez sprememb testov ali z enim testom,
- **srednje** – več datotek ali nova skupna funkcija v `shared/`, popravki testov,
- **veliko** – preoblikovanje prikaza ali podatkov v več aplikacijah.

Oznake točk (npr. 1.5) uporablja razdelek »Vrstni red popravkov« na koncu.

---

## 0. Napake, najdene med popisom

Niso neskladja, vendar jih je vredno popraviti najprej, ker so vidne pri uporabi.

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
- **Predlog:** v `shared/engine.js` ena delitev tehnik na tri razrede: *enojčki*,
  *osnovne* (1–6) in *napredne* (7–12) – na njej že sloni generator. Iz nje:
  - v treningu značka OSNOVNA / NAPREDNA (ali ohranjene štiri oznake, a X-Wing in
    Swordfish med napredne),
  - `tagClass()` z isto delitvijo in istimi barvami kot značke,
  - v pomoči igre ena poved: »tehnike 1–6 so osnovne, 7–12 napredne«.

  `TECHNIQUE_GROUPS` ostane (sidranje potrebuje finejšo delitev), vendar notranje.
- **Obseg:** srednje (trening, CSS obeh aplikacij, test `trening-tehnike.test.js`).

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
- **Predlog:** `ALL_TECHNIQUES` ostane notranji ključ (dnevnik, izvoz, testi). Za prikaz
  uvedi v `shared/engine.js` funkcijo `imeTehnike(kljuc)`, ki vrne »2 · Skrita para«
  (številka iz `TRENING_TEHNIKE` + kratko slovensko ime). V `TEHNIKE_OPISI` dodaj polje
  `kratko` ter vnose za enojčka in poskus s protislovjem. Iz te funkcije berejo oznaka
  koraka (reševalec, igra), povzetek v reševalcu (»3x Naked pair«) in `MODES.name`.
  Slovensko ime za Pointing/Box-line je tvoja odločitev.
- **Obseg:** srednje (engine, reševalec, igra, trening, testi, ki primerjajo oznake).

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
  za vsa mesta (seznam, primeri, kartica »Uganka«, izvoz). Povsod ženski spol (»nova«,
  »v teku«, »rešena«, »izpolnjena z napako«) in ena oblika števca »N od 81«. Programovi
  podatki povsod v obliki izvoza. `zbirkaStatusIgre()` v igri se odstrani (glej 6.2).
- **Obseg:** srednje (igra, reševalec, testi `igra-ui` in `zbirka-zapis`).

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
- **Predlog:** za prikaz štej samo moje vpise glede na prazne celice: »v teku (vpisanih 0
  od 57)« ali »v teku (0 / 57)«. Polje `izpolnjeno` ostane, ker iz njega izhajata »rešena«
  (81) in izvoz – prikaz odšteje danosti. Uganka brez vpisa, a s potezami (samo
  kandidati), naj ima besedilo »v teku (samo kandidati)« ali ostane »nova« (tvoja
  odločitev). Izvoz `**Stanje:** v teku (45 od 81)` naj ostane berljiv za uvoz.
- **Obseg:** majhno do srednje (odvisno od izvoza).

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

### 2.2 Vgrajeni primeri so prikazani drugače kot uganke iz zbirke (opažanje 1)

- **Kje:** `igra/igra.js:932` (`infoUganke()`), `igra/igra.js:962` (`izrisiPrimere()`).
- **Zdaj:** primer nima zapisa v zbirki, zato igra stanje izračuna iz shranjene igre z
  `zbirkaStatusIgre()` in ga izpiše v vrstici z danostmi (»danih: 19 · v teku: 19/81«,
  »rešeno ✓«, »nova«). Zbirka ima vrstico s časom in stanjem (»v teku (24 od 81)«,
  »rešena 21. 9. …«), pri novi uganki pa nič. Primer tudi nima težavnosti, tehnik in
  časa zadnjega reševanja, čeprav je čas v shranjeni igri (`nazadnje`).
- **Predlog:** primer prikaži z isto kartico kot uganko iz zbirke (2.1). Podatke sestavi
  iz shranjene igre (`igrano` = `zapis.nazadnje`, izpolnjeno/napaka iz potez), težavnost
  in tehnike pa iz `PRIMERI` (glej 3). Pri novi uganki naj oba seznama kažeta isto: ali
  obe »nova« ali obe nič.
- **Obseg:** srednje (skupaj z 1.5 in 6.1).

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
  »rešena 21. 9. 2026 ob 17:48 · znova v teku (vpisanih 12 od 57)«. Enako v kartici
  »Uganka«. Gumb »Nadaljuj« je potem razumljiv. Pomoč v igri dopolni.
- **Obseg:** srednje (igra, test `igra-ui.test.js`, ki preverja ponovno reševanje).

### 2.4 Oblika časa

- **Kje:** `shared/zbirka.js:87` (`zbirkaPrikazDatuma()`), `shared/zbirka.js:137`
  (`zbirkaNamigCasov()`).
- **Zdaj:** seznam in kartica »Uganka« kažeta »21. 9. 2026 ob 16:33«, namig miške nad
  isto vrstico pa »Dodano: 2026-09-21 16:33 · … · Ocenjeno: 2026-09-22 10:05«. Izvoz ima
  obliko `2026-09-21 16:33` (namerno, zaradi uvoza).
- **Predlog:** namig miške v isti obliki kot seznam (`zbirkaPrikazDatuma()`), izvoz ostane
  nespremenjen.
- **Obseg:** majhno.

### 2.5 Reševalec shrani vgrajeni primer v zbirko, igra ne

- **Kje:** `app/zbirka.js:45` (`zbirkaPoResevanju()`), `igra/index.html:165`
  (»Vgrajeni primeri se v zbirko ne dodajo«).
- **Zdaj:** primer, izbran v reševalcu (»Primer«) in rešen z »Reši«, se shrani v zbirko
  z izvorom »ročni vnos« in s težavnostjo »Ekstrem«. V igri je nato isti primer dvakrat:
  pod »Vgrajeni primeri« in pod »Tvoja zbirka«. Napredek si delita (iste danosti), prikaz
  pa je različen (2.2).
- **Predlog:** reševalec uganke, ki je v `PRIMERI`, v zbirko ne shrani (enako pravilo kot
  igra). Ali pa dobi izvor `primer` in se v igri pokaže samo enkrat – tvoja odločitev.
- **Obseg:** majhno.

### 2.6 Vrstica »Zapiši ocene (0)«

Glej 0.2 (vzrok je CSS, ne logika).

---

## 3. Vgrajeni primeri

- **Kje:** `shared/zbirka.js:68` (`PRIMERI`), `app/app.js:285` (spustni seznam »Primer«),
  `igra/igra.js:962` (razdelek »Vgrajeni primeri«), `docs/uganke.md` (vir).
- **Zdaj:** stopnja je zapisana v imenu primera, ročno in po starih merilih. Ocena
  `oceniUganko()` na današnji kodi (izmerjeno 2026-09-23):

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
  - v igri naj kartica primera kaže težavnost in tehnike enako kot uganka iz zbirke (2.2).
- **Obseg:** majhno (brez 2.2), srednje (z 2.2).

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

- **Predlog:** ena podlaga (bela kot v igri ali siva – tvoja odločitev), ista glava
  (nadnaslov, naslov, gumbi desno), ista noga in iste mere kartic v `shared/`. Širina
  ostane po aplikaciji (igra potrebuje dva stolpca).
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
  in eno poved o razliki (»Oceni zbirko« razvršča širše kot generator).
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
    (Naked pair, Hidden pair …), besedila uporabljajo »številka« (1.4).
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

## Odločitve, ki so tvoje

Pri teh točkah je več smiselnih rešitev. Pred popravkom potrebujem tvojo izbiro:

1. **1.1** – značke v treningu: dve (osnovna/napredna) ali štiri s popravljeno razdelitvijo?
2. **1.3** – slovensko ime za Pointing pair/triple in Box-line reduction (ali ostaneta
   angleški)?
3. **1.6** – kako prikazati napredek (»vpisanih 12 od 57«, »12 / 57«, odstotek) in ali
   uganka s samimi odstranjenimi kandidati velja za »v teku« ali za »nova«?
4. **2.5** – vgrajeni primer, rešen v reševalcu: ne shrani ga ali ga shrani z izvorom
   `primer`?
5. **4.2** – skupna podlaga strani: bela (igra) ali siva z mrežnim vzorcem (reševalec)?

---

## Vrstni red popravkov

Najprej napake, nato podatki in besedila (od njih je odvisen prikaz), nato skupne
komponente, na koncu videz in pomoč.

| Faza | Točke | Zakaj v tem vrstnem redu | Obseg |
|---|---|---|---|
| **0 – napake** | 0.1, 0.2 | vidni napaki, popravek je nekaj vrstic, brez odločitev | majhno |
| **1 – stanje uganke** | 1.5, 1.6, 2.3, 6.2, 6.3 | pokrije opažanja 1–3; določi enotna besedila in en vir podatkov, na katerem gradita 2 in 3 | srednje |
| **2 – kartica zbirke** | 6.1, 2.1, 2.2, 2.4, 1.7 | ko so podatki enotni, se izris združi v eno funkcijo za obe aplikaciji in za primere | srednje |
| **3 – primeri in težavnost** | 3, 2.5, 1.2 | primeri dobijo težavnost s testom, ročni vnos dobi pravo stopnjo; uporablja kartico iz faze 2 | majhno–srednje |
| **4 – imena tehnik in izrazi** | 1.3, 1.4, 1.1, 5.1, 5.2, 5.4, 6.9 | besedila so neodvisna od prikaza, a spremenijo veliko nizov in testov – bolje v enem sklopu | srednje |
| **5 – videz** | 6.8, 4.1, 4.4, 4.2, 4.5, 4.6, 4.3 | najprej skupni CSS (6.8), nato poenotenje nad njim; navigacija na koncu, ko je glava skupna | srednje |
| **6 – pomoč** | 5.3, 5.5, 5.6 | besedila pomoči opisujejo končno stanje, zato zadnja | majhno–srednje |
| **7 – ostala koda** | 6.4, 6.5, 6.6, 6.7, 6.10 | čiščenje brez vidne spremembe; lahko kadarkoli vmes | majhno–srednje |

Faze 1–3 odpravijo vsa štiri opažanja iz igre. Fazi 4 in 5 sta največji po številu
spremenjenih datotek, ne po tveganju: logika tehnik in reševanja se v nobeni ne spremeni.
