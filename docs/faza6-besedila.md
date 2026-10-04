# Faza 6 – besedila tehnik: predlog (korak b)

**Stanje: predlog, čaka na OK. Koda ni spremenjena.** Izhodišče je stanje po koraku a (commit
`37a5f3f`); popoln izpis sedanjih besedil je v prejšnji različici te datoteke (commit `3f64a94`).
Načrt faze 6 je v `docs/faza6-nacrt.md`.

Pri vsakem besedilu je **staro** (zdaj v kodi) in pod njim **novo** (predlog). »Ostane« pomeni
brez spremembe. Kar je korak a že popravil (sklon pri Mečarici, »mogoč«), je pri »staro« že
popravljeno.

Upoštevana pravila (tvoje pripombe, 2026-10-04):

1. Razlaga = kako vzorec prepoznaš; posledica = kaj izbrišeš in zakaj (pri E1 in E2: kaj vpišeš
   in zakaj). Obe polji sta izpolnjeni pri vseh 14 tehnikah.
2. En glagol: »izbriši« (ne »odstrani«, ne »izloči«; razen v imenih tehnik).
3. Druga oseba ednine: »izbrišeš«.
4. Števila v povedih z besedo: »dve celici«. Števke (»števka 7«) in sprotna števila (»manjka še
   3 izbrise«) ostanejo s številko.
5. »Enota« in »vidi« sta razložena ob prvi omembi pri vsaki tehniki – v povzetku (kartica) in v
   razlagi, ker sta to dve ločeni mesti, kjer tehniko srečaš prvič.
6. Pari v zavitih oklepajih: {x, y}.
7. Predlog po števki: z 1, z 2, s 3, s 4, s 5, s 6, s 7, z 8, z 9 (izračuna ga koda).
8. Pod vajo je kratko besedilo, polna razlaga na klik (razdelek A).

---

## A. Kje se bo kaj pokazalo (pravilo 8, odločitvi 1 in 4c)

| Mesto | Zdaj | Predlog |
|---|---|---|
| kartica v meniju treninga | samostojno besedilo v `trening/index.html` | **povzetek** (novo polje v `TEHNIKE_OPISI`, ena kratka poved) |
| »Spoznaj«, pod nalogo | razlaga + navodilo; pri 1, 2, 7, 8 lasten opis naloge; pri E1 in E2 v vajah 1–6 razlaga + poved stopnje | **povzetek + navodilo**; pri 1, 2, 7, 8 povzetek + opis naloge s števko; pri E1 in E2 v vajah 1–6 povzetek + poved stopnje |
| »Vadi v uganki«, pod nalogo | razlaga (+ pripis o območju) | **povzetek** (+ pripis o območju) |
| pod tem v obeh načinih | – | zložljiv razdelek **»Razlaga«** z razlago in posledico; privzeto zaprt, odprt ali zaprt ostane med vajami kroga; ogled ne šteje kot pomoč (splošna razlaga ne pove odgovora) |
| okno Pomoč v igri, »Tehnike« | razlaga + posledica | ostane (razlaga + posledica) – tam je prostor in je to priročnik |

Zakaj enako pri vseh 14 in ne samo pri 9–12: pod vsako vajo je potem enako dolgo besedilo (ena
ali dve povedi), razlaga pa je vedno na istem mestu. Pri E1–6 bi bila razlika med vidno in
skrito razlago majhna, različna zgradba pa bi zmedla. Če želiš razlago pri E1–6 vedno vidno, je
to ena vrstica v kodi.

»Vadi v uganki« po odločitvi 4c dobi tudi posledico – v razdelku »Razlaga«.

## B. Naslov pri 1 in 2 (»Blok 4 → Vrstica 6«) – ali je namerno

Da. Ob nalogi »prava geometrija pri 1 in 2« (`docs/geometrija-1-2-nacrt.md`, razdelek z
variantami, točka 3) je bilo odločeno: »Naslov in navodilo ostaneta, kakor sta.« Vaja v
»Spoznaj« pokaže **samo** blok in vrstico (ali stolpec) koraka – 15 celic, ostale so sive.
Vrstico zato pove že mreža (in krepka oznaka roba), naslov ne izda ničesar, česar mreža ne kaže.
Puščica pove smer tehnike (iz bloka v vrstico pri 1, iz vrstice v blok pri 2) – po tem se 1 in 2
ločita.

Vaja je s tem lažja: celice vzorca so v preseku bloka in vrstice. To je namen »Spoznaj«
(prepoznavanje vzorca); iskanje brez pomoči je v »Vadi v uganki«, kjer je pri vajah 1–6 označen
samo blok (pri 1) ali samo vrstica (pri 2), pri vajah 7–9 nič.

