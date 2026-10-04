# Faza 6 – pomoč (načrt)

**Stanje: načrt potrjen 2026-10-04.** Izhodišče: commit `03a815d` (2026-10-04), testi 468/468.
Sedanja besedila tehnik so izpisana v `docs/faza6-besedila.md`.

## Odgovori (2026-10-04)

1. Kartica: **A** – polje `povzetek`.
2. Oakever: **A** – odstrani iz vmesnika.
3. Pomoč v reševalcu in treningu: **C**, vendar se iz faze 7 preseli **samo okno Pomoč**; drugo
   iz 6.8 (okno zbirke, vnosna mreža) ostane v fazi 7.
4. Manjše: **vse tri da** (4a povsod »mogoč«, 4b »→« v sporočilih korakov, 4c »Vadi v uganki«
   pokaže razlago in posledico).
5. Najprej commit načrta in izpisa besedil, 5.3 označena v `uskladitev.md`. Nato korak a
   (s sklonom pri Mečarici, »Unique Rectangle« v sporočilih reševalca in »naključnimi vajami«),
   po njem osvežen `docs/faza6-besedila.md`. Korak b počaka na pripombe k besedilom.
6. Ročni pregled: en sam, na koncu faze.

Naloga 2026-10-04: faza 6 iz `docs/uskladitev.md` (tabela »Vrstni red popravkov« in »Opombe k
delom«) – popis točk 5.1, 5.2, 5.3, 5.5, 5.6, 4.6, 1.1 (poved o ravneh) in opomb k fazi 6, kaj
v Pomoči igre manjka po nalogi 5a, izpis besedil tehnik, predlog treh korakov in odločitve.
Povezav med aplikacijami (4.3) ne dodajam – so v »Kasneje«.

## 1. Popis

| Točka | Narejeno | Ostane | Korak |
|---|---|---|---|
| 5.1 besedila o tehnikah | imena iz `imeTehnike()`, »števka« (faza 4) | opis kartice iz enega vira, Oakever, »mogoč«/»možen« | b |
| 5.2 opis stopenj | vsebina obeh meril je pravilna, nova imena, »srednje« | dva opisa v `shared/generator.js`, besedilo v HTML iz JS | a |
| 5.3 »Poglej« v Pomoči igre | narejeno 2026-09-23 (z 2.3) | samo oznaka v `uskladitev.md` | a |
| 5.5 pomoč, razvojne poti | – | poti in `localStorage` v besedilih, zastarele »naključne vaje«, okno Pomoč v reševalcu in treningu | a, c |
| 5.6 zastarela besedila | vse štiri naštete postavke | tri nove najdbe (glej 5.6) | a |
| 4.6 ločila | trening (večinoma) | 21 vezajev z razmikom, 3 dolgi pomišljaji, 5 ravnih narekovajev, 3 tri pike; puščica »->« (odločitev 4b) | a |
| 1.1 poved o ravneh | ravni v kodi, značke v barvah oznak (faza 5) | poved v razdelku »Tehnike« v Pomoči igre | c |
| opomba: prekratki opisi | – | vloge polj in nova besedila (tvoj pregled) | b |
| opomba: legenda v »Spoznaj« | legenda v »Vadi v uganki« | legenda v »Spoznaj« | b |

### 5.1 Besedila o tehnikah

**Narejeno:** ime tehnike je povsod iz `imeTehnike()` (faza 4), naslov kartice preverja test,
izraz je »števka«.

**Ostane:**

- Opis na kartici je samostojno besedilo v `trening/index.html` in se od `razlaga` razlikuje
  pri vseh 14 tehnikah (primerjava v `docs/faza6-besedila.md`). Test opisa ne primerja, preveri
  samo, da v njem ni angleških imen (`tests/besedila-html.test.js`).
- Oakever na karticah 9 in 10 (odločitev 2).
- »možen« na karticah 1 in 2, drugod »mogoč«. Opomba k 5.1 pravi, da sporočila korakov
  uporabljajo »mogoč« – to drži samo delno: pet sporočil v `shared/engine.js` (očitni in skriti
  enojček, 1, 2, skriti par/trojica – vrstice 153, 175, 203, 227, 292) ima »možen/možna/možni/
  možne«, naloga in namig E1 pa »celico z eno samo možno števko« (štirikrat). Odločitev 4a.

### 5.2 Opis stopenj ugank

