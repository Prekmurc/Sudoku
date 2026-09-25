# Trening v uganki – načrt
(2026-09-25; deli 1–3 narejeni, glej »Stanje po delih«)

Vrstni red: najprej faza 4
iz docs/uskladitev.md
(imena tehnik in izrazi),
nato ta načrt.

## Odgovori (poslati ob
## začetku izvedbe)

PRAVILO "ne Presega tehnike"
ODPADE. Vaja rešuje en korak,
stanja pred prvim ugibanjem
so veljavna (analiza 2.4).
Pogoj je samo ena rešitev.
Stopnja uganke je lahko
informacija, ni pogoj.

1. Dva gumba na kartici.
2. Da, kot predlagano.
3. Da, samodejno razveljavi.
   Sporočilo pove, kateri
   izbrisi so razveljavljeni.
4. Ne spreminjaj.
5. 50 je dovolj.
6. Pozneje, v KASNEJE.
7. Polna izločitev.
8. V shared/stanje.js.
9. Barve poudarka beri iz
   nastavitev igre (samo
   branje). Stikala svoja.

Vsak del v svojem pogovoru,
stanje po delu v
docs/trening-v-uganki.md.

## Stanje po delih

| Del | Stanje | Commit | Testi |
|---|---|---|---|
| 1 `shared/stanje.js` | **narejeno 2026-09-25** | `ba1f832` | 264 (258 + 6) |
| 2 `shared/vaje-uganka.js` | **narejeno 2026-09-25** | `6b6bf53` | 280 (264 + 16) |
| – postopnost E1/E2 v »Spoznaj« (samostojna) | **narejeno 2026-09-25** | `d92e673` | 309 (280 + 29) |
| 3 banka vaj (`shared/vaje-banka.js`) | **narejeno 2026-09-25** | | 315 (309 + 6) |
| 4 `shared/mreza.js` | ni začet | | |
| 5 `shared/plosca.js` | ni začet | | |
| 6 trening »Vadi v uganki« | ni začet | | |

### Del 1 – narejeno (commit `ba1f832`)

- `igra/stanje.js` je z `git mv` preseljen v `shared/stanje.js`, shranjevanje
  (`igraZdaj`, `igraVZapis`, `igraIzZapisa`, `igrePisi`, `igraShrani`, `igraNalozi`,
  `igraZadnja`) je v novem `igra/shramba.js`.
- V `shared/stanje.js` sta še `odigrajPotezo()`/`odigrajPoteze()` (iz
  `shared/zbirka.js`) in `dejanjaKoraka(k, stanje)` (iz `igra/igra.js`, stanje je zdaj
  argument).
- Začetni kazalec se imenuje **`zacetnihPotez`**, ne `zacetek`, ker je `zacetek` v
  zapisu shranjene igre čas začetka. Nove funkcije: `igraZZacetkom(danosti, poteze)`
  (igra s potezami, zaklenjenimi kot izhodišče, ali `null`), `zacniZnova()`,
  `lahkoZacniZnova()`; `lahkoRazveljavi()` upošteva začetek.
- **Dodatek k načrtu:** vpisov iz začetnih potez ni mogoče zbrisati
  (`mozneAkcije().zbrisi`). Načrt je omenjal samo »vrni«, a brez tega bi »Zbriši vpis«
  spremenil stanje vaje S0. `stanjeIgre()` vrne za to polje `zacetni` (vpisi in izbrisi
  začetnih potez).
- `igra/igra.js` uporablja `zacniZnova()`/`lahkoZacniZnova()` namesto `kazalec = 0` in
  `kazalec === 0`; obnašanje igre ostane enako.
- Nalagalni seznami: `shared/stanje.js` pred `shared/zbirka.js` v `app/index.html`,
  `igra/index.html` in `igra/oceni-worker.js`; `igra/index.html` naloži še
  `igra/shramba.js` namesto `igra/stanje.js`. Trening `shared/stanje.js` še ne naloži
  (del 6).
- Testi: 6 novih v `tests/igra-stanje.test.js` (začetne poteze so izračunane iz korakov
  `nextStep()` – funkcija `zacetekPoti()` v testu, ki jo lahko del 2 uporabi kot vzor),
  v drugih testih so spremenjeni samo nalagalni seznami.

