
// Light sports-themed falling emoji decoration. Non-interactive and automatically
// disabled for reduced-motion users.
(function addFallingSportsEmojis(){
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (document.getElementById('falling-sports-emojis')) return;

  const layer = document.createElement('div');
  layer.id = 'falling-sports-emojis';
  layer.setAttribute('aria-hidden','true');

  const icons = ['🎾','🏸','🏀','🏏','🏅','🎾','🏸','🏀','🏏','🏅','🎾','🏸'];
  icons.forEach((icon, i) => {
    const item = document.createElement('span');
    item.className = 'falling-sports-emoji';
    item.textContent = icon;
    item.style.setProperty('--x', `${6 + ((i * 13.7) % 88)}vw`);
    item.style.setProperty('--delay', `${reduceMotion ? '0s' : -(i * 1.35) + 's'}`);
    item.style.setProperty('--duration', `${8 + (i % 5)}s`);
    item.style.setProperty('--drift', `${(i % 2 ? 16 : -16)}px`);
    item.style.setProperty('--size', `${18 + (i % 4) * 3}px`);
    if (reduceMotion) {
      item.classList.add('falling-sports-emoji-static');
      item.style.setProperty('--static-y', `${8 + ((i * 17) % 82)}vh`);
    }
    layer.appendChild(item);
  });

  document.body.appendChild(layer);
})();

// Responsive mobile navigation: desktop top nav, floating mobile menu.
(function(){
  const toggle=document.querySelector('.menu-toggle');
  const menu=document.getElementById('mobile-menu');
  if(!toggle || !menu) return;

  const backdrop=document.createElement('div');
  backdrop.className='mobile-menu-backdrop';
  backdrop.setAttribute('aria-hidden','true');
  document.body.appendChild(backdrop);

  function closeMenu(){
    menu.setAttribute('hidden','');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
    toggle.textContent='☰';
    document.body.classList.remove('mobile-menu-open');
  }

  function openMenu(){
    menu.removeAttribute('hidden');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Close menu');
    toggle.textContent='✕';
    document.body.classList.add('mobile-menu-open');
  }

  toggle.addEventListener('click',()=>{
    const isOpen=!menu.hasAttribute('hidden');
    isOpen ? closeMenu() : openMenu();
  });

  backdrop.addEventListener('click',closeMenu);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !menu.hasAttribute('hidden')) closeMenu();
  });

  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
})();

// Centralised event start label: edit only CONFIG.eventDate in config.js.
const startLabel = (window.CONFIG && CONFIG.eventDate) ? String(CONFIG.eventDate) : "November 1st onwards";
(function(){
  const hero = document.getElementById("event-date-display");
  if(hero) hero.textContent = startLabel;
  const inline = document.getElementById("event-date-inline");
  if(inline) inline.textContent = startLabel;
  const footer = document.getElementById("footer-event-date");
  if(footer) footer.textContent = startLabel;
})();
const events=[
["🏸","Badminton","Racquet sport","badminton"],["🏏","Box Cricket","Team sport","box-cricket"],["🏀","Basketball","Team sport","basketball"],["🎯","Carroms","Indoor game","carroms"],["♟️","Chess","Mind game","chess"],["🏊","Swimming","Aquatic sport","swimming"],["🏓","Table Tennis","Racquet sport","table-tennis"],["🎨","Drawing","Creative activity","drawing"],["🎵","Musical Chairs","Fun game","musical-chairs"],["🧠","Quiz","Fun & knowledge","quiz"],["🚲","Slow Cycling","Fun challenge","slow-cycle"],["🐸","Frog Jump","Fun challenge","frog-jump"],["🎲","Fun Games (4-6)","Fun game • Age 4-6","fun-games-4-6"],["🎭","Fancy Dress","Creative activity","fancy-dress"]];
const eventGrid=document.getElementById("event-grid");
if(eventGrid) eventGrid.innerHTML=events.map(e=>`<a class="card event-card" href="event.html?game=${encodeURIComponent(e[3])}"><div class="emoji">${e[0]}</div><h3>${e[1]}</h3><p>${e[2]}</p><span class="card-link">View event details →</span></a>`).join("");


