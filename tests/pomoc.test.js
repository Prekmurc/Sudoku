'use strict';
// Okno Pomoč (shared/pomoc.js, faza 6, korak c) v igri, reševalcu in treningu - v nadomestnem
// DOM-u: gumb odpre okno, klik ob oknu in Escape ga zapreta, razdelek »Tehnike« ima v vseh treh
// aplikacijah isto vsebino (poved o ravneh, E1, E2, 1-13 z oznako, imenom, značko ravni ter razlago
// in posledico, pri 1-13 zložljivo »Shema«, privzeto zaprto - faza 3a, korak 4), reševalec našteje stopnje, ki jih uganka lahko dobi (z Ekstremom), v treningu ob
// odprtem oknu tipke ne gredo v ploščo. Videz okna (pokrije zaslon, brez vodoravnega drsnika, ✕)
// preverja tools/preveri-pomoc-brskalnik.js.
// Naloga 4c, korak 3 (docs/navigacija-nacrt.md, O1–O3): kazalo razdelkov pod glavo okna (iz naslovov
// h3.navodila-razdelek – okno zgradi test iz index.html), vrstica 15 oznak tehnik v razdelku »Tehnike«
// (ista sestavina kot kazalo v meniju treninga), v glavi »↑ Na vrh« (po 400 px) in ✕; lepljiva glava samo
// v oknu Pomoč (D1). Razporeditev, drsenje in primerjavo drugih oken preverja
// tools/preveri-navigacija-brskalnik.js --korak 3.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const fs = require('node:fs');
const path = require('node:path');
const { makeDom, Element, omogociIskanje } = require('./dom-stub.js');

const APLIKACIJE = {
  igra: {
    datoteke: ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
      'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'igra/shramba.js', 'igra/igra.js'],
    okno: 'navodilaDialog', gumbi: ['navodilaBtn', 'navodilaKarticaBtn'], tehnike: 'tehnikeSeznam', html: 'igra/index.html',
    razdelki: ['Kako igrati', 'Pomoč pri reševanju', 'Seznami manjkajočih števk', 'Zbirka ugank', 'Tehnike'],
  },
  resevalec: {
    datoteke: ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js', 'shared/sheme.js',
      'shared/navigacija.js', 'app/app.js', 'app/zbirka.js'],
    okno: 'pomocDialog', gumbi: ['pomocBtn'], tehnike: 'pomocTehnike', html: 'app/index.html',
    razdelki: ['Kako deluje', 'Rešitev in koraki', 'Zbirka ugank', 'Težavnost', 'Tehnike'],
  },
  trening: {
    datoteke: ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
      'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'shared/sheme.js', 'shared/navigacija.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/izbris.js', 'trening/trening.js'],
    okno: 'pomocDialog', gumbi: ['pomocBtn'], tehnike: 'pomocTehnike', html: 'trening/index.html',
    razdelki: ['Spoznaj in Vadi v uganki', 'Postopnost', 'Namig, Rešitev in Razlaga', 'Označi izbrane', 'Tipkovnica', 'Tehnike'],
  },
};
// Naslovi razdelkov okna Pomoč, kot so v index.html (h3.navodila-razdelek v elementu okna).
function nasloviIzHtml(a) {
  const html = fs.readFileSync(path.join(__dirname, '..', a.html), 'utf8');
  const od = html.indexOf(`<div id="${a.okno}"`);
  const naslednje = html.indexOf('\n<div id=', od + 1);
  const del = html.slice(od, naslednje > 0 ? naslednje : html.indexOf('<script', od));
  return [...del.matchAll(/<h3 class="navodila-razdelek">([^<]*)<\/h3>/g)].map(m => m[1]);
}
// Okno Pomoč v nadomestnem DOM-u, zgrajeno pred nalaganjem skript (kot v index.html): panel, glava
// (naslov in ✕ z data-zapri), naslovi razdelkov iz index.html in element seznama tehnik; okno in panel
// znata querySelector. Klici scrollIntoView, focus in scrollTo se zapišejo v `klici`.
function zgradiOkno(dom, a) {
  const klici = [];
  const zapisuj = (e, ime) => {
    e.scrollIntoView = o => klici.push(['scrollIntoView', ime, o]);
    e.focus = o => klici.push(['focus', ime, o]);
  };
  const okno = dom.el(a.okno);
  const panel = new Element('div');
  panel.className = 'dialog-panel dialog-navodila';
  const glava = new Element('div');
  glava.className = 'dialog-glava';
  const h2 = new Element('h2');
  h2.textContent = 'Pomoč';
  const x = new Element('button');
  x.className = 'dialog-zapri';
  x.setAttribute('data-zapri', '');
  zapisuj(x, '✕');
  glava.append(h2, x);
  okno.appendChild(panel);
  panel.appendChild(glava);
  const naslovi = nasloviIzHtml(a).map(t => {
    const h = new Element('h3');
    h.className = 'navodila-razdelek';
    h.textContent = t;
    h.parentNode = panel;
    zapisuj(h, t);
    panel.appendChild(h);
    return h;
  });
  panel.appendChild(dom.el(a.tehnike));
  omogociIskanje(okno);
  omogociIskanje(panel);
  okno.scrollTop = 0;
  okno.scrollTo = o => { klici.push(['scrollTo', o]); okno.scrollTop = o.top; };
  return { okno, panel, glava, h2, x, naslovi, klici };
}
function nalozi(ime, { okno = false } = {}) {
  const dom = makeDom();
  const o = okno ? zgradiOkno(dom, APLIKACIJE[ime]) : null;
  const { run } = loadContext(APLIKACIJE[ime].datoteke, dom.globals);
  return { dom, run, o };
}
const RAVNI = { 'E1': 'lahka', 'E2': 'lahka' };
for (let i = 1; i <= 12; i++) RAVNI[String(i)] = i <= 6 ? 'srednja' : 'napredna';
RAVNI['13'] = 'ekspertna';

