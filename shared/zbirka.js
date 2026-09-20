/* ==================== ZBIRKA UGANK (skupna koda) ====================
   Hramba zbirke ugank v localStorage tega brskalnika, podatki ob reševanju ter
   izvoz/uvoz v datoteko Markdown v enaki obliki kot docs/uganke.md. Uganke se
   ločijo po 81-znakovnem nizu danosti (interno '0' = prazna celica, v datoteki '.').
   Brez DOM-a (razen zbirkaPrenesi() za prenos datoteke) - uporabljata jo
   app/zbirka.js (UI zbirke v reševalcu) in igra/, tudi za gumba Izvozi/Uvozi.
   Tu je tudi seznam vgrajenih primerov (PRIMERI) - reševalec jih ponudi v
   spustnem seznamu "Primer", igra v oknu "Zbirka ugank".
   Naloži se za shared/engine.js (uporablja ALL_UNITS, ALL_TECHNIQUES, TRENING_TEHNIKE). */

const ZBIRKA_KLJUC = 'sudoku.zbirka.v1';
const TEZAVNOSTI = ['Začetnik', 'Preprosto', 'Srednje', 'Težko', 'Ekspert', 'Ekstrem', 'Drugo'];
const PRIVZETA_TEZAVNOST = 'Ekstrem';
// Polja zapisa v stalnem vrstnem redu (tudi vrstni red pri uvozu/dopolnjevanju).
const ZBIRKA_POLJA = ['danosti', 'tezavnost', 'dodano', 'nazadnje', 'reseno', 'koraki', 'ugibanje', 'tehnike', 'opomba'];

// Vgrajeni primeri (reševalec: spustni seznam "Primer", igra: razdelek "Vgrajeni
// primeri" v oknu Zbirka ugank). Nov primer = nova vrstica tu. Danosti morajo biti
// preverjene (countSolutions() === 1) in zapisane v docs/uganke.md; '0' ali '.' =
// prazna celica.
const PRIMERI = [
  { ime: 'Primer 1 (z ugibanjem)', danosti: '000800020900000600000000000604000900000720003500000000000056000080009000070000010' }, // example-app
  { ime: 'Primer 2 (Ekstrem, brez ugibanja)', danosti: '8....1......6..5.....7.....1.....6.....5..2......7.....25....7..6.....3.....8...4' }, // oakever-ekstrem-lv4
  { ime: 'Primer 3 (lahka)', danosti: '.73..4..2.49.6.8..1.58............26....9.37.387..2...492.7.6.......9.5.5..2.69.7' }, // lahka-seme-197
  { ime: 'Primer 4 (srednja)', danosti: '..4..7.251....3....7.8.....8...9..34.4...5..996....572..1..6.................4761' }, // srednja-a
];

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
    'Izvoz zbirke ugank (reševalec `app/` ali igra `igra/`, gumb "Zbirka" -> "Izvozi"). Datoteko je mogoče',
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

/* ---------- izvoz/uvoz za gumba v UI (reševalec in igra) ---------- */

const ZBIRKA_DATOTEKA = 'zbirka-ugank.md';

// Izvoz zbirke iz tega brskalnika. Vrne { besedilo, sporocilo } ali, če je
// zbirka prazna, { besedilo: null, sporocilo, napaka: true }. Datoteko prenese
// zbirkaPrenesi().
function zbirkaIzvozi() {
  const zbirka = zbirkaBeri();
  if (!zbirka.length) return { besedilo: null, sporocilo: 'Zbirka je prazna - ni česa izvoziti.', napaka: true };
  return {
    besedilo: zbirkaVMarkdown(zbirka),
    sporocilo: `Izvoženih ugank: ${zbirka.length} (datoteka ${ZBIRKA_DATOTEKA}).`,
    napaka: false,
  };
}

// Uvoz besedila datoteke (Markdown) v zbirko tega brskalnika: nove uganke
// doda, obstoječe le dopolni (zbirkaZdruzi). Vrne { sporocilo, napaka,
// spremenjeno } - spremenjeno = zbirka je bila zapisana (osveži prikaz).
function zbirkaUvozi(besedilo) {
  const { zapisi, neveljavni } = zbirkaIzMarkdowna(besedilo);
  if (!zapisi.length && !neveljavni) {
    return { sporocilo: 'V datoteki ni nobene uganke (pričakujem vrstice oblike "- **Danosti:** `...`").', napaka: true, spremenjeno: false };
  }
  const zbirka = zbirkaBeri();
  const p = zbirkaZdruzi(zbirka, zapisi, zbirkaZdaj());
  if (!zbirkaPisi(zbirka)) {
    return { sporocilo: 'Uvoza ni bilo mogoče shraniti (brskalnik ne dovoli shranjevanja).', napaka: true, spremenjeno: false };
  }
  return {
    sporocilo: `Uvoz končan - novih: ${p.novi} · dopolnjenih: ${p.dopolnjeni} · že obstoječih brez sprememb: ${p.nespremenjeni}` +
      (neveljavni ? ` · neveljavnih (preskočenih): ${neveljavni}` : '') + '.',
    napaka: neveljavni > 0,
    spremenjeno: true,
  };
}

// Prenos besedila kot datoteke v brskalniku. Edina funkcija v tej datoteki,
// ki potrebuje brskalnik (document, Blob) - kličeta jo samo UI-ja.
function zbirkaPrenesi(besedilo, ime = ZBIRKA_DATOTEKA) {
  const blob = new Blob([besedilo], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ime;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- oznaka tehnik za prikaz ---------- */

// Katere tehnike uganka zahteva, s številkami iz treninga (TRENING_TEHNIKE v
// shared/engine.js): "tehnike: 1, 3, 7 + poskus". Iz polja z.tehnike ([[ime,
// število], ...] iz reševanja). Enojčki se ne izpišejo (osnova vsake uganke),
// poskus s protislovjem je oznaka "+ poskus" (pri več "+ poskus ×2"); ime, ki ga
// ni med tehnikami (npr. iz starejšega izvoza), se izpiše kar z imenom.
function zbirkaOznakaTehnik(z) {
  if (!z || !Array.isArray(z.tehnike)) return 'tehnike: ni podatkov';
  const stevilke = [];
  const neznane = [];
  let poskusi = 0;
  for (const [ime, n] of z.tehnike) {
    const i = TRENING_TEHNIKE.findIndex(([, t]) => t === ime);
    if (i >= 0) stevilke.push(i + 1);
    else if (/protislovje/.test(ime)) poskusi += n;
    else if (!ALL_TECHNIQUES.some(([t]) => t === ime)) neznane.push(ime);
  }
  const deli = stevilke.sort((a, b) => a - b).map(String).concat(neznane);
  let s = deli.length ? deli.join(', ') : 'samo enojčki';
  if (poskusi) s += ' + poskus' + (poskusi > 1 ? ` ×${poskusi}` : '');
  return 'tehnike: ' + s;
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
