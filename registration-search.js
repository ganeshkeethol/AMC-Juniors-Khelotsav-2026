(()=>{
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const val=(row,...keys)=>{for(const k of keys){if(row[k]!==undefined&&row[k]!==null&&String(row[k]).trim()!=='')return String(row[k]).trim();}return '';};
 const norm=s=>String(s||'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
 const splitGames=s=>String(s||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
 let kids=[];
 function uniqueSorted(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));}
 function fillSelect(id,values,label){const el=$(id);uniqueSorted(values).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o);});}
 function render(){
  const query=norm($('kid-search').value), game=$('game-filter').value, age=$('age-filter').value, block=$('block-filter').value;
  const filtered=kids.filter(k=>(!game||k.games.some(g=>norm(g)===norm(game)))&&(!age||norm(k.age)===norm(age))&&(!block||norm(k.block)===norm(block))&&(!query||norm([k.name,k.age,k.block,k.flat,...k.games].join(' ')).includes(query)));
  $('result-count').textContent=`Showing ${filtered.length} of ${kids.length} registered kids`;
  $('kids-card-grid').innerHTML=filtered.length?filtered.map(k=>`<article class="kid-reg-card"><h3>👧 ${esc(k.name||'Name not available')}</h3><div class="kid-meta"><div><small>Age Group</small><b>${esc(k.age||'—')}</b></div><div><small>Block</small><b>${esc(k.block||'—')}</b></div><div><small>Flat No.</small><b>${esc(k.flat||'—')}</b></div></div><div class="kid-games-title">GAMES REGISTERED</div><div class="kid-game-badges">${k.games.length?k.games.map(g=>`<span class="kid-game-badge">${esc(g)}</span>`).join(''):'<span class="kid-game-badge">No games listed</span>'}</div><div class="kid-game-count">Total Games: ${k.games.length}</div></article>`).join(''):'<div class="reg-empty">No matching registrations found. Try changing your search or filters.</div>';
 }
 async function init(){
  try{
   if(!window.CONFIG?.apiUrl)throw new Error('API configuration is missing.');
   const response=await fetch(`${CONFIG.apiUrl}?action=enrollments`,{cache:'no-store'});
   if(!response.ok)throw new Error(`Unable to load registrations (${response.status}).`);
   const payload=await response.json(); if(payload.success===false)throw new Error(payload.error||'Registration service returned an error.');
   const rows=payload.enrollments||payload.data?.enrollments||[];
   // Collapse duplicate rows for the same child/flat while combining their game lists.
   const grouped=new Map();
   rows.forEach(r=>{
    const name=val(r,'Child Name','Child','child'), age=val(r,'Age Group','Age','Category','ageGroup'), block=val(r,'Block','block'), flat=val(r,'Flat Number','Flat No','flatNumber');
    const key=[norm(name),norm(age),norm(block),norm(flat)].join('|'); if(!name)return;
    if(!grouped.has(key))grouped.set(key,{name,age,block,flat,games:[]});
    const item=grouped.get(key); splitGames(val(r,'Event','Events','event','Games Registered','Games')).forEach(g=>{if(!item.games.some(x=>norm(x)===norm(g)))item.games.push(g);});
   });
   kids=[...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
   const gameCounts=new Map(); kids.forEach(k=>k.games.forEach(g=>gameCounts.set(g,(gameCounts.get(g)||0)+1)));
   $('total-kids').textContent=kids.length;
   $('total-signups').textContent=[...gameCounts.values()].reduce((a,b)=>a+b,0);
   $('total-games').textContent=gameCounts.size;
   [...gameCounts.keys()].sort((a,b)=>a.localeCompare(b)).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=`${g} (${gameCounts.get(g)})`;$('game-filter').appendChild(o);});
   fillSelect('age-filter',kids.map(k=>k.age)); fillSelect('block-filter',kids.map(k=>k.block));
   ['kid-search','game-filter','age-filter','block-filter'].forEach(id=>$(id).addEventListener(id==='kid-search'?'input':'change',render));
   render();
  }catch(err){$('kids-card-grid').innerHTML=`<div class="reg-empty">${esc(err.message)}<br>Please try again later.</div>`;$('result-count').textContent='Registration data unavailable';}
 }
 document.addEventListener('DOMContentLoaded',init);
})();
