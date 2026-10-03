# Faza 5 – videz (načrt)

**Stanje: načrt potrjen 2026-10-03, izvedba po korakih (razdelek 4).**

## Odgovori (2026-10-03)

1. Izbira celice: **A2**.
2. Razvrstitev točk potrjena: 4.6 v fazo 6, 4.3 v »Kasneje«, ostanek 1.1 v fazi 6 in 7.
3. Popravi se vse: P1–P6, R1, N1–N11.
4. Nadnaslov treninga: **»Trening · spoznaš in vadiš tehnike«**.
5. Posega zunaj CSS sta potrjena: niz velikosti celice v `app/app.js:201` in besedila pri N9.
6. Dopolnitev a): N9 je svoj commit, ločen od N10 in N11 (da se ga da razveljaviti samega).
7. Dopolnitev b): `container-type` naredi element za okvir elementov s `position: fixed`
   med potomci (zadrževanje postavitve). Preveri se, da noben tak element (povečan prikaz,
   okna) ni potomec vsebnika – sicer gre vsebnik na ožji element (ovoj mreže). Scenarij
   odpre povečan prikaz in vsa okna in preveri, da pokrijejo celo okno. **Preverjeno:**
   elementi s `position: fixed` so `#lightbox` (z gumbom in namigom) in `#library` v
   reševalcu ter `.dialog` v igri – vsi so neposredni otroci `<body>`; trening jih nima.
   Vsebniki (kartice reševalca, ovoj male mreže koraka, kartica vaje v treningu) jih zato
   nimajo med potomci.
8. Ročni pregled: en sam, na koncu, največ 5 točk (razdelek 5).

Naloga 2026-10-03: (1) preliv vnosne mreže reševalca, (2) predlog za izbiro celice,
(3) ostale opombe za fazo 5, (4) pregled videza vseh treh aplikacij pri 375 in 1280 px.
Omejitve: samo CSS in postavitev, brez sprememb logike, motorja in shrambe, brez novih
funkcij (ideje v razdelek »Kasneje«). Popravim samo najdbe, ki jih potrdiš.

Izhodišče: commit `6bf0f6d`, testi 422/422. Meritve z `tools/brskalnik.js` (Edge brez glave)
pri 320, 375, 430 in 1280 px, v več stanjih vsake aplikacije: reševalec (prazen, s
kandidati, z rešitvijo, koraki in malimi mrežami, okno zbirke, povečan prikaz), igra
(prazna, uganka, vsi trije seznami, odprte »Barve poudarka«, okna Zbirka, Nova uganka,
Pomoč), trening (meni, »Spoznaj« vseh 14 tehnik, »Vadi v uganki« 3, 8 in E1). Posnetki so
v `docs/slike/faza5/`.

## 1. Obseg

Razdelek »Opombe k delom → Faza 5« v `docs/uskladitev.md` ima samo dve opombi – preliv
vnosne mreže (točka 1 naloge) in izbiro celice (točka 2). Točka 3 zato iz tega razdelka ne
prinese nič novega. Tabela faz pa fazi 5 pripisuje še točke 6.8, 4.1, 4.4, 4.2, 4.5, 4.6,
4.3 in 1.1. Razvrstil sem jih po omejitvah naloge:

| Točka | Kaj je | Predlog |
|---|---|---|
| 6.8 skupni CSS | podvojene barve, glava, gumbi, kartica, oznake korakov, noga | **v fazi 5** (najdbe N1–N7) – samo vidni del; okno in vnosna mreža nimata vidne razlike → faza 7 (skupaj s 6.4) |
| 4.1 paleta | trening ima druge vrednosti istih barv | **v fazi 5** (N1) |
| 4.2 podlaga, glava, kartica, noga | odločitev 2026-09-23: povsod bela podlaga | **v fazi 5** (N2–N4, N7) |
| 4.4 gumbi | trije različni slogi | **v fazi 5** (N6) |
| 4.5 barva danosti v reševalcu | modra je v reševalcu »dano«, v igri »moje« | **v fazi 5** (N9) – zraven gresta legenda in noga, ker opisujeta barvo |
| 4.6 ločila in narekovaji | »"Reši"«, » - « | **v fazo 6** – to so besedila v JS in HTML, ne CSS; faza 6 tako ali tako piše besedila pomoči |
| 4.3 navigacija med aplikacijami | povezave »Igra · Reševalec · Trening« | **Kasneje** – nova funkcija |
| 1.1 ostanek | značke ravni, `tagClass()` po ravneh, poved v pomoči igre | značke **v fazi 5** (N10, samo CSS); `tagClass()` barve že deli po ravneh (enojčka zeleno, 1–6 jantarno, 7–12 vijolično), preureditev kode → faza 7; poved v pomoči → faza 6 |

