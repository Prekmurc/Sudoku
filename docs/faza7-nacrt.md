# Faza 7 – ostanek skupne kode – načrt

Načrt 2026-10-07 (vir: `docs/uskladitev.md`, tabela »Vrstni red popravkov«, vrstica 7, in »Vrstni red
po fazi 6«, naloga 3; točke 6.5, 6.6, 6.7, 6.10, ostanek 1.1 in ostanek 6.8). **Potrjeno 2026-10-07** (odločitve in dopolnitve na koncu razdelka 5).

Izhodišče: commit `2fdb542` (zadnji commit aplikacije pred fazo 7), vseh 557 testov je zelenih
(`node --test "tests/**/*.test.js"`, 2 min 24 s). Skupna vnosna mreža (6.4 in vnosna mreža iz 6.8)
ni v tej fazi – od 2026-10-04 je v nalogi 9 (povezave).

## 1. Obseg

| Točka | Kaj | Datoteke | Vidno za uporabnika |
|---|---|---|---|
| 6.7 | ena funkcija za sklanjanje po številu namesto šestih lastnih | `shared/engine.js`, `shared/zbirka.js`, `shared/vaje-uganka.js`, `igra/igra.js`, `trening/v-uganki.js` | nič |
| 6.6 | eno besedilo vzroka »nima rešitve / ima več kot eno rešitev / enoličnosti ni bilo mogoče preveriti« | `shared/engine.js`, `igra/igra.js` | **da – pet besedil v igri** (O1) |
| 6.5 | vezava gumbov »Izvozi«/»Uvozi« na DOM enkrat namesto dvakrat | `shared/zbirka-ui.js`, `app/zbirka.js`, `igra/igra.js` | nič |
| 6.8 | okno zbirke v reševalcu na skupnih razredih `.dialog` | `app/index.html`, `app/app.css`, `app/zbirka.js` | **2 px** v glavi okna (O2) |
| 1.1 | raven kot podatek tehnike, `tagClass()` iz ravni namesto iz imen | `shared/engine.js`, `shared/generator.js`, `shared/pomoc.js`, `trening/trening.js` | nič |
| 6.10 | ena pomožna funkcija za zagon delavca z nadomestno potjo | `igra/igra.js` | nič – **predlagam izpust** (razdelek 4) |

Poleg tega se ob vsakem commitu aplikacije osveži oznaka različice na dnu okna Pomoč (pre-commit hook) –
to ni sprememba videza.

## 2. Točke

### 6.7 Sklanjanje po številu (korak 1)

**Zdaj.** Šest funkcij ima vsaka svoje pravilo 1 / 2 / 3–4 / 5+:

| Funkcija | Datoteka | Primer |
|---|---|---|
| `zbirkaStKorakov` | `shared/zbirka.js` | »42 korakov« v kartici zbirke |
| `stUgank` | `igra/igra.js` | »Ocenjeno: 5 ugank« |
| `stepHint` (pri golem enojčku) | `shared/engine.js` | »V mreži sta 2 celici z enim samim kandidatom.« |
| `steviloIzbrisov`, `manjkaIzbrisov` | `shared/vaje-uganka.js` | »manjkata še 2 izbrisa« |
| `celicZEnoStevko` | `shared/vaje-uganka.js` | namig E1 »… so 3 celice, v katerih …« |
| `prejOdstranjenihBesedilo` | `trening/v-uganki.js` | »Prejšnji koraki so že izbrisali 5 kandidatov …« |

Mesto `trening/trening.js:693` iz uskladitve ne obstaja več (namig zdaj piše »3×«).

**Predlog.** `sklanjaj(n, [ena, dve, triStiri, pet])` v `shared/engine.js` (naložen v vseh treh
aplikacijah in obeh delavcih) – oblika po `n % 100`; uporaba `${n} ${sklanjaj(n, ['korak', 'koraka',
'koraki', 'korakov'])}`, glagol `sklanjaj(n, ['je', 'sta', 'so', 'je'])`.

