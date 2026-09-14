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

function addLabels(slots,ut,ui){
  for(let i=0;i<9;i++){
    if(ut==='row') slots[i].pos=`V${ui}S${i+1}`;
    else if(ut==='col') slots[i].pos=`V${i+1}S${ui}`;
    else{const br=((ui-1)/3|0)*3,bc=((ui-1)%3)*3;slots[i].pos=`V${br+(i/3|0)+1}S${bc+i%3+1}`;}
  }
}
function unitLbl(ut,ui){return ut==='row'?`Vrstica ${ui}`:ut==='col'?`Stolpec ${ui}`:`Blok ${ui}`;}

const MODES={
  'naked-pair':{gen:genNakedPair,name:'Očitna para',selClass:'selected-amber',hlClass:'hl-amber',btnClass:'pri-amber',pickN:2,
    desc:'Najdi 2 celici z natanko istima dvema kandidatoma.'},
  'hidden-pair':{gen:genHiddenPair,name:'Skrita para',selClass:'selected-purple',hlClass:'hl-purple',btnClass:'pri-purple',pickN:2,hasPhase2:true,
    desc:'Najdi 2 celici, ki skrivata par – nato izberi kateri 2 številki tvorita par.'},
  'naked-triple':{gen:genNakedTriple,name:'Očitna trojica',selClass:'selected-teal',hlClass:'hl-teal',btnClass:'pri-teal',pickN:3,
    desc:'Najdi 3 celice, ki skupaj pokrijejo natanko 3 kandidate.'},
  'hidden-triple':{gen:genHiddenTriple,name:'Skrita trojica',selClass:'selected-steel',hlClass:'hl-steel',btnClass:'pri-steel',pickN:3,hasPhase2:true,phase2pick:3,
    desc:'Najdi 3 celice, ki skrivajo trojico – nato izberi katere 3 številke jo tvorijo.'},
  'x-wing':{gen:genXWing,name:'X-Wing',selClass:'selected-rose',hlClass:'hl-rose',btnClass:'pri-rose',pickN:4,isXWing:true,
    desc:'Najdi pravokotnik 4 celic za označeno številko.'},
  'swordfish':{gen:genSwordfish,name:'Swordfish',selClass:'selected-forest',hlClass:'hl-forest',btnClass:'pri-forest',pickN:9,isSwordfish:true,
    desc:'Najdi 3 vrstice (ali stolpce), kjer se številka pojavi samo na istih 3 stolpcih (ali vrsticah).'},
};
