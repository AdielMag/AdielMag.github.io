/* ===========================================================================
   Article manifest — the single source of truth for both the landing page
   (renders the article cards) and the article page (renders one post).

   To add a post:
     1. Create content/articles/<slug>.md  (pure Markdown, start with a "# Title")
     2. Add an entry below with a matching `slug`
     3. When it's ready, set  status: 'published'  (drafts show a placeholder)

   Tag palette (matches the design):
     Client  -> coral  #ff6b4a
     Server  -> gold   #ffd23f
     AI      -> green  #7cf29c
     Engine  -> muted  #c9c2d6
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
    date: 'Jul 2026',
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
    date: 'Jul 2026',
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
    date: 'Jul 2026',
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
    date: 'Jul 2026',
    status: 'published',
  },
];

window.getArticle = function (slug) {
  return (window.ARTICLES || []).find(function (a) { return a.slug === slug; }) || null;
};