**Ne spreminjam** (niso pravilo števila, poenotenje bi spremenilo besedilo): `glagolManjka` v
`shared/mreza.js` (»manjkajo 1, 5, 7, 8, 9« – ujemanje z naštetimi števkami, tudi pri petih),
`manjkaStevk` v `shared/vaje-uganka.js` (pri 1–4 brez števila), `zbirkaNeveljavniZnaki` (seznam do
osem znakov), `shemaNapisCrk` v `shared/sheme.js`, sporočila korakov s `size === 2` (par / trojica) in
besedila vaj 3–6 v `trening/trening.js`.

**Za uporabnika:** nič. `stepHint` in `celicZEnoStevko` zdaj ne računata `% 100` – razlika bi bila
samo pri 0 in pri 101 ali več celicah, česar ni (korak ima vsaj eno celico, mreža 81).

**Tveganje:** napačna oblika v kakem sporočilu (npr. »2 koraki«). **Test pred spremembo:**
`tests/sklanjanje.test.js` – vsaka od šestih funkcij pri n = 0–25 in 99–125, pričakovane oblike
zapisane po pravilu slovnice (ne prepisane iz kode); na stari kodi mora biti zelen. Ujamejo tudi
obstoječi `zbirka-zapis` (kartica), `next-step` (namigi), `tests/pocasni/vaje-uganka` in
`trening-uganka-ui` (»manjka še N izbrisov«, prej odstranjeni), `trening-enojcki` (namigi E1).

**Izvedeno 2026-10-07** (korak 1). Test preveri `stepHint` in `celicZEnoStevko` pri n = 1–81 (ne
0–25 in 99–125) – to sta števili celic v mreži, kot pove odstavek »Za uporabnika« zgoraj; tako je
bil test zasnovan pred zagonom. Na stari kodi zelen (6 testov), po spremembi prav tako; posnetek igre
brez razlik.

### 6.6 Sporočila o številu rešitev (korak 2)

**Zdaj.** Isti trije primeri (0 / več / `'unknown'`) so v igri trikrat z različnim besedilom, v
reševalcu četrtič:

| Kje | 0 rešitev | več rešitev | `'unknown'` |
|---|---|---|---|
| igra, zbirka, »Igraj« (uvožena uganka) | Te uganke ni mogoče igrati: nima rešitve. | … ima več kot eno rešitev. | … enoličnosti ni bilo mogoče preveriti v razumnem času. |
| igra, »Nova uganka«, »Začni igro« | Uganka nima rešitve – preveri dane števke. | Uganka ima več kot eno rešitev – za igro potrebujem uganko z natanko eno rešitvijo. | Enoličnosti ni bilo mogoče preveriti v razumnem času, zato uganke ne morem ponuditi za igro. |
| igra, vrstica ocene v seznamu (`opisResitev`) | · nima rešitve | · več kot ena rešitev | · enoličnosti ni bilo mogoče preveriti |
| reševalec, »Reši« | Uganka nima rešitve – preveri vnesene števke. | Uganka nima natanko ene rešitve … prikazana rešitev je le ena od možnih, tehnika 12 … ni bila uporabljena. | Enoličnosti … tehnika 12 … prikazana rešitev morda ni edina. |

**Predlog.** `opisSteviloResitev(n)` v `shared/engine.js` pod `countSolutions()` → `''` (1),
`'nima rešitve'`, `'ima več kot eno rešitev'`, `'enoličnosti ni bilo mogoče preveriti v razumnem
času'`. V igri vsa tri mesta (`opisResitev` odpade):

| Kje | Novo |
|---|---|
| »Igraj« | enako kot zdaj |
| »Nova uganka« | »Te uganke ni mogoče igrati: nima rešitve – preveri dane števke.« / »… ima več kot eno rešitev.« / »… enoličnosti ni bilo mogoče preveriti v razumnem času.« |
| vrstica ocene | »· ima več kot eno rešitev«, »· enoličnosti ni bilo mogoče preveriti v razumnem času« (»· nima rešitve« ostane) |

