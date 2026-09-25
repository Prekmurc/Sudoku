# Faza 4 – imena tehnik in izrazi (načrt)

Načrt za fazo 4 iz `docs/uskladitev.md`: 1.3 (imena tehnik), 1.4 (»števka«), 1.7
(»Pokaži«/»Skrij«) in dodatne zahteve iz naloge 2026-09-25. Točki 5.4 in 6.9 sta
posledica 1.3 in prideta zraven sami. Koda se v tem koraku ne spreminja.

Logika tehnik in reševanja se ne spremeni. Notranji ključi v `ALL_TECHNIQUES` (»Naked
pair«, »Gol enojček« …) ostanejo, kot so: dnevnik, sidranje, `TECHNIQUE_GROUPS`,
ravni v `shared/generator.js`, shramba in `docs/uganke.md` jih uporabljajo še naprej.
Spremeni se samo to, kar vidi uporabnik.

## Stanje (preverjeno 2026-09-25)

| Kje | Kaj je vidno zdaj |
|---|---|
| reševalec, oznaka koraka (`app/app.js:163`, `:190`, `:198`) | ključ `ALL_TECHNIQUES` (»Hidden pair«), naslov »5. Hidden pair« |
| reševalec, povzetek (`app/app.js:392–397`) | »**3x** Naked pair«, **po pogostosti** |
| igra, oznaka koraka (`igra/igra.js:708–709`) | ključ (»Hidden pair«) |
| igra, Pomoč → Tehnike (`igra/igra.js:890–905`) | oznaka `span.tehnika-oznaka` + `TEHNIKE_OPISI.ime` (»Skrita para (Hidden Pair)«) |
| trening, kartica (`trening/index.html` h3 + CSS `::before` »4. «) | »4. Skrita para (Hidden Pair)«, »3. Pointing pair/triple« |
| trening, vrstica nad vajo (`trening/trening.js:240`, `MODES.name`) | »Skrita para · Vaja 3 / 10« |
| zbirka, `zbirkaPodatkiResevanja()` (`shared/zbirka.js:394–403`) | `tehnike` urejene **po pogostosti**, izvoz `**Tehnike:**` s ključi |
| opisi stopenj (`shared/generator.js:79–104`, `igra/index.html:171`, `:192`) | angleška imena (X-Wing, Pointing pair/triple …) |

`TEHNIKE_OPISI.ime` ima danes stara imena (Očitna/Skrita **para**, »Tehnika mečarice«,
Pointing, Box-line in XY-Wing brez slovenskega imena). `TRENING_ENOJCKA` ima kot drugi
element ime za prikaz, `TRENING_TEHNIKE` pa ključ motorja – to se poenoti.

»Osnovne« je ostalo samo v dokumentaciji (`docs/tehnike.md:163–216`,
`docs/uganke.md:98`, `:167`); v kodi je že `GEN_NAJMANJ_SREDNJIH`.

## Oblika imena s številko

**Predlog: »4 · Skriti par (Hidden Pair)«**, enojčka »E1 · Očitni enojček (Naked
Single)«, poskus brez številke »Poskus in protislovje«.

- Pika za številko (»4. Skriti par«) se v reševalcu zaplete z zaporedno številko koraka
  (»5. 4. Skriti par«). Pika na sredini (`·`) je ločilo, ki ga aplikacije že uporabljajo
  (»danih 24 · tehnike: 1, 3, 7«), in ob oklepaju ne moti.
- Oklepaj ostane samo za angleško ime. XY-krilo ima v oklepaju dve imeni »(XY-Wing,
  Y-Wing)«.
- Kjer je številka v svojem elementu (kartica v treningu, seznam v Pomoči igre), ostane
  v njem – samo ločilo se spremeni v » · « (CSS `::before` v `trening/trening.css:34`,
  oznaka v `igra/igra.js:898`).

Kje se številka pokaže:

