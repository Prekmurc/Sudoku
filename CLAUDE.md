# Sudoku – navodila za Claude Code

Tu so pravila dela, kratek pregled, ukazi, arhitekturna pravila, zemljevid datotek in kazalo dokumentov. Podroben opis
vsake datoteke je v `docs/opis/` – preberi opis področja, preden ga spreminjaš (»Kazalo dokumentov« na koncu).

## O projektu
Projekt ima tri aplikacije s skupno kodo:

1. **Reševalec** (`app/`) – vnos uganke, reševanje po korakih z razlago, grafični prikaz mreže in kandidatov.
2. **Trening tehnik** (`trening/`) – način »Spoznaj« (sestavljene vaje) in način »Vadi v uganki« (pravo stanje uganke, v katerem je naslednji korak izbrana tehnika – del 6, `docs/vadi-v-uganki-nacrt.md`) – vaje za tehnike: E1 Očitni enojček, E2 Skriti enojček, 1 Izločitev izven bloka, 2 Izločitev v bloku, 3 Očitni par, 4 Skriti par, 5 Očitna trojica, 6 Skrita trojica, 7 X-krilo, 8 Mečarica, 9 Veriga ene števke (podtipa Nebotičnik in Zmaj z dvema vrvicama), 10 W-krilo, 11 XY-krilo, 12 Edinstveni pravokotnik, 13 XY-veriga (ekspertna raven, od 2026-10-08 – `docs/xy-veriga-nacrt.md`) (imena iz `imeTehnike()` v `shared/engine.js`).
3. **Igra** (`igra/`) – igralna površina: uganko rešujem sam, reševalec pomaga, ko obtičim (narejene so vse tri faze načrta: 1 – igralna osnova, 2 – »Naslednji korak« in »Preveri«, 3 – seznami manjkajočih števk).

Skupna koda (mreža, kandidati, logika tehnik) je v `shared/`.

## Pravila dela
- Pred vsako večjo spremembo predlagaj načrt in počakaj na potrditev.
- Pri napakah najprej poišči vzrok in mi ga razloži, šele nato popravljaj.
- Spreminjaj samo tisto, kar zahteva naloga. Če opaziš drugo težavo, jo navedi v povzetku, ne popravljaj je.
- Obnašanja obstoječih tehnik ne spreminjaj brez izrecne zahteve.
- Novih knjižnic in odvisnosti ne dodajaj brez vprašanja.
- Sudoku ugank in testnih pozicij ne sestavljaj na pamet. Vsaka uganka mora biti preverjena s programom (natanko ena rešitev).
- Besedila v uporabniškem vmesniku so v slovenščini.
- Odgovori Darku v slovenščini.
- Na koncu naloge napiši povzetek: spremenjene datoteke, kaj je narejeno, kaj naj ročno preverim.
- Pri vsaki nalogi preveri avtomatsko vse, kar se da: testi (sprotno hitri `node --test "tests/*.test.js"`, pred commitom vsi `node --test "tests/**/*.test.js"` – pri commitu, ki spremeni samo `CLAUDE.md` ali dokumente v `docs/`, hitri; izjema in dokumenti, ki jih berejo počasni testi, so v razdelku »Zagon in testi«), posnetek igre (`tools/posnetek-igre.js --primerjaj`) in brskalnik brez glave (`tools/brskalnik.js` ali scenarij naloge). Ročni seznam za Darka ima **največ 5 točk**; pri vsaki: kje (igra/reševalec/trening), kaj narediti, pričakovan izid in zakaj ni avtomatsko. Stalni ročni pregledi so v `docs/rocni-test.md`.
- **Nikoli ne ustavljaj brskalnika po imenu procesa** (`taskkill /IM msedge.exe`, `Stop-Process -Name msedge` ipd.) – to zapre tudi Darkov Edge. Ustavljaj samo procese z lastnim profilom orodja (`tools/brskalnik.js` `zapri()` ustavi procese svojega začasnega profila); če se orodje zatakne, poišči PID po ukazni vrstici s tem profilom.
- **Pred commitom, ki spremeni aplikacijo** (`app/`, `igra/`, `trening/`, `shared/`), se oznaka različice osveži: pre-commit hook (`tools/hooks/pre-commit`) ali ukaz `node tools/oznaci-razlicico.js`. Če hook ni vklopljen, `tests/razlicica.test.js` pade in pove ukaz.
- Po vsakem commitu naredi tudi `git push` (trenutna veja na `origin`). Če push ne uspe (npr. oddaljeni repozitorij ni nastavljen ali zahteva prijavo), mi pokaži napako – ne uporabljaj `--force` in ne spreminjaj nastavitev oddaljenega repozitorija brez vprašanja.

