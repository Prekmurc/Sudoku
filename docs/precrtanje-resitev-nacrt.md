# Prečrtanje števke izbrisa ob »Rešitvi« v »Spoznaj« 3–12 – načrt

Opaženo ob ročnem pregledu naloge »enotna izbira« (`docs/izbira-spoznaj-nacrt.md`, točka 2 v
`docs/rocni-test.md`, 2026-10-04): pri 11 · XY-krilo »Rešitev (drži)« pokaže celico izbrisa samo z
rožnato podlago, števka, ki se izbriše, ni prečrtana. Pri 2 · Izločitev v bloku je prečrtana.
Izvedeno 2026-10-04 (razdelek 5, commit `fe96e14`); ročni pregled (3 točke v `docs/rocni-test.md`)
potrjen istega dne na monitorju, tablici in telefonu – naloga zaprta.

## Odločitve (Darko, 2026-10-04)

- **Cilj:** pri vseh vajah z izbrisom je ob »Rešitvi (drži)« enako kot pri 2 – celica izbrisa
  rožnata, števka izbrisa rdeče prečrtana (kot v »Vadi v uganki«).
- Naredi se **vse tri skupine** (7–8, 9–12, 3–6 – razdelek 3).
- Pri 7 in 8 se popravi tudi **stanje po pravilnem odgovoru** (zdaj števka izbrisa tudi tam ni
  prečrtana).
- Preverjanje odgovora ostane, kot je; spremeni se samo prikaz.

## 1. Stanje po vajah

Izmerjeno v brskalniku brez glave (375 px; »Spoznaj« z `Math.random` s semenom 4242, »Vadi v
uganki« iz banke s semenom 7). Koda pred nalogo »enotna izbira« (`85adb6b`) in po njej (`7b4632e`)
se obnašata **enako** – to je stara zasnova, ne napaka te naloge.

| Vaja | Ob »Rešitvi (drži)« | Po pravilnem odgovoru |
|---|---|---|
| 1 · Izločitev izven bloka, 2 · Izločitev v bloku | rožnata celica, **rdeče prečrtana števka** | prečrtana |
| 3 · Očitni par, 5 · Očitna trojica | izbrisa ne pokaže (ne podlage ne števke) | prečrtana |
| 4 · Skriti par, 6 · Skrita trojica | izbrisa ne pokaže | prečrtana (po 2. fazi) |
| 7 · X-krilo, 8 · Mečarica | samo rožnata celica | **samo rožnata celica** |
| 9 · Veriga ene števke, 10 · W-krilo, 11 · XY-krilo, 12 · Edinstveni pravokotnik | samo rožnata celica (pri 12 je celica izbrisa vogal vzorca – jantarna) | prečrtana |
| »Vadi v uganki« (preverjeno 2, 4, 7, 11) | rdeče prečrtana | – |

Rdeče prečrtano je povsod isto: `--red` #B23A2E, krepko, `line-through` (pri 1, 2 in »Vadi v
uganki« `.kand.k-izbris` v `shared/mreza.css`, po pravilnem odgovoru pri 3–12 `.cd.elim` v
`trening/trening.css`). Kontrast na rožnati podlagi izbrisa #F0B4AA je 3,3, na jantarni podlagi
vzorca #EFD8A0 4,2.

## 2. Vzrok

- **1, 2 in »Vadi v uganki«** rišejo mrežo iz `shared/mreza.js`: korak se pokaže z
  `oznakeKoraka()` / `pogled.oznake`, kjer je izbris par celica–števka (`izbris: c*10+d`), zato
  mreža prečrta prav tisto malo števko.
- **3–12:** `peekOn()` v `trening/trening.js` označi samo **celice** – razred `peek-hl` (vzorec) in
  `peek-elim` (izbris, podlaga) na celici; katera števka v celici se izbriše, ne označi. Pri 3–6
  `peek-elim` sploh ne doda (vzorec generatorja ali drug veljaven vzorec iz `vzorecResitve()` ima
  pri paru/trojici `elim: []`; izbrisa pri skritih tam ni).
