# Trening – učenje (vaji 1 in 2 po shemi, »Namig« in »Rešitev« kot stikali) – načrt

Načrt 2026-10-08 (vir: `docs/uskladitev.md`, »Vrstni red po fazi 6«, naloga 4a – pred nalogo 5, BUG+1; obe
postavki sta bili v »Kasneje«, zapisani ob ročnem pregledu XY-verige). **Stanje: potrjeno 2026-10-08** (commit načrta `b630fe9`; odločitve v razdelku 6), izvedba po korakih
(razdelek 7). O nalogi 5 (BUG+1) Darko odloči po tej nalogi.

**Dopolnitev 2026-10-08** (pred potrditvijo, Darkove odločitve): O8 spremenjen – pri 9 sta po shemi
vaja 1 (prva risba, Nebotičnik) in vaja 2 (druga risba, Zmaj); nova O16 – pri drugih tehnikah s shemo je
tudi vaja 2 po shemi, a obrnjeni čez diagonalo (vrstica postane stolpec). Preverba obrata je v razdelku
1.8, popravljeni so koraki (4), ročni pregled (5) in odločitve (6; novi še O17 in O18).

**Potrditev 2026-10-08:** O1–O16 po načrtu (O12 možnost B), O17 nove števke in polnila, **O18 drugače od
predloga** – pri 11 je vaja 2 zrcaljena levo-desno (stolpec 1 postane 9, 2 postane 8 …), oznaka »· po
shemi, zrcaljeno«; motor mora najti natanko ta korak (preverjeno, 1.8). Pravila izvedbe: vsak korak svoj
pogovor, commit in push; test pred spremembo; če pade test, ki ga načrt ne predvideva, se izvedba ustavi
in poroča (testa se ne prilagaja); manjkajoč del načrta s testom se sme popraviti in se poroča, razen če
bi popravek spremenil kaj zunaj načrta.

Izhodišče: commit `c7eb185`, vseh 640 testov zelenih v 2 min 19 s.

Številke v razdelkih 1.4 in 1.8 so **izmerjene** s skripti v začasni mapi (niso v repozitoriju) na banki
vaj in shemah iz `shared/sheme.js`, ne ocenjene.

## 0. Povzetek

- **Del A – vaji 1 in 2 po shemi.** Pri vseh 13 tehnikah s shemo (1–13) sta prvi dve vaji vsakega kroga
  »Spoznaj« narisani po shemi:
  - **vaja 1** natanko kot shema: iste celice, črke zamenjane s števkami;
  - **vaja 2** po shemi, obrnjeni čez diagonalo – vrstica postane stolpec (O16); pri 9 namesto obrata
    po drugi risbi, Zmaju (O8).
  
  Funkcija tehnike na obeh najde natanko korak sheme (vzorec in izbrise). Vaje 3–9 ostanejo, kot so; E1 in
  E2 (brez sheme) se ne spremenita.
- **Obrat deluje pri vseh tehnikah, kjer je predviden** (1–8, 10–13; razdelek 1.8): motor na obrnjeni vaji
  najde natanko obrnjen korak sheme, pri 1 in 2 na vseh 89 primernih stanjih iz banke. Pri 11 je vzorec
  sheme simetričen glede na diagonalo, zato je vaja 2 pri 11 namesto obrnjene zrcaljena levo-desno (O18).
- **Izvedljivo je pri vseh 13** (razdelek 1.4). Načini so trije:
  - **7, 8** neposredno iz sheme (mreža ene števke, samo x);
  - **3–6 in 9–13** sestavljena vaja kot zdaj, celice in črke iz sheme, drugi kandidati naključni in
    preverjeni z motorjem;
  - **1, 2** stanje prave uganke iz banke, premaknjeno na mesta sheme s simetrijo sudokuja.
- **Števke za črke so naključne** (O1), preslikava je napisana nad mrežo: »x = 4, y = 7«. Vaja 2 dobi nove
  števke (O17). Vrstica nad vajo ima »· po shemi«, pri vaji 2 »· po shemi, obrnjeno« (pri 9 »· po shemi«).
  Razdelek »Shema« je pri prvi vaji kroga vedno odprt (tako je že zdaj).
- **Del B – stikali.** Gumbe »(drži)« ima samo »Spoznaj« (vseh 15 tehnik). »Vadi v uganki«, igra in
  reševalec jih nimajo. »Namig« in »Rešitev« postaneta stikali: klik pokaže, klik skrije. Odprt je
  kvečjemu eden, kot v »Vadi v uganki«. Ob pravilnem odgovoru, novi vaji in vrnitvi na izbiro se zapreta,
  ob napačnem odgovoru ostaneta odprta.
- **Koraki:** pet majhnih (B najprej, nato A v štirih delih), vsak v svojem pogovoru, s commitom in
  pushem. Ročni pregled enkrat, na koncu.

## 1. Del A – vaji 1 in 2 »Spoznaj« po shemi

### 1.1 Kaj pomeni »enako kot shema«

Ta razdelek opisuje vajo 1. Vaja 2 je ista shema, obrnjena čez diagonalo (1.8); pri 9 je vaja 2 po drugi
risbi.

Shema je v `SHEME_TEHNIK` (`shared/sheme.js`). Celica sheme ima črke (x, y, z, a, b), »…« (drugi
kandidati), »-« (kandidat za izbris) ali je prazna. Prazna celica nima teh črk – lahko ima vpisano števko ali
samo druge kandidate. Vaja po shemi ima **iste celice na istih mestih**, črke so števke. Kar shema
pušča odprto (prazna celica, »…«), mora vaja povedati s števkami:

| Tehnika | Shema | Zdajšnja vaja | Vaja po shemi |
|---|---|---|---|
| 1, 2 | pas 3 × 9, samo x | delna mreža (blok in vrstica/stolpec, 15 celic) iz prave uganke iz banke | ista delna mreža na mestih sheme (zgornji pas, pri 1 blok 1 in vrstica 1, pri 2 blok 2 in vrstica 2); stanje prave uganke iz banke, premaknjeno s simetrijo (1.6) |
| 3–6 | ena vrstica | ena enota (vrstica, stolpec ali blok) s kandidati | vrstica; prazne celice sheme so dane števke, »…« so drugi kandidati (naključni, preverjeni) |
| 7, 8 | 9 × 9, samo x | mreža 9 × 9 za eno števko | natanko celice x iz sheme; nič ni treba dodati |
| 9 | 9 × 9, samo x (dve risbi: Nebotičnik, Zmaj) | cela mreža, prazne celice s števko in 1–2 drugima kandidatoma | celice x iz prve risbe (vaja 1) oz. druge risbe (vaja 2), vsaka z 1–2 drugima kandidatoma (kot zdaj); druge celice sive (rešene) |
| 10–13 | 9 × 9, več črk; drugi kandidati narisani samo v celicah vzorca | cela mreža, 8–11 praznih celic | vse celice s črko (23–46 praznih celic); celice vzorca natanko s črkami sheme, druge celice s črko dobijo polnila do vsaj treh kandidatov (O3) |

Pri 9 je vaja 1 po prvi risbi (Nebotičnik), vaja 2 po drugi (Zmaj z dvema vrvicama), obe neobrnjeni (O8).
Podtip se ujema z zdajšnjo izmenjavo: sode vaje (n = 0, 2, …) so Nebotičnik, lihe Zmaj.

### 1.2 Števke za črke (O1)

**Predlog: naključne** – ob vsaki vaji po shemi dobijo črke različne naključne števke, polnila pa
naključne druge števke. Preslikava je napisana nad mrežo (1.3).

- Shema sama pravi »x, y – poljubni različni števki«. Stalna preslikava (x = 1, y = 2 …) bi napeljevala,
  da je x vedno ista števka.
- Zamenjava števk ne spremeni nobenega koraka motorja (tehnike so enake za vse števke). Pri sestavljenih
  vajah se polnila poiščejo znova in preverijo (1.5), pri 1 in 2 se preslika celotno stanje uganke.
- Stalna preslikava bi bila samo malo preprostejša za teste; testi tečejo z `Math.random` s semenom, kot
  pri drugih generatorjih.
- **Vaja 2 dobi nove števke in polnila** (O17), pri 1 in 2 drug korak iz seznama semen (1.6). Ni vaja 1,
  samo obrnjena – isti odgovor bi si igralec zapomnil.

