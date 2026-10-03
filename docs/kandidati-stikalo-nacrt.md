# Naloga 5a – stikalo »Kandidati« v igri – načrt

Naloga: v igri (`igra/`) stikalo za vklop in izklop prikaza kandidatov. Vklopljeno: kot zdaj.
Izklopljeno: prazne celice brez malih števk. Nastavitev se shrani. Kandidati se v ozadju
računajo naprej – motor, »Naslednji korak« in »Preveri« ostanejo nespremenjeni. Trening in
reševalec stikala nimata. Brez ročnih zapiskov (lastnega vpisovanja malih števk).

Izhodišče: `docs/uskladitev.md`, vrstica 5a v tabeli »Vrstni red popravkov« in opomba v
»Opombe k delom«.

Stanje: **izvedeno 2026-10-03** (koraki 2–4, razdelek 7); ročni pregled (4 točke v `docs/rocni-test.md`) še ni potrjen.

**Odločitve (Darko, 2026-10-03):** O1 A, O2 A, O3 A, O4 A, O5 A, O7 kot predlagano. O6 A z
drugim napisom: kljukica **»Kandidati v celicah«** (brez pojasnila v oklepaju), kartica
**»Prikaz«**, pod kljukico oznaka »Manjkajoče števke« in tri obstoječa stikala. Dodatka:

- **a)** O4: v opombi pod korakom z izbrisi gumb **»Vklopi kandidate«** – klik vklopi stikalo
  (in ga shrani), korak ostane prikazan, izbris se da izvesti. V testih in scenariju.
- **b)** v »Kasneje« (`docs/uskladitev.md`), ne zdaj: senčenje pri izklopljenih kandidatih
  (opomba pri O1); ročni zapiski (lastno vpisovanje malih števk); pri izklopljenih kandidatih
  opozorilo, če uganka zahteva tehniko 3 ali višjo (brez kandidatov gredo E1, E2, 1 in 2).

Ročni pregled: kot v osnutku (4 točke), en sam, na koncu; v točki 3 še gumb »Vklopi
kandidate«.

## 1. Kaj že obstaja

- `shared/mreza.js`: `pogled.kandidati = null` izriše prazne celice brez malih števk; števka
  za vpis prikazanega koraka se takrat pokaže v celici (zeleno) – tako delata E1 in E2 v
  treningu.
- `shared/plosca.js`: možnost `kandidati: false` – mreža brez kandidatov, Shift+števka in
  niz »Odstrani« ne naredita nič. Je **stalna** (prebere se ob nastanku plošče); igra
  potrebuje vklop in izklop med igro.
- `shared/stanje.js`: kandidati = samodejni (iz danosti in vpisov) brez ročno odstranjenih;
  vpis je dovoljen samo za kandidata (`mozneAkcije().vpis`, `dodajPotezo()`). To ostane.
- Stikala seznamov manjkajočih števk že shranjuje plošča (`kljucSeznamov`,
  `sudoku.igra.seznami`) – stikalo kandidatov dobi enak mehanizem s svojim ključem.

**Ne spremeni se:** `shared/engine.js` in `shared/generator.js` (zato banke vaj ni treba
ustvariti znova), `shared/stanje.js` (pravila potez, `stanjeIgre()`, `prvaNapaka()`),
»Naslednji korak« (isti korak, iste tri stopnje), »Preveri«, zapis shranjene igre, seznami
manjkajočih števk in števci »še manjka« (oboje izhaja iz vpisov), zaklep rešene uganke
(stikalo je samo prikaz, deluje tudi takrat), trening in reševalec (ta plošče sploh ne
naloži).

## 2. Odločitve (predlagam, odločiš ti)

Posnetki v `docs/slike/kandidati/` so **prototip** (CSS in DOM, vstavljena v stran z
brskalnikom brez glave), ne končna koda. Stanje: uganka `hard-17-a` iz `docs/uganke.md`, 9
enojčkov odigranih, naslednji korak je 1 · Izločitev izven bloka.

