/* Synswer media upload with an AI safety check.
   Images are checked directly. Videos are checked by sampling four frames in the browser.
   Anything that cannot be checked is refused (fail closed). */
(function () {
  var MAX_IMG = 5 * 1024 * 1024, MAX_VID = 50 * 1024 * 1024;
  var PROMPT = "You are a strict child-safety and content-safety moderator for a community that includes teenagers. " +
    "The images are an uploaded photo, or frames sampled from an uploaded video. Decide whether the content is SAFE to publish. " +
    "Mark it NOT safe if ANY image shows: nudity or exposed genitals, breasts or buttocks; sexual acts or sexually suggestive poses or clothing; " +
    "any person who appears to be under 18 in a sexual, suggestive, nude or undressed context; fetish content; graphic violence, gore, injury or death; " +
    "self-harm or suicide; weapons used to threaten people; terrorism or hate symbols; hard drug use. When unsure, choose NOT safe. " +
    "Ordinary clothed people, swimwear in normal beach or pool settings, art, food, animals, places and screenshots are safe.";

  function postJSON(url, body) {
    return fetch(url, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function putFile(blob, name, folder) {
    var fd = new FormData(); fd.append("folder", folder); fd.append("file", blob, name);
    return fetch("api/storage/upload", { method: "POST", credentials: "include", body: fd })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || "Upload failed."); return d; }); });
  }
  function toBlob(canvas, type, q) { return new Promise(function (res) { canvas.toBlob(res, type, q); }); }

  function shrinkImage(file) {
    if (file.type === "image/gif") return Promise.resolve(file);
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        toBlob(c, "image/jpeg", 0.85).then(function (b) { b ? res(b) : rej(new Error("That image could not be read.")); });
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error("That image could not be read.")); };
      im.src = url;
    });
  }

  function frames(file) {
    return new Promise(function (res, rej) {
      var v = document.createElement("video"), url = URL.createObjectURL(file), out = [], times, i = 0, done = false;
      v.muted = true; v.playsInline = true; v.preload = "auto";
      function fail(m) { if (done) return; done = true; URL.revokeObjectURL(url); rej(new Error(m || "This video could not be checked, so it was not uploaded. Try an MP4 or WebM file.")); }
      var timer = setTimeout(function () { fail(); }, 25000);
      v.onerror = function () { fail(); };
      v.onloadedmetadata = function () {
        var d = v.duration;
        if (!isFinite(d) || d <= 0) { fail(); return; }
        if (d > 180) { fail("Videos can be up to 3 minutes long."); return; }
        times = [0.05, 0.3, 0.55, 0.8].map(function (f) { return Math.min(d - 0.05, Math.max(0, d * f)); });
        v.currentTime = times[0];
      };
      v.onseeked = function () {
        try {
          var s = Math.min(1, 640 / (v.videoWidth || 640)), c = document.createElement("canvas");
          c.width = Math.max(2, Math.round((v.videoWidth || 640) * s)); c.height = Math.max(2, Math.round((v.videoHeight || 360) * s));
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          toBlob(c, "image/jpeg", 0.8).then(function (b) {
            if (!b) { fail(); return; }
            out.push(b); i++;
            if (i < times.length) v.currentTime = times[i];
            else { done = true; clearTimeout(timer); URL.revokeObjectURL(url); res(out); }
          });
        } catch (e) { fail(); }
      };
      v.src = url;
    });
  }

  function check(paths) {
    return postJSON("api/ai/complete", {
      prompt: PROMPT, input: "Check these " + paths.length + " image(s).", images: paths, format: "json", maxTokens: 200,
      schema: { type: "object", properties: { safe: { type: "boolean" }, reason: { type: "string" } }, required: ["safe", "reason"] }
    }).then(function (r) {
      if (!r.ok || !r.d.json) throw new Error("The safety check is unavailable right now, so the file was not uploaded. Please try again in a moment.");
      if (r.d.json.safe !== true) throw new Error("This file was blocked because it may break our community guidelines (nudity, sexual, underage or harmful content). Please choose a different one.");
    });
  }

  function upload(file, onStatus) {
    var say = onStatus || function () {};
    if (!file) return Promise.reject(new Error("No file chosen."));
    var isVid = /^video\//.test(file.type), isImg = /^image\/(png|jpeg|webp|gif)$/.test(file.type);
    if (!isVid && !isImg) return Promise.reject(new Error("Choose a JPEG, PNG, WebP or GIF image, or an MP4 or WebM video."));
    if (isVid) {
      if (file.size > MAX_VID) return Promise.reject(new Error("Videos can be up to 50 MB."));
      say("Preparing video check...");
      return frames(file).then(function (blobs) {
        say("Checking the video for safety...");
        return Promise.all(blobs.map(function (b, i) { return putFile(b, "f" + i + ".jpg", "private/frames"); }));
      }).then(function (ups) {
        return check(ups.map(function (u) { return u.path; }));
      }).then(function () {
        say("Uploading video...");
        return putFile(file, file.name || "video.mp4", "private/media");
      }).then(function (u) { return { url: u.url, path: u.path, type: "video" }; });
    }
    say("Checking the image for safety...");
    return shrinkImage(file).then(function (blob) {
      if (blob.size > MAX_IMG) throw new Error("Images can be up to 5 MB.");
      return putFile(blob, blob.type === "image/gif" ? "image.gif" : "image.jpg", "private/media");
    }).then(function (u) {
      return check([u.path]).then(function () { return { url: u.url, path: u.path, type: "image" }; });
    });
  }

  // Draws an image or video element for a stored url.
  function node(url, type, cls) {
    if (type === "video") { var v = document.createElement("video"); v.src = url; v.controls = true; v.preload = "metadata"; v.playsInline = true; v.className = cls || "cm-img"; return v; }
    var i = document.createElement("img"); i.src = url; i.alt = "Shared image"; i.loading = "lazy"; i.className = cls || "cm-img"; return i;
  }

  window.MediaSafe = { upload: upload, node: node, ACCEPT: "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" };
})();