## 2. Najdbe

Pri vsaki najdbi je moje priporočilo. **Potrdi, katere popravim** (npr. »vse razen N8«).

### Prelivi (P)

| | 320 px | 375 px | 430 px | 1280 px |
|---|---|---|---|---|
| P1 vnosna mreža reševalca: čez kartico / širina strani | 25 px / 329 | 20 px / 379 | 16 px / – | 3 px / – |
| P2 mreža kandidatov reševalca: čez kartico na vsaki strani | 7 px | 6 px | 4 px | 1 px |
| P3 mreža rešitve reševalca: čez kartico na vsaki strani | 3 px | 1 px | – | – |
| P4 mala mreža koraka (»Pokaži na mreži«): širina strani | 362 | 411 | 458 | – |
| P5 igra, odprte »Barve poudarka«: širina strani | 336 | – | – | – |
| P6 trening 3–6, enota vrstica (9 celic v vrsti): čez kartico / širina strani | 15 px / 321 | 13 px / – | 12 px / – | – |

Vse drugo je brez preliva: igra pri vseh širinah in v vseh oknih, trening (meni, vse
vaje »Spoznaj« razen P6, »Vadi v uganki«), okno zbirke v reševalcu. Odrezanega besedila
(skrit preliv, tropičje) ni nikjer.

- **P1, P2, P3 – reševalec, vnosna mreža, kandidati, rešitev** (opomba 1; posnetek
  `preliv-resevalec-375.png`). Vzrok: velikost celice `--cs: min(10.2vw, 48px)` in `--ccs:
  min(10.5vw, 50px)` ne upošteva odmikov strani in kartice. **Predlog:** velikost celice iz
  širine kartice z enotami vsebnika – `.card{ container-type: inline-size }`, `--cs:
  min(calc(100cqi / 9), 48px)` (kandidati 50 px). Zakaj ne `vw`: mreža se ravna po pravi
  širini kartice, neodvisno od odmikov (ti se v N4 spremenijo) in od drsnika na namizju
  (brskalnik brez glave ga ne vidi). Brskalniki brez enot vsebnika (pred 2022/23) ostanejo
  pri današnjih vrednostih (`@supports`). Na namizju so celice pribl. 46 namesto 48 px, ker
  mreža zdaj ne sega čez kartico. **Priporočam: da.**
- **P4 – mala mreža v koraku** (`preliv-koraki-375.png`). Velikost celice nastavi `app.js`
  (`min(9.8vw, 42px)`), korak ima levo 42 px prostora za kljukico. **Predlog:** velikost iz
  širine vsebnika male mreže; vsebnik se razširi čez levi odmik koraka (simetrično z desnim),
  da so celice pri 375 px pribl. 31 px (brez razširitve 27 px; danes 37 px, a čez rob).
  Edina sprememba v JS: niz velikosti
  celice v `app/app.js:201` (konstanta postavitve, ne logika). Povečan prikaz (lightbox)
  ostane 48/52 px z lastnim drsnikom – tam je povečava namen. **Priporočam: da.**
- **P5 – igra, »Barve poudarka« pri 320 px.** Vrstica (gumbi 1–4, izbirnik, hex,
  »Privzeto«) je 340 px v plošči 284 px. **Predlog:** vrstica se prelomi (`flex-wrap`).
  **Priporočam: da.**
- **P6 – trening, »Spoznaj« 3–6** (`preliv-trening-3-375.png`). Devet celic v vrsti s
  `--cs: min(10.6vw, 46px)` je širših od kartice vaje. **Predlog:** `--cs` vrstice iz širine
  kartice vaje (enote vsebnika, kot P1). Celice so pri 375 px pribl. 32 px, pri 320 px
  pribl. 26 px. **Priporočam: da.**

Pogoj naloge »pri 320, 375 in 430 px ni vodoravnega preliva« zahteva vsaj P1, P4, P5 in P6
(ti razširijo stran); P2 in P3 segata samo čez kartico.

### Prelomi (R)

