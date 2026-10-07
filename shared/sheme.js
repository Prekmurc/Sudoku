/* shared/sheme.js — shema vzorca pri razlagi tehnik 1–12 (faza 3a, docs/faza3a-nacrt.md):
   splošna risba vzorca s črkami x, y, z (pri W-krilu a, b) namesto števk, v barvah legende
   treninga (celica vzorca jantarna z zlatim okvirjem, celica izbrisa rožnata, kandidat za izbris
   temen z rdečo črto čez). Podatki SHEME_TEHNIK so po ključu iz TEHNIKE_OPISI (shared/engine.js), izris je
   SVG, ki ga sestavi svgSheme() (niz – deluje tudi v nadomestnem DOM-u testov), izrisiShemo() pa
   vrne element <figure> z risbo, legendo in napisi. Slogi so v shared/pomoc.css (.shema*).
   Brez odvisnosti; v treningu razdelek »Shema« nad mrežo vaje (trening/trening.js). */

// Zapis celice: žetoni, ločeni s presledkom – črka (x, y, z, a, b) ali »…« (drugi kandidati);
// »-« pred žetonom = kandidat za izbris (rdeče prečrtan), »*« na začetku = celica vzorca
// (jantarna z zlatim okvirjem), »+« na začetku = celica vzorca druge vrste (bledo jantarna s
// črtkanim zlatim okvirjem – pri W-krilu celici povezave, pri XY-krilu pivot; popravek po pregledu
// koraka 3). Celica z izbrisom, ki ni celica vzorca, je rožnata. Prazen niz =
// celica brez črk (vpisana števka ali samo drugi kandidati, ki za vzorec niso pomembni).
// shemaVrstice(): vrstice izseka kot nizi zapisov celic, ločenih s presledki; žetoni v celici so
// ločeni z vejico (»*x,y« = »*x y«), ».« = prazen niz.
function shemaVrstice(vrstice) {
  return vrstice.flatMap(v => v.trim().split(/\s+/).map(t => t === '.' ? '' : t.replace(/,/g, ' ')));
}

