// hod/js/excel.js — Excel / File Import & Export: Parse, Map Columns, Import, Export

/* ═══ REPORTS ═══ */
function loadReports(){rptCourse=null;rptType=null;rptView=null;rptSem=null;renderReportStage();}
function renderReportStage(){
  let html=`<div class="course-picker" style="margin-bottom:16px;">${HOD_COURSES.map(c=>`<div class="cpick ${rptCourse===c?'active':''}" onclick="setRptCourse('${c}')"><h4>${c}</h4><p>Select for report</p></div>`).join("")}</div>`;
  if(rptCourse){
    let sc=allStudents.filter(s=>s.course===rptCourse).length,tc=allTeachers.filter(t=>t.course===rptCourse).length;
    html+=`<div class="report-type-cards"><div class="rtype-btn ${rptType==='student'?'active':''}" onclick="setRptType('student')"><h4>📚 Students</h4><p>${sc} total students</p></div><div class="rtype-btn ${rptType==='teacher'?'active':''}" onclick="setRptType('teacher')"><h4>🧑‍🏫 Teachers</h4><p>${tc} total teachers</p></div></div>`;
  }
  if(rptCourse&&rptType==="student"){
    html+=`<div class="report-type-cards"><div class="rtype-btn ${rptView==='all'?'active':''}" onclick="setRptView('all')"><h4>📋 All Students</h4><p>All ${rptCourse}</p></div><div class="rtype-btn ${rptView==='semwise'?'active':''}" onclick="setRptView('semwise')"><h4>🗂 Sem-wise</h4><p>By semester</p></div></div>`;
    if(rptView==="semwise"){html+=`<div class="sem-tabs" style="margin-bottom:16px;">${Array.from({length:SEM_COUNT},(_,i)=>`<div class="sem-tab ${rptSem===i+1?'active':''}" onclick="setRptSem(${i+1})">Sem ${i+1}</div>`).join("")}</div>`;}
    if(rptView==="all"||(rptView==="semwise"&&rptSem)){html+=renderStuAttFilters();let rows=stuReports.filter(s=>s.course===rptCourse&&(rptView==="all"||s.sem===rptSem));html+=renderStudentAttendanceTable(rows);}
  }
  if(rptCourse&&rptType==="teacher"){html+=renderTchrFilters();let rows=tchrReports.filter(t=>t.course===rptCourse);html+=renderTeacherReportTable(rows);}
  document.getElementById("reportContent").innerHTML=html;
}
function setRptCourse(c){rptCourse=c;rptType=null;rptView=null;rptSem=null;renderEnhancedReports();}
function setRptType(t){rptType=t;rptView=null;rptSem=null;renderEnhancedReports();}
function setRptView(v){rptView=v;rptSem=null;renderEnhancedReports();}
function setRptSem(s){rptSem=s;renderEnhancedReports();}
function applyRptFilter(){rptDateFrom=document.getElementById("rptFrom")?.value||rptDateFrom;rptDateTo=document.getElementById("rptTo")?.value||rptDateTo;rptDuration=document.getElementById("rptDuration")?.value||'';renderReportStage();}
function renderStuAttFilters(){return `<div class="report-filters"><div class="filter-group"><label>From Date</label><input type="date" id="rptFrom" value="${rptDateFrom}"></div><div class="filter-group"><label>To Date</label><input type="date" id="rptTo" value="${rptDateTo}"></div><div class="filter-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="applyRptFilter()">Apply Filter</button></div></div>`;}
function renderTchrFilters(){return `<div class="report-filters"><div class="filter-group"><label>From Date</label><input type="date" id="rptFrom" value="${rptDateFrom}"></div><div class="filter-group"><label>To Date</label><input type="date" id="rptTo" value="${rptDateTo}"></div><div class="filter-group"><label>Duration (hrs)</label><input type="text" id="rptDuration" value="${rptDuration}" placeholder="e.g. 2.10 hr"></div><div class="filter-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="applyRptFilter()">Apply Filter</button></div></div>`;}
function renderStudentAttendanceTable(rows){
  let total=rows.length,regular=rows.filter(r=>r.status==="Regular").length,shortage=rows.length-regular;
  let html=`<div class="report-summary"><div class="rsumm"><span>${total}</span><small>Total Students</small></div><div class="rsumm"><span style="color:var(--success);">${regular}</span><small>Regular ≥75%</small></div><div class="rsumm"><span style="color:var(--danger);">${shortage}</span><small>Shortage &lt;75%</small></div><div class="rsumm"><span style="color:var(--accent2);font-size:13px;">${rptDateFrom} → ${rptDateTo}</span><small>Duration</small></div></div>`;
  if(!rows.length)return html+`<div class="report-card"><div class="empty-state"><div class="e-icon">📄</div><p>No data found.</p></div></div>`;
  let semForSubs=rptSem||1;
  let sampleSubs=getSubjNames(rptCourse,semForSubs);
  html+=`<div class="report-export-bar">
    <span style="font-size:13px;font-weight:700;color:var(--text2);">Export as:</span>
    <button class="export-btn excel" onclick="exportReport('excel','student')">📚 Excel</button>
    <button class="export-btn word" onclick="exportReport('word','student')">📄 Word</button>
    <button class="export-btn pdf" onclick="exportReport('pdf','student')">📄„ PDF</button>
  </div>`;
  html+=`<div class="report-card"><h3>📚 Subject-wise Attendance — ${rptCourse}${rptSem?' Sem '+rptSem:' (All Semesters)'}</h3><div class="tbl-scroll"><table class="report-table" id="reportTableStudent"><thead><tr><th>Name</th><th>Roll</th><th>Sem</th>`;
  sampleSubs.forEach(s=>html+=`<th>${s.split(" ").slice(0,2).join(" ")}</th>`);
  html+=`<th>Overall</th><th>%</th><th>Status</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    let subs=r.subjects||[];
    html+=`<tr><td><b>${r.name}</b></td><td>${r.roll}</td><td>Sem ${r.sem}</td>`;
    subs.forEach(s=>{let cls=s.pct>=75?'badge-green':s.pct>=60?'badge-yellow':'badge-red';html+=`<td><span class="badge ${cls}">${s.attended}/${s.total} (${s.pct}%)</span></td>`;});
    html+=`<td><b>${r.overallAtt}/${r.overallTotal}</b></td><td><b>${r.percentage}%</b></td><td><span class="badge ${r.status==='Regular'?'badge-green':'badge-red'}">${r.status}</span></td></tr>`;
  });
  html+=`</tbody></table></div></div>`;
  return html;
}
function renderTeacherReportTable(rows){
  let durLabel=rptDuration?` | Duration: ${rptDuration}`:'';
  let html=`<div class="report-summary"><div class="rsumm"><span>${rows.length}</span><small>Total Teachers</small></div><div class="rsumm"><span style="color:var(--success);">${rows.filter(r=>r.teacherAttendance>=90).length}</span><small>Attendance ≥90%</small></div><div class="rsumm"><span style="color:var(--accent2);">${rows.filter(r=>r.syllabusCompleted>=80).length}</span><small>Syllabus ≥80%</small></div>${rptDuration?`<div class="rsumm"><span style="color:var(--warn);">${rptDuration}</span><small>Duration Filter</small></div>`:''}</div>
  <div class="report-export-bar">
    <span style="font-size:13px;font-weight:700;color:var(--text2);">Export as:</span>
    <button class="export-btn excel" onclick="exportReport('excel','teacher')">📚 Excel</button>
    <button class="export-btn word" onclick="exportReport('word','teacher')">📄 Word</button>
    <button class="export-btn pdf" onclick="exportReport('pdf','teacher')">📄„ PDF</button>
  </div>
  <div class="report-card"><h3>🧑‍🏫 Teacher Report — ${rptCourse}${durLabel}</h3><div class="tbl-scroll"><table class="report-table" id="reportTableTeacher"><thead><tr><th>Name</th><th>Subject</th><th>Designation</th><th>Lec Sched.</th><th>Lec Taken</th><th>Syllabus %</th><th>Avg Duration</th><th>Attendance %</th></tr></thead><tbody>`;
  rows.forEach(t=>{let sCls=t.syllabusCompleted>=80?'badge-green':t.syllabusCompleted>=60?'badge-yellow':'badge-red';let aCls=t.teacherAttendance>=90?'badge-green':t.teacherAttendance>=75?'badge-yellow':'badge-red';html+=`<tr><td><b>${t.name}</b></td><td>${t.subject}</td><td>${t.designation}</td><td>${t.totalLectures}</td><td>${t.taken}</td><td><span class="badge ${sCls}">${t.syllabusCompleted}%</span></td><td>${t.avgLectureTime} min</td><td><span class="badge ${aCls}">${t.teacherAttendance}%</span></td></tr>`;});
  html+=`</tbody></table></div></div>`;
  return html;
}


// ─── Export Helpers ───
/* ═══ EXPORT REPORTS ═══ */
function exportReport(format, type){
  let tableId=type==='student'?'reportTableStudent':'reportTableTeacher';
  let table=document.getElementById(tableId);
  if(!table){showToast('No report data to export.',true);return;}
  let title=type==='student'?`Attendance_Report_${rptCourse||'All'}`:  `Teacher_Report_${rptCourse||'All'}`;
  if(format==='excel'){
    exportToExcel(table, title);
  } else if(format==='word'){
    exportToWord(table, title);
  } else if(format==='pdf'){
    exportToPDF(table, title);
  }
}
function exportToExcel(table, filename){
  try{
    let wb=XLSX.utils.book_new();
    let ws=XLSX.utils.table_to_sheet(table);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename+'.xlsx');
    showToast('Excel file downloaded!');
  }catch(e){showToast('Export failed: '+e.message,true);}
}
function exportToWord(table, filename){
  try{
    let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:12px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;font-weight:bold;}tr:nth-child(even){background:#f9f9f9;}h2{color:#2563eb;}</style></head><body><h2>${filename.replace(/_/g,' ')}</h2><p>Generated: ${new Date().toLocaleDateString()}</p>${table.outerHTML}</body></html>`;
    let blob=new Blob(['\ufeff',html],{type:'application/msword'});
    let url=URL.createObjectURL(blob);
    let a=document.createElement('a');a.href=url;a.download=filename+'.doc';a.click();URL.revokeObjectURL(url);
    showToast('Word file downloaded!');
  }catch(e){showToast('Export failed: '+e.message,true);}
}
function exportToPDF(table, filename){
  try{
    let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #888;padding:6px 8px;text-align:left;}th{background:#e8edf5;font-weight:bold;}tr:nth-child(even){background:#f5f7fb;}h2{color:#2563eb;margin-bottom:5px;}p{color:#666;font-size:10px;margin-bottom:15px;}@media print{body{margin:0;}}</style></head><body><h2>${filename.replace(/_/g,' ')}</h2><p>Generated: ${new Date().toLocaleString()} | HAT Portal</p>${table.outerHTML}</body></html>`;
    let w=window.open('','_blank');
    w.document.write(html);w.document.close();
    setTimeout(()=>{w.focus();w.print();},400);
    showToast('PDF opened for printing!');
  }catch(e){showToast('Export failed: '+e.message,true);}
}