**Predlog:** naslov ostane. Opis naloge po novem pove, kaj se izbriše (pri 1 in 2 spodaj).

---

## C. Po tehnikah

### E1 · Očitni enojček (Naked Single)

**Povzetek** (kartica; pod vajo)
- staro (kartica): »Najdi prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.«
- novo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.«

**Razlaga**
- staro: »Poišči prazno celico, v kateri je mogoča samo še ena števka: njena vrstica, stolpec in blok skupaj že vsebujejo vseh drugih osem števk.«
- novo: »Za prazno celico preglej njeno vrstico, stolpec in blok. Če je v njih skupaj vpisanih osem različnih števk, je v celici mogoča samo še deveta.«

**Posledica**
- staro: »To števko vpišeš v celico; v igri je to celica z enim samim kandidatom.«
- novo: »To števko vpišeš v celico, ker nobena druga tam ni mogoča. Če imaš zapisane kandidate, je to celica z enim samim kandidatom.«

**Navodilo** (»Spoznaj«) – ostane: »Izberi celico in nato števko, ki jo vpišeš.«

**Naloga v »Spoznaj«** – naslovi ostanejo (po koraku a). **»Vadi v uganki«** – ostane.

### E2 · Skriti enojček (Hidden Single)

**Povzetek**
- staro (kartica): »Najdi števko, ki je v vrstici, stolpcu ali bloku mogoča samo na enem mestu, in jo vpiši.«
- novo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.«

**Razlaga**
- staro: »Izberi vrstico, stolpec ali blok in števko, ki je v njem še ni. Če je števka v tej enoti mogoča samo v eni celici, mora biti tam – četudi bi bile v celici sicer mogoče tudi druge števke.«
- novo: »Poglej vrstico, stolpec ali blok – vsak od njih je enota – in števko, ki v enoti še ni vpisana. Za vsako prazno celico enote preveri, ali je ta števka že v vrstici, stolpcu ali bloku celice. Če ostane ena sama celica, kjer je števka mogoča, si našel skriti enojček.«

**Posledica**
- staro: »To števko vpišeš v celico.«
- novo: »Števko vpišeš v to celico: v enoti mora biti, drugje pa ne more. Druge števke, ki bi bile v celici sicer mogoče, tam zato ne morejo biti.«

**Navodilo** – ostane: »Izberi celico in nato števko, ki jo vpišeš.«

**Naloga v »Spoznaj«**
- vaja 1 – staro: »V označenem stolpcu 1 poišči edino mesto za števko 9«
- vaja 1 – novo: »V označenem stolpcu 1 poišči edino celico, kjer je mogoča števka 9«
- vaja 4 – staro: »V označenem bloku 4 poišči števko z enim samim mestom«
- vaja 4 – novo: »V označenem bloku 4 poišči števko, ki je mogoča samo v eni celici«
- vaja 7 – staro: »Poišči števko z enim samim mestom v enoti«
- vaja 7 – novo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici«

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči števko z enim samim mestom v enoti in jo vpiši.«
- brez območja – novo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.«
- z območjem – staro: »V vrstici 8 poišči števko z enim samim mestom in jo vpiši.«
- z območjem – novo: »V vrstici 8 poišči števko, ki je mogoča samo v eni celici, in jo vpiši.«

### 1 · Izločitev izven bloka (Pointing Pair/Triple)

**Povzetek**
- staro (kartica): »Kandidat je v bloku mogoč samo v eni vrstici ali stolpcu – izbrišeš ga iz preostanka te vrstice/stolpca.«
- novo: »Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka.«

**Razlaga**
- staro: »Pogledaš blok. Če je kandidat v njem mogoč samo v celicah ene vrstice (ali stolpca), ga izbrišeš iz preostanka te vrstice zunaj bloka. Smer: iz bloka v vrstico.«
- novo: »Poglej blok in v njem eno števko. Če ležijo vse celice bloka, kjer je ta števka še kandidat, v isti vrstici (ali v istem stolpcu), si našel vzorec – dve ali tri celice. Smer: iz bloka v vrstico.«

**Posledica**
- staro: *(prazno)*
- novo: »V bloku mora biti števka v eni od teh celic, torej v tej vrstici. Zato v vrstici zunaj bloka ne more biti – tam jo izbrišeš. Pri stolpcu enako.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi celice vzorca – dve ali tri.«

