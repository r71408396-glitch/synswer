(function () {
  var E = Eng, N = 4, cs = 100, g, t, sx, sy, best;
  var COL = { 2: "#3b3b5c", 4: "#4c4c7a", 8: "#0e8f84", 16: "#0fc4b2", 32: "#14e0cc", 64: "#a855f7", 128: "#2563eb", 256: "#3b82f6", 512: "#0ea5e9", 1024: "#06b6d4", 2048: "#22c55e" };
  var setNext = E.stat("Next", "3");

  function empties() { var o = []; g.forEach(function (v, i) { if (!v) o.push(i); }); return o; }
  function spawn() {
    var e = empties();
    if (!e.length) return false;
    g[e[E.ri(0, e.length - 1)]] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }
  function canMove() {
    if (empties().length) return true;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var v = g[r * N + c];
      if (c < N - 1 && g[r * N + c + 1] === v) return true;
      if (r < N - 1 && g[(r + 1) * N + c] === v) return true;
    }
    return false;
  }
  function maxTile() { return Math.max.apply(null, g); }
  function finish() { E.snd("hurt"); E.over(maxTile()); }
  function slide(d) {
    var moved = false, merged = false;
    for (var i = 0; i < N; i++) {
      var idx = [];
      for (var j = 0; j < N; j++) idx.push(d === 0 ? i * N + j : d === 1 ? i * N + N - 1 - j : d === 2 ? j * N + i : (N - 1 - j) * N + i);
      var vals = idx.map(function (k) { return g[k]; }).filter(Boolean), out = [];
      for (var k = 0; k < vals.length; k++) {
        if (vals[k] === vals[k + 1]) { out.push(vals[k] * 2); k++; merged = true; } else out.push(vals[k]);
      }
      while (out.length < N) out.push(0);
      for (j = 0; j < N; j++) { if (g[idx[j]] !== out[j]) moved = true; g[idx[j]] = out[j]; }
    }
    if (moved) {
      E.snd(merged ? "good" : "move");
      E.score(maxTile());
      if (!canMove()) finish();
    }
  }

  E.game({
    reset: function () { g = new Array(16).fill(0); spawn(); spawn(); t = 3; E.score(maxTile()); setNext(3); },
    update: function (dt) {
      t -= dt;
      setNext(Math.max(1, Math.ceil(t)));
      if (t <= 0) {
        t += 3;
        E.snd("tap");
        spawn();
        if (!canMove()) finish();
      }
    },
    down: function (x, y) { sx = x; sy = y; },
    up: function (x, y) {
      if (sx == null) return;
      var dx = x - sx, dy = y - sy;
      sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) slide(dx < 0 ? 0 : 1); else slide(dy < 0 ? 2 : 3);
    },
    key: function (k, down) {
      if (!down) return;
      var m = { arrowleft: 0, a: 0, arrowright: 1, d: 1, arrowup: 2, w: 2, arrowdown: 3, s: 3 };
      if (m[k] != null) slide(m[k]);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      for (var i = 0; i < 16; i++) {
        var x = (i % N) * cs, y = Math.floor(i / N) * cs, v = g[i];
        E.rr(c, x + 5, y + 5, cs - 10, cs - 10, 12);
        c.fillStyle = v ? (COL[v] || "#16a34a") : "#171726";
        c.fill();
        if (v) E.text(c, String(v), x + cs / 2, y + cs / 2, v > 999 ? 28 : v > 99 ? 34 : 42, "#fff");
      }
      c.fillStyle = "#171726";
      c.fillRect(20, 428, E.W - 40, 10);
      c.fillStyle = "#14e0cc";
      c.fillRect(20, 428, (E.W - 40) * Math.max(0, t / 3), 10);
    }
  });
})();
