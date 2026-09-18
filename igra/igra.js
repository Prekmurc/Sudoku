/* ==================== IGRA: UI ====================
   Izris mreže in nizov gumbov, izbira celice, vpis/odstranjevanje kandidatov,
   razveljavi/ponovi, poudarjanje števke, zbirka in vnos nove uganke. Stanje in
   poteze so v stanje.js, hramba zbirke v ../shared/zbirka.js. */

const mrezaEl = document.getElementById('mreza');
const nizPoudariEl = document.getElementById('nizPoudari');
const nizVpisiEl = document.getElementById('nizVpisi');
const nizOdstraniEl = document.getElementById('nizOdstrani');
const razveljaviBtn = document.getElementById('razveljaviBtn');
const ponoviBtn = document.getElementById('ponoviBtn');
const zbrisiBtn = document.getElementById('zbrisiBtn');
const znovaBtn = document.getElementById('znovaBtn');
const stevecPotezEl = document.getElementById('stevecPotez');
const opisUgankeEl = document.getElementById('opisUganke');
const statusEl = document.getElementById('status');
const zbirkaBtn = document.getElementById('zbirkaBtn');
const razlogNizovEl = document.getElementById('razlogNizov');

let igra = null;        // { danosti, poteze, kazalec } - glej stanje.js
let stanje = null;      // stanjeIgre(igra), osveženo po vsaki spremembi
let izbrana = null;     // indeks izbrane celice ali null
let poudarjena = null;  // poudarjena števka (1-9) ali null
let sporocilo = null;   // { besedilo, razred } - enkratno sporočilo v kartici Uganka

/* ---------- gradnja mreže in nizov ---------- */

const celice = [];
for (let i = 0; i < 81; i++) {
  const el = document.createElement('div');
  el.className = 'celica';
  el.dataset.r = Math.floor(i / 9);
  el.dataset.c = i % 9;
  el.setAttribute('role', 'gridcell');
  el.addEventListener('click', () => {
    if (!igra) return;
    izbrana = i;
    izrisi();
  });
  mrezaEl.appendChild(el);
  celice.push(el);
}

function narediNiz(el, obKliku) {
  const gumbi = [];
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', () => obKliku(d));
    el.appendChild(b);
    gumbi.push(b);
  }
  return gumbi;
}

const gumbiPoudari = narediNiz(nizPoudariEl, d => {
  poudarjena = poudarjena === d ? null : d;
  izrisi();
});
const gumbiVpisi = narediNiz(nizVpisiEl, d => izvedi({ tip: 'vpis', celica: izbrana, stevka: d }));
const gumbiOdstrani = narediNiz(nizOdstraniEl, d => odstraniAliVrni(d));

gumbiVpisi.forEach((b, i) => { b.textContent = i + 1; });

/* ---------- poteze ---------- */

function izvedi(poteza) {
  if (!igra || !dodajPotezo(igra, poteza, stanje)) return;
  sporocilo = null;
  osvezi();
}

// Niz "Odstrani": trenutni kandidat se odstrani, ročno odstranjen se vrne.
function odstraniAliVrni(d) {
  if (!igra) return;
  const a = mozneAkcije(stanje, izbrana);
  const bit = 1 << d;
  if (a.odstrani & bit) izvedi({ tip: 'kandidat', celica: izbrana, stevka: d, odstrani: true });
  else if (a.vrni & bit) izvedi({ tip: 'kandidat', celica: izbrana, stevka: d, odstrani: false });
}

function zbrisiVpis() {
  izvedi({ tip: 'vpis', celica: izbrana, stevka: 0 });
}

// Po vsaki spremembi igre: novo stanje, shrani, izriši.
function osvezi() {
  stanje = stanjeIgre(igra);
  if (!igraShrani(igra)) {
    sporocilo = { besedilo: 'Igre ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', razred: 'err' };
  }
  izrisi();
}

razveljaviBtn.addEventListener('click', () => {
  if (!igra || !lahkoRazveljavi(igra)) return;
  razveljavi(igra);
  sporocilo = null;
  osvezi();
});
ponoviBtn.addEventListener('click', () => {
  if (!igra || !lahkoPonovi(igra)) return;
  ponovi(igra);
  sporocilo = null;
  osvezi();
});
zbrisiBtn.addEventListener('click', zbrisiVpis);
znovaBtn.addEventListener('click', () => {
  if (!igra || igra.kazalec === 0) return;
  if (!confirm('Začnem znova? Vse poteze bodo razveljavljene. Z »Ponovi« jih lahko vrneš, dokler ne narediš nove poteze.')) return;
  igra.kazalec = 0;
  sporocilo = { besedilo: 'Začel si znova - prejšnje poteze so na voljo s »Ponovi«.', razred: '' };
  osvezi();
});

