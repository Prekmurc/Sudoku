# Imena – slovensko preimenovanje (naloga 11a) – načrt

Načrt 2026-10-18. Vir odločitev: `docs/uskladitev.md`, 1.1 in 1.3 (»Odločitev 2026-10-18«) in vrstica 11a v »Vrstni red
po fazi 6«; povzetek `docs/imena-tehnik.md` (ob razhajanju velja `docs/uskladitev.md` – razhajanj pri pregledu nisem
našel). **Stanje: potrjen 2026-10-18** (odločitve O1–O7 in pomen značke v razdelku 7).

Izhodišče: commit `1a1fd5c` (zapis odločitev 2026-10-18).

**Cilj.** Imena, ki jih vidi uporabnik, po odločitvah 2026-10-18: skupine tehnik za prikaz (7 skupin, angleško v
oklepaju), 9 · Kratka X-veriga, 11 · XY-krilo (XY-Wing) – Y-Wing samo v Pomoči –, dodatna angleška imena samo v Pomoči,
»Ekstrem« → »Ekstremna« (staro ime se ob branju preslika), značke težavnosti na karticah (LAHKA (EASY) … EKSTREMNA
(EXTREME)), stavek o Zelo težki v Pomoči, kazalo v treningu in v Pomoči enake oblike, naslovi skupin nad karticami in
skupina na vrhu vaje. Videz je dogovorjen v 1.1 – načrt ga ne spreminja in nima slik.

**Ni del 11a:** X-veriga (naloga 11b). Do 11b ostane XY-veriga 13 in edina tehnika skupine »Dolge verige«. Motor,
vrstni red tehnik, sidranje in ocena ugank se ne spremenijo.

## 0. Povzetek

- **Dva koraka.** Korak 1 – imena in težavnost (besedila, podatki, shramba, značke; brez nove postavitve). Korak 2 –
  skupine in prikaz (kazalo, naslovi skupin, vrh vaje) in zaključek. Vsak korak: commit, push, nov pogovor; ročni pregled
  en sam, na koncu koraka 2.
- **Skupine za prikaz so ločene od `TECHNIQUE_GROUPS`** (razdelek 2): nova `SKUPINE_TEHNIK` v `shared/engine.js`,
  `TECHNIQUE_GROUPS` (sidranje v `nextStep()`) ostanejo nespremenjene – drugače bi se spremenili dnevniki `solve()`.
- **Shramba:** imena težavnosti so shranjena v zbirki, filtrih, izvozu in banki vaj; imena tehnik samo v izvozu.
  Staro »Ekstrem« se preslika ob branju zbirke, filtrov in uvoza, staro »Veriga ene števke« ob uvozu; banka vaj se
  ustvari znova z orodjem (razdelek 3).
- **Številke tehnik** niso shranjene nikjer; 11a ne doda nobene nove dobesedne številke – razponi se izpeljejo iz
  podatkov. Kar je zapisano dobesedno, je popisano za 11b (razdelek 4).

## 1. Popis mest, ki se spremenijo

Številke vrstic so iz izhodišča. »Samodejno« pomeni, da se besedilo spremeni samo, ker ga da edini vir (`imeTehnike()`,
`STOPNJE_UGANK`, `TEZAVNOSTI`) – mesta ni treba urejati, preveriti pa ga je treba.

### 1.1 Ime 9: »Veriga ene števke« → »Kratka X-veriga« (korak 1)

| Datoteka | Mesto | Zdaj | Potem |
|---|---|---|---|
| `shared/engine.js:865` | `TEHNIKE_OPISI['turbot-fish'].ime` | Veriga ene števke | Kratka X-veriga |
| `shared/engine.js:432–434` | sporočilo koraka (`patternName`) | »tvori vzorec Nebotičnik (Skyscraper, veriga ene števke)«, »… Zmaj z dvema vrvicama (2-String Kite, veriga ene števke)«, »tvori verigo ene števke (Turbot Fish)« | »… (Skyscraper, kratka X-veriga)«, »… (2-String Kite, kratka X-veriga)«, »tvori kratko X-verigo (Turbot Fish)« |
| `shared/generator.js:108–109` | `opis`, `opisIskanja` stopnje Težka | »… mečarica, veriga ene števke, W-krilo …« | »… mečarica, kratka X-veriga, W-krilo …« (besedilo še v 1.5) |
| `trening/generators.js:783, 1159` | `unitLabel` vaje 9 | »Veriga ene števke: 5« | »Kratka X-veriga za števko 5« (kot »X-krilo za števko 5«, »Mečarica za števko 5«) |
| `trening/v-uganki.js:131` | `VADI_TOZILNIK` (»poišči …«) | verigo ene števke | kratko X-verigo (`VADI_ZENSKI` ostane – ženski spol) |
| `trening/trening.js:1141` | napaka v »Spoznaj« | »To še ni veljavna veriga ene števke.« | »To še ni veljavna kratka X-veriga.« |
| `trening/index.html:86` | naslov kartice (nadomestek) | Veriga ene števke (Turbot Fish) | Kratka X-veriga (Turbot Fish) |
| `shared/zbirka.js:218` | komentar | »9 Veriga ene števke …« | »9 Kratka X-veriga …« |

Samodejno (iz `imeTehnike()`): naslov kartice v treningu, kazalo, vrh vaje, oznaka in naslov koraka v reševalcu in
igri (»9 · Kratka X-veriga«), povzetek v reševalcu, »Tehnike: … 9 Kratka X-veriga« v zbirki, kartici »Uganka« in pri
primerih (»P_10 · 9 Kratka X-veriga«), filter Tehnika, izvoz (»Kratka X-veriga 2«), Pomoč, `aria-label` sheme
(»Shema vzorca: Kratka X-veriga – Nebotičnik (Skyscraper)«), vprašanje pred odhodom iz kroga.

Brez spremembe (preverjeno): `povzetek`, `razlaga`, `posledica`, `navodilo` pri 9 imena ne omenjajo; namig
(`stepHint`) je »Števka 5.«; besedila sheme (`shared/sheme.js`) imajo samo podtipa (Nebotičnik, Zmaj); `variant`
`'Skyscraper'`/`'Two-String Kite'` in ključ `'Turbot Fish'` sta notranja.

Komentarji z »veriga ene števke« (`trening/generators.js:1284`, `tests/trening-xy-chain.test.js:69` ipd.) se popravijo
sproti. Testi in dokumenti: razdelka 5 in 6.

### 1.2 Ime 11: »XY-krilo (XY-Wing, Y-Wing)« → »XY-krilo (XY-Wing)« (korak 1)

