/* trening/trening.js — UI/tok vadbe: izbira tehnike, izris vaje, preverjanje odgovorov, rezultat.
   Potrebuje trening/generators.js (MODES + gen* funkcije), naložen pred to datoteko. */

const MAX_EX=9;

/* ========== UI ========== */

// nacin: 'spoznaj' (sestavljene vaje) ali 'uganka' (»Vadi v uganki«, trening/v-uganki.js).
let mode=null,nacin='spoznaj',exNum=0,selected=[],pickedDigits=[],scoreRight=0,scoreTotal=0;
// Pomoč (Namig ali Rešitev - vsak ogled, tudi kratek): vaja s pomočjo se ne šteje nikamor,
// ne med pravilne ne med napačne - že šteti poskusi te vaje se ob ogledu odštejejo.
// Ogled po pravilnem odgovoru ne spremeni ničesar (vaja je končana).
let pomocVaje=false,vajaResena=false,vajaPrav=0,vajaVseh=0,sPomocjo=0,stetoObPreveri=false;
// Delna mreža vaj 1 in 2 (buildPresekLayout) ali null.
let presek=null;
// Namig in Rešitev v »Spoznaj« (stikali, renderExercise): osveziPomoc() ob spremembi izbire,
// preveriSPomocjo(f) za »Preveri« - nastavi ju vsaka vaja.
let osveziPomoc=()=>{},preveriSPomocjo=f=>f();
// Plošča vaje E1/E2 (buildSingleLayout) ali null; kljukici "več hkrati" in "senči" ostaneta
// med vajami kroga.
let enojcek=null,vecHkratiKrog=false,senciKrog=false;
const menuEl=document.getElementById('menu'),trainerEl=document.getElementById('trainer'),area=document.getElementById('exerciseArea');

// Barve poudarka števke so iz nastavitev igre (samo branje, shared/plosca.js) - veljajo
// za vse mreže iz shared/mreza.js (E1, E2, 1, 2).
const POUD_KLJUC_IGRE='sudoku.igra.poud';
uporabiBarvePoudarka(barvePoudarkaIzNastavitev(POUD_KLJUC_IGRE));

// Tipkovnica pri vajah E1/E2 (plošča): števka izbere števko za vpis, puščice premikajo
// izbiro po celicah, ki jih je mogoče izbrati, Escape izbiro počisti.
// Pri »Vadi v uganki« tipke obdela plošča vaje (1-12: Shift+števka, puščice, Escape, Ctrl+Z/Y;
// E1/E2: števka postavi predlog, Backspace/Delete ga pobriše, puščice, Escape).
// Okno Pomoč (shared/pomoc.js, faza 6): ko je odprto, tipke ne gredo v ploščo (Escape ga zapre).
const oknoPomoc=ustvariPomoc(document.getElementById('pomocDialog'),[document.getElementById('pomocBtn')]);
izrisiTehnike(document.getElementById('pomocTehnike'));
document.addEventListener('keydown',e=>{if(oknoPomoc.odprto())return;if(enojcek&&mode)enojcek.plosca.obTipki(e);else if(vadi&&mode)vadi.plosca.obTipki(e);});

// Vrstni red, oznake in naslovi kartic iz TRENING_ENOJCKA (E1, E2) in TRENING_TEHNIKE
// (1-12) v shared/engine.js - iste številke igra izpisuje pri ugankah ("tehnike: 1, 3,
// 7"), ime da imeTehnike(). Vrstni red kartic v HTML ni pomemben, naslov v HTML je samo
// nadomestek (tests/trening-tehnike.test.js preveri, da je enak imeTehnike()). Opis na
// kartici je povzetek tehnike iz TEHNIKE_OPISI (faza 6) - tudi v HTML je nadomestek, prav tako
// značka ravni iz ravenTehnike() (faza 7, točka 1.1 - nova tehnika potrebuje samo vnos ravni).
// TEHNIKA_VAJE: način vaje (data-mode) -> ključ tehnike v ALL_TECHNIQUES.
const TEHNIKA_VAJE=Object.fromEntries([...TRENING_ENOJCKA,...TRENING_TEHNIKE]);
[...TRENING_ENOJCKA,...TRENING_TEHNIKE].forEach(([m,t])=>{
  const card=menuEl.querySelector(`.menu-card[data-mode="${m}"]`);
  if(!card)return;
  const h3=card.querySelector('h3');
  h3.textContent=imeTehnike(t);
  h3.dataset.stevilka=oznakaTehnike(m);
  const p=card.querySelector('p');
  if(p) p.textContent=TEHNIKE_OPISI[m].povzetek;
  const znacka=card.querySelector('.badge'),raven=ravenTehnike(t);
  if(znacka){znacka.className=`badge badge-${raven}`;znacka.textContent=raven.toUpperCase();}
  menuEl.appendChild(card);
});

// Razdelek "Razlaga" pod nalogo (»Spoznaj« in »Vadi v uganki«, faza 6): razlaga in posledica
// tehnike. Privzeto zaprt; odprt ali zaprt ostane med vajami kroga (razlagaKrog). Ogled ne
// šteje kot pomoč - splošna razlaga ne pove odgovora vaje.
let razlagaKrog=false;
function razdelekRazlaga(m){
  const o=TEHNIKE_OPISI[m];
  const d=document.createElement('details');d.className='razlaga-tehnike';d.open=razlagaKrog;
  const s=document.createElement('summary');s.textContent='Razlaga';
  const r=document.createElement('p');r.textContent=o.razlaga;
  const p=document.createElement('p');p.textContent=o.posledica;
  d.append(s,r,p);
  d.addEventListener('toggle',()=>{razlagaKrog=d.open;});
  return d;
}

// Razdelek "Shema" nad mrežo vaje (faza 3a, docs/faza3a-nacrt.md, dodatek 4): splošna risba
// vzorca iz shared/sheme.js. V "Spoznaj" privzeto odprt pri vseh tehnikah, tudi pri shemah 9 × 9
// (popravek po pregledu koraka 2 - prej zaprt), v "Vadi v uganki" zaprt; odprt ali zaprt ostane
// med vajami kroga (shemaKrog, zacniKrog() ga nastavi po shemaPrivzetoOdprta()). Ogled ne šteje
// kot pomoč - shema je splošna. Tehnika brez sheme (E1, E2) razdelka nima: null.
// Ob vaji je vse besedilo sheme nad risbo, razdelek pa stoji tik nad mrežo vaje (popravek po ročnem
// pregledu naloge 4a - izrisiShemo(m, { vaja: true })); pri 9 je odprta samo risba, ki ustreza vaji
// (risba = 0 Nebotičnik, 1 Zmaj - risbaVaje9()), druga oblika je pod njo na zahtevo.
let shemaKrog=true;
function shemaPrivzetoOdprta(m,n){
  return n==='spoznaj';
}
function risbaVaje9(varianta){return varianta==='Two-String Kite'?1:0;}
function razdelekShema(m,risba){
  const fig=izrisiShemo(m,{vaja:true,risba});
  if(!fig)return null;
  const d=document.createElement('details');d.className='shema-razdelek';d.open=shemaKrog;
  const s=document.createElement('summary');s.textContent='Shema';
  d.append(s,fig);
  d.addEventListener('toggle',()=>{shemaKrog=d.open;});
  return d;
}

// Položaj menija ob odhodu v vajo: "Nazaj na izbiro" ga obnovi, da seznam ostane pri tehniki,
// iz katere si prišel (popravek po pregledu koraka 1 faze 3a - prej je skočil na začetek, E1).
let menuPolozaj=0;
// Nov krog vaj tehnike m v načinu n ('spoznaj' ali 'uganka'). Vaja začne na vrhu strani - sicer
// bi ostal položaj menija (brskalnik ga le zmanjša na višino krajše strani) in glava bi bila odrezana.
function zacniKrog(m,n){
  if(menuEl.style.display!=='none')menuPolozaj=window.scrollY||0;
  mode=m;nacin=n;exNum=0;scoreRight=0;scoreTotal=0;sPomocjo=0;vecHkratiKrog=false;senciKrog=false;precrtaniKrog=false;vecCelicKrog=null;razlagaKrog=false;shemaKrog=shemaPrivzetoOdprta(m,n);
  updateScore();menuEl.style.display='none';trainerEl.style.display='block';
  renderExercise();
  window.scrollTo(0,0);
}
// Klik kartice je "Spoznaj"; gumba "Spoznaj" in "Vadi v uganki" (docs/vadi-v-uganki-nacrt.md).
document.querySelectorAll('.menu-card').forEach(card=>{
  card.addEventListener('click',()=>zacniKrog(card.dataset.mode,'spoznaj'));
  const nacini=document.createElement('div');nacini.className='nacin';
  for(const[napis,n]of[['Spoznaj','spoznaj'],['Vadi v uganki','uganka']]){
    const b=document.createElement('button');b.type='button';b.className='nacin-btn'+(n==='uganka'?' vadi':'');b.textContent=napis;
    b.addEventListener('click',e=>{e.stopPropagation();zacniKrog(card.dataset.mode,n);});
    nacini.appendChild(b);
  }
  card.appendChild(nacini);
});
// Nazaj na izbiro: položaj menija kot ob odhodu; če kartica tehnike vseeno ni v oknu (npr. drugačna
// velikost okna), se pomakne do nje.
document.getElementById('backBtn').addEventListener('click',()=>{
  vadiPrekini();
  trainerEl.style.display='none';menuEl.style.display='block';
  window.scrollTo(0,menuPolozaj);
  const card=menuEl.querySelector(`.menu-card[data-mode="${mode}"]`);
  if(card)card.scrollIntoView({block:'nearest'});
  mode=null;
});

function makeCell(slot,si,M){
  const gc=document.createElement('div');gc.className='gc';gc.dataset.si=si;
  if(slot.fixed!==undefined){gc.classList.add('fixed');gc.textContent=slot.fixed;}
  else if(slot.c){
    gc.classList.add('selectable');
    const cg=document.createElement('div');cg.className='candgrid';
    for(let d=1;d<=9;d++){const s=document.createElement('span');s.className='cd'+(slot.c.includes(d)?'':' hide');s.textContent=d;s.dataset.d=d;cg.appendChild(s);}
    gc.appendChild(cg);
    gc.addEventListener('click',()=>{
      const idx=selected.indexOf(si);
      if(idx>=0){selected.splice(idx,1);gc.classList.remove(M.selClass);}
      else if(selected.length<M.pickN){selected.push(si);gc.classList.add(M.selClass);}
      osveziPomoc();
    });
  }
  return gc;
}