| Posnetek | Kaj kaže |
|---|---|
| `1280-vklop.png` | vklopljeno (kot zdaj), stikalo v kartici »Prikaz« (O6 A) |
| `1280-izklop.png` | izklopljeno, poudarjena 5 (O1 A), niz »Odstrani« skrit (O2 A) |
| `1280-izklop-vpis.png` | izklopljeno, izbrana prazna celica: v nizu »Vpiši« vseh 9 števk, razlog po zavrnjenem vpisu (O3 A) |
| `1280-izklop-korak.png` | »Pokaži rešitev« pri izklopu: kandidati samo v celicah koraka in opomba (O4 A) |
| `1280-izklop-korak-brez.png` | isto brez kandidatov – samo podlage celic (O4 B) |
| `375-izklop-prikaz.png` | telefon, stikalo v kartici »Prikaz« pod mrežo (O6 A) |
| `375-izklop-glava.png` | telefon, kljukica »kandidati« nad mrežo v glavi niza »Poudari« (O6 B) |

### O1 – »Poudari števko« pri izklopu

- **A (predlog): samo vpisane in dane števke** – cela celica v barvi poudarka, kot zdaj.
  Prazne celice ostanejo bele (`1280-izklop.png`). Števci »še manjka« in seznami ostanejo.
  Zakaj: poudarek praznih celic s kandidatom bi pri eni števki pokazal natanko to, kar je
  izklop skril (vse kandidate te števke, tudi tvoje izbrise). Pri »več hkrati« bi imela
  prazna celica z dvema poudarjenima kandidatoma dve barvi, cela celica pa ima lahko eno.
- B: tudi prazne celice, kjer je števka kandidat (cela celica v barvi poudarka, npr.
  bledejši odtenek). Pomoč »kje je še lahko 5« brez malih števk; pri »več hkrati« potrebuje
  nov slog (razdeljena celica) v `shared/mreza.css`.

Opomba: naravna pomoč pri izklopu bi bilo senčenje (»senči« iz treninga E1/E2 – kam
poudarjena števka ne more, samo iz vpisov; že je v plošči). Ni del naloge – če ga želiš,
ga zapišem v »Kasneje«.

### O2 – niz »Odstrani kandidata«, »več celic«, Shift+1–9

- **A (predlog): skrito.** Oznaka niza s kljukico »več celic« in niz sta skrita
  (`hidden`), Shift+1–9 ne naredi nič (kot `kandidati: false` v treningu), izbira več celic
  ni mogoča (tudi Ctrl+klik ne doda celice). Ob izklopu se izbira več celic počisti in
  kljukica »več celic« izklopi – enako kot ob njenem ročnem izklopu. Vrstica z gumbi
  Razveljavi … Začni znova se pomakne navzgor. Zakaj: brez kandidatov niz nima česa
  odstraniti; devet sivih gumbov in kljukica, ki ne dela nič, bi bili samo šum.
- B: onemogočeno – niz in kljukica ostaneta vidna, vsi gumbi sivi, vrstica pod nizi pove
  »Kandidati so skriti – za odstranjevanje jih vklopi.« Postavitev se ob preklopu ne
  premakne.

V obeh primerih: »Razveljavi« in »Ponovi« hodita po vseh potezah, tudi po izbrisih
kandidatov (zgodovina je ena). Pri izklopu je taka poteza na mreži nevidna, spremeni se samo
števec »poteza k / n«. Predlog: tako ostane.

### O3 – niz »Vpiši«

Zdaj so omogočeni samo kandidati izbrane celice – izbira celice tako izda njene kandidate.

