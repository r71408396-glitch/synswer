(function () {
  var E = Eng, W = E.W, H = E.H, PW = 80, PH = 12;
  var P, px, py, pvy, cam, lava, topY, startY, best, keys, tx, score;

  function addPlat() {
    topY -= E.ri(60, 105);
    P.push({ x: E.rnd(0, W - PW), y: topY, t: -1 });
  }

  E.game({
    reset: function () {
      P = [{ x: W / 2 - 70, y: H - 60, w: 140, t: -1 }];
      topY = H - 60; px = W / 2; py = H - 90; pvy = -300; cam = 0; lava = H + 160; startY = py; best = py; keys = {}; tx = null; score = 0;
      while (topY > -200) addPlat();
      E.score(0);
    },
    update: function (dt) {
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      if (kx) { px += kx * 300 * dt; tx = null; }
      else if (tx != null) px += (tx - px) * Math.min(1, dt * 12);
      if (px < 0) px += W; if (px > W) px -= W;
      var prev = py;
      pvy += 1500 * dt; py += pvy * dt;
      if (pvy > 0) {
        for (var i = 0; i < P.length; i++) {
          var p = P[i], w = p.w || PW;
          if (prev + 14 <= p.y + 2 && py + 14 >= p.y && px > p.x - 8 && px < p.x + w + 8) {
            pvy = -640; py = p.y - 14; E.snd("bounce");
            if (p.t < 0) p.t = 2;
            break;
          }
        }
      }
      for (var j = P.length - 1; j >= 0; j--) {
        if (P[j].t >= 0) { P[j].t -= dt; if (P[j].t <= 0) P.splice(j, 1); }
      }
      if (py < best) { best = py; score = Math.floor((startY - best) / 10); E.score(score); }
      cam = Math.min(cam, py - H * 0.45);
      while (topY > cam - 120) addPlat();
      P = P.filter(function (p) { return p.y < cam + H + 80; });
      lava -= (34 + Math.min(50, score * 0.12)) * dt;
      lava = Math.min(lava, cam + H + 40 - 0);
      if (py + 10 > lava || py > cam + H + 40) { E.snd("hurt"); E.over(score); }
    },
    down: function (x) { tx = x; },
    move: function (x) { tx = x; },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#14080c"; c.fillRect(0, 0, W, H);
      if (!P) return;
      P.forEach(function (p) {
        var w = p.w || PW, y = p.y - cam;
        var f = p.t >= 0 ? p.t / 2 : 1;
        c.globalAlpha = 0.35 + 0.65 * f;
        c.fillStyle = p.t >= 0 ? "#ef4444" : "#8b5cf6";
        E.rr(c, p.x, y, w, PH, 5); c.fill();
        c.globalAlpha = 1;
        if (p.t >= 0) { c.fillStyle = "rgba(255,255,255,.8)"; c.fillRect(p.x, y + PH - 3, w * f, 3); }
      });
      c.beginPath(); c.arc(px, py - cam - 4, 12, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      var ly = lava - cam;
      var g = c.createLinearGradient(0, ly, 0, ly + 80);
      g.addColorStop(0, "#f87171"); g.addColorStop(1, "#7f1d1d");
      c.fillStyle = g; c.fillRect(0, ly, W, H - ly + 80);
      E.text(c, score + " m", W - 40, 18, 16, "#c4b5fd");
    }
  });
})();