**Narejeno:** vsebina je zdaj pravilna. Namig v oknu »Nova uganka« (`igra/index.html:197`) in
namig miške na gumbih stopenj (`STOPNJE_UGANK[].opis`) opisujeta merilo generatorja
(`ustrezaIskanju`), Pomoč (`igra/index.html:176`) obe merili in razliko. Imena tehnik in
»srednje« so iz faze 4.

**Ostane:** merilo generatorja je zapisano trikrat (namig v HTML, `opis` v JS, odstavek v
Pomoči), merilo ocene (`ustreza`) samo v Pomoči. Predlog iz 5.2 velja: v `STOPNJE_UGANK` dva
opisa – `opis` (ocena, `ustreza`) in `opisIskanja` (generator; zdajšnji `opis` se preimenuje) –
in HTML ju izpiše iz JS: okno »Nova uganka« opise generatorja, Pomoč obe skupini in poved o
razliki. Opis Ekstrema ima vezaj (»XY-veriga - še ni v reševalcu«).

### 5.3 Pomoč v igri o gumbu »Poglej«

Narejeno 2026-09-23 skupaj z 2.3: Pomoč (razdelek »Zbirka ugank«) pove, da ima rešena uganka
»Poglej«, po »Začni znova« pa »Nadaljuj«, kar se ujema s `zbirkaStanjeUganke()`. V
`uskladitev.md` točka ni označena kot narejena – označim v koraku a.

### 5.5 Reševalec in trening nimata pomoči, besedila kažejo razvojne poti

**Narejeno:** nič.

**Ostane:**

- razvojne poti v besedilih: `app/index.html:87` »(enaka oblika kot docs/uganke.md)«,
  `igra/index.html:116` »(`app/`)«, `:173` »(`localStorage`)«, »(`app/`)« in »`file://`«,
  `:185` »(`trening/`)«. Predlog: imena aplikacij brez poti, »v tem brskalniku« brez
  `localStorage`, `file://` opisno (»ko stran odpreš neposredno iz datoteke«). Glava izvožene
  datoteke (`shared/zbirka.js:596–600`) ostane – je zapis v datoteki, ne v vmesniku;
- »enako kot "hitri svinčnik" v aplikaciji« (`app/index.html:42`) – po odločitvi 2;
- zastarelo: glava treninga »Izberi tehniko in vadi z naključno generiranimi vajami.«
  (`trening/index.html:20`) in Pomoč igre »… kjer vsako tehniko lahko vadiš na naključnih
  vajah« (`igra/index.html:185`) – od »Vadi v uganki« (in E1, E2, 1, 2 v »Spoznaj«) so vaje
  tudi stanja pravih ugank;
- reševalec in trening nimata pomoči: številke tehnik, značke ravni, načina »Spoznaj« in »Vadi
  v uganki«, postopnost, štetje »s pomočjo« in tipke niso nikjer razloženi; trening ne pove, da
  iste številke kažeta igra in reševalec (odločitev 3).

### 5.6 Zastarela besedila v kodi in dokumentaciji

Vse štiri postavke so popravljene: `shared/base.css` (»vse tri aplikacije«), `CLAUDE.md`,
komentar o »modri« zadnji poudarjeni števki (zdaj v `shared/plosca.js:251`, brez barve),
`docs/tehnike.md` (faza 4). Ob popisu sem našel tri nova:

- Mečarica v »Spoznaj«: »Števka 6: najdi 3 vrsticah, kjer se 6 pojavi …« – napačen sklon
  (`trening/generators.js:539` vstavi mestnik `baseName` tudi tam, kjer je potreben tožilnik);
  prav »najdi 3 vrstice« oziroma »3 stolpce«;
- reševalec: »tehnika Unique Rectangle zato ni bila uporabljena« (`app/app.js:444`, `:447`) –
  angleško ime zunaj oklepaja (pravilo iz faze 4); prav ime iz `imeTehnike()`;
- »naključne vaje« (glej 5.5).

### 4.6 Ločila in narekovaji

Popis s skripto (nizi v JS brez komentarjev in besedilo HTML vseh treh aplikacij; lažne najdbe –
izrazi v `${…}`, CSS – izločene):

