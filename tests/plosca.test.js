'use strict';
// Plošča (shared/plosca.js) sama, brez igre, v nadomestnem DOM-u (dom-stub.js):
// izbira celic, nizi in poteze, tipkovnica, poudarki, zaklep, začetne poteze (vaja)
// in seznami. "Aplikacija" je najmanjša možna: ima igro in stanje, v obSpremembi
// izračuna novo stanje in izriše - kot igra/igra.js brez shranjevanja. Uganka je iz
// docs/uganke.md, začetne poteze iz korakov motorja (ne na pamet). Videza (CSS)
// test ne vidi.
// Zagon: node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContext, loadPuzzles } = require('./load-engine.js');
const { makeDom } = require('./dom-stub.js');

const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
const D = JSON.stringify(danosti);
const prazne = [...danosti].map((ch, i) => (ch === '0' ? i : -1)).filter(i => i >= 0);
const dana = danosti.split('').findIndex(ch => ch !== '0');
const STEVKE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ELEMENTI = ['mreza', 'nizPoudari', 'nizVpisi', 'nizOdstrani', 'razlogNizov', 'razveljavi', 'ponovi',
  'zbrisi', 'znova', 'stevec', 'vecCelic', 'vecHkrati', 'postavitev'];

// Kontekst s ploščo. `samoMreza`: plošča brez vseh neobveznih elementov.
// `kljucSeznamov`: ključ stikal v localStorage (brez: se ne shranjujejo).
function pripravi({ samoMreza = false, kljucSeznamov = null, shramba } = {}) {
  const dom = makeDom(shramba);
  const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js'], dom.globals);
  const elementi = samoMreza ? 'mreza: el("mreza"),'
    : ELEMENTI.map(id => `${id}: el(${JSON.stringify(id)}),`).join(' ')
      + ` seznami: { vrstice: el('sV'), stolpci: el('sS'), bloki: el('sB') },
          stikala: { vrstice: el('kV'), stolpci: el('kS'), bloki: el('kB') },
          kljucSeznamov: ${JSON.stringify(kljucSeznamov)},`;
  run(`
    var igra = null, stanje = null, spremembe = [], zaklep = false, vprasanje = true, razlogApp = null, opozoriloApp = '';
    function el(id) { return document.getElementById(id); }
    var plosca = ustvariPlosco({
      ${elementi}
      vir: () => ({ igra, stanje }),
      obSpremembi: (v) => {
        spremembe.push(v);
        const prej = stanje;
        stanje = stanjeIgre(igra);
        plosca.poSpremembi(prej);
        plosca.izrisi();
      },
      samoZaOgled: () => zaklep,
      razlog: () => razlogApp,
      opozorilo: () => opozoriloApp,
      potrdiZnova: () => vprasanje,
    });
    function odpri(g) { igra = g; stanje = stanjeIgre(g); plosca.ponastavi(); plosca.izrisi(); }
  `);
  const celica = i => dom.el('mreza').children[i];
  return {
    dom,
    run,
    celica,
    klik: (i, e = {}) => celica(i).sprozi('click', e),
    gumb: (niz, d) => dom.el(niz).children[d - 1],
    tipka: e => run(`plosca.obTipki({ preventDefault() {}, ...${JSON.stringify(e)} })`),
    kljukica: (id, v) => { dom.el(id).checked = v; dom.el(id).sprozi('change'); },
    izbrane: () => [...run('plosca.izbrane')],
    kand: i => run(`stanje.kandidati[${i}]`),
    grid: i => run(`stanje.grid[${i}]`),
    razlog: () => dom.el('razlogNizov').textContent,
  };
}

const resitev = (() => {
  const { run } = loadContext(['shared/engine.js']);
  return run(`solutionOf(${D})`);
})();