**Reševalec ostane**: njegova sporočila povedo nekaj drugega (rešitev je kljub temu prikazana, tehnika
12 izpuščena) in jih preverja `tests/niz-danosti.test.js`.

**Za uporabnika:** pet besedil v igri (O1).

**Tveganje:** napačno besedilo ali napačen primer (npr. `'unknown'` kot »več rešitev«). **Test pred
spremembo** (`tests/igra-ui.test.js`; teh sporočil zdaj ne preverja noben test): »Začni igro« in
»Igraj« uvožene uganke z uganko brez rešitve in z več rešitvami (izpelje ju program iz uganke v
`docs/uganke.md` s `countSolutions()`, kot v `niz-danosti.test.js`), `'unknown'` z nadomestnim
`countSolutions` v kontekstu; vrstica ocene po »Oceni zbirko« (v nadomestnem DOM-u delavec ne obstaja,
ocena teče v glavni niti). Test najprej z današnjimi besedili, v koraku nato z novimi.

**Izvedeno 2026-10-07** (korak 2). Trije testi v `tests/igra-ui.test.js` (»6.6: …«, vsak čez vse tri
primere); na stari kodi zeleni, po spremembi prav tako (spremenjena je samo tabela pričakovanih
besedil). Nadomestni DOM je dobil `insertBefore()` (vrstica ocene ga uporablja – prej je ni preverjal
noben test). Posnetek igre brez razlik (scenarij teh sporočil ne doseže). D1: nov scenarij
`tools/preveri-faza7-brskalnik.js` pri 320 in 375 px – vrstica ocene in sporočilo »Začni igro« v
kartici oziroma oknu, brez preliva; najdaljša vrstica ocene ima pri 320 px tri vrstice, pri 375 px dve.

### 6.5 Gumba »Izvozi« in »Uvozi« (korak 3)

**Zdaj.** Logika je že skupna (`zbirkaIzvozi()`, `zbirkaUvozi()`, `zbirkaPrenesi()` v
`shared/zbirka.js`); podvojena je vezava na DOM – po pribl. 20 vrstic v `app/zbirka.js:150–169` in
`igra/igra.js:720–744` (klik, izbira datoteke, `text()`, ponastavitev `value`, napaka branja). Razlika
je samo, kaj se osveži po uvozu.

**Predlog.** `zbirkaPoveziIzvozUvoz({ izvozi, uvozi, datoteka, status, poUvozu })` v
`shared/zbirka-ui.js` (datoteka z DOM-om, naložena v obeh aplikacijah – ne v `shared/zbirka.js`, ki ga
nalaga tudi `igra/oceni-worker.js`). `status` je v obeh aplikacijah že `zbirkaStatus(besedilo,
napaka)`; `poUvozu` v reševalcu osveži seznam, števec in vrstico »Shranjeno v zbirko«, v igri seznam,
števec in kartico odprte uganke. Onemogočenost gumbov med ocenjevanjem v igri ostane, kot je.

**Za uporabnika:** nič.

**Tveganje:** uvoz v pravem brskalniku ne dela (`files`, `text()`, ponoven izbor iste datoteke) ali se
po uvozu kaj ne osveži. **Test pred spremembo:** nov `tests/zbirka-izvoz-uvoz.test.js`, za reševalec
in igro: izvoz prazne zbirke (sporočilo, brez prenosa), izvoz (prenos z besedilom `zbirkaIzvozi()`),
»Uvozi« odpre izbiro datoteke, uvoz (sporočilo, seznam in števec osveženi, `value` prazen), ista
datoteka znova, datoteka brez ugank, napaka branja, brez datoteke; v igri še opomba odprte uganke v
kartici »Uganka«. Nadomestni DOM dobi `click()` na elementu (zdaj ga nima – klic `.click()` bi v testu
padel). **Brskalnik:** `tools/brskalnik.js` dobi izbiro datoteke (`DOM.setFileInputFiles`) in prenos v
mapo (`Browser.setDownloadBehavior`) – O7; scenarij izvozi, izbriše in uvozi v obeh aplikacijah.

