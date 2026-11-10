// Tiny shared engine for the mini games: canvas loop, pointer + keyboard input, HUD helpers.
(function () {
  var G = window.GameUI, S = window.Sound;
  var cfg = window.GAME_CFG;
  var cv = document.getElementById("game"), ctx = cv.getContext("2d");
  var E = (window.Eng = {});
  var def = null, running = false, pressed = false, W = cfg.w, H = cfg.h;
  E.W = W; E.H = H; E.ctx = ctx;
  E.PAL = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

  E.rnd = function (a, b) { return a + Math.random() * (b - a); };
  E.ri = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  E.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  E.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  E.snd = function (n) { if (S) S.play(n); };
  E.score = function (n) { G.setScore(n); };
  E.stat = function (label, init) {
    var hud = document.querySelector(".hud"), span = document.createElement("span"), b = document.createElement("b");
    span.appendChild(document.createTextNode(label + " "));
    span.appendChild(b);
    b.textContent = init == null ? "0" : init;
    hud.insertBefore(span, hud.children[1] || null);
    return function (v) { b.textContent = v; };
  };
  E.text = function (c, s, x, y, size, color, align) {
    c.font = "700 " + size + "px Sora, Inter, sans-serif";
    c.fillStyle = color || "#fff";
    c.textAlign = align || "center";
    c.textBaseline = "middle";
    c.fillText(s, x, y);
  };
  E.rr = function (c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  E.over = function (score) {
    running = false;
    pressed = false;
    if (def && def.draw) def.draw(ctx);
    G.over(score);
  };

  // On-screen buttons under the game for touch screens (shown by the .pad rules in games.css).
  var CTRL = {
    neonrunner: [["Jump", " "]], glitchrunner: [["Jump", " "]], rooftop: [["Jump", " "]],
    orbit: [["Release", " "]], towerstacker: [["Drop", " "]], perfecttap: [["Tap", " "]],
    traffic: [["Switch lights", " "]], jetpack: [["Thrust", " ", 1]], hookshot: [["Hook", " ", 1]],
    paperplane: [["Dive", " ", 1]],
    asteroid: [["Left", "arrowleft", 1], ["Up", "arrowup", 1], ["Down", "arrowdown", 1], ["Right", "arrowright", 1]],
    lavaescape: [["Left", "arrowleft", 1], ["Right", "arrowright", 1]],
    trampoline: [["Left", "arrowleft", 1], ["Right", "arrowright", 1]],
    traindefense: [["Up", "arrowup"], ["Down", "arrowdown"]]
  };
  function buildControls() {
    var list = CTRL[cfg.id], wrap = document.getElementById("wrap");
    if (!list || !wrap) return;
    var pad = document.createElement("div");
    pad.className = "pad ctrl";
    pad.style.setProperty("--n", list.length);
    list.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      var dir = { Left: "M15 5l-7 7 7 7", Right: "M9 5l7 7-7 7", Up: "M5 15l7-7 7 7", Down: "M5 9l7 7 7-7", Jump: "M5 15l7-7 7 7", Thrust: "M5 15l7-7 7 7", Dive: "M5 9l7 7 7-7" }[b[0]];
      if (dir) {
        btn.setAttribute("aria-label", b[0]);
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + dir + '"/></svg>';
        btn.style.display = "flex"; btn.style.alignItems = "center"; btn.style.justifyContent = "center";
      } else btn.textContent = b[0];
      function on(e) { e.preventDefault(); if (running && def && def.key) def.key(b[1], true); }
      function off(e) { e.preventDefault(); if (def && def.key && (b[2] || false)) def.key(b[1], false); }
      btn.addEventListener("pointerdown", on);
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (n) { btn.addEventListener(n, off); });
      pad.appendChild(btn);
    });
    wrap.parentNode.insertBefore(pad, wrap.nextSibling);
  }
  buildControls();

  E.game = function (d) {
    def = d;
    d.reset();
    G.onStart = function () { d.reset(); running = true; };
    G.onPause = function () { running = false; pressed = false; };
    G.onResume = function () { running = true; };
    var last = performance.now();
    requestAnimationFrame(function f(t) {
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (running && d.update) d.update(dt);
      d.draw(ctx);
      requestAnimationFrame(f);
    });
  };

  function pt(e) {
    var r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  }
  cv.addEventListener("pointerdown", function (e) {
    if (!running || !def) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    pressed = true;
    var p = pt(e);
    if (def.down) def.down(p[0], p[1], e);
  });
  cv.addEventListener("pointermove", function (e) {
    if (!running || !def || !def.move) return;
    var p = pt(e);
    def.move(p[0], p[1], pressed, e);
  });
  function up(e) {
    var was = pressed;
    pressed = false;
    if (!was || !running || !def || !def.up) return;
    var p = pt(e);
    def.up(p[0], p[1], e);
  }
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  document.addEventListener("keydown", function (e) {
    if (!running || !def || !def.key || G.typing() || e.repeat) return;
    var k = e.key.toLowerCase();
    if (k === " " || k.indexOf("arrow") === 0) e.preventDefault();
    def.key(k, true);
  });
  document.addEventListener("keyup", function (e) {
    if (!def || !def.key) return;
    def.key(e.key.toLowerCase(), false);
  });
})();
