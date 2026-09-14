# Sudoku – navodila za Claude Code

## O projektu
Projekt ima dve aplikaciji s skupno kodo:

1. **Reševalec** (`app/`) – vnos uganke, reševanje po korakih z razlago, grafični prikaz mreže in kandidatov.
2. **Trening tehnik** (`trening/`) – vaje za tehnike: Očitna para, Skrita para, Očitna trojica, Skrita trojica, X-Wing, Swordfish.

Skupna koda (mreža, kandidati, logika tehnik) je v `shared/`.

## Struktura
- `shared/` – skupna osnova za obe aplikaciji.
  - `base.css` – skupni reset (`*{box-sizing:border-box}`, osnovni `body`), ki ga uvozita `app/` in `trening/`.
  - `engine.js` – motor za reševanje: mreža/enote (`ROWS`/`COLS`/`BOXES`/`PEERS`), razred `Board`, vse tehnike reševanja (glej spodaj), sestopanje (`tryBifurcation`) in `solve()`, ki vrne rešeno mrežo + dnevnik korakov z razlago.
- `app/` – Sudoku reševalec (vnos uganke → rešitev po korakih).
  - `index.html` – markup strani, nalaga `shared/engine.js` in `app.js`.
  - `app.css` – stili reševalca (vnosna mreža, kandidati, koraki, lightbox).
  - `app.js` – UI: vnos v mrežo, preverjanje konfliktov, klic `solve()`, izris rešitve/kandidatov/korakov, lightbox.
- `trening/` – vadba posameznih tehnik z naključno generiranimi vajami.
  - `index.html` – markup strani (meni tehnik + prostor za vajo), nalaga `shared/engine.js`, `generators.js` in `trening.js`.
  - `trening.css` – stili trenerja (kartice v meniju, mreža vaje, X-Wing/Swordfish mreža, povratne informacije).
  - `generators.js` – generatorji naključnih vaj za vsako tehniko (`genNakedPair`, `genHiddenPair`, `genNakedTriple`, `genHiddenTriple`, `genXWing`, `genSwordfish`) in `MODES` – osrednja definicija vsake tehnike (generator, barve, št. celic za izbiro, opis, posebnosti UI).
  - `trening.js` – UI/tok vadbe: izbira tehnike v meniju, izris vaje, preverjanje odgovora (`checkPhase1`/`checkPhase2`), namig/rešitev na dotik, štetje rezultata. Za Swordfish preverjanje kliče `swordfish()` iz `shared/engine.js` (zgradi začasno "desko" iz vaje in preveri, ali izbrane celice ustrezajo najdenemu vzorcu) namesto lastne kopije logike.
- `docs/naloge/` – specifikacije posameznih nalog/popravkov za to sejo (naloga na datoteko, oštevilčeno).
- `old/` – arhiv starejših verzij treninga pred refaktoriranjem (zunaj projekta, ni v gitu).
- `CLAUDE.md` – ta datoteka.

Opomba: `trening/generators.js` sam sestavlja umetne "vaje" (nabor kandidatov v eni enoti oz. umetno 9×9 mrežo za X-Wing/Swordfish) – ne uporablja `shared/engine.js` in ne rešuje pravih ugank, zato od `shared/` ni odvisen. `trening/trening.js` pa za preverjanje Swordfish vaj `shared/engine.js` uporablja (glej zgoraj); sestavljanje vaj (generatorji) ostaja neodvisno.

## Zagon in testi
- Zagon reševalca: odpri `app/index.html` neposredno v brskalniku, ali iz korena projekta poženi lokalni strežnik (npr. `python -m http.server`) in obišči `http://localhost:<vrata>/app/`.
- Zagon treninga: enako, `trening/index.html`.
- Zagon testov: projekt trenutno nima avtomatskih testov. Posnetek obnašanja reševalca in regresijski testi so predvideni v `docs/naloge/02-regresijski-testi.md`, a še niso napisani.
- Okolje: Windows 10, VS Code. Če projekt uporablja Python: uporabljaj conda okolje `py312_env` (Python 3.12). Pred zagonom preveri `python --version`; če ni 3.12, zaganjaj prek okolja (npr. `conda run -n py312_env python ...`).

## Arhitektura
- Logika tehnik (iskanje vzorcev, izločanje kandidatov) je samo v `shared/`. `app/` in `trening/` jo le kličeta – logike ne podvajaj.
- Vsaka tehnika ima definicijo na enem mestu:
  - V reševalcu (`app/`): en vnos `[ime, funkcija]` v `ALL_TECHNIQUES` v `shared/engine.js`.
  - V treningu (`trening/`): en vnos v `MODES` v `trening/generators.js` (generator vaje + `selClass`/`hlClass`/`btnClass`/`pickN`/`desc`/`showCandidateCount` ipd.). Gumb »Pokaži število kandidatov« je viden natanko takrat, ko ima tehnika `showCandidateCount:true` (trenutno pri vseh razen X-Wing in Swordfish) – glej `docs/naloge/01-swordfish-gumb.md`.
- Vrstni red tehnik v reševalcu (`ALL_TECHNIQUES` v `shared/engine.js`): Gol enojček → Skriti enojček → Pointing pair/triple → Box-line reduction → Naked pair → Hidden pair → Naked triple → Hidden triple → X-Wing → Swordfish → XY-Wing → Unique Rectangle → (če nič od tega ne najde koraka) sestopanje/forcing chain (`tryBifurcation`). Nove tehnike dodajaj na konec, razen če izrecno zahtevam drugače.
- Zapis celic v razlagah: `V<vrstica>S<stolpec>` (1–9), npr. `V5S3` (funkciji `cellLabel`/`cellsLabel` v `shared/engine.js`).

## Pravila dela
- Pred vsako večjo spremembo predlagaj načrt in počakaj na potrditev.
- Pri napakah najprej poišči vzrok in mi ga razloži, šele nato popravljaj.
- Spreminjaj samo tisto, kar zahteva naloga. Če opaziš drugo težavo, jo navedi v povzetku, ne popravljaj je.
- Obnašanja obstoječih tehnik ne spreminjaj brez izrecne zahteve.
- Novih knjižnic in odvisnosti ne dodajaj brez vprašanja.
- Sudoku ugank in testnih pozicij ne sestavljaj na pamet. Vsaka uganka mora biti preverjena s programom (natanko ena rešitev).
- Besedila v uporabniškem vmesniku so v slovenščini.
- Na koncu naloge napiši povzetek: spremenjene datoteke, kaj je narejeno, kaj naj ročno preverim.

## Izrazi
| Slovensko | Angleško |
|---|---|
| Očitna para / trojica | Naked Pair / Triple |
| Skrita para / trojica | Hidden Pair / Triple |
| kvadrat 3×3 | box |
| celica z dvema kandidatoma | bivalue cell |
| pivot, krilo (XY-Wing) | pivot, pincer |
| smrtonosni vzorec (Unique Rectangle) | deadly pattern |
