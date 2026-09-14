# Testne uganke

Zbirka ugank za ročno analizo in (kasneje) regresijske teste reševalca (glej
`docs/naloge/02-regresijski-testi.md`). Vsaka uganka je zapisana kot 81-znakovni
niz vrstica-za-vrstico, `.` = prazna celica. Preden se uganka doda sem, mora biti
preverjena z `countSolutions()` iz `shared/engine.js` (natanko ena rešitev) –
ugank se ne sestavlja na pamet (glej pravila dela v `CLAUDE.md`).

## Zapisane uganke

### hard-17-bifurcation-x3

- **Danosti (17):** `....15....9..8.....6...3...5.....3.8...2...9.......4.....9..62.8........1........`
- **Vir:** posredoval uporabnik (2026-09-14), kot primer "težje uganke".
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši.
- **Značilnost:** reševalec (`shared/engine.js` `solve()`) pri njej trikrat uporabi
  `tryBifurcation` ("Poskus in protislovje (forcing chain)"), na indeksih koraka
  27, 35 in 67 od skupno 86 korakov v dnevniku. Uporabljena za analizo teh treh
  mest – glej pogovor/poročilo v tej seji.

### oakever-ekstrem-lv4

- **Danosti:** `8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4`
- **Vir:** Oakever, Ekstrem (Lv4); aplikacija Oakever je zanjo uporabila W-Wing,
  XY-Wing, Skyscraper, Jellyfish, X-Wing.
- **Preverjeno:** `countSolutions() === 1` (enolična rešitev); `solve()` jo v celoti reši
  (81/81 zapolnjenih celic).
- **Značilnost:** naš `solve()` (`shared/engine.js`) jo reši brez sestopanja
  (`tryBifurcation` – "Poskus in protislovje" – se ne uporabi niti enkrat), v 76
  korakih. Uporabljene tehnike in število uporab: Skriti enojček (51), Gol enojček
  (13), Pointing pair/triple (5), XY-Wing (3), X-Wing (2), Hidden pair (1), Unique
  Rectangle (1). Reševalec torej za to uganko ne potrebuje W-Wing, Skyscraper ali
  Jellyfish (ki jih tudi nima) – Unique Rectangle in Hidden pair (ki ju Oakever ni
  omenil) mu zadoščata namesto njih.

### example-app

- **Danosti:** `000800020900000600000000000604000900000720003500000000000056000080009000070000010`
- **Vir:** vgrajen primer v `app/app.js` (gumb "Primer").
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši.
- **Značilnost:** `tryBifurcation` se uporabi enkrat, na indeksu koraka 50 od 77.
