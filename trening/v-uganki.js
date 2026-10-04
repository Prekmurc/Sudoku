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
// Kljukica "več celic" (točka 18 načrta): privzeto po tehniki - vklopljena, če je v banki
// pri več kot polovici korakov tehnike ista števka izbrisana iz 2+ celic (delezVecCelic()
// v shared/vaje-uganka.js). Igralčeva sprememba velja do konca kroga (null = privzeto).
const VADI_VEC_CELIC_PRAG=0.5;
let vecCelicKrog=null;
function vecCelicPrivzeto(kljuc){
  const d=delezVecCelic(VAJE_BANKA,kljuc);
  return d!==null&&d>VADI_VEC_CELIC_PRAG;
}

function vadiPrekini(){vadiIskanje++;vadi=null;}

function vEl(tag,cls,besedilo){const e=document.createElement(tag);if(cls)e.className=cls;if(besedilo)e.textContent=besedilo;return e;}
function vKljukica(besedilo){const l=vEl('label'),i=vEl('input');i.type='checkbox';l.append(i,besedilo);return{l,i};}

/* ---------- iskanje vaje ---------- */

// Uporabljeni zapisi banke za tehniko (Set semen) v tej seji.
const vadiUporabljeneZa=kljuc=>vadiUporabljene[kljuc]||(vadiUporabljene[kljuc]=new Set());

// Vaja iz banke: izberiIzBanke() (shared/vaje-uganka.js) - najnižji rang stopnje (osnovna
// stopnja tehnike, ko je zmanjka, naslednja ...) med zapisi, ki v tej seji še niso bili
// uporabljeni; ko so uporabljeni vsi, znova. Null, če tehnike v banki ni.
function vajaIzBanke(kljuc){
  const upor=vadiUporabljeneZa(kljuc);
  for(let i=0;i<1000;i++){
    const z=izberiIzBanke(VAJE_BANKA,kljuc,upor,Math.random);
    if(!z) return null;
    const v=vajaIzUganke(z.danosti,kljuc,Math.random);
    if(v){v.izvor={vrsta:'banka',seme:z.seme};return v;}
  }
  return null;
}

// Sproti: po ena minimalna uganka na setTimeout (vmesnik ostane odziven, deluje tudi pri
// file://). Takoj se vzame samo uganka osnovne stopnje tehnike (rang 0, točka 16 načrta);
// najboljša druga (najnižji rang) se zapomni. Ob meji se primerja z najnižjim rangom v
// banki: vzame se nižji rang, pri enakem sprotna (raznolikost). Če tehnike v banki ni in
// sproti še ni nič, iskanje teče naprej.
function najdiVajo(kljuc,obNajdeni){
  const zeton=++vadiIskanje,zacetek=vadiZdaj();
  let najboljsa=null; // { rang, danosti, stanja, stopnja, seme }
  const vzemi=c=>{
    const v=vajaIzStanja(c.danosti,kljuc,c.stanja[Math.floor(Math.random()*c.stanja.length)],c.stopnja);
    if(!v) return false;
    v.izvor={vrsta:'sproti',seme:c.seme};obNajdeni(v);return true;
  };
  const korak=()=>{
    if(zeton!==vadiIskanje) return;
    if(vadiZdaj()-zacetek>=VADI_MEJA_MS){
      if(najboljsa&&najboljsa.rang<=najnizjiRangBanke(VAJE_BANKA,kljuc,vadiUporabljeneZa(kljuc))&&vzemi(najboljsa)) return;
      const v=vajaIzBanke(kljuc);
      if(v){obNajdeni(v);return;}
      if(najboljsa&&vzemi(najboljsa)) return;
    }
    const seme=genNaklucnoSeme(),danosti=genMinimalnaUganka(seme);
    const{stanja,stopnja}=stanjaVUganki(danosti,kljuc);
    if(stanja.length){
      const c={rang:rangUganke(stopnja,kljuc),danosti,stanja,stopnja,seme};
      if(c.rang===0&&vzemi(c)) return;
      if(!najboljsa||c.rang<najboljsa.rang) najboljsa=c;
    }
    setTimeout(korak,0);
  };
  setTimeout(korak,0);
}

/* ---------- zaslon vaje ---------- */

