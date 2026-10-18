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
//   --korak 2 (skupine in prikaz):
//     - trening: kazalo – dva stolpca (levo skupine Lahka in Srednja, desno Težka in Ekstremna; pri 1280 px drug ob
//       drugem, pri 375 px drug pod drugim), nobena skupina ni razdeljena, naslov skupine z značko nad vrsticami,
//       15 vrstic vsaj 44 px; sedem naslovov skupin, vsak tik nad prvo kartico skupine; pravi klik/dotik vrstice
//       pomakne do kartice (fokus na »Spoznaj«, vaja se ne začne); vrh vaje v »Spoznaj« in »Vadi v uganki«
//       (6 · Skrita trojica) in E1 – vrstica skupine nad imenom tehnike, manjša in siva (izračunan slog);
//     - okno Pomoč v treningu, igri in reševalcu: kazalo iste zgradbe kot v meniju treninga in iste razporeditve,
//       naslovi skupin v seznamu tehnik enaki naslovom nad karticami (pred prvo tehniko skupine), pravi klik/dotik
//       vrstice 9 pomakne do tehnike pod glavo (fokus), »↑ Tehnike« vrne h kazalu (fokus na E1);
//     - povsod brez vodoravnega preliva in brez napak JS; posnetki zaslona za poročilo.
//
//   node tools/preveri-naloga11a-brskalnik.js --korak 1|2 [--mapa <mapa>]
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

// ---------- korak 2: skupine in prikaz ----------

// Skupine iz odločitve 2026-10-18 (docs/uskladitev.md 1.1): levi stolpec Lahka in Srednja, desni Težka in Ekstremna.
const STOLPCA = [['enojcki', 'preseki', 'podmnozice'], ['ribe', 'kratke-verige', 'edinstvenost', 'dolge-verige']];
const NASLOVI = /^(Enojčki \(Singles\) · E1–E2|Preseki \(Intersections\) · 1–2|Podmnožice \(Subsets\) · 3–6|Ribji vzorci \(Fish\) · 7–8|Kratke verige \(Short Chains\) · 9–11|Edinstvenost \(Uniqueness\) · 12|Dolge verige \(Long Chains\) · [\d–]+)$/;
const PENCIL = 'rgb(138, 148, 160)'; // --pencil v shared/base.css

// Zgradba in razporeditev kazala (izbirnik elementa .kazalo-tehnik).
const KAZALO = izb => `(() => { const k = document.querySelector('${izb}'), r = e => e.getBoundingClientRect();
  const zgradba = e => [e.tagName, e.className, e.children.length ? [...e.children].map(zgradba) : e.textContent];
  const st = [...k.children], rs = st.map(r);
  const skupine = st.map(s => [...s.children].map(g => {
    const rg = r(g), rst = r(s);
    return { kljuc: g.dataset.skupina, vStolpcu: rg.left >= rst.left - 0.5 && rg.right <= rst.right + 0.5 && rg.top >= rst.top - 0.5 && rg.bottom <= rst.bottom + 0.5,
      naslov: g.querySelector('.kazalo-naslov').textContent, vrstic: g.querySelectorAll('.kazalo-vrstica').length,
      nadVrsticami: r(g.querySelector('.kazalo-naslov')).bottom <= r(g.querySelector('.kazalo-vrstica')).top + 0.5,
      znacka: getComputedStyle(g.querySelector('.kazalo-tezavnost')).backgroundColor !== 'rgba(0, 0, 0, 0)' };
  }));
  const vrstice = [...k.querySelectorAll('.kazalo-vrstica')];
  return { zgradba: zgradba(k), stolpcev: st.length, razred: st.map(s => s.className), skupine,
    obStrani: rs.length === 2 && Math.abs(rs[0].top - rs[1].top) < 1 && rs[0].right <= rs[1].left,
    podSabo: rs.length === 2 && rs[1].top >= rs[0].bottom - 0.5 && Math.abs(rs[0].left - rs[1].left) < 1,
    vrstic: vrstice.length, nizke: vrstice.filter(v => r(v).height < 43.5).length,
    preliv: k.scrollWidth > k.clientWidth + 1 };
})()`;

