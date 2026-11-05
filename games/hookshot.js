(function () {
  var E = Eng, W = E.W, H = E.H;
  var px, py, vx, vy, att, L, pegs, cam, score, best;

  function addPeg() {
    var l = pegs[pegs.length - 1];
    pegs.push({ x: l.x + E.rnd(110, 170), y: E.rnd(40, 100) });
  }
  function grab() {
    if (att) return;
    var b = null, bd = 1e9;
    pegs.forEach(function (p) {
      var d = Math.hypot(p.x - px, p.y - py);
      if (p.x > px - 30 && p.y < py - 10 && d < 240 && d < bd) { b = p; bd = d; }
    });
    if (b) { att = b; L = Math.max(45, bd); E.snd("tap"); }
  }
  function drop() { if (att) { att = null; E.snd("swoosh"); } }

  E.game({
    reset: function () {
      pegs = [{ x: 140, y: 60 }];
      for (var i = 0; i < 6; i++) addPeg();
      px = 60; py = 120; vx = 120; vy = 0; att = pegs[0]; L = Math.hypot(px - att.x, py - att.y);
      cam = 0; score = 0; best = px; E.score(0);
    },
    update: function (dt) {
      vy += 700 * dt; px += vx * dt; py += vy * dt;
      if (att) {
        L = Math.max(45, L - 18 * dt);
        var dx = px - att.x, dy = py - att.y, d = Math.hypot(dx, dy) || 1;
        if (d > L) {
          var nx = dx / d, ny = dy / d;
          px = att.x + nx * L; py = att.y + ny * L;
          var vr = vx * nx + vy * ny;
          if (vr > 0) { vx -= vr * nx; vy -= vr * ny; }
        }
      }
      cam += (px - 130 - cam) * Math.min(1, dt * 6);
      if (px > best) { best = px; score = Math.floor((best - 60) / 10); E.score(score); }
      while (pegs[pegs.length - 1].x < cam + W + 200) addPeg();
      pegs = pegs.filter(function (p) { return p.x > cam - 120 || p === att; });
      if (py > H + 20 || px < cam - 20) { E.snd("hurt"); E.over(score); }
    },
    down: function () { grab(); },
    up: function () { drop(); },
    key: function (k, down) { if (k === " " || k === "arrowup" || k === "w") { if (down) grab(); else drop(); } },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      var g = c.createLinearGradient(0, H - 50, 0, H);
      g.addColorStop(0, "rgba(239,68,68,0)"); g.addColorStop(1, "rgba(239,68,68,.55)");
      c.fillStyle = g; c.fillRect(0, H - 50, W, 50);
      if (!pegs) return;
      pegs.forEach(function (p) {
        c.beginPath(); c.arc(p.x - cam, p.y, 8, 0, Math.PI * 2);
        c.fillStyle = p === att ? "#22c55e" : "#14e0cc"; c.fill();
        c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2; c.stroke();
      });
      if (att) {
        c.strokeStyle = "#e2e8f0"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(att.x - cam, att.y); c.lineTo(px - cam, py); c.stroke();
      }
      c.beginPath(); c.arc(px - cam, py, 10, 0, Math.PI * 2);
      c.fillStyle = "#3b82f6"; c.fill(); c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      E.text(c, score + " m", W - 40, 18, 16, "#99f6e4");
    }
  });
})();
