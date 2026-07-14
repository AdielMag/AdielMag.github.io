/* ===========================================================================
   Article page. Reads the slug (?slug= on article.html, or data-slug on the
   generated posts/ pages), looks the post up in the shared manifest, and:
     - published -> fetches content/articles/<slug>.md, renders it, then wires
       the hero art, reactions, tags, read-next cards, and the Giscus comments
     - draft (or fetch fails) -> shows the "coming soon" placeholder
   Recreated from the Claude Design handoff (Article Page.dc.html).
   =========================================================================== */
(function () {
  'use strict';

  // Giscus (GitHub Discussions) config — free, shared comments, no backend.
  var GISCUS = {
    repo: 'AdielMag/AdielMag.github.io',
    repoId: 'R_kgDOTTtcOQ',
    category: 'Announcements',
    categoryId: 'DIC_kwDOTTtcOc4DBK8W',
    theme: 'transparent_dark',
  };

  // Small display tags per post (the kebab chips under the article).
  var TAGS_BY_SLUG = {
    'dumb-client-manifesto': ['netcode', 'clashup', 'multiplayer'],
    'zero-idle-game-servers': ['servers', 'gcp', 'cost'],
    'version-aware-gateway': ['servers', 'deployment', 'gateway'],
    'claude-memory-vault': ['ai', 'claude', 'workflow'],
    'time-vegas': ['trading', 'risk', 'prediction-markets'],
    'stop-loss-depth-check': ['trading', 'orderbook', 'risk'],
    'the-bug-was-a-dollar-sign': ['quant', 'postmortem', 'volatility'],
    'when-95-cents-is-cheap': ['quant', 'z-score', 'pricing'],
    'manipulation-resistance-index': ['quant', 'microstructure', 'defense'],
    'backtest-confessions': ['trading', 'backtesting', 'data'],
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug') || document.body.getAttribute('data-slug') || '';
  var article = (window.getArticle && window.getArticle(slug)) || null;

  var tagEl   = document.getElementById('aTag');
  var metaEl  = document.getElementById('aMeta');
  var titleEl = document.getElementById('aTitle');
  var subEl   = document.getElementById('aSub');
  var heroEl  = document.getElementById('aHero');
  var content = document.getElementById('aContent');
  var reactEl = document.getElementById('aReactions');
  var tagsEl  = document.getElementById('aTags');
  var commentsEl = document.getElementById('aComments');
  var readNextEl = document.getElementById('aReadNext');

  // Elements/sections to hide when there's nothing to show them for.
  var heroWrap  = document.querySelector('.art-hero-wrap');
  var footWrap  = document.querySelector('.art-foot');
  var reactWrap = document.querySelector('.reactions');
  var commentsSec = document.querySelector('.comments');
  var readNextSec = document.querySelector('.readnext');

  function hide(el) { if (el) el.style.display = 'none'; }

  if (!article) {
    document.title = 'Post not found — devlog.';
    if (titleEl) titleEl.textContent = 'Post not found';
    if (tagEl) tagEl.style.display = 'none';
    if (metaEl) metaEl.textContent = 'that link doesn’t match any post';
    if (subEl) subEl.style.display = 'none';
    if (content) content.innerHTML = notFoundHtml();
    hide(heroWrap); hide(footWrap); hide(reactWrap); hide(commentsSec); hide(readNextSec);
    return;
  }

  document.title = article.title + ' — devlog.';
  if (tagEl) {
    tagEl.textContent = (article.tag || '').toUpperCase();
    tagEl.style.background = article.tagBg;
    tagEl.style.color = article.tagColor;
  }
  if (titleEl) titleEl.textContent = article.title;
  if (subEl) subEl.textContent = article.excerpt || '';
  if (heroEl && article.hero) heroEl.style.backgroundImage = "url('" + article.hero + "')";

  var published = article.status === 'published';
  if (metaEl) metaEl.textContent = published ? (article.date || 'published') : 'draft — not published yet';

  // read-next + tags don't depend on the body — render them now
  renderTags();
  renderReadNext();

  if (!published) {
    if (content) content.innerHTML = placeholderHtml();
    hide(heroWrap); hide(reactWrap); hide(footWrap); hide(commentsSec); hide(readNextSec);
    return;
  }

  // reactions + comments are for real, published posts
  renderReactions();
  mountGiscus();

  // published: load and render the Markdown file
  fetch('content/articles/' + article.slug + '.md', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (md) {
      var body = document.createElement('div');
      body.className = 'a-body';
      body.style.animation = 'articleZoomIn 0.4s ease both';
      body.innerHTML = window.renderMarkdown(stripLeadingH1(md));
      content.innerHTML = '';
      content.appendChild(body);
      stripDuplicateHero(body);
      setupLightbox(body);
      mountDemos(body);
      if (metaEl) metaEl.textContent = (article.date || 'published') + ' · ' + readTime(md) + ' min read';
    })
    .catch(function () {
      content.innerHTML = placeholderHtml();
      hide(heroWrap); hide(reactWrap); hide(footWrap); hide(commentsSec);
    });

  // ---- read time ----------------------------------------------------------
  function readTime(md) {
    var words = String(md).trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  // Remove a leading level-1 heading (title is already shown in the header).
  function stripLeadingH1(src) {
    return String(src).replace(/^﻿?\s*#(?!#)\s+[^\n]*\n+/, '');
  }

  // The hero art at the top of the page is the post's first diagram; drop the
  // duplicate copy that the Markdown embeds inline.
  function stripDuplicateHero(scope) {
    if (!article.hero) return;
    var file = article.hero.split('/').pop();
    var first = scope.querySelector('img');
    if (!first) return;
    var src = first.getAttribute('src') || '';
    if (src.split('/').pop() !== file) return;
    var p = first.closest('p');
    if (p && !p.textContent.trim()) p.remove(); else first.remove();
  }

  // ---- reactions (remembered locally on this device) ----------------------
  function renderReactions() {
    if (!reactEl) return;
    var key = 'devlog-react-' + article.slug;
    var vote = null;
    try { vote = localStorage.getItem(key); } catch (e) {}

    var THUMB_UP = '<svg width="17" height="17" viewBox="0 0 24 24" fill="{{fill}}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"></path></svg>';
    var THUMB_DN = '<svg width="17" height="17" viewBox="0 0 24 24" fill="{{fill}}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path></svg>';

    function draw() {
      var up = vote === 'up', down = vote === 'down';
      reactEl.innerHTML =
        '<button class="react-btn like' + (up ? ' is-on' : '') + '" type="button">' +
          THUMB_UP.replace('{{fill}}', up ? 'rgba(124,242,156,0.25)' : 'none') +
          '<span>' + (up ? 1 : 0) + '</span></button>' +
        '<button class="react-btn dislike' + (down ? ' is-on' : '') + '" type="button">' +
          THUMB_DN.replace('{{fill}}', down ? 'rgba(255,107,74,0.25)' : 'none') +
          '<span>' + (down ? 1 : 0) + '</span></button>';
      reactEl.querySelector('.like').onclick = function () { set(up ? null : 'up'); };
      reactEl.querySelector('.dislike').onclick = function () { set(down ? null : 'down'); };
    }
    function set(v) {
      vote = v;
      try { if (v) localStorage.setItem(key, v); else localStorage.removeItem(key); } catch (e) {}
      draw();
    }
    draw();
  }

  // ---- tags ---------------------------------------------------------------
  function renderTags() {
    if (!tagsEl) return;
    var tags = TAGS_BY_SLUG[article.slug] || [String(article.tag || '').toLowerCase()];
    tagsEl.innerHTML = tags.map(function (t) {
      return '<span class="tag-mono">' + esc(t) + '</span>';
    }).join('');
  }

  // ---- read next (two other published posts, same tag first) --------------
  function renderReadNext() {
    if (!readNextEl) return;
    var all = (window.ARTICLES || []).filter(function (a) {
      return a.status === 'published' && a.slug !== article.slug;
    });
    var same = all.filter(function (a) { return a.tag === article.tag; });
    var rest = all.filter(function (a) { return a.tag !== article.tag; });
    var pick = same.concat(rest).slice(0, 2);
    if (!pick.length) { hide(readNextSec); return; }
    readNextEl.innerHTML = pick.map(function (a) {
      return '<a class="rn-card" href="posts/' + encodeURIComponent(a.slug) + '.html" style="--tc:' + a.tagColor + '"' +
             ' onmouseover="this.style.borderColor=\'' + a.tagColor + '\'"' +
             ' onmouseout="this.style.borderColor=\'\'">' +
        '<div class="rn-top">' +
          '<span class="tag-cat" style="background:' + a.tagBg + ';color:' + a.tagColor + '">' + esc((a.tag || '').toUpperCase()) + '</span>' +
          '<span class="article-date">' + esc(a.date || '') + '</span>' +
        '</div>' +
        '<div class="rn-title">' + esc(a.title) + '</div>' +
        '<div class="rn-read" style="color:' + a.tagColor + '">Read →</div>' +
      '</a>';
    }).join('');
  }

  // ---- Giscus comments ----------------------------------------------------
  function mountGiscus() {
    if (!commentsEl) return;
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', GISCUS.repo);
    s.setAttribute('data-repo-id', GISCUS.repoId);
    s.setAttribute('data-category', GISCUS.category);
    s.setAttribute('data-category-id', GISCUS.categoryId);
    // map every URL for this post (article.html?slug= and posts/<slug>.html) to
    // one discussion, keyed by slug
    s.setAttribute('data-mapping', 'specific');
    s.setAttribute('data-term', article.slug);
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'top');
    s.setAttribute('data-theme', GISCUS.theme);
    s.setAttribute('data-lang', 'en');
    var holder = document.createElement('div');
    holder.className = 'giscus';
    commentsEl.appendChild(holder);
    commentsEl.appendChild(s);
  }

  // ---- swap a "[demo:<id>]" paragraph for an interactive widget ------------
  function mountDemos(scope) {
    if (!window.NetcodeDemos) return;
    Array.prototype.forEach.call(scope.querySelectorAll('p'), function (p) {
      var m = /^\[demo:([a-z]+)\]$/.exec((p.textContent || '').trim());
      if (!m) return;
      var build = window.NetcodeDemos[m[1]];
      if (!build) return;
      var holder = document.createElement('div');
      p.parentNode.replaceChild(holder, p);
      try { build(holder); } catch (e) { holder.remove(); }
    });
  }

  // ---- click-to-enlarge lightbox for diagrams -----------------------------
  function setupLightbox(scope) {
    var imgs = scope.querySelectorAll('img');
    if (!imgs.length) return;

    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Close">×</button>' +
      '<img class="lightbox-img" alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('.lightbox-img');

    function open(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    Array.prototype.forEach.call(imgs, function (img) {
      var fig = document.createElement('figure');
      fig.className = 'a-figure';
      img.parentNode.insertBefore(fig, img);
      fig.appendChild(img);
      var cap = document.createElement('figcaption');
      cap.className = 'a-figcap';
      cap.textContent = '⤢ Click to enlarge';
      fig.appendChild(cap);
      img.addEventListener('click', function () { open(img.getAttribute('src'), img.getAttribute('alt')); });
    });

    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function notFoundHtml() {
    return '<div class="a-placeholder">' +
      '<p>There\'s no post at this address — the link may be mistyped or the post may have moved.</p>' +
      '<p>Head back to the <a href="index.html#articles">article list</a> to find what you were after.</p>' +
    '</div>';
  }
  function placeholderHtml() {
    return '<div class="a-placeholder">' +
      '<p>This one\'s still being written. Full post — code, diagrams, the works — is coming soon.</p>' +
      '<p>In the meantime, check out what\'s <a href="index.html#projects">shipping</a> ' +
      'or head back to the <a href="index.html#articles">article list</a>.</p>' +
    '</div>';
  }
})();
