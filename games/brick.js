(function () {
  var E = Eng, W = E.W, H = E.H, BW = 50, BH = 22, PY = H - 40, PW = 84, LINE = H - 90, BR = 7;
  var bricks, px, ball, lives, score, speed, wait, keys, rowN, setLives;
  setLives = E.stat("Balls", "3");

  function addRow(y) {
    for (var c = 0; c < 8; c++) if (Math.random() > 0.15) bricks.push({ x: c * BW, y: y, color: E.PAL[rowN % 8] });
    rowN++;
  }
  function minY() { var m = 1e9; bricks.forEach(function (b) { if (b.y < m) m = b.y; }); return m; }
  function serve() { ball = { x: px, y: PY - 14, vx: 0, vy: 0, on: true }; wait = 0.8; }

  function step(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); E.snd("tick"); }
    if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); E.snd("tick"); }
    if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); E.snd("tick"); }
    if (ball.vy > 0 && ball.y + BR >= PY && ball.y < PY + 12 && Math.abs(ball.x - px) < PW / 2 + BR) {
      var off = E.clamp((ball.x - px) / (PW / 2), -1, 1), sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy), a = off * 1.1;
      ball.vx = Math.sin(a) * sp;
      ball.vy = -Math.cos(a) * sp;
      ball.y = PY - BR;
      E.snd("bounce");
    }
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (ball.x + BR > b.x && ball.x - BR < b.x + BW && ball.y + BR > b.y && ball.y - BR < b.y + BH) {
        var ox = Math.min(ball.x + BR - b.x, b.x + BW - (ball.x - BR)), oy = Math.min(ball.y + BR - b.y, b.y + BH - (ball.y - BR));
        if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
        bricks.splice(i, 1);
        score++;
        E.score(score);
        E.snd("good");
        var s = Math.min(520, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 3), cur = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 1;
        ball.vx *= s / cur; ball.vy *= s / cur;
        break;
      }
    }
  }

  E.game({
    reset: function () {
      bricks = []; rowN = 0; score = 0; lives = 3; speed = 7; keys = {}; px = W / 2;
      for (var r = 0; r < 5; r++) addRow(30 + r * (BH + 2));
      serve(); setLives(3); E.score(0);
    },
    update: function (dt) {
      if (keys.arrowleft || keys.a) px -= 380 * dt;
      if (keys.arrowright || keys.d) px += 380 * dt;
      px = E.clamp(px, PW / 2, W - PW / 2);
      speed = Math.min(22, speed + dt * 0.12);
      bricks.forEach(function (b) { b.y += speed * dt; });
      if (minY() > 4) addRow(minY() - BH - 2);
      for (var i = 0; i < bricks.length; i++) {
        if (bricks[i].y + BH > LINE) { E.snd("hurt"); E.over(score); return; }
      }
      if (ball.on) {
        ball.x = px;
        wait -= dt;
        if (wait <= 0) { ball.on = false; var a = E.rnd(-0.4, 0.4); ball.vx = Math.sin(a) * 340; ball.vy = -Math.cos(a) * 340; }
        return;
      }
      step(dt / 2); step(dt / 2);
      if (ball.y - BR > H) {
        lives--;
        setLives(lives);
        E.snd("hurt");
        if (lives <= 0) { E.over(score); return; }
        serve();
      }
    },
    down: function (x) { px = x; if (ball && ball.on) wait = 0; },
    move: function (x) { px = x; },
    key: function (k, down) { keys[k] = down; if (down && k === " " && ball && ball.on) wait = 0; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      if (!bricks) return;
      bricks.forEach(function (b) {
        c.fillStyle = b.color;
        c.fillRect(b.x + 1, b.y + 1, BW - 2, BH - 2);
        c.fillStyle = "rgba(255,255,255,.2)";
        c.fillRect(b.x + 1, b.y + 1, BW - 2, 4);
      });
      c.fillStyle = "#ef4444";
      c.fillRect(0, LINE, W, 2);
      c.fillStyle = "#8b5cf6";
      E.rr(c, px - PW / 2, PY, PW, 12, 6);
      c.fill();
      c.beginPath();
      c.arc(ball.x, ball.y, BR, 0, Math.PI * 2);
      c.fillStyle = "#dbeafe";
      c.fill();
    }
  });
})();
