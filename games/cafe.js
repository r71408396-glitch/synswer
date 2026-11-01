(function () {
  var E = Eng, W = E.W, H = E.H;
  var ING = [["Coffee", "#92400e"], ["Milk", "#e5e7eb"], ["Sugar", "#f9a8d4"], ["Ice", "#67e8f9"]];
  var cust, cup, lives, score, t, setL;
  setL = E.stat("Lives", "3");

  function make(i) {
    var n = E.ri(1, Math.min(4, 1 + Math.floor(score / 6) + 1)), o = [];
    for (var k = 0; k < n; k++) o.push(E.ri(0, 3));
    o.sort();
    var mx = Math.max(9, 18 - score * 0.2);
    cust[i] = { order: o, pat: mx, max: mx };
  }
  function lose() { lives--; setL(lives); E.snd("hurt"); if (lives <= 0) E.over(score); }

  E.game({
    reset: function () {
      cust = [null, null, null]; cup = []; lives = 3; score = 0; t = 0; setL(3); E.score(0);
      make(0);
    },
    update: function (dt) {
      t += dt;
      for (var i = 0; i < 3; i++) {
        var c = cust[i];
        if (c) { c.pat -= dt; if (c.pat <= 0) { cust[i] = null; c = null; lose(); if (lives <= 0) return; } }
        if (!c && Math.random() < dt * 0.5) make(i);
      }
    },
    down: function (x, y) {
      var i;
      if (y < 190) {
        i = Math.floor((x - 10) / 130);
        if (i < 0 || i > 2 || !cust[i]) return;
        var a = cup.slice().sort().join(), b = cust[i].order.join();
        if (a === b) { score += 10 + Math.ceil(cust[i].pat); E.score(score); cust[i] = null; cup = []; E.snd("good"); }
        else { cust[i].pat -= 4; cup = []; E.snd("bad"); }
        return;
      }
      if (y >= 340 && y <= 400) {
        i = Math.floor((x - 10) / 97);
        if (i >= 0 && i < 4 && cup.length < 4) { cup.push(i); E.snd("tap"); }
        return;
      }
      if (y >= 420 && x < 140) { cup = []; E.snd("flip"); }
    },
    draw: function (c) {
      c.fillStyle = "#1a1220"; c.fillRect(0, 0, W, H);
      if (!cust) return;
      for (var i = 0; i < 3; i++) {
        var x = 10 + i * 130, cu = cust[i];
        E.rr(c, x, 20, 120, 160, 12); c.fillStyle = "#241a30"; c.fill();
        if (!cu) { E.text(c, "...", x + 60, 100, 22, "#4c3f66"); continue; }
        c.beginPath(); c.arc(x + 60, 56, 22, 0, Math.PI * 2); c.fillStyle = ["#fbbf24", "#f9a8d4", "#a7f3d0"][i]; c.fill();
        c.fillStyle = "#111"; c.fillRect(x + 50, 52, 4, 4); c.fillRect(x + 66, 52, 4, 4);
        E.rr(c, x + 8, 88, 104, 44, 10); c.fillStyle = "#fff"; c.fill();
        cu.order.forEach(function (o, k) { c.fillStyle = ING[o][1]; c.fillRect(x + 16 + k * 24, 98, 20, 24); });
        c.fillStyle = "#3a2d4d"; c.fillRect(x + 10, 150, 100, 10);
        var f = cu.pat / cu.max;
        c.fillStyle = f < 0.3 ? "#ef4444" : f < 0.6 ? "#f59e0b" : "#22c55e"; c.fillRect(x + 10, 150, 100 * Math.max(0, f), 10);
      }
      E.text(c, "Tap the right customer to serve", W / 2, 202, 13, "#8383a3");
      E.text(c, "Score " + score, W / 2, 230, 18, "#fde68a");
      for (var s = 0; s < 4; s++) {
        E.rr(c, 100 + s * 52, 250, 46, 64, 8); c.fillStyle = "#2a2038"; c.fill();
        if (cup[s] != null) { c.fillStyle = ING[cup[s]][1]; c.fillRect(104 + s * 52, 256, 38, 52); }
      }
      for (var b = 0; b < 4; b++) {
        E.rr(c, 10 + b * 97, 340, 90, 60, 10); c.fillStyle = ING[b][1]; c.fill();
        E.text(c, ING[b][0], 55 + b * 97, 370, 15, b === 1 ? "#111" : "#fff");
      }
      E.rr(c, 10, 420, 130, 46, 10); c.fillStyle = "#4c1d95"; c.fill();
      E.text(c, "Clear cup", 75, 443, 15, "#fff");
    }
  });
})();
