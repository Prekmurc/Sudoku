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
| Težka | 1–6 + ena iz 7–12 | **≥ 2** iz 1–6 + **natanko 1** iz 7–12 | 9,5 % | 1,5 s |
| Zelo težka | 1–12 | **≥ 2** iz 1–6 + **≥ 2** iz 7–12 | 5,9 % | 2,7 s |
| Ekstrem | vse + poskus | pogoj je ugibanje (`solve()` uganke ne reši brez poskusa s protislovjem) | 21,4 % vseh izkopanih | – |

Minimum velja **samo za iskanje v generatorju** (kaj gumb »Ustvari uganko« ustvari), ne za
razvrščanje že znanih ugank: `oceniUganko()` (gumb »Oceni zbirko« v igri) mora ostati pokrivajoč,
sicer bi uganka z eno samo tehniko nad enojčki dobila oznako Ekstrem, čeprav se reši brez
ugibanja – takih je 21 % ugank, ki jih `solve()` reši brez poskusa.

**Meritev.** Vzorec kot pri meritvi stopenj v [uganke.md](uganke.md) (razdelek »Porazdelitev
naključnih ugank«): semena 1–840 dajo 660 minimalnih ugank, ki jih `solve()` reši brez ugibanja
(78,6 %). Časi so izmerjeni s pravim `ustvariUganko()` (300 semen na merilo, 600 pri redkem),
Node 24; v brskalniku so podobni. Porazdelitev (660 ugank, osnovne × napredne):

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
