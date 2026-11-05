(function () {
  var E = Eng, W = E.W, H = E.H, C = 10, R = 11, S = 21, HW = Math.sqrt(3) * S, X0 = 28, Y0 = 70, NCOL = 5;
  var st, t, iv, score, setRows;
  setRows = E.stat("Max rows", "5");

  function cx(r, c) { return X0 + c * HW + (r % 2 ? HW / 2 : 0); }
  function cy(r) { return Y0 + r * S * 1.5; }
  function col() { return E.ri(0, NCOL - 1); }
  function get(r, c) { if (r < 0 || r >= R || c < 0 || c >= C) return -1; var v = st[c][R - 1 - r]; return v == null ? -1 : v; }
  function nbrs(r, c) {
    var d = r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    return d.map(function (p) { return [r + p[0], c + p[1]]; });
  }
  function maxH() { var m = 0; st.forEach(function (s) { m = Math.max(m, s.length); }); return m; }
  function push() {
    for (var c = 0; c < C; c++) st[c].push(col());
    E.snd("tick");
    if (maxH() > R) { E.snd("hurt"); E.over(score); }
  }
  function hexPath(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + Math.PI / 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath();
  }

  E.game({
    reset: function () {
      st = []; for (var c = 0; c < C; c++) { st[c] = []; for (var i = 0; i < 5; i++) st[c].push(col()); }
      t = 0; iv = 6; score = 0; E.score(0);
    },
    update: function (dt) {
      t += dt;
      var pace = Math.max(2.6, 6 - score * 0.0025);
      iv -= dt;
      if (iv <= 0) { iv = pace; push(); }
      setRows(maxH() + "/" + R);
    },
    down: function (x, y) {
      var best = null, bd = S;
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        if (get(r, c) < 0) continue;
        var d = Math.hypot(cx(r, c) - x, cy(r) - y);
        if (d < bd) { bd = d; best = [r, c]; }
      }
      if (!best) return;
      var color = get(best[0], best[1]), seen = {}, q = [best], n = 0, cells = [];
      seen[best[0] + "," + best[1]] = true;
      while (q.length) {
        var p = q.pop(); cells.push(p); n++;
        nbrs(p[0], p[1]).forEach(function (nb) {
          var k = nb[0] + "," + nb[1];
          if (!seen[k] && get(nb[0], nb[1]) === color) { seen[k] = true; q.push(nb); }
        });
      }
      if (n < 2) { E.snd("bad"); return; }
      var rem = {};
      cells.forEach(function (p) { rem[p[1] + "," + (R - 1 - p[0])] = true; });
      for (var cc = 0; cc < C; cc++) st[cc] = st[cc].filter(function (v, i) { return !rem[cc + "," + i]; });
      score += n * n; E.score(score); E.snd(n >= 5 ? "win" : "good");
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      E.text(c, "Tap a group of 2 or more matching hexes", W / 2, 22, 14, "#99f6e4");
      c.fillStyle = "#171726"; c.fillRect(20, 40, W - 40, 12);
      c.fillStyle = "#14e0cc"; c.fillRect(20, 40, (W - 40) * E.clamp(1 - iv / Math.max(2.6, 6 - score * 0.0025), 0, 1), 12);
      if (!st) return;
      for (var r = 0; r < R; r++) for (var q = 0; q < C; q++) {
        var v = get(r, q), x = cx(r, q), y = cy(r);
        if (v < 0) { hexPath(c, x, y, S - 2); c.strokeStyle = "#171726"; c.lineWidth = 1; c.stroke(); continue; }
        hexPath(c, x, y, S - 1.5); c.fillStyle = E.PAL[v]; c.fill();
        c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.stroke();
      }
      c.strokeStyle = "#ef4444"; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(0, cy(R - 1) + S + 6); c.lineTo(W, cy(R - 1) + S + 6); c.stroke(); c.setLineDash([]);
      E.text(c, "Score " + score, W / 2, H - 22, 18, "#fff");
    }
  });
})();
