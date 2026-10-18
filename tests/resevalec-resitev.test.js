'use strict';
// Reševalec – kartica »Rešitev« (dve postavki iz »Kasneje« v docs/uskladitev.md, 2026-10-18):
//   - legenda nad rešeno mrežo je stavek »Temne števke so začetek uganke, modre so rešitev.« (prej »5 dana 5 izpeljana«,
//     ki se bere kot štetje); »Temne« v barvi danih števk rešitve, »modre« v barvi izpeljanih;
//   - sprememba vnosne mreže po »Reši« skrije kartici »Rešitev« in »Koraki reševanja« (kot »Reši« z drugimi danostmi);
//     znak, ki mreže ne spremeni, ju pusti.
// Nadomestni DOM ne parsira HTML – legenda se preveri v besedilu app/index.html in app/app.css. Pravo tipkanje in
// izračunane barve: tools/preveri-videz-brskalnik.js (legenda).
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const KOREN = path.join(__dirname, '..');
const beri = f => fs.readFileSync(path.join(KOREN, f), 'utf8');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js',
  'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'app/app.js', 'app/zbirka.js'];

// "Reši" teče v setTimeout - počakaj, da status ni več "Rešujem …".
async function resi(dom) {
  dom.klikni('solveBtn');
  for (let t = 0; t < 400 && dom.el('status').textContent === 'Rešujem …'; t++) await new Promise(r => setTimeout(r, 25));
}
// Vgrajeni primer P_14, »Reši« in »Pokaži korake reševanja«.
async function resenPrimer() {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(`exampleSelect.value = String(PRIMERI.findIndex(p => p.ime === 'P_14')); exampleSelect.sprozi('change')`);
  await resi(dom);
  dom.klikni('openStepsBtn');
  assert.equal(dom.el('results').style.display, 'block');
  assert.equal(dom.el('stepsCard').style.display, 'block');
  return { dom, run };
}
// Vtipka znak v celico i (kot brskalnik: vrednost, nato dogodek input).
const vtipkaj = (run, i, znak) => run(`inputs[${i}].value = ${JSON.stringify(znak)}; inputs[${i}].sprozi('input')`);
const prvaPrazna = run => run(`inputs.findIndex(x => !x.value)`);
const prvaPolna = run => run(`inputs.findIndex(x => x.value)`);

// Deklaracije pravila v CSS (izbirnik natanko tak, kot je zapisan).
function pravilo(f, izbirnik) {
  const css = beri(f).replace(/\/\*[\s\S]*?\*\//g, '');
  const najdena = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].trim() === izbirnik);
  assert.equal(najdena.length, 1, `${f}: pravilo ${izbirnik} (najdenih ${najdena.length})`);
  return Object.fromEntries(najdena[0][2].split(';').map(d => d.split(':').map(s => s.trim())).filter(d => d[0]));
}

test('legenda nad rešitvijo: stavek, »Temne« v barvi danih, »modre« v barvi izpeljanih števk', () => {
  const html = beri('app/index.html');
  const kartica = /<div class="card" id="results">([\s\S]*?)<div id="solvedGrid">/.exec(html);
  assert.ok(kartica, 'kartica »Rešitev« pred mrežo');
  const legenda = /<p class="legend-grid">([\s\S]*?)<\/p>/.exec(kartica[1]);
  assert.ok(legenda, 'legenda je odstavek .legend-grid nad rešeno mrežo');
  assert.equal(legenda[1].replace(/<[^>]+>/g, ''), 'Temne števke so začetek uganke, modre so rešitev.');
  assert.match(legenda[1], /<b class="vz-dana">Temne<\/b>/);
  assert.match(legenda[1], /<b class="vz-izpeljana">modre<\/b>/);
  assert.doesNotMatch(kartica[1], /izpeljana</, 'stare legende »5 dana 5 izpeljana« ni več');

  const dana = pravilo('app/app.css', '#solvedGrid div.was-given');
  const izpeljana = pravilo('app/app.css', '#solvedGrid div.was-solved');
  assert.equal(pravilo('app/app.css', '.legend-grid .vz-dana').color, dana.color);
  assert.equal(pravilo('app/app.css', '.legend-grid .vz-izpeljana').color, izpeljana.color);
});

