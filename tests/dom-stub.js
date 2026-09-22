'use strict';
// Najmanjši nadomestni DOM za teste UI (igra/igra.js, app/zbirka.js). Ni brskalnik:
// podpira samo to, kar ti datoteki res uporabita - iskanje in ustvarjanje elementov, razrede, besedilo,
// dogodke (klik sprožimo s klikni()), localStorage, confirm in spremenljivke CSS.
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

class Besedilo {
  constructor(s) { this.textContent = String(s); }
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
  appendChild(el) { this.children.push(el); return el; }
  append(...kosi) { for (const k of kosi) this.children.push(k instanceof Element ? k : new Besedilo(k)); }
  prepend(el) { this.children.unshift(el); }
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
    addEventListener(tip, f) { (this.poslusalci[tip] = this.poslusalci[tip] || []).push(f); },
    sprozi(tip, dogodek = {}) {
      for (const f of this.poslusalci[tip] || []) f({ preventDefault() {}, stopPropagation() {}, target: null, ...dogodek });
    },
  };

  const globals = {
    document,
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
    // Kaj vrne confirm() (gumb "Začni znova").
    potrdi(v) { vprasanja.odgovor = v; },
  };
}

module.exports = { makeDom, Element };