function buildLayout(div,ex,M){
  const countEls=[],cellEls=[];
  if(ex.unitType==='row'){
    const strip=document.createElement('div');strip.className='layout-row';
    ex.slots.forEach((slot,si)=>{
      const cw=document.createElement('div');cw.className='cw';
      const lbl=document.createElement('div');lbl.className='clbl';lbl.textContent=`S${si+1}`;cw.appendChild(lbl);
      const gc=makeCell(slot,si,M);cw.appendChild(gc);cellEls.push(gc);
      const cnt=document.createElement('div');cnt.className='ccnt';cnt.textContent=slot.c?slot.c.length:'';cw.appendChild(cnt);countEls.push(cnt);
      strip.appendChild(cw);
    });
    div.appendChild(strip);
  } else if(ex.unitType==='col'){
    const strip=document.createElement('div');strip.className='layout-col';
    ex.slots.forEach((slot,si)=>{
      const cw=document.createElement('div');cw.className='cw';
      const lbl=document.createElement('div');lbl.className='clbl';lbl.textContent=`V${si+1}`;cw.appendChild(lbl);
      const gc=makeCell(slot,si,M);cw.appendChild(gc);cellEls.push(gc);
      const cnt=document.createElement('div');cnt.className='ccnt';cnt.textContent=slot.c?slot.c.length:'';cw.appendChild(cnt);countEls.push(cnt);
      strip.appendChild(cw);
    });
    div.appendChild(strip);
  } else {
    const lg=document.createElement('div');lg.style.cssText='display:grid;grid-template-columns:repeat(3,var(--cs));gap:2px;justify-content:center;margin:0 auto 2px';
    for(let i=0;i<9;i++){const s=document.createElement('span');s.style.cssText='font-family:"JetBrains Mono",monospace;font-size:7.5px;color:var(--pencil);text-align:center';s.textContent=ex.slots[i].pos;lg.appendChild(s);}
    div.appendChild(lg);
    const grid=document.createElement('div');grid.className='layout-block';
    ex.slots.forEach((slot,si)=>{const gc=makeCell(slot,si,M);grid.appendChild(gc);cellEls.push(gc);});
    div.appendChild(grid);
    const bc=document.createElement('div');bc.className='block-counts';
    ex.slots.forEach(slot=>{const s=document.createElement('span');s.textContent=slot.c?slot.c.length:'';bc.appendChild(s);countEls.push(s);});
    div.appendChild(bc);
  }
  return{cellEls,countEls};
}

// Prikaz za 1 · Izločitev izven bloka in 2 · Izločitev v bloku: delna mreža 9 x 9 iz
// shared/mreza.js (docs/geometrija-1-2-nacrt.md) - vidna sta samo blok in vrstica/stolpec
// vaje na pravih mestih (pogled.vidne), oznake robov S1-S9/V1-V9 (robovi), števka vaje je
// poudarjena kot v igri. Izbira (selected, indeksi celic 0-80) je izbira mreže; kliknejo
// se samo prazne vidne celice, po pravilnem odgovoru nič več. Korak vaje (pravilen
// odgovor ali "Rešitev") se pokaže z oznakami koraka kot v igri (jantarno vzorec, rdeče
// prečrtan izbris) - poudarek je takrat izklopljen, da rumena podlaga ne prekrije izbrisa.
function buildPresekLayout(div,ex,M){
  const okvir=document.createElement('div');okvir.className='vaja-presek';
  div.appendChild(okvir);
  let korak=false;
  const mreza=ustvariMrezo(okvir,{robovi:true,obKliku:i=>{
    if(vajaResena||ex.grid[i]) return;
    const ii=selected.indexOf(i);
    if(ii>=0) selected.splice(ii,1);
    else if(selected.length<M.pickN) selected.push(i);
    izrisi();osveziPomoc();
  }});
  const oznakeKoraka=()=>({
    vzorec:new Set(ex.solutionCells),
    izbris:new Set(ex.solutionEliminate.map(([c,d])=>c*10+d)),
    izbrisCelice:new Set(ex.solutionEliminate.map(([c])=>c)),
    vpis:new Map(),
  });
  function izrisi(){
    mreza.izrisi({
      grid:ex.grid,danosti:ex.danosti,kandidati:ex.kandidati,
      barva:d=>!korak&&d===ex.digit?0:-1,
      // Izbira je vidna tudi ob odprti Rešitvi (O12), po pravilnem odgovoru je ni več.
      izbrane:korak&&vajaResena?[]:selected,sosede:null,
      oznake:korak?oznakeKoraka():null,
      vidne:ex.vidne,
    });
  }
  izrisi();
  return{mreza,izrisi,pokaziKorak(on){korak=on;izrisi();}};
}

// Prikaz za XY-Wing in Unique Rectangle: cela mreža 9x9 s kandidati, ker je pri
// teh dveh tehnikah bistveno videti, katera celica "vidi" katero (ista vrstica,
// stolpec ali blok). Celice vaje (ex.slots) so klikljive, vse ostale so prikazane
// kot že rešene (sive, brez številke - sintetična deska ni prava uganka).
function buildFullGridLayout(div,ex,M){
  const cellEls=[],countEls=[];
  const idxToSi=new Map(ex.slots.map((s,si)=>[s.idx,si]));
  const g=document.createElement('div');g.className='g9';
  const corner=document.createElement('div');corner.className='g9-hdr';g.appendChild(corner);
  for(let c=0;c<9;c++){const h=document.createElement('div');h.className='g9-hdr';h.textContent='S'+(c+1);g.appendChild(h);}
  for(let r=0;r<9;r++){
    const rh=document.createElement('div');rh.className='g9-hdr';rh.textContent='V'+(r+1);g.appendChild(rh);
    for(let c=0;c<9;c++){
      const idx=r*9+c,si=idxToSi.get(idx);
      let gc;
      if(si===undefined){gc=document.createElement('div');gc.className='gc given';}
      else{
        gc=makeCell(ex.slots[si],si,M);
        // Vaja na eni številki (Turbot Fish): kandidat ex.digit poudarimo z barvo tehnike.
        if(ex.digit) gc.querySelectorAll(`.cd[data-d="${ex.digit}"]:not(.hide)`).forEach(s=>s.classList.add('hl',M.hlClass));
        const cnt=document.createElement('div');cnt.className='gcnt';cnt.textContent=ex.slots[si].c.length;
        gc.appendChild(cnt);countEls[si]=cnt;cellEls[si]=gc;
      }
      gc.dataset.r=r;gc.dataset.c=c;
      g.appendChild(gc);
    }
  }
  div.appendChild(g);
  const note=document.createElement('div');note.className='g9-note';
  note.textContent='Sive celice so že rešene; prikazani so kandidati praznih celic.';
  div.appendChild(note);
  return{cellEls,countEls};
}

// Prikaz za enojčka (E1, E2): plošča iz shared/plosca.js (izris v shared/mreza.js,
// docs/pripomocki-e1-e2-nacrt.md) na mreži prave uganke - števke brez kandidatov (raven
// lahke), dane temne, vpisane na poti modre. Vaja je igra z vpisi poti kot začetnimi
// potezami (igraZZacetkom), zato jih ni mogoče zbrisati ali razveljaviti. Pripomočki kot
// v igri: niz "Poudari" s kljukico "več hkrati" (ostane med vajami kroga) in seznami
// manjkajočih števk s stikali (ključ sudoku.trening.seznami). Sivega senčenja vrstice,
// stolpca in bloka izbrane celice ni - zlilo bi se z zatemnjenimi celicami.
// Postopnost (ex.oznaka iz genEnojcek): označena enota ali celica je modrikasta
// (pogled.oznacene), izbrati je mogoče samo prazne celice v njej (spremenljiva), druge
// prazne celice so neaktivne (zatemnjene, brez roke). Označena celica (E1, vaje 1-3) je
// izbrana vnaprej in je ni mogoče odizbrati, označena števka (E2, vaje 1-3) prav tako;
// drugi gumbi števk so takrat onemogočeni. Pod mrežo je niz števk 1-9 za vpis
// (pickedDigits); tipka s števko ga izbere prek obVpisu.
// "Rešitev" pokaže korak z oznakami koraka (enota skritega enojčka jantarno,
// celica zeleno s števko); pravilen odgovor postane poteza vpis (števci in seznami se
// osvežijo), mreža je nato zaklenjena (samoZaOgled, brez zelene obrobe - trening.css).
function buildSingleLayout(div,ex,M){
  const o=ex.oznaka,VSE=[...Array(81).keys()];
  const oznacena=idx=>!!o&&(o.celica!=null?idx===o.celica:o.enota.includes(idx));
  const dovoljena=idx=>!ex.boardGrid[idx]&&(!o||(o.celica==null&&oznacena(idx)));
  const vpisiPoti=VSE.filter(i=>ex.boardGrid[i]&&ex.danosti[i]==='0').map(i=>({tip:'vpis',celica:i,stevka:ex.boardGrid[i]}));
  const igra=igraZZacetkom(ex.danosti,vpisiPoti);
  if(!igra) throw new Error('buildSingleLayout: vpisi poti niso veljavne poteze');
  let stanje=stanjeIgre(igra),prikaz=false,odgovor=null;
  const el=(tag,cls,besedilo)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(besedilo)e.textContent=besedilo;return e;};
  const kljukica=besedilo=>{const l=el('label'),i=el('input');i.type='checkbox';l.append(i,besedilo);return{l,i};};

  const wrap=el('div','vaja-enojcek');div.appendChild(wrap);
  const glava=el('div','poudari-glava');
  const vh=kljukica(' več hkrati');vh.l.className='vec-hkrati';
  vh.i.checked=vecHkratiKrog;
  vh.i.addEventListener('change',()=>{vecHkratiKrog=vh.i.checked;});
  // "Senči": ob eni poudarjeni števki zasenči celice, kamor ne more (plošča). Pri E2 to
  // pokaže edino mesto v enoti, zato je vaja s prikazanim senčenjem vaja s pomočjo.
  const skriti=ex.mode==='hidden-single';
  const sc=kljukica(' senči');sc.l.className='vec-hkrati';
  sc.l.title='Zasenči celice, kamor poudarjena števka ne more (samo ob eni poudarjeni števki).'
    +(skriti?' Pri skritem enojčku se vaja s senčenjem šteje kot vaja s pomočjo.':'');
  sc.i.checked=senciKrog;
  sc.i.addEventListener('change',()=>{senciKrog=sc.i.checked;});
  const kljukice=el('span','kljukice');kljukice.append(sc.l,vh.l);
  glava.append(el('span','niz-oznaka','Poudari števko'),kljukice);
  wrap.appendChild(glava);
  const nizP=el('div','niz niz-poudari');nizP.setAttribute('role','group');nizP.setAttribute('aria-label','Poudari števko');
  wrap.appendChild(nizP);
  const okvir=el('div','mreza-okvir z-robovi'),mEl=el('div');
  const seznam=(cls,opis)=>{const s=el('div','seznam '+cls);s.hidden=true;s.setAttribute('aria-label',opis);return s;};
  const sV=seznam('seznam-vrstic','Manjkajoče števke v vrsticah'),sS=seznam('seznam-stolpcev','Manjkajoče števke v stolpcih');
  okvir.append(mEl,sV,sS);wrap.appendChild(okvir);
  wrap.appendChild(el('div','g9-note','Temne števke so dane, modre so že vpisane.'));
  const stikalaEl=el('div','seznami-stikala');stikalaEl.setAttribute('role','group');stikalaEl.setAttribute('aria-label','Prikaz seznamov');
  const kV=kljukica(' Vrstice'),kS=kljukica(' Stolpci'),kB=kljukica(' Bloki');
  stikalaEl.append(el('span','niz-oznaka','Manjkajoče števke'),kV.l,kS.l,kB.l);
  wrap.appendChild(stikalaEl);
  const sB=seznam('seznam-blokov','Manjkajoče števke v blokih');wrap.appendChild(sB);

  const lbl=el('p','stevke-label','Števka za vpis:');
  div.appendChild(lbl);
  const stevkeEl=el('div','digit-btns'),stevke=[];
  function izberiStevko(d){
    if(o&&o.stevka) return;
    const bil=pickedDigits[0];
    stevke.forEach(x=>x.classList.remove('picked'));
    if(bil===d){pickedDigits=[];return;}
    pickedDigits=[d];stevke[d-1].classList.add('picked');
  }
  for(let d=1;d<=9;d++){
    const b=el('button',null,String(d));b.dataset.d=d;
    if(o&&o.stevka){
      if(d===o.stevka){pickedDigits=[d];b.classList.add('picked');}
      else b.disabled=true;
    }
    b.addEventListener('click',()=>izberiStevko(d));
    stevkeEl.appendChild(b);stevke.push(b);
  }
  div.appendChild(stevkeEl);

  // Oznake koraka: ob odprti "Rešitvi" korak vaje, po pravilnem odgovoru vpisana celica.
  const oznake=()=>{
    if(!prikaz&&!odgovor) return null;
    const vpis=new Map(odgovor?[odgovor]:[]);
    if(prikaz) ex.korak.assign.forEach(([c,d])=>vpis.set(c,d));
    const enota=prikaz&&ex.korak.hint&&ex.korak.hint.unit||[];
    return{vzorec:new Set(enota),izbris:new Set(),izbrisCelice:new Set(),vpis};
  };
  const plosca=ustvariPlosco({
    mreza:mEl,robovi:true,kandidati:false,samoEna:true,
    nizPoudari:nizP,vecHkrati:vh.i,senci:sc.i,
    seznami:{vrstice:sV,stolpci:sS,bloki:sB},stikala:{vrstice:kV.i,stolpci:kS.i,bloki:kB.i},
    postavitev:wrap,kljucSeznamov:'sudoku.trening.seznami',
    vir:()=>({igra,stanje}),
    samoZaOgled:()=>vajaResena,
    spremenljiva:i=>!vajaResena&&dovoljena(i),
    zacetnaIzbira:o&&o.celica!=null?[o.celica]:[],
    obVpisu:(c,d)=>izberiStevko(d),
    oznake,
    // Senčenje pri E2 pred pravilnim odgovorom je pomoč (kot namig).
    izrisi:()=>{plosca.izrisi();if(skriti&&plosca.sencenjeVidno())oznaciPomoc();},
    // Po pravilnem odgovoru izbira ni več prikazana (celica je zelena).
    pogled:()=>({
      sosede:null,
      oznacene:o?VSE.filter(oznacena):null,
      // Območje postopnosti tudi brez barve: okvir in temne oznake roba (točka 17 v
      // docs/vadi-v-uganki-nacrt.md; obmocjeZaMrezo() v trening/v-uganki.js).
      obmocje:o&&!vajaResena?obmocjeZaMrezo(VSE.filter(oznacena)):null,
      neaktivne:VSE.filter(i=>!ex.boardGrid[i]&&!dovoljena(i)&&!oznacena(i)),
      ...(vajaResena?{izbrane:[]}:{}),
    }),
  });
  plosca.izrisi();
  enojcek={
    plosca,stevke,
    pokazi(on){prikaz=on;plosca.izrisi();},
    // Pravilen odgovor postane poteza vpis (števci "še manjka" in seznami se osvežijo).
    resi(celica,stevka){
      const prej=stanje;
      dodajPotezo(igra,{tip:'vpis',celica,stevka},stanje);
      stanje=stanjeIgre(igra);odgovor=[celica,stevka];
      plosca.poSpremembi(prej);plosca.izrisi();
    },
  };
  return{cellEls:[],countEls:[],stevkeEl};
}