### Del 2 – narejeno (commit `6b6bf53`)

- Nova `shared/vaje-uganka.js` (brez DOM-a): `stanjaVUganki(danosti, kljuc)` →
  `{ stanja, poskus, stopnja }`, `vajaIzStanja(danosti, kljuc, stanje, stopnja)` →
  `{ danosti, kljuc, igra, S0, KT, KV, resitev, stopnja, prejOdstranjenih }`,
  `vajaIzUganke(danosti, kljuc, rnd)` in `preveriVajo(vaja, stanje, predlog)` →
  `{ izid, sporocilo, korak, razveljavi }`. Vrstni red izidov in sporočila so v
  opombah k delu 2 spodaj.
- `stopnja` se izračuna iz tehnik na poti (`genMere()`, pri poskusu »Presega
  tehnike«); test preveri, da je enaka `oceniTezavnost()`.
- `preveriEnojcek()` in namig enojčkov (zdaj funkcija `namigEnojcka()`) sta preseljena
  iz `trening/generators.js` v `shared/vaje-uganka.js`; »Spoznaj« se obnaša enako.
- `shared/generator.js`: nova `genMinimalnaUganka(seme)`. Uporabljata jo
  `genUgankaEnojcki()` v treningu (z `genNaklucnoSeme()`) in
  `tools/meri-trening-v-uganki.js` (njegova kopija zanke je odstranjena).
- **Odstop od opombe k delu 1:** trening že zdaj naloži `shared/stanje.js` in
  `shared/vaje-uganka.js` (pred `generators.js`), ker je tam `preveriEnojcek()`. Obe
  datoteki sta brez DOM-a in ne pišeta v shrambo.
- Vpisi pri tehnikah 1–12 niso del odgovora (niz »Vpiši« bo v delu 6 skrit);
  `preveriVajo()` presoja samo ročne izbrise kandidatov, ki so bili v S0.
- Testi: nov `tests/vaje-uganka.test.js` (15 testov; semena za vsako tehniko je našel
  program), v `tests/trening-tehnike.test.js` en nov test (sporočila `preveriVajo()`
  za vse izide), v `trening-enojcki`, `trening-pomoc` in `trening-tehnike` so
  spremenjeni nalagalni seznami.

### Del 3 – narejeno

- Nova `shared/vaje-banka.js` (brez odvisnosti, trening jo naloži v delu 6):
  `VAJE_BANKA = [{ seme, danosti, stopnja, tehnike }]`, urejeno po semenu. Tehnike so
  ključi `ALL_TECHNIQUES` (potrjeno), prikaz z `imeTehnike()`. Datoteke se ne ureja
  ročno; ob spremembi motorja ali generatorja se ustvari znova z orodjem (zapisano v
  glavi datoteke in v `CLAUDE.md`).
- Novo orodje `tools/ustvari-banko-vaj.js [--na-tehniko 50]`: semena 1, 2, … do 5978
  (zadnja pride Mečarica, pred njo med 3500 in 4000 semeni Skrita trojica), 242 s.
  Odvečni zapisi so odstranjeni (od zadnjega proti prvemu, dokler ima vsaka tehnika vsaj
  50 ugank): **220 zapisov** namesto 411, 57 KB.
- Ugank na tehniko: E1 171, E2 219, 1 204, 2 108, 3 115, 4 91, 5–8 po 50, 9 102, 10 70,
  11 in 12 po 50. Stopnje: Presega tehnike 112, Zelo težka 72, Težka 33, Srednja 3 –
  redke tehnike so večinoma v težkih ugankah, vaja je vedno stanje pred prvim poskusom.
- `shared/vaje-uganka.js`: pot je izločena v `prehodiPot()`, pogoj stanja za vajo v
  `ustrezaVaji()`; nova `tehnikeVUganki(danosti)` z eno potjo da vse tehnike, za katere
  ima uganka stanje vaje (`stanjaVUganki()` se obnaša enako).
- Testi: nov `tests/vaje-banka.test.js` (5 testov, pribl. 16 s – oblika in urejenost,
  seme → iste danosti, ena rešitev, natanko izračunane tehnike, stopnja =
  `oceniTezavnost()`, vsaj 50 ugank na tehniko, noben zapis ni odveč), v
  `tests/vaje-uganka.test.js` en nov test (`tehnikeVUganki()` = `stanjaVUganki()` za vse
  tehnike, tudi pri uganki Presega tehnike).