**Naloga v »Spoznaj«** – naslov ostane (razdelek B); opis:
- staro: »Števka 8: v bloku 4 je mogoča samo v celicah ene vrstice ali stolpca – izberi te celice.«
- novo: »Števka 8: v bloku 4 je mogoča samo v celicah vrstice 6 – izberi te celice. Iz vrstice 6 zunaj bloka jo potem lahko izbrišeš.« (pri stolpcu »stolpca 9 … Iz stolpca 9 …«)

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike Izločitev izven bloka in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči izločitev izven bloka in izbriši, kar iz nje sledi.«
- z območjem – staro: »V bloku 5 poišči izločitev izven bloka in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »V bloku 5 poišči izločitev izven bloka in izbriši, kar iz nje sledi.«

### 2 · Izločitev v bloku (Box-Line Reduction)

**Povzetek**
- staro (kartica): »Kandidat je v vrstici ali stolpcu mogoč samo v enem bloku – izbrišeš ga iz preostanka tega bloka.«
- novo: »Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka.«

**Razlaga**
- staro: »Pogledaš vrstico (ali stolpec). Če je kandidat v njej mogoč samo v celicah enega bloka, ga izbrišeš iz preostanka tega bloka zunaj vrstice. Smer: iz vrstice v blok.«
- novo: »Poglej vrstico (ali stolpec) in v njej eno števko. Če ležijo vse celice vrstice, kjer je ta števka še kandidat, v istem bloku, si našel vzorec – dve ali tri celice. Smer: iz vrstice v blok.«

**Posledica**
- staro: *(prazno)*
- novo: »V vrstici mora biti števka v eni od teh celic, torej v tem bloku. Zato drugje v bloku ne more biti – iz celic bloka zunaj vrstice jo izbrišeš. Pri stolpcu enako.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi celice vzorca – dve ali tri.«

**Naloga v »Spoznaj«** – naslov ostane (razdelek B); opis:
- staro: »Števka 6: v stolpcu 9 je mogoča samo v celicah enega bloka – izberi te celice.«
- novo: »Števka 6: v stolpcu 9 je mogoča samo v celicah bloka 9 – izberi te celice. Iz bloka 9 zunaj stolpca jo potem lahko izbrišeš.«

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike Izločitev v bloku in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči izločitev v bloku in izbriši, kar iz nje sledi.«
- z območjem – staro: »V stolpcu 2 poišči izločitev v bloku in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »V stolpcu 2 poišči izločitev v bloku in izbriši, kar iz nje sledi.«

### 3 · Očitni par (Naked Pair)

**Povzetek**
- staro (kartica): »Najdi dve celici z natanko istima dvema kandidatoma.«
- novo: »Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka.«

**Razlaga**
- staro: »Najdi 2 celici z natanko istima dvema kandidatoma.«
- novo: »Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve celici, ki imata natanko ista dva kandidata {x, y} in nobenega drugega.«

**Posledica**
- staro: »Ti dve števki morata zasesti prav ti dve celici, zato ju izbrišeš iz vseh drugih celic skupne enote (vrstice, stolpca ali bloka).«
- novo: »V eni celici bo x, v drugi y – drugih možnosti nimata. Zato x in y v enoti ne moreta biti nikjer drugje: iz vseh drugih celic enote ju izbrišeš.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi obe celici para.«

**Naloga v »Spoznaj«** – naslov (»Vrstica 2«) ostane.

**Naloga v »Vadi v uganki«**
- staro: »Poišči korak tehnike Očitni par in odstrani kandidate, ki jih izloči.« / »V bloku 8 poišči očitni par in odstrani kandidate, ki jih izloči.«
- novo: »Poišči očitni par in izbriši, kar iz njega sledi.« / »V bloku 8 poišči očitni par in izbriši, kar iz njega sledi.«

### 4 · Skriti par (Hidden Pair)

**Povzetek**
- staro (kartica): »Najdi dve števki, ki se pojavljata samo v istih dveh celicah.«
- novo: »Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate.«

**Razlaga**
- staro: »Najdi 2 celici, ki skrivata par.«
- novo: »Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve števki, ki sta mogoči samo v istih dveh celicah. V teh celicah so lahko še drugi kandidati, zato se par na prvi pogled ne vidi – je skrit.«

**Posledica**
- staro: »Par sta dve števki, ki sta v enoti mogoči samo v teh dveh celicah; ker morata biti v njiju, iz obeh celic izbrišeš vse druge kandidate.«
- novo: »Obe števki morata biti v enoti, mogoči pa sta samo v teh dveh celicah – torej ju zasedeta. Za druge števke v teh dveh celicah ni prostora: iz obeh celic izbrišeš vse druge kandidate.«

**Navodilo**
- staro: »Nato izberi, kateri 2 števki tvorita par.«
- novo: »Izberi obe celici, nato še obe števki para.«

**Naloga v »Spoznaj«** – naslov in vprašanje druge faze (»Kateri dve števki tvorita skriti par? Klikni jih:«) ostaneta.

