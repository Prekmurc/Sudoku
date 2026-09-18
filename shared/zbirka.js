/* ==================== ZBIRKA UGANK (skupna koda) ====================
   Hramba zbirke ugank v localStorage tega brskalnika, podatki ob reševanju ter
   izvoz/uvoz v datoteko Markdown v enaki obliki kot docs/uganke.md. Uganke se
   ločijo po 81-znakovnem nizu danosti (interno '0' = prazna celica, v datoteki '.').
   Brez DOM-a - uporabljata jo app/zbirka.js (UI zbirke v reševalcu) in igra/.
   Naloži se za shared/engine.js (uporablja ALL_UNITS). */

const ZBIRKA_KLJUC = 'sudoku.zbirka.v1';
const TEZAVNOSTI = ['Začetnik', 'Preprosto', 'Srednje', 'Težko', 'Ekspert', 'Ekstrem', 'Drugo'];
const PRIVZETA_TEZAVNOST = 'Ekstrem';
// Polja zapisa v stalnem vrstnem redu (tudi vrstni red pri uvozu/dopolnjevanju).
const ZBIRKA_POLJA = ['danosti', 'tezavnost', 'dodano', 'nazadnje', 'reseno', 'koraki', 'ugibanje', 'tehnike', 'opomba'];

/* ---------- pomožne ---------- */

function zbirkaZdaj() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// '2026-09-15 14:32' -> '15. 9. 2026'
function zbirkaPrikazDatuma(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${+m[3]}. ${+m[2]}. ${m[1]}` : '—';
}

function zbirkaStKorakov(n) {
  const r = n % 100;
  const beseda = r === 1 ? 'korak' : r === 2 ? 'koraka' : (r === 3 || r === 4) ? 'koraki' : 'korakov';
  return `${n} ${beseda}`;
}

function zbirkaPrazno(v) {
  return v === null || v === undefined || v === '';
}

function zbirkaBrezKonfliktov(danosti) {
  for (const unit of ALL_UNITS) {
    const seen = new Set();
    for (const c of unit) {
      const v = danosti[c];
      if (v === '0') continue;
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  return true;
}

/* ---------- hramba ---------- */

function zbirkaBeri() {
  try {
    const a = JSON.parse(localStorage.getItem(ZBIRKA_KLJUC) || '[]');
    return Array.isArray(a) ? a : [];
  } catch (e) {
    return [];
  }
}

function zbirkaPisi(zbirka) {
  try {
    localStorage.setItem(ZBIRKA_KLJUC, JSON.stringify(zbirka));
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------- shranjevanje ob reševanju ---------- */

// Podatki iz dnevnika solve(). Psevdo-koraka 'OBSTALO'/'NAPAKA' (reševalec
// se je ustavil) nista pravi koraki, zato ju ne štejemo.
function zbirkaPodatkiResevanja(board, log) {
  const pravi = log.filter(s => s.technique !== 'OBSTALO' && s.technique !== 'NAPAKA');
  const stevci = {};
  pravi.forEach(s => { stevci[s.technique] = (stevci[s.technique] || 0) + 1; });
  return {
    reseno: board.grid.filter(v => v !== 0).length,
    koraki: pravi.length,
    ugibanje: pravi.filter(s => s.technique.startsWith('Poskus in protislovje')).length,
    tehnike: Object.entries(stevci).sort((a, b) => b[1] - a[1]),
  };
}

// Nova uganka dobi privzeto težavnost; pri že shranjeni se posodobijo samo
// datum zadnjega reševanja in izračunani podatki (težavnost/opomba ostaneta).
// Vrne shranjeni zapis ali null, če brskalnik ne dovoli shranjevanja.
function zbirkaShraniResitev(givens, board, log) {
  const zbirka = zbirkaBeri();
  const cas = zbirkaZdaj();
  const podatki = zbirkaPodatkiResevanja(board, log);
  let zapis = zbirka.find(z => z.danosti === givens);
  if (zapis) {
    Object.assign(zapis, podatki, { nazadnje: cas });
    if (!zapis.tezavnost) zapis.tezavnost = PRIVZETA_TEZAVNOST;
  } else {
    zapis = { danosti: givens, tezavnost: PRIVZETA_TEZAVNOST, dodano: cas, nazadnje: cas, ...podatki, opomba: '' };
    zbirka.push(zapis);
  }
  return zbirkaPisi(zbirka) ? zapis : null;
}

/* ---------- izvoz v Markdown ---------- */

// Urejeno po datumu dodajanja (stalen), da se nove uganke dodajajo na konec
// datoteke in so razlike v gitu majhne.
function zbirkaVMarkdown(zbirka) {
  const urejena = zbirka.slice().sort((a, b) =>
    (a.dodano || '').localeCompare(b.dodano || '') || a.danosti.localeCompare(b.danosti));
  const vrstice = [
    '# Zbirka ugank',
    '',
    'Izvoz iz Sudoku reševalca (`app/`, gumb "Zbirka" -> "Izvozi"). Datoteko je mogoče',
    'uvoziti nazaj (gumb "Uvozi"), ki razbere vrstice oblike `- **Ključ:** vrednost`.',
    'Uganke, pri katerih je navedeno "Preverjeno", imajo enolično rešitev; "Rešeno" pove,',
    'kako daleč je prišel `solve()` iz `shared/engine.js`.',
  ];
  for (const z of urejena) {
    vrstice.push('', `### ${[z.dodano, z.tezavnost].filter(Boolean).join(' · ') || 'uganka'}`, '');
    vrstice.push(`- **Danosti:** \`${z.danosti.replace(/0/g, '.')}\``);
    if (z.tezavnost) vrstice.push(`- **Težavnost:** ${z.tezavnost}`);
    if (z.dodano) vrstice.push(`- **Dodano:** ${z.dodano}`);
    if (z.nazadnje) vrstice.push(`- **Nazadnje rešeno:** ${z.nazadnje}`);
    if (!zbirkaPrazno(z.reseno)) {
      vrstice.push(`- **Rešeno:** ${z.reseno === 81 ? 'v celoti' : `delno (${z.reseno} od 81 celic)`}`);
    }
    if (!zbirkaPrazno(z.koraki)) vrstice.push(`- **Koraki:** ${z.koraki}`);
    if (!zbirkaPrazno(z.ugibanje)) vrstice.push(`- **Ugibanje:** ${z.ugibanje}`);
    if (!zbirkaPrazno(z.tehnike)) {
      vrstice.push(`- **Tehnike:** ${z.tehnike.length ? z.tehnike.map(([t, n]) => `${t} ${n}`).join(', ') : '(brez)'}`);
    }
    if (z.opomba) vrstice.push(`- **Opomba:** ${z.opomba}`);
    // Zapis z "Rešeno" je nastal ob reševanju, ki se shrani le pri enolični rešitvi.
    if (!zbirkaPrazno(z.reseno)) vrstice.push('- **Preverjeno:** enolična rešitev (`countSolutions() === 1`)');
  }
  return vrstice.join('\n') + '\n';
}

