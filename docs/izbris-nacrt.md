# Spoznaj: druga faza – izbris (naloga 4b) – načrt

Načrt 2026-10-09 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 4b – dodana ob ročnem pregledu
naloge 4a). **Stanje: potrjen 2026-10-09** (razdelek 3a – odločitve in dodatki D1–D4); koraka 1 in 2
narejena (razdelek 9).

Izhodišče: commit `705349a` (zaključek naloge 4a).

**Cilj.** V »Spoznaj« po pravilni izbiri vzorca igralec označi še kandidate, ki zaradi vzorca odpadejo.
Velja za tehnike 1–13.

Številke v razdelku 2 so **izmerjene** s skriptoma v začasni mapi (nista v repozitoriju): izbrisi na 900 vajah
vsake tehnike (100 krogov po 9 vaj, vaji 1 in 2 po shemi, `Math.random` s semenom), velikosti v brskalniku brez
glave (`tools/brskalnik.js`, 375 px s posnemanjem telefona in 1280 px).

## 0. Povzetek

- **En način za vse tehnike 1–13** (O5): 1. faza – celice vzorca (kot zdaj); 2. faza – kandidati, ki zaradi
  vzorca odpadejo. Pri 4 in 6 dosedanja 2. faza (izbira števk vzorca) odpade – izbris drugih števk iz celic
  vzorca pokaže isto znanje.
- **Vnos kot v »Vadi v uganki«** (O1, O2): izbereš celice, nato števko v nizu »Izbriši kandidata« (ali
  Shift+števka). Odgovor je po kandidatu (pari celica–števka), cilji za dotik pa so celice (30–40 px) in gumbi
  števk (26 px), ne male števke (8–11 px).
- **Označi, nato preveri** (O3, možnost A): klik kandidata ne izbriše, ampak ga rdeče prečrta – ostane viden;
  ponoven klik oznako odstrani. Kandidati vaje se ne spremenijo, zapomniti si je treba samo oznake. Napačen
  odgovor pobriše vse oznake naenkrat. Druga možnost (B, briši sproti z »Razveljavi«) je opisana v O3.
- **Vaja je rešena šele po obeh fazah** (O7). Krog brez napak je še vedno 9 / 9; vsak napačen »Preveri« (v kateri
  koli fazi) je napačen poskus; pomoč v kateri koli fazi – vaja se ne šteje (kot zdaj).
- **Po pravilni 2. fazi je vaja videti natanko tako kot zdaj po pravilnem odgovoru** (O11) – sporočilo koraka,
  prečrtani izbrisi, legenda. Sporočilo koraka (ki pove izbris) se pokaže šele po 2. fazi.
- **E1 in E2 ostaneta brez 2. faze** (O6) – odgovor je vpis, mreža je brez kandidatov.
- **Koraki:** priprava testov, nato 3–6, 7–13, 1–2 in zaključek – vsak samostojen, s testom pred spremembo.
  Logika motorja se ne spremeni (v `shared/engine.js` samo navodila vaj), banke vaj ni treba ustvarjati znova.

## 1. Stanje zdaj

### 1.1 2. faza pri 4 · Skriti par in 6 · Skrita trojica

Koda: `M.hasPhase2` v `MODES`, `checkPhase1()` in `checkPhase2()` v `trening/trening.js`.

- **1. faza:** izbereš dve (tri) celice. »Preveri« sprejme samo celice vzorca, ki ga je sestavil generator
  (`ex.targetSlots`).
  - Pravilno: »Celici sta pravilni! Zdaj izberi, kateri dve števki tvorita par.« Celici sta zeleni (`correct`),
    mreža ni več klikljiva, »Preveri« se skrije, pod njim se pokaže razdelek `phase2`.
  - Napačno: besedilo pravila (»Niso prave celice. Poišči dve števki, …«), izbira se izprazni.
- **2. faza:** gumbi vseh števk, ki so kandidati v enoti, in gumb »Preveri dve števki« / »Preveri tri števke«.
  Klik števko izbere ali odizbere (največ dve oz. tri). Presoja: natanko števke vzorca (`ex.targetDigits`).
  - Pravilno: sporočilo motorja (šele zdaj – po 1. fazi bi izdalo števke), števke vzorca obarvane, **druge
    števke v celicah vzorca prečrta program** (`elim`), legenda, »Naslednja vaja →«.
  - Napačno: »Ni pravilno. Poišči dve števki, …«, izbira števk se izprazni.
- **Štetje:** 1. faza se ne šteje – ne pravilna ne napačna (v veji `hasPhase2` ni klica `stej()`). Šteje se
  samo 2. faza: vsak napačen in pravilen poskus.

2. faza pri 4 in 6 torej **ni izbris**: igralec pove števke vzorca, izbris nariše program.

### 1.2 »Preveri« pri drugih tehnikah (1–3, 5, 7–13)

Ena faza – izbira celic vzorca.

| Tehnika | Kaj »Preveri« sprejme |
|---|---|
| 1, 2 | natanko celice koraka (`ex.solutionCells`) – odgovor je en sam |
| 3, 5 | vsak nabor dveh (treh) celic z dvema (tremi) kandidati skupaj – tudi drug kot generatorjev |
| 7 | vsako X-krilo po pravilu (dve vrstici ali stolpca s števko na istih dveh mestih) |
| 8 | vsak korak `swordfish()` z isto množico celic |
| 9–13 | vsak korak funkcije tehnike z isto množico celic |

- **Napačno število celic:** sporočilo (»Izberi natanko dve celici.«), poskus se ne šteje.
- **Pravilno:** `stej(true)` – vaja je rešena. Sporočilo (motor ali sestavljeno) pove tudi izbris. **Izbris
  nariše program**: števke izbrisa rdeče prečrtane (`elim`), pri 9–13 celice izbrisa rožnate (`elimcell`), pri 7
  in 8 celice izbrisa rožnate s prečrtano števko (`xw-elim`), pri 1 in 2 oznake koraka na delni mreži, pri 13
  zaporedne številke verige, legenda. »Preveri« se skrije,
  pokaže se »Naslednja vaja →«.
- **Napačno:** `stej(false)`, sporočilo s pravilom tehnike, izbira se izprazni.
- **Štetje:** vsak ocenjen »Preveri« je en poskus; vaja brez napak da 1 / 1, z eno napako 1 / 2.
- **Tipkovnica:** v »Spoznaj« 1–13 je ni (poslušalec `keydown` je samo za E1/E2 in »Vadi v uganki«).

