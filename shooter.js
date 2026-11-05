(function () {
  var cv = document.getElementById("game"), ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height;
  var keys = {};
  var p, bullets, enemies, ebullets, parts, stars, score, lives, elapsed, spawnT, fireT, inv;
  var boss, bossLevel, nextBossAt;
  var running = false, runId = 0, pointerX = null, firing = false;
  var bossBar = document.getElementById("boss-bar"), bossFill = document.getElementById("boss-fill"), bossName = document.getElementById("boss-name");
  var BOSS_NAMES = ["Warden", "Devourer", "Dreadnought", "Leviathan", "Overlord"];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeStars() {
    stars = [];
    for (var i = 0; i < 50; i++) stars.push({ x: rand(0, W), y: rand(0, H), s: rand(0.5, 2), v: rand(20, 70) });
  }

  function reset() {
    p = { x: W / 2, y: H - 50, w: 34, h: 30 };
    bullets = []; enemies = []; ebullets = []; parts = [];
    boss = null; bossLevel = 0; nextBossAt = 300;
    score = 0; lives = 3; elapsed = 0; spawnT = 0.5; fireT = 0; inv = 0;
    GameUI.setScore(0);
    document.getElementById("lives").textContent = lives;
    barUpdate();
  }

  function barUpdate() {
    if (!bossBar) return;
    bossBar.hidden = !boss;
    if (boss) {
      bossFill.style.width = Math.max(0, boss.hp / boss.max * 100) + "%";
      bossName.textContent = "Boss " + bossLevel + ": " + BOSS_NAMES[(bossLevel - 1) % BOSS_NAMES.length];
    }
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < (n || 10); i++) {
      var a = Math.random() * Math.PI * 2, v = rand(40, 160);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.6), c: color });
    }
  }

  function end() {
    running = false;
    if (bossBar) bossBar.hidden = true;
    draw();
    GameUI.over(score);
  }

  function spawnBoss() {
    bossLevel++;
    var hp = 30 + 14 * bossLevel;
    boss = { x: W / 2, y: -50, w: 120, h: 62, hp: hp, max: hp, vx: 80 + bossLevel * 12, fireT: 1.6, shots: 0, flash: 0, hue: (bossLevel - 1) % 3 };
    if (window.Sound) Sound.play("hurt");
    barUpdate();
  }

  function bossFire() {
    var n = bossLevel, b = boss, sp = 160 + n * 12, i, a, cnt;
    var ox = b.x, oy = b.y + b.h / 2;
    if (b.shots++ % 2 === 0) {
      var base = Math.atan2(p.y - oy, p.x - ox);
      cnt = 3 + Math.min(4, n);
      for (i = 0; i < cnt; i++) {
        a = base + (i - (cnt - 1) / 2) * 0.22;
        ebullets.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
      }
    } else {
      cnt = 5 + n;
      for (i = 0; i < cnt; i++) {
        a = Math.PI * (0.12 + 0.76 * i / (cnt - 1));
        ebullets.push({ x: ox, y: oy, vx: Math.cos(a) * sp * 0.85, vy: Math.sin(a) * sp * 0.85 });
      }
    }
  }

  function hurt() {
    burst(p.x, p.y, "#99f6e4");
    lives--;
    if (window.Sound) Sound.play("hurt");
    document.getElementById("lives").textContent = Math.max(0, lives);
    inv = 1.5;
    if (lives <= 0) { end(); return true; }
    return false;
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
      if (window.Sound) Sound.play("shoot");
      fireT = 0.22;
    }
    bullets.forEach(function (b) { b.y -= 560 * dt; });
    bullets = bullets.filter(function (b) { return b.y > -10; });

    if (!boss && score >= nextBossAt) spawnBoss();

    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = boss ? 1.6 : Math.max(0.33, 0.95 - elapsed * 0.012);
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
          if (window.Sound) Sound.play("boom");
        }
      });
    });
    bullets = bullets.filter(function (b) { return !b.dead; });
    enemies = enemies.filter(function (e) { return !e.dead; });

    if (boss) {
      var bs = boss;
      if (bs.y < 90) bs.y += 60 * dt;
      bs.x += bs.vx * dt;
      if (bs.x < bs.w / 2) { bs.x = bs.w / 2; bs.vx = Math.abs(bs.vx); }
      if (bs.x > W - bs.w / 2) { bs.x = W - bs.w / 2; bs.vx = -Math.abs(bs.vx); }
      if (bs.flash > 0) bs.flash -= dt;
      if (bs.y >= 60) {
        bs.fireT -= dt;
        if (bs.fireT <= 0) { bossFire(); bs.fireT = Math.max(0.65, 1.35 - bossLevel * 0.1); }
      }
      bullets.forEach(function (b) {
        if (!b.dead && Math.abs(b.x - bs.x) < bs.w / 2 && Math.abs(b.y - bs.y) < bs.h / 2 + 4) {
          b.dead = true;
          bs.hp--;
          bs.flash = 0.08;
          burst(b.x, b.y, "#fde68a", 2);
        }
      });
      bullets = bullets.filter(function (b) { return !b.dead; });
      if (bs.hp <= 0) {
        score += 100 * bossLevel;
        GameUI.setScore(score);
        burst(bs.x, bs.y, "#f87171", 40);
        burst(bs.x, bs.y, "#fde68a", 30);
        if (window.Sound) { Sound.play("boom"); Sound.play("win"); }
        boss = null;
        ebullets = [];
        nextBossAt = score + 300;
      }
      barUpdate();
    }

    ebullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
    ebullets = ebullets.filter(function (b) { return b.y < H + 20 && b.y > -20 && b.x > -20 && b.x < W + 20; });

    inv -= dt;
    if (inv <= 0) {
      var i;
      for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (Math.abs(e.x - p.x) < (e.w + p.w) / 2 - 4 && Math.abs(e.y - p.y) < (e.h + p.h) / 2 - 4) {
          enemies.splice(i, 1);
          if (hurt()) return;
          break;
        }
      }
      if (inv <= 0) {
        for (i = 0; i < ebullets.length; i++) {
          var q = ebullets[i];
          if (Math.abs(q.x - p.x) < p.w / 2 - 6 && Math.abs(q.y - p.y) < p.h / 2 - 2) {
            ebullets.splice(i, 1);
            if (hurt()) return;
            break;
          }
        }
      }
      if (inv <= 0 && boss && Math.abs(boss.x - p.x) < (boss.w + p.w) / 2 - 8 && Math.abs(boss.y - p.y) < (boss.h + p.h) / 2 - 8) {
        if (hurt()) return;
      }
    }

    parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; });
    parts = parts.filter(function (q) { return q.life > 0; });
    stars.forEach(function (s) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = rand(0, W); } });
  }

  function draw() {
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, W, H);
    if (window.ShooterState && window.ShooterState.render3d) return;
    ctx.fillStyle = "#5eead4";
    stars.forEach(function (s) { ctx.globalAlpha = 0.3 + s.s / 3; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#99f6e4";
    bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y - 8, 4, 14); });
    ctx.fillStyle = "#fb923c";
    ebullets.forEach(function (b) { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); });

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

    if (boss) {
      ctx.fillStyle = boss.flash > 0 ? "#fff" : "#dc2626";
      ctx.fillRect(boss.x - boss.w / 2, boss.y - boss.h / 2, boss.w, boss.h);
    }

    if (running && (inv <= 0 || Math.floor(inv * 10) % 2 === 0)) {
      ctx.fillStyle = "#14e0cc";
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

  // 3D layer: a WebGL canvas over the 2D one, drawn by games/shooter3d.js
  window.ShooterState = {
    W: W, H: H, render3d: false,
    player: function () { return p; },
    running: function () { return running; },
    inv: function () { return inv; },
    bullets: function () { return bullets; },
    enemies: function () { return enemies; },
    ebullets: function () { return ebullets; },
    boss: function () { return boss; },
    parts: function () { return parts; }
  };
  var wrap = document.querySelector(".canvas-wrap");
  if (wrap) {
    var c3 = document.createElement("canvas");
    c3.id = "game3d";
    c3.className = "brick3d";
    wrap.insertBefore(c3, document.getElementById("overlay"));
    var ms = document.createElement("script");
    ms.type = "module";
    ms.src = "games/shooter3d.js";
    document.body.appendChild(ms);
  }

  makeStars();
  reset();
  draw();
})();
