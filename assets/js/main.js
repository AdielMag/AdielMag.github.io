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

  // ---- project details modal --------------------------------------------
  var APPLE_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.2-1.13 3-.77.88-2.02 1.56-3.06 1.48-.13-1.1.42-2.26 1.1-3 .77-.84 2.1-1.46 3.09-1.48zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.96-.98 1.56-2.37 3.5-4.08 3.51-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.97-1.71-.03-3.02-1.78-4-3.34-2.74-4.35-3.03-9.46-1.34-12.17 1.2-1.93 3.1-3.06 4.88-3.06 1.82 0 2.96 1 4.46 1 1.46 0 2.35-1 4.46-1 1.6 0 3.29.87 4.5 2.37-3.95 2.16-3.31 7.79.71 8.75z"/></svg>';
  var PLAY_SVG  = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l16 9-16 9z"/></svg>';
  var LINKOUT   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  var ICONS = {
    pokerface: 'assets/img/pokerface.png',
    swapheroes: 'assets/img/swapheroes.png',
    royalbingo: 'assets/img/comunix.png',
    solaria: 'assets/img/glaive.png',
    clashup: null,
  };
  var CHIPS = ['chip-coral', 'chip-gold', 'chip-green', 'chip-muted'];

  var overlay = document.getElementById('projectModal');
  var modalBody = document.getElementById('modalBody');
  var closeBtn = document.getElementById('modalClose');

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function linkBtn(l) {
    var glyph = l.kind === 'ios' ? APPLE_SVG : (l.kind === 'android' ? PLAY_SVG : LINKOUT);
    return '<a class="store-btn" href="' + esc(l.href) + '" target="_blank" rel="noopener">' +
      glyph + ' ' + esc(l.label) + '</a>';
  }

  function buildModal(p, id) {
    var iconSrc = ICONS[id];
    var iconHtml = iconSrc
      ? '<img class="modal-icon" src="' + iconSrc + '" alt="' + esc(p.name) + ' icon">'
      : '<div class="modal-icon" style="background:linear-gradient(145deg,#ff6b4a,#ffd23f);display:flex;align-items:center;justify-content:center;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:26px;color:#151318;">' + esc(p.name.charAt(0)) + '</div>';

    var statusCls = p.status === 'wip' ? 'wip' : (p.status === 'unavailable' ? 'unavailable' : '');
    var pubLogo = p.publisherLogo ? '<img src="' + p.publisherLogo + '" alt="' + esc(p.publisher) + ' logo">' : '';

    var gallery;
    if (p.shots && p.shots.length) {
      gallery = '<div class="gallery">' + p.shots.map(function (s, i) {
        return '<img src="' + s + '" alt="' + esc(p.name) + ' screenshot ' + (i + 1) + '" loading="lazy">';
      }).join('') + '</div>';
    } else {
      gallery = '<div class="gallery-note">' + esc(p.shotNote || 'No screenshots available.') + '</div>';
    }

    var facts = '<div class="facts">' + (p.facts || []).map(function (f) {
      return '<div class="fact"><span class="fact-k">' + esc(f[0]) + '</span><span class="fact-v">' + esc(f[1]) + '</span></div>';
    }).join('') + '</div>';

    var tags = '<div class="modal-tags">' + (p.tags || []).map(function (t, i) {
      return '<span class="chip ' + CHIPS[i % CHIPS.length] + '">' + esc(t) + '</span>';
    }).join('') + '</div>';

    var links = (p.links && p.links.length)
      ? '<div class="modal-links">' + p.links.map(linkBtn).join('') + '</div>'
      : '';

    return '' +
      '<div class="modal-head">' + iconHtml +
        '<div><h2 class="modal-title" id="modalTitle">' + esc(p.name) + '</h2>' +
          '<div class="modal-sub">' +
            '<span class="publisher">' + pubLogo + ' by <strong>' + esc(p.publisher) + '</strong></span>' +
            '<span class="modal-status ' + statusCls + '">' + esc(p.statusLabel) + '</span>' +
          '</div></div>' +
      '</div>' +
      gallery +
      '<p class="modal-desc">' + esc(p.description) + '</p>' +
      facts + tags + links;
  }

  function openProject(id) {
    var p = window.PROJECTS && window.PROJECTS[id];
    if (!p) return;
    modalBody.innerHTML = buildModal(p, id);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initProjects() {
    if (!overlay) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-project]'), function (card) {
      var id = card.getAttribute('data-project');
      card.style.cursor = 'pointer';

      // inject a "Details" affordance into the card's store-row
      var row = card.querySelector('.store-row');
      if (row) {
        var btn = document.createElement('button');
        btn.className = 'details-btn';
        btn.type = 'button';
        btn.innerHTML = 'View details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
        row.appendChild(btn);
      }

      card.addEventListener('click', function (e) {
        // let real links (store buttons) behave normally
        if (e.target.closest('a')) return;
        openProject(id);
      });
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  renderArticles();
  initProjects();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
