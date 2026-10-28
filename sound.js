// Chiptune sounds and public-domain instrumental music for the games, synthesised with Web Audio (no audio files).
(function () {
  var ctx = null, master = null, muted = false, musicOn = false, timer = null, nextAt = 0, step = 0, track = null;
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
    gameover: function (t) { [392, 349, 311, 262].forEach(function (f, i) { tone(f, t + i * 0.2, 0.25, "triangle", 0.7); }); },
    tap: function (t) { tone(520, t, 0.05, "square", 0.3); },
    good: function (t) { tone(700, t, 0.06, "square", 0.35); tone(1050, t + 0.06, 0.09, "square", 0.35); },
    bad: function (t) { tone(180, t, 0.18, "sawtooth", 0.45, 90); },
    flip: function (t) { tone(300, t, 0.1, "triangle", 0.5, 600); },
    swoosh: function (t) { noise(t, 0.12, 0.25); },
    tick: function (t) { tone(1200, t, 0.03, "square", 0.2); },
    win: function (t) { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.08, 0.14); }); },
    bounce: function (t) { tone(260, t, 0.08, "triangle", 0.5, 420); }
  };

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freqOf(n) {
    var m = /^([A-G])(#?)(\d)$/.exec(n);
    if (!m) return 0;
    var semis = NOTE[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) - 4) * 12 - 9;
    return 440 * Math.pow(2, semis / 12);
  }
  function parse(s) {
    return s.trim().split(/\s+/).map(function (tok) {
      var p = tok.split(":");
      return [p[0] === "R" ? 0 : freqOf(p[0]), parseFloat(p[1] || "1")];
    });
  }

  // Traditional and classical tunes, all public domain.
  var TRACKS = {
    korobeiniki: { beat: 0.19, wave: "square", vol: 0.2,
      n: "E5:1 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2 R:.5 D5:1.5 F5:.5 A5:1 G5:.5 F5:.5 E5:1.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1 B4:.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2" },
    ode: { beat: 0.26, wave: "triangle", vol: 0.5,
      n: "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2" },
    elise: { beat: 0.17, wave: "triangle", vol: 0.5,
      n: "E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:2 R:1 C4:1 E4:1 A4:1 B4:2 R:1 E4:1 G#4:1 B4:1 C5:2 R:1 E4:1 E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:2 R:1 C4:1 E4:1 A4:1 B4:2 R:1 E4:1 C5:1 B4:1 A4:3 R:1" },
    green: { beat: 0.3, wave: "triangle", vol: 0.5,
      n: "A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:2 A3:1 A3:1.5 G#3:.5 A3:1 B3:2 G#3:1 E3:3 A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:1.5 B3:.5 A3:1 G#3:1.5 F#3:.5 G#3:1 A3:3" },
    king: { beat: 0.15, wave: "square", vol: 0.18,
      n: "B2:1 C#3:1 D3:1 E3:1 F#3:1 D3:1 F#3:2 F3:1 C#3:1 F3:2 E3:1 C3:1 E3:2 B2:1 C#3:1 D3:1 E3:1 F#3:1 D3:1 F#3:1 B3:1 A3:1 F#3:1 D3:1 F#3:1 A3:3" },
    susanna: { beat: 0.2, wave: "square", vol: 0.2,
      n: "C4:.5 D4:.5 E4:1 G4:1 G4:1.5 A4:.5 G4:1 E4:1 C4:1.5 D4:.5 E4:1 E4:1 D4:1 C4:1 D4:3 C4:.5 D4:.5 E4:1 G4:1 G4:1.5 A4:.5 G4:1 E4:1 C4:1.5 D4:.5 E4:1 E4:1 D4:1 D4:1 C4:3" },
    twinkle: { beat: 0.3, wave: "triangle", vol: 0.5,
      n: "C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2" }
  };
  Object.keys(TRACKS).forEach(function (k) { TRACKS[k].notes = parse(TRACKS[k].n); });

  var BY_GAME = {
    snake: "susanna", tetris: "korobeiniki", shooter: "king", gridlock: "green", colorlink: "ode", merge: "twinkle",
    perfecttap: "elise", tilestep: "king", deflect: "korobeiniki", gravity: "korobeiniki", orbit: "green",
    helix: "susanna", simon: "ode", pairmatch: "twinkle", pathtrace: "elise", brick: "king", glitch: "korobeiniki", slice: "susanna"
  };

  function schedule() {
    if (!musicOn || !ctx || !track) return;
    while (nextAt < ctx.currentTime + 0.4) {
      var n = track.notes[step % track.notes.length];
      if (n[0]) tone(n[0], nextAt, n[1] * track.beat * 0.92, track.wave, track.vol);
      nextAt += n[1] * track.beat;
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
    note: function (freq, dur) {
      if (muted || !ensure()) return;
      tone(freq, ctx.currentTime + 0.005, dur || 0.3, "triangle", 0.8);
    },
    music: function (on) {
      musicOn = !!on && !muted;
      clearInterval(timer);
      if (musicOn && ensure()) {
        var g = document.body.getAttribute("data-game");
        track = TRACKS[BY_GAME[g] || "ode"];
        if (!track._started) { step = 0; }
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
