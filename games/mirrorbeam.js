(function () {
  var E = Eng, W = E.W, H = E.H, N = 7, cs = W / N;
  var mir, pathMir, crystal, srow, level, left, setTime;
  setTime = E.stat("Time", "90");

  function trace() {
    var r = srow, c = 0, dr = 0, dc = 1, hit = false, pts = [[-0.5, srow + 0.5]], g = 0;
    while (g++ < 80) {
      pts.push([c + 0.5, r + 0.5]);
      if (r < 0 || c < 0 || r >= N || c >= N) break;
      var i = r * N + c;
      if (i === crystal) { hit = true; break; }
      var t;
      if (mir[i] === 1) { t = dr; dr = -dc; dc = -t; }
      else if (mir[i] === 2) { t = dr; dr = dc; dc = t; }
      r += dr; c += dc;
    }
    return { hit: hit, pts: pts };
  }
  function gen() {
    for (var t = 0; t < 300; t++) {
      var m = new Array(N * N).fill(0), used = new Array(N * N).fill(false), pm = [];
      var r = E.ri(0, N - 1), c = 0, dr = 0, dc = 1, ok = true, k;
      used[r * N + c] = true; srow = r;
      var turns = Math.min(6, 2 + Math.floor(level / 2));
      for (k = 0; k < turns && ok; k++) {
        var s = E.ri(0, 3);
        while (s-- > 0) {
          var nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= N || nc >= N || used[nr * N + nc]) break;
          r = nr; c = nc; used[r * N + c] = true;
        }
        var opts = [[dc, dr], [-dc, -dr]].filter(function (o) {
          var a = r + o[0], b = c + o[1];
          return a >= 0 && b >= 0 && a < N && b < N && !used[a * N + b];
        });
        if (!opts.length) { ok = false; break; }
        var o = opts[E.ri(0, opts.length - 1)];
        m[r * N + c] = (o[0] === -dc && o[1] === -dr) ? 1 : 2;
        pm.push(r * N + c);
        dr = o[0]; dc = o[1]; r += dr; c += dc; used[r * N + c] = true;
      }
      if (!ok) continue;
      var s2 = E.ri(0, 2);
      while (s2-- > 0) {
        var a = r + dr, b = c + dc;
        if (a < 0 || b < 0 || a >= N || b >= N || used[a * N + b]) break;
        r = a; c = b; used[r * N + c] = true;
      }
      crystal = r * N + c;
      var d = E.ri(3, 6), tries = 0;
      while (d > 0 && tries++ < 200) { var i = E.ri(0, N * N - 1); if (!used[i] && !m[i]) { m[i] = E.ri(1, 2); d--; } }
      pm.forEach(function (i) { if (Math.random() < 0.7) m[i] = 3 - m[i]; });
      mir = m; pathMir = pm;
      if (trace().hit) { m[pm[0]] = 3 - m[pm[0]]; if (trace().hit) continue; }
      return;
    }
    srow = 3; crystal = 3; mir = new Array(N * N).fill(0); mir[3 * N + 3] = 2; pathMir = [3 * N + 3];
  }

  E.game({
    reset: function () { level = 0; left = 90; setTime(90); E.score(0); gen(); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(level);
    },
    down: function (x, y) {
      var cc = Math.floor(x / cs), rr = Math.floor(y / cs);
      if (cc < 0 || rr < 0 || cc >= N || rr >= N) return;
      var i = rr * N + cc;
      if (!mir[i]) return;
      mir[i] = 3 - mir[i];
      E.snd("tap");
      if (trace().hit) { level++; E.score(level); left = Math.min(90, left + 8); E.snd("win"); gen(); }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      if (!mir) return;
      var i, x, y;
      for (i = 0; i < N * N; i++) {
        x = (i % N) * cs; y = Math.floor(i / N) * cs;
        c.fillStyle = "#12121c"; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      }
      var tr = trace();
      c.lineCap = "round"; c.lineJoin = "round";
      c.shadowColor = "#f87171"; c.shadowBlur = 10;
      c.strokeStyle = "#f87171"; c.lineWidth = 4;
      c.beginPath();
      tr.pts.forEach(function (p, n) { if (n) c.lineTo(p[0] * cs, p[1] * cs); else c.moveTo(p[0] * cs, p[1] * cs); });
      c.stroke();
      c.shadowBlur = 0;
      for (i = 0; i < N * N; i++) {
        if (!mir[i]) continue;
        x = (i % N) * cs; y = Math.floor(i / N) * cs;
        var m = 10;
        c.fillStyle = "rgba(167,139,250,.35)";
        c.beginPath();
        if (mir[i] === 1) { c.moveTo(x + m, y + cs - m); c.lineTo(x + cs - m, y + cs - m); c.lineTo(x + cs - m, y + m); }
        else { c.moveTo(x + m, y + m); c.lineTo(x + m, y + cs - m); c.lineTo(x + cs - m, y + cs - m); }
        c.closePath(); c.fill();
        c.strokeStyle = "#e9d5ff"; c.lineWidth = 5;
        c.beginPath();
        if (mir[i] === 1) { c.moveTo(x + m, y + cs - m); c.lineTo(x + cs - m, y + m); }
        else { c.moveTo(x + m, y + m); c.lineTo(x + cs - m, y + cs - m); }
        c.stroke();
      }
      var cx = (crystal % N + 0.5) * cs, cy = (Math.floor(crystal / N) + 0.5) * cs;
      c.fillStyle = tr.hit ? "#22c55e" : "#06b6d4";
      c.beginPath(); c.moveTo(cx, cy - 20); c.lineTo(cx + 15, cy); c.lineTo(cx, cy + 20); c.lineTo(cx - 15, cy); c.closePath(); c.fill();
      c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#ef4444"; c.fillRect(0, srow * cs + cs / 2 - 8, 8, 16);
      E.text(c, "Solved " + level, W - 44, 14, 14, "#c4b5fd");
    }
  });
})();
