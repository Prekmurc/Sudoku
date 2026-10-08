'use strict';
// XY-veriga, korak 7 (generator ponudi Ekstrem - O9 v docs/xy-veriga-nacrt.md) v pravem brskalniku
// pri 375 in 1280 px:
//   - gumbi stopenj (popravek po ročnem pregledu 2026-10-08): pri 375 in 430 px 3 + 2, pri 320 px 2 + 2 + 1
//     (kot prej), od 520 px vseh pet v eni vrstici; napisi brez preliva, gumbi enako visoki, v panelu;
//   - igra, okno »Nova uganka«: pet gumbov stopenj (zadnji »Ekstrem« z namigom merila iskanja), seznam
//     meril generatorja s petimi stopnjami, gumbi v panelu, brez vodoravnega preliva strani in okna;
//   - pravi klik na »Ekstrem« in »Ustvari uganko«: iskanje v delavcu (generator-worker.js) najde uganko,
//     okno se zapre, uganka je v zbirki s težavnostjo Ekstrem in izvorom generator, kartica »Uganka«
//     ima značko »Ekstrem« (t-expert znacka-ekstrem), sporočilo »Ustvarjena uganka stopnje »Ekstrem««;
//     v strani preverjeno: countSolutions() = 1, solve() jo reši brez ugibanja z XY-verigo,
//     oceniTezavnost() = Ekstrem; izbrana stopnja ostane po osvežitvi;
//   - reševalec (isti izvor, ista zbirka): uganka vpisana s poljem Niz (vtipkana), »Reši« - mreža
//     rešena (= solutionOf()), dnevnik brez poskusa, z XY-verigo, korak z oznako »13 · XY-veriga«;
//   - Pomoč igre: stopnje generatorja z »ekstrem« in »Ekstrem«, poved o strožjem generatorju;
//   - čas iskanja: pri 1280 px še --iskanj (privzeto 10) iskanj s pravimi kliki - čas in število semen
//     iz sporočila delavca;
//   - brez napak JS. Posnetki v mapo (--mapa).
//
//   node tools/preveri-generator-brskalnik.js [--mapa <mapa>] [--iskanj N]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-generator');
const ISKANJ = args.includes('--iskanj') ? Number(args[args.indexOf('--iskanj') + 1]) : 10;
const STOPNJE = ['Lahka', 'Srednja', 'Težka', 'Zelo težka', 'Ekstrem'];
const OPIS_ISKANJA = 'potrebuje ekspertno tehniko (13 – XY-veriga) in vsaj dve srednji';

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const preliv = b => b.izvedi('document.documentElement.scrollWidth > document.documentElement.clientWidth');
const pocakaj = ms => new Promise(r => setTimeout(r, ms));

