(function () {
  var E = Eng, W = E.W, H = E.H, LW = W / 4, TY = H - 90;
  var notes, spawnT, score, combo, strikes, t, fl, setStrikes;
  var FREQ = [262, 330, 392, 523];
  setStrikes = E.stat("Misses", "0/5");

  function hit(l) {
    var best = null;
    notes.forEach(function (n) { if (n.lane === l && !n.done && Math.abs(n.y - TY) < 46 && (!best || n.y > best.y)) best = n; });
    fl[l] = 0.15;
    if (best) {
      best.done = true; combo++; score += 1 + Math.floor(combo / 10);
      E.score(score);
      if (window.Sound) Sound.note(FREQ[l], 0.2);
    } else { combo = 0; E.snd("bad"); }
  }

  E.game({
    reset: function () { notes = []; spawnT = 0.8; score = 0; combo = 0; strikes = 0; t = 0; fl = [0, 0, 0, 0]; setStrikes("0/5"); E.score(0); },
    update: function (dt) {
      t += dt; spawnT -= dt;
      var sp = 230 + Math.min(200, t * 3);
      if (spawnT <= 0) { spawnT = Math.max(0.3, 0.7 - t * 0.006); notes.push({ lane: E.ri(0, 3), y: -20, done: false }); }
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        n.y += sp * dt;
        if (n.done && n.y > TY + 60) { notes.splice(i--, 1); continue; }
        if (!n.done && n.y > TY + 46) {
          notes.splice(i--, 1); strikes++; combo = 0; setStrikes(strikes + "/5"); E.snd("bad");
          if (strikes >= 5) { E.over(score); return; }
        }
      }
      for (var k = 0; k < 4; k++) if (fl[k] > 0) fl[k] -= dt;
    },
    down: function (x) { hit(E.clamp(Math.floor(x / LW), 0, 3)); },
    key: function (k, down) {
      if (!down) return;
      var m = { d: 0, f: 1, j: 2, k: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      if (m[k] != null) hit(m[k]);
    },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      for (var l = 0; l < 4; l++) {
        c.fillStyle = (fl && fl[l] > 0) ? E.PAL[l] + "44" : "#11111c";
        c.fillRect(l * LW + 2, 0, LW - 4, H);
      }
      c.fillStyle = "#99f6e4"; c.fillRect(0, TY - 2, W, 4);
      (notes || []).forEach(function (n) {
        c.globalAlpha = n.done ? 0.3 : 1;
        c.fillStyle = E.PAL[n.lane]; E.rr(c, n.lane * LW + 10, n.y - 14, LW - 20, 28, 8); c.fill();
        c.globalAlpha = 1;
      });
      E.text(c, String(score), W / 2, 40, 40, "rgba(255,255,255,.8)");
      if (combo > 1) E.text(c, "Combo x" + combo, W / 2, 76, 16, "#86efac");
      E.text(c, "Tap lanes, or D F J K", W / 2, H - 24, 14, "#8383a3");
    }
  });
})();
