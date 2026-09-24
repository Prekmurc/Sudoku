/* ==================== OCENA ZBIRKE V LOČENI NITI ====================
   Web Worker za gumb "Oceni zbirko" v oknu "Zbirka ugank": za vsako uganko
   požene razvrstitev (oceniUganko iz ../shared/generator.js) in podatke
   reševanja (zbirkaPodatkiResevanja iz ../shared/zbirka.js). V zbirko NE piše -
   shrambe iz delavca ni; zapis naredi igra.js, ko igralec ocene potrdi.
   Ker zanka nit zaseda, prekinitev naredi igra.js s terminate().

   Sporočilo vanj:  { danosti: ['81 znakov', ...] }
   Sporočila iz njega:
     { tip: 'ocena', i, danosti, tezavnost, resitve, podatki }  po vsaki uganki
     { tip: 'konec', ocenjenih }
     { tip: 'napaka', sporocilo } */

importScripts('../shared/engine.js', '../shared/zbirka.js', '../shared/generator.js');

onmessage = (e) => {
  const seznam = (e.data && e.data.danosti) || [];
  try {
    for (let i = 0; i < seznam.length; i++) {
      postMessage({ tip: 'ocena', i, ...oceniEno(seznam[i]) });
    }
    postMessage({ tip: 'konec', ocenjenih: seznam.length });
  } catch (err) {
    postMessage({ tip: 'napaka', sporocilo: err.message });
  }
};

// Ena uganka: težavnost po stopnjah ("Presega tehnike", kadar motor brez ugibanja
// obtiči, "Brez rešitve"/"Več rešitev" za uganko brez natanko ene rešitve, '' pri
// nepreverjeni enoličnosti - oceniTezavnost v ../shared/generator.js) in podatki reševanja iz istega klica solve() -
// enaki kot jih zapiše reševalec. `resitve` je countSolutions(), da igra lahko
// pove, zakaj uganka ni dobila stopnje.
function oceniEno(danosti) {
  const o = oceniUganko(danosti);
  return { danosti, tezavnost: o.tezavnost, resitve: o.resitve, podatki: zbirkaPodatkiResevanja(o.board, o.log) };
}
