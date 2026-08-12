/* ===========================================================================
   Shared low-level widgets for in-article canvas demos: DOM controls (hold/tap
   buttons, toggles, sliders), a DPR-scaled canvas stage, and small drawing
   helpers (dots, lanes, labels, a frame loop). Demo files (netcode-demos.js,
   trading-demos.js, infra-demos.js) build on top of window.DemoKit and each
   register their widgets into window.ArticleDemos; article.js mounts them by
   matching a "[demo:<id>]" paragraph in the post body.
   =========================================================================== */
(function () {
  'use strict';

  // Straight off the site tokens in assets/css/styles.css - the demos are part
  // of this site, not a different one.
  var COL = {
    you: '#ff6b4a', server: '#6cb6ff', remote: '#7cf29c', gold: '#ffd23f',
    purple: '#a78bfa', bad: '#ff6b4a', mut: '#9a92a8', ink: '#f4f1ea', line: '#2a2733',
  };

  // Canvas text can't use var(), so the stack is spelled out. It must stay in
  // step with --sans; drawing in a font the page never loads is how these
  // labels ended up in a different typeface from the prose.
  var SANS = "'Space Grotesk', system-ui, -apple-system, sans-serif";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function now() { return performance.now(); }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // press-and-hold or tap button; onHold(dir) sets state, returns the element
  function holdButton(label, onDown, onUp) {
    var b = el('button', 'demo-btn', label);
    b.type = 'button';
    var held = false;
    var down = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if (held) return;
      held = true; b.classList.add('pressed'); onDown();
    };
    var up = function () {
      if (!held) return;
      held = false; b.classList.remove('pressed'); if (onUp) onUp();
    };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
    // Enter/Space hold the button for as long as the key is held, so the demo
    // is drivable without a pointer. Key repeat is why `held` guards re-entry.
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') down(e); });
    b.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') up(); });
    b.addEventListener('blur', up);
    return b;
  }

  function tapButton(label, onTap) {
    var b = el('button', 'demo-btn', label);
    b.type = 'button';
    b.addEventListener('click', onTap);
    return b;
  }

  // on/off pill; get()/set via .on
  function toggle(label, initial, onChange) {
    var b = el('button', 'demo-toggle', label);
    b.type = 'button';
    b.on = !!initial;
    function paint() { b.classList.toggle('on', b.on); b.setAttribute('aria-pressed', b.on); }
    b.addEventListener('click', function () { b.on = !b.on; paint(); if (onChange) onChange(b.on); });
    paint();
    return b;
  }

  // labeled range; .value() returns number
  function slider(label, min, max, val, step, unit) {
    var wrap = el('label', 'demo-range');
    var head = el('span', 'demo-range-head');
    var name = el('span', null, label);
    var read = el('span', 'demo-range-val', val + unit);
    head.appendChild(name); head.appendChild(read);
    var input = el('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = val;
    input.addEventListener('input', function () { read.textContent = input.value + unit; });
    wrap.appendChild(head); wrap.appendChild(input);
    wrap.value = function () { return parseFloat(input.value); };
    return wrap;
  }

  // The most recently built demo root. Every demo calls frame() and then loop()
  // synchronously, so loop() can bind to the widget it belongs to without every
  // call site having to pass it.
  var currentRoot = null;

  function frame(host, cls) {
    var wrap = el('div', 'demo ' + (cls || ''));
    host.appendChild(wrap);
    currentRoot = wrap;
    return wrap;
  }

  // canvas with DPR scaling + auto width; returns { ctx, W, H }
  function stage(wrap, height) {
    var box = el('div', 'demo-stage');
    box.style.height = height + 'px'; // fixed height; canvas absolutely fills it
    var canvas = el('canvas', 'demo-canvas');
    box.appendChild(canvas);
    wrap.appendChild(box);
    var ctx = canvas.getContext('2d');
    var s = { ctx: ctx, W: 600, H: height, canvas: canvas };
    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var w = box.clientWidth || wrap.clientWidth || 600; // measure the container, not the canvas
      s.W = w;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    s.resize = resize;
    window.addEventListener('resize', resize);
    // If the demo is ever torn out of the page, take its listener with it.
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(resize);
      ro.observe(box);
      s.stop = function () { ro.disconnect(); window.removeEventListener('resize', resize); };
    } else {
      s.stop = function () { window.removeEventListener('resize', resize); };
    }
    resize();
    return s;
  }

  function controls(wrap) { var c = el('div', 'demo-controls'); wrap.appendChild(c); return c; }
  function caption(wrap, txt) { var c = el('p', 'demo-caption', txt); wrap.appendChild(c); return c; }

  // shared drawing bits ------------------------------------------------------
  function trackX(s, p) { var ML = 46, MR = 46; return ML + p * (s.W - ML - MR); }

  function drawDot(ctx, x, y, r, color, label) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    if (label) {
      ctx.fillStyle = COL.ink; ctx.font = '600 11px ' + SANS;
      ctx.textAlign = 'center'; ctx.fillText(label, x, y - r - 6);
    }
  }

  function laneLine(ctx, x0, x1, y, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  }

  function tag(ctx, x, y, text, color) {
    ctx.fillStyle = color; ctx.font = '700 10.5px ' + SANS;
    ctx.textAlign = 'left'; ctx.fillText(text, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  /* An animation loop that only runs when it's worth running: the widget is on
     screen, the tab is visible, and the reader hasn't asked for less motion.
     Four of these used to run forever on one article page.

     Under prefers-reduced-motion the demo isn't dead - it draws one frame so
     there's something to look at, and wakes for a short burst whenever the
     reader touches a control, so the sliders and buttons still do something. */
  function loop(fn) {
    var root = currentRoot;
    var last = now();
    var running = false;
    var onScreen = !root; // no root to observe -> assume visible
    var rafId = 0;
    var burstUntil = 0;

    function step(animate) {
      var t = now();
      var dt = Math.min(64, t - last);
      last = t;
      fn(t, animate ? dt : 0);
    }

    function tick() {
      step(true);
      if (reduceMotion.matches && now() > burstUntil) { running = false; rafId = 0; return; }
      rafId = requestAnimationFrame(tick);
    }

    function shouldRun() {
      if (document.hidden || !onScreen) return false;
      return !reduceMotion.matches || now() <= burstUntil;
    }

    function sync() {
      if (shouldRun()) {
        if (running) return;
        running = true;
        last = now();
        rafId = requestAnimationFrame(tick);
      } else if (running) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    // one frame up front so the widget is never a blank rectangle
    step(false);

    if (root && typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        sync();
      }, { rootMargin: '120px' }).observe(root);
    } else {
      onScreen = true;
    }

    document.addEventListener('visibilitychange', sync);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', sync);

    if (root) {
      // a control was touched - animate briefly so the interaction reads
      ['input', 'click', 'pointerdown', 'keydown'].forEach(function (evt) {
        root.addEventListener(evt, function () { burstUntil = now() + 1200; sync(); });
      });
    }

    sync();
  }

  window.DemoKit = {
    COL: COL, SANS: SANS, clamp: clamp, lerp: lerp, now: now, el: el,
    holdButton: holdButton, tapButton: tapButton, toggle: toggle, slider: slider,
    frame: frame, stage: stage, controls: controls, caption: caption,
    trackX: trackX, drawDot: drawDot, laneLine: laneLine, tag: tag, roundRect: roundRect, loop: loop,
  };
  window.ArticleDemos = window.ArticleDemos || {};
})();