### 1.3 »Namig« in »Rešitev«

Stikali (naloga 4a, del B): klik odpre, drugi klik zapre, odprt je kvečjemu eden. Vsak ogled – vaja s pomočjo,
ki se ne šteje nikamor (`oznaciPomoc()` odšteje že štete poskuse).

- **Namig:** besedilo po tehniki **o vzorcu**, ne o izbrisu (pogostost kandidatov, celice z dvema kandidatoma,
  povezave, pojavitve števke po vrsticah in stolpcih …).
- **Rešitev:** besedilo (sporočilo koraka – pove tudi izbris; pri 7 in 8 vse veljavne kombinacije; pri 4 in 6
  celice in števke) in oznake na mreži:
  - vzorec jantarno (`peek-hl`), celice izbrisa rožnato (`peek-elim`), števke izbrisa rdeče prečrtane
    (`peek-izbris`, naloga »prečrtanje«), legenda;
  - pri 3, 5, 7, 8 vzorec, ki se najbolj ujema z izbiro (`vzorecResitve()`);
  - izbira ostane, okvir pove pravilno ali napačno izbrano celico, ob spremembi izbire se oznake osvežijo (O12
    naloge 4a).
- **»Preveri« ob odprti pomoči** (`preveriSPomocjo()`): pravilen odgovor pomoč zapre, napačen jo pusti; pri 4 in 6
  jo pravilna 1. faza pusti.

### 1.4 E1 in E2

Odgovor je vpis (celica in števka) na plošči brez kandidatov (`checkSingle()`, `preveriEnojcek()`). Izbrisa ni.

## 2. Meritve

### 2.1 Izbrisi v vajah »Spoznaj«

900 vaj vsake tehnike (vaji 1 in 2 po shemi, 3–9 iz generatorja). »Kandidatov« = parov celica–števka, ki jih
vzorec vaje izbriše (isti izračun kot zdaj prečrtanje po pravilnem odgovoru).

| Tehnika | Kandidatov za izbris (min / povpr. / maks.) | Celic | Različnih števk | Izbris v celici vzorca | Drug vzorec, ki ga sprejme »Preveri« |
|---|---|---|---|---|---|
| 1 · Izločitev izven bloka | 1 / 1,8 / 5 | 1–5 | 1 | nikoli | – (odgovor je en sam) |
| 2 · Izločitev v bloku | 1 / 2,5 / 6 | 1–6 | 1 | nikoli | – |
| 3 · Očitni par | 4 / 6,2 / 10 | 3–5 | 2 (enkrat 1) | nikoli | 0 vaj |
| 4 · Skriti par | 2 / 3,8 / 6 | 2 | 1–5 (povpr. 3) | **vedno** | – (samo vzorec vaje) |
| 5 · Očitna trojica | 3 / 4,8 / 8 | 2–4 | 1–3 (povpr. 2,8) | nikoli | 5 vaj |
| 6 · Skrita trojica | 3 / 6,0 / 12 | 3 | 1–4 (povpr. 3,4) | **vedno** | – |
| 7 · X-krilo | 2 / 4,0 / 6 | 2–6 | 1 | nikoli | **234 vaj** (521 drugih vzorcev) |
| 8 · Mečarica | 3 / 5,3 / 9 | 3–9 | 1 | nikoli | **553 vaj** (povpr. 4,7 vzorca na vajo, največ 35) |
| 9 · Veriga ene števke | 1 / 1,3 / 3 | 1–3 | 1 | nikoli | 0 |
| 10 · W-krilo | 1 / 1,3 / 2 | 1–2 | 1 | nikoli | 0 |
| 11 · XY-krilo | 1 / 1,0 / 1 | 1 | 1 | nikoli | 0 |
| 12 · Edinstveni pravokotnik | 2 / 2,0 / 2 | 1 | **2** | **vedno** (četrti vogal) | 0 |
| 13 · XY-veriga | 1 / 1,4 / 2 | 1–2 | 1 | nikoli | 0 |

Kaj iz tega sledi:

- **Več različnih števk** se briše pri 3, 4, 5, 6 in 12 – vnos mora znati več števk (O2).
- **Izbris v celicah vzorca** je pri 4, 6 in 12 v vseh vajah – celice vzorca morajo biti v 2. fazi klikljive.
- **Drug vzorec** sprejme »Preveri« pri 5, 7 in 8 – vsak drug vzorec ima **drug izbris** (pri 8 vseh 3353 drugih
  vzorcev). Izbris v 2. fazi mora biti izbris vzorca, ki ga je igralec izbral (O10).
- **Vzorca brez izbrisa** ni v nobeni od 11 700 vaj (tudi ne med drugimi vzorci) – pravilo »Preveri« pri 7 bi ga
  sicer dopustilo, zato je potrebno varovalo (O10).

### 2.2 Cilji za dotik

| Kaj | 375 px (telefon) | 1280 px |
|---|---|---|
| celica – vrstica (3–6) | 33 × 33 | 46 × 46 |
| celica – stolpec, blok (3–6) | 40 × 40 | 46 × 46 |
| celica – mreža 9 × 9 (1, 2, 7–13) | 30 × 30 | 46 × 46 |
| mala števka (kandidat) v celici | **8–11 px** (pisava 8–11 px) | 13–15 px |
| gumb števke v nizu »Izbriši kandidata« (»Vadi v uganki«) | 26 × 27 | 42 × 41 |

Priporočena najmanjša velikost cilja za dotik je 24 × 24 px (WCAG 2.2, merilo 2.5.8). Mala števka je na
telefonu trikrat premajhna; celica in gumb števke zadoščata.

## 3. Odločitve (predlogi z utemeljitvijo)

### O1 – Izbira po kandidatu ali po celici

| Možnost | Kako | Za | Proti |
|---|---|---|---|
| A – po kandidatu | klik na malo števko v celici | najbolj neposredno, najmanj klikov | na telefonu mala števka 8–11 px (2.2) – zgrešiš sosednjo; klik v celico ne bi bil več izbira celice; pri 7 in 8 ni malih števk |
| B – po celici | izbereš celice izbrisa, program v njih prečrta, kar vzorec izbriše | preprosto, veliki cilji | pri 3, 4, 5, 6 in 12 se briše več različnih števk (do pet, 2.1), iz iste celice lahko več – igralec pokaže »kje«, ne »kaj«; ne preveri, ali ve, katera števka odpade |
| **C – celica in števka** | izbereš celico (ali več), nato števko v nizu »Izbriši kandidata« pod mrežo ali Shift+števka | odgovor je po kandidatu (pari celica–števka), cilji pa so celice in gumbi (2.2); **isti vnos kot v »Vadi v uganki« in igri** – prehod iz »Spoznaj« v »Vadi v uganki« brez novega učenja | dva klika namesto enega |

