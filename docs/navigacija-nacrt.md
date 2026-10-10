# Navigacija po straneh (naloga 4c) – načrt

Načrt 2026-10-10 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 4c, in postavka 4.3 »Navigacija med
aplikacijami«). **Stanje: potrjeno 2026-10-10** (odločitve in dodatki D1–D4 v razdelku 8); **koraka 1 in 2 narejena**
2026-10-10 (razdelek 9).

Izhodišče: commit `d51d2fc` (zaključek naloge 4b).

**Cilj.** Manj drsenja in prehod med aplikacijami brez tipkanja naslova:

1. okno Pomoč (vse tri aplikacije): kazalo in »Na vrh«;
2. meni treninga: kratko kazalo tehnik in »Na vrh«;
3. vaja v treningu (»Spoznaj« in »Vadi v uganki«): »Nazaj na izbiro« tudi na dnu;
4. povezave Igra · Reševalec · Trening v skupni glavi.

Številke v razdelku 2 so **izmerjene** v brskalniku brez glave (`tools/brskalnik.js`): 375 × 667 px s
posnemanjem telefona in 1280 × 800 px. Skripti za meritve in prototip sta v začasni mapi (nista v repozitoriju);
prototip je kopija aplikacij z dodano vrstico povezav, kazali in gumbi – iz nje so meritve v 2.5 in posnetki v
razdelku 4.

## 0. Povzetek

- **Pomoč** (O1–O3): pod glavo okna vrstica gumbov z naslovi razdelkov (kazalo, iz naslovov samodejno), v
  razdelku »Tehnike« vrstica oznak E1 … 13; glava okna je lepljiva – naslov, »↑ Na vrh« in ✕ ostanejo na vrhu
  med drsenjem (zdaj ✕ po drsenju na telefonu ni dosegljiv).
- **Meni treninga** (O4, O5): nad prvo kartico vrstica oznak E1 … 13 v barvah značk ravni; v meniju po enem
  zaslonu okrogel plavajoč gumb »↑« (44 × 44 px).
- **Vaja** (O6, O7): drugi gumb »← Nazaj na izbiro« pod kartico vaje, vedno; brez vprašanja, kot zdaj.
- **Med aplikacijami** (O8–O15): na vrhu glave trije zavihki »Igra · Reševalec · Trening« (statičen HTML,
  relativne poti z `index.html`, isti zavihek); glava je višja za 32 px. Povezava **vpraša**, preden zapusti
  odprto vajo v treningu ali neshranjeno uganko v reševalcu; igra ne vpraša, ker je vse shranjeno.
- **Koraki:** 1 – Nazaj na dnu vaje, 2 – meni treninga, 3 – okno Pomoč, 4 – povezave med aplikacijami z
  vprašanjem, 5 – zaključek. Vsak v svojem pogovoru, s testom pred spremembo. Logika tehnik, vaj, zbirke in igre
  se ne spremeni.

## 1. Kako je zdaj

### 1.1 Okno Pomoč

- Vsebina je v HTML vsake aplikacije (`#navodilaDialog` v `igra/index.html`, `#pomocDialog` v `app/index.html`
  in `trening/index.html`): razdelki `h3.navodila-razdelek` – igra 5 (in 13 podnaslovov `h4.navodila-podnaslov`),
  reševalec 5, trening 6; na koncu razdelek »Tehnike« (seznam 15 tehnik iz `izrisiTehnike()`, pri 1–13 zložljivo
  »Shema«).
- Odpiranje in zapiranje: `ustvariPomoc()` v `shared/pomoc.js:23` (✕, klik ob panelu, Escape, fokus na ✕,
  različica na dnu panela). Drsi okno samo (`.dialog` z `overflow:auto`, `shared/pomoc.css:7`), ne stran.
- **Kazala ni, »Na vrh« ni.** Glava okna (naslov in ✕) odide z vsebino – po drsenju okno na telefonu zapre samo
  dotik 16 px roba ob panelu (Escape na telefonu ni).

### 1.2 Meni treninga

- `#menu` v `trening/index.html:27`: 15 kartic (E1, E2, 1–13); vrstni red, oznake, imena in značke nastavi
  `trening.js` (vrstice 47–60), gumba »Spoznaj« in »Vadi v uganki« doda `trening.js` (113–122).
- **Kazala ni, »Na vrh« ni.** »Nazaj na izbiro« vrne meni na položaj ob odhodu v vajo (`menuPolozaj`,
  `trening.js:101–133`, test `tests/trening-meni.test.js`).

### 1.3 Vaja v treningu

- `#backBtn` »← Nazaj na izbiro« je samo na vrhu, nad vrstico rezultata (`trening/index.html:105`); klik
  (`trening.js:126`) prekine iskanje vaje »Vadi v uganki« (`vadiPrekini()`), skrije vajo, pokaže meni na starem
  položaju. Brez vprašanja, tudi sredi kroga.
- »Končano!« (`renderExercise()`, `trening.js:632`) napiše »Pritisni »Nazaj na izbiro« za novo vadbo.« – gumb je
  pri dolgih vajah nad robom zaslona.

### 1.4 Med aplikacijami