### 1.3 Kako uporabnik ve, da je to vaja po shemi (O2)

- **Vrstica nad vajo:** »11 · XY-krilo (XY-Wing) · Vaja 1 / 9 · po shemi«, pri vaji 2 »… · Vaja 2 / 9 · po
  shemi, obrnjeno«, pri 11 »· po shemi, zrcaljeno« (O18). Pri 9 je pri obeh vajah »· po shemi«.
- **Vrstica tik nad mrežo** (pod razdelkom »Shema«, razred `po-shemi`):
  - vaja 1: »Vaja po shemi zgoraj – iste celice, črke so števke: x = 4, y = 7, z = 2.«;
  - vaja 2: »Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črke so števke: x = 4, y = 7.«
    (pri 3–6 »vrstica sheme je stolpec«);
  - vaja 2 pri 11: »Vaja po zrcaljeni shemi zgoraj – stolpec 1 sheme je stolpec 9, stolpec 2 je stolpec 8
    …, črke so števke: x = 4, y = 7, z = 2.«;
  - pri 9: »Vaja po prvi risbi sheme zgoraj (Nebotičnik) – iste celice, …« in »Vaja po drugi risbi sheme
    zgoraj (Zmaj z dvema vrvicama) – iste celice, …«.
  
  Pri shemah s samo x: »… črka x je števka 4.«
- **Razdelek »Shema« je odprt.** `zacniKrog()` ga v »Spoznaj« odpre ob vsakem novem krogu, prva vaja kroga
  pa je vedno vaja po shemi – zato je ob njej shema vedno nad mrežo. Tu se nič ne spremeni. Pri vaji 2 je
  razdelek tak, kot ga je igralec pustil pri vaji 1 (stanje ostane med vajami kroga, kot zdaj); vrstica s
  preslikavo je tik pod njim.
- Shema sama (risba, legenda) se ne spremeni – ista je v Pomoči vseh treh aplikacij.

### 1.4 Izvedljivost – izmerjeno

**Vse sheme 1–13 se dajo izvesti.**

| Tehnika | Meritev | Izid |
|---|---|---|
| 1 · Izločitev izven bloka | vsa stanja »Vadi v uganki« vseh 315 ugank banke s to tehniko (1127 stanj): korak z obliko sheme (par, en izbris v vsakem od drugih dveh skladov), na delni mreži edini s to števko | **82 korakov v 38 ugankah**; pregled vse banke 14,8 s |
| 2 · Izločitev v bloku | 167 ugank, 293 stanj: trojica, izbrisa v drugih dveh vrsticah bloka in v različnih stolpcih | **7 korakov v 5 ugankah**; pregled 5,8 s |
| 3–6 | 2000 sestavljenih vaj po shemi z naključnimi števkami in polnili: (a) funkcija tehnike najde natanko korak sheme; (b) še lažje tehnike v enoti nič (enojčka, lažje podmnožice) | (a) 79–98 %, (b) **22–41 %** – iskanje s ponavljanjem je potrebno, en poskus traja pod 1 ms |
| 7, 8 | mreža iz sheme brez sprememb | vedno (to dokazuje že `tests/sheme.test.js`) |
| 9 | 300 vaj, x + 1–2 polnili | (a) **94 %** |
| 10–13 | 300 vaj, polnila do vsaj treh kandidatov zunaj vzorca | (a) **100 %** |

Pri 1 in 2 iskanje po vsej banki ob vaji traja predolgo (6–15 s). Zato bo seznam primernih semen izbran
vnaprej z orodjem in preverjen s testom (1.6). Pri 9–13 se lažje tehnike na polnilih oglasijo skoraj
vedno (skriti enojček na polnilni števki pri 100 % poskusov). To velja tudi za zdajšnje vaje teh tehnik –
glej 1.5 in O3.

Vse to velja tudi za vajo 2 – obrnjena vaja uspe natanko tedaj, ko uspe izvirna z istimi števkami in
polnili (1.8).

### 1.5 Kaj preveri motor (»natanko ta korak, kot pri shemi«)

Za shemo `tests/sheme.test.js` preveri dvoje: (1) funkcija tehnike na deski iz sheme najde natanko en korak
s celicami vzorca in izbrisi sheme; (2) lažje tehnike ne najdejo ničesar – razen pri shemah v eni
vrstici. Pri vaji po shemi velja:

| Tehnika | (1) natanko korak sheme | (2) lažje tehnike nič |
|---|---|---|
| 1, 2 | da – na stanju po premiku; na delni mreži ni drugega koraka iste tehnike s to števko (`presekEnolicen()`, kot zdaj) | da, na celi mreži – stanje »Vadi v uganki« je na poti motorja, kjer je ta tehnika prva, ki kaj najde |
| 3–6 | da – na deski kot v testu sheme (vrstica, druge celice prazne z vsemi kandidati) | da, **v enoti** (enojčka, lažje podmnožice) – strožje kot test sheme; »Preveri« pri 3 in 5 sprejme vsak vzorec v enoti, zato mora biti en sam |
| 7, 8 | da (ista deska kot v testu sheme) | da, brez golega enojčka (mreža ene števke – kot test sheme) |
| 9–13 | da – na deski vaje (sive celice, kandidati praznih celic), kot zdajšnji generatorji teh tehnik | **ne** – na polnilih se skoraj vedno kaj najde (1.4), enako kot pri zdajšnjih vajah; vzorec iz črk ostane brez lažjih tehnik, kot na shemi (O3) |

Pri 10–13 vsaka celica zunaj vzorca dobi vsaj tri kandidate. Zato so celice z dvema kandidatoma samo
celice vzorca. W-krilo, XY-krilo, edinstveni pravokotnik in XY-veriga potrebujejo celice z dvema
kandidatoma, zato drugega vzorca teh tehnik ne more biti. Motor to vseeno preveri ob vsaki vaji.

Pri vaji 2 velja vse v tabeli enako, na obrnjeni deski: motor najde natanko obrnjen korak sheme (pri 9
korak druge risbe, podtip Zmaj). Motor to preveri ob vsaki vaji 2 tako kot pri vaji 1 – obrat ni samo
razmislek (1.8).

### 1.6 Vaji 1 in 2 – prava uganka na mestih sheme (O4, O5)

Zdajšnji vaji 1 in 2 sta stanje prave uganke iz banke (`genPresek()`), ker so sestavljene vaje kazale
kandidate, ki jih vidne števke izključujejo. Vaja po shemi naj ostane prava uganka.

- **Simetrija.** Uganka ostane veljavna, če se zamenjajo pasovi, vrstice v pasu, skladi, stolpci v skladu,
  vrstice in stolpci (zrcaljenje čez diagonalo) ali števke. Vsak korak s pravo obliko se tako prenese na
  mesta sheme:
  - **1:** par v vrstici bloka, en izbris v vsakem od drugih dveh skladov → blok 1, vrstica 1, vzorec
    V1S1 in V1S3, izbrisa V1S4 in V1S8;
  - **2:** trojica, izbrisa v drugih dveh vrsticah bloka in v različnih stolpcih → blok 2, vrstica 2,
    vzorec V2S4–V2S6, izbrisa V1S5 in V3S4.
  
  Korak v stolpcu se pred tem prezrcali v vrstico.
- **Vaja 2 (O16)** je ista preslikava, na koncu pa še obrat čez diagonalo:
  - **1:** levi sklad, blok 1 in stolpec 1 – vzorec V1S1 in V3S1, izbrisa V4S1 in V8S1;
  - **2:** blok 4 in stolpec 2 – vzorec V4S2–V6S2, izbrisa V5S1 in V4S3.
  
  Vidna sta blok in stolpec (15 celic), kot pri zdajšnjih vajah 1 in 2 v stolpcu. Seznam semen je isti
  kot za vajo 1; vaja 2 vzame drug korak kot vaja 1 istega kroga (pri 1 je primernih korakov 82 v 38
  ugankah, pri 2 samo 7 v 5 ugankah – pri 2 se pari vaj 1 in 2 zato hitreje ponovijo, števke so vsakič
  nove).
- **Preslikava zajame vse stanje**: dane števke, vpise in kandidate. Korak (z besedilom) se nato znova
  poišče z motorjem na preslikanem stanju – to je hkrati preverba.
