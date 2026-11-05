(function () {
  var E = Eng, W = E.W, H = E.H, CS = 92, X0 = 16, Y0 = 60;
  var cards, sel, lock, time, matched, setTime;
  setTime = E.stat("Time", "20");

  function newBoard() {
    var v = [];
    for (var i = 0; i < 8; i++) { v.push(i, i); }
    E.shuffle(v);
    cards = v.map(function (n) { return { v: n, up: false, done: false }; });
    sel = []; lock = 0;
  }
  function at(x, y) {
    var c = Math.floor((x - X0) / CS), r = Math.floor((y - Y0) / CS);
    if (c < 0 || r < 0 || c > 3 || r > 3) return -1;
    return r * 4 + c;
  }

  E.game({
    reset: function () { newBoard(); time = 20; matched = 0; setTime(20); E.score(0); },
    update: function (dt) {
      time -= dt;
      setTime(Math.max(0, Math.ceil(time)));
      if (time <= 0) { E.snd("bad"); E.over(matched); return; }
      if (lock > 0) {
        lock -= dt;
        if (lock <= 0) { sel.forEach(function (i) { cards[i].up = false; }); sel = []; }
      }
    },
    down: function (x, y) {
      if (lock > 0) return;
      var i = at(x, y);
      if (i < 0 || cards[i].up || cards[i].done) return;
      cards[i].up = true;
      sel.push(i);
      E.snd("flip");
      if (sel.length === 2) {
        if (cards[sel[0]].v === cards[sel[1]].v) {
          cards[sel[0]].done = cards[sel[1]].done = true;
          sel = [];
          matched++;
          time = Math.min(40, time + 4);
          E.score(matched);
          E.snd("good");
          if (cards.every(function (k) { return k.done; })) { E.snd("win"); newBoard(); }
        } else {
          lock = 0.7;
          E.snd("bad");
        }
      }
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#171726";
      c.fillRect(20, 20, W - 40, 12);
      c.fillStyle = time < 6 ? "#ef4444" : "#14e0cc";
      c.fillRect(20, 20, (W - 40) * E.clamp(time / 40, 0, 1), 12);
      (cards || []).forEach(function (k, i) {
        var x = X0 + (i % 4) * CS + 4, y = Y0 + Math.floor(i / 4) * CS + 4;
        E.rr(c, x, y, CS - 8, CS - 8, 12);
        if (k.up || k.done) {
          c.fillStyle = k.done ? E.PAL[k.v] + "55" : E.PAL[k.v];
          c.fill();
          E.text(c, "ABCDEFGH".charAt(k.v), x + (CS - 8) / 2, y + (CS - 8) / 2, 36, "#fff");
        } else {
          c.fillStyle = "#2a2a4a";
          c.fill();
          c.strokeStyle = "#4c1d95";
          c.lineWidth = 2;
          c.stroke();
          E.text(c, "?", x + (CS - 8) / 2, y + (CS - 8) / 2, 28, "#6d5fa8");
        }
      });
    }
  });
})();