- **Povezav ni**, vstopne strani v korenu ni (koren ima samo mape). Glava je od faze 5 skupna
  (`header.top` v `shared/base.css:69`: vrstica `.top-row` z nadnaslovom `.eyebrow` in gumbi `.top-actions`,
  naslov, neobvezen opis); širina je po aplikaciji (480 / 560 / 960 px).
- Besedila omenjajo druge aplikacije brez povezave (»Zbirka je ista kot v igri«, »Oznake so iste kot v treningu«).

### 1.5 Kaj se ob prehodu ohrani in kaj ne

| Aplikacija | Shranjeno (`localStorage`, ostane) | Samo v pomnilniku (izgubi se ob odhodu ali osvežitvi) |
|---|---|---|
| igra | igra po vsaki potezi (`sudoku.igra.v1`), zbirka (`sudoku.zbirka.v1`), nastavitve (`sudoku.igra.*`) | iskanje uganke v teku, predlog »Oceni zbirko« pred »Zapiši ocene« – oboje v oknu, ki prekrije glavo |
| reševalec | zbirka (uganka z eno rešitvijo po »Reši«) | vnosna mreža, rešitev, kljukice korakov (`app/app.js` shrambe nima) |
| trening | stikala seznamov (`sudoku.trening.seznami`) | krog: tehnika, način, številka vaje, rezultat, kljukice kroga, trenutna vaja |

Zbirka in igra sta po danostih v `localStorage` istega izvora, zato prehod sam ne izgubi ničesar (pri `file://`
jo nekateri brskalniki ločijo po datotekah – to velja že zdaj, glej `CLAUDE.md`, »Zagon in testi«).

## 2. Meritve

### 2.1 Okno Pomoč (višina vsebine okna; sheme zaprte, v oklepaju vse odprte)

| | 375 × 667 | 1280 × 800 |
|---|---|---|
| igra | 10 614 px = **15,9 zaslona** (23,2); »Tehnike« od 6 168 px | 6 366 px = 8,0 zaslona (13,6); »Tehnike« od 3 527 px |
| reševalec | 5 910 px = 8,9 zaslona (16,2); »Tehnike« od 1 547 px | 3 783 px = 4,7 zaslona (10,4); »Tehnike« od 985 px |
| trening | 6 180 px = 9,3 zaslona (16,6); »Tehnike« od 1 796 px | 3 926 px = 4,9 zaslona (10,6); »Tehnike« od 1 128 px |

Seznam 15 tehnik je od prve do zadnje dolg 3 770 px (5,7 zaslona) pri 375 px in 2 390 px (3,0 zaslona) pri
1280 px. Do »Tehnike« v igri je pri 375 px treba drseti 9,2 zaslona.

### 2.2 Meni treninga

| | 375 × 667 | 1280 × 800 |
|---|---|---|
| dolžina strani | 3 472 px = **5,2 zaslona** | 3 107 px = 3,9 zaslona |
| kartica | 177–236 px | 158–197 px |
| kartica 13 · XY-veriga od | 3 178 px | 2 833 px |

### 2.3 Vaje (»Spoznaj« 15 tehnik × vaji 1 in 3; »Vadi v uganki« E1, 4, 8, 11, 13)

»Nazaj na izbiro« je vedno pri 165 px.

| | 375 Spoznaj | 375 Vadi v uganki | 1280 Spoznaj | 1280 Vadi v uganki |
|---|---|---|---|---|
| dolžina strani | 971–1 703 px (1,5–2,6 zaslona) | 1 177–1 435 px (1,8–2,2) | 889–1 695 px (1,1–2,1) | 1 299–1 482 px (1,6–1,9) |
| z odprto »Rešitvijo« | do 1 926 px (2,9) | do 1 721 px (2,6) | do 1 853 px (2,3) | do 1 754 px (2,2) |
| gumb »Preveri« | 804–1 536 px | 1 010–1 268 px | 722–1 528 px | 1 132–1 315 px |
| od »Preveri« do »Nazaj na izbiro« | **639–1 371 px (1,0–2,1 zaslona)** | 845–1 103 px (1,3–1,7) | 557–1 363 px (0,7–1,7) | 967–1 150 px (1,2–1,4) |
| oba gumba hkrati v oknu | 0 od 30 | 0 od 5 | 8 od 30 (3–6) | 0 od 5 |

Pri telefonu ni nobene vaje, pri kateri bi po »Preveri« videl »Nazaj na izbiro« brez drsenja.

### 2.4 Glava (višina `header.top`)

| | 375 px zdaj | 375 px z O8 A | 1280 px zdaj | 1280 px z O8 A |
|---|---|---|---|---|
| igra | 123 | 155 | 99 | 131 |
| reševalec | 237 | 269 | 192 | 224 |
| trening | 149 | 181 | 149 | 181 |

Vrstica povezav (O8 A) doda 32 px pri vseh širinah (vrstica je 28 px visoka, zgornji odmik glave se zmanjša s
26 na 14 px). Različica O8 B (povezave namesto nadnaslova) ne doda nič. **Preliva ni** pri 320, 375, 430 in
1280 px v nobeni aplikaciji in nobeni različici; trije zavihki so pri 320 px v eni vrstici.

### 2.5 Prototip

