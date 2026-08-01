/* SBC Autopilot — bookmarklet payload.
   Runs inside the FUT Web App. Reads your club and the SBC on screen, solves it
   with the shared engine, and tells you which players to place. It does not click,
   drag, submit or send anything anywhere — you build the squad yourself.

   Built into fc26/install.html by fc26/build.mjs. Expects window.SBCEngine
   (fc26/engine.js) to have been loaded first — the build concatenates them. */
(function(){
"use strict";
var E=window.SBCEngine;
if(!E){ alert('SBC Autopilot: engine missing — reinstall the bookmarklet.'); return; }
if(window.__SBC_PILOT__){ window.__SBC_PILOT__.toggle(); return; }

/* ══════════════════ value model ══════════════════
   The club list shows no prices, and this tool makes no network calls, so there
   are no real coin values to use. Instead every player is scored by how painful
   he'd be to throw into an SBC — an approximation of market value from rating,
   which is what you actually care about when spending your own club. Labelled as
   an estimate everywhere it's shown. */
var VALUE={74:180,75:420,76:520,77:650,78:820,79:1100,80:1500,81:2100,82:3200,83:5200,84:11000,85:24000,86:44000,87:80000,88:140000,89:250000,90:440000,91:780000};
function estValue(p){
  var r=p.rating,v;
  if(r<=74) v=Math.max(50,180-(74-r)*12);
  else if(r>=91) v=780000*Math.pow(1.75,r-91);
  else v=VALUE[r]||1000;
  if(p.icon||p.hero) v*=3;
  else if(p.special) v*=1.6;
  return Math.round(v);
}

/* ══════════════════ DOM harvesting ══════════════════
   Deliberately heuristic rather than selector-based: EA renames classes between
   titles, but a player tile always contains a 40-99 rating, a position token and
   a crest/flag image. Identity is all chemistry needs, so numeric ids pulled out
   of image URLs work as well as names. */
var POS_SET=E.POS_SET, NATION_SET=E.NATION_SET, norm=E.norm;

function isRating(t){ return /^\d{2}$/.test(t) && +t>=40 && +t<=99; }
function textBits(el){
  var out=[],w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n;
  while(n=w.nextNode()){ var t=(n.nodeValue||'').trim(); if(t) out.push(t); }
  return out;
}
/* One text node often carries several positions ("CB ST" / "CM, CAM"), so test the
   whole bit through the engine's tokeniser rather than looking it up whole. */
function hasPosition(el){
  var bits=textBits(el);
  for(var i=0;i<bits.length;i++) if(E.posTokens(bits[i])) return true;
  return false;
}
function idFromUrl(u){
  var clean=String(u).replace(/[?#].*$/,'');
  var m=clean.match(/(\d+)[^\/\d]*$/);
  return m?m[1]:null;
}
function classifyUrl(u){
  var s=String(u).toLowerCase();
  if(/league|competition/.test(s)) return 'league';       // checked first: "league" URLs often also say "club"
  if(/flag|nation|country/.test(s)) return 'nation';
  if(/club|crest|badge|team/.test(s)) return 'club';
  return null;
}
/* Prefer whichever candidate URL can actually be classified: lazy-loading apps park
   the real crest in data-src and leave a placeholder in src, and an inlined data: URI
   tells us nothing at all. */
function imgUrl(im){
  var cands=[im.getAttribute('data-src'),im.getAttribute('data-original'),im.currentSrc,im.getAttribute('src'),im.src];
  var first='';
  for(var i=0;i<cands.length;i++){
    var u=cands[i];
    if(!u||/^data:/i.test(u)) continue;
    if(!first) first=u;
    if(classifyUrl(u)) return u;
  }
  return first;
}
function imagesIn(tile){
  var out=[];
  var imgs=tile.querySelectorAll('img');
  for(var i=0;i<imgs.length;i++){
    out.push({url:imgUrl(imgs[i]),label:imgs[i].alt||imgs[i].title||imgs[i].getAttribute('aria-label')||''});
  }
  var all=tile.querySelectorAll('*');
  if(all.length<=60){ // background-image lookups are expensive; skip on huge subtrees
    for(var j=0;j<all.length;j++){
      var bg='';
      try{ bg=getComputedStyle(all[j]).backgroundImage||''; }catch(e){}
      var m=bg.match(/url\(["']?(.*?)["']?\)/);
      if(m&&m[1]&&m[1]!=='none') out.push({url:m[1],label:all[j].getAttribute('aria-label')||all[j].title||''});
    }
  }
  return out;
}
function readTile(tile,ratingNode){
  var p={name:'',rating:+ratingNode.nodeValue.trim(),pos:[],nation:'',league:'',club:'',
         price:0,untradeable:false,rare:false,special:false,icon:false,hero:false};
  var bits=textBits(tile),seenPos={},nameCands=[];
  for(var i=0;i<bits.length;i++){
    var t=bits[i],pt=E.posTokens(t);
    if(pt){ for(var q=0;q<pt.length;q++) if(!seenPos[pt[q]]){seenPos[pt[q]]=1;p.pos.push(pt[q]);} continue; }
    if(/^\d+$/.test(t)) continue;
    if(t.length>1 && /[a-zA-ZÀ-ɏ]/.test(t)) nameCands.push(t);
  }
  // Longest-string-wins picks card metadata ("Rare · Gold") over the actual name,
  // so score the candidates and let anything that reads like metadata lose.
  function nameScore(t){
    var s=t.length;
    if(/[·•|]/.test(t)) s-=40;
    if(/\b(rare|common|gold|silver|bronze|loan|loans|untradeable|tradeable|contract|fitness|chemistry|quality|totw|special|position|squad|pack)\b/i.test(t)) s-=40;
    if(/\d/.test(t)) s-=3;
    return s;
  }
  var imgs=imagesIn(tile);
  for(var k=0;k<imgs.length;k++){
    var im=imgs[k], lab=im.label.trim(), kind=classifyUrl(im.url), id=idFromUrl(im.url);
    // a label ("England", "Premier League") beats an id, when the app provides one
    if(lab){
      if(!p.nation && NATION_SET.has(norm(lab))){ p.nation=lab; continue; }
      var lg=E.leagueCanon(lab);
      if(lg && !p.league){ p.league=lg; continue; }
    }
    if(!kind||!id) continue;
    if(kind==='club'  && !p.club)   p.club='club#'+id;
    if(kind==='league'&& !p.league) p.league='league#'+id;
    if(kind==='nation'&& !p.nation) p.nation='nation#'+id;
  }
  // best-effort card type from whatever the markup calls itself
  var cls=((tile.className&&tile.className.baseVal!==undefined?tile.className.baseVal:tile.className)||'')+' '+(tile.getAttribute('data-type')||'');
  var c=cls.toLowerCase(), joined=bits.join(' ').toLowerCase();
  if(/\bicon/.test(c)) p.icon=true;
  if(/\bhero/.test(c)) p.hero=true;
  if(/rare|special|totw|inform|informs/.test(c)||/\brare\b/.test(joined)) p.rare=true;
  if(/totw|team of the week|inform/.test(c)||/\btotw\b|team of the week/.test(joined)) p.special=true;
  if(/untradeable|untradable/.test(joined)) p.untradeable=true;
  if(p.icon||p.hero||p.special) p.rare=true;

  nameCands.sort(function(a,b){ return nameScore(b)-nameScore(a); });
  p.name=nameCands[0]||('Player '+p.rating);
  if(!p.pos.length) return null;
  if(p.rating<40||p.rating>99) return null;
  p.price=estValue(p);
  p.key=norm(p.name)+'|'+p.rating+'|'+p.club+'|'+p.nation;
  return p;
}
/* Walk up from a rating until we reach the element that holds the whole card.
   The first ancestor containing a position is usually still too shallow — rating
   and position often sit in the same little header — so keep climbing for one
   that also has the crest/flag images, and refuse anything big enough to be a
   list rather than a card (which is what stops a stray number elsewhere on the
   page from dragging in half the document). */
function findTile(ratingNode){
  var el=ratingNode.parentElement, fallback=null;
  for(var up=0; up<7 && el && el!==document.body; up++, el=el.parentElement){
    if(el.querySelectorAll('*').length>60) break;
    if(!hasPosition(el)) continue;
    if(!fallback) fallback=el;
    if(el.querySelector('img')) return el;
  }
  return fallback;
}
function ratingNodesIn(el){
  var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n,c=0;
  while(n=w.nextNode()){ if(isRating((n.nodeValue||'').trim())) c++; }
  return c;
}
function harvestOnce(store){
  var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n,added=0,seen=0;
  var ratingNodes=[];
  while(n=w.nextNode()){ var t=(n.nodeValue||'').trim(); if(isRating(t)) ratingNodes.push(n); }
  for(var i=0;i<ratingNodes.length;i++){
    var rn=ratingNodes[i], tile=findTile(rn);
    if(!tile) continue;
    if(ratingNodesIn(tile)>3) continue;   // several ratings inside means we grabbed a list
    seen++;
    var p=readTile(tile,rn);
    if(!p) continue;
    if(store.byKey[p.key]) continue;   // identical duplicate cards collapse — see README
    store.byKey[p.key]=p;
    p.id=store.list.length;
    store.list.push(p);
    added++;
  }
  return {added:added,tiles:seen};
}

/* ══════════════════ SBC requirements off the screen ══════════════════ */
var REQ_HINT=/rating|chem|league|nation|club|rare|quality|players|squad|ovr|totw|gold|silver|bronze|country/i;
var REQ_SHAPE=/(\bmin\b|\bmax\b|\bexact|:|\d\s*$)/i;   // "label: value", or a min/max/exactly
var TILE_SHAPE=/\d{2}\s*(GK|CB|LB|RB|LWB|RWB|CDM|CM|CAM|LM|RM|LW|RW|CF|ST)\b/i;
/* Reward and metadata lines sit right beside the rules and read just like them —
   "Reward: Premium Gold Pack" would otherwise become a "gold players" requirement. */
var REQ_NOISE=/\b(reward|rewards|pack|packs|coins|formation|expires|expiry|repeatable|refresh|remaining|complete[ds]?|submit|challenge[sd]?|untradeable pack)\b/i;
function looksLikeRequirement(t){
  if(!t||t.length<5||t.length>110) return false;
  if(REQ_NOISE.test(t)) return false;
  if(!REQ_HINT.test(t)) return false;
  if(!/\d/.test(t) && !/\b(gold|silver|bronze)\b/i.test(t)) return false;
  if(!REQ_SHAPE.test(t)) return false;
  if(TILE_SHAPE.test(t)) return false;                 // that's a player card, not a rule
  var bits=t.split(/\s+/);
  for(var i=0;i<bits.length;i++) if(POS_SET.has(bits[i].toUpperCase())) return false;
  return true;
}
function scrapeRequirements(){
  var cands=[],els=document.querySelectorAll('div,span,li,p,td,dt,dd,h1,h2,h3,h4,label');
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(el.children.length>3) continue;                 // leaves, not containers
    var t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(looksLikeRequirement(t)) cands.push({el:el,text:t});
  }
  if(!cands.length) return [];
  /* Requirements sit together in one panel, so the ancestor shared by the most
     candidates is that panel. Scoping to it keeps stray matches elsewhere on the
     page (a club list, a promo banner) out of the parsed rules. */
  var tally=[],nodes=[];
  for(var c=0;c<cands.length;c++){
    var a=cands[c].el;
    for(var up=0; up<5 && a && a!==document.body; up++, a=a.parentElement){
      var idx=nodes.indexOf(a);
      if(idx<0){ nodes.push(a); tally.push(1); } else tally[idx]++;
    }
  }
  var best=null,bestN=0;
  for(var k=0;k<nodes.length;k++){
    if(tally[k]>bestN || (tally[k]===bestN && best && nodes[k].querySelectorAll('*').length<best.querySelectorAll('*').length)){
      bestN=tally[k]; best=nodes[k];
    }
  }
  var out=[],seen={};
  for(var m=0;m<cands.length;m++){
    if(best && !best.contains(cands[m].el)) continue;
    if(seen[cands[m].text]) continue;
    seen[cands[m].text]=1; out.push(cands[m].text);
  }
  return out;
}
function detectFormation(){
  var t=(document.body.innerText||'').replace(/\s+/g,' ');
  for(var i=0;i<E.FORMATIONS.length;i++){
    var f=E.FORMATIONS[i];
    if(new RegExp('(^|[^\\d-])'+f.name.replace(/-/g,'\\-')+'([^\\d-]|$)').test(t)) return i;
  }
  return 1; // 4-3-3
}

/* ══════════════════ panel ══════════════════ */
var host=document.createElement('div');
host.id='sbc-autopilot-host';
host.style.cssText='position:fixed;top:70px;right:18px;z-index:2147483647;width:360px;max-width:calc(100vw - 24px)';
var root=host.attachShadow?host.attachShadow({mode:'open'}):host; // shadow DOM keeps EA's CSS out
document.documentElement.appendChild(host);

var CSS='\
:host,*{box-sizing:border-box}\
.p{font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;background:#0d1119;color:#eef2f8;border:1px solid #2b3648;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}\
.h{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#131926;border-bottom:1px solid #1e2735;cursor:move;user-select:none}\
.h b{font-size:12px;letter-spacing:.12em;text-transform:uppercase;flex:1}\
.h .dot{width:8px;height:8px;border-radius:50%;background:#00e07a}\
.h button{background:none;border:1px solid #2b3648;color:#8d97ab;width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:12px;line-height:1;padding:0}\
.h button:hover{color:#eef2f8;border-color:#00e07a}\
.b{padding:12px;max-height:70vh;overflow:auto}\
.p.min .b{display:none}\
.s{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e2735}\
.s:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}\
.t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8d97ab;margin-bottom:7px;font-weight:700}\
button.a{background:#00e07a;color:#04150d;border:none;border-radius:8px;padding:8px 12px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit}\
button.a:hover{background:#00b863}\
button.a:disabled{opacity:.45;cursor:not-allowed}\
button.g{background:#131926;color:#eef2f8;border:1px solid #2b3648;border-radius:8px;padding:7px 11px;font-size:12px;cursor:pointer;font-family:inherit}\
button.g:hover{border-color:#00e07a;color:#00e07a}\
button.on{background:#07281c;border-color:#00e07a;color:#00e07a}\
.row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}\
.st{font-size:11px;color:#8d97ab;margin-top:7px;line-height:1.5}\
.st b{color:#eef2f8}\
.warn{color:#ffb020}\
.bad{color:#ff5a5a}\
.good{color:#00e07a}\
textarea{width:100%;min-height:86px;background:#080b12;color:#eef2f8;border:1px solid #2b3648;border-radius:8px;padding:7px;font:11px/1.5 ui-monospace,Menlo,monospace;resize:vertical}\
select{background:#131926;color:#eef2f8;border:1px solid #2b3648;border-radius:7px;padding:5px 7px;font-size:11px;font-family:inherit}\
.pr{height:5px;background:#1a2233;border-radius:9px;overflow:hidden;margin-top:8px;display:none}\
.pr.on{display:block}.pr i{display:block;height:100%;width:0;background:#00e07a}\
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}\
td{padding:4px 5px;border-bottom:1px solid #1e2735;vertical-align:top}\
td.sl{font:700 10px ui-monospace,monospace;color:#8d97ab;white-space:nowrap}\
td.ov{font-weight:700;color:#f5c451;width:22px}\
td.ch{text-align:right;color:#8d97ab;white-space:nowrap}\
.oop{color:#ff5a5a}\
.cl{display:flex;gap:7px;font-size:11px;padding:3px 0}\
.cl i{font-style:normal;font-weight:700;width:30px}\
.note{font-size:10px;color:#5d6779;margin-top:8px;line-height:1.5}';

var wrap=document.createElement('div');
wrap.innerHTML='<style>'+CSS+'</style>\
<div class="p" id="panel">\
 <div class="h" id="drag"><span class="dot"></span><b>SBC Autopilot</b>\
  <button id="min" title="Minimise">–</button><button id="cls" title="Close">×</button></div>\
 <div class="b">\
  <div class="s">\
   <div class="t">1 · Your club</div>\
   <div class="row"><button class="g" id="harv">Start harvesting</button><button class="g" id="copyClub">Copy club</button><button class="g" id="clr">Clear</button></div>\
   <div class="st" id="clubSt">Turn harvesting on, then scroll through your club so every player renders.</div>\
  </div>\
  <div class="s">\
   <div class="t">2 · The SBC on screen</div>\
   <div class="row"><button class="g" id="read">Read requirements</button></div>\
   <textarea id="sbcTxt" placeholder="Open an SBC, then hit Read requirements. Edit anything it gets wrong."></textarea>\
   <div class="st" id="sbcSt">Nothing read yet.</div>\
  </div>\
  <div class="s">\
   <div class="t">3 · Solve</div>\
   <div class="row"><select id="form"></select><select id="eff">\
     <option value="fast">Fast</option><option value="deep" selected>Deep</option><option value="max">Exhaustive</option></select>\
    <button class="a" id="solve">Solve</button></div>\
   <div class="pr" id="pr"><i></i></div>\
   <div class="st" id="solveSt">Harvest a club and read an SBC first.</div>\
  </div>\
  <div class="s" id="resWrap" style="display:none">\
   <div class="t">4 · Build this</div>\
   <div id="res"></div>\
   <div class="row" style="margin-top:9px"><button class="g" id="copyRes">Copy squad</button></div>\
  </div>\
  <div class="note">Values are estimated from rating — the web app shows no prices and this tool makes no network calls. It reads the page and nothing else: no clicking, no submitting, nothing sent anywhere. Unofficial, not affiliated with EA.</div>\
 </div>\
</div>';
root.appendChild(wrap);
var $=function(s){ return root.getElementById?root.getElementById(s):wrap.querySelector('#'+s); };

/* ══════════════════ state + wiring ══════════════════ */
var store={list:[],byKey:{}}, reqs=[], lastRes=null, harvesting=false, timer=null, obs=null, solving=false;

function clubStatus(){
  var n=store.list.length;
  if(!n){ $('clubSt').innerHTML='Turn harvesting on, then scroll through your club so every player renders.'; return; }
  var withClub=0,withLeague=0,withNation=0,rare=0;
  for(var i=0;i<n;i++){ var p=store.list[i];
    if(p.club)withClub++; if(p.league)withLeague++; if(p.nation)withNation++; if(p.rare)rare++; }
  var chemOk=(withClub+withLeague+withNation)/(n*3);
  $('clubSt').innerHTML='<b>'+n+'</b> players · club '+withClub+' · league '+withLeague+' · nation '+withNation+' · looked rare '+rare+
    (chemOk<0.6?'<br><span class="warn">Chemistry data is patchy — crest/flag images were not recognised, so chemistry rules may be wrong.</span>':'');
}
function setHarvest(on){
  harvesting=on;
  var b=$('harv');
  b.textContent=on?'Harvesting… (stop)':'Start harvesting';
  b.className=on?'g on':'g';
  if(on){
    var sweep=function(){ last=Date.now(); var r=harvestOnce(store); if(r.added) clubStatus(); };
    /* Throttle, never debounce: while you keep scrolling the list keeps mutating, and
       a debounce would postpone every sweep until you stopped — by which point the
       rows you scrolled past are long gone from the DOM. */
    var last=0,pending=null;
    var schedule=function(){
      var wait=250-(Date.now()-last);
      if(wait<=0){ if(pending){clearTimeout(pending);pending=null;} sweep(); }
      else if(!pending) pending=setTimeout(function(){ pending=null; sweep(); },wait);
    };
    sweep();
    timer=setInterval(sweep,700);
    if(window.MutationObserver){
      obs=new MutationObserver(schedule);
      obs.observe(document.body,{childList:true,subtree:true});
      obs._clear=function(){ if(pending) clearTimeout(pending); };
    }
  } else {
    clearInterval(timer); timer=null;
    if(obs){ obs.disconnect(); if(obs._clear) obs._clear(); obs=null; }
  }
  clubStatus();
}
$('harv').onclick=function(){ setHarvest(!harvesting); };
$('clr').onclick=function(){ store={list:[],byKey:{}}; clubStatus(); };
$('copyClub').onclick=function(){
  var lines=['name\trating\tpos\tnation\tleague\tclub\tprice\ttags'];
  for(var i=0;i<store.list.length;i++){ var p=store.list[i];
    lines.push([p.name,p.rating,p.pos.join('/'),p.nation,p.league,p.club,p.price,
      [p.icon?'icon':'',p.hero?'hero':'',p.special?'totw':'',p.rare?'rare':'',p.untradeable?'untradeable':''].filter(Boolean).join(' ')].join('\t'));
  }
  copy(lines.join('\n'),'Club copied — paste it into the solver page');
};

function reparse(){
  var out=E.parseSbc($('sbcTxt').value,store.list);
  reqs=out.reqs;
  var names=[];
  for(var i=0;i<reqs.length;i++) names.push(E.reqLabel(reqs[i]));
  $('sbcSt').innerHTML=reqs.length
    ? '<span class="good">'+reqs.length+' rule(s):</span> '+names.join(' · ')+(out.unparsed.length?'<br><span class="warn">Ignored '+out.unparsed.length+' line(s).</span>':'')
    : '<span class="warn">No rules recognised — type them in, e.g. "Squad Rating: Min. 84".</span>';
}
$('read').onclick=function(){
  var lines=scrapeRequirements();
  $('sbcTxt').value=lines.join('\n');
  reparse();
  if(!lines.length) $('sbcSt').innerHTML='<span class="bad">Found nothing on screen — open the SBC\'s requirements panel, or type them in.</span>';
};
$('sbcTxt').oninput=function(){ clearTimeout(reparse._t); reparse._t=setTimeout(reparse,250); };

var fsel=$('form'),fopt='';
for(var i=0;i<E.FORMATIONS.length;i++) fopt+='<option value="'+i+'">'+E.FORMATIONS[i].name+'</option>';
fsel.innerHTML=fopt;
fsel.value=String(detectFormation());

$('solve').onclick=function(){
  if(solving) return;
  if(store.list.length<11){ $('solveSt').innerHTML='<span class="bad">Only '+store.list.length+' players harvested — need at least 11.</span>'; return; }
  var formation=E.FORMATIONS[+fsel.value]||E.FORMATIONS[1];
  var opts={relPos:true,safe:false,excludeIcons:false,untradeMul:1,effort:$('eff').value};
  solving=true; $('solve').disabled=true; $('pr').className='pr on'; $('pr').firstChild.style.width='0%';
  $('solveSt').textContent='Searching…';
  E.solveAsync(store.list,reqs,formation,opts,
    function(pct){ $('pr').firstChild.style.width=Math.round(pct*100)+'%'; },
    function(out){
      solving=false; $('solve').disabled=false; $('pr').className='pr';
      if(out.error){ $('solveSt').innerHTML='<span class="bad">'+out.error+'</span>'; return; }
      render(out.best,formation);
    });
};

function render(res,formation){
  lastRes=res; lastRes.formation=formation;
  var ev=res.ev, det=ev.chem.detail.slice().sort(function(a,b){ return a.slotIndex-b.slotIndex; });
  var allPass=true; for(var i=0;i<ev.checks.length;i++) if(!ev.checks[i].pass) allPass=false;
  var h='<div class="st"><b>'+formation.name+'</b> · rating <b>'+ev.rating.rating+'</b> ('+ev.rating.exact.toFixed(2)+
        ') · chem <b>'+ev.chem.total+'</b>/33 · est. value <b>'+E.coins(res.cost)+'</b></div><table>';
  for(var j=0;j<det.length;j++){ var d=det[j];
    h+='<tr><td class="sl'+(d.inPos?'':' oop')+'">'+d.slot+(d.inPos?'':' ⚠')+'</td><td class="ov">'+d.player.rating+
       '</td><td>'+esc(d.player.name)+'</td><td class="ch">'+d.chem+'/3</td></tr>';
  }
  h+='</table>';
  for(var k=0;k<ev.checks.length;k++){ var c=ev.checks[k];
    h+='<div class="cl"><i class="'+(c.pass?'good':'bad')+'">'+(c.pass?'PASS':'FAIL')+'</i><span>'+esc(E.reqLabel(c.req))+' — you have '+c.actual+'</span></div>';
  }
  if(!allPass) h+='<div class="st bad">Some rules are still short — this is the closest it found.</div>';
  $('res').innerHTML=h;
  $('resWrap').style.display='';
  $('solveSt').innerHTML=allPass?'<span class="good">Solved — every rule met.</span>':'<span class="warn">Closest squad shown.</span>';
}
$('copyRes').onclick=function(){
  if(!lastRes) return;
  var det=lastRes.ev.chem.detail.slice().sort(function(a,b){ return a.slotIndex-b.slotIndex; }),out=[];
  out.push('SBC squad — '+lastRes.formation.name+'  ·  rating '+lastRes.ev.rating.rating+'  ·  chem '+lastRes.ev.chem.total+'/33');
  for(var i=0;i<det.length;i++) out.push(pad(det[i].slot,5)+pad(String(det[i].player.rating),4)+det[i].player.name+(det[i].inPos?'':'   (out of position)'));
  copy(out.join('\n'),'Squad copied');
};
function pad(s,n){ while(s.length<n) s+=' '; return s; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function copy(text,msg){
  var done=function(){ var el=$('solveSt'); var old=el.innerHTML; el.innerHTML='<span class="good">'+msg+'</span>'; setTimeout(function(){ el.innerHTML=old; },1800); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done,fallback); }
  else fallback();
  function fallback(){
    var ta=document.createElement('textarea');
    ta.value=text; ta.style.cssText='position:fixed;top:-2000px';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ alert(text); }
    document.body.removeChild(ta);
  }
}

/* drag / minimise / close */
(function(){
  var d=$('drag'),sx=0,sy=0,ox=0,oy=0,on=false;
  d.addEventListener('mousedown',function(e){
    if(e.target.tagName==='BUTTON') return;
    on=true; sx=e.clientX; sy=e.clientY;
    var r=host.getBoundingClientRect(); ox=r.left; oy=r.top;
    e.preventDefault();
  });
  window.addEventListener('mousemove',function(e){
    if(!on) return;
    host.style.left=(ox+e.clientX-sx)+'px';
    host.style.top=(oy+e.clientY-sy)+'px';
    host.style.right='auto';
  });
  window.addEventListener('mouseup',function(){ on=false; });
})();
$('min').onclick=function(){ var p=$('panel'); p.className=p.className.indexOf('min')<0?'p min':'p'; };
$('cls').onclick=function(){ setHarvest(false); host.remove(); window.__SBC_PILOT__=null; };

window.__SBC_PILOT__={
  toggle:function(){ host.style.display=host.style.display==='none'?'':'none'; },
  store:store
};
clubStatus();
})();
