/* trening/v-uganki.js — način »Vadi v uganki« (docs/vadi-v-uganki-nacrt.md; del 6 načrta
   docs/trening-v-uganki-nacrt.md): pravo stanje uganke, v katerem je naslednji korak
   motorja izbrana tehnika. Vaja je igra z začetnimi potezami (vpisi in izbrisi poti,
   vajaIzStanja() v shared/vaje-uganka.js), igralec jo rešuje na plošči iz
   shared/plosca.js z istimi pripomočki kot v igri.
   Naloži se za trening/generators.js in pred trening/trening.js; uporablja stanje
   treninga (mode, exNum, area, MAX_EX, TEHNIKA_VAJE, vecHkratiKrog ...), trening.js pa
   od tu kliče renderVadi() in vadiPrekini(). */

// Iskanje vaje: najprej sproti (nove minimalne uganke) do meje, nato banka vaj.
const VADI_MEJA_MS=1000;
// Ura iskanja (test jo nadomesti).
let vadiZdaj=()=>Date.now();
// Trenutna vaja: { v (vaja iz vajaIzStanja), stanje, plosca } ali null.
let vadi=null;
// Žeton iskanja: nova vaja, "Nazaj" in nova tehnika ga povečajo - staro iskanje se ustavi.
let vadiIskanje=0;
// Zapisi banke (semena), uporabljeni v tej seji, po tehnikah - ko jih zmanjka, znova.
const vadiUporabljene={};
// Kljukica "pokaži prečrtane" ostane med vajami kroga (ne shranjuje se).
let precrtaniKrog=false;

function vadiPrekini(){vadiIskanje++;vadi=null;}

function vEl(tag,cls,besedilo){const e=document.createElement(tag);if(cls)e.className=cls;if(besedilo)e.textContent=besedilo;return e;}
function vKljukica(besedilo){const l=vEl('label'),i=vEl('input');i.type='checkbox';l.append(i,besedilo);return{l,i};}

/* ---------- iskanje vaje ---------- */

// Vaja iz banke: naključen zapis s tehniko, ki v tej seji še ni bil uporabljen.
function vajaIzBanke(kljuc){
  const uganke=VAJE_BANKA.filter(z=>z.tehnike.includes(kljuc));
  const upor=vadiUporabljene[kljuc]||(vadiUporabljene[kljuc]=new Set());
  for(;;){
    let proste=uganke.filter(z=>!upor.has(z.seme));
    if(!proste.length){upor.clear();proste=uganke;}
    const z=proste[Math.floor(Math.random()*proste.length)];
    upor.add(z.seme);
    const v=vajaIzUganke(z.danosti,kljuc,Math.random);
    if(v){v.izvor={vrsta:'banka',seme:z.seme};return v;}
  }
}

// Sproti: po ena minimalna uganka na setTimeout (vmesnik ostane odziven, deluje tudi pri
// file://), dokler ena nima stanja vaje; meja se preverja med ugankami. Nato banka.
function najdiVajo(kljuc,obNajdeni){
  const zeton=++vadiIskanje,zacetek=vadiZdaj();
  const korak=()=>{
    if(zeton!==vadiIskanje) return;
    if(vadiZdaj()-zacetek>=VADI_MEJA_MS){obNajdeni(vajaIzBanke(kljuc));return;}
    const seme=genNaklucnoSeme(),danosti=genMinimalnaUganka(seme);
    const{stanja,stopnja}=stanjaVUganki(danosti,kljuc);
    const v=stanja.length?vajaIzStanja(danosti,kljuc,stanja[Math.floor(Math.random()*stanja.length)],stopnja):null;
    if(v){v.izvor={vrsta:'sproti',seme};obNajdeni(v);return;}
    setTimeout(korak,0);
  };
  setTimeout(korak,0);
}

/* ---------- zaslon vaje ---------- */

// "V tem stanju je že odstranjenih 11 kandidatov (prejšnji koraki)."
function prejOdstranjenihBesedilo(n){
  if(!n) return 'V tem stanju ni prej odstranjenih kandidatov.';
  const m=n%100;
  const[gl,pr,sam]=m===1?['je','odstranjen','kandidat']:m===2?['sta','odstranjena','kandidata']
    :m===3||m===4?['so','odstranjeni','kandidati']:['je','odstranjenih','kandidatov'];
  return `V tem stanju ${gl} že ${pr} ${n} ${sam} (prejšnji koraki).`;
}

function vadiOznaka(kljuc){
  return vEl('p','ex-label',`${imeTehnike(kljuc,{stevilka:true})} · Vadi v uganki · Vaja ${exNum+1} / ${MAX_EX}`);
}

// Nova vaja kroga: izpiše "Iščem vajo …" in poišče vajo.
function renderVadi(){
  const kljuc=TEHNIKA_VAJE[mode],n=exNum;
  selected=[];pickedDigits=[];presek=null;
  pomocVaje=false;vajaResena=false;vajaPrav=0;vajaVseh=0;
  area.innerHTML='';
  const div=vEl('div','exercise');
  div.appendChild(vadiOznaka(kljuc));
  div.appendChild(vEl('p','vadi-isce','Iščem vajo …'));
  area.appendChild(div);
  najdiVajo(kljuc,v=>{if(nacin==='uganka'&&exNum===n) izrisiVadi(v);});
}

