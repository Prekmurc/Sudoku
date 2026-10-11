# Skrajšanje CLAUDE.md (naloga 6a) – načrt

Načrt 2026-10-11 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 6a).
**Stanje: čaka potrditev.** Koda se ne spreminja (ne v tej nalogi ne v načrtu).

Izhodišče: commit `a71e67f` (zapis naloge 6b v vrstni red).

**Cilj.** `CLAUDE.md` se naloži ob vsakem pogovoru, zato naj v njem ostane samo tisto, kar je potrebno vedno: pravila
dela, kratek pregled treh aplikacij, ukazi za teste in kazalo dokumentov. Ciljna velikost: okoli desetine sedanje
(pribl. 25.000 znakov). Podrobni opisi datotek gredo v nove dokumente v `docs/opis/`, ki jih preberem, kadar naloga
zadeva njihovo področje.

Številke v razdelku 1 in v tabeli 3.2 so **izmerjene** s skripto na `CLAUDE.md` v izhodišču (znaki = kodne točke Unicode,
skupaj s prelomi vrstic); velikosti novega `CLAUDE.md` v 3.1 so ocena.

## 0. Povzetek

- `CLAUDE.md` ima **246.779 znakov** (255.753 bajtov, 205 vrstic). **94 %** je razdelek »Struktura« – opisi
  posameznih datotek (vsaka postavka je ena dolga vrstica, največja ima 12.669 znakov).
- Predlog: opisi datotek gredo **dobesedno** (brez spremembe besedila) v devet dokumentov `docs/opis/*.md`, razvrščenih
  po področjih (motor, skupni prikaz, stanje in zbirka, reševalec, trening, igra, testi, orodja, dokumenti).
- Nov `CLAUDE.md` ima **pribl. 19.500 znakov** (8 % sedanjega): pravila dela (vsa – tudi tista, ki so zdaj raztresena
  po opisih datotek, razdelek 4), kratek pregled aplikacij, ukaze, arhitekturna pravila, zemljevid datotek (ena
  vrstica na datoteko aplikacije) in kazalo »pri kateri nalogi kateri dokument«.
- Nobenega pravila ne izgubimo: razdelek 4 ima vseh 47 pravil prej in potem; prenos preveri skripta (vsako besedilo
  starega `CLAUDE.md` je natanko enkrat v `docs/opis/` ali dobesedno v novem `CLAUDE.md`).
- Vsebine `CLAUDE.md` danes ne bere noben test ali orodje (razdelek 2); predlagam nov hiter test – varovalo velikosti
  in kazala (O4).
- Trije koraki (razdelek 6), ročni pregled dve točki (razdelek 7), sedem odločitev (razdelek 8).

## 1. Kako je zdaj

### 1.1 Razdelki

| Razdelek | Znakov | Delež | Vsebina |
|---|---:|---:|---|
| naslov | 36 | 0,0 % | |
| »O projektu« | 1.079 | 0,4 % | tri aplikacije, seznam tehnik, `shared/` |
| »Struktura« | 232.282 | 94,1 % | opis vsake datoteke v `shared/`, `app/`, `trening/`, `igra/`, `tests/`, `tools/`, seznam dokumentov, opomba o generatorjih vaj |
| »Zagon in testi« | 6.621 | 2,7 % | zagon aplikacij, ukazi in pravilo testov, brskalnik brez glave (seznam 18 scenarijev), QWERTZ, banka vaj, nova uganka, okolje |
| »Arhitektura« | 4.243 | 1,7 % | logika v `shared/`, kje je definicija tehnike, vrstni red tehnik, zapis celic |
| »Pravila dela« | 2.202 | 0,9 % | 13 pravil |
| »Izrazi« | 317 | 0,1 % | tabela slovensko–angleško |
| **skupaj** | **246.779** | | |

Groba ocena (ne meritev): to je okoli 70–85 tisoč žetonov ob vsakem pogovoru.

### 1.2 »Struktura« po mapah

