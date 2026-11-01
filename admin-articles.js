import { ready, cleanHtml } from "@kreova/editor";

const $ = (id) => document.getElementById(id);
let editing = null; // row being edited, or null for a new article
let imageUrl = "";

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function toLocalInput(d) {
  const dt = d ? new Date(d) : new Date();
  if (isNaN(dt)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate()) + "T" + p(dt.getHours()) + ":" + p(dt.getMinutes());
}
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

async function gate() {
  let user = null;
  try { user = (await (await fetch("api/auth/me", { credentials: "include" })).json()).user; } catch (_) {}
  if (!user || user.role !== "admin") {
    location.replace("login.html?next=admin-articles.html");
    return false;
  }
  document.body.style.display = "";
  return true;
}

function showList() { $("edit-view").hidden = true; $("list-view").hidden = false; loadList(); window.scrollTo(0, 0); }

async function loadList() {
  const ul = $("cms-list");
  const res = await fetch("api/rows/articles?select=id,title,slug,status,category,published_at,updated_at&sort=-updated_at&limit=200", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  ul.textContent = "";
  const rows = data.rows || [];
  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No articles yet. Press New article to write your first one.";
    ul.appendChild(li);
    return;
  }
  rows.forEach((r) => {
    const li = document.createElement("li");
    li.className = "cms-row";
    const t = document.createElement("div");
    t.className = "t";
    const b = document.createElement("b");
    b.textContent = r.title;
    const s = document.createElement("span");
    s.textContent = (r.category ? r.category + " - " : "") + (r.status === "published" ? "Published " + fmtDate(r.published_at) : "Updated " + fmtDate(r.updated_at));
    t.append(b, s);
    const badge = document.createElement("span");
    badge.className = "badge" + (r.status === "published" ? " pub" : "");
    badge.textContent = r.status === "published" ? "Published" : "Draft";
    const edit = document.createElement("button");
    edit.type = "button"; edit.className = "btn btn-ghost"; edit.textContent = "Edit";
    edit.addEventListener("click", () => openEditor(r.id));
    const del = document.createElement("button");
    del.type = "button"; del.className = "btn btn-ghost"; del.textContent = "Delete";
    del.addEventListener("click", () => askDelete(r));
    li.append(t, badge, edit, del);
    ul.appendChild(li);
  });
}

function setImage(url) {
  imageUrl = url || "";
  const prev = $("f-img-prev");
  prev.hidden = !imageUrl;
  if (imageUrl) prev.src = imageUrl;
  $("f-img-clear").hidden = !imageUrl;
}

async function openEditor(id) {
  $("f-error").textContent = "";
  $("f-ok").textContent = "";
  await ready;
  const ed = $("body").kreovaEditor;
  editing = null;
  if (id) {
    const res = await fetch("api/rows/articles/" + id, { credentials: "include" });
    let row = null;
    const d = await res.json().catch(() => ({}));
    row = d.row || (d.rows && d.rows[0]) || null;
    if (!row) {
      const r2 = await (await fetch("api/rows/articles?id=eq." + id + "&limit=1", { credentials: "include" })).json();
      row = (r2.rows || [])[0];
    }
    if (!row) { $("f-error").textContent = "Could not load that article."; return; }
    editing = row;
  }
  $("edit-title").textContent = editing ? "Edit article" : "New article";
  $("f-title").value = editing ? editing.title : "";
  $("f-slug").value = editing ? editing.slug : "";
  $("f-cat").value = editing ? editing.category : "";
  $("f-tags").value = editing ? editing.tags : "";
  $("f-excerpt").value = editing ? editing.excerpt : "";
  $("f-alt").value = editing ? editing.image_alt || "" : "";
  $("f-status").value = editing ? editing.status : "draft";
  $("f-date").value = toLocalInput(editing && editing.published_at ? editing.published_at : null);
  $("f-img-file").value = "";
  setImage(editing ? editing.image_url : "");
  ed.setHtml(editing ? editing.body_rich || "" : "");
  const vl = $("view-link");
  vl.hidden = !(editing && editing.status === "published");
  if (editing) vl.href = "article.html?slug=" + encodeURIComponent(editing.slug);
  $("list-view").hidden = true;
  $("edit-view").hidden = false;
  window.scrollTo(0, 0);
}

