(function () {
  var E = Eng, W = E.W, H = E.H;
  var NAMES = ["Food", "Wood", "Stone"], COL = ["#22c55e", "#a16207", "#94a3b8"];
  var a, N, res, day, tm, msg, setDay;
  setDay = E.stat("Day", "1");

  function winter() { var d = day % 30; return d >= 20; }
  function idle() { return N - a[0] - a[1] - a[2]; }
  function tick() {
    day++; setDay(day);
    res[0] += a[0] * 1.3 - N * 0.9;
    res[1] += a[1] * 1.2 - (winter() ? N * 0.6 : N * 0.1);
    res[2] += a[2] * 1.0;
    if (res[2] >= 15 && N < 24) { res[2] -= 15; N++; msg = "A new worker joined the town"; E.snd("good"); }
    E.score(day);
    if (res[0] < 0 || res[1] < 0) { msg = res[0] < 0 ? "Starved" : "Froze"; E.snd("hurt"); E.over(day); }
  }

  E.game({
    reset: function () { a = [4, 3, 2]; N = 9; res = [30, 30, 0]; day = 1; tm = 0; msg = "Balance your workers"; setDay(1); E.score(1); },
    update: function (dt) { tm += dt; if (tm >= 0.8) { tm -= 0.8; tick(); } },
    down: function (x, y) {
      for (var i = 0; i < 3; i++) {
        var ry = 150 + i * 80;
        if (y < ry || y > ry + 60) continue;
        if (x >= 230 && x <= 280 && a[i] > 0) { a[i]--; E.snd("tap"); }
        else if (x >= 300 && x <= 350 && idle() > 0) { a[i]++; E.snd("tap"); }
      }
    },
    draw: function (c) {
      c.fillStyle = winter() ? "#0f1c2e" : "#12161f"; c.fillRect(0, 0, W, H);
      if (!res) return;
      E.text(c, winter() ? "WINTER: wood burns fast" : "Summer: stock up for winter", W / 2, 24, 18, winter() ? "#93c5fd" : "#fde68a");
      E.text(c, "Day " + day + "   Workers " + N + "   Idle " + idle(), W / 2, 54, 15, "#c4b5fd");
      E.text(c, msg, W / 2, 84, 13, "#8383a3");
      for (var i = 0; i < 3; i++) {
        var y = 150 + i * 80;
        E.rr(c, 14, y, W - 28, 60, 12); c.fillStyle = "#1c1c2c"; c.fill();
        c.fillStyle = COL[i]; c.fillRect(14, y, 8, 60);
        E.text(c, NAMES[i], 70, y + 18, 15, "#fff");
        E.text(c, Math.floor(res[i]) + (i < 2 && res[i] < 12 ? " low" : ""), 70, y + 42, 15, res[i] < 12 && i < 2 ? "#fca5a5" : "#c4b5fd");
        E.rr(c, 230, y + 10, 50, 40, 8); c.fillStyle = "#3b3b5c"; c.fill();
        E.text(c, "-", 255, y + 29, 24, "#fff");
        E.text(c, String(a[i]), 290 + 0, y + 29, 0.1, "#fff");
        E.rr(c, 300, y + 10, 50, 40, 8); c.fillStyle = "#4c1d95"; c.fill();
        E.text(c, "+", 325, y + 29, 24, "#fff");
        E.text(c, String(a[i]), 190, y + 30, 22, COL[i]);
      }
      E.text(c, "15 stone brings a new worker", W / 2, 420, 13, "#8383a3");
    }
  });
})();
