# Trening »Vadi v uganki« – analiza in meritev

Stanje: **analiza, odločitve sprejete** (2026-09-24; glej 4.5). Izvedba poteka po
načrtu `docs/trening-v-uganki-nacrt.md` (razdelek »Stanje po delih«; opombe tam veljajo
pred to analizo – pravilo »ne Presega tehnike« je odpadlo, imena tehnik so po fazi 4 iz
`imeTehnike()`). **Del 1 narejen 2026-09-25:** stanje igre je v `shared/stanje.js`
(začetne poteze `zacetnihPotez`, `igraZZacetkom()`, `zacniZnova()`), shranjevanje igre v
`igra/shramba.js`. **Del 2 narejen 2026-09-25:** iskanje stanja, vaja kot igra in
presoja odgovora so v `shared/vaje-uganka.js` (`stanjaVUganki()`, `vajaIzStanja()`,
`preveriVajo()`; vrstni red izidov in sporočilo pri neutemeljenem izbrisu sta v opombah
načrta), `genMinimalnaUganka()` v `shared/generator.js`. **Del 3 narejen 2026-09-25:**
banka vaj `shared/vaje-banka.js` (vsaj 50 ugank na tehniko, tehnike kot ključi
`ALL_TECHNIQUES`, tudi uganke »Presega tehnike«), ustvari jo `tools/ustvari-banko-vaj.js`
(namesto banke semen iz 4.1). Tabele v tem dokumentu (npr. 1.1) opisujejo stanje pred tem.

**Zamisel.** Trening dobi za vsako tehniko (E1, E2, 1–12) dva načina:

- **Spoznaj** – obstoječe vaje ostanejo, kot so (sestavljene vaje, pri enojčkih stanje
  prave uganke brez kandidatov);
- **Vadi v uganki** – pravo stanje uganke, v katerem je naslednji korak motorja izbrana
  tehnika; igralec ga reši z istimi pripomočki kot v igri (kandidati, poudarek števk,
  seznami manjkajočih števk, odstranjevanje iz več celic, razveljavi/ponovi).

Osnova je skupna mreža v `shared/` za igro, trening in (po želji) reševalec.

---

## 1. Skupna mreža

### 1.1 Kako je mreža narejena zdaj

| | **Igra** (`igra/igra.js`, `igra.css`) | **Trening** (`trening/trening.js`, `trening.css`) | **Reševalec** (`app/app.js`, `app.css`) |
|---|---|---|---|
| Elementi | 81 `div.celica` v `#mreza` (CSS grid), zgrajeni enkrat, ob vsakem izrisu se vsebina celic zgradi znova (`izrisiMrezo()`) | pet različnih postavitev, vsaka gradi svoje elemente ob vsaki vaji: ena enota (`buildLayout` – pari, trojice), enota + preostanek (`buildBoxLineLayout` – Pointing, Box-line), mreža ene števke `xw-cell` (X-Wing, Swordfish), cela mreža `g9`/`gc` z oznakami V1–V9/S1–S9 (`buildFullGridLayout` – Turbot, W-Wing, XY-Wing, UR), cela mreža s števkami brez kandidatov (`buildSingleLayout` – E1, E2) | vnosna mreža: 81 `<input>` (`#inputGrid`); prikaz: `renderGridInto()` (`mini-grid`/`mcell`, velikost prek `--mcs`) za korake, povečavo in rešitev; tretja mreža `renderCandidates()` (`ccell`) za »Prikaži kandidate« |
| Debele črte blokov | `data-r`/`data-c` + CSS | `g9`: `data-r`/`data-c`; ostale postavitve nimajo cele mreže | `data-r`/`data-c` + CSS (vse tri mreže) |
| Števke | `.dana` (črna) / `.vpis` (modra) | `g9` pri enojčkih: `.stevka` / `.vpis`; sestavljene vaje: siva celica **brez** števke (`given`) – deska ni prava uganka | `.given` / `.solved-num` (barvi obrnjeni glede na igro, `docs/uskladitev.md` 4.5) |
| Kandidati | `div.kandidati` z 9 `span.kand` na stalnih mestih (1 levo zgoraj … 9 desno spodaj), samodejni minus ročno odstranjeni (`igra/stanje.js`) | `div.candgrid` z 9 `span.cd` na stalnih mestih (`.hide` za manjkajoče), iz podatkov vaje | `mcandgrid`/`mcand` (`mcand-empty`), `candgrid`/`cand` (`.hidden`) – iz posnetka `solve()` oziroma `new Board()` |
| Poudarek števk | niz »Poudari«, do 4 barve hkrati (`poud`, `b0`–`b3`), cela celica pri vpisani števki, polje kandidata pri kandidatu | ni; samo stalna »Označena številka« (`hl-*`) pri Turbot, X-Wing, Swordfish, Pointing, Box-line | ni |
| Manjkajoče števke | seznami vrstic, stolpcev, blokov (`manjkajoceVEnotah()`, `narediPolje()`, `izrisiSezname()`) | ni | ni |
| Izbira celice | ena ali več (`izbrane`, kljukica »več celic«, Ctrl+klik), senčenje sosed (`PEERS`), puščice | izbira do `pickN` celic, barva po tehniki (`selected-<barva>`), brez sosed in puščic | samo fokus polja `<input>` (puščice) |
| Vnos | niza »Vpiši« / »Odstrani kandidata«, tipkovnica (1–9, Shift+1–9, Backspace, Esc, Ctrl+Z/Y), poteze z razveljavi/ponovi (`dodajPotezo()`) | izbira celic + »Preveri«; pri skritih parih/trojicah še izbira števk (2. faza); pri enojčkih celica + niz števk | tipkanje števk (danosti), preverjanje ponovitev |
| Oznake koraka | `k-vzorec` / `k-izbris` / `k-vpis` (celica in kandidat) | `peek-hl` / `peek-elim` / `peek-enota`, po preverjanju `correct` / `elimcell` / `elim` | `hl-source` / `hl-elimonly` / `willset`, `mcand-elim` |
| Stanje | `igra` = `{ danosti, poteze, kazalec }`, izračun `stanjeIgre()` (brez DOM-a, `igra/stanje.js`) | podatki vaje (`slots`, `boardGrid`/`boardCand`), brez zgodovine | `Board` iz `solve()` (`snapshotGrid`/`snapshotCand`) |

