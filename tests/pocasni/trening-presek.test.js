'use strict';
// Vaji 1 · Izločitev izven bloka in 2 · Izločitev v bloku v načinu "Spoznaj" na pravi
// mreži (docs/geometrija-1-2-nacrt.md): generator genPresek() v trening/generators.js
// vzame stanje prave uganke iz banke vaj (shared/vaje-banka.js) in korak motorja, na
// mreži sta vidna samo blok in vrstica/stolpec koraka. Nič ni sestavljeno na pamet -
// uganke so iz banke (ena rešitev preverja tests/pocasni/vaje-banka.test.js), korake izračuna
// motor. Zagon (vsi testi): node --test "tests/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('../load-engine.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js',
  'shared/vaje-banka.js', 'trening/generators.js'];

// Kontekst z Math.random s semenom (mulberry32) - vaje so ponovljive.
function pripravi(seme) {
  const { run } = loadContext(DATOTEKE);
  run(`var seme = ${seme}; Math.random = () => {
    seme = (seme + 0x6D2B79F5) | 0;
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };`);
  // Vrednosti iz konteksta v navadne objekte tega procesa (deepEqual primerja tudi prototipe).
  return izraz => JSON.parse(JSON.stringify(run(izraz)));
}

const KROGOV = 12; // po 9 vaj
const MODE = { pointing: 'Pointing pair/triple', 'box-line': 'Box-line reduction' };

