(function () {
  var E = Eng, W = E.W, H = E.H, SHOTS = 7, ZW = W / 3;
  var round, goals, phase, t, zone, dive, last, msg;
  var setRound = E.stat("Shot", "1/" + SHOTS);

  function shoot(z) {
    if (phase !== "aim") return;
    zone = z;
    dive = last >= 0 && Math.random() < 0.4 ? last : E.ri(0, 2);
    last = z; phase = "anim"; t = 0;
    E.snd("swoosh");
  }

  E.game({
    reset: function () { round = 1; goals = 0; phase = "aim"; t = 0; zone = 1; dive = 1; last = -1; msg = ""; setRound("1/" + SHOTS); E.score(0); },
    update: function (dt) {
      if (phase === "anim") {
        t += dt;
        if (t >= 0.7) {
          if (dive === zone) { msg = "Saved!"; E.snd("bad"); }
          else { msg = "GOAL!"; goals++; E.score(goals); E.snd("win"); }
          phase = "result"; t = 0;
        }
      } else if (phase === "result") {
        t += dt;
        if (t >= 1) {
          if (round >= SHOTS) { E.over(goals); return; }
          round++; setRound(round + "/" + SHOTS); phase = "aim"; msg = "";
        }
      }
    },
    down: function (x) { shoot(E.clamp(Math.floor(x / ZW), 0, 2)); },
    key: function (k, down) {
      if (!down) return;
      if (k === "arrowleft" || k === "a" || k === "1") shoot(0);
      else if (k === "arrowup" || k === "w" || k === " " || k === "2") shoot(1);
      else if (k === "arrowright" || k === "d" || k === "3") shoot(2);
    },
    draw: function (c) {
      c.fillStyle = "#0e2a1a"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#12351f"; c.fillRect(0, 0, W, 100);
      c.strokeStyle = "#e2e8f0"; c.lineWidth = 6;
      c.strokeRect(30, 70, W - 60, 140);
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1;
      for (var i = 1; i < 3; i++) { c.beginPath(); c.moveTo(30 + (W - 60) / 3 * i, 70); c.lineTo(30 + (W - 60) / 3 * i, 210); c.stroke(); }
      var gx = W / 2, p = phase === "anim" ? Math.min(1, t / 0.4) : phase === "result" ? 1 : 0;
      if (phase !== "aim") gx = W / 2 + ((dive - 1) * (W - 60) / 3) * p;
      c.fillStyle = "#f59e0b"; E.rr(c, gx - 16, 120, 32, 70, 10); c.fill();
      c.fillStyle = "#fde68a"; c.beginPath(); c.arc(gx, 112, 11, 0, Math.PI * 2); c.fill();
      if (dive != null && phase !== "aim") {
        c.strokeStyle = "#f59e0b"; c.lineWidth = 6; c.lineCap = "round";
        c.beginPath(); c.moveTo(gx - 16, 135); c.lineTo(gx - 32 - (dive === 0 ? 8 : 0), 118); c.moveTo(gx + 16, 135); c.lineTo(gx + 32 + (dive === 2 ? 8 : 0), 118); c.stroke();
      }
      var bx = W / 2, by = H - 60, bt = phase === "anim" ? Math.min(1, t / 0.5) : phase === "result" ? 1 : 0;
      if (phase !== "aim") { bx = W / 2 + (zone - 1) * (W - 60) / 3 * bt; by = H - 60 - (H - 60 - 150) * bt; }
      c.fillStyle = "#fff"; c.beginPath(); c.arc(bx, by, 14 - bt * 5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#111"; c.lineWidth = 2; c.stroke();
      E.text(c, msg || (phase === "aim" ? "Pick a side to shoot" : ""), W / 2, 250, msg ? 34 : 18, msg === "GOAL!" ? "#86efac" : msg ? "#fca5a5" : "#c4b5fd");
      if (phase === "aim") E.text(c, "Tap left, middle or right (or A, W, D)", W / 2, 285, 14, "#8383a3");
      E.text(c, "Goals " + goals, W / 2, 30, 20, "rgba(255,255,255,.85)");
    }
  });
})();