| Kje | Oblika |
|---|---|
| povzetek v reševalcu | »4 · Skriti par (Hidden Pair) – 3×« (število uporab na koncu, da se številki ne zlepita) |
| Pomoč → Tehnike (igra) | »4 · Skriti par (Hidden Pair)« |
| kartica v treningu | »4 · Skriti par (Hidden Pair)« |
| oznaka koraka (reševalec, igra »Naslednji korak«) | »4 · Skriti par«, celo ime v namigu miške (odgovora 1 in 3) |
| naslov koraka v reševalcu (nad malo mrežo) | »Korak 5 · 4 · Skriti par«, celo ime v namigu miške (odgovora 1 in 3) |
| lightbox v reševalcu | »Korak 5 · 4 · Skriti par (Hidden Pair)« – celo ime (dopolnitev 1) |
| vrstica nad vajo v treningu | »4 · Skriti par (Hidden Pair) · Vaja 3 / 10« |

## Razdelitev na dele

Vsak del je en pogovor, na koncu testi, `CLAUDE.md` (samo ustrezni odstavki), commit in
push.

### Del 1 – imena tehnik iz enega vira (1.3, 5.4, 6.9 za ime, vrstni red seznamov)

**Narejeno 2026-09-25, commit `ae48423`.** Testi: 247 (243 + 4 novi). Odstopanja od
opisa spodaj: test vrstnega reda v `zbirkaPodatkiResevanja()` je v
`zbirka-zapis.test.js`, `trening-wwing.test.js` preverja `imeTehnike('W-Wing')` namesto
`MODES.name`; v `igra/igra.css` je stolpec oznake v Pomoči → Tehnike širši (`min-width:
3em`), da so imena za »E1 · « in »10 · « poravnana; `igra-ui.test.js` ni spremenjen (oznake
koraka ne bere noben test).

1. `shared/engine.js`
   - `TEHNIKE_OPISI[k].ime` = slovensko ime brez oklepaja (»Skriti par«), novo polje
     `anglesko` (»Hidden Pair«). Imena iz tabele v `docs/uskladitev.md` 1.3.
   - `TRENING_ENOJCKA` dobi kot drugi element ključ motorja (`'Gol enojček'`,
     `'Skriti enojček'`) – enako kot `TRENING_TEHNIKE`.
   - Nove funkcije:
     - `imeTehnike(kljuc, { stevilka, anglesko })` – iz ključa `ALL_TECHNIQUES` (tudi
       korak »Poskus in protislovje …«); privzeto (brez možnosti) brez številke
       »Skriti par (Hidden Pair)« – to je naslov kartice v treningu, zato posebna
       možnost `stevilka: false` ni potrebna; s `stevilka: true` »4 · Skriti par
       (Hidden Pair)«, z `anglesko: false` brez oklepaja (»4 · Skriti par« – oznaka
       koraka, odgovor 3); poskus je vedno brez številke, celo ime
       »Poskus in protislovje (Forcing Chain)«, kratko »Poskus in protislovje«
       (dopolnitev 3); neznan ključ (»OBSTALO«, stara tehnika) vrne nespremenjenega;
     - `redTehnike(kljuc)` – položaj v `ALL_TECHNIQUES` za urejanje seznamov; poskus za
       vsemi tehnikami, neznane na koncu.
   - `tagClass()` se ne spremeni (dobiva še vedno ključ).
2. `app/app.js` – oznaka koraka (`:163`) in naslov nad malo mrežo (`:190`) prek
   `imeTehnike(k, { stevilka: true, anglesko: false })`, celo ime v `title`; naslov v
   lightboxu (`:198`) s celim imenom `imeTehnike(k, { stevilka: true })` (dopolnitev 1:
   v lightboxu je prostor, na dotik `title` ne deluje); povzetek (`:392–397`) po
   `redTehnike()`, oblika iz tabele zgoraj.
3. `igra/igra.js` – oznaka koraka (`:709`, kratko ime, celo v `title`), seznam v Pomoči
   (`:898–900`).
