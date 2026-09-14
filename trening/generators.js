/* trening/generators.js — generatorji vaj (naključne uganke za posamezno tehniko) + MODES opis tehnik. */

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=0|Math.random()*(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function randInt(a,b){return a+(0|Math.random()*(b-a+1));}
function randSub(a,n){return shuffle([...a]).slice(0,Math.min(n,a.length));}

/* ========== GENERATORJI ========== */

// Skupna: poberi fiksne cifre in jih izloči iz vseh kandidatnih seznamov
function cleanSlots(slots){
  const fixed=new Set();
  slots.forEach(s=>{if(s.fixed!==undefined) fixed.add(s.fixed);});
  slots.forEach(s=>{
    if(s.c) s.c=s.c.filter(d=>!fixed.has(d));
  });
  // Preveri veljavnost: vsaka celica s kandidati mora imeti vsaj 1
  return slots.every(s=>!s.c||s.c.length>0);
}

// Pointing pair/triple in Box-line reduction potrebujeta pravo definicijo
// blokov/vrstic/stolpcev, zato (drugače kot ostali generatorji) uporabljata
// BOXES/ROWS/COLS iz shared/engine.js (naložen pred to datoteko).
function cellPos(idx){return `V${Math.floor(idx/9)+1}S${idx%9+1}`;}

// Skupno jedro za genPointing/genBoxLineReduction: sestavi blok + vrstico/stolpec,
// ki se sekata v 3 celicah (skupaj 15 celic), tako da je izbrani kandidat v eni
// od dveh enot omejen na 2-3 celice, ki vse ležijo znotraj druge enote. Vsak
// sestavljeni primer pred vrnitvijo preveri s klicem prave tehnike iz
// shared/engine.js (pointing()/boxLineReduction()) - vrne se samo, če ta dejansko
// najde ustrezen korak (torej z vsaj eno izločitvijo, "ni na pamet").
function genBoxLineCore(n, kind){
  for(let attempt=0;attempt<150;attempt++){
    const lineIsRow=Math.random()<0.5;
    const boxIdx=randInt(0,8);
    const boxRowGrp=Math.floor(boxIdx/3),boxColGrp=boxIdx%3;
    const lineIdx=lineIsRow?boxRowGrp*3+randInt(0,2):boxColGrp*3+randInt(0,2);
    const d=randInt(1,9);

    const boxCells=BOXES[boxIdx];
    const lineCells=lineIsRow?ROWS[lineIdx]:COLS[lineIdx];
    const sharedCells=boxCells.filter(c=>lineCells.includes(c)); // 3 celice (blok ∩ vrstica/stolpec)

    // 'pointing': primarna enota = blok, druga (sekundarna) = preostanek vrstice/stolpca zunaj bloka.
    // 'boxline': primarna enota = vrstica/stolpec, sekundarna = preostanek bloka zunaj nje.
    const primaryCells=kind==='pointing'?boxCells:lineCells;
    const otherUnitCells=kind==='pointing'?lineCells:boxCells; // "druga" prava enota (vsebuje shared + sekundarne)
    const secondaryCells=otherUnitCells.filter(c=>!sharedCells.includes(c)); // 6 celic
    const primaryOnlyCells=primaryCells.filter(c=>!sharedCells.includes(c)); // 6 celic

    const confineN=randInt(2,3);
    const confineCells=shuffle([...sharedCells]).slice(0,confineN);
    const leftoverShared=sharedCells.filter(c=>!confineCells.includes(c));

    const other=shuffle([1,2,3,4,5,6,7,8,9].filter(x=>x!==d));
    const slotsByIdx={};
    const usedPrimaryUnit=new Set(),usedOtherUnit=new Set();

    // Celice, kjer je kandidat omejen: d + 1-3 dodatnih kandidatov
    for(const idx of confineCells){
      const extra=randSub(other,randInt(1,3));
      slotsByIdx[idx]={c:[d,...extra].sort((a,b)=>a-b)};
    }
    // Morebitna preostala "deljena" celica (ko je confineN=2): brez d, fiksna.
    for(const idx of leftoverShared){
      const fv=other[randInt(0,other.length-1)];
      slotsByIdx[idx]={fixed:fv};
      usedPrimaryUnit.add(fv);usedOtherUnit.add(fv);
    }
    // Ostale celice primarne enote (6): nikoli d, mešano fiksne/kandidati.
    const nFixedPrimary=randInt(2,3);
    const shufPrimaryOnly=shuffle([...primaryOnlyCells]);
    shufPrimaryOnly.forEach((idx,i)=>{
      if(i<nFixedPrimary){
        const pool=other.filter(x=>!usedPrimaryUnit.has(x));
        const fv=pool[randInt(0,pool.length-1)];
        slotsByIdx[idx]={fixed:fv};usedPrimaryUnit.add(fv);
      } else {
        const pool=other.filter(x=>!usedPrimaryUnit.has(x));
        slotsByIdx[idx]={c:randSub(pool,Math.min(randInt(2,4),pool.length)).sort((a,b)=>a-b)};
      }
    });
    // Sekundarne celice (6): vsaj ena mora vsebovati d (cilj izbrisa).
    const nWithD=randInt(1,3);
    const shufSecondary=shuffle([...secondaryCells]);
    const withDSet=new Set(shufSecondary.slice(0,nWithD));
    const nFixedSecondary=randInt(1,2);
    let fixedLeft=nFixedSecondary;
    shufSecondary.forEach(idx=>{
      const hasD=withDSet.has(idx);
      if(!hasD&&fixedLeft>0){
        fixedLeft--;
        const pool=other.filter(x=>!usedOtherUnit.has(x));
        const fv=pool[randInt(0,pool.length-1)];
        slotsByIdx[idx]={fixed:fv};usedOtherUnit.add(fv);
      } else {
        const pool=other.filter(x=>!usedOtherUnit.has(x));
        const extraN=Math.min(hasD?randInt(1,3):randInt(2,4),pool.length);
        const extra=randSub(pool,extraN);
        slotsByIdx[idx]={c:(hasD?[d,...extra]:extra).sort((a,b)=>a-b)};
      }
    });

    // Zgradi začasno 81-celično desko (kot pri Swordfish) in preveri s pravo tehniko.
    const boardGrid=new Array(81).fill(1); // ne-0 = "dano"/zapolnjeno, izven vaje
    const boardCand=new Array(81).fill(0);
    for(const idx of [...primaryCells,...secondaryCells]){
      const s=slotsByIdx[idx];
      if(s.fixed!==undefined){ boardGrid[idx]=s.fixed; }
      else { boardGrid[idx]=0; boardCand[idx]=s.c.reduce((m,dd)=>m|(1<<dd),0); }
    }
    const techFn=kind==='pointing'?pointing:boxLineReduction;
    const steps=techFn({grid:boardGrid,cand:boardCand}).filter(s=>s.eliminate.length&&s.eliminate[0][1]===d);
    const confineSet=new Set(confineCells);
    const match=steps.find(s=>s.cells.length===confineSet.size&&s.cells.every(c=>confineSet.has(c)));
    if(!match) continue;

    const slots=[];
    for(const idx of primaryCells) slots.push({...slotsByIdx[idx],idx,pos:cellPos(idx),group:'primary'});
    for(const idx of secondaryCells) slots.push({...slotsByIdx[idx],idx,pos:cellPos(idx),group:'secondary'});

    const boxLabel=`Blok ${boxIdx+1}`;
    const lineLabel=`${lineIsRow?'Vrstica':'Stolpec'} ${lineIdx+1}`;
    const boxLoc=`bloku ${boxIdx+1}`;
    const lineLoc=`${lineIsRow?'vrstici':'stolpcu'} ${lineIdx+1}`;
    const primaryType=kind==='pointing'?'block':(lineIsRow?'row':'col');
    const unitLabel=kind==='pointing'?`${boxLabel} → ${lineLabel}`:`${lineLabel} → ${boxLabel}`;
    const desc=kind==='pointing'
      ? `Številka ${d}: v ${boxLoc} je mogoča samo v celicah ene vrstice ali stolpca – izberi te celice.`
      : `Številka ${d}: v ${lineLoc} je mogoča samo v celicah enega bloka – izberi te celice.`;

    return{
      mode:kind==='pointing'?'pointing':'box-line',
      digit:d,
      primaryLabel:kind==='pointing'?boxLabel:lineLabel,
      secondaryLabel:kind==='pointing'?lineLabel:boxLabel,
      primaryType,
      slots,boardGrid,boardCand,
      // Korak, ki ga je generator dejansko preveril (shared/engine.js) - uporabita
      // ga namig/rešitev v trening.js, da vedno kažeta na ta, načrtovani vzorec
      // (na plošči lahko po naključju obstaja tudi kak drug veljaven vzorec za
      // isto številko, ki pa ga preverjanje odgovora - checkPhase1 - še vedno sprejme).
      solutionCells:match.cells,solutionEliminate:match.eliminate,solutionMessage:match.message,
      unitLabel,desc,
    };
  }
  return genBoxLineCore(n+13,kind);
}
function genPointing(n){return genBoxLineCore(n,'pointing');}
function genBoxLineReduction(n){return genBoxLineCore(n,'boxline');}

function genNakedPair(n){
  for(let attempt=0;attempt<50;attempt++){
    const ut=['row','col','block'][n%3],ui=randInt(1,9);
    const all=shuffle([1,2,3,4,5,6,7,8,9]),pd=all.slice(0,2).sort((a,b)=>a-b),other=all.slice(2);
    const pos=shuffle([0,1,2,3,4,5,6,7,8]),pp=pos.slice(0,2).sort((a,b)=>a-b),rest=pos.slice(2);
    const nf=randInt(2,3);shuffle(rest);
    const fp=rest.slice(0,nf),cp=rest.slice(nf);
    const slots=Array(9);
    // Fiksne: samo iz "other" (ki NI v paru) – tako fiksne nikoli ne kolidirajo s parom
    for(let i=0;i<fp.length;i++) slots[fp[i]]={fixed:other[i]};
    const fixedSet=new Set(fp.map((_,i)=>other[i]));
    // Par celice: samo pd (par) številki, ki niso fiksne
    for(const p of pp) slots[p]={c:pd.slice(),isPair:true};
    // Ostale prazne: kandidati iz preostalih (ne fiksnih, ne par) + nekateri iz para
    const pool=other.filter(d=>!fixedSet.has(d)); // cifre ki niso fiksirane
    for(const p of cp){
      const nc=randInt(3,5);
      const ft=randSub(pd,randInt(1,Math.min(2,nc-1)));
      const fo=randSub(pool.filter(d=>!ft.includes(d)),nc-ft.length);
      slots[p]={c:[...new Set([...ft,...fo])].sort((a,b)=>a-b)};
    }
    if(!cleanSlots(slots)) continue;
    // Preveri da par celice imata se vedno 2 kandidata
    if(pp.some(p=>slots[p].c.length!==2)) continue;
    addLabels(slots,ut,ui);
    return{slots,targetSlots:pp,targetDigits:pd,unitLabel:unitLbl(ut,ui),unitType:ut,mode:'naked-pair'};
  }
  // Fallback (ne bi smelo priti sem)
  return genNakedPair(n+10);
}

function genHiddenPair(n){
  for(let attempt=0;attempt<50;attempt++){
    const ut=['row','col','block'][n%3],ui=randInt(1,9);
    const all=shuffle([1,2,3,4,5,6,7,8,9]),hd=all.slice(0,2).sort((a,b)=>a-b),other=all.slice(2);
    const pos=shuffle([0,1,2,3,4,5,6,7,8]),hp=pos.slice(0,2).sort((a,b)=>a-b),rest=pos.slice(2);
    const nf=randInt(2,3);shuffle(rest);
    const fp=rest.slice(0,nf),cp=rest.slice(nf);
    const slots=Array(9);
    // Fiksne: samo iz "other" (ki NI v skritem paru)
    for(let i=0;i<fp.length;i++) slots[fp[i]]={fixed:other[i]};
    const fixedSet=new Set(fp.map((_,i)=>other[i]));
    const pool=other.filter(d=>!fixedSet.has(d));
    // Hidden pair celice: hd + nekaj iz pool
    for(const p of hp){
      const nc=randInt(3,5);
      const extra=randSub(pool,nc-2);
      slots[p]={c:[...hd,...extra].sort((a,b)=>a-b),isHP:true};
    }
    // Ostale prazne: samo iz pool (NE hd, NE fiksne)
    for(const p of cp){
      const nc=randInt(2,Math.min(5,pool.length));
      const cands=randSub(pool,nc);
      slots[p]={c:cands.sort((a,b)=>a-b)};
    }
    if(!cleanSlots(slots)) continue;
    // Preveri da hidden pair celice se vedno vsebujeta obe hd stevilki
    if(hp.some(p=>!hd.every(d=>slots[p].c.includes(d)))) continue;
    // Preveri da hd stevilke niso v nobeni drugi celici
    let hdLeak=false;
    for(let i=0;i<9;i++){
      if(hp.includes(i)) continue;
      if(slots[i].c && hd.some(d=>slots[i].c.includes(d))){hdLeak=true;break;}
    }
    if(hdLeak) continue;
    // Preveri da med NE-par celicami ni očitnega para (ki bi zmedel)
    const nonHP2=[];
    for(let i=0;i<9;i++){if(!hp.includes(i)&&slots[i].c) nonHP2.push(i);}
    let hasNP=false;
    for(let a=0;a<nonHP2.length&&!hasNP;a++)
      for(let b=a+1;b<nonHP2.length&&!hasNP;b++){
        const u=new Set();
        slots[nonHP2[a]].c.forEach(d=>u.add(d));
        slots[nonHP2[b]].c.forEach(d=>u.add(d));
        if(u.size===2) hasNP=true;
      }
    if(hasNP) continue;
    addLabels(slots,ut,ui);
    return{slots,targetSlots:hp,targetDigits:hd,unitLabel:unitLbl(ut,ui),unitType:ut,mode:'hidden-pair'};
  }
  return genHiddenPair(n+10);
}

function genNakedTriple(n){
  for(let attempt=0;attempt<50;attempt++){
    const ut=['row','col','block'][n%3],ui=randInt(1,9);
    const all=shuffle([1,2,3,4,5,6,7,8,9]),td=all.slice(0,3).sort((a,b)=>a-b),other=all.slice(3);
    const r=Math.random();let tC;
    if(r<0.1) tC=[td.slice(),td.slice(),td.slice()];
    else if(r<0.6) tC=shuffle([[td[0],td[1]],[td[1],td[2]],[td[0],td[2]]]);
    else{const ps=shuffle([[td[0],td[1]],[td[1],td[2]],[td[0],td[2]]]);tC=shuffle([td.slice(),ps[0],ps[1]]);}
    const pos=shuffle([0,1,2,3,4,5,6,7,8]),tp=pos.slice(0,3).sort((a,b)=>a-b),rest=pos.slice(3);
    const nf=randInt(2,3);shuffle(rest);
    const fp=rest.slice(0,nf),cp=rest.slice(nf);
    const slots=Array(9);
    // Fiksne: samo iz "other"
    for(let i=0;i<fp.length;i++) slots[fp[i]]={fixed:other[i]};
    const fixedSet=new Set(fp.map((_,i)=>other[i]));
    const pool=other.filter(d=>!fixedSet.has(d));
    for(let i=0;i<3;i++) slots[tp[i]]={c:tC[i].sort((a,b)=>a-b),isTriple:true};
    for(const p of cp){
      const nc=randInt(3,5);
      const ft=randSub(td,randInt(1,Math.min(2,nc-1)));
      const fo=randSub(pool.filter(d=>!ft.includes(d)),nc-ft.length);
      slots[p]={c:[...new Set([...ft,...fo])].sort((a,b)=>a-b)};
    }
    if(!cleanSlots(slots)) continue;
    // Preveri trojico: unija mora biti se vedno 3
    const union=new Set();
    tp.forEach(p=>slots[p].c.forEach(d=>union.add(d)));
    if(union.size!==3) continue;
    // Preveri da vsaj ena ostala celica vsebuje kandidat iz trojice (koristno brisanje)
    let hasElim=false;
    for(let i=0;i<9;i++){
      if(tp.includes(i)||!slots[i].c) continue;
      if(td.some(d=>slots[i].c.includes(d))){hasElim=true;break;}
    }
    if(!hasElim) continue;
    addLabels(slots,ut,ui);
    return{slots,targetSlots:tp,targetDigits:td,unitLabel:unitLbl(ut,ui),unitType:ut,mode:'naked-triple'};
  }
  return genNakedTriple(n+10);
}

function genHiddenTriple(n){
  for(let attempt=0;attempt<80;attempt++){
    const ut=['row','col','block'][n%3],ui=randInt(1,9);
    const all=shuffle([1,2,3,4,5,6,7,8,9]),hd=all.slice(0,3).sort((a,b)=>a-b),other=all.slice(3);
    const pos=shuffle([0,1,2,3,4,5,6,7,8]),hp=pos.slice(0,3).sort((a,b)=>a-b),rest=pos.slice(3);
    const nf=randInt(2,3);shuffle(rest);
    const fp=rest.slice(0,nf),cp=rest.slice(nf);
    const slots=Array(9);
    // Fiksne: samo iz "other"
    for(let i=0;i<fp.length;i++) slots[fp[i]]={fixed:other[i]};
    const fixedSet=new Set(fp.map((_,i)=>other[i]));
    const pool=other.filter(d=>!fixedSet.has(d));
    // Hidden triple celice: vsaka dobi 2-3 od hd + 1-3 iz pool (skupaj 3-5)
    // Zagotovi, da je unija hd v teh 3 celicah = vse 3 hd stevilke
    const hdAssign=[[],[],[]];
    // Vsaka hd stevilka mora biti v vsaj 1 celici; razporedi naključno
    for(const d of hd){
      // V koliko celicah se pojavi: 1-3
      const nCells=randInt(1,3);
      const which=randSub([0,1,2],nCells);
      which.forEach(w=>hdAssign[w].push(d));
    }
    // Preveri da ima vsaka celica vsaj 1 hd stevilko
    if(hdAssign.some(a=>a.length===0)) continue;
    // Preveri unija = vse 3
    const ucheck=new Set();hdAssign.forEach(a=>a.forEach(d=>ucheck.add(d)));
    if(ucheck.size!==3) continue;

    for(let i=0;i<3;i++){
      const myHd=[...new Set(hdAssign[i])];
      const nc=randInt(Math.max(3,myHd.length+1), Math.min(5,myHd.length+pool.length));
      const extra=randSub(pool,nc-myHd.length);
      slots[hp[i]]={c:[...myHd,...extra].sort((a,b)=>a-b),isHT:true};
    }
    // Ostale prazne: samo iz pool (NE hd)
    for(const p of cp){
      const nc=randInt(2,Math.min(5,pool.length));
      slots[p]={c:randSub(pool,nc).sort((a,b)=>a-b)};
    }
    if(!cleanSlots(slots)) continue;
    // Preveri da hd stevilke so se vedno v trojicnih celicah
    const finalUnion=new Set();
    hp.forEach(p=>slots[p].c.filter(d=>hd.includes(d)).forEach(d=>finalUnion.add(d)));
    if(finalUnion.size!==3) continue;
    // Preveri da hd stevilke niso v nobeni drugi celici
    let leak=false;
    for(let i=0;i<9;i++){
      if(hp.includes(i)) continue;
      if(slots[i].c&&hd.some(d=>slots[i].c.includes(d))){leak=true;break;}
    }
    if(leak) continue;
    // Preveri da imajo trojicne celice vsaj 1 odvecen kandidat (sicer ni "skrita")
    if(hp.every(p=>slots[p].c.length<=3&&slots[p].c.every(d=>hd.includes(d)))) continue;
    // Preveri da med NE-trojicnimi praznimi celicami NI očitne trojice
    // (tri celice s skupno unijo = 3, kar bi "ukradlo pozornost")
    const nonHP=[];
    for(let i=0;i<9;i++){if(!hp.includes(i)&&slots[i].c) nonHP.push(i);}
    let hasNakedTriple=false;
    for(let a=0;a<nonHP.length&&!hasNakedTriple;a++)
      for(let b=a+1;b<nonHP.length&&!hasNakedTriple;b++)
        for(let c=b+1;c<nonHP.length&&!hasNakedTriple;c++){
          const u=new Set();
          slots[nonHP[a]].c.forEach(d=>u.add(d));
          slots[nonHP[b]].c.forEach(d=>u.add(d));
          slots[nonHP[c]].c.forEach(d=>u.add(d));
          if(u.size===3) hasNakedTriple=true;
        }
    // Preveri tudi očitne pare med ne-trojicnimi
    let hasNakedPair=false;
    for(let a=0;a<nonHP.length&&!hasNakedPair;a++)
      for(let b=a+1;b<nonHP.length&&!hasNakedPair;b++){
        const u=new Set();
        slots[nonHP[a]].c.forEach(d=>u.add(d));
        slots[nonHP[b]].c.forEach(d=>u.add(d));
        if(u.size===2) hasNakedPair=true;
      }
    if(hasNakedTriple||hasNakedPair) continue;
    addLabels(slots,ut,ui);
    return{slots,targetSlots:hp,targetDigits:hd,unitLabel:unitLbl(ut,ui),unitType:ut,mode:'hidden-triple'};
  }
  return genHiddenTriple(n+10);
}

function genXWing(n){
  for(let attempt=0;attempt<80;attempt++){
    // base = vrstice ali stolpci
    const baseIsRow=n%2===0;
    const digit=randInt(1,9);

    // Izberi 2 base enoti (vrstici ali stolpca) in 2 cross poziciji
    const bases=randSub([0,1,2,3,4,5,6,7,8],2).sort((a,b)=>a-b);
    const crosses=randSub([0,1,2,3,4,5,6,7,8],2).sort((a,b)=>a-b);

    // 4 celice pravokotnika (r,c)
    const rect=[];
    for(const b of bases) for(const cr of crosses){
      rect.push(baseIsRow?[b,cr]:[cr,b]);
    }

    // Ustvari 9x9 mrežo: za vsako celico povej ali ima ta digit kot kandidat
    // Pravilo: v base enotah se digit pojavi SAMO na cross pozicijah (po 2)
    // V cross enotah se digit pojavi na base pozicijah + še nekje drugje (za brisanje)
    const grid=Array.from({length:81},()=>false);

    // Postavi digit v pravokotnik
    rect.forEach(([r,c])=>{grid[r*9+c]=true;});

    // Dodaj digit v cross enote na ne-base pozicijah (to so celice za brisanje)
    const elimCells=[];
    for(const cr of crosses){
      const nExtra=randInt(1,3);
      const avail=[];
      for(let i=0;i<9;i++){
        const r_=baseIsRow?i:cr;
        const c_=baseIsRow?cr:i;
        if(!bases.includes(baseIsRow?r_:c_)) avail.push([r_,c_]);
      }
      const extras=randSub(avail,nExtra);
      extras.forEach(([r,c])=>{grid[r*9+c]=true;elimCells.push([r,c]);});
    }

    // Dodaj nekaj motilcev v pozicije ki NISO v base enotah in NISO v cross enotah
    for(let i=0;i<randInt(4,10);i++){
      const r=randInt(0,8),c=randInt(0,8);
      const inBase=bases.includes(baseIsRow?r:c);
      const inCross=crosses.includes(baseIsRow?c:r);
      if(inBase||inCross) continue;
      grid[r*9+c]=true;
    }

    if(elimCells.length===0) continue;

    // Preveri veljavnost: v base enotah mora digit biti na natanko 2 mestih (samo cross pozicijah)
    let baseValid=true;
    for(const b of bases){
      let count=0;
      for(let i=0;i<9;i++){
        const idx=baseIsRow?b*9+i:i*9+b;
        if(grid[idx]) count++;
      }
      if(count!==2){baseValid=false;break;}
    }
    if(!baseValid) continue;

    const baseName=baseIsRow?'vrsticah':'stolpcih';
    const crossName=baseIsRow?'stolpcih':'vrsticah';
    const baseLabels=bases.map(b=>(baseIsRow?'V':'S')+(b+1)).join(', ');
    const crossLabels=crosses.map(c=>(baseIsRow?'S':'V')+(c+1)).join(', ');

    return{
      grid,digit,rect,elimCells,bases,crosses,baseIsRow,
      baseName,crossName,baseLabels,crossLabels,
      mode:'x-wing',
      unitLabel:`X-Wing za številko ${digit}`,
      desc:`Številka ${digit}: najdi pravokotnik – 4 celice, kjer se ${digit} v dveh ${baseName} pojavi na istih dveh mestih.`
    };
  }
  return genXWing(n+10);
}

function genSwordfish(n){
  for(let attempt=0;attempt<100;attempt++){
    const baseIsRow=n%2===0;
    const digit=randInt(1,9);
    const bases=randSub([0,1,2,3,4,5,6,7,8],3).sort((a,b)=>a-b);
    const crosses=randSub([0,1,2,3,4,5,6,7,8],3).sort((a,b)=>a-b);

    // V vsaki base enoti: digit na 2-3 od cross pozicij
    // Unija vseh cross pozicij mora biti = vse 3
    const grid=Array.from({length:81},()=>false);
    const usedCrosses=new Set();
    const sfCells=[];

    for(const b of bases){
      const nPos=randInt(2,3);
      const positions=randSub(crosses,nPos);
      positions.forEach(cr=>{
        const r=baseIsRow?b:cr, c=baseIsRow?cr:b;
        grid[r*9+c]=true;
        sfCells.push([r,c]);
        usedCrosses.add(cr);
      });
    }
    // Unija mora pokriti vse 3 cross
    if(usedCrosses.size!==3) continue;

    // Preveri: v base enotah je digit SAMO na cross pozicijah (ne drugje)
    let baseClean=true;
    for(const b of bases){
      for(let i=0;i<9;i++){
        if(crosses.includes(i)) continue;
        const idx=baseIsRow?b*9+i:i*9+b;
        if(grid[idx]){baseClean=false;break;}
      }
      if(!baseClean) break;
    }
    if(!baseClean) continue;

    // Dodaj brisanja: v cross enotah, izven base enot
    const elimCells=[];
    for(const cr of crosses){
      const nExtra=randInt(1,3);
      const avail=[];
      for(let i=0;i<9;i++){
        if(bases.includes(i)) continue;
        avail.push(i);
      }
      randSub(avail,nExtra).forEach(i=>{
        const r=baseIsRow?i:cr, c=baseIsRow?cr:i;
        grid[r*9+c]=true;
        elimCells.push([r,c]);
      });
    }
    if(elimCells.length===0) continue;

    // Motilci izven base in cross
    for(let i=0;i<randInt(3,8);i++){
      const r=randInt(0,8),c=randInt(0,8);
      const inBase=bases.includes(baseIsRow?r:c);
      const inCross=crosses.includes(baseIsRow?c:r);
      if(inBase||inCross) continue;
      grid[r*9+c]=true;
    }

    // Validacija: v base enotah mora biti natanko 2-3 pojavitve
    let valid=true;
    for(const b of bases){
      let count=0;
      for(let i=0;i<9;i++){
        const idx=baseIsRow?b*9+i:i*9+b;
        if(grid[idx]) count++;
      }
      if(count<2||count>3){valid=false;break;}
    }
    if(!valid) continue;

    const baseName=baseIsRow?'vrsticah':'stolpcih';
    const crossName=baseIsRow?'stolpcih':'vrsticah';
    const baseLabels=bases.map(b=>(baseIsRow?'V':'S')+(b+1)).join(', ');
    const crossLabels=crosses.map(c=>(baseIsRow?'S':'V')+(c+1)).join(', ');

    return{
      grid,digit,sfCells,elimCells,bases,crosses,baseIsRow,
      baseName,crossName,baseLabels,crossLabels,
      mode:'swordfish',
      unitLabel:`Swordfish za številko ${digit}`,
      desc:`Številka ${digit}: najdi 3 ${baseName}, kjer se ${digit} pojavi samo na istih 3 ${crossName}. Klikni vse celice s ${digit} v teh treh ${baseName}.`
    };
  }
  return genSwordfish(n+10);
}

/* --- XY-Wing in Unique Rectangle ---
   Drugače kot ostale tehnike ti dve delujeta na pravih odnosih "katera celica
   vidi katero" po celi mreži, zato generatorja sestavita celo 81-celično desko:
   vse celice so privzeto "dane" (grid=1, tehniki ju preskočita), prazne (grid=0
   s kandidati) so samo tiste, ki jih vaja prikaže. Vsak primer je pred vrnitvijo
   preverjen s klicem prave tehnike iz shared/engine.js (xyWing()/uniqueRectangle()):
   zahtevamo, da najde načrtovani vzorec IN nobenega drugega - s tem je preverjeno
   tudi, da moteče celice res ne tvorijo veljavnega vzorca. */
function emptyBoard(){return{grid:new Array(81).fill(1),cand:new Array(81).fill(0)};}
function setCell(board,idx,digits){board.grid[idx]=0;board.cand[idx]=digits.reduce((m,d)=>m|(1<<d),0);}
function slotsFromBoard(board){
  const slots=[];
  for(let i=0;i<81;i++) if(board.grid[i]===0) slots.push({idx:i,pos:cellPos(i),c:bitsOf(board.cand[i])});
  return slots;
}
const ALL_IDX=Array.from({length:81},(_,i)=>i);

function genXYWing(n){
  const all9=[0,1,2,3,4,5,6,7,8];
  for(let attempt=0;attempt<300;attempt++){
    const ds=shuffle([1,2,3,4,5,6,7,8,9]);
    const [x,y,z,da,db,dc]=ds; // x,y,z: pravi vzorec; da,db,dc: motilec (ločeni množici številk)
    const fill=ds.slice(6);    // preostale 3 številke za celici izbrisa (da nista bivalue)

    // Pravi vzorec: pivot {x,y}, krilo 1 v isti vrstici {x,z}, krilo 2 v istem
    // stolpcu {y,z}. Celica izbrisa E vidi obe krili (stolpec krila 1, vrstica krila 2).
    const pr=randInt(0,8),pc=randInt(0,8);
    const c1=shuffle(all9.filter(c=>c!==pc))[0];
    const r2=shuffle(all9.filter(r=>r!==pr))[0];
    const P=pr*9+pc,W1=pr*9+c1,W2=r2*9+pc,E=r2*9+c1;
    if(boxOf(P)===boxOf(E)) continue; // celica izbrisa naj ne vidi pivota

    // Motilec: trojica s popolnim vzorcem številk (da,db / da,dc / db,dc) in celico,
    // kjer bi brisala - spodleti pri natanko enem pogoju: drugo krilo (d3) ne vidi
    // pivota (d1). Da vzorec ne bi bil veljaven z drugim pivotom, d3 ne vidi ne d1 ne d2.
    const used=new Set([P,W1,W2,E]);
    const d1=shuffle(ALL_IDX.filter(i=>!used.has(i)))[0];
    const d2pool=[...PEERS[d1]].filter(i=>!used.has(i));
    if(!d2pool.length) continue;
    const d2=shuffle(d2pool)[0];
    const d3pool=ALL_IDX.filter(i=>!used.has(i)&&i!==d1&&i!==d2&&!PEERS[d1].has(i)&&!PEERS[d2].has(i));
    if(!d3pool.length) continue;
    const d3=shuffle(d3pool)[0];
    const e2pool=[...PEERS[d2]].filter(i=>PEERS[d3].has(i)&&!used.has(i)&&i!==d1&&i!==d3);
    if(!e2pool.length) continue;
    const E2=shuffle(e2pool)[0];

    const board=emptyBoard();
    setCell(board,P,[x,y]);
    setCell(board,W1,[x,z]);
    setCell(board,W2,[y,z]);
    setCell(board,E,[z,...randSub(fill,2)]);
    setCell(board,d1,[da,db]);
    setCell(board,d2,[da,dc]);
    setCell(board,d3,[db,dc]);
    setCell(board,E2,[dc,...randSub(fill,2)]);

    const want=new Set([P,W1,W2]);
    const steps=xyWing(board);
    if(!steps.length) continue;
    if(!steps.every(s=>s.cells.length===3&&s.cells.every(c=>want.has(c)))) continue;
    const match=steps[0];

    return{
      mode:'xy-wing',
      slots:slotsFromBoard(board),
      boardGrid:board.grid,boardCand:board.cand,
      // Korak, ki ga je generator dejansko preveril (shared/engine.js) - uporabljata
      // ga namig/rešitev v trening.js.
      solutionCells:match.cells,solutionEliminate:match.eliminate,solutionMessage:match.message,
      unitLabel:'XY-Wing: pivot in dve krili',
    };
  }
  return genXYWing(n+7);
}

function genUniqueRectangle(n){
  for(let attempt=0;attempt<300;attempt++){
    const ds=shuffle([1,2,3,4,5,6,7,8,9]);
    const [x,y,da,db]=ds; // {x,y}: par pravega pravokotnika; {da,db}: par motilca
    const fill=ds.slice(4);

    // Pravi vzorec: 2 vrstici x 2 stolpca v natanko DVEH blokih - bodisi vrstici
    // v istem pasu treh vrstic (stolpca iz različnih pasov) ali obratno.
    let r1,r2,c1,c2;
    if(Math.random()<0.5){
      const band=randInt(0,2),rs=randSub([0,1,2],2).map(i=>band*3+i);r1=rs[0];r2=rs[1];
      const cb=randSub([0,1,2],2);c1=cb[0]*3+randInt(0,2);c2=cb[1]*3+randInt(0,2);
    } else {
      const band=randInt(0,2),cs=randSub([0,1,2],2).map(i=>band*3+i);c1=cs[0];c2=cs[1];
      const rb=randSub([0,1,2],2);r1=rb[0]*3+randInt(0,2);r2=rb[1]*3+randInt(0,2);
    }
    const corners=[r1*9+c1,r1*9+c2,r2*9+c1,r2*9+c2];
    if(new Set(corners.map(boxOf)).size!==2) continue;
    const fourth=corners[randInt(0,3)]; // vogal z dodatnimi kandidati

    // Motilec: enak vzorec kandidatov (trije vogali z istim parom + četrti z dodatnimi),
    // a pravokotnik leži v ŠTIRIH blokih - spodleti pri natanko tem enem pogoju.
    const rb2=randSub([0,1,2],2),cb2=randSub([0,1,2],2);
    const mr1=rb2[0]*3+randInt(0,2),mr2=rb2[1]*3+randInt(0,2);
    const mc1=cb2[0]*3+randInt(0,2),mc2=cb2[1]*3+randInt(0,2);
    const mCorners=[mr1*9+mc1,mr1*9+mc2,mr2*9+mc1,mr2*9+mc2];
    if(new Set(mCorners.map(boxOf)).size!==4) continue;
    if(mCorners.some(i=>corners.includes(i))) continue;
    const mFourth=mCorners[randInt(0,3)];

    const board=emptyBoard();
    corners.forEach(i=>setCell(board,i,i===fourth?[x,y,...randSub(fill,randInt(1,2))]:[x,y]));
    mCorners.forEach(i=>setCell(board,i,i===mFourth?[da,db,...randSub(fill,randInt(1,2))]:[da,db]));

    const want=new Set(corners);
    const steps=uniqueRectangle(board);
    if(!steps.length) continue;
    if(!steps.every(s=>s.cells.length===4&&s.cells.every(c=>want.has(c)))) continue;
    const match=steps[0];

    return{
      mode:'unique-rectangle',
      slots:slotsFromBoard(board),
      boardGrid:board.grid,boardCand:board.cand,
      solutionCells:match.cells,solutionEliminate:match.eliminate,solutionMessage:match.message,
      unitLabel:'Unique Rectangle: smrtonosni vzorec',
    };
  }
  return genUniqueRectangle(n+7);
}

function addLabels(slots,ut,ui){
  for(let i=0;i<9;i++){
    if(ut==='row') slots[i].pos=`V${ui}S${i+1}`;
    else if(ut==='col') slots[i].pos=`V${i+1}S${ui}`;
    else{const br=((ui-1)/3|0)*3,bc=((ui-1)%3)*3;slots[i].pos=`V${br+(i/3|0)+1}S${bc+i%3+1}`;}
  }
}
function unitLbl(ut,ui){return ut==='row'?`Vrstica ${ui}`:ut==='col'?`Stolpec ${ui}`:`Blok ${ui}`;}

const MODES={
  'pointing':{gen:genPointing,name:'Pointing pair/triple',selClass:'selected-blue',hlClass:'hl-blue',btnClass:'pri-blue',isPointing:true,pickN:3,showCandidateCount:true,
    desc:'Pogledaš blok. Če je kandidat v njem mogoč samo v celicah ene vrstice (ali stolpca), ga izbrišeš iz preostanka te vrstice zunaj bloka. Smer: iz bloka v vrstico.'},
  'box-line':{gen:genBoxLineReduction,name:'Box-line reduction',selClass:'selected-indigo',hlClass:'hl-indigo',btnClass:'pri-indigo',isBoxLine:true,pickN:3,showCandidateCount:true,
    desc:'Pogledaš vrstico (ali stolpec). Če je kandidat v njej mogoč samo v celicah enega bloka, ga izbrišeš iz preostanka tega bloka zunaj vrstice. Smer: iz vrstice v blok.'},
  'naked-pair':{gen:genNakedPair,name:'Očitna para',selClass:'selected-amber',hlClass:'hl-amber',btnClass:'pri-amber',pickN:2,showCandidateCount:true,
    desc:'Najdi 2 celici z natanko istima dvema kandidatoma.'},
  'hidden-pair':{gen:genHiddenPair,name:'Skrita para',selClass:'selected-purple',hlClass:'hl-purple',btnClass:'pri-purple',pickN:2,hasPhase2:true,showCandidateCount:true,
    desc:'Najdi 2 celici, ki skrivata par – nato izberi kateri 2 številki tvorita par.'},
  'naked-triple':{gen:genNakedTriple,name:'Očitna trojica',selClass:'selected-teal',hlClass:'hl-teal',btnClass:'pri-teal',pickN:3,showCandidateCount:true,
    desc:'Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.'},
  'hidden-triple':{gen:genHiddenTriple,name:'Skrita trojica',selClass:'selected-steel',hlClass:'hl-steel',btnClass:'pri-steel',pickN:3,hasPhase2:true,phase2pick:3,showCandidateCount:true,
    desc:'Najdi 3 celice, ki skrivajo trojico – nato izberi katere 3 številke jo tvorijo.'},
  'x-wing':{gen:genXWing,name:'X-Wing',selClass:'selected-rose',hlClass:'hl-rose',btnClass:'pri-rose',pickN:4,isXWing:true,showCandidateCount:false,
    desc:'Najdi pravokotnik 4 celic za označeno številko.'},
  'swordfish':{gen:genSwordfish,name:'Swordfish',selClass:'selected-forest',hlClass:'hl-forest',btnClass:'pri-forest',pickN:9,isSwordfish:true,showCandidateCount:false,
    desc:'Najdi 3 vrstice (ali stolpce), kjer se številka pojavi samo na istih 3 stolpcih (ali vrsticah).'},
  'xy-wing':{gen:genXYWing,name:'XY-Wing',selClass:'selected-cyan',hlClass:'hl-cyan',btnClass:'pri-cyan',isXYWing:true,pickN:3,showCandidateCount:true,
    desc:'Med prikazanimi celicami poišči pivota – celico z natanko dvema kandidatoma (x, y) – in njegovi dve krili: krilo 1 si s pivotom deli x (in ima poleg tega še skupno številko z), krilo 2 si deli y (in ima tudi z). Obe krili morata pivota videti (ista vrstica, stolpec ali blok). Izberi pivota in obe krili (3 celice).'},
  'unique-rectangle':{gen:genUniqueRectangle,name:'Unique Rectangle',selClass:'selected-orange',hlClass:'hl-orange',btnClass:'pri-orange',isUR:true,pickN:4,showCandidateCount:true,
    desc:'Poišči pravokotnik štirih celic (2 vrstici × 2 stolpca, v natanko dveh blokih): trije vogali imajo natanko isti par kandidatov {x, y}, četrti pa poleg x in y še vsaj en dodaten kandidat. Ker ima uganka natanko eno rešitev, četrti vogal ne sme ostati samo na {x, y} (to bi dopuščalo dve rešitvi) – iz njega zato izbrišemo x in y. Izberi vse štiri celice pravokotnika.'},
};