- **A (predlog): pri izklopu je za izbrano prazno celico omogočenih vseh 9 števk.** Pravilo
  igre ostane: vpiše se samo kandidat (`dodajPotezo()` se ne spremeni). Števka, ki ni
  kandidat, se ne vpiše, vrstica pod nizi pa pove zakaj (`1280-izklop-vpis.png`):
  - števka je v enoti že vpisana: »Števka 1 je v vrstici 1 že vpisana (V1S5).« – isto
    besedilo kot pri E1/E2 v treningu (`preveriEnojcek()`); to se vidi tudi na mreži, zato
    ne izda ničesar;
  - kandidat je bil ročno odstranjen (pred izklopom): »Kandidat 4 je v V2S3 odstranjen –
    vrneš ga pri vklopljenih kandidatih (↺) ali z »Razveljavi«.« – podatek o tvoji potezi.

  Enako tipka 1–9. Sporočilo izgine ob naslednji potezi ali izbiri. Pri izklopu se tudi
  vnaprej ne izpiše »V V3S5 ni več kandidatov …« (izdalo bi, da je nekje napaka); razlog
  dobiš šele ob poskusu vpisa. Pri vklopu ostane vse kot zdaj.
- B: pustiti kot zdaj. Najpreprosteje, a izbrana celica izda svoje kandidate.
- (Ne predlagam) dovoliti tudi vpis števke, ki ni kandidat (napaka kot na papirju):
  spremeni pravilo poteze v `shared/stanje.js` in s tem kandidate, »Preveri« in shranjene
  igre – zunaj obsega naloge.

### O4 – »Naslednji korak« z izbrisom ali vzorcem

Stopnji 1 (ime tehnike) in 2 (namig) sta samo besedilo – ostaneta enaki. Stopnja 3
(»Pokaži rešitev«) zdaj na mreži pokaže jantarne celice vzorca, rdečkaste celice z izbrisom,
rdeče prečrtane kandidate in zeleno števko za vpis. Brez kandidatov ostanejo podlage celic
in števka za vpis (pokaže se v celici, kot pri E1/E2); prečrtan kandidat in kandidati vzorca
(npr. kateri par) pa izginejo.

- **A (predlog): na stopnji 3 se kandidati pokažejo samo v celicah koraka** – celice
  vzorca in celice z izbrisom; celica za vpis pokaže zeleno števko (`1280-izklop-korak.png`).
  Rešitev si zahteval sam, zato to ni izdaja. Pri koraku z izbrisi še opomba pod korakom:
  »Kandidati so skriti: izbrise izvedeš, ko jih vklopiš – dotlej »Naslednji korak« najde
  isti korak.« Izbrisa pri izklopu ni mogoče narediti (O2), zato tak korak ostane prikazan
  do »Skrij« ali do vklopa in izvedbe; ker se kandidati računajo naprej brez tega izbrisa,
  ga »Naslednji korak« najde znova. Enojček (samo vpis) izvedeš normalno. *Dodatek a: v
  opombi gumb »Vklopi kandidate« – vklopi in shrani stikalo, korak ostane prikazan.*
- B: brez kandidatov tudi na stopnji 3 (`1280-izklop-korak-brez.png`): podlage celic,
  besedilo in seznam dejanj; vzorec se razbere samo iz besedila. Opomba enaka kot pri A.
- (Ne predlagam) ob »Pokaži rešitev« vklopiti kandidate na vsej mreži – spremeni nastavitev
  brez tvoje izbire.

Za A dobi mreža neobvezno polje pogleda (celice, v katerih se kandidati izrišejo; razdelek 3).

### O5 – ročno odstranjeni kandidati

- **A (predlog): ostanejo.** Stikalo spremeni samo prikaz; izbrisi so poteze v zgodovini
  (»Razveljavi«, shranjena igra, »Preveri«). Po ponovnem vklopu je mreža taka, kot bi bila
  brez izklopa: samodejni kandidati upoštevajo vse vpise, narejene med izklopom, tvoji
  izbrisi ostanejo. »Preveri« pri izklopu najde tudi napačen izbris izpred izklopa –
  besedilo ostane isto (»… prazna celica, iz katere si odstranil pravilnega kandidata« je v
  Pomoči že opisano).
