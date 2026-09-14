# Naloga 03: Nova tehnika XY-Wing

Zapis celic v tej datoteki: V = vrstica, S = stolpec (1–9).

## Definicija
- Tri celice, vsaka ima natanko dva kandidata.
- **Pivot** ima kandidata {X, Y}.
- **Krilo 1** ima {X, Z} in vidi pivot (ista vrstica, stolpec ali kvadrat 3×3).
- **Krilo 2** ima {Y, Z} in vidi pivot.
- X, Y in Z so tri različne števke.
- **Izločitev:** Z odstranimo iz vseh celic, ki vidijo obe krili (kril samih ne spreminjamo).
- **Zakaj:** pivot je X ali Y. Če je X, je krilo 1 enako Z; če je Y, je krilo 2 enako Z. Eno od kril je torej zagotovo Z, zato celica, ki vidi obe krili, ne more biti Z.

Opombe:
- Krili se lahko med seboj vidita ali ne – oboje je veljavno.
- Isti vzorec se najde dvakrat (zamenjani krili) – prijavi ga enkrat.
- Vzorec prijavi samo, če da vsaj eno izločitev.
- Pri iskanju celic, ki vidijo obe krili, upoštevaj vrstice, stolpce **in kvadrate** – napake se najpogosteje skrivajo pri kvadratih.

## Postopek
1. Preglej, kako so narejene obstoječe tehnike (npr. X-Wing in Swordfish) v `shared/`, `app/` in `trening/`, in mi opiši, kaj vse je treba dodati za novo tehniko. Predlagaj načrt. Kode še ne spreminjaj.
2. Po potrditvi delaj v treh delih in se po vsakem ustavi, da preverim:
   - A) logika v `shared/` in testi,
   - B) reševalec (`app/`),
   - C) trening (`trening/`).

## A) Logika v shared/
- Po zgledu obstoječih tehnik; vrača enak tip rezultata (celice vzorca + izločitve).
- Testi na ravni mreže kandidatov (ročno nastavljeni kandidati, ne cela uganka):
  - pravilen XY-Wing → natanko pričakovane izločitve,
  - primer s kvadrati: pivot V1S1 {1,2}, krilo V1S5 {1,3}, krilo V2S2 {2,3} → 3 se izloči iz V1S2, V1S3, V2S4, V2S5 in V2S6 (kjer je 3 kandidat), iz drugih celic pa ne,
  - krilo ne vidi pivota → ni zadetka,
  - krili nimata skupnega Z (npr. {1,3} in {2,4}) → ni zadetka,
  - ena od treh celic ima tri kandidate → ni zadetka,
  - vzorec brez možnih izločitev → ni zadetka.
- Testa pravilnosti in posnetkov iz naloge 02 morata še vedno uspeti.

## B) Reševalec
- XY-Wing dodaj v vrstni red reševanja takoj za Swordfish.
- Razlaga koraka v enakem slogu in zapisu celic kot pri obstoječih tehnikah. Primer vsebine (zapis prilagodi):
  »XY-Wing: pivot V5S5 {3,7}, krili V5S8 {3,9} in V2S5 {7,9}. Eno od kril je zagotovo 9, zato 9 izločimo iz V2S8.«
- Poudarki: pivot, krili in izločeni kandidati naj bodo jasno ločeni (uporabi obstoječe barve in sloge).
- Regresija: pri ugankah, ki jih je reševalec prej rešil do konca, mora zaporedje korakov ostati enako. Pri ugankah, kjer se je prej zataknil, mora biti staro zaporedje začetek novega. Posnetke posodobi šele, ko mi pokažeš razlike in jih potrdim.

## C) Trening
- Vajo dodaj po istem vzorcu kot pri obstoječih tehnikah (izbira, preverjanje, namigi).
- Gumb »Pokaži število kandidatov«: [DOPOLNI: prikaži / skrij] – nastavi z lastnostjo tehnike iz naloge 01.
- Kratek opis tehnike za uporabnika v slovenščini – osnutek mi pokaži pred vgradnjo.
- Pozicij za vaje ne sestavljaj na pamet. Napiši skripto, ki reši zbirko ugank in shrani pozicije, kjer je XY-Wing naslednji potrebni korak (nobena tehnika, ki je v vrstnem redu pred XY-Wing, ne da nobenega koraka). Vsaka shranjena pozicija mora izhajati iz uganke z natanko eno rešitvijo. Če ugank ni dovolj, mi povej.
