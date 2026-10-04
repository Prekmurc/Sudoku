# Faza 6 – besedila oken Pomoč (za pregled)

Vsa besedila oken Pomoč v igri, reševalcu in treningu ter kartice »Kako« v igri po koraku c faze 6
(2026-10-04; načrt `docs/faza6-nacrt.md`) in po popravkih ročnega pregleda faze 6 (2026-10-04).
Pregledaš jih ob ročnem pregledu (`docs/rocni-test.md`, razdelek »Faza 6«).

Izpis je samodejen: besedilo je prebrano iz HTML (`igra/index.html`, `app/index.html`,
`trening/index.html`), seznami in povedi, ki jih izpiše JS (stopnje, poved o generatorju,
»Tehnike«), pa iz istih podatkov, kot jih uporabita `shared/pomoc.js` in `igra/igra.js`
(`STOPNJE_UGANK`, `OPIS_STROZJEGA_ISKANJA`, `TEHNIKE_OPISI`). Krepko = `<b>`, poševno = `<i>`,
`koda` = tipka ali znak v vnosu, `####` = podnaslov v razdelku.

Za besedila veljajo ista pravila kot za opise tehnik (korak b): glagol »izbriši« (niz »Izbriši
kandidata«), druga oseba ednine, števila z besedo, pari v zavitih oklepajih; poleg tega (ročni
pregled) »dane števke« (ne »danosti«, ne »začetne števke«), »kljukica« (ne »stikalo«) in brez
razvijalskih podrobnosti (lokalni strežnik, odpiranje iz datotek, ločena nit) – preverja
`tests/izrazi.test.js`. Okno in seznam »Tehnike« sta skupna (`shared/pomoc.js`, `shared/pomoc.css`).

Popravki po ročnem pregledu: »Kako igrati« in »Zbirka ugank« v igri sta razdeljena s podnaslovi po
tem, kar je na zaslonu; seznam stopenj je v Pomoči igre en sam, pod njim ena poved, v čem je
generator strožji; pri tehnikah je posledica svoj odstavek; trening ima razdelek »Označi izbrane«.

## Igra – okno Pomoč

### Kako igrati

#### Vpis in izbris

Klikni celico, nato števko v nizu **Vpiši** ali **Izbriši kandidata**. Omogočene so samo števke, ki so za izbrano celico smiselne: števke, ki je v vrstici, stolpcu ali bloku že vpisana, ni med kandidati, zato je ni mogoče vpisati. Dane števke se ne spreminjajo. **Zbriši vpis** zbriše tvoj vpis v izbrani celici.

Kandidati se računajo sami iz danih števk in tvojih vpisov. Kandidat, ki ga izbrišeš sam, ostane izbrisan, tudi če vmes zbrišeš vpis. Vrneš ga s ↺ v nizu **Izbriši kandidata** ali z **Razveljavi**.

#### Kandidati v celicah

S kljukico **Kandidati v celicah** v kartici **Prikaz** male števke v praznih celicah skriješ ali pokažeš. Igra kandidate računa naprej, zato **Naslednji korak** in **Preveri** delujeta enako, tvoji izbrisi kandidatov pa ostanejo. Brez zapisanih kandidatov rešiš lahke uganke (samo z enojčki) in uporabiš tehniki 1 in 2; od tehnike 3 naprej jih potrebuješ.

Ko so kandidati skriti, so v nizu **Vpiši** omogočene vse števke – števka, ki v celici ni mogoča, se ne vpiše, vrstica pod nizi pove zakaj. Niz **Izbriši kandidata** je takrat skrit. Nastavitev si brskalnik zapomni.

#### Več celic

Isto števko izbrišeš iz več celic hkrati s kljukico **več celic** (ali `Ctrl`+klik): klik celico doda v izbiro ali jo vzame iz nje, v nizu **Izbriši kandidata** so omogočene samo števke, ki so kandidat v vseh izbranih celicah. Izbira ostane, dokler je ne počistiš z `Esc`, izklopom kljukice ali navadnim klikom; **Razveljavi** vrne vse celice naenkrat. Ko so kandidati skriti, izbire več celic ni – kljukica je skrita skupaj z nizom.

