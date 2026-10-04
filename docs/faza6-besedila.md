# Faza 6 – besedila tehnik (končno stanje)

Izpis vseh besedil tehnik E1, E2 in 1–12, kot so v kodi **po koraku b** faze 6 (commit `3244ee9`,
2026-10-04). Zgodovina: prvi izpis `03a815d` (pred fazo 6), izpis po koraku a `3f64a94`, potrjeni
predlog s starim in novim besedilom `3244ee9` (ta datoteka v tistem commitu). Načrt faze 6 je v
`docs/faza6-nacrt.md`.

Izpis je narejen samodejno iz kode (skripta naloži `shared/engine.js`, `trening/generators.js` in
`trening/v-uganki.js` v Node in pokliče iste funkcije kot trening), zato je besedilo dobesedno to,
kar se pokaže. Številke, enote in celice v primerih nalog so iz generatorja (seme je stalno) – v vaji
so vsakič drugačne.

## Kje se katero besedilo pokaže

| Besedilo | Vir v kodi | Kje ga vidiš |
|---|---|---|
| **Povzetek** | `TEHNIKE_OPISI[].povzetek` v `shared/engine.js` | kartica v meniju treninga (izpolni `trening.js`; v `trening/index.html` je enak nadomestek); pod nalogo v »Spoznaj« in »Vadi v uganki« |
| **Razlaga** | `TEHNIKE_OPISI[].razlaga` | zložljiv razdelek »Razlaga« pod nalogo (privzeto zaprt) v »Spoznaj« in »Vadi v uganki«; okno Pomoč v igri (»Tehnike«) |
| **Posledica** | `TEHNIKE_OPISI[].posledica` | za razlago na istih mestih |
| **Navodilo** | `TEHNIKE_OPISI[].navodilo` | »Spoznaj«, pod nalogo za povzetkom (pri 1, 2, 7, 8 in E1/E2 v vajah 1–6 namesto njega lasten opis naloge) |
| **Naloga v »Spoznaj«** | `unitLabel` (naslov) in `desc` v `trening/generators.js` | nad mrežo vaje |
| **Naloga v »Vadi v uganki«** | `navodiloVadi()` v `trening/v-uganki.js` | nad mrežo vaje; pod njim povzetek s pripisom o območju |

Pravila besedil (pripombe 2026-10-04): razlaga pove, kako vzorec prepoznaš, posledica, kaj
izbrišeš (pri enojčkih vpišeš) in zakaj; glagol »izbriši«; druga oseba ednine; števila z besedo;
pari v zavitih oklepajih {x, y}; »enota« in »vidi« razložena ob prvi omembi; predlog po števki (z 1,
z 2, s 3 … s 7, z 8, z 9). Pravila preverja `tests/trening-tehnike.test.js` – tudi v sporočilih
korakov, namigih in sporočilih »Preveri«.

Popravki, ki si jih dal ob potrditvi predloga in so v tem izpisu že upoštevani: »Vadi v uganki« –
»izbriši kandidate, ki zaradi nje (njega) odpadejo«; 8 – navodilo »Izberi vse celice vzorca.«; 9 –
zadnji povedi razlage o Nebotičniku in Zmaju; 11 – povzetek »Pivot (osrednja celica) {x, y} vidi
krili …«; 12 – naslov »Edinstveni pravokotnik: štirje vogali«.

Zunaj tega izpisa (namigi, sporočila korakov, sporočila »Preveri«) so besedila usklajena po istih
pravilih (odločitve E1–E4 v `docs/faza6-nacrt.md`).

---

## E1 · Očitni enojček (Naked Single)

**Povzetek** (kartica v meniju; pod nalogo):

> Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Za prazno celico preglej njeno vrstico, stolpec in blok. Če je v njih skupaj vpisanih osem različnih števk, je v celici mogoča samo še deveta.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> To števko vpišeš v celico, ker nobena druga tam ni mogoča. Če imaš zapisane kandidate, je to celica z enim samim kandidatom.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi celico in nato števko, ki jo vpišeš.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- vaja 1 – naslov: »Katera števka je edina mogoča v označeni celici V6S9?«
  - pod nalogo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši. Celica je že izbrana – izberi samo števko, ki jo vpišeš.«
- vaja 4 – naslov: »V označenem stolpcu 9 poišči celico, v kateri je mogoča samo ena števka«
  - pod nalogo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši. Izberi celico v označenem stolpcu 9 in nato števko, ki jo vpišeš.«
