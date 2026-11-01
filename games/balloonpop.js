(function () {
  var E = Eng, W = E.W, H = E.H, TOP = 30;
  var bl, spawnT, score, lives, t, setLives, pops;
  setLives = E.stat("Lives", "3");

  E.game({
    reset: function () { bl = []; pops = []; spawnT = 0.3; score = 0; lives = 3; t = 0; setLives(3); E.score(0); },
    update: function (dt) {
      t += dt;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.28, 0.85 - t * 0.01);
        var r = E.rnd(20, 30);
        bl.push({ x: E.rnd(r, W - r), y: H + r, r: r, vy: E.rnd(60, 90) + Math.min(120, t * 2), c: E.PAL[E.ri(0, 7)], ph: E.rnd(0, 6) });
      }
      for (var i = 0; i < bl.length; i++) {
        var b = bl[i];
        b.y -= b.vy * dt; b.ph += dt * 2;
        if (b.y - b.r <= TOP) {
          bl.splice(i--, 1); lives--; setLives(lives); E.snd("hurt");
          if (lives <= 0) { E.over(score); return; }
        }
      }
      for (var j = 0; j < pops.length; j++) { pops[j].t -= dt; if (pops[j].t <= 0) pops.splice(j--, 1); }
    },
    down: function (x, y) {
      for (var i = bl.length - 1; i >= 0; i--) {
        var b = bl[i], dx = b.x + Math.sin(b.ph) * 6 - x, dy = b.y - y;
        if (dx * dx + dy * dy < (b.r + 8) * (b.r + 8)) {
          bl.splice(i, 1); score++; E.score(score); E.snd("good");
          pops.push({ x: b.x, y: b.y, r: b.r, c: b.c, t: 0.25 });
          return;
        }
      }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      (bl || []).forEach(function (b) {
        var x = b.x + Math.sin(b.ph) * 6;
        c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, b.y + b.r); c.lineTo(x, b.y + b.r + 22); c.stroke();
        c.beginPath(); c.ellipse(x, b.y, b.r * 0.85, b.r, 0, 0, Math.PI * 2); c.fillStyle = b.c; c.fill();
        c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.15, b.r * 0.25, 0, 0, Math.PI * 2); c.fill();
      });
      (pops || []).forEach(function (p) {
        c.strokeStyle = p.c; c.lineWidth = 3; c.globalAlpha = p.t * 4;
        c.beginPath(); c.arc(p.x, p.y, p.r + (0.25 - p.t) * 120, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
      });
      c.fillStyle = "#3b1d1d"; c.fillRect(0, 0, W, TOP);
      c.fillStyle = "#ef4444";
      for (var x = 0; x < W; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 10, TOP); c.lineTo(x + 20, 0); c.fill(); }
      E.text(c, String(score), W / 2, 70, 40, "rgba(255,255,255,.7)");
    }
  });
})();