- **Okno Pomoč:** lepljiva glava je 59 px visoka in med drsenjem ostane na vrhu okna (izmerjeno: zgornji rob 0);
  skok s kazalom na »Tehnike« postavi naslov 66 px od vrha – pod glavo, ne za njo; »↑ Na vrh« vrne na 0. Kazalo
  razdelkov: pri 375 px igra 93 px (3 vrstice), reševalec 60, trening 93; pri 1280 px 27 / 27 / 60. Vrstica oznak
  tehnik: z ločili med ravnmi 99 px (3 vrstice) pri 375 px, 64 px pri 1280 px – brez ločil sta pri 375 px 2
  vrstici.
- **Meni:** vrstica oznak 64 px (2 vrstici) pri 375 in 1280 px. Skok na 13 pomakne stran do konca (kartica je
  blizu dna, zato ne pride na vrh). »↑ Na vrh« vrne na 0.
- **Plavajoč gumb in kartice:** desni rob gumba »Vadi v uganki« na kartici je pri 320 in 375 px na 246 px.
  Gumb z napisom »↑ Na vrh« (86 px) ima levi rob pri 320 px na 218 px – med drsenjem bi segel nad »Vadi v
  uganki«; okrogel gumb 44 px ima levi rob na 260 px (pri 375 px na 315 px) in ga ne doseže.
- **Nazaj na dnu vaje:** 45 px pod zadnjim gumbom vaje (X-krilo, 375 px), klik ima isti učinek kot zgornji.
- **Gumb brskalnika »Nazaj«** (bfcache, Chromium – Edge): trening sredi kroga → povezava »Igra« → »Nazaj«:
  stran se obnovi iz predpomnilnika (`pageshow.persisted`), krog ostane (tehnika, vaja 4). Igra z uganko →
  povezava »Reševalec« → izbris vse zbirke → »Nazaj«: igra se izprazni in števec pokaže 0 – dogodek `storage` se
  ob obnovi dostavi, zato obstoječi odziv (`zbirkaObSpremembiDrugje()`) zadošča. Firefoxa in Safarija brskalnik
  brez glave ne preveri.

## 3. Predlogi

### A. Okno Pomoč

**O1 – Kazalo razdelkov.**
- **A (priporočam):** pod glavo okna vrstica gumbov z naslovi razdelkov (`h3.navodila-razdelek`). Izdela jo
  `ustvariPomoc()` iz naslovov, zato je v vseh treh aplikacijah enaka in v HTML se ne zapiše. Klik pomakne okno
  do razdelka (`scrollIntoView`, gladko, pri `prefers-reduced-motion` takoj), naslov pristane pod lepljivo glavo
  (`scroll-margin-top`), fokus gre na naslov; naslov strani se ne spremeni (brez `#`), zato gumb brskalnika
  »Nazaj« ne hodi po razdelkih.
- B: A in podnaslovi igre (13) kot drugi nivo – pri 375 px bi bilo kazalo visoko pol zaslona.
- C: spustni seznam »Pojdi na …« v glavi – en dotik več, na telefonu sistemski izbirnik.

**O2 – Kazalo tehnik v razdelku »Tehnike«.**
- **A (priporočam):** nad seznamom vrstica oznak E1, E2, 1–13 v barvah ravni (kot značke), klik pomakne do
  tehnike; ime tehnike v namigu miške (`title`) in za bralnik zaslona (`aria-label`). Brez ločil med ravnmi
  (2 vrstici pri 375 px). Ista sestavina kot kazalo v meniju (O4).
- B: brez (samo kazalo razdelkov).

**O3 – »Na vrh« v oknu Pomoč.**
- **A (priporočam):** lepljiva glava okna – »Pomoč«, »↑ Na vrh« in ✕. »↑ Na vrh« se pokaže, ko je okno
  pomaknjeno več kot 400 px, in vrne na kazalo. ✕ je tako vedno pri roki. Slika 2.
- B: plavajoč okrogel gumb »↑« v spodnjem desnem kotu okna – prekrije besedilo, ✕ ostane nedosegljiv.
- C: »↑ Na vrh« na koncu vsakega razdelka – v »Tehnike« (5,7 zaslona) šele na koncu.

### B. Meni treninga

**O4 – Kazalo tehnik.**
- **A (priporočam):** pod opisom v glavi, nad prvo kartico, vrstica oznak E1 … 13 v barvah značk ravni (64 px);
  klik pomakne do kartice (12 px pod vrh okna). Na kartici sta potem »Spoznaj« in »Vadi v uganki« – kazalo samo
  pomika, vaje ne začne. Slika 3, levo.
- B: seznam z imeni (15 vrstic, pribl. 330 px) – do prve kartice pol zaslona več.
- C: lepljiva vrstica oznak – 64 px trajno na vrhu (na telefonu 10 % zaslona).

**O5 – »Na vrh« v meniju.**
- **A (priporočam):** okrogel plavajoč gumb »↑« 44 × 44 px spodaj desno (»Na vrh« v `title` in `aria-label`),
  viden samo v meniju in ko je stran pomaknjena več kot en zaslon; klik na vrh strani (h kazalu). Pri 320 px ne
  seže nad gumb »Vadi v uganki« (2.5).
- B: gumb z napisom »↑ Na vrh« (prototip na sliki 3, sredina) – pri 320 px ga med drsenjem prekrije »Vadi v
  uganki« in dotik lahko zgreši.