| Vrsta | Kje | Primer |
|---|---|---|
| vezaj z razmikom » - « (21) | `app/app.js:311, 331, 398, 441, 444, 447`; `igra/igra.js:88, 131, 294, 932, 1084, 1243, 1250, 1252`; `trening/v-uganki.js:274` (namig miške »Označi izbrane«); `shared/generator.js:104`; `shared/zbirka.js:771, 802`; `app/index.html:42, 87`; `igra/index.html:116` | »Uganka je rešena - ni več korakov.« |
| dolgi pomišljaj »—« (3) | `shared/engine.js:743` (razlaga W-krila, dvakrat); `igra/igra.js:268` (» — opomba« v kartici »Uganka«); `shared/zbirka.js:304` (»Program rešil: —« v namigu miške) | »… samo v dveh celicah — nobena ne sme …« |
| ravni narekovaji (5) | `app/app.js:238`; `app/index.html:21`, `:42`; `trening/trening.js:392`; `shared/zbirka.js:787` | »Najprej pritisni "Reši".« |
| tri pike »...« (3) | `app/app.js:402`; `igra/igra.js:301`, `:1244` | »Rešujem ...« (trening ima »Iščem vajo …«) |
| puščica »->« (13) | sporočila korakov v `shared/engine.js` (153, 175, 203, 227, 256, 292, 335, 373, 436, 484, 519, 562, 900) | »… V5S3 -> V5S3 = 4.« (trening ima »Blok 4 → Vrstica 6«) – odločitev 4b |

Predlog: » – «, »…« in znak »…«; »—« kot »ni podatka« → »–« (kot »Uganka: –« v treningu).

### 1.1 Poved o ravneh v Pomoči igre

**Narejeno:** ravni v kodi (`GEN_LAHKE` … `GEN_EKSPERTNE`), značke LAHKA/SREDNJA/NAPREDNA v
barvah oznak korakov (faza 5). Pomoč igre v odstavku o oknu »Nova uganka« že pove »srednje
tehnike (1–6 …)«, »napredno tehniko (7–12 …)« in da stopnjo določa najtežja raven.

**Ostane:** razdelek »Tehnike« ravni ne omeni (seznam E1 … 12 je brez ravni), trening značk ne
razloži. Predlog (korak c): uvodna poved v »Tehnike« – »Tehnike so v treh ravneh: lahke (E1,
E2), srednje (1–6) in napredne (7–12); v treningu jih kažejo značke. Stopnja uganke je raven
njene najtežje tehnike.« – in pri vsaki tehniki v seznamu značka ravni v barvi iz treninga.
Ostanek 1.1 (raven kot polje tehnike, `tagClass()` iz ravni) ostane v fazi 7.

### Opomba k fazi 6: opisi tehnik so ponekod prekratki

Iz izpisa v `docs/faza6-besedila.md`:

- **»Vadi v uganki« pokaže samo razlago.** Pri 3–6 je to ena poved, ki ne pove, kaj se izbriše
  (»Najdi 2 celici, ki skrivata par.«), odgovor v »Vadi v uganki« pa je prav izbris. Kaj se
  izbriše (`posledica`), piše samo v Pomoči igre.
- **V »Spoznaj« se pri 1, 2, 7 in 8 razlaga ne pokaže** – generator ima svoj opis s števko
  vaje. Navodilo je prazno pri 1, 2, 3, 5, 7, 8, posledica pri 1, 2, 9, 10, 12.
- **Neenoten slog:** kartica »Najdi dve celici …«, razlaga »Najdi 2 celici …«; razlaga pri 9,
  10, 12 »izbrišemo«, drugod »izbrišeš«; kartice 9–12 imajo po 2–4 povedi, razlage 3–6 eno.
- **Naloga v »Vadi v uganki« brez območja:** »Poišči korak tehnike Očitni par in …« – ime z
  veliko začetnico sredi povedi (iz `imeTehnike()`), z območjem pa »… poišči očitni par …«
  (tožilnik iz `VADI_TOZILNIK`).

Predlog v koraku b.

### Opomba k fazi 6: legenda barv v »Spoznaj«

**Narejeno:** legenda v »Vadi v uganki« (`legendaKoraka()` v `trening/v-uganki.js`: celice
vzorca, kandidat za izbris / izbrisani kandidati). Barve v »Spoznaj« so od nalog »enotna
izbira« in »prečrtanje« (2026-10-04) končne in pri vseh vajah 3–12 enake (opis v
`uskladitev.md`, »Opombe k delom«, faza 6).

**Ostane:** v »Spoznaj« legende ni pri nobeni vaji – tudi pri 1 in 2 ne, kjer so oznake iz
`shared/mreza.js` iste kot v »Vadi v uganki«. Predlog v koraku b.

### Opaženo zunaj faze 6 (ne popravljam)

