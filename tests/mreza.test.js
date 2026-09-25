'use strict';
// Skupna mreža (shared/mreza.js) v nadomestnem DOM-u (dom-stub.js): izris celic,
// kandidatov, poudarka, izbire, oznak koraka, prikaz samo izbranih celic (vidne) in
// seznami manjkajočih števk - ter igra, ki mrežo uporablja. Stanja so iz uganke v
// docs/uganke.md in iz korakov motorja, ne sestavljena na pamet. Videza (CSS) test
// ne vidi.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
const D = JSON.stringify(danosti);
const prazne = [...danosti].map((ch, i) => (ch === '0' ? i : -1)).filter(i => i >= 0);
const dana = danosti.split('').findIndex(ch => ch !== '0');

// Kontekst z motorjem, stanjem in mrežo; `mr` = ustvarjena mreža, `klikov` = klici obKliku.
function pripravi() {
  const dom = makeDom();
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js'], dom.globals);
  run(`var klikov = []; var el = document.createElement('div');
    var mr = ustvariMrezo(el, { obKliku: (i, e) => klikov.push(i) });
    var igra = novaIgra(${D}); var stanje = stanjeIgre(igra);`);
  return { dom, run };
}

// Kandidati, izrisani v celici (števke na stalnih mestih; prazno mesto = 0).
const izrisaniKandidati = c => c.children.length ? c.children[0].children.map(s => +s.textContent || 0) : null;

test('ustvariMrezo: 81 celic z data-r/data-c, klik sporoči celico', () => {
  const { run } = pripravi();
  const celice = run('mr.celice');
  assert.equal(celice.length, 81);
  assert.equal(run('el.children.length'), 81);
  celice.forEach((c, i) => {
    assert.equal(c.className, 'celica');
    assert.equal(+c.dataset.r, Math.floor(i / 9));
    assert.equal(+c.dataset.c, i % 9);
    assert.equal(c.getAttribute('role'), 'gridcell');
  });
  celice[40].sprozi('click');
  celice[3].sprozi('click');
  assert.deepEqual([...run('klikov')], [40, 3]);
});

test('izris: dane in vpisane števke, kandidati na stalnih mestih, brez kandidatov', () => {
  const { run } = pripravi();
  const res = run(`solutionOf(${D})`);
  const [a, b] = prazne;
  // Vpis in ročno odstranjen kandidat - kandidati v celicah morajo biti natanko iz stanja.
  run(`dodajPotezo(igra, { tip: 'vpis', celica: ${a}, stevka: ${res[a]} }, stanje); stanje = stanjeIgre(igra);`);
  const kb = run(`stanje.kandidati[${b}]`);
  const odstrani = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => (kb & (1 << d)) && d !== res[b]);
  run(`dodajPotezo(igra, { tip: 'kandidat', celica: ${b}, stevka: ${odstrani}, odstrani: true }, stanje); stanje = stanjeIgre(igra);`);
  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati })');
  const celice = run('mr.celice');
  const grid = run('stanje.grid');
  const kand = run('stanje.kandidati');
  for (let i = 0; i < 81; i++) {
    const c = celice[i];
    if (grid[i]) {
      assert.equal(c.textContent, String(grid[i]));
      assert.equal(c.className, danosti[i] !== '0' ? 'celica dana' : 'celica vpis', `celica ${i}`);
    } else {
      assert.equal(c.className, 'celica');
      assert.deepEqual(izrisaniKandidati(c), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (kand[i] & (1 << d) ? d : 0)), `kandidati ${i}`);
    }
  }
  assert.equal(celice[a].className, 'celica vpis');
  assert.ok(!izrisaniKandidati(celice[b]).includes(odstrani), 'ročno odstranjen kandidat ni prikazan');

  // Brez kandidatov (npr. vaji enojčkov): prazne celice so prazne.
  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: null })');
  assert.equal(celice[b].children.length, 0);
  assert.equal(celice[b].textContent, '');
  assert.equal(celice[dana].className, 'celica dana');
});

test('izris: poudarek, izbira in sosede, prazna in zaklenjena mreža', () => {
  const { run } = pripravi();
  const v = +danosti[dana];
  const p = prazne.find(i => run(`stanje.kandidati[${i}]`) & (1 << v));
  run(`mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati,
    barva: d => d === ${v} ? 2 : -1, izbrane: [${p}], sosede: ${p} })`);
  const celice = run('mr.celice');
  assert.ok(celice[dana].className.includes('poud-stevka') && celice[dana].className.includes('b2'));
  assert.equal(izrisaniKandidati(celice[p])[v - 1], v);
  assert.equal(celice[p].children[0].children[v - 1].className, 'kand poud b2');
  assert.ok(celice[p].className.includes('izbrana'));
  const peers = run(`[...PEERS[${p}]]`);
  for (let i = 0; i < 81; i++) {
    if (i === p) continue;
    assert.equal(celice[i].className.includes('soseda'), peers.includes(i), `soseda ${i}`);
  }
  // Več izbranih celic brez senčenja sosed (sosede: null).
  run(`mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, izbrane: [${prazne[0]}, ${prazne[1]}], sosede: null })`);
  assert.equal(celice.filter(c => c.className.includes('soseda')).length, 0);
  assert.equal(celice.filter(c => c.className.includes('izbrana')).length, 2);

  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, zaklenjena: true })');
  assert.ok(run('el.className').includes('zaklenjena'));
  run('mr.izrisi({ prazna: true })');
  assert.ok(run('el.className').includes('prazna'));
  assert.ok(!run('el.className').includes('zaklenjena'));
  assert.ok(celice.every(c => c.className === 'celica' && c.textContent === ''));
});

