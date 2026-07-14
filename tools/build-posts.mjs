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
    <div class="footer">
      <div class="footer-links">
        <a class="footer-link" href="https://github.com/AdielMag" target="_blank" rel="noopener">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
        <a class="footer-link" href="mailto:adiel12430@gmail.com">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          Email
        </a>
        <a class="footer-link" href="feed.xml">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="19" r="2.4"/><path d="M3 10.5A10.5 10.5 0 0 1 13.5 21h3A13.5 13.5 0 0 0 3 7.5zM3 3.5A17.5 17.5 0 0 1 20.5 21h3A20.5 20.5 0 0 0 3 .5z"/></svg>
          RSS
        </a>
      </div>
      <p>Adiel Magenheim · game dev, mostly mobile, increasingly AI · 🕹️</p>
    </div>
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
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body data-slug="${a.slug}">
<div class="page">

  <div class="bg-dots" style="animation:none;"></div>

  <div class="article-page">

    <a href="index.html#articles" class="back-link">← Back to the blog</a>

    <div class="article-head">
      <span class="a-tag" id="aTag"></span>
      <h1 class="a-title" id="aTitle"></h1>
      <div class="a-byline">
        <span>Adiel Magenheim</span>
        <span>·</span>
        <span id="aMeta">draft — not published yet</span>
      </div>

      <div id="aContent"></div>
    </div>
${FOOTER}
  </div>

</div>

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