for (const [mode, kljuc] of Object.entries(MODE)) {
  test(`${mode}: vaja je korak motorja v stanju prave uganke, vidna sta samo blok in enota`, () => {
    const run = pripravi(20260927);
    const t0 = process.hrtime.bigint();
    const vaje = run(`Array.from({ length: ${KROGOV * 9} }, (_, i) => genPresek(i % 9, '${mode}'))`);
    const msNaVajo = Number(process.hrtime.bigint() - t0) / 1e6 / vaje.length;
    const banka = run(`VAJE_BANKA.filter(z => z.tehnike.includes('${kljuc}')).map(z => z.danosti)`);
    const [ROWS, COLS, BOXES] = run('[ROWS, COLS, BOXES]');
    const PEERS = run('PEERS.map(s => [...s])');

    for (const [i, ex] of vaje.entries()) {
      const ime = `vaja ${i}`;
      assert.ok(banka.includes(ex.danosti), `${ime}: uganka je iz banke`);
      // Stanje in korak znova izračuna motor: S0 (vpisi in kandidati) je stanje na poti,
      // korak mora biti med koraki tehnike v njem.
      const pravi = run(`(() => {
        const D = ${JSON.stringify(ex.danosti)};
        for (const S of stanjaVUganki(D, '${kljuc}').stanja) {
          const v = vajaIzStanja(D, '${kljuc}', S, '');
          if (v.S0.grid.join() === ${JSON.stringify(ex.grid.join())} && v.S0.kandidati.join() === ${JSON.stringify(ex.kandidati.join())}) {
            return { KT: v.KT.map(k => ({ cells: k.cells, eliminate: k.eliminate })) };
          }
        }
        return null;
      })()`);
      assert.ok(pravi, `${ime}: stanje (vpisi in kandidati) je na poti motorja`);
      // (Iste celice ima lahko tudi korak z drugo števko, zato se primerja še izbrise.)
      const korak = pravi.KT.find(k => k.cells.join() === ex.solutionCells.join() && JSON.stringify(k.eliminate) === JSON.stringify(ex.solutionEliminate));
      assert.ok(korak, `${ime}: korak vaje (celice in izbrisi) je korak tehnike v S0`);
      assert.equal(ex.digit, korak.eliminate[0][1]);

      // Vidne celice: natanko blok ∪ vrstica/stolpec koraka (15 celic).
      const enota = ex.jeVrstica ? ROWS[ex.enotaSt] : COLS[ex.enotaSt];
      const blok = BOXES[ex.blok];
      const vidne = new Set(ex.vidne);
      assert.equal(vidne.size, 15, `${ime}: 15 vidnih celic`);
      assert.deepEqual([...vidne].sort((a, b) => a - b), [...new Set([...blok, ...enota])].sort((a, b) => a - b));
      // Celice koraka so v preseku, izbrisi v vidnem delu druge enote (zunaj primarne).
      const primarna = mode === 'pointing' ? blok : enota;
      const druga = mode === 'pointing' ? enota : blok;
      assert.deepEqual([...ex.primaryCells], primarna);
      for (const c of ex.solutionCells) assert.ok(blok.includes(c) && enota.includes(c), `${ime}: celica ${c} v preseku`);
      for (const [c] of ex.solutionEliminate) assert.ok(druga.includes(c) && !primarna.includes(c), `${ime}: izbris ${c}`);
      // Kandidat d je v primarni enoti natanko v celicah koraka - vzorec se vidi na mreži.
      const zD = primarna.filter(c => !ex.grid[c] && (ex.kandidati[c] & (1 << ex.digit)));
      assert.deepEqual(zD, ex.solutionCells, `${ime}: kandidat ${ex.digit} v primarni enoti`);
      // Skladnost: noben kandidat vidne celice ni števka, vpisana v vidni sosedi.
      for (const c of vidne) {
        if (ex.grid[c]) continue;
        for (const p of PEERS[c]) {
          if (vidne.has(p) && ex.grid[p]) assert.ok(!(ex.kandidati[c] & (1 << ex.grid[p])), `${ime}: kandidat ${ex.grid[p]} v ${c}`);
        }
      }
      // Odgovor je enoličen: noben drug korak tehnike s to števko ni v celoti med vidnimi.
      const drugi = pravi.KT.filter(k => k !== korak && k.eliminate[0][1] === ex.digit && k.cells.every(c => vidne.has(c)));
      assert.equal(drugi.length, 0, `${ime}: drug vzorec iste števke med vidnimi`);
      // Besedila se ujemajo z blokom, enoto in števko.
      const lineLabel = `${ex.jeVrstica ? 'Vrstica' : 'Stolpec'} ${ex.enotaSt + 1}`;
      assert.equal(ex.unitLabel, mode === 'pointing' ? `Blok ${ex.blok + 1} → ${lineLabel}` : `${lineLabel} → Blok ${ex.blok + 1}`);
      assert.ok(ex.desc.startsWith(`Števka ${ex.digit}: v `), ex.desc);
      assert.ok(ex.desc.includes(mode === 'pointing' ? `bloku ${ex.blok + 1}` : `${ex.jeVrstica ? 'vrstici' : 'stolpcu'} ${ex.enotaSt + 1}`), ex.desc);
      // Opis pove, iz česa se števka izbriše (faza 6): pri 1 iz vrstice/stolpca zunaj bloka, pri 2 iz bloka.
      const vrsta = `${ex.jeVrstica ? 'vrstice' : 'stolpca'} ${ex.enotaSt + 1}`;
      assert.ok(ex.desc.endsWith(mode === 'pointing' ? `Iz ${vrsta} zunaj bloka jo potem lahko izbrišeš.`
        : `Iz bloka ${ex.blok + 1} zunaj ${ex.jeVrstica ? 'vrstice' : 'stolpca'} jo potem lahko izbrišeš.`), ex.desc);
    }
    // Raznolikost: več različnih ugank, vrstice in stolpci.
    assert.ok(new Set(vaje.map(v => v.danosti)).size > vaje.length / 2, 'različne uganke');
    assert.ok(vaje.some(v => v.jeVrstica) && vaje.some(v => !v.jeVrstica), 'vrstice in stolpci');
    assert.ok(msNaVajo < 200, `čas na vajo ${msNaVajo.toFixed(0)} ms`);
  });

  test(`${mode}: korak z drugim vzorcem iste števke s samimi vidnimi celicami je za vajo neprimeren`, () => {
    const run = pripravi(1);
    // Vsa stanja vseh ugank banke s tehniko: presekEnolicen() zavrne natanko korake, pri
    // katerih je na delni mreži (blok in enota koraka) še drug korak tehnike z isto
    // števko, katerega celice so vse vidne - isti pogoj kot "odgovor je enoličen" zgoraj.
    // Pri izločitvi v bloku še minimalna uganka iz semena 16924 (v banki do ocene 2026-10-04,
    // dva taka koraka) - banka po oceni 2026-10-04 takih korakov nima (0 od 326 pri 2, 0 od 2045
    // pri 1), pogoj pa se mora res uveljaviti.
    const r = run(`(() => { let zavrnjenih = 0, korakov = 0, razlik = 0;
      const dodatne = ${JSON.stringify(mode === 'box-line' ? [16924] : [])}.map(s => ({ danosti: genMinimalnaUganka(s) }));
      for (const z of [...VAJE_BANKA.filter(z => z.tehnike.includes('${kljuc}')), ...dodatne]) {
        for (const S of stanjaVUganki(z.danosti, '${kljuc}').stanja) {
          const v = vajaIzStanja(z.danosti, '${kljuc}', S, '');
          for (const k of v.KT) {
            korakov++;
            const vid = new Set(vajaPreseka('${mode}', v, k).vidne);
            const drugi = v.KT.some(x => x !== k && x.eliminate[0][1] === k.eliminate[0][1] && x.cells.every(c => vid.has(c)));
            if (presekEnolicen('${mode}', v, k) === drugi) razlik++;
            if (drugi) zavrnjenih++;
          }
        }
      }
      return { zavrnjenih, korakov, razlik }; })()`);
    assert.equal(r.razlik, 0, 'presekEnolicen() se ujema s pogojem testa');
    assert.ok(r.korakov > 100, `${r.korakov} korakov`);
    // Uganka iz semena 16924 take korake ima - pogoj se res uveljavi.
    if (mode === 'box-line') assert.ok(r.zavrnjenih > 0, 'taki koraki so (seme 16924) - pogoj se res uveljavi');
  });

  // Trojica v krogu po O9 (docs/trening-ucenje-nacrt.md): vaji 1 in 2 sta po shemi (genPoShemi) - pri 1
  // para, zato je vaja s trojico izbrana med vajami 3-9; pri 2 sta trojici, zato se nobena ne vsili.
  test(`${mode}: v vsakem krogu 9 vaj je vsaj ena vaja s tremi celicami, druge po resnični pogostosti`, () => {
    const { run: r } = loadContext([...DATOTEKE, 'shared/sheme.js']);
    r(`var seme = 7; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };`);
    const krogi = JSON.parse(r(`JSON.stringify(Array.from({ length: ${KROGOV} }, () => Array.from({ length: 9 }, (_, n) => {
      const ex = genPoShemi('${mode}', n) || genPresek(n, '${mode}');
      return { n, trojica: ex.solutionCells.length === 3, poShemi: !!ex.poShemi, izbrana: n === presekTrojica['${mode}'] };
    })))`));
    let ostalih = 0, ostalihTrojic = 0;
    const mesta = new Set();
    for (const [i, krog] of krogi.entries()) {
      assert.deepEqual(krog.map(v => v.poShemi), [true, true, false, false, false, false, false, false, false], `krog ${i}: vaji 1 in 2 po shemi`);
      assert.ok(krog.some(v => v.trojica), `krog ${i}: vsaj ena trojica`);
      const izbrana = krog.filter(v => v.izbrana);
      if (mode === 'pointing') {
        assert.ok(!krog[0].trojica && !krog[1].trojica, `krog ${i}: vaji 1 in 2 sta para (shema)`);
        assert.equal(izbrana.length, 1, `krog ${i}: ena izbrana vaja`);
        assert.ok(izbrana[0].n >= 2 && izbrana[0].trojica, `krog ${i}: izbrana vaja (med 3-9) ima tri celice`);
        mesta.add(izbrana[0].n);
      } else {
        assert.ok(krog[0].trojica && krog[1].trojica, `krog ${i}: vaji 1 in 2 sta trojici (shema)`);
        assert.equal(izbrana.length, 0, `krog ${i}: nobena vaja ni vsiljena`);
      }
      for (const v of krog.filter(v => !v.izbrana && !v.poShemi)) { ostalih++; if (v.trojica) ostalihTrojic++; }
    }
    // Mesto vaje s trojico v krogu ni vedno isto.
    if (mode === 'pointing') assert.ok(mesta.size > 1, `mesta trojice: ${[...mesta]}`);
    // Ostale vaje niso prisiljene v trojice (resnična pogostost je pribl. 1 od 10).
    assert.ok(ostalihTrojic < ostalih / 3, `trojic med ostalimi: ${ostalihTrojic} / ${ostalih}`);
  });
}

