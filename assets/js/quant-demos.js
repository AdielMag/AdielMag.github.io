/* ===========================================================================
   Interactive quant demos for the MoneyMaker trading posts. Built on
   window.DemoKit (assets/js/demo-kit.js). Registers into window.ArticleDemos.

     zscore  — "When 95¢ is cheap": a live random walk toward a strike, with the
               volatility cone, z-score, and implied probability updating in
               real time. Shows why late-window certainty is measurable.
     evcliff — "Everything my backtests told me": entry price vs. the risk it
               buys. Slide the entry price and watch how many winners a single
               stop-loss erases — the exact arithmetic behind the 85¢ cutoff.
   =========================================================================== */
(function () {
  'use strict';

  var K = window.DemoKit;
  var COL = K.COL;
  var clamp = K.clamp, lerp = K.lerp, now = K.now;
  var tapButton = K.tapButton, slider = K.slider;
  var frame = K.frame, stage = K.stage, controls = K.controls, caption = K.caption, loop = K.loop;

  var SANS = "'Space Grotesk', system-ui, sans-serif";
  var MONO = "'JetBrains Mono', ui-monospace, monospace";

  // standard-normal CDF (Abramowitz & Stegun 26.2.17) — turns a z-score into
  // the probability the lead holds to resolution
  function Phi(z) {
    if (z < 0) return 1 - Phi(-z);
    var t = 1 / (1 + 0.2316419 * z);
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return 1 - p;
  }
  function randn() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // ==========================================================================
  // zscore — random walk toward a strike, with a live volatility cone
  // ==========================================================================
  function zscore(host) {
    var wrap = frame(host, 'demo-zscore');
    var s = stage(wrap, 300);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var volS = slider('Volatility', 1, 6, 3, 0.5, '');
    cc.appendChild(volS);
    cc.appendChild(tapButton('↻ New 15-min window', function () { reset(); }));

    caption(wrap, 'BTC random-walks from the open (the strike) toward resolution. The purple cone is ' +
      'how far ordinary volatility could still move it in the time left — ±1σ and ±2σ. Once the strike ' +
      'falls outside the 2σ cone, the outcome is ~97.7% locked (z ≥ 2): the market is still pricing ' +
      '~95¢, and those last cents are underpriced. Nudge the volatility and watch the cone breathe.');

    var WD = 16000;           // window duration (ms) — one 15-min market, compressed
    var STEP_MS = 40;
    var SIGMA_K = 6;          // points per unit-vol per √second
    var t0 = now(), lastStep = now(), path = [], price = 0, resolvedAt = 0, outcome = null;

    function reset() { t0 = now(); lastStep = now(); path = []; price = 0; resolvedAt = 0; outcome = null; }

    loop(function (t) {
      var e = t - t0;
      if (resolvedAt) {
        if (t - resolvedAt > 1500) reset();
      } else if (e >= WD) {
        resolvedAt = t; outcome = price >= 0 ? 'YES' : 'NO';
      } else if (t - lastStep >= STEP_MS) {
        var dt = (t - lastStep) / 1000; lastStep = t;
        price += randn() * volS.value() * SIGMA_K * Math.sqrt(dt);
        path.push({ f: e / WD, p: price });
      }
      draw(t, Math.min(e, WD));
    });

    function draw(t, e) {
      var W = s.W, H = s.H;
      var ml = 46, mr = 158, top = 22, bot = H - 30;
      var plotR = W - mr, plotW = plotR - ml, yc = (top + bot) / 2;
      var PPP = ((bot - top) / 2) / 105;            // px per price-point (±105 pts fills)
      var yFor = function (p) { return clamp(yc - p * PPP, top, bot); };

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);

      var frac = e / WD;
      var nowX = ml + frac * plotW;
      var Trem = Math.max((WD - e) / 1000, 0.3);     // remaining seconds, floored (time floor)
      var sigmaEff = volS.value() * SIGMA_K;
      var expMove = sigmaEff * Math.sqrt(Trem);       // σ√T in points
      var lead = Math.abs(price);
      var z = expMove > 0 ? lead / expMove : 0;
      var buy = price >= 0 && (price - 2 * expMove) > 0;

      // volatility cone from the current point out to resolution (right edge)
      var conePx1 = expMove * PPP, conePx2 = 2 * expMove * PPP;
      var cy = yFor(price);
      ctx.fillStyle = 'rgba(163,113,247,0.10)';
      ctx.beginPath();
      ctx.moveTo(nowX, cy);
      ctx.lineTo(plotR, clamp(cy - conePx2, top, bot));
      ctx.lineTo(plotR, clamp(cy + conePx2, top, bot));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(163,113,247,0.16)';
      ctx.beginPath();
      ctx.moveTo(nowX, cy);
      ctx.lineTo(plotR, clamp(cy - conePx1, top, bot));
      ctx.lineTo(plotR, clamp(cy + conePx1, top, bot));
      ctx.closePath(); ctx.fill();

      // strike line (the open)
      ctx.strokeStyle = 'rgba(255,210,63,0.5)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ml, yc); ctx.lineTo(plotR, yc); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.gold; ctx.font = '700 10px ' + MONO; ctx.textAlign = 'left';
      ctx.fillText('OPEN / STRIKE', ml + 2, yc - 6);

      // resolution edge
      ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plotR, top); ctx.lineTo(plotR, bot); ctx.stroke();
      ctx.fillStyle = COL.mut; ctx.font = '700 9px ' + MONO; ctx.textAlign = 'right';
      ctx.fillText('RESOLVE', plotR - 3, top + 10);

      // price path
      if (path.length > 1) {
        ctx.strokeStyle = buy ? COL.remote : COL.ink; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var i = 0; i < path.length; i++) {
          var x = ml + path[i].f * plotW, y = yFor(path[i].p);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // current price dot
      ctx.beginPath(); ctx.arc(nowX, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = buy ? COL.remote : COL.you; ctx.fill();

      // ---- readout panel (right) ----
      var px = plotR + 16;
      ctx.textAlign = 'left';
      ctx.fillStyle = COL.mut; ctx.font = '700 10px ' + MONO;
      ctx.fillText('MEASURED z-SCORE', px, top + 12);
      var zc = z >= 2 ? COL.remote : (z >= 1.64 ? COL.gold : COL.bad);
      ctx.fillStyle = zc; ctx.font = "700 34px 'Space Grotesk', system-ui, sans-serif";
      ctx.fillText(resolvedAt ? '—' : z.toFixed(2), px, top + 48);

      ctx.font = '600 11px ' + MONO; ctx.fillStyle = COL.ink;
      ctx.fillText('P(holds) ' + Math.round(Phi(z) * 100) + '%', px, top + 72);
      ctx.fillStyle = COL.mut; ctx.font = '500 10.5px ' + MONO;
      ctx.fillText('lead    ' + (price >= 0 ? '+' : '') + Math.round(price), px, top + 92);
      ctx.fillText('σ√T     ' + Math.round(expMove), px, top + 108);
      ctx.fillText('market  ~1.64 (95¢)', px, top + 124);

      // verdict badge
      var vb = resolvedAt
        ? { txt: outcome === 'YES' ? 'YES ✓ held' : 'NO ✕ flipped', c: outcome === 'YES' ? COL.remote : COL.bad }
        : buy ? { txt: 'UNDERPRICED — buy', c: COL.remote }
        : z >= 1.64 ? { txt: 'fairly priced', c: COL.gold }
        : { txt: 'too risky — skip', c: COL.bad };
      ctx.fillStyle = vb.c; ctx.font = '700 12px ' + SANS;
      ctx.fillText(vb.txt, px, bot - 4);

      // time-left bar (bottom)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(ml, bot + 10, plotW, 5);
      ctx.fillStyle = COL.gold; ctx.fillRect(ml, bot + 10, plotW * frac, 5);
    }
  }

  // ==========================================================================
  // evcliff — entry price vs. the risk it buys (winners erased by one stop-loss)
  // ==========================================================================
  function evcliff(host) {
    var wrap = frame(host, 'demo-evcliff');
    var s = stage(wrap, 300);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var priceS = slider('Entry price', 80, 99, 97, 1, '¢');
    cc.appendChild(priceS);

    caption(wrap, 'The strategy buys near-certain outcomes, so “more certain” feels safer — but the ' +
      'arithmetic disagrees. Redeem at $1.00, stop-losses exit near 75¢. Slide the entry price and watch ' +
      'how many winning trades a single stop-loss wipes out. Past 85¢ the replays turned negative: tiny ' +
      'upside, fat tail, and manipulation clusters exactly where conviction is highest.');

    var EXIT = 75, CUTOFF = 85, YMAX = 20;
    var erased = function (p) { return (p - EXIT) / (100 - p); };  // winners erased by one loss (exact)

    loop(function () { draw(); });

    function draw() {
      var W = s.W, H = s.H;
      var ml = 52, mr = 18, top = 26, bot = H - 58;
      var plotW = W - ml - mr, plotH = bot - top;
      var xFor = function (p) { return ml + (p - 80) / 19 * plotW; };
      var yFor = function (r) { return bot - clamp(r, 0, YMAX) / YMAX * plotH; };

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);

      // negative-EV region (from the replays): entry >= 85c
      ctx.fillStyle = 'rgba(248,81,73,0.08)';
      ctx.fillRect(xFor(CUTOFF), top, xFor(99) - xFor(CUTOFF), plotH);

      // gridlines + y labels (winners erased)
      ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
      ctx.font = '500 9.5px ' + MONO; ctx.fillStyle = COL.mut; ctx.textAlign = 'right';
      [0, 5, 10, 15, 20].forEach(function (r) {
        var y = yFor(r);
        ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(W - mr, y); ctx.stroke();
        ctx.fillText(r === YMAX ? '20+' : ('' + r), ml - 6, y + 3);
      });

      // x labels (entry price)
      ctx.textAlign = 'center'; ctx.fillStyle = COL.mut; ctx.font = '500 10px ' + MONO;
      [80, 85, 90, 95, 99].forEach(function (p) {
        ctx.fillText(p + '¢', xFor(p), bot + 16);
      });

      // the curve
      ctx.strokeStyle = COL.you; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var p = 80; p <= 99; p += 0.25) {
        var x = xFor(p), y = yFor(erased(p));
        if (p === 80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 85c cutoff marker
      var cx = xFor(CUTOFF);
      ctx.strokeStyle = 'rgba(248,81,73,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.bad; ctx.font = '700 9.5px ' + MONO; ctx.textAlign = 'left';
      ctx.fillText('maxBuyPrice 85¢', cx + 5, top + 10);

      // axis titles
      ctx.save();
      ctx.translate(14, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.fillStyle = COL.mut; ctx.font = '600 10px ' + MONO;
      ctx.fillText('winners erased by one stop-loss', 0, 0);
      ctx.restore();

      // selected entry point
      var sel = priceS.value();
      var up = 100 - sel, down = sel - EXIT, r = erased(sel);
      var mx = xFor(sel), my = yFor(r);
      var dotC = sel >= CUTOFF ? COL.bad : COL.remote;
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fillStyle = dotC; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, bot); ctx.stroke(); ctx.setLineDash([]);

      // readout line under the chart
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + SANS; ctx.fillStyle = COL.ink;
      var breakeven = Math.round((sel - EXIT) / 25 * 100);
      ctx.fillText('Buy at ' + sel + '¢: risk ' + down + '¢ to make ' + up + '¢ · one stop-loss erases ' +
        r.toFixed(1) + ' winners', ml, bot + 40);
      ctx.fillStyle = dotC; ctx.font = '700 11px ' + MONO;
      ctx.fillText('break-even win rate needed: ' + breakeven + '%', ml, bot + 55);
    }
  }

  window.ArticleDemos = window.ArticleDemos || {};
  window.ArticleDemos.zscore = zscore;
  window.ArticleDemos.evcliff = evcliff;
})();
