'use strict';
// Značke ravni in težavnosti (XY-veriga, korak 2 - docs/xy-veriga-nacrt.md, razdelek 7, O5): kontrast
// pisave na podlagi značke vsaj 4,5 : 1 (WCAG AA) za vse značke ravni (oznaka koraka .tag.t-* v
// reševalcu, igri in Pomoči, značka kartice .badge-* v treningu) in vse značke težavnosti
// (zbirkaZnacka() - ZNACKA_TEZAVNOSTI v shared/zbirka-ui.js, slogi .tag.* v shared/base.css in
// shared/zbirka.css). Barve se preberejo iz CSS (spremenljivke iz :root) kot v
// tests/trening-kontrast.test.js; izračunan slog v brskalniku preverja tools/preveri-faza7-brskalnik.js
// --korak 5. Napisan pred spremembo; na stari kodi sta padla samo testa kontrasta pri »Lahka« in »Srednja«
// (zelena 4,1, jantarna 3,7 - Darko 2026-10-08: temnejša pisava samo v značkah, --green-ink in --amber-ink),
// zadnji test pa je bil zelen z današnjim pričakovanjem (brez ekspertne ravni, »Zelo težka« polna temna
// vijolična z belo pisavo, »Ekstrem« rdeča kot »Presega tehnike«).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine } = require('./load-engine.js');

const KOREN = path.join(__dirname, '..');
const brez = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const beri = f => brez(fs.readFileSync(path.join(KOREN, f), 'utf8'));
// Vrstni red nalaganja: base.css prvi, zbirka.css za njim (app/ in igra/), trening.css v treningu.
const BASE = beri('shared/base.css');
const ZBIRKA = beri('shared/zbirka.css');
const TRENING = beri('trening/trening.css');

const E = loadEngine(undefined, {
  files: ['shared/zbirka.js', 'shared/zbirka-ui.js'],
  names: ['RAZRED_RAVNI', 'RAVNI_TEHNIK', 'TEZAVNOSTI', 'ZNACKA_TEZAVNOSTI'],
});

