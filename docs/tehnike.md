# Tehnike reševanja (ALL_TECHNIQUES)

Tabela vseh tehnik iz `ALL_TECHNIQUES` v [shared/engine.js](../shared/engine.js), v vrstnem redu uporabe pri reševanju: po ravneh (enojčki, srednje, napredne), znotraj ravni pa po zahtevnosti (razdelek »Vrstni red znotraj ravni« spodaj). Isti vrstni red imajo številke tehnik v treningu in pri ugankah. Stolpec »Vaja v treningu« pove, ali za tehniko obstaja vadbena vaja v `MODES` v [trening/generators.js](../trening/generators.js).

| Ime v kodi | Slovensko ime | Kaj počne | Vaja v treningu |
|---|---|---|---|
| `nakedSingles` | Gol enojček | Poišče celico, ki ima samo še enega možnega kandidata, in vanjo vpiše to številko. | ne |
| `hiddenSingles` | Skriti enojček | Poišče enoto, kjer je določena številka možna samo še v eni celici, in jo tja vpiše. | ne |
| `pointing` | Pointing pair/triple | Če je kandidat v bloku možen samo v celicah ene same vrstice ali stolpca, ga izbriše iz preostanka te vrstice/stolpca zunaj bloka. | da |
| `boxLineReduction` | Box-line reduction | Če je kandidat v vrstici ali stolpcu možen samo znotraj enega bloka, ga izbriše iz preostanka tega bloka. | da |
| `nakedPairs` | Naked pair | Poišče dve celici v isti enoti, ki imata skupaj natanko dva kandidata, in ju izbriše iz preostalih celic enote. | da |
| `hiddenPairs` | Hidden pair | Poišče dve številki, ki sta v enoti možni samo v istih dveh celicah, in izbriše vse druge kandidate iz teh dveh celic. | da |
| `nakedTriples` | Naked triple | Poišče tri celice v isti enoti, ki skupaj pokrivajo natanko tri kandidate, in te kandidate izbriše iz preostanka enote. | da |
| `hiddenTriples` | Hidden triple | Poišče tri številke, ki so v enoti možne samo v istih treh celicah, in izbriše vse druge kandidate iz teh celic. | da |
| `xWing` | X-Wing | Poišče kandidata, ki je v dveh vrsticah (ali stolpcih) možen na istih dveh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `swordfish` | Swordfish | Poišče kandidata, ki je v treh vrsticah (ali stolpcih) možen na istih treh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `turbotFish` | Turbot Fish | Poišče dve močni povezavi za isto številko (vrstica ali stolpec, kjer je številka mogoča v natanko dveh celicah), katerih konca se vidita. Vsaj eden od drugih dveh koncev je potem ta številka, zato jo izbriše iz celic, ki vidijo oba. Podtipa: Skyscraper (vzporedni povezavi) in Zmaj z dvema vrvicama / Two-String Kite (vrstica + stolpec, konca v istem bloku); podtip je naveden v sporočilu. Močne povezave v bloku niso vključene. | da |
| `wWing` | W-Wing (Krilo W) | Poišče dve celici z natanko istim parom kandidatov {a,b}, ki se med sabo ne vidita, in enoto, kjer je b mogoč samo v dveh celicah (močna povezava), od katerih ena vidi prvo, druga pa drugo celico para. Vsaj ena celica para je potem a, zato a izbriše iz celic, ki vidijo obe. V aplikaciji Oakever se tehnika imenuje »Krilo W«. | da |
| `xyWing` | XY-Wing | Poišče pivota z dvema kandidatoma in dve krili, ki si delita skupnega kandidata, ter ga izbriše iz celic, ki vidijo obe krili. | da |
| `uniqueRectangle` | Unique Rectangle | Prepreči smrtonosni vzorec (situacijo z dvema možnima rešitvama) tako, da iz četrte celice pravokotnika izbriše kandidata, ki bi dvoumnost povzročil. | da |

## Imena in sopomenke (odločitev 2026-09-23)

Dogovorjena imena za prikaz: slovensko ime, angleško v oklepaju (`docs/uskladitev.md`,
točka 1.3). Koda in zgornja tabela še uporabljata stara imena – popravita se ob izvedbi 1.3.
Številke so od 2026-09-24 po vrstnem redu znotraj ravni (razdelek spodaj).
Ravni so iz točke 1.1: *lahke*, *srednje* (1–6), *napredne* (7–12), *ekspertne* (XY-Chain
in poznejše verige, zaenkrat prazno).