- Ime vgrajenega primera »Primer 2 (Ekstrem, brez ugibanja)« je zastarelo (težavnost je Zelo
  težka, Ekstrem zdaj pomeni ekspertno tehniko); »presek« v imenu Primera 3 je star izraz za
  1 in 2. Imena primerov so odprt del točke 3 v `uskladitev.md`.
- Glava izvožene datoteke Markdown (`shared/zbirka.js:596–600`) ima ravne narekovaje, »->« in
  poti – zapis v datoteki, ostane.
- Postavke iz »Kasneje«, ki se dotikajo pomoči (»tvoje oznake« v legendi »Vadi v uganki«,
  Escape pri povečanem prikazu v reševalcu, »drži« pri pomaknjeni strani), ostanejo tam.

## 2. Pomoč igre po nalogi 5a

Naloga 5a je v »Kako igrati« dodala en odstavek (`igra/index.html:148`: stikalo, skrit niz
»Odstrani«, vseh 9 števk v nizu »Vpiši«, poudarek, »Pokaži rešitev«, »Vklopi kandidate«) in
novo ime kartice »Prikaz«; slog je pustila fazi 6, kartice »Kako« ni spreminjala
(`docs/kandidati-stikalo-nacrt.md`, korak 3). Pri izklopljenih kandidatih manjka ali ne drži:

1. **Kartica »Kako«** (`igra/index.html:101–103`): »Omogočene so samo števke, ki so za izbrano
   celico smiselne.« in »Shift+1–9 odstrani kandidata« – pri izklopu so v nizu »Vpiši« vse
   števke, Shift+števka ne naredi nič.
2. **»Kako igrati«, prvi odstavek** (`:146`): isto absolutno »Omogočene so samo števke …«;
   izjema je dva odstavka niže.
3. **Odstavek »več celic«** (`:149`): ne pove, da pri izklopu izbire več celic ni (kljukica je
   skrita skupaj z nizom, Ctrl+klik ne doda, ob izklopu se izbira počisti).
4. **Tipkovnica** (`:153`): »Shift+1–9 odstrani ali vrne kandidata« brez izjeme.
5. **Poudari** (`:150`): »obarva vse celice, kjer je števka kandidat ali je vpisana« – izjema
   je v odstavku 5a, ne tu.
6. **»Pomoč pri reševanju«:** o koraku pri izklopu (kandidati samo v celicah koraka, gumb
   »Vklopi kandidate«) piše v »Kako igrati«, v razdelku o koraku pa ne; »Barve na mreži«
   (`:163`) tega ne omeni.
7. **Kdaj se izklop splača:** lahka uganka (samo enojčki) in tehniki 1, 2 gredo brez
   kandidatov, od 3 naprej ne. Okno »Nova uganka« že pravi »lahka … brez zapisanih
   kandidatov«, Pomoč tega s stikalom ne poveže. (Opozorilo ob izklopu je v »Kasneje«; tu samo
   poved.)

Predlog (korak c): odstavek 5a razdelim – vsaka izjema gre na svoje mesto (»pri izklopljenih
kandidatih …«), v »Kako igrati« ostane kratek odstavek o stikalu s povedjo, kdaj se izklop
splača; kartica »Kako« dobi isto prilagoditev. Obnašanja ne spreminjam.

Poleg tega v Pomoči igre: razvojne poti in »naključne vaje« (5.5), poved o ravneh (1.1), opis
stopenj iz JS (5.2), ločila (4.6).

## 3. Besedila tehnik

`docs/faza6-besedila.md` – za vsako tehniko E1, E2, 1–12: opis na kartici, razlaga, navodilo,
posledica, naloga v »Spoznaj« (naslov in opis, primeri iz generatorja; pri E1 in E2 vse tri
stopnje postopnosti, pri 4 in 6 vprašanje druge faze, oznake nad mrežo in pod njo) in naloga v
»Vadi v uganki« (brez območja in z njim). Na začetku je preglednica, kje se katero besedilo
pokaže.

Izpis je samodejen: skripta (v začasni mapi, ne v repozitoriju) naloži kodo v Node in pokliče
iste funkcije kot trening, zato je besedilo dobesedno to, kar se pokaže. Besedila niso
spremenjena. Namigov in sporočil korakov nisem izpisal – dodam, če želiš.

## 4. Koraki

Vsak korak je svoj commit (in push), pred vsakim so testi zeleni.