## Opombe k delom (uskladitev s fazo 4 in odpadlo pravilo)

Načrt in analiza `docs/trening-v-uganki.md` sta nastala pred fazo 4. Razdelek 0 spodaj
opisuje pravilo »ne Presega tehnike«, ki je odpadlo. Te opombe veljajo pred besedilom
načrta in analize.

### Za vse dele

- Imena tehnik v načrtu in analizi so stara ali angleška (Pointing, Box-line, Očitna
  para, Swordfish, UR …). Številke E1, E2 in 1–12 so ostale enake, ker se vrstni red ni
  spremenil. Tabele meritve ostanejo kot posnetek stanja.
- Ime, ki ga vidi uporabnik, da vedno `imeTehnike()` (`shared/engine.js`); v podatkih
  in parametrih so ključi `ALL_TECHNIQUES`. Izraz je »števka«. Angleško ime je samo v
  oklepaju.
- `TRENING_ENOJCKA` ima zdaj kot drugi element ključ motorja (`'Gol enojček'`,
  `'Skriti enojček'`), enako kot `TRENING_TEHNIKE`, zato E1 in E2 ne potrebujeta
  posebne preslikave.

### Del 2 – `shared/vaje-uganka.js`

- **Pravilo »ne Presega tehnike« odpade.** Razdelek 0 ne velja. `stanjaVUganki()` pri
  poskusu s protislovjem ne vrne `null`, ampak vrne stanja pred prvim poskusom (analiza
  2.1 in 2.4). Stopnja uganke je samo informacija in je lahko tudi »Presega tehnike«.
  Pogoj je samo ena rešitev.
- V `tests/vaje-uganka.test.js` odpade »ni Presega tehnike«, ostane »ena rešitev«.
  Predlog: test z vsaj eno uganko Presega tehnike, da so stanja samo pred prvim
  poskusom in nobeno za njim.
- Časi iskanja: tabela v razdelku 0 (brez Presega) ne velja več, veljajo številke iz
  analize 2.2 (s Presega).
- `stanjaVUganki(danosti, kljuc)`: `kljuc` je ključ `ALL_TECHNIQUES`.
- `vajaIzStanja()` zgradi igro z `igraZZacetkom(danosti, poteze)` iz dela 1, polje je
  `zacetnihPotez`. Poteze so najprej vpisi poti, nato izbrisi (poteza `kandidat`), kot
  v `zacetekPoti()` v `tests/igra-stanje.test.js`.
- Sporočila `preveriVajo()`: imena iz `imeTehnike()`, nikoli angleško zunaj oklepaja.
  Sporočilo iz tabele 3.2 analize »To drži, a sledi iz W-Wing, ne iz Swordfish.« krši
  to pravilo, poleg tega `imeTehnike()` da imenovalnik, stavek pa rabi rodilnik.
  Predlog brez sklanjanja, **potrjen 2026-09-25**: »To drži, a je to korak tehnike
  10 · W-krilo, ne 8 · Mečarica.«
- Preverjanje besedil iz `tests/trening-tehnike.test.js` (brez »številk«, brez
  angleškega imena zunaj oklepaja) razširiti na sporočila `preveriVajo()`.
- **Vrstni red izidov pri mešanih odgovorih** (odločitev 2026-09-25): velja prvi, ki
  drži – `prazno` → `napacno` → `neutemeljeno` → `druga-tehnika` → `delno` /
  `pravilno`. `delno` in `pravilno` se izključujeta: pravilno je, ko so vsi izbrisi iz
  korakov KT in je vsaj en korak cel (dodatni izbrisi iz drugega koraka iste tehnike
  niso napaka), delno, ko noben korak ni cel. Pri `neutemeljeno` in `druga-tehnika` se
  razveljavijo vsi izbrisi zunaj KT (izbrisi iz KT ostanejo). Test z mešanimi
  primeri je v `tests/vaje-uganka.test.js`.
- **Sporočilo pri `neutemeljeno` ne zveni kot napaka** (odločitev 2026-09-25), saj
  kandidat res ni prava števka: »Izbris drži, a ga v tem koraku ne utemelji nobena
  tehnika.« (dvojina »Izbrisa držita, a ju …«, množina »Izbrisi držijo, a jih …«), nato
  »Razveljavljeno: V3S5 (7).«