**Izvedeno 2026-10-07** (korak 3). `zbirkaPoveziIzvozUvoz()` v `shared/zbirka-ui.js`, `app/zbirka.js` in
`igra/igra.js` jo pokličeta s svojim `poUvozu` (reševalec: seznam, števec, vrstica »Shranjeno v
zbirko«; igra: seznam, števec, kartica »Uganka«); konstanti gumbov v igri ostaneta za
`osveziOcenoGumbe()`. Nov `tests/zbirka-izvoz-uvoz.test.js` (17 testov, za reševalec in igro vse
naštete točke, še opomba odprte uganke v vrstici pod rešitvijo v reševalcu in onemogočena gumba med
ocenjevanjem v igri) je bil zelen na stari kodi in je po spremembi nespremenjen. Nadomestni DOM je dobil
`click()` (sproži dogodek click). `tools/brskalnik.js`: `izberiDatoteko(izbirnik, poti)` (pravi klik
mora odpreti izbirnik – `Page.setInterceptFileChooserDialog`, `Page.fileChooserOpened`,
`DOM.setFileInputFiles`) in `prenos(izbirnik)` (`Browser.setDownloadBehavior`, vrne ime, pot in
besedilo). Scenarij koraka 3 pri 375 in 1280 px v obeh aplikacijah (pravi kliki, pravo okno confirm pri
»Izbriši vse«) in enak na izhodišču `2fdb542`: opažanja enaka. Posnetek igre brez razlik.

### 6.8 Okno zbirke v reševalcu (korak 4)

**Zdaj.** Okno Pomoč je od faze 6 v `shared/pomoc.css` (`.dialog`), okno zbirke v reševalcu pa ima
lastne sloge v `app/app.css` in se odpira z `style.display`:

| Reševalec (`app/app.css`) | Skupno (`shared/pomoc.css`) | Razlika |
|---|---|---|
| `#library` | `.dialog` | enako |
| `.lib-panel` | `.dialog-panel` | enako |
| `.lib-header` | `.dialog-glava` | odmik pod glavo 12 px → 10 px |
| `.lib-header h2`, `#libClose` | `.dialog-glava h2`, `.dialog-zapri` | enako |
| `.lib-tools`, `.lib-status` | (igra: `.dialog-gumbi`, `.dialog-status` v `igra/igra.css`) | drugi odmiki, status v igri siv, v reševalcu zelen – ostaneta (O3) |

**Predlog.** V `app/index.html` okno dobi razrede `dialog`, `dialog-panel`, `dialog-glava`,
`dialog-zapri` (id-ji ostanejo – uporabljajo jih `app/zbirka.js`, testi in scenariji); iz
`app/app.css` odpade pet pravil; `app/zbirka.js` odpira in zapira z razredom `odprt` (tri mesta:
odpri/zapri, Escape, osvežitev odprtega seznama ob dogodku `storage`).

**Za uporabnika:** odmik med naslovom »Zbirka ugank« in opisom 2 px manjši, kot v igri (O2).

**Tveganje:** okno se ne odpre ali ne zapre (preostal `style.display` povozi razred), drugačen videz
(testi CSS ne vidijo), Escape zapre napačno okno. **Test pred spremembo:** `tests/app-zbirka.test.js`
– odpiranje in zapiranje (✕, klik ob panelu, ne v panelu, Escape, Escape pri zaprtem oknu) in
osvežitev odprtega seznama, s pomožno funkcijo »okno je odprto«, ki se v koraku zamenja (ena vrstica).
**Brskalnik:** posnetek odprtega okna (z ugankami in statusom) pri 320, 375 in 1280 px primerjan po
pikslih z izhodiščem `2fdb542` (izvleček z `git archive`, kot v `preveri-izbira-brskalnik.js`) ter
izračunani slogi in položaji vseh elementov okna (`razlikeIzrisa()`); dovoljena je samo razlika
v glavi (O2). Nato še `preveri-videz-brskalnik.js` (okno pokrije zaslon, brez preliva; izbirnik
`.lib-panel` odpade, `.dialog-panel` je že na seznamu) in `preveri-pomoc-brskalnik.js` (Pomoč v
reševalcu je isti razred).

