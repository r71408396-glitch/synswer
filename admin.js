(function () {
  var JSON_H = { "content-type": "application/json" };
  var tab = "reports";
  var me = null;

  function $(id) { return document.getElementById(id); }
  function handle(id) { return "user_" + String(id).replace(/-/g, "").slice(0, 8); }
  function when(ts) {
    try { return new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch (_) { return ""; }
  }
  function api(url, method, values, extra) {
    var opt = { method: method || "GET", credentials: "include" };
    if (values) {
      opt.headers = JSON_H;
      var b = { values: values };
      if (extra) for (var k in extra) b[k] = extra[k];
      opt.body = JSON.stringify(b);
    }
    return fetch(url, opt).then(function (r) {
      if (r.status === 204) return { ok: true, d: {} };
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
    });
  }
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function ask(title, text, yes) {
    return new Promise(function (resolve) {
      var dlg = $("confirm-dlg");
      $("confirm-title").textContent = title;
      $("confirm-text").textContent = text;
      $("confirm-yes").textContent = yes || "Confirm";
      function done(v) { dlg.removeEventListener("close", onClose); $("confirm-yes").onclick = null; $("confirm-no").onclick = null; if (dlg.open) dlg.close(); resolve(v); }
      function onClose() { done(false); }
      dlg.addEventListener("close", onClose);
      $("confirm-yes").onclick = function () { done(true); };
      $("confirm-no").onclick = function () { done(false); };
      dlg.showModal();
      $("confirm-no").focus();
    });
  }

  function btn(label, cls, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "act " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function setStatus(p, status) {
    return api("api/rows/posts/" + p.id, "PATCH", { status: status, reviewed_at: new Date().toISOString() }).then(function (r) {
      if (!r.ok) toast(r.d.error || "Could not update the post.");
      else toast(status === "approved" ? "Post restored" : "Post hidden");
      if (status === "restricted") return dismissReports(p.id, "actioned").then(refresh);
      return refresh();
    });
  }
  function dismissReports(postId, status) {
    return api("api/rows/reports?post_id=eq." + postId + "&status=eq.open&select=id&limit=200").then(function (r) {
      var ups = (r.d.rows || []).map(function (x) { return { id: x.id, values: { status: status } }; });
      if (!ups.length) return true;
      return fetch("api/rows/reports/bulk", { method: "PATCH", credentials: "include", headers: JSON_H, body: JSON.stringify({ updates: ups }) });
    });
  }
  function deletePost(p) {
    return ask("Delete this post?", "The post, its replies and votes are removed for good.", "Delete").then(function (ok) {
      if (!ok) return;
      return api("api/rows/posts/" + p.id, "DELETE").then(function (r) {
        if (!r.ok) toast(r.d.error || "Could not delete the post.");
        else toast("Post deleted");
        return refresh();
      });
    });
  }

  function setBan(userId, banned) {
    return api("api/rows/member_standing?user_id=eq." + userId + "&limit=1").then(function (r) {
      var row = (r.d.rows || [])[0];
      var values = { status: banned ? "banned" : "active" };
      if (row) return api("api/rows/member_standing/" + row.id, "PATCH", values);
      return api("api/rows/member_standing", "POST", { user_id: userId, status: values.status });
    }).then(function (r) {
      if (!r.ok) { toast(r.d.error || "Could not change the ban."); return null; }
      if (!banned) return true;
      // hide everything they have waiting or live
      return api("api/rows/posts?user_id=eq." + userId + "&status=in.pending,approved&select=id&limit=200").then(function (pr) {
        var ups = (pr.d.rows || []).map(function (x) { return { id: x.id, values: { status: "restricted", reviewed_at: new Date().toISOString() } }; });
        if (!ups.length) return true;
        return fetch("api/rows/posts/bulk", { method: "PATCH", credentials: "include", headers: JSON_H, body: JSON.stringify({ updates: ups }) }).then(function () { return true; });
      });
    });
  }
  function banFlow(userId) {
    return ask("Ban " + handle(userId) + "?", "They will not be able to post, reply or vote, and all their live and pending posts are hidden. You can unban them any time.", "Ban user").then(function (ok) {
      if (!ok) return;
      return setBan(userId, true).then(function (done) { if (done) toast("User banned"); return refresh(); });
    });
  }

  function postCard(p, reps) {
    var li = document.createElement("li");
    li.className = "post";
    var meta = document.createElement("div");
    meta.className = "meta";
    var who = document.createElement("b");
    who.textContent = handle(p.user_id);
    who.title = p.user_id;
    var t = document.createElement("span");
    t.textContent = when(p.created_at);
    meta.appendChild(who);
    meta.appendChild(t);
    var body = document.createElement("p");
    body.textContent = p.content;
    li.appendChild(meta);
    li.appendChild(body);
    var bar = document.createElement("div");
    bar.className = "actions";
    if (reps && reps.length) {
      var rl = document.createElement("p");
      rl.className = "meta";
      var counts = {};
      reps.forEach(function (x) { counts[x.reason] = (counts[x.reason] || 0) + 1; });
      rl.textContent = reps.length + " report" + (reps.length === 1 ? "" : "s") + ": " + Object.keys(counts).map(function (k) { return k + " (" + counts[k] + ")"; }).join(", ");
      li.insertBefore(rl, body.nextSibling);
      bar.appendChild(btn("Dismiss reports", "on", function () { dismissReports(p.id, "dismissed").then(function () { toast("Reports dismissed"); refresh(); }); }));
    }
    if (p.status !== "approved") bar.appendChild(btn("Restore", "on", function () { setStatus(p, "approved"); }));
    else bar.appendChild(btn("Hide", "", function () { setStatus(p, "restricted"); }));
    bar.appendChild(btn("Ban author", "del-soft", function () { banFlow(p.user_id); }));
    var del = btn("Delete", "del", function () { deletePost(p); });
    bar.appendChild(del);
    li.appendChild(bar);
    return li;
  }

  function dismissReplyReports(replyId) {
    return api("api/rows/reply_reports?reply_id=eq." + replyId + "&status=eq.open&select=id&limit=200").then(function (r) {
      var ups = (r.d.rows || []).map(function (x) { return { id: x.id, values: { status: "dismissed" } }; });
      if (!ups.length) return true;
      return fetch("api/rows/reply_reports/bulk", { method: "PATCH", credentials: "include", headers: JSON_H, body: JSON.stringify({ updates: ups }) });
    });
  }
  function replyCard(rp, reps) {
    var li = document.createElement("li");
    li.className = "post";
    var meta = document.createElement("div");
    meta.className = "meta";
    var who = document.createElement("b");
    who.textContent = handle(rp.user_id);
    who.title = rp.user_id;
    var t = document.createElement("span");
    t.textContent = "Reply - " + when(rp.created_at);
    meta.appendChild(who);
    meta.appendChild(t);
    var body = document.createElement("p");
    body.textContent = rp.content;
    li.appendChild(meta);
    li.appendChild(body);
    var rl = document.createElement("p");
    rl.className = "meta";
    var counts = {};
    (reps || []).forEach(function (x) { counts[x.reason] = (counts[x.reason] || 0) + 1; });
    rl.textContent = (reps || []).length + " report" + ((reps || []).length === 1 ? "" : "s") + ": " + Object.keys(counts).map(function (k) { return k + " (" + counts[k] + ")"; }).join(", ");
    li.appendChild(rl);
    var bar = document.createElement("div");
    bar.className = "actions";
    bar.appendChild(btn("Dismiss reports", "on", function () { dismissReplyReports(rp.id).then(function () { toast("Reports dismissed"); refresh(); }); }));
    bar.appendChild(btn("Ban author", "del-soft", function () { banFlow(rp.user_id); }));
    bar.appendChild(btn("Delete reply", "del", function () {
      ask("Delete this reply?", "The reply and its reports are removed for good.", "Delete").then(function (ok) {
        if (!ok) return;
        api("api/rows/post_replies/" + rp.id, "DELETE").then(function (r) {
          if (!r.ok) toast(r.d.error || "Could not delete the reply."); else toast("Reply deleted");
          refresh();
        });
      });
    }));
    li.appendChild(bar);
    return li;
  }

  function userCard(u, count, prof) {
    var li = document.createElement("li");
    li.className = "post user-row";
    var meta = document.createElement("div");
    meta.className = "meta";
    var who = document.createElement("b");
    who.textContent = prof ? "@" + prof.username + (prof.verified ? " (verified)" : "") : handle(u.user_id);
    who.title = u.user_id;
    var t = document.createElement("span");
    t.textContent = "Joined community " + when(u.created_at);
    meta.appendChild(who);
    meta.appendChild(t);
    var info = document.createElement("p");
    info.textContent = count + " post" + (count === 1 ? "" : "s") + " - " + (u.status === "banned" ? "Banned" : "Active");
    li.appendChild(meta);
    li.appendChild(info);
    var bar = document.createElement("div");
    bar.className = "actions";
    if (u.status === "banned") {
      bar.appendChild(btn("Unban", "on", function () { setBan(u.user_id, false).then(function (ok) { if (ok) toast("User unbanned"); refresh(); }); }));
    } else if (u.user_id !== me.id) {
      bar.appendChild(btn("Ban user", "del-soft", function () { banFlow(u.user_id); }));
    }
    if (prof) {
      bar.appendChild(btn(prof.verified ? "Remove verified badge" : "Verify", prof.verified ? "" : "on", function () {
        api("api/rows/profiles/" + prof.id, "PATCH", { verified: !prof.verified }).then(function (r) {
          if (!r.ok) toast(r.d.error || "Could not change the badge.");
          else toast(prof.verified ? "Badge removed" : "Verified badge given");
          refresh();
        });
      }));
    }
    li.appendChild(bar);
    return li;
  }

  function empty(msg) {
    var li = document.createElement("li");
    li.className = "empty";
    li.textContent = msg;
    return li;
  }

  function stats() {
    return Promise.all([
      api("api/rows/posts/aggregate?agg=count&group=status"),
      api("api/rows/member_standing/aggregate?agg=count&group=status"),
      api("api/rows/reports/aggregate?agg=count&status=eq.open"),
      api("api/rows/reply_reports/aggregate?agg=count&status=eq.open")
    ]).then(function (r) {
      var c = { pending: 0, approved: 0, hidden: 0, banned: 0 };
      ((r[2].d.rows || [])[0] || {}).count && (c.pending = r[2].d.rows[0].count);
      ((r[3].d.rows || [])[0] || {}).count && (c.pending += r[3].d.rows[0].count);
      (r[0].d.rows || []).forEach(function (x) {
        if (x.status === "approved") c.approved = x.count;
        else c.hidden += x.count;
      });
      (r[1].d.rows || []).forEach(function (x) { if (x.status === "banned") c.banned = x.count; });
      $("s-pending").textContent = c.pending;
      $("s-approved").textContent = c.approved;
      $("s-hidden").textContent = c.hidden;
      $("s-banned").textContent = c.banned;
    });
  }

  function refresh() {
    var list = $("list");
    stats();
    if (tab === "users") {
      return Promise.all([
        api("api/rows/member_standing?sort=-created_at&limit=200"),
        api("api/rows/posts/aggregate?agg=count&group=user_id&limit=200"),
        api("api/rows/profiles?select=id,user_id,username,verified&limit=200")
      ]).then(function (r) {
        var counts = {}, profs = {};
        (r[2].d.rows || []).forEach(function (p) { profs[p.user_id] = p; });
        (r[1].d.rows || []).forEach(function (x) { counts[x.user_id] = x.count; });
        var rows = r[0].d.rows || [];
        list.innerHTML = "";
        if (!rows.length) { list.appendChild(empty("No community members yet.")); return; }
        rows.sort(function (a, b) { return (a.status === "banned" ? 0 : 1) - (b.status === "banned" ? 0 : 1); });
        rows.forEach(function (u) { list.appendChild(userCard(u, counts[u.user_id] || 0, profs[u.user_id])); });
      });
    }
    if (tab === "reports") {
      return Promise.all([
        api("api/rows/reports?status=eq.open&sort=created_at&limit=200"),
        api("api/rows/reply_reports?status=eq.open&sort=created_at&limit=200")
      ]).then(function (both) {
        var reps = both[0].d.rows || [], byPost = {}, ids = [];
        reps.forEach(function (x) { if (!byPost[x.post_id]) { byPost[x.post_id] = []; ids.push(x.post_id); } byPost[x.post_id].push(x); });
        var rreps = both[1].d.rows || [], byReply = {}, rids = [];
        rreps.forEach(function (x) { if (!byReply[x.reply_id]) { byReply[x.reply_id] = []; rids.push(x.reply_id); } byReply[x.reply_id].push(x); });
        list.innerHTML = "";
        if (!ids.length && !rids.length) { list.appendChild(empty("No open reports.")); return; }
        return Promise.all([
          ids.length ? api("api/rows/posts?id=in." + ids.slice(0, 100).join(",") + "&limit=100") : { d: {} },
          rids.length ? api("api/rows/post_replies?id=in." + rids.slice(0, 100).join(",") + "&limit=100") : { d: {} }
        ]).then(function (pr) {
          var posts = pr[0].d.rows || [], replies = pr[1].d.rows || [];
          if (!posts.length && !replies.length) { list.appendChild(empty("No open reports.")); return; }
          posts.forEach(function (p) { list.appendChild(postCard(p, byPost[p.id])); });
          replies.forEach(function (rp) { list.appendChild(replyCard(rp, byReply[rp.id])); });
        });
      }).catch(function () { list.innerHTML = ""; list.appendChild(empty("Could not load.")); });
    }
    var filter = tab === "approved" ? "" : "status=in.rejected,restricted&";
    return api("api/rows/posts?" + filter + "sort=-created_at&limit=100").then(function (r) {
      var rows = r.d.rows || [];
      list.innerHTML = "";
      if (!rows.length) {
        list.appendChild(empty(tab === "approved" ? "No posts yet." : "No hidden posts."));
        return;
      }
      rows.forEach(function (p) { list.appendChild(postCard(p)); });
    }).catch(function () { list.innerHTML = ""; list.appendChild(empty("Could not load.")); });
  }

  document.querySelector(".admin-tabs").addEventListener("click", function (e) {
    var m = e.target.getAttribute && e.target.getAttribute("data-tab");
    if (!m) return;
    tab = m;
    document.querySelectorAll(".admin-tabs .tab").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-tab") === m); });
    refresh();
  });

  $("signout").addEventListener("click", function () {
    fetch("api/auth/logout", { method: "POST", credentials: "include" }).finally(function () { location.replace("login.html"); });
  });

  fetch("api/auth/me", { credentials: "include" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.user) { location.replace("login.html?next=admin.html"); return; }
      if (d.user.role !== "admin") { location.replace("community.html"); return; }
      me = d.user;
      var name = me.name || me.email || "Admin";
      $("p-name").textContent = name;
      $("p-email").textContent = me.email || "";
      $("p-initial").textContent = name.charAt(0).toUpperCase();
      $("p-id").textContent = handle(me.id);
      $("p-id").title = me.id;
      document.body.style.display = "";
      refresh();
    })
    .catch(function () { location.replace("login.html?next=admin.html"); });
})();
