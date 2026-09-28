# Del 6 – trening »Vadi v uganki«: načrt

(2026-09-28, **načrt, čaka na potrditev** – kode še nisem spreminjal.) Posnetki so iz
prototipa v začasni kopiji projekta (trenutni `main` in dodatki iz točke 8). Prototip ni
v repozitoriju.

Izhodišče: `docs/trening-v-uganki-nacrt.md` (Odgovori, Opombe k delom – Del 6, Načrt
Claude Code točke 3–6, tabela plošče pri delu 5, senčenje) in analiza
`docs/trening-v-uganki.md` (3.2 izidi, 4.5 odločitve). Kjer se ta načrt razlikuje, velja
ta načrt (po potrditvi).

## 1. Uskladitev z današnjim stanjem

### 1.1 Kaj že obstaja

| Potreba dela 6 | Kje | Od kdaj |
|---|---|---|
| vaja kot igra z začetnimi potezami (Razveljavi in Začni znova ne gresta pod njih, `vrni` jih ne ponudi, začetnih vpisov ni mogoče zbrisati) | `shared/stanje.js` (`igraZZacetkom()`, `zacniZnova()`, `stanjeIgre().zacetni`) | del 1 |
| stanja v uganki, vaja iz stanja (`S0`, `KT`, `KV`, `resitev`, `stopnja`, `prejOdstranjenih`), presoja s šestimi izidi in `razveljavi` | `shared/vaje-uganka.js` (`stanjaVUganki()`, `vajaIzStanja()`, `vajaIzUganke()`, `preveriVajo()`) | del 2 |
| presoja in namig enojčka | `preveriEnojcek()`, `namigEnojcka()` (brez oznake = cela mreža) | del 2 in postopnost |
| banka (vsaj 50 ugank na tehniko, tudi »Presega tehnike«) | `shared/vaje-banka.js`; trening jo **že nalaga** (vaji 1 in 2) | del 3, geometrija 1–2 |
| mreža z robovi S/V, poudarek, oznake koraka, seznami, `oznacene`/`neaktivne`/`zasencene` | `shared/mreza.js`, `mreza.css` | del 4, geometrija, pripomočki |
| plošča: nizi Poudari/Vpiši/Odstrani, več celic, Razveljavi/Ponovi/Začni znova, tipkovnica s pari QWERTZ, seznami s stikali, `kandidati: false`, `obVpisu`, `samoEna`, `spremenljiva`, `pogled()`, kljukica »senči« in `sencenjeVidno()` | `shared/plosca.js`, `plosca.css` | del 5, pripomočki E1/E2 |
| barve poudarka iz nastavitev igre (samo branje) | `barvePoudarkaIzNastavitev()`; trening jih nastavi na `<html>` ob nalaganju | pripomočki E1/E2 |
| trening nalaga `stanje.js`, `vaje-uganka.js`, `vaje-banka.js`, `mreza.js`, `plosca.js` in sloge `mreza.css`, `plosca.css` | `trening/index.html` | deli 2–5 in samostojne naloge |
| štetje s pomočjo (vsak ogled namiga ali rešitve, E2 senčenje), krog 9 vaj, »Končano!« | `stej()`, `oznaciPomoc()`, `preveri()` v `trening/trening.js` | faza pred delom 1, pripomočki |
| stikala seznamov treninga | ključ `sudoku.trening.seznami` | pripomočki E1/E2 |

### 1.2 Kaj manjka

- izbira načina na kartici (gumba »Spoznaj« in »Vadi v uganki«);
- iskanje vaje s časovno mejo 1 s in banko kot rezervo (v kodi ga ni – `genPresek()` jemlje
  samo iz banke);
- zaslon vaje »Vadi v uganki« (nova `trening/v-uganki.js`) z odgovorom, »Preveri«,
  »Poskusi znova« in pomočjo s klikom;
- v `shared/` trije majhni dodatki (točka 8): prečrtani kandidati v mreži, predlog v
  celici, plošča brez vpisa in s predlogom, besedilo pod nizi za začetne vpise.

### 1.3 Pravilo »ne Presega tehnike« je odpadlo

Koda (`vaje-uganka.js`, banka, testi) ga že ne predpostavlja. Popravljena so še mesta v
dokumentih, ki so ga predpostavljala:

