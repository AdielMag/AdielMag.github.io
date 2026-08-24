/* ===========================================================================
   Site-wide background: a 3D space field rendered on a single fixed canvas
   with a hand-rolled perspective projection (no WebGL, no dependency) -
   same approach the old hero torus-knot used, but page-wide.

   The camera sits at z = 0 and flies FORWARD as you scroll, so planets and
   stars stream past and change position with scroll depth (the
   eurekalabs.xyz trick). A little idle drift and pointer parallax keep it
   alive when the page is still.

   Replaces assets/js/hero-scene.js. Gated by prefers-reduced-motion +
   IntersectionObserver-free visibility handling to match how demo-kit.js
   treats every other canvas loop on this site.
   =========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('spaceCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  // palette matches the site theme (styles.css :root)
  var PLANETS = [
    { x: -9.5, y: -4.2, z: 10, r: 2.4, col: '255,107,74', ring: false, ph: 0.0 },  // coral
    { x: 11.0, y: 3.4,  z: 22, r: 3.1, col: '167,139,250', ring: true,  ph: 1.7 }, // violet, ringed
    { x: 7.0,  y: -5.0, z: 34, r: 1.5, col: '255,210,63',  ring: false, ph: 3.1 }, // gold
    { x: -12.0,y: 4.6,  z: 44, r: 2.2, col: '108,182,255', ring: false, ph: 4.4 }, // blue
    { x: -6.5, y: 5.8,  z: 55, r: 1.2, col: '124,242,156', ring: false, ph: 5.2 }, // green
    { x: 13.0, y: -2.0, z: 62, r: 2.8, col: '255,107,74',  ring: false, ph: 0.9 }, // coral, far
    { x: 3.5,  y: 6.5,  z: 16, r: 0.9, col: '244,241,234', ring: false, ph: 2.5 }  // pale moon, close
  ];

  // soft nebula glows, drawn way behind everything in world space
  var NEBULAE = [
    { x: -10, y: -5, z: 70, r: 16, col: '167,139,250', a: 0.05 },
    { x: 12,  y: 6,  z: 75, r: 18, col: '255,107,74',  a: 0.04 },
    { x: 0,   y: 0,  z: 90, r: 24, col: '108,182,255', a: 0.035 }
  ];

  var TRAVEL = 64;          // world units flown across one full page scroll
  var FOV = 1.15;           // focal length multiplier

  var w = 0, h = 0, dpr = 1;
  var t = 0;
  var scrollT = 0, scrollCur = 0;      // 0..1 progress through the document
  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var raf = 0, running = false;

  // deterministic RNG so the sky doesn't reshuffle on resize
  var seed = 4;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  var stars = [];
  (function seedStars() {
    for (var i = 0; i < 320; i++) {
      stars.push({
        x: (rnd() - 0.5) * 46,
        y: (rnd() - 0.5) * 28,
        z: rnd() * (TRAVEL + 50),
        s: 0.4 + rnd() * 1.5,
        tw: 1 + rnd() * 3,
        ph: rnd() * 6.28
      });
    }
  })();

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function readScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollT = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
  }

  function readPointer(e) {
    var touch = e.touches && e.touches[0];
    pointer.tx = (touch ? touch.clientX : e.clientX) / window.innerWidth;
    pointer.ty = (touch ? touch.clientY : e.clientY) / window.innerHeight;
  }

  // camera: flies forward with smoothed scroll, sways with the pointer
  function camera() {
    var cz = scrollCur * TRAVEL;
    var px = (pointer.x - 0.5) * 1.6;
    var py = (pointer.y - 0.5) * 1.0;
    if (!reduceMotion.matches) {
      px += Math.sin(t * 0.11) * 0.35;
      py += Math.cos(t * 0.09) * 0.25;
    }
    return { z: cz, x: px, y: py };
  }

  function project(p, cam) {
    var zc = p.z - cam.z;
    if (zc < 0.4) return null;
    var f = (FOV * Math.max(w, h)) / zc;
    return {
      x: w / 2 + (p.x - cam.x) * f,
      y: h / 2 + (p.y - cam.y) * f,
      f: f,
      zc: zc
    };
  }

  function drawSphere(pr, r, col, alpha) {
    var R = Math.max(0.5, r * pr.f);
    // atmosphere glow
    var glow = ctx.createRadialGradient(pr.x, pr.y, R * 0.6, pr.x, pr.y, R * 2.1);
    glow.addColorStop(0, 'rgba(' + col + ',' + (0.22 * alpha).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, R * 2.1, 0, Math.PI * 2); ctx.fill();
    // shaded sphere, lit from upper-left
    var lx = pr.x - R * 0.45, ly = pr.y - R * 0.45;
    var body = ctx.createRadialGradient(lx, ly, R * 0.1, pr.x, pr.y, R);
    body.addColorStop(0, 'rgba(' + col + ',' + (0.95 * alpha).toFixed(3) + ')');
    body.addColorStop(0.55, 'rgba(' + col + ',' + (0.55 * alpha).toFixed(3) + ')');
    body.addColorStop(1, 'rgba(' + col + ',' + (0.08 * alpha).toFixed(3) + ')');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, R, 0, Math.PI * 2); ctx.fill();
    return R;
  }

  function drawRing(pr, R, col, alpha, tilt) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(tilt);
    ctx.scale(1, 0.32);
    ctx.strokeStyle = 'rgba(' + col + ',' + (0.4 * alpha).toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.6, R * 0.16);
    ctx.beginPath(); ctx.arc(0, 0, R * 1.65, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(' + col + ',' + (0.18 * alpha).toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.4, R * 0.3);
    ctx.beginPath(); ctx.arc(0, 0, R * 1.95, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function draw(cam) {
    // deep-space backdrop
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#100e15');
    bg.addColorStop(0.55, '#151318');
    bg.addColorStop(1, '#121017');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';

    // nebulae (far, slow parallax)
    for (var n = 0; n < NEBULAE.length; n++) {
      var nb = NEBULAE[n];
      var np = project(nb, cam);
      if (!np) continue;
      var NR = nb.r * np.f * 0.35;
      var g = ctx.createRadialGradient(np.x, np.y, 0, np.x, np.y, NR);
      g.addColorStop(0, 'rgba(' + nb.col + ',' + nb.a + ')');
      g.addColorStop(1, 'rgba(' + nb.col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(np.x - NR, np.y - NR, NR * 2, NR * 2);
    }

    // stars
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var sp = project(st, cam);
      if (!sp) continue;
      var tw = reduceMotion.matches ? 0.8 : 0.62 + 0.38 * Math.sin(t * st.tw + st.ph);
      var fade = Math.min(1, sp.zc / 30);           // soften distant stars
      var a = 0.55 * tw * fade;
      if (a <= 0.01) continue;
      ctx.fillStyle = 'rgba(244,241,234,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.3, st.s * sp.f * 0.02 + 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // planets, far to near
    var order = PLANETS.slice().sort(function (a, b) { return b.z - a.z; });
    for (var p = 0; p < order.length; p++) {
      var pl = order[p];
      var bobY = pl.y + (reduceMotion.matches ? 0 : Math.sin(t * 0.35 + pl.ph) * 0.45);
      var bobX = pl.x + (reduceMotion.matches ? 0 : Math.cos(t * 0.27 + pl.ph) * 0.3);
      var pp = project({ x: bobX, y: bobY, z: pl.z }, cam);
      if (!pp) continue;
      // dim far planets, and fade out entirely as one passes the camera
      var distFade = Math.max(0, Math.min(1, 26 / pp.zc)) * Math.min(1, pp.zc / 5);
      if (distFade <= 0.02) continue;
      var R = drawSphere(pp, pl.r, pl.col, distFade);
      if (pl.ring) drawRing(pp, R, pl.col, distFade, -0.5 + Math.sin(pl.ph) * 0.2);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  var last = 0;
  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    var k = 1 - Math.pow(0.001, dt);   // smooth toward targets
    scrollCur += (scrollT - scrollCur) * k;
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    try { draw(camera()); } catch (e) { /* never let one bad frame kill the loop */ }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduceMotion.matches) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // reduced motion: no loop, but still repaint once per scroll/resize so the
  // parallax itself (user-driven) keeps working
  function drawStill() {
    scrollCur = scrollT;
    pointer.x = pointer.tx; pointer.y = pointer.ty;
    draw(camera());
  }

  function sync() {
    if (reduceMotion.matches) { stop(); drawStill(); return; }
    if (!document.hidden) start(); else stop();
  }

  resize();
  readScroll();
  drawStill();

  window.addEventListener('resize', function () { resize(); if (!running) drawStill(); });
  window.addEventListener('scroll', function () {
    readScroll();
    if (!running) drawStill();
  }, { passive: true });
  window.addEventListener('mousemove', readPointer, { passive: true });
  document.addEventListener('visibilitychange', sync);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', sync);

  sync();
})();