**Skupno vsem trem:** indeks celice 0–80 po vrsticah, `data-r`/`data-c` za debele črte,
kandidati na stalnih mestih 3×3, podatki v obliki motorja (`grid` + maske `cand`), pojem
koraka (vzorec / izbris / vpis) – vendar s tremi različnimi imeni razredov in tremi
kopijami CSS.

**Različno:** samo igra ima pravi model igranja (poteze, razveljavi, ročno odstranjeni
kandidati, poudarek, seznami). Trening ima pet posebnih postavitev, ker so njegove vaje
sestavljene in pogosto niso cela mreža; reševalec mrežo samo prikazuje (razen vnosa
danosti).

### 1.2 Kaj bi šlo v `shared/`

Za »Vadi v uganki« je potrebna **igralna** mreža, torej tista iz igre. Predlog razdelitve:

1. **`shared/stanje.js`** – današnji `igra/stanje.js` brez sprememb (je že brez DOM-a):
   igra kot zaporedje potez, `stanjeIgre()`, `mozneAkcije()`, `skupniKandidati()`,
   `dodajPotezo()`, razveljavi/ponovi, `manjkajoceVEnotah()`, `prvaNapaka()`. Shranjevanje
   (`igraShrani()`, `igraNalozi()` …) ostane v igri ali pa se loči v `igra/shramba.js`, ker
   trening v `sudoku.igra.v1` ne sme pisati. Odvisnost: `odigrajPoteze()` je v
   `shared/zbirka.js` – trening mora naložiti tudi `zbirka.js` (je brez DOM-a) ali pa se
   `odigrajPotezo()`/`odigrajPoteze()` preselita v `shared/stanje.js`.
   Dodati je treba **začetni kazalec** (`igra.zacetek`): pri vaji so poteze do stanja vaje
   del izhodišča in jih »Razveljavi« ne sme vrniti.
2. **`shared/mreza.js` + `shared/mreza.css`** – samo izris: `ustvariMrezo(el, { obKliku })`
   vrne objekt z `izrisi(pogled)`, kjer je `pogled = { grid, danosti, kandidati (ali null =
   brez kandidatov), poudarek (števka → barva), izbrane, sosede, korak (vzorec, izbris,
   vpis), zaklenjena }`. Sem gre `izrisiMrezo()` in `izrisiSezname()`/`narediPolje()` iz
   igre ter pripadajoči CSS (`.mreza`, `.celica`, `.kandidati`, `.kand`, `.poud`, `b1`–`b3`,
   `k-*`, `.seznam*`, pribl. 150 vrstic iz `igra.css`). Brez stanja in brez shrambe.
3. **`shared/plosca.js`** – vnos: nizi »Poudari« / »Vpiši« / »Odstrani kandidata«, izbira ene
   ali več celic, tipkovnica, gumbi razveljavi/ponovi/zbriši, vrstica z razlogom
   (`razlogNizov()`), poudarjanje števk. Iz igre pribl. 350 vrstic (`igra.js` 59–270,
   464–533, 803–868). Nastavitve: katere akcije so dovoljene (pri vajah 1–12 brez niza
   »Vpiši«, pri E1/E2 brez »Odstrani«), povratni klic ob potezi, zaklep.
4. **Reševalec** – ni nujen. Njegova mreža je samo za ogled; `renderGridInto()` bi lahko
   uporabil `shared/mreza.js` v načinu brez izbire (enotne barve koraka v vseh treh
   aplikacijah), vnosna mreža pa je stvar `docs/uskladitev.md` 6.4. Predlagam, da ga v tej
   nalogi ne spreminjamo.
