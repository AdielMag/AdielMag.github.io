/* ===========================================================================
   Article page. Reads ?slug=, looks the post up in the shared manifest, and:
     - published -> fetches content/articles/<slug>.md and renders it
     - draft (or fetch fails) -> shows the design's "coming soon" placeholder
   =========================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug') || '';

  var article = (window.getArticle && window.getArticle(slug)) || null;
  // fall back to the first post if the slug is missing/unknown
  if (!article && window.ARTICLES && window.ARTICLES.length) article = window.ARTICLES[0];

  var tagEl   = document.getElementById('aTag');
  var titleEl = document.getElementById('aTitle');
  var metaEl  = document.getElementById('aMeta');
  var content = document.getElementById('aContent');

  if (!article) {
    titleEl.textContent = 'Article not found';
    tagEl.style.display = 'none';
    content.innerHTML = placeholderHtml();
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
    })
    .catch(function () {
      // couldn't load the file — degrade to the placeholder
      content.innerHTML = placeholderHtml();
    });

  // Remove a leading level-1 heading (and any BOM/blank lines before it).
  function stripLeadingH1(src) {
    return String(src).replace(/^\uFEFF?\s*#(?!#)\s+[^\n]*\n+/, '');
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

  function placeholderHtml() {
    return '' +
      '<div class="a-placeholder">' +
        '<p>This one\'s still being written. Full post — code, diagrams, the works — is coming soon.</p>' +
        '<p>In the meantime, check out what\'s <a href="index.html#projects">shipping</a> ' +
        'or head back to the <a href="index.html#articles">article list</a>.</p>' +
      '</div>';
  }
})();