async function klikniTocko(b, x, y) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await b.cdp.poslji('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
  }
}
// Pravi klik na element, ki ga vrne izraz (središče, pomaknjeno v okno).
async function klikniEl(b, izraz) {
  const t = await b.izvedi(`(() => { const el = ${izraz}; el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await klikniTocko(b, t.x, t.y);
  await pocakaj(80);
}
const gumbStopnje = ime => `[...document.querySelectorAll('#stopnjeGumbi button')].find(x => x.textContent === '${ime}')`;

// Ena uganka Ekstrem s pravimi kliki: odpre okno, izbere Ekstrem (če treba), »Ustvari uganko«, počaka.
// Vrne sporočilo delavca { danosti, seme, poskusi, ms } in ali je iskal delavec.
async function ustvariEkstrem(b) {
  await b.izvedi(`window.najdena = null; window.zDelavcem = null;
    if (!window.ovito) { window.ovito = true; const o = obdelajIskanje;
      obdelajIskanje = m => { if (m.tip === 'najdena') { window.zDelavcem = !!(iskanje && iskanje.worker && !iskanje.vGlavniNiti); window.najdena = m; } return o(m); }; }
    true`);
  await klikniEl(b, `document.getElementById('novaBtn')`);
  if (!(await b.izvedi(`izbranaStopnja === 'ekstrem'`))) await klikniEl(b, gumbStopnje('Ekstrem'));
  await klikniEl(b, `document.getElementById('ustvariBtn')`);
  await b.cakaj('!!window.najdena', 35000);
  return b.izvedi('({ ...window.najdena, zDelavcem: window.zDelavcem })');
}

// Postavitev gumbov stopenj (popravek po ročnem pregledu 2026-10-08): na telefonu 3 + 2, na računalniku
// vseh pet v eni vrstici; napis v eni vrstici, brez preliva iz gumba, gumbi v panelu, enako visoki.
async function postavitevGumbov(b, sirina, vrstice) {
  await b.odpri('igra/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await b.izvedi(`document.getElementById('novaBtn').click(); true`);
  const g = await b.izvedi(`(() => { const pr = document.querySelector('#novaDialog .dialog-panel').getBoundingClientRect();
    const gumbi = [...document.querySelectorAll('#stopnjeGumbi button')].map(el => { const r = el.getBoundingClientRect();
      const s = getComputedStyle(el); return { top: Math.round(r.top), h: Math.round(r.height), sirina: Math.round(r.width),
        vPanelu: r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5, preliv: el.scrollWidth > el.clientWidth,
        padding: s.padding }; });
    return gumbi; })()`);
  const poVrsticah = [];
  for (const x of g) { const v = poVrsticah.find(v => v.top === x.top); if (v) v.n++; else poVrsticah.push({ top: x.top, n: 1 }); }
  preveri(`${sirina} px: gumbi stopenj ${vrstice.join(' + ')}`, JSON.stringify(poVrsticah.map(v => v.n)) === JSON.stringify(vrstice), g);
  preveri(`${sirina} px: napisi v eni vrstici, brez preliva, gumbi enako visoki in v panelu`,
    g.every(x => !x.preliv && x.vPanelu && x.h === g[0].h), g);
  return g;
}

async function igra(b, sirina) {
  console.log(`Igra, ${sirina} px`);
  const odpri = () => b.odpri('igra/index.html', { sirina, visina: 1000, mobilno: sirina < 500 });
  await odpri();
  await b.izvedi('localStorage.clear(); true');
  await odpri();

  // Okno »Nova uganka«.
  await klikniEl(b, `document.getElementById('novaBtn')`);
  const o = await b.izvedi(`(() => { const d = document.getElementById('novaDialog'); const panel = d.querySelector('.dialog-panel');
    const pr = panel.getBoundingClientRect(); const gumbi = [...document.querySelectorAll('#stopnjeGumbi button')];
    return { odprt: d.classList.contains('odprt'), imena: gumbi.map(g => g.textContent), title: gumbi.map(g => g.title),
      vPanelu: gumbi.every(g => { const r = g.getBoundingClientRect(); return r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5; }),
      merila: [...document.querySelectorAll('#stopnjeNova > li')].map(li => li.textContent),
      prelivOkna: panel.scrollWidth > panel.clientWidth }; })()`);
  preveri('okno »Nova uganka« odprto', o.odprt);
  preveri('pet gumbov stopenj, zadnji »Ekstrem«', JSON.stringify(o.imena) === JSON.stringify(STOPNJE), o.imena);
  preveri('namig miške na »Ekstrem« = merilo iskanja', o.title[4] === OPIS_ISKANJA, o.title[4]);
  preveri('seznam meril generatorja: pet stopenj, zadnja ekstrem', o.merila.length === 5 && o.merila[4] === 'ekstrem ' + OPIS_ISKANJA, o.merila);
  preveri('gumbi stopenj v panelu, okno brez vodoravnega preliva', o.vPanelu && !o.prelivOkna, o);
  preveri('stran brez vodoravnega preliva', !(await preliv(b)));
  await klikniEl(b, gumbStopnje('Ekstrem'));
  const izbira = await b.izvedi(`({ izbrana: izbranaStopnja, pritisnjen: ${gumbStopnje('Ekstrem')}.getAttribute('aria-pressed'),
    razred: ${gumbStopnje('Ekstrem')}.className, shramba: localStorage.getItem('sudoku.igra.stopnja') })`);
  preveri('klik »Ekstrem« izbere stopnjo in jo zapomni', izbira.izbrana === 'ekstrem' && izbira.pritisnjen === 'true'
    && izbira.razred.includes('izbrana') && izbira.shramba === 'ekstrem', izbira);
  await b.posnetek(path.join(mapa, `nova-uganka-${sirina}.png`), { vsaStran: false });
  await klikniEl(b, `document.querySelector('#novaDialog [data-zapri], #novaDialog .dialog-zapri')`);

  // Iskanje s pravimi kliki.
  const n = await ustvariEkstrem(b);
  preveri('uganka najdena v delavcu', n.zDelavcem === true && /^[0-9]{81}$/.test(n.danosti), n);
  console.log(`    iskanje: ${n.ms} ms, semen ${n.poskusi}`);
  const D = JSON.stringify(n.danosti);
  const r = await b.izvedi(`(() => { const z = zbirkaBeri().find(z => z.danosti === ${D}); const { board, log } = solve(${D});
    const zn = document.querySelector('#opisUganke .tag');
    return { zaprto: !document.getElementById('novaDialog').classList.contains('odprt'), odprta: igra && igra.danosti === ${D},
      tezavnost: z && z.tezavnost, izvor: z && z.izvor, resitev: countSolutions(${D}), resena: board.isSolved(),
      poskus: log.some(k => /protislovje/.test(k.technique)), veriga: log.some(k => k.technique === 'XY-Chain'),
      ocena: oceniTezavnost(${D}).tezavnost, status: document.getElementById('status').textContent,
      znacka: zn && zn.textContent, razred: zn && zn.className }; })()`);
  preveri('okno zaprto, uganka odprta v igri', r.zaprto && r.odprta, r);
  preveri('v zbirki: težavnost Ekstrem, izvor generator', r.tezavnost === 'Ekstrem' && r.izvor === 'generator', r);
  preveri('natanko ena rešitev (countSolutions)', r.resitev === 1, r.resitev);
  preveri('solve() jo reši brez ugibanja, z XY-verigo', r.resena && !r.poskus && r.veriga, r);
  preveri('ocena (oceniTezavnost) Ekstrem', r.ocena === 'Ekstrem', r.ocena);
  preveri('sporočilo »Ustvarjena uganka stopnje »Ekstrem««', r.status.startsWith('Ustvarjena uganka stopnje »Ekstrem«'), r.status);
  preveri('kartica »Uganka«: značka Ekstrem (t-expert znacka-ekstrem)', r.znacka === 'Ekstrem' && /t-expert/.test(r.razred) && /znacka-ekstrem/.test(r.razred), r);
  preveri('stran brez vodoravnega preliva (igra)', !(await preliv(b)));
  await b.posnetek(path.join(mapa, `igra-ekstrem-${sirina}.png`), { vsaStran: false });

  await odpri();
  preveri('izbrana stopnja ostane po osvežitvi', await b.izvedi(`izbranaStopnja === 'ekstrem' && ${gumbStopnje('Ekstrem')}.classList.contains('izbrana')`));

  // Pomoč igre.
  await klikniEl(b, `document.getElementById('navodilaBtn')`);
  const p = await b.izvedi(`(() => { const t = document.getElementById('navodilaDialog').innerText;
    return { izbere: /izbereš stopnjo \\(lahka, srednja, težka, zelo težka, ekstrem\\)/.test(t),
      zbirka: /svoje stopnje \\(Lahka, Srednja, Težka, Zelo težka ali Ekstrem\\)/.test(t),
      strozje: document.getElementById('stopnjeStrozje').textContent }; })()`);
  preveri('Pomoč: »izbereš stopnjo (… zelo težka, ekstrem)« in »(… Zelo težka ali Ekstrem)«', p.izbere && p.zbirka, p);
  preveri('Pomoč: poved o strožjem generatorju z ekstremno', p.strozje.includes('pri srednji, težki, zelo težki in ekstremni zahteva vsaj dve različni srednji tehniki'), p.strozje);
  return n.danosti;
}

async function resevalec(b, sirina, danosti) {
  console.log(`Reševalec, ${sirina} px`);
  await b.odpri('app/index.html', { sirina, visina: 900, mobilno: sirina < 500 });
  await b.fokus('#nizDanosti');
  await b.vtipkaj(danosti);
  await pocakaj(100);
  const vMrezi = await b.izvedi('currentGivens()');
  preveri('niz vpisan v mrežo', vMrezi === danosti, vMrezi);
  await klikniEl(b, `document.getElementById('solveBtn')`);
  await b.cakaj('!!lastSolve', 20000);
  const r = await b.izvedi(`(() => { const log = lastSolve.log.map(k => k.technique);
    return { resena: lastSolve.grid.join('') === solutionOf('${danosti}').join(''),
      poskus: log.some(t => /protislovje/.test(t)), veriga: log.includes('XY-Chain'), korakov: log.length }; })()`);
  preveri('»Reši«: mreža rešena (= solutionOf), brez poskusa, z XY-verigo', r.resena && !r.poskus && r.veriga, r);
  await klikniEl(b, `document.getElementById('openStepsBtn')`);
  const tag = await b.izvedi(`[...document.querySelectorAll('#steps .tag')].map(t => t.textContent).find(t => t.startsWith('13')) || null`);
  preveri('seznam korakov: oznaka »13 · XY-veriga«', tag === '13 · XY-veriga', tag);
  preveri('brez »Poskus« v seznamu korakov', !(await b.izvedi(`/Poskus in protislovje/.test(document.getElementById('steps').innerText)`)));
  preveri('reševalec: uganka je v zbirki kot Ekstrem', await b.izvedi(`zbirkaBeri().some(z => z.danosti === '${danosti}' && z.tezavnost === 'Ekstrem')`));
  preveri('brez vodoravnega preliva (reševalec)', !(await preliv(b)));
}

(async () => {
  const b = await zazeni();
  fs.mkdirSync(mapa, { recursive: true });
  try {
    console.log('Gumbi stopenj');
    await postavitevGumbov(b, 320, [2, 2, 1]); // tako je bilo že pred popravkom (slog velja od 520 px)
    for (const sirina of [375, 430]) await postavitevGumbov(b, sirina, [3, 2]);
    for (const sirina of [520, 768, 1280]) await postavitevGumbov(b, sirina, [5]);
    for (const sirina of [375, 1280]) {
      const d = await igra(b, sirina);
      await resevalec(b, sirina, d);
    }
    // Čas iskanja (pravi kliki, delavec).
    console.log(`Čas iskanja, 1280 px, ${ISKANJ} iskanj`);
    await b.odpri('igra/index.html', { sirina: 1280, visina: 1000 });
    const casi = [], semena = [];
    for (let i = 0; i < ISKANJ; i++) {
      const n = await ustvariEkstrem(b);
      casi.push(n.ms); semena.push(n.poskusi);
      const ok = await b.izvedi(`countSolutions('${n.danosti}') === 1 && oceniTezavnost('${n.danosti}').tezavnost === 'Ekstrem'`);
      if (!ok || !n.zDelavcem) preveri(`iskanje ${i + 1}: ena rešitev, Ekstrem, delavec`, false, n);
    }
    const urejeni = [...casi].sort((a, b) => a - b);
    const povp = casi.reduce((a, b) => a + b, 0) / casi.length;
    console.log(`    čas: povprečje ${(povp / 1000).toFixed(2)} s, mediana ${(urejeni[Math.floor(urejeni.length / 2)] / 1000).toFixed(2)} s, `
      + `najmanj ${(urejeni[0] / 1000).toFixed(2)} s, največ ${(urejeni[urejeni.length - 1] / 1000).toFixed(2)} s; `
      + `semen povprečno ${(semena.reduce((a, b) => a + b, 0) / semena.length).toFixed(1)}, največ ${Math.max(...semena)}`);
    preveri(`vseh ${ISKANJ} iskanj uspelo v meji 30 s`, casi.length === ISKANJ && urejeni[urejeni.length - 1] < 30000, casi);
    preveri('brez napak JS', b.napake.length === 0, b.napake);
  } finally {
    await b.zapri();
  }
  console.log(napak ? `\n${napak} preverjanj ne drži.` : '\nVse drži.');
  console.log(`Posnetki: ${mapa}`);
  process.exit(napak ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
