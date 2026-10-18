'use strict';
// Najmanjši nadomestni DOM za teste UI (igra/igra.js, app/zbirka.js). Ni brskalnik:
// podpira samo to, kar ti datoteki res uporabita - iskanje in ustvarjanje elementov, razrede, besedilo,
// dogodke (klik sprožimo s klikni()), localStorage (tudi dogodek "storage" iz drugega
// zavihka - drugZavihek()), confirm in spremenljivke CSS.
// Namenjen je preverjanju LOGIKE prikaza (kaj je onemogočeno, kaj piše v vrstici z
// razlogom), ne postavitve ali slogov.

function makeClassList(el) {
  const seznam = () => el.className.split(/\s+/).filter(Boolean);
  const zapisi = (a) => { el.className = a.join(' '); };
  return {
    add: (...c) => zapisi([...new Set([...seznam(), ...c])]),
    remove: (...c) => zapisi(seznam().filter(x => !c.includes(x))),
    toggle: (c, f) => {
      const ima = seznam().includes(c);
      const naj = f === undefined ? !ima : !!f;
      if (naj) zapisi([...new Set([...seznam(), c])]); else zapisi(seznam().filter(x => x !== c));
      return naj;
    },
    contains: (c) => seznam().includes(c),
  };
}

// Tekstovno vozlišče (append z nizom): brez razredov, otrok in podatkov - da pomožne funkcije
// testov, ki hodijo po drevesu, ne padejo na njem.
class Besedilo {
  constructor(s) { this.textContent = String(s); this.className = ''; this.children = []; this.dataset = {}; }
  get classList() { return makeClassList(this); }
}

class Element {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attrs = {};
    this.poslusalci = {};
    this.className = '';
    this.disabled = false;
    this.hidden = false;
    this.checked = false;
    this.value = '';
    this.title = '';
    this.type = '';
    this.files = [];
    this.lastna = '';
    this.html = '';
    this.style = {
      vrednosti: {},
      setProperty(k, v) { this.vrednosti[k] = v; },
      removeProperty(k) { delete this.vrednosti[k]; },
      getPropertyValue(k) { return this.vrednosti[k] || ''; },
    };
  }
  get classList() { return makeClassList(this); }
  get textContent() { return this.lastna + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this.lastna = String(v); this.children = []; }
  get innerHTML() { return this.html; }
  set innerHTML(v) { this.html = String(v); this.children = []; this.lastna = ''; }
  // Element, ki je že otrok, se premakne na konec (kot v brskalniku – trening preuredi kartice menija).
  appendChild(el) {
    const i = this.children.indexOf(el);
    if (i >= 0) this.children.splice(i, 1);
    this.children.push(el);
    return el;
  }
  append(...kosi) { for (const k of kosi) this.children.push(k instanceof Element ? k : new Besedilo(k)); }
  prepend(el) { this.children.unshift(el); }
  insertBefore(el, ref) {
    const i = this.children.indexOf(ref);
    if (i < 0) this.children.push(el); else this.children.splice(i, 0, el);
    return el;
  }
  remove() { /* v testih ni starša */ }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(tip, f) { (this.poslusalci[tip] = this.poslusalci[tip] || []).push(f); }
  removeEventListener(tip, f) {
    this.poslusalci[tip] = (this.poslusalci[tip] || []).filter(x => x !== f);
  }
  // Disabled gumb v brskalniku dogodka click ne sproži - tu je enako.
  sprozi(tip, dogodek = {}) {
    if (this.disabled && tip === 'click') return;
    for (const f of this.poslusalci[tip] || []) f({ preventDefault() {}, stopPropagation() {}, target: this, ...dogodek });
  }
  // el.click() sproži dogodek click (kot v brskalniku): skrito polje za izbiro datoteke
  // (»Uvozi«) in povezava za prenos (zbirkaPrenesi()). Izbirnika datotek ni - test
  // nastavi `files` in sproži "change".
  click() { this.sprozi('click'); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  focus() {}
  scrollIntoView() {}
  get firstChild() { return this.children[0] || null; }
}

// Vrne globalne vrednosti za vm kontekst (loadContext v load-engine.js) in
// pripomočke za test: el(id) da element po id, klikni(el) sproži klik.
// `shramba` je Map za localStorage: če jo podaš (dom.shramba prejšnjega okolja),
// nov DOM dobi isto hrambo - tako test simulira ponovno nalaganje strani (F5).
// Poslušalec na document ali window; z možnostjo capture (true ali { capture: true }) v fazi zajema.
function dodajPoslusalca(vozlisce, tip, f, moznosti) {
  (vozlisce.poslusalci[tip] = vozlisce.poslusalci[tip] || []).push(f);
  if (moznosti === true || (moznosti && moznosti.capture)) vozlisce.zajem.add(f);
}