### Korak a – mehanski popravki (4.6, 5.6, 5.2, 5.3, razvojne poti)

Obnašanje se ne spremeni, vsebina besedil tudi ne – razen popravkov napak in zastarelega.

- **4.6:** vsa mesta iz preglednice; po odločitvah 4a in 4b še »mogoč« in »→«.
- **5.6:** sklon pri Mečarici, ime tehnike v sporočilih reševalca (`imeTehnike()`), »naključne
  vaje« v glavi treninga in v Pomoči igre (samo dejstvo, slog v koraku c).
- **Razvojne poti** (5.5): štiri mesta in »hitri svinčnik« (po odločitvi 2).
- **5.2:** `opis` + `opisIskanja` v `STOPNJE_UGANK`; namig v oknu »Nova uganka« in seznam
  stopenj v Pomoči igre iz JS (v HTML ostane prazen element), namig miške na gumbih iz
  `opisIskanja`. Vsebina ostane, oblika v Pomoči je seznam namesto ene dolge povedi.
- **5.3:** oznaka v `uskladitev.md`.
- **Testi:**
  - nov `tests/locila.test.js`: nizi v JS (brez komentarjev) in besedilo HTML treh aplikacij
    nimajo vezaja z razmikom med besedami, dolgega pomišljaja, ravnih narekovajev v besedilu
    in treh pik; izjema je glava izvoza (seznam izjem v testu, z razlogom). Kot
    `kontrolni-znaki.test.js` izpiše datoteko, vrstico in niz;
  - `tests/besedila-html.test.js`: v besedilu HTML ni poti (`app/`, `igra/`, `trening/`,
    `docs/`) in ne `localStorage`;
  - `tests/generator.test.js`: vsaka stopnja ima `opis`, stopnja generatorja še `opisIskanja`;
  - `tests/igra-ui.test.js`: namig v oknu »Nova uganka« in Pomoč vsebujeta opise iz JS;
  - popravki testov in scenarijev, ki preverjajo dobesedno besedilo z vezajem ali »->«
    (`tests/niz-danosti.test.js`, `turbot-fish`, `w-wing`, `xy-wing` …,
    `tools/preveri-niz-brskalnik.js`).

### Korak b – opisi tehnik in legenda

1. Ti pregledaš `docs/faza6-besedila.md` in mi daš pripombe ali nova besedila.
2. Iz njih napišem predlog novih besedil v isto datoteko (razdelek »Predlog« pri vsaki tehniki;
   staro ostane za primerjavo) in počakam na OK. To je odločitev o vsebini, ne ročni pregled.
   Vloge polj (odločitvi 1 in 4c): **povzetek** – ena poved za kartico; **razlaga** – kako
   vzorec najdeš in zakaj velja (»izbrišeš«, ne »izbrišemo«); **navodilo** – kaj klikneš v
   »Spoznaj«; **posledica** – kaj iz vzorca sledi.
3. Koda: nova besedila v `TEHNIKE_OPISI` (s poljem `povzetek` po odločitvi 1), kartico izpolni
   `trening.js` (HTML ima nadomestek, enak polju – kot pri naslovu h3), »Vadi v uganki« po 4c,
   Oakever po odločitvi 2, opisi nalog v `trening/generators.js`, če jih spremeniš.
4. **Legenda v »Spoznaj«** za 1–12 (E1 in E2 je nimata, kot v »Vadi v uganki«), pod »Rešitvijo
   (drži)« in pod »Pravilno!«. Našteje samo vrste celic, ki so takrat na mreži:
   - ob »Rešitvi«: celice vzorca, celice izbrisa, kandidat za izbris; samo kadar je kaj
     izbrano, še okvirji – pravilno izbrana (zelen), napačno izbrana (temno rdeč), spregledana
     (zlat);
   - po pravilnem odgovoru: izbrane celice (zelene), celice izbrisa, izbrisani kandidati.

   Ker legenda vedno opisuje trenutno stanje, dvoumnost iz opombe (rožnata celica z rdečim
   okvirjem pomeni ob »Rešitvi« nekaj drugega kot po odgovoru) ne nastane. Vzorček v legendi
   ima isti razred ali spremenljivko kot celica, ne lastne barve. Pri 1 in 2 (mreža iz
   `shared/mreza.js`) se uporabi obstoječa `legendaKoraka()`.
