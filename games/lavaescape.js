(function () {
  var E = Eng, W = E.W, H = E.H, PW = 80, PH = 12;
  var P, px, py, pvy, cam, lava, topY, startY, best, keys, tx, score, fires, fbT;

  function addPlat() {
    topY -= E.ri(60, 105);
    P.push({ x: E.rnd(0, W - PW), y: topY, t: -1 });
  }

  E.game({
    reset: function () {
      P = [{ x: W / 2 - 70, y: H - 60, w: 140, t: -1 }];
      topY = H - 60; px = W / 2; py = H - 90; pvy = -300; cam = 0; lava = H + 160; startY = py; best = py; keys = {}; tx = null; score = 0; fires = []; fbT = 1;
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
      if (score >= 1000) {
        fbT -= dt;
        if (fbT <= 0) {
          fbT = E.rnd(1.1, 2.4) - Math.min(0.7, (score - 1000) / 3000);
          var fx = E.rnd(20, W - 20), tgt = px + E.rnd(-60, 60);
          fires.push({ x: fx, y: -30, w: 0.9, vx: (tgt - fx) / 1.6, vy: 0, r: E.rnd(10, 16) });
        }
      }
      var pxs = px, pys = py - cam - 4;
      for (var f = 0; f < fires.length; f++) {
        var fb = fires[f];
        if (fb.w > 0) { fb.w -= dt; continue; }
        if (!fb.go) { fb.go = true; fb.vy = 280; }
        fb.x += fb.vx * dt; fb.y += fb.vy * dt; fb.vy += 120 * dt;
        if (fb.y > H + 40 || fb.x < -40 || fb.x > W + 40) { fires.splice(f--, 1); continue; }
        var fdx = fb.x - pxs, fdy = fb.y - pys;
        if (fdx * fdx + fdy * fdy < (fb.r + 9) * (fb.r + 9)) { E.snd("boom"); E.over(score); return; }
      }
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
        c.fillStyle = p.t >= 0 ? "#ef4444" : "#14e0cc";
        E.rr(c, p.x, y, w, PH, 5); c.fill();
        c.globalAlpha = 1;
        if (p.t >= 0) { c.fillStyle = "rgba(255,255,255,.8)"; c.fillRect(p.x, y + PH - 3, w * f, 3); }
      });
      c.beginPath(); c.arc(px, py - cam - 4, 12, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      (fires || []).forEach(function (fb) {
        if (fb.w > 0) {
          c.globalAlpha = 0.5 + 0.5 * Math.sin(fb.w * 30);
          E.text(c, "!", fb.x, 16, 22, "#fb923c"); c.globalAlpha = 1;
          return;
        }
        var tx2 = fb.x - fb.vx * 0.06, ty2 = fb.y - fb.vy * 0.06;
        var tg = c.createLinearGradient(fb.x, fb.y, tx2, ty2);
        tg.addColorStop(0, "rgba(251,146,60,.8)"); tg.addColorStop(1, "rgba(239,68,68,0)");
        c.strokeStyle = tg; c.lineWidth = fb.r * 1.5; c.lineCap = "round";
        c.beginPath(); c.moveTo(fb.x, fb.y); c.lineTo(tx2, ty2); c.stroke();
        var rg = c.createRadialGradient(fb.x, fb.y, 1, fb.x, fb.y, fb.r);
        rg.addColorStop(0, "#fef3c7"); rg.addColorStop(0.45, "#fb923c"); rg.addColorStop(1, "#b91c1c");
        c.fillStyle = rg; c.beginPath(); c.arc(fb.x, fb.y, fb.r, 0, Math.PI * 2); c.fill();
      });
      var ly = lava - cam;
      var g = c.createLinearGradient(0, ly, 0, ly + 80);
      g.addColorStop(0, "#f87171"); g.addColorStop(1, "#7f1d1d");
      c.fillStyle = g; c.fillRect(0, ly, W, H - ly + 80);
      E.text(c, score + " m", W - 40, 18, 16, "#99f6e4");
    }
  });
})();