const spremenljivke = {};
for (const css of [BASE, ZBIRKA, TRENING]) {
  for (const blok of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const [, ime, vr] of blok[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) spremenljivke[ime] = vr.trim();
  }
}
const razresi = v => {
  for (let i = 0; i < 10; i++) {
    const m = /^var\((--[\w-]+)\)$/.exec(v.trim());
    if (!m) return v.trim();
    v = spremenljivke[m[1]];
    assert.ok(v, `spremenljivka ${m[1]} ni definirana`);
  }
  throw new Error('preveč ugnezdenih var()');
};
function hex(barva) {
  const m = /^#([0-9a-f]{6})$/i.exec(barva);
  assert.ok(m, `barva ${barva} ni #RRGGBB`);
  return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
}
const svetlost = barva => {
  const [r, g, b] = hex(barva).map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (a, b) => {
  const [l1, l2] = [svetlost(a), svetlost(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
// Odtenek (0-360) za preverjanje »turkizna«.
function odtenek(barva) {
  const [r, g, b] = hex(barva).map(c => c / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return null;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

// Slog elementa z razredi `razredi` iz pravil z izbirnikom iz samih razredov (».tag.t-pair«, ».badge-lahka«):
// pravilo velja, če ima element vse njegove razrede; pri enaki specifičnosti zmaga poznejše (vrstni red datotek).
function slog(razredi, datoteke) {
  const ima = new Set(razredi.split(/\s+/));
  const o = {};
  for (const css of datoteke) {
    for (const [, izbirniki, telo] of css.matchAll(/(?<=^|})\s*([^{}@]+?)\s*\{([^}]*)\}/g)) {
      for (const izb of izbirniki.split(',').map(x => x.trim())) {
        if (!/^(\.[\w-]+)+$/.test(izb)) continue;
        if (!izb.slice(1).split('.').every(r => ima.has(r))) continue;
        for (const [, k, v] of telo.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
          if (k === 'background' || k === 'background-color') o.podlaga = razresi(v);
          if (k === 'color') o.pisava = razresi(v);
        }
      }
    }
  }
  return o;
}
const znackaTezavnosti = t => slog(`tag ${E.ZNACKA_TEZAVNOSTI[t] || 't-chain'} znacka-tezavnosti`, [BASE, ZBIRKA]);

test('značke ravni: oznaka koraka .tag.t-* in značka kartice v treningu, kontrast vsaj 4,5 : 1', () => {
  const ravni = Object.keys(E.RAZRED_RAVNI);
  assert.deepEqual(ravni, Object.keys(E.RAVNI_TEHNIK), 'vsaka raven ima razred');
  for (const raven of ravni) {
    for (const [ime, s] of [[`.tag.${E.RAZRED_RAVNI[raven]}`, slog(`tag ${E.RAZRED_RAVNI[raven]}`, [BASE])],
      [`.badge-${raven}`, slog(`badge badge-${raven}`, [BASE, TRENING])]]) {
      assert.ok(s.podlaga && s.pisava, `${ime}: ni podlage ali pisave`);
      const k = kontrast(s.pisava, s.podlaga);
      assert.ok(k >= 4.5, `${ime}: kontrast ${k.toFixed(2)} (${s.pisava} na ${s.podlaga})`);
    }
  }
  // Poskus s protislovjem in drugo (t-chain, t-basic).
  for (const r of ['t-chain', 't-basic']) {
    const s = slog(`tag ${r}`, [BASE]);
    assert.ok(kontrast(s.pisava, s.podlaga) >= 4.5, r);
  }
});

test('značke težavnosti: vseh osem, kontrast vsaj 4,5 : 1', () => {
  assert.equal(E.TEZAVNOSTI.length, 8);
  for (const t of E.TEZAVNOSTI) {
    const s = znackaTezavnosti(t);
    assert.ok(s.podlaga && s.pisava, `${t}: ni podlage ali pisave`);
    const k = kontrast(s.pisava, s.podlaga);
    assert.ok(k >= 4.5, `${t}: kontrast ${k.toFixed(2)} (${s.pisava} na ${s.podlaga})`);
  }
});

test('»Zelo težka« je jasno temnejša od »Težka«', () => {
  const zt = znackaTezavnosti('Zelo težka'), t = znackaTezavnosti('Težka');
  assert.ok(svetlost(zt.podlaga) < svetlost(t.podlaga));
  const r = kontrast(zt.podlaga, t.podlaga);
  assert.ok(r >= 1.5, `razmerje svetlosti podlag ${r.toFixed(2)} (${zt.podlaga} : ${t.podlaga})`);
});

// Pred spremembo: »Zelo težka« svetla pisava na temni podlagi, »Ekstrem« enak »Presega tehnike«.
// Zdaj (razdelek 7): obe srednje močna podlaga s temno pisavo - ne polni in temni (ne videti črni).
test('»Zelo težka« in »Ekstrem«: srednje močna podlaga, temna pisava, Ekstrem jasno turkizen', () => {
  const zt = znackaTezavnosti('Zelo težka'), ek = znackaTezavnosti('Ekstrem');
  for (const [ime, s] of [['Zelo težka', zt], ['Ekstrem', ek]]) {
    assert.ok(svetlost(s.pisava) < svetlost(s.podlaga), `${ime}: pisava ${s.pisava} na ${s.podlaga} ni temna`);
    const l = svetlost(s.podlaga);
    assert.ok(l >= 0.25 && l <= 0.6, `${ime}: svetlost podlage ${l.toFixed(2)} (${s.podlaga}) ni srednja`);
  }
  assert.notDeepEqual(ek, znackaTezavnosti('Presega tehnike'));
  const h = odtenek(ek.podlaga);
  assert.ok(h >= 165 && h <= 195, `odtenek »Ekstrem« ${h} (${ek.podlaga}) ni turkizen`);
  // Opazno temnejša od svetle oznake ekspertne ravni (.tag.t-expert), v istem odtenku.
  const raven = slog(`tag ${E.RAZRED_RAVNI.ekspertna}`, [BASE]);
  assert.ok(svetlost(ek.podlaga) < svetlost(raven.podlaga));
  assert.ok(kontrast(ek.podlaga, raven.podlaga) >= 1.5, `${ek.podlaga} : ${raven.podlaga}`);
  assert.ok(Math.abs(odtenek(raven.podlaga) - h) < 10, 'odtenek ravni');
  // »Zelo težka« v odtenku »Težke« (vijolična).
  assert.ok(Math.abs(odtenek(zt.podlaga) - odtenek(znackaTezavnosti('Težka').podlaga)) < 15, 'odtenek Zelo težka');
});