- **R1 – kljukici »več hkrati« in »več celic«** se pri 320–375 px prelomita v dve vrstici
  (»več / celic«; igra in trening, slog je v `shared/plosca.css`). **Predlog:** kljukica se
  ne prelomi (`white-space: nowrap`), prelomi se oznaka niza ob njej. **Priporočam: da.**

### Neskladja med aplikacijami (N)

Stanje:

| | Reševalec | Trening | Igra |
|---|---|---|---|
| podlaga | #E9EDF0 z mrežnim vzorcem | #EAEEF2 | #FFFFFF |
| barve | paleta A | druge vrednosti istih imen (`--ink` #1E2D3D, `--blue` #1758A8 …) | paleta A |
| sivo besedilo | #3C4854 | #4A5664 | #3C4854 |
| glava | nadnaslov, gumb »Zbirka«, h1 24 px, opis | brez nadnaslova, h1 22 px, opis | nadnaslov, trije gumbi, h1 24 px |
| odmik strani / kartice / razmik | 16 / 18 / 16 px | 14 / 18 / 16 px | 16 / 16 / 12 px |
| naslov kartice | »Rešitev« Source Serif 18 px, »Možni kandidati« in »Koraki reševanja« privzeti h2 brskalnika (Inter 24 px) | Source Serif 17 px | Source Serif 17 px |
| gumb | 11×16 px, `.primary` vedno raztegnjen, onemogočen brez sloga | `.pri` 11×20 brez obrobe, `.sm-btn`, `.back-btn`, `.nacin-btn` vsak svoj | 10×14 px, onemogočen 40 % |
| noga | levo | ni | sredinsko |
| pisave | s `preconnect` | brez `preconnect` | s `preconnect` |
| danosti | **modre** na modri podlagi, izpeljane črne | sive (umetne vaje), temne (mreža iz `shared/`) | **črne** krepke, vpisi modri |
| značke ravni / oznake korakov | oznake: 1–6 jantarno, 7–12 vijolično | značke: SREDNJA modro, NAPREDNA rdeče | oznake kot reševalec |

- **N1 – paleta (4.1, 6.8).** Ena paleta v `shared/base.css` (vrednosti reševalca in igre),
  dodatno `--ink2` (#3C4854) za sivo besedilo. Trening obdrži samo svoje barve tehnik
  (`--teal`, `--indigo`, `--cyan`, `--orange`, `--plum`, `--olive`); njegove skupne barve se
  malo spremenijo (npr. `--green` #1F7A56 → #2E7D5C). **Priporočam: da.**
- **N2 – bela podlaga (4.2, odločitev 2026-09-23).** Reševalec izgubi sivo podlago z
  mrežnim vzorcem, trening sivo. Kartice ostanejo sivkaste z obrobo, kot v igri.
  **Priporočam: da.**
- **N3 – glava (4.2).** Ista glava v vseh treh: nadnaslov, h1 24 px, gumbi desno, isti
  odmiki; gumb »Zbirka« v reševalcu dobi skupni slog gumbov v glavi (že danes enak).
  Trening dobi nadnaslov **»Trening · vadiš posamezne tehnike«** (predlog besedila –
  popravi, če želiš drugega). Širina ostane po aplikaciji (480 / 560 / 960 px).
  **Priporočam: da.**
- **N4 – kartica in odmiki (4.2).** Po vzoru igre: kartica 16 px odmika, 12 px razmika,
  odmik strani 16 px; v treningu enako za kartico vaje, kartice v meniju in vrstico
  rezultata. Mreže v treningu ostanejo enako velike (formula `--gs` odšteje isto vsoto).
  **Priporočam: da.**
- **N5 – naslovi kartic.** »Možni kandidati« in »Koraki reševanja« v reševalcu sta
  privzeta h2 brskalnika (`naslov-koraki-1280.png`). Povsod Source Serif 17 px.
  **Priporočam: da.**
- **N6 – gumbi (4.4).** Osnovni gumb, `.primary`, `.majhen` in onemogočen gumb v
  `shared/base.css` po vzoru igre. Reševalec: »Reši« ostane raztegnjen (pravilo vrstice, ne
  `.primary`). Trening: `.pri` (barve tehnik) iste velikosti kot `.primary`, `.sm-btn` kot
  `.majhen`, »Nazaj na izbiro« in gumba načina kot osnovni gumb; gumbi plošče v »Vadi v
  uganki« (Razveljavi …) ostanejo manjši, ker morajo pri 375 px v eno vrstico, dobijo pa isti
  onemogočeni slog. **Priporočam: da.**
- **N7 – noga (4.2).** Skupni slog (sredinsko, 12 px). Trening noge nima in je ne dobi (to
  bi bilo novo besedilo). **Priporočam: da.**
- **N8 – pisave.** Trening dobi `preconnect` kot drugi dve (pisava je ista, nalaganje
  hitrejše). **Priporočam: da.**
- **N9 – barva danosti v reševalcu (4.5).** Kot v igri: dana števka temna in krepka na beli
  podlagi, izpeljana modra – v vnosni mreži, rešitvi, kandidatih in mali mreži koraka.
  Ker besedila opisujejo barvo, se spremenijo legenda (»tvoj vnos / izpeljano« → »dana /
  izpeljana«), opomba pod kandidati (»Modra celica = tvoj vnos.«) in noga. **Priporočam: da.**
- **N10 – značke ravni v treningu (1.1).** SREDNJA jantarno, NAPREDNA vijolično (LAHKA ostane
  zelena) – iste barve kot oznake korakov v reševalcu in igri; rdeča ostane poskusu s
  protislovjem. Samo CSS. **Priporočam: da.**
- **N11 – okno zbirke.** Videz je že enak; razlika je vrstni red: reševalec ima gumbe nad
  opisom, igra opis nad gumbi. **Predlog:** reševalec kot igra (premik v HTML).
  **Priporočam: da** (majhno; če ne, ostane).

## 3. Odločitev: izbira celice (točka 2)

Danes (obe mreži sta iz `shared/mreza.js`):

- **igra:** siva podlaga (`--peer-bg`, ista kot vrstica, stolpec in blok izbrane celice) in
  2 px modra obroba z belim notranjim robom (`izbira-igra-zdaj.png`);
- **trening** (1, 2, E1, E2, »Vadi v uganki«): modrikasta podlaga (`--blue-bg`) in 3 px
  obroba, ker je bila izbira igre na manjših celicah s kandidati komaj opazna (ročni
  pregled 2026-09-28; `izbira-trening-zdaj.png`); izbira v treningu prekrije tudi oznake
  koraka;
- **reševalec:** nima izbire, ima fokus v vnosni mreži – modrikasta podlaga in 2 px modra
  obroba (`--blue`); vnosna mreža v oknu »Nova uganka« v igri enako.

Možnosti:

- **A2 – poenoti na izrazitejšo izbiro (priporočam).** Ena pravila v `shared/mreza.css`:
  modrikasta podlaga in 3 px obroba (#4A86D8, spremenljivki `--izbira` in `--izbira-bg`).
  Na poudarjeni celici (cela celica v barvi poudarka) ostane barva poudarka in obroba dobi
  bel notranji rob, kot ga ima igra danes – brez njega se obroba na 4. (modri) barvi
  poudarka skoraj zlije s podlago (dana 4 na modrem poudarku: `izbira-poud4-zdaj.png` igra
  danes, `izbira-poud4-a.png` 3 px brez roba, `izbira-poud4-a2.png` 3 px z robom). Oznake koraka (jantarno, rdečkasto, zeleno) imajo
  prednost pred podlago izbire, kot v igri danes – v treningu se to spremeni (zdaj izbira
  prekrije oznako, obroba ostane vidna v obeh primerih). Pravila treninga za izbiro
  odpadejo. Igra s to izbiro: `izbira-igra-a.png`.
  - Zakaj: v igri se izbrana celica od svoje vrstice, stolpca in bloka loči samo po tanki
    obrobi – na telefonu (celica pribl. 37 px, s kandidati) je enako slabo opazna kot je
    bila v treningu. Modrikasta podlaga je druge barve kot siva sosed. Ena izbira za vse
    mreže je preprostejša od dveh.
  - Za reševalec: fokus v vnosni mreži (in v vnosni mreži igre) dobi isti slog – modrikasto
    podlago že ima, obroba gre z 2 px `--blue` na 3 px `--izbira`. Na pogled skoraj enako,
    a iz istih spremenljivk. Druge mreže reševalca (rešitev, kandidati, koraki) izbire
    nimajo.
- **B – trening nazaj na videz igre** (`izbira-trening-b.png`): razveljavi ročno potrjeno
  odločitev 2026-09-28; na celicah 30 px je izbira slabše vidna.
- **C – razlika ostane** (manjše celice v treningu). Dve pravili za isto stvar.

## 4. Koraki izvedbe (po potrditvi)

Vsak korak: testi, posnetek igre, scenariji v brskalniku, `CLAUDE.md` (ustrezni odstavki),
commit in push. Korakov, ki jih ne potrdiš, ni.

1. **Prelivi** (P1–P6, R1) in nov scenarij `tools/preveri-videz-brskalnik.js`: vse tri
   aplikacije pri 320, 375, 430 in 1280 px v stanjih iz uvoda – `scrollWidth <=
   clientWidth` strani in odprtih oken, mreže v svoji kartici, brez napak JS (povečan prikaz
   je izvzet – namenoma ima drsnik).
2. **Izbira celice** po odločitvi. Scenarij preveri izračunani slog izbrane celice v igri,
   v treningu (1, E1, »Vadi v uganki«), na poudarjeni celici in fokus v vnosni mreži
   reševalca in igre.
3. **Skupni CSS:** a) paleta in podlaga (N1, N2, N8), b) glava, kartica, naslovi, gumbi,
   noga in oznake korakov (N3–N7). Iz `app.css`, `igra.css` in `trening.css` odpade
   podvojeno, ostane samo njihovo. Scenarij preveri, da so barve palete in slogi glave,
   kartice in gumba v vseh treh aplikacijah enaki in podlaga bela; test v Node, da so barve
   palete definirane samo v `shared/base.css`.
4. **Reševalec in značke** (N9, N10, N11).
5. **Zaključek:** izhodišča primerjav v scenarijih, `docs/rocni-test.md`,
   `docs/uskladitev.md` (faza 5 zaključena, opombi razrešeni, 4.6 in poved iz 1.1 v fazo 6,
   ostanek 1.1 in 6.8 v fazo 7, 4.3 v »Kasneje«), ročni pregled.

**Preverjanje pri vsakem koraku:**

- `node --test "tests/*.test.js"` – vsi zeleni (zdaj 422; korak 3 doda test palete);
- `node tools/posnetek-igre.js --primerjaj tools/posnetki/igra-pred-niz.json` – drevo
  elementov igre se ne sme spremeniti (sprememba je samo v slogih);
- `tools/preveri-videz-brskalnik.js` (nov) in obstoječi scenariji (niz, presek, enojčki,
  vadi). Primerjave »Spoznaj« z izhodiščnim commitom v obstoječih scenarijih bodo od koraka
  2 dalje pričakovano pokazale razlike v slogih. Scenarije dopolnim, da namesto prve razlike
  izpišejo povzetek vseh (lastnost: staro → novo, število elementov); pri vsakem koraku
  primerjam s prejšnjim commitom – `innerHTML` mora ostati enak, slogi se smejo
  razlikovati samo v načrtovanih lastnostih. Na koncu se privzeta izhodišča premaknejo na
  zadnji commit faze 5, barve, zapisane v scenarijih (npr. rdeča in zelena treninga), pa na
  novo paleto.

## 5. Ročni pregled (na koncu, predlog točk)

1. **Telefon:** vse tri aplikacije – brez vodoravnega drsenja, mreže cele, celice dovolj
   velike za prst. Avtomatika: emulacija nima pravega zaslona, dotika, sistemskih pisav in
   povečave strani.
2. **Namizje, ozko okno (400–500 px) z vidnim drsnikom:** brez vodoravnega drsnika v vseh
   treh. Avtomatika: brskalnik brez glave drsnike skrije, zato njihove širine ne upošteva
   (igra in trening računata mrežo iz širine okna).
3. **Izbira celice v igri na vseh štirih barvah poudarka** – opazna, a ne moti.
   Avtomatika preveri vrednosti sloga, presoje kontrasta ne zna.
4. **Nova paleta in bela podlaga v treningu in reševalcu** – nič ni izgubilo kontrasta
   (barve tehnik, povratne informacije, značke). Subjektivna presoja.
5. **Reševalec: dana temna, izpeljana modra** – berljivost rešitve, kandidatov in male
   mreže koraka, razumljivost legende. Subjektivna presoja.

## 6. Kasneje

- **Navigacija med aplikacijami (4.3)** – povezave »Igra · Reševalec · Trening« v glavi;
  nova funkcija.
- **Mreža igre in treninga iz širine vsebnika** namesto okna (`100vw`), kot pri P1 – če
  ročna točka 2 pokaže preliv zaradi drsnika.
- **Reševalec na širokem zaslonu v dveh stolpcih** (vnos levo, rešitev in koraki desno),
  kot igra.

## 7. Izvedba

### Korak 1 – prelivi (P1–P6, R1)

- Reševalec (`app/app.css`): `container-type: inline-size` na `.card` in `.mini-container`
  (v `@supports (width: 1cqi)`), `--cs`, `--ccs` in `--mcs-koraka` iz `100cqi / 9` (mala
  mreža odšteje 2 px obrobe); ovoj male mreže sega 29 px čez levi odmik koraka. V
  `app/app.js:201` je velikost male mreže `var(--mcs-koraka)` (iz CSS). Celice pri 375 px:
  vnos in rešitev 33,9 px, mala mreža koraka pribl. 30 px; pri 1280 px 45,6 px (prej 48 px
  in čez kartico).
- **Dodatno (P1):** nov scenarij je pri 320 px našel še spustni seznam »Primer«, ki je širok
  kot najdaljše ime primera in sega 3 px čez kartico – zdaj `max-width: 100%`.
- Igra (`igra/igra.css`): vrstica »Barve poudarka« se prelomi.
- Trening (`trening/trening.css`): `container-type` na `.exercise`, `--cs` vrste devetih
  celic iz `(100cqi - 16px) / 9` – pri 375 px 32,5 px (prej 39,75 px).
- Plošča (`shared/plosca.css`): kljukici »več hkrati« / »več celic« brez preloma.
- Orodja: `tools/preveri-videz-brskalnik.js` (nov, pribl. 30 s – vse drži pri 320, 375, 430
  in 1280 px) in `tools/primerjava-slogov.js` (povzetek razlik v treh primerjalnih
  scenarijih namesto prve razlike).
- Preverjeno: testi 422/422, posnetek igre enak (85), `preveri-niz` drži. `preveri-presek`,
  `-enojcki` in `-vadi`: vse drži razen primerjave »Spoznaj« pri 3–6 pri 375 px – HTML enak,
  razlike samo v `width`, `height` in `font-size` celic vrste (P6, pričakovano). Te primerjave
  ostanejo rdeče do koraka 5, ko se izhodišča premaknejo na zadnji commit faze 5.

### Korak 2 – izbira celice (A2)

- `shared/base.css`: `--izbira` (#4A86D8) in `--izbira-bg` (`var(--blue-bg)`) – skupno vsem
  trem aplikacijam (reševalec `mreza.css` ne naloži).
- `shared/mreza.css`: `.celica.izbrana` = `--izbira-bg` in 3 px obroba `--izbira`;
  `.celica.izbrana.poud-stevka` še bel notranji rob. Poudarek in oznake koraka imajo prednost
  pred podlago izbire (v treningu je prej izbira prekrila oznako koraka).
- `trening/trening.css`: pravili `.vaja-presek .celica.izbrana` in `.vaja-enojcek/.vaja-uganka
  .celica.izbrana` odpadeta.
- Fokus v vnosni mreži reševalca (`app/app.css`) in okna »Nova uganka« (`igra/igra.css`): brez
  obrobe `outline`, podlaga `--izbira-bg` in 3 px obroba `--izbira`.
- Scenarij `preveri-videz-brskalnik.js` pri 375 in 1280 px preveri izračunani slog: igra
  (prazna celica, poudarjena dana števka z belim robom, fokus v oknu »Nova uganka«),
  reševalec (fokus), trening (1, E1 z vnaprej izbrano celico, »Vadi v uganki« 3).
- `tools/primerjava-slogov.js`: številske vrednosti, ki se razlikujejo za manj kot 0,05 px,
  so enake – širina gumba »Preveri« (Inter 600) je med dvema zagonoma brskalnika nihala za
  1/64 px (87,859 ↔ 87,844 px) pri vseh tehnikah; ponovitev brez spremembe kode je bila enaka.
- Preverjeno: testi 422/422, posnetek igre enak (85), `preveri-niz` drži,
  `preveri-videz` drži; primerjave »Spoznaj« s prejšnjim commitom `c5a5fbb` (presek, enojčki,
  vadi) so enake – trening je imel že prej enako podlago in obrobo izbire.

### Korak 3a – paleta in podlaga (N1, N2, N8)

- `shared/base.css`: paleta (vrednosti reševalca in igre) z novim `--ink2` (#3C4854) in
  `body{ background: var(--paper) }` (bela). `app.css` in `igra.css` izgubita svojo kopijo
  palete, reševalec mrežni vzorec podlage; `trening.css` obdrži samo barve tehnik.
- Sivo besedilo: v treningu #4A5664 → `var(--ink2)`, drugod literal #3C4854 → `var(--ink2)`
  (brez vidne spremembe).
- `trening/index.html`: `preconnect` za Google Fonts.
- Test `tests/css-paleta.test.js` (3 testi): paleta samo v `shared/base.css`, ta je prvi slog.
  Scenarij `preveri-videz`: paleta v vseh treh aplikacijah enaka, podlaga bela.
- Barve treninga v starih scenarijih na novo paleto (`preveri-vadi`: zelena podlaga vpisa,
  rdeča izbrisa; `preveri-enojcki`: zelen okvir odgovora).
- Preverjeno: testi 425/425, posnetek igre enak (85), `preveri-niz` in `preveri-videz` držita,
  funkcionalni pregledi v `preveri-presek`, `-enojcki` in `-vadi` držijo. Primerjave »Spoznaj«
  s prejšnjim commitom `d331c75`: `innerHTML` povsod enak, razlike samo v `background-color`,
  `color` in `border-left-color` (paleta treninga) – pričakovano.

### Korak 3b – glava, kartica, naslovi, gumbi, noga, oznake korakov (N3–N7)

- `shared/base.css`: `body` (spodnji odmik 60 px), `header.top` (odmik 26/16/10 px,
  `.top-row`, `.eyebrow`, h1 24 px, opis `header.top > p`), `.top-actions`/`.top-btn`, `.card`
  (16 px odmika, 12 px razmika) in `.card h2` (Source Serif 17 px), `button`, `.primary`,
  `.majhen`, `:disabled` (0,4), `:active` (`brightness`), `footer.note` (sredinsko, 12 px),
  `.tag` in `.tag.t-*` (prej enaka kopija v reševalcu in igri).
- Reševalec: iz `app.css` odpadejo glava, kartica, gumbi, noga, oznake in `.lib-open`; gumb
  »Zbirka« ima razred `top-btn`, »Počisti kljukice« `majhen`; »Reši« raztegne pravilo
  `.btn-row .primary`; naslova »Možni kandidati« in »Koraki reševanja« sta zdaj Source Serif
  17 px (prej privzeti h2 brskalnika), »Rešitev« 17 namesto 18 px. Glava: gumb »Zbirka« se
  pri ozkem zaslonu prelomi pod nadnaslov (kot v igri).
- Igra: iz `igra.css` odpadejo glava, gumbi, kartica, noga in oznake (spodnji odmik glave 8 →
  10 px, razmik vrstic noge 1,5 → 1,6).
- Trening: `<header class="top">` z nadnaslovom »Trening · spoznaš in vadiš tehnike«, h1
  22 → 24 px, odmik strani 14 → 16 px, kartice vaje, menija in rezultata 16 px odmika in 12 px
  razmika (formula `--gs` ostane: 104 = 22 + 32 + 32 + 18), gumbi iz `shared/base.css`:
  `.pri` = velikost `.primary` (10×14 px) v barvi tehnike, `.sm-btn` = `.majhen` (barva besedila
  temna namesto sive), »Nazaj na izbiro« in gumba načina = osnovni gumb, gumbi plošče »Vadi v
  uganki« manjši (12,5 px, 6×8 px) z onemogočenim slogom igre (prej siva barva besedila).
- Scenarij `preveri-videz`: pri 1280 px enaki izračunani slogi skupnih sestavin v vseh treh
  aplikacijah (naslov, nadnaslov, glava, kartica, naslov kartice, gumb, glavni gumb, gumb v
  glavi, noga).
- Preverjeno: testi 425/425, posnetek igre enak (85), `preveri-niz` in `preveri-videz` držita,
  funkcionalni pregledi v `preveri-presek`, `-enojcki` in `-vadi` držijo. Primerjave »Spoznaj«
  s prejšnjim commitom `a3ebed0`: `innerHTML` povsod enak; razlike v lastnostih gumbov
  (pisava, debelina, odmik, obroba, širina, višina) in kartice vaje (odmik 18 → 16, razmik
  16 → 12, širina 347 → 343 px pri 375 px) – pri 4–5 elementih na vajo, celice mrež enake.
