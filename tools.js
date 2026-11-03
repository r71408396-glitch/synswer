// AI Tools: fifteen tools, each with its own form, all answered through api/ai/complete.
(function () {
  var MD = window.SynMD;
  var $ = function (id) { return document.getElementById(id); };
  var LANGS = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)", "Japanese", "Korean", "Russian", "Turkish", "Swahili"];

  var TOOLS = [
    { id: "writing", name: "Writing Assistant", desc: "Essays, posts, stories and speeches.", fields: [
      { id: "type", label: "What are you writing?", type: "select", options: ["Blog post", "Essay", "Short story", "Speech", "Social media post", "Product description", "Poem"] },
      { id: "topic", label: "Topic or brief", type: "textarea", ph: "What should it be about, who is it for?", req: true },
      { id: "length", label: "Length", type: "select", options: ["Short (about 150 words)", "Medium (about 300 words)", "Long (about 500 words)"] }],
      sys: "You are a skilled writing assistant. Write the requested piece in full, ready to use, with a fitting title." },
    { id: "homework", name: "Homework Helper", desc: "Understand a problem step by step.", image: true, fields: [
      { id: "subject", label: "Subject", type: "select", options: ["General", "Science", "History", "Literature", "Geography", "Economics", "Languages", "Other"] },
      { id: "q", label: "Your question", type: "textarea", ph: "Type the question or upload a photo of it", req: true }],
      sys: "You are a patient tutor. Explain the concept first, then work through the question step by step so the student learns, and finish with the answer and one check-yourself question." },
    { id: "math", name: "Math Solver", desc: "Worked solutions with every step.", image: true, fields: [
      { id: "q", label: "Problem", type: "textarea", ph: "e.g. Solve 2x^2 - 5x - 3 = 0, or upload a photo", req: true }],
      sys: "You are a careful math tutor. Solve the problem step by step, showing each calculation on its own line, double-check the result by substituting or re-computing, and state the final answer clearly in bold." },
    { id: "coding", name: "Coding Assistant", desc: "Write, debug, explain and improve code.", fields: [
      { id: "task", label: "What do you need?", type: "select", options: ["Write code", "Fix a bug", "Explain code", "Improve or refactor", "Write tests"] },
      { id: "lang", label: "Language", type: "select", options: ["JavaScript", "Python", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "PHP", "SQL", "HTML/CSS", "Other"] },
      { id: "code", label: "Describe the task or paste code", type: "textarea", ph: "Paste code or describe what you want", req: true, mono: true }],
      sys: "You are a senior software engineer. Put all code in fenced code blocks with the language name. Explain briefly what it does and any edge cases. Prefer simple, correct, idiomatic code." },
    { id: "research", name: "Research Assistant", desc: "Live web research with links you can open.", web: true, fields: [
      { id: "q", label: "Research question", type: "textarea", ph: "What do you want to find out?", req: true },
      { id: "depth", label: "Output", type: "select", options: ["Key findings", "Pros and cons", "Timeline", "Comparison table"] }],
      sys: "You are a research analyst. Use live web results, attribute claims to the sources you used, point out disagreement or uncertainty, and never invent sources." },
    { id: "bizidea", name: "Business Idea Generator", desc: "Ideas matched to your skills and budget.", fields: [
      { id: "interests", label: "Interests and skills", type: "textarea", ph: "e.g. baking, social media, spreadsheets", req: true },
      { id: "budget", label: "Starting budget", type: "select", options: ["Under $500", "$500 to $5,000", "$5,000 to $50,000", "More than $50,000"] },
      { id: "time", label: "Time you can give", type: "select", options: ["Side project", "Part time", "Full time"] }],
      sys: "You are a startup advisor. Give five distinct, realistic business ideas. For each: one-line pitch, who pays, how to start in the first week, and the main risk. Finish by recommending one." },
    { id: "email", name: "Email Writer", desc: "Clear emails for any situation.", fields: [
      { id: "purpose", label: "Purpose", type: "select", options: ["Request", "Follow-up", "Apology", "Introduction", "Complaint", "Thank you", "Job application", "Declining politely"] },
      { id: "to", label: "Who is it to?", type: "text", ph: "e.g. my manager, a customer" },
      { id: "points", label: "Key points to include", type: "textarea", ph: "The facts, dates, requests", req: true }],
      sys: "You write effective emails. Give a subject line, then the email body, ready to send. Keep it concise and natural." },
    { id: "resume", name: "Resume Builder", desc: "A tidy resume from your details.", fields: [
      { id: "role", label: "Target role", type: "text", ph: "e.g. Junior accountant", req: true },
      { id: "exp", label: "Experience", type: "textarea", ph: "Jobs, dates, what you did", req: true },
      { id: "skills", label: "Skills", type: "text", ph: "Comma separated" },
      { id: "edu", label: "Education", type: "textarea", ph: "Schools, courses, certificates" }],
      sys: "You are a professional resume writer. Produce a clean resume in markdown: summary, experience with achievement-focused bullet points starting with strong verbs, skills, education. Use only facts the person gave; never invent employers, dates or numbers. Mark gaps as [add detail]." },
    { id: "translate", name: "Translator", desc: "Translate with notes on tone and meaning.", fields: [
      { id: "text", label: "Text to translate", type: "textarea", ph: "Any language", req: true },
      { id: "to", label: "Translate into", type: "select", options: LANGS }],
      sys: "You are a professional translator. Detect the source language, give the translation first, then a short note on any idioms, tone or alternative wordings worth knowing." },
    { id: "summarize", name: "Summarizer", desc: "Short summaries of long text or files.", file: true, fields: [
      { id: "text", label: "Text to summarize", type: "textarea", ph: "Paste text, or attach a .txt, .md or .csv file below", req: true, tall: true },
      { id: "len", label: "Summary", type: "select", options: ["One paragraph", "Five bullet points", "Key points and action items", "One sentence"] }],
      sys: "You are an expert summarizer. Keep only what matters, stay faithful to the text, never add facts that are not in it." },
    { id: "notes", name: "Study Notes", desc: "Clear notes and flashcard-style questions.", file: true, fields: [
      { id: "topic", label: "Topic or text", type: "textarea", ph: "A topic, or paste your lesson text", req: true, tall: true },
      { id: "level", label: "Level", type: "select", options: ["School", "College", "Professional exam", "Complete beginner"] }],
      sys: "You are a study coach. Produce organised study notes with headings, key terms in bold, short bullet points, one memory trick, and finish with five self-test questions with answers." },
    { id: "travel", name: "Travel Planner", desc: "Day-by-day plans for any trip.", web: true, fields: [
      { id: "dest", label: "Destination", type: "text", ph: "City or country", req: true },
      { id: "days", label: "Days", type: "select", options: ["1", "2", "3", "4", "5", "7", "10"] },
      { id: "budget", label: "Budget", type: "select", options: ["Budget", "Mid range", "Luxury"] },
      { id: "likes", label: "Interests", type: "text", ph: "e.g. food, hiking, museums, nightlife" }],
      sys: "You are a travel planner. Give a day-by-day itinerary with morning, afternoon and evening, rough costs, getting around tips and one thing to book ahead. Use live information where useful and say when details should be checked." },
    { id: "names", name: "Business Name Generator", desc: "Memorable names with taglines.", fields: [
      { id: "about", label: "What does the business do?", type: "textarea", ph: "Describe it in a sentence or two", req: true },
      { id: "vibe", label: "Feel", type: "select", options: ["Modern", "Friendly", "Premium", "Playful", "Trustworthy", "Bold"] },
      { id: "n", label: "How many names", type: "select", options: ["10", "15", "20"] }],
      sys: "You are a brand naming expert. List the requested number of distinct, easy to spell and pronounce names, each with a short tagline. Then pick your top three and say why. Remind the person to check that a name is available as a domain and trademark." },
    { id: "content", name: "Content Creator", desc: "Posts, scripts and captions for any platform.", fields: [
      { id: "platform", label: "Platform", type: "select", options: ["Instagram caption", "TikTok or Reels script", "YouTube video outline", "LinkedIn post", "X (Twitter) thread", "Newsletter", "Facebook post"] },
      { id: "topic", label: "Topic", type: "textarea", ph: "What is the post about?", req: true },
      { id: "aud", label: "Audience", type: "text", ph: "e.g. new parents, small business owners" }],
      sys: "You are a content strategist. Write ready-to-post content native to the chosen platform, with a strong hook first, a clear call to action, and suggested hashtags where the platform uses them." },
    { id: "quiz", name: "Quiz Generator", desc: "An interactive quiz you can take and score.", file: true, quiz: true, fields: [
      { id: "topic", label: "Topic or text", type: "textarea", ph: "A topic, or paste text to be quizzed on", req: true },
      { id: "n", label: "Questions", type: "select", options: ["5", "8", "10"] },
      { id: "diff", label: "Difficulty", type: "select", options: ["Easy", "Medium", "Hard"] }],
      sys: "You write fair multiple-choice quizzes with exactly four options each and one correct answer, plus a one-sentence explanation." }
  ];

  var grid = $("tool-grid"), panel = $("tool-panel"), listView = $("tool-list-view");
  var form = $("tool-form"), fieldsEl = $("tool-fields"), titleEl = $("tool-title"), descEl = $("tool-desc");
  var outBox = $("tool-out"), outBody = $("out-body"), outActions = $("out-actions"), followEl = $("out-follow");
  var errEl = $("tool-error"), runBtn = $("tool-run"), refineForm = $("refine-form"), refineIn = $("refine-in");
  var imgRow = $("img-row"), imgIn = $("img-in"), imgName = $("img-name"), fileRow = $("file-row"), fileIn = $("file-in");
  var styleSel = $("style-sel"), fbBox = $("out-feedback");
  var cur = null, lastText = "", imgBlob = null, imgPath = null, quizData = null;

  function recent(id) {
    try {
      var r = JSON.parse(localStorage.getItem("synswer-recent-tools") || "[]").filter(function (x) { return x !== id; });
      r.unshift(id);
      localStorage.setItem("synswer-recent-tools", JSON.stringify(r.slice(0, 5)));
    } catch (_) {}
  }

  // ----- tool grid -----
  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>';
  TOOLS.forEach(function (t) {
    var a = document.createElement("a");
    a.className = "tool-card";
    a.href = "tools.html#" + t.id;
    a.innerHTML = ICON + "<h3></h3><p></p>";
    a.querySelector("h3").textContent = t.name;
    a.querySelector("p").textContent = t.desc;
    grid.appendChild(a);
  });
  function renderRecent() {
    var box = $("recent-tools");
    try {
      var ids = JSON.parse(localStorage.getItem("synswer-recent-tools") || "[]");
      box.innerHTML = "";
      ids.forEach(function (id) {
        var t = TOOLS.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        var a = document.createElement("a");
        a.className = "chip-link";
        a.href = "tools.html#" + id;
        a.textContent = t.name;
        box.appendChild(a);
      });
      $("recent-wrap").hidden = !box.children.length;
    } catch (_) {}
  }

  // ----- style selector -----
  styleSel.value = MD.getStyle();
  styleSel.addEventListener("change", function () { MD.setStyle(styleSel.value); });

  // ----- opening a tool -----
  function field(f) {
    var wrap = document.createElement("div");
    wrap.className = "fld";
    var lab = document.createElement("label");
    lab.htmlFor = "f-" + f.id;
    lab.textContent = f.label;
    var el;
    if (f.type === "select") {
      el = document.createElement("select");
      f.options.forEach(function (o) { var op = document.createElement("option"); op.textContent = o; el.appendChild(op); });
    } else if (f.type === "textarea") {
      el = document.createElement("textarea");
      el.rows = f.tall ? 9 : 5;
      el.maxLength = 12000;
      if (f.mono) el.className = "mono";
    } else {
      el = document.createElement("input");
      el.type = "text";
      el.maxLength = 300;
    }
    el.id = "f-" + f.id;
    if (f.ph) el.placeholder = f.ph;
    wrap.appendChild(lab);
    wrap.appendChild(el);
    return wrap;
  }
  function open(id) {
    var t = TOOLS.filter(function (x) { return x.id === id; })[0];
    if (!t) { cur = null; panel.hidden = true; listView.hidden = false; document.title = "AI Tools - Synswer"; return; }
    cur = t;
    document.title = t.name + " - Synswer AI Tools";
    titleEl.textContent = t.name;
    descEl.textContent = t.desc;
    fieldsEl.innerHTML = "";
    t.fields.forEach(function (f) { fieldsEl.appendChild(field(f)); });
    imgRow.hidden = !t.image;
    fileRow.hidden = !t.file;
    imgBlob = null; imgPath = null; imgName.textContent = ""; imgIn.value = ""; fileIn.value = "";
    outBox.hidden = true; outBody.innerHTML = ""; followEl.innerHTML = ""; errEl.textContent = ""; lastText = ""; quizData = null;
    listView.hidden = true;
    panel.hidden = false;
    window.scrollTo({ top: 0 });
    recent(id);
  }
  window.addEventListener("hashchange", function () { open(location.hash.slice(1)); });
  $("tool-back").addEventListener("click", function (e) { e.preventDefault(); history.pushState("", "", "tools.html"); open(""); renderRecent(); });

  // ----- files and images -----
  fileIn.addEventListener("change", function () {
    var f = fileIn.files && fileIn.files[0];
    if (!f) return;
    errEl.textContent = "";
    if (/\.pdf$|\.docx?$|\.xlsx?$/i.test(f.name)) {
      errEl.textContent = "PDF, Word and Excel files cannot be read yet. Paste the text, or save the file as .txt or .csv and attach that.";
      fileIn.value = "";
      return;
    }
    if (f.size > 2 * 1024 * 1024) { errEl.textContent = "Files must be under 2 MB."; fileIn.value = ""; return; }
    var rd = new FileReader();
    rd.onload = function () {
      var target = fieldsEl.querySelector("textarea");
      if (target) target.value = String(rd.result || "").slice(0, 12000);
      if (String(rd.result || "").length > 12000) errEl.textContent = "The file was long, so the first 12,000 characters were used.";
    };
    rd.readAsText(f);
  });
  imgIn.addEventListener("change", function () {
    var f = imgIn.files && imgIn.files[0];
    if (!f) return;
    errEl.textContent = "";
    if (f.type.indexOf("image/") !== 0) { errEl.textContent = "Please choose an image."; imgIn.value = ""; return; }
    if (!window.synswerUser) { errEl.innerHTML = 'Sign in to use photos. <a href="login.html?next=tools.html">Sign in</a>'; imgIn.value = ""; return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { imgBlob = b; imgPath = null; imgName.textContent = f.name || "photo"; }, "image/jpeg", 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); errEl.textContent = "Could not read that image."; };
    img.src = url;
  });
  $("img-clear").addEventListener("click", function () { imgBlob = null; imgPath = null; imgName.textContent = ""; imgIn.value = ""; });

  // ----- captcha and the AI call -----
  async function armCaptcha() {
    try {
      var w = $("captcha");
      var challenge = await (await fetch("api/auth/challenge")).json();
      await customElements.whenDefined("altcha-widget");
      w.reset(); w.configure({ challenge: challenge }); w.verify();
    } catch (_) {}
  }
  function solution() { var i = document.querySelector('#captcha input[name="altcha"]'); return i ? i.value : ""; }
  async function ai(body) {
    await window.synswerUserReady;
    var a = solution();
    if (!window.synswerUser && !a) throw new Error("Finishing the security check, try again in a second.");
    body.altcha = window.synswerUser ? undefined : a;
    try {
      var res = await fetch("api/ai/complete", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "Synswer could not answer right now. Please try again in a moment.");
      return data;
    } finally { armCaptcha(); }
  }
  armCaptcha();

  function values() {
    var v = {};
    cur.fields.forEach(function (f) { v[f.id] = ($("f-" + f.id).value || "").trim(); });
    return v;
  }
  function describe(v) {
    return cur.fields.map(function (f) { return f.label + ": " + v[f.id]; }).join("\n");
  }
  async function uploadImage() {
    if (!imgBlob) return null;
    if (imgPath) return imgPath;
    var fd = new FormData();
    fd.append("folder", "private/ask");
    fd.append("file", imgBlob, "photo.jpg");
    var up = await fetch("api/storage/upload", { method: "POST", credentials: "include", body: fd });
    var d = await up.json().catch(function () { return {}; });
    if (!up.ok) throw new Error(d.error || "Could not upload the image.");
    imgPath = d.path;
    return imgPath;
  }

  function showOut(text) {
    var parts = MD.splitFollowUps(text);
    lastText = parts.body;
    outBody.innerHTML = MD.render(parts.body);
    followEl.innerHTML = "";
    parts.followUps.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip-btn"; b.textContent = q;
      b.addEventListener("click", function () { refineIn.value = q; refineForm.requestSubmit(); });
      followEl.appendChild(b);
    });
    outBox.hidden = false;
    outActions.hidden = false;
    refineForm.hidden = false;
    fbBox.hidden = false;
    fbBox.querySelector(".fb-msg").textContent = "";
    outBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ----- quiz -----
  var QUIZ_SCHEMA = { type: "object", properties: { title: { type: "string" }, questions: { type: "array", items: { type: "object", properties: { q: { type: "string" }, options: { type: "array", items: { type: "string" } }, answer: { type: "integer" }, why: { type: "string" } }, required: ["q", "options", "answer", "why"] } } }, required: ["title", "questions"] };
  function showQuiz(data) {
    quizData = data;
    lastText = "# " + data.title + "\n\n" + data.questions.map(function (q, i) {
      return (i + 1) + ". " + q.q + "\n" + q.options.map(function (o, k) { return "   - " + String.fromCharCode(65 + k) + ") " + o; }).join("\n") + "\n   Answer: " + String.fromCharCode(65 + q.answer) + ". " + q.why;
    }).join("\n\n");
    outBody.innerHTML = "";
    var h = document.createElement("h3"); h.textContent = data.title; outBody.appendChild(h);
    var score = 0, answered = 0, total = data.questions.length;
    var result = document.createElement("p"); result.className = "quiz-score"; result.textContent = "Answer all " + total + " questions to see your score.";
    data.questions.forEach(function (q, qi) {
      var box = document.createElement("div"); box.className = "quiz-q";
      var p = document.createElement("p"); p.innerHTML = "<strong>" + (qi + 1) + ".</strong> "; p.appendChild(document.createTextNode(q.q)); box.appendChild(p);
      var why = document.createElement("p"); why.className = "quiz-why"; why.hidden = true; why.textContent = q.why;
      q.options.forEach(function (o, oi) {
        var b = document.createElement("button"); b.type = "button"; b.className = "quiz-opt"; b.textContent = String.fromCharCode(65 + oi) + ". " + o;
        b.addEventListener("click", function () {
          if (box.getAttribute("data-done")) return;
          box.setAttribute("data-done", "1"); answered++;
          var opts = box.querySelectorAll(".quiz-opt");
          opts[q.answer].classList.add("is-right");
          if (oi === q.answer) score++; else b.classList.add("is-wrong");
          why.hidden = false;
          if (answered === total) result.textContent = "Your score: " + score + " out of " + total + " (" + Math.round(score / total * 100) + "%)";
        });
        box.appendChild(b);
      });
      box.appendChild(why);
      outBody.appendChild(box);
    });
    outBody.appendChild(result);
    followEl.innerHTML = "";
    outBox.hidden = false; outActions.hidden = false; refineForm.hidden = true; fbBox.hidden = false;
    fbBox.querySelector(".fb-msg").textContent = "";
    outBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ----- run -----
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errEl.textContent = "";
    var v = values();
    var missing = cur.fields.filter(function (f) { return f.req && !v[f.id]; })[0];
    if (missing && !(cur.image && imgBlob)) { errEl.textContent = "Please fill in: " + missing.label + "."; $("f-" + missing.id).focus(); return; }
    runBtn.disabled = true; runBtn.textContent = "Working...";
    outBox.hidden = false; outActions.hidden = true; refineForm.hidden = true; fbBox.hidden = true; followEl.innerHTML = "";
    outBody.innerHTML = '<p class="muted">' + (cur.web ? "Searching the web and writing..." : "Writing...") + "</p>";
    try {
      var body;
      if (cur.quiz) {
        body = { prompt: cur.sys + " " + MD.STYLES[MD.getStyle()].replace("STYLE:", "Wording style:"), input: describe(v) + "\nIf the topic is a pasted text, base every question on that text only.", format: "json", schema: QUIZ_SCHEMA, maxTokens: 1000 };
        var qd = await ai(body);
        if (!qd.json || !qd.json.questions || !qd.json.questions.length) throw new Error("The quiz could not be made. Please try again.");
        showQuiz(qd.json);
      } else {
        var path = cur.image ? await uploadImage() : null;
        body = { prompt: cur.sys + " " + MD.STYLES[MD.getStyle()] + " Use markdown. Keep the whole answer under 600 words." + MD.FOLLOW_RULE, input: describe(v), maxTokens: 1000, web: cur.web ? true : undefined, images: path ? [path] : undefined };
        var d = await ai(body);
        showOut(d.text || "No answer came back. Please try again.");
        var srcBox = $("out-sources");
        srcBox.innerHTML = "";
        (d.sources || []).slice(0, 10).forEach(function (s) {
          if (!s || !s.url) return;
          var li = document.createElement("li"), a = document.createElement("a");
          a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = s.title || s.url;
          li.appendChild(a); srcBox.appendChild(li);
        });
        $("out-sources-wrap").hidden = !srcBox.children.length;
      }
    } catch (err) {
      outBody.innerHTML = "";
      outBox.hidden = true;
      errEl.textContent = err.message || "Something went wrong.";
    } finally { runBtn.disabled = false; runBtn.textContent = "Generate"; }
  });

  // ----- refine / follow-up -----
  refineForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var ask = refineIn.value.trim();
    if (!ask || !lastText) return;
    var btn = refineForm.querySelector("button");
    btn.disabled = true; btn.textContent = "Working...";
    try {
      var v = values();
      var d = await ai({
        prompt: cur.sys + " " + MD.STYLES[MD.getStyle()] + " The person is following up on your earlier answer. Apply their request to it, keep what already works, use markdown, stay under 600 words." + MD.FOLLOW_RULE,
        input: "ORIGINAL REQUEST:\n" + describe(v) + "\n\nYOUR EARLIER ANSWER:\n" + lastText.slice(0, 6000) + "\n\nFOLLOW-UP REQUEST:\n" + ask,
        maxTokens: 1000, web: cur.web ? true : undefined
      });
      refineIn.value = "";
      showOut(d.text || "No answer came back.");
    } catch (err) { errEl.textContent = err.message; }
    finally { btn.disabled = false; btn.textContent = "Send"; }
  });

  // ----- copy, share, download, regenerate, feedback -----
  function flash(btn, msg) { var o = btn.getAttribute("data-label") || btn.textContent; btn.setAttribute("data-label", o); btn.textContent = msg; setTimeout(function () { btn.textContent = o; }, 1500); }
  $("act-copy").addEventListener("click", function () {
    var b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(lastText) : Promise.reject()).then(function () { flash(b, "Copied"); }, function () { flash(b, "Copy failed"); });
  });
  $("act-share").addEventListener("click", function () {
    var b = this;
    if (navigator.share) { navigator.share({ title: cur.name + " - Synswer", text: lastText.slice(0, 1500), url: location.href.split("#")[0] }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(lastText) : Promise.reject()).then(function () { flash(b, "Copied to share"); }, function () { flash(b, "Share unavailable"); });
  });
  $("act-dl").addEventListener("click", function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lastText], { type: "text/markdown" }));
    a.download = "synswer-" + cur.id + ".md";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  $("act-again").addEventListener("click", function () { form.requestSubmit(); });
  fbBox.addEventListener("click", async function (e) {
    var r = e.target.getAttribute && e.target.getAttribute("data-rate");
    if (!r) return;
    var msg = fbBox.querySelector(".fb-msg");
    var a = solution();
    await window.synswerUserReady;
    if (!window.synswerUser && !a) { msg.textContent = "Security check still running, try again in a second."; return; }
    try {
      var res = await fetch("api/rows/answer_feedback", { method: "POST", credentials: "include", headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: { source: "tool:" + cur.id, rating: r, user_id: window.synswerUser ? window.synswerUser.id : null }, altcha: window.synswerUser ? undefined : a }) });
      msg.textContent = res.ok ? "Thanks for the feedback." : "Feedback could not be saved.";
    } catch (_) { msg.textContent = "Feedback could not be saved."; }
    armCaptcha();
  });

  renderRecent();
  open(location.hash.slice(1));
})();