**Postopek naloge**
- Načrt naloge zapiši v `docs/<naloga>-nacrt.md` z odločitvami in koraki; načrt je ločen pogovor in čaka na moj OK –
  kode pred potrditvijo načrta ne spreminjaj. Načrt brez prototipov in meritev časa, razen če to izrecno zahtevam.
- Izvedba je **en pogovor**: vse korake naredi zapored, po vsakem koraku commit in push, brez ustavljanja. Ustavi se
  samo ob nepričakovani težavi (spodaj).
- Najprej test, ki na stari kodi pade, nato sprememba.
- Stare scenarije v brskalniku (`tools/preveri-*-brskalnik.js`) poženi samo, če delo spremeni njihovo področje; scenarij
  naloge vedno.
- Na koncu eno kratko poročilo (kaj je narejeno, testi, odstopanja) in seznam za en ročni pregled – ročni pregled je
  en sam, na koncu naloge.
- Majhen popravek samo v slogu (CSS, brez sprememb JS in HTML): od preverjanj v brskalniku poženi samo scenarij, ki
  pokriva spremenjeno mesto; pri igri še posnetek igre. Vsi testi pred commitom ostanejo.
- Ob nepričakovanem izidu testa ali primerjave se ustavi in poročaj, kadar izid kaže na napako v aplikaciji ali vzroka
  ne znaš pojasniti. Če je vzrok dokazano v napovedi načrta ali v pomožni skripti, nadaljuj in to zapiši v poročilo.

**Opisi datotek in ta datoteka**
- Pred spremembo preberi opis področja v `docs/opis/` (»Kazalo dokumentov«). Dokumentov ne uvažaj z `@` – tako bi se nalagali ob vsakem pogovoru.
- Ko spremeniš datoteko, posodobi njen opis v `docs/opis/` (ne v `CLAUDE.md`); nova datoteka dobi vrstico v zemljevidu spodaj in opis v `docs/opis/`. Posodobljeni opisi so v povzetku naloge med spremenjenimi datotekami.
- Opis v `docs/opis/` pove trenutno stanje; zgodovine sprememb ne dopisuj (je v načrtu naloge in v gitu). Ob spremembi datoteke zastarele dele opisa zamenjaj, ne dodajaj.
- `docs/opis/testi.md` in `docs/opis/orodja.md` beri po razdelkih ali poišči ime datoteke; ne beri ju v celoti.
- `CLAUDE.md` ima samo pravila, ukaze, zemljevid in kazalo; največ 25.000 znakov.

