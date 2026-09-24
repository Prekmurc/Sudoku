/* ==================== ZBIRKA UGANK (UI reševalca) ====================
   Samodejno shranjevanje ugank ob reševanju (vgrajeni primeri se ne shranijo),
   seznam shranjenih ugank ("Odpri"/"Izbriši") ter gumbi za izvoz/uvoz in
   "Izbriši vse". Hramba, brisanje in pretvorba v/iz
   Markdowna sta v shared/zbirka.js, kartica uganke v seznamu v
   shared/zbirka-ui.js (enaka kot v igri). */

const libraryBtn = document.getElementById('libraryBtn');
const libraryEl = document.getElementById('library');
const libListEl = document.getElementById('libList');
const libStatusEl = document.getElementById('libStatus');
const libFileEl = document.getElementById('libFile');
const saveRowEl = document.getElementById('saveRow');
const saveMsgEl = document.getElementById('saveMsg');
const saveFieldsEl = document.getElementById('saveFields');
const saveDifficultyEl = document.getElementById('saveDifficulty');
const saveNoteEl = document.getElementById('saveNote');

// Danosti uganke, ki jo trenutno kaže vrstica "Shranjeno v zbirko" v kartici Rešitev.
let zbirkaTrenutne = null;

TEZAVNOSTI.forEach(t => {
  const o = document.createElement('option');
  o.value = t;
  o.textContent = t;
  saveDifficultyEl.appendChild(o);
});

function zbirkaOsveziGumb() {
  libraryBtn.textContent = `Zbirka (${zbirkaBeri().length})`;
}

function zbirkaSkrijVrstico() {
  saveRowEl.style.display = 'none';
  zbirkaTrenutne = null;
}

function zbirkaOsveziVrstico() {
  const z = zbirkaTrenutne && zbirkaBeri().find(x => x.danosti === zbirkaTrenutne);
  if (!z) { zbirkaSkrijVrstico(); return; }
  saveDifficultyEl.value = z.tezavnost || PRIVZETA_TEZAVNOST;
  saveNoteEl.value = z.opomba || '';
}

// Kliče app.js po vsakem reševanju. Shrani se samo uganka z enolično
// rešitvijo - tudi če je solve() ne reši do konca. Vgrajeni primer se ne shrani
// (primeri niso del zbirke).
function zbirkaPoResevanju(givens, board, log, solutionCount) {
  if (solutionCount !== 1) { zbirkaSkrijVrstico(); return; }
  saveRowEl.style.display = 'block';
  if (zbirkaPrimerZa(givens)) {
    zbirkaTrenutne = null;
    saveMsgEl.textContent = 'Vgrajeni primer – v zbirko se ne shrani.';
    saveMsgEl.className = '';
    saveFieldsEl.style.display = 'none';
    return;
  }
  // Uganka, ki jo rešuješ v reševalcu, je vnesena ročno (naložena iz zbirke ima
  // zapis že od prej in izvora ne spremeni).
  const zapis = zbirkaShraniResitev(givens, board, log, { izvor: 'rocno' });
  if (!zapis) {
    zbirkaTrenutne = null;
    saveMsgEl.textContent = 'Uganke ni bilo mogoče shraniti v zbirko (brskalnik ne dovoli shranjevanja).';
    saveMsgEl.className = 'err';
    saveFieldsEl.style.display = 'none';
    return;
  }
  zbirkaTrenutne = givens;
  saveMsgEl.textContent = zapis.reseno === 81
    ? '✓ Shranjeno v zbirko'
    : `✓ Shranjeno v zbirko (program rešil ${zbirkaProgramResil(zapis)})`;
  saveMsgEl.className = '';
  saveFieldsEl.style.display = '';
  zbirkaOsveziVrstico();
  zbirkaOsveziGumb();
}

function zbirkaPosodobiTrenutno(polja) {
  if (!zbirkaTrenutne) return;
  const zbirka = zbirkaBeri();
  const z = zbirka.find(x => x.danosti === zbirkaTrenutne);
  if (!z) { zbirkaSkrijVrstico(); return; }
  Object.assign(z, polja);
  zbirkaPisi(zbirka);
}

saveDifficultyEl.addEventListener('change', () => zbirkaPosodobiTrenutno({ tezavnost: saveDifficultyEl.value }));
saveNoteEl.addEventListener('input', () => zbirkaPosodobiTrenutno({ opomba: saveNoteEl.value.trim() }));

function zbirkaStatus(besedilo, napaka) {
  libStatusEl.textContent = besedilo;
  libStatusEl.className = 'lib-status' + (napaka ? ' err' : '');
}

