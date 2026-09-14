# Naloga 00: Pregled po refaktoriranju in dopolnitev CLAUDE.md

Refaktoriranje v strukturo `shared/`, `app/`, `trening/` je končano. Preden začneva z novimi nalogami, preveri stanje.
V tej nalogi kode ne spreminjaj – urejaš samo `CLAUDE.md` (in `CLAUDE-predloga.md`, če obstaja).

## Koraki
1. Če v projektu obstaja `CLAUDE-predloga.md`, njeno vsebino združi v `CLAUDE.md` (pravila iz predloge ohrani) in predlogo izbriši.
2. Opiši mi novo strukturo: kaj je v posamezni mapi in katere so glavne datoteke.
3. Preveri, da se nobena datoteka ne sklicuje več na stare poti ali datoteke, ki ne obstajajo.
4. Preveri, ali je v `app/` ali `trening/` ostala logika tehnik, ki bi morala biti v `shared/`. Najdeno samo naštej – ne popravljaj.
5. Dopolni vse razdelke v `CLAUDE.md`, označene z [DOPOLNI], z dejanskim stanjem projekta. Ostalih pravil ne spreminjaj.
6. Pripravi kratek seznam za ročni preizkus obeh aplikacij (kaj naj kliknem in kaj moram videti), da potrdim, da vse deluje kot pred refaktoriranjem. Vključi vseh šest tehnik v treningu.
