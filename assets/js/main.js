/* ===========================================================================
   Landing-page controller. Reimplements the prototype's DCLogic renderVals():
   scroll-driven nav background, parallax blobs, the section-progress dots, and
   the mouse-following hero smiley. Also builds the article cards from the
   shared window.ARTICLES manifest.
   =========================================================================== */
(function () {
  'use strict';

  // baked-in defaults from the design's editor knobs
  var INTENSITY = 0.5;   // floatIntensity

  var nav       = document.getElementById('nav');
  var blobA     = document.getElementById('blobA');
  var blobB     = document.getElementById('blobB');
  var projBlobA = document.getElementById('projBlobA');
  var projBlobB = document.getElementById('projBlobB');
  var smiley    = document.getElementById('smiley');
  var hero      = document.getElementById('top');
  var indicator = document.getElementById('indicator');

  var dots = {
    top:      { el: document.getElementById('dotHero'),     color: '#ff6b4a' },
    projects: { el: document.getElementById('dotProjects'), color: '#ffd23f' },
    articles: { el: document.getElementById('dotArticles'), color: '#7cf29c' },
  };

  function mk(rate, scrollY) {
    return 'translate3d(0px, ' + (scrollY * rate * INTENSITY).toFixed(1) + 'px, 0)';
  }

  function setDot(name, active) {
    var d = dots[name];
    if (!d.el) return;
    var on = active === name;
    d.el.style.width = on ? '12px' : '8px';
    d.el.style.height = on ? '12px' : '8px';
    d.el.style.background = on ? d.color : 'rgba(255,255,255,0.25)';
  }

  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset || 0;

    var projectsEl = document.getElementById('projects');
    var articlesEl = document.getElementById('articles');
    var marker = scrollY + window.innerHeight * 0.4;
    var active = 'top';
    if (articlesEl && marker >= articlesEl.offsetTop) active = 'articles';
    else if (projectsEl && marker >= projectsEl.offsetTop) active = 'projects';

    if (nav) nav.style.background = scrollY > 8 ? 'rgba(21,19,24,0.85)' : 'rgba(21,19,24,0)';
    if (blobA) blobA.style.transform = mk(0.08, scrollY);
    if (blobB) blobB.style.transform = mk(-0.06, scrollY);
    if (projBlobA) projBlobA.style.transform = mk(-0.04, scrollY);
    if (projBlobB) projBlobB.style.transform = mk(0.05, scrollY);

    if (indicator) {
      var op = Math.max(0, Math.min(1, (scrollY - 60) / 160));
      indicator.style.opacity = op;
      indicator.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
    }

    setDot('top', active);
    setDot('projects', active);
    setDot('articles', active);
  }

  if (hero && smiley) {
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      smiley.style.left = (e.clientX - rect.left) + 'px';
      smiley.style.top = (e.clientY - rect.top) + 'px';
      smiley.style.opacity = 1;
    });
  }

  // ---- article cards from the manifest -----------------------------------
  var HOVER = { coral: 'hover-coral', gold: 'hover-gold', green: 'hover-green', white: 'hover-white' };

  function renderArticles() {
    var grid = document.getElementById('articleGrid');
    if (!grid || !window.ARTICLES) return;

    window.ARTICLES.forEach(function (a) {
      var card = document.createElement('a');
      card.className = 'article-card ' + (HOVER[a.accent] || 'hover-coral');
      card.href = 'article.html?slug=' + encodeURIComponent(a.slug);

      var top = document.createElement('div');
      top.className = 'article-card-top';

      var tag = document.createElement('span');
      tag.className = 'article-tag';
      tag.style.background = a.tagBg;
      tag.style.color = a.tagColor;
      tag.textContent = a.tag;

      var status = document.createElement('span');
      status.className = 'article-status';
      status.textContent = a.status === 'published' ? (a.date || 'published') : 'draft';

      top.appendChild(tag);
      top.appendChild(status);

      var h3 = document.createElement('h3');
      h3.className = 'article-title';
      h3.textContent = a.title;

      var p = document.createElement('p');
      p.className = 'article-excerpt';
      p.textContent = a.excerpt || 'Full writeup coming soon.';

      card.appendChild(top);
      card.appendChild(h3);
      card.appendChild(p);
      grid.appendChild(card);
    });
  }

  renderArticles();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
