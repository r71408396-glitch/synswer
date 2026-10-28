// Classic chiptune sounds for the games, synthesised with Web Audio (no audio files).
(function () {
  var ctx = null, master = null, muted = false, musicOn = false, timer = null, nextAt = 0, step = 0;
  var volume = 0.7;
  try { muted = localStorage.getItem("synswer-muted") === "1"; } catch (_) {}
  try { var sv = parseFloat(localStorage.getItem("synswer-volume")); if (!isNaN(sv)) volume = Math.max(0, Math.min(1, sv)); } catch (_) {}
  function gainFor(v) { return 0.257 * v; }

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = gainFor(volume);
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol || 0.5, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function noise(start, dur, vol) {
    var len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; g.gain.value = vol || 0.5;
    s.connect(g); g.connect(master); s.start(start);
  }

  var fx = {
    start: function (t) { tone(392, t, 0.1); tone(523, t + 0.1, 0.1); tone(784, t + 0.2, 0.18); },
    eat: function (t) { tone(660, t, 0.07); tone(990, t + 0.06, 0.1); },
    move: function (t) { tone(220, t, 0.03, "square", 0.25); },
    rotate: function (t) { tone(440, t, 0.05, "square", 0.35); tone(587, t + 0.04, 0.05, "square", 0.35); },
    lock: function (t) { tone(130, t, 0.08, "triangle", 0.7); },
    drop: function (t) { tone(300, t, 0.12, "square", 0.4, 70); },
    clear: function (t) { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.07, 0.12); }); },
    shoot: function (t) { tone(900, t, 0.09, "square", 0.25, 250); },
    boom: function (t) { noise(t, 0.22, 0.6); tone(160, t, 0.2, "sawtooth", 0.3, 40); },
    hurt: function (t) { noise(t, 0.35, 0.8); tone(200, t, 0.35, "sawtooth", 0.5, 50); },
    pause: function (t) { tone(330, t, 0.06); tone(247, t + 0.07, 0.08); },
    saved: function (t) { tone(784, t, 0.09); tone(1047, t + 0.09, 0.16); },
    gameover: function (t) { [392, 349, 311, 262].forEach(function (f, i) { tone(f, t + i * 0.2, 0.25, "triangle", 0.7); }); }
  };

  // Folk tune "Korobeiniki" (traditional, public domain) as [midi-ish freq, beats]
  var E5 = 659, B4 = 494, C5 = 523, D5 = 587, A4 = 440, F5 = 698, A5 = 880, G5 = 784;
  var tune = [[E5,1],[B4,.5],[C5,.5],[D5,1],[C5,.5],[B4,.5],[A4,1],[A4,.5],[C5,.5],[E5,1],[D5,.5],[C5,.5],[B4,1.5],[C5,.5],[D5,1],[E5,1],[C5,1],[A4,1],[A4,2],
              [0,.5],[D5,1.5],[F5,.5],[A5,1],[G5,.5],[F5,.5],[E5,1.5],[C5,.5],[E5,1],[D5,.5],[C5,.5],[B4,1],[B4,.5],[C5,.5],[D5,1],[E5,1],[C5,1],[A4,1],[A4,2]];
  var beat = 0.19;

  function schedule() {
    if (!musicOn || !ctx) return;
    while (nextAt < ctx.currentTime + 0.4) {
      var n = tune[step % tune.length];
      if (n[0]) tone(n[0], nextAt, n[1] * beat * 0.9, "square", 0.22);
      nextAt += n[1] * beat;
      step++;
    }
  }

  window.Sound = {
    get muted() { return muted; },
    get volume() { return volume; },
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      try { localStorage.setItem("synswer-volume", String(volume)); } catch (_) {}
      if (master) master.gain.value = gainFor(volume);
    },
    play: function (name) {
      if (muted || !fx[name] || !ensure()) return;
      fx[name](ctx.currentTime + 0.005);
    },
    music: function (on) {
      musicOn = !!on && !muted;
      clearInterval(timer);
      if (musicOn && ensure()) {
        nextAt = ctx.currentTime + 0.05;
        schedule();
        timer = setInterval(schedule, 100);
      }
    },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem("synswer-muted", muted ? "1" : "0"); } catch (_) {}
      if (muted) { musicOn = false; clearInterval(timer); }
      return muted;
    },
    unlock: ensure
  };
})();