async function save(e) {
  e.preventDefault();
  const err = $("f-error"), ok = $("f-ok"), btn = $("save-btn");
  err.textContent = ""; ok.textContent = "";
  await ready;
  const html = $("body").kreovaEditor.getHtml();
  const title = $("f-title").value.trim();
  const slug = slugify($("f-slug").value.trim() || title);
  if (!title || !slug) { err.textContent = "Please add a title."; return; }
  let excerpt = $("f-excerpt").value.trim();
  if (!excerpt) {
    const tmp = document.createElement("div");
    tmp.innerHTML = await cleanHtml(html);
    excerpt = (tmp.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }
  const status = $("f-status").value;
  let published_at = null;
  if (status === "published") {
    const v = $("f-date").value;
    published_at = v ? new Date(v).toISOString() : new Date().toISOString();
  }
  const values = {
    title, slug, excerpt, body_rich: html, image_url: imageUrl || null, image_alt: $("f-alt").value.trim(),
    category: $("f-cat").value.trim(), tags: $("f-tags").value.trim(),
    status, published_at, updated_at: new Date().toISOString()
  };
  btn.disabled = true;
  try {
    const res = await fetch(editing ? "api/rows/articles/" + editing.id : "api/rows/articles", {
      method: editing ? "PATCH" : "POST", credentials: "include",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ values })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      err.textContent = /unique|duplicate/i.test(data.error || "") ? "That address is already used by another article. Change the slug." : (data.error || "Could not save.");
      return;
    }
    editing = data.row || editing;
    $("f-slug").value = slug;
    ok.textContent = status === "published" ? "Saved and live." : "Saved as a draft.";
    $("edit-title").textContent = "Edit article";
    const vl = $("view-link");
    vl.hidden = status !== "published";
    vl.href = "article.html?slug=" + encodeURIComponent(slug);
  } catch (_) {
    err.textContent = "Could not connect. Try again.";
  } finally { btn.disabled = false; }
}

async function uploadImage() {
  const f = $("f-img-file").files[0];
  if (!f) return;
  $("f-error").textContent = "";
  const fd = new FormData();
  fd.append("folder", "articles");
  fd.append("file", f);
  try {
    const res = await fetch("api/storage/upload", { method: "POST", credentials: "include", body: fd });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Upload failed");
    setImage(d.url);
  } catch (e) { $("f-error").textContent = e.message || "Upload failed."; }
}

function askDelete(r) {
  const dlg = $("confirm-dlg");
  $("confirm-text").textContent = "\"" + r.title + "\" will be removed for good.";
  const no = $("confirm-no"), yes = $("confirm-yes");
  const close = () => { dlg.close(); yes.onclick = null; };
  no.onclick = close;
  yes.onclick = async () => {
    yes.disabled = true;
    await fetch("api/rows/articles/" + r.id, { method: "DELETE", credentials: "include" });
    yes.disabled = false;
    close();
    loadList();
  };
  dlg.showModal();
  no.focus();
}

// Links inside the editor open in a new tab when clicked.
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest("a[href]");
  if (!a || !a.closest("#edit-view") || a.closest(".cms-actions")) return;
  if (!a.closest("[contenteditable], .trumbowyg-editor, .kreova-editor")) return;
  var h = a.getAttribute("href");
  if (!h || h === "#") return;
  e.preventDefault();
  window.open(a.href, "_blank", "noopener");
});

(async function init() {
  if (!(await gate())) return;
  $("new-btn").addEventListener("click", () => openEditor(null));
  $("back-btn").addEventListener("click", showList);
  $("cms-form").addEventListener("submit", save);
  $("f-img-file").addEventListener("change", uploadImage);
  $("f-img-clear").addEventListener("click", () => { setImage(""); $("f-img-file").value = ""; });
  loadList();
})();
