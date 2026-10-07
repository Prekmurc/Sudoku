'use strict';
// Niz danosti (docs/niz-resevalec-nacrt.md): branje niza zbirkaNizDanosti() v
// shared/zbirka.js, skupno igri (okno "Nova uganka") in reševalcu, ter polje Niz v
// reševalcu (app/app.js) v nadomestnem DOM-u. Po nizu se mora reševalec vesti enako
// kot po ročnem vnosu istih števk - tudi pri konfliktu, več rešitvah ali brez
// rešitve. Uganke so iz docs/uganke.md; konflikte, uganko z več rešitvami in brez
// rešitve izpelje program (countSolutions()), ne na pamet.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

// Vrstni red kot <script> v app/index.html.
const DATOTEKE = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'app/app.js', 'app/zbirka.js'];
const uganke = loadPuzzles().map(p => ({ ime: p.ime, danosti: p.danosti.replace(/\./g, '0') }));
const danosti = uganke[0].danosti;

function resevalec() {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  return { dom, run };
}

const { run: E } = resevalec();
// Rezultat iz konteksta kot navaden objekt (polja iz drugega vm konteksta imajo drug
// prototip, zato deepEqual ne bi uspel).
const beri = s => JSON.parse(E(`JSON.stringify(zbirkaNizDanosti(${JSON.stringify(s)}))`));

/* ---------- zbirkaNizDanosti() ---------- */

test('niz: pike in ničle dajo iste danosti', () => {
  const s = beri(danosti.replace(/0/g, '.'));
  assert.equal(s.danosti, danosti);
  assert.equal(s.veljavnih, 81);
  assert.equal(s.sporocilo, 'Niz je vpisan v mrežo.');
  assert.equal(s.napaka, false);
  assert.deepEqual(s.neveljavni, []);
  assert.equal(beri(danosti).danosti, danosti);
});

test('niz: presledki, prelomi vrstic in ločila mreže se izpustijo brez opozorila', () => {
  const vrstice = danosti.match(/.{9}/g);
  const mreza = vrstice.map(v => `| ${v.slice(0, 3)} | ${v.slice(3, 6)} | ${v.slice(6)} |`).join('\r\n+-----+-----+-----+\r\n');
  const s = beri('\t' + mreza + '\n');
  assert.equal(s.danosti, danosti);
  assert.deepEqual(s.neveljavni, []);
});

test('niz: napačna dolžina - besedila kot v igri, mreža se ne izpolni', () => {
  assert.deepEqual(beri(danosti.slice(0, 80)), {
    danosti: null, veljavnih: 80, neveljavni: [], napaka: true,
    sporocilo: 'Veljavnih znakov v nizu: 80 (potrebnih je 81).',
  });
  assert.equal(beri(danosti + '5').sporocilo, 'Veljavnih znakov v nizu: 82 (potrebnih je 81).');
  assert.deepEqual(beri(''), { danosti: null, veljavnih: 0, neveljavni: [], sporocilo: '', napaka: false });
  assert.equal(beri('  | + - \n').sporocilo, '', 'samo presledki in ločila: brez sporočila');
});

test('niz: neveljavni znaki so našteti (vsak enkrat, po vrstnem redu), sklanjanje 1 / 2 / 3+', () => {
  const x = beri(danosti.replace(/0/g, 'x'));
  const danih = danosti.replace(/0/g, '').length;
  assert.equal(x.danosti, null);
  assert.deepEqual(x.neveljavni, ['x']);
  assert.equal(x.sporocilo, `Veljavnih znakov v nizu: ${danih} (potrebnih je 81). Neveljaven znak »x« je izpuščen – prazna celica je 0 ali pika.`);
  assert.equal(beri('x*' + danosti.slice(2) + 'x').sporocilo,
    'Veljavnih znakov v nizu: 79 (potrebnih je 81). Neveljavna znaka »x« in »*« sta izpuščena – prazna celica je 0 ali pika.');
  assert.equal(beri('a' + danosti.slice(3) + 'b,').sporocilo,
    'Veljavnih znakov v nizu: 78 (potrebnih je 81). Neveljavni znaki »a«, »b« in »,« so izpuščeni – prazna celica je 0 ali pika.');
  assert.equal(beri('abc').sporocilo,
    'Veljavnih znakov v nizu: 0 (potrebnih je 81). Neveljavni znaki »a«, »b« in »c« so izpuščeni – prazna celica je 0 ali pika.', 'tudi brez veljavnih znakov');
  assert.equal(beri('abcdefghijk').sporocilo,
    'Veljavnih znakov v nizu: 0 (potrebnih je 81). Neveljavni znaki »a«, »b«, »c«, »d«, »e«, »f«, »g« in »h« (in še 3) so izpuščeni – prazna celica je 0 ali pika.', 'največ osem');
  // 81 veljavnih znakov: niz je sprejet, neveljavni so samo zapisani.
  const sprejet = beri('x' + danosti);
  assert.equal(sprejet.danosti, danosti);
  assert.equal(sprejet.sporocilo, 'Niz je vpisan v mrežo.');
  assert.deepEqual(sprejet.neveljavni, ['x']);
});