Enojčka imata od 2026-09-24 v treningu vaji z oznakama **E1** in **E2** namesto številke
(`TRENING_ENOJCKA` in `oznakaTehnike()` v `shared/engine.js`), zato se številke 1–12 niso
spremenile; oznaki sta tudi v seznamu tehnik v oknu Pomoč v igri. Pri ugankah se enojčki
ne izpisujejo (»tehnike: 1, 3, 7«), ker jih potrebuje vsaka uganka.

| Št. | Raven | Ime za prikaz | Ključ v `ALL_TECHNIQUES` | Sopomenke in stara imena |
|---|---|---|---|---|
| E1 | lahke | Očitni enojček (Naked Single) | Gol enojček | gol enojček, Sole Candidate |
| E2 | lahke | Skriti enojček (Hidden Single) | Skriti enojček | – |
| 1 | srednje | Izločitev izven bloka (Pointing Pair/Triple) | Pointing pair/triple | Locked Candidates Type 1 (Pointing), presek |
| 2 | srednje | Izločitev v bloku (Box-Line Reduction) | Box-line reduction | Locked Candidates Type 2 (Claiming), presek |
| 3 | srednje | Očitni par (Naked Pair) | Naked pair | očitna para |
| 4 | srednje | Skriti par (Hidden Pair) | Hidden pair | skrita para |
| 5 | srednje | Očitna trojica (Naked Triple) | Naked triple | – |
| 6 | srednje | Skrita trojica (Hidden Triple) | Hidden triple | – |
| 7 | napredne | X-krilo (X-Wing) | X-Wing | – |
| 8 | napredne | Mečarica (Swordfish) | Swordfish | tehnika mečarice |
| 9 | napredne | Veriga ene števke (Turbot Fish) | Turbot Fish | podtipa Skyscraper in Zmaj z dvema vrvicama (2-String Kite) |
| 10 | napredne | W-krilo (W-Wing) | W-Wing | Krilo W (aplikacija Oakever) |
| 11 | napredne | XY-krilo (XY-Wing, Y-Wing) | XY-Wing | – |
| 12 | napredne | Edinstveni pravokotnik (Unique Rectangle) | Unique Rectangle | Unique Rectangle Type 1 (motor pozna samo ta tip); nadpojem: smrtonosni vzorec (Deadly Pattern) |
| – | – | Poskus in protislovje | (sestopanje, `tryBifurcation`) | ugibanje; ni tehnika s številko, ime ostane |

»Presek« je skupno ime tehnik 1 in 2 v opisih stopenj ugank in komentarjih (`shared/generator.js`, `GEN_PRESEKI`).

Angleške sopomenke pri enojčku in presekih so preverjene 2026-09-23 v uveljavljenih virih:
»Sole Candidate« je v Sudopedii (stran Naked Single: »Alternative terms are Forced Digit and
Sole Candidate«), »Locked Candidates Type 1 (Pointing)« in »Type 2 (Claiming)« sta v
Sudopedii (stran Locked Candidates, kjer je Type 2 tudi »Box-Line Reduction«) in v HoDoKu
(stran Intersections). »Unique Candidate« pri skritem enojčku je odstranjen, ker ga
uveljavljeni viri ne navajajo (Sudopedia ima za skriti enojček samo »Pinned Digit«).

Preostale angleške sopomenke, preverjene 2026-09-23:

- **2-String Kite** – potrjeno. HoDoKu (stran Single Digit Patterns): »A 2-String Kite is a
  second special form of Turbot Fish«; Sudopedia ima stran »2-String Kite«, na strani
  Turbot Fish pa »This pattern is also known as 2-String Kite«. Viri pišejo »2-String«,
  izpisane oblike »Two-String Kite« v njih nisem našel, zato je v tabeli »2-String Kite«.
- **Y-Wing** – potrjeno. SudokuWiki opisuje isto tehniko (pivot z dvema kandidatoma in dve
  krili) pod imenom »Y-Wing« (stran Y-Wing Strategy); LiveSudoku ima naslov »XY-Wing
  (Y-Wing) Sudoku Strategy«. Sudopedia in HoDoKu uporabljata samo »XY-Wing«.
- **Unique Rectangle Type 1** – potrjeno. HoDoKu (stran o Unique Rectangles) ima naslov »Unique
  Rectangle Type 1«. To je tip, ki ga izvaja `uniqueRectangle()` (trije vogali z istim
  parom, iz četrtega se izbrišeta števki para), zato je podtip, ne splošna sopomenka.
