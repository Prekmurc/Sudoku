'use strict';
// Povezave med aplikacijami (naloga 4c, korak 4, O8–O14 v docs/navigacija-nacrt.md):
//   - vrstica zavihkov »Igra · Reševalec · Trening« na vrhu glave, statičen HTML, v vseh treh index.html
//     enaka razen aria-current, poti z index.html obstajajo (O8–O10);
//   - koren preusmeri na igro (O14);
//   - vprašanje pred odhodom: trening – odprt krog (razen vaje 1 brez »Preveri« – D2, menija in
//     »Končano!«), reševalec – uganka v mreži, ki ni v zbirki in ni primer; igra ne vpraša (O11, O12);
//   - vrnitev z »Nazaj« brskalnika (pageshow iz predpomnilnika) – sprememba zbirke vmes ima isti odziv
//     kot dogodek "storage" (O13).
// Nadomestni DOM ne parsira HTML, zato je povezava element, ki ga zgradi test, klik pa dogodek na
// vrstici (#aplikacije), kot ga v brskalniku dobi poslušalec vrstice. Postavitev in pravi kliki:
// tools/preveri-navigacija-brskalnik.js --korak 4.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom, Element } = require('./dom-stub.js');

const KOREN = path.join(__dirname, '..');
const beri = p => fs.readFileSync(path.join(KOREN, p), 'utf8');
const APLIKACIJE = [['igra', 'Igra'], ['app', 'Reševalec'], ['trening', 'Trening']];

const TRENING = ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
  'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js',
  'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'];
const RESEVALEC = ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js',
  'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'app/app.js', 'app/zbirka.js'];
const IGRA = ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
  'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'igra/shramba.js', 'igra/igra.js'];
const ZBIRKA = 'sudoku.zbirka.v1';

test('vrstica zavihkov: na vrhu glave, v vseh treh index.html enaka razen aria-current, cilji obstajajo', () => {
  const vrstice = [];
  for (const [mapa, ime] of APLIKACIJE) {
    const html = beri(`${mapa}/index.html`);
    const glava = html.indexOf('<header class="top">');
    const nav = html.indexOf('<nav id="aplikacije"');
    const vrsta = html.indexOf('<div class="top-row">');
    assert.ok(glava >= 0 && nav > glava && vrsta > nav, `${mapa}: vrstica je v glavi nad nadnaslovom`);
    assert.match(html.slice(glava + '<header class="top">'.length, nav), /^\s*$/, `${mapa}: prvi otrok glave`);
    const v = html.slice(nav, html.indexOf('</nav>', nav) + 6);
    assert.match(v, /^<nav id="aplikacije" class="aplikacije" aria-label="Aplikacije">/);
    const povezave = [...v.matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)];
    assert.deepEqual(povezave.map(p => p[2]), ['Igra', 'Reševalec', 'Trening'], `${mapa}: napisi in vrstni red`);
    assert.deepEqual(povezave.filter(p => / aria-current="page"/.test(` ${p[1]}`)).map(p => p[2]), [ime], `${mapa}: trenutni zavihek`);
    for (const [, atributi, napis] of povezave) {
      const href = /href="([^"]*)"/.exec(atributi)[1];
      assert.match(href, /^\.\.\/(igra|app|trening)\/index\.html$/, `${mapa} → ${napis}: pot z index.html (O10)`);
      assert.ok(fs.existsSync(path.join(KOREN, mapa, href)), `${mapa} → ${napis}: cilj obstaja`);
      assert.doesNotMatch(atributi, /target=/, 'isti zavihek');
    }
    assert.deepEqual(povezave.map(p => /href="\.\.\/(\w+)\//.exec(p[1])[1]), ['igra', 'app', 'trening']);
    vrstice.push(v.replace(' aria-current="page"', '').replace(/\r\n/g, '\n')); // igra in reševalec imata CRLF
  }
  assert.equal(vrstice[1], vrstice[0], 'reševalec = igra');
  assert.equal(vrstice[2], vrstice[0], 'trening = igra');
});

