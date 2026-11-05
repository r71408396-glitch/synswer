(function () {
  var E = Eng, N = 8, cs = E.W / N;
  var mines, vis, pr, pc, level, dead;

  function gen() {
    var prot = [], r = 0, c = 0, i, j;
    for (i = 0; i < N; i++) { mines[i] = []; vis[i] = []; prot[i] = []; for (j = 0; j < N; j++) { mines[i][j] = false; vis[i][j] = false; prot[i][j] = false; } }
    prot[0][0] = true;
    while (r < N - 1 || c < N - 1) {
      if (r < N - 1 && (c === N - 1 || Math.random() < 0.5)) r++; else c++;
      prot[r][c] = true;
    }
    prot[0][1] = prot[1][0] = true;
    var want = Math.min(28, 8 + level * 3), tries = 0, placed = 0;
    while (placed < want && tries++ < 2000) {
      var a = E.ri(0, N - 1), b = E.ri(0, N - 1);
      if (!prot[a][b] && !mines[a][b]) { mines[a][b] = true; placed++; }
    }
    pr = 0; pc = 0; vis[0][0] = true;
  }
  function num(r, c) {
    var n = 0;
    for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
      var rr = r + a, cc = c + b;
      if ((a || b) && rr >= 0 && cc >= 0 && rr < N && cc < N && mines[rr][cc]) n++;
    }
    return n;
  }
  function go(r, c) {
    if (r < 0 || c < 0 || r >= N || c >= N) return;
    if (Math.abs(r - pr) + Math.abs(c - pc) !== 1) return;
    pr = r; pc = c;
    if (mines[r][c]) { dead = true; E.snd("boom"); E.over(level); return; }
    vis[r][c] = true; E.snd("tap");
    if (r === N - 1 && c === N - 1) { level++; E.score(level); E.snd("win"); gen(); }
  }

  E.game({
    reset: function () { mines = []; vis = []; level = 0; dead = false; gen(); E.score(0); },
    down: function (x, y) { go(Math.floor(y / cs), Math.floor(x / cs)); },
    key: function (k, down) {
      if (!down) return;
      var m = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
      if (m) go(pr + m[0], pc + m[1]);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, E.W, E.H);
      if (!mines.length) return;
      for (var r = 0; r < N; r++) for (var q = 0; q < N; q++) {
        var x = q * cs, y = r * cs, exit = r === N - 1 && q === N - 1;
        c.fillStyle = exit ? "#14532d" : vis[r][q] ? "#1f2a44" : "#171726";
        c.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        if (vis[r][q] && !exit) { var n = num(r, q); if (n) E.text(c, String(n), x + cs / 2, y + cs / 2, 22, ["", "#60a5fa", "#86efac", "#fca5a5", "#99f6e4", "#fde68a", "#fff", "#fff", "#fff"][n]); }
        if (exit) E.text(c, "EXIT", x + cs / 2, y + cs / 2, 13, "#86efac");
        if (dead && mines[r][q]) { c.fillStyle = "#ef4444"; c.beginPath(); c.arc(x + cs / 2, y + cs / 2, 10, 0, Math.PI * 2); c.fill(); }
      }
      c.beginPath(); c.arc(pc * cs + cs / 2, pr * cs + cs / 2, cs * 0.28, 0, Math.PI * 2);
      c.fillStyle = "#3b82f6"; c.fill(); c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
    }
  });
})();
