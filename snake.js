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
    tickMs = 130;
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
    if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N ||
        snake.some(function (s) { return s.x === h.x && s.y === h.y; })) {
      end();
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score += 10;
      GameUI.setScore(score);
      tickMs = Math.max(60, tickMs - 3);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "rgba(139,92,246,.08)";
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
    snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? "#c4b5fd" : "#8b5cf6";
      ctx.fillRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2);
    });
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

  var sx, sy;
  cv.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
  cv.addEventListener("pointerup", function (e) {
    if (sx == null || !running) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
  });

  reset();
  draw();
})();
