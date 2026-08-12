/* ===========================================================================
   Article page. Reads the slug (?slug= on article.html, or data-slug on the
   generated posts/ pages), looks the post up in the shared manifest, and:
     - published -> wires the hero art, tags, read-next cards, and the Giscus
       comments around the body. The generated posts/ pages already
       contain the rendered body, so only article.html?slug= fetches and renders
       content/articles/<slug>.md at runtime.
     - draft -> shows the "coming soon" placeholder
   Recreated from the Claude Design handoff (Article Page.dc.html).
   =========================================================================== */
(function () {
  'use strict';

  // Giscus (GitHub Discussions) config - free, shared comments, no backend.
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
  var tagsEl  = document.getElementById('aTags');
  var commentsEl = document.getElementById('aComments');
  var readNextEl = document.getElementById('aReadNext');

  // Elements/sections to hide when there's nothing to show them for.
  var heroWrap  = document.querySelector('.art-hero-wrap');
  var footWrap  = document.querySelector('.art-foot');
  var commentsSec = document.querySelector('.comments');
  var readNextSec = document.querySelector('.readnext');

  function hide(el) { if (el) el.style.display = 'none'; }

  if (!article) {
    document.title = 'Post not found - devlog.';
    if (titleEl) titleEl.textContent = 'Post not found';
    if (tagEl) tagEl.style.display = 'none';
    if (metaEl) metaEl.textContent = 'that link doesn’t match any post';
    if (subEl) subEl.style.display = 'none';
    if (content) content.innerHTML = notFoundHtml();
    hide(heroWrap); hide(footWrap); hide(commentsSec); hide(readNextSec);
    return;
  }

  document.title = article.title + ' - devlog.';
  // The post's tag colour drives the whole page: rules, links, focus ring,
  // figure captions, read-next borders. A Server post reads gold throughout.
  // The generated posts/ pages already carry this inline; setting it again is
  // harmless and covers the article.html?slug= route.
  if (article.tagColor) document.documentElement.style.setProperty('--accent', article.tagColor);
  // article.html?slug= renders the same post as posts/<slug>.html. Point search
  // engines at the generated page so the two don't compete as duplicates.
  if (!document.querySelector('link[rel="canonical"]')) {
    var canon = document.createElement('link');
    canon.rel = 'canonical';
    canon.href = 'https://adielmag.github.io/posts/' + encodeURIComponent(article.slug) + '.html';
    document.head.appendChild(canon);
  }
  if (tagEl) {
    tagEl.textContent = (article.tag || '').toUpperCase();
    tagEl.style.background = article.tagBg;
    tagEl.style.color = article.tagColor;
  }
  if (titleEl) titleEl.textContent = article.title;
  if (subEl) subEl.textContent = article.excerpt || '';
  if (heroEl && article.hero) heroEl.style.backgroundImage = "url('" + article.hero + "')";

  var published = article.status === 'published';
  if (metaEl) metaEl.textContent = published ? (article.date || 'published') : 'draft - not published yet';

  // read-next + tags don't depend on the body - render them now
  renderTags();
  renderReadNext();

  if (!published) {
    if (content) content.innerHTML = placeholderHtml();
    hide(heroWrap); hide(footWrap); hide(commentsSec); hide(readNextSec);
    return;
  }

  // Comments (and their reactions) come from Giscus. There used to be a
  // like/dislike pair here too, but it only ever read 0 or 1 off localStorage -
  // a private toggle drawn as a public score, directly above the real thing.
  mountGiscus();

  // The generated posts/ pages ship the body already rendered. Only the
  // fallback article.html?slug= route has to fetch and render it here.
  var prerendered = content && content.querySelector('.a-body');
  if (prerendered) {
    enhance(prerendered);
  } else {
    fetch('content/articles/' + article.slug + '.md', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (md) {
        var body = document.createElement('div');
        body.className = 'a-body';
        body.style.animation = 'articleZoomIn 0.4s ease both';
        body.innerHTML = window.renderMarkdown(stripLeadingH1(md));
        content.innerHTML = '';
        content.appendChild(body);
        enhance(body);
        if (metaEl) metaEl.textContent = (article.date || 'published') + ' · ' + readTime(md) + ' min read';
      })
      .catch(function () {
        // A published post that won't load is a failure, not a draft - say so
        // rather than claiming it hasn't been written, and leave comments up.
        content.innerHTML = loadErrorHtml();
      });
  }

  function enhance(body) {
    stripDuplicateHero(body);
    setupLightbox(body);
    mountDemos(body);
  }

  // ---- read time ----------------------------------------------------------
  function readTime(md) {
    // prose only - code fences and [demo:] markers aren't read
    var prose = String(md).replace(/```[\s\S]*?```/g, '').replace(/^\[demo:[a-z]+\]$/gm, '');
    return Math.max(1, Math.round(prose.trim().split(/\s+/).length / 200));
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
    if (!window.ArticleDemos) return;
    // The generated pages carry <div class="demo-mount" data-demo="id">; the
    // article.html?slug= route renders straight from Markdown and still has the
    // literal "[demo:id]" paragraph. Both end up here.
    var targets = [];
    Array.prototype.forEach.call(scope.querySelectorAll('[data-demo]'), function (el) {
      targets.push([el, el.getAttribute('data-demo')]);
    });
    Array.prototype.forEach.call(scope.querySelectorAll('p'), function (p) {
      var m = /^\[demo:([a-z]+)\]$/.exec((p.textContent || '').trim());
      if (m) targets.push([p, m[1]]);
    });
    targets.forEach(function (pair) {
      var p = pair[0];
      var build = window.ArticleDemos[pair[1]];
      if (!build) return;
      var holder = document.createElement('div');
      p.parentNode.replaceChild(holder, p);
      // defer one frame: this runs right after a big innerHTML swap, and a
      // synchronous canvas-width measurement here can catch a transient
      // layout state before the browser settles the new content's box
      requestAnimationFrame(function () {
        try { build(holder); } catch (e) { holder.remove(); }
      });
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
      '<button class="lightbox-close" type="button" aria-label="Close image">×</button>' +
      '<img class="lightbox-img" alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('.lightbox-img');
    var lbClose = lb.querySelector('.lightbox-close');
    var lastFocused = null;

    function open(src, alt, opener) {
      lbImg.src = src; lbImg.alt = alt || '';
      lastFocused = opener || document.activeElement;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }
    function close() {
      if (!lb.classList.contains('open')) return;
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      lastFocused = null;
    }

    Array.prototype.forEach.call(imgs, function (img) {
      var alt = img.getAttribute('alt') || '';
      // The generated pages already ship the <figure> and its caption. Only the
      // article.html?slug= route, which renders Markdown at runtime, needs them
      // built here.
      if (!img.closest('.a-figure')) {
        var fig = document.createElement('figure');
        fig.className = 'a-figure';
        img.parentNode.insertBefore(fig, img);
        fig.appendChild(img);
        // The alt text is a full sentence describing the diagram, so it makes a
        // real caption. It used to say "Click to enlarge" on every single
        // figure - an instruction sitting where the explanation belongs.
        if (alt) {
          var cap = document.createElement('figcaption');
          cap.className = 'a-figcap';
          cap.textContent = alt;
          fig.appendChild(cap);
        }
      }
      // enlarging is a real action, so the image has to behave like a control
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge diagram' + (alt ? ': ' + alt : ''));
      function openThis() { open(img.getAttribute('src'), alt, img); }
      img.addEventListener('click', openThis);
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
      });
    });

    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // the dialog holds two focusable things; keep Tab inside it
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !lb.classList.contains('open')) return;
      e.preventDefault();
      lbClose.focus();
    });
  }

  function notFoundHtml() {
    return '<div class="a-placeholder">' +
      '<p>There\'s no post at this address - the link may be mistyped or the post may have moved.</p>' +
      '<p>Head back to the <a href="index.html#articles">article list</a> to find what you were after.</p>' +
    '</div>';
  }
  function loadErrorHtml() {
    return '<div class="a-placeholder">' +
      "<p>This post didn't load. That's on the site, not on you - a reload usually sorts it.</p>" +
      '<p>Otherwise the <a href="index.html#articles">article list</a> has everything else.</p>' +
    '</div>';
  }
  function placeholderHtml() {
    return '<div class="a-placeholder">' +
      '<p>This one\'s still being written. Full post - code, diagrams, the works - is coming soon.</p>' +
      '<p>In the meantime, check out what\'s <a href="index.html#projects">shipping</a> ' +
      'or head back to the <a href="index.html#articles">article list</a>.</p>' +
    '</div>';
  }
})();
