(function () {
  var E = Eng, W = E.W, H = E.H, X1 = 20, X2 = W - 20, Y1 = 40, Y2 = H - 16, BR = 6, HR = 10, MAXS = 7;
  var LV = [
    { b: [60, 170], h: [420, 170], w: [], m: [], p: [] },
    { b: [60, 260], h: [420, 80], w: [[230, 40, 16, 170]], m: [], p: [] },
    { b: [60, 170], h: [420, 170], w: [], m: [[240, 170, 72, 2.2]], p: [] },
    { b: [60, 80], h: [420, 260], w: [[300, 130, 16, 170]], m: [[170, 170, 60, 1.8]], p: [[330, 70, 90, 50, 0, 1]] },
    { b: [50, 170], h: [430, 170], w: [[200, 40, 14, 80], [200, 220, 14, 80]], m: [[140, 170, 54, 2.4], [330, 170, 54, -2.8]], p: [[230, 140, 70, 60, 1, 0]] }
  ];
  var lv, bx, by, vx, vy, strokes, score, drag, ang, wait, msg, setStroke, setHole;
  setHole = E.stat("Hole", "1/5");
  setStroke = E.stat("Strokes", "0");

  function load(i) {
    lv = i; var L = LV[i];
    bx = L.b[0]; by = L.b[1]; vx = vy = 0; strokes = 0; drag = null; wait = 0; msg = "";
    setHole((i + 1) + "/" + LV.length); setStroke(0);
  }
  function still() { return Math.hypot(vx, vy) < 1; }
  function rectHit(r) {
    var nx = E.clamp(bx, r[0], r[0] + r[2]), ny = E.clamp(by, r[1], r[1] + r[3]), dx = bx - nx, dy = by - ny, d = Math.hypot(dx, dy);
    if (d >= BR) return;
    var nxv, nyv;
    if (d < 0.01) { nxv = bx < r[0] + r[2] / 2 ? -1 : 1; nyv = 0; bx += nxv * BR; }
    else { nxv = dx / d; nyv = dy / d; bx = nx + nxv * BR; by = ny + nyv * BR; }
    var dot = vx * nxv + vy * nyv;
    if (dot < 0) { vx -= 1.8 * dot * nxv; vy -= 1.8 * dot * nyv; E.snd("tick"); }
  }
  function finish(sc) {
    score += sc; E.score(score); wait = 1.1;
  }

  E.game({
    reset: function () { score = 0; ang = 0; E.score(0); load(0); },
    update: function (dt) {
      ang += dt;
      var L = LV[lv];
      if (wait > 0) {
        wait -= dt;
        if (wait <= 0) { if (lv + 1 >= LV.length) { E.snd("win"); E.over(score); } else load(lv + 1); }
        return;
      }
      var steps = 4, h = dt / steps;
      for (var s = 0; s < steps; s++) {
        bx += vx * h; by += vy * h;
        if (bx < X1 + BR) { bx = X1 + BR; vx = Math.abs(vx); }
        if (bx > X2 - BR) { bx = X2 - BR; vx = -Math.abs(vx); }
        if (by < Y1 + BR) { by = Y1 + BR; vy = Math.abs(vy); }
        if (by > Y2 - BR) { by = Y2 - BR; vy = -Math.abs(vy); }
        L.w.forEach(rectHit);
        L.m.forEach(function (m) {
          var a = ang * m[3], dx = Math.cos(a) * m[2], dy = Math.sin(a) * m[2];
          var ax = m[0] - dx, ay = m[1] - dy, ex = m[0] + dx, ey = m[1] + dy;
          var sx = ex - ax, sy = ey - ay, t = E.clamp(((bx - ax) * sx + (by - ay) * sy) / (sx * sx + sy * sy), 0, 1);
          var px = ax + sx * t, py = ay + sy * t, ddx = bx - px, ddy = by - py, d = Math.hypot(ddx, ddy);
          if (d < BR + 3) {
            var nx = d ? ddx / d : 1, ny = d ? ddy / d : 0;
            bx = px + nx * (BR + 3); by = py + ny * (BR + 3);
            var tvx = -Math.sin(a) * m[2] * m[3] * t * 0.9 * 2 - 0, kick = 60 * Math.sign(m[3]);
            var dot = vx * nx + vy * ny;
            if (dot < 0) { vx -= 1.8 * dot * nx; vy -= 1.8 * dot * ny; }
            vx += nx * Math.abs(kick); vy += ny * Math.abs(kick); E.snd("bounce");
          }
        });
        L.p.forEach(function (p) {
          if (bx > p[0] && bx < p[0] + p[2] && by > p[1] && by < p[1] + p[3]) { vx += p[4] * 520 * h; vy += p[5] * 520 * h; }
        });
      }
      var sp = Math.hypot(vx, vy);
      if (sp > 0) {
        var ns = Math.max(0, sp - 95 * dt);
        vx *= ns / sp; vy *= ns / sp;
        if (ns < 8 && !L.p.some(function (p) { return bx > p[0] && bx < p[0] + p[2] && by > p[1] && by < p[1] + p[3]; })) { vx = vy = 0; }
      }
      if (Math.hypot(bx - L.h[0], by - L.h[1]) < HR && sp < 300) {
        var pts = Math.max(10, 60 - (strokes - 1) * 10);
        msg = "In the hole! +" + pts; E.snd("win"); finish(pts); vx = vy = 0; bx = L.h[0]; by = L.h[1];
      } else if (still() && strokes >= MAXS) {
        msg = "Out of strokes"; E.snd("bad"); finish(0);
      }
    },
    down: function (x, y) { if (still() && !wait && Math.hypot(x - bx, y - by) < 46) drag = [x, y]; },
    move: function (x, y, pressed) { if (drag && pressed) drag = [x, y]; },
    up: function (x, y) {
      if (!drag) return;
      var dx = bx - x, dy = by - y, d = Math.hypot(dx, dy);
      drag = null;
      if (d < 10 || !still()) return;
      var power = Math.min(110, d) * 4.6;
      vx = dx / d * power; vy = dy / d * power; strokes++; setStroke(strokes); E.snd("swoosh");
    },
    draw: function (c) {
      c.fillStyle = "#0d1a12"; c.fillRect(0, 0, W, H);
      if (!LV[lv]) return;
      var L = LV[lv];
      c.fillStyle = "#15803d"; E.rr(c, X1, Y1, X2 - X1, Y2 - Y1, 10); c.fill();
      c.strokeStyle = "#a16207"; c.lineWidth = 5; c.stroke();
      L.p.forEach(function (p) {
        c.fillStyle = "#facc15"; c.globalAlpha = 0.45; c.fillRect(p[0], p[1], p[2], p[3]); c.globalAlpha = 1;
        c.strokeStyle = "#fde68a"; c.lineWidth = 3;
        var cxp = p[0] + p[2] / 2, cyp = p[1] + p[3] / 2;
        c.beginPath(); c.moveTo(cxp - p[4] * 14 - p[5] * 0, cyp - p[5] * 14); c.lineTo(cxp + p[4] * 14, cyp + p[5] * 14); c.stroke();
        E.text(c, p[4] ? ">>" : "v", cxp + p[4] * 14, cyp + p[5] * 14, 18, "#fff");
      });
      L.w.forEach(function (w) { c.fillStyle = "#78350f"; c.fillRect(w[0], w[1], w[2], w[3]); c.fillStyle = "#b45309"; c.fillRect(w[0], w[1], w[2], 3); });
      L.m.forEach(function (m) {
        var a = ang * m[3], dx = Math.cos(a) * m[2], dy = Math.sin(a) * m[2];
        c.strokeStyle = "#e2e8f0"; c.lineWidth = 6; c.lineCap = "round";
        c.beginPath(); c.moveTo(m[0] - dx, m[1] - dy); c.lineTo(m[0] + dx, m[1] + dy); c.stroke();
        c.beginPath(); c.arc(m[0], m[1], 7, 0, Math.PI * 2); c.fillStyle = "#ef4444"; c.fill();
      });
      c.beginPath(); c.arc(L.h[0], L.h[1], HR, 0, Math.PI * 2); c.fillStyle = "#050505"; c.fill();
      c.fillStyle = "#fff"; c.fillRect(L.h[0], L.h[1] - 28, 2, 28); c.fillStyle = "#ef4444"; c.fillRect(L.h[0] + 2, L.h[1] - 28, 12, 8);
      if (drag) {
        var dx = bx - drag[0], dy = by - drag[1], d = Math.min(110, Math.hypot(dx, dy)), a2 = Math.atan2(dy, dx);
        c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 3; c.setLineDash([6, 6]);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a2) * d * 1.3, by + Math.sin(a2) * d * 1.3); c.stroke(); c.setLineDash([]);
      }
      c.beginPath(); c.arc(bx, by, BR, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill(); c.strokeStyle = "#94a3b8"; c.lineWidth = 1.5; c.stroke();
      E.text(c, msg || ("Score " + score + "   Pull back from the ball and release"), W / 2, 20, 13, msg ? "#86efac" : "#c4b5fd");
    }
  });
})();
