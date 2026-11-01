(function () {
  var E = Eng, W = E.W, H = E.H, SEA = 96, BOT = 450;
  var bx, tgt, hy, state, fish, caught, score, left, off, keys, setTime;
  setTime = E.stat("Time", "60");

  function spawn(f) {
    var big = Math.random() < 0.25, mid = !big && Math.random() < 0.4;
    f.size = big ? 2 : mid ? 1 : 0; f.val = big ? 5 : mid ? 2 : 1;
    f.dir = Math.random() < 0.5 ? 1 : -1;
    f.sp = (big ? 28 : 55) + E.rnd(0, 35);
    f.y = big ? E.rnd(300, 430) : E.rnd(150, 400);
    f.x = f.dir > 0 ? -40 : W + 40; f.caught = false;
  }
  function cast() { if (state === "idle") { state = "down"; hy = SEA; E.snd("swoosh"); } }

  E.game({
    reset: function () {
      bx = W / 2; tgt = bx; hy = SEA; state = "idle"; caught = []; score = 0; left = 60; off = 0; keys = {};
      fish = []; for (var i = 0; i < 9; i++) { var f = {}; spawn(f); f.x = E.rnd(0, W); fish.push(f); }
      setTime(60); E.score(0);
    },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(score); return; }
      off += dt * 30;
      var kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
      if (kx && state === "idle") tgt = bx + kx * 60;
      if (state === "idle") bx += (E.clamp(tgt, 20, W - 20) - bx) * Math.min(1, dt * 8);
      if (keys[" "]) cast();
      if (state === "down") {
        hy += 250 * dt;
        fish.forEach(function (f) {
          if (f.caught || caught.length >= 3) return;
          if (Math.abs(f.x - bx) < 18 + f.size * 6 && Math.abs(f.y - hy) < 14 + f.size * 4) { f.caught = true; caught.push(f); E.snd("tap"); }
        });
        if (hy >= BOT || caught.length >= 3) state = "up";
      } else if (state === "up") {
        hy -= (210 - caught.length * 25) * dt;
        if (hy <= SEA) {
          hy = SEA; state = "idle";
          if (caught.length) { var v = 0; caught.forEach(function (f) { v += f.val; spawn(f); }); score += v; E.score(score); E.snd("good"); caught = []; }
        }
      }
      fish.forEach(function (f) {
        if (f.caught) { f.x = bx + 10 * (caught.indexOf(f) % 2 ? 1 : -1); f.y = hy + 12 + caught.indexOf(f) * 10; return; }
        f.x += f.dir * f.sp * dt;
        if ((f.dir > 0 && f.x > W + 50) || (f.dir < 0 && f.x < -50)) spawn(f);
      });
    },
    down: function (x) { if (state === "idle") { tgt = x; bx = x; cast(); } },
    move: function (x, y, p) { if (state === "idle") tgt = x; },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      var g = c.createLinearGradient(0, SEA, 0, H);
      c.fillStyle = "#6bb7e8"; c.fillRect(0, 0, W, SEA);
      g.addColorStop(0, "#1e6fa8"); g.addColorStop(1, "#06223d");
      c.fillStyle = g; c.fillRect(0, SEA, W, H - SEA);
      c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1;
      for (var x = -((off) % 40); x < W; x += 40) { c.beginPath(); c.moveTo(x, SEA); c.lineTo(x, H); c.stroke(); }
      for (var y = SEA + 40; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      if (!fish) return;
      fish.forEach(function (f) {
        var s = 10 + f.size * 6, d = f.dir;
        c.fillStyle = f.caught ? "#fcd34d" : f.size === 2 ? "#0b1d33" : "#0f2c4a";
        c.beginPath(); c.ellipse(f.x, f.y, s, s * 0.55, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(f.x - d * s, f.y); c.lineTo(f.x - d * (s + 10), f.y - 8); c.lineTo(f.x - d * (s + 10), f.y + 8); c.closePath(); c.fill();
      });
      c.fillStyle = "#7c2d12"; E.rr(c, bx - 28, SEA - 24, 56, 20, 6); c.fill();
      c.fillStyle = "#f8fafc"; c.fillRect(bx - 3, SEA - 48, 3, 26); c.beginPath(); c.moveTo(bx, SEA - 48); c.lineTo(bx + 16, SEA - 30); c.lineTo(bx, SEA - 30); c.fill();
      c.strokeStyle = "#e2e8f0"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, SEA - 8); c.lineTo(bx, hy); c.stroke();
      c.beginPath(); c.arc(bx, hy + 3, 4, 0, Math.PI * 2); c.strokeStyle = "#fbbf24"; c.lineWidth = 2; c.stroke();
      E.text(c, "Catch " + score, W / 2, 20, 17, "#0b1d33");
      E.text(c, state === "idle" ? "Tap to drop the hook" : state === "down" ? "Going down..." : "Reeling in " + caught.length + "/3", W / 2, 48, 13, "#0b1d33");
    }
  });
})();
