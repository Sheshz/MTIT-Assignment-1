/* ════════════════════════════════════════
   BookMind AI — script.js  (v2 Enhanced)
   ════════════════════════════════════════ */

// ── STATE ──────────────────────────────────────────────────────────────────
let books         = JSON.parse(localStorage.getItem('bookmind_books') || '[]');
let settings      = JSON.parse(localStorage.getItem('bookmind_settings') || '{"monthlyGoal":0}');
let currentFilter = 'all';
let searchQuery   = '';
let genreChartInst = null;

// ── PERSISTENCE ────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('bookmind_books', JSON.stringify(books));
  localStorage.setItem('bookmind_settings', JSON.stringify(settings));
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stars(rating) {
  if (!rating) return '';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════════════════
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
  if (view === 'dashboard') renderDashboard();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ══════════════════════════════════════════════════════════════════════════
//  LIBRARY MODALS
// ══════════════════════════════════════════════════════════════════════════
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fTitle').focus(), 100);
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  ['fTitle','fAuthor','fGenre','fPages','fRating','fDateRead'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
}
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── GOAL MODALS ────────────────────────────────────────────────────────────
function openGoalModal() {
  document.getElementById('gTarget').value = settings.monthlyGoal || '';
  document.getElementById('goalModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('gTarget').focus(), 100);
}
function closeGoalModal() {
  document.getElementById('goalModalOverlay').classList.remove('open');
}
function saveGoal() {
  const v = parseInt(document.getElementById('gTarget').value);
  if (!v || v < 1) { showToast('⚠️ Enter a valid goal'); return; }
  settings.monthlyGoal = v;
  save();
  closeGoalModal();
  renderDashboard();
  showToast('🎯 Goal set: ' + v + ' books this month!');
}
document.getElementById('goalModalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeGoalModal();
});

// ══════════════════════════════════════════════════════════════════════════
//  ADD / DELETE / TOGGLE BOOK
// ══════════════════════════════════════════════════════════════════════════
function addBook() {
  const title  = document.getElementById('fTitle').value.trim();
  const author = document.getElementById('fAuthor').value.trim();
  const genre  = document.getElementById('fGenre').value;
  const pages  = parseInt(document.getElementById('fPages').value);
  const rating = parseInt(document.getElementById('fRating').value) || null;
  const dateRead = document.getElementById('fDateRead').value || null;

  if (!title || !author)   { showToast('⚠️ Please enter title and author'); return; }
  if (!pages || pages < 1) { showToast('⚠️ Enter a valid page count');      return; }

  const book = {
    id: Date.now().toString(),
    title, author,
    genre:      genre || 'Uncategorized',
    totalPages: pages,
    pagesRead:  dateRead ? pages : 0,
    read:       !!dateRead,
    rating,
    dateRead,
    addedAt:    new Date().toISOString(),
    color:      Math.floor(Math.random() * 6)
  };

  books.unshift(book);
  save();
  closeModal();
  render();
  showToast('📖 Book added to your library!');
}

function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  save();
  render();
  showToast('🗑️ Book removed');
}

function toggleRead(id) {
  const b = books.find(b => b.id === id);
  if (!b) return;
  b.read = !b.read;
  if (b.read) {
    b.pagesRead = b.totalPages;
    if (!b.dateRead) b.dateRead = new Date().toISOString().slice(0,10);
  }
  save();
  render();
  showToast(b.read ? '✅ Marked as read!' : '📖 Marked as unread');
}

