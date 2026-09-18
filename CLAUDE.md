# Sudoku – navodila za Claude Code

## O projektu
Projekt ima dve aplikaciji s skupno kodo:

1. **Reševalec** (`app/`) – vnos uganke, reševanje po korakih z razlago, grafični prikaz mreže in kandidatov.
2. **Trening tehnik** (`trening/`) – vaje za tehnike: Pointing pair/triple, Box-line reduction, Očitna para, Skrita para, Očitna trojica, Skrita trojica, X-Wing, Swordfish, Turbot Fish (Skyscraper, Zmaj z dvema vrvicama), W-Wing (Krilo W), XY-Wing, Unique Rectangle.

Skupna koda (mreža, kandidati, logika tehnik) je v `shared/`.

## Struktura
- `shared/` – skupna osnova za obe aplikaciji.
  - `base.css` – skupni reset (`*{box-sizing:border-box}`, osnovni `body`), ki ga uvozita `app/` in `trening/`.
  - `engine.js` – motor za reševanje: mreža/enote (`ROWS`/`COLS`/`BOXES`/`PEERS`), razred `Board`, vse tehnike reševanja (glej spodaj), sestopanje (`tryBifurcation`) in `solve()`, ki vrne rešeno mrežo + dnevnik korakov z razlago.
- `app/` – Sudoku reševalec (vnos uganke → rešitev po korakih).
  - `index.html` – markup strani, nalaga `shared/engine.js`, `app.js` in `zbirka.js`.
  - `app.css` – stili reševalca (vnosna mreža, kandidati, koraki, lightbox, zbirka ugank).
  - `app.js` – UI: vnos v mrežo, preverjanje konfliktov, klic `solve()`, izris rešitve/kandidatov/korakov, lightbox; `naloziDanosti()` vpiše uganko v mrežo (spustni seznam »Primer« in zbirka). Vgrajeni primeri so v polju `PRIMERI` (nov primer = nova vrstica; danosti preverjene in zapisane v `docs/uganke.md`).
  - `zbirka.js` – zbirka ugank: samodejno shranjevanje ob reševanju (v `localStorage`, samo uganke z enolično rešitvijo – tudi delno rešene), težavnost/opomba v kartici »Rešitev«, seznam (gumb »Zbirka« v glavi) z »Naloži«/»Izbriši«, izvoz/uvoz v Markdown v obliki `docs/uganke.md` (uvoz dopolni, ne prepiše; uganke se ločijo po nizu danosti).
- `trening/` – vadba posameznih tehnik z naključno generiranimi vajami.
  - `index.html` – markup strani (meni tehnik + prostor za vajo), nalaga `shared/engine.js`, `generators.js` in `trening.js`.
  - `trening.css` – stili trenerja (kartice v meniju, mreža vaje, X-Wing/Swordfish mreža, povratne informacije).
  - `generators.js` – generatorji naključnih vaj za vsako tehniko (`genPointing`, `genBoxLineReduction`, `genNakedPair`, `genHiddenPair`, `genNakedTriple`, `genHiddenTriple`, `genXWing`, `genSwordfish`, `genTurbotFish`, `genWWing`, `genXYWing`, `genUniqueRectangle`) in `MODES` – osrednja definicija vsake tehnike (generator, barve, št. celic za izbiro, opis, posebnosti UI).
  - `trening.js` – UI/tok vadbe: izbira tehnike v meniju, izris vaje, preverjanje odgovora (`checkPhase1`/`checkPhase2`), namig/rešitev na dotik, štetje rezultata. Za Pointing pair/triple, Box-line reduction, Swordfish, Turbot Fish, W-Wing, XY-Wing in Unique Rectangle preverjanje kliče ustrezno funkcijo (`pointing()`, `boxLineReduction()`, `swordfish()`, `turbotFish()`, `wWing()`, `xyWing()`, `uniqueRectangle()`) iz `shared/engine.js` (zgradi začasno "desko" iz vaje in preveri, ali izbrane celice ustrezajo najdenemu vzorcu) namesto lastne kopije logike.
