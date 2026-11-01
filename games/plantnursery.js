(function () {
  var E = Eng, W = E.W, H = E.H, CW = 120, CH = 165;
  var P, lives, score, t, setL, flash;
  setL = E.stat("Lives", "3");

  function seed(p) { p.hyd = 55; p.gro = 0; p.dead = 0; p.rate = E.rnd(0.8, 1.3); p.ph = E.rnd(0, 6); p.c = E.PAL[E.ri(1, 6)]; }
  function pos(i) { return [12 + (i % 3) * 129, 70 + Math.floor(i / 3) * 180]; }
  function die(p) {
    p.dead = 1.4; lives--; setL(lives); E.snd("hurt");
    if (lives <= 0) E.over(score);
  }

  E.game({
    reset: function () {
      P = []; for (var i = 0; i < 6; i++) { var p = {}; seed(p); P.push(p); }
      lives = 3; score = 0; t = 0; flash = 0; setL(3); E.score(0);
    },
    update: function (dt) {
      t += dt; if (flash > 0) flash -= dt;
      var dry = 7 + Math.min(10, t * 0.08);
      P.forEach(function (p) {
        p.ph += dt * 2;
        if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) seed(p); return; }
        p.hyd -= dry * p.rate * dt;
        if (p.hyd >= 25 && p.hyd <= 90 && p.gro < 100) p.gro = Math.min(100, p.gro + 15 * dt);
        if (p.hyd <= 0 && lives > 0) die(p);
      });
    },
    down: function (x, y) {
      for (var i = 0; i < 6; i++) {
        var q = pos(i);
        if (x < q[0] || x > q[0] + CW || y < q[1] || y > q[1] + CH) continue;
        var p = P[i];
        if (p.dead > 0) return;
        if (p.gro >= 100) { score += p.hyd > 30 && p.hyd < 85 ? 15 : 8; E.score(score); E.snd("good"); seed(p); }
        else { p.hyd += 32; E.snd("tap"); if (p.hyd > 100) { p.hyd = 100; die(p); } }
        return;
      }
    },
    draw: function (c) {
      c.fillStyle = "#101a16"; c.fillRect(0, 0, W, H);
      E.text(c, "Tap to water. Tap a glowing plant to harvest.", W / 2, 24, 14, "#c4b5fd");
      E.text(c, "Harvested " + score, W / 2, 48, 18, "#fff");
      if (!P) return;
      P.forEach(function (p, i) {
        var q = pos(i), x = q[0], y = q[1], mid = x + CW / 2;
        E.rr(c, x, y, CW, CH, 14); c.fillStyle = "#1a2a22"; c.fill();
        if (p.dead > 0) { E.text(c, "Wilted", mid, y + 70, 16, "#fca5a5"); return; }
        c.fillStyle = "#7c4a2d"; c.fillRect(mid - 28, y + 100, 56, 22);
        var sway = Math.sin(p.ph) * 5, h = 20 + p.gro * 0.5;
        c.strokeStyle = "#4ade80"; c.lineWidth = 5; c.beginPath(); c.moveTo(mid, y + 100); c.lineTo(mid + sway, y + 100 - h); c.stroke();
        var bx = mid + sway, by = y + 100 - h, r = 10 + p.gro * 0.14;
        if (p.gro >= 100) { c.shadowColor = "#facc15"; c.shadowBlur = 16; }
        c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fillStyle = p.c; c.fill(); c.shadowBlur = 0;
        c.fillStyle = "#fff"; c.fillRect(bx - r * 0.5, by - 3, 5, 5); c.fillRect(bx + r * 0.2, by - 3, 5, 5);
        c.fillStyle = "#171726"; c.fillRect(x + 10, y + 132, CW - 20, 9);
        c.fillStyle = p.hyd > 90 ? "#fb923c" : p.hyd < 25 ? "#ef4444" : "#38bdf8"; c.fillRect(x + 10, y + 132, (CW - 20) * E.clamp(p.hyd, 0, 100) / 100, 9);
        c.fillStyle = "#171726"; c.fillRect(x + 10, y + 146, CW - 20, 9);
        c.fillStyle = "#22c55e"; c.fillRect(x + 10, y + 146, (CW - 20) * p.gro / 100, 9);
      });
      E.text(c, "Blue: water (keep it between 25 and 90).  Green: growth", W / 2, H - 14, 12, "#8383a3");
    }
  });
})();