5. **Obstoječe vaje v treningu** ostanejo na svojih postavitvah (način »Spoznaj« se ne
   spremeni).

### 1.3 Ocena obsega

| Del | Obseg | Opomba |
|---|---|---|
| `shared/stanje.js` (preselitev + začetni kazalec) | majhen | testi `igra-stanje` ostanejo, dodati test začetnega kazalca |
| `shared/mreza.js` + `mreza.css` iz igre | srednji | `igra-ui` testi morajo ostati zeleni; videz je treba pogledati ročno (testi CSS ne vidijo) |
| `shared/plosca.js` iz igre | srednji do velik | `igra.js` ima vnos prepleten z globalnimi `igra`, `stanje`, `pomoc`, `sporocilo`; največje tveganje regresije |
| reševalec na skupno mrežo | srednji | neobvezno, pozneje |

Skupaj je preureditev igre na skupno mrežo pribl. **dve do tri seje**, preden trening dobi
kar koli novega.

---

## 2. Meritev

### 2.1 Postopek

Skript: `node tools/meri-trening-v-uganki.js --ugank 20000` (semena 1–20000, 20,5 min v
Node na namiznem računalniku; z `--json pot` shrani še podatke po ugankah).

1. **Uganka** – naključna polna mreža, iz katere se v naključnem vrstnem redu odstranjujejo
   celice, dokler je rešitev ena (ista zanka kot v `ustvariUganko()`, le brez ocene stopnje
   na vsakem koraku). Povprečno **31 ms**.
2. **Pot** – od danosti se ponavlja `nextStep(b)` brez prednosti števke (čisti vrstni red
   `ALL_TECHNIQUES`), do rešitve ali do prvega poskusa s protislovjem (stanja za njim imajo
   kandidate, izbrisane z ugibanjem). Povprečno **5,5 ms**. Stanje na poti je kandidat za
   vajo tehnike, ki je v njem naslednji korak.
3. **Stopnja** uganke po `oceniUganko()` (kot »Oceni zbirko«) – samo za analizo, ni del
   časa iskanja.

Dve definiciji »tehnika T je naslednji korak«:

- **strogo** – `nextStep(b)` vrne korak tehnike T: nobena tehnika pred T (po
  `ALL_TECHNIQUES`) v stanju ne najde ničesar;
- **skupina** – T nekaj najde in je v *najlažji skupini* `TECHNIQUE_GROUPS`, ki sploh kaj
  najde (pravilo sidra v `nextStep()`); lažja tehnika iz iste skupine je lahko prisotna.

**Čas do stanja** je simuliran na zaporedju ugank: iskanje začne pri uganki *i* in sešteva
čas ustvarjanja in poti, dokler se T ne pojavi (pri uganki s T samo do prvega stanja s T),
nato se začne novo iskanje. »V 2 s« je delež iskanj, končanih v 2 s. **Čisto stanje** je
stanje, pred katerim so bili na poti sami enojčki – kandidati so natanko tisti, ki jih
dovolijo števke, brez izbrisov prejšnjih korakov.

Porazdelitev ugank (»Ekstrem« je v tej meritvi uganka z ugibanjem – od opredelitve stopenj
2026-09-24 »Presega tehnike«, `docs/uskladitev.md`, razdelek 7): Lahka 41,6 %, Srednja
18,7 %, Težka 8,8 %, Zelo težka 7,5 %, Ekstrem 23,4 % (od ugank brez ugibanja je lahkih 54 % – enako kot meritev 600 ugank v
`docs/uganke.md`).

### 2.2 Rezultati – strogo

| Tehnika | ugank s stanjem | stanj na uganko | praznih celic | čisto stanje | povp. čas | 90 % iskanj v | v 2 s | v 10 s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 Očitni enojček | 96,5 % | 35,3 | 53 | 86,9 % | 0,03 s | 0,05 s | 100 % | 100 % |
| E2 Skriti enojček | 99,0 % | 13,3 | 53 | 98,9 % | 0,03 s | 0,04 s | 100 % | 100 % |
| 1 Pointing pair/triple | 52,5 % | 3,1 | 42 | 50,6 % | 0,06 s | 0,12 s | 100 % | 100 % |
| 2 Box-line reduction | 25,4 % | 1,6 | 41 | 2,5 % | 0,14 s | 0,29 s | 100 % | 100 % |
| 3 Očitna para | 21,9 % | 1,4 | 40 | 1,8 % | 0,16 s | 0,35 s | 100 % | 100 % |
| 4 Skrita para | 14,8 % | 1,3 | 42 | 0,7 % | 0,24 s | 0,52 s | 100 % | 100 % |
| 5 Očitna trojica | 3,9 % | 1,1 | 41 | 0,1 % | 0,94 s | 2,28 s | 86,1 % | 100 % |
| 6 Skrita trojica | **1,3 %** | 1,0 | 43 | 0,1 % | **2,88 s** | 6,51 s | **48,0 %** | 96,9 % |
| 7 X-Wing | 4,4 % | 1,1 | 36 | 0,3 % | 0,82 s | 1,88 s | 92,0 % | 100 % |
| 8 Swordfish (Mečarica) | **1,0 %** | 1,0 | 36 | 0,0 % | **3,83 s** | 7,80 s | **38,7 %** | 92,1 % |
| 9 Turbot Fish | 20,1 % | 1,4 | 37 | 1,3 % | 0,18 s | 0,38 s | 100 % | 100 % |
| 10 W-Wing | 10,8 % | 1,2 | 34 | 0,5 % | 0,33 s | 0,76 s | 99,7 % | 100 % |
| 11 XY-Wing | 5,9 % | 1,1 | 35 | 0,2 % | 0,61 s | 1,36 s | 96,8 % | 100 % |
| 12 Unique Rectangle | 2,5 % | 1,0 | 36 | 0,0 % | 1,48 s | 3,29 s | 73,6 % | 100 % |