- `tests/` – avtomatski testi (Node, vgrajeni `node:test`).
  - `load-engine.js` – naloži `shared/engine.js` v Node (prek `node:vm`, brez sprememb motorja; po potrebi v isti kontekst še npr. `trening/generators.js`), prebere uganke iz `docs/uganke.md` in pretvarja stanje kandidatov v berljiv zapis in nazaj.
  - `turbot-fish.test.js` – testi tehnike Turbot Fish (Skyscraper, Zmaj z dvema vrvicama, pozicija brez vzorca) in rešljivosti vseh ugank iz `docs/uganke.md` (nova uganka tam je samodejno vključena). Testne pozicije so posnetki stanja med reševanjem pravih ugank, ne sestavljene na pamet.
  - `trening-wwing.test.js` – test generatorja vaj W-Wing (`genWWing`): 200 vaj s semenom; celici para sta edini bivalue celici s svojo masko in se ne vidita, povezava je močna, motor najde načrtovani vzorec in nobenega drugega, tipa motilca se izmenjujeta in vsak spodleti pri natanko enem pogoju.
  - `trening-turbot.test.js` – test generatorja vaj Turbot Fish (`genTurbotFish`): 200 vaj s semenom (ponovljivo); motor najde načrtovani vzorec in nobenega drugega, podtipa se izmenjujeta, moteči vzorec spodleti pri natanko enem pogoju.
  - `w-wing.test.js`, `xy-wing.test.js` – testi tehnik W-Wing in XY-Wing po istem vzorcu kot `turbot-fish.test.js` (pozicije so posnetki stanja med reševanjem ugank iz `docs/uganke.md`). XY-Wing ima lasten test, ker ga `solve()` od uvedbe W-Wing pri nobeni od teh ugank ne izvede več.
- `tools/` – pomožna orodja (niso del aplikacije).
  - `analiziraj-zbirko.js` – analiza izvožene zbirke ugank glede na pokritost tehnik v `docs/uganke.md`: za vsako uganko požene `countSolutions()` in `solve()`, izpiše sprožene tehnike ter označi, katere od njih so zdaj nepokrite (0 ugank) ali šibko pokrite (1 uganka), in na koncu predlaga najmanjši nabor ugank, ki zapre največ vrzeli.
- `docs/uganke.md` – preverjene testne uganke z opisom obnašanja reševalca (razdelek »Pokritost tehnik« pove, katere tehnike so slabo pokrite); `docs/tehnike.md` – tabela tehnik iz `ALL_TECHNIQUES`.
- `docs/naloge/` – specifikacije posameznih nalog/popravkov za to sejo (naloga na datoteko, oštevilčeno).
- `old/` – arhiv starejših verzij treninga pred refaktoriranjem (zunaj projekta, ni v gitu).
- `CLAUDE.md` – ta datoteka.

Opomba: `trening/generators.js` sam sestavlja umetne "vaje" (nabor kandidatov v eni ali dveh enotah oz. umetno 9×9 mrežo za X-Wing/Swordfish/XY-Wing/Unique Rectangle) – ne rešuje pravih ugank. Za Pointing pair/triple in Box-line reduction pri sestavljanju uporablja `BOXES`/`ROWS`/`COLS` iz `shared/engine.js` (za pravilno definicijo enot) in vsak sestavljeni primer pred vrnitvijo preveri s klicem `pointing()`/`boxLineReduction()` (da dejansko najde veljaven korak) – za te dve tehniki torej ni več neodvisen od `shared/`. Enako velja za XY-Wing in Unique Rectangle: ker ti dve delujeta na pravih odnosih "katera celica vidi katero" (`PEERS`, `boxOf`), generator sestavi celo 81-celično desko (prazne so samo celice vaje, ostale so "dane") in jo preveri s klicem `xyWing()`/`uniqueRectangle()`; zahteva se, da najde načrtovani vzorec in nobenega drugega – s tem je preverjeno tudi, da moteče celice res ne tvorijo veljavnega vzorca (pri XY-Wing trojica, kjer eno krilo ne vidi pivota; pri Unique Rectangle pravokotnik čez štiri bloke namesto čez dva). Enako je sestavljena vaja za Turbot Fish (preverjena s `turbotFish()`, prikaz cele mreže 9×9 z označeno številko): sode vaje so Skyscraper, lihe Zmaj z dvema vrvicama; moteči vzorec (en na vajo) spodleti pri natanko enem pogoju – bodisi se konca povezav ne vidita bodisi ena od povezav ni močna (tretja celica z d) – kar preverja `tests/trening-turbot.test.js`. Enako je sestavljena vaja za W-Wing (preverjena s `wWing()`, prikaz cele mreže 9×9): pravi vzorec in motilec uporabljata ločeni dvojici števk, zato se ne moreta motiti; sode vaje imajo motilca, kjer se celici para vidita, lihe takega, kjer ima enota povezave tretjo celico z vezno števko (brez nje bi motor vzorec našel) – kar preverja `tests/trening-wwing.test.js`. Generatorji za očitno/skrito paro in trojico sestavijo vajo sami (nabor kandidatov v eni enoti), na koncu pa iz nje prav tako zgradijo 81-celično desko in s klicem `nakedPairs()`/`hiddenPairs()`/`nakedTriples()`/`hiddenTriples()` poberejo sporočilo koraka (shranjeno kot `solutionMessage`, prikaže ga `trening.js`); ujemanje mora biti po celicah, številkah **in** enoti koraka (polje `unit`), ker so na taki deski celice vaje edine prazne v svojem bloku in motor tam najde tudi vzorce, ki jih vaja ne prikazuje. Preverjanje odgovora pri teh štirih tehnikah ostaja lastno (glej `checkPhase1`) – ravno zaradi teh dodatnih vzorcev bi ga prevzem motorja oslabil. Neodvisna od `shared/` ostajata samo generatorja za X-Wing in Swordfish. `trening/trening.js` pa za preverjanje odgovora pri Pointing, Box-line reduction in Swordfish vajah `shared/engine.js` uporablja (glej zgoraj).