test('koren: index.html preusmeri na igro, povezava za primer, ko preusmeritev ne dela (O14)', () => {
  const html = beri('index.html');
  assert.match(html, /<html lang="sl">/);
  assert.match(html, /<meta charset="UTF-8">/);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=igra\/index\.html">/);
  assert.match(html, /<a href="igra\/index\.html">/);
  assert.ok(fs.existsSync(path.join(KOREN, 'igra', 'index.html')));
});

// Povezava, kot jo vidi poslušalec vrstice: element <a>, trenutna z aria-current.
function povezava(napis, trenutna = false) {
  const a = new Element('a');
  a.textContent = napis;
  a.setAttribute('href', `../${{ Igra: 'igra', Reševalec: 'app', Trening: 'trening' }[napis]}/index.html`);
  if (trenutna) a.setAttribute('aria-current', 'page');
  return a;
}
// Klik povezave v vrstici; vrne true, če brskalnik odide (privzeto dejanje ni preprečeno).
function klikni(dom, a, dodatno = {}) {
  let preprecen = false;
  dom.el('aplikacije').sprozi('click', { target: a, button: 0, preventDefault() { preprecen = true; }, ...dodatno });
  return !preprecen;
}
// Aplikacija v nadomestnem DOM-u; confirm zapiše vprašanje in vrne odgovor.
function aplikacija(datoteke, shramba, extra = {}) {
  const dom = makeDom(shramba);
  const vprasanja = [];
  let odgovor = true;
  dom.globals.confirm = (t) => { vprasanja.push(t); return odgovor; };
  Object.assign(dom.globals, extra);
  const { run } = loadContext(datoteke, dom.globals);
  return { dom, run, vprasanja, odgovori: v => { odgovor = v; } };
}
// Prvi potomec, ki ustreza pogoju (iskanje po drevesu nadomestnega DOM-a).
function najdi(el, pogoj) {
  for (const c of el.children || []) {
    if (pogoj(c)) return c;
    const r = najdi(c, pogoj);
    if (r) return r;
  }
  return null;
}

test('trening: vprašanje pred odhodom iz kroga (O11), brez njega v meniju, pri vaji 1 brez »Preveri« (D2) in pri »Končano!«', () => {
  const t = aplikacija(TRENING, undefined, { setTimeout: () => 0 }); // iskanje »Vadi v uganki« ni potrebno
  const igra = povezava('Igra');

  assert.equal(klikni(t.dom, igra), true, 'meni: odide');
  assert.equal(klikni(t.dom, povezava('Trening', true)), false, 'trenutni zavihek ne naredi nič');
  assert.deepEqual(t.vprasanja, [], 'brez vprašanja');

  // Vaja 1 brez »Preveri« – nič se ne izgubi (D2).
  t.run('zacniKrog("naked-pair", "spoznaj")');
  assert.equal(klikni(t.dom, igra), true);
  assert.deepEqual(t.vprasanja, []);

  // »Preveri« (tudi brez izbire – ne šteje) pri vaji 1: od zdaj vpraša.
  najdi(t.dom.el('exerciseArea'), c => c.tagName === 'BUTTON' && c.textContent === 'Preveri').sprozi('click');
  t.odgovori(false);
  assert.equal(klikni(t.dom, igra), false, 'preklic: ostane');
  assert.deepEqual(t.vprasanja, ['Zapustiš trening? Krog 3 · Očitni par (vaja 1 / 9, pravilno 0 / 0) se ne shrani.']);
  assert.equal(t.run('mode'), 'naked-pair');
  assert.equal(t.run('exNum'), 0);
  assert.equal(t.dom.el('trainer').style.display, 'block', 'vaja ostane odprta');
  t.odgovori(true);
  assert.equal(klikni(t.dom, povezava('Reševalec')), true, 'potrditev: odide');
  assert.equal(t.vprasanja.length, 2);

  // Ctrl/⌘ ali Shift+klik in srednji gumb odprejo nov zavihek ali okno – krog ostane, brez vprašanja.
  for (const d of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
    assert.equal(klikni(t.dom, igra, d), true);
  }
  assert.equal(t.vprasanja.length, 2);
  assert.equal(klikni(t.dom, povezava('Trening', true)), false, 'trenutni zavihek med vajo ne naredi nič');
  assert.equal(t.vprasanja.length, 2, 'in ne vpraša');

  // Nov krog začne brez »Preveri«; pri vaji 3 vpraša (krog je v teku), rezultat iz kroga.
  t.run('zacniKrog("hidden-pair", "spoznaj"); scoreRight = 2; scoreTotal = 2; exNum = 2; renderExercise()');
  t.odgovori(false);
  assert.equal(klikni(t.dom, igra), false);
  assert.equal(t.vprasanja.at(-1), 'Zapustiš trening? Krog 4 · Skriti par (vaja 3 / 9, pravilno 2 / 2) se ne shrani.');

  // »Končano!« – krog je končan, nič se ne izgubi.
  t.run('exNum = MAX_EX; renderExercise()');
  const n = t.vprasanja.length;
  assert.equal(klikni(t.dom, igra), true);
  assert.equal(t.vprasanja.length, n);

  // »Vadi v uganki«: vaja 1 brez »Preveri« brez vprašanja, vaja 2 z načinom v besedilu.
  t.run('zacniKrog("x-wing", "uganka")');
  assert.equal(klikni(t.dom, igra), true);
  assert.equal(t.vprasanja.length, n);
  t.run('exNum = 1; renderExercise()');
  assert.equal(klikni(t.dom, igra), false);
  assert.equal(t.vprasanja.at(-1), 'Zapustiš trening? Krog 7 · X-krilo · Vadi v uganki (vaja 2 / 9, pravilno 0 / 0) se ne shrani.');

  // Po »Nazaj na izbiro« je spet meni.
  t.dom.klikni('backBtn');
  assert.equal(klikni(t.dom, igra), true);
  assert.equal(t.vprasanja.length, n + 1);
});

