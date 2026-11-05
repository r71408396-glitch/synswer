// Ads (shared): Google AdSense loads ONLY after the visitor taps Accept on the cookie bar.
// Paste your AdSense ad unit id into SLOT to show the in-page units (games, Social).
window.SynswerAds = (function () {
  var CLIENT = "ca-pub-8679733413041334";
  var SLOT = "7497253509";
  var blocked = /\/(login|signup|forgot|reset|admin)(\.html)?$/.test(location.pathname);
  var loaded = false;
  function ok() { try { return localStorage.getItem("synswer-consent") === "accepted" && !blocked; } catch (_) { return false; } }
  function fill(box) {
    if (!box || !SLOT || box.getAttribute("data-filled")) return false;
    box.setAttribute("data-filled", "1");
    box.hidden = false;
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", CLIENT);
    ins.setAttribute("data-ad-slot", SLOT);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    box.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
    return true;
  }
  function load() {
    if (loaded || !ok()) return;
    loaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
    document.head.appendChild(s);
    document.querySelectorAll("[data-ad-box]").forEach(fill);
  }
  function clear(box) { box.innerHTML = ""; box.removeAttribute("data-filled"); box.hidden = true; }
  load();
  return { ok: ok, load: load, fill: function (box) { load(); return ok() && fill(box); }, clear: clear };
})();

// Cookie consent (shared by every page)
(function () {
  var banner = document.getElementById("cookie");
  if (!banner) return;
  banner.addEventListener("click", function (e) {
    var choice = e.target.getAttribute && e.target.getAttribute("data-consent");
    if (!choice) return;
    try { localStorage.setItem("synswer-consent", choice); } catch (_) {}
    document.documentElement.classList.add("consent-set");
    if (choice === "accepted") window.SynswerAds.load();
  });
})();