// ── UPDATE PAGES (live patch) ──────────────────────────────────────────────
function updatePages(id, val) {
  const b = books.find(b => b.id === id);
  if (!b) return;
  const p = Math.max(0, Math.min(parseInt(val) || 0, b.totalPages));
  b.pagesRead = p;
  if (p === b.totalPages) {
    b.read = true;
    if (!b.dateRead) b.dateRead = new Date().toISOString().slice(0,10);
  }
  save();
  renderStats();

  const pct = b.totalPages > 0 ? (b.pagesRead / b.totalPages * 100) : 0;
  const fill      = document.getElementById('fill_'      + id);
  const label     = document.getElementById('plabel_'    + id);
  const badge     = document.getElementById('badge_'     + id);
  const toggleBtn = document.getElementById('toggleBtn_' + id);
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = `${b.pagesRead} / ${b.totalPages} pages`;
  if (badge) {
    badge.textContent = b.read ? 'Read' : 'Unread';
    badge.className = 'status-badge ' + (b.read ? 'status-read' : 'status-unread');
  }
  if (toggleBtn) {
    toggleBtn.textContent = b.read ? '↩ Mark Unread' : '✓ Mark Read';
    toggleBtn.className = 'btn-toggle ' + (b.read ? 'btn-mark-unread' : 'btn-mark-read');
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  ANALYTICS HELPERS
// ══════════════════════════════════════════════════════════════════════════
function getGenreCounts() {
  const counts = {};
  books.forEach(b => { counts[b.genre] = (counts[b.genre] || 0) + 1; });
  return counts;
}

function getReadGenreCounts() {
  const counts = {};
  books.filter(b => b.read).forEach(b => { counts[b.genre] = (counts[b.genre] || 0) + 1; });
  return counts;
}

function getBooksThisMonth() {
  const now = new Date();
  return books.filter(b => {
    if (!b.dateRead) return false;
    const d = new Date(b.dateRead);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function getReadingStreak() {
  // Count unique dates with a book finished, consecutive days ending today
  const readDates = new Set(
    books.filter(b => b.dateRead).map(b => b.dateRead.slice(0,10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if (readDates.has(key)) streak++;
    else if (i > 0) break; // allow today to be missing (might finish later)
  }
  return streak;
}

function getAvgRating() {
  const rated = books.filter(b => b.rating);
  if (!rated.length) return null;
  const avg = rated.reduce((s,b) => s + b.rating, 0) / rated.length;
  return avg.toFixed(1);
}

function getRecommendedGenre(readCounts) {
  const allGenres = ['Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller','Biography','History','Self-Help','Romance','Horror','Poetry','Other'];
  const topRead   = Object.keys(readCounts).sort((a,b) => readCounts[b]-readCounts[a]);
  const suggestions = {
    'Mystery':        'Thriller',
    'Thriller':       'Mystery',
    'Fiction':        'Science Fiction',
    'Science Fiction':'Fantasy',
    'Fantasy':        'Fiction',
    'Biography':      'History',
    'History':        'Biography',
    'Self-Help':      'Biography',
    'Romance':        'Fiction',
    'Horror':         'Thriller',
    'Poetry':         'Fiction',
    'Non-Fiction':    'Self-Help',
    'Other':          'Fiction',
  };
  if (topRead.length) {
    const top = topRead[0];
    const rec = suggestions[top] || allGenres.find(g => !readCounts[g]) || 'Fantasy';
    return rec;
  }
  return 'Fiction';
}

// ══════════════════════════════════════════════════════════════════════════
//  AI INSIGHTS (simulated)
// ══════════════════════════════════════════════════════════════════════════
function buildInsights() {
  const insights = [];
  const readBooks    = books.filter(b => b.read);
  const totalBooks   = books.length;
  const readCounts   = getReadGenreCounts();
  const topGenres    = Object.keys(readCounts).sort((a,b) => readCounts[b]-readCounts[a]);
  const monthlyRead  = getBooksThisMonth().length;
  const goal         = settings.monthlyGoal;
  const avgRating    = getAvgRating();
  const streak       = getReadingStreak();
  const totalRead    = readBooks.length;

  // Goal progress
  if (goal > 0) {
    const pct = Math.round((monthlyRead / goal) * 100);
    insights.push({
      icon: '🎯',
      title: `You're ${Math.min(pct, 100)}% to your monthly goal!`,
      text: `${monthlyRead} of ${goal} books read this month. ${pct >= 100 ? "Goal crushed! 🏆" : pct >= 50 ? "Keep it up!" : "You've got this!"}`
    });
  }

  // Top genre
  if (topGenres.length) {
    const top = topGenres[0];
    insights.push({
      icon: '🔥',
      title: `You devour ${top} books`,
      text: `${top} is your most-read genre with ${readCounts[top]} book${readCounts[top]>1?'s':''}. You clearly love it!`
    });
  }

  // Recommended genre
  if (topGenres.length) {
    const rec = getRecommendedGenre(readCounts);
    insights.push({
      icon: '✨',
      title: `Try ${rec} next`,
      text: `Based on your reading history, ${rec} readers often enjoy ${rec === topGenres[0] ? 'going even deeper' : `stories similar to your favourite ${topGenres[0]} picks`}.`
    });
  }

  // Rating insight
  if (avgRating) {
    insights.push({
      icon: '⭐',
      title: `Your average rating is ${avgRating}/5`,
      text: avgRating >= 4
        ? "You have high standards — and great taste."
        : avgRating >= 3
        ? "You're balanced in your reviews. Honest!"
        : "Tough critic! Keep seeking your perfect read."
    });
  }

  // Streak
  if (streak > 1) {
    insights.push({
      icon: '🔆',
      title: `${streak}-day reading streak!`,
      text: `You've been on a roll. Don't break the chain!`
    });
  }

  // Pages insight
  const totalPages = books.reduce((s,b) => s + b.pagesRead, 0);
  if (totalPages > 0) {
    insights.push({
      icon: '📄',
      title: `${totalPages.toLocaleString()} pages read total`,
      text: totalPages > 5000
        ? "That's a mountain of words. Incredible reader!"
        : totalPages > 1000
        ? "Your reading muscle is growing every day."
        : "Every page counts. You're building a great habit."
    });
  }

  // Unread pile
  const unread = books.filter(b => !b.read && b.pagesRead === 0).length;
  if (unread > 3) {
    insights.push({
      icon: '📚',
      title: `${unread} books waiting to be read`,
      text: `Your TBR pile is tempting. Pick up the shortest one to build momentum!`
    });
  }

  if (!insights.length) {
    return null;
  }
  return insights.slice(0, 5);
}

// ══════════════════════════════════════════════════════════════════════════
//  RENDER: STATS BAR
// ══════════════════════════════════════════════════════════════════════════
function renderStats() {
  const total     = books.length;
  const readCount = books.filter(b => b.read).length;
  const readPages = books.reduce((s,b) => s + b.pagesRead, 0);
  document.getElementById('statsBar').innerHTML = `
    <div class="stat"><span class="stat-dot" style="background:#d4883a"></span><span class="stat-val">${total}</span>&nbsp;Total Books</div>
    <div class="stat"><span class="stat-dot" style="background:#6b7c5c"></span><span class="stat-val">${readCount}</span>&nbsp;Read</div>
    <div class="stat"><span class="stat-dot" style="background:#8a6aaa"></span><span class="stat-val">${total - readCount}</span>&nbsp;Unread</div>
    <div class="stat"><span class="stat-dot" style="background:#5c7a8a"></span><span class="stat-val">${readPages.toLocaleString()}</span>&nbsp;Pages Read</div>
  `;
}

// ══════════════════════════════════════════════════════════════════════════
//  RENDER: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function renderDashboard() {
  renderKPIs();
  renderGoalCard();
  renderBadges();
  renderInsights();
  renderGenreAnalytics();
}

// ── KPI CARDS ──────────────────────────────────────────────────────────────
function renderKPIs() {
  const totalBooks   = books.length;
  const readBooks    = books.filter(b => b.read);
  const thisMonth    = getBooksThisMonth();
  const totalPages   = books.reduce((s,b) => s + b.pagesRead, 0);
  const streak       = getReadingStreak();
  const avgRating    = getAvgRating();

  const kpis = [
    { icon:'📚', value: totalBooks,              label:'Total Books',        sub: `${readBooks.length} completed`,           color:'kpi-amber'  },
    { icon:'🗓️', value: thisMonth.length,         label:'Read This Month',    sub: settings.monthlyGoal ? `Goal: ${settings.monthlyGoal}` : 'Set a goal →', color:'kpi-sage'   },
    { icon:'📄', value: totalPages.toLocaleString(), label:'Pages Read',      sub: totalPages > 0 ? `~${Math.round(totalPages/350)} avg books` : '—', color:'kpi-blue' },
    { icon:'🔥', value: streak || 0,              label:'Day Streak',         sub: streak > 1 ? 'Keep it going!' : 'Start today!', color:'kpi-red'    },
    { icon:'⭐', value: avgRating ? `${avgRating}★` : '—', label:'Avg Rating', sub: avgRating ? `from ${books.filter(b=>b.rating).length} rated` : 'Rate your books', color:'kpi-purple' },
  ];

  document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
    <div class="kpi-card ${k.color}">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-value">${escHtml(String(k.value))}</div>
      <div class="kpi-label">${k.label}</div>
      ${k.sub ? `<div class="kpi-sub">${escHtml(k.sub)}</div>` : ''}
    </div>
  `).join('');
}

// ── GOAL CARD ──────────────────────────────────────────────────────────────
function renderGoalCard() {
  const el   = document.getElementById('goalCard');
  const goal = settings.monthlyGoal;
  const done = getBooksThisMonth().length;

  if (!goal) {
    el.innerHTML = `
      <div class="goal-empty">
        <p>No monthly goal set yet.</p>
        <button onclick="openGoalModal()">🎯 Set a Goal</button>
      </div>`;
    return;
  }

  const pct      = Math.min(100, Math.round((done / goal) * 100));
  const circumf  = 2 * Math.PI * 54; // r=54
  const offset   = circumf * (1 - pct / 100);

  el.innerHTML = `
    <div class="goal-display">
      <div class="goal-circle-wrap">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle class="goal-circle-bg"   cx="65" cy="65" r="54"/>
          <circle class="goal-circle-fill ${pct>=100?'complete':''}"
                  cx="65" cy="65" r="54"
                  id="goalCircle"
                  style="stroke-dasharray:${circumf};stroke-dashoffset:${circumf}"/>
        </svg>
        <div class="goal-circle-text">
          <span class="goal-pct">${pct}%</span>
          <span class="goal-pct-label">done</span>
        </div>
      </div>
      <div class="goal-info">
        <h3>${pct >= 100 ? '🏆 Goal Achieved!' : '📖 In Progress'}</h3>
        <p>
          <span class="goal-count">${done}</span> / ${goal} books
          read this month
        </p>
        <p style="margin-top:0.5rem">
          ${pct >= 100
            ? 'Amazing! Consider raising the bar next month.'
            : `${goal - done} more book${goal-done!==1?'s':''} to hit your target.`}
        </p>
      </div>
    </div>`;

  // Animate circle
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const circle = document.getElementById('goalCircle');
      if (circle) circle.style.strokeDashoffset = offset;
    });
  });
}

// ── BADGES ────────────────────────────────────────────────────────────────
function renderBadges() {
  const readCount  = books.filter(b => b.read).length;
  const monthCount = getBooksThisMonth().length;
  const totalPages = books.reduce((s,b) => s + b.pagesRead, 0);
  const streak     = getReadingStreak();
  const genreSet   = new Set(books.filter(b=>b.read).map(b=>b.genre));

  const BADGES = [
    { emoji:'📖', label:'First Book',       earned: readCount >= 1    },
    { emoji:'🔥', label:'5 Books Read',     earned: readCount >= 5    },
    { emoji:'🏆', label:'10 Books Read',    earned: readCount >= 10   },
    { emoji:'📚', label:'50 Books Read',    earned: readCount >= 50   },
    { emoji:'🌟', label:'Goal Crusher',     earned: settings.monthlyGoal > 0 && monthCount >= settings.monthlyGoal },
    { emoji:'🗺️', label:'Genre Explorer',  earned: genreSet.size >= 4 },
    { emoji:'📄', label:'1K Pages',         earned: totalPages >= 1000 },
    { emoji:'💪', label:'10K Pages',        earned: totalPages >= 10000},
    { emoji:'⚡', label:'3-Day Streak',     earned: streak >= 3       },
    { emoji:'🔆', label:'7-Day Streak',     earned: streak >= 7       },
  ];

  document.getElementById('badgesGrid').innerHTML = BADGES.map((b, i) => `
    <div class="badge ${b.earned ? (readCount>=10||totalPages>=1000?'badge-gold':'badge-earned') : 'badge-locked'}"
         style="animation-delay:${i*0.05}s"
         title="${b.earned ? 'Earned!' : 'Locked'}">
      ${b.emoji} ${b.label}
    </div>
  `).join('');
}

// ── AI INSIGHTS ────────────────────────────────────────────────────────────
function renderInsights() {
  const insights = buildInsights();
  const el = document.getElementById('insightsList');

  if (!insights) {
    el.innerHTML = `<div class="insight-empty">Add and read some books to unlock AI-powered insights about your reading habits! 📖</div>`;
    return;
  }

  el.innerHTML = insights.map((ins, i) => `
    <div class="insight-card" style="animation-delay:${i*0.08}s">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-body">
        <div class="insight-title">${escHtml(ins.title)}</div>
        <div class="insight-text">${escHtml(ins.text)}</div>
      </div>
    </div>
  `).join('');
}

// ── GENRE ANALYTICS ────────────────────────────────────────────────────────
const CHART_COLORS = [
  '#d4883a','#6b7c5c','#7a5c8a','#5c7a8a',
  '#8a5c5c','#5c8a7a','#8a7a5c','#6a5c8a',
];

function renderGenreAnalytics() {
  const genreCounts  = getGenreCounts();
  const readCounts   = getReadGenreCounts();
  const labels = Object.keys(genreCounts).sort((a,b) => genreCounts[b]-genreCounts[a]);
  const data   = labels.map(l => genreCounts[l]);
  const total  = data.reduce((s,v)=>s+v,0);

  if (!total) {
    document.getElementById('genreStats').innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No books yet.</p>';
    if (genreChartInst) { genreChartInst.destroy(); genreChartInst = null; }
    return;
  }

  const topGenre = labels[0];
  const topRead  = Object.keys(readCounts).sort((a,b)=>readCounts[b]-readCounts[a])[0];
  const rec      = getRecommendedGenre(readCounts);

  // Summary cards
  document.getElementById('genreStats').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.6rem;">
      ${labels.map((label, i) => `
        <div class="genre-stat-row" style="animation-delay:${i*0.04}s">
          <div class="genre-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></div>
          <div class="genre-name">${escHtml(label)}</div>
          <div class="genre-bar-track">
            <div class="genre-bar-fill"
                 style="width:${(genreCounts[label]/total*100).toFixed(1)}%;background:${CHART_COLORS[i%CHART_COLORS.length]}"></div>
          </div>
          <div class="genre-count">${genreCounts[label]}</div>
        </div>
      `).join('')}
    </div>
    <div class="genre-summary-cards">
      <div class="genre-summary-card">
        <div class="genre-summary-label">Most Added</div>
        <div class="genre-summary-value">${escHtml(topGenre)}</div>
        <div class="genre-summary-sub">${genreCounts[topGenre]} book${genreCounts[topGenre]>1?'s':''}</div>
      </div>
      <div class="genre-summary-card">
        <div class="genre-summary-label">Most Read</div>
        <div class="genre-summary-value">${topRead ? escHtml(topRead) : '—'}</div>
        <div class="genre-summary-sub">${topRead ? readCounts[topRead]+' completed' : 'Finish a book!'}</div>
      </div>
      <div class="genre-summary-card" style="grid-column:1/-1">
        <div class="genre-summary-label">✨ Recommended Next</div>
        <div class="genre-summary-value">${escHtml(rec)}</div>
        <div class="genre-summary-sub">Based on your reading history</div>
      </div>
    </div>
  `;

  // Animate bars after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.genre-bar-fill').forEach(el => {
        const target = el.style.width;
        el.style.width = '0';
        requestAnimationFrame(() => { el.style.width = target; });
      });
    });
  });

  // Chart.js doughnut
  const ctx = document.getElementById('genreChart');
  if (!ctx) return;
  if (genreChartInst) genreChartInst.destroy();

  genreChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_,i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 3,
        borderColor: '#fffdf9',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} book${ctx.raw>1?'s':''} (${Math.round(ctx.raw/total*100)}%)`
          },
          bodyFont: { family: 'DM Sans' },
          backgroundColor: '#3d2314',
          titleColor: '#faf6f0',
          bodyColor: '#f0e8d8',
          borderColor: 'rgba(212,136,58,0.3)',
          borderWidth: 1,
          padding: 10,
        }
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  RENDER: LIBRARY
// ══════════════════════════════════════════════════════════════════════════
function getFiltered() {
  return books.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || b.title.toLowerCase().includes(q)
      || b.author.toLowerCase().includes(q);
    const matchFilter =
      currentFilter === 'all'        ? true :
      currentFilter === 'read'       ? b.read :
      currentFilter === 'unread'     ? (!b.read && b.pagesRead === 0) :
      currentFilter === 'inprogress' ? (!b.read && b.pagesRead > 0) : true;
    return matchSearch && matchFilter;
  });
}

function render() {
  renderStats();
  const filtered = getFiltered();
  const grid = document.getElementById('booksGrid');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>${searchQuery ? 'No books found' : 'Your library is empty'}</h3>
        <p>${searchQuery ? 'Try a different search term.' : 'Add your first book to get started!'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((b, i) => {
    const pct = b.totalPages > 0 ? (b.pagesRead / b.totalPages * 100) : 0;
    return `
      <div class="book-card" style="animation-delay:${i * 0.04}s">
        <div class="card-spine spine-${b.color}"></div>
        <div class="card-body">
          <div class="card-header">
            <div class="book-title">${escHtml(b.title)}</div>
            <span class="status-badge ${b.read ? 'status-read' : 'status-unread'}"
                  id="badge_${b.id}">${b.read ? 'Read' : 'Unread'}</span>
          </div>
          <div class="book-author">by ${escHtml(b.author)}</div>
          <span class="book-genre">${escHtml(b.genre)}</span>
          ${b.rating ? `<div class="book-rating">${stars(b.rating)}</div>` : ''}

          <div class="progress-section">
            <div class="progress-labels">
              <span id="plabel_${b.id}">${b.pagesRead} / ${b.totalPages} pages</span>
              <strong>${Math.round(pct)}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${b.read ? 'progress-read' : 'progress-unread'}"
                   id="fill_${b.id}" style="width:${pct}%"></div>
            </div>
          </div>

          <div class="pages-input-row">
            <label>Pages read:</label>
            <input type="number" value="${b.pagesRead}" min="0" max="${b.totalPages}"
                   oninput="updatePages('${b.id}', this.value)">
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-toggle ${b.read ? 'btn-mark-unread' : 'btn-mark-read'}"
                  id="toggleBtn_${b.id}" onclick="toggleRead('${b.id}')">
            ${b.read ? '↩ Mark Unread' : '✓ Mark Read'}
          </button>
          <button class="btn-delete" onclick="deleteBook('${b.id}')" title="Delete">🗑</button>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════════════

// Filter tabs
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    render();
  });
});

// Search
document.getElementById('searchInput').addEventListener('input', function() {
  searchQuery = this.value;
  render();
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeGoalModal(); }
  if (e.key === 'Enter') {
    if (document.getElementById('modalOverlay').classList.contains('open'))     addBook();
    if (document.getElementById('goalModalOverlay').classList.contains('open')) saveGoal();
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════════════
render();