| Del | Znakov | Delež vsega | Največje postavke |
|---|---:|---:|---|
| `shared/` (17 datotek) | 62.290 | 25,2 % | `zbirka.js` 12.669, `engine.js` 6.748, `generator.js` 5.954, `plosca.js` 5.806, `sheme.js` 5.011 |
| `tests/` (62 datotek) | 56.247 | 22,8 % | `igra-ui` 3.687, `trening-izbris` 3.438, `trening-po-shemi` 3.431, `generator` 2.845 |
| `tools/` (32 datotek) | 43.501 | 17,6 % | `preveri-navigacija-` 4.368, `preveri-izbris-` 3.194, `preveri-vadi-` 3.171, `preveri-faza7-` 2.655 |
| `trening/` (6 datotek) | 36.310 | 14,7 % | `trening.js` 11.613, `generators.js` 7.645, `v-uganki.js` 6.422, `izbris.js` 4.698 |
| `igra/` (6 datotek) | 18.215 | 7,4 % | `igra.js` 12.043, `index.html` 3.929 |
| `app/` (4 datoteke) | 6.660 | 2,7 % | `app.js` 2.391, `app.css` 2.139 |
| seznam dokumentov `docs/` | 5.653 | 2,3 % | `rocni-test.md` 641, `naloga6-nacrt.md` 537 |
| opomba o generatorjih vaj | 3.131 | 1,3 % | |
| drugo (`old/`, `index.html`, `CLAUDE.md`, naslov) | 275 | 0,1 % | |

V `CLAUDE.md` je omenjena vsaka od 127 datotek v `app/`, `igra/`, `trening/`, `shared/`, `tests/` in `tools/`
(brez posnetkov) – preverjeno z iskanjem imena vsake datoteke.

### 1.3 Kaj je v opisih

Opisi povedo, kaj je v datoteki (funkcije, polja, razredi CSS), kdo jo naloži in v kakšnem vrstnem redu, kaj preverja
kateri test, in veliko zgodovine (»od naloge 6«, »popravek po ročnem pregledu«, »na kodi pred popravkom pade 6 testov«).
Vmes so **pravila**, ki niso v razdelku »Pravila dela« (npr. »banka vaj se ne ureja ročno«, »ključa
`sudoku.igra.seznami` ne spreminjaj«, »skripte za urejanje ne piši v heredoc«) – razdelek 4 jih našteje.

Nekaj podatkov je zastarelih, ker se ob spremembi ne popravijo vsi: »hitri 774 testov, vsi 958« (2026-10-11 hitrih
792), »Okolje: Windows 10« (sistem poroča Windows 11 Pro). Seznam dokumentov nima `docs/faza3a-nacrt.md`,
`faza4-nacrt.md`, `faza6-nacrt.md`, `faza6-besedila.md`, `faza6-pomoc.md`, `faza7-nacrt.md` (o `uskladitev.md` in
`trening-v-uganki-nacrt.md` govori samo mimogrede).

## 2. Kdo bere CLAUDE.md

| Kdo | Kaj | Po nalogi |
|---|---|---|
| Claude Code | naloži ga ob vsakem pogovoru, skupaj z `MEMORY.md` | nov `CLAUDE.md`; dokumentov v `docs/opis/` ne naloži sam – **zato v `CLAUDE.md` ne sme biti uvoza z `@pot`** (ta bi jih spet naložil vedno), samo poti kot besedilo |
| `tests/kontrolni-znaki.test.js` | vse datoteke `.md` (tudi `CLAUDE.md`) – samo kontrolni znaki, ne vsebina | enako; nove `docs/opis/*.md` pregleda sam |
| `tools/oznaci-razlicico.js`, pre-commit hook | zgoščena vrednost samo `app/`, `igra/`, `trening/`, `shared/` | `CLAUDE.md` in `docs/` nista v njej – oznaka različice se ne spremeni |
| drugi testi in orodja | vsebine `CLAUDE.md` ne bere nobeden (iskanje »CLAUDE« po `*.js`, `*.json`, `*.sh`) | po O4 nov test `tests/claude-md.test.js` |
| komentarji v kodi | `shared/engine.js:782` (»razpredelnica izrazov v CLAUDE.md«), `shared/generator.js:4` in `tests/pocasni/generator.test.js:5, 403` (»ugank ne sestavljamo na pamet«) | razdelek »Izrazi« in pravilo P6 ostaneta – komentarji ostanejo pravilni, koda se ne spremeni |
| `docs/uganke.md` | »glej pravila dela v `CLAUDE.md`«, »`CLAUDE.md`, razdelek Arhitektura« | oba razdelka ostaneta – `docs/uganke.md` se ne spremeni (sprememba bi zahtevala vse teste) |
| drugi dokumenti v `docs/` | 56 sklicev v 22 dokumentih (»opis v `CLAUDE.md`«, »`CLAUDE.md`, Zagon in testi«) | to je zgodovina (stanje ob nalogi; stari `CLAUDE.md` je v gitu) – ostanejo |

## 3. Predlog

### 3.1 Nov CLAUDE.md