| Datoteka | Mesto | Sprememba |
|---|---|---|
| `shared/engine.js:882` | `TEHNIKE_OPISI['xy-wing'].anglesko` | `'XY-Wing, Y-Wing'` → `'XY-Wing'` |
| `trening/index.html:96` | naslov kartice (nadomestek) | »XY-krilo (XY-Wing)« |
| `shared/zbirka.js:587` | komentar (izvoz brez angleškega imena zaradi vejice) | razlog posodobljen (vejica je v dodatnih imenih, ne v imenu) |

Y-Wing ostane samo kot dodatno angleško ime v Pomoči (1.3).

### 1.3 Dodatna angleška imena – samo v Pomoči (korak 1)

- `shared/engine.js`, `TEHNIKE_OPISI`: novo neobvezno polje **`drugaAngleska`** (seznam): `pointing` ['Pointing'],
  `box-line` ['Claiming', 'Box/Line Intersection'], `turbot-fish` ['Skyscraper', '2-String Kite'], `xy-wing`
  ['Y-Wing']. Edini vir (pravilo »besedila tehnik samo `TEHNIKE_OPISI`«).
- `shared/pomoc.js`, `izrisiTehnike()`: pri teh štirih tehnikah pod imenom vrstica (oblika – O3). Velja v vseh treh
  aplikacijah (razdelek »Tehnike« je skupen).
- Ne v `imeTehnike()`, kazalu, karticah, oznaki koraka ali izvozu.

### 1.4 »Ekstrem« → »Ekstremna« (korak 1)

| Datoteka | Mesto | Sprememba |
|---|---|---|
| `shared/generator.js:119` | `STOPNJE_UGANK[4].ime` | `'Ekstremna'`; **`kljuc: 'ekstrem'` ostane** (shramba `sudoku.igra.stopnja`, `tools/ustvari-uganko.js ekstrem`) |
| `shared/generator.js` | `STOPNJE_UGANK` | novo polje `anglesko` (Easy, Medium, Hard, Very Hard, Extreme) – za značke (1.5); opisi 1.5; komentarji 31, 44, 52 |
| `shared/zbirka.js:25` | `TEZAVNOSTI` | `'Ekstremna'` (ostale nespremenjene) |
| `shared/zbirka.js:30–46` | `STARE_TEZAVNOSTI`, `zbirkaTezavnost()` | `'Ekstrem': 'Ekstremna'`; komentar »Stari "Ekstrem" … ostane« zamenjan |
| `shared/zbirka.js:1137–1146` | `zbirkaFiltriBeri()` | shranjena težavnost filtra se preslika (`STARE_TEZAVNOSTI`) – sicer bi filter »Ekstrem« ob odprtju okna izginil |
| `shared/zbirka.js:132` | `PRIMERI` P_15 `tezavnost` | `'Ekstremna'` – iz izpisa `tools/izberi-primere.js` (5) |
| `shared/zbirka-ui.js:183` | razred značke po težavnosti | ključ `'Ekstremna'`; razred `t-expert znacka-ekstrem` ostane |
| `shared/vaje-banka.js` | 50 zapisov `stopnja: 'Ekstrem'` | banka znova z orodjem (3, 5) |
| `igra/index.html:208, 212, 222` | Pomoč igre | »ekstrem« / »Ekstrem« → »ekstremna« / »Ekstremna« |
| `tools/izberi-primere.js:157–174` | `'Ekstrem'` dobesedno | ime iz `stopnjaUganke('ekstrem').ime` |
| komentarji | `shared/zbirka.css:33`, `shared/base.css:37`, `shared/pomoc.js:212`, `igra/igra.js:1064`, `shared/vaje-uganka.js:271` | ime posodobljeno |

Samodejno (iz `STOPNJE_UGANK.ime` in `TEZAVNOSTI`): gumbi stopenj in njihov namig v »Nova uganka«, sporočilo »Ustvarjena
uganka stopnje »Ekstremna««, seznama stopenj v Pomoči igre in reševalca (»ekstremna potrebuje …«), značka v zbirki in v
kartici »Uganka«, filter in razvrščanje »Težavnost«, ročna izbira težavnosti v reševalcu, skupine primerov (»Ekstremna
· tehnika«), »Oceni zbirko« (staro → novo), stopnja uganke v »Vadi v uganki«, izvoz (`- **Težavnost:** Ekstremna`).

Ostane: imena testnih ugank `oakever-ekstrem-*` (naslovi v `docs/uganke.md` – testi jih iščejo po imenu), vir »Oakever,
Ekstrem (Lv4)« (ime težavnosti druge aplikacije), poved `OPIS_STROZJEGA_ISKANJA` (»… zelo težki in ekstremni …« že
ustreza).

### 1.5 »napredna«, »ekspertna«, »raven« v besedilih za uporabnika (korak 1)

Odločitev 1.1: izraza »napredna« in »ekspertna« ostaneta samo v kodi. Predlagana besedila (končno obliko preverijo
`besedila-html`, `locila`, `izrazi`; O5):