#### Poudari števko

Niz **Poudari števko** nad mrežo ne spremeni mreže: obarva vse celice, kjer je števka kandidat ali je vpisana – ko so kandidati skriti, samo vpisane. Pod vsako števko je število mest, kjer še manjka. S kljukico **več hkrati** se poudarki seštevajo in vsaka števka dobi svojo barvo.

#### Razveljavi in ponovi

**Razveljavi** in **Ponovi** hodita po tvojih potezah, **Začni znova** razveljavi vse poteze (s **Ponovi** jih dobiš nazaj, dokler ne narediš nove poteze). Igra se shrani po vsaki potezi, skupaj z zgodovino, zato jo lahko kadar koli nadaljuješ.

Ko je uganka **rešena**, je mreža zaklenjena in samo za ogled: dobi zeleno obrobo, pod njo piše, da je zaklenjena, vpisovanje, brisanje, **Razveljavi** in **Ponovi** pa se izklopijo. Z **Začni znova** (vpraša za potrditev) jo lahko rešuješ še enkrat – v zbirki ostane zapisana kot rešena, s časom prve rešitve.

#### Tipkovnica

Puščice premikajo izbiro, `1`–`9` vpiše, `Shift`+`1`–`9` izbriše ali vrne kandidata (pri več celicah izbriše iz vseh; ko so kandidati skriti, ne naredi nič), `Backspace` zbriše vpis, `Ctrl`+`Z` / `Ctrl`+`Y` razveljavi / ponovi, `Esc` počisti izbiro.

### Pomoč pri reševanju

**Naslednji korak** pomaga postopno, v treh stopnjah, da ti ne pokaže več, kot potrebuješ:

1. ime tehnike – poskusiš jo najti sam;
2. **Pokaži več** – namig: enoto, pri nekaterih tehnikah tudi števko ali smer, nikoli pa celice odgovora;
3. **Pokaži rešitev** – razlago, označen korak na mreži in seznam dejanj.

Koraka igra nikoli ne izvede sama; vpišeš ali izbrišeš ga ti. Pri več dejanjih piše **Opravljeno: N od M** in izvedena dejanja se zeleno prečrtajo. Korak ostane prikazan, dokler ne opraviš vseh njegovih dejanj, dokler ga ne skriješ ali se ne vrneš pred stanje, v katerem je bil najden.

Barve na mreži: **jantarne** celice so vzorec tehnike, **rdeče prečrtani** kandidati so za izbris, **zelena** števka je za vpis. Označena so samo dejanja, ki jih še nisi opravil. Ko so kandidati skriti, **Pokaži rešitev** pokaže kandidate samo v celicah koraka; izbrisa brez kandidatov ni mogoče narediti – gumb **Vklopi kandidate** pod korakom jih vklopi, korak pa ostane prikazan.

Če imaš poudarjeno števko, ima prednost korak s to števko; sicer ima prednost števka prejšnjega koraka, tako kot v reševalcu. Če je na mreži napaka, koraka ni mogoče pokazati.

**Preveri** primerja mrežo z rešitvijo: zelena kljukica pomeni, da je vse v redu, rdeč križec pa, da je napaka – napačen vpis ali prazna celica, iz katere si izbrisal pravilnega kandidata. Igra pove, pri kateri potezi je napaka nastala, in ponudi vrnitev na stanje pred njo. Poteze ostanejo v **Ponovi**, zato nič ni izgubljeno.

### Seznami manjkajočih števk

Trije prikazi, ki jih vklopiš s kljukicami v kartici **Prikaz**: kvadratki desno od vrstic, pod stolpci in mala mreža 3×3 za bloke (polje je en blok, razporejeni so kot v veliki mreži).

V kvadratku so števke, ki v tej enoti še niso vpisane, na istih mestih kot kandidati v celici (1 levo zgoraj … 9 desno spodaj) – vedno na istem mestu, zato jo oko hitro najde. Polna enota ima prazen kvadratek. Kandidati in tvoji izbrisi na sezname ne vplivajo, štejejo samo vpisi. Poudarjena števka je v seznamih obarvana enako kot v mreži.

