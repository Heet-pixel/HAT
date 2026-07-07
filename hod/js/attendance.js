// hod/js/attendance.js — Attendance Module: View, Mark, Save, Export

/* ═══ ATTENDANCE MODULE ═══ */
let attCourse='', attSem=0, attSubject='', attDate='', attRecords={};
let savedAttendance={};

/* ════ ATTENDANCE MODULE — Card-based UI ════
   - Students shown as click-toggle cards (Present ↔ Absent)
   - Only tracks: Total | Present | Absent | %
   - No "Late" / "Null"
   - Dynamic: changes based on selected Semester & Subject
════════════════════════════════════════════ */

function loadAttendance(){
  attCourse=''; attSem=0; attSubject=''; attDate='';
  attRecords={};
  renderAttPage();
}

function renderAttPage(){
  if(!attDate) attDate=new Date().toISOString().split('T')[0];
  let courseOpts=HOD_COURSES.map(c=>`<option value="${c}" ${attCourse===c?'selected':''}>${c}</option>`).join('');
  let semOpts='<option value="">-- Semester --</option>';
  for(let s=1;s<=SEM_COUNT;s++) semOpts+=`<option value="${s}" ${attSem==s?'selected':''}>Sem ${s}</option>`;
  let subjOpts='<option value="">-- Subject --</option>';
  if(attCourse && attSem){
    getSubjNames(attCourse,parseInt(attSem)).forEach(s=>{
      subjOpts+=`<option value="${s}" ${attSubject===s?'selected':''}>${s}</option>`;
    });
  }

  /* ── Filter card ── */
  let html=`<div class="card" style="margin-bottom:16px;">
    <div class="card-title"><span class="ct-icon">🎯</span> Select Class</div>
    <div class="att-select-row" style="display:flex;gap:10px;flex-wrap:wrap;">
      <div><div class="att-step-label">Course</div>
        <select onchange="attCourse=this.value;attSem=0;attSubject='';attRecords={};renderAttPage()">
          <option value="">-- Course --</option>${courseOpts}
        </select>
      </div>
      <div><div class="att-step-label">Semester</div>
        <select onchange="attSem=this.value;attSubject='';attRecords={};renderAttPage()" ${!attCourse?'disabled':''}>
          ${semOpts}
        </select>
      </div>
      <div><div class="att-step-label">Subject</div>
        <select onchange="attSubject=this.value;attRecords={};renderAttPage()" ${!attSem?'disabled':''}>
          ${subjOpts}
        </select>
      </div>
      <div><div class="att-step-label">Date</div>
        <input type="date" value="${attDate}" onchange="attDate=this.value;attRecords={};renderAttPage()">
      </div>
    </div>
  </div>`;

  if(!attCourse||!attSem||!attSubject){
    html+=`<div class="empty-state"><div class="e-icon">👉</div>
      <p>${!attCourse?'Select a course':'!attSem'?'Now select a semester':'Now select a subject'} to load attendance.</p>
    </div>`;
    document.getElementById('attContent').innerHTML=html;
    return;
  }

  /* Restore saved records if available */
  let saved=(((savedAttendance[attCourse]||{})[attSem]||{})[attSubject]||{})[attDate];
  if(!Object.keys(attRecords).length && saved) attRecords=Object.assign({},saved);

  let students=allStudents.filter(s=>s.course===attCourse&&String(s.sem)===String(attSem));
  if(!students.length){
    html+=`<div class="empty-state"><div class="e-icon">📄</div><p>No students found for this selection.</p></div>`;
    document.getElementById('attContent').innerHTML=html;
    return;
  }

  /* Default to Present */
  students.forEach(s=>{ if(!attRecords[s.id]) attRecords[s.id]='P'; });
  let pC=students.filter(s=>attRecords[s.id]==='P').length;
  let aC=students.filter(s=>attRecords[s.id]==='A').length;
  let pct=students.length?Math.round(pC/students.length*100):0;

  /* ── Stats row ── */
  html+=`<div class="card">
    <div class="card-title">
      <span class="ct-icon">✅</span>
      ${attSubject} — ${attCourse} Sem ${attSem}
      <span style="font-size:12px;color:var(--text2);margin-left:8px;font-weight:500;">${attDate}</span>
    </div>
    <div class="att-stats-row" id="attStatsRow">
      <div class="att-stat-chip total"><div class="asv">${students.length}</div><div class="asl">Total</div></div>
      <div class="att-stat-chip present"><div class="asv">${pC}</div><div class="asl">Present</div></div>
      <div class="att-stat-chip absent"><div class="asv">${aC}</div><div class="asl">Absent</div></div>
      <div class="att-stat-chip pct"><div class="asv">${pct}%</div><div class="asl">% Present</div></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:12px;color:var(--text2);font-weight:600;">Mark All:</span>
      <button class="btn btn-success btn-sm" onclick="markAllAtt('P')">✅ All Present</button>
      <button class="btn btn-danger btn-sm" onclick="markAllAtt('A')">✕ All Absent</button>
      <span style="font-size:11.5px;color:var(--text3);margin-left:auto;">Click card to toggle Present ↔ Absent</span>
    </div>
    <!-- Student cards grid -->
    <div class="att-card-grid" id="attCardGrid">`;

  students.forEach(s=>{
    let isPresent=attRecords[s.id]!=='A';
    html+=`<div class="att-card ${isPresent?'present':'absent'}" id="attcard_${s.id}"
      onclick="toggleAttCard('${s.id}')" title="${s.name} — Click to toggle">
      <img src="${s.avatar || 'https://ui-avatars.com/api/?name='+encodeURIComponent(s.name)+'&size=80&background=random'}" alt="">
      <div class="att-card-name">${s.name.split(' ')[0]}</div>
      <div class="att-card-roll">${s.roll}</div>
      <div class="att-card-status">${isPresent?'Present':'Absent'}</div>
    </div>`;
  });

  html+=`</div>
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="saveAttendance()">💾 Save Attendance</button>
      <button class="btn btn-ghost" onclick="loadAttendance()">🔄 Reset</button>
    </div>
  </div>`;

  document.getElementById('attContent').innerHTML=html;
}

