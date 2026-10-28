(function () {
  var E = Eng, W = E.W, H = E.H;
  var seq, idx, pos, phase, st, lit, flashT, score;
  var FREQ = [262, 330, 392, 523];
  var LABEL = { show: "Watch", input: "Your turn", wait: "Nice!" };

  function note(i) { if (window.Sound) Sound.note(FREQ[i], 0.35); }
  function press(p) {
    if (phase !== "input") return;
    lit = p; flashT = 0.25; note(p);
    if (p !== seq[pos]) { E.snd("bad"); E.over(score); return; }
    pos++;
    if (pos === seq.length) {
      score = seq.length;
      E.score(score);
      phase = "wait"; st = 0.9; pos = 0;
    }
  }
  function padAt(x, y) {
    if (y < 40) return -1;
    return (x < W / 2 ? 0 : 1) + (y - 40 < 200 ? 0 : 2);
  }

  E.game({
    reset: function () {
      seq = [E.ri(0, 3)]; idx = 0; pos = 0; phase = "show"; st = 0.8; lit = -1; flashT = 0; score = 0;
      E.score(0);
    },
    update: function (dt) {
      if (phase === "show") {
        st -= dt;
        if (st <= 0) {
          if (lit >= 0) { lit = -1; st = 0.2; if (idx >= seq.length) { phase = "input"; pos = 0; } }
          else { lit = seq[idx++]; note(lit); st = Math.max(0.28, 0.5 - seq.length * 0.01); }
        }
      } else if (phase === "wait") {
        st -= dt;
        if (st <= 0) { seq.push(E.ri(0, 3)); idx = 0; phase = "show"; st = 0.3; lit = -1; }
      }
      if (flashT > 0) { flashT -= dt; if (flashT <= 0 && phase !== "show") lit = -1; }
    },
    down: function (x, y) { var p = padAt(x, y); if (p >= 0) press(p); },
    key: function (k, down) { if (down && "1234".indexOf(k) >= 0 && k.length === 1) press(parseInt(k, 10) - 1); },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      E.text(c, (LABEL[phase] || "") + "  -  length " + (seq ? seq.length : 1), W / 2, 20, 18, "#c4b5fd");
      for (var i = 0; i < 4; i++) {
        var x = (i % 2) * 200 + 8, y = 40 + (i >> 1) * 200 + 8;
        E.rr(c, x, y, 184, 184, 22);
        c.fillStyle = E.PAL[i] + (lit === i ? "" : "55");
        c.fill();
        if (lit === i) { c.strokeStyle = "#fff"; c.lineWidth = 4; c.stroke(); }
        E.text(c, String(i + 1), x + 92, y + 92, 34, "rgba(255,255,255,.55)");
      }
    }
  });
})();
