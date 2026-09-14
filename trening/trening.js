/* trening/trening.js — UI/tok vadbe: izbira tehnike, izris vaje, preverjanje odgovorov, rezultat.
   Potrebuje trening/generators.js (MODES + gen* funkcije), naložen pred to datoteko. */

const MAX_EX=9;

/* ========== UI ========== */

let mode=null,exNum=0,selected=[],pickedDigits=[],scoreRight=0,scoreTotal=0;
const menuEl=document.getElementById('menu'),trainerEl=document.getElementById('trainer'),area=document.getElementById('exerciseArea');

document.querySelectorAll('.menu-card').forEach(card=>{
  card.addEventListener('click',()=>{
    mode=card.dataset.mode;exNum=0;scoreRight=0;scoreTotal=0;
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

function renderExercise(){
  const M=MODES[mode];
  if(exNum>=MAX_EX){
    area.innerHTML='';const d=document.createElement('div');d.className='exercise';
    const pct=scoreTotal>0?Math.round(scoreRight/scoreTotal*100):0;
    d.innerHTML=`<h3>Končano!</h3><p style="font-size:15px">Rezultat: <b>${scoreRight}</b> / <b>${scoreTotal}</b> (${pct}%)</p>
      <p style="font-size:14px;color:#3C4854">Pritisni "Nazaj na izbiro" za novo vadbo.</p>`;
    area.appendChild(d);return;
  }
  const ex=M.gen(exNum);
  selected=[];pickedDigits=[];area.innerHTML='';

  const div=document.createElement('div');div.className='exercise';
  div.innerHTML=`<p class="ex-label">${M.name} · Vaja ${exNum+1} / ${MAX_EX}</p><h3>${ex.unitLabel}</h3><p class="desc">${ex.desc||M.desc}</p>`;

  let cellEls=[],countEls=[];

  if(M.isXWing||M.isSwordfish){
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
    ch2.addEventListener('click',()=>checkPhase2(ex,M,cellEls,ch2,nextBtn,fb));
    phase2.appendChild(ch2);
  }

  checkBtn.addEventListener('click',()=>checkPhase1(ex,M,cellEls,checkBtn,nextBtn,fb,phase2));
  btnRow.appendChild(checkBtn);btnRow.appendChild(nextBtn);
  div.appendChild(btnRow);
  if(phase2) div.appendChild(phase2);
  div.appendChild(fb);

  // --- Namig in Rešitev gumba (prikaže se samo med držanjem) ---
  const peekRow=document.createElement('div');peekRow.className='peek-row';

  // Besedilo namiga glede na tip
  function buildHintText(){
    if(M.isXWing||M.isSwordfish){
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
    const cells=ex.targetSlots.map(p=>ex.slots[p].pos).join(', ');
    const digits=ex.targetDigits.join(', ');
    return `<b>Celice:</b> ${cells} · <b>Številke:</b> {${digits}}`;
  }

  const hintOverlay=document.createElement('div');hintOverlay.className='peek-overlay';
  const solOverlay=document.createElement('div');solOverlay.className='peek-overlay';

  function peekOn(overlay,text,showHL){
    overlay.innerHTML=text;
    overlay.classList.add('visible');
    if(showHL){
      if(M.isXWing||M.isSwordfish){
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
    cellEls.forEach(c=>c.classList.remove('peek-hl','peek-elim'));
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
  // Swordfish: 6-9 celic, X-Wing: natanko 4, ostalo: natanko pickN
  if(M.isSwordfish){
    if(selected.length<6||selected.length>9){fb.className='fb err';fb.textContent='Izberi 6–9 celic (vse celice s to številko v 3 vrsticah ali stolpcih).';return;}
  } else if(M.isXWing){
    if(selected.length!==4){fb.className='fb err';fb.textContent='Izberi natanko 4 celice.';return;}
  } else {
    if(selected.length!==M.pickN){fb.className='fb err';fb.textContent=`Izberi natanko ${M.pickN} celice.`;return;}
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
    scoreTotal++;
    if(valid){
      scoreRight++;updateScore();
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
      updateScore();
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

  scoreTotal++;if(isTarget||isValid) scoreRight++;updateScore();

  if(isTarget||isValid){
    const ds=isTarget?new Set(ex.targetDigits):union;
    const ps=isTarget?ex.targetSlots:sorted;
    fb.className='fb ok';
    fb.innerHTML=`<b>Pravilno!</b> {${[...ds].sort((a,b)=>a-b).join(', ')}} v ${ps.map(p=>ex.slots[p].pos).join(', ')}.`;
    ps.forEach(si=>{cellEls[si].classList.add('correct');cellEls[si].querySelectorAll('.cd').forEach(cd=>{if(ds.has(+cd.dataset.d)&&!cd.classList.contains('hide'))cd.classList.add('hl',M.hlClass);});});
    ex.slots.forEach((slot,si)=>{if(ps.includes(si)||!slot.c)return;cellEls[si].querySelectorAll('.cd').forEach(cd=>{const d=+cd.dataset.d;if(ds.has(d)&&slot.c.includes(d))cd.classList.add('elim');});});
    checkBtn.style.display='none';nextBtn.style.display='inline-block';
  } else if(!allOk){
    fb.className='fb err';fb.textContent='Ena od izbranih celic je fiksna.';cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];scoreTotal--;
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni ${M.pickN===2?'par':'trojica'}.</b> Unija: {${[...union].sort((a,b)=>a-b).join(', ')}} = ${union.size} različnih (rabiš ${M.pickN}).`;
    cellEls.forEach(c=>c.classList.remove(M.selClass));selected=[];
  }
}

function checkPhase2(ex,M,cellEls,ch2,nextBtn,fb){
  const p2n=M.phase2pick||2;
  if(pickedDigits.length!==p2n){fb.className='fb err';fb.textContent=`Izberi natanko ${p2n} številk${p2n===2?'i':'e'}.`;return;}
  const s=[...pickedDigits].sort((a,b)=>a-b),t=[...ex.targetDigits].sort((a,b)=>a-b);
  const correct=s.length===t.length&&s.every((v,i)=>v===t[i]);
  scoreTotal++;if(correct) scoreRight++;updateScore();

  if(correct){
    const ds=new Set(t);
    const cellNames=ex.targetSlots.map(p=>ex.slots[p].pos).join(', ');
    fb.className='fb ok';
    fb.innerHTML=`<b>Pravilno!</b> {${t.join(', ')}} se v enoti pojavljajo samo v ${cellNames}. Iz teh celic izbrišeš vse ostale kandidate.`;
    ex.targetSlots.forEach(si=>{cellEls[si].querySelectorAll('.cd').forEach(cd=>{if(cd.classList.contains('hide'))return;if(ds.has(+cd.dataset.d))cd.classList.add('hl',M.hlClass);else cd.classList.add('elim');});});
    ch2.style.display='none';nextBtn.style.display='inline-block';
  } else {
    fb.className='fb err';fb.innerHTML=`<b>Ni pravilno.</b> Išči ${p2n} številke, ki so v celotni enoti prisotne v natanko istih ${p2n} celicah.`;
    document.querySelectorAll('.digit-btns button').forEach(b=>b.classList.remove('picked'));pickedDigits=[];
  }
}

function updateScore(){
  document.getElementById('scoreRight').textContent=scoreRight;
  document.getElementById('scoreTotal').textContent=scoreTotal;
  document.getElementById('scorePercent').textContent=scoreTotal>0?Math.round(scoreRight/scoreTotal*100)+'%':'';
}