**Izvedeno 2026-10-07** (korak 4). `app/index.html`: okno ima razrede `dialog`, `dialog-panel`,
`dialog-glava`, `dialog-zapri` (id-ji ostanejo); `app/app.css`: odpadlo je pet pravil (`#library`,
`.lib-panel`, `.lib-header`, `.lib-header h2`, `#libClose`), `.lib-tools` in `.lib-status` ostaneta (O3);
`app/zbirka.js`: razred `odprt` na vseh treh mestih (`zbirkaOdpri()`/`zbirkaZapri()`, Escape, osvežitev
ob dogodku `storage` – `zbirkaOdprta()`), `style.display` pri oknu ni več. `tests/app-zbirka.test.js`
dobi tri teste (odpiranje in zapiranje – ✕, klik v panelu in ob njem, Escape, Escape pri zaprtem oknu,
prazna vrstica statusa ob odprtju; Escape ne zapre povečanega prikaza in ne odpre Pomoči, Pomoč se
odpira in zapira; osvežitev odprtega seznama, zaprtega ne) s pomožno funkcijo `oknoOdprto()` – zeleni
na stari kodi, po spremembi zamenjana samo ta vrstica. **Brskalnik** (`preveri-faza7-brskalnik.js
--korak 4`) pri 320, 375 in 1280 px: odprto okno z dvema ugankama in zelenim statusom (pravi klik na
»Zbirka« in »Izvozi«) primerjano z izhodiščem `2fdb542` na dva načina – (1) izhodišče z O2 (dodan
`.lib-header{margin-bottom:10px}`) je novemu enako v drevesu (28 elementov), v vseh izračunanih
lastnostih vseh elementov (razen `-webkit-tap-highlight-color`, ki ga ne nastavi noben slog – privzeta
vrednost brskalnika je odvisna od prejšnjega posnemanja telefona), v položajih in do piksla; (2) izhodišče brez O2 se razlikuje samo v
`margin-bottom` glave in višini panela, ki iz njega sledi, elementi pod glavo so 2 px višje. Obnašanje
(14 opažanj: ✕, klik ob panelu, Escape, Escape pri povečanem prikazu, Pomoč) enako izhodišču. Glajenje
zaobljenega vogala panela se med dvema zagonoma brskalnika lahko razlikuje za 1–2 v kanalu tudi pri isti
kodi (preizkušeno), zato primerjava v kvadratu 10 × 10 px tega vogala dopusti razliko do 2.
`preveri-videz-brskalnik.js` (izbirnik `.lib-panel` odstranjen) in `preveri-pomoc-brskalnik.js`: vse drži.
Posnetek igre brez razlik.

### 1.1 Raven kot podatek tehnike (korak 5)

**Zdaj.** Raven je zapisana na štirih mestih: `GEN_LAHKE` … `GEN_EKSPERTNE` v `shared/generator.js`
(stopnje ugank), meje v `TECHNIQUE_GROUPS` (indeksi 0 / 1–3 / 4), `tagClass()` po imenih (`includes('pair')`,
`'Coloring'` …) in značke v `trening/index.html`; `shared/pomoc.js` ime ravni izpelje iz razreda
(`POMOC_RAVNI`).

**Predlog.**
- `shared/engine.js`: `RAVNI_TEHNIK` (`lahka`, `srednja`, `napredna`, `ekspertna` – ključi
  `ALL_TECHNIQUES` v vrstnem redu tehnik; ekspertna prazna) in `ravenTehnike(kljuc)` → ključ ravni ali
  `null` (poskus, `OBSTALO`, `NAPAKA`, neznano).
- `tagClass()`: poskus `t-chain`, ravni `t-single` / `t-pair` / `t-advanced`, drugo `t-basic` (kot
  zdaj). Barva ekspertne ravni pride z XY-verigo (naloga 4).
