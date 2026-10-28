(function () {
  var E = Eng, W = E.W, H = E.H, PR = 20, OR = 48, CAP = 78;
  var planets, debris, ship, cam, score, time;

  function addPlanet() {
    var l = planets[planets.length - 1];
    var p = { x: E.rnd(70, W - 70), y: l.y - E.rnd(140, 200) };
    planets.push(p);
    if (Math.random() < 0.7) {
      var t = E.rnd(0.35, 0.65);
      debris.push({ bx: l.x + (p.x - l.x) * t + E.rnd(-20, 20), y: l.y + (p.y - l.y) * t, ph: E.rnd(0, 6), x: 0 });
    }
  }
  function heading() { return ship.fly ? Math.atan2(ship.vy, ship.vx) : Math.atan2(ship.dir * Math.cos(ship.a), -ship.dir * Math.sin(ship.a)); }
  function release() {
    if (ship.fly) return;
    var h = heading();
    ship.vx = Math.cos(h) * 270;
    ship.vy = Math.sin(h) * 270;
    ship.fly = true;
    E.snd("swoosh");
  }
  function die() { E.snd("hurt"); E.over(score); }

  E.game({
    reset: function () {
      planets = [{ x: W / 2, y: H - 160, v: true }];
      debris = [];
      time = 0; score = 0;
      for (var i = 0; i < 6; i++) addPlanet();
      ship = { p: planets[0], a: -Math.PI / 2, dir: 1, fly: false, x: 0, y: 0, vx: 0, vy: 0 };
      ship.x = planets[0].x; ship.y = planets[0].y - OR;
      cam = planets[0].y - H * 0.65;
      E.score(0);
    },
    update: function (dt) {
      time += dt;
      if (!ship.fly) {
        ship.a += ship.dir * 2.7 * dt;
        ship.x = ship.p.x + Math.cos(ship.a) * OR;
        ship.y = ship.p.y + Math.sin(ship.a) * OR;
      } else {
        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;
        for (var i = 0; i < planets.length; i++) {
          var p = planets[i];
          if (p === ship.p) continue;
          var dx = ship.x - p.x, dy = ship.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < CAP) {
            ship.dir = (dx * ship.vy - dy * ship.vx) > 0 ? 1 : -1;
            ship.a = Math.atan2(dy, dx);
            ship.p = p;
            ship.fly = false;
            if (!p.v) { p.v = true; score++; E.score(score); E.snd("good"); } else E.snd("tap");
            break;
          }
        }
      }
      debris.forEach(function (d) { d.x = d.bx + Math.sin(time * 1.5 + d.ph) * 40; });
      for (var j = 0; j < debris.length; j++) {
        var ddx = ship.x - debris[j].x, ddy = ship.y - debris[j].y;
        if (ddx * ddx + ddy * ddy < 18 * 18) { die(); return; }
      }
      cam += (ship.p.y - H * 0.65 - cam) * Math.min(1, dt * 3);
      if (ship.y - cam > H + 30 || ship.x < -40 || ship.x > W + 40) { die(); return; }
      while (planets[planets.length - 1].y > cam - 250) addPlanet();
      planets = planets.filter(function (p) { return p.y < cam + H + 300 || p === ship.p; });
      debris = debris.filter(function (d) { return d.y < cam + H + 300; });
    },
    down: function () { release(); },
    key: function (k, down) { if (down && (k === " " || k === "arrowup" || k === "w")) release(); },
    draw: function (c) {
      c.fillStyle = "#0a0a14";
      c.fillRect(0, 0, W, H);
      if (!ship) return;
      c.fillStyle = "rgba(167,139,250,.35)";
      for (var s = 0; s < 40; s++) {
        var sx = (s * 97) % W, sy = ((s * 211 - cam * 0.3) % H + H) % H;
        c.fillRect(sx, sy, 2, 2);
      }
      planets.forEach(function (p) {
        var y = p.y - cam;
        c.strokeStyle = "rgba(139,92,246,.2)";
        c.lineWidth = 1;
        c.beginPath(); c.arc(p.x, y, OR, 0, Math.PI * 2); c.stroke();
        c.beginPath();
        c.arc(p.x, y, PR, 0, Math.PI * 2);
        c.fillStyle = p.v ? "#22c55e" : "#8b5cf6";
        c.fill();
        c.strokeStyle = "rgba(255,255,255,.4)";
        c.lineWidth = 2;
        c.stroke();
      });
      debris.forEach(function (d) {
        c.beginPath();
        c.arc(d.x, d.y - cam, 9, 0, Math.PI * 2);
        c.fillStyle = "#ef4444";
        c.fill();
      });
      c.save();
      c.translate(ship.x, ship.y - cam);
      c.rotate(heading());
      c.fillStyle = "#60a5fa";
      c.beginPath(); c.moveTo(11, 0); c.lineTo(-8, 7); c.lineTo(-4, 0); c.lineTo(-8, -7); c.closePath(); c.fill();
      c.restore();
      E.text(c, String(score), W / 2, 36, 40, "rgba(255,255,255,.8)");
    }
  });
})();