4. `trening/`
   - `trening.js` vpiše naslov kartice (h3, `textContent`) iz `imeTehnike(kljuc)` brez
     možnosti, tako kot že številko (`data-stevilka`, ki jo pokaže `::before`);
     vrstica nad vajo (`:240`) iz `imeTehnike()` namesto `M.name`;
   - `generators.js` – polje `name` iz `MODES` odpade (6.9); `unitLabel` z imeni
     (»X-Wing za številko 5« → »X-krilo za števko 5« pride v delu 2);
   - `index.html` – h3 ostane z imenom kot nadomestkom (odgovor 4), vpisano ime se
     zamenja z novim (»Skriti par (Hidden Pair)«, brez številke – ta je v `::before`);
   - `trening.css:34` – ločilo » · «.
5. `shared/zbirka.js` – `zbirkaPodatkiResevanja()` ureja `tehnike` po `redTehnike()`
   namesto po pogostosti (velja za kartico, izvoz in »Oceni zbirko«). Obstoječi zapisi
   se preuredijo ob naslednjem shranjevanju, izvoz jih lahko uredi že pri pisanju.
6. `shared/generator.js` (`STOPNJE_UGANK[].opis`) in `igra/index.html:171`, `:192` –
   nova imena tehnik v opisih stopenj (del 5.2, ki ostane).
7. `igra/index.html:180` – poved o oznakah (ločilo, enojčka).

**Testi:**
- `trening-tehnike.test.js`: primerjava h3 v HTML s `TEHNIKE_OPISI.ime` se zamenja s
  primerjavo z `imeTehnike()` (odgovor 4, dopolnitev 2):
  - za vsak par `[m, kljuc]` iz `[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]` (po točki 1
    imata oba seznama ključ motorja) velja
    `naslovi.get(m) === imeTehnike(kljuc)`; `naslovi` je obstoječa preslikava
    `data-mode` → besedilo `<h3>` iz `trening/index.html`;
  - ker je privzeta oblika `imeTehnike()` brez številke, ista enakost preveri tudi, da v
    HTML-naslovu ni številke (ta je samo v `data-stevilka`); test `imeTehnike()` posebej
    preveri, da privzeta oblika nima številke in ločila » · «;
  - da `trening.js` naslov res vpiše, se v testu ne preveri (`querySelector()` v
    `tests/dom-stub.js` vrne `null`) – ročni pregled.

  `MODES.name` ne obstaja več; nov test `imeTehnike()` (vsaka tehnika iz
  `ALL_TECHNIQUES` ima slovensko in angleško ime, privzeta oblika brez številke, oblika
  s številko, brez oklepaja, poskus, neznan ključ) in `redTehnike()`.
- `igra-ui.test.js`: oznaka koraka pri »Naslednji korak«, če jo kak test bere.
- `zbirka-zapis.test.js`: `zbirkaPodatkiResevanja()` ureja po vrstnem redu tehnik.
- `trening-tehnike.test.js:86–100` (izvoz): pričakovani vrstni red v izvozu (»Gol
  enojček 27, Skriti enojček 30, …« namesto po pogostosti).
- Novih testov za povzetek v reševalcu ni (ni ga v nadomestnem DOM-u) – ročni pregled.

### Del 2 – besedila: »števka«, spol »par«, »Pokaži«/»Skrij« (1.4, 1.3 spol, 1.7)

**Narejeno 2026-09-25, commit `694ea42`.** Testi: 252 (247 + 5 novih: dva v
`trening-tehnike.test.js` – besedila vaj ter sporočila `solve()` in `stepHint()` –,
trije v novem `besedila-html.test.js`). Odstopanja od opisa spodaj: številke vrstic so se
po delu 1 premaknile (mesta so bila poiskana znova); v točki 2 je ostalo samo
`trening/trening.js` »skrito paro« (drugo je uredil del 1); testa besedil preverjata tudi
angleška imena tehnik zunaj oklepaja (točka 5), v vajah samo polja za uporabnika (`desc`,
`unitLabel`, `namig`, `solutionMessage`); `trening-pomoc.test.js`,
`trening-enojcki.test.js`, `next-step.test.js` in `xy-wing.test.js` niso spremenjeni.
Swordfish se v dnevnikih ugank iz `docs/uganke.md` ne pojavi, zato njegovega sporočila
test ne pokrije – ročni pregled. Popravek iz pregleda: podtipa verige imata enako obliko,
oba z »vzorec« (»tvori vzorec Nebotičnik (Skyscraper, veriga ene števke)«).