// ─── Excel Upload & Column Mapper ───
/* ═══ EXCEL UPLOAD ═══ */
let _stuExcelRows=[],_stuExcelHeaders=[];
let _tchrExcelRows=[],_tchrExcelHeaders=[];
const STU_FIELDS=[{key:'name',label:'Full Name *'},{key:'roll',label:'Roll No *'},{key:'sem',label:'Semester'},{key:'gender',label:'Gender'},{key:'phone',label:'Phone'},{key:'email',label:'Email'},{key:'dob',label:'Date of Birth'},{key:'bloodGroup',label:'Blood Group'},{key:'address',label:'Address'},{key:'city',label:'City'},{key:'parentName',label:'Parent Name'},{key:'parentPhone',label:'Parent Phone'},{key:'admissionYear',label:'Admission Year'},{key:'category',label:'Category'},{key:'status',label:'Status'}];
const TCHR_FIELDS=[{key:'name',label:'Full Name *'},{key:'subject',label:'Subject *'},{key:'designation',label:'Designation'},{key:'phone',label:'Phone'},{key:'email',label:'Email'},{key:'qualification',label:'Qualification'},{key:'experience',label:'Experience'},{key:'joinDate',label:'Join Date'},{key:'status',label:'Status'}];
function downloadTemplate(filename, sheetName, headers, sampleRows){
  if(typeof XLSX==='undefined'){showToast('Excel library is not loaded.',true);return;}
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.json_to_sheet(sampleRows.length?sampleRows:[Object.fromEntries(headers.map(h=>[h,'']))], { header: headers });
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename+'.xlsx');
  showToast(filename.replace(/_/g,' ')+' downloaded!');
}
function downloadStudentTemplate(){
  const headers=['Full Name','Roll No','Semester','Gender','Phone','Email','Date of Birth','Blood Group','Address','City','Parent Name','Parent Phone','Admission Year','Category','Status'];
  downloadTemplate(`Student_Import_Template_${activeStuCourse||'General'}`, 'Students', headers, [{
    'Full Name':'Example Student','Roll No':'BCA001','Semester':activeStuSem||1,'Gender':'Male','Phone':'9876543210',
    'Email':'student@example.com','Date of Birth':'2005-01-15','Blood Group':'B+','Address':'Street address',
    'City':'Ahmedabad','Parent Name':'Parent Name','Parent Phone':'9876543211','Admission Year':new Date().getFullYear(),
    'Category':'General','Status':'Active'
  }]);
}
function downloadTeacherTemplate(){
  const headers=['Full Name','Subject','Designation','Phone','Email','Qualification','Experience','Join Date','Status'];
  downloadTemplate(`Teacher_Import_Template_${activeTchrCourse||'General'}`, 'Teachers', headers, [{
    'Full Name':'Example Teacher','Subject':'Mathematics','Designation':'Assistant Professor','Phone':'9876543210',
    'Email':'teacher@example.com','Qualification':'M.Tech','Experience':'3 years','Join Date':'2026-06-01','Status':'Active'
  }]);
}
function parseExcelFile(file,callback){const reader=new FileReader();reader.onload=function(e){try{const data=new Uint8Array(e.target.result);const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const json=XLSX.utils.sheet_to_json(ws,{defval:''});const headers=json.length>0?Object.keys(json[0]):[];callback(null,headers,json);}catch(err){callback(err,[],[]);}};reader.readAsArrayBuffer(file);}
function autoMatch(excelHeader,fieldKey,fieldLabel){const h=excelHeader.toLowerCase().replace(/[\s_\-\.]/g,'');const k=fieldKey.toLowerCase();const l=fieldLabel.toLowerCase().replace(/[\s\*]/g,'');if(h===k||h.includes(k)||k.includes(h)||h===l||h.includes(l)||l.includes(h))return true;const aliases={name:['fullname','studentname','teachername','faculty'],roll:['rollno','rollnum','enrollment','id'],sem:['semester','semno'],phone:['mobile','contact','mobileno'],email:['emailid','mail'],dob:['dateofbirth','birth'],bloodGroup:['blood','bloodtype'],parentName:['parent','guardian','fathername'],subject:['subjectname','paper'],designation:['post','position'],qualification:['degree','education'],experience:['exp','years'],joinDate:['joining','doj']};const al=aliases[fieldKey]||[];return al.some(a=>h.includes(a)||a.includes(h));}
function buildMapper(headers,fields,containerId,prefix){let html=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:6px;">`;headers.forEach(hdr=>{let best='';fields.forEach(f=>{if(!best&&autoMatch(hdr,f.key,f.label))best=f.key;});html+=`<div class="excel-map-row"><div class="col-label" title="${hdr}">${hdr}</div><div class="arrow">→</div><select id="${prefix}_map_${hdr.replace(/[^a-zA-Z0-9]/g,'_')}"><option value="">— Skip —</option>${fields.map(f=>`<option value="${f.key}" ${best===f.key?'selected':''}>${f.label}</option>`).join('')}</select></div>`;});html+=`</div>`;document.getElementById(containerId).innerHTML=html;}
function buildPreviewTable(headers,rows,containerId){let preview=rows.slice(0,3);let html=`<table class="report-table" style="min-width:500px;"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;preview.forEach(row=>{html+=`<tr>${headers.map(h=>`<td>${row[h]||''}</td>`).join('')}</tr>`;});if(!preview.length)html+=`<tr><td colspan="${headers.length}" style="text-align:center;color:var(--text3);">No data rows found</td></tr>`;html+=`</tbody></table>`;document.getElementById(containerId).innerHTML=html;}
function readMapping(headers,prefix){const map={};headers.forEach(hdr=>{const sel=document.getElementById(`${prefix}_map_${hdr.replace(/[^a-zA-Z0-9]/g,'_')}`);if(sel&&sel.value)map[hdr]=sel.value;});return map;}
function handleStuExcel(event){const file=event.target.files[0];if(!file)return;event.target.value='';document.getElementById('stuExcelFileName').textContent=file.name;parseExcelFile(file,(err,headers,rows)=>{if(err||!headers.length){showToast('Could not read file. Use .xlsx, .xls or .csv',true);return;}_stuExcelHeaders=headers;_stuExcelRows=rows;document.getElementById('stuExcelRowCount').textContent=`${rows.length} rows found`;buildMapper(headers,STU_FIELDS,'stuColumnMapper','stu');buildPreviewTable(headers,rows,'stuExcelPreview');document.getElementById('stuImportSuccess').style.display='none';document.getElementById('stuExcelOverlay').classList.add('open');});}
function closeStuExcel(){document.getElementById('stuExcelOverlay').classList.remove('open');_stuExcelRows=[];_stuExcelHeaders=[];}
async function importStudentsFromExcel(){
  if(!_stuExcelRows.length){showToast('No data to import.',true);return;}
  const mapping=readMapping(_stuExcelHeaders,'stu');
  if(!Object.values(mapping).includes('name')){showToast('Please map at least the Full Name column.',true);return;}
  const rows=[];
  _stuExcelRows.forEach((row)=>{
    const s={};
    Object.entries(mapping).forEach(([excelCol,fieldKey])=>{
      let val=String(row[excelCol]||'').trim();
      if(!val) return;
      if(fieldKey==='sem'||fieldKey==='admissionYear') val=parseInt(val)||undefined;
      s[fieldKey]=val;
    });
    if(s.name && s.roll) rows.push(s);
  });
  try{
    const resp = await apiJson("/api/hod/import/students", {
      method:"POST",
      body: JSON.stringify({ course: activeStuCourse, sem: activeStuSem||1, rows })
    });
    await refreshStudents();
    renderStudentList();renderStuCourseCards();loadDashboard();
    const bar=document.getElementById('stuImportSuccess');bar.textContent=`✅ ${resp.imported||0} students imported!`;bar.style.display='block';
    showToast(`${resp.imported||0} students imported successfully!`);
    setTimeout(()=>{closeStuExcel();},1800);
  }catch(e){
    showToast(e.message||"Import failed",true);
  }
}
function handleTchrExcel(event){const file=event.target.files[0];if(!file)return;event.target.value='';document.getElementById('tchrExcelFileName').textContent=file.name;parseExcelFile(file,(err,headers,rows)=>{if(err||!headers.length){showToast('Could not read file.',true);return;}_tchrExcelHeaders=headers;_tchrExcelRows=rows;document.getElementById('tchrExcelRowCount').textContent=`${rows.length} rows found`;buildMapper(headers,TCHR_FIELDS,'tchrColumnMapper','tchr');buildPreviewTable(headers,rows,'tchrExcelPreview');document.getElementById('tchrImportSuccess').style.display='none';document.getElementById('tchrExcelOverlay').classList.add('open');});}
function closeTchrExcel(){document.getElementById('tchrExcelOverlay').classList.remove('open');_tchrExcelRows=[];_tchrExcelHeaders=[];}
async function importTeachersFromExcel(){
  if(!_tchrExcelRows.length){showToast('No data to import.',true);return;}
  const mapping=readMapping(_tchrExcelHeaders,'tchr');
  if(!Object.values(mapping).includes('name')){showToast('Please map at least the Full Name column.',true);return;}
  const rows=[];
  _tchrExcelRows.forEach((row)=>{
    const t={};
    Object.entries(mapping).forEach(([excelCol,fieldKey])=>{let val=String(row[excelCol]||'').trim();if(!val)return;t[fieldKey]=val;});
    if(t.name && t.subject) rows.push(t);
  });
  try{
    const resp = await apiJson("/api/hod/import/teachers", {
      method:"POST",
      body: JSON.stringify({ course: activeTchrCourse, rows })
    });
    await refreshTeachers();
    renderTeacherList();renderTchrCourseCards();loadDashboard();
    const bar=document.getElementById('tchrImportSuccess');bar.textContent=`✅ ${resp.imported||0} teachers imported!`;bar.style.display='block';
    showToast(`${resp.imported||0} teachers imported successfully!`);
    setTimeout(()=>{closeTchrExcel();},1800);
  }catch(e){
    showToast(e.message||"Import failed",true);
  }
}