- **Testi:** kartica = `povzetek` za vseh 14 (nadomestni DOM po nalaganju `trening.js`) in
  nadomestek v HTML = polje; `tests/trening-tehnike.test.js` za nova polja (vsaka tehnika ima
  povzetek, brez »številk«, angleških imen zunaj oklepaja in prepovedanih ločil); legenda v
  nadomestnem DOM-u (`trening-resitev`, `trening-precrtanje`, `trening-presek`): ob »Rešitvi«
  brez izbire, z delno pravilno izbiro in po pravilnem odgovoru našteje natanko vrste, ki so na
  mreži, po spustu izgine.
- **Brskalnik:** razširim `tools/preveri-izbira-brskalnik.js` (vaje 3–12, pravi pritisk miške):
  legenda je vidna v kartici pri 375 in 1280 px, barva vsakega vzorčka = izračunana barva
  ustrezne celice na mreži; 1 in 2 v `preveri-presek-brskalnik.js`. Primerjave »Spoznaj« z
  izhodiščem (`preveri-presek-`, `-enojcki-`, `-vadi-`, `-izbira-brskalnik.js`) premaknem na
  commit koraka a; v koraku b so dovoljene razlike samo v naslovu in opisu naloge, kartici
  menija in novem elementu legende.

### Korak c – okna Pomoč

- **Igra:** razdelitev odstavka 5a in kartica »Kako« (razdelek 2), poved o ravneh in značke v
  »Tehnike« (1.1), »Tehnike« pove, da ima trening »Spoznaj« in »Vadi v uganki«. Drugi odstavki
  ostanejo vsebinsko enaki.
- **Reševalec in trening** po odločitvi 3. Pri C: gumb »Pomoč« v glavi (desno, `.top-btn`) in
  okno z razdelki; seznam »Tehnike« izriše skupna funkcija (iz `igra/igra.js:562` v `shared/`),
  okno (CSS `.dialog*` iz `igra/igra.css` in odpiranje/zapiranje z Escape) gre v `shared/`. To
  je del ostanka 6.8 iz faze 7 – potreben, da ne nastane tretja kopija okna. Okno zbirke v
  reševalcu (`#library`) ostane za fazo 7.
  - **reševalec** (kratko): vnos (mreža, Niz, Primer), »Reši« in »Pokaži kandidate«, rešitev
    in povzetek tehnik, koraki (kljukice, mala mreža, povečan prikaz), zbirka (kaj se shrani,
    težavnost, ista kot v igri), stopnje (iz JS, 5.2), Tehnike;
  - **trening:** »Spoznaj« in »Vadi v uganki« (od kod so vaje, krog 9 vaj), postopnost (oznaka,
    območje), Namig in Rešitev (»drži« v »Spoznaj«, klik v »Vadi v uganki«) in »s pomočjo – ne
    šteje«, barve (kratko – legenda je pri vaji), značke ravni in številke (iste v igri in
    reševalcu), tipke (števke, Shift+števka, Ctrl+Z/Y, O), Tehnike.
- **Testi:** nadomestni DOM – gumb odpre okno, ✕, klik ob oknu in Escape ga zaprejo, seznam
  »Tehnike« ima 14 postavk z istim besedilom v vseh treh aplikacijah, poved o ravneh in
  značke; `tests/besedila-html.test.js` pokrije nova besedila HTML.
- **Posnetek igre:** razlike samo v kartici »Kako«.
- **Brskalnik:** `tools/preveri-videz-brskalnik.js` odpre še okni Pomoč v reševalcu in treningu
  (320–1280 px: okno pokrije zaslon, brez vodoravnega drsnika, gumb v glavi v isti vrstici kot
  nadnaslov, skupne sestavine enake), brez napak JS.

## 5. Odločitve zate

### 1. Kartica v treningu: polje povzetek ali razlaga

- **A – nov `povzetek`** v `TEHNIKE_OPISI` (ena poved), kartico izpolni `trening.js`. Kartica
  ostane kratka, razlaga je lahko daljša, ker je pri vaji. Eno polje več za vzdrževanje.
- **B – kartica pokaže `razlaga`.** Brez novega polja, en sam opis tehnike. Kartice 9–12 bi
  imele 3–4 povedi (meni postane dolg), ali pa mora biti razlaga kratka kot kartica.
- **C – kartica brez opisa** (ime in značka), opis šele pri vaji. Najkrajši meni, a kdor
  tehnike ne pozna, ne ve, kaj izbira.

**Predlog: A.** Meni je za izbiro, vaja za učenje – potrebujeta različno dolžino. Test
zagotovi, da je vir eden.

