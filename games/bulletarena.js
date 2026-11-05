(function () {
  var E = Eng, W = E.W, H = E.H;
  var px, py, tx, ty, keys, en, pb, eb, fireT, spT, lives, score, inv, t, setL;
  setL = E.stat("Lives", "3");

  function hurt() {
    if (inv > 0) return;
    lives--; inv = 1.2; setL(lives); E.snd("hurt");
  }

  E.game({
    reset: function () {
      px = W / 2; py = H / 2; tx = px; ty = py; keys = {}; en = []; pb = []; eb = []; fireT = 0; spT = 1; lives = 3; score = 0; inv = 0; t = 0;
      setL(3); E.score(0);
    },
    update: function (dt) {
      t += dt; inv -= dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 5) { vx = dx / d; vy = dy / d; } }
      px = E.clamp(px + vx * 170 * dt, 10, W - 10); py = E.clamp(py + vy * 170 * dt, 10, H - 10);
      spT -= dt;
      if (spT <= 0) {
        spT = Math.max(0.5, 1.6 - t * 0.02);
        var side = E.ri(0, 3);
        en.push({ x: side === 0 ? 0 : side === 1 ? W : E.rnd(0, W), y: side === 2 ? 0 : side === 3 ? H : E.rnd(0, H), hp: t > 40 ? 2 : 1 });
      }
      fireT -= dt;
      if (fireT <= 0 && en.length) {
        var n = null, nd = 1e9;
        en.forEach(function (e) { var dd = Math.hypot(e.x - px, e.y - py); if (dd < nd) { nd = dd; n = e; } });
        var a = Math.atan2(n.y - py, n.x - px);
        pb.push({ x: px, y: py, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, l: 1.2 });
        fireT = 0.3; E.snd("tick");
      }
      var i, j;
      for (i = 0; i < pb.length; i++) {
        var b = pb[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt;
        var gone = b.l <= 0;
        for (j = 0; j < en.length && !gone; j++) {
          if (Math.hypot(en[j].x - b.x, en[j].y - b.y) < 13) {
            gone = true; en[j].hp--;
            if (en[j].hp <= 0) {
              var e = en.splice(j, 1)[0];
              score++; E.score(score); E.snd("boom");
              for (var k = 0; k < 8; k++) { var ang = k * Math.PI / 4; eb.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 110, vy: Math.sin(ang) * 110, l: 3 }); }
            }
          }
        }
        if (gone) pb.splice(i--, 1);
      }
      var sp = Math.min(95, 45 + t * 0.6);
      for (i = 0; i < en.length; i++) {
        var q = en[i], ddx = px - q.x, ddy = py - q.y, dd = Math.hypot(ddx, ddy) || 1;
        q.x += ddx / dd * sp * dt; q.y += ddy / dd * sp * dt;
        if (dd < 17) hurt();
      }
      for (i = 0; i < eb.length; i++) {
        var f = eb[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.l -= dt;
        if (f.l <= 0 || f.x < -10 || f.x > W + 10 || f.y < -10 || f.y > H + 10) { eb.splice(i--, 1); continue; }
        if (Math.hypot(f.x - px, f.y - py) < 10) { eb.splice(i--, 1); hurt(); }
      }
      if (lives <= 0) E.over(score);
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "#14e0cc"; c.lineWidth = 3; c.strokeRect(2, 2, W - 4, H - 4);
      if (px == null) return;
      en.forEach(function (e) { c.beginPath(); c.arc(e.x, e.y, 12, 0, Math.PI * 2); c.fillStyle = e.hp > 1 ? "#7c2d12" : "#dc2626"; c.fill(); c.strokeStyle = "#fecaca"; c.lineWidth = 2; c.stroke(); });
      eb.forEach(function (f) { c.beginPath(); c.arc(f.x, f.y, 5, 0, Math.PI * 2); c.fillStyle = "#fb923c"; c.fill(); });
      c.fillStyle = "#60a5fa"; pb.forEach(function (b) { c.beginPath(); c.arc(b.x, b.y, 3.5, 0, Math.PI * 2); c.fill(); });
      c.globalAlpha = inv > 0 && Math.floor(inv * 10) % 2 ? 0.4 : 1;
      c.beginPath(); c.arc(px, py, 10, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      E.text(c, "Defeated " + score, W / 2, 18, 15, "#99f6e4");
    }
  });
})();
