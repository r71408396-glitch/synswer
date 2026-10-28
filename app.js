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
  function isTech(q) { return /\b(ai|llm|gpt|software|programming|code|coding|developer|javascript|python|rust|linux|startup|app|api|framework|library|chip|gpu|cyber|security|crypto|open source|tech|computer)\b/i.test(q); }
  function isHowTo(q) { return /\b(how (do|to|can)|error|bug|fix|install|syntax|function|array|css|html|sql|regex|git|docker|exception)\b/i.test(q); }
  function isScience(q) { return /\b(study|studies|research|paper|evidence|clinical|trial|health|disease|vaccine|cancer|diet|sleep|climate|physics|chemistry|biology|psychology|effect|effects|cause|causes|risk|treatment)\b/i.test(q); }

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

  var lastNewsAt = 0;

  // Recent headlines from GDELT (public, no key). Fails quietly, skips when throttled.
  async function lookupNews(q) {
    if (!isTimely(q)) return [];
    var now = Date.now();
    if (now - lastNewsAt < 5500) return [];
    lastNewsAt = now;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 6000);
    try {
      var terms = q.replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
      if (terms.length < 3) return [];
      var url = "https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=8&sort=hybridrel&timespan=7d" +
        "&query=" + encodeURIComponent(terms + " sourcelang:english");
      var res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return [];
      var data = await res.json();
      var seen = {};
      return (data.articles || [])
        .filter(function (a) {
          if (!a.title || !a.url || seen[a.domain + a.title]) return false;
          seen[a.domain + a.title] = 1;
          return true;
        })
        .slice(0, 5)
        .map(function (a) {
          var d = a.seendate || "";
          var date = d.length >= 8 ? d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8) : "";
          return { kind: "news", title: a.title, publisher: a.domain || "unknown", date: date, url: a.url };
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
      a.textContent = s.kind
        ? s.publisher + (s.date ? ", " + s.date : "") + ": " + (s.title.length > 70 ? s.title.slice(0, 67) + "..." : s.title)
        : s.title + " (Wikipedia)";
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

    var found = await Promise.all([lookupSources(q), lookupNews(q), lookupHN(q), lookupStack(q), lookupPapers(q)]);
    var wiki = found[0];
    var news = found[1];
    var leads = found[2].concat(found[3], found[4]);
    var sources = wiki.concat(news, leads);
    renderSources(sources);
    setBody("Cross-checking sources...", true);

    var reference = wiki.map(function (s, i) { return "[Wikipedia " + (i + 1) + "] " + s.title + ": " + s.extract; }).join("\n\n");
    if (news.length) {
      reference += (reference ? "\n\n" : "") + "RECENT NEWS HEADLINES (headline only, no article text):\n" +
        news.map(function (n) { return "- " + n.publisher + ", " + n.date + ": " + n.title; }).join("\n");
    }
    if (leads.length) {
      reference += (reference ? "\n\n" : "") + "OTHER RELEVANT SOURCES (titles only, the content was not read):\n" +
        leads.map(function (n) { return "- " + n.publisher + (n.date ? ", " + n.date : "") + ": " + n.title; }).join("\n");
    }

    try {
      var res = await fetch("api/ai/complete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt:
            "You are Synswer, a calm and precise answer engine. Answer the QUESTION in plain paragraphs (no markdown, no bullet symbols, no headings, no citation numbers), at most 220 words. Lead with the direct answer. REFERENCE holds excerpts from Wikipedia articles found for this question. Use only the parts that are relevant, ignore irrelevant ones, check them against what you know, and explain the result entirely in your own words: never copy sentences from the excerpts and never quote them. If REFERENCE includes recent news headlines, treat them as reports, not confirmed fact: attribute them in your own words (for example, according to reports from the publisher, dated the given date), do not claim details a headline does not state, and say plainly when the headlines are thin. REFERENCE may also list titles from other sources (Hacker News, Stack Overflow, scholarly papers): these show what exists on the topic but their content was not read, so use them only to confirm that a topic or finding is real and discussed, never to state details they do not give. Cross-check the sources against each other: prefer claims that more than one source supports, and if sources disagree or only one supports a point, say so briefly. If the reference is empty or does not help, answer from your own knowledge. You cannot see live data: if the question depends on recent events, say plainly that your answer may be out of date and what to check. Never invent sources, links or quotes.",
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