| Razdelek | Vsebina | Znakov (ocena) |
|---|---|---:|
| naslov in uvod | ena poved: tu so pravila in kazalo, podrobnosti v `docs/opis/` | 250 |
| »O projektu« | **dobesedno** kot zdaj | 1.100 |
| »Pravila dela« | 13 pravil **dobesedno**, nato zbrana pravila iz drugih razdelkov (razdelek 4, skupine B–D) in nova N1–N3 | 5.500 |
| »Zagon in testi« | zagon aplikacij, ukaza in pravilo testov z izjemo, posnetek igre (trenutno izhodišče), brskalnik brez glave (ena vrstica, scenariji v `docs/opis/orodja.md`), QWERTZ, orodja, ki jih je treba pognati ob spremembi motorja, okolje | 2.500 |
| »Arhitektura« | logika samo v `shared/`; nova tehnika – seznam mest (`ALL_TECHNIQUES`, `RAVNI_TEHNIK`, `TECHNIQUE_GROUPS`, `TRENING_TEHNIKE`, `MODES`, kartica, `TEHNIKE_OPISI`); vrstni red tehnik v eni vrstici; zapis celic `V5S3`; edini viri (`imeTehnike()`, `sklanjaj()`, `RAVNI_TEHNIK`, `TEHNIKE_OPISI`, `STOPNJE_UGANK` = `TEZAVNOSTI`, paleta v `shared/base.css`); ključi shrambe in kdo piše vanje | 2.800 |
| »Zemljevid datotek« | ena vrstica na datoteko aplikacije (kaj je v njej, glavne funkcije); testi in orodja po skupinah | 4.500 |
| »Kazalo dokumentov« | tabela »naloga → dokument« (3.3), živi dokumenti, načrti nalog prek `docs/opis/dokumenti.md` | 2.500 |
| »Izrazi« | **dobesedno** kot zdaj | 300 |
| **skupaj** | | **≈ 19.500** |

Primer zemljevida (oblika, ne končno besedilo):

```
- `shared/` – skupna koda; aplikacija jo naloži pred svojo (vrstni red v `index.html`)
  - `engine.js` – motor: `Board`, enote, tehnike, `ALL_TECHNIQUES`, `RAVNI_TEHNIK`, `TECHNIQUE_GROUPS`,
    `nextStep()`, `solve()`, `imeTehnike()`, `TEHNIKE_OPISI`, `sklanjaj()`, `tagClass()`, `stepHint()`
  - `generator.js` – stopnje ugank `STOPNJE_UGANK`, ocena `oceniTezavnost()`, generator `ustvariUganko()`,
    `genMinimalnaUganka()`
  - `stanje.js` – stanje igre brez DOM-a (poteze, kazalec, `stanjeIgre()`, `prvaNapaka()`, začetne poteze)
  - `zbirka.js` – zbirka in njena shramba, izvoz/uvoz, stanje uganke, podatki kartice, `PRIMERI`, `TEZAVNOSTI`
  - `plosca.js`, `plosca.css` – igralna plošča: izbira, nizi, poteze, poudarki, zaznamki, tipkovnica
  …
- `trening/` – `trening.js` (meni, tok vaje »Spoznaj«), `v-uganki.js` (»Vadi v uganki«), `izbris.js` (2. faza),
  `generators.js` (`MODES`, generatorji vaj, vaje po shemi), `trening.css`, `index.html`
- `tests/` – hitri v korenu, počasni v `pocasni/`; pomožne `load-engine.js`, `dom-stub.js`, `odgovor-spoznaj.js`;
  posnetka v `posnetki/` – opis vsakega testa v `docs/opis/testi.md`
- `tools/` – `brskalnik.js` in scenariji `preveri-*-brskalnik.js`, `posnetek-igre.js`, orodja za banko, primere in
  semena – opis v `docs/opis/orodja.md`
```

### 3.2 Kam gre ostalo – `docs/opis/`

Vsak dokument ima na vrhu dve vrstici: »Opis trenutnega stanja; ob spremembi datoteke posodobi njen opis tukaj.
Do 2026-10-11 je bil ta opis v `CLAUDE.md`.« Postavke so **dobesedno** kot v `CLAUDE.md` (samo brez zamika
podpostavke), razvrščene pod podnaslove.

