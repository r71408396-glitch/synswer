(function () {
  var E = Eng, W = E.W, H = E.H, BH = 24, BASE = H - 60;
  var blocks, mx, mw, dir, sp, cam, score, flash;

  function spawn() { mw = blocks[blocks.length - 1].w; dir = blocks.length % 2 ? 1 : -1; mx = dir > 0 ? -mw : W; }
  function drop() {
    var top = blocks[blocks.length - 1];
    var l = Math.max(mx, top.x), r = Math.min(mx + mw, top.x + top.w), ov = r - l;
    if (ov <= 2) { E.snd("bad"); E.over(score); return; }
    if (Math.abs(mx - top.x) < 6) { l = top.x; ov = top.w; flash = 0.3; E.snd("win"); } else E.snd("tap");
    blocks.push({ x: l, w: ov, c: E.PAL[blocks.length % 8] });
    score++; E.score(score);
    sp = Math.min(420, sp + 8);
    spawn();
  }

  E.game({
    reset: function () { blocks = [{ x: 100, w: 200, c: "#6d28d9" }]; sp = 150; cam = 0; score = 0; flash = 0; spawn(); E.score(0); },
    update: function (dt) {
      mx += dir * sp * dt;
      if (mx + mw > W + 40) dir = -1;
      if (mx < -40) dir = 1;
      var want = Math.max(0, (blocks.length - 8) * BH);
      cam += (want - cam) * Math.min(1, dt * 5);
      if (flash > 0) flash -= dt;
    },
    down: function () { drop(); },
    key: function (k, down) { if (down && k === " ") drop(); },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      if (!blocks) return;
      blocks.forEach(function (b, i) {
        c.fillStyle = b.c; c.fillRect(b.x, BASE - i * BH + cam, b.w, BH - 2);
        c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(b.x, BASE - i * BH + cam, b.w, 4);
      });
      var n = blocks.length;
      c.fillStyle = E.PAL[n % 8]; c.fillRect(mx, BASE - n * BH + cam, mw, BH - 2);
      E.text(c, String(score), W / 2, 40, 44, flash > 0 ? "#86efac" : "rgba(255,255,255,.8)");
      E.text(c, flash > 0 ? "Perfect!" : "Tap to drop", W / 2, H - 20, 15, flash > 0 ? "#86efac" : "#8383a3");
    }
  });
})();
