(function () {
  var E = Eng, W = E.W, H = E.H, N = 8, cs = W / N;
  var T, px, py, tx, ty, keys, t, spT, dead;

  function cand() {
    var o = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var k = r * N + c;
      if (T[k].s !== 0) continue;
      var edge = r === 0 || c === 0 || r === N - 1 || c === N - 1;
      var nb = (r > 0 && T[k - N].s === 2) || (r < N - 1 && T[k + N].s === 2) || (c > 0 && T[k - 1].s === 2) || (c < N - 1 && T[k + 1].s === 2);
      if (edge || nb) o.push(k);
    }
    return o;
  }

  E.game({
    reset: function () {
      T = []; for (var i = 0; i < N * N; i++) T.push({ s: 0, tm: 0 });
      px = W / 2; py = H / 2; tx = px; ty = py; keys = {}; t = 0; spT = 1.5; dead = false; E.score(0);
    },
    update: function (dt) {
      t += dt; E.score(Math.floor(t));
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 5) { vx = dx / d; vy = dy / d; } }
      px = E.clamp(px + vx * 150 * dt, -5, W + 5); py = E.clamp(py + vy * 150 * dt, -5, H + 5);
      spT -= dt;
      if (spT <= 0) {
        spT = Math.max(0.3, 1.1 - t * 0.012);
        var cs2 = cand();
        if (cs2.length) { var k = cs2[E.ri(0, cs2.length - 1)]; T[k].s = 1; T[k].tm = 1.3; }
      }
      for (var i = 0; i < T.length; i++) if (T[i].s === 1) { T[i].tm -= dt; if (T[i].tm <= 0) T[i].s = 2; }
      var ix = Math.floor(px / cs), iy = Math.floor(py / cs);
      if (ix < 0 || iy < 0 || ix >= N || iy >= N || T[iy * N + ix].s === 2) { dead = true; E.snd("hurt"); E.over(Math.floor(t)); }
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#0b2a4a"; c.fillRect(0, 0, W, H);
      if (!T) return;
      for (var i = 0; i < N * N; i++) {
        var x = (i % N) * cs, y = Math.floor(i / N) * cs, s = T[i];
        if (s.s === 2) continue;
        var sh = s.s === 1 ? Math.sin(s.tm * 40) * 2 : 0;
        c.fillStyle = s.s === 1 ? "#b45309" : (Math.floor(i / N) + i) % 2 ? "#4d7c0f" : "#65a30d";
        c.fillRect(x + 1 + sh, y + 1, cs - 2, cs - 2);
      }
      if (px == null) return;
      c.beginPath(); c.arc(px, py, 11, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      E.text(c, Math.floor(t) + " s", W / 2, 16, 16, "#fff");
    }
  });
})();