- `docs/trening-v-uganki-nacrt.md`: tabela časov v razdelku 0 in stavek »Pri tehnikah
  5–8 in 12 bo vaja večinoma iz banke« (zdaj opomba s sklicem na točko 7 spodaj), testna
  načrta v razdelku 6 (»ni Presega tehnike«) in vprašanje 4 v razdelku 7 (brezpredmetno);
- `docs/trening-v-uganki.md` 4.4: »Uganka Ekstrem« → »Presega tehnike« (ime iz časa pred
  opredelitvijo stopenj).

V delu 6 velja: vaja je stanje **pred** prvim poskusom s protislovjem, pogoj je samo ena
rešitev, stopnja uganke (tudi »Presega tehnike«) je samo informacija nad mrežo.

## 2. Razdelitev na korake

Predlagam štiri korake namesto treh. Razlog: pomoč je pri 1–12 dovolj velika in ločena od
presoje, da jo je bolje preveriti posebej; vsak dodatek v `shared/` pride v koraku, ki ga
prvi uporabi (in ga s tem tudi preveri). Vsak korak: testi, posnetek igre »Enako«,
scenarij v brskalniku (ustvari ga 6a, vsak naslednji korak ga dopolni), `CLAUDE.md`,
stanje v tem načrtu, commit + push.

| Korak | Vsebina | `shared/` |
|---|---|---|
| **6a** | izbira načina (dva gumba), iskanje vaje (sproti do 1 s, nato banka, »Iščem vajo …«), zaslon vaje za vseh 14 tehnik **samo za ogled in pripomočke**: vrstica nad vajo, stopnja uganke, vrstica s številom prej odstranjenih kandidatov in »pokaži prečrtane«, mreža (1–12 s kandidati, E1/E2 brez), poudarek, seznami; krog in »Končano!« s preskokom vaje | `mreza.js`: `precrtani` |
| **6b** | odgovor pri 1–12: niz »Odstrani« z »več celic«, Razveljavi/Ponovi/Začni znova, tipkovnica, »Preveri« s šestimi izidi, samodejna razveljavitev, »Poskusi znova«, zaklep in oznake po pravilnem odgovoru, štetje | `plosca.js`: `vpis: false`, besedilo za začetne vpise |
| **6c** | pomoč pri 1–12: »Namig« in »Rešitev« s klikom, ostaneta do »Skrij«, oznake in seznam dejanj na mreži, vsak ogled = s pomočjo | – |
| **6d** | E1/E2: vpis kot predlog v celici (niz »Vpiši« z vsemi 9 števkami, tipka, Backspace), presoja, senčenje (pri E2 pomoč), namig in rešitev; nato ročni pregled | `mreza.js`: `predlog`; `plosca.js`: `predlog: true` |

Po 6a je »Vadi v uganki« uporaben kot ogled stanja; »Preveri« pride v 6b. Če je vmesno
stanje na `main` moteče, lahko gumb »Vadi v uganki« do 6b ostane skrit (vprašanje 1).

## 3. Zaslon vaje in postavitev

Kartica vaje ostane ena, v enem stolpcu kot »Spoznaj« (`.container` 560 px), od zgoraj:

1. `ex-label`: »4 · Skriti par (Hidden Pair) · Vadi v uganki · Vaja 1 / 9«
   (`imeTehnike(kljuc, { stevilka: true })`);
2. naslov z navodilom: 1–12 »Poišči korak tehnike Skriti par in odstrani kandidate, ki
   jih izloči.«, E1 »Poišči celico z eno samo možno števko in jo vpiši.«, E2 »Poišči
   števko z enim samim mestom v enoti in jo vpiši.«; pod njim razlaga tehnike
   (`TEHNIKE_OPISI[m].razlaga`, brez `navodilo`, ki je za »Spoznaj«);
3. vrstica informacij: »Uganka: Zelo težka« (tudi »Presega tehnike«; izvor – banka ali
   sproti, s semenom – samo v `title`), pri 1–12 še »V tem stanju je že odstranjenih 11
   kandidatov (prejšnji koraki).« s kljukico **»pokaži prečrtane«** (sklanjanje: je
   odstranjen 1 kandidat / sta odstranjena 2 kandidata / so odstranjeni 3 kandidati / je
   odstranjenih 5 kandidatov; pri 0 samo »V tem stanju ni prej odstranjenih
   kandidatov.« brez kljukice; pri E1/E2 vrstice o kandidatih ni);