- **7 in 8 – mrtvi pravili:** `.xw-cell.peek-elim .xd` (»Rešitev«) in `.xw-cell.xw-elim .xd` (po
  pravilnem odgovoru) v `trening/trening.css` iščeta element `.xd`, ki ga mreža X-krila in
  mečarice nima – števka je kar besedilo celice (`cell.textContent=ex.digit` v `renderExercise()`).
- Po pravilnem odgovoru pri 3–6 in 9–12 prečrta `checkPhase1()` / `checkPhase2()` (razred `elim` na
  `.cd`): očitni par/trojica – števke vzorca v drugih celicah enote; skriti – druge števke v
  celicah vzorca; 9–12 – `match.eliminate` (celica, števka).

## 3. Predlog

Pri vseh: nov razred za prečrtanje ob »Rešitvi« (npr. `peek-izbris` na `.cd`), ki ga `peekOff()`
odstrani – ne `elim`, ker bi `peekOff()` sicer pobrisal prečrtanje po pravilnem odgovoru (ogled
»Rešitve« po odgovoru je mogoč). Slog enak kot `.cd.elim` (eno pravilo `.cd:is(.elim,.peek-izbris)`);
pravilo `.cd.hl-plum.elim` (rdeča prevlada nad obarvano števko pri 9) velja tudi za `peek-izbris`.

**7, 8 – samo CSS.** Celica ima eno samo števko (števko vaje), zato zadošča slog celice:
`.xw-cell.peek-elim` in `.xw-cell.xw-elim` dobita rdečo prečrtano števko (barva `--red`,
`line-through`); mrtvi pravili `.xd` se odstranita. Pri 7 in 8 se s tem popravi tudi stanje po
pravilnem odgovoru. Pri drugem veljavnem vzorcu (`vzorecResitve()`) dobijo `peek-elim` njegove
celice izbrisa – že zdaj.

**9–12 – JS in CSS.** V `peekOn()` (veja `isXYWing||isUR||isTurbot||isWWing`) za vsak par
`[celica, števka]` iz `step.eliminate` dobi mala števka `.cd[data-d=števka]` te celice razred
`peek-izbris`. Pri 12 je celica izbrisa vogal vzorca: ostane jantarna (vzorec ima prednost, kot
zdaj in kot v »Vadi v uganki«), njeni števki pa sta prečrtani – tako se izbris pri 12 prvič vidi.

**3–6 – JS in CSS.** Zdaj »Rešitev« izbrisa ne pokaže, zato sta potrebna celica in števka:
- **3, 5:** celice enote zunaj vzorca, ki imajo števke vzorca, dobijo `peek-elim` (rožnata
  podlaga) in te števke `peek-izbris`. Števke in celice iz vzorca, ki ga pokaže »Rešitev«
  (`vzorecResitve()` – pri drugem veljavnem vzorcu iz tega), torej `elim` v `veljavniVzorci()` za
  par/trojico ni več prazen.
- **4, 6:** v celicah vzorca dobijo `peek-izbris` druge števke (ne števke skritega para/trojice);
  celice ostanejo jantarne (kot skriti par v »Vadi v uganki«). Števke izdaja že besedilo
  »Rešitve« (»Celice: … · Števke: {…}«), zato prečrtanje ne izda ničesar novega.
- Izračun izbrisa je isti kot po pravilnem odgovoru (`checkPhase1` za očitne, `checkPhase2` za
  skrite): izloči se v eno pomožno funkcijo, ki jo kličeta preverjanje in `peekOn()` – logike ne
  podvajaj; obnašanje preverjanja ostane enako.

**Opomba za izvedbo:** nadomestni DOM (`tests/dom-stub.js`) nima `querySelector` (vrne `null`), zato
naj `peekOn()` male števke poišče prek otrok celice (`.candgrid` → `.cd` z `dataset.d`), da jih
Node test vidi.

## 4. Preverjanje