### 2. Omembe Oakevra

Zdaj: kartica 9 (»Aplikacija Oakever ta vzorec imenuje Skyscraper oziroma Zmaj z dvema
vrvicama.«), kartica 10 (»… imenuje Krilo W.«), reševalec »enako kot "hitri svinčnik" v
aplikaciji« (brez imena). Komentarji v kodi in sopomenke v `docs/tehnike.md` ostanejo ne glede
na odločitev.

- **A – odstrani iz vmesnika;** »hitri svinčnik« zamenja opis (»samo izključitev po vrstici,
  stolpcu in bloku, brez tehnik«). Podtipa 9 sta že v razlagi z našimi imeni, »Krilo W« je
  »W-krilo« z drugim besednim redom.
- **B – sopomenke v `TEHNIKE_OPISI`** (npr. polje `drugod`: »V aplikaciji Oakever: Krilo W«),
  vidne v treningu in v Pomoči igre.
- **C – pusti na kartici,** samo uskladi z našimi imeni (kot predlaga opomba k 5.1).

**Predlog: A.** Kdor Oakevra ne pozna, od omembe nima nič; sopomenke so v `docs/tehnike.md`.

### 3. Pomoč v reševalcu in treningu: obseg

- **A – brez okna:** popravljena poved v glavi reševalca, v treningu kratek odstavek pod glavo
  (številke, značke, načina).
- **B – zložljiv razdelek na strani** (`<details>`, kot »Barve poudarka« v igri): reševalec
  »Kako deluje«, trening »Kako vaditi« in »Tehnike«. Brez okna in brez selitve CSS.
- **C – okno »Pomoč« kot v igri:** gumb v glavi, razdelki, skupni seznam »Tehnike«; okno (CSS
  in odpiranje) gre iz igre v `shared/` (del 6.8 iz faze 7 pride prej).

**Predlog: C,** s kratko vsebino (korak c). Gumb »Pomoč« je potem v vseh treh aplikacijah na
istem mestu (glava je od faze 5 skupna), trening ima največ neopisanega (postopnost, štetje,
tipke), seznam tehnik pa je za stran predolg.

### 4. Manjše odločitve (s predlogom – če se strinjaš, ni treba odgovarjati posebej)

- **4a »mogoč« ali »možen«:** A – povsod »mogoč« (kartici 1, 2; pet sporočil korakov; naloga
  E1 »celico z eno samo možno števko« → »celico, v kateri je mogoča samo ena števka«); B –
  samo kartici. **Predlog A** – sporočila korakov vidiš v vseh treh aplikacijah.
- **4b puščica v sporočilih korakov:** A – »→« namesto »->« (13 sporočil); B – ostane.
  **Predlog A**, v koraku a (testi s celim besedilom sporočila se popravijo).
- **4c kaj pokaže vaja:** »Vadi v uganki« pokaže razlago **in posledico** (kot Pomoč igre –
  odgovor je izbris, posledica pove, kaj se izbriše); v »Spoznaj« pri 1, 2, 7, 8 ostane lasten
  opis generatorja (je razlaga s števko vaje). **Predlog: tako**; dokončno ob pregledu besedil.

## 6. Samodejno preverjanje

- testi `node --test "tests/*.test.js"` (izhodišče 468/468) z novimi testi iz korakov;
- `tests/kontrolni-znaki.test.js` (skripte za urejanje v datoteko, ne v heredoc);
- posnetek igre `tools/posnetek-igre.js --primerjaj tools/posnetki/igra-po-5a.json` po vsakem
  koraku – razlike samo v besedilih, ki jih korak spremeni (a: ločila v statusu in vrstici pod
  nizi, c: kartica »Kako«); na koncu novo izhodišče `tools/posnetki/igra-po-faza6.json`;
- brskalnik brez glave: `preveri-videz` (vsi koraki), `preveri-niz` (a), `preveri-izbira`,
  `preveri-presek`, `preveri-enojcki`, `preveri-vadi` (b – legenda, primerjava z izhodiščem),
  `preveri-kandidati` (c – stikalo dela kot prej);
- `tests/besedila-html.test.js` in `tests/trening-tehnike.test.js` za vsa nova besedila
  (»števka«, angleška imena samo v oklepaju, brez »Prikaži«, ločila).

Samodejno ne morem preveriti, ali so besedila razumljiva in ali opis ustreza obnašanju – to je
ročni pregled.

