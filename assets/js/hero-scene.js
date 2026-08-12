/* ===========================================================================
   Homepage hero: a glowing torus-knot rendered on a 2D canvas with a
   hand-rolled 3D projection (no WebGL, no dependency). The camera orbits
   toward the pointer; a click sends a shockwave ring across the floor grid.

   Ported from a Claude Design handoff (hero-section-redesign/Hero.dc.html) -
   the source there is a React component whose render logic is pure canvas
   code with no JSX, so the port is close to line-for-line, swapping React
   refs/lifecycle for plain DOM handles and prefers-reduced-motion +
   IntersectionObserver gating to match how assets/js/demo-kit.js treats every
   other canvas loop on this site.
   =========================================================================== */
(function () {
  'use strict';

  var COL = {
    dust: '244,241,234',
    gridBlue: '108,182,255',
    gridViolet: '167,139,250',
    shock: '255,107,74',
    bandFar: '167,139,250',
    bandMid: '255,107,74',
    bandNear: '255,210,63',
  };

  function initHeroScene(root) {
    var canvas = root.querySelector('.hero-scene-canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };

    var w = 0, h = 0, scale = 0, cx = 0, cy = 0;
    var m = { x: 0.5, y: 0.5, active: false };
    var cam = { yaw: 0, pitch: 0.16 };
    var t = 0, pulse = 0, shock = -1;
    var raf = 0, running = false, onScreen = true;

    // torus knot (p=2, q=3) sampled as a closed ribbon of points
    var N = 380, p = 2, q = 3;
    var knot = [];
    for (var i = 0; i <= N; i++) {
      var u = (i / N) * Math.PI * 2;
      var r = 2 + Math.cos(q * u);
      knot.push({
        x: r * Math.cos(p * u),
        y: Math.sin(q * u) * 1.05,
        z: r * Math.sin(p * u),
        u: u,
      });
    }

    // dust field, deterministic so it doesn't reshuffle on resize
    var dust = [];
    (function seedDust() {
      var s = 4;
      function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      for (var j = 0; j < 220; j++) {
        dust.push({
          x: (rnd() - 0.5) * 16, y: (rnd() - 0.5) * 7, z: (rnd() - 0.5) * 16,
          s: 0.4 + rnd() * 1.3, ph: rnd() * 6.28,
        });
      }
    })();

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = root.clientWidth; h = root.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(w * 0.24, h * 0.42);
      cx = w * 0.82;
      cy = h * 0.38;
    }

    function onMove(e) {
      var b = root.getBoundingClientRect();
      var touch = e.touches && e.touches[0];
      var cxp = touch ? touch.clientX : e.clientX;
      var cyp = touch ? touch.clientY : e.clientY;
      m = { x: (cxp - b.left) / b.width, y: (cyp - b.top) / b.height, active: true };
    }
    function onLeave() { m.active = false; }
    function onPoke() { pulse = 1; shock = 0; }

    function project(pt) {
      var yaw = cam.yaw, pitch = cam.pitch;
      var cyw = Math.cos(yaw), syw = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var x = pt.x * cyw - pt.z * syw;
      var z0 = pt.x * syw + pt.z * cyw;
      var y = pt.y * cp - z0 * sp;
      var z = pt.y * sp + z0 * cp;
      var D = 9;
      var zc = Math.max(1.2, z + D);
      var k = 2.4 * scale / zc;
      return { x: cx + x * k, y: cy + y * k, f: D / zc };
    }

    var orbit = 1;

    function step(dt) {
      var mx = m.active ? m.x : 0.5 + 0.12 * Math.sin(t * 0.24);
      var my = m.active ? m.y : 0.5 + 0.1 * Math.sin(t * 0.19 + 1.4);
      var yawT = t * 0.22 + (mx - 0.5) * 2.4 * orbit;
      var pitchT = 0.12 + (my - 0.5) * -0.9 * orbit;
      var k = 1 - Math.pow(0.02, dt);
      cam.yaw += (yawT - cam.yaw) * k;
      cam.pitch += (pitchT - cam.pitch) * k;
      pulse = Math.max(0, pulse - dt * 1.1);
      if (shock >= 0) { shock += dt * 5.2; if (shock > 4.2) shock = -1; }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      var breathe = 1 + pulse * 0.14 + Math.sin(t * 0.7) * 0.015;

      var floorY = 2.9;
      var gridA = 0.11 + pulse * 0.08;
      for (var gi = -8; gi <= 8; gi++) {
        var ga = project({ x: gi * 1.6, y: floorY, z: -3.5 });
        var gb = project({ x: gi * 1.6, y: floorY, z: 14 });
        ctx.strokeStyle = 'rgba(' + COL.gridBlue + ',' + gridA.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ga.x, ga.y); ctx.lineTo(gb.x, gb.y); ctx.stroke();
      }
      for (var gj = 0; gj <= 12; gj++) {
        var zz = 14 - (gj * 1.5 + ((t * 0.9) % 1.5));
        var la = project({ x: -13, y: floorY, z: zz });
        var lb = project({ x: 13, y: floorY, z: zz });
        var fade = Math.max(0, 1 - (zz + 3.5) / 18);
        ctx.strokeStyle = 'rgba(' + COL.gridViolet + ',' + (gridA * fade * 1.4).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(lb.x, lb.y); ctx.stroke();
      }

      if (shock >= 0) {
        var rr = shock, segs = 48;
        ctx.strokeStyle = 'rgba(' + COL.shock + ',' + Math.max(0, 0.5 - shock * 0.11).toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (var s = 0; s <= segs; s++) {
          var a = (s / segs) * Math.PI * 2;
          var pt = project({ x: Math.cos(a) * rr * 2.2, y: floorY, z: Math.sin(a) * rr * 2.2 });
          if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      for (var di = 0; di < dust.length; di++) {
        var d = dust[di];
        var dp = project({ x: d.x, y: d.y + Math.sin(t * 0.4 + d.ph) * 0.2, z: d.z });
        var da = Math.max(0, Math.min(1, (dp.f - 0.5) * 1.6)) * 0.5;
        ctx.fillStyle = 'rgba(' + COL.dust + ',' + (da * 0.5).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, Math.max(0.3, d.s * dp.f), 0, Math.PI * 2);
        ctx.fill();
      }

      var pts = knot.map(function (kp) {
        return project({
          x: kp.x * breathe,
          y: kp.y * breathe + Math.sin(t * 1.1 + kp.u * 2) * 0.05,
          z: kp.z * breathe,
        });
      });
      var bandOf = function (f) { return f < 0.92 ? 0 : (f < 1.08 ? 1 : 2); };
      var style = [
        { col: COL.bandFar, a: 0.34, w: 1.1, blur: 10 },
        { col: COL.bandMid, a: 0.66, w: 2.1, blur: 18 },
        { col: COL.bandNear, a: 0.95, w: 3.6, blur: 30 },
      ];
      for (var band = 0; band < 3; band++) {
        var st = style[band];
        ctx.strokeStyle = 'rgba(' + st.col + ',' + st.a + ')';
        ctx.lineWidth = st.w + pulse * 1.4;
        ctx.shadowColor = 'rgba(' + st.col + ',0.75)';
        ctx.shadowBlur = st.blur * (1 + pulse * 0.7);
        ctx.lineJoin = 'round';
        var run = null;
        for (var pi = 0; pi < pts.length; pi++) {
          if (bandOf(pts[pi].f) === band) {
            if (!run) { run = true; ctx.beginPath(); ctx.moveTo(pts[pi].x, pts[pi].y); }
            else ctx.lineTo(pts[pi].x, pts[pi].y);
          } else if (run) { ctx.stroke(); run = null; }
        }
        if (run) ctx.stroke();
      }
      ctx.shadowBlur = 0;

      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.95);
      g.addColorStop(0, 'rgba(255,210,63,' + (0.1 + pulse * 0.12).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(255,107,74,0.05)');
      g.addColorStop(1, 'rgba(21,19,24,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'source-over';
    }

    // A still frame: one pose, no drift, no bloom throb - the shape reads
    // fine standing still, and prefers-reduced-motion means it should.
    function drawStill() {
      cam.yaw = 0.4; cam.pitch = 0.16;
      draw();
    }

    var last = 0;
    function tick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      try { step(dt); draw(); } catch (e) { /* never let one bad frame kill the loop */ }
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
    function sync() {
      if (reduceMotion.matches) { stop(); drawStill(); return; }
      if (onScreen && !document.hidden) start(); else stop();
    }

    resize();
    drawStill();

    window.addEventListener('resize', function () { resize(); if (!running) drawStill(); });
    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('touchmove', onMove, { passive: true });
    root.addEventListener('touchend', onLeave);
    root.addEventListener('click', onPoke);

    document.addEventListener('visibilitychange', sync);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', sync);

    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        sync();
      }, { rootMargin: '80px' }).observe(root);
    }

    sync();
  }

  window.initHeroScene = initHeroScene;
})();
