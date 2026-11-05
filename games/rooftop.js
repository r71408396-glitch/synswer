(function () {
  var E = Eng, W = E.W, H = E.H, PX = 90, S = 22;
  var B, y, vy, sp, dist, pk, left, grounded, setT;
  setT = E.stat("Time", "90");

  function addB() {
    var l = B[B.length - 1];
    var gap = E.rnd(50, Math.min(130, 70 + dist / 60));
    var top = E.clamp(l.top + E.rnd(-45, 40), 130, H - 60);
    var w = E.rnd(110, 260);
    B.push({ x: l.x + l.w + gap, w: w, top: top, box: Math.random() < 0.55 ? { dx: E.rnd(20, w - 20), got: false } : null });
  }
  function score() { return Math.floor(dist / 12) + pk * 25; }
  function jump() { if (grounded) { vy = -640; grounded = false; E.snd("flip"); } }

  E.game({
    reset: function () {
      B = [{ x: -50, w: 400, top: 200, box: null }];
      dist = 0; pk = 0; left = 90; sp = 220; vy = 0; grounded = true; y = 200 - S;
      while (B[B.length - 1].x < W + 300) addB();
      setT(90); E.score(0);
    },
    update: function (dt) {
      left -= dt; setT(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(score()); return; }
      sp = Math.min(320, 220 + dist / 40);
      dist += sp * dt;
      var prev = y + S;
      vy += 1900 * dt; y += vy * dt; grounded = false;
      var i, b, sx;
      for (i = 0; i < B.length; i++) {
        b = B[i]; sx = b.x - dist;
        if (sx <= PX && sx + b.w >= PX && vy >= 0 && prev <= b.top + 4 && y + S >= b.top) { y = b.top - S; vy = 0; grounded = true; break; }
      }
      for (i = 0; i < B.length; i++) {
        b = B[i]; sx = b.x - dist;
        if (sx < PX + S / 2 && sx + b.w > PX - S / 2 && y + S > b.top + 8) { E.snd("hurt"); E.over(score()); return; }
        if (b.box && !b.box.got && Math.abs(sx + b.box.dx - PX) < 18 && y + S > b.top - 45) { b.box.got = true; pk++; E.snd("good"); }
      }
      if (y > H + 30) { E.snd("hurt"); E.over(score()); return; }
      while (B[0].x + B[0].w - dist < -60) B.shift();
      while (B[B.length - 1].x - dist < W + 200) addB();
      E.score(score());
    },
    down: function () { jump(); },
    key: function (k, down) { if (down && (k === " " || k === "arrowup" || k === "w")) jump(); },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      if (!B) return;
      B.forEach(function (b) {
        var sx = b.x - dist;
        c.fillStyle = "#2a2a4a"; c.fillRect(sx, b.top, b.w, H - b.top);
        c.fillStyle = "#14e0cc"; c.fillRect(sx, b.top, b.w, 4);
        c.fillStyle = "rgba(250,204,21,.35)";
        for (var wx = sx + 12; wx < sx + b.w - 12; wx += 24) for (var wy = b.top + 18; wy < H - 10; wy += 28) c.fillRect(wx, wy, 8, 12);
        if (b.box && !b.box.got) { c.fillStyle = "#f59e0b"; c.fillRect(sx + b.box.dx - 8, b.top - 16, 16, 16); c.strokeStyle = "#fde68a"; c.lineWidth = 2; c.strokeRect(sx + b.box.dx - 8, b.top - 16, 16, 16); }
      });
      if (y == null) return;
      c.fillStyle = "#3b82f6"; E.rr(c, PX - S / 2, y, S, S, 6); c.fill();
      c.fillStyle = "#f59e0b"; c.fillRect(PX - S / 2 - 6, y + 4, 8, 12);
      c.fillStyle = "#fff"; c.fillRect(PX + 2, y + 6, 5, 5);
      E.text(c, "Parcels " + pk, W - 55, 16, 15, "#fde68a");
    }
  });
})();
