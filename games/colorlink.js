(function () {
  var E = Eng, N = 5, cs = E.W / N;
  var ep, up, act, left, boards, setTime;
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
  function gen() {
    for (var tries = 0; tries < 1500; tries++) {
      var own = new Array(N * N).fill(-1), paths = [], ok = true;
      var order = E.shuffle(Array.apply(null, { length: N * N }).map(function (_, i) { return i; }));
      for (var q = 0; q < order.length && ok; q++) {
        var s = order[q];
        if (own[s] >= 0) continue;
        var walk = [s], target = E.ri(3, 7);
        own[s] = paths.length;
        while (walk.length < target) {
          var free = nbrs(walk[walk.length - 1]).filter(function (n) { return own[n] < 0; });
          if (!free.length) break;
          var nx = free[E.ri(0, free.length - 1)];
          own[nx] = paths.length;
          walk.push(nx);
        }
        if (walk.length < 2) ok = false; else paths.push(walk);
      }
      if (ok && paths.length >= 3 && paths.length <= 7) {
        ep = paths.map(function (w) { return [w[0], w[w.length - 1]]; });
        return;
      }
    }
    ep = [0, 1, 2, 3, 4].map(function (r) { return [r * N, r * N + N - 1]; });
  }
  function newBoard() { gen(); up = ep.map(function () { return []; }); act = -1; }
  function epColor(i) { for (var k = 0; k < ep.length; k++) if (ep[k][0] === i || ep[k][1] === i) return k; return -1; }
  function owner(i) { for (var k = 0; k < up.length; k++) if (up[k].indexOf(i) >= 0) return k; return -1; }
  function complete(k) {
    var p = up[k];
    return p.length > 1 && p[0] !== p[p.length - 1] && epColor(p[p.length - 1]) === k;
  }
  function check() {
    for (var k = 0; k < ep.length; k++) if (!complete(k)) return;
    boards++;
    E.score(boards);
    E.snd("win");
    newBoard();
  }
  function stepTo(i) {
    var p = up[act], last = p[p.length - 1];
    if (i === last) return;
    var idx = p.indexOf(i);
    if (idx >= 0) { p.length = idx + 1; return; }
    if (!adj(last, i) || complete(act)) return;
    var e = epColor(i);
    if (e >= 0 && e !== act) return;
    if (e < 0) {
      var o = owner(i);
      if (o >= 0 && o !== act) up[o].length = up[o].indexOf(i);
    }
    p.push(i);
    E.snd("tap");
    check();
  }
  function cell(x, y) {
    var c = Math.floor(x / cs), r = Math.floor(y / cs);
    return c < 0 || r < 0 || c >= N || r >= N ? -1 : r * N + c;
  }

  E.game({
    reset: function () { boards = 0; left = 60; setTime(60); newBoard(); },
    update: function (dt) {
      left -= dt;
      setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(boards);
    },
    down: function (x, y) {
      var i = cell(x, y);
      if (i < 0) return;
      var k = epColor(i);
      if (k >= 0) { up[k] = [i]; act = k; return; }
      var o = owner(i);
      if (o >= 0) { up[o].length = up[o].indexOf(i) + 1; act = o; }
    },
    move: function (x, y, pressed) {
      if (!pressed || act < 0) return;
      var i = cell(x, y), guard = 0;
      if (i < 0) return;
      while (act >= 0 && guard++ < 8) {
        var p = up[act], last = p[p.length - 1];
        if (i === last) break;
        var nx = i;
        if (!adj(last, i) && p.indexOf(i) < 0) {
          var lr = Math.floor(last / N), lc = last % N, tr = Math.floor(i / N), tc = i % N;
          if (Math.abs(tr - lr) >= Math.abs(tc - lc)) nx = last + (tr > lr ? N : -N); else nx = last + (tc > lc ? 1 : -1);
        }
        var before = up[act].length, sig = up[act].join();
        stepTo(nx);
        if (act < 0 || up[act] === undefined) break;
        if (up[act].join() === sig) break;
      }
    },
    up: function () { act = -1; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      var i, k;
      for (i = 0; i < N * N; i++) {
        var o = owner(i), x = (i % N) * cs, y = Math.floor(i / N) * cs;
        c.fillStyle = o >= 0 ? E.PAL[o] + "33" : "#12121c";
        c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      }
      c.lineCap = "round"; c.lineJoin = "round";
      for (k = 0; k < up.length; k++) {
        if (!up[k].length) continue;
        c.strokeStyle = E.PAL[k];
        c.lineWidth = cs * 0.34;
        c.beginPath();
        up[k].forEach(function (cellI, n) {
          var px = (cellI % N + 0.5) * cs, py = (Math.floor(cellI / N) + 0.5) * cs;
          if (n) c.lineTo(px, py); else c.moveTo(px, py);
        });
        c.stroke();
      }
      for (k = 0; k < ep.length; k++) {
        ep[k].forEach(function (cellI) {
          c.beginPath();
          c.arc((cellI % N + 0.5) * cs, (Math.floor(cellI / N) + 0.5) * cs, cs * 0.3, 0, Math.PI * 2);
          c.fillStyle = E.PAL[k];
          c.fill();
          c.strokeStyle = "rgba(255,255,255,.5)";
          c.lineWidth = 2;
          c.stroke();
        });
      }
    }
  });
})();
