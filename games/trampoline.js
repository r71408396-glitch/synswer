(function () {
  var E = Eng, W = E.W, H = E.H, GY = H - 40;
  var px, py, vy, tx, tdir, combo, stars, spawnT, score, left, target, keys, setTime, setCombo;
  setTime = E.stat("Time", "45");
  setCombo = E.stat("Bounce", "0");

  function star(c, x, y, r, col) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fillStyle = col; c.fill();
  }

  E.game({
    reset: function () {
      px = W / 2; py = GY - 200; vy = 0; tx = W / 2; tdir = 1; combo = 0; stars = []; spawnT = 0.2; score = 0; left = 45; target = W / 2; keys = {};
      setTime(45); setCombo(0); E.score(0);
    },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(score); return; }
      tx += tdir * (110 + Math.min(120, score * 4)) * dt;
      if (tx > W - 55) { tx = W - 55; tdir = -1; }
      if (tx < 55) { tx = 55; tdir = 1; }
      if (keys.arrowleft || keys.a) target -= 320 * dt;
      if (keys.arrowright || keys.d) target += 320 * dt;
      target = E.clamp(target, 14, W - 14);
      px += (target - px) * Math.min(1, dt * 10);
      var prev = py;
      vy += 900 * dt; py += vy * dt;
      if (vy > 0 && prev + 14 <= GY && py + 14 >= GY && Math.abs(px - tx) < 56) {
        combo++; setCombo(combo); py = GY - 14;
        vy = -(520 + Math.min(500, combo * 50));
        E.snd("bounce");
      } else if (py + 14 >= H - 8) {
        py = H - 22; vy = -380; combo = 0; setCombo(0); E.snd("bad");
      }
      if (py < 14) { py = 14; vy = Math.abs(vy) * 0.3; }
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = E.rnd(0.6, 1.0); stars.push({ x: E.rnd(30, W - 30), y: E.rnd(40, 400), vy: E.rnd(25, 45) }); }
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y += s.vy * dt;
        var dx = s.x - px, dy = s.y - py;
        if (dx * dx + dy * dy < 26 * 26) { stars.splice(i--, 1); score++; E.score(score); E.snd("good"); continue; }
        if (s.y > H + 20) stars.splice(i--, 1);
      }
    },
    down: function (x) { target = x; },
    move: function (x) { target = x; },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      (stars || []).forEach(function (s) { star(c, s.x, s.y, 14, "#facc15"); });
      c.fillStyle = "#3b1d1d"; c.fillRect(0, H - 8, W, 8);
      if (px == null) return;
      c.fillStyle = "#14e0cc"; E.rr(c, tx - 52, GY, 104, 10, 5); c.fill();
      c.fillStyle = "#99f6e4"; c.fillRect(tx - 44, GY + 10, 4, 22); c.fillRect(tx + 40, GY + 10, 4, 22);
      c.beginPath(); c.arc(px, py, 14, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#fff"; c.fillRect(px - 6, py - 4, 4, 5); c.fillRect(px + 2, py - 4, 4, 5);
      E.text(c, String(score), W / 2, 36, 36, "rgba(255,255,255,.7)");
    }
  });
})();