/**
 * Toggle a student card between Present and Absent.
 * Updates only the clicked card + stats row — no full re-render.
 */
function toggleAttCard(stuId){
  /* Toggle status: only P or A, no Late */
  attRecords[stuId] = attRecords[stuId]==='A' ? 'P' : 'A';
  let card=document.getElementById('attcard_'+stuId);
  if(card){
    let isPresent=attRecords[stuId]==='P';
    card.className='att-card '+(isPresent?'present':'absent');
    card.querySelector('.att-card-status').textContent=isPresent?'Present':'Absent';
  }
  _refreshAttStats();
}

function _refreshAttStats(){
  let students=allStudents.filter(s=>s.course===attCourse&&String(s.sem)===String(attSem));
  let pC=students.filter(s=>attRecords[s.id]==='P').length;
  let aC=students.filter(s=>attRecords[s.id]==='A').length;
  let pct=students.length?Math.round(pC/students.length*100):0;
  let row=document.getElementById('attStatsRow');
  if(row) row.innerHTML=`
    <div class="att-stat-chip total"><div class="asv">${students.length}</div><div class="asl">Total</div></div>
    <div class="att-stat-chip present"><div class="asv">${pC}</div><div class="asl">Present</div></div>
    <div class="att-stat-chip absent"><div class="asv">${aC}</div><div class="asl">Absent</div></div>
    <div class="att-stat-chip pct"><div class="asv">${pct}%</div><div class="asl">% Present</div></div>`;
}

/* Legacy setAttStatus kept for Mark Attendance section compatibility */
function setAttStatus(stuId,status){
  attRecords[stuId]=status;
  toggleAttCard(stuId); /* re-use toggle logic */
}

function markAllAtt(status){
  let students=allStudents.filter(s=>s.course===attCourse&&String(s.sem)===String(attSem));
  students.forEach(s=>{ attRecords[s.id]=status; });
  renderAttPage(); /* full re-render for all-toggle */
}

