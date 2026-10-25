/* Tiny synthesised sound effects — no audio files. Mute is remembered. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem("gl.mute") === "1"; } catch (e) {}

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when, slideTo) {
    const a = ac();
    if (!a || muted) return;
    const t0 = a.currentTime + (when || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const S = {
    pop()   { tone(520, 0.09, "sine", 0.18, 0, 880); },
    tap()   { tone(330, 0.05, "triangle", 0.1); },
    ding()  { tone(880, 0.25, "sine", 0.16); tone(1318, 0.3, "sine", 0.1, 0.08); },
    whoosh(){ tone(200, 0.22, "sawtooth", 0.05, 0, 900); },
    buzz()  { tone(140, 0.28, "sawtooth", 0.12, 0, 90); },
    poke()  { tone(700, 0.06, "square", 0.07); tone(940, 0.08, "square", 0.07, 0.06); },
    clear() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, "triangle", 0.14, i * 0.06)); },
    tada()  { [523, 659, 784].forEach((f) => tone(f, 0.5, "triangle", 0.12)); tone(1046, 0.7, "triangle", 0.14, 0.18); },
    dice()  { for (let i = 0; i < 7; i++) tone(260 + Math.random() * 380, 0.045, "square", 0.06, i * 0.055); },
    lock()  { tone(150, 0.08, "square", 0.1, 0, 90); },
    sad()   { tone(330, 0.3, "sine", 0.12, 0, 180); },
    /* richer cues for the candy game */
    note(freq, dur, type, gain) { tone(freq, dur || 0.12, type || "triangle", gain || 0.14); },
    swap()  { tone(300, 0.07, "sine", 0.12, 0, 520); },
    bad()   { tone(220, 0.14, "square", 0.08, 0, 140); },
    combo(n) {                                             // each cascade climbs the scale
      const base = [523, 587, 659, 784, 880, 988, 1046, 1175][Math.min(7, Math.max(0, n - 1))];
      tone(base, 0.16, "triangle", 0.15); tone(base * 1.5, 0.2, "sine", 0.08, 0.05);
    },
    boom() {
      const a = ac(); if (!a || muted) return;
      const len = a.sampleRate * 0.35, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
      f.type = "lowpass"; f.frequency.setValueAtTime(1800, a.currentTime); f.frequency.exponentialRampToValueAtTime(120, a.currentTime + 0.3);
      g.gain.value = 0.35; src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination); src.start();
      tone(110, 0.3, "sine", 0.25, 0, 40);
    },
    zap()   { tone(1200, 0.2, "sawtooth", 0.07, 0, 200); tone(600, 0.25, "square", 0.05, 0.03, 1400); },
    star()  { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, "sine", 0.12, i * 0.09)); },
    get muted() { return muted; },
    setMuted(v) { muted = !!v; try { localStorage.setItem("gl.mute", muted ? "1" : "0"); } catch (e) {} },
  };
  PP.sfx = S;
})();