/* ---------- uvoz iz Markdowna ---------- */

// Iz besedila pobere vse razdelke, ki imajo vrstico "- **Danosti:** ...".
// Razdelek se začne z naslovom (#...) ali z novo vrstico Danosti. Neznane
// vrstice (npr. **Vir**, **Značilnost** v docs/uganke.md) se preskočijo.
// Vrne { zapisi, neveljavni }.
function zbirkaIzMarkdowna(besedilo) {
  const surovi = [];
  let tren = null;
  for (const vrstica of besedilo.split(/\r?\n/)) {
    if (/^#/.test(vrstica)) { tren = null; continue; }
    const m = /^\s*[-*]\s+\*\*(.+?):\*\*\s*(.*)$/.exec(vrstica);
    if (!m) continue;
    // "Danosti (17)" -> "danosti"
    const kljuc = m[1].replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
    if (!tren || (kljuc === 'danosti' && tren.danosti !== undefined)) {
      tren = {};
      surovi.push(tren);
    }
    tren[kljuc] = m[2].trim();
  }

  const zapisi = [];
  let neveljavni = 0;
  for (const s of surovi) {
    if (s.danosti === undefined) continue;
    const z = zbirkaPretvoriUvozeni(s);
    if (z) zapisi.push(z); else neveljavni++;
  }
  return { zapisi, neveljavni };
}

function zbirkaPretvoriUvozeni(s) {
  const danosti = s.danosti.replace(/`/g, '').trim().replace(/\./g, '0');
  if (!/^[0-9]{81}$/.test(danosti) || !zbirkaBrezKonfliktov(danosti)) return null;

  const stevilo = v => (/^\d+$/.test(v || '') ? parseInt(v, 10) : null);
  const datum = v => (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(v || '') ? v : '');

  let tezavnost = '';
  if (s['težavnost']) tezavnost = TEZAVNOSTI.includes(s['težavnost']) ? s['težavnost'] : 'Drugo';

  let reseno = null;
  const r = s['rešeno'] || '';
  if (r === 'v celoti') reseno = 81;
  else if (/(\d+)\s+od\s+81/.test(r)) reseno = parseInt(/(\d+)\s+od\s+81/.exec(r)[1], 10);

  let tehnike = null;
  if (s.tehnike === '(brez)') {
    tehnike = [];
  } else if (s.tehnike) {
    const deli = s.tehnike.split(',').map(t => /^(.*\S)\s+(\d+)$/.exec(t.trim()));
    if (deli.every(Boolean)) tehnike = deli.map(m => [m[1], parseInt(m[2], 10)]);
  }

  return {
    danosti,
    tezavnost,
    dodano: datum(s.dodano),
    nazadnje: datum(s['nazadnje rešeno']),
    reseno,
    koraki: stevilo(s.koraki),
    ugibanje: stevilo(s.ugibanje),
    tehnike,
    opomba: s.opomba || '',
  };
}

// Uvožene zapise doda v `zbirka` (spremeni jo na mestu). Nove uganke doda;
// pri obstoječih danostih ohrani obstoječi zapis in dopolni le prazna polja.
function zbirkaZdruzi(zbirka, uvozeni, cas) {
  const porocilo = { novi: 0, dopolnjeni: 0, nespremenjeni: 0 };
  for (const u of uvozeni) {
    const obst = zbirka.find(z => z.danosti === u.danosti);
    if (!obst) {
      if (!u.dodano) u.dodano = cas;
      zbirka.push(u);
      porocilo.novi++;
      continue;
    }
    let spremenjen = false;
    for (const k of ZBIRKA_POLJA) {
      if (zbirkaPrazno(obst[k]) && !zbirkaPrazno(u[k])) { obst[k] = u[k]; spremenjen = true; }
    }
    if (spremenjen) porocilo.dopolnjeni++; else porocilo.nespremenjeni++;
  }
  return porocilo;
}

/* ---------- vrstni red za prikaz ---------- */

// Vrstni red v seznamu zbirke: od nazadnje rešene naprej (neobdelane uvožene
// na konec). Vrne novo polje zapisov.
function zbirkaZaSeznam(zbirka) {
  return zbirka.map((z, i) => ({ z, i })).sort((a, b) =>
    (b.z.nazadnje || '').localeCompare(a.z.nazadnje || '') ||
    (b.z.dodano || '').localeCompare(a.z.dodano || '') ||
    b.i - a.i).map(x => x.z);
}
