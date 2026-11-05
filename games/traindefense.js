(function () {
  var E = Eng, W = E.W, H = E.H, PX = W / 2, RY = [90, 160, 230];
  var row, py, en, lives, score, spT, hitT, t, flash, off, setL;
  setL = E.stat("Lives", "3");

  function go(r) { r = E.clamp(r, 0, 2); if (r !== row) { row = r; E.snd("swoosh"); } }

  E.game({
    reset: function () { row = 1; py = RY[1]; en = []; lives = 3; score = 0; spT = 1; hitT = 0; t = 0; flash = 0; off = 0; setL(3); E.score(0); },
    update: function (dt) {
      t += dt; off += dt * 260; hitT -= dt; flash -= dt;
      py += (RY[row] - py) * Math.min(1, dt * 14);
      spT -= dt;
      if (spT <= 0) {
        spT = Math.max(0.5, 1.5 - t * 0.015);
        var d = Math.random() < 0.5 ? 1 : -1;
        en.push({ row: E.ri(0, 2), x: d > 0 ? -12 : W + 12, d: d, hp: 1 });
      }
      var sp = Math.min(125, 55 + t * 0.8), i;
      for (i = 0; i < en.length; i++) {
        var e = en[i]; e.x += e.d * sp * dt;
        if (Math.abs(e.x - PX) < 16 && e.row === row) { en.splice(i--, 1); lives--; setL(lives); E.snd("hurt"); if (lives <= 0) { E.over(score); return; } }
        else if (Math.abs(e.x - PX) < 16 && e.row !== row) { /* passes by on another carriage */ }
      }
      if (hitT <= 0) {
        var best = null;
        en.forEach(function (e) { if (e.row === row && Math.abs(e.x - PX) < 60 && (!best || Math.abs(e.x - PX) < Math.abs(best.x - PX))) best = e; });
        if (best) { en.splice(en.indexOf(best), 1); score++; E.score(score); hitT = 0.32; flash = 0.12; E.snd("boom"); }
      }
    },
    down: function (x, y) { go(Math.floor((y - 60) / 70)); },
    key: function (k, down) { if (!down) return; if (k === "arrowup" || k === "w") go(row - 1); else if (k === "arrowdown" || k === "s") go(row + 1); },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(167,139,250,.3)";
      for (var s = 0; s < 14; s++) c.fillRect(((s * 97 - off * (0.3 + (s % 3) * 0.2)) % W + W) % W, (s * 53) % 50 + 4, 24, 2);
      for (var r = 0; r < 3; r++) {
        c.fillStyle = "#2a2a4a"; E.rr(c, 14, RY[r] - 30, W - 28, 60, 8); c.fill();
        c.strokeStyle = "#475569"; c.lineWidth = 2; c.stroke();
        c.fillStyle = "rgba(250,204,21,.3)";
        for (var w = 40; w < W - 40; w += 60) c.fillRect(w, RY[r] - 22, 22, 10);
      }
      if (py == null) return;
      en.forEach(function (e) {
        var y = RY[e.row];
        c.fillStyle = "#dc2626"; E.rr(c, e.x - 9, y - 14, 18, 28, 5); c.fill();
        c.fillStyle = "#fecaca"; c.fillRect(e.x - 5, y - 8, 10, 5);
      });
      c.fillStyle = "#3b82f6"; E.rr(c, PX - 10, py - 15, 20, 30, 6); c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      if (flash > 0) { c.strokeStyle = "#facc15"; c.lineWidth = 4; c.beginPath(); c.arc(PX, py, 36, 0, Math.PI * 2); c.stroke(); }
      E.text(c, "Boarders stopped " + score, W / 2, 20, 15, "#99f6e4");
      E.text(c, "Tap a carriage, or press up and down, to jump", W / 2, H - 12, 12, "#8383a3");
    }
  });
})();
