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
  function makeCard(r) {
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
    return li;
  }
  // Turn bare web addresses in article text into links, and open every outside link in a new tab.
  function autoLink(root) {
    var re = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+[^\s<>"')\].,;:!?])/gi;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (n.parentNode.closest("a, pre, code, script, style")) continue;
      if (re.test(n.nodeValue)) nodes.push(n);
      re.lastIndex = 0;
    }
    nodes.forEach(function (t) {
      var text = t.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var a = document.createElement("a");
        a.href = /^www\./i.test(m[1]) ? "https://" + m[1] : m[1];
        a.textContent = m[1];
        frag.appendChild(a);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      t.parentNode.replaceChild(frag, t);
    });
    root.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href") || "";
      if (/^(https?:)?\/\//i.test(h) || /^mailto:/i.test(h)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });
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
    var q = (qs.get("q") || "").trim().replace(/[(),*]/g, " ").trim();
    var qInput = document.getElementById("blog-q");
    if (qInput) {
      qInput.value = q;
      document.getElementById("blog-search").addEventListener("submit", function (e) {
        e.preventDefault();
        location.href = href(cat, 1, qInput.value.trim());
      });
    }
    var page = Math.max(1, parseInt(qs.get("page") || "1", 10) || 1);
    var filters = document.getElementById("filters");
    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "Pages");
    pager.hidden = true;
    list.parentNode.insertBefore(pager, list.nextSibling);

    var href = function (c, p, query) {
      var u = [];
      var qq = query === undefined ? q : query;
      if (qq) u.push("q=" + encodeURIComponent(qq));
      if (c) u.push("cat=" + encodeURIComponent(c));
      if (p > 1) u.push("page=" + p);
      return "articles.html" + (u.length ? "?" + u.join("&") : "");
    };

    var render = function (rows, total) {
      list.textContent = "";
      if (!rows.length) { list.appendChild(el("li", "post-empty", q ? "No articles match your search." : cat ? "No articles in this category." : "No articles yet. Check back soon.")); pager.hidden = true; return; }
      rows.forEach(function (r) { list.appendChild(makeCard(r)); });
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

    var s0 = !cat && !q && page === 1 ? seed("articles") : null;
    if (s0 && s0.rows) render(s0.rows, s0.total != null ? s0.total : s0.rows.length);

    var url = "api/rows/articles?select=" + COLS + "&status=eq.published&sort=-published_at&limit=" + PER + "&offset=" + (page - 1) * PER;
    if (cat) url += "&category=eq." + encodeURIComponent(cat);
    if (q) url += "&or=" + encodeURIComponent("(title.like." + q + ",excerpt.like." + q + ",tags.like." + q + ")");
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
    var buildShare = function (r) {
      var om = document.querySelector('meta[name="kreova-site-origin"]');
      var origin = (om && om.content) || "https://synswer.com";
      var url = origin.replace(/\/$/, "") + "/article.html?slug=" + encodeURIComponent(r.slug);
      var wrap = el("div", "share");
      wrap.appendChild(el("span", "share-label", "Share this article"));
      var row = el("div", "share-row");
      var status = el("span", "share-status");
      status.setAttribute("role", "status");
      if (navigator.share) {
        var nb = el("button", "btn", "Share");
        nb.type = "button";
        nb.addEventListener("click", function () {
          navigator.share({ title: r.title, text: r.excerpt || r.title, url: url }).catch(function () {});
        });
        row.appendChild(nb);
      }
      var enc = encodeURIComponent;
      [["X", "https://twitter.com/intent/tweet?text=" + enc(r.title) + "&url=" + enc(url)],
       ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + enc(url)],
       ["WhatsApp", "https://wa.me/?text=" + enc(r.title + " " + url)],
       ["LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(url)]].forEach(function (s) {
        var a = el("a", "btn btn-ghost", s[0]);
        a.href = s[1]; a.target = "_blank"; a.rel = "noopener noreferrer";
        row.appendChild(a);
      });
      var cb = el("button", "btn btn-ghost", "Copy link");
      cb.type = "button";
      cb.addEventListener("click", function () {
        var done = function (ok) { status.textContent = ok ? "Link copied" : "Copy failed: " + url; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
        else done(false);
      });
      row.appendChild(cb);
      row.appendChild(status);
      wrap.appendChild(row);
      box.appendChild(wrap);
    };
    var loadRelated = function (cur) {
      var base = "api/rows/articles?select=" + COLS + "&status=eq.published&slug=neq." + encodeURIComponent(cur.slug) + "&sort=-published_at&limit=3";
      var get = function (u) { return fetch(u).then(function (r) { return r.json(); }).then(function (d) { return d.rows || []; }); };
      var same = cur.category ? get(base + "&category=eq." + encodeURIComponent(cur.category)) : Promise.resolve([]);
      same.then(function (rows) {
        if (rows.length >= 3) return rows;
        var have = rows.map(function (x) { return x.slug; });
        return get(base).then(function (more) {
          more.forEach(function (m) { if (rows.length < 3 && have.indexOf(m.slug) < 0) rows.push(m); });
          return rows;
        });
      }).then(function (rows) {
        if (!rows.length) return;
        var sec = el("section", "related");
        sec.setAttribute("aria-label", "Related articles");
        sec.appendChild(el("h2", null, "Related articles"));
        var ul = el("ul", "post-grid");
        rows.forEach(function (r) { ul.appendChild(makeCard(r)); });
        sec.appendChild(ul);
        box.parentNode.insertBefore(sec, box.nextSibling);
      }).catch(function () {});
    };
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
        loadRelated(r);
        if (r.image_url) {
          var img = el("img", "article-hero");
          img.src = r.image_url; img.alt = r.image_alt || r.title; img.width = 1280; img.height = 720;
          box.appendChild(img);
        }
        var content = el("div", "article-content");
        box.appendChild(content);
        try {
          var mod = await import("@kreova/editor");
          await mod.renderRichText(content, r.body_rich || "");
        } catch (_) {
          var tmp = document.createElement("div");
          tmp.innerHTML = "";
          content.appendChild(el("p", "post-empty", "The article text could not be displayed. Please reload the page."));
        }
        autoLink(content);
        buildShare(r);
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
