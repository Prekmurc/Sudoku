# Ročni test igre

Iz ročnega pregleda dela 5 (`docs/trening-v-uganki-nacrt.md`, »8. Ročni pregled igre po
izvedbi«). Tu je samo tisto, česar testi, posnetek igre (`tools/posnetek-igre.js`) in
brskalnik brez glave ne vidijo: CSS, prava tipkovnica (slovenska QWERTZ), odprta okna.

## Priprava

- Igra z lokalnega strežnika: iz korena projekta `python -m http.server`, nato
  `http://localhost:8000/igra/`.
- **Čisto okno je InPrivate** (Edge) – brez razširitev in brez stare shrambe.
- **Console (F12):** napake razširitev (npr. `bootstrap-autofill`, `VM…` brez datoteke
  projekta) ne štejejo. Šteje samo napaka z datoteko projekta (`igra.js`, `plosca.js`,
  `mreza.js`, `stanje.js` …).
- **Uganka mora biti nerešena** pri testih vnosa (točke 1–7, 9, 10): rešena uganka je
  zaklenjena in poteze ne delajo. Odpri novo uganko (»Nova uganka« ali vgrajeni primer)
  ali uporabi »Začni znova«.
- **Števec »poteza X / Y«** pod mrežo spremljaj ves čas: poteza »odstrani kandidata« je
  na mreži komaj vidna (izgine droben kandidat), števec pa se poveča za 1.

## Točke

Vse točke so v **igri** (`igra/`).

| # | Kaj narediti | Pričakovano |
|---|---|---|
| 1 | Klik prazne celice, ponoven klik iste celice, klik dane celice. | Prvi klik izbere celico (modra obroba), njena vrstica, stolpec in blok so sivi. Ponoven klik izbiro prekliče. Dana celica se izbere, niza sta onemogočena, vrstica pod nizi pove, da je števka dana. |
| 2 | Vpis z nizom »Vpiši« in s tipkovnico (vrstica števk in Numpad). Po vpisu puščica. Prva puščica brez izbire. Puščice na robu mreže. | Števka je vpisana, izbira se izklopi, števec +1. Puščica po vpisu nadaljuje od vpisane celice. Prva puščica brez izbire izbere V1S1. Na robu mreže se izbira ne premakne čez rob. |
| 3 | Shift+števka na izbrani prazni celici (slovenska razporeditev), še enkrat ista. Backspace in Delete na celici z vpisom. | Prvi Shift+števka odstrani kandidata, drugi ga vrne (vsakič števec +1). Backspace in Delete zbrišeta vpis. |
| 4 | Kljukica »več celic« ali Ctrl+klik: izberi več praznih celic, odstrani skupnega kandidata, nato Razveljavi. Escape; izklop kljukice. Puščice pri več izbranih. | Kandidat izgine iz vseh izbranih celic v eni potezi (števec +1), Razveljavi ga vrne vsem naenkrat. Escape in izklop kljukice počistita izbiro. Puščice pri več izbranih ne naredijo nič. |
| 5 | Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y (tipka z napisom Z oziroma Y na QWERTZ); gumba Razveljavi/Ponovi. | Ctrl+Z razveljavi, Ctrl+Shift+Z in Ctrl+Y ponovita – po napisu na tipki, ne po mestu. Števec »poteza X / Y« se ustrezno spreminja; gumba sta onemogočena na začetku/koncu zgodovine. |
| 6 | Niz »Poudari«: ena števka; kljukica »več hkrati« in pet števk; izklop. Deveti vpis poudarjene števke; ponoven vklop te števke. | Poudarjena števka ima modro podlago. Pri »več hkrati« barve po vrsti rumena, zelena, oranžna, modra, peta spet rumena. Ob izklopu kljukice ostane zadnja. Deveti vpis izklopi poudarek; ponoven vklop pokaže vseh devet mest. |
| 7 | Stikala seznamov Vrstice/Stolpci/Bloki (vsa tri), osvežitev strani (F5). Seznam vrstic na ozkem oknu (telefon ali pribl. 390 px). | Ob mreži in pod njo se pokažejo kvadratki manjkajočih števk, mala mreža 3×3 za bloke. Po F5 ostanejo stikala, kot so bila. Seznam vrstic zmanjša celice, mreža ostane na zaslonu brez vodoravnega drsnika. |
| 8 | Reši uganko do konca, nato »Začni znova« (preklic, nato potrditev), nato »Ponovi«. | Po zadnji potezi zelena obroba mreže, vrstica pod nizi v zelenem okvirju pove, da je mreža zaklenjena, »Začni znova« je poudarjen. »Začni znova« vpraša; po potrditvi je mreža prazna, »Ponovi« vrne poteze. |
| 9 | Odpri okno (Zbirka, Pomoč, Nova uganka) in pritiskaj števke, puščice, Shift+števka; Escape. V razdelku »Barve poudarka« tipkaj v hex polje. | Mreža se ne spremeni, števec ostane. Escape zapre okno. Tipkanje v hex polje ne vpisuje v mrežo. |
| 10 | Kartica »Pomoč«: »Naslednji korak« (ime tehnike → »Pokaži več« → »Pokaži rešitev«). Namerno napačen vpis, »Preveri«, »Vrni na stanje pred potezo N«. | Tri stopnje: ime, namig, razlaga z jantarnimi celicami vzorca, rdeče prečrtanimi kandidati in zeleno števko za vpis. »Preveri« pokaže rdeč križec in gumb; po vrnitvi je napaka odstranjena, poteze so v »Ponovi«. |

## Zakaj ročno

- **CSS** (barve, obrobe, senčenje, velikost celic na ozkem zaslonu): nadomestni DOM ga
  ne uporablja; brskalnik brez glave ga vidi samo na posnetku, ki ga je treba pogledati.
- **Tipkovnica QWERTZ:** posnetek in testi pošiljajo tipke po QWERTY, prava slovenska
  razporeditev ima drugačne pare `key`/`code` (Z/Y, Shift+števka).
- **Tipkovnica pri odprtem oknu:** nadomestni DOM nima `querySelector`, zato posnetek
  tega ne pokrije.
