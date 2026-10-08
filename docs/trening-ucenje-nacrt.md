# Trening – učenje (prva vaja po shemi, »Namig« in »Rešitev« kot stikali) – načrt

Načrt 2026-10-08 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 4a – pred nalogo 5, BUG+1; obe
postavki sta bili v »Kasneje«, zapisani ob ročnem pregledu XY-verige). **Stanje: čaka na potrditev.** Koda
se do potrditve ne spreminja. O nalogi 5 (BUG+1) Darko odloči po tej nalogi.

Izhodišče: commit `c7eb185`, vseh 640 testov zelenih v 2 min 19 s.

Številke v razdelku 1.4 so **izmerjene** s skriptama v začasni mapi (nista v repozitoriju) na banki vaj
in shemah iz `shared/sheme.js`, ne ocenjene.

## 0. Povzetek

- **Del A – prva vaja po shemi.** Pri vseh 13 tehnikah s shemo (1–13) je prva vaja vsakega kroga »Spoznaj«
  narisana po shemi: iste celice, črke zamenjane s števkami. Funkcija tehnike na njej najde natanko korak
  sheme (vzorec in izbrise). Vaje 2–9 ostanejo, kot so; E1 in E2 (brez sheme) se ne spremenita.
- **Izvedljivo je pri vseh 13** (razdelek 1.4). Načini so trije:
  - **7, 8** neposredno iz sheme (mreža ene števke, samo x);
  - **3–6 in 9–13** sestavljena vaja kot zdaj, celice in črke iz sheme, drugi kandidati naključni in
    preverjeni z motorjem;
  - **1, 2** stanje prave uganke iz banke, premaknjeno na mesta sheme s simetrijo sudokuja.
- **Števke za črke so naključne** (O1), preslikava je napisana nad mrežo: »x = 4, y = 7«. Vrstica nad vajo
  ima »· po shemi«, razdelek »Shema« je pri prvi vaji kroga vedno odprt (tako je že zdaj).
- **Del B – stikali.** Gumbe »(drži)« ima samo »Spoznaj« (vseh 15 tehnik). »Vadi v uganki«, igra in
  reševalec jih nimajo. »Namig« in »Rešitev« postaneta stikali: klik pokaže, klik skrije. Odprt je
  kvečjemu eden, kot v »Vadi v uganki«. Ob pravilnem odgovoru, novi vaji in vrnitvi na izbiro se zapreta,
  ob napačnem odgovoru ostaneta odprta.
- **Koraki:** pet majhnih (B najprej, nato A v štirih delih), vsak v svojem pogovoru, s commitom in
  pushem. Ročni pregled enkrat, na koncu.

## 1. Del A – prva vaja »Spoznaj« po shemi

### 1.1 Kaj pomeni »enako kot shema«

Shema je v `SHEME_TEHNIK` (`shared/sheme.js`). Celica sheme ima črke (x, y, z, a, b), »…« (drugi
kandidati), »-« (kandidat za izbris) ali je prazna. Prazna celica nima teh črk – lahko ima vpisano števko ali
samo druge kandidate. Vaja po shemi ima **iste celice na istih mestih**, črke so števke. Kar shema
pušča odprto (prazna celica, »…«), mora vaja povedati s števkami:

| Tehnika | Shema | Zdajšnja vaja | Vaja po shemi |
|---|---|---|---|
| 1, 2 | pas 3 × 9, samo x | delna mreža (blok in vrstica/stolpec, 15 celic) iz prave uganke iz banke | ista delna mreža na mestih sheme (zgornji pas, pri 1 blok 1 in vrstica 1, pri 2 blok 2 in vrstica 2); stanje prave uganke iz banke, premaknjeno s simetrijo (1.6) |
| 3–6 | ena vrstica | ena enota (vrstica, stolpec ali blok) s kandidati | vrstica; prazne celice sheme so dane števke, »…« so drugi kandidati (naključni, preverjeni) |
| 7, 8 | 9 × 9, samo x | mreža 9 × 9 za eno števko | natanko celice x iz sheme; nič ni treba dodati |
| 9 | 9 × 9, samo x (prva risba: Nebotičnik) | cela mreža, prazne celice s števko in 1–2 drugima kandidatoma | celice x iz prve risbe, vsaka z 1–2 drugima kandidatoma (kot zdaj); druge celice sive (rešene) |
| 10–13 | 9 × 9, več črk; drugi kandidati narisani samo v celicah vzorca | cela mreža, 8–11 praznih celic | vse celice s črko (23–46 praznih celic); celice vzorca natanko s črkami sheme, druge celice s črko dobijo polnila do vsaj treh kandidatov (O3) |