- **Seznam semen** (O4): orodje `tools/izberi-vaje-po-shemi.js` pregleda banko (pribl. 20 s) in izpiše
  semena s primernim korakom. Seznam `PRESEK_PO_SHEMI` v `trening/generators.js` je iz izpisa – ne na pamet.
  Test preveri, da vsako seme še da primeren korak. Ob vaji se izbere naključno seme
  (`genMinimalnaUganka(seme)`, stanja, prvi primeren korak, preslikava; pribl. 50–100 ms). Ob spremembi
  motorja ali generatorja test pade in orodje se požene znova – kot pri banki.
- **Prikaz** (O5): kot pri drugih vajah 1 in 2 – vidna sta blok in vrstica (15 celic). Druge x v pasu
  sheme so tam samo zato, da je shema veljavno stanje, in niso del naloge.
- **Trojica v krogu** (O9): v krogu 9 vaj ima zdaj vsaj ena vaja vzorec s tremi celicami (izbrana ob
  vaji 1). Pri 1 sta obe vaji po shemi para, zato se trojica izbere med vajami 3–9. Pri 2 sta trojici že
  obe vaji po shemi, zato se v vajah 3–9 nobena ne vsili.

### 1.7 Kaj ostane

- Vaje 3–9 kroga: isti generatorji z isto številko vaje (`M.gen(n)`, n = 2–8). Izmenjava po številki
  vaje (vrstice ali stolpci pri 7 in 8, vrsta enote pri 3–6, podtip pri 9, dolžina verige pri 13) ostane.
  Vaji po shemi nadomestita samo vaji 1 in 2, prek `renderExercise()` – `MODES[].gen` se ne spremeni.
- Vaja 2 se ujema z zdajšnjo izmenjavo: pri 3–6 je vaja 2 že zdaj stolpec (`['row','col','block'][n%3]`),
  pri 7 in 8 vzorec v stolpcih (`baseIsRow = n%2===0`), pri 9 Zmaj (`n%2`). Edina razlika je pri 13:
  shema ima verigo s petimi celicami, izmenjava dolžin (`4 + n%3`) bi dala pri vajah 1 in 2 dolžini 4
  in 5. Krog ima zato verige 5, 5, 6, 4, 5, 6, 4, 5, 6 – dolžina 4 ostane v vajah 4 in 7.
- E1, E2 (brez sheme), »Vadi v uganki«, igra, reševalec.
- Namig, Rešitev, »Preveri«, legenda in štetje rezultata delujejo pri vaji po shemi enako kot pri vaji
  iste tehnike – vaja ima ista polja. Vaja po shemi se šteje v rezultat (O7).
- Shema in njen test.

### 1.8 Vaja 2 – obrnjena shema (O16): preverba

**Obrat** je zrcaljenje čez glavno diagonalo: celica VrSc postane VcSr. Vrstice postanejo stolpci, bloki
ostanejo bloki (blok 2 ↔ 4, 3 ↔ 7, 6 ↔ 8, bloki 1, 5, 9 na mestu). Obrat je simetrija sudokuja, zato bi
morala biti vsaka tehnika na obrnjeni deski ista, z zamenjanimi vrsticami in stolpci. To je preverjeno s
programom na kodi motorja (skript v začasni mapi, pribl. 3 min):

- **A** – deska iz sheme kot v `tests/sheme.test.js`, obrnjena;
- **B** – naključne vaje po shemi s polnili, izvirna in obrnjena z istimi števkami (3–6: 2000 vaj vsake
  tehnike; 9–13: 300; 7, 8: vseh 9 števk). Primerja se množica **vseh** korakov **vseh** tehnik na
  obrnjeni deski z obrnjeno množico na izvirni;
- **C** – vaji 1 in 2: vsa primerna stanja iz banke (kot v 1.4), preslikana na mesta sheme in obrnjena.
  Vaja 2 je zgrajena z `vajaIzStanja()` na obrnjenem stanju, kot jo bo gradil trening.

| Tehnika | Vaja 2 | Izid |
|---|---|---|
| 1 · Izločitev izven bloka | levi sklad, blok 1, stolpec 1; vzorec V1S1, V3S1; izbrisa V4S1, V8S1 | **82 / 82** korakov (38 ugank): motor najde obrnjen korak sheme, `presekEnolicen()` drži, lažje tehnike nič, uganka ima eno rešitev |
| 2 · Izločitev v bloku | blok 4, stolpec 2; vzorec V4S2–V6S2; izbrisa V5S1, V4S3 | **7 / 7** (5 ugank), kot pri 1 |
| 3–6 | stolpec, izrisan navpično (kot zdajšnje vaje v stolpcu) | A: natanko obrnjen korak sheme. B: vsi koraki vseh tehnik = obrnjeni pri **vseh 2000** vajah vsake tehnike; uspeh (korak sheme edini v enoti, lažje tehnike v enoti nič) pri izvirni in obrnjeni vaji isti, vaja za vajo |
| 7 · X-krilo, 8 · Mečarica | vzorec v stolpcih, izbrisi v vrsticah (pri 7 so vogali V2S2, V2S7, V7S2, V7S7 na istih mestih – simetrični glede na diagonalo –, izbrisi pa v vrsticah 2 in 7 namesto v stolpcih) | A: natanko obrnjen korak, lažje nič. B: vsi koraki = obrnjeni pri vseh 9 števkah |
| 9 · Veriga ene števke | brez obrata – druga risba, Zmaj (O8) | A: natanko korak druge risbe, podtip Zmaj, lažje nič (to preverja že test sheme). B: s polnili kot vaja 1 – pribl. 93 % (Nebotičnik 94 %, 1.4). Obe risbi bi se dali tudi obrniti (A drži), a vaja 2 je po O8 Zmaj |
| 10 · W-krilo | povezava v stolpcu (V2S8–V8S8) | A: natanko obrnjen korak, lažje nič. B: vsi koraki = obrnjeni, uspeh **100 %** |
| 11 · XY-krilo | **zrcaljena levo-desno** (O18; obrnjena bi imela vzorec na istih mestih – pivot V2S2 in izbris V7S7 sta na diagonali, krili V2S7 in V7S2 zrcalni): pivot V2S8, krili V2S3 in V7S8, izbris V7S3 | obrat: kot 10, **100 %**; zrcaljenje: natanko zrcaljen korak, lažje nič, na 1000 vajah vsi koraki = zrcaljeni, **100 %** |
| 12 · Edinstveni pravokotnik | bloka 1 in 4 – eden nad drugim | kot 10, **100 %** |
| 13 · XY-veriga | veriga V2S2 – V7S2 – V8S3 – V8S8 – V4S8, izbris V2S8 | kot 10, **100 %**; veriga se začne v V2S2 kot na shemi, zato gredo zaporedne številke 1–5 po istih celicah sheme |

**Kje obrat ne bi deloval: nikjer.** Edina neskladnost, ki jo je program našel, ne zadeva vaj:

- **Kaj:** XY-veriga kot *druga* tehnika na deski. Na 14 deskah – 11 od 600 vaj 9 s polnili (pri primerjavi
  sta bili obrnjeni obe risbi) in 3 od 82 stanj tehnike 1 – motor na obrnjeni deski pokaže drugo verigo
  kot na izvirni (obrnjeni). Izbrisi so pri obeh enaki.
- **Zakaj:** izbrise določata konca in števka z. Med enako dolgimi verigami z istima koncema pa motor izbere
  leksikografsko najmanjše zaporedje celic. Obrat spremeni številke celic, zato motor izbere drugo, enako
  dolgo verigo z istima koncema (druge celice v sredini). Iz istega razloga se lahko obrne smer zapisa:
  veriga je zapisana od konca z nižjim položajem.
- **Zakaj ne vpliva na vaje:** vse druge tehnike (E1, E2, 1–12) so skladne na vseh deskah, tudi tehnika
  vaje. Pri vaji 13 so celice z dvema kandidatoma samo celice vzorca (1.5), zato je veriga ena sama – na 300
  vajah 0 neskladij. Konec z nižjim položajem je pri shemi in obrnjeni shemi isti (V2S2), zato tudi smer
  ostane. Pri 1, 2 in 9 se XY-veriga ne preverja in ne prikazuje.