**Predlog: C.** Niz ima števke 1–9 (kot v »Vadi v uganki«), sloge iz `shared/plosca.css` (`.niz-odstrani`).
Pri 7 in 8 imajo celice samo števko vaje, zato je v nizu omogočena samo ona – vnos je isti kot drugod. Pri 1, 2
in 9 je števka vaje znana (»Označena števka«), celice pa imajo tudi druge kandidate – oznaka druge števke je
napaka.

### O2 – Več števk in več celic hkrati

- **Več celic:** v 2. fazi klik celico doda v izbiro ali jo odstrani (kot v 1. fazi; kljukica »več celic« ni
  potrebna). Izbirati je mogoče vse celice s kandidati, **tudi celice vzorca** (pri 4, 6, 12 je izbris v njih).
- **Več števk:** ena števka na klik. Pri dveh števkah (npr. 12: obe števki iz četrtega vogala) dva klika.

Kdaj je gumb števke omogočen:

| Možnost | Pravilo | Ocena |
|---|---|---|
| **a – presek** | števka je kandidat v **vseh** izbranih celicah; klik jo označi v vseh (če je v vseh že označena – gumb ima ↺ – oznako odstrani) | **predlog** – isto pravilo kot v igri in »Vadi v uganki« (`skupniKandidati()`); vrstica pod nizom pove, zakaj je gumb onemogočen |
| b – unija | števka je kandidat v vsaj eni izbrani celici; klik jo označi tam, kjer je | pri 3 hitreje (izbereš vse celice, klikneš obe števki), a drugače kot v igri |
| c – več števk naenkrat | izbereš števke, nato gumb »Izbriši« | nov gumb, ki ga drugod ni |

**Predlog: a.** Izbira po kliku števke ostane (kot v igri) – naslednjo števko lahko označiš brez nove izbire.

### O3 – Stanje kandidatov in napačen odgovor

Obe možnosti:

**A – označi, nato preveri** (predlog)

- Klik (celica + števka) kandidata **ne izbriše, ampak ga označi**: števka je rdeče prečrtana in ostane v celici
  (isti videz kot izbris po pravilnem odgovoru in ob »Rešitvi«; pri 7 in 8 je prečrtana števka celice, pri 1 in
  2 kandidat na delni mreži). Celica ostane bela – rožnato podlago dobi pri 7–13 šele po pravilnem odgovoru,
  kot zdaj.
- Ponoven klik iste števke oznako odstrani (gumb ima ↺, kot »vrni« v igri) – to je hkrati »razveljavi«.
- **Stanje kandidatov se ne spremeni** (`ex.slots`, `ex.grid`, `ex.kandidati` ostanejo); zapomniti si je treba
  samo množico oznak.
- »Preveri« presodi vse oznake skupaj. **Napačen odgovor: vse oznake se pobrišejo naenkrat**, izbira se izprazni –
  mreža je spet taka kot po 1. fazi (tako kot se zdaj ob napačnem odgovoru izprazni izbira).
- Za: igralec ves čas vidi vse kandidate in to, kar je prečrtal (lahko preveri razmislek); ni sklada potez, ni
  gumbov Razveljavi/Ponovi; isti videz kot končni izbris.
- Proti: ob napačnem odgovoru je treba označiti znova (pri 8 do 9 kandidatov).

**B – briši sproti**

- Vsak klik kandidata **takoj izbriše** – izgine iz celice, kot poteza v »Vadi v uganki« in igri. Gumbi
  Razveljavi / Ponovi / Začni znova.
- Stanje po 1. fazi se shrani ob začetku 2. faze. »Preveri« presodi izbrisane; napačen odgovor: gumb »Poskusi
  znova« vrne stanje po 1. fazi (vse naenkrat) – ali Razveljavi po korakih.
- Različica B2 – vsak klik se takoj tudi presodi (napačen izbris se zavrne): ni priporočljiva, ker se da odgovor
  najti s klikanjem vseh kandidatov.
- Za: isto kot v »Vadi v uganki« (tudi videz – izbrisan kandidat izgine).
- Proti: za sestavljene vaje (3–13) bi bil potreben nov sklad potez (plošče iz `shared/plosca.js` ni mogoče
  uporabiti – kandidati sestavljenih vaj ne izhajajo iz danih števk); izbrisan kandidat ni več viden, zato igralec
  ne vidi, kaj je izbrisal, in »Rešitev« ne more pokazati razlike.

**Predlog: A.** »Spoznaj« je za učenje – vidna slika vzorca in prečrtanih kandidatov je pomembnejša od enakosti z
»Vadi v uganki«. Vnos (O1, O2) je kljub temu enak: tudi v igri ponoven klik števke kandidata vrne.

### O4 – Nepopoln odgovor

Vse oznake so pravilne, nekaj kandidatov pa manjka.

- **Predlog:** »Še ne. Označeni kandidati res odpadejo, manjkata pa še 2 izbrisa.« (sklanjanje glagola in
  samostalnika – `sklanjaj()`: manjka 1 izbris, manjkata 2 izbrisa, manjkajo 3 izbrisi, manjka 5 izbrisov).
  Ne šteje, oznake ostanejo. Tako je »delno« v »Vadi v uganki«.
- Druga možnost: šteje kot napačen odgovor (oznake se pobrišejo). Strožje, a kaznuje spregled enega od devetih
  kandidatov pri 8 enako kot napačen izbris.

Druga izida 2. faze:

- **prazno** (brez oznake): »Izberi celico in izbriši kandidata, ki zaradi vzorca odpade.« – ne šteje;
- **napačno** (vsaj ena oznaka zunaj izbrisa): »Ni pravilno. Med označenimi je kandidat, ki zaradi vzorca ne
  odpade.« in posledica tehnike (`TEHNIKE_OPISI[].posledica`); ne pove, kateri – oznake se pobrišejo (O3).

