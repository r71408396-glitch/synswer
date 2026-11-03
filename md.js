// Shared tiny safe markdown renderer (escapes first, then formats) and helpers for the AI pages.
window.SynMD = (function () {
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  function cells(line) { return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); }); }
  function render(text) {
    var lines = String(text).replace(/\r/g, "").split("\n"), out = [], i = 0;
    while (i < lines.length) {
      var l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (/^\s*```/.test(l)) {
        var code = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
        continue;
      }
      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var head = cells(l), html = '<div class="table-wrap"><table><thead><tr>' + head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          html += "<tr>" + cells(lines[i]).map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          i++;
        }
        out.push(html + "</tbody></table></div>");
      } else if (/^\s*[-*]\s+/.test(l)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; }
        out.push("<ul>" + items.join("") + "</ul>");
      } else if (/^\s*\d+[.)]\s+/.test(l)) {
        var nums = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { nums.push("<li>" + inline(lines[i].replace(/^\s*\d+[.)]\s+/, "")) + "</li>"); i++; }
        out.push("<ol>" + nums.join("") + "</ol>");
      } else if (/^#{1,4}\s+/.test(l)) {
        out.push("<h3>" + inline(l.replace(/^#{1,4}\s+/, "")) + "</h3>");
        i++;
      } else {
        var para = [];
        while (i < lines.length && lines[i].trim() && !/^\s*(\||```|[-*]\s|\d+[.)]\s|#{1,4}\s)/.test(lines[i])) { para.push(lines[i]); i++; }
        out.push("<p>" + inline(para.join(" ")) + "</p>");
      }
    }
    return out.join("");
  }
  // Response style shared by every AI page (saved on this device).
  var STYLES = {
    simple: "STYLE: Simple. Plain everyday words, short sentences, a quick everyday example, no jargon.",
    detailed: "STYLE: Detailed. Thorough and structured, with headings, steps, reasoning and examples.",
    professional: "STYLE: Professional. Precise, neutral and polished, suitable for work or formal use.",
    creative: "STYLE: Creative. Vivid, original and engaging, with fresh angles and lively wording."
  };
  function getStyle() { try { return localStorage.getItem("synswer-style") || "simple"; } catch (_) { return "simple"; } }
  function setStyle(s) { try { localStorage.setItem("synswer-style", s); } catch (_) {} }
  // Splits a trailing "FOLLOW-UPS:" block (3 lines starting with "- ") off the answer.
  function splitFollowUps(text) {
    var m = String(text).match(/\n?\s*(?:#+\s*)?\**FOLLOW-?UPS?:?\**\s*\n([\s\S]*)$/i);
    if (!m) return { body: String(text).trim(), followUps: [] };
    var ups = m[1].split("\n").map(function (l) { return l.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim(); }).filter(Boolean).slice(0, 3);
    return { body: String(text).slice(0, m.index).trim(), followUps: ups };
  }
  var FOLLOW_RULE = " After the answer, add a final line 'FOLLOW-UPS:' followed by exactly three short follow-up questions or next steps the person might want, one per line starting with '- '.";
  return { render: render, esc: esc, STYLES: STYLES, getStyle: getStyle, setStyle: setStyle, splitFollowUps: splitFollowUps, FOLLOW_RULE: FOLLOW_RULE };
})();
