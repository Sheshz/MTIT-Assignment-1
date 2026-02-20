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