(function () {
  var E = Eng, W = E.W, H = E.H, R = 7;
  var px, py, tx, ty, keys, walls, cans, o, score, t;

  function hit(x, y) {
    if (x < R || y < R || x > W - R || y > H - R) return true;
    for (var i = 0; i < walls.length; i++) {
      var w = walls[i], nx = E.clamp(x, w[0], w[0] + w[2]), ny = E.clamp(y, w[1], w[1] + w[3]);
      if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < R * R) return true;
    }
    return false;
  }
  function can() {
    for (var i = 0; i < 40; i++) {
      var x = E.rnd(20, W - 20), y = E.rnd(20, H - 20);
      if (!hit(x, y) && Math.hypot(x - px, y - py) > 90) { cans.push({ x: x, y: y }); return; }
    }
  }

  E.game({
    reset: function () {
      walls = [];
      for (var i = 0; i < 9; i++) {
        var w = E.rnd(40, 90), h = E.rnd(20, 70), x = E.rnd(10, W - w - 10), y = E.rnd(10, H - h - 10);
        if (Math.abs(x + w / 2 - W / 2) < w / 2 + 50 && Math.abs(y + h / 2 - H / 2) < h / 2 + 50) continue;
        walls.push([x, y, w, h]);
      }
      px = W / 2; py = H / 2; tx = px; ty = py; keys = {}; cans = []; o = 100; score = 0; t = 0;
      can(); can(); E.score(0);
    },
    update: function (dt) {
      t += dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 5) { vx = dx / d; vy = dy / d; } }
      var nx = px + vx * 130 * dt, ny = py + vy * 130 * dt;
      if (!hit(nx, py)) px = nx;
      if (!hit(px, ny)) py = ny;
      o -= dt * (2.3 + score * 0.12);
      for (var i = 0; i < cans.length; i++) {
        if (Math.hypot(cans[i].x - px, cans[i].y - py) < 16) { cans.splice(i--, 1); o = Math.min(100, o + 28); score++; E.score(score); E.snd("good"); can(); }
      }
      if (cans.length < 2) can();
      if (o <= 0) { E.snd("hurt"); E.over(score); }
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#101524"; c.fillRect(0, 0, W, H);
      if (!walls) return;
      walls.forEach(function (w) { c.fillStyle = "#475569"; c.fillRect(w[0], w[1], w[2], w[3]); c.fillStyle = "#64748b"; c.fillRect(w[0], w[1], w[2], 4); });
      cans.forEach(function (k) { c.fillStyle = "#22d3ee"; E.rr(c, k.x - 6, k.y - 9, 12, 18, 4); c.fill(); c.fillStyle = "#fff"; c.fillRect(k.x - 2, k.y - 12, 4, 4); });
      var vis = 40 + o * 0.9;
      c.fillStyle = "rgba(0,0,0,.96)";
      c.beginPath(); c.rect(0, 0, W, H); c.moveTo(px + vis, py); c.arc(px, py, vis, 0, Math.PI * 2); c.fill("evenodd");
      c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#171726"; c.fillRect(20, 10, W - 40, 12);
      c.fillStyle = o < 25 ? "#ef4444" : "#22d3ee"; c.fillRect(20, 10, (W - 40) * Math.max(0, o) / 100, 12);
      E.text(c, "Oxygen   Canisters " + score, W / 2, 36, 13, "#99f6e4");
    }
  });
})();
