'use strict';
// Popravki po ročnem pregledu faze 6 v pravem brskalniku, pri 375 in 1280 px:
//   - igra: okno Pomoč s podnaslovi v »Kako igrati« in »Zbirka ugank« (slog), en seznam stopenj s
//     povedjo o generatorju, posledica tehnike v svojem odstavku; kartica »Uganka« z značko
//     težavnosti (barva kot oznaka koraka), tehnikami v svoji vrstici in stanjem samo enkrat;
//   - reševalec: legenda pod malo mrežo koraka ima natanko postavke, ki so na mreži (celice
//     vzorca, izbrisani kandidati, vpis), vzorčki imajo barve celic; en napotek za povečavo;
//   - trening, »Vadi v uganki«: »več celic« pri 1-12 privzeto vklopljen (tudi pri edinstvenem
//     pravokotniku), opis poteka ob gumbih »Označi izbrane«, namig miške, odstavek v Pomoči;
//   - ocena (odločitev 2026-10-04): uganka iz ročnega pregleda je v kartici »Težka · Tehnike: … 1, 2 in 10«,
//     primer P_2 z značko in tehnikami (novi primeri 2026-10-05), besedilo stopenj v Pomoči;
//   - reševalec (D3): kandidati male mreže pri 375 in 540 px in v povečanem prikazu v svoji celici;
//   - reševalec: povečan prikaz koraka in rešitve je ves v oknu pri 320, 375, 414 px, ležeče in pri 1280 px;
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
// Uganka iz ročnega pregleda faze 6 (generator v igri; ena rešitev preveri tests/generator.test.js).
const D_POROCILO = JSON.stringify(('51......8.....86..89.7.5...' + '.....7.4...39..17.....4..2.' + '.5..1....6..4.9...9...8....').replace(/\./g, '0'));

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
      && /^Tehnike: E1, /.test(k.vrstice[1]) && /^zadnje reševanje /.test(k.vrstice[2]), k.vrstice);
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
    === JSON.stringify(['Moje uganke in vgrajeni primeri', 'Igraj, Nadaljuj, Poglej', 'Uganka v seznamu', 'Nova uganka', 'Izvozi in Uvozi', 'Izbriši in Izbriši vse', 'Oceni zbirko']), p.razdelki['Zbirka ugank']);
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

  // Ocena »zelo težka« (odločitev 2026-10-04): uganka iz ročnega pregleda je Težka, oznaka iz poti
  // z eno napredno tehniko (W-krilo, 10), ne iz dnevnika reševalca (12).
  await b.izvedi(`dodajVZbirko(${D_POROCILO}, '', 'rocno'); zacniIgro(${D_POROCILO}); true`);
  const por = await b.izvedi(`[...document.getElementById('opisUganke').children].map(v => v.textContent)`);
  preveri('uganka iz ročnega pregleda: Težka, »Tehnike: … 1, 2 in 10«', /^Težka ročni vnos/.test(por[0])
    && /^Tehnike: (E1, )?(E2, )?1 Izločitev izven bloka, 2 Izločitev v bloku in 10 W-krilo$/.test(por[1]), por);
  // Vgrajeni primer P_2 (novi primeri 2026-10-05): značka, ime z glavno tehniko, tehnike z glavno krepko.
  const pr = await b.izvedi(`(() => { const p = PRIMERI[1]; zacniIgro(p.danosti.split('.').join('0'));
    const el = document.getElementById('opisUganke'); const z = el.querySelector('.znacka-tezavnosti');
    return { vrstice: [...el.children].map(v => v.textContent), krepko: [...el.querySelectorAll('b')].map(x => x.textContent),
      znacka: z && z.textContent, razred: z && z.className }; })()`);
  preveri('primer P_2: značka »Srednja«, ime z glavno tehniko, »Tehnike:« z glavno krepko', pr.znacka === 'Srednja' && /tag t-pair/.test(pr.razred)
    && pr.vrstice[0] === 'Srednja vgrajeni primer »P_2 · 1 Izločitev izven bloka« · danih števk: 26'
    && pr.vrstice[1] === 'Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par'
    && pr.krepko.join() === '1 Izločitev izven bloka', pr);
  // Besedilo stopenj v Pomoči.
  const st = await b.izvedi(`(() => { const o = document.getElementById('navodilaDialog');
    return { stopnje: [...o.querySelectorAll('#stopnjeOcena li')].map(li => li.textContent), besedilo: o.textContent }; })()`);
  preveri('Pomoč: težka »ena zadošča«, zelo težka »ena napredna tehnika ne zadošča«, poved o drugi poti',
    /^težka brez napredne tehnike .* ne gre, ena zadošča$/.test(st.stopnje[2]) && /^zelo težka ena napredna tehnika ne zadošča/.test(st.stopnje[3])
      && st.besedilo.includes('lahko izbere drugo pot in uporabi druge tehnike'), st.stopnje);
}

