(function () {
  var E = Eng, W = E.W, H = E.H, BR = 10, TH = 14, SP = 120, GW = 0.18, RW = 0.14;
  var floors, by, bvy, rot, cam, score, floorsDown, combo, lx, keys, setCombo;
  setCombo = E.stat("Combo", "0");

  function addFloor() {
    var i = floors.length, g = Math.random();
    floors.push({ y: 260 + i * SP, g: g, r: (g + GW + E.rnd(0.08, 0.5)) % 1, passed: false, smash: false });
  }
  function kind(f) {
    var t = (((0.5 - rot) % 1) + 1) % 1;
    if ((t - f.g + 1) % 1 < GW) return "gap";
    if ((t - f.r + 1) % 1 < RW) return "red";
    return "solid";
  }
  function seg(c, start, width, y, color) {
    var x = ((((start + rot) % 1) + 1) % 1) * W, w = width * W;
    c.fillStyle = color;
    c.fillRect(x, y, w, TH);
    if (x + w > W) c.fillRect(x - W, y, w, TH);
  }

  E.game({
    reset: function () {
      floors = []; for (var i = 0; i < 8; i++) addFloor();
      by = 100; bvy = 0; rot = 0; cam = 0; score = 0; floorsDown = 0; combo = 0; keys = {}; lx = null;
      E.score(0); setCombo(0);
    },
    update: function (dt) {
      if (keys.arrowleft || keys.a) rot += 0.5 * dt;
      if (keys.arrowright || keys.d) rot -= 0.5 * dt;
      var prev = by;
      bvy = Math.min(720, bvy + 1500 * dt);
      by += bvy * dt;
      for (var i = 0; i < floors.length; i++) {
        var f = floors[i];
        if (f.passed) continue;
        if (bvy > 0 && prev + BR <= f.y && by + BR >= f.y && !f.smash) {
          var k = kind(f);
          if (k === "solid") { by = f.y - BR; bvy = -540; combo = 0; setCombo(0); E.snd("bounce"); }
          else if (k === "red") {
            if (combo >= 3) { f.smash = true; E.snd("boom"); }
            else { E.snd("hurt"); E.over(score); return; }
          }
        }
        if (by > f.y + TH + BR) {
          f.passed = true;
          floorsDown++; combo++;
          score += combo;
          E.score(score); setCombo(combo);
          E.snd(combo >= 3 ? "good" : "tick");
        }
      }
      cam += (by - 180 - cam) * Math.min(1, dt * 8);
      while (floors[floors.length - 1].y < cam + H + 200) addFloor();
      floors = floors.filter(function (f) { return f.y > cam - 120; });
    },
    down: function (x) { lx = x; },
    move: function (x, y, pressed) {
      if (!pressed || lx == null) return;
      rot += (x - lx) / W;
      lx = x;
    },
    up: function () { lx = null; },
    key: function (k, down) { keys[k] = down; },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      if (!floors) return;
      c.fillStyle = "#14142a";
      c.fillRect(W / 2 - 14, 0, 28, H);
      floors.forEach(function (f) {
        if (f.smash) return;
        var y = f.y - cam;
        if (y < -TH || y > H) return;
        seg(c, 0, 1, y, "#0e8f84");
        seg(c, f.g, GW, y, "#0d0d16");
        seg(c, f.r, RW, y, "#ef4444");
      });
      c.beginPath();
      c.arc(W / 2, by - cam, BR, 0, Math.PI * 2);
      c.fillStyle = combo >= 3 ? "#f97316" : "#3b82f6";
      c.fill();
      c.strokeStyle = "#dbeafe";
      c.lineWidth = 2;
      c.stroke();
    }
  });
})();
