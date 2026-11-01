(function () {
  var E = Eng, W = E.W, H = E.H, FL = 520, G = 900, BH = 22, SWINGS = 3;
  var B, aim, cool, nextW, t, nextSwing, swings, ball, warn, banked, endT, keys, setSwing;
  setSwing = E.stat("Swings", "0/" + SWINGS);

  function height() {
    var top = FL;
    B.forEach(function (b) { if (b.rest && b.y < top) top = b.y; });
    return Math.round((FL - top) / 10);
  }
  function drop(x) {
    if (cool > 0 || endT >= 0) return;
    var w = nextW;
    B.push({ x: E.clamp(x - w / 2, 0, W - w), y: 30, w: w, h: BH, vx: 0, vy: 0, rest: false, c: E.PAL[E.ri(0, 7)] });
    nextW = E.ri(5, 10) * 10; cool = 0.45; E.snd("tap");
  }
  function over(a, b) { return Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); }
  function launch() {
    banked += height(); swings++; setSwing(swings + "/" + SWINGS);
    var top = FL; B.forEach(function (b) { if (b.rest && b.y < top) top = b.y; });
    var y = top < FL - 20 ? E.rnd(top, FL - 30) : FL - 40;
    var dir = swings % 2 ? 1 : -1;
    ball = { x: dir > 0 ? -30 : W + 30, y: y, dir: dir };
    E.snd("boom");
  }

  E.game({
    reset: function () { B = []; aim = W / 2; cool = 0; nextW = 70; t = 0; swings = 0; nextSwing = 16; ball = null; banked = 0; endT = -1; keys = {}; setSwing("0/" + SWINGS); E.score(0); },
    update: function (dt) {
      t += dt; cool -= dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      aim = E.clamp(aim + kx * 260 * dt, 0, W);
      if (endT < 0) {
        nextSwing -= dt;
        if (!ball && nextSwing <= 2.2 && !warn && swings < SWINGS) warn = true;
        if (!ball && nextSwing <= 0 && swings < SWINGS) { warn = false; launch(); nextSwing = 16; }
      }
      if (ball) {
        ball.x += ball.dir * 230 * dt;
        B.forEach(function (b) {
          if (ball.x + 22 > b.x && ball.x - 22 < b.x + b.w && ball.y + 22 > b.y && ball.y - 22 < b.y + b.h) {
            b.rest = false; b.vx = ball.dir * E.rnd(220, 320); b.vy = -E.rnd(40, 160);
          }
        });
        if ((ball.dir > 0 && ball.x > W + 40) || (ball.dir < 0 && ball.x < -40)) {
          ball = null;
          if (swings >= SWINGS) endT = 3;
        }
      }
      if (endT >= 0) { endT -= dt; if (endT <= 0) { E.snd("win"); E.over(banked + height()); return; } }
      var order = B.slice().sort(function (a, b) { return b.y - a.y; });
      order.forEach(function (b) {
        if (b.vx) { b.x += b.vx * dt; b.vx *= 1 - Math.min(1, 1.8 * dt); if (Math.abs(b.vx) < 4) b.vx = 0; if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.4; } if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * 0.4; } }
        var bottom = b.y + b.h, sup = [];
        B.forEach(function (o) { if (o !== b && o.rest && Math.abs(bottom - o.y) <= 2 && over(b, o) > 2) sup.push(o); });
        if (b.rest) {
          if (bottom >= FL - 1) return;
          if (!sup.length) { b.rest = false; return; }
          var L = Infinity, R = -Infinity, cxp = b.x + b.w / 2;
          sup.forEach(function (o) { L = Math.min(L, o.x); R = Math.max(R, o.x + o.w); });
          if (cxp < L || cxp > R) { b.rest = false; b.vx = (cxp < L ? -1 : 1) * 60; }
          return;
        }
        var pb = bottom;
        b.vy += G * dt; b.y += b.vy * dt;
        if (b.y + b.h >= FL) { b.y = FL - b.h; b.vy = 0; b.rest = true; return; }
        for (var i = 0; i < B.length; i++) {
          var o = B[i];
          if (o === b || !o.rest) continue;
          if (over(b, o) > 2 && pb <= o.y + 3 && b.y + b.h >= o.y) { b.y = o.y - b.h; b.vy = 0; b.rest = true; E.snd("tick"); break; }
        }
      });
      B = B.filter(function (b) { return b.y < H + 50; });
      E.score(banked + height());
    },
    down: function (x) { aim = x; drop(x); },
    move: function (x) { aim = x; },
    key: function (k, down) { keys[k] = down; if (down && k === " ") drop(aim); },
    draw: function (c) {
      c.fillStyle = "#12131e"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#2a2a40"; c.fillRect(0, FL, W, H - FL);
      c.fillStyle = "#8b5cf6"; c.fillRect(0, FL, W, 3);
      if (!B) return;
      c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(aim - nextW / 2, 30, nextW, BH);
      c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(aim, 30 + BH); c.lineTo(aim, FL); c.stroke();
      B.forEach(function (b) {
        c.fillStyle = b.c; c.fillRect(b.x, b.y, b.w - 1, b.h - 1);
        c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(b.x, b.y, b.w - 1, 3);
      });
      if (warn && !ball) {
        c.fillStyle = "rgba(239,68,68," + (0.35 + 0.35 * Math.sin(t * 14)) + ")"; c.fillRect(0, 0, W, 6);
        E.text(c, "Wrecking ball incoming!", W / 2, 70, 18, "#fca5a5");
      }
      if (ball) {
        c.strokeStyle = "#94a3b8"; c.lineWidth = 3; c.beginPath(); c.moveTo(ball.x - ball.dir * 60, ball.y); c.lineTo(ball.x, ball.y); c.stroke();
        c.beginPath(); c.arc(ball.x, ball.y, 22, 0, Math.PI * 2); c.fillStyle = "#1f2937"; c.fill(); c.strokeStyle = "#ef4444"; c.lineWidth = 3; c.stroke();
      }
      E.text(c, "Height " + height() + "   Banked " + banked, W / 2, 16, 15, "#c4b5fd");
      if (endT >= 0) E.text(c, "Final count...", W / 2, 70, 18, "#86efac");
    }
  });
})();
