# Ročni test

Tu je samo tisto, česar testi, posnetek igre (`tools/posnetek-igre.js`) in brskalnik brez
glave (`tools/brskalnik.js`) ne vidijo: CSS, prava tipkovnica (slovenska QWERTZ), pravo
odložišče, dotik, odprta okna, presoja uporabnosti. **(nepotrjeno)** pomeni, da pričakovani
izid ni iz potrjenega seznama in ga je treba ob naslednjem ročnem pregledu potrditi ali
popraviti.

## Priprava

- Aplikacije z lokalnega strežnika: iz korena projekta `python -m http.server`, nato
  `http://localhost:8000/igra/`, `…/app/` ali `…/trening/`.
- **Čisto okno je InPrivate** (Edge) – brez razširitev in brez stare shrambe.
- **Console (F12):** napake razširitev (npr. `bootstrap-autofill`, `VM…` brez datoteke
  projekta) ne štejejo. Šteje samo napaka z datoteko projekta (`igra.js`, `plosca.js`,
  `mreza.js`, `stanje.js`, `app.js`, `zbirka.js` …).
- **Uganka mora biti nerešena** pri testih vnosa (del 5, točke 1–7, 9, 10): rešena uganka
  je zaklenjena in poteze ne delajo. Odpri novo uganko (»Nova uganka« ali vgrajeni
  primer) ali uporabi »Začni znova«.
- **Števec »poteza X / Y«** pod mrežo spremljaj ves čas: poteza »odstrani kandidata« je
  na mreži komaj vidna (izgine droben kandidat), števec pa se poveča za 1.

## Del 5 – igralna plošča (`shared/plosca.js`)