- C: gumb »↑ Na vrh« samo na dnu menija.

### C. Vaja v treningu

**O6 – »Nazaj na izbiro« na dnu.**
- **A (priporočam):** drugi enak gumb pod kartico vaje (v `#trainer` za `#exerciseArea`), vedno – v »Spoznaj«,
  »Vadi v uganki« in pri »Končano!«; isti učinek kot zgornji. Ker je zunaj `#exerciseArea`, se primerjave
  »Spoznaj« z izhodiščem v scenarijih `preveri-*-brskalnik.js` ne spremenijo. Slika 3, desno.
- B: samo kadar vaja ni na enem zaslonu – pri 375 px so daljše vse (2.3), pravilo bi bilo le zaplet.
- C: lepljiva spodnja vrstica – na telefonu prekriva mrežo ali gumbe vaje.

**O7 – Vprašanje pri »Nazaj na izbiro«.**
- **A (priporočam):** brez, kot zdaj – gumb je izrecna izbira; od gumbov vaje je ločen z robom kartice (45 px).
- B: vprašanje, kadar je krog v teku (pri obeh gumbih, besedilo kot pri O11).

### D. Med aplikacijami

**O8 – Mesto povezav.**
- **A (priporočam):** svoja vrstica na vrhu glave, nad nadnaslovom: trije zavihki »Igra«, »Reševalec«,
  »Trening« (v tem vrstnem redu v vseh treh); trenutni ima podlago kartice in obrobo (`aria-current="page"`),
  druga dva sta modri povezavi. Glava +32 px (2.4). Slika 1, zgoraj.
- B: povezave namesto nadnaslova, v njegovem slogu (+0 px) – podnaslov aplikacije (»rešuješ sam, pomoč ko
  obtičiš« …) se izgubi, povezave so drobne (11 px, cilj za dotik 18 px visok). Slika 1, spodaj.
- C: v nogi – trening noge nima, na dolgih straneh je ne vidiš.

**O9 – Zapis povezav.**
- **A (priporočam):** statičen HTML v vseh treh `index.html` – ista vrstica, razlika samo `aria-current`; test
  preveri enakost in da cilji obstajajo. Glava je takoj cela.
- B: izris iz JS (en vir) – skripte so na koncu `<body>`, zato bi glava ob nalaganju poskočila za 32 px.

**O10 – Cilj povezav.**
- **A (priporočam):** isti zavihek, relativne poti z `index.html` (`../igra/index.html`; pri `file://` bi
  `../igra/` odprla seznam datotek).
- B: nov zavihek – nič se ne izgubi, a se zavihki množijo; dve odprti igri iste uganke si prepisujeta napredek.

**O11 – Vadba v teku v treningu.**
- **A (priporočam):** klik povezave vpraša (`confirm`), kadar je odprta vaja in krog ni končan:
  »Zapustiš trening? Krog 4 · Skriti par (vaja 3 / 9, pravilno 2 / 2) se ne shrani.« »Prekliči« ostane na vaji,
  nič se ne spremeni. V meniju in pri »Končano!« ni vprašanja. Gumb brskalnika »Nazaj« krog v Chromiumu obnovi
  (2.5) – to je dodatek, ne zagotovilo.
- B: krog v `sessionStorage` (tehnika, način, številka vaje, rezultat, kljukice kroga) in ob vrnitvi ponudba
  »Nadaljuj krog«. Trenutna vaja se ne bi obnovila (vaje iz generatorja in stanje »Vadi v uganki« bi bilo treba
  shraniti v celoti) – delna obnova in nova shramba za trening.
- C: brez vprašanja.

**O12 – Neshranjena uganka v reševalcu.**
- **A (priporočam):** klik povezave vpraša, kadar je v vnosni mreži uganka, ki ni v zbirki in ni vgrajeni
  primer (vtipkana in še ne rešena ali z več rešitvami): »Zapustiš reševalec? Uganka v mreži ni shranjena v
  zbirko.« Prazna mreža, primer in uganka iz zbirke – brez vprašanja (kljukice korakov se izgubijo, kot zdaj ob
  osvežitvi).
- B: danosti v `sessionStorage`, ob vrnitvi v isti zavihek se vpišejo nazaj.
- C: brez vprašanja.

Igra ne vpraša: igra, zbirka in nastavitve so shranjene po vsaki spremembi, nepotrjena stanja (iskanje uganke,
predlog ocen) so v oknih, ki prekrijejo glavo – povezave takrat niso dosegljive. Vprašanje (O11, O12) je v eni
funkciji v novem `shared/navigacija.js` (aplikacija ji poda, kaj vpraša – ali `null`).

**O13 – Vrnitev z »Nazaj« po spremembi v drugi aplikaciji.**
- **A (priporočam):** `zbirkaObSpremembiDrugje()` (`shared/zbirka-ui.js`) si ob `pagehide` zapomni vrednosti
  ključev zbirke in iger; ob `pageshow` iz predpomnilnika pokliče isti odziv za ključ, ki se je vmes spremenil –
  za brskalnike, ki dogodka `storage` ob obnovi ne dostavijo (v Chromiumu se dostavi, 2.5; dvojni klic je
  neškodljiv). Sicer bi se lahko v igro vrnil z uganko, ki si jo v reševalcu izbrisal, in naslednja poteza bi
  zapisala igro brez zapisa v zbirki.
