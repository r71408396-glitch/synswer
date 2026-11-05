(function () {
  var E = Eng, W = E.W, H = E.H;
  var EF = ["Speed up", "Slow", "Reversed controls", "Giant", "Tiny"];
  var px, py, tx, ty, keys, stars, pots, bats, eff, effT, lives, score, inv, spT, msg, msgT, setL;
  setL = E.stat("Lives", "3");

  function star() { stars.push({ x: E.rnd(20, W - 20), y: E.rnd(40, H - 20) }); }
  function rad() { return eff === 3 ? 18 : eff === 4 ? 6 : 11; }

  E.game({
    reset: function () {
      px = W / 2; py = H / 2; tx = px; ty = py; keys = {}; stars = []; pots = []; eff = -1; effT = 0; lives = 3; score = 0; inv = 0; spT = 2; msg = ""; msgT = 0;
      bats = []; for (var i = 0; i < 3; i++) bats.push({ x: E.rnd(20, W - 20), y: E.rnd(40, H - 20), vx: E.rnd(-90, 90) || 60, vy: E.rnd(-90, 90) || 50 });
      for (i = 0; i < 4; i++) star();
      setL(3); E.score(0);
    },
    update: function (dt) {
      inv -= dt; msgT -= dt;
      if (effT > 0) { effT -= dt; if (effT <= 0) eff = -1; }
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = px; ty = py; }
      else { var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy); if (d > 5) { vx = dx / d; vy = dy / d; } }
      if (eff === 2) { vx = -vx; vy = -vy; }
      var spd = eff === 0 ? 260 : eff === 1 ? 80 : 150;
      px = E.clamp(px + vx * spd * dt, 10, W - 10); py = E.clamp(py + vy * spd * dt, 30, H - 10);
      if (eff === 2 && !kx && !ky) { tx = px + vx * 40; ty = py + vy * 40; }
      var r = rad(), i;
      for (i = 0; i < stars.length; i++) if (Math.hypot(stars[i].x - px, stars[i].y - py) < r + 9) { stars.splice(i--, 1); score++; E.score(score); E.snd("good"); star(); }
      spT -= dt;
      if (spT <= 0 && pots.length < 2) { spT = 4; pots.push({ x: E.rnd(30, W - 30), y: E.rnd(50, H - 30), l: 10 }); }
      for (i = 0; i < pots.length; i++) {
        pots[i].l -= dt;
        if (pots[i].l <= 0) { pots.splice(i--, 1); continue; }
        if (Math.hypot(pots[i].x - px, pots[i].y - py) < r + 10) {
          pots.splice(i--, 1); eff = E.ri(0, 4); effT = 6; msg = "Potion: " + EF[eff]; msgT = 2; E.snd("flip");
          if (eff === 2) { tx = px; ty = py; }
        }
      }
      bats.forEach(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 10 || b.x > W - 10) b.vx = -b.vx;
        if (b.y < 40 || b.y > H - 10) b.vy = -b.vy;
        if (inv <= 0 && Math.hypot(b.x - px, b.y - py) < r + 9) { lives--; inv = 1.3; setL(lives); E.snd("hurt"); }
      });
      if (lives <= 0) E.over(score);
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#120d1f"; c.fillRect(0, 0, W, H);
      if (px == null) return;
      stars.forEach(function (s) { c.fillStyle = "#facc15"; c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4 : 9; c.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); } c.closePath(); c.fill(); });
      pots.forEach(function (p) {
        c.fillStyle = "#a855f7"; c.beginPath(); c.arc(p.x, p.y + 3, 9, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#e9d5ff"; c.fillRect(p.x - 3, p.y - 12, 6, 8);
        E.text(c, "?", p.x, p.y + 3, 12, "#fff");
      });
      bats.forEach(function (b) { c.fillStyle = "#1e1b4b"; c.beginPath(); c.arc(b.x, b.y, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = "#ef4444"; c.fillRect(b.x - 5, b.y - 2, 3, 3); c.fillRect(b.x + 2, b.y - 2, 3, 3); c.strokeStyle = "#4c1d95"; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x - 9, b.y); c.lineTo(b.x - 18, b.y - 6); c.moveTo(b.x + 9, b.y); c.lineTo(b.x + 18, b.y - 6); c.stroke(); });
      c.globalAlpha = inv > 0 && Math.floor(inv * 10) % 2 ? 0.4 : 1;
      var r = rad();
      c.fillStyle = "#0fc4b2"; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#312e81"; c.beginPath(); c.moveTo(px - r, py - r * 0.4); c.lineTo(px, py - r * 2); c.lineTo(px + r, py - r * 0.4); c.closePath(); c.fill();
      c.globalAlpha = 1;
      E.text(c, "Stars " + score, 60, 16, 15, "#fde68a");
      E.text(c, msgT > 0 ? msg : (eff >= 0 ? EF[eff] + " " + Math.ceil(effT) : "Grab a potion for a surprise"), W / 2 + 40, 16, 13, "#e9d5ff");
    }
  });
})();