4. glava »Poudari števko« s kljukicama (»senči« samo pri E1/E2) in »več hkrati«, niz;
5. mreža z robovi S/V in seznama vrstic in stolpcev; opomba »Temne števke so dane,
   modre so vpisane na poti do te vaje.«;
6. 1–12: »Odstrani kandidata · ↺ = vrni« s kljukico »več celic«, niz; E1/E2: »Vpiši v
   izbrano celico (predlog)«, niz z vsemi 9 števkami;
7. vrstica z razlogom pod nizi;
8. 1–12: Razveljavi, Ponovi, Začni znova (brez števca potez – kazalec bi štel tudi
   začetne poteze, npr. »poteza 58 / 58«);
9. »Manjkajoče števke« s tremi stikali in seznam blokov;
10. »Preveri« / »Naslednja vaja →«, sporočilo, »Namig« in »Rešitev«, okvir pomoči.

Velikost celice kot pri E1/E2 v »Spoznaj« (`--gcs: min(46px, (min(560px, 100vw) -
104px) / 9)`, s seznamom vrstic `/ 10`), kandidati večji kot v igri (`* .34`, kot pri 1
in 2). Pri 375 px je celica 30 px, pri 1200 px 45 px; v prototipu ni vodoravnega drsnika
pri nobenem posnetku (`scrollWidth` = širina okna).

**Meni, 375 px** – gumba na vsaki kartici, klik drugam na kartici je »Spoznaj« (zato
obstoječi scenariji in testi, ki kliknejo kartico, delajo naprej):

![Meni z gumboma, 375 px](slike/vadi-v-uganki/predlog-meni-375.png)

**4 · Skriti par, 375 px, začetek vaje** – vklopljeni »pokaži prečrtane« (sivo
prečrtani kandidati, npr. V4S1 5, V9S8 6), poudarjena 5, izbrana V4S2:

![4, začetek, 375 px](slike/vadi-v-uganki/predlog-4-zacetek-375.png)

**4, 375 px, po enem izbrisu in »Preveri«** (izid `delno`, modro sporočilo) in odprta
»Rešitev«: oznake koraka na mreži (jantarno vzorec, rdeče prečrtano še neizvedeno),
seznam dejanj »Opravljeno: 1 od 6«:

![4, delno in rešitev, 375 px](slike/vadi-v-uganki/predlog-4-delno-resitev-375.png)

**4, 375 px, pravilno** – mreža zaklenjena (brez zelene obrobe, kot E1/E2 v »Spoznaj«),
vzorec jantarno, izbrisani kandidati koraka rdeče prečrtani. Na posnetku je »Začni znova«
še omogočen (prototip); v izvedbi se vrstica Razveljavi/Ponovi/Začni znova po pravilnem
odgovoru skrije:

![4, pravilno, 375 px](slike/vadi-v-uganki/predlog-4-pravilno-375.png)

**4, 1200 px**, seznama vrstic in stolpcev, začetek in delno z rešitvijo:

![4, začetek, 1200 px](slike/vadi-v-uganki/predlog-4-zacetek-1200.png)
![4, delno in rešitev, 1200 px](slike/vadi-v-uganki/predlog-4-delno-resitev-1200.png)

**E1, 375 in 1200 px** – predlog 5 v V2S5 (poševna modra števka v izbrani celici),
poudarjena 3, niz »Vpiši« z vsemi devetimi števkami:

![E1, predlog, 375 px](slike/vadi-v-uganki/predlog-e1-predlog-375.png)
![E1, predlog, 1200 px](slike/vadi-v-uganki/predlog-e1-predlog-1200.png)

**E2, 375 px** – »senči« s poudarjeno 4 in odprt »Namig« (»Poglej vrstico 4: …«):

![E2, senčenje in namig, 375 px](slike/vadi-v-uganki/predlog-e2-senci-namig-375.png)

Pri 1200 px je veliko praznega prostora ob strani, pomoč pa je pod mrežo. Dvostolpčna
postavitev (mreža levo, gumbi in pomoč desno, kot igra ≥ 900 px) je mogoča, a bi se
razlikovala od »Spoznaj« – vprašanje 2.

## 4. Tehnike 1–12: odgovor in »Preveri«

