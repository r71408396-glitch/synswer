// Scientific calculator: safe expression parser (no eval), degrees/radians, memory, history.
(function () {
  var box = document.getElementById("calc-box");
  if (!box) return;
  var deg = true, ans = 0, mem = 0, hist = [];

  function fact(n) {
    if (n < 0 || Math.floor(n) !== n || n > 170) throw new Error("Factorial needs a whole number from 0 to 170");
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  var FN = {
    sin: function (x) { return Math.sin(deg ? x * Math.PI / 180 : x); },
    cos: function (x) { return Math.cos(deg ? x * Math.PI / 180 : x); },
    tan: function (x) { return Math.tan(deg ? x * Math.PI / 180 : x); },
    asin: function (x) { var r = Math.asin(x); return deg ? r * 180 / Math.PI : r; },
    acos: function (x) { var r = Math.acos(x); return deg ? r * 180 / Math.PI : r; },
    atan: function (x) { var r = Math.atan(x); return deg ? r * 180 / Math.PI : r; },
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp, fact: fact,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh
  };

  function parse(src) {
    var s = src.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/−/g, "-");
    var i = 0;
    function peek() { return s.charAt(i); }
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "-") { var o = s.charAt(i++); var r = term(); v = o === "+" ? v + r : v - r; }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var c = peek();
        if (c === "*" || c === "/") { i++; var r = unary(); v = c === "*" ? v * r : v / r; }
        else if (c === "(" || /[a-z]/i.test(c)) { v = v * power(); } // implicit multiplication: 2pi, 3(4)
        else break;
      }
      return v;
    }
    function unary() {
      if (peek() === "-") { i++; return -unary(); }
      if (peek() === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      var b = postfix();
      if (peek() === "^") { i++; var e = unary(); return Math.pow(b, e); }
      return b;
    }
    function postfix() {
      var v = atom();
      for (;;) {
        if (peek() === "!") { i++; v = fact(v); }
        else if (peek() === "%") { i++; v = v / 100; }
        else break;
      }
      return v;
    }
    function atom() {
      var c = peek();
      if (c === "(") { i++; var v = expr(); if (peek() !== ")") throw new Error("Missing closing bracket"); i++; return v; }
      var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (m && /[\d.]/.test(c)) { i += m[0].length; return parseFloat(m[0]); }
      var w = /^[a-z]+/i.exec(s.slice(i));
      if (w) {
        var name = w[0].toLowerCase();
        if (name === "pi") { i += 2; return Math.PI; }
        if (name === "ans") { i += 3; return ans; }
        if (name === "e") { i += 1; return Math.E; }
        if (FN[name]) {
          i += name.length;
          if (peek() !== "(") throw new Error("Use brackets after " + name);
          i++; var a = expr(); if (peek() !== ")") throw new Error("Missing closing bracket"); i++;
          return FN[name](a);
        }
        throw new Error("Unknown word: " + name);
      }
      throw new Error(i >= s.length ? "Expression is incomplete" : "Unexpected " + c);
    }
    var out = expr();
    if (i < s.length) throw new Error("Unexpected " + s.charAt(i));
    return out;
  }
  function fmt(n) {
    if (!isFinite(n)) throw new Error("Result is not a finite number");
    var r = parseFloat(n.toPrecision(12));
    if (Math.abs(r) >= 1e15 || (Math.abs(r) < 1e-9 && r !== 0)) return r.toExponential(8).replace(/\.?0+e/, "e");
    return String(r);
  }

  box.innerHTML =
    '<div class="calc">' +
    '<div class="calc-top"><button type="button" class="calc-mode" id="c-mode" aria-label="Toggle degrees and radians">DEG</button><span class="calc-mem" id="c-mem"></span></div>' +
    '<input id="c-in" class="calc-in" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="0" aria-label="Expression" />' +
    '<div class="calc-out" id="c-out" role="status" aria-live="polite">&nbsp;</div>' +
    '<div class="calc-keys" id="c-keys"></div>' +
    '<div class="calc-hist"><p class="eyebrow">History</p><ul id="c-hist"></ul></div>' +
    '</div>';

  var inp = document.getElementById("c-in"), out = document.getElementById("c-out"), keys = document.getElementById("c-keys");
  var LAYOUT = [
    ["sin(", "cos(", "tan(", "ln(", "log("],
    ["asin(", "acos(", "atan(", "sqrt(", "cbrt("],
    ["pi", "e", "^", "!", "%"],
    ["(", ")", "ans", "C", "DEL"],
    ["7", "8", "9", "÷", "MC"],
    ["4", "5", "6", "×", "MR"],
    ["1", "2", "3", "-", "M+"],
    ["0", ".", "EXP", "+", "="]
  ];
  LAYOUT.forEach(function (row) {
    row.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = k.length > 1 ? k.replace("(", "") : k;
      b.className = "ck" + (/^[0-9.]$/.test(k) ? " num" : k === "=" ? " eq" : /^(C|DEL|MC|MR|M\+)$/.test(k) ? " ctl" : "");
      b.setAttribute("data-k", k);
      keys.appendChild(b);
    });
  });

  function showMem() { document.getElementById("c-mem").textContent = mem ? "M = " + fmt(mem) : ""; }
  function insert(t) {
    var a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, z = inp.selectionEnd == null ? a : inp.selectionEnd;
    inp.value = inp.value.slice(0, a) + t + inp.value.slice(z);
    var p = a + t.length; inp.focus(); try { inp.setSelectionRange(p, p); } catch (_) {}
    out.classList.remove("err");
  }
  function evaluate() {
    var src = inp.value.trim();
    if (!src) return;
    try {
      var r = parse(src), text = fmt(r);
      ans = r; out.classList.remove("err"); out.textContent = "= " + text;
      hist.unshift({ e: src, r: text }); hist = hist.slice(0, 20); drawHist();
      inp.value = text;
    } catch (e) { out.classList.add("err"); out.textContent = e.message || "Could not calculate"; }
  }
  function drawHist() {
    var ul = document.getElementById("c-hist"); ul.innerHTML = "";
    if (!hist.length) { var li0 = document.createElement("li"); li0.className = "muted"; li0.textContent = "Your calculations appear here."; ul.appendChild(li0); return; }
    hist.forEach(function (h) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = h.e + " = " + h.r;
      b.addEventListener("click", function () { inp.value = h.r; inp.focus(); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  keys.addEventListener("click", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-k");
    if (!k) return;
    if (k === "=") evaluate();
    else if (k === "C") { inp.value = ""; out.textContent = "\u00a0"; out.classList.remove("err"); inp.focus(); }
    else if (k === "DEL") { inp.value = inp.value.slice(0, -1); inp.focus(); }
    else if (k === "EXP") insert("e");
    else if (k === "MC") { mem = 0; showMem(); }
    else if (k === "MR") insert(String(mem));
    else if (k === "M+") { try { mem += inp.value.trim() ? parse(inp.value) : ans; showMem(); } catch (err) { out.classList.add("err"); out.textContent = err.message; } }
    else insert(k);
  });
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); evaluate(); } });
  document.getElementById("c-mode").addEventListener("click", function () {
    deg = !deg; this.textContent = deg ? "DEG" : "RAD";
  });
  drawHist();
})();
