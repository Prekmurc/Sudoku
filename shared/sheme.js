/* shared/sheme.js — shema vzorca pri razlagi tehnik 1–12 (faza 3a, docs/faza3a-nacrt.md):
   splošna risba vzorca s črkami x, y, z (pri W-krilu a, b) namesto števk, v barvah legende
   treninga (celica vzorca jantarna z zlatim okvirjem, celica izbrisa rožnata, kandidat za izbris
   rdeče prečrtan). Podatki SHEME_TEHNIK so po ključu iz TEHNIKE_OPISI (shared/engine.js), izris je
   SVG, ki ga sestavi svgSheme() (niz – deluje tudi v nadomestnem DOM-u testov), izrisiShemo() pa
   vrne element <figure> z risbo, legendo in napisi. Slogi so v shared/pomoc.css (.shema*).
   Brez odvisnosti; v treningu razdelek »Shema« nad mrežo vaje (trening/trening.js). */

// Zapis celice: žetoni, ločeni s presledkom – črka (x, y, z, a, b) ali »…« (drugi kandidati);
// »-« pred žetonom = kandidat za izbris (rdeče prečrtan), »*« na začetku = celica vzorca
// (jantarna z zlatim okvirjem). Celica z izbrisom, ki ni celica vzorca, je rožnata. Prazen niz =
// celica brez črk (vpisana števka ali samo drugi kandidati, ki za vzorec niso pomembni).
// shemaVrstice(): vrstice izseka kot nizi zapisov celic z enim žetonom, ločenih s presledki;
// ».« = prazen niz.
function shemaVrstice(vrstice) {
  return vrstice.flatMap(v => v.trim().split(/\s+/).map(t => t === '.' ? '' : t));
}

// izsek: 'vrstica' (1 × 9), 'pas' (3 × 9) ali 'mreza' (9 × 9); celice so po indeksu v izseku
// (vrstica · 9 + stolpec). vzorec = napis celic vzorca v legendi, opomba = vrstica pod napisom o
// črkah (pri trojicah: celica ima dve ali vse tri črke – popravek po pregledu koraka 1), enako =
// vrstica pod shemo (dodatek 2 – enako velja za stolpec ali blok, pri 1, 2 za stolpec namesto
// vrstice, pri 7, 8 z zamenjanimi vrsticami in stolpci). Pas in mreža sta zapisana po vrsticah
// (shemaVrstice()). Sheme 1, 2, 7 in 8 imajo samo x (druge števke za vzorec niso pomembne); na njih
// lažje tehnike in skriti enojček ne najdejo ničesar, pri 7 in 8 se prazne vrstice, stolpci in
// bloki ujemajo z vpisanimi x (tests/sheme.test.js).
const SHEME_TEHNIK = {
  'pointing': {
    izsek: 'pas',
    celice: shemaVrstice([
      '*x  .  *x  -x  .   .   .   -x  .',
      '.   .   .   x   .   .   .   x   .',
      '.   .   .   .   x   .   x   .   .',
    ]),
    vzorec: 'celice vzorca',
    opomba: 'Vzorec ima dve ali tri celice.',
    enako: 'Enako velja za stolpec namesto vrstice.',
  },
  'box-line': {
    izsek: 'pas',
    celice: shemaVrstice([
      'x   .   .   .   -x  .   .   x   .',
      '.   .   .   *x  *x  *x  .   .   .',
      '.   x   .   -x  .   .   x   .   .',
    ]),
    vzorec: 'celice vzorca',
    opomba: 'Vzorec ima dve ali tri celice.',
    enako: 'Enako velja za stolpec namesto vrstice.',
  },
  'naked-pair': {
    izsek: 'vrstica',
    celice: ['', '*x y', '-x …', '…', '', '-y …', '…', '*x y', '-x -y …'],
    vzorec: 'celici para',
    enako: 'Enako velja za stolpec ali blok.',
  },
  'hidden-pair': {
    izsek: 'vrstica',
    celice: ['…', '*x y -…', '', '…', '…', '*x y -…', '', '…', '…'],
    vzorec: 'celici para',
    enako: 'Enako velja za stolpec ali blok.',
  },
  'naked-triple': {
    izsek: 'vrstica',
    celice: ['-z …', '*x y z', '', '…', '*x y', '-x -y …', '', '*y z', '…'],
    vzorec: 'celice trojice',
    opomba: 'Celica trojice ima dve ali vse tri črke.',
    enako: 'Enako velja za stolpec ali blok.',
  },
  'hidden-triple': {
    izsek: 'vrstica',
    celice: ['…', '*x y z -…', '…', '', '*x y -…', '…', '…', '*y z -…', ''],
    vzorec: 'celice trojice',
    opomba: 'Celica trojice ima dve ali vse tri črke.',
    enako: 'Enako velja za stolpec ali blok.',
  },
  'x-wing': {
    izsek: 'mreza',
    celice: shemaVrstice([
      '.   .   x   .   x   .   -x  .   x',
      '.   *x  .   .   .   .   *x  .   .',
      'x   .   .   .   .   x   .   .   .',
      'x   -x  x   .   .   .   .   .   .',
      '.   .   .   .   .   .   -x  x   .',
      '.   .   .   .   .   .   .   .   .',
      '.   *x  .   .   .   .   *x  .   .',
      'x   .   .   .   .   x   .   x   x',
      '.   -x  .   .   x   .   .   .   .',
    ]),
    vzorec: 'vogali X-krila',
    enako: 'Enako velja z zamenjanimi vrsticami in stolpci.',
  },
  'swordfish': {
    izsek: 'mreza',
    celice: shemaVrstice([
      '.   .   x   .   .   x   .   .   .',
      '.   *x  .   .   *x  .   .   *x  .',
      '.   .   .   .   -x  .   .   .   x',
      '.   .   .   .   .   x   x   .   .',
      '.   *x  .   .   .   .   .   *x  .',
      'x   .   x   x   .   .   .   .   .',
      '.   .   .   .   *x  .   .   *x  .',
      'x   .   .   .   .   .   x   .   .',
      '.   -x  .   x   .   .   .   -x  x',
    ]),
    vzorec: 'celice vzorca',
    opomba: 'V vrstici vzorca je x v dveh ali vseh treh stolpcih.',
    enako: 'Enako velja z zamenjanimi vrsticami in stolpci.',
  },
};