// Top-right menu (shared)
(function () {
  var t = document.getElementById("tm-toggle"), m = document.getElementById("tm-menu");
  if (!t || !m) return;
  function set(open) {
    m.hidden = !open;
    t.setAttribute("aria-expanded", open ? "true" : "false");
    t.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  // The open menu owns one history entry, so the phone's Back button closes the menu instead of leaving the page.
  function open() {
    if (!m.hidden) return;
    set(true);
    try { window.history.pushState({ synMenu: 1 }, "", location.href); } catch (_) {}
  }
  function close() {
    if (m.hidden) return;
    set(false);
    try { if (window.history.state && window.history.state.synMenu) window.history.back(); } catch (_) {}
  }
  t.addEventListener("click", function (e) { e.stopPropagation(); if (m.hidden) open(); else close(); });
  document.addEventListener("click", function (e) { if (!m.hidden && !m.contains(e.target)) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  window.addEventListener("popstate", function () { if (!m.hidden) set(false); });
  window.addEventListener("pageshow", function () { set(false); });
  window.synswerOpenMenu = open;

  // A page opened with no previous page (installed app, typed address) gets the homepage underneath it,
  // so Back goes home instead of exiting the app.
  try {
    var here = location.pathname.split("/").pop();
    var isHome = here === "" || here === "index.html";
    if (!isHome && !document.referrer && window.history.length <= 2 && !(window.history.state && (window.history.state.synPage || window.history.state.synHome))) {
      var cur = location.href;
      window.history.replaceState({ synHome: 1 }, "", new URL("index.html", cur).href);
      window.history.pushState({ synPage: 1 }, "", cur);
    }
  } catch (_) {}
})();

// Who is signed in (shared): updates the account link in the corner
window.synswerUser = null;
window.synswerUserReady = fetch("api/auth/me", { credentials: "include" })
  .then(function (r) { return r.json(); })
  .then(function (d) {
    window.synswerUser = d && d.user ? d.user : null;
    var adminLink = document.getElementById("top-admin-link");
    if (adminLink && window.synswerUser && window.synswerUser.role === "admin") adminLink.hidden = false;
    var link = document.getElementById("account-link");
    if (link && window.synswerUser) {
      var lbl = document.getElementById("account-label");
      if (lbl) lbl.textContent = "Sign out"; else link.textContent = "Sign out";
      link.setAttribute("href", "#");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        fetch("api/auth/logout", { method: "POST", credentials: "include" }).then(function () { location.reload(); });
      });
    }
    return window.synswerUser;
  })
  .catch(function () { return null; });

// Ask Synswer
(function () {
  var form = document.getElementById("ask-form");
  if (!form) return;

  var input = document.getElementById("ask-input");
  var submit = document.getElementById("ask-submit");
  var errorEl = document.getElementById("ask-error");
  var home = document.getElementById("home-view");
  var answerView = document.getElementById("answer-view");
  var qEl = document.getElementById("answer-q");
  var bodyEl = document.getElementById("answer-body");
  var againBtn = document.getElementById("ask-again");
  var orb = document.getElementById("orb");
  var memoryEl = document.getElementById("memory-note");
  var forgetBtn = document.getElementById("memory-forget");

  // Short-term memory: the conversation of this visit
  var history = [];
  var lastAnswer = "";
  var attachment = null; // { name, text } or { name, file }

  var fileInput = document.getElementById("ask-file");
  var photoInput = document.getElementById("ask-photo");
  var chip = document.getElementById("file-chip");
  var chipName = document.getElementById("file-name");
  var chipClear = document.getElementById("file-clear");
  var micBtn = document.getElementById("ask-mic");
  var micLabel = document.getElementById("ask-mic-label");
  var dlMd = document.getElementById("dl-md");
  var dlCsv = document.getElementById("dl-csv");
  var welcomeEl = document.getElementById("welcome-back");

  // Phone photos are often 5 MB or more: scale to 1600px JPEG so the upload and the AI always accept them.
  function shrinkImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.naturalWidth * s));
        c.height = Math.max(1, Math.round(img.naturalHeight * s));
        var g = c.getContext("2d");
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { resolve(b); }, "image/jpeg", 0.85);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file.size <= 5 * 1024 * 1024 && /^image\/(jpeg|png|webp|gif)$/.test(file.type) ? file : null);
      };
      img.src = url;
    });
  }

  function setAttachment(a) {
    attachment = a;
    chip.hidden = !a;
    chipName.textContent = a ? a.name : "";
    var thumb = document.getElementById("file-thumb");
    if (thumb) {
      if (thumb.src && thumb.src.indexOf("blob:") === 0) URL.revokeObjectURL(thumb.src);
      if (a && a.file) { thumb.src = URL.createObjectURL(a.file); thumb.hidden = false; }
      else { thumb.removeAttribute("src"); thumb.hidden = true; }
    }
    if (!a) { fileInput.value = ""; photoInput.value = ""; }
  }
  function onPick(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    errorEl.textContent = "";
    if (f.type.indexOf("image/") === 0) {
      if (f.size > 25 * 1024 * 1024) { errorEl.textContent = "Images must be under 25 MB."; e.target.value = ""; return; }
      if (!window.synswerUser) { errorEl.innerHTML = 'Sign in to analyze images. <a href="login.html">Sign in</a>'; e.target.value = ""; return; }
      var picked = e.target;
      shrinkImage(f).then(function (blob) {
        if (!blob) { errorEl.textContent = "Could not read that image. Try a JPEG or PNG."; picked.value = ""; return; }
        setAttachment({ name: f.name || "photo", file: blob, path: null });
      });
    } else if (/\.pdf$/i.test(f.name)) {
      errorEl.textContent = "PDF reading is not available yet. Paste the text or upload it as .txt or .csv.";
      e.target.value = "";
    } else {
      if (f.size > 2 * 1024 * 1024) { errorEl.textContent = "Text files must be under 2 MB."; e.target.value = ""; return; }
      var rd = new FileReader();
      rd.onload = function () { setAttachment({ name: f.name, text: String(rd.result || "") }); };
      rd.onerror = function () { errorEl.textContent = "Could not read that file."; };
      rd.readAsText(f);
    }
  }
  fileInput.addEventListener("change", onPick);
  photoInput.addEventListener("change", onPick);
  chipClear.addEventListener("click", function () { setAttachment(null); });

  // Voice input (speech to text) where the browser supports it
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && micBtn) {
    micBtn.hidden = false;
    var rec = null, listening = false;
    micBtn.addEventListener("click", function () {
      if (listening && rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = navigator.language || "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      var base = input.value ? input.value + " " : "";
      rec.onstart = function () { listening = true; micBtn.setAttribute("aria-pressed", "true"); micLabel.textContent = "Listening..."; };
      rec.onresult = function (ev) {
        var t = "";
        for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        input.value = base + t;
      };
      rec.onerror = function () { errorEl.textContent = "Voice input was blocked or unavailable. Check microphone permission."; };
      rec.onend = function () { listening = false; micBtn.setAttribute("aria-pressed", "false"); micLabel.textContent = "Speak"; input.focus(); };
      try { rec.start(); } catch (_) {}
    });
  }

  // Download the answer as a file, and any table as CSV
  function download(name, mime, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function tableCsv(md) {
    var lines = md.replace(/\r/g, "").split("\n"), out = [];
    lines.forEach(function (l) {
      if (!/^\s*\|/.test(l) || /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l)) return;
      out.push(cells(l).map(function (c) { return '"' + c.replace(/\*\*/g, "").replace(/"/g, '""') + '"'; }).join(","));
    });
    return out.join("\n");
  }
  dlMd.addEventListener("click", function () { download("synswer-answer.md", "text/markdown", lastAnswer); });
  dlCsv.addEventListener("click", function () { download("synswer-table.csv", "text/csv", tableCsv(lastAnswer)); });

  // Proactive: remind a returning visitor of their last question
  try {
    var prev = localStorage.getItem("synswer-last-q");
    if (prev && welcomeEl) {
      welcomeEl.innerHTML = "";
      welcomeEl.appendChild(document.createTextNode("Welcome back. Last time you asked: \"" + (prev.length > 70 ? prev.slice(0, 67) + "..." : prev) + "\""));
      var again = document.createElement("button");
      again.type = "button";
      again.textContent = "Ask it again";
      again.addEventListener("click", function () { input.value = prev; input.focus(); form.requestSubmit(); });
      welcomeEl.appendChild(again);
      welcomeEl.hidden = false;
    }
  } catch (_) {}

  async function armCaptcha() {
    try {
      var w = document.getElementById("captcha");
      var challenge = await (await fetch("api/auth/challenge")).json();
      await customElements.whenDefined("altcha-widget");
      w.reset();
      w.configure({ challenge: challenge });
      w.verify();
    } catch (_) {}
  }
  armCaptcha();

  function showMemoryState() {
    if (!memoryEl) return;
    if (window.synswerUser) {
      memoryEl.innerHTML = "Memory is on for your account.";
      if (forgetBtn) forgetBtn.hidden = false;
    } else {
      memoryEl.innerHTML = 'This visit is remembered for follow-up questions. <a href="login.html">Sign in</a> to keep memory across visits.';
      if (forgetBtn) forgetBtn.hidden = true;
    }
  }
  window.synswerUserReady.then(showMemoryState);

  if (forgetBtn) {
    forgetBtn.addEventListener("click", async function () {
      forgetBtn.disabled = true;
      try {
        var uid = window.synswerUser && window.synswerUser.id;
        if (!uid) return;
        var res = await fetch("api/rows/memories?user_id=eq." + encodeURIComponent(uid) + "&select=id&limit=200", { credentials: "include" });
        var data = await res.json();
        await Promise.all((data.rows || []).map(function (r) {
          return fetch("api/rows/memories/" + r.id, { method: "DELETE", credentials: "include" });
        }));
        memoryEl.textContent = "Your saved memory was cleared.";
      } catch (_) {
        memoryEl.textContent = "Could not clear memory right now.";
      } finally {
        forgetBtn.disabled = false;
      }
    });
  }

  orb.addEventListener("click", function () { input.focus(); });

  document.querySelectorAll("[data-suggest]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-suggest");
      input.focus();
      form.requestSubmit();
    });
  });

  var sourcesEl = document.getElementById("answer-sources");
  var sourcesLabel = document.getElementById("sources-label");

  // Look up a few Wikipedia articles for the question (public, no key). Fails quietly.
  async function lookupSources(q) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 5000);
    try {
      var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
        "&generator=search&gsrlimit=8&gsrsearch=" + encodeURIComponent(q) +
        "&prop=extracts&exintro=1&explaintext=1&exchars=1200";
      var res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return [];
      var data = await res.json();
      var pages = data && data.query && data.query.pages ? Object.keys(data.query.pages).map(function (k) { return data.query.pages[k]; }) : [];
      var terms = termsOf(q);
      var good = pages.filter(function (p) { return p.extract && p.extract.length > 80; });
      var relevant = good.filter(function (p) { return overlap(p.title + " " + p.extract.slice(0, 400), terms) >= 0.4; });
      return (relevant.length ? relevant : good)
        .sort(function (a, b) { return a.index - b.index; })
        .slice(0, 3)
        .map(function (p) {
          return { title: p.title, extract: p.extract, url: "https://en.wikipedia.org/?curid=" + p.pageid };
        });
    } catch (_) {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  // ----- relevance filtering shared by every source -----
  var STOP = "the a an and or of to in on for with is are was were be been how what why when where who which does do did can could should would about from into than then this that these those it its my your you me i we they them there their as at by not vs versus best top new".split(" ");
  function termsOf(q) {
    return q.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; });
  }
  function overlap(text, terms) {
    if (!terms.length) return 1;
    var t = String(text || "").toLowerCase(), hit = 0;
    terms.forEach(function (w) { if (t.indexOf(w) >= 0) hit++; });
    return hit / terms.length;
  }
  function timedFetch(url, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 5000);
    return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(timer); });
  }
  // Every source now runs for every question; the relevance filters drop what does not fit.
  function isTech(q) { return true; }
  function isHowTo(q) { return true; }
  function isScience(q) { return true; }

  // DuckDuckGo instant answers (public, no key): a broad web-sourced summary and related topics.
  async function lookupDDG(q) {
    try {
      var res = await timedFetch("https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" + encodeURIComponent(q), 5000);
      if (!res.ok) return [];
      var d = await res.json(), out = [];
      if (d.AbstractText && d.AbstractURL) {
        out.push({ kind: "web", title: d.AbstractText.slice(0, 500), publisher: d.AbstractSource || "DuckDuckGo", date: "", url: d.AbstractURL });
      }
      (d.RelatedTopics || []).slice(0, 4).forEach(function (t) {
        if (t.Text && t.FirstURL) out.push({ kind: "web", title: t.Text.slice(0, 200), publisher: "DuckDuckGo", date: "", url: t.FirstURL });
      });
      return out.slice(0, 4);
    } catch (_) { return []; }
  }

  // Hacker News discussions (public, no key) for tech questions.
  async function lookupHN(q) {
    if (!isTech(q)) return [];
    try {
      var res = await timedFetch("https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=8&query=" + encodeURIComponent(q), 5000);
      if (!res.ok) return [];
      var data = await res.json(), terms = termsOf(q);
      return (data.hits || [])
        .filter(function (h) { return h.title && (h.points || 0) >= 25 && overlap(h.title, terms) >= 0.5; })
        .slice(0, 2)
        .map(function (h) {
          return { kind: "hn", title: h.title, publisher: "Hacker News", date: (h.created_at || "").slice(0, 10), url: "https://news.ycombinator.com/item?id=" + h.objectID };
        });
    } catch (_) { return []; }
  }

  // Stack Overflow questions with accepted answers (public, no key) for how-to and code questions.
  async function lookupStack(q) {
    if (!isHowTo(q)) return [];
    try {
      var res = await timedFetch("https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&accepted=True&site=stackoverflow&pagesize=5&q=" + encodeURIComponent(q), 5000);
      if (!res.ok) return [];
      var data = await res.json(), terms = termsOf(q);
      return (data.items || [])
        .filter(function (it) { return it.title && it.score >= 3 && overlap(it.title, terms) >= 0.4; })
        .slice(0, 2)
        .map(function (it) {
          var t = document.createElement("textarea");
          t.innerHTML = it.title;
          return { kind: "stack", title: t.value, publisher: "Stack Overflow", date: "", url: it.link };
        });
    } catch (_) { return []; }
  }

  // Scholarly papers from Crossref (public, no key) for science and health questions.
  async function lookupPapers(q) {
    if (!isScience(q)) return [];
    try {
      var res = await timedFetch("https://api.crossref.org/works?rows=6&select=title,DOI,container-title,issued&query.bibliographic=" + encodeURIComponent(q), 6000);
      if (!res.ok) return [];
      var data = await res.json(), terms = termsOf(q);
      return ((data.message && data.message.items) || [])
        .filter(function (it) { return it.title && it.title[0] && overlap(it.title[0], terms) >= 0.4; })
        .slice(0, 2)
        .map(function (it) {
          var y = it.issued && it.issued["date-parts"] && it.issued["date-parts"][0] ? it.issued["date-parts"][0][0] : "";
          return { kind: "paper", title: it.title[0], publisher: (it["container-title"] && it["container-title"][0]) || "Crossref", date: String(y || ""), url: "https://doi.org/" + it.DOI };
        });
    } catch (_) { return []; }
  }

  // Does the question look time-sensitive?
  function isTimely(q) {
    return /\b(latest|today|tonight|yesterday|this (week|month|year)|news|recent|recently|current|currently|now|breaking|update|updates|price|prices|score|scores|won|wins|winner|election|results?|happening|20(2[5-9]|3\d))\b/i.test(q);
  }

  // Does the question name a specific business, person, place or product? Looks at the shape of the
  // question (capitalised names, quotes, "who is", "opening hours", "reviews of"...), not a topic list.
  function looksNamed(q) {
    if (/\b(who is|who's|who was|who are|where is|where's|address of|phone number|opening hours|open hours|hours of|reviews? of|near me|near by|nearby|contact details|website of|ceo of|founder of|owner of|how much (is|does|are)|price of|cost of|is .{2,40} (open|closed|legit|worth it))\b/i.test(q)) return true;
    if (/["\u201c][^"\u201d]{2,60}["\u201d]/.test(q)) return true;
    if (/^\s*(how (do|to|can|would)|write|code|fix|debug|explain|solve|calculate|translate|convert|summari[sz]e|draft|create|make|define|what is the (difference|meaning))\b/i.test(q)) return false;
    var COMMON = "I I'm I'll I've I'd AI OK The A An And Or What Why How When Where Who Which Is Are Can Could Should Would Do Does Did Tell Give Show Please Hi Hello Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December".split(" ");
    var words = q.trim().split(/\s+/).slice(1);
    for (var i = 0; i < words.length; i++) {
      var w = words[i].replace(/^[("'\u201c]+|[)"',.?!:;\u201d]+$/g, "");
      if (/^[A-Z][A-Za-z0-9&'.\-]+$/.test(w) && COMMON.indexOf(w) < 0) return true;
    }
    // A capitalised name right at the start of a short question ("Tesla stock", "Nike Air Max")
    var first = q.trim().split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, "");
    if (first && /^[A-Z]/.test(first) && COMMON.indexOf(first) < 0 && q.trim().split(/\s+/).length <= 6 && /^(?!what|why|how|when|where|who|which|can|could|should|would|do|does|did|is|are|tell|give|show|please)/i.test(first)) return true;
    return false;
  }

  // Long-term memory: notes this signed-in user saved earlier, found by meaning.
  async function recallMemory(q) {
    if (!window.synswerUser) return [];
    try {
      var res = await fetch("api/ai/search", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ table: "memories", q: q, limit: 5 })
      });
      if (!res.ok) return [];
      var data = await res.json();
      return (data.rows || [])
        .filter(function (r) { return !r.user_id || r.user_id === window.synswerUser.id; })
        .map(function (r) { return r.content; });
    } catch (_) { return []; }
  }

  async function saveMemory(q, a) {
    if (!window.synswerUser) return;
    var gist = a.replace(/\s+/g, " ").slice(0, 260);
    try {
      await fetch("api/rows/memories", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: { user_id: window.synswerUser.id, content: "User asked: " + q + " | Answer gist: " + gist } })
      });
    } catch (_) {}
  }

  function renderSources(list) {
    if (!sourcesEl) return;
    sourcesEl.innerHTML = "";
    list.forEach(function (s, idx) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = (s.kind === "web" ? "" : "[" + (idx + 1) + "] ") + (s.kind
        ? s.publisher + (s.date ? ", " + s.date : "") + ": " + (s.title.length > 70 ? s.title.slice(0, 67) + "..." : s.title)
        : s.title + " (Wikipedia)");
      li.appendChild(a);
      sourcesEl.appendChild(li);
    });
    sourcesEl.hidden = !list.length;
    if (sourcesLabel) sourcesLabel.hidden = !list.length;
  }

  function showAnswer(question) {
    qEl.textContent = question;
    home.hidden = true;
    answerView.hidden = false;
    window.scrollTo({ top: 0 });
    // Give the answer its own history entry so the phone's Back button returns home instead of leaving the site.
    // NOTE: a local variable named "history" holds the chat turns in this file, so use window.history explicitly.
    try {
      var st = window.history.state;
      if (!(st && st.view === "answer")) {
        if (!st) window.history.replaceState({ view: "home" }, "", location.href);
        window.history.pushState({ view: "answer" }, "", location.href);
      }
    } catch (_) {}
    document.dispatchEvent(new CustomEvent("synswer:view"));
  }
  function goHome() {
    answerView.hidden = true;
    home.hidden = false;
    document.dispatchEvent(new CustomEvent("synswer:home"));
  }
  window.addEventListener("popstate", function () {
    if (!answerView.hidden) goHome();
  });

  // ----- small safe markdown renderer (escapes first, then formats) -----
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[(\d{1,2})\]/g, '<sup class="cite">[$1]</sup>');
  }
  function cells(line) { return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); }); }
  function markdown(text) {
    var lines = String(text).replace(/\r/g, "").split("\n"), out = [], i = 0;
    while (i < lines.length) {
      var l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (/^\s*```/.test(l)) {
        var code = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
        continue;
      }
      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var head = cells(l), html = "<div class=\"table-wrap\"><table><thead><tr>" + head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          html += "<tr>" + cells(lines[i]).map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          i++;
        }
        out.push(html + "</tbody></table></div>");
      } else if (/^\s*[-*]\s+/.test(l)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; }
        out.push("<ul>" + items.join("") + "</ul>");
      } else if (/^\s*\d+[.)]\s+/.test(l)) {
        var nums = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { nums.push("<li>" + inline(lines[i].replace(/^\s*\d+[.)]\s+/, "")) + "</li>"); i++; }
        out.push("<ol>" + nums.join("") + "</ol>");
      } else if (/^#{1,4}\s+/.test(l)) {
        out.push("<h3>" + inline(l.replace(/^#{1,4}\s+/, "")) + "</h3>");
        i++;
      } else {
        var para = [];
        while (i < lines.length && lines[i].trim() && !/^\s*(\||[-*]\s|\d+[.)]\s|#{1,4}\s)/.test(lines[i])) { para.push(lines[i]); i++; }
        out.push("<p>" + inline(para.join(" ")) + "</p>");
      }
    }
    return out.join("");
  }

  function setBody(text, loading) {
    bodyEl.classList.toggle("is-loading", !!loading);
    if (loading) bodyEl.removeAttribute("data-ok");
    if (loading) {
      bodyEl.innerHTML = "";
      var p = document.createElement("p");
      p.textContent = text;
      bodyEl.appendChild(p);
    } else {
      bodyEl.innerHTML = markdown(text);
    }
    if (!loading) {
      document.dispatchEvent(new CustomEvent("synswer:answer"));
      // One ad under a finished answer (never while it is loading, never on the home screen).
      var adBox = document.getElementById("answer-ad");
      if (adBox && window.SynswerAds && bodyEl.getAttribute("data-ok") === "1") window.SynswerAds.fill(adBox);
    }
  }

  var SYSTEM =
    "ROLE: You are Synswer, a hyper-capable, context-aware operational assistant. Synthesize the sources, the session conversation and the user's saved memory into the answer. Anticipate what the person needs next. " +
    "REASONING: For a complex question, break it into sub-tasks, work through them in order, and verify your result against the sources before answering. Show only the conclusion and the key trade-offs, not your scratch work. " +
    "TONE: Professional, adaptive, human-centric. No filler, no greeting, no restating the question, no robotic transitions. Get straight to the value. " +
    "FORMAT: Use markdown. Start with one or two sentences with the core answer, putting the key entities and the core answer in **bold**. Then, only if useful, use short bullet points (lines starting with '- ') and, for comparisons, a markdown table with a header row and a separator row. No headings unless the answer is long. CITATIONS: every factual claim that comes from a numbered source in REFERENCE ends with its number in square brackets, like [1] or [2][3]. Use only numbers that exist in REFERENCE, never invent one. Claims taken from an ATTACHED FILE are cited by line, like [File, line 12] or [File, lines 4-9]. Claims taken from an attached image are marked (from the image). Claims from general knowledge carry no number. " +
    "LENGTH: Scale to the question. A simple lookup gets a direct answer of one to three sentences. A complex or structural problem gets a visible trade-off analysis (options, pros and cons) followed by a single actionable recommendation. Never exceed about 350 words, except when asked to draft a document. " +
    "FILES: If an ATTACHED FILE is provided, analyze its actual contents: summarize, extract key insights, and for spreadsheets check for errors such as blanks, duplicates, inconsistent formats and outliers, citing row numbers. If the file text is marked as truncated, say so. Each file line is prefixed with its line number (L1:, L2:); for a CSV, line 1 is the header, so data row N is line N+1. Answer the question from the file first, quoting exact values. If an image is attached, look at it carefully: read any visible text exactly, identify the main subject (and brand, model, species or place only when clearly recognisable), answer the question directly, then add real information about the subject from REFERENCE with citations. Say plainly when something in the image is unclear, and never identify a real person from their face. " +
    "DOCUMENTS: When asked to draft a contract, blog post, email, report or code, write the complete document in markdown (code inside fenced code blocks), with no commentary around it, and note briefly that contracts are drafts needing professional legal review. For data to chart or export, give a markdown table. " +
    "LIVE WEB: When web search is available for this question, live web results come first. Base the answer on what the web search finds, attribute news to its publisher and date, and mention the publisher or site by name in the sentence when it helps, but NEVER write bracketed numbers like [1] or [2] in the text (the visitor sees the links under the answer, and numbers would not match). Wikipedia in REFERENCE is only background for context and definitions: never let it override a newer live result, and never cite it. Never say you cannot see live news or current information. " +
    "SOURCES: REFERENCE holds Wikipedia excerpts: use the relevant parts, ignore the rest, and explain in your own words, never copying sentences. Wikipedia is only one input: when it is missing or off-topic, answer from solid general knowledge across all fields (not just encyclopedic topics) and say what could not be verified. Titles from Hacker News, Stack Overflow and scholarly papers were not read: use them only to confirm a topic or finding is real and discussed. Prefer claims that more than one source supports, and say briefly when sources disagree or only one supports a point. " +
    "MEMORY: SESSION CONVERSATION holds earlier turns of this visit: use it so follow-up questions keep their context. SAVED MEMORY holds notes about this user from earlier visits: use it to personalise quietly, but never recite it back, and never mention, hint at or refer to saved notes, memory or earlier visits in the answer. " +
    "HONESTY: If something cannot be verified from the sources or from solid knowledge, say so neutrally and state what to check, instead of assuming. Never invent sources, links or quotes. Never tell the visitor you cannot see live news or current events. " +
    "PRIVACY: Never disclose or confirm credentials, passwords, API keys, government or financial identifiers, or private records about a person. If asked to verify or reveal such a string, decline neutrally without repeating it back.";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    errorEl.textContent = "";

    var field = form.querySelector('input[name="altcha"]');
    var altcha = field ? field.value : "";
    if (!altcha) {
      errorEl.textContent = "Finishing the security check, try again in a second.";
      return;
    }

    submit.disabled = true;
    dlMd.hidden = true;
    dlCsv.hidden = true;
    var att = attachment;
    var imagePath = null;
    if (att && att.file && att.path) {
      imagePath = att.path;
    } else if (att && att.file) {
      try {
        var fd = new FormData();
        fd.append("folder", "private/ask");
        fd.append("file", att.file, "photo.jpg");
        var up = await fetch("api/storage/upload", { method: "POST", credentials: "include", body: fd });
        var upData = await up.json().catch(function () { return {}; });
        if (!up.ok) {
          errorEl.textContent = upData.error || "Could not upload the image.";
          submit.disabled = false;
          armCaptcha();
          return;
        }
        imagePath = upData.path;
        att.path = imagePath;
      } catch (_) {
        errorEl.textContent = "Could not upload the image.";
        submit.disabled = false;
        armCaptcha();
        return;
      }
    }
    try { localStorage.setItem("synswer-last-q", q); } catch (_) {}
    var prevAd = document.getElementById("answer-ad");
    if (prevAd && window.SynswerAds) window.SynswerAds.clear(prevAd);
    showAnswer(q);
    setBody("Reading sources...", true);
    renderSources([]);

    await window.synswerUserReady;

    // Which text do we search the web with?
    var lq = q, imageNotes = "";
    if (imagePath) {
      // Pass 1: look at the picture so the web lookup is about what is really in it.
      setBody("Looking at your image...", true);
      try {
        var r1 = await fetch("api/ai/complete", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt: "Look closely at the image. Describe it factually: the main subject, other notable objects, setting, and any visible text, logos, labels or numbers read exactly. Then give search_query: 3 to 8 words that would find reliable reference information about the main subject on the web (a specific name, brand, model, species, landmark or topic when clearly recognisable, otherwise the general kind of thing), shaped by the user's question. Never identify a real person from their face.",
            input: "USER QUESTION: " + q,
            images: [imagePath],
            format: "json",
            schema: { type: "object", properties: { description: { type: "string" }, visible_text: { type: "string" }, search_query: { type: "string" } }, required: ["description", "visible_text", "search_query"] },
            maxTokens: 500,
            altcha: altcha
          })
        });
        var d1 = await r1.json().catch(function () { return {}; });
        if (r1.ok && d1.json) {
          imageNotes = "IMAGE ANALYSIS (first pass):\nDescription: " + d1.json.description + (d1.json.visible_text ? "\nVisible text: " + d1.json.visible_text : "");
          if (d1.json.search_query && d1.json.search_query.length > 2) lq = d1.json.search_query;
        } else if (!r1.ok && (r1.status === 401 || r1.status === 429)) {
          setBody(d1.error || "Synswer could not read the image right now. Please try again in a moment.", false);
          submit.disabled = false;
          armCaptcha();
          return;
        }
      } catch (_) {}
      setBody("Reading sources...", true);
    } else if (att && att.text != null) {
      // A file question: only search the web when the question itself names a topic beyond the file.
      var FILEW = "summarize summarise summary file document data text csv spreadsheet attached attachment row rows column columns line lines errors error check find tell explain analyze analyse analysis insights key points list extract content contents report above below here".split(" ");
      var topical = termsOf(q).filter(function (w) { return FILEW.indexOf(w) < 0; });
      lq = topical.length >= 2 ? topical.join(" ") : "";
    }

    var skip = function () { return Promise.resolve([]); };
    var found = await Promise.all([lq ? lookupSources(lq) : skip(), skip(), lq ? lookupHN(lq) : skip(), lq ? lookupStack(lq) : skip(), lq ? lookupPapers(lq) : skip(), recallMemory(q), lq ? lookupDDG(lq) : skip()]);
    var wiki = found[0];
    var news = found[1];
    var leads = found[2].concat(found[3], found[4], found[6]);
    var memories = found[5];
    var sch = [];
    if (lq && window.SynswerScholar && SynswerScholar.isScholarly(q) && !(att && att.text != null)) {
      setBody("Searching scholarly databases...", true);
      try { sch = (await SynswerScholar.search(lq, {})).papers || []; } catch (_) { sch = []; }
    }
    var schSources = sch.map(function (p) {
      return { kind: "paper", title: p.title, publisher: SynswerScholar.typeLabel(p) + (p.venue ? ", " + p.venue : ""), date: String(p.year || ""), url: p.doi ? "https://doi.org/" + p.doi : p.url };
    });
    // Live web search runs for time-sensitive questions, questions about a named business, person, place
    // or product, and whenever the other sources found nothing relevant. Scholarly evidence questions keep their papers.
    var nothingFound = !wiki.length && !news.length && !leads.length;
    var timely = !!lq && !(att && att.text != null) && !sch.length && (isTimely(q) || looksNamed(q) || nothingFound);
    var fallbackSources = wiki.concat(news, leads, schSources);
    var sources = timely ? [] : fallbackSources;
    renderSources(sources);
    setBody(timely ? "Searching the web live..." : "Cross-checking sources...", true);

    // Numbered to match the source pills shown under the answer: [1], [2], ...
    // For time-sensitive questions the numbers belong to the live web sources only; the rest is unnumbered background.
    var reference;
    if (timely) {
      reference = "BACKGROUND ONLY (no citation numbers, never cite these):\n" +
        wiki.map(function (s) { return "Wikipedia, " + s.title + ": " + s.extract; }).join("\n\n");
      if (!wiki.length) reference = "";
      leads = [];
    } else {
      reference = wiki.map(function (s, i) { return "[" + (i + 1) + "] Wikipedia, " + s.title + ": " + s.extract; }).join("\n\n");
    }
    var n0 = wiki.length;
    if (news.length) {
      reference += (reference ? "\n\n" : "") + "RECENT NEWS HEADLINES (headline only, no article text):\n" +
        news.map(function (n, i) { return "[" + (n0 + i + 1) + "] " + n.publisher + ", " + n.date + ": " + n.title; }).join("\n");
    }
    n0 += news.length;
    if (leads.length) {
      reference += (reference ? "\n\n" : "") + "OTHER RELEVANT SOURCES (titles only, the content was not read):\n" +
        leads.map(function (n, i) { return "[" + (n0 + i + 1) + "] " + n.publisher + (n.date ? ", " + n.date : "") + ": " + n.title; }).join("\n");
    }
    if (sch.length && !timely) {
      var base = n0 + leads.length;
      reference += (reference ? "\n\n" : "") + SynswerScholar.block(sch, function (i) { return "[" + (base + i + 1) + "]"; });
    }
    if (imageNotes) reference = imageNotes + (reference ? "\n\n" + reference : "");

    var numbered = att && att.text != null ? att.text.replace(/\r/g, "").split("\n").map(function (ln, i) { return "L" + (i + 1) + ": " + ln; }).join("\n") : "";
    var session = history.slice(-4).map(function (t) { return "User: " + t.q + "\nSynswer: " + t.a.slice(0, 500); }).join("\n\n");
    var inputText =
      "SESSION CONVERSATION:\n" + (session || "(first question of this visit)") +
      "\n\nSAVED MEMORY:\n" + (memories.length ? memories.map(function (m) { return "- " + m; }).join("\n") : "(none)") +
      "\n\nQUESTION:\n" + q +
      (att && att.text != null
        ? "\n\nATTACHED FILE (" + att.name + (numbered.length > 20000 ? ", truncated to the first 20000 characters" : "") + "):\n" + numbered.slice(0, 20000)
        : "") +
      "\n\nREFERENCE:\n" + (att && att.text != null ? (reference || "(none found)").slice(0, 3000) : (reference || "(none found)"));

    try {
      var res = await fetch("api/ai/complete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: SYSTEM + (timely ? " LIVE WEB ANSWER RULE: do not write any [1], [2] style numbers anywhere in this answer." : "") + (sch.length && !timely ? " " + SynswerScholar.rules + " In this answer the scholarly records carry plain numbers in REFERENCE; cite them as [n]. They include abstracts, so unlike other titles they may be summarised from the abstract shown." : ""),
          input: inputText,
          maxTokens: 1000,
          images: imagePath ? [imagePath] : undefined,
          web: timely ? true : undefined,
          altcha: altcha
        }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setBody(data.error || "Synswer could not answer right now. Please try again in a moment.", false);
      } else {
        if (timely && !(data.sources && data.sources.length) && fallbackSources.length) {
          renderSources(fallbackSources);
        }
        if (timely && data.sources && data.sources.length) {
          renderSources(data.sources.filter(function (s) { return s && s.url; }).slice(0, 12).map(function (s) {
            var host = "";
            try { host = new URL(s.url).hostname.replace(/^www\./, ""); } catch (_) {}
            return { kind: "web", publisher: host || "web", date: "", title: s.title || s.url, url: s.url };
          }));
        }
        var answer = data.text || "No answer came back. Please try again.";
        if (timely && data.text) {
          answer = answer.replace(/[ \t]*\[\d{1,2}\](?:\s*\[\d{1,2}\])*/g, "").replace(/[ \t]+([.,;:!?])/g, "$1");
        }
        // An answer that says nothing was found is not worth remembering.
        var notFound = /\b(i (could not|couldn't|can't|cannot|was unable to|wasn't able to|did not|didn't) (find|locate|verify|confirm)|(could not|couldn't|unable to|cannot|can't) (be )?(find|found|locate|verify|confirm)|no (relevant|reliable|clear|verifiable|specific) (results?|information|sources?|records?|details|data)|nothing (relevant|reliable) (was )?found|not (able|enough information) to (find|verify))\b/i.test(answer);
        if (data.text) bodyEl.setAttribute("data-ok", "1");
        setBody(answer, false);
        lastAnswer = answer;
        dlMd.hidden = false;
        dlCsv.hidden = !/^\s*\|.*\|\s*$/m.test(answer);
        // The file or photo stays attached so follow-up questions keep working on it; the x removes it.
        input.value = "";
        if (data.text) {
          history.push({ q: q, a: answer });
          if (!notFound) saveMemory(q, answer);
        }
      }
    } catch (_) {
      setBody("Synswer could not answer right now. Please check your connection and try again.", false);
    } finally {
      submit.disabled = false;
      armCaptcha();
    }
  });

  againBtn.addEventListener("click", function () {
    var st2 = window.history.state;
    if (st2 && st2.view === "answer") { window.history.back(); } else { goHome(); }
    input.focus();
  });
})();