| Dokument | Kaj vsebuje (postavke iz zdajšnjega `CLAUDE.md`) | Znakov |
|---|---|---:|
| `docs/opis/motor.md` | `shared/engine.js`, `generator.js`, `vaje-uganka.js`, `vaje-banka.js`; razdelek »Arhitektura« v celoti | 22.510 |
| `docs/opis/skupni-prikaz.md` | `shared/base.css`, `mreza.js`, `mreza.css`, `plosca.js`, `plosca.css`, `pomoc.js`, `pomoc.css`, `sheme.js`, `navigacija.js` | 26.249 |
| `docs/opis/stanje-zbirka.md` | `shared/stanje.js`, `zbirka.js`, `zbirka-ui.js`, `zbirka.css` | 17.774 |
| `docs/opis/resevalec.md` | `app/` (4 datoteke) | 6.660 |
| `docs/opis/trening.md` | `trening/` (6 datotek) in opomba o generatorjih vaj | 39.441 |
| `docs/opis/igra.md` | `igra/` (6 datotek) | 18.215 |
| `docs/opis/testi.md` | `tests/` (vsak test), iz »Zagon in testi« podrobnosti zagona testov (števila, preverjanje izjeme na `e24738b`) in QWERTZ – razvrščeno po področjih: motor in ocena, trening, igra, reševalec, zbirka, skupni prikaz, besedila in CSS, splošno | 58.168 |
| `docs/opis/orodja.md` | `tools/` (vsako orodje), iz »Zagon in testi« brskalnik brez glave (seznam scenarijev s časi), banka vaj, nova testna uganka, analiza zbirke – razvrščeno: brskalnik in scenariji, posnetek igre, orodja za podatke | 47.492 |
| `docs/opis/dokumenti.md` | seznam dokumentov v `docs/` (tudi `old/`, `index.html` v korenu), dopolnjen z manjkajočimi (1.3) | 5.928 |
| **skupaj** | | **242.437** |

Ostanek (4.342 znakov) ostane v `CLAUDE.md` dobesedno: »O projektu«, »Pravila dela«, »Izrazi«, naslov in tri
vrstice »Zagon in testi« (zagon reševalca, treninga, igre) ter vrstica o okolju.

Zakaj tako razdeljeno: trening, igra in reševalec uporabljajo različne dele `shared/` (trening mrežo in ploščo, ne pa
zbirke; reševalec zbirko, ne pa plošče), zato je `shared/` v treh dokumentih. Testi in orodja so veliki, a se pri nalogi
bere samo razdelek področja (podnaslovi). Največji dokument, ki ga preberem pri tipični nalogi, je `trening.md`
(39 tisoč znakov) – pri nalogi v treningu je skupaj z deli `shared/` to pribl. tretjina zdajšnjega `CLAUDE.md`, pri
drugih nalogah manj.

### 3.3 Kateri dokument pri kateri nalogi

Ta tabela gre v `CLAUDE.md` (»Kazalo dokumentov«).

| Naloga | Preberi najprej |
|---|---|
| nova tehnika, motor, ocena stopnje, generator ugank | `docs/opis/motor.md`; nato `trening.md` (vaja, `MODES`), `orodja.md` (banka, primeri, semena), `testi.md` (motor in ocena) |
| trening – »Spoznaj«, »Vadi v uganki«, meni | `docs/opis/trening.md`; pri mreži in plošči še `skupni-prikaz.md`; pri vajah iz uganke še `motor.md` (`vaje-uganka.js`) |
| igra | `docs/opis/igra.md`, `skupni-prikaz.md` (mreža, plošča), `stanje-zbirka.md` |
| reševalec | `docs/opis/resevalec.md`, `stanje-zbirka.md` (zbirka) |
| zbirka, izvoz/uvoz, stanje uganke, vgrajeni primeri | `docs/opis/stanje-zbirka.md` |
| videz, barve, CSS | `docs/opis/skupni-prikaz.md` (`base.css` – paleta) in opis aplikacije |
| besedila, okno Pomoč | `skupni-prikaz.md` (`pomoc.js`), `motor.md` (`TEHNIKE_OPISI`), `testi.md` (besedila) |
| testi | `docs/opis/testi.md`, razdelek področja |
| brskalnik brez glave, scenarij, posnetek igre | `docs/opis/orodja.md` |
| vrstni red nalog, odločitve, »Kasneje« | `docs/uskladitev.md` |
| ročni pregled | `docs/rocni-test.md` |
| testne uganke, tabela tehnik | `docs/uganke.md`, `docs/tehnike.md` |
| zgodovina naloge | `docs/opis/dokumenti.md` → načrt naloge |

### 3.4 Kako se prenese

1. Skripta (v začasni mapi, ne v repozitoriju) razreže stari `CLAUDE.md` na **enote**: vsaka postavka datoteke
   (``- `ime` `` z vsem besedilom do naslednje), glava mape, opomba, vsaka vrstica »Zagon in testi« in »Arhitektura«.
   Enote zapiše v dokumente po razporedu iz 3.2 – **ne ročno**, da se nobena ne izgubi ali spremeni.
2. Razvrstitev v `testi.md` in `orodja.md` po področjih naredi skripta po seznamu imen (seznam pregledam ročno);
   znotraj področja ostane zdajšnji vrstni red.