| Datoteka | Mesto | Zdaj | Potem |
|---|---|---|---|
| `trening/index.html:35–106` | značke kartic (nadomestek) | LAHKA, SREDNJA, NAPREDNA ×6, EKSPERTNA | LAHKA (EASY), SREDNJA (MEDIUM), TEŽKA (HARD), EKSTREMNA (EXTREME) |
| `trening/trening.js:58–59` | besedilo značke | `raven.toUpperCase()` | iz težavnosti tehnike (spodaj); razred `badge-<raven>` ostane |
| `trening/index.html:152` | Pomoč treninga | »Značka na kartici pove raven tehnike.« | »Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje.« (odločitev ob potrditvi – ne »… v kateri se pojavi«: tehnika 1 se pojavi tudi v težkih ugankah) |
| `shared/pomoc.js:157` | uvod razdelka »Tehnike« (vse tri aplikacije) | »Tehnike so v štirih ravneh: lahke (E1, E2), srednje (1–6), napredne (7–12) in ekspertne (13) – … Stopnja uganke je raven njene najtežje tehnike.« | »Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje: lahka (E1–E2), srednja (1–6), težka (7–12) in ekstremna (13). Težavnost uganke je težavnost njene najtežje tehnike. Zelo težka je uganka, ki potrebuje vsaj dve različni tehniki 7–12.« (izvedba: razpon dveh tehnik z – kot pri 13–14 v 11b; brez omembe treninga, ker razdelek vidijo vse tri aplikacije) – razponi izpeljani iz `RAVNI_TEHNIK` in `oznakaTehnike()` (11b dobi »13–14« sam) |
| `shared/pomoc.js:172–174` | značka pri tehniki | besedilo ravni (»napredna«) | ista značka kot na kartici (»TEŽKA (HARD)«) |
| `shared/generator.js:108–109` | Težka | »brez napredne tehnike (7–12 – …) ne gre, ena zadošča« | »brez tehnike 7–12 (X-krilo, mečarica, kratka X-veriga, W-krilo, XY-krilo, edinstveni pravokotnik) ne gre, ena zadošča« (`opisIskanja` enako + »; poleg nje vsaj dve srednji …«) |
| `shared/generator.js:115–116` | Zelo težka | »ena napredna tehnika ne zadošča – potrebuje vsaj dve različni« | »ena tehnika 7–12 ne zadošča – potrebuje vsaj dve različni« (+ »in vsaj dve srednji«) |
| `shared/generator.js:123–124` | Ekstremna | »potrebuje ekspertno tehniko (13 – XY-veriga)« | »potrebuje tehniko 13 (XY-veriga)« (+ »in vsaj dve srednji«) |
| `igra/index.html:202` | Pomoč igre, »Uganka v seznamu« | »… tehnike poti z eno samo napredno tehniko (prvo po vrstnem redu, ki zadošča)« | »… tehnike poti z eno samo tehniko 7–12 (prvo po vrstnem redu, ki zadošča)« |
| `igra/index.html:208` | Pomoč igre, »Nova uganka« | »Stopnjo določa najtežja raven tehnik, brez katere uganke ni mogoče rešiti; …« | »Stopnjo določajo tehnike, brez katerih uganke ni mogoče rešiti; …« |
| `igra/index.html:210`, `app/index.html:133` | Pomoč | »… dve napredni, čeprav zadošča ena« | »… dve tehniki 7–12, čeprav zadošča ena« |
| `igra/index.html:237` | okno »Nova uganka« | »Stopnjo določa najtežja raven tehnik, ki jih uganka potrebuje:« | »Stopnjo določajo tehnike, ki jih uganka potrebuje:« |
| `app/index.html:131` | Pomoč reševalca | »Težavnost uganke je najtežja raven tehnik, brez katere …« | »Težavnost uganke določajo tehnike, brez katerih uganke ni mogoče rešiti:« |

Težavnost tehnike: v `shared/generator.js` nova `tezavnostTehnike(kljuc)` (vnos `STOPNJE_UGANK`, izpeljan iz ravni kot
`stopnjaTehnike()` v `shared/vaje-uganka.js`, ki ostane) in `napisTezavnosti(stopnja)` (»Težka (Hard)«); značka je
napis z velikimi črkami. Vse tri aplikacije naložijo `generator.js` pred `pomoc.js` in `navigacija.js` (preverjeno).

Ostane v kodi: `RAVNI_TEHNIK`, `ravenTehnike()`, `GEN_NAPREDNE`/`GEN_EKSPERTNE`, mere `napredne`/`ekspertne`, razredi
`t-advanced`, `t-expert`, `badge-napredna`, `badge-ekspertna`. »Srednja« in »lahka« sta hkrati težavnost, zato
ostaneta.

### 1.6 Skupine, kazalo, naslovi skupin, vrh vaje (korak 2)

| Datoteka | Sprememba |
|---|---|
| `shared/engine.js` | `SKUPINE_TEHNIK` (razdelek 2), `skupinaTehnike(kljuc)`, `imeSkupine(skupina, { stevilke })` – »Podmnožice (Subsets)«, s številkami »Podmnožice (Subsets) · 3–6«, »Enojčki (Singles) · E1–E2«, »Edinstvenost (Uniqueness) · 12« (razpon iz `oznakaTehnike()` prve in zadnje tehnike) |
| `shared/navigacija.js` | `kazaloTehnik()` po skupinah; `izrisiKazaloTehnik()` ima eno obliko za trening in Pomoč – za vsako skupino naslov z značko težavnosti, pod njim vrstice (oznaka v barvi ravni, slovensko ime, angleško ime); dva stolpca: levo skupine težavnosti Lahka in Srednja (E1–6), desno Težka in Ekstremna (7–13, po 11b 7–14); možnost `imena` (vrstica samih oznak v Pomoči) odpade |
| `shared/base.css` | kazalo: dva stolpca, kadar je prostora za dva po 230 px (računalnik, okno Pomoč), sicer en (telefon); skupina ostane cela v svojem stolpcu; naslov skupine; pravila vrstice samih oznak (`.kazalo-tehnik button.tag`) odpadejo |
| `shared/pomoc.js` | kazalo v razdelku »Tehnike« z `izrisiKazaloTehnik()` v isti obliki; »↑ Tehnike« ostane (pogoj »okno je pod kazalom«), fokus na prvo vrstico kazala (`querySelector`, ne `children[0]` – prvi otrok je zdaj skupina); seznam tehnik pod kazalom dobi pred prvo tehniko vsake skupine naslov skupine (enako kot naslovi nad karticami v treningu – O7) |
| `shared/pomoc.css` | odmiki kazala v oknu (če so potrebni) |
| `trening/trening.js` | pred prvo kartico skupine naslov skupine (`h2`, »Podmnožice (Subsets) · 3–6«); `oznaciZadnjo()` po vrsticah `[data-kazalo]` (ne `children`); vrh vaje »Spoznaj«: vrstica skupine nad `ex-label` |
| `trening/v-uganki.js:150` | vrh vaje »Vadi v uganki«: vrstica skupine nad `ex-label` |
| `trening/trening.css` | naslov skupine nad karticami; vrstica skupine na vrhu vaje manjša in siva (`--pencil`) |

Vrh vaje (O4): »Podmnožice (Subsets)« (manjše, sivo), pod njo nespremenjena vrstica »6 · Skrita trojica (Hidden
Triple) · Vadi v uganki · Vaja 3 / 9« (v »Spoznaj« brez »· Vadi v uganki«).

### 1.7 Pomoč – kaj se spremeni v oknu

Razdelek »Tehnike« (`shared/pomoc.js`, vse tri aplikacije): uvod in stavek o Zelo težki (korak 1), značka težavnosti
pri tehniki (korak 1), dodatna angleška imena pri 1, 2, 9 in 11 (korak 1), kazalo v obliki treninga (korak 2). Besedila
v HTML: igra (»Ekstrem« trikrat, »raven« dvakrat, »napredno«/»napredni«), reševalec (»raven«, »napredni«), trening
(»značka pove raven«) – vse korak 1. Seznam tehnik pod kazalom dobi naslove skupin, enake naslovom nad karticami v
treningu (O7, korak 2).

## 2. Skupine za prikaz in `TECHNIQUE_GROUPS`

**Odločitev (O1): ločene.** `TECHNIQUE_GROUPS` ostane, kot je: enojčki · preseki · para · trojici · 7–12 · XY-veriga.