test('oznakeKoraka: vzorec, izbrisi in vpis; izveden izbris ni več označen', () => {
  const { run } = pripravi();
  // Prvi korak motorja z izbrisom kandidatov (pot do njega z nextStep, kot v igri).
  // Enojčki na poti se vpišejo kot poteze igre.
  run(`var korak = null;
    for (;;) {
      korak = nextStep(stanje.deska, ALL_TECHNIQUES);
      if (!korak || korak.eliminate.length) break;
      for (const [c, d] of korak.assign) { dodajPotezo(igra, { tip: 'vpis', celica: c, stevka: d }, stanje); stanje = stanjeIgre(igra); }
    }`);
  assert.ok(run('korak && korak.eliminate.length > 0'), 'na poti je korak z izbrisom');
  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, oznake: oznakeKoraka(korak, stanje) })');
  const k = run('korak');
  const celice = run('mr.celice');
  const [c0, d0] = k.eliminate[0];
  assert.equal(celice[c0].className, 'celica k-izbris');
  assert.ok(celice[c0].children[0].children[d0 - 1].className.includes('k-izbris'));
  for (const c of k.cells) assert.ok(celice[c].className.includes('k-vzorec'), `vzorec ${c}`);

  // Izveden izbris ni več označen (celica brez drugih izbrisov izgubi podlago).
  run(`dodajPotezo(igra, { tip: 'kandidat', celica: ${c0}, stevka: ${d0}, odstrani: true }, stanje); stanje = stanjeIgre(igra);`);
  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, oznake: oznakeKoraka(korak, stanje) })');
  const drugi = k.eliminate.filter(([c]) => c === c0).length > 1;
  assert.equal(celice[c0].className.includes('k-izbris'), drugi);
  assert.equal(izrisaniKandidati(celice[c0])[d0 - 1], 0);
  assert.equal(run('oznakeKoraka(null, stanje)'), null);

  // Korak z vpisom (enojček): celica in kandidat za vpis.
  const { run: run2 } = pripravi();
  const e = run2('nextStep(stanje.deska, ALL_TECHNIQUES)');
  assert.ok(e.assign.length);
  run2('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, oznake: oznakeKoraka(nextStep(stanje.deska, ALL_TECHNIQUES), stanje) })');
  const [ce, de] = e.assign[0];
  const cel2 = run2('mr.celice');
  assert.equal(cel2[ce].className, 'celica k-vpis');
  assert.equal(cel2[ce].children[0].children[de - 1].className, 'kand k-vpis');
});

test('vidne: prikaz samo izbranih celic na pravih mestih, druge niso klikljive', () => {
  const { run } = pripravi();
  // Vrstica in blok prve prazne celice (kot pri vajah 1 in 2 v treningu).
  const p = prazne[0];
  const vidne = run(`[...new Set([...ROWS[${Math.floor(p / 9)}], ...BOXES[boxOf(${p})]])]`);
  run(`mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati, vidne: ${JSON.stringify(vidne)} })`);
  const celice = run('mr.celice');
  const grid = run('stanje.grid');
  for (let i = 0; i < 81; i++) {
    const c = celice[i];
    if (vidne.includes(i)) {
      assert.ok(!c.className.includes('izven'));
      if (grid[i]) assert.equal(c.textContent, String(grid[i]));
      else assert.equal(c.children.length, 1, `kandidati v ${i}`);
    } else {
      assert.equal(c.className, 'celica izven', `celica ${i}`);
      assert.equal(c.textContent, '');
      assert.equal(c.children.length, 0);
      assert.equal(+c.dataset.r, Math.floor(i / 9), 'mesto celice ostane');
    }
  }
  const zunaj = [...Array(81).keys()].find(i => !vidne.includes(i));
  celice[zunaj].sprozi('click');
  celice[p].sprozi('click');
  assert.deepEqual([...run('klikov')], [p], 'klik zunaj vidnih se ne sporoči');
  // Brez vidne je spet vse prikazano in klikljivo.
  run('mr.izrisi({ grid: stanje.grid, danosti: igra.danosti, kandidati: stanje.kandidati })');
  assert.equal(celice.filter(c => c.className.includes('izven')).length, 0);
  celice[zunaj].sprozi('click');
  assert.deepEqual([...run('klikov')], [p, zunaj]);
});

