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
    slug: 'smoothing-input-60fps',
    tag: 'Client',
    tagColor: '#ff6b4a',
    tagBg: 'rgba(255,107,74,0.14)',
    accent: 'coral',
    title: 'Smoothing input on 60fps mobile',
    excerpt: 'Full writeup coming soon.',
    date: '',
    status: 'draft',
  },
  {
    slug: 'own-physics-engine',
    tag: 'Server',
    tagColor: '#ffd23f',
    tagBg: 'rgba(255,210,63,0.14)',
    accent: 'gold',
    title: 'Why I built my own physics engine',
    excerpt: 'Full writeup coming soon.',
    date: '',
    status: 'draft',
  },
  {
    slug: 'ai-gameplay-tools',
    tag: 'AI',
    tagColor: '#7cf29c',
    tagBg: 'rgba(124,242,156,0.14)',
    accent: 'green',
    title: 'Using AI to write gameplay tools',
    excerpt: 'Full writeup coming soon.',
    date: '',
    status: 'draft',
  },
  {
    slug: 'deterministic-simulation',
    tag: 'Engine',
    tagColor: '#c9c2d6',
    tagBg: 'rgba(255,255,255,0.08)',
    accent: 'white',
    title: 'Deterministic simulation, the hard parts',
    excerpt: 'Full writeup coming soon.',
    date: '',
    status: 'draft',
  },
];

window.getArticle = function (slug) {
  return (window.ARTICLES || []).find(function (a) { return a.slug === slug; }) || null;
};
