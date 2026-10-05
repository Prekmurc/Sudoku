/* ==================== UI ==================== */

const grid = document.getElementById('inputGrid');
const inputs = [];
for (let i = 0; i < 81; i++) {
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'numeric';
  inp.autocomplete = 'off';
  inp.maxLength = 1;
  inp.dataset.index = i;
  inp.dataset.r = Math.floor(i / 9);
  inp.dataset.c = i % 9;
  grid.appendChild(inp);
  inputs.push(inp);
}

function focusCell(i) {
  if (i >= 0 && i < 81) inputs[i].focus();
}

inputs.forEach((inp, i) => {
  inp.addEventListener('focus', () => inp.select());
  inp.addEventListener('input', () => {
    // .slice(-1) vzame ZADNJI vtipkan znak - če je celica že imela številko
    // (npr. iz "Primer") in uporabnik vtipka novo, mora zmagati nova, ne stara.
    const v = inp.value.replace(/[^1-9]/g, '').slice(-1);
    inp.value = v;
    checkConflicts();
    const cs = document.getElementById('candSection');
    if (cs.style.display === 'block') renderCandidates();
    if (v) focusCell(i + 1);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !inp.value) { focusCell(i - 1); }
    else if (e.key === 'ArrowRight') focusCell(i + 1);
    else if (e.key === 'ArrowLeft') focusCell(i - 1);
    else if (e.key === 'ArrowDown') focusCell(i + 9);
    else if (e.key === 'ArrowUp') focusCell(i - 9);
  });
});

function currentGivens() {
  return inputs.map(inp => inp.value || '0').join('');
}

function checkConflicts() {
  inputs.forEach(inp => inp.classList.remove('conflict'));
  for (const unit of ALL_UNITS) {
    const seen = {};
    for (const c of unit) {
      const v = inputs[c].value;
      if (!v) continue;
      if (seen[v] !== undefined) {
        inputs[c].classList.add('conflict');
        inputs[seen[v]].classList.add('conflict');
      } else {
        seen[v] = c;
      }
    }
  }
  return !inputs.some(inp => inp.classList.contains('conflict'));
}

const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const solvedGridEl = document.getElementById('solvedGrid');
solvedGridEl.style.cursor = 'zoom-in';
solvedGridEl.addEventListener('click', () => {
  if (!lastSolve) return;
  openLightbox(el => renderGridInto(el, {
    snapshotGrid: lastSolve.grid, snapshotCand: [], eliminate: [], assign: [], cells: []
  }, 'min(48px, var(--mcs-povecave))'));
});
const summaryEl = document.getElementById('summary');

// Okno Pomoč (shared/pomoc.js, faza 6): težavnost (stopnje, ki jih uganka lahko dobi) in seznam tehnik.
izpisiStopnje(document.getElementById('pomocStopnje'), stopnjeZaPomoc(), 'opis');
izrisiTehnike(document.getElementById('pomocTehnike'));
ustvariPomoc(document.getElementById('pomocDialog'), [document.getElementById('pomocBtn')]);
let lastSolve = null; // { givens, grid, log } - napolnjeno po uspešnem "Reši"

const stepsCard = document.getElementById('stepsCard');
const stepsEl = document.getElementById('steps');
const lightbox = document.getElementById('lightbox');
const lightboxInner = document.getElementById('lightboxInner');

function openLightbox(renderFn) {
  lightboxInner.innerHTML = '';
  renderFn(lightboxInner);
  lightbox.style.display = 'block';
}
function closeLightbox() { lightbox.style.display = 'none'; }
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxScroll').addEventListener('click', (e) => {
  if (e.target.id === 'lightboxScroll') closeLightbox();
});
lightboxInner.addEventListener('click', closeLightbox);

