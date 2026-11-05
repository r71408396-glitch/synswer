(function () {
  var E = Eng, W = E.W, H = E.H, CS = 92, X0 = 16, Y0 = 60;
  var cards, sel, lock, combo, score, misses, setMiss;
  setMiss = E.stat("Misses", "0/6");

  function newBoard() {
    var v = [];
    for (var i = 0; i < 8; i++) v.push(i, i);
    E.shuffle(v);
    cards = v.map(function (n) { return { v: n, up: false, done: false }; });
    sel = []; lock = 0;
  }
  function at(x, y) {
    var c = Math.floor((x - X0) / CS), r = Math.floor((y - Y0) / CS);
    return c < 0 || r < 0 || c > 3 || r > 3 ? -1 : r * 4 + c;
  }

  E.game({
    reset: function () { newBoard(); combo = 0; score = 0; misses = 0; setMiss("0/6"); E.score(0); },
    update: function (dt) {
      if (lock > 0) {
        lock -= dt;
        if (lock <= 0) {
          sel.forEach(function (i) { cards[i].up = false; });
          sel = [];
          if (misses >= 6) { E.snd("bad"); E.over(score); }
        }
      }
    },
    down: function (x, y) {
      if (lock > 0) return;
      var i = at(x, y);
      if (i < 0 || cards[i].up || cards[i].done) return;
      cards[i].up = true; sel.push(i); E.snd("flip");
      if (sel.length === 2) {
        if (cards[sel[0]].v === cards[sel[1]].v) {
          cards[sel[0]].done = cards[sel[1]].done = true;
          sel = []; combo++; score += 10 * combo;
          E.score(score); E.snd("good");
          if (cards.every(function (k) { return k.done; })) { E.snd("win"); newBoard(); }
        } else {
          combo = 0; misses++; setMiss(misses + "/6"); lock = 0.7; E.snd("bad");
        }
      }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      E.text(c, combo > 0 ? "Chain x" + combo + " - next match +" + 10 * (combo + 1) : "Match pairs to start a chain", W / 2, 28, 18, combo > 1 ? "#86efac" : "#99f6e4");
      (cards || []).forEach(function (k, i) {
        var x = X0 + (i % 4) * CS + 4, y = Y0 + Math.floor(i / 4) * CS + 4;
        E.rr(c, x, y, CS - 8, CS - 8, 12);
        if (k.up || k.done) {
          c.fillStyle = k.done ? E.PAL[k.v] + "55" : E.PAL[k.v]; c.fill();
          E.text(c, "ABCDEFGH".charAt(k.v), x + (CS - 8) / 2, y + (CS - 8) / 2, 36, "#fff");
        } else {
          c.fillStyle = "#2a2a4a"; c.fill(); c.strokeStyle = "#4c1d95"; c.lineWidth = 2; c.stroke();
          E.text(c, "?", x + (CS - 8) / 2, y + (CS - 8) / 2, 28, "#6d5fa8");
        }
      });
    }
  });
})();
