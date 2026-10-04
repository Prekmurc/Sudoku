# Faza 6 – sedanja besedila tehnik (za pregled)

Izpis vseh besedil tehnik E1, E2 in 1–12, kot so v kodi **zdaj** (commit `03a815d`,
2026-10-04). Besedila niso spremenjena. Načrt faze 6 je v `docs/faza6-nacrt.md`.

Izpis je narejen samodejno iz kode (skripta naloži `shared/engine.js`, `trening/generators.js`
in `trening/v-uganki.js` v Node in pokliče iste funkcije kot trening), zato je besedilo
dobesedno to, kar se pokaže. Številke, enote in celice v primerih nalog so iz generatorja
(seme je stalno) – v vaji so vsakič drugačne.

## Kje se katero besedilo pokaže

| Besedilo | Vir v kodi | Kje ga vidiš |
|---|---|---|
| **Opis na kartici** | `trening/index.html` (`<p>` v kartici) | meni treninga, pod imenom tehnike |
| **Razlaga** | `TEHNIKE_OPISI[].razlaga` v `shared/engine.js` | »Spoznaj« (opis pod nalogo – razen 1, 2, 7, 8), »Vadi v uganki« (opis pod nalogo), okno Pomoč v igri (razdelek »Tehnike«) |
| **Navodilo** | `TEHNIKE_OPISI[].navodilo` | samo »Spoznaj«, za razlago (pri E1 in E2 samo vaje 7–9; pri 1, 2, 7, 8 se ne pokaže) |
| **Posledica** | `TEHNIKE_OPISI[].posledica` | samo okno Pomoč v igri, za razlago |
| **Naloga v »Spoznaj«** | `unitLabel` (naslov) in `desc` (opis) v `trening/generators.js` | nad mrežo vaje: naslov in pod njim opis |
| **Naloga v »Vadi v uganki«** | `navodiloVadi()` v `trening/v-uganki.js` (naslov), razlaga + pripis o območju (opis) | nad mrežo vaje |

Okno Pomoč v igri izpiše za vsako tehniko »oznaka · ime (angleško ime)« in pod njim razlago
in posledico v enem odstavku (`opisTehnike()`). Pri tehnikah s prazno posledico je tam samo
razlaga.

V »Spoznaj« je nad naslovom še vrstica »4 · Skriti par (Hidden Pair) · Vaja 3 / 9«, v »Vadi v
uganki« »4 · Skriti par (Hidden Pair) · Vadi v uganki · Vaja 3 / 9« – ime je iz
`imeTehnike()` (faza 4) in ni predmet pregleda.

Ni izpisano (ni del naloge, lahko dodam): namigi (»Namig (drži)« v »Spoznaj«, »Namig« v »Vadi v
uganki«, »Pokaži več« v igri), sporočila korakov (»Pravilno!« v treningu, razlaga koraka v
reševalcu in igri), sporočila ob napačnem odgovoru.

---

## E1 · Očitni enojček (Naked Single)