- vaja 7 – naslov: »Poišči celico, v kateri je mogoča samo ena števka«
  - pod nalogo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši. Izberi celico in nato števko, ki jo vpišeš.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V vrstici 7 poišči celico, v kateri je mogoča samo ena števka, in jo vpiši.«
  - pod nalogo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči celico, v kateri je mogoča samo ena števka, in jo vpiši.«
  - pod nalogo: »Poišči prazno celico, v kateri je mogoča samo še ena števka, in jo vpiši.«

## E2 · Skriti enojček (Hidden Single)

**Povzetek** (kartica v meniju; pod nalogo):

> Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej vrstico, stolpec ali blok – vsak od njih je enota – in števko, ki v enoti še ni vpisana. Za vsako prazno celico enote preveri, ali je ta števka že v vrstici, stolpcu ali bloku celice. Če ostane ena sama celica, kjer je števka mogoča, si našel skriti enojček.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Števko vpišeš v to celico: v enoti mora biti, drugje pa ne more. Druge števke, ki bi bile v celici sicer mogoče, tam zato ne morejo biti.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi celico in nato števko, ki jo vpišeš.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- vaja 1 – naslov: »V označenem stolpcu 1 poišči edino celico, kjer je mogoča števka 9«
  - pod nalogo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši. Števka je že izbrana – izberi samo celico, v katero jo vpišeš.«
- vaja 4 – naslov: »V označenem bloku 4 poišči števko, ki je mogoča samo v eni celici«
  - pod nalogo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši. Izberi celico v označenem bloku 4 in nato števko, ki jo vpišeš.«
- vaja 7 – naslov: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici«
  - pod nalogo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši. Izberi celico in nato števko, ki jo vpišeš.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V vrstici 8 poišči števko, ki je mogoča samo v eni celici, in jo vpiši.«
  - pod nalogo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.«
  - pod nalogo: »Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.«

## 1 · Izločitev izven bloka (Pointing Pair/Triple)

**Povzetek** (kartica v meniju; pod nalogo):

> Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej blok in v njem eno števko. Če ležijo vse celice bloka, kjer je ta števka še kandidat, v isti vrstici (ali v istem stolpcu), si našel vzorec – dve ali tri celice. Smer: iz bloka v vrstico.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> V bloku mora biti števka v eni od teh celic, torej v tej vrstici. Zato v vrstici zunaj bloka ne more biti – tam jo izbrišeš. Pri stolpcu enako.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi celice vzorca – dve ali tri.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Blok 4 → Vrstica 6«
  - pod nalogo: »Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka. Števka 8: v bloku 4 je mogoča samo v celicah vrstice 6 – izberi te celice. Iz vrstice 6 zunaj bloka jo potem lahko izbrišeš.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V bloku 5 poišči izločitev izven bloka in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči izločitev izven bloka in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Če je števka v bloku mogoča samo v eni vrstici (ali stolpcu), jo izbrišeš iz te vrstice (ali stolpca) zunaj bloka.«

## 2 · Izločitev v bloku (Box-Line Reduction)

**Povzetek** (kartica v meniju; pod nalogo):

> Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej vrstico (ali stolpec) in v njej eno števko. Če ležijo vse celice vrstice, kjer je ta števka še kandidat, v istem bloku, si našel vzorec – dve ali tri celice. Smer: iz vrstice v blok.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> V vrstici mora biti števka v eni od teh celic, torej v tem bloku. Zato drugje v bloku ne more biti – iz celic bloka zunaj vrstice jo izbrišeš. Pri stolpcu enako.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi celice vzorca – dve ali tri.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Vrstica 9 → Blok 8«
  - pod nalogo: »Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka. Števka 9: v vrstici 9 je mogoča samo v celicah bloka 8 – izberi te celice. Iz bloka 8 zunaj vrstice jo potem lahko izbrišeš.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V stolpcu 2 poišči izločitev v bloku in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči izločitev v bloku in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Če je števka v vrstici (ali stolpcu) mogoča samo v enem bloku, jo izbrišeš iz preostanka tega bloka.«

## 3 · Očitni par (Naked Pair)

**Povzetek** (kartica v meniju; pod nalogo):

> Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve celici, ki imata natanko ista dva kandidata {x, y} in nobenega drugega.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> V eni celici bo x, v drugi y – drugih možnosti nimata. Zato x in y v enoti ne moreta biti nikjer drugje: iz vseh drugih celic enote ju izbrišeš.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi obe celici para.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Vrstica 5«
  - pod nalogo: »Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka. Izberi obe celici para.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V bloku 8 poišči očitni par in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči očitni par in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve celici v isti vrstici, stolpcu ali bloku imata natanko ista dva kandidata {x, y} – x in y izbrišeš iz drugih celic te vrstice, stolpca ali bloka.«

## 4 · Skriti par (Hidden Pair)

**Povzetek** (kartica v meniju; pod nalogo):

> Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve števki, ki sta mogoči samo v istih dveh celicah. V teh celicah so lahko še drugi kandidati, zato se par na prvi pogled ne vidi – je skrit.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Obe števki morata biti v enoti, mogoči pa sta samo v teh dveh celicah – torej ju zasedeta. Za druge števke v teh dveh celicah ni prostora: iz obeh celic izbrišeš vse druge kandidate.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi obe celici, nato še obe števki para.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Vrstica 1«
  - pod nalogo: »Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate. Izberi obe celici, nato še obe števki para.«
- po pravilnih celicah še vprašanje »Kateri dve števki tvorita skriti par? Klikni jih:«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V stolpcu 5 poišči skriti par in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči skriti par in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve števki sta v vrstici, stolpcu ali bloku mogoči samo v istih dveh celicah – iz teh dveh celic izbrišeš vse druge kandidate.«

## 5 · Očitna trojica (Naked Triple)

**Povzetek** (kartica v meniju; pod nalogo):

> Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri celice, ki imajo skupaj samo tri različne kandidate {x, y, z}. Posamezna celica ima lahko vse tri ali samo dva od njih, npr. {x, y}, {y, z} in {x, z}.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Tri celice potrebujejo tri različne števke, na voljo pa imajo samo x, y in z – torej jih zasedejo. Zato teh treh števk v enoti ni nikjer drugje: iz vseh drugih celic enote jih izbrišeš.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi vse tri celice trojice.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Vrstica 6«
  - pod nalogo: »Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka. Izberi vse tri celice trojice.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V bloku 2 poišči očitno trojico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči očitno trojico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Tri celice v isti vrstici, stolpcu ali bloku imajo skupaj samo tri različne kandidate – te tri števke izbrišeš iz drugih celic te vrstice, stolpca ali bloka.«

## 6 · Skrita trojica (Hidden Triple)

**Povzetek** (kartica v meniju; pod nalogo):

> Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri števke, ki so mogoče samo v istih treh celicah. Posamezna števka je lahko mogoča tudi samo v dveh od teh celic, v celicah pa so lahko še drugi kandidati – zato je trojica skrita.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Vse tri števke morajo biti v enoti, mogoče pa so samo v teh treh celicah – torej jih zasedejo. Za druge števke v njih ni prostora: iz teh treh celic izbrišeš vse druge kandidate.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi vse tri celice, nato še vse tri števke trojice.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Vrstica 1«
  - pod nalogo: »Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate. Izberi vse tri celice, nato še vse tri števke trojice.«
- po pravilnih celicah še vprašanje »Katere tri števke tvorijo skrito trojico? Klikni jih:«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V stolpcu 4 poišči skrito trojico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči skrito trojico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Tri števke so v vrstici, stolpcu ali bloku mogoče samo v istih treh celicah – iz teh celic izbrišeš vse druge kandidate.«

## 7 · X-krilo (X-Wing)

**Povzetek** (kartica v meniju; pod nalogo):

> Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci).

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poišči dve vrstici, v katerih je števka mogoča samo v dveh celicah – v obeh vrsticah v istih dveh stolpcih. Te štiri celice so vogali pravokotnika. Enako deluje z zamenjanimi vlogami: dva stolpca, v katerih je števka mogoča samo v istih dveh vrsticah.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> V vsaki od obeh vrstic mora biti števka v enem od dveh vogalov. V istem stolpcu ne moreta biti obe, zato je ena v prvem, druga v drugem stolpcu – oba stolpca imata števko že v vogalih. Iz vseh drugih celic obeh stolpcev jo izbrišeš. Pri dveh stolpcih (vlogi zamenjani) jo enako izbrišeš iz obeh vrstic zunaj vogalov.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi vse štiri vogale.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- vaja z vrsticami – naslov: »X-krilo za števko 6«
  - pod nalogo: »Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci). Števka 6: poišči dve vrstici, v katerih je 6 mogoča samo v istih dveh stolpcih, in izberi štiri vogale.«