function makeDom(shramba = new Map()) {
  const poId = new Map();
  const documentElement = new Element('html');

  const document = {
    documentElement,
    body: new Element('body'),
    poslusalci: {},
    getElementById(id) {
      if (!poId.has(id)) {
        const el = new Element('div');
        el.id = id;
        poId.set(id, el);
      }
      return poId.get(id);
    },
    createElement(tag) { return new Element(tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    zajem: new Set(),
    addEventListener(tip, f, moznosti) { dodajPoslusalca(this, tip, f, moznosti); },
    // Dogodek gre skozi faze kot v brskalniku (razposlji spodaj).
    sprozi(tip, dogodek = {}) { razposlji(tip, dogodek); },
  };

  // window: poslušalci (dogodek "storage" ob zapisu v drugem zavihku) in položaj strani
  // (scrollY, scrollTo - vrnitev v meni treninga; tudi scrollTo({ top }) - gumb »↑«), višina okna
  // (innerHeight - gumb »↑« v meniju treninga). Dogodka "scroll" scrollTo ne sproži (test: sprozi('scroll')).
  const window = {
    poslusalci: {},
    scrollY: 0,
    innerHeight: 667,
    scrollTo(x, y) { this.scrollY = x && typeof x === 'object' ? (x.top === undefined ? this.scrollY : x.top) : y; },
    zajem: new Set(),
    addEventListener(tip, f, moznosti) { dodajPoslusalca(this, tip, f, moznosti); },
    sprozi(tip, dogodek = {}) { for (const f of this.poslusalci[tip] || []) f(dogodek); },
  };

  // Dogodek na document (tipka - keydown z elementa v strani): kot v brskalniku najprej faza
  // zajema - poslušalci window, nato document z možnostjo capture -, nato faza mehurčka - document,
  // nato window. stopImmediatePropagation() ustavi vse naslednje poslušalce, stopPropagation()
  // poslušalce naslednjih vozlišč (naloga 6, korak 3: Escape najprej zapre povečan prikaz v reševalcu).
  function razposlji(tip, dogodek) {
    let ustavi = false, takoj = false;
    const e = {
      preventDefault() {}, target: null, ...dogodek,
      stopPropagation() { ustavi = true; },
      stopImmediatePropagation() { ustavi = takoj = true; },
    };
    for (const [vozlisce, zajem] of [[window, true], [document, true], [document, false], [window, false]]) {
      for (const f of (vozlisce.poslusalci[tip] || []).slice()) {
        if (vozlisce.zajem.has(f) !== zajem) continue;
        f(e);
        if (takoj) return;
      }
      if (ustavi) return;
    }
  }

  const globals = {
    document,
    window,
    localStorage: {
      getItem: k => (shramba.has(k) ? shramba.get(k) : null),
      setItem: (k, v) => shramba.set(k, String(v)),
      removeItem: k => shramba.delete(k),
    },
    getComputedStyle: () => ({ getPropertyValue: () => '#F6C026' }),
    // Privzeto potrdimo (test lahko zamenja: dom.odgovori = false).
    confirm: () => vprasanja.odgovor,
    alert: () => {},
    setTimeout, clearTimeout, setInterval, clearInterval,
    console,
    HTMLElement: Element,
    HTMLInputElement: Element,
    HTMLTextAreaElement: Element,
    Worker: function Worker() { throw new Error('Worker v testu ni na voljo'); },
    FileReader: function FileReader() {},
    Blob: function Blob() {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
  };

  const vprasanja = { odgovor: true };

  return {
    globals,
    document,
    shramba,
    el: id => document.getElementById(id),
    klikni: (id) => document.getElementById(id).sprozi('click'),
    tipka: (dogodek) => document.sprozi('keydown', dogodek),
    // Drug zavihek zapiše vrednost v skupno hrambo: brskalnik v TEM zavihku sproži
    // dogodek "storage" (s staro in novo vrednostjo), v zavihku, ki je pisal, pa ne.
    drugZavihek(kljuc, vrednost) {
      const oldValue = shramba.has(kljuc) ? shramba.get(kljuc) : null;
      if (vrednost === null) shramba.delete(kljuc); else shramba.set(kljuc, String(vrednost));
      this.obvesti(kljuc, oldValue);
    },
    // Samo dogodek: v skupno hrambo je že pisal drug zavihek (drug kontekst z isto
    // `shramba`), `oldValue` je vrednost pred tem.
    obvesti(kljuc, oldValue) {
      window.sprozi('storage', { key: kljuc, oldValue, newValue: shramba.has(kljuc) ? shramba.get(kljuc) : null });
    },
    // Kaj vrne confirm() (gumb "Začni znova").
    potrdi(v) { vprasanja.odgovor = v; },
  };
}

// Iskanje po drevesu za element, ki ga test zgradi sam (npr. okno Pomoč iz index.html – naloga 4c,
// korak 3): querySelector/querySelectorAll s preprostimi izbirniki »oznaka.razred.razred[atribut]«
// (brez presledkov in vejic). Samo na izbranih elementih – drugi testi ostanejo pri null / [].
function ustrezaIzbirniku(e, izbirnik) {
  const m = /^([a-z0-9]*)((?:\.[\w-]+)*)(?:\[([\w-]+)\])?$/i.exec(izbirnik);
  if (!m || !(e instanceof Element)) return false;
  const [, oznaka, razredi, atribut] = m;
  if (oznaka && e.tagName !== oznaka.toUpperCase()) return false;
  if (razredi && !razredi.slice(1).split('.').every(c => e.classList.contains(c))) return false;
  if (atribut && e.getAttribute(atribut) === null) return false;
  return true;
}
function omogociIskanje(el) {
  const vsi = (k, izb, out = []) => {
    for (const c of k.children || []) { if (ustrezaIzbirniku(c, izb)) out.push(c); vsi(c, izb, out); }
    return out;
  };
  el.querySelectorAll = izb => vsi(el, izb);
  el.querySelector = izb => vsi(el, izb)[0] || null;
  return el;
}

module.exports = { makeDom, Element, omogociIskanje };
