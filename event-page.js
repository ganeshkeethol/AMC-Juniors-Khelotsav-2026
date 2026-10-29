// Sport-specific rules shown on each event page. The homepage keeps only a general Rules & Guidelines link.
const rules = {
  "Badminton": [
    "Players must report at the venue before their scheduled match time.",
    "Players should bring suitable sports shoes and badminton equipment if instructed by the organisers.",
    "Matches will follow the draw and format announced by the organisers.",
    "Players must follow the referee/official's decisions and maintain sportsmanship.",
    "The organiser may modify match format or timing if required for smooth conduct."
  ],
  "Box Cricket": [
    "Teams must report before the scheduled match.",
    "Players must follow the announced team size, overs and playing format.",
    "Only registered participants may play.",
    "Umpire decisions during the match will be final.",
    "Players must maintain fair play and respectful conduct."
  ],
  "Basketball": [
    "Players must report before the scheduled game.",
    "Teams must follow the announced game format and playing time.",
    "Only registered players may participate.",
    "Referee decisions are final during play.",
    "Safe and respectful play is expected from all participants."
  ],
  "Carroms": [
    "Players must report before the scheduled match or session.",
    "Only registered participants may play.",
    "Players must follow the announced match format and turn order.",
    "The umpire/official's decision during play is final.",
    "Players must maintain fair play and respectful conduct."
  ],
  "Chess": [
    "Players must report before the scheduled round.",
    "Only registered participants may play in the announced age group.",
    "Players must follow the published draw, round format and time control.",
    "Players must follow the coordinator's decisions during play.",
    "Respectful behaviour and fair play are expected throughout."
  ],
  "Swimming": [
    "Participants must report before the scheduled event and follow pool instructions.",
    "Only registered participants may enter the competition area.",
    "Participants must follow lane, heat and event instructions given by officials.",
    "Pool safety rules and lifeguard instructions must be followed at all times.",
    "The organiser may adjust heats or timings for safety and smooth conduct."
  ],
  "Table Tennis": [
    "Players must report before their scheduled match time.",
    "Matches will follow the draw and format announced by the organisers.",
    "Only registered participants may play.",
    "Players must follow the official's decisions and maintain sportsmanship.",
    "The organiser may modify match format or timing when required."
  ],
  "Drawing": [
    "Participants must report before the scheduled drawing session.",
    "Only registered participants may take part in the competition.",
    "Participants must use the materials and theme specified by the organisers.",
    "Work should be completed within the announced time limit.",
    "Entries will be judged according to the criteria communicated for the event."
  ],
  "Musical Chairs": [
    "Participants must report before the scheduled game session.",
    "Children must follow the instructions of the game coordinator.",
    "Participants must move safely and avoid pushing or unsafe behaviour.",
    "The game will continue according to the announced elimination format.",
    "The coordinator's decision during the game will be final."
  ],
  "Quiz": [
    "Participants must report before the scheduled quiz session.",
    "Only registered participants may take part.",
    "Participants must follow the announced rounds, question format and time limits.",
    "Answers must be given according to the instructions of the quiz coordinator.",
    "The quiz coordinator's decision on scoring and tie-breaks will be final."
  ],
  "Slow Cycling": [
    "Participants must report before the scheduled race.",
    "Helmets and any safety equipment required by the organisers must be used.",
    "The objective is to maintain balance and move as slowly as possible without putting a foot down.",
    "Pushing, blocking or unsafe riding is not allowed.",
    "Officials' decisions during the race will be final."
  ],
  "Frog Jump": [
    "Participants must report before the scheduled game.",
    "Children must follow the instructions of the game coordinator.",
    "The announced course, turn order and age-group format must be followed.",
    "Participants must maintain safe spacing and avoid contact with others.",
    "The coordinator's decision during the game will be final."
  ],
  "Fun Games (4-6)": [
    "This event is for children in the announced 4–6 age group.",
    "Participants must report before the game session.",
    "Children must follow the instructions of the game coordinator.",
    "Games will be conducted with age-appropriate safety measures.",
    "The organiser may adjust individual game formats according to venue and participation."
  ],
  "Fancy Dress": [
    "Participants must report before the scheduled session.",
    "Children should wear a safe, comfortable costume suitable for movement.",
    "Costumes and accessories must not include sharp, dangerous or obstructive items.",
    "Participants will be presented and judged according to the criteria announced by the organisers.",
    "The organiser or judges’ decision will be final."
  ]
};

