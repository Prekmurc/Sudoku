# Naloga 04: Nova tehnika Unique Rectangle (tip 1)

Zapis celic v tej datoteki: V = vrstica, S = stolpec (1–9).

## Definicija (tip 1)
- Štiri nerešene celice v ogliščih pravokotnika: ležijo v natanko dveh vrsticah, dveh stolpcih in **natanko dveh kvadratih 3×3**.
- Tri celice imajo natanko kandidata {a, b}.
- Četrta celica ima a, b in še vsaj enega kandidata.
- **Izločitev:** iz četrte celice odstranimo a in b.
- **Zakaj:** če bi bila četrta celica a ali b, bi v vseh štirih celicah ostala samo a in b. Takrat bi ju lahko v pravokotniku zamenjali in dobili drugo veljavno rešitev. Ker ima uganka natanko eno rešitev, to ni mogoče.

## Pomembno: tehnika predpostavlja enolično rešitev
- Unique Rectangle je veljaven samo, če ima uganka natanko eno rešitev. Pri uganki z več rešitvami lahko da napačne izločitve.
- V reševalcu lahko uporabnik vnese katerokoli uganko. Zato pred uporabo tehnike preštej rešitve (modul iz naloge 02, ustavi se pri 2). Dovolj je enkrat na uganko, ne pri vsakem koraku.
- Če rešitev ni natanko ena, se Unique Rectangle ne uporablja, uporabnik pa dobi jasno obvestilo (npr. »Uganka nima enolične rešitve – Unique Rectangle je izklopljen.«). Najprej preveri, ali reševalec kaj od tega že preverja ob vnosu.
- Pravokotnik, ki leži v štirih različnih kvadratih, ni smrtonosni vzorec – takšnega ne upoštevaj.

## Postopek
Enako kot pri nalogi 03: najprej pregled in načrt, nato trije deli – A) `shared/` in testi, B) reševalec, C) trening – z ustavitvijo po vsakem delu.

## A) Logika v shared/
- Testi na ravni mreže kandidatov:
  - pravilen tip 1: V1S1, V1S4 in V2S1 = {5,8}, V2S4 = {5,8,9} → iz V2S4 se izločita 5 in 8,
  - enak vzorec v štirih kvadratih (V1S1, V1S4, V4S1, V4S4) → ni zadetka,
  - dve celici imata dodatne kandidate → pri tipu 1 ni zadetka,
  - ena od štirih celic je že rešena → ni zadetka.
- Testa pravilnosti in posnetkov iz naloge 02 morata še vedno uspeti.

## B) Reševalec
- Unique Rectangle dodaj v vrstni red reševanja takoj za XY-Wing.
- Razlaga: navedi vse štiri celice, par {a, b} in na kratko, zakaj se kandidata izločita (enoličnost).
- Poudarki: štiri celice pravokotnika in izločeni kandidati.
- Test: uganka z več rešitvami → Unique Rectangle se ne uporabi in prikaže se obvestilo.
- Regresija kot pri nalogi 03.

## C) Trening
- Vaja po istem vzorcu kot ostale; gumb »Pokaži število kandidatov«: [DOPOLNI: prikaži / skrij].
- Kratek opis tehnike v slovenščini – osnutek mi pokaži pred vgradnjo.
- Pozicije za vaje poišči s skripto kot pri XY-Wing; vsaka mora izhajati iz uganke z natanko eno rešitvijo.

## Kasneje (ne v tej nalogi)
Tipi 2, 3, 4, 5 in 6 – vsak kot ločena naloga.
