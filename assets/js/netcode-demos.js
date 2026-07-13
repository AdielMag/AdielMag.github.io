/* ===========================================================================
   Interactive netcode demos for "The dumb client manifesto".
   Gambetta-style canvas widgets: latency sliders, toggles, live characters.
   Reference: https://www.gabrielgambetta.com/client-server-game-architecture.html

   Exposes window.NetcodeDemos = { prediction, reconciliation, interpolation,
   lagcomp }. article.js swaps a "[demo:<id>]" paragraph for the mounted widget.
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

  function loop(fn) {
    var last = now();
    function tick() {
      var t = now(); var dt = Math.min(64, t - last); last = t;
      fn(t, dt);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var STEP = 0.028;      // world fraction moved per input
  var INPUT_MS = 90;     // ms between inputs while holding

  // ==========================================================================
  // 1) PREDICTION — the lag problem, and instant local response
  // ==========================================================================
  function prediction(host) {
    var wrap = frame(host, 'demo-prediction');
    var s = stage(wrap, 244);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var hold = 0;
    cc.appendChild(holdButton('◀ Hold', function () { hold = -1; }, function () { hold = 0; }));
    cc.appendChild(holdButton('Hold ▶', function () { hold = 1; }, function () { hold = 0; }));
    var predT = toggle('Prediction', true);
    cc.appendChild(predT);
    var lagS = slider('Latency', 20, 320, 130, 10, ' ms');
    cc.appendChild(lagS);

    caption(wrap, 'Hold a direction. With prediction OFF, your character waits a full round-trip before it ' +
      'moves — the server is the only thing allowed to move it. Turn prediction ON and it responds the instant ' +
      'you press, while the server quietly catches up.');

    var serverX = 0.5, clientX = 0.5, msgs = [], lastInput = 0;

    loop(function (t) {
      var lag = lagS.value();
      if (hold !== 0 && t - lastInput >= INPUT_MS) {
        lastInput = t;
        if (predT.on) clientX = clamp(clientX + hold * STEP, 0, 1);
        msgs.push({ kind: 'in', dir: hold, x: clientX, s: t, a: t + lag });
      }
      for (var i = msgs.length - 1; i >= 0; i--) {
        var m = msgs[i];
        if (t >= m.a) {
          if (m.kind === 'in') {
            serverX = clamp(serverX + m.dir * STEP, 0, 1);
            msgs.push({ kind: 'st', x: serverX, s: t, a: t + lag });
          } else if (!predT.on) {
            clientX = m.x;
          }
          msgs.splice(i, 1);
        }
      }

      var W = s.W, H = s.H, sy = 64, cy = H - 60;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);
      tag(ctx, 40, 30, 'SERVER · the one true position', COL.server);
      tag(ctx, 40, H - 18, 'YOUR SCREEN', COL.you);
      laneLine(ctx, 40, W - 40, sy, COL.line);
      laneLine(ctx, 40, W - 40, cy, COL.line);

      for (var j = 0; j < msgs.length; j++) {
        var mm = msgs[j];
        var p = clamp((t - mm.s) / (mm.a - mm.s), 0, 1);
        var fromY = mm.kind === 'in' ? cy : sy, toY = mm.kind === 'in' ? sy : cy;
        var mx = trackX(s, mm.x), my = lerp(fromY, toY, p);
        ctx.fillStyle = mm.kind === 'in' ? COL.you : COL.server;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(mx - 5, my - 5, 10, 10);
        ctx.globalAlpha = 1;
      }

      drawDot(ctx, trackX(s, serverX), sy, 13, COL.server);
      drawDot(ctx, trackX(s, clientX), cy, 13, COL.you);

      // perceived-lag readout
      ctx.fillStyle = predT.on ? COL.remote : COL.bad;
      ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(predT.on ? 'feels instant' : 'perceived delay ≈ ' + Math.round(lag * 2) + ' ms',
        W - 44, sy - 26);
    });
  }

  // ==========================================================================
  // 2) RECONCILIATION — predict ahead, retire inputs as the server acks them
  // ==========================================================================
  function reconciliation(host) {
    var wrap = frame(host, 'demo-reconcile');
    var s = stage(wrap, 250);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var hold = 0;
    cc.appendChild(holdButton('◀ Hold', function () { hold = -1; }, function () { hold = 0; }));
    cc.appendChild(holdButton('Hold ▶', function () { hold = 1; }, function () { hold = 0; }));
    var lagS = slider('Latency', 40, 360, 180, 10, ' ms');
    cc.appendChild(lagS);
    var spike = 0;
    cc.appendChild(tapButton('Network spike', function () { spike = now() + 700; }));

    caption(wrap, 'Prediction moves you immediately, so you run ahead of the server. Each input is numbered; ' +
      'the server echoes the last number it processed. The client keeps the not-yet-confirmed inputs (the ' +
      'glowing queue) and replays them on top of the server’s truth — so it stays ahead with no rubber-banding. ' +
      'Hit “Network spike” to watch the queue swell and drain.');

    var serverX = 0.5, confirmedX = 0.5, clientX = 0.5;
    var pending = [], seq = 0, ack = 0, msgs = [], lastInput = 0;

    loop(function (t) {
      var base = lagS.value();
      var lag = base + (t < spike ? 260 : 0);
      if (hold !== 0 && t - lastInput >= INPUT_MS) {
        lastInput = t; seq++;
        clientX = clamp(clientX + hold * STEP, 0, 1);
        pending.push({ seq: seq, dir: hold });
        msgs.push({ kind: 'in', dir: hold, seq: seq, s: t, a: t + lag, x: clientX });
      }
      for (var i = msgs.length - 1; i >= 0; i--) {
        var m = msgs[i];
        if (t >= m.a) {
          if (m.kind === 'in') {
            serverX = clamp(serverX + m.dir * STEP, 0, 1);
            msgs.push({ kind: 'st', x: serverX, ack: m.seq, s: t, a: t + lag });
          } else {
            confirmedX = m.x; ack = m.ack;
            pending = pending.filter(function (p) { return p.seq > ack; });
            var rx = confirmedX;
            for (var k = 0; k < pending.length; k++) rx = clamp(rx + pending[k].dir * STEP, 0, 1);
            clientX = rx; // snap to server truth + replay un-acked inputs
          }
          msgs.splice(i, 1);
        }
      }

      var W = s.W, H = s.H, sy = 60, cy = H - 74;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);
      tag(ctx, 40, 28, 'SERVER', COL.server);
      tag(ctx, 40, H - 46, 'YOUR SCREEN', COL.you);
      laneLine(ctx, 40, W - 40, sy, COL.line);
      laneLine(ctx, 40, W - 40, cy, COL.line);

      for (var j = 0; j < msgs.length; j++) {
        var mm = msgs[j];
        var pr = clamp((t - mm.s) / (mm.a - mm.s), 0, 1);
        var fromY = mm.kind === 'in' ? cy : sy, toY = mm.kind === 'in' ? sy : cy;
        var mx = mm.kind === 'in' ? trackX(s, mm.x) : trackX(s, mm.x);
        ctx.fillStyle = mm.kind === 'in' ? COL.you : COL.server;
        ctx.globalAlpha = 0.85; ctx.fillRect(mx - 5, lerp(fromY, toY, pr) - 5, 10, 10); ctx.globalAlpha = 1;
      }

      drawDot(ctx, trackX(s, serverX), sy, 12, COL.server);
      // confirmed (ghost) + predicted (solid)
      var cxc = trackX(s, confirmedX), cxp = trackX(s, clientX);
      ctx.globalAlpha = 0.45; drawDot(ctx, cxc, cy, 11, COL.mut); ctx.globalAlpha = 1;
      drawDot(ctx, cxp, cy, 13, COL.you);
      // connector = the in-flight gap
      ctx.strokeStyle = 'rgba(255,107,74,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cxc, cy); ctx.lineTo(cxp, cy); ctx.stroke(); ctx.setLineDash([]);

      // pending queue boxes
      var qx = 46, qy = H - 22;
      ctx.font = '600 10px ui-monospace, monospace'; ctx.textAlign = 'center';
      for (var q = 0; q < Math.min(pending.length, 14); q++) {
        var bx = qx + q * 24;
        ctx.fillStyle = 'rgba(255,107,74,0.18)'; ctx.strokeStyle = COL.you; ctx.lineWidth = 1;
        ctx.fillRect(bx, qy - 12, 20, 16); ctx.strokeRect(bx, qy - 12, 20, 16);
        ctx.fillStyle = COL.you; ctx.fillText('#' + pending[q].seq, bx + 10, qy);
      }
      ctx.fillStyle = COL.mut; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('acked #' + ack + ' · pending: ' + pending.length, W - 44, sy - 20);
    });
  }

  // ==========================================================================
  // 3) INTERPOLATION — smooth remotes from sparse snapshots, rendered in the past
  // ==========================================================================
  function interpolation(host) {
    var wrap = frame(host, 'demo-interp');
    var s = stage(wrap, 210);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var interpT = toggle('Interpolation', true);
    cc.appendChild(interpT);
    var rateS = slider('Server rate', 2, 14, 5, 1, ' Hz');
    cc.appendChild(rateS);

    caption(wrap, 'The green player is someone else, moving continuously (faint ghost = the truth). The server ' +
      'only samples them a few times a second (ticks). Rendering straight from those snapshots jumps; ' +
      'interpolation buffers them and draws between the two most recent — a fraction of a second in the past — ' +
      'for perfectly smooth motion.');

    var snaps = [], lastSnap = 0, t0 = now();

    loop(function (t) {
      var trueP = 0.5 + 0.42 * Math.sin((t - t0) / 1100);
      var rate = rateS.value();
      var interval = 1000 / rate;
      if (t - lastSnap >= interval) { lastSnap = t; snaps.push({ t: t, x: trueP }); if (snaps.length > 40) snaps.shift(); }

      var W = s.W, H = s.H, y = H / 2 + 6;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);
      laneLine(ctx, 40, W - 40, y, COL.line);
      tag(ctx, 40, 26, 'REMOTE PLAYER', COL.remote);

      // snapshot ticks
      for (var i = 0; i < snaps.length; i++) {
        var sx = trackX(s, snaps[i].x);
        ctx.strokeStyle = 'rgba(63,185,80,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, y - 12); ctx.lineTo(sx, y + 12); ctx.stroke();
      }
      // truth ghost
      ctx.globalAlpha = 0.28; drawDot(ctx, trackX(s, trueP), y, 12, COL.remote); ctx.globalAlpha = 1;

      var renderX, note;
      if (interpT.on) {
        var rt = t - interval; // render one snapshot-interval in the past
        var a = null, b = null;
        for (var k = 0; k < snaps.length - 1; k++) {
          if (snaps[k].t <= rt && snaps[k + 1].t >= rt) { a = snaps[k]; b = snaps[k + 1]; break; }
        }
        if (a && b) { var f = (rt - a.t) / (b.t - a.t); renderX = lerp(a.x, b.x, f); }
        else if (snaps.length) renderX = snaps[snaps.length - 1].x;
        else renderX = trueP;
        note = 'smooth · rendered ~' + Math.round(interval) + ' ms in the past';
      } else {
        renderX = snaps.length ? snaps[snaps.length - 1].x : trueP;
        note = 'choppy · jumps ' + rate + '× per second';
      }
      drawDot(ctx, trackX(s, renderX), y, 13, COL.remote);
      ctx.fillStyle = interpT.on ? COL.remote : COL.bad;
      ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(note, W - 44, 26);
    });
  }

  // ==========================================================================
  // 4) LAG COMPENSATION — rewind to what the shooter actually saw
  // ==========================================================================
  function lagcomp(host) {
    var wrap = frame(host, 'demo-lagcomp');
    var s = stage(wrap, 236);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var compT = toggle('Lag compensation', true);
    cc.appendChild(compT);
    var lagS = slider('Your latency', 60, 320, 170, 10, ' ms');
    cc.appendChild(lagS);
    var shot = null;
    var fireBtn = tapButton('🎯 Fire', function () { doFire(); });
    cc.appendChild(fireBtn);

    caption(wrap, 'You see the enemy in the past (interpolation), so you aim at their delayed position — but by ' +
      'the time your shot reaches the server, they’ve moved on. With lag compensation the server rewinds to the ' +
      'exact instant you fired and checks the hit there. Turn it off and your perfect aim keeps missing.');

    var t0 = now();
    function truePos(t) { return 0.5 + 0.4 * Math.sin((t - t0) / 900); }
    function shownPos(t, lag) { return truePos(t - lag); } // what the shooter sees (past)

    function doFire() {
      var t = now(), lag = lagS.value();
      var aimX = shownPos(t, lag);           // shooter aims where they see the enemy
      var serverCheckX = compT.on ? aimX : truePos(t); // rewind vs present
      var hit = Math.abs(aimX - serverCheckX) < 0.045;
      shot = { t: t, aimX: aimX, trueX: truePos(t), hit: hit, until: t + 1100 };
    }

    loop(function (t) {
      var lag = lagS.value();
      var W = s.W, H = s.H, y = H / 2 - 8, gunY = H - 30;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);
      laneLine(ctx, 40, W - 40, y, COL.line);
      tag(ctx, 40, 26, 'ENEMY', COL.gold);

      var trueX = truePos(t), seenX = shownPos(t, lag);
      // present (truth, faint) and what you see (solid)
      ctx.globalAlpha = 0.3; drawDot(ctx, trackX(s, trueX), y, 12, COL.mut); ctx.globalAlpha = 1;
      ctx.fillStyle = COL.mut; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('actually here', trackX(s, trueX), y + 26);
      drawDot(ctx, trackX(s, seenX), y, 13, COL.gold, 'you see');

      // shooter
      drawDot(ctx, trackX(s, 0.5), gunY, 10, COL.you);
      tag(ctx, trackX(s, 0.5) - 14, gunY + 22, 'YOU', COL.you);

      if (shot) {
        var p = clamp((t - shot.t) / 260, 0, 1);
        var sx = trackX(s, 0.5), sy = gunY, tx = trackX(s, shot.aimX), ty = y;
        ctx.strokeStyle = shot.hit ? COL.remote : COL.bad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, tx, p), lerp(sy, ty, p)); ctx.stroke();
        if (compT.on) { // show the rewind marker
          ctx.strokeStyle = 'rgba(74,163,255,0.6)'; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
        if (t < shot.until) {
          ctx.fillStyle = shot.hit ? COL.remote : COL.bad;
          ctx.font = '700 14px Inter, sans-serif'; ctx.textAlign = 'right';
          ctx.fillText(shot.hit ? 'HIT ✓' : 'MISS ✕', W - 44, 26);
        } else shot = null;
      }
    });
  }

  window.NetcodeDemos = {
    prediction: prediction,
    reconciliation: reconciliation,
    interpolation: interpolation,
    lagcomp: lagcomp,
  };
})();
