/**
 * BookMind AI — bundle.js
 * Self-contained bundle. No external dependencies required.
 */
(function(global) {
'use strict';

// ── Minimal Chart.js compatible wrapper (Doughnut only) ──────────────────────
// Replaces Chart.js CDN dependency with a lightweight SVG-based donut chart
class Chart {
  constructor(canvas, config) {
    this._canvas = canvas;
    this._config = config;
    this._render();
  }
  destroy() {
    if (this._canvas) {
      const parent = this._canvas.parentNode;
      if (parent) {
        const existing = parent.querySelector('.bm-chart-svg');
        if (existing) existing.remove();
      }
    }
  }
  _render() {
    const canvas = this._canvas;
    if (!canvas) return;
    const parent = canvas.parentNode;
    canvas.style.display = 'none';

    const existing = parent.querySelector('.bm-chart-svg');
    if (existing) existing.remove();

    const { labels, datasets } = this._config.data;
    const data   = datasets[0].data;
    const colors = datasets[0].backgroundColor;
    const total  = data.reduce((s, v) => s + v, 0);
    if (total === 0) return;

    const size   = 220;
    const cx     = size / 2;
    const cy     = size / 2;
    const r      = 80;
    const innerR = r * 0.62;
    const hoverR = r + 6;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.classList.add('bm-chart-svg');
    svg.style.cssText = 'display:block;overflow:visible;';

    // Tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'position:absolute;background:var(--clr-surface-2);border:1px solid var(--clr-border);color:var(--clr-text);font-size:0.78rem;font-family:var(--font-display);padding:0.4rem 0.75rem;border-radius:8px;pointer-events:none;opacity:0;transition:opacity 0.15s;white-space:nowrap;z-index:10;';
    parent.style.position = 'relative';
    parent.appendChild(tooltip);

    let startAngle = -Math.PI / 2;
    const slices = [];

    data.forEach((val, i) => {
      if (val === 0) return;
      const pct        = val / total;
      const angle      = pct * 2 * Math.PI;
      const endAngle   = startAngle + angle;
      const midAngle   = startAngle + angle / 2;
      const large      = angle > Math.PI ? 1 : 0;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const d = [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', colors[i]);
      path.setAttribute('stroke', 'var(--clr-surface)');
      path.setAttribute('stroke-width', '2');
      path.style.cssText = 'cursor:pointer;transition:transform 0.2s,filter 0.2s;transform-origin:center;';

      path.addEventListener('mouseenter', (e) => {
        path.style.filter = 'brightness(1.15)';
        path.style.transform = `translate(${Math.cos(midAngle)*5}px,${Math.sin(midAngle)*5}px)`;
        tooltip.textContent = ` ${labels[i]}: ${val} book${val !== 1 ? 's' : ''} (${Math.round(pct * 100)}%)`;
        tooltip.style.opacity = '1';
      });
      path.addEventListener('mousemove', (e) => {
        const rect = parent.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top  = (e.clientY - rect.top - 30) + 'px';
      });
      path.addEventListener('mouseleave', () => {
        path.style.filter = '';
        path.style.transform = '';
        tooltip.style.opacity = '0';
      });

      // Animate in
      path.style.opacity = '0';
      setTimeout(() => { path.style.transition = 'opacity 0.4s, transform 0.2s, filter 0.2s'; path.style.opacity = '1'; }, i * 60);

      svg.appendChild(path);
      slices.push({ startAngle, endAngle, midAngle, i });
      startAngle = endAngle;
    });

    parent.insertBefore(svg, canvas);
  }
}

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — config.js                                ║
 * ║  Central configuration & constants                      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const CONFIG = Object.freeze({
  STORAGE: {
    BOOKS:    'bookmind_v3_books',
    SETTINGS: 'bookmind_v3_settings',
    STREAK:   'bookmind_v3_streak',
  },
  LIMITS: {
    TITLE_MAX:   300,
    AUTHOR_MAX:  200,
    PAGES_MIN:   1,
    PAGES_MAX:   50_000,
    RATING_MIN:  1,
    RATING_MAX:  5,
    SEARCH_MAX:  200,
  },
  TIMING: {
    TOAST_DURATION:    3000,
    SEARCH_DEBOUNCE:   280,
    BUTTON_THROTTLE:   400,
    ANIMATION_STAGGER: 50,
  },
  STREAK: {
    GRACE_TODAY: true,
    MAX_LOOKBACK_DAYS: 366,
  },
  CHART_COLORS: [
    '#e8975a','#7aad6e','#9b7fc4','#5ba8c4',
    '#c47a7a','#5ab89a','#c4a05a','#7a7ac4',
    '#c47aaa','#5ac4b8',
  ],
  GENRE_SUGGESTIONS: {
    'Mystery':         'Thriller',
    'Thriller':        'Mystery',
    'Fiction':         'Science Fiction',
    'Science Fiction': 'Fantasy',
    'Fantasy':         'Fiction',
    'Biography':       'History',
    'History':         'Biography',
    'Self-Help':       'Biography',
    'Romance':         'Fiction',
    'Horror':          'Thriller',
    'Poetry':          'Fiction',
    'Non-Fiction':     'Self-Help',
    'Other':           'Fiction',
  },
  GENRES: [
    'Fiction','Non-Fiction','Science Fiction','Fantasy',
    'Mystery','Thriller','Biography','History',
    'Self-Help','Romance','Horror','Poetry','Other',
  ],
  BADGES: [
    { id: 'first_book',   emoji: '📖', label: 'First Book',       check: (s) => s.readCount >= 1          },
    { id: 'five_books',   emoji: '🔥', label: '5 Books',          check: (s) => s.readCount >= 5          },
    { id: 'ten_books',    emoji: '🏆', label: '10 Books',         check: (s) => s.readCount >= 10         },
    { id: 'fifty_books',  emoji: '📚', label: '50 Books',         check: (s) => s.readCount >= 50         },
    { id: 'goal_crusher', emoji: '🌟', label: 'Goal Crusher',     check: (s) => s.goalMet                 },
    { id: 'explorer',     emoji: '🗺️', label: 'Genre Explorer',  check: (s) => s.uniqueGenres >= 4       },
    { id: 'pages_1k',     emoji: '📄', label: '1K Pages',         check: (s) => s.totalPagesRead >= 1000  },
    { id: 'pages_10k',    emoji: '💪', label: '10K Pages',        check: (s) => s.totalPagesRead >= 10000 },
    { id: 'streak_3',     emoji: '⚡', label: '3-Day Streak',     check: (s) => s.streak >= 3             },
    { id: 'streak_7',     emoji: '🔆', label: '7-Day Streak',     check: (s) => s.streak >= 7             },
  ],
});
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — utils.js                                 ║
 * ║  Pure utility functions — no DOM, no state              ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const Utils = (() => {

  function escHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  function stripTags(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sanitizeText(value, maxLen = 500) {
    return stripTags(value).slice(0, maxLen);
  }

  function validateBookForm(data) {
    const errors = [];
    const { title, author, pages, rating, dateRead } = data;

    if (!title || title.trim().length === 0) {
      errors.push({ field: 'title', msg: 'Title is required.' });
    } else if (title.length > CONFIG.LIMITS.TITLE_MAX) {
      errors.push({ field: 'title', msg: `Title must be under ${CONFIG.LIMITS.TITLE_MAX} characters.` });
    }

    if (!author || author.trim().length === 0) {
      errors.push({ field: 'author', msg: 'Author is required.' });
    } else if (author.length > CONFIG.LIMITS.AUTHOR_MAX) {
      errors.push({ field: 'author', msg: `Author must be under ${CONFIG.LIMITS.AUTHOR_MAX} characters.` });
    }

    const pagesNum = parseInt(pages, 10);
    if (isNaN(pagesNum) || pagesNum < CONFIG.LIMITS.PAGES_MIN) {
      errors.push({ field: 'pages', msg: `Page count must be at least ${CONFIG.LIMITS.PAGES_MIN}.` });
    } else if (pagesNum > CONFIG.LIMITS.PAGES_MAX) {
      errors.push({ field: 'pages', msg: `Page count cannot exceed ${CONFIG.LIMITS.PAGES_MAX.toLocaleString()}.` });
    }

    if (rating !== null && rating !== undefined && rating !== '') {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < CONFIG.LIMITS.RATING_MIN || ratingNum > CONFIG.LIMITS.RATING_MAX) {
        errors.push({ field: 'rating', msg: `Rating must be between ${CONFIG.LIMITS.RATING_MIN} and ${CONFIG.LIMITS.RATING_MAX}.` });
      }
    }

    if (dateRead) {
      const d = new Date(dateRead + 'T12:00:00');
      if (isNaN(d.getTime())) {
        errors.push({ field: 'dateRead', msg: 'Invalid date finished.' });
      } else if (d > new Date()) {
        errors.push({ field: 'dateRead', msg: 'Date finished cannot be in the future.' });
      }
    }

    return errors;
  }

  function validatePagesUpdate(raw, totalPages) {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return { valid: false, error: 'Enter a valid number.' };
    const clamped = Math.max(0, Math.min(parsed, totalPages));
    return { valid: true, value: clamped };
  }

  function isDuplicate(books, title, author, excludeId = null) {
    const t = title.trim().toLowerCase();
    const a = author.trim().toLowerCase();
    return books.some(b =>
      b.id !== excludeId &&
      b.title.trim().toLowerCase()  === t &&
      b.author.trim().toLowerCase() === a
    );
  }

  function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn.apply(this, args);
      }, wait);
    };
  }

  function throttle(fn, limit) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  function generateId() {
    return `${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;
  }

  function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString();
  }

  function renderStars(rating) {
    if (!rating || rating < 1) return '';
    const r = Math.min(Math.max(Math.round(rating), 1), 5);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  function todayLocalISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function dateToLocalISO(date) {
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return {
    escHtml, stripTags, sanitizeText,
    validateBookForm, validatePagesUpdate, isDuplicate,
    debounce, throttle, generateId,
    fmt, renderStars, todayLocalISO, dateToLocalISO,
  };

})();
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — store.js                                 ║
 * ║  LocalStorage abstraction with full error handling      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const Store = (() => {

  let _memoryFallback = {
    [CONFIG.STORAGE.BOOKS]:    null,
    [CONFIG.STORAGE.SETTINGS]: null,
  };
  let _storageAvailable = true;

  (function checkStorage() {
    try {
      const TEST = '__bookmind_test__';
      localStorage.setItem(TEST, '1');
      localStorage.removeItem(TEST);
      _storageAvailable = true;
    } catch (e) {
      _storageAvailable = false;
    }
  })();

  function _read(key) {
    try {
      if (!_storageAvailable) return _memoryFallback[key] ?? null;
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function _write(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (!_storageAvailable) {
        _memoryFallback[key] = value;
        return true;
      }
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast('⚠️ Storage full — please export your library.', 'error');
        }
      }
      return false;
    }
  }

  function _sanitizeBook(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (!raw.title || !raw.author) return null;
    return {
      id:         String(raw.id        ?? Utils.generateId()),
      title:      Utils.sanitizeText(raw.title,  CONFIG.LIMITS.TITLE_MAX),
      author:     Utils.sanitizeText(raw.author, CONFIG.LIMITS.AUTHOR_MAX),
      genre:      CONFIG.GENRES.includes(raw.genre) ? raw.genre : 'Other',
      totalPages: Math.max(1, parseInt(raw.totalPages, 10) || 1),
      pagesRead:  Math.max(0, parseInt(raw.pagesRead,  10) || 0),
      read:       Boolean(raw.read),
      rating:     (raw.rating >= 1 && raw.rating <= 5) ? Number(raw.rating) : null,
      dateRead:   typeof raw.dateRead === 'string' ? raw.dateRead : null,
      addedAt:    typeof raw.addedAt  === 'string' ? raw.addedAt  : new Date().toISOString(),
      color:      (Number.isInteger(raw.color) && raw.color >= 0 && raw.color <= 5)
                    ? raw.color : Math.floor(Math.random() * 6),
    };
  }

  function _clampPages(book) {
    if (book.pagesRead > book.totalPages) book.pagesRead = book.totalPages;
    if (book.pagesRead === book.totalPages && book.totalPages > 0) book.read = true;
    return book;
  }

  function loadBooks() {
    const raw = _read(CONFIG.STORAGE.BOOKS);
    if (!Array.isArray(raw)) return [];
    return raw.map(_sanitizeBook).filter(Boolean).map(_clampPages);
  }

  function saveBooks(books) {
    if (!Array.isArray(books)) return false;
    return _write(CONFIG.STORAGE.BOOKS, books);
  }

  const DEFAULT_SETTINGS = { monthlyGoal: 0 };

  function loadSettings() {
    const raw = _read(CONFIG.STORAGE.SETTINGS);
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
    return { monthlyGoal: Math.max(0, parseInt(raw.monthlyGoal, 10) || 0) };
  }

  function saveSettings(settings) {
    return _write(CONFIG.STORAGE.SETTINGS, settings);
  }

  function exportData() {
    return JSON.stringify({
      version:  3,
      exported: new Date().toISOString(),
      books:    loadBooks(),
      settings: loadSettings(),
    }, null, 2);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.books)) {
        return { success: false, message: 'Invalid file: missing books array.' };
      }
      const sanitized = data.books.map(_sanitizeBook).filter(Boolean).map(_clampPages);
      saveBooks(sanitized);
      if (data.settings) saveSettings(data.settings);
      return { success: true, message: `Imported ${sanitized.length} books.`, count: sanitized.length };
    } catch (e) {
      return { success: false, message: `Import failed: ${e.message}` };
    }
  }

  return {
    loadBooks, saveBooks,
    loadSettings, saveSettings,
    exportData, importData,
    get isAvailable() { return _storageAvailable; },
  };

})();
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — books.js                                 ║
 * ║  Book CRUD operations & business logic                  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const Books = (() => {

  let _books = Store.loadBooks();

  const ok   = (data)  => ({ success: true,  data });
  const fail = (error) => ({ success: false, error });

  function _persist() { return Store.saveBooks(_books); }
  function _findById(id) { return _books.find(b => b.id === id) ?? null; }

  function getAll() { return [..._books]; }

  function getById(id) {
    const b = _findById(id);
    return b ? ok(b) : fail(`Book "${id}" not found.`);
  }

  function getFiltered(filter = 'all', query = '') {
    const q = query.trim().toLowerCase().slice(0, CONFIG.LIMITS.SEARCH_MAX);
    return _books.filter(b => {
      const matchSearch = !q
        || b.title.toLowerCase().includes(q)
        || b.author.toLowerCase().includes(q)
        || b.genre.toLowerCase().includes(q);
      const matchFilter = (() => {
        switch (filter) {
          case 'read':       return b.read;
          case 'unread':     return !b.read && b.pagesRead === 0;
          case 'inprogress': return !b.read && b.pagesRead > 0;
          default:           return true;
        }
      })();
      return matchSearch && matchFilter;
    });
  }

  function create(formData) {
    const clean = {
      title:    Utils.sanitizeText(formData.title,  CONFIG.LIMITS.TITLE_MAX),
      author:   Utils.sanitizeText(formData.author, CONFIG.LIMITS.AUTHOR_MAX),
      genre:    CONFIG.GENRES.includes(formData.genre) ? formData.genre : 'Other',
      pages:    formData.pages,
      rating:   formData.rating || null,
      dateRead: formData.dateRead || null,
    };

    const errors = Utils.validateBookForm(clean);
    if (errors.length) return { success: false, errors, error: errors[0].msg };

    if (Utils.isDuplicate(_books, clean.title, clean.author)) {
      return fail(`"${clean.title}" by ${clean.author} is already in your library.`);
    }

    const totalPages = parseInt(clean.pages, 10);
    const hasDateRead = Boolean(clean.dateRead);

    const book = {
      id:         Utils.generateId(),
      title:      clean.title,
      author:     clean.author,
      genre:      clean.genre,
      totalPages,
      pagesRead:  hasDateRead ? totalPages : 0,
      read:       hasDateRead,
      rating:     clean.rating ? parseInt(clean.rating, 10) : null,
      dateRead:   clean.dateRead ?? null,
      addedAt:    new Date().toISOString(),
      color:      Math.floor(Math.random() * 6),
    };

    _books.unshift(book);
    _persist();
    return ok(book);
  }

  function updateProgress(id, rawValue) {
    const book = _findById(id);
    if (!book) return fail(`Book "${id}" not found.`);

    const result = Utils.validatePagesUpdate(rawValue, book.totalPages);
    if (!result.valid) return fail(result.error);

    book.pagesRead = result.value;

    if (book.pagesRead >= book.totalPages) {
      book.read = true;
      if (!book.dateRead) book.dateRead = Utils.todayLocalISO();
    } else {
      book.read = false;
    }

    _persist();
    const pct = book.totalPages > 0
      ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
    return ok({ book, pct });
  }

  function toggleRead(id) {
    const book = _findById(id);
    if (!book) return fail(`Book "${id}" not found.`);

    book.read = !book.read;
    if (book.read) {
      book.pagesRead = book.totalPages;
      if (!book.dateRead) book.dateRead = Utils.todayLocalISO();
    } else {
      book.pagesRead = 0;
      book.dateRead  = null;
    }

    _persist();
    return ok(book);
  }

  function remove(id) {
    const idx = _books.findIndex(b => b.id === id);
    if (idx === -1) return fail(`Book "${id}" not found.`);
    const [removed] = _books.splice(idx, 1);
    _persist();
    return ok(removed.title);
  }

  function reload() { _books = Store.loadBooks(); }

  function getMetrics() {
    const total      = _books.length;
    const read       = _books.filter(b => b.read);
    const unread     = _books.filter(b => !b.read && b.pagesRead === 0);
    const inProgress = _books.filter(b => !b.read && b.pagesRead > 0);
    const totalPagesRead = _books.reduce((s, b) => s + (b.pagesRead || 0), 0);
    const rated      = _books.filter(b => b.rating);
    const avgRating  = rated.length
      ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : null;

    const genreCounts = {};
    _books.forEach(b => { genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1; });

    const readGenreCounts = {};
    read.forEach(b => { readGenreCounts[b.genre] = (readGenreCounts[b.genre] || 0) + 1; });

    return {
      total,
      readCount:       read.length,
      unreadCount:     unread.length,
      inProgressCount: inProgress.length,
      totalPagesRead,
      avgRating,
      ratedCount:      rated.length,
      genreCounts,
      readGenreCounts,
    };
  }

  return {
    getAll, getById, getFiltered,
    create, updateProgress, toggleRead, remove,
    reload, getMetrics,
  };

})();
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — analytics.js                             ║
 * ║  Streak, genre analytics, insights, badge computation   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const Analytics = (() => {

  function getBooksThisMonth(books) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    return books.filter(b => {
      if (!b.dateRead) return false;
      const parts = b.dateRead.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return false;
      const [y, m] = parts;
      return y === thisYear && (m - 1) === thisMonth;
    });
  }

  function getReadingStreak(books) {
    const todayStr = Utils.todayLocalISO();
    const today    = new Date();
    const readDates = new Set();
    books.forEach(b => {
      if (!b.dateRead || typeof b.dateRead !== 'string') return;
      if (b.dateRead > todayStr) return;
      readDates.add(b.dateRead.slice(0, 10));
    });
    if (readDates.size === 0) return 0;
    let streak = 0;
    let startOffset = readDates.has(todayStr) ? 0 : 1;
    for (let i = startOffset; i < CONFIG.STREAK.MAX_LOOKBACK_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = Utils.dateToLocalISO(d);
      if (readDates.has(key)) streak++;
      else break;
    }
    return streak;
  }

  function buildGenreStats(genreCounts) {
    const total = Object.values(genreCounts).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count], i) => ({
        label, count,
        pct:   parseFloat(((count / total) * 100).toFixed(1)),
        color: CONFIG.CHART_COLORS[i % CONFIG.CHART_COLORS.length],
      }));
  }

  function getRecommendedGenre(readGenreCounts) {
    const topGenres = Object.keys(readGenreCounts)
      .sort((a, b) => readGenreCounts[b] - readGenreCounts[a]);
    if (!topGenres.length) return 'Fiction';
    const top = topGenres[0];
    const suggested = CONFIG.GENRE_SUGGESTIONS[top];
    if (suggested && suggested !== top) return suggested;
    const untried = CONFIG.GENRES.find(g => !readGenreCounts[g]);
    return untried ?? 'Fantasy';
  }

  function computeBadges(metrics, settings, streak, monthlyRead) {
    const stats = {
      readCount:      metrics.readCount,
      totalPagesRead: metrics.totalPagesRead,
      uniqueGenres:   Object.keys(metrics.readGenreCounts).length,
      goalMet:        settings.monthlyGoal > 0 && monthlyRead >= settings.monthlyGoal,
      streak,
    };
    return CONFIG.BADGES.map(def => ({ ...def, earned: def.check(stats) }));
  }

  function buildInsights(books, metrics, settings, streak, monthlyRead) {
    if (books.length === 0) return null;
    const insights = [];
    const { readGenreCounts, totalPagesRead, avgRating } = metrics;
    const topGenres = Object.keys(readGenreCounts)
      .sort((a, b) => readGenreCounts[b] - readGenreCounts[a]);

    if (settings.monthlyGoal > 0) {
      const pct = Math.round((monthlyRead / settings.monthlyGoal) * 100);
      const capped = Math.min(pct, 100);
      insights.push({
        icon: '🎯', title: `You're ${capped}% to your monthly goal!`,
        text: `${monthlyRead} of ${settings.monthlyGoal} books read this month. ${
          capped >= 100 ? 'Goal crushed! 🏆' :
          capped >= 75  ? 'Almost there — one more push!' :
          capped >= 50  ? 'Halfway there, keep it up!' : "You've got this!"
        }`,
      });
    }

    if (topGenres.length) {
      const top = topGenres[0];
      const count = readGenreCounts[top];
      insights.push({
        icon: '🔥', title: `You devour ${top} books`,
        text: `${top} is your most-read genre with ${count} book${count > 1 ? 's' : ''}. You clearly love it!`,
      });
    }

    if (topGenres.length) {
      const rec = getRecommendedGenre(readGenreCounts);
      insights.push({
        icon: '✨', title: `Try ${rec} next`,
        text: `Based on your reading history, ${rec} books share a lot of what makes ${topGenres[0]} so compelling.`,
      });
    }

    if (avgRating !== null) {
      insights.push({
        icon: '⭐', title: `Your average rating is ${avgRating}/5`,
        text: avgRating >= 4.5 ? 'Exceptionally high standards — and excellent taste.' :
              avgRating >= 4   ? 'You love most of what you read. Great picker!' :
              avgRating >= 3   ? "You're a balanced, honest reviewer." :
                                 'Tough critic! Keep seeking your perfect read.',
      });
    }

    if (streak > 1) {
      insights.push({
        icon: '🔆', title: `${streak}-day reading streak!`,
        text: streak >= 7 ? "Over a week straight — serious dedication. Don't break the chain!" :
              "You've been consistent. Keep the momentum going!",
      });
    }

    if (totalPagesRead > 0) {
      insights.push({
        icon: '📄', title: `${Utils.fmt(totalPagesRead)} pages read total`,
        text: totalPagesRead > 10000 ? "That's a mountain of words. You're an exceptional reader!" :
              totalPagesRead > 5000  ? "You've read enough to fill a small anthology. Impressive!" :
              totalPagesRead > 1000  ? 'Your reading muscle is growing every day.' :
                                       "Every page counts. You're building a great habit.",
      });
    }

    const tbr = books.filter(b => !b.read && b.pagesRead === 0).length;
    if (tbr > 3) {
      const shortest = [...books]
        .filter(b => !b.read && b.pagesRead === 0)
        .sort((a, b) => a.totalPages - b.totalPages)[0];
      insights.push({
        icon: '📚', title: `${tbr} books waiting in your TBR pile`,
        text: shortest
          ? `Start with "${Utils.escHtml(shortest.title)}" — only ${Utils.fmt(shortest.totalPages)} pages!`
          : 'Pick up the shortest one to build momentum!',
      });
    }

    return insights.length ? insights.slice(0, 5) : null;
  }

  return {
    getBooksThisMonth, getReadingStreak,
    buildGenreStats, getRecommendedGenre,
    computeBadges, buildInsights,
  };

})();
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
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  BookMind AI — ai-assistant.js                          ║
 * ║  Floating AI Reading Analyst Panel                      ║
 * ╚══════════════════════════════════════════════════════════╝
 */
