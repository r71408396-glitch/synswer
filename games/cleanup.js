(function () {
  var E = Eng, W = E.W, H = E.H, R = 13;
  var F = [[60, 60, 90, 40], [250, 80, 80, 60], [40, 260, 60, 80], [240, 280, 110, 50]];
  var px, py, tx, ty, keys, dirt, score, left, level, setTime;
  setTime = E.stat("Time", "40");

  function hit(x, y) {
    if (x < R || y < R || x > W - R || y > H - R) return true;
    for (var i = 0; i < F.length; i++) {
      var f = F[i], nx = E.clamp(x, f[0], f[0] + f[2]), ny = E.clamp(y, f[1], f[1] + f[3]);
      if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < R * R) return true;
    }
    return false;
  }
  function fill() {
    dirt = [];
    var n = 24 + level * 6;
    while (dirt.length < n) {
      var x = E.rnd(14, W - 14), y = E.rnd(14, H - 14), ok = true;
      for (var i = 0; i < F.length; i++) if (x > F[i][0] - 8 && x < F[i][0] + F[i][2] + 8 && y > F[i][1] - 8 && y < F[i][1] + F[i][3] + 8) ok = false;
      if (ok) dirt.push({ x: x, y: y, k: E.ri(0, 2) });
    }
  }

  E.game({
    reset: function () { px = W / 2; py = H / 2 + 30; tx = px; ty = py; keys = {}; score = 0; left = 40; level = 0; setTime(40); fill(); E.score(0); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.over(score); return; }
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 4) { vx = dx / d; vy = dy / d; } }
      var nx = px + vx * 160 * dt, ny = py + vy * 160 * dt;
      if (!hit(nx, py)) px = nx;
      if (!hit(px, ny)) py = ny;
      for (var i = 0; i < dirt.length; i++) {
        if (Math.hypot(dirt[i].x - px, dirt[i].y - py) < R + 5) { dirt.splice(i--, 1); score++; E.score(score); E.snd("tick"); }
      }
      if (!dirt.length) { level++; left = Math.min(45, left + 8); E.snd("win"); fill(); }
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#2a2234"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#322a3e";
      for (var gx = 0; gx < W; gx += 40) for (var gy = 0; gy < H; gy += 40) if ((gx + gy) / 40 % 2 === 0) c.fillRect(gx, gy, 40, 40);
      F.forEach(function (f) { c.fillStyle = "#6b4f3a"; c.fillRect(f[0], f[1], f[2], f[3]); c.fillStyle = "#8b6b52"; c.fillRect(f[0], f[1], f[2], 5); });
      if (!dirt) return;
      dirt.forEach(function (d) { c.fillStyle = ["#a16207", "#78716c", "#65a30d"][d.k]; c.fillRect(d.x - 3, d.y - 3, 6, 6); });
      c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.fillStyle = "#38bdf8"; c.fill();
      c.strokeStyle = "#e0f2fe"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "#0c4a6e"; c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fill();
      E.text(c, "Cleaned " + score + "   Room " + (level + 1), W / 2, 16, 15, "#fff");
    }
  });
})();
