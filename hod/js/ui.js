// hod/js/ui.js - UI Utilities: Theme, Toast, Modals, Sidebar, Helpers

let currentTheme = localStorage.getItem('sal_theme') || localStorage.getItem('hodTheme') || 'dark';

function applyTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('sal_theme', t);
  localStorage.setItem('hodTheme', t);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
  document.getElementById('darkOpt')?.classList.toggle('active', t === 'dark');
  document.getElementById('lightOpt')?.classList.toggle('active', t === 'light');
}

function setTheme(t) {
  applyTheme(t);
  showToast('Theme updated to ' + (t === 'dark' ? 'Dark' : 'Light') + ' Mode');
}

function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

applyTheme(currentTheme);

function showToast(msg, isErr) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = (isErr ? '✖ ' : '✓ ') + msg;
  t.className = 'toast' + (isErr ? ' error' : '') + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function closeAllModals(){
  const ids=['studentModal','teacherModal','lecHistModal','stuMarksModal',
             'allStuOverlay','allTchrOverlay','stuExcelOverlay','tchrExcelOverlay',
             'deleteOverlay','deleteTchrOverlay','promoteOverlay'];
  ids.forEach(id=>{
    let el=document.getElementById(id);
    if(el) el.classList.remove('open');
  });
  stuEditMode=false; tchrEditMode=false;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${dt.getFullYear()}`;
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  const time = dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${fmtDate(d)} ${time}`;
}

function updateDate() {
  const d = new Date();
  const el = document.getElementById('topDate');
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
  if (el) el.textContent = `${weekday}, ${fmtDate(d)}`;
}
updateDate();

function toggleMobileSidebar(){
  let sidebar=document.getElementById('mainSidebar');
  let overlay=document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('open');
}

function closeMobileSidebar(){
  let sidebar=document.getElementById('mainSidebar');
  let overlay=document.getElementById('sidebarOverlay');
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(el=>{
  el.addEventListener('click',()=>{
    if(window.innerWidth<=768) closeMobileSidebar();
  });
});