**Vnos.** Plošča s kandidati: niz »Odstrani« (odstrani/vrni, več celic, Ctrl+klik,
Shift+števka), Razveljavi/Ponovi/Začni znova (brez vprašanja – vrne na S0, poteze ostanejo
v »Ponovi«), puščice, Escape, Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y. Niza »Vpiši« ni, tipka s števko
brez Shift in Backspace/Delete ne naredita nič (`vpis: false`). Sivo senčenje sosed izbrane
celice ostane (kot v igri – pri 1–12 ni zatemnjenih celic postopnosti, s katerimi bi se
zlilo). Senčenja »senči« ni (odločitev D5a.6).

**Presoja** `preveriVajo(vaja, stanje)` – izidi in odziv UI:

| Izid | Sporočilo (iz `preveriVajo()`) | Slog | Šteje | Kaj še |
|---|---|---|---|---|
| `prazno` | »Odstrani kandidate, ki jih tehnika izloči.« | info | – | |
| `napacno` | »Ni pravilno.« + »Števka 7 je v V3S5 prava – …« | err | napačno | gumb **»Poskusi znova«** v sporočilu (= Začni znova) |
| `neutemeljeno` | »Izbris drži, a … Razveljavljeno: V3S5 (7).« | info | – | izbrisi zunaj KT se samodejno vrnejo |
| `druga-tehnika` | »To drži, a je to korak tehnike 10 · W-krilo, ne 8 · Mečarica. Razveljavljeno: …« | info | – | isto |
| `delno` | »Še ne.« + »Prav, a to še ni ves korak – manjkajo še 3 izbrisi.« | info | – | |
| `pravilno` | »Pravilno! « + sporočilo koraka | ok | pravilno | zaklep, oznake, »Naslednja vaja →« |

- **Samodejna razveljavitev** (odločitev 3): za vsak izbris iz `razveljavi` poteza
  `{ tip: 'kandidat', odstrani: false }` – samo funkcije iz `shared/stanje.js`, brez
  spremembe modela potez. »Razveljavi« jih potem vrača po eno. Druga možnost je ena
  poteza za vse (razširitev poteze `kandidati` na vračanje v `stanje.js`) – vprašanje 4.
- **»Preveri« po oceni** je onemogočen, dokler se igra ne spremeni (poteza, razveljavi,
  ponovi, začni znova). Tako isti napačni odgovor ne šteje dvakrat; v »Spoznaj« isto
  doseže počiščena izbira.
- **Pravilno:** `samoZaOgled()` (niz in tipke ne delajo), vrstica pod nizi »Vaja je
  rešena – nadaljuj z »Naslednja vaja«.«, vrstica Razveljavi/Ponovi/Začni znova se skrije,
  na mreži vzorec koraka (jantarno) in izbrisi koraka rdeče prečrtani (`precrtani` +
  `k-izbris`), poudarek ostane.
- Vpisi niso del odgovora; enojček, ki nastane po izbrisih, je že naslednja vaja.

## 5. E1 in E2

- Mreža brez kandidatov, izbrati je mogoče samo prazne celice, brez postopnosti (cela
  mreža, kot vaje 7–9 v »Spoznaj«), brez sivega senčenja sosed.
- Niz »Vpiši« ima za izbrano prazno celico omogočenih **vseh 9 števk** (samo kandidati bi
  izdali očitni enojček). Klik ali tipka s števko (tudi Numpad) postavi **predlog** v
  celico: poševna modra števka (`predlog`). Nov predlog zamenja starega (predlog je en
  sam), Backspace/Delete ga pobriše. Predlog ni poteza, zato ni Razveljavi/Ponovi/Začni
  znova (odločitev 2 v analizi).
- »Preveri« → `preveriVajo(vaja, stanje, predlog)` (`preveriEnojcek()`): `pravilno` –
  predlog postane poteza vpis, zaklep, celica zelena (s poudarkom in zelenim okvirjem, kot
  v »Spoznaj«); `nevtralno` – »Še ne.« (info, ne šteje), predlog se pobriše; `napacno` –
  »Ni pravilno.« (šteje), predlog se pobriše; brez predloga »Izberi celico in vpiši
  števko.«.
- Senčenje »senči« kot v »Spoznaj«: pri E2 je vaja s prikazanim senčenjem vaja s pomočjo,
  pri E1 ne. Kljukici »senči« in »več hkrati« ostaneta med vajami kroga.

## 6. Pomoč (»Namig«, »Rešitev«)

- Gumba se sprožita s **klikom** (ne »drži« kot v »Spoznaj«). Okvir pomoči pod gumboma
  ostane, dokler ga igralec ne zapre z **»Skrij«** ali ne gre na naslednjo vajo. »Rešitev«
  zamenja odprt namig.
