(function () {
  var E = Eng, W = E.W, H = E.H, HX = W / 2, HY = H / 2;
  var ax, ay, tx, ty, keys, carry, sugar, bugs, score, left, stun, spT, setTime;
  setTime = E.stat("Time", "60");

  function addSugar() {
    for (var i = 0; i < 30; i++) {
      var x = E.rnd(20, W - 20), y = E.rnd(30, H - 20);
      if (Math.hypot(x - HX, y - HY) > 70) { sugar.push({ x: x, y: y }); return; }
    }
  }
  function addBug() {
    var a = E.rnd(0, 6.28);
    bugs.push({ x: Math.random() < 0.5 ? 10 : W - 10, y: E.rnd(30, H - 10), vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, t: E.rnd(1, 3) });
  }

  E.game({
    reset: function () {
      ax = HX + 40; ay = HY; tx = ax; ty = ay; keys = {}; carry = false; sugar = []; bugs = []; score = 0; left = 60; stun = 0; spT = 20;
      for (var i = 0; i < 3; i++) addSugar();
      addBug(); addBug();
      setTime(60); E.score(0);
    },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(score); return; }
      spT -= dt; if (spT <= 0) { spT = 20; addBug(); }
      stun -= dt;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = ax; ty = ay; }
      else { var dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy); if (d > 4) { vx = dx / d; vy = dy / d; } }
      if (stun <= 0) {
        var sp = carry ? 100 : 145;
        ax = E.clamp(ax + vx * sp * dt, 8, W - 8); ay = E.clamp(ay + vy * sp * dt, 8, H - 8);
      }
      var i;
      if (!carry) for (i = 0; i < sugar.length; i++) {
        if (Math.hypot(sugar[i].x - ax, sugar[i].y - ay) < 14) { sugar.splice(i, 1); carry = true; E.snd("tap"); break; }
      }
      if (carry && Math.hypot(HX - ax, HY - ay) < 28) { carry = false; score++; E.score(score); E.snd("good"); addSugar(); }
      while (sugar.length < 3) addSugar();
      bugs.forEach(function (b) {
        b.t -= dt;
        if (b.t <= 0) { b.t = E.rnd(1, 3); var a = Math.atan2(ay - b.y, ax - b.x) + E.rnd(-1.2, 1.2); b.vx = Math.cos(a) * 62; b.vy = Math.sin(a) * 62; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 8 || b.x > W - 8) b.vx = -b.vx;
        if (b.y < 8 || b.y > H - 8) b.vy = -b.vy;
        if (stun <= 0 && Math.hypot(b.x - ax, b.y - ay) < 16 && Math.hypot(HX - ax, HY - ay) > 32) {
          stun = 0.7; E.snd("hurt");
          if (carry) { carry = false; sugar.push({ x: ax + E.rnd(-18, 18), y: ay + E.rnd(-18, 18) }); }
        }
      });
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#2b2418"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#332b1c";
      for (var g = 0; g < 14; g++) c.fillRect((g * 71) % W, (g * 113) % H, 18, 10);
      c.beginPath(); c.arc(HX, HY, 28, 0, Math.PI * 2); c.fillStyle = "#6b4a2b"; c.fill();
      c.beginPath(); c.arc(HX, HY, 12, 0, Math.PI * 2); c.fillStyle = "#1a1208"; c.fill();
      if (!sugar) return;
      sugar.forEach(function (s) { c.fillStyle = "#f8fafc"; c.fillRect(s.x - 6, s.y - 6, 12, 12); c.strokeStyle = "#cbd5e1"; c.lineWidth = 2; c.strokeRect(s.x - 6, s.y - 6, 12, 12); });
      bugs.forEach(function (b) { c.fillStyle = "#7f1d1d"; c.beginPath(); c.ellipse(b.x, b.y, 12, 8, Math.atan2(b.vy, b.vx), 0, Math.PI * 2); c.fill(); c.strokeStyle = "#fca5a5"; c.lineWidth = 2; c.stroke(); });
      c.globalAlpha = stun > 0 && Math.floor(stun * 12) % 2 ? 0.4 : 1;
      c.fillStyle = "#111"; c.beginPath(); c.arc(ax, ay, 7, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(ax - 7, ay, 5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#111"; c.lineWidth = 2; c.beginPath(); c.moveTo(ax + 4, ay - 5); c.lineTo(ax + 10, ay - 10); c.moveTo(ax + 4, ay + 5); c.lineTo(ax + 10, ay + 10); c.stroke();
      c.globalAlpha = 1;
      if (carry) { c.fillStyle = "#f8fafc"; c.fillRect(ax - 4, ay - 16, 9, 9); }
      E.text(c, "Sugar home " + score, W / 2, 16, 15, "#fde68a");
    }
  });
})();