// Male števke celice vaje (.candgrid > .cd) prek otrok - nadomestni DOM v testih nima
// querySelector. malaStevka(gc, d) je števka d ali null.
function maleStevke(gc){
  const cg=[...gc.children].find(e=>e.classList&&e.classList.contains('candgrid'));
  return cg?[...cg.children]:[];
}
function malaStevka(gc,d){return maleStevke(gc).find(cd=>+cd.dataset.d===d)||null;}
// Male števke [si, števka] dobijo razred (elim po pravilnem odgovoru, peek-izbris med "Rešitvijo").
function oznaciStevke(cellEls,pari,razred){
  pari.forEach(([si,d])=>{const cd=malaStevka(cellEls[si],d);if(cd)cd.classList.add(razred);});
}
// XY-veriga (O4, docs/xy-veriga-nacrt.md): zaporedna številka celice verige (celice koraka
// `cells` po vrsti, indeksi 0-80) na praznem mestu kandidata - skrita mala števka na tem mestu
// (.cd.hide, mestoStevilkeVerige()) pokaže številko (razred veriga-st, dataset.d ostane).
// `ogled` (Rešitev) doda še peek-veriga: odstrani jih pobrisiVerigo(); številke po
// pravilnem odgovoru ostanejo. Celica, ki številko že ima, je ne dobi znova.
function oznaciVerigo(cellEls,idxToSi,cells,ogled){
  cells.forEach((c,j)=>{
    const si=idxToSi.get(c);if(si===undefined)return;
    const cds=maleStevke(cellEls[si]);
    if(cds.some(cd=>cd.classList.contains('veriga-st'))) return;
    const d=mestoStevilkeVerige(d=>{const cd=cds.find(x=>+x.dataset.d===d);return !cd||!cd.classList.contains('hide');});
    const cd=cds.find(x=>+x.dataset.d===d);if(!cd)return;
    cd.textContent=j+1;
    cd.classList.remove('hide');cd.classList.add('veriga-st');
    if(ogled) cd.classList.add('peek-veriga');
  });
}
function pobrisiVerigo(cellEls){
  cellEls.forEach(c=>{if(!c)return;maleStevke(c).forEach(cd=>{
    if(!cd.classList.contains('peek-veriga')) return;
    cd.classList.remove('veriga-st','peek-veriga');cd.classList.add('hide');cd.textContent=cd.dataset.d;
  });});
}

// Legenda oznak pri vajah 3-12 v »Spoznaj« (faza 6) - pod »Rešitvijo« (kdaj 'resitev') in
// pod »Pravilno!« (kdaj 'odgovor'). Našteje samo vrste celic, ki so takrat na mreži, zato
// ista barva ne pomeni dveh stvari (rožnata z rdečim okvirjem je ob »Rešitvi« napačno izbrana
// celica izbrisa, po odgovoru celica z izbrisom). Vzorčki imajo iste spremenljivke barv kot
// celice (trening.css, .legenda-vaje). Pri 1 in 2 je legenda legendaKoraka() (v-uganki.js).
function legendaOznak(cellEls,M,kdaj){
  const ima=(c,...r)=>r.some(x=>c.classList.contains(x));
  const izbrana=c=>ima(c,'xw-selected')||(M.selClass&&ima(c,M.selClass));
  const pravilna=c=>ima(c,'correct','xw-correct','xw-sf-correct');
  const celice=cellEls.filter(Boolean);
  const veriga=celice.some(c=>maleStevke(c).some(cd=>ima(cd,'veriga-st')));
  const postavke=[];
  const dodaj=(razred,besedilo)=>postavke.push([razred,besedilo]);
  // Prečrtana števka (pri X-krilu in mečarici je števka besedilo celice izbrisa).
  const precrtana=celice.map(c=>ima(c,'xw-cell')
    ?((kdaj==='resitev'?ima(c,'peek-elim'):ima(c,'xw-elim'))?c.textContent:null)
    :(maleStevke(c).find(cd=>ima(cd,kdaj==='resitev'?'peek-izbris':'elim'))||{}).textContent||null).find(Boolean);
  if(kdaj==='resitev'){
    // Celica, ki je hkrati vzorec in izbris (pri 12 četrti vogal), je videti kot vzorec (CSS:
    // .peek-hl je za .peek-elim), zato šteje za vzorec.
    const vzorec=celice.filter(c=>ima(c,'peek-hl')&&!pravilna(c));
    const izbris=celice.filter(c=>ima(c,'peek-elim')&&!ima(c,'peek-hl'));
    const izbira=celice.filter(c=>izbrana(c)&&!pravilna(c));
    if(celice.some(pravilna)) dodaj('sw sw-pravilno','tvoj pravilni odgovor');
    if(!izbira.length){
      // XY-veriga (O4): celice z zaporednimi številkami.
      if(vzorec.length&&veriga) dodaj('sw-veriga','celice verige (po vrsti)');
      else if(vzorec.length) dodaj('sw sw-vzorec','celice vzorca');
    } else {
      if(vzorec.some(izbrana)) dodaj('sw sw-izbrana-prav','pravilno izbrana celica');
      if(vzorec.some(c=>!izbrana(c))) dodaj('sw sw-vzorec','spregledana celica vzorca');
      if(izbira.some(c=>!ima(c,'peek-hl','peek-elim'))) dodaj('sw sw-izbrana-narobe','napačno izbrana celica');
      if(izbris.some(izbrana)) dodaj('sw sw-izbrana-izbris','napačno izbrana celica izbrisa');
    }
    if(izbris.some(c=>!izbrana(c))) dodaj('sw sw-izbris','celica izbrisa');
    if(precrtana) dodaj('izbris','kandidat za izbris');
  } else {
    if(celice.some(pravilna)) dodaj('sw sw-pravilno','izbrane celice');
    if(celice.some(c=>ima(c,'elimcell'))) dodaj('sw sw-izbris-okvir','celica z izbrisom');
    if(celice.some(c=>ima(c,'xw-elim'))) dodaj('sw sw-izbris','celica z izbrisom');
    if(precrtana) dodaj('izbris','izbrisani kandidati');
  }
  const l=document.createElement('div');l.className='legenda-vaje';
  for(const[razred,besedilo] of postavke){
    const p=document.createElement('span');
    const sw=document.createElement('span');
    if(razred==='izbris'){sw.className='izbris-vzorec';sw.textContent=precrtana;}
    else if(razred==='sw-veriga'){sw.className=razred;sw.textContent='1';}
    else sw.className=razred;
    p.append(sw,besedilo);l.appendChild(p);
  }
  return l;
}

