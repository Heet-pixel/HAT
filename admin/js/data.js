// admin/js/data.js — Dynamic Data Layer: all data fetched from API, zero mock data

/* ══════════════════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════════════════ */
const pageTitles = {
  dashboard: 'Dashboard', departments: 'Departments', hod: 'Appoint HOD',
  courses: 'Courses', subjects: 'Subjects', teachers: 'Faculty Directory',
  students: 'Student Records', access: 'All Users Access',
  reports: 'Reports & Analytics', notices: 'College Notices', settings: 'Settings'
};

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (el) el.classList.add('active');
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = pageTitles[id] || id;
  if (window.innerWidth <= 768) closeSidebar();
  // Route to loader
  const loaders = {
    dashboard: loadDashboard,
    departments: loadDepartments,
    hod: loadHOD,
    courses: loadCourses,
    subjects: loadSubjectsPage,
    teachers: loadTeachers,
    students: loadStudents,
    access: loadAccess,
    reports: loadReports,
    notices: loadNotices,
    settings: loadSettings,
  };
  if (loaders[id]) loaders[id]();
}

function showTab(id, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tc = document.getElementById(id);
  if (tc) tc.classList.add('active');
  if (el) el.classList.add('active');
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }
function toggleNotif() { document.getElementById('notifPanel').classList.toggle('open'); }

/* ══════════════════════════════════════════════════
   BOOTSTRAP — load user info from API
══════════════════════════════════════════════════ */
async function bootstrap() {
  showLoader(true);
  try {
    const me = await apiJson('/api/auth/me');
    const user = me.user || me;
    // Populate sidebar
    const nameEl = document.getElementById('sidebarName');
    const avatarEl = document.getElementById('sidebarAvatar');
    const roleEl = document.getElementById('sidebarRole');
    if (nameEl) nameEl.textContent = user.name || 'Principal';
    if (avatarEl) avatarEl.textContent = initials(user.name);
    if (roleEl) roleEl.textContent = (user.role || 'admin').replace('_', ' ');
    // College name in topbar/logo
    const collegeEl = document.getElementById('collegeName');
    if (collegeEl && user.college) collegeEl.textContent = user.college.name || '';
    // Welcome subtitle
    const subEl = document.getElementById('pageSubtitle');
    if (subEl) subEl.textContent = 'Welcome back, ' + (user.name || 'Principal');
    // Load notifications
    loadNotifications();
  } catch (e) {
    console.error('Bootstrap error:', e);
  } finally {
    showLoader(false);
  }
  loadDashboard();
}

