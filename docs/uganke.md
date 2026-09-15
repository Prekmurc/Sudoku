# Testne uganke

Zbirka ugank za ročno analizo in regresijske teste reševalca (glej
`docs/naloge/02-regresijski-testi.md`). Test `tests/turbot-fish.test.js` samodejno
prebere vse uganke od tu in preveri, da so enolične in da jih `solve()` reši brez
napačnih vpisov/izbrisov. Vsaka uganka je zapisana kot 81-znakovni
niz vrstica-za-vrstico, `.` = prazna celica. Preden se uganka doda sem, mora biti
preverjena z `countSolutions()` iz `shared/engine.js` (natanko ena rešitev) –
ugank se ne sestavlja na pamet (glej pravila dela v `CLAUDE.md`).

## Zapisane uganke

### hard-17-a

- **Danosti (17):** `....15....9..8.....6...3...5.....3.8...2...9.......4.....9..62.8........1........`
- **Vir:** posredoval uporabnik (2026-09-14), kot primer "težje uganke". Prej imenovana
  `hard-17-bifurcation-x3`.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši.
- **Značilnost:** `solve()` (`shared/engine.js`) jo reši v 83 korakih: Skriti enojček (39),
  Gol enojček (25), Pointing pair/triple (6), Hidden pair (4), Box-line reduction (3),
  Naked triple (2), Turbot Fish (2), Unique Rectangle (1) in enkrat `tryBifurcation`
  ("Poskus in protislovje (forcing chain)"), na indeksu koraka 28 od 83 (V1S2≠8).
  Turbot Fish: Zmaj z dvema vrvicama (4) na indeksu 27, Skyscraper (4) na indeksu 36.
- **Zgodovina:** 3 ugibanja pred Turbot Fish, 1 po njem. Pred Turbot Fish (2026-09-14)
  je imel dnevnik 86 korakov, `tryBifurcation` pa na indeksih 27, 35 in 67 (ta tri mesta
  so bila takrat analizirana). Preostalo ugibanje (V1S2≠8) je isto izločanje kot prej
  prvo.

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
  Skyscraper, oba na številki 9), Hidden pair (1), X-Wing (1), Naked pair (1), XY-Wing
  (1), Unique Rectangle (1). Od tehnik, ki jih je navedel Oakever, reševalec uporabi
  Skyscraper (kot Turbot Fish), X-Wing in XY-Wing; W-Wing in Jellyfish (ki ju nima) ne
  potrebuje.
- **Zgodovina:** pred Turbot Fish (do 2026-09-15) 76 korakov, prav tako brez ugibanja:
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
  Turbot Fish.
- **Zgodovina:** 3 ugibanja pred Turbot Fish, 1 po njem. Pred Turbot Fish (2026-09-15):
  77 korakov – Skriti enojček (42), Gol enojček (22), Pointing pair/triple (5), Hidden
  pair (4), Naked pair (1) in `tryBifurcation` na indeksih 47, 51 in 54 (V1S5≠2, V2S2≠3,
  V3S5≠6). Takratna analiza: na vseh treh mestih so bili prisotni vzorci, ki jih
  reševalec ni imel – Skyscraper in 2-String Kite na številki 7 ter W-Wing {4,7}; na
  indeksih 51 in 54 bi že sam Skyscraper (7) zadoščal za rešitev brez ugibanja, na
  indeksu 47 posamezen vzorec ni zadoščal. Vsa tri protislovja so nastala že s
  propagacijo enojčkov (10–19 vpisov, 2–3 generacije). Preostalo ugibanje (V1S5≠2) je
  isto izločanje kot prej prvo.