- B: nič.

**O14 – Vstopna stran v korenu.**
- A: brez – vstop ostane prek `igra/`, `app/` ali `trening/`.
- **B (priporočam):** `index.html` v korenu, ki preusmeri na igro (`<meta http-equiv="refresh">` in povezava za
  primer, ko preusmeritev ne dela) – naslov korena ne pokaže seznama map ali napake.
- C: vstopna stran s tremi karticami – nova stran z besedili.

**O15 – Povezave v besedilih** (predlog iz 5.5: »reševalec«, »trening« v Pomoči in oknu zbirke kot povezava).
- **A (priporočam):** ne – povezave so v glavi; povezava v oknu bi zapustila stran sredi branja.
- B: da.

## 4. Posnetki prototipa

Iz okvirjev po 375 px, dvojna ločljivost (`docs/slike/navigacija/`):

1. `1-glava-375.png` – glava vseh treh aplikacij: zgoraj O8 A (zavihki nad nadnaslovom), spodaj O8 B (povezave
   namesto nadnaslova). V treningu je pod opisom že vrstica oznak (O4).
2. `2-pomoc-375.png` – okno Pomoč v igri: levo vrh s kazalom razdelkov (O1), desno po kliku »Tehnike« – lepljiva
   glava z »↑ Na vrh« in ✕ (O3) ter vrstica oznak tehnik (O2; tu še z ločili med ravnmi – po predlogu brez).
3. `3-trening-375.png` – meni s kazalom tehnik (O4), meni nižje s plavajočim gumbom (tu z napisom – O5 B; po
   predlogu okrogel »↑«), dno vaje X-krilo z »Nazaj na izbiro« pod kartico (O6).

## 5. Kaj se ne spremeni

- Shrambe in ključi (`sudoku.zbirka.v1`, `sudoku.igra.v1`, nastavitve); pri priporočenih možnostih ni nove
  shrambe.
- Vsebina besedil Pomoči, seznam tehnik in sheme; odpiranje in zapiranje okna (✕, klik ob panelu, Escape), fokus
  na ✕ ob odprtju, različica na dnu panela.
- Glava: nadnaslov, naslov, gumbi v `.top-actions`, opis, širine 480 / 560 / 960 px; skupne sestavine glave
  ostanejo enake v vseh treh (`tools/preveri-videz-brskalnik.js`).
- Zgornji »Nazaj na izbiro« in njegov učinek (`menuPolozaj`, `vadiPrekini()`); vaje, štetje rezultata, kartice
  menija in klik nanje.
- Logika tehnik, vaj, igre, zbirke in reševalca; reševalec vnosa ne shranjuje.
- Igra: posnetek `tools/posnetek-igre.js --primerjaj tools/posnetki/igra-po-xy-veriga.json` brez razlik (glava ni
  v posnetku).
- Primerjave »Spoznaj« z izhodiščem (`preveri-presek-`, `-enojcki-`, `-vadi-`, `-izbira-brskalnik.js`) brez
  razlik – vse spremembe so zunaj `#exerciseArea`.
- Gumb brskalnika »Nazaj« in osvežitev strani delujeta kot zdaj.
- Brez novih knjižnic.

## 6. Koraki

Vsak korak v svojem pogovoru: najprej test, ki na stari kodi pade, nato sprememba; sprotno hitri testi, pred
commitom vsi; scenarij `tools/preveri-navigacija-brskalnik.js` (nov, raste po korakih – `--korak N`); commit in
push. Nova sestavina gre v `shared/navigacija.js` (kazalo oznak tehnik, okrogel gumb »↑«, vprašanje ob odhodu)
s slogi v `shared/base.css`; okno Pomoč ostane v `shared/pomoc.js` in `shared/pomoc.css`. Logiko (npr. seznam za
kazalo, besedilo vprašanja) pišem v funkcije brez DOM-a, ker nadomestni DOM nima `querySelector`; razporeditev in
drsenje preveri brskalnik.

1. **»Nazaj na izbiro« na dnu vaje** (O6, O7). Test v `tests/trening-meni.test.js`: drugi gumb je v vaji
   »Spoznaj«, »Vadi v uganki« in pri »Končano!«, klik ima isti učinek kot zgornji (meni, položaj, prekinjeno
   iskanje). Brskalnik: 375 in 1280 px, vseh 15 tehnik »Spoznaj« in 5 »Vadi v uganki« – gumb pod kartico, v oknu
   strani, vsaj 24 px od gumbov vaje, pravi klik vrne v meni na položaj; `preveri-vadi-brskalnik.js` (»Spoznaj«
   enak izhodišču).
2. **Meni treninga** (O4, O5). Test: kazalo ima 15 oznak v vrstnem redu kartic, razred po ravni, ime v `title` in
   `aria-label`; »↑« je skrit na vrhu in v vaji, viden po enem zaslonu v meniju. Brskalnik: 320, 375, 1280 px –
   brez preliva, pravi dotik oznake pripelje kartico na vrh (ali stran do konca), »↑« ne prekrije gumbov kartic
   (pravokotniki med drsenjem), pravi klik vrne na vrh.