3. Nov `CLAUDE.md` napišem na novo, razen dobesednih razdelkov (»O projektu«, 13 pravil dela, »Izrazi«).
4. Preverjanje (skripta): vsaka enota starega `CLAUDE.md` je – ne glede na zamik vrstice – natanko enkrat v
   `docs/opis/` ali dobesedno v novem `CLAUDE.md`; vsako pravilo iz razdelka 4 ima v novem `CLAUDE.md` svojo vrstico
   (iskanje po ključni besedni zvezi pravila); velikost; vse poti v kazalu obstajajo. Izpis gre v razdelek 9.

## 4. Pravila dela – prej in potem

Vsa pravila iz `CLAUDE.md`: A – razdelek »Pravila dela« (ostanejo dobesedno), B – iz »Zagon in testi«, C – iz
»Arhitektura«, D – iz opisov datotek (»Struktura«), N – nova. Pravila B–D gredo v `CLAUDE.md` kot kratka vrstica;
njihovo prvotno besedilo ostane tudi v opisu v `docs/opis/` (dobesedni prenos – podvojeno je samo pravilo, O6).

| # | Pravilo (povzetek) | Zdaj | Potem |
|---|---|---|---|
| **A** | | | |
| P1 | Pred vsako večjo spremembo predlagaj načrt in počakaj na potrditev. | Pravila dela | `CLAUDE.md`, Pravila dela (dobesedno) |
| P2 | Pri napakah najprej poišči vzrok in ga razloži, šele nato popravljaj. | Pravila dela | isto |
| P3 | Spreminjaj samo, kar zahteva naloga; drugo težavo navedi v povzetku. | Pravila dela | isto |
| P4 | Obnašanja obstoječih tehnik ne spreminjaj brez izrecne zahteve. | Pravila dela | isto |
| P5 | Novih knjižnic in odvisnosti ne dodajaj brez vprašanja. | Pravila dela | isto |
| P6 | Ugank in testnih pozicij ne sestavljaj na pamet – vsaka preverjena s programom (ena rešitev). | Pravila dela | isto |
| P7 | Besedila v uporabniškem vmesniku so v slovenščini. | Pravila dela | isto |
| P8 | Odgovori Darku v slovenščini. | Pravila dela | isto |
| P9 | Na koncu povzetek: spremenjene datoteke, kaj je narejeno, kaj ročno preveriti. | Pravila dela | isto |
| P10 | Preveri avtomatsko vse (testi, posnetek igre, brskalnik brez glave); ročni seznam največ 5 točk – kje, kaj, izid, zakaj ni avtomatsko; stalni pregledi v `docs/rocni-test.md`. | Pravila dela | isto |
| P11 | Nikoli ne ustavljaj brskalnika po imenu procesa; samo procese lastnega profila orodja. | Pravila dela | isto |
| P12 | Pred commitom, ki spremeni aplikacijo, osveži oznako različice (hook ali `node tools/oznaci-razlicico.js`). | Pravila dela | isto |
| P13 | Po vsakem commitu `git push`; ob napaki pokaži napako, brez `--force`, brez spreminjanja oddaljenega repozitorija. | Pravila dela | isto |
| **B** | | | |
| Z1 | Testi: vzorec datotek v narekovajih (Node 24); hitri `tests/*.test.js`, vsi `tests/**/*.test.js`. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z2 | Med delom hitri, počasen test ob njegovem področju, vsi pred commitom/pushem; izjema – commit samo s `CLAUDE.md` ali `docs/` razen `docs/uganke.md`: hitri; nov počasen test, ki bere dokument, dopiši k izjemi. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z3 | Nov test gre med počasne, če traja nad pribl. 10 s; počasni nalagajo pomožne z `require('../load-engine.js')`. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z4 | Testi samo z `node:test`/`node:assert`, brez `package.json` in odvisnosti. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z5 | Preden dodaš testno uganko v `docs/uganke.md`, poženi `tools/analiziraj-zbirko.js`. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z6 | Brskalnik brez glave pri vsaki spremembi UI (testi CSS ne vidijo); nov scenarij po vzoru `tools/preveri-niz-brskalnik.js`. | Zagon in testi (in opisi `mreza.css`, `zbirka.css`, `dom-stub.js`) | `CLAUDE.md`, Zagon in testi |
| Z7 | Bližnjice s črkami in Shift+števka preveri tudi s pari `key`/`code` za QWERTZ. | Zagon in testi | `CLAUDE.md`, Pravila dela |
| Z8 | Ob vsaki spremembi motorja ali generatorja znova banka vaj (`tools/ustvari-banko-vaj.js`) in commit; če test banke pade, datoteke in testa ne popravljaj ročno. | Zagon in testi, opisa `vaje-banka.js` in testa | `CLAUDE.md`, Pravila dela |
| Z9 | Za banko (in ob vsaki spremembi motorja ali generatorja) `tools/izberi-vaje-po-shemi.js --zapisi`; seznama `PRESEK_PO_SHEMI` in testa ne popravljaj ročno. | Zagon in testi, opisa `generators.js` in orodja | `CLAUDE.md`, Pravila dela |
| Z10 | Nova testna uganka samo s `tools/ustvari-uganko.js` (pri strogem merilu `--poskusov` nad 1000). | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z11 | Python: conda `py312_env`, najprej `python --version`. | Zagon in testi | `CLAUDE.md`, Zagon in testi |
| Z12 | Igra in reševalec si zbirko delita zanesljivo samo z istega izvora (lokalni strežnik), ne pri `file://`. | Zagon in testi | `CLAUDE.md`, Zagon in testi (dobesedno) |
| **C** | | | |
| A1 | Logika tehnik samo v `shared/`; aplikacije jo le kličejo – logike ne podvajaj. | Arhitektura | `CLAUDE.md`, Arhitektura |
| A2 | Nova tehnika: en vnos v `ALL_TECHNIQUES`, natanko ena raven v `RAVNI_TEHNIK` (na istem mestu), skupina v `TECHNIQUE_GROUPS`. | Arhitektura | `CLAUDE.md`, Arhitektura |
| A3 | Trening: en vnos v `MODES`, kartica v `trening/index.html`, vnos v `TRENING_TEHNIKE` na istem mestu kot v `ALL_TECHNIQUES` – edino mesto številk tehnik. | Arhitektura | `CLAUDE.md`, Arhitektura |
| A4 | Nove tehnike na konec (ekspertne za naprednimi), razen če Darko izrecno zahteva drugače. | Arhitektura | `CLAUDE.md`, Arhitektura |
| A5 | Sprememba vrstnega reda tehnik spremeni dnevnike `solve()` – posodobi `docs/uganke.md` (pokritost, zgodovina). | Arhitektura | `CLAUDE.md`, Arhitektura |
| A6 | Zapis celic v razlagah `V<vrstica>S<stolpec>` (`cellLabel`/`cellsLabel`). | Arhitektura | `CLAUDE.md`, Arhitektura |
| A7 | Gumb »Pokaži število kandidatov« natanko pri `showCandidateCount: true`. | Arhitektura | `docs/opis/motor.md` (dobesedno, razdelek »Arhitektura«) |
| **D** | | | |
| S1 | Vgrajene primere `PRIMERI` izbere `tools/izberi-primere.js` – ročno se ne sestavljajo; ponovi ob novi tehniki ali spremembi motorja/generatorja. | opisa `zbirka.js`, `izberi-primere.js` | `CLAUDE.md`, Pravila dela |
| S2 | Ključev shrambe ne spreminjaj (`sudoku.igra.seznami` …); `sudoku.igra.kandidati` bere samo igra; v `sudoku.igra.v1` piše samo igra (`shared/` samo pri brisanju). | opisi `plosca.js`, `zbirka.js`, `igra.js` | `CLAUDE.md`, Arhitektura (ključi shrambe) |
| S3 | Barve palete samo v `shared/base.css` – aplikacija jih ne definira znova (`tests/css-paleta.test.js`). | opisa `base.css`, testa | `CLAUDE.md`, Arhitektura (edini viri) |
| S4 | Ime tehnike za uporabnika samo prek `imeTehnike()`; ključi `ALL_TECHNIQUES` so notranji. | opis `engine.js` | `CLAUDE.md`, Arhitektura (edini viri) |
| S5 | Sklanjanje po številu samo `sklanjaj()`. | opis `engine.js` | `CLAUDE.md`, Arhitektura (edini viri) |
| S6 | Besedila tehnik samo v `TEHNIKE_OPISI`, opisi stopenj samo v `STOPNJE_UGANK` (ne v HTML), ime stopnje = težavnost v `TEZAVNOSTI`, raven samo v `RAVNI_TEHNIK`. | opisi `engine.js`, `generator.js`, `zbirka.js` | `CLAUDE.md`, Arhitektura (edini viri) |
| S7 | Besedila za uporabnika: »izbriši«, druga oseba ednine, števila z besedo, pari {3, 8}, »enota« in »vidi« razložena ob prvi omembi, brez omembe drugih aplikacij; »števka«; ločila » – «, »…«, tropičje, »→«; »dane števke«, »kljukica«; brez razvijalskih podrobnosti in »Prikaži« (varujejo `trening-tehnike`, `besedila-html`, `locila`, `izrazi`). | opisi `engine.js` in štirih testov | `CLAUDE.md`, Pravila dela |
| S8 | Skripte za urejanje z regularnimi izrazi ali poševnicami ne piši v heredoc lupine, ampak v datoteko. | opis `kontrolni-znaki.test.js` | `CLAUDE.md`, Pravila dela |
| S9 | Posnetka `tests/posnetki/*.json` nova samo ob namerni spremembi (`--shrani`). | opisa `izris-korakov`, `stopnje-ugank` | `CLAUDE.md`, Pravila dela |
| S10 | Posnetek igre `--primerjaj` s trenutnim izhodiščem (`tools/posnetki/igra-po-xy-veriga.json`); novo izhodišče ob namerni spremembi igre. | opis `posnetek-igre.js` | `CLAUDE.md`, Zagon in testi |
| S11 | Vsak `ustrezaIskanju` je podmnožica svojega `ustreza` (varuje test). | opis `generator.js` | `docs/opis/motor.md` (dobesedno) |
| S12 | Generator vaje v treningu: motor na deski vaje najde načrtovani vzorec in nobenega drugega (varujejo testi generatorjev). | opomba o generatorjih | `docs/opis/trening.md` (dobesedno) |
| **N** | | | |
| N1 | Ko spremeniš datoteko, posodobi njen opis v `docs/opis/` (ne v `CLAUDE.md`); nova datoteka dobi vrstico v zemljevidu `CLAUDE.md` in opis v `docs/opis/`. | – | `CLAUDE.md`, Pravila dela |
| N2 | Pred spremembo preberi opis področja (tabela v kazalu); dokumentov ne uvažaj z `@`. | – | `CLAUDE.md`, Pravila dela |
| N3 | `CLAUDE.md` ima samo pravila, ukaze, zemljevid in kazalo; meja 25.000 znakov (varuje test – O4). | – | `CLAUDE.md`, Pravila dela |