const gameSlug = new URLSearchParams(location.search).get('game') || '';
const game = (typeof events !== 'undefined' ? events : []).find(e => e[3] === gameSlug) || (typeof events !== 'undefined' ? events[0] : null);
const gameRules = (typeof rules !== 'undefined' && game) ? (rules[game[1]] || []) : [];

function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function setText(id,v){const el=document.getElementById(id); if(el) el.textContent=v;}
function norm(v){return String(v||'').trim().toLowerCase();}

if(game){
 document.title=`${game[1]} • AMC Juniors Khelotsav 2026`;
 setText('event-title',game[1]); setText('event-type',game[2]); setText('event-emoji',game[0]); setText('rules-heading',`${game[1]} Rules`);
 const list=document.getElementById('rules-list');
 if(list) list.innerHTML=gameRules.map((r,i)=>`<div class="rule"><b>${i+1}</b><span>${esc(r)}</span></div>`).join('');
}

function renderRulesDocs(docs){
 const box=document.getElementById('rules-docs');
 if(!box)return;
 if(!docs.length){box.innerHTML='<div class="doc-empty">No rules document has been published yet.</div>';return;}
 box.innerHTML=docs.map(d=>{
   const url=String(d.url||d.driveUrl||d.link||'').trim();
   if(!url)return '';
   return `<div class="rules-doc"><div class="doc-icon">📄</div><div class="doc-info"><b>${esc(d.title||d.document||'Game Rules Document')}</b><span>${esc(d.type||'Document')}</span></div><div class="doc-actions"><a class="doc-btn" href="${esc(url)}" target="_blank" rel="noopener">Open</a></div></div>`;
 }).join('')||'<div class="doc-empty">No valid rules document link has been published.</div>';
}

const SPORT_CACHE_PREFIX = "khelostav_sport_v5_";
const SPORT_CACHE_MS = 5 * 60 * 1000;