// Izbris vzorca pri 3-6 kot pari [si, števka] (indeksi v ex.slots): pri očitnem paru/trojici
// (celice ps s števkami ds) števke ds v drugih celicah enote, pri skritem (M.hasPhase2) druge
// števke v celicah vzorca. Isti izračun prečrta izbris po pravilnem odgovoru (checkPhase1,
// checkPhase2) in ob "Rešitvi" (peekOn) - docs/precrtanje-resitev-nacrt.md.
function izbrisPodmnozice(ex,M,ps,ds){
  if(M.hasPhase2) return ps.flatMap(si=>ex.slots[si].c.filter(d=>!ds.has(d)).map(d=>[si,d]));
  return ex.slots.flatMap((slot,si)=>ps.includes(si)||!slot.c?[]:slot.c.filter(d=>ds.has(d)).map(d=>[si,d]));
}
// Vzorec očitnega para/trojice za "Rešitev": celice, celice izbrisa (elim) in izbris po števkah.
function vzorecPodmnozice(ex,M,ps,ds){
  const izbris=izbrisPodmnozice(ex,M,ps,ds);
  return{cells:ps,elim:[...new Set(izbris.map(([si])=>si))],izbris};
}

// Vzorci, ki jih sprejme "Preveri" (checkPhase1), za prikaz "Rešitve" pri očitnem paru in
// trojici, X-krilu in mečarici - pri teh je lahko veljaven tudi drug vzorec kot tisti, ki ga
// je sestavil generator (docs/izbira-spoznaj-nacrt.md, razdelek 6). Vrne [{ cells, elim }]:
// pri paru in trojici nabori pickN celic z natanko pickN kandidati (indeksi v ex.slots) z
// izbrisom kot v checkPhase1 (vzorecPodmnozice - še izbris po števkah), pri X-krilu dve vrstici
// (stolpca) s števko na istih dveh mestih in izbris kot v checkPhase1, pri mečarici swordfish()
// kot v checkPhase1 (celice 0-80).
function veljavniVzorci(ex,M){
  if(M.isSwordfish){
    const bit=1<<ex.digit;
    return swordfish({grid:new Array(81).fill(0),cand:ex.grid.map(has=>has?bit:0)})
      .map(s=>({cells:s.cells,elim:s.eliminate.map(([c])=>c)}));
  }
  const vzorci=[];
  if(M.isXWing){
    const devet=[...Array(9).keys()];
    for(const vrstice of [true,false]){
      const idx=(b,i)=>vrstice?b*9+i:i*9+b;
      const mesta=devet.map(b=>devet.filter(i=>ex.grid[idx(b,i)]));
      for(let a=0;a<9;a++)for(let b=a+1;b<9;b++){
        if(mesta[a].length!==2||mesta[a].join()!==mesta[b].join()) continue;
        vzorci.push({
          cells:[a,b].flatMap(x=>mesta[a].map(i=>idx(x,i))),
          elim:mesta[a].flatMap(i=>devet.filter(x=>x!==a&&x!==b&&ex.grid[idx(x,i)]).map(x=>idx(x,i))),
        });
      }
    }
    return vzorci;
  }
  const prosti=ex.slots.map((s,si)=>s.c?si:-1).filter(si=>si>=0);
  (function nabori(od,nabor){
    if(nabor.length===M.pickN){
      const ds=new Set(nabor.flatMap(si=>ex.slots[si].c));
      if(ds.size===M.pickN) vzorci.push(vzorecPodmnozice(ex,M,nabor,ds));
      return;
    }
    for(let k=od;k<prosti.length;k++) nabori(k+1,[...nabor,prosti[k]]);
  })(0,[]);
  return vzorci;
}

// Motilec na mreži vaje (namig ga omeni samo, kadar je - vaja po shemi ga nima, vaja iz
// generatorja ga ima). XY-krilo: trojica celic z dvema kandidatoma s pravimi števkami ({a, b},
// {a, c}, {b, c}), v kateri nobena celica ne vidi obeh drugih (eno krilo pivota ne vidi).
function motilecXYKrila(ex){
  const bi=ex.slots.filter(s=>s.c.length===2);
  const vidi=(p,a,b)=>PEERS[p.idx].has(a.idx)&&PEERS[p.idx].has(b.idx);
  for(let i=0;i<bi.length;i++) for(let j=i+1;j<bi.length;j++) for(let k=j+1;k<bi.length;k++){
    const t=[bi[i],bi[j],bi[k]];
    if(new Set(t.flatMap(s=>s.c)).size!==3||new Set(t.map(s=>s.c.join())).size!==3) continue;
    if(!vidi(t[0],t[1],t[2])&&!vidi(t[1],t[0],t[2])&&!vidi(t[2],t[0],t[1])) return true;
  }
  return false;
}
// Edinstveni pravokotnik: trije vogali z istim parom, pravokotnik razpet čez štiri bloke.
function motilecPravokotnika(ex){
  const bi=ex.slots.filter(s=>s.c.length===2);
  for(let i=0;i<bi.length;i++) for(let j=i+1;j<bi.length;j++) for(let k=j+1;k<bi.length;k++){
    const t=[bi[i].idx,bi[j].idx,bi[k].idx];
    if(bi[i].c.join()!==bi[j].c.join()||bi[i].c.join()!==bi[k].c.join()) continue;
    const vr=[...new Set(t.map(c=>Math.floor(c/9)))],st=[...new Set(t.map(c=>c%9))];
    if(vr.length===2&&st.length===2&&new Set(vr.flatMap(r=>st.map(s=>boxOf(r*9+s)))).size===4) return true;
  }
  return false;
}

// Vaja po shemi (docs/trening-ucenje-nacrt.md, 1.3): pripis k vrstici nad vajo in vrstica s
// preslikavo črk v števke tik pod razdelkom »Shema« (O2).
// Pri 11 je vaja 2 zrcaljena levo-desno (O18), pri 9 po prvi oziroma drugi risbi sheme (O8).
function pripisPoShemi(ps){return ps.obrnjeno?' · po shemi, obrnjeno':ps.zrcaljeno?' · po shemi, zrcaljeno':' · po shemi';}
// Vrstica je pod risbo sheme, tik nad mrežo vaje - igralec jo med reševanjem gleda skupaj z mrežo
// (popravek 3 po ročnem pregledu naloge 4a). Pri 9 je odprta samo risba vaje, zato samo ime oblike.
function vrsticaPoShemi(ps){
  const crke=ps.crke.length===1?`črka ${ps.crke[0][0]} je števka ${ps.crke[0][1]}.`
    :`črke so števke: ${ps.crke.map(([c,d])=>`${c} = ${d}`).join(', ')}.`;
  if(ps.obrnjeno) return `Vaja po obrnjeni shemi zgoraj – ${ps.vrstica?'vrstica sheme je stolpec':'vrstice sheme so stolpci'}, ${crke}`;
  if(ps.zrcaljeno) return `Vaja po zrcaljeni shemi zgoraj – stolpec 1 sheme je stolpec 9, stolpec 2 je stolpec 8 …, ${crke}`;
  if(ps.risba) return `Vaja po shemi zgoraj (${ps.risba.ime}) – iste celice, ${crke}`;
  return `Vaja po shemi zgoraj – iste celice, ${crke}`;
}