Pri 9 je prva vaja Nebotičnik, tako kot zdaj (sode vaje so Nebotičnik). Zmaj ostane v vajah, kot je (O8).

### 1.2 Števke za črke (O1)

**Predlog: naključne** – ob vsaki prvi vaji kroga dobijo črke različne naključne števke, polnila pa
naključne druge števke. Preslikava je napisana nad mrežo (1.3).

- Shema sama pravi »x, y – poljubni različni števki«. Stalna preslikava (x = 1, y = 2 …) bi napeljevala,
  da je x vedno ista števka.
- Zamenjava števk ne spremeni nobenega koraka motorja (tehnike so enake za vse števke). Pri sestavljenih
  vajah se polnila poiščejo znova in preverijo (1.5), pri 1 in 2 se preslika celotno stanje uganke.
- Stalna preslikava bi bila samo malo preprostejša za teste; testi tečejo z `Math.random` s semenom, kot
  pri drugih generatorjih.

### 1.3 Kako uporabnik ve, da je to vaja po shemi (O2)

- **Vrstica nad vajo:** »11 · XY-krilo (XY-Wing) · Vaja 1 / 9 · po shemi«.
- **Vrstica tik nad mrežo** (pod razdelkom »Shema«, razred `po-shemi`): »Vaja po shemi zgoraj – iste
  celice, črke so števke: x = 4, y = 7, z = 2.« Pri shemah s samo x: »… črka x je števka 4.«
- **Razdelek »Shema« je odprt.** `zacniKrog()` ga v »Spoznaj« odpre ob vsakem novem krogu, prva vaja kroga
  pa je vedno vaja po shemi – zato je ob njej shema vedno nad mrežo. Tu se nič ne spremeni.
- Shema sama (risba, legenda) se ne spremeni – ista je v Pomoči vseh treh aplikacij.

### 1.4 Izvedljivost – izmerjeno

**Vse sheme 1–13 se dajo izvesti.**

| Tehnika | Meritev | Izid |
|---|---|---|
| 1 · Izločitev izven bloka | vsa stanja »Vadi v uganki« vseh 315 ugank banke s to tehniko (1127 stanj): korak z obliko sheme (par, en izbris v vsakem od drugih dveh skladov), na delni mreži edini s to števko | **82 korakov v 38 ugankah**; pregled vse banke 14,8 s |
| 2 · Izločitev v bloku | 167 ugank, 293 stanj: trojica, izbrisa v drugih dveh vrsticah bloka in v različnih stolpcih | **7 korakov v 5 ugankah**; pregled 5,8 s |
| 3–6 | 2000 sestavljenih vaj po shemi z naključnimi števkami in polnili: (a) funkcija tehnike najde natanko korak sheme; (b) še lažje tehnike v enoti nič (enojčka, lažje podmnožice) | (a) 79–98 %, (b) **22–41 %** – iskanje s ponavljanjem je potrebno, en poskus traja pod 1 ms |
| 7, 8 | mreža iz sheme brez sprememb | vedno (to dokazuje že `tests/sheme.test.js`) |
| 9 | 300 vaj, x + 1–2 polnili | (a) **94 %** |
| 10–13 | 300 vaj, polnila do vsaj treh kandidatov zunaj vzorca | (a) **100 %** |

Pri 1 in 2 iskanje po vsej banki ob vaji traja predolgo (6–15 s). Zato bo seznam primernih semen izbran
vnaprej z orodjem in preverjen s testom (1.6). Pri 9–13 se lažje tehnike na polnilih oglasijo skoraj
vedno (skriti enojček na polnilni števki pri 100 % poskusov). To velja tudi za zdajšnje vaje teh tehnik –
glej 1.5 in O3.

### 1.5 Kaj preveri motor (»natanko ta korak, kot pri shemi«)

Za shemo `tests/sheme.test.js` preveri dvoje: (1) funkcija tehnike na deski iz sheme najde natanko en korak
s celicami vzorca in izbrisi sheme; (2) lažje tehnike ne najdejo ničesar – razen pri shemah v eni
vrstici. Pri vaji po shemi velja:

