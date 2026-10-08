/* ==================== ISKANJE UGANKE V LOČENI NITI ====================
   Web Worker za gumb "Ustvari uganko" v igri: v zanki preizkuša naključna semena
   (ustvariUgankoNaklucno iz ../shared/generator.js), dokler ne najde uganke
   izbrane stopnje ali ne poteče meja. Ker zanka nit zaseda, prekinitev naredi
   igra.js s terminate() - sporočila za ustavitev tu ni.

   Sporočilo vanj:  { stopnja: ključ iz STOPNJE_GENERATORJA ('lahka' … 'ekstrem'), meja: ms }
   Sporočila iz njega:
     { tip: 'napredek', poskusi, ms }  po vsakem semenu
     { tip: 'najdena', danosti, stopnja, seme, poskusi, ms }
     { tip: 'obup', poskusi, ms }      meja je potekla
     { tip: 'napaka', sporocilo } */

// Oznaka različice iz URL delavca (?v=..., igra.js), da tudi skripte motorja niso stare iz predpomnilnika.
const PRIPONA_RAZLICICE = (self.location && self.location.search) || '';
importScripts('../shared/engine.js' + PRIPONA_RAZLICICE, '../shared/generator.js' + PRIPONA_RAZLICICE);

const PRIVZETA_MEJA = 30000;

onmessage = (e) => {
  const stopnja = e.data && e.data.stopnja;
  const meja = (e.data && e.data.meja) || PRIVZETA_MEJA;
  try {
    // Stopnja brez merila iskanja se ne ustvarja.
    if (!STOPNJE_GENERATORJA.includes(stopnjaUganke(stopnja))) throw new Error('Neznana stopnja: ' + stopnja);
    const zacetek = Date.now();
    let poskusi = 0;
    while (Date.now() - zacetek < meja) {
      const u = ustvariUgankoNaklucno(stopnja);
      poskusi++;
      if (u) {
        postMessage({ tip: 'najdena', danosti: u.danosti, stopnja, seme: u.seme, poskusi, ms: Date.now() - zacetek });
        return;
      }
      postMessage({ tip: 'napredek', poskusi, ms: Date.now() - zacetek });
    }
    postMessage({ tip: 'obup', poskusi, ms: Date.now() - zacetek });
  } catch (err) {
    postMessage({ tip: 'napaka', sporocilo: err.message });
  }
};
