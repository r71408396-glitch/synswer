(function () {
  var E = Eng, W = E.W, H = E.H;
  var sx, sy, tx, ty, items, spawnT, bigT, score, t, keys, stars;

  function steer(x, y) { tx = x; ty = y; }

  E.game({
    reset: function () {
      sx = tx = W / 2; sy = ty = H - 90; items = []; spawnT = 0.4; bigT = 1.5; score = 0; t = 0; keys = {};
      stars = []; for (var i = 0; i < 40; i++) stars.push([E.rnd(0, W), E.rnd(0, H), E.rnd(20, 70)]);
      E.score(0);
    },
    update: function (dt) {
      t += dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (kx || ky) { tx = sx + kx * 80; ty = sy + ky * 80; }
      sx += (tx - sx) * Math.min(1, dt * 9); sy += (ty - sy) * Math.min(1, dt * 9);
      sx = E.clamp(sx, 14, W - 14); sy = E.clamp(sy, 20, H - 20);
      stars.forEach(function (s) { s[1] += s[2] * dt; if (s[1] > H) { s[1] = 0; s[0] = E.rnd(0, W); } });
      spawnT -= dt; bigT -= dt;
      if (spawnT <= 0) { spawnT = E.rnd(0.5, 0.9); items.push({ x: E.rnd(20, W - 20), y: -20, vx: E.rnd(-20, 20), vy: E.rnd(80, 150), r: 9, big: false, a: 0 }); }
      if (bigT <= 0) {
        bigT = Math.max(0.55, 1.6 - t * 0.012);
        var r = E.rnd(28, 46);
        items.push({ x: E.rnd(r, W - r), y: -r, vx: E.rnd(-40, 40), vy: E.rnd(70, 120) + Math.min(80, t * 1.5), r: r, big: true, a: 0 });
      }
      for (var i = 0; i < items.length; i++) {
        var o = items[i];
        o.x += o.vx * dt; o.y += o.vy * dt; o.a += dt;
        if (o.y > H + 60) { items.splice(i--, 1); continue; }
        var dx = o.x - sx, dy = o.y - sy, d = Math.sqrt(dx * dx + dy * dy);
        if (o.big && d < o.r + 8) { E.snd("boom"); E.over(score); return; }
        if (!o.big && d < o.r + 14) { items.splice(i--, 1); score++; E.score(score); E.snd("good"); }
      }
    },
    down: function (x, y) { steer(x, y); },
    move: function (x, y) { steer(x, y); },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#05050a"; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(167,139,250,.5)";
      (stars || []).forEach(function (s) { c.fillRect(s[0], s[1], 2, 2); });
      (items || []).forEach(function (o) {
        c.save(); c.translate(o.x, o.y); c.rotate(o.a * (o.big ? 0.6 : 2));
        if (o.big) {
          c.fillStyle = "#475569"; c.strokeStyle = "#94a3b8"; c.lineWidth = 3;
          c.beginPath();
          for (var k = 0; k < 9; k++) { var an = k / 9 * Math.PI * 2, rr = o.r * (0.82 + 0.18 * Math.sin(k * 2.3)); c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
          c.closePath(); c.fill(); c.stroke();
        } else {
          c.fillStyle = "#facc15"; c.fillRect(-7, -7, 14, 14); c.strokeStyle = "#fff"; c.lineWidth = 2; c.strokeRect(-7, -7, 14, 14);
        }
        c.restore();
      });
      if (sx == null) return;
      c.fillStyle = "#8b5cf6";
      c.beginPath(); c.moveTo(sx, sy - 18); c.lineTo(sx + 13, sy + 14); c.lineTo(sx, sy + 8); c.lineTo(sx - 13, sy + 14); c.closePath(); c.fill();
      c.fillStyle = "#60a5fa"; c.fillRect(sx - 2, sy + 10, 4, 8);
      E.text(c, "Scrap " + score, W / 2, 18, 16, "#c4b5fd");
    }
  });
})();