test('niz: vse uganke iz docs/uganke.md in vgrajeni primeri krožno', () => {
  for (const u of uganke) assert.equal(beri(u.danosti.replace(/0/g, '.')).danosti, u.danosti, u.ime);
  for (const p of JSON.parse(E('JSON.stringify(PRIMERI)'))) {
    assert.equal(beri(p.danosti).danosti, p.danosti.replace(/\./g, '0'), p.ime);
  }
});

/* ---------- polje Niz v reševalcu ---------- */

const vpisiNiz = (dom, v) => { dom.el('nizDanosti').value = v; dom.el('nizDanosti').sprozi('input'); };
// Ročni vnos: vsaka neprazna celica kot vtipkana števka (dogodek input).
function vtipkaj(run, d) {
  run(`inputs.forEach(inp => { inp.value = ''; })`);
  for (let i = 0; i < 81; i++) if (d[i] !== '0') run(`inputs[${i}].value = '${d[i]}'; inputs[${i}].sprozi('input')`);
}
const mreza = run => JSON.parse(run('JSON.stringify(inputs.map(inp => [inp.value, inp.className]))'));
const status = dom => [dom.el('status').textContent, dom.el('status').className];

// "Reši" teče v setTimeout - počakaj, da status ni več "Rešujem …".
async function resi(dom) {
  dom.klikni('solveBtn');
  for (let t = 0; t < 400 && dom.el('status').textContent === 'Rešujem …'; t++) await new Promise(r => setTimeout(r, 25));
}

test('reševalec: veljaven niz izpolni vso mrežo in skrije prejšnjo rešitev', async () => {
  const { dom, run } = resevalec();
  vtipkaj(run, uganke[1].danosti);
  await resi(dom);
  assert.equal(dom.el('results').style.display, 'block');
  vpisiNiz(dom, danosti.replace(/0/g, '.'));
  assert.equal(run('currentGivens()'), danosti, 'niz prepiše vso mrežo');
  assert.deepEqual(status(dom), [`Niz je vpisan v mrežo – danih števk: ${danosti.replace(/0/g, '').length}.`, '']);
  assert.equal(dom.el('results').style.display, 'none');
  assert.equal(run('lastSolve'), null);
  assert.equal(dom.el('nizStatus').textContent, '');
  assert.equal(dom.el('nizDanosti').value, danosti.replace(/0/g, '.'), 'niz ostane v polju');
});

test('reševalec: nepopoln niz pusti mrežo in glavni status, sporočilo je pod poljem', async () => {
  const { dom, run } = resevalec();
  vtipkaj(run, danosti);
  await resi(dom);
  const prej = status(dom);
  assert.equal(prej[1], 'ok');
  vpisiNiz(dom, 'x' + uganke[1].danosti.slice(1, 60));
  assert.equal(run('currentGivens()'), danosti);
  assert.deepEqual(status(dom), prej, 'glavni status (»Rešeno …«) ostane');
  assert.equal(dom.el('results').style.display, 'block', 'rešitev ostane');
  assert.equal(dom.el('nizStatus').textContent,
    'Veljavnih znakov v nizu: 59 (potrebnih je 81). Neveljaven znak »x« je izpuščen – prazna celica je 0 ali pika.');
  assert.equal(dom.el('nizStatus').className, 'err');
  vpisiNiz(dom, '');
  assert.equal(dom.el('nizStatus').textContent, '', 'prazno polje počisti sporočilo');
});

test('reševalec: Počisti, Primer in Odpri izpraznijo polje Niz', () => {
  const { dom, run } = resevalec();
  vpisiNiz(dom, danosti);
  dom.klikni('clearBtn');
  assert.equal(dom.el('nizDanosti').value, '');
  assert.equal(run('currentGivens()'), '0'.repeat(81));

  vpisiNiz(dom, 'abc');
  dom.el('exampleSelect').value = '0';
  dom.el('exampleSelect').sprozi('change');
  assert.equal(dom.el('nizDanosti').value, '', 'Primer');
  assert.equal(dom.el('nizStatus').textContent, '');
  assert.equal(run('currentGivens()'), run('PRIMERI[0].danosti').replace(/\./g, '0'));

  vpisiNiz(dom, danosti);
  run(`naloziDanosti(${JSON.stringify(uganke[1].danosti)}, 'Naložena uganka iz zbirke.')`); // kot »Odpri«
  assert.equal(dom.el('nizDanosti').value, '', 'Odpri');
});

// Isti vnos po nizu in ročno: mreža (vrednosti in razredi), »Pokaži kandidate«
// (prikazani ali zavrnitev s statusom), status po »Reši«, zbirka. Status pred tem se
// razlikuje namenoma (po nizu »Niz je vpisan v mrežo …«).
async function primerjajZRocnim(d) {
  const izid = [];
  for (const nacin of ['niz', 'rocno']) {
    const { dom, run } = resevalec();
    if (nacin === 'niz') vpisiNiz(dom, d); else vtipkaj(run, d);
    const m = mreza(run);
    dom.klikni('candBtn');
    const kandidati = dom.el('candSection').style.display === 'block' ? 'prikazani' : status(dom);
    await resi(dom);
    izid.push({ m, kandidati, resi: status(dom), zbirka: dom.el('libraryBtn').textContent, shrani: dom.el('saveMsg').textContent });
  }
  assert.deepEqual(izid[0], izid[1]);
  return izid[0];
}

