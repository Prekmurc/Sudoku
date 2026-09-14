# Tehnike reševanja (ALL_TECHNIQUES)

Tabela vseh tehnik iz `ALL_TECHNIQUES` v [shared/engine.js](../shared/engine.js), v vrstnem redu uporabe pri reševanju. Stolpec »Vaja v treningu« pove, ali za tehniko obstaja vadbena vaja v `MODES` v [trening/generators.js](../trening/generators.js).

| Ime v kodi | Slovensko ime | Kaj počne | Vaja v treningu |
|---|---|---|---|
| `nakedSingles` | Gol enojček | Poišče celico, ki ima samo še enega možnega kandidata, in vanjo vpiše to številko. | ne |
| `hiddenSingles` | Skriti enojček | Poišče enoto, kjer je določena številka možna samo še v eni celici, in jo tja vpiše. | ne |
| `pointing` | Pointing pair/triple | Če je kandidat v bloku možen samo v celicah ene same vrstice ali stolpca, ga izbriše iz preostanka te vrstice/stolpca zunaj bloka. | ne |
| `boxLineReduction` | Box-line reduction | Če je kandidat v vrstici ali stolpcu možen samo znotraj enega bloka, ga izbriše iz preostanka tega bloka. | ne |
| `nakedPairs` | Naked pair | Poišče dve celici v isti enoti, ki imata skupaj natanko dva kandidata, in ju izbriše iz preostalih celic enote. | da |
| `hiddenPairs` | Hidden pair | Poišče dve številki, ki sta v enoti možni samo v istih dveh celicah, in izbriše vse druge kandidate iz teh dveh celic. | da |
| `nakedTriples` | Naked triple | Poišče tri celice v isti enoti, ki skupaj pokrivajo natanko tri kandidate, in te kandidate izbriše iz preostanka enote. | da |
| `hiddenTriples` | Hidden triple | Poišče tri številke, ki so v enoti možne samo v istih treh celicah, in izbriše vse druge kandidate iz teh celic. | da |
| `xWing` | X-Wing | Poišče kandidata, ki je v dveh vrsticah (ali stolpcih) možen na istih dveh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `swordfish` | Swordfish | Poišče kandidata, ki je v treh vrsticah (ali stolpcih) možen na istih treh mestih, in ga izbriše iz preostanka pripadajočih stolpcev (ali vrstic). | da |
| `xyWing` | XY-Wing | Poišče pivota z dvema kandidatoma in dva kraka, ki si delita skupnega kandidata, ter ga izbriše iz celic, ki vidijo oba kraka. | ne |
| `uniqueRectangle` | Unique Rectangle | Prepreči smrtonosni vzorec (situacijo z dvema možnima rešitvama) tako, da iz četrte celice pravokotnika izbriše kandidata, ki bi dvoumnost povzročil. | ne |