for (const ime of Object.keys(APLIKACIJE)) {
  test(`${ime}: gumb odpre okno Pomoč, klik ob oknu in Escape ga zapreta`, () => {
    const { dom } = nalozi(ime);
    const a = APLIKACIJE[ime], okno = dom.el(a.okno);
    for (const g of a.gumbi) {
      assert.equal(okno.classList.contains('odprt'), false, 'privzeto zaprto');
      dom.klikni(g);
      assert.equal(okno.classList.contains('odprt'), true, `${g} odpre okno`);
      okno.sprozi('click', { target: okno });
      assert.equal(okno.classList.contains('odprt'), false, 'klik ob oknu ga zapre');
    }
    dom.klikni(a.gumbi[0]);
    dom.tipka({ key: 'Escape' });
    assert.equal(okno.classList.contains('odprt'), false, 'Escape ga zapre');
  });

  test(`${ime}: razdelek »Tehnike« – poved o ravneh, E1, E2, 1-13, značka ravni, razlaga in posledica v svojih odstavkih`, () => {
    const { dom, run } = nalozi(ime);
    const [uvod, , ul] = dom.el(APLIKACIJE[ime].tehnike).children;
    assert.match(uvod.textContent, /^Tehnike so v štirih ravneh: lahke \(E1, E2\), srednje \(1–6\), napredne \(7–12\) in ekspertne \(13\)/);
    const vaje = [...run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]')];
    assert.equal(ul.children.length, 15);
    ul.children.forEach((li, i) => {
      const [kljuc, tehnika] = vaje[i];
      const [oznaka, ime, , raven, razlaga, posledica] = li.children;
      const o = run('oznakaTehnike')(kljuc);
      assert.equal(oznaka.textContent, `${o} · `);
      assert.equal(ime.textContent, run('imeTehnike')(tehnika));
      assert.equal(raven.textContent, RAVNI[o], `${o}: raven`);
      assert.equal(raven.className, `tag ${run('tagClass')(tehnika)} tehnika-raven`);
      // Posledica je svoj odstavek, ne zlita z razlago (popravek po ročnem pregledu faze 6).
      assert.equal(razlaga.tagName, 'P');
      assert.equal(razlaga.textContent, run('TEHNIKE_OPISI')[kljuc].razlaga);
      assert.equal(posledica.tagName, 'P');
      assert.equal(posledica.textContent, run('TEHNIKE_OPISI')[kljuc].posledica);
      // Faza 3a, korak 4: pri 1-13 pod posledico zložljivo »Shema«, privzeto zaprto; E1, E2 brez.
      const shema = run('SHEME_TEHNIK')[kljuc];
      assert.equal(li.children.length, shema ? 7 : 6, `${o}: shema samo pri 1-13`);
      if (shema) {
        const d = li.children[6];
        assert.equal(d.tagName, 'DETAILS');
        assert.equal(d.className, 'tehnika-shema');
        assert.equal(!!d.open, false, `${o}: shema privzeto zaprta`);
        assert.equal(d.children[0].tagName, 'SUMMARY');
        assert.equal(d.children[0].textContent, 'Shema');
        const fig = d.children[1];
        assert.equal(fig.className, 'shema');
        assert.equal(fig.dataset.tehnika, kljuc);
        assert.equal(fig.children.filter(c => c.className === 'shema-okvir').map(c => c.innerHTML).join(''),
          run('shemaRisbe')(kljuc).map((r, n) => run('svgSheme')(kljuc, n)).join(''), `${o}: ista risba kot v treningu`);
      }
    });
    assert.ok(/^(E1|E2)$/.test(run('oznakaTehnike')(vaje[0][0])) && ul.children.slice(2).every(li => li.children.length === 7), 'sheme pri vseh 1-13');
  });
}

