(function () {
  var E = Eng, cx = E.W / 2, cy = E.H / 2, SR = 56, HALF = 0.6;
  var ang, shots, spawnT, lives, score, elapsed, keys, hurt, setLives;
  setLives = E.stat("Lives", "3");

  function diff(a, b) {
    var d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? Math.PI * 2 - d : d;
  }
  function aim(x, y) { ang = Math.atan2(y - cy, x - cx); }

  E.game({
    reset: function () { ang = -Math.PI / 2; shots = []; spawnT = 0.8; lives = 3; score = 0; elapsed = 0; keys = {}; hurt = 0; setLives(3); E.score(0); },
    update: function (dt) {
      elapsed += dt;
      if (keys.arrowleft || keys.a) ang -= 3.6 * dt;
      if (keys.arrowright || keys.d) ang += 3.6 * dt;
      if (hurt > 0) hurt -= dt;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.35, 1.0 - elapsed * 0.012);
        shots.push({ a: E.rnd(0, Math.PI * 2), r: 230, v: 90 + Math.min(120, elapsed * 2.5) + E.rnd(0, 30) });
      }
      for (var i = 0; i < shots.length; i++) {
        var s = shots[i];
        s.r -= s.v * dt;
        if (s.r <= SR + 4 && s.r > 20 && diff(s.a, ang) <= HALF) {
          shots.splice(i--, 1);
          score++;
          E.score(score);
          E.snd("bounce");
        } else if (s.r <= 20) {
          shots.splice(i--, 1);
          lives--;
          hurt = 0.3;
          setLives(lives);
          E.snd("hurt");
          if (lives <= 0) { E.over(score); return; }
        }
      }
    },
    down: function (x, y) { aim(x, y); },
    move: function (x, y) { aim(x, y); },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      c.strokeStyle = "rgba(20,224,204,.15)";
      c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, SR, 0, Math.PI * 2); c.stroke();
      shots.forEach(function (s) {
        c.beginPath();
        c.arc(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r, 7, 0, Math.PI * 2);
        c.fillStyle = "#f87171";
        c.fill();
      });
      c.beginPath();
      c.arc(cx, cy, 18, 0, Math.PI * 2);
      c.fillStyle = hurt > 0 ? "#ef4444" : "#3b82f6";
      c.fill();
      c.strokeStyle = "#dbeafe";
      c.lineWidth = 2;
      c.stroke();
      c.beginPath();
      c.arc(cx, cy, SR, ang - HALF, ang + HALF);
      c.strokeStyle = "#5eead4";
      c.lineWidth = 9;
      c.lineCap = "round";
      c.stroke();
      E.text(c, String(score), cx, 34, 30, "rgba(255,255,255,.8)");
    }
  });
})();
