(function () {
  var E = Eng, N = 6, cs = E.W / N;
  var src, dst, rock, path, level, left, setTime;
  setTime = E.stat("Time", "60");

  function nbrs(i) {
    var r = Math.floor(i / N), c = i % N, o = [];
    if (r > 0) o.push(i - N);
    if (r < N - 1) o.push(i + N);
    if (c > 0) o.push(i - 1);
    if (c < N - 1) o.push(i + 1);
    return o;
  }
  function adj(a, b) { return nbrs(a).indexOf(b) >= 0; }
  function solvable() {
    var seen = {}, q = [src];
    seen[src] = true;
    while (q.length) {
      var i = q.pop();
      if (i === dst) return true;
      nbrs(i).forEach(function (j) { if (!rock[j] && !seen[j]) { seen[j] = true; q.push(j); } });
    }
    return false;
  }
  function gen() {
    for (var t = 0; t < 300; t++) {
      src = E.ri(0, N - 1) * N; dst = E.ri(0, N - 1) * N + N - 1;
      rock = new Array(N * N).fill(false);
      var n = Math.min(14, 7 + level), k = 0;
      while (k < n) { var i = E.ri(0, N * N - 1); if (i !== src && i !== dst && !rock[i]) { rock[i] = true; k++; } }
      if (solvable()) break;
    }
    path = [src];
  }
  function cell(x, y) {
    var c = Math.floor(x / cs), r = Math.floor(y / cs);
    return c < 0 || r < 0 || c >= N || r >= N ? -1 : r * N + c;
  }
  function stepTo(i) {
    var last = path[path.length - 1];
    if (i === last) return false;
    var idx = path.indexOf(i);
    if (idx >= 0) { path.length = idx + 1; return true; }
    if (last === dst || rock[i] || !adj(last, i)) return false;
    path.push(i);
    E.snd("tap");
    if (i === dst) {
      level++; E.score(level); left = Math.min(60, left + 6); E.snd("win"); gen();
    }
    return true;
  }
  function walk(i) {
    var lv = level, g = 0;
    while (g++ < 6 && lv === level) {
      var last = path[path.length - 1];
      if (i === last) return;
      var nx = i;
      if (!adj(last, i) && path.indexOf(i) < 0) {
        var lr = Math.floor(last / N), lc = last % N, tr = Math.floor(i / N), tc = i % N;
        if (Math.abs(tr - lr) >= Math.abs(tc - lc)) nx = last + (tr > lr ? N : -N); else nx = last + (tc > lc ? 1 : -1);
      }
      if (!stepTo(nx)) return;
    }
  }

  E.game({
    reset: function () { level = 0; left = 60; setTime(60); E.score(0); gen(); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(level);
    },
    down: function (x, y) {
      var i = cell(x, y);
      if (i < 0) return;
      if (i === src) path = [src];
      else if (path.indexOf(i) >= 0) path.length = path.indexOf(i) + 1;
    },
    move: function (x, y, pressed) {
      if (!pressed) return;
      var i = cell(x, y);
      if (i >= 0) walk(i);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, E.W, E.H);
      var i;
      for (i = 0; i < N * N; i++) {
        var x = (i % N) * cs, y = Math.floor(i / N) * cs;
        c.fillStyle = rock[i] ? "#3f3f55" : "#12121c";
        E.rr(c, x + 2, y + 2, cs - 4, cs - 4, rock[i] ? 8 : 4); c.fill();
        if (rock[i]) { c.fillStyle = "#64647e"; c.fillRect(x + cs * 0.3, y + cs * 0.3, cs * 0.4, cs * 0.4); }
      }
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = "#38bdf8"; c.lineWidth = cs * 0.3;
      c.beginPath();
      path.forEach(function (p, n) {
        var px = (p % N + 0.5) * cs, py = (Math.floor(p / N) + 0.5) * cs;
        if (n) c.lineTo(px, py); else c.moveTo(px, py);
      });
      c.stroke();
      var sx = (src % N + 0.5) * cs, sy = (Math.floor(src / N) + 0.5) * cs;
      c.beginPath(); c.arc(sx, sy, cs * 0.36, 0, Math.PI * 2); c.fillStyle = "#0ea5e9"; c.fill();
      c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
      E.text(c, "H2O", sx, sy, 14, "#fff");
      var dx = (dst % N + 0.5) * cs, dy = (Math.floor(dst / N) + 0.5) * cs, wet = path[path.length - 1] === dst;
      c.beginPath(); c.arc(dx, dy, cs * 0.36, 0, Math.PI * 2); c.fillStyle = wet ? "#22c55e" : "#854d0e"; c.fill();
      c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
      E.text(c, "Plant", dx, dy, 13, "#fff");
    }
  });
})();
