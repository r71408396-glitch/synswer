// Shared by login.html, signup.html, forgot.html and reset.html (each page has one form).
(function () {
  var form = document.getElementById("auth-form");
  if (!form) return;
  var kind = form.getAttribute("data-auth");
  var errEl = document.getElementById("auth-error");
  var okEl = document.getElementById("auth-ok");
  var btn = form.querySelector("button[type=submit]");
  var params = new URLSearchParams(location.search);
  var next = params.get("next") || "index.html";
  if (!/^[a-z0-9_\-]+\.html$/i.test(next)) next = "index.html";

  document.querySelectorAll("[data-carry]").forEach(function (a) {
    a.setAttribute("href", a.getAttribute("href") + "?next=" + encodeURIComponent(next));
  });

  async function armCaptcha() {
    try {
      var w = document.getElementById("captcha");
      if (!w) return;
      var challenge = await (await fetch("api/auth/challenge")).json();
      await customElements.whenDefined("altcha-widget");
      w.reset();
      w.configure({ challenge: challenge });
      w.verify();
    } catch (_) {}
  }
  armCaptcha();

  function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errEl.textContent = "";
    if (okEl) okEl.textContent = "";
    var field = form.querySelector('input[name="altcha"]');
    var altcha = field ? field.value : "";
    if (kind !== "reset" && !altcha) { errEl.textContent = "Finishing the security check, try again in a second."; return; }

    var url, body;
    if (kind === "login") {
      url = "api/auth/login"; body = { email: val("email"), password: val("password"), altcha: altcha };
    } else if (kind === "signup") {
      url = "api/auth/register"; body = { name: val("name"), email: val("email"), password: val("password"), altcha: altcha };
    } else if (kind === "forgot") {
      url = "api/auth/forgot"; body = { email: val("email"), resetPath: "reset.html", altcha: altcha };
    } else {
      var pw = val("password");
      if (pw !== val("confirm")) { errEl.textContent = "The passwords do not match."; return; }
      url = "api/auth/reset"; body = { token: params.get("token") || "", password: pw };
    }

    btn.disabled = true;
    try {
      var res = await fetch(url, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        errEl.textContent = data.error || "Something went wrong. Please try again.";
        if (kind !== "reset") armCaptcha();
        return;
      }
      if (data.needsCode) { location.href = data.next; return; }
      if (kind === "forgot") {
        okEl.textContent = "If that address has an account, an email is on its way.";
        armCaptcha();
      } else if (kind === "reset") {
        location.replace("login.html");
      } else {
        location.replace(next);
      }
    } catch (_) {
      errEl.textContent = "Could not connect. Please try again.";
      if (kind !== "reset") armCaptcha();
    } finally {
      btn.disabled = false;
    }
  });
})();