Skupaj 47 pravil: 13 (A) + 12 (B) + 7 (C) + 12 (D) + 3 (N, nova); v `CLAUDE.md` jih je 44, tri (A7, S11, S12)
ostanejo samo v opisu, ker jih varuje test ali zadevajo samo eno datoteko.

Pravila iz pomnilnika (`MEMORY.md` – prestavitev testov na vajo 7) niso v `CLAUDE.md` in se ne spremenijo.

## 5. Tveganja in priporočilo

| Tveganje | Kako ga zmanjšamo |
|---|---|
| Opisa ne preberem in spregledam obstoječo možnost (npr. podvojim funkcijo, ki je že v `plosca.js`). | Pravilo N2 in tabela v kazalu; zemljevid v `CLAUDE.md` ima pri vsaki datoteki glavne funkcije, zato vem, kje iskati. |
| Ob prenosu se kaj izgubi ali spremeni. | Dobesedni prenos s skripto po enotah in preverjanje »natanko enkrat« (3.4); razdelek 4 s ključnimi zvezami pravil. |
| Opisi zastarijo – zdaj jih posodabljam, ker je `CLAUDE.md` vedno pred mano. | Pravilo N1; v povzetku naloge so posodobljeni opisi med spremenjenimi datotekami; test (O4) opozori na datoteko brez opisa. |
| `CLAUDE.md` spet zraste. | Meja v testu (O4). |
| Uvoz z `@` bi dokumente spet naložil vedno. | Poti v kazalu so navadno besedilo; pravilo N2. |
| Sklici »glej `CLAUDE.md`« v starih dokumentih ne kažejo več na opis. | So zgodovina; stari `CLAUDE.md` je v gitu (`a71e67f`). Živi sklici (komentarji v kodi, `docs/uganke.md`) ostanejo pravilni (razdelek 2). |
| Branje opisa stane pri nalogi. | Manj kot zdaj: pri nalogi v treningu pribl. tretjina zdajšnjega `CLAUDE.md`, pri drugih manj; testi in orodja po podnaslovih. |

