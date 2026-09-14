# Naloga 02: Posnetek obnašanja reševalca (regresijski testi)

## Namen
Preden dodava nove tehnike, želim zapisati, kako reševalec deluje zdaj. Tako bom po vsaki spremembi lahko preveril, da se obstoječe obnašanje ni pokvarilo.
Obstoječe logike reševalca v tej nalogi ne spreminjaj.

## Koraki
1. Preveri, ali projekt že ima teste. Če jih nima, predlagaj najpreprostejši način za pisanje in zagon testov za kodo v `shared/` (brez nepotrebnih odvisnosti) in počakaj na potrditev.
2. Če v `shared/` še ni reševanja s sestopanjem (backtracking), ga dodaj kot ločen modul z dvema funkcijama:
   - reši uganko in vrni rešitev,
   - preštej rešitve (ustavi se pri 2 – dovolj je vedeti, ali je rešitev natanko ena).
   Ta modul bo potreben tudi pri tehniki Unique Rectangle.
3. Zberi 10–20 ugank, ki so že v projektu (primeri, vaje iz treninga): lahke, težke in vsaj nekaj takšnih, pri katerih se reševalec zdaj zatakne. Ugank ne sestavljaj sam. Če jih je premalo, mi povej in jih bom dodal.
4. Za vsako uganko shrani posnetek: zaporedje korakov (tehnika, vpisane števke, izločeni kandidati) in končno stanje (rešena / zataknjena).
5. Napiši teste:
   - **Posnetek:** zaporedje korakov, ki ga vrne reševalec, je enako shranjenemu.
   - **Pravilnost:** noben korak ne izloči kandidata, ki je pravilna števka te celice, in noben vpis se ne razlikuje od rešitve (rešitev izračunaj s sestopanjem).
   - **Enoličnost:** vsaka testna uganka ima natanko eno rešitev.
6. Zaženi teste in mi napiši rezultat ter ukaz, s katerim jih zaženem sam.
