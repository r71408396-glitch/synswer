(function () {
  var E = Eng, W = E.W, H = E.H, RANGE = 170, HALF = 0.55;
  var px, py, tx, ty, fa, keys, sh, orbs, spT, score, t;

  function orb() { orbs.push({ x: E.rnd(30, W - 30), y: E.rnd(30, H - 30) }); }
  function adiff(a, b) { var d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }

  E.game({
    reset: function () {
      px = W / 2; py = H / 2; tx = px; ty = py; fa = 0; keys = {}; sh = []; orbs = []; spT = 2; score = 0; t = 0;
      for (var i = 0; i < 3; i++) orb();
      E.score(0);
    },
    update: function (dt) {
      t += dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 6) { vx = dx / d; vy = dy / d; } }
      if (vx || vy) { fa = Math.atan2(vy, vx); px = E.clamp(px + vx * 150 * dt, 10, W - 10); py = E.clamp(py + vy * 150 * dt, 10, H - 10); }
      spT -= dt;
      if (spT <= 0) {
        spT = Math.max(0.7, 2.2 - t * 0.025);
        var side = E.ri(0, 3);
        sh.push({ x: side === 0 ? -10 : side === 1 ? W + 10 : E.rnd(0, W), y: side === 2 ? -10 : side === 3 ? H + 10 : E.rnd(0, H), v: 50 + Math.min(40, t * 0.6) });
      }
      for (var i = 0; i < sh.length; i++) {
        var s = sh[i], ddx = px - s.x, ddy = py - s.y, dd = Math.hypot(ddx, ddy) || 1;
        var lit = dd < RANGE && adiff(Math.atan2(s.y - py, s.x - px), fa) < HALF;
        s.lit = lit;
        if (!lit) { s.x += ddx / dd * s.v * dt; s.y += ddy / dd * s.v * dt; }
        if (dd < 15) { E.snd("hurt"); E.over(score); return; }
      }
      for (var j = 0; j < orbs.length; j++) {
        if (Math.hypot(orbs[j].x - px, orbs[j].y - py) < 16) { orbs.splice(j--, 1); score++; E.score(score); E.snd("good"); orb(); }
      }
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#12121e"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "#1c1c30"; c.lineWidth = 1;
      for (var g = 0; g <= W; g += 40) { c.beginPath(); c.moveTo(g, 0); c.lineTo(g, H); c.stroke(); c.beginPath(); c.moveTo(0, g); c.lineTo(W, g); c.stroke(); }
      if (px == null) return;
      orbs.forEach(function (o) { c.beginPath(); c.arc(o.x, o.y, 7, 0, Math.PI * 2); c.fillStyle = "#facc15"; c.fill(); });
      sh.forEach(function (s) {
        c.beginPath(); c.arc(s.x, s.y, 13, 0, Math.PI * 2); c.fillStyle = s.lit ? "#6d28d9" : "#2a1450"; c.fill();
        c.fillStyle = "#f87171"; c.fillRect(s.x - 6, s.y - 3, 4, 4); c.fillRect(s.x + 2, s.y - 3, 4, 4);
      });
      c.fillStyle = "rgba(0,0,0,.95)";
      c.beginPath(); c.rect(0, 0, W, H); c.moveTo(px, py); c.arc(px, py, RANGE, fa - HALF, fa + HALF); c.closePath(); c.fill("evenodd");
      c.beginPath(); c.arc(px, py, 9, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      E.text(c, "Orbs " + score, W / 2, 16, 15, "#fde68a");
    }
  });
})();