function saveAttendance(){
  if(!attCourse||!attSem||!attSubject||!attDate){showToast('Please select all fields.',true);return;}
  if(!savedAttendance[attCourse]) savedAttendance[attCourse]={};
  if(!savedAttendance[attCourse][attSem]) savedAttendance[attCourse][attSem]={};
  if(!savedAttendance[attCourse][attSem][attSubject]) savedAttendance[attCourse][attSem][attSubject]={};
  savedAttendance[attCourse][attSem][attSubject][attDate]=Object.assign({},attRecords);
  let pC=Object.values(attRecords).filter(v=>v==='P').length;
  let aC=Object.values(attRecords).filter(v=>v==='A').length;
  showToast('Attendance saved! '+pC+' Present, '+aC+' Absent.');
  refreshStuReportsFromAtt();
}

function refreshStuReportsFromAtt(){
  allStudents.forEach(stu=>{
    let rpt=stuReports.find(r=>String(r.id)===String(stu.id));
    if(!rpt) return;
    let subjNames=getSubjNames(stu.course,stu.sem);
    rpt.subjects=subjNames.map(subName=>{
      let dates=Object.keys(((savedAttendance[stu.course]||{})[stu.sem]||{})[subName]||{});
      if(!dates.length){
        let ex=rpt.subjects.find(s=>s.subject===subName);
        return ex||{subject:subName,total:20,attended:15,pct:75};
      }
      let total=dates.length;
      let attended=dates.filter(d=>((savedAttendance[stu.course][stu.sem][subName][d])||{})[stu.id]==='P').length;
      let pct=total>0?Math.round(attended/total*100):100;
      return {subject:subName,total,attended,pct};
    });
    let ot=rpt.subjects.reduce((a,b)=>a+b.total,0)||1;
    let oa=rpt.subjects.reduce((a,b)=>a+b.attended,0);
    rpt.overallTotal=ot; rpt.overallAtt=oa;
    rpt.percentage=Math.round(oa/ot*100);
    rpt.status=rpt.percentage>=75?'Regular':'Shortage';
  });
}



// ─── Mark Attendance (Teacher-view style) ───
/* ═══════════════════════════════════════════════════════
   MARK ATTENDANCE MODULE  (dedicated nav section)
   HOD marks attendance by selecting Course → Sem → Subject → Date.
   Student list with P/A/L buttons appears ONLY after all 4 are chosen.
   Save posts to /api/hod/attendance (POST) in production.
   Also supports offline/demo mode (saves to local savedAttendance).
═════════════════════════════════════════════════════════ */

// State for mark-attendance section
let maAttCourse='', maAttSem='', maAttSubject='', maAttDate='';
let maAttRecords={}; // { studentId: 'P' | 'A' | 'L' }

/** Called when navigating to "Mark Attendance" section */
function loadMarkAttendance(){
  maAttCourse=''; maAttSem=''; maAttSubject='';
  maAttDate = new Date().toISOString().split('T')[0]; // default: today
  maAttRecords={};
  renderMarkAttPage();
}

