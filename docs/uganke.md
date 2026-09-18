# Testne uganke

Zbirka ugank za ročno analizo in regresijske teste reševalca (glej
`docs/naloge/02-regresijski-testi.md`). Testi `tests/turbot-fish.test.js`,
`tests/w-wing.test.js` in `tests/xy-wing.test.js` samodejno preberejo vse uganke od tu in
preverijo, da so enolične, da jih `solve()` reši brez napačnih vpisov/izbrisov in da noben
najden vzorec teh treh tehnik ne izbriše pravilne številke. Vsaka uganka je zapisana kot 81-znakovni
niz vrstica-za-vrstico, `.` = prazna celica. Preden se uganka doda sem, mora biti
preverjena z `countSolutions()` iz `shared/engine.js` (natanko ena rešitev) –
ugank se ne sestavlja na pamet (glej pravila dela v `CLAUDE.md`).

## Pokritost tehnik

Stanje 2026-09-18 za spodnjih pet ugank. »Uporabljena« pomeni, da `solve()` korak te
tehnike v dnevniku dejansko izvede; »samo najdena« pomeni, da funkcija tehnike vzorec v
kakem vmesnem stanju najde, a ga `solve()` ne izbere, ker prej najde korak cenejše
tehnike. Preglednico osveži `node tools/analiziraj-zbirko.js <zbirka.md>`, ki tudi pove,
katera uganka iz izvožene zbirke bi zaprla katero vrzel.

| Tehnika | Št. ugank | Uporabljena v |
|---|---|---|
| Gol enojček, Skriti enojček, Pointing pair/triple, Hidden pair | 5 | vseh pet |
| Turbot Fish | 4 | vse razen example-app |
| Naked triple | 3 | hard-17-a, oakever-ekstrem-17-a, oakever-ekstrem-17-b |
| W-Wing | 3 | hard-17-a, oakever-ekstrem-lv4, oakever-ekstrem-17-b |
| Box-line reduction | 2 | hard-17-a, example-app |
| Naked pair | 2 | oakever-ekstrem-lv4, example-app |
| Hidden pair… Unique Rectangle | 2 | hard-17-a, oakever-ekstrem-lv4 |
| Hidden triple | 2 | example-app (blok), oakever-ekstrem-17-b (vrstica) |
| **X-Wing** | **1** | samo oakever-ekstrem-lv4 |
| **Swordfish** | **0** | samo najdena (v vseh); `solve()` je ne izbere, ker X-Wing ali cenejša tehnika najde korak prej |
| **XY-Wing** | **0** | samo najdena; od uvedbe W-Wing ni več na vrsti – pokrita neposredno s `tests/xy-wing.test.js` |

Vsaka tehnika iz `ALL_TECHNIQUES` je v teh ugankah vsaj *najdena*, zato je vsako mogoče
pokriti z neposrednim testom nad posnetkom stanja (kot pri Turbot Fish, W-Wing in
XY-Wing), brez novih ugank. Za pokritost prek dnevnika `solve()` manjkata Swordfish in
XY-Wing (1–2 novi uganki, ena, če bi ena uganka zahtevala obe), za odpravo odvisnosti od
ene same uganke pa še X-Wing. Teh treh iskanje po težavnosti ne zadene zanesljivo –
odloča vrstni red v `ALL_TECHNIQUES`: Swordfish pride na vrsto šele, ko odpove X-Wing,
XY-Wing pa šele, ko odpove tudi W-Wing.

## Zapisane uganke

### hard-17-a

- **Danosti (17):** `....15....9..8.....6...3...5.....3.8...2...9.......4.....9..62.8........1........`
- **Vir:** posredoval uporabnik (2026-09-14), kot primer "težje uganke". Prej imenovana
  `hard-17-bifurcation-x3`.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši.
- **Značilnost:** `solve()` (`shared/engine.js`) jo reši v 84 korakih: Skriti enojček (40),
  Gol enojček (24), Pointing pair/triple (6), Hidden pair (4), Box-line reduction (3),
  Naked triple (2), Turbot Fish (2), W-Wing (1), Unique Rectangle (1) in enkrat
  `tryBifurcation` ("Poskus in protislovje (forcing chain)"), na indeksu koraka 28 od 84
  (V1S2≠8). Turbot Fish: Zmaj z dvema vrvicama (4) na indeksu 27, Skyscraper (4) na
  indeksu 36. W-Wing: par {4,7} v V2S1 in V3S4 (povezava na 7 v vrstici 1) na indeksu 45.
