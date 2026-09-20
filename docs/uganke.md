# Testne uganke

Zbirka ugank za ročno analizo in regresijske teste reševalca (glej
`docs/naloge/02-regresijski-testi.md`). Testi `tests/turbot-fish.test.js`,
`tests/w-wing.test.js` in `tests/xy-wing.test.js` samodejno preberejo vse uganke od tu in
preverijo, da so enolične, da jih `solve()` reši brez napačnih vpisov/izbrisov in da noben
najden vzorec teh treh tehnik ne izbriše pravilne številke. Vsaka uganka je zapisana kot 81-znakovni
niz vrstica-za-vrstico, `.` = prazna celica. Preden se uganka doda sem, mora biti
preverjena z `countSolutions()` iz `shared/engine.js` (natanko ena rešitev) –
ugank se ne sestavlja na pamet (glej pravila dela v `CLAUDE.md`). Lažje uganke ustvari
`node tools/ustvari-uganko.js <lahka|srednja|tezka>` (iz naključne polne mreže, ponovljivo
s semenom).

## Pokritost tehnik

Stanje 2026-09-20 za spodnjih sedem ugank, z vrstnim redom tehnik po težavnosti opažanja
za človeka (glej `CLAUDE.md`, razdelek Arhitektura). »Uporabljena« pomeni, da `solve()`
korak te tehnike v dnevniku dejansko izvede; »samo najdena« pomeni, da funkcija tehnike
vzorec v kakem vmesnem stanju najde, a ga `solve()` ne izbere, ker prej najde korak
tehnike, ki je v `ALL_TECHNIQUES` pred njo. Preglednico osveži
`node tools/analiziraj-zbirko.js <zbirka.md>`, ki tudi pove, katera uganka iz izvožene
zbirke bi zaprla katero vrzel.

| Tehnika | Št. ugank | Uporabljena v |
|---|---|---|
| Gol enojček, Skriti enojček | 7 | vseh sedem |
| Pointing pair/triple | 5 | vse razen oakever-ekstrem-lv4 in srednja-a (tam samo najdena) |
| Naked pair | 5 | vse razen oakever-ekstrem-17-b in lahka-seme-197 (tam samo najdena) |
| Turbot Fish | 4 | hard-17-a, oakever-ekstrem-lv4, oakever-ekstrem-17-a, oakever-ekstrem-17-b |
| Hidden pair | 3 | hard-17-a, example-app, oakever-ekstrem-17-b |
| Naked triple | 3 | hard-17-a, oakever-ekstrem-17-a, srednja-a |
| **Box-line reduction** | **2** | hard-17-a, example-app (od 2026-09-20; prej samo hard-17-a) |
| **W-Wing** | **2** | oakever-ekstrem-lv4, oakever-ekstrem-17-b (od 2026-09-20 ne več v hard-17-a) |
| **Hidden triple** | **1** | samo srednja-a (blok); od 2026-09-20 ne več v example-app in oakever-ekstrem-17-b – tam je samo najdena |
| **X-Wing** | **1** | samo oakever-ekstrem-lv4 (tam dvakrat) |
| **Unique Rectangle** | **1** | samo oakever-ekstrem-lv4; od 2026-09-20 ne več v hard-17-a |
| **Swordfish** | **0** | samo najdena (v vseh); `solve()` je ne izbere, ker X-Wing, Turbot Fish ali tehnika pred njima najde korak prej |
| **XY-Wing** | **0** | samo najdena; od uvedbe W-Wing ni več na vrsti – pokrita neposredno s `tests/xy-wing.test.js` |

Vsaka tehnika iz `ALL_TECHNIQUES` je v teh ugankah vsaj *najdena*, zato je vsako mogoče
pokriti z neposrednim testom nad posnetkom stanja (kot pri Turbot Fish, W-Wing in
XY-Wing), brez novih ugank. Za pokritost prek dnevnika `solve()` manjkata Swordfish in
XY-Wing (1–2 novi uganki, ena, če bi ena uganka zahtevala obe), na eni sami uganki pa
slonijo Hidden triple, X-Wing in Unique Rectangle. Teh tehnik iskanje po težavnosti ne
zadene zanesljivo – odloča vrstni red v `ALL_TECHNIQUES`: Swordfish pride na vrsto šele,
ko odpovesta X-Wing in Turbot Fish, XY-Wing šele, ko odpove tudi W-Wing, Box-line
reduction pa šele, ko odpovesta Naked pair in Pointing pair/triple.

