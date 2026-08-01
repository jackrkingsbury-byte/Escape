/* SBC Autopilot — shared engine.
   Pure logic: no DOM, no globals beyond window.SBCEngine. Used by both the
   solver page (fc26/index.html) and the bookmarklet (fc26/pilot.src.js), so the
   two can never drift apart. Squad-rating and chemistry rules are documented in
   fc26/README.md. */
(function(root){
"use strict";

const norm=s=>String(s||'').toLowerCase().replace(/[._''`-]/g,' ').replace(/\s+/g,' ').trim();
const titled=s=>String(s||'').trim();
function coins(n){
  n=Math.round(n||0);
  if(n===0)return '0';
  if(n>=1e6)return (n/1e6).toFixed(n>=1e7?1:2).replace(/\.?0+$/,'')+'M';
  if(n>=1e4)return Math.round(n/1e3)+'K';
  return n.toLocaleString('en-US');
}
function parsePrice(tok){
  const m=String(tok).replace(/[, ]/g,'').match(/^([\d.]+)\s*([km])?$/i);
  if(!m)return null;
  let v=parseFloat(m[1]); if(!isFinite(v))return null;
  const u=(m[2]||'').toLowerCase();
  if(u==='k')v*=1e3; else if(u==='m')v*=1e6;
  return Math.round(v);
}

/* ══════════════════ football reference data ══════════════════ */
const POSITIONS=['GK','RB','RWB','CB','LB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'];
const POS_SET=new Set(POSITIONS);
const RELATED={
  GK:['GK'],
  CB:['CB'],
  RB:['RB','RWB'], RWB:['RWB','RB'],
  LB:['LB','LWB'], LWB:['LWB','LB'],
  CDM:['CDM','CM'], CM:['CM','CDM','CAM'], CAM:['CAM','CM','CF'],
  RM:['RM','RW'], RW:['RW','RM'],
  LM:['LM','LW'], LW:['LW','LM'],
  CF:['CF','ST','CAM'], ST:['ST','CF']
};
const FORMATIONS=[
  {name:'4-4-2',      rows:[['GK'],['LB','CB','CB','RB'],['LM','CM','CM','RM'],['ST','ST']]},
  {name:'4-3-3',      rows:[['GK'],['LB','CB','CB','RB'],['CM','CM','CM'],['LW','ST','RW']]},
  {name:'4-2-3-1',    rows:[['GK'],['LB','CB','CB','RB'],['CDM','CDM'],['LM','CAM','RM'],['ST']]},
  {name:'4-1-2-1-2',  rows:[['GK'],['LB','CB','CB','RB'],['CDM'],['CM','CM'],['CAM'],['ST','ST']]},
  {name:'4-3-2-1',    rows:[['GK'],['LB','CB','CB','RB'],['CM','CM','CM'],['CF','CF'],['ST']]},
  {name:'3-5-2',      rows:[['GK'],['CB','CB','CB'],['LM','CM','CM','CM','RM'],['ST','ST']]},
  {name:'5-3-2',      rows:[['GK'],['LWB','CB','CB','CB','RWB'],['CM','CM','CM'],['ST','ST']]},
  {name:'4-4-1-1',    rows:[['GK'],['LB','CB','CB','RB'],['LM','CM','CM','RM'],['CF'],['ST']]},
  {name:'4-2-2-2',    rows:[['GK'],['LB','CB','CB','RB'],['CDM','CDM'],['CAM','CAM'],['ST','ST']]},
  {name:'3-4-3',      rows:[['GK'],['CB','CB','CB'],['LM','CM','CM','RM'],['LW','ST','RW']]}
];
const NATIONS=['england','france','spain','germany','italy','portugal','brazil','argentina','netherlands','belgium','croatia','uruguay','colombia','norway','sweden','denmark','poland','morocco','senegal','nigeria','ghana','ivory coast','cameroon','egypt','algeria','japan','south korea','australia','united states','usa','canada','mexico','chile','ecuador','peru','paraguay','serbia','switzerland','austria','scotland','wales','ireland','republic of ireland','northern ireland','turkey','greece','ukraine','russia','czech republic','czechia','slovakia','slovenia','hungary','romania','bulgaria','finland','iceland','albania','bosnia and herzegovina','north macedonia','montenegro','georgia','armenia','israel','iran','iraq','saudi arabia','qatar','united arab emirates','tunisia','mali','burkina faso','guinea','gabon','congo','dr congo','zambia','south africa','jamaica','costa rica','honduras','panama','venezuela','bolivia','china pr','china','new zealand','kosovo','luxembourg','cyprus','moldova','belarus','lithuania','latvia','estonia','uzbekistan'];
const NATION_SET=new Set(NATIONS);
const LEAGUE_ALIASES={
  'premier league':'Premier League','epl':'Premier League','english premier league':'Premier League','pl':'Premier League',
  'laliga':'LALIGA','la liga':'LALIGA','laliga ea sports':'LALIGA','spanish la liga':'LALIGA','laliga santander':'LALIGA',
  'serie a':'Serie A','italian serie a':'Serie A','serie a tim':'Serie A',
  'bundesliga':'Bundesliga','german bundesliga':'Bundesliga','1 bundesliga':'Bundesliga',
  'ligue 1':'Ligue 1','french ligue 1':'Ligue 1','ligue 1 uber eats':'Ligue 1',
  'eredivisie':'Eredivisie','dutch eredivisie':'Eredivisie',
  'liga portugal':'Liga Portugal','primeira liga':'Liga Portugal','portuguese liga':'Liga Portugal',
  'mls':'MLS','major league soccer':'MLS',
  'saudi pro league':'Saudi Pro League','roshn saudi league':'Saudi Pro League',
  'efl championship':'EFL Championship','championship':'EFL Championship',
  'liga mx':'Liga MX','turkish super lig':'Süper Lig','super lig':'Süper Lig','süper lig':'Süper Lig',
  'scottish premiership':'Scottish Premiership','belgian pro league':'Belgian Pro League',
  'liga profesional de futbol':'Liga Profesional','brasileirao':'Brasileirão','brasileirão':'Brasileirão','serie a brazil':'Brasileirão',
  'austrian bundesliga':'Austrian Bundesliga','swiss super league':'Swiss Super League',
  'danish superliga':'Superliga','allsvenskan':'Allsvenskan','eliteserien':'Eliteserien',
  'k league 1':'K League 1','j1 league':'J1 League','a league':'A-League','a-league':'A-League',
  'women s super league':"Women's Super League",'wsl':"Women's Super League",
  'icons':'Icons','icon':'Icons','heroes':'Heroes','hero':'Heroes'
};

/* ══════════════════ state ══════════════════ */
let reqId=0;   // only id generation is shared state

/* ══════════════════ club parsing ══════════════════ */
const HEADER_MAP={
  name:['name','player','playername','player name'],
  rating:['rating','ovr','overall','rat','score'],
  pos:['pos','position','positions','pref pos','preferred position'],
  nation:['nation','nationality','country'],
  league:['league','comp','competition'],
  club:['club','team'],
  price:['price','value','cost','coins','buy now','bin'],
  tags:['tags','tag','notes','type','quality']
};
function headerKind(cell){
  const n=norm(cell);
  for(const k in HEADER_MAP) if(HEADER_MAP[k].includes(n)) return k;
  return null;
}
function splitFields(line){
  if(line.includes('\t')) return line.split('\t');
  if(line.includes('|'))  return line.split('|');
  if(line.includes(';'))  return line.split(';');
  // A comma can be a field separator OR just joining positions ("CM,CAM"). Whichever
  // split yields more fields is the one actually being used as the separator.
  const byComma=line.includes(',')?line.split(','):[line];
  const bySpace=line.split(/\s{2,}/);
  return bySpace.filter(s=>s.trim()).length>byComma.filter(s=>s.trim()).length?bySpace:byComma;
}
function posTokens(cell){
  const parts=String(cell).split(/[\/,\s]+/).map(p=>p.trim().toUpperCase()).filter(Boolean);
  if(!parts.length) return null;
  return parts.every(p=>POS_SET.has(p)) ? [...new Set(parts)] : null;
}
const TAGWORDS={
  untradeable:['untradeable','untradable','ut','unt','u','loan','loaned'],
  rare:['rare','r'],
  special:['totw','if','sif','mif','special','tots','toty','promo','inform'],
  icon:['icon','icons'],
  hero:['hero','heroes','fut hero']
};
function tagKind(tok){
  const n=norm(tok);
  for(const k in TAGWORDS) if(TAGWORDS[k].includes(n)) return k;
  return null;
}
function leagueCanon(cell){
  const n=norm(cell);
  if(LEAGUE_ALIASES[n]) return LEAGUE_ALIASES[n];
  return null;
}
function parseClub(text){
  const out=[],bad=[];
  const lines=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(l=>l && !/^[-=_#*]+$/.test(l));
  if(!lines.length) return {players:[],bad:[]};

  // header?
  let map=null, start=0;
  const h=splitFields(lines[0]).map(c=>c.trim());
  const kinds=h.map(headerKind);
  if(kinds.filter(Boolean).length>=3){
    map={}; kinds.forEach((k,i)=>{ if(k&&map[k]===undefined) map[k]=i; });
    start=1;
  }

  for(let li=start;li<lines.length;li++){
    const raw=lines[li];
    const cells=splitFields(raw).map(c=>c.trim());
    if(!cells.some(Boolean)){bad.push(raw);continue;}
    const p={name:'',rating:0,pos:[],nation:'',league:'',club:'',price:0,untradeable:false,rare:false,special:false,icon:false,hero:false};

    if(map){
      const g=k=>map[k]!==undefined?String(cells[map[k]]||'').trim():'';
      p.name=g('name');
      p.rating=parseInt(g('rating'),10)||0;
      p.pos=posTokens(g('pos'))||[];
      p.nation=titled(g('nation'));
      p.league=leagueCanon(g('league'))||titled(g('league'));
      p.club=titled(g('club'));
      const pr=parsePrice(g('price')); p.price=pr===null?0:pr;
      const tagcell=(g('tags')+' '+g('price')).split(/[\s,\/]+/);
      tagcell.forEach(t=>{const k=tagKind(t); if(k){ if(k==='untradeable')p.untradeable=true; else p[k]=true; }});
    } else {
      const left=[];
      cells.forEach(cell=>{
        const c=cell.trim(); if(!c) return;
        const k=tagKind(c);
        if(k){ if(k==='untradeable')p.untradeable=true; else p[k]=true; return; }
        if(!p.rating){
          const r=parseInt(c,10);
          if(String(r)===c.replace(/^0+(?=\d)/,'') && r>=40 && r<=99){ p.rating=r; return; }
        }
        const pt=posTokens(c);
        if(pt && !p.pos.length){ p.pos=pt; return; }
        const lg=leagueCanon(c);
        if(lg && !p.league){ p.league=lg; return; }
        if(NATION_SET.has(norm(c)) && !p.nation){ p.nation=titled(c); return; }
        const pr=parsePrice(c);
        if(pr!==null && !p._pricedone){ p.price=pr; p._pricedone=true; return; }
        left.push(c);
      });
      if(left.length){ p.name=left.shift(); }
      // remaining unknowns: fill league → club → nation in that order of likelihood
      left.forEach(v=>{
        if(!p.nation && NATION_SET.has(norm(v))) p.nation=titled(v);
        else if(!p.club) p.club=titled(v);
        else if(!p.league) p.league=titled(v);
        else if(!p.nation) p.nation=titled(v);
      });
    }
    delete p._pricedone;
    if(!p.name || !p.rating){ bad.push(raw); continue; }
    if(!p.pos.length) p.pos=['CM'];
    if(p.icon||p.hero) p.rare=true;
    if(p.special) p.rare=true; // specials count as rare for SBC purposes
    p.id=out.length;
    p.key=norm(p.name)+'|'+p.rating;
    out.push(p);
  }
  return {players:out,bad};
}
function quality(r){ return r>=75?'gold':(r>=65?'silver':'bronze'); }

/* ══════════════════ requirement parsing ══════════════════ */
/* kinds:
   rating, chem, size, sameClub, sameLeague, sameNation,
   distinctClubs, distinctLeagues, distinctNations,
   rare, special, quality(param bronze|silver|gold), ovr(param=minOvr),
   namedLeague/namedNation/namedClub (param=name)               */
const KIND_LABEL={
  rating:'Squad rating', chem:'Team chemistry', size:'Players in squad',
  sameClub:'Same club count', sameLeague:'Same league count', sameNation:'Same nation count',
  distinctClubs:'Different clubs', distinctLeagues:'Different leagues', distinctNations:'Different nations',
  rare:'Rare players', special:'Special / TOTW players', quality:'Players of quality', ovr:'Players rated OVR+',
  namedLeague:'Players from league', namedNation:'Players from nation', namedClub:'Players from club'
};
const NEEDS_PARAM={quality:1,ovr:1,namedLeague:1,namedNation:1,namedClub:1};

function newReq(kind,op,value,param,auto){
  return {id:++reqId,kind,op:op||'min',value:Number(value)||0,param:param||'',auto:!!auto};
}
function opFrom(text){
  const t=norm(text);
  if(/\bmax(imum)?\b|\bno more than\b|\bup to\b/.test(t)) return 'max';
  if(/\bexact(ly)?\b/.test(t)) return 'exactly';
  return 'min';
}
/* find a named league / nation / club mentioned in a line, using the club as a lexicon */
function lexicon(club){
  const L=new Map(),N=new Map(),C=new Map();
  club.forEach(p=>{
    if(p.league) L.set(norm(p.league),p.league);
    if(p.nation) N.set(norm(p.nation),p.nation);
    if(p.club)   C.set(norm(p.club),p.club);
  });
  Object.entries(LEAGUE_ALIASES).forEach(([k,v])=>{ if(!L.has(k)) L.set(k,v); });
  NATIONS.forEach(n=>{ if(!N.has(n)) N.set(n,n.replace(/\b\w/g,c=>c.toUpperCase())); });
  return {L,N,C};
}
function findNamed(line,club){
  const n=norm(line), lex=lexicon(club);
  let best=null;
  const scan=(map,kind)=>{
    for(const [k,v] of map){
      if(k.length<3) continue;
      if(n.includes(k) && (!best||k.length>best.key.length)) best={kind,key:k,value:v};
    }
  };
  scan(lex.L,'namedLeague'); scan(lex.N,'namedNation'); scan(lex.C,'namedClub');
  return best;
}
function numbersIn(line){
  const m=String(line).match(/\d+/g);
  return m?m.map(Number):[];
}
function parseSbc(text,club){
  const found=[],unparsed=[];
  const lines=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  for(const raw of lines){
    // a line may hold several requirements separated by bullets/semicolons
    const chunks=raw.split(/\s*[•·;]\s*|\s{3,}(?=[A-Z])/).map(c=>c.trim()).filter(Boolean);
    let anyChunk=false;
    for(const line of chunks){
      const r=parseReqLine(line,club);
      if(r){ found.push(...r); anyChunk=true; }
      else if(/\d/.test(line) && line.length>3) unparsed.push(line);
    }
    if(!anyChunk && !/\d/.test(raw) && raw.length>3){ /* headings — ignore silently */ }
  }
  // de-dupe on kind+param, keeping the later one
  const seen=new Map();
  found.forEach(r=>seen.set(r.kind+'|'+norm(r.param)+'|'+r.op,r));
  return {reqs:[...seen.values()],unparsed};
}
function parseReqLine(line,club){
  const t=norm(line);
  // quality lines carry no number of their own ("Player Quality: Exactly Gold")
  if(!/\d/.test(t) && !/\b(gold|silver|bronze)\b/.test(t)) return null;
  const nums=numbersIn(t);
  const op=opFrom(t);
  const first=nums.length?nums[nums.length-1]:0; // EA puts the number last: "Squad Rating: Min. 84"

  // squad rating
  if(/\b(squad|team)\s*(overall|rating|ovr)\b|\brating\s*(of the squad)?\b/.test(t) && !/chem/.test(t)){
    const v=nums.find(n=>n>=40&&n<=99);
    if(v) return [newReq('rating',op,v,'',true)];
  }
  // chemistry
  if(/chem/.test(t)){
    const v=nums.find(n=>n>=0&&n<=33) ?? first;
    return [newReq('chem',op,v,'',true)];
  }
  // squad size
  if(/(number of players|players in (the )?squad|squad size|# of players)/.test(t)){
    const v=nums.find(n=>n>=1&&n<=11)||11;
    return [newReq('size','exactly',v,'',true)];
  }
  // "same X count" — max/min size of the biggest shared group
  if(/same\s+club/.test(t))   return [newReq('sameClub',op,first,'',true)];
  if(/same\s+league/.test(t)) return [newReq('sameLeague',op,first,'',true)];
  if(/same\s+(nation|country)/.test(t)) return [newReq('sameNation',op,first,'',true)];
  // distinct counts: "Clubs: Min. 5" / "Number of Leagues: Max 3"
  if(/^(number of\s+)?(different\s+|unique\s+)?clubs?\b/.test(t)&&!/players/.test(t))   return [newReq('distinctClubs',op,first,'',true)];
  if(/^(number of\s+)?(different\s+|unique\s+)?leagues?\b/.test(t)&&!/players/.test(t)) return [newReq('distinctLeagues',op,first,'',true)];
  if(/^(number of\s+)?(different\s+|unique\s+)?(nations?|nationalities|countries)\b/.test(t)&&!/players/.test(t)) return [newReq('distinctNations',op,first,'',true)];
  // rating buckets: "85+ OVR: Min 2", "Players with OVR 84 or higher: 3"
  const ovrM=t.match(/(\d{2})\s*\+?\s*(ovr|rated|rating|overall)/)||t.match(/(ovr|rated|rating|overall)\s*(\d{2})\s*\+/);
  if(ovrM){
    const bucket=Number(ovrM[1].match(/\d+/)?ovrM[1]:ovrM[2]);
    const rest=nums.filter(n=>n!==bucket);
    const cnt=rest.length?rest[rest.length-1]:1;
    if(bucket>=40&&bucket<=99) return [newReq('ovr',op,cnt,String(bucket),true)];
  }
  // quality
  if(/quality/.test(t)||/\b(gold|silver|bronze)\b/.test(t)){
    const q=(t.match(/\b(gold|silver|bronze)\b/)||[])[1];
    if(q){
      const cnt=nums.find(n=>n>=1&&n<=11)||11;
      return [newReq('quality',op==='max'?'max':'min',cnt,q,true)];
    }
  }
  // rare / special
  if(/\brare\b/.test(t))  return [newReq('rare',op,first||1,'',true)];
  if(/\b(totw|team of the week|inform|in ?form|special)\b/.test(t)) return [newReq('special',op,first||1,'',true)];
  // named league / nation / club: "Premier League Players: Min. 3", "Nationality: Brazil Min 1"
  const named=findNamed(line,club);
  if(named){
    const cnt=nums.find(n=>n>=1&&n<=11)||1;
    return [newReq(named.kind,op,cnt,named.value,true)];
  }
  // generic "Nationality: Min. 2" / "League: Min 3"  → treat as same-X count
  if(/^(nationality|nations?)\b/.test(t)) return [newReq('sameNation',op,first,'',true)];
  if(/^leagues?\b/.test(t)) return [newReq('sameLeague',op,first,'',true)];
  if(/^clubs?\b/.test(t))   return [newReq('sameClub',op,first,'',true)];
  return null;
}

/* ══════════════════ squad maths ══════════════════ */
function squadRating(ratings){
  const n=ratings.length||1;
  let sum=0; for(const r of ratings) sum+=r;
  const avg=sum/n;
  let excess=0; for(const r of ratings) if(r>avg) excess+=r-avg;
  const exact=(sum+excess)/n;
  return {exact,rating:Math.floor(exact+1e-9)};
}
const CLUB_T=[[7,3],[4,2],[2,1]], LEAGUE_T=[[8,3],[5,2],[3,1]], NATION_T=[[8,3],[5,2],[2,1]];
function tier(count,table){ for(const [need,pts] of table) if(count>=need) return pts; return 0; }

/* Eligibility is fixed for a given formation + position rule, so compute it once
   per player per solve instead of once per candidate squad (this sits in the hot loop). */
function prepareEligibility(players,formation,relPos){
  const slots=formation.rows.flat();
  const key=formation.name+'|'+(relPos?'rel':'strict');
  for(const p of players){
    if(p._eligKey===key) continue;
    const allowed=new Set();
    p.pos.forEach(pp=>{ (relPos?(RELATED[pp]||[pp]):[pp]).forEach(x=>allowed.add(x)); });
    p._elig=slots.map(s=>allowed.has(s));
    p._eligKey=key;
  }
  return slots;
}
/* assign players to formation slots, maximising chemistry earned */
function assignSlots(players,slots){
  const n=players.length, S=slots.length;
  const elig=players.map(p=>p._elig);
  // how many of these 11 can play each slot — scarce slots get filled first
  const demand=new Array(S).fill(0);
  for(let s=0;s<S;s++) for(let i=0;i<n;i++) if(elig[i][s]) demand[s]++;
  const order=players.map((p,i)=>i).sort((a,b)=>players[b]._pot-players[a]._pot);
  const slotTaken=new Array(S).fill(-1);
  const assign=new Array(n).fill(-1);
  for(const i of order){
    let best=-1,bestDemand=1e9;
    for(let s=0;s<S;s++){
      if(slotTaken[s]!==-1||!elig[i][s]) continue;
      if(demand[s]<bestDemand){bestDemand=demand[s];best=s;}
    }
    if(best>=0){ slotTaken[best]=i; assign[i]=best; }
  }
  // whoever is left goes wherever is free — they simply earn nothing
  const free=[]; for(let s=0;s<S;s++) if(slotTaken[s]===-1) free.push(s);
  for(let i=0;i<n;i++) if(assign[i]===-1){ const s=free.pop(); if(s!==undefined){assign[i]=s;slotTaken[s]=i;} }
  // pairwise swap improvement — a swap only changes those two players, so score the delta directly
  const got=(i,s)=> (s>=0&&elig[i][s])?players[i]._pot:0;
  for(let pass=0;pass<2;pass++){
    let improved=false;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      const si=assign[i],sj=assign[j];
      if(si===sj) continue;
      const delta=(got(i,sj)+got(j,si))-(got(i,si)+got(j,sj));
      if(delta>0){ assign[i]=sj; assign[j]=si; improved=true; }
    }
    if(!improved) break;
  }
  return assign;
}
function chemistry(players,formation,relPos){
  const slots=prepareEligibility(players,formation,relPos);
  const cCount={},lCount={},nCount={};
  players.forEach(p=>{
    const c=norm(p.club),l=norm(p.league),nt=norm(p.nation);
    if(c) cCount[c]=(cCount[c]||0)+1;
    if(l) lCount[l]=(lCount[l]||0)+(p.hero?2:1);
    if(nt) nCount[nt]=(nCount[nt]||0)+(p.icon?2:1);
  });
  players.forEach(p=>{
    if(p.icon||p.hero){ p._pot=3; return; }
    const pts=tier(cCount[norm(p.club)]||0,CLUB_T)+tier(lCount[norm(p.league)]||0,LEAGUE_T)+tier(nCount[norm(p.nation)]||0,NATION_T);
    p._pot=Math.min(3,pts);
  });
  const assign=assignSlots(players,slots);
  let total=0; const detail=[];
  players.forEach((p,i)=>{
    const s=assign[i], slot=s>=0?slots[s]:'—';
    const inPos=s>=0&&!!p._elig[s];
    const got=inPos?p._pot:0;
    total+=got;
    detail.push({player:p,slot,slotIndex:s,inPos,chem:got});
  });
  return {total:Math.min(33,total),detail};
}

/* ══════════════════ requirement evaluation ══════════════════ */
function groupMax(players,field){
  const m={}; let best=0;
  players.forEach(p=>{ const k=norm(p[field]); if(!k)return; m[k]=(m[k]||0)+1; if(m[k]>best)best=m[k]; });
  return best;
}
function distinct(players,field){
  const s=new Set(); players.forEach(p=>{const k=norm(p[field]); if(k)s.add(k);}); return s.size;
}
function reqActual(r,ctx){
  const P=ctx.players;
  switch(r.kind){
    case 'rating': return ctx.rating.rating;
    case 'chem':   return ctx.chem.total;
    case 'size':   return P.length;
    case 'sameClub':   return groupMax(P,'club');
    case 'sameLeague': return groupMax(P,'league');
    case 'sameNation': return groupMax(P,'nation');
    case 'distinctClubs':   return distinct(P,'club');
    case 'distinctLeagues': return distinct(P,'league');
    case 'distinctNations': return distinct(P,'nation');
    case 'rare':    return P.filter(p=>p.rare).length;
    case 'special': return P.filter(p=>p.special).length;
    case 'quality': return P.filter(p=>quality(p.rating)===r.param).length;
    case 'ovr':     return P.filter(p=>p.rating>=Number(r.param||0)).length;
    case 'namedLeague': return P.filter(p=>norm(p.league)===norm(r.param)).length;
    case 'namedNation': return P.filter(p=>norm(p.nation)===norm(r.param)).length;
    case 'namedClub':   return P.filter(p=>norm(p.club)===norm(r.param)).length;
  }
  return 0;
}
function reqShortfall(r,actual,ctx){
  if(r.op==='min')     return Math.max(0,r.value-actual);
  if(r.op==='max')     return Math.max(0,actual-r.value);
  return Math.abs(actual-r.value);
}
function reqLabel(r){
  const base=KIND_LABEL[r.kind]||r.kind;
  const opw=r.op==='min'?'at least':(r.op==='max'?'at most':'exactly');
  if(r.kind==='rating'||r.kind==='chem'||r.kind==='size') return `${base} ${opw} ${r.value}`;
  if(r.kind==='ovr') return `${opw} ${r.value} player(s) rated ${r.param}+`;
  if(r.kind==='quality') return `${opw} ${r.value} ${r.param} player(s)`;
  if(NEEDS_PARAM[r.kind]) return `${opw} ${r.value} from ${r.param}`;
  if(r.kind.startsWith('distinct')) return `${base}: ${opw} ${r.value}`;
  return `${base} ${opw} ${r.value}`;
}
function evaluate(players,formation,opts,reqs){
  const rating=squadRating(players.map(p=>p.rating));
  const chem=chemistry(players,formation,opts.relPos);
  const ctx={players,rating,chem};
  let violation=0; const checks=[];
  for(const r of reqs){
    if(r.kind==='size') continue; // squad size is structural
    const actual=reqActual(r,ctx);
    let short=reqShortfall(r,actual,ctx);
    if(r.kind==='rating'&&r.op==='min'&&opts.safe&&short===0&&rating.exact<r.value+0.5) short=0.5;
    // relative difficulty only — the search scales this so *any* violation
    // outranks *any* price difference, otherwise it would happily buy a cheap failing squad
    const weight=(r.kind==='rating')?1:(r.kind==='chem'?0.35:0.8);
    violation+=short*weight;
    checks.push({req:r,actual,pass:short===0});
  }
  return {rating,chem,checks,violation,ctx};
}
function squadCost(players,untradeMul){
  let c=0; for(const p of players) c+=p.untradeable?p.price*untradeMul:p.price;
  return c;
}

/* ══════════════════ the search ══════════════════ */
function buildPool(club,formation,opts){
  let pool=club.filter(p=>p.rating>0);
  if(opts.excludeIcons) pool=pool.filter(p=>!p.icon&&!p.hero);
  // keep it tractable: prefer cheap + useful. Cap the pool but always keep top-rated & cheapest.
  const CAP=260;
  if(pool.length>CAP){
    const byCost=[...pool].sort((a,b)=>effCost(a,opts)-effCost(b,opts)).slice(0,CAP-90);
    const byRating=[...pool].sort((a,b)=>b.rating-a.rating).slice(0,90);
    pool=[...new Set([...byCost,...byRating])];
  }
  return pool;
}
function effCost(p,opts){ return p.untradeable?p.price*opts.untradeMul:p.price; }

function solveAsync(club,reqs,formation,opts,onProgress,onDone){
  const pool=buildPool(club,formation,opts);
  const size=(reqs.find(r=>r.kind==='size')||{value:11}).value||11;
  if(pool.length<size){ onDone({error:`Only ${pool.length} usable player(s) in your club — need ${size}.`}); return; }

  const budget={fast:26000,deep:90000,max:260000}[opts.effort]||90000;
  const restarts={fast:6,deep:16,max:34}[opts.effort]||16;
  const perRun=Math.max(1200,Math.floor(budget/restarts));

  // Feasibility must always beat thrift: BIG is bigger than the most expensive
  // squad you could possibly field, so one unmet rule costs more than any 11 players.
  const sortedCost=pool.map(p=>effCost(p,opts)).sort((a,b)=>b-a);
  const maxSquadCost=sortedCost.slice(0,size).reduce((a,b)=>a+b,0);
  const BIG=Math.max(1e6,(maxSquadCost+1)*4);

  let bestValid=null, bestAny=null, run=0;
  const gk=pool.filter(p=>p.pos.includes('GK'));
  const outfield=pool.filter(p=>!p.pos.includes('GK'));
  const needsGK=formation.rows.flat().includes('GK');

  function seed(){
    const picked=[];
    const usedIds=new Set();
    if(needsGK&&gk.length){
      const g=gk[Math.floor(Math.random()*Math.min(gk.length,6))]||gk[0];
      picked.push(g); usedIds.add(g.id);
    }
    // bias toward high rating early (rating is the hardest constraint), then cheap
    const wantRating=reqs.some(r=>r.kind==='rating'&&r.op==='min');
    const candidates=(needsGK?outfield:pool).filter(p=>!usedIds.has(p.id));
    const sorted=[...candidates].sort((a,b)=> wantRating ? (b.rating-a.rating)||(effCost(a,opts)-effCost(b,opts)) : (effCost(a,opts)-effCost(b,opts))||(b.rating-a.rating));
    const window=wantRating?Math.max(size+6,18):Math.max(size*3,26);
    while(picked.length<size&&sorted.length){
      const w=Math.min(window,sorted.length);
      const i=Math.floor(Math.random()*w);
      const p=sorted[i];
      if(!usedIds.has(p.id)){picked.push(p);usedIds.add(p.id);}
      sorted.splice(i,1);
    }
    return picked.length===size?picked:null;
  }
  function score(sq){
    const ev=evaluate(sq,formation,opts,reqs);
    const cost=squadCost(sq,opts.untradeMul);
    return {ev,cost,total:ev.violation*BIG+cost};
  }
  function propose(sq){
    const i=Math.floor(Math.random()*size);
    const outP=sq[i];
    // don't swap away the only keeper for an outfielder
    const isOnlyGK=needsGK&&outP.pos.includes('GK')&&sq.filter(p=>p.pos.includes('GK')).length<2;
    const src=isOnlyGK?(gk.length?gk:pool):pool;
    const inP=src[Math.floor(Math.random()*src.length)];
    if(!inP||sq.some(p=>p.id===inP.id)) return null;
    const trial=sq.slice(); trial[i]=inP;
    return trial;
  }
  function record(sq,sc){
    if(sc.ev.violation===0){
      if(!bestValid||sc.cost<bestValid.cost) bestValid={squad:sq.slice(),ev:sc.ev,cost:sc.cost};
    } else if(!bestAny||sc.total<bestAny.total){
      bestAny={squad:sq.slice(),ev:sc.ev,cost:sc.cost,total:sc.total,__partial:true};
    }
  }

  function runOne(){
    let sq=seed(); if(!sq) return;
    let cur=score(sq); record(sq,cur);

    // Phase 1 — satisfy the rules. Cost is only a tie-breaker here.
    const repair=Math.floor(perRun*0.45);
    for(let it=0;it<repair;it++){
      const trial=propose(sq); if(!trial) continue;
      const sc=score(trial);
      const delta=sc.total-cur.total;
      const T=BIG*0.5*(1-it/repair)+1;
      if(delta<0||Math.random()<Math.exp(-delta/T)){ sq=trial; cur=sc; record(sq,cur); }
    }
    // Phase 2 — now get it cheap, refusing anything that breaks a rule.
    const trim=perRun-repair;
    const scale=Math.max(1,maxSquadCost*0.12);
    for(let it=0;it<trim;it++){
      const trial=propose(sq); if(!trial) continue;
      const sc=score(trial);
      if(cur.ev.violation===0&&sc.ev.violation>0) continue; // never give up a legal squad
      const delta=sc.total-cur.total;
      const T=scale*(1-it/trim)+1;
      if(delta<0||Math.random()<Math.exp(-delta/T)){ sq=trial; cur=sc; record(sq,cur); }
    }
  }

  function step(){
    const chunk=Math.max(1,Math.round(restarts/8));
    for(let k=0;k<chunk&&run<restarts;k++,run++) runOne();
    onProgress(run/restarts,bestValid);
    if(run<restarts) setTimeout(step,0);
    else {
      const out=bestValid||bestAny;
      onDone(out?{best:out}:{error:'No squad found. Loosen a rule or add players.'});
    }
  }
  setTimeout(step,0);
}

/* ══════════════════ exports ══════════════════ */
root.SBCEngine={
  // reference data
  POSITIONS,POS_SET,RELATED,FORMATIONS,NATIONS,NATION_SET,LEAGUE_ALIASES,KIND_LABEL,NEEDS_PARAM,
  // helpers
  norm,titled,coins,parsePrice,quality,posTokens,leagueCanon,tagKind,
  // parsing
  parseClub,parseSbc,parseReqLine,newReq,findNamed,
  // maths
  squadRating,chemistry,prepareEligibility,assignSlots,
  // evaluation + search
  evaluate,reqActual,reqShortfall,reqLabel,squadCost,effCost,buildPool,solveAsync
};
})(typeof window!=='undefined'?window:globalThis);
