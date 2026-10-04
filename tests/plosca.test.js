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
// `pred`: koda pred nastankom plošče, `moznosti`: dodatne možnosti plošče (besedilo).
function pripravi({ samoMreza = false, kljucSeznamov = null, shramba, pred = '', moznosti = '' } = {}) {
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
    ${pred}
    var plosca = ustvariPlosco({
      ${elementi}
      ${moznosti}
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
  assert.equal(p.razlog(), skupni ? 'Izbrane celice: 2 – izbriši števko, ki je kandidat v vseh.' : 'Izbrane celice nimajo skupnega kandidata.');
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

  // QWERTZ (slovenska razporeditev): tipka z napisom Z je na mestu KeyY in obratno.
  // Velja napis (e.key), ne mesto (e.code).
  assert.equal(p.tipka({ key: 'z', code: 'KeyY', ctrlKey: true }), true);
  assert.equal(p.run('igra.kazalec'), n - 1, 'QWERTZ: Ctrl + tipka Z razveljavi');
  p.tipka({ key: 'y', code: 'KeyZ', ctrlKey: true });
  assert.equal(p.run('igra.kazalec'), n, 'QWERTZ: Ctrl + tipka Y ponovi (ne razveljavi)');
  p.tipka({ key: 'z', code: 'KeyY', ctrlKey: true });
  p.tipka({ key: 'Z', code: 'KeyY', ctrlKey: true, shiftKey: true });
  assert.equal(p.run('igra.kazalec'), n, 'QWERTZ: Ctrl+Shift + tipka Z ponovi');

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
  assert.equal(p.razlog(), `V ${p.run(`cellLabel(${vpis.celica})`)} je vpis iz prejšnjih korakov (${vpis.stevka}) – ne spreminja se.`);
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

test('plošča brez vpisa (vpis: false): števka in Backspace ne naredita nič, Shift+števka odstrani', () => {
  const p = pripravi({ moznosti: 'vpis: false,' });
  p.run(`odpri(novaIgra(${D}))`);
  const c = prazne[0];
  p.klik(c);
  for (const code of [`Digit${resitev[c]}`, `Numpad${resitev[c]}`]) {
    assert.equal(p.tipka({ key: String(resitev[c]), code }), false, `${code} ni porabljena`);
    assert.equal(p.grid(c), 0, `${code} ne vpiše`);
  }
  // Vpis z nizom (ki ga aplikacija pri vpis: false ne pokaže) je še vedno poteza - tu samo
  // za pripravo celice z vpisom.
  p.gumb('nizVpisi', resitev[c]).sprozi('click');
  assert.equal(p.grid(c), resitev[c]);
  p.klik(c);
  assert.equal(p.tipka({ key: 'Backspace', code: 'Backspace' }), false);
  assert.equal(p.tipka({ key: 'Delete', code: 'Delete' }), false);
  assert.equal(p.grid(c), resitev[c], 'Backspace/Delete ne zbrišeta');
  // Shift+števka odstrani kandidata - tudi par QWERTZ (key '!', code 'Digit1').
  const c2 = prazne.find(i => !p.grid(i) && (p.kand(i) & 2));
  p.klik(c2);
  assert.equal(p.tipka({ key: '!', code: 'Digit1', shiftKey: true }), true);
  assert.equal(p.kand(c2) & 2, 0);
  // Ctrl+Z (QWERTZ: tipka Z ima code KeyY) razveljavi.
  p.tipka({ key: 'z', code: 'KeyY', ctrlKey: true });
  assert.ok(p.kand(c2) & 2);
});

test('plošča s predlogom (predlog: true): vseh 9 števk v nizu Vpiši, obVpisu, Backspace', () => {
  const p = pripravi({ pred: 'var vpisi = [];', moznosti: 'kandidati: false, samoEna: true, predlog: true, obVpisu: (c, d) => vpisi.push([c, d]),' });
  p.run(`odpri(novaIgra(${D}))`);
  const c = prazne[0];
  // Brez izbire je niz onemogočen, z izbrano prazno celico so omogočene vse števke.
  assert.ok(STEVKE.every(d => p.gumb('nizVpisi', d).disabled));
  p.klik(c);
  assert.ok(STEVKE.every(d => !p.gumb('nizVpisi', d).disabled), 'vseh 9 števk');
  assert.equal(p.razlog(), '');
  const d = STEVKE.find(x => !(p.kand(c) & (1 << x)));
  p.gumb('nizVpisi', d).sprozi('click');
  p.tipka({ key: '7', code: 'Numpad7' });
  p.tipka({ key: 'Backspace', code: 'Backspace' });
  p.tipka({ key: 'Delete', code: 'Delete' });
  assert.deepEqual(JSON.parse(p.run('JSON.stringify(vpisi)')), [[c, d], [c, 7], [c, 0], [c, 0]]);
  assert.equal(p.run('igra.poteze.length'), 0, 'predlog ni poteza');
  // Dana celica: niz ostane onemogočen.
  p.klik(dana);
  assert.ok(STEVKE.every(x => p.gumb('nizVpisi', x).disabled));
});

test('plošča: zaznamki (gumb, tipka O s QWERTZ), niso poteze; števke območja v nizu Poudari', () => {
  const p = pripravi({ pred: 'var stObm = [4];', moznosti: 'zaznamuj: el("zazn"), pocistiZaznamke: el("zaznPoc"), stevkeObmocja: () => stObm,' });
  p.run(`odpri(novaIgra(${D}))`);
  const [a, b, c] = prazne;
  const zazn = () => [...p.run('plosca.zaznamovane')].sort((x, y) => x - y);
  const celiceZ = () => p.dom.el('mreza').children.map((e, i) => (e.classList.contains('zaznamovana') ? i : -1)).filter(i => i >= 0);
  // Brez izbire je gumb onemogočen, »Počisti« tudi (ni zaznamkov).
  assert.equal(p.dom.el('zazn').disabled, true);
  assert.equal(p.dom.el('zaznPoc').disabled, true);
  // Dve izbrani celici (Ctrl+klik) -> gumb: obe zaznamovani, izbira prazna, ni poteze.
  p.klik(a);
  p.klik(b, { ctrlKey: true });
  assert.equal(p.dom.el('zazn').disabled, false);
  p.dom.el('zazn').sprozi('click');
  assert.deepEqual(zazn(), [a, b].sort((x, y) => x - y));
  assert.deepEqual(celiceZ(), zazn());
  assert.deepEqual(p.izbrane(), []);
  assert.equal(p.run('igra.poteze.length'), 0, 'zaznamek ni poteza');
  // Ena zaznamovana in ena nova -> tipka O (QWERTZ: key 'o', code 'KeyO'): obe zaznamovani.
  p.klik(b);
  p.klik(c, { ctrlKey: true });
  assert.equal(p.tipka({ key: 'o', code: 'KeyO' }), true);
  assert.deepEqual(zazn(), [a, b, c].sort((x, y) => x - y));
  // Vse izbrane že zaznamovane -> odznačijo se.
  p.klik(a);
  p.klik(b, { ctrlKey: true });
  p.tipka({ key: 'O', code: 'KeyO', shiftKey: true });
  assert.deepEqual(zazn(), [c]);
  // Razveljavi/Začni znova zaznamkov ne spremenita.
  p.klik(a);
  const d = STEVKE.find(x => p.kand(a) & (1 << x));
  p.gumb('nizOdstrani', d).sprozi('click');
  p.dom.el('razveljavi').sprozi('click');
  p.dom.el('ponovi').sprozi('click');
  p.dom.el('znova').sprozi('click');
  assert.deepEqual(zazn(), [c]);
  // Počisti oznake; ponastavi() jih pobriše.
  p.dom.el('zaznPoc').sprozi('click');
  assert.deepEqual(zazn(), []);
  p.klik(c);
  p.tipka({ key: 'o', code: 'KeyO' });
  assert.deepEqual(zazn(), [c]);
  p.run('plosca.ponastavi(); plosca.izrisi()');
  assert.deepEqual(zazn(), []);
  // Zaklenjena mreža: zaznamovanje ne dela.
  p.klik(c);
  p.run('zaklep = true; plosca.izrisi()');
  p.tipka({ key: 'o', code: 'KeyO' });
  assert.deepEqual(zazn(), []);
  p.run('zaklep = false');
  // Števka območja: obroč na gumbu v nizu Poudari, tudi brez poudarka in s poudarkom.
  p.run('plosca.izrisi()');
  assert.ok(p.gumb('nizPoudari', 4).classList.contains('obm-stevka'));
  assert.ok(!p.gumb('nizPoudari', 5).classList.contains('obm-stevka'));
  p.gumb('nizPoudari', 4).sprozi('click');
  assert.ok(p.gumb('nizPoudari', 4).classList.contains('obm-stevka') && p.gumb('nizPoudari', 4).classList.contains('aktiven'));
  // Brez možnosti zaznamuj tipka O ni porabljena.
  const q = pripravi();
  q.run(`odpri(novaIgra(${D}))`);
  q.klik(a);
  assert.equal(q.tipka({ key: 'o', code: 'KeyO' }), false);
});

test('plošča: »več celic« se ob nastanku prebere iz kljukice (trening jo vklopi po tehniki)', () => {
  const p = pripravi({ pred: 'el("vecCelic").checked = true;' });
  p.run(`odpri(novaIgra(${D}))`);
  const [a, b] = prazne;
  p.klik(a);
  p.klik(b);
  assert.deepEqual(p.izbrane(), [a, b], 'navaden klik doda celico');
  // Brez vklopljene kljukice (igra) ostane kot prej: klik zamenja izbiro.
  const q = pripravi();
  q.run(`odpri(novaIgra(${D}))`);
  q.klik(a);
  q.klik(b);
  assert.deepEqual(q.izbrane(), [b]);
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

// Vaji enojčkov v treningu (»Spoznaj«): mreža z robovi brez kandidatov, izbira ene
// celice, ki jo omejuje postopnost (spremenljiva, začetna izbira), vpis kot izbira
// števke (obVpisu) in dodatna polja pogleda.
test('plošča za enojčke: brez kandidatov, samoEna, spremenljiva, začetna izbira, obVpisu, pogled, robovi', () => {
  // Dovoljene so prazne celice ene vrstice (kot označena enota); vrstica z vsaj tremi.
  const vrstica = [...Array(9).keys()].find(r => prazne.filter(i => Math.floor(i / 9) === r).length >= 3);
  const dovoljene = prazne.filter(i => Math.floor(i / 9) === vrstica);
  const neaktivne = prazne.filter(i => !dovoljene.includes(i));
  const pred = `var dovoljene = ${JSON.stringify(dovoljene)}, neakt = ${JSON.stringify(neaktivne)}, vpisi = [];`;
  const moznosti = `robovi: true, kandidati: false, samoEna: true,
    spremenljiva: i => dovoljene.includes(i),
    obVpisu: (c, d) => vpisi.push([c, d]),
    pogled: () => ({ sosede: null, oznacene: dovoljene, neaktivne: neakt }),`;
  const p = pripravi({ pred, moznosti });
  p.run(`odpri(novaIgra(${D}))`);
  const cel = i => p.run(`plosca.mreza.celice[${i}]`);
  const klik = (i, e = {}) => cel(i).sprozi('click', e);
  assert.ok(p.dom.el('mreza').className.includes('mreza-robovi'), 'robovi: okvir z oznakami');
  assert.equal(p.run('plosca.mreza.el.className'), 'mreza');

  // Brez kandidatov; oznacene in neaktivne iz pogleda, brez senčenja sosed.
  for (const i of prazne) {
    assert.equal(cel(i).children.length, 0, `brez kandidatov ${i}`);
    assert.equal(cel(i).className.includes('oznacena'), dovoljene.includes(i));
    assert.equal(cel(i).className.includes('neaktivna'), neaktivne.includes(i));
  }

  // Klik: samo dovoljene, neaktivna in polna celica ne; Ctrl+klik ne dodaja (samoEna).
  klik(neaktivne[0]);
  klik(dana);
  assert.deepEqual(p.izbrane(), []);
  klik(dovoljene[0]);
  klik(dovoljene[1], { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [dovoljene[1]]);
  assert.equal([...Array(81).keys()].filter(i => cel(i).className.includes('soseda')).length, 0);

  // Puščice preskočijo celice, ki jih ni mogoče izbrati; na koncu ostanejo.
  klik(dovoljene[0]);
  p.tipka({ key: 'ArrowRight', code: 'ArrowRight' });
  assert.deepEqual(p.izbrane(), [dovoljene[1]]);
  p.tipka({ key: 'ArrowDown', code: 'ArrowDown' });
  assert.deepEqual(p.izbrane(), [dovoljene[1]], 'pod njo ni dovoljene celice');
  for (let k = 0; k < 9; k++) p.tipka({ key: 'ArrowRight', code: 'ArrowRight' });
  const zadnja = dovoljene[dovoljene.length - 1];
  assert.deepEqual(p.izbrane(), [zadnja]);

  // Števka (vrstica števk, Numpad, niz Vpiši) pokliče obVpisu - poteze ni.
  const kazalec = p.run('igra.kazalec');
  assert.equal(p.tipka({ key: '4', code: 'Digit4' }), true);
  p.tipka({ key: '7', code: 'Numpad7' });
  p.gumb('nizVpisi', 2).sprozi('click');
  assert.deepEqual(JSON.parse(p.run('JSON.stringify(vpisi)')), [[zadnja, 4], [zadnja, 7], [zadnja, 2]]);
  assert.equal(p.run('igra.kazalec'), kazalec);
  assert.equal(p.grid(zadnja), 0);
  // Shift+števka (QWERTZ: key '"', code Digit2) in niz Odstrani ne odstranita nevidnega kandidata.
  const k0 = p.kand(zadnja);
  p.tipka({ key: '"', code: 'Digit2', shiftKey: true });
  for (let d = 1; d <= 9; d++) p.gumb('nizOdstrani', d).sprozi('click');
  assert.equal(p.kand(zadnja), k0);
  assert.equal(p.run('igra.kazalec'), kazalec);
  assert.equal(p.run('vpisi.length'), 3, 'Shift+števka ni vpis');
  // Escape počisti izbiro; števka brez izbrane celice sporoči celico null.
  assert.equal(p.tipka({ key: 'Escape', code: 'Escape' }), true);
  assert.deepEqual(p.izbrane(), []);
  p.tipka({ key: '5', code: 'Digit5' });
  assert.deepEqual(JSON.parse(p.run('JSON.stringify(vpisi[3])')), [null, 5]);

  // Vnaprej izbrana celica, ki je ni mogoče odizbrati (E1, vaje 1-3).
  const c = dovoljene[0];
  const g = pripravi({ moznosti: `samoEna: true, kandidati: false, zacetnaIzbira: [${c}], spremenljiva: () => false,` });
  g.run(`igra = novaIgra(${D}); stanje = stanjeIgre(igra); plosca.izrisi();`);
  assert.deepEqual(g.izbrane(), [c]);
  assert.ok(g.celica(c).className.includes('izbrana'));
  g.klik(c);
  assert.deepEqual(g.izbrane(), [c], 'ponoven klik je ne prekliče');
  assert.equal(g.tipka({ key: 'Escape', code: 'Escape' }), false, 'Escape je ne počisti (tipka ni porabljena)');
  g.tipka({ key: 'ArrowLeft', code: 'ArrowLeft' });
  assert.deepEqual(g.izbrane(), [c]);
  assert.equal(g.run('plosca.pocistiIzbiro()'), false);
  assert.deepEqual(g.izbrane(), [c]);
});

// Senčenje (kljukica "senči"): primerjava z neodvisnim izračunom iz niza danosti.
test('plošča: senčenje celic, kamor poudarjena števka ne more (samo ob eni števki)', () => {
  const vidi = (i, j) => Math.floor(i / 9) === Math.floor(j / 9) || i % 9 === j % 9
    || (Math.floor(i / 27) === Math.floor(j / 27) && Math.floor((i % 9) / 3) === Math.floor((j % 9) / 3));
  const pricakovano = d => [...Array(81).keys()].filter(i => {
    const v = +danosti[i];
    if (v === d) return false;
    return v !== 0 || [...Array(81).keys()].some(j => +danosti[j] === d && vidi(i, j));
  });
  const p = pripravi({ moznosti: `senci: el('kSenci'),` });
  const zasencene = () => [...Array(81).keys()].filter(i => p.celica(i).className.includes('zasencena'));
  p.run(`odpri(novaIgra(${D}))`);
  const d = +danosti[dana];
  p.gumb('nizPoudari', d).sprozi('click');
  assert.deepEqual(zasencene(), [], 'brez kljukice ni senčenja');
  assert.equal(p.run('plosca.sencenjeVidno()'), false);
  p.kljukica('kSenci', true);
  assert.deepEqual(zasencene(), pricakovano(d));
  assert.equal(p.run('plosca.sencenjeVidno()'), true);
  // Druga števka zamenja poudarek - senčenje sledi.
  const e = STEVKE.find(x => x !== d);
  p.gumb('nizPoudari', e).sprozi('click');
  assert.deepEqual(zasencene(), pricakovano(e));
  // Več hkrati z dvema števkama: ni senčenja; ob izklopu ostane zadnja.
  p.kljukica('vecHkrati', true);
  p.gumb('nizPoudari', d).sprozi('click');
  assert.deepEqual(zasencene(), []);
  assert.equal(p.run('plosca.sencenjeVidno()'), false);
  p.kljukica('vecHkrati', false);
  assert.deepEqual(zasencene(), pricakovano(d));
  // Brez poudarka ni senčenja; izklop kljukice ga odstrani.
  p.gumb('nizPoudari', d).sprozi('click');
  assert.deepEqual(zasencene(), []);
  p.gumb('nizPoudari', d).sprozi('click');
  p.kljukica('kSenci', false);
  assert.deepEqual(zasencene(), []);
  // Vpis: nova celica s števko d razširi senčenje.
  p.kljukica('kSenci', true);
  const c = prazne.find(i => (p.kand(i) & (1 << d)) && resitev[i] === d);
  p.klik(c);
  p.gumb('nizVpisi', d).sprozi('click');
  const zdaj = zasencene();
  assert.ok(!zdaj.includes(c));
  for (const j of prazne) if (j !== c && vidi(j, c)) assert.ok(zdaj.includes(j), `soseda ${j} vpisa`);
});

test('barve poudarka iz nastavitev igre: nov in star zapis, napačen zapis, brez shrambe', () => {
  const beri = zapis => {
    const shramba = new Map(zapis === undefined ? [] : [['sudoku.igra.poud', zapis]]);
    const dom = makeDom(shramba);
    const { run } = loadContext(['shared/engine.js', 'shared/stanje.js', 'shared/mreza.js', 'shared/plosca.js'], dom.globals);
    return { barve: [...run("barvePoudarkaIzNastavitev('sudoku.igra.poud')")], run };
  };
  assert.deepEqual(beri(JSON.stringify({ 1: '#ff8080', 3: 'abc', 4: 'ni barva' })).barve, ['#FF8080', null, '#AABBCC', null]);
  assert.deepEqual(beri('#12ab34').barve, ['#12AB34', null, null, null], 'star zapis je 1. barva');
  assert.deepEqual(beri('{napaka').barve, [null, null, null, null]);
  assert.deepEqual(beri('42').barve, [null, null, null, null]);
  assert.deepEqual(beri(undefined).barve, [null, null, null, null]);
  // Shramba, ki ne dela (zasebno okno): privzete barve.
  const b = beri(undefined);
  b.run("localStorage.getItem = () => { throw new Error('ni shrambe'); }");
  assert.deepEqual([...b.run("barvePoudarkaIzNastavitev('sudoku.igra.poud')")], [null, null, null, null]);
  // uporabiBarvePoudarka nastavi samo podane barve na <html>.
  b.run("uporabiBarvePoudarka(['#FF8080', null, '#AABBCC', null])");
  assert.equal(b.run("document.documentElement.style.getPropertyValue('--poud')"), '#FF8080');
  assert.equal(b.run("document.documentElement.style.getPropertyValue('--poud2')"), '');
  assert.equal(b.run("document.documentElement.style.getPropertyValue('--poud3')"), '#AABBCC');
});

// Stikalo »Kandidati v celicah« (igra, docs/kandidati-stikalo-nacrt.md): prikaz se vklopi
// in izklopi med igro, kandidati se računajo naprej. Pri izklopu je niz Odstrani skrit,
// izbire več celic ni, v nizu Vpiši je vseh 9 števk, vpis števke, ki ni kandidat, se
// zavrne z razlogom. Stanje stikala je v shrambi pod ključem aplikacije.
test('plošča: stikalo kandidatov - izklop in vklop, shramba, Vpiši vseh 9, zavrnjen vpis, brez več celic', () => {
  const MOZNOSTI = 'stikaloKandidatov: el("kK"), kljucKandidatov: "test.kandidati", skrijBrezKandidatov: [el("glavaOdstrani"), el("nizOdstrani")],';
  const shramba = new Map();
  const p = pripravi({ shramba, moznosti: MOZNOSTI });
  const kK = p.dom.el('kK');
  assert.equal(kK.checked, true, 'brez zapisa so kandidati vklopljeni');
  assert.equal(p.run('plosca.kandidatiVidni()'), true);
  p.run(`odpri(novaIgra(${D}))`);
  const oznaka = i => `V${Math.floor(i / 9) + 1}S${i % 9 + 1}`;
  const kandidatiVCelici = i => p.celica(i).children.filter(k => k.className === 'kandidati').length;
  // Celica c: v njeni vrstici je dana števka d (zavrnjen vpis); celica q: ročni izbris x.
  const c = prazne.find(i => [...danosti.slice(Math.floor(i / 9) * 9, Math.floor(i / 9) * 9 + 9)].some(ch => ch !== '0'));
  const r = Math.floor(c / 9);
  const kjeDana = [...Array(9).keys()].map(s => r * 9 + s).find(i => danosti[i] !== '0');
  const d = +danosti[kjeDana];
  const q = prazne.find(i => i !== c);
  const x = STEVKE.find(s => (p.kand(q) & (1 << s)) && s !== resitev[q]);
  assert.equal(kandidatiVCelici(c), 1, 'vklopljeno: kandidati v prazni celici');

  // Ročni izbris pred izklopom in izbira več celic.
  p.klik(q);
  p.gumb('nizOdstrani', x).sprozi('click');
  p.kljukica('vecCelic', true);
  p.klik(c);
  assert.deepEqual(p.izbrane(), [q, c]);
  const potez = p.run('igra.poteze.length');

  p.kljukica('kK', false);
  assert.equal(shramba.get('test.kandidati'), 'false');
  assert.equal(p.run('plosca.kandidatiVidni()'), false);
  assert.deepEqual(p.izbrane(), [], 'izbira več celic se počisti');
  assert.equal(p.dom.el('vecCelic').checked, false, 'kljukica »več celic« se izklopi');
  assert.equal(p.dom.el('glavaOdstrani').hidden, true);
  assert.equal(p.dom.el('nizOdstrani').hidden, true);
  assert.equal(prazne.filter(i => kandidatiVCelici(i)).length, 0, 'izklopljeno: nobena celica nima kandidatov');
  assert.equal(p.kand(q) & (1 << x), 0, 'ročni izbris ostane, kandidati se računajo naprej');
  assert.equal(p.run('igra.poteze.length'), potez, 'preklop ni poteza');

  // Brez več celic: Ctrl+klik ne doda celice.
  p.klik(q);
  p.klik(c, { ctrlKey: true });
  assert.deepEqual(p.izbrane(), [c]);
  // Vpiši: vseh 9 števk za prazno celico; Shift+števka (par QWERTZ) ne naredi nič.
  assert.deepEqual(STEVKE.filter(s => !p.gumb('nizVpisi', s).disabled), STEVKE);
  const kc = p.kand(c);
  const s0 = STEVKE.find(s => kc & (1 << s));
  p.tipka({ key: '!', code: `Digit${s0}`, shiftKey: true });
  assert.equal(p.kand(c), kc);
  assert.equal(p.run('igra.poteze.length'), potez);
  // Števka, ki je v vrstici že vpisana: ni poteze, vrstica pod nizi pove zakaj.
  p.gumb('nizVpisi', d).sprozi('click');
  assert.equal(p.grid(c), 0);
  assert.equal(p.run('igra.poteze.length'), potez);
  assert.equal(p.razlog(), `Števka ${d} je v vrstici ${r + 1} že vpisana (${oznaka(kjeDana)}).`);
  // Sporočilo izgine ob naslednji izbiri.
  p.klik(q);
  assert.equal(p.razlog(), '');
  // Ročno odstranjen kandidat (tipka na številčnici): ni poteze, razlog.
  p.tipka({ key: String(x), code: `Numpad${x}` });
  assert.equal(p.grid(q), 0);
  assert.equal(p.razlog(), `Kandidat ${x} je v ${oznaka(q)} izbrisan – vrneš ga pri vklopljenih kandidatih (↺) ali z »Razveljavi«.`);
  // Kandidat se vpiše (poteza), sporočilo izgine.
  p.klik(c);
  p.tipka({ key: String(resitev[c]), code: `Digit${resitev[c]}` });
  assert.equal(p.grid(c), resitev[c]);
  assert.equal(p.run('igra.poteze.length'), potez + 1);
  assert.equal(p.razlog(), 'Izberi celico v mreži.');
  // Zaklenjena mreža: v nizu Vpiši ni nič omogočeno.
  p.run('zaklep = true; plosca.izrisi()');
  p.klik(q);
  assert.deepEqual(STEVKE.filter(s => !p.gumb('nizVpisi', s).disabled), []);
  p.run('zaklep = false; plosca.izrisi()');

  // Vklop: kandidati spet vidni, ročni izbris ostane (v nizu Odstrani ga je mogoče vrniti).
  p.kljukica('kK', true);
  assert.equal(shramba.get('test.kandidati'), 'true');
  assert.equal(p.dom.el('glavaOdstrani').hidden, false);
  assert.equal(p.dom.el('nizOdstrani').hidden, false);
  assert.equal(kandidatiVCelici(q), 1);
  assert.deepEqual(p.izbrane(), [q]);
  assert.ok(p.gumb('nizOdstrani', x).className.includes('vrni'));
  assert.equal(p.gumb('nizVpisi', x).disabled, true, 'pri vklopu le smiselne števke, kot prej');
  p.klik(c, { ctrlKey: true });
  assert.equal(p.izbrane().length, 1, 'celica z vpisom se ne doda');
  p.klik(prazne.find(i => i !== q && !p.grid(i)), { ctrlKey: true });
  assert.equal(p.izbrane().length, 2, 'pri vklopu Ctrl+klik spet doda');

  // Gumb aplikacije (nastaviKandidate) in nova stran z isto shrambo.
  p.run('plosca.nastaviKandidate(false)');
  assert.equal(kK.checked, false);
  assert.equal(shramba.get('test.kandidati'), 'false');
  assert.deepEqual(p.izbrane(), []);
  const p2 = pripravi({ shramba, moznosti: MOZNOSTI, pred: 'el("vecCelic").checked = true;' });
  assert.equal(p2.dom.el('kK').checked, false, 'stanje se prebere iz shrambe');
  assert.equal(p2.dom.el('vecCelic').checked, false);
  p2.run(`odpri(novaIgra(${D}))`);
  assert.equal(p2.dom.el('nizOdstrani').hidden, true);
  p2.run('plosca.nastaviKandidate(true)');
  assert.equal(p2.dom.el('kK').checked, true);
  assert.equal(p2.dom.el('nizOdstrani').hidden, false);

  // Neveljaven zapis: vklopljeno. Shramba, ki ne dela: vklopljeno, preklop deluje do osvežitve.
  assert.equal(pripravi({ shramba: new Map([['test.kandidati', '{napaka']]), moznosti: MOZNOSTI }).dom.el('kK').checked, true);
  assert.equal(pripravi({ shramba: new Map([['test.kandidati', '0']]), moznosti: MOZNOSTI }).dom.el('kK').checked, true);
  const p4 = pripravi({ moznosti: MOZNOSTI, pred: "localStorage.getItem = () => { throw new Error('ni shrambe'); }; localStorage.setItem = localStorage.getItem;" });
  assert.equal(p4.dom.el('kK').checked, true);
  p4.kljukica('kK', false);
  assert.equal(p4.run('plosca.kandidatiVidni()'), false);

  // Brez stikala (trening): stalno vklopljeno ali stalno izklopljeno (kandidati: false).
  assert.equal(pripravi().run('plosca.kandidatiVidni()'), true);
  assert.equal(pripravi({ moznosti: 'kandidati: false,' }).run('plosca.kandidatiVidni()'), false);
});
