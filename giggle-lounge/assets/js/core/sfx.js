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
    get muted() { return muted; },
    setMuted(v) { muted = !!v; try { localStorage.setItem("gl.mute", muted ? "1" : "0"); } catch (e) {} },
  };
  PP.sfx = S;
})();