/* ---------- izris ---------- */

function izrisi() {
  izrisiMrezo();
  izrisiNize();
  izrisiStanje();
}

function izrisiMrezo() {
  mrezaEl.classList.toggle('prazna', !igra);
  for (let i = 0; i < 81; i++) {
    const el = celice[i];
    el.innerHTML = '';
    el.className = 'celica';
    if (!igra) continue;
    const v = stanje.grid[i];
    if (v) {
      el.textContent = v;
      el.classList.add(igra.danosti[i] !== '0' ? 'dana' : 'vpis');
      if (v === poudarjena) el.classList.add('poud-stevka');
    } else {
      const k = stanje.kandidati[i];
      const mreza = document.createElement('div');
      mreza.className = 'kandidati';
      for (let d = 1; d <= 9; d++) {
        const s = document.createElement('span');
        s.className = 'kand';
        if (k & (1 << d)) {
          s.textContent = d;
          if (d === poudarjena) s.classList.add('poud');
        }
        mreza.appendChild(s);
      }
      el.appendChild(mreza);
    }
    if (izbrana !== null) {
      if (i === izbrana) el.classList.add('izbrana');
      else if (PEERS[izbrana].has(i)) el.classList.add('soseda');
    }
  }
}

function izrisiNize() {
  const manjka = igra ? seManjka(stanje) : new Array(10).fill(0);
  const a = igra ? mozneAkcije(stanje, izbrana) : mozneAkcije(null, null);
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << d;

    const p = gumbiPoudari[d - 1];
    p.innerHTML = `<span>${d}</span><span class="manjka">${igra ? manjka[d] : ''}</span>`;
    p.disabled = !igra;
    p.classList.toggle('aktiven', poudarjena === d);
    p.classList.toggle('koncana', !!igra && manjka[d] === 0);
    p.setAttribute('aria-pressed', poudarjena === d ? 'true' : 'false');
    p.title = igra ? `Poudari ${d} (še manjka: ${manjka[d]})` : '';

    const v = gumbiVpisi[d - 1];
    v.disabled = !(a.vpis & bit);
    v.title = v.disabled ? '' : `Vpiši ${d}`;

    const o = gumbiOdstrani[d - 1];
    o.textContent = d;
    o.classList.toggle('odstrani', !!(a.odstrani & bit));
    o.classList.toggle('vrni', !!(a.vrni & bit));
    o.disabled = !((a.odstrani | a.vrni) & bit);
    o.title = (a.odstrani & bit) ? `Odstrani kandidata ${d}` : (a.vrni & bit) ? `Vrni kandidata ${d}` : '';
    o.setAttribute('aria-label', o.title || String(d));
  }
  razlogNizovEl.textContent = razlogNizov(a);
  zbrisiBtn.disabled = !a.zbrisi;
  razveljaviBtn.disabled = !igra || !lahkoRazveljavi(igra);
  ponoviBtn.disabled = !igra || !lahkoPonovi(igra);
  znovaBtn.disabled = !igra || igra.kazalec === 0;
  stevecPotezEl.textContent = igra ? `poteza ${igra.kazalec} / ${igra.poteze.length}` : '';
}

// Pojasnilo pod nizoma, kadar za izbrano celico ni kaj vpisati ali odstraniti.
function razlogNizov(a) {
  if (!igra) return '';
  if (izbrana === null) return 'Izberi celico v mreži.';
  const ime = cellLabel(izbrana);
  const v = stanje.grid[izbrana];
  if (igra.danosti[izbrana] !== '0') return `${ime} je dana števka (${v}) – ne spreminja se.`;
  if (v) return `V ${ime} je tvoj vpis (${v}) – za spremembo ga najprej zbriši.`;
  if (!a.vpis) {
    return a.vrni ? `V ${ime} ni več kandidatov – vrni odstranjenega (↺) ali razveljavi.`
      : `V ${ime} ni več kandidatov – razveljavi zadnje poteze.`;
  }
  return '';
}