- **Vsak ogled = s pomočjo** (`oznaciPomoc()`), tudi takoj zaprt; že šteti poskusi vaje se
  odštejejo; ogled po pravilnem odgovoru ne spremeni ničesar. Pravilo je isto kot v
  »Spoznaj«, zato isti `stej()`/`oznaciPomoc()`/`preveri()`.
- **Kateri korak:** ob odprtju pomoči korak iz `KT`, ki ima največ igralčevih izbrisov (pri
  enaki meri prvi), brez izbrisov `KT[0]` (= `nextStep()` v S0). Ostane isti, dokler je
  okvir odprt.
- **1–12:** namig = `stepHint(korak)`; rešitev = sporočilo koraka, legenda, seznam dejanj
  »Opravljeno: N od M« (kot v igri – izvedena zeleno prečrtana s kljukico), na mreži
  `oznakeKoraka(korak, stanje)` (samo še neizvedena dejanja, zato se ob vsakem izbrisu
  osvežijo); ko so izvedena vsa: »✓ Korak je izveden.«.
- **E1/E2:** namig = `namigEnojcka(gol, KT, korak, null, grid)` (cela mreža); rešitev =
  sporočilo koraka in oznake (enota pri E2 jantarno, celica zeleno s števko).
- Izris seznama dejanj (pribl. 20 vrstic) je v igri (`izrisiDejanja()` v `igra/igra.js`).
  Ker igra ostane nespremenjena, ga trening napiše sam (enako besedilo); logika koraka
  (`dejanjaKoraka()`) je skupna v `shared/stanje.js`.

## 7. Iskanje vaje

- `trening/v-uganki.js`: v glavni niti po eno uganko na `setTimeout` (deluje tudi pri
  `file://`): `genMinimalnaUganka(genNaklucnoSeme())` → `stanjaVUganki()` → pri najdenem
  stanju `vajaIzStanja()` z naključnim stanjem. Meja **1 s** se preverja med ugankami.
  Med iskanjem je v kartici »Iščem vajo …«.
- Po meji: **banka** – naključen zapis iz `VAJE_BANKA` s to tehniko, ki v tej seji še ni
  bil uporabljen (ko jih zmanjka, se začne znova), in `vajaIzUganke()`.
- Čas in naključnost se v testih nadomestita (meja 0 → banka, `Math.random` s semenom).

**Meritev v brskalniku** (Edge, namizni računalnik, prototip, 852 ugank v 20 s):
**23,5 ms na uganko** (uganka + pot), torej pribl. 42 ugank v 1 s. Delež vaj, najdenih
sproti v 1 s, po deležu ugank s stanjem iz analize 2.2 (20 000 ugank; vzorec v brskalniku
se z njim ujema) – ocena `1 − (1 − p)^42`, za telefon (3× počasneje, predpostavka)
`^14`:

| Tehnika | ugank s stanjem | sproti v 1 s (namizni) | telefon (ocena) |
|---|---:|---:|---:|
| E1, E2, 1, 2, 3, 9 | 20–99 % | 100 % | 96–100 % |
| 4 Skriti par | 14,8 % | 99,9 % | 89 % |
| 10 W-krilo | 10,8 % | 99 % | 80 % |
| 11 XY-krilo | 5,9 % | 92 % | 57 % |
| 7 X-krilo | 4,4 % | 85 % | 47 % |
| 5 Očitna trojica | 3,9 % | 81 % | 43 % |
| 12 Edinstveni pravokotnik | 2,5 % | 65 % | 30 % |
| 6 Skrita trojica | 1,3 % | 42 % | 17 % |
| 8 Mečarica | 1,0 % | 34 % | 13 % |

Tabela v `docs/trening-v-uganki-nacrt.md`, razdelek 0, je bila brez ugank »Presega
tehnike« in brez meritve v brskalniku, zato je bila zanje precej slabša (8 in 12: 14–18 %,
6: 0 %). Tudi zdaj bo pri 6, 8 in 12 vaja večkrat iz banke (odločitev 6); iskanje v ozadju
je v »KASNEJE«.

## 8. Kaj potrebujeta mreža in plošča (samo, kar del 6 uporabi)