- B: ob izklopu (ali vklopu) se pobrišejo. Potrebna bi bila nova poteza »vrni vse« ali
  prepis zgodovine – spremeni igro, ne samo prikaza. Ne predlagam.

### O6 – mesto, ime, privzeta vrednost

- **Ime:** »Kandidati« s pojasnilom »(male števke v praznih celicah)«. *Odločeno: »Kandidati
  v celicah«, brez pojasnila.*
- **Privzeto: vklopljeno** – igra je ob prvem zagonu in po tej posodobitvi taka kot zdaj.
- **Mesto:**
  - **A (predlog): kartica »Manjkajoče števke« postane »Prikaz«**: prva kljukica
    »Kandidati«, pod njo oznaka »Manjkajoče števke« in tri obstoječa stikala
    (`1280-*.png`, `375-izklop-prikaz.png`). Vse nastavitve prikaza mreže so na enem mestu,
    v istem slogu; glava nad mrežo ostane nespremenjena. Slabost: na telefonu je kartica pod
    mrežo – nastavitev pa se spreminja redko in se shrani.
  - B: kljukica »kandidati« v glavi niza »Poudari« nad mrežo, levo od »več hkrati«
    (`375-izklop-glava.png`). Vedno vidna ob mreži; na telefonu se oznaka niza prelomi v dve
    vrstici.

### O7 – shramba

- Nov ključ **`sudoku.igra.kandidati`** z vrednostjo `true`/`false` (JSON). Brez zapisa ali
  z neveljavnim zapisom: vklopljeno. Če shramba ne dela (npr. zasebno okno), velja nastavitev
  do osvežitve – kot stikala seznamov.
- Bere in piše ga **samo igra** (prek plošče, z možnostjo `kljucKandidatov`, enako kot
  `kljucSeznamov`). Trening tega ključa ne bere: E1 in E2 sta vedno brez kandidatov, 1–12
  (»Spoznaj« in »Vadi v uganki«) vedno s kandidati; trening svojo ploščo ustvari brez
  stikala. Reševalec plošče ne naloži.
- Obstoječi ključi (`sudoku.igra.v1`, `sudoku.igra.seznami`, `sudoku.igra.poud`,
  `sudoku.trening.seznami`) se ne spremenijo. Nastavitev ni del shranjene igre – velja za
  brskalnik, ne za uganko.

## 3. Koda (pri predlaganih odločitvah)

- `shared/plosca.js` – nove neobvezne možnosti `stikaloKandidatov` (kljukica),
  `kljucKandidatov` (ključ shrambe) in `skrijBrezKandidatov` (elementi, ki se pri izklopu
  skrijejo – v igri oznaka niza »Odstrani« s kljukico »več celic« in niz; brez ovoja, da
  ostane pravilo `.niz-oznaka:first-child` nedotaknjeno).
  Brez stikala (trening) je obnašanje enako kot zdaj, stalna `kandidati: false` ostane.
  Pri izklopu: mreža brez kandidatov, Shift+števka in niz »Odstrani« nič, Ctrl+klik ne
  doda, niz »Vpiši« vseh 9 za eno izbrano prazno celico, zavrnjen vpis z razlogom (O3 A).
  Ob preklopu: zapis v shrambo, izbira več celic in kljukica »več celic« (O2 A), izris.
  Vrne še `kandidatiVidni()` in `nastaviKandidate(vidni)` (gumb »Vklopi kandidate«).
- `shared/mreza.js` – neobvezno polje pogleda `celiceKandidatov` (celice, v katerih se
  kandidati izrišejo; `null` = vse); druge prazne celice so kot pri `kandidati: null` (O4 A).
  Trening ga ne uporablja.
- `igra/index.html` – kartica »Prikaz« s kljukico `#stikaloKandidati` »Kandidati v celicah«
  (O6 A); oznaka niza »Odstrani« dobi id `odstraniGlava`; kratek odstavek o stikalu v oknu Pomoč
  (razdelek »Kako igrati«) in novo ime kartice v razdelku »Seznami manjkajočih števk«. Slog
  besedil uredi faza 6; kartice »Kako« ne spreminjam.