- `shared/generator.js`: `GEN_LAHKE = RAVNI_TEHNIK.lahka` itd. – imena ostanejo (uporabljajo jih
  `tools/izberi-primere.js` in testi); `GEN_PRESEKI`/`GEN_PARI`/`GEN_TROJICE` (ožje delitve za
  `strogoSrednja`) ostanejo, test preveri, da so skupaj srednja raven.
- `shared/pomoc.js`: značka ravni iz `ravenTehnike()`.
- `trening/trening.js`: značke na karticah iz `ravenTehnike()`, kot že naslov in povzetek (HTML ostane
  nadomestek, test preveri enakost) – O4; ob XY-verigi se tako doda samo raven.
- `TECHNIQUE_GROUPS` ostane (sidranje); test preveri, da je vsaka skupina v eni ravni.

**Za uporabnika:** nič.

**Tveganje:** drugačna raven ali **drugačen vrstni red** v ravni spremeni oceno ugank (`genMerePoti()`
preizkuša napredne po vrsti – »prva, ki zadošča«), s tem težavnost v zbirki, vgrajene primere, banko
vaj in »Tehnike:« pri težkih ugankah. Ujamejo `tests/pocasni/generator.test.js` (vsaka tehnika v
natanko eni ravni, ocena ugank iz `docs/uganke.md`, primeri, »prva po vrstnem redu, ki zadošča«) in
`tests/pocasni/vaje-banka.test.js` (stopnja in tehnike vsakega zapisa). **Test pred spremembo:**
`tagClass()` za vse ključe, ki jih da `solve()` (14 tehnik – pričakovano po tabeli ravni, ne po kodi –,
poskus nov in star z oznako celice, `OBSTALO`, `NAPAKA`, neznan ključ); ravni v vrstnem redu
`ALL_TECHNIQUES`. **Primerjava:** `tools/ustvari-banko-vaj.js` v ozadju (pribl. 27 min) – nova
datoteka mora biti enaka obstoječi razen datuma (O5). **Brskalnik:** značke v treningu in Pomoči
(besedilo in izračunan slog) enake izhodišču; posnetek igre `--primerjaj` (oznaka koraka).

### 6.10 Nadomestna pot za Web Worker (predlagam izpust)

**Zdaj.** V `igra/igra.js` sta dva podobna bloka (pribl. 25 vrstic): »Oceni zbirko« (`oceni-worker.js`,
`ocenjevanjeVGlavniNiti`) in »Ustvari uganko« (`generator-worker.js`, `iskanjeVGlavniNiti`). Vzorec je
isti, stanje pa ne (iskanje ima uro `tiktak` in mejo, ocenjevanje seznam ugank).

**Predlog iz uskladitve:** `zazeniDelavca(url, sporocilo, korakVGlavniNiti, obSporocilu)`; že tam
»nizka prednost – podvojitev je znotraj ene aplikacije«.

**Za izpust:** nobena od obeh poti nima testa; nadomestna pot teče samo pri `file://`, pravi delavec
samo v brskalniku. Pred spremembo bi bilo treba napisati teste za štiri poti (delavec, napaka delavca,
izjema ob ustvarjanju, prekinitev) in scenarij v brskalniku – več dela kot sama sprememba, korist pa
je pribl. 20 vrstic v eni datoteki. Če ga vseeno želiš (O6), gre kot korak 6, zadnji.

## 3. Koraki

Vsak korak je svoj commit in push; zaključek (7) ni svoj pogovor – sledi koraku 5 v istem pogovoru (D2). Vrstni red od najmanj do najbolj tveganega.