/** Render the full Mark Attendance page including filter dropdowns and student list */
function renderMarkAttPage(){
  // Build dropdown options dynamically (data from server in production)
  let courseOpts=HOD_COURSES.map(c=>`<option value="${c}" ${maAttCourse===c?'selected':''}>${c}</option>`).join('');
  let semOpts='<option value="">-- Semester --</option>';
  for(let s=1;s<=SEM_COUNT;s++) semOpts+=`<option value="${s}" ${maAttSem==s?'selected':''}>Semester ${s}</option>`;
  let subjOpts='<option value="">-- Subject --</option>';
  if(maAttCourse&&maAttSem){
    getSubjNames(maAttCourse,parseInt(maAttSem)).forEach(s=>{
      subjOpts+=`<option value="${s}" ${maAttSubject===s?'selected':''}>${s}</option>`;
    });
  }

  let html=`<div class="att-mark-section">
    <div class="att-mark-header">
      <div class="att-mark-title">📋 Mark Attendance</div>
      <button class="btn btn-ghost btn-sm" onclick="HodAttHistory.open()">🕘 Attendance History</button>
      ${maAttDate?`<div class="att-date-badge">📄… ${maAttDate}</div>`:''}
    </div>

    <!-- ── Filter controls: responsive flex row ── -->
    <div class="att-controls">
      <div class="att-ctrl-group">
        <label>Course</label>
        <select onchange="maAttCourse=this.value;maAttSem='';maAttSubject='';maAttRecords={};renderMarkAttPage()">
          <option value="">-- Course --</option>${courseOpts}
        </select>
      </div>
      <div class="att-ctrl-group">
        <label>Semester</label>
        <select onchange="maAttSem=this.value;maAttSubject='';maAttRecords={};renderMarkAttPage()" ${!maAttCourse?'disabled':''}>
          ${semOpts}
        </select>
      </div>
      <div class="att-ctrl-group">
        <label>Subject</label>
        <select onchange="maAttSubject=this.value;maAttRecords={};renderMarkAttPage()" ${!maAttSem?'disabled':''}>
          ${subjOpts}
        </select>
      </div>
      <div class="att-ctrl-group">
        <label>Date</label>
        <input type="date" value="${maAttDate}" onchange="maAttDate=this.value;maAttRecords={};renderMarkAttPage()">
      </div>
    </div>`;

  // Show prompt if filters incomplete
  if(!maAttCourse||!maAttSem||!maAttSubject){
    html+=`<div class="empty-state" style="margin-top:10px;padding:20px 0;">
      <div class="e-icon">👉</div>
      <p>${!maAttCourse?'Select a course above to begin':!maAttSem?'Now select a semester':'Now select a subject to load students'}</p>
    </div></div>`;
    document.getElementById('markAttContent').innerHTML=html;
    return;
  }

  // Preload any saved records for this slot
  let saved=(((savedAttendance[maAttCourse]||{})[maAttSem]||{})[maAttSubject]||{})[maAttDate];
  if(!Object.keys(maAttRecords).length && saved) maAttRecords=Object.assign({},saved);

  // Fetch students for the selected course+sem (in production: from API)
  let students=allStudents.filter(s=>s.course===maAttCourse&&String(s.sem)===String(maAttSem));
  if(!students.length){
    html+=`<div class="empty-state" style="margin-top:10px;">
      <div class="e-icon">📄</div><p>No students found for this selection.</p>
    </div></div>`;
    document.getElementById('markAttContent').innerHTML=html;
    return;
  }

  // Default unset students to Present
  students.forEach(s=>{ if(!maAttRecords[s.id]) maAttRecords[s.id]='P'; });

  let pC=Object.values(maAttRecords).filter(v=>v==='P').length;
  let aC=Object.values(maAttRecords).filter(v=>v==='A').length;
  let lC=Object.values(maAttRecords).filter(v=>v==='L').length;

  // Live summary bar
  let pct=students.length?Math.round(pC/students.length*100):0;
  html+=`<div class="att-stats-row" id="maAttSummaryBar">
    <div class="att-stat-chip total"><div class="asv">${students.length}</div><div class="asl">Total</div></div>
    <div class="att-stat-chip present"><div class="asv">${pC}</div><div class="asl">Present</div></div>
    <div class="att-stat-chip absent"><div class="asv">${aC}</div><div class="asl">Absent</div></div>
    <div class="att-stat-chip pct"><div class="asv">${pct}%</div><div class="asl">% Present</div></div>
  </div>`;

  // Bulk mark buttons
  html+=`<div class="att-mark-all-bar">
    <span>Mark All:</span>
    <button class="btn btn-success btn-sm" onclick="maMarkAll('P')">✅ All Present</button>
    <button class="btn btn-danger btn-sm" onclick="maMarkAll('A')">✕ All Absent</button>
  </div>`;

  // Individual student rows
  html+='<div class="att-student-list">';
  students.forEach(s=>{
    let status=maAttRecords[s.id]||'P';
    let rowCls=status==='P'?'present-row':status==='A'?'absent-row':'';
    html+=`<div class="att-row ${rowCls}" id="marow_${s.id}">
      <img src="${s.avatar || 'https://ui-avatars.com/api/?name='+encodeURIComponent(s.name)+'&size=80&background=random'}" alt="">
      <div class="att-row-info">
        <div class="att-row-name">${s.name}</div>
        <div class="att-row-sub">${s.roll} · ${s.course} Sem ${s.sem}</div>
      </div>
      <div class="att-btn-grp">
        <button class="att-btn p-btn ${status==='P'?'active':''}" onclick="setMAStatus('${s.id}','P')">P</button>
        <button class="att-btn a-btn ${status==='A'?'active':''}" onclick="setMAStatus('${s.id}','A')">A</button>
        <button class="att-btn l-btn ${status==='L'?'active':''}" onclick="setMAStatus('${s.id}','L')">L</button>
      </div>
    </div>`;
  });
  html+='</div>';

  // Action buttons
  html+=`<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
    <button class="btn btn-primary" onclick="saveMarkAttendance()">💾 Save Attendance</button>
    <button class="btn btn-ghost" onclick="loadMarkAttendance()">🔄 Reset</button>
    <button class="btn btn-teal btn-sm" onclick="exportMarkAttExcel()">📚 Export Excel</button>
  </div></div>`; // close att-mark-section

  document.getElementById('markAttContent').innerHTML=html;
}

