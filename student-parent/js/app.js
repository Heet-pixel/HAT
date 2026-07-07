// ============================================================
//  student/js/app.js
//  App bootstrap — runs once on DOMContentLoaded
//  Loads profile from API, sets up navigation
// ============================================================

const App = {

  async init() {
    Theme.init();
    this._bindNav();
    this._bindSidebar();
    await this._loadIdentity();
    Nav.go('dashboard');
  },

  /* ── load logged-in student's profile from API ─────────── */
  async _loadIdentity() {
    try {
      const d = await API.auth.me();
      if (!d.success || !d.user) return;
      const u = d.user;

      /* persist fresh user object so other pages can read it */
      window.SAL_USER = u;

      /* fill all identity slots */
      const name     = u.name     || '';
      const initials = UI.initials(name);
      const email    = u.email    || '';
      const roll     = u.rollNumber || u.roll || '';
      const dept     = u.department?.name || '';
      const college  = u.college?.name || '';

      _fill('student-name',     name);
      _fill('student-initials', initials);
      _fill('student-email',    email);
      _fill('student-roll',     roll ? 'Roll: ' + roll : '');
      _fill('student-dept',     dept);
      _fill('student-college',  college);
    } catch (_) {
      /* silently fall back to auth.js values already set */
    }
  },

  /* ── bottom-nav + sidebar nav clicks ───────────────────── */
  _bindNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => Nav.go(el.dataset.page));
    });
  },

  _bindSidebar() {
    document.getElementById('sidebar-overlay')
      ?.addEventListener('click', UI.closeSidebar.bind(UI));
    document.querySelectorAll('.modal, .modal-overlay')
      ?.forEach(m => m.addEventListener('click', e => {
        if (e.target === m) UI.closeAllModals();
      }));
  },
};

/* ── helper: fill every element matching id OR class ── */
function _fill(selector, value) {
  document.querySelectorAll('#' + selector + ', .' + selector)
    .forEach(el => { el.textContent = value; });
}

/* ── Navigation controller ── */
const Nav = {
  _current: null,

  _loaders: {
    dashboard:  () => Dashboard.load(),
    attendance: () => Attendance.load(),
    syllabus:   () => Syllabus.load(),
    notices:    () => Notices.load(),
    marks:      () => Marks.load(),
    timetable:  () => Timetable.load(),
    profile:    () => Profile.load(),
  },

  go(page) {
    if (this._current === page) return;
    this._current = page;
    UI.showPage(page);
    this._loaders[page]?.();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