3. **Okno Pomoč** (O1–O3). Test v `tests/pomoc.test.js`: kazalo iz razdelkov v vseh treh (napisi in vrstni red),
   vrstica 15 oznak tehnik, gumba »↑ Na vrh« in ✕ v glavi. Brskalnik (razširitev `preveri-pomoc-brskalnik.js`):
   375 in 1280 px, vse tri – kazalo v panelu, brez preliva, pravi klik razdelka in tehnike → naslov pod glavo,
   glava na vrhu okna med drsenjem s kolescem in potegom prsta, ✕ po drsenju zapre, »↑ Na vrh« se pokaže po 400 px
   in vrne na 0, Escape in klik ob panelu kot prej, sheme se odpirajo.
4. **Povezave med aplikacijami** (O8–O15) – povezave in vprašanje v istem koraku, da povezava nikoli ne prekine
   vadbe brez opozorila. Test (`tests/navigacija.test.js`): vrstica v vseh treh `index.html` enaka razen
   `aria-current`, poti z `index.html` obstajajo; vprašanje – trening (odprta vaja: besedilo, preklic prepreči
   odhod; meni in »Končano!« brez), reševalec (prazna mreža, primer, uganka iz zbirke brez; vtipkana z
   vprašanjem), igra brez; O13 – `pagehide`/`pageshow` s spremenjeno zbirko izprazni igro z izbrisano uganko;
   `tests/razlicica.test.js` (oznaka na novi skripti). Brskalnik: 320, 375, 430, 1280 px brez preliva, glava
   +32 px, pravi kliki med vsemi pari aplikacij, zbirka in igra po prehodu enaki (števec, poteze, kazalec), pravo
   okno `confirm` (preklic → krog enak; potrditev → druga aplikacija), »Nazaj« (izpis, kaj se obnovi), `file://`
   (povezava odpre stran, ne seznama); `preveri-videz-brskalnik.js`, posnetek igre brez razlik. O14: `index.html`
   v korenu.
5. **Zaključek:** vsi testi in vsi scenariji naloge, `CLAUDE.md` (nova datoteka, sestavine, scenarij),
   `docs/rocni-test.md` (razdelek »Navigacija«), `docs/uskladitev.md` (4.3 in naloga 4c), ročni pregled.

## 7. Ročni pregled (enkrat, po koraku 5)

1. **Vse tri, telefon:** glava z zavihki – videz, dotik zavihka odpre drugo aplikacijo, zbirka (število) in igra
   (poteze) ostaneta. *Zakaj ročno:* presoja videza in pravi telefon (pisave, drsni trak, dotik).
2. **Igra, telefon:** okno Pomoč – drsenje s prstom, glava ostane na vrhu, kazalo, oznaka tehnike, »↑ Na vrh«, ✕.
   *Zakaj ročno:* inercijsko drsenje in Safari (lepljiv element v drsnem oknu) brskalnik brez glave (Chromium)
   ne pokaže.
3. **Trening, telefon:** meni – oznaka v kazalu, drsenje, okrogel »↑«: ali kdaj moti dotik kartice; vaja –
   »Nazaj na izbiro« na dnu. *Zakaj ročno:* presoja, ali gumb moti pravi prst.
4. **Trening sredi kroga:** dotik zavihka »Igra« – besedilo vprašanja, »Prekliči«; nato potrdi in v svojem
   brskalniku pritisni »Nazaj«. *Zakaj ročno:* pravo okno vprašanja in obnova iz predpomnilnika sta odvisna od
   brskalnika.
5. **`file://`:** odpri `igra/index.html` neposredno iz datoteke, klikni »Reševalec« in »Trening«. Pričakovano:
   odpre se stran (ne seznam datotek); ali je zbirka ista, je odvisno od brskalnika. *Zakaj ročno:* scenarij
   teče prek strežnika HTTP.

## 8. Odločitve (potrjeno 2026-10-10)

**O1–O15 po priporočilu:** O1 A (kazalo razdelkov), O2 A (vrstica oznak tehnik brez ločil), O3 A (lepljiva glava
okna Pomoč z »↑ Na vrh« in ✕), O4 A (kazalo tehnik v meniju), **O5 A (okrogel plavajoč »↑«, 44 × 44 px)**, O6 A
(»Nazaj na izbiro« tudi pod kartico vaje, vedno), O7 A (brez vprašanja), **O8 A (zavihki v svoji vrstici nad
nadnaslovom, +32 px)**, O9 A (statičen HTML), O10 A (isti zavihek, poti z `index.html`), **O11 A (vprašanje pri
odhodu iz kroga)**, **O12 A (vprašanje pri neshranjeni uganki v reševalcu)**, O13 A (`pagehide`/`pageshow`),
**O14 B (`index.html` v korenu preusmeri na igro)**, O15 A (brez povezav v besedilih).

**Dodatki:**

- **D1 (O3):** lepljiva glava **samo v oknu Pomoč** (`.dialog-navodila`). Okna »Zbirka ugank« in »Nova uganka« v
  igri in okno zbirke v reševalcu (isti razredi `.dialog*` iz `shared/pomoc.css`) ostanejo enaka – korak 3 jih
  primerja z izhodiščem (drevo in izračunani slogi). V »Kasneje« (`docs/uskladitev.md`) zapisano: ✕ v dolgem oknu
  »Zbirka ugank« po drsenju ni dosegljiv.
