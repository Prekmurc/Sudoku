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
    '--blue-bg', '--green', '--green-bg', '--amber', '--amber-bg', '--purple', '--purple-bg', '--purple-dark', '--purple-dark-ink', '--izbira', '--izbira-bg']) {
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