for (const ime of Object.keys(APLIKACIJE)) {
  test(`${ime}: kazalo razdelkov pod glavo okna – gumbi z naslovi razdelkov v vrstnem redu, klik pomakne do naslova (O1)`, () => {
    const a = APLIKACIJE[ime];
    assert.deepEqual(nasloviIzHtml(a), a.razdelki, 'naslovi razdelkov v index.html');
    const { o } = nalozi(ime, { okno: true });
    const i = o.panel.children.indexOf(o.naslovi[0]);
    const nav = o.panel.children[i - 1];
    assert.equal(nav.tagName, 'NAV', 'kazalo tik pred prvim razdelkom');
    assert.equal(o.panel.children[i - 2], o.glava, 'kazalo tik pod glavo');
    assert.equal(nav.className, 'pomoc-kazalo');
    assert.equal(nav.getAttribute('aria-label'), 'Kazalo razdelkov');
    assert.deepEqual(nav.children.map(b => b.textContent), a.razdelki);
    assert.ok(nav.children.every(b => b.tagName === 'BUTTON' && b.type === 'button'));
    nav.children.forEach((b, n) => {
      o.klici.length = 0;
      b.sprozi('click');
      const h = o.naslovi[n];
      assert.equal(h.getAttribute('tabindex'), '-1', `${a.razdelki[n]}: naslov dobi fokus`);
      assert.deepEqual(o.klici.map(k => k.slice(0, 2)), [['scrollIntoView', a.razdelki[n]], ['focus', a.razdelki[n]]]);
      assert.equal(o.klici[0][2].block, 'start');
      assert.equal(o.klici[1][2].preventScroll, true, 'fokus ne pomakne še enkrat');
    });
  });

  test(`${ime}: glava okna – »Pomoč«, »↑ Na vrh« (po 400 px) in ✕; »↑ Na vrh« vrne na kazalo (O3)`, () => {
    const { dom, run, o } = nalozi(ime, { okno: true });
    assert.deepEqual(o.glava.children.map(e => e.tagName), ['H2', 'BUTTON', 'BUTTON']);
    const gor = o.glava.children[1];
    assert.equal(o.glava.children[2], o.x, '✕ zadnji');
    assert.equal(gor.className, 'dialog-na-vrh');
    assert.equal(gor.getAttribute('aria-label'), '↑ Na vrh');
    assert.equal(gor.type, 'button');
    assert.equal(gor.getAttribute('data-zapri'), null, '»↑ Na vrh« okna ne zapre');
    dom.klikni(APLIKACIJE[ime].gumbi[0]);
    assert.equal(gor.hidden, true, 'ob odprtju skrit');
    for (const [y, viden] of [[399, false], [400, false], [401, true], [3000, true], [0, false]]) {
      o.okno.scrollTop = y;
      o.okno.sprozi('scroll');
      assert.equal(gor.hidden, !viden, `pomik ${y} px`);
    }
    assert.equal(run('naVrhPomociViden(400)'), false);
    assert.equal(run('naVrhPomociViden(401)'), true);
    o.okno.scrollTop = 2000;
    o.okno.sprozi('scroll');
    o.klici.length = 0;
    gor.sprozi('click');
    assert.deepEqual(o.klici.filter(k => k[0] === 'scrollTo').map(k => k[1].top), [0], 'klik pomakne okno na vrh');
    o.okno.sprozi('scroll');
    assert.equal(gor.hidden, true, 'na vrhu spet skrit');
    assert.equal(o.okno.classList.contains('odprt'), true, 'okno ostane odprto');
    // Ponovno odprtje: vidnost se osveži (okno je spet na vrhu).
    o.okno.scrollTop = 900;
    o.okno.sprozi('scroll');
    o.okno.classList.remove('odprt');
    o.okno.scrollTop = 0;
    dom.klikni(APLIKACIJE[ime].gumbi[0]);
    assert.equal(gor.hidden, true, 'ob ponovnem odprtju skrit');
  });

  test(`${ime}: razdelek »Tehnike« – vrstica 15 oznak E1 … 13 v barvah ravni, klik pomakne do tehnike (O2)`, () => {
    const { dom, run } = nalozi(ime);
    const [, nav, ul] = dom.el(APLIKACIJE[ime].tehnike).children;
    assert.equal(nav.tagName, 'NAV');
    assert.equal(nav.className, 'kazalo-tehnik');
    assert.equal(nav.getAttribute('aria-label'), 'Kazalo tehnik');
    const vaje = [...run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]')];
    assert.deepEqual(nav.children.map(b => b.textContent), ['E1', 'E2', ...Array.from({ length: 13 }, (_, i) => String(i + 1))]);
    nav.children.forEach((b, i) => {
      const [kljuc, tehnika] = vaje[i];
      const o = b.textContent;
      // Ista sestavina kot kazalo v meniju treninga: .tag v barvi ravni, ime v title in aria-label.
      assert.equal(b.className, `tag ${run('tagClass')(tehnika)}`, `${o}: barva ravni`);
      assert.equal(b.className.split(' ')[1], { lahka: 't-single', srednja: 't-pair', napredna: 't-advanced', ekspertna: 't-expert' }[RAVNI[o]]);
      assert.equal(b.title, run('imeTehnike')(tehnika, { stevilka: true }));
      assert.equal(b.getAttribute('aria-label'), b.title);
      assert.equal(b.dataset.kazalo, kljuc);
      const li = ul.children[i];
      const klici = [];
      li.scrollIntoView = x => klici.push(['scrollIntoView', x]);
      li.focus = x => klici.push(['focus', x]);
      b.sprozi('click');
      assert.deepEqual(klici.map(k => k[0]), ['scrollIntoView', 'focus'], `${o}: klik pomakne do tehnike in ji da fokus`);
      assert.equal(klici[0][1].block, 'start');
      assert.equal(li.getAttribute('tabindex'), '-1');
    });
  });
}

