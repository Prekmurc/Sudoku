'use strict';
// Okno Pomoč (shared/pomoc.js, faza 6, korak c) v igri, reševalcu in treningu - v nadomestnem
// DOM-u: gumb odpre okno, klik ob oknu in Escape ga zapreta, razdelek »Tehnike« ima v vseh treh
// aplikacijah isto vsebino (poved o ravneh, E1, E2, 1-12 z oznako, imenom, značko ravni ter razlago
// in posledico), reševalec našteje stopnje, ki jih uganka lahko dobi (brez Ekstrema), v treningu ob
// odprtem oknu tipke ne gredo v ploščo. Videz okna (pokrije zaslon, brez vodoravnega drsnika, ✕)
// preverja tools/preveri-pomoc-brskalnik.js.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const APLIKACIJE = {
  igra: {
    datoteke: ['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js', 'shared/zbirka.js', 'shared/zbirka-ui.js',
      'shared/generator.js', 'shared/pomoc.js', 'igra/shramba.js', 'igra/igra.js'],
    okno: 'navodilaDialog', gumbi: ['navodilaBtn', 'navodilaKarticaBtn'], tehnike: 'tehnikeSeznam',
  },
  resevalec: {
    datoteke: ['shared/engine.js', 'shared/stanje.js', 'shared/zbirka.js', 'shared/zbirka-ui.js', 'shared/generator.js', 'shared/pomoc.js',
      'app/app.js', 'app/zbirka.js'],
    okno: 'pomocDialog', gumbi: ['pomocBtn'], tehnike: 'pomocTehnike',
  },
  trening: {
    datoteke: ['shared/engine.js', 'shared/generator.js', 'shared/stanje.js', 'shared/vaje-uganka.js', 'shared/vaje-banka.js',
      'shared/mreza.js', 'shared/plosca.js', 'shared/pomoc.js', 'trening/generators.js', 'trening/v-uganki.js', 'trening/trening.js'],
    okno: 'pomocDialog', gumbi: ['pomocBtn'], tehnike: 'pomocTehnike',
  },
};
function nalozi(ime) {
  const dom = makeDom();
  const { run } = loadContext(APLIKACIJE[ime].datoteke, dom.globals);
  return { dom, run };
}
const RAVNI = { 'E1': 'lahka', 'E2': 'lahka' };
for (let i = 1; i <= 12; i++) RAVNI[String(i)] = i <= 6 ? 'srednja' : 'napredna';

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

  test(`${ime}: razdelek »Tehnike« – poved o ravneh, E1, E2, 1-12, značka ravni, razlaga in posledica v svojih odstavkih`, () => {
    const { dom, run } = nalozi(ime);
    const [uvod, ul] = dom.el(APLIKACIJE[ime].tehnike).children;
    assert.match(uvod.textContent, /^Tehnike so v treh ravneh: lahke \(E1, E2\), srednje \(1–6\) in napredne \(7–12\)/);
    const vaje = [...run('[...TRENING_ENOJCKA, ...TRENING_TEHNIKE]')];
    assert.equal(ul.children.length, 14);
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
      assert.equal(li.children.length, 6);
    });
  });
}

test('vsebina razdelka »Tehnike« je v vseh treh aplikacijah enaka', () => {
  const besedilo = ime => { const { dom } = nalozi(ime); return dom.el(APLIKACIJE[ime].tehnike).textContent; };
  const igra = besedilo('igra');
  assert.equal(besedilo('resevalec'), igra);
  assert.equal(besedilo('trening'), igra);
});

test('reševalec: težavnost – stopnje, ki jih uganka lahko dobi (brez Ekstrema, dokler motor nima ekspertne tehnike)', () => {
  const { dom, run } = nalozi('resevalec');
  assert.deepEqual(dom.el('pomocStopnje').children.map(li => li.textContent),
    [...run(`STOPNJE_UGANK.filter(s => s.kljuc !== 'ekstrem').map(s => s.ime.toLowerCase() + ' ' + s.opis)`)]);
  assert.equal(run('GEN_EKSPERTNE.length'), 0);
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
