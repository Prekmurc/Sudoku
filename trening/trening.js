/* trening/trening.js — UI/tok vadbe: izbira tehnike, izris vaje, preverjanje odgovorov, rezultat.
   Potrebuje trening/generators.js (MODES + gen* funkcije), naložen pred to datoteko. */

const MAX_EX=9;

/* ========== UI ========== */

let mode=null,exNum=0,selected=[],pickedDigits=[],scoreRight=0,scoreTotal=0;
// Pomoč (Namig ali Rešitev - vsak ogled, tudi kratek): vaja s pomočjo se ne šteje nikamor,
// ne med pravilne ne med napačne - že šteti poskusi te vaje se ob ogledu odštejejo.
// Ogled po pravilnem odgovoru ne spremeni ničesar (vaja je končana).
let pomocVaje=false,vajaResena=false,vajaPrav=0,vajaVseh=0,sPomocjo=0,stetoObPreveri=false;
const menuEl=document.getElementById('menu'),trainerEl=document.getElementById('trainer'),area=document.getElementById('exerciseArea');

// Vrstni red in oznake kartic iz TRENING_ENOJCKA (E1, E2) in TRENING_TEHNIKE (1-12)
// v shared/engine.js - iste številke igra izpisuje pri ugankah ("tehnike: 1, 3, 7").
// Vrstni red kartic v HTML ni pomemben.
[...TRENING_ENOJCKA,...TRENING_TEHNIKE].forEach(([m])=>{
  const card=menuEl.querySelector(`.menu-card[data-mode="${m}"]`);
  if(!card)return;
  card.querySelector('h3').dataset.stevilka=oznakaTehnike(m);
  menuEl.appendChild(card);
});

