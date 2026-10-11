'use strict';
// Varovalo za CLAUDE.md (naloga 6a, docs/claude-md-nacrt.md, korak 2): CLAUDE.md se naloži ob
// vsakem pogovoru, zato ostane kratek, njegove poti obstajajo, vsaka datoteka ima opis v
// docs/opis/ in vsaka datoteka aplikacije vrstico v zemljevidu.
// Bere samo CLAUDE.md in docs/opis/ (izjema »samo dokumenti → hitri testi« ostane).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');
const MEJA = 25000;
const APLIKACIJE = ['app', 'igra', 'trening', 'shared'];
const VSE_MAPE = [...APLIKACIJE, 'tests', 'tools'];

const claude = fs.readFileSync(path.join(KOREN, 'CLAUDE.md'), 'utf8');

// Datoteke v mapi (rekurzivno, brez map s posnetki) kot poti od korena s poševnico.
function datoteke(mapa, out = []) {
  for (const v of fs.readdirSync(path.join(KOREN, mapa), { withFileTypes: true })) {
    const p = mapa + '/' + v.name;
    if (v.isDirectory()) { if (v.name !== 'posnetki') datoteke(p, out); }
    else out.push(p);
  }
  return out;
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Ime je omenjeno kot samostojno ime datoteke (ne kot del daljšega imena).
function omenjeno(besedilo, ime) {
  return new RegExp('(^|[^\\w.-])' + escRe(ime) + '(?![\\w-])', 'm').test(besedilo);
}

test('(a) CLAUDE.md ima največ 25.000 znakov', () => {
  const znakov = [...claude].length;
  assert.ok(znakov <= MEJA, `CLAUDE.md ima ${znakov} znakov (meja ${MEJA}) – podrobnosti gredo v docs/opis/`);
});

// Poti so zapisane kot koda (med `…`); v prozi »igra/reševalec/trening« ni pot.
test('(b) vsaka pot v CLAUDE.md obstaja (razen vzorcev z <…> ali *)', () => {
  const vzorec = new RegExp('(?<![\\p{L}\\d_/.-])(?:docs|' + VSE_MAPE.join('|') + ')/[\\p{L}\\d_./-]*', 'gu');
  const poti = new Set();
  for (const koda of claude.match(/`[^`\n]+`/g)) {
    for (const m of koda.matchAll(vzorec)) {
      const naslednji = koda[m.index + m[0].length];
      if (naslednji === '<' || naslednji === '*') continue;
      poti.add(m[0].replace(/\.+$/, ''));
    }
  }
  assert.ok(poti.size > 30, `${poti.size} poti`);
  const manjkajo = [...poti].filter(p => !fs.existsSync(path.join(KOREN, p)));
  assert.deepEqual(manjkajo, []);
});

test('(c) vsaka datoteka v app/, igra/, trening/, shared/, tests/, tools/ je omenjena v docs/opis/', () => {
  const mapaOpis = path.join(KOREN, 'docs', 'opis');
  const opisi = fs.readdirSync(mapaOpis).filter(f => f.endsWith('.md'))
    .map(f => fs.readFileSync(path.join(mapaOpis, f), 'utf8')).join('\n');
  const vse = VSE_MAPE.flatMap(m => datoteke(m));
  assert.ok(vse.length > 100, `${vse.length} datotek`);
  const brezOpisa = vse.filter(p => !omenjeno(opisi, path.posix.basename(p)));
  assert.deepEqual(brezOpisa, [], 'datoteke brez opisa v docs/opis/');
});

test('(d) vsaka datoteka v app/, igra/, trening/, shared/ je v zemljevidu CLAUDE.md', () => {
  const zac = claude.indexOf('## Zemljevid datotek');
  assert.ok(zac >= 0, 'CLAUDE.md nima razdelka »Zemljevid datotek«');
  const kon = claude.indexOf('\n## ', zac + 1);
  const vrstice = claude.slice(zac, kon < 0 ? undefined : kon).split('\n');
  // Del zemljevida za mapo: njena vrstica »- `mapa/`« in zamaknjene vrstice pod njo.
  function delMape(mapa) {
    const i = vrstice.findIndex(v => v.startsWith('- `' + mapa + '/`'));
    assert.ok(i >= 0, `zemljevid nima vrstice za ${mapa}/`);
    const del = [vrstice[i]];
    for (let j = i + 1; j < vrstice.length && /^\s+\S/.test(vrstice[j]); j++) del.push(vrstice[j]);
    return del.join('\n');
  }
  const manjkajo = [];
  for (const mapa of APLIKACIJE) {
    const del = delMape(mapa);
    for (const p of datoteke(mapa)) {
      const ime = p.slice(mapa.length + 1);
      if (!del.includes('`' + ime + '`') && !omenjeno(del, ime)) manjkajo.push(p);
    }
  }
  assert.deepEqual(manjkajo, [], 'datoteke brez vrstice v zemljevidu');
});
