'use strict';
// Vaji 1 in 2 »Spoznaj« po shemi (docs/trening-ucenje-nacrt.md, del A) - test raste po korakih.
// Pomožna datoteka: teste registrira registriraj({ vaj, samoVzorec, deli }). Hitri del (vsi testi, testi na
// vzorcu z manjšim vzorcem - 20 vaj) je v dveh datotekah, ki tečeta vzporedno: tests/trening-po-shemi.test.js
// (3-13) in tests/trening-po-shemi-1-2.test.js (1 in 2); počasni tests/pocasni/trening-po-shemi.test.js požene
// samo teste na vzorcu, z 200 vajami vsake tehnike, vsemi semeni in več krogi (polni pregled).
// Vaja 1 je natanko kot shema (SHEME_TEHNIK v shared/sheme.js), vaja 2 shema, obrnjena čez glavno
// diagonalo (O16; VrSc -> VcSr), črke so naključne števke (O1, pri vaji 2 nove - O17). Pričakovane
// celice se tu izračunajo iz zapisa sheme neodvisno od trening/generators.js, obrat tudi.
// Korak 2: 7 · X-krilo in 8 · Mečarica (mreža ene števke - celice x iz sheme):
//   - celice vaje = celice x sheme, vzorec in izbrisi iz sheme (vaja 2 obrnjena);
//   - funkcija tehnike v motorju na mreži vaje najde natanko korak sheme;
//   - »Rešitev« pokaže celice sheme, »Preveri« s celicami vzorca → »Pravilno!«;
//   - oznaka »· po shemi« / »· po shemi, obrnjeno« in vrstica s preslikavo;
//   - vaja 3 je pri istem semenu enaka izhodu generatorja (M.gen(2));
//   - E1 in »Vadi v uganki« brez vaje po shemi; pravila besedil.
// Korak 3: 3 · Očitni par, 4 · Skriti par, 5 · Očitna trojica, 6 · Skrita trojica (ena vrstica; vaja 2
// stolpec - obrnjena shema), na 200 vajah 1 in 200 vajah 2 vsake s semenom:
//   - mesta: črke v celicah natanko kot na shemi, »…« = druge števke, prazna celica sheme = dana
//     števka (ni števka črke); vaja 2 ima enoto stolpec (unitType 'col');
//   - na deski kot v tests/sheme.test.js (enota v vrstici 1 / stolpcu 1, druge celice prazne z vsemi
//     kandidati) funkcija tehnike najde natanko korak sheme, enojčka in lažje podmnožice nič, pri 3 in
//     5 je vzorec en sam (kot ga sprejme »Preveri«);
//   - vsaka celica s kandidati ima vsaj dva, vsaka nevpisana števka je v vsaj dveh celicah;
//   - »Preveri« (pri 4 in 6 z 2. fazo) → »Pravilno!«, oznaka in vrstica s preslikavo, vaja 3 enaka M.gen(2).
// Korak 4: 9 · Veriga ene števke (vaja 1 prva risba – Nebotičnik, vaja 2 druga – Zmaj, obe brez obrata, O8),
// 10 · W-krilo, 12 · Edinstveni pravokotnik, 13 · XY-veriga (vaja 2 obrnjena, O16), 11 · XY-krilo (vaja 2
// zrcaljena levo-desno, O18), na 200 vajah 1 in 200 vajah 2 vsake s semenom:
//   - prazne celice vaje = celice s črko na risbi (pri vaji 2 obrnjene / zrcaljene), druge sive;
//   - črke v celicah natanko kot na shemi; polnila (O3): pri 9 1-2 v vsaki celici, pri 10-13 celice vzorca
//     natanko s črkami (»…« 1-2 polnili), druge celice 1-2 polnili in vsaj trije kandidati;
//   - funkcija tehnike najde natanko korak sheme (pri 9 podtip po risbi); celice z dvema kandidatoma samo
//     v vzorcu (10-13); pri 13 veriga po vrsti sheme z začetkom v V2S2;
//   - »Preveri« → »Pravilno!«, »Rešitev«, številke verige pri 13, oznaka in vrstica (zrcaljeno, risba).
// Korak 5: 1 · Izločitev izven bloka, 2 · Izločitev v bloku (delna mreža, stanje prave uganke iz semena s seznama
// PRESEK_PO_SHEMI, premaknjeno na mesta sheme; vaja 2 obrnjena):
//   - vsako seme s seznama (hitri del: vzorec) da vajo 1 in 2: vidni sta blok in vrstica sheme (vaja 2 blok in
//     stolpec), celice z x, vzorec in izbrisi kot na shemi; ena rešitev, števke iz rešitve, kandidati skladni s
//     števkami; motor najde korak, na delni mreži edini s to števko, lažje tehnike nič;
//   - vaji 1 in 2 kroga: različni semeni, nove števke; trojica v krogu (O9); »Preveri« → »Pravilno!«.
// Namig pri vajah 1 in 2 vseh tehnik 1-13 ustreza vaji: našteje vzorec, motilca omeni samo, kadar je na mreži.
const nodeTest = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');
const { medPomocjo } = require('./pomoc-stikali.js');
const { spremljajVajo, dokoncajOdgovor } = require('./odgovor-spoznaj.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;

const motor = loadContext(['shared/engine.js', 'shared/sheme.js']).run;
const SHEME = JSON.parse(motor('JSON.stringify(SHEME_TEHNIK)'));
const obrni = i => (i % 9) * 9 + Math.floor(i / 9);
const urejeno = a => [...a].sort((x, y) => x - y);

// Celice sheme 9 × 9 s črko x: { celice, vzorec (»*«), izbris (»-x«) }, pri obrnjeni shemi obrnjene.
function izSheme(kljuc, obrnjeno) {
  const celice = [], vzorec = [], izbris = [];
  SHEME[kljuc].celice.forEach((zapis, i) => {
    const zetoni = zapis.replace(/^[*+]/, '').split(' ').filter(Boolean);
    if (!zetoni.some(t => t.replace(/^-/, '') === 'x')) return;
    const idx = obrnjeno ? obrni(i) : i;
    celice.push(idx);
    if (/^[*+]/.test(zapis)) vzorec.push(idx);
    if (zetoni.includes('-x')) izbris.push(idx);
  });
  return { celice: urejeno(celice), vzorec: urejeno(vzorec), izbris: urejeno(izbris) };
}

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
const vObmocju = dom => vsi(dom.el('exerciseArea'));
const vaja = dom => vObmocju(dom).find(e => e.className === 'exercise');
const poShemi = dom => vObmocju(dom).find(e => e.className === 'po-shemi');
const gumb = (dom, napis) => vObmocju(dom).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
const fb = dom => vObmocju(dom).find(e => /^fb\b/.test(e.className));
const xwCelice = (dom, razred) => urejeno(vObmocju(dom).filter(e => e.classList.contains('xw-cell') && e.classList.contains(razred)).map(e => +e.dataset.idx));
const oznacena = dom => +vObmocju(dom).find(e => e.className === 'xw-digit-label').textContent.match(/\d$/)[0];

// Nov krog »Spoznaj« tehnike s semenom; n = številka vaje (0 = vaja 1).
function krog(tehnika, seme, n = 0) {
  const dom = makeDom();
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  spremljajVajo(run);
  run(`zacniKrog(${JSON.stringify(tehnika)}, 'spoznaj')`);
  for (let i = 0; i < n; i++) run('exNum++; renderExercise()');
  return { dom, run };
}

// Registrira teste. vaj = število vaj po shemi v testih na vzorcu (hitri del 20, počasni 200);
// samoVzorec = samo testi na vzorcu (počasni del - drugi so že med hitrimi); deli = 'sheme' (vaje 3-13 po
// shemi, namig pri 3-13, splošni testi) in/ali 'preseki' (1 in 2) - hitri del je v dveh datotekah, ki
// tečeta vzporedno.
module.exports = function registriraj({ vaj: VAJ, samoVzorec = false, deli = ['sheme', 'preseki'] }) {
  const vzorcni = deli.includes('sheme') ? nodeTest : () => {};
  const test = !samoVzorec && deli.includes('sheme') ? nodeTest : () => {};
  const vzorcniP = deli.includes('preseki') ? nodeTest : () => {};
  // Najmanj različnih preslikav črk v števke po številu črk. Od popravka 4 (vrstni red števk v celicah vzorca
  // kot vrstni red črk) je pri dveh črkah mogočih 36 preslikav (x < y), pri treh 84 (x < y < z), pri petih (13,
  // od zaključka naloge 4a vedno z < x < y < a < b) 126; pri 200 vajah 9 / 25 / 50 / 63, na manjšem vzorcu manj.
  const PRAG = [0, Math.min(9, VAJ / 4), Math.min(25, VAJ / 2), Math.min(50, VAJ / 2), VAJ / 2, Math.min(63, VAJ / 2)];
  // Semena krogov pri testih na vzorcu z nadomestnim DOM-om (namig, vaji 1 in 2 pri 1 in 2).
  const POLNI = VAJ >= 200;
  const SEMENA_NAMIGA = POLNI ? [3, 7, 12, 21, 34, 55] : [3];

  const FUNKCIJA = { 'x-wing': 'xWing', 'swordfish': 'swordfish' };
  const SEMENA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const tehnika of ['x-wing', 'swordfish']) {
    for (const [n, obrnjeno] of [[0, false], [1, true]]) {
      const ime = `${tehnika}, vaja ${n + 1}${obrnjeno ? ' (obrnjena shema)' : ''}`;
      const pricakovano = izSheme(tehnika, obrnjeno);

      test(`${ime}: celice, vzorec in izbrisi so iz sheme; motor najde natanko korak sheme`, () => {
        const stevke = new Set();
        for (const seme of SEMENA) {
          const { dom, run } = krog(tehnika, seme, n);
          assert.deepEqual(xwCelice(dom, 'has-digit'), pricakovano.celice, `seme ${seme}: celice z x`);
          const d = oznacena(dom);
          stevke.add(d);
          const koraki = run(`${FUNKCIJA[tehnika]}({ grid: new Array(81).fill(0), cand: [...Array(81).keys()].map(i => ${JSON.stringify(pricakovano.celice)}.includes(i) ? 1 << ${d} : 0) })
            .map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbris: k.eliminate.map(([c, s]) => c * 10 + s).sort((a, b) => a - b) }))`);
          assert.deepEqual(JSON.parse(JSON.stringify(koraki)), [{ celice: pricakovano.vzorec, izbris: pricakovano.izbris.map(c => c * 10 + d) }], `seme ${seme}: korak motorja`);
          medPomocjo(dom, 'resitev', () => {
            assert.deepEqual(xwCelice(dom, 'peek-hl'), pricakovano.vzorec, `seme ${seme}: »Rešitev« – vzorec`);
            assert.deepEqual(xwCelice(dom, 'peek-elim'), pricakovano.izbris, `seme ${seme}: »Rešitev« – izbris`);
          });
        }
        assert.ok(stevke.size >= 4, `števke so naključne: ${[...stevke]}`);
      });

      test(`${ime}: »Preveri« s celicami vzorca → »Pravilno!«`, () => {
        const { dom, run } = krog(tehnika, 5, n);
        for (const c of vObmocju(dom).filter(e => e.classList.contains('xw-cell') && pricakovano.vzorec.includes(+e.dataset.idx))) c.sprozi('click');
        dokoncajOdgovor(dom, run);
        assert.match(fb(dom).className, /\bok\b/);
        assert.match(fb(dom).innerHTML, /^<b>Pravilno!/);
        assert.deepEqual(xwCelice(dom, 'xw-elim'), pricakovano.izbris, 'izbris po odgovoru');
      });

      test(`${ime}: oznaka nad vajo in vrstica s preslikavo`, () => {
        const { dom } = krog(tehnika, 3, n);
        const d = oznacena(dom);
        assert.match(vaja(dom).innerHTML, new RegExp(`^<p class="ex-label">[^<]* · Vaja ${n + 1} / 9 · ${obrnjeno ? 'po shemi, obrnjeno' : 'po shemi'}</p>`));
        assert.equal(poShemi(dom).textContent, obrnjeno
          ? `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črka x je števka ${d}.`
          : `Vaja po shemi zgoraj – iste celice, črka x je števka ${d}.`);
        // Vrstica s preslikavo je tik za razdelkom »Shema« (pod risbo, tik nad mrežo), ta je odprt.
        const otroci = vaja(dom).children;
        const sh = otroci.find(e => e.className === 'shema-razdelek');
        assert.equal(otroci.indexOf(poShemi(dom)), otroci.indexOf(sh) + 1);
        assert.equal(sh.open, true);
      });
    }

    test(`${tehnika}: vaji 1 in 2 imata vsaka svojo števko (nove števke, O17)`, () => {
      let razlicni = 0;
      for (const seme of SEMENA) {
        const { dom, run } = krog(tehnika, seme);
        const d1 = oznacena(dom);
        run('exNum++; renderExercise()');
        if (oznacena(dom) !== d1) razlicni++;
      }
      assert.ok(razlicni >= SEMENA.length / 2, `različnih: ${razlicni} / ${SEMENA.length}`);
    });

    test(`${tehnika}: vaja 3 je pri istem semenu enaka izhodu generatorja, brez oznake po shemi`, () => {
      for (const seme of [11, 22, 33]) {
        const { dom, run } = krog(tehnika, 1, 2);
        run(`${SEME(seme)} renderExercise()`);
        const celice = xwCelice(dom, 'has-digit'), d = oznacena(dom);
        run(SEME(seme));
        const gen = run(`(() => { const ex = MODES[${JSON.stringify(tehnika)}].gen(2); return { d: ex.digit, celice: ex.grid.map((h, i) => h ? i : -1).filter(i => i >= 0) }; })()`);
        assert.deepEqual({ d, celice }, JSON.parse(JSON.stringify(gen)), `seme ${seme}`);
        assert.equal(poShemi(dom), undefined);
        assert.doesNotMatch(vaja(dom).innerHTML, /po shemi/);
      }
    });
  }

  // ---------- Korak 3: 3-6 (ena vrstica) ----------
  const PODMNOZICE = {
    'naked-pair': { fn: 'nakedPairs', lazje: [], pickN: 2, skrita: false },
    'hidden-pair': { fn: 'hiddenPairs', lazje: ['nakedPairs'], pickN: 2, skrita: true },
    'naked-triple': { fn: 'nakedTriples', lazje: ['nakedPairs', 'hiddenPairs'], pickN: 3, skrita: false },
    'hidden-triple': { fn: 'hiddenTriples', lazje: ['nakedPairs', 'hiddenPairs', 'nakedTriples'], pickN: 3, skrita: true },
  };
  const CRKE = ['x', 'y', 'z', 'a', 'b'];
  // Celica sheme v vrstici: črke, »…«, izbrisi (črke in »…«), celica vzorca - neodvisno od shemaCelica().
  function celicaSheme(zapis) {
    const zetoni = zapis.replace(/^[*+]/, '').split(' ').filter(Boolean);
    return {
      vzorec: /^[*+]/.test(zapis), prazna: zetoni.length === 0,
      crke: zetoni.map(t => t.replace(/^-/, '')).filter(z => z !== '…'),
      drugi: zetoni.some(t => t.replace(/^-/, '') === '…'),
      izbris: zetoni.filter(t => t.startsWith('-')).map(t => t.slice(1)),
    };
  }
  const nabori = (a, k) => k === 0 ? [[]] : a.flatMap((x, i) => nabori(a.slice(i + 1), k - 1).map(n => [x, ...n]));

  // 200 vaj po shemi s semenom (genPoShemi v kontekstu treninga) - sestavijo se enkrat za oba testa.
  const vajePoShemi = new Map();
  function vajePodmnozice(tehnika, n) {
    const kljuc = `${tehnika}/${n}`;
    if (!vajePoShemi.has(kljuc)) {
      const { run } = loadContext(DATOTEKE, makeDom().globals);
      run(SEME(100 + n));
      vajePoShemi.set(kljuc, JSON.parse(run(`JSON.stringify(Array.from({ length: ${VAJ} }, () => genPoShemi('${tehnika}', ${n})))`)));
    }
    return vajePoShemi.get(kljuc);
  }

  for (const tehnika of Object.keys(PODMNOZICE)) {
    const P = PODMNOZICE[tehnika];
    const shema = SHEME[tehnika].celice.map(celicaSheme);
    const crkeSheme = CRKE.filter(c => shema.some(s => s.crke.includes(c)));
    const vzorecSheme = shema.map((s, i) => s.vzorec ? i : -1).filter(i => i >= 0);

    for (const [n, obrnjeno] of [[0, false], [1, true]]) {
      const ime = `${tehnika}, vaja ${n + 1}${obrnjeno ? ' (obrnjena shema – stolpec)' : ' (vrstica)'}`;
      // Celica enote na deski 9 × 9: vrstica 1 oziroma stolpec 1 (obrat čez diagonalo).
      const naDeski = i => obrnjeno ? obrni(i) : i;

      vzorcni(`${ime}: mesta, števke in kandidati iz sheme (${VAJ} vaj)`, () => {
        const vaje = vajePodmnozice(tehnika, n);
        const preslikave = new Set();
        for (const [v, ex] of vaje.entries()) {
          assert.ok(ex, `vaja ${v}: vaja po shemi je`);
          assert.equal(ex.unitType, obrnjeno ? 'col' : 'row', `vaja ${v}: enota`);
          assert.equal(ex.unitLabel, obrnjeno ? 'Stolpec 1' : 'Vrstica 1');
          assert.deepEqual(ex.slots.map(s => s.pos), [...Array(9).keys()].map(i => obrnjeno ? `V${i + 1}S1` : `V1S${i + 1}`));
          assert.deepEqual(ex.poShemi.obrnjeno, obrnjeno);
          const crka = Object.fromEntries(ex.poShemi.crke);
          assert.deepEqual(ex.poShemi.crke.map(([c]) => c), crkeSheme, `vaja ${v}: črke v preslikavi`);
          const stevkeCrk = crkeSheme.map(c => crka[c]);
          assert.equal(new Set(stevkeCrk).size, crkeSheme.length, `vaja ${v}: različne števke črk`);
          preslikave.add(stevkeCrk.join());
          const dane = [];
          shema.forEach((s, i) => {
            const sl = ex.slots[i];
            if (s.prazna) {
              assert.ok(sl.fixed >= 1 && sl.fixed <= 9 && !sl.c, `vaja ${v}, celica ${i + 1}: dana števka`);
              assert.ok(!stevkeCrk.includes(sl.fixed), `vaja ${v}, celica ${i + 1}: dana števka ni števka črke`);
              dane.push(sl.fixed);
              return;
            }
            assert.equal(sl.fixed, undefined, `vaja ${v}, celica ${i + 1}: prazna`);
            assert.deepEqual(sl.c.filter(d => stevkeCrk.includes(d)), s.crke.map(c => crka[c]).sort((a, b) => a - b), `vaja ${v}, celica ${i + 1}: črke`);
            assert.equal(sl.c.some(d => !stevkeCrk.includes(d)), s.drugi, `vaja ${v}, celica ${i + 1}: drugi kandidati natanko pri »…«`);
            assert.ok(sl.c.length >= 2, `vaja ${v}, celica ${i + 1}: vsaj dva kandidata`);
          });
          assert.equal(new Set(dane).size, dane.length, `vaja ${v}: dane števke različne`);
          for (let d = 1; d <= 9; d++) if (!dane.includes(d))
            assert.ok(ex.slots.filter(s => s.c && s.c.includes(d)).length >= 2, `vaja ${v}: števka ${d} v vsaj dveh celicah`);
          assert.deepEqual([...ex.targetSlots].sort((a, b) => a - b), vzorecSheme, `vaja ${v}: celice vzorca`);
          assert.deepEqual([...ex.targetDigits].sort((a, b) => a - b), [...stevkeCrk].sort((a, b) => a - b), `vaja ${v}: števke vzorca`);
          assert.ok(ex.solutionMessage, `vaja ${v}: sporočilo motorja`);
        }
        // Pri dveh črkah je možnih 72 preslikav (urejenih parov števk), pri treh 504.
        assert.ok(preslikave.size >= PRAG[crkeSheme.length], `števke so naključne: ${preslikave.size} različnih`);
      });

      vzorcni(`${ime}: motor najde natanko korak sheme, enojčka in lažje podmnožice nič${P.skrita ? '' : ', en sam vzorec'} (${VAJ} vaj)`, () => {
        const vaje = vajePodmnozice(tehnika, n);
        for (const [v, ex] of vaje.entries()) {
          const crka = Object.fromEntries(ex.poShemi.crke);
          const stevkeCrk = crkeSheme.map(c => crka[c]);
          // Deska kot v tests/sheme.test.js: enota na mestu sheme (obrnjeno: stolpec), druge celice prazne z vsemi kandidati.
          const grid = Array(81).fill(0), cand = Array(81).fill(0x3FE);
          const izbrisi = [];
          shema.forEach((s, i) => {
            const idx = naDeski(i), sl = ex.slots[i];
            if (s.prazna) { grid[idx] = sl.fixed; cand[idx] = 0; return; }
            cand[idx] = sl.c.reduce((m, d) => m | (1 << d), 0);
            for (const z of s.izbris) {
              const ds = z === '…' ? sl.c.filter(d => !stevkeCrk.includes(d)) : [crka[z]];
              for (const d of ds) izbrisi.push(idx * 10 + d);
            }
          });
          // En klic motorja na vajo: korak tehnike in število korakov enojčkov in lažjih podmnožic.
          const lazje = ['nakedSingles', 'hiddenSingles', ...P.lazje];
          const izid = JSON.parse(motor(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(grid)}; b.cand = ${JSON.stringify(cand)};
            return JSON.stringify({ koraki: ${P.fn}(b).map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbris: k.eliminate.map(([c, s]) => c * 10 + s).sort((a, b) => a - b) })),
              lazje: [${lazje.join(', ')}].map(f => f(b).length) }); })()`));
          assert.deepEqual(izid.koraki, [{ celice: vzorecSheme.map(naDeski).sort((a, b) => a - b), izbris: izbrisi.sort((a, b) => a - b) }], `vaja ${v}: korak motorja`);
          lazje.forEach((fn, i) => assert.equal(izid.lazje[i], 0, `vaja ${v}: ${fn} nič`));
          if (!P.skrita) {
            // Vzorci, ki jih sprejme »Preveri« pri očitnem paru/trojici: pickN praznih celic s pickN kandidati.
            const prazne = ex.slots.map((s, i) => s.c ? i : -1).filter(i => i >= 0);
            const vzorci = nabori(prazne, P.pickN).filter(nb => new Set(nb.flatMap(i => ex.slots[i].c)).size === P.pickN);
            assert.deepEqual(vzorci, [vzorecSheme], `vaja ${v}: en sam vzorec`);
          }
        }
      });

      test(`${ime}: »Preveri« s celicami vzorca${P.skrita ? ' in števkami' : ''} → »Pravilno!«; oznaka in vrstica s preslikavo`, () => {
        for (const seme of [3, 7]) {
          const { dom, run } = krog(tehnika, seme, n);
          const crke = poShemi(dom).textContent.match(/črke so števke: (.*)\.$/)[1].split(', ').map(p => p.split(' = '));
          assert.deepEqual(crke.map(([c]) => c), crkeSheme);
          assert.equal(poShemi(dom).textContent, obrnjeno
            ? `Vaja po obrnjeni shemi zgoraj – vrstica sheme je stolpec, črke so števke: ${crke.map(([c, d]) => `${c} = ${d}`).join(', ')}.`
            : `Vaja po shemi zgoraj – iste celice, črke so števke: ${crke.map(([c, d]) => `${c} = ${d}`).join(', ')}.`);
          assert.match(vaja(dom).innerHTML, new RegExp(`^<p class="ex-label">[^<]* · Vaja ${n + 1} / 9 · ${obrnjeno ? 'po shemi, obrnjeno' : 'po shemi'}</p>`));
          assert.ok(vObmocju(dom).some(e => e.className === (obrnjeno ? 'layout-col' : 'layout-row')), 'izris enote');
          const celice = vObmocju(dom).filter(e => /^gc\b/.test(e.className));
          assert.equal(celice.length, 9);
          for (const c of celice.filter(c => vzorecSheme.includes(+c.dataset.si))) c.sprozi('click');
          dokoncajOdgovor(dom, run);
          assert.match(fb(dom).className, /\bok\b/, `seme ${seme}`);
          assert.match(fb(dom).innerHTML, /^<b>Pravilno!/, `seme ${seme}`);
        }
      });
    }

    test(`${tehnika}: vaja 3 je pri istem semenu enaka izhodu generatorja, brez oznake po shemi`, () => {
      for (const seme of [11, 22]) {
        const { dom, run } = krog(tehnika, 1, 2);
        run(`${SEME(seme)} renderExercise()`);
        const kandidati = vObmocju(dom).filter(e => /^gc\b/.test(e.className))
          .map(c => c.classList.contains('fixed') ? `=${c.textContent}` : vsi(c).filter(e => e.dataset && e.dataset.d && !e.classList.contains('hide')).map(e => e.dataset.d).join(''));
        run(SEME(seme));
        const gen = JSON.parse(run(`JSON.stringify(MODES['${tehnika}'].gen(2).slots.map(s => s.fixed !== undefined ? '=' + s.fixed : s.c.join('')))`));
        assert.deepEqual(kandidati, gen, `seme ${seme}`);
        assert.equal(poShemi(dom), undefined);
        assert.doesNotMatch(vaja(dom).innerHTML, /po shemi/);
      }
    });
  }

  // ---------- Korak 4: 9-13 (cela mreža) ----------
  const POLNE = {
    'turbot-fish': { fn: 'turbotFish', vaja2: 'risba', label: 'po shemi' },
    'w-wing': { fn: 'wWing', vaja2: 'obrnjeno', label: 'po shemi, obrnjeno' },
    'xy-wing': { fn: 'xyWing', vaja2: 'zrcaljeno', label: 'po shemi, zrcaljeno' },
    'unique-rectangle': { fn: 'uniqueRectangle', vaja2: 'obrnjeno', label: 'po shemi, obrnjeno' },
    'xy-chain': { fn: 'xyChain', vaja2: 'obrnjeno', label: 'po shemi, obrnjeno' },
  };
  const zrcali = i => Math.floor(i / 9) * 9 + 8 - i % 9;
  const imeCelice = i => `V${Math.floor(i / 9) + 1}S${i % 9 + 1}`;
  const izImena = s => { const [, v, c] = s.match(/^V(\d)S(\d)$/); return (v - 1) * 9 + (c - 1); };

  // Risba vaje n (pri 9 druga risba za vajo 2) in preslikava celic sheme na mrežo vaje.
  function risbaVaje(tehnika, n) {
    const s = SHEME[tehnika];
    const risba = s.risbe ? s.risbe[n] : s;
    const naMrezo = n === 0 || POLNE[tehnika].vaja2 === 'risba' ? i => i : POLNE[tehnika].vaja2 === 'zrcaljeno' ? zrcali : obrni;
    return { risba, naMrezo };
  }

  const vajePolne = new Map();
  function vajePolneMreze(tehnika, n) {
    const kljuc = `${tehnika}/${n}`;
    if (!vajePolne.has(kljuc)) {
      const { run } = loadContext(DATOTEKE, makeDom().globals);
      run(SEME(200 + n));
      vajePolne.set(kljuc, JSON.parse(run(`JSON.stringify(Array.from({ length: ${VAJ} }, () => genPoShemi('${tehnika}', ${n})))`)));
    }
    return vajePolne.get(kljuc);
  }

  // Celice gc na mreži 9 × 9 vaje (prazne – s si), indeks iz data-r / data-c.
  const gcCelice = dom => vObmocju(dom).filter(e => /^gc\b/.test(e.className) && e.dataset.si !== undefined);
  const idxCelice = e => +e.dataset.r * 9 + +e.dataset.c;

  for (const tehnika of Object.keys(POLNE)) {
    const P = POLNE[tehnika];
    for (const n of [0, 1]) {
      const { risba, naMrezo } = risbaVaje(tehnika, n);
      const shema = risba.celice.map(celicaSheme);
      const crkeSheme = CRKE.filter(c => shema.some(s => s.crke.includes(c)));
      const sCrko = shema.map((s, i) => s.prazna ? -1 : i).filter(i => i >= 0);
      const prazne = urejeno(sCrko.map(naMrezo));
      const vzorec = urejeno(shema.map((s, i) => s.vzorec ? naMrezo(i) : -1).filter(i => i >= 0));
      const opisVaje = n === 0 ? (risba.naslov ? 'prva risba' : 'shema') : P.vaja2 === 'risba' ? 'druga risba' : P.vaja2 === 'zrcaljeno' ? 'zrcaljena shema' : 'obrnjena shema';
      const ime = `${tehnika}, vaja ${n + 1} (${opisVaje})`;

      vzorcni(`${ime}: celice, črke in polnila iz sheme; motor najde natanko korak sheme (${VAJ} vaj)`, () => {
        const vaje = vajePolneMreze(tehnika, n);
        const preslikave = new Set();
        for (const [v, ex] of vaje.entries()) {
          assert.ok(ex, `vaja ${v}: vaja po shemi je`);
          assert.equal(ex.mode, tehnika);
          assert.deepEqual(ex.slots.map(s => s.idx), prazne, `vaja ${v}: prazne celice = celice s črko`);
          for (let i = 0; i < 81; i++) assert.equal(ex.boardGrid[i] === 0, prazne.includes(i), `vaja ${v}: celica ${imeCelice(i)} prazna/siva`);
          assert.deepEqual(ex.poShemi.crke.map(([c]) => c), crkeSheme, `vaja ${v}: črke v preslikavi`);
          const crka = Object.fromEntries(ex.poShemi.crke);
          const stevkeCrk = crkeSheme.map(c => crka[c]);
          assert.equal(new Set(stevkeCrk).size, crkeSheme.length, `vaja ${v}: različne števke črk`);
          preslikave.add(stevkeCrk.join());
          const kand = idx => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => ex.boardCand[idx] & (1 << d));
          const izbrisi = [];
          for (const i of sCrko) {
            const s = shema[i], idx = naMrezo(i), c = kand(idx), polnila = c.filter(d => !stevkeCrk.includes(d));
            const kje = `vaja ${v}, ${imeCelice(idx)}`;
            assert.deepEqual(c.filter(d => stevkeCrk.includes(d)), urejeno(s.crke.map(z => crka[z])), `${kje}: črke`);
            if (tehnika === 'turbot-fish' || s.drugi) assert.ok(polnila.length >= 1 && polnila.length <= 2, `${kje}: 1-2 polnili`);
            else if (s.vzorec) assert.equal(polnila.length, 0, `${kje}: celica vzorca natanko s črkami`);
            else assert.ok(polnila.length >= 1 && polnila.length <= 2 && c.length >= 3, `${kje}: 1-2 polnili, vsaj trije kandidati`);
            if (tehnika !== 'turbot-fish' && !s.vzorec) assert.ok(c.length >= 3, `${kje}: zunaj vzorca vsaj trije kandidati`);
            for (const z of s.izbris) for (const d of z === '…' ? polnila : [crka[z]]) izbrisi.push(idx * 10 + d);
          }
          if (tehnika !== 'turbot-fish') for (const idx of prazne) if (kand(idx).length === 2) assert.ok(vzorec.includes(idx), `vaja ${v}: celica z dvema kandidatoma ${imeCelice(idx)} je v vzorcu`);
          const izid = JSON.parse(motor(`(() => { const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(ex.boardGrid)}; b.cand = ${JSON.stringify(ex.boardCand)};
            return JSON.stringify(${P.fn}(b).map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbris: k.eliminate.map(([c, s]) => c * 10 + s).sort((a, b) => a - b), podtip: k.variant || '', vrsta: k.cells }))); })()`));
          const razlicni = [...new Map(izid.map(k => [JSON.stringify([k.celice, k.izbris]), k])).values()];
          assert.equal(razlicni.length, 1, `vaja ${v}: en sam korak (${JSON.stringify(razlicni)})`);
          assert.deepEqual(razlicni[0].celice, vzorec, `vaja ${v}: celice vzorca`);
          assert.deepEqual(razlicni[0].izbris, urejeno(izbrisi), `vaja ${v}: izbrisi`);
          assert.deepEqual(urejeno(ex.solutionCells), vzorec, `vaja ${v}: solutionCells`);
          assert.deepEqual(urejeno(ex.solutionEliminate.map(([c, d]) => c * 10 + d)), urejeno(izbrisi), `vaja ${v}: solutionEliminate`);
          assert.ok(ex.solutionMessage, `vaja ${v}: sporočilo motorja`);
          if (tehnika === 'turbot-fish') {
            assert.equal(razlicni[0].podtip, ['Skyscraper', 'Two-String Kite'][n], `vaja ${v}: podtip po risbi`);
            assert.equal(ex.variant, razlicni[0].podtip);
            assert.equal(ex.digit, crka.x);
          }
          if (tehnika === 'xy-chain') {
            // Veriga po vrsti sheme (povezave »vidita«), z začetkom v V2S2 – tudi pri vaji 2.
            const veriga = [izImena('V2S2')];
            for (const p of SHEME[tehnika].vidita) veriga.push(izImena(p.split(' ')[1]));
            assert.deepEqual(ex.solutionCells, veriga.map(naMrezo), `vaja ${v}: vrstni red verige`);
            assert.equal(ex.solutionCells[0], izImena('V2S2'));
            assert.equal(ex.solutionVeriga, true);
            assert.equal(ex.z, crka.z);
          }
        }
        // Pri eni črki je možnih 9 preslikav, pri dveh 72, pri treh 504.
        assert.ok(preslikave.size >= PRAG[crkeSheme.length], `števke so naključne: ${preslikave.size} različnih`);
      });

      test(`${ime}: »Preveri« s celicami vzorca → »Pravilno!«, »Rešitev«, oznaka in vrstica s preslikavo`, () => {
        for (const seme of [3, 7]) {
          const { dom, run } = krog(tehnika, seme, n);
          const vrstica = poShemi(dom).textContent;
          const crke = (crkeSheme.length === 1 ? [['x', vrstica.match(/črka x je števka (\d)\.$/)[1]]]
            : vrstica.match(/črke so števke: (.*)\.$/)[1].split(', ').map(p => p.split(' = ')));
          assert.deepEqual(crke.map(([c]) => c), crkeSheme);
          const preslikava = crkeSheme.length === 1 ? `črka x je števka ${crke[0][1]}.` : `črke so števke: ${crke.map(([c, d]) => `${c} = ${d}`).join(', ')}.`;
          const pricakovana = n === 0 && !risba.naslov ? `Vaja po shemi zgoraj – iste celice, ${preslikava}`
            : risba.naslov ? `Vaja po shemi zgoraj (${risba.naslov.replace(/ \(.*\)$/, '')}) – iste celice, ${preslikava}`
            : P.vaja2 === 'zrcaljeno' ? `Vaja po zrcaljeni shemi zgoraj – stolpec 1 sheme je stolpec 9, stolpec 2 je stolpec 8 …, ${preslikava}`
            : `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, ${preslikava}`;
          assert.equal(vrstica, pricakovana, `seme ${seme}`);
          assert.match(vaja(dom).innerHTML, new RegExp(`^<p class="ex-label">[^<]* · Vaja ${n + 1} / 9 · ${n === 0 ? 'po shemi' : P.label}</p>`));
          const otroci = vaja(dom).children, i = otroci.indexOf(poShemi(dom));
          assert.equal(otroci[i - 1].className, 'shema-razdelek', 'vrstica s preslikavo tik za shemo');
          assert.deepEqual(urejeno(gcCelice(dom).map(idxCelice)), prazne, 'prazne celice na mreži');
          medPomocjo(dom, 'resitev', () => {
            assert.deepEqual(urejeno(gcCelice(dom).filter(c => c.classList.contains('peek-hl')).map(idxCelice)), vzorec, `seme ${seme}: »Rešitev« – vzorec`);
          });
          for (const c of gcCelice(dom).filter(c => vzorec.includes(idxCelice(c)))) c.sprozi('click');
          dokoncajOdgovor(dom, run);
          assert.match(fb(dom).className, /\bok\b/, `seme ${seme}`);
          assert.match(fb(dom).innerHTML, /^<b>Pravilno!/, `seme ${seme}`);
          if (tehnika === 'xy-chain') {
            // Zaporedne številke verige po pravilnem odgovoru: 1 v V2S2, nato po vrsti sheme.
            const st = new Map();
            for (const c of gcCelice(dom)) for (const cd of vsi(c)) if (cd.classList && cd.classList.contains('veriga-st')) st.set(idxCelice(c), +cd.textContent);
            const veriga = [izImena('V2S2'), ...SHEME[tehnika].vidita.map(p => izImena(p.split(' ')[1]))].map(naMrezo);
            assert.deepEqual([...st.entries()].sort((a, b) => a[1] - b[1]).map(([idx]) => idx), veriga, `seme ${seme}: številke verige`);
            assert.equal(st.get(izImena('V2S2')), 1);
          }
        }
      });
    }

    test(`${tehnika}: vaji 1 in 2 imata vsaka svoje števke (O17)`, () => {
      let razlicni = 0;
      for (const seme of SEMENA) {
        const { dom, run } = krog(tehnika, seme);
        const p1 = poShemi(dom).textContent.match(/črk[ae] .*$/)[0];
        run('exNum++; renderExercise()');
        if (poShemi(dom).textContent.match(/črk[ae] .*$/)[0] !== p1) razlicni++;
      }
      assert.ok(razlicni >= SEMENA.length / 2, `različnih: ${razlicni} / ${SEMENA.length}`);
    });

    test(`${tehnika}: vaja 3 je pri istem semenu enaka izhodu generatorja, brez oznake po shemi`, () => {
      for (const seme of [11, 22]) {
        const { dom, run } = krog(tehnika, 1, 2);
        run(`${SEME(seme)} renderExercise()`);
        const kandidati = gcCelice(dom).map(c => `${idxCelice(c)}:${vsi(c).filter(e => e.dataset && e.dataset.d && !e.classList.contains('hide')).map(e => e.dataset.d).join('')}`);
        run(SEME(seme));
        const gen = JSON.parse(run(`JSON.stringify(MODES['${tehnika}'].gen(2).slots.map(s => s.idx + ':' + s.c.join('')))`));
        assert.deepEqual(kandidati, gen, `seme ${seme}`);
        assert.equal(poShemi(dom), undefined);
        assert.doesNotMatch(vaja(dom).innerHTML, /po shemi/);
      }
    });
  }

  // ---------- Popravek 4: vrstni red števk v celicah vzorca ----------
  // Števke za črke so naključne, a tako, da je v celicah vzorca naraščajoč vrstni red števk čim bolj enak
  // vrstnemu redu črk na shemi (celica »x y« se na mreži izpiše »x y«, ne »y x«). Največje mogoče število
  // takih celic se tu izračuna neodvisno (vsi vrstni redi črk); pri 13 je pogojev pet v krogu, zato štiri.
  const permutacije = a => a.length <= 1 ? [a] : a.flatMap((x, i) => permutacije([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
  const ujemanje = (celice, red) => celice.filter(cc => cc.every((c, i) => !i || red(cc[i - 1]) < red(c))).length;
  const NAJVEC = {};
  const celiceVzorcaCrke = celice => celice.map(celicaSheme).filter(c => c.vzorec).map(c => c.crke);
  for (const [tehnika, n, risbaCelice] of [...Object.keys(PODMNOZICE).flatMap(t => [[t, 0, SHEME[t].celice], [t, 1, SHEME[t].celice]]),
    ...Object.keys(POLNE).flatMap(t => [0, 1].map(n => [t, n, risbaVaje(t, n).risba.celice]))]) {
    vzorcni(`${tehnika}, vaja ${n + 1}: vrstni red števk v celicah vzorca kot vrstni red črk na shemi (${VAJ} vaj)`, () => {
      const celice = celiceVzorcaCrke(risbaCelice);
      const crkeVaje = [...new Set(celice.flat())];
      const najvec = Math.max(...permutacije(crkeVaje).map(p => ujemanje(celice, c => p.indexOf(c))));
      NAJVEC[tehnika] = [najvec, celice.length];
      const vaje = PODMNOZICE[tehnika] ? vajePodmnozice(tehnika, n) : vajePolneMreze(tehnika, n);
      for (const [v, ex] of vaje.entries()) {
        const crka = Object.fromEntries(ex.poShemi.crke);
        assert.equal(ujemanje(celice, c => crka[c]), najvec, `vaja ${v}: ${JSON.stringify(ex.poShemi.crke)}`);
        // Pri 13 se krog vedno prekine v zadnji celici verige »b z« (zaključek naloge 4a): z < x < y < a < b,
        // na mreži »z x«, »x y«, »y a«, »a b« po shemi, samo zadnja »z b«.
        if (tehnika === 'xy-chain') assert.ok(crka.z < crka.x && crka.x < crka.y && crka.y < crka.a && crka.a < crka.b,
          `vaja ${v}: z < x < y < a < b (${JSON.stringify(ex.poShemi.crke)})`);
      }
      if (tehnika === 'xy-chain') assert.deepEqual([najvec, celice.length], [4, 5], 'XY-veriga: štiri od petih celic');
      else assert.equal(najvec, celice.length, `${tehnika}: v vseh celicah vzorca`);
    });
  }

  // ---------- Korak 5: 1 · Izločitev izven bloka, 2 · Izločitev v bloku (delna mreža) ----------
  // Vaja je stanje prave uganke iz semena s seznama PRESEK_PO_SHEMI (izbere ga orodje
  // tools/izberi-vaje-po-shemi.js), premaknjeno s simetrijo sudokuja na mesta sheme (vaja 2 še obrnjeno).
  // Pričakovano se tu izračuna iz sheme: vidni sta blok in vrstica vzorca (vaja 2 blok in stolpec obrnjene
  // sheme), celice x v njih, vzorec in izbrisi.
  const PRESEKI = {
    pointing: { kljuc: 'Pointing pair/triple', lazje: ['Gol enojček', 'Skriti enojček'], celic: 2 },
    'box-line': { kljuc: 'Box-line reduction', lazje: ['Gol enojček', 'Skriti enojček', 'Pointing pair/triple'], celic: 3 },
  };
  const blokCelice = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
  function presekIzSheme(tehnika, obrnjeno) {
    const { celice, vzorec, izbris } = izSheme(tehnika, false);
    const vrstica = Math.floor(vzorec[0] / 9), blok = blokCelice(vzorec[0]);
    const vidne = [...Array(81).keys()].filter(i => Math.floor(i / 9) === vrstica || blokCelice(i) === blok);
    const o = i => obrnjeno ? obrni(i) : i;
    return { vidne: urejeno(vidne.map(o)), x: urejeno(celice.filter(i => vidne.includes(i)).map(o)), vzorec: urejeno(vzorec.map(o)), izbris: urejeno(izbris.map(o)) };
  }
  // Krog »Spoznaj« s semenom do vaje n; vaje = vaje kroga (iz genPoShemi ali MODES[].gen).
  function krogPreseka(tehnika, seme, n) {
    const dom = makeDom();
    const { run } = loadContext(DATOTEKE, dom.globals);
    run(`{ const g = genPoShemi; genPoShemi = (m, n) => (globalThis.zadnjaVaja = g(m, n));
      const mg = MODES['${tehnika}'].gen; MODES['${tehnika}'].gen = n => (globalThis.zadnjaVaja = mg(n)); }`);
    run(SEME(seme));
    spremljajVajo(run);
    run(`zacniKrog('${tehnika}', 'spoznaj')`);
    const vaje = [JSON.parse(run('JSON.stringify(zadnjaVaja)'))];
    for (let i = 0; i < n; i++) { run('exNum++; renderExercise()'); vaje.push(JSON.parse(run('JSON.stringify(zadnjaVaja)'))); }
    return { dom, run, vaje, ex: vaje[vaje.length - 1] };
  }

  for (const tehnika of Object.keys(PRESEKI)) {
    const P = PRESEKI[tehnika];
    vzorcniP(`${tehnika}: seznam semen – ${POLNI ? 'vsako seme' : 'vzorec semen'} da vajo 1 in 2 na mestih sheme (stanje prave uganke, korak motorja)`, () => {
      const { run } = loadContext(DATOTEKE, makeDom().globals);
      const vsa = JSON.parse(run(`JSON.stringify(PRESEK_PO_SHEMI['${tehnika}'])`));
      assert.ok(vsa.length >= 2, `${tehnika}: vsaj dve semeni (vaji 1 in 2 imata različni)`);
      assert.equal(new Set(vsa).size, vsa.length, 'semena brez ponovitev');
      const semena = POLNI ? vsa : vsa.filter((_, i) => i % Math.ceil(vsa.length / 2) === 0);
      run(SEME(31));
      for (const seme of semena) for (const obrnjeno of [false, true]) {
        const kje = `seme ${seme}, vaja ${obrnjeno ? 2 : 1}`;
        const ex = JSON.parse(run(`JSON.stringify(presekPoShemiIzSemena('${tehnika}', ${seme}, ${obrnjeno}))`));
        assert.ok(ex, `${kje}: primeren korak`);
        const S = presekIzSheme(tehnika, obrnjeno);
        assert.deepEqual(ex.poShemi, { obrnjeno, crke: [['x', ex.digit]], seme }, kje);
        assert.equal(ex.mode, tehnika);
        assert.deepEqual(urejeno(ex.vidne), S.vidne, `${kje}: vidni sta blok in vrstica sheme`);
        // Celice z x na delni mreži, vzorec in izbrisi so natanko kot na shemi.
        const sX = S.vidne.filter(i => !ex.grid[i] && ex.kandidati[i] & (1 << ex.digit));
        assert.deepEqual(sX, S.x, `${kje}: celice z x`);
        assert.deepEqual(urejeno(ex.solutionCells), S.vzorec, `${kje}: vzorec`);
        assert.deepEqual(urejeno(ex.solutionEliminate.map(([c, d]) => c * 10 + d)), S.izbris.map(c => c * 10 + ex.digit), `${kje}: izbrisi`);
        // Prava uganka: ena rešitev, števke na mreži iz rešitve, kandidati skladni s števkami.
        const izid = JSON.parse(motor(`(() => { const D = ${JSON.stringify(ex.danosti)};
          const b = Object.create(Board.prototype); b.grid = ${JSON.stringify(ex.grid)}; b.cand = ${JSON.stringify(ex.kandidati)};
          const fn = k => ALL_TECHNIQUES.find(([ime]) => ime === k)[1];
          return JSON.stringify({ resitev: countSolutions(D), sol: solutionOf(D),
            koraki: fn('${P.kljuc}')(b).map(k => ({ celice: [...k.cells].sort((a, b) => a - b), izbris: k.eliminate.map(([c, s]) => c * 10 + s).sort((a, b) => a - b) })),
            lazje: ${JSON.stringify(P.lazje)}.map(k => fn(k)(b).length) }); })()`));
        assert.equal(izid.resitev, 1, `${kje}: ena rešitev`);
        const danih = D => [...D].filter(c => c !== '0').length;
        assert.equal(danih(ex.danosti), danih(run(`genMinimalnaUganka(${seme})`)), `${kje}: uganka semena (enako število danih števk)`);
        for (let i = 0; i < 81; i++) {
          if (ex.danosti[i] !== '0') assert.equal(ex.grid[i], +ex.danosti[i], `${kje}: dana števka ${imeCelice(i)}`);
          if (ex.grid[i]) { assert.equal(ex.grid[i], +izid.sol[i], `${kje}: števka ${imeCelice(i)} iz rešitve`); continue; }
          assert.ok(ex.kandidati[i] & (1 << izid.sol[i]), `${kje}: rešitev ${imeCelice(i)} je kandidat`);
          for (let j = 0; j < 81; j++) if (ex.grid[j] && vidita(i, j)) assert.ok(!(ex.kandidati[i] & (1 << ex.grid[j])), `${kje}: kandidat ${ex.grid[j]} v ${imeCelice(i)} – števka v ${imeCelice(j)}`);
        }
        // Motor: korak vaje je korak tehnike; na delni mreži edini s to števko; lažje tehnike nič.
        const naDelni = izid.koraki.filter(k => k.izbris.every(z => z % 10 === ex.digit) && k.celice.every(c => S.vidne.includes(c)));
        assert.deepEqual(naDelni, [{ celice: S.vzorec, izbris: S.izbris.map(c => c * 10 + ex.digit) }], `${kje}: korak na delni mreži`);
        P.lazje.forEach((k, i) => assert.equal(izid.lazje[i], 0, `${kje}: ${k} nič`));
      }
    });

    for (const n of [0, 1]) {
      const obrnjeno = n === 1;
      vzorcniP(`${tehnika}, vaja ${n + 1}${obrnjeno ? ' (obrnjena shema)' : ''}: delna mreža na mestih sheme, oznaka, vrstica s preslikavo, »Preveri« → »Pravilno!«`, () => {
        const S = presekIzSheme(tehnika, obrnjeno);
        for (const seme of POLNI ? [3, 7, 12] : [3]) {
          const { dom, run, ex } = krogPreseka(tehnika, seme, n);
          assert.ok(ex.poShemi, `seme ${seme}: vaja po shemi`);
          assert.match(vaja(dom).innerHTML, new RegExp(`^<p class="ex-label">[^<]* · Vaja ${n + 1} / 9 · ${obrnjeno ? 'po shemi, obrnjeno' : 'po shemi'}</p>`));
          assert.equal(poShemi(dom).textContent, obrnjeno
            ? `Vaja po obrnjeni shemi zgoraj – vrstice sheme so stolpci, črka x je števka ${ex.digit}.`
            : `Vaja po shemi zgoraj – iste celice, črka x je števka ${ex.digit}.`);
          const otroci = vaja(dom).children, i = otroci.indexOf(poShemi(dom));
          assert.equal(otroci[i - 1].className, 'shema-razdelek', 'vrstica s preslikavo tik za shemo');
          const celice = run('presek.mreza.celice');
          // Vidne celice na mreži (brez razreda izven) so blok in vrstica sheme.
          assert.deepEqual(Array.from(celice, (c, i) => c.classList.contains('izven') ? -1 : i).filter(i => i >= 0), S.vidne);
          for (const c of S.vzorec) celice[c].sprozi('click');
          dokoncajOdgovor(dom, run);
          assert.match(fb(dom).className, /\bok\b/, `seme ${seme}`);
          assert.match(fb(dom).innerHTML, /^<b>Pravilno!/, `seme ${seme}`);
          for (const c of S.vzorec) assert.ok(celice[c].classList.contains('k-vzorec'), `seme ${seme}: vzorec ${imeCelice(c)}`);
        }
      });
    }

    vzorcniP(`${tehnika}: vaji 1 in 2 istega kroga imata različna koraka (drugo seme) in nove števke (O17)`, () => {
      let razlicneStevke = 0;
      const semena = SEMENA.slice(0, POLNI ? 8 : 2);
      for (const seme of semena) {
        const { vaje: [v1, v2] } = krogPreseka(tehnika, seme, 1);
        assert.ok(v1.poShemi && v2.poShemi, `seme ${seme}: obe vaji po shemi`);
        assert.notEqual(v1.poShemi.seme, v2.poShemi.seme, `seme ${seme}: različni semeni uganke`);
        assert.notEqual(v1.danosti, v2.danosti, `seme ${seme}: različni uganki`);
        if (v1.digit !== v2.digit) razlicneStevke++;
      }
      assert.ok(razlicneStevke >= semena.length / 2, `različnih števk: ${razlicneStevke} / ${semena.length}`);
    });

    vzorcniP(`${tehnika}: trojica v krogu (O9) – ${tehnika === 'pointing' ? 'vsaj ena med vajami 3–9' : 'vaji 1 in 2 sta trojici, drugih ne vsili'}`, () => {
      const { run } = loadContext(DATOTEKE, makeDom().globals);
      run(SEME(17));
      const krogov = POLNI ? 8 : 1;
      const krogi = JSON.parse(run(`JSON.stringify(Array.from({ length: ${krogov} }, () => Array.from({ length: 9 }, (_, n) => {
        const ex = genPoShemi('${tehnika}', n) || MODES['${tehnika}'].gen(n);
        return { n, celic: ex.solutionCells.length, poShemi: !!ex.poShemi, izbrana: n === presekTrojica['${tehnika}'] };
      })))`));
      for (const [r, krog] of krogi.entries()) {
        assert.deepEqual(krog.map(v => v.poShemi), [true, true, false, false, false, false, false, false, false], `krog ${r}: vaji 1 in 2 po shemi`);
        assert.equal(krog[0].celic, P.celic, `krog ${r}: vaja 1`);
        assert.equal(krog[1].celic, P.celic, `krog ${r}: vaja 2`);
        const izbrana = krog.filter(v => v.izbrana);
        if (tehnika === 'pointing') {
          assert.equal(izbrana.length, 1, `krog ${r}: ena izbrana vaja`);
          assert.ok(izbrana[0].n >= 2 && izbrana[0].celic === 3, `krog ${r}: izbrana vaja ${izbrana[0].n + 1} s tremi celicami`);
        } else assert.equal(izbrana.length, 0, `krog ${r}: nobena vaja ni vsiljena`);
      }
    });
  }

  // ---------- Namig pri vajah 1 in 2 (in pri vaji iz generatorja) ----------
  // Namig mora ustrezati vaji: našteje celice in števke vzorca, motilca (»ena trojica ima prave
  // števke, a eno krilo pivota ne vidi«, »za pravi par«, »če je pravokotnik razpet čez štiri
  // bloke«) pa omeni natanko tedaj, ko je na mreži - vaja po shemi ga nima, vaja iz generatorja
  // ga ima. Motilec se tu poišče neodvisno od trening/trening.js, na kandidatih vaje.
  const vidita = (i, j) => i !== j && (Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9
    || (Math.floor(i / 27) === Math.floor(j / 27) && Math.floor(i % 9 / 3) === Math.floor(j % 9 / 3)));
  const stevkeMaske = m => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => m & (1 << d));
  // Celice z dvema kandidatoma na mreži vaje 9 × 9: [[celica, [a, b]]].
  const dvojne = ex => ex.boardCand.map((m, i) => [i, stevkeMaske(m)]).filter(([i, s]) => ex.boardGrid[i] === 0 && s.length === 2);
  const MOTILEC = {
    // XY-krilo: trojica s pravimi števkami ({a, b}, {a, c}, {b, c}), ki ni XY-krilo - nobena celica
    // ne vidi obeh drugih (s katerimkoli pivotom eno krilo pivota ne vidi).
    'xy-wing': ex => { const d = dvojne(ex); return d.some(([p, sp], i) => d.some(([k1, s1], j) => d.some(([k2, s2], k) => {
      if (!(i < j && j < k)) return false;
      const vse = new Set([...sp, ...s1, ...s2]);
      if (vse.size !== 3 || sp.join() === s1.join() || sp.join() === s2.join() || s1.join() === s2.join()) return false;
      return !(vidita(p, k1) && vidita(p, k2)) && !(vidita(k1, p) && vidita(k1, k2)) && !(vidita(k2, p) && vidita(k2, k1));
    }))); },
    // W-krilo: več kot en par kandidatov v vsaj dveh celicah.
    'w-wing': ex => new Set(dvojne(ex).map(([, s]) => s.join()).filter((k, i, a) => a.indexOf(k) !== i)).size > 1,
    // Edinstveni pravokotnik: trije vogali z istim parom, pravokotnik razpet čez štiri bloke.
    'unique-rectangle': ex => dvojne(ex).some(([a, s]) => dvojne(ex).some(([b, s2]) => dvojne(ex).some(([c, s3]) => {
      if (s.join() !== s2.join() || s.join() !== s3.join() || a === b || a === c || b === c) return false;
      const vr = new Set([a, b, c].map(i => Math.floor(i / 9))), st = new Set([a, b, c].map(i => i % 9));
      if (vr.size !== 2 || st.size !== 2) return false;
      const vogali = [...vr].flatMap(r => [...st].map(s => r * 9 + s));
      return new Set(vogali.map(i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3))).size === 4;
    }))),
  };
  const BESEDILO_MOTILCA = {
    'xy-wing': /ena trojica ima prave števke, a eno krilo pivota ne vidi/,
    'w-wing': /za pravi par/,
    'unique-rectangle': /če je pravokotnik razpet čez štiri bloke/,
  };

  // Krog s semenom do vaje n; zapomni si vajo (genPoShemi ali MODES[].gen) in vrne besedilo namiga.
  function namigVaje(tehnika, seme, n) {
    const dom = makeDom();
    const { run } = loadContext(DATOTEKE, dom.globals);
    run(`{ const g = genPoShemi; genPoShemi = (m, n) => (globalThis.zadnjaVaja = g(m, n));
      const mg = MODES['${tehnika}'].gen; MODES['${tehnika}'].gen = n => (globalThis.zadnjaVaja = mg(n)); }`);
    run(SEME(seme));
    run(`zacniKrog('${tehnika}', 'spoznaj')`);
    for (let i = 0; i < n; i++) run('exNum++; renderExercise()');
    const ex = JSON.parse(run('JSON.stringify(zadnjaVaja)'));
    gumb(dom, 'Namig').sprozi('click');
    const namig = vObmocju(dom).find(e => /\bpeek-overlay\b/.test(e.className) && e.classList.contains('visible')).innerHTML;
    return { ex, namig, besedilo: namig.replace(/<[^>]*>/g, '') };
  }

  const VSE_TEHNIKE = ['pointing', 'box-line', 'naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish',
    'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain'];
  for (const tehnika of VSE_TEHNIKE) {
    (PRESEKI[tehnika] ? vzorcniP : vzorcni)(`${tehnika}: namig pri vajah 1 in 2 ustreza vaji (vzorec, motilec samo, če je na mreži)`, () => {
      // Vaja 3 je iz generatorja - pri 10-12 ima motilca, zato preveri še drugo smer.
      for (const n of [0, 1, 2]) for (const seme of SEMENA_NAMIGA) {
        const { ex, besedilo } = namigVaje(tehnika, seme, n);
        const kje = `vaja ${n + 1}, seme ${seme}: ${besedilo}`;
        assert.doesNotMatch(besedilo, /undefined|NaN|null|\(nikjer\)|\(nobena\)|ni najdenega vzorca/, kje);
        if (MOTILEC[tehnika]) assert.equal(BESEDILO_MOTILCA[tehnika].test(besedilo), MOTILEC[tehnika](ex), `${kje} – motilec`);
        const pos = i => imeCelice(i);
        if (tehnika === 'pointing' || tehnika === 'box-line') {
          // Celice s števko v osnovni enoti so natanko celice vzorca.
          const celice = besedilo.match(/pojavlja v celicah: ([^.]*)\. /)[1].split(', ');
          assert.deepEqual(celice, ex.solutionCells.map(pos), kje);
          assert.match(besedilo, new RegExp(`^Kandidat ${ex.digit} `), kje);
        } else if (tehnika === 'naked-pair' || tehnika === 'naked-triple') {
          for (const si of ex.targetSlots) assert.match(besedilo, new RegExp(`${ex.slots[si].pos}\\(${ex.slots[si].c.length}\\)`), kje);
        } else if (tehnika === 'hidden-pair' || tehnika === 'hidden-triple') {
          const pickN = tehnika === 'hidden-pair' ? 2 : 3;
          for (const d of ex.targetDigits) assert.ok(+besedilo.match(new RegExp(`\\b${d}→(\\d)×`))[1] <= pickN, kje);
        } else if (tehnika === 'x-wing' || tehnika === 'swordfish') {
          const vrstice = ex.baseIsRow ? 'po vrsticah' : 'po stolpcih', crka = ex.baseIsRow ? 'V' : 'S';
          const stetje = besedilo.match(new RegExp(`${vrstice}: ([^·.]*)`))[1];
          for (const b of ex.bases) assert.match(stetje, new RegExp(`${crka}${b + 1}:[${tehnika === 'x-wing' ? '2' : '23'}]×`), kje);
        } else if (tehnika === 'turbot-fish') {
          const povezave = besedilo.match(/\(povezave\): ([^.]*)\. /)[1];
          for (const c of ex.solutionCells) assert.ok(povezave.includes(pos(c)), `${kje} – ${pos(c)}`);
        } else if (tehnika === 'xy-chain') {
          assert.match(besedilo, new RegExp(`^Števka ${ex.z} – veriga ima ${ex.solutionCells.length} celic\\.`), kje);
        } else {
          // W-krilo, XY-krilo, edinstveni pravokotnik: celice vzorca z dvema kandidatoma so naštete.
          for (const c of ex.solutionCells) if (stevkeMaske(ex.boardCand[c]).length === 2) assert.ok(besedilo.includes(pos(c)), `${kje} – ${pos(c)}`);
        }
      }
    });
  }

  test('genPoShemi: vaje 3-9, E1, E2 in tehnike brez vaje po shemi dajo null (vaja iz generatorja)', () => {
    const { run } = loadContext(DATOTEKE, makeDom().globals);
    for (const n of [2, 3, 8]) for (const t of ['x-wing', 'swordfish', ...Object.keys(PODMNOZICE), ...Object.keys(POLNE)]) assert.equal(run(`genPoShemi('${t}', ${n})`), null, `${t}, vaja ${n + 1}`);
    for (const t of ['naked-single', 'hidden-single']) for (const n of [0, 1]) assert.equal(run(`genPoShemi('${t}', ${n})`), null, `${t}, vaja ${n + 1}`);
  });

  test('E1 in »Vadi v uganki« nimata vaje po shemi', () => {
    const e1 = krog('naked-single', 4);
    assert.equal(poShemi(e1.dom), undefined);
    assert.doesNotMatch(vaja(e1.dom).innerHTML, /po shemi/);
    for (const t of ['x-wing', 'swordfish']) {
      const dom = makeDom();
      const { run } = loadContext(DATOTEKE, dom.globals);
      run(SEME(4));
      run(`zacniKrog('${t}', 'uganka')`);
      assert.equal(poShemi(dom), undefined, t);
      assert.ok(!vObmocju(dom).some(e => /po shemi/.test(e.innerHTML || '') || /po shemi/.test(e.textContent || '')), t);
    }
  });

  test('besedila vaje po shemi: brez »številk«, ločila (pomišljaj, brez ravnih narekovajev)', () => {
    for (const tehnika of ['pointing', 'box-line', 'x-wing', 'swordfish', ...Object.keys(PODMNOZICE), ...Object.keys(POLNE)]) for (const n of [0, 1]) {
      const { dom } = krog(tehnika, 8, n);
      for (const b of [vaja(dom).innerHTML.replace(/<[^>]*>/g, ' '), poShemi(dom).textContent]) {
        assert.doesNotMatch(b, /številk/i, b);
        assert.doesNotMatch(b, / - |—|"|\.\.\./, b);
      }
    }
  });
};
