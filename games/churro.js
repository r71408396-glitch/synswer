(function () {
  var E = Eng, W = E.W, H = E.H;
  var TOP = [["Sugar", "#f8fafc", "#111"], ["Cinnamon", "#b45309", "#fff"], ["Chocolate", "#5b2c14", "#fff"]];
  var DON = [["Light", 0.28], ["Golden", 0.55], ["Dark", 0.8]];
  var ord, phase, prog, mk, mdir, left, score, pts, msg, msgT, setTime;
  setTime = E.stat("Time", "60");

  function newOrder() {
    ord = { t: E.ri(0, 2), d: Math.random() < 0.5 ? 1 : E.ri(0, 2) };
    phase = "mix"; prog = 0; mk = 0; mdir = 1; pts = 0;
  }
  function say(s) { msg = s; msgT = 1.2; }
  function fry() {
    var err = Math.abs(mk - DON[ord.d][1]);
    if (err < 0.06) { pts += 5; say("Perfect fry!"); E.snd("good"); }
    else if (err < 0.15) { pts += 2; say("Nice fry"); E.snd("tap"); }
    else { say(mk < DON[ord.d][1] ? "Too raw" : "Too burnt"); E.snd("bad"); }
    phase = "coat";
  }
  function coat(i) {
    if (i === ord.t) { pts += 4; E.snd("good"); say("Order up! +" + pts); } else { say("Wrong coating. +" + pts); E.snd("bad"); }
    score += pts; E.score(score); newOrder();
  }
  function act() {
    if (phase === "mix") { prog += 0.14; E.snd("tick"); if (prog >= 1) { phase = "fry"; mk = 0; mdir = 1; E.snd("flip"); } }
    else if (phase === "fry") fry();
  }

  E.game({
    reset: function () { score = 0; left = 60; msg = ""; msgT = 0; setTime(60); E.score(0); newOrder(); },
    update: function (dt) {
      left -= dt; msgT -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (left <= 0) { E.snd("win"); E.over(score); return; }
      if (phase === "mix") prog = Math.max(0, prog - 0.18 * dt);
      if (phase === "fry") { mk += mdir * (0.75 + score * 0.004) * dt; if (mk > 1) { mk = 1; mdir = -1; } if (mk < 0) { mk = 0; mdir = 1; } }
    },
    down: function (x, y) {
      if (phase === "coat") {
        if (y >= 360 && y <= 440) { var i = Math.floor((x - 10) / 130); if (i >= 0 && i < 3) coat(i); }
      } else act();
    },
    key: function (k, down) {
      if (!down) return;
      if (phase === "coat" && "123".indexOf(k) >= 0 && k.length === 1) coat(parseInt(k, 10) - 1);
      else if (k === " ") act();
    },
    draw: function (c) {
      c.fillStyle = "#1c1410"; c.fillRect(0, 0, W, H);
      if (!ord) return;
      E.rr(c, 14, 14, W - 28, 96, 12); c.fillStyle = "#f5f0e1"; c.fill();
      E.text(c, "ORDER", W / 2, 34, 14, "#7c2d12");
      E.text(c, DON[ord.d][0] + " churro with " + TOP[ord.t][0], W / 2, 66, 20, "#1c1410");
      E.text(c, "Score " + score, W / 2, 94, 14, "#7c2d12");
      var label = phase === "mix" ? "1. Mix the dough: tap fast!" : phase === "fry" ? "2. Fry: tap when the marker hits the green zone" : "3. Coat: pick the topping";
      E.text(c, label, W / 2, 140, 15, "#fde68a");
      if (phase === "mix") {
        E.rr(c, 100, 170, 200, 130, 20); c.fillStyle = "#d6d3d1"; c.fill();
        c.fillStyle = "#fde68a"; c.fillRect(110, 290 - 110 * prog, 180, 110 * prog);
        E.text(c, Math.round(prog * 100) + "%", W / 2, 235, 26, "#1c1410");
      } else if (phase === "fry") {
        c.fillStyle = "#44403c"; c.fillRect(30, 220, W - 60, 28);
        var g = c.createLinearGradient(30, 0, W - 30, 0);
        g.addColorStop(0, "#fde68a"); g.addColorStop(0.55, "#d97706"); g.addColorStop(1, "#3f1d0b");
        c.fillStyle = g; c.fillRect(34, 224, W - 68, 20);
        var tx = 30 + (W - 60) * DON[ord.d][1];
        c.fillStyle = "rgba(34,197,94,.55)"; c.fillRect(tx - (W - 60) * 0.06, 212, (W - 60) * 0.12, 44);
        c.fillStyle = "#fff"; c.fillRect(30 + (W - 60) * mk - 3, 206, 6, 56);
        E.text(c, "Target: " + DON[ord.d][0], W / 2, 290, 15, "#fff");
      } else {
        E.rr(c, W / 2 - 70, 200, 140, 36, 18); c.fillStyle = DON[ord.d][1] < 0.4 ? "#fcd34d" : DON[ord.d][1] < 0.7 ? "#d97706" : "#78350f"; c.fill();
        E.text(c, "Hot churro", W / 2, 218, 14, "#1c1410");
        for (var i = 0; i < 3; i++) {
          E.rr(c, 10 + i * 130, 360, 120, 80, 12); c.fillStyle = TOP[i][1]; c.fill();
          E.text(c, TOP[i][0], 70 + i * 130, 400, 15, TOP[i][2]);
        }
      }
      if (msgT > 0) E.text(c, msg, W / 2, 330, 20, "#86efac");
      E.text(c, "Space or tap works for mix and fry. Keys 1 to 3 pick the topping.", W / 2, H - 16, 11, "#8383a3");
    }
  });
})();