- **D2 (O11):** brez vprašanja, dokler je krog pri vaji 1 in še ni bilo nobenega »Preveri« (nič se ne izgubi).
- **D3 (O2, O4):** oznake v kazalu tehnik (okno Pomoč in meni treninga) so pri 375 px **vsaj 32 px visoke** –
  izmeri scenarij in zapiše poročilo koraka (koraka 2 in 3).
- **D4:** ročno točko 5 (`file://`) poskusim preveriti v brskalniku brez glave (korak 4); če gre, jo črtam z
  ročnega seznama (razdelek 7).

Ročni pregled je en sam, po koraku 5, največ 5 točk, pri vsaki zakaj ni avtomatsko; po korakih 1–4 ga ni.

## 9. Izvedba

### Korak 1 – »Nazaj na izbiro« na dnu vaje (2026-10-10)

- `trening/index.html`: v `#trainer` za `#exerciseArea` drugi gumb `#backBtnDno` »← Nazaj na izbiro« (isti
  razred `back-btn`); `trening/trening.css`: `button.back-btn-dno` – spodnji odmik 24 px, da gumb na dnu strani ni
  prilepljen ob rob.
- `trening/trening.js`: učinek zgornjega gumba je v funkciji `nazajNaIzbiro()` (prekine iskanje »Vadi v uganki«,
  pokaže meni na položaju ob odhodu, kartico tehnike v oknu); oba gumba jo pokličeta.
- Test `tests/trening-meni.test.js`: gumb je v HTML v `#trainer` za `#exerciseArea`, z istim napisom; klik ima
  isti učinek kot zgornji v »Spoznaj«, »Vadi v uganki« (iskanje prekinjeno) in pri »Končano!«. Na kodi pred
  korakom padeta oba nova testa.
- Scenarij `tools/preveri-navigacija-brskalnik.js --korak 1` (nov, raste po korakih): glej poročilo koraka spodaj.


**Poročilo koraka 1 (preverjeno avtomatsko).**

- Testi: `tests/trening-meni.test.js` (3 testi, nova 2 na kodi pred korakom padeta), hitri in vsi testi zeleni.
- `tools/preveri-navigacija-brskalnik.js --korak 1` (375 px s pravim dotikom, 1280 px s pravo miško; 529
  preverjanj, vsa držijo): »Spoznaj« vseh 15 tehnik (vaji 1 in 3), »Vadi v uganki« E1, 4, 8, 11, 13 in »Končano!« –
  spodnji gumb je viden, pod vso vajo, **45 px** pod najnižjim gumbom vaje (pri vseh vajah in obeh širinah;
  zahteva vsaj 24 px), v širini strani, izračunan slog enak zgornjemu (147 × 39 px), na dnu strani ves v oknu,
  brez preliva; pravi dotik/klik vrne v meni na položaj ob odhodu s kartico tehnike v oknu; dotik/klik med »Iščem
  vajo …« iskanje prekine (po 2 s vaje ni); brez napak JS. Posnetek dna vaje X-krilo pri 375 px:
  `dno-x-wing-375.png` v mapi scenarija.
- Obstoječi scenariji: `preveri-vadi-brskalnik.js` (»Spoznaj« enak izhodišču – gumb je zunaj `#exerciseArea`),
  `preveri-sheme-brskalnik.js` (»Nazaj na izbiro« vrne meni na položaj ob kliku) in `preveri-videz-brskalnik.js`
  (brez preliva pri 320–1280 px).

### Korak 2 – meni treninga: kazalo tehnik in »↑« (2026-10-10)

- `shared/navigacija.js` (nova): `kazaloTehnik()` – postavke kazala brez DOM-a (E1, E2, 1–13 v vrstnem redu kartic,
  oznaka, ime »4 · Skriti par (Hidden Pair)«, razred ravni iz `tagClass()`); `izrisiKazaloTehnik(el, obKliku)` – gumbi
  `.tag.t-*` z oznako, ime v `title` in `aria-label` (isto sestavino bo uporabilo okno Pomoč v koraku 3);
  `naVrhViden()` – pravilo brez DOM-a (več kot en zaslon in aktiven); `ustvariNaVrh(aktiven, obKliku)` – okrogel
  plavajoč »↑« v `<body>` (»Na vrh« v `title` in `aria-label`), vidnost ob `scroll`/`resize`; `nacinPomika()` – gladko,
  pri `prefers-reduced-motion` takoj.
- `shared/base.css`: `.kazalo-tehnik` (oznake vsaj 36 × 32 px, 13 px, razmik 6 px; barve iz `.tag.t-*` – iste kot značke
  ravni na karticah) in `button.na-vrh` (44 × 44 px, okrogel, 16 px od desnega in spodnjega roba, `z-index` 20 – pod
  oknom Pomoč).
- `trening/index.html`: `<nav id="kazaloTehnik" class="kazalo-tehnik" aria-label="Kazalo tehnik">` kot prvi otrok
  `#menu` (nad prvo kartico, z menijem se skrije v vaji); skripta `shared/navigacija.js` za `sheme.js`.
