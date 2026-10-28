(function () {
  var cv = document.getElementById("game"), ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height;
  var keys = {};
  var p, bullets, enemies, parts, stars, score, lives, elapsed, spawnT, fireT, inv;
  var running = false, runId = 0, pointerX = null, firing = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeStars() {
    stars = [];
    for (var i = 0; i < 50; i++) stars.push({ x: rand(0, W), y: rand(0, H), s: rand(0.5, 2), v: rand(20, 70) });
  }

  function reset() {
    p = { x: W / 2, y: H - 50, w: 34, h: 30 };
    bullets = []; enemies = []; parts = [];
    score = 0; lives = 3; elapsed = 0; spawnT = 0.5; fireT = 0; inv = 0;
    GameUI.setScore(0);
    document.getElementById("lives").textContent = lives;
  }

  function burst(x, y, color) {
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2, v = rand(40, 160);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.6), c: color });
    }
  }

  function end() {
    running = false;
    draw();
    GameUI.over(score);
  }

  function update(dt) {
    elapsed += dt;
    var left = keys.arrowleft || keys.a, right = keys.arrowright || keys.d;
    if (left) p.x -= 320 * dt;
    if (right) p.x += 320 * dt;
    if (pointerX !== null && !left && !right) p.x += (pointerX - p.x) * Math.min(1, dt * 14);
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));

    fireT -= dt;
    if ((keys[" "] || firing) && fireT <= 0) {
      bullets.push({ x: p.x, y: p.y - 18 });
      fireT = 0.22;
    }
    bullets.forEach(function (b) { b.y -= 560 * dt; });
    bullets = bullets.filter(function (b) { return b.y > -10; });

    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = Math.max(0.33, 0.95 - elapsed * 0.012);
      enemies.push({
        x: rand(20, W - 20), y: -20, w: 30, h: 26,
        vx: rand(-40, 40), vy: 70 + Math.min(170, elapsed * 3) + rand(0, 40),
        kind: Math.random() < 0.5 ? 0 : 1
      });
    }
    enemies.forEach(function (e) {
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (e.x < 16 || e.x > W - 16) e.vx = -e.vx;
    });
    enemies = enemies.filter(function (e) { return e.y < H + 30; });

    bullets.forEach(function (b) {
      enemies.forEach(function (e) {
        if (!e.dead && !b.dead && Math.abs(b.x - e.x) < e.w / 2 + 3 && Math.abs(b.y - e.y) < e.h / 2 + 6) {
          e.dead = true; b.dead = true;
          score += 10;
          GameUI.setScore(score);
          burst(e.x, e.y, e.kind ? "#60a5fa" : "#e879f9");
        }
      });
    });
    bullets = bullets.filter(function (b) { return !b.dead; });
    enemies = enemies.filter(function (e) { return !e.dead; });

    inv -= dt;
    if (inv <= 0) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (Math.abs(e.x - p.x) < (e.w + p.w) / 2 - 4 && Math.abs(e.y - p.y) < (e.h + p.h) / 2 - 4) {
          enemies.splice(i, 1);
          burst(p.x, p.y, "#c4b5fd");
          lives--;
          document.getElementById("lives").textContent = lives;
          inv = 1.5;
          if (lives <= 0) { end(); return; }
          break;
        }
      }
    }

    parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; });
    parts = parts.filter(function (q) { return q.life > 0; });
    stars.forEach(function (s) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = rand(0, W); } });
  }

  function draw() {
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#a78bfa";
    stars.forEach(function (s) { ctx.globalAlpha = 0.3 + s.s / 3; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#c4b5fd";
    bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y - 8, 4, 14); });

    enemies.forEach(function (e) {
      ctx.fillStyle = e.kind ? "#3b82f6" : "#c026d3";
      ctx.beginPath();
      if (e.kind) {
        ctx.moveTo(e.x, e.y + e.h / 2); ctx.lineTo(e.x - e.w / 2, e.y - e.h / 2); ctx.lineTo(e.x + e.w / 2, e.y - e.h / 2);
      } else {
        ctx.moveTo(e.x, e.y - e.h / 2); ctx.lineTo(e.x + e.w / 2, e.y); ctx.lineTo(e.x, e.y + e.h / 2); ctx.lineTo(e.x - e.w / 2, e.y);
      }
      ctx.closePath();
      ctx.fill();
    });

    if (running && (inv <= 0 || Math.floor(inv * 10) % 2 === 0)) {
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.h / 2);
      ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2);
      ctx.lineTo(p.x, p.y + p.h / 4);
      ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(p.x - 3, p.y + p.h / 4, 6, 8 + Math.random() * 4);
    }

    parts.forEach(function (q) { ctx.globalAlpha = Math.min(1, q.life * 2); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, 3, 3); });
    ctx.globalAlpha = 1;
  }

  function begin() {
    var id = ++runId;
    var last = performance.now();
    requestAnimationFrame(function f(t) {
      if (id !== runId || !running) return;
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      update(dt);
      if (running) { draw(); requestAnimationFrame(f); }
    });
  }

  GameUI.onStart = function () { reset(); running = true; begin(); };
  GameUI.onPause = function () { running = false; runId++; firing = false; keys = {}; };
  GameUI.onResume = function () { running = true; begin(); };

  document.addEventListener("keydown", function (e) {
    if (GameUI.typing()) return;
    var k = e.key.toLowerCase();
    if (running && (k === " " || k.indexOf("arrow") === 0)) e.preventDefault();
    keys[k] = true;
  });
  document.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });

  function setPointer(e) {
    var r = cv.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width * W;
  }
  cv.addEventListener("pointerdown", function (e) { setPointer(e); firing = true; });
  cv.addEventListener("pointermove", function (e) { if (firing || e.pointerType === "mouse") setPointer(e); });
  window.addEventListener("pointerup", function () { firing = false; });
  window.addEventListener("pointercancel", function () { firing = false; });
  cv.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") pointerX = null; });

  makeStars();
  reset();
  draw();
})();
