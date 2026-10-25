/* Block Party engine — pure game logic + a canvas renderer. No DOM except in BoardView.
 *
 * Shared-board modes are REDUCERS: every phone feeds the same ordered events into
 * new Split()/Turns()/Halves() and reaches the same state. Randomness (piece order) comes from a
 * seeded RNG, so a refreshed or late-joining phone can replay the log and land in the same place.
 */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});

  const STD = ["I", "O", "T", "S", "Z", "J", "L"];
  const CHAOS = ["dot", "duo", "corner", "plus", "thicc"];
  const SHAPES = {
    I: [[0, 0], [1, 0], [2, 0], [3, 0]], O: [[0, 0], [1, 0], [0, 1], [1, 1]],
    T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]],
    Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]],
    dot: [[0, 0]], duo: [[0, 0], [1, 0]], corner: [[0, 0], [1, 0], [0, 1]],
    plus: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], thicc: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]],
  };
  const COLORS = {
    I: "#22D3EE", O: "#FFD23F", T: "#A66CFF", S: "#2EE6A6", Z: "#FF6B6B", J: "#4D8CFF", L: "#FF9F1C",
    dot: "#FF5CA8", duo: "#9BE564", corner: "#FF8FB1", plus: "#5CE1E6", thicc: "#F9844A",
  };
  const NAMES = { dot: "Dot", duo: "Duo", corner: "Corner", plus: "Plus", thicc: "Thicc" };
  const PTS = [0, 100, 300, 500, 800];

  /* ---------- pieces ---------- */
  function normalize(cells) {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - mx, c[1] - my]);
  }
  const ROT = {};
  Object.keys(SHAPES).forEach((k) => {
    ROT[k] = [normalize(SHAPES[k])];
    for (let i = 1; i < 4; i++) ROT[k].push(normalize(ROT[k][i - 1].map(([x, y]) => [-y, x])));
  });
  const cellsOf = (k, r) => ROT[k][((r % 4) + 4) % 4];
  const dims = (cells) => ({ w: Math.max(...cells.map((c) => c[0])) + 1, h: Math.max(...cells.map((c) => c[1])) + 1 });

  function newPiece(k, b) {
    const { w } = dims(cellsOf(k, 0));
    return { k, r: 0, x: b.x0 + Math.floor((b.x1 - b.x0 + 1 - w) / 2), y: 0 };
  }

  const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];
  // rotate clockwise around the piece's centre, with a few wall/stack kicks. collide(cells,x,y)->bool
  function tryRotate(p, collide) {
    const a = cellsOf(p.k, p.r), b = cellsOf(p.k, p.r + 1);
    const da = dims(a), db = dims(b);
    const bx = p.x + Math.floor((da.w - db.w) / 2), by = p.y + Math.floor((da.h - db.h) / 2);
    for (const [kx, ky] of KICKS) if (!collide(b, bx + kx, by + ky)) return { k: p.k, r: (p.r + 1) % 4, x: bx + kx, y: by + ky };
    return null;
  }

  class PieceBag {
    constructor(rng, chaos) { this.rng = rng; this.chaos = !!chaos; this.q = []; }
    next() {
      if (this.chaos && this.rng.chance(0.14)) return this.rng.pick(CHAOS);   // a surprise guest
      if (!this.q.length) this.q = this.rng.shuffle(STD);
      return this.q.pop();
    }
  }

  /* ---------- board ---------- */
  class Board {
    constructor(w, h) {
      this.w = w; this.h = h; this.nextId = 0; this.rows = [];
      for (let i = 0; i < h; i++) this.rows.push(this.newRow());
    }
    newRow() { return { id: this.nextId++, c: new Array(this.w).fill("") }; }
    get(x, y) { return y < 0 ? "" : this.rows[y].c[x]; }
    collides(cells, px, py, b) {
      b = b || { x0: 0, x1: this.w - 1 };
      for (const [cx, cy] of cells) {
        const x = px + cx, y = py + cy;
        if (x < b.x0 || x > b.x1 || y >= this.h) return true;
        if (y >= 0 && this.rows[y].c[x]) return true;
      }
      return false;
    }
    lock(cells, px, py, k) { for (const [cx, cy] of cells) { const y = py + cy; if (y >= 0) this.rows[y].c[px + cx] = k; } }
    indexOfId(id) { for (let i = 0; i < this.rows.length; i++) if (this.rows[i].id === id) return i; return -1; }
    // [[x, rowId], ...] — independent of any row shifts that happened meanwhile
    lockById(cells, k) {
      let n = 0;
      for (const [x, rid] of cells) {
        const i = this.indexOfId(rid);
        if (i >= 0 && x >= 0 && x < this.w && !this.rows[i].c[x]) { this.rows[i].c[x] = k; n++; }
      }
      return n;
    }
    fullRows() { const o = []; this.rows.forEach((r, i) => { if (r.c.every(Boolean)) o.push(i); }); return o; }
    clearRows(idx) {
      const set = new Set(idx);
      this.rows = this.rows.filter((_, i) => !set.has(i));
      while (this.rows.length < this.h) this.rows.unshift(this.newRow());
      return idx.length;
    }
    // calm-mode relief: lift the whole stack by dropping its bottom n rows
    relieve(n) {
      this.rows.splice(this.h - n, n);
      while (this.rows.length < this.h) this.rows.unshift(this.newRow());
    }
    snapshot() { return this.rows.map((r) => r.c.map((c) => (c ? c[0] : ".")).join("")); }
    height() { for (let i = 0; i < this.h; i++) if (this.rows[i].c.some(Boolean)) return this.h - i; return 0; }
  }

  const levelOf = (lines) => 1 + Math.floor(lines / 8);
  function tickMs(speed, level) {
    const base = { chill: 1300, normal: 950, zippy: 650 }[speed] || 950;
    return Math.max(speed === "chill" ? 520 : 320, Math.round(base * Math.pow(0.93, level - 1)));
  }

  /* ---------- shared helper: a faller that a player steers locally ---------- */
  class Faller {
    constructor(collide, bounds) { this.collide = collide; this.b = bounds; this.p = null; }
    spawn(k) { this.p = newPiece(k, this.b); return !this.collide(cellsOf(k, 0), this.p.x, this.p.y); }
    cells() { return cellsOf(this.p.k, this.p.r); }
    move(dx) { if (!this.p || this.collide(this.cells(), this.p.x + dx, this.p.y)) return false; this.p.x += dx; return true; }
    down() { if (!this.p || this.collide(this.cells(), this.p.x, this.p.y + 1)) return false; this.p.y++; return true; }
    rotate() { if (!this.p) return false; const n = tryRotate(this.p, this.collide); if (!n) return false; this.p = n; return true; }
    ghostY() { let y = this.p.y; const c = this.cells(); while (!this.collide(c, this.p.x, y + 1)) y++; return y; }
    hard() { const d = this.ghostY() - this.p.y; this.p.y += d; return d; }
  }

  /* ======================================================================
   *  Reducers
   * ====================================================================== */

  // MODE 1 — "Split": one shared piece. Some players steer left/right, others spin and drop. Roles swap.
  class Split {
    constructor(o) {
      this.o = o; this.W = 10; this.H = 20; this.B = { x0: 0, x1: 9 };
      this.board = new Board(10, 20); this.bag = new PieceBag(o.rng, o.chaos);
      this.score = 0; this.lines = 0; this.level = 1; this.pieces = 0; this.over = false;
      this.stats = {}; o.roster.forEach((id) => (this.stats[id] = { pieces: 0, lines: 0, acts: 0 }));
      this.lastLocker = null; this.nextK = this.bag.next(); this.spawn();
    }
    spawn() {
      const k = this.nextK; this.nextK = this.bag.next(); this.pieces++;
      this.cur = newPiece(k, this.B);
      return !this.board.collides(cellsOf(k, 0), this.cur.x, this.cur.y, this.B);
    }
    movers() {
      const r = this.o.roster;
      if (r.length < 2) return new Set(r);
      const swap = Math.floor((this.pieces - 1) / 4) % 2;
      return new Set(r.filter((_, i) => (i % 2 === 0) === (swap === 0)));
    }
    role(id) { return this.o.roster.length < 2 ? "both" : this.movers().has(id) ? "mover" : "rotator"; }
    get tick() { return tickMs(this.o.speed, this.level); }
    collide(c, x, y) { return this.board.collides(c, x, y, this.B); }
    finishLock(fx, by) {
      const p = this.cur, cells = cellsOf(p.k, p.r);
      this.board.lock(cells, p.x, p.y, p.k);
      fx.push({ t: "lock" });
      if (by && this.stats[by]) this.stats[by].pieces++;
      const full = this.board.fullRows();
      if (full.length) {
        const info = full.map((i) => this.board.rows[i].c.slice());
        const n = this.board.clearRows(full);
        this.lines += n; this.score += PTS[Math.min(4, n)] * this.level; this.level = levelOf(this.lines);
        if (by && this.stats[by]) this.stats[by].lines += n;
        fx.push({ t: "clear", n, by, rows: full, info });
      }
      const before = this.pieces;
      if (!this.spawn()) {
        if (this.o.calm) { this.board.relieve(7); this.spawn(); fx.push({ t: "relief" }); } else { this.over = true; fx.push({ t: "over" }); }
      } else if (before % 4 === 0 && this.o.roster.length > 1) fx.push({ t: "swap" });
    }
    apply(ev) {
      const fx = [];
      if (this.over) return fx;
      const p = this.cur;
      if (ev.type === "tick") {
        if (!this.collide(cellsOf(p.k, p.r), p.x, p.y + 1)) p.y++; else this.finishLock(fx, this.lastLocker);
      } else if (ev.type === "in") {
        const a = ev.d.a, role = this.role(ev.f);
        if (!this.stats[ev.f]) return fx;
        if (role === "mover" && !["L", "R", "S"].includes(a)) return fx;
        if (role === "rotator" && !["ROT", "DROP"].includes(a)) return fx;
        this.lastLocker = ev.f;
        this.stats[ev.f].acts++;
        if (a === "L" && !this.collide(cellsOf(p.k, p.r), p.x - 1, p.y)) p.x--;
        else if (a === "R" && !this.collide(cellsOf(p.k, p.r), p.x + 1, p.y)) p.x++;
        else if (a === "S" && !this.collide(cellsOf(p.k, p.r), p.x, p.y + 1)) p.y++;
        else if (a === "ROT") { const n = tryRotate(p, (c, x, y) => this.collide(c, x, y)); if (n) this.cur = n; }
        else if (a === "DROP") { while (!this.collide(cellsOf(p.k, p.r), p.x, p.y + 1)) p.y++; this.finishLock(fx, ev.f); }
      }
      return fx;
    }
  }

  // MODE 3 — "Turns": one shared board, players alternate placing a piece each.
  class Turns {
    constructor(o) {
      this.o = o; this.W = 10; this.H = 20; this.B = { x0: 0, x1: 9 };
      this.board = new Board(10, 20); this.bag = new PieceBag(o.rng, o.chaos);
      this.score = 0; this.lines = 0; this.level = 1; this.t = 0; this.pieces = 0; this.over = false;
      this.stats = {}; o.roster.forEach((id) => (this.stats[id] = { pieces: 0, lines: 0 }));
      this.curK = this.bag.next(); this.nextK = this.bag.next();
    }
    get active() { return this.o.roster[this.t % this.o.roster.length]; }
    spawnBlocked() { const p = newPiece(this.curK, this.B); return this.board.collides(cellsOf(this.curK, 0), p.x, p.y, this.B); }
    advance() { this.curK = this.nextK; this.nextK = this.bag.next(); this.t++; }
    apply(ev) {
      const fx = [];
      if (this.over) return fx;
      if (ev.type === "skip") { if (ev.d.t === this.t) { this.t++; fx.push({ t: "skip" }); } return fx; }
      if (ev.type !== "place" || ev.f !== this.active) return fx;
      const { r, x, y } = ev.d, cells = cellsOf(this.curK, r);
      if (this.board.collides(cells, x, y, this.B)) return fx;
      this.board.lock(cells, x, y, this.curK); this.pieces++;
      this.stats[ev.f].pieces++;
      fx.push({ t: "lock" });
      const full = this.board.fullRows();
      if (full.length) {
        const info = full.map((i) => this.board.rows[i].c.slice());
        const n = this.board.clearRows(full);
        this.lines += n; this.score += PTS[Math.min(4, n)] * this.level; this.level = levelOf(this.lines);
        this.stats[ev.f].lines += n; fx.push({ t: "clear", n, by: ev.f, rows: full, info });
      }
      this.advance();
      if (this.spawnBlocked()) {
        if (this.o.calm) { this.board.relieve(7); fx.push({ t: "relief" }); } else { this.over = true; fx.push({ t: "over" }); }
      }
      return fx;
    }
  }

  // MODE 2 — "Halves": a wide board, one half each. A row only clears when BOTH halves of it are full.
  class Halves {
    constructor(o) {
      this.o = o; this.W = 12; this.H = 20;
      this.board = new Board(12, 20);
      this.half = {}; o.roster.forEach((id, i) => (this.half[id] = i === 0 ? { x0: 0, x1: 5 } : { x0: 6, x1: 11 }));
      this.score = 0; this.lines = 0; this.level = 1; this.over = false; this.reliefs = 0;
      this.stats = {}; o.roster.forEach((id) => (this.stats[id] = { pieces: 0, lines: 0 }));
    }
    apply(ev) {
      const fx = [];
      if (this.over) return fx;
      if (ev.type === "lock") {
        const b = this.half[ev.f];
        if (!b) return fx;
        const cells = (ev.d.cells || []).filter(([x]) => x >= b.x0 && x <= b.x1);
        this.board.lockById(cells, ev.d.k);
        this.stats[ev.f].pieces++;
        fx.push({ t: "lock", by: ev.f, lid: ev.d.lid });
        const full = this.board.fullRows();
        if (full.length) {
          const info = full.map((i) => this.board.rows[i].c.slice());
          const n = this.board.clearRows(full);
          this.lines += n; this.score += PTS[Math.min(4, n)] * this.level; this.level = levelOf(this.lines);
          this.stats[ev.f].lines += n; fx.push({ t: "clear", n, by: ev.f, rows: full, info });
        }
      } else if (ev.type === "over") { this.over = true; fx.push({ t: "over" }); }
      else if (ev.type === "relief") { this.board.relieve(6); this.reliefs++; fx.push({ t: "relief" }); }
      return fx;
    }
  }

  /* ======================================================================
   *  Rendering
   * ====================================================================== */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  /* a glossy bevelled cube, like the reference: lit top + left faces, shaded right + bottom faces, a gel highlight */
  function block(g, x, y, s, color, alpha) {
    g.save();
    if (alpha != null) g.globalAlpha = alpha;
    const p = s * 0.05, w = s - p * 2, b = w * 0.2, x0 = x + p, y0 = y + p, x1 = x0 + w, y1 = y0 + w;
    // outer cube
    g.fillStyle = shade(color, -0.35); g.beginPath(); g.roundRect ? g.roundRect(x0, y0, w, w, s * 0.14) : g.rect(x0, y0, w, w); g.fill();
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(x0, y0, w, w, s * 0.14) : g.rect(x0, y0, w, w); g.clip();
    g.fillStyle = shade(color, 0.55); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 - b, y0 + b); g.lineTo(x0 + b, y0 + b); g.closePath(); g.fill();           // top face
    g.fillStyle = shade(color, 0.3); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + b, y0 + b); g.lineTo(x0 + b, y1 - b); g.lineTo(x0, y1); g.closePath(); g.fill();           // left face
    g.fillStyle = shade(color, -0.2); g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x1 - b, y1 - b); g.lineTo(x1 - b, y0 + b); g.closePath(); g.fill();         // right face
    g.fillStyle = shade(color, -0.42); g.beginPath(); g.moveTo(x0, y1); g.lineTo(x1, y1); g.lineTo(x1 - b, y1 - b); g.lineTo(x0 + b, y1 - b); g.closePath(); g.fill();        // bottom face
    const fg = g.createLinearGradient(x0 + b, y0 + b, x1 - b, y1 - b); fg.addColorStop(0, shade(color, 0.22)); fg.addColorStop(1, shade(color, -0.08));
    g.fillStyle = fg; g.fillRect(x0 + b, y0 + b, w - b * 2, w - b * 2);                                                                                                     // front face
    const gl = g.createLinearGradient(x0, y0, x0 + w * 0.8, y0 + w * 0.8); gl.addColorStop(0, "rgba(255,255,255,.75)"); gl.addColorStop(0.45, "rgba(255,255,255,.12)"); gl.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gl; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w * 0.85, y0); g.lineTo(x0, y0 + w * 0.85); g.closePath(); g.fill();                                  // gel gloss
    g.restore();
    g.lineWidth = Math.max(1, s * 0.05); g.strokeStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.roundRect ? g.roundRect(x0 + 0.5, y0 + 0.5, w - 1, w - 1, s * 0.14) : g.rect(x0, y0, w, w); g.stroke();
    g.restore();
  }

  class BoardView {
    constructor(canvas) { this.cv = canvas; this.g = canvas.getContext("2d"); this.cell = 20; this.w = 10; this.h = 20; }
    resize(cell, w, h) {
      const dpr = window.devicePixelRatio || 1;
      this.cell = cell; this.w = w; this.h = h; this.dpr = dpr;
      this.cv.style.width = cell * w + "px"; this.cv.style.height = cell * h + "px";
      this.cv.width = Math.round(cell * w * dpr); this.cv.height = Math.round(cell * h * dpr);
    }
    /* o: { piece, ghost, extra:[{piece,color,alpha}], pending:[[x,rid,k]], halves:[{x0,x1,color,label}], mine, dim } */
    draw(board, o) {
      o = o || {};
      const g = this.g, s = this.cell;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const bgG = g.createLinearGradient(0, 0, 0, this.h * s); bgG.addColorStop(0, "#14246B"); bgG.addColorStop(0.55, "#1A1370"); bgG.addColorStop(1, "#2B0F72");
      g.fillStyle = bgG; g.fillRect(0, 0, this.w * s, this.h * s);
      const vg = g.createRadialGradient(this.w * s / 2, this.h * s * 0.45, s, this.w * s / 2, this.h * s * 0.5, this.h * s * 0.75); vg.addColorStop(0, "rgba(90,200,255,.2)"); vg.addColorStop(1, "rgba(0,0,0,.28)");
      g.fillStyle = vg; g.fillRect(0, 0, this.w * s, this.h * s);
      if (o.halves) o.halves.forEach((h) => { g.fillStyle = h.color; g.globalAlpha = h.mine ? 0.16 : 0.07; g.fillRect(h.x0 * s, 0, (h.x1 - h.x0 + 1) * s, this.h * s); g.globalAlpha = 1; });
      g.strokeStyle = "rgba(110,225,255,.22)"; g.lineWidth = 1;
      for (let x = 1; x < this.w; x++) { g.beginPath(); g.moveTo(x * s, 0); g.lineTo(x * s, this.h * s); g.stroke(); }
      for (let y = 1; y < this.h; y++) { g.beginPath(); g.moveTo(0, y * s); g.lineTo(this.w * s, y * s); g.stroke(); }
      if (o.halves) { g.setLineDash([6, 6]); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; const mx = (o.halves[0].x1 + 1) * s; g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, this.h * s); g.stroke(); g.setLineDash([]); }
      for (let y = 0; y < board.h; y++) for (let x = 0; x < board.w; x++) { const k = board.rows[y].c[x]; if (k) block(g, x * s, y * s, s, COLORS[k] || "#fff"); }
      if (o.pending) o.pending.forEach(([x, rid, k]) => { const y = board.indexOfId(rid); if (y >= 0) block(g, x * s, y * s, s, COLORS[k]); });
      if (o.hint) o.hint.forEach((h) => { g.strokeStyle = "#FFD23F"; g.lineWidth = 2.5; g.strokeRect(h.x0 * s + 2, h.y * s + 2, (h.x1 - h.x0 + 1) * s - 4, s - 4); });
      if (o.piece && o.ghost != null) cellsOf(o.piece.k, o.piece.r).forEach(([cx, cy]) => block(g, (o.piece.x + cx) * s, (o.ghost + cy) * s, s, COLORS[o.piece.k], 0.25));
      (o.extra || []).forEach((e) => cellsOf(e.piece.k, e.piece.r).forEach(([cx, cy]) => block(g, (e.piece.x + cx) * s, (e.piece.y + cy) * s, s, COLORS[e.piece.k], e.alpha || 0.55)));
      if (o.piece) cellsOf(o.piece.k, o.piece.r).forEach(([cx, cy]) => block(g, (o.piece.x + cx) * s, (o.piece.y + cy) * s, s, COLORS[o.piece.k]));
      if (o.dim) { g.fillStyle = "rgba(30,18,64,.55)"; g.fillRect(0, 0, this.w * s, this.h * s); }
    }
  }

  function drawMini(canvas, k, size) {
    const g = canvas.getContext("2d"), dpr = window.devicePixelRatio || 1;
    canvas.style.width = canvas.style.height = size + "px";
    canvas.width = canvas.height = Math.round(size * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    if (!k) return;
    const cells = cellsOf(k, 0), d = dims(cells), s = Math.floor(size / 4.4);
    const ox = (size - d.w * s) / 2, oy = (size - d.h * s) / 2;
    cells.forEach(([cx, cy]) => block(g, ox + cx * s, oy + cy * s, s, COLORS[k]));
  }

  // a small read-only picture of someone else's board (versus mode)
  function drawSnapshot(canvas, rows, cell) {
    const g = canvas.getContext("2d"), dpr = window.devicePixelRatio || 1, h = rows.length, w = rows[0].length;
    canvas.style.width = cell * w + "px"; canvas.style.height = cell * h + "px";
    canvas.width = Math.round(cell * w * dpr); canvas.height = Math.round(cell * h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#1E1240"; g.fillRect(0, 0, cell * w, cell * h);
    const byInitial = {}; Object.keys(COLORS).forEach((k) => { byInitial[k[0]] = COLORS[k]; });
    rows.forEach((row, y) => row.split("").forEach((ch, x) => { if (ch !== ".") { g.fillStyle = byInitial[ch] || "#fff"; g.fillRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1); } }));
  }

  PP.Tetris = { STD, CHAOS, SHAPES, COLORS, NAMES, PTS, cellsOf, dims, newPiece, tryRotate, Board, PieceBag, Faller, Split, Turns, Halves, BoardView, drawMini, drawSnapshot, levelOf, tickMs, shade };
})();
