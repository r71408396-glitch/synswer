(function () {
  var E = Eng, W = E.W, H = E.H, TOTAL = 15;
  var NAMES = ["Aldric", "Brenna", "Corvin", "Dessa", "Edda", "Finn", "Garrick", "Hilde", "Ivo", "Jessa", "Kell", "Lyra"];
  var TY = ["Combat", "Stealth", "Magic"], TK = ["C", "S", "M"];
  var MN = { 0: ["Slay the goblin chief", "Hold the bridge", "Clear the wolf den", "Fight the ogre"], 1: ["Steal the baron's ledger", "Scout the ruins", "Free the prisoner", "Sneak past the guards"], 2: ["Lift the curse", "Seal the portal", "Brew the rare cure", "Calm the storm"] };
  var crew, ms, sel, gold, done, msg, msgC, nameN, setLeft;
  setLeft = E.stat("Left", String(TOTAL));

  function recruit(i) {
    var main = E.ri(0, 2), s = [E.ri(25, 50), E.ri(25, 50), E.ri(25, 50)];
    s[main] = E.ri(65, 95);
    crew[i] = { name: NAMES[nameN++ % NAMES.length], s: s, rest: 0, dead: 0 };
  }
  function mission() {
    var t = E.ri(0, 2), d = E.ri(25, 85);
    return { t: t, name: MN[t][E.ri(0, 3)], diff: d, reward: 20 + Math.round(d * 1.1) };
  }
  function chance(a, m) { return E.clamp(50 + a.s[m.t] - m.diff, 5, 95); }
  function ready(a) { return a && !a.dead && a.rest <= 0; }
  function send(mi) {
    var a = crew[sel];
    if (sel < 0 || !ready(a)) return;
    var m = ms[mi], ok = Math.random() * 100 < chance(a, m);
    crew.forEach(function (o) { if (o.rest > 0) o.rest--; if (o.dead > 0) o.dead--; });
    crew.forEach(function (o, i) { if (o.dead === 0 && o.gone) { recruit(i); } });
    if (ok) { gold += m.reward; msg = a.name + " succeeded: +" + m.reward + " gold"; msgC = "#86efac"; a.rest = 2; E.snd("good"); }
    else if (Math.random() < 0.4) { msg = a.name + " fell in battle"; msgC = "#fca5a5"; a.dead = 3; a.gone = true; E.snd("hurt"); }
    else { msg = a.name + " failed and must recover"; msgC = "#fdba74"; a.rest = 3; E.snd("bad"); }
    ms[mi] = mission(); sel = -1; done++; setLeft(TOTAL - done); E.score(gold);
    if (done >= TOTAL) E.over(gold);
  }

  E.game({
    reset: function () {
      nameN = E.ri(0, 11); crew = []; for (var i = 0; i < 4; i++) recruit(i);
      ms = [mission(), mission(), mission()]; sel = -1; gold = 0; done = 0; msg = "Pick an adventurer, then a bounty"; msgC = "#99f6e4"; setLeft(TOTAL); E.score(0);
    },
    down: function (x, y) {
      if (y >= 50 && y <= 160) {
        var i = Math.floor((x - 8) / 98);
        if (i >= 0 && i < 4 && ready(crew[i])) { sel = i; E.snd("tap"); }
      } else if (y >= 200 && y <= 430) {
        var mi = Math.floor((y - 200) / 80);
        if (mi >= 0 && mi < 3 && ((y - 200) % 80) < 72) send(mi);
      }
    },
    key: function (k, down) {
      if (!down) return;
      if ("1234".indexOf(k) >= 0 && k.length === 1 && ready(crew[parseInt(k, 10) - 1])) sel = parseInt(k, 10) - 1;
      else if (sel >= 0 && "qwe".indexOf(k) >= 0 && k.length === 1) send("qwe".indexOf(k));
    },
    draw: function (c) {
      c.fillStyle = "#16130f"; c.fillRect(0, 0, W, H);
      E.text(c, "Gold " + gold, W / 2, 22, 20, "#fde68a");
      if (!crew) return;
      crew.forEach(function (a, i) {
        var x = 8 + i * 98;
        E.rr(c, x, 50, 92, 110, 10); c.fillStyle = sel === i ? "#4c1d95" : "#26211a"; c.fill();
        if (sel === i) { c.strokeStyle = "#99f6e4"; c.lineWidth = 3; c.stroke(); }
        E.text(c, a.name, x + 46, 66, 14, a.dead ? "#6b7280" : "#fff");
        if (a.dead) { E.text(c, "Gone", x + 46, 110, 14, "#fca5a5"); E.text(c, "new in " + a.dead, x + 46, 130, 11, "#8383a3"); return; }
        for (var k = 0; k < 3; k++) E.text(c, TK[k] + " " + a.s[k], x + 46, 88 + k * 17, 12, a.s[k] >= 65 ? "#86efac" : "#99f6e4");
        if (a.rest > 0) { E.text(c, "Resting " + a.rest, x + 46, 146, 11, "#fdba74"); }
      });
      E.text(c, "C combat, S stealth, M magic", W / 2, 178, 11, "#8383a3");
      ms.forEach(function (m, i) {
        var y = 200 + i * 80;
        E.rr(c, 8, y, W - 16, 72, 10); c.fillStyle = "#26211a"; c.fill();
        c.strokeStyle = "#3a3226"; c.lineWidth = 2; c.stroke();
        c.textAlign = "left";
        E.text(c, m.name, 20, y + 20, 15, "#fff", "left");
        E.text(c, TY[m.t] + "  Danger " + m.diff + "  Reward " + m.reward, 20, y + 44, 12, "#99f6e4", "left");
        if (sel >= 0 && crew[sel]) {
          var p = chance(crew[sel], m);
          E.text(c, p + "%", W - 50, y + 36, 26, p >= 70 ? "#86efac" : p >= 45 ? "#fde68a" : "#fca5a5", "center");
        }
      });
      E.text(c, msg, W / 2, 448, 14, msgC);
      E.text(c, "Pick an adventurer, then tap the bounty to send them.", W / 2, 468, 11, "#8383a3");
    }
  });
})();