function renderExercise(){
  const M=MODES[mode];
  enojcek=null;vadiPrekini();osveziPomoc=()=>{};
  if(exNum>=MAX_EX){
    area.innerHTML='';const d=document.createElement('div');d.className='exercise';
    const pct=scoreTotal>0?Math.round(scoreRight/scoreTotal*100):0;
    d.innerHTML=`<h3>Končano!</h3><p style="font-size:15px">Rezultat: <b>${scoreRight}</b> / <b>${scoreTotal}</b> (${pct}%)</p>${sPomocjo?`
      <p style="font-size:14px;color:#3C4854">S pomočjo: <b>${sPomocjo}</b> (ne štejejo)</p>`:''}
      <p style="font-size:14px;color:#3C4854">Pritisni »Nazaj na izbiro« za novo vadbo.</p>`;
    area.appendChild(d);return;
  }
  if(nacin==='uganka'){renderVadi();return;}
  // Vaji 1 in 2 sta po shemi (docs/trening-ucenje-nacrt.md, del A), kjer je narejena - sicer generator.
  const ex=genPoShemi(mode,exNum)||M.gen(exNum);
  selected=[];pickedDigits=[];area.innerHTML='';presek=null;
  pomocVaje=false;vajaResena=false;vajaPrav=0;vajaVseh=0;

  const div=document.createElement('div');div.className='exercise';
  // Pod nalogo povzetek tehnike in navodilo (M.desc = opisVaje()) ali povzetek in lasten opis
  // naloge (ex.desc: 1, 2, 7, 8 in E1/E2 v vajah 1-6); razlaga je v razdelku "Razlaga".
  const opis=ex.desc?`${TEHNIKE_OPISI[mode].povzetek} ${ex.desc}`:M.desc;
  div.innerHTML=`<p class="ex-label">${imeTehnike(TEHNIKA_VAJE[mode],{stevilka:true})} · Vaja ${exNum+1} / ${MAX_EX}${ex.poShemi?pripisPoShemi(ex.poShemi):''}</p><h3>${ex.unitLabel}</h3><p class="desc">${opis}</p>`;
  div.appendChild(razdelekRazlaga(mode));
  // Razdelek »Shema« in pod njim vrstica s preslikavo se vstavita tik nad mrežo vaje, ko je postavitev
  // zgrajena (spodaj).
  const shema=razdelekShema(mode,M.isTurbot?risbaVaje9(ex.variant):undefined);

  let cellEls=[],countEls=[];

  if(M.isSingle){
    const layout=buildSingleLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  } else if(M.isXWing||M.isSwordfish){
    // Poseben prikaz: 9x9 mreža za eno številko
    const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
    dlabel.textContent=`Označena števka: ${ex.digit}`;
    div.appendChild(dlabel);

    const xg=document.createElement('div');xg.className='xw-grid';
    // Header vrsta: prazna + S1..S9
    const corner=document.createElement('div');corner.className='xw-hdr';xg.appendChild(corner);
    for(let c=0;c<9;c++){const h=document.createElement('div');h.className='xw-hdr';h.textContent='S'+(c+1);xg.appendChild(h);}
    // Vrstice
    for(let r=0;r<9;r++){
      const rh=document.createElement('div');rh.className='xw-hdr';rh.textContent='V'+(r+1);xg.appendChild(rh);
      for(let c=0;c<9;c++){
        const idx=r*9+c;
        const cell=document.createElement('div');
        cell.className='xw-cell';
        cell.dataset.r=r;cell.dataset.c=c;cell.dataset.idx=idx;
        if(ex.grid[idx]){
          cell.classList.add('has-digit');
          cell.textContent=ex.digit;
          cell.addEventListener('click',()=>{
            const si=idx;
            const ii=selected.indexOf(si);
            if(ii>=0){selected.splice(ii,1);cell.classList.remove('xw-selected');}
            else if(selected.length<(M.isSwordfish?9:4)){selected.push(si);cell.classList.add('xw-selected');}
            osveziPomoc();
          });
        }
        xg.appendChild(cell);
        cellEls.push(cell);
      }
    }
    div.appendChild(xg);
  } else if(M.isPointing||M.isBoxLine){
    const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
    dlabel.textContent=`Označena števka: ${ex.digit}`;
    div.appendChild(dlabel);
    presek=buildPresekLayout(div,ex,M);
  } else if(M.isXYWing||M.isUR||M.isTurbot||M.isWWing||M.isXYChain){
    // Oznaka "Označena številka" samo pri Turbot Fish - XY-Wing in Unique Rectangle
    // nista vezani na eno samo številko.
    if(M.isTurbot){
      const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
      dlabel.textContent=`Označena števka: ${ex.digit}`;
      div.appendChild(dlabel);
    }
    const layout=buildFullGridLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  } else {
    const layout=buildLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  }
  {
    const mreza=[...div.children].find(e=>['vaja-presek','layout-row','layout-col','layout-block','xw-grid','g9'].some(r=>e.classList.contains(r)));
    if(shema) div.insertBefore(shema,mreza||null);
    if(ex.poShemi){const p=document.createElement('p');p.className='po-shemi';p.textContent=vrsticaPoShemi(ex.poShemi);div.insertBefore(p,mreza||null);}
  }

  // Gumb za stevilo kandidatov - vidnost je lastnost tehnike (M.showCandidateCount), ne poseben primer po imenu tehnike
  if(M.showCandidateCount){
    const ctBtn=document.createElement('button');ctBtn.className='sm-btn';ctBtn.textContent='Pokaži število kandidatov';
    ctBtn.style.cssText='margin-bottom:10px;display:block';
    ctBtn.addEventListener('click',()=>{
      const on=countEls[0]&&countEls[0].classList.contains('vis');
      countEls.forEach(c=>c.classList.toggle('vis',!on));
      ctBtn.textContent=on?'Pokaži število kandidatov':'Skrij število kandidatov';
    });
    div.appendChild(ctBtn);
  }

  const fb=document.createElement('div');fb.className='fb';
  const btnRow=document.createElement('div');btnRow.className='btn-row';
  const checkBtn=document.createElement('button');checkBtn.className='pri '+M.btnClass;
  checkBtn.textContent='Preveri';
  const nextBtn=document.createElement('button');nextBtn.className='pri pri-green';
  nextBtn.textContent=exNum<MAX_EX-1?'Naslednja vaja →':'Končaj';
  nextBtn.addEventListener('click',()=>{exNum++;renderExercise();});

  // Faza 2 za hidden pair
  let phase2=null,digitBtnsDiv=null;
  if(M.hasPhase2){
    const p2n=M.phase2pick||2;
    const p2word=p2n===2?'dve števki':'tri števke';
    const p2type=p2n===2?'skriti par':'skrito trojico';
    phase2=document.createElement('div');phase2.className='phase2';
    phase2.innerHTML=`<p>${p2n===2?'Kateri':'Katere'} <b>${p2word}</b> ${p2n===2?'tvorita':'tvorijo'} ${p2type}? Klikni jih:</p>`;
    digitBtnsDiv=document.createElement('div');digitBtnsDiv.className='digit-btns';
    const allCands=new Set();
    ex.slots.forEach(s=>{if(s.c) s.c.forEach(d=>allCands.add(d));});
    for(const d of [...allCands].sort((a,b)=>a-b)){
      const b=document.createElement('button');b.textContent=d;b.dataset.d=d;
      b.addEventListener('click',()=>{
        const idx=pickedDigits.indexOf(d);
        if(idx>=0){pickedDigits.splice(idx,1);b.classList.remove('picked');}
        else if(pickedDigits.length<p2n){pickedDigits.push(d);b.classList.add('picked');}
      });
      digitBtnsDiv.appendChild(b);
    }
    phase2.appendChild(digitBtnsDiv);
    const ch2=document.createElement('button');ch2.className='pri '+M.btnClass;ch2.textContent='Preveri '+p2word;
    ch2.addEventListener('click',()=>preveriSPomocjo(()=>checkPhase2(ex,M,cellEls,ch2,nextBtn,fb)));
    phase2.appendChild(ch2);
  }

  checkBtn.addEventListener('click',()=>preveriSPomocjo(()=>checkPhase1(ex,M,cellEls,checkBtn,nextBtn,fb,phase2)));
  btnRow.appendChild(checkBtn);btnRow.appendChild(nextBtn);
  div.appendChild(btnRow);
  if(phase2) div.appendChild(phase2);
  div.appendChild(fb);

  // --- Namig in Rešitev (stikali: klik odpre, drugi klik zapre) ---
  const peekRow=document.createElement('div');peekRow.className='peek-row';

  // Korak shared logike, ki ga je generator preveril in shranil (glej
  // trening/generators.js) - uporabljata ga rešitev in poudarjanje celic, da vedno
  // kažeta na isti, načrtovani vzorec. Pri XY-Wing, Unique Rectangle, Turbot Fish in
  // W-Wing lahko na plošči po naključju obstaja tudi kak drug veljaven vzorec, ki ga
  // preverjanje odgovora v checkPhase1 še vedno sprejme; pri 1 in 2 (vaja iz prave
  // uganke) je odgovor en sam.
  // solutionVeriga: korak je XY-veriga (generator ga nastavi iz koraka motorja) - celice so po
  // vrsti verige in dobijo zaporedne številke (O4).
  function exDigitStep(){
    if(!ex.solutionCells) return null;
    return {cells:ex.solutionCells,eliminate:ex.solutionEliminate,message:ex.solutionMessage,veriga:!!ex.solutionVeriga};
  }

  // Vzorec, ki ga pokaže "Rešitev" pri očitnem paru in trojici, X-krilu in mečarici: med
  // vzorci, ki jih sprejme "Preveri", tisti z največ izbranimi celicami, pri enakem številu tisti,
  // ki je izbran ves (mečarica je lahko del večje) - brez izbire ali ob izenačenju vzorec
  // generatorja (privzet). Tako se okvir izbire ob "Rešitvi" (pravilno / napačno izbrana,
  // trening.css) ujema s "Preveri", tudi če je izbran drug veljaven vzorec.
  function vzorecResitve(){
    const xy=([r,c])=>r*9+c;
    const privzet=M.isXWing||M.isSwordfish
      ?{cells:(ex.rect||ex.sfCells).map(xy),elim:ex.elimCells.map(xy),privzet:true}
      :{...vzorecPodmnozice(ex,M,ex.targetSlots,new Set(ex.targetDigits)),privzet:true};
    const izbranih=v=>v.cells.filter(c=>selected.includes(c)).length;
    const ves=v=>izbranih(v)===v.cells.length;
    const boljsi=(v,naj)=>izbranih(v)>izbranih(naj)||izbranih(v)===izbranih(naj)&&ves(v)&&!ves(naj);
    return veljavniVzorci(ex,M).reduce((naj,v)=>boljsi(v,naj)?v:naj,privzet);
  }

  // Besedilo namiga glede na tip
  function buildHintText(){
    if(M.isSingle) return ex.namig;
    if(M.isPointing||M.isBoxLine){
      const withDigit=ex.primaryCells.filter(c=>!ex.grid[c]&&(ex.kandidati[c]&(1<<ex.digit))).map(cellPos);
      const seek=M.isPointing?'eni vrstici ali stolpcu':'enem bloku';
      const kje=M.isPointing?`bloku ${ex.blok+1}`:`${ex.jeVrstica?'vrstici':'stolpcu'} ${ex.enotaSt+1}`;
      return `Kandidat ${ex.digit} se v ${kje} pojavlja v celicah: ${withDigit.join(', ')||'(nikjer)'}. Ali vse ležijo v ${seek}?`;
    } else if(M.isXYWing){
      const bi=ex.slots.filter(s=>s.c.length===2).map(s=>`${s.pos} {${s.c.join(', ')}}`);
      return `Celice z natanko dvema kandidatoma: ${bi.join(', ')}. Pivot je tisti, ki ga <b>obe</b> krili vidita (ista vrstica, stolpec ali blok)${motilecXYKrila(ex)?' – ena trojica ima prave števke, a eno krilo pivota ne vidi':''}.`;
    } else if(M.isUR){
      const byPair={};
      ex.slots.filter(s=>s.c.length===2).forEach(s=>{const k=s.c.join(', ');(byPair[k]=byPair[k]||[]).push(s.pos);});
      const lines=Object.entries(byPair).map(([k,ps])=>`{${k}}: ${ps.join(', ')}`).join(' · ');
      return `Pari kandidatov: ${lines}. Trije vogali z istim parom morajo ležati v dveh vrsticah, dveh stolpcih in <b>natanko dveh blokih</b>${motilecPravokotnika(ex)?' – če je pravokotnik razpet čez štiri bloke, tehnika ne velja':''}.`;
    } else if(M.isXYChain){
      // Namig motorja (O6: števka z in dolžina) in pravilo verige.
      const step=exDigitStep();
      return `${stepHint({technique:'XY-Chain',hint:{digits:[ex.z],celic:step.cells.length}})} Zaporedni celici se vidita (ista vrstica, stolpec ali blok) in imata skupen kandidat, oba konca pa imata ${ex.z}.`;
    } else if(M.isWWing){
      const byPair={};
      ex.slots.filter(s=>s.c.length===2).forEach(s=>{const k=s.c.join(', ');(byPair[k]=byPair[k]||[]).push(s.pos);});
      const lines=Object.entries(byPair).map(([k,ps])=>`{${k}}: ${ps.join(', ')}`).join(' · ');
      // »Za pravi par« samo, kadar je parov v vsaj dveh celicah več (motilec iz generatorja).
      const vecParov=Object.values(byPair).filter(ps=>ps.length>=2).length>1;
      return `Pari kandidatov: ${lines}. Celici para se <b>ne smeta videti</b> (ne ista vrstica, stolpec ali blok) – ${vecParov?'za pravi par nato':'nato'} poišči enoto, kjer je druga števka para mogoča samo v dveh celicah, od katerih vsaka vidi po eno celico para.`;
    } else if(M.isTurbot){
      const bit=1<<ex.digit,links=[];
      for(const [units,lbl] of [[ROWS,'V'],[COLS,'S']]) units.forEach((u,i)=>{
        const spots=u.filter(c=>ex.boardGrid[c]===0&&(ex.boardCand[c]&bit));
        if(spots.length===2) links.push(`${lbl}${i+1}: ${spots.map(cellPos).join(', ')}`);
      });
      return `Vrstice in stolpci, kjer je ${ex.digit} mogoča samo v dveh celicah (povezave): ${links.join(' · ')||'(nobena)'}. Poišči dve taki povezavi, pri katerih se en konec prve in en konec druge vidita (ista vrstica, stolpec ali blok).`;
    } else if(M.isXWing||M.isSwordfish){
      // Preštej v koliko celicah se digit pojavi v vsaki vrstici in stolpcu
      const rowCounts=[],colCounts=[];
      for(let i=0;i<9;i++){
        let rc=0,cc=0;
        for(let j=0;j<9;j++){if(ex.grid[i*9+j])rc++;if(ex.grid[j*9+i])cc++;}
        if(rc>0)rowCounts.push(`V${i+1}:${rc}×`);
        if(cc>0)colCounts.push(`S${i+1}:${cc}×`);
      }
      // Vrstice in stolpci (vaja je lahko v obeh smereh); X-krilo dve, mečarica tri (faza 6, E4).
      const isci=M.isSwordfish
        ?'Poišči tri vrstice ali tri stolpce, v katerih je števka dvakrat ali trikrat, vse v istih treh stolpcih (vrsticah).'
        :'Poišči dve vrstici ali dva stolpca, v katerih je števka natanko dvakrat.';
      return `Pojavitve ${ex.digit} po vrsticah: ${rowCounts.join(', ')} · po stolpcih: ${colCounts.join(', ')}. ${isci}`;
    } else if(M.hasPhase2){
      const freq={};
      ex.slots.forEach(s=>{if(s.c) s.c.forEach(d=>{freq[d]=(freq[d]||0)+1;});});
      const lines=Object.entries(freq).sort((a,b)=>a[0]-b[0])
        .map(([d,n])=>`<b>${d}</b>→${n}×`).join(', ');
      return `Pogostost kandidatov: ${lines}. Poišči števke, ki so v enoti mogoče v največ ${M.pickN===2?'dveh':'treh'} celicah.`;
    } else {
      const small=[];
      ex.slots.forEach((s,i)=>{if(s.c&&s.c.length<=3) small.push(s.pos+'('+s.c.length+')');});
      return `Celice z dvema ali tremi kandidati: ${small.join(', ')}. Med njimi je ${M.pickN===2?'par':'trojica'}.`;
    }
  }
  function buildSolutionText(){
    if(M.isSingle) return ex.korak.message;
    if(M.isPointing||M.isBoxLine||M.isXYWing||M.isUR||M.isTurbot||M.isWWing||M.isXYChain){
      const step=exDigitStep();
      return step?step.message:'(ni najdenega vzorca)';
    }
    if(M.isXWing||M.isSwordfish){
      const expSize=M.isSwordfish?3:2;
      const combos=[];
      for(const [tryRow,baseLbl,crossLbl] of [[true,'V','S'],[false,'S','V']]){
        // Zberi enote z 2 (X-Wing) ali 2-3 (Swordfish) pojavitvama
        const units=[];
        for(let b=0;b<9;b++){
          const positions=[];
          for(let i=0;i<9;i++){
            const idx=tryRow?b*9+i:i*9+b;
            if(ex.grid[idx]) positions.push(i);
          }
          if(positions.length>=2&&positions.length<=expSize) units.push({b,positions});
        }
        // Za X-Wing: pari z istimi 2 stolpci
        if(!M.isSwordfish){
          const byKey={};
          units.forEach(u=>{const k=u.positions.join(',');if(!byKey[k])byKey[k]=[];byKey[k].push(u.b);});
          for(const [key,bases] of Object.entries(byKey)){
            if(bases.length<2) continue;
            const crosses=key.split(',').map(Number);
            for(let i=0;i<bases.length;i++)for(let j=i+1;j<bases.length;j++){
              combos.push(`<b>${tryRow?'Vrstični':'Stolpčni'}:</b> ${baseLbl}${bases[i]+1}+${baseLbl}${bases[j]+1} × ${crossLbl}${crosses[0]+1},${crossLbl}${crosses[1]+1}`);
            }
          }
        } else {
          // Za Swordfish: trojke kjer unija stolpcev = 3
          for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)for(let k=j+1;k<units.length;k++){
            const union=new Set([...units[i].positions,...units[j].positions,...units[k].positions]);
            if(union.size===3){
              const crosses=[...union].sort((a,b)=>a-b);
              combos.push(`<b>${tryRow?'Vrstični':'Stolpčni'}:</b> ${[units[i],units[j],units[k]].map(u=>baseLbl+(u.b+1)).join('+')} × ${crosses.map(c=>crossLbl+(c+1)).join(',')}`);
            }
          }
        }
      }
      if(combos.length===0) combos.push('(ni najdenega vzorca)');
      const techName=M.isSwordfish?'mečarico':'X-krilo';
      return `<b>Vse veljavne kombinacije za ${techName} (${combos.length}):</b><br>${combos.join('<br>')}`;
    }
    // Očitna para/trojica: sporočilo motorja (pove tudi celice izbrisa). Pri skritih
    // vzorcih ga ne kažemo - tam se pokaže šele po 2. fazi (glej checkPhase2). Če "Rešitev"
    // pokaže drug veljaven vzorec (vzorecResitve), besedilo kot pri "Preveri" za tak vzorec.
    if(!M.hasPhase2){
      const v=vzorecResitve();
      if(!v.privzet){
        const ds=[...new Set(v.cells.flatMap(si=>ex.slots[si].c))].sort((a,b)=>a-b);
        return `{${ds.join(', ')}} v ${[...v.cells].sort((a,b)=>a-b).map(p=>ex.slots[p].pos).join(', ')}.`;
      }
      if(ex.solutionMessage) return ex.solutionMessage;
    }
    const cells=ex.targetSlots.map(p=>ex.slots[p].pos).join(', ');
    const digits=ex.targetDigits.join(', ');
    return `<b>Celice:</b> ${cells} · <b>Števke:</b> {${digits}}`;
  }

  const hintOverlay=document.createElement('div');hintOverlay.className='peek-overlay';
  const solOverlay=document.createElement('div');solOverlay.className='peek-overlay';

  // Izbris je ob "Rešitvi" kot pri 1 in 2 (docs/precrtanje-resitev-nacrt.md): celica izbrisa
  // rožnata (peek-elim), števka izbrisa rdeče prečrtana (peek-izbris na .cd - ne elim, ki ga
  // ima števka po pravilnem odgovoru in ga peekOff ne sme pobrisati). Pri X-krilu in mečarici
  // ima celica eno samo števko, zato prečrta peek-elim sam (trening.css).
  function peekOn(overlay,text,showHL){
    oznaciPomoc();
    overlay.innerHTML=text;
    overlay.classList.add('visible');
    if(showHL){
      if(M.isSingle){
        // Oznake koraka: pri skritem enojčku enota, v kateri je števka omejena na eno
        // mesto (jantarno), in celica s števko (zeleno).
        enojcek.pokazi(true);
      } else if(presek){
        presek.pokaziKorak(true);
      } else if(M.isXYWing||M.isUR||M.isTurbot||M.isWWing||M.isXYChain){
        const step=exDigitStep();
        if(step){
          const idxToSi=new Map(ex.slots.map((s,si)=>[s.idx,si]));
          step.cells.forEach(cidx=>{const si=idxToSi.get(cidx);if(si!==undefined)cellEls[si].classList.add('peek-hl');});
          step.eliminate.forEach(([cidx])=>{const si=idxToSi.get(cidx);if(si!==undefined)cellEls[si].classList.add('peek-elim');});
          oznaciStevke(cellEls,step.eliminate.filter(([cidx])=>idxToSi.has(cidx)).map(([cidx,d])=>[idxToSi.get(cidx),d]),'peek-izbris');
          if(step.veriga) oznaciVerigo(cellEls,idxToSi,step.cells,true);
        }
      } else if(M.isXWing||M.isSwordfish||!M.hasPhase2){
        const v=vzorecResitve();
        v.cells.forEach(c=>cellEls[c].classList.add('peek-hl'));
        v.elim.forEach(c=>cellEls[c].classList.add('peek-elim'));
        if(v.izbris) oznaciStevke(cellEls,v.izbris,'peek-izbris');
      } else {
        // Skriti par/trojica: celice vzorca ostanejo jantarne, prečrtane so njihove druge števke.
        ex.targetSlots.forEach(si=>cellEls[si].classList.add('peek-hl'));
        oznaciStevke(cellEls,izbrisPodmnozice(ex,M,ex.targetSlots,new Set(ex.targetDigits)),'peek-izbris');
      }
      // Legenda oznak, ki so zdaj na mreži (E1 in E2 je nimata - kot v »Vadi v uganki«).
      if(presek) overlay.appendChild(legendaKoraka({eliminate:ex.solutionEliminate},false));
      else if(!M.isSingle) overlay.appendChild(legendaOznak(cellEls,M,'resitev'));
    }
  }
  function peekOff(overlay){
    overlay.classList.remove('visible');
    if(presek&&!vajaResena) presek.pokaziKorak(false);
    if(enojcek) enojcek.pokazi(false);
    cellEls.forEach(c=>{c.classList.remove('peek-hl','peek-elim','peek-enota');maleStevke(c).forEach(cd=>cd.classList.remove('peek-izbris'));});
    pobrisiVerigo(cellEls);
  }

  // Namig in Rešitev sta stikali (docs/trening-ucenje-nacrt.md, del B): klik odpre, drugi klik
  // zapre (napis »Skrij namig« / »Skrij rešitev«, aria-pressed); odprt je kvečjemu eden - drugi
  // gumb zamenja vsebino (odprto: null, 'namig' ali 'resitev'). Pomoč se šteje ob prvem odprtju
  // (peekOn -> oznaciPomoc). Nova vaja se izriše na novo, zato je pomoč zaprta.
  let odprto=null;
  const hintBtn=document.createElement('button');hintBtn.type='button';hintBtn.className='peek-btn';
  const solBtn=document.createElement('button');solBtn.type='button';solBtn.className='peek-btn';
  function napisiPomoci(){
    hintBtn.textContent=odprto==='namig'?'Skrij namig':'Namig';hintBtn.setAttribute('aria-pressed',String(odprto==='namig'));
    solBtn.textContent=odprto==='resitev'?'Skrij rešitev':'Rešitev';solBtn.setAttribute('aria-pressed',String(odprto==='resitev'));
  }
  function pokaziPomoc(){
    if(odprto==='namig') peekOn(hintOverlay,buildHintText(),false);
    else if(odprto==='resitev') peekOn(solOverlay,buildSolutionText(),true);
  }
  function skrijPomoc(){peekOff(hintOverlay);peekOff(solOverlay);}
  function preklopiPomoc(kaj){skrijPomoc();odprto=odprto===kaj?null:kaj;pokaziPomoc();napisiPomoci();}
  hintBtn.addEventListener('click',()=>preklopiPomoc('namig'));
  solBtn.addEventListener('click',()=>preklopiPomoc('resitev'));
  napisiPomoci();
  // Izbira ob odprti Rešitvi (O12, B): oznake in besedilo se prilagodijo novi izbiri - kot nov
  // pritisk z drugo izbiro prej. Pokliče se ob kliku celice (makeCell, X-krilo in mečarica, delna
  // mreža 1 in 2); E1 in E2 izbiro in oznake koraka izriše plošča skupaj.
  osveziPomoc=()=>{if(odprto==='resitev'){skrijPomoc();pokaziPomoc();}};
  // »Preveri« (O13): pomoč se pred presojo skrije (oznake Rešitve se ne mešajo z oznakami
  // odgovora); pri rešeni vaji ostane zaprta, sicer se znova odpre s stanjem po presoji (napačen
  // odgovor izprazni izbiro; pravilna 1. faza pri 4 in 6 vaje še ne reši).
  preveriSPomocjo=(f)=>{skrijPomoc();preveri(f,fb);if(vajaResena)odprto=null;pokaziPomoc();napisiPomoci();};

  peekRow.appendChild(hintBtn);peekRow.appendChild(solBtn);
  div.appendChild(peekRow);
  div.appendChild(hintOverlay);
  div.appendChild(solOverlay);

  area.appendChild(div);
}

