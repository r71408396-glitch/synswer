// Shared by the games hub and every game page: overlay, best score, leaderboard and score saving.
(function () {
  var G = (window.GameUI = {});
  var game = document.body.getAttribute("data-game");
  var lastScore = 0;

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
        var hue = (i * 47 + 250) % 360;
        a.innerHTML =
          '<svg viewBox="0 0 56 56" aria-hidden="true"><rect x="4" y="4" width="48" height="48" rx="12" fill="hsl(' + hue + ',60%,28%)" stroke="hsl(' + hue + ',80%,70%)" stroke-width="2"/><text x="28" y="35" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="20" fill="#fff"></text></svg>' +
          "<h2></h2><p></p>" +
          '<span class="tile-top" data-top="' + m.id + '">Top score: none yet</span><span class="tile-play">Play</span>';
        a.querySelector("text").textContent = m.title.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
        a.querySelector("h2").textContent = m.title;
        a.querySelector("p").textContent = m.tag + ": " + m.desc;
        li.appendChild(a);
        grid.appendChild(li);
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
  var playing = false, paused = false;
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
  if (hud) { hud.appendChild(muteBtn); hud.appendChild(vol); hud.appendChild(pauseBtn); }

  function setPaused(on) {
    if (!playing || paused === on) return;
    paused = on;
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
    pauseBtn.hidden = true;
    pauseBtn.textContent = "Pause";
    lastScore = score;
    if (S) { S.music(false); S.play("gameover"); }
    $("ov-title").textContent = "Game over";
    $("ov-text").textContent = "You scored " + score + ".";
    $("start").textContent = "Play again";
    $("save").hidden = !(score > 0);
    $("overlay").hidden = false;
  };

  $("start").addEventListener("click", function () {
    $("start").blur();
    if (paused) { setPaused(false); return; }
    $("overlay").hidden = true;
    playing = true;
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
