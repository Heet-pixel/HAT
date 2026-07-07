// js/ui.js — UI helpers + dark mode
const UI = {
  toast(msg, type = 'success') {
    let c = document.getElementById('toasts');
    if (!c) { c = document.createElement('div'); c.id = 'toasts'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">✕</button>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4000);
  },
  openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  },
  setNav(s) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.s === s));
    document.querySelectorAll('.pg').forEach(p => p.classList.toggle('hidden', p.id !== 'pg-' + s));
    const titles = {
      dashboard: 'Dashboard', departments: 'Departments', courses: 'Courses',
      subjects: 'Subjects', teachers: 'Teachers', students: 'Students',
      notices: 'Notices', reports: 'Reports & Analytics', settings: 'Settings'
    };
    const el = document.getElementById('pg-title');
    if (el) el.textContent = titles[s] || s;
    if (window.innerWidth < 768) UI.closeSb();
  },
  toggleSb() {
    document.getElementById('sb').classList.toggle('open');
    document.getElementById('ov').classList.toggle('show');
  },
  closeSb() {
    document.getElementById('sb')?.classList.remove('open');
    document.getElementById('ov')?.classList.remove('show');
  },
  fmt(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${dt.getFullYear()}`;
  },
  fmtDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    const time = dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    return `${UI.fmt(d)} ${time}`;
  },
  num(n) { return (n || 0).toLocaleString('en-IN'); },
  initials(n) { return (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; },
  sk(n = 4, h = 44) { return Array(n).fill(`<div class="sk" style="height:${h}px;border-radius:6px;margin-bottom:8px"></div>`).join(''); },
  emptyRow(cols, msg) { return `<tr><td colspan="${cols}" class="empty">${msg || 'No data found.'}</td></tr>`; },

  // Dark mode
  initDarkMode() {
    const saved = localStorage.getItem('sal_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    UI._updateToggleIcon(saved);
  },
  toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sal_theme', next);
    UI._updateToggleIcon(next);
  },
  _updateToggleIcon(theme) {
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },
};

document.addEventListener('click', e => { if (e.target.classList.contains('modal')) UI.closeAll(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeAll(); });
document.addEventListener('DOMContentLoaded', () => UI.initDarkMode());
