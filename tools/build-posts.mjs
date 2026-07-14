/* ===========================================================================
   Static-page generator. Run after adding/editing a post:

       node tools/build-posts.mjs

   Reads the manifest (assets/js/articles.js) and writes:
     - posts/<slug>.html  — one static page per published post, with real
       <title>/description/Open Graph tags so shared links unfurl properly
       (social scrapers don't run JS, so article.html?slug= previews are bare)
     - feed.xml           — RSS 2.0 feed of published posts
     - sitemap.xml        — index + all post pages

   The pages use <base href="../"> so every relative asset/script/fetch path
   resolves from the site root, and stamp data-slug on <body>, which
   assets/js/article.js picks up instead of ?slug=.
   =========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://adielmag.github.io';
const OG_IMAGE = `${SITE}/assets/img/og-card.jpg`;

// Evaluate the manifest with a window shim — it's a plain browser script.
const window = {};
new Function('window', readFileSync(join(root, 'assets/js/articles.js'), 'utf8'))(window);
const articles = (window.ARTICLES || []).filter((a) => a.status === 'published');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FOOTER = `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <span class="footer-mark">&gt;_</span>
      devlog<span class="brand-dot">.</span>
      <span class="footer-tagline">Adiel Magenheim · game dev, mostly mobile, increasingly AI</span>
    </div>
    <div class="footer-links">
      <a href="https://github.com/AdielMag" target="_blank" rel="noopener">GitHub</a>
      <a href="mailto:adiel12430@gmail.com">Email</a>
      <a href="feed.xml">RSS</a>
    </div>
  </div>
</footer>
`;

const page = (a) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="../">
  <title>${esc(a.title)} — devlog.</title>
  <meta name="description" content="${esc(a.excerpt || '')}">
  <link rel="canonical" href="${SITE}/posts/${a.slug}.html">
  <link rel="alternate" type="application/rss+xml" title="devlog. — Adiel Magenheim" href="${SITE}/feed.xml">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <meta name="theme-color" content="#151318">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE}/posts/${a.slug}.html">
  <meta property="og:site_name" content="devlog. — Adiel Magenheim">
  <meta property="og:title" content="${esc(a.title)}">
  <meta property="og:description" content="${esc(a.excerpt || '')}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="article:published_time" content="${a.dateISO}">
  <meta property="article:author" content="Adiel Magenheim">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(a.title)}">
  <meta name="twitter:description" content="${esc(a.excerpt || '')}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body data-slug="${a.slug}">

<nav class="nav">
  <a href="index.html" class="brand">
    <span class="brand-mark">&gt;_</span>
    devlog<span class="brand-dot">.</span>
    <span class="brand-by">by Adiel Magenheim</span>
  </a>
  <a href="index.html#articles" class="nav-back">← Back to the blog</a>
</nav>

<header class="art-header">
  <div class="art-header-glow"></div>
  <div class="art-header-inner">
    <div class="art-meta">
      <span class="tag-cat" id="aTag"></span>
      <span class="art-meta-time" id="aMeta">draft — not published yet</span>
    </div>
    <h1 class="art-title" id="aTitle"></h1>
    <p class="art-sub" id="aSub"></p>
    <div class="art-byline">
      <span class="art-avatar">AM</span>
      <div>
        <div class="art-author">Adiel Magenheim</div>
        <div class="art-role">game dev, mostly mobile, increasingly AI</div>
      </div>
    </div>
  </div>
</header>

<div class="art-hero-wrap">
  <div class="art-hero" id="aHero"></div>
</div>

<article class="art-body-wrap">
  <div class="art-body-inner">
    <div id="aContent"></div>
  </div>
</article>

<div class="reactions">
  <div class="reactions-inner" id="aReactions"></div>
</div>

<div class="art-foot">
  <div class="art-foot-inner">
    <div class="art-tags" id="aTags"></div>
    <a class="art-share" href="feed.xml" target="_blank" rel="noopener">RSS feed →</a>
  </div>
</div>

<section class="comments">
  <div class="comments-inner">
    <div class="comments-head">
      <h2>Comments</h2>
      <span class="comments-note">via GitHub</span>
    </div>
    <div id="aComments"></div>
  </div>
</section>

<section class="readnext">
  <div class="readnext-inner">
    <div class="readnext-eyebrow">READ NEXT</div>
    <div class="readnext-grid" id="aReadNext"></div>
  </div>
</section>
${FOOTER}
<script src="assets/js/articles.js"></script>
<script src="assets/js/markdown.js"></script>
<script src="assets/js/netcode-demos.js"></script>
<script src="assets/js/article.js"></script>
</body>
</html>
`;

mkdirSync(join(root, 'posts'), { recursive: true });
for (const a of articles) {
  writeFileSync(join(root, 'posts', `${a.slug}.html`), page(a));
}

// ---- RSS 2.0 feed ---------------------------------------------------------
const rfc822 = (iso) => new Date(`${iso}T12:00:00Z`).toUTCString();
const newest = articles.map((a) => a.dateISO).sort().at(-1);
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>devlog. — Adiel Magenheim</title>
  <link>${SITE}/</link>
  <description>Game dev, mostly mobile, increasingly AI. Multiplayer game tech, AI-assisted workflows, and the trading-bot lab.</description>
  <language>en</language>
  <lastBuildDate>${rfc822(newest)}</lastBuildDate>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${articles
  .map(
    (a) => `  <item>
    <title>${esc(a.title)}</title>
    <link>${SITE}/posts/${a.slug}.html</link>
    <guid isPermaLink="true">${SITE}/posts/${a.slug}.html</guid>
    <pubDate>${rfc822(a.dateISO)}</pubDate>
    <category>${esc(a.tag)}</category>
    <description>${esc(a.excerpt || '')}</description>
  </item>`
  )
  .join('\n')}
</channel>
</rss>
`;
writeFileSync(join(root, 'feed.xml'), feed);

// ---- sitemap ----------------------------------------------------------------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
${articles
  .map((a) => `  <url><loc>${SITE}/posts/${a.slug}.html</loc><lastmod>${a.dateISO}</lastmod></url>`)
  .join('\n')}
</urlset>
`;
writeFileSync(join(root, 'sitemap.xml'), sitemap);

console.log(`Wrote ${articles.length} post pages, feed.xml, sitemap.xml`);
