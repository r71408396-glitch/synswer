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
    setBody("Thinking...", true);

    try {
      var res = await fetch("api/ai/complete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt:
            "You are Synswer, a calm and precise answer engine. Answer the question in plain paragraphs (no markdown, no bullet symbols, no headings), at most 220 words. Lead with the direct answer. You cannot browse the web: if the question depends on recent events or live data, say plainly that your knowledge may be out of date and what to check. Never invent sources, links or quotes.",
          input: q,
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
