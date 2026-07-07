// teacher/js/notices.js — Announcements: View notices posted by HOD/admin
// Rendered inside the syllabus page's "Announcements from HOD/Admin" panel.

const Announcements = {
  async load() {
    const el = document.getElementById('teacherAnnList');
    if (!el) return;
    el.innerHTML = UI.sk(3, 80);
    try {
      const d = await TAPI.getAnnouncements();
      if (!d.success) { el.innerHTML = '<p class="empty">Failed to load.</p>'; return; }
      const notices = d.announcements || d.data?.announcements || [];
      el.innerHTML = notices.length
        ? notices.map(n => `
            <div class="notice-card">
              <div class="nc-title">${n.title}</div>
              <div class="nc-body">${n.body || n.message || ''}</div>
              ${n.attachment ? `<div style="margin-top:6px"><a href="${n.attachment}" target="_blank" rel="noopener" style="margin-right:10px">👁 View</a><a href="${n.attachment}" download="${n.attachmentName || 'Announcement.pdf'}">⬇ Download</a></div>` : ''}
              <div class="nc-meta">Posted ${UI.fmt(n.createdAt)}
                ${n.author?.name ? ' · by ' + n.author.name : ''}
              </div>
            </div>`).join('')
        : '<p class="empty">No announcements yet.</p>';
    } catch (_) {
      el.innerHTML = '<p class="empty">Error loading announcements.</p>';
    }
  },
};

// Hook into app navigation — loads whenever the syllabus page opens
const _origGoToPage = window.goToPage;
window.goToPage = function (id) {
  _origGoToPage?.(id);
  if (id === 'syllabus') Announcements.load();
};
