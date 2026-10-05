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

const SKUPINE = ['Lahka · tehnike', 'Srednja · tehnika', 'Težka · tehnika', 'Zelo težka · tehnike', 'Presega tehnike'];
// Barve oznak korakov (shared/base.css): srednja jantarna.
const JANTARNA = 'rgb(156, 107, 18)'; // --amber #9C6B12

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
  preveri('vrstice primerov', sel.vrstice.length === 15 && sel.vrstice[0] === 'P_1 · enojčki' && sel.vrstice[7] === 'P_8 · 7 X-krilo'
    && /^P_14 · \d+ .+ in \d+ .+$/.test(sel.vrstice[13]) && sel.vrstice[14] === 'P_15 · z ugibanjem', sel.vrstice);

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
  preveri('15 kartic, v vrstici značka in vse tehnike', sez.kartic === 15 && sez.znacka
    && /^Srednja danih 26 · Tehnike: E1, E2, 1 Izločitev izven bloka in 3 Očitni par$/.test(sez.info[1]), sez.info.slice(0, 3));
  preveri('nič ne sega čez okno', sez.cez === 0, sez.cez);
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