function checkPhase1(ex,M,cellEls,checkBtn,nextBtn,fb,phase2){
  if(M.isSingle){checkSingle(ex,M,cellEls,checkBtn,nextBtn,fb);return;}
  // Swordfish: 6-9 celic, X-Wing: natanko 4, ostalo: natanko pickN
  if(M.isSwordfish){
    if(selected.length<6||selected.length>9){fb.className='fb err';fb.textContent='Izberi šest do devet celic (vse celice s to števko v treh vrsticah ali stolpcih).';return;}
  } else if(M.isXWing){
    if(selected.length!==4){fb.className='fb err';fb.textContent='Izberi natanko štiri celice.';return;}
  } else if(M.isXYChain){
    if(selected.length<4){fb.className='fb err';fb.textContent='Izberi vse celice verige – veriga ima vsaj štiri celice.';return;}
  } else if(M.isPointing||M.isBoxLine){
    if(selected.length<2||selected.length>3){fb.className='fb err';fb.textContent='Izberi dve ali tri celice.';return;}
  } else {
    if(selected.length!==M.pickN){fb.className='fb err';fb.textContent=`Izberi natanko ${{2:'dve celici',3:'tri celice',4:'štiri celice'}[M.pickN]}.`;return;}
  }

  if(M.isPointing||M.isBoxLine){
    // Vaja je stanje prave uganke (genPresek): pri dani števki je vzorec v bloku (1) oz.
    // v vrstici/stolpcu (2) en sam - korak motorja, ki ga je generator izbral. Motor na
    // delni mreži se ne kliče, ker bi skrite celice štel za dane in sprejel tudi vzorce,
    // ki jih iz prikazanega ni mogoče utemeljiti.
    const selSet=new Set(selected);
    const prav=selSet.size===ex.solutionCells.length&&ex.solutionCells.every(c=>selSet.has(c));
    stej(prav);
    if(prav){
      fb.className='fb ok';
      fb.innerHTML=`<b>Pravilno!</b> ${ex.solutionMessage}`;
      presek.pokaziKorak(true);
      legendaOdgovora=legendaKoraka({eliminate:ex.solutionEliminate},true);
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      const where=M.isPointing?'bloku':(ex.primaryType==='row'?'vrstici':'stolpcu');
      const target=M.isPointing?'eno vrstico ali stolpec':'en blok';
      fb.className='fb err';
      fb.innerHTML=`<b>To še ni pravi vzorec.</b> Izberi tiste dve ali tri celice, kjer je kandidat ${ex.digit} v ${where} omejen na ${target}.`;
      selected=[];presek.izrisi();
    }
    return;
  }

  if(M.isXYWing||M.isUR||M.isTurbot||M.isWWing||M.isXYChain){
    // Jedro zaznave je ista koda kot v reševalcu (shared/engine.js xyWing() /
    // uniqueRectangle() / turbotFish() / wWing() / xyChain()). Pri XY-verigi so celice koraka
    // vse celice verige (4-8). Ujemanje se preverja samo po množici izbranih
    // celic - sprejme katero koli veljavno kombinacijo, ne le tiste iz generatorja.
    // (Pri Turbot Fish generator zagotovi, da so na deski vaje vsi vzorci na
    // označeni številki.)
    const techFn=M.isXYWing?xyWing:M.isUR?uniqueRectangle:M.isWWing?wWing:M.isXYChain?xyChain:turbotFish;
    const fakeBoard={grid:ex.boardGrid,cand:ex.boardCand};
    const selSet=new Set(selected.map(si=>ex.slots[si].idx));
    const match=techFn(fakeBoard).find(s=>s.cells.length===selSet.size&&s.cells.every(c=>selSet.has(c)));
    stej(!!match);
    if(match){
      const idxToSi=new Map(ex.slots.map((s,si)=>[s.idx,si]));
      fb.className='fb ok';
      fb.innerHTML=`<b>Pravilno!</b> ${match.message}`;
      selected.forEach(si=>cellEls[si].classList.add('correct'));
      match.eliminate.forEach(([cidx,dig])=>{
        const si=idxToSi.get(cidx);if(si===undefined)return;
        cellEls[si].classList.add('elimcell');
        const cd=malaStevka(cellEls[si],dig);
        if(cd) cd.classList.add('elim');
      });
      // XY-veriga (O4): zaporedne številke po vrsti najdene verige ostanejo.
      if(match.veriga) oznaciVerigo(cellEls,idxToSi,match.cells,false);
      legendaOdgovora=legendaOznak(cellEls,M,'odgovor');
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      fb.className='fb err';
      fb.innerHTML=M.isXYWing
        ? '<b>To še ni veljavno XY-krilo.</b> Pivot mora imeti natanko dva kandidata, <b>obe krili</b> morata pivota videti (ista vrstica, stolpec ali blok) in si z njim deliti po eno števko, skupna pa jima mora biti tretja števka.'
        : M.isWWing
        ? '<b>To še ni veljavno W-krilo.</b> Celici para morata imeti natanko isti par kandidatov in se <b>ne</b> videti. Celici povezave morata biti edini celici v svoji vrstici, stolpcu ali bloku z drugo števko para, nobena od njiju ne sme biti celica para, in vsaka mora videti po eno celico para.'
        : M.isXYChain
        ? '<b>To še ni veljavna XY-veriga.</b> Vsaka celica verige mora imeti natanko dva kandidata, zaporedni celici se morata videti (ista vrstica, stolpec ali blok) in imeti skupen kandidat, oba konca pa isto števko z. Izberi vse celice verige – vsaj štiri.'
        : M.isTurbot
        ? `<b>To še ni veljavna veriga ene števke.</b> Potrebuješ dve povezavi – vrstici, stolpca ali vrstico in stolpec, kjer je ${ex.digit} mogoča samo v dveh celicah; en konec prve in en konec druge povezave se morata videti (ista vrstica, stolpec ali blok).`
        : '<b>To še ni veljaven edinstveni pravokotnik.</b> Potrebuješ štiri vogale pravokotnika v dveh vrsticah in dveh stolpcih, ki ležijo v <b>natanko dveh blokih</b>: trije z natanko istim parom kandidatov, četrti z istim parom in še dodatnimi.';
      selected.forEach(si=>cellEls[si].classList.remove(M.selClass));selected=[];
    }
    return;
  }

  if(M.isXWing||M.isSwordfish){
    const expSize=M.isSwordfish?3:2;
    const rows=new Set(selected.map(idx=>(idx/9|0)));
    const cols=new Set(selected.map(idx=>idx%9));
    if(!selected.every(idx=>ex.grid[idx])){
      fb.className='fb err';fb.innerHTML=`<b>Ena od celic nima števke ${ex.digit}.</b>`;
      selected.forEach(idx=>cellEls[idx].classList.remove('xw-selected'));selected=[];
      return;
    }
    // Preveri obe smeri
    let valid=false, usedBases=[], usedCrosses=[], baseIsRow=true, elimNow=[];
    if(M.isSwordfish){
      // Jedro zaznave vzorca in izračun izbrisov je ista koda kot v reševalcu
      // (shared/engine.js swordfish()) - sprejme katero koli veljavno kombinacijo
      // izbranih celic, ne samo tisto, ki jo je sestavil generator.
      const bit=1<<ex.digit;
      const fakeBoard={grid:new Array(81).fill(0),cand:ex.grid.map(has=>has?bit:0)};
      const selSet=new Set(selected);
      const match=swordfish(fakeBoard).find(s=>s.cells.length===selSet.size&&s.cells.every(c=>selSet.has(c)));
      if(match){
        valid=true;
        elimNow=match.eliminate.map(([c])=>c);
        // Katera os je "baza" - samo za izpis besedila spodaj (shared koda tega ne vrača).
        baseIsRow=[...rows].every(r=>{
          let count=0,ok=true;
          for(let i=0;i<9;i++){ if(ex.grid[r*9+i]){count++; if(!cols.has(i)) ok=false;} }
          return ok&&count>=2&&count<=3;
        });
        usedBases=baseIsRow?[...rows]:[...cols];
        usedCrosses=baseIsRow?[...cols]:[...rows];
      }
    } else {
      for(const tryRow of [true,false]){
        const baseSet=tryRow?rows:cols;
        const crossSet=tryRow?cols:rows;
        if(baseSet.size!==expSize||crossSet.size<2||crossSet.size>expSize) continue;
        let ok=true;
        for(const b of baseSet){
          let count=0;
          for(let i=0;i<9;i++){
            const idx=tryRow?b*9+i:i*9+b;
            if(ex.grid[idx]){
              count++;
              // Preveri da je ta pojavitev znotraj crossSet
              const crossIdx=tryRow?i:i;
              if(!crossSet.has(crossIdx)){ok=false;break;}
            }
          }
          if(!ok) break;
          if(count<2||count>expSize){ok=false;break;}
        }
        if(ok){
          valid=true;
          usedBases=[...baseSet];
          usedCrosses=[...crossSet];
          baseIsRow=tryRow;
          break;
        }
      }
      if(valid){
        for(const cr of usedCrosses){
          for(let i=0;i<9;i++){
            const idx=baseIsRow?i*9+cr:cr*9+i;
            const realBase=baseIsRow?Math.floor(idx/9):idx%9;
            if(usedBases.includes(realBase)) continue;
            if(ex.grid[idx]) elimNow.push(idx);
          }
        }
      }
    }
    stej(valid);
    if(valid){
      const typeLabel=M.isSwordfish?(baseIsRow?'Vrstična':'Stolpčna'):(baseIsRow?'Vrstično':'Stolpčno');
      const techName=M.isSwordfish?'mečarica':'X-krilo';
      const baseWord=baseIsRow?'vrsticah':'stolpcih';
      const baseLabel=usedBases.map(b=>(baseIsRow?'V':'S')+(b+1)).join(', ');
      const crossLabel=usedCrosses.map(c=>(baseIsRow?'S':'V')+(c+1)).join(', ');
      const crossWord=baseIsRow?'stolpcih':'vrsticah';
      fb.className='fb ok';
      fb.innerHTML=`<b>Pravilno! (${typeLabel} ${techName})</b> Števka ${ex.digit} je v ${expSize===2?'dveh':'treh'} ${baseWord} (${baseLabel}) mogoča samo v ${crossWord} ${crossLabel} → iz preostanka teh ${baseIsRow?'stolpcev':'vrstic'} jo izbrišeš.`;
      selected.forEach(idx=>cellEls[idx].classList.add(M.isSwordfish?'xw-sf-correct':'xw-correct'));
      elimNow.forEach(idx=>cellEls[idx].classList.add('xw-elim'));
      legendaOdgovora=legendaOznak(cellEls,M,'odgovor');
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      const rArr=[...rows],cArr=[...cols];
      let detail=`Izbrane celice so v ${rows.size} ${rows.size===1?'vrstici':'vrsticah'} in ${cols.size} ${cols.size===1?'stolpcu':'stolpcih'}. `;
      if(M.isSwordfish){
        detail+=`Za mečarico potrebuješ tri ${rows.size===3?'vrstice':'stolpce'}, v vsaki dve ali tri celice s števko, vse v istih treh ${rows.size===3?'stolpcih':'vrsticah'}.`;
      } else {
        const rCounts=rArr.map(r=>{let n=0;for(let i=0;i<9;i++)if(ex.grid[r*9+i])n++;return n;});
        detail+=`Po vrsticah: ${rArr.map((r,i)=>'V'+(r+1)+'='+rCounts[i]+'×').join(', ')}. `;
        const cCounts=cArr.map(c=>{let n=0;for(let i=0;i<9;i++)if(ex.grid[i*9+c])n++;return n;});
        detail+=`Po stolpcih: ${cArr.map((c,i)=>'S'+(c+1)+'='+cCounts[i]+'×').join(', ')}.`;
      }
      fb.className='fb err';fb.innerHTML=`<b>Ni ${M.isSwordfish?'prava mečarica':'pravo X-krilo'}.</b> ${detail}`;
      selected.forEach(idx=>cellEls[idx].classList.remove('xw-selected'));selected=[];
    }
    return;
  }

  if(M.hasPhase2){
    // Faza 1: preveri samo ali so celice pravilne (hidden pair ali hidden triple)
    const s=[...selected].sort((a,b)=>a-b),t=[...ex.targetSlots].sort((a,b)=>a-b);
    const cellsOk=s.length===t.length&&s.every((v,i)=>v===t[i]);
    if(cellsOk){
      const p2n=M.phase2pick||2;
      const word=p2n===2?'Celici sta pravilni':'Celice so pravilne';
      fb.className='fb ok';fb.innerHTML=`<b>${word}!</b> Zdaj izberi, ${p2n===2?'kateri dve števki tvorita par':'katere tri števke tvorijo trojico'}.`;
      s.forEach(si=>cellEls[si].classList.add('correct'));
      checkBtn.style.display='none';phase2.style.display='block';
      cellEls.forEach(c=>{c.classList.remove('selectable');c.style.pointerEvents='none';});
    } else {
      fb.className='fb err';fb.innerHTML=`<b>Niso prave celice.</b> Poišči ${M.pickN===2?'dve števki, ki sta v enoti mogoči samo v istih dveh celicah, in izberi ti celici':'tri števke, ki so v enoti mogoče samo v istih treh celicah, in izberi te celice'}.`;
      cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
    }
    return;
  }

  // Naked pair / triple
  let union=new Set(),allOk=true;
  for(const si of selected){const s=ex.slots[si];if(!s.c){allOk=false;break;}s.c.forEach(d=>union.add(d));}
  const sorted=[...selected].sort((a,b)=>a-b);
  const target=[...ex.targetSlots].sort((a,b)=>a-b);
  const isTarget=sorted.every((v,i)=>v===target[i]);
  const isValid=allOk&&union.size===M.pickN;

  // Izbira dane (fiksne) celice se ne šteje.
  if(allOk) stej(isTarget||isValid);

  if(isTarget||isValid){
    const ds=isTarget?new Set(ex.targetDigits):union;
    const ps=isTarget?ex.targetSlots:sorted;
    fb.className='fb ok';
    // Pri načrtovanem vzorcu pokažemo sporočilo iz shared/engine.js (pove tudi, kje
    // kandidati odpadejo); če je uporabnik našel drug veljaven par/trojico, sporočilo
    // generatorja zanj ne velja, zato besedilo sestavimo iz njegove izbire.
    fb.innerHTML=`<b>Pravilno!</b> ${isTarget&&ex.solutionMessage
      ? ex.solutionMessage
      : `{${[...ds].sort((a,b)=>a-b).join(', ')}} v ${ps.map(p=>ex.slots[p].pos).join(', ')}.`}`;
    ps.forEach(si=>{cellEls[si].classList.add('correct');cellEls[si].querySelectorAll('.cd').forEach(cd=>{if(ds.has(+cd.dataset.d)&&!cd.classList.contains('hide'))cd.classList.add('hl',M.hlClass);});});
    oznaciStevke(cellEls,izbrisPodmnozice(ex,M,ps,ds),'elim');
    legendaOdgovora=legendaOznak(cellEls,M,'odgovor');
    checkBtn.style.display='none';nextBtn.style.display='inline-block';
  } else if(!allOk){
    fb.className='fb err';fb.textContent='Ena od izbranih celic je fiksna.';cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni ${M.pickN===2?'par':'trojica'}.</b> Izbrane celice imajo skupaj kandidate {${[...union].sort((a,b)=>a-b).join(', ')}} – ${M.pickN===2?'par jih ima natanko dva':'trojica jih ima natanko tri'}.`;
    cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
  }
}

// Enojčka: odgovor je vpis števke v celico. Presodi preveriEnojcek() (shared/vaje-uganka.js)
// s koraki motorja na mreži vaje; 'nevtralno' (prava števka, a ne po tej tehniki) se ne
// šteje - tako kot izbira dane celice pri parih. Celica je izbira plošče (enojcek).
function checkSingle(ex,M,cellEls,checkBtn,nextBtn,fb){
  const celica=enojcek.plosca.enaIzbrana();
  if(celica===null){fb.className='fb err';fb.textContent='Izberi prazno celico.';return;}
  if(!pickedDigits.length){fb.className='fb err';fb.textContent='Izberi števko, ki jo vpišeš.';return;}
  const stevka=pickedDigits[0];
  const r=preveriEnojcek(ex,celica,stevka);
  // Vnaprej izbrana celica ali števka (postopnost, vaje 1-3) ostane izbrana - celice
  // pocistiIzbiro() ne odizbere, ker ni spremenljiva.
  const o=ex.oznaka||{};
  const pocisti=()=>{
    enojcek.plosca.pocistiIzbiro();enojcek.plosca.izrisi();
    if(!o.stevka){pickedDigits=[];enojcek.stevke.forEach(b=>b.classList.remove('picked'));}
  };
  if(r.izid==='prav'){
    stej(true);
    fb.className='fb ok';fb.innerHTML=`<b>Pravilno!</b> ${r.sporocilo}`;
    enojcek.resi(celica,stevka);
    checkBtn.style.display='none';nextBtn.style.display='inline-block';
  } else if(r.izid==='nevtralno'){
    fb.className='fb err';fb.innerHTML=`<b>Še ne.</b> ${r.sporocilo}`;
    pocisti();
  } else {
    stej(false);
    fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> ${r.sporocilo}`;
    pocisti();
  }
}