// Kandidati, ki so jih odstranili prejšnji koraki poti (niso del naloge); besedilo je
// odvisno od kljukice "pokaži jih prečrtane" (prikazano).
function prejOdstranjenihBesedilo(n,prikazano=false){
  if(!n) return 'Prejšnji koraki niso izbrisali nobenega kandidata.';
  if(prikazano) return `Prečrtane kandidate (${n}) so izbrisali prejšnji koraki – niso del naloge.`;
  const m=n%100,sam=m===1||m===2?'kandidata':m===3||m===4?'kandidate':'kandidatov';
  return `Prejšnji koraki so že izbrisali ${n} ${sam} – niso del naloge.`;
}

// Postopnost v krogu (docs/vadi-v-uganki-nacrt.md, točka 15): vaje 1-6 imajo območje
// naključnega koraka tehnike (obmocjeKoraka), vaje 7-9 so brez (cela uganka).
const VADI_Z_OBMOCJEM=6;
function izberiObmocje(v){
  return exNum<VADI_Z_OBMOCJEM?obmocjeKoraka(v.KT[Math.floor(Math.random()*v.KT.length)]):null;
}
// Območje za izris mreže (pogled.obmocje v shared/mreza.js - okvir in temne oznake roba,
// točka 17 načrta) iz celic območja: ena celica - njena vrstica in stolpec, vse v eni
// vrstici ali stolpcu - ta vrstica ali stolpec, sicer (blok, dva bloka) vrstice in stolpci
// vseh celic. Uporablja ga tudi "Spoznaj" E1/E2 (trening.js).
function obmocjeZaMrezo(celice){
  if(!celice||!celice.length) return null;
  const vr=new Set(celice.map(c=>Math.floor(c/9))),st=new Set(celice.map(c=>c%9));
  if(celice.length>1&&vr.size===1) return{celice,vrstice:[...vr],stolpci:[]};
  if(celice.length>1&&st.size===1) return{celice,vrstice:[],stolpci:[...st]};
  return{celice,vrstice:[...vr],stolpci:[...st]};
}

// Legenda oznak koraka pod sporočilom (točka 17.3): jantarno = celice vzorca, rdeče
// prečrtano = izbrisi - po pravilnem odgovoru so odstranjeni, v "Rešitvi" še ne.
function legendaKoraka(korak,odstranjeni){
  const l=vEl('div','legenda-vaje');
  const vz=vEl('span');vz.append(vEl('span','sw sw-vzorec'),'celice vzorca');
  const iz=vEl('span');iz.append(vEl('span','izbris-vzorec',String(korak.eliminate[0][1])),
    odstranjeni?'izbrisani kandidati':'kandidat za izbris');
  l.append(vz,iz);
  return l;
}

// Ime tehnike v tožilniku za navodilo ("poišči skriti par").
const VADI_TOZILNIK={'Pointing pair/triple':'izločitev izven bloka','Box-line reduction':'izločitev v bloku',
  'Naked pair':'očitni par','Hidden pair':'skriti par','Naked triple':'očitno trojico','Hidden triple':'skrito trojico',
  'X-Wing':'X-krilo','Swordfish':'mečarico','Turbot Fish':'verigo ene števke','W-Wing':'W-krilo','XY-Wing':'XY-krilo',
  'Unique Rectangle':'edinstveni pravokotnik'};