test('sprememba celice po »Reši« skrije kartici »Rešitev« in »Koraki reševanja« in vrstico stanja', async () => {
  const { dom, run } = await resenPrimer();
  assert.equal(dom.el('status').textContent, 'Rešeno v 69 korakih.');
  vtipkaj(run, prvaPrazna(run), '5');
  assert.equal(dom.el('results').style.display, 'none', 'stara rešitev se ne pokaže');
  assert.equal(dom.el('stepsCard').style.display, 'none', 'stari koraki se ne pokažejo');
  assert.equal(dom.el('openStepsBtn').textContent, 'Pokaži korake reševanja');
  assert.equal(dom.el('status').textContent, '', 'stanje stare rešitve se ne pokaže');
  assert.equal(dom.el('status').className, '');
});

test('brisanje dane števke po »Reši« skrije obe kartici in vrstico stanja', async () => {
  const { dom, run } = await resenPrimer();
  vtipkaj(run, prvaPolna(run), '');
  assert.equal(dom.el('results').style.display, 'none');
  assert.equal(dom.el('stepsCard').style.display, 'none');
  assert.equal(dom.el('status').textContent, '');
});

test('znak, ki mreže ne spremeni (črka v prazni celici), kartici in vrstico stanja pusti', async () => {
  const { dom, run } = await resenPrimer();
  vtipkaj(run, prvaPrazna(run), 'a');
  assert.equal(dom.el('results').style.display, 'block');
  assert.equal(dom.el('stepsCard').style.display, 'block');
  assert.equal(dom.el('status').textContent, 'Rešeno v 69 korakih.');
});

test('sporočilo zavrnjenega »Reši« (podvojene števke) ostane ob naslednjem vpisu', async () => {
  const { dom, run } = await resenPrimer();
  // Prvo prazno celico izpolni s števko, ki je že v njeni vrstici - konflikt.
  run(`(() => { const i = inputs.findIndex(x => !x.value); const r = Math.floor(i / 9);
    const d = inputs.slice(r * 9, r * 9 + 9).find(x => x.value).value; inputs[i].value = d; inputs[i].sprozi('input'); })()`);
  await resi(dom);
  const zavrnitev = dom.el('status').textContent;
  assert.match(zavrnitev, /^Popravi rdeče označene celice/);
  // Vpis števke rešitve v drugo prazno celico - mreža se spremeni, sporočilo ostane.
  run(`(() => { const i = inputs.findIndex(x => !x.value); inputs[i].value = String(lastSolve.grid[i]); inputs[i].sprozi('input'); })()`);
  assert.equal(dom.el('status').textContent, zavrnitev);
});

test('po spremembi in znova »Reši« se pokaže nova rešitev, koraki se zgradijo na novo', async () => {
  const { dom, run } = await resenPrimer();
  // Števka rešitve v prvo prazno celico - uganka ostane enolična, rešitev ima manj korakov.
  run(`(() => { const i = inputs.findIndex(x => !x.value); inputs[i].value = String(lastSolve.grid[i]); inputs[i].sprozi('input'); })()`);
  assert.equal(dom.el('results').style.display, 'none');
  await resi(dom);
  assert.equal(dom.el('results').style.display, 'block');
  assert.equal(dom.el('stepsCard').style.display, 'none');
  dom.klikni('openStepsBtn');
  assert.equal(dom.el('stepsCard').style.display, 'block');
  const n = run('lastSolve.log.length');
  assert.ok(n < 69, n);
  assert.equal(dom.el('progress').textContent, `0 / ${n} opravljeno`);
});
