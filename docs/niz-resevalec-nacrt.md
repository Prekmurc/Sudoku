# Niz danosti v reševalcu – načrt

Naloga: reševalec (`app/`) dobi polje »Niz« za prilepljen niz 81 znakov (`0` ali `.` = prazna celica), ki izpolni vnosno mrežo – enako kot ga ima igra v oknu »Nova uganka«. Igra se ne sme spremeniti.

Stanje: načrt, čaka na potrditev (2026-09-27).

## 1. Kje je zdaj branje niza

Samo v igri, v `igra/igra.js` (poslušalec `input` na `#novaNiz`, pribl. vrstica 1185):

- iz besedila vzame samo znake `0-9` in `.`, **vse drugo tiho izpusti** (presledke, prelome vrstic, `|`, `-`, pa tudi črke ali `x`);
- natanko 81 takih znakov → vpiše v vnosno mrežo okna (`0`/`.` = prazno), označi konflikte, sporočilo »Niz je vpisan v mrežo.«;
- drugače, če je kaj znakov → rdeče »Veljavnih znakov v nizu: N (potrebnih je 81).«, mreža ostane, kakor je;
- prazno polje → sporočilo se počisti.

V `shared/` ni funkcije za to. Sorodno je le v `shared/zbirka.js`: `zbirkaPrimerZa()` (zamenja `.` z `0`) in uvoz iz Markdowna (strogo `^[0-9]{81}$` po zamenjavi – drugo pravilo, ostane nespremenjen). Reševalec ima `naloziDanosti(danosti, sporocilo)` (`app/app.js`), ki vpiše 81 znakov v mrežo in skrije prejšnjo rešitev – uporabljata jo »Primer« in »Odpri« v zbirki.

## 2. Skupna koda

Nova funkcija v **`shared/zbirka.js`**: `zbirkaNizDanosti(besedilo)` → `{ danosti, veljavnih, sporocilo, napaka, neveljavni }`

- `danosti` – 81 znakov z `0` za prazno ali `null` (ni natanko 81 veljavnih znakov);
- `veljavnih` – število znakov `0-9` in `.`;
- `sporocilo`, `napaka` – **natanko besedili igre**: `''` / »Niz je vpisan v mrežo.« / »Veljavnih znakov v nizu: N (potrebnih je 81).« (`napaka: true`);
- `neveljavni` – različni izpuščeni znaki, ki niso presledek, prelom vrstice ali ločilo mreže (`|`, `+`, `-`), npr. `['x', '*']` (za sporočilo v reševalcu, glej točko 3).

Pravilo branja ostane pravilo igre (izpusti vse razen `0-9` in `.`), zato igra po preureditvi dela enako.

Zakaj `zbirka.js` in ne `engine.js`: naložita jo obe aplikaciji, tam je že pretvorba danosti (`zbirkaPrimerZa`, uvoz), sprememba `engine.js` pa bi po pravilu iz CLAUDE.md zahtevala novo banko vaj, čeprav motor ostane isti. Nova datoteka v `shared/` bi bila za eno funkcijo odveč.

`igra/igra.js`: poslušalec `#novaNiz` pokliče `zbirkaNizDanosti()` in uporabi `danosti`/`sporocilo`/`napaka`; vpis v mrežo, `oznaciKonflikte()` in `novaStatus()` ostanejo v igri (DOM). Nič drugega se v igri ne spremeni.

## 3. Polje v reševalcu in obnašanje

Mesto: v prvi kartici **nad vnosno mrežo** (kot v igri, kjer je polje nad mrežo okna): `<label class="prilepi">Niz <input id="nizDanosti" …></label>` z istim `placeholder` kot v igri, pod njim vrstica `#nizStatus` za sporočila polja. Uvodno besedilo v glavi dobi pol stavka o nizu (»… ali prilepi niz 81 znakov v polje Niz (0 ali . = prazna celica) …«). Slog `.prilepi` se prepiše v `app/app.css` (dve pravili, barve iz palete reševalca); `igra/igra.css` ostane.