| Dodatek | Kaj | Korak | Igra / »Spoznaj« |
|---|---|---|---|
| `mreza.js` `pogled.precrtani` | 81 mask: kandidat, ki ni v `kandidati`, a je v maski, se izriše kot `span.kand.precrtan` (sivo prečrtan); če je hkrati v `oznake.izbris`, še `k-izbris` (rdeče) | 6a (pokaži prečrtane), 6b (izbrisi po pravilnem) | ne podata ga – DOM enak |
| `mreza.css` | `.kand.precrtan`, `.kand.precrtan.k-izbris`, `.celica.predlog` | 6a, 6d | razredov ni |
| `plosca.js` `vpis: false` | tipka s števko brez Shift in Backspace/Delete ne naredita nič (vrneta `false`); niz »Vpiši« aplikacija ne poda | 6b | privzeto `true` |
| `plosca.js` razlog pod nizi | celica z vpisom iz začetnih potez: »V V3S5 je vpis iz prejšnjih korakov (7) – ne spreminja se.« namesto »tvoj vpis – najprej ga zbriši« (tega ni mogoče zbrisati) | 6b | igra: `zacetni` so same ničle – besedilo enako |
| `mreza.js` `pogled.predlog` | `{ celica, stevka }` ali null: prazna celica brez kandidatov pokaže števko z razredom `predlog` | 6d | ne podata ga |
| `plosca.js` `predlog: true` | niz »Vpiši« za eno izbrano prazno celico omogoči vseh 9 števk; Backspace/Delete pokliče `obVpisu(celica, 0)` | 6d | »Spoznaj« ima `obVpisu` brez `predlog` – enako kot zdaj |

Ne dodajam: števca potez glede na začetek (števca v vaji ni), posebnega zaklepa (zadošča
`samoZaOgled()` in skrita vrstica gumbov), branja barv (je že).

Slogi zaslona vaje so v `trening/trening.css` pod razredom `.vaja-uganka`; pravila, ki so
enaka kot pri `.vaja-enojcek` (velikost celice, robovi nizov, izbira, glava s kljukicami),
dobijo skupen izbirnik `.vaja-enojcek, .vaja-uganka` – izračunani slogi »Spoznaj« ostanejo
enaki (preveri scenarij).

## 9. Nespremenjeno: igra, reševalec, »Spoznaj«

- **Igra:** `node tools/posnetek-igre.js --primerjaj tools/posnetki/igra-pred-niz.json` →
  »Enako: 85 posnetkov.« po vsakem koraku; testi `igra-*`, `plosca`, `mreza` z enakimi
  pričakovanji.
- **Reševalec:** ne nalaga `mreza.js` ne `plosca.js`; testi `app-*`, `niz-danosti`.
- **»Spoznaj«:** vaje so enake (ista koda v `renderExercise()` za način »Spoznaj«, nova
  koda je v `trening/v-uganki.js`). Scenarij primerja z izhodiščem **`5b9ae6f`** (zadnji
  commit pred delom 6) za vseh 14 tehnik z `Math.random` s semenom: `innerHTML` območja
  vaje in izračunani slogi vseh elementov morata biti enaka. Obstoječa scenarija
  (`preveri-presek-brskalnik.js`, `preveri-enojcki-brskalnik.js`) morata ostati zelena.
  Spremeni se samo meni (gumba na kartici).

## 10. Testi in scenarij v brskalniku

- `tests/mreza.test.js`: `precrtani` (sivo, z `k-izbris` rdeče, ne pri kandidatu, ki je v
  `kandidati`), `predlog`.
- `tests/plosca.test.js`: `vpis: false` (števka, Numpad, Backspace ne spremenijo igre;
  Shift+števka odstrani – tudi par QWERTZ `key: '!'`, `code: 'Digit1'`), besedilo za začetni
  vpis, `predlog: true` (vseh 9 števk, `obVpisu`, Backspace).
