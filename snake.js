(function () {
  var cv = document.getElementById("game"), ctx = cv.getContext("2d");
  var N = 20, C = cv.width / N;
  var snake, dir, queue, food, score, tickMs, acc, running = false, runId = 0;

  function rnd(n) { return Math.floor(Math.random() * n); }

  function placeFood() {
    do { food = { x: rnd(N), y: rnd(N) }; }
    while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    tickMs = 150;
    acc = 0;
    placeFood();
    GameUI.setScore(0);
  }

  function turn(dx, dy) {
    var ref = queue.length ? queue[queue.length - 1] : dir;
    if ((ref.x === -dx && ref.y === -dy) || (ref.x === dx && ref.y === dy)) return;
    if (queue.length < 3) queue.push({ x: dx, y: dy });
  }

  function end() {
    running = false;
    draw();
    GameUI.over(score);
  }

  function step() {
    if (queue.length) dir = queue.shift();
    var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    h.x = (h.x + N) % N; // walls wrap around to the opposite side
    h.y = (h.y + N) % N;
    if (snake.slice(0, -1).some(function (s) { return s.x === h.x && s.y === h.y; })) {
      end();
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score += 10;
      if (window.Sound) Sound.play("eat");
      GameUI.setScore(score);
      tickMs = Math.max(75, tickMs - 2);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "rgba(20,224,204,.08)";
    ctx.lineWidth = 1;
    for (var i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * C, 0); ctx.lineTo(i * C, cv.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * C); ctx.lineTo(cv.width, i * C); ctx.stroke();
    }
    ctx.fillStyle = "#60a5fa";
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 12;
    ctx.fillRect(food.x * C + 5, food.y * C + 5, C - 10, C - 10);
    ctx.shadowBlur = 0;
    for (var i = snake.length - 1; i >= 0; i--) {
      var s = snake[i], r = (C / 2 - 1) * (i === 0 ? 1.05 : Math.max(0.55, 1 - i / (snake.length * 1.6)));
      ctx.beginPath();
      ctx.arc(s.x * C + C / 2, s.y * C + C / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#4ade80" : (Math.floor(i / 2) % 2 ? "#065f46" : "#22c55e");
      ctx.fill();
    }
    var hx = snake[0].x * C + C / 2, hy = snake[0].y * C + C / 2, px = -dir.y, py = dir.x;
    ctx.fillStyle = "#fefce8";
    [-1, 1].forEach(function (sd) {
      ctx.beginPath(); ctx.arc(hx + dir.x * 3 + px * 5 * sd, hy + dir.y * 3 + py * 5 * sd, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "#050505";
    [-1, 1].forEach(function (sd) {
      ctx.beginPath(); ctx.arc(hx + dir.x * 4 + px * 5 * sd, hy + dir.y * 4 + py * 5 * sd, 1.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx + dir.x * 9, hy + dir.y * 9); ctx.lineTo(hx + dir.x * 15, hy + dir.y * 15); ctx.stroke();
  }

  function begin() {
    var id = ++runId;
    var last = performance.now();
    requestAnimationFrame(function f(t) {
      if (id !== runId || !running) return;
      acc += Math.min(100, t - last);
      last = t;
      while (acc >= tickMs && running) { acc -= tickMs; step(); }
      if (running) { draw(); requestAnimationFrame(f); }
    });
  }

  GameUI.onStart = function () { reset(); running = true; begin(); };
  GameUI.onPause = function () { running = false; runId++; };
  GameUI.onResume = function () { running = true; begin(); };

  document.addEventListener("keydown", function (e) {
    if (!running || GameUI.typing()) return;
    var k = e.key.toLowerCase();
    var map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    if (map[k]) { e.preventDefault(); turn(map[k][0], map[k][1]); }
  });

  document.querySelectorAll("[data-dir]").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[b.getAttribute("data-dir")];
      if (running) turn(m[0], m[1]);
    });
  });

  // Swipe turns the moment the finger has moved a short way, and keeps working in one long drag.
  var sx = null, sy = null;
  cv.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
  cv.addEventListener("pointermove", function (e) {
    if (sx == null || !running) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
    sx = e.clientX; sy = e.clientY;
  });
  function endSwipe() { sx = null; }
  cv.addEventListener("pointerup", endSwipe);
  cv.addEventListener("pointercancel", endSwipe);

  window.SnakeState = {
    N: N, render3d: false,
    snake: function () { return snake; },
    food: function () { return food; },
    dir: function () { return dir; }
  };
  var wrap = document.querySelector(".canvas-wrap");
  if (wrap) {
    var c3 = document.createElement("canvas");
    c3.id = "game3d";
    c3.className = "brick3d";
    wrap.insertBefore(c3, document.getElementById("overlay"));
    var ms = document.createElement("script");
    ms.type = "module";
    ms.src = "games/snake3d.js";
    document.body.appendChild(ms);
  }

  reset();
  draw();
})();