// Ena skupna funkcija za izris mreže (uporabljena tudi za majhen prikaz v
// koraku, tudi za povečan prikaz v lightboxu, tudi za sam solvedGrid) -
// "stepLike" je bodisi pravi korak (s snapshotGrid/cand/eliminate/assign),
// bodisi "navidezen korak" za prikaz končne rešitve.
function renderGridInto(container, stepLike, cellSizePx) {
  container.innerHTML = '';
  container.className = 'mini-grid';
  container.style.setProperty('--mcs', cellSizePx);

  const elimSet = new Set(stepLike.eliminate.map(([c, d]) => c * 10 + d));
  const elimCells = new Set(stepLike.eliminate.map(([c]) => c));
  const assignMap = new Map(stepLike.assign.map(([c, d]) => [c, d]));
  const patternCells = new Set(stepLike.cells);

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'mcell';
    cell.dataset.r = Math.floor(i / 9);
    cell.dataset.c = i % 9;

    const gv = stepLike.snapshotGrid[i];
    if (gv !== 0) {
      cell.textContent = gv;
      cell.classList.add(lastSolve.givens[i] !== '0' ? 'given' : 'solved-num');
    } else if (assignMap.has(i)) {
      cell.textContent = assignMap.get(i);
      cell.classList.add('willset');
    } else {
      if (patternCells.has(i)) cell.classList.add('hl-source');
      else if (elimCells.has(i)) cell.classList.add('hl-elimonly');
      const cg = document.createElement('div');
      cg.className = 'mcandgrid';
      for (let d = 1; d <= 9; d++) {
        const s = document.createElement('span');
        const has = stepLike.snapshotCand[i] & (1 << d);
        if (!has) {
          s.className = 'mcand mcand-empty';
        } else {
          s.textContent = d;
          s.className = 'mcand' + (elimSet.has(i * 10 + d) ? ' mcand-elim' : '');
        }
        cg.appendChild(s);
      }
      cell.appendChild(cg);
    }
    container.appendChild(cell);
  }
}

// En napotek za povečavo - pod rešeno mrežo (app/index.html) in pod malo mrežo koraka.
const NAPOTEK_POVECAVA = 'Tapni mrežo za povečavo.';

// Legenda pod malo mrežo koraka (popravek po ročnem pregledu faze 6): isti izrazi kot v treningu
// in samo postavke, ki so na mreži - celice vzorca (jantarne, prazne celice vzorca brez vpisa),
// izbrisani kandidati (vzorček s prečrtano števko prvega izbrisa), vpis (vzorček s števko vpisa).
// Pogoji so isti kot v renderGridInto(): polna celica pokaže samo števko.
function legendaKoraka(s) {
  const prazna = i => s.snapshotGrid[i] === 0;
  const vpisi = s.assign.filter(([c]) => prazna(c));
  const vpisane = new Set(vpisi.map(([c]) => c));
  const legend = document.createElement('div');
  legend.className = 'mini-legend';
  const postavka = (razred, stevka, besedilo) => {
    const p = document.createElement('span');
    const sw = document.createElement('span');
    sw.className = razred;
    sw.textContent = stevka;
    p.append(sw, besedilo);
    legend.appendChild(p);
  };
  if (s.cells.some(c => prazna(c) && !vpisane.has(c))) postavka('sw sw-vzorec', '', 'celice vzorca');
  const izbris = s.eliminate.find(([c]) => prazna(c) && !vpisane.has(c));
  if (izbris) postavka('sw-stevka sw-izbris', String(izbris[1]), 'izbrisani kandidati');
  if (vpisi.length) postavka('sw-stevka sw-vpis', String(vpisi[0][1]), 'vpis');
  return legend;
}

function updateProgress() {
  const total = stepsEl.children.length;
  const done = stepsEl.querySelectorAll('li.done').length;
  document.getElementById('progress').textContent = `${done} / ${total} opravljeno`;
}
document.getElementById('resetChecks').addEventListener('click', () => {
  stepsEl.querySelectorAll('li').forEach(li => {
    li.classList.remove('done');
    li.querySelector('.done-check').checked = false;
  });
  updateProgress();
});

