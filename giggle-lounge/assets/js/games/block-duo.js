/* Block Duo — the Block Blast idea, for two. Drag pieces onto a shared 8×8 grid; complete a row or column and it
 * explodes. You take turns, so every piece you place decides what your partner can do next.
 * Trust game: leave them room. */
(function () {
  "use strict";
  const PP = window.PP, T = PP.Tetris, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const N = 8;
  const COLORS = ["#FF5CA8", "#FFB020", "#3FD64F", "#3EA8FF", "#A66CFF", "#FF6B6B", "#19D3C5", "#FFD23F"];

  /* ---------- the pieces ---------- */
  const norm = (cells) => { const mr = Math.min(...cells.map((c) => c[0])), mc = Math.min(...cells.map((c) => c[1])); return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const rot = (cells) => norm(cells.map(([r, c]) => [c, -r]));
  const parse = (s) => { const out = []; s.split("\n").forEach((row, r) => row.split("").forEach((ch, c) => { if (ch === "#") out.push([r, c]); })); return norm(out); };
  const SHAPES = [];
  function add(art, weight, rotations) {
    let cells = parse(art); const seen = new Set();
    for (let i = 0; i < (rotations ? 4 : 1); i++) {
      const key = JSON.stringify(cells);
      if (!seen.has(key)) { seen.add(key); const w = Math.max(...cells.map((c) => c[1])) + 1, h = Math.max(...cells.map((c) => c[0])) + 1; SHAPES.push({ id: SHAPES.length, cells, w, h, weight, color: COLORS[SHAPES.length % COLORS.length] }); }
      cells = rot(cells);
    }
  }
  add("#", 2, false); add("##", 3, true); add("###", 4, true); add("####", 3, true); add("#####", 1.6, true);
  add("##\n##", 5, false); add("###\n###\n###", 1.2, false); add("###\n###", 3, true);
  add("##\n#.", 3, true); add("#..\n#..\n###", 2, true); add(".##\n##.", 2.5, true); add("###\n.#.", 2.5, true);
  add("##.\n.##", 2.5, true); add("#.\n##\n#.", 1.4, false);

  const fits = (grid, s, r, c) => { if (r < 0 || c < 0 || r + s.h > N || c + s.w > N) return false; return s.cells.every(([y, x]) => grid[r + y][c + x] < 0); };
  const anyFit = (grid, s) => { for (let r = 0; r <= N - s.h; r++) for (let c = 0; c <= N - s.w; c++) if (fits(grid, s, r, c)) return true; return false; };
  const dups = (rng) => { const items = SHAPES, w = SHAPES.map((s) => s.weight); return rng.weighted(items, w); };

  /* ---------- the reducer: every phone folds the same events ---------- */
  class Duo {
    constructor(o) {
      this.o = o; this.roster = o.roster; this.shared = o.mode !== "own"; this.calm = !!o.calm;
      this.grid = Array.from({ length: N }, () => new Array(N).fill(-1));
      this.score = 0; this.lines = 0; this.moves = 0; this.streak = 0; this.best = 0; this.over = false; this.t = 0;
      this.stats = {}; this.roster.forEach((id) => (this.stats[id] = { cells: 0, lines: 0, moves: 0 }));
      this.trays = {}; this.rngs = {};
      if (this.shared) { this.rngs.s = o.rngFor("bb"); this.trays.s = this.gen("s"); }
      else this.roster.forEach((id, i) => { this.rngs[id] = o.rngFor("bb" + i); this.trays[id] = this.gen(id); });
    }
    get active() { return this.roster[this.t % this.roster.length]; }
    key(id) { return this.shared ? "s" : id; }
    gen(k) {                                                           // three pieces, at least one of which fits right now
      const rng = this.rngs[k];
      for (let tries = 0; tries < 14; tries++) { const tray = [dups(rng).id, dups(rng).id, dups(rng).id]; if (tray.some((id) => anyFit(this.grid, SHAPES[id]))) return tray; }
      return [0, 1, 2];
    }
    canMove(id) { return this.trays[this.key(id)].some((sid) => sid != null && anyFit(this.grid, SHAPES[sid])); }
    apply(ev) {
      const fx = [];
      if (this.over || ev.type !== "place" || ev.f !== this.active) return fx;
      const k = this.key(ev.f), tray = this.trays[k], { i, r, c } = ev.d;
      if (!(i >= 0 && i < 3) || tray[i] == null) return fx;
      const s = SHAPES[tray[i]];
      if (!fits(this.grid, s, r, c)) return fx;
      s.cells.forEach(([y, x]) => (this.grid[r + y][c + x] = s.id));
      tray[i] = null; this.moves++; this.stats[ev.f].moves++; this.stats[ev.f].cells += s.cells.length;
      const rows = [], cols = [];
      for (let y = 0; y < N; y++) if (this.grid[y].every((v) => v >= 0)) rows.push(y);
      for (let x = 0; x < N; x++) if (this.grid.every((row) => row[x] >= 0)) cols.push(x);
      const cleared = [];
      rows.forEach((y) => { for (let x = 0; x < N; x++) cleared.push([y, x, this.grid[y][x]]); });
      cols.forEach((x) => { for (let y = 0; y < N; y++) if (!rows.includes(y)) cleared.push([y, x, this.grid[y][x]]); });
      const n = rows.length + cols.length;
      let gain = s.cells.length;
      if (n) { gain += 10 * n * n + 6 * this.streak; this.streak++; this.lines += n; this.stats[ev.f].lines += n; this.best = Math.max(this.best, this.streak);
        rows.forEach((y) => this.grid[y].fill(-1)); cols.forEach((x) => this.grid.forEach((row) => (row[x] = -1))); } else this.streak = 0;
      this.score += gain;
      fx.push({ t: "place", by: ev.f, r, c, s, gain }); if (n) fx.push({ t: "clear", n, rows, cols, cleared, streak: this.streak, by: ev.f });
      if (tray.every((x) => x == null)) this.trays[k] = this.gen(k);
      this.t++;
      if (!this.canMove(this.active)) {
        if (this.calm) { this.relieve(); fx.push({ t: "relief" }); if (!this.canMove(this.active)) { this.grid.forEach((row) => row.fill(-1)); } }
        else { this.over = true; fx.push({ t: "over" }); }
      }
      return fx;
    }
    relieve() {                                                         // calm mode: pop the two fullest rows and columns
      const rows = Array.from({ length: N }, (_, y) => [y, this.grid[y].filter((v) => v >= 0).length]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 2);
      const cols = Array.from({ length: N }, (_, x) => [x, this.grid.filter((row) => row[x] >= 0).length]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 2);
      rows.forEach(([y]) => this.grid[y].fill(-1)); cols.forEach(([x]) => this.grid.forEach((row) => (row[x] = -1)));
    }
  }
  PP.BlockDuo = { Duo, SHAPES, N, fits, anyFit };

  PP.registerGame({
    id: "block-duo", name: "Block Duo", emoji: "🧩", color: "#6BE3C0",
    tagline: "Drop pieces on a shared grid. Leave your partner some room!",
    how: "Take turns dragging pieces onto the grid. Fill a whole row or column and it explodes! Every piece you place changes what your partner can do next — so think about them. If nobody can place anything, the grid is stuck.",
    min: 1, max: 4, tags: ["trust", "puzzle", "turn-based"], silent: "ok",
    options: [
      { id: "mode", label: "Whose pieces?", kind: "cards", def: "shared", choices: [
        { v: "shared", emoji: "🤝", label: "Shared tray", desc: "One tray of three pieces for both of you. Use one, then your partner picks from what's left. Talk about the plan!", min: 1, max: 4 },
        { v: "own", emoji: "🫣", label: "Own trays", desc: "You each get your own pieces — you have to hope your partner leaves space for YOURS. Perfect for silent mode.", min: 2, max: 4 },
      ] },
      { id: "calm", label: "🫧 Calm mode", kind: "toggle", def: false, hint: "No game over. If the grid gets stuck, a few lines quietly clear." },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const S = new Duo({ roster, mode: ctx.settings.mode || "shared", calm: !!ctx.settings.calm, rngFor: (k) => ctx.rng(k) });
      const cleanups = []; let destroyed = false, finished = false, raf = 0;
      let sel = null, drag = null, hover = null, flashes = [];
      const live = (ev) => ctx.live(ev);

      /* ---------- layout ---------- */
      const canvas = el("canvas.bb-canvas"), popLayer = el("div.tt-poplayer"), board = el("div.tt-board.bb-board", canvas, popLayer);
      const fxp = new PP.fx.Particles(board), view = new T.BoardView(canvas);
      const scoreNum = el("b.tt-v", "0"), linesNum = el("b.tt-v", "0"), comboNum = el("b.tt-v", "0");
      const hud = el("div.bb-hud", el("div.tt-stat", el("span", "Score"), scoreNum), el("div.tt-stat", el("span", "Lines"), linesNum), el("div.tt-stat", el("span", "Combo"), comboNum));
      const roleBar = el("div.tt-role"), trayBox = el("div.bb-trays"), tools = el("div.cm-tools", el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("done", {}) }, "🏁 Wrap up"));
      const root = el("div.tt.bb", hud, roleBar, board, trayBox, tools);
      mount(ctx.el, root);
      let cell = 40;
      const fit = () => { const availW = Math.min(ctx.el.clientWidth || innerWidth, 520) - 30, availH = Math.max(240, innerHeight - 520); cell = Math.max(24, Math.min(54, Math.floor(Math.min(availW / N, availH / N)))); view.resize(cell, N, N); fxp.resize(cell * N, cell * N); drawTrays(); };
      window.addEventListener("resize", fit); cleanups.push(() => window.removeEventListener("resize", fit));
      const popup = (text, cls) => { const p = el("div.tt-pop" + (cls ? "." + cls : ""), text); popLayer.appendChild(p); setTimeout(() => p.remove(), 1500); };

      /* ---------- trays ---------- */
      const myKey = () => S.key(me);
      const mine = () => S.active === me && !S.over && !finished;
      const slotCvs = [];
      function drawPiece(cv, s, px, dim) {
        const g = cv.getContext("2d"), dpr = window.devicePixelRatio || 1, size = cv.width / dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
        if (!s) return;
        const cs = Math.min(px, (size - 8) / Math.max(s.w, s.h)), ox = (size - s.w * cs) / 2, oy = (size - s.h * cs) / 2;
        if (dim) g.globalAlpha = 0.45;
        s.cells.forEach(([y, x]) => T.block(g, ox + x * cs, oy + y * cs, cs, s.color));
      }
      function drawTrays() {
        mount(trayBox);
        slotCvs.length = 0;
        const trays = S.shared ? [["s", S.trays.s, true]] : [[me, S.trays[me], true]].concat(roster.filter((id) => id !== me).map((id) => [id, S.trays[id], false]));
        trays.forEach(([key, tray, isMine]) => {
          const owner = S.shared ? null : ctx.player(key);
          const row = el("div.bb-tray" + (isMine ? "" : ".theirs"));
          if (owner && !isMine) row.appendChild(el("div.bb-who", W.avatar(owner, 22), el("b", owner.name + "'s pieces")));
          const slots = el("div.bb-slots");
          tray.forEach((sid, i) => {
            const size = isMine ? Math.min(118, Math.floor((Math.min(ctx.el.clientWidth || innerWidth, 520) - 60) / 3)) : 54;
            const cv = el("canvas.bb-slot" + (isMine ? "" : ".small"), { width: Math.round(size * (window.devicePixelRatio || 1)), height: Math.round(size * (window.devicePixelRatio || 1)), style: { width: size + "px", height: size + "px" } });
            const s = sid == null ? null : SHAPES[sid];
            drawPiece(cv, s, cell * (isMine ? 0.82 : 0.4), sid != null && isMine && !mine());
            if (isMine && s) {
              cv.classList.toggle("sel", sel === i); cv.classList.toggle("stuck", !anyFit(S.grid, s));
              cv.addEventListener("pointerdown", (e) => startDrag(e, i, s, cv));
              slotCvs[i] = cv;
            }
            slots.appendChild(cv);
          });
          row.appendChild(slots); trayBox.appendChild(row);
        });
      }

      /* ---------- drag & tap to place ---------- */
      let ghost = null;
      function startDrag(e, i, s, cv) {
        if (!mine()) { PP.ui.toast(S.over ? "That's the end!" : "Not your turn yet ✋", 1000); return; }
        e.preventDefault(); sel = i; drag = { i, s }; hover = null;
        ghost = el("canvas.bb-ghost"); const gs = Math.round(cell * Math.max(s.w, s.h) + 6), dpr = window.devicePixelRatio || 1;
        ghost.width = ghost.height = Math.round(gs * dpr); ghost.style.width = ghost.style.height = gs + "px"; document.body.appendChild(ghost);
        const g = ghost.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); s.cells.forEach(([y, x]) => T.block(g, 3 + x * cell, 3 + y * cell, cell, s.color));
        moveDrag(e); sfx.tap();
        const mv = (ev) => moveDrag(ev), up = (ev) => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); endDrag(ev); };
        window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
      }
      function boardCell(ev, s) {
        const b = canvas.getBoundingClientRect(), lift = cell * 1.6;
        const r = Math.round((ev.clientY - lift - b.top) / cell - s.h / 2), c = Math.round((ev.clientX - b.left) / cell - s.w / 2);
        return [r, c];
      }
      function moveDrag(ev) {
        if (!drag) return; const s = drag.s, b = canvas.getBoundingClientRect(), lift = cell * 1.6;
        ghost.style.left = ev.clientX - (cell * s.w) / 2 - 3 + "px"; ghost.style.top = ev.clientY - lift - (cell * s.h) / 2 - 3 + "px";
        const [r, c] = boardCell(ev, s); hover = fits(S.grid, s, r, c) ? { r, c, s } : null; ghost.style.opacity = hover ? "0.55" : "0.95";
      }
      function endDrag(ev) {
        if (!drag) return; const d = drag; drag = null; if (ghost) ghost.remove(); ghost = null;
        const b = canvas.getBoundingClientRect();
        if (hover && ev.clientX >= b.left - cell && ev.clientX <= b.right + cell && ev.clientY >= b.top - cell * 3) { ctx.send("place", { i: d.i, r: hover.r, c: hover.c }); sel = null; sfx.pop(); }
        hover = null; drawTrays();
      }
      canvas.addEventListener("pointerdown", (e) => {                       // tap-to-place: pick a piece, then tap the grid
        if (!mine() || sel == null) return; const t = S.trays[myKey()][sel]; if (t == null) return; const s = SHAPES[t];
        const b = canvas.getBoundingClientRect(), r = Math.round((e.clientY - b.top) / cell - s.h / 2 - 0.5), c = Math.round((e.clientX - b.left) / cell - s.w / 2 - 0.5);
        const [rr, cc] = [Math.max(0, Math.min(N - s.h, r)), Math.max(0, Math.min(N - s.w, c))];
        if (fits(S.grid, s, rr, cc)) { ctx.send("place", { i: sel, r: rr, c: cc }); sel = null; sfx.pop(); } else sfx.bad();
      });

      /* ---------- painting ---------- */
      function paint() {
        const g = view.g;
        view.draw({ w: N, h: N, rows: S.grid.map((row) => ({ c: row.map((v) => (v >= 0 ? "x" + v : "")) })), indexOfId: () => -1 }, {});
        // cells (view.draw only knows tetris keys, so paint our glossy cubes on top)
        g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (S.grid[y][x] >= 0) T.block(g, x * cell, y * cell, cell, COLORS[S.grid[y][x] % COLORS.length]);
        if (hover) {
          const { r, c, s } = hover; s.cells.forEach(([y, x]) => T.block(g, (c + x) * cell, (r + y) * cell, cell, s.color, 0.55));
          // preview which lines would complete
          const tmp = S.grid.map((row) => row.slice()); s.cells.forEach(([y, x]) => (tmp[r + y][c + x] = 1));
          g.fillStyle = "rgba(255,255,255,.28)";
          for (let y = 0; y < N; y++) if (tmp[y].every((v) => v >= 0)) g.fillRect(0, y * cell, N * cell, cell);
          for (let x = 0; x < N; x++) if (tmp.every((row) => row[x] >= 0)) g.fillRect(x * cell, 0, cell, N * cell);
        }
        raf = requestAnimationFrame(paint);
      }
      function hudPaint() { scoreNum.textContent = S.score.toLocaleString(); linesNum.textContent = S.lines; comboNum.textContent = "x" + S.streak; }
      function roleText() {
        const a = ctx.player(S.active);
        roleBar.textContent = S.over ? "💥 Stuck!" : S.active === me ? (S.shared ? "🎯 Your turn — pick a piece (and think of your partner!)" : "🎯 Your turn — place one of YOUR pieces") : "⏳ " + (a ? a.name : "…") + " is placing…";
        board.classList.toggle("myturn", mine());
      }

      /* ---------- effects ---------- */
      const POPS = ["Nice!", "Boom!", "Sweet!", "Wow!", "Unreal!"];
      function explode(f) {
        const color = (id) => COLORS[id % COLORS.length];
        f.cleared.forEach(([y, x, id]) => fxp.burst((x + 0.5) * cell, (y + 0.5) * cell, { n: 7, colors: [color(id), "#fff"], size: cell * 0.28, speed: 260 + f.n * 50, life: 700, gravity: 600 }));
        f.rows.forEach((y) => fxp.beam(0, (y + 0.5) * cell, N * cell, (y + 0.5) * cell, { color: "#fff", width: cell * 0.9, life: 380 }));
        f.cols.forEach((x) => fxp.beam((x + 0.5) * cell, 0, (x + 0.5) * cell, N * cell, { color: "#fff", width: cell * 0.9, life: 380 }));
        fxp.ring(N * cell / 2, N * cell / 2, { r1: N * cell * 0.65, width: 8, color: "#9AF3FF", life: 520 });
        PP.fx.shake(board, 3 + f.n * 3, 400); sfx.clear(); popup(POPS[Math.min(POPS.length - 1, f.n - 1 + (f.streak > 1 ? 1 : 0))] + (f.streak > 1 ? " ×" + f.streak + " combo!" : ""), f.n > 1 ? "big" : "");
        if (f.n >= 2) PP.ui.confetti({ count: 50 + f.n * 20, y: 0.35 });
      }

      /* ---------- finishing ---------- */
      function finish(msg) {
        if (finished) return; finished = true; cancelAnimationFrame(raf);
        const sc = {}; roster.forEach((id) => (sc[id] = S.stats[id].cells + S.stats[id].lines * 10));
        setTimeout(() => { if (destroyed) return; mount(ctx.el, W.finale(ctx, { scores: sc, unit: " pts", emoji: "🧩", heading: msg || "What a fit!", sub: S.score.toLocaleString() + " points together · " + S.lines + " lines · best combo ×" + S.best })); }, msg ? 1300 : 0);
      }

      fit(); drawTrays(); hudPaint(); roleText(); raf = requestAnimationFrame(paint);
      window.__bb = { S };
      return {
        onEvent(ev) {
          if (ev.type === "done") return finish();
          const fx = S.apply(ev);
          fx.forEach((f) => {
            if (f.t === "place" && live(ev)) { sfx.lock(); if (f.by !== me) fxp.burst((f.c + 0.5) * cell, (f.r + 0.5) * cell, { n: 6, colors: [f.s.color, "#fff"], size: cell * 0.2, life: 500 }); }
            if (f.t === "clear" && live(ev)) explode(f);
            if (f.t === "relief" && live(ev)) { popup("Poof! 🫧 room made", "big"); sfx.pop(); }
            if (f.t === "over") { sfx.sad(); popup("Stuck! 😮", "big"); }
          });
          hudPaint(); roleText(); sel = null; drawTrays();
          if (S.over) finish("No more room! 🧩");
        },
        onPlayers: roleText,
        destroy() { destroyed = true; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); if (ghost) ghost.remove(); },
        onPause() {},
        debug: () => S,
      };
    },
  });
})();
