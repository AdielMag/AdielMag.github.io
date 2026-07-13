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
    slug: 'zero-idle-game-servers',
    tag: 'Server',
    tagColor: '#ffd23f',
    tagBg: 'rgba(255,210,63,0.14)',
    accent: 'gold',
    title: 'Reaching $0 idle cost: serverless-style game servers on GCP',
    excerpt: 'A game with zero players should cost zero dollars. How a serverless controller sleeps the whole fleet — machines and networking — down to nothing, and wakes it on demand.',
    date: 'Jul 2026',
    status: 'published',
  },
];

window.getArticle = function (slug) {
  return (window.ARTICLES || []).find(function (a) { return a.slug === slug; }) || null;
};