**Priporočilo:** devet dokumentov v `docs/opis/` (O1), prenos dobesedno (O2), zemljevid z vrstico na datoteko
aplikacije (O3), varovalo-test (O4). Dobesedni prenos je pomemben zato, ker je preverljiv: pregledati je treba samo
nov `CLAUDE.md` (pribl. 20 tisoč znakov), ne vseh 247 tisoč. Krajšanje opisov (zgodovina, »prej …«) je lahko pozneje
posebna naloga v »Kasneje« – ob vsaki spremembi datoteke pa ga lahko naredim sproti pri njenem opisu.

## 6. Koraki

**Korak 1 – prenos in nov `CLAUDE.md`.** Skripta zapiše `docs/opis/*.md` (3.2, 3.4); nov `CLAUDE.md` (3.1) s kazalom
(3.3) in pravili (razdelek 4); `docs/opis/dokumenti.md` dopolnjen z manjkajočimi dokumenti in s tem načrtom.
Preverjanje: skripta prenosa (izpis v razdelek 9), velikost, vse poti v kazalu obstajajo, `razlicica.json`
nespremenjen, hitri testi (commit spremeni samo `CLAUDE.md` in `docs/`). Commit in push.

**Korak 2 – varovalo (O4).** `tests/claude-md.test.js` (hiter): (a) `CLAUDE.md` ima največ 25.000 znakov; (b) vsaka
pot v `CLAUDE.md` (`docs/…`, `tools/…`, `tests/…`, `app/…`, `igra/…`, `trening/…`, `shared/…`) obstaja – razen
vzorcev z `<…>` ali `*`; (c) vsaka datoteka v `app/`, `igra/`, `trening/`, `shared/`, `tests/`, `tools/` (brez
posnetkov) je omenjena v vsaj enem dokumentu `docs/opis/`; (d) vsaka datoteka v `app/`, `igra/`, `trening/`,
`shared/` je v zemljevidu `CLAUDE.md`. Na kodi pred korakom 1 padeta (a) in (c), na koncu koraka 1 je zelen. Test bere samo
`CLAUDE.md` in `docs/opis/`, zato izjema »samo dokumenti → hitri testi« ostane. Vsi testi (nova datoteka v `tests/`).
Commit in push.