| Korak | Točka | Tveganje | Test pred spremembo | Preverjanje |
|---|---|---|---|---|
| 1 | 6.7 sklanjanje | nizko – besedila, natančno preverljiva | `tests/sklanjanje.test.js` | hitri; `vaje-uganka`, `trening-uganka-ui`, `trening-enojcki`; posnetek igre |
| 2 | 6.6 sporočila | nizko – besedila (vidna po O1) | `igra-ui`: »Začni igro«, »Igraj«, vrstica ocene | hitri; posnetek igre |
| 3 | 6.5 izvoz/uvoz | nizko–srednje – izbira datoteke v pravem brskalniku | `tests/zbirka-izvoz-uvoz.test.js` | hitri; `zbirka-skupna`; brskalnik (izbira datoteke in prenos) |
| 4 | 6.8 okno zbirke | srednje – CSS, testi ga ne vidijo | `app-zbirka`: odpiranje, zapiranje, osvežitev | brskalnik: primerjava z izhodiščem po pikslih in slogih; `preveri-videz`, `preveri-pomoc` |
| 5 | 1.1 ravni | srednje – ocena ugank, banka vaj | `tagClass()` za vse ključe, ravni | vsi testi; banka vaj za primerjavo (O5); brskalnik: značke; posnetek igre |
| (6) | 6.10 | samo po O6 | štiri poti delavca | brskalnik: »Ustvari uganko«, »Oceni zbirko« |
| 7 | zaključek | – | – | ročni pregled (razdelek 7), `docs/uskladitev.md`, `docs/rocni-test.md` |

**V vsakem koraku:**
1. Test pred spremembo napišem in poženem na **stari** kodi – mora biti zelen (v poročilu povem).
2. Sprememba; hitri testi sproti, počasni s področja koraka.
3. Pred commitom vsi testi, posnetek igre (`node tools/posnetek-igre.js --primerjaj
   tools/posnetki/igra-po-polna.json` – pričakujem brez razlik, pri koraku 2 razlike samo v naštetih
   besedilih, če jih scenarij doseže) in scenarij brskalnika.
4. `CLAUDE.md` (opis nove funkcije in spremenjenih datotek) in stanje točke v `docs/uskladitev.md`.
5. Commit (oznaka različice se osveži sama) in push.

Brskalnik: nov scenarij `tools/preveri-faza7-brskalnik.js`, ki raste po korakih (3: izvoz/uvoz, 4: okno
zbirke, 5: značke), z izhodiščem `2fdb542` (`--izhodisce`). Korakoma 1 in 2 brskalnik ni potreben –
spremenita samo besedila, ki jih preverijo testi.

## 4. Kaj izpustim ali prestavim

- **6.10 (zagon delavca)** – izpust (razdelek 2, O6). V `docs/uskladitev.md` bi ga zapisal kot »ne bo
  narejeno – korist ne odtehta tveganja«.
- **6.6 v reševalcu** – sporočila ostanejo (povedo drugo kot v igri).
- **6.8 vrstica gumbov in statusa v reševalcu** – ostaneta (O3); poenotenje z igro bi spremenilo barvo
  statusa in odmike.
- **6.7 naštevanja** (`glagolManjka`, `manjkaStevk`, neveljavni znaki, sheme, par/trojica) – ostanejo.
- **1.1 barva ekspertne ravni** – prestavim na XY-verigo (naloga 4), ko bo kaj obarvati.
- **`zbirkaPrenesi()`** ostane v `shared/zbirka.js` (selitev v `zbirka-ui.js` ni del točke).

## 5. Odločitve zate

| # | Vprašanje | Moj predlog |
|---|---|---|
| O1 | 6.6: poenotim besedila v igri (pet besedil se spremeni, razdelek 2)? | **Da**, reševalec ostane. Brez tega točka nima smisla – razvrstitev v tri primere je že zdaj ena vrstica. |
| O2 | 6.8: odmik pod glavo okna zbirke v reševalcu 12 → 10 px (kot v igri)? | **Da** – 2 px, okno je potem enako oknu v igri. Druga možnost: izjema v `app/app.css` (ostane 12 px). |
| O3 | 6.8: vrstica gumbov in zeleni status v reševalcu ostaneta, kot sta? | **Da** – poenotenje z igro je vidna sprememba, ni del točke. |
| O4 | 1.1: značke v treningu izpolni `trening.js` iz ravni (HTML ostane nadomestek)? | **Da** – kot naslov in povzetek kartice; ob XY-verigi samo vnos ravni. |
| O5 | 1.1: banko vaj ustvarim znova? | **Samo za primerjavo** – orodje poženem v ozadju (27 min); če je datoteka enaka razen datuma, je ne zapišem; če ni, se ustavim in vprašam. Pri korakih 1 in 2 (samo besedilne funkcije v `engine.js`) brez tega – zadošča `vaje-banka.test.js`. |
| O6 | 6.10: izpustim? | **Da** (razdelek 2). |
| O7 | 6.5: `tools/brskalnik.js` dobi izbiro datoteke in prenos (prek protokola DevTools, brez odvisnosti)? | **Da** – sicer je izvoz/uvoz v pravem brskalniku samo ročna točka. |

