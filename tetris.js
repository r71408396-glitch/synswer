(function () {
  var cv = document.getElementById("game"), ctx = cv.getContext("2d");
  var COLS = 10, ROWS = 20, C = cv.width / COLS;
  var SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]]
  };
  var NAMES = Object.keys(SHAPES);
  var COLORS = { I: "#60a5fa", O: "#c4b5fd", T: "#c084fc", S: "#8b5cf6", Z: "#e879f9", J: "#3b82f6", L: "#a78bfa" };
  var board, cur, score, lines, level, acc, running = false, runId = 0;

  function emptyBoard() {
    var b = [];
    for (var y = 0; y < ROWS; y++) b.push(new Array(COLS).fill(null));
    return b;
  }

  function collide(m, ox, oy) {
    for (var y = 0; y < m.length; y++) {
      for (var x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        var bx = ox + x, by = oy + y;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function rotate(m) { return m[0].map(function (_, i) { return m.map(function (r) { return r[i]; }).reverse(); }); }

  function spawn() {
    var t = NAMES[Math.floor(Math.random() * NAMES.length)];
    var m = SHAPES[t].map(function (r) { return r.slice(); });
    cur = { t: t, m: m, x: Math.floor((COLS - m[0].length) / 2), y: 0 };
    if (collide(cur.m, cur.x, cur.y)) { end(); }
  }

  function setScore(n) { score = n; GameUI.setScore(n); }

  function lock() {
    cur.m.forEach(function (row, y) {
      row.forEach(function (v, x) {
        if (v && cur.y + y >= 0) board[cur.y + y][cur.x + x] = COLORS[cur.t];
      });
    });
    var cleared = 0;
    for (var y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(function (c) { return c; })) {
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      lines += cleared;
      level = 1 + Math.floor(lines / 10);
      document.getElementById("level").textContent = level;
      setScore(score + [0, 100, 300, 500, 800][cleared] * level);
    }
    spawn();
  }

  function move(dx) { if (running && !collide(cur.m, cur.x + dx, cur.y)) cur.x += dx; }

  function rot() {
    if (!running) return;
    var m = rotate(cur.m);
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i++) {
      if (!collide(m, cur.x + kicks[i], cur.y)) { cur.m = m; cur.x += kicks[i]; return; }
    }
  }

  function softDrop() {
    if (!running) return;
    if (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; setScore(score + 1); acc = 0; }
    else { lock(); acc = 0; }
  }

  function hardDrop() {
    if (!running) return;
    var n = 0;
    while (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; }
    setScore(score + n * 2);
    lock();
    acc = 0;
  }

  function gravity() {
    if (!collide(cur.m, cur.x, cur.y + 1)) cur.y++; else lock();
  }

  function interval() { return Math.max(80, 800 - (level - 1) * 70); }

  function end() {
    running = false;
    draw();
    GameUI.over(score);
  }

  function cell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillRect(x * C + 1, y * C + 1, C - 2, 4);
  }

  function draw() {
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "rgba(139,92,246,.07)";
    for (var i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * C, 0); ctx.lineTo(i * C, cv.height); ctx.stroke(); }
    for (var j = 1; j < ROWS; j++) { ctx.beginPath(); ctx.moveTo(0, j * C); ctx.lineTo(cv.width, j * C); ctx.stroke(); }
    board.forEach(function (row, y) { row.forEach(function (c, x) { if (c) cell(x, y, c); }); });
    if (cur && running) {
      var gy = cur.y;
      while (!collide(cur.m, cur.x, gy + 1)) gy++;
      ctx.globalAlpha = 0.2;
      cur.m.forEach(function (row, y) { row.forEach(function (v, x) { if (v) cell(cur.x + x, gy + y, COLORS[cur.t]); }); });
      ctx.globalAlpha = 1;
      cur.m.forEach(function (row, y) { row.forEach(function (v, x) { if (v) cell(cur.x + x, cur.y + y, COLORS[cur.t]); }); });
    }
  }

  function reset() {
    board = emptyBoard();
    lines = 0; level = 1; acc = 0; score = 0;
    document.getElementById("level").textContent = 1;
    GameUI.setScore(0);
    cur = null;
  }

  function begin() {
    var id = ++runId;
    var last = performance.now();
    requestAnimationFrame(function f(t) {
      if (id !== runId || !running) return;
      acc += Math.min(100, t - last);
      last = t;
      if (acc >= interval()) { acc = 0; gravity(); }
      if (running) { draw(); requestAnimationFrame(f); }
    });
  }

  GameUI.onStart = function () { reset(); running = true; spawn(); if (running) begin(); };
  GameUI.onPause = function () { running = false; runId++; };
  GameUI.onResume = function () { running = true; begin(); };

  document.addEventListener("keydown", function (e) {
    if (!running || GameUI.typing()) return;
    var k = e.key;
    if (k === "ArrowLeft" || k === "a") { e.preventDefault(); move(-1); }
    else if (k === "ArrowRight" || k === "d") { e.preventDefault(); move(1); }
    else if (k === "ArrowUp" || k === "w") { e.preventDefault(); rot(); }
    else if (k === "ArrowDown" || k === "s") { e.preventDefault(); softDrop(); }
    else if (k === " ") { e.preventDefault(); hardDrop(); }
  });

  function act(a) {
    if (a === "left") move(-1);
    else if (a === "right") move(1);
    else if (a === "rotate") rot();
    else if (a === "down") softDrop();
    else if (a === "drop") hardDrop();
  }

  // Pad buttons: left, right and down repeat while held.
  document.querySelectorAll("[data-act]").forEach(function (b) {
    var a = b.getAttribute("data-act"), t1 = null, t2 = null;
    function stop() { clearTimeout(t1); clearInterval(t2); }
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      act(a);
      if (a === "left" || a === "right" || a === "down") {
        stop();
        t1 = setTimeout(function () { t2 = setInterval(function () { act(a); }, 80); }, 250);
      }
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, stop); });
  });

  // Gestures on the board: swipe to move, tap to rotate, flick down to drop.
  var g = null;
  cv.addEventListener("pointerdown", function (e) {
    if (!running) return;
    g = { x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY, t: Date.now(), moved: false };
  });
  cv.addEventListener("pointermove", function (e) {
    if (!g || !running) return;
    var cell = cv.getBoundingClientRect().width / COLS;
    while (e.clientX - g.ax >= cell) { move(1); g.ax += cell; g.moved = true; }
    while (g.ax - e.clientX >= cell) { move(-1); g.ax -= cell; g.moved = true; }
    while (e.clientY - g.ay >= cell * 1.5) { softDrop(); g.ay += cell * 1.5; g.moved = true; }
  });
  function endGesture(e) {
    if (!g) return;
    var dt = Math.max(1, Date.now() - g.t), dy = e.clientY - g.y;
    if (!g.moved && dt < 300 && Math.abs(e.clientX - g.x) < 10 && Math.abs(dy) < 10) rot();
    else if (dy > 80 && dy / dt > 1.0) hardDrop();
    g = null;
  }
  cv.addEventListener("pointerup", endGesture);
  cv.addEventListener("pointercancel", function () { g = null; });

  reset();
  draw();
})();