function preveriKazalo(k, kje, sirina) {
  preveri(`${kje}: dva stolpca, levo ${STOLPCA[0].length} skupine (Lahka, Srednja), desno ${STOLPCA[1].length} (Težka, Ekstremna)`,
    k.stolpcev === 2 && J(k.skupine.map(s => s.map(g => g.kljuc))) === J(STOLPCA), k.skupine.map(s => s.map(g => g.kljuc)));
  preveri(`${kje}: ${sirina >= 1000 ? 'stolpca drug ob drugem' : 'stolpca drug pod drugim'}`, sirina >= 1000 ? k.obStrani : k.podSabo);
  preveri(`${kje}: nobena skupina ni razdeljena (vsaka cela v svojem stolpcu)`, k.skupine.flat().every(g => g.vStolpcu), k.skupine.flat().filter(g => !g.vStolpcu));
  preveri(`${kje}: naslov skupine z značko nad vrsticami`, k.skupine.flat().every(g => g.nadVrsticami && g.znacka && /\)(LAHKA|SREDNJA|TEŽKA|EKSTREMNA) \(/.test(g.naslov)),
    k.skupine.flat().map(g => g.naslov));
  preveri(`${kje}: 15 vrstic, vsaj 44 px`, k.vrstic === 15 && k.nizke === 0, k);
  preveri(`${kje}: kazalo brez preliva`, !k.preliv);
}

let zgradbaTreninga = null, nasloviTreninga = null;

async function trening2(b, sirina) {
  console.log(`Trening (korak 2), ${sirina} px`);
  const dotik = sirina < 500;
  await b.odpri('trening/index.html', { sirina, visina: 900, mobilno: dotik });
  await b.izvedi('localStorage.removeItem("sudoku.trening.zadnja"); true');
  const k = await b.izvedi(KAZALO('#kazaloTehnik'));
  preveriKazalo(k, 'meni – kazalo', sirina);
  zgradbaTreninga = k.zgradba;
  const n = await b.izvedi(`(() => [...document.querySelectorAll('#menu > h2.skupina-naslov')].map(h => {
    const k = h.nextElementSibling;
    return { besedilo: h.textContent, kartica: k && k.classList.contains('menu-card') ? k.dataset.mode : null,
      nad: k ? h.getBoundingClientRect().bottom <= k.getBoundingClientRect().top : false };
  }))()`);
  const prve = ['naked-single', 'pointing', 'naked-pair', 'x-wing', 'turbot-fish', 'unique-rectangle', 'xy-chain'];
  preveri('meni: sedem naslovov skupin, vsak tik nad prvo kartico skupine', n.length === 7 && J(n.map(x => x.kartica)) === J(prve) && n.every(x => x.nad), n);
  preveri('meni: besedila naslovov »Podmnožice (Subsets) · 3–6« …', n.every(x => NASLOVI.test(x.besedilo)), n.map(x => x.besedilo));
  nasloviTreninga = n.map(x => x.besedilo);
  preveri('brez vodoravnega preliva (meni)', await brezPreliva(b));
  await b.posnetek(path.join(mapa, `trening-${sirina}-kazalo.png`), { vsaStran: false });
  await b.izvedi(`(() => { const h = [...document.querySelectorAll('#menu > h2.skupina-naslov')][2]; scrollTo(0, h.getBoundingClientRect().top + scrollY - 12); return true; })()`);
  await b.posnetek(path.join(mapa, `trening-${sirina}-skupine.png`), { vsaStran: false });

  // Pravi klik / dotik vrstice kazala pomakne do kartice, fokus na »Spoznaj«, vaja se ne začne.
  for (const m of ['hidden-triple', 'turbot-fish']) {
    await b.izvedi('scrollTo(0, 0); true');
    const izb = `#kazaloTehnik [data-kazalo="${m}"]`;
    if (dotik) await b.tapni(izb); else await b.klikni(izb);
    await b.cakaj(`Math.abs(document.querySelector('.menu-card[data-mode="${m}"]').getBoundingClientRect().top - 12) < 2`, 5000).catch(() => {});
    const s = await b.izvedi(`(() => { const k = document.querySelector('.menu-card[data-mode="${m}"]');
      return { vrh: Math.round(k.getBoundingClientRect().top), fokus: document.activeElement === k.querySelector('.nacin-btn'),
        vaja: document.getElementById('trainer').style.display }; })()`);
    preveri(`kazalo: ${dotik ? 'dotik' : 'klik'} ${m} – kartica 12 px pod vrhom, fokus na »Spoznaj«, vaja se ne začne`,
      Math.abs(s.vrh - 12) <= 2 && s.fokus && s.vaja !== 'block', s);
  }

  // Vrh vaje: »Spoznaj« in »Vadi v uganki« (6 · Skrita trojica) in E1.
  const vrh = () => b.izvedi(`(() => { const s = document.querySelector('#exerciseArea .ex-skupina'), l = document.querySelector('#exerciseArea .ex-label');
    if (!s || !l) return null; const cs = getComputedStyle(s), cl = getComputedStyle(l);
    return { skupina: s.textContent, oznaka: l.textContent, manjsa: parseFloat(cs.fontSize) < parseFloat(cl.fontSize), barva: cs.color,
      nad: s.getBoundingClientRect().bottom <= l.getBoundingClientRect().top + 0.5, vKartici: s.closest('.exercise') === l.closest('.exercise') }; })()`);
  const preveriVrh = (v, kje, skupina, oznaka) => preveri(`vrh vaje (${kje}): »${skupina}« nad »${oznaka} …«, manjše, sivo (--pencil)`,
    !!v && v.skupina === skupina && v.oznaka.startsWith(oznaka) && v.manjsa && v.barva === PENCIL && v.nad && v.vKartici, v);
  await b.izvedi('scrollTo(0, 0); true');
  await b.klikni('.menu-card[data-mode="hidden-triple"] .nacin-btn');
  await b.cakaj(`!!document.querySelector('#exerciseArea .ex-label')`);
  preveriVrh(await vrh(), 'Spoznaj', 'Podmnožice (Subsets)', '6 · Skrita trojica (Hidden Triple) · Vaja 1 / 9');
  await b.izvedi('scrollTo(0, 0); true');
  await b.posnetek(path.join(mapa, `trening-${sirina}-vrh-spoznaj.png`), { vsaStran: false });
  await b.klikni('#drugiNacin');
  await b.cakaj(`!!document.querySelector('#exerciseArea .ex-skupina') && !document.querySelector('#exerciseArea .vadi-isce')`, 30000);
  preveriVrh(await vrh(), 'Vadi v uganki', 'Podmnožice (Subsets)', '6 · Skrita trojica (Hidden Triple) · Vadi v uganki · Vaja 1 / 9');
  await b.izvedi('scrollTo(0, 0); true');
  await b.posnetek(path.join(mapa, `trening-${sirina}-vrh-vadi.png`), { vsaStran: false });
  preveri('brez vodoravnega preliva (vaja)', await brezPreliva(b));
  await b.klikni('#backBtn');
  await b.klikni('.menu-card[data-mode="naked-single"] .nacin-btn');
  await b.cakaj(`!!document.querySelector('#exerciseArea .ex-label')`);
  preveriVrh(await vrh(), 'Spoznaj E1', 'Enojčki (Singles)', 'E1 · Očitni enojček (Naked Single) · Vaja 1 / 9');
  await b.klikni('#backBtn');
  await b.izvedi('localStorage.removeItem("sudoku.trening.zadnja"); true');
}