test('plošča: izbira ene in več celic, Ctrl+klik, kljukica "več celic"', () => {
  const p = pripravi();
  const [p0, p1, p2, p3] = prazne;
  p.klik(p0);
  assert.deepEqual(p.izbrane(), [], 'brez igre klik ne izbere');
  p.run(`odpri(novaIgra(${D}))`);
  p.klik(p0);
  assert.deepEqual(p.izbrane(), [p0]);
  assert.ok(p.celica(p0).className.includes('izbrana'));
  assert.equal(p.dom.el('mreza').children.filter(c => c.className.includes('soseda')).length, 20);
  p.klik(p0);
  assert.deepEqual(p.izbrane(), [], 'ponoven klik prekliče izbiro');
  p.klik(dana);
  assert.deepEqual(p.izbrane(), [dana], 'dana celica se izbere z navadnim klikom');
  assert.match(p.razlog(), /je dana števka/);
  p.klik(p0, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [p0], 'pri več celicah dana celica izpade iz izbire');
  p.klik(p1, { metaKey: true });
  assert.deepEqual(p.izbrane(), [p0, p1]);
  assert.equal(p.dom.el('mreza').children.filter(c => c.className.includes('soseda')).length, 0, 'pri več izbranih se sosede ne senčijo');
  p.klik(p0, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [p1], 'Ctrl+klik izbrane celice jo odstrani');
  p.klik(dana, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [p1], 'dana celica se ne doda');
  p.kljukica('vecCelic', true);
  p.klik(p2);
  assert.deepEqual(p.izbrane(), [p1, p2], 's kljukico navaden klik dodaja');
  p.kljukica('vecCelic', false);
  assert.deepEqual(p.izbrane(), [], 'izklop kljukice počisti izbiro');
  // Celica z vpisom se ne doda.
  p.klik(p3);
  p.gumb('nizVpisi', resitev[p3]).sprozi('click');
  p.klik(p0, { ctrlKey: true });
  p.klik(p3, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [p0]);
});

test('plošča: nizi, poteze, Zbriši vpis, Razveljavi/Ponovi, vrstica pod nizi in števec', () => {
  const p = pripravi();
  const [p0, p1, p2] = prazne;
  p.run(`odpri(novaIgra(${D}))`);
  assert.equal(p.razlog(), 'Izberi celico v mreži.');
  assert.equal(p.dom.el('stevec').textContent, 'poteza 0 / 0');
  assert.equal(p.dom.el('razveljavi').disabled, true);
  p.klik(p0);
  for (const d of STEVKE) {
    assert.equal(p.gumb('nizVpisi', d).disabled, !(p.kand(p0) & (1 << d)), `Vpiši ${d} po kandidatih`);
    assert.equal(p.gumb('nizOdstrani', d).classList.contains('odstrani'), !!(p.kand(p0) & (1 << d)));
  }
  assert.equal(p.razlog(), '');
  p.gumb('nizVpisi', resitev[p0]).sprozi('click');
  assert.deepEqual([...p.run('spremembe')], ['poteza']);
  assert.equal(p.grid(p0), resitev[p0]);
  assert.deepEqual(p.izbrane(), [], 'po vpisu se izbira izklopi');
  assert.equal(p.dom.el('stevec').textContent, 'poteza 1 / 1');
  assert.equal(p.celica(p0).className, 'celica vpis');

  // Odstrani in vrni kandidata v eni celici.
  p.klik(p1);
  const d1 = STEVKE.find(d => (p.kand(p1) & (1 << d)) && d !== resitev[p1]);
  p.gumb('nizOdstrani', d1).sprozi('click');
  assert.equal(p.kand(p1) & (1 << d1), 0);
  assert.ok(p.gumb('nizOdstrani', d1).classList.contains('vrni'));
  assert.equal(p.gumb('nizOdstrani', d1).title, `Vrni kandidata ${d1}`);
  p.gumb('nizOdstrani', d1).sprozi('click');
  assert.ok(p.kand(p1) & (1 << d1), 'kandidat je vrnjen');

  // Več celic: samo skupni kandidati, ena poteza "kandidati" z urejenimi celicami.
  p.klik(p2, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [p1, p2]);
  const skupni = p.run('skupniKandidati(stanje, plosca.izbrane)');
  assert.equal(p.razlog(), skupni ? 'Izbrane celice: 2 – odstrani števko, ki je kandidat v vseh.' : 'Izbrane celice nimajo skupnega kandidata.');
  assert.ok(STEVKE.every(d => p.gumb('nizVpisi', d).disabled), 'pri več celicah ni vpisa');
  const sd = STEVKE.find(d => (skupni & (1 << d)) && d !== resitev[p1] && d !== resitev[p2]);
  assert.ok(sd, 'celici imata skupnega kandidata, ki ni prava števka');
  p.gumb('nizOdstrani', sd).sprozi('click');
  const zadnja = p.run('igra.poteze[igra.kazalec - 1]');
  assert.equal(zadnja.tip, 'kandidati');
  assert.deepEqual([...zadnja.celice], [p1, p2].sort((a, b) => a - b));
  assert.deepEqual(p.izbrane(), [p1, p2], 'izbira ostane');

  // Zbriši vpis, Razveljavi, Ponovi.
  p.klik(p0);
  assert.match(p.razlog(), /je tvoj vpis/);
  assert.equal(p.dom.el('zbrisi').disabled, false);
  p.dom.el('zbrisi').sprozi('click');
  assert.equal(p.grid(p0), 0);
  const n = p.run('igra.kazalec');
  p.dom.el('razveljavi').sprozi('click');
  assert.equal(p.grid(p0), resitev[p0]);
  assert.equal(p.run('igra.kazalec'), n - 1);
  p.dom.el('ponovi').sprozi('click');
  assert.equal(p.grid(p0), 0);
  assert.deepEqual([...p.run('spremembe').slice(-2)], ['razveljavi', 'ponovi']);
  assert.equal(p.dom.el('stevec').textContent, `poteza ${n} / ${n}`);
});

