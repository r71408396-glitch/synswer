(function () {
  var E = Eng, cw = E.W / 4, rh = 140, rows, speed, score;

  function addRow(y) { rows.push({ y: y, col: E.ri(0, 3), done: false }); }
  function target() {
    var t = null;
    rows.forEach(function (r) { if (!r.done && (!t || r.y > t.y)) t = r; });
    return t;
  }
  function hit(col) {
    var t = target();
    if (!t) return;
    if (t.col === col) {
      t.done = true;
      score++;
      speed += 4;
      E.score(score);
      E.snd("tap");
    } else {
      E.snd("bad");
      E.over(score);
    }
  }

  E.game({
    reset: function () {
      rows = [];
      score = 0;
      speed = 130;
      for (var i = 0; i < 5; i++) addRow(E.H - rh * (i + 1) - 10);
      E.score(0);
    },
    update: function (dt) {
      var top = rows[0];
      rows.forEach(function (r) { r.y += speed * dt; if (r.y < top.y) top = r; });
      while (top.y > -rh) { addRow(top.y - rh); top = rows[rows.length - 1]; }
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].y > E.H) {
          if (!rows[i].done) { E.snd("bad"); E.over(score); return; }
          rows.splice(i, 1);
          i--;
        }
      }
    },
    down: function (x) { hit(E.clamp(Math.floor(x / cw), 0, 3)); },
    key: function (k, down) {
      if (!down) return;
      var m = { d: 0, f: 1, j: 2, k: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      if (m[k] != null) hit(m[k]);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, E.W, E.H);
      var t = target();
      rows.forEach(function (r) {
        c.strokeStyle = "#1f1f33";
        c.lineWidth = 1;
        c.strokeRect(0, r.y, E.W, rh);
        c.fillStyle = r.done ? "#11574f" : r === t ? "#14e0cc" : "#4c1d95";
        c.fillRect(r.col * cw + 3, r.y + 3, cw - 6, rh - 6);
      });
      c.strokeStyle = "#1f1f33";
      for (var i = 1; i < 4; i++) { c.beginPath(); c.moveTo(i * cw, 0); c.lineTo(i * cw, E.H); c.stroke(); }
      E.text(c, String(score), E.W / 2, 40, 44, "rgba(255,255,255,.85)");
    }
  });
})();