function renderGameData(response){
   const data=response.data || response;

   let volunteers=data.volunteers||response.volunteers||[];
   const enrollments=data.enrollments||response.enrollments||[];
   const schedule=data.schedule||response.schedule||[];
   const results=data.results||response.results||[];
   const teams=data.teams||response.teams||[];
   // Team tab/section is reserved strictly for the two team-based events.
   // Do not trust a per-sheet Team Based flag because stray values in a sport
   // sheet should not make the Teams tab appear for individual events.
   const currentSport=norm(game && game[1]);
   const teamBased=(currentSport === 'box cricket' || currentSport === 'basketball');

   // Rules are stored in the References spreadsheet as the Rules URL
   // for each sport. The sport API returns it as data.rulesUrl.
   // Build the document card directly from that URL.
   const rulesUrl = String(
     data.rulesUrl ||
     response.rulesUrl ||
     ''
   ).trim();

   if(rulesUrl){
     renderRulesDocs([{
       title: `${game[1]} Official Rules`,
       type: 'Google Drive / Google Docs',
       url: rulesUrl
     }]);
   }else{
     renderRulesDocs([]);
   }


   // Show volunteers assigned to this sport. The Volunteers sheet uses "Event / Sport".
   // "SPOC For" is evaluated per event, so a multi-sport volunteer can be SPOC for
   // selected events only. Other volunteers show Name + Block + Flat only.
   const matchingVolunteers = volunteers.filter(v => {
     const sportName = String(v.sport || v["Event / Sport"] || v["Sport / Area"] || v.Event || v.event || "").trim();
     return sportName.split(/[,;\n]+/).map(x => norm(x)).filter(Boolean).includes(norm(game[1]));
   });
   const spocCard=document.getElementById('spoc-card');
   if(spocCard){
     if(matchingVolunteers.length){
       const eventNorm = norm(game[1]);
       const spocEvents = v => String(v.spocFor ?? v["SPOC For"] ?? v.spoc ?? v.SPOC ?? '').split(/[,;\n]+/).map(x => norm(x)).filter(Boolean);
       const primary = matchingVolunteers.find(v => spocEvents(v).includes(eventNorm)) || null;
       const others = primary ? matchingVolunteers.filter(v => v !== primary) : matchingVolunteers;

       const renderContactParts = (v) => {
         const block = v.block || v.Block || '';
         const flat = v.flatNumber || v["Flat No"] || v["Flat Number"] || '';
         const contact = v.mobileNumber || v["Mobile Number"] || v.contact || v.Contact || '';
         const meta = [
           block ? `Block ${esc(block)}` : '',
           flat ? `Flat ${esc(flat)}` : ''
         ].filter(Boolean).join(' • ');
         const rawPhone = String(contact || '').replace(/[^0-9+]/g, '');
         let phoneDigits = rawPhone.replace(/^\+/, '');
         if(phoneDigits.startsWith('0091')) phoneDigits = phoneDigits.slice(2);
         if(phoneDigits.length === 10) phoneDigits = '91' + phoneDigits;
         const callUrl = phoneDigits ? `tel:+${phoneDigits}` : '';
         const waUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : '';
         const actions = phoneDigits ? `<div class="volunteer-actions"><a class="volunteer-call" href="${esc(callUrl)}">📞 Call</a><a class="volunteer-whatsapp" href="${esc(waUrl)}" target="_blank" rel="noopener">💬 WhatsApp</a></div>` : '';
         return {meta,actions};
       };

       const otherNames = others.length
         ? `<div class="volunteer-list"><div class="volunteer-list-title">Other Volunteers</div><ul>${others.map(v=>{
             const n=esc(v.name || v.Name || 'Volunteer');
             const b=String(v.block || v.Block || '').trim();
             const f=String(v.flatNumber || v['Flat No'] || v['Flat Number'] || '').trim();
             const meta=[b ? `Block ${esc(b)}` : '', f ? `Flat ${esc(f)}` : ''].filter(Boolean).join(' • ');
             return `<li><span class="volunteer-list-name">${n}</span>${meta ? ` <span class="volunteer-list-meta">${meta}</span>` : ''}</li>`;
           }).join('')}</ul></div>`
         : '';

       if(primary){
         const primaryName = primary.name || primary.Name || 'Volunteer';
         const {meta,actions} = renderContactParts(primary);
         spocCard.innerHTML = `<article class="volunteer-card spoc-primary"><div class="spoc-icon">👤</div><div class="spoc-details"><div class="spoc-badge">EVENT SPOC</div><h3>${esc(primaryName)}</h3>${meta ? `<p class="volunteer-meta">${meta}</p>` : ''}${actions}</div></article>${otherNames}`;
       }else{
         spocCard.innerHTML = `${otherNames || '<div class="volunteer-list"><div class="volunteer-list-title">Other Volunteers</div><p class="volunteer-list-empty">No volunteers assigned.</p></div>'}`;
       }
     } else {
       spocCard.innerHTML='<div class="spoc-empty"><div class="spoc-icon">👤</div><div><h3>Details will be published soon</h3><p>No volunteer is currently assigned to this sport in the Volunteers sheet.</p></div></div>';
     }
   }

   const participantBody=document.getElementById('participants-body');
   const participantsAgeFilter=document.getElementById('participants-age-filter');
   const participantSearch=document.getElementById('participants-search');
   const participantSearchClear=document.getElementById('participants-search-clear');
   const participantSearchStatus=document.getElementById('participants-search-status');
   const participantAgeOf=row=>String(row["Age Group"]||row.ageGroup||row.Age||row.Category||'').trim();
   const participantNameOf=row=>String(row["Child Name"]||row.Child||row.child||'').trim();
   const participantBlockOf=row=>String(row["Block"]||row.Block||'').trim();
   const participantFlatOf=row=>String(row["Flat Number"]||row["Flat No"]||row.flatNumber||'').trim();
   const participantEventStatusOf=row=>String(row["Event Status"]||row.eventStatus||'').trim();
   const normalizeParticipantAge=value=>{
     const raw=String(value||'').trim().replace(/[–—]/g,'-');
     const digits=raw.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})/i);
     return digits ? `${Number(digits[1])}-${Number(digits[2])}` : raw.toLowerCase();
   };
   const normalizeParticipantSearch=value=>String(value||'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
   // Search the public participant details shown in this table, plus enrollment/event status fields.
   // Phone numbers and other private contact information are intentionally excluded from searching/display.
   const participantSearchText=row=>[
     participantNameOf(row), participantAgeOf(row), participantBlockOf(row), participantFlatOf(row),
     participantEventStatusOf(row), row["Enrollment Status"], row.enrollmentStatus,
     row["Event"], row.event, row["Team ID"], row.teamId, row["Team Name"], row.teamName,
     row["Team Role"], row.teamRole
   ].filter(value=>value!==undefined && value!==null && String(value).trim()!=='').join(' ').toLocaleLowerCase();
   // Populate age-group choices from actual enrollment data, not a hard-coded list.
   const participantAgeMap=new Map();
   enrollments.forEach(row=>{
     const label=participantAgeOf(row), value=normalizeParticipantAge(label);
     if(label && value && !participantAgeMap.has(value)) participantAgeMap.set(value,label);
   });
   const participantAgeGroups=Array.from(participantAgeMap,([value,label])=>({value,label}));
   if(participantsAgeFilter){
     const previous=participantsAgeFilter.value || 'All Age';
     participantsAgeFilter.innerHTML='<option value="All Age">All Age</option>'+participantAgeGroups.map(g=>`<option value="${esc(g.value)}">${esc(g.label)}</option>`).join('');
     participantsAgeFilter.value=participantAgeGroups.some(g=>g.value===previous)?previous:'All Age';
   }
   const renderFilteredParticipants=()=>{
     const selected=participantsAgeFilter?participantsAgeFilter.value:'All Age';
     const query=normalizeParticipantSearch(participantSearch?participantSearch.value:'');
     const ageFiltered=selected==='All Age'?enrollments:enrollments.filter(row=>normalizeParticipantAge(participantAgeOf(row))===selected);
     const filtered=ageFiltered.filter(row=>!query || participantSearchText(row).includes(query));
     const sorted=filtered.slice().sort((a,b)=>{
       const blockCompare=participantBlockOf(a).localeCompare(participantBlockOf(b), undefined, {numeric:true, sensitivity:'base'});
       if(blockCompare!==0) return blockCompare;
       return participantFlatOf(a).localeCompare(participantFlatOf(b), undefined, {numeric:true, sensitivity:'base'});
     });
     setText('participant-count',sorted.length);
     if(participantSearchStatus){
       participantSearchStatus.textContent=query
         ? `Found ${sorted.length} match${sorted.length===1?'':'es'}${selected==='All Age'?'':' in the selected age group'}.`
         : `Showing ${sorted.length} enrolled kid${sorted.length===1?'':'s'}${selected==='All Age'?'':' in the selected age group'}.`;
     }
     if(participantBody){
       let emptyMessage='No enrolled kids published yet.';
       if(enrollments.length && query) emptyMessage='No enrolled kids match your search. Try another name or detail.';
       else if(enrollments.length && selected!=='All Age') emptyMessage='No enrolled kids in this age group yet.';
       participantBody.innerHTML=sorted.length?sorted.map(x=>`<tr><td><b>${esc(participantNameOf(x))}</b></td><td>${esc(participantAgeOf(x))}</td><td>${esc(participantBlockOf(x))}</td><td>${esc(participantFlatOf(x))}</td><td>${esc(participantEventStatusOf(x))}</td></tr>`).join(''):`<tr><td colspan="5">${esc(emptyMessage)}</td></tr>`;
     }
   };
   if(participantsAgeFilter) participantsAgeFilter.addEventListener('change',renderFilteredParticipants);
   if(participantSearch) participantSearch.addEventListener('input',renderFilteredParticipants);
   if(participantSearchClear) participantSearchClear.addEventListener('click',()=>{
     if(participantSearch){participantSearch.value='';participantSearch.focus();}
     renderFilteredParticipants();
   });
   renderFilteredParticipants();

   // Group games: show team cards and use Team A / Team B schedule & results.
   const teamsSection=document.getElementById('teams-section');
   const teamsGrid=document.getElementById('teams-grid');
   if(teamsSection){
     teamsSection.hidden=!teamBased;
   }
   const teamMenu=document.getElementById('menu-event-teams');
   const desktopTeamMenu=document.getElementById('desktop-event-teams');
   if(teamMenu){ teamMenu.hidden=!teamBased; teamMenu.style.display=teamBased?'':'none'; }
   if(desktopTeamMenu){ desktopTeamMenu.hidden=!teamBased; desktopTeamMenu.style.display=teamBased?'':'none'; }
   if(teamsGrid && teamBased){
     const sourceTeams = teams.length ? teams : buildTeamsFromEnrollments(enrollments);
     teamsGrid.innerHTML = sourceTeams.length ? sourceTeams.map(t=>{
       const id=t["Team ID"]||t.teamId||t.TeamID||'';
       const name=t["Team Name"]||t.teamName||t.Name||t.name||'Team';
       const age=t["Age Group"]||t.ageGroup||'';
       const captain=t.Captain||t.captain||'';
       const status=t["Team Status"]||t.status||t.Status||'';
       const teamPlayers=enrollments.filter(x=>String(x["Team ID"]||x.teamId||'').trim()===String(id).trim());
       const playerRows=teamPlayers.map(x=>({
         name:String(x["Child Name"]||x.Child||x.child||'').trim(),
         role:String(x["Team Role"]||x.teamRole||x.Role||x.role||'').trim().toLowerCase()
       })).filter(x=>x.name);
       const count=playerRows.length;
       const playersHtml=count
         ? `<div class="team-players"><span class="team-players-label">Players:</span><ul>${playerRows.map(player=>`<li>${esc(player.name)}${player.role==='captain'?` <span class="team-captain-badge">Captain</span>`:''}</li>`).join('')}</ul></div>`
         : `<p class="team-no-players">No players assigned yet.</p>`;
       return `<article class="team-card"><div class="team-icon">👥</div><div class="team-card-content"><h3>${esc(name)}</h3><p><b>${esc(id)}</b>${age?` • Age ${esc(age)}`:''}</p>${captain?`<p>Captain: ${esc(captain)}</p>`:''}<p>${count} player${count===1?'':'s'}${status?` • ${esc(status)}`:''}</p>${playersHtml}</div></article>`;
     }).join('') : '<div class="team-empty">No teams published yet.</div>';
   }

   const scheduleBody=document.getElementById('game-schedule-body');
   const scheduleTable=scheduleBody ? scheduleBody.closest('table') : null;
   const scheduleHead=scheduleTable ? scheduleTable.querySelector('thead tr') : null;
   const scheduleAgeFilter=document.getElementById('schedule-age-filter');
   const scheduleSearch=document.getElementById('schedule-search');
   const scheduleSearchClear=document.getElementById('schedule-search-clear');
   const scheduleSearchStatus=document.getElementById('schedule-search-status');
   const normalizeScheduleSearch=value=>String(value||'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
   const scheduleAgeOf = row => String(row["Age Group"] || row.ageGroup || row.Age || row.Category || '').trim();
   const scheduleSearchText=row=>[
     row.Day,row.day,row.Date,row.date,row["Reporting Time"],row.reporting,row["Event Time"],row.time,
     row.Event,row.event,game[1],scheduleAgeOf(row),row["Participant Name"],row.Participant,row.participant,
     row["Child Name"],row.child,row.Block,row.block,row["Flat Number"],row.flatNumber,row.Venue,row.venue,
     row.Status,row.status,row["Match / Round"],row.Match,row.Round,row.round,row["Team A"],row.TeamA,
     row["Team A Name"],row["Team B"],row.TeamB,row["Team B Name"]
   ].filter(value=>value!==undefined && value!==null && String(value).trim()!=='').join(' ').toLocaleLowerCase();
   const normalizeScheduleAge = value => {
     const raw=String(value||'').trim().replace(/[–—]/g,'-');
     const digits=raw.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})/i);
     return digits ? `${Number(digits[1])}-${Number(digits[2])}` : raw.toLowerCase();
   };
   // Build schedule filter options only from unique, non-empty Age Group values
   // supplied by the schedule data (never from a hard-coded age-group list).
   const scheduleAgeMap=new Map();
   schedule.forEach(row=>{
     const label=scheduleAgeOf(row);
     const value=normalizeScheduleAge(label);
     if(label && value && !scheduleAgeMap.has(value)) scheduleAgeMap.set(value,label);
   });
   const scheduleAgeGroups=Array.from(scheduleAgeMap,([value,label])=>({value,label}));
   if(scheduleAgeFilter){
     const previous=scheduleAgeFilter.value || 'All Age';
     scheduleAgeFilter.innerHTML='<option value="All Age">All Age</option>'+scheduleAgeGroups.map(g=>`<option value="${esc(g.value)}">${esc(g.label)}</option>`).join('');
     scheduleAgeFilter.value=scheduleAgeGroups.some(g=>g.value===previous) ? previous : 'All Age';
   }
   const renderFilteredSchedule=()=>{
     const selected=scheduleAgeFilter ? scheduleAgeFilter.value : 'All Age';
     const query=normalizeScheduleSearch(scheduleSearch ? scheduleSearch.value : '');
     const ageFiltered=selected==='All Age' ? schedule : schedule.filter(x=>normalizeScheduleAge(scheduleAgeOf(x))===selected);
     const filtered=ageFiltered.filter(row=>!query || scheduleSearchText(row).includes(query));
     if(scheduleSearchStatus){
       scheduleSearchStatus.textContent=query
         ? `Showing ${filtered.length} of ${schedule.length} schedule item${schedule.length===1?'':'s'} matching “${scheduleSearch.value.trim()}”.`
         : `Showing ${filtered.length} schedule item${filtered.length===1?'':'s'}. Search across all schedule details, or combine search with the age-group filter.`;
     }
     if(!scheduleBody) return;
     if(teamBased){
       if(scheduleHead) scheduleHead.innerHTML='<th>Day</th><th>Date</th><th>Reporting</th><th>Event Time</th><th>Age Group</th><th>Match / Round</th><th>Team A</th><th>Team B</th><th>Venue</th><th>Status</th>';
       scheduleBody.innerHTML=filtered.length?filtered.map(x=>`<tr><td>${esc(x.Day||x.day)}</td><td>${esc(x.Date||x.date)}</td><td>${esc(x["Reporting Time"]||x.reporting)}</td><td>${esc(x["Event Time"]||x.time)}</td><td>${esc(scheduleAgeOf(x))}</td><td>${esc(x["Match / Round"]||x.Match||x.Round||x.round||x["Round"]||'')}</td><td>${esc(x["Team A"]||x.TeamA||x["Team A Name"]||'')}</td><td>${esc(x["Team B"]||x.TeamB||x["Team B Name"]||'')}</td><td>${esc(x.Venue||x.venue)}</td><td>${esc(x.Status||x.status)}</td></tr>`).join(''):`<tr><td colspan="10">${query?'No schedule items match your search. Try another keyword.':(schedule.length?'No schedule published for this age group yet.':'No schedule published yet.')}</td></tr>`;
     }else{
       if(scheduleHead) scheduleHead.innerHTML='<th>Day</th><th>Date</th><th>Reporting</th><th>Event Time</th><th>Event</th><th>Age Group</th><th>Participant</th><th>Block</th><th>Flat Number</th><th>Venue</th><th>Status</th>';
       scheduleBody.innerHTML=filtered.length?filtered.map(x=>`<tr><td>${esc(x.Day||x.day)}</td><td>${esc(x.Date||x.date)}</td><td>${esc(x["Reporting Time"]||x.reporting)}</td><td>${esc(x["Event Time"]||x.time)}</td><td>${esc(x.Event||x.event||game[1])}</td><td>${esc(scheduleAgeOf(x))}</td><td>${esc(x["Participant Name"]||x.Participant||x.participant||x["Child Name"]||x.child)}</td><td>${esc(x.Block||x.block)}</td><td>${esc(x["Flat Number"]||x.flatNumber)}</td><td>${esc(x.Venue||x.venue)}</td><td>${esc(x.Status||x.status)}</td></tr>`).join(''):`<tr><td colspan="11">${query?'No schedule items match your search. Try another keyword.':(schedule.length?'No schedule published for this age group yet.':'No schedule published yet.')}</td></tr>`;
     }
   };
   if(scheduleAgeFilter) scheduleAgeFilter.onchange=renderFilteredSchedule;
   if(scheduleSearch) scheduleSearch.addEventListener('input',renderFilteredSchedule);
   if(scheduleSearchClear) scheduleSearchClear.addEventListener('click',()=>{
     if(scheduleSearch){scheduleSearch.value='';scheduleSearch.focus();}
     renderFilteredSchedule();
   });
   renderFilteredSchedule();

   const resultsBody=document.getElementById('game-results-body');
   const resultsTable=resultsBody ? resultsBody.closest('table') : null;
   const resultsHead=resultsTable ? resultsTable.querySelector('thead tr') : null;
   const resultsAgeFilter=document.getElementById('results-age-filter');
   if(resultsBody){
     const ageOf = row => String(row["Age Group"] || row.ageGroup || row.Age || row.Category || '').trim();
     // Normalize age-group labels from the Results sheet so equivalent formats
     // (e.g. "4-6", "4–6 years", and "Age 4 to 6") filter together.
     const normalizeAge = value => {
       const raw=String(value||'').trim().replace(/[–—]/g,'-');
       const digits=raw.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})/i);
       return digits ? `${Number(digits[1])}-${Number(digits[2])}` : raw.toLowerCase();
     };
     // Populate the dropdown only from distinct non-empty values in the
     // Results table's Age Group column; no hard-coded age groups.
     const ageGroupMap=new Map();
     results.forEach(row=>{
       const label=ageOf(row);
       const value=normalizeAge(label);
       if(label && value && !ageGroupMap.has(value)) ageGroupMap.set(value,label);
     });
     const ageGroups=Array.from(ageGroupMap,([value,label])=>({value,label}));
     const currentFilter=resultsAgeFilter ? resultsAgeFilter.value : 'All Age';
     if(resultsAgeFilter){
       resultsAgeFilter.innerHTML='<option value="All Age">All Age</option>'+ageGroups.map(g=>`<option value="${esc(g.value)}">${esc(g.label)}</option>`).join('');
       const requested=new URLSearchParams(location.search).get('ageGroup');
       const wanted=requested || currentFilter;
       const normalizedWanted=normalizeAge(wanted);
       if(ageGroups.some(g=>g.value===normalizedWanted)) resultsAgeFilter.value=normalizedWanted;
       else resultsAgeFilter.value='All Age';
     }
     const renderFilteredResults=()=>{
       const selected=resultsAgeFilter ? resultsAgeFilter.value : 'All Age';
       const filtered=selected==='All Age' ? results : results.filter(x=>normalizeAge(ageOf(x))===selected);
       if(teamBased){
         if(resultsHead) resultsHead.innerHTML='<th>Age Group</th><th>Round</th><th>Match</th><th>Team</th><th>Opponent</th><th>Score</th><th>Result</th><th>Position</th><th>Medal</th>';
         resultsBody.innerHTML=filtered.length?filtered.map(x=>`<tr><td>${esc(ageOf(x))}</td><td>${esc(x.Round||x.round)}</td><td>${esc(x.Match||x["Match"]||'')}</td><td>${esc(x["Team Name"]||x.Team||x.team)}</td><td>${esc(x.Opponent||x.opponent)}</td><td>${esc(x.Score||x["Score / Time"]||x.score||x.time)}</td><td>${esc(x.Result||x.result)}</td><td>${esc(x.Position||x.position)}</td><td>${esc(x.Medal||x.medal)}</td></tr>`).join(''):`<tr><td colspan="9">${results.length?'No results published for this age group yet.':'No results published yet.'}</td></tr>`;
       }else{
         if(resultsHead) resultsHead.innerHTML='<th>Age Group</th><th>Position</th><th>Participant</th><th>Block</th><th>Flat Number</th><th>Score / Time</th><th>Medal</th>';
         resultsBody.innerHTML=filtered.length?filtered.map(x=>`<tr><td>${esc(ageOf(x))}</td><td><b>${esc(x.Position||x.position)}</b></td><td>${esc(x["Child Name"]||x.child||x.participant)}</td><td>${esc(x.Block||x.block)}</td><td>${esc(x["Flat Number"]||x.flatNumber)}</td><td>${esc(x["Score / Time"]||x.score||x.time)}</td><td>${esc(x.Medal||x.medal)}</td></tr>`).join(''):`<tr><td colspan="7">${results.length?'No results published for this age group yet.':'No results published yet.'}</td></tr>`;
       }
     };
     if(resultsAgeFilter) resultsAgeFilter.onchange=renderFilteredResults;
     renderFilteredResults();
   }
}