function izrisiStanje() {
  if (!igra) {
    opisUgankeEl.textContent = 'Ni odprte uganke.';
    nastaviStatus(sporocilo ? sporocilo.besedilo : 'Izberi uganko v zbirki ali vnesi novo (gumba zgoraj).', sporocilo ? sporocilo.razred : '');
    return;
  }
  opisUgankeEl.textContent = opisUganke(igra.danosti);
  if (sporocilo) nastaviStatus(sporocilo.besedilo, sporocilo.razred);
  else if (jeResena(stanje)) nastaviStatus('Uganka je rešena. Čestitam!', 'ok');
  else nastaviStatus(`Izpolnjenih ${steviloVpisanih(stanje)} od 81 celic.`, '');
}

function nastaviStatus(besedilo, razred) {
  statusEl.textContent = besedilo;
  statusEl.className = razred || '';
}

function opisUganke(danosti) {
  const danih = danosti.replace(/0/g, '').length;
  const z = zbirkaBeri().find(x => x.danosti === danosti);
  if (!z) return `Danih števk: ${danih}. Uganke ni v zbirki.`;
  const deli = [z.tezavnost || 'težavnost ni določena', `dodana ${zbirkaPrikazDatuma(z.dodano)}`, `danih števk: ${danih}`];
  return deli.join(' · ') + (z.opomba ? ` — ${z.opomba}` : '');
}

/* ---------- začetek igre ---------- */

// Odpre uganko: shranjena igra se nadaljuje, sicer se začne nova. Enoličnost
// mora biti preverjena prej (klicatelj).
function zacniIgro(danosti) {
  const shranjena = igraNalozi(danosti);
  igra = shranjena || novaIgra(danosti);
  izbrana = null;
  poudarjena = null;
  sporocilo = shranjena && shranjena.poteze.length
    ? { besedilo: `Nadaljuješ shranjeno igro (poteza ${shranjena.kazalec} / ${shranjena.poteze.length}).`, razred: '' }
    : null;
  osvezi();
}

/* ---------- tipkovnica ---------- */

function odprtDialog() {
  return document.querySelector('.dialog.odprt');
}

document.addEventListener('keydown', (e) => {
  const dialog = odprtDialog();
  if (dialog) {
    if (e.key === 'Escape') zapriDialog(dialog);
    return;
  }
  if (!igra) return;
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && !e.altKey && e.code === 'KeyZ') {
    e.preventDefault();
    (e.shiftKey ? ponoviBtn : razveljaviBtn).click();
    return;
  }
  if (ctrl && !e.altKey && e.code === 'KeyY') {
    e.preventDefault();
    ponoviBtn.click();
    return;
  }
  if (ctrl || e.altKey) return;

  const premik = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
  if (premik) {
    e.preventDefault();
    if (izbrana === null) izbrana = 0;
    else {
      const r = Math.min(8, Math.max(0, Math.floor(izbrana / 9) + premik[0]));
      const c = Math.min(8, Math.max(0, izbrana % 9 + premik[1]));
      izbrana = r * 9 + c;
    }
    izrisi();
    return;
  }

  // Fizična tipka (e.code), da Shift+števka deluje tudi na slovenski razporeditvi.
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (m) {
    e.preventDefault();
    const d = +m[1];
    if (e.shiftKey) odstraniAliVrni(d);
    else izvedi({ tip: 'vpis', celica: izbrana, stevka: d });
    return;
  }
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    zbrisiVpis();
    return;
  }
  if (e.key === 'Escape' && izbrana !== null) {
    izbrana = null;
    izrisi();
  }
});

/* ---------- dialogi ---------- */

function odpriDialog(el) { el.classList.add('odprt'); }
function zapriDialog(el) { el.classList.remove('odprt'); }

document.querySelectorAll('.dialog').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-zapri]')) zapriDialog(el);
  });
});

/* ---------- zbirka ---------- */

const zbirkaDialog = document.getElementById('zbirkaDialog');
const zbirkaSeznamEl = document.getElementById('zbirkaSeznam');
const zbirkaStatusEl = document.getElementById('zbirkaStatus');

function osveziGumbZbirke() {
  zbirkaBtn.textContent = `Zbirka (${zbirkaBeri().length})`;
}

