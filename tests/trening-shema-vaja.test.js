'use strict';
// Razdelek »Shema« ob vaji v treningu - popravka po ročnem pregledu naloge 4a (docs/trening-ucenje-nacrt.md,
// razdelek 7) v nadomestnem DOM-u:
//   1. V »Spoznaj« in »Vadi v uganki« je vse besedilo sheme (naslov risbe, legenda, sklep, napis o črkah,
//      opombe) nad risbo, risba je zadnja; razdelek stoji tik nad mrežo vaje (v »Vadi v uganki« tik nad
//      ploščo z mrežo). Pri vseh tehnikah 1-13. Pomoč ostane, kot je (risba prva, besedilo pod njo).
//      Popravek 3 (drugi ročni pregled): vrstica s preslikavo je pod risbo, med razdelkom in mrežo vaje, in
//      se spet glasi »Vaja po shemi zgoraj – …« (»po obrnjeni shemi«, »po zrcaljeni shemi«, pri 9 z obliko).
//   5. Črke shem: najprej x, y, z, a in b šele, ko jih je več (13); pri 10 · W-krilo x in y (prej a, b) v
//      shemi in v besedilih tehnike.
//   2. 9 · Veriga ene števke: odprta je samo risba, ki ustreza vaji (Nebotičnik ali Zmaj z dvema
//      vrvicama), druga oblika je pod njo v zaprtem razdelku »Druga oblika: …«; Pomoč kaže obe.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const DATOTEKE = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'];
const SEME = s => `{ let seme = ${s}; Math.random = () => { seme = (seme + 0x6D2B79F5) | 0;
  let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`;
const TEHNIKE = ['pointing', 'box-line', 'naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple', 'x-wing', 'swordfish',
  'turbot-fish', 'w-wing', 'xy-wing', 'unique-rectangle', 'xy-chain'];
// Mreža vaje v »Spoznaj« (razred elementa, ki je otrok vaje).
const MREZA = ['vaja-presek', 'layout-row', 'layout-col', 'layout-block', 'xw-grid', 'g9'];
const RISBA_9 = { 'Skyscraper': 'Nebotičnik (Skyscraper)', 'Two-String Kite': 'Zmaj z dvema vrvicama (2-String Kite)' };

const vsi = (el, out = []) => { for (const c of el.children || []) { out.push(c); vsi(c, out); } return out; };
const razredi = e => (e.className || '').split(' ');

// Trening s semenom; setTimeout gre v vrsto (iskanje vaje »Vadi v uganki«), ura je takoj čez mejo - vaja
// iz banke. `zadnja` = vaja »Spoznaj« (genPoShemi ali MODES[].gen).
function trening(seme = 5) {
  const dom = makeDom();
  const vrsta = [];
  dom.globals.setTimeout = f => { vrsta.push(f); return vrsta.length; };
  const { run } = loadContext(DATOTEKE, dom.globals);
  run(SEME(seme));
  run('vadiZdaj = (() => { let t = 0; return () => (t += 5000); })()');
  run(`{ const g = genPoShemi; genPoShemi = (m, n) => (globalThis.zadnja = g(m, n));
    for (const m of Object.keys(MODES)) { const mg = MODES[m].gen; MODES[m].gen = n => (globalThis.zadnja = mg(n)); } }`);
  const izprazni = () => { for (let i = 0; i < 10000 && vrsta.length; i++) vrsta.shift()(); };
  const vaja = () => vsi(dom.el('exerciseArea')).find(e => e.className === 'exercise');
  const shema = () => vsi(dom.el('exerciseArea')).find(e => e.className === 'shema-razdelek');
  return { run, izprazni, vaja, shema };
}

// Figura sheme ob vaji: besedilo (vse razen risb) je pred prvo risbo, za risbo je kvečjemu razdelek
// »Druga oblika« (pri 9).
function preveriFiguro(fig, kje) {
  assert.equal(fig.className, 'shema', kje);
  const otroci = fig.children.map(c => c.className);
  const prva = otroci.indexOf('shema-okvir');
  assert.ok(prva > 0, `${kje}: besedilo nad risbo (${otroci.join(' | ')})`);
  assert.ok(otroci.slice(0, prva).includes('shema-legenda'), `${kje}: legenda nad risbo`);
  assert.ok(otroci.slice(0, prva).includes('shema-crke'), `${kje}: napis o črkah nad risbo`);
  assert.deepEqual(otroci.slice(prva + 1).filter(c => c !== 'shema-druga'), [], `${kje}: za risbo ni besedila (${otroci.join(' | ')})`);
  return otroci;
}