»Ugank s stanjem« = delež ugank, ki imajo na poti vsaj eno stanje s T; »stanj na uganko« =
povprečno število takih stanj v taki uganki; »praznih celic« = v prvem takem stanju.
Deleži v meji se ujemajo z oceno po geometrijski porazdelitvi (1 − (1 − p)^(meja / 37 ms))
na ±3 odstotne točke, zato so zanesljivi tudi pri redkih tehnikah.

### 2.3 Rezultati – skupina

| Tehnika | ugank s stanjem | povp. čas | v 2 s | v 10 s | razlika do strogo |
|---|---:|---:|---:|---:|---|
| E2 Skriti enojček | 100 % | 0,03 s | 100 % | 100 % | stanja z očitnim enojčkom – za E2 neuporabno (obstoječa vaja E2 zahteva stanje *brez* očitnega enojčka) |
| 2 Box-line reduction | 53,9 % | 0,06 s | 100 % | 100 % | skoraj vedno je zraven tudi Pointing |
| 4 Skrita para | 27,1 % | 0,13 s | 100 % | 100 % | |
| 6 Skrita trojica | 4,3 % | 0,90 s | 88,6 % | 100 % | 3,3× več stanj |
| 8 Swordfish | 2,9 % | 1,32 s | 76,2 % | 100 % | 3× več stanj (večinoma ob X-Wingu) |
| 10 W-Wing | 16,4 % | 0,23 s | 100 % | 100 % | |
| 11 XY-Wing | 11,0 % | 0,34 s | 99,6 % | 100 % | |
| 12 Unique Rectangle | 5,2 % | 0,73 s | 94,7 % | 100 % | 2× več stanj |

Prve tehnike v svoji skupini (E1, 1, 3, 5, 7) imajo po obeh definicijah enake številke;
Turbot Fish se malo poveča (22,4 %).

### 2.4 Iz katerih stopenj pridejo stanja (strogo)

V celici: **delež stanj iz te stopnje** · verjetnost, da ima uganka te stopnje stanje s T.

| Tehnika | Lahka | Srednja | Težka | Zelo težka | Ekstrem |
|---|---:|---:|---:|---:|---:|
| E1 | 43 % · 100 % | 19 % · 100 % | 9 % · 100 % | 8 % · 100 % | 21 % · 85 % |
| E2 | 41 % · 98 % | 19 % · 100 % | 9 % · 100 % | 8 % · 100 % | 24 % · 100 % |
| 1 | – | 34 % · 95 % | 13 % · 76 % | 13 % · 89 % | 41 % · 92 % |
| 2 | – | 23 % · 31 % | 12 % · 36 % | 17 % · 58 % | 48 % · 52 % |
| 3 | – | 23 % · 27 % | 16 % · 41 % | 20 % · 59 % | 41 % · 38 % |
| 4 | – | 14 % · 11 % | 12 % · 20 % | 22 % · 44 % | 52 % · 33 % |
| 5 | – | 7 % · 1,4 % | 10 % · 4,4 % | 28 % · 14 % | 55 % · 9,0 % |
| 6 | – | 6 % · 0,4 % | 7 % · 1,0 % | 27 % · 4,5 % | 60 % · 3,3 % |
| 7 | – | – | 3 % · 1,3 % | 53 % · 31 % | 44 % · 8,4 % |
| 8 | – | – | 3 % · 0,3 % | 57 % · 7,2 % | 40 % · 1,6 % |
| 9 | – | – | 26 % · 59 % | 27 % · 73 % | 47 % · 40 % |
| 10 | – | – | 21 % · 25 % | 40 % · 58 % | 39 % · 18 % |
| 11 | – | – | 16 % · 11 % | 41 % · 32 % | 43 % · 11 % |
| 12 | – | – | 10 % · 2,9 % | 32 % · 10,5 % | 58 % · 6,0 % |

- Srednje tehnike (1–4) pridejo najpogosteje iz **Srednjih** in **Ekstrem** ugank, redke
  (5, 6, 8, 12) in napredne pa iz **Zelo težkih** in **Ekstrem**. Ekstrem uganke dajo
  40–60 % stanj srednjih in naprednih tehnik (stanja *pred* prvim ugibanjem so veljavna).