- **Zgodovina:** 3 ugibanja pred Turbot Fish, 1 po njem; W-Wing (2026-09-18) števila
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
  (`tryBifurcation` – "Poskus in protislovje" – se ne uporabi niti enkrat), v 77
  korakih. Uporabljene tehnike in število uporab: Skriti enojček (51), Gol enojček
  (13), Pointing pair/triple (6), Turbot Fish (2 – Zmaj z dvema vrvicama in
  Skyscraper, oba na številki 9), Hidden pair (1), X-Wing (1), Naked pair (1), W-Wing
  (1), Unique Rectangle (1). Od tehnik, ki jih je navedel Oakever, reševalec uporabi
  Skyscraper (kot Turbot Fish), X-Wing in W-Wing; Jellyfish (ki ga nima) ne potrebuje,
  XY-Wing pa od uvedbe W-Wing ni več na vrsti.
- **Zgodovina:** pred W-Wing (do 2026-09-18) prav tako 77 korakov brez ugibanja; na
  indeksu 50 je bil namesto W-Wing (izbris V2S5≠3) uporabljen XY-Wing (izbris V1S3≠3),
  vse ostalo enako. Pred Turbot Fish (do 2026-09-15) 76 korakov, prav tako brez ugibanja:
  Skriti enojček (51), Gol enojček (13), Pointing pair/triple (5), XY-Wing (3), X-Wing
  (2), Hidden pair (1), Unique Rectangle (1).

### example-app

- **Danosti:** `000800020900000600000000000604000900000720003500000000000056000080009000070000010`
- **Vir:** vgrajen primer v `app/app.js` (polje `PRIMERI`, "Primer 1 (z ugibanjem)").
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši.
- **Značilnost:** `tryBifurcation` se uporabi enkrat, na indeksu koraka 50 od 77.

### oakever-ekstrem-17-a

- **Danosti (17):** `..57...6........28.9.......7..4..9..2..6...........1......985..3...1.............`
- **Vir:** Oakever, Ekstrem; posredoval uporabnik (2026-09-15), iz zbirke reševalca.
  Prej imenovana `oakever-ekstrem-17-bifurcation-x3`.
- **Oakever:** po navedbi uporabnika (2026-09-15) jo aplikacija Oakever reši brez
  ugibanja s tehnikami Skyscraper, Two-String Kite in XY-Chain.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši
  (81/81 zapolnjenih celic).
- **Značilnost:** `solve()` jo reši v 78 korakih: Skriti enojček (41), Gol enojček (23),
  Pointing pair/triple (6), Hidden pair (4), Turbot Fish (2), Naked triple (1) in enkrat
  `tryBifurcation` ("Poskus in protislovje (forcing chain)"), na indeksu koraka 51 od 78
  (V1S5≠2). Turbot Fish: Skyscraper (7) na indeksu 37, Zmaj z dvema vrvicama (4) na
  indeksu 47. Na mestu ugibanja `turbotFish()` ne najde ničesar. Merilni primer za
  Turbot Fish in W-Wing.
- **W-Wing (2026-09-18):** dnevnik je ostal popolnoma nespremenjen – še vedno 78 korakov
  in eno ugibanje (V1S5≠2). `wWing()` v tej uganki vzorce najde (koraki 36–45, izbrisa
  V2S2≠4 in V3S5≠4), a jih `solve()` ne uporabi, ker iste celice prej razrešijo cenejše
  tehnike; na samem mestu ugibanja (korak 51) W-Wing ne najde ničesar.
- **Zgodovina:** 3 ugibanja pred Turbot Fish, 1 po njem. Pred Turbot Fish (2026-09-15):
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
  protislovje" – se ne uporabi niti enkrat), v 79 korakih: Skriti enojček (45), Gol
  enojček (19), Pointing pair/triple (7), Hidden pair (3), Turbot Fish (2), Hidden triple
  (1), Naked triple (1), W-Wing (1). Hidden triple: številke 1,6,7 v vrstici 1, na indeksu
  9. Turbot Fish: Skyscraper in Zmaj z dvema vrvicama, oba na številki 3, na indeksih 54
  in 55. W-Wing: par {3,5} v V2S9 in V8S8, na indeksu 56.
- **Zakaj je tu:** druga uganka, ki sproži Hidden triple (prva je `example-app`), in edina,
  kjer je ta v vrstici in ne v bloku. Izbrana 2026-09-18 iz izvožene zbirke z orodjem
  `tools/analiziraj-zbirko.js`; ostale uganke iz iste serije so bodisi že tu bodisi ne
  sprožijo nobene slabo pokrite tehnike.