**Pravila iz opisov** (prvotno besedilo je v `docs/opis/`)
- Tipkovnica: posnetek igre in testi pošiljajo tipke po QWERTY, Darko uporablja slovensko QWERTZ (Z in Y sta zamenjana – tipka Z ima `key: 'z'`, `code: 'KeyY'`; Shift+števka da `key` `!`, `"`, `#` …, `code` pa `Digit1` …), zato bližnjice s črkami in Shift+števka vedno preveri tudi s pari `key`/`code` za QWERTZ.
- Ob vsaki spremembi motorja (`shared/engine.js`) ali generatorja (`shared/generator.js`) – vrstni red ali nova tehnika, pogoji stanj, `genMinimalnaUganka()` – ustvari znova banko vaj (`node tools/ustvari-banko-vaj.js`, pribl. 27 min) in commitaj novo `shared/vaje-banka.js`, nato še `node tools/izberi-vaje-po-shemi.js --zapisi` (semena `PRESEK_PO_SHEMI` v `trening/generators.js`). Če test banke (`tests/pocasni/vaje-banka.test.js`) ali semen (`tests/pocasni/trening-po-shemi.test.js`) pade, datotek in testa ne popravljaj ročno.
- Vgrajene primere `PRIMERI` (`shared/zbirka.js`) izbere `node tools/izberi-primere.js` – ročno se ne sestavljajo; ponovi ga ob novi tehniki ali spremembi motorja ali generatorja.
- Posnetka `tests/posnetki/*.json` (`node tests/izris-korakov.js --shrani`, `node tests/stopnje-ugank.js --shrani`) in izhodišče posnetka igre zapiši na novo samo ob namerni spremembi izrisa, ocene oziroma igre.
- Besedila za uporabnika (varujejo `tests/trening-tehnike.test.js`, `besedila-html`, `locila`, `izrazi`): glagol »izbriši« (ne »odstrani«, »izloči« – razen v imenih tehnik), druga oseba ednine (»izbrišeš«), števila z besedo (»dve celici«; sprotna števila s številko), pari v zavitih oklepajih s presledkom ({3, 8}), »enota« in »vidi« razložena ob prvi omembi pri tehniki, brez omembe drugih aplikacij; izraz je povsod »števka«, »dane števke« (ne »danosti«), »kljukica« (ne »stikalo«), »Pokaži« (ne »Prikaži«); ločila » – «, »…« (narekovaji), tropičje »…«, »→«; brez razvijalskih podrobnosti (poti, imena datotek, `localStorage`, `file://`, lokalni strežnik).
- Skripte za urejanje z regularnimi izrazi ali poševnicami ne piši v heredoc lupine (podvojene poševnice postanejo enojne), ampak v datoteko.

## Zagon in testi
- Zagon reševalca: odpri `app/index.html` neposredno v brskalniku, ali iz korena projekta poženi lokalni strežnik (npr. `python -m http.server`) in obišči `http://localhost:<vrata>/app/`.
- Zagon treninga: enako, `trening/index.html`.
- Zagon igre: enako, `igra/index.html`. Zbirko ugank si igra deli z reševalcem prek `localStorage` – zanesljivo samo, ko obe tečeta z istega izvora (lokalni strežnik); pri `file://` jo nekateri brskalniki ločijo po datotekah.
- Testi (iz korena; Node 24 ne sprejme mape kot argumenta, zato vzorec datotek v narekovajih): **hitri** `node --test "tests/*.test.js"` (pribl. 1 min, za sprotno delo), **vsi** `node --test "tests/**/*.test.js"` (pribl. 4 min, še počasni v `tests/pocasni/`). Med delom poganjaj hitre, posamezen počasen test pa, kadar se naloga dotika njegovega področja; **vse pred commitom/pushem**.
- **Izjema:** za commit, ki spremeni samo `CLAUDE.md` ali datoteke v `docs/` razen `docs/uganke.md`, zadoščajo hitri testi – počasni testi zunaj map s kodo berejo samo `docs/uganke.md`. Če nov počasen test bere kak dokument, ga dopiši k izjemi kot `docs/uganke.md`.
- Nov test gre med počasne, kadar sam traja več kot pribl. 10 s (pomožne datoteke nalaga z `require('../load-engine.js')`). Testi uporabljajo samo vgrajena `node:test`/`node:assert` – brez `package.json` in odvisnosti. Števila testov, trajanja in opis vsakega testa: `docs/opis/testi.md`.
- Posnetek igre: `node tools/posnetek-igre.js --primerjaj tools/posnetki/igra-po-xy-veriga.json` (trenutno izhodišče) – igra se mora obnašati enako; novo izhodišče z `--shrani` samo ob namerni spremembi igre.
- Brskalnik brez glave (Edge ali Chrome; knjižnica `tools/brskalnik.js`, scenariji `tools/preveri-*-brskalnik.js` – seznam s časi v `docs/opis/orodja.md`): uporabi ga pri vsaki spremembi UI za to, česar testi v nadomestnem DOM-u ne vidijo (postavitev, CSS, pravi dogodki); nov scenarij po vzoru `tools/preveri-niz-brskalnik.js`.
- Nova testna uganka samo z `node tools/ustvari-uganko.js <lahka|srednja|tezka|zelotezka|ekstrem> [--seme N] [--poskusov M]` (pri `srednja` s strogim merilom `--poskusov` nad 1000); preden jo dodaš v `docs/uganke.md`, poženi `node tools/analiziraj-zbirko.js` (pove, ali prispeva kaj novega).
- Okolje: Windows 11, VS Code. Če projekt uporablja Python: uporabljaj conda okolje `py312_env` (Python 3.12). Pred zagonom preveri `python --version`; če ni 3.12, zaganjaj prek okolja (npr. `conda run -n py312_env python ...`).