**Naloga v »Vadi v uganki«**
- staro: »Poišči korak tehnike Skriti par in odstrani kandidate, ki jih izloči.« / »V stolpcu 5 poišči skriti par in odstrani kandidate, ki jih izloči.«
- novo: »Poišči skriti par in izbriši, kar iz njega sledi.« / »V stolpcu 5 poišči skriti par in izbriši, kar iz njega sledi.«

### 5 · Očitna trojica (Naked Triple)

**Povzetek**
- staro (kartica): »Najdi tri celice, ki skupaj pokrijejo natanko tri kandidate.«
- novo: »Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka.«

**Razlaga**
- staro: »Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.«
- novo: »Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri celice, ki imajo skupaj samo tri različne kandidate {x, y, z}. Posamezna celica ima lahko vse tri ali samo dva od njih, npr. {x, y}, {y, z} in {x, z}.«

**Posledica**
- staro: »Te tri števke zasedejo prav te tri celice, zato jih izbrišeš iz vseh drugih celic skupne enote. Posamezna celica ima lahko tudi samo dva od teh treh kandidatov.«
- novo: »Tri celice potrebujejo tri različne števke, na voljo pa imajo samo x, y in z – torej jih zasedejo. Zato teh treh števk v enoti ni nikjer drugje: iz vseh drugih celic enote jih izbrišeš.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi vse tri celice trojice.«

**Naloga v »Spoznaj«** – naslov ostane.

**Naloga v »Vadi v uganki«**
- staro: »Poišči korak tehnike Očitna trojica in odstrani kandidate, ki jih izloči.« / »V bloku 2 poišči očitno trojico in odstrani kandidate, ki jih izloči.«
- novo: »Poišči očitno trojico in izbriši, kar iz nje sledi.« / »V bloku 2 poišči očitno trojico in izbriši, kar iz nje sledi.«

### 6 · Skrita trojica (Hidden Triple)

**Povzetek**
- staro (kartica): »Najdi tri števke, ki se v enoti pojavljajo samo v istih treh celicah.«
- novo: »Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate.«

**Razlaga**
- staro: »Najdi 3 celice, ki skrivajo trojico.«
- novo: »Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri števke, ki so mogoče samo v istih treh celicah. Posamezna števka je lahko mogoča tudi samo v dveh od teh celic, v celicah pa so lahko še drugi kandidati – zato je trojica skrita.«

**Posledica**
- staro: »Trojica so tri števke, ki so v enoti mogoče samo v teh treh celicah; iz njih izbrišeš vse druge kandidate, vsaka od celic pa ima lahko tudi samo dve od teh treh števk.«
- novo: »Vse tri števke morajo biti v enoti, mogoče pa so samo v teh treh celicah – torej jih zasedejo. Za druge števke v njih ni prostora: iz teh treh celic izbrišeš vse druge kandidate.«

**Navodilo**
- staro: »Nato izberi, katere 3 števke jo tvorijo.«
- novo: »Izberi vse tri celice, nato še vse tri števke trojice.«

**Naloga v »Spoznaj«** – naslov in vprašanje druge faze ostaneta.

**Naloga v »Vadi v uganki«**
- staro: »Poišči korak tehnike Skrita trojica in odstrani kandidate, ki jih izloči.« / »V stolpcu 4 poišči skrito trojico in odstrani kandidate, ki jih izloči.«
- novo: »Poišči skrito trojico in izbriši, kar iz nje sledi.« / »V stolpcu 4 poišči skrito trojico in izbriši, kar iz nje sledi.«

### 7 · X-krilo (X-Wing)

**Povzetek**
- staro (kartica): »Kandidat se v dveh vrsticah/stolpcih pojavi na istih dveh mestih – tvori pravokotnik.«
- novo: »Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci).«

**Razlaga**
- staro: »Najdi pravokotnik – 4 celice, kjer se števka v dveh vrsticah pojavi na istih dveh mestih (ali v dveh stolpcih v istih dveh vrsticah).«
- novo: »Poišči dve vrstici, v katerih je števka mogoča samo v dveh celicah – v obeh vrsticah v istih dveh stolpcih. Te štiri celice so vogali pravokotnika. Enako deluje z zamenjanimi vlogami: dva stolpca, v katerih je števka mogoča samo v istih dveh vrsticah.«

