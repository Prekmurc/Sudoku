'use strict';
// Popravki po ročnem pregledu faze 6 v pravem brskalniku, pri 375 in 1280 px:
//   - igra: okno Pomoč s podnaslovi v »Kako igrati« in »Zbirka ugank« (slog), en seznam stopenj s
//     povedjo o generatorju, posledica tehnike v svojem odstavku; kartica »Uganka« z značko
//     težavnosti (barva kot oznaka koraka), tehnikami v svoji vrstici in stanjem samo enkrat;
//   - reševalec: legenda pod malo mrežo koraka ima natanko postavke, ki so na mreži (celice
//     vzorca, izbrisani kandidati, vpis), vzorčki imajo barve celic; en napotek za povečavo;
//   - trening, »Vadi v uganki«: »več celic« pri 1-12 privzeto vklopljen (tudi pri edinstvenem
//     pravokotniku), opis poteka ob gumbih »Označi izbrane«, namig miške, odstavek v Pomoči;
//   - nič ne sega čez kartico ali okno, brez vodoravnega preliva, brez napak JS.
//
//   node tools/preveri-pregled6-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-pregled6');
const uganke = loadPuzzles().map(u => u.danosti.replace(/\./g, '0'));
const D = JSON.stringify(uganke[0]);

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const preliv = b => b.izvedi('document.documentElement.scrollWidth > document.documentElement.clientWidth');

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const mobilno = sirina < 500;
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();
  await b.izvedi(`dodajVZbirko(${D}, 'Težka', 'generator'); zacniIgro(${D}); true`);
  // ena poteza, da ima kartica vrstico reševanja
  await b.izvedi("(() => { const c = igra.danosti.indexOf('0'); izvedi({ tip: 'vpis', celica: c, stevka: resitev()[c] }); })()");

  const k = await b.izvedi(`(() => {
    const el = document.getElementById('opisUganke');
    const z = el.querySelector('.znacka-tezavnosti');
    const kartica = el.closest('.card').getBoundingClientRect();
    const vzorec = document.createElement('span'); vzorec.className = 'tag t-advanced'; document.body.appendChild(vzorec);
    const pricakovana = getComputedStyle(vzorec).backgroundColor; vzorec.remove();
    return { vrstice: [...el.children].map(v => v.textContent), znacka: z && z.textContent, ozadje: z && getComputedStyle(z).backgroundColor,
      pricakovana, vKartici: [...el.querySelectorAll('*')].every(e => { const r = e.getBoundingClientRect(); return r.left >= kartica.left - 0.5 && r.right <= kartica.right + 0.5; }),
      status: document.getElementById('status').textContent };
  })()`);
  preveri('kartica »Uganka«: značka »Težka« v barvi oznake napredne tehnike', k.znacka === 'Težka' && k.ozadje === k.pricakovana, k);
  preveri('kartica: 1. vrstica izvor, dodana, dane števke; 2. vrstica tehnike; 3. vrstica čas reševanja',
    k.vrstice.length === 3 && /^Težka ustvaril generator · dodana .* · danih števk: \d+$/.test(k.vrstice[0])
      && /^tehnike: /.test(k.vrstice[1]) && /^zadnje reševanje /.test(k.vrstice[2]), k.vrstice);
  preveri('stanje (»V teku (1/N).«) samo pod kartico', /^V teku \(1\/\d+\)\.$/.test(k.status) && !k.vrstice.join(' ').includes('v teku'), k);
  preveri('kartica: vse v kartici', k.vKartici);

  // Okno Pomoč s pravim klikom.
  await b.klikni('#navodilaBtn');
  const p = await b.izvedi(`(() => {
    const okno = document.getElementById('navodilaDialog');
    const panel = okno.querySelector('.dialog-panel').getBoundingClientRect();
    const razdelki = {};
    let tren = null;
    for (const el of okno.querySelectorAll('h3, h4')) {
      if (el.tagName === 'H3') { tren = el.textContent; razdelki[tren] = []; } else razdelki[tren].push(el.textContent);
    }
    const h4 = okno.querySelector('h4.navodila-podnaslov');
    const cs = getComputedStyle(h4);
    const tehnike = [...okno.querySelectorAll('#tehnikeSeznam li')];
    return { razdelki, utez: cs.fontWeight, velikost: cs.fontSize,
      stopnjeSeznamov: okno.querySelectorAll('ul.navodila-stopnje').length,
      stopnjeVnos: okno.querySelectorAll('#stopnjeOcena li').length,
      strozje: document.getElementById('stopnjeStrozje').textContent,
      tehnike: tehnike.length, odstavkov: tehnike.map(li => li.querySelectorAll('p').length),
      vOknu: [...okno.querySelectorAll('.dialog-panel *')].every(e => { const r = e.getBoundingClientRect(); return r.width === 0 || (r.left >= panel.left - 0.5 && r.right <= panel.right + 0.5); }),
      drsnik: okno.scrollWidth > okno.clientWidth,
      besedilo: okno.textContent };
  })()`);
  preveri('»Kako igrati«: podnaslovi po zaslonu', JSON.stringify(p.razdelki['Kako igrati'])
    === JSON.stringify(['Vpis in izbris', 'Kandidati v celicah', 'Več celic', 'Poudari števko', 'Razveljavi in ponovi', 'Tipkovnica']), p.razdelki['Kako igrati']);
  preveri('»Zbirka ugank«: podnaslovi', JSON.stringify(p.razdelki['Zbirka ugank'])
    === JSON.stringify(['Tvoja zbirka in vgrajeni primeri', 'Igraj, Nadaljuj, Poglej', 'Uganka v seznamu', 'Nova uganka', 'Izvozi in Uvozi', 'Izbriši in Izbriši vse', 'Oceni zbirko']), p.razdelki['Zbirka ugank']);
  preveri('podnaslov: krepko, 13,5 px', p.utez === '600' && p.velikost === '13.5px', [p.utez, p.velikost]);
  // seznam stopenj ugank (ul; tri stopnje »Naslednji korak« so ol)
  preveri('en seznam stopenj (4) in ena poved o generatorju', p.stopnjeSeznamov === 1 && p.stopnjeVnos === 4 && /^Generator je strožji od ocene/.test(p.strozje), [p.stopnjeSeznamov, p.stopnjeVnos, p.strozje]);
  preveri('Tehnike: 14, razlaga in posledica v dveh odstavkih', p.tehnike === 14 && p.odstavkov.every(n => n === 2), p.odstavkov);
  preveri('brez razvijalskih podrobnosti in »stikal«, »danosti«', !/lokaln\w* strežnik|neposredno iz datotek|ločen\w* nit|stikal|danost/i.test(p.besedilo));
  preveri('okno: vse v panelu, brez vodoravnega drsnika', p.vOknu && !p.drsnik, p);
  await b.posnetek(path.join(mapa, `igra-${sirina}-pomoc.png`), { vsaStran: false });
  await b.tipka('Escape');
  preveri('igra: brez vodoravnega preliva', !(await preliv(b)));
  await b.posnetek(path.join(mapa, `igra-${sirina}.png`));
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  // Uganka z različnimi tehnikami: vse uganke iz docs/uganke.md po vrsti, dokler ni vseh treh vrst postavk.
  const videne = new Set();
  let preverjenih = 0, napacnih = [], barve = [];
  for (const d of uganke.slice(0, 4)) {
    await b.fokus('#nizDanosti');
    await b.vtipkaj(d.replace(/0/g, '.'));
    await b.klikni('#solveBtn');
    await b.cakaj("getComputedStyle(document.getElementById('results')).display !== 'none'", 10000);
    await b.izvedi("document.getElementById('openStepsBtn').click()");
    const r = await b.izvedi(`(() => {
      const out = [];
      for (const g of document.querySelectorAll('#steps .mini-toggle')) {
        g.click();
        const mc = g.closest('li').querySelector('.mini-container');
        const grid = mc.querySelector('.mini-grid');
        const prisotne = [];
        if (grid.querySelector('.mcell.hl-source')) prisotne.push('celice vzorca');
        if (grid.querySelector('.mcand-elim')) prisotne.push('izbrisani kandidati');
        if (grid.querySelector('.mcell.willset')) prisotne.push('vpis');
        const legenda = [...mc.querySelectorAll('.mini-legend > span')].map(s => s.lastChild.textContent);
        const sw = (izb) => { const e = mc.querySelector(izb); return e && getComputedStyle(e); };
        const cel = (izb) => { const e = grid.querySelector(izb); return e && getComputedStyle(e); };
        const barva = [];
        if (sw('.sw-vzorec') && cel('.mcell.hl-source')) barva.push(sw('.sw-vzorec').backgroundColor === cel('.mcell.hl-source').backgroundColor);
        if (sw('.sw-izbris') && cel('.mcand-elim')) barva.push(sw('.sw-izbris').color === cel('.mcand-elim').color && sw('.sw-izbris').textDecorationLine === 'line-through');
        if (sw('.sw-vpis') && cel('.mcell.willset')) barva.push(sw('.sw-vpis').backgroundColor === cel('.mcell.willset').backgroundColor && sw('.sw-vpis').color === cel('.mcell.willset').color);
        const k = mc.getBoundingClientRect();
        const leg = mc.querySelector('.mini-legend').getBoundingClientRect();
        out.push({ prisotne, legenda, barva, napotek: mc.querySelector('.mini-povecava').textContent,
          vVsebniku: leg.left >= k.left - 0.5 && leg.right <= k.right + 0.5 });
        g.click();
      }
      return { koraki: out, napotek: document.querySelector('#results .cand-hint').textContent };
    })()`);
    preveri(`uganka ${preverjenih + 1}: napotek pod rešeno mrežo`, r.napotek === 'Tapni mrežo za povečavo.', r.napotek);
    for (const k of r.koraki) {
      k.prisotne.forEach(x => videne.add(x));
      if (JSON.stringify(k.prisotne) !== JSON.stringify(k.legenda) || k.napotek !== 'Tapni mrežo za povečavo.' || !k.vVsebniku) napacnih.push(k);
      barve.push(...k.barva);
    }
    preverjenih++;
    if (videne.size === 3) break;
  }
  preveri('legenda male mreže = postavke na mreži (vsi koraki), napotek, v vsebniku', napacnih.length === 0, napacnih.slice(0, 3));
  preveri('preverjene vse tri vrste postavk', videne.size === 3, [...videne]);
  preveri('vzorčki legende v barvah celic', barve.length > 0 && barve.every(Boolean), barve.filter(x => !x).length);
  await b.izvedi("document.querySelector('#steps .mini-toggle').click(); document.querySelector('#steps .mini-toggle').scrollIntoView(); true");
  await b.posnetek(path.join(mapa, `resevalec-${sirina}-korak.png`), { vsaStran: false });
  preveri('reševalec: brez vodoravnega preliva', !(await preliv(b)));
}

