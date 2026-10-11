'use strict';
// Kandidat za izbris pri prikazanem koraku (naloga 6, popravek po ročnem pregledu, 2026-10-11):
// števka temna (--ink) in krepka, črta rdeča (--red) 2 px - kot prečrtana črka v shemah
// (.shema-izbris). Prej rdeča števka z rdečo črto: na rožnati podlagi celice izbrisa #F0B4AA
// samo 3,34 : 1. Velja povsod, kjer je tak kandidat: mreža igre in treninga (.kand.k-izbris),
// »Spoznaj« 3-13 (.cd.elim/.peek-izbris, X-krilo in mečarica .xw-cell), oznake 2. faze (isti
// videz kot izbris), mala mreža in povečava reševalca (.mcand-elim), vzorčki v legendah, čip
// »rdeče prečrtani« v Pomoči igre. Siva prečrtana števka v »Vadi v uganki« (kandidat, ki ga ni
// več - .kand.precrtan) ostane.
// Testi CSS ne vidijo kaskade v brskalniku - izračunani slog preveri
// tools/preveri-naloga6-brskalnik.js (korak 5).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const CSS = ['shared/mreza.css', 'shared/pomoc.css', 'trening/trening.css', 'app/app.css', 'igra/igra.css', 'shared/plosca.css', 'shared/base.css'];

// Pravila datoteke: [{ izbirnik, deklaracije: Map }] (brez komentarjev; pravila v @media/@supports
// so med drugimi - regularni izraz ujame samo notranje bloke).
function pravila(f) {
  const css = fs.readFileSync(path.join(KOREN, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    izbirnik: m[1].trim().replace(/\s+/g, ' '),
    deklaracije: new Map(m[2].split(';').map(d => d.trim()).filter(Boolean).map(d => {
      const i = d.indexOf(':');
      return [d.slice(0, i).trim(), d.slice(i + 1).trim().replace(/\s+/g, ' ')];
    })),
  }));
}
const vsaPravila = Object.fromEntries(CSS.map(f => [f, pravila(f)]));

function pravilo(f, izbirnik) {
  const p = vsaPravila[f].filter(x => x.izbirnik.split(',').map(s => s.trim()).includes(izbirnik) || x.izbirnik === izbirnik);
  assert.equal(p.length, 1, `${f}: pravilo ${izbirnik} (najdenih ${p.length})`);
  return p[0].deklaracije;
}

// Prečrtan kandidat za izbris: temna krepka števka, rdeča črta 2 px.
function preveriPrecrtano(f, izbirnik, { krepko = true } = {}) {
  const d = pravilo(f, izbirnik);
  assert.equal(d.get('color'), 'var(--ink)', `${f} ${izbirnik}: števka temna (--ink)`);
  if (krepko) assert.equal(d.get('font-weight'), '700', `${f} ${izbirnik}: krepko`);
  const td = d.get('text-decoration') || '';
  assert.deepEqual(td.split(' ').sort(), ['2px', 'line-through', 'var(--red)'], `${f} ${izbirnik}: črta rdeča 2 px - dobljeno »${td}«`);
  for (const k of ['text-decoration-color', 'text-decoration-thickness', 'text-decoration-line']) {
    assert.ok(!d.has(k), `${f} ${izbirnik}: brez ${k} (vse v text-decoration)`);
  }
}

const PRECRTANI = [
  ['shared/mreza.css', '.kand.k-izbris'],                  // mreža igre in treninga (tudi oznaka 2. faze pri 1 in 2)
  ['trening/trening.css', '.cd:is(.elim,.peek-izbris)'],   // »Spoznaj« 3-13
  ['trening/trening.css', '.cd.oznaka'],                   // oznaka 2. faze (videz izbrisa)
  ['trening/trening.css', '.xw-cell:is(.peek-elim,.xw-elim)'], // X-krilo, mečarica
  ['trening/trening.css', '.xw-cell.oznaka'],
  ['trening/trening.css', '.legenda-vaje .izbris-vzorec'], // vzorček legende treninga
  ['app/app.css', '.mcand-elim'],                          // mala mreža in povečava reševalca
  ['app/app.css', '.mini-legend .sw-izbris'],              // vzorček legende reševalca
  ['shared/pomoc.css', '.vzorec-izbris'],                  // čip »rdeče prečrtani« v Pomoči igre
];

for (const [f, izbirnik] of PRECRTANI) {
  test(`kandidat za izbris: ${f} ${izbirnik} - temna krepka števka, rdeča črta 2 px`, () => preveriPrecrtano(f, izbirnik));
}

test('vzor: prečrtana črka v legendi sheme (.shema-izbris) - temna, rdeča črta 2 px', () => {
  preveriPrecrtano('shared/pomoc.css', '.shema-izbris', { krepko: false });
});

// Razredi kandidata za izbris; pravilo, ki jim nastavi barvo, jo nastavi na --ink (sicer bi prepisalo
// temno števko - npr. prej .cd.hl-plum:is(.elim,…) rdeča, .vaja-presek .kand.poud.k-izbris temno rdeča).
// :not(…) in :where(…) (okolica - npr. kandidati v celici izbrisa) se ne štejeta.
const RAZREDI = /\.(k-izbris|elim|peek-izbris|oznaka|mcand-elim|izbris-vzorec|vzorec-izbris|xw-elim|peek-elim|sw-izbris)(?![\w-])/;
test('nobeno pravilo ne prepiše temne barve kandidata za izbris', () => {
  const napacna = [];
  for (const f of CSS) {
    for (const { izbirnik, deklaracije } of vsaPravila[f]) {
      for (const del of izbirnik.split(/,(?![^(]*\))/).map(s => s.trim())) {
        const brez = del.replace(/:(not|where)\([^)]*\)/g, '');
        if (!RAZREDI.test(brez) || !deklaracije.has('color')) continue;
        if (deklaracije.get('color') !== 'var(--ink)') napacna.push(`${f}: ${del} → ${deklaracije.get('color')}`);
      }
    }
  }
  assert.deepEqual(napacna, []);
});

test('siva prečrtana števka v »Vadi v uganki« (kandidat, ki ga ni več) ostane', () => {
  const d = pravilo('shared/mreza.css', '.kand.precrtan:not(.k-izbris)');
  assert.equal(d.get('color'), '#A9B2BC');
  assert.equal(d.get('text-decoration'), 'line-through');
  assert.equal(d.get('text-decoration-thickness'), '1px');
});