test('plošča: tipkovnica (števke, Numpad, Shift, puščice, Backspace/Delete, Escape, Ctrl+Z/Y)', () => {
  const p = pripravi();
  const [p0, p1] = prazne;
  assert.equal(p.tipka({ key: 'ArrowUp', code: 'ArrowUp' }), false, 'brez igre tipka ni porabljena');
  p.run(`odpri(novaIgra(${D}))`);
  assert.equal(p.tipka({ key: 'ArrowUp', code: 'ArrowUp' }), true);
  assert.deepEqual(p.izbrane(), [0], 'prva puščica brez izbire izbere V1S1');
  p.tipka({ key: 'ArrowLeft', code: 'ArrowLeft' });
  p.tipka({ key: 'ArrowUp', code: 'ArrowUp' });
  assert.deepEqual(p.izbrane(), [0], 'na robu mreže ostane');
  p.tipka({ key: 'ArrowDown', code: 'ArrowDown' });
  p.tipka({ key: 'ArrowRight', code: 'ArrowRight' });
  assert.deepEqual(p.izbrane(), [10]);
  assert.equal(p.tipka({ key: 'Escape', code: 'Escape' }), true);
  assert.deepEqual(p.izbrane(), []);
  assert.equal(p.tipka({ key: 'Escape', code: 'Escape' }), false, 'Escape brez izbire ni porabljen');

  // Števka z vrstice števk in s številčnice; puščica nato nadaljuje od vpisane celice.
  p.klik(p0);
  assert.equal(p.tipka({ key: String(resitev[p0]), code: `Numpad${resitev[p0]}` }), true);
  assert.equal(p.grid(p0), resitev[p0]);
  assert.deepEqual(p.izbrane(), []);
  p.tipka({ key: 'ArrowRight', code: 'ArrowRight' });
  assert.deepEqual(p.izbrane(), [Math.floor(p0 / 9) * 9 + Math.min(8, p0 % 9 + 1)]);
  p.klik(p0 === 0 ? 1 : 0); // druga celica, da klik p0 ne prekliče izbire
  p.klik(p0);
  p.tipka({ key: 'Backspace', code: 'Backspace' });
  assert.equal(p.grid(p0), 0);
  p.tipka({ key: String(resitev[p0]), code: `Digit${resitev[p0]}` });
  assert.equal(p.grid(p0), resitev[p0]);
  p.klik(p0);
  p.tipka({ key: 'Delete', code: 'Delete' });
  assert.equal(p.grid(p0), 0);

  // Shift+števka po fizični tipki (slovenska razporeditev: key je znak, ne števka).
  p.klik(p1);
  const d = STEVKE.find(x => (p.kand(p1) & (1 << x)) && x !== resitev[p1]);
  p.tipka({ key: '"', code: `Digit${d}`, shiftKey: true });
  assert.equal(p.kand(p1) & (1 << d), 0);
  p.tipka({ key: '"', code: `Digit${d}`, shiftKey: true });
  assert.ok(p.kand(p1) & (1 << d), 'Shift+števka vrne kandidata');
  assert.equal(p.tipka({ key: String(d), code: `Digit${d}`, altKey: true }), false, 'Alt+števka ni poteza');
  assert.equal(p.tipka({ key: 'c', code: 'KeyC', ctrlKey: true }), false);

  const n = p.run('igra.kazalec');
  assert.equal(p.tipka({ key: 'z', code: 'KeyZ', ctrlKey: true }), true);
  assert.equal(p.run('igra.kazalec'), n - 1);
  p.tipka({ key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true });
  assert.equal(p.run('igra.kazalec'), n);
  p.tipka({ key: 'z', code: 'KeyZ', metaKey: true });
  p.tipka({ key: 'y', code: 'KeyY', ctrlKey: true });
  assert.equal(p.run('igra.kazalec'), n);

  // Pri več izbranih celicah puščice in vpis ne naredijo nič.
  p.klik(p0, { ctrlKey: true });
  const izbira = p.izbrane();
  assert.equal(izbira.length, 2);
  assert.equal(p.tipka({ key: 'ArrowDown', code: 'ArrowDown' }), true);
  assert.deepEqual(p.izbrane(), izbira);
  p.tipka({ key: String(resitev[p0]), code: `Digit${resitev[p0]}` });
  assert.equal(p.grid(p0), 0);
  assert.equal(p.run('igra.kazalec'), n);
});

