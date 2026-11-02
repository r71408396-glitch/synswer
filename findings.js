// Printable findings card: draws the current answer onto a canvas as a PNG the visitor can save or print.
(function () {
  var btn = document.getElementById("make-card");
  var dlg = document.getElementById("card-dlg");
  if (!btn || !dlg) return;

  var bodyEl = document.getElementById("answer-body");
  var qEl = document.getElementById("answer-q");
  var srcEl = document.getElementById("answer-sources");
  var img = document.getElementById("card-img");
  var saveBtn = document.getElementById("card-save");
  var printBtn = document.getElementById("card-print");
  var closeBtn = document.getElementById("card-close");
  var dataUrl = "";

  var W = 1240, PAD = 90, INK = "#0b1220", TEXT = "#334155", MUTED = "#64748b", LINE = "#e2e8f0", ACCENT = "#2563eb", TINT = "#eff6ff";
  var HEAD = "Sora, 'Segoe UI', Arial, sans-serif", BODY = "Inter, 'Segoe UI', Arial, sans-serif";

  function show() { btn.hidden = bodyEl.getAttribute("data-ok") !== "1"; }
  document.addEventListener("synswer:answer", show);
  document.addEventListener("synswer:view", function () { btn.hidden = true; });

  function clean(s) {
    return s.replace(/\[(File,[^\]]*|\d{1,2})\]/g, "").replace(/\s+/g, " ").trim();
  }

  // Turn a DOM node into word tokens: { w: word, b: bold }
  function tokens(node) {
    var out = [];
    (function walk(n, bold) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3) {
          clean(c.nodeValue.replace(/\[(File,[^\]]*|\d{1,2})\]/g, "")).split(" ").forEach(function (w) { if (w) out.push({ w: w, b: bold }); });
        } else if (c.nodeType === 1) {
          if (c.classList && c.classList.contains("cite")) return;
          walk(c, bold || c.tagName === "STRONG" || c.tagName === "TH");
        }
      });
    })(node, false);
    return out;
  }

  function blocks() {
    var out = [];
    Array.prototype.forEach.call(bodyEl.children, function (el) {
      var t = el.tagName;
      if (t === "P") out.push({ k: "p", t: tokens(el) });
      else if (t === "H3") out.push({ k: "h", t: tokens(el) });
      else if (t === "UL" || t === "OL") {
        Array.prototype.forEach.call(el.children, function (li, i) { out.push({ k: "li", n: t === "OL" ? i + 1 : 0, t: tokens(li) }); });
      } else if (t === "PRE") {
        out.push({ k: "p", t: tokens(el) });
      } else if (el.querySelector && el.querySelector("table")) {
        Array.prototype.forEach.call(el.querySelectorAll("tr"), function (tr, i) {
          var cells = Array.prototype.map.call(tr.children, function (c) { return clean(c.textContent); });
          out.push({ k: "li", n: 0, t: [{ w: cells.join("  |  "), b: i === 0 }] });
        });
      }
    });
    return out.filter(function (b) { return b.t.length; });
  }

  // Draw words wrapped to a width. Returns the y after the last line.
  function wrap(ctx, toks, x, y, maxW, size, lh, color, family, draw, forceBold) {
    var cx = x, first = true;
    toks.forEach(function (tk) {
      var bold = forceBold || tk.b;
      ctx.font = (bold ? "700 " : "400 ") + size + "px " + family;
      var w = ctx.measureText(tk.w).width, sp = ctx.measureText(" ").width;
      if (!first && cx + w > x + maxW) { cx = x; y += lh; }
      if (draw) { ctx.fillStyle = bold ? INK : color; ctx.fillText(tk.w, cx, y); }
      cx += w + sp;
      first = false;
    });
    return y + lh;
  }

  function plain(s) { return s.split(" ").map(function (w) { return { w: w, b: false }; }); }

  function layout(ctx, draw, logo) {
    var y = 0, inner = W - PAD * 2;
    ctx.textBaseline = "alphabetic";
    if (draw) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, 4000); }

    // header band
    if (draw) {
      ctx.fillStyle = TINT; ctx.fillRect(0, 0, W, 150);
      if (logo) ctx.drawImage(logo, PAD, 38, 72, 72);
      ctx.fillStyle = INK; ctx.font = "800 40px " + HEAD; ctx.textAlign = "left";
      ctx.fillText("Synswer", PAD + 92, 86);
      ctx.fillStyle = ACCENT; ctx.font = "700 20px " + BODY; ctx.textAlign = "right";
      ctx.fillText("FINDINGS", W - PAD, 82);
      ctx.textAlign = "left";
    }
    y = 150 + 80;

    // question
    ctx.textAlign = "left";
    y = wrap(ctx, plain(clean(qEl.textContent)), PAD, y, inner, 46, 58, INK, HEAD, draw, true);
    y += 6;
    if (draw) { ctx.fillStyle = ACCENT; ctx.fillRect(PAD, y, 90, 6); }
    y += 56;

    // findings
    var list = blocks(), first = true;
    list.forEach(function (b) {
      if (b.k === "h") {
        y += 14;
        y = wrap(ctx, b.t, PAD, y, inner, 30, 40, INK, HEAD, draw, true) + 6;
      } else if (b.k === "li") {
        if (draw) {
          ctx.fillStyle = ACCENT;
          if (b.n) { ctx.font = "700 28px " + BODY; ctx.fillText(b.n + ".", PAD, y); }
          else { ctx.beginPath(); ctx.arc(PAD + 8, y - 10, 6, 0, Math.PI * 2); ctx.fill(); }
        }
        y = wrap(ctx, b.t, PAD + 48, y, inner - 48, 28, 41, TEXT, BODY, draw) + 12;
      } else {
        var lead = first;
        y = wrap(ctx, b.t, PAD, y, inner, lead ? 32 : 28, lead ? 48 : 41, lead ? INK : TEXT, BODY, draw) + 16;
      }
      first = false;
    });

    // sources
    var links = srcEl && !srcEl.hidden ? Array.prototype.slice.call(srcEl.querySelectorAll("a")).slice(0, 6) : [];
    if (links.length) {
      y += 24;
      if (draw) { ctx.fillStyle = LINE; ctx.fillRect(PAD, y, inner, 2); }
      y += 52;
      if (draw) { ctx.fillStyle = MUTED; ctx.font = "700 20px " + BODY; ctx.fillText("SOURCES CHECKED", PAD, y); }
      y += 36;
      links.forEach(function (a) {
        var t = a.textContent;
        if (t.length > 95) t = t.slice(0, 92) + "...";
        y = wrap(ctx, plain(t), PAD, y, inner, 20, 28, MUTED, BODY, draw) + 4;
      });
    }

    // footer
    y += 56;
    if (draw) {
      ctx.fillStyle = LINE; ctx.fillRect(PAD, y, inner, 2);
      ctx.fillStyle = MUTED; ctx.font = "400 20px " + BODY;
      ctx.fillText("synswer.com  -  " + new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), PAD, y + 44);
      ctx.textAlign = "right";
      ctx.fillText("Check important facts before relying on them.", W - PAD, y + 44);
      ctx.textAlign = "left";
    }
    return y + 44 + 70;
  }

  function loadLogo() {
    return new Promise(function (resolve) {
      var i = new Image();
      i.onload = function () { resolve(i); };
      i.onerror = function () { resolve(null); };
      i.src = "favicon.svg";
    });
  }

  async function build() {
    try { await Promise.all([document.fonts.load("800 40px Sora"), document.fonts.load("400 28px Inter"), document.fonts.load("700 28px Inter")]); } catch (_) {}
    var logo = await loadLogo();
    var m = document.createElement("canvas").getContext("2d");
    var h = Math.max(1754, Math.ceil(layout(m, false, logo)));
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = h;
    var ctx = cv.getContext("2d");
    layout(ctx, true, logo);
    ctx.fillStyle = "#fff";
    return cv.toDataURL("image/png");
  }

  btn.addEventListener("click", async function () {
    btn.disabled = true;
    var old = btn.textContent;
    btn.textContent = "Creating image...";
    try {
      dataUrl = await build();
      img.src = dataUrl;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      saveBtn.focus();
    } catch (_) {
      btn.textContent = "Could not create the image";
      setTimeout(function () { btn.textContent = old; }, 2500);
      btn.disabled = false;
      return;
    }
    btn.textContent = old;
    btn.disabled = false;
  });

  saveBtn.addEventListener("click", function () {
    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = "synswer-findings.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  printBtn.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    var d = f.contentWindow.document;
    d.open();
    d.write('<!doctype html><html><head><title>Synswer findings</title><style>@page{margin:8mm}html,body{margin:0}img{width:100%;display:block}</style></head><body><img id="i" src="' + dataUrl + '"></body></html>');
    d.close();
    var go = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (_) {} setTimeout(function () { f.remove(); }, 2000); };
    var im = d.getElementById("i");
    if (im.complete) go(); else im.onload = go;
  });

  closeBtn.addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