- **Iskanje po stopnji se ne splača.** Swordfish je v zelo težki uganki 7-krat verjetnejši
  (7,2 %) kot v naključni (1,0 %), a `ustvariUganko('zelotezka')` traja pribl. 2,1 s
  (`CLAUDE.md`), torej pribl. 29 s na stanje – naključna minimalna uganka (37 ms) je
  pribl. 8-krat hitrejša. Enako velja za druge tehnike: filtriranje po stopnji je dražje od
  pregledovanja več naključnih ugank.

### 2.5 Redke tehnike

| Tehnika | ugank s stanjem (strogo) | povp. čas | v 2 s | v 10 s | ocena na telefonu (3× počasneje) |
|---|---:|---:|---:|---:|---|
| 8 Swordfish (Mečarica) | 1,0 % (191 od 20 000) | 3,8 s | 39 % | 92 % | pribl. 11 s, v 10 s pribl. 58 % |
| 6 Skrita trojica | 1,3 % (254) | 2,9 s | 48 % | 97 % | pribl. 9 s |
| 12 Unique Rectangle | 2,5 % (492) | 1,5 s | 74 % | 100 % | pribl. 4,5 s |
| 5 Očitna trojica | 3,9 % (771) | 0,9 s | 86 % | 100 % | pribl. 3 s |
| 7 X-Wing | 4,4 % (883) | 0,8 s | 92 % | 100 % | pribl. 2,5 s |

- **Swordfish** in **skrita trojica** sproti nista primerna (povprečje nad 2 s že na
  namiznem računalniku, rep do 8 s). Za njiju je potrebna **banka semen** (4.1) ali vsaj
  iskanje v delavcu z vrstico napredka.
- Po definiciji *skupina* sta Swordfish (1,3 s) in skrita trojica (0,9 s) sprejemljiva, a
  stanje Swordfish takrat pogosto vsebuje tudi X-Wing.
- Čas na telefonu je ocena (faktor 3 je predpostavka, ni izmerjen).
- **Čisto stanje** (brez izbrisov prejšnjih korakov) je realno samo pri E1, E2 in Pointing
  (50 %); pri 2–12 je pod 3 %, pri redkih praktično nikoli (Swordfish 0 od 191). Vaje 2–12
  bodo torej skoraj vedno stanja, v katerih so nekateri kandidati že odstranjeni.

### 2.6 Večznačnost odgovora (prvo strogo stanje tehnike v uganki)

| Tehnika | korakov T v stanju | izbrisov (vpisov) v koraku | stanj, kjer kaj najde še druga tehnika | najpogostejše druge |
|---|---:|---:|---:|---|
| E1 | 1,3 | 1 | 99,9 % | Box-line, skrita para, skriti enojček |
| E2 | 8,9 | 1 | 100 % | Box-line, skrita para, očitna trojica |
| 1 Pointing | 2,9 | 1,8 | 99,9 % | Box-line, Turbot Fish, skrita para |
| 2 Box-line | 1,4 | 2,8 | 96,3 % | Turbot Fish, skrita para, očitna para |
| 3 Očitna para | 1,7 | 3,2 | 98,4 % | skrita para, skrita trojica, očitna trojica |
| 4 Skrita para | 2,0 | 3,6 | 92,3 % | očitna trojica, Turbot Fish, skrita trojica |
| 5 Očitna trojica | 1,1 | 4,3 | 95,2 % | skrita trojica, Turbot Fish, XY-Wing |
| 6 Skrita trojica | 1,1 | 4,9 | 63,4 % | Turbot Fish, W-Wing, XY-Wing |
| 7 X-Wing | 1,3 | 2,8 | 100 % | Turbot Fish, Swordfish, W-Wing |
| 8 Swordfish | 1,5 | 3,9 | 86,4 % | Turbot Fish, W-Wing, XY-Wing |
| 9 Turbot Fish | 2,7 | 1,3 | 54,5 % | W-Wing, XY-Wing, UR |
| 10 W-Wing | 2,7 | 1,5 | 47,3 % | XY-Wing, UR |
| 11 XY-Wing | 2,8 | 1,5 | 13,3 % | UR |
| 12 Unique Rectangle | 1,1 | 2,0 | 0 % | – |

Posledici za preverjanje (razdelek 3): pravilen mora biti **vsak** korak T v stanju, ne
samo prvi (pri Pointing, Turbot, W-Wing, XY-Wing jih je povprečno skoraj tri), in skoraj
vedno obstaja tudi pravilen izbris z drugo (težjo) tehniko. X-Wing je v vsakem stanju
hkrati Turbot Fish (X-Wing je poseben primer dveh močnih povezav).

### 2.7 Povzetek meritve

- E1, E2, 1–4, 9, 10: sproti, vedno pod 1 s (večinoma pod 0,3 s).
- 5, 7, 11, 12: sproti v 2 s pri 74–97 %, v 10 s pri 100 % – sprejemljivo z delavcem in
  sporočilom »Iščem …«, na telefonu mejno.