test('plošča: poudarki (ena števka, več hkrati z barvami, deveti vpis izklopi poudarek)', () => {
  const p = pripravi();
  p.run(`odpri(novaIgra(${D}))`);
  const barve = () => STEVKE.map(d => p.run(`plosca.barvaPoudarka(${d})`));
  p.gumb('nizPoudari', 3).sprozi('click');
  assert.equal(p.gumb('nizPoudari', 3).className, 'aktiven b0');
  p.gumb('nizPoudari', 4).sprozi('click');
  assert.deepEqual(barve(), [-1, -1, -1, 0, -1, -1, -1, -1, -1], 'brez "več hkrati" nova zamenja prejšnjo');
  p.gumb('nizPoudari', 4).sprozi('click');
  assert.deepEqual(barve(), STEVKE.map(() => -1), 'ponoven klik prekliče');

  p.kljukica('vecHkrati', true);
  for (const d of [1, 2, 3, 4, 5]) p.gumb('nizPoudari', d).sprozi('click');
  assert.deepEqual(barve(), [0, 1, 2, 3, 0, -1, -1, -1, -1], 'po štirih barvah se barve ponovijo');
  p.gumb('nizPoudari', 2).sprozi('click');
  p.gumb('nizPoudari', 6).sprozi('click');
  assert.deepEqual(barve(), [0, -1, 2, 3, 0, 1, -1, -1, -1], 'nova dobi prvo prosto barvo');
  assert.equal(p.run('plosca.zadnjaPoudarjena()'), 6);
  p.kljukica('vecHkrati', false);
  assert.deepEqual(barve(), [-1, -1, -1, -1, -1, 0, -1, -1, -1], 'ob izklopu ostane zadnja');
  p.gumb('nizPoudari', 6).sprozi('click');

  // Števka z najmanj manjkajočimi: po devetem vpisu poudarek izgine, ročno vklopljen ostane.
  const manjka = p.run('seManjka(stanje)');
  const dd = STEVKE.filter(d => manjka[d] > 0).sort((a, b) => manjka[a] - manjka[b] || a - b)[0];
  p.gumb('nizPoudari', dd).sprozi('click');
  const mesta = prazne.filter(i => resitev[i] === dd);
  for (const i of mesta.slice(0, -1)) p.run(`plosca.izvedi({ tip: 'vpis', celica: ${i}, stevka: ${dd} })`);
  assert.equal(p.run(`plosca.barvaPoudarka(${dd})`), 0, 'pred zadnjim vpisom je poudarek še vklopljen');
  p.run(`plosca.izvedi({ tip: 'vpis', celica: ${mesta.at(-1)}, stevka: ${dd} })`);
  assert.equal(p.run(`plosca.barvaPoudarka(${dd})`), -1, 'deveti vpis izklopi poudarek');
  p.gumb('nizPoudari', dd).sprozi('click');
  const c = prazne.find(i => !p.grid(i) && STEVKE.some(x => (p.kand(i) & (1 << x)) && x !== resitev[i]));
  const x = STEVKE.find(y => (p.kand(c) & (1 << y)) && y !== resitev[c]);
  p.run(`plosca.izvedi({ tip: 'kandidat', celica: ${c}, stevka: ${x}, odstrani: true })`);
  assert.equal(p.run(`plosca.barvaPoudarka(${dd})`), 0, 'poudarek dokončane števke ostane');
  assert.ok(p.celica(mesta[0]).className.includes('poud-stevka'));
  p.run('plosca.ponastavi()');
  assert.deepEqual(barve(), STEVKE.map(() => -1), 'ponastavi() pobriše poudarke');
});

