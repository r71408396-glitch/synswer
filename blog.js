// Public articles list (articles.html) and single article (article.html).
(function () {
  var COLS = "id,title,slug,excerpt,image_url,category,tags,published_at";

  function fmt(d) {
    if (!d) return "";
    var dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function seed(table) {
    var s = document.querySelector('script[data-kreova-rows="' + table + '"]');
    try { return s && s.textContent.trim() ? JSON.parse(s.textContent).rows : null; } catch (_) { return null; }
  }

  // ---------- List ----------
  var list = document.getElementById("posts");
  if (list) {
    var all = [], cat = "";
    var filters = document.getElementById("filters");

    var render = function () {
      list.textContent = "";
      var rows = cat ? all.filter(function (r) { return r.category === cat; }) : all;
      if (!rows.length) { list.appendChild(el("li", "post-empty", all.length ? "No articles in this category." : "No articles yet. Check back soon.")); return; }
      rows.forEach(function (r) {
        var li = el("li");
        var a = el("a", "post-card");
        a.href = "article.html?slug=" + encodeURIComponent(r.slug);
        if (r.image_url) {
          var img = el("img", "post-thumb");
          img.src = r.image_url; img.alt = ""; img.loading = "lazy"; img.width = 640; img.height = 360;
          a.appendChild(img);
        } else a.appendChild(el("div", "post-thumb-empty"));
        var body = el("div", "post-body");
        var meta = el("div", "post-meta");
        if (r.category) { meta.appendChild(el("b", null, r.category)); meta.appendChild(document.createTextNode(" - ")); }
        meta.appendChild(document.createTextNode(fmt(r.published_at)));
        body.appendChild(meta);
        body.appendChild(el("h2", null, r.title));
        if (r.excerpt) body.appendChild(el("p", null, r.excerpt));
        a.appendChild(body);
        li.appendChild(a);
        list.appendChild(li);
      });
    };

    var buildFilters = function () {
      var cats = [];
      all.forEach(function (r) { if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category); });
      filters.textContent = "";
      if (cats.length < 2) { filters.hidden = true; return; }
      filters.hidden = false;
      ["All"].concat(cats).forEach(function (c) {
        var b = el("button", (c === "All" && !cat) || c === cat ? "is-on" : "", c);
        b.type = "button";
        b.addEventListener("click", function () { cat = c === "All" ? "" : c; buildFilters(); render(); });
        filters.appendChild(b);
      });
    };

    var apply = function (rows) { all = rows || []; buildFilters(); render(); };
    var s0 = seed("articles");
    if (s0) apply(s0);
    fetch("api/rows/articles?select=" + COLS + "&status=eq.published&sort=-published_at&limit=100")
      .then(function (r) { return r.json(); })
      .then(function (d) { apply(d.rows || []); })
      .catch(function () { if (!s0) { list.textContent = ""; list.appendChild(el("li", "post-empty", "Could not load articles.")); } });
  }

  // ---------- Single article ----------
  var box = document.getElementById("article");
  if (box) {
    var slug = (window.kreovaParams || {}).slug || new URLSearchParams(location.search).get("slug");
    var fail = function (msg) {
      box.textContent = "";
      box.appendChild(el("p", "post-empty", msg || "This article could not be found."));
      var a = el("a", null, "See all articles"); a.href = "articles.html";
      box.appendChild(a);
    };
    if (!slug) { fail(); return; }
    fetch("api/rows/articles?slug=eq." + encodeURIComponent(slug) + "&status=eq.published&limit=1")
      .then(function (r) { return r.json(); })
      .then(async function (d) {
        var r = (d.rows || [])[0];
        if (!r) { fail(); return; }
        document.title = r.title + " - Synswer";
        var can = document.querySelector('link[rel="canonical"]');
        if (can) can.setAttribute("href", "https://synswer.com/article.html?slug=" + encodeURIComponent(r.slug));
        var md = document.querySelector('meta[name="description"]');
        if (md && r.excerpt) md.setAttribute("content", r.excerpt);
        box.textContent = "";
        box.appendChild(el("h1", null, r.title));
        var meta = el("div", "post-meta");
        if (r.category) { meta.appendChild(el("b", null, r.category)); meta.appendChild(document.createTextNode(" - ")); }
        meta.appendChild(document.createTextNode(fmt(r.published_at)));
        box.appendChild(meta);
        if (r.image_url) {
          var img = el("img", "article-hero");
          img.src = r.image_url; img.alt = r.title; img.width = 1280; img.height = 720;
          box.appendChild(img);
        }
        var content = el("div", "article-content");
        box.appendChild(content);
        var mod = await import("@kreova/editor");
        await mod.renderRichText(content, r.body_rich || "");
        var tags = (r.tags || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
        if (tags.length) {
          var ul = el("ul", "tag-list");
          tags.forEach(function (t) { ul.appendChild(el("li", null, "#" + t)); });
          box.appendChild(ul);
        }
      })
      .catch(function () { fail("Could not load this article."); });
  }
})();
