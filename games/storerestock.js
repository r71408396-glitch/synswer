(function () {
  var E = Eng, W = E.W, H = E.H, SW = 90;
  var D = [["Fruit", "#ef4444"], ["Dairy", "#3b82f6"], ["Bakery", "#eab308"], ["Drinks", "#22c55e"]];
  var stock, q, spT, lives, score, t, shake, setL;
  setL = E.stat("Lives", "3");

  function hurt() { lives--; setL(lives); E.snd("hurt"); shake = 0.25; if (lives <= 0) E.over(score); }
  function put(i) {
    if (i < 0 || i > 3 || !q.length) return;
    if (q[0] === i) { q.shift(); stock[i] = Math.min(100, stock[i] + 38); score++; E.score(score); E.snd("good"); }
    else { E.snd("bad"); hurt(); }
  }

  E.game({
    reset: function () { stock = [70, 70, 70, 70]; q = [E.ri(0, 3), E.ri(0, 3)]; spT = 1.5; lives = 3; score = 0; t = 0; shake = 0; setL(3); E.score(0); },
    update: function (dt) {
      t += dt; shake -= dt;
      var drain = 5 + Math.min(8, t * 0.1);
      for (var i = 0; i < 4; i++) {
        stock[i] -= drain * dt;
        if (stock[i] <= 0) { stock[i] = 35; hurt(); if (lives <= 0) return; }
      }
      spT -= dt;
      if (spT <= 0) {
        spT = Math.max(0.8, 2.1 - t * 0.012);
        q.push(E.ri(0, 3));
        if (q.length > 7) { q.shift(); hurt(); }
      }
    },
    down: function (x) { put(Math.floor((x - 10) / (SW + 7))); },
    key: function (k, down) { if (down && "1234".indexOf(k) >= 0 && k.length === 1) put(parseInt(k, 10) - 1); },
    draw: function (c) {
      c.fillStyle = "#12141c"; c.fillRect(0, 0, W, H);
      if (!stock) return;
      E.text(c, "Boxes waiting " + q.length + "/7", W / 2, 20, 14, q.length > 5 ? "#fca5a5" : "#99f6e4");
      c.fillStyle = "#1f2233"; c.fillRect(0, 40, W, 90);
      if (q[0] != null) {
        E.rr(c, W / 2 - 150, 52, 90, 66, 10); c.fillStyle = D[q[0]][1]; c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
        E.text(c, D[q[0]][0], W / 2 - 105, 85, 16, "#fff");
        for (var k = 1; k < q.length; k++) { c.fillStyle = D[q[k]][1]; c.fillRect(W / 2 - 40 + (k - 1) * 40, 76, 32, 28); }
      }
      var ox = shake > 0 ? E.rnd(-3, 3) : 0;
      for (var i = 0; i < 4; i++) {
        var x = 10 + i * (SW + 7) + ox, y = 150, h = 280;
        E.rr(c, x, y, SW, h, 10); c.fillStyle = "#1a1d2c"; c.fill();
        var f = stock[i] / 100;
        c.fillStyle = f < 0.25 ? "#ef4444" : D[i][1];
        c.fillRect(x + 8, y + h - 8 - (h - 56) * f, SW - 16, (h - 56) * f);
        c.fillStyle = D[i][1]; c.fillRect(x, y, SW, 30);
        E.text(c, D[i][0], x + SW / 2, y + 15, 14, "#111");
        E.text(c, String(i + 1), x + SW / 2, y + h - 18, 14, "#8383a3");
      }
      E.text(c, "Restocked " + score, W / 2, 452, 17, "#fff");
      E.text(c, "Tap the shelf that matches the front box. Never let one empty.", W / 2, 470, 11, "#8383a3");
    }
  });
})();