test('plošča: zaklep (samoZaOgled), razlog in opozorilo aplikacije, potrditev "Začni znova"', () => {
  const p = pripravi();
  const [p0, p1] = prazne;
  p.run(`odpri(novaIgra(${D}))`);
  p.klik(p0);
  p.gumb('nizVpisi', resitev[p0]).sprozi('click');
  p.run('zaklep = true; razlogApp = "Zaklenjeno."; plosca.izrisi()');
  assert.ok(p.dom.el('mreza').className.includes('zaklenjena'));
  assert.equal(p.razlog(), 'Zaklenjeno.');
  assert.ok(p.dom.el('razlogNizov').classList.contains('zaklenjeno'));
  assert.ok(p.dom.el('znova').classList.contains('primary'));
  assert.equal(p.dom.el('razveljavi').disabled, true);
  assert.equal(p.dom.el('ponovi').disabled, true);
  p.klik(p1);
  assert.ok(STEVKE.every(d => p.gumb('nizVpisi', d).disabled && p.gumb('nizOdstrani', d).disabled), 'nizi so onemogočeni');
  const n = p.run('igra.poteze.length');
  p.run(`plosca.izvedi({ tip: 'vpis', celica: ${p1}, stevka: ${resitev[p1]} })`);
  p.tipka({ key: 'z', code: 'KeyZ', ctrlKey: true });
  assert.equal(p.run('igra.poteze.length'), n, 'zaklenjena mreža ne sprejme poteze');
  assert.equal(p.run('igra.kazalec'), n, 'Ctrl+Z ne razveljavi');

  p.run('opozoriloApp = "Ni shranjeno."; plosca.izrisi()');
  assert.equal(p.razlog(), '⚠ Ni shranjeno.');
  assert.ok(p.dom.el('razlogNizov').classList.contains('opozorilo'));
  assert.ok(!p.dom.el('razlogNizov').classList.contains('zaklenjeno'), 'opozorilo ima prednost pred zaklepom');

  p.run('zaklep = false; razlogApp = null; opozoriloApp = ""; vprasanje = false; plosca.izrisi()');
  assert.equal(p.razlog(), '');
  assert.ok(!p.dom.el('znova').classList.contains('primary'));
  p.dom.el('znova').sprozi('click');
  assert.equal(p.run('igra.kazalec'), n, 'brez potrditve se ne začne znova');
  p.run('vprasanje = true');
  p.dom.el('znova').sprozi('click');
  assert.equal(p.run('igra.kazalec'), 0);
  assert.equal(p.run('igra.znova'), true);
  assert.equal(p.run('spremembe.at(-1)'), 'znova');
  assert.equal(p.dom.el('znova').disabled, true, 'na začetku ni česa začeti znova');
});