function zbirkaIzrisiSeznam() {
  const zbirka = zbirkaBeri();
  // Stanje uganke (nova / v teku / rešena) je iz shranjene igre, kadar jo igra ima,
  // enako kot v seznamu zbirke v igri (zbirkaStanjeUganke v shared/zbirka.js).
  const igre = igreBeri().igre;

  libListEl.innerHTML = '';
  if (!zbirka.length) {
    const li = document.createElement('li');
    li.className = 'prazno';
    li.textContent = 'Zbirka je prazna. Uganka se shrani samodejno ob reševanju, če ima natanko eno rešitev.';
    libListEl.appendChild(li);
    return;
  }

  // Trenutna je uganka, ki je v vnosni mreži (npr. pravkar odprta iz zbirke).
  const trenutne = currentGivens();
  for (const z of zbirkaZaSeznam(zbirka)) {
    const k = zbirkaKartica(z.danosti, z, zbirkaPovzetekZapisa(z.danosti, igre[z.danosti]));
    const tezavnost = z.tezavnost || 'težavnost ni določena';
    const dodana = zbirkaPrikazDatuma(z.dodano); // za sporočilo ob odpiranju in brisanju
    libListEl.appendChild(zbirkaIzrisiKartico(k, {
      trenutna: z.danosti === trenutne,
      gumbi: [
        { napis: 'Odpri', obKliku: () => {
          naloziDanosti(z.danosti, `Naložena uganka iz zbirke (${tezavnost}, dodana ${dodana}).`);
          zbirkaZapri();
        } },
        { napis: 'Izbriši', razred: 'danger', obKliku: () => {
          if (!confirm(zbirkaVprasanjeIzbrisi(z))) return;
          const ok = zbirkaIzbrisi(z.danosti);
          if (zbirkaTrenutne === z.danosti) zbirkaSkrijVrstico();
          zbirkaStatus(ok ? 'Uganka je izbrisana.' : 'Brisanja ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', !ok);
          zbirkaIzrisiSeznam();
          zbirkaOsveziGumb();
        } },
      ],
    }));
  }
}

function zbirkaOdpri() {
  zbirkaStatus('');
  zbirkaIzrisiSeznam();
  libraryEl.style.display = 'block';
}
function zbirkaZapri() { libraryEl.style.display = 'none'; }

libraryBtn.addEventListener('click', zbirkaOdpri);
document.getElementById('libClose').addEventListener('click', zbirkaZapri);
libraryEl.addEventListener('click', (e) => { if (e.target === libraryEl) zbirkaZapri(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && libraryEl.style.display === 'block') zbirkaZapri();
});

document.getElementById('libExport').addEventListener('click', () => {
  const izvoz = zbirkaIzvozi();
  if (izvoz.besedilo) zbirkaPrenesi(izvoz.besedilo);
  zbirkaStatus(izvoz.sporocilo, izvoz.napaka);
});

document.getElementById('libImport').addEventListener('click', () => libFileEl.click());
libFileEl.addEventListener('change', () => {
  const datoteka = libFileEl.files[0];
  libFileEl.value = ''; // da gre ista datoteka lahko znova skozi "change"
  if (!datoteka) return;
  datoteka.text().then(besedilo => {
    const uvoz = zbirkaUvozi(besedilo);
    zbirkaStatus(uvoz.sporocilo, uvoz.napaka);
    if (!uvoz.spremenjeno) return;
    zbirkaIzrisiSeznam();
    zbirkaOsveziGumb();
    zbirkaOsveziVrstico();
  }).catch(e => zbirkaStatus('Datoteke ni bilo mogoče prebrati: ' + e.message, true));
});

// "Izbriši vse": vsa zbirka in shranjene igre njenih ugank (primeri ostanejo).
document.getElementById('libDeleteAll').addEventListener('click', () => {
  const n = zbirkaBeri().length;
  if (!n) { zbirkaStatus('Zbirka je že prazna.'); return; }
  if (!confirm(zbirkaVprasanjeIzbrisiVse(n))) return;
  const { stevilo, ok } = zbirkaIzbrisiVse();
  zbirkaSkrijVrstico();
  zbirkaStatus(ok ? `Izbrisanih ugank: ${stevilo}.` : 'Brisanja ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', !ok);
  zbirkaIzrisiSeznam();
  zbirkaOsveziGumb();
});

// Zbirka ali igre so se spremenile v drugem zavihku (igra ali drug reševalec):
// števec, odprt seznam in vrstica "Shranjeno v zbirko" (uganka je morda izbrisana).
zbirkaObSpremembiDrugje(() => {
  zbirkaOsveziGumb();
  if (libraryEl.style.display === 'block') zbirkaIzrisiSeznam();
  if (zbirkaTrenutne) zbirkaOsveziVrstico();
});

zbirkaOsveziGumb();