// Tehnike ženskega spola ("izbriši kandidate, ki zaradi nje odpadejo"), druge "zaradi njega".
const VADI_ZENSKI=new Set(['Pointing pair/triple','Box-line reduction','Naked triple','Hidden triple','Swordfish','Turbot Fish']);
const velika=s=>s[0].toUpperCase()+s.slice(1);
// Navodilo nad mrežo; z območjem ga pove ("V vrstici 7 poišči skriti par ...", "Za števko 7
// poišči X-krilo ...").
function navodiloVadi(kljuc,ob){
  if(kljuc==='Gol enojček') return `${ob?velika(ob.opis)+' poišči':'Poišči'} celico, v kateri je mogoča samo ena števka, in jo vpiši.`;
  if(kljuc==='Skriti enojček') return ob?`${velika(ob.opis)} poišči števko, ki je mogoča samo v eni celici, in jo vpiši.`
    :'Poišči števko, ki je v vrstici, stolpcu ali bloku mogoča samo v eni celici, in jo vpiši.';
  const t=VADI_TOZILNIK[kljuc];
  const izbrisi=`izbriši kandidate, ki zaradi ${VADI_ZENSKI.has(kljuc)?'nje':'njega'} odpadejo.`;
  if(!ob) return `Poišči ${t} in ${izbrisi}`;
  if(ob.vrsta==='pivot') return `Poišči ${t} ${ob.opis} in ${izbrisi}`;
  return `${velika(ob.opis)} poišči ${t} in ${izbrisi}`;
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

// Vaja na zaslonu; ob = območje (izberiObmocje - vaje 1-6) ali null. 1-12: odgovor so
// izbrisi kandidatov S0 (niz Odstrani, več celic,
// Shift+števka), presodi ga preveriVajo() ob "Preveri". E1/E2: mreža brez kandidatov,
// odgovor je predlog vpisa v celici (niz Vpiši z vsemi 9 števkami, tipka s števko),
// presodi ga preveriVajo() s predlogom (preveriEnojcek); pravilen predlog postane poteza.
function izrisiVadi(v,ob=izberiObmocje(v)){
  const kljuc=v.kljuc,enoj=jeEnojcek(kljuc),skriti=kljuc==='Skriti enojček',M=MODES[mode];
  // Koraki tehnike v območju: iz njih sta Namig in Rešitev (pravilen je tudi korak zunaj).
  const KTob=v.KT.filter(k=>vObmocju(k,ob));
  // Pri E1/E2 z območjem je izbrati mogoče samo prazne celice v enoti (kot v "Spoznaj").
  const vEnoti=i=>!ob||!enoj||ob.celice.includes(i);
  let stanje=v.S0;
  // Po pravilnem odgovoru: korak odgovora (1-12: oznake na mreži, izbrisi rdeče prečrtani)
  // ali vpis odgovora (E1/E2: [celica, števka]).
  let odgovor=null;
  // E1/E2: predlog vpisa { celica, stevka } ali null - ni poteza, "Preveri" ga presodi.
  let predlog=null;
  area.innerHTML='';
  const div=vEl('div','exercise');
  div.appendChild(vadiOznaka(kljuc));
  div.appendChild(vEl('h3',null,navodiloVadi(kljuc,ob)));
  div.appendChild(vEl('p','desc',TEHNIKE_OPISI[mode].povzetek+(!ob?'':ob.celice?' Območje je na mreži uokvirjeno.'
    :ob.stevke.length>1?' Števki sta poudarjeni.':' Števka je poudarjena.')));
  div.appendChild(razdelekRazlaga(mode));

  // Stopnja uganke (samo informacija, tudi "Presega tehnike"), izvor vaje v title.
  const info=vEl('div','vaja-info');
  // Pri "Presega tehnike" (skrajni primer, točka 16.6) kratko pojasnilo, da za vajo ni
  // pomembno.
  const presega=v.stopnja===OCENA_PRESEGA;
  const st=vEl('span',null,`Uganka: ${v.stopnja||'–'}${presega?' – za to vajo ni pomembno':''}`);
  st.title=(presega?'Uganke brez ugibanja ni mogoče rešiti do konca; vaja je korak pred mestom, kjer bi bilo treba ugibati. ':'')
    +`${v.izvor.vrsta==='banka'?'Vaja iz banke':'Vaja iz sproti ustvarjene uganke'} (seme ${v.izvor.seme})`;
  info.appendChild(st);
  let pk=null;
  let prejEl=null;
  if(!enoj){
    prejEl=vEl('span','prej-odstranjeni',prejOdstranjenihBesedilo(v.prejOdstranjenih,precrtaniKrog));
    info.appendChild(prejEl);
    if(v.prejOdstranjenih){
      pk=vKljukica(' pokaži jih prečrtane');pk.l.className='vec-hkrati';
      pk.l.title='Kandidate so izbrisali koraki na poti do te vaje. Niso del odgovora – izbriši samo kandidate, ki zaradi iskanega koraka odpadejo.';
      pk.i.checked=precrtaniKrog;
      info.appendChild(pk.l);
    }
  }
  div.appendChild(info);

  // Plošča: niz Poudari, mreža z robovi in seznami, pri 1-12 niz Odstrani, vrstica z
  // razlogom in Razveljavi/Ponovi/Začni znova, stikala seznamov.
  const wrap=vEl('div','vaja-uganka');div.appendChild(wrap);
  const glava=vEl('div','poudari-glava');
  const vh=vKljukica(' več hkrati');vh.l.className='vec-hkrati';
  vh.i.checked=vecHkratiKrog;
  vh.i.addEventListener('change',()=>{vecHkratiKrog=vh.i.checked;});
  const kljukice=vEl('span','kljukice');
  // "Senči" (samo E1/E2, kot v "Spoznaj"): ob eni poudarjeni števki zasenči celice, kamor
  // ne more. Pri E2 je vaja s prikazanim senčenjem vaja s pomočjo.
  let sc=null;
  if(enoj){
    sc=vKljukica(' senči');sc.l.className='vec-hkrati';
    sc.l.title='Zasenči celice, kamor poudarjena števka ne more (samo ob eni poudarjeni števki).'
      +(skriti?' Pri skritem enojčku se vaja s senčenjem šteje kot vaja s pomočjo.':'');
    sc.i.checked=senciKrog;
    sc.i.addEventListener('change',()=>{senciKrog=sc.i.checked;});
    kljukice.append(sc.l);
  }
  kljukice.append(vh.l);
  glava.append(vEl('span','niz-oznaka','Poudari števko'),kljukice);
  wrap.appendChild(glava);
  const nizP=vEl('div','niz niz-poudari');nizP.setAttribute('role','group');nizP.setAttribute('aria-label','Poudari števko');
  wrap.appendChild(nizP);
  const okvir=vEl('div','mreza-okvir z-robovi'),mEl=vEl('div');
  const seznam=(cls,opis)=>{const s=vEl('div','seznam '+cls);s.hidden=true;s.setAttribute('aria-label',opis);return s;};
  const sV=seznam('seznam-vrstic','Manjkajoče števke v vrsticah'),sS=seznam('seznam-stolpcev','Manjkajoče števke v stolpcih');
  okvir.append(mEl,sV,sS);wrap.appendChild(okvir);
  wrap.appendChild(vEl('div','g9-note','Temne števke so dane, modre so vpisane na poti do te vaje.'));
  let nizO=null,nizV=null,vc=null,razlogEl=null,akcije=null,raz=null,pon=null,zn=null,zaznamki=null,zaznBtn=null,zaznPoc=null;
  if(enoj){
    const g=vEl('div','niz-oznaka');g.append('Vpiši v izbrano celico ');
    g.appendChild(vEl('span','niz-pojasnilo','· predlog'));
    wrap.appendChild(g);
    nizV=vEl('div','niz niz-vpisi');nizV.setAttribute('role','group');nizV.setAttribute('aria-label','Vpiši v izbrano celico');
    wrap.appendChild(nizV);
    razlogEl=vEl('div','niz-razlog');razlogEl.setAttribute('aria-live','polite');wrap.appendChild(razlogEl);
  }else{
    const g=vEl('div','niz-oznaka glava-s-kljukico');
    const o=vEl('span');o.append('Izbriši kandidata ');
    const poj=vEl('span','niz-pojasnilo','· ');poj.append(vEl('span','vzorec-vrni','↺'),' = vrni');
    o.appendChild(poj);
    vc=vKljukica(' več celic');vc.l.className='vec-hkrati';
    const vecPrivzeto=vecCelicPrivzeto(kljuc);
    vc.l.title='Izberi več celic in izbriši isto števko iz vseh (na računalniku tudi Ctrl+klik)'
      +(vecPrivzeto?'. Pri tej tehniki se v večini korakov ista števka izbriše iz več celic.':'');
    vc.i.checked=vecCelicKrog!==null?vecCelicKrog:vecPrivzeto;
    vc.i.addEventListener('change',()=>{vecCelicKrog=vc.i.checked;});
    g.append(o,vc.l);wrap.appendChild(g);
    nizO=vEl('div','niz niz-odstrani');nizO.setAttribute('role','group');nizO.setAttribute('aria-label','Izbriši kandidata');
    wrap.appendChild(nizO);
    razlogEl=vEl('div','niz-razlog');razlogEl.setAttribute('aria-live','polite');wrap.appendChild(razlogEl);
    akcije=vEl('div','akcije');
    raz=vEl('button',null,'↶ Razveljavi');raz.type='button';raz.title='Razveljavi (Ctrl+Z)';
    pon=vEl('button',null,'↷ Ponovi');pon.type='button';pon.title='Ponovi (Ctrl+Y)';
    zn=vEl('button',null,'↺ Začni znova');zn.type='button';zn.title='Vrni na začetek vaje (poteze ostanejo v »Ponovi«)';
    akcije.append(raz,pon,zn);wrap.appendChild(akcije);
    // Zaznamki (točka 17.2): izbrane celice dobijo obstojno oranžno črtkano obrobo, izbira
    // je nato spet prosta; niso poteze in ne štejejo kot pomoč; nova vaja jih pobriše.
    zaznamki=vEl('div','zaznamki');
    zaznBtn=vEl('button',null,'◩ Označi izbrane (O)');zaznBtn.type='button';
    zaznBtn.title='Izbrane celice označi (ali odznači) z obrobo – izbira je nato spet prosta';
    zaznPoc=vEl('button',null,'Počisti oznake');zaznPoc.type='button';
    zaznamki.append(zaznBtn,zaznPoc);wrap.appendChild(zaznamki);
  }
  const stikalaEl=vEl('div','seznami-stikala');stikalaEl.setAttribute('role','group');stikalaEl.setAttribute('aria-label','Prikaz seznamov');
  const kV=vKljukica(' Vrstice'),kS=vKljukica(' Stolpci'),kB=vKljukica(' Bloki');
  stikalaEl.append(vEl('span','niz-oznaka','Manjkajoče števke'),kV.l,kS.l,kB.l);
  wrap.appendChild(stikalaEl);
  const sB=seznam('seznam-blokov','Manjkajoče števke v blokih');wrap.appendChild(sB);

  const btnRow=vEl('div','btn-row');
  const checkBtn=vEl('button','pri '+M.btnClass,'Preveri');
  const nextBtn=vEl('button','pri pri-green',exNum<MAX_EX-1?'Naslednja vaja →':'Končaj');
  nextBtn.addEventListener('click',()=>{exNum++;renderExercise();});
  btnRow.append(checkBtn,nextBtn);div.appendChild(btnRow);
  const fb=vEl('div','fb');div.appendChild(fb);

  // Pomoč (6c): "Namig" in "Rešitev" s klikom, okvir ostane do "Skrij" (ne "drži" kot v
  // "Spoznaj"). Vsak ogled = vaja s pomočjo (oznaciPomoc). pomoc = { vrsta: 'namig' |
  // 'resitev', korak } ali null; korak se izbere ob prvem odprtju in ostane, dokler je
  // okvir odprt.
  let pomoc=null;
  const pomocVrsta=vEl('div','peek-row');
  const namigBtn=vEl('button','sm-btn','Namig'),resitevBtn=vEl('button','sm-btn','Rešitev');
  namigBtn.type='button';resitevBtn.type='button';
  pomocVrsta.append(namigBtn,resitevBtn);div.appendChild(pomocVrsta);
  const pomocEl=vEl('div','vadi-pomoc');pomocEl.hidden=true;pomocEl.setAttribute('aria-live','polite');
  div.appendChild(pomocEl);
  // Korak iz KT, ki ima največ igralčevih izbrisov (pri enaki meri prvi); brez njih KT[0]
  // (= nextStep() v S0). E1/E2: naključen korak (kot v "Spoznaj").
  // Samo koraki v območju (KTob).
  function korakPomoci(){
    if(enoj) return KTob[Math.floor(Math.random()*KTob.length)];
    const izbrisanih=k=>k.eliminate.filter(([c,d])=>!stanje.grid[c]&&!(stanje.kandidati[c]&(1<<d))).length;
    return KTob.reduce((naj,k)=>izbrisanih(k)>izbrisanih(naj)?k:naj,KTob[0]);
  }
  function odpriPomoc(vrsta){
    oznaciPomoc();
    pomoc={vrsta,korak:pomoc?pomoc.korak:korakPomoci()};
    plosca.izrisi();izrisiPomoc();
  }
  function izrisiPomoc(){
    pomocEl.innerHTML='';pomocEl.hidden=!pomoc;
    if(!pomoc) return;
    const k=pomoc.korak,p=vEl('p','pomoc-msg');
    if(pomoc.vrsta==='namig'){
      // Enojčka: namig kot v "Spoznaj" - z območjem pove samo to, česar oznaka še ne.
      p.append(vEl('b',null,'Namig: '),enoj?namigEnojcka(!skriti,v.KT,k,ob?{celica:null,enota:ob.enota,stevka:null}:null,stanje.grid):stepHint(k)||'');
      pomocEl.appendChild(p);
    }else{
      p.append(vEl('b',null,'Rešitev: '),k.message);
      pomocEl.appendChild(p);
      if(!enoj) pomocEl.appendChild(legendaKoraka(k,false));
      // Dejanja koraka z oznako izvedenih (kot v igri), na mreži samo še neizvedena.
      const dejanja=dejanjaKoraka(k,stanje),opravljenih=dejanja.filter(a=>a.opravljeno).length;
      if(opravljenih===dejanja.length) pomocEl.appendChild(vEl('p','pomoc-opomba ok','✓ Korak je izveden.'));
      else if(dejanja.length>1){
        pomocEl.appendChild(vEl('p','pomoc-opomba',`Opravljeno: ${opravljenih} od ${dejanja.length}`));
        const ul=vEl('ul','pomoc-dejanja');
        for(const a of dejanja){
          const li=vEl('li',a.opravljeno?'opravljeno':null);
          li.append(vEl('span','dejanje-znak',a.opravljeno?'✓':''),a.tip==='vpis'?`vpiši ${a.stevka} v ${cellLabel(a.celica)}`:`izbriši ${a.stevka} iz ${cellLabel(a.celica)}`);
          ul.appendChild(li);
        }
        pomocEl.appendChild(ul);
      }
    }
    const skrij=vEl('button','sm-btn','Skrij');skrij.type='button';
    skrij.addEventListener('click',()=>{pomoc=null;plosca.izrisi();izrisiPomoc();});
    pomocEl.appendChild(skrij);
  }
  namigBtn.addEventListener('click',()=>odpriPomoc('namig'));
  resitevBtn.addEventListener('click',()=>odpriPomoc('resitev'));

  // Novo stanje igre po igralčevi spremembi ali "Poskusi znova": "Preveri" je spet na
  // voljo, staro sporočilo izgine.
  function poSpremembi(){
    const prej=stanje;stanje=stanjeIgre(v.igra);plosca.poSpremembi(prej);
    checkBtn.disabled=false;fb.className='fb';fb.innerHTML='';
    plosca.izrisi();izrisiPomoc();
  }
  // E1/E2: predlog v celici (niz Vpiši, tipka s števko; števka 0 = Backspace/Delete ga
  // pobriše). Nov predlog zamenja starega; ista števka v isti celici ga pobriše. Sprememba
  // predloga je igralčeva sprememba ("Preveri" spet na voljo).
  function nastaviPredlog(c,d){
    if(c===null||vajaResena) return;
    const isti=predlog&&predlog.celica===c&&predlog.stevka===d;
    const nov=d&&!isti?{celica:c,stevka:d}:null;
    if(!nov&&(!predlog||predlog.celica!==c)) return;
    predlog=nov;
    checkBtn.disabled=false;fb.className='fb';fb.innerHTML='';
    plosca.izrisi();
  }
  // Maske izbrisov koraka po celicah (prečrtani po pravilnem odgovoru).
  const maskeKoraka=k=>{const m=new Array(81).fill(0);for(const[c,d]of k.eliminate)m[c]|=1<<d;return m;};
  const plosca=ustvariPlosco({
    mreza:mEl,robovi:true,kandidati:!enoj,samoEna:enoj,vpis:enoj?undefined:false,
    nizPoudari:nizP,vecHkrati:vh.i,nizOdstrani:nizO,vecCelic:vc&&vc.i,
    nizVpisi:nizV,predlog:enoj,obVpisu:enoj?nastaviPredlog:undefined,senci:sc&&sc.i,
    zaznamuj:zaznBtn,pocistiZaznamke:zaznPoc,
    // Števke območja (7-10): obroč na gumbu v nizu Poudari, ostane tudi brez poudarka.
    stevkeObmocja:()=>ob&&ob.stevke&&!vajaResena?ob.stevke:[],
    // Senčenje pri E2 pred pravilnim odgovorom je pomoč (kot namig; oznaciPomoc po rešeni
    // vaji ne naredi nič).
    izrisi:()=>{plosca.izrisi();if(skriti&&plosca.sencenjeVidno())oznaciPomoc();},
    razlogNizov:razlogEl,razveljavi:raz,ponovi:pon,znova:zn,
    seznami:{vrstice:sV,stolpci:sS,bloki:sB},stikala:{vrstice:kV.i,stolpci:kS.i,bloki:kB.i},
    postavitev:wrap,kljucSeznamov:'sudoku.trening.seznami',
    vir:()=>({igra:v.igra,stanje}),
    obSpremembi:poSpremembi,
    samoZaOgled:()=>vajaResena,
    razlog:()=>vajaResena?'Vaja je rešena – nadaljuj z »Naslednja vaja«.':null,
    // Oznake: po pravilnem odgovoru korak odgovora, med odprto "Rešitvijo" njen korak (samo
    // še neizvedena dejanja - oznakeKoraka).
    // E1/E2: odgovor je zelena celica z vpisom; rešitev enota koraka (jantarno) in celica s
    // števko (zeleno), kot "Rešitev" v "Spoznaj".
    oznake:()=>enoj
      ?(odgovor?{vzorec:new Set(),izbris:new Set(),izbrisCelice:new Set(),vpis:new Map([odgovor])}
        :pomoc&&pomoc.vrsta==='resitev'?{vzorec:new Set(pomoc.korak.hint&&pomoc.korak.hint.unit||[]),izbris:new Set(),izbrisCelice:new Set(),vpis:new Map(pomoc.korak.assign)}:null)
      :odgovor?{vzorec:new Set(odgovor.cells),izbris:new Set(odgovor.eliminate.map(([c,d])=>c*10+d)),izbrisCelice:new Set(),vpis:new Map()}
      :pomoc&&pomoc.vrsta==='resitev'?oznakeKoraka(pomoc.korak,stanje):null,
    // E1/E2: brez kandidatov, izbrati je mogoče samo prazne celice. Po pravilnem odgovoru
    // izbire ni več.
    spremenljiva:enoj?(i=>!stanje.grid[i]&&vEnoti(i)):(()=>!vajaResena),
    pogled:()=>{
      const p=enoj?{sosede:null,predlog}:{};
      // Območje (vaje 1-6): enota, pivot ali bloka modrikasto; pri E1/E2 so prazne celice
      // zunaj enote neaktivne (zatemnjene, kot v "Spoznaj").
      if(ob&&ob.celice&&!vajaResena){
        p.oznacene=ob.celice;
        p.obmocje=obmocjeZaMrezo(ob.celice);
        if(enoj) p.neaktivne=stanje.grid.map((x,i)=>i).filter(i=>!stanje.grid[i]&&!vEnoti(i));
      }
      if(vajaResena){p.izbrane=[];p.sosede=null;}
      const prej=precrtaniKrog&&pk?stanje.zacetni.odstranjeni:null,korak=odgovor&&!enoj?maskeKoraka(odgovor):null;
      p.precrtani=prej&&korak?prej.map((m,i)=>m|korak[i]):prej||korak;
      return p;
    },
  });
  if(pk) pk.i.addEventListener('change',()=>{
    precrtaniKrog=pk.i.checked;prejEl.textContent=prejOdstranjenihBesedilo(v.prejOdstranjenih,precrtaniKrog);plosca.izrisi();
  });
  // Števke območja (7-10) so poudarjene ob začetku (igralec jih lahko izklopi); par pri
  // W-krilu potrebuje "več hkrati".
  if(ob&&ob.stevke){
    if(ob.stevke.length>1&&!vh.i.checked){vh.i.checked=true;vh.i.dispatchEvent?vh.i.dispatchEvent(new Event('change')):vh.i.sprozi('change');}
    ob.stevke.forEach(d=>plosca.poudari(d));
  }

  // "Poskusi znova" (po napačnem odgovoru): kot "Začni znova" - kazalec na začetek vaje,
  // poteze ostanejo v "Ponovi".
  function naZacetek(){
    if(!lahkoZacniZnova(v.igra)) return;
    zacniZnova(v.igra);
    poSpremembi();
  }
  // Samodejna razveljavitev (neutemeljeno, druga-tehnika): vsak izbris zunaj koraka
  // tehnike se vrne kot svoja poteza "vrni" - to ni igralčeva sprememba, zato "Preveri"
  // ostane onemogočen in sporočilo ostane.
  function vrniIzbrise(izbrisi){
    for(const[c,d]of izbrisi){
      if(dodajPotezo(v.igra,{tip:'kandidat',celica:c,stevka:d,odstrani:false},stanje)) stanje=stanjeIgre(v.igra);
    }
    plosca.izrisi();izrisiPomoc();
  }
  // Presoja odgovora (vrstni red izidov v preveriVajo()); po vsaki oceni je "Preveri"
  // onemogočen do naslednje igralčeve spremembe - isti odgovor se ne šteje dvakrat.
  function preveriVadi(){
    if(enoj){preveriEnojcekVadi();return;}
    const r=preveriVajo(v,stanje);
    checkBtn.disabled=true;
    if(r.izid==='pravilno'){
      // Pravilen je vsak cel korak tehnike (tudi zunaj območja); prednost ima korak v
      // območju, sicer sporočilo pove, kje je bil korak.
      const cel=k=>k.eliminate.every(([c,d])=>!(stanje.kandidati[c]&(1<<d)));
      const vOb=KTob.find(cel);
      odgovor=vOb||r.korak;
      stej(true);pomoc=null;izrisiPomoc();
      const kje=!vOb&&ob?` (korak ${obmocjeKoraka(odgovor,()=>0).opis}, ne ${ob.opis})`:'';
      fb.className='fb ok';fb.innerHTML=`<b>Pravilno!</b>${kje} ${odgovor.message}`;
      fb.appendChild(legendaKoraka(odgovor,true));
      akcije.hidden=true;zaznamki.hidden=true;checkBtn.style.display='none';nextBtn.style.display='inline-block';
      plosca.izrisi();
    }else if(r.izid==='napacno'){
      stej(false);
      fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> ${r.sporocilo} `;
      const znova=vEl('button','sm-btn','Poskusi znova');znova.type='button';
      znova.addEventListener('click',naZacetek);
      fb.appendChild(znova);
    }else{
      if(r.razveljavi.length) vrniIzbrise(r.razveljavi);
      fb.className='fb info';fb.innerHTML=r.izid==='delno'?`<b>Še ne.</b> ${r.sporocilo}`:r.sporocilo;
    }
  }
  // E1/E2: presoja predloga (preveriEnojcek) - pravilno: predlog postane poteza vpis,
  // mreža zaklenjena, celica zelena; nevtralno (prava števka, ki je ta tehnika ne dokaže)
  // se ne šteje; napačno se šteje. Po oceni se predlog pobriše.
  function preveriEnojcekVadi(){
    const r=preveriVajo(v,stanje,predlog);
    checkBtn.disabled=true;
    if(r.izid==='pravilno'){
      stej(true);
      const prej=stanje;
      dodajPotezo(v.igra,{tip:'vpis',celica:predlog.celica,stevka:predlog.stevka},stanje);
      stanje=stanjeIgre(v.igra);plosca.poSpremembi(prej);
      odgovor=[predlog.celica,predlog.stevka];predlog=null;pomoc=null;izrisiPomoc();
      fb.className='fb ok';fb.innerHTML=`<b>Pravilno!</b> ${r.sporocilo}`;
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    }else if(r.izid==='napacno'){
      stej(false);predlog=null;
      fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> ${r.sporocilo}`;
    }else{
      if(r.izid==='nevtralno') predlog=null;
      fb.className='fb info';fb.innerHTML=r.izid==='nevtralno'?`<b>Še ne.</b> ${r.sporocilo}`:r.sporocilo;
    }
    plosca.izrisi();
  }
  checkBtn.addEventListener('click',()=>preveri(preveriVadi,fb));

  plosca.izrisi();
  area.appendChild(div);
  vadi={v,plosca,ob,KTob,get stanje(){return stanje;}};
}