Iz ročnega pregleda dela 5 (`docs/trening-v-uganki-nacrt.md`, »8. Ročni pregled igre po
izvedbi«, točke 1–10). Točk 11 in 12 v načrtu ni; sestavljeni sta iz kode.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | igra | Klik prazne celice, ponoven klik iste celice, klik dane celice. | Prvi klik izbere celico (modra obroba), njena vrstica, stolpec in blok so sivi. Ponoven klik izbiro prekliče. Dana celica se izbere, niza sta onemogočena, vrstica pod nizi pove, da je števka dana. Potrjeno (ročni pregled 28. 9. 2026). |
| 2 | igra | Vpis z nizom »Vpiši« in s tipkovnico (vrstica števk in Numpad). Po vpisu puščica. Prva puščica brez izbire. Puščice na robu mreže. | Števka je vpisana, izbira se izklopi, števec +1. Puščica po vpisu nadaljuje od vpisane celice. Prva puščica brez izbire izbere V1S1. Na robu mreže se izbira ne premakne čez rob. |
| 3 | igra | Shift+števka na izbrani prazni celici (slovenska razporeditev), še enkrat ista. Backspace in Delete na celici z vpisom. | Prvi Shift+števka odstrani kandidata, drugi ga vrne (vsakič števec +1). Backspace in Delete zbrišeta vpis. |
| 4 | igra | Kljukica »več celic« ali Ctrl+klik: izberi več praznih celic, odstrani skupnega kandidata, nato Razveljavi. Escape; izklop kljukice. Puščice pri več izbranih. | Kandidat izgine iz vseh izbranih celic v eni potezi (števec +1), Razveljavi ga vrne vsem naenkrat. Escape in izklop kljukice počistita izbiro. Puščice pri več izbranih ne naredijo nič. |
| 5 | igra | Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y (tipka z napisom Z oziroma Y na QWERTZ); gumba Razveljavi/Ponovi. | Ctrl+Z razveljavi, Ctrl+Shift+Z in Ctrl+Y ponovita – po napisu na tipki, ne po mestu. Števec »poteza X / Y« se ustrezno spreminja; gumba sta onemogočena na začetku/koncu zgodovine. |
| 6 | igra | Niz »Poudari«: ena števka; kljukica »več hkrati« in pet števk; izklop. Deveti vpis poudarjene števke; ponoven vklop te števke. | Poudarjena števka ima modro podlago. Pri »več hkrati« barve po vrsti rumena, zelena, oranžna, modra, peta spet rumena. Ob izklopu kljukice ostane zadnja. Deveti vpis izklopi poudarek; ponoven vklop pokaže vseh devet mest. |
| 7 | igra | Stikala seznamov Vrstice/Stolpci/Bloki (vsa tri), osvežitev strani (F5). Seznam vrstic na ozkem oknu (telefon ali pribl. 390 px). | Ob mreži in pod njo se pokažejo kvadratki manjkajočih števk, mala mreža 3×3 za bloke. Po F5 ostanejo stikala, kot so bila. Seznam vrstic zmanjša celice, mreža ostane na zaslonu brez vodoravnega drsnika. Potrjeno (ročni pregled 28. 9. 2026). |
| 8 | igra | Reši uganko do konca, nato »Začni znova« (preklic, nato potrditev), nato »Ponovi«. | Po zadnji potezi zelena obroba mreže, vrstica pod nizi v zelenem okvirju pove, da je mreža zaklenjena, »Začni znova« je poudarjen. »Začni znova« vpraša; po potrditvi je mreža prazna, »Ponovi« vrne poteze. |
| 9 | igra | Odpri okno (Zbirka, Pomoč, Nova uganka) in pritiskaj števke, puščice, Shift+števka; Escape. V razdelku »Barve poudarka« tipkaj v hex polje. | Mreža se ne spremeni, števec ostane. Escape zapre okno. Tipkanje v hex polje ne vpisuje v mrežo. |
| 10 | igra | Kartica »Pomoč«: »Naslednji korak« (ime tehnike → »Pokaži več« → »Pokaži rešitev«). Namerno napačen vpis, »Preveri«, »Vrni na stanje pred potezo N«. | Tri stopnje: ime, namig, razlaga z jantarnimi celicami vzorca, rdeče prečrtanimi kandidati in zeleno števko za vpis. »Preveri« pokaže rdeč križec in gumb; po vrnitvi je napaka odstranjena, poteze so v »Ponovi«. |
| 11 | igra | Razdelek »Barve poudarka« pod mrežo: gumb 1, izbirnik barv ali hex (npr. `#ffb3b3`); poudari števko; F5; »Privzeto«. | Poudarjena števka v mreži in v seznamih manjkajočih števk dobi novo barvo takoj, brez osveževanja. Po F5 barva ostane (`sudoku.igra.poud`). »Privzeto« vrne vse štiri barve. Potrjeno (ročni pregled 28. 9. 2026). |
| 12 | trening → igra | Odpri igro z uganko v teku, poudarkom in vklopljenim seznamom; v istem oknu odpri trening in reši nekaj vaj; nato spet odpri igro. | Igra se odpre na isti uganki z istim številom potez, stikala seznamov in barve poudarka so nespremenjeni – trening ključev igre ne spreminja: piše samo svoj `sudoku.trening.seznami` (stikala seznamov pri E1/E2), `sudoku.igra.poud` samo bere (barve poudarka). Neposrednega prehoda (gumba) iz treninga v igro še ni; pride z idejo »Nadaljuj v igri« (`docs/trening-v-uganki-nacrt.md`, »Po želji«) – takrat se ta točka razširi. Potrjeno (ročni pregled 28. 9. 2026). |

## Vnos niza (reševalec in igra)

Iz načrta naloge `docs/niz-resevalec-nacrt.md` (ročne točke; commita `a348672`, `7e04cb4`).
Logiko preverijo `tests/niz-danosti.test.js`, `tests/igra-ui.test.js`, posnetek igre in
`tools/preveri-niz-brskalnik.js`.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | reševalec | Kopiraj niz iz `docs/uganke.md` (tudi večvrstični zapis mreže) in ga prilepi v polje Niz s Ctrl+V, nato še z desnim klikom → Prilepi. | Mreža se izpolni, status »Niz je vpisan v mrežo – danih števk: N.«. |
| 2 | reševalec, telefon | Dolg pritisk v polje Niz → Prilepi. | Mreža se izpolni, zaslonska tipkovnica ne prekrije sporočila. |
| 3 | igra | »Nova uganka« → v polje niza prilepi (Ctrl+V) niz z `x` namesto pik. | Sporočilo našteje `x` (»Neveljaven znak »x« je izpuščen – prazna celica je 0 ali pika.«) in pove število veljavnih znakov (»… (potrebnih je 81).«). |
| 4 | reševalec | Oceni postavitev: polje Niz nad mrežo, besedilo v glavi, rdeče sporočilo pri prekratkem nizu (tudi pri 375 px). | Razumljivo in ne moti ročnega vnosa v mrežo. |