**Obrat deluje povsod, pri 11 pa je malo viden.** Vzorec XY-krila na shemi je simetričen glede na
diagonalo, zato bi bila obrnjena vaja 2 pri 11 po obliki vzorca enaka vaji 1. **Odločitev O18: pri 11 je
vaja 2 zrcaljena levo-desno** (VrSc → VrS(10 − c): stolpec 1 postane 9, 2 postane 8 …; skladi se
zamenjajo, stolpci v skladu obrnejo – tudi to je simetrija sudokuja). Vzorec: pivot V2S8, krili V2S3
{x, z} in V7S8 {y, z}, izbris z iz V7S3. Preverjeno kot obrat: na deski iz zrcaljene sheme funkcija
XY-krila najde natanko en korak – zrcaljen korak sheme –, lažje tehnike nič; na 1000 vajah s polnili so
vsi koraki vseh tehnik natanko zrcaljeni koraki izvirne (0 neskladij), uspeh 100 %.

**Vaja 2 kaže tudi vrstico »Enako velja …« pod shemo.** Pri 1 in 2 je to »Enako velja za stolpec namesto
vrstice«, pri 3–6 »… za stolpec ali blok«, pri 7 in 8 »… z zamenjanimi vrsticami in stolpci«. Opomba
sheme 12 »Bloka sta lahko tudi eden nad drugim« in opomba 10 »Povezava je lahko tudi stolpec …« sta pri
vaji 2 narisani.

## 2. Del B – »Namig« in »Rešitev« kot stikali

### 2.1 Kje so gumbi »(drži)«

| Kje | Gumbi | Delovanje zdaj |
|---|---|---|
| Trening, »Spoznaj« (vseh 15 tehnik) | »Namig (drži)«, »Rešitev (drži)« | pokažeta pomoč, dokler gumb držiš (`mousedown`/`touchstart` do `mouseup`/`mouseleave`/`touchend` v `trening/trening.js`) – **edino mesto** |
| Trening, »Vadi v uganki« | »Namig«, »Rešitev« | klik odpre okvir, »Skrij« v okvirju ga zapre; odprt je en okvir (vsebino zamenja drug gumb); ostane ob potezah, pravilen odgovor ga zapre |
| Igra | »Naslednji korak« → »Pokaži več« → »Pokaži rešitev«, »Skrij«; »Preveri« | klik; brez »drži« |
| Reševalec | »Pokaži/Skrij kandidate«, »Pokaži/Skrij korake reševanja«, »Pokaži na mreži ▾ / Skrij mrežo ▴«, povečan prikaz z dotikom | klik; brez »drži« |

Sprememba je torej samo v »Spoznaj«. Pri »Vadi v uganki« je predlagana še majhna uskladitev (O14).

### 2.2 Obnašanje stikal

- **Klik pokaže, klik skrije.** Gumba se odzivata na `click` – miška, dotik in tipkovnica (Enter/preslednica
  na gumbu) delujejo enako. Besedilo se da brati in stran drseti.
- **Napis** (O10): zaprto »Namig« / »Rešitev«, odprto »Skrij namig« / »Skrij rešitev«, kot »Pokaži/Skrij
  kandidate« v reševalcu. Odprt gumb ima vidno pritisnjen slog (`aria-pressed="true"`).
- **Odprt je kvečjemu eden** (O11), kot v »Vadi v uganki«: klik na drugi gumb zamenja vsebino.
- **Pomoč se šteje ob prvem odprtju**, kot zdaj ob prvem pritisku (`oznaciPomoc()`). Zapiranje in ponovno
  odpiranje ne spremenita ničesar.
- **Izbira ob odprti Rešitvi** (O12, odločeno B): izbira deluje naprej, oznake Rešitve se sproti prilagodijo
  izbiri. Okvir pove, kaj je pravilno in kaj ne; pri 3, 5, 7 in 8 se prikazani vzorec lahko zamenja
  (`vzorecResitve()`). To je isto, kot je zdaj pri vsakem novem pritisku z drugo izbiro, le brez spuščanja.
  Pri 1 in 2 se izbira med Rešitvijo zdaj ne vidi (mreža skrije izbiro, dokler je korak prikazan). Pri
  stikalu bo vidna, sicer klik v mrežo ne bi imel vidnega učinka – po pravilnem odgovoru je izbire še
  vedno konec. Pri E1 in E2 plošča oznake koraka in izbiro že izriše skupaj.
  
  Možnost A: klik v mrežo Rešitev zapre, kot prej spust gumba.
- **Namig** je samo besedilo in ostane odprt med izbiro.

### 2.3 »Preveri«, naslednja vaja, vrnitev na izbiro

| Dogodek | Namig / Rešitev | Zakaj |
|---|---|---|
| »Preveri« – napačen odgovor | ostane odprt; izbira se izprazni (kot zdaj), oznake Rešitve se prilagodijo prazni izbiri | kot v »Vadi v uganki«; za naslednji poskus ni treba znova odpirati |
| »Preveri« – pravilen odgovor (vaja rešena, tudi 2. faza pri 4 in 6) | **se zapre**, gumb dobi napis »Namig« / »Rešitev« | oznake odgovora in Rešitve bi se prekrivale, legenda bi bila dvakrat; kot v »Vadi v uganki« (O13) |
| »Preveri« – pravilna 1. faza pri 4 in 6 (izbira števk še sledi) | ostane odprt | vaja še ni rešena |
| Ogled po pravilnem odgovoru | deluje kot zdaj (vaja se ne šteje drugače) | – |
| »Naslednja vaja →« / »Končaj« | zaprto – nova vaja se izriše na novo | pomoč velja za eno vajo; »s pomočjo« se ponastavi kot zdaj |
| »← Nazaj na izbiro« in nov krog | zaprto | isto |
| Razlaga in Shema | se ne spremenita (zložljiva, ostaneta med vajami kroga) | nista pomoč |

### 2.4 »Vadi v uganki« (O14)

Predlog: drugi klik na gumb odprtega okvirja okvir zapre, napis in slog kot v 2.2. »Skrij« v okvirju
ostane, ker je okvir z rešitvijo lahko dolg. Drugega se nič ne spremeni (okvir ostane ob potezah,
pravilen odgovor ga zapre). Tako »Namig« in »Rešitev« v treningu povsod delujeta enako.

### 2.5 Kaj s tem odpade

- Postavka v »Kasneje«: »Namig (drži)« in »Rešitev (drži)« se ob pritisku takoj skrijeta, če je stran
  pomaknjena do konca. Stikalo se ob premiku strani ne zapre.
- Obvodi v scenarijih za brskalnik (`preveri-vadi-brskalnik.js` dela prostor pod vsebino,
  `preveri-izbira-brskalnik.js` sproži »Rešitev« z dogodkom v strani zaradi `mouseleave` ob posnetku).
- Besedilo v Pomoči treninga (»… pokažeta pomoč, dokler gumb držiš …«) se spremeni.

## 3. Kaj vidi uporabnik

- **Vaja 1 »Spoznaj«** pri 1–13: nad mrežo odprta shema, pod njo vrstica »Vaja po shemi zgoraj – iste
  celice, črke so števke: x = 4, y = 7.« in mreža z vzorcem na istih mestih kot na shemi. V vrstici nad
  vajo »· po shemi«. Naloga, »Preveri«, Namig in Rešitev so kot pri drugih vajah te tehnike.
  - 1, 2: zgornji pas, blok in vrstica kot na shemi, prava uganka z danimi števkami in kandidati.
  - 3–6: vrstica; kjer je na shemi prazna celica, je dana števka.
  - 7, 8: števka na natanko istih mestih kot x na shemi.
  - 9–13: gostejša mreža kot pri drugih vajah (23–46 praznih celic, drugod 8–11). Celice zunaj vzorca
    imajo poleg črk še 1–2 kandidata, ki jih shema ne riše.
- **Vaja 2** pri 1–8, 10, 12 in 13: ista shema, obrnjena čez diagonalo, z novimi števkami. V vrstici nad vajo
  »· po shemi, obrnjeno«, nad mrežo »Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črke so
  števke: …«. Kar je na shemi v vrstici, je v stolpcu:
  - 1, 2: levi sklad, blok in stolpec;
  - 3–6: stolpec, izrisan navpično;
  - 7, 8: vzorec v stolpcih, izbrisi v vrsticah;
  - 10: povezava v stolpcu; 12: bloka eden nad drugim; 13: veriga z istim začetkom in številčenjem;
  
  Pri 11 je vaja 2 zrcaljena levo-desno, »· po shemi, zrcaljeno«: pivot V2S8, krili V2S3 in V7S8 (1.8,
  O18). Pri 9 je vaja 2 Zmaj z dvema vrvicama po drugi risbi, neobrnjen, »· po shemi«.
