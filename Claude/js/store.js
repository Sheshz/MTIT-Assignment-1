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