// Okno Pomoč: kazalo iste oblike kot v treningu, klik vrstice, »↑ Tehnike«, naslovi skupin v seznamu tehnik.
async function pomoc2(b, sirina, a) {
  console.log(`${a.ime}: Pomoč (korak 2), ${sirina} px`);
  const dotik = sirina < 500;
  await b.odpri(a.stran, { sirina, visina: 900, mobilno: dotik });
  await b.klikni(a.gumb);
  await b.cakaj(`document.querySelector('${a.okno}').classList.contains('odprt')`);
  const izb = `${a.okno} .kazalo-tehnik`;
  const k = await b.izvedi(KAZALO(izb));
  preveriKazalo(k, `${a.ime}: Pomoč – kazalo`, sirina);
  preveri(`${a.ime}: Pomoč – kazalo iste oblike kot v meniju treninga (razredi, vrstni red, besedila)`, J(k.zgradba) === J(zgradbaTreninga));
  const h = await b.izvedi(`[...document.querySelectorAll('${a.okno} ul.tehnike > li')].map((li, i) => {
    const h = li.querySelector('h4.tehnike-skupina'); return h ? [i, h.textContent, li.firstElementChild === h] : null; }).filter(Boolean)`);
  preveri(`${a.ime}: Pomoč – naslovi skupin v seznamu tehnik enaki naslovom nad karticami, pred prvo tehniko skupine`,
    J(h.map(x => x[1])) === J(nasloviTreninga) && J(h.map(x => x[0])) === J([0, 2, 4, 8, 10, 13, 14]) && h.every(x => x[2]), h);
  preveri(`${a.ime}: Pomoč – okno in stran brez vodoravnega preliva`, await b.izvedi(`(() => { const o = document.querySelector('${a.okno}');
    return o.scrollWidth <= o.clientWidth && document.documentElement.scrollWidth <= document.documentElement.clientWidth; })()`));
  await b.izvedi(`document.querySelector('${izb}').scrollIntoView({ block: 'start' }); true`);
  await b.posnetek(path.join(mapa, `${a.datoteka}-${sirina}-pomoc-kazalo.png`), { vsaStran: false });
  // Klik vrstice 9 → tehnika pod glavo okna, fokus nanjo.
  const vr = `${izb} [data-kazalo="turbot-fish"]`;
  if (dotik) await b.tapni(vr); else await b.klikni(vr);
  const li = `[...document.querySelectorAll('${a.okno} ul.tehnike > li')][10]`;
  await b.cakaj(`(() => { const g = document.querySelector('${a.okno} .dialog-glava').getBoundingClientRect(), t = ${li}.getBoundingClientRect();
    return Math.abs(t.top - g.bottom - 11) < 3; })()`, 5000).catch(() => {});
  const s = await b.izvedi(`(() => { const g = document.querySelector('${a.okno} .dialog-glava').getBoundingClientRect(), el = ${li};
    return { odmik: Math.round(el.getBoundingClientRect().top - g.bottom), fokus: document.activeElement === el, naslov: el.querySelector('h4') && el.querySelector('h4').textContent }; })()`);
  preveri(`${a.ime}: Pomoč – ${dotik ? 'dotik' : 'klik'} vrstice 9 pomakne do tehnike pod glavo (z naslovom skupine), fokus nanjo`,
    s.odmik >= 0 && s.odmik <= 20 && s.fokus && /^Kratke verige/.test(s.naslov || ''), s);
  await b.posnetek(path.join(mapa, `${a.datoteka}-${sirina}-pomoc-skupina.png`), { vsaStran: false });
  // »↑ Tehnike« vrne h kazalu, fokus na prvo vrstico (E1).
  await b.cakaj(`(() => { const g = document.querySelector('${a.okno} .dialog-na-vrh'); return !g.hidden && g.dataset.napis === 'tehnike'; })()`, 5000).catch(() => {});
  const napis = await b.izvedi(`document.querySelector('${a.okno} .dialog-na-vrh').dataset.napis`);
  if (dotik) await b.tapni(`${a.okno} .dialog-na-vrh`); else await b.klikni(`${a.okno} .dialog-na-vrh`);
  await b.cakaj(`(() => { const g = document.querySelector('${a.okno} .dialog-glava').getBoundingClientRect(), k = document.querySelector('${izb}').getBoundingClientRect();
    return Math.abs(k.top - g.bottom) < 20; })()`, 5000).catch(() => {});
  const t = await b.izvedi(`(() => { const g = document.querySelector('${a.okno} .dialog-glava').getBoundingClientRect(), k = document.querySelector('${izb}').getBoundingClientRect();
    return { odmik: Math.round(k.top - g.bottom), fokus: document.activeElement && document.activeElement.dataset.kazalo }; })()`);
  preveri(`${a.ime}: Pomoč – »↑ Tehnike« vrne h kazalu, fokus na E1`, napis === 'tehnike' && t.odmik >= -2 && t.odmik <= 20 && t.fokus === 'naked-single', { napis, ...t });
}

const APLIKACIJE2 = [
  { ime: 'trening', datoteka: 'trening', stran: 'trening/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
  { ime: 'igra', datoteka: 'igra', stran: 'igra/index.html', gumb: '#navodilaBtn', okno: '#navodilaDialog' },
  { ime: 'reševalec', datoteka: 'resevalec', stran: 'app/index.html', gumb: '#pomocBtn', okno: '#pomocDialog' },
];

async function main() {
  if (korak !== '1' && korak !== '2') {
    console.log(`Neznan korak ${korak} (1 ali 2).`);
    process.exit(1);
  }
  const b = await zazeni();
  try {
    for (const sirina of [375, 1280]) {
      if (korak === '1') {
        await trening(b, sirina);
        await resevalec(b, sirina);
        await igra(b, sirina);
      } else {
        await trening2(b, sirina);
        for (const a of APLIKACIJE2) await pomoc2(b, sirina, a);
      }
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