// izsek: 'vrstica' (1 × 9), 'pas' (3 × 9) ali 'mreza' (9 × 9); celice so po indeksu v izseku
// (vrstica · 9 + stolpec). vzorec = napis celic vzorca v legendi, opomba = vrstica pod napisom o
// črkah (pri trojicah: celica ima dve ali vse tri črke – popravek po pregledu koraka 1), enako =
// vrstica pod shemo (dodatek 2 – enako velja za stolpec ali blok, pri 1, 2 za stolpec namesto
// vrstice, pri 7, 8 z zamenjanimi vrsticami in stolpci). Pas in mreža sta zapisana po vrsticah
// (shemaVrstice()). Sheme 1, 2, 7 in 8 imajo samo x (druge števke za vzorec niso pomembne); na njih
// lažje tehnike in skriti enojček ne najdejo ničesar, pri 7 in 8 se prazne vrstice, stolpci in
// bloki ujemajo z vpisanimi x (tests/sheme.test.js).
// Korak 3 (9–12, 9 × 9): risbe = več risb (pri 9 Nebotičnik in Zmaj z dvema vrvicama, vsaka z
// naslovom in svojimi celicami), povezave / vidita / vidi = črte med celicami (SHEMA_POVEZAVE),
// drugiVVzorcu = celice vzorca imajo natanko narisane kandidate, drugi kandidati drugod niso
// narisani (10–12; napis o črkah to pove). Dodatne črke so poiskane z iskanjem kot pri 7 in 8: na
// deski iz sheme tehnika najde natanko ta korak, lažje tehnike nič, prazne enote se ujemajo z
// vpisanimi črkami, črte ne gredo čez celice s črkami.
// Popravek po pregledu koraka 3: vzorec2 = napis celic vzorca druge vrste (»+«) v legendi – pri
// W-krilu »celici povezave« (prej s celicama para skupaj »celici para in povezave«), pri XY-krilu
// »pivot« (prej »pivot in krili«); sklep = vrstica s sklepom pod legendo (W-krilo).
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
  'turbot-fish': {
    izsek: 'mreza',
    risbe: [
      {
        naslov: 'Nebotičnik (Skyscraper)',
        celice: shemaVrstice([
          '.   .   .   .   x   .   .   .   x',
          '.   *x  .   x   .   .   .   .   .',
          '.   .   -x  .   .   .   *x  x   .',
          'x   .   .   .   .   x   .   x   .',
          '.   .   .   x   .   .   .   x   .',
          '.   .   x   .   .   .   .   x   x',
          'x   .   x   .   .   x   .   .   .',
          '.   *x  .   .   .   .   *x  .   .',
          'x   .   .   .   x   .   .   x   .',
        ]),
        povezave: ['V2S2 V8S2', 'V3S7 V8S7'],
        vidita: ['V8S2 V8S7'],
        vidi: ['V3S3 V2S2', 'V3S3 V3S7'],
      },
      {
        naslov: 'Zmaj z dvema vrvicama (2-String Kite)',
        celice: shemaVrstice([
          '.   .   .   x   .   .   .   .   x',
          '.   .   *x  .   .   .   .   *x  .',
          '.   *x  .   .   x   .   .   .   .',
          '.   .   x   .   .   .   x   .   .',
          'x   .   .   x   .   .   .   .   x',
          'x   .   .   .   x   x   .   .   .',
          '.   .   .   .   .   x   x   .   .',
          '.   *x  .   .   .   .   .   -x  x',
          'x   .   .   x   .   .   x   x   .',
        ]),
        povezave: ['V2S3 V2S8', 'V3S2 V8S2'],
        vidita: ['V2S3 V3S2'],
        vidi: ['V8S8 V2S8', 'V8S8 V8S2'],
      },
    ],
    vzorec: 'konca povezav',
    opomba: 'Nebotičnik je lahko tudi iz dveh vrstic, zmaj tudi drugače obrnjen.',
  },
  'w-wing': {
    izsek: 'mreza',
    celice: shemaVrstice([
      '.    a     .    .    b    a    b    .     .',
      '.    *a,b  .    .    .    .    .    -a    a,b',
      'b    .     .    a,b  .    .    a    .     b',
      'a    .     b    .    .    a,b  a    .     b',
      '.    .     .    .    a,b  .    b    *a,b  .',
      'b    .     a    .    .    b    a    .     .',
      '.    .     a,b  b    a    .    .    .     .',
      'a    +b,…  .    .    .    .    .    +b,…  a',
      '.    .     .    a    .    a,b  a,b  .     .',
    ]),
    povezave: ['V8S2 V8S8'],
    vidita: ['V2S2 V8S2', 'V8S8 V5S8'],
    vidi: ['V2S8 V2S2', 'V2S8 V5S8'],
    vzorec: 'celici para',
    vzorec2: 'celici povezave',
    sklep: 'Vsaj ena celica para je a, zato a izbrišeš iz celic, ki vidijo obe.',
    opomba: 'Povezava je lahko tudi stolpec ali blok.',
    drugiVVzorcu: true,
  },
  'xy-wing': {
    izsek: 'mreza',
    celice: shemaVrstice([
      '.    z     x,z    y    x,y  z    y      .    .',
      'z    +x,y  .      .    .    .    *x,z   z    y',
      'y    .     .      .    x,z  x,y  .      x    z',
      'y,z  .     .      x    .    .    .      x,y  x,z',
      '.    .     x,y,z  z    y    .    .      x,z  .',
      'x    .     z      .    x,z  y    .      .    x,y',
      'x    *y,z  .      .    .    .    -z     y    x',
      'z    x     y      z    y    x    y      z    .',
      '.    y     .      x,y  .    z    x,y,z  .    .',
    ]),
    vidita: ['V2S2 V2S7', 'V2S2 V7S2'],
    vidi: ['V7S7 V2S7', 'V7S7 V7S2'],
    vzorec: 'krili',
    vzorec2: 'pivot',
    opomba: 'Krilo je lahko s pivotom tudi v istem bloku.',
    drugiVVzorcu: true,
  },
  'unique-rectangle': {
    izsek: 'mreza',
    celice: shemaVrstice([
      '.    .     .    y    y    .         y    x    x',
      '.    *x,y  .    .    .    *x,y      .    .    .',
      '.    *x,y  .    .    .    *-x,-y,…  .    y    .',
      'x    .     y    .    x,y  .         .    .    y',
      'y    .     x    .    y    .         x    .    .',
      '.    .     .    x,y  .    .         y    .    x',
      'x,y  .     x    y    x    .         x    y    .',
      '.    .     x,y  x    .    y         .    .    .',
      'x    .     y    .    .    .         .    x    y',
    ]),
    vzorec: 'vogali pravokotnika',
    opomba: 'Bloka sta lahko tudi eden nad drugim.',
    drugiVVzorcu: true,
  },
};

const SHEMA_IZSEKI = { vrstica: [1, 9], pas: [3, 9], mreza: [9, 9] };
const SHEMA_CRKE = ['x', 'y', 'z', 'a', 'b'];

// Celica sheme iz zapisa: { vzorec, vzorec2 (druga vrsta, »+«), izbris (rožnata celica),
// zetoni: [{ z, izbris }] }.
function shemaCelica(zapis) {
  const vzorec2 = zapis.startsWith('+'), vzorec = vzorec2 || zapis.startsWith('*');
  const zetoni = (vzorec ? zapis.slice(1) : zapis).split(' ').filter(Boolean)
    .map(t => t.startsWith('-') ? { z: t.slice(1), izbris: true } : { z: t, izbris: false });
  return { vzorec, vzorec2, izbris: !vzorec && zetoni.some(t => t.izbris), zetoni };
}