// D3 (ročni pregled faze 6): kandidati male mreže koraka in povečanega prikaza ne segajo čez
// svojo celico (prej je spodnja vrstica, 7–9, segla 5–7 px v celico spodaj).
async function malaMreza(b) {
  console.log('Mala mreža koraka: kandidati v celici');
  const meri = izbirnik => b.izvedi(`(() => { let cez = 0;
    for (const grid of document.querySelectorAll('${izbirnik}')) for (const cell of grid.querySelectorAll('.mcell')) {
      const cr = cell.getBoundingClientRect();
      for (const k of cell.querySelectorAll('.mcand:not(.mcand-empty)')) cez = Math.max(cez, k.getBoundingClientRect().bottom - cr.bottom, cr.top - k.getBoundingClientRect().top);
    } return cez; })()`);
  for (const sirina of [375, 540]) {
    await b.odpri('app/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
    await b.fokus('#nizDanosti');
    await b.vtipkaj(uganke[0].replace(/0/g, '.'));
    await b.klikni('#solveBtn');
    await b.cakaj("getComputedStyle(document.getElementById('results')).display !== 'none'", 10000);
    await b.izvedi("document.getElementById('openStepsBtn').click(); [...document.querySelectorAll('#steps .mini-toggle')].slice(0, 8).forEach(g => g.click()); true");
    const cez = await meri('#steps .mini-grid');
    const celica = await b.izvedi("document.querySelector('#steps .mini-grid .mcell').getBoundingClientRect().height");
    preveri(`${sirina} px: kandidati v celici (celica ${celica} px)`, cez <= 0.5, cez);
    if (sirina === 540) {
      await b.izvedi("document.querySelector('#steps .mini-toggle').scrollIntoView(); true");
      await b.posnetek(path.join(mapa, 'mala-mreza-540.png'), { vsaStran: false });
      await b.izvedi("document.querySelector('#steps .mini-grid').click(); true");
      await b.cakaj("document.querySelector('#lightboxInner .mini-grid') !== null", 3000);
      const cezP = await meri('#lightboxInner .mini-grid');
      const celicaP = await b.izvedi("document.querySelector('#lightboxInner .mini-grid .mcell').getBoundingClientRect().height");
      preveri(`povečan prikaz: kandidati v celici (celica ${celicaP} px)`, cezP <= 0.5, cezP);
      await b.posnetek(path.join(mapa, 'mala-mreza-povecava.png'), { vsaStran: false });
    }
  }
}

// Povečan prikaz (napaka 2026-10-05): mreža koraka in rešitve je vsa v oknu - brez vodoravnega in
// navpičnega drsnika, kandidati (tudi 7, 8, 9) celi v svoji celici. Prej je bila celica stalnih 52 px
// in na telefonu levi del mreže ni bil dosegljiv.
async function povecava(b) {
  console.log('Povečan prikaz: vsa mreža v oknu');
  for (const [sirina, visina] of [[320, 640], [375, 740], [414, 820], [740, 360], [1280, 900]]) {
    await b.odpri('app/index.html', { sirina, visina, mobilno: sirina < 800 });
    await b.fokus('#nizDanosti');
    await b.vtipkaj(uganke[0].replace(/0/g, '.'));
    await b.klikni('#solveBtn');
    await b.cakaj("getComputedStyle(document.getElementById('results')).display !== 'none'", 10000);
    await b.izvedi("document.getElementById('openStepsBtn').click(); document.querySelector('#steps .mini-toggle').click(); document.querySelector('#steps .mini-toggle').scrollIntoView(); true");
    for (const [kaj, mreza] of [['korak', '#steps .mini-grid'], ['rešitev', '#solvedGrid']]) {
      await b.izvedi(`document.querySelector('${mreza}').scrollIntoView({ block: 'center' }); true`);
      await b.klikni(mreza);
      await b.cakaj("document.getElementById('lightbox').style.display === 'block'", 3000);
      const r = await b.izvedi(`(() => {
        const s = document.getElementById('lightboxScroll');
        const g = document.querySelector('#lightboxInner .mini-grid') || document.getElementById('lightboxInner');
        const gr = g.getBoundingClientRect();
        let cez = 0;
        for (const cell of g.querySelectorAll('.mcell')) {
          const cr = cell.getBoundingClientRect();
          for (const k of cell.querySelectorAll('.mcand:not(.mcand-empty)')) {
            const kr = k.getBoundingClientRect();
            cez = Math.max(cez, kr.bottom - cr.bottom, cr.top - kr.top, kr.right - cr.right, cr.left - kr.left);
          }
        }
        return { levo: gr.left, desno: gr.right, zgoraj: gr.top, spodaj: gr.bottom, sirina: innerWidth, visina: innerHeight,
          celica: +g.querySelector('.mcell').getBoundingClientRect().width.toFixed(1),
          kandidatov: g.querySelectorAll('.mcand:not(.mcand-empty)').length,
          drsnik: s.scrollWidth > s.clientWidth || s.scrollHeight > s.clientHeight, cez };
      })()`);
      const najvec = kaj === 'korak' ? 52 : 48;
      preveri(`${sirina}×${visina}, ${kaj}: mreža v oknu, brez drsnika (celica ${r.celica} px)`,
        r.levo >= 0 && r.desno <= r.sirina && r.zgoraj >= 0 && r.spodaj <= r.visina && !r.drsnik
          && r.celica <= najvec && (sirina < 800 || r.celica === najvec), r);
      if (kaj === 'korak') preveri(`${sirina}×${visina}: kandidati (tudi 7, 8, 9) celi v celici`, r.kandidatov > 0 && r.cez <= 0.5, r);
      if (sirina === 320 && kaj === 'korak') await b.posnetek(path.join(mapa, 'povecava-320.png'), { vsaStran: false });
      await b.klikni('#lightboxClose');
    }
  }
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
    await malaMreza(b);
    await povecava(b);
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\nNe drži: ${napak}` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
