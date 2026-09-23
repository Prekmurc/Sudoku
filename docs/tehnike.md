# Tehnike reševanja (ALL_TECHNIQUES)

Tabela vseh tehnik iz `ALL_TECHNIQUES` v [shared/engine.js](../shared/engine.js), v vrstnem redu uporabe pri reševanju – od tehnik, ki jih človek pri ročnem reševanju najlažje opazi, k najzahtevnejšim (utemeljitev je v `CLAUDE.md`, razdelek Arhitektura). Stolpec »Vaja v treningu« pove, ali za tehniko obstaja vadbena vaja v `MODES` v [trening/generators.js](../trening/generators.js).

| Ime v kodi | Slovensko ime | Kaj počne | Vaja v treningu |
|---|---|---|---|
| `nakedSingles` | Gol enojček | Poišče celico, ki ima samo še enega možnega kandidata, in vanjo vpiše to številko. | ne |
| `hiddenSingles` | Skriti enojček | Poišče enoto, kjer je določena številka možna samo še v eni celici, in jo tja vpiše. | ne |
| `nakedPairs` | Naked pair | Poišče dve celici v isti enoti, ki imata skupaj natanko dva kandidata, in ju izbriše iz preostalih celic enote. | da |
| `pointing` | Pointing pair/triple | Če je kandidat v bloku možen samo v celicah ene same vrstice ali stolpca, ga izbriše iz preostanka te vrstice/stolpca zunaj bloka. | da |
| `boxLineReduction` | Box-line reduction | Če je kandidat v vrstici ali stolpcu možen samo znotraj enega bloka, ga izbriše iz preostanka tega bloka. | da |
| `hiddenPairs` | Hidden pair | Poišče dve številki, ki sta v enoti možni samo v istih dveh celicah, in izbriše vse druge kandidate iz teh dveh celic. | da |
| `nakedTriples` | Naked triple | Poišče tri celice v isti enoti, ki skupaj pokrivajo natanko tri kandidate, in te kandidate izbriše iz preostanka enote. | da |
| `hiddenTriples` | Hidden triple | Poišče tri številke, ki so v enoti možne samo v istih treh celicah, in izbriše vse druge kandidate iz teh celic. | da |
| `xWing` | X-Wing | Poišče kandidata, ki je v dveh vrsticah (ali stolpcih) možen na istih dveh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `turbotFish` | Turbot Fish | Poišče dve močni povezavi za isto številko (vrstica ali stolpec, kjer je številka mogoča v natanko dveh celicah), katerih konca se vidita. Vsaj eden od drugih dveh koncev je potem ta številka, zato jo izbriše iz celic, ki vidijo oba. Podtipa: Skyscraper (vzporedni povezavi) in Zmaj z dvema vrvicama / Two-String Kite (vrstica + stolpec, konca v istem bloku); podtip je naveden v sporočilu. Močne povezave v bloku niso vključene. | da |
| `swordfish` | Swordfish | Poišče kandidata, ki je v treh vrsticah (ali stolpcih) možen na istih treh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `wWing` | W-Wing (Krilo W) | Poišče dve celici z natanko istim parom kandidatov {a,b}, ki se med sabo ne vidita, in enoto, kjer je b mogoč samo v dveh celicah (močna povezava), od katerih ena vidi prvo, druga pa drugo celico para. Vsaj ena celica para je potem a, zato a izbriše iz celic, ki vidijo obe. V aplikaciji Oakever se tehnika imenuje »Krilo W«. | da |
| `xyWing` | XY-Wing | Poišče pivota z dvema kandidatoma in dve krili, ki si delita skupnega kandidata, ter ga izbriše iz celic, ki vidijo obe krili. | da |
| `uniqueRectangle` | Unique Rectangle | Prepreči smrtonosni vzorec (situacijo z dvema možnima rešitvama) tako, da iz četrte celice pravokotnika izbriše kandidata, ki bi dvoumnost povzročil. | da |

## Imena in sopomenke (odločitev 2026-09-23)

Dogovorjena imena za prikaz: slovensko ime, angleško v oklepaju (`docs/uskladitev.md`,
točka 1.3). Koda in zgornja tabela še uporabljata stara imena – popravita se ob izvedbi 1.3.
Ravni so iz točke 1.1: *lahke*, *srednje* (1–6), *napredne* (7–12), *ekspertne* (XY-Chain
in poznejše verige, zaenkrat prazno).

