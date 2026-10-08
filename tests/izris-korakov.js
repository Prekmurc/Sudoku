'use strict';
// Izris korakov vseh ugank iz docs/uganke.md (XY-veriga, korak 3 - docs/xy-veriga-nacrt.md):
// mala mreža reševalca (renderGridInto in legendaKoraka v app/app.js) in mreža igre
// (ustvariMrezo + oznakeKoraka v shared/mreza.js - s kandidati in z izklopljenimi kandidati,
// kot na tretji stopnji »Naslednjega koraka«) za vsak korak dnevnika solve() s posnetkom
// stanja, v nadomestnem DOM-u. Izris je zapisan kot niz (drevo elementov z razredi,
// podatki, slogi in besedilom); posnetek so zgoščene vrednosti teh nizov.
//
// Posnetek je narejen na kodi pred korakom 3 (prikaz zaporedja verige) - prikaz drugih
// tehnik se ne sme spremeniti niti za znak; znova ob vklopu XY-verige (korak 6), ko so
// koraki od prve verige naprej pri treh ugankah drugi. Nov posnetek (samo, če je sprememba izrisa
// namerna): node tests/izris-korakov.js --shrani
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const POSNETEK = path.join(__dirname, 'posnetki', 'izris-korakov.json');
// Vrstni red kot <script> v app/index.html.
const RESEVALEC = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
  'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'app/app.js', 'app/zbirka.js'];
const MREZA = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js'];

// Element nadomestnega DOM-a kot niz: oznaka, razred, podatki, atributi, slogi, besedilo, otroci.
function zapis(el) {
  if (!el.tagName) return JSON.stringify(el.textContent);
  const deli = [el.tagName];
  if (el.className) deli.push(`class=${JSON.stringify(el.className)}`);
  for (const [k, v] of Object.entries(el.dataset)) deli.push(`data-${k}=${JSON.stringify(String(v))}`);
  for (const [k, v] of Object.entries(el.attrs)) deli.push(`${k}=${JSON.stringify(v)}`);
  if (el.title) deli.push(`title=${JSON.stringify(el.title)}`);
  const slogi = { ...el.style.vrednosti };
  for (const [k, v] of Object.entries(el.style)) if (typeof v === 'string' && v) slogi[k] = v;
  if (Object.keys(slogi).length) deli.push(`style=${JSON.stringify(slogi)}`);
  const lastna = el.lastna ? JSON.stringify(el.lastna) : '';
  return `<${deli.join(' ')}>${lastna}${el.children.map(zapis).join('')}</${el.tagName}>`;
}
const zgosti = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

// Za vsako uganko seznam korakov s posnetkom: { korak, resevalec, igra, igraBrez } - nizi izrisa.
function izrisiVse() {
  const dom = makeDom();
  const { run } = loadContext(RESEVALEC, dom.globals);
  const m = loadContext(MREZA, makeDom().globals);
  m.run(`var el = document.createElement('div'); var mr = ustvariMrezo(el, {});`);
  const izid = {};
  for (const { ime, danosti: d } of loadPuzzles()) {
    const danosti = d.replace(/\./g, '0');
    run(`(() => { const r = solve(${JSON.stringify(danosti)});
      lastSolve = { givens: ${JSON.stringify(danosti)}, grid: r.board.grid, log: r.log }; })()`);
    const koraki = [];
    const n = run('lastSolve.log.length');
    for (let i = 0; i < n; i++) {
      if (!run(`!!lastSolve.log[${i}].snapshotGrid`)) continue;
      const res = run(`(() => { const div = document.createElement('div');
        renderGridInto(div, lastSolve.log[${i}], 'var(--mcs-koraka)');
        return [div, legendaKoraka(lastSolve.log[${i}])]; })()`);
      const s = JSON.stringify(run(`(() => { const s = lastSolve.log[${i}];
        return { grid: [...s.snapshotGrid], cand: [...s.snapshotCand], cells: s.cells, eliminate: s.eliminate,
          assign: s.assign, veriga: s.veriga }; })()`));
      const pogled = (brez) => `(() => { const s = ${s}; const stanje = { grid: s.grid, kandidati: s.cand };
        mr.izrisi({ grid: s.grid, danosti: ${JSON.stringify(danosti)}, kandidati: s.cand,
          celiceKandidatov: ${brez} ? [...s.cells, ...s.eliminate.map(e => e[0])] : null,
          oznake: oznakeKoraka(s, stanje) }); return el; })()`;
      koraki.push({
        korak: i + 1,
        resevalec: zapis(res[0]) + zapis(res[1]),
        igra: zapis(m.run(pogled(false))),
        igraBrez: zapis(m.run(pogled(true))),
      });
    }
    // Rešena mreža (povečava rešitve - "navidezen korak" brez oznak).
    const resena = run(`(() => { const div = document.createElement('div');
      renderGridInto(div, { snapshotGrid: lastSolve.grid, snapshotCand: [], eliminate: [], assign: [], cells: [] },
        'min(48px, var(--mcs-povecave))'); return div; })()`);
    izid[ime] = { koraki, resena: zapis(resena) };
  }
  return izid;
}

// Posnetek: za vsako uganko zgoščena vrednost izrisa vsakega koraka in rešene mreže.
function posnetek(izid = izrisiVse()) {
  const p = {};
  for (const [ime, { koraki, resena }] of Object.entries(izid)) {
    p[ime] = {
      koraki: koraki.map(k => `${k.korak}:${zgosti(k.resevalec)}:${zgosti(k.igra)}:${zgosti(k.igraBrez)}`),
      resena: zgosti(resena),
    };
  }
  return p;
}

if (require.main === module && process.argv.includes('--shrani')) {
  fs.mkdirSync(path.dirname(POSNETEK), { recursive: true });
  fs.writeFileSync(POSNETEK, JSON.stringify(posnetek(), null, 1) + '\n');
  console.log(`Zapisano: ${POSNETEK}`);
}

module.exports = { izrisiVse, posnetek, zapis, POSNETEK };
