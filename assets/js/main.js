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
  var HOVER = { coral: 'hover-coral', gold: 'hover-gold', green: 'hover-green', white: 'hover-white', violet: 'hover-violet', blue: 'hover-blue' };

  function articleTop(a) {
    return '<div class="article-card-top">' +
      '<span class="article-tag" style="background:' + a.tagBg + ';color:' + a.tagColor + '">' + esc(a.tag) + '</span>' +
      '<span class="article-status">' + esc(a.status === 'published' ? (a.date || 'published') : 'draft') + '</span>' +
      '</div>';
  }

  // The lead post gets a big two-column card with its hero diagram.
  function buildFeaturedArticle(a) {
    var card = document.createElement('a');
    card.className = 'article-feat ' + (HOVER[a.accent] || 'hover-coral');
    // static per-post pages (generated by tools/build-posts.mjs) so shared
    // links get real titles, descriptions, and preview images
    card.href = 'posts/' + encodeURIComponent(a.slug) + '.html';
    card.innerHTML =
      (a.hero ? '<div class="article-feat-media"><img src="' + a.hero + '" alt=""></div>' : '') +
      '<div class="article-feat-body">' +
        articleTop(a) +
        '<h3 class="article-feat-title">' + esc(a.title) + '</h3>' +
        '<p class="article-excerpt">' + esc(a.excerpt || '') + '</p>' +
        '<span class="article-read">Read the post →</span>' +
      '</div>';
    return card;
  }

  function buildArticleCard(a) {
    var card = document.createElement('a');
    card.className = 'article-card ' + (HOVER[a.accent] || 'hover-coral');
    // static per-post pages (generated by tools/build-posts.mjs) so shared
    // links get real titles, descriptions, and preview images
    card.href = 'posts/' + encodeURIComponent(a.slug) + '.html';
    card.innerHTML =
      articleTop(a) +
      '<h3 class="article-title">' + esc(a.title) + '</h3>' +
      '<p class="article-excerpt">' + esc(a.excerpt || 'Full writeup coming soon.') + '</p>';
    return card;
  }

  // ---- articles: tag filter + "show more" pagination ---------------------
  var ART_PAGE = 6;              // posts visible per "page"
  var artFilter = 'All';         // active tag filter
  var artVisible = ART_PAGE;     // how many of the filtered list are shown

  function filteredArticles() {
    return (window.ARTICLES || []).filter(function (a) {
      return artFilter === 'All' || a.tag === artFilter;
    });
  }

  function renderArticleFilters() {
    var bar = document.getElementById('articleFilters');
    if (!bar || !window.ARTICLES) return;
    var tags = ['All'];
    window.ARTICLES.forEach(function (a) {
      if (tags.indexOf(a.tag) === -1) tags.push(a.tag);
    });
    bar.innerHTML = '';
    tags.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'article-filter-pill' + (artFilter === tag ? ' is-active' : '');
      btn.textContent = tag;
      if (artFilter === tag && tag !== 'All') {
        // light the active pill with its tag colour
        var ref = null;
        window.ARTICLES.some(function (a) { if (a.tag === tag) { ref = a; return true; } return false; });
        if (ref) {
          btn.style.background = ref.tagBg;
          btn.style.color = ref.tagColor;
          btn.style.borderColor = 'transparent';
        }
      }
      btn.addEventListener('click', function () {
        if (artFilter === tag) return;
        artFilter = tag;
        artVisible = ART_PAGE;
        renderArticleFilters();
        renderArticles();
      });
      bar.appendChild(btn);
    });
  }

  function renderArticles() {
    var grid = document.getElementById('articleGrid');
    if (!grid || !window.ARTICLES) return;
    var list = filteredArticles();
    var shown = list.slice(0, artVisible);
    grid.innerHTML = '';
    shown.forEach(function (a, i) {
      grid.appendChild(
        (i === 0 && a.status === 'published') ? buildFeaturedArticle(a) : buildArticleCard(a)
      );
    });
    renderArticleMore(list, shown);
  }

  function renderArticleMore(list, shown) {
    var foot = document.getElementById('articleMore');
    if (!foot) return;
    foot.innerHTML = '';
    if (list.length <= ART_PAGE) return; // everything fits on one page

    var count = document.createElement('span');
    count.className = 'article-more-count';
    count.textContent = 'Showing ' + shown.length + ' of ' + list.length;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'article-more-btn';
    var remaining = list.length - shown.length;
    btn.textContent = remaining > 0
      ? 'Show more (' + remaining + ')'
      : 'Show less';
    btn.addEventListener('click', function () {
      if (remaining > 0) {
        artVisible += ART_PAGE;
        renderArticles();
      } else {
        artVisible = ART_PAGE;
        renderArticles();
        var section = document.getElementById('articles');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
    });

    foot.appendChild(count);
    foot.appendChild(btn);
  }

  // ---- projects: horizontal rail + background that follows the active one ---
  var PROJ_ORDER  = ['clashup', 'pokerface', 'royalbingo', 'solaria', 'swapheroes'];
  var PROJ_ACCENT = {
    clashup: '#ff6b4a', pokerface: '#ffd23f', royalbingo: '#9d7bff',
    solaria: '#7cf29c', swapheroes: '#4da3ff',
  };

  function renderProjects() {
    var rail = document.getElementById('projRail');
    if (!rail || !window.PROJECTS) return;
    var html = '';
    PROJ_ORDER.forEach(function (id) {
      var p = window.PROJECTS[id];
      if (!p) return;
      var accent = PROJ_ACCENT[id] || '#ff6b4a';
      var icon = ICONS[id] || '';
      var shot = (p.shots && p.shots[0]) || '';
      var statusCls = p.status === 'wip' ? 'wip' : (p.status === 'unavailable' ? 'gone' : 'live');
      html +=
        '<article class="proj-card" data-project="' + id + '" style="--accent:' + accent + '">' +
          '<div class="proj-shot">' +
            (shot ? '<img src="' + shot + '" alt="' + esc(p.name) + '" loading="lazy">' : '') +
            '<span class="proj-badge ' + statusCls + '">' + esc(p.statusLabel) + '</span>' +
          '</div>' +
          '<div class="proj-body">' +
            '<div class="proj-head">' +
              (icon ? '<img class="proj-icon" src="' + icon + '" alt="' + esc(p.name) + ' icon">' : '') +
              '<div class="proj-head-txt">' +
                '<h3 class="proj-name">' + esc(p.name) + '</h3>' +
                (p.publisher ? '<span class="proj-pub">by ' + esc(p.publisher) + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<p class="proj-tag">' + esc(p.tagline || '') + '</p>' +
            '<div class="proj-foot"><span class="proj-more">View details →</span></div>' +
          '</div>' +
        '</article>';
    });
    rail.innerHTML = html;
  }

  // Light the section with the accent of whichever card you're hovering.
  function initProjectTheme() {
    var rail = document.getElementById('projRail');
    var section = document.getElementById('projects');
    if (!rail || !section) return;
    var cards = Array.prototype.slice.call(rail.querySelectorAll('.proj-card'));
    if (!cards.length) return;

    function setActive(card) {
      cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
      section.style.setProperty('--active-accent',
        (card.style.getPropertyValue('--accent') || '#ff6b4a').trim());
    }

    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function () { setActive(c); });
    });

    // pre-tint the glow before anyone hovers, without lifting a card yet
    section.style.setProperty('--active-accent',
      (cards[0].style.getPropertyValue('--accent') || '#ff6b4a').trim());
  }

  // ---- ambient particle drift (canvas) -----------------------------------
  function initParticles() {
    var canvas = document.getElementById('particles');
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var COLORS = ['#ff6b4a', '#ffd23f', '#7cf29c', '#9d7bff', '#4da3ff'];
    var w = 0, h = 0, parts = [];

    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    function seed() {
      var n = Math.min(64, Math.round(window.innerWidth / 22));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.7 + 0.5,
          vx: (Math.random() - 0.5) * 0.14,
          vy: -(Math.random() * 0.24 + 0.05),
          base: Math.random() * 0.35 + 0.08,
          tw: Math.random() * Math.PI * 2,
          c: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
        ctx.globalAlpha = p.base * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize(); seed(); frame();
    window.addEventListener('resize', function () { resize(); seed(); });
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
    clashup: 'assets/img/clashup-icon.svg',
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

  renderProjects();
  renderArticleFilters();
  renderArticles();
  initProjects();
  initProjectTheme();
  initParticles();
  buildIconField();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