/**
 * Update a single student's attendance status in-place (no full re-render).
 * Updates DOM row, buttons, and the live summary bar efficiently.
 */
function setMAStatus(stuId, status){
  maAttRecords[stuId]=status;
  // Update row styling
  let row=document.getElementById('marow_'+stuId);
  if(row){
    row.className='att-row '+(status==='P'?'present-row':status==='A'?'absent-row':'');
    row.querySelectorAll('.att-btn').forEach(btn=>{
      btn.classList.remove('active');
      if((btn.classList.contains('p-btn')&&status==='P')||
         (btn.classList.contains('a-btn')&&status==='A')||
         (btn.classList.contains('l-btn')&&status==='L')) btn.classList.add('active');
    });
  }
  // Refresh summary bar counts only (fast, avoids full page re-render)
  let students=allStudents.filter(s=>s.course===maAttCourse&&String(s.sem)===String(maAttSem));
  students.forEach(s=>{ if(!maAttRecords[s.id]) maAttRecords[s.id]='P'; });
  let pC=Object.values(maAttRecords).filter(v=>v==='P').length;
  let aC=Object.values(maAttRecords).filter(v=>v==='A').length;
  let lC=Object.values(maAttRecords).filter(v=>v==='L').length;
  let pctN=students.length?Math.round(pC/students.length*100):0;
  let bar=document.getElementById('maAttSummaryBar');
  if(bar) bar.innerHTML=`
    <div class="att-stat-chip total"><div class="asv">${students.length}</div><div class="asl">Total</div></div>
    <div class="att-stat-chip present"><div class="asv">${pC}</div><div class="asl">Present</div></div>
    <div class="att-stat-chip absent"><div class="asv">${aC}</div><div class="asl">Absent</div></div>
    <div class="att-stat-chip pct"><div class="asv">${pctN}%</div><div class="asl">% Present</div></div>`;
}

/** Mark all students P or A only (no Late) and re-render */
function maMarkAll(status){
  let students=allStudents.filter(s=>s.course===maAttCourse&&String(s.sem)===String(maAttSem));
  students.forEach(s=>{ maAttRecords[s.id]=status; });
  renderMarkAttPage();
}

/**
 * Save attendance:
 * 1. Persists to local savedAttendance (for offline/demo mode and reports)
 * 2. POSTs to /api/hod/attendance (production backend)
 * 3. Refreshes student attendance percentages in the reports module
 */
async function saveMarkAttendance(){
  if(!maAttCourse||!maAttSem||!maAttSubject||!maAttDate){showToast('Please select all fields.',true);return;}

  // 1. Save locally (used by reports + student modals)
  if(!savedAttendance[maAttCourse]) savedAttendance[maAttCourse]={};
  if(!savedAttendance[maAttCourse][maAttSem]) savedAttendance[maAttCourse][maAttSem]={};
  if(!savedAttendance[maAttCourse][maAttSem][maAttSubject]) savedAttendance[maAttCourse][maAttSem][maAttSubject]={};
  savedAttendance[maAttCourse][maAttSem][maAttSubject][maAttDate]=Object.assign({},maAttRecords);

  let pC=Object.values(maAttRecords).filter(v=>v==='P').length;
  let aC=Object.values(maAttRecords).filter(v=>v==='A').length;

  // 2. POST to production backend
  try{
    await apiJson('/api/hod/attendance',{
      method:'POST',
      body:JSON.stringify({
        course:maAttCourse, semester:maAttSem, subject:maAttSubject,
        date:maAttDate, records:maAttRecords
      })
    });
  }catch(e){
    // Graceful fallback: backend unavailable in demo mode
    console.warn('[HOD] Attendance API unavailable, saved locally only:', e.message);
  }

  // 3. Refresh percentage calculations in reports
  invalidateAttReportCache();
  try {
    await buildStuReports(maAttCourse, maAttSem, true);
  } catch (e) {
    console.warn('[HOD] Attendance report refresh failed:', e.message);
  }
  refreshStuReportsFromAtt();
  showToast(`Attendance saved! ${pC} Present, ${aC} Absent.`);
}