Samo besedila za uporabnika; komentarji v kodi ostanejo (odgovor 6), tudi kjer
omenjajo »številko« v besedilu za uporabnika.

1. »številka« → »števka« (po `grep -n "številk"`; »številka tehnike« in »številka
   poteze« ostaneta):
   - `shared/engine.js:175`, `:256`, `:292` – sporočila korakov (skriti enojček, pari in
     trojice); vidijo jih reševalec, igra (3. stopnja pomoči) in trening;
   - `app/app.js:296`, `:344`, `:358`, `:363`, `:404`; `app/index.html:21`, `:40`, `:97`;
   - `trening/trening.js` (»Označena številka«, »dve številki«, povratne informacije –
     pribl. 15 besedil), `trening/generators.js:473`, `:565`, `:814` (`unitLabel`),
     `trening/index.html:36`, `:56`, `:71` (opisi kartic).
2. Spol: »očitna/skrita para« → »očitni/skriti par« v besedilih (`trening/trening.js:326`
   »skrito paro«, opisi kartic, `igra/index.html`, opisi stopenj). »Celica para« (W-Wing)
   je že prav.
3. »Prikaži« → »Pokaži« v reševalcu: `app/index.html:29`, `:60`, `app/app.js:238`,
   `:253`, `:261`, `:276`, `:334` (»Pokaži kandidate«/»Skrij kandidate«, »Pokaži korake
   reševanja«/»Skrij korake reševanja«). »Pokaži na mreži ▾«/»Skrij mrežo ▴« ostane.
   Trening (»Namig (drži)«, »Rešitev (drži)«) in igra ostaneta.
4. **Opisi kartic v `trening/index.html`** (dopolnitev 4): stara in angleška imena
   tehnik → nova slovenska imena, »številka« → »števka«, s slovnico (spol, sklon).
   Opisi se ne prepisujejo (to je faza 6), spremenijo se samo te besede:

   | Vrstica | Staro | Novo |
   |---|---|---|
   | 36 | Najdi dve **številki**, ki se pojavljata … | Najdi dve **števki**, ki se pojavljata … |
   | 56 | Najdi tri **številke**, ki se v enoti pojavljajo … | Najdi tri **števke**, ki se v enoti pojavljajo … |
   | 66 | **Razširjen X-Wing**: 3 vrstice × 3 stolpci. | **Razširjeno X-krilo**: 3 vrstice × 3 stolpci. |
   | 71 | Dve močni povezavi za isto **številko**: … | Dve močni povezavi za isto **števko**: … |
   | 71 | … zagotovo ta **številka** – izbrišeš jo … | … zagotovo ta **števka** – izbrišeš jo … |

   Ostane: »Aplikacija Oakever ta vzorec imenuje Skyscraper oziroma Zmaj z dvema
   vrvicama« (`:71`) in »… imenuje Krilo W« (`:76`) – to so imena v drugi aplikaciji,
   ne naša; njuno omembo prestavi faza 6 (5.1). Izrazi »pivot«, »krilo« (`:81`) in
   »par« (`:76`, `:86`) so že dogovorjeni. Naslovi h3 so urejeni v delu 1.