**Korak 3 – zaključek.** `docs/uskladitev.md` (6a zaključena, naslednja 6b), razdelek 9 tega načrta, ročni pregled v
`docs/rocni-test.md` (razdelek »Naloga 6a«). Hitri testi. Commit in push.

Posnetek igre in brskalnik brez glave nista potrebna – koda aplikacije se ne spremeni (oznaka različice ostane).

## 7. Ročni pregled (enkrat, po koraku 3)

1. **Kje:** `CLAUDE.md` (pribl. 20 tisoč znakov). **Kaj:** preberi ga v celoti. **Izid:** nič ne pogrešaš in nič ni
   napisano tako, da bi ga razumel drugače kot zdaj. **Zakaj ni avtomatsko:** skripta preveri, da je vse staro
   besedilo nekje, ne pa, ali je v `CLAUDE.md` ostalo pravo.
2. **Kje:** nov pogovor v VS Code. **Kaj:** začni nalogo 6b (»naredi načrt«). **Izid:** pred načrtom Claude prebere
   `docs/opis/trening.md` in `docs/opis/resevalec.md` (vidno med orodji) in ne vpraša nič, kar je v njiju.
   **Zakaj ni avtomatsko:** gre za obnašanje v novem pogovoru, ki ga test ne more pognati.

## 8. Odločitve, ki jih potrebujem

| # | Vprašanje | Možnosti | Priporočam |
|---|---|---|---|
| O1 | Kam gredo opisi? | **A** devet dokumentov v `docs/opis/` po področjih (3.2); **B** en dokument `docs/opis.md` (242 tisoč znakov – pri vsaki nalogi preberem del); **C** po mapah (`shared/` v enem, 62 tisoč) | A |
| O2 | Prenos | **A** dobesedno (preverljivo, krajšanje pozneje); **B** hkrati skrajšati opise (zgodovina, »prej …«) – več dela, pregledati je treba vse | A |
| O3 | Zemljevid v `CLAUDE.md` | **A** ena vrstica na datoteko aplikacije z glavnimi funkcijami, testi in orodja po skupinah (pribl. 4.500 znakov); **B** samo mape in kazalo (pribl. 1.000) | A |
| O4 | Varovalo-test | **A** `tests/claude-md.test.js` z (a)–(d) iz koraka 2; **B** samo (a) in (b); **C** brez testa | A |
| O5 | Številke, ki zastarijo (število testov, trajanja) | **A** v `CLAUDE.md` samo zaokrožena trajanja (»hitri pribl. 1 min, vsi pribl. 4 min«), števila testov samo v `docs/opis/testi.md`; **B** kot zdaj | A |
| O6 | Pravila iz opisov (skupini B in D) | **A** kratka vrstica v `CLAUDE.md`, prvotno besedilo ostane tudi v opisu; **B** samo v `CLAUDE.md` (opis se pri prenosu spremeni – ni več dobeseden) | A |
| O7 | »Okolje: Windows 10« (sistem poroča Windows 11 Pro) | **A** popravim v novem `CLAUDE.md`; **B** pustim | A |

## 9. Izvedba

(prazno – izpolni se med koraki)