Zakaj: `TECHNIQUE_GROUPS` odloča, kje velja sidro na števko v `nextStep()` (isto zanko uporablja `solve()`). Skupine za
prikaz bi ga spremenile na dveh mestih:
- »Podmnožice« (3–6) združi para in trojici – sidro bi izbralo trojico s sidrno števko pred parom brez nje;
- 7–12 bi razpadle na tri skupine (Ribji vzorci, Kratke verige, Edinstvenost) – korak X-krila bi prehitel sidran korak
  kratke verige, ki ga zdaj izbere sidro.

To bi spremenilo dnevnike `solve()` in »Naslednji korak« v igri, s tem `tehnike` v zbirki, `docs/uganke.md` in oba
posnetka v `tests/posnetki/`. Ocena (`STOPNJE_UGANK`) je iz ravni in bi ostala, vendar zahteva naloge je, da se
obnašanje motorja ne spremeni.

**Oblika** (`shared/engine.js`, za `TECHNIQUE_GROUPS`):

```js
const SKUPINE_TEHNIK = [
  { kljuc: 'enojcki', ime: 'Enojčki', anglesko: 'Singles', tehnike: ['Gol enojček', 'Skriti enojček'] },
  { kljuc: 'preseki', ime: 'Preseki', anglesko: 'Intersections', tehnike: ['Pointing pair/triple', 'Box-line reduction'] },
  { kljuc: 'podmnozice', ime: 'Podmnožice', anglesko: 'Subsets', tehnike: ['Naked pair', 'Hidden pair', 'Naked triple', 'Hidden triple'] },
  { kljuc: 'ribe', ime: 'Ribji vzorci', anglesko: 'Fish', tehnike: ['X-Wing', 'Swordfish'] },
  { kljuc: 'kratke-verige', ime: 'Kratke verige', anglesko: 'Short Chains', tehnike: ['Turbot Fish', 'W-Wing', 'XY-Wing'] },
  { kljuc: 'edinstvenost', ime: 'Edinstvenost', anglesko: 'Uniqueness', tehnike: ['Unique Rectangle'] },
  { kljuc: 'dolge-verige', ime: 'Dolge verige', anglesko: 'Long Chains', tehnike: ['XY-Chain'] },
];
```

Težavnost skupine ni zapisana: izpelje se iz ravni njenih tehnik (`tezavnostTehnike()`, 1.5) – edini vir ostane
`RAVNI_TEHNIK`. Pravila (test): vsaka tehnika iz `ALL_TECHNIQUES` je v natanko eni skupini, skupine so zaporedni odseki
`ALL_TECHNIQUES` v vrstnem redu, vse tehnike skupine so v isti ravni, poskus s protislovjem ni v nobeni. Varovala, da se
motor ne spremeni: `TECHNIQUE_GROUPS` primerjan z zdajšnjim (nov test), `next-step`, `izris-korakov`, `stopnje-ugank`.

## 3. Kje se hranijo imena in »Ekstrem«

| Kje | Kaj je shranjeno | Ime ali ključ | Ukrep |
|---|---|---|---|
| `sudoku.zbirka.v1` | `tezavnost` | ime (»Ekstrem« mogoč) | preslika ob branju (`zbirkaBeri()` → `zbirkaTezavnost()` → `STARE_TEZAVNOSTI`); novo ime se zapiše ob naslednjem shranjevanju – kot pri »Začetnik« itd. |
| `sudoku.zbirka.v1` | `tehnike` | ključi `ALL_TECHNIQUES` | nič |
| `sudoku.zbirka.filtri` | `tezavnost`, `tehnika` | ime težavnosti, ključ tehnike | težavnost se preslika v `zbirkaFiltriBeri()`; tehnika nič |
| `sudoku.igra.stopnja` | izbrana stopnja generatorja | `kljuc` (`'ekstrem'`) | nič – ključ ostane |
| `sudoku.igra.v1`, `sudoku.igra.seznami`, `.kandidati`, `.poud`, `sudoku.trening.seznami` | igre, stikala, barve | brez imen | nič |
| `sudoku.trening.zadnja` | zadnja tehnika | način vaje (`turbot-fish`) | nič |
| izvoz/uvoz Markdown | `**Težavnost:**` | ime | uvoz preslika »Ekstrem« (`zbirkaTezavnost()`); naslov razdelka »### datum · Ekstrem« se ne bere |
| izvoz/uvoz Markdown | `**Tehnike:**` | slovensko ime brez oklepaja (»Veriga ene števke 2«) | uvoz bere nova imena in stare ključe; doda se preslikava starih slovenskih imen (`'Veriga ene števke'` → `'Turbot Fish'`, `shared/zbirka.js`, ob `zbirkaKljucTehnike()`) – sicer bi star izvoz dal neznano tehniko |
| `shared/vaje-banka.js` | `stopnja` | ime (50 × »Ekstrem«) | banka znova z `tools/ustvari-banko-vaj.js` (pravilo: datoteka se ne ureja ročno; sprememba `generator.js` spremeni njeno vsebino). Pričakovano: ista semena in danosti, razlika samo v imenu in datumu |
| `shared/zbirka.js` `PRIMERI` | `tezavnost` | ime (P_15) | iz izpisa `tools/izberi-primere.js` – pričakovano isti primeri |
| `docs/uganke.md` | – | nima polj `Težavnost` in `Tehnike` (polja so Danosti, Vir, Preverjeno, Zakaj je tu, Zgodovina, Značilnost) | uvoz ga bere, a imen ni; v opisih ugank besedilo »stopnja Ekstrem« → »stopnja Ekstremna« (4 mesta); imena ugank in »Oakever, Ekstrem« ostanejo |
| `tools/posnetki/igra-po-xy-veriga.json` | posnetek igre | »9 Veriga ene števke«, značka »Ekstrem« ×15 | novo izhodišče (5.5) |
| `tests/posnetki/stopnje-ugank.json` | zgoščene vrednosti dnevnikov | sporočila koraka 9 so v zgoščeni vrednosti | nov posnetek po preverjanju (5.5, O6) |
| `tests/posnetki/izris-korakov.json` | izris korakov | brez imen in sporočil | nič |

Opomba: »Ekstrem« je do 2026-09-24 pomenil ugibanje (zdaj »Presega tehnike«). Tak star zapis dobi ob branju
»Ekstremna«; kot doslej (zdaj ostane »Ekstrem«, enako netočen) ga popravi »Oceni zbirko«.

## 4. Priprava na 11b – kje je številka tehnike

