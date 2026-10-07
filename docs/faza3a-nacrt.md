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

**Popravki po pregledu koraka 1 – narejeni 2026-10-06** (Darko je korak 1 pogledal na telefonu;
pred korakom 2 štirje popravki). Korak 2 še ni začet.

1. **Shema trojice (5, 6).** Prej so imele vse tri celice po dve črki ({x, y}, {y, z}, {x, z}) –
   bralec bi sklepal, da ima celica trojice natanko dve. Zdaj mešan primer {x, y, z}, {x, y},
   {y, z} (pri skriti trojici vsaka še s prečrtanimi drugimi kandidati) in pod napisom o črkah
   vrstica »Celica trojice ima dve ali vse tri črke.« (polje `opomba` v `SHEME_TEHNIK`, odstavek
   `.shema-opomba`). Motor obe shemi potrdi (`nakedTriples()`, `hiddenTriples()` – en sam korak,
   celice in izbrisi sheme). Tri črke gredo v celico pri isti velikosti (13): korak med črkami je
   pri treh 10,5 enote namesto 11,5, sicer bi zunanji črki segli v zlati okvir celice vzorca –
   scenarij v brskalniku to izmeri (`getBBox()` znotraj notranjega roba okvirja).
2. **Legenda.** Rožnata »celica izbrisa« (`.shema-sw-izbris`, barva `--shema-izbris-bg`) je v
   legendi, kadar je taka celica na shemi (3, 5 – pri skritih so izbrisi v celicah vzorca, rožnate
   celice ni). Vrstni red: celice vzorca · celica izbrisa · kandidat za izbris.
3. **Ime tehnike pri vaji** (`.ex-label` v `trening/trening.css`, »Spoznaj« in »Vadi v uganki«):
   prej 11 px, velike tiskane, `--pencil` na `--card` (kontrast 2,9 : 1), zdaj 15 px, polkrepko,
   `--ink` (kontrast 12,6 : 1), brez velikih tiskanih. Test `tests/trening-kontrast.test.js`
   (barvi iz CSS, kontrast po WCAG vsaj 4,5, vsaj 14 px), v brskalniku izračunan slog v
   `tools/preveri-sheme-brskalnik.js`. Primerjave »Spoznaj« z izhodiščem
   (`tools/preveri-{presek,enojcki,vadi,izbira}-brskalnik.js`) vrstico med meritvijo skrijejo kot
   razdelek »Shema«. Posnetki prej in potem:
   [Spoznaj prej](slike/faza3a/popravki-ime-tehnike-spoznaj-375-prej.png),
   [Spoznaj potem](slike/faza3a/popravki-ime-tehnike-spoznaj-375-potem.png),
   [Vadi prej](slike/faza3a/popravki-ime-tehnike-vadi-375-prej.png),
   [Vadi potem](slike/faza3a/popravki-ime-tehnike-vadi-375-potem.png).
4. **Vrnitev na izbiro tehnike.** Vzrok: meni je med vajo skrit (`display: none`), stran z vajo je
   krajša in brskalnik položaj zmanjša; ob vrnitvi meni ostane na položaju vaje – pri 375 px na
   vrhu (E1). Zdaj `zacniKrog()` zapomni položaj menija (`menuPolozaj`), »Nazaj na izbiro« ga
   obnovi in, če kartica tehnike vseeno ni v oknu (drugačna velikost okna), pomakne do nje
   (`scrollIntoView({ block: 'nearest' })`). Test `tests/trening-meni.test.js` (nadomestni DOM ima
   zdaj `window.scrollY`/`scrollTo()`), v brskalniku po vsaki vrnitvi iz »Spoznaj« in »Vadi v
   uganki«: položaj kot ob kliku, kartica v oknu.

Posnetki shem po popravkih: [3](slike/faza3a/popravki-shema-3-375.png),
[5](slike/faza3a/popravki-shema-5-375.png), [6](slike/faza3a/popravki-shema-6-375.png).

**Popravek pred korakom 2 – narejen 2026-10-06.** Ob vstopu v vajo je stran ostala na položaju
menija (brskalnik ga le zmanjša na višino krajše strani) – pri 375 px pribl. 145 px niže, glava
odrezana. Zdaj `zacniKrog()` po izrisu vaje pomakne stran na vrh (`window.scrollTo(0, 0)`);
»Nazaj na izbiro« deluje kot prej (`menuPolozaj` se zapomni pred tem). Test
`tests/trening-meni.test.js` (vstop v »Spoznaj« in »Vadi v uganki« → položaj 0), v brskalniku
`tools/preveri-sheme-brskalnik.js` po vsakem vstopu v »Spoznaj«: `scrollY` 0, glava v oknu.