// Popravek A po ročnem pregledu naloge 4c (docs/navigacija-nacrt.md, razdelek 9): ko je okno v razdelku »Tehnike«
// pod vrstico oznak E1 … 13 (vrstica je vsa nad spodnjim robom lepljive glave), gumb v glavi kaže »↑ Tehnike« in
// vrne k vrstici oznak (fokus na E1); sicer »↑ Na vrh« kot prej (po 400 px). Gumb ima oba napisa enega nad drugim
// (neaktivni je neviden), zato je vedno enako širok – glava se ne spremeni; to in pravi pomik preverja
// tools/preveri-navigacija-brskalnik.js --korak 5. Položaji so tu nadomestni (getBoundingClientRect v testu).
for (const ime of Object.keys(APLIKACIJE)) {
  test(`${ime}: popravek A – pod vrstico oznak v »Tehnike« gumb v glavi »↑ Tehnike« vrne k vrstici oznak, sicer »↑ Na vrh«`, () => {
    const { dom, run, o } = nalozi(ime, { okno: true });
    const gor = o.glava.children[1];
    const kt = dom.el(APLIKACIJE[ime].tehnike).children[1];
    assert.equal(kt.className, 'kazalo-tehnik');
    // Oba napisa v gumbu (en nad drugim – širina gumba je širina daljšega).
    assert.deepEqual(gor.children.map(e => [e.tagName, e.className, e.textContent]),
      [['SPAN', 'napis-vrh', '↑ Na vrh'], ['SPAN', 'napis-tehnike', '↑ Tehnike']]);
    // Glava je lepljiva (spodnji rob 53 px), vrstica oznak je v vsebini od 2900 do 2970 px.
    o.glava.getBoundingClientRect = () => ({ top: 0, bottom: 53, height: 53 });
    kt.getBoundingClientRect = () => ({ top: 2900 - o.okno.scrollTop, bottom: 2970 - o.okno.scrollTop, height: 70 });
    const klici = [];
    kt.scrollIntoView = x => klici.push(['scrollIntoView', x]);
    kt.children[0].focus = x => klici.push(['focus', kt.children[0].textContent, x]);
    dom.klikni(APLIKACIJE[ime].gumbi[0]);
    for (const [y, napis] of [[0, null], [400, null], [401, 'vrh'], [2900, 'vrh'], [2916, 'vrh'], [2917, 'tehnike'], [6000, 'tehnike'], [1000, 'vrh']]) {
      o.okno.scrollTop = y;
      o.okno.sprozi('scroll');
      assert.equal(gor.hidden, napis === null, `pomik ${y} px: ${napis ? 'viden' : 'skrit'}`);
      if (napis) {
        assert.equal(gor.dataset.napis, napis, `pomik ${y} px: napis`);
        assert.equal(gor.getAttribute('aria-label'), napis === 'vrh' ? '↑ Na vrh' : '↑ Tehnike');
      }
    }
    // Klik »↑ Tehnike«: vrstica oznak pod glavo (scrollIntoView, block start), fokus na E1 brez drugega pomika.
    o.okno.scrollTop = 6000;
    o.okno.sprozi('scroll');
    o.klici.length = 0;
    gor.sprozi('click');
    assert.deepEqual(klici.map(k => k[0] === 'focus' ? k.slice(0, 2) : k[0]), ['scrollIntoView', ['focus', 'E1']]);
    assert.equal(klici[0][1].block, 'start');
    assert.equal(klici[1][2].preventScroll, true);
    assert.deepEqual(o.klici.filter(k => k[0] === 'scrollTo'), [], 'ne na vrh okna');
    // Klik »↑ Na vrh« kot prej.
    klici.length = 0;
    o.okno.scrollTop = 1000;
    o.okno.sprozi('scroll');
    gor.sprozi('click');
    assert.deepEqual(o.klici.filter(k => k[0] === 'scrollTo').map(k => k[1].top), [0]);
    assert.deepEqual(klici, []);
    // Pravilo brez DOM-a.
    assert.equal(run('gumbGlavePomoci(0, false)'), null);
    assert.equal(run('gumbGlavePomoci(401, false)'), 'vrh');
    assert.equal(run('gumbGlavePomoci(401, true)'), 'tehnike');
    assert.equal(run('gumbGlavePomoci(100, true)'), 'tehnike');
  });
}

