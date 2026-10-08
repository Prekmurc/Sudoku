'use strict';
// Okno Pomoč (shared/pomoc.js, shared/pomoc.css; faza 6, korak c) v pravem brskalniku: igra,
// reševalec in trening pri 375 in 1280 px. Gumb »Pomoč« je v glavi (v vrstici nadnaslova ali tik pod njim) in
// v oknu strani; pravi klik odpre okno, ki pokrije zaslon, panel je v oknu, ni vodoravnega drsnika
// (ne strani ne okna), razdelek »Tehnike« ima 15 tehnik (od vklopa XY-verige) z značko ravni v barvah oznak korakov;
// okno zaprejo pravi klik na ✕, pravi klik ob panelu in tipka Escape; v strani ni napak JS.
// Posnetke zaslona shrani v mapo (--mapa, privzeto začasna).
//
//   node tools/preveri-pomoc-brskalnik.js [--mapa <mapa>]
//
// Izhod 0 = vse drži, 1 = kaj ne drži. Uporablja tools/brskalnik.js (Edge/Chrome).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zazeni } = require('./brskalnik.js');

const args = process.argv.slice(2);
const mapa = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : path.join(os.tmpdir(), 'sudoku-preveri-pomoc');

const APLIKACIJE = [
  { ime: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog' },
  { ime: 'reševalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
  { ime: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
];
const SIRINE = [375, 1280];

let napak = 0;
function preveri(ime, pogoj, podrobno = '') {
  console.log(`${pogoj ? '  ✓' : '  ✗'} ${ime}${!pogoj && podrobno !== '' ? ` - dobljeno: ${JSON.stringify(podrobno)}` : ''}`);
  if (!pogoj) napak++;
}
const pocakaj = (b, ms = 250) => b.izvedi(`new Promise(r => setTimeout(() => r(true), ${ms}))`);
const odprto = (b, okno) => b.izvedi(`document.querySelector(${JSON.stringify(okno)}).classList.contains('odprt')`);

async function aplikacija(b, a, sirina) {
  console.log(`${a.ime}, ${sirina} px`);
  await b.odpri(a.stran, { sirina, visina: 800, mobilno: sirina < 500 });
  await b.cakaj('document.fonts.status === "loaded"', 15000);

  // Gumb v glavi: v isti vrstici kot nadnaslov, v oknu strani.
  const glava = await b.izvedi(`(() => { const g = document.querySelector(${JSON.stringify(a.gumb)}).getBoundingClientRect(),
    n = document.querySelector('header.top .eyebrow').getBoundingClientRect();
    return { gTop: g.top, gBottom: g.bottom, nTop: n.top, nBottom: n.bottom, desno: g.right, sirina: document.documentElement.clientWidth }; })()`);
  // Na ozkem zaslonu se gumbi prelomijo pod nadnaslov (v igri že od faze 5) - ne smejo ga prekriti.
  const vVrstici = glava.gTop < glava.nBottom && glava.nTop < glava.gBottom;
  preveri(`gumb »Pomoč« ${vVrstici ? 'v isti vrstici kot nadnaslov' : 'pod nadnaslovom'} (brez prekrivanja)`,
    vVrstici || (glava.gTop >= glava.nBottom && glava.gTop - glava.nBottom < 20), glava);
  preveri('gumb »Pomoč« v oknu strani', glava.desno <= glava.sirina, glava);

  await b.klikni(a.gumb);
  await pocakaj(b);
  preveri('pravi klik na »Pomoč« odpre okno', await odprto(b, a.okno));
  const m = await b.izvedi(`(() => { const o = document.querySelector(${JSON.stringify(a.okno)}), r = o.getBoundingClientRect(),
    p = o.querySelector('.dialog-panel').getBoundingClientRect(), d = document.documentElement;
    const tehnike = [...o.querySelectorAll('.tehnike li')];
    const sonda = v => { const e = document.createElement('span'); e.style.background = 'var(' + v + ')'; document.body.appendChild(e);
      const c = getComputedStyle(e).backgroundColor; e.remove(); return c; };
    const barve = { 't-single': sonda('--green-bg'), 't-pair': sonda('--amber-bg'), 't-advanced': sonda('--purple-bg'), 't-expert': sonda('--turq-bg') };
    return { okno: [r.left, r.top, r.width, r.height], zaslon: [innerWidth, innerHeight], panel: [p.left, p.right],
      stranPreliv: d.scrollWidth > d.clientWidth, oknoPreliv: o.scrollWidth > o.clientWidth,
      razdelkov: o.querySelectorAll('.navodila-razdelek').length, tehnik: tehnike.length,
      ravni: tehnike.map(li => { const t = li.querySelector('.tehnika-raven'); const k = [...t.classList].find(c => c.startsWith('t-'));
        return { besedilo: t.textContent, ok: getComputedStyle(t).backgroundColor === barve[k] }; }) }; })()`);
  preveri('okno pokrije zaslon', m.okno[0] === 0 && m.okno[1] === 0 && Math.round(m.okno[2]) === m.zaslon[0] && Math.round(m.okno[3]) === m.zaslon[1], m);
  preveri('panel je v oknu (levo in desno)', m.panel[0] >= 0 && m.panel[1] <= m.zaslon[0] + 0.5, m.panel);
  preveri('brez vodoravnega drsnika (stran in okno)', !m.stranPreliv && !m.oknoPreliv, m);
  preveri(`razdelki (${m.razdelkov}) in seznam tehnik (${m.tehnik})`, m.razdelkov >= 4 && m.tehnik === 15, m);
  preveri('značke ravni: E1, E2 lahka, 1–6 srednja, 7–12 napredna, 13 ekspertna, barve oznak korakov',
    m.ravni.map(r => r.besedilo).join(',') === ['lahka', 'lahka', ...Array(6).fill('srednja'), ...Array(6).fill('napredna'), 'ekspertna'].join(',')
      && m.ravni.every(r => r.ok), m.ravni);
  await b.posnetek(path.join(mapa, `${a.ime}-${sirina}-okno.png`), { vsaStran: false });
  await b.izvedi(`document.querySelector(${JSON.stringify(a.okno)} + ' .tehnike').scrollIntoView({ block: 'start' }); true`);
  await pocakaj(b);
  await b.posnetek(path.join(mapa, `${a.ime}-${sirina}-tehnike.png`), { vsaStran: false });

  // Zapiranje: ✕, klik ob panelu, Escape.
  await b.izvedi(`document.querySelector(${JSON.stringify(a.okno)}).scrollTop = 0; true`);
  await b.klikni(`${a.okno} [data-zapri]`);
  await pocakaj(b);
  preveri('pravi klik na ✕ zapre okno', !(await odprto(b, a.okno)));
  await b.klikni(a.gumb);
  await pocakaj(b);
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: 300, button: 'left', clickCount: 1 });
  await b.cdp.poslji('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: 300, button: 'left', clickCount: 1 });
  await pocakaj(b);
  preveri('pravi klik ob panelu zapre okno', !(await odprto(b, a.okno)));
  await b.klikni(a.gumb);
  await pocakaj(b);
  await b.tipka('Escape');
  await pocakaj(b);
  preveri('tipka Escape zapre okno', !(await odprto(b, a.okno)));
}

async function main() {
  fs.mkdirSync(mapa, { recursive: true });
  const b = await zazeni();
  try {
    for (const sirina of SIRINE) for (const a of APLIKACIJE) await aplikacija(b, a, sirina);
  } finally {
    await b.zapri();
  }
  for (const n of b.napake) { console.log(`  ✗ ${n}`); napak++; }
  console.log(napak ? `\nNe drži: ${napak}.` : '\nVse drži.');
  console.log(`Posnetki zaslona: ${mapa}`);
  process.exit(napak ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