## Trening: tehniki 1 in 2 na delni mreži (»Spoznaj«)

Iz načrta `docs/geometrija-1-2-nacrt.md`. Logiko preverijo `tests/trening-presek.test.js`,
`tests/mreza.test.js`, `tests/trening-pomoc.test.js` in `tools/preveri-presek-brskalnik.js`
(tudi, da je izris drugih tehnik enak kot pred spremembo).

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, pravi telefon | 1 · Izločitev izven bloka: preberi kandidate v vidnih celicah in izberi dve celici s prstom. | Kandidati so berljivi (pribl. 10 px), celice (pribl. 30 px) zadeneš brez zgrešenih klikov, izbrani celici se jasno ločita od neizbranih (modrikasta podlaga, debela modra obroba). Potrjeno (ročni pregled 28. 9. 2026). |
| 2 | trening, 1200 px in telefon | 2 · Izločitev v bloku: brez branja naslova povej, katera vrstica ali stolpec in kateri blok sta v vaji. | Takoj jasno iz sive ploskve, belih celic in krepke oznake roba (npr. **S5**). Potrjeno (ročni pregled 28. 9. 2026). |
| 3 | trening, telefon | Pri 1 in 2 drži »Rešitev (drži)« s prstom, nato spusti. | Med držanjem so celice vzorca jantarne, izbris rdeče prečrtan, poudarek števke izklopljen; ob spustu se vrne prejšnje stanje z izbiro. Potrjeno (ročni pregled 28. 9. 2026). |

## Trening: pripomočki pri E1 in E2 (»Spoznaj«)

Iz načrta `docs/pripomocki-e1-e2-nacrt.md`. Logiko preverijo `tests/trening-pomoc.test.js`,
`tests/plosca.test.js`, `tests/mreza.test.js` in `tools/preveri-enojcki-brskalnik.js`
(tudi pare QWERTZ `key`/`code`, barve iz nastavitev igre in da je izris tehnik 1–12 enak
kot pred spremembo).

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, pravi telefon | E1, vaja 7, vklopi vse tri sezname; preberi števke v kvadratkih in izberi celico s prstom. | Števke so berljive (celica pribl. 27 px), stran se ne pomika vodoravno, celico zadeneš brez zgrešenih dotikov. Potrjeno (ročni pregled 28. 9. 2026). |
| 2 | trening, telefon in 1200 px | E2, vaja 4: s kljukico »več hkrati« poudari dve števki. | Barvi se jasno ločita med seboj, od modrikaste označene enote in od sivih zatemnjenih celic. Potrjeno (ročni pregled 28. 9. 2026). |
| 3 | trening, slovenska tipkovnica | E1, vaja 7: tipke 1–9 (vrstica števk in številčnica), puščice, Escape; nato Shift+2 in Ctrl+Z. | Števka se izbere (gumb pod mrežo), izbira se premika po praznih celicah, Escape jo počisti; Shift+2 in Ctrl+Z ne spremenita ničesar. Potrjeno (ročni pregled 28. 9. 2026). |
| 4 | igra, nato trening (lokalni strežnik) | V igri pod »Barve poudarka« nastavi 1. barvo, osveži trening in poudari števko v E1 ter odpri vajo 1. | V E1 in pri vaji 1 je poudarek v barvi iz igre. Potrjeno (ročni pregled 28. 9. 2026). |
| 5 | trening, telefon | E2: drži »Rešitev (drži)« s prstom, nato spusti. | Med držanjem je enota jantarna, celica zelena s števko; ob spustu oznake izginejo. Potrjeno (ročni pregled 28. 9. 2026). |

Opažanje ob pregledu: po pravilnem odgovoru je zelena oznaka prekrila poudarek nove
števke – popravek D1 in novo stikalo »senči« (D2) sta v `docs/pripomocki-e1-e2-nacrt.md`,
razdelek »Dopolnitev«.

## Trening: senčenje in poudarek po odgovoru pri E1 in E2 (»Spoznaj«)