Ključ: `naked-single` (`Gol enojček`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Poišči prazno celico, v kateri je mogoča samo še ena števka: njena vrstica, stolpec in blok skupaj že vsebujejo vseh drugih osem števk.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Izberi celico in nato števko, ki jo vpišeš.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> To števko vpišeš v celico; v igri je to celica z enim samim kandidatom.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Katera števka je edina mogoča v označeni celici V6S9?«
  - opis: »Poišči prazno celico, v kateri je mogoča samo še ena števka: njena vrstica, stolpec in blok skupaj že vsebujejo vseh drugih osem števk. Celica je že izbrana – izberi samo števko, ki jo vpišeš.«
- vaja 4 – naslov: »V označenem stolpcu 9 poišči celico z eno samo možno števko«
  - opis: »Poišči prazno celico, v kateri je mogoča samo še ena števka: njena vrstica, stolpec in blok skupaj že vsebujejo vseh drugih osem števk. Izberi celico v označeni enoti in nato števko, ki jo vpišeš.«
- vaja 7 – naslov: »Poišči celico z eno samo možno števko«
  - opis: »Poišči prazno celico, v kateri je mogoča samo še ena števka: njena vrstica, stolpec in blok skupaj že vsebujejo vseh drugih osem števk. Izberi celico in nato števko, ki jo vpišeš.«
- vir opisa: vaje 1–6: lasten opis po stopnji (razlaga + poved stopnje), vaje 7–9: razlaga + navodilo

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči celico z eno samo možno števko in jo vpiši.«
- vaje 1–6 (z območjem, primer): »V vrstici 7 poišči celico z eno samo možno števko in jo vpiši.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## E2 · Skriti enojček (Hidden Single)

Ključ: `hidden-single` (`Skriti enojček`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi števko, ki je v vrstici, stolpcu ali bloku mogoča samo na enem mestu, in jo vpiši.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Izberi vrstico, stolpec ali blok in števko, ki je v njem še ni. Če je števka v tej enoti mogoča samo v eni celici, mora biti tam – četudi bi bile v celici sicer mogoče tudi druge števke.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Izberi celico in nato števko, ki jo vpišeš.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> To števko vpišeš v celico.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »V označenem stolpcu 1 poišči edino mesto za števko 9«
  - opis: »Izberi vrstico, stolpec ali blok in števko, ki je v njem še ni. Če je števka v tej enoti mogoča samo v eni celici, mora biti tam – četudi bi bile v celici sicer mogoče tudi druge števke. Števka je že izbrana – izberi samo celico, v katero jo vpišeš.«
- vaja 4 – naslov: »V označenem bloku 4 poišči števko z enim samim mestom«
  - opis: »Izberi vrstico, stolpec ali blok in števko, ki je v njem še ni. Če je števka v tej enoti mogoča samo v eni celici, mora biti tam – četudi bi bile v celici sicer mogoče tudi druge števke. Izberi celico v označeni enoti in nato števko, ki jo vpišeš.«
- vaja 7 – naslov: »Poišči števko z enim samim mestom v enoti«
  - opis: »Izberi vrstico, stolpec ali blok in števko, ki je v njem še ni. Če je števka v tej enoti mogoča samo v eni celici, mora biti tam – četudi bi bile v celici sicer mogoče tudi druge števke. Izberi celico in nato števko, ki jo vpišeš.«
- vir opisa: vaje 1–6: lasten opis po stopnji (razlaga + poved stopnje), vaje 7–9: razlaga + navodilo

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči števko z enim samim mestom v enoti in jo vpiši.«
- vaje 1–6 (z območjem, primer): »V vrstici 8 poišči števko z enim samim mestom in jo vpiši.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 1 · Izločitev izven bloka (Pointing Pair/Triple)

Ključ: `pointing` (`Pointing pair/triple`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Kandidat je v bloku možen samo v eni vrstici ali stolpcu – izbrišeš ga iz preostanka te vrstice/stolpca.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Pogledaš blok. Če je kandidat v njem mogoč samo v celicah ene vrstice (ali stolpca), ga izbrišeš iz preostanka te vrstice zunaj bloka. Smer: iz bloka v vrstico.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> *(prazno)*

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- primer – naslov: »Blok 4 → Vrstica 6«
  - opis: »Števka 8: v bloku 4 je mogoča samo v celicah ene vrstice ali stolpca – izberi te celice.«
- primer – naslov: »Blok 9 → Stolpec 9«
  - opis: »Števka 4: v bloku 9 je mogoča samo v celicah ene vrstice ali stolpca – izberi te celice.«
- vir opisa: lasten opis generatorja – razlaga in navodilo iz `TEHNIKE_OPISI` se tu ne pokažeta
- nad mrežo še »Označena števka: N«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Izločitev izven bloka in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V bloku 5 poišči izločitev izven bloka in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 2 · Izločitev v bloku (Box-Line Reduction)

Ključ: `box-line` (`Box-line reduction`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Kandidat je v vrstici ali stolpcu možen samo v enem bloku – izbrišeš ga iz preostanka tega bloka.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Pogledaš vrstico (ali stolpec). Če je kandidat v njej mogoč samo v celicah enega bloka, ga izbrišeš iz preostanka tega bloka zunaj vrstice. Smer: iz vrstice v blok.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> *(prazno)*

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- primer – naslov: »Stolpec 9 → Blok 9«
  - opis: »Števka 6: v stolpcu 9 je mogoča samo v celicah enega bloka – izberi te celice.«
- primer – naslov: »Stolpec 8 → Blok 6«
  - opis: »Števka 3: v stolpcu 8 je mogoča samo v celicah enega bloka – izberi te celice.«
- vir opisa: lasten opis generatorja – razlaga in navodilo iz `TEHNIKE_OPISI` se tu ne pokažeta
- nad mrežo še »Označena števka: N«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Izločitev v bloku in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V stolpcu 2 poišči izločitev v bloku in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 3 · Očitni par (Naked Pair)

Ključ: `naked-pair` (`Naked pair`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi dve celici z natanko istima dvema kandidatoma.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi 2 celici z natanko istima dvema kandidatoma.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Ti dve števki morata zasesti prav ti dve celici, zato ju izbrišeš iz vseh drugih celic skupne enote (vrstice, stolpca ali bloka).

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Vrstica 2«
  - opis: »Najdi 2 celici z natanko istima dvema kandidatoma.«
- vaja 2 – naslov: »Stolpec 2«
  - opis: »Najdi 2 celici z natanko istima dvema kandidatoma.«
- vaja 3 – naslov: »Blok 3«
  - opis: »Najdi 2 celici z natanko istima dvema kandidatoma.«
- vir opisa: razlaga + navodilo (`opisVaje()`)

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Očitni par in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V bloku 8 poišči očitni par in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 4 · Skriti par (Hidden Pair)

Ključ: `hidden-pair` (`Hidden pair`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi dve števki, ki se pojavljata samo v istih dveh celicah.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi 2 celici, ki skrivata par.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Nato izberi, kateri 2 števki tvorita par.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Par sta dve števki, ki sta v enoti mogoči samo v teh dveh celicah; ker morata biti v njiju, iz obeh celic izbrišeš vse druge kandidate.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Vrstica 1«
  - opis: »Najdi 2 celici, ki skrivata par. Nato izberi, kateri 2 števki tvorita par.«
- vaja 2 – naslov: »Stolpec 8«
  - opis: »Najdi 2 celici, ki skrivata par. Nato izberi, kateri 2 števki tvorita par.«
- vaja 3 – naslov: »Blok 8«
  - opis: »Najdi 2 celici, ki skrivata par. Nato izberi, kateri 2 števki tvorita par.«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- po pravilnih celicah še vprašanje »Kateri dve števki tvorita skriti par? Klikni jih:«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Skriti par in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V stolpcu 5 poišči skriti par in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 5 · Očitna trojica (Naked Triple)

Ključ: `naked-triple` (`Naked triple`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi tri celice, ki skupaj pokrijejo natanko tri kandidate.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Te tri števke zasedejo prav te tri celice, zato jih izbrišeš iz vseh drugih celic skupne enote. Posamezna celica ima lahko tudi samo dva od teh treh kandidatov.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Vrstica 9«
  - opis: »Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.«
- vaja 2 – naslov: »Stolpec 6«
  - opis: »Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.«
- vaja 3 – naslov: »Blok 6«
  - opis: »Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.«
- vir opisa: razlaga + navodilo (`opisVaje()`)

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Očitna trojica in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V bloku 2 poišči očitno trojico in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 6 · Skrita trojica (Hidden Triple)

Ključ: `hidden-triple` (`Hidden triple`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Najdi tri števke, ki se v enoti pojavljajo samo v istih treh celicah.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi 3 celice, ki skrivajo trojico.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Nato izberi, katere 3 števke jo tvorijo.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Trojica so tri števke, ki so v enoti mogoče samo v teh treh celicah; iz njih izbrišeš vse druge kandidate, vsaka od celic pa ima lahko tudi samo dve od teh treh števk.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Vrstica 9«
  - opis: »Najdi 3 celice, ki skrivajo trojico. Nato izberi, katere 3 števke jo tvorijo.«
- vaja 2 – naslov: »Stolpec 1«
  - opis: »Najdi 3 celice, ki skrivajo trojico. Nato izberi, katere 3 števke jo tvorijo.«
- vaja 3 – naslov: »Blok 1«
  - opis: »Najdi 3 celice, ki skrivajo trojico. Nato izberi, katere 3 števke jo tvorijo.«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- po pravilnih celicah še vprašanje »Katere tri števke tvorijo skrito trojico? Klikni jih:«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Skrita trojica in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V stolpcu 4 poišči skrito trojico in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 7 · X-krilo (X-Wing)

Ključ: `x-wing` (`X-Wing`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Kandidat se v dveh vrsticah/stolpcih pojavi na istih dveh mestih – tvori pravokotnik.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi pravokotnik – 4 celice, kjer se števka v dveh vrsticah pojavi na istih dveh mestih (ali v dveh stolpcih v istih dveh vrsticah).

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> V vsaki od obeh vrstic je števka v enem od teh dveh stolpcev, zato jo iz teh dveh stolpcev izbrišeš v vseh drugih celicah.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »X-krilo za števko 4«
  - opis: »Števka 4: najdi pravokotnik – 4 celice, kjer se 4 v dveh vrsticah pojavi na istih dveh mestih.«
- vaja 2 – naslov: »X-krilo za števko 1«
  - opis: »Števka 1: najdi pravokotnik – 4 celice, kjer se 1 v dveh stolpcih pojavi na istih dveh mestih.«
- vaja 3 – naslov: »X-krilo za števko 8«
  - opis: »Števka 8: najdi pravokotnik – 4 celice, kjer se 8 v dveh vrsticah pojavi na istih dveh mestih.«
- vir opisa: lasten opis generatorja – razlaga in navodilo iz `TEHNIKE_OPISI` se tu ne pokažeta
- nad mrežo še »Označena števka: N«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike X-krilo in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »Na števki 7 poišči X-krilo in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Števka je poudarjena.«

## 8 · Mečarica (Swordfish)

Ključ: `swordfish` (`Swordfish`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Razširjeno X-krilo: 3 vrstice × 3 stolpci. Isti princip, večji vzorec.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Najdi 3 vrstice (ali stolpce), kjer se števka pojavi samo na istih 3 stolpcih (ali vrsticah).

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> *(prazno)*

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Števka zasede po eno celico v vsaki od teh vrstic, vse v teh treh stolpcih, zato jo iz stolpcev izbrišeš v vseh drugih celicah. Vrstica ima lahko tudi samo dve od treh mest.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Mečarica za števko 6«
  - opis: »Števka 6: najdi 3 vrsticah, kjer se 6 pojavi samo na istih 3 stolpcih. Klikni vse celice s 6 v teh treh vrsticah.«
- vaja 2 – naslov: »Mečarica za števko 8«
  - opis: »Števka 8: najdi 3 stolpcih, kjer se 8 pojavi samo na istih 3 vrsticah. Klikni vse celice s 8 v teh treh stolpcih.«
- vaja 3 – naslov: »Mečarica za števko 7«
  - opis: »Števka 7: najdi 3 vrsticah, kjer se 7 pojavi samo na istih 3 stolpcih. Klikni vse celice s 7 v teh treh vrsticah.«
- vir opisa: lasten opis generatorja – razlaga in navodilo iz `TEHNIKE_OPISI` se tu ne pokažeta
- nad mrežo še »Označena števka: N«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Mečarica in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »Na števki 1 poišči mečarico in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Števka je poudarjena.«

## 9 · Veriga ene števke (Turbot Fish)

Ključ: `turbot-fish` (`Turbot Fish`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Dve močni povezavi za isto števko: v vrstici ali stolpcu je mogoča samo v dveh celicah. Če se en konec prve in en konec druge povezave vidita, je eden od preostalih dveh koncev zagotovo ta števka – izbrišeš jo iz celic, ki vidijo oba. Aplikacija Oakever ta vzorec imenuje Skyscraper oziroma Zmaj z dvema vrvicama.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Za eno števko poišči dve vrstici ali stolpca, kjer je mogoča v natanko dveh celicah (močni povezavi). En konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok). Potem je vsaj eden od preostalih dveh koncev ta števka, zato jo izbrišemo iz celic, ki vidijo oba. Vzporedni povezavi s koncema v isti vrstici ali stolpcu tvorita Nebotičnik (Skyscraper), vrstica in stolpec s koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite).

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> V vaji je števka označena; izberi vse štiri celice vzorca.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> *(prazno)*

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Veriga ene števke: 5«
  - opis: »Za eno števko poišči dve vrstici ali stolpca, kjer je mogoča v natanko dveh celicah (močni povezavi). En konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok). Potem je vsaj eden od preostalih dveh koncev ta števka, zato jo izbrišemo iz celic, ki vidijo oba. Vzporedni povezavi s koncema v isti vrstici ali stolpcu tvorita Nebotičnik (Skyscraper), vrstica in stolpec s koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite). V vaji je števka označena; izberi vse štiri celice vzorca.«
- vaja 2 – naslov: »Veriga ene števke: 8«
  - opis: »Za eno števko poišči dve vrstici ali stolpca, kjer je mogoča v natanko dveh celicah (močni povezavi). En konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok). Potem je vsaj eden od preostalih dveh koncev ta števka, zato jo izbrišemo iz celic, ki vidijo oba. Vzporedni povezavi s koncema v isti vrstici ali stolpcu tvorita Nebotičnik (Skyscraper), vrstica in stolpec s koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite). V vaji je števka označena; izberi vse štiri celice vzorca.«
- vaja 3 – naslov: »Veriga ene števke: 1«
  - opis: »Za eno števko poišči dve vrstici ali stolpca, kjer je mogoča v natanko dveh celicah (močni povezavi). En konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok). Potem je vsaj eden od preostalih dveh koncev ta števka, zato jo izbrišemo iz celic, ki vidijo oba. Vzporedni povezavi s koncema v isti vrstici ali stolpcu tvorita Nebotičnik (Skyscraper), vrstica in stolpec s koncema v istem bloku pa Zmaj z dvema vrvicama (2-String Kite). V vaji je števka označena; izberi vse štiri celice vzorca.«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- nad mrežo še »Označena števka: N«
- pod mrežo »Sive celice so že rešene; prikazani so kandidati praznih celic.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Veriga ene števke in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »Na števki 5 poišči verigo ene števke in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Števka je poudarjena.«

## 10 · W-krilo (W-Wing)

Ključ: `w-wing` (`W-Wing`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Če obstaja vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah in ena od njiju vidi prvo, druga pa drugo celico para, potem obe celici para ne moreta biti b – vsaj ena je a. Zato lahko a izbrišeš iz vsake celice, ki vidi obe celici para. Aplikacija Oakever ta vzorec imenuje Krilo W.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Poišči dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Nato poišči vrstico, stolpec ali blok, kjer je b mogoč samo v dveh celicah — nobena ne sme biti celica para — pri čemer ena vidi prvo, druga pa drugo celico para. Takrat je vsaj ena celica para enaka a, zato a izbrišemo iz celic, ki vidijo obe.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Izberi obe celici para in obe celici povezave (4 celice).

**Posledica** (`TEHNIKE_OPISI.posledica`):

> *(prazno)*

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »W-krilo: celici para in celici povezave«
  - opis: »Poišči dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Nato poišči vrstico, stolpec ali blok, kjer je b mogoč samo v dveh celicah — nobena ne sme biti celica para — pri čemer ena vidi prvo, druga pa drugo celico para. Takrat je vsaj ena celica para enaka a, zato a izbrišemo iz celic, ki vidijo obe. Izberi obe celici para in obe celici povezave (4 celice).«
- vaja 2 – naslov: »W-krilo: celici para in celici povezave«
  - opis: »Poišči dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Nato poišči vrstico, stolpec ali blok, kjer je b mogoč samo v dveh celicah — nobena ne sme biti celica para — pri čemer ena vidi prvo, druga pa drugo celico para. Takrat je vsaj ena celica para enaka a, zato a izbrišemo iz celic, ki vidijo obe. Izberi obe celici para in obe celici povezave (4 celice).«
- vaja 3 – naslov: »W-krilo: celici para in celici povezave«
  - opis: »Poišči dve celici z natanko istim parom kandidatov {a, b}, ki se ne vidita. Nato poišči vrstico, stolpec ali blok, kjer je b mogoč samo v dveh celicah — nobena ne sme biti celica para — pri čemer ena vidi prvo, druga pa drugo celico para. Takrat je vsaj ena celica para enaka a, zato a izbrišemo iz celic, ki vidijo obe. Izberi obe celici para in obe celici povezave (4 celice).«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- pod mrežo »Sive celice so že rešene; prikazani so kandidati praznih celic.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike W-krilo in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »Kandidata para sta 4 in 7: poišči W-krilo in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Števki sta poudarjeni.«

## 11 · XY-krilo (XY-Wing, Y-Wing)

Ključ: `xy-wing` (`XY-Wing`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Pivot z dvema kandidatoma (x, y) ima dve krili: krilo 1 z njim deli x, krilo 2 deli y – obe krili imata poleg tega skupnega kandidata z. Ta z lahko izbrišeš iz vsake celice, ki vidi obe krili hkrati.

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno števko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok).

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Med prikazanimi celicami izberi pivota in obe krili (3 celice).

**Posledica** (`TEHNIKE_OPISI.posledica`):

> Če je v pivotu x, je z v krilu 2, če je y, je z v krilu 1 – z zato izbrišeš iz vseh celic, ki vidijo obe krili.

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »XY-krilo: pivot in dve krili«
  - opis: »Poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno števko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok). Med prikazanimi celicami izberi pivota in obe krili (3 celice).«
- vaja 2 – naslov: »XY-krilo: pivot in dve krili«
  - opis: »Poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno števko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok). Med prikazanimi celicami izberi pivota in obe krili (3 celice).«
- vaja 3 – naslov: »XY-krilo: pivot in dve krili«
  - opis: »Poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno števko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok). Med prikazanimi celicami izberi pivota in obe krili (3 celice).«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- pod mrežo »Sive celice so že rešene; prikazani so kandidati praznih celic.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike XY-krilo in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »Poišči XY-krilo s pivotom V4S7 in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

## 12 · Edinstveni pravokotnik (Unique Rectangle)

Ključ: `unique-rectangle` (`Unique Rectangle`).

**Opis na kartici** (meni treninga, `trening/index.html`):

> Štiri celice v dveh vrsticah, dveh stolpcih in dveh blokih: tri imajo natanko isti par kandidatov, četrta pa poleg njiju še dodatne. Tehnika velja, ker ima uganka natanko eno rešitev – če bi bila tudi četrta celica omejena na ta par, bi bili mogoči dve rešitvi (zamenjava para po pravokotniku).

**Razlaga** (`TEHNIKE_OPISI.razlaga`):

> Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y.

**Navodilo** (`TEHNIKE_OPISI.navodilo`):

> Izberi vse štiri celice pravokotnika.

**Posledica** (`TEHNIKE_OPISI.posledica`):

> *(prazno)*

**Naloga v »Spoznaj«** (naslov nad mrežo in opis pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Edinstveni pravokotnik: smrtonosni vzorec«
  - opis: »Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y. Izberi vse štiri celice pravokotnika.«
- vaja 2 – naslov: »Edinstveni pravokotnik: smrtonosni vzorec«
  - opis: »Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y. Izberi vse štiri celice pravokotnika.«
- vaja 3 – naslov: »Edinstveni pravokotnik: smrtonosni vzorec«
  - opis: »Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y. Izberi vse štiri celice pravokotnika.«
- vir opisa: razlaga + navodilo (`opisVaje()`)
- pod mrežo »Sive celice so že rešene; prikazani so kandidati praznih celic.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo; opis pod njim je razlaga, vajam 1–6 se doda poved o območju):

- vaje 7–9 (brez območja): »Poišči korak tehnike Edinstveni pravokotnik in odstrani kandidate, ki jih izloči.«
- vaje 1–6 (z območjem, primer): »V blokih 6 in 9 poišči edinstveni pravokotnik in odstrani kandidate, ki jih izloči.«
  - pripis k razlagi: »Območje je na mreži uokvirjeno.«