// Important notifications carousel. Data comes from the configured Google Sheet.
(function loadImportantNotifications(){
  const track=document.getElementById('notifications-track');
  const dots=document.getElementById('notifications-dots');
  const prev=document.querySelector('.notification-prev');
  const next=document.querySelector('.notification-next');
  if(!track || !dots || !window.CONFIG) return;

  const clean=v=>String(v==null?'':v).trim();
  const pick=(r,...keys)=>{
    for(const k of keys){
      if(clean(r[k])) return clean(r[k]);
      const lower=String(k).toLowerCase();
      const found=Object.keys(r||{}).find(x=>String(x).toLowerCase()===lower);
      if(found && clean(r[found])) return clean(r[found]);
    }
    return '';
  };
  const escapeHtml=v=>clean(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalizeRows=rows=>rows.filter(r=>{
    const active=pick(r,'Active','active','Publish','Published','Status');
    return !active || /^(yes|true|1|active|published|show)$/i.test(active);
  }).sort((a,b)=>{
    const pa=Number(pick(a,'Display Order','displayOrder','Order','Priority'))||999, pb=Number(pick(b,'Display Order','displayOrder','Order','Priority'))||999;
    return pa-pb;
  });

  function parseGviz(text){
    const start=text.indexOf('{'), end=text.lastIndexOf('}');
    if(start<0 || end<0) throw new Error('Invalid Google Sheet response');
    const json=JSON.parse(text.slice(start,end+1));
    const cols=(json.table?.cols||[]).map(c=>c.label||c.id||'');
    return (json.table?.rows||[]).map(row=>{
      const obj={}; (row.c||[]).forEach((cell,i)=>obj[cols[i]||String(i)]=cell?.f ?? cell?.v ?? ''); return obj;
    });
  }

  async function fetchNotifications(){
    // First try the existing Apps Script endpoint, so organisers can later expose
    // the same Notifications tab through the central API without changing the UI.
    if(CONFIG.apiUrl){
      try{
        const r=await fetch(CONFIG.apiUrl+'?action=notifications&_='+Date.now(),{cache:'no-store'});
        if(r.ok){ const p=await r.json(); const rows=Array.isArray(p.notifications)?p.notifications:[]; if(rows.length) return normalizeRows(rows); }
      }catch(e){}
    }
    // Direct Google Sheet fallback. The Notifications tab should be published to web.
    const id=clean(CONFIG.notificationsSheetId), sheet=encodeURIComponent(clean(CONFIG.notificationsSheetName||'Notifications'));
    if(!id) return [];
    const url=`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${sheet}&_=${Date.now()}`;
    const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error('Google Sheet unavailable');
    return normalizeRows(parseGviz(await r.text()));
  }

  let items=[], index=0, timer=null;
  const render=()=>{
    if(!items.length){
      track.innerHTML='<div class="notification-empty"><b>No important notifications yet.</b><span>New announcements will appear here when organisers publish them.</span></div>';
      dots.innerHTML=''; if(prev) prev.hidden=true; if(next) next.hidden=true; return;
    }
    if(prev) prev.hidden=false; if(next) next.hidden=false;
    track.innerHTML=items.map((r,i)=>{
      const title=pick(r,'Title','Notification','Heading','Name')||'Important Update';
      const message=pick(r,'Message','Description','Details','Content','Text');
      const date=pick(r,'Date','Publish Date','Published On');
      const link=pick(r,'Link','URL','Url','Action URL');
      const button=pick(r,'Button Text','CTA','Action')||'View details';
      return `<article class="notification-card${i===0?' active':''}" data-index="${i}"><div class="notification-body"><div class="notification-meta">${date?`<span>📅 ${escapeHtml(date)}</span>`:''}</div><h3>${escapeHtml(title)}</h3>${message?`<p>${escapeHtml(message)}</p>`:''}${link?`<a class="notification-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(button)} →</a>`:''}</div></article>`;
    }).join('');
    dots.innerHTML=items.map((_,i)=>`<button type="button" class="notification-dot${i===0?' active':''}" aria-label="Show notification ${i+1}" data-index="${i}"></button>`).join('');
    update();
  };
  const update=()=>{
    const cards=track.querySelectorAll('.notification-card');
    cards.forEach((c,i)=>c.classList.toggle('active',i===index));
    dots.querySelectorAll('.notification-dot').forEach((d,i)=>d.classList.toggle('active',i===index));
    if(cards[index]) track.scrollTo({left:cards[index].offsetLeft-track.offsetLeft,behavior:'smooth'});
  };
  const move=delta=>{ if(!items.length)return; index=(index+delta+items.length)%items.length; update(); restart(); };
  const restart=()=>{ if(timer) clearInterval(timer); if(items.length>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer=setInterval(()=>move(1),7000); };
  prev?.addEventListener('click',()=>move(-1)); next?.addEventListener('click',()=>move(1));
  dots.addEventListener('click',e=>{const b=e.target.closest('.notification-dot'); if(!b)return; index=Number(b.dataset.index)||0; update(); restart();});
  fetchNotifications().then(rows=>{items=rows.slice(0,12); render(); restart();}).catch(()=>render());
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(timer)clearInterval(timer);}else restart();});
})();