**Posledica**
- staro: »V vsaki od obeh vrstic je števka v enem od teh dveh stolpcev, zato jo iz teh dveh stolpcev izbrišeš v vseh drugih celicah.«
- novo: »V vsaki od obeh vrstic mora biti števka v enem od dveh vogalov. V istem stolpcu ne moreta biti obe, zato je ena v prvem, druga v drugem stolpcu – oba stolpca imata števko že v vogalih. Iz vseh drugih celic obeh stolpcev jo izbrišeš. Pri dveh stolpcih (vlogi zamenjani) jo enako izbrišeš iz obeh vrstic zunaj vogalov.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi vse štiri vogale.«

**Naloga v »Spoznaj«** – opis:
- staro: »Števka 4: najdi pravokotnik – 4 celice, kjer se 4 v dveh vrsticah pojavi na istih dveh mestih.«
- novo: »Števka 4: poišči dve vrstici, v katerih je 4 mogoča samo v istih dveh stolpcih, in izberi štiri vogale.« (pri stolpcih »dva stolpca, v katerih je 4 mogoča samo v istih dveh vrsticah«)

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike X-krilo in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči X-krilo in izbriši, kar iz njega sledi.«
- z območjem – staro: »Na števki 7 poišči X-krilo in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »Za števko 7 poišči X-krilo in izbriši, kar iz njega sledi.«

### 8 · Mečarica (Swordfish)

**Povzetek**
- staro (kartica): »Razširjeno X-krilo: 3 vrstice × 3 stolpci. Isti princip, večji vzorec.«
- novo: »Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah.«

**Razlaga**
- staro: »Najdi 3 vrstice (ali stolpce), kjer se števka pojavi samo na istih 3 stolpcih (ali vrsticah).«
- novo: »Poišči tri vrstice, v katerih je števka mogoča samo v istih treh stolpcih. V posamezni vrstici je lahko mogoča v vseh treh ali samo v dveh od teh stolpcev. Enako deluje z zamenjanimi vlogami: trije stolpci, v katerih je števka mogoča samo v istih treh vrsticah.«

**Posledica**
- staro: »Števka zasede po eno celico v vsaki od teh vrstic, vse v teh treh stolpcih, zato jo iz stolpcev izbrišeš v vseh drugih celicah. Vrstica ima lahko tudi samo dve od treh mest.«
- novo: »V vsaki od treh vrstic mora biti števka v enem od teh treh stolpcev, in to vsakič v drugem – torej ima vsak od treh stolpcev števko že v vzorcu. Iz vseh drugih celic teh treh stolpcev jo izbrišeš. Pri treh stolpcih (vlogi zamenjani) jo enako izbrišeš iz treh vrstic zunaj vzorca.«

**Navodilo**
- staro: *(prazno)*
- novo: »Izberi vse celice s števko v teh treh vrsticah.«

**Naloga v »Spoznaj«** – opis:
- staro: »Števka 6: najdi 3 vrstice, kjer se 6 pojavi samo na istih 3 stolpcih. Klikni vse celice s 6 v teh treh vrsticah.«
- novo: »Števka 6: poišči tri vrstice, v katerih je 6 mogoča samo v istih treh stolpcih, in izberi vse celice s 6 v teh treh vrsticah.« (predlog po števki: »z 8«, »s 6« – pravilo 7)

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike Mečarica in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči mečarico in izbriši, kar iz nje sledi.«
- z območjem – staro: »Na števki 1 poišči mečarico in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »Za števko 1 poišči mečarico in izbriši, kar iz nje sledi.«

### 9 · Veriga ene števke (Turbot Fish)

**Povzetek**
- staro (kartica): »Dve močni povezavi za isto števko: v vrstici ali stolpcu je mogoča samo v dveh celicah. Če se en konec prve in en konec druge povezave vidita, je eden od preostalih dveh koncev zagotovo ta števka – izbrišeš jo iz celic, ki vidijo oba. Aplikacija Oakever ta vzorec imenuje Skyscraper oziroma Zmaj z dvema vrvicama.«
- novo: »Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.)«

**Razlaga**
- staro: »Za eno števko poišči dve vrstici ali stolpca, kjer je mogoča v natanko dveh celicah (močni povezavi). En konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok). Potem je vsaj eden od preostalih dveh koncev ta števka, zato jo izbrišemo iz celic, ki vidijo oba. Vzporedni povezavi s koncema v isti vrstici ali stolpcu tvorita Nebotičnik (Skyscraper), vrstica in stolpec s koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite).«
- novo: »Za eno števko poišči dve povezavi. Povezava je vrstica ali stolpec, v katerem je števka mogoča samo v dveh celicah – to sta konca povezave. Povezavi sta lahko dve vrstici, dva stolpca ali vrstica in stolpec. En konec prve povezave mora videti en konec druge: celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Dva primera imata svoje ime: dve vrstici (ali dva stolpca) s takima koncema v istem stolpcu (ali vrstici) sta Nebotičnik (Skyscraper), vrstica in stolpec s takima koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite).«