/**
 * Export the current Mark Attendance view to Excel.
 * Columns: Name | Roll | Course | Sem | Subject | Date | Status
 */
function exportMarkAttExcel(){
  if(!maAttCourse||!maAttSem||!maAttSubject){showToast('Select course, semester and subject first.',true);return;}
  let students=allStudents.filter(s=>s.course===maAttCourse&&String(s.sem)===String(maAttSem));
  if(!students.length){showToast('No students found.',true);return;}
  try{
    let data=[['Name','Roll No','Course','Sem','Subject','Date','Status']];
    students.forEach(s=>{
      let st=maAttRecords[s.id]||'P';
      let label=st==='P'?'Present':st==='A'?'Absent':'Late';
      data.push([s.name,s.roll,s.course,`Sem ${s.sem}`,maAttSubject,maAttDate,label]);
    });
    let wb=XLSX.utils.book_new();
    let ws=XLSX.utils.aoa_to_sheet(data);
    ws['!cols']=[{wch:24},{wch:14},{wch:10},{wch:8},{wch:28},{wch:14},{wch:10}];
    XLSX.utils.book_append_sheet(wb,ws,'Attendance');
    let fn=`Attendance_${maAttCourse}_Sem${maAttSem}_${maAttSubject.replace(/\s/g,'_')}_${maAttDate}`;
    XLSX.writeFile(wb,fn+'.xlsx');
    showToast('Attendance Excel downloaded!');
  }catch(e){showToast('Export failed: '+e.message,true);}
}