5. **Angleška imena tehnik v drugih besedilih** (dopolnitev 5): slovensko ime s
   pravim spolom in sklonom; v tekočem besedilu z malo začetnico (»za mečarico«).
   - (a) `unitLabel` v `trening/generators.js`: »X-krilo za števko 5«, »Mečarica za
     števko 5«, »Veriga ene števke: 5«, »XY-krilo: pivot in dve krili«, »W-krilo:
     celici para in celici povezave«, »Edinstveni pravokotnik: smrtonosni vzorec«.
   - (b) povratne informacije v `trening/trening.js`: »To še ni veljavno XY-krilo /
     W-krilo«, »… veljavna veriga ene števke«, »… veljaven edinstveni pravokotnik«,
     »Pravilno! (Vrstično X-krilo / Vrstična mečarica)«, »Ni pravo X-krilo / prava
     mečarica«, »Za mečarico rabiš …«, »Vse veljavne kombinacije za X-krilo /
     mečarico«. Ob tem še ujemanje dvojine: »Kateri dve števki tvorita skriti par« /
     »Katere tri števke tvorijo skrito trojico«, »Išči 2 števki, ki se … pojavljata« /
     »3 števke, ki se … pojavljajo«, »2 števki, ki sta … prisotni«.
   - (c) sporočila motorja (`shared/engine.js`): »tvori X-krilo«, »tvori mečarico«,
     »tvori W-krilo«; podtipa verige v obliki imen tehnik, z imenom tehnike v istem
     oklepaju kot doslej: »tvori vzorec Nebotičnik (Skyscraper, veriga ene števke)«, »tvori
     vzorec Zmaj z dvema vrvicama (Two-String Kite, veriga ene števke)«, splošni
     primer »tvori verigo ene števke (Turbot Fish)«. Enako imeni podtipov v razlagi
     `TEHNIKE_OPISI['turbot-fish']` (»Nebotičnik (Skyscraper)«, »Zmaj z dvema vrvicama
     (Two-String Kite)«). `turbot-fish.test.js` in `w-wing.test.js` se popravita
     skupaj z besedilom.
   - Notranje vrednosti ostanejo (`step.variant` = `'Skyscraper'` / `'Two-String
     Kite'`, ključi `ALL_TECHNIQUES`).

**Testi:**
- `trening-tehnike.test.js:151` (»števka« v `TEHNIKE_OPISI`) razširiti na: besedila v
  `MODES` in `unitLabel` iz vaj (nekaj vaj vsake tehnike), sporočila `solve()` na vseh
  ugankah iz `docs/uganke.md`, `stepHint()`; vzorec `/številk/i`.
- Nov preprost test nad HTML (`app/index.html`, `trening/index.html`,
  `igra/index.html`): brez »številk« razen dovoljenih zvez (»številke tehnik«,
  »številka poteze«) in brez »Prikaži«. Za `trening/index.html` še: opisi kartic
  (`<p>` v `.menu-card`) ne vsebujejo nobenega angleškega imena iz
  `TEHNIKE_OPISI[].anglesko` (»Skyscraper« ni med njimi, zato omemba Oakevra ostane).
  Preveri se **samo besedilo opisov**, ne naslovov h3 – ti imajo angleško ime v
  oklepaju (»X-krilo (X-Wing)«) in jih pokrije test iz dela 1.
- `next-step.test.js`, `w-wing.test.js`, `xy-wing.test.js`, `turbot-fish.test.js` –
  preveriti, ali kateri primerja besedilo sporočila; po iskanju noben ne vsebuje
  spremenjenih zvez, pričakujem brez sprememb.
- `trening-pomoc.test.js`, `trening-enojcki.test.js` – če preverjata besedila povratnih
  informacij (»Števka 9 je …« že uporablja »števka«).

### Del 3 – izvoz, dokumentacija, »osnovne« → »srednje«

**Narejeno 2026-09-25, commit `6cfdf66`.** Testi: 257 (252 + 5 novih v
`zbirka-zapis.test.js`: izvoz z eno postavko poskusa, imena brez vejice, uvoz novih imen in
starih ključev, presledki in velike/male črke, krožni izvoz–uvoz). Odstopanja od opisa
spodaj: izvoz je v `zbirkaTehnikeZaIzvoz()`, uvoz v `zbirkaKljucTehnike()` (ključi se
preslikajo sproti iz `ALL_TECHNIQUES` in `imeTehnike()`, ne iz posebne tabele kot
`STARE_TEZAVNOSTI`); uvoz tehnike po preslikavi uredi po `redTehnike()`. `docs/uganke.md:98`
ostane (»**Osnovno:**« tam pomeni glavno ugotovitev, ne raven). V `docs/uskladitev.md` sta
poleg točk iz opisa posodobljeni še 1.1 (»srednje« narejeno, ostanek v fazi 5), 5.1
(prestavljeno v fazo 6), 5.2 (samo imena tehnik – dva opisa v JS ostaneta odprta) in 5.6;
tabela faz ima 1.1 v fazi 5 in 5.1 v fazi 6. V `docs/tehnike.md` ima vrstica poskusa ime za
prikaz »Poskus in protislovje (Forcing Chain)«, kakršno da `imeTehnike()`.