const [a, b] = (() => {
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/generator.js']);
  return loadPuzzles().map(p => p.danosti.replace(/\./g, '0'))
    .filter(d => !run(`!!zbirkaPrimerZa(${JSON.stringify(d)})`) && run(`countSolutions(${JSON.stringify(d)})`) === 1);
})();
const shrambaZ = (...danosti) => new Map([[ZBIRKA, JSON.stringify(danosti.map((d, i) => ({ danosti: d, tezavnost: 'Lahka', izvor: 'rocno', dodano: `2026-10-0${i + 1} 10:00` })))]]);

test('reševalec: vpraša samo pri uganki, ki ni v zbirki in ni vgrajeni primer (O12)', () => {
  const r = aplikacija(RESEVALEC, shrambaZ(a), { setTimeout: f => f() }); // »Reši« takoj
  const igra = povezava('Igra');
  const VPRASANJE = 'Zapustiš reševalec? Uganka v mreži ni shranjena v zbirko.';

  assert.equal(klikni(r.dom, igra), true, 'prazna mreža');
  r.run('naloziDanosti(PRIMERI[0].danosti)');
  assert.equal(klikni(r.dom, igra), true, 'vgrajeni primer');
  r.run(`naloziDanosti(${JSON.stringify(a)})`);
  assert.equal(klikni(r.dom, igra), true, 'uganka iz zbirke');
  assert.deepEqual(r.vprasanja, []);

  // Uganka iz zbirke z eno števko več – ni več ista uganka.
  r.run(`inputs[${JSON.stringify(a)}.indexOf('0')].value = '1'`);
  r.odgovori(false);
  assert.equal(klikni(r.dom, igra), false, 'preklic: ostane');
  assert.deepEqual(r.vprasanja, [VPRASANJE]);
  assert.equal(r.run('currentGivens()').replace(/0/g, '').length, a.replace(/0/g, '').length + 1, 'mreža nespremenjena');

  // Vtipkana uganka: vpraša, dokler je »Reši« ne shrani v zbirko.
  r.run(`naloziDanosti(${JSON.stringify(b)})`);
  r.odgovori(true);
  assert.equal(klikni(r.dom, povezava('Trening')), true, 'potrditev: odide');
  assert.equal(r.vprasanja.length, 2);
  r.dom.klikni('solveBtn');
  assert.equal(klikni(r.dom, igra), true, 'po »Reši« je v zbirki');
  assert.equal(r.vprasanja.length, 2);
  assert.equal(klikni(r.dom, povezava('Reševalec', true)), false, 'trenutni zavihek ne naredi nič');
});