test('D1: lepljiva glava (position: sticky) samo v oknu Pomoč (.dialog-navodila), ne v drugih oknih .dialog', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'shared', 'pomoc.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const pravila = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => /position\s*:\s*sticky/.test(m[2])).map(m => m[1].trim());
  assert.ok(pravila.length >= 1, 'lepljiva glava je v shared/pomoc.css');
  for (const izb of pravila) for (const del of izb.split(',')) assert.match(del.trim(), /^\.dialog-navodila /, `izbirnik ${del.trim()}`);
  for (const a of Object.values(APLIKACIJE)) {
    const html = fs.readFileSync(path.join(__dirname, '..', a.html), 'utf8');
    assert.equal((html.match(/dialog-navodila/g) || []).length, 1, `${a.html}: samo okno Pomoč ima .dialog-navodila`);
  }
});

test('vsebina razdelka »Tehnike« je v vseh treh aplikacijah enaka', () => {
  const besedilo = ime => { const { dom } = nalozi(ime); return dom.el(APLIKACIJE[ime].tehnike).textContent; };
  const igra = besedilo('igra');
  assert.equal(besedilo('resevalec'), igra);
  assert.equal(besedilo('trening'), igra);
});

test('reševalec: težavnost – stopnje, ki jih uganka lahko dobi (z Ekstremom, ker motor ima ekspertno tehniko)', () => {
  const { dom, run } = nalozi('resevalec');
  assert.deepEqual(dom.el('pomocStopnje').children.map(li => li.textContent),
    [...run(`STOPNJE_UGANK.map(s => s.ime.toLowerCase() + ' ' + s.opis)`)]);
  assert.equal(dom.el('pomocStopnje').children.length, 5);
  assert.deepEqual([...run('GEN_EKSPERTNE')], ['XY-Chain']);
});

test('trening: ob odprtem oknu Pomoč tipke ne gredo v ploščo vaje E1', () => {
  const { dom, run } = nalozi('trening');
  run(`zacniKrog('naked-single', 'spoznaj')`);
  run('exNum = 6; renderExercise()'); // vaja 7: brez vnaprej izbrane števke
  dom.klikni('pomocBtn');
  dom.tipka({ key: '5', code: 'Digit5', target: dom.document.body });
  assert.deepEqual([...run('pickedDigits')], [], 'števka ob odprtem oknu ni izbrana');
  run(`oknoPomoc.zapri()`);
  dom.tipka({ key: '5', code: 'Digit5', target: dom.document.body });
  assert.deepEqual([...run('pickedDigits')], [5], 'po zaprtju okna tipka deluje');
});