## Zagon in testi
- Zagon reševalca: odpri `app/index.html` neposredno v brskalniku, ali iz korena projekta poženi lokalni strežnik (npr. `python -m http.server`) in obišči `http://localhost:<vrata>/app/`.
- Zagon treninga: enako, `trening/index.html`.
- Zagon testov: iz korena projekta `node --test "tests/*.test.js"` (Node 24 ne sprejme mape kot argumenta, zato vzorec datotek v narekovajih). Testi uporabljajo samo Node-ov vgrajeni `node:test`/`node:assert` – brez `package.json` in odvisnosti. Popoln posnetek obnašanja reševalca iz `docs/naloge/02-regresijski-testi.md` še ni napisan.
- Analiza izvožene zbirke ugank: iz korena projekta `node tools/analiziraj-zbirko.js <pot-do-zbirke.md>` (datoteka, ki jo da gumb »Zbirka« → »Izvozi« v `app/`; bere tudi `docs/uganke.md`). Z zastavico `--najdene` pri vsaki uganki našteje še tehnike, ki jih `solve()` ne uporabi, a jih njihova funkcija v kakem vmesnem stanju najde (počasneje). Orodje pove, katero uganko iz zbirke se splača dodati v `docs/uganke.md` in katere ne prispevajo nič novega – uporabi ga, preden dodaš novo testno uganko.
- Okolje: Windows 10, VS Code. Če projekt uporablja Python: uporabljaj conda okolje `py312_env` (Python 3.12). Pred zagonom preveri `python --version`; če ni 3.12, zaganjaj prek okolja (npr. `conda run -n py312_env python ...`).

## Arhitektura
- Logika tehnik (iskanje vzorcev, izločanje kandidatov) je samo v `shared/`. `app/` in `trening/` jo le kličeta – logike ne podvajaj.
- Vsaka tehnika ima definicijo na enem mestu:
  - V reševalcu (`app/`): en vnos `[ime, funkcija]` v `ALL_TECHNIQUES` v `shared/engine.js`.
  - V treningu (`trening/`): en vnos v `MODES` v `trening/generators.js` (generator vaje + `selClass`/`hlClass`/`btnClass`/`pickN`/`desc`/`showCandidateCount` ipd.). Gumb »Pokaži število kandidatov« je viden natanko takrat, ko ima tehnika `showCandidateCount:true` (trenutno pri vseh razen X-Wing, Swordfish in Turbot Fish) – glej `docs/naloge/01-swordfish-gumb.md`.
- Vrstni red tehnik v reševalcu (`ALL_TECHNIQUES` v `shared/engine.js`): Gol enojček → Skriti enojček → Naked pair → Pointing pair/triple → Box-line reduction → Hidden pair → Naked triple → Hidden triple → X-Wing → Turbot Fish (podtipa Skyscraper in Zmaj z dvema vrvicama; samo močne povezave v vrsticah in stolpcih, podtip je v sporočilu, ne v imenu tehnike) → Swordfish → W-Wing → XY-Wing → Unique Rectangle → (če nič od tega ne najde koraka) sestopanje/forcing chain (`tryBifurcation`). Tehnike so razvrščene po tem, kako težko jih človek opazi pri ročnem reševanju (od najlažje opaznih k najzahtevnejšim), ker reševalec služi kot pomoč, ko se pri ročnem reševanju ustavim – naslednji korak naj bo tisti, ki bi ga človek najverjetneje našel sam. Zato je npr. Pointing/Box-line (pregled ene številke, kot pri skritem enojčku) pred skrito paro (dve številki hkrati), Turbot Fish (ena številka, štiri celice) pa pred Swordfish. Unique Rectangle je zadnji, ker sklepa iz predpostavke, da ima uganka eno rešitev. Nove tehnike dodajaj na konec, razen če izrecno zahtevam drugače.
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
- Po vsakem commitu naredi tudi `git push` (trenutna veja na `origin`). Če push ne uspe (npr. oddaljeni repozitorij ni nastavljen ali zahteva prijavo), mi pokaži napako – ne uporabljaj `--force` in ne spreminjaj nastavitev oddaljenega repozitorija brez vprašanja.

## Izrazi
| Slovensko | Angleško |
|---|---|
| Očitna para / trojica | Naked Pair / Triple |
| Skrita para / trojica | Hidden Pair / Triple |
| blok | box |
| celica z dvema kandidatoma | bivalue cell |
| pivot, krilo (XY-Wing) | pivot, pincer |
| smrtonosni vzorec (Unique Rectangle) | deadly pattern |