### Del 3 – banka vaj

- Tehnike v zapisu banke naj bodo ključi `ALL_TECHNIQUES` (kot v zbirki), ne oznake
  načina (`'naked-single'`, `'pointing'`, `'hidden-triple'` v primeru oblike spodaj);
  prikaz z `imeTehnike()`. **Potrjeno 2026-09-25.**
- Brez pogoja »ne Presega tehnike«: zapis ima stopnjo, tudi »Presega tehnike«. Test
  `tests/vaje-banka.test.js`: ena rešitev, prava stopnja, natanko izračunani seznam
  tehnik, seme da iste danosti, vsaj 50 ugank na tehniko – ne »ni Presega tehnike«.
- Ocena časa (razdelek 4) je bila merjena brez ugank Presega tehnike (skrita trojica
  0,4 % ugank). Z njimi je delež pribl. 1,3 % (analiza 2.2), torej pribl. 4000 ugank
  oziroma nekaj minut v Node. To je ocena, ne meritev.

### Dela 4 in 5 – skupna mreža in vnos

- Pomoč v igri kliče `dejanjaKoraka(k, stanje)` iz `shared/stanje.js`.
- »Začni znova« v igri uporablja `zacniZnova()`/`lahkoZacniZnova()`. `shared/plosca.js`
  naj uporablja iste funkcije, da vaja (začetne poteze) deluje brez posebnosti.

### Po delu 4 – samostojna naloga »Prava geometrija pri tehnikah 1 in 2 v Spoznaj«

Zapisano 2026-09-25, **ni začeto** (ne izvajati pred delom 4). Samostojna naloga v svojem
pogovoru, po delu 4:

- Vaji 1 · Izločitev izven bloka in 2 · Izločitev v bloku v načinu »Spoznaj« namesto
  ločenih enot pokažeta **delno mrežo 9 × 9** (skupna mreža `shared/mreza.js` iz dela 4).
- Na mreži sta samo obe enoti vaje na pravih mestih, ostale celice so prazne.
- Stolpec gre navpično skozi blok, vrstica vodoravno skozi blok; presek enot je jasno
  viden.
- Oznake vrstic in stolpcev (V/S) so na robu mreže, ne nad celicami.
- Tehnike 3–6 ostanejo, kot so (nabor kandidatov v eni enoti).

### Po delih 4 in 5 – samostojna naloga »Pripomočki za E1/E2 v Spoznaj«

Zapisano 2026-09-25, **ni začeto** (ne izvajati pred delom 5). Samostojna naloga v svojem
pogovoru, po delih 4 in 5:

- Vaji E1 in E2 v načinu »Spoznaj« dobita skupno mrežo iz `shared/` (del 4,
  `shared/mreza.js`) namesto lastnega izrisa v `trening/trening.js`.
- Najmanj: poudarek števk, tudi več hkrati (kot niz »Poudari« s kljukico »več hkrati« v
  igri).
- Po možnosti še seznami manjkajočih števk (vrstice, stolpci, bloki).
- Kandidati ostanejo skriti (vaja je brez kandidatov, kot zdaj).

### Pred delom 6 – samostojna naloga »Postopnost E1/E2 v Spoznaj«

Zapisano 2026-09-25, **narejeno 2026-09-25 (d92e673)**. Samostojna naloga v svojem pogovoru, pred delom 6.
V krogu vaj E1 in E2 v načinu »Spoznaj« naj se pomoč postopno zmanjšuje:

- **E1:** vaje 1–3 imajo označeno celico (igralec izbere samo števko), vaje 4–6 imajo
  označeno enoto, vaje 7–9 so brez oznake (cela mreža).
- **E2:** enako – vaje 1–3 imajo označeno enoto in števko, vaje 4–6 samo enoto, vaje 7–9
  so brez oznake (cela mreža).
