/* ===========================================================================
   Article manifest — the single source of truth for both the landing page
   (renders the article cards) and the article page (renders one post).

   To add a post:
     1. Create content/articles/<slug>.md  (pure Markdown, start with a "# Title")
     2. Add an entry below with a matching `slug` (set both `date` and `dateISO`)
     3. When it's ready, set  status: 'published'  (drafts show a placeholder)
     4. Run  node tools/build-posts.mjs  to regenerate the static pages in
        posts/, feed.xml, and sitemap.xml (needed for link previews + RSS)

   Tag palette (matches the design):
     Client  -> coral  #ff6b4a
     Server  -> gold   #ffd23f
     AI      -> green  #7cf29c
     Engine  -> muted  #c9c2d6
     Trading -> violet #a78bfa   (MoneyMaker bot — live-market behavior & defenses)
     Quant   -> blue   #6cb6ff   (MoneyMaker bot — models, math, backtests)
   =========================================================================== */
window.ARTICLES = [
  {
    slug: 'dumb-client-manifesto',
    tag: 'Client',
    tagColor: '#ff6b4a',
    tagBg: 'rgba(255,107,74,0.14)',
    accent: 'coral',
    title: 'The dumb client manifesto: zero game logic on the phone',
    excerpt: "ClashUp's phone decides nothing — the server owns the whole game. Here's why, and how prediction, reconciliation, and interpolation make it feel instant anyway.",
    hero: 'assets/img/dumbclient-authority.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'zero-idle-game-servers',
    tag: 'Server',
    tagColor: '#ffd23f',
    tagBg: 'rgba(255,210,63,0.14)',
    accent: 'gold',
    title: 'Reaching $0 idle cost: serverless-style game servers on GCP',
    excerpt: 'A game with zero players should cost zero dollars. How a serverless controller sleeps the whole fleet — machines and networking — down to nothing, and wakes it on demand.',
    hero: 'assets/img/zeroidle-cost-ladder.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'version-aware-gateway',
    tag: 'Server',
    tagColor: '#ffd23f',
    tagBg: 'rgba(255,210,63,0.14)',
    accent: 'gold',
    title: 'The version-aware gateway: shipping without kicking anyone off',
    excerpt: 'Updating a live multiplayer game usually means downtime or a forced update. How treating each game version as a container behind one router lets old and new builds run side-by-side.',
    hero: 'assets/img/gateway-router.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'claude-memory-vault',
    tag: 'AI',
    tagColor: '#7cf29c',
    tagBg: 'rgba(124,242,156,0.14)',
    accent: 'green',
    title: 'Giving Claude a memory: a git-tracked knowledge vault',
    excerpt: 'AI pair-programming falls apart when every session starts cold. How an index-driven, git-tracked memory vault makes the assistant accumulate knowledge about your project instead.',
    hero: 'assets/img/memory-recall.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'time-vegas',
    tag: 'Trading',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.14)',
    accent: 'violet',
    title: 'Time-Vegas: the last 20 seconds of a prediction market are a casino',
    excerpt: "Predators shake out near-certain positions in the final seconds before resolution. How two tripwires — divergence detection and a kill switch — earned their keep, in dollars.",
    hero: 'assets/img/timevegas-signals.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'stop-loss-depth-check',
    tag: 'Trading',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.14)',
    accent: 'violet',
    title: "Stop-losses that don't trust the price",
    excerpt: 'On a thin market, a $2 order can fake a crash and trigger your stop-loss. Why my bot audits orderbook depth before believing a price — and deliberately fails open when it can’t.',
    hero: 'assets/img/stoploss-depth.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'the-bug-was-a-dollar-sign',
    tag: 'Quant',
    tagColor: '#6cb6ff',
    tagBg: 'rgba(108,182,255,0.14)',
    accent: 'blue',
    title: 'My bot couldn’t trade SOL, and the bug was a dollar sign',
    excerpt: 'A volatility floor hand-tuned in dollars for BTC made the entry gate mathematically impossible for SOL — with no errors and no losses. A postmortem on constants that don’t scale.',
    hero: 'assets/img/sigma-scale-bug.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'when-95-cents-is-cheap',
    tag: 'Quant',
    tagColor: '#6cb6ff',
    tagBg: 'rgba(108,182,255,0.14)',
    accent: 'blue',
    title: 'When 95¢ is cheap: pricing near-certainty with a z-score',
    excerpt: 'A prediction market price is a probability claim — and sometimes it’s wrong by a measurable amount. How a random-walk z-score decides when the last few cents are underpriced.',
    hero: 'assets/img/rss-zscore.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'manipulation-resistance-index',
    tag: 'Quant',
    tagColor: '#6cb6ff',
    tagBg: 'rgba(108,182,255,0.14)',
    accent: 'blue',
    title: 'How hard is this market to shove? Scoring manipulation resistance 0–100',
    excerpt: 'Your confidence in an outcome and an attacker’s cost to change it are different numbers. Blending depth, imbalance, price impact, and spoof detection into one live score.',
    hero: 'assets/img/mri-composite.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
  {
    slug: 'backtest-confessions',
    tag: 'Trading',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.14)',
    accent: 'violet',
    title: 'Everything my backtests told me that I didn’t want to hear',
    excerpt: 'Record every tick, replay every idea, and let the data insult your intuition: the safest prices lose money, timeframes are regimes, and a calm market is a broken feed.',
    hero: 'assets/img/backtest-tribunal.svg',
    date: 'Jul 13, 2026',
    dateISO: '2026-07-13',
    status: 'published',
  },
];

window.getArticle = function (slug) {
  return (window.ARTICLES || []).find(function (a) { return a.slug === slug; }) || null;
};
