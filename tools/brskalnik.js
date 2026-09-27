'use strict';
// Brskalnik brez glave (Microsoft Edge ali Google Chrome) za preverjanje aplikacij v
// PRAVEM brskalniku - s CSS, postavitvijo in pravimi dogodki, česar nadomestni DOM
// (tests/dom-stub.js) ne zna. Brez odvisnosti: vgrajen statični strežnik HTTP iz
// korena projekta (vse tri aplikacije na istem izvoru, zato si delijo localStorage)
// in krmiljenje prek protokola DevTools z vgrajenim WebSocket (Node 22+).
//
// Knjižnica:
//   const { zazeni } = require('./brskalnik.js');
//   const b = await zazeni();                          // strežnik + brskalnik (prazen profil)
//   const s = await zazeni({ koren: 'mapa' });         // streže drugo mapo (npr. star commit)
//   await b.odpri('app/index.html', { sirina: 375 });  // pot od korena projekta
//   await b.izvedi('currentGivens()');                 // izraz v strani (tudi let/const skript)
//   await b.fokus('#nizDanosti'); await b.vtipkaj('8....1...');  // kot tipkovnica
//   await b.klikni('#solveBtn');                       // pravi klik miške na sredino elementa
//   await b.tipka('Enter');                            // ena tipka
//   await b.cakaj('document.getElementById("status").className === "ok"');
//   await b.posnetek('izhod.png');                     // vsa stran
//   b.napake                                           // napake JS in console.error v strani
//   await b.zapri();
//
// Ukazna vrstica:
//   node tools/brskalnik.js posnetek <stran> <izhod.png> [--sirina 1200] [--visina 900] [--koren mapa]
//   npr. node tools/brskalnik.js posnetek app/index.html app.png --sirina 375
//
// Brskalnik se poišče na običajnih mestih v Windows; drugo pot poda spremenljivka
// okolja EDGE_POT. Vsak zagon ima nov, prazen profil (prazen localStorage).

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const KOREN = path.join(__dirname, '..');

const KANDIDATI = [
  process.env.EDGE_POT,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium',
];

function potBrskalnika() {
  const p = KANDIDATI.find(k => k && fs.existsSync(k));
  if (!p) throw new Error('Brskalnika (Edge/Chrome) ni - nastavi EDGE_POT na pot do msedge.exe ali chrome.exe.');
  return p;
}

const VRSTE = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// Statični strežnik iz korena projekta (ali druge mape) na naključnih vratih (samo 127.0.0.1).
function streznik(koren) {
  const s = http.createServer((req, res) => {
    const pot = path.normalize(path.join(koren, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!pot.startsWith(koren)) { res.writeHead(403).end(); return; }
    fs.readFile(pot, (err, vsebina) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': VRSTE[path.extname(pot)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(vsebina);
    });
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok(s)));
}

const pocakaj = ms => new Promise(r => setTimeout(r, ms));

// Brskalnik z --remote-debugging-port=0 zapiše vrata v DevToolsActivePort v profilu.
async function vrataDevTools(profil, proces) {
  const f = path.join(profil, 'DevToolsActivePort');
  for (let i = 0; i < 300; i++) {
    // msedge.exe lahko pravi brskalnik zažene kot podproces in se sam konča s kodo 0.
    if (proces.exitCode) throw new Error(`Brskalnik se je končal (koda ${proces.exitCode}).`);
    try {
      const [vrata] = fs.readFileSync(f, 'utf8').split(/\r?\n/);
      if (vrata) return Number(vrata);
    } catch { /* datoteke še ni ali jo brskalnik ravno piše (EBUSY) */ }
    await pocakaj(50);
  }
  throw new Error('Brskalnik ni odprl vrat DevTools v 15 s.');
}

// Ustavi vse procese brskalnika s tem profilom (msedge.exe se lahko loči od procesa,
// ki ga je zagnal Node, zato proces.kill() ne zadošča) in pobriše profil.
function ustaviBrskalnik(profil, proces) {
  try { proces.kill(); } catch { /* že končan */ }
  if (process.platform === 'win32') {
    const ukaz = `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' or Name='chrome.exe'" | `
      + `Where-Object { $_.CommandLine -like '*${path.basename(profil)}*' } | `
      + 'ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }';
    spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ukaz], { stdio: 'ignore' });
  }
  for (let i = 0; i < 10; i++) {
    try { fs.rmSync(profil, { recursive: true, force: true }); return; } catch { spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},200)']); }
  }
}

