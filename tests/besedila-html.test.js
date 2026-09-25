'use strict';
// Besedila v HTML vseh treh aplikacij (faza 4, del 2): izraz je »števka«, ne
// »številka« (dovoljeni sta zvezi s številko tehnike), gumbi so »Pokaži«, ne
// »Prikaži«; opisi kartic v treningu ne vsebujejo angleških imen tehnik (naslovi h3
// jih imajo v oklepaju in jih preveri trening-tehnike.test.js).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine } = require('./load-engine.js');

const E = loadEngine(undefined, { names: ['TEHNIKE_OPISI'] });
const beri = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const STRANI = ['app/index.html', 'trening/index.html', 'igra/index.html'];
// Zveze s številko tehnike (»tehnike: 1, 3, 7«, oznaki E1/E2 »namesto številke«).
const DOVOLJENE = [/številke tehnik/g, /Številke so tehnike/g, /namesto številke/g];

test('HTML: »števka« namesto »številka« (razen številke tehnik)', () => {
  for (const f of STRANI) {
    let html = beri(f);
    for (const d of DOVOLJENE) html = html.replace(d, '');
    const ostale = html.split(/\r?\n/).map((v, i) => [i + 1, v]).filter(([, v]) => /številk/i.test(v));
    assert.deepEqual(ostale.map(([i]) => i), [], `${f}: »številk« v vrsticah`);
  }
});

test('HTML: »Pokaži«, ne »Prikaži«', () => {
  for (const f of STRANI) assert.doesNotMatch(beri(f), /prikaži/i, f);
});

test('trening/index.html: opisi kartic brez angleških imen tehnik', () => {
  const opisi = [...beri('trening/index.html').matchAll(/<div class="menu-card" data-mode="([^"]+)">[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/g)];
  assert.equal(opisi.length, 14, 'število kartic z opisom');
  const angleska = Object.values(E.TEHNIKE_OPISI).flatMap(o => o.anglesko.split(', '));
  for (const [, m, opis] of opisi) {
    for (const a of angleska) assert.ok(!opis.includes(a), `${m}: »${a}« v opisu`);
  }
});