- **Vaje 3–9** so take kot zdaj.
- **»Namig« in »Rešitev«** v »Spoznaj« se odpreta s klikom in ostaneta odprta. Besedilo je berljivo, stran
  se da drseti, izbira deluje. Zapreta se z drugim klikom (napis »Skrij …«), s pravilnim odgovorom ali z
  novo vajo. V »Vadi v uganki« okvir zapre tudi drugi klik na gumb.

## 4. Koraki

Predlagani vrstni red: **B najprej** (O15). Del B je manjši in samostojen. Šest testnih datotek in štirje
scenariji, ki zdaj držijo »Rešitev« z `mousedown`/`mouseup`, preidejo na klik enkrat. Novi testi dela A
potem že uporabljajo stikalo.

**Pravila za vse korake:**

- vsak korak v svojem pogovoru, s commitom in pushem;
- najprej test, ki na stari kodi pade (in pove, kaj manjka), nato sprememba;
- testi, ki jih je treba prestaviti, se prestavijo pred spremembo – na stari kodi morajo ostati zeleni;
- sproti hitri testi, pred commitom vsi, posnetek igre (`tools/posnetek-igre.js --primerjaj`, igra se ne
  spremeni – pričakovano brez razlik) in scenarij koraka v brskalniku brez glave;
- `CLAUDE.md`, ta načrt (razdelek 7 »Izvedba«) in `docs/uskladitev.md` se dopolnijo v istem commitu;
  oznaka različice prek pre-commit hooka.

### Korak 1 – del B: »Namig« in »Rešitev« kot stikali

- **Kaj:** `trening/trening.js` – gumba se odzivata na `click`, stanje odprtega okvirja (namig / rešitev /
  nič), napis in `aria-pressed`, osvežitev oznak Rešitve ob spremembi izbire (klik celice pri 3–13,
  `obKliku` delne mreže pri 1 in 2), izbira vidna med Rešitvijo pri 1 in 2, zaprtje ob rešeni vaji.
  `trening/v-uganki.js` – drugi klik zapre (O14). `trening/trening.css` – pritisnjen slog.
  `trening/index.html` – besedilo Pomoči.
- **Test pred spremembo:** nov `tests/trening-stikalo.test.js` (nadomestni DOM). Preveri:
  - klik pokaže, drugi klik skrije (oznake na mreži in okvir), napis in `aria-pressed`;
  - Namig in Rešitev se izključujeta;
  - pomoč se šteje ob prvem odprtju in nato nič več;
  - izbira ob odprti Rešitvi – pri 5 drug veljaven vzorec zamenja prikazani vzorec, pri 1 in 2 je izbira
    vidna;
  - »Preveri« napačno (ostane) in pravilno (zapre), tudi 2. faza pri 4;
  - nova vaja, »Nazaj na izbiro« in nov krog (zaprto);
  - E1/E2;
  - »Vadi v uganki«: drugi klik zapre;
  - v Pomoči treninga ni »(drži)«.
  
  Na stari kodi pade (klik ne naredi ničesar).
- **Prestavljeni testi:** pomožne funkcije v `trening-pomoc`, `trening-legenda`, `trening-resitev`,
  `trening-precrtanje`, `veriga-prikaz` in `pocasni/trening-presek` – »drži in spusti« postane »klik, klik«.
  Pričakovanja ostanejo.
- **Brskalnik:** `tools/brskalnik.js` dobi `tapni(izbirnik)` (dotik prek `Input.dispatchTouchEvent`).
  Nov `tools/preveri-stikalo-brskalnik.js` pri 375 (dotik) in 1280 px (miška):
  - okvir ostane po kliku in po drsenju strani;
  - na dnu strani (1280 × 1000) ostane odprt – na izhodišču se skrije; scenarij pokaže, da je napaka iz
    »Kasneje« odpravljena (popravek ob izvedbi: izhodišče je `4e1e4dc`, kjer je bila napaka izmerjena –
    v `c7eb185` se v brskalniku brez glave ne pokaže več, razdelek 7);
  - besedilo okvirja se da označiti;
  - pritisnjen slog (izračunan);
  - brez preliva in napak JS.
  
  Štirje obstoječi scenariji »Rešitev« odprejo s klikom (izhodišče s pritiskom – po napisu gumba).
  Primerjave »Spoznaj« z izhodiščem izpustijo vrstico gumbov `.peek-row` (edina namerna razlika).
- **Kaj ujame avtomatika:** delovanje stikal, štetje pomoči, zapiranje ob dogodkih, izbira med Rešitvijo,
  da se »Spoznaj« drugače ne spremeni, napako na dnu strani, dotik v emulaciji.
- **Česa ne:** pravega dotika na telefonu (dvojni dotik, povečava, odziv brskalnika) – ročni pregled,
  točka 1.

### Korak 2 – del A, osnova ter 7 in 8

- **Kaj:**
  - `trening/generators.js`: `genPoShemi(mode, n)` – n = 0 vaja 1, n = 1 vaja 2 (obrnjena, pri 9 druga
    risba); `null` pri tehniki brez sheme ali še ne narejeni. Preslikava črk v števke, obrat čez
    diagonalo (`obrniCelico(i)` – VrSc → VcSr, za celice, kandidate in izbrise), vaji 7 in 8 iz sheme;
  - `trening/trening.js`: v `renderExercise()` pri »Spoznaj« in vajah 1 in 2
    `genPoShemi(mode, exNum) || M.gen(exNum)`, »· po shemi« / »· po shemi, obrnjeno«, vrstica s preslikavo;
  - `trening/trening.css`: slog vrstice.
- **Priprava (pred spremembo, zelena na stari kodi):**
  - testi, ki vajo 1 ali 2 kroga uporabljajo kot naključno vajo, preidejo na vajo 3 ali poznejšo z isto
    vrsto vaje (vrsta je po `n % 3` pri 3–6 in po `n % 2` pri 7–10 in 13 – npr. vrstica pri 3–6 je vaja 4,
    stolpci pri 7 vaja 4, Nebotičnik vaja 3): `trening-resitev` (išče vajo z drugim veljavnim vzorcem),
    `trening-precrtanje`, `veriga-prikaz`, `trening-legenda`, po potrebi še drugi – seznam se ugotovi z
    zagonom testov na kodi s spremembo;
  - primerjave »Spoznaj« z izhodiščem v `preveri-presek-`, `-enojcki-`, `-vadi-` in
    `-izbira-brskalnik.js` primerjajo vajo 3: seme se nastavi po izrisu vaje 2, trojica pri 1 in 2 se
    nastavi izrecno.
- **Test pred spremembo:** nov `tests/trening-po-shemi.test.js`, raste po korakih. Za 7 in 8 preveri:
  - vaja 1: celice vaje = celice x sheme, vzorec in izbrisi iz sheme;
  - vaja 2: celice, vzorec in izbrisi = obrnjena shema (obrat izračunan v testu iz `SHEME_TEHNIK`, ne s
    kodo treninga);
  - funkcija tehnike najde natanko korak sheme (pri vaji 2 obrnjen);
  - »Preveri« s celicami vzorca → »Pravilno!«, »Rešitev« pokaže celice sheme;
  - oznaka »· po shemi« (vaja 1) in »· po shemi, obrnjeno« (vaja 2) ter preslikava v besedilu;
  - pri istem semenu je vaja 3 enaka izhodu starega generatorja;
  - E1 in »Vadi v uganki« sta nespremenjena;
  - pravila besedil (brez »številk«, ločila).
  
  Na stari kodi pade.
- **Brskalnik:** nov `tools/preveri-po-shemi-brskalnik.js` (raste po korakih) pri 375 in 1280 px:
  - shema odprta nad mrežo;
  - celice na mreži (iz DOM) = celice sheme (iz `SHEME_TEHNIK`) pri vaji 1 in obrnjene sheme pri vaji 2;
  - vrstica s preslikavo v kartici;
  - pravi kliki na celice vzorca → »Pravilno!« (vaji 1 in 2);
  - brez preliva in napak JS.
