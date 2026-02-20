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