Iz razdelka »Dopolnitev« v `docs/pripomocki-e1-e2-nacrt.md`. Logiko preverijo
`tests/plosca.test.js`, `tests/mreza.test.js`, `tests/trening-pomoc.test.js` in
`tools/preveri-enojcki-brskalnik.js` (šrafura na pravih celicah, pomoč, zelen okvir).

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, telefon | E2, vaja 4: vklopi »senči« in poudari števko. | Šrafura je jasno vidna na beli, modrikasti in sivi podlagi, števke ostanejo berljive. Potrjeno (ročni pregled 28. 9. 2026). |
| 2 | trening | E2: z vklopljenim senčenjem in poudarjeno števko odgovori pravilno; nato isto pri E1. | Pri E2 »(s pomočjo – ne šteje)« in rezultat se ne poveča; pri E1 se šteje. Pravilo je iz namiga kljukice razumljivo. Potrjeno (ročni pregled 28. 9. 2026). |
| 3 | trening | E1, vaja 7: poudari števko odgovora in odgovori pravilno. | Celica odgovora ima podlago poudarka in zelen okvir, nova števka je med poudarjenimi. Potrjeno (ročni pregled 28. 9. 2026). |

## Trening: Vadi v uganki (del 6)

Iz `docs/vadi-v-uganki-nacrt.md` (točke 14, 15 in 17 – območje koraka, besedilo prečrtanih, okvir območja, zaznamki, legenda). Logiko preverijo `tests/trening-uganka-ui.test.js`,
`tests/plosca.test.js`, `tests/mreza.test.js` in `tools/preveri-vadi-brskalnik.js` (postavitev
pri 375 in 1200 px, pravi kliki, pari QWERTZ, »Spoznaj« enak kot prej).

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, pravi telefon | 4 · Skriti par, »Vadi v uganki«, vaja 1: preberi navodilo, vklopi »pokaži jih prečrtane«, izberi celico v območju s prstom, poudari števko in odstrani kandidata z nizom; nato vaja 7; še »Spoznaj« E1, vaja 4. | Pri vaji 1 navodilo pove enoto, območje je **uokvirjeno (temen okvir) in ima temne oznake na robu** – vidno na tvojem zaslonu tudi ob izbrani celici in poudarku (pri E1 enako); besedilo pove, da prečrtani niso del naloge; kandidati so berljivi (celica pribl. 30 px), celico zadeneš brez zgrešenih dotikov; pri vaji 7 območja ni. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: vidnost na pravem zaslonu, berljivost in dotik. |
| 2 | trening, slovenska tipkovnica | Skriti par: Shift+števka, Ctrl+Z, Ctrl+Y; 8 · Mečarica, vaja 7: izberi celice vzorca (»več celic«) in pritisni O, nato izberi celico izbrisa; E1: števka, Backspace. | Kandidat se odstrani, razveljavi, ponovi; celice vzorca dobijo črtkan okvir (od 3. 10. 2026 vijoličen čez mrežno črto – naloga »oznake«; ob potrditvi je bil oranžen), izbira je spet prosta, O na označeni celici jo odznači; predlog se postavi in pobriše. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij pošlje pare `key`/`code`, ne prave razporeditve sistema. |
| 3 | trening, telefon | 8 · Mečarica, nekajkrat »Naslednja vaja«. | »Iščem vajo …« največ pribl. 1 s, nato vaja; nad vajo »Uganka: Težka« (banka ima 8 takih ugank mečarice, nato »Zelo težka« – izbira po stopnji, načrt točka 16). Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: hitrost pravega telefona ni izmerjena. |
| 4 | trening | Katera koli od 1–12: odstrani kandidata, ki ga izloči druga tehnika, ali kandidata brez utemeljitve (ni prava števka), nato »Preveri«; pri vaji 1–6 še pravilen korak zunaj označenega območja (npr. pri 1 · Izločitev izven bloka v drugem bloku). | Sporočilo je razumljivo in ne zveni kot napaka; po pravilnem odgovoru legenda jasno pove »celice vzorca« in »izbrisani kandidati (odstranjeni)«; delni izbris pri mečarici da »Še ne.«, izbrisi se vrnejo, rezultat se ne spremeni; korak zunaj območja je »Pravilno! (korak v bloku 5, ne v bloku 2) …«. Pri X-krilu je števka območja poudarjena, pri XY-krilu pivot modrikast, pri edinstvenem pravokotniku oba bloka. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: razumljivost besedila in območja pri 7–12. |
| 5 | trening, telefon | E1, vaja 1: postavi predlog v izbrano celico označene enote. | Enota je modrikasta, druge prazne celice zatemnjene (kot v »Spoznaj«); vijolični predlog s črtkanim okvirjem se jasno loči od modrih vpisov poti in od izbire; predlog ostane vijoličen (odločitev 3. 10. 2026). Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja videza. |