| Tehnika | (1) natanko korak sheme | (2) lažje tehnike nič |
|---|---|---|
| 1, 2 | da – na stanju po premiku; na delni mreži ni drugega koraka iste tehnike s to števko (`presekEnolicen()`, kot zdaj) | da, na celi mreži – stanje »Vadi v uganki« je na poti motorja, kjer je ta tehnika prva, ki kaj najde |
| 3–6 | da – na deski kot v testu sheme (vrstica, druge celice prazne z vsemi kandidati) | da, **v enoti** (enojčka, lažje podmnožice) – strožje kot test sheme; »Preveri« pri 3 in 5 sprejme vsak vzorec v enoti, zato mora biti en sam |
| 7, 8 | da (ista deska kot v testu sheme) | da, brez golega enojčka (mreža ene števke – kot test sheme) |
| 9–13 | da – na deski vaje (sive celice, kandidati praznih celic), kot zdajšnji generatorji teh tehnik | **ne** – na polnilih se skoraj vedno kaj najde (1.4), enako kot pri zdajšnjih vajah; vzorec iz črk ostane brez lažjih tehnik, kot na shemi (O3) |

Pri 10–13 vsaka celica zunaj vzorca dobi vsaj tri kandidate. Zato so celice z dvema kandidatoma samo
celice vzorca. W-krilo, XY-krilo, edinstveni pravokotnik in XY-veriga potrebujejo celice z dvema
kandidatoma, zato drugega vzorca teh tehnik ne more biti. Motor to vseeno preveri ob vsaki vaji.

### 1.6 Vaji 1 in 2 – prava uganka na mestih sheme (O4, O5)

Zdajšnji vaji 1 in 2 sta stanje prave uganke iz banke (`genPresek()`), ker so sestavljene vaje kazale
kandidate, ki jih vidne števke izključujejo. Vaja po shemi naj ostane prava uganka.

- **Simetrija.** Uganka ostane veljavna, če se zamenjajo pasovi, vrstice v pasu, skladi, stolpci v skladu,
  vrstice in stolpci (zrcaljenje čez diagonalo) ali števke. Vsak korak s pravo obliko se tako prenese na
  mesta sheme:
  - **1:** par v vrstici bloka, en izbris v vsakem od drugih dveh skladov → blok 1, vrstica 1, vzorec
    V1S1 in V1S3, izbrisa V1S4 in V1S8;
  - **2:** trojica, izbrisa v drugih dveh vrsticah bloka in v različnih stolpcih → blok 2, vrstica 2,
    vzorec V2S4–V2S6, izbrisa V1S5 in V3S4.
  
  Korak v stolpcu se pred tem prezrcali v vrstico.
- **Preslikava zajame vse stanje**: dane števke, vpise in kandidate. Korak (z besedilom) se nato znova
  poišče z motorjem na preslikanem stanju – to je hkrati preverba.
- **Seznam semen** (O4): orodje `tools/izberi-vaje-po-shemi.js` pregleda banko (pribl. 20 s) in izpiše
  semena s primernim korakom. Seznam `PRESEK_PO_SHEMI` v `trening/generators.js` je iz izpisa – ne na pamet.
  Test preveri, da vsako seme še da primeren korak. Ob vaji se izbere naključno seme
  (`genMinimalnaUganka(seme)`, stanja, prvi primeren korak, preslikava; pribl. 50–100 ms). Ob spremembi
  motorja ali generatorja test pade in orodje se požene znova – kot pri banki.
- **Prikaz** (O5): kot pri drugih vajah 1 in 2 – vidna sta blok in vrstica (15 celic). Druge x v pasu
  sheme so tam samo zato, da je shema veljavno stanje, in niso del naloge.
- **Trojica v krogu** (O9): v krogu 9 vaj ima zdaj vsaj ena vaja vzorec s tremi celicami (izbrana ob
  vaji 1). Pri 1 je vaja po shemi par, zato se trojica izbere med vajami 2–9. Pri 2 je trojica že vaja po
  shemi, zato se v vajah 2–9 nobena ne vsili.

### 1.7 Kaj ostane

- Vaje 2–9 kroga: isti generatorji z isto številko vaje (`M.gen(n)`). Izmenjava po številki vaje (vrstice
  ali stolpci pri 7, vrsta enote pri 3–6, podtip pri 9, dolžina verige pri 13) ostane. Vaja po shemi
  nadomesti samo vajo 1, prek `renderExercise()` – `MODES[].gen` se ne spremeni.
- E1, E2 (brez sheme), »Vadi v uganki«, igra, reševalec.
- Namig, Rešitev, »Preveri«, legenda in štetje rezultata delujejo pri vaji po shemi enako kot pri vaji
  iste tehnike – vaja ima ista polja. Vaja po shemi se šteje v rezultat (O7).