// ═══════════════════════════════════════════════════════════
// HOD Attendance History (spec item 4 & 5) — unlike a Teacher (who only ever
// sees lectures THEY took), HOD sees every teacher's lecture in the
// department and can edit any of them.
// ═══════════════════════════════════════════════════════════
const HodAttHistory = {
  _sessionKey: null,
  _records: null,

  async open() {
    this._ensureModals();
    document.getElementById('hodAttHistoryOverlay').classList.add('open');
    const body = document.getElementById('hodAttHistoryBody');
    body.innerHTML = 'Loading…';
    try {
      const d = await apiJson('/api/hod/attendance/history');
      this._renderList(d.sessions || []);
    } catch (e) {
      body.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
  },

  close() { document.getElementById('hodAttHistoryOverlay')?.classList.remove('open'); },
  closeSession() { document.getElementById('hodAttSessionOverlay')?.classList.remove('open'); },

  _ensureModals() {
    if (document.getElementById('hodAttHistoryOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="hodAttHistoryOverlay" onclick="if(event.target===this)HodAttHistory.close()">
        <div class="modal-card" style="max-width:680px;max-height:82vh;display:flex;flex-direction:column">
          <div class="modal-header"><span>🕘 Attendance History — All Teachers</span><button onclick="HodAttHistory.close()">✕</button></div>
          <div class="modal-body" id="hodAttHistoryBody" style="overflow-y:auto;padding:16px"></div>
        </div>
      </div>
      <div class="modal-overlay" id="hodAttSessionOverlay" onclick="if(event.target===this)HodAttHistory.closeSession()">
        <div class="modal-card" style="max-width:560px;max-height:82vh;display:flex;flex-direction:column">
          <div class="modal-header"><span id="hodAttSessionTitle">Lecture Details</span><button onclick="HodAttHistory.closeSession()">✕</button></div>
          <div class="modal-body" id="hodAttSessionBody" style="overflow-y:auto;padding:16px"></div>
        </div>
      </div>`);
  },

  _renderList(sessions) {
    const body = document.getElementById('hodAttHistoryBody');
    if (!sessions.length) {
      body.innerHTML = `<p style="text-align:center;color:var(--muted,#888);padding:24px">No attendance submitted by any teacher yet.</p>`;
      return;
    }
    body.innerHTML = sessions.map(s => `
      <div class="sched-slot-card" style="cursor:pointer" onclick="HodAttHistory.openSession('${s.sessionKey}')">
        <div class="ssc-time"><b>${fmtDate(s.date)}</b>${s.time ? '<br>' + s.time : ''}</div>
        <div class="ssc-info">
          <span><b>${escHtml(s.subjectName || '')}</b> — ${escHtml(s.teacherName)}</span>
          <span>${escHtml(s.course || '')} Sem ${s.semester || ''}${s.division ? ' · ' + escHtml(s.division) : ''}</span>
          <span>✅ ${s.present} &nbsp; ❌ ${s.absent}</span>
        </div>
      </div>`).join('');
  },

  async openSession(sessionKey) {
    document.getElementById('hodAttSessionOverlay').classList.add('open');
    const body = document.getElementById('hodAttSessionBody');
    body.innerHTML = 'Loading…';
    try {
      const d = await apiJson('/api/hod/attendance/session/' + encodeURIComponent(sessionKey));
      this._sessionKey = sessionKey;
      this._records = d.records;
      document.getElementById('hodAttSessionTitle').textContent = `${d.meta.subjectName} — ${d.meta.teacherName}`;
      const uploadedAt = d.meta.uploadedAt ? fmtDateTime(d.meta.uploadedAt) : null;
      body.innerHTML = `
        <p style="color:var(--muted,#888);font-size:13px;margin-bottom:10px">
          ${d.meta.course} Sem ${d.meta.semester}${d.meta.division ? ' · ' + escHtml(d.meta.division) : ''} ·
          Taken by <b>${escHtml(d.meta.teacherName)}</b> — editing here updates this lecture only.
        </p>
        <div id="hodAttSessionSeats" style="display:flex;flex-direction:column;gap:6px">
          ${d.records.map((r, i) => `
            <div class="seat${r.status === 'absent' ? ' absent' : ''}" data-idx="${i}"
                 style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 12px;cursor:pointer"
                 onclick="HodAttHistory.toggleStatus(${i})">
              <span>${escHtml(r.student?.name || 'Unknown')} <span style="opacity:.7;font-size:12px">${escHtml(r.student?.roll || r.student?.rollNo || '')}</span></span>
              <b>${r.status === 'absent' ? 'Absent' : 'Present'}</b>
            </div>`).join('')}
        </div>
        <button class="btn btn-primary" style="margin-top:14px;width:100%" onclick="HodAttHistory.save()">Save Changes</button>
        ${uploadedAt ? `<div style="font-size:11px;color:var(--muted,#888);margin-top:10px">Lecture date: ${fmtDate(d.meta.date)} · Uploaded ${uploadedAt}</div>` : ''}
      `;
    } catch (e) {
      body.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
    }
  },

  toggleStatus(idx) {
    if (!this._records || !this._records[idx]) return;
    const r = this._records[idx];
    r.status = r.status === 'present' ? 'absent' : 'present';
    const el = document.querySelector(`#hodAttSessionSeats .seat[data-idx="${idx}"]`);
    if (el) {
      el.classList.toggle('absent', r.status === 'absent');
      el.querySelector('b').textContent = r.status === 'absent' ? 'Absent' : 'Present';
    }
  },

  async save() {
    if (!this._sessionKey || !this._records) return;
    try {
      const payload = this._records.map(r => ({ student: r.student?._id || r.student, status: r.status }));
      const d = await apiJson('/api/hod/attendance/session/' + encodeURIComponent(this._sessionKey), {
        method: 'PUT', body: JSON.stringify({ records: payload })
      });
      showToast(d.message || 'Attendance updated.');
      this.closeSession();
      this.open();
    } catch (e) {
      showToast(e.message || 'Failed to save changes.', true);
    }
  },
};