- `igra/igra.js` – plošči poda stikalo, ključ in elementa za skrivanje; `pogled()` s
  `celiceKandidatov` pri prikazanem koraku na stopnji 3 in izklopu; opomba z gumbom »Vklopi
  kandidate« pod korakom z izbrisi (`izrisiPomoc()`).
- `igra/igra.css` – kvečjemu razmik oznake »Manjkajoče števke« v kartici (slog `.niz-oznaka`
  že obstaja).
- `tools/posnetek-igre.js` – novi koraki na koncu scenarija (izklop, poudarek, vpis
  kandidata, zavrnjen vpis, Shift+števka, Ctrl+klik, »Naslednji korak« do stopnje 3,
  osvežitev strani, vklop); nova elementa se posnameta samo v novih korakih, zato prvih 85
  posnetkov ostane primerljivih z `igra-pred-niz.json`.
- `CLAUDE.md`, `docs/uskladitev.md` (vrstica 5a, opomba), `docs/rocni-test.md`.

## 4. Preverjanje

1. **Testi** (`node --test "tests/*.test.js"`):
   - `tests/plosca.test.js` – stikalo: privzeto vklopljeno, zapis in branje ključa,
     neveljaven zapis, shramba ne dela; izklop: mreža brez kandidatov, skupina »Odstrani«
     skrita, Shift+števka (tudi par QWERTZ) nič, Ctrl+klik ne doda, izbira več celic in
     »več celic« ob izklopu, niz »Vpiši« vseh 9, vpis kandidata je poteza, vpis druge
     števke ni – razlog (vpisana v enoti / ročno odstranjen), sporočilo izgine; vklop:
     kot prej, ročni izbrisi ostanejo; brez stikala (trening) nespremenjeno.
   - `tests/mreza.test.js` – `celiceKandidatov` (kandidati samo v naštetih celicah, števka za
     vpis v drugih).
   - `tests/igra-ui.test.js` – stikalo v igri, nastavitev ostane po osvežitvi strani,
     »Naslednji korak« in »Preveri« dajo pri izklopu isto kot pri vklopu, korak na stopnji 3
     (kandidati samo v celicah koraka, opomba pri izbrisu, enojček brez opombe).
   - `tests/trening-uganka-ui.test.js` – z zapisom `sudoku.igra.kandidati = false` ima
     »Vadi v uganki« 4 kandidate, E1 jih nima (kot brez zapisa).
2. **Posnetek igre:** `--primerjaj tools/posnetki/igra-pred-niz.json` – prvih 85 posnetkov
   enakih (stikalo je privzeto vklopljeno), razlika samo v številu korakov; nato novo
   izhodišče `tools/posnetki/igra-po-5a.json`.
3. **Brskalnik brez glave** – nov scenarij `tools/preveri-kandidati-brskalnik.js`: igra pri
   375 in 1280 px v obeh stanjih (brez vodoravnega preliva; vklop: kandidati v praznih
   celicah; izklop: v mreži ni nobene male števke, skupina »Odstrani« ni prikazana, »Vpiši«
   vseh 9) s pravimi kliki in tipkami QWERTZ (Shift+števka nič, 1–9, zavrnjen vpis z
   razlogom, Ctrl+klik); shranjevanje (pravi klik na stikalo, osvežitev strani – izklop
   ostane, vklop ostane); korak na stopnji 3; trening z izklopljeno nastavitvijo
   (»Vadi v uganki« 4 s kandidati, »Spoznaj« E1 brez); brez napak JS; posnetki. Poleg tega
   obstoječi `tools/preveri-videz-brskalnik.js` (igra s kandidati – prelivi, slogi).

## 5. Koraki izvedbe (commit + push po vsakem)