Stanje kljukic si brskalnik zapomni, privzeto so vsi seznami izklopljeni.

### Zbirka ugank

#### Tvoja zbirka in vgrajeni primeri

Uganke in napredek se hranijo v tem brskalniku, nič se ne pošilja nikamor. Zbirka je v igri in v reševalcu ista – isti seznam, isto število na gumbu **Zbirka**. Če jo spremeniš v drugem zavihku, se število in odprt seznam osvežita sama. Uganke v zbirko doda tudi reševalec, ko jih reši.

V oknu **Zbirka ugank** je zgoraj **tvoja zbirka**, na dnu pa zložen razdelek **Vgrajeni primeri** (v naslovu je število primerov) – odpreš ga s klikom na naslov. Sam je odprt, kadar je tvoja zbirka prazna ali kadar igraš enega od primerov. Vgrajeni primeri **niso del zbirke**: v zbirko se ne shranijo (tudi ne, ko jih rešiš v reševalcu ali so v uvoženi datoteki) in se ne štejejo, napredek pri njih pa se shrani prav tako.

#### Igraj, Nadaljuj, Poglej

Uganka, ki je še nisi začel, se odpre z **Igraj**, začeta z **Nadaljuj**, rešena pa s **Poglej** (pri njej ni kaj nadaljevati; po **Začni znova** je spet začeta, zato **Nadaljuj**) – napredek se shrani za vsako uganko posebej, po njenih danih števkah. Uganka, uvožena iz drugega brskalnika, se začne z **Igraj**, tudi kadar je v zbirki zapisana kot začeta ali rešena: njen napredek je ostal tam.

#### Uganka v seznamu

Vsaka uganka ima v seznamu tri vrstice, enako kot v reševalcu. V prvi so težavnost, izvor – **ustvaril generator** ali **ročni vnos** – in kdaj je bila uganka **dodana** (vgrajeni primer ima samo svoje ime; uganke, ki so bile v zbirki že prej, izvora nimajo, ker ga ni mogoče naknadno ugotoviti). V tretji so število danih števk, tehnike (glej spodaj) in število korakov reševalca; kadar reševalec uganke ni rešil do konca, še **program rešil delno (36/57)**. Uganka, ki je trenutno odprta, ima modro črto ob robu in oznako **trenutno odprta**.

V drugi vrstici sta tvoje **zadnje reševanje** in **stanje**: **nova** (še je nisi igral), **v teku (12/57)** (12 tvojih vpisov od 57 praznih celic) ali **rešena**. Kadar so izpolnjene vse prazne celice, a se vsaj ena števka ne ujema z rešitvijo, piše **v teku (57/57) · napaka** – napako poišči z gumbom **Preveri**. Uganka, ki si jo samo odprl in v njej še nisi naredil poteze, ostane **nova** (gumb **Igraj**); že izbrisan kandidat pa je poteza, zato je taka uganka **v teku (0/57)**. Pri rešeni uganki je v drugi vrstici **rešena 21. 9. 2026 ob 17:48** – zapis se takrat zamrzne, zato ostane čas prve rešitve. Če jo po **Začni znova** rešuješ še enkrat, piše **rešena 21. 9. 2026 ob 17:48 · znova v teku (12/57)**. Vgrajeni primeri kažejo ista stanja, a brez časa. Kdaj je uganko ocenil program in kako daleč je prišel (**Ocenjeno**, **Program rešil**), pokaže namig miške nad vrstico; oboje je tudi v izvozu.

Pri vsaki uganki piše oznaka, npr. **tehnike: 1, 3, 7 + poskus**. Številke so tehnike iz razdelka **Tehnike** spodaj (iste kot v treningu) – tiste, ki jih reševalec pri tej uganki potrebuje. Enojčki se ne izpišejo, ker jih potrebuje vsaka uganka. **+ poskus** pomeni, da se reševalec ni prebil samo s tehnikami in je moral poskusiti s protislovjem. Pri uganki brez teh podatkov piše »tehnike: ni podatkov«.

