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