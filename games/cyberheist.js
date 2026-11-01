(function () {
  var E = Eng, W = E.W, H = E.H, N = 4, cs = 88, X0 = 24, Y0 = 70;
  var nodes, score, left, msg, msgT, fast, blackout, setTime;
  setTime = E.stat("Time", "45");

  function val() { return E.ri(1, 9); }
  function penalty() {
    var p = E.ri(0, 5), i;
    if (p === 0) { left -= 4; msg = "TRACE: -4 seconds"; }
    else if (p === 1) { for (i = 0; i < 3; i++) nodes[E.ri(0, 15)].lock = 3; msg = "FIREWALL: nodes locked"; }
    else if (p === 2) { var v = E.shuffle(nodes.map(function (n) { return n.v; })); nodes.forEach(function (n, k) { n.v = v[k]; }); msg = "SCRAMBLE: values shuffled"; }
    else if (p === 3) { blackout = 4; msg = "BLACKOUT: values hidden"; }
    else if (p === 4) { score = Math.max(0, score - 3); E.score(score); msg = "PURGE: -3 points"; }
    else { fast = 5; msg = "OVERCLOCK: time runs 2x"; }
    msgT = 1.6; E.snd("bad");
  }

  E.game({
    reset: function () {
      nodes = []; for (var i = 0; i < 16; i++) nodes.push({ v: val(), lock: 0, back: 0 });
      score = 0; left = 45; msg = "Hack nodes for points. Every hack has a cost."; msgT = 3; fast = 0; blackout = 0; setTime(45); E.score(0);
    },
    update: function (dt) {
      var drain = fast > 0 ? 2 : 1;
      left -= dt * drain; fast -= dt; blackout -= dt; msgT -= dt;
      setTime(Math.max(0, Math.ceil(left)));
      nodes.forEach(function (n) {
        if (n.lock > 0) n.lock -= dt;
        if (n.back > 0) { n.back -= dt; if (n.back <= 0) n.v = val(); }
      });
      if (left <= 0) E.over(score);
    },
    down: function (x, y) {
      var c = Math.floor((x - X0) / cs), r = Math.floor((y - Y0) / cs);
      if (c < 0 || r < 0 || c >= N || r >= N) return;
      var n = nodes[r * N + c];
      if (n.back > 0 || n.lock > 0) { E.snd("bad"); return; }
      score += n.v; n.back = 2.5; E.score(score); E.snd("good");
      penalty();
    },
    draw: function (c) {
      c.fillStyle = "#050a08"; c.fillRect(0, 0, W, H);
      E.text(c, "Score " + score, W / 2, 24, 20, "#4ade80");
      E.text(c, msgT > 0 ? msg : "", W / 2, 50, 14, "#fca5a5");
      if (!nodes) return;
      nodes.forEach(function (n, i) {
        var x = X0 + (i % N) * cs + 4, y = Y0 + Math.floor(i / N) * cs + 4, s = cs - 8;
        E.rr(c, x, y, s, s, 12);
        c.fillStyle = n.back > 0 ? "#0b1410" : n.lock > 0 ? "#3f1d1d" : "#0f2a1c"; c.fill();
        c.strokeStyle = n.lock > 0 ? "#ef4444" : "#22c55e"; c.lineWidth = 2; c.stroke();
        if (n.back > 0) return;
        E.text(c, n.lock > 0 ? "LOCK" : blackout > 0 ? "?" : String(n.v), x + s / 2, y + s / 2, n.lock > 0 ? 16 : 30, n.lock > 0 ? "#fca5a5" : "#86efac");
      });
    }
  });
})();