- **Deadly Pattern** – potrjen kot izraz, **ne kot sopomenka**. Sudopedia: »A Unique
  Rectangle is a Deadly Pattern formed by 4 cells«. Smrtonosni vzorec je torej širši pojem,
  pravokotnik pa ena njegova oblika; v tabeli je označen kot nadpojem.
- **Bifurcation** – odstranjeno. Sudopedia: »A limited form of Trial & Error where only
  constraints with 2 remaining candidates are considered« (preizkusita se obe veji). Poskus
  in protislovje (`tryBifurcation`) postavi katerokoli števko v katerokoli prazno celico in
  išče z vračanjem, zato ni bifurkacija v tem pomenu.
- **forcing chain** – odstranjeno. Sudopedia: »Forcing Chain is the generic term for all
  types of chains and loops which propagate implications from one cell or candidate to
  another«. Poskus in protislovje ne sledi verigi posledic, ampak preišče vse možnosti z
  vračanjem (`hasSolution()`).

Obe imeni sta še v kodi – funkcija `tryBifurcation` in ključ tehnike »Poskus in protislovje
(forcing chain)« v `shared/engine.js`. Po zgornjih virih je to Trial & Error (poskus in
napaka); preimenovanje je sprememba kode in ni del te odločitve.

## Vrstni red znotraj ravni (odločitev 2026-09-24)

Meje ravni so dogovorjene (`docs/uskladitev.md`, 1.1): enojčki, srednje 1–6, napredne
7–12, ekspertne od 13 naprej (XY-veriga, pozneje). Znotraj ravni velja vrstni red po
zahtevnosti, in to **povsod enako**: motor (`ALL_TECHNIQUES`, s tem `solve()` in »Naslednji
korak« v igri), številke v treningu in pri ugankah (`TRENING_TEHNIKE`, ki mora biti
`ALL_TECHNIQUES` brez enojčkov – preverja `tests/trening-tehnike.test.js`).

| Št. | Tehnika | Sudoku Explainer | HoDoKu (točke) |
|---|---|---|---|
| 1 | Izločitev izven bloka (Pointing) | 2,6 | 50 |
| 2 | Izločitev v bloku (Claiming, Box-Line Reduction) | 2,8 | 50 |
| 3 | Očitni par (Naked Pair) | 3,0 | 60 |
| 4 | Skriti par (Hidden Pair) | 3,4 | 70 |
| 5 | Očitna trojica (Naked Triple) | 3,6 | 80 |
| 6 | Skrita trojica (Hidden Triple) | 4,0 | 100 |
| 7 | X-krilo (X-Wing) | 3,2 | 140 |
| 8 | Mečarica (Swordfish) | 3,8 | 150 |
| 9 | Veriga ene števke (Turbot Fish): Skyscraper / 2-String Kite | – | 130 / 150 |
| 10 | W-krilo (W-Wing) | – | 150 |
| 11 | XY-krilo (XY-Wing) | 4,2 | 160 |
| 12 | Edinstveni pravokotnik (Unique Rectangle) | 4,5–5,0 | 100 (Type 1) |