### O5 – Uskladitev s 4 in 6

- **Predlog: en način za vse.** 1. faza – celice vzorca (pri 4 in 6 kot zdaj: samo vzorec vaje); 2. faza – izbris.
  Dosedanja 2. faza (gumbi števk, »Preveri dve števki«) **odpade**: izbris pri skritem paru so druge števke v
  celicah vzorca, zato pravilen izbris pokaže, da igralec pozna števke para.
- Druga možnost: tri faze (celice → števke → izbris). Faza števk ne doda ničesar, kar izbris ne preveri, vaja pa je
  daljša.
- Posledica: pri 4 in 6 se napačna 1. faza začne šteti (O7) – zdaj se ne.

### O6 – E1 in E2

**Predlog: ostaneta brez 2. faze.** Odgovor je vpis, mreža je brez kandidatov (raven lahke); izbrisa ni, kaj bi
igralec označil.

### O7 – Kdaj je vaja rešena in kaj šteje

| Dogodek | Predlog |
|---|---|
| 1. faza – napačno | napačen poskus (kot zdaj; pri 4 in 6 novo) |
| 1. faza – pravilno | ne šteje – vaja še ni rešena |
| 2. faza – prazno, nepopolno | ne šteje |
| 2. faza – napačno | napačen poskus |
| 2. faza – pravilno | pravilen poskus, **vaja je rešena** |
| Namig ali Rešitev v kateri koli fazi | vaja se ne šteje; že šteti poskusi obeh faz se odštejejo (kot zdaj) |

- **Predlog: rešena je samo vaja z obema pravilnima fazama.** Krog brez napak je še vedno 9 / 9, odstotek ostane
  primerljiv s prejšnjimi krogi.
- Druga možnost: vsaka faza svoj poskus – krog brez napak 18 / 18; spremeni pomen rezultata.
- Tretja možnost: 2. faza se ne šteje – brez posledic, igralec bi jo lahko »preklikal«.

### O8 – Namig v 2. fazi

- **Predlog:** koliko kandidatov in katere števke, brez celic: »Izbrisati je treba 6 kandidatov – števki 3 in 8.«,
  pri eni števki »Izbrisati je treba 2 kandidata – števka 7.« Izračun iz izbrisa najdenega vzorca, eno besedilo za
  vse tehnike (sklanjanje). Kje se briše, pove posledica v razdelku »Razlaga« (ta ni pomoč).
- Druga možnost: pravilo izbrisa za najdeni vzorec po tehniki (»Števki para izbriši iz drugih celic vrstice 4.«) –
  13 besedil, skoraj že rešitev.
- Namig v 1. fazi ostane, kot je.

### O9 – Rešitev v 2. fazi

- **Besedilo:** sporočilo koraka **najdenega** vzorca (pri drugem vzorcu 3, 5 sestavljeno kot zdaj pri »Preveri«;
  pri 7 in 8 stavek o najdenem vzorcu, ne seznam vseh kombinacij).
- **Oznake:** celice najdenega vzorca ostanejo zelene, kandidati izbrisa rdeče prečrtani (`peek-izbris` – označeni
  ali ne), celice izbrisa rožnate. **Napačna oznaka** (kandidat zunaj izbrisa): brez črte, s temno rdečim obročem
  (`--okvir-napacno`, ista barva kot napačno izbrana celica ob »Rešitvi«). Legenda: »tvoj vzorec« (zeleno; pri 1 in 2
  jantarno »celice vzorca«), »kandidat za izbris«, »napačno označen kandidat« (samo postavke, ki so na mreži).
- Ob spremembi oznak se Rešitev osveži (kot ob spremembi izbire – O12 naloge 4a).
- Rešitev v 1. fazi ostane, kot je – pokaže vzorec **in** izbris (vaja je s tem s pomočjo, zato izbris lahko
  pokaže).

### O10 – Drug veljaven vzorec (3, 5, 7, 8)

- **Predlog:** izbris v 2. fazi je izbris vzorca, ki ga je sprejel »Preveri« v 1. fazi (2.1: pri 8 ima več
  vzorcev 553 od 900 vaj, vsak z drugim izbrisom). Izbris vzorca generatorja bi bil pri drugem vzorcu napačen.
- **Varovalo:** če bi bil izbris sprejetega vzorca prazen (meritev: 0 od 11 700 vaj), je vaja rešena že po 1. fazi
  s sporočilom »Ta vzorec ne izbriše nobenega kandidata.«

Izbris najdenega vzorca – isti izračun, kot zdaj prečrta izbris po pravilnem odgovoru:

| Tehnika | Izbris |
|---|---|
| 1, 2 | `ex.solutionEliminate` |
| 3, 5 | `izbrisPodmnozice()` za izbrani nabor celic |
| 4, 6 | `izbrisPodmnozice()` za vzorec vaje |
| 7 | celice izbrisa po pravilu (kot `elimNow` v `checkPhase1()`), števka vaje |
| 8–13 | `eliminate` koraka motorja, ki ga je sprejel »Preveri« |

### O11 – Sporočila in končno stanje

- **Po pravilni 1. fazi:** »Vzorec je pravilen. Zdaj izbriši kandidate, ki zaradi njega odpadejo.« – brez
  sporočila koraka (to pove izbris), kot zdaj pri 4 in 6. Celice vzorca zelene. Pri 7 in 8 brez dela »→ iz
  preostanka teh stolpcev jo izbrišeš«. Pod mrežo se pokaže niz »Izbriši kandidata« z vrstico za razlog.
- **Po pravilni 2. fazi:** vaja je videti **natanko tako kot zdaj po pravilnem odgovoru** (sporočilo koraka,
  razredi `correct`, `elim`, `elimcell`, `xw-elim`, številke verige, legenda); niz se skrije. To je preverljivo s
  primerjavo z izhodiščem v brskalniku.
- **Navodila vaj:** `TEHNIKE_OPISI[].navodilo` (1–13) in lastni opisi vaj (`ex.desc` pri 1, 2, 7, 8) dobijo
  drugi del, npr. »Izberi obe celici para, nato izbriši kandidate, ki zaradi njega odpadejo.« Pravila besedil
  faze 6 veljajo (»izbriši«, »števka«).

### O12 – Tipkovnica

**Predlog:** v 2. fazi Shift+števka (kot v »Vadi v uganki«; po `e.code` – pari QWERTZ) in Escape (počisti
izbiro). Števka brez Shift ne naredi nič (kot v »Vadi v uganki«, kjer je vpis izklopljen). V 1. fazi tipkovnice še
naprej ni.

