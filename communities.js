/* Synswer Communities: list, create, join/leave, rules, moderators, feed (pin/remove).
   Who may do what is enforced by the database access rules; buttons here only mirror them. */
(function () {
  var JH = { "content-type": "application/json" };
  var S = { me: null, mine: {}, prof: {}, list: [], c: null, role: null };
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function api(path, method, body) {
    var o = { method: method || "GET", credentials: "include", headers: JH };
    if (body) o.body = JSON.stringify(body);
    return fetch(path, o).then(function (r) { return r.status === 204 ? { ok: true, d: {} } : r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function ago(t) {
    var s = (Date.now() - new Date(t)) / 1000;
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago";
  }
  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
  function who(id) { var p = S.prof[id]; return p ? (p.display_name || p.username) : "Member"; }
  function loadPeople(ids) {
    ids = ids.filter(function (i, k) { return i && ids.indexOf(i) === k && !(i in S.prof); });
    if (!ids.length) return Promise.resolve();
    return api("api/rows/profiles?select=user_id,username,display_name&user_id=in." + ids.join(",") + "&limit=200").then(function (r) {
      ids.forEach(function (i) { S.prof[i] = null; });
      (r.d.rows || []).forEach(function (p) { S.prof[p.user_id] = p; });
    });
  }
  function signIn() { location.href = "login.html?next=communities.html"; }
  function isMod() { return S.role === "owner" || S.role === "moderator"; }

  // ---- list ----
  function showList() {
    S.c = null; S.role = null; history.replaceState(null, "", "communities.html");
    $("page-title").textContent = "Communities";
    var v = $("view"); v.textContent = "";
    if (!S.me) {
      var c = el("div", "sp-card"); c.appendChild(el("p", "sp-snip", "Communities are for signed-in members. Sign in to browse, join and post."));
      var a = el("button", "sp-btn", "Sign in"); a.type = "button"; a.onclick = signIn; c.appendChild(a); v.appendChild(c); return;
    }
    var q = el("input"); q.type = "search"; q.placeholder = "Search communities"; q.setAttribute("aria-label", "Search communities"); q.className = "sp-search"; q.style.marginBottom = "14px";
    var grid = el("div", "cm-cards"); v.appendChild(q); v.appendChild(grid);
    function draw() {
      var f = q.value.toLowerCase(); grid.textContent = "";
      var rows = S.list.filter(function (c) { return !f || c.name.toLowerCase().indexOf(f) >= 0 || (c.description || "").toLowerCase().indexOf(f) >= 0; });
      if (!rows.length) { grid.appendChild(el("p", "sp-empty", S.list.length ? "No communities match." : "No communities yet. Create the first one.")); return; }
      rows.forEach(function (c) {
        var card = el("div", "sp-card cm-card"), t = el("button", "sp-title", c.name); t.type = "button"; t.onclick = function () { openCommunity(c.slug); };
        card.appendChild(t);
        card.appendChild(el("p", "sp-snip", (c.description || "").slice(0, 140)));
        var m = el("div", "sp-meta"); m.appendChild(el("span", "sp-flair", c.member_count + " member" + (c.member_count === 1 ? "" : "s")));
        if (S.mine[c.id]) m.appendChild(el("span", "sp-ver", S.mine[c.id].role === "member" ? "Joined" : S.mine[c.id].role));
        card.appendChild(m); grid.appendChild(card);
      });
    }
    q.oninput = draw; draw();
  }

  // ---- community page ----
  function openCommunity(slug) {
    history.replaceState(null, "", "#c=" + slug);
    var v = $("view"); v.textContent = ""; v.appendChild(el("p", "sp-empty", "Loading..."));
    api("api/rows/communities?slug=eq." + encodeURIComponent(slug) + "&limit=1").then(function (r) {
      var c = (r.d.rows || [])[0];
      if (!c) { v.textContent = ""; v.appendChild(el("p", "sp-empty", "That community was not found.")); return; }
      S.c = c;
      return Promise.all([
        api("api/rows/community_members?community_id=eq." + c.id + "&sort=created_at&limit=200"),
        api("api/rows/community_posts?community_id=eq." + c.id + "&pinned=eq.true&sort=-created_at&limit=10"),
        api("api/rows/community_posts?community_id=eq." + c.id + "&pinned=eq.false&sort=-created_at&limit=40")
      ]).then(function (x) {
        var mem = x[0].d.rows || [], posts = (x[1].d.rows || []).concat(x[2].d.rows || []);
        var me = mem.filter(function (m) { return m.user_id === S.me.id; })[0];
        S.role = me ? me.role : null; S.mine[c.id] = me || undefined;
        return loadPeople(mem.map(function (m) { return m.user_id; }).concat(posts.map(function (p) { return p.user_id; }))).then(function () { drawCommunity(c, mem, posts); });
      });
    });
  }
  function refresh() { api("api/rows/communities?limit=200&sort=-member_count").then(function (r) { S.list = r.d.rows || []; }); openCommunity(S.c.slug); }

  function drawCommunity(c, mem, posts) {
    $("page-title").textContent = c.name;
    var v = $("view"); v.textContent = "";
    var back = el("button", "sp-btn ghost sm", "All communities"); back.type = "button"; back.onclick = function () { reloadList(); }; back.style.marginBottom = "12px"; v.appendChild(back);
    var head = el("div", "sp-card"); head.appendChild(el("p", "sp-snip", c.description || "No description yet."));
    var hm = el("div", "sp-meta"); hm.appendChild(el("span", "sp-flair", c.member_count + " member" + (c.member_count === 1 ? "" : "s"))); hm.appendChild(el("span", "", "Created " + ago(c.created_at))); head.appendChild(hm);
    var act = el("div", "sp-row");
    if (!S.role) {
      var j = el("button", "sp-btn", "Join community"); j.type = "button";
      j.onclick = function () { j.disabled = true; api("api/rows/community_members", "POST", { values: { community_id: c.id } }).then(function () { refresh(); }); };
      act.appendChild(j);
    } else if (S.role !== "owner") {
      var l = el("button", "sp-btn ghost", "Leave community"); l.type = "button";
      l.onclick = function () { var m = mem.filter(function (x) { return x.user_id === S.me.id; })[0]; api("api/rows/community_members/" + m.id, "DELETE").then(function () { refresh(); }); };
      act.appendChild(l);
    } else {
      var ed = el("button", "sp-btn ghost", "Edit description and rules"); ed.type = "button"; ed.onclick = function () { editDlg(c); }; act.appendChild(ed);
      var dl = el("button", "sp-btn ghost", "Delete community"); dl.type = "button";
      dl.onclick = function () {
        if (dl.getAttribute("data-sure") !== "1") { dl.setAttribute("data-sure", "1"); dl.textContent = "Tap again to delete for good"; return; }
        api("api/rows/communities/" + c.id, "DELETE").then(function () { reloadList(); });
      };
      act.appendChild(dl);
    }
    head.appendChild(act); v.appendChild(head);

    var grid = el("div", "cm-grid"); v.appendChild(grid);
    var main = el("div"), side = el("div", "cm-side"); grid.appendChild(main); grid.appendChild(side);

    // posting
    if (S.role) {
      var f = el("form", "sp-card"), ta = el("textarea"), er = el("p", "sp-err"), go = el("button", "sp-btn", "Post");
      ta.maxLength = 3000; ta.placeholder = "Share something with " + c.name; ta.setAttribute("aria-label", "New post"); go.type = "submit";
      f.appendChild(ta); f.appendChild(er); f.appendChild(go); main.appendChild(f);
      f.onsubmit = function (e) {
        e.preventDefault(); var t = ta.value.trim(); if (!t) return; go.disabled = true; er.textContent = "";
        api("api/rows/community_posts", "POST", { values: { community_id: c.id, content: t } }).then(function (r) {
          if (!r.ok) { er.textContent = r.d.error || "Could not post."; go.disabled = false; return; } openCommunity(c.slug);
        });
      };
    } else main.appendChild(el("p", "sp-empty", "Join this community to post."));
    var feed = el("ul", "sp-feed"); feed.style.marginTop = "12px"; main.appendChild(feed);
    if (!posts.length) feed.appendChild(el("li", "sp-empty", "No posts yet."));
    posts.forEach(function (p) {
      var li = el("li", "sp-thread"), b = el("div", "sp-body"), m = el("div", "sp-meta");
      m.appendChild(el("b", "", who(p.user_id))); m.appendChild(el("span", "", ago(p.created_at)));
      if (p.pinned) m.appendChild(el("span", "sp-flair", "Pinned"));
      b.appendChild(m); b.appendChild(el("p", "sp-snip", p.content));
      var r = el("div", "sp-row"); r.style.marginTop = "0";
      if (isMod()) {
        var pn = el("button", "sp-btn ghost sm", p.pinned ? "Unpin" : "Pin"); pn.type = "button";
        pn.onclick = function () { api("api/rows/community_posts/" + p.id, "PATCH", { values: { pinned: !p.pinned } }).then(function () { openCommunity(c.slug); }); };
        r.appendChild(pn);
      }
      if (isMod() || p.user_id === S.me.id) {
        var rm = el("button", "sp-btn ghost sm", "Remove"); rm.type = "button";
        rm.onclick = function () { if (rm.getAttribute("data-sure") !== "1") { rm.setAttribute("data-sure", "1"); rm.textContent = "Tap again"; return; } api("api/rows/community_posts/" + p.id, "DELETE").then(function () { openCommunity(c.slug); }); };
        r.appendChild(rm);
      }
      b.appendChild(r); li.appendChild(b); feed.appendChild(li);
    });

    // rules and people
    var rc = el("div", "sp-card"); rc.appendChild(el("h3", "", "Rules"));
    rc.appendChild(el("p", "sp-snip", c.rules || "The owner has not set rules yet. Be kind and stay on topic.")); side.appendChild(rc);
    var mc = el("div", "sp-card"); mc.appendChild(el("h3", "", "Members (" + mem.length + ")"));
    var ul = el("ul", "sp-contrib"); mc.appendChild(ul);
    var order = { owner: 0, moderator: 1, member: 2 };
    mem.slice().sort(function (a, b) { return order[a.role] - order[b.role]; }).slice(0, 50).forEach(function (m) {
      var li = el("li"), nm = el("span", "", who(m.user_id) + (m.role !== "member" ? " (" + m.role + ")" : "")); li.appendChild(nm);
      var box = el("span", "sp-row"); box.style.margin = "0";
      if (S.role === "owner" && m.role !== "owner") {
        var pr = el("button", "sp-btn ghost sm", m.role === "member" ? "Make mod" : "Remove mod"); pr.type = "button";
        pr.onclick = function () { api("api/rows/community_members/" + m.id, "PATCH", { values: { role: m.role === "member" ? "moderator" : "member" } }).then(function () { openCommunity(c.slug); }); };
        box.appendChild(pr);
      }
      if ((S.role === "owner" && m.role !== "owner") || (S.role === "moderator" && m.role === "member")) {
        var kb = el("button", "sp-btn ghost sm", "Kick"); kb.type = "button";
        kb.onclick = function () { if (kb.getAttribute("data-sure") !== "1") { kb.setAttribute("data-sure", "1"); kb.textContent = "Sure?"; return; } api("api/rows/community_members/" + m.id, "DELETE").then(function () { openCommunity(c.slug); }); };
        box.appendChild(kb);
      }
      li.appendChild(box); ul.appendChild(li);
    });
    side.appendChild(mc);
  }

  // ---- dialogs ----
  function form(title, fields, submit, onDone) {
    var d = $("dlg"); d.textContent = ""; var f = el("form"); f.appendChild(el("h2", "", title)); var inputs = {};
    fields.forEach(function (x) {
      f.appendChild(el("label", "", x.label)); var i = el(x.area ? "textarea" : "input"); i.maxLength = x.max; i.value = x.value || ""; if (x.ph) i.placeholder = x.ph; inputs[x.key] = i; f.appendChild(i);
    });
    var er = el("p", "sp-err"), row = el("div", "sp-row"), go = el("button", "sp-btn", "Save"), no = el("button", "sp-btn ghost", "Cancel"); go.type = "submit"; no.type = "button";
    no.onclick = function () { d.close(); }; row.appendChild(go); row.appendChild(no); f.appendChild(er); f.appendChild(row); d.appendChild(f);
    f.onsubmit = function (e) {
      e.preventDefault(); er.textContent = ""; go.disabled = true;
      var vals = {}; Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].value.trim(); });
      submit(vals).then(function (r) { if (!r.ok) { er.textContent = r.d.error || "Could not save."; go.disabled = false; return; } d.close(); onDone(r); });
    };
    d.showModal(); (inputs[fields[0].key]).focus();
  }
  function createDlg() {
    if (!S.me) { signIn(); return; }
    form("Create a community", [
      { key: "name", label: "Name", max: 60, ph: "e.g. Quantum Curious" },
      { key: "description", label: "What is it about?", max: 400, area: true },
      { key: "rules", label: "Rules (one per line)", max: 1500, area: true, value: "1. Be respectful.\n2. Stay on topic.\n3. No spam." }
    ], function (v) {
      var slug = slugify(v.name);
      if (v.name.length < 3 || slug.length < 3) return Promise.resolve({ ok: false, d: { error: "Give it a name of at least 3 letters." } });
      return api("api/rows/communities", "POST", { values: { slug: slug, name: v.name, description: v.description, rules: v.rules } }).then(function (r) {
        if (!r.ok && /unique|duplicate|exists/i.test(r.d.error || "")) r.d.error = "A community with that name already exists.";
        return r;
      });
    }, function (r) { api("api/rows/community_members?user_id=eq." + S.me.id + "&limit=200").then(function (m) { S.mine = {}; (m.d.rows || []).forEach(function (x) { S.mine[x.community_id] = x; }); openCommunity(r.d.row.slug); }); });
  }
  function editDlg(c) {
    form("Edit community", [
      { key: "description", label: "Description", max: 400, area: true, value: c.description },
      { key: "rules", label: "Rules", max: 1500, area: true, value: c.rules }
    ], function (v) { return api("api/rows/communities/" + c.id, "PATCH", { values: v }); }, function () { openCommunity(c.slug); });
  }

  function reloadList() {
    return Promise.all([api("api/rows/communities?limit=200&sort=-member_count"), api("api/rows/community_members?user_id=eq." + S.me.id + "&limit=200")]).then(function (r) {
      S.list = r[0].d.rows || []; S.mine = {}; (r[1].d.rows || []).forEach(function (m) { S.mine[m.community_id] = m; }); showList();
    });
  }

  $("new-community").onclick = createDlg;
  fetch("api/auth/me", { credentials: "include" }).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (d) {
    S.me = d.user || null;
    if (!S.me) { showList(); return; }
    var m = /^#c=([a-z0-9-]+)$/.exec(location.hash);
    return reloadList().then(function () { if (m) openCommunity(m[1]); });
  });
})();
