(function () {
  var E = Eng, W = E.W, H = E.H, CS = 120, X0 = 20, Y0 = 80;
  var targets, score, left, spawnT, setTime, flash;
  setTime = E.stat("Time", "30");

  function cellAt(x, y) {
    var c = Math.floor((x - X0) / CS), r = Math.floor((y - Y0) / CS);
    return c < 0 || r < 0 || c > 2 || r > 2 ? -1 : r * 3 + c;
  }
  function spawn() {
    if (targets.length >= 4) return;
    var free = [];
    for (var i = 0; i < 9; i++) if (!targets.some(function (t) { return t.cell === i; })) free.push(i);
    if (!free.length) return;
    var life = E.rnd(0.7, 1.2);
    targets.push({ cell: free[E.ri(0, free.length - 1)], trap: Math.random() < 0.25, life: life, max: life });
  }

  E.game({
    reset: function () { targets = []; score = 0; left = 30; spawnT = 0.3; setTime(30); E.score(0); flash = []; },
    update: function (dt) {
      left -= dt;
      setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(Math.max(0, score)); return; }
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(0.25, 0.5 - (30 - left) * 0.008); }
      for (var i = 0; i < targets.length; i++) {
        targets[i].life -= dt;
        if (targets[i].life <= 0) targets.splice(i--, 1);
      }
      for (var j = 0; j < flash.length; j++) { flash[j].t -= dt; if (flash[j].t <= 0) flash.splice(j--, 1); }
    },
    down: function (x, y) {
      var cell = cellAt(x, y);
      if (cell < 0) return;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].cell === cell) {
          var t = targets.splice(i, 1)[0];
          if (t.trap) { score -= 3; E.snd("bad"); flash.push({ cell: cell, t: 0.25, c: "#ef4444" }); }
          else { score += 1; E.snd("tap"); flash.push({ cell: cell, t: 0.2, c: "#22c55e" }); }
          E.score(score);
          return;
        }
      }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#171726";
      c.fillRect(20, 20, W - 40, 12);
      c.fillStyle = "#8b5cf6";
      c.fillRect(20, 20, (W - 40) * E.clamp(left / 30, 0, 1), 12);
      E.text(c, "Net score " + score, W / 2, 55, 18, "#c4b5fd");
      for (var i = 0; i < 9; i++) {
        var x = X0 + (i % 3) * CS + 5, y = Y0 + Math.floor(i / 3) * CS + 5;
        E.rr(c, x, y, CS - 10, CS - 10, 16);
        c.fillStyle = "#171726";
        c.fill();
      }
      (flash || []).forEach(function (f) {
        var x = X0 + (f.cell % 3) * CS + 5, y = Y0 + Math.floor(f.cell / 3) * CS + 5;
        E.rr(c, x, y, CS - 10, CS - 10, 16);
        c.fillStyle = f.c + "66";
        c.fill();
      });
      (targets || []).forEach(function (t) {
        var cx = X0 + (t.cell % 3) * CS + CS / 2, cy = Y0 + Math.floor(t.cell / 3) * CS + CS / 2;
        var k = Math.min(1, (t.max - t.life) / 0.12 + 0.3);
        c.beginPath();
        c.arc(cx, cy, 38 * k, 0, Math.PI * 2);
        c.fillStyle = t.trap ? "#dc2626" : "#16a34a";
        c.fill();
        c.strokeStyle = "rgba(255,255,255,.6)";
        c.lineWidth = 3;
        c.stroke();
        E.text(c, t.trap ? "!" : "+", cx, cy, 40 * k, "#fff");
      });
    }
  });
})();
