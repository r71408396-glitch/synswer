(function () {
  var E = Eng, W = E.W, H = E.H, PX = 110;
  var y, vy, heat, locked, wx, sp, thrust, ph, setHeat;

  function center(x) { return H / 2 + Math.sin((x + wx) * 0.011 + ph) * 62 + Math.sin((x + wx) * 0.027) * 28; }
  function half() { return Math.max(60, 98 - wx * 0.012); }

  E.game({
    reset: function () { y = H / 2; vy = 0; heat = 0; locked = false; wx = 0; sp = 180; thrust = false; ph = E.rnd(0, 6); E.score(0); },
    update: function (dt) {
      sp = Math.min(330, sp + dt * 4); wx += sp * dt;
      E.score(Math.floor(wx / 10));
      var on = thrust && !locked;
      vy += (on ? -1500 : 900) * dt;
      vy = E.clamp(vy, -300, 320);
      y += vy * dt;
      heat += (on ? 38 : -30) * dt;
      heat = E.clamp(heat, 0, 100);
      if (heat >= 100) locked = true;
      if (locked && heat <= 40) locked = false;
      var c = center(PX), h = half();
      if (y - 10 < c - h || y + 10 > c + h) { E.snd("hurt"); E.over(Math.floor(wx / 10)); }
    },
    down: function () { thrust = true; },
    up: function () { thrust = false; },
    key: function (k, down) { if (k === " " || k === "arrowup" || k === "w") thrust = down; },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      if (y == null) return;
      var h = half();
      c.fillStyle = "#3b2a6b";
      for (var x = 0; x < W; x += 6) {
        var cc = center(x);
        c.fillRect(x, 0, 6, cc - h);
        c.fillRect(x, cc + h, 6, H - cc - h);
      }
      c.fillStyle = "#171726"; c.fillRect(20, 14, 160, 12);
      c.fillStyle = locked ? "#ef4444" : heat > 70 ? "#f97316" : "#22c55e";
      c.fillRect(20, 14, 160 * heat / 100, 12);
      E.text(c, locked ? "OVERHEATED" : "Heat", 100, 38, 12, locked ? "#fecaca" : "#c4b5fd");
      c.fillStyle = locked ? "#7f1d1d" : "#60a5fa";
      E.rr(c, PX - 10, y - 10, 20, 20, 5); c.fill();
      c.fillStyle = "#fff"; c.fillRect(PX + 1, y - 5, 5, 5);
      if (thrust && !locked) { c.fillStyle = "#fb923c"; c.beginPath(); c.moveTo(PX - 6, y + 10); c.lineTo(PX, y + 24 + Math.random() * 6); c.lineTo(PX + 6, y + 10); c.fill(); }
    }
  });
})();
