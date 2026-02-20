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