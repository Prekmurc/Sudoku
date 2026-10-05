// Oznaka različice pri nalaganju skript in slogov (?v=...), da brskalnik po objavi sam
// naloži nove datoteke namesto starih iz predpomnilnika.
//
//   node tools/oznaci-razlicico.js
//
// Izračuna zgoščeno vrednost (SHA-256) vsebine datotek aplikacije (app/, igra/, trening/,
// shared/; brez samih oznak ?v= in z enotnimi prelomi vrstic) in jo primerja s shranjeno v
// razlicica.json. Samo če se je vrednost spremenila, dobi aplikacija novo oznako (datum in ura,
// npr. 2026-10-05.1432) – commit, ki spremeni samo docs/ ali tests/, je ne spremeni. Nato
// oznako zapiše na vse lokalne <script src> in <link rel="stylesheet"> v treh index.html
// (delavce in njihove importScripts označi igra.js oziroma delavec sam iz svojega ?v=).
// Kliče ga pre-commit hook (tools/hooks/pre-commit); varovalo je tests/razlicica.test.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KOREN = path.join(__dirname, '..');
const MAPE = ['app', 'igra', 'trening', 'shared'];
const STRANI = ['app/index.html', 'igra/index.html', 'trening/index.html'];
const ZAPIS = 'razlicica.json';
const UKAZ = 'node tools/oznaci-razlicico.js';
const OZNAKA_RE = /\?v=\d{4}-\d{2}-\d{2}\.\d{4}[a-z]?/g;

function datotekeAplikacije() {
  const izid = [];
  const obisci = (rel) => {
    for (const e of fs.readdirSync(path.join(KOREN, rel), { withFileTypes: true })) {
      const p = rel + '/' + e.name;
      if (e.isDirectory()) obisci(p);
      else izid.push(p);
    }
  };
  for (const m of MAPE) obisci(m);
  return izid.sort();
}

function zgoscena() {
  const h = crypto.createHash('sha256');
  for (const p of datotekeAplikacije()) {
    const vsebina = fs.readFileSync(path.join(KOREN, p), 'utf8').replace(/\r\n/g, '\n').replace(OZNAKA_RE, '');
    h.update(p + '\0' + vsebina + '\0');
  }
  return h.digest('hex');
}

// Lokalne skripte in slogi strani: [{ cel, pot, oznaka }] (oznaka brez »?v=« ali null).
function povezave(html) {
  const izid = [];
  const re = /<script src="([^"]+)"|<link rel="stylesheet" href="([^"]+)"/g;
  for (const m of html.matchAll(re)) {
    const url = m[1] || m[2];
    if (/^(https?:)?\/\//.test(url)) continue;
    const [pot, poizvedba] = url.split('?');
    const o = poizvedba && /^v=(.+)$/.exec(poizvedba);
    izid.push({ url, pot, oznaka: o ? o[1] : null });
  }
  return izid;
}

function oznaciStran(html, oznaka) {
  return html.replace(/(<script src="|<link rel="stylesheet" href=")([^"?]+)(\?v=[^"]*)?"/g,
    (cel, zac, pot) => (/^(https?:)?\/\//.test(pot) ? cel : `${zac}${pot}?v=${oznaka}"`));
}

function beriZapis() {
  try { return JSON.parse(fs.readFileSync(path.join(KOREN, ZAPIS), 'utf8')); } catch (e) { return null; }
}

function novaOznaka(prejsnja) {
  const d = new Date();
  const dv = (n) => String(n).padStart(2, '0');
  let o = `${d.getFullYear()}-${dv(d.getMonth() + 1)}-${dv(d.getDate())}.${dv(d.getHours())}${dv(d.getMinutes())}`;
  // Dve spremembi v isti minuti: oznaka se mora vseeno razlikovati.
  if (prejsnja && prejsnja.startsWith(o)) {
    const crka = prejsnja.length > o.length ? prejsnja.slice(-1) : 'a';
    o += String.fromCharCode(crka.charCodeAt(0) + 1);
  }
  return o;
}

function main() {
  const z = zgoscena();
  const prej = beriZapis();
  const spremenjena = !prej || prej.zgoscena !== z;
  const oznaka = spremenjena ? novaOznaka(prej && prej.oznaka) : prej.oznaka;
  let strani = 0;
  for (const s of STRANI) {
    const f = path.join(KOREN, s);
    const html = fs.readFileSync(f, 'utf8');
    const nov = oznaciStran(html, oznaka);
    if (nov !== html) { fs.writeFileSync(f, nov); strani++; }
  }
  if (spremenjena) fs.writeFileSync(path.join(KOREN, ZAPIS), JSON.stringify({ oznaka, zgoscena: z }, null, 2) + '\n');
  console.log(spremenjena ? `Nova oznaka različice: ${oznaka}` : `Oznaka različice ostane: ${oznaka}`);
  if (strani) console.log(`Oznaka zapisana v ${strani} index.html.`);
}

module.exports = { zgoscena, povezave, beriZapis, STRANI, ZAPIS, UKAZ, KOREN };

if (require.main === module) main();