document.querySelectorAll('.menu-card').forEach(card=>{
  card.addEventListener('click',()=>{
    mode=card.dataset.mode;exNum=0;scoreRight=0;scoreTotal=0;sPomocjo=0;
    updateScore();menuEl.style.display='none';trainerEl.style.display='block';
    renderExercise();
  });
});
document.getElementById('backBtn').addEventListener('click',()=>{
  trainerEl.style.display='none';menuEl.style.display='block';mode=null;
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

// Prikaz za Pointing pair/triple in Box-line reduction: primarna enota (blok
// ali vrstica/stolpec, 9 celic) + preostanek druge enote zunaj nje (6 celic).
// ex.slots je en plosk seznam 15 rež (najprej primarne, nato sekundarne) -
// indeks v njem (si) je isti, kot ga uporablja makeCell/selected.
function buildBoxLineLayout(div,ex,M){
  const countEls=[],cellEls=[];
  const primarySlots=[],secondarySlots=[];
  ex.slots.forEach((slot,si)=>(slot.group==='primary'?primarySlots:secondarySlots).push([slot,si]));

  const primLbl=document.createElement('div');primLbl.className='bl-section-label';primLbl.textContent=ex.primaryLabel;
  div.appendChild(primLbl);

  if(ex.primaryType==='block'){
    const lg=document.createElement('div');lg.className='block-labels';
    primarySlots.forEach(([slot])=>{const s=document.createElement('span');s.textContent=slot.pos;lg.appendChild(s);});
    div.appendChild(lg);
    const grid=document.createElement('div');grid.className='layout-block';
    primarySlots.forEach(([slot,si])=>{const gc=makeCell(slot,si,M);grid.appendChild(gc);cellEls[si]=gc;});
    div.appendChild(grid);
    const bc=document.createElement('div');bc.className='block-counts';
    primarySlots.forEach(([slot,si])=>{const s=document.createElement('span');s.textContent=slot.c?slot.c.length:'';bc.appendChild(s);countEls[si]=s;});
    div.appendChild(bc);
  } else {
    const strip=document.createElement('div');strip.className=ex.primaryType==='row'?'layout-row':'layout-col';
    primarySlots.forEach(([slot,si])=>{
      const cw=document.createElement('div');cw.className='cw';
      const lbl=document.createElement('div');lbl.className='clbl';lbl.textContent=slot.pos;cw.appendChild(lbl);
      const gc=makeCell(slot,si,M);cw.appendChild(gc);cellEls[si]=gc;
      const cnt=document.createElement('div');cnt.className='ccnt';cnt.textContent=slot.c?slot.c.length:'';cw.appendChild(cnt);countEls[si]=cnt;
      strip.appendChild(cw);
    });
    div.appendChild(strip);
  }

  const secLbl=document.createElement('div');secLbl.className='bl-section-label';
  const outsideOf=ex.primaryType==='block'?'bloka':(ex.primaryType==='row'?'vrstice':'stolpca');
  secLbl.textContent=`${ex.secondaryLabel} (izven ${outsideOf})`;
  div.appendChild(secLbl);
  const rest=document.createElement('div');rest.className='layout-rest';
  secondarySlots.forEach(([slot,si])=>{
    const cw=document.createElement('div');cw.className='cw';
    const lbl=document.createElement('div');lbl.className='clbl';lbl.textContent=slot.pos;cw.appendChild(lbl);
    const gc=makeCell(slot,si,M);cw.appendChild(gc);cellEls[si]=gc;
    const cnt=document.createElement('div');cnt.className='ccnt';cnt.textContent=slot.c?slot.c.length:'';cw.appendChild(cnt);countEls[si]=cnt;
    rest.appendChild(cw);
  });
  div.appendChild(rest);

  return{cellEls,countEls};
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

// Prikaz za enojčka (E1, E2): cela mreža prave uganke s števkami, brez kandidatov
// (raven lahke). Prazne celice so klikljive (izbrana je vedno ena), pod mrežo je niz
// števk 1-9 za vpis. cellEls je indeksiran s celico (0-80).
function buildSingleLayout(div,ex,M){
  const cellEls=[];
  const g=document.createElement('div');g.className='g9';
  const corner=document.createElement('div');corner.className='g9-hdr';g.appendChild(corner);
  for(let c=0;c<9;c++){const h=document.createElement('div');h.className='g9-hdr';h.textContent='S'+(c+1);g.appendChild(h);}
  for(let r=0;r<9;r++){
    const rh=document.createElement('div');rh.className='g9-hdr';rh.textContent='V'+(r+1);g.appendChild(rh);
    for(let c=0;c<9;c++){
      const idx=r*9+c,gc=document.createElement('div');
      gc.className='gc';gc.dataset.r=r;gc.dataset.c=c;
      const v=ex.boardGrid[idx];
      if(v){
        gc.classList.add('stevka');gc.textContent=v;
        if(ex.danosti[idx]==='0') gc.classList.add('vpis');
      } else {
        gc.classList.add('selectable');
        gc.addEventListener('click',()=>{
          if(!gc.classList.contains('selectable')) return;
          const bil=selected[0];
          if(bil!==undefined) cellEls[bil].classList.remove(M.selClass);
          if(bil===idx){selected=[];return;}
          selected=[idx];gc.classList.add(M.selClass);
        });
      }
      g.appendChild(gc);cellEls[idx]=gc;
    }
  }
  div.appendChild(g);
  const note=document.createElement('div');note.className='g9-note';
  note.textContent='Temne števke so dane, modre so že vpisane.';
  div.appendChild(note);
  const lbl=document.createElement('p');lbl.className='stevke-label';lbl.textContent='Števka za vpis:';
  div.appendChild(lbl);
  const stevkeEl=document.createElement('div');stevkeEl.className='digit-btns';
  for(let d=1;d<=9;d++){
    const b=document.createElement('button');b.textContent=d;b.dataset.d=d;
    b.addEventListener('click',()=>{
      const bil=pickedDigits[0];
      stevkeEl.querySelectorAll('button').forEach(x=>x.classList.remove('picked'));
      if(bil===d){pickedDigits=[];return;}
      pickedDigits=[d];b.classList.add('picked');
    });
    stevkeEl.appendChild(b);
  }
  div.appendChild(stevkeEl);
  return{cellEls,countEls:[],stevkeEl};
}

function renderExercise(){
  const M=MODES[mode];
  if(exNum>=MAX_EX){
    area.innerHTML='';const d=document.createElement('div');d.className='exercise';
    const pct=scoreTotal>0?Math.round(scoreRight/scoreTotal*100):0;
    d.innerHTML=`<h3>Končano!</h3><p style="font-size:15px">Rezultat: <b>${scoreRight}</b> / <b>${scoreTotal}</b> (${pct}%)</p>${sPomocjo?`
      <p style="font-size:14px;color:#3C4854">S pomočjo: <b>${sPomocjo}</b> (ne štejejo)</p>`:''}
      <p style="font-size:14px;color:#3C4854">Pritisni "Nazaj na izbiro" za novo vadbo.</p>`;
    area.appendChild(d);return;
  }
  const ex=M.gen(exNum);
  selected=[];pickedDigits=[];area.innerHTML='';
  pomocVaje=false;vajaResena=false;vajaPrav=0;vajaVseh=0;

  const div=document.createElement('div');div.className='exercise';
  div.innerHTML=`<p class="ex-label">${M.name} · Vaja ${exNum+1} / ${MAX_EX}</p><h3>${ex.unitLabel}</h3><p class="desc">${ex.desc||M.desc}</p>`;

  let cellEls=[],countEls=[];

  if(M.isSingle){
    const layout=buildSingleLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  } else if(M.isXWing||M.isSwordfish){
    // Poseben prikaz: 9x9 mreža za eno številko
    const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
    dlabel.textContent=`Označena številka: ${ex.digit}`;
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
          });
        }
        xg.appendChild(cell);
        cellEls.push(cell);
      }
    }
    div.appendChild(xg);
  } else if(M.isPointing||M.isBoxLine){
    const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
    dlabel.textContent=`Označena številka: ${ex.digit}`;
    div.appendChild(dlabel);
    const layout=buildBoxLineLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  } else if(M.isXYWing||M.isUR||M.isTurbot||M.isWWing){
    // Oznaka "Označena številka" samo pri Turbot Fish - XY-Wing in Unique Rectangle
    // nista vezani na eno samo številko.
    if(M.isTurbot){
      const dlabel=document.createElement('div');dlabel.className='xw-digit-label';
      dlabel.textContent=`Označena številka: ${ex.digit}`;
      div.appendChild(dlabel);
    }
    const layout=buildFullGridLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
  } else {
    const layout=buildLayout(div,ex,M);
    cellEls=layout.cellEls;countEls=layout.countEls;
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
    const p2word=p2n===2?'dve številki':'tri številke';
    const p2type=p2n===2?'skrito paro':'skrito trojico';
    phase2=document.createElement('div');phase2.className='phase2';
    phase2.innerHTML=`<p>Kateri <b>${p2word}</b> tvorijo ${p2type}? Klikni jih:</p>`;
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
    ch2.addEventListener('click',()=>preveri(()=>checkPhase2(ex,M,cellEls,ch2,nextBtn,fb),fb));
    phase2.appendChild(ch2);
  }

  checkBtn.addEventListener('click',()=>preveri(()=>checkPhase1(ex,M,cellEls,checkBtn,nextBtn,fb,phase2),fb));
  btnRow.appendChild(checkBtn);btnRow.appendChild(nextBtn);
  div.appendChild(btnRow);
  if(phase2) div.appendChild(phase2);
  div.appendChild(fb);

  // --- Namig in Rešitev gumba (prikaže se samo med držanjem) ---
  const peekRow=document.createElement('div');peekRow.className='peek-row';

  // Za Pointing/Box-line: korak shared logike, ki ga je generator preveril in
  // shranil (glej trening/generators.js) - uporabljata ga namig, rešitev in
  // poudarjanje celic, da vedno kažeta na isti, načrtovani vzorec (na plošči
  // lahko po naključju obstaja tudi kak drug veljaven vzorec za isto številko;
  // preverjanje odgovora v checkPhase1 tak vzorec še vedno sprejme).
  function exDigitStep(){
    if(!ex.solutionCells) return null;
    return {cells:ex.solutionCells,eliminate:ex.solutionEliminate,message:ex.solutionMessage};
  }

  // Besedilo namiga glede na tip
  function buildHintText(){
    if(M.isSingle) return ex.namig;
    if(M.isPointing||M.isBoxLine){
      const withDigit=ex.slots.filter(s=>s.group==='primary'&&s.c&&s.c.includes(ex.digit)).map(s=>s.pos);
      const seek=M.isPointing?'eni vrstici ali stolpcu':'enem bloku';
      return `Kandidat ${ex.digit} se v ${ex.primaryLabel.toLowerCase()} pojavlja v celicah: ${withDigit.join(', ')||'(nikjer)'}. Ali vse ležijo v ${seek}?`;
    } else if(M.isXYWing){
      const bi=ex.slots.filter(s=>s.c.length===2).map(s=>`${s.pos}{${s.c.join(',')}}`);
      return `Celice z natanko dvema kandidatoma: ${bi.join(', ')}. Pivot je tisti, ki ga <b>obe</b> krili vidita (ista vrstica, stolpec ali blok) – ena trojica ima prave številke, a eno krilo pivota ne vidi.`;
    } else if(M.isUR){
      const byPair={};
      ex.slots.filter(s=>s.c.length===2).forEach(s=>{const k=s.c.join(',');(byPair[k]=byPair[k]||[]).push(s.pos);});
      const lines=Object.entries(byPair).map(([k,ps])=>`{${k}}: ${ps.join(', ')}`).join(' · ');
      return `Pari kandidatov: ${lines}. Trije vogali z istim parom morajo ležati v 2 vrsticah, 2 stolpcih in <b>natanko dveh blokih</b> – če je pravokotnik razpet čez štiri bloke, tehnika ne velja.`;
    } else if(M.isWWing){
      const byPair={};
      ex.slots.filter(s=>s.c.length===2).forEach(s=>{const k=s.c.join(',');(byPair[k]=byPair[k]||[]).push(s.pos);});
      const lines=Object.entries(byPair).map(([k,ps])=>`{${k}}: ${ps.join(', ')}`).join(' · ');
      return `Pari kandidatov: ${lines}. Celici para se <b>ne smeta videti</b> (ne ista vrstica, stolpec ali blok) – za pravi par nato poišči enoto, kjer je druga številka para mogoča samo v dveh celicah, od katerih vsaka vidi po eno celico para.`;
    } else if(M.isTurbot){
      const bit=1<<ex.digit,links=[];
      for(const [units,lbl] of [[ROWS,'V'],[COLS,'S']]) units.forEach((u,i)=>{
        const spots=u.filter(c=>ex.boardGrid[c]===0&&(ex.boardCand[c]&bit));
        if(spots.length===2) links.push(`${lbl}${i+1}: ${spots.map(cellPos).join(', ')}`);
      });
      return `Vrstice in stolpci, kjer je ${ex.digit} mogoč v natanko dveh celicah (močne povezave): ${links.join(' · ')||'(nobena)'}. Poišči dve taki povezavi, pri katerih se en konec prve in en konec druge vidita (ista vrstica, stolpec ali blok).`;
    } else if(M.isXWing||M.isSwordfish){
      // Preštej v koliko celicah se digit pojavi v vsaki vrstici in stolpcu
      const rowCounts=[],colCounts=[];
      for(let i=0;i<9;i++){
        let rc=0,cc=0;
        for(let j=0;j<9;j++){if(ex.grid[i*9+j])rc++;if(ex.grid[j*9+i])cc++;}
        if(rc>0)rowCounts.push(`V${i+1}:${rc}×`);
        if(cc>0)colCounts.push(`S${i+1}:${cc}×`);
      }
      return `Pojavitve ${ex.digit} po vrsticah: ${rowCounts.join(', ')}. Išči 2 vrstici (ali stolpca) s točno 2×.`;
    } else if(M.hasPhase2){
      const freq={};
      ex.slots.forEach(s=>{if(s.c) s.c.forEach(d=>{freq[d]=(freq[d]||0)+1;});});
      const lines=Object.entries(freq).sort((a,b)=>a[0]-b[0])
        .map(([d,n])=>`<b>${d}</b>→${n}×`).join(', ');
      return `Pogostost kandidatov: ${lines}. Išči številke z ${M.pickN}× ali manj.`;
    } else {
      const small=[];
      ex.slots.forEach((s,i)=>{if(s.c&&s.c.length<=3) small.push(s.pos+'('+s.c.length+')');});
      return `Celice z 2–3 kandidati: ${small.join(', ')}. Med njimi je ${M.pickN===2?'par':'trojica'}.`;
    }
  }
  function buildSolutionText(){
    if(M.isSingle) return ex.korak.message;
    if(M.isPointing||M.isBoxLine||M.isXYWing||M.isUR||M.isTurbot||M.isWWing){
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
      const techName=M.isSwordfish?'Swordfish':'X-Wing';
      return `<b>Vse veljavne ${techName} kombinacije (${combos.length}):</b><br>${combos.join('<br>')}`;
    }
    // Očitna para/trojica: sporočilo motorja (pove tudi celice izbrisa). Pri skritih
    // vzorcih ga ne kažemo - tam se pokaže šele po 2. fazi (glej checkPhase2).
    if(!M.hasPhase2&&ex.solutionMessage) return ex.solutionMessage;
    const cells=ex.targetSlots.map(p=>ex.slots[p].pos).join(', ');
    const digits=ex.targetDigits.join(', ');
    return `<b>Celice:</b> ${cells} · <b>Številke:</b> {${digits}}`;
  }

  const hintOverlay=document.createElement('div');hintOverlay.className='peek-overlay';
  const solOverlay=document.createElement('div');solOverlay.className='peek-overlay';

  function peekOn(overlay,text,showHL){
    oznaciPomoc();
    overlay.innerHTML=text;
    overlay.classList.add('visible');
    if(showHL){
      if(M.isSingle){
        // Pri skritem enojčku je bistvena enota, v kateri je števka omejena na eno mesto.
        if(ex.korak.hint&&ex.korak.hint.unit) ex.korak.hint.unit.forEach(c=>cellEls[c].classList.add('peek-enota'));
        cellEls[ex.korak.assign[0][0]].classList.add('peek-hl');
      } else if(M.isPointing||M.isBoxLine||M.isXYWing||M.isUR||M.isTurbot||M.isWWing){
        const step=exDigitStep();
        if(step){
          const idxToSi=new Map(ex.slots.map((s,si)=>[s.idx,si]));
          step.cells.forEach(cidx=>{const si=idxToSi.get(cidx);if(si!==undefined)cellEls[si].classList.add('peek-hl');});
          step.eliminate.forEach(([cidx])=>{const si=idxToSi.get(cidx);if(si!==undefined)cellEls[si].classList.add('peek-elim');});
        }
      } else if(M.isXWing||M.isSwordfish){
        const hlCells=ex.rect||ex.sfCells||[];
        hlCells.forEach(([r,c])=>cellEls[r*9+c].classList.add('peek-hl'));
        (ex.elimCells||[]).forEach(([r,c])=>cellEls[r*9+c].classList.add('peek-elim'));
      } else {
        ex.targetSlots.forEach(si=>cellEls[si].classList.add('peek-hl'));
      }
    }
  }
  function peekOff(overlay){
    overlay.classList.remove('visible');
    cellEls.forEach(c=>c.classList.remove('peek-hl','peek-elim','peek-enota'));
  }

  const hintBtn=document.createElement('button');hintBtn.className='peek-btn';hintBtn.textContent='Namig (drži)';
  const solBtn=document.createElement('button');solBtn.className='peek-btn';solBtn.textContent='Rešitev (drži)';

  // Drži za prikaz (miška + dotik)
  ['mousedown','touchstart'].forEach(evt=>{
    hintBtn.addEventListener(evt,e=>{e.preventDefault();peekOn(hintOverlay,buildHintText(),false);});
    solBtn.addEventListener(evt,e=>{e.preventDefault();peekOn(solOverlay,buildSolutionText(),true);});
  });
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(evt=>{
    hintBtn.addEventListener(evt,()=>peekOff(hintOverlay));
    solBtn.addEventListener(evt,()=>peekOff(solOverlay));
  });

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
    if(selected.length<6||selected.length>9){fb.className='fb err';fb.textContent='Izberi 6–9 celic (vse celice s to številko v 3 vrsticah ali stolpcih).';return;}
  } else if(M.isXWing){
    if(selected.length!==4){fb.className='fb err';fb.textContent='Izberi natanko 4 celice.';return;}
  } else if(M.isPointing||M.isBoxLine){
    if(selected.length<2||selected.length>3){fb.className='fb err';fb.textContent='Izberi 2 ali 3 celice.';return;}
  } else {
    if(selected.length!==M.pickN){fb.className='fb err';fb.textContent=`Izberi natanko ${M.pickN} celice.`;return;}
  }

  if(M.isPointing||M.isBoxLine){
    // Jedro zaznave (pointing()/boxLineReduction()) je ista koda kot v reševalcu
    // (shared/engine.js) - sprejme katero koli veljavno kombinacijo izbranih
    // celic za označeno številko, ne samo tisto, ki jo je sestavil generator.
    const techFn=M.isPointing?pointing:boxLineReduction;
    const fakeBoard={grid:ex.boardGrid,cand:ex.boardCand};
    const selSet=new Set(selected.map(si=>ex.slots[si].idx));
    const steps=techFn(fakeBoard).filter(s=>s.eliminate.length&&s.eliminate[0][1]===ex.digit);
    const match=steps.find(s=>s.cells.length===selSet.size&&s.cells.every(c=>selSet.has(c)));
    stej(!!match);
    if(match){
      const idxToSi=new Map(ex.slots.map((s,si)=>[s.idx,si]));
      fb.className='fb ok';
      fb.innerHTML=`<b>Pravilno!</b> ${match.message}`;
      selected.forEach(si=>cellEls[si].classList.add('correct'));
      match.eliminate.forEach(([cidx,dig])=>{
        const si=idxToSi.get(cidx);if(si===undefined)return;
        cellEls[si].classList.add('elimcell');
        const cd=cellEls[si].querySelector(`.cd[data-d="${dig}"]`);
        if(cd) cd.classList.add('elim');
      });
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      const where=M.isPointing?'bloku':(ex.primaryType==='row'?'vrstici':'stolpcu');
      const target=M.isPointing?'eno vrstico/stolpec':'en blok';
      fb.className='fb err';
      fb.innerHTML=`<b>To še ni pravi vzorec.</b> Izberi tiste 2–3 celice, kjer je kandidat ${ex.digit} v ${where} omejen na ${target}.`;
      selected.forEach(si=>cellEls[si].classList.remove(M.selClass));selected=[];
    }
    return;
  }

  if(M.isXYWing||M.isUR||M.isTurbot||M.isWWing){
    // Jedro zaznave je ista koda kot v reševalcu (shared/engine.js xyWing() /
    // uniqueRectangle() / turbotFish()). Ujemanje se preverja samo po množici izbranih
    // celic - sprejme katero koli veljavno kombinacijo, ne le tiste iz generatorja.
    // (Pri Turbot Fish generator zagotovi, da so na deski vaje vsi vzorci na
    // označeni številki.)
    const techFn=M.isXYWing?xyWing:M.isUR?uniqueRectangle:M.isWWing?wWing:turbotFish;
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
        const cd=cellEls[si].querySelector(`.cd[data-d="${dig}"]`);
        if(cd) cd.classList.add('elim');
      });
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      fb.className='fb err';
      fb.innerHTML=M.isXYWing
        ? '<b>To še ni veljaven XY-Wing.</b> Pivot mora imeti natanko dva kandidata, <b>obe krili</b> morata pivota videti (ista vrstica, stolpec ali blok) in si z njim deliti po eno številko, skupna pa jima mora biti tretja številka.'
        : M.isWWing
        ? '<b>To še ni veljaven W-Wing.</b> Celici para morata imeti natanko isti par kandidatov in se <b>ne</b> videti. Celici povezave morata biti edini celici v svoji vrstici, stolpcu ali bloku z drugo številko para, nobena od njiju ne sme biti celica para, in vsaka mora videti po eno celico para.'
        : M.isTurbot
        ? `<b>To še ni veljaven Turbot Fish.</b> Potrebuješ dve vrstici ali stolpca, kjer je ${ex.digit} mogoč v natanko dveh celicah, en konec prve in en konec druge povezave pa se morata videti (ista vrstica, stolpec ali blok).`
        : '<b>To še ni veljaven Unique Rectangle.</b> Potrebuješ 4 celice v 2 vrsticah in 2 stolpcih, ki ležijo v <b>natanko dveh blokih</b>: trije vogali z natanko istim parom kandidatov, četrti pa z istim parom in še dodatnimi.';
      selected.forEach(si=>cellEls[si].classList.remove(M.selClass));selected=[];
    }
    return;
  }

  if(M.isXWing||M.isSwordfish){
    const expSize=M.isSwordfish?3:2;
    const rows=new Set(selected.map(idx=>(idx/9|0)));
    const cols=new Set(selected.map(idx=>idx%9));
    if(!selected.every(idx=>ex.grid[idx])){
      fb.className='fb err';fb.innerHTML=`<b>Ena od celic nima številke ${ex.digit}.</b>`;
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
      const typeLabel=baseIsRow?'Vrstični':'Stolpčni';
      const techName=M.isSwordfish?'Swordfish':'X-Wing';
      const baseWord=baseIsRow?'vrsticah':'stolpcih';
      const baseLabel=usedBases.map(b=>(baseIsRow?'V':'S')+(b+1)).join(', ');
      const crossLabel=usedCrosses.map(c=>(baseIsRow?'S':'V')+(c+1)).join(', ');
      const crossWord=baseIsRow?'stolpcih':'vrsticah';
      fb.className='fb ok';
      fb.innerHTML=`<b>Pravilno! (${typeLabel} ${techName})</b> Številka ${ex.digit} se v ${expSize} ${baseWord} (${baseLabel}) pojavi samo na ${crossWord} ${crossLabel} → iz preostanka teh ${crossWord} izbrišeš ${ex.digit}.`;
      selected.forEach(idx=>cellEls[idx].classList.add(M.isSwordfish?'xw-sf-correct':'xw-correct'));
      elimNow.forEach(idx=>cellEls[idx].classList.add('xw-elim'));
      checkBtn.style.display='none';nextBtn.style.display='inline-block';
    } else {
      const rArr=[...rows],cArr=[...cols];
      let detail=`Izbrane celice: ${rows.size} vrstic, ${cols.size} stolpcev. `;
      if(M.isSwordfish){
        detail+=`Za Swordfish rabiš natanko 3 ${rows.size===3?'vrstice':'stolpce'}, v vsaki po 2–3 pojavitve, vse znotraj istih 3 ${rows.size===3?'stolpcev':'vrstic'}.`;
      } else {
        const rCounts=rArr.map(r=>{let n=0;for(let i=0;i<9;i++)if(ex.grid[r*9+i])n++;return n;});
        detail+=`Po vrsticah: ${rArr.map((r,i)=>'V'+(r+1)+'='+rCounts[i]+'×').join(', ')}. `;
        const cCounts=cArr.map(c=>{let n=0;for(let i=0;i<9;i++)if(ex.grid[i*9+c])n++;return n;});
        detail+=`Po stolpcih: ${cArr.map((c,i)=>'S'+(c+1)+'='+cCounts[i]+'×').join(', ')}.`;
      }
      fb.className='fb err';fb.innerHTML=`<b>Ni pravi ${M.isSwordfish?'Swordfish':'X-Wing'}.</b> ${detail}`;
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
      fb.className='fb ok';fb.innerHTML=`<b>${word}!</b> Zdaj izberi ${p2n===2?'kateri 2 številki tvorita par':'katere 3 številke tvorijo trojico'}.`;
      s.forEach(si=>cellEls[si].classList.add('correct'));
      checkBtn.style.display='none';phase2.style.display='block';
      cellEls.forEach(c=>{c.classList.remove('selectable');c.style.pointerEvents='none';});
    } else {
      fb.className='fb err';fb.innerHTML=`<b>Niso prave celice.</b> Išči ${M.pickN} številke, ki se v enoti pojavljajo samo v ${M.pickN} celicah – potem jih klikni.`;
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
    ex.slots.forEach((slot,si)=>{if(ps.includes(si)||!slot.c)return;cellEls[si].querySelectorAll('.cd').forEach(cd=>{const d=+cd.dataset.d;if(ds.has(d)&&slot.c.includes(d))cd.classList.add('elim');});});
    checkBtn.style.display='none';nextBtn.style.display='inline-block';
  } else if(!allOk){
    fb.className='fb err';fb.textContent='Ena od izbranih celic je fiksna.';cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni ${M.pickN===2?'par':'trojica'}.</b> Unija: {${[...union].sort((a,b)=>a-b).join(', ')}} = ${union.size} različnih (rabiš ${M.pickN}).`;
    cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
  }
}

// Enojčka: odgovor je vpis števke v celico. Presodi preveriEnojcek() (generators.js) s
// koraki motorja na mreži vaje; 'nevtralno' (prava števka, a ne po tej tehniki) se ne
// šteje - tako kot izbira dane celice pri parih.
function checkSingle(ex,M,cellEls,checkBtn,nextBtn,fb){
  if(!selected.length){fb.className='fb err';fb.textContent='Izberi prazno celico.';return;}
  if(!pickedDigits.length){fb.className='fb err';fb.textContent='Izberi števko, ki jo vpišeš.';return;}
  const celica=selected[0],stevka=pickedDigits[0];
  const r=preveriEnojcek(ex,celica,stevka);
  const pocisti=()=>{
    cellEls[celica].classList.remove(M.selClass);selected=[];
    pickedDigits=[];document.querySelectorAll('.digit-btns button').forEach(b=>b.classList.remove('picked'));
  };
  if(r.izid==='prav'){
    stej(true);
    fb.className='fb ok';fb.innerHTML=`<b>Pravilno!</b> ${r.sporocilo}`;
    const gc=cellEls[celica];
    gc.classList.remove(M.selClass,'selectable');gc.classList.add('stevka','correct');gc.textContent=stevka;
    cellEls.forEach(c=>c.classList.remove('selectable'));
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
  if(pickedDigits.length!==p2n){fb.className='fb err';fb.textContent=`Izberi natanko ${p2n} številk${p2n===2?'i':'e'}.`;return;}
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
      || `{${t.join(', ')}} se v enoti pojavljajo samo v ${cellNames}. Iz teh celic izbrišeš vse ostale kandidate.`}`;
    ex.targetSlots.forEach(si=>{cellEls[si].querySelectorAll('.cd').forEach(cd=>{if(cd.classList.contains('hide'))return;if(ds.has(+cd.dataset.d))cd.classList.add('hl',M.hlClass);else cd.classList.add('elim');});});
    ch2.style.display='none';nextBtn.style.display='inline-block';
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> Išči ${p2n} številke, ki so v celotni enoti prisotne v natanko istih ${p2n} celicah.`;
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

// Preverjanje odgovora; če je bil poskus ocenjen pri vaji s pomočjo, sporočilo to pove.
function preveri(f,fb){
  stetoObPreveri=false;
  f();
  if(stetoObPreveri&&pomocVaje){
    const o=document.createElement('span');o.className='s-pomocjo';o.textContent=' (s pomočjo – ne šteje)';
    fb.appendChild(o);
  }
}

function updateScore(){
  document.getElementById('scoreRight').textContent=scoreRight;
  document.getElementById('scoreTotal').textContent=scoreTotal;
  document.getElementById('scorePercent').textContent=scoreTotal>0?Math.round(scoreRight/scoreTotal*100)+'%':'';
  document.getElementById('scorePomoc').textContent=sPomocjo?` · s pomočjo: ${sPomocjo}`:'';
}
