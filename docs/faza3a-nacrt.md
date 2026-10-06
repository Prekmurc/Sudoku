# Faza 3a – shema vzorca pri razlagi tehnik 1–12 – načrt

Načrt 2026-10-06 (vir: `docs/uskladitev.md`, tabela »Vrstni red popravkov«, vrstica 3a, in »Vrstni red
po fazi 6«, naloga 2). **Potrjeno 2026-10-06** z dodatki – razdelek 7 (odločitve in dodatki imajo
prednost pred razdelki 2–6).

## 1. Obseg

| Del faze 3a | Stanje |
|---|---|
| vgrajeni primeri za vse stopnje in tehnike, z orodji v `tools/`, preverjeni, s testom | **narejeno 2026-10-05** (zadnji del faze 6): P_1–P_15, `tools/izberi-primere.js`, test v `tests/pocasni/generator.test.js`; `docs/uganke.md` pove, da je vir orodje |
| shema vzorca pri razlagi tehnik 1–12 (dodano 2026-10-04 ob ročnem pregledu faze 6) | **ostane** – ta načrt |

## 2. Shema vzorca

**Kje.** Predlog: oboje z isto funkcijo. V treningu v razdelku »Razlaga« (»Spoznaj« in »Vadi v
uganki«) med razlago in posledico – razdelek je privzeto zaprt, ogled ne šteje kot pomoč (shema je
splošna, odgovora vaje ne pove). V Pomoči »Tehnike« (vse tri aplikacije) pod posledico zložljivo
»Shema«, privzeto zaprto – 12 odprtih shem bi okno na telefonu podaljšalo za pribl. 3500 px. E1 in
E2 sheme nimata.

