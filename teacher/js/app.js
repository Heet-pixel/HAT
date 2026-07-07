// teacher/js/app.js — App Bootstrap: populate identity from API, init all modules
// currentTeacher holds the logged-in teacher's data — single source of truth, no switching.

let currentTeacher = {
  name:             '',
  dept:             '',
  initials:         '',
  avatar:           '',
  assignedSubjects: [],   // array of subject names (strings) or objects with {name, course, semester}
  timetable:        {},
  isClassTeacher:   false,
  classTeacherOf:   null,
};

// ─── State shared across modules ───
let selectedSub      = '';
let gridSeats        = [];
let currentAttCourse = '';
let currentAttSem    = 0;
let syllabusList     = [];
let attLogs          = [];
let stuFilterCourse  = '';
let stuFilterSem     = '';
let teacherClasses   = [];

async function init() {
  // Apply saved theme first
  Theme.init();

  // Set today's date on date inputs
  const today = new Date().toISOString().split('T')[0];
  ['attDate','sylDate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = today; });

  // Load teacher profile from API → populate all identity elements
  try {
    const d = await TAPI.me();
    if (d.success && d.user) {
      const u = d.user;
      currentTeacher.name             = u.name             || 'Teacher';
      currentTeacher.dept             = u.department?.name || u.college?.name || '';
      currentTeacher.initials         = UI.initials(u.name);
      currentTeacher.avatar           = u.avatar            || '';
      // subjects may be objects {name, course, semester} or plain strings
      currentTeacher.assignedSubjects = Array.isArray(u.subjects) && u.subjects.length
        ? u.subjects
        : (u.subject ? [u.subject] : []);
      currentTeacher.timetable        = u.timetable        || {};
      currentTeacher.isClassTeacher   = u.isClassTeacher   || false;
      currentTeacher.classTeacherOf   = u.classTeacherOf   || null;
    }
  } catch (_) {
    // Fallback — use whatever SAL_USER has (set by auth.js)
    const u = window.SAL_USER || {};
    currentTeacher.name     = u.name  || 'Teacher';
    currentTeacher.dept     = u.email || '';
    currentTeacher.initials = UI.initials(u.name);
  }

  // The identity endpoint above (/auth/me) doesn't carry a timetable — the
  // real HOD-built weekly schedule comes from /teacher/schedule, grouped by
  // day, which matches exactly what schedule.js expects to render.
  try {
    const sd = await TAPI.getSchedule();
    if (sd.success && sd.timetable) currentTeacher.timetable = sd.timetable;
  } catch (_) {
    // Leave currentTeacher.timetable as-is (empty) — schedule.js already
    // renders a friendly "No timetable available" empty state for this.
  }

  try {
    const sd = await TAPI.getSubjects();
    const subjects = sd.subjects || sd.data || [];
    if (Array.isArray(subjects) && subjects.length) currentTeacher.assignedSubjects = subjects;
  } catch (_) { /* keep subjects from profile if the subjects endpoint is unavailable */ }

  try {
    const cd = await TAPI.getClasses();
    teacherClasses = Array.isArray(cd.classes) ? cd.classes : [];
  } catch (_) {
    teacherClasses = classesFromSubjects(currentTeacher.assignedSubjects);
  }
  populateClassSelectors();

  // Render identity into the UI
  _applyIdentity();

  // Pre-load existing syllabus entries from backend
  try {
    const sd = await TAPI.getSyllabus();
    if (sd.success) syllabusList = sd.entries || sd.data || [];
  } catch (_) { /* non-critical, start with empty list */ }

  // Pre-load attendance log count from backend
  try {
    const ad = await TAPI.getAttendance();
    if (ad.success) attLogs = ad.logs || ad.data || [];
  } catch (_) { /* non-critical */ }

  // Responsive syllabus layout
  fixSylLayout();
  window.addEventListener('resize', fixSylLayout);

  // Start on dashboard
  goToPage('home');
}

function _applyIdentity() {
  const { name, dept, initials, avatar } = currentTeacher;
  const textIds = { sidebarName: name, headerName: name, sidebarDept: dept };
  Object.entries(textIds).forEach(([id, val]) => {
    const el = document.getElementById(id); if (el) el.textContent = val;
  });
  ['sidebarAv', 'headerAv', 'sb-av'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = avatar
      ? `<img src="${avatar}" alt="${name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
      : initials;
  });
}

document.addEventListener('DOMContentLoaded', init);

function classesFromSubjects(subjects) {
  const map = new Map();
  (subjects || []).forEach(sub => {
    if (typeof sub === 'string') return;
    const course = sub.course || sub.courseName || 'General';
    const semester = Number(sub.semester ?? sub.sem ?? 1);
    if (!map.has(course)) map.set(course, new Set());
    map.get(course).add(semester);
  });
  return [...map.entries()].map(([course, sems]) => ({
    course,
    semesters: [...sems].filter(Boolean).sort((a, b) => a - b)
  }));
}

function populateClassSelectors() {
  const courses = [...new Set((teacherClasses || []).map(c => c.course).filter(Boolean))];
  const courseOptions = '<option value="">-- Course --</option>' + courses.map(c => `<option value="${htmlEscape(c)}">${htmlEscape(c)}</option>`).join('');
  ['attCourse', 'stuCourse', 'rptCourse'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = courseOptions.replace('-- Course --', id === 'stuCourse' ? '-- Select Course --' : '-- Course --');
  });
  updateSemOptions('attCourse', 'attSem', false);
  updateSemOptions('stuCourse', 'stuSem', false);
  updateSemOptions('rptCourse', 'rptSem', true);
}

function updateSemOptions(courseId, semId, allowAll) {
  const course = document.getElementById(courseId)?.value || '';
  const semEl = document.getElementById(semId);
  if (!semEl) return;
  if (semEl.dataset.course === course) return;
  const previous = semEl.value;
  const cls = teacherClasses.find(c => c.course === course);
  const sems = cls?.semesters?.length ? cls.semesters : [1, 2, 3, 4, 5, 6];
  const first = allowAll ? '<option value="">-- All Semesters --</option>' : '<option value="">-- Select Semester --</option>';
  semEl.innerHTML = first + sems.map(s => `<option value="${s}">${s}</option>`).join('');
  semEl.dataset.course = course;
  if ([...semEl.options].some(o => o.value === previous)) semEl.value = previous;
}

function htmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