Obnašanje (ob vsakem dogodku `input` – deluje za lepljenje in tipkanje, kot v igri):

| Vsebina polja | Mreža | Sporočilo |
|---|---|---|
| natanko 81 veljavnih znakov | `naloziDanosti()` – vseh 81 celic se prepiše, konflikti se obarvajo, rešitev, kandidati, koraki in `lastSolve` se skrijejo/počistijo | glavni status: »Niz je vpisan v mrežo – danih števk: 24.«; `#nizStatus` prazen |
| drugo število veljavnih znakov | ostane nespremenjena | `#nizStatus` rdeče: »Veljavnih znakov v nizu: 79 (potrebnih je 81).« in, če so v nizu neveljavni znaki, še »Neveljavni znaki x, * so izpuščeni – prazna celica je 0 ali pika.« |
| prazno | ostane | `#nizStatus` se počisti |

Ločena vrstica `#nizStatus` je zato, da tipkanje nepopolnega niza ne prepiše glavnega statusa (npr. »Rešeno v 42 korakih.«) – dokler niz ni cel, se ne zgodi nič drugega.

Niz s ponovljeno števko v enoti: mreža se izpolni, celice se obarvajo rdeče (`checkConflicts()`), »Reši« in »Pokaži kandidate« zavrneta z obstoječim sporočilom – enako kot pri ročnem vnosu.

Igra ostane pri besedilu brez dela o neveljavnih znakih (zahteva »igra nespremenjena«). **Odločitev zate:** če želiš isto dopolnitev tudi v igri, je to ena vrstica v `igra/igra.js` in posnetek bo pokazal natanko to razliko.

## 4. Obstoječa vsebina mreže in »Počisti«

- Veljaven niz prepiše **celo** mrežo (tudi ročno vpisane števke) – niz je cela uganka, spajanje nima smisla. Ročni vpisi niso shranjeni drugje, zato jih ni mogoče vrniti; enako velja že za »Primer« in »Odpri«.
- »Počisti« izprazni tudi polje Niz in `#nizStatus` (kot »Počisti« v igri).
- »Primer« in »Odpri« (zbirka) izpraznita polje Niz in `#nizStatus`, da v polju ne ostane niz druge uganke.
- Ročni vpis v mrežo po lepljenju polja ne spremeni (enako kot v igri).

## 5. Več rešitev ali brez rešitve

Niz samo izpolni mrežo, nič ne preverja. Vse nadaljnje je obstoječa pot gumba »Reši« in ostane nespremenjeno: brez rešitve »Uganka nima rešitve – preveri vnesene števke.«, več rešitev in nepreverjena enoličnost rumeno opozorilo, v zbirko se shrani samo uganka z eno rešitvijo, vgrajeni primer se ne shrani (»Vgrajeni primer – v zbirko se ne shrani.«). Test preveri, da je izid po nizu enak kot po ročnem vnosu istih danosti.

## 6. Vpliv na igro

Sprememba v igri je samo preureditev poslušalca `#novaNiz`. Preverjanje s `tools/posnetek-igre.js`:

1. **Pred** spremembo kode: scenarij posnetka dobi na koncu nov blok »Nova uganka – niz« (odprtje okna, veljaven niz s `.`, veljaven niz z `0` in presledki/prelomi, prekratek, predolg, niz s črkami, niz s konfliktom, prazno polje, »Počisti«, »Začni igro« po nizu). V teh korakih se posnamejo še `novaNiz`, `novaMreza`, `novaStatus` (samo v novih korakih, zato prvih 74 posnetkov ostane primerljivih z `igra-pred-del5.json`). Posnetek na današnji kodi → `tools/posnetki/igra-pred-niz.json` (commit skupaj z orodjem).
2. **Po** spremembi: `--primerjaj tools/posnetki/igra-pred-niz.json` mora dati »Enako«.