## Arhitektura
- Logika tehnik (iskanje vzorcev, izločanje kandidatov) je samo v `shared/`; aplikacije jo le kličejo – ne podvajaj je.
- Nova tehnika gre na konec (ekspertne za naprednimi), razen če izrecno zahtevam drugače. Vnosi: `ALL_TECHNIQUES` (`[ime, funkcija]`), natanko ena raven v `RAVNI_TEHNIK` (na istem mestu kot v `ALL_TECHNIQUES`), skupina v `TECHNIQUE_GROUPS`, `TRENING_TEHNIKE` (na istem mestu – edino mesto številk tehnik; številke niso shranjene nikjer), `TEHNIKE_OPISI` (vsa polja) – vse v `shared/engine.js` –, `MODES` v `trening/generators.js`, kartica v `trening/index.html`, po potrebi shema v `shared/sheme.js`. Varujejo `tests/trening-tehnike.test.js`, `tests/ravni-tehnik.test.js` in `tests/pocasni/generator.test.js`.
- Vrstni red tehnik: E1 Očitni enojček → E2 Skriti enojček → 1 Izločitev izven bloka → 2 Izločitev v bloku → 3 Očitni par → 4 Skriti par → 5 Očitna trojica → 6 Skrita trojica → 7 X-krilo → 8 Mečarica → 9 Veriga ene števke → 10 W-krilo → 11 XY-krilo → 12 Edinstveni pravokotnik → 13 XY-veriga → (če nič ne najde koraka) poskus in protislovje (`tryBifurcation`). Ravni: lahka E1–E2, srednja 1–6, napredna 7–12, ekspertna 13; znotraj ravni po zahtevnosti (`docs/tehnike.md`). Sprememba vrstnega reda spremeni dnevnike `solve()` – posodobi `docs/uganke.md` (pokritost in zgodovina ugank).
- Zapis celic v razlagah: `V<vrstica>S<stolpec>`, npr. `V5S3` (`cellLabel`/`cellsLabel`).
- Edini viri (ne podvajaj): ime tehnike za uporabnika samo `imeTehnike()` (ključi `ALL_TECHNIQUES` so notranji); sklanjanje po številu samo `sklanjaj()`; besedila tehnik samo `TEHNIKE_OPISI`; raven tehnike samo `RAVNI_TEHNIK`; opisi stopenj samo `STOPNJE_UGANK` (ne v HTML), ime stopnje je hkrati težavnost v `TEZAVNOSTI`; paleta barv samo v `:root` v `shared/base.css` – aplikacija je ne definira znova (`tests/css-paleta.test.js`).
- Ključi shrambe (`localStorage`) se ne spreminjajo: `sudoku.zbirka.v1` (zbirka), `sudoku.igra.v1` (shranjene igre – piše samo igra, `shared/` samo pri brisanju), `sudoku.igra.seznami`, `sudoku.igra.kandidati` (bere samo igra), `sudoku.igra.poud` (barve poudarka – nastavlja igra, trening jih samo bere), `sudoku.igra.stopnja`, `sudoku.trening.seznami`, `sudoku.trening.zadnja` (zadnja vadena tehnika – samo trening), `sudoku.zbirka.filtri` (filtri in razvrščanje v oknu zbirke – skupen igri in reševalcu).

## Zemljevid datotek
Ena vrstica na datoteko aplikacije; podroben opis je v `docs/opis/`. Skripte in slogi se naložijo v vrstnem redu iz `index.html` aplikacije (`shared/` pred aplikacijo).