function zbirkaStatusIgre(danosti, zapis) {
  if (!zapis) return { besedilo: 'nova', razred: '' };
  const { vpisi } = odigrajPoteze(danosti, zapis.poteze || [], zapis.kazalec || 0);
  const izpolnjenih = danosti.split('').filter((ch, c) => ch !== '0' || vpisi[c]).length;
  if (izpolnjenih === 81) return { besedilo: 'rešeno ✓', razred: 'reseno' };
  return { besedilo: `v teku: ${izpolnjenih}/81`, razred: 'v-teku' };
}

function izrisiZbirko() {
  const zbirka = zbirkaBeri();
  const igre = igreBeri().igre;
  zbirkaSeznamEl.innerHTML = '';
  if (!zbirka.length) {
    const li = document.createElement('li');
    li.className = 'prazno';
    li.textContent = 'Zbirka je prazna. Uganko dodaš z gumbom »Nova uganka« ali z reševanjem v reševalcu.';
    zbirkaSeznamEl.appendChild(li);
    return;
  }
  for (const z of zbirkaZaSeznam(zbirka)) {
    const li = document.createElement('li');
    const trenutna = igra && igra.danosti === z.danosti;
    if (trenutna) li.className = 'trenutna';
    const tezavnost = z.tezavnost || 'težavnost ni določena';

    const vrstica = document.createElement('div');
    vrstica.className = 'zb-vrstica';
    vrstica.textContent = `${zbirkaPrikazDatuma(z.nazadnje || z.dodano)} · ${tezavnost}`;
    li.appendChild(vrstica);

    const st = zbirkaStatusIgre(z.danosti, igre[z.danosti]);
    const info = document.createElement('div');
    info.className = 'zb-info';
    const oznaka = document.createElement('span');
    oznaka.className = st.razred;
    oznaka.textContent = st.besedilo;
    info.append(`danih: ${z.danosti.replace(/0/g, '').length} · `, oznaka, trenutna ? ' · trenutno odprta' : '');
    li.appendChild(info);

    if (z.opomba) {
      const op = document.createElement('div');
      op.className = 'zb-opomba';
      op.textContent = z.opomba;
      li.appendChild(op);
    }

    const gumbi = document.createElement('div');
    gumbi.className = 'zb-gumbi';
    const igraj = document.createElement('button');
    igraj.type = 'button';
    igraj.className = 'primary';
    igraj.textContent = igre[z.danosti] ? 'Nadaljuj' : 'Igraj';
    igraj.addEventListener('click', () => igrajIzZbirke(z.danosti));
    gumbi.appendChild(igraj);
    li.appendChild(gumbi);

    zbirkaSeznamEl.appendChild(li);
  }
}

function igrajIzZbirke(danosti) {
  // Uvožene uganke v zbirki niso nujno preverjene - shranjena igra pa je bila.
  if (!igraNalozi(danosti)) {
    const n = countSolutions(danosti);
    if (n !== 1) {
      zbirkaStatusEl.textContent = n === 0 ? 'Te uganke ni mogoče igrati: nima rešitve.'
        : n === 'unknown' ? 'Te uganke ni mogoče igrati: enoličnosti ni bilo mogoče preveriti v razumnem času.'
        : 'Te uganke ni mogoče igrati: ima več kot eno rešitev.';
      zbirkaStatusEl.className = 'dialog-status err';
      return;
    }
  }
  zapriDialog(zbirkaDialog);
  zacniIgro(danosti);
}

zbirkaBtn.addEventListener('click', () => {
  zbirkaStatusEl.textContent = '';
  zbirkaStatusEl.className = 'dialog-status';
  izrisiZbirko();
  odpriDialog(zbirkaDialog);
});

/* ---------- nova uganka ---------- */

const novaDialog = document.getElementById('novaDialog');
const novaMrezaEl = document.getElementById('novaMreza');
const novaNizEl = document.getElementById('novaNiz');
const novaStatusEl = document.getElementById('novaStatus');
const novaZacniBtn = document.getElementById('novaZacni');