/* ---------- prikaz v treningu (trening/trening.js) v nadomestnem DOM-u ---------- */

const { makeDom } = require('../dom-stub.js');
const { odpriPomoc, zapriPomoc } = require('../pomoc-stikali.js');
const { spremljajVajo, dokoncajOdgovor } = require('../odgovor-spoznaj.js');
const DATOTEKE_UI = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js',
  'shared/vaje-banka.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'];

// Odprta vaja n tehnike; `zadnja` = vaja, ki jo je dal generator. Privzeto vaja 7 (n = 6) - vaji 1 in 2
// sta po shemi (docs/trening-ucenje-nacrt.md, del A), mimo MODES[].gen.
function odpri(mode, n = 6) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE_UI, dom.globals);
  run(`var zadnja; { const g = MODES['${mode}'].gen; MODES['${mode}'].gen = n => (zadnja = g(n)); }`);
  spremljajVajo(run);
  run(`mode = '${mode}'; exNum = ${n}; scoreRight = 0; scoreTotal = 0; sPomocjo = 0; updateScore(); renderExercise();`);
  return { dom, run };
}
function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const razredi = el => (el.className || '').split(' ');
const gumbUI = (dom, napis) => vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
// Sporočilo pod vajo (innerHTML hrani nadomestni DOM v polju html).
const fbUI = dom => vsi(dom.el('exerciseArea')).find(e => /^fb\b/.test(e.className));
const rezultatUI = dom => `${dom.el('scoreRight').textContent}/${dom.el('scoreTotal').textContent}`;
const imaPoudarek = c => vsi(c).some(s => razredi(s).includes('poud'));

