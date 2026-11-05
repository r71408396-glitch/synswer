(function () {
  var E = Eng, W = E.W, H = E.H, LIMIT = 12, PX = 200, PY = 310, ARM = 135;
  var L, R, cur, next, t, tmax, score, ang, msg, flash;

  function mk() { return { n: E.ri(1, Math.min(14, 4 + Math.floor(score / 4))), s: E.ri(0, 3) }; }
  function sum(a) { return a.reduce(function (x, y) { return x + y.n; }, 0); }
  function shape(c, s, x, y, r, col, n, fs) {
    c.fillStyle = col; c.beginPath();
    if (s === 0) c.arc(x, y, r, 0, Math.PI * 2);
    else if (s === 1) c.rect(x - r, y - r, r * 2, r * 2);
    else if (s === 2) { c.moveTo(x, y - r); c.lineTo(x + r, y + r); c.lineTo(x - r, y + r); c.closePath(); }
    else { c.moveTo(x, y - r * 1.15); c.lineTo(x + r * 1.15, y); c.lineTo(x, y + r * 1.15); c.lineTo(x - r * 1.15, y); c.closePath(); }
    c.fill();
    E.text(c, String(n), x, y + (s === 2 ? r * 0.25 : 0), fs, "#fff");
  }
  function place(side) {
    (side ? R : L).push(cur);
    score++;
    if (sum(L) === sum(R)) { score += 3; E.snd("win"); } else E.snd("tap");
    E.score(score);
    cur = next; next = mk(); tmax = Math.max(1.6, 3.5 - score * 0.04); t = tmax;
    if (Math.abs(sum(L) - sum(R)) > LIMIT) { E.snd("hurt"); msg = "Tipped over!"; E.over(score); }
  }

  E.game({
    reset: function () { L = []; R = []; score = 0; cur = mk(); next = mk(); tmax = 3.5; t = tmax; ang = 0; msg = ""; E.score(0); },
    update: function (dt) {
      var d = sum(R) - sum(L);
      ang += (E.clamp(d * 0.03, -0.4, 0.4) - ang) * Math.min(1, dt * 6);
      t -= dt;
      if (t <= 0) place(sum(L) > sum(R) ? 0 : 1);
    },
    down: function (x) { place(x < W / 2 ? 0 : 1); },
    key: function (k, down) {
      if (!down) return;
      if (k === "arrowleft" || k === "a") place(0); else if (k === "arrowright" || k === "d") place(1);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      if (!L) return;
      var sl = sum(L), sr = sum(R), diff = Math.abs(sl - sr);
      c.fillStyle = "#171726"; c.fillRect(20, 14, W - 40, 10);
      c.fillStyle = diff > 8 ? "#ef4444" : diff > 4 ? "#f97316" : "#22c55e";
      c.fillRect(20, 14, (W - 40) * Math.min(1, diff / LIMIT), 10);
      E.text(c, "Imbalance " + diff + " / " + LIMIT, W / 2, 40, 13, "#99f6e4");
      if (cur) {
        shape(c, cur.s, W / 2, 86, 26, E.PAL[cur.n % 8], cur.n, 24);
        c.fillStyle = "#171726"; c.fillRect(W / 2 - 40, 122, 80, 6);
        c.fillStyle = "#14e0cc"; c.fillRect(W / 2 - 40, 122, 80 * Math.max(0, t / tmax), 6);
        E.text(c, "next", W / 2 + 70, 74, 12, "#8383a3");
        shape(c, next.s, W / 2 + 70, 98, 14, E.PAL[next.n % 8], next.n, 14);
      }
      var ca = Math.cos(ang) * ARM, sa = Math.sin(ang) * ARM;
      var lx = PX - ca, ly = PY - sa, rx = PX + ca, ry = PY + sa;
      c.fillStyle = "#3b3b5c"; c.beginPath(); c.moveTo(PX, PY); c.lineTo(PX - 30, PY + 90); c.lineTo(PX + 30, PY + 90); c.closePath(); c.fill();
      c.strokeStyle = "#99f6e4"; c.lineWidth = 6; c.lineCap = "round";
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(rx, ry); c.stroke();
      [[lx, ly, L], [rx, ry, R]].forEach(function (p) {
        c.strokeStyle = "#64647e"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] + 48); c.stroke();
        c.fillStyle = "#475569"; c.fillRect(p[0] - 50, p[1] + 48, 100, 6);
        p[2].slice(-12).forEach(function (it, i) {
          shape(c, it.s, p[0] - 36 + (i % 4) * 24, p[1] + 36 - Math.floor(i / 4) * 24, 10, E.PAL[it.n % 8], it.n, 11);
        });
        E.text(c, String(sum(p[2])), p[0], p[1] + 68, 14, "#99f6e4");
      });
      c.fillStyle = "#14e0cc"; c.beginPath(); c.arc(PX, PY, 8, 0, Math.PI * 2); c.fill();
      E.text(c, "Tap left or right side (or A and D) to place the shape", W / 2, H - 20, 13, "#8383a3");
    }
  });
})();
