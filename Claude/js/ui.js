/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — ui.js                                    ║
 * ║  DOM rendering, modals, toasts, and event binding       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const UI = (() => {

  let _currentFilter = 'all';
  let _searchQuery   = '';
  let _settings      = Store.loadSettings();
  let _genreChart    = null;
  let _toastTimer    = null;
  let _toastQueue    = [];

  const $ = (id) => document.getElementById(id);
  let _dom = {};

  function _cacheDom() {
    _dom = {
      statsBar:         $('statsBar'),
      booksGrid:        $('booksGrid'),
      searchInput:      $('searchInput'),
      searchClear:      $('searchClear'),
      kpiGrid:          $('kpiGrid'),
      goalCard:         $('goalCard'),
      badgesGrid:       $('badgesGrid'),
      insightsList:     $('insightsList'),
      genreStats:       $('genreStats'),
      genreChart:       $('genreChart'),
      toast:            $('toast'),
      modalOverlay:     $('modalOverlay'),
      goalModalOverlay: $('goalModalOverlay'),
      fTitle:           $('fTitle'),
      fAuthor:          $('fAuthor'),
      fGenre:           $('fGenre'),
      fPages:           $('fPages'),
      fRating:          $('fRating'),
      fDateRead:        $('fDateRead'),
      gTarget:          $('gTarget'),
      filterBtns:       document.querySelectorAll('.filter-btn'),
    };
  }

  // ── TOAST ─────────────────────────────────────────────────────────────────

  function showToast(msg, type = 'info', duration = CONFIG.TIMING.TOAST_DURATION) {
    if (!_dom.toast) return;
    clearTimeout(_toastTimer);

    // Animate out first if visible
    _dom.toast.classList.remove('show');

    requestAnimationFrame(() => requestAnimationFrame(() => {
      _dom.toast.innerHTML = `<span class="toast-icon">${_toastIcon(type)}</span><span class="toast-msg">${Utils.escHtml(msg)}</span>`;
      _dom.toast.className = `toast toast-${type} show`;
      _toastTimer = setTimeout(() => {
        if (_dom.toast) _dom.toast.classList.remove('show');
      }, duration);
    }));
  }

  function _toastIcon(type) {
    return { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ';
  }

  // ── NAVIGATION ─────────────────────────────────────────────────────────────

  function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const viewEl = $('view-' + view);
    const navEl  = document.querySelector(`.nav-btn[data-view="${view}"]`);
    if (viewEl) viewEl.classList.add('active');
    if (navEl)  navEl.classList.add('active');
    if (view === 'dashboard') _renderDashboard();
  }

  // ── MODALS ─────────────────────────────────────────────────────────────────

  function openModal() {
    if (!_dom.modalOverlay) return;
    _dom.modalOverlay.classList.add('open');
    _dom.modalOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => _dom.fTitle && _dom.fTitle.focus(), 100);
  }

  function closeModal() {
    if (!_dom.modalOverlay) return;
    _dom.modalOverlay.classList.remove('open');
    _dom.modalOverlay.setAttribute('aria-hidden', 'true');
    _clearForm(['fTitle','fAuthor','fGenre','fPages','fRating','fDateRead']);
    _clearFormErrors();
  }

  function openGoalModal() {
    if (!_dom.goalModalOverlay) return;
    if (_dom.gTarget) _dom.gTarget.value = _settings.monthlyGoal || '';
    _dom.goalModalOverlay.classList.add('open');
    setTimeout(() => _dom.gTarget && _dom.gTarget.focus(), 100);
  }

  function closeGoalModal() {
    if (!_dom.goalModalOverlay) return;
    _dom.goalModalOverlay.classList.remove('open');
  }

  function _clearForm(fieldIds) {
    fieldIds.forEach(id => {
      const el = _dom[id] || $(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
  }

  function _clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function _showFormErrors(errors) {
    _clearFormErrors();
    errors.forEach(err => {
      const fieldMap = { title: 'fTitle', author: 'fAuthor', pages: 'fPages', rating: 'fRating', dateRead: 'fDateRead' };
      const fieldId = fieldMap[err.field];
      if (fieldId) {
        const el = _dom[fieldId] || $(fieldId);
        if (el) {
          el.classList.add('input-error');
          el.setAttribute('aria-invalid', 'true');
          // Insert error message below field
          const errEl = document.createElement('div');
          errEl.className = 'field-error';
          errEl.textContent = err.msg;
          errEl.setAttribute('role', 'alert');
          el.parentNode.appendChild(errEl);
        }
      }
    });
    // Show first error as toast
    if (errors.length) showToast(errors[0].msg, 'error');
    // Focus first errored field
    const firstErrField = document.querySelector('.input-error');
    if (firstErrField) firstErrField.focus();
  }

  // ── BOOK ACTIONS ───────────────────────────────────────────────────────────

  function _handleAddBook() {
    _clearFormErrors();
    const formData = {
      title:    _dom.fTitle?.value    ?? '',
      author:   _dom.fAuthor?.value   ?? '',
      genre:    _dom.fGenre?.value    ?? '',
      pages:    _dom.fPages?.value    ?? '',
      rating:   _dom.fRating?.value   ?? '',
      dateRead: _dom.fDateRead?.value ?? '',
    };

    const result = Books.create(formData);

    if (!result.success) {
      if (result.errors) _showFormErrors(result.errors);
      else showToast(result.error, 'error');
      return;
    }

    closeModal();
    renderLibrary();
    _animateNewCard(result.data.id);
    showToast(`"${result.data.title}" added to your library!`, 'success');
    if (typeof AIAssistant !== 'undefined') AIAssistant.onLibraryChange();
  }

  function _animateNewCard(id) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-id="${id}"]`);
      if (card) {
        card.classList.add('card-just-added');
        setTimeout(() => card.classList.remove('card-just-added'), 800);
      }
    });
  }

  const _handleDeleteBook = Utils.throttle((id) => {
    // Find the card and animate it out
    const card = document.querySelector(`[data-id="${id}"]`);
    const title = Books.getById(id)?.data?.title ?? '';

    if (card) {
      card.classList.add('card-removing');
      setTimeout(() => {
        const result = Books.remove(id);
        if (!result.success) {
          card.classList.remove('card-removing');
          showToast('⚠️ ' + result.error, 'error');
          return;
        }
        renderLibrary();
        showToast(`"${result.data}" removed from library`, 'info');
        if (typeof AIAssistant !== 'undefined') AIAssistant.onLibraryChange();
      }, 280);
    }
  }, CONFIG.TIMING.BUTTON_THROTTLE);

  const _handleToggleRead = Utils.throttle((id) => {
    const result = Books.toggleRead(id);
    if (!result.success) { showToast('⚠️ ' + result.error, 'error'); return; }
    renderLibrary();
    const msg = result.data.read ? `"${result.data.title}" marked as read! 📖` : `Marked as unread`;
    showToast(msg, result.data.read ? 'success' : 'info');
    if (typeof AIAssistant !== 'undefined') AIAssistant.onLibraryChange();
  }, CONFIG.TIMING.BUTTON_THROTTLE);

  function _handleUpdatePages(id, rawVal) {
    const wasRead = Books.getById(id)?.data?.read ?? false;
    const result  = Books.updateProgress(id, rawVal);
    if (!result.success) return;

    const { book, pct } = result.data;
    _patchCardProgress(book.id, book.pagesRead, book.totalPages, pct, book.read);
    _renderStatsBar();

    if (book.read && !wasRead) {
      setTimeout(() => {
        if (typeof AIAssistant !== 'undefined') AIAssistant.celebrateCompletion(book.title);
        _renderStatsBar();
      }, 350);
    }

    if (typeof AIAssistant !== 'undefined') AIAssistant.onLibraryChange();
  }

  function _handleSaveGoal() {
    const raw = _dom.gTarget?.value ?? '';
    const v   = parseInt(raw, 10);
    if (!v || v < 1 || v > 999) {
      showToast('Enter a valid goal between 1 and 999', 'error');
      return;
    }
    _settings.monthlyGoal = v;
    Store.saveSettings(_settings);
    closeGoalModal();
    _renderDashboard();
    showToast(`🎯 Monthly goal set: ${v} books!`, 'success');
  }

  // ── LIVE CARD PATCH ────────────────────────────────────────────────────────

  function _patchCardProgress(id, pagesRead, totalPages, pct, isRead) {
    const fill      = $('fill_'      + id);
    const label     = $('plabel_'    + id);
    const badge     = $('badge_'     + id);
    const toggleBtn = $('toggleBtn_' + id);
    const pctLabel  = $('pct_'       + id);
    const ring      = $('ring_'      + id);

    if (fill) {
      fill.style.width = pct + '%';
      fill.className = `progress-fill ${isRead ? 'progress-read' : 'progress-active'}`;
    }
    if (label) label.textContent = `${Utils.fmt(pagesRead)} / ${Utils.fmt(totalPages)} pages`;
    if (pctLabel) pctLabel.textContent = pct + '%';
    if (ring) {
      const r = 18;
      const circ = 2 * Math.PI * r;
      ring.style.strokeDashoffset = circ * (1 - pct / 100);
      ring.style.stroke = isRead ? 'var(--clr-emerald)' : 'var(--clr-amber)';
    }
    if (badge) {
      badge.textContent = isRead ? 'Read' : pagesRead > 0 ? 'Reading' : 'Unread';
      badge.className = `status-badge ${isRead ? 'status-read' : pagesRead > 0 ? 'status-progress' : 'status-unread'}`;
    }
    if (toggleBtn) {
      toggleBtn.textContent = isRead ? '↩ Unread' : '✓ Mark Read';
      toggleBtn.className = `btn-toggle ${isRead ? 'btn-mark-unread' : 'btn-mark-read'}`;
    }
  }

  // ── STATS BAR ──────────────────────────────────────────────────────────────

  function _renderStatsBar() {
    if (!_dom.statsBar) return;
    const m = Books.getMetrics();
    const xpTotal = m.readCount * 100 + Math.floor(m.totalPagesRead / 10);

    _dom.statsBar.innerHTML = `
      <div class="stat-pill">
        <span class="stat-pill-icon">📚</span>
        <span class="stat-pill-val">${m.total}</span>
        <span class="stat-pill-label">Total</span>
      </div>
      <div class="stat-pill stat-pill--read">
        <span class="stat-pill-icon">✓</span>
        <span class="stat-pill-val">${m.readCount}</span>
        <span class="stat-pill-label">Read</span>
      </div>
      <div class="stat-pill stat-pill--progress">
        <span class="stat-pill-icon">⚡</span>
        <span class="stat-pill-val">${m.inProgressCount}</span>
        <span class="stat-pill-label">In Progress</span>
      </div>
      <div class="stat-pill stat-pill--pages">
        <span class="stat-pill-icon">📄</span>
        <span class="stat-pill-val">${Utils.fmt(m.totalPagesRead)}</span>
        <span class="stat-pill-label">Pages</span>
      </div>
      <div class="stat-pill stat-pill--xp">
        <span class="stat-pill-icon">✨</span>
        <span class="stat-pill-val">${Utils.fmt(xpTotal)}</span>
        <span class="stat-pill-label">XP</span>
      </div>`;
  }

  // ── LIBRARY GRID ───────────────────────────────────────────────────────────

  function renderLibrary() {
    _renderStatsBar();
    const filtered = Books.getFiltered(_currentFilter, _searchQuery);
    const grid = _dom.booksGrid;
    if (!grid) return;

    // Update filter counts
    _updateFilterCounts();

    if (filtered.length === 0) {
      const allBooks = Books.getAll();
      const isEmpty  = allBooks.length === 0;
      const isSearch = _searchQuery.trim().length > 0;
      grid.innerHTML = _renderEmptyState(isEmpty, isSearch);
      return;
    }

    grid.innerHTML = filtered.map((b, i) => _renderBookCard(b, i)).join('');
  }

  function _updateFilterCounts() {
    const all = Books.getAll();
    const counts = {
      all:        all.length,
      read:       all.filter(b => b.read).length,
      unread:     all.filter(b => !b.read && b.pagesRead === 0).length,
      inprogress: all.filter(b => !b.read && b.pagesRead > 0).length,
    };
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const count = counts[btn.dataset.filter];
      const countEl = btn.querySelector('.filter-count');
      if (countEl) countEl.textContent = count;
    });
  }

  function _renderEmptyState(isEmpty, isSearch) {
    if (isEmpty) {
      return `
        <div class="empty-state">
          <div class="empty-hero">
            <div class="empty-shelves">
              <div class="empty-shelf"></div>
              <div class="empty-shelf"></div>
              <div class="empty-shelf"></div>
            </div>
          </div>
          <h3>Your library awaits</h3>
          <p>Every great collection starts with a single book.<br>Add your first one to begin your journey.</p>
          <button class="empty-cta" onclick="UI.openModal()">
            <span>＋</span> Add Your First Book
          </button>
        </div>`;
    }
    if (isSearch) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>No books match "<strong>${Utils.escHtml(_searchQuery)}</strong>".<br>Try searching by title, author, or genre.</p>
          <button class="empty-cta" onclick="UI.clearSearch()">Clear Search</button>
        </div>`;
    }
    return `
      <div class="empty-state">
        <div class="empty-icon">🗂️</div>
        <h3>Nothing here yet</h3>
        <p>No books in this category. Try a different filter.</p>
      </div>`;
  }

  function clearSearch() {
    if (_dom.searchInput) _dom.searchInput.value = '';
    _searchQuery = '';
    _updateSearchClear();
    renderLibrary();
  }

  function _updateSearchClear() {
    if (_dom.searchClear) {
      _dom.searchClear.style.opacity = _searchQuery ? '1' : '0';
      _dom.searchClear.style.pointerEvents = _searchQuery ? 'all' : 'none';
    }
  }

  function _renderBookCard(b, i) {
    const pct = b.totalPages > 0 ? Math.round((b.pagesRead / b.totalPages) * 100) : 0;
    const r = 18;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const statusClass = b.read ? 'status-read' : b.pagesRead > 0 ? 'status-progress' : 'status-unread';
    const statusText  = b.read ? 'Read' : b.pagesRead > 0 ? 'Reading' : 'Unread';
    const strokeColor = b.read ? 'var(--clr-emerald)' : 'var(--clr-amber)';

    return `
      <div class="book-card" style="--stagger:${i}" data-id="${Utils.escHtml(b.id)}" role="article" aria-label="${Utils.escHtml(b.title)} by ${Utils.escHtml(b.author)}">
        <div class="card-accent accent-${b.color}"></div>

        <div class="card-inner">
          <div class="card-header">
            <div class="card-title-block">
              <div class="book-title">${Utils.escHtml(b.title)}</div>
              <div class="book-author">by ${Utils.escHtml(b.author)}</div>
            </div>
            <span class="status-badge ${statusClass}" id="badge_${b.id}">${statusText}</span>
          </div>

          <div class="card-meta">
            <span class="genre-tag">${Utils.escHtml(b.genre)}</span>
            ${b.rating ? `<span class="rating-stars" aria-label="${b.rating} out of 5 stars">${Utils.renderStars(b.rating)}</span>` : ''}
            ${b.dateRead ? `<span class="date-read">📅 ${b.dateRead}</span>` : ''}
          </div>

          <div class="progress-section">
            <div class="progress-ring-wrap" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--clr-border)" stroke-width="4"/>
                <circle cx="22" cy="22" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="4"
                        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                        id="ring_${b.id}" style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset 0.6s ease"/>
              </svg>
              <span class="ring-label" id="pct_${b.id}">${pct}%</span>
            </div>
            <div class="progress-info">
              <div class="progress-bar-wrap">
                <div class="progress-track">
                  <div class="progress-fill ${b.read ? 'progress-read' : 'progress-active'}" id="fill_${b.id}" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="progress-label" id="plabel_${b.id}">${Utils.fmt(b.pagesRead)} / ${Utils.fmt(b.totalPages)} pages</div>
              <div class="pages-input-row">
                <input type="number"
                       id="pInput_${b.id}"
                       value="${b.pagesRead}"
                       min="0"
                       max="${b.totalPages}"
                       aria-label="Pages read for ${Utils.escHtml(b.title)}"
                       data-book-id="${b.id}"
                       class="pages-input"
                       placeholder="Pages read">
              </div>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-toggle ${b.read ? 'btn-mark-unread' : 'btn-mark-read'}"
                  id="toggleBtn_${b.id}"
                  data-id="${b.id}"
                  aria-label="${b.read ? 'Mark as unread' : 'Mark as read'}">
            ${b.read ? '↩ Unread' : '✓ Mark Read'}
          </button>
          <button class="btn-delete" data-id="${b.id}" aria-label="Delete ${Utils.escHtml(b.title)}" title="Delete book">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────

  function _renderDashboard() {
    const books       = Books.getAll();
    const metrics     = Books.getMetrics();
    const thisMonth   = Analytics.getBooksThisMonth(books);
    const streak      = Analytics.getReadingStreak(books);
    const monthlyRead = thisMonth.length;

    _renderKPIs(metrics, streak, monthlyRead);
    _renderGoalCard(monthlyRead);
    _renderBadges(metrics, streak, monthlyRead);
    _renderInsights(books, metrics, streak, monthlyRead);
    _renderGenreAnalytics(metrics);
  }

  function _renderKPIs(metrics, streak, monthlyRead) {
    if (!_dom.kpiGrid) return;
    const kpis = [
      { icon: '📚', value: metrics.total,              label: 'Total Books',     sub: `${metrics.readCount} completed`,            color: 'amber'  },
      { icon: '🗓️', value: monthlyRead,                 label: 'This Month',      sub: _settings.monthlyGoal ? `Goal: ${_settings.monthlyGoal}` : 'Set a goal →', color: 'emerald' },
      { icon: '📄', value: Utils.fmt(metrics.totalPagesRead), label: 'Pages Read', sub: metrics.totalPagesRead > 0 ? `~${Math.round(metrics.totalPagesRead/350)} avg books` : '—', color: 'blue' },
      { icon: '🔥', value: streak,                     label: 'Day Streak',      sub: streak > 1 ? 'Keep going!' : 'Start today!', color: 'red'    },
      { icon: '⭐', value: metrics.avgRating ? `${metrics.avgRating}★` : '—', label: 'Avg Rating', sub: metrics.avgRating ? `from ${metrics.ratedCount} rated` : 'Rate your books', color: 'purple' },
    ];
    _dom.kpiGrid.innerHTML = kpis.map((k, i) => `
      <div class="kpi-card kpi-${k.color}" style="--stagger:${i}">
        <div class="kpi-glow"></div>
        <div class="kpi-icon">${k.icon}</div>
        <div class="kpi-value">${Utils.escHtml(String(k.value))}</div>
        <div class="kpi-label">${k.label}</div>
        ${k.sub ? `<div class="kpi-sub">${Utils.escHtml(k.sub)}</div>` : ''}
      </div>`).join('');
  }

  function _renderGoalCard(monthlyRead) {
    if (!_dom.goalCard) return;
    const goal = _settings.monthlyGoal;

    if (!goal) {
      _dom.goalCard.innerHTML = `
        <div class="goal-empty">
          <div class="goal-empty-icon">🎯</div>
          <p>No monthly goal set yet.</p>
          <p class="goal-empty-sub">Set a goal to track your progress and earn the Goal Crusher badge.</p>
          <button type="button" onclick="UI.openGoalModal()">Set Monthly Goal</button>
        </div>`;
      return;
    }

    const pct    = Math.min(100, Math.round((monthlyRead / goal) * 100));
    const circumf = 2 * Math.PI * 54;
    const offset  = circumf * (1 - pct / 100);
    const left    = Math.max(0, goal - monthlyRead);

    _dom.goalCard.innerHTML = `
      <div class="goal-display">
        <div class="goal-circle-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-label="${pct}% of monthly reading goal">
            <circle class="goal-circle-bg" cx="65" cy="65" r="54"/>
            <circle class="goal-circle-track" cx="65" cy="65" r="54"/>
            <circle class="goal-circle-fill ${pct >= 100 ? 'complete' : ''}"
                    cx="65" cy="65" r="54" id="goalCircle"
                    style="stroke-dasharray:${circumf};stroke-dashoffset:${circumf}"/>
          </svg>
          <div class="goal-circle-text">
            <span class="goal-pct">${pct}%</span>
            <span class="goal-pct-label">done</span>
          </div>
        </div>
        <div class="goal-info">
          <h3>${pct >= 100 ? '🏆 Goal Achieved!' : '📖 In Progress'}</h3>
          <div class="goal-numbers">
            <span class="goal-count">${monthlyRead}</span>
            <span class="goal-divider">/</span>
            <span class="goal-total">${goal}</span>
            <span class="goal-unit">books</span>
          </div>
          <p class="goal-msg">${
            pct >= 100 ? 'Amazing! Consider raising the bar next month.' :
            left === 1 ? 'Just one more book to go!' :
            `${left} more book${left !== 1 ? 's' : ''} to hit your target.`
          }</p>
        </div>
      </div>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const circle = $('goalCircle');
      if (circle) circle.style.strokeDashoffset = offset;
    }));
  }

  function _renderBadges(metrics, streak, monthlyRead) {
    if (!_dom.badgesGrid) return;
    const badges = Analytics.computeBadges(metrics, _settings, streak, monthlyRead);
    _dom.badgesGrid.innerHTML = badges.map((b, i) => `
      <div class="badge-item ${b.earned ? 'badge-earned' : 'badge-locked'}"
           style="--stagger:${i}"
           title="${b.earned ? '✅ Earned!' : '🔒 Keep reading to unlock'}">
        <div class="badge-icon">${b.emoji}</div>
        <div class="badge-label">${b.label}</div>
        ${b.earned ? '<div class="badge-glow"></div>' : ''}
      </div>`).join('');
  }

  function _renderInsights(books, metrics, streak, monthlyRead) {
    if (!_dom.insightsList) return;
    const insights = Analytics.buildInsights(books, metrics, _settings, streak, monthlyRead);
    if (!insights) {
      _dom.insightsList.innerHTML = `
        <div class="insight-empty">
          <div class="insight-empty-icon">🧠</div>
          <p>Add and read some books to unlock AI-powered insights about your reading habits.</p>
        </div>`;
      return;
    }
    _dom.insightsList.innerHTML = insights.map((ins, i) => `
      <div class="insight-card" style="--stagger:${i}">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-body">
          <div class="insight-title">${Utils.escHtml(ins.title)}</div>
          <div class="insight-text">${Utils.escHtml(ins.text)}</div>
        </div>
      </div>`).join('');
  }

  function _renderGenreAnalytics(metrics) {
    const genreStats = Analytics.buildGenreStats(metrics.genreCounts);
    const topRead    = Object.keys(metrics.readGenreCounts)
      .sort((a, b) => metrics.readGenreCounts[b] - metrics.readGenreCounts[a])[0] ?? null;
    const rec = Analytics.getRecommendedGenre(metrics.readGenreCounts);

    if (!genreStats.length) {
      if (_dom.genreStats) _dom.genreStats.innerHTML = '<p class="no-data-msg">Add books to see genre analytics.</p>';
      if (_genreChart) { _genreChart.destroy(); _genreChart = null; }
      return;
    }

    if (_dom.genreStats) {
      const topGenre = genreStats[0];
      _dom.genreStats.innerHTML = `
        <div class="genre-bars">
          ${genreStats.map((g, i) => `
            <div class="genre-row" style="--stagger:${i}">
              <div class="genre-dot" style="background:${g.color}"></div>
              <div class="genre-name">${Utils.escHtml(g.label)}</div>
              <div class="genre-bar-track">
                <div class="genre-bar-fill" data-target="${g.pct}" style="width:0%;background:${g.color}"></div>
              </div>
              <div class="genre-count">${g.count}</div>
            </div>`).join('')}
        </div>
        <div class="genre-summary-cards">
          <div class="genre-summary-card">
            <div class="genre-summary-label">Most Added</div>
            <div class="genre-summary-value">${Utils.escHtml(topGenre.label)}</div>
            <div class="genre-summary-sub">${topGenre.count} book${topGenre.count > 1 ? 's' : ''}</div>
          </div>
          <div class="genre-summary-card">
            <div class="genre-summary-label">Most Read</div>
            <div class="genre-summary-value">${topRead ? Utils.escHtml(topRead) : '—'}</div>
            <div class="genre-summary-sub">${topRead ? metrics.readGenreCounts[topRead] + ' completed' : 'Finish a book!'}</div>
          </div>
          <div class="genre-summary-card genre-summary-rec">
            <div class="genre-summary-label">✨ Recommended Next</div>
            <div class="genre-summary-value">${Utils.escHtml(rec)}</div>
            <div class="genre-summary-sub">Based on your history</div>
          </div>
        </div>`;

      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelectorAll('.genre-bar-fill[data-target]').forEach(el => {
          el.style.width = el.dataset.target + '%';
        });
      }));
    }

    const ctx = _dom.genreChart;
    if (!ctx) return;
    if (_genreChart) { _genreChart.destroy(); _genreChart = null; }

    _genreChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: genreStats.map(g => g.label),
        datasets: [{
          data:            genreStats.map(g => g.count),
          backgroundColor: genreStats.map(g => g.color),
          borderWidth:     3,
          borderColor:     'var(--clr-surface)',
          hoverOffset:     8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        animation: { duration: 900, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                return ` ${ctx.label}: ${ctx.raw} book${ctx.raw > 1 ? 's' : ''} (${Math.round(ctx.raw / total * 100)}%)`;
              },
            },
            bodyFont: { family: 'Sora' },
            backgroundColor: 'var(--clr-surface-2)',
            titleColor: 'var(--clr-text)',
            bodyColor: 'var(--clr-text-muted)',
            borderColor: 'var(--clr-border)',
            borderWidth: 1, padding: 12,
          },
        },
      },
    });
  }

  // ── EVENT BINDING ─────────────────────────────────────────────────────────

  function _bindEvents() {
    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Filter tabs
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        _currentFilter = this.dataset.filter;
        renderLibrary();
      });
    });

    // Search
    if (_dom.searchInput) {
      _dom.searchInput.addEventListener('input', Utils.debounce(function () {
        _searchQuery = this.value;
        _updateSearchClear();
        renderLibrary();
      }, CONFIG.TIMING.SEARCH_DEBOUNCE));
    }

    if (_dom.searchClear) {
      _dom.searchClear.addEventListener('click', clearSearch);
    }

    // Book grid delegation
    if (_dom.booksGrid) {
      _dom.booksGrid.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) { const id = deleteBtn.dataset.id; if (id) _handleDeleteBook(id); }
        const toggleBtn = e.target.closest('.btn-toggle');
        if (toggleBtn) { const id = toggleBtn.dataset.id; if (id) _handleToggleRead(id); }
      });

      _dom.booksGrid.addEventListener('input', Utils.debounce((e) => {
        if (e.target.classList.contains('pages-input')) {
          const id = e.target.dataset.bookId;
          if (id) _handleUpdatePages(id, e.target.value);
        }
      }, 300));
    }

    // Modal backdrops
    if (_dom.modalOverlay) {
      _dom.modalOverlay.addEventListener('click', (e) => {
        if (e.target === _dom.modalOverlay) closeModal();
      });
    }
    if (_dom.goalModalOverlay) {
      _dom.goalModalOverlay.addEventListener('click', (e) => {
        if (e.target === _dom.goalModalOverlay) closeGoalModal();
      });
    }

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeGoalModal();
        if (typeof AIAssistant !== 'undefined') AIAssistant.closePanel();
      }
      if (e.key === 'Enter') {
        if (_dom.modalOverlay?.classList.contains('open'))     _handleAddBook();
        if (_dom.goalModalOverlay?.classList.contains('open')) _handleSaveGoal();
      }
      // Shortcut: Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        _dom.searchInput?.focus();
      }
    });

    // Storage warning
    if (!Store.isAvailable) {
      showToast('⚠️ Storage unavailable. Data will not persist.', 'error');
    }
  }

  // ── EXPORT / IMPORT ───────────────────────────────────────────────────────

  function exportLibrary() {
    try {
      const json = Store.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `bookmind-backup-${Utils.todayLocalISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Library exported successfully!', 'success');
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error');
    }
  }

  function importLibrary(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Store.importData(e.target.result);
      if (result.success) {
        Books.reload();
        renderLibrary();
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    };
    reader.onerror = () => showToast('Failed to read file.', 'error');
    reader.readAsText(file);
  }

  // ── INIT ──────────────────────────────────────────────────────────────────

  function init() {
    _cacheDom();
    _bindEvents();
    renderLibrary();

    // Stagger animate stats bar on load
    setTimeout(() => document.querySelector('.stats-bar')?.classList.add('loaded'), 100);
  }

  return {
    init, showToast,
    openModal, closeModal,
    openGoalModal, closeGoalModal,
    renderLibrary, clearSearch,
    handleAddBook:  _handleAddBook,
    handleSaveGoal: _handleSaveGoal,
    exportLibrary, importLibrary,
    openAIPanel: () => { if (typeof AIAssistant !== 'undefined') AIAssistant.openPanel(); },
  };

})();