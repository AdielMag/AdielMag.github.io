/* ===========================================================================
   Interactive demo for "Stop-losses that don't trust the price".
   A $2 spoof sell order craters the quoted price through a 60c stop-loss
   threshold; toggling the depth check on/off decides whether the bot is
   fooled by it. Built on window.DemoKit (assets/js/demo-kit.js).
   Registers into window.ArticleDemos.depthcheck.
   =========================================================================== */
(function () {
  'use strict';

  var K = window.DemoKit;
  var COL = K.COL;
  var clamp = K.clamp, lerp = K.lerp, now = K.now;
  var tapButton = K.tapButton, toggle = K.toggle;
  var frame = K.frame, stage = K.stage, controls = K.controls, caption = K.caption;
  var trackX = K.trackX, tag = K.tag, loop = K.loop;

  var REAL_BIDS = [
    { price: 98, size: 42 },
    { price: 96, size: 61 },
    { price: 94, size: 48 },
    { price: 91, size: 33 },
    { price: 88, size: 21 },
  ];
  var THRESHOLD = 60;    // stop-loss trigger, in cents
  var SPOOF_PRICE = 45;  // attacker's fake ask, in cents
  var HOLD_PRICE = 99;   // resting price with nothing happening

  function depthcheck(host) {
    var wrap = frame(host, 'demo-depthcheck');
    var s = stage(wrap, 258);
    var ctx = s.ctx;
    var cc = controls(wrap);

    var checkT = toggle('Depth check', true);
    cc.appendChild(checkT);
    cc.appendChild(tapButton('⚠ Spoof sell: $2 @ 45¢', function () { attack(); }));
    cc.appendChild(tapButton('↺ Reset position', function () { resetPos(); }));

    caption(wrap, 'The bot holds NO at 99¢ with a 60¢ stop-loss. Fire the spoof sell and watch the ' +
      'quoted price crater on a $2 order — with the depth check ON, the bot sees no real bids down ' +
      'there and holds; turn it OFF and it panic-sells straight into the attacker’s trap.');

    var quoted = HOLD_PRICE, phase = 'idle', phaseT = now(), evaluated = false;
    var open = true, sellPrice = null, note = 'Holding NO · 99¢ · $100 position';

    function attack() {
      if (phase !== 'idle' || !open) return;
      phase = 'diving'; phaseT = now(); evaluated = false;
    }
    function resetPos() {
      phase = 'idle'; quoted = HOLD_PRICE; open = true; sellPrice = null;
      note = 'Holding NO · 99¢ · $100 position';
    }

    loop(function (t) {
      if (phase === 'diving') {
        var p = clamp((t - phaseT) / 380, 0, 1);
        quoted = lerp(HOLD_PRICE, SPOOF_PRICE, p);
        if (p >= 1) { phase = 'holding'; phaseT = t; }
      } else if (phase === 'holding') {
        quoted = SPOOF_PRICE;
        if (!evaluated) {
          evaluated = true;
          if (open && quoted < THRESHOLD) {
            if (checkT.on) {
              note = 'Depth check blocked the sell — held.';
            } else {
              open = false; sellPrice = quoted;
              note = 'No check — panic-sold at 45¢. Lost ≈$54.';
            }
          }
        }
        if (t - phaseT > 1300) { phase = 'recovering'; phaseT = t; }
      } else if (phase === 'recovering') {
        var pr = clamp((t - phaseT) / 460, 0, 1);
        quoted = lerp(SPOOF_PRICE, HOLD_PRICE, pr);
        if (pr >= 1) {
          phase = 'idle';
          if (open) note = 'Attacker cancelled — price snapped back.';
        }
      }

      draw();
    });

    function draw() {
      var W = s.W, H = s.H, base = H - 70;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);

      // legend + axis
      tag(ctx, 40, 20, 'REAL BIDS (green)', COL.remote);
      ctx.strokeStyle = COL.line; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(40, base); ctx.lineTo(W - 40, base); ctx.stroke();

      // real bid ladder
      for (var i = 0; i < REAL_BIDS.length; i++) {
        var b = REAL_BIDS[i];
        var bx = trackX(s, b.price / 100);
        var bh = 6 + b.size * 1.4;
        ctx.fillStyle = 'rgba(63,185,80,0.55)';
        ctx.fillRect(bx - 7, base - bh, 14, bh);
      }

      // spoof order (only visible mid-attack)
      if (phase === 'diving' || phase === 'holding') {
        var sx = trackX(s, SPOOF_PRICE / 100);
        ctx.fillStyle = COL.bad;
        ctx.fillRect(sx - 5, base - 14, 10, 14);
        ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = COL.bad;
        ctx.fillText('$2 spoof', sx, base - 20);
      }

      // stop-loss threshold
      var tx = trackX(s, THRESHOLD / 100);
      ctx.strokeStyle = 'rgba(255,210,63,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, 34); ctx.lineTo(tx, base); ctx.stroke(); ctx.setLineDash([]);
      tag(ctx, tx - 34, 46, 'stop-loss 60¢', COL.gold);

      // quoted price marker
      var qx = trackX(s, quoted / 100);
      ctx.strokeStyle = COL.you; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(qx, 34); ctx.lineTo(qx, base); ctx.stroke();
      ctx.beginPath(); ctx.arc(qx, 34, 5, 0, Math.PI * 2); ctx.fillStyle = COL.you; ctx.fill();
      ctx.fillStyle = COL.you; ctx.font = '700 12px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('quoted ' + Math.round(quoted) + '¢', qx, 26);

      // position + status
      ctx.textAlign = 'left'; ctx.font = '700 12.5px Inter, sans-serif';
      ctx.fillStyle = open ? COL.remote : COL.bad;
      ctx.fillText(open ? 'POSITION: OPEN' : 'POSITION: SOLD @ ' + Math.round(sellPrice) + '¢', 40, base + 30);
      ctx.font = '500 11.5px Inter, sans-serif'; ctx.fillStyle = COL.mut;
      ctx.fillText(note, 40, base + 50);
    }
  }

  window.ArticleDemos = window.ArticleDemos || {};
  window.ArticleDemos.depthcheck = depthcheck;
})();