- `shared/` – skupna osnova za vse tri aplikacije (`app/`, `trening/`, `igra/`).
  - `engine.js` – motor: enote (`ROWS`/`COLS`/`BOXES`/`PEERS`), `Board`, tehnike, `ALL_TECHNIQUES`, `RAVNI_TEHNIK`, `TECHNIQUE_GROUPS`, `nextStep()`, `solve()`, `solutionOf()`, `countSolutions()`, `xyChain()`, `imeTehnike()`, `oznakaTehnike()`, `redTehnike()`, `TEHNIKE_OPISI`, `TRENING_TEHNIKE`/`TRENING_ENOJCKA`, `tagClass()`, `stepHint()`, `sklanjaj()`
  - `generator.js` – stopnje `STOPNJE_UGANK`/`STOPNJE_GENERATORJA`, ravni `GEN_*`, ocena `oceniTezavnost()`/`oceniUganko()` (`genMerePoti()`), generator `ustvariUganko()`, `genMinimalnaUganka()`
  - `stanje.js` – stanje igre brez DOM-a: poteze in kazalec, `stanjeIgre()`, `dodajPotezo()`, `mozneAkcije()`, začetne poteze `igraZZacetkom()`, `prvaNapaka()`, `dejanjaKoraka()`, `manjkajoceVEnotah()`
  - `vaje-uganka.js` – vaje »Vadi v uganki« brez DOM-a: `stanjaVUganki()`, `vajaIzStanja()`, `preveriVajo()`, `obmocjeKoraka()`, `izberiIzBanke()`, `preveriEnojcek()`, `namigEnojcka()`
  - `vaje-banka.js` – banka vaj `VAJE_BANKA` (ustvari jo orodje, ne ureja se ročno)
  - `zbirka.js` – zbirka ugank in njena shramba, izvoz/uvoz v Markdown, stanje uganke `zbirkaStanjeUganke()`, kartica `zbirkaKartica()`, `PRIMERI`, `TEZAVNOSTI`, polje Niz `zbirkaNizDanosti()`, brisanje, filtri in razvrščanje seznama (`zbirkaLastnostiZbirke()`, `zbirkaFiltriraj()`)
  - `zbirka-ui.js`, `zbirka.css` – izris kartice uganke `zbirkaIzrisiKartico()`, značka težavnosti, vezava »Izvozi«/»Uvozi«, odziv na spremembo v drugem zavihku, filtri nad seznamom `zbirkaUstvariFiltre()`
  - `mreza.js`, `mreza.css` – izris mreže `ustvariMrezo()` (kandidati, poudarek, oznake koraka, območje, zaznamki, delna mreža, robovi), `oznakeKoraka()`, seznami manjkajočih števk `ustvariSezname()`
  - `plosca.js`, `plosca.css` – igralna plošča `ustvariPlosco()`: izbira, nizi, poteze, poudarki, senčenje, zaznamki, stikalo kandidatov, tipkovnica `obTipki()`; barve poudarka iz nastavitev igre
  - `pomoc.js`, `pomoc.css` – okno Pomoč `ustvariPomoc()`, razdelek »Tehnike« `izrisiTehnike()`, stopnje; slogi oken `.dialog*` in shem
  - `sheme.js` – sheme vzorca tehnik 1–13 `SHEME_TEHNIK`, `izrisiShemo()`, `svgSheme()`
  - `navigacija.js` – kazalo tehnik, gumb »Na vrh«, zavihki med aplikacijami z vprašanjem pred odhodom
  - `base.css` – reset, skupna paleta, skupne sestavine (glava, kartica, gumbi, oznake `.tag.t-*`), zavihki, kazalo tehnik
