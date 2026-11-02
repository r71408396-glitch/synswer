// Home page extras: quick-task prefill and recent articles.
(function () {
  var input = document.getElementById("ask-input");
  document.querySelectorAll("[data-prefill]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!input) return;
      input.value = b.getAttribute("data-prefill");
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  var box = document.getElementById("home-articles");
  if (!box) return;
  function render(rows) {
    box.textContent = "";
    if (!rows || !rows.length) { var p = document.createElement("p"); p.className = "muted"; p.textContent = "No articles yet."; box.appendChild(p); return; }
    rows.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "card card-link";
      a.href = "article.html?slug=" + encodeURIComponent(r.slug);
      if (r.image_url) {
        var im = document.createElement("img");
        im.src = r.image_url; im.alt = r.image_alt || ""; im.loading = "lazy"; im.width = 320; im.height = 160;
        a.appendChild(im);
      }
      if (r.category) { var c = document.createElement("span"); c.className = "kicker"; c.textContent = r.category; a.appendChild(c); }
      var h = document.createElement("h3"); h.textContent = r.title; a.appendChild(h);
      var p2 = document.createElement("p"); p2.textContent = r.excerpt || ""; a.appendChild(p2);
      box.appendChild(a);
    });
  }
  var el = document.querySelector('script[data-kreova-rows="articles"]');
  var seed = null;
  try { seed = el && el.textContent.trim() ? JSON.parse(el.textContent).rows : null; } catch (e) {}
  if (seed) render(seed);
  fetch("api/rows/articles?select=title,slug,excerpt,image_url,image_alt,category&status=eq.published&sort=-published_at&limit=3")
    .then(function (r) { return r.json(); })
    .then(function (d) { render(d.rows); })
    .catch(function () { if (!seed) render([]); });
})();