- Shema in njen test.

## 2. Del B – »Namig« in »Rešitev« kot stikali

### 2.1 Kje so gumbi »(drži)«

| Kje | Gumbi | Delovanje zdaj |
|---|---|---|
| Trening, »Spoznaj« (vseh 15 tehnik) | »Namig (drži)«, »Rešitev (drži)« | pokažeta pomoč, dokler gumb držiš (`mousedown`/`touchstart` do `mouseup`/`mouseleave`/`touchend` v `trening/trening.js`) – **edino mesto** |
| Trening, »Vadi v uganki« | »Namig«, »Rešitev« | klik odpre okvir, »Skrij« v okvirju ga zapre; odprt je en okvir (vsebino zamenja drug gumb); ostane ob potezah, pravilen odgovor ga zapre |
| Igra | »Naslednji korak« → »Pokaži več« → »Pokaži rešitev«, »Skrij«; »Preveri« | klik; brez »drži« |
| Reševalec | »Pokaži/Skrij kandidate«, »Pokaži/Skrij korake reševanja«, »Pokaži na mreži ▾ / Skrij mrežo ▴«, povečan prikaz z dotikom | klik; brez »drži« |

Sprememba je torej samo v »Spoznaj«. Pri »Vadi v uganki« je predlagana še majhna uskladitev (O14).

### 2.2 Obnašanje stikal

- **Klik pokaže, klik skrije.** Gumba se odzivata na `click` – miška, dotik in tipkovnica (Enter/preslednica
  na gumbu) delujejo enako. Besedilo se da brati in stran drseti.
- **Napis** (O10): zaprto »Namig« / »Rešitev«, odprto »Skrij namig« / »Skrij rešitev«, kot »Pokaži/Skrij
  kandidate« v reševalcu. Odprt gumb ima vidno pritisnjen slog (`aria-pressed="true"`).
- **Odprt je kvečjemu eden** (O11), kot v »Vadi v uganki«: klik na drugi gumb zamenja vsebino.
- **Pomoč se šteje ob prvem odprtju**, kot zdaj ob prvem pritisku (`oznaciPomoc()`). Zapiranje in ponovno
  odpiranje ne spremenita ničesar.
- **Izbira ob odprti Rešitvi** (O12, predlog B): izbira deluje naprej, oznake Rešitve se sproti prilagodijo
  izbiri. Okvir pove, kaj je pravilno in kaj ne; pri 3, 5, 7 in 8 se prikazani vzorec lahko zamenja
  (`vzorecResitve()`). To je isto, kot je zdaj pri vsakem novem pritisku z drugo izbiro, le brez spuščanja.
  Pri 1 in 2 se izbira med Rešitvijo zdaj ne vidi (mreža skrije izbiro, dokler je korak prikazan). Pri
  stikalu bo vidna, sicer klik v mrežo ne bi imel vidnega učinka – po pravilnem odgovoru je izbire še
  vedno konec. Pri E1 in E2 plošča oznake koraka in izbiro že izriše skupaj.
  
  Možnost A: klik v mrežo Rešitev zapre, kot prej spust gumba.
- **Namig** je samo besedilo in ostane odprt med izbiro.

### 2.3 »Preveri«, naslednja vaja, vrnitev na izbiro

| Dogodek | Namig / Rešitev | Zakaj |
|---|---|---|
| »Preveri« – napačen odgovor | ostane odprt; izbira se izprazni (kot zdaj), oznake Rešitve se prilagodijo prazni izbiri | kot v »Vadi v uganki«; za naslednji poskus ni treba znova odpirati |
| »Preveri« – pravilen odgovor (vaja rešena, tudi 2. faza pri 4 in 6) | **se zapre**, gumb dobi napis »Namig« / »Rešitev« | oznake odgovora in Rešitve bi se prekrivale, legenda bi bila dvakrat; kot v »Vadi v uganki« (O13) |
| »Preveri« – pravilna 1. faza pri 4 in 6 (izbira števk še sledi) | ostane odprt | vaja še ni rešena |
| Ogled po pravilnem odgovoru | deluje kot zdaj (vaja se ne šteje drugače) | – |
| »Naslednja vaja →« / »Končaj« | zaprto – nova vaja se izriše na novo | pomoč velja za eno vajo; »s pomočjo« se ponastavi kot zdaj |
| »← Nazaj na izbiro« in nov krog | zaprto | isto |
| Razlaga in Shema | se ne spremenita (zložljiva, ostaneta med vajami kroga) | nista pomoč |

