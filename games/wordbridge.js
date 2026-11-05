(function () {
  var E = Eng, W = E.W, H = E.H;
  var WORDS = {};
  ("the and for are but not you all any can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use cat dog sun run fun red big box car cup hat hot ice job key leg lip map mom net pan pen pig pot rat sea sit son tap tea tip toy van war web win yes zoo ant arm art bag bed bee bit bus cow cry cut dad dry ear eat egg end eye fan fat few fit fix fly fog gas gun gym hen hit hop hug jam jar jet joy kid lap law lay lid log low mad mix mud nap nut oil owl pad paw pie pin pop raw row rub sad sew shy sky sob sum tab tag tax tie tin ton top tub wag wax wet wig wow yak yam zip bat bay bow bun cab cap cod cot dam den dig dip dot dug fin fur gap gel gum hay hip hut ink inn jaw jog lab lug mat men mop nod oak oat odd pal peg pit rag ram rib rid rip rod rug sap saw sip ski sly sod spy tan tow urn vet vow wed yet").split(" ").forEach(function (w) { WORDS[w] = 1; });
  var ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"], KW = 36, KH = 42, KY = [318, 366, 414];
  var buf, used, planks, left, score, flash, bad, msg, walk, setTime;
  setTime = E.stat("Time", "60");

  function keyRect(row, i) {
    var n = ROWS[row].length, extra = row === 2 ? 58 + 3 : 0;
    var total = n * KW + (n - 1) * 3 + extra, x0 = (W - total) / 2;
    return [x0 + i * (KW + 3), KY[row], KW, KH];
  }
  function bkRect() { var r = keyRect(2, 6); return [r[0] + KW + 3, KY[2], 58, KH]; }
  function press(ch) {
    if (ch === "backspace") { buf = buf.slice(0, -1); E.snd("tick"); return; }
    if (ch.length !== 1 || ch < "a" || ch > "z" || buf.length >= 3) return;
    buf += ch; E.snd("tick");
    if (buf.length === 3) {
      if (WORDS[buf] && !used[buf]) {
        used[buf] = 1; planks++; score++; E.score(score);
        left = Math.min(60, left + 1.5); flash = 0.4; msg = buf.toUpperCase() + "!"; E.snd("good");
      } else {
        bad = 0.4; msg = used[buf] ? "Already used" : "Not a word"; E.snd("bad");
      }
      buf = "";
    }
  }

  E.game({
    reset: function () { buf = ""; used = {}; planks = 0; left = 60; score = 0; flash = 0; bad = 0; msg = "Type 3-letter words"; walk = 0; setTime(60); E.score(0); },
    update: function (dt) {
      left -= dt; setTime(Math.max(0, Math.ceil(left)));
      if (flash > 0) flash -= dt;
      if (bad > 0) bad -= dt;
      walk += (planks - walk) * Math.min(1, dt * 5);
      if (left <= 0) { E.over(score); }
    },
    down: function (x, y) {
      for (var r = 0; r < 3; r++) for (var i = 0; i < ROWS[r].length; i++) {
        var k = keyRect(r, i);
        if (x >= k[0] && x <= k[0] + k[2] && y >= k[1] && y <= k[1] + k[3]) { press(ROWS[r].charAt(i)); return; }
      }
      var b = bkRect();
      if (x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]) press("backspace");
    },
    key: function (k, down) { if (down) press(k); },
    draw: function (c) {
      c.fillStyle = "#0d0d16"; c.fillRect(0, 0, W, H);
      var off = Math.max(0, walk * 18 - 200), by = 190, i;
      c.fillStyle = "#14142a"; c.fillRect(0, by + 10, W, 60);
      c.fillStyle = "#7f1d1d"; c.fillRect(0, by + 60, W, 10);
      c.fillStyle = "#3b3b5c"; c.fillRect(-off, by, 60, 80);
      for (i = 0; i < planks; i++) {
        var x = 60 + i * 18 - off;
        if (x < -20 || x > W) continue;
        c.fillStyle = i % 2 ? "#a16207" : "#ca8a04"; c.fillRect(x, by, 16, 8);
      }
      var cx = 60 + walk * 18 - off - 6;
      c.beginPath(); c.arc(cx, by - 12, 10, 0, Math.PI * 2); c.fillStyle = "#3b82f6"; c.fill();
      c.strokeStyle = "#dbeafe"; c.lineWidth = 2; c.stroke();
      E.text(c, "Bridge: " + planks * 18 + " px   Words: " + score, W / 2, 30, 16, "#99f6e4");
      E.text(c, msg || "", W / 2, 64, 18, bad > 0 ? "#fca5a5" : flash > 0 ? "#86efac" : "#8383a3");
      var sh = bad > 0 ? Math.sin(bad * 60) * 4 : 0;
      for (i = 0; i < 3; i++) {
        E.rr(c, W / 2 - 84 + i * 60 + sh, 258, 52, 46, 10);
        c.fillStyle = "#171726"; c.fill();
        c.strokeStyle = bad > 0 ? "#ef4444" : flash > 0 ? "#22c55e" : "#4c1d95"; c.lineWidth = 2; c.stroke();
        if (buf.charAt(i)) E.text(c, buf.charAt(i).toUpperCase(), W / 2 - 58 + i * 60 + sh, 282, 26, "#fff");
      }
      for (var r = 0; r < 3; r++) for (var j = 0; j < ROWS[r].length; j++) {
        var k = keyRect(r, j);
        E.rr(c, k[0], k[1], k[2], k[3], 8); c.fillStyle = "#2a2a4a"; c.fill();
        E.text(c, ROWS[r].charAt(j).toUpperCase(), k[0] + k[2] / 2, k[1] + k[3] / 2, 18, "#fff");
      }
      var b = bkRect();
      E.rr(c, b[0], b[1], b[2], b[3], 8); c.fillStyle = "#4c1d95"; c.fill();
      E.text(c, "Del", b[0] + b[2] / 2, b[1] + b[3] / 2, 16, "#fff");
    }
  });
})();