for (const mode of Object.keys(MODE)) {
  test(`${mode}: prikaz - delna mreža s pravimi mesti, oznake robov, poudarjena števka, brez števila kandidatov`, () => {
    const { dom, run } = odpri(mode);
    const ex = JSON.parse(JSON.stringify(run('zadnja')));
    const okvir = vsi(dom.el('exerciseArea')).find(e => razredi(e).includes('vaja-presek'));
    assert.ok(okvir, 'okvir delne mreže');
    assert.ok(razredi(okvir).includes('mreza-robovi'));
    const [, zgoraj, levo, mreza] = okvir.children;
    assert.ok(razredi(mreza).includes('delna'));
    const celice = run('presek.mreza.celice');
    assert.equal(celice.length, 81);
    const vidne = new Set(ex.vidne);
    assert.equal(celice.filter(c => razredi(c).includes('izven')).length, 66);
    for (let i = 0; i < 81; i++) {
      const c = celice[i];
      assert.equal(+c.dataset.r * 9 + +c.dataset.c, i, 'celica na svojem mestu');
      if (!vidne.has(i)) { assert.ok(razredi(c).includes('izven')); continue; }
      if (ex.grid[i]) {
        assert.equal(c.textContent, String(ex.grid[i]));
        assert.ok(razredi(c).includes(ex.danosti[i] !== '0' ? 'dana' : 'vpis'), `celica ${i}: dana ali vpis`);
      } else {
        const kand = c.children[0].children;
        for (let d = 1; d <= 9; d++) {
          const s = kand[d - 1];
          assert.equal(s.textContent, ex.kandidati[i] & (1 << d) ? String(d) : '', `kandidat ${d} v ${i}`);
          assert.equal(razredi(s).includes('poud'), s.textContent === String(ex.digit), `poudarek ${d} v ${i}`);
        }
      }
    }
    // Oznake robov: krepka samo vrstica ali stolpec vaje.
    const krepke = el => el.children.map((s, k) => (s.className === 'akt' ? k : -1)).filter(k => k >= 0);
    assert.deepEqual(krepke(ex.jeVrstica ? levo : zgoraj), [ex.enotaSt]);
    assert.deepEqual(krepke(ex.jeVrstica ? zgoraj : levo), []);
    // Oznaka števke in brez gumba za število kandidatov.
    assert.ok(vsi(dom.el('exerciseArea')).some(e => e.textContent === `Označena števka: ${ex.digit}`));
    assert.ok(!gumbUI(dom, 'Pokaži število kandidatov'), 'gumba za število kandidatov ni');
  });

  test(`${mode}: izbira in preverjanje - skrite in dane celice se ne izberejo, pravilen in napačen odgovor`, () => {
    const { dom, run } = odpri(mode);
    const ex = JSON.parse(JSON.stringify(run('zadnja')));
    const celice = run('presek.mreza.celice');
    const izbrane = () => [...celice.map((c, i) => (razredi(c).includes('izbrana') ? i : -1)).filter(i => i >= 0)];
    const skrita = [...Array(81).keys()].find(i => !ex.vidne.includes(i));
    const dana = ex.vidne.find(i => ex.grid[i]);
    celice[skrita].sprozi('click');
    celice[dana].sprozi('click');
    assert.deepEqual(izbrane(), [], 'skrita in dana celica se ne izbereta');
    // Ena sama celica → "Izberi dve ali tri celice."; ponoven klik izbiro prekliče; največ tri.
    const prazne = ex.vidne.filter(i => !ex.grid[i]);
    celice[prazne[0]].sprozi('click');
    assert.deepEqual(izbrane(), [prazne[0]]);
    gumbUI(dom, 'Preveri').sprozi('click');
    assert.equal(fbUI(dom).textContent, 'Izberi dve ali tri celice.');
    celice[prazne[0]].sprozi('click');
    assert.deepEqual(izbrane(), [], 'ponoven klik izbiro prekliče');
    prazne.slice(0, 4).forEach(i => celice[i].sprozi('click'));
    assert.equal(izbrane().length, Math.min(3, prazne.length), 'največ tri');
    prazne.slice(0, 4).forEach(i => celice[i].sprozi('click'));
    // Napačen odgovor: dve prazni celici, ki nista vzorec.
    const napacne = prazne.filter(i => !ex.solutionCells.includes(i)).slice(0, 2);
    assert.equal(napacne.length, 2);
    run('selected = []; presek.izrisi()');
    napacne.forEach(i => celice[i].sprozi('click'));
    gumbUI(dom, 'Preveri').sprozi('click');
    assert.ok(fbUI(dom).className.includes('err'));
    assert.ok(fbUI(dom).html.startsWith('<b>To še ni pravi vzorec.</b>'), fbUI(dom).html);
    assert.deepEqual(izbrane(), [], 'izbira je po napačnem odgovoru počiščena');
    assert.equal(rezultatUI(dom), '0/1');
    // Pravilen odgovor: celice koraka → "Pravilno!", oznake koraka, poudarek izklopljen.
    ex.solutionCells.forEach(i => celice[i].sprozi('click'));
    dokoncajOdgovor(dom, run);
    assert.ok(fbUI(dom).className.includes('ok'));
    assert.equal(fbUI(dom).html, `<b>Pravilno!</b> ${ex.solutionMessage}`);
    assert.equal(rezultatUI(dom), '1/2');
    for (const i of ex.solutionCells) assert.ok(razredi(celice[i]).includes('k-vzorec'), `vzorec ${i}`);
    for (const [i, d] of ex.solutionEliminate) {
      assert.ok(razredi(celice[i]).includes('k-izbris'), `celica z izbrisom ${i}`);
      assert.ok(razredi(celice[i].children[0].children[d - 1]).includes('k-izbris'), `izbris ${d} v ${i}`);
    }
    assert.ok(!celice.some(imaPoudarek), 'poudarek izklopljen');
    // Po pravilnem odgovoru se nič več ne izbere, oznake ostanejo tudi po ogledu rešitve.
    celice[napacne[0]].sprozi('click');
    assert.deepEqual(izbrane(), []);
    odpriPomoc(dom, 'resitev');
    zapriPomoc(dom, 'resitev');
    assert.ok(ex.solutionCells.every(i => razredi(celice[i]).includes('k-vzorec')));
    assert.equal(rezultatUI(dom), '1/2', 'ogled po pravilnem odgovoru ne spremeni rezultata');
  });

  test(`${mode}: »Rešitev (drži)« pokaže oznake koraka samo med držanjem, namig našteje celice s števko`, () => {
    const { dom, run } = odpri(mode);
    const ex = JSON.parse(JSON.stringify(run('zadnja')));
    const celice = run('presek.mreza.celice');
    odpriPomoc(dom, 'resitev');
    assert.ok(ex.solutionCells.every(i => razredi(celice[i]).includes('k-vzorec')), 'med držanjem je vzorec označen');
    assert.ok(!celice.some(imaPoudarek), 'med držanjem ni poudarka');
    zapriPomoc(dom, 'resitev');
    assert.ok(!celice.some(c => razredi(c).includes('k-vzorec')), 'po spustu oznak ni');
    assert.ok(celice.some(imaPoudarek), 'poudarek je spet vklopljen');
    odpriPomoc(dom, 'namig');
    const namig = vsi(dom.el('exerciseArea')).find(e => /peek-overlay/.test(e.className) && /visible/.test(e.className));
    const polozaji = ex.solutionCells.map(i => `V${Math.floor(i / 9) + 1}S${i % 9 + 1}`).join(', ');
    assert.ok(namig && namig.html.includes(`Kandidat ${ex.digit} se v `) && namig.html.includes(polozaji), namig && namig.html);
    zapriPomoc(dom, 'namig');
  });
}