### 2.4 »Vadi v uganki« (O14)

Predlog: drugi klik na gumb odprtega okvirja okvir zapre, napis in slog kot v 2.2. »Skrij« v okvirju
ostane, ker je okvir z rešitvijo lahko dolg. Drugega se nič ne spremeni (okvir ostane ob potezah,
pravilen odgovor ga zapre). Tako »Namig« in »Rešitev« v treningu povsod delujeta enako.

### 2.5 Kaj s tem odpade

- Postavka v »Kasneje«: »Namig (drži)« in »Rešitev (drži)« se ob pritisku takoj skrijeta, če je stran
  pomaknjena do konca. Stikalo se ob premiku strani ne zapre.
- Obvodi v scenarijih za brskalnik (`preveri-vadi-brskalnik.js` dela prostor pod vsebino,
  `preveri-izbira-brskalnik.js` sproži »Rešitev« z dogodkom v strani zaradi `mouseleave` ob posnetku).
- Besedilo v Pomoči treninga (»… pokažeta pomoč, dokler gumb držiš …«) se spremeni.

## 3. Kaj vidi uporabnik

- **Prva vaja »Spoznaj«** pri 1–13: nad mrežo odprta shema, pod njo vrstica »Vaja po shemi zgoraj – iste
  celice, črke so števke: x = 4, y = 7.« in mreža z vzorcem na istih mestih kot na shemi. V vrstici nad
  vajo »· po shemi«. Naloga, »Preveri«, Namig in Rešitev so kot pri drugih vajah te tehnike.
  - 1, 2: zgornji pas, blok in vrstica kot na shemi, prava uganka z danimi števkami in kandidati.
  - 3–6: vrstica; kjer je na shemi prazna celica, je dana števka.
  - 7, 8: števka na natanko istih mestih kot x na shemi.
  - 9–13: gostejša mreža kot pri drugih vajah (23–46 praznih celic, drugod 8–11). Celice zunaj vzorca
    imajo poleg črk še 1–2 kandidata, ki jih shema ne riše.
- **Vaje 2–9** so take kot zdaj.
- **»Namig« in »Rešitev«** v »Spoznaj« se odpreta s klikom in ostaneta odprta. Besedilo je berljivo, stran
  se da drseti, izbira deluje. Zapreta se z drugim klikom (napis »Skrij …«), s pravilnim odgovorom ali z
  novo vajo. V »Vadi v uganki« okvir zapre tudi drugi klik na gumb.

## 4. Koraki

Predlagani vrstni red: **B najprej** (O15). Del B je manjši in samostojen. Šest testnih datotek in štirje
scenariji, ki zdaj držijo »Rešitev« z `mousedown`/`mouseup`, preidejo na klik enkrat. Novi testi dela A
potem že uporabljajo stikalo.

**Pravila za vse korake:**

- vsak korak v svojem pogovoru, s commitom in pushem;
- najprej test, ki na stari kodi pade (in pove, kaj manjka), nato sprememba;
- testi, ki jih je treba prestaviti, se prestavijo pred spremembo – na stari kodi morajo ostati zeleni;
- sproti hitri testi, pred commitom vsi, posnetek igre (`tools/posnetek-igre.js --primerjaj`, igra se ne
  spremeni – pričakovano brez razlik) in scenarij koraka v brskalniku brez glave;
- `CLAUDE.md`, ta načrt (razdelek 7 »Izvedba«) in `docs/uskladitev.md` se dopolnijo v istem commitu;
  oznaka različice prek pre-commit hooka.

### Korak 1 – del B: »Namig« in »Rešitev« kot stikali

- **Kaj:** `trening/trening.js` – gumba se odzivata na `click`, stanje odprtega okvirja (namig / rešitev /
  nič), napis in `aria-pressed`, osvežitev oznak Rešitve ob spremembi izbire (klik celice pri 3–13,
  `obKliku` delne mreže pri 1 in 2), izbira vidna med Rešitvijo pri 1 in 2, zaprtje ob rešeni vaji.
  `trening/v-uganki.js` – drugi klik zapre (O14). `trening/trening.css` – pritisnjen slog.
  `trening/index.html` – besedilo Pomoči.