**Edino mesto številke** je položaj v `TRENING_TEHNIKE` (`shared/engine.js`). Iz njega `oznakaTehnike()`,
`imeTehnike({ stevilka })`, `zbirkaKratkoImeTehnike()`, kazalo, `data-stevilka` kartic, napisi filtra Tehnika in
razponi iz 11a. **Številka ni shranjena nikjer** (razdelek 3: zbirka in filtri hranijo ključe, izvoz ime brez številke,
banka ključe, shranjena igra nič, `sudoku.trening.zadnja` način vaje, `docs/uganke.md` nima polja Tehnike).

**11a ne doda nove dobesedne številke:** uvod v Pomoči, naslovi skupin, kazalo in vrh vaje izpeljejo razpone iz
podatkov; novi testi berejo številke iz `TRENING_TEHNIKE` (npr. »zadnja skupina je Dolge verige z zadnjo tehniko«, ne
»13«).

**Dobesedno zapisano – 11b pregleda:**

| Kje | Kaj |
|---|---|
| `shared/generator.js` (po 11a) | `opis`/`opisIskanja` Ekstremne »tehniko 13 (XY-veriga)« → v 11b »13 ali 14 (X-veriga, XY-veriga)« |
| `trening/index.html:133, 145, 149` | Pomoč treninga »Pri 1–13« (trikrat) |
| `TEHNIKE_OPISI['xy-chain'].razlaga` | »XY-krilo (11)« – ostane (11 se ne premakne) |
| komentarji | `shared/engine.js:690, 732, 761, 896`; `shared/generator.js:31, 64`; `shared/pomoc.js:33, 147–153`; `shared/navigacija.js:7`; `shared/sheme.js:1, 229, 297`; `shared/zbirka.js:82–84`; `shared/base.css:196, 213`; `trening/generators.js:562, 622–624, 734–738, 1285, 1499`; `trening/trening.js:1328` |
| testi z »13«/»1–13«/»15 tehnik« | `besedila-html`, `igra-ui`, `odgovor-spoznaj.js`, `pomoc`, `ravni-tehnik`, `sheme`, `trening-izbris`, `trening-meni`, `trening-po-shemi.js`, `trening-shema-vaja`, `trening-stikalo`, `trening-tehnike`, `veriga-prikaz`, `xy-chain`, `pocasni/generator`, `pocasni/stopnje-ugank` |
| scenariji | `odgovor-spoznaj-`, `preveri-enojcki-`, `-faza7-`, `-generator-`, `-izbris-`, `-naloga6b-`, `-navigacija-`, `-po-shemi-`, `-pomoc-`, `-pregled6-`, `-presek-`, `-primeri-`, `-veriga-`, `-vklop-brskalnik.js`; `tools/ustvari-uganko.js` (komentar) |
| dokumenti | `CLAUDE.md` (seznam in vrstni red tehnik, ravni), `docs/tehnike.md`, `docs/uganke.md` (pokritost), `docs/opis/*` |

**Vnosi X-verige v 11b** (izjema od »nova tehnika na konec«): `ALL_TECHNIQUES` pred `XY-Chain`, `RAVNI_TEHNIK.ekspertna`,
`TECHNIQUE_GROUPS` (skupina `['X-Chain', 'XY-Chain']`), `SKUPINE_TEHNIK` »Dolge verige«, `TRENING_TEHNIKE` pred
`xy-chain`, `TEHNIKE_OPISI`, `MODES`, kartica, shema; banka, primeri in semena znova. Desni stolpec kazala ima tedaj
osem vrstic (7–14). Način vaje XY-verige ostane `xy-chain`.

## 5. Testi

Najprej test, ki na stari kodi pade, nato sprememba. Hitri testi sproti, vsi pred vsakim commitom.

### 5.1 Korak 1 – novi testi (na stari kodi padejo)

- `tests/izrazi.test.js` – tri nova pravila za nize v JS in besedilo HTML: »kratka X-veriga«, ne »veriga ene števke«;
  »Ekstremna«, ne »Ekstrem« (cela beseda); brez »napredn…« in »ekspertn…«. Enobesedne nize (ključi) pravila že
  izpustijo (`jeBesedilo()`); izjema je samo niz razredov `'t-expert znacka-ekstrem'` v `shared/zbirka-ui.js`. Suho
  preverjanje na izhodišču: v JS in HTML pravila ujamejo natanko mesta iz 1.1, 1.4 in 1.5 in ta razred.
- `tests/trening-tehnike.test.js` – `imeTehnike('Turbot Fish')` = »Kratka X-veriga (Turbot Fish)«, `imeTehnike('XY-Wing')`
  = »XY-krilo (XY-Wing)«; značke kartic LAHKA (EASY) / SREDNJA (MEDIUM) / TEŽKA (HARD) / EKSTREMNA (EXTREME) iz
  `tezavnostTehnike()` (meje iz `RAVNI_TEHNIK`, ne dobesedno).
- `tests/zbirka-zapis.test.js` / `tests/zbirka-izvoz-uvoz.test.js` – star zapis v shrambi z »Ekstrem« se bere kot
  »Ekstremna«; uvoz »Težavnost: Ekstrem« → »Ekstremna«; uvoz »Tehnike: Veriga ene števke 2« → ključ `Turbot Fish`
  (prikaz »9 Kratka X-veriga«); `zbirkaFiltriBeri()` s shranjenim »Ekstrem« → »Ekstremna«.
- `tests/pomoc.test.js` – uvod brez ravni z razponi iz podatkov in stavkom o Zelo težki; značka pri tehniki je
  težavnost; dodatna angleška imena natanko pri 1, 2, 9, 11, nikjer drugje (ne v kazalu, ne na kartici).
- `tests/igra-ui.test.js` – opis Ekstremne v Pomoči; besedila Pomoči igre brez »raven«/»napredni«.

### 5.2 Korak 1 – spremenjena pričakovanja

`trening-tehnike` (219, 233, značke 87–93), `turbot-fish` (69, 82), `resevalec-koraki` (71), `zbirka-zapis` (62,
108–109, zapisi z »Ekstrem« v 167, 197, 467, 574, 754, 778), `igra-ui` (749, 793, 962), `ravni-tehnik` (78–81, 113),
`znacke-kontrast` (127–136), `trening-meni` (399, 408), `sheme` (321), `trening-shema-vaja` (130), `pomoc` (117, 127),
`pocasni/generator` (68–87, 541, 556), `pocasni/vaje-uganka` (478–484), `pocasni/stopnje-ugank` (46 in števila skupin
po novem posnetku); imena testov in komentarji z »verigo ene števke« in »Ekstrem«. Vsaka sprememba pričakovanja, ki je
tu ni, gre v poročilo koraka.

### 5.3 Korak 2 – novi testi

