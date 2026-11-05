(function () {
  var E = Eng, W = E.W, H = E.H, PX = 90, GY = H - 24;
  var y, vy, sp, dist, vents, birds, hold, lastV, bT, rot;

  function addVent() { lastV += E.rnd(300, 440); vents.push({ x: lastV, w: 100 }); }

  E.game({
    reset: function () {
      y = 100; vy = 0; sp = 170; dist = 0; vents = []; birds = []; hold = false; lastV = 150; bT = 4; rot = 0;
      while (lastV < dist + W + 300) addVent();
      E.score(0);
    },
    update: function (dt) {
      sp += ((hold ? 250 : 170) - sp) * Math.min(1, dt * 2);
      dist += sp * dt;
      var inV = false, i;
      for (i = 0; i < vents.length; i++) {
        var sx = vents[i].x - dist + PX;
        if (Math.abs(sx) < vents[i].w / 2 && y > GY - 160) inV = true;
      }
      vy += (hold ? 420 : 60) * dt;
      if (inV) vy -= 560 * dt;
      vy = E.clamp(vy, -260, hold ? 380 : 70);
      y += vy * dt; rot += (Math.atan2(vy, sp) - rot) * Math.min(1, dt * 8);
      if (y < 12) { y = 12; vy = 0; }
      if (y > GY - 6) { E.snd("hurt"); E.over(Math.floor(dist / 10)); return; }
      while (vents[0] && vents[0].x - dist + PX < -120) vents.shift();
      while (lastV < dist + W + 300) addVent();
      bT -= dt;
      if (bT <= 0 && dist > 400) { bT = E.rnd(2, 4); birds.push({ x: dist + W + 40, y: E.rnd(30, GY - 100) }); }
      for (i = 0; i < birds.length; i++) {
        birds[i].x -= 40 * dt;
        var bx = birds[i].x - dist + PX;
        if (bx < -40) { birds.splice(i--, 1); continue; }
        if (Math.abs(bx - PX) < 18 && Math.abs(birds[i].y - y) < 12) { E.snd("hurt"); E.over(Math.floor(dist / 10)); return; }
      }
      E.score(Math.floor(dist / 10));
    },
    down: function () { hold = true; },
    up: function () { hold = false; },
    key: function (k, down) { if (k === " " || k === "arrowdown" || k === "s") hold = down; },
    draw: function (c) {
      c.fillStyle = "#0b1a33"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#14142a"; c.fillRect(0, GY, W, H - GY);
      if (y == null) return;
      vents.forEach(function (v) {
        var sx = v.x - dist + PX, g = c.createLinearGradient(0, GY - 160, 0, GY);
        g.addColorStop(0, "rgba(251,146,60,0)"); g.addColorStop(1, "rgba(251,146,60,.4)");
        c.fillStyle = g; c.fillRect(sx - v.w / 2, GY - 160, v.w, 160);
        c.fillStyle = "#475569"; c.fillRect(sx - 20, GY - 4, 40, 6);
      });
      birds.forEach(function (b) { var bx = b.x - dist + PX; c.fillStyle = "#f87171"; c.beginPath(); c.arc(bx, b.y, 7, 0, Math.PI * 2); c.fill(); c.fillRect(bx - 12, b.y - 2, 24, 3); });
      c.save(); c.translate(PX, y); c.rotate(rot);
      c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(16, 0); c.lineTo(-14, -9); c.lineTo(-8, 0); c.lineTo(-14, 9); c.closePath(); c.fill();
      c.fillStyle = "#cbd5e1"; c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, 0); c.lineTo(-14, 9); c.closePath(); c.fill();
      c.restore();
      E.text(c, Math.floor(dist / 10) + " m", W - 44, 16, 15, "#99f6e4");
    }
  });
})();