// Najmanjši odjemalec protokola DevTools: ukazi z id-jem, dogodki poslušalcem.
function odjemalec(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const cakajo = new Map();
  const poslusalci = [];
  ws.onmessage = (m) => {
    const s = JSON.parse(m.data);
    if (s.id && cakajo.has(s.id)) {
      const { ok, ne } = cakajo.get(s.id);
      cakajo.delete(s.id);
      if (s.error) ne(new Error(`${s.error.message} (${s.error.code})`)); else ok(s.result);
    } else if (s.method) {
      for (const f of [...poslusalci]) f(s);
    }
  };
  return {
    odprt: new Promise((ok, ne) => { ws.onopen = ok; ws.onerror = () => ne(new Error('Povezava DevTools ni uspela.')); }),
    poslji(metoda, parametri = {}) {
      return new Promise((ok, ne) => {
        const i = ++id;
        cakajo.set(i, { ok, ne });
        ws.send(JSON.stringify({ id: i, method: metoda, params: parametri }));
      });
    },
    // Naslednji dogodek z danim imenom.
    dogodek(metoda) {
      return new Promise(ok => {
        const f = (s) => { if (s.method === metoda) { poslusalci.splice(poslusalci.indexOf(f), 1); ok(s.params); } };
        poslusalci.push(f);
      });
    },
    naDogodek(f) { poslusalci.push(f); },
    zapri() { try { ws.close(); } catch { /* že zaprto */ } },
  };
}

