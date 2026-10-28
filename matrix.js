// Purple matrix rain background (shared by every page)
(function () {
  var canvas = document.createElement("canvas");
  canvas.className = "matrix";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var glyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789<>=+*".split("");
  var size = 16;
  var cols = 0;
  var drops = [];
  var w = 0, h = 0, dpr = 1;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#07070b";
    ctx.fillRect(0, 0, w, h);
    cols = Math.ceil(w / size);
    var old = drops;
    drops = [];
    for (var i = 0; i < cols; i++) {
      drops[i] = old[i] !== undefined ? old[i] : Math.floor(Math.random() * -40);
    }
    if (reduced) staticFrame();
  }

  function randGlyph() { return glyphs[Math.floor(Math.random() * glyphs.length)]; }

  function staticFrame() {
    ctx.fillStyle = "#07070b";
    ctx.fillRect(0, 0, w, h);
    ctx.font = size + "px monospace";
    for (var i = 0; i < cols; i++) {
      var len = 4 + Math.floor(Math.random() * 12);
      var top = Math.floor(Math.random() * (h / size));
      for (var j = 0; j < len; j++) {
        ctx.fillStyle = "rgba(139,92,246," + (0.5 - j * 0.035).toFixed(2) + ")";
        ctx.fillText(randGlyph(), i * size, (top - j) * size);
      }
    }
  }

  var last = 0;
  var running = true;
  function frame(t) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (t - last < 55) return;
    last = t;
    // fade previous frame to leave trails
    ctx.fillStyle = "rgba(7,7,11,0.1)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = size + "px monospace";
    for (var i = 0; i < cols; i++) {
      var y = drops[i] * size;
      if (y > 0) {
        // bright head, then the trail is left by the fade
        ctx.fillStyle = "rgba(221,205,255,0.95)";
        ctx.fillText(randGlyph(), i * size, y);
        ctx.fillStyle = "rgba(139,92,246,0.85)";
        ctx.fillText(randGlyph(), i * size, y - size);
      }
      if (y > h && Math.random() > 0.975) drops[i] = Math.floor(Math.random() * -20);
      drops[i]++;
    }
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduced) return;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();