- `trening/trening.js`: klik oznake pomakne kartico 12 px pod vrh okna (pri karticah blizu dna stran do konca), vaje ne
  začne, fokus gre na »Spoznaj« te kartice; »↑« je aktiven samo v meniju, `naVrh.osvezi()` v `zacniKrog()` in
  `nazajNaIzbiro()` – po vrnitvi na položaj nižje od zaslona je viden takoj, ne šele ob drsenju; klik na vrh, fokus na
  prvo oznako kazala. Pomik kazala je izračunan (`scrollTo`), ne `scroll-margin` na karticah, da se zgornji »Nazaj na
  izbiro« (`scrollIntoView` na kartico) ne spremeni.
- Testi: `tests/trening-meni.test.js` – trije novi (kazalo v HTML, vsebina kazala, vidnost »↑«); na kodi pred korakom
  padejo vsi trije (preverjeno tudi s prazno `shared/navigacija.js`, da padejo iz pravega razloga), stari trije ostanejo
  zeleni. `tests/dom-stub.js`: `innerHeight` in `scrollTo({ top })`. `shared/navigacija.js` dodana v sezname datotek
  testov, ki nalagajo trening, in v `tests/besedila-js.js` (ločila in izrazi).
- Scenarij `tools/preveri-navigacija-brskalnik.js --korak 2` (koraki 1 … N, privzeto 2).

**Poročilo koraka 2 (preverjeno avtomatsko).**

- Testi: hitri (753) in vsi (937) zeleni.
- `tools/preveri-navigacija-brskalnik.js --korak 2` pri 320, 375 px (posnemanje telefona, pravi dotik) in 1280 px
  (prava miška), vsa preverjanja držijo (korak 1 še vedno):
  - **kazalo:** 15 oznak E1 … 13 v vrstnem redu kartic, pod glavo in nad prvo kartico, v širini menija, brez preliva,
    ime v `title` in `aria-label`, podlaga in pisava vsake oznake enaki znački ravni na njeni kartici (izračunan slog);
  - **D3 – izmerjeno:** oznake so pri vseh treh širinah **32 px visoke** in 36 px široke (pisava 13 px JetBrains
    Mono); kazalo je pri 375 px 70 px visoko v 2 vrsticah (pri 1280 px enako), pri 320 px 108 px v 3 vrsticah;
  - pravi dotik/klik vsake od 15 oznak: kartica pristane **12 px pod vrhom okna**, kartice blizu dna (pri 375 px 12 in
    13, pri 320 px 12 in 13, pri 1280 px 11–13) so ob strani, pomaknjeni do konca, vse v oknu; vaja se ne začne, fokus
    je na »Spoznaj« te kartice; pri `prefers-reduced-motion` je pomik takojšen;
  - **»↑«:** na vrhu in po natanko enem zaslonu skrit, po pravem drsenju (poteg prsta pri 320 in 375 px, kolesce pri
    1280 px) čez en zaslon viden; 44 × 44 px, okrogel, 16 px od desnega roba, v oknu; pravi dotik/klik → vrh, gumb
    skrit, fokus na prvi oznaki kazala;
  - **prekrivanje:** drsenje po vsem meniju v korakih po 20 px (po dogodku `scroll`) – na vsakem položaju je »↑« viden
    natanko po pravilu in ne prekrije nobenega gumba »Spoznaj« / »Vadi v uganki«; najmanjši vodoravni razmik do gumba
    kartice v isti višini: **14 px pri 320 px**, 69 px pri 375 px, 614 px pri 1280 px (gumb pri 320 px leži ob desnem
    robu kartice, ne nad gumboma);
  - **v vaji ni viden:** »Spoznaj« 13 · XY-veriga in »Vadi v uganki« 8 · Mečarica, pomaknjeni do konca s pravim
    drsenjem;
  - **po »Nazaj na izbiro«** (pravi dotik/klik spodnjega in zgornjega gumba) iz 11 · XY-krilo in 12 · Edinstveni
    pravokotnik se meni vrne na položaj nižje od enega zaslona in **»↑« je viden brez dodatnega drsenja**; iz E1 (meni
    blizu vrha) ostane skrit;
  - posnetki `meni-kazalo-320.png`, `meni-kazalo-375.png`, `meni-na-vrh-320.png`, `meni-na-vrh-375.png` v mapi
    scenarija; brez napak JS.
- Obstoječi scenariji: `preveri-videz-brskalnik.js` (brez preliva pri 320–1280 px, skupne sestavine enake v vseh
  treh; 339 preverjanj), `preveri-vadi-brskalnik.js` (meni z gumboma na karticah, »Spoznaj« enak izhodišču – kazalo in
  »↑« sta zunaj `#exerciseArea`; 378), `preveri-sheme-brskalnik.js` (»Nazaj na izbiro« vrne meni na položaj ob kliku;
  967) – vsi držijo. Posnetek igre (`tools/posnetek-igre.js --primerjaj tools/posnetki/igra-po-xy-veriga.json`):
  enako, 99 posnetkov.
- Ročnega pregleda po tem koraku ni (razdelek 8); točka 3 razdelka 7 (ali okrogel »↑« na pravem telefonu kdaj moti
  dotik kartice) ostane za skupni pregled po koraku 5.