- **Kaj ujame avtomatika:** mesta celic, korak motorja, nespremenjene druge vaje, besedila, postavitev.
  **Česa ne:** ali je povezava s shemo in z obrnjeno shemo razumljiva (ročni pregled).

### Korak 3 – del A, 3–6

- **Kaj:** vaja 1 vrstica iz sheme, vaja 2 stolpec (obrnjena shema, izrisan navpično kot zdajšnje vaje v
  stolpcu); prazne celice so dane števke, »…« so polnila. Iskanje s ponavljanjem (1.4: uspe 22–41 %
  poskusov, poskus pod 1 ms), merila iz 1.5. `solutionMessage` iz `subsetSolutionMessage()`, kot zdaj.
- **Test pred spremembo:** `trening-po-shemi` za 3–6 (na 200 vajah 1 in 200 vajah 2 s semenom):
  - mesta, dane števke na mestih praznih celic sheme; pri vaji 2 enota stolpec (`unitType: 'col'`);
  - natanko korak sheme, v enoti brez lažjih tehnik, pri 3 in 5 en sam vzorec;
  - vsaka celica s kandidati ima vsaj dva, vsaka nevpisana števka je v vsaj dveh celicah;
  - »Preveri« (pri 4 in 6 z 2. fazo).
- **Brskalnik:** scenarij koraka 2 za 3–6 (vaja 2: stolpec v kartici pri 375 px).
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** berljivost (ročni pregled, točka 2).

### Korak 4 – del A, 9–13

- **Kaj:** cela mreža iz sheme – pri 9 vaja 1 prva risba, vaja 2 druga risba; pri 10, 12 in 13 vaja 2 obrnjena, pri 11 zrcaljena levo-desno (O18).
  Celice s črko so prazne celice vaje, druge sive. Polnila: pri 9 1–2 na celico; pri 10–13 do vsaj treh
  kandidatov zunaj vzorca, celice vzorca natanko s črkami, »…« v celici vzorca 1–2 polnili. Ponavljanje do
  preverbe. Polja kot pri zdajšnjih vajah (pri 9 `digit` in `variant`, pri 13 `z` in `solutionVeriga`).
- **Test pred spremembo:** `trening-po-shemi` za 9–13 (200 vaj 1 in 200 vaj 2 vsake):
  - mesta, celice vzorca in izbrisi = shema (pri vaji 2 obrnjena, pri 11 zrcaljena, pri 9 druga risba);
  - oznaka »· po shemi, zrcaljeno« in vrstica o zrcaljenju pri 11;
  - funkcija tehnike natanko korak sheme, pri 9 podtip po risbi (vaja 1 Nebotičnik, vaja 2 Zmaj);
  - celice z dvema kandidatoma samo v vzorcu (10–13);
  - »Preveri« → »Pravilno!«, »Rešitev«, številke verige pri 13 (pri vaji 2 veriga z začetkom v V2S2, kot
    na shemi).
- **Brskalnik:** scenarij za 9–13 pri 375 px (vaji 1 in 2):
  - mreža v kartici, brez preliva;
  - male števke berljive (velikost);
  - posnetek gostote za ročni pregled.
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** ali je gosta mreža na telefonu še pregledna (ročni
  pregled, točka 2).

### Korak 5 – del A, 1 in 2

- **Kaj:**
  - nov `tools/izberi-vaje-po-shemi.js` (izpiše semena);
  - seznam `PRESEK_PO_SHEMI` v `trening/generators.js`;
  - preslikava stanja s simetrijo (1.6), pri vaji 2 še obrat; vaja 2 vzame drug korak kot vaja 1;
  - trojica v krogu po novem (O9): pri 1 med vajami 3–9, pri 2 nobena vsiljena;
  - `CLAUDE.md`: orodje se požene ob spremembi motorja ali generatorja (kot banka).
- **Test pred spremembo:** `trening-po-shemi` za 1 in 2:
  - vsako seme iz seznama da primeren korak;
  - po preslikavi so vidne celice natanko blok in vrstica sheme (vaja 2: blok in stolpec obrnjene sheme),
    vzorec in izbrisi = shema (vaja 2: obrnjena);
  - uganka ima eno rešitev, števke na mreži so iz rešitve, kandidati se ujemajo z vidnimi števkami;
  - motor najde korak, `presekEnolicen()`, lažje tehnike nič (vaji 1 in 2);
  - vaji 1 in 2 istega kroga imata različna koraka;
  - trojica v krogu (pri 1 vsaj ena med vajami 3–9, pri 2 sta trojici vaji 1 in 2);
  - »Preveri« → »Pravilno!«.
  
  `pocasni/trening-presek.test.js`: pravilo trojice v krogu po novem.
- **Brskalnik:** scenarij za 1 in 2 (delna mreža na mestih sheme in obrnjene sheme, oznake roba, pravi
  kliki).
- **Kaj ujame avtomatika:** vse zgoraj. **Česa ne:** razumljivost skritih celic pasu (ročni pregled,
  točka 3).

### Zaključek

Ročni pregled (razdelek 5), vpis v `docs/rocni-test.md`, `docs/uskladitev.md` (naloga 4a zaključena,
naslednja je odločitev o nalogi 5).

## 5. Ročni pregled (enkrat, na koncu naloge)

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | trening, »Spoznaj«, pravi telefon | 11 · XY-krilo: tapni »Rešitev«, preberi besedilo, podrsaj stran gor in dol, tapni »Skrij rešitev«; nato tapni »Namig« in »Rešitev« zapored. | Ostane odprta med branjem in drsenjem, brez povečave ob dotiku in brez »dvojnega« odziva; drugi gumb zamenja vsebino. | Dotik je v brskalniku brez glave samo posnemanje – pravi telefon ima svoje zamike, povečavo in odziv na dvojni dotik. |
| 2 | trening, »Spoznaj«, telefon | Vaji 1 in 2 pri 4 · Skriti par, 10 · W-krilo, 11 · XY-krilo in 13 · XY-veriga, vaja 2 pri 9 · Veriga ene števke: primerjaj mrežo s shemo nad njo. | Takoj vidiš, da je vaja 1 narisana po shemi, vaja 2 po obrnjeni shemi (vrstice so stolpci), pri 9 po drugi risbi; preslikava »x = …« in pojasnilo obrata sta jasna; pri 11 je jasno, da je vaja 2 zrcaljena levo-desno (O18); gosta mreža pri 10 in 13 je še pregledna. | Presoja razumljivosti in preglednosti. |
| 3 | trening, »Spoznaj« | Vaji 1 in 2 pri 1 · Izločitev izven bloka in 2 · Izločitev v bloku. | Jasno je, da sta blok in vrstica (pri vaji 2 blok in stolpec) ista kot na shemi (pri vaji 2 na obrnjeni), čeprav shema kaže ves pas. | Presoja (O5). |
| 4 | trening, »Spoznaj« | 3 · Očitni par (vaja 2): odpri »Rešitev«, nato izberi eno celico vzorca in eno zunaj njega; odgovori napačno, nato pravilno. | Okvirji izbire se sproti spreminjajo (zelen / temno rdeč); ob napačnem odgovoru Rešitev ostane, ob pravilnem se zapre. Obnašanje je razumljivo. | Presoja, ali je sprotno prilagajanje (O12) razumljivo. |
| 5 | trening, »Vadi v uganki« | 4 · Skriti par: odpri »Namig«, zapri ga z drugim klikom; odpri »Rešitev«, zapri jo s »Skrij«. | Oba načina delujeta; napis in slog gumba sta jasna. | Presoja skladnosti z »Spoznaj«. |

## 6. Odločitve

Potrjeno 2026-10-08: O1–O16 po predlogu (O8 in O16 že prej Darkovi), O17 po predlogu, O18 drugače.

