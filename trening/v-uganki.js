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

// Vaja na zaslonu. 1-12: odgovor so izbrisi kandidatov S0 (niz Odstrani, več celic,
// Shift+števka), presodi ga preveriVajo() ob "Preveri". E1/E2: mreža brez kandidatov,
// odgovor je predlog vpisa v celici (niz Vpiši z vsemi 9 števkami, tipka s števko),
// presodi ga preveriVajo() s predlogom (preveriEnojcek); pravilen predlog postane poteza.
function izrisiVadi(v){
  const kljuc=v.kljuc,enoj=jeEnojcek(kljuc),skriti=kljuc==='Skriti enojček',M=MODES[mode];
  let stanje=v.S0;
  // Po pravilnem odgovoru: korak odgovora (1-12: oznake na mreži, izbrisi rdeče prečrtani)
  // ali vpis odgovora (E1/E2: [celica, števka]).
  let odgovor=null;
  // E1/E2: predlog vpisa { celica, stevka } ali null - ni poteza, "Preveri" ga presodi.
  let predlog=null;
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
  let nizO=null,nizV=null,vc=null,razlogEl=null,akcije=null,raz=null,pon=null,zn=null;
  if(enoj){
    const g=vEl('div','niz-oznaka');g.append('Vpiši v izbrano celico ');
    g.appendChild(vEl('span','niz-pojasnilo','· predlog'));
    wrap.appendChild(g);
    nizV=vEl('div','niz niz-vpisi');nizV.setAttribute('role','group');nizV.setAttribute('aria-label','Vpiši v izbrano celico');
    wrap.appendChild(nizV);
    razlogEl=vEl('div','niz-razlog');razlogEl.setAttribute('aria-live','polite');wrap.appendChild(razlogEl);
  }else{
    const g=vEl('div','niz-oznaka glava-s-kljukico');
    const o=vEl('span');o.append('Odstrani kandidata ');
    const poj=vEl('span','niz-pojasnilo','· ');poj.append(vEl('span','vzorec-vrni','↺'),' = vrni');
    o.appendChild(poj);
    vc=vKljukica(' več celic');vc.l.className='vec-hkrati';
    vc.l.title='Izberi več celic in odstrani isto števko iz vseh (na računalniku tudi Ctrl+klik)';
    g.append(o,vc.l);wrap.appendChild(g);
    nizO=vEl('div','niz niz-odstrani');nizO.setAttribute('role','group');nizO.setAttribute('aria-label','Odstrani kandidata');
    wrap.appendChild(nizO);
    razlogEl=vEl('div','niz-razlog');razlogEl.setAttribute('aria-live','polite');wrap.appendChild(razlogEl);
    akcije=vEl('div','akcije');
    raz=vEl('button',null,'↶ Razveljavi');raz.type='button';raz.title='Razveljavi (Ctrl+Z)';
    pon=vEl('button',null,'↷ Ponovi');pon.type='button';pon.title='Ponovi (Ctrl+Y)';
    zn=vEl('button',null,'↺ Začni znova');zn.type='button';zn.title='Vrni na začetek vaje (poteze ostanejo v »Ponovi«)';
    akcije.append(raz,pon,zn);wrap.appendChild(akcije);
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
  function korakPomoci(){
    if(enoj) return v.KT[Math.floor(Math.random()*v.KT.length)];
    const izbrisanih=k=>k.eliminate.filter(([c,d])=>!stanje.grid[c]&&!(stanje.kandidati[c]&(1<<d))).length;
    return v.KT.reduce((naj,k)=>izbrisanih(k)>izbrisanih(naj)?k:naj,v.KT[0]);
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
      p.append(vEl('b',null,'Namig: '),enoj?namigEnojcka(!skriti,v.KT,k,null,stanje.grid):stepHint(k)||'');
      pomocEl.appendChild(p);
    }else{
      p.append(vEl('b',null,'Rešitev: '),k.message);
      pomocEl.appendChild(p);
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
    spremenljiva:enoj?(i=>!stanje.grid[i]):(()=>!vajaResena),
    pogled:()=>{
      const p=enoj?{sosede:null,predlog}:{};
      if(vajaResena){p.izbrane=[];p.sosede=null;}
      const prej=precrtaniKrog&&pk?stanje.zacetni.odstranjeni:null,korak=odgovor&&!enoj?maskeKoraka(odgovor):null;
      p.precrtani=prej&&korak?prej.map((m,i)=>m|korak[i]):prej||korak;
      return p;
    },
  });
  if(pk) pk.i.addEventListener('change',()=>{precrtaniKrog=pk.i.checked;plosca.izrisi();});

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
      stej(true);odgovor=r.korak;pomoc=null;izrisiPomoc();
      fb.className='fb ok';fb.innerHTML=`<b>Pravilno!</b> ${r.korak.message}`;
      akcije.hidden=true;checkBtn.style.display='none';nextBtn.style.display='inline-block';
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
  vadi={v,plosca,get stanje(){return stanje;}};
}
