'use strict';
// Pomožni funkciji testov »Spoznaj«: odpri in zapri »Namig« ali »Rešitev« (kaj = 'namig' ali
// 'resitev'). Od koraka 1 načrta docs/trening-ucenje-nacrt.md sta gumba stikali – klik odpre
// (napis »Namig« / »Rešitev«), drugi klik zapre (napis »Skrij namig« / »Skrij rešitev«); prej sta
// bila »Namig (drži)« / »Rešitev (drži)« (pritisk in spust).
const NAPIS = { namig: 'Namig', resitev: 'Rešitev' };
const SKRIJ = { namig: 'Skrij namig', resitev: 'Skrij rešitev' };

function vsi(el, out = []) {
  for (const c of el.children || []) { out.push(c); vsi(c, out); }
  return out;
}
function gumb(dom, napis) {
  const g = vsi(dom.el('exerciseArea')).find(e => e.tagName === 'BUTTON' && e.textContent === napis);
  if (!g) throw new Error(`gumb "${napis}"`);
  return g;
}

const odpriPomoc = (dom, kaj) => gumb(dom, NAPIS[kaj]).sprozi('click');
const zapriPomoc = (dom, kaj) => gumb(dom, SKRIJ[kaj]).sprozi('click');
// f() med odprto pomočjo; nato se zapre.
function medPomocjo(dom, kaj, f) {
  odpriPomoc(dom, kaj);
  try { return f(); } finally { zapriPomoc(dom, kaj); }
}

module.exports = { odpriPomoc, zapriPomoc, medPomocjo };