const SHEMA_IZSEKI = { vrstica: [1, 9], pas: [3, 9], mreza: [9, 9] };
const SHEMA_CRKE = ['x', 'y', 'z', 'a', 'b'];

// Celica sheme iz zapisa: { vzorec, izbris (rožnata celica), zetoni: [{ z, izbris }] }.
function shemaCelica(zapis) {
  const vzorec = zapis.startsWith('*');
  const zetoni = (vzorec ? zapis.slice(1) : zapis).split(' ').filter(Boolean)
    .map(t => t.startsWith('-') ? { z: t.slice(1), izbris: true } : { z: t, izbris: false });
  return { vzorec, izbris: !vzorec && zetoni.some(t => t.izbris), zetoni };
}

// Črke, ki so na shemi (po vrstnem redu SHEMA_CRKE), in ali je na njej »…«.
function shemaZnaki(kljuc) {
  const zetoni = SHEME_TEHNIK[kljuc].celice.flatMap(z => shemaCelica(z).zetoni.map(t => t.z));
  return { crke: SHEMA_CRKE.filter(c => zetoni.includes(c)), drugi: zetoni.includes('…') };
}

// »x, y in z«
function shemaNastej(crke) {
  return crke.length < 2 ? crke.join('') : `${crke.slice(0, -1).join(', ')} in ${crke[crke.length - 1]}`;
}

// Napis o črkah (dodatek 1): samo črke, ki so na tej shemi, npr. »x, y – poljubni različni
// števki; … – drugi kandidati; prazna celica – brez x in y.«
function shemaNapisCrk(kljuc) {
  const { crke, drugi } = shemaZnaki(kljuc);
  const kaj = crke.length === 1 ? 'poljubna števka' : crke.length === 2 ? 'poljubni različni števki' : 'poljubne različne števke';
  const deli = [`${crke.join(', ')} – ${kaj}`];
  if (drugi) deli.push('… – drugi kandidati');
  deli.push(`prazna celica – brez ${shemaNastej(crke)}`);
  return deli.join('; ') + '.';
}

