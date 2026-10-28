(function () {
  var E = Eng, W = E.W, H = E.H, G = 900;
  var items, halves, trail, prev, score, miss, spawnT, setMiss, wave;
  setMiss = E.stat("Missed", "0/3");

  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? E.clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }
  function spawnWave() {
    var n = E.ri(1, Math.min(4, 2 + Math.floor(wave / 8)));
    wave++;
    for (var i = 0; i < n; i++) {
      var x = E.rnd(60, W - 60);
      items.push({ x: x, y: H + 20, vx: (W / 2 - x) * E.rnd(0.1, 0.4), vy: -E.rnd(700, 830), r: 24, bomb: Math.random() < 0.18, color: E.PAL[E.ri(0, 7)] });
    }
  }
  function slash(ax, ay, bx, by) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (distSeg(it.x, it.y, ax, ay, bx, by) < it.r + 4) {
        items.splice(i--, 1);
        if (it.bomb) { E.snd("boom"); E.over(score); return; }
        score++;
        E.score(score);
        E.snd("swoosh");
        halves.push({ x: it.x, y: it.y, vx: it.vx - 90, vy: it.vy * 0.3, r: it.r, color: it.color, life: 0.8, s: -1 });
        halves.push({ x: it.x, y: it.y, vx: it.vx + 90, vy: it.vy * 0.3, r: it.r, color: it.color, life: 0.8, s: 1 });
      }
    }
  }

  E.game({
    reset: function () { items = []; halves = []; trail = []; prev = null; score = 0; miss = 0; spawnT = 0.5; wave = 0; setMiss("0/3"); E.score(0); },
    update: function (dt) {
      spawnT -= dt;
      if (spawnT <= 0) { spawnWave(); spawnT = E.rnd(0.9, 1.4); }
      var i;
      for (i = 0; i < items.length; i++) {
        var it = items[i];
        it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt;
        if (it.vy > 0 && it.y > H + it.r + 10) {
          items.splice(i--, 1);
          if (!it.bomb) {
            miss++;
            setMiss(miss + "/3");
            E.snd("bad");
            if (miss >= 3) { E.over(score); return; }
          }
        }
      }
      for (i = 0; i < halves.length; i++) {
        var h = halves[i];
        h.vy += G * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
        if (h.life <= 0) halves.splice(i--, 1);
      }
      for (i = 0; i < trail.length; i++) { trail[i].t -= dt; if (trail[i].t <= 0) trail.splice(i--, 1); }
    },
    down: function (x, y) { prev = [x, y]; trail.push({ x: x, y: y, t: 0.2 }); slash(x, y, x, y); },
    move: function (x, y, pressed) {
      if (!pressed || !prev) return;
      trail.push({ x: x, y: y, t: 0.2 });
      slash(prev[0], prev[1], x, y);
      prev = [x, y];
    },
    up: function () { prev = null; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      if (!items) return;
      halves.forEach(function (h) {
        c.globalAlpha = Math.max(0, h.life);
        c.beginPath();
        c.arc(h.x, h.y, h.r, h.s < 0 ? Math.PI / 2 : -Math.PI / 2, h.s < 0 ? Math.PI * 1.5 : Math.PI / 2);
        c.fillStyle = h.color;
        c.fill();
        c.globalAlpha = 1;
      });
      items.forEach(function (it) {
        c.beginPath();
        c.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        c.fillStyle = it.bomb ? "#1f2937" : it.color;
        c.fill();
        c.strokeStyle = it.bomb ? "#ef4444" : "rgba(255,255,255,.5)";
        c.lineWidth = 3;
        c.stroke();
        if (it.bomb) E.text(c, "X", it.x, it.y, 22, "#ef4444");
      });
      if (trail.length > 1) {
        c.lineCap = "round"; c.lineJoin = "round";
        for (var i = 1; i < trail.length; i++) {
          c.strokeStyle = "rgba(196,181,253," + Math.min(1, trail[i].t * 5) + ")";
          c.lineWidth = 5;
          c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke();
        }
      }
      E.text(c, String(score), W / 2, 40, 40, "rgba(255,255,255,.8)");
    }
  });
})();