- 6, 8: banka semen (ali definicija *skupina*).
- Iz ene uganke je pri E1/E2/Pointing mogoče dobiti več vaj (35 / 13 / 3 stanja), pri
  ostalih večinoma eno.

---

## 3. Preverjanje odgovora

### 3.1 Izhodišče

Vaja je stanje `S0` (mreža, kandidati) in tehnika `T`. Iz `S0` se izračunajo:

- `KT` = vsi koraki tehnike `T` v `S0` (funkcija tehnike, npr. `swordfish(deska)`, ne samo
  prvi korak iz `nextStep()` – meritev kaže, da je korakov `T` v stanju pogosto več);
- `KV` = koraki vseh tehnik v `S0` (za prepoznavanje »prave poteze z drugo tehniko«);
- `resitev` = `solutionOf(danosti)`.

Igralec rešuje na mreži z igralnimi potezami. Odgovor je razlika med `S0` in trenutnim
stanjem `S1`:

- `R` = kandidati, ki so bili v `S0` in jih v `S1` ni (ročno odstranjeni, tudi z
  odstranjevanjem iz več celic);
- `V` = vpisi, ki jih v `S0` ni bilo.

Odgovor se presodi ob kliku **»Preveri«** (kot v obstoječem treningu), ne sproti – sprotna
presoja bi izdala, ali je izbris pravi.

### 3.2 Tehnike 1–12 (odstranitev kandidatov)

Niz »Vpiši« je v teh vajah onemogočen (vpis ni odgovor; enojček, ki nastane po izbrisu, je
že naslednja vaja). Presoja po vrsti:

| Izid | Pogoj | Sporočilo (predlog) | Šteje |
|---|---|---|---|
| **napačno** | v `R` je kandidat, ki je števka rešitve (`d === resitev[c]`) | »Iz V3S5 si odstranil 7 – to je prava števka te celice.« + gumb »Poskusi znova« (vrne na `S0`) | napačno |
| **pravilno** | obstaja korak `k ∈ KT`, katerega izbrisi so vsi v `R`, in vsak izbris iz `R` je izbris kakega koraka iz `KT` | »Pravilno!« + sporočilo koraka (`k.message`), na mreži oznake koraka `k` | pravilno |
| **delno** | `R` ni prazen, vsak izbris iz `R` je izbris kakega koraka iz `KT`, noben korak pa ni dokončan | »Prav, a to še ni ves korak – manjka še N izbrisov.« (N za najbližji korak); vaja teče naprej | – |
| **prav, a z drugo tehniko** | vsak izbris iz `R` je upravičen s kakim korakom iz `KV`, vsaj eden pa ne s korakom iz `KT` | »To drži, a sledi iz W-Wing, ne iz Swordfish.« (ime tehnike koraka, ki ga pokrije) | ne šteje (kot »nevtralno« pri enojčkih) |
| **neutemeljeno** | v `R` je kandidat, ki ni števka rešitve, a ga iz `S0` ne izbriše noben posamezen korak | »Ta izbris drži, a iz tega stanja ne sledi v enem koraku.«; izbris se razveljavi | ne šteje (odločitev 5) |
| **prazno** | `R` je prazen | »Odstrani kandidate, ki jih tehnika izloči.« | – |

Opombe:

- »Pravilno« ne zahteva, da igralec najde **isti** korak kot `nextStep()` – vsak korak `T` v
  stanju velja (tako že dela obstoječi trening pri Pointing, Box-line, XY-Wing, UR …).
- Pri skriti pari/trojici so izbrisi »ostali kandidati v celicah vzorca«; pri očitni pari
  »števke para drugod v enoti« – oboje je že v `eliminate` koraka, zato pravilo velja brez
  posebnosti. Druga faza (izbira števk) iz »Spoznaj« tu ni potrebna: kdor pravilno izbriše,
  je vzorec našel.
- Kandidati, ki so bili v `S0` odstranjeni že pred vajo (prejšnji koraki poti), niso del
  odgovora; »vrni« zanje naj ne bo mogoč (glej 4.4).
- Pri »Poskusi znova« se mreža vrne na `S0` (kazalec = začetek), poteze ostanejo v
  »Ponovi« kot v igri.

### 3.3 E1, E2 (vpis)

Odgovor je **prvi vpis** (celica, števka). Presoja je obstoječa `preveriEnojcek()` iz
`trening/generators.js` (preseli se v `shared/`, ker je prava za oba načina):

| Izid | Pogoj |
|---|---|
| **pravilno** | vpis je korak tehnike (`nakedSingles()` pri E1, `hiddenSingles()` pri E2) v `S0` |
| **nevtralno** | števka je prava (rešitev), a je ta tehnika v `S0` ne dokaže (npr. skriti enojček pri E1) – ne šteje |
| **napačno** | števka ni prava; z razlogom (»Števka 9 je v vrstici 8 že vpisana (V8S1).«) |