- **Test pred spremembo:** nov `tests/trening-stikalo.test.js` (nadomestni DOM). Preveri:
  - klik pokaže, drugi klik skrije (oznake na mreži in okvir), napis in `aria-pressed`;
  - Namig in Rešitev se izključujeta;
  - pomoč se šteje ob prvem odprtju in nato nič več;
  - izbira ob odprti Rešitvi – pri 5 drug veljaven vzorec zamenja prikazani vzorec, pri 1 in 2 je izbira
    vidna;
  - »Preveri« napačno (ostane) in pravilno (zapre), tudi 2. faza pri 4;
  - nova vaja, »Nazaj na izbiro« in nov krog (zaprto);
  - E1/E2;
  - »Vadi v uganki«: drugi klik zapre;
  - v Pomoči treninga ni »(drži)«.
  
  Na stari kodi pade (klik ne naredi ničesar).
- **Prestavljeni testi:** pomožne funkcije v `trening-pomoc`, `trening-legenda`, `trening-resitev`,
  `trening-precrtanje`, `veriga-prikaz` in `pocasni/trening-presek` – »drži in spusti« postane »klik, klik«.
  Pričakovanja ostanejo.
- **Brskalnik:** `tools/brskalnik.js` dobi `tapni(izbirnik)` (dotik prek `Input.dispatchTouchEvent`).
  Nov `tools/preveri-stikalo-brskalnik.js` pri 375 (dotik) in 1280 px (miška):
  - okvir ostane po kliku in po drsenju strani;
  - na dnu strani (1280 × 1000) ostane odprt – na izhodišču `c7eb185` se skrije; scenarij pokaže, da je
    napaka iz »Kasneje« odpravljena;
  - besedilo okvirja se da označiti;
  - pritisnjen slog (izračunan);
  - brez preliva in napak JS.
  
  Štirje obstoječi scenariji »Rešitev« odprejo s klikom (izhodišče s pritiskom – po napisu gumba).
  Primerjave »Spoznaj« z izhodiščem izpustijo vrstico gumbov `.peek-row` (edina namerna razlika).
- **Kaj ujame avtomatika:** delovanje stikal, štetje pomoči, zapiranje ob dogodkih, izbira med Rešitvijo,
  da se »Spoznaj« drugače ne spremeni, napako na dnu strani, dotik v emulaciji.
- **Česa ne:** pravega dotika na telefonu (dvojni dotik, povečava, odziv brskalnika) – ročni pregled,
  točka 1.

### Korak 2 – del A, osnova ter 7 in 8

- **Kaj:**
  - `trening/generators.js`: `genPoShemi(mode)` (`null` pri tehniki brez sheme ali še ne narejeni),
    preslikava črk v števke, vaji 7 in 8 iz sheme;
  - `trening/trening.js`: v `renderExercise()` pri »Spoznaj« in vaji 1 `genPoShemi(mode) || M.gen(0)`,
    »· po shemi«, vrstica s preslikavo;
  - `trening/trening.css`: slog vrstice.
- **Priprava (pred spremembo, zelena na stari kodi):**
  - testi, ki prvo vajo kroga uporabljajo kot naključno vajo, preidejo na vajo 2 (`exNum = 1`):
    `trening-resitev` (išče vajo z drugim veljavnim vzorcem), `trening-precrtanje`, `veriga-prikaz`,
    `trening-legenda`, po potrebi še drugi – seznam se ugotovi z zagonom testov na kodi s spremembo;
  - primerjave »Spoznaj« z izhodiščem v `preveri-presek-`, `-enojcki-`, `-vadi-` in
    `-izbira-brskalnik.js` primerjajo vajo 2: seme se nastavi po izrisu vaje 1, trojica pri 1 in 2 se
    nastavi izrecno.
- **Test pred spremembo:** nov `tests/trening-po-shemi.test.js`, raste po korakih. Za 7 in 8 preveri:
  - celice vaje = celice x sheme, vzorec in izbrisi iz sheme;
  - funkcija tehnike najde natanko korak sheme;
  - »Preveri« s celicami vzorca → »Pravilno!«, »Rešitev« pokaže celice sheme;
  - oznaka »po shemi« in preslikava v besedilu;
  - pri istem semenu je vaja 2 enaka izhodu starega generatorja;
  - E1 in »Vadi v uganki« sta nespremenjena;
  - pravila besedil (brez »številk«, ločila).
  
  Na stari kodi pade.
- **Brskalnik:** nov `tools/preveri-po-shemi-brskalnik.js` (raste po korakih) pri 375 in 1280 px:
  - shema odprta nad mrežo;
  - celice na mreži (iz DOM) = celice sheme (iz `SHEME_TEHNIK`);
  - vrstica s preslikavo v kartici;
  - pravi kliki na celice vzorca → »Pravilno!«;
  - brez preliva in napak JS.