'use strict';

const AIAssistant = (() => {

  let _isOpen      = false;
  let _tipIndex    = 0;
  let _lastRefresh = 0;

  const RECS = {
    'Mystery': [
      { title: 'The Name of the Rose',        author: 'Umberto Eco',           reason: 'A labyrinthine medieval murder mystery.' },
      { title: 'Big Little Lies',              author: 'Liane Moriarty',        reason: 'Gripping domestic suspense with sharp twists.' },
      { title: 'In the Woods',                 author: 'Tana French',           reason: 'Atmospheric Dublin mystery, haunting and precise.' },
    ],
    'Thriller': [
      { title: 'Gone Girl',                    author: 'Gillian Flynn',          reason: 'Unreliable narrators at their most unsettling.' },
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson',      reason: 'Complex investigation, unforgettable protagonist.' },
      { title: 'I Am Pilgrim',                 author: 'Terry Hayes',           reason: 'Espionage thriller spanning continents and decades.' },
    ],
    'Fiction': [
      { title: 'The Remains of the Day',       author: 'Kazuo Ishiguro',        reason: 'Quiet, devastating study of duty and regret.' },
      { title: 'A Little Life',                author: 'Hanya Yanagihara',      reason: 'Profound and deeply human at its core.' },
      { title: 'Normal People',                author: 'Sally Rooney',          reason: 'Precise dialogue, achingly real relationships.' },
    ],
    'Science Fiction': [
      { title: 'Project Hail Mary',            author: 'Andy Weir',             reason: 'Relentless problem-solving wrapped in pure wonder.' },
      { title: 'Recursion',                    author: 'Blake Crouch',          reason: 'Mind-bending time and memory thriller.' },
      { title: 'A Fire Upon the Deep',         author: 'Vernor Vinge',          reason: 'Galaxy-spanning ideas, genuinely alien civilisations.' },
    ],
    'Fantasy': [
      { title: 'The Way of Kings',             author: 'Brandon Sanderson',     reason: 'Epic world-building with meticulous magic systems.' },
      { title: 'The Night Circus',             author: 'Erin Morgenstern',      reason: 'Lush, dreamlike — a battle fought in beauty.' },
      { title: 'Piranesi',                     author: 'Susanna Clarke',        reason: 'Quietly surreal; unlike anything else you\'ve read.' },
    ],
    'Biography': [
      { title: 'Educated',                     author: 'Tara Westover',         reason: 'A memoir of self-invention against impossible odds.' },
      { title: 'Leonardo da Vinci',            author: 'Walter Isaacson',       reason: 'The ultimate portrait of boundless curiosity.' },
      { title: 'The Diary of a Young Girl',    author: 'Anne Frank',            reason: 'Courage and humanity in the darkest of times.' },
    ],
    'History': [
      { title: 'Sapiens',                      author: 'Yuval Noah Harari',     reason: 'Humanity\'s full story told with provocative clarity.' },
      { title: 'The Silk Roads',               author: 'Peter Frankopan',       reason: 'Rewrites world history from the centre outward.' },
      { title: 'The Guns of August',           author: 'Barbara Tuchman',       reason: 'How the world stumbled into catastrophe in 1914.' },
    ],
    'Self-Help': [
      { title: 'Atomic Habits',                author: 'James Clear',           reason: 'Small changes, compound results — actually actionable.' },
      { title: 'Deep Work',                    author: 'Cal Newport',           reason: 'The case for focus in a distracted world.' },
      { title: 'Thinking, Fast and Slow',      author: 'Daniel Kahneman',      reason: 'How your two minds shape every decision.' },
    ],
    'Non-Fiction': [
      { title: 'The Body',                     author: 'Bill Bryson',           reason: 'A joyful tour of human biology, funny and profound.' },
      { title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', reason: 'The cosmos in a single sitting.' },
      { title: 'Longitude',                    author: 'Dava Sobel',            reason: 'A tiny problem that changed history forever.' },
    ],
    'Romance': [
      { title: 'The Hating Game',              author: 'Sally Thorne',          reason: 'Sharp rivals-to-lovers banter done perfectly.' },
      { title: 'Beach Read',                   author: 'Emily Henry',           reason: 'Two writers, opposite genres — warm and witty.' },
      { title: 'It Ends with Us',              author: 'Colleen Hoover',        reason: 'Emotionally honest; more than its genre suggests.' },
    ],
    'Horror': [
      { title: 'The Haunting of Hill House',   author: 'Shirley Jackson',       reason: 'The gold standard of psychological horror.' },
      { title: 'Bird Box',                     author: 'Josh Malerman',         reason: 'Tight, relentless — terror in the unseen.' },
      { title: 'Mexican Gothic',               author: 'Silvia Moreno-Garcia',  reason: 'Gothic atmosphere soaked in sinister beauty.' },
    ],
    'Poetry': [
      { title: 'Milk and Honey',               author: 'Rupi Kaur',             reason: 'Raw, compressed emotion — reads in one breath.' },
      { title: 'Leaves of Grass',              author: 'Walt Whitman',          reason: 'The original American epic — vast and alive.' },
      { title: 'The Sun and Her Flowers',      author: 'Rupi Kaur',             reason: 'Growth and femininity in spare, striking verse.' },
    ],
    'Other': [
      { title: 'The Alchemist',                author: 'Paulo Coelho',          reason: 'A fable about following your own legend.' },
      { title: 'Jonathan Livingston Seagull',  author: 'Richard Bach',          reason: 'Short, philosophical — reread every few years.' },
      { title: 'The Little Prince',            author: 'Antoine de Saint-Exupéry', reason: 'Ageless wisdom disguised as a children\'s book.' },
    ],
  };

  const PERSONAS = {
    'Mystery':         { name: 'Mystery Sleuth',       icon: '🔍', accent: '#5c8aaa', desc: 'You chase clues through every chapter. The twist is never obvious — to you, that\'s the whole point.' },
    'Thriller':        { name: 'Edge-of-Seat Reader',  icon: '⚡', accent: '#aa6060', desc: 'You thrive on adrenaline and tension. Slow chapters are just longer countdowns to the explosion.' },
    'Fiction':         { name: 'Deep Feeler',          icon: '🌊', accent: '#60aa90', desc: 'You read to understand people. Characters leave marks long after the last page.' },
    'Science Fiction': { name: 'Future Thinker',       icon: '🚀', accent: '#7a9060', desc: 'Big ideas energise you. You read sci-fi to rehearse possibilities the world hasn\'t caught up with yet.' },
    'Fantasy':         { name: 'World Walker',         icon: '🗺️', accent: '#8a60aa', desc: 'You live in multiple worlds simultaneously. The more immersive, the better.' },
    'Biography':       { name: 'Life Collector',       icon: '🧬', accent: '#aa9060', desc: 'Every biography adds a mentor you\'ll never meet. You read lives to learn from them.' },
    'History':         { name: 'Time Traveller',       icon: '⏳', accent: '#7060aa', desc: 'The past is your playground. You understand the present by excavating what came before.' },
    'Self-Help':       { name: 'Growth Seeker',        icon: '🌱', accent: '#7a9060', desc: 'You read with a highlighter in mind. Every book is a system upgrade waiting to be installed.' },
    'Non-Fiction':     { name: 'Curious Generalist',   icon: '🔭', accent: '#5c8aaa', desc: 'Your shelves span everything. Curiosity is your only filter.' },
    'Romance':         { name: 'Heart-Led Reader',     icon: '💛', accent: '#aa6060', desc: 'Emotional stakes matter most. You know love stories are really about vulnerability.' },
    'Horror':          { name: 'Fear Connoisseur',     icon: '🕯️', accent: '#703c2e', desc: 'You understand that horror, at its best, is about the human condition at its rawest.' },
    'Poetry':          { name: 'Word Architect',       icon: '✒️', accent: '#8a60aa', desc: 'You know that one line can carry more weight than a whole chapter of prose.' },
    'Other':           { name: 'Eclectic Explorer',    icon: '🎲', accent: '#aa9060', desc: 'Genre is just a label. You follow interest wherever it leads — the best kind of reader.' },
  };

  const TIPS = [
    { icon: '🌅', text: 'Morning readers retain 23% more — even 15 pages before coffee compounds fast over a year.' },
    { icon: '📵', text: 'Leave your phone in another room. Readers who do this finish books 40% faster.' },
    { icon: '🎧', text: 'Ambient instrumental music extends average reading sessions by up to 30 minutes.' },
    { icon: '🛏️', text: 'Reading before sleep beats scrolling — you\'ll fall asleep faster and remember more.' },
    { icon: '📝', text: 'Write one sentence about what you read today. Simplest journal, highest completion rate.' },
    { icon: '⏱️', text: 'Try 25 min reading, 5 min off, repeat. The Pomodoro method works for books too.' },
    { icon: '📚', text: 'Having your next book ready before finishing the current one eliminates the reading gap.' },
    { icon: '🎯', text: 'Readers with monthly goals complete 2.4× more books than those without.' },
  ];

  const CHEERS = [
    'Another chapter of your life, written!',
    'Your library grows stronger!',
    'You\'re on a roll — what\'s next?',
    'Every book makes you a slightly different person.',
    'Reading streak still alive! 🔥',
    'Knowledge collected. Power gained. ✨',
  ];

  const _$ = id => document.getElementById(id);

  function _getPersonality(books, metrics) {
    const rc = metrics.readGenreCounts;
    const topRead = Object.keys(rc).sort((a, b) => rc[b] - rc[a]);
    if (Object.keys(rc).length >= 4) {
      return { name: 'Genre Explorer', icon: '🧭', accent: '#e8975a',
        desc: 'Four+ genres explored. Your reading life is wonderfully unpredictable — that\'s a strength.' };
    }
    if (topRead.length) return PERSONAS[topRead[0]] || PERSONAS['Other'];
    const ac = {};
    books.forEach(b => { ac[b.genre] = (ac[b.genre] || 0) + 1; });
    const topAdded = Object.keys(ac).sort((a, b) => ac[b] - ac[a])[0];
    if (topAdded) return PERSONAS[topAdded] || PERSONAS['Other'];
    return { name: 'New Reader', icon: '📖', accent: '#e8975a',
      desc: 'Every great reading life starts somewhere. Add your first book and discover your personality!' };
  }

  function _getRecs(books, metrics) {
    const rc = metrics.readGenreCounts;
    const ac = metrics.genreCounts;
    const genre = Object.keys(rc).sort((a, b) => rc[b] - rc[a])[0]
               || Object.keys(ac).sort((a, b) => ac[b] - ac[a])[0]
               || 'Fiction';
    const pool  = RECS[genre] || RECS['Fiction'];
    const owned = new Set(books.map(b => b.title.toLowerCase()));
    const avail = pool.filter(r => !owned.has(r.title.toLowerCase()));
    return { genre, books: (avail.length >= 3 ? avail : pool).slice(0, 3) };
  }

  function _getHabit(books, metrics) {
    const read = books.filter(b => b.read && b.dateRead);
    if (!read.length) return { icon: '📖', text: 'Complete your first book to unlock reading habit analysis!' };
    let wd = 0, we = 0;
    read.forEach(b => {
      const day = new Date(b.dateRead + 'T12:00:00').getDay();
      (day === 0 || day === 6) ? we++ : wd++;
    });
    if (we > wd && we >= 2) return { icon: '🌤️', text: `You read faster on weekends! ${we} completions vs ${wd} on weekdays. Weekend warrior style.` };
    if (wd > we * 2 && wd >= 3) return { icon: '💼', text: `Weekdays are your power zone — ${wd} completions vs ${we} on weekends. Impressive daily discipline!` };
    const avg = metrics.totalPagesRead / Math.max(metrics.readCount, 1);
    if (avg > 450) return { icon: '🦅', text: `You average ${Math.round(avg)} pages/book — you love long, immersive reads.` };
    if (avg < 200 && metrics.readCount >= 3) return { icon: '⚡', text: `You prefer shorter books (~${Math.round(avg)} pages). More finishes = more momentum. Smart strategy.` };
    const gc = Object.keys(metrics.readGenreCounts).length;
    if (gc >= 3) return { icon: '🎨', text: `You've explored ${gc} genres. Cross-genre readers develop stronger analytical thinking.` };
    return { icon: '📈', text: `${metrics.readCount} book${metrics.readCount !== 1 ? 's' : ''} completed — ${metrics.totalPagesRead.toLocaleString()} pages absorbed.` };
  }

  function _getMotivation(books, metrics, settings) {
    const monthly = Analytics.getBooksThisMonth(books).length;
    const goal    = settings.monthlyGoal;
    if (goal > 0) {
      const left = goal - monthly;
      if (left <= 0)  return { icon: '🏆', text: `Monthly goal smashed! ${monthly}/${goal} books done. Raise the bar!`, type: 'gold' };
      if (left === 1) return { icon: '🎯', text: `Only 1 more book to hit your ${goal}-book goal! So close.`, type: 'hot' };
      if (left <= 3)  return { icon: '🔥', text: `Only ${left} more books to reach your monthly goal of ${goal}. You've got this!`, type: 'warm' };
      const pct = Math.round((monthly / goal) * 100);
      return { icon: '📊', text: `${pct}% toward your ${goal}-book monthly goal. ${monthly} done, ${left} to go.`, type: 'neutral' };
    }
    const streak = Analytics.getReadingStreak(books);
    if (streak >= 3) return { icon: '🔥', text: `${streak}-day reading streak! Set a monthly goal to channel this momentum.`, type: 'warm' };
    if (!metrics.readCount) return { icon: '🌱', text: `Your reading journey starts with a single page. Mark your first book as read!`, type: 'neutral' };
    return { icon: '🎯', text: `${metrics.readCount} books completed total. Set a monthly goal to push yourself further!`, type: 'neutral' };
  }

  function _render() {
    const panel = _$('aiPanel');
    if (!panel) return;
    const books    = Books.getAll();
    const metrics  = Books.getMetrics();
    const settings = Store.loadSettings();
    const persona  = _getPersonality(books, metrics);
    const recs     = _getRecs(books, metrics);
    const habit    = _getHabit(books, metrics);
    const motiv    = _getMotivation(books, metrics, settings);
    const tip      = TIPS[_tipIndex % TIPS.length];

    panel.innerHTML = `
      <div class="aip-header">
        <div class="aip-identity">
          <div class="aip-avatar">
            <span class="aip-robot">🤖</span>
            <span class="aip-dot"></span>
          </div>
          <div class="aip-id-text">
            <span class="aip-name">BookMind AI</span>
            <span class="aip-sub">Reading Analyst</span>
          </div>
        </div>
        <div class="aip-controls">
          <button class="aip-refresh" id="aiRefreshBtn" title="New insights" aria-label="Refresh insights">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button class="aip-close" id="aiCloseBtn" aria-label="Close AI panel">✕</button>
        </div>
      </div>
      <div class="aip-body">
        <div class="aip-section">
          <div class="aip-tag">YOUR READING PERSONALITY</div>
          <div class="aip-persona" style="--pa:${persona.accent}">
            <div class="aip-persona-icon">${persona.icon}</div>
            <div class="aip-persona-text">
              <div class="aip-persona-name">${Utils.escHtml(persona.name)}</div>
              <div class="aip-persona-desc">${Utils.escHtml(persona.desc)}</div>
            </div>
          </div>
        </div>
        <div class="aip-section">
          <div class="aip-tag">PROGRESS MOTIVATION</div>
          <div class="aip-motiv aip-motiv-${motiv.type}">
            <span class="aip-motiv-ico">${motiv.icon}</span>
            <span>${Utils.escHtml(motiv.text)}</span>
          </div>
        </div>
        <div class="aip-section">
          <div class="aip-tag">READING HABIT ANALYSIS</div>
          <div class="aip-habit">
            <span class="aip-habit-ico">${habit.icon}</span>
            <span>${Utils.escHtml(habit.text)}</span>
          </div>
        </div>
        <div class="aip-section">
          <div class="aip-tag">RECOMMENDED FOR YOU · ${Utils.escHtml(recs.genre.toUpperCase())}</div>
          <div class="aip-recs">
            ${recs.books.map((r, i) => `
              <div class="aip-rec" style="animation-delay:${i * 60}ms">
                <div class="aip-rec-num">${i + 1}</div>
                <div class="aip-rec-body">
                  <div class="aip-rec-title">${Utils.escHtml(r.title)}</div>
                  <div class="aip-rec-author">by ${Utils.escHtml(r.author)}</div>
                  <div class="aip-rec-why">${Utils.escHtml(r.reason)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="aip-section">
          <div class="aip-tag">READER TIP</div>
          <div class="aip-tip">
            <span class="aip-tip-ico">${tip.icon}</span>
            <span>${Utils.escHtml(tip.text)}</span>
          </div>
        </div>
      </div>
      <div class="aip-footer">
        <span>Updated just now</span>
        <span>${metrics.total} book${metrics.total !== 1 ? 's' : ''} analysed</span>
      </div>`;

    _$('aiCloseBtn')?.addEventListener('click', closePanel);
    _$('aiRefreshBtn')?.addEventListener('click', _doRefresh);
  }

  function _showThinking() {
    const body = _$('aiPanel')?.querySelector('.aip-body');
    if (!body) return;
    body.innerHTML = `
      <div class="aip-thinking">
        <div class="aip-dots"><span></span><span></span><span></span></div>
        <div class="aip-thinking-lbl">Analysing your library…</div>
      </div>`;
  }

  function _doRefresh() {
    const now = Date.now();
    if (now - _lastRefresh < 700) return;
    _lastRefresh = now;
    _tipIndex = (_tipIndex + 1) % TIPS.length;
    const btn = _$('aiRefreshBtn');
    if (btn) { btn.classList.add('spin'); setTimeout(() => btn.classList.remove('spin'), 700); }
    _showThinking();
    setTimeout(_render, 520);
  }

  function celebrateCompletion(bookTitle) {
    const el = _$('aiCelebration');
    if (!el) return;
    const msg = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    el.innerHTML = `
      <div class="celeb-card">
        <div class="celeb-emoji">🎉</div>
        <div class="celeb-head">Book Completed!</div>
        <div class="celeb-title">"${Utils.escHtml(bookTitle)}"</div>
        <div class="celeb-msg">${Utils.escHtml(msg)}</div>
        <div id="celConf"></div>
      </div>`;
    el.classList.add('show');
    _spawnConfetti(_$('celConf'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { if (el) el.innerHTML = ''; }, 400);
    }, 3000);
    const fab = _$('aiFab');
    if (fab) { fab.classList.add('fab-pop'); setTimeout(() => fab.classList.remove('fab-pop'), 2000); }
    if (_isOpen) setTimeout(_render, 400);
  }

  function _spawnConfetti(container) {
    if (!container) return;
    const cols = ['#e8975a','#7aad6e','#9b7fc4','#5ba8c4','#f0c878','#8fa87a','#c07a7a'];
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div');
      d.className = 'conf';
      d.style.cssText = `left:${(Math.random()*100).toFixed(1)}%;background:${cols[i%cols.length]};animation-delay:${(Math.random()*.45).toFixed(2)}s;animation-duration:${(.65+Math.random()*.8).toFixed(2)}s;width:${Math.round(5+Math.random()*9)}px;height:${Math.round(5+Math.random()*9)}px;border-radius:${Math.random()>.5?'50%':'3px'};transform:rotate(${Math.round(Math.random()*360)}deg)`;
      container.appendChild(d);
    }
  }

  function openPanel() {
    const panel = _$('aiPanel');
    if (!panel) return;
    _isOpen = true;
    panel.classList.add('open');
    _$('aiBackdrop')?.classList.add('show');
    document.body.classList.add('ai-open');
    _render();
  }

  function closePanel() {
    _isOpen = false;
    _$('aiPanel')?.classList.remove('open');
    _$('aiBackdrop')?.classList.remove('show');
    document.body.classList.remove('ai-open');
  }

  function onLibraryChange() {
    if (_isOpen) _render();
  }

  return { openPanel, closePanel, celebrateCompletion, onLibraryChange, get isOpen() { return _isOpen; } };

})();

// Expose globals so inline onclick attributes work
global.UI           = UI;
global.AIAssistant  = AIAssistant;

// Bootstrap
UI.init();

})(window);