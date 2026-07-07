// ============================================================
//  student/js/notices.js
//  Notices page — unifies three sources into one feed (spec item 5):
//    - sourceType 'syllabus'     → uploaded by the student's Teacher
//    - sourceType 'announcement' → uploaded by HOD
//    - sourceType 'notice'       → uploaded by Admin
//  Each may carry a PDF attachment the student can view/download.
//  Backend already scopes these to the student's own course+semester
//  (or department/college-wide if the uploader left that blank) — see
//  controllers/common.js#studentBundle.
// ============================================================

const SOURCE_META = {
  syllabus:     { label: 'Syllabus',      icon: '📘', badge: 'Teacher' },
  announcement: { label: 'Announcement',  icon: '📣', badge: 'HOD' },
  notice:       { label: 'Notice',        icon: '📢', badge: 'Admin' },
};

const Notices = {
  _data:   null,
  _filter: 'all',    // 'all' | 'syllabus' | 'announcement' | 'notice'

  async load() {
    _el('notices-content').innerHTML = UI.skeleton(4, 90);
    try {
      const d = await API.student.notices();
      if (!d.success) throw new Error(d.message || 'Failed');
      // Backend returns the flat array under `notices` — `data` is a nested
      // wrapper object ({success, notices}), not the array itself.
      this._data = d.notices || d.data?.notices || [];
      this._render();
    } catch (err) {
      _el('notices-content').innerHTML = UI.error(err.message);
    }
  },

  setFilter(f) {
    this._filter = f;
    document.querySelectorAll('#notices-filters .filter-chip')
      .forEach(c => c.classList.toggle('filter-chip--active', c.dataset.filter === f));
    this._render();
  },

  _render() {
    let list = this._data || [];
    if (this._filter !== 'all') list = list.filter(n => (n.sourceType || 'notice') === this._filter);

    if (!list.length) {
      _el('notices-content').innerHTML = UI.empty('📭', 'No notices', 'Nothing has been posted yet.');
      return;
    }

    _el('notices-content').innerHTML = list.map(n => {
      const meta = SOURCE_META[n.sourceType] || SOURCE_META.notice;
      const targetLabel = (n.course && n.semester)
        ? `${n.course} · Sem ${n.semester}`
        : (n.targetRole && n.targetRole !== 'all' ? n.targetRole : 'Everyone');
      return `
      <div class="notice-card ${n.isImportant ? 'notice-card--important' : ''}">
        <div class="notice-card__header">
          <div class="notice-card__title">
            <span>${meta.icon}</span>
            ${n.isImportant ? '<span class="notice-important-dot">🔴</span>' : ''}
            ${n.title}
          </div>
          <div class="notice-card__meta">${UI.fromNow(n.createdAt)}</div>
        </div>
        <div class="notice-card__body">${n.body || n.message || ''}</div>
        ${n.attachment ? `
          <div class="notice-card__attachment" style="margin-top:8px">
            <a href="${n.attachment}" target="_blank" rel="noopener" style="margin-right:10px">👁 View PDF</a>
            <a href="${n.attachment}" download="${n.attachmentName || (meta.label + '.pdf')}">⬇ Download</a>
          </div>` : ''}
        <div class="notice-card__footer">
          <span class="notice-card__by">
            ${meta.label} by <strong>${n.author?.name || n.createdBy?.name || meta.badge}</strong>
          </span>
          ${UI.badge(targetLabel, 'outline')}
        </div>
      </div>`;
    }).join('');
  },
};
