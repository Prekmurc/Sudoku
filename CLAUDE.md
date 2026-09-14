# Sudoku – navodila za Claude Code

## O projektu
Projekt ima dve aplikaciji s skupno kodo:

1. **Reševalec** (`app/`) – vnos uganke, reševanje po korakih z razlago, grafični prikaz mreže in kandidatov.
2. **Trening tehnik** (`trening/`) – vaje za tehnike: Očitna para, Skrita para, Očitna trojica, Skrita trojica, X-Wing, Swordfish.

Skupna koda (mreža, kandidati, logika tehnik) je v `shared/`.

## Struktura
[DOPOLNI: glavne mape in datoteke ter čemu služijo]

## Zagon in testi
- Zagon reševalca: [DOPOLNI]
- Zagon treninga: [DOPOLNI]
- Zagon testov: [DOPOLNI]
- Okolje: Windows 10, VS Code. Če projekt uporablja Python: uporabljaj conda okolje `py312_env` (Python 3.12). Pred zagonom preveri `python --version`; če ni 3.12, zaganjaj prek okolja (npr. `conda run -n py312_env python ...`).

## Arhitektura
- Logika tehnik (iskanje vzorcev, izločanje kandidatov) je samo v `shared/`. `app/` in `trening/` jo le kličeta – logike ne podvajaj.
- Vsaka tehnika ima definicijo na enem mestu: [DOPOLNI: kje]. Lastnosti, ki se med tehnikami razlikujejo (npr. kateri gumbi so vidni v treningu), so zapisane v tej definiciji – ne kot posebni primeri (`if tehnika == ...`) po kodi.
- Vrstni red tehnik v reševalcu: [DOPOLNI]. Nove tehnike dodajaj na konec, razen če izrecno zahtevam drugače.
- Zapis celic v razlagah: [DOPOLNI: kot je že v kodi, npr. V5S3 ali r5c3].

## Pravila dela
- Pred vsako večjo spremembo predlagaj načrt in počakaj na potrditev.
- Pri napakah najprej poišči vzrok in mi ga razloži, šele nato popravljaj.
- Spreminjaj samo tisto, kar zahteva naloga. Če opaziš drugo težavo, jo navedi v povzetku, ne popravljaj je.
- Obnašanja obstoječih tehnik ne spreminjaj brez izrecne zahteve.
- Novih knjižnic in odvisnosti ne dodajaj brez vprašanja.
- Sudoku ugank in testnih pozicij ne sestavljaj na pamet. Vsaka uganka mora biti preverjena s programom (natanko ena rešitev).
- Besedila v uporabniškem vmesniku so v slovenščini.
- Na koncu naloge napiši povzetek: spremenjene datoteke, kaj je narejeno, kaj naj ročno preverim.

## Izrazi
| Slovensko | Angleško |
|---|---|
| Očitna para / trojica | Naked Pair / Triple |
| Skrita para / trojica | Hidden Pair / Triple |
| kvadrat 3×3 | box |
| celica z dvema kandidatoma | bivalue cell |
| pivot, krilo (XY-Wing) | pivot, pincer |
| smrtonosni vzorec (Unique Rectangle) | deadly pattern |