- `app/` – reševalec: `index.html`; `app.js` (vnos, konflikti, `solve()`, rešitev, koraki, mala mreža, povečava, polje Niz, primeri); `zbirka.js` (samodejno shranjevanje, okno zbirke); `app.css`
- `trening/` – `index.html` (meni s karticami); `trening.js` (meni, tok vaje »Spoznaj«, Namig/Rešitev, štetje, legenda, razdelka Razlaga in Shema); `v-uganki.js` (»Vadi v uganki«); `izbris.js` (2. faza »Spoznaj« – izbris); `generators.js` (`MODES`, generatorji vaj, vaje po shemi `genPoShemi()`); `trening.css`
- `igra/` – `index.html`; `igra.js` (igra in stanje, shranjevanje, »Naslednji korak«/»Preveri«, kartica »Uganka«, zbirka, Nova uganka, Oceni zbirko, barve poudarka); `shramba.js` (`igraShrani()`, `igraIzZapisa()`); `generator-worker.js`, `oceni-worker.js` (delavca za »Ustvari uganko« in »Oceni zbirko«); `igra.css`
- `tests/` – hitri testi v korenu, počasni v `pocasni/`; pomožne `load-engine.js` (motor v Node), `dom-stub.js` (nadomestni DOM), `odgovor-spoznaj.js`, `pomoc-stikali.js`, `besedila-js.js`, `xy-veriga-neodvisno.js`; posnetki v `posnetki/` – opis v `docs/opis/testi.md`
- `tools/` – `brskalnik.js` in scenariji `preveri-*-brskalnik.js`, `posnetek-igre.js` (izhodišča v `tools/posnetki/`), `ustvari-banko-vaj.js`, `izberi-vaje-po-shemi.js`, `izberi-primere.js`, `ustvari-uganko.js`, `analiziraj-zbirko.js`, `meri-trening-v-uganki.js`, `oznaci-razlicico.js` (s pre-commit hookom v `tools/hooks/`) – opis v `docs/opis/orodja.md`
- `docs/` – dokumenti (kazalo spodaj); `docs/opis/` opisi datotek, `docs/naloge/` specifikacije nalog, `docs/slike/` posnetki k načrtom
- `index.html` (koren) preusmeri na igro; `razlicica.json` – oznaka različice (`tools/oznaci-razlicico.js`)
- `CLAUDE.md` – ta datoteka.

## Kazalo dokumentov
Pri nalogi najprej preberi dokument področja (poti so besedilo, ne uvoz):

| Naloga | Preberi najprej |
|---|---|
| nova tehnika, motor, ocena stopnje, generator ugank | `docs/opis/motor.md`; nato `docs/opis/trening.md` (vaja, `MODES`), `docs/opis/orodja.md` (banka, primeri, semena), `docs/opis/testi.md` (motor in ocena) |
| trening – »Spoznaj«, »Vadi v uganki«, meni | `docs/opis/trening.md`; pri mreži in plošči še `docs/opis/skupni-prikaz.md`; pri vajah iz uganke še `docs/opis/motor.md` (`vaje-uganka.js`) |
| igra | `docs/opis/igra.md`, `docs/opis/skupni-prikaz.md` (mreža, plošča), `docs/opis/stanje-zbirka.md` |
| reševalec | `docs/opis/resevalec.md`, `docs/opis/stanje-zbirka.md` (zbirka) |
| zbirka, izvoz/uvoz, stanje uganke, vgrajeni primeri | `docs/opis/stanje-zbirka.md` |
| videz, barve, CSS | `docs/opis/skupni-prikaz.md` (`base.css` – paleta) in opis aplikacije |
| besedila, okno Pomoč | `docs/opis/skupni-prikaz.md` (`pomoc.js`), `docs/opis/motor.md` (`TEHNIKE_OPISI`), `docs/opis/testi.md` (besedila) |
| testi | `docs/opis/testi.md`, razdelek področja |
| brskalnik brez glave, scenarij, posnetek igre | `docs/opis/orodja.md` |
| vrstni red nalog, odločitve, »Kasneje« | `docs/uskladitev.md` |
| ročni pregled | `docs/rocni-test.md` |
| testne uganke, tabela tehnik | `docs/uganke.md`, `docs/tehnike.md` |
| zgodovina naloge | `docs/opis/dokumenti.md` → načrt naloge |

## Izrazi
| Slovensko | Angleško |
|---|---|
| Očitni par / Očitna trojica | Naked Pair / Triple |
| Skriti par / Skrita trojica | Hidden Pair / Triple |
| blok | box |
| celica z dvema kandidatoma | bivalue cell |
| pivot, krilo (XY-Wing) | pivot, pincer |
| smrtonosni vzorec (Unique Rectangle) | deadly pattern |