## Faza 5 – videz (vse tri aplikacije)

Iz `docs/faza5-nacrt.md` (razdelek 5). Prelive, izbiro celice, paleto, skupne sestavine in
barve danosti preveri `tools/preveri-videz-brskalnik.js` (320, 375, 430 in 1280 px), paleto še
`tests/css-paleta.test.js`; trening »Spoznaj« primerjajo `preveri-presek-`, `-enojcki-` in
`-vadi-brskalnik.js`.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | vse tri, pravi telefon | Reševalec: »Primer«, »Reši«, »Pokaži kandidate«, »Pokaži korake reševanja«, »Pokaži na mreži« pri nekaj korakih. Igra: odpri uganko, vklopi vse tri sezname, odpri »Barve poudarka«. Trening: meni, 3 · Očitni par »Spoznaj« (do vaje, kjer je enota vrstica), 4 · Skriti par »Vadi v uganki«. | Nikjer vodoravnega drsenja; vse mreže so cele v svojih karticah (vnosna mreža reševalca, mala mreža koraka, vrsta devetih celic pri 3); celice zadeneš s prstom (reševalec pribl. 34 px, mala mreža koraka pribl. 30 px). Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: emulacija nima pravega zaslona, dotika, sistemskih pisav in povečave strani. |
| 2 | vse tri, namizje (Edge), ozko okno | Okno zoži na pribl. 400–500 px, da je viden navpični drsnik: reševalec z rešitvijo in koraki, igra z vklopljenim seznamom vrstic, trening 3 · Očitni par in 4 »Vadi v uganki«. | Brez vodoravnega drsnika. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: brskalnik brez glave drsnike skrije, igra in trening pa računata mrežo iz širine okna (`100vw`), ki drsnik vključuje. |
| 3 | igra | S kljukico »več hkrati« poudari štiri števke (vse štiri barve poudarka). Pri vsaki izberi celico z dano ali vpisano poudarjeno števko, nato prazno celico. | Izbrana celica je opazna – modrikasta podlaga in 3 px modra obroba, na poudarjeni celici obroba z belim notranjim robom – tudi na modri 4. barvi, branje kandidatov ne moti. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij preveri vrednosti sloga, kontrasta na tvojem zaslonu ne presodi. |
| 4 | trening, reševalec | Trening: meni, nekaj vaj »Spoznaj« (3, 8, 11) z napačnim in pravilnim odgovorom, »Namig (drži)«. Reševalec: okno »Zbirka ugank«. | Bela podlaga, kartice ločene z obrobo, glava kot v igri (nadnaslov »Trening · spoznaš in vadiš tehnike«); značke SREDNJA jantarne, NAPREDNA vijolične; barve tehnik, zelena in rdeča povratna informacija in gumbi niso izgubili kontrasta. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja celotnega vtisa. |
| 5 | reševalec | »Primer«, »Reši«, »Pokaži kandidate«, »Pokaži korake reševanja«, »Pokaži na mreži«, klik na mrežo (povečan prikaz). | Dane števke so črne in krepke, izpeljane modre – v rešitvi, kandidatih, mali mreži koraka in povečanem prikazu; legenda »**5** dana · **5** izpeljana«, opomba pod kandidati in noga povedo isto. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: berljivost in razumljivost legende. |

## Igra: stikalo »Kandidati v celicah« (naloga 5a)