// Risbe sheme: pri 9 dve (risbe), sicer ena – shema sama.
function shemaRisbe(kljuc) {
  const s = SHEME_TEHNIK[kljuc];
  return s.risbe || [s];
}

// Črke, ki so na shemi (po vrstnem redu SHEMA_CRKE), in ali je na njej »…«.
function shemaZnaki(kljuc) {
  const zetoni = shemaRisbe(kljuc).flatMap(r => r.celice).flatMap(z => shemaCelica(z).zetoni.map(t => t.z));
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
  // Sheme 10–12: celice vzorca imajo natanko narisane kandidate, drugod drugi niso narisani.
  return deli.join('; ') + '.' + (SHEME_TEHNIK[kljuc].drugiVVzorcu ? ' Drugi kandidati so narisani samo v celicah vzorca.' : '');
}

// Povezave (sheme 9–11): pari celic »V2S2 V8S2« v treh vrstah – povezava (polna jantarna črta,
// vrstica ali stolpec, kjer je števka mogoča samo v teh dveh celicah), vidita (črtkana jantarna,
// celici vzorca se vidita) in vidi (črtkana rdeča, od celice izbrisa do celice vzorca, ki jo vidi).
const SHEMA_POVEZAVE = [
  ['povezave', 'sh-povezava', 'povezava'],
  ['vidita', 'sh-vidita', 'celici se vidita'],
  ['vidi', 'sh-vidi', 'celica izbrisa vidi'],
];
// Črta se začne in konča SHEMA_ODMIK enot od središča celice – ne prekrije črk.
const SHEMA_ODMIK = 12;

// Risba SVG kot niz (n = številka risbe, pri 9 sta dve). Celica je 36 enot, besedilo 13 (pri
// širini 324 px enako v pikslih). Vrstni red: podlage celic, mrežne črte, povezave, črke.
const SHEMA_CELICA = 36;
function svgSheme(kljuc, n = 0) {
  const s = SHEME_TEHNIK[kljuc], risba = shemaRisbe(kljuc)[n];
  const [V, S] = SHEMA_IZSEKI[s.izsek];
  const C = SHEMA_CELICA, rob = 1.5, fs = 13;
  const sirina = S * C + 2 * rob, visina = V * C + 2 * rob;
  const x0 = c => rob + c * C, y0 = r => rob + r * C;
  const podlage = [], deli = [];
  risba.celice.forEach((zapis, i) => {
    const cel = shemaCelica(zapis);
    const r = Math.floor(i / S), c = i % S;
    if (cel.vzorec) {
      podlage.push(`<rect class="sh-vzorec${cel.vzorec2 ? ' sh-vzorec2' : ''}" x="${x0(c) + 1.75}" y="${y0(r) + 1.75}" width="${C - 3.5}" height="${C - 3.5}"/>`);
    } else if (cel.izbris) {
      podlage.push(`<rect class="sh-izbris" x="${x0(c)}" y="${y0(r)}" width="${C}" height="${C}"/>`);
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
      // Črta je daljša od črke (črka temna, črta rdeča – popravek po pregledu koraka 2); pri več
      // črkah krajša, da se črti sosednjih prečrtanih črk ne zlijeta.
      const pol = n > 1 ? korak / 2 - 1.5 : 6;
      if (t.izbris) deli.push(`<line class="sh-crta-izbris" x1="${x - pol}" y1="${yc}" x2="${x + pol}" y2="${yc}"/>`);
    });
    if (drugi) {
      deli.push(`<g class="sh-drugi${drugi.izbris ? ' sh-precrtan' : ''}">${[-4.5, 0, 4.5].map(d => `<circle cx="${cx + d}" cy="${yd}" r="1.4"/>`).join('')}</g>`);
      if (drugi.izbris) deli.push(`<line class="sh-crta-izbris" x1="${cx - 7.5}" y1="${yd}" x2="${cx + 7.5}" y2="${yd}"/>`);
    }
  });
  // Mrežne črte: tanke med celicami, debele na mejah blokov in okoli izseka.
  const mreza = [];
  for (let c = 1; c < S; c++) if (c % 3) mreza.push(`<line class="sh-tanka" x1="${x0(c)}" y1="${rob}" x2="${x0(c)}" y2="${y0(V)}"/>`);
  for (let r = 1; r < V; r++) if (r % 3) mreza.push(`<line class="sh-tanka" x1="${rob}" y1="${y0(r)}" x2="${x0(S)}" y2="${y0(r)}"/>`);
  for (let c = 3; c < S; c += 3) mreza.push(`<line class="sh-debela" x1="${x0(c)}" y1="${rob}" x2="${x0(c)}" y2="${y0(V)}"/>`);
  for (let r = 3; r < V; r += 3) mreza.push(`<line class="sh-debela" x1="${rob}" y1="${y0(r)}" x2="${x0(S)}" y2="${y0(r)}"/>`);
  // Povezave od središča do središča celice, skrajšane za SHEMA_ODMIK na obeh koncih.
  const sredisce = oznaka => { const [, r, c] = oznaka.match(/^V(\d)S(\d)$/); return [x0(c - 1) + C / 2, y0(r - 1) + C / 2]; };
  const okrogli = v => Math.round(v * 100) / 100;
  const crte = [];
  for (const [polje, razred] of SHEMA_POVEZAVE) {
    for (const par of risba[polje] || []) {
      const [[ax, ay], [bx, by]] = par.split(' ').map(sredisce);
      const k = SHEMA_ODMIK / Math.hypot(bx - ax, by - ay);
      crte.push(`<line class="${razred}" x1="${okrogli(ax + (bx - ax) * k)}" y1="${okrogli(ay + (by - ay) * k)}" x2="${okrogli(bx - (bx - ax) * k)}" y2="${okrogli(by - (by - ay) * k)}"/>`);
    }
  }
  const okvir = `<rect class="sh-okvir" x="${rob}" y="${rob}" width="${S * C}" height="${V * C}"/>`;
  const ime = (TEHNIKE_OPISI[kljuc] ? TEHNIKE_OPISI[kljuc].ime : kljuc) + (risba.naslov ? ` – ${risba.naslov}` : '');
  return `<svg class="shema-risba" viewBox="0 0 ${sirina} ${visina}" style="max-width:${sirina}px" role="img" aria-label="Shema vzorca: ${ime}">${[...podlage, ...mreza, ...crte, ...deli, okvir].join('')}</svg>`;
}

