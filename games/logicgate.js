(function () {
  var E = Eng, W = E.W, H = E.H, N = 5, cs = 70, X0 = 25, Y0 = 38;
  var on, level, left, setTime;
  setTime = E.stat("Time", "60");

  function litSet() {
    var lit = new Array(N * N).fill(false);
    if (!on[0]) return lit;
    var q = [0]; lit[0] = true;
    while (q.length) {
      var i = q.pop(), r = Math.floor(i / N), c = i % N;
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (p) {
        if (p[0] < 0 || p[1] < 0 || p[0] >= N || p[1] >= N) return;
        var j = p[0] * N + p[1];
        if (on[j] && !lit[j]) { lit[j] = true; q.push(j); }
      });
    }
    return lit;
  }
  function gen() {
    do {
      on = [];
      for (var i = 0; i < N * N; i++) on.push(Math.random() < 0.5);
    } while (litSet()[N * N - 1]);
  }
  function toggle(i) {
    on[i] = !on[i];
    if (Math.floor(i / N) < N - 1) on[i + N] = !on[i + N];
    E.snd("tap");
    if (litSet()[N * N - 1]) { level++; E.score(level); left = Math.min(60, left + 6); E.snd("win"); gen(); }
  }

  E.game({
    reset: function () { level = 0; left = 60; setTime(60); E.score(0); gen(); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(level);
    },
    down: function (x, y) {
      var c = Math.floor((x - X0) / cs), r = Math.floor((y - Y0) / cs);
      if (c < 0 || r < 0 || c >= N || r >= N) return;
      toggle(r * N + c);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      E.text(c, "Each switch also flips the one below it. Power IN to OUT.", W / 2, 20, 13, "#99f6e4");
      if (!on) return;
      var lit = litSet();
      for (var i = 0; i < N * N; i++) {
        var x = X0 + (i % N) * cs, y = Y0 + Math.floor(i / N) * cs;
        E.rr(c, x + 4, y + 4, cs - 8, cs - 8, 12);
        c.fillStyle = lit[i] ? "#facc15" : on[i] ? "#2563eb" : "#171726"; c.fill();
        c.strokeStyle = on[i] ? "rgba(255,255,255,.5)" : "#2a2a4a"; c.lineWidth = 2; c.stroke();
        E.text(c, on[i] ? "ON" : "OFF", x + cs / 2, y + cs / 2 - 4, 16, lit[i] ? "#422006" : on[i] ? "#fff" : "#6d6d8a");
        if (Math.floor(i / N) < N - 1) E.text(c, "v", x + cs / 2, y + cs - 14, 12, "rgba(255,255,255,.4)");
      }
      E.text(c, "IN", X0 - 12, Y0 + cs / 2, 12, "#facc15");
      E.text(c, "OUT", X0 + N * cs - 20, Y0 + N * cs + 12, 12, lit[N * N - 1] ? "#86efac" : "#fca5a5");
    }
  });
})();