// Risba SVG kot niz. Celica je 36 enot, besedilo 13 (pri širini 324 px enako v pikslih).
const SHEMA_CELICA = 36;
function svgSheme(kljuc) {
  const s = SHEME_TEHNIK[kljuc];
  const [V, S] = SHEMA_IZSEKI[s.izsek];
  const C = SHEMA_CELICA, rob = 1.5, fs = 13;
  const sirina = S * C + 2 * rob, visina = V * C + 2 * rob;
  const x0 = c => rob + c * C, y0 = r => rob + r * C;
  const deli = [];
  s.celice.forEach((zapis, i) => {
    const cel = shemaCelica(zapis);
    const r = Math.floor(i / S), c = i % S;
    if (cel.vzorec) {
      deli.push(`<rect class="sh-vzorec" x="${x0(c) + 1.75}" y="${y0(r) + 1.75}" width="${C - 3.5}" height="${C - 3.5}"/>`);
    } else if (cel.izbris) {
      deli.push(`<rect class="sh-izbris" x="${x0(c)}" y="${y0(r)}" width="${C}" height="${C}"/>`);
    }
    // Črke v vrsti, vsaka sredinsko na svojem mestu (širina ne zavisi od pisave); »…« pod njimi
    // (ali na sredini celice, če črk ni) kot tri pike – znak »…« bi bil premajhen za prečrtanje.
    const crke = cel.zetoni.filter(t => t.z !== '…'), drugi = cel.zetoni.find(t => t.z === '…');
    const cx = x0(c) + C / 2, cy = y0(r) + C / 2;
    const yc = drugi && crke.length ? cy - 5 : cy, yd = crke.length ? cy + 8 : cy;
    // Korak med črkami: 11,5 enote, pri treh črkah 10,5 – sicer bi zunanji črki segli v zlati
    // okvir celice vzorca (velikost črk ostane 13).
    const n = crke.length, korak = n > 2 ? 10.5 : 11.5;
    crke.forEach((t, k) => {
      const x = cx - ((n - 1) * korak) / 2 + k * korak;
      deli.push(`<text class="sh-crka${t.izbris ? ' sh-precrtan' : ''}" x="${x}" y="${yc + fs * 0.27}">${t.z}</text>`);
      if (t.izbris) deli.push(`<line class="sh-crta-izbris" x1="${x - 5.5}" y1="${yc}" x2="${x + 5.5}" y2="${yc}"/>`);
    });
    if (drugi) {
      deli.push(`<g class="sh-drugi${drugi.izbris ? ' sh-precrtan' : ''}">${[-4.5, 0, 4.5].map(d => `<circle cx="${cx + d}" cy="${yd}" r="1.4"/>`).join('')}</g>`);
      if (drugi.izbris) deli.push(`<line class="sh-crta-izbris" x1="${cx - 7.5}" y1="${yd}" x2="${cx + 7.5}" y2="${yd}"/>`);
    }
  });
  // Mrežne črte: tanke med celicami, debele na mejah blokov in okoli izseka.
  for (let c = 1; c < S; c++) if (c % 3) deli.push(`<line class="sh-tanka" x1="${x0(c)}" y1="${rob}" x2="${x0(c)}" y2="${y0(V)}"/>`);
  for (let r = 1; r < V; r++) if (r % 3) deli.push(`<line class="sh-tanka" x1="${rob}" y1="${y0(r)}" x2="${x0(S)}" y2="${y0(r)}"/>`);
  for (let c = 3; c < S; c += 3) deli.push(`<line class="sh-debela" x1="${x0(c)}" y1="${rob}" x2="${x0(c)}" y2="${y0(V)}"/>`);
  for (let r = 3; r < V; r += 3) deli.push(`<line class="sh-debela" x1="${rob}" y1="${y0(r)}" x2="${x0(S)}" y2="${y0(r)}"/>`);
  deli.push(`<rect class="sh-okvir" x="${rob}" y="${rob}" width="${S * C}" height="${V * C}"/>`);
  const ime = TEHNIKE_OPISI[kljuc] ? TEHNIKE_OPISI[kljuc].ime : kljuc;
  return `<svg class="shema-risba" viewBox="0 0 ${sirina} ${visina}" style="max-width:${sirina}px" role="img" aria-label="Shema vzorca: ${ime}">${deli.join('')}</svg>`;
}

// Element <figure class="shema">: risba, legenda (celice vzorca, celica izbrisa – samo, če je na
// shemi rožnata celica –, kandidat za izbris), napis o črkah, opomba in vrstica »enako velja« –
// ali null, če tehnika sheme nima (E1, E2).
function izrisiShemo(kljuc) {
  const s = SHEME_TEHNIK[kljuc];
  if (!s) return null;
  const el = (tag, razred, besedilo) => {
    const e = document.createElement(tag);
    if (razred) e.className = razred;
    if (besedilo != null) e.textContent = besedilo;
    return e;
  };
  const fig = el('figure', 'shema');
  fig.dataset.tehnika = kljuc;
  const risba = el('div', 'shema-okvir');
  risba.innerHTML = svgSheme(kljuc);
  fig.appendChild(risba);
  const leg = el('div', 'shema-legenda');
  const v = el('span');
  v.append(el('span', 'shema-sw shema-sw-vzorec'), s.vzorec);
  leg.appendChild(v);
  if (s.celice.some(z => shemaCelica(z).izbris)) {
    const c = el('span');
    c.append(el('span', 'shema-sw shema-sw-izbris'), 'celica izbrisa');
    leg.appendChild(c);
  }
  // Vzorček izbrisa je prvi prečrtani žeton na shemi (pri skritih »…«).
  const prvi = s.celice.flatMap(z => shemaCelica(z).zetoni).find(t => t.izbris);
  if (prvi) {
    const iz = el('span');
    if (prvi.z === '…') {
      // Pike kot na risbi (znak »…« je premajhen za prečrtanje).
      const sw = el('span', 'shema-izbris-drugi');
      sw.innerHTML = '<svg viewBox="0 0 17 14" aria-hidden="true"><g class="sh-drugi sh-precrtan"><circle cx="4" cy="7" r="1.4"/>'
        + '<circle cx="8.5" cy="7" r="1.4"/><circle cx="13" cy="7" r="1.4"/></g><line class="sh-crta-izbris" x1="1" y1="7" x2="16" y2="7"/></svg>';
      iz.append(sw, 'drugi kandidati za izbris');
    } else {
      iz.append(el('span', 'shema-izbris', prvi.z), 'kandidat za izbris');
    }
    leg.appendChild(iz);
  }
  fig.appendChild(leg);
  fig.appendChild(el('p', 'shema-crke', shemaNapisCrk(kljuc)));
  if (s.opomba) fig.appendChild(el('p', 'shema-opomba', s.opomba));
  if (s.enako) fig.appendChild(el('p', 'shema-enako', s.enako));
  return fig;
}
