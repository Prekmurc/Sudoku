'use strict';
// Novi vgrajeni primeri (zadnji del faze 6) v pravem brskalniku pri 375 in 1280 px:
//   - reševalec: seznam »Primeri po težavnosti« (napis, skupine z naslovi, prazna vrstica med
//     skupinami, vrstice »P_8 · 7 X-krilo«), po izbiri pod seznamom značka v barvi ravni, število
//     danih števk in »Tehnike:« z glavno tehniko krepko (pri presega tehnike »in ugibanje«), opis v
//     kartici; »Počisti« opis skrije;
//   - igra: okno »Zbirka ugank«, razdelek »Vgrajeni primeri« - skupine z naslovi, v vrstici primera
//     značka in vse tehnike, nič ne sega čez kartico; kartica »Uganka« pri primeru in pri uganki iz
//     zbirke z »Tehnike:« s številkami in imeni; star primer se ob zagonu počisti;
//   - brez vodoravnega preliva in napak JS.
//
//   node tools/preveri-primeri-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-primeri');

// Od vklopa XY-verige (2026-10-08) 16 primerov: P_15 Ekstrem, P_16 presega tehnike.
const SKUPINE = ['Lahka · tehnike', 'Srednja · tehnika', 'Težka · tehnika', 'Zelo težka · tehnike', 'Ekstrem · tehnika', 'Presega tehnike'];
// Barve oznak korakov (shared/base.css): srednja jantarna.
const JANTARNA = 'rgb(134, 92, 15)'; // --amber-ink #865C0F (pisava značk od XY-verige, korak 2; prej --amber)

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

