/* ==================== SHRAMBA IGRE ====================
   Shranjevanje igre v localStorage (ključ sudoku.igra.v1, po danostih). Brez DOM-a.
   Naloži se za shared/stanje.js (novaIgra, stanjeIgre, dodajPotezo) in
   shared/zbirka.js (IGRA_KLJUC, igreBeri, zbirkaKazalecZapisa - skupno z
   reševalcem, ki kaže stanje shranjenih iger). V sudoku.igra.v1 piše samo igra;
   trening je ne naloži. zacetnihPotez se ne shrani - igra ga ne uporablja. */

function igraZdaj() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Zapis za shrambo: { poteze, kazalec, znova, zacetek, nazadnje }. Kazalec pove,
// koliko potez je odigranih (ostale so v repu za "Ponovi").
function igraVZapis(igra, zacetek, cas) {
  return {
    poteze: igra.poteze.map(p => (p.celice ? { ...p, celice: [...p.celice] } : { ...p })),
    kazalec: igra.kazalec,
    znova: !!igra.znova,
    zacetek: zacetek || cas,
    nazadnje: cas,
  };
}

// Iz shranjenega zapisa zgradi igro. Poteze odigra eno za drugo in se ustavi
// pri prvi, ki ni dovoljena (poškodovan zapis) - vse do nje ostanejo. Koliko
// potez je pri tem izpadlo, pove polje `izpuscenih` (0, kadar je zapis cel):
// brez tega bi igralec napredek izgubil, ne da bi karkoli opazil. Polje ostane
// samo v pomnilniku - igraVZapis() ga ne shrani.
function igraIzZapisa(danosti, zapis) {
  const igra = novaIgra(danosti);
  const poteze = zapis && Array.isArray(zapis.poteze) ? zapis.poteze : [];
  let stanje = stanjeIgre(igra);
  for (const p of poteze) {
    if (!dodajPotezo(igra, p, stanje)) break;
    stanje = stanjeIgre(igra);
  }
  // Kazalec ostane tam, kjer je bil ob shranjevanju (npr. 2 od 3 po "Razveljavi").
  // Izjema je stanje "vse razveljavljeno": prazna mreža s skrito zgodovino je
  // videti kot izgubljen napredek, zato se vrnemo na konec zgodovine. Po "Začni
  // znova" (zapis.znova) prazna mreža ostane - tako je igralec hotel. Pravilo je v
  // shared/zbirka.js, ker po njem stanje shranjene igre kažeta tudi seznama zbirke.
  igra.znova = !!(zapis && zapis.znova);
  igra.kazalec = Math.min(zbirkaKazalecZapisa(zapis), igra.poteze.length);
  igra.izpuscenih = poteze.length - igra.poteze.length;
  return igra;
}

function igrePisi(s) {
  try {
    localStorage.setItem(IGRA_KLJUC, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}

// Shrani igro in jo označi kot zadnjo odprto. Vrne false, če brskalnik ne
// dovoli shranjevanja.
function igraShrani(igra) {
  const s = igreBeri();
  const prej = s.igre[igra.danosti];
  s.igre[igra.danosti] = igraVZapis(igra, prej && prej.zacetek, igraZdaj());
  s.zadnja = igra.danosti;
  return igrePisi(s);
}

// Shranjena igra za dane danosti ali null.
function igraNalozi(danosti) {
  const zapis = igreBeri().igre[danosti];
  return zapis ? igraIzZapisa(danosti, zapis) : null;
}

function igraZadnja() {
  const s = igreBeri();
  return s.zadnja && s.igre[s.zadnja] ? igraIzZapisa(s.zadnja, s.igre[s.zadnja]) : null;
}
