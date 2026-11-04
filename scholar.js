// Synswer scholarly search: eight free, key-less academic APIs queried in parallel from the visitor's browser.
// OpenAlex, Semantic Scholar, Crossref, Europe PMC, arXiv, PubMed, DOAJ and Unpaywall.
// None of them needs a secret, so nothing sensitive lives in this file. Results are merged, de-duplicated,
// ranked, and cached for 24 hours in the browser to keep request counts low.
window.SynswerScholar = (function () {
  var CONTACT = "contact@synswer.com"; // Unpaywall asks for a contact address with each request (not a secret)
  var CACHE_KEY = "synswer-scholar-v1", TTL = 24 * 3600 * 1000, MAX_CACHE = 20;
  var STOP = "the a an and or of to in on for with is are was were be been how what why when where who which does do did can could should would about from into than then this that these those it its my your you me i we they them there their as at by not vs versus best top new tell explain please give show find study studies research paper papers evidence scientific scholarly article articles".split(" ");

  function terms(q) {
    return String(q).toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; });
  }
  function keywordQuery(q) { var t = terms(q).slice(0, 8); return t.length ? t.join(" ") : String(q).slice(0, 120); }
  function overlap(text, ts) {
    if (!ts.length) return 1;
    var t = String(text || "").toLowerCase(), hit = 0;
    ts.forEach(function (w) { if (t.indexOf(w) >= 0) hit++; });
    return hit / ts.length;
  }

  // Does this question call for scholarly evidence?
  function isScholarly(q) {
    return /\b(stud(y|ies)|research(ers)?|papers?|peer[- ]review(ed)?|journals?|evidence|clinical|trials?|meta-?analys[ie]s|systematic review|randomi[sz]ed|scientists?|scientific|scholarly|academic|literature|citations?|doi|arxiv|pubmed|preprints?|hypothesis|findings|according to (science|research)|effects? of|link between|associated with|risk of|causes? of|does .* (cause|improve|reduce|prevent|increase)|efficacy|mechanism|theorem|algorithm|neural network|machine learning|quantum|genom|protein|vaccine|cancer|diabetes|dementia|alzheimer|covid|climate change|particle|dark matter|archaeolog|historians?|historical (evidence|records?|sources?)|ancient|medieval)\b/i.test(q);
  }

  // ---------- helpers ----------
  function timed(url, ms, opts) {
    var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, ms || 8000);
    var o = opts || {}; o.signal = ctrl.signal;
    return fetch(url, o).finally(function () { clearTimeout(timer); });
  }
  function json(url, ms) { return timed(url, ms).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
  function text(url, ms) { return timed(url, ms).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }); }
  function cleanDoi(d) { return d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim().toLowerCase() : ""; }
  function strip(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim(); }
  function trunc(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).trim() + "..." : s; }
  function yearOf(v) { var m = String(v || "").match(/(19|20)\d{2}/); return m ? parseInt(m[0], 10) : 0; }
  function paper(o) {
    return {
      title: strip(o.title), abstract: strip(o.abstract), authors: (o.authors || []).filter(Boolean).slice(0, 6),
      year: o.year || 0, doi: cleanDoi(o.doi), url: o.url || "", venue: strip(o.venue || ""), cites: o.cites || 0,
      type: o.type || "other", oa: o.oa || "", pmid: o.pmid || "", src: [o.src]
    };
  }

  // ---------- providers ----------
  function openAlex(q, n) {
    var sel = "id,doi,title,publication_year,cited_by_count,type,authorships,primary_location,best_oa_location,abstract_inverted_index";
    return json("https://api.openalex.org/works?search=" + encodeURIComponent(q) + "&per-page=" + n + "&select=" + sel).then(function (d) {
      return (d.results || []).map(function (w) {
        var abs = "";
        if (w.abstract_inverted_index) {
          var arr = [];
          Object.keys(w.abstract_inverted_index).forEach(function (word) { w.abstract_inverted_index[word].forEach(function (pos) { arr[pos] = word; }); });
          abs = arr.join(" ");
        }
        var src = w.primary_location && w.primary_location.source;
        var preprint = w.type === "preprint" || (src && src.type === "repository");
        var journal = !preprint && src && src.type === "journal";
        var oa = w.best_oa_location && (w.best_oa_location.landing_page_url || w.best_oa_location.pdf_url) || "";
        return paper({ src: "OpenAlex", title: w.title, abstract: abs, year: w.publication_year, doi: w.doi, cites: w.cited_by_count,
          authors: (w.authorships || []).map(function (a) { return a.author && a.author.display_name; }), venue: src && src.display_name,
          type: preprint ? "preprint" : journal ? "journal" : "other", oa: oa, url: w.doi || w.id });
      });
    });
  }
  function semanticScholar(q, n) {
    var f = "title,abstract,year,authors,citationCount,externalIds,venue,openAccessPdf,publicationTypes,url";
    return json("https://api.semanticscholar.org/graph/v1/paper/search?limit=" + n + "&fields=" + f + "&query=" + encodeURIComponent(q)).then(function (d) {
      return (d.data || []).map(function (p) {
        var ex = p.externalIds || {}, doi = ex.DOI || "";
        var isArx = /arxiv/i.test(p.venue || "") || /^10\.48550\//.test(doi) || (ex.ArXiv && !doi);
        var jt = (p.publicationTypes || []).indexOf("JournalArticle") >= 0;
        return paper({ src: "Semantic Scholar", title: p.title, abstract: p.abstract, year: p.year, doi: doi, cites: p.citationCount,
          authors: (p.authors || []).map(function (a) { return a.name; }), venue: p.venue,
          type: isArx ? "preprint" : jt ? "journal" : "other", oa: p.openAccessPdf && p.openAccessPdf.url || "",
          url: doi ? "https://doi.org/" + doi : p.url });
      });
    });
  }
  function crossref(q, n) {
    var sel = "title,DOI,container-title,issued,author,abstract,type,is-referenced-by-count,URL";
    return json("https://api.crossref.org/works?rows=" + n + "&select=" + sel + "&query.bibliographic=" + encodeURIComponent(q)).then(function (d) {
      return ((d.message && d.message.items) || []).filter(function (it) { return it.title && it.title[0]; }).map(function (it) {
        var y = it.issued && it.issued["date-parts"] && it.issued["date-parts"][0] ? it.issued["date-parts"][0][0] : 0;
        return paper({ src: "Crossref", title: it.title[0], abstract: it.abstract, year: y, doi: it.DOI, cites: it["is-referenced-by-count"],
          authors: (it.author || []).map(function (a) { return [a.given, a.family].filter(Boolean).join(" "); }),
          venue: it["container-title"] && it["container-title"][0], type: it.type === "journal-article" ? "journal" : it.type === "posted-content" ? "preprint" : "other",
          url: "https://doi.org/" + it.DOI });
      });
    });
  }
  function europePmc(q, n) {
    return json("https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=" + n + "&query=" + encodeURIComponent(q)).then(function (d) {
      return ((d.resultList && d.resultList.result) || []).map(function (r) {
        var preprint = r.source === "PPR" || /preprint/i.test(JSON.stringify(r.pubTypeList || ""));
        var oa = "";
        if (r.isOpenAccess === "Y") {
          var l = ((r.fullTextUrlList && r.fullTextUrlList.fullTextUrl) || []).filter(function (u) { return u.availability === "Open access"; })[0];
          oa = l ? l.url : "https://europepmc.org/article/" + r.source + "/" + r.id;
        }
        return paper({ src: "Europe PMC", title: r.title, abstract: r.abstractText, year: yearOf(r.pubYear), doi: r.doi, cites: r.citedByCount || 0,
          authors: String(r.authorString || "").replace(/\.$/, "").split(/,\s*/), venue: r.journalTitle || (preprint ? "Preprint server" : ""),
          type: preprint ? "preprint" : r.journalTitle ? "journal" : "other", oa: oa, pmid: r.pmid || "",
          url: r.doi ? "https://doi.org/" + r.doi : "https://europepmc.org/article/" + r.source + "/" + r.id });
      });
    });
  }
  function arxiv(q, n) {
    var ts = terms(q).slice(0, 5);
    if (!ts.length) return Promise.resolve([]);
    var sq = ts.map(function (t) { return "all:" + encodeURIComponent(t); }).join("+AND+");
    return text("https://export.arxiv.org/api/query?search_query=" + sq + "&max_results=" + n + "&sortBy=relevance").then(function (xml) {
      var doc = new DOMParser().parseFromString(xml, "application/xml");
      return [].slice.call(doc.getElementsByTagName("entry")).map(function (e) {
        var g = function (t) { var x = e.getElementsByTagName(t)[0]; return x ? x.textContent : ""; };
        var id = g("id").replace(/^http:/, "https:"), pdf = "";
        [].slice.call(e.getElementsByTagName("link")).forEach(function (l) { if (l.getAttribute("title") === "pdf") pdf = l.getAttribute("href").replace(/^http:/, "https:"); });
        var doiEl = e.getElementsByTagNameNS("*", "doi")[0];
        return paper({ src: "arXiv", title: g("title"), abstract: g("summary"), year: yearOf(g("published")), doi: doiEl ? doiEl.textContent : "",
          authors: [].slice.call(e.getElementsByTagName("author")).map(function (a) { var nm = a.getElementsByTagName("name")[0]; return nm ? nm.textContent : ""; }),
          venue: "arXiv", type: "preprint", oa: pdf || id, url: id });
      });
    });
  }
  function pubmed(q, n) {
    var base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
    return json(base + "esearch.fcgi?db=pubmed&retmode=json&sort=relevance&tool=synswer&retmax=" + n + "&term=" + encodeURIComponent(q)).then(function (d) {
      var ids = (d.esearchresult && d.esearchresult.idlist) || [];
      if (!ids.length) return [];
      return text(base + "efetch.fcgi?db=pubmed&retmode=xml&tool=synswer&id=" + ids.join(",")).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, "application/xml");
        return [].slice.call(doc.getElementsByTagName("PubmedArticle")).map(function (a) {
          var g = function (sel) { var x = a.querySelector(sel); return x ? x.textContent : ""; };
          var pmid = g("MedlineCitation > PMID"), doi = "";
          [].slice.call(a.querySelectorAll("ArticleId")).forEach(function (x) { if (x.getAttribute("IdType") === "doi") doi = x.textContent; });
          var abs = [].slice.call(a.querySelectorAll("Abstract > AbstractText")).map(function (x) { return x.textContent; }).join(" ");
          var year = yearOf(g("JournalIssue > PubDate > Year") || g("JournalIssue > PubDate > MedlineDate") || g("ArticleDate > Year"));
          return paper({ src: "PubMed", title: g("ArticleTitle"), abstract: abs, year: year, doi: doi, pmid: pmid,
            authors: [].slice.call(a.querySelectorAll("AuthorList > Author")).map(function (x) {
              var l = x.querySelector("LastName"), i = x.querySelector("Initials"); return l ? l.textContent + (i ? " " + i.textContent : "") : "";
            }), venue: g("Journal > Title"), type: "journal", url: "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/" });
        });
      });
    });
  }
  function doaj(q, n) {
    return json("https://doaj.org/api/search/articles/" + encodeURIComponent(q) + "?pageSize=" + n).then(function (d) {
      return (d.results || []).map(function (r) {
        var b = r.bibjson || {}, doi = "", full = "";
        (b.identifier || []).forEach(function (i) { if (i.type === "doi") doi = i.id; });
        (b.link || []).forEach(function (l) { if (l.type === "fulltext") full = l.url; });
        return paper({ src: "DOAJ", title: b.title, abstract: b.abstract, year: yearOf(b.year), doi: doi, authors: (b.author || []).map(function (a) { return a.name; }),
          venue: b.journal && b.journal.title, type: "journal", oa: full, url: doi ? "https://doi.org/" + doi : (full || "https://doaj.org/article/" + r.id) });
      });
    });
  }
  function unpaywall(doi) {
    return json("https://api.unpaywall.org/v2/" + encodeURIComponent(doi).replace(/%2F/g, "/") + "?email=" + CONTACT, 6000).then(function (d) {
      var l = d && d.is_oa && d.best_oa_location;
      return l ? (l.url_for_pdf || l.url || "") : "";
    });
  }

  var PROVIDERS = [["OpenAlex", openAlex], ["Semantic Scholar", semanticScholar], ["Crossref", crossref], ["Europe PMC", europePmc], ["arXiv", arxiv], ["PubMed", pubmed], ["DOAJ", doaj]];

  // ---------- merge, rank ----------
  function normTitle(t) { return String(t).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 90); }
  function merge(all) {
    var byKey = {}, list = [];
    all.forEach(function (p) {
      if (!p.title) return;
      var keys = [p.doi ? "d:" + p.doi : "", "t:" + normTitle(p.title)].filter(Boolean), hit = null;
      for (var i = 0; i < keys.length && !hit; i++) hit = byKey[keys[i]];
      if (!hit) { list.push(p); hit = p; }
      else {
        if (!hit.abstract || (p.abstract && p.abstract.length > hit.abstract.length)) hit.abstract = p.abstract;
        if (!hit.doi && p.doi) hit.doi = p.doi;
        if (!hit.oa && p.oa) hit.oa = p.oa;
        if (!hit.pmid && p.pmid) hit.pmid = p.pmid;
        if (!hit.venue && p.venue) hit.venue = p.venue;
        if (!hit.authors.length) hit.authors = p.authors;
        if (!hit.year) hit.year = p.year;
        hit.cites = Math.max(hit.cites, p.cites);
        // a journal record from any source outranks a preprint record of the same work
        if (hit.type !== "journal" && p.type === "journal") hit.type = "journal";
        else if (hit.type === "other" && p.type !== "other") hit.type = p.type;
        p.src.forEach(function (s) { if (hit.src.indexOf(s) < 0) hit.src.push(s); });
      }
      keys.forEach(function (k) { byKey[k] = hit; });
      if (hit.doi) byKey["d:" + hit.doi] = hit;
    });
    return list;
  }
  function rank(list, ts) {
    var now = new Date().getFullYear();
    list.forEach(function (p) {
      var rel = overlap(p.title, ts) * 0.7 + overlap(p.abstract, ts) * 0.3;
      var cred = (p.type === "journal" ? 0.6 : p.type === "preprint" ? 0.25 : 0.35) + Math.min(1, Math.log10(1 + p.cites) / 4) * 0.4;
      var rec = p.year ? Math.max(0, 1 - (now - p.year) / 15) : 0.2;
      var multi = Math.min(0.1, (p.src.length - 1) * 0.04);
      p.score = rel * 0.55 + cred * 0.25 + rec * 0.15 + multi;
      p.rel = rel;
    });
    return list.sort(function (a, b) { return b.score - a.score; });
  }

  // ---------- cache ----------
  function cacheGet(key) {
    try {
      var all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"), e = all[key];
      return e && Date.now() - e.t < TTL ? e : null;
    } catch (_) { return null; }
  }
  function cacheSet(key, val) {
    try {
      var all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      all[key] = { t: Date.now(), papers: val.papers, status: val.status };
      var keys = Object.keys(all).sort(function (a, b) { return all[b].t - all[a].t; });
      keys.slice(MAX_CACHE).forEach(function (k) { delete all[k]; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  // search(question, { deep: bool }) -> { papers, status: {provider: count | "unavailable"}, cached }
  function search(question, opts) {
    var deep = !!(opts && opts.deep), kq = keywordQuery(question), ts = terms(question);
    var key = (deep ? "d|" : "n|") + ts.slice().sort().join(" ");
    var hit = cacheGet(key);
    if (hit) return Promise.resolve({ papers: hit.papers, status: hit.status, cached: true });
    var per = deep ? 10 : 6, keep = deep ? 12 : 6, status = {};
    return Promise.all(PROVIDERS.map(function (pv) {
      return pv[1](kq, per).then(function (r) { status[pv[0]] = r.length; return r; }, function () { status[pv[0]] = "unavailable"; return []; });
    })).then(function (lists) {
      var all = [].concat.apply([], lists);
      var merged = merge(all).filter(function (p) { return p.rel === undefined; });
      merged = rank(merged, ts).filter(function (p) { return p.rel >= (ts.length > 2 ? 0.3 : 0.2) && p.title.length > 8; }).slice(0, keep);
      // legally accessible full text: ask Unpaywall about the best few papers that have a DOI but no open link yet
      var need = merged.filter(function (p) { return p.doi && !p.oa; }).slice(0, 4);
      return Promise.all(need.map(function (p) { return unpaywall(p.doi).then(function (u) { if (u) { p.oa = u; if (p.src.indexOf("Unpaywall") < 0) p.src.push("Unpaywall"); } status.Unpaywall = (status.Unpaywall || 0) + (u ? 1 : 0); }, function () { status.Unpaywall = status.Unpaywall || "unavailable"; }); }))
        .then(function () {
          merged.forEach(function (p) { p.abstract = trunc(p.abstract, 900); });
          var out = { papers: merged, status: status };
          if (merged.length || Object.keys(status).some(function (k) { return typeof status[k] === "number"; })) cacheSet(key, out);
          return { papers: merged, status: status, cached: false };
        });
    });
  }

  // ---------- presentation ----------
  function typeLabel(p) { return p.type === "journal" ? "Published journal article" : p.type === "preprint" ? "Preprint, not peer reviewed" : "Publication, type unverified"; }
  function authorsText(p) { return p.authors.length ? p.authors.slice(0, 3).join(", ") + (p.authors.length > 3 ? " et al." : "") : "authors not listed"; }
  // Evidence block for the model. cite(i) returns the tag to use, like "[S1]" or "[4]".
  function block(papers, cite) {
    return papers.map(function (p, i) {
      return cite(i) + " " + typeLabel(p).toUpperCase() + ". " + p.title + " (" + authorsText(p) + "; " + (p.year || "year not listed") + (p.venue ? "; " + p.venue : "") + ")" +
        (p.doi ? " DOI " + p.doi : "") + (p.cites ? "; cited " + p.cites + " times" : "") + (p.oa ? "; open access copy available" : "") +
        "\nAbstract: " + (p.abstract || "(no abstract available from the sources, so do not describe its findings)");
    }).join("\n\n");
  }
  var RULES = "SCHOLARLY EVIDENCE: the numbered records below were retrieved live from OpenAlex, Semantic Scholar, Crossref, Europe PMC, arXiv, PubMed, DOAJ and Unpaywall, de-duplicated and ranked. " +
    "Use ONLY these records for claims about research, and cite each claim with its tag exactly as written. Never invent a study, author, statistic, DOI or link, and never cite a tag that is not listed. " +
    "Describe findings only from the abstract shown; if a record has no abstract, say its findings were not available. Label each study you rely on as a published journal article or a preprint (not peer reviewed), as tagged. " +
    "Compare studies when there are several: note sample, method or population differences when the abstracts state them, say plainly where findings agree or conflict, and say what the evidence cannot show. " +
    "If the records do not answer the question, say so instead of stretching them. Mention citation counts only as a rough signal of attention, not of correctness.";

  return { search: search, isScholarly: isScholarly, block: block, rules: RULES, typeLabel: typeLabel, authorsText: authorsText, keywordQuery: keywordQuery };
})();
