(function () {
  var E = Eng, N = 6, cs = E.W / N, TOTAL = 75;
  var rock, star, start, cabin, path, level, stars, left, skate, setTime;
  setTime = E.stat("Time", String(TOTAL));

  function nbrs(i) {
    var r = Math.floor(i / N), c = i % N, o = [];
    if (r > 0) o.push(i - N);
    if (r < N - 1) o.push(i + N);
    if (c > 0) o.push(i - 1);
    if (c < N - 1) o.push(i + 1);
    return o;
  }
  function adj(a, b) { return nbrs(a).indexOf(b) >= 0; }
  function gen() {
    var len = Math.min(16, 8 + level), walk;
    for (var t = 0; t < 400; t++) {
      walk = [E.ri(0, N * N - 1)];
      while (walk.length < len) {
        var free = nbrs(walk[walk.length - 1]).filter(function (n) { return walk.indexOf(n) < 0; });
        if (!free.length) break;
        walk.push(free[E.ri(0, free.length - 1)]);
      }
      if (walk.length >= len - 2) break;
    }
    start = walk[0]; cabin = walk[walk.length - 1];
    rock = new Array(N * N).fill(false); star = new Array(N * N).fill(false);
    var p = Math.min(0.6, 0.35 + level * 0.02);
    for (var i = 0; i < N * N; i++) if (walk.indexOf(i) < 0 && Math.random() < p) rock[i] = true;
    for (var k = 0; k < 2; k++) { var s = walk[E.ri(1, Math.max(1, walk.length - 2))]; if (s !== cabin) star[s] = true; }
    path = [start]; skate = null;
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
    if (last === cabin || rock[i] || !adj(last, i)) return false;
    path.push(i); E.snd("tap");
    if (i === cabin) {
      var got = path.filter(function (p) { return star[p]; }).length;
      level++; stars += got; E.score(level * 3 + stars); left = Math.min(TOTAL, left + 8); E.snd("win");
      skate = { t: 0, path: path.slice() };
    }
    return true;
  }
  function walkTo(i) {
    var g = 0;
    while (g++ < 6 && !skate) {
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
  function ctr(i) { return [(i % N + 0.5) * cs, (Math.floor(i / N) + 0.5) * cs]; }

  E.game({
    reset: function () { level = 0; stars = 0; left = TOTAL; setTime(TOTAL); E.score(0); gen(); },
    update: function (dt) {
      if (skate) { skate.t += dt * 9; if (skate.t >= skate.path.length - 1 + 0.5) gen(); return; }
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(level * 3 + stars);
    },
    down: function (x, y) {
      if (skate) return;
      var i = cell(x, y);
      if (i < 0) return;
      if (i === start) path = [start];
      else if (path.indexOf(i) >= 0) path.length = path.indexOf(i) + 1;
    },
    move: function (x, y, pressed) {
      if (!pressed || skate) return;
      var i = cell(x, y);
      if (i >= 0) walkTo(i);
    },
    draw: function (c) {
      c.fillStyle = "#0d1824"; c.fillRect(0, 0, E.W, E.H);
      var i;
      for (i = 0; i < N * N; i++) {
        var x = (i % N) * cs, y = Math.floor(i / N) * cs, used = path.indexOf(i) >= 0;
        c.fillStyle = rock[i] ? "#475569" : used ? "#bae6fd" : "#dbeafe";
        E.rr(c, x + 2, y + 2, cs - 4, cs - 4, rock[i] ? 14 : 6); c.fill();
        if (rock[i]) { c.fillStyle = "#64748b"; c.beginPath(); c.moveTo(x + cs * 0.3, y + cs * 0.7); c.lineTo(x + cs * 0.5, y + cs * 0.28); c.lineTo(x + cs * 0.72, y + cs * 0.7); c.fill(); }
        if (star[i] && !(skate && false)) E.text(c, "*", x + cs / 2, y + cs / 2 + 6, 34, "#f59e0b");
      }
      c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#0ea5e9"; c.lineWidth = cs * 0.14;
      c.beginPath();
      path.forEach(function (p, n) { var q = ctr(p); if (n) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
      c.stroke();
      var cb = ctr(cabin);
      c.fillStyle = "#b91c1c"; c.fillRect(cb[0] - 16, cb[1] - 4, 32, 22);
      c.beginPath(); c.moveTo(cb[0] - 20, cb[1] - 4); c.lineTo(cb[0], cb[1] - 22); c.lineTo(cb[0] + 20, cb[1] - 4); c.fillStyle = "#7f1d1d"; c.fill();
      c.fillStyle = "#fde68a"; c.fillRect(cb[0] - 4, cb[1] + 4, 8, 14);
      var sp = ctr(path[path.length - 1]);
      if (skate) {
        var k = Math.min(skate.path.length - 1, skate.t), a = Math.floor(k), b = Math.min(skate.path.length - 1, a + 1), f = k - a;
        var A = ctr(skate.path[a]), B = ctr(skate.path[b]);
        sp = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
      } else if (path.length === 1) sp = ctr(start);
      c.beginPath(); c.arc(sp[0], sp[1], cs * 0.22, 0, Math.PI * 2); c.fillStyle = "#6d28d9"; c.fill();
      c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
      E.text(c, "Cabins " + level + "  Stars " + stars, E.W / 2, 14, 13, "#0f172a");
    }
  });
})();
