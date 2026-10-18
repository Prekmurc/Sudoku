'use strict';
// Naloga 11a – imena (docs/naloga11a-nacrt.md, 5.6) v pravem brskalniku pri 375 in 1280 px.
//   --korak 1 (imena in težavnost):
//     - trening: naslova kartic 9 · Kratka X-veriga (Turbot Fish) in 11 · XY-krilo (XY-Wing), isti imeni v
//       kazalu; značke kartic LAHKA (EASY) … EKSTREMNA (EXTREME) – vsaka v eni vrstici, nad imenom (ga ne
//       prekrije) in v kartici (posebej »EKSTREMNA (EXTREME)« pri 375 px); dodatna angleška imena niso v meniju;
//       Pomoč: »Značka pove najnižjo težavnost …«, uvod razdelka »Tehnike«, značke težavnosti, dodatna angleška
//       imena natanko pri štirih tehnikah;
//     - reševalec: Pomoč (uvod, stopnje z »ekstremna«, brez »raven«/»napredn«), P_14 – povzetek in koraki s
//       »9 · Kratka X-veriga« in »11 · XY-krilo (XY-Wing)«, sporočilo koraka s »kratk… X-verig…«; P_15 »Ekstremna«;
//     - igra: stara shramba (zapis »Ekstrem«, filter »Ekstrem«) se pokaže kot »Ekstremna« (značka turkizna,
//       filter ostane vklopljen), uvoz starega izvoza (»Ekstrem«, »Veriga ene števke 2«) da nova imena,
//       primeri P_14 in P_15, okno »Nova uganka« – pet gumbov z »Ekstremna« (pri 1280 px v eni vrstici),
//       Pomoč (uvod, brez »raven«/»napredn«/»ekstrem«);
//     - povsod brez vodoravnega preliva in brez napak JS.
//   --korak 2: dopolni korak 2 naloge (skupine in prikaz).
//
//   node tools/preveri-naloga11a-brskalnik.js --korak 1 [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome). Posnetki zaslona v --mapa
// (privzeto začasna mapa).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadEngine, loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const korak = args.includes('--korak') ? args[args.indexOf('--korak') + 1] : '1';
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-naloga11a');
fs.mkdirSync(mapa, { recursive: true });

const E = loadEngine(undefined, { files: ['shared/stanje.js', 'shared/zbirka.js'], names: ['zbirkaPrimerZa'] });
// Dve uganki iz docs/uganke.md, ki nista vgrajena primera (primerov zbirka in uvoz ne shranita).
const [U1, U2] = loadPuzzles().filter(p => !E.zbirkaPrimerZa(p.danosti)).map(p => p.danosti.replace(/\./g, '0'));

const NAPIS = { lahka: 'LAHKA (EASY)', srednja: 'SREDNJA (MEDIUM)', napredna: 'TEŽKA (HARD)', ekspertna: 'EKSTREMNA (EXTREME)' };
const DRUGA = ['Drugo angleško ime: Pointing', 'Druga angleška imena: Claiming, Box/Line Intersection',
  'Druga angleška imena: Skyscraper, 2-String Kite', 'Drugo angleško ime: Y-Wing'];
const UVOD = /^Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje: lahka \(E1–E2\), srednja \(1–\d+\), težka \(\d+–\d+\) in ekstremna \([\d–]+\)\. Težavnost uganke je težavnost njene najtežje tehnike\. Zelo težka je uganka, ki potrebuje vsaj dve različni tehniki \d+–\d+\.$/;
const RAVEN = /(^|[^\wčšž-])(raven|ravn\w*)|napredn|ekspertn/i;
const TURKIZNA = 'rgb(108, 200, 200)'; // --turq-dark v shared/base.css

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const J = JSON.stringify;
const brezPreliva = b => b.izvedi('document.documentElement.scrollWidth <= document.documentElement.clientWidth');