### O13 – Kje je koda

**Predlog:** nova datoteka `trening/izbris.js` (naloži se pred `trening/trening.js`): presoja oznak brez DOM-a
(`presodiIzbris(izbris, oznake)` → `{ izid, manjka }`), stanje oznak in niz »Izbriši kandidata«. `trening.js`
(1277 vrstic) dobi samo prehod v 2. fazo in klic izrisa. Logike tehnik ni (izbris pride iz motorja ali generatorja),
zato ne sodi v `shared/`.

## 3a. Potrditev (2026-10-09)

**Odločitve:** O1–O13 po predlogu, s poudarki:

- **O3:** možnost A – označi, nato preveri; napačen odgovor pobriše vse oznake.
- **O5:** pri 4 in 6 izbira števk odpade.
- **O7, O4:** napaka v 2. fazi šteje, nepopoln odgovor ne.
- **O9:** napačna oznaka (ob »Rešitvi«) brez črte, s temno rdečim obročem.

**Dodatki:**

- **D1 – primerjave z izhodiščem.** Navodila vaj se spremenijo (O11), zato primerjave »Spoznaj« z izhodiščem
  (`preveri-presek-`, `-enojcki-`, `-vadi-`, `-izbira-brskalnik.js`) ne bodo več enake do znaka. Razlika se izvzame
  **izrecno** (`ZNANE_RAZLIKE` v `tools/primerjava-slogov.js` ali izvzetje navodila); primerjav se drugače ne
  rahlja. V poročilu koraka se pove, kaj je izvzeto.
- **D2 – posnetka v koraku 2.** V `docs/slike/izbris/` dva posnetka pri 375 px v dvojni ločljivosti:
  a) 3 · Očitni par z oznakami pred »Preveri«; b) 5 · Očitna trojica, »Rešitev« z eno pravilno in eno napačno
  oznako. Pogledata se pred korakom 3.
- **D3 – razdelitev koraka 2.** Če korak 2 postane prevelik, se razdeli na 2a (osnova, 3 in 5) in 2b (4 in 6);
  o tem se poroča.
- **D4 – CLAUDE.md.** V seznam dokumentov se dodata `docs/trening-ucenje-nacrt.md` in `docs/izbris-nacrt.md`
  (narejeno v koraku 1).

## 4. Kaj vidi uporabnik (primer: 3 · Očitni par)

1. Izbere celici para in pritisne »Preveri«. → »Vzorec je pravilen. Zdaj izbriši kandidate, ki zaradi njega
   odpadejo.« Celici para sta zeleni. Pod mrežo je niz »Izbriši kandidata« (1–9).
2. Izbere celice s 3 in klikne »3« (ali Shift+3) – števka 3 je v teh celicah rdeče prečrtana. Izbere celice z 8 in klikne »8«.
   Zmotil se je pri eni celici: izbere jo in klikne »8« (↺) – oznaka izgine.
3. Pritisne »Preveri«:
   - vse prav → »Pravilno!« in sporočilo koraka; prečrtane števke ostanejo, legenda, »Naslednja vaja →« –
     vse kot zdaj po pravilnem odgovoru;
   - manjka ena → »Še ne. Označeni kandidati res odpadejo, manjka pa še 1 izbris.« – oznake ostanejo;
   - označena je napačna → »Ni pravilno. …« – oznake se pobrišejo, poskus je napačen.

Drugje enako, z razlikami:

- **4, 6:** izbris je v celicah vzorca (zelenih) – izbere celico vzorca in briše druge števke; gumbov števk para ni
  več.
- **7, 8:** izbere celice s števko v stolpcih (vrsticah) vzorca in klikne števko vaje – celica ima prečrtano
  števko.
- **9–13:** en ali dva kandidata (pri 12 obe števki iz četrtega vogala); pri 13 ostanejo številke verige.
- **1, 2:** na delni mreži – kandidat rdeče prečrtan, vzorec jantaren (kot zdaj ob »Rešitvi«).

## 5. Kaj se ne spremeni

»Vadi v uganki«, igra, reševalec, E1 in E2, 1. faza (izbira in sprejeti vzorci), Namig in Rešitev v 1. fazi,
sheme in vaji po shemi, štetje pomoči, logika motorja (v `shared/engine.js` se spremenijo samo navodila
`TEHNIKE_OPISI[].navodilo`, zato banka vaj ostane), posnetek igre.

## 6. Koraki

**Pravila za vse korake** (kot pri nalogi 4a):

- vsak korak v svojem pogovoru, s commitom in pushem;
- najprej test, ki na stari kodi pade in pove, kaj manjka; nato sprememba;
- test, ki pade samo zato, ker je za pravilnim odgovorom še 2. faza, gre prek pomožne funkcije (najprej zelen na
  stari kodi); če pade test, ki ga načrt ne predvideva, se izvedba ustavi in poroča;
- sproti hitri testi, pred commitom vsi; posnetek igre (`tools/posnetek-igre.js --primerjaj` – brez razlik);
  scenarij koraka v brskalniku brez glave;
- `CLAUDE.md`, ta načrt (razdelek 9 »Izvedba«) in `docs/uskladitev.md` v istem commitu; oznaka različice prek
  pre-commit hooka.

### Korak 1 – priprava testov (brez spremembe aplikacije)

- **Kaj:** pomožna `tests/odgovor-spoznaj.js` z `odgovoriPravilno(dom, run, tehnika)` – opravi pravilen odgovor do
  konca vaje, kakor ga vaja zahteva zdaj (1. faza, pri 4 in 6 še števke). Testi, ki zdaj v »Spoznaj« odgovorijo
  pravilno, preidejo nanjo: `trening-legenda`, `trening-precrtanje`, `trening-stikalo`, `trening-pomoc`,
  `trening-resitev`, `trening-po-shemi` (pomožna `trening-po-shemi.js`), `veriga-prikaz`, `pocasni/trening-presek`,
  `pocasni/trening-uganka-ui` (»Spoznaj« 1 in 2). Natančen seznam da zagon testov. Pričakovanja ostanejo.
- Enako za scenarije v brskalniku: `tools/odgovor-spoznaj-brskalnik.js` (pravi kliki) za `preveri-po-shemi-`,
  `-izbira-`, `-vadi-`, `-presek-`, `-vklop-` in `-videz-brskalnik.js` (seznam se preveri ob izvedbi).
