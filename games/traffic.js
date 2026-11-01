(function () {
  var E = Eng, W = E.W, H = E.H, MAXQ = 7, GAP = 26;
  var lanes, light, clear, spT, score, t;

  function pos(a, d) {
    return a === 0 ? [200 - d, 212] : a === 1 ? [200 + d, 188] : a === 2 ? [188, 200 - d] : [212, 200 + d];
  }
  function green(a) { return clear <= 0 && light === (a < 2 ? 0 : 1); }
  function toggle() { light = 1 - light; clear = 1; E.snd("tap"); }

  E.game({
    reset: function () { lanes = [[], [], [], []]; light = 0; clear = 0; spT = [0.5, 1, 1.5, 2]; score = 0; t = 0; E.score(0); },
    update: function (dt) {
      t += dt; clear -= dt;
      var a, i;
      for (a = 0; a < 4; a++) {
        spT[a] -= dt;
        var L = lanes[a];
        if (spT[a] <= 0) {
          spT[a] = E.rnd(1.2, 2.6) * Math.max(0.5, 1 - t * 0.006);
          if (!L.length || L[L.length - 1].d < 200) L.push({ d: 230, c: E.PAL[E.ri(0, 7)] });
        }
        for (i = 0; i < L.length; i++) {
          var car = L[i], nd = car.d - 90 * dt;
          if (!green(a) && car.d >= 40 && nd < 40) nd = 40;
          if (i > 0 && nd < L[i - 1].d + GAP) nd = Math.max(nd, L[i - 1].d + GAP);
          car.d = Math.min(car.d, Math.max(nd, car.d - 90 * dt));
        }
        while (L.length && L[0].d < -40) { L.shift(); score++; E.score(score); }
        if (L.length >= MAXQ) { E.snd("boom"); E.over(score); return; }
      }
    },
    down: function () { toggle(); },
    key: function (k, down) { if (down && k === " ") toggle(); },
    draw: function (c) {
      c.fillStyle = "#16341f"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#2b2b3a"; c.fillRect(0, 170, W, 60); c.fillRect(170, 0, 60, H);
      c.strokeStyle = "#fde68a"; c.lineWidth = 2; c.setLineDash([10, 10]);
      c.beginPath(); c.moveTo(0, 200); c.lineTo(165, 200); c.moveTo(235, 200); c.lineTo(W, 200); c.moveTo(200, 0); c.lineTo(200, 165); c.moveTo(200, 235); c.lineTo(200, H); c.stroke();
      c.setLineDash([]);
      if (!lanes) return;
      for (var a = 0; a < 4; a++) {
        lanes[a].forEach(function (car) {
          var p = pos(a, car.d);
          c.fillStyle = car.c;
          if (a < 2) c.fillRect(p[0] - 11, p[1] - 6, 22, 12); else c.fillRect(p[0] - 6, p[1] - 11, 12, 22);
        });
        var lp = a === 0 ? [158, 230] : a === 1 ? [242, 170] : a === 2 ? [170, 158] : [230, 242];
        c.beginPath(); c.arc(lp[0], lp[1], 7, 0, Math.PI * 2); c.fillStyle = green(a) ? "#22c55e" : "#ef4444"; c.fill();
        E.text(c, String(lanes[a].length), lp[0] + (a === 0 ? -16 : a === 1 ? 16 : 0), lp[1] + (a === 2 ? -16 : a === 3 ? 16 : 0), 12, lanes[a].length >= 5 ? "#fca5a5" : "#c4b5fd");
      }
      E.text(c, "Cars through " + score, W / 2, 20, 17, "#fff");
      E.text(c, "Tap or press space to switch the lights. 7 queued cars is gridlock.", W / 2, H - 14, 12, "#c4b5fd");
    }
  });
})();