**Posledica**
- staro: *(prazno)*
- novo: »Konca, ki se vidita, ne moreta imeti števke oba. Če je ni na enem od njiju, je na drugem koncu njegove povezave – zato je števka vsaj na enem od preostalih dveh koncev. Iz celic, ki vidijo oba ta konca, jo izbrišeš.«

**Navodilo**
- staro: »V vaji je števka označena; izberi vse štiri celice vzorca.«
- novo: »Števka je označena. Izberi vse štiri konce obeh povezav.«

**Naloga v »Spoznaj«** – naslov (»Veriga ene števke: 5«) ostane.

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike Veriga ene števke in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči verigo ene števke in izbriši, kar iz nje sledi.«
- z območjem – staro: »Na števki 5 poišči verigo ene števke in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »Za števko 5 poišči verigo ene števke in izbriši, kar iz nje sledi.«

Opomba: motor sprejme tudi povezavi, ki nista ne Nebotičnik ne Zmaj (npr. dve vrstici, katerih
konca se vidita v bloku) – zato »dva primera imata svoje ime« in ne »vzorec je eden od dveh«.

### 10 · W-krilo (W-Wing)

**Povzetek**
- staro (kartica): »Dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Če obstaja vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah in ena od njiju vidi prvo, druga pa drugo celico para, potem obe celici para ne moreta biti b – vsaj ena je a. Zato lahko a izbrišeš iz vsake celice, ki vidi obe celici para. Aplikacija Oakever ta vzorec imenuje Krilo W.«
- novo: »Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para.«

**Razlaga**
- staro: »Poišči dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Nato poišči vrstico, stolpec ali blok, kjer je b mogoč samo v dveh celicah – nobena ne sme biti celica para – pri čemer ena vidi prvo, druga pa drugo celico para. Takrat je vsaj ena celica para enaka a, zato a izbrišemo iz celic, ki vidijo obe.«
- novo: »Poišči dve celici z natanko istima kandidatoma {a, b}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je b mogoč samo v dveh celicah, ki nista celici para. To je povezava: ena njena celica mora videti prvo celico para, druga drugo.«

**Posledica**
- staro: *(prazno)*
- novo: »Celici para ne moreta biti obe b: obe celici povezave bi takrat videli b in v povezavi b ne bi bil mogoč nikjer. Torej je vsaj v eni celici para a. Iz vseh celic, ki vidijo obe celici para, a izbrišeš.«

**Navodilo**
- staro: »Izberi obe celici para in obe celici povezave (4 celice).«
- novo: »Izberi obe celici para in obe celici povezave (štiri celice).«

**Naloga v »Spoznaj«** – naslov ostane.

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike W-krilo in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči W-krilo in izbriši, kar iz njega sledi.«
- z območjem – staro: »Kandidata para sta 4 in 7: poišči W-krilo in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »Za par {4, 7} poišči W-krilo in izbriši, kar iz njega sledi.«

### 11 · XY-krilo (XY-Wing, Y-Wing)

**Povzetek**
- staro (kartica): »Pivot z dvema kandidatoma (x, y) ima dve krili: krilo 1 z njim deli x, krilo 2 deli y – obe krili imata poleg tega skupnega kandidata z. Ta z lahko izbrišeš iz vsake celice, ki vidi obe krili hkrati.«
- novo: »Pivot (osrednja celica) {x, y} in krili {x, z} in {y, z}, ki ju pivot vidi (sta z njim v isti vrstici, stolpcu ali bloku): z izbrišeš iz celic, ki vidijo obe krili.«

**Razlaga**
- staro: »Poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno števko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok).«
- novo: »Poišči pivot (osrednjo celico) z natanko dvema kandidatoma {x, y}. Nato poišči dve krili – celici z natanko dvema kandidatoma, ki ju pivot vidi (sta z njim v isti vrstici, stolpcu ali bloku): eno krilo ima {x, z}, drugo {y, z}. Krili si delita števko z, ki je pivot nima.«

**Posledica**
- staro: »Če je v pivotu x, je z v krilu 2, če je y, je z v krilu 1 – z zato izbrišeš iz vseh celic, ki vidijo obe krili.«
- novo: »Če je v pivotu x, krilo {x, z} ne more biti x, zato je z. Če je v pivotu y, je z v krilu {y, z}. V enem od kril je torej z – iz vseh celic, ki vidijo obe krili, z izbrišeš.«

**Navodilo**
- staro: »Med prikazanimi celicami izberi pivota in obe krili (3 celice).«
- novo: »Izberi pivot in obe krili (tri celice).«