- **Preverjanje:** na stari kodi vsi testi zeleni, scenariji z enakim izidom kot pred korakom.
- Naslednji koraki pomožni funkciji dodajo 2. fazo za svoje tehnike.

### Korak 2 – 3–6 (vrstica, stolpec, blok) in osnova 2. faze

- **Kaj:**
  - `trening/izbris.js` (O13): presoja, oznake, niz »Izbriši kandidata« z vrstico za razlog;
  - `trening/trening.js`: prehod v 2. fazo po pravilni 1. fazi (O11), izbira v 2. fazi (tudi celice vzorca),
    štetje (O7 – pravilna 1. faza ne reši vaje), Namig in Rešitev v 2. fazi (O8, O9), tipkovnica (O12); pri 4 in 6
    odpadejo gumbi števk (O5); pri 3 in 5 izbris izbranega vzorca (O10);
  - `trening/trening.css`: oznaka (videz `elim`), izbrana zelena celica vidno izbrana (zdaj `.gc.correct` z
    `!important` prekrije izbiro), napačna oznaka ob Rešitvi;
  - `shared/engine.js`: `TEHNIKE_OPISI[].navodilo` za 3–6.
- **Test pred spremembo:** nov `tests/trening-izbris.test.js` (nadomestni DOM; izbris izračunan v testu iz vaje,
  neodvisno od `trening.js`):
  - po pravilni 1. fazi niz in navodilo, sporočilo brez izbrisa, vaja ni rešena, »Naslednja vaja« skrita;
  - oznake s celico in števko: presek (onemogočeni gumbi), ↺ odstrani, izbira ostane, kandidati vaje nespremenjeni;
  - izidi »Preveri«: prazno in nepopolno ne štejeta (oznake ostanejo pri nepopolnem), napačno šteje in pobriše vse
    oznake, pravilno šteje in reši vajo;
  - končno stanje po 2. fazi = stanje po pravilnem odgovoru (razredi `correct`, `elim`, legenda, sporočilo koraka);
  - 4 in 6: izbris v celicah vzorca, ni gumbov števk; 3 in 5: drug vzorec – njegov izbris;
  - štetje kroga: brez napak 9 / 9; napaka v 1. fazi pri 4 šteje; Namig v 2. fazi – vaja s pomočjo, odšteti tudi
    poskusi 1. faze;
  - Namig 2. faze (število in števke), Rešitev 2. faze (oznake, napačna oznaka, legenda, osvežitev ob oznaki);
  - Shift+števka s pari QWERTZ, Escape, števka brez Shift nič;
  - pravila besedil (»izbriši«, ločila, sklanjanje).
- **Brskalnik:** nov `tools/preveri-izbris-brskalnik.js` (raste po korakih), 375 px (dotik) in 1280 px (miška):
  pravi dotiki in kliki celic in gumbov, Shift+števka (QWERTZ), izračunan slog oznake (rdeča, prečrtana) in
  napačne oznake ob Rešitvi, niz v kartici, brez preliva in napak JS; **končno stanje po pravilni 2. fazi enako
  izhodišču po pravilnem odgovoru** (`innerHTML` območja vaje brez niza in izračunani slogi, `Math.random` s
  semenom, izhodišče `705349a`); posnetki za ročni pregled.
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** pravega dotika in razločnosti oznak na telefonu (ročni
  pregled, točki 1 in 4).

### Korak 3 – 7–13 (mreža ene števke in cela mreža 9 × 9)

- **Kaj:** ista mehanika na `xw-grid` (7, 8 – prečrtana števka celice) in `g9` (9–13); izbris po O10; pri 13
  ostanejo številke verige; sporočilo X-krila in mečarice po 1. fazi brez izbrisa; navodila 7–13 in `ex.desc`
  pri 7, 8.
- **Test pred spremembo:** `trening-izbris` za 7–13 – izbris iz vzorca, ki ga sprejme »Preveri« (pri 7 po pravilu,
  pri 8 `swordfish()`, pri 9–13 funkcija tehnike – v testu), pri 7 in 8 drug vzorec (njegov izbris), pri 12 obe
  števki iz četrtega vogala, pri 13 številke po 2. fazi; končno stanje kot zdaj.
- **Brskalnik:** scenarij za 7, 8, 10, 12, 13 (pri 375 px celica 30 px).
- **Česa ne:** razumljivost pri mečarici z drugim vzorcem (ročni pregled, točka 3).

### Korak 4 – 1 in 2 (delna mreža) in Pomoč

- **Kaj:** oznake prek pogleda mreže (`oznake.izbris` v `shared/mreza.js` – rdeče prečrtan kandidat, ki je še v
  celici; vzorec jantarno); `obKliku` delne mreže v 2. fazi izbira vidne prazne celice; navodila in `ex.desc` pri
  1 in 2. Pomoč treninga (`trening/index.html`): poved o dveh fazah v »Spoznaj« (razdelek »Spoznaj in Vadi v
  uganki«) in Shift+števka v razdelku »Tipkovnica«.
- **Test pred spremembo:** `trening-izbris` za 1 in 2 (vaji po shemi in vaje iz banke), `pocasni/trening-presek`
  prek pomožne funkcije; Pomoč treninga omeni 2. fazo.
- **Brskalnik:** scenarij za 1 in 2 (375 in 1280 px).

### Zaključek

Ročni pregled (razdelek 7), vpis v `docs/rocni-test.md` (razdelek »Spoznaj – izbris«), `docs/uskladitev.md`
(naloga 4b zaključena, naslednja 4c).

