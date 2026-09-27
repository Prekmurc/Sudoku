'use strict';
// Polje Niz v pravem brskalniku (docs/niz-resevalec-nacrt.md): reševalec in okno
// "Nova uganka" v igri, pri širini 375 in 1200 px. Besedilo se vnese kot s
// tipkovnico (Input.insertText, en dogodek input - kot lepljenje), gumbi s pravim
// klikom. Preveri mrežo, sporočila in njihovo barvo, rdeče celice pri konfliktu,
// "Reši" po nizu, da je polje v kartici in da ne povzroči vodoravnega drsnika, ter da
// v strani ni napak JS. Posnetke zaslona shrani v mapo (--mapa, privzeto začasna).
//
//   node tools/preveri-niz-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');
const { loadPuzzles } = require('../tests/load-engine.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-niz');

const danosti = loadPuzzles()[0].danosti.replace(/\./g, '0');
const pike = danosti.replace(/0/g, '.');
const danih = danosti.replace(/0/g, '').length;
const kratek = 'x' + loadPuzzles()[1].danosti.slice(1, 60); // 59 veljavnih in »x«
// Konflikt: prva prazna celica dobi števko, ki je v njeni vrstici že dana.
const kc = danosti.indexOf('0');
const konfliktni = danosti.slice(0, kc) + danosti.slice(Math.floor(kc / 9) * 9, Math.floor(kc / 9) * 9 + 9).replace(/0/g, '')[0] + danosti.slice(kc + 1);

const RDECA = 'rgb(178, 58, 46)'; // --red v app/app.css
let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}

async function resevalec(b, sirina) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900 });
  const besedilo = id => b.izvedi(`document.getElementById('${id}').textContent`);

  await b.fokus('#nizDanosti');
  await b.vtipkaj(pike);
  preveri('veljaven niz izpolni mrežo', await b.izvedi('currentGivens()') === danosti);
  const st = await besedilo('status');
  preveri('status »Niz je vpisan v mrežo«', st === `Niz je vpisan v mrežo - danih števk: ${danih}.`, st);
  await b.posnetek(path.join(mapa, `resevalec-${sirina}-niz.png`));

  await b.fokus('#nizDanosti'); // označi vse - vnos besedilo zamenja
  await b.vtipkaj(kratek);
  const ns = await besedilo('nizStatus');
  preveri('nepopoln niz: sporočilo z naštetim znakom',
    ns === 'Veljavnih znakov v nizu: 59 (potrebnih je 81). Neveljaven znak »x« je izpuščen – prazna celica je 0 ali pika.', ns);
  const barva = await b.izvedi("getComputedStyle(document.getElementById('nizStatus')).color");
  preveri('sporočilo je rdeče', barva === RDECA, barva);
  preveri('mreža ostane', await b.izvedi('currentGivens()') === danosti);
  // Polje v kartici in brez lastnega vodoravnega prelivanja: širina strani je enaka
  // s poljem in brez njega (morebitno prelivanje mreže je obstoječe, ne od polja).
  const meje = await b.izvedi(`(() => {
    const k = document.querySelector('.card').getBoundingClientRect();
    const p = document.querySelector('.prilepi').getBoundingClientRect();
    const s = document.getElementById('nizStatus').getBoundingClientRect();
    const sw = () => document.documentElement.scrollWidth;
    const s1 = sw();
    document.querySelector('.prilepi').style.display = 'none';
    document.getElementById('nizStatus').style.display = 'none';
    const s2 = sw();
    document.querySelector('.prilepi').style.display = '';
    document.getElementById('nizStatus').style.display = '';
    return { vKartici: p.left >= k.left && p.right <= k.right && s.right <= k.right, s1, s2, okno: innerWidth };
  })()`);
  preveri('polje in sporočilo sta v kartici', meje.vKartici, meje);
  preveri('polje ne poveča širine strani', meje.s1 === meje.s2, meje);
  if (meje.s1 > meje.okno) console.log(`    (opomba: stran je širša od okna že brez polja - ${meje.s1} > ${meje.okno} px)`);
  await b.posnetek(path.join(mapa, `resevalec-${sirina}-kratek.png`));

  await b.fokus('#nizDanosti');
  await b.vtipkaj(konfliktni);
  const rdece = await b.izvedi(`[...document.querySelectorAll('#inputGrid input.conflict')].map(i => getComputedStyle(i).color)`);
  // Vsaj dve (števka je lahko v konfliktu v več enotah hkrati).
  preveri('konflikt: rdeče celice', rdece.length >= 2 && rdece.every(c => c === RDECA), rdece);
  await b.klikni('#solveBtn');
  const zavrnitev = await besedilo('status');
  preveri('konflikt: »Reši« zavrne', zavrnitev.startsWith('Popravi rdeče označene celice'), zavrnitev);

  await b.fokus('#nizDanosti');
  await b.vtipkaj(danosti);
  await b.klikni('#solveBtn');
  await b.cakaj("document.getElementById('status').className === 'ok'", 20000);
  preveri('»Reši« po nizu reši uganko', await b.izvedi("getComputedStyle(document.getElementById('results')).display") === 'block');
  await b.posnetek(path.join(mapa, `resevalec-${sirina}-reseno.png`));

  await b.klikni('#clearBtn');
  preveri('»Počisti« izprazni polje in mrežo',
    await b.izvedi("document.getElementById('nizDanosti').value === '' && currentGivens() === '0'.repeat(81)"));
}

async function igra(b, sirina) {
  console.log(`Igra (okno »Nova uganka«), ${sirina} px`);
  await b.odpri('igra/index.html', { sirina, visina: 900 });
  await b.klikni('#novaBtn');
  await b.cakaj("document.getElementById('novaDialog').classList.contains('odprt')");
  const mreza = "[...document.querySelectorAll('#novaMreza input')].map(i => i.value || '0').join('')";
  const status = () => b.izvedi("document.getElementById('novaStatus').textContent");

  await b.fokus('#novaNiz');
  await b.vtipkaj(pike);
  preveri('veljaven niz izpolni mrežo okna', await b.izvedi(mreza) === danosti);
  preveri('sporočilo »Niz je vpisan v mrežo.«', await status() === 'Niz je vpisan v mrežo.');

  await b.fokus('#novaNiz');
  await b.vtipkaj(kratek);
  const s = await status();
  preveri('nepopoln niz: sporočilo z naštetim znakom',
    s === 'Veljavnih znakov v nizu: 59 (potrebnih je 81). Neveljaven znak »x« je izpuščen – prazna celica je 0 ali pika.', s);
  const barva = await b.izvedi("getComputedStyle(document.getElementById('novaStatus')).color");
  preveri('sporočilo je rdeče', barva === 'rgb(178, 58, 46)', barva); // --red v igra/igra.css
  preveri('mreža okna ostane', await b.izvedi(mreza) === danosti);
  await b.izvedi("document.getElementById('novaStatus').scrollIntoView({ block: 'center' })");
  await b.posnetek(path.join(mapa, `igra-${sirina}-kratek.png`), { vsaStran: false }); // okno je fiksno

  await b.fokus('#novaNiz');
  await b.vtipkaj(danosti);
  await b.klikni('#novaZacni');
  await b.cakaj("!document.getElementById('novaDialog').classList.contains('odprt')", 20000);
  preveri('»Začni igro« po nizu odpre igro', await b.izvedi('igra && igra.danosti') === danosti);
  await b.posnetek(path.join(mapa, `igra-${sirina}-igra.png`));
}

async function main() {
  const b = await zazeni();
  try {
    for (const sirina of [375, 1200]) {
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