- `tests/skupine-tehnik.test.js` (nov, hiter): `SKUPINE_TEHNIK` – sedem skupin z imeni in angleškimi imeni iz odločitve,
  pravila iz razdelka 2, težavnost skupin (Lahka, Srednja, Srednja, Težka, Težka, Težka, Ekstremna), `imeSkupine()` z
  razponi (»E1–E2«, »1–2«, »3–6«, »7–8«, »9–11«, »12«, zadnja iz podatkov), `TECHNIQUE_GROUPS` nespremenjen.
- `tests/trening-meni.test.js` – naslov skupine pred prvo kartico vsake skupine (sedem, v vrstnem redu); kazalo po
  skupinah z naslovom in značko; dva stolpca – levo skupine Lahka in Srednja, desno Težka in Ekstremna; »zadnja«
  označi vrstico tudi v skupinah; slog: skupina se ne deli (`break-inside`), dva stolpca po 230 px.
- `tests/pomoc.test.js` – kazalo v Pomoči je iste oblike kot v treningu (isti razredi in vrstni red, iste vrstice),
  klik vrstice pomakne do tehnike, »↑ Tehnike« vrne h kazalu s fokusom na prvo vrstico; seznam tehnik ima pred prvo
  tehniko vsake skupine naslov skupine z istim besedilom kot naslov nad karticami v treningu (O7).
- vrh vaje (`tests/trening-meni.test.js` ali `tests/trening-tehnike.test.js`): vrstica skupine nad `ex-label` v
  »Spoznaj« in »Vadi v uganki«, tudi pri E1 in E2.

### 5.4 Korak 2 – spremenjena pričakovanja

`pomoc` (213–290: vrstica 15 oznak → kazalo z imeni; popravek A), `trening-meni` (328–470: možnost `imena` odpade,
vrstice v skupinah, slog stolpcev), `navigacija` (če preverja kazalo).

### 5.5 Posnetki in orodja (korak 1)

- **Banka vaj:** `node tools/ustvari-banko-vaj.js` (pribl. 27 min, v ozadju takoj po spremembi `shared/generator.js`),
  nato `node tools/izberi-vaje-po-shemi.js --zapisi` (pričakovano brez spremembe) in `node tools/izberi-primere.js`
  (pričakovano isti primeri, P_15 »Ekstremna«). Razlika banke se preveri (samo `stopnja` in glava).
- **Posnetek igre:** `--primerjaj tools/posnetki/igra-po-xy-veriga.json` – razlike smejo biti samo »9 Veriga ene
  števke« → »9 Kratka X-veriga« in »Ekstrem« → »Ekstremna«; nato novo izhodišče
  `tools/posnetki/igra-po-naloga11a.json` (`--shrani`) in pot v `CLAUDE.md`. Korak 2 se primerja z njim (enako).
- **`tests/posnetki/stopnje-ugank.json`** (O6): pred `node tests/stopnje-ugank.js --shrani` skripta v začasni mapi
  izračuna vse uganke starega posnetka z novo kodo, v sporočilih zamenja novo ime 9 s starim in primerja – razlik ne
  sme biti (težavnost, tehnike poti, mesto poskusa, dnevnik). Šele nato nov posnetek; test dobi nova števila skupin
  (banka 397, primeri 16) in »Ekstremna« namesto »Ekstrem«.

### 5.6 Scenarij naloge v brskalniku

`tools/preveri-naloga11a-brskalnik.js --korak 1|2` (nov, po vzoru `tools/preveri-niz-brskalnik.js`), pri 375 in
1280 px, brez vodoravnega preliva:
- **korak 1:** imena 9 in 11 na kartici, v kazalu, v koraku reševalca in igre; značke kartic in Pomoči; uvod in stavek o
  Zelo težki v Pomoči vseh treh aplikacij; dodatna angleška imena samo v Pomoči; »Nova uganka«: pet gumbov z
  »Ekstremna«, pri 1280 v eni vrstici; značka »Ekstremna« turkizna v zbirki; stara shramba (»Ekstrem«, filter
  »Ekstrem«) in uvoz starega izvoza (»Ekstrem«, »Veriga ene števke 2«) pokažeta nova imena;
- **korak 2:** meni treninga – kazalo pri 1280 v dveh stolpcih (levo E1–6, desno 7–13), pri 375 v enem, nobena skupina
  ni razdeljena; naslov skupine nad prvo kartico vsake skupine; okno Pomoč v vseh treh aplikacijah – kazalo iste
  oblike kot v treningu (pri 1280 dva stolpca v oknu, pri 375 en), klik vrstice, »↑ Tehnike«, naslovi skupin v seznamu
  tehnik; vrh vaje – vrstica
  skupine manjša in siva od `ex-label` (izračunan slog) v »Spoznaj« in »Vadi v uganki«; posnetki zaslona v
  `docs/slike/naloga11a/` za poročilo (niso primerjalne slike).

### 5.7 Stari scenariji (samo področja naloge)

Korak 1: `preveri-generator-`, `-primeri-`, `-faza7-`, `-vklop-`, `-naloga6b-`, `-pomoc-`, `-naloga10-brskalnik.js`.
Korak 2: `preveri-navigacija-`, `-naloga6b-`, `-pomoc-`, `-pregled6-`, `-vklop-`, `-sheme-`, `-po-shemi-`,
`-vadi-brskalnik.js`. Padec zaradi namerne spremembe (staro ime, stara oblika kazala) → posodobim pričakovanje v
scenariju in zapišem v poročilo; drugačen padec → ustavim se.

## 6. Koraki

Po vsakem koraku: vsi testi, commit (oznaka različice s hookom), push, nov pogovor. Brez ustavljanja znotraj koraka,
razen ob nepričakovani težavi.

### Korak 1 – imena in težavnost

1. Testi iz 5.1 (padejo na stari kodi).
2. `shared/engine.js` (1.1, 1.2, 1.3), `shared/generator.js` (1.4, 1.5 – ime, `anglesko`, opisi, `tezavnostTehnike()`,
   `napisTezavnosti()`) – takoj nato banka v ozadju (5.5).
3. `shared/zbirka.js`, `shared/zbirka-ui.js` (1.4, 3), `shared/pomoc.js` (uvod, značka, dodatna imena),
   `trening/trening.js`, `trening/generators.js`, `trening/v-uganki.js`, `trening/index.html`, `igra/index.html`,
   `app/index.html`, komentarji; `tools/izberi-primere.js`.
4. Pričakovanja testov (5.2), orodja in posnetki (5.5), scenarij `--korak 1` in stari scenariji (5.6, 5.7).
5. Opisi: `docs/opis/motor.md`, `stanje-zbirka.md`, `trening.md`, `skupni-prikaz.md`, `igra.md`, `resevalec.md`,
   `testi.md`, `orodja.md`; `CLAUDE.md` (seznam tehnik v »O projektu«, vrstni red, pot posnetka igre); `docs/tehnike.md`
   (imena, dodatna angleška imena); `docs/uganke.md` (»stopnja Ekstremna«).