Iz `docs/kandidati-stikalo-nacrt.md` (razdelek 6). Logiko preverijo `tests/plosca.test.js`,
`tests/mreza.test.js`, `tests/igra-ui.test.js`, `tests/trening-uganka-ui.test.js`, posnetek
igre (`tools/posnetki/igra-po-5a.json`) in `tools/preveri-kandidati-brskalnik.js` (375 in
1280 px, pravi kliki, pari QWERTZ, shranjevanje ob osvežitvi, trening in reševalec z
izklopljeno nastavitvijo).

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | igra, pravi telefon | V kartici »Prikaz« izklopi »Kandidati v celicah«; izberi celico s prstom, vpiši števko z nizom »Vpiši«, poudari števko; nato kandidate spet vklopi. | Mreža brez malih števk je pregledna; niz »Odstrani kandidata« izgine in se ob vklopu vrne; kandidat se vpiše, za števko, ki v celici ni mogoča, vrstica pod nizi pove zakaj; poudarek obarva samo vpisane števke. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja videza in dotik. |
| 2 | igra, slovenska tipkovnica | Pri izklopu: Shift+števka; 1–9 na kandidatu; 1–9 na števki, ki je v vrstici že vpisana. | Shift+števka ne naredi nič; kandidat se vpiše; druga števka se ne vpiše, vrstica pod nizi: »Števka N je v vrstici R že vpisana (VxSy).«. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij pošlje pare `key`/`code`, ne prave razporeditve sistema. |
| 3 | igra | Pri izklopu »Naslednji korak« do »Pokaži rešitev« pri koraku z izbrisom (npr. 1 · Izločitev izven bloka ali par); nato »Vklopi kandidate« v opombi in izvedi izbris. | Kandidati so vidni samo v celicah koraka (vzorec jantarno, celice izbrisa rdečkasto, kandidat za izbris rdeče prečrtan); opomba pove, da izbrise izvedeš, ko kandidate vklopiš. Gumb vklopi kandidate (kljukica v kartici »Prikaz« obkljukana), korak ostane prikazan, izbris lahko izvedeš (»Korak je izveden.«). Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja razumljivosti. |
| 4 | igra in trening, lokalni strežnik, tvoj Edge (ne InPrivate) | V igri izklopi kandidate; odpri trening (»Vadi v uganki« 4, »Spoznaj« E1); nato znova igro (F5). | Trening kot prej (4 s kandidati, E1 brez); igra po F5 ostane brez kandidatov. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: obstoječa shramba pravega profila (scenarij začne s praznim profilom). |

## Trening: vidnost oznak (naloga »oznake«)

Iz `docs/oznake-nacrt.md` (razdelki 6–8). Slog okvirja, plasti, zakrite piksle malih števk
(375 in 1280 px, tri stanja in najslabši primer), izbrano in označeno celico, okvir na štirih
barvah poudarka (kontrast, viden na posnetku), podlagi v treningu – tudi v mrežah vaj 3–12 v
»Spoznaj« (»Rešitev (drži)« s pravim pritiskom, pravilen odgovor pri 3, 7 in 11, kontrast besedila)
– in nespremenjeno igro preveri `tools/preveri-vadi-brskalnik.js` (dela »oznake« in »Spoznaj
3–12«); posnetek igre je enak.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, tvoj zaslon (namizje) | 8 · Mečarica, »Vadi v uganki«: izberi celice vzorca (»več celic«), O; odpri »Rešitev« (pred izbrisi) in poglej; »Skrij«, izvedi izbrise, »Preveri«. | Vijoličen črtkan okvir oznake se jasno loči od rožnatih celic z izbrisom in od jantarnih celic vzorca; po rešeni vaji vidiš, katere celice vzorca si označil; male števke v kotih označenih celic so cele. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij izmeri slog, kontrast in piksle, ne pa, ali razliko vidiš na svojem zaslonu (bledi odtenki). |
| 2 | trening, pravi telefon | Isto kot 1; nato izberi dve označeni celici in pritisni »Označi izbrane« (odznači). | Okvir na majhni celici ne moti branja kandidatov; izbrana in označena celica pokaže oboje (modra obroba znotraj, vijolične črtice zunaj); po odznačitvi okvir izgine. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: meritev je pri gostoti 1x, telefon riše pri 2–3x z drugim glajenjem; dotik. |
| 3 | trening, s tvojimi barvami poudarka iz igre | »Več hkrati«, poudari štiri števke (vse štiri barve), z izklopljenim »več celic« označi (O) po eno polno celico vsake. | Okvir je viden na vseh štirih barvah. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij preveri privzete barve; tvoje barve iz igre (`sudoku.igra.poud`) pozna samo tvoj profil. |
| 4 | trening | 1 · Izločitev izven bloka ali 4 · Skriti par, »Vadi v uganki«, vaja 1 (z območjem): označi celico ob robu uokvirjenega območja. | Temen polni okvir območja in vijoličen črtkan okvir oznake se ločita; okvir območja ostane nad malimi števkami kot prej. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja dveh temnih okvirjev na pravem zaslonu; scenarij ju ne riše skupaj. |
| 5 | trening, »Spoznaj« | E2: »Rešitev (drži)«; 2 · Izločitev v bloku: pravilen odgovor. | Jantarna enota oziroma vzorec in rdečkasti izbris so močnejši kot prej in ne motijo branja števk. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja videza (scenarij preveri samo barvo podlage). |
| 6 | trening, »Spoznaj«, tvoj zaslon | 3 · Očitni par: izberi dve celici, ki nista par, nato drži »Rešitev (drži)«. | Celici vzorca (močnejša jantarna, zlata obroba) ločiš od svoje izbire (bleda jantarna, temno jantarna obroba); kandidati v označenih celicah so temnejši in berljivi. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: scenarij izmeri barve (podlagi se ločita s kontrastom 1,1, obrobi 1,9 – prej podlagi 1,2), ne pa, ali ju ločiš ti. |
| 7 | trening, »Spoznaj« | 7 · X-krilo in 8 · Mečarica: drži »Rešitev (drži)«, nato odgovori pravilno. Če se rešitev ob pritisku takoj skrije, stran malo pomakni navzgor (znana napaka, ni del naloge – »Kasneje«). | Vzorec je zdaj jantaren (prej zelen), celice izbrisa rožnate; po pravilnem odgovoru so tvoje celice zelene, izbris rožnat z rdečo obrobo – sprememba barve vzorca je razumljiva. Potrjeno (ročni pregled 3. 10. 2026). – ni avtomatsko: presoja, ali je nova barva vzorca pri 7 in 8 jasna. |

