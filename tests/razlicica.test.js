// Oznaka različice (?v=...) pri nalaganju skript in slogov (tools/oznaci-razlicico.js): vse
// lokalne skripte in slogi v treh index.html imajo isto oznako, ta je enaka shranjeni v
// razlicica.json, shranjena zgoščena vrednost ustreza dejanskim datotekam aplikacije, delavca
// dobita oznako v URL in jo dodata svojim importScripts.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const R = require('../tools/oznaci-razlicico.js');

const beri = (f) => fs.readFileSync(path.join(R.KOREN, f), 'utf8');

test('zgoščena vrednost v razlicica.json ustreza datotekam aplikacije', () => {
  const zapis = R.beriZapis();
  assert.ok(zapis && zapis.oznaka && zapis.zgoscena, `${R.ZAPIS} manjka - poženi: ${R.UKAZ}`);
  assert.equal(R.zgoscena(), zapis.zgoscena,
    `Aplikacija se je spremenila, oznaka različice pa ne - poženi: ${R.UKAZ} (ali commit s hookom tools/hooks/pre-commit)`);
});

test('vse lokalne skripte in slogi v treh index.html imajo isto oznako kot razlicica.json', () => {
  const zapis = R.beriZapis();
  for (const s of R.STRANI) {
    const p = R.povezave(beri(s));
    assert.ok(p.length > 5, s);
    for (const { url, oznaka } of p) {
      assert.equal(oznaka, zapis && zapis.oznaka, `${s}: ${url} - poženi: ${R.UKAZ}`);
    }
  }
});

test('igra da delavcema oznako v URL, delavca jo dodata importScripts', () => {
  const igra = beri('igra/igra.js');
  const delavci = [...igra.matchAll(/new Worker\(([^)]*)\)/g)].map(m => m[1]);
  assert.deepEqual(delavci, ["'oceni-worker.js' + PRIPONA_RAZLICICE", "'generator-worker.js' + PRIPONA_RAZLICICE"]);
  for (const [f, skripte] of [
    ['igra/oceni-worker.js', ['engine', 'stanje', 'zbirka', 'generator']],
    ['igra/generator-worker.js', ['engine', 'generator']],
  ]) {
    const nalozene = [];
    vm.runInNewContext(beri(f), {
      self: { location: { search: '?v=2026-10-05.1432' } },
      importScripts: (...u) => nalozene.push(...u),
    });
    assert.deepEqual(nalozene, skripte.map(s => `../shared/${s}.js?v=2026-10-05.1432`), f);
  }
});

test('skripte aplikacije ne nalagajo drugih datotek mimo oznake', () => {
  for (const m of ['app', 'igra', 'trening', 'shared']) {
    for (const f of fs.readdirSync(path.join(R.KOREN, m)).filter(f => /\.(js|css)$/.test(f))) {
      const s = beri(`${m}/${f}`);
      assert.ok(!/\bfetch\(|@import|\bimport\(|XMLHttpRequest/.test(s), `${m}/${f}`);
      const n = (s.match(/new Worker\(|importScripts\(/g) || []).length;
      assert.equal(n, { 'igra/igra.js': 2, 'igra/oceni-worker.js': 1, 'igra/generator-worker.js': 1 }[`${m}/${f}`] || 0, `${m}/${f}`);
    }
  }
});

test('prikaz različice na dnu okna Pomoč', () => {
  const ctx = { document: { currentScript: { src: 'http://x/shared/pomoc.js?v=2026-10-05.1432' } } };
  vm.runInNewContext(beri('shared/pomoc.js') + '\nthis.R = RAZLICICA; this.P = razlicicaZaPrikaz;', ctx);
  assert.equal(ctx.R, '2026-10-05.1432');
  assert.equal(ctx.P('2026-10-05.1432'), 'Različica 2026-10-05 14:32');
  assert.equal(ctx.P('2026-10-05.1432b'), 'Različica 2026-10-05 14:32b');
  assert.equal(ctx.P(''), '');
});