**Korak 2 – narejen 2026-10-06** (sheme 1, 2, 7, 8). Korak 3 še ni začet.

- **Samo x** pri vseh štirih (tudi pri 1 in 2 – druge števke za vzorec niso pomembne, risba je
  preglednejša; celice brez x so prazne). Napis o črkah zato »x – poljubna števka; prazna celica –
  brez x.« (dodatek 1).
- **1 · Izločitev izven bloka** (pas 3 × 9): v bloku 1 je x samo v dveh celicah vrstice 1 → izbris
  x v vrstici 1 v blokih 2 in 3; bloka 2 in 3 imata x tudi v drugih vrsticah. **2 · Izločitev v
  bloku**: v vrstici 2 je x samo v treh celicah bloka 2 → izbris x v bloku 2 v vrsticah 1 in 3.
  Ker ima 1 vzorec z dvema, 2 s tremi celicami, je pod napisom o črkah pri obeh »Vzorec ima dve ali
  tri celice.« (kot pri trojicah po pregledu koraka 1).
- **7 · X-krilo** (9 × 9): vogali V2S2, V2S7, V7S2, V7S7, izbrisi po dva v vsakem stolpcu, 21 x.
  **8 · Mečarica**: vrstice 2, 5, 7 in stolpci 2, 5, 8, vrstica 2 s tremi x, drugi dve z dvema –
  opomba »V vrstici vzorca je x v dveh ali vseh treh stolpcih.«; trije izbrisi, 22 x. Legenda: 7
  »vogali X-krila«, 1, 2, 8 »celice vzorca«.
- **Vrstica pod shemo** (dodatek 2): 1, 2 »Enako velja za stolpec namesto vrstice.«, 7, 8 »Enako
  velja z zamenjanimi vrsticami in stolpci.«
- **Kako so sheme sestavljene.** Ne na pamet: preprosta postavitev (samo vzorec in izbrisi) je
  imela napake, ki jih bralec opazi – npr. pri X-krilu je bil vogal edini x v bloku 9 (skriti
  enojček – X-krilo ne bi bilo potrebno), pri mečarici je X-krilo ali izločitev izven bloka našla
  del izbrisov. Dodatni x so poiskani z iskanjem (simulirano ohlajanje v zapisu na deski iz sheme)
  s pogoji, ki jih zdaj preverja test: funkcija tehnike najde natanko vzorec in izbrise sheme;
  lažje tehnike (vse pred njo v `ALL_TECHNIQUES` razen golega enojčka – narisani so samo kandidati
  x) in skriti enojček ne najdejo ničesar (ni osamljenega x v vrstici, stolpcu ali bloku); pri 9 × 9
  se prazne vrstice, stolpci in bloki ujemajo z vpisanimi x (en x na vrstico, stolpec in blok – pri
  X-krilu vrstica 6, stolpec 4 in srednji blok, pri mečarici praznih enot ni).
- **Postavitev v treningu** (odločitev): razdelek »Shema« je pri 9 × 9 (7–12) tudi v »Spoznaj«
  privzeto zaprt (`shemaPrivzetoOdprta()` v `trening/trening.js`), pri 1 in 2 odprt kot pri 3–6.
- **Gumb »Preveri« pri 1 in 2 pri 375 px** (izmerjeno, nič spremenjeno): spodnji rob gumba je
  1108 px od vrha strani, mreža vaje se začne pri 768 px (shema z napisi je visoka 239 px). Na
  telefonu z višino 667 ali 812 px je gumb pod robom zaslona; tudi z zaprto shemo bi bil pri 884 px
  (še vedno pod 812). Za primerjavo: 3–6 pri 752–796 px (odprta shema), 7, 8 pri 884 px (zaprta).
- Kljub vstopu na vrh strani se pri 1 in 2 na telefonu ob odprtju vidi le opis, »Razlaga« in
  shema; mreža vaje je pod robom – posnetka cele strani:
  [1](slike/faza3a/korak2-vaja-pointing-375.png), [2](slike/faza3a/korak2-vaja-box-line-375.png).