const brezPreliva = b => b.izvedi('document.documentElement.scrollWidth <= document.documentElement.clientWidth');

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  const sel = await b.izvedi(`(() => { const s = document.getElementById('exampleSelect');
    return { napis: s.options[s.selectedIndex].textContent,
      deli: [...s.children].map(c => c.tagName === 'OPTGROUP' ? 'G:' + c.label : 'O:' + c.textContent + (c.disabled ? '/x' : '')),
      vrstice: [...s.querySelectorAll('optgroup option')].map(o => o.textContent) }; })()`);
  preveri('napis »Primeri po težavnosti«', sel.napis === 'Primeri po težavnosti', sel.napis);
  const skupine = sel.deli.filter(d => d.startsWith('G:')).map(d => d.slice(2));
  preveri('skupine po stopnji', JSON.stringify(skupine) === JSON.stringify(SKUPINE), skupine);
  const prazne = sel.deli.filter(d => d === 'O:/x').length;
  preveri('med skupinami ena prazna vrstica', prazne === SKUPINE.length - 1 && !sel.deli[1].startsWith('O:'), sel.deli);
  preveri('vrstice primerov', sel.vrstice.length === 16 && sel.vrstice[0] === 'P_1 · enojčki' && sel.vrstice[7] === 'P_8 · 7 X-krilo'
    && /^P_14 · \d+ .+ in \d+ .+$/.test(sel.vrstice[13]) && sel.vrstice[14] === 'P_15 · 13 XY-veriga'
    && sel.vrstice[15] === 'P_16 · z ugibanjem', sel.vrstice);

  const izberi = i => b.izvedi(`(() => { const s = document.getElementById('exampleSelect'); s.value = '${i}';
    s.dispatchEvent(new Event('change')); return true; })()`);
  await izberi(1);
  const op = await b.izvedi(`(() => { const el = document.getElementById('primerOpis'); const z = el.querySelector('.znacka-tezavnosti');
    const k = el.closest('.card').getBoundingClientRect(), r = el.getBoundingClientRect();
    return { vidno: !el.hidden && r.height > 0, vrstice: [...el.children].map(v => v.textContent),
      krepko: [...el.querySelectorAll('b')].map(x => x.textContent + '|' + getComputedStyle(x).fontWeight),
      znacka: z && getComputedStyle(z).color, vKartici: r.left >= k.left && r.right <= k.right }; })()`);
  preveri('opis pod seznamom viden in v kartici', op.vidno && op.vKartici, op);
  preveri('1. vrstica: značka in število danih', op.vrstice[0] === 'Srednja danih števk: 26', op.vrstice);
  preveri('2. vrstica: »Tehnike:« z vejicami in »in«', op.vrstice[1] === 'Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par', op.vrstice);
  preveri('glavna tehnika krepko', op.krepko.length === 1 && /^1 Izločitev izven bloka\|(700|bold)$/.test(op.krepko[0]), op.krepko);
  preveri('značka v barvi srednje ravni', op.znacka === JANTARNA, op.znacka);
  await b.posnetek(path.join(mapa, `resevalec-${sirina}-p2.png`), { vsaStran: false });

  await izberi(14);
  const ek = await b.izvedi(`[...document.getElementById('primerOpis').children].map(v => v.textContent)`);
  preveri('ekstrem: značka in »… in 13 XY-veriga«', /^Ekstrem danih števk: \d+$/.test(ek[0]) && /^Tehnike: E1, E2, .+ in 13 XY-veriga$/.test(ek[1]), ek);
  await izberi(15);
  const pr = await b.izvedi(`[...document.getElementById('primerOpis').children].map(v => v.textContent)`);
  preveri('presega tehnike: »… in ugibanje«, brez »+«', /^Presega tehnike danih števk: \d+$/.test(pr[0]) && /^Tehnike: E1, E2, .+ in ugibanje$/.test(pr[1]) && !/\+/.test(pr[1]), pr);
  preveri('brez vodoravnega preliva', await brezPreliva(b));
  await b.klikni('#clearBtn');
  preveri('»Počisti« skrije opis', await b.izvedi(`document.getElementById('primerOpis').hidden`));
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  await b.odpri('igra/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  // Star primer (»Primer 2 (brez ugibanja)«) s shranjenim napredkom - ob zagonu se počisti.
  await b.izvedi(`(() => { const d = STARI_PRIMERI[1];
    localStorage.setItem(IGRA_KLJUC, JSON.stringify({ zadnja: d, igre: { [d]: { poteze: [], kazalec: 0 } } })); return true; })()`);
  await b.odpri('igra/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  const st = await b.izvedi(`(() => { const s = JSON.parse(localStorage.getItem(IGRA_KLJUC)); return { igre: Object.keys(s.igre).length, zadnja: s.zadnja, igra: !!igra }; })()`);
  preveri('napredek starega primera je počiščen, mreža prazna', st.igre === 0 && st.zadnja === null && !st.igra, st);

  await b.klikni('#zbirkaBtn');
  const sez = await b.izvedi(`(() => { const r = document.getElementById('primeriRazdelek');
    const li = [...document.querySelectorAll('#primeriSeznam > li')];
    const k = document.querySelector('#zbirkaDialog .dialog-panel').getBoundingClientRect();
    return { odprt: r.open, skupine: li.filter(x => x.className === 'zb-skupina').map(x => x.textContent),
      kartic: li.filter(x => x.className !== 'zb-skupina').length,
      info: li.filter(x => x.className !== 'zb-skupina').map(x => x.querySelector('.zb-info').textContent),
      cez: li.filter(x => { const r = x.getBoundingClientRect(); return r.left < k.left - 0.5 || r.right > k.right + 0.5 || x.scrollWidth > x.clientWidth + 1; }).length,
      znacka: !!li[1].querySelector('.zb-info .znacka-tezavnosti') }; })()`);
  preveri('razdelek primerov odprt (zbirka prazna)', sez.odprt);
  preveri('skupine po stopnji', JSON.stringify(sez.skupine) === JSON.stringify(SKUPINE), sez.skupine);
  preveri('16 kartic, v vrstici značka in vse tehnike', sez.kartic === 16 && sez.znacka
    && /^Srednja danih 26 · Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par$/.test(sez.info[1]), sez.info.slice(0, 3));
  preveri('nič ne sega čez okno', sez.cez === 0, sez.cez);
  // Naslova razdelkov, podnaslovi skupin, podlaga kartic, prekrivanje.
  const sl = await b.izvedi(`(() => { const cs = el => getComputedStyle(el);
    const moje = document.getElementById('mojeNaslov'), prim = document.getElementById('primeriNaslov');
    const sk = document.querySelector('#primeriSeznam li.zb-skupina'), kart = document.querySelector('#primeriSeznam li:not(.zb-skupina)');
    const razd = document.getElementById('primeriRazdelek');
    const vrste = [moje, prim, ...document.querySelectorAll('#zbirkaDialog .zbirka-seznam > li, #zbirkaDialog .dialog-gumbi, #zbirkaDialog .namig')]
      .filter(e => e.getBoundingClientRect().height > 0).map(e => e.getBoundingClientRect());
    let prekrivanj = 0;
    for (let i = 0; i < vrste.length; i++) for (let j = i + 1; j < vrste.length; j++) {
      const a = vrste[i], c = vrste[j];
      if (a.left < c.right && c.left < a.right && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5) prekrivanj++;
    }
    return { moje: [moje.textContent, cs(moje).fontFamily, cs(moje).fontSize], prim: [prim.textContent, cs(prim).fontFamily, cs(prim).fontSize],
      skupina: [cs(sk).fontFamily, cs(sk).fontSize, cs(sk).textTransform], podlaga: cs(kart).backgroundColor,
      card: cs(document.body).getPropertyValue('--card').trim(), crta: cs(razd).borderTopStyle, prekrivanj }; })()`);
  preveri('naslova razdelkov enakovredna, v pisavi naslovov kartic', sl.moje[0] === 'Moje uganke (0)' && sl.prim[0] === 'Vgrajeni primeri (16)'
    && /Source Serif/.test(sl.moje[1]) && sl.moje[1] === sl.prim[1] && sl.moje[2] === '17px' && sl.prim[2] === '17px', sl);
  preveri('nad primeri ločilna črta', sl.crta === 'solid', sl.crta);
  preveri('podnaslovi skupin drobni in sivi', /JetBrains Mono/.test(sl.skupina[0]) && sl.skupina[1] === '11px' && sl.skupina[2] === 'uppercase', sl.skupina);
  preveri('kartice primerov s podlago --card (#F6F8F9)', sl.podlaga === 'rgb(246, 248, 249)', sl.podlaga);
  preveri('naslovi in vrstice se ne prekrivajo', sl.prekrivanj === 0, sl.prekrivanj);
  await b.izvedi(`document.getElementById('primeriNaslov').scrollIntoView(); true`);
  await b.posnetek(path.join(mapa, `igra-${sirina}-primeri.png`), { vsaStran: false });

  // Igraj P_8 (X-krilo).
  await b.izvedi(`(() => { const li = [...document.querySelectorAll('#primeriSeznam > li')].find(x => x.textContent.startsWith('P_8 · '));
    li.querySelector('.zb-gumbi button').click(); return true; })()`);
  const kart = await b.izvedi(`(() => { const el = document.getElementById('opisUganke');
    return { vrstice: [...el.children].map(v => v.textContent), krepko: [...el.querySelectorAll('b')].map(x => x.textContent) }; })()`);
  preveri('kartica »Uganka« pri primeru: značka, ime, »Tehnike:« z glavno krepko',
    kart.vrstice[0] === 'Težka vgrajeni primer »P_8 · 7 X-krilo« · danih števk: 24'
    && kart.vrstice[1] === 'Tehnike: E1, E2, 1 Izločitev izven bloka, 3 Očitni par, 4 Skriti par in 7 X-krilo'
    && kart.krepko.join() === '7 X-krilo', kart);
  preveri('brez vodoravnega preliva', await brezPreliva(b));
  await b.posnetek(path.join(mapa, `igra-${sirina}-p8.png`));
}

async function main() {
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      await resevalec(b, sirina);
      await igra(b, sirina);
    }
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(napak ? `\nNe drži: ${napak}.` : '\nVse drži.');
  console.log(`Posnetki zaslona: ${mapa}`);
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
