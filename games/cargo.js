(function () {
  var E = Eng, W = E.W, H = E.H, X0 = 30, X1 = 370, FLOOR = 500, LINE = 270;
  var top, blocks, shape, sx, fall, fy, vy, score;

  function mk() {
    shape = { w: E.ri(3, 9) * 14, h: E.ri(2, 5) * 14, c: E.PAL[E.ri(0, 7)] };
    sx = E.clamp(sx, X0, X1 - shape.w);
  }
  function setX(x) { if (!fall) sx = Math.round(E.clamp(x - shape.w / 2, X0, X1 - shape.w)); }
  function drop() { if (!fall) { fall = true; fy = 60; vy = 0; E.snd("swoosh"); } }

  E.game({
    reset: function () { top = []; for (var i = 0; i < W; i++) top.push(FLOOR); blocks = []; score = 0; sx = 180; fall = false; fy = 60; vy = 0; mk(); E.score(0); },
    update: function (dt) {
      if (!fall) return;
      vy = Math.min(900, vy + 1400 * dt); fy += vy * dt;
      var land = FLOOR, x;
      for (x = sx; x < sx + shape.w; x++) if (top[x] < land) land = top[x];
      if (fy + shape.h >= land) {
        fy = land - shape.h;
        for (x = sx; x < sx + shape.w; x++) top[x] = fy;
        blocks.push({ x: sx, y: fy, w: shape.w, h: shape.h, c: shape.c });
        fall = false;
        if (fy < LINE) { E.snd("hurt"); E.over(score); return; }
        score++; E.score(score); E.snd("tap");
        mk();
      }
    },
    down: function (x) { setX(x); drop(); },
    move: function (x) { setX(x); },
    key: function (k, down) {
      if (!down || fall) return;
      if (k === "arrowleft" || k === "a") sx = Math.max(X0, sx - 14);
      else if (k === "arrowright" || k === "d") sx = Math.min(X1 - shape.w, sx + 14);
      else if (k === " " || k === "arrowdown" || k === "s") drop();
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#1c1c30"; c.fillRect(X0 - 8, LINE, X1 - X0 + 16, FLOOR - LINE);
      c.fillStyle = "#475569"; c.fillRect(X0 - 8, FLOOR, X1 - X0 + 16, 14);
      c.fillRect(X0 - 8, LINE, 8, FLOOR - LINE); c.fillRect(X1, LINE, 8, FLOOR - LINE);
      c.strokeStyle = "#ef4444"; c.lineWidth = 2; c.setLineDash([8, 6]);
      c.beginPath(); c.moveTo(0, LINE); c.lineTo(W, LINE); c.stroke(); c.setLineDash([]);
      E.text(c, "Do not stack above the red line", W / 2, LINE - 14, 13, "#fca5a5");
      if (!blocks) return;
      blocks.forEach(function (b) { c.fillStyle = b.c; c.fillRect(b.x, b.y, b.w - 1, b.h - 1); c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(b.x, b.y, b.w - 1, 3); });
      c.fillStyle = shape.c; c.globalAlpha = fall ? 1 : 0.85; c.fillRect(sx, fall ? fy : 60, shape.w - 1, shape.h - 1); c.globalAlpha = 1;
      if (!fall) { c.strokeStyle = "rgba(255,255,255,.2)"; c.beginPath(); c.moveTo(sx + shape.w / 2, 60 + shape.h); c.lineTo(sx + shape.w / 2, LINE); c.stroke(); }
      E.text(c, "Packed " + score, W / 2, 24, 20, "#fff");
      E.text(c, "Move, then tap to drop (arrows and space work)", W / 2, H - 20, 12, "#8383a3");
    }
  });
})();