### Odločitve (Darko, 2026-10-07)

O1 da. O2 da. O3 da. O4 da. O5 da, samo za primerjavo. O6 da – 6.10 se izpusti (korak 6 odpade). O7 da.

### Dopolnitve (Darko, 2026-10-07)

- **D1 – korak 2:** vrstica ocene v seznamu dobi daljše besedilo (»· enoličnosti ni bilo mogoče preveriti
  v razumnem času«). V brskalniku pri 320 in 375 px preverim, da se prelomi brez vodoravnega preliva.
- **D2 – zaključek:** ni svoj pogovor. Po koraku 5 zapišem ročni seznam (razdelek 7) v
  `docs/rocni-test.md` in počakam na Darkov pregled; fazo zaprem v istem pogovoru.
- **D3 – ustavitev:** če test pred spremembo na stari kodi ni zelen ali primerjava (posnetek igre,
  brskalnik, banka vaj) pokaže nepričakovano razliko, se ustavim in poročam. Testa ne prilagajam.

## 6. Kaj ujame avtomatika in česa ne

| Kaj se lahko pokvari | Ujame |
|---|---|
| oblika besede pri številu | `tests/sklanjanje.test.js` (nov), obstoječi testi besedil |
| besedilo ali primer pri številu rešitev | `tests/igra-ui.test.js` (nov del), `tests/niz-danosti.test.js` (reševalec ostane) |
| uvoz/izvoz – logika in osvežitev | `tests/zbirka-izvoz-uvoz.test.js` (nov), `tests/zbirka-zapis.test.js`, `tests/zbirka-skupna.test.js` |
| uvoz/izvoz – pravi brskalnik | scenarij (izbira datoteke in prenos prek DevTools) |
| odpiranje in zapiranje okna zbirke | `tests/app-zbirka.test.js` (nov del) |
| videz okna zbirke | scenarij: piksli in slogi proti izhodišču, `preveri-videz-brskalnik.js` |
| raven, ocena ugank, primeri, banka | `tests/pocasni/generator.test.js`, `tests/pocasni/vaje-banka.test.js`, primerjava banke |
| barva oznake koraka, značke | test `tagClass()` (nov), `tests/pomoc.test.js`, `tests/trening-tehnike.test.js`, scenarij, posnetek igre |

Ne ujame: sistemskega izbirnika datotek in prenosa na telefonu (brskalnik brez glave datoteko nastavi
neposredno), dotika in drsenja v pravem telefonu ter jezikovne presoje novih besedil.

## 7. Ročni pregled na koncu faze

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | reševalec in igra, telefon | »Zbirka« → »Izvozi«, nato »Uvozi« iste datoteke | datoteka se prenese; uvoz pove »že obstoječih brez sprememb: N« | brskalnik brez glave sistemskega izbirnika in prenosa na telefonu ne odpre |
| 2 | reševalec, telefon | »Zbirka« – odpri, drsi po seznamu, zapri s ✕ in s tapom ob oknu | kot prej in kot okno v igri | dotik in drsenje v pravem telefonu |
| 3 | igra, »Nova uganka« | vnesi eno samo števko in »Začni igro« | »Te uganke ni mogoče igrati: ima več kot eno rešitev.« – se dobro bere | test preveri, da je besedilo tako, kot je zapisano, ne kako se bere |