for (const tehnika of TEHNIKE) {
  test(`${tehnika}: »Spoznaj« – besedilo sheme nad risbo, shema nad mrežo, preslikava »Vaja po shemi zgoraj« tik nad mrežo`, () => {
    const { run, vaja, shema } = trening();
    run(`zacniKrog('${tehnika}', 'spoznaj')`);
    for (const n of [0, 1, 2]) {
      if (n) run('exNum++; renderExercise()');
      const kje = `vaja ${n + 1}`;
      preveriFiguro(shema().children[1], kje);
      const otroci = vaja().children, i = otroci.indexOf(shema());
      const ps = otroci.find(e => e.className === 'po-shemi');
      // Za shemo je vrstica s preslikavo (vaji 1 in 2) in takoj za njo mreža.
      // Pri enoti blok so pred mrežo še oznake celic (del mreže, test spodaj).
      let zaPreslikavo = ps ? i + 2 : i + 1;
      if (razredi(otroci[zaPreslikavo + 1]).includes('layout-block')) zaPreslikavo++;
      assert.ok(MREZA.some(r => razredi(otroci[zaPreslikavo]).includes(r)), `${kje}: tik nad mrežo (${otroci.slice(i + 1, i + 3).map(e => e.className).join(' | ')})`);
      if (n < 2) {
        assert.ok(ps && otroci.indexOf(ps) === i + 1, `${kje}: vrstica s preslikavo pod shemo, tik nad mrežo`);
        assert.match(ps.textContent, /^Vaja po (obrnjeni |zrcaljeni )?shemi zgoraj/, kje);
      } else assert.equal(ps, undefined, `${kje}: vaja iz generatorja brez preslikave`);
    }
  });

  test(`${tehnika}: »Vadi v uganki« – besedilo sheme nad risbo, shema tik nad ploščo z mrežo`, () => {
    const { run, izprazni, vaja, shema } = trening();
    run(`zacniKrog('${tehnika}', 'uganka')`);
    izprazni();
    preveriFiguro(shema().children[1], 'Vadi v uganki');
    const otroci = vaja().children, i = otroci.indexOf(shema());
    assert.equal(otroci[i + 1].className, 'vaja-uganka', 'za shemo je plošča');
    assert.ok(otroci.findIndex(e => e.className === 'vaja-info') < i, 'vrstica z uganko nad shemo');
  });
}

// Popravek v nalogi 4b, korak 3 (napaka od 705349a): pri 3–6 z enoto blok (vaja 3 kroga) so oznake celic
// (V4S4 … V6S6) del mreže - razdelek »Shema« je nad njimi, oznake tik nad mrežo bloka.
for (const tehnika of ['naked-pair', 'hidden-pair', 'naked-triple', 'hidden-triple']) {
  test(`${tehnika}: »Spoznaj«, enota blok – shema nad oznakami celic, oznake tik nad mrežo`, () => {
    const { run, vaja, shema } = trening();
    run(`zacniKrog('${tehnika}', 'spoznaj'); exNum = 2; renderExercise()`);
    assert.equal(run('zadnja.unitType'), 'block');
    const otroci = vaja().children, i = otroci.indexOf(shema());
    const blok = otroci.findIndex(e => razredi(e).includes('layout-block'));
    const pozicije = run('zadnja.slots.map(s => s.pos).join("")');
    assert.equal(otroci[blok - 1].textContent, pozicije, 'tik nad mrežo bloka so oznake celic');
    assert.equal(i, blok - 2, `shema tik nad oznakami (${otroci.slice(i, blok + 1).map(e => e.className || e.textContent).join(' | ')})`);
  });
}

test('Pomoč: shema ostane, kot je – risba prva, besedilo pod njo; pri 9 obe risbi z naslovom, brez »Druga oblika«', () => {
  const { run } = trening();
  for (const t of TEHNIKE) {
    const otroci = run(`izrisiShemo('${t}').children.map(c => c.className)`);
    const prva = otroci.indexOf('shema-okvir'), legenda = otroci.indexOf('shema-legenda');
    assert.ok(prva >= 0 && prva < legenda, `${t}: ${otroci.join(' | ')}`);
    assert.ok(!otroci.includes('shema-druga'), t);
  }
  const fig = run("izrisiShemo('turbot-fish')");
  assert.equal(fig.children.filter(c => c.className === 'shema-okvir').length, 2);
  assert.deepEqual(fig.children.filter(c => c.className === 'shema-naslov').map(c => c.textContent), Object.values(RISBA_9));
});

// Risba vaje pri 9: naslov in risba zunaj razdelka »Druga oblika«, druga oblika v zaprtem razdelku pod njo.
function risbe9(shema) {
  const fig = shema.children[1];
  const odprte = fig.children.filter(c => c.className === 'shema-okvir');
  const naslov = fig.children.filter(c => c.className === 'shema-naslov').map(c => c.textContent);
  const druga = fig.children.find(c => c.className === 'shema-druga');
  const aria = okvir => okvir.innerHTML.match(/aria-label="Shema vzorca: Veriga ene števke – ([^"]*)"/)[1];
  return {
    odprte: odprte.length, naslov, odprta: aria(odprte[0]),
    druga: druga && { tag: druga.tagName, open: !!druga.open, napis: druga.children[0].textContent,
      risba: aria(druga.children.find(c => c.className === 'shema-okvir')),
      sklep: druga.children.some(c => c.className === 'shema-sklep') },
  };
}