- **Kaj ujame avtomatika:** mesta celic, korak motorja, nespremenjene druge vaje, besedila, postavitev.
  **Česa ne:** ali je povezava s shemo razumljiva (ročni pregled).

### Korak 3 – del A, 3–6

- **Kaj:** vrstica iz sheme; prazne celice so dane števke, »…« so polnila. Iskanje s ponavljanjem
  (1.4: uspe 22–41 % poskusov, poskus pod 1 ms), merila iz 1.5. `solutionMessage` iz
  `subsetSolutionMessage()`, kot zdaj.
- **Test pred spremembo:** `trening-po-shemi` za 3–6 (na 200 vajah s semenom):
  - mesta, dane števke na mestih praznih celic sheme;
  - natanko korak sheme, v enoti brez lažjih tehnik, pri 3 in 5 en sam vzorec;
  - vsaka celica s kandidati ima vsaj dva, vsaka nevpisana števka je v vsaj dveh celicah;
  - »Preveri« (pri 4 in 6 z 2. fazo).
- **Brskalnik:** scenarij koraka 2 za 3–6.
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** berljivost (ročni pregled, točka 2).

### Korak 4 – del A, 9–13

- **Kaj:** cela mreža iz sheme (prva risba pri 9). Celice s črko so prazne celice vaje, druge sive. Polnila:
  pri 9 1–2 na celico; pri 10–13 do vsaj treh kandidatov zunaj vzorca, celice vzorca natanko s črkami,
  »…« v celici vzorca 1–2 polnili. Ponavljanje do preverbe. Polja kot pri zdajšnjih vajah (pri 9 `digit`,
  pri 13 `z` in `solutionVeriga`).
- **Test pred spremembo:** `trening-po-shemi` za 9–13 (200 vaj vsake):
  - mesta, celice vzorca in izbrisi = shema;
  - funkcija tehnike natanko korak sheme;
  - celice z dvema kandidatoma samo v vzorcu (10–13);
  - »Preveri« → »Pravilno!«, »Rešitev«, številke verige pri 13.
- **Brskalnik:** scenarij za 9–13 pri 375 px:
  - mreža v kartici, brez preliva;
  - male števke berljive (velikost);
  - posnetek gostote za ročni pregled.
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** ali je gosta mreža na telefonu še pregledna (ročni
  pregled, točka 2).

### Korak 5 – del A, 1 in 2

- **Kaj:**
  - nov `tools/izberi-vaje-po-shemi.js` (izpiše semena);
  - seznam `PRESEK_PO_SHEMI` v `trening/generators.js`;
  - preslikava stanja s simetrijo (1.6);
  - vaja po shemi postavi trojico v krogu (O9);
  - `CLAUDE.md`: orodje se požene ob spremembi motorja ali generatorja (kot banka).
- **Test pred spremembo:** `trening-po-shemi` za 1 in 2:
  - vsako seme iz seznama da primeren korak;
  - po preslikavi so vidne celice natanko blok in vrstica sheme, vzorec in izbrisi = shema;
  - uganka ima eno rešitev, števke na mreži so iz rešitve, kandidati se ujemajo z vidnimi števkami;
  - motor najde korak, `presekEnolicen()`, lažje tehnike nič;
  - trojica v krogu (vsaj ena, pri 1 med vajami 2–9);
  - »Preveri« → »Pravilno!«.
  
  `pocasni/trening-presek.test.js`: pravilo trojice v krogu po novem.
- **Brskalnik:** scenarij za 1 in 2 (delna mreža na mestih sheme, oznake roba, pravi kliki).
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** razumljivost skritih celic pasu (ročni pregled,
  točka 3).

### Zaključek

Ročni pregled (razdelek 5), vpis v `docs/rocni-test.md`, `docs/uskladitev.md` (naloga 4a zaključena,
naslednja je odločitev o nalogi 5).

