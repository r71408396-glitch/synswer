// Loads one mini game into play.html: ?g=<id>
(function () {
  var id = new URLSearchParams(location.search).get("g");
  var m = (window.GAME_META || []).filter(function (x) { return x.id === id; })[0];
  if (!m) { location.replace("games.html"); return; }
  window.GAME_CFG = m;
  document.body.setAttribute("data-game", id);
  var can = document.querySelector('link[rel="canonical"]');
  if (can) can.setAttribute("href", "https://synswer.com/play.html?g=" + encodeURIComponent(id));
  document.title = m.title + " - Synswer Games";
  document.getElementById("game-title").textContent = m.title;
  document.getElementById("ov-title").textContent = m.title;
  document.getElementById("ov-text").textContent = m.desc;
  document.getElementById("game-hint").textContent = m.hint;
  var wrap = document.getElementById("wrap");
  wrap.style.setProperty("--cw", m.w + "px");
  wrap.style.setProperty("--ar", String(m.w / m.h));
  var cv = document.getElementById("game");
  cv.width = m.w;
  cv.height = m.h;
  ["games.js", "engine.js", "games/" + id + ".js"].forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    document.body.appendChild(s);
  });
})();