function buildTeamsFromEnrollments(rows){
  const map={};
  rows.forEach(function(x){
    const id=String(x["Team ID"]||x.teamId||'').trim();
    if(!id)return;
    if(!map[id]) map[id]={"Team ID":id,"Team Name":x["Team Name"]||x.teamName||id,"Age Group":x["Age Group"]||x.ageGroup||'',Captain:'',"Team Status":x["Team Status"]||x.status||''};
    if(String(x["Team Role"]||x.teamRole||x.Role||x.role||'').trim().toLowerCase()==='captain') map[id].Captain=x["Child Name"]||x.Child||x.child||'';
  });
  return Object.keys(map).map(k=>map[k]);
}

async function loadGamePage(){
 if(!game || !CONFIG.apiUrl)return;
 const cacheKey=SPORT_CACHE_PREFIX+game[1].toLowerCase().replace(/[^a-z0-9]+/g,'_');
 // Render cached sport data immediately while the live request runs.
 try{
   const cached=localStorage.getItem(cacheKey);
   if(cached){
     const item=JSON.parse(cached);
     if(item && item.data) renderGameData(item.data);
   }
 }catch(err){}

 try{
   const sportName=encodeURIComponent(game[1]);
   const [sportResponse, volunteerResponse, allVolunteerResponse] = await Promise.all([
     fetch(CONFIG.apiUrl+'?action=sport&sport='+sportName,{cache:'no-store'}).then(r=>r.json()),
     fetch(CONFIG.apiUrl+'?action=sportVolunteers&sport='+sportName,{cache:'no-store'}).then(r=>r.json()).catch(()=>null),
     fetch(CONFIG.apiUrl+'?action=volunteers',{cache:'no-store'}).then(r=>r.json()).catch(()=>null)
   ]);

   if(sportResponse && sportResponse.success!==false){
     // Prefer the dedicated sport-volunteers endpoint, but also merge the full
     // Volunteers response so per-event "SPOC For" data is still available
     // even when the sport endpoint is serving an older cached/deployed shape.
     const merged = Object.assign({}, sportResponse);
     const baseData = sportResponse.data || {};
     let combinedVolunteers = [];
     [sportResponse?.data?.volunteers, volunteerResponse?.volunteers, allVolunteerResponse?.volunteers].forEach(list => {
       if(Array.isArray(list)) combinedVolunteers.push(...list);
     });
     // De-duplicate by name + block + flat + event/sport.
     const seen = new Set();
     combinedVolunteers = combinedVolunteers.filter(v => {
       const key = [v.name||v.Name||'',v.block||v.Block||'',v.flatNumber||v['Flat No']||v['Flat Number']||'',v.sport||v['Event / Sport']||''].join('|').toLowerCase();
       if(seen.has(key)) return false;
       seen.add(key);
       return true;
     });
     const targetNorm = norm(game[1]);
     const filteredVolunteers = combinedVolunteers.filter(v => {
       const assigned = String(v.sport || v["Event / Sport"] || v["Sport / Area"] || v.Event || v.event || "");
       return assigned.split(/[,;\n]+/).map(x=>norm(x)).filter(Boolean).includes(targetNorm);
     });
     if(filteredVolunteers.length){
       merged.data = Object.assign({}, baseData, {volunteers: filteredVolunteers});
     } else if(volunteerResponse && volunteerResponse.success!==false && Array.isArray(volunteerResponse.volunteers)){
       merged.data = Object.assign({}, baseData, {volunteers: volunteerResponse.volunteers});
     }
     try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),data:merged}));}catch(err){}
     renderGameData(merged);
   }
 }catch(err){
   console.warn('Unable to refresh event data',err);
 }
}
loadGamePage();
if(CONFIG.refreshSeconds>0)setInterval(loadGamePage,CONFIG.refreshSeconds*1000);
