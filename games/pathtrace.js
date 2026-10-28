(function () {
  var E = Eng, W = E.W, H = E.H, N = 5, CS = 80, Y0 = 40;
  var path, pos, phase, t, level;

  function nb(i) {
    var r = Math.floor(i / N), c = i % N, o = [];
    if (r > 0) o.push(i - N);
    if (r < N - 1) o.push(i + N);
    if (c > 0) o.push(i - 1);
    if (c < N - 1) o.push(i + 1);
    return o;
  }
  function gen() {
    var len = Math.min(16, 3 + level);
    for (var tries = 0; tries < 400; tries++) {
      var p = [E.ri(0, N * N - 1)];
      while (p.length < len) {
        var free = nb(p[p.length - 1]).filter(function (n) { return p.indexOf(n) < 0; });
        if (!free.length) break;
        p.push(free[E.ri(0, free.length - 1)]);
      }
      if (p.length === len) return p;
    }
    return [0, 1, 2];
  }
  function start() { path = gen(); pos = 0; phase = "show"; t = 2; }
  function cellAt(x, y) {
    var c = Math.floor(x / CS), r = Math.floor((y - Y0) / CS);
    return c < 0 || r < 0 || c >= N || r >= N ? -1 : r * N + c;
  }
  function handle(c) {
    if (phase !== "input" || c < 0) return;
    if (pos > 0 && c === path[pos - 1]) return;
    if (c === path[pos]) {
      pos++;
      E.snd("tap");
      if (pos === path.length) {
        level++;
        E.score(level);
        E.snd("win");
        start();
      }
    } else if (path.indexOf(c) >= 0 && path.indexOf(c) < pos) {
      return;
    } else {
      E.snd("bad");
      E.over(level);
    }
  }
  function ctr(i) { return [(i % N + 0.5) * CS, Y0 + (Math.floor(i / N) + 0.5) * CS]; }

  E.game({
    reset: function () { level = 0; E.score(0); start(); },
    update: function (dt) {
      if (phase === "show") { t -= dt; if (t <= 0) phase = "input"; }
    },
    down: function (x, y) { handle(cellAt(x, y)); },
    move: function (x, y, pressed) { if (pressed) handle(cellAt(x, y)); },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      E.text(c, phase === "show" ? "Memorize the path" : "Trace it from the green cell", W / 2, 20, 17, "#c4b5fd");
      var i, p;
      for (i = 0; i < N * N; i++) {
        var x = (i % N) * CS, y = Y0 + Math.floor(i / N) * CS, idxp = path ? path.indexOf(i) : -1;
        var color = "#14142a";
        if (phase === "show" && idxp >= 0) color = idxp === 0 ? "#16a34a" : "#6d28d9";
        else if (phase === "input" && idxp >= 0 && idxp < pos) color = "#3b82f6";
        else if (phase === "input" && idxp === 0) color = "#16a34a55";
        E.rr(c, x + 3, y + 3, CS - 6, CS - 6, 10);
        c.fillStyle = color;
        c.fill();
      }
      if (!path) return;
      var upto = phase === "show" ? path.length : pos;
      if (upto > 1) {
        c.strokeStyle = "rgba(255,255,255,.7)";
        c.lineWidth = 8; c.lineCap = "round"; c.lineJoin = "round";
        c.beginPath();
        for (i = 0; i < upto; i++) { p = ctr(path[i]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
        c.stroke();
      }
    }
  });
})();