test('igra ne vpraša – igra in zbirka sta shranjeni po vsaki potezi', () => {
  const g = aplikacija(IGRA, shrambaZ(a));
  g.run(`zacniIgro(${JSON.stringify(a)})`);
  g.run("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");
  assert.equal(klikni(g.dom, povezava('Reševalec')), true);
  assert.equal(klikni(g.dom, povezava('Trening')), true);
  assert.equal(klikni(g.dom, povezava('Igra', true)), false, 'trenutni zavihek ne naredi nič');
  assert.deepEqual(g.vprasanja, []);
});

test('vrnitev z »Nazaj« (pageshow iz predpomnilnika): uganka, vmes izbrisana drugje, izprazni igro (O13)', () => {
  const shramba = shrambaZ(a, b);
  const g = aplikacija(IGRA, shramba);
  const okno = g.dom.globals.window;
  g.run(`zacniIgro(${JSON.stringify(a)})`);
  g.run("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");
  const r = aplikacija(RESEVALEC, shramba);

  // Odhod in vrnitev brez spremembe: igra ostane.
  okno.sprozi('pagehide', { persisted: true });
  okno.sprozi('pageshow', { persisted: true });
  assert.equal(g.run('igra.danosti'), a);

  // Odhod, v reševalcu izbris druge uganke, vrnitev: igra ostane, števec se osveži.
  okno.sprozi('pagehide', { persisted: true });
  r.run(`zbirkaIzbrisi(${JSON.stringify(b)})`);
  okno.sprozi('pageshow', { persisted: true });
  assert.equal(g.run('igra.danosti'), a);
  assert.equal(g.dom.el('zbirkaBtn').textContent, 'Zbirka (1)');

  // Odhod, v reševalcu izbris odprte uganke (in njene igre), vrnitev: mreža prazna, brez zapisa igre.
  okno.sprozi('pagehide', { persisted: true });
  r.run(`zbirkaIzbrisi(${JSON.stringify(a)})`);
  okno.sprozi('pageshow', { persisted: true });
  assert.equal(g.run('igra'), null, 'mreža je prazna');
  assert.equal(g.dom.el('zbirkaBtn').textContent, 'Zbirka (0)');
  assert.equal(g.run(`!!igreBeri().igre[${JSON.stringify(a)}]`), false);

  // Navadno nalaganje (ne iz predpomnilnika) ne sproži odziva.
  const r2 = aplikacija(RESEVALEC, shramba);
  const okno2 = r2.dom.globals.window;
  okno2.sprozi('pagehide', { persisted: false });
  shramba.set(ZBIRKA, JSON.stringify([{ danosti: b, tezavnost: 'Lahka', izvor: 'rocno', dodano: '2026-10-01 10:00' }]));
  okno2.sprozi('pageshow', { persisted: false });
  assert.equal(r2.dom.el('libraryBtn').textContent, 'Zbirka (0)', 'brez odziva');
  // Reševalec ob vrnitvi iz predpomnilnika osveži števec.
  okno2.sprozi('pagehide', { persisted: true });
  shramba.set(ZBIRKA, JSON.stringify([{ danosti: a, tezavnost: 'Lahka', izvor: 'rocno', dodano: '2026-10-01 10:00' },
    { danosti: b, tezavnost: 'Lahka', izvor: 'rocno', dodano: '2026-10-01 10:00' }]));
  okno2.sprozi('pageshow', { persisted: true });
  assert.equal(r2.dom.el('libraryBtn').textContent, 'Zbirka (2)');
});