Odstranjevanje kandidatov je pri E1/E2 onemogočeno. Mreža je **brez kandidatov**
(odločitev 2): igra jih kaže vedno, pri E1 s prikazanimi kandidati pa vaje skoraj ni (celica
z enim samim kandidatom je vidna na prvi pogled).

### 3.4 Pomoč med vajo

Igra že ima postopno pomoč, ki ustreza vaji: ime tehnike je znano (to je vaja), zato
ostaneta dve stopnji – **namig** (`stepHint()` za korak `nextStep()`) in **rešitev**
(razlaga + oznake `k-vzorec`/`k-izbris`/`k-vpis` + seznam dejanj z »Opravljeno: N od M«).
Uporaba pomoči naj vajo označi kot »s pomočjo« (ne šteje kot pravilna).

---

## 4. Predlog

### 4.1 Arhitektura

```
shared/engine.js       motor (nespremenjen)
shared/generator.js    + genMinimalnaUganka(seme)   (zanka iz ustvariUganko brez ocene)
shared/stanje.js       igra kot poteze (iz igra/stanje.js) + začetni kazalec
shared/mreza.js/.css   izris mreže in seznamov (iz igra.js/igra.css)
shared/plosca.js       vnos: nizi, izbira, tipkovnica (iz igra.js)
shared/vaje-uganka.js  brez DOM-a: iskanje stanja, stanje kot igra, presoja odgovora
shared/vaje-semena.js  banka semen za redke tehnike (ustvari orodje, preveri test)
igra/                  uporablja shared/stanje, mreza, plosca (obnašanje enako)
trening/               + trening/v-uganki.js: način »Vadi v uganki«
```

**`shared/vaje-uganka.js`** (brez DOM-a, testabilno v Node):

- `vajaIzSemena(tehnika, seme)` → `{ danosti, poteze, S0, korak, koraki }` ali `null`:
  `genMinimalnaUganka(seme)`, pot z `nextStep()` do prvega stanja s `T`. Stanje se zapiše kot
  **igra**: vpisi poti in izbrisi poti (razlika med `new Board(mreža)` in kandidati na poti)
  kot poteze `kandidat`/`kandidati`, začetni kazalec za njimi. Tako je stanje vaje isto kot
  stanje igre, v katerem bi igralec te poteze naredil sam – ves vnos igre deluje brez
  posebnosti.
- `najdiVajo(tehnika, { meja, semena })` – sprotno iskanje po naključnih semenih ali izbira
  iz banke.
- `preveriVajo(vaja, stanje)` → `{ izid, sporocilo, korak }` po 3.2/3.3.

**Iskanje.** Po meritvi (2.7): E1, E2, 1–4, 9, 10 sproti (pod 1 s, lahko v glavni niti po
eno uganko na `setTimeout`, kot `iskanjeVGlavniNiti()` v igri); 5, 7, 11, 12 sproti v
delavcu z mejo (npr. 5 s), ob preseku banka; 6 in 8 iz banke. Predlagam **kombinacijo**: vse
tehnike imajo banko (vaja se začne takoj, tudi na telefonu), sprotno iskanje pa jo dopolnjuje
za raznolikost, kadar je hitro. Banka je seznam semen (števil),
pri katerih pot vsebuje stanje s `T`; iz semena se uganka in stanje ob zagonu izračunata
znova (pribl. 35 ms), zato je banka majhna in ne vsebuje ugank, »sestavljenih na pamet« –
vsako stanje nastane s programom. Test preveri, da vsako seme iz banke še da stanje svoje
tehnike (sprememba motorja, npr. nova tehnika ali vrstni red, ga lahko pokvari – test to
pokaže, orodje banko ustvari znova).

### 4.2 Vrstni red dela

1. **`shared/vaje-uganka.js` + test** (brez DOM-a): `genMinimalnaUganka`, iskanje stanja,
   stanje kot igra, presoja odgovora. Najprej, ker preveri zamisel brez posega v UI.
2. **Banka semen** + orodje (razširitev `tools/meri-trening-v-uganki.js` z `--banka`) + test.
3. **`shared/stanje.js`** – preselitev iz igre, začetni kazalec.
4. **`shared/mreza.js` + `mreza.css`** – izris iz igre; igra ga uporablja (ročni pregled
   videza).
5. **`shared/plosca.js`** – vnos iz igre; igra ga uporablja.
6. **Trening »Vadi v uganki«** – izbira načina na kartici, stran vaje (mreža + nizi +
   »Preveri« + pomoč + rezultat).
7. (neobvezno) reševalec na `shared/mreza.js`.

Koraki 1–2 so neodvisni od 3–5 in jih je mogoče narediti prej.

### 4.3 Vpliv na obstoječe

- **Obstoječe vaje (»Spoznaj«):** brez sprememb. Preselita se samo `preveriEnojcek()` in
  zanka minimalne uganke (`genUgankaEnojcki()` v `trening/generators.js` je ista zanka kot
  v generatorju, samo z `Math.random`) – obnašanje ostane.
