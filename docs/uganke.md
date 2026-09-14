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

### example-app

- **Danosti:** `000800020900000600000000000604000900000720003500000000000056000080009000070000010`
- **Vir:** vgrajen primer v `app/app.js` (gumb "Primer").
- **Preverjeno:** `countSolutions() === 1`; `solve()` jo v celoti reši.
- **Značilnost:** `tryBifurcation` se uporabi enkrat, na indeksu koraka 50 od 77.
