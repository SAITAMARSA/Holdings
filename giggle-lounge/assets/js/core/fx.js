/* Juice: particles, shockwaves, beams, floating text and screen shake on an overlay canvas.
 * One Particles object per playfield; it only runs its animation loop while something is alive. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;

  class Particles {
    constructor(host) {
      this.cv = document.createElement("canvas");
      this.cv.className = "fx-canvas";
      host.appendChild(this.cv);
      this.g = this.cv.getContext("2d");
      this.ps = []; this.rings = []; this.texts = []; this.beams = []; this.glows = [];
      this.running = false; this.last = 0; this.dpr = window.devicePixelRatio || 1; this.w = 0; this.h = 0;
    }
    resize(w, h) {
      this.w = w; this.h = h; this.dpr = window.devicePixelRatio || 1;
      this.cv.style.width = w + "px"; this.cv.style.height = h + "px";
      this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
    }

    /* a spray of sparkles. opts: n, colors[], speed, life(ms), size, gravity, shapes[], spread(rad), angle(rad) */
    burst(x, y, o) {
      if (reduce()) return;
      o = o || {};
      const n = o.n || 14, colors = o.colors || ["#fff"], shapes = o.shapes || ["circle", "star", "spark"];
      for (let i = 0; i < n; i++) {
        const a = (o.angle != null ? o.angle : 0) + (o.spread != null ? (Math.random() - 0.5) * o.spread : Math.random() * TAU);
        const sp = (o.speed || 240) * (0.35 + Math.random() * 0.75);
        this.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), life: 0, max: (o.life || 700) * (0.6 + Math.random() * 0.7),
          size: (o.size || 6) * (0.6 + Math.random() * 0.8), c: colors[(Math.random() * colors.length) | 0], shape: shapes[(Math.random() * shapes.length) | 0],
          g: o.gravity != null ? o.gravity : 520, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, drag: o.drag != null ? o.drag : 0.985 });
      }
      this._go();
    }
    ring(x, y, o) {
      if (reduce()) return; o = o || {};
      this.rings.push({ x, y, r0: o.r0 || 4, r1: o.r1 || 70, life: 0, max: o.life || 450, c: o.color || "#fff", w: o.width || 6 });
      this._go();
    }
    /* a bright beam (striped candy clearing a row/column) */
    beam(x1, y1, x2, y2, o) {
      if (reduce()) return; o = o || {};
      this.beams.push({ x1, y1, x2, y2, life: 0, max: o.life || 420, c: o.color || "#fff", w: o.width || 16 });
      this._go();
    }
    glow(x, y, o) {
      if (reduce()) return; o = o || {};
      this.glows.push({ x, y, r: o.r || 60, life: 0, max: o.life || 350, c: o.color || "#fff" });
      this._go();
    }
    text(x, y, str, o) {
      o = o || {};
      this.texts.push({ x, y, str, life: 0, max: o.life || 900, c: o.color || "#fff", size: o.size || 20, stroke: o.stroke || "#4A1F6B", rise: o.rise != null ? o.rise : 46 });
      this._go();
    }
    clear() { this.ps.length = this.rings.length = this.texts.length = this.beams.length = this.glows.length = 0; this.g.clearRect(0, 0, this.cv.width, this.cv.height); }

    _go() { if (this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this._tick(t)); }
    _tick(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      const g = this.g; g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.clearRect(0, 0, this.w, this.h);
      g.globalCompositeOperation = "lighter";
      this.glows = this.glows.filter((o) => { o.life += dt * 1000; const t = o.life / o.max; if (t >= 1) return false;
        const gr = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * (0.6 + t)); gr.addColorStop(0, o.c); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.globalAlpha = (1 - t) * 0.8; g.fillStyle = gr; g.beginPath(); g.arc(o.x, o.y, o.r * (0.6 + t), 0, TAU); g.fill(); return true; });
      this.beams = this.beams.filter((o) => { o.life += dt * 1000; const t = o.life / o.max; if (t >= 1) return false;
        g.globalAlpha = (1 - t); g.strokeStyle = o.c; g.lineCap = "round"; g.lineWidth = o.w * (1 - t * 0.7);
        g.shadowColor = o.c; g.shadowBlur = 18; g.beginPath(); g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); g.shadowBlur = 0;
        g.lineWidth = o.w * 0.35 * (1 - t); g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); return true; });
      g.globalCompositeOperation = "source-over";
      this.rings = this.rings.filter((o) => { o.life += dt * 1000; const t = o.life / o.max; if (t >= 1) return false;
        const e = 1 - Math.pow(1 - t, 3); g.globalAlpha = (1 - t) * 0.9; g.strokeStyle = o.c; g.lineWidth = o.w * (1 - t * 0.6);
        g.beginPath(); g.arc(o.x, o.y, o.r0 + (o.r1 - o.r0) * e, 0, TAU); g.stroke(); return true; });
      this.ps = this.ps.filter((p) => {
        p.life += dt * 1000; if (p.life >= p.max) return false;
        p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const t = p.life / p.max; g.globalAlpha = t < 0.7 ? 1 : (1 - t) / 0.3; g.fillStyle = p.c; g.strokeStyle = p.c;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); const s = p.size * (1 - t * 0.35);
        if (p.shape === "circle") { g.beginPath(); g.arc(0, 0, s * 0.6, 0, TAU); g.fill(); }
        else if (p.shape === "star") { g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.35 : s; const a = (i / 8) * TAU; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
        else if (p.shape === "spark") { g.lineWidth = Math.max(1.5, s * 0.28); g.lineCap = "round"; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); }
        else { g.fillRect(-s * 0.5, -s * 0.3, s, s * 0.6); }
        g.restore(); return true; });
      this.texts = this.texts.filter((o) => {
        o.life += dt * 1000; const t = o.life / o.max; if (t >= 1) return false;
        const pop = t < 0.18 ? 0.5 + (t / 0.18) * 0.7 : t < 0.3 ? 1.2 - ((t - 0.18) / 0.12) * 0.2 : 1;
        g.save(); g.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1; g.translate(o.x, o.y - o.rise * t); g.scale(pop, pop);
        g.font = "700 " + o.size + 'px "Fredoka","Lilita One",system-ui,sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = Math.max(3, o.size * 0.22); g.lineJoin = "round"; g.strokeStyle = o.stroke; g.strokeText(o.str, 0, 0); g.fillStyle = o.c; g.fillText(o.str, 0, 0); g.restore(); return true; });
      g.globalAlpha = 1;
      if (this.ps.length || this.rings.length || this.texts.length || this.beams.length || this.glows.length) requestAnimationFrame((t) => this._tick(t));
      else { this.running = false; g.clearRect(0, 0, this.w, this.h); }
    }
  }

  /* shake any element: strength in px, ms duration */
  function shake(node, px, ms) {
    if (!node || reduce()) return;
    px = px || 6; ms = ms || 380;
    const t0 = performance.now();
    (function step(now) {
      const t = (now - t0) / ms;
      if (t >= 1) { node.style.transform = ""; return; }
      const k = (1 - t) * (1 - t);
      node.style.transform = "translate(" + ((Math.random() - 0.5) * 2 * px * k).toFixed(1) + "px," + ((Math.random() - 0.5) * 2 * px * k).toFixed(1) + "px)";
      requestAnimationFrame(step);
    })(t0);
  }
  /* one-shot CSS class animation (re-triggerable) */
  function pulse(node, cls, ms) { if (!node) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); setTimeout(() => node.classList.remove(cls), ms || 600); }

  PP.fx = { Particles, shake, pulse };
})();
