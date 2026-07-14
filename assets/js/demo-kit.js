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

  var COL = {
    you: '#ff6b4a', server: '#4da3ff', remote: '#3fb950', gold: '#ffd23f',
    purple: '#a371f7', bad: '#f85149', mut: '#8b98a5', ink: '#e6edf3', line: '#2a2733',
  };

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
    var down = function (e) { e.preventDefault(); b.classList.add('pressed'); onDown(); };
    var up = function () { b.classList.remove('pressed'); if (onUp) onUp(); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
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

  function frame(host, cls) {
    var wrap = el('div', 'demo ' + (cls || ''));
    host.appendChild(wrap);
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
    setTimeout(resize, 0);
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
      ctx.fillStyle = COL.ink; ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(label, x, y - r - 6);
    }
  }

  function laneLine(ctx, x0, x1, y, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  }

  function tag(ctx, x, y, text, color) {
    ctx.fillStyle = color; ctx.font = '700 10.5px Inter, sans-serif';
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

  function loop(fn) {
    var last = now();
    function tick() {
      var t = now(); var dt = Math.min(64, t - last); last = t;
      fn(t, dt);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.DemoKit = {
    COL: COL, clamp: clamp, lerp: lerp, now: now, el: el,
    holdButton: holdButton, tapButton: tapButton, toggle: toggle, slider: slider,
    frame: frame, stage: stage, controls: controls, caption: caption,
    trackX: trackX, drawDot: drawDot, laneLine: laneLine, tag: tag, roundRect: roundRect, loop: loop,
  };
  window.ArticleDemos = window.ArticleDemos || {};
})();
