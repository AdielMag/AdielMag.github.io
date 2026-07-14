/* ===========================================================================
   Landing-page controller. Builds the projects (featured ClashUp card + grid of
   shipped titles, each opening the details modal) and the article cards (tag
   filter + show-more) from the shared window.PROJECTS / window.ARTICLES data.
   Recreated from the Claude Design handoff (Devlog Redesign.dc.html).
   =========================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- nav: solidify background once scrolled ----------------------------
  var nav = document.getElementById('nav');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (nav) nav.style.background = y > 8 ? 'rgba(21,19,24,0.92)' : 'rgba(21,19,24,0.82)';
  }

  // ---- status label + pill class per project -----------------------------
  function statusMeta(status) {
    if (status === 'wip') return { cls: 'wip', label: 'IN DEVELOPMENT' };
    if (status === 'unavailable') return { cls: 'gone', label: 'DELISTED' };
    return { cls: 'live', label: 'LIVE' };
  }

  var ICONS = {
    pokerface: 'assets/img/pokerface.png',
    swapheroes: 'assets/img/swapheroes.png',
    royalbingo: 'assets/img/royalbingo.png',
    solaria: 'assets/img/solaria.png',
    clashup: 'assets/img/clashup-icon.svg',
  };

  // ---- projects: featured ClashUp card -----------------------------------
  function renderFeatured() {
    var holder = document.getElementById('projFeatured');
    var p = window.PROJECTS && window.PROJECTS.clashup;
    if (!holder || !p) return;
    var shot = (p.shots && p.shots[0]) || '';
    var tags = ['Multiplayer', 'Real-time', 'Deterministic physics'];
    holder.innerHTML =
      '<article class="proj-feat" data-project="clashup">' +
        '<div class="proj-feat-body">' +
          '<div class="proj-feat-labels">' +
            '<span class="pill-status wip">IN DEVELOPMENT</span>' +
            '<span class="proj-feat-meta">solo-built · client + server + physics</span>' +
          '</div>' +
          '<h3 class="proj-feat-name">ClashUp</h3>' +
          '<p class="proj-feat-desc">A fast, portrait-mode multiplayer brawler — Brawl Stars energy in one hand. ' +
            'Real-time 1v1 and team clashes on an authoritative server, powered by my own deterministic physics ' +
            'engine, <strong>AetherNet</strong>, so every player sees exactly the same fight, frame for frame.</p>' +
          '<div class="proj-feat-tags">' +
            tags.map(function (t) { return '<span class="tag-mono">' + esc(t) + '</span>'; }).join('') +
          '</div>' +
        '</div>' +
        '<div class="proj-feat-media" style="background-image:url(\'' + esc(shot) + '\')"></div>' +
      '</article>';
  }

  // ---- projects: grid of shipped titles ----------------------------------
  var GRID_ORDER = ['swapheroes', 'pokerface', 'royalbingo', 'solaria'];

  function renderProjectGrid() {
    var grid = document.getElementById('projGrid');
    if (!grid || !window.PROJECTS) return;
    var html = '';
    GRID_ORDER.forEach(function (id) {
      var p = window.PROJECTS[id];
      if (!p) return;
      var sm = statusMeta(p.status);
      var shot = (p.shots && p.shots[0]) || '';
      html +=
        '<article class="proj-card" data-project="' + id + '">' +
          '<div class="proj-card-shot" style="background-image:url(\'' + esc(shot) + '\')"></div>' +
          '<div class="proj-card-body">' +
            '<div class="proj-card-top">' +
              '<span class="pill-status mini ' + sm.cls + '">' + sm.label + '</span>' +
              '<span class="proj-card-pub">' + esc(p.publisher || '') + '</span>' +
            '</div>' +
            '<div class="proj-card-name">' + esc(p.name) + '</div>' +
            '<div class="proj-card-tag">' + esc(p.tagline || '') + '</div>' +
            '<div class="proj-card-link">View details →</div>' +
          '</div>' +
        '</article>';
    });
    grid.innerHTML = html;
  }

  // ---- articles: tag filter + show-more ----------------------------------
  var ART_INITIAL = 6;
  var artFilter = 'All';
  var artExpanded = false;

  function tagColorMap() {
    var map = { All: '#f4f1ea' };
    (window.ARTICLES || []).forEach(function (a) { if (!map[a.tag]) map[a.tag] = a.tagColor; });
    return map;
  }

  function filteredArticles() {
    return (window.ARTICLES || []).filter(function (a) {
      return artFilter === 'All' || a.tag === artFilter;
    });
  }

  function renderFilters() {
    var bar = document.getElementById('articleFilters');
    if (!bar || !window.ARTICLES) return;
    var colors = tagColorMap();
    var order = ['All'];
    (window.ARTICLES || []).forEach(function (a) { if (order.indexOf(a.tag) === -1) order.push(a.tag); });
    bar.innerHTML = '';
    order.forEach(function (tag) {
      var active = artFilter === tag;
      var c = colors[tag] || '#f4f1ea';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-pill';
      btn.textContent = tag;
      if (active) {
        btn.style.background = c;
        btn.style.color = '#151318';
        btn.style.borderColor = c;
      } else {
        btn.style.color = c;
      }
      btn.addEventListener('click', function () {
        if (artFilter === tag) return;
        artFilter = tag;
        artExpanded = false;
        renderFilters();
        renderArticles();
      });
      bar.appendChild(btn);
    });
  }

  function buildArticleCard(a) {
    var card = document.createElement('a');
    card.className = 'article-card';
    card.href = 'posts/' + encodeURIComponent(a.slug) + '.html';
    card.style.setProperty('--tc', a.tagColor);
    card.innerHTML =
      '<div class="article-card-media" style="background-image:url(\'' + esc(a.hero || '') + '\')"></div>' +
      '<div class="article-card-body">' +
        '<div class="article-card-top">' +
          '<span class="tag-cat" style="background:' + a.tagBg + ';color:' + a.tagColor + '">' + esc(a.tag) + '</span>' +
          '<span class="article-date">' + esc(a.date || '') + '</span>' +
        '</div>' +
        '<div class="article-card-title">' + esc(a.title) + '</div>' +
        '<div class="article-card-excerpt">' + esc(a.excerpt || '') + '</div>' +
        '<div class="article-card-read" style="color:' + a.tagColor + '">Read →</div>' +
      '</div>';
    return card;
  }

  function renderArticles() {
    var grid = document.getElementById('articleGrid');
    if (!grid || !window.ARTICLES) return;
    var list = filteredArticles();
    var shown = artExpanded ? list : list.slice(0, ART_INITIAL);
    grid.innerHTML = '';
    shown.forEach(function (a) { grid.appendChild(buildArticleCard(a)); });
    renderMore(list);
  }

  function renderMore(list) {
    var foot = document.getElementById('articleMore');
    if (!foot) return;
    foot.innerHTML = '';
    if (list.length <= ART_INITIAL) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'article-more-btn';
    var remaining = list.length - ART_INITIAL;
    btn.innerHTML = artExpanded
      ? 'Show less <span class="arrow">↑</span>'
      : 'Show ' + remaining + ' more articles <span class="arrow">↓</span>';
    btn.addEventListener('click', function () {
      artExpanded = !artExpanded;
      renderArticles();
      if (!artExpanded) {
        var s = document.getElementById('articles');
        if (s) s.scrollIntoView({ behavior: 'smooth' });
      }
    });
    foot.appendChild(btn);
  }

  /* =======================================================================
     Project details modal + screenshot gallery
     ======================================================================= */
  var APPLE_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.2-1.13 3-.77.88-2.02 1.56-3.06 1.48-.13-1.1.42-2.26 1.1-3 .77-.84 2.1-1.46 3.09-1.48zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.96-.98 1.56-2.37 3.5-4.08 3.51-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.97-1.71-.03-3.02-1.78-4-3.34-2.74-4.35-3.03-9.46-1.34-12.17 1.2-1.93 3.1-3.06 4.88-3.06 1.82 0 2.96 1 4.46 1 1.46 0 2.35-1 4.46-1 1.6 0 3.29.87 4.5 2.37-3.95 2.16-3.31 7.79.71 8.75z"/></svg>';
  var PLAY_SVG  = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l16 9-16 9z"/></svg>';
  var LINKOUT   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  var CHIPS = ['chip-coral', 'chip-gold', 'chip-green', 'chip-muted'];

  var overlay = document.getElementById('projectModal');
  var modalBody = document.getElementById('modalBody');
  var closeBtn = document.getElementById('modalClose');

  function linkBtn(l) {
    var glyph = l.kind === 'ios' ? APPLE_SVG : (l.kind === 'android' ? PLAY_SVG : LINKOUT);
    return '<a class="store-btn" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + glyph + ' ' + esc(l.label) + '</a>';
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
    if (!p || !overlay) return;
    modalBody.innerHTML = buildModal(p, id);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModal() {
    if (!overlay) return;
    // every project card / featured card carries data-project
    document.addEventListener('click', function (e) {
      var card = e.target.closest('[data-project]');
      if (!card) return;
      if (e.target.closest('a')) return; // let real links behave
      openProject(card.getAttribute('data-project'));
    });
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  // ---- boot ---------------------------------------------------------------
  renderFeatured();
  renderProjectGrid();
  renderFilters();
  renderArticles();
  initModal();
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
