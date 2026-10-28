(function () {
  var E = Eng, W = E.W, H = E.H, PX = 90, S = 24, TOP = 30, BOT = H - 30;
  var y, vy, dir, obs, dist, speed, gap, flashT;

  function flip() { dir = -dir; vy = 0; E.snd("flip"); }

  E.game({
    reset: function () {
      dir = 1; y = BOT - S; vy = 0; obs = []; dist = 0; speed = 200; gap = 300; flashT = 0;
      E.score(0);
    },
    update: function (dt) {
      speed = Math.min(520, 200 + dist * 1.4);
      dist += speed * dt / 20;
      E.score(Math.floor(dist));
      vy += dir * 1900 * dt;
      y += vy * dt;
      if (y > BOT - S) { y = BOT - S; vy = 0; }
      if (y < TOP) { y = TOP; vy = 0; }
      var last = obs[obs.length - 1];
      if (!last || last.x < W - gap) {
        var top = Math.random() < 0.5;
        obs.push({ x: W + 20, w: E.ri(24, 40), h: E.ri(45, 95), top: top });
        gap = E.ri(250, 400);
      }
      for (var i = 0; i < obs.length; i++) {
        var o = obs[i];
        o.x -= speed * dt;
        if (o.x + o.w < -10) { obs.splice(i--, 1); continue; }
        var oy = o.top ? TOP : BOT - o.h;
        if (PX + S / 2 - 4 > o.x && PX - S / 2 + 4 < o.x + o.w && y + S - 4 > oy && y + 4 < oy + o.h) {
          E.snd("hurt");
          E.over(Math.floor(dist));
          return;
        }
      }
    },
    down: function () { flip(); },
    key: function (k, down) {
      if (down && (k === " " || k === "arrowup" || k === "arrowdown" || k === "w" || k === "s")) flip();
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#1c1c30";
      c.fillRect(0, 0, W, TOP);
      c.fillRect(0, BOT, W, H - BOT);
      c.fillStyle = "#8b5cf6";
      c.fillRect(0, TOP - 3, W, 3);
      c.fillRect(0, BOT, W, 3);
      (obs || []).forEach(function (o) {
        var oy = o.top ? TOP : BOT - o.h;
        c.fillStyle = "#ef4444";
        c.fillRect(o.x, oy, o.w, o.h);
        c.fillStyle = "rgba(255,255,255,.25)";
        c.fillRect(o.x, o.top ? oy + o.h - 4 : oy, o.w, 4);
      });
      if (y == null) return;
      c.fillStyle = "#3b82f6";
      E.rr(c, PX - S / 2, y, S, S, 6);
      c.fill();
      c.strokeStyle = "#dbeafe";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "#fff";
      c.fillRect(PX + 2, y + (dir > 0 ? 6 : 12), 6, 6);
      E.text(c, Math.floor(dist) + " m", W - 50, 15, 15, "#c4b5fd");
    }
  });
})();
