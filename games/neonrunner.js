(function () {
  var E = Eng, W = E.W, H = E.H, GY = H - 50, PX = 70, S = 26;
  var y, vy, sp, obs, dist;

  function jump() { if (y >= GY - S - 0.5) { vy = -640; E.snd("flip"); } }

  E.game({
    reset: function () { y = GY - S; vy = 0; sp = 230; obs = []; dist = 0; E.score(0); },
    update: function (dt) {
      sp = Math.min(520, sp + dt * 6);
      dist += sp * dt / 30;
      E.score(Math.floor(dist));
      vy += 1900 * dt; y += vy * dt;
      if (y > GY - S) { y = GY - S; vy = 0; }
      var last = obs[obs.length - 1];
      if (!last || last.x < W - E.ri(230, 380)) obs.push({ x: W + 30, w: E.ri(28, 54), h: 0, max: E.ri(34, 54) });
      for (var i = 0; i < obs.length; i++) {
        var o = obs[i];
        o.x -= sp * dt;
        if (o.x < PX + 320 && o.h < o.max) o.h = Math.min(o.max, o.h + dt * 380);
        if (o.x + o.w < -10) { obs.splice(i--, 1); continue; }
        if (PX + S - 6 > o.x + 8 && PX + 6 < o.x + o.w - 8 && y + S - 4 > GY - o.h * 0.85) { E.snd("hurt"); E.over(Math.floor(dist)); return; }
      }
    },
    down: function () { jump(); },
    key: function (k, down) { if (down && (k === " " || k === "arrowup" || k === "w")) jump(); },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "rgba(139,92,246,.18)"; c.lineWidth = 1;
      for (var g = 0; g < 12; g++) { var gx = ((g * 60 - (dist || 0) * 20) % (W + 60) + W + 60) % (W + 60); c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, GY); c.stroke(); }
      c.fillStyle = "#8b5cf6"; c.fillRect(0, GY, W, 3);
      c.fillStyle = "#14142a"; c.fillRect(0, GY + 3, W, H - GY);
      (obs || []).forEach(function (o) {
        c.fillStyle = "#ef4444";
        c.beginPath(); c.moveTo(o.x, GY); c.lineTo(o.x + o.w / 2, GY - o.h); c.lineTo(o.x + o.w, GY); c.closePath(); c.fill();
      });
      if (y == null) return;
      c.shadowColor = "#60a5fa"; c.shadowBlur = 14;
      c.fillStyle = "#3b82f6"; E.rr(c, PX, y, S, S, 6); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = "#fff"; c.fillRect(PX + 15, y + 7, 6, 6);
    }
  });
})();
