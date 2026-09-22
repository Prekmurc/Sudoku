/* ==================== ZBIRKA UGANK (UI reševalca) ====================
   Samodejno shranjevanje ugank ob reševanju, seznam shranjenih ugank
   ("Naloži"/"Izbriši") ter gumba za izvoz/uvoz. Hramba in pretvorba v/iz
   Markdowna sta v shared/zbirka.js. */

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
// rešitvijo - tudi če je solve() ne reši do konca.
function zbirkaPoResevanju(givens, board, log, solutionCount) {
  if (solutionCount !== 1) { zbirkaSkrijVrstico(); return; }
  // Uganka, ki jo rešuješ v reševalcu, je vnesena ročno (naložena iz zbirke ima
  // zapis že od prej in izvora ne spremeni).
  const zapis = zbirkaShraniResitev(givens, board, log, { izvor: 'rocno' });
  saveRowEl.style.display = 'block';
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
    : `✓ Shranjeno v zbirko (rešeno delno: ${zapis.reseno} od 81 celic)`;
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

  libListEl.innerHTML = '';
  if (!zbirka.length) {
    const li = document.createElement('li');
    li.className = 'lib-empty';
    li.textContent = 'Zbirka je prazna. Uganka se shrani samodejno ob reševanju, če ima natanko eno rešitev.';
    libListEl.appendChild(li);
    return;
  }

  for (const z of zbirkaZaSeznam(zbirka)) {
    const li = document.createElement('li');
    const casi = zbirkaPrikazCasov(z);
    const tezavnost = z.tezavnost || 'težavnost ni določena';
    const dodana = zbirkaPrikazDatuma(z.dodano); // za sporočilo ob nalaganju in brisanju

    const glava = document.createElement('div');
    glava.className = 'lib-line';
    glava.textContent = [casi.dodana, tezavnost, zbirkaOpisIzvora(z)].filter(Boolean).join(' · ');
    glava.title = zbirkaNamigCasov(z);
    li.appendChild(glava);

    // Moje reševanje v igri (čas zadnje poteze in stanje) - svoja vrstica pod časom
    // dodajanja. Uganke, ki je še nisem igral, ta vrstica nima.
    if (casi.igranje) {
      const igranje = document.createElement('div');
      igranje.className = 'lib-casi';
      igranje.textContent = zbirkaVrsticaIgranja(z);
      igranje.title = zbirkaNamigCasov(z);
      li.appendChild(igranje);
    }

    const deli = [];
    if (zbirkaPrazno(z.koraki)) deli.push('ni podatkov o reševanju');
    else deli.push(zbirkaStKorakov(z.koraki));
    if (!zbirkaPrazno(z.ugibanje)) deli.push(z.ugibanje === 0 ? 'brez ugibanja' : `ugibal ${z.ugibanje}×`);
    // Podatek o programu, ne o mojem reševanju - zato je poimenovan enako kot v izvozu.
    if (!zbirkaPrazno(z.reseno) && z.reseno < 81) deli.push(`program rešil delno (${z.reseno}/81)`);
    const info = document.createElement('div');
    info.className = 'lib-info';
    info.textContent = deli.join(' · ');
    li.appendChild(info);

    if (z.opomba) {
      const opomba = document.createElement('div');
      opomba.className = 'lib-note';
      opomba.textContent = z.opomba;
      li.appendChild(opomba);
    }

    const gumbi = document.createElement('div');
    gumbi.className = 'lib-actions';
    const nalozi = document.createElement('button');
    nalozi.type = 'button';
    nalozi.textContent = 'Naloži';
    nalozi.addEventListener('click', () => {
      naloziDanosti(z.danosti, `Naložena uganka iz zbirke (${tezavnost}, dodana ${dodana}).`);
      zbirkaZapri();
    });
    const izbrisi = document.createElement('button');
    izbrisi.type = 'button';
    izbrisi.className = 'danger';
    izbrisi.textContent = 'Izbriši';
    izbrisi.addEventListener('click', () => {
      if (!confirm(`Izbrišem uganko, dodano ${dodana} (${tezavnost})?`)) return;
      zbirkaPisi(zbirkaBeri().filter(x => x.danosti !== z.danosti));
      if (zbirkaTrenutne === z.danosti) zbirkaSkrijVrstico();
      zbirkaStatus('Uganka je izbrisana.');
      zbirkaIzrisiSeznam();
      zbirkaOsveziGumb();
    });
    gumbi.append(nalozi, izbrisi);
    li.appendChild(gumbi);

    libListEl.appendChild(li);
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

zbirkaOsveziGumb();