// Konflikt v eni sami enoti: prva prazna celica dobi števko, ki je dana v tej enoti
// in v drugih dveh enotah celice ni.
function konflikt(vrsta) {
  const enota = { vrstica: 'ROWS', stolpec: 'COLS', blok: 'BOXES' };
  const enoteCelice = c => Object.fromEntries(Object.entries(enota).map(([k, ime]) => [k, E(`${ime}.find(u => u.includes(${c}))`)]));
  for (let c = 0; c < 81; c++) {
    if (danosti[c] !== '0') continue;
    const e = enoteCelice(c);
    const v = (k) => new Set(e[k].map(i => danosti[i]).filter(x => x !== '0'));
    for (const d of v(vrsta)) {
      if (Object.keys(enota).some(k => k !== vrsta && v(k).has(d))) continue;
      return danosti.slice(0, c) + d + danosti.slice(c + 1);
    }
  }
  throw new Error('konflikta ni');
}

for (const vrsta of ['vrstica', 'stolpec', 'blok']) {
  test(`reševalec: konflikt (${vrsta}) po nizu je enak kot po ročnem vnosu`, async () => {
    const r = await primerjajZRocnim(konflikt(vrsta));
    assert.equal(r.m.filter(([, razred]) => razred.includes('conflict')).length, 2, 'dve rdeči celici');
    assert.deepEqual(r.kandidati, ['Popravi rdeče označene celice, preden prikažem kandidate.', 'err']);
    assert.deepEqual(r.resi, ['Popravi rdeče označene celice – ista števka se ponavlja v isti vrstici, stolpcu ali bloku.', 'err']);
  });
}

test('reševalec: popravek konflikta ročno po nizu odstrani rdečo kot pri ročnem vnosu', () => {
  const { dom, run } = resevalec();
  const d = konflikt('vrstica');
  vpisiNiz(dom, d);
  const c = [...d].findIndex((ch, i) => ch !== danosti[i]);
  run(`inputs[${c}].value = ''; inputs[${c}].sprozi('input')`);
  assert.equal(mreza(run).filter(([, razred]) => razred.includes('conflict')).length, 0);
});

test('reševalec: uganka z eno rešitvijo po nizu - enako kot ročni vnos (tudi zbirka)', async () => {
  const r = await primerjajZRocnim(danosti);
  assert.equal(r.resi[1], 'ok');
  assert.equal(r.zbirka, 'Zbirka (1)');
});

test('reševalec: več rešitev po nizu - enako kot ročni vnos', async () => {
  // Odstranjuj danosti, dokler uganka nima več kot ene rešitve.
  let d = danosti;
  for (let i = 0; i < 81 && E(`countSolutions(${JSON.stringify(d)})`) === 1; i++) {
    if (d[i] !== '0') d = d.slice(0, i) + '0' + d.slice(i + 1);
  }
  assert.equal(E(`countSolutions(${JSON.stringify(d)})`), 2, 'program potrdi več rešitev');
  const r = await primerjajZRocnim(d);
  assert.equal(r.resi[1], 'warn');
  assert.match(r.resi[0], /nima natanko ene rešitve/);
  assert.equal(r.zbirka, 'Zbirka (0)', 'ne shrani se');
});

test('reševalec: brez rešitve po nizu - enako kot ročni vnos', async () => {
  // Prazna celica dobi kandidata, ki ni v rešitvi: brez konflikta, a brez rešitve.
  const resitev = E(`solutionOf(${JSON.stringify(danosti)})`);
  const b = E(`new Board(${JSON.stringify(danosti)})`);
  const c = [...danosti].findIndex((ch, i) => ch === '0' && (b.cand[i] & ~(1 << Number(resitev[i])) & 0x3fe));
  const dd = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(x => x !== Number(resitev[c]) && (b.cand[c] & (1 << x)));
  const d = danosti.slice(0, c) + dd + danosti.slice(c + 1);
  assert.equal(E(`countSolutions(${JSON.stringify(d)})`), 0, 'program potrdi, da rešitve ni');
  const r = await primerjajZRocnim(d);
  assert.deepEqual(r.resi, ['Uganka nima rešitve – preveri vnesene števke.', 'err']);
  assert.equal(r.m.filter(([, razred]) => razred.includes('conflict')).length, 0, 'brez konflikta');
});

test('reševalec: vgrajeni primer po nizu - enako kot ročni vnos (v zbirko se ne shrani)', async () => {
  const primer = E('PRIMERI[4].danosti').replace(/\./g, '0');
  const r = await primerjajZRocnim(primer);
  assert.equal(r.zbirka, 'Zbirka (0)');
  assert.equal(r.shrani, 'Vgrajeni primer – v zbirko se ne shrani.');
});