## 7. Ročni pregled (enkrat, na koncu naloge)

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | trening, »Spoznaj«, pravi telefon | 3 · Očitni par in 11 · XY-krilo: po pravilni 1. fazi označi izbris z dotiki celic in gumbov števk; eno oznako popravi (↺); »Preveri«. | Celice in gumbi se zanesljivo zadenejo, oznaka je jasno vidna in drugačna od izbire. | Pravi prst, povečava in odziv telefona; brskalnik brez glave dotik samo posnema. |
| 2 | trening, »Spoznaj« | 4 · Skriti par in 6 · Skrita trojica: obe fazi. | Jasno je, da izbris drugih števk iz celic vzorca nadomesti izbiro števk para. | Presoja razumljivosti (O5). |
| 3 | trening, »Spoznaj« | 8 · Mečarica: v vaji z več vzorci izberi drug vzorec kot generatorjev, nato izbris. | Sprejet je izbris tvojega vzorca; sporočila so razumljiva. | Presoja (O10). |
| 4 | trening, »Spoznaj«, telefon | 5 · Očitna trojica: v 2. fazi označi en pravilen in en napačen kandidat, odpri »Rešitev«. | Kandidat za izbris in napačna oznaka sta na mreži in v legendi jasno ločena. | Presoja barve in velikosti male števke na telefonu (O9). |
| 5 | trening, »Spoznaj« | Cel krog 7 · X-krilo z eno napako v 2. fazi in eno nepopolno oddajo. | Napaka pobriše oznake, nepopoln odgovor jih pusti; rezultat na koncu 9 / 10 (napačen poskus šteje, nepopoln ne). Potek ni moteč. | Presoja poteka (O3, O4, O7). |

## 8. Odločitve – pregled

| # | Vprašanje | Možnosti | Predlog |
|---|---|---|---|
| O1 | Izbira po kandidatu ali po celici | po kandidatu (mala števka) · po celici (program prečrta) · celica in števka | **celica in števka** – kot v »Vadi v uganki«; mala števka je na telefonu 8–11 px |
| O2 | Več števk in celic | presek · unija · več števk naenkrat | **ena števka na klik, več celic, presek** – kot v igri |
| O3 | Stanje kandidatov, napačen odgovor | A: označi, nato preveri – napačno pobriše vse oznake · B: briši sproti z Razveljavi | **A** |
| O4 | Nepopoln odgovor | »Še ne«, ne šteje, oznake ostanejo · napačen | **»Še ne«, ne šteje** – kot »delno« v »Vadi v uganki« |
| O5 | 4 in 6 | izbris nadomesti izbiro števk · tri faze | **izbris nadomesti** – en način za vse |
| O6 | E1, E2 | brez 2. faze · z 2. fazo | **brez** |
| O7 | Rešena vaja, štetje | obe fazi, napake obeh faz štejejo · vsaka faza poskus · 2. faza ne šteje | **obe fazi; krog brez napak 9 / 9** |
| O8 | Namig v 2. fazi | število in števke · pravilo po tehniki | **število in števke** |
| O9 | Rešitev v 2. fazi | izbris najdenega vzorca, napačna oznaka s temno rdečim obročem · brez razlikovanja | **z razlikovanjem**; v 1. fazi kot zdaj |
| O10 | Drug veljaven vzorec | izbris sprejetega vzorca · vzorca generatorja | **sprejetega**; varovalo za prazen izbris |
| O11 | Sporočila, končno stanje | sporočilo koraka po 2. fazi, končno stanje kot zdaj | **tako** |
| O12 | Tipkovnica | Shift+števka in Escape · brez | **Shift+števka in Escape** |
| O13 | Kje je koda | `trening/izbris.js` · vse v `trening.js` | **`trening/izbris.js`** |

## 9. Izvedba

### Korak 1 – priprava testov (2026-10-09)

Aplikacija ni spremenjena (`app/`, `igra/`, `trening/`, `shared/` brez sprememb, oznaka različice ostane).

- **`tests/odgovor-spoznaj.js`** – `spremljajVajo(run)` (pred izrisom vaje: `vajaNaZaslonu` je vaja iz `genPoShemi()` ali
  `MODES[].gen` – vaji 1 in 2 po shemi nimata `zadnja` iz testov), `izberiVzorec(run)` (vzorec vaje po tehniki – kot
  so ga testi doslej izbirali vsak zase), `dokoncajOdgovor(dom, run)` (izbira je že nastavljena – s kliki ali s
  stanjem: »Preveri« in nadaljnje faze), `dokoncajDrugoFazo(dom, run)`, `odgovoriPravilno(dom, run)`. Faze po 1.
  prepozna iz strani (zdaj viden razdelek `.phase2` pri 4 in 6 → števke vzorca), ne iz tehnike.
  - **Odstopanje od načrta:** podpis `odgovoriPravilno(dom, run)` brez argumenta `tehnika` (tehniko vzame iz `mode`,
    vajo iz `vajaNaZaslonu`); poleg nje še `dokoncajOdgovor()` in `dokoncajDrugoFazo()`, ker veliko testov izbere
    vzorec s kliki ali izbere drug veljaven vzorec (3, 5, 7, 8) – ti po izbiri pokličejo `dokoncajOdgovor()`.
- **Testi, ki so prešli nanjo** (pričakovanja nespremenjena): `trening-legenda` (`odgovori()` in 1, 2),
  `trening-precrtanje` (9–12, 3, 5, drug vzorec trojice, 2. faza pri 4 in 6), `trening-stikalo` (1, 2, 3, 13, nova
  vaja; pri 4 2. faza), `trening-pomoc` (`pravilnoPar()`, `pravilnoPresek()`), `trening-resitev` (drug vzorec pri 5,
  7, 8), `trening-po-shemi` (pomožna `trening-po-shemi.js`: 7 in 8, 3–6, 9–13, 1 in 2), `veriga-prikaz` (»Spoznaj«
  13), `pocasni/trening-presek` (pravilen odgovor pri 1 in 2). `pocasni/trening-uganka-ui` v »Spoznaj« 1–13 ne
  odgovori (samo izbira uganke iz banke), zato ostane, kot je.
- Testi, ki namenoma preverjajo stanje **med** fazama 4 in 6 (»po 1. fazi še ni izbrisa«, »pravilna 1. faza Rešitev
  pusti«), naredijo 1. fazo sami in nato pokličejo `dokoncajDrugoFazo()`.
- **`tools/odgovor-spoznaj-brskalnik.js`** – `spremljajVajo(b)` (`window.vajaNaZaslonu`; `genPoShemi()` ovije samo, če
  obstaja – teče tudi v izhodiščih) in `dokoncajOdgovor(b)` (pravi klik »Preveri«, pri vidnem `.phase2` pravi kliki
  števk vzorca in »Preveri dve/tri števke«, po vsakem kliku `odmakniMisko()`; vrne števke 2. faze ali `null`).
  Scenariji, ki so prešli nanjo: `preveri-po-shemi-` (vse štiri skupine), `-izbira-` (pravilen odgovor – v
  izhodišču in novi kodi – in drug vzorec mečarice), `-vadi-` (»Spoznaj« 3, 7, 11), `-presek-` (1, 2) in
  `-vklop-brskalnik.js` (»Spoznaj« 13). `preveri-videz-brskalnik.js` v »Spoznaj« ne odgovarja.
  - **Odstopanje:** `preveri-izbira-brskalnik.js` je števke 2. faze pri 4 in 6 bral iz besedila »Rešitve«, zdaj jih
    da vaja (`targetDigits`) – v izhodišču in novi kodi enako.