1. Izvoz `**Tehnike:**` (odgovor 2): zapiše slovensko ime brez oklepaja
   (»Skriti par 2«), uvoz bere nova imena in stare ključe (preslikava kot
   `STARE_TEZAVNOSTI`). V shrambi ostanejo ključi. Angleško ime v izvozu ne gre, ker
   »XY-krilo (XY-Wing, Y-Wing)« vsebuje vejico, po kateri uvoz loči tehnike.
2. `docs/tehnike.md` – stolpec »Slovensko ime« z dogovorjenimi imeni, »številka« →
   »števka«, »osnovne« → »srednje« (`:163`, `:168–169`, `:194`, `:202–216`).
3. `docs/uganke.md:98`, `:167` – »osnovne« → »srednje«. Dnevniki v `docs/uganke.md`
   ostanejo s ključi (tako jih izpiše `solve()`).
4. `tests/generator.test.js:375–377` – zastarel komentar: »Iz nje dobi težavnost zapis
   primera, ki ga reševalec shrani v zbirko.« Primeri se od 2026-09-24 ne shranjujejo;
   težavnost primera se pokaže v kartici primera. Nov komentar: težavnost je zapisana
   ročno, zato test ob spremembi meril takoj pokaže, da je zastarela.
5. `CLAUDE.md` – imena tehnik v uvodu (seznam vaj v treningu), razpredelnica izrazov
   (»Očitni par«), opis `TEHNIKE_OPISI`/`imeTehnike()`; `docs/uskladitev.md` – stanje
   1.3, 1.4, 1.7, 5.4, 6.9 in tabela faz (faza 4 brez 1.1 in 5.1; 1.1 v fazo 5, 5.1 v
   fazo 6 – odgovor 5).

Dopolnitvi ob potrditvi dela 3 (2026-09-25):
- **Izvoz:** vse ključe poskusa (»Poskus in protislovje (forcing chain)« in stari zapisi s
  celico) sešteje v eno postavko »Poskus in protislovje N«, da se ime v vrstici ne ponovi.
- **Uvoz:** pri primerjanju imen odreže presledke (na robovih, več zaporednih šteje kot
  enega) in ne loči velikih in malih črk – velja za nova imena in stare ključe. Ista
  tehnika dvakrat (npr. dva stara zapisa poskusa) se sešteje, neznano ime ostane.

**Testi:** `zbirka-zapis.test.js` (izvoz z novimi imeni in eno postavko poskusa, nobeno
ime nima vejice, uvoz starih ključev in novih imen, presledki in velike/male črke, krožni
izvoz–uvoz), `trening-tehnike.test.js:86–100` (izvoz hrani imena).

### Del 4 – odpade (odgovor 5)

Barve oznak (1.1) gredo v fazo 5, opis kartice (5.1) v fazo 6. Spodnji opis ostane kot
izhodišče za tisti fazi.

Tabela faz v `docs/uskladitev.md` šteje v fazo 4 še 1.1, 5.1 in 5.2; naloga jih ne
omenja. Ostane:
- 1.1: raven kot polje tehnike (`ravenTehnike()`), `tagClass()` po ravneh (enake barve
  kot značke v treningu), poved o ravneh v Pomoči igre;
- 5.1: opis na kartici v treningu iz `TEHNIKE_OPISI` (novo polje `povzetek` ali
  `razlaga`), omemba Oakevra pri Turbot Fish in W-Wing.