- Nov `tests/trening-uganka-ui.test.js` (nadomestni DOM): gumba načina (klik kartice =
  Spoznaj); iskanje sproti in banka (meja 0, neuporabljeni zapisi); prikaz 1–12 (kandidati
  so kandidati S0, niza »Vpiši« ni, število prej odstranjenih s sklanjanjem, »pokaži
  prečrtane«); **vseh šest izidov** s pravimi potezami (izbrisi iz `KT`/`KV` in števk
  rešitve, ne na pamet – vaje iz semen, kot v `vaje-uganka.test.js`), samodejna
  razveljavitev, »Poskusi znova«, »Preveri« onemogočen do spremembe, pravilno (zaklep,
  oznake, skrita vrstica gumbov, štetje); krog 9 vaj in »Končano!«; pomoč (namig in
  rešitev ostaneta do »Skrij«, s pomočjo in odštevanje, oznake se osvežijo ob izbrisu, po
  pravilnem brez učinka); E1/E2 (brez kandidatov, vseh 9 števk, predlog, tipka, Backspace,
  izidi, senčenje pri E2 pomoč, pri E1 ne); tipkovnica s pari QWERTZ (Ctrl+Z je `key: 'z'`,
  `code: 'KeyY'`); besedila brez »številk«, »Prikaži« in angleških imen zunaj oklepaja.
- Obstoječi `trening-pomoc`, `trening-enojcki`, `trening-presek` ostanejo s **istimi
  pričakovanji**.
- Nov `tools/preveri-vadi-brskalnik.js` (po vzoru `preveri-enojcki-brskalnik.js`), pri 375
  in 1200 px: 1–12 (vsaj 4, 8, 12) in E1/E2 – brez drsnika, plošča v kartici, kandidati in
  izračunan slog prečrtanih, pravi kliki in tipke (tudi pari QWERTZ), »Preveri« do
  pravilnega odgovora s pravimi kliki, rešitev z oznakami, senčenje, »Iščem vajo …« in
  banka pri meji 0, brez napak JS, posnetki zaslona (pogledam jih sam); primerjava
  »Spoznaj« z izhodiščem `5b9ae6f` (točka 9).
- Testi zdaj: 379; pričakujem pribl. 379 + 15.

## 11. Vprašanja

1. **Razdelitev:** štirje koraki 6a–6d (predlog; pomoč 1–12 ločeno, dodatki v `shared/` v
   koraku, ki jih prvi uporabi). Naj bo gumb »Vadi v uganki« do 6b skrit?
2. **Postavitev:** en stolpec kot »Spoznaj« (predlog) ali dva stolpca pri ≥ 900 px?
3. **»Preveri« po oceni onemogočen do naslednje spremembe** (predlog)?
4. **Samodejna razveljavitev:** ena poteza »vrni« na izbris (predlog, brez spremembe
   `stanje.js`) ali ena poteza za vse?
5. **Po pravilnem odgovoru pri 1–12** izbrisani kandidati koraka rdeče prečrtani, vrstica
   Razveljavi/Ponovi/Začni znova skrita (predlog)?
6. **Predlog pri E1/E2:** poševna modra števka (predlog) – ali drug videz?
7. **Vrstica informacij:** stopnja uganke vidna (tudi »Presega tehnike«), izvor vaje
   (banka/sproti, seme) samo v `title` (predlog)?
8. **»Pokaži prečrtane«** ostane med vajami kroga, ne shranjuje se; stikala seznamov imajo
   isti ključ kot »Spoznaj« (`sudoku.trening.seznami`) (predlog)?

## 12. Ročni pregled (en sam, po 6d – osnutek, največ 5)

1. **Trening, pravi telefon, 1–12 (npr. 4) z vklopljenim »pokaži prečrtane«:** preberi
   kandidate, loči prečrtane od navadnih, izberi celico s prstom in odstrani kandidata.
   Pričakovano: berljivo pri 30 px, prečrtani jasno drugačni, brez zgrešenih dotikov. Ni
   avtomatsko: berljivost in dotik.
2. **Trening, slovenska tipkovnica, 1–12:** Shift+števka, Ctrl+Z, Ctrl+Y; E1: števka in
   Backspace. Pričakovano: odstrani/razveljavi/ponovi, predlog se postavi in pobriše. Ni
   avtomatsko: scenarij pošlje pare `key`/`code`, ne prave razporeditve sistema.
3. **Trening, telefon, 8 · Mečarica:** nekajkrat »Naslednja vaja«. Pričakovano: »Iščem
   vajo …« največ pribl. 1 s, nato vaja. Ni avtomatsko: hitrost pravega telefona ni
   izmerjena (faktor 3 je predpostavka).
4. **Trening, 1–12:** izzovi »druga tehnika« in »neutemeljeno« (odstrani kandidata, ki ga
   izloči druga tehnika, ali kandidata brez utemeljitve, ki ni prava števka). Pričakovano: sporočilo je razumljivo in ne zveni kot napaka, izbrisi se
   vrnejo. Ni avtomatsko: razumljivost besedila.