// Razdelek »Tehnike« v odprtem oknu Pomoč (izbirnik elementa seznama tehnik).
async function tehnikeVPomoci(b, el, kje) {
  const t = await b.izvedi(`(() => { const el = document.querySelector('${el}');
    return { uvod: el.querySelector('p').textContent,
      znacke: [...el.querySelectorAll('.tehnika-raven')].map(z => z.textContent),
      druga: [...el.querySelectorAll('.tehnika-druga')].map(d => d.textContent),
      ime9: [...el.querySelectorAll('ul.tehnike > li')][10].querySelector('b').textContent,
      ime11: [...el.querySelectorAll('ul.tehnike > li')][12].querySelector('b').textContent,
      sivo: (() => { const d = el.querySelector('.tehnika-druga'), r = el.querySelector('ul.tehnike p:not(.tehnika-druga)');
        return d && parseFloat(getComputedStyle(d).fontSize) < parseFloat(getComputedStyle(r).fontSize); })() }; })()`);
  preveri(`${kje}: uvod razdelka »Tehnike« (pomen značke, razponi, stavek o Zelo težki)`, UVOD.test(t.uvod), t.uvod);
  preveri(`${kje}: značke težavnosti pri 15 tehnikah`, t.znacke.length === 15 && t.znacke.every(z => Object.values(NAPIS).includes(z))
    && t.znacke[0] === NAPIS.lahka && t.znacke[10] === NAPIS.napredna && t.znacke[14] === NAPIS.ekspertna, t.znacke);
  preveri(`${kje}: dodatna angleška imena natanko pri 1, 2, 9, 11`, J(t.druga) === J(DRUGA), t.druga);
  preveri(`${kje}: pripis manjši od razlage`, t.sivo);
  preveri(`${kje}: imeni 9 in 11`, t.ime9 === 'Kratka X-veriga (Turbot Fish)' && t.ime11 === 'XY-krilo (XY-Wing)', [t.ime9, t.ime11]);
}

