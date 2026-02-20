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