### Korak 2 – skupine in prikaz, zaključek

1. Testi iz 5.3.
2. `shared/engine.js` (`SKUPINE_TEHNIK`), `shared/navigacija.js`, `shared/base.css`, `shared/pomoc.js`/`pomoc.css`,
   `trening/trening.js`, `trening/v-uganki.js`, `trening/trening.css` (1.6). Banka se ne ustvari znova – skupine za
   prikaz ne vplivajo na motor (varuje `pocasni/vaje-banka`).
3. Pričakovanja (5.4), posnetek igre (enak izhodišču koraka 1), scenarij `--korak 2` in stari scenariji (5.6, 5.7).
4. Zaključek: opisi; `CLAUDE.md` (Arhitektura – `SKUPINE_TEHNIK` med vnosi nove tehnike in edini vir imena skupine;
   zemljevid `engine.js`); `docs/uskladitev.md` (1.1 in 1.3 narejeno, vrstica 11a, naslednja 11b);
   `docs/rocni-test.md` (razdelek »Naloga 11a«); `docs/opis/dokumenti.md`.
5. Poročilo in ročni pregled (razdelek 8).

## 7. Odprta vprašanja

- **O1 – skupine za prikaz in `TECHNIQUE_GROUPS`.** A: ločeni (`SKUPINE_TEHNIK` za prikaz, `TECHNIQUE_GROUPS` ostane);
  B: skupine za prikaz zamenjajo `TECHNIQUE_GROUPS`. **Priporočam A** – B spremeni dnevnike `solve()` in »Naslednji
  korak« (razdelek 2).
- **O2 – kje je angleško ime težavnosti v oklepaju.** A: samo pri tehnikah in skupinah – značke na karticah, značka pri
  tehniki v Pomoči, značka pri skupini v kazalu; zbirka (značka, filter), kartica »Uganka«, gumbi v »Nova uganka« in
  seznami stopenj ostanejo samo slovensko do naloge 11 (preklop jezika); B: povsod, kjer je težavnost. **Priporočam
  A** – 1.1 našteje značke tehnik in skupine; v zbirki bi oklepaj podaljšal značko in vsako možnost filtra (»Težka
  (Hard) (4)«).
- **O3 – oblika dodatnih angleških imen v Pomoči.** Polje `drugaAngleska` v `TEHNIKE_OPISI`; v Pomoči pod imenom
  tehnike siva vrstica »Druga angleška imena: Claiming, Box/Line Intersection«. **Priporočam tako.**
- **O4 – vrh vaje.** Nad zdajšnjo vrstico samo ime skupine brez razpona (»Podmnožice (Subsets)«); vrstica pod njo ostane,
  kot je – s »· Vaja 3 / 9« in pripisom po shemi; v »Spoznaj« brez »· Spoznaj«. **Priporočam tako.**
- **O5 – »raven«, »napredna«, »ekspertna« v besedilih za uporabnika.** Zamenjam jih povsod, kjer jih uporabnik vidi
  (opisi stopenj, Pomoč vseh treh aplikacij, okno »Nova uganka«) z besedili iz 1.5 in dodam pravilo v
  `tests/izrazi.test.js`. **Priporočam tako**; če želiš kako besedilo drugače, ga popravim ob potrditvi.
- **O6 – posnetek `stopnje-ugank`.** Sporočilo koraka 9 je v zgoščeni vrednosti dnevnika, zato test po spremembi pade.
  A: nov posnetek z `--shrani` po preverjanju iz 5.5 (posnetek zajame zdajšnjo banko in primere, test dobi nova
  števila); B: v `tests/stopnje-ugank.js` možnost, ki ohrani seznam ugank starega posnetka in izračuna samo vrednosti.
  **Priporočam A** – manj kode, preverjanje dokaže, da se je spremenilo samo besedilo.
- **O7 – seznam tehnik v Pomoči pod kazalom.** Ostane brez naslovov skupin (skupine so v kazalu, vsaka tehnika ima
  značko). **Priporočam tako.**

**Odločitve ob potrditvi (2026-10-18):**
- **O1–O6:** po priporočilu.
- **O7 – drugače:** seznam tehnik v Pomoči pod kazalom dobi naslove skupin, enake naslovom nad karticami v treningu
  (»Podmnožice (Subsets) · 3–6«). Korak 2 (1.6, 5.3, 5.6).
- **Pomen značke (1.5):** besedilo je »Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje.«, ne »… v kateri
  se pojavi« (tehnika 1 se pojavi tudi v težkih ugankah). Velja za Pomoč treninga in uvod razdelka »Tehnike«; povzetek
  `docs/imena-tehnik.md` (razdelek 3) se popravi v koraku 1.
- **Scenarij koraka 1:** pri 375 px preveri, da se značka »EKSTREMNA (EXTREME)« na kartici treninga ne prelomi grdo
  (ostane v eni vrstici) in ne prekrije imena tehnike.
- Izvedba: samo korak 1, banka vaj v ozadju (5.5); ročnega pregleda po koraku 1 ni.

## 8. Ročni pregled (na koncu naloge, največ 5 točk)

Vse drugo preverijo testi, posnetek igre in scenarij pri 375 in 1280 px.

1. **Trening na telefonu** – meni: preleti kazalo in naslove skupin nad karticami, tapni nekaj vrstic kazala.
   Pričakovano: skupine so jasno ločene, berljive, dotik pripelje do kartice. *Ni samodejno:* presoja berljivosti in
   dotika na pravem zaslonu.
2. **Pomoč na računalniku** (trening in igra) – razdelek »Tehnike«. Pričakovano: kazalo enako kot v treningu, v dveh
   poravnanih stolpcih; dodatna angleška imena pri 1, 2, 9 in 11 se berejo kot pripis. *Ni samodejno:* scenarij
   preveri zgradbo in položaje, ne vtisa enakosti.
3. **Vrh vaje** (trening, »Spoznaj« in »Vadi v uganki«, npr. 6 · Skrita trojica) – Pričakovano: vrstica skupine je
   opazno podrejena imenu tehnike, a še berljiva. *Ni samodejno:* estetska presoja sivine in velikosti.
4. **Igra s tvojo pravo zbirko** – odpri »Zbirka ugank«. Pričakovano: uganke, ki so imele »Ekstrem«, imajo »Ekstremna«,
   filter Težavnost jih najde, shranjen filter ostane. *Ni samodejno:* scenarij dela s preskusno shrambo, ne s tvojim
   brskalnikom.