- Preverjanje: `tests/sheme.test.js` (motor na deski iz sheme za 1, 2, 7, 8; lažje tehnike in
  skriti enojček; prazne enote 9 × 9; opombe, napisi, mere SVG; razdelek v treningu – pas odprt,
  9 × 9 zaprt v »Spoznaj«), `tools/preveri-sheme-brskalnik.js` (375 in 1280 px, vseh osem shem –
  9 × 9 se za meritev odpre; vstop na vrh; izpis položaja »Preveri«). Posnetki shem:
  [1](slike/faza3a/korak2-shema-1-375.png), [2](slike/faza3a/korak2-shema-2-375.png),
  [7](slike/faza3a/korak2-shema-7-375.png), [8](slike/faza3a/korak2-shema-8-375.png).

**Popravka po pregledu koraka 2 – narejena 2026-10-07** (Darko je korak 2 pogledal na telefonu).

1. **Shema odprta.** V »Spoznaj« je razdelek »Shema« privzeto odprt pri vseh tehnikah, tudi pri
   shemah 9 × 9 (`shemaPrivzetoOdprta()` = `n === 'spoznaj'`); v »Vadi v uganki« ostane zaprt,
   stanje ostane do konca kroga kot prej. Odločitev o zaprtih 9 × 9 iz koraka 2 s tem ne velja več.
2. **Prečrtan kandidat.** Prej rdeča črka z rdečo črto 1,5 – videti kot zvezdica. Zdaj je črka
   temna kot druge (`--ink`, običajna debelina), čez njo rdeča črta 2 (zaobljeni konci), pri eni
   črki 12 enot dolga (prej 11), pri dveh ali treh v celici krajša, da se črti sosednjih črk ne
   zlijeta; prečrtane pike »…« ostanejo sive z rdečo črto. V legendi enako (`.shema-izbris`:
   `--ink`, `text-decoration: line-through var(--red) 2px`). Posnetki pri 375 px – prej:
   [3](slike/faza3a/popravek-precrtan-prej-naked-pair-375.png),
   [4](slike/faza3a/popravek-precrtan-prej-hidden-pair-375.png),
   [7](slike/faza3a/popravek-precrtan-prej-x-wing-375.png); potem:
   [3](slike/faza3a/popravek-precrtan-potem-naked-pair-375.png),
   [4](slike/faza3a/popravek-precrtan-potem-hidden-pair-375.png),
   [7](slike/faza3a/popravek-precrtan-potem-x-wing-375.png); povečano (CSS `zoom` 3 – posnetek
   ima gostoto 1, telefon 3): [prej](slike/faza3a/popravek-precrtan-prej-povecano.png),
   [potem](slike/faza3a/popravek-precrtan-potem-povecano.png).

**Korak 3 – narejen 2026-10-07** (sheme 9–12). Korak 4 še ni začet.

- **9 · Veriga ene števke** – dve risbi 9 × 9 samo z x, vsaka z naslovom: **Nebotičnik
  (Skyscraper)** (povezavi v stolpcih 2 in 7, konca V8S2 in V8S7 v isti vrstici, izbris V3S3) in
  **Zmaj z dvema vrvicama (2-String Kite)** (povezava v vrstici 2 in stolpcu 2, konca V2S3 in V3S2
  v bloku 1, izbris V8S8). Motor najde natanko ta korak s tem podtipom. Opomba »Nebotičnik je lahko
  tudi iz dveh vrstic, zmaj tudi drugače obrnjen.«
- **10 · W-krilo** – celici para {a, b} V2S2 in V5S8, povezava b v vrstici 8 (V8S2, V8S8 – v njiju
  še »…«, ker nista celici z dvema kandidatoma), izbris a v V2S8. Opomba »Povezava je lahko tudi
  stolpec ali blok.«
- **11 · XY-krilo** – pivot {x, y} V2S2, krili {x, z} V2S7 in {y, z} V7S2, izbris z v V7S7.
  Opomba »Krilo je lahko s pivotom tudi v istem bloku.«
- **12 · Edinstveni pravokotnik** – vogali V2S2, V2S6, V3S2 {x, y}, četrti V3S6 {x, y, …} z
  izbrisom x in y. Brez povezav (po načrtu so pri 9–11; vogali sami kažejo pravokotnik, izbris je v
  vogalu). Opomba »Bloka sta lahko tudi eden nad drugim.«