// `koren`: mapa, iz katere strežnik streže (privzeto koren projekta; npr. izvleček
// starejšega commita za primerjavo z `git archive`).
async function zazeni({ koren = KOREN } = {}) {
  const srv = await streznik(path.resolve(koren));
  const osnova = `http://127.0.0.1:${srv.address().port}/`;
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'sudoku-brskalnik-'));
  const proces = spawn(potBrskalnika(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0',
    `--user-data-dir=${profil}`, 'about:blank',
  ], { stdio: 'ignore' });
  let ustavljen = false;
  const ustavi = () => { if (!ustavljen) { ustavljen = true; ustaviBrskalnik(profil, proces); } };
  process.once('exit', ustavi); // tudi ob napaki v skripti brskalnik ne ostane

  let cdp;
  try {
    const vrata = await vrataDevTools(profil, proces);
    const cilji = await (await fetch(`http://127.0.0.1:${vrata}/json/list`)).json();
    const stran = cilji.find(c => c.type === 'page');
    if (!stran) throw new Error('Brskalnik nima odprte strani.');
    cdp = odjemalec(stran.webSocketDebuggerUrl);
    await cdp.odprt;
  } catch (e) {
    ustavi();
    srv.close();
    throw e;
  }

  const napake = [];
  cdp.naDogodek(s => {
    if (s.method === 'Runtime.exceptionThrown') {
      const d = s.params.exceptionDetails;
      napake.push(`napaka JS: ${(d.exception && d.exception.description) || d.text} (${d.url || ''}:${d.lineNumber + 1})`);
    } else if (s.method === 'Runtime.consoleAPICalled' && s.params.type === 'error') {
      napake.push('console.error: ' + s.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' '));
    }
  });
  await cdp.poslji('Page.enable');
  await cdp.poslji('Runtime.enable');

  const b = {
    osnova,
    napake,
    cdp,

    // Odpre stran (pot od korena projekta) v oknu dane velikosti; `mobilno` vklopi
    // posnemanje telefona (dotik, meta viewport).
    async odpri(pot, { sirina = 1200, visina = 900, mobilno = false } = {}) {
      await cdp.poslji('Emulation.setDeviceMetricsOverride', { width: sirina, height: visina, deviceScaleFactor: 1, mobile: mobilno });
      await cdp.poslji('Emulation.setTouchEmulationEnabled', { enabled: mobilno });
      const nalozeno = cdp.dogodek('Page.loadEventFired');
      await cdp.poslji('Page.navigate', { url: osnova + pot });
      await nalozeno;
      await b.izvedi('document.fonts ? document.fonts.ready.then(() => true) : true');
    },

    // Izraz v strani; vrne vrednost (JSON). Napaka v izrazu vrže napako.
    async izvedi(izraz) {
      const r = await cdp.poslji('Runtime.evaluate', { expression: izraz, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(`V strani: ${(d.exception && d.exception.description) || d.text}`);
      }
      return r.result.value;
    },

    // Čaka, da je izraz resničen (privzeto največ 10 s).
    async cakaj(izraz, ms = 10000) {
      const konec = Date.now() + ms;
      while (Date.now() < konec) {
        if (await b.izvedi(`!!(${izraz})`)) return;
        await pocakaj(50);
      }
      throw new Error(`Ni izpolnjeno v ${ms} ms: ${izraz}`);
    },

    async fokus(izbirnik) {
      await b.izvedi(`(() => { const el = document.querySelector(${JSON.stringify(izbirnik)}); if (!el) throw new Error('ni elementa ${izbirnik.replace(/'/g, '')}'); el.focus(); el.select && el.select(); })()`);
    },

    // Besedilo v element s fokusom, kot tipkovnica ali lepljenje (en dogodek input);
    // označeno besedilo (fokus() ga označi) se zamenja.
    async vtipkaj(besedilo) {
      await cdp.poslji('Input.insertText', { text: besedilo });
    },

    // Ena tipka (npr. 'Enter', 'Escape', 'Backspace', 'ArrowRight', '5').
    async tipka(key) {
      const kode = { Enter: 13, Escape: 27, Backspace: 8, Tab: 9, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
      const vk = kode[key] || key.toUpperCase().charCodeAt(0);
      const osnovno = { key, windowsVirtualKeyCode: vk, code: /^\d$/.test(key) ? `Digit${key}` : key };
      await cdp.poslji('Input.dispatchKeyEvent', { type: key.length === 1 ? 'keyDown' : 'rawKeyDown', text: key.length === 1 ? key : undefined, ...osnovno });
      await cdp.poslji('Input.dispatchKeyEvent', { type: 'keyUp', ...osnovno });
    },

    // Pravi klik miške na sredino elementa (element se prej pomakne v pogled).
    async klikni(izbirnik) {
      const t = await b.izvedi(`(() => {
        const el = document.querySelector(${JSON.stringify(izbirnik)});
        if (!el) return null;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      if (!t) throw new Error(`Ni elementa ${izbirnik}.`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.poslji('Input.dispatchMouseEvent', { type, x: t.x, y: t.y, button: 'left', clickCount: 1 });
      }
    },

    // Posnetek vse strani v PNG; z { vsaStran: false } samo vidni del - za odprta
    // okna s fiksnim položajem (ta bi posnetek vse strani prerezal pri višini okna).
    async posnetek(pot, { vsaStran = true } = {}) {
      let parametri = { format: 'png' };
      if (vsaStran) {
        const m = await cdp.poslji('Page.getLayoutMetrics');
        const v = m.cssContentSize || m.contentSize;
        parametri = { ...parametri, captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(v.width), height: Math.ceil(v.height), scale: 1 } };
      }
      const r = await cdp.poslji('Page.captureScreenshot', parametri);
      fs.mkdirSync(path.dirname(path.resolve(pot)), { recursive: true });
      fs.writeFileSync(pot, Buffer.from(r.data, 'base64'));
    },

    async zapri() {
      try { await cdp.poslji('Browser.close'); } catch { /* ukaz je lahko zaprl povezavo */ }
      cdp.zapri();
      srv.close();
      await pocakaj(300); // Browser.close zapre brskalnik; kar ostane, ustavi ustavi()
      ustavi();
    },
  };
  return b;
}

async function main() {
  const args = process.argv.slice(2);
  const opcija = (ime, privzeto) => { const i = args.indexOf(ime); return i >= 0 ? Number(args[i + 1]) : privzeto; };
  if (args[0] !== 'posnetek' || !args[1] || !args[2]) {
    console.error('Uporaba: node tools/brskalnik.js posnetek <stran> <izhod.png> [--sirina 1200] [--visina 900] [--koren mapa]');
    process.exit(2);
  }
  const k = args.indexOf('--koren');
  const b = await zazeni(k >= 0 ? { koren: args[k + 1] } : {});
  try {
    await b.odpri(args[1], { sirina: opcija('--sirina', 1200), visina: opcija('--visina', 900) });
    await b.posnetek(args[2]);
    console.log(`Posnetek: ${args[2]}`);
    for (const n of b.napake) console.log(n);
  } finally {
    await b.zapri();
  }
  process.exit(b.napake.length ? 1 : 0);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { zazeni };
