# Podlage, legenda, Escape (naloga 6) – načrt

Načrt 2026-10-11 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 6, in tri postavke iz »Kasneje«).
**Stanje: čaka potrditev** – odločitve O1–O7 v razdelku 7.

Izhodišče: commit `e24738b` (zaključek naloge 4c).

**Cilj.** Tri majhne postavke, ki so bile v »Kasneje«:

1. **podlagi vzorca in izbrisa** v igri in reševalcu kot v treningu (#EFD8A0 / #F0B4AA namesto bledih #F1E5C9 /
   #F3DEDA; zapisano 2026-10-03, `docs/oznake-nacrt.md`, O2);
2. **postavka »tvoje oznake«** v legendi pod »Pravilno!« v »Vadi v uganki« (zapisano 2026-10-03, `docs/oznake-nacrt.md`,
   O4);
3. **Escape zapre povečan prikaz** v reševalcu (zapisano 2026-10-03 ob ročnem pregledu faze 5).

Številke v razdelku 2 so **izmerjene** v brskalniku brez glave (`tools/brskalnik.js`): 375 × 1000 px s posnemanjem
telefona (posnetki v dvojni ločljivosti) in 1280 × 1000 px. Korak za podlagi je isti v igri in reševalcu: 1 · Izločitev
izven bloka iz prve uganke v `docs/uganke.md` (igra – »Naslednji korak« na 3. stopnji po enojčkih; reševalec – korak 11,
»Pokaži na mreži«). Legenda: »Vadi v uganki« 3 · Očitni par (vaja iz banke, `Math.random` s semenom 11), celici vzorca
označeni z »Označi izbrane (O)«, nato pravilen odgovor s pravimi kliki. Prototip »predlog« je isti zagon z dodanim slogom
v strani (podlagi, vzorčki legende, temnejši kandidati v reševalcu) oziroma z dodano postavko legende. Skripti za meritve
in sestavljanje slik sta v začasni mapi (nista v repozitoriju).

## 0. Povzetek

- **Podlagi** (O1–O4): obe barvi postaneta skupni spremenljivki v `shared/base.css` (`--k-vzorec-bg`, `--k-izbris-bg`)
  – en vir za trening, igro, reševalca, legende in shemo v Pomoči. V reševalcu so kandidati v obarvanih celicah temnejši
  (kot v igri in treningu), ker bi sivi na rožnati podlagi imeli kontrast 1,73 : 1. Igra in reševalec spremenita samo
  slog – razredi in drevo elementov ostanejo.
- **Legenda** (O5): postavka »tvoje oznake« (vijoličen črtkan kvadratek) pod »Pravilno!«, samo kadar so na mreži oznake.
- **Escape** (O6, O7): zapre povečan prikaz; če je odprto še okno pod njim (s tipkovnico ali skripto), najprej zgornjo
  plast. Pomoč reševalca pove, kako se povečava zapre.
- **Koraki:** 1 – podlagi, 2 – legenda, 3 – Escape, 4 – zaključek. Vsak v svojem pogovoru, s testom pred spremembo.
  Logika tehnik, vaj, igre in zbirke se ne spremeni.

## 1. Kako je zdaj

### 1.1 Podlagi vzorca in izbrisa

| Kje | Vzorec | Izbris | Kje je določeno |
|---|---|---|---|
| Trening – vse mreže (`shared/mreza.js`: »Vadi v uganki«, »Spoznaj« E1, E2, 1, 2), mreže »Spoznaj« 3–13, legenda | #EFD8A0 | #F0B4AA | `trening/trening.css:21–22` prepiše `--k-vzorec-bg`, `--k-izbris-bg` |
| Igra – mreža (»Naslednji korak«) | #F1E5C9 (`--amber-bg`) | #F3DEDA (`--red-bg`) | privzeti vrednosti v `shared/mreza.css:43–44`, pravili `.celica.k-vzorec`/`.k-izbris` (131–132) |
| Igra – legenda pod korakom | `--amber-bg` | `--red-bg` | `igra/igra.css:98–99` (`.pomoc-legenda .sw-*`) |
| Igra – besedilo Pomoči »Barve na mreži: *jantarne* … *rdeče prečrtani* …« | `--amber-bg`, pisava `--amber` | `--red-bg`, pisava `--red` | `shared/pomoc.css:95–96` (`.vzorec-vzorec`, `.vzorec-izbris`; uporablja ju samo `igra/index.html:181`) |
| Reševalec – mala mreža koraka in povečan prikaz | `--amber-bg` | `--red-bg` | `app/app.css:432–433` (`.mini-grid .mcell.hl-source`/`.hl-elimonly`) |
| Reševalec – legenda pod malo mrežo | `--amber-bg` | `--red-bg` | `app/app.css:484, 489` (`.mini-legend .sw-*`) |
| Shema vzorca v Pomoči (vse tri aplikacije) | #EFD8A0 | #F0B4AA | `shared/pomoc.css:104, 106` – **tretja kopija** istih vrednosti pod svojim imenom |

V igri in reševalcu je torej shema v oknu Pomoč že v močnejših barvah, mreža iste aplikacije pa v bledih.

Kandidati v obarvanih celicah: igra `--kand-ink` #4A5561 (`shared/mreza.css:24` – v vseh celicah), trening pri 3–13 v
celicah vzorca in izbrisa prav tako `--kand-ink` (`trening/trening.css:268`, dodano z močnejšimi podlagami),
reševalec v vseh celicah svetlejši `--pencil` #8A94A0 (`app/app.css:453`).

### 1.2 Legenda pod »Pravilno!« v »Vadi v uganki«

- `legendaKoraka(korak, odstranjeni)` (`trening/v-uganki.js:116`) našteje »celice vzorca« (pri XY-verigi »celice verige
  (po vrsti)«) in »kandidat za izbris« / »izbrisani kandidati«. Kliče jo »Rešitev« (`v-uganki.js:343`), »Pravilno!«
  (`:473`) in »Spoznaj« 1 in 2 (`trening/trening.js:998, 1374` – tam zaznamkov ni).
- Zaznamki (»◩ Označi izbrane (O)«, pri 1–13): po pravilnem odgovoru je vrstica gumbov skrita (`v-uganki.js:474`),
  oznake na mreži ostanejo in se ne morejo več spremeniti (`zaznamuj()` ob zaklepu ne naredi nič, `shared/plosca.js:305`).
  Legenda vijoličnega črtkanega okvirja ne razloži – izmerjeno: dve označeni celici, vrstica z gumbom skrita.

### 1.3 Povečan prikaz v reševalcu

- `openLightbox()`/`closeLightbox()` (`app/app.js:89–99`): zapre ga ✕ (42 × 42 px), dotik ob mreži in dotik mreže,
  napis zgoraj levo »tapni za zapiranje«. **Poslušalca za Escape ni.**
- Escape drugod v reševalcu: okno zbirke (`app/zbirka.js:148`, navaden poslušalec na `document`) in okno Pomoč
  (`shared/pomoc.js:139`, poslušalec v fazi zajema, ki dogodek ustavi).
- Plasti: povečava ima `z-index` 2000 (`app/app.css:303`), okna `.dialog` 1500 (`shared/pomoc.css:11`) – povečava je
  nad njima. Z miško ali dotikom ob odprti povečavi drugega okna ni mogoče odpreti (gumba sta pod njo), s tipkovnico
  (Tab do gumba »Zbirka« ali »Pomoč« in Enter) ali skripto pa.
- Test `tests/app-zbirka.test.js:120` »Escape zapre okno zbirke, ne povečanega prikaza in ne Pomoči« to obnašanje
  zahteva (ohranjeno v fazi 7, korak 4; scenarij `tools/preveri-faza7-brskalnik.js --korak 4` ga primerja z izhodiščem).
- Pomoč reševalca (`app/index.html:121–122`): »Dotik mreže jo poveča.«, »dotik male mreže jo poveča« – o zapiranju nič.

## 2. Meritve

### 2.1 Podlagi

Mere celic: igra 37,7 px (kandidat 10,2 px) pri 375 in 56 px (15,1 px) pri 1280; reševalec – mala mreža 31 px
(kandidat 8,4 px) pri 375 in 42 px (11,3 px) pri 1280, povečava 36,1 px pri 375 in 52 px pri 1280.

Kontrast (WCAG) besedila na podlagah – zdaj → predlog:

| Besedilo | vzorec #F1E5C9 → #EFD8A0 | izbris #F3DEDA → #F0B4AA | bela |
|---|---|---|---|
| kandidat v igri in treningu (`--kand-ink` #4A5561) | 6,08 → 5,43 | 5,89 → 4,28 | 7,60 |
| kandidat v reševalcu (`--pencil` #8A94A0) | **2,46 → 2,20** | **2,38 → 1,73** | 3,08 |
| prečrtan kandidat (`--red` #B23A2E, krepko) | – | 4,60 → 3,34 | 5,94 |
| izpeljana števka (`--blue`) | 5,15 → 4,60 | – | 6,44 |
| čip »jantarne« v Pomoči igre: `--amber` / `--amber-ink` / `--ink` | 3,71 → 3,31 / 4,73 → 4,22 / 10,73 → 9,58 | – | – |
| okvir zaznamka (`--zaznamek` #5E2B97) | 7,40 → 6,61 | 7,17 → 5,21 | 9,26 |
| podlaga poudarka (`--poud` #F6C026) ob podlagi celice | **1,34 → 1,20** | 1,30 → 1,06 | 1,68 |

- Rdeča prečrtana števka na #F0B4AA (3,34) je v treningu od 2026-10-03 (`docs/oznake-nacrt.md`, merilo »vsaj 3«).
- Poudarek: kvadrat poudarka (rumen) v jantarni celici je že zdaj komaj ločen od podlage (1,34), s predlogom še manj
  (1,20) – vidi se v 2. vrstici slike 1; števka na njem je temna in krepka. Ista opomba je v »Kasneje« za »Spoznaj« 1 in
  2 (»rumeni poudarek je v jantarni celici vzorca podoben podlagi celice«).
- Pri obeh širinah zdaj in s prototipom brez vodoravnega preliva, brez napak JS.

### 2.2 Legenda

Pri 375 px je legenda »celice vzorca · izbrisani kandidati« v eni vrstici (20 px), s postavko »tvoje oznake« v dveh
(44 px – nova postavka gre v drugo vrstico). Pri 1280 px oboje v eni vrstici (20 px).

### 2.3 Escape

Pri obeh širinah: Escape ob odprti povečavi – povečava ostane odprta; povečava in zbirka (odprta s skripto) – Escape
zapre zbirko, povečava ostane; ✕ jo zapre.

### 2.4 Posnetki

V `docs/slike/naloga6/`:

1. `1-podlagi-prej-potem-375.png` – **slika prej in potem**: igra (mreža koraka in legenda; isti korak s poudarjeno
   števko 1) in reševalec (mala mreža koraka 11 z legendo), levo zdaj, desno predlog (O1–O3 po priporočilu, O2 A –
   temnejši kandidati v reševalcu).
2. `2-zdaj-1280.png` – zdaj pri 1280 px: igra (mreža in kartica Pomoč), reševalec (mala mreža), trening (legenda pod
   »Pravilno!« z označenima celicama).
3. `3-legenda-oznake-375.png` – legenda pod »Pravilno!«: zdaj in predlog s postavko »tvoje oznake«.

## 3. Predlogi

### A. Podlagi (O1–O4)

**O1 – en vir barv.**

- **A (priporočeno):** spremenljivki `--k-vzorec-bg` (#EFD8A0) in `--k-izbris-bg` (#F0B4AA) – imeni ostaneta – se
  preselita v paleto v `shared/base.css` (ta je prvi slog vseh treh aplikacij; reševalec `shared/mreza.css` ne naloži).
  `shared/mreza.css` in `trening/trening.css` ju ne določata več; uporabljajo ju mreža igre in treninga (kot zdaj),
  `app/app.css` (mala mreža, povečava, legenda), `igra/igra.css` (legenda) in `shared/pomoc.css` (čipa – O3; shema:
  `--shema-vzorec-bg: var(--k-vzorec-bg)`, `--shema-izbris-bg: var(--k-izbris-bg)` – brez vidne spremembe).
  `tests/css-paleta.test.js` dobi obe imeni na seznam (nobena druga datoteka ju ne sme določiti znova).
- **B:** vrednosti vpisane posebej v `app/app.css`, `igra/igra.css` in `shared/mreza.css` – četrta in peta kopija.

**O2 – kandidati v reševalcu v celicah vzorca in izbrisa** (mala mreža in povečava).

- **A (priporočeno):** temnejši, `--kand-ink` #4A5561 (5,43 / 4,28 : 1) – kot v igri in v treningu pri 3–13 (tam je
  bil razlog isti). `--kand-ink` se preseli iz `shared/mreza.css` v `shared/base.css`; v reševalcu samo te celice,
  drugi kandidati ostanejo `--pencil`. Prečrtani (rdeči) in zaporedne številke verige ostanejo.
- **B:** ostanejo `--pencil` – na rožnati podlagi 1,73 : 1 (zdaj 2,38).

**O3 – čipa v besedilu Pomoči igre** (»Barve na mreži: *jantarne* celice …, *rdeče prečrtani* kandidati …«).

- **A (priporočeno):** podlagi kot celice; »jantarne« s temno pisavo `--ink` (9,58 : 1 – beseda opisuje podlago, zdaj
  `--amber` 3,71); »rdeče prečrtani« ostane rdeče prečrtano kot kandidat na mreži (3,34 : 1, enako kot na mreži).
- **B:** ostaneta, kot sta (bledi podlagi, `--amber` in `--red`) – čip se od celice na mreži malo razlikuje.

**O4 – poudarek v jantarni celici** (igra; kontrast podlag 1,34 → 1,20).

- **A (priporočeno):** ostane – kvadrat poudarka je oster, števka na njem temna in krepka, barve poudarka igralec
  lahko spremeni (»Barve poudarka«); v treningu je enako že od 2026-10-03.
- **B:** poudarjen kandidat v celici koraka dobi tanek temen okvir – nova oznaka na mreži, ki jih je že veliko; ne
  priporočam.

### B. Legenda (O5)

**O5 – kdaj in kje je postavka »tvoje oznake«** (vzorček 14 × 14 px z 2 px črtkanim robom `--zaznamek`, kot na sliki 3;
pravi okvir na mreži je 3 px – na majhnem vzorčku bi bil pretežak).

- **A (priporočeno):** samo pod »Pravilno!« in samo, **kadar so na mreži oznake** – legenda našteje samo to, kar je
  na mreži (pravilo faze 6). Pod »Rešitvijo« ne: tam je vrstica z gumbom »Označi izbrane (O)« in opisom še vidna.
- **B:** pod »Pravilno!« vedno (pri 1–13), tudi brez oznak.
- **C:** kot A in še pod »Rešitvijo«, kadar so oznake.

Napis »tvoje oznake«, kot je zapisan v »Kasneje«. Izvedba: `legendaKoraka(korak, odstranjeni, oznake)` – tretji
argument poda samo »Vadi v uganki« ob »Pravilno!« (`plosca.zaznamovane.length > 0`); »Spoznaj« 1 in 2 ostaneta brez.

### C. Escape (O6, O7)

**O6 – Escape ob odprti povečavi.**

- **A (priporočeno):** Escape zapre povečavo; če je pod njo odprto še okno (zbirka ali Pomoč – samo s tipkovnico ali
  skripto), najprej povečavo (zgornja plast), naslednji Escape okno. Poslušalec v fazi zajema na `window` (pred Pomočjo
  in zbirko), ki zapre samo povečavo in dogodek ustavi. Test `app-zbirka.test.js:120` se spremeni: prvi Escape zapre
  povečavo, drugi zbirko.
- **B:** Escape zapre povečavo samo, kadar ni odprto nobeno okno – test ostane, ob obeh odprtih pa Escape zapre zbirko,
  ki je pod povečavo in je ni videti.

**O7 – napis in Pomoč reševalca.**

- **A (priporočeno):** napis »tapni za zapiranje« ostane (dotik je glavni način; tipke na telefonu ni). V Pomoč
  reševalca (razdelek »Rešitev in koraki«) ena poved: »Povečano mrežo zapreš z dotikom, z ✕ ali s tipko
  <kbd>Esc</kbd>.«
- **B:** Pomoč ostane, kot je.

## 4. Kaj se ne spremeni

- **Trening:** vrednosti so iste, zato so izračunani slogi enaki – primerjave »Spoznaj« z izhodiščem
  (`preveri-vadi-brskalnik.js`, `-presek-`, `-enojcki-`) brez razlik; shema v Pomoči enaka.
- **Drevo elementov in razredi** v igri in reševalcu: posnetek igre (`tools/posnetek-igre.js --primerjaj
  tools/posnetki/igra-po-xy-veriga.json`) in `tests/izris-korakov.test.js` brez razlik (oba vidita samo DOM).
- Zelena za vpis, poudarki in njihove barve, izbira celice, okvir območja in zaznamka, rdeča prečrtana števka.
- Escape v igri in treningu; zapiranje povečave z dotikom in ✕, odpiranje; okni zbirke in Pomoč, ko povečava ni odprta.
- Logika tehnik, vaj, igre, zbirke; shramba; brez novih knjižnic.

## 5. Koraki

Vsak korak v svojem pogovoru: najprej test, ki na stari kodi pade, nato sprememba; sprotno hitri testi, pred commitom
vsi; nov scenarij `tools/preveri-naloga6-brskalnik.js` (raste po korakih – `--korak N`); commit in push.

1. **Podlagi** (O1–O4). Test: `tests/css-paleta.test.js` – `--k-vzorec-bg`, `--k-izbris-bg` (pri O2 A še `--kand-ink`)
   določeni samo v `shared/base.css`; pravila celic in vzorčkov legend v `app/app.css` in `igra/igra.css`, čipa (O3) in
   shema v `shared/pomoc.css` jih uporabljajo (branje besedila CSS, kot zdaj v tem testu). Sprememba samo v CSS.
   Brskalnik (korak 1): 375 (posnemanje telefona) in 1280 – izračunane podlage v igri (mreža, legenda), reševalcu (mala
   mreža, povečava, legenda) in čipih Pomoči igre = #EFD8A0 / #F0B4AA, vzorček legende = celica, kontrasti iz tabele 2.1,
   trening enak, brez preliva in napak JS, posnetka. `preveri-vadi-brskalnik.js`: pričakovanje `oznakeIgra` (»igra:
   podlagi nespremenjeni«) se obrne – igra ima zdaj podlagi treninga; scenarij poženem (»Spoznaj« enak izhodišču).
   Še `preveri-videz-brskalnik.js`, `preveri-sheme-brskalnik.js` in posnetek igre.
2. **Legenda** (O5). Test v `tests/pocasni/trening-uganka-ui.test.js`: z oznakami je »tvoje oznake« zadnja postavka
   (vzorček z lastnim razredom), brez oznak je ni, pod »Rešitvijo« je ni; »Spoznaj« 1 in 2 nespremenjena
   (`trening-legenda`, `trening-izbris` ostaneta zelena). Sprememba: `legendaKoraka()` v `trening/v-uganki.js`, slog
   `.legenda-vaje .sw-zaznamek` v `trening/trening.css`, opis v Pomoči treninga (razdelek »Označi izbrane«), če kaj o
   legendi pove. Brskalnik (korak 2): pravi kliki (označi, izbriši, »Preveri«) pri 375 in 1280 – postavka, izračunan slog
   vzorčka (`dashed 2px rgb(94, 43, 151)`), legenda v kartici, brez preliva; `preveri-vadi-brskalnik.js`.
3. **Escape** (O6, O7). Test v `tests/app-zbirka.test.js`: Escape zapre povečavo rešitve in koraka; povečava in zbirka –
   prvi Escape povečavo, drugi zbirko; povečava in Pomoč enako; Escape brez odprte povečave kot zdaj. Nadomestni DOM
   (`tests/dom-stub.js`): `tipka()` gre najprej poslušalcem `window`, nato `document`, in upošteva
   `stopImmediatePropagation()` (zdaj gre samo poslušalcem `document`, vsem po vrsti) – obstoječi testi morajo ostati
   zeleni. Sprememba: `app/app.js` (poslušalec), `app/index.html` (O7). Brskalnik (korak 3): pri 375 in 1280 pravi
   Escape (`Input.dispatchKeyEvent`) – povečava rešitve, povečava koraka, povečava in zbirka (dvakrat), povečava ob
   fokusu v polju Niz, Pomoč in zbirka brez povečave kot prej. `preveri-faza7-brskalnik.js --korak 4` bo pri »Escape
   (povečava in zbirka)« pokazal namerno razliko od izhodišča – zapišem jo k obstoječi postavki »Kasneje« o zastarelih
   scenarijih.
4. **Zaključek:** vsi testi in vsi scenariji naloge, posnetek igre, `CLAUDE.md` (paleta v `shared/base.css`, legenda,
   Escape v reševalcu, nov scenarij), `docs/rocni-test.md` (razdelek »Naloga 6«), `docs/uskladitev.md` (naloga 6 in
   postavke v »Kasneje«), ročni pregled.

## 6. Ročni pregled (enkrat, po koraku 4)

1. **Igra, telefon in monitor:** odpri uganko, »Naslednji korak« trikrat pri koraku z izbrisom (npr. Izločitev izven
   bloka). Pričakovano: jantarne in rožnate celice jasno vidne, kandidati v njih berljivi, rdeče prečrtana števka vidna;
   poudari števko vzorca – rumen kvadrat še ločiš od jantarne celice. V Pomoči (»Pomoč pri reševanju«) čipa
   »jantarne« in »rdeče prečrtani« enaka celicam. *Zakaj ročno:* presoja barv na pravem zaslonu (svetlost, barvni profil,
   zunanja svetloba) – kontrast je samo številka.
2. **Reševalec, telefon:** »Reši«, »Pokaži korake reševanja«, »Pokaži na mreži« pri koraku z izbrisom, nato dotik male
   mreže. Pričakovano: barve kot v igri, kandidati v obarvanih celicah berljivi (mala mreža ima celico 31 px), povečava
   se zapre z dotikom. *Zakaj ročno:* isto kot 1 – berljivost drobnih kandidatov na pravem zaslonu.
3. **Trening, telefon:** »Vadi v uganki« 3 · Očitni par – označi celici vzorca z »Označi izbrane (O)«, izbriši in
   »Preveri«. Pričakovano: pod »Pravilno!« postavka »tvoje oznake« z vijoličnim črtkanim kvadratkom, ki je videti kot
   okvir na mreži; v vaji brez oznak postavke ni. *Zakaj ročno:* presoja, ali vzorček spominja na okvir.

Escape ni na seznamu: scenarij ga preveri s pravimi tipkami v brskalniku (korak 3).

## 7. Odločitve, ki jih potrebujem

| | Vprašanje | Priporočilo |
|---|---|---|
| **O1** | En vir barv (`shared/base.css`) ali vrednosti v vsaki datoteki | **A** – en vir |
| **O2** | Kandidati v reševalcu v celicah vzorca in izbrisa | **A** – temnejši (`--kand-ink`) |
| **O3** | Čipa v besedilu Pomoči igre | **A** – podlagi kot celice, »jantarne« temno |
| **O4** | Poudarek v jantarni celici v igri | **A** – ostane |
| **O5** | Postavka »tvoje oznake« | **A** – samo pod »Pravilno!«, samo z oznakami |
| **O6** | Escape ob povečavi in oknu pod njo | **A** – najprej povečava (zgornja plast) |
| **O7** | Napis in Pomoč reševalca | **A** – napis ostane, ena poved v Pomoči |

Ročni pregled je en sam, po koraku 4, največ 5 točk (zdaj 3), pri vsaki zakaj ni avtomatsko; po korakih 1–3 ga ni.
