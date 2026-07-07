// teacher/js/reports.js — Attendance Reports for classes this teacher teaches.
// Pulls real data from /api/teacher/attendance-report (scoped server-side to
// this teacher's own marked attendance), with Excel export (client-side via
// SheetJS) and PDF export (server-rendered, via /api/teacher/attendance-report/pdf).

let rptCourse = '';
let rptSem = '';
let rptLoading = false;
let rptRows = [];   // [{ id, name, roll, total, present, absent, percentage }]

function loadReportsPage() {
  updateSemOptions('rptCourse', 'rptSem', true);
  rptCourse = document.getElementById('rptCourse')?.value || '';
  rptSem = document.getElementById('rptSem')?.value || '';
  renderReportFilters();
}

function onReportFilterChange() {
  updateSemOptions('rptCourse', 'rptSem', true);
  rptCourse = document.getElementById('rptCourse').value;
  rptSem = document.getElementById('rptSem').value;
  if (!rptCourse) { rptRows = []; renderReportFilters(); return; }
  fetchAttendanceReport();
}

function renderReportFilters() {
  const area = document.getElementById('reportResultArea');
  if (!area) return;
  if (!rptCourse) {
    area.innerHTML = `<div class="card"><div class="empty-state"><div class="e-icon">📊</div><div class="e-txt">Select a course above</div><div class="e-sub">Choose a course (and optionally a semester) to view your attendance report</div></div></div>`;
    return;
  }
  if (rptLoading) {
    area.innerHTML = `<div class="card"><div class="empty-state"><div class="e-icon">⏳</div><div class="e-txt">Loading report…</div></div></div>`;
    return;
  }
  if (!rptRows.length) {
    area.innerHTML = `<div class="card"><div class="empty-state"><div class="e-icon">📄</div><div class="e-txt">No attendance records yet</div><div class="e-sub">You haven't marked attendance for this class yet</div></div></div>`;
    return;
  }

  const lowCount = rptRows.filter(r => r.percentage < 75).length;
  let html = `<div class="card">
    <div class="card-hd">
      📊 ${rptCourse}${rptSem ? ' · Sem ' + rptSem : ' · All Semesters'}
      <span class="card-hd-sub">${rptRows.length} student${rptRows.length !== 1 ? 's' : ''}${lowCount ? ` · <span class="badge bg-red">⚠️ ${lowCount} below 75%</span>` : ' · <span class="badge bg-green">✅ All above 75%</span>'}</span>
    </div>
    <div class="rpt-export-row">
      <button class="btn btn-ghost btn-sm" onclick="exportReportExcel()">📥 Excel</button>
      <button class="btn btn-ghost btn-sm" onclick="downloadReportPdf()">📄 PDF</button>
    </div>
  </div>`;

  html += `<div class="stu-grid">`;
  rptRows.forEach(r => {
    const pc = r.percentage >= 75 ? 'var(--green)' : 'var(--red)';
    html += `<div class="stu-card" style="cursor:default;">
      <div class="stu-name">${escapeHtml(r.name)}</div>
      <div class="stu-roll">Roll ${escapeHtml(r.roll)}</div>
      <div class="stu-pct" style="color:${pc}">${r.percentage}%</div>
      <div class="stu-bar"><div class="stu-bar-fill" style="width:${r.percentage}%;background:${pc}"></div></div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;">${r.present}/${r.total} present</div>
    </div>`;
  });
  html += `</div>`;

  area.innerHTML = html;
}

async function fetchAttendanceReport() {
  rptLoading = true;
  renderReportFilters();
  try {
    const qs = new URLSearchParams({ course: rptCourse });
    if (rptSem) qs.set('semester', rptSem);
    const data = await TAPI.getAttReport(qs.toString());
    rptRows = (data.summary || []).map(row => ({
      id: row.student?._id || row.student,
      name: row.student?.name || 'Unknown',
      roll: row.student?.roll || row.student?.rollNo || '-',
      total: row.total, present: row.present,
      absent: row.total - row.present,
      percentage: row.percentage
    })).sort((a, b) => String(a.roll).localeCompare(String(b.roll), undefined, { numeric: true }));
  } catch (e) {
    showToast('Failed to load report: ' + e.message, 'error');
    rptRows = [];
  } finally {
    rptLoading = false;
    renderReportFilters();
  }
}

function exportReportExcel() {
  if (!rptRows.length) { showToast('No data to export.', 'error'); return; }
  try {
    const sheetRows = rptRows.map(r => ({
      'Roll No': r.roll, 'Student Name': r.name,
      'Total Lectures': r.total, 'Present': r.present, 'Absent': r.absent, 'Percentage': r.percentage + '%'
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    ws['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    const fn = `Attendance_${rptCourse}${rptSem ? '_Sem' + rptSem : ''}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fn);
    showToast('Excel downloaded!');
  } catch (e) {
    showToast('Export failed: ' + e.message, 'error');
  }
}

async function downloadReportPdf() {
  try {
    const qs = new URLSearchParams({ course: rptCourse });
    if (rptSem) qs.set('semester', rptSem);
    const fn = `Attendance_${rptCourse}${rptSem ? '_Sem' + rptSem : ''}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
    await downloadFile('/teacher/attendance-report/pdf?' + qs.toString(), fn);
    showToast('PDF downloaded!');
  } catch (e) {
    showToast('PDF export failed: ' + e.message, 'error');
  }
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