### Korak 2 – osnova 2. faze in 3–6 (2026-10-09)

Korak ni razdeljen (D3) – 3–6 skupaj z osnovo.

- **`trening/izbris.js`** (O13, naloži se za `trening/v-uganki.js` in pred `trening/trening.js`): `presodiIzbris(izbris,
  oznake)` → `{ izid: 'prazno' | 'napacno' | 'delno' | 'pravilno', manjka }`, besedila (`IZBRIS_VZOREC_PRAVILEN`,
  `IZBRIS_PRAZEN_VZOREC`, `sporociloIzbrisa()` – »Še ne. Označeni kandidati res odpadejo, manjkata pa še 2 izbrisa.«,
  napačno s posledico tehnike), `namigIzbrisa()` (O8 – »Izbrisati je treba 6 kandidatov – števki 3 in 8.«) in
  `ustvariIzbris()` – niz »Izbriši kandidata · ↺ = vrni« (slogi `.niz-odstrani` iz `shared/plosca.css`) z vrstico za razlog,
  izbira celic (vse celice s kandidati, tudi celice vzorca), presek (O2a), ↺, tipkovnica (Shift+števka po `e.code`,
  Escape; števka brez Shift nič). Ključ oznake je celica · 10 + števka.
- **`trening/trening.js`:** pri 3–6 pravilna 1. faza ne šteje več in vodi v 2. fazo (`zacniIzbris()`): celice vzorca
  zelene, izbira 1. faze se izprazni, »Vzorec je pravilen. Zdaj izbriši kandidate, ki zaradi njega odpadejo.«, niz nad
  vrstico gumbov; »Preveri« ostane in presodi oznake (`checkIzbris()`). Pravilna 2. faza – vaja rešena, niz se skrije in
  odstrani iz DOM-a, končno stanje je enako kot pred nalogo po pravilnem odgovoru (razredi v istem vrstnem redu, pri 4 in 6
  mreža neklikljiva kot prej, izbira 1. faze obnovljena za »Rešitev« po odgovoru). Pri 4 in 6 odpadeta razdelek `.phase2` in
  `checkPhase2()` (O5), napačna 1. faza šteje (O7). Pri 3 in 5 je izbris izbris sprejetega vzorca (O10), varovalo za prazen
  izbris – vaja rešena po 1. fazi s »Ta vzorec ne izbriše nobenega kandidata.« Namig in Rešitev v 2. fazi (O8, O9;
  `legendaIzbrisa()`), osvežitev Rešitve ob oznaki, tipkovnica v 2. fazi (poslušalec `keydown`).
- **`trening/trening.css`:** `.cd.oznaka` (videz `elim`), `.cd.oznaka.peek-napacna` (brez črte, obroč
  `--okvir-napacno`), izbrana celica v 2. fazi `.gc.izbrana-izbris` (modra; na zeleni celici vzorca zelena podlaga z
  modrim okvirjem 3 px – izbira je ločen razred, zato se končni videz `.gc.correct` ne spremeni), niz `.izbris-faza`
  (gumbi v širini kartice), vzorček legende `.napacna-vzorec`.
- **`shared/engine.js`:** `TEHNIKE_OPISI[].navodilo` za 3–6 (»Izberi obe celici para, nato izbriši kandidate, ki zaradi
  njega odpadejo.«, pri trojicah »… vse tri celice trojice …, ki zaradi nje odpadejo.«).
- **Testi:** nov `tests/trening-izbris.test.js` (24 testov; na kodi pred korakom jih pade 21 – zeleni so samo čista presoja,
  krog 9 / 9 in pomožna funkcija, ki delujejo tudi na stari kodi). `tests/odgovor-spoznaj.js` opravi 2. fazo izbrisa
  (prepozna niz `.izbris-faza`) ali staro izbiro števk. `trening/izbris.js` je dodan na sezname skript v testih in v
  `tests/besedila-js.js`.
  - **Odstopanje:** `tests/trening-stikalo.test.js` (»4 · Skriti par: pravilna 1. faza Rešitev pusti«) je preverjal staro
    besedilo po 1. fazi (»Celici sta pravilni!«) – zdaj »Vzorec je pravilen.« (O11); namen testa ostane.
- **Brskalnik:** nov `tools/preveri-izbris-brskalnik.js` (3–6 pri 375 px z dotikom in 1280 px z miško; končno stanje enako
  izhodišču `705349a`; posnetka D2 `docs/slike/izbris/3-oznake-375.png` in `5-resitev-375.png`).
  `tools/odgovor-spoznaj-brskalnik.js` opravi 2. fazo s pravimi kliki celic in gumbov števk.
- **Izvzeto v primerjavah z izhodiščem (D1):** (1) navodila 3–6 – `NAVODILA_NAZAJ` v `tools/primerjava-slogov.js`
  preslika besedilo pod nalogo nazaj v strani pred meritvijo (daljše navodilo pri 3 in 5 se prelomi v vrstico več, zato
  samo preslikava niza HTML ne bi zadoščala – višine opisa in kartice); (2) razdelek `.phase2` izhodišča (izbira števk
  pri 4 in 6, O5 – v izhodišču je v DOM-u že pred 1. fazo, skrit) – skrit in odstranjen v obeh izrisih kot »Shema«.
  Velja v `preveri-presek-`, `-enojcki-`, `-vadi-`, `-izbira-` in `-izbris-brskalnik.js`; drugega se ne rahlja.
- **Drobni odstopanji od načrta:** legenda »Rešitve« v 2. fazi ima poleg treh postavk iz O9 še »celica izbrisa«, kadar so
  na mreži rožnate celice (kot legenda »Rešitve« v 1. fazi – sicer bi bila rožnata nepojasnjena); nepopoln odgovor ima modro
  sporočilo (`fb info`, kot »delno« v »Vadi v uganki«), prazen odgovor rdeče (kot »Izberi natanko dve celici.«).