## 7. Novi testi

- `tests/niz-danosti.test.js`:
  - `zbirkaNizDanosti()`: niz s `.` in z `0` da iste danosti; presledki, prelomi vrstic in `|+-` se izpustijo brez `neveljavni`; 80 in 82 znakov; prazno; črke/`x`/`*` v `neveljavni` (vsak znak enkrat); besedila `sporocilo` so enaka dosedanjim v igri; uganke iz `docs/uganke.md` in `PRIMERI` krožno (niz → danosti).
  - reševalec v nadomestnem DOM-u (`app/` skripte kot v `app-zbirka.test.js`, dogodek `input` na polju): veljaven niz izpolni mrežo in počisti prejšnjo rešitev; neveljaven pusti mrežo in glavni status, sporočilo v `#nizStatus`; konflikt → rdeče celice in »Reši« zavrne; »Počisti«, »Primer« in »Odpri« izpraznijo polje; po nizu z več rešitvami / brez rešitve / vgrajenim primerom »Reši« da isto kot ročni vnos (uganka z več rešitvami nastane v testu iz uganke iz `docs/uganke.md` z odstranjevanjem danosti, dokler `countSolutions()` ne vrne več kot 1; brez rešitve z dodano danostjo, ki nasprotuje rešitvi, a ne ponovi števke v enoti – oboje preveri program, ne na pamet).
- `tests/besedila-html.test.js` samodejno zajame novo besedilo v `app/index.html`.
- Obstoječi testi (`node --test "tests/*.test.js"`) morajo ostati zeleni.

## Preverjanje

Avtomatsko (naredim sam):

1. Vsi testi.
2. Posnetek igre `--primerjaj` (točka 6).
3. Brskalnik brez glave: Edge `--headless` prek protokola DevTools (vgrajeni `WebSocket` v Node 24, brez odvisnosti; skripta v začasni mapi, ne v projektu) na `app/index.html` in `igra/index.html` prek lokalnega strežnika: vtipkan niz (`Input.insertText`) izpolni mrežo, sporočila, »Reši« po nizu, širina 375 px brez vodoravnega drsnika; posnetke zaslona pogledam sam.

Ročno (samo, česar avtomatika ne more):

| # | Kje | Kaj narediti | Pričakovano | Zakaj ni avtomatsko |
|---|---|---|---|---|
| 1 | reševalec | Kopiraj niz iz `docs/uganke.md` (tudi večvrstični zapis mreže) in ga prilepi s Ctrl+V in z desnim klikom → Prilepi | mreža se izpolni, status »Niz je vpisan v mrežo – danih števk: N.« | pravo odložišče in kontekstni meni brskalnik brez glave le posnema (vnos besedila), ne preizkusi |
| 2 | reševalec, telefon | Dolg pritisk v polje Niz → Prilepi | mreža se izpolni, zaslonska tipkovnica ne prekrije sporočila | zaslonske tipkovnice in dotika ni v brskalniku brez glave |
| 3 | reševalec | Oceni postavitev: polje nad mrežo, besedilo v glavi, rdeče sporočilo pri prekratkem nizu | razumljivo in ne moti ročnega vnosa | presoja uporabnosti, ne pravilnosti |

## Koraki izvedbe (po potrditvi)

1. Razširitev `tools/posnetek-igre.js` in izhodiščni posnetek `igra-pred-niz.json` na današnji kodi.
2. `zbirkaNizDanosti()` v `shared/zbirka.js` + testi funkcije; igra jo uporabi; `--primerjaj` = enako.
3. Polje v reševalcu (`app/index.html`, `app/app.js`, `app/app.css`) + testi reševalca.
4. Brskalnik brez glave, dokumentacija (`CLAUDE.md`), povzetek.

Vsak korak svoj commit + push.