| Št. | Raven | Ime za prikaz | Ključ v `ALL_TECHNIQUES` | Sopomenke in stara imena |
|---|---|---|---|---|
| – | lahke | Očitni enojček (Naked Single) | Gol enojček | gol enojček, Sole Candidate |
| – | lahke | Skriti enojček (Hidden Single) | Skriti enojček | – |
| 1 | srednje | Očitni par (Naked Pair) | Naked pair | očitna para |
| 2 | srednje | Skriti par (Hidden Pair) | Hidden pair | skrita para |
| 3 | srednje | Izločitev izven bloka (Pointing Pair/Triple) | Pointing pair/triple | Locked Candidates Type 1 (Pointing), presek |
| 4 | srednje | Izločitev v bloku (Box-Line Reduction) | Box-line reduction | Locked Candidates Type 2 (Claiming), presek |
| 5 | srednje | Očitna trojica (Naked Triple) | Naked triple | – |
| 6 | srednje | Skrita trojica (Hidden Triple) | Hidden triple | – |
| 7 | napredne | X-krilo (X-Wing) | X-Wing | – |
| 8 | napredne | Mečarica (Swordfish) | Swordfish | tehnika mečarice |
| 9 | napredne | Veriga ene števke (Turbot Fish) | Turbot Fish | podtipa Skyscraper in Zmaj z dvema vrvicama (Two-String Kite) |
| 10 | napredne | W-krilo (W-Wing) | W-Wing | Krilo W (aplikacija Oakever) |
| 11 | napredne | XY-krilo (XY-Wing, Y-Wing) | XY-Wing | – |
| 12 | napredne | Edinstveni pravokotnik (Unique Rectangle) | Unique Rectangle | Unique Rectangle Type 1, smrtonosni vzorec (Deadly Pattern) |
| – | – | Poskus in protislovje | (sestopanje, `tryBifurcation`) | ugibanje, Bifurcation, forcing chain; ni tehnika s številko, ime ostane |

»Presek« je skupno ime tehnik 3 in 4 v opisih stopenj ugank in komentarjih (`shared/generator.js`, `GEN_PRESEKI`).

Angleške sopomenke pri enojčku in presekih so preverjene 2026-09-23 v uveljavljenih virih:
»Sole Candidate« je v Sudopedii (stran Naked Single: »Alternative terms are Forced Digit and
Sole Candidate«), »Locked Candidates Type 1 (Pointing)« in »Type 2 (Claiming)« sta v
Sudopedii (stran Locked Candidates, kjer je Type 2 tudi »Box-Line Reduction«) in v HoDoKu
(stran Intersections). »Unique Candidate« pri skritem enojčku je odstranjen, ker ga
uveljavljeni viri ne navajajo (Sudopedia ima za skriti enojček samo »Pinned Digit«).

## Stopnje ugank: najmanjše število različnih tehnik (meritev 2026-09-21)

Številke tehnik so iz `TRENING_TEHNIKE` v [shared/engine.js](../shared/engine.js) (vrstni red
kartic v treningu): **1** očitna para, **2** skrita para, **3** pointing, **4** box-line,
**5** očitna trojica, **6** skrita trojica, **7** X-Wing, **8** Swordfish, **9** Turbot Fish,
**10** W-Wing, **11** XY-Wing, **12** Unique Rectangle. Enojčka (gol in skriti) sta vključena
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
| Ekstrem | vse + poskus | pogoj je ugibanje (`solve()` uganke ne reši brez poskusa s protislovjem) | 21,4 % vseh izkopanih | – |

Minimum velja **samo za iskanje v generatorju** (kaj gumb »Ustvari uganko« ustvari), ne za
razvrščanje že znanih ugank: `oceniUganko()` (gumb »Oceni zbirko« v igri) mora ostati pokrivajoč,
sicer bi uganka z eno samo tehniko nad enojčki dobila oznako Ekstrem, čeprav se reši brez
ugibanja – takih je 21 % ugank, ki jih `solve()` reši brez poskusa. V
[shared/generator.js](../shared/generator.js) sta to dve merili vsake stopnje v
`STOPNJE_UGANK`: `ustreza` (pokrivajoče, zanj gre `oceniUganko`) in `ustrezaIskanju`
(s spodnjo mejo, zanj gre `oceniStopnjo` oziroma `ustvariUganko`).

Merilo iskanja mora biti **podmnožica** pokrivajočega, sicer bi ustvarjena uganka pri
»Oceni zbirko« dobila drugo težavnost, kot jo ima v zbirki. Zato ima Težka poleg spodnje
meje še zgornjo iz pokrivajočega merila (največ štiri tehnike nad enojčki; uganka z eno
napredno in štirimi osnovnimi se razvrsti kot Zelo težka), Zelo težka pa se pri iskanju
omeji na vejo z dvema naprednima in ne lovi tudi uganke s petimi tehnikami nad enojčki.
To preverja `tests/generator.test.js`.

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