- vaja s stolpci – naslov: »X-krilo za števko 9«
  - pod nalogo: »Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci). Števka 9: poišči dva stolpca, v katerih je 9 mogoča samo v istih dveh vrsticah, in izberi štiri vogale.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »Za števko 7 poišči X-krilo in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci). Števka je poudarjena.«
- vaje 7–9 (brez območja): »Poišči X-krilo in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Če je števka v dveh vrsticah mogoča samo v istih dveh stolpcih, jo izbrišeš iz teh dveh stolpcev v vseh drugih vrsticah (ali z zamenjanimi vrsticami in stolpci).«

## 8 · Mečarica (Swordfish)

**Povzetek** (kartica v meniju; pod nalogo):

> Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poišči tri vrstice, v katerih je števka mogoča samo v istih treh stolpcih. V posamezni vrstici je lahko mogoča v vseh treh ali samo v dveh od teh stolpcev. Enako deluje z zamenjanimi vlogami: trije stolpci, v katerih je števka mogoča samo v istih treh vrsticah.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> V vsaki od treh vrstic mora biti števka v enem od teh treh stolpcev, in to vsakič v drugem – torej ima vsak od treh stolpcev števko že v vzorcu. Iz vseh drugih celic teh treh stolpcev jo izbrišeš. Pri treh stolpcih (vlogi zamenjani) jo enako izbrišeš iz treh vrstic zunaj vzorca.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi vse celice vzorca.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- vaja z vrsticami – naslov: »Mečarica za števko 5«
  - pod nalogo: »Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah. Števka 5: poišči tri vrstice, v katerih je 5 mogoča samo v istih treh stolpcih, in izberi vse celice s 5 v teh treh vrsticah.«
- vaja s stolpci – naslov: »Mečarica za števko 1«
  - pod nalogo: »Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah. Števka 1: poišči tri stolpce, v katerih je 1 mogoča samo v istih treh vrsticah, in izberi vse celice z 1 v teh treh stolpcih.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »Za števko 1 poišči mečarico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah. Števka je poudarjena.«
- vaje 7–9 (brez območja): »Poišči mečarico in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Razširjeno X-krilo: če je števka v treh vrsticah mogoča samo v istih treh stolpcih, jo iz teh stolpcev izbrišeš v vseh drugih vrsticah.«

## 9 · Veriga ene števke (Turbot Fish)

**Povzetek** (kartica v meniju; pod nalogo):

> Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.)

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Za eno števko poišči dve povezavi. Povezava je vrstica ali stolpec, v katerem je števka mogoča samo v dveh celicah – to sta konca povezave. Povezavi sta lahko dve vrstici, dva stolpca ali vrstica in stolpec. En konec prve povezave mora videti en konec druge: celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Če sta povezavi dve vrstici (ali dva stolpca) in sta konca, ki se vidita, v istem stolpcu (ali vrstici), je to Nebotičnik (Skyscraper). Če sta povezavi vrstica in stolpec in sta konca, ki se vidita, v istem bloku, je to Zmaj z dvema vrvicama (2-String Kite).

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Konca, ki se vidita, ne moreta imeti števke oba. Če je ni na enem od njiju, je na drugem koncu njegove povezave – zato je števka vsaj na enem od preostalih dveh koncev. Iz celic, ki vidijo oba ta konca, jo izbrišeš.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Števka je označena. Izberi vse štiri konce obeh povezav.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Veriga ene števke: 6«
  - pod nalogo: »Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.) Števka je označena. Izberi vse štiri konce obeh povezav.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »Za števko 5 poišči verigo ene števke in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.) Števka je poudarjena.«
- vaje 7–9 (brez območja): »Poišči verigo ene števke in izbriši kandidate, ki zaradi nje odpadejo.«
  - pod nalogo: »Dve povezavi iste števke se z enim koncem vidita – števko izbrišeš iz celic, ki vidijo oba druga konca. (Povezava je vrstica ali stolpec, kjer je števka mogoča samo v dveh celicah; celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku.)«

## 10 · W-krilo (W-Wing)

**Povzetek** (kartica v meniju; pod nalogo):

> Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poišči dve celici z natanko istima kandidatoma {a, b}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je b mogoč samo v dveh celicah, ki nista celici para. To je povezava: ena njena celica mora videti prvo celico para, druga drugo.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Celici para ne moreta biti obe b: obe celici povezave bi takrat videli b in v povezavi b ne bi bil mogoč nikjer. Torej je vsaj v eni celici para a. Iz vseh celic, ki vidijo obe celici para, a izbrišeš.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi obe celici para in obe celici povezave (štiri celice).

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »W-krilo: celici para in celici povezave«
  - pod nalogo: »Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para. Izberi obe celici para in obe celici povezave (štiri celice).«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »Za par {4, 7} poišči W-krilo in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para. Števki sta poudarjeni.«
- vaje 7–9 (brez območja): »Poišči W-krilo in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Dve celici z istim parom {a, b}, ki se ne vidita (nista v isti vrstici, stolpcu ali bloku), povezuje vrstica, stolpec ali blok, kjer je b mogoč samo v dveh celicah – a izbrišeš iz celic, ki vidijo obe celici para.«

## 11 · XY-krilo (XY-Wing, Y-Wing)

**Povzetek** (kartica v meniju; pod nalogo):

> Pivot (osrednja celica) {x, y} vidi krili {x, z} in {y, z} – z izbrišeš iz celic, ki vidijo obe krili.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poišči pivot (osrednjo celico) z natanko dvema kandidatoma {x, y}. Nato poišči dve krili – celici z natanko dvema kandidatoma, ki ju pivot vidi (sta z njim v isti vrstici, stolpcu ali bloku): eno krilo ima {x, z}, drugo {y, z}. Krili si delita števko z, ki je pivot nima.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Če je v pivotu x, krilo {x, z} ne more biti x, zato je z. Če je v pivotu y, je z v krilu {y, z}. V enem od kril je torej z – iz vseh celic, ki vidijo obe krili, z izbrišeš.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi pivot in obe krili (tri celice).

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »XY-krilo: pivot in dve krili«
  - pod nalogo: »Pivot (osrednja celica) {x, y} vidi krili {x, z} in {y, z} – z izbrišeš iz celic, ki vidijo obe krili. Izberi pivot in obe krili (tri celice).«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »Poišči XY-krilo s pivotom V4S7 in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Pivot (osrednja celica) {x, y} vidi krili {x, z} in {y, z} – z izbrišeš iz celic, ki vidijo obe krili. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči XY-krilo in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Pivot (osrednja celica) {x, y} vidi krili {x, z} in {y, z} – z izbrišeš iz celic, ki vidijo obe krili.«

## 12 · Edinstveni pravokotnik (Unique Rectangle)

**Povzetek** (kartica v meniju; pod nalogo):

> Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi.

**Razlaga** (razdelek »Razlaga«; okno Pomoč v igri):

> Poišči štiri celice, ki so vogali pravokotnika: ležijo v dveh vrsticah in dveh stolpcih, vse skupaj pa v natanko dveh blokih. Trije vogali imajo natanko ista kandidata {x, y}, četrti pa ima poleg x in y še vsaj enega kandidata.

**Posledica** (razdelek »Razlaga«; okno Pomoč v igri):

> Če bi bila v četrtem vogalu x ali y, bi v vseh štirih vogalih ostala samo x in y. Potem bi ju lahko po vogalih zamenjal in dobil drugo rešitev, uganka pa ima natanko eno. Zato četrti vogal ne more biti ne x ne y – oba izbrišeš iz njega.

**Navodilo** (»Spoznaj«, pod nalogo za povzetkom):

> Izberi vse štiri vogale pravokotnika.

**Naloga v »Spoznaj«** (naslov nad mrežo in besedilo pod njim; primeri iz generatorja):

- primer – naslov: »Edinstveni pravokotnik: štirje vogali«
  - pod nalogo: »Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi. Izberi vse štiri vogale pravokotnika.«

**Naloga v »Vadi v uganki«** (naslov nad mrežo in besedilo pod njim):

- vaje 1–6 (z območjem, primer): »V blokih 6 in 9 poišči edinstveni pravokotnik in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi. Območje je na mreži uokvirjeno.«
- vaje 7–9 (brez območja): »Poišči edinstveni pravokotnik in izbriši kandidate, ki zaradi njega odpadejo.«
  - pod nalogo: »Trije vogali pravokotnika v dveh blokih imajo isti par {x, y}: iz četrtega vogala izbrišeš x in y, sicer bi imela uganka dve rešitvi.«