**Naloga v »Spoznaj«** – naslov (»XY-krilo: pivot in dve krili«) ostane.

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike XY-krilo in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči XY-krilo in izbriši, kar iz njega sledi.«
- z območjem – staro: »Poišči XY-krilo s pivotom V4S7 in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »Poišči XY-krilo s pivotom V4S7 in izbriši, kar iz njega sledi.«

### 12 · Edinstveni pravokotnik (Unique Rectangle)

**Povzetek**
- staro (kartica): »Štiri celice v dveh vrsticah, dveh stolpcih in dveh blokih: tri imajo natanko isti par kandidatov, četrta pa poleg njiju še dodatne. Tehnika velja, ker ima uganka natanko eno rešitev – če bi bila tudi četrta celica omejena na ta par, bi bili mogoči dve rešitvi (zamenjava para po pravokotniku).«
- novo: »Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi.«

**Razlaga**
- staro: »Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y.«
- novo: »Poišči štiri celice, ki so vogali pravokotnika: ležijo v dveh vrsticah in dveh stolpcih, vse skupaj pa v natanko dveh blokih. Trije vogali imajo natanko ista kandidata {x, y}, četrti pa ima poleg x in y še vsaj enega kandidata.«

**Posledica**
- staro: *(prazno)*
- novo: »Če bi bila v četrtem vogalu x ali y, bi v vseh štirih vogalih ostala samo x in y. Potem bi ju lahko po vogalih zamenjal in dobil drugo rešitev, uganka pa ima natanko eno. Zato četrti vogal ne more biti ne x ne y – oba izbrišeš iz njega.«

**Navodilo**
- staro: »Izberi vse štiri celice pravokotnika.«
- novo: »Izberi vse štiri vogale pravokotnika.«

**Naloga v »Spoznaj«** – naslov:
- staro: »Edinstveni pravokotnik: smrtonosni vzorec«
- novo: »Edinstveni pravokotnik: štirje vogali«

»Smrtonosni vzorec« predlagam **opustiti**: v besedilih se pojavi samo v tem naslovu, igralcu ne
pove ničesar, česar posledica ne pove brez njega, in zveni dramatično za nekaj, kar je samo
»vzorec z dvema rešitvama«. Druga možnost: obdržim ga in posledici dodam poved »Štirje vogali s
samimi x in y se imenujejo smrtonosni vzorec (deadly pattern), ker dopuščajo dve rešitvi.«
V razpredelnici izrazov v `CLAUDE.md` ostane v obeh primerih.

**Naloga v »Vadi v uganki«**
- brez območja – staro: »Poišči korak tehnike Edinstveni pravokotnik in odstrani kandidate, ki jih izloči.«
- brez območja – novo: »Poišči edinstveni pravokotnik in izbriši, kar iz njega sledi.«
- z območjem – staro: »V blokih 6 in 9 poišči edinstveni pravokotnik in odstrani kandidate, ki jih izloči.«
- z območjem – novo: »V blokih 6 in 9 poišči edinstveni pravokotnik in izbriši, kar iz njega sledi.«

---

## D. Ekstrem v Pomoči igre

Ostane v seznamu stopenj, brez omembe XY-verige.

**Seznam stopenj** (`STOPNJE_UGANK[].opis`)
- staro: »ekstrem potrebuje ekspertno tehniko (XY-veriga – še ni v reševalcu)«
- novo: »ekstrem potrebuje ekspertne tehnike, ki jih reševalec še ne pozna; dokler jih ne pozna, take uganke dobijo »Presega tehnike«.«

**Odstavek o »Oceni zbirko«**
- staro: »Ekstrem je stopnja za ekspertne tehnike (XY-veriga), ki jih reševalec še nima.«
- novo: »Ekstrem je stopnja za ekspertne tehnike, ki jih reševalec še ne pozna – zato je zdaj ne dobi nobena uganka.«

Zakaj pripis: uganka, ki potrebuje tehniko, ki je reševalec ne pozna, danes dobi »Presega
tehnike« (reševalec obtiči). Brez pripisa bi bralec pričakoval Ekstrem.

---

## E. Besedila zunaj izpisa – odločitev zate

Pravila 2–7 zadenejo tudi besedila, ki niso opisi tehnik. Predlagam, da jih v koraku b uskladim
**mehansko po pravilih**, brez posebnega predloga za vsako (spodaj je seznam s primeri). Ali
naj jih vključim?

