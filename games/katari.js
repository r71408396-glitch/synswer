(function () {
  var E = Eng, W = E.W, H = E.H;
  var bx, by, br, tx, ty, keys, objs, left, setTime;
  setTime = E.stat("Time", "60");

  function sc() { return Math.max(0, Math.floor(br * 10 - 120)); }
  function spawn() {
    for (var i = 0; i < 30; i++) {
      var r = E.clamp(br * E.rnd(0.25, 1.7), 3, 70), x = E.rnd(r, W - r), y = E.rnd(r, H - r);
      if (Math.hypot(x - bx, y - by) > br + r + 20) { objs.push({ x: x, y: y, r: r, c: E.PAL[E.ri(0, 7)] }); return; }
    }
  }

  E.game({
    reset: function () {
      bx = W / 2; by = H / 2; br = 12; tx = bx; ty = by; keys = {}; objs = []; left = 60;
      for (var i = 0; i < 26; i++) spawn();
      setTime(60); E.score(0);
    },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(sc()); return; }
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      var ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      var vx = 0, vy = 0;
      if (kx || ky) { var l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; tx = bx; ty = by; }
      else { var dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy); if (d > 4) { vx = dx / d; vy = dy / d; } }
      bx = E.clamp(bx + vx * 120 * dt, br, W - br); by = E.clamp(by + vy * 120 * dt, br, H - br);
      for (var i = 0; i < objs.length; i++) {
        var o = objs[i], ddx = o.x - bx, ddy = o.y - by, dd = Math.hypot(ddx, ddy) || 1;
        if (br > o.r * 1.08 && dd < br) {
          br = Math.sqrt(br * br + o.r * o.r * 0.5); objs.splice(i--, 1); E.score(sc()); E.snd("good"); spawn();
        } else if (o.r >= br * 1.08 && dd < br + o.r) {
          var ov = br + o.r - dd; bx -= ddx / dd * ov; by -= ddy / dd * ov;
        }
      }
      while (objs.length < 26) spawn();
    },
    down: function (x, y) { tx = x; ty = y; },
    move: function (x, y, p) { if (p) { tx = x; ty = y; } },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#101a24"; c.fillRect(0, 0, W, H);
      if (!objs) return;
      objs.forEach(function (o) {
        var big = o.r >= br * 1.08;
        c.beginPath(); c.arc(o.x, o.y, o.r, 0, Math.PI * 2); c.fillStyle = o.c; c.globalAlpha = big ? 0.55 : 1; c.fill(); c.globalAlpha = 1;
        if (big) { c.strokeStyle = "#ef4444"; c.lineWidth = 2; c.stroke(); }
      });
      c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fillStyle = "#8b5cf6"; c.fill();
      c.strokeStyle = "#e9d5ff"; c.lineWidth = 3; c.stroke();
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(bx - br * 0.3, by - br * 0.3, br * 0.25, 0, Math.PI * 2); c.fill();
      E.text(c, "Size " + sc(), W / 2, 16, 15, "#fff");
    }
  });
})();