Sprememba sidranja 2026-09-20 (sidro na številko popusti lažji skupini tehnik, glej
`nextStep()` v `shared/engine.js`) je pokritost premaknila: zahtevnejših korakov je manj
(Hidden pair 17 → 7, Hidden triple 4 → 1, Naked triple 6 → 4, W-Wing 3 → 2, Unique
Rectangle 2 → 1, Turbot Fish 8 → 7), presekov in golih enojčkov pa več (Pointing 21 → 30,
Gol enojček 152 → 156). Skupno je korakov 504 → 493, ugibanj pa enako (3). Ker so zdaj
zahtevnejše tehnike pokrite slabše, so zanje toliko pomembnejši neposredni testi nad
posnetki stanja (`turbot-fish.test.js`, `w-wing.test.js`, `xy-wing.test.js`).

## Zapisane uganke

### hard-17-a

- **Danosti (17):** `....15....9..8.....6...3...5.....3.8...2...9.......4.....9..62.8........1........`
- **Vir:** posredoval uporabnik (2026-09-14), kot primer "težje uganke". Prej imenovana
  `hard-17-bifurcation-x3`.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši.
- **Značilnost:** `solve()` (`shared/engine.js`) jo reši v 83 korakih: Skriti enojček (38),
  Gol enojček (26), Pointing pair/triple (8), Hidden pair (3), Box-line reduction (2),
  Naked triple (2), Turbot Fish (2), Naked pair (1) in enkrat `tryBifurcation` ("Poskus in
  protislovje (forcing chain)"), na indeksu koraka 29 od 83 (V1S2≠8). Turbot Fish: Zmaj z
  dvema vrvicama (4) na indeksu 28, Skyscraper (4) na indeksu 37.
- **Zgodovina:** po spremembi sidranja (2026-09-20; sidro na številko popusti lažji skupini
  tehnik) je korakov enako (83) in ugibanje isto (V1S2≠8), le dve mesti pozneje (indeks 29
  namesto 27); W-Wing in Unique Rectangle se ne uporabita več (sta samo najdena), namesto
  njiju in dela skritih par ter trojic pride do izraza Pointing pair/triple (2 → 8). Prej:
  Skriti enojček (39), Gol enojček (25), Hidden pair (4), Box-line reduction (3), Naked
  triple (3), Naked pair (2), Pointing pair/triple (2), Turbot Fish (2, na indeksih 26 in
  35), W-Wing (1, par {4,7} v V2S1 in V3S4, na indeksu 44), Unique Rectangle (1, na
  indeksu 55).
  Pred spremembo vrstnega reda tehnik (2026-09-18; Naked pair pred
  Pointing/Box-line, Hidden pair za njima, Turbot Fish pred Swordfish) 84 korakov:
  Skriti enojček (40), Gol enojček (24), Pointing pair/triple (6), Hidden pair (4),
  Box-line reduction (3), Naked triple (2), Turbot Fish (2), W-Wing (1), Unique Rectangle
  (1) in isto ugibanje (V1S2≠8) na indeksu 28; dnevnika se razideta na indeksu 5.
  3 ugibanja pred Turbot Fish, 1 po njem; W-Wing (2026-09-18) števila
  ugibanj ni spremenil. Pred W-Wing je imel dnevnik 83 korakov – Skriti enojček (39),
  Gol enojček (25), sicer enako; novi korak W-Wing se vrine na indeks 45 in vse nadaljnje
  zamakne za enega. Pred Turbot Fish (2026-09-14) je imel dnevnik 86 korakov,
  `tryBifurcation` pa na indeksih 27, 35 in 67 (ta tri mesta so bila takrat analizirana).
  Preostalo ugibanje (V1S2≠8) je isto izločanje kot prej prvo.

### oakever-ekstrem-lv4

- **Danosti:** `8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4`
- **Vir:** Oakever, Ekstrem (Lv4); aplikacija Oakever je zanjo uporabila W-Wing,
  XY-Wing, Skyscraper, Jellyfish, X-Wing.
- **Vgrajen primer:** `app/app.js` (polje `PRIMERI`, "Primer 2 (Ekstrem, brez ugibanja)").
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši
  (81/81 zapolnjenih celic).
- **Značilnost:** naš `solve()` (`shared/engine.js`) jo reši brez sestopanja
  (`tryBifurcation` – "Poskus in protislovje" – se ne uporabi niti enkrat), v 72
  korakih. Uporabljene tehnike in število uporab: Skriti enojček (47), Gol enojček (17),
  Naked pair (3), X-Wing (2 – na številki 4, na indeksih 43 in 44), Turbot Fish (1 – Zmaj
  z dvema vrvicama na številki 4, na indeksu 42), Unique Rectangle (1, na indeksu 45),
  W-Wing (1 – par {3,9} v V1S9 in V2S2, izbris V1S3≠3, na indeksu 48). Od tehnik, ki jih
  je navedel Oakever, reševalec uporabi X-Wing, Zmaj z dvema vrvicama (kot Turbot Fish) in
  W-Wing; Jellyfish (ki ga nima) ne potrebuje, XY-Wing pa od uvedbe W-Wing ni več na
  vrsti. Edina uganka tu, ki uporabi X-Wing in Unique Rectangle.
- **Zgodovina:** po spremembi sidranja (2026-09-20) 72 korakov namesto 75, še vedno brez
  ugibanja: Pointing pair/triple (3 → 0) in Hidden pair (1 → 0) odpadeta, Turbot Fish
  2 → 1, X-Wing 1 → 2, W-Wing izbriše V1S3≠3 namesto V2S5≠3. Prej: Skriti enojček (51),
  Gol enojček (13), Pointing pair/triple (3), Turbot Fish (2 – Zmaj z dvema vrvicama in
  Skyscraper, oba na številki 9, na indeksih 41 in 42), Naked pair (2), Hidden pair (1),
  X-Wing (1, na indeksu 44), W-Wing (1, izbris V2S5≠3 na indeksu 48), Unique Rectangle (1).
  Pred spremembo vrstnega reda tehnik (2026-09-18) 77 korakov brez
  ugibanja: Pointing pair/triple (6), Naked pair (1), W-Wing na indeksu 50, sicer enako;
  dnevnika se razideta na indeksu 45. Pred W-Wing (do 2026-09-18) prav tako 77 korakov brez ugibanja; na
  indeksu 50 je bil namesto W-Wing (izbris V2S5≠3) uporabljen XY-Wing (izbris V1S3≠3),
  vse ostalo enako. Pred Turbot Fish (do 2026-09-15) 76 korakov, prav tako brez ugibanja:
  Skriti enojček (51), Gol enojček (13), Pointing pair/triple (5), XY-Wing (3), X-Wing
  (2), Hidden pair (1), Unique Rectangle (1).

### example-app

- **Danosti:** `...8...2.9.....6...........6.4...9.....72...35............56....8...9....7.....1.`
- **Vir:** vgrajen primer v `app/app.js` (polje `PRIMERI`, "Primer 1 (z ugibanjem)");
  tam je isti niz zapisan z ničlami namesto pik.
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši.
- **Značilnost:** `solve()` jo reši v 79 korakih: Skriti enojček (40), Gol enojček (24),
  Pointing pair/triple (9), Hidden pair (3), Box-line reduction (1, na indeksu 12), Naked
  pair (1) in enkrat `tryBifurcation`, na indeksu koraka 52 od 79 (V1S6≠7).
- **Zgodovina:** po spremembi sidranja (2026-09-20) 79 korakov namesto 77, ugibanje isto
  (V1S6≠7), le na indeksu 52 namesto 50. Hidden triple (številke 2,7,8 v bloku 1, prej na
  indeksu 41) se ne uporabi več – je samo najdena; Box-line reduction se je vrnila v
  dnevnik (indeks 12), Pointing pair/triple 4 → 9, Hidden pair 5 → 3, Naked pair 2 → 1.
  Pred spremembo vrstnega reda tehnik (2026-09-18) 77 korakov in isto ugibanje na indeksu
  50; razlika je bila samo na indeksu 37, kjer je izbris V7S4≠3, V8S4≠3 namesto Box-line
  reduction naredil Naked pair.

### oakever-ekstrem-17-a

- **Danosti (17):** `..57...6........28.9.......7..4..9..2..6...........1......985..3...1.............`
- **Vir:** Oakever, Ekstrem; posredoval uporabnik (2026-09-15), iz zbirke reševalca.
  Prej imenovana `oakever-ekstrem-17-bifurcation-x3`.
- **Oakever:** po navedbi uporabnika (2026-09-15) jo aplikacija Oakever reši brez
  ugibanja s tehnikami Skyscraper, Two-String Kite in XY-Chain.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši
  (81/81 zapolnjenih celic).
- **Značilnost:** `solve()` jo reši v 73 korakih: Skriti enojček (41), Gol enojček (23),
  Pointing pair/triple (3), Naked pair (2), Turbot Fish (2), Naked triple (1) in enkrat
  `tryBifurcation` ("Poskus in protislovje (forcing chain)"), na indeksu koraka 46 od 73
  (V1S5≠2). Turbot Fish: Zmaj z dvema vrvicama (4) na indeksu 42, Skyscraper (7) na
  indeksu 44. Na mestu ugibanja `turbotFish()` ne najde ničesar. Merilni primer za Turbot
  Fish in W-Wing.
- **Zgodovina (sidranje 2026-09-20):** 73 korakov namesto 78, ugibanje isto (V1S5≠2) na
  indeksu 46 namesto 51. Hidden pair (4 → 0) se ne uporabi več (je samo najdena),
  Pointing pair/triple 4 → 3; oba koraka Turbot Fish ostaneta, le prej (indeksa 42 in 44
  namesto 37 in 47) in v obratnem vrstnem redu podtipov.
- **W-Wing (2026-09-18):** dnevnik je ostal popolnoma nespremenjen – še vedno 78 korakov
  in eno ugibanje (V1S5≠2). `wWing()` v tej uganki vzorce najde (koraki 36–45, izbrisa
  V2S2≠4 in V3S5≠4), a jih `solve()` ne uporabi, ker iste celice prej razrešijo cenejše
  tehnike; na samem mestu ugibanja (korak 51) W-Wing ne najde ničesar. Po spremembi
  vrstnega reda tehnik (2026-09-18) jih najde na korakih 36–43; izbris V2S2≠4 na
  indeksu 42 zdaj naredi Naked pair.
- **Zgodovina:** pred spremembo vrstnega reda tehnik (2026-09-18) enako število korakov,
  isto ugibanje in isti indeksi Turbot Fish; Pointing pair/triple (6) namesto 4 in brez
  Naked pair; dnevnika se razideta na indeksu 32.
  3 ugibanja pred Turbot Fish, 1 po njem. Pred Turbot Fish (2026-09-15):
  77 korakov – Skriti enojček (42), Gol enojček (22), Pointing pair/triple (5), Hidden
  pair (4), Naked pair (1) in `tryBifurcation` na indeksih 47, 51 in 54 (V1S5≠2, V2S2≠3,
  V3S5≠6). Takratna analiza: na vseh treh mestih so bili prisotni vzorci, ki jih
  reševalec ni imel – Skyscraper in 2-String Kite na številki 7 ter W-Wing {4,7}; na
  indeksih 51 in 54 bi že sam Skyscraper (7) zadoščal za rešitev brez ugibanja, na
  indeksu 47 posamezen vzorec ni zadoščal. Vsa tri protislovja so nastala že s
  propagacijo enojčkov (10–19 vpisov, 2–3 generacije). Preostalo ugibanje (V1S5≠2) je
  isto izločanje kot prej prvo.

### oakever-ekstrem-17-b

- **Danosti (17):** `....9.8..6...4....1.7.........1...7...4...9..5..6........7...6..2..8.....9.......`
- **Vir:** Oakever Games: Klasičen Sudoku, težavnost Ekstrem (Lv4); posredoval uporabnik
  (2026-09-18) iz zbirke reševalca (`app/`, izvoz zbirke), v zbirko dodana 2026-09-17 12:26.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši
  (81/81 zapolnjenih celic).
- **Značilnost:** `solve()` jo reši brez sestopanja (`tryBifurcation` – "Poskus in
  protislovje" – se ne uporabi niti enkrat), v 77 korakih: Skriti enojček (45), Gol
  enojček (19), Pointing pair/triple (9), Turbot Fish (2), Hidden pair (1), W-Wing (1).
  Turbot Fish: Skyscraper in Zmaj z dvema vrvicama, oba na številki 3, na indeksih 52 in
  53. W-Wing: par {3,5} v V2S9 in V8S8, izbris V9S9≠3, na indeksu 54.
- **Zgodovina:** sprememba vrstnega reda tehnik (2026-09-18) dnevnika ni spremenila (korak
  za korakom enak). Po spremembi sidranja (2026-09-20) 77 korakov namesto 79: Hidden
  triple (številke 1,6,7 v vrstici 1, prej na indeksu 9) in Naked triple se ne uporabita
  več (sta samo najdena), Hidden pair 3 → 1, Pointing pair/triple 7 → 9; Turbot Fish in
  W-Wing ostanejo, le dve mesti prej.
- **Zakaj je tu:** do 2026-09-20 edina uganka s Hidden triple v vrstici (in druga s Hidden
  triple sploh) – po spremembi sidranja je ta korak tu samo še najden, ne izveden, uganka
  pa ostaja kot druga od dveh, ki sprožita W-Wing. Izbrana 2026-09-18 iz izvožene zbirke z
  orodjem `tools/analiziraj-zbirko.js`; ostale uganke iz iste serije so bodisi že tu bodisi
  ne sprožijo nobene slabo pokrite tehnike.

### lahka-seme-197

- **Danosti (32):** `.73..4..2.49.6.8..1.58............26....9.37.387..2...492.7.6.......9.5.5..2.69.7`
- **Vir:** ustvarjena 2026-09-19 z `node tools/ustvari-uganko.js lahka --seme 197` (iz
  naključne polne mreže odstranjuje celice, dokler ostaja ena rešitev; ponovljivo).
- **Vgrajen primer:** `app/app.js` (polje `PRIMERI`, "Primer 3 (lahka)").
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši brez ugibanja,
  `solutionOf()` da isto rešitev.
- **Značilnost:** samo z enojčki se reševanje zatakne, z enojčki in Pointing/Box-line se
  reši (Box-line reduction ni potrebna). `solve()` jo reši v 50 korakih: Skriti enojček
  (29), Gol enojček (20), Pointing pair/triple (1 – številka 5 v bloku 6, vrstica 6,
  izbris V6S5≠5, na indeksu 24). V zbirki: »tehnike: 3«. Sprememba sidranja (2026-09-20)
  dnevnika ni spremenila (korak za korakom enak).
- **Zakaj je tu:** najlažja uganka v zbirki – preizkus reševalca in igre na uganki, ki ne
  potrebuje nobene tehnike razen enojčkov in enega Pointing koraka.

### srednja-a

- **Danosti (26):** `..4..7.251....3....7.8.....8...9..34.4...5..996....572..1..6.................4761`
- **Vir:** ustvarjena 2026-09-19 z `node tools/ustvari-uganko.js srednja --seme 97`; do
  2026-09-20 imenovana `srednja-seme-97`. **Iz semena 97 ni več reproducibilna:** ocena
  stopnje bere dnevnik `solve()`, ta pa se je s spremembo sidranja (2026-09-20) spremenil,
  zato na poti odstranjevanja zmaga drug kandidat (uganka s 24 danostmi). Uganka sama
  merilu srednje stopnje še vedno ustreza (preverja `tests/generator.test.js`), zato
  ostaja tu – testne uganke naj se ne spreminjajo, da so primerjave z zgodovino smiselne.
- **Vgrajen primer:** `app/app.js` (polje `PRIMERI`, "Primer 4 (srednja)").
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši brez ugibanja,
  `solutionOf()` da isto rešitev.
- **Značilnost:** z enojčki in Pointing/Box-line se reševanje zatakne, s pari in trojicami
  se reši, naprednih tehnik ne potrebuje. Trojice so nujne (brez njih se zatakne), pari ne
  – brez parov jo rešijo trojice. `solve()` jo reši v 59 korakih: Skriti enojček (28),
  Gol enojček (27), Naked pair (2 – na indeksih 8 in 9), Hidden triple (1 – številke 4,6,7
  v bloku 7, na indeksu 10), Naked triple (1 – 1,6,9 v bloku 2, na indeksu 11). V zbirki:
  »tehnike: 1, 5, 6«.
- **Zgodovina (sidranje 2026-09-20):** 59 korakov namesto 62: Naked pair 4 → 2 (prej na
  indeksih 1, 2, 6, 10), Hidden triple 2 → 1 – korak s številkami 2,4,9 v stolpcu 7 (prej
  indeks 31) se ne uporabi več, ker ga prehitijo enojčki.
- **Zakaj je tu:** srednja težavnost med `lahka-seme-197` in težkimi ugankami zgoraj; od
  2026-09-20 edina uganka tu, ki v dnevniku `solve()` uporabi Hidden triple.