test('seznami manjkajočih števk: števke, opis, poudarek, skriti seznam', () => {
  const { run } = pripravi();
  run(`var sez = { vrstice: document.createElement('div'), stolpci: document.createElement('div'), bloki: document.createElement('div') };
    var seznami = ustvariSezname(sez);`);
  for (const k of ['vrstice', 'stolpci', 'bloki']) assert.equal(run(`sez.${k}.children.length`), 9);
  const m = run('manjkajoceVEnotah(stanje)');
  const v = 3;
  run(`seznami.izrisi({ maske: manjkajoceVEnotah(stanje), vidni: { vrstice: true, stolpci: true, bloki: false }, barva: d => d === ${v} ? 0 : -1 })`);
  assert.equal(run('sez.bloki.hidden'), true);
  assert.equal(run('sez.vrstice.hidden'), false);
  const ime = { vrstice: 'Vrstica', stolpci: 'Stolpec' };
  for (const k of ['vrstice', 'stolpci']) {
    const polja = run(`sez.${k}.children`);
    polja.forEach((polje, i) => {
      const stevke = polje.children[0].children;
      const manjkajo = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => m[k][i] & (1 << d));
      assert.deepEqual(stevke.map(s => +s.textContent || 0), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (manjkajo.includes(d) ? d : 0)));
      assert.equal(polje.title, `${ime[k]} ${i + 1}: manjkajo ${manjkajo.join(', ')}`);
      assert.equal(polje.getAttribute('aria-label'), polje.title);
      assert.equal(stevke[v - 1].className, manjkajo.includes(v) ? 'kand poud b0' : 'kand');
    });
  }
  // Polna enota: prazen kvadratek in "je polna".
  const res = run(`solutionOf(${D})`);
  run(`igra = novaIgra(${JSON.stringify(res.join(''))}); stanje = stanjeIgre(igra);`);
  run(`seznami.izrisi({ maske: manjkajoceVEnotah(stanje), vidni: { vrstice: true, stolpci: true, bloki: true } })`);
  assert.equal(run('sez.vrstice.children[0].title'), 'Vrstica 1 je polna');
  assert.equal(run('sez.bloki.children[8].title'), 'Blok 9 je poln');
  assert.equal(run('sez.vrstice.children[0].children[0].textContent'), '');
  // Brez uganke: brez opisa, aria-label je ime enote.
  run(`seznami.izrisi({ maske: null, vidni: { vrstice: true, stolpci: true, bloki: true } })`);
  assert.equal(run('sez.stolpci.children[4].title'), '');
  assert.equal(run('sez.stolpci.children[4].getAttribute("aria-label")'), 'Stolpec 5');
});

test('igra na skupni mreži: klik, poudarek, vpis in seznami ustrezajo stanju igre', () => {
  const dom = makeDom();
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/zbirka.js',
    'shared/zbirka-ui.js', 'shared/generator.js', 'igra/shramba.js', 'igra/igra.js'], dom.globals);
  const celice = dom.el('mreza').children;
  assert.equal(celice.length, 81);
  assert.ok(dom.el('mreza').className.includes('prazna'), 'brez uganke je mreža prazna');
  run(`zacniIgro(${D})`);
  const res = run('resitev()');
  const p = prazne[0];
  celice[p].sprozi('click');
  assert.ok(celice[p].className.includes('izbrana'));
  assert.equal(celice.filter(c => c.className.includes('soseda')).length, 20);
  dom.el('nizPoudari').children[res[p] - 1].sprozi('click');
  dom.el('nizVpisi').children[res[p] - 1].sprozi('click');
  assert.equal(run('stanje.grid')[p], res[p]);
  assert.equal(celice[p].className, `celica vpis poud-stevka b0`);
  // Kandidati v vseh praznih celicah so natanko iz stanja igre.
  const kand = run('stanje.kandidati');
  const grid = run('stanje.grid');
  for (let i = 0; i < 81; i++) {
    if (grid[i]) assert.equal(celice[i].textContent, String(grid[i]));
    else assert.deepEqual(izrisaniKandidati(celice[i]), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (kand[i] & (1 << d) ? d : 0)));
  }
  // Stikalo seznama vrstic: seznam je viden, vrstica s p ima števko res[p] vpisano.
  dom.el('stikaloVrstice').checked = true;
  dom.el('stikaloVrstice').sprozi('change');
  assert.equal(dom.el('seznamVrstic').hidden, false);
  assert.equal(dom.el('seznamStolpcev').hidden, true);
  assert.ok(dom.el('igraLayout').className.includes('z-vrsticami'));
  const r = Math.floor(p / 9);
  assert.equal(dom.el('seznamVrstic').children[r].children[0].children[res[p] - 1].textContent, '');
  assert.equal(dom.el('seznamVrstic').children[r].title, `Vrstica ${r + 1}: manjkajo ${[1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => run('manjkajoceVEnotah(stanje)').vrstice[r] & (1 << d)).join(', ')}`);
  // Klik dane celice jo izbere, drugi klik izbiro prekliče.
  celice[dana].sprozi('click');
  assert.ok(celice[dana].className.includes('izbrana'));
  celice[dana].sprozi('click');
  assert.equal(celice.filter(c => c.className.includes('izbrana')).length, 0);
});