Datoteke: `shared/engine.js`, `app/app.css`, `igra/igra.css`, `trening/index.html`,
`trening/trening.js`, `igra/index.html`; testi `trening-tehnike.test.js`,
`next-step.test.js` (če preverja `tagClass`).

## Datoteke po delih

| Datoteka | Del 1 | Del 2 | Del 3 | Del 4 (odpade) |
|---|---|---|---|---|
| `shared/engine.js` | ✓ | ✓ (sporočila) | | ✓ |
| `shared/zbirka.js` | ✓ (vrstni red) | | ✓ (izvoz/uvoz) | |
| `shared/generator.js` | ✓ (opisi) | ✓ | | |
| `app/app.js`, `app/index.html` | ✓ | ✓ | | |
| `app/app.css`, `igra/igra.css` | | | | ✓ |
| `igra/igra.js`, `igra/index.html` | ✓ | ✓ | | ✓ |
| `trening/trening.js`, `generators.js`, `index.html`, `trening.css` | ✓ | ✓ | | ✓ |
| `tests/trening-tehnike.test.js` | ✓ | ✓ | ✓ | ✓ |
| `tests/zbirka-zapis.test.js` | ✓ | | ✓ | |
| `tests/igra-ui.test.js` | ✓ (po potrebi) | | | |
| nov test besedil v HTML | | ✓ | | |
| `tests/generator.test.js` | | | ✓ (komentar) | |
| `docs/tehnike.md`, `docs/uganke.md`, `docs/uskladitev.md`, `CLAUDE.md` | ✓ (CLAUDE.md) | | ✓ | ✓ |

## Odprta vprašanja

1. **Številka v oznaki koraka.** Seznami (povzetek, Pomoč, trening) dobijo številko
   po nalogi. Predlagam jo tudi v oznaki koraka (reševalec, igra), ker igralec
   korak tako poveže z »tehnike: 4« pri uganki. Naslov koraka v reševalcu bi bil
   »Korak 5 · 4 · Skriti par (Hidden Pair)« – ali raje brez številke tehnike samo v
   naslovu?
2. **Izvoz `**Tehnike:**`.** Predlog: slovensko ime brez oklepaja, uvoz bere oboje.
   Alternativa: izvoz ostane s ključi (manj dela, `docs/uganke.md` in stari izvozi brez
   preslikave), a v datoteki za ljudi ostanejo angleška imena.
3. **Oklepaj v oznaki koraka.** »4 · Veriga ene števke (Turbot Fish)« je v oznaki koraka
   dolgo, predvsem v igri na telefonu. Ali v oznaki koraka samo slovensko ime (»4 ·
   Veriga ene števke«), angleško pa v namigu miške (`title`)?
4. **Naslov kartice v `trening/index.html`.** Če ga vpiše `trening.js`, je h3 v HTML
   prazen (brez JS ni imena). Predlog: v HTML ostane ime kot nadomestek, test preveri,
   da je enako `imeTehnike()` – tako HTML ostane berljiv, vir pa je en.
5. **Del 4.** Vključiti 1.1 in 5.1 v fazo 4 (kot pravi tabela faz) ali ju prestaviti v
   fazo 6 (pomoč)?
6. **Komentarji v kodi s »številka«** (pribl. 30, npr. »sidranje na številko«) – ostanejo
   (niso za uporabnika), ali jih zamenjam v delu 2, da je izraz tudi v kodi enoten?

## Odgovori na odprta vprašanja (2026-09-25)

1. **Številka v oznaki koraka:** da – v oznaki koraka (reševalec, igra) in v naslovu
   koraka ter lightboxu reševalca (»Korak 5 · 4 · Skriti par«).
2. **Izvoz `**Tehnike:**`:** samo slovensko ime (»Skriti par 2«). Uvoz bere nova imena
   in tudi stare ključe.
3. **Oznaka koraka:** »4 · Skriti par«, celo ime (»4 · Skriti par (Hidden Pair)«) v
   namigu miške (`title`).
4. **Naslov kartice v `trening/index.html`:** ostane kot nadomestek; test preveri, da
   se ujema z `imeTehnike()`.