- **Scenarij** `tools/preveri-izbira-brskalnik.js` (dopolnitev): pri vseh vajah z izbrisom (3–12)
  pri 375 in 1280 px s pravim pritiskom miške:
  - ob »Rešitvi« brez izbire je vsaka števka izbrisa rdeče prečrtana (izračunan slog: barva
    #B23A2E, `line-through`) in nobena druga – neodvisno merilo: prečrtane števke ob »Rešitvi«
    morajo biti iste kot po pravilnem odgovoru (celice vzorca s pravimi kliki, pri 4 in 6 še 2.
    faza);
  - slog prečrtane števke je enak kot pri 2 (`.kand.k-izbris` v mreži) – barva, debelina pisave,
    `text-decoration-line`;
  - pri 7 in 8 je števka izbrisa prečrtana tudi po pravilnem odgovoru;
  - po spustu ni nobene prečrtane števke (razen tistih po pravilnem odgovoru, ki ostanejo);
  - primerjave z izhodiščem (»Rešitev« brez izbire, pravilen odgovor, »Rešitev« po njem) se
    spremenijo: izhodišče postane zadnji commit pred nalogo, razlike so dovoljene samo pri
    prečrtanih števkah in celicah izbrisa pri 3–6 (podlaga).
- **Meritev prekrivanja** okvirja z malimi števkami pri 375 px: med meritvijo se slog `peek-izbris`
  izenači z navadno malo števko (vbrizgan slog), sicer bi krepkejša prečrtana števka štela kot več
  prekrivanja, čeprav je okvir enak; pogoj ostane »ne več kot v izhodišču«.
- **Node test** (`tests/trening-resitev.test.js` ali nov): `peekOn()` doda `peek-izbris` natanko
  števkam izbrisa – 9–12 iz `solutionEliminate` vaje, 3 in 5 iz števk vzorca v drugih celicah enote
  (tudi pri drugem veljavnem vzorcu), 4 in 6 iz drugih števk v celicah vzorca –, `peekOff()` ga
  odstrani, `elim` po pravilnem odgovoru ostane tudi po ogledu »Rešitve« in spustu.
- Obstoječi: `node --test "tests/*.test.js"`, `preveri-vadi-brskalnik.js` (»Spoznaj 3–12«:
  kontrast besedila v celicah vzorca in izbrisa ob »Rešitvi« vsaj 3 – rdeča na rožnati 3,3),
  `preveri-enojcki-`, `preveri-presek-`, `preveri-videz-brskalnik.js`, `tools/posnetek-igre.js
  --primerjaj` (igra ostane enaka).
- Ročni pregled: največ 3 točke (npr. prečrtana števka pri 11 na telefonu, pri 12 v jantarnem
  vogalu, pri 3 rožnate celice izbrisa).

## 5. Izvedba (2026-10-04)

Izvedeno vse po razdelku 3 – vse tri skupine (7–8, 9–12, 3–6) in stanje po pravilnem odgovoru
pri 7 in 8.

- **`trening/trening.js`**
  - `izbrisPodmnozice(ex, M, ps, ds)` – **ena funkcija** za izbris pri 3–6 (pari `[si, števka]`):
    pri očitnem paru/trojici števke `ds` v drugih celicah enote, pri skritem (`M.hasPhase2`) druge
    števke v celicah vzorca. Kličejo jo `checkPhase1` (očitni), `checkPhase2` (skriti) in
    »Rešitev« (`vzorecPodmnozice()` v `veljavniVzorci()` in v privzetem vzorcu `vzorecResitve()`
    pri 3 in 5, neposredno v `peekOn()` pri 4 in 6). `veljavniVzorci()` ima zato pri paru in
    trojici `elim` (celice) in `izbris` (pari).
  - `maleStevke(gc)` / `malaStevka(gc, d)` / `oznaciStevke(cellEls, pari, razred)` – male števke
    prek otrok celice (`.candgrid` → `.cd`, nadomestni DOM nima `querySelector`). Uporabljajo jih
    `peekOn()`, `peekOff()` in prečrtanje po pravilnem odgovoru pri 3–6 in 9–12 (prej
    `querySelector`/`querySelectorAll('.cd')` – v brskalniku isti elementi; obarvanje števk vzorca
    `hl` pri 3–6 je ostalo nespremenjeno).
  - `peekOn()`: 9–12 – `peek-izbris` iz `step.eliminate`; 3, 5 – `peek-elim` na celicah izbrisa in
    `peek-izbris` na števkah vzorca, ki ga »Rešitev« pokaže (tudi drug veljaven vzorec); 4, 6 –
    `peek-izbris` na drugih števkah celic vzorca (celice ostanejo jantarne). `peekOff()` odstrani
    `peek-izbris`, `elim` po pravilnem odgovoru ostane.
  - **»Preveri« se obnaša enako:** DOM po pravilnem odgovoru je enak izhodišču (scenarij, spodaj),
    obstoječi testi preverjanja so nespremenjeni in gredo skozi.
- **`trening/trening.css`**: `.cd:is(.elim,.peek-izbris)` (rdeča, krepko, `line-through`),
  `.cd.hl-plum:is(.elim,.peek-izbris)` (rdeča prevlada pri 9), `.xw-cell:is(.peek-elim,.xw-elim)`
  (za `.xw-cell.has-digit`, da prevlada nad njegovo barvo); mrtvi pravili `.xd` sta odstranjeni.
- **Testi:** nov `tests/trening-precrtanje.test.js` (po tri vaje vsake tehnike 3–6 in 9–12 ter
  drug veljaven vzorec pri 5; pri 3 drugega vzorca ni – generator para ga v 2000 vajah ne da).
  V `tests/trening-resitev.test.js` je spremenjeno samo pričakovano `elim` pri očitnem paru in
  trojici (`VZOREC`, `DRUGI`): prej `[]` – zapis stare zasnove »izbrisa ne pokaže« –, zdaj druge
  celice enote s katero od števk vzorca (izračun neodvisno od `trening.js`); preverbe »Preveri« v
  tej datoteki so ostale.
- **Scenarij** `tools/preveri-izbira-brskalnik.js` po razdelku 4: izhodišče `06e64e5`, izbira je v
  obeh brskalnikih ista (izbere jo nova koda – pri 3 in 5 so zdaj celice izbrisa, zato bi bila
  izbira v izhodišču drugačna), »neodvisno merilo« z 2. fazo pri 4 in 6 (števke iz besedila
  »Rešitve«), slog primerjan s `.kand.k-izbris` pri 2, pri meritvi prekrivanja prečrtane števke
  kot navadne (razred `peek-izbris` za čas meritve odstranjen, pri 7 in 8 vbrizgan slog celice).

### Izid preverjanja

- `node --test "tests/*.test.js"`: 468 testov, vsi gredo skozi (od tega 25 v novem
  `tests/trening-precrtanje.test.js`).
- `tools/preveri-izbira-brskalnik.js`: 476 preverb, vse drži. Pri semenu 4242 je ob »Rešitvi«
  prečrtanih 6 / 3 / 5 / 8 / 2 / 6 / 2 / 2 / 1 / 2 števk (3–12), po pravilnem odgovoru iste; slog
  pri obeh širinah rgb(178, 58, 46), 700, `line-through` – enak kot pri 2. Prekrivanje okvirja z
  malimi števkami pri 375 px je pri vseh desetih vajah enako izhodišču (pred »Preveri« in med
  »Rešitvijo«).
- Drugi scenariji brez razlik: `preveri-vadi-` (364 preverb – tudi »Spoznaj 3–12«: kontrast besedila v
  celicah vzorca in izbrisa ob »Rešitvi« vsaj 3), `preveri-enojcki-` (328), `preveri-presek-` (77),
  `preveri-videz-` (315), `preveri-kandidati-` (44), `preveri-niz-brskalnik.js` (34); posnetek igre
  (`tools/posnetek-igre.js --primerjaj tools/posnetki/igra-po-5a.json`): enako, 99 posnetkov.