// Element <figure class="shema">: risba (pri 9 dve, vsaka z naslovom nad njo), legenda (celice
// vzorca, celice vzorca druge vrste – samo, če so na shemi –, celica izbrisa – samo, če je na shemi rožnata celica –, kandidat za izbris, vrste povezav,
// ki so na shemi), sklep (W-krilo), napis o črkah, opomba in vrstica »enako velja« – ali null, če tehnika sheme
// nima (E1, E2).
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
  const risbe = shemaRisbe(kljuc);
  risbe.forEach((r, n) => {
    if (r.naslov) fig.appendChild(el('p', 'shema-naslov', r.naslov));
    const risba = el('div', 'shema-okvir');
    risba.innerHTML = svgSheme(kljuc, n);
    fig.appendChild(risba);
  });
  const celice = risbe.flatMap(r => r.celice);
  const leg = el('div', 'shema-legenda');
  const v = el('span');
  v.append(el('span', 'shema-sw shema-sw-vzorec'), s.vzorec);
  leg.appendChild(v);
  if (s.vzorec2 && celice.some(z => shemaCelica(z).vzorec2)) {
    const v2 = el('span');
    v2.append(el('span', 'shema-sw shema-sw-vzorec2'), s.vzorec2);
    leg.appendChild(v2);
  }
  if (celice.some(z => shemaCelica(z).izbris)) {
    const c = el('span');
    c.append(el('span', 'shema-sw shema-sw-izbris'), 'celica izbrisa');
    leg.appendChild(c);
  }
  // Vzorček izbrisa je prvi prečrtani žeton na shemi (pri skritih »…«).
  const prvi = celice.flatMap(z => shemaCelica(z).zetoni).find(t => t.izbris);
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
  // Vrste povezav, ki so na shemi – vzorček je kratka črta v istem slogu.
  for (const [polje, razred, napis] of SHEMA_POVEZAVE) {
    if (!risbe.some(r => (r[polje] || []).length)) continue;
    const p = el('span');
    const sw = el('span', 'shema-sw-crta');
    sw.innerHTML = `<svg viewBox="0 0 24 14" aria-hidden="true"><line class="${razred}" x1="2" y1="7" x2="22" y2="7"/></svg>`;
    p.append(sw, napis);
    leg.appendChild(p);
  }
  fig.appendChild(leg);
  if (s.sklep) fig.appendChild(el('p', 'shema-sklep', s.sklep));
  fig.appendChild(el('p', 'shema-crke', shemaNapisCrk(kljuc)));
  if (s.opomba) fig.appendChild(el('p', 'shema-opomba', s.opomba));
  if (s.enako) fig.appendChild(el('p', 'shema-enako', s.enako));
  return fig;
}