async function trening(b, sirina) {
  console.log(`Trening, ${sirina} px`);
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  const m = await b.izvedi(`(() => {
    const kartice = [...document.querySelectorAll('#menu .menu-card')].map(k => {
      const z = k.querySelector('.badge'), h = k.querySelector('h3');
      const rz = z.getBoundingClientRect(), rh = h.getBoundingClientRect(), rk = k.getBoundingClientRect();
      const visina = parseFloat(getComputedStyle(z).lineHeight) || parseFloat(getComputedStyle(z).fontSize) * 1.3;
      return { mode: k.dataset.mode, znacka: z.textContent, razred: z.className, ime: h.textContent,
        vrstic: z.getClientRects().length, nizka: rz.height < 2 * visina, nadImenom: rz.bottom <= rh.top + 0.5,
        vKartici: rz.left >= rk.left && rz.right <= rk.right, sirina: Math.round(rz.width) };
    });
    const ravni = Object.fromEntries([...TRENING_ENOJCKA, ...TRENING_TEHNIKE].map(([m, t]) => [m, ravenTehnike(t)]));
    const vrstica = m => document.querySelector('#kazaloTehnik [data-kazalo="' + m + '"]');
    return { kartice, ravni, kazalo9: vrstica('turbot-fish').textContent, kazalo11: vrstica('xy-wing').textContent,
      meni: document.getElementById('menu').innerHTML };
  })()`);
  const po = Object.fromEntries(m.kartice.map(k => [k.mode, k]));
  preveri('naslov kartice 9', po['turbot-fish'].ime === 'Kratka X-veriga (Turbot Fish)', po['turbot-fish'].ime);
  preveri('naslov kartice 11', po['xy-wing'].ime === 'XY-krilo (XY-Wing)', po['xy-wing'].ime);
  preveri('kazalo: imeni 9 in 11', m.kazalo9.includes('Kratka X-veriga') && m.kazalo9.includes('Turbot Fish')
    && m.kazalo11.includes('XY-krilo') && m.kazalo11.includes('XY-Wing') && !m.kazalo11.includes('Y-Wing,'), [m.kazalo9, m.kazalo11]);
  const zn = m.kartice.filter(k => k.znacka !== NAPIS[m.ravni[k.mode]] || k.razred !== `badge badge-${m.ravni[k.mode]}`);
  preveri('značke kartic: težavnost tehnike, razred ravni', m.kartice.length === 15 && zn.length === 0, zn);
  const slabe = m.kartice.filter(k => k.vrstic !== 1 || !k.nizka || !k.nadImenom || !k.vKartici);
  preveri('značke v eni vrstici, nad imenom, v kartici', slabe.length === 0, slabe);
  const ek = po['xy-chain'];
  preveri(`»EKSTREMNA (EXTREME)« v eni vrstici, ne prekrije imena (${ek.sirina} px)`, ek.vrstic === 1 && ek.nizka && ek.nadImenom && ek.vKartici, ek);
  preveri('dodatna angleška imena niso v meniju', !/Claiming|Box\/Line Intersection|Y-Wing,|Skyscraper|2-String Kite/.test(m.meni));
  preveri('brez vodoravnega preliva (meni)', await brezPreliva(b));
  await b.izvedi(`document.querySelector('.menu-card[data-mode="xy-chain"]').scrollIntoView({ block: 'center' }); true`);
  await b.posnetek(path.join(mapa, `trening-${sirina}-kartice.png`), { vsaStran: false });

  await b.klikni('#pomocBtn');
  await b.cakaj(`document.getElementById('pomocDialog').classList.contains('odprt')`);
  const p = await b.izvedi(`[...document.querySelectorAll('#pomocDialog p')].map(x => x.textContent).find(t => t.startsWith('Značka'))`);
  preveri('Pomoč treninga: »Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje.«',
    p && p.startsWith('Značka pove najnižjo težavnost uganke, ki to tehniko potrebuje. '), p);
  await tehnikeVPomoci(b, '#pomocTehnike', 'Pomoč treninga');
  preveri('Pomoč treninga: brez »raven«, »napredn«, »ekspertn«', !RAVEN.test(await b.izvedi(`document.getElementById('pomocDialog').textContent`)));
  await b.izvedi(`document.querySelectorAll('#pomocTehnike ul.tehnike > li')[10].scrollIntoView({ block: 'start' }); true`);
  await b.posnetek(path.join(mapa, `trening-${sirina}-pomoc-9.png`), { vsaStran: false });
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.klikni('#pomocBtn');
  await b.cakaj(`document.getElementById('pomocDialog').classList.contains('odprt')`);
  await tehnikeVPomoci(b, '#pomocTehnike', 'Pomoč reševalca');
  const pomoc = await b.izvedi(`({ stopnje: [...document.querySelectorAll('#pomocStopnje li')].map(l => l.textContent),
    besedilo: document.getElementById('pomocDialog').textContent })`);
  preveri('Pomoč reševalca: stopnja »ekstremna«', pomoc.stopnje[4] === 'ekstremna potrebuje tehniko 13 (XY-veriga)', pomoc.stopnje);
  preveri('Pomoč reševalca: brez »raven«, »napredn«, »ekspertn«, »ekstrem«', !RAVEN.test(pomoc.besedilo) && !/\bekstrem\b/i.test(pomoc.besedilo));
  await b.izvedi(`document.querySelector('#pomocDialog [data-zapri]').click(); true`);

  const izberi = i => b.izvedi(`(() => { const s = document.getElementById('exampleSelect'); s.value = '${i}';
    s.dispatchEvent(new Event('change')); return true; })()`);
  await izberi(13); // P_14 (Zelo težka: 9 in 11)
  await b.klikni('#solveBtn');
  await b.cakaj(`document.getElementById('status').className === 'ok'`, 20000);
  await b.klikni('#openStepsBtn');
  await b.cakaj(`document.getElementById('steps').children.length > 0`);
  const r = await b.izvedi(`({ povzetek: document.getElementById('summary').textContent,
    koraki: [...document.querySelectorAll('#steps > li')].map(l => l.textContent) })`);
  preveri('povzetek: 9 · Kratka X-veriga (Turbot Fish) in 11 · XY-krilo (XY-Wing)',
    r.povzetek.includes('9 · Kratka X-veriga (Turbot Fish)') && r.povzetek.includes('11 · XY-krilo (XY-Wing)') && !r.povzetek.includes('Y-Wing,'), r.povzetek);
  const k9 = r.koraki.find(k => k.includes('9 · Kratka X-veriga'));
  preveri('korak 9: oznaka in sporočilo s kratko X-verigo', !!k9 && /kratk\w* X-verig/.test(k9) && !/ene števke/.test(k9), k9);
  preveri('nikjer »veriga ene števke«', !r.koraki.some(k => /ene števke/.test(k)));
  await izberi(14); // P_15
  const ek = await b.izvedi(`document.getElementById('primerOpis').children[0].textContent`);
  preveri('P_15: značka »Ekstremna«', /^Ekstremna danih števk: \d+$/.test(ek), ek);
  preveri('brez vodoravnega preliva', await brezPreliva(b));
  await b.posnetek(path.join(mapa, `resevalec-${sirina}.png`), { vsaStran: false });
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await odpri();
  // Stara shramba: zapis s težavnostjo »Ekstrem« in shranjen filter »Ekstrem«.
  await b.izvedi(`localStorage.clear(); localStorage.setItem('sudoku.zbirka.v1', ${J(J([
    { danosti: U1, tezavnost: 'Ekstrem', izvor: 'rocno', dodano: '2026-10-01 10:00', opomba: '' }]))});
    localStorage.setItem('sudoku.zbirka.filtri', ${J(J({ tezavnost: 'Ekstrem', stanje: null, tehnika: null, razvrsti: 'nazadnje' }))}); true`);
  await odpri();
  await b.klikni('#zbirkaBtn');
  await b.cakaj(`document.getElementById('zbirkaDialog').classList.contains('odprt')`);
  const sez = () => b.izvedi(`(() => { const li = [...document.querySelectorAll('#zbirkaSeznam > li')];
    return { kartice: li.map(x => ({ info: (x.querySelector('.zb-info') || x).textContent,
        znacka: x.querySelector('.znacka-tezavnosti') && x.querySelector('.znacka-tezavnosti').textContent,
        razred: x.querySelector('.znacka-tezavnosti') && x.querySelector('.znacka-tezavnosti').className,
        podlaga: x.querySelector('.znacka-tezavnosti') && getComputedStyle(x.querySelector('.znacka-tezavnosti')).backgroundColor })),
      filter: document.querySelector('#zbirkaDialog select[data-filter="tezavnost"]').value,
      moznosti: [...document.querySelector('#zbirkaDialog select[data-filter="tezavnost"]').options].map(o => o.textContent) }; })()`);
  let s = await sez();
  preveri('stara shramba: zapis »Ekstrem« se pokaže kot »Ekstremna«, turkizna značka',
    s.kartice.length === 1 && s.kartice[0].znacka === 'Ekstremna' && /znacka-ekstrem/.test(s.kartice[0].razred) && s.kartice[0].podlaga === TURKIZNA, s.kartice);
  preveri('stari filter »Ekstrem« ostane vklopljen kot »Ekstremna«', s.filter === '=Ekstremna' && s.moznosti.some(o => o.startsWith('Ekstremna')), s);

  // Uvoz starega izvoza.
  const md = path.join(mapa, 'star-izvoz.md');
  fs.writeFileSync(md, ['# Zbirka', '', '### 2026-10-02 10:00 · Ekstrem', '',
    `- **Danosti:** \`${U2.replace(/0/g, '.')}\``, '- **Težavnost:** Ekstrem', '- **Izvor:** ročni vnos',
    '- **Dodano:** 2026-10-02 10:00', '- **Tehnike:** Očitni par 1, Veriga ene števke 2', ''].join('\n'));
  await b.izvedi(`document.getElementById('zbirkaStatus').textContent = ''; true`);
  await b.izberiDatoteko('#zbirkaUvoziBtn', [md]);
  await b.cakaj(`document.getElementById('zbirkaStatus').textContent !== ''`, 10000);
  const z = await b.izvedi(`zbirkaBeri().find(z => z.danosti === '${U2}')`);
  preveri('uvoz: »Ekstrem« → »Ekstremna«, »Veriga ene števke 2« → Turbot Fish',
    z && z.tezavnost === 'Ekstremna' && J(z.tehnike) === J([['Naked pair', 1], ['Turbot Fish', 2]]), z);
  s = await sez();
  preveri('uvožena uganka v seznamu z »9 Kratka X-veriga«', s.kartice.some(k => k.znacka === 'Ekstremna' && k.info.includes('9 Kratka X-veriga')), s.kartice.map(k => k.info));
  await b.posnetek(path.join(mapa, `igra-${sirina}-zbirka.png`), { vsaStran: false });

  const pr = await b.izvedi(`(() => { const li = [...document.querySelectorAll('#primeriSeznam > li')].filter(x => x.className !== 'zb-skupina');
    return li.map(x => x.textContent); })()`);
  preveri('primer P_14: 9 Kratka X-veriga in 11 XY-krilo', pr.some(t => t.includes('P_14') && t.includes('9 Kratka X-veriga') && t.includes('11 XY-krilo')), pr[13]);
  preveri('primer P_15: Ekstremna', pr.some(t => t.includes('P_15') && t.includes('Ekstremna')), pr[14]);
  await b.izvedi(`document.querySelector('#zbirkaDialog [data-zapri]').click(); true`);

  await b.klikni('#novaBtn');
  await b.cakaj(`document.getElementById('novaDialog').classList.contains('odprt')`);
  const n = await b.izvedi(`(() => { const g = [...document.getElementById('stopnjeGumbi').children];
    return { imena: g.map(x => x.textContent), vrh: g.map(x => Math.round(x.getBoundingClientRect().top)),
      title: g[4].title, merila: [...document.querySelectorAll('#stopnjeNova li')].map(l => l.textContent),
      okno: document.querySelector('#novaDialog').textContent }; })()`);
  preveri('»Nova uganka«: pet gumbov, zadnji »Ekstremna«', J(n.imena) === J(['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstremna']), n.imena);
  if (sirina >= 1000) preveri('pri 1280 px gumbi v eni vrstici', new Set(n.vrh).size === 1, n.vrh);
  preveri('merilo Ekstremne', n.merila[4] === 'ekstremna potrebuje tehniko 13 (XY-veriga) in vsaj dve srednji' && n.title === 'potrebuje tehniko 13 (XY-veriga) in vsaj dve srednji', n.merila[4]);
  preveri('okno »Nova uganka« brez »raven«, »napredn«', !RAVEN.test(n.okno), n.okno.match(RAVEN));
  await b.posnetek(path.join(mapa, `igra-${sirina}-nova.png`), { vsaStran: false });
  await b.izvedi(`document.querySelector('#novaDialog [data-zapri]').click(); true`);

  await b.klikni('#navodilaBtn');
  await b.cakaj(`document.getElementById('navodilaDialog').classList.contains('odprt')`);
  await tehnikeVPomoci(b, '#tehnikeSeznam', 'Pomoč igre');
  const t = await b.izvedi(`document.getElementById('navodilaDialog').textContent`);
  preveri('Pomoč igre: brez »raven«, »napredn«, »ekspertn«, »ekstrem«', !RAVEN.test(t) && !/\bekstrem\b/i.test(t), t.match(RAVEN) || t.match(/\bekstrem\b/i));
  preveri('Pomoč igre: »ekstremna« med stopnjami', t.includes('zelo težka, ekstremna)') && t.includes('Zelo težka ali Ekstremna)'));
  preveri('brez vodoravnega preliva', await brezPreliva(b));
  await b.izvedi('localStorage.clear(); true');
}

async function main() {
  if (korak !== '1') {
    console.log(`Korak ${korak}: scenarij dopolni korak 2 naloge 11a.`);
    process.exit(1);
  }
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      await trening(b, sirina);
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
