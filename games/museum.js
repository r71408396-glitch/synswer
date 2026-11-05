(function () {
  var E = Eng, W = E.W, H = E.H, N = 6, CS = 52, X0 = 44, Y0 = 56, DAYS = 7, RENT = 30;
  var T = [{ n: "Vase", cost: 20, val: 4, c: "#38bdf8" }, { n: "Statue", cost: 45, val: 10, c: "#5eead4" }, { n: "Dino", cost: 90, val: 22, c: "#f97316" }];
  var grid, sel, money, day, phase, vis, tm, income, msg, setDay;
  setDay = E.stat("Day", "1/" + DAYS);

  function cell(i) { return [X0 + (i % N + 0.5) * CS, Y0 + (Math.floor(i / N) + 0.5) * CS]; }
  function route() {
    var pts = [[-0.5, 0]], cur = [-0.5, 0], items = [];
    grid.forEach(function (g, i) { if (g >= 0 && Math.random() < 0.75) items.push({ x: i % N, y: Math.floor(i / N), t: g }); });
    var len = 0, val = 0, seen = [];
    while (items.length) {
      var bi = 0, bd = 1e9;
      items.forEach(function (it, k) { var d = Math.abs(it.x - cur[0]) + Math.abs(it.y - cur[1]); if (d < bd) { bd = d; bi = k; } });
      var it = items.splice(bi, 1)[0];
      len += bd; cur = [it.x, it.y]; pts.push(cur); seen.push(it);
    }
    len += Math.abs(N - 0.5 - cur[0]) + Math.abs(N - 1 - cur[1]);
    pts.push([N - 0.5, N - 1]);
    return { pts: pts, len: len, seen: seen };
  }
  function openDay() {
    if (phase !== "plan") return;
    income = 0; vis = [];
    var views = {};
    for (var v = 0; v < 10; v++) {
      var r = route(), gain = Math.round(r.len * 1.5);
      r.seen.forEach(function (it) { var k = it.x + "," + it.y; var seen = views[k] || 0; gain += Math.max(1, T[it.t].val - seen); views[k] = seen + 1; });
      income += gain;
      vis.push({ pts: r.pts, d: -v * 1.1, len: r.len, col: E.PAL[v % 8] });
    }
    phase = "run"; tm = 0; E.snd("swoosh");
  }
  function pointAt(v, d) {
    var p = v.pts, acc = 0;
    for (var i = 1; i < p.length; i++) {
      var sl = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
      if (d <= acc + sl) {
        var f = sl ? (d - acc) / sl : 0, a = p[i - 1], b = p[i];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      acc += sl;
    }
    return null;
  }

  E.game({
    reset: function () { grid = new Array(N * N).fill(-1); sel = 0; money = 150; day = 1; phase = "plan"; vis = []; income = 0; msg = "Place artifacts, then open the doors"; setDay("1/" + DAYS); E.score(money); },
    update: function (dt) {
      if (phase !== "run") return;
      tm += dt;
      var alive = false;
      vis.forEach(function (v) { v.d += dt * 5; if (pointAt(v, Math.max(0, v.d))) alive = true; });
      if (!alive) {
        money += income - RENT; msg = "Day " + day + ": +" + income + " tickets, -" + RENT + " rent";
        E.score(Math.max(0, money)); E.snd("good");
        if (day >= DAYS || money < 0) { E.over(Math.max(0, money)); return; }
        day++; setDay(day + "/" + DAYS); phase = "plan";
      }
    },
    down: function (x, y) {
      if (phase !== "plan") return;
      var c = Math.floor((x - X0) / CS), r = Math.floor((y - Y0) / CS);
      if (c >= 0 && r >= 0 && c < N && r < N) {
        var i = r * N + c;
        if (grid[i] >= 0) { money += Math.floor(T[grid[i]].cost / 2); grid[i] = -1; E.snd("flip"); }
        else if (money >= T[sel].cost) { money -= T[sel].cost; grid[i] = sel; E.snd("tap"); }
        else E.snd("bad");
        E.score(Math.max(0, money));
        return;
      }
      if (y >= 392 && y <= 436) { var s = Math.floor((x - 10) / 130); if (s >= 0 && s < 3) { sel = s; E.snd("tap"); } }
      if (y >= 444 && y <= 486) openDay();
    },
    key: function (k, down) { if (down && "123".indexOf(k) >= 0 && k.length === 1) sel = parseInt(k, 10) - 1; else if (down && k === " ") openDay(); },
    draw: function (c) {
      c.fillStyle = "#14121c"; c.fillRect(0, 0, W, H);
      E.text(c, "Money " + money, W / 2, 24, 20, money < 40 ? "#fca5a5" : "#fde68a");
      E.text(c, msg, W / 2, 44, 12, "#99f6e4");
      if (!grid) return;
      for (var i = 0; i < N * N; i++) {
        var p = cell(i);
        E.rr(c, p[0] - CS / 2 + 2, p[1] - CS / 2 + 2, CS - 4, CS - 4, 6); c.fillStyle = (i + Math.floor(i / N)) % 2 ? "#221f30" : "#1a1827"; c.fill();
        if (grid[i] >= 0) { c.fillStyle = T[grid[i]].c; E.rr(c, p[0] - 14, p[1] - 14, 28, 28, 7); c.fill(); E.text(c, T[grid[i]].n.charAt(0), p[0], p[1], 15, "#111"); }
      }
      E.text(c, "IN", X0 - 22, Y0 + CS / 2, 12, "#86efac");
      E.text(c, "OUT", X0 + N * CS + 20, Y0 + (N - 0.5) * CS, 12, "#fca5a5");
      vis.forEach(function (v) {
        var q = pointAt(v, Math.max(0, v.d));
        if (!q || v.d < 0) return;
        c.beginPath(); c.arc(X0 + (q[0] + 0.5) * CS, Y0 + (q[1] + 0.5) * CS, 6, 0, Math.PI * 2); c.fillStyle = v.col; c.fill();
      });
      for (var s = 0; s < 3; s++) {
        E.rr(c, 10 + s * 130, 392, 124, 44, 10); c.fillStyle = sel === s ? T[s].c : "#2a2a4a"; c.fill();
        E.text(c, T[s].n + " $" + T[s].cost, 72 + s * 130, 414, 14, sel === s ? "#111" : "#fff");
      }
      E.rr(c, 10, 444, W - 20, 42, 10); c.fillStyle = phase === "plan" ? "#16a34a" : "#3a3a4a"; c.fill();
      E.text(c, phase === "plan" ? "Open the doors (day " + day + ")" : "Visitors walking...", W / 2, 465, 16, "#fff");
      E.text(c, "Far apart artifacts make visitors walk further. Tap a placed one to sell it.", W / 2, 500, 10, "#8383a3");
    }
  });
})();
