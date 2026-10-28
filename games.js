// Shared by the games hub and every game page: overlay, best score, leaderboard and score saving.
(function () {
  var G = (window.GameUI = {});
  var game = document.body.getAttribute("data-game");
  var lastScore = 0;

  function $(id) { return document.getElementById(id); }

  // ----- hub: show each game's top score -----
  if (!game) {
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

  G.over = function (score) {
    lastScore = score;
    $("ov-title").textContent = "Game over";
    $("ov-text").textContent = "You scored " + score + ".";
    $("start").textContent = "Play again";
    $("save").hidden = !(score > 0);
    $("overlay").hidden = false;
  };

  $("start").addEventListener("click", function () {
    $("overlay").hidden = true;
    $("start").blur();
    if (G.onStart) G.onStart();
  });

  // ----- leaderboard -----
  function loadBoard() {
    var el = $("leaderboard");
    fetch("api/rows/scores?game=eq." + game + "&select=player,score&sort=-score&limit=10")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        el.innerHTML = "";
        var rows = d.rows || [];
        if (!rows.length) {
          var e = document.createElement("li");
          e.className = "empty";
          e.textContent = "No scores yet. Be the first.";
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
    try { $("player-name").value = localStorage.getItem("synswer-player") || ""; } catch (_) {}
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