#### Nova uganka

V oknu **Nova uganka** ti uganko lahko **ustvari** program: izbereš stopnjo (**lahka**, **srednja**, **težka**, **zelo težka**) in počakaš – navadno gre za sekundo ali dve. Stopnjo določa najtežja raven tehnik, ki jih reševalec pri uganki uporabi, ko tehnike vedno poskuša po istem vrstnem redu, od najlažje navzgor; šteje se, koliko *različnih* tehnik uporabi, ne kolikokrat:

- **lahka** se reši samo z enojčki, torej brez zapisanih kandidatov
- **srednja** potrebuje srednje tehnike (1–6 – izločitve izven bloka in v bloku, pari in trojice)
- **težka** potrebuje natanko eno napredno tehniko (7–12 – X-krilo, mečarica, veriga ene števke, W-krilo, XY-krilo, edinstveni pravokotnik)
- **zelo težka** potrebuje vsaj dve različni napredni tehniki

Generator je strožji od ocene, ker ponudi samo uganke, ki so za svojo stopnjo tipične: pri srednji, težki in zelo težki zahteva vsaj dve različni srednji tehniki, pri težki pa še, da je vseh tehnik nad enojčki največ štiri.

Iskanje lahko kadar koli **prekineš**; če v 30 sekundah ne najde uganke, to pove in lahko poskusiš znova. Ustvarjena uganka se doda v zbirko s težavnostjo svoje stopnje (**Lahka**, **Srednja**, **Težka** ali **Zelo težka**) – težavnosti v zbirki so iste kot stopnje.

V istem oknu lahko vneseš tudi svojo uganko: dane števke vtipkaš v mrežo ali prilepiš niz. Igra se začne samo, če ima uganka natanko eno rešitev, in se doda v zbirko.

#### Izvozi in Uvozi

**Izvozi** zapiše vse uganke v datoteko Markdown, **Uvozi** jih doda obstoječim – pri isti uganki ohrani obstoječi zapis in dopolni le manjkajoče podatke. Tako zbirko preneseš na drugo napravo.

#### Izbriši in Izbriši vse

