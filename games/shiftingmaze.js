(function () {
  var E = Eng, W = E.W, H = E.H, N = 9, cs = W / N;
  var g, pr, pc, gr = 7, gc = 7, moves, left, level, flash, sx, sy, setShift, setTime;
  setShift = E.stat("Shift in", "5");
  setTime = E.stat("Time", "90");

  function carve(r, c) {
    g[r][c] = 0;
    E.shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]]).forEach(function (d) {
      var nr = r + d[0], nc = c + d[1];
      if (nr > 0 && nc > 0 && nr < N - 1 && nc < N - 1 && g[nr][nc] === 1) { g[r + d[0] / 2][c + d[1] / 2] = 0; carve(nr, nc); }
    });
  }
  function gen() {
    g = [];
    for (var r = 0; r < N; r++) g[r] = new Array(N).fill(1);
    carve(1, 1);
    pr = 1; pc = 1; moves = 0; setShift(5);
  }
  function rotate() {
    var ng = [], r, c;
    for (r = 0; r < N; r++) ng[r] = new Array(N).fill(1);
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) ng[c][N - 1 - r] = g[r][c];
    g = ng; g[pr][pc] = 0; g[gr][gc] = 0;
    flash = 0.5; E.snd("flip");
  }
  function mv(dr, dc) {
    var r = pr + dr, c = pc + dc;
    if (r < 0 || c < 0 || r >= N || c >= N || g[r][c]) return;
    pr = r; pc = c; moves++;
    if (pr === gr && pc === gc) {
      level++; E.score(level); left = Math.min(90, left + 10); E.snd("win"); gen(); return;
    }
    E.snd("move");
    if (moves % 5 === 0) rotate();
    setShift(5 - moves % 5);
  }

  E.game({
    reset: function () { level = 0; left = 90; flash = 0; setTime(90); E.score(0); gen(); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (flash > 0) flash -= dt;
      if (left <= 0) E.over(level);
    },
    down: function (x, y) { sx = x; sy = y; },
    up: function (x, y) {
      if (sx == null) return;
      var dx = x - sx, dy = y - sy;
      sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { dx = x - (pc + 0.5) * cs; dy = y - (pr + 0.5) * cs; }
      if (Math.abs(dx) > Math.abs(dy)) mv(0, dx > 0 ? 1 : -1); else mv(dy > 0 ? 1 : -1, 0);
    },
    key: function (k, down) {
      if (!down) return;
      var m = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
      if (m) mv(m[0], m[1]);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      if (!g) return;
      for (var r = 0; r < N; r++) for (var q = 0; q < N; q++) {
        var x = q * cs, y = r * cs;
        if (g[r][q]) { c.fillStyle = flash > 0 ? "#0fc4b2" : "#3b3b5c"; c.fillRect(x, y, cs, cs); c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x, y, cs, 4); }
        else { c.fillStyle = "#171726"; c.fillRect(x + 1, y + 1, cs - 2, cs - 2); }
      }
      E.text(c, "EXIT", (gc + 0.5) * cs, (gr + 0.5) * cs, 13, "#86efac");
      c.beginPath(); c.arc((pc + 0.5) * cs, (pr + 0.5) * cs, cs * 0.3, 0, Math.PI * 2);
      c.fillStyle = "#3b82f6"; c.fill(); c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
    }
  });
})();