function showLoader(show) {
  const el = document.getElementById('pageLoader');
  if (el) el.style.opacity = show ? '1' : '0';
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// Shared table-row avatar: real photo when the person has one uploaded, initials otherwise.
function avatarCell(person) {
  return person && person.avatar
    ? `<img class="avatar-sm" src="${person.avatar}" alt="${person.name || ''}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px">`
    : `<span class="avatar-sm">${initials(person && person.name)}</span>`;
}

async function apiJson(url, opts) {
  const at = localStorage.getItem('sal_at') || localStorage.getItem('sal_token');
  const headers = { 'Content-Type': 'application/json', ...((opts || {}).headers || {}) };
  if (at) headers['Authorization'] = 'Bearer ' + at;
  const res = await fetch(url, { ...(opts || {}), headers });
  if (res.status === 401) { localStorage.clear(); window.location.replace('/login'); throw new Error('Unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

function showToast(msg, type = 'success') {
  let c = document.getElementById('toastContainer');
  if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">✕</button>`;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4000);
}

function skeletonRows(cols, n = 4) {
  return Array(n).fill(`<tr>${Array(cols).fill('<td><div class="skeleton" style="height:16px;border-radius:4px"></div></td>').join('')}</tr>`).join('');
}
function skeletonCards(n = 4) {
  return Array(n).fill('<div class="stat-card skeleton" style="height:90px"></div>').join('');
}

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
async function loadDashboard() {
  document.getElementById('dashStats').innerHTML = skeletonCards(6);
  document.getElementById('recentActivity').innerHTML = '<p style="color:var(--text2);font-size:13px">Loading...</p>';
  try {
    const ov = await apiJson('/api/admin/overview');
    const d = ov.data || ov;
    renderDashboardStats(d);
    renderBarChart(d.enrollmentByDept || []);
    renderRingChart(d.facultyByDept || []);
    renderDeptHealth(d.deptHealth || []);
  } catch (e) {
    document.getElementById('dashStats').innerHTML = `<div style="color:var(--danger);padding:16px">Failed to load dashboard: ${e.message}</div>`;
  }
  try {
    const act = await apiJson('/api/admin/activity?limit=5');
    renderActivity(act.data || act.activities || []);
  } catch (e) {
    document.getElementById('recentActivity').innerHTML = '<p style="color:var(--text2);font-size:13px">No recent activity.</p>';
  }
  // Welcome strip — live date
  const welcomeDate = document.getElementById('welcomeDate');
  if (welcomeDate) welcomeDate.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function renderDashboardStats(d) {
  const stats = [
    { icon: 'fa-building-columns', color: 'rgba(201,168,76,0.15)', icolor: 'var(--gold)', val: d.departments ?? '—', label: 'Departments', trend: d.deptTrend || null },
    { icon: 'fa-user-graduate', color: 'rgba(61,184,139,0.15)', icolor: 'var(--success)', val: d.students ?? '—', label: 'Total Students', trend: d.studentTrend || null },
    { icon: 'fa-chalkboard-teacher', color: 'rgba(74,159,212,0.15)', icolor: 'var(--info)', val: d.teachers ?? '—', label: 'Faculty Members', trend: d.teacherTrend || null },
    { icon: 'fa-user-tie', color: 'rgba(201,168,76,0.12)', icolor: 'var(--gold)', val: d.hods ?? '—', label: 'HODs Appointed', trend: d.hodTrend || null },
    { icon: 'fa-book-open', color: 'rgba(74,159,212,0.15)', icolor: 'var(--info)', val: d.courses ?? '—', label: 'Active Courses', trend: d.courseTrend || null },
    { icon: 'fa-atom', color: 'rgba(61,184,139,0.15)', icolor: 'var(--success)', val: d.subjects ?? '—', label: 'Subjects Offered', trend: d.subjectTrend || null },
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${s.color}"><i class="fas ${s.icon}" style="color:${s.icolor}"></i></div>
      <h4>${typeof s.val === 'number' ? s.val.toLocaleString('en-IN') : s.val}</h4>
      <p>${s.label}</p>
      ${s.trend ? `<div class="trend ${s.trend.dir || 'up'}"><i class="fas fa-arrow-${s.trend.dir || 'up'}"></i> ${s.trend.text}</div>` : ''}
    </div>`).join('');
}

function renderActivity(activities) {
  const el = document.getElementById('recentActivity');
  if (!activities.length) { el.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:8px 0">No recent activity.</p>'; return; }
  const iconMap = { create: { bg: 'rgba(61,184,139,0.15)', icon: 'fa-plus-circle', color: 'var(--success)' }, delete: { bg: 'rgba(224,87,87,0.15)', icon: 'fa-trash', color: 'var(--danger)' }, update: { bg: 'rgba(74,159,212,0.15)', icon: 'fa-pen', color: 'var(--info)' }, assign: { bg: 'rgba(201,168,76,0.15)', icon: 'fa-user-plus', color: 'var(--gold)' } };
  el.innerHTML = activities.map(a => {
    const ic = iconMap[a.action] || iconMap.create;
    return `<div class="activity-item">
      <div class="act-icon" style="background:${ic.bg}"><i class="fas ${ic.icon}" style="color:${ic.color}"></i></div>
      <div class="act-body"><p>${a.description || a.message || 'Action performed'}</p><span>${a.time || a.createdAt ? UI.fmtDateTime(a.createdAt || a.time) : '—'}</span></div>
    </div>`;
  }).join('');
}

function renderBarChart(data) {
  const el = document.getElementById('barChart');
  if (!el || !data.length) { if (el) el.innerHTML = '<p style="color:var(--text2);font-size:12px;padding:8px">No enrollment data.</p>'; return; }
  const max = Math.max(...data.map(d => d.count || d.v || 0), 1);
  el.innerHTML = data.map(d => `
    <div class="bar-group">
      <div class="bar-value">${(d.count || d.v || 0).toLocaleString()}</div>
      <div class="bar" style="height:${Math.max(((d.count || d.v || 0) / max) * 100, 4)}%"></div>
      <div class="bar-label">${d.code || d.dept || d.l || '?'}</div>
    </div>`).join('');
}

function renderRingChart(data) {
  const svg = document.getElementById('ringChart');
  const leg = document.getElementById('ringLegend');
  if (!svg || !data.length) return;
  const colors = ['#c9a84c', '#4a9fd4', '#3db88b', '#e4c16f', '#7a8a9a', '#e05757', '#a07830'];
  const total = data.reduce((a, d) => a + (d.count || d.v || 0), 0) || 1;
  let angle = 0; const r = 45, cx = 60, cy = 60;
  const arcs = data.map((d, i) => {
    const a = ((d.count || d.v || 0) / total) * 2 * Math.PI;
    const x1 = cx + r * Math.sin(angle), y1 = cy - r * Math.cos(angle);
    angle += a;
    const x2 = cx + r * Math.sin(angle), y2 = cy - r * Math.cos(angle);
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${a > Math.PI ? 1 : 0},1 ${x2},${y2} Z`, c: colors[i % colors.length], l: d.code || d.dept || d.l, v: d.count || d.v || 0 };
  });
  svg.innerHTML = arcs.map(a => `<path d="${a.path}" fill="${a.c}" stroke="var(--navy)" stroke-width="2"/>`).join('') +
    `<circle cx="60" cy="60" r="28" fill="var(--navy2)"/><text x="60" y="64" text-anchor="middle" fill="var(--gold2)" font-size="14" font-family="Cormorant Garamond">${total}</text>`;
  leg.innerHTML = arcs.map(a => `<div class="ring-item"><div class="ring-dot" style="background:${a.c}"></div>${a.l}: <strong>${a.v}</strong></div>`).join('');
}

function renderDeptHealth(data) {
  const el = document.getElementById('deptHealth');
  if (!el || !data.length) { if (el) el.innerHTML = '<p style="color:var(--text2);font-size:12px">No data available.</p>'; return; }
  el.innerHTML = data.map(d => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:12px;color:var(--text)">${d.code || d.name}</span>
        <span style="font-size:12px;color:var(--gold);font-weight:600">${d.attendance || d.att || 0}%</span>
      </div>
      <div style="background:rgba(255,255,255,0.07);border-radius:6px;height:7px">
        <div style="width:${d.attendance || d.att || 0}%;background:linear-gradient(to right,var(--gold),var(--gold2));border-radius:6px;height:100%"></div>
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════
   DEPARTMENTS
══════════════════════════════════════════════════ */
async function loadDepartments() {
  const c = document.getElementById('deptCards');
  c.innerHTML = '<div class="skeleton" style="height:160px;border-radius:16px"></div>'.repeat(4);
  try {
    const d = await apiJson('/api/admin/departments');
    const list = d.data || d.departments || [];
    if (!list.length) { c.innerHTML = '<div style="color:var(--text2);padding:24px">No departments found. Create one above.</div>'; return; }
    c.innerHTML = list.map(dept => `
      <div class="dept-card">
        <div class="dept-header">
          <div class="dept-icon"><i class="fas ${dept.icon || 'fa-building'}"></i></div>
          <div class="dept-actions">
            <button class="icon-btn" title="Edit" onclick='openEditDept(${JSON.stringify(dept)})'><i class="fas fa-pen"></i></button>
            <button class="icon-btn" title="Delete" style="color:var(--danger);border-color:rgba(224,87,87,0.3)" onclick="deleteDept('${dept._id || dept.id}','${dept.name}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="dept-name">${dept.name}</div>
        <div class="dept-code">${dept.code || ''}${dept.establishedYear ? ' · Est. ' + dept.establishedYear : ''}</div>
        <div class="dept-stats">
          <div class="dept-stat"><div class="val">${dept.studentCount ?? dept.students ?? '—'}</div><div class="lbl">Students</div></div>
          <div class="dept-stat"><div class="val">${dept.teacherCount ?? dept.faculty ?? '—'}</div><div class="lbl">Faculty</div></div>
          <div class="dept-stat"><div class="val">${dept.courseCount ?? dept.courses ?? '—'}</div><div class="lbl">Courses</div></div>
        </div>
        <div class="hod-chip"><i class="fas fa-user-tie"></i> HOD: ${dept.hodId?.name || dept.hod || 'Vacant'}</div>
      </div>`).join('');
  } catch (e) { c.innerHTML = `<div style="color:var(--danger);padding:16px">Failed to load: ${e.message}</div>`; }
}

function openEditDept(dept) {
  document.getElementById('deptId').value = dept._id || dept.id || '';
  document.getElementById('deptName').value = dept.name || '';
  document.getElementById('deptCode').value = dept.code || '';
  document.getElementById('deptYear').value = dept.establishedYear || dept.year || '';
  document.getElementById('deptDesc').value = dept.description || '';
  document.getElementById('deptIcon').value = dept.icon || 'fa-building';
  openModal('deptModal');
}

async function addDepartment() {
  const name = document.getElementById('deptName').value.trim();
  const code = document.getElementById('deptCode').value.trim();
  const year = document.getElementById('deptYear').value || '';
  const icon = document.getElementById('deptIcon').value;
  const desc = document.getElementById('deptDesc').value.trim();
  const id = document.getElementById('deptId')?.value;
  if (!name || !code) { showToast('Please fill Name and Code', 'error'); return; }
  try {
    const body = { name, code, establishedYear: year || undefined, icon, description: desc };
    if (id) {
      await apiJson('/api/admin/departments/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Department updated');
    } else {
      await apiJson('/api/admin/departments', { method: 'POST', body: JSON.stringify(body) });
      showToast('Department created');
    }
    closeModal('deptModal');
    loadDepartments();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteDept(id, name) {
  if (!confirm('Delete "' + name + '"?')) return;
  try {
    await apiJson('/api/admin/departments/' + id, { method: 'DELETE' });
    showToast('Department deleted');
    loadDepartments();
  } catch (e) { showToast(e.message || 'Delete failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   HOD MANAGEMENT
══════════════════════════════════════════════════ */
async function loadHOD() {
  const tbody = document.getElementById('hodTable');
  tbody.innerHTML = skeletonRows(7, 3);
  try {
    const d = await apiJson('/api/admin/hod');
    const list = d.data || d.hods || [];
    tbody.innerHTML = list.length ? list.map((h, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${avatarCell(h)}${h.name || h.facultyName}</td>
        <td>${h.department?.name || h.dept || '—'}</td>
        <td>${h.qualification || h.qual || '—'}</td>
        <td>${h.appointedDate || h.appointed || '—'}</td>
        <td><span class="badge ${h.isActive !== false ? 'badge-active' : 'badge-inactive'}">${h.isActive !== false ? 'Active' : 'Inactive'}</span></td>
        <td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="removeHOD('${h._id || h.id}','${h.name}')"><i class="fas fa-user-minus"></i> Remove</button></td>
      </tr>`).join('') : '<tr><td colspan="7" style="color:var(--text2);text-align:center;padding:24px">No HODs appointed yet.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }

  // Also load departments-awaiting-HOD
  await loadVacantDepts();
  // Populate HOD modal dept dropdown
  await populateDeptDropdown('hodDept');
}

async function loadVacantDepts() {
  const tbody = document.getElementById('vacantDeptsTable');
  if (!tbody) return;
  try {
    const d = await apiJson('/api/admin/departments?hodVacant=true');
    const list = d.data || d.departments || [];
    tbody.innerHTML = list.length ? list.map(dept => `
      <tr>
        <td>${dept.name}</td><td>${dept.code || '—'}</td>
        <td>${dept.teacherCount ?? '—'}</td>
        <td><button class="btn btn-gold btn-sm" onclick="openModal('hodModal')"><i class="fas fa-plus"></i> Appoint</button></td>
      </tr>`).join('') : '<tr><td colspan="4" style="color:var(--text2);text-align:center;padding:16px">All departments have HODs assigned.</td></tr>';
  } catch (e) { /* silently fail */ }
}

async function populateDeptDropdown(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  try {
    const d = await apiJson('/api/admin/departments');
    const list = d.data || d.departments || [];
    el.innerHTML = '<option value="">-- Select Department --</option>' + list.map(dept => `<option value="${dept._id || dept.id}">${dept.name}</option>`).join('');
  } catch (e) { /* silently fail */ }
}

async function appointHOD() {
  const dept = document.getElementById('hodDept').value;
  const name = document.getElementById('hodName').value.trim();
  const qual = document.getElementById('hodQual').value.trim();
  const exp = document.getElementById('hodExp').value;
  const date = document.getElementById('hodDate').value;
  if (!name || !dept) { showToast('Please fill all required fields', 'error'); return; }
  try {
    await apiJson('/api/admin/hod', { method: 'POST', body: JSON.stringify({ name, departmentId: dept, qualification: qual, experience: exp, appointedDate: date }) });
    showToast('HOD appointed successfully');
    closeModal('hodModal');
    loadHOD();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function removeHOD(id, name) {
  if (!confirm('Remove HOD: ' + name + '?')) return;
  try {
    await apiJson('/api/admin/hod/' + id, { method: 'DELETE' });
    showToast('HOD removed');
    loadHOD();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   COURSES
══════════════════════════════════════════════════ */
async function loadCourses() {
  const tbody = document.getElementById('courseTable');
  tbody.innerHTML = skeletonRows(8, 4);
  try {
    const d = await apiJson('/api/admin/courses');
    const list = d.data || d.courses || [];
    tbody.innerHTML = list.length ? list.map((c, i) => `
      <tr>
        <td>${i + 1}</td><td><strong>${c.name}</strong></td>
        <td>${c.department?.name || c.dept || '—'}</td>
        <td>${c.duration || c.dur || '—'}</td>
        <td><span class="badge badge-pending">${c.type || '—'}</span></td>
        <td>${c.studentCount ?? c.students ?? '—'}</td>
        <td><span class="badge ${c.isActive !== false ? 'badge-active' : 'badge-inactive'}">${c.isActive !== false ? 'Active' : 'Inactive'}</span></td>
        <td><button class="btn btn-outline btn-sm"><i class="fas fa-eye"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" style="color:var(--text2);text-align:center;padding:24px">No courses found.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function addCourse() {
  const name = document.getElementById('courseName')?.value.trim();
  const dept = document.getElementById('courseDept')?.value;
  const duration = document.getElementById('courseDuration')?.value;
  const type = document.getElementById('courseType')?.value;
  const seats = document.getElementById('courseSeats')?.value;
  if (!name || !dept) { showToast('Course name and department required', 'error'); return; }
  try {
    await apiJson('/api/admin/courses', { method: 'POST', body: JSON.stringify({ name, departmentId: dept, duration, type, totalSeats: seats || undefined }) });
    showToast('Course added');
    closeModal('courseModal');
    loadCourses();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   SUBJECTS
══════════════════════════════════════════════════ */
async function loadSubjectsPage() {
  const tbody = document.getElementById('subjectTable');
  tbody.innerHTML = skeletonRows(8, 4);
  try {
    const d = await apiJson('/api/admin/subjects');
    const list = d.data || d.subjects || [];
    tbody.innerHTML = list.length ? list.map((s, i) => `
      <tr>
        <td>${i + 1}</td><td>${s.name}</td>
        <td><code style="color:var(--gold);font-size:12px">${s.code || '—'}</code></td>
        <td>${s.department?.name || s.dept || '—'}</td>
        <td>${s.credits || '—'}</td>
        <td>${s.semester || s.sem ? 'Sem ' + (s.semester || s.sem) : '—'}</td>
        <td><span class="badge ${s.type === 'Theory' ? 'badge-active' : s.type === 'Practical' ? 'badge-pending' : 'badge-inactive'}">${s.type || '—'}</span></td>
        <td><button class="btn btn-outline btn-sm"><i class="fas fa-pen"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" style="color:var(--text2);text-align:center;padding:24px">No subjects found.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function addSubject() {
  const name = document.getElementById('subjName')?.value.trim();
  const code = document.getElementById('subjCode')?.value.trim();
  const dept = document.getElementById('subjDept')?.value;
  const sem = document.getElementById('subjSem')?.value;
  const credits = document.getElementById('subjCredits')?.value;
  const type = document.getElementById('subjType')?.value;
  if (!name || !code || !dept) { showToast('Name, code and department required', 'error'); return; }
  try {
    await apiJson('/api/admin/subjects', { method: 'POST', body: JSON.stringify({ name, code, departmentId: dept, semester: parseInt(sem) || 1, credits: parseInt(credits) || undefined, type }) });
    showToast('Subject added');
    closeModal('subjectModal');
    loadSubjectsPage();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   TEACHERS
══════════════════════════════════════════════════ */
async function loadTeachers() {
  const tbody = document.getElementById('teacherTable');
  tbody.innerHTML = skeletonRows(8, 4);
  try {
    const d = await apiJson('/api/admin/teachers');
    const list = d.data || d.teachers || [];
    tbody.innerHTML = list.length ? list.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${avatarCell(t)}${t.name}</td>
        <td>${t.department?.name || t.dept || '—'}</td>
        <td>${Array.isArray(t.subjects) ? t.subjects.map(s => s.name || s).join(', ') : (t.subjects || t.subject || '—')}</td>
        <td>${t.qualification || t.qual || '—'}</td>
        <td>${t.experience || t.exp || '—'}</td>
        <td><span class="badge ${t.isActive !== false ? 'badge-active' : 'badge-inactive'}">${t.isActive !== false ? 'Active' : 'Inactive'}</span></td>
        <td><button class="btn btn-outline btn-sm"><i class="fas fa-eye"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" style="color:var(--text2);text-align:center;padding:24px">No teachers found.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`; }
}

async function addTeacher() {
  const fname = document.getElementById('teacherFname')?.value.trim();
  const lname = document.getElementById('teacherLname')?.value.trim();
  const dept = document.getElementById('teacherDept')?.value;
  const qual = document.getElementById('teacherQual')?.value.trim();
  const exp = document.getElementById('teacherExp')?.value;
  const email = document.getElementById('teacherEmail')?.value.trim();
  const name = [fname, lname].filter(Boolean).join(' ');
  if (!name || !email) { showToast('Name and email required', 'error'); return; }
  try {
    await apiJson('/api/admin/teachers', { method: 'POST', body: JSON.stringify({ name, email, departmentId: dept, qualification: qual, experience: exp }) });
    showToast('Teacher added');
    closeModal('teacherModal');
    loadTeachers();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   STUDENTS
══════════════════════════════════════════════════ */
async function loadStudents() {
  // Update stats
  document.getElementById('studentStats').innerHTML = skeletonCards(4);
  const tbody = document.getElementById('studentTable');
  tbody.innerHTML = skeletonRows(8, 4);
  try {
    const [overview, list] = await Promise.all([
      apiJson('/api/admin/students/stats').catch(() => ({})),
      apiJson('/api/admin/students')
    ]);
    const stats = overview.data || overview;
    document.getElementById('studentStats').innerHTML = `
      <div class="stat-card"><div class="stat-icon" style="background:rgba(61,184,139,0.15)"><i class="fas fa-user-graduate" style="color:var(--success)"></i></div><h4>${(stats.total ?? '—').toLocaleString?.() ?? stats.total ?? '—'}</h4><p>Total Students</p></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(74,159,212,0.15)"><i class="fas fa-male" style="color:var(--info)"></i></div><h4>${stats.male ?? '—'}</h4><p>Male</p></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(201,168,76,0.15)"><i class="fas fa-female" style="color:var(--gold)"></i></div><h4>${stats.female ?? '—'}</h4><p>Female</p></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(61,184,139,0.15)"><i class="fas fa-user-check" style="color:var(--success)"></i></div><h4>${stats.active ?? '—'}</h4><p>Active</p></div>`;
    const students = list.data || list.students || [];
    tbody.innerHTML = students.length ? students.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><span class="avatar-sm">${initials(s.name)}</span>${s.name}</td>
        <td><code style="color:var(--gold);font-size:11px">${s.rollNo || s.roll || '—'}</code></td>
        <td>${s.department?.name || s.dept || '—'}</td>
        <td>${s.course?.name || s.course || '—'}</td>
        <td>${s.semester ? 'Sem ' + s.semester : '—'}</td>
        <td><span class="badge ${s.isActive !== false ? 'badge-active' : 'badge-pending'}">${s.isActive !== false ? 'Active' : 'Inactive'}</span></td>
        <td><button class="btn btn-outline btn-sm"><i class="fas fa-eye"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" style="color:var(--text2);text-align:center;padding:24px">No students found.</td></tr>';
  } catch (e) {
    document.getElementById('studentStats').innerHTML = '';
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:16px">${e.message}</td></tr>`;
  }
}

async function addStudent() {
  const fname = document.getElementById('stuFname')?.value.trim();
  const lname = document.getElementById('stuLname')?.value.trim();
  const roll = document.getElementById('stuRoll')?.value.trim();
  const dept = document.getElementById('stuDept')?.value;
  const course = document.getElementById('stuCourse')?.value;
  const sem = document.getElementById('stuSem')?.value;
  const name = [fname, lname].filter(Boolean).join(' ');
  if (!name) { showToast('Student name required', 'error'); return; }
  try {
    await apiJson('/api/admin/students', { method: 'POST', body: JSON.stringify({ name, rollNo: roll, departmentId: dept, courseId: course, semester: parseInt(sem) || undefined }) });
    showToast('Student added');
    closeModal('studentModal');
    loadStudents();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   ACCESS / USERS
══════════════════════════════════════════════════ */
async function loadAccess() {
  const c = document.getElementById('accessProfiles');
  c.innerHTML = '<div class="skeleton" style="height:160px;border-radius:14px"></div>'.repeat(6);
  try {
    const d = await apiJson('/api/admin/users?limit=50');
    const list = d.data || d.users || [];
    const roleColors = { admin: 'linear-gradient(135deg,#e4c16f,#c9a84c)', super_admin: 'linear-gradient(135deg,#e4c16f,#c9a84c)', hod: 'linear-gradient(135deg,#c9a84c,#7a5a20)', co_hod: 'linear-gradient(135deg,#c9a84c,#7a5a20)', teacher: 'linear-gradient(135deg,#3db88b,#1d7a5a)', student: 'linear-gradient(135deg,#4a9fd4,#1d5a80)' };
    const roleBadge = { admin: 'badge-pending', super_admin: 'badge-pending', hod: 'badge-active', co_hod: 'badge-active', teacher: 'badge-inactive', student: 'badge-pending' };
    c.innerHTML = list.length ? list.map(u => `
      <div class="profile-card">
        <div class="profile-avatar" style="background:${roleColors[u.role] || roleColors.student};color:var(--navy)">${initials(u.name)}</div>
        <h4>${u.name}</h4>
        <p>${u.department?.name || u.email || '—'}</p>
        <span class="role-tag badge ${roleBadge[u.role] || 'badge-pending'}">${(u.role || '').replace('_', ' ')}</span>
        <button class="btn btn-outline btn-sm" style="margin-top:6px;width:100%"><i class="fas fa-eye"></i> View Profile</button>
      </div>`).join('') : '<p style="color:var(--text2);padding:16px">No users found.</p>';
  } catch (e) { c.innerHTML = `<div style="color:var(--danger);padding:16px">${e.message}</div>`; }
}

/* ══════════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════════ */
async function loadReports() {
  // Overview tab
  try {
    const d = await apiJson('/api/admin/reports/overview');
    const r = d.data || d;
    const overviewEl = document.getElementById('repOverviewStats');
    if (overviewEl) overviewEl.innerHTML = `
      <div class="card"><div class="card-title" style="margin-bottom:12px">Total Enrollment</div><h2 style="font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--gold2)">${(r.totalStudents || 0).toLocaleString('en-IN')}</h2><p style="color:var(--text2);font-size:12px">Students across ${r.totalDepts || '—'} departments</p></div>
      <div class="card"><div class="card-title" style="margin-bottom:12px">Avg. Attendance</div><h2 style="font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--success)">${r.avgAttendance || '—'}%</h2><p style="color:var(--text2);font-size:12px">College-wide this semester</p></div>
      <div class="card"><div class="card-title" style="margin-bottom:12px">Pass Rate</div><h2 style="font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--info)">${r.passRate || '—'}%</h2><p style="color:var(--text2);font-size:12px">Last semester result</p></div>`;
    renderBarChart(r.enrollmentTrend || []);
  } catch (e) { /* silently fail, leave skeleton */ }
  // Dept table
  await loadReportDepts();
}

async function loadReportDepts() {
  const tbody = document.getElementById('repDeptTable');
  if (!tbody) return;
  tbody.innerHTML = skeletonRows(7, 4);
  try {
    const d = await apiJson('/api/admin/reports/departments');
    const list = d.data || d.departments || [];
    tbody.innerHTML = list.length ? list.map(d => `
      <tr><td>${d.name}</td><td>${d.hod || '—'}</td><td>${d.faculty ?? '—'}</td><td>${d.students ?? '—'}</td><td>${d.courses ?? '—'}</td><td>${d.subjects ?? '—'}</td><td>${d.avgAttendance ? d.avgAttendance + '%' : '—'}</td></tr>`).join('') : '<tr><td colspan="7" style="color:var(--text2);text-align:center;padding:24px">No data.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger)">${e.message}</td></tr>`; }
}

/* ══════════════════════════════════════════════════
   NOTICES
══════════════════════════════════════════════════ */
async function loadNotices() {
  const c = document.getElementById('noticeList');
  c.innerHTML = '<div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>'.repeat(3);
  try {
    const d = await apiJson('/api/admin/notices');
    const list = d.data || d.notices || [];
    const colors = { Normal: 'badge-active', Important: 'badge-pending', Urgent: 'badge-inactive' };
    c.innerHTML = list.length ? list.map(n => `
      <div style="padding:18px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">
          <span style="font-size:16px;font-weight:600;color:var(--gold2)">${n.title}</span>
          <span class="badge ${colors[n.priority] || 'badge-active'}">${n.priority || 'Normal'}</span>
          <span class="badge badge-pending">${n.targetRole || n.audience || 'All'}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text2)">${n.createdAt ? UI.fmt(n.createdAt) : '—'}</span>
          <button class="btn btn-danger btn-sm" onclick="deleteNotice('${n._id || n.id}')"><i class="fas fa-trash"></i></button>
        </div>
        <p style="font-size:13px;color:var(--text2)">${n.body || n.msg || ''}</p>
      </div>`).join('') : '<p style="color:var(--text2);padding:24px;text-align:center">No notices posted yet.</p>';
  } catch (e) { c.innerHTML = `<div style="color:var(--danger);padding:16px">${e.message}</div>`; }
}

async function addNotice() {
  const title = document.getElementById('noticeTitle').value.trim();
  const msg = document.getElementById('noticeMsg').value.trim();
  const audience = document.getElementById('noticeAudience').value;
  const priority = document.getElementById('noticePriority').value;
  if (!title || !msg) { showToast('Fill title and message', 'error'); return; }
  try {
    await apiJson('/api/admin/notices', { method: 'POST', body: JSON.stringify({ title, body: msg, targetRole: audience, priority }) });
    showToast('Notice published');
    closeModal('noticeModal');
    loadNotices();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteNotice(id) {
  if (!confirm('Remove this notice?')) return;
  try {
    await apiJson('/api/admin/notices/' + id, { method: 'DELETE' });
    showToast('Notice removed');
    loadNotices();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

/* ══════════════════════════════════════════════════
   NOTIFICATIONS (bell panel)
══════════════════════════════════════════════════ */
async function loadNotifications() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  try {
    const d = await apiJson('/api/admin/notifications?limit=10');
    const list = d.data || d.notifications || [];
    const listEl = document.getElementById('notifList');
    if (listEl) {
      listEl.innerHTML = list.length ? list.map(n => `
        <div class="notif-item"><p>${n.message || n.title}</p><span>${n.createdAt ? UI.fmtDateTime(n.createdAt) : '—'}</span></div>`).join('') : '<p style="color:var(--text2);font-size:12px">No notifications.</p>';
    }
    // Show/hide dot
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = list.some(n => !n.isRead) ? '' : 'none';
  } catch (e) { /* silently ignore */ }
}

/* ══════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════ */
async function loadSettings() {
  try {
    const d = await apiJson('/api/admin/settings');
    const s = d.data || d;
    const collegeName = document.getElementById('settingCollegeName');
    const instCode = document.getElementById('settingInstCode');
    const acadYear = document.getElementById('settingAcadYear');
    if (collegeName) collegeName.value = s.collegeName || '';
    if (instCode) instCode.value = s.institutionCode || '';
    if (acadYear) acadYear.value = s.academicYear || '';
  } catch (e) { /* silently fail — use empty fields */ }
  // Principal profile
  try {
    const me = await apiJson('/api/auth/me');
    const u = me.user || me;
    const pName = document.getElementById('settingPrincipalName');
    const pEmail = document.getElementById('settingEmail');
    const pPhone = document.getElementById('settingPhone');
    if (pName) pName.value = u.name || '';
    if (pEmail) pEmail.value = u.email || '';
    if (pPhone) pPhone.value = u.phone || u.mobile || '';
  } catch (e) { /* silently fail */ }
}

async function saveSettings() {
  const collegeName = document.getElementById('settingCollegeName')?.value.trim();
  const instCode = document.getElementById('settingInstCode')?.value.trim();
  const acadYear = document.getElementById('settingAcadYear')?.value.trim();
  try {
    await apiJson('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ collegeName, institutionCode: instCode, academicYear: acadYear }) });
    showToast('Settings saved');
  } catch (e) { showToast(e.message || 'Failed to save', 'error'); }
}

async function saveProfile() {
  const name = document.getElementById('settingPrincipalName')?.value.trim();
  const phone = document.getElementById('settingPhone')?.value.trim();
  const curPwd = document.getElementById('settingCurPwd')?.value;
  const newPwd = document.getElementById('settingNewPwd')?.value;
  const body = { name, phone };
  if (curPwd && newPwd) { body.currentPassword = curPwd; body.newPassword = newPwd; }
  try {
    await apiJson('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
    showToast('Profile updated');
  } catch (e) { showToast(e.message || 'Failed to update', 'error'); }
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  bootstrap();
  // Keyboard shortcut: Escape closes modals
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); });
});
