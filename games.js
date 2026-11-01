// Shared by the games hub and every game page: overlay, best score, leaderboard and score saving.
(function () {
  var G = (window.GameUI = {});
  var game = document.body.getAttribute("data-game");
  var lastScore = 0;

  // Hub thumbnails, drawn on a 56x56 grid in the same style as Snake, Tetris and Space Shooter.
  var THUMBS = {
    gridlock: '<rect x="6" y="22" width="24" height="12" rx="3" fill="#8b5cf6"/><rect x="36" y="8" width="12" height="26" rx="3" fill="#60a5fa"/><rect x="10" y="40" width="36" height="10" rx="3" fill="#c084fc"/><path d="M34 28h16m-5-5 5 5-5 5" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    colorlink: '<path d="M12 14h16v16h16" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 44h32" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="14" r="6" fill="#60a5fa"/><circle cx="44" cy="30" r="6" fill="#60a5fa"/><circle cx="12" cy="44" r="6" fill="#c084fc"/><circle cx="44" cy="44" r="6" fill="#c084fc"/>',
    merge: '<rect x="5" y="16" width="20" height="24" rx="5" fill="#6d28d9"/><rect x="31" y="16" width="20" height="24" rx="5" fill="#8b5cf6"/><text x="15" y="34" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">2</text><text x="41" y="34" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">4</text>',
    perfecttap: '<rect x="4" y="26" width="48" height="4" rx="2" fill="#34343f"/><rect x="21" y="12" width="14" height="32" rx="3" fill="#8b5cf6" fill-opacity=".55"/><rect x="27" y="8" width="2" height="40" fill="#c4b5fd"/><circle cx="39" cy="28" r="7" fill="#60a5fa"/>',
    tilestep: '<rect x="4" y="6" width="11" height="16" rx="2" fill="#4c1d95"/><rect x="16" y="22" width="11" height="16" rx="2" fill="#8b5cf6"/><rect x="28" y="6" width="11" height="16" rx="2" fill="#4c1d95"/><rect x="40" y="38" width="11" height="14" rx="2" fill="#60a5fa"/><rect x="4" y="38" width="11" height="14" rx="2" fill="#4c1d95"/>',
    deflect: '<circle cx="28" cy="28" r="7" fill="#60a5fa"/><path d="M10 28a18 18 0 0 1 36 0" fill="none" stroke="#a78bfa" stroke-width="5" stroke-linecap="round"/><circle cx="28" cy="46" r="3.5" fill="#f87171"/><circle cx="48" cy="46" r="3" fill="#f87171"/>',
    gravity: '<rect x="4" y="8" width="48" height="3" rx="1.5" fill="#8b5cf6"/><rect x="4" y="45" width="48" height="3" rx="1.5" fill="#8b5cf6"/><rect x="10" y="30" width="14" height="14" rx="4" fill="#60a5fa"/><path d="M38 44V32l5-0 0 12z" fill="#ef4444"/><path d="M46 11v10h5V11z" fill="#ef4444"/>',
    orbit: '<circle cx="24" cy="32" r="12" fill="none" stroke="#a78bfa" stroke-opacity=".5" stroke-width="2"/><circle cx="24" cy="32" r="6" fill="#8b5cf6"/><circle cx="44" cy="12" r="5" fill="#22c55e"/><path d="M32 22l8-6" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M33 22l5-1-2 5z" fill="#60a5fa"/>',
    helix: '<rect x="6" y="14" width="44" height="7" rx="3" fill="#6d28d9"/><rect x="24" y="14" width="10" height="7" fill="#07070b"/><rect x="6" y="36" width="44" height="7" rx="3" fill="#6d28d9"/><rect x="12" y="36" width="9" height="7" fill="#ef4444"/><circle cx="29" cy="7" r="5" fill="#60a5fa"/>',
    simon: '<rect x="6" y="6" width="20" height="20" rx="6" fill="#ef4444"/><rect x="30" y="6" width="20" height="20" rx="6" fill="#3b82f6"/><rect x="6" y="30" width="20" height="20" rx="6" fill="#22c55e"/><rect x="30" y="30" width="20" height="20" rx="6" fill="#eab308"/>',
    pairmatch: '<rect x="5" y="12" width="21" height="30" rx="5" fill="#3b82f6"/><rect x="30" y="12" width="21" height="30" rx="5" fill="#2a2a4a" stroke="#4c1d95" stroke-width="2"/><text x="15.5" y="33" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#fff">A</text><text x="40.5" y="33" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="16" fill="#8b7bd0">?</text>',
    pathtrace: '<path d="M10 10h18v18h18v18" fill="none" stroke="#c4b5fd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="6" fill="#22c55e"/><circle cx="28" cy="28" r="4" fill="#8b5cf6"/><circle cx="46" cy="46" r="5" fill="#60a5fa"/><circle cx="46" cy="10" r="2.5" fill="#34343f"/><circle cx="10" cy="46" r="2.5" fill="#34343f"/>',
    brick: '<rect x="6" y="8" width="13" height="8" fill="#ef4444"/><rect x="21" y="8" width="13" height="8" fill="#eab308"/><rect x="36" y="8" width="13" height="8" fill="#22c55e"/><rect x="13" y="18" width="13" height="8" fill="#3b82f6"/><rect x="28" y="18" width="13" height="8" fill="#a855f7"/><circle cx="32" cy="38" r="4" fill="#dbeafe"/><rect x="16" y="46" width="26" height="5" rx="2.5" fill="#8b5cf6"/>',
    glitch: '<rect x="6" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="6" width="14" height="14" rx="4" fill="#171726"/><rect x="6" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="21" width="14" height="14" rx="4" fill="#171726"/><rect x="6" y="36" width="14" height="14" rx="4" fill="#171726"/><rect x="21" y="36" width="14" height="14" rx="4" fill="#171726"/><rect x="36" y="36" width="14" height="14" rx="4" fill="#171726"/><circle cx="28" cy="28" r="5.5" fill="#16a34a"/><circle cx="43" cy="13" r="5.5" fill="#dc2626"/>',
    slice: '<circle cx="26" cy="30" r="15" fill="#22c55e"/><circle cx="26" cy="30" r="9" fill="#bbf7d0" fill-opacity=".5"/><path d="M8 52L50 8" stroke="#c4b5fd" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="46" r="6" fill="#1f2937" stroke="#ef4444" stroke-width="2"/>'
  };

  function $(id) { return document.getElementById(id); }

  // ----- hub: show each game's top score -----
  if (!game) {
    var metaList = window.GAME_META || [];
    var grid = document.querySelector(".game-grid");
    if (grid && metaList.length) {
      metaList.forEach(function (m, i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "game-tile";
        a.href = "play.html?g=" + m.id;
        a.innerHTML =
          '<svg viewBox="0 0 56 56" aria-hidden="true">' + (THUMBS[m.id] || "") + "</svg>" +
          "<h2></h2><p></p>" +
          '<span class="tile-top" data-top="' + m.id + '">Top score: none yet</span><span class="tile-play">Play</span>';
        a.querySelector("h2").textContent = m.title;
        a.querySelector("p").textContent = m.tag + ": " + m.desc;
        li.appendChild(a);
        grid.appendChild(li);
      });
    }
    var search = document.getElementById("game-search"), none = document.getElementById("no-games");
    if (search && grid) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase(), shown = 0;
        grid.querySelectorAll("li").forEach(function (li) {
          var h = li.querySelector("h2");
          var hit = !q || (h && h.textContent.toLowerCase().indexOf(q) >= 0);
          li.hidden = !hit;
          if (hit) shown++;
        });
        if (none) none.hidden = shown > 0;
      });
    }
    var tops = document.querySelectorAll("[data-top]");
    if (tops.length) {
      fetch("api/rows/scores/aggregate?agg=max.score&group=game")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          (d.rows || []).forEach(function (row) {
            var el = document.querySelector('[data-top="' + row.game + '"]');
            if (el && row.max_score != null) el.textContent = "Top score: " + row.max_score;
          });
        })
        .catch(function () {});
    }
    return;
  }

  // ----- best score (this device) -----
  var bestKey = "synswer-best-" + game;
  function best() { try { return parseInt(localStorage.getItem(bestKey), 10) || 0; } catch (_) { return 0; } }
  function setBest(n) { try { localStorage.setItem(bestKey, String(n)); } catch (_) {} }
  $("best").textContent = best();

  G.onStart = null;
  G.setScore = function (n) {
    $("score").textContent = n;
    if (n > best()) { setBest(n); $("best").textContent = n; }
  };
  G.typing = function () { return !!document.querySelector("dialog[open]"); };

  // ----- pause -----
  var playing = false, paused = false, plays = 0;
  G.onPause = null;
  G.onResume = null;
  var pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "pause-btn";
  pauseBtn.textContent = "Pause";
  pauseBtn.hidden = true;
  var hud = document.querySelector(".hud");
  var S = window.Sound;
  var muteBtn = document.createElement("button");
  muteBtn.type = "button";
  muteBtn.className = "pause-btn";
  function muteLabel() { muteBtn.textContent = S && S.muted ? "Sound off" : "Sound on"; }
  muteLabel();
  muteBtn.addEventListener("click", function () {
    muteBtn.blur();
    if (!S) return;
    S.toggle();
    muteLabel();
    if (!S.muted) { S.play("start"); if (playing && !paused) S.music(true); }
  });
  var vol = document.createElement("input");
  vol.type = "range";
  vol.className = "vol";
  vol.min = "0";
  vol.max = "100";
  vol.step = "5";
  vol.value = S ? Math.round(S.volume * 100) : 70;
  vol.setAttribute("aria-label", "Volume");
  vol.addEventListener("input", function () {
    if (!S) return;
    S.setVolume(vol.value / 100);
    if (S.muted && vol.value > 0) { S.toggle(); muteLabel(); }
  });
  vol.addEventListener("change", function () { if (S && !S.muted) S.play("eat"); vol.blur(); });
  var card = document.querySelector(".game-card");
  var fsBtn = document.createElement("button");
  fsBtn.type = "button";
  fsBtn.className = "pause-btn";
  fsBtn.textContent = "Fullscreen";
  var canFs = card && (card.requestFullscreen || card.webkitRequestFullscreen);
  function fsOn() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function fsLabel() { fsBtn.textContent = fsOn() ? "Exit fullscreen" : "Fullscreen"; }
  fsBtn.addEventListener("click", function () {
    fsBtn.blur();
    if (fsOn()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { try { (card.requestFullscreen || card.webkitRequestFullscreen).call(card); } catch (_) {} }
  });
  document.addEventListener("fullscreenchange", fsLabel);
  document.addEventListener("webkitfullscreenchange", fsLabel);
  if (hud) { hud.appendChild(muteBtn); hud.appendChild(vol); if (canFs) hud.appendChild(fsBtn); hud.appendChild(pauseBtn); }

  // While a round is running, the game area never scrolls the page (touch, wheel, space and arrow keys).
  function lockScroll() { document.body.classList.toggle("game-active", playing && !paused); }
  function stopScroll(e) { if (playing && !paused && e.cancelable) e.preventDefault(); }
  if (card) {
    card.addEventListener("touchmove", stopScroll, { passive: false });
    card.addEventListener("wheel", stopScroll, { passive: false });
  }
  window.addEventListener("keydown", function (e) {
    if (!playing || paused || G.typing()) return;
    var k = e.key;
    if (k === " " || k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight" || k === "PageUp" || k === "PageDown") e.preventDefault();
  });

  function setPaused(on) {
    if (!playing || paused === on) return;
    paused = on;
    lockScroll();
    if (S) { S.play("pause"); S.music(!on); }
    if (on) {
      if (G.onPause) G.onPause();
      $("ov-title").textContent = "Paused";
      $("ov-text").textContent = "Press P or Resume to keep playing.";
      $("start").textContent = "Resume";
      $("save").hidden = true;
      $("overlay").hidden = false;
      pauseBtn.textContent = "Resume";
    } else {
      $("overlay").hidden = true;
      if (G.onResume) G.onResume();
      pauseBtn.textContent = "Pause";
    }
  }
  pauseBtn.addEventListener("click", function () { pauseBtn.blur(); setPaused(!paused); });
  document.addEventListener("keydown", function (e) {
    if (G.typing()) return;
    var k = e.key.toLowerCase();
    if (k === "p" || (k === "escape" && playing)) { e.preventDefault(); setPaused(!paused); }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) setPaused(true); });

  G.over = function (score) {
    playing = false;
    paused = false;
    lockScroll();
    pauseBtn.hidden = true;
    pauseBtn.textContent = "Pause";
    lastScore = score;
    if (S) { S.music(false); S.play("gameover"); }
    $("ov-title").textContent = "Game over";
    $("ov-text").textContent = "You scored " + score + ".";
    $("start").textContent = "Play again";
    $("save").hidden = !(score > 0);
    $("overlay").hidden = false;
    // One ad after every 4 games played in a row (only once cookies were accepted)
    plays++;
    if (plays >= 4) {
      plays = 0;
      var ad = $("game-ad");
      if (!ad) {
        ad = document.createElement("div");
        ad.id = "game-ad";
        ad.setAttribute("data-ad-box", "");
        ad.hidden = true;
        ad.style.cssText = "width:100%;max-width:320px;margin-top:6px;overflow:hidden";
        $("overlay").appendChild(ad);
      }
      if (window.SynswerAds) window.SynswerAds.fill(ad);
    }
  };

  $("start").addEventListener("click", function () {
    $("start").blur();
    var gad = $("game-ad");
    if (gad && window.SynswerAds) window.SynswerAds.clear(gad);
    if (paused) { setPaused(false); return; }
    $("overlay").hidden = true;
    playing = true;
    lockScroll();
    pauseBtn.hidden = false;
    if (S) { S.unlock(); S.play("start"); S.music(true); }
    if (G.onStart) G.onStart();
  });

  // ----- leaderboard -----
  var mode = "week";
  function weekStart() {
    var d = new Date();
    var day = (d.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString();
  }
  var boardEl = document.querySelector(".board");
  var boardHead = boardEl && boardEl.querySelector("h2");
  if (boardHead) {
    var tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.innerHTML = '<button type="button" class="tab is-on" data-mode="week">This week</button><button type="button" class="tab" data-mode="all">All time</button>';
    boardHead.after(tabs);
    tabs.addEventListener("click", function (e) {
      var m = e.target.getAttribute && e.target.getAttribute("data-mode");
      if (!m) return;
      mode = m;
      tabs.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === m); });
      loadBoard();
    });
    var note = document.createElement("p");
    note.className = "board-note";
    note.textContent = "Weekly boards reset every Monday (UTC).";
    boardEl.appendChild(note);
  }
  function loadBoard() {
    var el = $("leaderboard");
    var extra = mode === "week" ? "&created_at=gte." + encodeURIComponent(weekStart()) : "";
    fetch("api/rows/scores?game=eq." + game + extra + "&select=player,score&sort=-score&limit=10")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        el.innerHTML = "";
        var rows = d.rows || [];
        if (!rows.length) {
          var e = document.createElement("li");
          e.className = "empty";
          e.textContent = mode === "week" ? "No scores this week. Be the first." : "No scores yet. Be the first.";
          el.appendChild(e);
          return;
        }
        rows.forEach(function (row) {
          var li = document.createElement("li");
          var nm = document.createElement("span");
          nm.className = "nm";
          nm.textContent = row.player;
          var sc = document.createElement("span");
          sc.className = "sc";
          sc.textContent = row.score;
          li.appendChild(nm);
          li.appendChild(sc);
          el.appendChild(li);
        });
      })
      .catch(function () {});
  }
  loadBoard();

  // ----- save score dialog -----
  var dlg = document.createElement("dialog");
  dlg.className = "dlg";
  dlg.innerHTML =
    '<form id="score-form" autocomplete="off">' +
    "<h2>Save your score</h2>" +
    '<p id="score-line"></p>' +
    '<label for="player-name">Your name</label>' +
    '<input id="player-name" type="text" maxlength="20" required />' +
    '<altcha-widget id="captcha-score" style="display:block;margin:14px 0 0"></altcha-widget>' +
    '<p class="form-error" id="score-error" role="alert"></p>' +
    '<div class="row"><button type="button" class="btn btn-ghost" id="score-cancel">Cancel</button>' +
    '<button type="submit" class="btn" id="score-submit">Save</button></div>' +
    "</form>";
  document.body.appendChild(dlg);

  async function armCaptcha() {
    try {
      var w = $("captcha-score");
      var challenge = await (await fetch("api/auth/challenge")).json();
      await customElements.whenDefined("altcha-widget");
      w.reset();
      w.configure({ challenge: challenge });
      w.verify();
    } catch (_) {}
  }

  $("save").addEventListener("click", function () {
    $("score-line").textContent = "Score: " + lastScore;
    $("score-error").textContent = "";
    try { $("player-name").value = (window.synswerUser && window.synswerUser.name) || localStorage.getItem("synswer-player") || ""; } catch (_) {}
    if (!$("player-name").value && window.synswerUser && window.synswerUser.name) $("player-name").value = window.synswerUser.name;
    var isNew = (window.GAME_META || []).some(function (m) { return m.id === game; });
    var locked = isNew && !window.synswerUser;
    $("score-submit").disabled = locked;
    if (locked) {
      $("score-error").innerHTML = 'Leaderboards are for signed-in players. <a href="login.html?next=index.html">Sign in</a> or <a href="signup.html?next=index.html">create an account</a>, then play again.';
    }
    dlg.showModal();
    $("player-name").focus();
    armCaptcha();
  });
  $("score-cancel").addEventListener("click", function () { dlg.close(); });

  $("score-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = $("player-name").value.trim();
    var err = $("score-error");
    if (!name) return;
    var field = $("captcha-score").querySelector('input[name="altcha"]');
    var altcha = field ? field.value : "";
    if (!altcha) { err.textContent = "Finishing the security check, try again in a second."; return; }
    var btn = $("score-submit");
    btn.disabled = true;
    err.textContent = "";
    try {
      var res = await fetch("api/rows/scores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: { game: game, player: name, score: lastScore }, altcha: altcha })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        err.textContent = data.error || "Could not save your score. Please try again.";
        armCaptcha();
      } else {
        try { localStorage.setItem("synswer-player", name); } catch (_) {}
        dlg.close();
        if (S) S.play("saved");
        $("save").hidden = true;
        $("ov-text").textContent = "Score saved: " + lastScore + ".";
        loadBoard();
      }
    } catch (_) {
      err.textContent = "Could not save your score. Check your connection.";
      armCaptcha();
    } finally {
      btn.disabled = false;
    }
  });
})();
