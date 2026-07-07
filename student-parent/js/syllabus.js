// student/js/syllabus.js
// Syllabus page. Accepts both legacy and current API response shapes.

const Syllabus = {
  _data: [],
  _activeSubject: 'all',

  _asArray(d) {
    const raw = d.data || d.syllabus || d.entries || [];
    return Array.isArray(raw) ? raw : Object.values(raw || {});
  },

  _subject(e) {
    if (e.subject && typeof e.subject === 'object') return e.subject;
    return {
      _id: e.subject || e.subjectId || e.subjectName || e.name,
      name: e.subjectName || e.name || e.subject || 'Subject',
      code: e.code || ''
    };
  },

  async load() {
    _el('syl-content').innerHTML = UI.skeleton(3, 70);
    try {
      const d = await API.student.syllabus();
      if (!d.success) throw new Error(d.message || 'Failed');
      this._data = this._asArray(d);
      this._activeSubject = 'all';
      this._buildFilters();
      this._render();
    } catch (err) {
      _el('syl-content').innerHTML = UI.error(err.message);
    }
  },

  _buildFilters() {
    const subjects = [...new Map(
      this._data
        .map(e => this._subject(e))
        .filter(Boolean)
        .map(s => [s._id || s.name, s])
    ).values()];

    if (subjects.length <= 1) {
      _el('syl-filters').innerHTML = '';
      return;
    }

    _el('syl-filters').innerHTML =
      `<div class="filter-chip filter-chip--active" data-subj="all" onclick="Syllabus._filter('all', this)">All</div>` +
      subjects.map(s => {
        const id = s._id || s.name;
        return `<div class="filter-chip" data-subj="${id}" onclick="Syllabus._filter('${id}', this)">${s.name}</div>`;
      }).join('');
  },

  _filter(subjId, el) {
    this._activeSubject = subjId;
    document.querySelectorAll('#syl-filters .filter-chip')
      .forEach(c => c.classList.toggle('filter-chip--active', c.dataset.subj === subjId));
    this._render();
  },

  _render() {
    const list = this._activeSubject === 'all'
      ? this._data
      : this._data.filter(e => {
          const subject = this._subject(e);
          return (subject._id || subject.name) === this._activeSubject;
        });

    if (!list.length) {
      _el('syl-content').innerHTML = UI.empty('Book', 'No syllabus entries', 'No topics have been added yet.');
      return;
    }

    _el('syl-content').innerHTML = list.map(e => {
      const subject = this._subject(e);
      return `
        <div class="syl-card">
          <div class="syl-card__header">
            <div class="syl-card__topic">${e.topic || e.title || 'Covered topic'}</div>
            <div class="syl-card__date">${UI.date(e.date)}</div>
          </div>
          <div class="syl-card__meta">
            <span class="badge badge--subject">${subject.name || 'Subject'}</span>
            ${subject.code ? `<span class="badge badge--code">${subject.code}</span>` : ''}
            ${e.teacher?.name ? `<span class="syl-card__teacher">by ${e.teacher.name}</span>` : ''}
          </div>
          ${e.description ? `<div class="syl-card__desc">${e.description}</div>` : ''}
          <div class="syl-card__footer">
            ${e.duration ? `<span>${e.duration} min</span>` : ''}
            ${e.method ? `<span>${e.method}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  },
};