test('plošča: vaja z začetnimi potezami - Razveljavi in Začni znova ne gresta pod njih', () => {
  const p = pripravi();
  // Začetne poteze iz poti motorja: vpisi do prvega stanja z izbrisi, nato izbrisi.
  const poteze = p.run(`(() => {
    const b = new Board(${D});
    for (let i = 0; i < 200; i++) {
      applyStep(b, nextStep(b));
      const osnova = new Board(b.grid.join(''));
      const izbrisi = [];
      for (let c = 0; c < 81; c++) {
        if (b.grid[c]) continue;
        for (let d = 1; d <= 9; d++) if (osnova.cand[c] & ~b.cand[c] & (1 << d)) izbrisi.push({ tip: 'kandidat', celica: c, stevka: d, odstrani: true });
      }
      if (!izbrisi.length) continue;
      const vpisi = [];
      for (let c = 0; c < 81; c++) if (${D}[c] === '0' && b.grid[c]) vpisi.push({ tip: 'vpis', celica: c, stevka: b.grid[c] });
      return [...vpisi, ...izbrisi];
    }
  })()`);
  assert.ok(poteze && poteze.length, 'na poti je stanje z izbrisi');
  p.run(`odpri(igraZZacetkom(${D}, ${JSON.stringify(poteze)}))`);
  const N = poteze.length;
  assert.equal(p.run('igra.zacetnihPotez'), N);
  assert.equal(p.dom.el('stevec').textContent, `poteza ${N} / ${N}`);
  assert.equal(p.dom.el('razveljavi').disabled, true);
  assert.equal(p.dom.el('znova').disabled, true);
  p.tipka({ key: 'z', code: 'KeyZ', ctrlKey: true });
  assert.equal(p.run('igra.kazalec'), N, 'Ctrl+Z ne gre pod začetne poteze');

  // Kandidata, odstranjenega v začetnih potezah, niz "Odstrani" ne ponudi za vrnitev.
  const izbris = poteze.find(x => x.tip === 'kandidat');
  p.klik(izbris.celica);
  assert.equal(p.gumb('nizOdstrani', izbris.stevka).disabled, true);
  assert.ok(!p.gumb('nizOdstrani', izbris.stevka).classList.contains('vrni'));
  // Vpisa iz začetnih potez ni mogoče zbrisati.
  const vpis = poteze.find(x => x.tip === 'vpis');
  p.klik(vpis.celica);
  assert.equal(p.dom.el('zbrisi').disabled, true);
  p.tipka({ key: 'Delete', code: 'Delete' });
  assert.equal(p.grid(vpis.celica), vpis.stevka);

  // Igralčeva poteza se razveljavi, "Začni znova" vrne na stanje vaje.
  const c = prazne.find(i => !p.grid(i) && STEVKE.some(x => (p.kand(i) & (1 << x)) && x !== resitev[i]));
  const d = STEVKE.find(x => (p.kand(c) & (1 << x)) && x !== resitev[c]);
  p.klik(c);
  p.gumb('nizOdstrani', d).sprozi('click');
  assert.equal(p.run('igra.kazalec'), N + 1);
  assert.equal(p.dom.el('razveljavi').disabled, false);
  p.dom.el('razveljavi').sprozi('click');
  p.dom.el('razveljavi').sprozi('click');
  assert.equal(p.run('igra.kazalec'), N, 'Razveljavi se ustavi pri začetnih potezah');
  p.dom.el('ponovi').sprozi('click');
  p.dom.el('znova').sprozi('click');
  assert.equal(p.run('igra.kazalec'), N, 'Začni znova vrne na stanje vaje');
  assert.ok(p.kand(c) & (1 << d));
});

test('plošča: seznami s stikali pod ključem aplikacije, plošča samo z mrežo', () => {
  const shramba = new Map([['test.seznami', JSON.stringify({ vrstice: true })]]);
  const p = pripravi({ kljucSeznamov: 'test.seznami', shramba });
  assert.equal(p.dom.el('kV').checked, true, 'stikalo se prebere iz shrambe');
  assert.equal(p.dom.el('kS').checked, false);
  p.run(`odpri(novaIgra(${D}))`);
  assert.equal(p.dom.el('sV').hidden, false);
  assert.equal(p.dom.el('sS').hidden, true);
  assert.ok(p.dom.el('postavitev').className.includes('z-vrsticami'));
  assert.match(p.dom.el('sV').children[0].title, /^Vrstica 1: manjkajo /);
  p.kljukica('kS', true);
  assert.equal(p.dom.el('sS').hidden, false);
  assert.deepEqual(JSON.parse(shramba.get('test.seznami')), { vrstice: true, stolpci: true, bloki: false });
  p.kljukica('kV', false);
  assert.ok(!p.dom.el('postavitev').className.includes('z-vrsticami'));

  // Brez ključa se stikala ne shranjujejo.
  const brez = pripravi();
  brez.kljukica('kB', true);
  assert.equal(brez.dom.shramba.size, 0);

  // Plošča samo z mrežo: klik, tipkovnica in izris delujejo brez drugih elementov.
  const m = pripravi({ samoMreza: true });
  m.run(`odpri(novaIgra(${D}))`);
  const [p0] = prazne;
  m.klik(p0);
  assert.deepEqual(m.izbrane(), [p0]);
  m.tipka({ key: String(resitev[p0]), code: `Digit${resitev[p0]}` });
  assert.equal(m.grid(p0), resitev[p0]);
  assert.equal(m.celica(p0).className, 'celica vpis');
  assert.equal(m.run('plosca.gumbi.vpisi.length'), 0);
  m.tipka({ key: 'z', code: 'KeyZ', ctrlKey: true });
  assert.equal(m.grid(p0), 0);
});