- Izvedba: oznaka in navodilo v `trening/generators.js` (`stopnjaEnojcka()`,
  `postopnostEnojcka()`), namig po stopnji v `namigEnojcka()` (`shared/vaje-uganka.js`),
  prikaz v `trening/trening.js`. Izbira je omejena na označeno enoto (odločitev
  2026-09-25); prazne celice, ki jih ni mogoče izbrati, so rahlo zatemnjene in brez
  kazalca z roko (pri E1, vaje 1–3, vse razen označene celice). Pri vajah 4–6 je
  pravilen vsak enojček te tehnike v označeni enoti. Pravilo »pomoč se ne šteje«
  ostane.

### Del 6 – trening »Vadi v uganki«

- Vrstica nad vajo: `imeTehnike(kljuc, { stevilka: true })` kot v »Spoznaj« (»4 ·
  Skriti par (Hidden Pair) · Vaja 3 / …«). Oznaka koraka v pomoči je kratko ime s
  številko, celo ime je v `title`, kot v igri.
- Nova besedila (gumba »Spoznaj« in »Vadi v uganki«, vrstica s številom skritih
  kandidatov, sporočila) morajo prestati `tests/besedila-html.test.js`: brez »številk«,
  brez »Prikaži«, brez angleških imen v opisih kartic. »Pokaži prečrtane« in »Skrij«
  sta usklajena s točko 1.7.
- Stopnja uganke se lahko pokaže kot informacija, tudi »Presega tehnike«. Ob
  »Nadaljuj v igri« (KASNEJE) velja analiza 4.4: uganke Presega tehnike brez ugibanja
  ni mogoče rešiti do konca.
- Trening naloži `shared/stanje.js`, ne pa `igra/shramba.js`, ker v `sudoku.igra.v1` ne
  piše.

## Načrt Claude Code

Načrt: trening »Vadi v uganki«
Kode nisem spreminjal. Pognal sem samo obstoječi merilni skript, da preverim, kaj za iskanje pomeni novo pravilo »ne Presega tehnike«. Rezultati so v scratchpadu, ne v repozitoriju.

0. Kaj spremeni pravilo »natanko ena rešitev, ne Presega tehnike«
**Ne velja več:** pravilo je odpadlo, glej »Opombe k delom« zgoraj (del 2, 3 in 6).
Ena rešitev je zagotovljena že po konstrukciji: minimalna uganka odstranjuje celice samo, dokler je countSolutions() === 1. Test to vseeno preveri.
Ne Presega tehnike se preveri brez dodatne cene. Pot z nextStep() brez prednosti števke je ista kot genPot() v oceniTezavnost(). Uganka torej presega tehnike natanko takrat, ko pot pride do poskusa s protislovjem. Zato se mora pot izvesti do konca, ne samo do prvega stanja s T. Iz množice uporabljenih tehnik na isti poti dobimo tudi stopnjo uganke (vajo lahko označimo npr. »iz Težke uganke«).
Posledica: uganke Presega tehnike so dajale 40–60 % stanj redkih tehnik. Brez njih se sprotno iskanje precej upočasni. Meritev na 3000 ugankah (strogo, brez Presega; pri E1/E2 samo čisto stanje, glej 3):
Tehnike	v 1 s (namizni)	v 1 s (telefon, ocena ×3)
E1, E2, 1 Pointing	100 %	92–100 %
2, 3, 9	93–94 %	55–66 %
4, 10	78–83 %	40–47 %
11 XY-Wing	56 %	24 %
5, 7	34–40 %	14–15 %
8 Swordfish, 12 UR	14–18 %	0–7 %
6 Skrita trojica	0 %	0 %
Za redke tehnike je vzorec majhen (12–65 ugank), zato so to grobe ocene. Pri tehnikah 5–8 in 12 bo vaja večinoma iz banke, kar je v skladu z odločitvijo 6.

1. Razdelitev na dele (commit + push po vsakem)
Del	Vsebina	Obseg
1	shared/stanje.js: preselitev iz igre in začetni kazalec	majhen
2	shared/vaje-uganka.js: iskanje stanja, vaja kot igra, presoja odgovora (brez DOM-a)	srednji
3	Banka vaj: orodje, shared/vaje-banka.js in test	majhen do srednji
4	shared/mreza.js in mreza.css: izris mreže in seznamov iz igre; igra ga uporablja	srednji
5	shared/plosca.js: vnos iz igre (nizi, izbira, tipkovnica, razveljavi/ponovi); igra ga uporablja	velik (največ tveganja za igro)
6	Trening »Vadi v uganki«: UI, iskanje z mejo 1 s in banko, »Preveri«, pomoč, štetje	velik
Deli 1–3 ne posegajo v noben UI. Po delih 4 in 5 se igra obnaša enako kot prej: testi igra-ui, igra-stanje in zbirka-skupna ostanejo brez sprememb pričakovanj, spremeni se samo seznam naloženih datotek. Vsak del posodobi tudi CLAUDE.md in stanje v docs/trening-v-uganki.md.