1. Načrt in posnetki prototipa (ta dokument).
2. `shared/` (plošča, mreža) in njuni testi; igra še nespremenjena – posnetek igre »Enako«,
   vsi testi zeleni.
3. Igra: stikalo, kartica, Pomoč, korak na stopnji 3; testi igre in treninga; posnetek z
   novimi koraki in novo izhodišče; `CLAUDE.md`.
4. Scenarij v brskalniku, ročni pregled v `docs/rocni-test.md`, `docs/uskladitev.md`.

## 6. Ročni pregled (osnutek – en sam, na koncu, največ 5 točk)

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | igra, pravi telefon | Izklopi kandidate, izberi celico s prstom, vpiši števko, poudari števko; vklopi. | Mreža brez malih števk je pregledna, niz »Odstrani« izgine in se vrne, vpis deluje, poudarek je viden. | presoja videza in dotik |
| 2 | igra, slovenska tipkovnica | Pri izklopu: Shift+števka, 1–9 na kandidatu in na števki, ki je v vrstici že vpisana. | Shift+števka nič; kandidat se vpiše; druga števka se ne vpiše, vrstica pod nizi pove zakaj. | scenarij pošlje pare `key`/`code`, ne prave razporeditve sistema |
| 3 | igra | Pri izklopu »Naslednji korak« do »Pokaži rešitev« pri koraku z izbrisom (npr. par ali izločitev); nato »Vklopi kandidate« v opombi. | Iz kandidatov v celicah koraka in opombe je jasno, kaj korak naredi in zakaj ga ni mogoče izvesti brez kandidatov. Gumb vklopi kandidate (kljukica v kartici »Prikaz« obkljukana), korak ostane prikazan, izbris lahko izvedeš. | presoja razumljivosti |
| 4 | igra in trening, lokalni strežnik, tvoj Edge (ne InPrivate) | V igri izklopi kandidate, odpri trening (»Vadi v uganki« 4, »Spoznaj« E1), nato znova igro (F5). | Trening kot prej; igra po F5 ostane brez kandidatov. | obstoječa shramba pravega profila |

## 7. Izvedba

| Korak | Commit | Kaj |
|---|---|---|
| 1 | `4048df5` | načrt in posnetki prototipa |
| 2 | `3097473` | `shared/plosca.js` (stikalo, zavrnjen vpis, `kandidatiVidni()`, `nastaviKandidate()`), `shared/mreza.js` (`celiceKandidatov`), testi; igra še brez stikala – posnetek igre »Enako: 85« |
| 3 | `5b9ff90` | igra: kartica »Prikaz« s kljukico »Kandidati v celicah«, `#odstraniGlava`, `pogledKoraka()`, opomba z gumbom »Vklopi kandidate«, odstavek v oknu Pomoč; testi igre in treninga; posnetek: prvih 85 enakih, 14 novih korakov, novo izhodišče `tools/posnetki/igra-po-5a.json` (99) |
| 4 | (ta commit) | `tools/preveri-kandidati-brskalnik.js`, ročni pregled v `docs/rocni-test.md`, `docs/uskladitev.md` (stanje, tri točke v »Kasneje«) |

Preverjeno avtomatsko: vsi testi (431), posnetek igre, `tools/preveri-kandidati-brskalnik.js`
(44 preverjanj pri 375 in 1280 px), obstoječi `preveri-videz-`, `preveri-enojcki-`,
`preveri-vadi-` in `preveri-presek-brskalnik.js` (trening uporablja isto ploščo – »Spoznaj« je
enak izhodišču `4e1e4dc`).

Odstopanja od načrta: namesto ovoja `#odstraniSkupina` plošča dobi seznam elementov
(`skrijBrezKandidatov`), ker bi ovoj spremenil pravilo `.niz-oznaka:first-child` in razmik nad
nizom. Razlog zavrnjenega vpisa ostane ob Shift+števki (ta pri izklopu ni poteza) in izgine ob
naslednji potezi ali izbiri.