**Kako.** Lastna risba SVG iz podatkov, v znakih in barvah legende treninga: celica vzorca jantarna
z zlatim okvirjem (#EFD8A0, #C8A020), celica izbrisa rožnata (#F0B4AA), kandidat za izbris rdeče
prečrtan (`--red`); pod risbo legenda v obliki `.legenda-vaje` (»celici para« / »pivot in krili« ·
»kandidat za izbris«) in napis o črkah. Mreža s tankimi črtami in debelimi mejami blokov. Izsek po
tehniki:

| Tehnika | Izsek | Vzorec → izbris |
|---|---|---|
| 1, 2 | pas treh blokov (3 × 9) | x v bloku samo v eni vrstici → x v vrstici zunaj bloka (2 obratno) |
| 3–6 | ena vrstica | par / trojica {x, y(, z)} → x, y(, z) drugje; pri skritih drugi kandidati v vzorcu |
| 7, 8 | mreža 9 × 9, samo x | dve (tri) vrstice v istih stolpcih → x v stolpcih zunaj vzorca |
| 9 | 9 × 9, **dve risbi** | Nebotičnik in Zmaj z dvema vrvicama → x v celicah, ki vidijo oba konca |
| 10 | 9 × 9 | {a, b}, {a, b} in povezava b → a v celicah, ki vidijo obe celici para |
| 11 | 9 × 9 | pivot {x, y}, krili {x, z}, {y, z} → z v celici, ki vidi obe krili |
| 12 | 9 × 9 | trije vogali {x, y}, četrti {x, y, …} → x, y v četrtem |

Pri 9–11 so povezave: polna jantarna črta med celicami vzorca, črtkana rdeča »vidi« od celice
izbrisa. Koda: nova `shared/sheme.js` (podatki `SHEME_TEHNIK` po ključu iz `TEHNIKE_OPISI` in
`izrisiShemo(kljuc)`), slogi v `shared/pomoc.css` (naložen v vseh treh), barve kot nova imena
`--shema-*` (`tests/css-paleta.test.js`). Mreža iz `shared/mreza.js` ni primerna: riše števke na
stalnih mestih (črk ne zna), reševalec `mreza.css` ne naloži, vrstica bi bila 9 × 9 z 72 sivimi
celicami.

**Črke.** Predlog: črke kot v besedilih – x, y, z (pri 10 a, b), pri tehnikah ene števke (1, 2, 7–9)
x; »…« (sivo) = drugi kandidati, prazna celica = nobene od črk. Napis: »x, y – poljubni različni
števki; … – drugi kandidati.«

**Telefon 375 px.** Risba se prilagodi širini (največ 324 px, na 1280 px se ne poveča): celica pribl.
33 px – kot mreža vaj 3–12 (30 px) –, črke pribl. 12 px. Mreža 9 × 9 je visoka pribl. 300 px, v
zaprtem razdelku to ne moti. Posnetka prototipa (slogi še niso končni):
[shema-3-375.png](slike/faza3a/shema-3-375.png), [shema-11-375.png](slike/faza3a/shema-11-375.png).
Oba vzorca je motor potrdil (`nakedSubsets()`, `xyWing()` na deski iz sheme).

## 3. Faza 7 pred 3a?

**Ne – 3a naj ostane pred fazo 7.** Odvisnosti ni: faza 7 (6.5 Izvozi/Uvozi, 6.6 sporočila o
rešitvah, 6.7 sklanjanje, 6.10 delavec, 1.1 raven kot polje tehnike, 6.8 okno zbirke v reševalcu)
se ne dotika razlage tehnik. Stika sta samo dva in nista trka: 1.1 doda podatek k tehniki v drugi
tabeli, 6.8 spremeni okno v `pomoc.css`, shema pa tam doda nove razrede. Shema je vidna sprememba
iz ročnega pregleda faze 6 in z njo se Pomoč zaključi; faza 7 je brez vidne spremembe in jo pokrijejo
testi in posnetek igre ne glede na vrstni red.

## 4. Koraki izvedbe (vsak svoj pogovor, commit in push)

1. `shared/sheme.js`, slogi, sheme 3–6, prikaz v »Razlaga« v treningu, test motorja.
2. Sheme 1, 2 (pas) in 7, 8 (9 × 9, ena števka).
3. Sheme 9–12 s povezavami (pri 9 dve risbi).
4. Pomoč »Tehnike« v vseh treh aplikacijah, scenarij v brskalniku, `CLAUDE.md`,
   `docs/uskladitev.md` (3a zaključena), ročni pregled.

## 5. Odločitve zate

| # | Vprašanje | Možnosti | Predlog |
|---|---|---|---|
| O1 | kje | a) trening »Razlaga« + Pomoč zložljivo · b) samo trening · c) oboje, v Pomoči odprto | a |
| O2 | risba | a) SVG iz podatkov v barvah legende · b) mreža `shared/mreza.js` s števkami · c) statične slike | a |
| O3 | znaki | a) črke x, y, z (a, b) in »…« · b) prave števke kot v vaji | a |
| O4 | izsek | a) po tehniki (vrstica / pas / 9 × 9) · b) vedno 9 × 9 | a |
| O5 | 9–11 | a) povezave in pri 9 dve risbi · b) brez povezav, ena risba | a |

## 6. Preverjanje

Samodejno: nov hiter test `tests/sheme.test.js` – vsaka tehnika 1–12 ima shemo; na deski iz sheme
(črke → števke, celice brez črk dane) funkcija tehnike najde natanko vzorec in izbrise sheme (kot
generatorji vaj pri XY-krilu); napisi brez »številk«, ločila. `pomoc.test.js` (shema v vseh treh
enaka), test »Razlaga« (shema pri 1–12, pri E1/E2 ne). Nov scenarij `tools/preveri-sheme-brskalnik.js`
pri 375 in 1280 px: vseh 12 shem v »Razlaga« in v Pomoči, brez preliva, risba v kartici in panelu,
črke v celicah, barve enake legendi (izračunan slog), posnetki. Posnetek igre `--primerjaj` brez razlik.
Primerjave »Spoznaj« z izhodiščem: razlika samo v `.razlaga-tehnike`, izhodišče se premakne. Pred
vsakim commitom vsi testi.

Ročni pregled (en, ob koraku 4):

1. Trening, telefon, »Spoznaj« 11 → »Razlaga«: shema berljiva, razumeš jo brez besedila?
2. Trening, telefon, 3 in 9: vrstica in dve risbi pri 9 – je kaj odveč ali premalo?
3. Igra, monitor, Pomoč → Tehnike: odpri nekaj shem – dolžina okna, videz ob besedilu.