## 7. Ročni pregled (en sam, na koncu, največ 5 točk)

1. **Trening, meni in nekaj vaj** (npr. 4, 9 in E2 v »Spoznaj« in »Vadi v uganki«): preberi
   kartico, razlago in nalogo. Pričakovano: besedilo je razumljivo in se ujema s tem, kar je
   na mreži. Zakaj ne samodejno: razumljivost presodi bralec; test preveri samo, da je besedilo
   na svojem mestu in brez prepovedanih izrazov in ločil.
2. **Trening, »Spoznaj« 3–12 na telefonu:** z delno pravilno izbiro drži »Rešitev«, nato reši
   pravilno. Pričakovano: legenda našteje natanko barve, ki so na mreži, in je berljiva. Zakaj
   ne samodejno: brskalnik brez glave preveri prisotnost in barve, ne berljivosti; pravega
   dotika ne posnema (»drži« ima z dotikom znane posebnosti).
3. **Igra, okno Pomoč in okno »Nova uganka« pri izklopljenih kandidatih:** preberi »Kako
   igrati« in »Pomoč pri reševanju« in preizkusi, kar opisujeta (Vpiši, Shift+števka, več
   celic, Naslednji korak do tretje stopnje); poglej opis stopenj v oknu »Nova uganka«.
   Pričakovano: opis se ujema z obnašanjem. Zakaj ne samodejno: ujemanje besedila z
   obnašanjem je vsebinska presoja.
4. **Reševalec in trening, okno Pomoč** (pri odločitvi B ali C) na telefonu in računalniku:
   odpri, podrsaj, zapri (✕, klik ob oknu, Esc). Pričakovano: brez vodoravnega drsnika, gumb v
   glavi v isti vrstici, vsebina ni predolga. Zakaj ne samodejno: drsenje z dotikom in občutek
   za dolžino na pravi napravi (brskalnik brez glave drsnike skrije).

## 8. Izvedba

| Korak | Commit | Kaj |
|---|---|---|
| načrt | `23e35f8` | načrt z odgovori, `docs/faza6-besedila.md`, 5.3 označena v `uskladitev.md` |
| a | `37a5f3f` | ločila (4.6; 21 vezajev, 3 dolgi pomišljaji, 5 ravnih narekovajev, 3 tri pike), »→« v 13 sporočilih korakov (4b), povsod »mogoč« (4a – tudi naloga in namig E1 »celico, v kateri je mogoča samo ena števka«), sklon pri Mečarici, »12 · Edinstveni pravokotnik« v sporočilih reševalca, »naključne vaje«, razvojne poti in »hitri svinčnik«, `opis` + `opisIskanja` v `STOPNJE_UGANK` z izpisom v igri (5.2); testi `locila.test.js` (nov), `besedila-html`, `generator`, `igra-ui` in popravljena dobesedna besedila v petih testih; posnetek igre – razlike samo v besedilih 10 korakov, novo izhodišče `tools/posnetki/igra-po-6a.json` |
| izpis | (ta commit) | `docs/faza6-besedila.md` osvežen na stanje po koraku a, z razdelkom »Spremembe v koraku a« |

**Korak a – preverjanje:** testi 473/473 (468 + 5 novih). Posnetek igre proti `igra-po-5a.json`:
razlike v 10 korakih, vse v besedilih (sporočila korakov z »mogoč« in »→«, »Začel si znova –«,
»Preverjam … …«). Brskalnik: `preveri-videz`, `preveri-niz`, `preveri-kandidati` brez napak;
`preveri-presek` in `preveri-enojcki` v primerjavi »Spoznaj« z izhodiščem `4e1e4dc` pokažeta
razliko samo v `innerHTML` pri 8 · Mečarica in 10 · W-krilo (slogi enaki) – po besedilnih kosih
je razlika natanko popravljeni sklon (»najdi 3 vrstice«) in pomišljaj v razlagi W-krila.
`preveri-vadi` enako (samo 8 in 10). `preveri-izbira` pokaže razliko v `innerHTML` pri »Rešitvi« in
po pravilnem odgovoru pri 3–6 in 8–12 (sporočilo koraka iz motorja: »→«, »mogoč«); z začasno
primerjavo, ki v izhodišču najprej uporabi besedilne zamenjave koraka a, je vseh 58 primerjav
enakih – druge razlike ni. Sporočila korakov niso del banke vaj, zato `shared/vaje-banka.js` ostane
(`tests/vaje-banka.test.js` zelen).