function izrisiVadi(v){
  const kljuc=v.kljuc,enoj=jeEnojcek(kljuc);
  let stanje=v.S0;
  area.innerHTML='';
  const div=vEl('div','exercise');
  div.appendChild(vadiOznaka(kljuc));
  div.appendChild(vEl('h3',null,enoj
    ?(kljuc==='Gol enojček'?'Poišči celico z eno samo možno števko in jo vpiši.':'Poišči števko z enim samim mestom v enoti in jo vpiši.')
    :`Poišči korak tehnike ${imeTehnike(kljuc,{anglesko:false})} in odstrani kandidate, ki jih izloči.`));
  div.appendChild(vEl('p','desc',TEHNIKE_OPISI[mode].razlaga));

  // Stopnja uganke (samo informacija, tudi "Presega tehnike"), izvor vaje v title.
  const info=vEl('div','vaja-info');
  const st=vEl('span',null,`Uganka: ${v.stopnja||'–'}`);
  st.title=`${v.izvor.vrsta==='banka'?'Vaja iz banke':'Vaja iz sproti ustvarjene uganke'} (seme ${v.izvor.seme})`;
  info.appendChild(st);
  let pk=null;
  if(!enoj){
    info.appendChild(vEl('span',null,prejOdstranjenihBesedilo(v.prejOdstranjenih)));
    if(v.prejOdstranjenih){
      pk=vKljukica(' pokaži prečrtane');pk.l.className='vec-hkrati';
      pk.l.title='Pokaži kandidate, odstranjene pred vajo, prečrtane (odgovor se ne spremeni).';
      pk.i.checked=precrtaniKrog;
      info.appendChild(pk.l);
    }
  }
  div.appendChild(info);

  // Plošča: niz Poudari, mreža z robovi in seznami, stikala seznamov.
  const wrap=vEl('div','vaja-uganka');div.appendChild(wrap);
  const glava=vEl('div','poudari-glava');
  const vh=vKljukica(' več hkrati');vh.l.className='vec-hkrati';
  vh.i.checked=vecHkratiKrog;
  vh.i.addEventListener('change',()=>{vecHkratiKrog=vh.i.checked;});
  const kljukice=vEl('span','kljukice');kljukice.append(vh.l);
  glava.append(vEl('span','niz-oznaka','Poudari števko'),kljukice);
  wrap.appendChild(glava);
  const nizP=vEl('div','niz niz-poudari');nizP.setAttribute('role','group');nizP.setAttribute('aria-label','Poudari števko');
  wrap.appendChild(nizP);
  const okvir=vEl('div','mreza-okvir z-robovi'),mEl=vEl('div');
  const seznam=(cls,opis)=>{const s=vEl('div','seznam '+cls);s.hidden=true;s.setAttribute('aria-label',opis);return s;};
  const sV=seznam('seznam-vrstic','Manjkajoče števke v vrsticah'),sS=seznam('seznam-stolpcev','Manjkajoče števke v stolpcih');
  okvir.append(mEl,sV,sS);wrap.appendChild(okvir);
  wrap.appendChild(vEl('div','g9-note','Temne števke so dane, modre so vpisane na poti do te vaje.'));
  const stikalaEl=vEl('div','seznami-stikala');stikalaEl.setAttribute('role','group');stikalaEl.setAttribute('aria-label','Prikaz seznamov');
  const kV=vKljukica(' Vrstice'),kS=vKljukica(' Stolpci'),kB=vKljukica(' Bloki');
  stikalaEl.append(vEl('span','niz-oznaka','Manjkajoče števke'),kV.l,kS.l,kB.l);
  wrap.appendChild(stikalaEl);
  const sB=seznam('seznam-blokov','Manjkajoče števke v blokih');wrap.appendChild(sB);

  const plosca=ustvariPlosco({
    mreza:mEl,robovi:true,kandidati:!enoj,samoEna:enoj,
    nizPoudari:nizP,vecHkrati:vh.i,
    seznami:{vrstice:sV,stolpci:sS,bloki:sB},stikala:{vrstice:kV.i,stolpci:kS.i,bloki:kB.i},
    postavitev:wrap,kljucSeznamov:'sudoku.trening.seznami',
    vir:()=>({igra:v.igra,stanje}),
    obSpremembi:()=>{const prej=stanje;stanje=stanjeIgre(v.igra);plosca.poSpremembi(prej);plosca.izrisi();},
    // E1/E2: brez kandidatov, izbrati je mogoče samo prazne celice, brez senčenja sosed.
    spremenljiva:enoj?(i=>!stanje.grid[i]):undefined,
    pogled:()=>({
      ...(enoj?{sosede:null}:{}),
      precrtani:precrtaniKrog&&pk?stanje.zacetni.odstranjeni:null,
    }),
  });
  if(pk) pk.i.addEventListener('change',()=>{precrtaniKrog=pk.i.checked;plosca.izrisi();});
  plosca.izrisi();

  // Do dela 6b: vajo je mogoče samo preskočiti.
  const btnRow=vEl('div','btn-row');
  const nextBtn=vEl('button','pri pri-green',exNum<MAX_EX-1?'Naslednja vaja →':'Končaj');
  nextBtn.style.display='inline-block';
  nextBtn.addEventListener('click',()=>{exNum++;renderExercise();});
  btnRow.appendChild(nextBtn);div.appendChild(btnRow);

  area.appendChild(div);
  vadi={v,plosca,get stanje(){return stanje;}};
}
