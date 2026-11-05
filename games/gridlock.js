(function () {
  var E = Eng, N = 6, cs = E.W / N;
  var P, moves, t, drag, setMoves, setTime;
  setMoves = E.stat("Moves");
  setTime = E.stat("Time", "0s");

  function occ(ex) {
    var g = [], i;
    for (i = 0; i < N; i++) g.push(new Array(N).fill(null));
    P.forEach(function (p) {
      if (p === ex) return;
      for (var k = 0; k < p.len; k++) g[p.h ? p.r : p.r + k][p.h ? p.c + k : p.c] = p;
    });
    return g;
  }
  function range(p) {
    var g = occ(p), lo = 0, hi = 0;
    if (p.h) {
      while (p.c - lo - 1 >= 0 && !g[p.r][p.c - lo - 1]) lo++;
      while (p.c + p.len + hi < N && !g[p.r][p.c + p.len + hi]) hi++;
    } else {
      while (p.r - lo - 1 >= 0 && !g[p.r - lo - 1][p.c]) lo++;
      while (p.r + p.len + hi < N && !g[p.r + p.len + hi][p.c]) hi++;
    }
    return [lo, hi];
  }
  function gen() {
    for (var tries = 0; tries < 60; tries++) {
      P = [{ r: 2, c: 4, len: 2, h: true, t: true }];
      for (var a = 0; a < 80 && P.length < 11; a++) {
        var h = Math.random() < 0.5, len = Math.random() < 0.6 ? 2 : 3;
        var r = E.ri(0, h ? N - 1 : N - len), c = E.ri(0, h ? N - len : N - 1);
        if (h && r === 2) continue;
        var g = occ(null), ok = true;
        for (var k = 0; k < len; k++) if (g[h ? r : r + k][h ? c + k : c]) ok = false;
        if (ok) P.push({ r: r, c: c, len: len, h: h });
      }
      // scramble by legal moves only, so the puzzle is always solvable
      for (var s = 0; s < 150; s++) {
        var p = P[E.ri(0, P.length - 1)], rg = range(p), opts = [];
        for (var d = -rg[0]; d <= rg[1]; d++) if (d) opts.push(d);
        if (!opts.length) continue;
        var dd = opts[E.ri(0, opts.length - 1)];
        if (p.h) p.c += dd; else p.r += dd;
      }
      if (P[0].c <= 1) return;
    }
  }

  E.game({
    reset: function () { gen(); moves = 0; t = 0; drag = null; setMoves(0); setTime("0s"); },
    update: function (dt) { t += dt; setTime(Math.floor(t) + "s"); },
    down: function (x, y) {
      var c = Math.floor(x / cs), r = Math.floor(y / cs), g = occ(null), p = g[r] && g[r][c];
      if (!p) return;
      drag = { p: p, sx: x, sy: y, rg: range(p), off: 0 };
    },
    move: function (x, y, pressed) {
      if (!drag || !pressed) return;
      var d = (drag.p.h ? x - drag.sx : y - drag.sy) / cs;
      drag.off = E.clamp(d, -drag.rg[0], drag.rg[1]);
    },
    up: function () {
      if (!drag) return;
      var n = Math.round(drag.off), p = drag.p;
      drag = null;
      if (!n) return;
      if (p.h) p.c += n; else p.r += n;
      moves++;
      setMoves(moves);
      E.snd("move");
      if (P[0].c === 4) {
        var sc = Math.max(10, 1000 - moves * 10 - Math.floor(t) * 2);
        E.snd("win");
        E.score(sc);
        E.over(sc);
      }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      c.strokeStyle = "rgba(20,224,204,.18)";
      c.lineWidth = 1;
      for (var i = 1; i < N; i++) {
        c.beginPath(); c.moveTo(i * cs, 0); c.lineTo(i * cs, E.H); c.stroke();
        c.beginPath(); c.moveTo(0, i * cs); c.lineTo(E.W, i * cs); c.stroke();
      }
      c.fillStyle = "#22c55e";
      c.fillRect(E.W - 6, 2 * cs + 8, 6, cs - 16);
      P.forEach(function (p, i) {
        var off = drag && drag.p === p ? drag.off : 0;
        var x = (p.h ? p.c + off : p.c) * cs + 4, y = (p.h ? p.r : p.r + off) * cs + 4;
        var w = (p.h ? p.len : 1) * cs - 8, h = (p.h ? 1 : p.len) * cs - 8;
        E.rr(c, x, y, w, h, 12);
        c.fillStyle = p.t ? "#14e0cc" : ["#3b82f6", "#0ea5e9", "#475569", "#64748b", "#2563eb"][i % 5];
        c.fill();
        c.strokeStyle = p.t ? "#99f6e4" : "rgba(255,255,255,.18)";
        c.lineWidth = 2;
        c.stroke();
        if (p.t) E.text(c, ">", x + w - 26, y + h / 2, 26, "#fff");
      });
    }
  });
})();