## 5. Ročni pregled (enkrat, na koncu naloge)

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | trening, »Spoznaj«, pravi telefon | 11 · XY-krilo: tapni »Rešitev«, preberi besedilo, podrsaj stran gor in dol, tapni »Skrij rešitev«; nato tapni »Namig« in »Rešitev« zapored. | Ostane odprta med branjem in drsenjem, brez povečave ob dotiku in brez »dvojnega« odziva; drugi gumb zamenja vsebino. | Dotik je v brskalniku brez glave samo posnemanje – pravi telefon ima svoje zamike, povečavo in odziv na dvojni dotik. |
| 2 | trening, »Spoznaj«, telefon | Prva vaja pri 4 · Skriti par, 10 · W-krilo in 13 · XY-veriga: primerjaj mrežo s shemo nad njo. | Takoj vidiš, da je mreža narisana po shemi; preslikava »x = …« je jasna; gosta mreža pri 10 in 13 je še pregledna. | Presoja razumljivosti in preglednosti. |
| 3 | trening, »Spoznaj« | Prva vaja pri 1 · Izločitev izven bloka in 2 · Izločitev v bloku. | Jasno je, da sta blok in vrstica isti kot na shemi, čeprav shema kaže ves pas. | Presoja (O5). |
| 4 | trening, »Spoznaj« | 3 · Očitni par (vaja 2): odpri »Rešitev«, nato izberi eno celico vzorca in eno zunaj njega; odgovori napačno, nato pravilno. | Okvirji izbire se sproti spreminjajo (zelen / temno rdeč); ob napačnem odgovoru Rešitev ostane, ob pravilnem se zapre. Obnašanje je razumljivo. | Presoja, ali je sprotno prilagajanje (O12) razumljivo. |
| 5 | trening, »Vadi v uganki« | 4 · Skriti par: odpri »Namig«, zapri ga z drugim klikom; odpri »Rešitev«, zapri jo s »Skrij«. | Oba načina delujeta; napis in slog gumba sta jasna. | Presoja skladnosti z »Spoznaj«. |

## 6. Odločitve

| # | Vprašanje | Možnosti | Predlog |
|---|---|---|---|
| O1 | Števke za črke | stalne (x = 1, y = 2 …) · naključne | **naključne**, preslikava napisana nad mrežo (1.2) |
| O2 | Kako uporabnik ve, da je vaja po shemi | samo »· po shemi« nad vajo · še vrstica s preslikavo · nič | **»· po shemi« in vrstica s preslikavo**; shema je ob prvi vaji vedno odprta (1.3) |
| O3 | Drugi kandidati pri 9–13 | 1–2 polnili (pri 10–13 vsaj trije kandidati zunaj vzorca) · vsi drugi kandidati, kot v testu sheme (lažje tehnike nič, a celice s 6–8 kandidati) | **1–2 polnili** – kot zdajšnje vaje teh tehnik, berljivo; posnetek obeh na željo |
| O4 | Vaji 1 in 2 | prava uganka iz banke, premaknjena s simetrijo · sestavljena vaja | **prava uganka**; seznam semen izbere orodje, preveri test (1.6) |
| O5 | Prikaz pri 1 in 2 | blok in vrstica (15 celic) · ves pas 3 × 9 kot na shemi | **blok in vrstica**, kot druge vaje 1 in 2 |
| O6 | Kdaj je vaja po shemi | prva vaja vsakega kroga · samo prvič v seji | **vsakega kroga** |
| O7 | Rezultat | šteje · ne šteje | **šteje**, kot druge vaje |
| O8 | Pri 9 dve risbi | samo Nebotičnik (vaja 1) · še Zmaj kot vaja 2 po shemi | **samo vaja 1** – »ostale vaje ostanejo« |
| O9 | Trojica v krogu pri 1 in 2 | pri 1 med vajami 2–9, pri 2 je trojica vaja po shemi · kot zdaj | **tako** (1.6) |
| O10 | Napis stikal | »Skrij namig« / »Skrij rešitev« in pritisnjen slog · napis ostane, samo slog | **»Skrij …« in slog**, kot »Pokaži/Skrij« v reševalcu |
| O11 | Namig in Rešitev hkrati | kvečjemu eden odprt · neodvisna | **kvečjemu eden**, kot v »Vadi v uganki« |
| O12 | Izbira ob odprti Rešitvi | A: klik v mrežo zapre Rešitev · B: ostane odprta, oznake sledijo izbiri (pri 1 in 2 je izbira vidna) | **B** – kot nov pritisk z drugo izbiro zdaj, brez spuščanja |
| O13 | »Preveri« | pravilen odgovor zapre, napačen pusti · vedno zapre | **pravilen zapre, napačen pusti**, kot v »Vadi v uganki« |
| O14 | »Vadi v uganki« | tudi drugi klik zapre (»Skrij« ostane) · brez sprememb | **tudi drugi klik zapre** – enako v vsem treningu |
| O15 | Vrstni red | B najprej · A najprej | **B najprej** (razdelek 4) |

## 7. Izvedba

(Dopolnjuje se po korakih.)