| # | Vprašanje | Možnosti | Predlog / odločitev |
|---|---|---|---|
| O1 | Števke za črke | stalne (x = 1, y = 2 …) · naključne | **naključne**, preslikava napisana nad mrežo (1.2) |
| O2 | Kako uporabnik ve, da je vaja po shemi | samo »· po shemi« nad vajo · še vrstica s preslikavo · nič | **»· po shemi« in vrstica s preslikavo** (vaja 2 »· po shemi, obrnjeno« in »Vaja po obrnjeni shemi zgoraj – …«); shema je ob prvi vaji vedno odprta (1.3) |
| O3 | Drugi kandidati pri 9–13 | 1–2 polnili (pri 10–13 vsaj trije kandidati zunaj vzorca) · vsi drugi kandidati, kot v testu sheme (lažje tehnike nič, a celice s 6–8 kandidati) | **1–2 polnili** – kot zdajšnje vaje teh tehnik, berljivo; posnetek obeh na željo |
| O4 | Vaji 1 in 2 | prava uganka iz banke, premaknjena s simetrijo · sestavljena vaja | **prava uganka**; seznam semen izbere orodje, preveri test (1.6) |
| O5 | Prikaz pri 1 in 2 | blok in vrstica (15 celic) · ves pas 3 × 9 kot na shemi | **blok in vrstica**, kot druge vaje 1 in 2 |
| O6 | Kdaj je vaja po shemi | vaji 1 in 2 vsakega kroga · samo prvič v seji | **vsakega kroga** |
| O7 | Rezultat | šteje · ne šteje | **šteje**, kot druge vaje |
| O8 | Pri 9 dve risbi | samo Nebotičnik (vaja 1) · še Zmaj kot vaja 2 po shemi | **odločeno 2026-10-08: še Zmaj** – vaja 1 po prvi risbi (Nebotičnik), vaja 2 po drugi (Zmaj), obe neobrnjeni (1.1); prej predlog »samo vaja 1« |
| O9 | Trojica v krogu pri 1 in 2 | pri 1 med vajami 3–9, pri 2 sta trojici vaji 1 in 2 po shemi · kot zdaj | **tako** (1.6) |
| O10 | Napis stikal | »Skrij namig« / »Skrij rešitev« in pritisnjen slog · napis ostane, samo slog | **»Skrij …« in slog**, kot »Pokaži/Skrij« v reševalcu |
| O11 | Namig in Rešitev hkrati | kvečjemu eden odprt · neodvisna | **kvečjemu eden**, kot v »Vadi v uganki« |
| O12 | Izbira ob odprti Rešitvi | A: klik v mrežo zapre Rešitev · B: ostane odprta, oznake sledijo izbiri (pri 1 in 2 je izbira vidna) | **odločeno 2026-10-08: B** – kot nov pritisk z drugo izbiro zdaj, brez spuščanja |
| O13 | »Preveri« | pravilen odgovor zapre, napačen pusti · vedno zapre | **pravilen zapre, napačen pusti**, kot v »Vadi v uganki« |
| O14 | »Vadi v uganki« | tudi drugi klik zapre (»Skrij« ostane) · brez sprememb | **tudi drugi klik zapre** – enako v vsem treningu |
| O15 | Vrstni red | B najprej · A najprej | **B najprej** (razdelek 4) |
| O16 | Vaja 2 pri tehnikah s shemo (razen 9) | po shemi, obrnjeni čez diagonalo · kot zdaj | **odločeno 2026-10-08: obrnjena** – vaja 1 natanko kot shema, vaja 2 obrnjena (vrstica postane stolpec), nad vajo »· po shemi, obrnjeno«; vaje 3–9 kot zdaj; deluje pri vseh (1.8) |
| O17 | Števke in uganka vaje 2 | nove naključne (pri 1 in 2 drug korak s seznama) · iste kot vaja 1, samo obrnjene | **odločeno 2026-10-08: nove** števke in polnila – vaja 2 je nova naloga, isti odgovor bi si igralec zapomnil (1.2) |
| O18 | Vaja 2 pri 11 · XY-krilo (vzorec sheme je simetričen glede na diagonalo – po obratu na istih mestih) | obrnjena kot drugod · vaja 2 kot zdaj (`M.gen(1)`) · zrcaljena levo-desno | **odločeno 2026-10-08: zrcaljena levo-desno** (stolpec 1 postane 9 …), oznaka »· po shemi, zrcaljeno«; motor najde natanko zrcaljen korak (1.8); predlog je bil »obrnjena kot drugod« |

## 7. Izvedba

### Korak 1 – del B: »Namig« in »Rešitev« kot stikali (2026-10-08)

