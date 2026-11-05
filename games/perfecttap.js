(function () {
  var E = Eng, pos, dir, speed, streak, zone, flash, msg;
  var L = 30, R = E.W - 30, cx = E.W / 2;

  function tap() {
    if (Math.abs(pos - cx) <= zone) {
      streak++;
      E.score(streak);
      E.snd("good");
      speed *= 1.07;
      zone = Math.max(8, zone - 0.8);
      flash = 0.25;
      msg = Math.abs(pos - cx) < 5 ? "Perfect!" : "Good";
    } else {
      E.snd("bad");
      E.over(streak);
    }
  }

  E.game({
    reset: function () { pos = L; dir = 1; speed = 170; streak = 0; zone = 20; flash = 0; msg = ""; E.score(0); },
    update: function (dt) {
      pos += dir * speed * dt;
      if (pos > R) { pos = R; dir = -1; }
      if (pos < L) { pos = L; dir = 1; }
      if (flash > 0) flash -= dt;
    },
    down: function () { tap(); },
    key: function (k, down) { if (down && k === " ") tap(); },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      var y = E.H / 2;
      c.fillStyle = "#11574f";
      c.fillRect(L, y - 3, R - L, 6);
      c.fillStyle = flash > 0 ? "rgba(34,197,94,.45)" : "rgba(20,224,204,.35)";
      c.fillRect(cx - zone, y - 40, zone * 2, 80);
      c.fillStyle = "#99f6e4";
      c.fillRect(cx - 1.5, y - 50, 3, 100);
      c.beginPath();
      c.arc(pos, y, 14, 0, Math.PI * 2);
      c.fillStyle = "#3b82f6";
      c.fill();
      c.strokeStyle = "#dbeafe";
      c.lineWidth = 3;
      c.stroke();
      E.text(c, String(streak), cx, 60, 48, "#fff");
      E.text(c, flash > 0 ? msg : "Tap or press space", cx, E.H - 50, 18, flash > 0 ? "#86efac" : "#8383a3");
    }
  });
})();