2. Datoteke
Nove

shared/stanje.js: današnji igra/stanje.js brez shranjevanja. Dobi še odigrajPotezo()/odigrajPoteze() iz shared/zbirka.js in dejanjaKoraka() iz igra.js.
igra/shramba.js: igraShrani, igraNalozi, igraZadnja, igraVZapis, igraIzZapisa, igraZdaj. V sudoku.igra.v1 piše samo igra, trening nikoli.
shared/vaje-uganka.js: iskanje stanja, vaja kot igra, preveriVajo(). Sem se preseli tudi preveriEnojcek() z namigoma enojčkov.
shared/vaje-banka.js: const VAJE_BANKA = [...]. Je JS in ne JSON, ker fetch pri file:// ne dela.
shared/mreza.js in shared/mreza.css: izris mreže in seznamov.
shared/plosca.js: nizi »Poudari«/»Vpiši«/»Odstrani«, izbira ene ali več celic, tipkovnica, razveljavi/ponovi/zbriši, stikala seznamov.
trening/v-uganki.js: UI načina »Vadi v uganki«.
tools/ustvari-banko-vaj.js: ustvari shared/vaje-banka.js.
Testi: tests/vaje-uganka.test.js, tests/vaje-banka.test.js, tests/trening-uganka-ui.test.js.
Spremenjene

shared/generator.js: dobi genMinimalnaUganka(seme) (zanka iz ustvariUganko() brez ocene).
shared/zbirka.js: brez odigrajPotezo()/odigrajPoteze().
Nalagalni seznami: app/index.html, igra/index.html in igra/oceni-worker.js naložijo shared/stanje.js.
igra/igra.js (izris in vnos gresta v shared/), igra/igra.css (slogi mreže gredo v shared/mreza.css).
trening/index.html, trening/trening.js (izbira načina, skupno štetje), trening/trening.css.
trening/generators.js: preveriEnojcek() se preseli; genUgankaEnojcki() pokliče genMinimalnaUganka(genNaklucnoSeme()), obnašanje ostane.
tools/meri-trening-v-uganki.js: uporabi skupno genMinimalnaUganka() in pot.
Nalagalni seznami v obstoječih testih, tests/igra-stanje.test.js (začetni kazalec), CLAUDE.md, docs/trening-v-uganki.md.
3. Vaja iz uganke (shared/vaje-uganka.js, brez DOM-a)
stanjaVUganki(danosti, kljuc) → { stopnja, stanja } ali null:
pot z nextStep(b) brez prednosti števke do konca;
null pri poskusu s protislovjem (Presega tehnike); – odpade, vrne stanja pred prvim poskusom (glej opombe k delu 2);
stanja so vsa stanja na poti, v katerih je naslednji korak tehnika kljuc (strogo, odločitev 1).
E1 in E2 samo iz čistih stanj (pred njimi so bili na poti sami enojčki). Ker so kandidati skriti, igralec ne sme potrebovati izbrisov, ki jih ne vidi. E1 zahteva še vsaj 30 praznih celic, kot »Spoznaj«. Čisto stanje E2 je isto kot pogoj vaje E2 v »Spoznaj« (na mreži ni nobenega očitnega enojčka).
vajaIzStanja(danosti, stanje) → { igra, S0, KT, KV, korak, resitev, stopnja, prejOdstranjenih }:
stanje je zapisano kot igra: vpisi poti so poteze vpis, izbrisi poti (razlika med new Board(mreža) in kandidati na poti) so poteze kandidat/kandidati;
igra.zacetek je število teh potez, »Razveljavi« pod njim ne gre;
kandidati, odstranjeni pred vajo, so v mozneAkcije().vrni izključeni (odločitev 3).
preveriVajo(vaja, stanje) → { izid, sporocilo, korak, razveljavi } po tabeli 3.2 dokumenta: napacno, pravilno, delno, druga-tehnika, neutemeljeno, prazno. Pri E1/E2 prek preveriEnojcek().
Iz ene uganke se izbere naključno ustrezno stanje, ne vedno prvo. Pri E1 in Pointing je stanj več, zato je vaj več.
4. Iskanje vaje: najprej sprotno z mejo 1 s, nato banka
Sprotno:

V glavni niti, ena uganka na setTimeout, tako kot iskanjeVGlavniNiti() v igri. Uganka in pot trajata pribl. 45 ms, zato vmesnik ostane odziven.
Deluje tudi pri file://. Delavca pri meji 1 s ne predlagam.
Med iskanjem se izpiše »Iščem vajo …«.
Meja se preverja med ugankami, zato je dejanski čas 1 s + ena uganka.
Banka:

Od kod: node tools/ustvari-banko-vaj.js [--na-tehniko 50] gre po semenih 1, 2, … z genMinimalnaUganka(seme) in stanjaVUganki(). Uganko obdrži, če vsebuje katero od tehnik, ki še nima 50 ugank. Ustavi se, ko jih imajo vse.
Čas: skrita trojica je v pribl. 0,4 % ugank, zato 50 ugank pomeni pribl. 12 000 ugank oziroma 10 min v Node (enkratno).
Oblika: vsaka uganka je zapisana enkrat, s seznamom tehnik: { seme, danosti, stopnja, tehnike: ['naked-single', 'pointing', 'hidden-triple', …] }. Uganka redke tehnike pokrije tudi pogoste, zato pričakujem pribl. 150–250 zapisov (pribl. 25 KB).
Zakaj z danostmi: vaja iz banke je takoj na voljo (pribl. 7 ms namesto pribl. 45 ms), test pa je hitrejši.
Zakaj z semenom: zapis ostane ponovljiv. Danosti niso sestavljene na pamet, ker jih ustvari program, test pa preveri eno rešitev.
Izbira: naključen zapis s tehniko T, ki v tej seji še ni bil uporabljen. Ko jih zmanjka, se izbira začne znova.
Kje: shared/vaje-banka.js, naloži ga samo trening.
5. Prikaz mreže
Mreža je skupna mreža iz igre (shared/mreza.js) z vsemi pripomočki: poudarek števk z »več hkrati«, seznami manjkajočih števk, razveljavi/ponovi in odstranjevanje iz več celic.

E1, E2: brez kandidatov

Mreža kaže samo števke: dane temno, vpisane na poti modro.
Niz »Odstrani« je skrit.
V nizu »Vpiši« je za prazno celico omogočenih vseh 9 števk. Če bi bili omogočeni samo kandidati, bi niz izdal očitni enojček.
Vpis je predlog (celica in števka, prikazana drugače), ne poteza. »Preveri« ga presodi s preveriEnojcek(). Pri pravilnem odgovoru postane poteza vpis, sicer se predlog počisti, tako kot v »Spoznaj«.
Razveljavi/ponovi tu nimata dela (glej vprašanje 2).
1–12: s kandidati

Kandidati, odstranjeni pred vajo, so skriti (odločitev 3).
Nad mrežo je vrstica »V tem stanju je že odstranjenih N kandidatov (prejšnji koraki).« s stikalom »Pokaži prečrtane«. Stikalo jih pokaže prečrtane (nov razred kand.precrtan) in ne spremeni odgovora.
Niz »Vpiši« je skrit, razlog pod nizi pove: »V tej vaji samo odstranjuješ kandidate.«
Po odgovoru

Pravilno: mreža se zaklene, na njej so oznake koraka (k-vzorec/k-izbris) in sporočilo koraka, nato »Naslednja vaja →«.
Napačno: gumb »Poskusi znova« vrne na S0 (kazalec = začetek), poteze ostanejo v »Ponovi«.
Štetje in krog: skupni s »Spoznaj«, prek obstoječih stej(), oznaciPomoc() in preveri() v trening.js. Krog ima 9 vaj, na koncu je »Končano!«.

Pomoč: »Namig« in »Rešitev« se sprožita s klikom in ostaneta prikazana do »Skrij«.

