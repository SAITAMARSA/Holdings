/* Candy March renderer — paints glossy gel candies on a canvas and plays the engine's steps as juicy animations. */
(function () {
  "use strict";
  const PP = window.PP, { SP } = PP.Candy, TAU = Math.PI * 2;

  /* flavour palette: hi / mid / lo */
  const PAL = [
    { hi: "#FFC2CF", mid: "#FF4D6D", lo: "#B80F3B", name: "Cherry" },
    { hi: "#FFE0A8", mid: "#FF9F1C", lo: "#D9560B", name: "Orange" },
    { hi: "#FFF7B0", mid: "#FFD60A", lo: "#E39A00", name: "Lemon" },
    { hi: "#C6FFD4", mid: "#35D86A", lo: "#0E9A47", name: "Lime" },
    { hi: "#C4F0FF", mid: "#3EA8FF", lo: "#1458D6", name: "Berry" },
    { hi: "#EAD2FF", mid: "#A66CFF", lo: "#5E24C4", name: "Grape" },
    { hi: "#C4FFF8", mid: "#19D3C5", lo: "#067F8C", name: "Gem" },
  ];
  PP.Candy.PAL = PAL;
  const ease = { out: (u) => 1 - Math.pow(1 - u, 3), inout: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2), back: (u) => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
    bounce: (u) => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375; return n * (u -= 2.625 / d) * u + 0.984375; } };

  /* ---------- candy shapes (all drawn around cx,cy with radius r) ---------- */
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const SHAPES = [
    (g, cx, cy, r) => { const s = r * 1.04; g.beginPath(); g.moveTo(cx, cy + s * 0.95); g.bezierCurveTo(cx + s * 1.35, cy + s * 0.2, cx + s * 1.0, cy - s * 1.0, cx, cy - s * 0.38); g.bezierCurveTo(cx - s * 1.0, cy - s * 1.0, cx - s * 1.35, cy + s * 0.2, cx, cy + s * 0.95); g.closePath(); },
    (g, cx, cy, r) => { g.save(); g.translate(cx, cy); g.rotate(-0.55); rr(g, -r * 1.08, -r * 0.7, r * 2.16, r * 1.4, r * 0.7); g.restore(); },
    (g, cx, cy, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.58 : r * 1.12; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad + r * 0.04); } g.closePath(); },
    (g, cx, cy, r) => rr(g, cx - r * 0.9, cy - r * 0.9, r * 1.8, r * 1.8, r * 0.46),
    (g, cx, cy, r) => { g.beginPath(); g.moveTo(cx, cy - r * 1.12); g.bezierCurveTo(cx + r * 0.15, cy - r * 0.7, cx + r * 1.0, cy - r * 0.1, cx + r * 1.0, cy + r * 0.34); g.bezierCurveTo(cx + r * 1.0, cy + r * 0.86, cx + r * 0.52, cy + r * 1.06, cx, cy + r * 1.06); g.bezierCurveTo(cx - r * 0.52, cy + r * 1.06, cx - r * 1.0, cy + r * 0.86, cx - r * 1.0, cy + r * 0.34); g.bezierCurveTo(cx - r * 1.0, cy - r * 0.1, cx - r * 0.15, cy - r * 0.7, cx, cy - r * 1.12); g.closePath(); },
    (g, cx, cy, r) => { g.beginPath(); g.arc(cx, cy, r * 1.0, 0, TAU); g.closePath(); },
    (g, cx, cy, r) => { g.beginPath(); [[0, -1.12], [0.86, -0.5], [0.86, 0.5], [0, 1.12], [-0.86, 0.5], [-0.86, -0.5]].forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](cx + x * r, cy + y * r)); g.closePath(); },
  ];
  const ROUNDED = new Set([2, 6]);        // star + gem: round the corners with a thick join

  function makeArt(t, s, px, dpr) {
    const M = px * 0.16, size = px + M * 2, cv = document.createElement("canvas");
    cv.width = cv.height = Math.round(size * dpr);
    const g = cv.getContext("2d"); g.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = px * 0.41;
    g.lineJoin = "round"; g.lineCap = "round";
    // soft contact shadow
    g.fillStyle = "rgba(30,5,60,.28)"; g.beginPath(); g.ellipse(cx, cy + r * 0.98, r * 0.78, r * 0.2, 0, 0, TAU); g.fill();

    if (s === SP.BOMB) return bombArt(g, cv, cx, cy, r, size);
    const P = PAL[t % PAL.length], shape = SHAPES[t % SHAPES.length];
    const body = () => shape(g, cx, cy, r);
    // body
    g.save(); body();
    const gr = g.createRadialGradient(cx - r * 0.38, cy - r * 0.45, r * 0.08, cx + r * 0.1, cy + r * 0.1, r * 1.35);
    gr.addColorStop(0, P.hi); gr.addColorStop(0.42, P.mid); gr.addColorStop(1, P.lo);
    g.fillStyle = gr; g.fill();
    if (ROUNDED.has(t)) { g.lineWidth = r * 0.22; g.strokeStyle = P.mid; g.stroke(); body(); g.fillStyle = gr; g.fill(); }
    g.lineWidth = Math.max(2, r * 0.1); g.strokeStyle = "rgba(60,8,90,.5)"; g.stroke();
    g.clip();
    // inner details per flavour
    if (t === 5) {                                                  // peppermint swirl
      g.strokeStyle = "rgba(255,255,255,.62)"; g.lineWidth = r * 0.2; g.beginPath();
      for (let i = 0; i <= 80; i++) { const u = i / 80, a = u * TAU * 2.2, rad = r * 1.05 * u; g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.stroke();
    } else if (t === 3) {                                           // sugar-crackle gummy
      g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(cx - r * 0.6, cy - r * 0.1); g.lineTo(cx - r * 0.1, cy + r * 0.2); g.lineTo(cx + r * 0.25, cy - r * 0.2); g.lineTo(cx + r * 0.7, cy + r * 0.15); g.stroke();
      g.beginPath(); g.moveTo(cx - r * 0.2, cy + r * 0.2); g.lineTo(cx - r * 0.35, cy + r * 0.7); g.stroke();
    } else if (t === 6) {                                           // gem facets
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(cx - r * 0.86, cy - r * 0.5); g.lineTo(cx, cy + r * 0.05); g.lineTo(cx + r * 0.86, cy - r * 0.5); g.moveTo(cx, cy + r * 0.05); g.lineTo(cx, cy + r * 1.1); g.stroke();
    }
    // specials: stripes / wrapper
    if (s === SP.ROW || s === SP.COL) {
      g.fillStyle = "rgba(255,255,255,.72)";
      for (let i = -2; i <= 2; i++) { const o = i * r * 0.48; if (s === SP.ROW) g.fillRect(cx - r * 1.3, cy + o - r * 0.1, r * 2.6, r * 0.2); else g.fillRect(cx + o - r * 0.1, cy - r * 1.3, r * 0.2, r * 2.6); }
    }
    // gloss
    const hl = g.createLinearGradient(cx - r * 0.6, cy - r * 0.9, cx + r * 0.1, cy - r * 0.1);
    hl.addColorStop(0, "rgba(255,255,255,.95)"); hl.addColorStop(1, "rgba(255,255,255,.12)");
    g.fillStyle = hl; g.beginPath(); g.ellipse(cx - r * 0.34, cy - r * 0.5, r * 0.4, r * 0.2, -0.62, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(cx + r * 0.46, cy - r * 0.22, r * 0.07, 0, TAU); g.fill();
    const rim = g.createLinearGradient(0, cy + r * 0.5, 0, cy + r * 1.1); rim.addColorStop(0, "rgba(255,255,255,0)"); rim.addColorStop(1, "rgba(255,255,255,.34)");
    g.fillStyle = rim; g.fillRect(cx - r * 1.3, cy + r * 0.5, r * 2.6, r * 0.7);
    g.restore();
    if (s === SP.WRAP) {                                            // candy wrapper: twisted ends + a band
      g.save();
      g.fillStyle = P.mid; g.strokeStyle = "rgba(60,8,90,.55)"; g.lineWidth = Math.max(2, r * 0.09);
      [-1, 1].forEach((sd) => {
        const tg = g.createLinearGradient(cx + sd * r * 0.8, cy, cx + sd * r * 1.6, cy); tg.addColorStop(0, P.mid); tg.addColorStop(1, P.hi);
        g.fillStyle = tg; g.beginPath(); g.moveTo(cx + sd * r * 0.8, cy - r * 0.14); g.lineTo(cx + sd * r * 1.62, cy - r * 0.78); g.quadraticCurveTo(cx + sd * r * 1.34, cy, cx + sd * r * 1.62, cy + r * 0.78); g.lineTo(cx + sd * r * 0.8, cy + r * 0.14); g.closePath(); g.fill(); g.stroke();
      });
      g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = r * 0.2; g.beginPath(); g.ellipse(cx, cy, r * 0.95, r * 0.95, 0, 0, TAU); g.setLineDash([r * 0.34, r * 0.2]); g.stroke(); g.setLineDash([]);
      g.restore();
    }
    return cv;
  }

  function bombArt(g, cv, cx, cy, r, size) {
    const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15);
    gr.addColorStop(0, "#9A5B3A"); gr.addColorStop(0.55, "#5A2D1A"); gr.addColorStop(1, "#24100A");
    g.save(); g.beginPath(); g.arc(cx, cy, r * 1.04, 0, TAU); g.fillStyle = gr; g.fill(); g.lineWidth = r * 0.1; g.strokeStyle = "rgba(40,5,60,.6)"; g.stroke(); g.clip();
    const col = ["#FF4D6D", "#FFD60A", "#35D86A", "#3EA8FF", "#A66CFF", "#FF9F1C", "#fff"];
    const rnd = (n) => { const x = Math.sin(n * 91.7) * 4375.85; return x - Math.floor(x); };
    for (let i = 0; i < 26; i++) { const a = rnd(i) * TAU, d = Math.sqrt(rnd(i + 50)) * r * 0.95, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      g.strokeStyle = col[i % col.length]; g.lineWidth = r * 0.13; g.lineCap = "round"; g.beginPath(); const l = r * 0.17, ang = rnd(i + 9) * TAU; g.moveTo(x - Math.cos(ang) * l, y - Math.sin(ang) * l); g.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); g.stroke(); }
    const hl = g.createLinearGradient(cx - r * 0.6, cy - r * 0.9, cx, cy - r * 0.1); hl.addColorStop(0, "rgba(255,255,255,.85)"); hl.addColorStop(1, "rgba(255,255,255,.05)");
    g.fillStyle = hl; g.beginPath(); g.ellipse(cx - r * 0.36, cy - r * 0.52, r * 0.42, r * 0.2, -0.62, 0, TAU); g.fill();
    g.restore();
    return cv;
  }

  /* ---------- the view ---------- */
  class CandyView {
    constructor(host) {
      this.host = host; this.cv = document.createElement("canvas"); this.cv.className = "cm-canvas"; host.appendChild(this.cv);
      this.g = this.cv.getContext("2d"); this.fx = new PP.fx.Particles(host);
      this.sprites = new Map(); this.cache = {}; this.cell = 40; this.w = 8; this.h = 8; this.dpr = window.devicePixelRatio || 1;
      this.sel = null; this.hintPair = null; this.halves = null; this.queue = Promise.resolve(); this.pending = 0; this.flash = 0; this.raf = 0; this.dead = false;
      this.onStar = null; this.speedBoost = 1;
      this._loop = this._loop.bind(this); this.raf = requestAnimationFrame(this._loop);
      this._bind();
    }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); }
    resize(cell, w, h) {
      this.cell = cell; this.w = w; this.h = h; this.dpr = window.devicePixelRatio || 1; this.cache = {};
      const W = cell * w, H = cell * h;
      this.cv.style.width = W + "px"; this.cv.style.height = H + "px"; this.cv.width = Math.round(W * this.dpr); this.cv.height = Math.round(H * this.dpr);
      this.fx.resize(W, H); this._bg();
    }
    art(t, s) { const k = t + ":" + s; return this.cache[k] || (this.cache[k] = makeArt(t, s, this.cell, this.dpr)); }
    _bg() {
      const { cell, w, h, dpr } = this, W = cell * w, H = cell * h, cv = document.createElement("canvas");
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); const g = cv.getContext("2d"); g.scale(dpr, dpr);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
        const x = c * cell + 2, y = r * cell + 2, s = cell - 4;
        const grd = g.createLinearGradient(0, y, 0, y + s); const a = (r + c) % 2;
        grd.addColorStop(0, a ? "rgba(255,255,255,.17)" : "rgba(255,255,255,.1)"); grd.addColorStop(1, a ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.03)");
        rr(g, x, y, s, s, cell * 0.2); g.fillStyle = grd; g.fill(); g.lineWidth = 1.5; g.strokeStyle = "rgba(255,255,255,.1)"; g.stroke();
      }
      this.bg = cv;
    }

    /* ---------- sprites ---------- */
    sync(board) {
      this.sprites.clear();
      board.grid.forEach((row, r) => row.forEach((x, c) => { if (x) this._add(x, r, c); }));
    }
    _add(cell, r, c, extra) { const s = Object.assign({ id: cell.id, t: cell.t, s: cell.s, x: c, y: r, sc: 1, al: 1, rot: 0, z: 0 }, extra || {}); this.sprites.set(cell.id, s); return s; }
    at(r, c) { for (const s of this.sprites.values()) if (Math.round(s.x) === c && Math.round(s.y) === r && s.al > 0.5) return s; return null; }
    get idle() { return this.pending === 0; }

    /* ---------- drawing ---------- */
    _loop(now) {
      if (this.dead) return;
      const g = this.g, { cell, dpr } = this, t = now / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cell * this.w, cell * this.h);
      if (this.bg) g.drawImage(this.bg, 0, 0, cell * this.w, cell * this.h);
      if (this.halves) this.halves.forEach((h) => { g.fillStyle = h.color; g.globalAlpha = h.mine ? 0.2 : 0.08; rr(g, h.x0 * cell + 1, 1, (h.x1 - h.x0 + 1) * cell - 2, cell * this.h - 2, cell * 0.2); g.fill(); g.globalAlpha = 1; });
      if (this.halves && this.halves.length > 1) { const mx = (this.halves[0].x1 + 1) * cell; g.save(); g.setLineDash([8, 8]); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 3; g.shadowColor = "#fff"; g.shadowBlur = 10; g.beginPath(); g.moveTo(mx, 6); g.lineTo(mx, cell * this.h - 6); g.stroke(); g.restore(); }
      const list = Array.from(this.sprites.values()).sort((a, b) => a.z - b.z || a.y - b.y);
      const hintIds = this.hintPair ? this.hintPair.map(([r, c]) => { const s = this.at(r, c); return s && s.id; }) : [];
      for (const s of list) {
        if (s.al <= 0.01) continue;
        const cx = (s.x + 0.5) * cell, cy = (s.y + 0.5) * cell;
        let sc = s.sc;
        if (s.s === SP.BOMB) sc *= 1 + 0.05 * Math.sin(t * 5);
        if (this.sel && this.sel[0] === Math.round(s.y) && this.sel[1] === Math.round(s.x)) sc *= 1.1 + 0.05 * Math.sin(t * 9);
        if (hintIds.includes(s.id)) sc *= 1 + 0.12 * Math.abs(Math.sin(t * 5));
        if (s.s) {                                                   // special aura
          const col = s.s === SP.BOMB ? "rgba(255,255,255,.55)" : s.s === SP.WRAP ? "rgba(255,230,120,.6)" : "rgba(255,255,255,.5)";
          const gl = g.createRadialGradient(cx, cy, cell * 0.1, cx, cy, cell * 0.62); gl.addColorStop(0, col); gl.addColorStop(1, "rgba(255,255,255,0)");
          g.globalAlpha = s.al * (0.55 + 0.35 * Math.sin(t * 4 + s.id)); g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, cell * 0.62, 0, TAU); g.fill();
        }
        g.save(); g.translate(cx, cy); g.rotate(s.rot); g.scale(sc, sc); g.globalAlpha = s.al;
        const A = this.art(s.t, s.s), m = cell * 0.16, size = cell + m * 2;
        g.drawImage(A, -size / 2, -size / 2, size, size);
        if (s.white) { g.globalCompositeOperation = "lighter"; g.globalAlpha = s.white * s.al; g.drawImage(A, -size / 2, -size / 2, size, size); }
        g.restore();
      }
      g.globalAlpha = 1;
      if (this.sel) { const [r, c] = this.sel, p = 0.5 + 0.5 * Math.sin(t * 8); g.strokeStyle = "rgba(255,255,255," + (0.7 + 0.3 * p) + ")"; g.lineWidth = 3.5; g.shadowColor = "#fff"; g.shadowBlur = 12; rr(g, c * cell + 3, r * cell + 3, cell - 6, cell - 6, cell * 0.22); g.stroke(); g.shadowBlur = 0; }
      if (this.flash > 0.01) { g.fillStyle = "rgba(255,255,255," + this.flash * 0.5 + ")"; g.fillRect(0, 0, cell * this.w, cell * this.h); this.flash *= 0.86; }
      this.raf = requestAnimationFrame(this._loop);
    }

    /* ---------- input: tap or swipe ---------- */
    _bind() {
      let start = null, done = false;
      const cellAt = (e) => { const r = this.cv.getBoundingClientRect(), c = Math.floor(((e.clientX - r.left) / r.width) * this.w), rw = Math.floor(((e.clientY - r.top) / r.height) * this.h); return c >= 0 && c < this.w && rw >= 0 && rw < this.h ? [rw, c] : null; };
      this.cv.addEventListener("pointerdown", (e) => { e.preventDefault(); const p = cellAt(e); if (!p) return; start = { p, x: e.clientX, y: e.clientY }; done = false; try { this.cv.setPointerCapture(e.pointerId); } catch (x) {} });
      this.cv.addEventListener("pointermove", (e) => {
        if (!start || done) return; const dx = e.clientX - start.x, dy = e.clientY - start.y, th = this.cell * 0.4;
        if (Math.abs(dx) < th && Math.abs(dy) < th) return;
        done = true; const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U";
        this.onSwipe && this.onSwipe(start.p, dir);
      });
      const up = () => { if (start && !done) this.onTap && this.onTap(start.p); start = null; };
      this.cv.addEventListener("pointerup", up); this.cv.addEventListener("pointercancel", () => (start = null));
    }

    /* ---------- animation ---------- */
    tween(ms, fn, easing) {
      ms = ms / this.speedBoost;
      return new Promise((res) => { const t0 = performance.now(); const step = (now) => { if (this.dead) return res(); const u = Math.min(1, (now - t0) / ms); fn(easing ? easing(u) : u); u < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
    }
    sleep(ms) { return new Promise((r) => setTimeout(r, ms / this.speedBoost)); }
    playSteps(steps, opts) {
      this.pending++;
      this.queue = this.queue.then(async () => { this.speedBoost = this.pending > 3 ? 2.2 : this.pending > 2 ? 1.5 : 1; try { for (const st of steps) { await this["_" + st.k](st); } } catch (e) { console.error(e); } if (opts && opts.after) opts.after(); }).then(() => { this.pending--; });
      return this.queue;
    }
    afterIdle(fn) { this.queue = this.queue.then(() => fn()); }
    px(r, c) { return [(c + 0.5) * this.cell, (r + 0.5) * this.cell]; }

    async _swap(st) {
      const A = this.at(st.a[0], st.a[1]), B = this.at(st.b[0], st.b[1]);
      if (!A || !B) return;
      PP.sfx.swap();
      const ax = A.x, ay = A.y, bx = B.x, by = B.y;
      A.z = B.z = 2;
      if (st.bounce) {
        await this.tween(110, (u) => { A.x = ax + (bx - ax) * u * 0.55; A.y = ay + (by - ay) * u * 0.55; B.x = bx + (ax - bx) * u * 0.55; B.y = by + (ay - by) * u * 0.55; }, ease.out);
        PP.sfx.bad();
        await this.tween(140, (u) => { A.x = ax + (bx - ax) * (0.55 - u * 0.55); A.y = ay + (by - ay) * (0.55 - u * 0.55); B.x = bx + (ax - bx) * (0.55 - u * 0.55); B.y = by + (ay - by) * (0.55 - u * 0.55); }, ease.out);
      } else {
        await this.tween(150, (u) => { A.x = ax + (bx - ax) * u; A.y = ay + (by - ay) * u; B.x = bx + (ax - bx) * u; B.y = by + (ay - by) * u; }, ease.inout);
      }
      A.x = st.bounce ? ax : bx; A.y = st.bounce ? ay : by; B.x = st.bounce ? bx : ax; B.y = st.bounce ? by : ay; A.z = B.z = 0;
    }

    async _clear(st) {
      const f = this.fx, cell = this.cell;
      PP.sfx.combo(st.combo);
      // bomb/stripe conversions flash first
      if (st.convert && st.convert.length) { st.convert.forEach((cv) => { const s = this.at(cv.r, cv.c); if (s) { s.s = cv.s; s.white = 1; } }); PP.sfx.zap(); await this.sleep(240); }
      let fire = false;
      (st.fx || []).forEach((e) => {
        fire = true;
        if (e.k === "row") f.beam(0, (e.r + 0.5) * cell, this.w * cell, (e.r + 0.5) * cell, { color: "#FFF6A0", width: cell * 0.62 });
        else if (e.k === "col") f.beam((e.c + 0.5) * cell, 0, (e.c + 0.5) * cell, this.h * cell, { color: "#BFF4FF", width: cell * 0.62 });
        else if (e.k === "blast") { const [x, y] = this.px(e.r, e.c); f.ring(x, y, { r1: cell * (e.rad + 1.2), width: 10, color: "#FFE98A" }); f.glow(x, y, { r: cell * (e.rad + 1.4), color: "#FFE98A" }); f.ring(x, y, { r1: cell * (e.rad + 2), width: 5, color: "#fff", life: 600 }); }
        else if (e.k === "zap") { const [bx, by] = this.px(e.from[0], e.from[1]); e.to.forEach(([r, c], i) => { if (i % 2) return; const [x, y] = this.px(r, c); f.beam(bx, by, x, y, { color: i % 4 ? "#FFB3E6" : "#B3F0FF", width: cell * 0.2, life: 480 }); }); f.glow(bx, by, { r: cell * 2.4, color: "#fff", life: 600 }); }
        else if (e.k === "all") { f.ring(this.w * cell / 2, this.h * cell / 2, { r1: this.w * cell, width: 16, color: "#fff", life: 800 }); this.flash = 1; }
      });
      if (fire || st.big) { PP.sfx.boom(); PP.fx.shake(this.host, Math.min(14, 5 + st.combo * 2 + (fire ? 4 : 0)), 460); if (this.onBig) this.onBig(); }
      let cx = 0, cy = 0;
      const sprs = st.cells.map((c) => this.sprites.get(c.id)).filter(Boolean);
      st.cells.forEach((c) => { const [x, y] = this.px(c.r, c.c); cx += x; cy += y; const P = PAL[c.t < 0 ? 0 : c.t % PAL.length]; const cols = c.t < 0 ? ["#fff", "#FFD60A", "#FF4D6D", "#3EA8FF"] : [P.hi, P.mid, "#fff"];
        f.burst(x, y, { n: 9, colors: cols, speed: 260 + st.combo * 30, size: cell * 0.2, life: 650, gravity: 620 }); });
      if (st.cells.length) { cx /= st.cells.length; cy /= st.cells.length; }
      // pop
      await this.tween(260, (u) => { sprs.forEach((s) => { s.sc = u < 0.35 ? 1 + u * 0.9 : 1.3 * (1 - (u - 0.35) / 0.65); s.al = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3; s.white = Math.min(1, u * 2.2); }); }, ease.out);
      sprs.forEach((s) => this.sprites.delete(s.id));
      // new specials pop in
      st.created.forEach((m) => { this.sprites.delete(m.oldId); const s = this._add(m.cell, m.r, m.c, { sc: 0, z: 3 }); const [x, y] = this.px(m.r, m.c); f.ring(x, y, { r1: cell * 1.1, width: 6, color: "#fff" }); f.burst(x, y, { n: 14, colors: ["#fff", "#FFE98A", "#FFB3E6"], size: cell * 0.18, life: 800, speed: 300 }); PP.sfx.star(); this.tween(380, (u) => { s.sc = u; }, ease.back).then(() => (s.z = 0)); });
      f.text(cx, cy, "+" + st.gain, { color: "#FFF6A0", size: Math.max(18, cell * (0.44 + Math.min(0.3, st.combo * 0.06))), life: 950 });
      if (st.combo >= 2 || st.big) f.text(this.w * this.cell / 2, this.h * this.cell * 0.32, st.label, { color: ["#FFD60A", "#FF9AD5", "#9AF3FF", "#B7FF9A"][st.combo % 4], size: Math.max(24, cell * 0.78), life: 1050, rise: 30 });
      if (this.onGain) this.onGain(st.gain, st);
      await this.sleep(80);
    }

    async _fall(st) {
      const cell = this.cell;
      const mv = st.moves.map((m) => ({ s: this.sprites.get(m.id), to: m.to })).filter((x) => x.s);
      const sp = st.spawns.map((m) => { const s = this._add(m.cell, m.from, m.to[1], { y: m.from }); return { s, to: m.to }; });
      const all = mv.map((x) => ({ s: x.s, y0: x.s.y, y1: x.to[0], x: x.to[1] })).concat(sp.map((x) => ({ s: x.s, y0: x.s.y, y1: x.to[0], x: x.to[1] })));
      if (!all.length) return;
      const maxD = Math.max(...all.map((a) => a.y1 - a.y0));
      const ms = 150 + 75 * Math.sqrt(maxD) * 2.2;
      await this.tween(Math.min(640, ms), (u) => { all.forEach((a) => { const k = Math.min(1, u * (1 + (a.y1 - a.y0) / (maxD * 3.5 || 1))); a.s.y = a.y0 + (a.y1 - a.y0) * ease.bounce(Math.min(1, k)); a.s.x = a.x; }); });
      all.forEach((a) => { a.s.y = a.y1; a.s.x = a.x; });
      if (all.length) PP.sfx.note(200 + Math.random() * 60, 0.04, "sine", 0.05);
    }

    async _shuffle(st) {
      const f = this.fx; f.text(this.w * this.cell / 2, this.h * this.cell / 2, "Shuffle! 🔀", { color: "#fff", size: this.cell * 0.8, life: 1100 }); PP.sfx.whoosh();
      if (st.fresh) { return; }
      const mv = st.moves.map((m) => ({ s: this.sprites.get(m.id), to: m.to })).filter((x) => x.s).map((x) => ({ s: x.s, x0: x.s.x, y0: x.s.y, x1: x.to[1], y1: x.to[0] }));
      await this.tween(520, (u) => { mv.forEach((a) => { a.s.x = a.x0 + (a.x1 - a.x0) * u; a.s.y = a.y0 + (a.y1 - a.y0) * u; a.s.rot = Math.sin(u * Math.PI) * 0.6; a.s.sc = 1 - Math.sin(u * Math.PI) * 0.25; }); }, ease.inout);
      mv.forEach((a) => { a.s.x = a.x1; a.s.y = a.y1; a.s.rot = 0; a.s.sc = 1; });
    }
  }

  PP.Candy.View = CandyView;
})();