- **Povezave** (`povezave`, `vidita`, `vidi` v `SHEME_TEHNIK`): polna jantarna črta (`--shema-povezava`
  #A8820E, temnejša od zlatega okvirja, da je vidna tudi na jantarni celici) = povezava (vrstica ali
  stolpec, kjer je črka samo v teh dveh celicah); črtkana jantarna = celici vzorca se vidita;
  črtkana rdeča = celica izbrisa vidi celico vzorca. Črte gredo od središča do središča celice,
  skrajšane za 12 enot, zato ne prekrijejo črk; pod črkami, nad mrežo. V legendi so vrste, ki so na
  shemi (»povezava«, »celici se vidita«, »celica izbrisa vidi«), z vzorčkom črte.
- **Drugi kandidati pri 10–12** (`drugiVVzorcu`): celice vzorca imajo natanko narisane kandidate,
  drugod drugi kandidati niso narisani (sicer bi bila mreža polna »…«). Napis o črkah to pove:
  »Drugi kandidati so narisani samo v celicah vzorca.« Test zato pri 10–12 vsem celicam zunaj vzorca
  doda vse druge števke.
- **Kako so sheme sestavljene.** Kot pri 7 in 8 z iskanjem (simulirano ohlajanje): vzorec in
  izbris sta dana, iskanje doda črke tako, da tehnika najde natanko ta korak, lažje tehnike nič,
  prazne enote se ujemajo z vpisanimi črkami (pri več črkah v celicah brez črk in različne črke v
  različnih celicah), črte ne gredo čez celice s črkami, črk pa je čim manj. Pri 12 golega para
  vogalov ni mogoče obiti drugače kot s tem, da blok 1, vrstica 2 in stolpec 2 nimata drugih x, y.
  **XY-krilo je gostejše** (57 črk; W-krilo 35, pravokotnik 34, 9 po 18 in 19): tri črke, vsaka v
  vsaki enoti, kjer je, vsaj dvakrat, poleg tega se dve črki ne smeta v nobeni enoti pojaviti samo v
  istih dveh celicah (skriti par). Daljše iskanje (120 000 korakov, štiri semena) ni dalo manj kot 56.
- **Najdba ob delu (test koraka 2).** Pri shemah samo z x ima celica en kandidat, zato
  `hiddenSingles()` osamljenega x v enoti ne javi (pogoj `popcount > 1`), golega enojčka pa test
  izpusti – preverba »skriti enojček ne najde ničesar« je bila pri 1, 2, 7, 8 prazna. Sheme 1, 2,
  7, 8 so bile kljub temu pravilne (preverjeno), test zdaj osamljeno črko preveri posebej.
- **Meritev pri 375 px – 9 z obema odprtima risbama** (nič spremenjeno): razdelek »Shema« od 531 do
  1348 px od vrha strani (risbi 575–884 in 914–1223 px), mreža vaje se začne pri 1360 px (oznaka
  »Označena števka« tik nad njo), gumb »Preveri« 1716–1755 px; stran je visoka 1883 px. Na telefonu
  z višino 812 px se ob vstopu v vajo vidi opis, »Razlaga« in začetek prve risbe; do mreže je
  pribl. 1,5 zaslona. Za primerjavo pri 375 px: 7, 8 mreža od 923/946 px, »Preveri« do 1288/1311 px;
  10–12 mreža od 921–980 px, »Preveri« do 1332–1391 px. Posnetek cele strani:
  [vaja 9](slike/faza3a/korak3-vaja-turbot-fish-375.png).
- Preverjanje: `tests/sheme.test.js` (29 testov – motor na vseh 13 risbah, lažje tehnike, osamljena
  črka, prazne enote, povezave, napisi, izris, razdelek v treningu pri vseh 12),
  `tools/preveri-sheme-brskalnik.js` (375 in 1280 px, vseh 12 tehnik, obe risbi pri 9, povezave in
  prečrtanje z izračunanim slogom; izpis mreže in »Preveri«). Posnetki shem pri 375 px:
  [9 Nebotičnik](slike/faza3a/korak3-shema-turbot-fish-375.png),
  [9 Zmaj](slike/faza3a/korak3-shema-turbot-fish-2-375.png),
  [10](slike/faza3a/korak3-shema-w-wing-375.png), [11](slike/faza3a/korak3-shema-xy-wing-375.png),
  [12](slike/faza3a/korak3-shema-unique-rectangle-375.png).

**Popravek po pregledu koraka 3 – narejen 2026-10-07** (Darko je korak 3 pogledal na telefonu; pri 9
ostaneta obe risbi odprti, brez spremembe).