- **Srednje (1–6) in X-krilo, Mečarica, XY-krilo, Edinstveni pravokotnik:** po Sudoku
  Explainerju (SE). Vir: [Difficulty ratings in Sudoku Explainer
  v1.2.1](https://github.com/SudokuMonster/SukakuExplainer/wiki/Difficulty-ratings-in-Sudoku-Explainer-v1.2.1).
  SE je X-krilo (3,2) ocenil nižje od skritega para, a raven je določena posebej – napredne
  so vse za srednjimi.
- **Turbot Fish in W-krilo** SE ne ocenjuje (najde ju kot verige, ki niso primerljive), zato
  njuno mesto določajo točke HoDoKu. Vir: tabela korakov `Options.solverSteps[]` v HoDoKu
  (`Options.java`), prepisana v [hodoku-py, `src/hodoku/core/scoring.py`](https://github.com/alexdej/hodoku-py);
  opis vzorcev na [HoDoKu: Single Digit Patterns](https://hodoku.sourceforge.net/en/tech_sdp.php).
  X-Wing 140, Swordfish 150, XY-Wing 160 so v istem vrstnem redu kot v SE, zato sta lestvici
  tu združljivi.
- **Pravilo za Turbot Fish:** naš Turbot Fish najde dva podtipa, Skyscraper (130) in
  2-String Kite (150). Tehnika dobi točke **težjega podtipa, ki ga motor izvaja** (150).
  Druga možnost (lažji podtip, 130) bi jo postavila pred X-krilo.
- **Izenačenja pri 150** (Mečarica, Turbot Fish, W-krilo) odloči vrstni red, v katerem jih
  HoDoKu preizkuša (indeks v isti tabeli): Swordfish 2300, Skyscraper 3000, 2-String Kite
  3100, W-Wing 3200.
- **Edinstveni pravokotnik** ima v HoDoKu le 100 točk (manj od vseh naprednih), v SE pa
  4,5–5,0. Velja SE: ostane zadnji, ker sklepa iz predpostavke, da ima uganka eno rešitev.
- **Enojčka** ostaneta v vrstnem redu gol → skriti: SE ima skriti enojček za lažjega
  (1,2–1,5 proti 2,3), HoDoKu obratno (14 proti 4), številk nimata, zamenjava pa bi
  spremenila skoraj vsak korak v dnevnikih.

Prej (do 2026-09-24): motor je imel Naked pair pred preseki in Turbot Fish pred Swordfish,
trening pa svoj vrstni red kartic (1 očitna para, 2 skrita para, 3 pointing, 4 box-line,
5–6 trojici, 7 X-Wing, 8 Swordfish, 9 Turbot Fish …). Številke 7–12 so ostale enake,
1–4 so se spremenile. Številk ne hrani nobena shramba (zbirka in izvoz imata imena
tehnik), zato stari izvozi po uvozu kažejo nove številke. Vpliv na težavnost: testne
uganke in vgrajeni primeri enako, na 300 naključnih minimalnih ugankah ena sprememba
(Težka → Zelo težka, `docs/uganke.md`).

## Stopnje ugank: najmanjše število različnih tehnik (meritev 2026-09-21)

**Opredelitev stopenj od 2026-09-24** ([uskladitev.md](uskladitev.md), razdelek 7): stopnja je
raven najtežje tehnike, ki jo uporabi motor v stalnem vrstnem redu (`genPot()` z vsemi
tehnikami), šteje se množica različnih tehnik. Lahka = samo enojčki, Srednja = najtežje so
srednje (1–6), Težka = natanko ena napredna (7–12), Zelo težka = vsaj dve napredni, Ekstrem =
ekspertna tehnika (13, XY-veriga – še ni v motorju). Uganka, pri kateri motor obtiči, dobi
»Presega tehnike«, uganka brez rešitve »Brez rešitve«, uganka z več rešitvami »Več rešitev«. Pravila
»pet ali več tehnik → Zelo težka« ni več; meja štirih tehnik pri Težki velja samo za
generator. Pogoji generatorja (spodaj) so ostali enaki. Tabela spodaj je zapis meritve
2026-09-21; stolpca »Delež« in »Čas iskanja« sta iz nje, vrstica Ekstrem je danes »Presega
tehnike«. Časi iskanja po spremembi (2026-09-24, 30 iskanj na stopnjo, Node 24): lahka 0,23 s,
srednja 0,81 s, težka 1,00 s, zelo težka 1,92 s (povprečje; največ 9,7 s pri zelo težki).

Številke tehnik so iz `TRENING_TEHNIKE` v [shared/engine.js](../shared/engine.js) (od
2026-09-24): **1** pointing, **2** box-line, **3** očitna para, **4** skrita para, **5** očitna
trojica, **6** skrita trojica, **7** X-Wing, **8** Swordfish, **9** Turbot Fish, **10** W-Wing,
**11** XY-Wing, **12** Unique Rectangle. Meritev spodaj je iz 2026-09-21 (star vrstni red
motorja); obsegi 1–6 in 7–12 so isti. Enojčka (gol in skriti) sta vključena
pri vseh stopnjah in se ne štejeta. »Osnovne« so tehnike 1–6, »napredne« 7–12; šteje se število
**različnih** tehnik, ki jih uporabi pot iz `genRazvrsti()` v [shared/generator.js](../shared/generator.js).

Prejšnja merila so imela samo zgornjo mejo (»največ ena napredna«), zato je generator pogosto
dal uganko, ki nad enojčki zahteva eno samo tehniko: med ne-lahkimi ugankami brez napredne
tehnike jih 61 % uporabi le eno osnovno, med ugankami z eno napredno pa jih 35 % nima ob sebi
več kot eno osnovno. Spodnja meja to odpravi.

| Stopnja | Tehnike | Najmanj različnih tehnik | Delež naključnih ugank | Čas iskanja |
|---|---|---|---|---|
| Lahka | enojčki | 0 – reši se samo z enojčki, brez zapisanih kandidatov | 54,2 % | 0,3 s |
| Srednja | 1–6 | **≥ 2** iz 1–6, nobene napredne | 9,1 % | 1,3 s |
| Težka | 1–6 + ena iz 7–12 | **≥ 2** iz 1–6 + **natanko 1** iz 7–12, skupaj ≤ 4 | 8,0 % | 2,1 s |
| Zelo težka | 1–12 | **≥ 2** iz 1–6 + **≥ 2** iz 7–12 | 5,9 % | 2,1 s |
| Presega tehnike (prej Ekstrem) | vse + poskus | motor uganke brez ugibanja ne reši | 21,4 % vseh izkopanih | – |
| Ekstrem (od 2026-09-24) | ekspertne (13) | vsaj ena ekspertna tehnika – generator je ne ponuja | – | – |

Minimum velja **samo za iskanje v generatorju** (kaj gumb »Ustvari uganko« ustvari), ne za
razvrščanje že znanih ugank: `oceniUganko()` (gumb »Oceni zbirko« v igri) mora ostati pokrivajoč,
sicer bi uganka z eno samo tehniko nad enojčki dobila oznako Ekstrem, čeprav se reši brez
ugibanja – takih je 21 % ugank, ki jih `solve()` reši brez poskusa. V
[shared/generator.js](../shared/generator.js) sta to dve merili vsake stopnje v
`STOPNJE_UGANK`: `ustreza` (pokrivajoče, zanj gre `oceniUganko`) in `ustrezaIskanju`
(s spodnjo mejo, zanj gre `oceniStopnjo` oziroma `ustvariUganko`).

Merilo iskanja mora biti **podmnožica** pokrivajočega, sicer bi ustvarjena uganka pri
»Oceni zbirko« dobila drugo težavnost, kot jo ima v zbirki. To preverja
`tests/generator.test.js`. Od 2026-09-24 je meja največ štirih tehnik nad enojčki pri Težki
samo pogoj generatorja (`GEN_TEZKA_NAJVEC`): uganka z eno napredno in štirimi ali več
srednjimi je po stopnji Težka, generator pa je ne ponudi, da ustvarjena Težka ostane jasno
pod Zelo težko. (Do 2026-09-24 je bila meja tudi v pokrivajočem merilu, tako uganko pa je
razvrstilo pravilo »pet ali več tehnik« med Zelo težke.) Izraz »osnovne« v tem razdelku je
isto kot »srednje« (1–6).

**Meritev.** Vzorec kot pri meritvi stopenj v [uganke.md](uganke.md) (razdelek »Porazdelitev
naključnih ugank«): semena 1–840 dajo 660 minimalnih ugank, ki jih `solve()` reši brez ugibanja
(78,6 %). Časi so izmerjeni s pravim `ustvariUganko()` z vgrajenim merilom (Lahka 150 semen,
Srednja 600, Težka 900, Zelo težka 600), Node 24; v brskalniku so podobni. Na istih ugankah je
preverjeno, da vsaka ustvarjena uganka ustreza svojemu minimumu in da ji `oceniUganko()` da
natanko težavnost svoje stopnje (279 ugank, 0 odstopanj). Porazdelitev (660 ugank, osnovne × napredne):

| osnovne \ napredne | 0 | 1 | 2 | 3 | 4 | vsota |
|---|---|---|---|---|---|---|
| 0 | 358 | 16 | 3 | . | . | 377 (57,1 %) |
| 1 | 94 | 18 | 8 | 1 | . | 121 (18,3 %) |
| 2 | 39 | 30 | 11 | 3 | . | 83 (12,6 %) |
| 3 | 19 | 23 | 14 | 1 | . | 57 (8,6 %) |
| 4 | 2 | 9 | 8 | 1 | . | 20 (3,0 %) |
| ≥ 5 | . | 1 | 1 | . | . | 2 (0,3 %) |

Zavrnjena različica: **Srednja z ≥ 3 osnovnimi** tehnikami. Take uganke so redke (3,2 %, 2,3 %
semen), iskanje traja povprečno **5,7 s** (mediana 3,9 s) in pribl. eno iskanje od 200 obupa po
30 s – nad mejo pribl. 5 s. Štetje tehnik iz dnevnika `solve()` namesto s poti tu ne pomaga
(3,8 % namesto 3,2 %). Pri ≥ 3 osnovnih se v takih ugankah vedno pojavi Pointing pair/triple
(100 %), pogosto še očitna para (76 %) in skrita para (71 %), trojice skoraj nikoli (5 %).
