(function () {
  var E = Eng, W = E.W, H = E.H, BW = 50, BH = 22, PY = H - 40, PW0 = 84, LINE = H - 90, BR = 7;
  var TYPES = {
    wide: { c: "#22c55e", l: "W", name: "Wide" },
    multi: { c: "#3b82f6", l: "M", name: "Multi" },
    slow: { c: "#06b6d4", l: "S", name: "Slow" },
    fire: { c: "#f97316", l: "F", name: "Fire" },
    life: { c: "#ef4444", l: "+", name: "Life" },
    freeze: { c: "#5eead4", l: "I", name: "Freeze" }
  };
  var KEYS = Object.keys(TYPES);
  var S = (window.BrickState = { W: W, H: H, BW: BW, BH: BH, PY: PY, LINE: LINE, BR: BR, TYPES: TYPES, bricks: [], balls: [], pups: [], px: W / 2, pw: PW0, eff: { wide: 0, slow: 0, fire: 0, freeze: 0 }, render3d: false });
  var lives, score, speed, wait, keys, rowN, setLives, setPower, lastPower = "";
  setLives = E.stat("Balls", "3");
  setPower = E.stat("Power", "-");

  // 3D layer: a WebGL canvas over the 2D one, drawn by games/brick3d.js
  var wrap = document.getElementById("wrap");
  if (wrap) {
    var c3 = document.createElement("canvas");
    c3.id = "brick3d";
    c3.className = "brick3d";
    wrap.insertBefore(c3, document.getElementById("overlay"));
    var ms = document.createElement("script");
    ms.type = "module";
    ms.src = "games/brick3d.js";
    document.body.appendChild(ms);
  }

  function addRow(y) {
    for (var c = 0; c < 8; c++) if (Math.random() > 0.15) S.bricks.push({ x: c * BW, y: y, color: E.PAL[rowN % 8] });
    rowN++;
  }
  function minY() { var m = 1e9; S.bricks.forEach(function (b) { if (b.y < m) m = b.y; }); return m; }
  function serve() { S.balls = [{ x: S.px, y: PY - 14, vx: 0, vy: 0, on: true }]; wait = 0.8; }
  function launch(b) { var a = E.rnd(-0.4, 0.4); b.on = false; b.vx = Math.sin(a) * 340; b.vy = -Math.cos(a) * 340; }

  function kill(i) {
    var k = S.bricks.splice(i, 1)[0];
    score++;
    E.score(score);
    E.snd("good");
    if (Math.random() < 0.17 && S.pups.length < 4) {
      S.pups.push({ x: k.x + BW / 2, y: k.y + BH / 2, t: KEYS[E.ri(0, KEYS.length - 1)] });
    }
  }

  function apply(t) {
    E.snd("win");
    if (t === "wide") S.eff.wide = 12;
    else if (t === "slow") S.eff.slow = 8;
    else if (t === "fire") S.eff.fire = 6;
    else if (t === "freeze") S.eff.freeze = 5;
    else if (t === "life") { if (lives < 5) { lives++; setLives(lives); } }
    else if (t === "multi") {
      var src = null;
      S.balls.forEach(function (b) { if (!b.on && !src) src = b; });
      if (!src) { launch(S.balls[0]); wait = 0; src = S.balls[0]; }
      var sp = Math.sqrt(src.vx * src.vx + src.vy * src.vy) || 340, ang = Math.atan2(src.vy, src.vx);
      [-0.5, 0.5].forEach(function (d) {
        if (S.balls.length < 6) S.balls.push({ x: src.x, y: src.y, vx: Math.cos(ang + d) * sp, vy: Math.sin(ang + d) * sp, on: false });
      });
    }
  }

  function step(b, dt) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); E.snd("tick"); }
    if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx); E.snd("tick"); }
    if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy); E.snd("tick"); }
    if (b.vy > 0 && b.y + BR >= PY && b.y < PY + 12 && Math.abs(b.x - S.px) < S.pw / 2 + BR) {
      var off = E.clamp((b.x - S.px) / (S.pw / 2), -1, 1), sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), a = off * 1.1;
      b.vx = Math.sin(a) * sp;
      b.vy = -Math.cos(a) * sp;
      b.y = PY - BR;
      E.snd("bounce");
    }
    var fire = S.eff.fire > 0;
    for (var i = S.bricks.length - 1; i >= 0; i--) {
      var k = S.bricks[i];
      if (b.x + BR > k.x && b.x - BR < k.x + BW && b.y + BR > k.y && b.y - BR < k.y + BH) {
        if (fire) { kill(i); continue; }
        var ox = Math.min(b.x + BR - k.x, k.x + BW - (b.x - BR)), oy = Math.min(b.y + BR - k.y, k.y + BH - (b.y - BR));
        if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
        kill(i);
        var cur = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1, s = Math.min(520, cur + 3);
        b.vx *= s / cur; b.vy *= s / cur;
        break;
      }
    }
  }

  function powerText() {
    var p = [];
    ["wide", "slow", "fire", "freeze"].forEach(function (k) {
      if (S.eff[k] > 0) p.push(TYPES[k].name + " " + Math.ceil(S.eff[k]) + "s");
    });
    var t = p.length ? p.join(", ") : "-";
    if (t !== lastPower) { lastPower = t; setPower(t); }
  }

  E.game({
    reset: function () {
      S.bricks = []; S.pups = []; rowN = 0; score = 0; lives = 3; speed = 7; keys = {}; S.px = W / 2; S.pw = PW0;
      S.eff.wide = S.eff.slow = S.eff.fire = S.eff.freeze = 0;
      for (var r = 0; r < 5; r++) addRow(30 + r * (BH + 2));
      serve(); setLives(3); E.score(0); powerText();
    },
    update: function (dt) {
      var k;
      for (k in S.eff) if (S.eff[k] > 0) S.eff[k] = Math.max(0, S.eff[k] - dt);
      S.pw += ((S.eff.wide > 0 ? PW0 * 1.5 : PW0) - S.pw) * Math.min(1, dt * 10);
      powerText();
      if (keys.arrowleft || keys.a) S.px -= 380 * dt;
      if (keys.arrowright || keys.d) S.px += 380 * dt;
      S.px = E.clamp(S.px, S.pw / 2, W - S.pw / 2);
      if (S.eff.freeze <= 0) {
        speed = Math.min(22, speed + dt * 0.12);
        S.bricks.forEach(function (b) { b.y += speed * dt; });
      }
      if (S.bricks.length === 0 || minY() > 4) addRow((S.bricks.length ? minY() : 30) - BH - 2);
      for (var i = 0; i < S.bricks.length; i++) {
        if (S.bricks[i].y + BH > LINE) { E.snd("hurt"); E.over(score); return; }
      }
      for (var j = S.pups.length - 1; j >= 0; j--) {
        var p = S.pups[j];
        p.y += 130 * dt;
        if (p.y > PY - 8 && p.y < PY + 16 && Math.abs(p.x - S.px) < S.pw / 2 + 10) { S.pups.splice(j, 1); apply(p.t); }
        else if (p.y > H + 20) S.pups.splice(j, 1);
      }
      if (S.balls.length === 1 && S.balls[0].on) {
        S.balls[0].x = S.px;
        wait -= dt;
        if (wait <= 0) launch(S.balls[0]);
        return;
      }
      var f = S.eff.slow > 0 ? 0.65 : 1;
      S.balls.forEach(function (b) {
        if (b.on) { b.x = S.px; return; }
        step(b, dt * f / 2); step(b, dt * f / 2);
      });
      S.balls = S.balls.filter(function (b) { return b.y - BR <= H; });
      if (!S.balls.length) {
        lives--;
        setLives(lives);
        E.snd("hurt");
        if (lives <= 0) { E.over(score); return; }
        serve();
      }
    },
    down: function (x) { S.px = x; var b = S.balls[0]; if (b && b.on) wait = 0; },
    move: function (x) { S.px = x; },
    key: function (k, down) { keys[k] = down; var b = S.balls[0]; if (down && k === " " && b && b.on) wait = 0; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      if (S.render3d) return;
      S.bricks.forEach(function (b) {
        c.fillStyle = b.color;
        c.fillRect(b.x + 1, b.y + 1, BW - 2, BH - 2);
        c.fillStyle = "rgba(255,255,255,.2)";
        c.fillRect(b.x + 1, b.y + 1, BW - 2, 4);
      });
      c.fillStyle = "#ef4444";
      c.fillRect(0, LINE, W, 2);
      c.fillStyle = "#14e0cc";
      E.rr(c, S.px - S.pw / 2, PY, S.pw, 12, 6);
      c.fill();
      S.pups.forEach(function (p) {
        c.beginPath(); c.arc(p.x, p.y, 10, 0, Math.PI * 2); c.fillStyle = TYPES[p.t].c; c.fill();
        E.text(c, TYPES[p.t].l, p.x, p.y, 12, "#fff");
      });
      S.balls.forEach(function (b) {
        c.beginPath();
        c.arc(b.x, b.y, BR, 0, Math.PI * 2);
        c.fillStyle = S.eff.fire > 0 ? "#fb923c" : "#dbeafe";
        c.fill();
      });
    }
  });
})();