function renderStepsList() {
  const { log } = lastSolve;
  stepsEl.innerHTML = '';
  log.forEach((s, idx) => {
    // Oznaka in naslov koraka imata kratko ime s številko ("4 · Skriti par"), celo
    // ime je v namigu miške; lightbox ima celo ime (na dotik namiga ni).
    const kratko = imeTehnike(s.technique, { stevilka: true, anglesko: false });
    const celo = imeTehnike(s.technique, { stevilka: true });
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox" class="done-check">
                     <span class="tag ${tagClass(s.technique)}"></span><br>
                     <span class="idx">${idx + 1}.</span><span class="msg"></span>`;
    const tag = li.querySelector('.tag');
    tag.textContent = kratko;
    tag.title = celo;
    li.querySelector('.msg').textContent = s.message;
    const checkbox = li.querySelector('.done-check');
    checkbox.addEventListener('change', () => {
      li.classList.toggle('done', checkbox.checked);
      updateProgress();
    });

    if (s.snapshotGrid) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'mini-toggle';
      toggleBtn.textContent = 'Pokaži na mreži ▾';
      const miniContainer = document.createElement('div');
      miniContainer.className = 'mini-container';
      miniContainer.style.display = 'none';
      toggleBtn.addEventListener('click', () => {
        const open = miniContainer.style.display === 'block';
        if (open) {
          miniContainer.style.display = 'none';
          toggleBtn.textContent = 'Pokaži na mreži ▾';
          return;
        }
        if (!miniContainer.dataset.rendered) {
          const techTitle = document.createElement('div');
          techTitle.style.cssText = 'text-align:center;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:700;color:#3C4854;margin:0 0 8px;';
          techTitle.textContent = `Korak ${idx + 1} · ${kratko}`;
          techTitle.title = `Korak ${idx + 1} · ${celo}`;
          miniContainer.appendChild(techTitle);
          const gridDiv = document.createElement('div');
          renderGridInto(gridDiv, s, 'var(--mcs-koraka)'); // velikost iz širine koraka (app.css)
          gridDiv.addEventListener('click', () => {
            openLightbox(el => {
              const lbTitle = document.createElement('div');
              lbTitle.style.cssText = 'text-align:center;font-family:"JetBrains Mono",monospace;font-size:14px;font-weight:700;color:#3C4854;margin:0 0 10px;';
              lbTitle.textContent = `Korak ${idx + 1} · ${celo}`;
              el.appendChild(lbTitle);
              const lbGrid = document.createElement('div');
              renderGridInto(lbGrid, s, 'min(52px, var(--mcs-povecave))'); // največ 52 px, sicer iz okna (app.css)
              el.appendChild(lbGrid);
            });
          });
          miniContainer.appendChild(gridDiv);
          miniContainer.appendChild(legendaKoraka(s));
          const povecava = document.createElement('p');
          povecava.className = 'cand-hint mini-povecava';
          povecava.textContent = NAPOTEK_POVECAVA;
          miniContainer.appendChild(povecava);
          miniContainer.dataset.rendered = '1';
        }
        miniContainer.style.display = 'block';
        toggleBtn.textContent = 'Skrij mrežo ▴';
      });
      li.appendChild(toggleBtn);
      li.appendChild(miniContainer);
    }

    stepsEl.appendChild(li);
  });
  updateProgress();
}

document.getElementById('openStepsBtn').addEventListener('click', () => {
  if (!lastSolve) {
    statusEl.textContent = 'Najprej pritisni »Reši«.';
    statusEl.className = 'err';
    return;
  }
  const showing = stepsCard.style.display === 'block';
  const btn = document.getElementById('openStepsBtn');
  if (showing) {
    stepsCard.style.display = 'none';
    btn.textContent = 'Pokaži korake reševanja';
    return;
  }
  renderStepsList();
  stepsCard.style.display = 'block';
  btn.textContent = 'Skrij korake reševanja';
  // Namenoma BREZ scrollIntoView - vnosna mreža, kandidati in rezultat
  // naj ostanejo tam, kjer so; uporabnik sam odscrola, če želi.
});



// Skrije kartico "Koraki reševanja" (ob novi uganki bi kazala stare korake).
function skrijKorake() {
  stepsCard.style.display = 'none';
  document.getElementById('openStepsBtn').textContent = 'Pokaži korake reševanja';
}

document.getElementById('clearBtn').addEventListener('click', () => {
  inputs.forEach(inp => { inp.value = ''; inp.classList.remove('conflict', 'given-style'); });
  nizDanostiEl.value = '';
  nizStatus('');
  resultsEl.style.display = 'none';
  skrijKorake();
  document.getElementById('candSection').style.display = 'none';
  document.getElementById('candBtn').textContent = 'Pokaži kandidate';
  statusEl.textContent = '';
  statusEl.className = '';
  lastSolve = null;
  focusCell(0);
});

// Vpiše danosti (81 znakov, '0' ali '.' = prazna celica) v vnosno mrežo in
// skrije prejšnjo rešitev/kandidate - uporabljajo jo seznam "Primer", zbirka in
// polje Niz. Polje Niz se izprazni (razen ko danosti prihajajo iz njega), da v
// njem ne ostane niz druge uganke.
function naloziDanosti(danosti, sporocilo, { izNiza = false } = {}) {
  if (!izNiza) nizDanostiEl.value = '';
  nizStatus('');
  danosti.split('').forEach((ch, i) => { inputs[i].value = (ch === '0' || ch === '.') ? '' : ch; });
  checkConflicts();
  resultsEl.style.display = 'none';
  skrijKorake();
  document.getElementById('candSection').style.display = 'none';
  document.getElementById('candBtn').textContent = 'Pokaži kandidate';
  statusEl.textContent = sporocilo;
  statusEl.className = '';
  lastSolve = null;
}

// Polje Niz: 81 znakov (0 ali . = prazna celica) izpolni vso mrežo; branje in
// sporočila so skupna z igro (zbirkaNizDanosti() v ../shared/zbirka.js). Dokler niz
// ni cel, se mreža in glavni status ne spremenita - sporočilo je pod poljem.
const nizDanostiEl = document.getElementById('nizDanosti');
const nizStatusEl = document.getElementById('nizStatus');

function nizStatus(besedilo, napaka) {
  nizStatusEl.textContent = besedilo;
  nizStatusEl.className = napaka ? 'err' : '';
}

nizDanostiEl.addEventListener('input', () => {
  const niz = zbirkaNizDanosti(nizDanostiEl.value);
  if (niz.danosti) {
    const danih = niz.danosti.replace(/0/g, '').length;
    naloziDanosti(niz.danosti, `Niz je vpisan v mrežo – danih števk: ${danih}.`, { izNiza: true });
  } else {
    nizStatus(niz.sporocilo, niz.napaka);
  }
});

// Vgrajeni primeri (spustni seznam "Primer"): polje PRIMERI v ../shared/zbirka.js.

const exampleSelect = document.getElementById('exampleSelect');
PRIMERI.forEach((p, i) => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = p.ime;
  exampleSelect.appendChild(o);
});
exampleSelect.addEventListener('change', () => {
  const p = PRIMERI[exampleSelect.value];
  exampleSelect.selectedIndex = 0; // nazaj na "Primer", da gre isti primer izbrati znova
  if (!p) return;
  const danih = p.danosti.replace(/[.0]/g, '').length;
  naloziDanosti(p.danosti, `Naložen je ${p.ime} – danih števk: ${danih}.`);
});

const candBtn = document.getElementById('candBtn');
const candSection = document.getElementById('candSection');
const candidateGridEl = document.getElementById('candidateGrid');

function renderCandidates() {
  const givens = currentGivens();
  const b = new Board(givens);
  candidateGridEl.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'ccell';
    cell.dataset.r = Math.floor(i / 9);
    cell.dataset.c = i % 9;
    if (b.grid[i] !== 0) {
      cell.classList.add('given');
      cell.textContent = b.grid[i];
    } else {
      const cg = document.createElement('div');
      cg.className = 'candgrid';
      for (let d = 1; d <= 9; d++) {
        const s = document.createElement('span');
        s.className = 'cand' + ((b.cand[i] & (1 << d)) ? '' : ' hidden');
        s.textContent = d;
        cg.appendChild(s);
      }
      cell.appendChild(cg);
    }
    candidateGridEl.appendChild(cell);
  }
}

candBtn.addEventListener('click', () => {
  const showing = candSection.style.display === 'block';
  if (showing) {
    candSection.style.display = 'none';
    candBtn.textContent = 'Pokaži kandidate';
    return;
  }
  if (!checkConflicts()) {
    statusEl.textContent = 'Popravi rdeče označene celice, preden prikažem kandidate.';
    statusEl.className = 'err';
    return;
  }
  const filled = inputs.filter(inp => inp.value).length;
  if (filled === 0) {
    statusEl.textContent = 'Najprej vnesi vsaj nekaj danih števk.';
    statusEl.className = 'err';
    return;
  }
  renderCandidates();
  candSection.style.display = 'block';
  candBtn.textContent = 'Skrij kandidate';
  // Namenoma BREZ scrollIntoView - dosledno z ostalimi gumbi.
});

document.getElementById('solveBtn').addEventListener('click', () => {
  resultsEl.style.display = 'none';
  const filled = inputs.filter(inp => inp.value).length;
  if (filled === 0) {
    statusEl.textContent = 'Najprej vnesi vsaj nekaj danih števk.';
    statusEl.className = 'err';
    return;
  }
  if (!checkConflicts()) {
    statusEl.textContent = 'Popravi rdeče označene celice – ista števka se ponavlja v isti vrstici, stolpcu ali bloku.';
    statusEl.className = 'err';
    return;
  }
  statusEl.textContent = 'Rešujem …';
  statusEl.className = '';

  setTimeout(() => {
    const givens = currentGivens();
    let result;
    try {
      result = solve(givens);
    } catch (e) {
      statusEl.textContent = 'Prišlo je do napake pri reševanju: ' + e.message;
      statusEl.className = 'err';
      return;
    }
    const { board, log, solutionCount } = result;

    solvedGridEl.innerHTML = '';
    for (let i = 0; i < 81; i++) {
      const d = document.createElement('div');
      d.textContent = board.grid[i] || '';
      d.dataset.r = Math.floor(i / 9);
      d.dataset.c = i % 9;
      d.classList.add(givens[i] !== '0' ? 'was-given' : 'was-solved');
      solvedGridEl.appendChild(d);
    }

    const counts = {};
    log.forEach(s => { counts[s.technique] = (counts[s.technique] || 0) + 1; });
    // Po vrstnem redu tehnik (redTehnike), ne po pogostosti; število uporab na koncu,
    // da se ne zlepi s številko tehnike.
    summaryEl.innerHTML = Object.entries(counts)
      .sort((a, b) => redTehnike(a[0]) - redTehnike(b[0]))
      .map(([t, n]) => `<span>${imeTehnike(t, { stevilka: true })} – <b>${n}×</b></span>`)
      .join('');

    lastSolve = { givens, grid: board.grid.slice(), log };
    resultsEl.style.display = 'block';
    zbirkaPoResevanju(givens, board, log, solutionCount); // app/zbirka.js

    if (solutionCount === 0) {
      statusEl.textContent = 'Uganka nima rešitve – preveri vnesene števke.';
      statusEl.className = 'err';
    } else if (solutionCount === 'unknown') {
      statusEl.textContent = `Enoličnosti uganke ni bilo mogoče preveriti v razumnem času – tehnika ${imeTehnike('Unique Rectangle', { stevilka: true, anglesko: false })} zato ni bila uporabljena, prikazana rešitev morda ni edina.`;
      statusEl.className = 'warn';
    } else if (solutionCount !== 1) {
      statusEl.textContent = `Uganka nima natanko ene rešitve (najdenih je več kot ena) – prikazana rešitev je le ena od možnih, tehnika ${imeTehnike('Unique Rectangle', { stevilka: true, anglesko: false })} zato ni bila uporabljena.`;
      statusEl.className = 'warn';
    } else if (board.isSolved()) {
      statusEl.textContent = `Rešeno v ${log.length} korakih.`;
      statusEl.className = 'ok';
    } else {
      // Sem pridemo samo pri solutionCount === 1 - vnos je torej pravilen,
      // odpovedal je reševalec.
      const praznih = givens.split('').filter(ch => ch === '0').length;
      const reseno = board.grid.filter(v => v !== 0).length - (81 - praznih);
      statusEl.textContent = `Uganka ima eno rešitev, a je reševalec z razpoložljivimi tehnikami ni rešil do konca (rešil ${reseno}/${praznih} praznih celic).`;
      statusEl.className = 'warn';
    }
    // Namenoma NE skočimo avtomatsko na rezultat - vnosna mreža in
    // kandidati naj ostanejo vidni/dosegljivi brez posebnega scrollanja.
  }, 30);
});

focusCell(0);