**E1. Glagol »odstrani« v »Vadi v uganki« in niz »Odstrani kandidata«** (pravilo 2)
- »Prejšnji koraki so že odstranili 5 kandidatov – niso del naloge.« → »… so že izbrisali …« (tudi »niso izbrisali nobenega kandidata«, »Prečrtane kandidate (5) so izbrisali prejšnji koraki …«)
- namig miške: »Kandidate so odstranili koraki na poti do te vaje. Niso del odgovora – odstrani samo kandidate, ki jih izloči iskani korak.« → »Kandidate so izbrisali koraki na poti do te vaje. Niso del odgovora – izbriši samo kandidate, ki sledijo iz iskanega koraka.«
- »Preveri« brez izbrisa: »Odstrani kandidate, ki jih tehnika izloči.« → »Izbriši kandidate, ki sledijo iz koraka.«
- »Preveri«, napačno: »… tega kandidata ne smeš odstraniti.« → »… ne smeš izbrisati.«
- legenda: »izbrisani kandidati (odstranjeni)« → »izbrisani kandidati«
- niz »Odstrani kandidata« (v »Vadi v uganki« in v igri) → »Izbriši kandidata«; namig miške kljukice »… in odstrani isto števko iz vseh …« → »… in izbriši …«. Gumb »Zbriši vpis« ostane (drugo dejanje – vpis, ne kandidat).

Predlog: **da**. Niz v igri in Pomoč igre, ki ga večkrat omenja, uskladim v koraku c skupaj z
drugimi besedili Pomoči; v koraku b samo »Vadi v uganki«.

**E2. Sporočila korakov** (razlaga koraka v reševalcu in igri, »Pravilno!« v treningu; `shared/engine.js`)
- »… lahko izbrišemo …« (10 sporočil) in »… ga izbrišemo« (poskus) → »… lahko izbrišeš …«, »… ga izbrišeš« (pravilo 3)
- »kandidata 3,8«, »Pivot V2S8 {4,9}« → »kandidata {3, 8}«, »Pivot V2S8 {4, 9}« (pravilo 6)
- »(2 celici, 2 števki)« → »(dve celici, dve števki)« (pravilo 4)

Predlog: **da**. Popravijo se testi, ki preverjajo celo besedilo sporočila (`turbot-fish`,
`w-wing`, `xy-wing` …); banka vaj ostane (sporočil v njej ni).

**E3. Namigi in sporočila ob napačnem odgovoru v »Spoznaj«** (`trening/trening.js`, `shared/vaje-uganka.js`, `stepHint()`)
- »Izberi 2 ali 3 celice.«, »Izberi natanko 4 celice.«, »Izberi 6–9 celic (vse celice s to števko v 3 vrsticah ali stolpcih).« → z besedo (»dve ali tri celice«, »štiri celice«, »v treh vrsticah ali stolpcih«) (pravilo 4)
- namig skritega para/trojice »Išči števke z 2× ali manj.« → »Poišči števke, ki so v enoti mogoče največ dvakrat.« (trikrat) (pravili 4, 7)
- namig očitnega para/trojice »Celice z 2–3 kandidati: …« → »Celice z dvema ali tremi kandidati: …«
- zapis parov v namigih XY-krila, edinstvenega pravokotnika in W-krila »V1S2{3,5}«, »{3,5}: V1S2, V4S2« → »V1S2 {3, 5}«, »{3, 5}: …«; namig v igri (»Pokaži več«) »Pivot ima kandidata 3 in 7.« → »Pivot ima kandidata {3, 7}.« (tudi W-krilo, edinstveni pravokotnik) (pravilo 6)
- namig E2: »Stolpci in bloki, v katerih je 5 že vpisana, izločijo celice vrstice – ostane ena sama.« → »Celice vrstice v stolpcih in blokih, kjer je 5 že vpisana, odpadejo – ostane ena sama.« (pravilo 2)
- namig verige ene števke »(močne povezave)« → »(povezave)« – kot v novi razlagi

Predlog: **da**.

**E4. Napaka, najdena ob pregledu – namig pri 7 in 8** (`trening/trening.js`, `buildHintText()`)

Namig X-krila in mečarice je isti: »Pojavitve 4 po vrsticah: V1:2×, … Išči 2 vrstici (ali
stolpca) s točno 2×.« Pri mečarici je napačen (mečarica potrebuje tri vrstice z dvema ali tremi
mesti), poleg tega namig našteje samo vrstice – štetje po stolpcih se izračuna, a ne izpiše, zato
je pri vaji s stolpci neuporaben. Predlog: X-krilo »Poišči dve vrstici ali dva stolpca, v katerih
je števka natanko dvakrat.«, mečarica »Poišči tri vrstice ali tri stolpce, v katerih je števka
dvakrat ali trikrat, vse v istih treh stolpcih (vrsticah).«, oboje s štetjem po vrsticah **in**
stolpcih. To spremeni obnašanje namiga, zato samo, če potrdiš.
