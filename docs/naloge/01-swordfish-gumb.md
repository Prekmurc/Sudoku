# Naloga 01: Popravek – gumb »Pokaži število kandidatov« pri Swordfish

## Težava
V aplikaciji Trening se pri tehniki Swordfish prikaže gumb »Pokaži število kandidatov«. Pri Swordfish se ta gumb ne sme prikazati – niti kot onemogočen.

## Koraki za ponovitev
1. Odpri Trening.
2. Izberi tehniko Swordfish.
3. [DOPOLNI: npr. označi kandidate in klikni »Preveri«]
4. Dejansko: gumb »Pokaži število kandidatov« je viden.
   Pričakovano: gumba ni.

## Postopek
1. Poišči, kje in kako se odloča o prikazu tega gumba, in mi razloži, zakaj se pojavi pri Swordfish. Kode še ne spreminjaj.
2. Preveri tudi te scenarije:
   - menjava tehnik (npr. Očitna para → Swordfish → Očitna para → Swordfish),
   - Swordfish, izbran takoj po zagonu aplikacije,
   - nova vaja Swordfish po končani prejšnji.
   Pogost vzrok je, da se vidnost gumba nastavi ob prikazu, ob menjavi tehnike ali vaje pa se ne ponastavi.
3. Predlagaj popravek. Vidnost gumba naj določa ena lastnost v definiciji vsake tehnike (npr. `prikaziSteviloKandidatov`; ime prilagodi obstoječim konvencijam), ne poseben primer za Swordfish. Če takšna lastnost že obstaja, popravi le napačno vrednost ali napačno preverjanje.
4. Po moji potrditvi izvedi popravek.

## Merila za uspeh
- Pri Swordfish gumb ni viden v nobenem od zgornjih scenarijev.
- Pri vseh drugih tehnikah je vidnost gumba enaka kot prej. Pred popravkom in po njem mi izpiši tabelo: tehnika → gumb viden (da/ne).
- Spremembe se nanašajo samo na prikaz gumba.