- **Koda:**
  - `trening/trening.js`: gumba se odzivata na `click` (`preklopiPomoc()`), stanje `odprto` (null / 'namig' /
    'resitev'), napis in `aria-pressed` (`napisiPomoci()`). `osveziPomoc()` ob kliku celice (`makeCell`,
    X-krilo in mečarica, delna mreža 1 in 2) na novo izriše »Rešitev«. »Preveri« gre prek
    `preveriSPomocjo()`: pomoč se pred presojo skrije in po njej znova odpre, pri rešeni vaji ostane
    zaprta. Pri 1 in 2 je izbira ob odprti »Rešitvi« vidna (`izbrane: korak && vajaResena ? [] : selected`).
    Ime `preveriVajo` ni bilo mogoče, ker je to funkcija v `shared/vaje-uganka.js`.
  - `trening/v-uganki.js`: drugi klik na gumb odprtega okvirja ga zapre (O14), napisa in `aria-pressed`.
  - `trening/trening.css`: pritisnjen slog `.peek-row button[aria-pressed="true"]` (podlaga okvirja
    #FFFCE8, polna obroba) – velja tudi v »Vadi v uganki«.
  - `trening/index.html`: besedilo Pomoči (»… odpreš s klikom in zapreš z drugim klikom …«).
- **Testi:** nov `tests/trening-stikalo.test.js` (12 testov; na kodi pred korakom vsi padli). Pomožne
  funkcije šestih testov (`trening-pomoc`, `trening-legenda`, `trening-resitev`, `trening-precrtanje`,
  `veriga-prikaz`, `pocasni/trening-presek`) so v skupni `tests/pomoc-stikali.js` (`odpriPomoc`,
  `zapriPomoc`, `medPomocjo`). Najprej v prehodni obliki, ki je pri gumbu »… (drži)« uporabila pritisk:
  na stari kodi 127/127 zelenih. Po spremembi je prehodna veja odstranjena. Pričakovanja so ostala.
- **Brskalnik:**
  - `tools/brskalnik.js` ima `tapni()`;
  - nov `tools/preveri-stikalo-brskalnik.js` – vse drži;
  - »Rešitev« s klikom odpirajo `preveri-izbira-`, `-vadi-`, `-enojcki-` in `-veriga-brskalnik.js`
    (prva dva v izhodišču s pritiskom – po napisu gumba);
  - primerjave z izhodiščem v `preveri-presek-`, `-enojcki-`, `-vadi-` in `-izbira-brskalnik.js` izpustijo
    `.peek-row`.

  Izid: `izbira`, `vadi`, `veriga` in `stikalo` – vse drži. `presek` in `enojcki` padeta pri primerjavi
  z izhodiščem `4c47cc0`, ker meni od vklopa XY-verige (`e058ac7`) ima kartico 13, izhodišče pa ne
  (»10 kartic« / »12 kartic« in klik kartice `xy-chain` v izhodišču). To ni zaradi tega koraka, scenarija
  nista prilagojena (sporočeno). Začasni kopiji brez kartice 13 (zunaj repozitorija): vse drži, »Spoznaj«
  3–12 enak izhodišču pri 375 in 1200 px.
- **Odstopanje od načrta:** napaka na dnu strani se v `c7eb185` v brskalniku brez glave ne pokaže več
  (stran se ob pritisku ne zamakne – nad gumbom sta zdaj razdelka »Razlaga« in »Shema«), v `4e1e4dc` pa
  se (okvir med pritiskom skrit). Scenarij zato primerja s `4e1e4dc` (`--izhodisce`). Mehanizem
  (`mouseleave` ob pritisku) je v stikalu odstranjen.
- Posnetek igre: 99 posnetkov, brez razlik. Testi: vseh 652 zelenih v 2 min 37 s (hitrih 535).

### Korak 2 – del A: osnova ter 7 in 8 (2026-10-08)

- **Pred korakom (svoj commit `135f6c4`):** `preveri-presek-` in `preveri-enojcki-brskalnik.js` primerjata z
  izhodiščem `c7eb185` (zaprtje XY-verige, vseh 15 kartic; prej `4c47cc0` brez kartice 13 – razdelek
  korak 1); presek primerja 3–13, enojcki šteje 13 kartic. Oba zelena.
- **Koda:**
  - `trening/generators.js`: `genPoShemi(mode, n)` (n = 0 vaja 1, n = 1 vaja 2; `null` pri vajah 3–9,
    tehniki brez sheme in še ne narejeni – zdaj vse razen 7 in 8), `obrniCelico(i)` (VrSc → VcSr),
    `genRibaPoShemi()` za 7 in 8: celice x iz `SHEME_TEHNIK` (»*« vzorec, »-« izbris), naključna
    števka, preverba z `xWing()`/`swordfish()` (natanko en korak – vzorec in izbrisi sheme; sicer
    `null` in vaja iz generatorja), `baseIsRow` iz izbrisov, druga polja kot pri generatorju, še
    `poShemi = { obrnjeno, crke }`. Vaji 1 in 2 Math.random ne porabita pred odločitvijo, zato je vaja 3
    pri istem semenu enaka kot prej.
  - `trening/trening.js`: `genPoShemi(mode, exNum) || M.gen(exNum)`, pripis »· po shemi« / »· po shemi,
    obrnjeno« (`pripisPoShemi()`), vrstica s preslikavo tik za razdelkom »Shema« (`vrsticaPoShemi()`:
    »Vaja po shemi zgoraj – iste celice, črka x je števka 4.« / »Vaja po obrnjeni shemi zgoraj – vrstice
    sheme so stolpci, črka x je števka 4.«).
  - `trening/trening.css`: `.po-shemi` (13 px, polkrepko, `--ink`).
- **Priprava (zelena na stari kodi):** zagon vseh testov na kodi s spremembo je pokazal dva testa, ki
  sta vajo 1 kroga uporabljala kot naključno vajo – `trening-legenda` (legenda in namig pri 7 in 8,
  razdelek »Razlaga«) in `trening-resitev` (7 in 8). Oba sta prešla na vajo 7 (n = 6 – iste vrste kot
  vaja 1 pri vseh tehnikah, n % 3 in n % 2 sta 0), smer »s stolpci« na vajo 8; na stari kodi 32/32
  zelenih, na novi tudi. (Načrt je predlagal vajo 3 ali poznejšo z isto vrsto vaje; vaja 3 je pri 3–6
  blok, zato vaja 7.) Drugi testi niso padli. Primerjave z izhodiščem v `preveri-presek-`,
  `-enojcki-`, `-vadi-` in `-izbira-brskalnik.js` izrišejo vajo 3 (`vaja3()` v
  `tools/primerjava-slogov.js`: `exNum = 2`, seme po vaji 2, `presekTrojica` = -1, prazna
  `presekUporabljene`); v `preveri-izbira` tudi iskanje drugega vzorca mečarice.
- **Test:** nov `tests/trening-po-shemi.test.js` (19 testov): na stari kodi jih 14 pade, 5 varoval
  »nespremenjeno« (vaja 3, E1 in »Vadi v uganki«, različne števke) drži; na novi 19/19.
- **Brskalnik:** nov `tools/preveri-po-shemi-brskalnik.js` – 48 ✓ (14 s): shema odprta nad mrežo,
  preslikava med njo in mrežo v kartici, celice = shema (vaja 2 obrnjena), pravi kliki → »Pravilno!«
  pri vajah 1 in 2, 375 in 1280 px. Primerjave: `presek` 79 ✓, `enojcki` 330 ✓, `vadi` 364 ✓,
  `izbira` 708 ✓ – vse drži (prvi zagon je padel na moji napaki v `vaja3()` – manjkajoče podpičje za
  semenom –, ne na primerjavi). Še `sheme` 939 ✓, `videz` 339 ✓, `stikalo` 25 ✓, `vklop` 87 ✓ – vse
  drži.
- Posnetek igre: 99 posnetkov, brez razlik. Testi: vseh 671 zelenih v 2 min 40 s (hitrih 554 v 42 s).


### Korak 3 – del A: 3–6 (2026-10-09)

- **Koda:**
  - `trening/generators.js`: `genPodmnozicaPoShemi(mode, obrnjeno)` – do `PODMNOZICA_POSKUSOV` (2000)
    poskusov `poskusPodmnozicePoShemi()`. Vaja 1 je vrstica 1, vaja 2 stolpec 1 (obrnjena shema).
    - Črke so naključne različne števke, prazna celica sheme je dana števka (ni števka črke).
    - »…« so polnila: sama 2–3, ob črkah 1–2. Polnilo, ki je v manj kot dveh celicah, se doda v
      naključne celice z »…« – brez tega je skoraj vsak poskus odpadel zaradi skritega enojčka (pri
      očitnem paru je uspelo 1,5 % poskusov).
    - Preverba (1.5): na deski kot v `tests/sheme.test.js` (enota na mestu sheme, druge celice
      prazne z vsemi kandidati) funkcija tehnike najde natanko korak sheme; enojčka in lažje
      podmnožice (`PODMNOZICE_LAZJE`) nič; pri 3 in 5 je vzorec en sam (kot ga sprejme »Preveri«).
      Sporočilo iz `subsetSolutionMessage()`.
    - Vaja ima polja kot vaja iz generatorja, `poShemi` še `vrstica: true`.
  - `trening/trening.js`: pri vaji 2 vrstica s preslikavo »Vaja po obrnjeni shemi zgoraj – vrstica sheme je
    stolpec, črke so števke: x = 5, y = 8, z = 1.«
- **Delež uspešnih poskusov** (4000 poskusov vaje 1 / vaje 2): 3 · Očitni par 99,6 / 99,6 %, 4 · Skriti
  par 81,9 / 80,0 %, 5 · Očitna trojica 69,5 / 70,2 %, 6 · Skrita trojica 48,7 / 47,1 %. Poskus traja
  0,2–2,6 ms, vaja povprečno 0,2–5,6 ms, najdlje 41 ms (skrita trojica). Delež je višji od 22–41 % v 1.4,
  ker so polnila razporejena tako, da je vsaka števka v vsaj dveh celicah.
- **Test:** `tests/trening-po-shemi.test.js` – 28 novih testov (200 vaj 1 in 200 vaj 2 vsake tehnike;
  vaje se sestavijo enkrat za oba testa). Na stari kodi jih je 24 padlo, 4 varovala (vaja 3 enaka
  `M.gen(2)`) so držala; na novi 47/47 v pribl. 10 s. Dve pričakovanji novega testa sta bili napačni in
  sta popravljeni: pri dveh črkah je mogočih samo 72 preslikav (meja 100 je bila previsoka), sporočilo
  1. faze pri trojici je »Celice so pravilne!«.
- **Prestavljeni testi** (Darkova potrditev 2026-10-09; zeleni na stari kodi pred prestavitvijo, 87/87 in
  29/29): `trening-stikalo`, `trening-pomoc`, `trening-precrtanje` in `pocasni/trening-uganka-ui`. Padali
  so samo zato, ker so pri 3–6 delali na vaji 1. Prvi trije si zapomnijo vajo prek
  `MODES[].gen`, vaja po shemi gre mimo njega. `trening-uganka-ui` pa je preverjal oznako
  »Vaja 1 / 9« brez »· po shemi«. Zdaj vsi delajo na vaji 7 (n = 6); `trening-precrtanje` za vse tehnike,
  drugi samo pri 3–6. Za koraka 4 in 5 velja isto: tak test se prestavi po istem postopku in se našteje.
- **Brskalnik:** `tools/preveri-po-shemi-brskalnik.js` za 3–6 pri 375 in 1280 px – 160 ✓ (30 s).
  Preveri:
  - shema, preslikava in enota v kartici;
  - vaja 1 vrstica, vaja 2 stolpec navpično;
  - celica za celico kot shema;
  - pravi kliki → »Pravilno!«, pri 4 in 6 z 2. fazo.

  Primerjave: `presek` 79 ✓, `enojcki` 330 ✓, `vadi` 364 ✓, `stikalo` 25 ✓, `sheme` 939 ✓,
  `videz` 339 ✓. `izbira` je v prvem zagonu (hkrati z drugimi scenariji) padla pri dveh primerjavah
  z izhodiščem: v izhodiščnem brskalniku so bili vsi elementi brez slogov (`display: block`, brez podlag).
  Ponovni zagon sam: 708 ✓.
- Posnetek igre: 99 posnetkov, brez razlik. Testi: vseh 699 zelenih v 2 min 26 s (hitrih 582 v 42 s).