Namig pri 1–12 je stepHint(), pri E1/E2 namig iz »Spoznaj«.
Rešitev je korak.message, oznake na mreži (samo še neizvedena dejanja) in seznam dejanj.
Korak je tisti iz KT, ki se najbolj ujema z igralčevimi izbrisi; sicer korak nextStep().
Pravilo pomoči je isto kot v »Spoznaj«: vsak ogled pomeni »s pomočjo«.
6. Novi testi
tests/igra-stanje.test.js (razširitev):
»Razveljavi« se ustavi pri zacetek;
»vrni« ne velja za kandidate, odstranjene pred vajo;
prvaNapaka() in »Začni znova« upoštevata začetek.
tests/vaje-uganka.test.js:
genMinimalnaUganka() je ponovljiva in se ujema z merilnim orodjem;
na več semenih za vsako tehniko:
v S0 nextStep() vrne T;
uganka ima eno rešitev in ni Presega tehnike;
kandidati v igri iz vaje so natanko kandidati na poti;
E1/E2 sta čista, E1 ima vsaj 30 praznih celic;
preveriVajo() z vsemi izidi na pravih stanjih, kjer se izbrisi izračunajo iz korakov motorja in se ne sestavljajo na pamet:
pravilno: katerikoli korak iz KT;
delno: podmnožica koraka;
napačno: izbris prave števke;
druga tehnika: korak iz KV brez KT;
neutemeljeno: kandidat, ki ni prava števka in ga noben korak ne izbriše;
prazno.
tests/vaje-banka.test.js:
vsak zapis ima eno rešitev, ni Presega tehnike, ima pravo stopnjo;
seznam tehnike je natanko izračunani (sprememba motorja ga pokvari, test to pokaže);
seme da iste danosti;
vsaka tehnika ima vsaj 50 ugank.
tests/trening-uganka-ui.test.js (nadomestni DOM):
izbira načina;
banka ob preseženi meji (čas se nadomesti);
E1 brez kandidatov, z vsemi 9 števkami;
pri 1–12 je »Vpiši« skrit, prikazano je število skritih kandidatov, stikalo »Pokaži prečrtane« deluje;
vseh šest izidov »Preveri« in »Poskusi znova«;
pomoč se ne šteje, enako kot v trening-pomoc;
krog 9 vaj in »Končano!«.
Obstoječi trening-enojcki, trening-pomoc in igra-* ostanejo zeleni, spremenijo se samo seznami datotek.
7. Odprta vprašanja
Izbira načina: predlagam dva gumba na kartici, »Spoznaj« in »Vadi v uganki«, pri čemer klik drugam na kartici pomeni »Spoznaj«. Druga možnost je eno stikalo nad menijem.
E1/E2: se strinjaš z vpisom kot predlogom (vseh 9 števk omogočenih, poteza šele po pravilnem odgovoru) in brez razveljavi/ponovi v teh dveh vajah?
»Prav, a z drugo tehniko«: naj se izbrisi, ki niso iz T, samodejno razveljavijo tako kot pri neutemeljenem izbrisu? Predlagam da. Sicer bi vsak naslednji »Preveri« spet dal isti izid, dokler jih igralec ne vrne sam.
»Spoznaj« E1/E2: naj tudi tam velja pravilo »ne Presega tehnike«? Predlagam ne, ker tam štejejo samo enojčki, »Spoznaj« pa ostaja nespremenjen.
Velikost banke: je 50 ugank na tehniko dovolj (enkratno pribl. 10 min, test nekaj sekund)?
Iskanje naslednje vaje v ozadju, medtem ko rešuješ trenutno: to močno poveča delež sprotnih vaj. Predlagam, da pride pozneje, ne v prvo različico.
Obseg preureditve igre (dela 4 in 5): predlagam polno izločitev, kot v 4.1. Lažja možnost je, da trening prevzame samo izris, vnos pa napiše sam, a to podvoji pribl. 300 vrstic vnosa iz igre.
odigrajPotezo()/odigrajPoteze() v shared/stanje.js: potem ga naložita tudi reševalec in oceni-worker.js. Druga možnost je, da trening naloži shared/zbirka.js.
Manjše: trening ima svoje ključe za stikala seznamov (sudoku.trening.*). Barve poudarka, ki jih nastaviš v igri, se v treningu ne uporabijo (privzete barve).
Ko potrdiš načrt in odgovoriš na vprašanja, začnem z delom 1.