Ni avtomatsko, ker razumljivost in berljivost risbe lahko oceni samo bralec.

## 7. Odločitve in dodatki (Darko, 2026-10-06)

**Odločitve.** O1: a, s spremembo iz dodatka 4 (shema v treningu ni v »Razlaga«, ampak v svojem
razdelku). O2–O5: a. Faza 7 ostane za fazo 3a. `.gitattributes` za hooke: v redu.

**Dodatki k načrtu.**

1. Napis o črkah se ravna po tehniki: našteje samo črke, ki so na tej shemi (npr. pri 1, 2, 7, 8
   samo x, pri 3 x, y, pri 11 x, y, z; »…« samo, če je na shemi).
2. Pri tehnikah 1–8 je pod shemo kratka vrstica, da enako velja za stolpec ali blok, kjer to drži
   (3–6: vrstica, stolpec ali blok; 7, 8: vrstice ↔ stolpci; 1, 2: vrstica ↔ stolpec).
3. Po koraku 1 se delo ustavi. Darko pogleda sheme 3–6 na telefonu, preden se ostale naredijo
   v istem slogu.
4. Shema v treningu ni v »Razlaga«, ampak ima svoj zložljiv razdelek »Shema« nad mrežo vaje
   (pod »Razlaga«). V »Spoznaj« je privzeto odprt, v »Vadi v uganki« privzeto zaprt. Stanje
   (odprt/zaprt) ostane, ko greš na naslednjo vajo iste tehnike (do novega kroga). »Razlaga«
   ostane zaprta kot zdaj. V Pomoči ostane po načrtu: zložljivo, zaprto. Če se pri 375 px pokaže
   boljša postavitev, se jo predlaga v poročilu – brez spreminjanja.

**Koraki** (razdelek 4) ostanejo, korak 1 je zdaj: `shared/sheme.js`, slogi, sheme 3–6, razdelek
»Shema« v treningu, test motorja.

## 8. Izvedba

**Korak 1 – narejen 2026-10-06** (sheme 3–6, razdelek »Shema« v treningu). Nato se delo ustavi
(dodatek 3).

- `shared/sheme.js`: `SHEME_TEHNIK` (zapis celice »*x y -…«), `svgSheme()` (risba kot niz),
  `izrisiShemo()` (`<figure class="shema">`), `shemaNapisCrk()` (dodatek 1). Slogi in barve
  `--shema-*` v `shared/pomoc.css`.
- Sheme 3–6 so vrstica 1 × 9; celice vzorca so v treh različnih blokih (sicer bi bil isti vzorec
  hkrati vzorec bloka). 5 · Očitna trojica ima {x, y}, {y, z}, {x, z} kot v razlagi, 6 · Skrita
  trojica števke vsako v dveh od treh celic.
- **Odstopanje od prototipa** (posnetki ob delu): znak »…« je pri 13 px premajhen, da bi se
  prečrtanje videlo – na risbi so drugi kandidati tri pike (krožci), v celici s črkami pod njimi
  (črke zgoraj, pike spodaj), sicer sredi celice. Legenda pri skritih: prečrtane pike »drugi
  kandidati za izbris« (pri očitnih prečrtan »x« »kandidat za izbris«). Napis o črkah ima še »prazna
  celica – brez x in y« (pri skritih je bistveno, da x in y drugje v enoti nista).
- Trening: `razdelekShema()` v `trening/trening.js` (»Spoznaj« in »Vadi v uganki«), stanje
  `shemaKrog` (dodatek 4).
- Preverjanje: `tests/sheme.test.js` (motor na deski iz sheme, napisi, izris, razdelek v treningu),
  `tools/preveri-sheme-brskalnik.js` (375 in 1280 px). Primerjave »Spoznaj« z izhodiščem v
  `tools/preveri-{presek,enojcki,vadi,izbira}-brskalnik.js` razdelek »Shema« med meritvijo skrijejo
  in izpustijo (v izhodišču ga ni). Posnetki: `docs/slike/faza3a/korak1-shema-{3,4,5,6}-375.png`.
