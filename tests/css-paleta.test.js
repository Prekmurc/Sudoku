'use strict';
// Skupna paleta (faza 5, docs/faza5-nacrt.md, N1): barve palete so definirane samo v
// shared/base.css, ki ga vse tri aplikacije naložijo kot prvi slog. Aplikacija sme dodati
// svoje barve (trening barve tehnik, mreza.css barve mreže), ne sme pa znova definirati
// barve iz palete - sicer bi se aplikacije spet razšle (prej je imel trening druge
// vrednosti istih imen).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const beri = f => fs.readFileSync(path.join(KOREN, f), 'utf8');
const STRANI = ['app/index.html', 'trening/index.html', 'igra/index.html'];

// Imena spremenljivk iz prvega bloka :root v shared/base.css.
function paleta() {
  const blok = /:root\s*\{([^}]*)\}/.exec(beri('shared/base.css'));
  assert.ok(blok, 'shared/base.css nima bloka :root');
  return [...blok[1].matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]);
}

// Vse datoteke CSS aplikacij in shared/ razen shared/base.css.
function drugeCss() {
  const datoteke = [];
  for (const mapa of ['app', 'igra', 'trening', 'shared']) {
    for (const f of fs.readdirSync(path.join(KOREN, mapa))) {
      if (f.endsWith('.css') && !(mapa === 'shared' && f === 'base.css')) datoteke.push(`${mapa}/${f}`);
    }
  }
  return datoteke;
}

test('paleta v shared/base.css ima osnovne barve', () => {
  const p = paleta();
  for (const ime of ['--paper', '--card', '--ink', '--ink2', '--line', '--pencil', '--red', '--red-bg', '--blue',
    '--blue-bg', '--green', '--green-bg', '--amber', '--amber-bg', '--purple', '--purple-bg', '--purple-dark', '--purple-dark-ink',
    '--green-ink', '--amber-ink', '--turq', '--turq-bg', '--turq-dark', '--turq-dark-ink', '--izbira', '--izbira-bg']) {
    assert.ok(p.includes(ime), `manjka ${ime}`);
  }
});

test('barve palete niso definirane nikjer drugje', () => {
  const p = paleta();
  const najdene = [];
  for (const f of drugeCss()) {
    const css = beri(f).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const ime of p) {
      if (new RegExp(`${ime}\\s*:`).test(css)) najdene.push(`${f}: ${ime}`);
    }
  }
  assert.deepEqual(najdene, []);
});

test('shared/base.css je prvi slog v vseh treh aplikacijah', () => {
  for (const f of STRANI) {
    const slogi = [...beri(f).matchAll(/<link rel="stylesheet" href="([^"?]+)/g)].map(m => m[1]);
    assert.equal(slogi[0], '../shared/base.css', f);
  }
});

// Naloga 6, korak 1 (docs/naloga6-nacrt.md, O1-O3): podlagi celic vzorca in izbrisa ter temnejši
// kandidati so v paleti - en vir za trening, igro, reševalca, legende, čipa in shemo v Pomoči.
const PODLAGE = { '--k-vzorec-bg': '#EFD8A0', '--k-izbris-bg': '#F0B4AA', '--kand-ink': '#4A5561' };

// Deklaracije pravila z natanko tem izbirnikom (komentarji odstranjeni); null, če ga ni.
function pravilo(f, izbirnik) {
  const css = beri(f).replace(/\/\*[\s\S]*?\*\//g, '');
  const ubeg = izbirnik.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const m = new RegExp(`(?:^|[}\\s])${ubeg}\\s*\\{([^}]*)\\}`).exec(css);
  if (!m) return null;
  const dekl = {};
  for (const d of m[1].split(';')) {
    const i = d.indexOf(':');
    if (i > 0) dekl[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  }
  return dekl;
}

test('podlagi vzorca in izbrisa in --kand-ink so v paleti shared/base.css', () => {
  const blok = /:root\s*\{([^}]*)\}/.exec(beri('shared/base.css'))[1];
  for (const [ime, vrednost] of Object.entries(PODLAGE)) {
    const m = new RegExp(`${ime}\\s*:\\s*([^;]+);`).exec(blok);
    assert.ok(m, `manjka ${ime}`);
    assert.equal(m[1].trim().toUpperCase(), vrednost, ime);
  }
});

test('celice, legende, čipa in shema uporabljajo podlagi iz palete', () => {
  const pricakovano = [
    ['shared/mreza.css', '.celica.k-vzorec', 'background', 'var(--k-vzorec-bg)'],
    ['shared/mreza.css', '.celica.k-izbris', 'background', 'var(--k-izbris-bg)'],
    ['igra/igra.css', '.pomoc-legenda .sw-vzorec', 'background', 'var(--k-vzorec-bg)'],
    ['igra/igra.css', '.pomoc-legenda .sw-izbris', 'background', 'var(--k-izbris-bg)'],
    ['app/app.css', '.mini-grid .mcell.hl-source', 'background', 'var(--k-vzorec-bg)'],
    ['app/app.css', '.mini-grid .mcell.hl-elimonly', 'background', 'var(--k-izbris-bg)'],
    ['app/app.css', '.mini-legend .sw-vzorec', 'background', 'var(--k-vzorec-bg)'],
    ['app/app.css', '.mini-legend .sw-izbris', 'background', 'var(--k-izbris-bg)'],
    // O3: čipa v besedilu Pomoči igre - podlagi kot celice, »jantarne« s temno pisavo
    ['shared/pomoc.css', '.vzorec-vzorec', 'background', 'var(--k-vzorec-bg)'],
    ['shared/pomoc.css', '.vzorec-vzorec', 'color', 'var(--ink)'],
    ['shared/pomoc.css', '.vzorec-izbris', 'background', 'var(--k-izbris-bg)'],
    ['shared/pomoc.css', '.vzorec-izbris', 'color', 'var(--ink)'], // od popravka po ročnem pregledu temna števka, rdeča črta (css-precrtano.test.js)
    ['shared/pomoc.css', ':root', '--shema-vzorec-bg', 'var(--k-vzorec-bg)'],
    ['shared/pomoc.css', ':root', '--shema-izbris-bg', 'var(--k-izbris-bg)'],
  ];
  const napake = [];
  for (const [f, izb, lastnost, vrednost] of pricakovano) {
    const d = pravilo(f, izb);
    if (!d) napake.push(`${f}: ni pravila ${izb}`);
    else if (d[lastnost] !== vrednost) napake.push(`${f}: ${izb} { ${lastnost}: ${d[lastnost]} } namesto ${vrednost}`);
  }
  assert.deepEqual(napake, []);
});

test('reševalec: kandidati v celicah vzorca in izbrisa so --kand-ink (O2), drugi --pencil', () => {
  const d = pravilo('app/app.css', ':where(.mini-grid .mcell.hl-source, .mini-grid .mcell.hl-elimonly) .mcand');
  assert.ok(d, 'ni pravila za kandidate v obarvanih celicah');
  assert.equal(d.color, 'var(--kand-ink)');
  assert.equal(pravilo('app/app.css', '.mcand').color, 'var(--pencil)');
  // pravilo je pred .mcand-veriga in .mcand-elim (enaka specifičnost) - prečrtani ostanejo rdeči,
  // številke verige bele
  const css = beri('app/app.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const i = css.indexOf(':where(.mini-grid .mcell.hl-source');
  assert.ok(i < css.indexOf('.mcand-veriga{') && i < css.indexOf('.mcand-elim{'));
});