// Lightweight homepage high-level schedule. It fetches only one small Google Sheet.
(function loadHighLevelSchedule(){
  const daysEl=document.getElementById('schedule-days');
  const contentEl=document.getElementById('schedule-content');
  if(!daysEl || !contentEl || !window.CONFIG || !CONFIG.apiUrl) return;
  fetch(CONFIG.apiUrl+'?action=highLevelSchedule&_='+Date.now(), {cache:'no-store'})
    .then(r=>r.json())
    .then(payload=>{
      const rows=Array.isArray(payload.schedule)?payload.schedule:[];
      if(!rows.length){
        contentEl.innerHTML='<div class="schedule-empty"><b>Schedule starts '+startLabel+'</b><span>The day-wise schedule will appear here as organisers publish dates and timings.</span></div>';
        return;
      }
      const clean=v=>String(v==null?'':v).trim();
      const get=(r,...keys)=>{for(const k of keys){if(clean(r[k])) return clean(r[k]);}return '';};
      const dayKey=r=>get(r,'Day','day') || 'Schedule';
      const dateVal=r=>get(r,'Date','date');
      const grouped={}; const order=[];
      rows.forEach(r=>{const d=dayKey(r); if(!grouped[d]){grouped[d]=[];order.push(d);} grouped[d].push(r);});
      order.forEach(d=>grouped[d].sort((a,b)=>String(get(a,'Start Time','Event Time','Time')).localeCompare(String(get(b,'Start Time','Event Time','Time')))));
      const formatScheduleDate=v=>{
        const raw=clean(v);
        if(!raw) return '';
        let dt=null;
        let m=raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if(m){ dt=new Date(Number(m[3]), Number(m[2])-1, Number(m[1])); }
        else {
          m=raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
          if(m) dt=new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
        }
        if(!dt || Number.isNaN(dt.getTime())) return raw;
        const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dd=String(dt.getDate()).padStart(2,'0');
        const mm=String(dt.getMonth()+1).padStart(2,'0');
        const yyyy=dt.getFullYear();
        return `${weekdays[dt.getDay()]} • ${dd}-${mm}-${yyyy}`;
      };
      // Show the schedule date on each tab instead of generic labels such as Day 1/Day 2.
      // The date is taken directly from the Date column for that day's schedule rows.
      const formatTabDate=v=>{
        const formatted=formatScheduleDate(v);
        if(!formatted) return 'Schedule';
        const match=formatted.match(/•\s*(\d{2})-(\d{2})-(\d{4})$/);
        if(match){
          const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${Number(match[1])} ${monthNames[Number(match[2])-1]} ${match[3]}`;
        }
        return formatted;
      };
      daysEl.innerHTML=order.map((d,i)=>{
        const groupDate=dateVal(grouped[d][0]);
        const label=formatTabDate(groupDate);
        return `<button class="schedule-day-btn${i===0?' active':''}" data-day="${encodeURIComponent(d)}">${label}</button>`;
      }).join('');
      const renderDay=d=>{
        const list=grouped[d]||[]; const firstDate=dateVal(list[0]);
        const dateLabel=firstDate?`<span class="schedule-date">${formatScheduleDate(firstDate)}</span>`:'';
        contentEl.innerHTML=`<div class="schedule-day-head"><h3>${d}</h3>${dateLabel}</div><div class="schedule-list">${list.map(r=>{
          const time=get(r,'Start Time','Event Time','Time')||'TBA';
          const event=get(r,'Event','Sport','Name')||'Event';
          const age=get(r,'Age Group','Age','Category')||'All Age';
          const venue=get(r,'Venue','Location')||'Venue TBA';
          const status=get(r,'Status')||'';
          return `<div class="schedule-row"><div class="schedule-time">${time}</div><div class="schedule-event"><b>${event}</b><span>${age}</span></div><div class="schedule-venue">📍 ${venue}</div><div class="schedule-status">${status}</div></div>`;
        }).join('')}</div>`;
      };
      daysEl.querySelectorAll('.schedule-day-btn').forEach(btn=>btn.addEventListener('click',()=>{
        daysEl.querySelectorAll('.schedule-day-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderDay(decodeURIComponent(btn.dataset.day));
      }));
      renderDay(order[0]);
    })
    .catch(()=>{contentEl.innerHTML='<div class="schedule-empty"><b>Schedule starts '+startLabel+'</b><span>The day-wise schedule will appear here as organisers publish dates and timings.</span></div>';});
})();


/* Homepage information-banner carousel. Images/captions are managed in the Google Sheet's Gallery tab. */
(function loadEventGallery(){
  const track=document.getElementById('gallery-track');
  const dots=document.getElementById('gallery-dots');
  const count=document.getElementById('gallery-count');
  const prev=document.querySelector('.gallery-prev');
  const next=document.querySelector('.gallery-next');
  const carousel=document.querySelector('.event-gallery-carousel');
  if(!track || !dots || !window.CONFIG) return;

  let images=[], index=0, timer=null;
  const esc=v=>String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  // Google Drive share URLs point to an HTML preview, not an image file.
  // Convert them to direct image endpoints and keep fallback URLs for browsers where one endpoint fails.
  function imageCandidates(raw){
    const value=String(raw||'').trim();
    if(!value) return [];
    let id='';
    try {
      const u=new URL(value);
      if(/(^|\.)drive\.google\.com$/i.test(u.hostname)){
        id=(u.pathname.match(/\/file\/d\/([^/]+)/)||[])[1] || u.searchParams.get('id') || '';
      }
    } catch(e) {}
    if(!id) return [value];
    return [
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000`,
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`,
      `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}`
    ];
  }
  function render(){
    if(!images.length){
      track.innerHTML='<div class="gallery-empty"><span>📢</span><b>Information banners will appear here</b><small>Organisers can add event schedules, important announcements, guidelines, and other image banners in the Gallery sheet.</small></div>';
      dots.innerHTML=''; count.textContent=''; prev.hidden=true; next.hidden=true; return;
    }
    track.innerHTML=images.map((item,i)=>{
      const candidates=imageCandidates(item.imageUrl);
      return `<figure class="gallery-slide"><img src="${esc(candidates[0]||item.imageUrl)}" data-candidates="${esc(JSON.stringify(candidates))}" data-candidate-index="0" alt="${esc(item.caption || `Information banner ${i+1}`)}" ${i===0?'fetchpriority="high"':'loading="lazy"'}><figcaption ${item.caption?'':'hidden'}>${esc(item.caption)}</figcaption></figure>`;
    }).join('');
    dots.innerHTML=images.map((_,i)=>`<button type="button" aria-label="Show image ${i+1}" aria-selected="${i===index?'true':'false'}" data-index="${i}"></button>`).join('');
    prev.hidden=images.length<2; next.hidden=images.length<2;
    update();
    track.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{
      let candidates=[];
      try{candidates=JSON.parse(img.dataset.candidates||'[]')}catch(e){}
      const nextCandidate=Number(img.dataset.candidateIndex||0)+1;
      if(nextCandidate<candidates.length){img.dataset.candidateIndex=String(nextCandidate);img.src=candidates[nextCandidate];return;}
      img.closest('.gallery-slide').classList.add('gallery-image-error');
    }));
  }
  function update(){
    track.style.transform=`translateX(-${index*100}%)`;
    dots.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-selected',String(i===index)));
    count.textContent=images.length ? `${index+1} / ${images.length}` : '';
  }
  function go(n){if(!images.length)return; index=(n+images.length)%images.length; update();}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){stop();if(images.length>1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>go(index+1),5000);}
  prev.addEventListener('click',()=>{go(index-1);start();});
  next.addEventListener('click',()=>{go(index+1);start();});
  dots.addEventListener('click',e=>{const b=e.target.closest('button[data-index]');if(b){go(Number(b.dataset.index));start();}});
  carousel.addEventListener('mouseenter',stop); carousel.addEventListener('mouseleave',start);
  carousel.addEventListener('focusin',stop); carousel.addEventListener('focusout',start);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());

  async function load(){
    try{
      const response=await fetch(`${CONFIG.apiUrl}?action=gallery&_=${Date.now()}`,{cache:'no-store'});
      if(!response.ok) throw new Error('Information banners unavailable');
      const payload=await response.json();
      images=(Array.isArray(payload.gallery)?payload.gallery:[]).filter(item=>{
        try{return /^https?:$/.test(new URL(item.imageUrl).protocol);}catch(e){return false;}
      });
    }catch(e){images=[];}
    render();start();
  }
  load();
})();