## Trening: enotna izbira v »Spoznaj« 3–12

Iz `docs/izbira-spoznaj-nacrt.md`. Modro izbiro, vseh pet vrst celic med »Rešitvijo (drži)«
(pravi pritisk miške), kontrast rdeče, prekrivanje okvirja z malimi števkami pri 375 px (enako kot
prej), pravilen odgovor in »Rešitev« po njem (enako kot prej, pri 8 zeleno) ter drug veljaven
vzorec pri 8 preveri `tools/preveri-izbira-brskalnik.js`; izbiro vzorca pri 3, 5, 7 in 8
`tests/trening-resitev.test.js`.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, »Spoznaj«, tvoj zaslon | 3 · Očitni par in 9 · Veriga ene števke: izberi eno celico vzorca in eno zunaj njega (pri 9 celico izbrisa – tisto, ki ob »Rešitvi« postane rožnata), nato drži »Rešitev (drži)«. | Pred pritiskom sta obe izbiri modri. Med »Rešitvijo«: pravilna celica jantarna z zelenim okvirjem, napačna bela (pri 9 rožnata) s temno rdečim, neizbrana celica vzorca jantarna z zlatim; zelen in zlat okvir ločiš na prvi pogled. Potrjeno (ročni pregled 4. 10. 2026). – ni avtomatsko: scenarij izmeri barve (zelena proti jantarni podlagi 3,6, zlata 1,8), ne pa, ali zelen in zlat okvir enake debeline ločiš na svojem zaslonu. |
| 2 | trening, »Spoznaj«, pravi telefon | 11 · XY-krilo: izberi pivot in celico izbrisa, drži »Rešitev (drži)« s prstom. | Okvirji ne motijo branja malih števk v kotih celic; »Rešitev« ostane, dokler držiš. Potrjeno (ročni pregled 4. 10. 2026) – okvirji v redu; ob tem opaženo, da »Rešitev« pri 3–12 števke izbrisa ne prečrta (stara zasnova, nova naloga: `docs/precrtanje-resitev-nacrt.md`). – ni avtomatsko: meritev prekrivanja je pri gostoti 1x (telefon riše pri 2–3x z drugim glajenjem), dotika v brskalniku brez glave ni. |
| 3 | trening, »Spoznaj« | 8 · Mečarica: drži »Rešitev (drži)« in v besedilu poglej »Vse veljavne kombinacije«; če jih je več, izberi celice kombinacije, ki je mreža ne pokaže, in znova drži »Rešitev«; nato »Preveri«. | »Rešitev« zdaj pokaže tvojo kombinacijo (vse tvoje celice jantarne z zelenim okvirjem), »Preveri« reče »Pravilno!«; po odgovoru so celice zelene. Razumljivo je, zakaj mreža pokaže drug vzorec kot brez izbire. Potrjeno (ročni pregled 4. 10. 2026). – ni avtomatsko: presoja razumljivosti (pravilnost preverita test in scenarij). |

