(function () {
  var E = Eng, W = E.W, H = E.H;
  var sx, sy, tx, ty, items, spawnT, bigT, score, t, keys, stars, ufos, bolts, ufoT;

  // Pseudo-3D flying saucer: shaded hull, glass dome, ring lights that go round, soft shadow glow.
  function drawUfo(c, u) {
    var s = u.s, tilt = E.clamp(u.vx / 900, -0.25, 0.25);
    c.save(); c.translate(u.x, u.y); c.rotate(tilt); c.scale(s, s);
    var gl = c.createRadialGradient(0, 6, 4, 0, 6, 54);
    gl.addColorStop(0, "rgba(74,222,128,.35)"); gl.addColorStop(1, "rgba(74,222,128,0)");
    c.fillStyle = gl; c.beginPath(); c.arc(0, 6, 54, 0, Math.PI * 2); c.fill();
    var hull = c.createLinearGradient(0, -4, 0, 16);
    hull.addColorStop(0, "#cbd5e1"); hull.addColorStop(0.5, "#64748b"); hull.addColorStop(1, "#1e293b");
    c.fillStyle = hull; c.beginPath(); c.ellipse(0, 6, 34, 11, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#94a3b8"; c.beginPath(); c.ellipse(0, 3, 26, 7, 0, Math.PI, Math.PI * 2); c.fill();
    var dome = c.createRadialGradient(-5, -12, 2, 0, -6, 18);
    dome.addColorStop(0, "rgba(220,252,231,.95)"); dome.addColorStop(0.6, "rgba(34,197,94,.7)"); dome.addColorStop(1, "rgba(5,80,40,.9)");
    c.fillStyle = dome; c.beginPath(); c.ellipse(0, -2, 15, 15, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = "#14532d"; c.beginPath(); c.arc(0, -6, 3, 0, Math.PI * 2); c.fill();
    for (var k = 0; k < 6; k++) {
      var an = u.a * 3 + k * Math.PI / 3, lx = Math.cos(an) * 25, front = Math.sin(an) > 0;
      c.fillStyle = front ? "#fde047" : "#713f12";
      c.beginPath(); c.arc(lx, 8 + Math.sin(an) * 4, front ? 2.6 : 1.6, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function steer(x, y) { tx = x; ty = y; }

  E.game({
    reset: function () {
      sx = tx = W / 2; sy = ty = H - 90; items = []; spawnT = 0.4; bigT = 1.5; score = 0; t = 0; keys = {}; ufos = []; bolts = []; ufoT = E.rnd(6, 10);
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
      ufoT -= dt;
      if (ufoT <= 0) {
        ufoT = E.rnd(7, 14);
        var dir = Math.random() < 0.5 ? 1 : -1;
        ufos.push({ x: dir > 0 ? -50 : W + 50, y: E.rnd(60, 220), vx: dir * E.rnd(70, 110), a: 0, s: 1, shot: E.rnd(0.6, 1.1), n: 0 });
      }
      for (var u = 0; u < ufos.length; u++) {
        var ufo = ufos[u];
        ufo.x += ufo.vx * dt; ufo.a += dt; ufo.s = 1 + 0.12 * Math.sin(ufo.a * 1.7);
        ufo.y += Math.sin(ufo.a * 2.2) * 14 * dt;
        if ((ufo.vx > 0 && ufo.x > W + 60) || (ufo.vx < 0 && ufo.x < -60)) { ufos.splice(u--, 1); continue; }
        ufo.shot -= dt;
        if (ufo.shot <= 0 && ufo.x > 10 && ufo.x < W - 10) {
          ufo.shot = E.rnd(1.1, 1.8);
          var bx = sx - ufo.x, by = sy - ufo.y, bl = Math.sqrt(bx * bx + by * by) || 1;
          bolts.push({ x: ufo.x, y: ufo.y + 14, vx: bx / bl * 200, vy: by / bl * 200, a: 0 });
        }
      }
      for (var q = 0; q < bolts.length; q++) {
        var bo = bolts[q];
        bo.x += bo.vx * dt; bo.y += bo.vy * dt; bo.a += dt;
        if (bo.x < -30 || bo.x > W + 30 || bo.y < -30 || bo.y > H + 30) { bolts.splice(q--, 1); continue; }
        var bdx = bo.x - sx, bdy = bo.y - sy;
        if (bdx * bdx + bdy * bdy < 15 * 15) { E.snd("boom"); E.over(score); return; }
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
      (ufos || []).forEach(function (u) { drawUfo(c, u); });
      (bolts || []).forEach(function (b) {
        var pr = 1 + 0.25 * Math.sin(b.a * 14);
        var bg = c.createRadialGradient(b.x, b.y, 1, b.x, b.y, 11 * pr);
        bg.addColorStop(0, "#f0fdf4"); bg.addColorStop(0.4, "#4ade80"); bg.addColorStop(1, "rgba(34,197,94,0)");
        c.fillStyle = bg; c.beginPath(); c.arc(b.x, b.y, 11 * pr, 0, Math.PI * 2); c.fill();
      });
      if (sx == null) return;
      c.fillStyle = "#14e0cc";
      c.beginPath(); c.moveTo(sx, sy - 18); c.lineTo(sx + 13, sy + 14); c.lineTo(sx, sy + 8); c.lineTo(sx - 13, sy + 14); c.closePath(); c.fill();
      c.fillStyle = "#60a5fa"; c.fillRect(sx - 2, sy + 10, 4, 8);
      E.text(c, "Scrap " + score, W / 2, 18, 16, "#99f6e4");
    }
  });
})();
