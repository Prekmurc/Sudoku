'use strict';
// Pomožna datoteka testov tests/xy-chain.test.js in tests/pocasni/xy-chain-uganke.test.js:
// NEODVISNO iskanje XY-verig po pravilu iz docs/xy-veriga-nacrt.md (razdelka 1 in 2), brez
// kode motorja - vse preproste poti po celicah z dvema kandidatoma, razširjene po plasteh.
// Vrne [{ cells: ['V5S4', ...], eliminate: ['V5S3≠3', ...] }] (L = cellLabel).
const vrsta = c => Math.floor(c / 9), stolp = c => c % 9;
const blok = c => Math.floor(vrsta(c) / 3) * 3 + Math.floor(stolp(c) / 3);
const vidita = (a, c) => a !== c && (vrsta(a) === vrsta(c) || stolp(a) === stolp(c) || blok(a) === blok(c));

// Vse verige z najmanj..najvec celicami: za vsak par koncev in števko z ena (najkrajša,
// pri enaki dolžini leksikografsko najmanjše zaporedje), zapisana od konca z nižjim
// položajem; samo verige z izbrisom; urejene po pravilu O3.
function verigeNeodvisno(b, najmanj, najvec, L) {
  const kand = c => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => b.cand[c] & (1 << d));
  const dva = [];
  for (let c = 0; c < 81; c++) if (b.grid[c] === 0 && kand(c).length === 2) dva.push(c);
  const druga = (c, d) => kand(c).find(x => x !== d);
  // Delna veriga: celice, števka z prve celice in števka, ki jo mora imeti naslednja celica.
  let plast = [];
  for (const c of dva) for (const z of kand(c)) plast.push({ celice: [c], z, izhod: druga(c, z) });
  const koncane = [];
  for (let dolzina = 2; dolzina <= najvec; dolzina++) {
    const nova = [];
    for (const p of plast) {
      for (const c of dva) {
        if (p.celice.includes(c) || !vidita(p.celice[p.celice.length - 1], c) || !kand(c).includes(p.izhod)) continue;
        const q = { celice: [...p.celice, c], z: p.z, izhod: druga(c, p.izhod) };
        nova.push(q);
        if (dolzina >= najmanj && q.izhod === q.z) koncane.push(q);
      }
    }
    plast = nova;
  }
  const izbrane = new Map();
  for (const q of koncane) {
    const celice = q.celice[0] < q.celice[q.celice.length - 1] ? q.celice : [...q.celice].reverse();
    const kljuc = `${q.z}|${celice[0]}|${celice[celice.length - 1]}`;
    const prej = izbrane.get(kljuc);
    const prvaRazlika = prej ? celice.findIndex((c, i) => c !== prej.celice[i]) : -1;
    const krajsa = !prej || celice.length < prej.celice.length
      || (celice.length === prej.celice.length && prvaRazlika >= 0 && celice[prvaRazlika] < prej.celice[prvaRazlika]);
    if (krajsa) izbrane.set(kljuc, { celice, z: q.z });
  }
  const out = [];
  for (const { celice, z } of izbrane.values()) {
    const a = celice[0], n = celice[celice.length - 1];
    const izbris = [];
    for (let x = 0; x < 81; x++) {
      if (x !== a && x !== n && b.grid[x] === 0 && (b.cand[x] & (1 << z)) && vidita(x, a) && vidita(x, n)) izbris.push(x);
    }
    if (izbris.length) out.push({ celice, z, izbris });
  }
  out.sort((p, q) => p.celice.length - q.celice.length || q.izbris.length - p.izbris.length
    || p.celice[0] - q.celice[0] || p.z - q.z || p.celice[p.celice.length - 1] - q.celice[q.celice.length - 1]);
  return out.map(v => ({ cells: v.celice.map(L), eliminate: v.izbris.map(x => `${L(x)}≠${v.z}`) }));
}

module.exports = { verigeNeodvisno };