async function trening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  const mobilno = sirina < 500;
  for (const mode of ['unique-rectangle', 'pointing']) {
    await b.odpri('trening/index.html', { sirina, visina: 1000, mobilno });
    // banka vaj (ura preseže mejo iskanja) - hitro in ponovljivo
    await b.izvedi('localStorage.clear(); vadiZdaj = (() => { let t = 0; return () => (t += 5000); })(); true');
    await b.klikni(`.menu-card[data-mode="${mode}"] .nacin-btn.vadi`);
    await b.cakaj('vadi !== null', 15000);
    const s = await b.izvedi(`(() => {
      const kartica = document.querySelector('.exercise').getBoundingClientRect();
      const potek = document.querySelector('.vaja-uganka .zaznamki-potek');
      const r = potek.getBoundingClientRect();
      const gumb = [...document.querySelectorAll('.vaja-uganka .zaznamki button')][0];
      return { vec: document.querySelector('.vaja-uganka .glava-s-kljukico input').checked,
        potek: potek.textContent, vidno: r.width > 0 && r.height > 0,
        vKartici: r.left >= kartica.left - 0.5 && r.right <= kartica.right + 0.5,
        podGumbi: r.top >= gumb.getBoundingClientRect().bottom - 0.5, title: gumb.title };
    })()`);
    preveri(`${mode}: »več celic« privzeto vklopljen`, s.vec === true);
    preveri(`${mode}: opis poteka ob gumbih, v kartici, pod gumbi`, s.vidno && s.vKartici && s.podGumbi
      && s.potek === 'Pripomoček, ni obvezen: izberi celice vzorca in jih označi, nato izberi celice izbrisa, izbriši števko in pritisni »Preveri«. Oznak »Preveri« ne gleda.', s);
    preveri(`${mode}: namig miške na »Označi izbrane«`, /vijoličnim okvirjem.*Oznake niso obvezne/.test(s.title), s.title);
    if (mode === 'unique-rectangle') await b.posnetek(path.join(mapa, `trening-${sirina}-vadi.png`));
  }
  preveri('trening: brez vodoravnega preliva', !(await preliv(b)));
  await b.klikni('#pomocBtn');
  const p = await b.izvedi(`(() => { const o = document.getElementById('pomocDialog');
    const h = [...o.querySelectorAll('h3')].find(x => x.textContent === 'Označi izbrane');
    return { ima: !!h, besedilo: h ? h.nextElementSibling.textContent + ' ' + h.nextElementSibling.nextElementSibling.textContent : '' }; })()`);
  preveri('Pomoč treninga: razdelek »Označi izbrane« (potek, oznake niso obvezne)', p.ima && /Izberi celice vzorca/.test(p.besedilo) && /niso obvezne/.test(p.besedilo), p);
  await b.tipka('Escape');
}

async function main() {
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      await igra(b, sirina);
      await resevalec(b, sirina);
      await trening(b, sirina);
    }
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\nNe drži: ${napak}` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
