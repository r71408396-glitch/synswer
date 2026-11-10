(function () {
  var E = Eng, W = E.W, H = E.H, GY = H - 50, PX = 70, S = 26;
  var y, vy, sp, obs, coins, dist, n, setSp;
  setSp = E.stat("Speed", "1.0x");

  var jumps = 0;
  function jump() {
    if (y >= GY - S - 0.5) { vy = -640; jumps = 1; E.snd("flip"); }
    else if (jumps < 2) { vy = -580; jumps = 2; E.snd("bounce"); }
  }

  E.game({
    reset: function () { y = GY - S; vy = 0; jumps = 0; sp = 200; obs = []; coins = []; dist = 0; n = 0; setSp("1.0x"); E.score(0); },
    update: function (dt) {
      dist += sp * dt / 30;
      E.score(Math.floor(dist) + n * 10);
      vy += 1900 * dt; y += vy * dt;
      if (y > GY - S) { y = GY - S; vy = 0; jumps = 0; }
      var last = obs[obs.length - 1], i;
      if (!last || last.x < W - E.ri(230, 380)) {
        var o = { x: W + 30, w: E.ri(24, 40), h: E.ri(28, 52) };
        obs.push(o);
        if (Math.random() < 0.85) coins.push({ x: o.x + o.w / 2 - E.ri(70, 110), y: GY - E.ri(50, 120) });
      }
      for (i = 0; i < obs.length; i++) {
        var b = obs[i];
        b.x -= sp * dt;
        if (b.x + b.w < -10) { obs.splice(i--, 1); continue; }
        if (PX + S - 5 > b.x && PX + 5 < b.x + b.w && y + S - 3 > GY - b.h) { E.snd("hurt"); E.over(Math.floor(dist) + n * 10); return; }
      }
      for (i = 0; i < coins.length; i++) {
        var c = coins[i];
        c.x -= sp * dt;
        var dx = c.x - (PX + S / 2), dy = c.y - (y + S / 2);
        if (dx * dx + dy * dy < 26 * 26) {
          coins.splice(i--, 1); n++; sp = Math.min(540, sp + 22); setSp((sp / 200).toFixed(1) + "x"); E.snd("good");
        } else if (c.x < -20) coins.splice(i--, 1);
      }
    },
    down: function () { jump(); },
    key: function (k, down) { if (down && (k === " " || k === "arrowup" || k === "w")) jump(); },
    draw: function (c) {
      c.fillStyle = "#0a0a14"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#14e0cc"; c.fillRect(0, GY, W, 3);
      c.fillStyle = "#14142a"; c.fillRect(0, GY + 3, W, H - GY);
      (obs || []).forEach(function (o) {
        c.fillStyle = "#ef4444"; c.fillRect(o.x, GY - o.h, o.w, o.h);
        c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(o.x, GY - o.h, o.w, 4);
      });
      (coins || []).forEach(function (k) {
        c.beginPath(); c.arc(k.x, k.y, 9, 0, Math.PI * 2); c.fillStyle = "#facc15"; c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
      });
      if (y == null) return;
      c.fillStyle = "#3b82f6"; E.rr(c, PX, y, S, S, 6); c.fill();
      c.fillStyle = "#fff"; c.fillRect(PX + 15, y + 7, 6, 6);
      E.text(c, "Coins " + n, W - 50, 16, 15, "#facc15");
      c.fillStyle = jumps < 2 ? "#99f6e4" : "#334155";
      c.beginPath(); c.arc(PX + S / 2, y - 8, 3, 0, Math.PI * 2); c.fill();
    }
  });
})();