const vnosi = [];
for (let i = 0; i < 81; i++) {
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'numeric';
  inp.autocomplete = 'off';
  inp.maxLength = 1;
  inp.dataset.r = Math.floor(i / 9);
  inp.dataset.c = i % 9;
  inp.setAttribute('aria-label', cellLabel(i));
  inp.addEventListener('focus', () => inp.select());
  inp.addEventListener('input', () => {
    const v = inp.value.replace(/[^1-9]/g, '').slice(-1);
    inp.value = v;
    oznaciKonflikte();
    if (v && i < 80) vnosi[i + 1].focus();
  });
  inp.addEventListener('keydown', (e) => {
    const cilj = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 9, ArrowUp: i - 9 }[e.key];
    if (cilj !== undefined && cilj >= 0 && cilj < 81) { e.preventDefault(); vnosi[cilj].focus(); }
    else if (e.key === 'Backspace' && !inp.value && i > 0) vnosi[i - 1].focus();
    else if (e.key === 'Enter') novaZacniBtn.click();
  });
  novaMrezaEl.appendChild(inp);
  vnosi.push(inp);
}

function vneseneDanosti() {
  return vnosi.map(inp => inp.value || '0').join('');
}

function oznaciKonflikte() {
  vnosi.forEach(inp => inp.classList.remove('konflikt'));
  let ok = true;
  for (const unit of ALL_UNITS) {
    const videne = {};
    for (const c of unit) {
      const v = vnosi[c].value;
      if (!v) continue;
      if (videne[v] !== undefined) {
        vnosi[c].classList.add('konflikt');
        vnosi[videne[v]].classList.add('konflikt');
        ok = false;
      } else videne[v] = c;
    }
  }
  return ok;
}

function novaStatus(besedilo, napaka) {
  novaStatusEl.textContent = besedilo;
  novaStatusEl.className = 'dialog-status' + (napaka ? ' err' : '');
}

novaNizEl.addEventListener('input', () => {
  const znaki = novaNizEl.value.replace(/[^0-9.]/g, '');
  if (znaki.length === 81) {
    znaki.split('').forEach((ch, i) => { vnosi[i].value = (ch === '0' || ch === '.') ? '' : ch; });
    oznaciKonflikte();
    novaStatus('Niz je vpisan v mrežo.');
  } else if (znaki.length) {
    novaStatus(`Veljavnih znakov v nizu: ${znaki.length} (potrebnih je 81).`, true);
  } else {
    novaStatus('');
  }
});

document.getElementById('novaPocisti').addEventListener('click', () => {
  vnosi.forEach(inp => { inp.value = ''; inp.classList.remove('konflikt'); });
  novaNizEl.value = '';
  novaStatus('');
  vnosi[0].focus();
});

novaZacniBtn.addEventListener('click', () => {
  const danosti = vneseneDanosti();
  if (!/[1-9]/.test(danosti)) { novaStatus('Najprej vnesi danosti.', true); return; }
  if (!oznaciKonflikte()) { novaStatus('Popravi rdeče označene celice - ista števka se ponavlja v vrstici, stolpcu ali bloku.', true); return; }
  novaStatus('Preverjam, ali ima uganka natanko eno rešitev ...');
  novaZacniBtn.disabled = true;
  setTimeout(() => {
    try {
      const n = countSolutions(danosti);
      if (n !== 1) {
        novaStatus(n === 0 ? 'Uganka nima rešitve - preveri danosti.'
          : n === 'unknown' ? 'Enoličnosti ni bilo mogoče preveriti v razumnem času, zato uganke ne morem ponuditi za igro.'
          : 'Uganka ima več kot eno rešitev - za igro potrebujem uganko z natanko eno rešitvijo.', true);
        return;
      }
      // Nova uganka gre v zbirko (enako kot ob "Reši" v reševalcu); obstoječega
      // zapisa ne spreminjamo.
      if (!zbirkaBeri().some(z => z.danosti === danosti)) {
        const { board, log } = solve(danosti);
        zbirkaShraniResitev(danosti, board, log);
        osveziGumbZbirke();
      }
      zapriDialog(novaDialog);
      zacniIgro(danosti);
    } catch (e) {
      novaStatus('Prišlo je do napake: ' + e.message, true);
    } finally {
      novaZacniBtn.disabled = false;
    }
  }, 30);
});

document.getElementById('novaBtn').addEventListener('click', () => {
  novaStatus('');
  odpriDialog(novaDialog);
  novaNizEl.focus();
});

/* ---------- zagon ---------- */

osveziGumbZbirke();
const zadnja = igraZadnja();
if (zadnja) {
  igra = zadnja;
  stanje = stanjeIgre(igra);
  sporocilo = zadnja.poteze.length
    ? { besedilo: `Nadaljuješ zadnjo igro (poteza ${zadnja.kazalec} / ${zadnja.poteze.length}).`, razred: '' }
    : null;
}
izrisi();
