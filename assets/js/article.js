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
      body.innerHTML = window.renderMarkdown(md);
      content.innerHTML = '';
      content.appendChild(body);
    })
    .catch(function () {
      // couldn't load the file — degrade to the placeholder
      content.innerHTML = placeholderHtml();
    });

  function placeholderHtml() {
    return '' +
      '<div class="a-placeholder">' +
        '<p>This one\'s still being written. Full post — code, diagrams, the works — is coming soon.</p>' +
        '<p>In the meantime, check out what\'s <a href="index.html#projects">shipping</a> ' +
        'or head back to the <a href="index.html#articles">article list</a>.</p>' +
      '</div>';
  }
})();
