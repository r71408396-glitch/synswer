// Cookie consent (shared by every page)
(function () {
  var banner = document.getElementById("cookie");
  if (!banner) return;
  banner.addEventListener("click", function (e) {
    var choice = e.target.getAttribute && e.target.getAttribute("data-consent");
    if (!choice) return;
    try { localStorage.setItem("synswer-consent", choice); } catch (_) {}
    document.documentElement.classList.add("consent-set");
  });
})();

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
        "&generator=search&gsrlimit=4&gsrsearch=" + encodeURIComponent(q) +
        "&prop=extracts&exintro=1&explaintext=1&exchars=1200";
      var res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return [];
      var data = await res.json();
      var pages = data && data.query && data.query.pages ? Object.keys(data.query.pages).map(function (k) { return data.query.pages[k]; }) : [];
      return pages
        .filter(function (p) { return p.extract && p.extract.length > 80; })
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

  function renderSources(list) {
    if (!sourcesEl) return;
    sourcesEl.innerHTML = "";
    list.forEach(function (s) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.title + " (Wikipedia)";
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
    document.dispatchEvent(new CustomEvent("synswer:view"));
  }

  function setBody(text, loading) {
    bodyEl.classList.toggle("is-loading", !!loading);
    bodyEl.innerHTML = "";
    String(text).split(/\n{2,}/).forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para.trim();
      if (p.textContent) bodyEl.appendChild(p);
    });
    if (!loading) document.dispatchEvent(new CustomEvent("synswer:answer"));
  }

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
    showAnswer(q);
    setBody("Reading sources...", true);
    renderSources([]);

    var sources = await lookupSources(q);
    renderSources(sources);
    setBody("Thinking...", true);

    var reference = sources.length
      ? sources.map(function (s, i) { return "[" + (i + 1) + "] " + s.title + ": " + s.extract; }).join("\n\n")
      : "";

    try {
      var res = await fetch("api/ai/complete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt:
            "You are Synswer, a calm and precise answer engine. Answer the QUESTION in plain paragraphs (no markdown, no bullet symbols, no headings, no citation numbers), at most 220 words. Lead with the direct answer. REFERENCE holds excerpts from Wikipedia articles found for this question. Use only the parts that are relevant, ignore irrelevant ones, check them against what you know, and explain the result entirely in your own words: never copy sentences from the excerpts and never quote them. If the reference is empty or does not help, answer from your own knowledge. You cannot see live data: if the question depends on recent events, say plainly that your answer may be out of date and what to check. Never invent sources, links or quotes.",
          input: "QUESTION:\n" + q + "\n\nREFERENCE:\n" + (reference || "(none found)"),
          maxTokens: 700,
          altcha: altcha
        }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setBody(data.error || "Synswer could not answer right now. Please try again in a moment.", false);
      } else {
        setBody(data.text || "No answer came back. Please try again.", false);
        input.value = "";
      }
    } catch (_) {
      setBody("Synswer could not answer right now. Please check your connection and try again.", false);
    } finally {
      submit.disabled = false;
      armCaptcha();
    }
  });

  againBtn.addEventListener("click", function () {
    answerView.hidden = true;
    home.hidden = false;
    document.dispatchEvent(new CustomEvent("synswer:home"));
    input.focus();
  });
})();