5. **Besedila** – preberi uvod razdelka »Tehnike« (stavek o Zelo težki), opise stopenj v »Nova uganka« in sporočilo
   koraka 9 v reševalcu. Pričakovano: naravna slovenščina, brez »napredna«/»ekspertna«. *Ni samodejno:* jezikovna
   presoja.

## 9. Opaženo, ni del naloge

- `tests/pocasni/stopnje-ugank.test.js` preverja števila skupin posnetka iz časa pred XY-verigo (banka 356, primeri 15)
  – posnetek je zdaj starejši od banke in primerov; v 11a se uredi z O6.

## 10. Izvedba koraka 2 (2026-10-18) in odstopanja

Narejeno po 1.6, 5.3–5.7. Odstopanja in pojasnila:

- **Stolpca kazala sta elementa** (`div.kazalo-stolpec`, mreža `repeat(auto-fit, minmax(230px, 1fr))`), ne `columns`
  z `break-inside` (5.3) – tako je razdelitev levo Lahka in Srednja, desno Težka in Ekstremna zagotovljena, skupina pa
  se ne more razdeliti. Test preverja mrežo namesto `break-inside`.
- **Naslov skupine v seznamu tehnik v Pomoči** (O7) je `h4.tehnike-skupina` v vrstici `li` prve tehnike skupine, ne
  samostojna postavka seznama – seznam ima še vedno 15 vrstic (scenariji in testi štejejo `ul.tehnike > li`), pomik iz
  kazala na prvo tehniko skupine pokaže tudi naslov.
- `izrisiKazaloTehnik()` vrne gumbe vrstic; `oznaciZadnjo()` gre po njih (namesto `[data-kazalo]` iz 1.6).
- **Nadomestni DOM** (`tests/dom-stub.js`): `appendChild()` element, ki je že otrok, premakne (kot brskalnik) – trening
  preuredi kartice menija; brez tega bi bila kartica v testu dvakrat.
- **Dodatno (opažanje ob izvedbi):** Pomoč treninga – stavek »Oznake so iste kot v igri in reševalcu …« preoblikovan v
  »Z istimi oznakami so naštete tehnike, ki jih uganka potrebuje – npr. …« (brez omembe drugih aplikacij; nov test v
  `tests/trening-meni.test.js`).
- **Stari scenariji** – padci zaradi namernih sprememb, pričakovanja posodobljena: `preveri-navigacija-` (vrstice
  kazala v skupinah, v Pomoči brez `title`; pri telefonu je kazalo višje od okna – pred dotikom gre na sredino vrstica;
  izhodišče oken D1 `cb19f46`, ker je korak 1 namerno spremenil »Ekstremna«, ime 9 in opise stopenj), `-naloga6b-`
  (vrstice kazala; izhodišči okna Pomoč nastavljeni na commit koraka 2), `-pregled6-` (zastarel od koraka 1: pripis
  drugih angleških imen ni odstavek razlage, besedilo »tehnika 7–12«), `-vadi-`, `-enojcki-`, `-izbris-`, `-presek-`,
  `-izbira-` (nova vrstica `.ex-skupina` izvzeta kot `.ex-label`; v `tools/primerjava-slogov.js` znane razlike imen 9
  in 11 ter besedila koraka 9 iz koraka 1 – ti scenariji v koraku 1 niso tekli; v `-izbira-` je `.ex-skupina` dodana še med besedila, skrita pred meritvijo prekrivanja na pikslih – sicer bi necel zamik mreže, 18,25 px, spremenil glajenje robov). `-pomoc-`, `-vklop-`, `-sheme-`, `-po-shemi-` brez spremembe.
- `tests/trening-po-shemi.js` (vzorec začetka vaje) in `tests/pocasni/trening-uganka-ui.test.js` (vrstica skupine po
  izrisu vaje) – pričakovanje z novo vrstico `.ex-skupina`.

## 11. Popravki po ročnem pregledu (2026-10-19)

Ročni pregled koraka 2: točke 2, 4 in 5 razdelka 8 so v redu; popravka P1 in P2 (točki 1 in 3), P3 je opažanje ob
izvedbi koraka 2. Naslovi skupin nad karticami ostanejo, kot so (z razponom).

- **P1 – izbira v kazalu treninga.** Kartica, do katere pomakne vrstica kazala, dobi razred `izbrana`: debela navpična
  črta na levi v turkizni barvi gumba »Vadi v uganki« (`--teal`) – senca `inset 5px 0 0` (sledi zaobljenemu robu,
  vsebina se ne premakne). Postavi jo samo klik/dotik vrstice kazala, ostane, dokler v kazalu ne izbereš druge
  (začetek vaje in »Nazaj na izbiro« je ne spremenita); se ne shrani (ob ponovnem odprtju strani je ni). Črta ostane
  tudi pod miško in ob modrem okviru `zadnja` (»nazadnje vadena« – ta ostane, kot je): pravili `izbrana:hover` in
  `izbrana.zadnja` združita obe senci. Vrstica kazala se ne spremeni.
- **P2 – vrh vaje.** Vrstica skupine (`.ex-skupina`) ostane manjša (12,5 px), barva kot opis (`--ink2`, prej
  `--pencil`), krepkost 700 (prej 600). Nov test kontrasta v `tests/trening-kontrast.test.js`: vsaj 4,5 : 1 na podlagi
  kartice in strani, manjša od `.ex-label`.
- **P3 – posnetki scenarija izbrisa.** `tools/preveri-izbris-brskalnik.js` piše posnetke privzeto v `--mapa`
  (začasna mapa), ne v `docs/slike/izbris/`; nova možnost `--slike <mapa>` (npr. `docs/slike/izbris`, kadar se
  posnetki za pregled namerno zapišejo na novo). Posnetki v `docs/slike/izbris/` ostanejo nespremenjeni.

Testi (najprej padejo na stari kodi): `tests/trening-kontrast.test.js` (P2), `tests/trening-meni.test.js` (P1 – razred
`izbrana` ob kliku vrstice, samo ena kartica, ostane ob vaji in vrnitvi, ne shrani se; slog; pričakovanje `.ex-skupina`
→ `--ink2`, 700). Scenarij `tools/preveri-naloga11a-brskalnik.js --korak 2` pri 375 in 1280 px: izračunan slog črte
(senca s `--teal`, 5 px) na izbrani kartici, premik na drugo kartico, črta ob modrem okviru `zadnja` in pod miško,
po vaji in »Nazaj na izbiro«; vrh vaje `--ink2`, 700, manjša. Stari scenariji področja: `preveri-naloga6b-` (okvir
`zadnja`), `-navigacija-` (klik kazala), `-izbris-` (P3). Posnetek igre (igra se ne spremeni) – enak izhodišču.
Ročni pregled: samo P1 in P2 (`docs/rocni-test.md`, »Naloga 11a – popravki«).