5. **Del 4 odpade:** barve oznak (1.1) → faza 5, opis kartice (5.1) → faza 6.
6. **Komentarji v kodi** s »številka« se ne menjajo.

Potrjeno še:
- **Oblika imena:** »4 · Skriti par (Hidden Pair)«, »E1 · Očitni enojček (Naked
  Single)«.
- **Seznami tehnik** (povzetek v reševalcu, `tehnike` v zbirki in izvozu, Pomoč, trening)
  so po vrstnem redu tehnik (`redTehnike()`), ne po pogostosti.

### Posledice za obseg delov 1–3

Spremembe so že vpisane v opise delov zgoraj; tu so zbrane.

- **Del 1** (odgovori 1, 3, 4):
  - `imeTehnike()` dobi možnost `anglesko: false` (ime brez oklepaja) za oznako koraka;
    test jo pokrije.
  - Oznaka in naslov koraka v reševalcu ter oznaka koraka v igri dobijo kratko ime s
    številko in celo ime v atributu `title` – dodatno k prvotnemu predlogu, ki je imel v
    oznaki celo ime. Lightbox v reševalcu ima celo ime (dopolnitev 1).
  - `trening/index.html`: h3 ne ostane prazen – vpisana imena se zamenjajo z novimi
    (brez številke), `trening.js` jih ob zagonu prepiše iz `imeTehnike()`, test primerja
    oboje.
- **Del 2** (odgovor 6): komentarji v kodi se ne menjajo niti tam, kjer opisujejo
  besedilo za uporabnika – manj sprememb kot v prvotnem predlogu.
- **Del 3** (odgovori 2 in 5): izvoz kot v predlogu (brez spremembe obsega); pri
  posodobitvi `docs/uskladitev.md` se tabela faz popravi še za premik 1.1 v fazo 5 in
  5.1 v fazo 6.
- **Del 4** ne bo izveden v fazi 4.

### Dopolnitve (2026-09-25)

1. **Lightbox v reševalcu** pokaže celo ime »Korak 5 · 4 · Skriti par (Hidden Pair)«.
   Oznaka koraka in naslov nad malo mrežo ostaneta kratka, celo ime je v `title`.
   Razlog: v lightboxu je prostor, na dotik `title` ne deluje. Vpisano v tabelo »Kje se
   številka pokaže« in v del 1, točka 2.
2. **Kartice v treningu:** test primerja naslov v `trening/index.html` z
   `imeTehnike(kljuc)` brez možnosti (glej del 1, »Testi«). Možnost `stevilka: false`
   ni potrebna, ker je oblika brez številke privzeta; test `imeTehnike()` to privzeto
   obliko pokrije.
3. **Poskus in protislovje** (ob začetku dela 1): celo ime z veliko začetnico,
   »Poskus in protislovje (Forcing Chain)«, enako kot druga angleška imena; kratko ime
   (oznaka koraka) »Poskus in protislovje«, vedno brez številke. Ključ motorja
   (`'Poskus in protislovje (forcing chain)'` v dnevniku `solve()`) ostane nespremenjen.
4. **Opisi kartic v treningu** (dodatek k delu 2): v opisih kartic v
   `trening/index.html` se stara in angleška imena tehnik zamenjajo z novimi
   slovenskimi (s pravilno slovnico, npr. »Razširjen X-Wing« → »Razširjeno X-krilo«),
   »številka« → »števka«. Opisi se sicer ne prepisujejo – to je faza 6. Seznam mest je
   v delu 2, točka 4, test v delu 2, »Testi«.
5. **Angleška imena v besedilih treninga in motorja** (ob potrditvi dela 2): vključeni
   so `unitLabel` (a), povratne informacije v treningu (b) in sporočila motorja (c);
   »Veriga ene števke: 5«; podtipa »Nebotičnik (Skyscraper)« in »Zmaj z dvema
   vrvicama (Two-String Kite)«, oba z imenom »veriga ene števke«. Podrobno v delu 2,
   točka 5.
