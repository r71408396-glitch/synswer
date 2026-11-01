(function () {
  var E = Eng, W = E.W, H = E.H, TOP = 40;
  var LV = [
    ["#######", "#P.C~E#", "#######"],
    ["########", "#P.C~..#", "#..C~.E#", "########"],
    ["#########", "#P......#", "#.C.#.###", "#...~~.E#", "#.C.#.###", "#.......#", "#########"]
  ];
  var li, g, crates, pr, pc, rows, cols, cs, ox, oy, moves, total, hist, sx, sy, t = 0, setLv, setMv;
  setLv = E.stat("Level", "1/3");
  setMv = E.stat("Moves", "0");

  function load(i) {
    var L = LV[i];
    rows = L.length; cols = L[0].length; g = []; crates = {};
    for (var r = 0; r < rows; r++) {
      g[r] = [];
      for (var c = 0; c < cols; c++) {
        var ch = L[r].charAt(c);
        if (ch === "P") { pr = r; pc = c; ch = "."; }
        if (ch === "C") { crates[r + "," + c] = 1; ch = "."; }
        g[r][c] = ch;
      }
    }
    cs = Math.floor(Math.min(W / cols, (H - TOP) / rows));
    ox = (W - cs * cols) / 2; oy = TOP + ((H - TOP) - cs * rows) / 2;
    moves = 0; hist = []; setMv(0);
  }
  function undo() {
    if (!hist.length) return;
    var s = JSON.parse(hist.pop());
    pr = s[0]; pc = s[1]; crates = s[2]; g = s[3];
    moves++; setMv(moves); E.snd("flip");
  }
  function win() {
    total += Math.max(10, 200 - moves * 4);
    E.score(total); E.snd("win");
    li++;
    if (li >= LV.length) { E.over(total); return; }
    load(li); setLv((li + 1) + "/" + LV.length);
  }
  function mv(dr, dc) {
    var r = pr + dr, c = pc + dc, k = r + "," + c;
    if (g[r][c] === "#" || g[r][c] === "~") return;
    var snap = JSON.stringify([pr, pc, crates, g]);
    if (crates[k]) {
      var br = r + dr, bc = c + dc, bt = g[br][bc];
      if (bt === "#" || bt === "E" || crates[br + "," + bc]) return;
      delete crates[k];
      if (bt === "~") { g[br][bc] = "."; E.snd("good"); } else { crates[br + "," + bc] = 1; E.snd("tap"); }
    } else E.snd("move");
    hist.push(snap);
    pr = r; pc = c; moves++; setMv(moves);
    if (g[pr][pc] === "E") win();
  }
  function dirFrom(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) mv(0, dx > 0 ? 1 : -1); else mv(dy > 0 ? 1 : -1, 0);
  }

  E.game({
    reset: function () { li = 0; total = 0; load(0); setLv("1/" + LV.length); E.score(0); },
    update: function (dt) { t += dt; },
    down: function (x, y) {
      if (y < TOP) { sx = null; if (x > W - 90) undo(); return; }
      sx = x; sy = y;
    },
    up: function (x, y) {
      if (sx == null) return;
      var dx = x - sx, dy = y - sy;
      sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
        dx = x - (ox + (pc + 0.5) * cs); dy = y - (oy + (pr + 0.5) * cs);
      }
      dirFrom(dx, dy);
    },
    key: function (k, down) {
      if (!down) return;
      var m = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
      if (m) mv(m[0], m[1]); else if (k === "z" || k === "r") undo();
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      E.text(c, "Fill the lava with crates, reach the exit", 150, 20, 13, "#c4b5fd");
      c.fillStyle = "#2a2a4a"; E.rr(c, W - 84, 6, 76, 28, 8); c.fill();
      E.text(c, "Undo (Z)", W - 46, 20, 13, "#fff");
      if (!g) return;
      for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
        var x = ox + q * cs, y = oy + r * cs, ch = g[r][q];
        if (ch === "#") { c.fillStyle = "#3b3b5c"; c.fillRect(x, y, cs, cs); c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x, y, cs, 4); continue; }
        c.fillStyle = "#171726"; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        if (ch === "~") {
          c.fillStyle = "#b91c1c"; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          c.fillStyle = "#f97316";
          c.beginPath(); c.arc(x + cs * (0.3 + 0.1 * Math.sin(t * 3 + q)), y + cs * 0.4, cs * 0.12, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(x + cs * 0.7, y + cs * (0.6 + 0.08 * Math.sin(t * 4 + r)), cs * 0.1, 0, Math.PI * 2); c.fill();
        } else if (ch === "E") {
          c.fillStyle = "#14532d"; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          E.text(c, "EXIT", x + cs / 2, y + cs / 2, Math.max(10, cs * 0.26), "#86efac");
        }
      }
      for (var k in crates) {
        var p = k.split(","), cx = ox + p[1] * cs, cy = oy + p[0] * cs;
        c.fillStyle = "#a16207"; E.rr(c, cx + 4, cy + 4, cs - 8, cs - 8, 6); c.fill();
        c.strokeStyle = "#fde68a"; c.lineWidth = 2; c.stroke();
        c.beginPath(); c.moveTo(cx + 8, cy + 8); c.lineTo(cx + cs - 8, cy + cs - 8); c.moveTo(cx + cs - 8, cy + 8); c.lineTo(cx + 8, cy + cs - 8); c.stroke();
      }
      c.beginPath(); c.arc(ox + (pc + 0.5) * cs, oy + (pr + 0.5) * cs, cs * 0.32, 0, Math.PI * 2);
      c.fillStyle = "#3b82f6"; c.fill(); c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
    }
  });
})();