- **10 · W-krilo.** Prej so bile celici para in celici povezave enake (jantarne z zlatim okvirjem),
  v legendi skupaj »celici para in povezave«. Zdaj sta celici povezave **celici vzorca druge vrste**:
  bledejša podlaga (`--shema-vzorec2-bg` #FAF0D6) in **črtkan** zlati okvir – ločita se po odtenku in
  po obliki okvirja, torej tudi brez razlikovanja barv. Legenda ima dve postavki, »celici para« in
  »celici povezave« (vzorček s črtkano obrobo). Pod legendo je vrstica s sklepom (`.shema-sklep`,
  temno besedilo): »Vsaj ena celica para je a, zato a izbrišeš iz celic, ki vidijo obe.«
- **11 · XY-krilo.** Pivot se prej ni ločil od kril (»pivot in krili«). Zdaj je pivot celica druge
  vrste (bledejša, črtkan okvir), krili ostaneta polni; legenda »krili« · »pivot«. Pravilo za obe
  shemi je isto: polne so celice, ki jih vidi celica izbrisa (rdeče črtkane črte gredo do njih),
  bledejše s črtkanim okvirjem so vezne celice (povezava, pivot). Sklepa pri 11 ni (naloga ga je
  zahtevala samo pri 10).
- Zapis: »+« na začetku celice = celica vzorca druge vrste (`shemaCelica().vzorec2`), polji
  `vzorec2` (napis v legendi) in `sklep` v `SHEME_TEHNIK`. Motor shemo bere kot prej (celice druge
  vrste so del vzorca – korak W-krila ima vse štiri celice).
- Preverjanje: `tests/sheme.test.js` (izris in legenda, celici povezave sta konca povezave, pivot
  {x, y} vidi obe krili, druge sheme brez druge vrste, sklep samo pri 10), v brskalniku izračunan
  slog (podlaga, isti okvir, črtkan; vzorček v legendi). Posnetka pri 375 px – prej:
  [10](slike/faza3a/korak3-shema-w-wing-375.png), [11](slike/faza3a/korak3-shema-xy-wing-375.png);
  potem: [10](slike/faza3a/popravek3-shema-w-wing-375.png),
  [11](slike/faza3a/popravek3-shema-xy-wing-375.png).

**Korak 4 – narejen 2026-10-07** (sheme v oknu Pomoč, scenarij, `CLAUDE.md`, `docs/uskladitev.md`).

- **Pomoč »Tehnike«** v vseh treh aplikacijah: `izrisiTehnike()` (`shared/pomoc.js`) pri 1–12 pod
  posledico doda zložljivo »Shema« (`details.tehnika-shema`, privzeto zaprto) z isto risbo kot v
  treningu (`izrisiShemo()`); E1 in E2 brez. `shared/sheme.js` se zdaj naloži tudi v reševalcu in
  igri (`app/index.html`, `igra/index.html`, za `shared/pomoc.js`); brez nje seznam nima shem.
  Slog povzetka »Shema« kot v treningu (modro, polkrepko, 13 px) v `shared/pomoc.css`.
- **Dolžina okna** (izmerjeno, višina panela): z zaprtimi shemami pri 375 px igra 10 182 px,
  reševalec 5499, trening 5388; z vsemi dvanajstimi odprtimi pribl. 4200 px več (14 360 / 9677 /
  9567); pri 1280 px 6100 / 3517 / 3509 zaprte, pribl. 3900 px več odprte.
- Preverjanje: `tests/pomoc.test.js` (v vseh treh aplikacijah »Shema« pri 1–12, zaprto, ista risba
  kot v treningu; vsebina razdelka v vseh treh enaka), `tools/preveri-sheme-brskalnik.js` – zdaj tudi
  Pomoč v igri, reševalcu in treningu pri 375 in 1280 px: »Shema« pri 1–12 zaprta, pravi klik jo
  odpre, risba v panelu, največ 327 px, brez vodoravnega drsnika (stran in okno), iste meritve kot v
  treningu (črke v celicah, barve, legenda, napisi), Escape zapre okno; 869 preverb, vse drži.
  `tools/preveri-pomoc-brskalnik.js` in `tools/preveri-videz-brskalnik.js` brez napak, posnetek igre
  enak (99 posnetkov). Posnetka v igri pri 375 px: [3 · Očitni par](slike/faza3a/korak4-pomoc-naked-pair-375.png),
  [10 · W-krilo](slike/faza3a/korak4-pomoc-w-wing-375.png).
- **Faza 3a je izvedena**; zaključena bo, ko Darko potrdi ročni pregled (`docs/rocni-test.md`,
  razdelek »Faza 3a – shema vzorca«).
