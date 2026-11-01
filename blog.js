// Public articles list (articles.html) and single article (article.html).
(function () {
  var COLS = "id,title,slug,excerpt,image_url,image_alt,category,tags,published_at";
  var PER = 10;

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
    try { return s && s.textContent.trim() ? JSON.parse(s.textContent) : null; } catch (_) { return null; }
  }

  // ---------- List ----------
  var list = document.getElementById("posts");
  if (list) {
    var qs = new URLSearchParams(location.search);
    var cat = qs.get("cat") || "";
    var page = Math.max(1, parseInt(qs.get("page") || "1", 10) || 1);
    var filters = document.getElementById("filters");
    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "Pages");
    pager.hidden = true;
    list.parentNode.insertBefore(pager, list.nextSibling);

    var href = function (c, p) {
      var u = [];
      if (c) u.push("cat=" + encodeURIComponent(c));
      if (p > 1) u.push("page=" + p);
      return "articles.html" + (u.length ? "?" + u.join("&") : "");
    };

    var render = function (rows, total) {
      list.textContent = "";
      if (!rows.length) { list.appendChild(el("li", "post-empty", cat ? "No articles in this category." : "No articles yet. Check back soon.")); pager.hidden = true; return; }
      rows.forEach(function (r) {
        var li = el("li");
        var a = el("a", "post-card");
        a.href = "article.html?slug=" + encodeURIComponent(r.slug);
        if (r.image_url) {
          var img = el("img", "post-thumb");
          img.src = r.image_url; img.alt = r.image_alt || ""; img.loading = "lazy"; img.width = 640; img.height = 360;
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
      var pages = Math.max(1, Math.ceil(total / PER));
      pager.textContent = "";
      if (pages < 2) { pager.hidden = true; return; }
      pager.hidden = false;
      var prev = el("a", "btn btn-ghost" + (page <= 1 ? " off" : ""), "Newer");
      prev.href = href(cat, page - 1);
      var next = el("a", "btn btn-ghost" + (page >= pages ? " off" : ""), "Older");
      next.href = href(cat, page + 1);
      pager.append(prev, el("span", null, "Page " + page + " of " + pages), next);
    };

    var buildFilters = function (cats) {
      filters.textContent = "";
      if (cats.length < 2 && !cat) { filters.hidden = true; return; }
      filters.hidden = false;
      ["All"].concat(cats).forEach(function (c) {
        var on = (c === "All" && !cat) || c === cat;
        var b = el("button", on ? "is-on" : "", c);
        b.type = "button";
        b.addEventListener("click", function () { location.href = href(c === "All" ? "" : c, 1); });
        filters.appendChild(b);
      });
    };

    var s0 = !cat && page === 1 ? seed("articles") : null;
    if (s0 && s0.rows) render(s0.rows, s0.total != null ? s0.total : s0.rows.length);

    var url = "api/rows/articles?select=" + COLS + "&status=eq.published&sort=-published_at&limit=" + PER + "&offset=" + (page - 1) * PER;
    if (cat) url += "&category=eq." + encodeURIComponent(cat);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(d.rows || [], d.total != null ? d.total : (d.rows || []).length); })
      .catch(function () { if (!s0) { list.textContent = ""; list.appendChild(el("li", "post-empty", "Could not load articles.")); } });
    fetch("api/rows/articles/aggregate?agg=count&group=category&status=eq.published")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        buildFilters((d.rows || []).map(function (r) { return r.category; }).filter(Boolean).sort());
      })
      .catch(function () {});
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
          img.src = r.image_url; img.alt = r.image_alt || r.title; img.width = 1280; img.height = 720;
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
