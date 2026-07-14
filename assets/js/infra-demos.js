/* ===========================================================================
   Interactive demo for "Reaching $0 idle cost: serverless-style game servers
   on GCP". A fleet wakes on connect, idles down, and sleeps — with a toggle
   for whether the controller also tears down the billing networking (the
   difference between the $25/mo middle rung and a true $0/mo). Built on
   window.DemoKit (assets/js/demo-kit.js). Registers window.ArticleDemos.idlecost.
   =========================================================================== */
(function () {
  'use strict';

  var K = window.DemoKit;
  var COL = K.COL;
  var clamp = K.clamp, now = K.now;
  var tapButton = K.tapButton, toggle = K.toggle;
  var frame = K.frame, stage = K.stage, controls = K.controls, caption = K.caption;
  var roundRect = K.roundRect, loop = K.loop;

  var RATE_AWAKE = 146;    // $/mo — compute + networking both up
  var RATE_NET_ONLY = 25;  // $/mo — compute asleep, networking still billing
  var COLDSTART_MS = 1300;
  var IDLE_WINDOW_MS = 4200;

  function idlecost(host) {
    var wrap = frame(host, 'demo-idlecost');
    var s = stage(wrap, 216);
    var ctx = s.ctx;
    var cc = controls(wrap);

    cc.appendChild(tapButton('▶ Player connects', function () { connect(); }));
    cc.appendChild(tapButton('✕ Player disconnects', function () { disconnect(); }));
    var teardownT = toggle('Tear down networking too', true);
    cc.appendChild(teardownT);

    caption(wrap, 'Connect a player, then disconnect and watch the idle timer. With the networking ' +
      'teardown ON the fleet reaches a true $0/mo; switch it OFF and compute goes to zero but the ' +
      'entry point and IPs keep billing at the $25/mo middle rung.');

    var state = 'asleep', stateT = now(), accrued = 0, lastT = now();

    function connect() {
      if (state === 'asleep') { state = 'waking'; stateT = now(); }
      else if (state === 'idle_wait') { state = 'awake'; }
    }
    function disconnect() {
      if (state === 'awake') { state = 'idle_wait'; stateT = now(); }
    }
    function rate() {
      if (state === 'asleep') return teardownT.on ? 0 : RATE_NET_ONLY;
      return RATE_AWAKE;
    }
    function computeOn() { return state !== 'asleep'; }
    function netOn() { return state !== 'asleep' || !teardownT.on; }

    loop(function (t) {
      var dt = Math.min(64, t - lastT); lastT = t;
      // $/mo -> $/hour (÷720) -> $/ms; 1 real second is treated as 1 sim hour
      accrued += rate() / 720 / 1000 * dt;

      if (state === 'waking' && t - stateT >= COLDSTART_MS) state = 'awake';
      if (state === 'idle_wait' && t - stateT >= IDLE_WINDOW_MS) { state = 'asleep'; stateT = t; }

      draw(t);
    });

    function draw(t) {
      var W = s.W, H = s.H;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12101a'; ctx.fillRect(0, 0, W, H);

      var r = rate();
      var stateColor = r === 0 ? COL.remote : (r === RATE_NET_ONLY ? COL.gold : COL.you);
      var stateLabel = {
        asleep: 'ASLEEP', waking: 'WAKING — cold start…',
        awake: 'AWAKE — player connected', idle_wait: 'IDLE — waiting to sleep',
      }[state];

      ctx.textAlign = 'left';
      ctx.font = "700 20px 'Space Grotesk', sans-serif";
      ctx.fillStyle = stateColor;
      ctx.fillText('$' + r + '/mo', 40, 42);
      ctx.font = '600 12.5px Inter, sans-serif'; ctx.fillStyle = COL.ink;
      ctx.fillText(stateLabel, 40, 62);

      // two lamps: compute / networking, centered
      var lampW = 76, gap = 40, startX = (W - (lampW * 2 + gap)) / 2;
      lamp(startX, 'COMPUTE', computeOn());
      lamp(startX + lampW + gap, 'NETWORKING', netOn());

      // idle countdown / cold-start progress bar
      if (state === 'idle_wait') {
        var remain = clamp(1 - (t - stateT) / IDLE_WINDOW_MS, 0, 1);
        bar(remain, COL.gold, 'sleeps in ' + Math.ceil(remain * IDLE_WINDOW_MS / 1000) + 's');
      } else if (state === 'waking') {
        var prog = clamp((t - stateT) / COLDSTART_MS, 0, 1);
        bar(prog, COL.you, 'cold start…');
      }

      ctx.textAlign = 'right'; ctx.font = '600 12px ui-monospace, monospace'; ctx.fillStyle = COL.mut;
      ctx.fillText('$' + accrued.toFixed(3) + ' accrued (compressed time)', W - 40, H - 18);

      function lamp(x, label, on) {
        var y = 92, w = lampW, h = 30;
        ctx.fillStyle = on ? 'rgba(255,107,74,0.9)' : 'rgba(255,255,255,0.06)';
        roundRect(ctx, x, y, w, h, 8); ctx.fill();
        ctx.strokeStyle = on ? COL.you : 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, w, h, 8); ctx.stroke();
        ctx.fillStyle = on ? '#151318' : COL.mut;
        ctx.font = '700 11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(on ? 'ON' : 'OFF', x + w / 2, y + h / 2 + 4);
        ctx.font = '600 10.5px Inter, sans-serif'; ctx.fillStyle = COL.mut; ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h + 16);
      }
      function bar(frac, color, label) {
        var bx = 40, by = 158, bw = W - 80, bh = 8;
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = color; ctx.fillRect(bx, by, bw * frac, bh);
        ctx.font = '600 11px Inter, sans-serif'; ctx.fillStyle = color; ctx.textAlign = 'left';
        ctx.fillText(label, bx, by - 8);
      }
    }
  }

  window.ArticleDemos = window.ArticleDemos || {};
  window.ArticleDemos.idlecost = idlecost;
})();