function checkPhase2(ex,M,cellEls,ch2,nextBtn,fb){
  const p2n=M.phase2pick||2;
  if(pickedDigits.length!==p2n){fb.className='fb err';fb.textContent=`Izberi natanko ${p2n===2?'dve števki':'tri števke'}.`;return;}
  const s=[...pickedDigits].sort((a,b)=>a-b),t=[...ex.targetDigits].sort((a,b)=>a-b);
  const correct=s.length===t.length&&s.every((v,i)=>v===t[i]);
  stej(correct);

  if(correct){
    const ds=new Set(t);
    const cellNames=ex.targetSlots.map(p=>ex.slots[p].pos).join(', ');
    fb.className='fb ok';
    // Sporočilo motorja šele tu (2. faza) - po 1. fazi bi izdalo številke, ki jih
    // mora uporabnik šele izbrati.
    fb.innerHTML=`<b>Pravilno!</b> ${ex.solutionMessage
      || `{${t.join(', ')}} so v enoti mogoče samo v ${cellNames}. Iz teh celic izbrišeš vse druge kandidate.`}`;
    ex.targetSlots.forEach(si=>{cellEls[si].querySelectorAll('.cd').forEach(cd=>{if(cd.classList.contains('hide'))return;if(ds.has(+cd.dataset.d))cd.classList.add('hl',M.hlClass);});});
    oznaciStevke(cellEls,izbrisPodmnozice(ex,M,ex.targetSlots,ds),'elim');
    legendaOdgovora=legendaOznak(cellEls,M,'odgovor');
    ch2.style.display='none';nextBtn.style.display='inline-block';
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> Poišči ${p2n===2?'dve števki, ki sta v enoti mogoči samo v teh dveh celicah':'tri števke, ki so v enoti mogoče samo v teh treh celicah'}.`;
    document.querySelectorAll('.digit-btns button').forEach(b=>b.classList.remove('picked'));pickedDigits=[];
  }
}

// Edino mesto, ki spremeni rezultat: poskus trenutne vaje (pravilen ali napačen).
function stej(pravilno){
  stetoObPreveri=true;
  if(pravilno) vajaResena=true;
  if(!pomocVaje){
    scoreTotal++;vajaVseh++;
    if(pravilno){scoreRight++;vajaPrav++;}
  }
  updateScore();
}

// Ogled namiga ali rešitve: vaja se ne šteje - že šteti poskusi se odštejejo.
function oznaciPomoc(){
  if(pomocVaje||vajaResena) return;
  pomocVaje=true;sPomocjo++;
  scoreTotal-=vajaVseh;scoreRight-=vajaPrav;vajaVseh=0;vajaPrav=0;
  updateScore();
}

// Legenda oznak po pravilnem odgovoru (legendaOznak ali legendaKoraka) - nastavi jo preverjanje,
// preveri() jo doda pod sporočilo (za oznako "s pomočjo").
let legendaOdgovora=null;
// Preverjanje odgovora; če je bil poskus ocenjen pri vaji s pomočjo, sporočilo to pove.
function preveri(f,fb){
  stetoObPreveri=false;legendaOdgovora=null;
  f();
  if(stetoObPreveri&&pomocVaje){
    const o=document.createElement('span');o.className='s-pomocjo';o.textContent=' (s pomočjo – ne šteje)';
    fb.appendChild(o);
  }
  if(legendaOdgovora) fb.appendChild(legendaOdgovora);
}

function updateScore(){
  document.getElementById('scoreRight').textContent=scoreRight;
  document.getElementById('scoreTotal').textContent=scoreTotal;
  document.getElementById('scorePercent').textContent=scoreTotal>0?Math.round(scoreRight/scoreTotal*100)+'%':'';
  document.getElementById('scorePomoc').textContent=sPomocjo?` · s pomočjo: ${sPomocjo}`:'';
}
