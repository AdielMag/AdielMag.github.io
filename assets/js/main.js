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
  var blobC     = document.getElementById('blobC');
  var blobD     = document.getElementById('blobD');
  var projBlobA = document.getElementById('projBlobA');
  var projBlobB = document.getElementById('projBlobB');
  var indicator = document.getElementById('indicator');
  var iconField = document.getElementById('iconField');
  var iconEls   = [];

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
    if (blobC) blobC.style.transform = mk(0.05, scrollY);
    if (blobD) blobD.style.transform = mk(-0.09, scrollY);
    if (projBlobA) projBlobA.style.transform = mk(-0.04, scrollY);
    if (projBlobB) projBlobB.style.transform = mk(0.05, scrollY);

    for (var gi = 0; gi < iconEls.length; gi++) {
      var el = iconEls[gi];
      el.style.transform = 'translate3d(0, ' + (scrollY * el._rate * INTENSITY).toFixed(1) + 'px, 0)';
    }

    if (indicator) {
      var op = Math.max(0, Math.min(1, (scrollY - 60) / 160));
      indicator.style.opacity = op;
      indicator.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
    }

    setDot('top', active);
    setDot('projects', active);
    setDot('articles', active);
  }

  // ---- full-page floating game-icon field --------------------------------
  var GICONS = [
    '<svg width="46" height="34" viewBox="0 0 46 34"><rect x="4" y="8" width="38" height="18" rx="8" fill="#ff6b4a"/><rect x="10" y="14" width="4" height="4" fill="#151318"/><rect x="6" y="18" width="4" height="4" fill="#151318"/><rect x="14" y="18" width="4" height="4" fill="#151318"/><circle cx="32" cy="14" r="2.5" fill="#151318"/><circle cx="37" cy="18" r="2.5" fill="#151318"/></svg>',
    '<svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="#ffd23f"/><circle cx="17" cy="17" r="9" fill="none" stroke="#151318" stroke-width="2"/><rect x="14" y="10" width="6" height="3" fill="#151318"/></svg>',
    '<svg width="40" height="40" viewBox="0 0 40 40"><polygon points="20,3 37,12 37,28 20,37 3,28 3,12" fill="#7cf29c"/><polygon points="20,3 37,12 20,20 3,12" fill="#a9f7c2"/><polygon points="20,20 37,12 37,28 20,37" fill="#54c67d"/></svg>',
    '<svg width="30" height="42" viewBox="0 0 30 42"><rect x="10" y="26" width="10" height="14" rx="2" fill="#3a3348"/><rect x="6" y="18" width="18" height="10" rx="4" fill="#ff6b4a"/><circle cx="15" cy="10" r="9" fill="#ffd23f"/></svg>',
    '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 22 L4 13 Q0 8 5 4 Q9 1 13 6 Q17 1 21 4 Q26 8 22 13 Z" fill="#ff6b4a"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,1 15,9 23,9 16,14 19,22 12,17 5,22 8,14 1,9 9,9" fill="#ffd23f"/></svg>',
    '<svg width="30" height="30" viewBox="0 0 32 32"><polygon points="16,3 27,13 16,29 5,13" fill="#7cf29c"/><polygon points="16,3 27,13 16,13" fill="#b6f7cd"/><polygon points="5,13 16,13 16,29" fill="#54c67d"/></svg>',
    '<svg width="24" height="30" viewBox="0 0 24 32"><polygon points="13,1 3,18 11,18 9,31 21,12 13,12" fill="#ffd23f"/></svg>',
    '<svg width="32" height="32" viewBox="0 0 34 34"><path d="M13 3 h8 v10 h10 v8 h-10 v10 h-8 v-10 h-10 v-8 h10 z" fill="#9d7bff"/></svg>',
    '<svg width="28" height="30" viewBox="0 0 30 32"><path d="M4 15 a11 11 0 0 1 22 0 v15 l-4 -3 l-3.5 3 l-3.5 -3 l-3.5 3 l-3.5 -3 z" fill="#f4f1ea"/><circle cx="11" cy="15" r="2.4" fill="#151318"/><circle cx="19" cy="15" r="2.4" fill="#151318"/></svg>'
  ];
  // [iconIndex, left%, top%, scale, opacity, parallaxRate, bobDur, bobDelay, rotDeg]
  var PLACE = [
    [0,  6, 12, 1.0, 0.45,  0.07, 5.5, 0.0,  -8],
    [5, 90,  8, 0.9, 0.40,  0.11, 6.0, 0.5,  10],
    [2, 84, 24, 1.1, 0.35,  0.05, 6.5, 0.8,   6],
    [3, 14, 32, 0.8, 0.30,  0.09, 5.0, 0.2,  -6],
    [4,  3,  7, 0.7, 0.35,  0.13, 4.8, 0.6,  14],
    [7, 95, 40, 0.8, 0.28, -0.06, 6.2, 0.3, -10],
    [8, 72, 15, 0.7, 0.22,  0.10, 5.6, 1.0,   8],
    [6, 42,  5, 0.7, 0.20,  0.08, 5.2, 0.4,  -4],
    [1, 22, 70, 0.9, 0.30, -0.08, 6.0, 0.7,  12],
    [9, 88, 62, 0.9, 0.25,  0.06, 6.8, 0.2,  -8],
    [5, 10, 54, 0.7, 0.22,  0.12, 4.6, 0.9,   6],
    [2, 60, 46, 0.6, 0.15, -0.05, 6.4, 0.1,  10],
    [3, 80, 82, 0.8, 0.28,  0.09, 5.4, 0.5, -12],
    [0, 34, 88, 0.8, 0.26, -0.07, 5.8, 0.8,   8],
    [4, 52, 92, 0.7, 0.24,  0.11, 5.0, 0.3, -14],
    [8,  6, 84, 0.7, 0.22,  0.07, 6.0, 0.6,  10],
    [6, 94, 90, 0.7, 0.20, -0.06, 6.6, 0.4,  -6],
    [7, 46, 62, 0.6, 0.15,  0.10, 5.2, 1.1,   6],
    [1, 68, 30, 0.6, 0.18,  0.08, 5.6, 0.2,  -8],
    [9, 30, 18, 0.6, 0.18, -0.09, 6.2, 0.7,  12]
  ];

  function buildIconField() {
    if (!iconField) return;
    var html = '';
    for (var i = 0; i < PLACE.length; i++) {
      var p = PLACE[i];
      html += '<div class="gicon" data-rate="' + p[5] + '" style="left:' + p[1] + '%; top:' + p[2] + '%; opacity:' + p[4] + ';">' +
                '<div style="transform:scale(' + p[3] + ');">' +
                  '<div style="animation:floatBob ' + p[6] + 's ease-in-out infinite ' + p[7] + 's; --rot:' + p[8] + 'deg;">' +
                    GICONS[p[0]] +
                  '</div></div></div>';
    }
    iconField.innerHTML = html;
    iconEls = Array.prototype.slice.call(iconField.querySelectorAll('.gicon'));
    for (var j = 0; j < iconEls.length; j++) {
      iconEls[j]._rate = parseFloat(iconEls[j].getAttribute('data-rate')) || 0;
    }
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
    royalbingo: 'assets/img/royalbingo.png',
    solaria: 'assets/img/solaria.png',
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
  buildIconField();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
