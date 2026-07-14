/* ===========================================================================
   Article page. Reads ?slug=, looks the post up in the shared manifest, and:
     - published -> fetches content/articles/<slug>.md and renders it
     - draft (or fetch fails) -> shows the design's "coming soon" placeholder
   =========================================================================== */
(function () {
  'use strict';

  // Slug comes from ?slug= (article.html) or from a data-slug attribute
  // stamped on <body> by the static per-post pages in posts/.
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug') || document.body.getAttribute('data-slug') || '';

  var article = (window.getArticle && window.getArticle(slug)) || null;

  var tagEl   = document.getElementById('aTag');
  var titleEl = document.getElementById('aTitle');
  var metaEl  = document.getElementById('aMeta');
  var content = document.getElementById('aContent');

  if (!article) {
    document.title = 'Post not found — devlog.';
    titleEl.textContent = 'Post not found';
    tagEl.style.display = 'none';
    metaEl.textContent = 'that link doesn’t match any post';
    content.innerHTML = notFoundHtml();
    return;
  }

  document.title = article.title + ' — devlog.';
  tagEl.textContent = article.tag;
  tagEl.style.background = article.tagBg;
  tagEl.style.color = article.tagColor;
  titleEl.textContent = article.title;

  var published = article.status === 'published';
  metaEl.textContent = published
    ? (article.date || 'published')
    : 'draft — not published yet';

  if (!published) {
    content.innerHTML = placeholderHtml();
    return;
  }

  // published: load and render the Markdown file
  fetch('content/articles/' + article.slug + '.md', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (md) {
      var body = document.createElement('div');
      body.className = 'a-body';
      body.style.animation = 'articleZoomIn 0.4s ease both';
      // The page header already renders the title, so drop the Markdown's own
      // leading "# Title" to avoid showing it twice.
      body.innerHTML = window.renderMarkdown(stripLeadingH1(md));
      content.innerHTML = '';
      content.appendChild(body);
      setupLightbox(body);
      mountDemos(body);
    })
    .catch(function () {
      // couldn't load the file — degrade to the placeholder
      content.innerHTML = placeholderHtml();
    });

  // Remove a leading level-1 heading (and any BOM/blank lines before it).
  function stripLeadingH1(src) {
    return String(src).replace(/^\uFEFF?\s*#(?!#)\s+[^\n]*\n+/, '');
  }

  // Swap a standalone "[demo:<id>]" paragraph for an interactive widget.
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

  // Wrap each article image in a figure with a "click to enlarge" caption and
  // wire up a shared full-screen lightbox. The diagrams are SVG, so the enlarged
  // view stays crisp at any size.
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
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
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

      img.addEventListener('click', function () {
        open(img.getAttribute('src'), img.getAttribute('alt'));
      });
    });

    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function notFoundHtml() {
    return '' +
      '<div class="a-placeholder">' +
        '<p>There\'s no post at this address — the link may be mistyped or the post may have moved.</p>' +
        '<p>Head back to the <a href="index.html#articles">article list</a> to find what you were after.</p>' +
      '</div>';
  }

  function placeholderHtml() {
    return '' +
      '<div class="a-placeholder">' +
        '<p>This one\'s still being written. Full post — code, diagrams, the works — is coming soon.</p>' +
        '<p>In the meantime, check out what\'s <a href="index.html#projects">shipping</a> ' +
        'or head back to the <a href="index.html#articles">article list</a>.</p>' +
      '</div>';
  }
})();
