'use strict';
// Besedilne datoteke repozitorija nimajo kontrolnih znakov (razen tabulatorja, \n in \r).
// Tak znak lahko nevidno pride v kodo npr. iz skripte za urejanje (backspace namesto \b v
// regularnem izrazu - test potem ne preverja ničesar, kar se je zgodilo v
// tests/mreza.test.js in tests/pocasni/trening-uganka-ui.test.js, 2026-10-03).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const BESEDILO = /\.(js|html|css|md|json|txt)$/i;
const IZPUSTI = new Set(['.git', 'node_modules', 'old']);
// Kontrolni znaki C0 razen \t (09), \n (0A) in \r (0D) ter DEL (7F).
const KONTROLNI = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

function datoteke(mapa, out = []) {
  for (const v of fs.readdirSync(mapa, { withFileTypes: true })) {
    if (IZPUSTI.has(v.name)) continue;
    const p = path.join(mapa, v.name);
    if (v.isDirectory()) datoteke(p, out);
    else if (BESEDILO.test(v.name)) out.push(p);
  }
  return out;
}

test('besedilne datoteke so brez kontrolnih znakov (razen \t, \n, \r)', () => {
  const vse = datoteke(KOREN);
  assert.ok(vse.length > 50, `${vse.length} datotek`);
  const najdbe = [];
  for (const f of vse) {
    const vrstice = fs.readFileSync(f, 'utf8').split('\n');
    vrstice.forEach((v, i) => {
      const m = KONTROLNI.exec(v);
      if (m) najdbe.push(`${path.relative(KOREN, f)}:${i + 1} (U+${m[0].charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()})`);
    });
  }
  assert.deepEqual(najdbe, []);
});