- **Igra:** preureditev na skupne datoteke, obnašanje enako. Testi `igra-ui`, `igra-stanje`,
  `zbirka-skupna` morajo ostati zeleni brez sprememb pričakovanj (dovoljene so samo
  spremembe nalaganja datotek).
- **Reševalec:** brez sprememb.
- **Motor in generator:** brez sprememb obnašanja; `genMinimalnaUganka()` je nova funkcija.

### 4.4 Tveganja

- **Regresije v igri** pri izločanju mreže in vnosa – `igra.js` ima veliko skupnega stanja v
  globalnih spremenljivkah. Zmanjšamo jih z majhnimi koraki (najprej izris, nato vnos) in
  testi po vsakem.
- **CSS testi ne vidijo** – videz igre po preselitvi slogov je treba pogledati ročno (tudi
  na telefonu in s seznamom vrstic, `--gcs`).
- **Kandidati, odstranjeni pred vajo.** Pri tehnikah 2–12 je stanje skoraj vedno po kakem
  izbrisu (glej »čisto stanje« v meritvi), zato igralec vidi mrežo, v kateri manjkajo
  kandidati, ki jih sam ni odstranil. To je treba povedati (npr. vrstica »V tem stanju je že
  odstranjenih 14 kandidatov (prejšnji koraki).«) in vračanje takih kandidatov onemogočiti.
- **Več pravilnih odgovorov** – v večini stanj kaj najde tudi kaka druga (težja) tehnika;
  zato presoja »prav, a z drugo tehniko« (3.2).
- **Sprememba motorja** (nova tehnika, vrstni red) spremeni, katera stanja veljajo za `T` –
  banka semen se pokvari; test to ujame.
- **Hitrost na telefonu** – meritve so v Node na namiznem računalniku; brskalnik na telefonu
  je lahko 2–4× počasnejši. Pri tehnikah, ki so blizu meje, velja banka ali delavec.
- **Uganka »Ekstrem«** – stanje pred prvim poskusom s protislovjem je veljavno, a če bi
  igralec po vaji uganko reševal naprej (vprašanje 4), brez ugibanja ne bi prišel do konca.

### 4.5 Odločitve

Sprejete 2026-09-24 (prej »Vprašanja zate«). Veljajo pred predlogi v prejšnjih razdelkih,
kjer se razlikujejo.

1. **Definicija »naslednji korak«: strogo** – `T` je prva tehnika po `ALL_TECHNIQUES`, ki v
   stanju kaj najde (tako izbere tudi »Naslednji korak« v igri brez poudarjene števke).
   Redke tehnike, pri katerih strogih stanj sproti skoraj ni (2.2, 2.5), pridejo iz banke
   semen.
2. **E1 in E2 v uganki: brez kandidatov**, sicer pa so na voljo pripomočki kot v igri
   (poudarek števk, seznami manjkajočih števk, razveljavi/ponovi). Skupna mreža zato
   potrebuje način »brez kandidatov«.
3. **Kandidati, odstranjeni pred vajo: skriti** (kot ročno odstranjeni v igri, brez
   možnosti vrnitve). Nad mrežo je vrstica s **številom** takih kandidatov in stikalo
   **»Pokaži prečrtane«**, ki jih pokaže prečrtane (samo prikaz, odgovor se ne spremeni).
4. **Po pravilnem odgovoru: »Nova vaja«** – novo stanje iste tehnike. Ponudba »Nadaljuj v
   igri« (uganko rešujem naprej v igri) pride **pozneje**, ne v prvi različici.
5. **Neutemeljen izbris** (pravi kandidat ni, a iz `S0` ga ne izbriše noben posamezen
   korak): **ni napaka**. Igralec dobi razlago (»Ta izbris drži, a iz tega stanja ne sledi v
   enem koraku.«), izbris se razveljavi, vaja teče naprej in se zaradi njega ne šteje.
6. **Iskanje: kombinirano** – najprej sprotno iskanje s časovno mejo **1 s**, ob preseku
   meje vaja iz banke. Banko imajo zato vse tehnike (tudi hitre – na počasnem telefonu lahko
   tudi te presežejo mejo).
7. **Krog in štetje: enako kot pri obstoječih vajah** – 9 vaj v krogu (`MAX_EX`), rezultat
   »pravilno / vseh« z odstotkom in na koncu »Končano!«.
8. **Vaja s pomočjo se ne šteje nikamor** – ne med pravilne ne med napačne. Pomoč je ogled
   namiga **ali** rešitve (vsak ogled, tudi kratek); že šteti poskusi vaje se ob ogledu
   odštejejo, ogled po pravilnem odgovoru pa ne spremeni ničesar. Ob rezultatu je oznaka
   **»s pomočjo«** (pri sporočilu po »Preveri«, v vrstici rezultata »s pomočjo: N« in v
   povzetku kroga). »Nova vaja« oznako ponastavi. Pravilo velja za »Vadi v uganki« **in**
   za »Spoznaj« (v `trening/trening.js` narejeno 2026-09-24, test
   `tests/trening-pomoc.test.js`).