## Trening: prečrtanje izbrisa ob »Rešitvi« v »Spoznaj« 3–12

Iz `docs/precrtanje-resitev-nacrt.md` (commit `fe96e14`). Da so ob »Rešitvi (drži)« rdeče prečrtane natanko števke,
ki so prečrtane po pravilnem odgovoru (pri 4 in 6 po 2. fazi), da je slog enak kot pri 2, da po
spustu ni prečrtanih, da sta pri 7 in 8 prečrtani tudi po odgovoru in da je vse drugo enako kot
prej (tudi »Preveri« in prekrivanje okvirja z malimi števkami), preverijo
`tools/preveri-izbira-brskalnik.js` (pravi pritisk miške, 375 in 1280 px) in
`tests/trening-precrtanje.test.js`.

| # | Kje | Kaj narediti | Pričakovano |
|---|---|---|---|
| 1 | trening, »Spoznaj«, pravi telefon | 11 · XY-krilo: drži »Rešitev (drži)« s prstom. | V rožnati celici izbrisa je mala števka izbrisa rdeče prečrtana in berljiva (kot pri 2 · Izločitev v bloku). Potrjeno (ročni pregled 4. 10. 2026; monitor, tablica, telefon). – ni avtomatsko: scenarij izmeri barvo, debelino in črto (kontrast rdeče na rožnati 3,3) pri gostoti 1x; telefon riše pri 2–3x z drugim glajenjem, dotika v brskalniku brez glave ni. |
| 2 | trening, »Spoznaj«, tvoj zaslon | 12 · Edinstveni pravokotnik: drži »Rešitev (drži)«. | Vogal z izbrisom ostane jantaren kot drugi trije, njegovi števki para pa sta rdeče prečrtani – jasno je, da se izbrišeta iz tega vogala. Potrjeno (ročni pregled 4. 10. 2026; monitor, tablica, telefon). – ni avtomatsko: presoja razumljivosti (vogal je hkrati vzorec in izbris); scenarij preveri slog in da so prečrtane iste števke kot po odgovoru. |
| 3 | trening, »Spoznaj« | 3 · Očitni par: drži »Rešitev (drži)«; nato 4 · Skriti par: drži »Rešitev (drži)«. | Pri 3 so celice izbrisa rožnate, števke para v njih rdeče prečrtane (kot po pravilnem odgovoru); pri 4 ostanejo celice vzorca jantarne, prečrtane so njihove druge števke. Razlika med 3 in 4 je razumljiva. Potrjeno (ročni pregled 4. 10. 2026; monitor, tablica, telefon). – ni avtomatsko: presoja razumljivosti (pravilnost preverita test in scenarij). |

## Zakaj ročno

- **CSS** (barve, obrobe, senčenje, velikost celic na ozkem zaslonu): nadomestni DOM ga
  ne uporablja; brskalnik brez glave ga vidi samo na posnetku, ki ga je treba pogledati.
- **Tipkovnica QWERTZ:** posnetek in testi pošiljajo tipke po QWERTY, prava slovenska
  razporeditev ima drugačne pare `key`/`code` (Z/Y, Shift+števka).
- **Tipkovnica pri odprtem oknu:** nadomestni DOM nima `querySelector`, zato posnetek
  tega ne pokrije.
- **Odložišče in kontekstni meni:** brskalnik brez glave vnos besedila le posnema
  (`Input.insertText`), pravega lepljenja ne preizkusi.
- **Dotik in zaslonska tipkovnica** (telefon): ju v brskalniku brez glave ni.
- **Presoja uporabnosti** (postavitev polja Niz, jasnost delne mreže pri 1 in 2,
  ločljivost barv poudarka pri E1/E2): ni vprašanje pravilnosti.
- **Prehod med aplikacijama** (barve poudarka, nastavljene v igri, v treningu): scenarij
  zapis v shrambo posnema, ne nastavlja barv v igri.