test('9 · Veriga ene števke: »Spoznaj« – odprta risba vaje, druga oblika na zahtevo (vaje 1–4)', () => {
  const { run, shema } = trening();
  run("zacniKrog('turbot-fish', 'spoznaj')");
  for (const n of [0, 1, 2, 3]) {
    if (n) run('exNum++; renderExercise()');
    const varianta = run('zadnja.variant');
    const [ta, druga] = varianta === 'Skyscraper' ? [RISBA_9['Skyscraper'], RISBA_9['Two-String Kite']] : [RISBA_9['Two-String Kite'], RISBA_9['Skyscraper']];
    assert.equal(varianta, ['Skyscraper', 'Two-String Kite'][n % 2], `vaja ${n + 1}: podtip`);
    const r = risbe9(shema());
    assert.equal(r.odprte, 1, `vaja ${n + 1}: ena odprta risba`);
    assert.deepEqual(r.naslov, [ta], `vaja ${n + 1}: naslov`);
    assert.equal(r.odprta, ta, `vaja ${n + 1}: risba vaje`);
    assert.deepEqual(r.druga, { tag: 'DETAILS', open: false, napis: `Druga oblika: ${druga.replace(/ \(.*\)$/, '')}`, risba: druga, sklep: true }, `vaja ${n + 1}: druga oblika`);
  }
  // Vrstica s preslikavo pri vaji po shemi pove obliko.
  run("zacniKrog('turbot-fish', 'spoznaj')");
  assert.match(vsi(run('area')).find(e => e.className === 'po-shemi').textContent, /^Vaja po shemi zgoraj \(Nebotičnik\) – iste celice, črka x je števka \d\.$/);
  run('exNum++; renderExercise()');
  assert.match(vsi(run('area')).find(e => e.className === 'po-shemi').textContent, /^Vaja po shemi zgoraj \(Zmaj z dvema vrvicama\) – iste celice, črka x je števka \d\.$/);
});

test('9 · Veriga ene števke: »Vadi v uganki« – odprta risba koraka vaje, druga oblika na zahtevo', () => {
  const vrste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const { run, izprazni, shema } = trening(seme);
    run("zacniKrog('turbot-fish', 'uganka')");
    izprazni();
    const varianta = run('vadi.v.KT[0].variant');
    vrste.add(varianta);
    const r = risbe9(shema());
    assert.equal(r.odprte, 1, `seme ${seme}`);
    assert.equal(r.odprta, RISBA_9[varianta], `seme ${seme}: risba koraka (${varianta})`);
    assert.equal(r.druga.open, false, `seme ${seme}: druga oblika zaprta`);
  }
  assert.ok(vrste.size >= 1);
});

// Popravek 5: črke shem - najprej x, y, z; a in b šele, ko je črk več (13 · XY-veriga). Pri 10 · W-krilo x, y
// v shemi in v vseh besedilih tehnike (povzetek, razlaga, posledica, navodilo; kartica v meniju).
test('črke shem: najprej x, y, z, a in b šele pri več črkah; W-krilo x in y tudi v besedilih', () => {
  const { run } = trening();
  const crke = JSON.parse(run(`JSON.stringify(Object.fromEntries(Object.keys(SHEME_TEHNIK).map(k => [k,
    [...new Set(shemaRisbe(k).flatMap(r => r.celice.flatMap(z => shemaCelica(z).zetoni.map(t => t.z))).filter(z => z !== '…'))]])))`));
  for (const [k, c] of Object.entries(crke))
    assert.deepEqual([...c].sort((a, b) => 'xyzab'.indexOf(a) - 'xyzab'.indexOf(b)), [...'xyzab'].slice(0, c.length), `${k}: ${c}`);
  assert.deepEqual(crke['w-wing'].sort(), ['x', 'y']);
  const opis = JSON.parse(run(`JSON.stringify(TEHNIKE_OPISI['w-wing'])`));
  for (const polje of ['povzetek', 'razlaga', 'posledica', 'navodilo'])
    assert.doesNotMatch(opis[polje], /\{a, b\}|(^|[ (])[ab]( |[.,:]|$)/, `W-krilo, ${polje}: ${opis[polje]}`);
  assert.match(opis.povzetek, /\{x, y\}/);
  assert.match(run(`SHEME_TEHNIK['w-wing'].sklep`), /^Vsaj ena celica para je x, zato x izbrišeš/);
});