**Izbriši** pri uganki (vpraša za potrditev) jo izbriše iz zbirke skupaj z njenim shranjenim napredkom – v igri in v reševalcu enako. **Izbriši vse** ob gumbih **Izvozi**/**Uvozi** izbriše vso zbirko in ves shranjeni napredek – tudi napredek ugank, ki si jih izbrisal že prej (to naredi tudi, kadar je zbirka že prazna); vgrajeni primeri in napredek pri njih ostanejo. Izbrisa ni mogoče razveljaviti, zato zbirko prej izvozi. Če izbrišeš uganko, ki je odprta, se mreža izprazni.

#### Oceni zbirko

Gumb **Oceni zbirko** vsaki uganki v tvoji zbirki določi težavnost po istih stopnjah kot pri ustvarjanju (**Lahka**, **Srednja**, **Težka**, **Zelo težka**) in osveži številke tehnik. Ocena je širša od generatorja: stopnjo dobi vsaka uganka, tudi taka, ki nad enojčki zahteva eno samo tehniko. Uganka, ki potrebuje tehnike, ki jih reševalec še ne pozna (brez ugibanja je ne reši), dobi **Presega tehnike**; uganka, ki nima natanko ene rešitve (lahko pride z uvozom in je ni mogoče igrati), pa **Brez rešitve** ali **Več rešitev** – pri njej se popravi samo težavnost. Kadar enoličnosti ni bilo mogoče preveriti, ostane težavnost nespremenjena; razlog piše ob oceni. Ročno vneseni in uvoženi uganki brez težavnosti se ta izračuna sama, ko prideta v zbirko; starejše oznake popravi **Oceni zbirko**. Napredek se izpisuje sproti in ocenjevanje lahko **prekineš**; predlagane spremembe se izpišejo pri ugankah v seznamu (*staro → novo*) in se v zbirko zapišejo šele, ko jih potrdiš z **Zapiši ocene**. Datum dodajanja, opomba in tvoje reševanje ostanejo nedotaknjeni, pri spremenjenih ugankah pa se osveži datum **Ocenjeno**.

### Tehnike

Oznake so iste kot v treningu, kjer vsako tehniko lahko vadiš – v kratkih vajah ali v pravi uganki. Enojčka imata oznaki **E1** in **E2** namesto številke in se pri ugankah ne izpisujeta, ker ju potrebuje vsaka uganka. Z isto oznako je tehnika napisana tudi pri koraku v **Naslednji korak**, npr. **4 · Skriti par** (angleško ime pokaže namig miške).

*(tu je skupni razdelek »Tehnike« – glej konec dokumenta)*

## Igra – kartica »Kako« (stranski stolpec)

Klikni celico, nato števko v nizu **Vpiši** ali **Izbriši kandidata**. Omogočene so samo števke, ki so za izbrano celico smiselne – ko so kandidati skriti, v nizu **Vpiši** vse.

**Naslednji korak** pomaga postopno: ime tehnike, namig, nato razlaga in korak na mreži (sam ga ne izvede). **Preveri** pove, ali je med vpisi napaka.

Tipkovnica: puščice premikajo izbiro, `1`–`9` vpiše, `Shift`+`1`–`9` izbriše kandidata (ko so kandidati prikazani).

## Reševalec – okno Pomoč

### Kako deluje

Vtipkaj dane števke v mrežo (s puščicami se premikaš med celicami) ali prilepi niz 81 znakov v polje **Niz** – prazna celica je `0` ali `.`. Vgrajeno uganko izbereš v seznamu **Primer**. Če je ista števka dvakrat v vrstici, stolpcu ali bloku, se obarva rdeče.

**Reši** uganko reši po korakih, kot bi jo reševal človek: v vsakem koraku uporabi najlažjo tehniko, ki kaj najde. **Pokaži kandidate** pokaže števke, ki so v praznih celicah še mogoče glede na vrstico, stolpec in blok – brez tehnik. **Počisti** izprazni mrežo.

### Rešitev in koraki

Pod rešeno mrežo je povzetek: katere tehnike je reševalec uporabil in kolikokrat. Dana števka je temna, izpeljana modra. Dotik mreže jo poveča.

**Pokaži korake reševanja** našteje korake z razlago. **Pokaži na mreži** pri koraku pokaže malo mrežo z oznakami koraka (pomen barv je pod njo); dotik male mreže jo poveča. S kljukico ob koraku označiš, da si ga že naredil, **Počisti kljukice** jih pobriše.

### Zbirka ugank

Uganko z natanko eno rešitvijo reševalec po reševanju shrani v zbirko in ji izračuna težavnost; težavnost in opombo lahko spremeniš v kartici **Rešitev**. Zbirka je ista kot v igri – isti seznam in isto število na gumbu **Zbirka**. V oknu **Zbirka ugank** uganko odpreš ali izbrišeš, z **Izvozi** in **Uvozi** zbirko preneseš na drugo napravo. Vgrajeni primeri niso del zbirke.

### Težavnost

Težavnost uganke je raven njene najtežje tehnike:

- **lahka** se reši samo z enojčki, torej brez zapisanih kandidatov
- **srednja** potrebuje srednje tehnike (1–6 – izločitve izven bloka in v bloku, pari in trojice)
- **težka** potrebuje natanko eno napredno tehniko (7–12 – X-krilo, mečarica, veriga ene števke, W-krilo, XY-krilo, edinstveni pravokotnik)
- **zelo težka** potrebuje vsaj dve različni napredni tehniki

Uganka, ki potrebuje tehnike, ki jih reševalec še ne pozna (brez ugibanja je ne reši), dobi **Presega tehnike**; reševalec jo reši s poskusom in protislovjem.

### Tehnike

Oznake tehnik so iste kot v treningu in igri. Pri koraku je tehnika napisana z oznako, npr. **4 · Skriti par** (angleško ime pokaže namig miške).

*(tu je skupni razdelek »Tehnike« – glej konec dokumenta)*

## Trening – okno Pomoč

### Spoznaj in Vadi v uganki

Vsako tehniko vadiš na dva načina. **Spoznaj** (tudi klik na kartico) da kratke vaje, v katerih je vzorec tehnike vedno na mreži. **Vadi v uganki** da stanje prave uganke, v katerem je naslednji korak prav ta tehnika – poiščeš ga sam, kot med reševanjem.

Krog ima devet vaj. Zgoraj je rezultat, na koncu kroga povzetek; z **Nazaj na izbiro** izbereš drugo tehniko.

### Postopnost

Pri E1 in E2 v »Spoznaj« je v prvih treh vajah označena celica (E1) ali vrstica, stolpec ali blok skupaj s števko (E2), v naslednjih treh samo vrstica, stolpec ali blok, v zadnjih treh nič. V »Vadi v uganki« je v prvih šestih vajah označeno območje koraka – vrstica, stolpec, blok, števka, par ali pivot; v zadnjih treh iščeš po vsej uganki. Pravilen je tudi korak zunaj območja.

### Namig, Rešitev in Razlaga

V »Spoznaj« **Namig (drži)** in **Rešitev (drži)** pokažeta pomoč, dokler gumb držiš; v »Vadi v uganki« **Namig** in **Rešitev** odpreš s klikom in zapreš s **Skrij**. Vaja, pri kateri si pogledal namig ali rešitev, se ne šteje – ne med pravilne ne med napačne. Razdelek **Razlaga** pod nalogo (razlaga tehnike) ne šteje kot pomoč.

Izbrana celica je modra. Ob rešitvi in po pravilnem odgovoru so na mreži oznake koraka; kaj pomeni katera barva, pove legenda pod vajo.

### Označi izbrane

Pri 1–12 v »Vadi v uganki« si vzorec lahko označiš. Kljukica **več celic** je vklopljena, zato klik celico doda v izbiro. Izberi celice vzorca in klikni **Označi izbrane** (ali tipko `O`) – celice dobijo vijoličen črtkan okvir, izbira pa je spet prosta. Nato izberi celice, iz katerih izbrišeš kandidata, izbriši števko in pritisni **Preveri**.

Oznake so samo pripomoček: niso obvezne, **Preveri** jih ne gleda in ne štejejo kot pomoč. Če so vse izbrane celice že označene, **Označi izbrane** oznake pobriše, **Počisti oznake** pobriše vse. **Razveljavi** in **Začni znova** oznak ne spremenita, nova vaja jih pobriše.

### Tipkovnica

Pri E1 in E2: puščice premikajo izbiro, števka izbere števko za vpis (v »Vadi v uganki« jo predlaga), `Backspace` predlog pobriše, `Esc` počisti izbiro. Pri 1–12 v »Vadi v uganki«: `Shift`+števka izbriše ali vrne kandidata, `Ctrl`+`Z` / `Ctrl`+`Y` razveljavi / ponovi, `O` označi izbrane celice.

### Tehnike

Značka na kartici pove raven tehnike. Oznake so iste kot v igri in reševalcu – tam pri uganki piše npr. **tehnike: 1, 3, 7**.

*(tu je skupni razdelek »Tehnike« – glej konec dokumenta)*

## Skupni razdelek »Tehnike« (vsa tri okna)

Izpiše ga `izrisiTehnike()` v `shared/pomoc.js` – v igri, reševalcu in treningu enako. Pred njim je v vsakem oknu še poved, ki je zapisana zgoraj pri oknu. Razlaga in posledica sta dva odstavka.

Tehnike so v treh ravneh: lahke (E1, E2), srednje (1–6) in napredne (7–12) – v treningu jih kažejo značke na karticah. Stopnja uganke je raven njene najtežje tehnike.

- **E1 · Očitni enojček (Naked Single)** (lahka)

  Za prazno celico preglej njeno vrstico, stolpec in blok. Če je v njih skupaj vpisanih osem različnih števk, je v celici mogoča samo še deveta.

  To števko vpišeš v celico, ker nobena druga tam ni mogoča. Če imaš zapisane kandidate, je to celica z enim samim kandidatom.

- **E2 · Skriti enojček (Hidden Single)** (lahka)

  Poglej vrstico, stolpec ali blok – vsak od njih je enota – in števko, ki v enoti še ni vpisana. Za vsako prazno celico enote preveri, ali je ta števka že v vrstici, stolpcu ali bloku celice. Če ostane ena sama celica, kjer je števka mogoča, si našel skriti enojček.

  Števko vpišeš v to celico: v enoti mora biti, drugje pa ne more. Druge števke, ki bi bile v celici sicer mogoče, tam zato ne morejo biti.

- **1 · Izločitev izven bloka (Pointing Pair/Triple)** (srednja)

  Poglej blok in v njem eno števko. Če ležijo vse celice bloka, kjer je ta števka še kandidat, v isti vrstici (ali v istem stolpcu), si našel vzorec – dve ali tri celice. Smer: iz bloka v vrstico.

  V bloku mora biti števka v eni od teh celic, torej v tej vrstici. Zato v vrstici zunaj bloka ne more biti – tam jo izbrišeš. Pri stolpcu enako.

- **2 · Izločitev v bloku (Box-Line Reduction)** (srednja)

  Poglej vrstico (ali stolpec) in v njej eno števko. Če ležijo vse celice vrstice, kjer je ta števka še kandidat, v istem bloku, si našel vzorec – dve ali tri celice. Smer: iz vrstice v blok.

  V vrstici mora biti števka v eni od teh celic, torej v tem bloku. Zato drugje v bloku ne more biti – iz celic bloka zunaj vrstice jo izbrišeš. Pri stolpcu enako.

- **3 · Očitni par (Naked Pair)** (srednja)

  Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve celici, ki imata natanko ista dva kandidata {x, y} in nobenega drugega.

  V eni celici bo x, v drugi y – drugih možnosti nimata. Zato x in y v enoti ne moreta biti nikjer drugje: iz vseh drugih celic enote ju izbrišeš.

- **4 · Skriti par (Hidden Pair)** (srednja)

  Poglej enoto – vrstico, stolpec ali blok. Poišči v njej dve števki, ki sta mogoči samo v istih dveh celicah. V teh celicah so lahko še drugi kandidati, zato se par na prvi pogled ne vidi – je skrit.

  Obe števki morata biti v enoti, mogoči pa sta samo v teh dveh celicah – torej ju zasedeta. Za druge števke v teh dveh celicah ni prostora: iz obeh celic izbrišeš vse druge kandidate.

- **5 · Očitna trojica (Naked Triple)** (srednja)

  Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri celice, ki imajo skupaj samo tri različne kandidate {x, y, z}. Posamezna celica ima lahko vse tri ali samo dva od njih, npr. {x, y}, {y, z} in {x, z}.

  Tri celice potrebujejo tri različne števke, na voljo pa imajo samo x, y in z – torej jih zasedejo. Zato teh treh števk v enoti ni nikjer drugje: iz vseh drugih celic enote jih izbrišeš.

- **6 · Skrita trojica (Hidden Triple)** (srednja)

  Poglej enoto – vrstico, stolpec ali blok. Poišči v njej tri števke, ki so mogoče samo v istih treh celicah. Posamezna števka je lahko mogoča tudi samo v dveh od teh celic, v celicah pa so lahko še drugi kandidati – zato je trojica skrita.

  Vse tri števke morajo biti v enoti, mogoče pa so samo v teh treh celicah – torej jih zasedejo. Za druge števke v njih ni prostora: iz teh treh celic izbrišeš vse druge kandidate.

- **7 · X-krilo (X-Wing)** (napredna)

  Poišči dve vrstici, v katerih je števka mogoča samo v dveh celicah – v obeh vrsticah v istih dveh stolpcih. Te štiri celice so vogali pravokotnika. Enako deluje z zamenjanimi vlogami: dva stolpca, v katerih je števka mogoča samo v istih dveh vrsticah.

  V vsaki od obeh vrstic mora biti števka v enem od dveh vogalov. V istem stolpcu ne moreta biti obe, zato je ena v prvem, druga v drugem stolpcu – oba stolpca imata števko že v vogalih. Iz vseh drugih celic obeh stolpcev jo izbrišeš. Pri dveh stolpcih (vlogi zamenjani) jo enako izbrišeš iz obeh vrstic zunaj vogalov.

- **8 · Mečarica (Swordfish)** (napredna)

  Poišči tri vrstice, v katerih je števka mogoča samo v istih treh stolpcih. V posamezni vrstici je lahko mogoča v vseh treh ali samo v dveh od teh stolpcev. Enako deluje z zamenjanimi vlogami: trije stolpci, v katerih je števka mogoča samo v istih treh vrsticah.

  V vsaki od treh vrstic mora biti števka v enem od teh treh stolpcev, in to vsakič v drugem – torej ima vsak od treh stolpcev števko že v vzorcu. Iz vseh drugih celic teh treh stolpcev jo izbrišeš. Pri treh stolpcih (vlogi zamenjani) jo enako izbrišeš iz treh vrstic zunaj vzorca.

- **9 · Veriga ene števke (Turbot Fish)** (napredna)

  Za eno števko poišči dve povezavi. Povezava je vrstica ali stolpec, v katerem je števka mogoča samo v dveh celicah – to sta konca povezave. Povezavi sta lahko dve vrstici, dva stolpca ali vrstica in stolpec. En konec prve povezave mora videti en konec druge: celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Če sta povezavi dve vrstici (ali dva stolpca) in sta konca, ki se vidita, v istem stolpcu (ali vrstici), je to Nebotičnik (Skyscraper). Če sta povezavi vrstica in stolpec in sta konca, ki se vidita, v istem bloku, je to Zmaj z dvema vrvicama (2-String Kite).

  Konca, ki se vidita, ne moreta imeti števke oba. Če je ni na enem od njiju, je na drugem koncu njegove povezave – zato je števka vsaj na enem od preostalih dveh koncev. Iz celic, ki vidijo oba ta konca, jo izbrišeš.

- **10 · W-krilo (W-Wing)** (napredna)

  Poišči dve celici z natanko istima kandidatoma {a, b}, ki se ne vidita – celici se vidita, kadar sta v isti vrstici, stolpcu ali bloku. Nato poišči enoto (vrstico, stolpec ali blok), v kateri je b mogoč samo v dveh celicah, ki nista celici para. To je povezava: ena njena celica mora videti prvo celico para, druga drugo.

  Celici para ne moreta biti obe b: obe celici povezave bi takrat videli b in v povezavi b ne bi bil mogoč nikjer. Torej je vsaj v eni celici para a. Iz vseh celic, ki vidijo obe celici para, a izbrišeš.

- **11 · XY-krilo (XY-Wing, Y-Wing)** (napredna)

  Poišči pivot (osrednjo celico) z natanko dvema kandidatoma {x, y}. Nato poišči dve krili – celici z natanko dvema kandidatoma, ki ju pivot vidi (sta z njim v isti vrstici, stolpcu ali bloku): eno krilo ima {x, z}, drugo {y, z}. Krili si delita števko z, ki je pivot nima.

  Če je v pivotu x, krilo {x, z} ne more biti x, zato je z. Če je v pivotu y, je z v krilu {y, z}. V enem od kril je torej z – iz vseh celic, ki vidijo obe krili, z izbrišeš.

- **12 · Edinstveni pravokotnik (Unique Rectangle)** (napredna)

  Poišči štiri celice, ki so vogali pravokotnika: ležijo v dveh vrsticah in dveh stolpcih, vse skupaj pa v natanko dveh blokih. Trije vogali imajo natanko ista kandidata {x, y}, četrti pa ima poleg x in y še vsaj enega kandidata.

  Če bi bila v četrtem vogalu x ali y, bi v vseh štirih vogalih ostala samo x in y. Potem bi ju lahko po vogalih zamenjal in dobil drugo rešitev, uganka pa ima natanko eno. Zato četrti vogal ne more biti ne x ne y – oba izbrišeš iz njega.
