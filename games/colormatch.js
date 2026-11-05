(function () {
  var E = Eng, W = E.W, H = E.H, N = 6, cs = 62, X0 = 14, Y0 = 70, NC = 5;
  var g, score, left, setTime, sr, sc, sx, sy;
  setTime = E.stat("Time", "60");

  function rc() { return E.ri(0, NC - 1); }
  function resolve() {
    var chain = 0, total = 0, r, c, k;
    for (;;) {
      var mk = [], cnt = 0;
      for (r = 0; r < N; r++) mk[r] = new Array(N).fill(false);
      for (r = 0; r < N; r++) {
        c = 0;
        while (c < N) {
          var e = c;
          while (e + 1 < N && g[r][e + 1] === g[r][c]) e++;
          if (e - c >= 2) for (k = c; k <= e; k++) mk[r][k] = true;
          c = e + 1;
        }
      }
      for (c = 0; c < N; c++) {
        r = 0;
        while (r < N) {
          var f = r;
          while (f + 1 < N && g[f + 1][c] === g[r][c]) f++;
          if (f - r >= 2) for (k = r; k <= f; k++) mk[k][c] = true;
          r = f + 1;
        }
      }
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (mk[r][c]) cnt++;
      if (!cnt) break;
      chain++; total += cnt * chain;
      for (c = 0; c < N; c++) {
        var col = [];
        for (r = N - 1; r >= 0; r--) if (!mk[r][c]) col.push(g[r][c]);
        while (col.length < N) col.push(rc());
        for (r = 0; r < N; r++) g[N - 1 - r][c] = col[r];
      }
    }
    return total;
  }
  function shiftRow(r, d) {
    var row = g[r].slice();
    for (var c = 0; c < N; c++) g[r][(c + d + N) % N] = row[c];
    after();
  }
  function shiftCol(c, d) {
    var col = [], r;
    for (r = 0; r < N; r++) col.push(g[r][c]);
    for (r = 0; r < N; r++) g[(r + d + N) % N][c] = col[r];
    after();
  }
  function after() {
    var p = resolve();
    if (p > 0) { score += p; E.score(score); E.snd("good"); } else E.snd("move");
  }
  function shape(c, v, x, y, r) {
    c.fillStyle = E.PAL[v];
    c.beginPath();
    if (v === 0) c.arc(x, y, r, 0, Math.PI * 2);
    else if (v === 1) c.rect(x - r, y - r, r * 2, r * 2);
    else if (v === 2) { c.moveTo(x, y - r); c.lineTo(x + r, y + r); c.lineTo(x - r, y + r); c.closePath(); }
    else if (v === 3) { c.moveTo(x, y - r * 1.2); c.lineTo(x + r, y); c.lineTo(x, y + r * 1.2); c.lineTo(x - r, y); c.closePath(); }
    else { c.rect(x - r, y - r * 0.35, r * 2, r * 0.7); c.rect(x - r * 0.35, y - r, r * 0.7, r * 2); }
    c.fill();
  }

  E.game({
    reset: function () {
      g = [];
      for (var r = 0; r < N; r++) { g[r] = []; for (var c = 0; c < N; c++) g[r][c] = rc(); }
      resolve();
      score = 0; left = 60; sr = -1; sc = -1; setTime(60); E.score(0);
    },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) E.over(score);
    },
    down: function (x, y) {
      sx = x; sy = y;
      sc = Math.floor((x - X0) / cs); sr = Math.floor((y - Y0) / cs);
      if (sc < 0 || sr < 0 || sc >= N || sr >= N) sr = -1;
    },
    up: function (x, y) {
      if (sr < 0) return;
      var dx = x - sx, dy = y - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) shiftRow(sr, dx > 0 ? 1 : -1); else shiftCol(sc, dy > 0 ? 1 : -1);
      sr = -1;
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      E.text(c, "Swipe a row or column to slide it. Line up 3 or more.", W / 2, 30, 13, "#99f6e4");
      E.text(c, "Score " + score, W / 2, 52, 18, "#fff");
      if (!g) return;
      for (var r = 0; r < N; r++) for (var q = 0; q < N; q++) {
        var x = X0 + q * cs, y = Y0 + r * cs;
        c.fillStyle = "#171726"; E.rr(c, x + 2, y + 2, cs - 4, cs - 4, 10); c.fill();
        shape(c, g[r][q], x + cs / 2, y + cs / 2, 17);
      }
    }
  });
})();
