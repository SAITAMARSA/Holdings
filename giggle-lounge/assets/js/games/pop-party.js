/* Pop Party — tap groups of matching blobs to pop them. Bigger groups = way more points.
 * Turns: swap pops (plan for your partner!). Race: everyone pops at once on the same board; it's a team score. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const COLS = 8, ROWS = 10, KINDS = 5, FACES = ["#FF5C8A", "#FFC83D", "#35D86A", "#3EA8FF", "#A66CFF"], EMO = ["🍓", "🍋", "🍏", "🫐", "🍇"];

  class Pop {
    constructor(rng, roster, mode) {
      this.roster = roster; this.mode = mode; this.score = 0; this.pops = 0; this.stats = {}; roster.forEach((id) => (this.stats[id] = 0));
      this.g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => rng.int(KINDS)));
    }
    group(r, c) {
      const k = this.g[r][c]; if (k == null) return [];
      const seen = new Set([r * COLS + c]), q = [[r, c]], out = [];
      while (q.length) { const [y, x] = q.pop(); out.push([y, x]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dy, dx]) => { const ny = y + dy, nx = x + dx; if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !seen.has(ny * COLS + nx) && this.g[ny][nx] === k) { seen.add(ny * COLS + nx); q.push([ny, nx]); } }); }
      return out;
    }
    turnOf() { return this.roster[this.pops % this.roster.length]; }
    pop(id, r, c) {
      if (this.mode === "turns" && id !== this.turnOf()) return null;
      const grp = this.group(r, c); if (grp.length < 2) return null;
      grp.forEach(([y, x]) => (this.g[y][x] = null));
      for (let x = 0; x < COLS; x++) { const col = []; for (let y = ROWS - 1; y >= 0; y--) if (this.g[y][x] != null) col.push(this.g[y][x]); for (let y = ROWS - 1, i = 0; y >= 0; y--, i++) this.g[y][x] = i < col.length ? col[i] : null; }
      const cols = []; for (let x = 0; x < COLS; x++) if (this.g[ROWS - 1][x] != null) cols.push(x);
      const nextG = Array.from({ length: ROWS }, () => new Array(COLS).fill(null)); cols.forEach((sx, i) => { for (let y = 0; y < ROWS; y++) nextG[y][i] = this.g[y][sx]; }); this.g = nextG;
      const pts = grp.length * (grp.length - 1); this.score += pts; this.pops++; this.stats[id] += pts;
      const left = this.g.flat().filter((v) => v != null).length;
      return { n: grp.length, pts, cells: grp, left, over: !this.canMove(), cleared: left === 0 };
    }
    canMove() { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.g[r][c] != null && this.group(r, c).length >= 2) return true; return false; }
  }
  PP.PopParty = { Pop };

  PP.registerGame({
    id: "pop-party", name: "Pop Party", emoji: "🍓", color: "#FF8FB1",
    tagline: "Pop the fruity blobs. Plan big combos — for your partner to wreck.",
    how: "Tap a group of 2+ matching fruits to pop them. Bigger groups score way more. Take turns (setting each other up or accidentally ruining it!) or race on the same board together.",
    min: 1, max: 4, tags: ["trust", "puzzle", "swap-turns"],
    options: [{ id: "mode", label: "How do you want to play?", kind: "cards", def: "turns", choices: [
      { v: "turns", emoji: "🔁", label: "Take turns", desc: "One pop each. Strategise out loud — or stay silent and hope.", min: 1, max: 4 },
      { v: "race", emoji: "⚡", label: "Together", desc: "Anyone can pop any time on the same board. Team score.", min: 1, max: 4 },
    ] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, mode = ctx.settings.mode === "race" || n < 2 ? "race" : "turns";
      const S = new Pop(ctx.rng("pop"), roster, mode);
      let over = false, destroyed = false;
      const scoreNum = el("b.tt-v", "0"), popsNum = el("b.tt-v", "0");
      const info = el("div.tt-role"), board = el("div.pp-board"), pop = el("div.tt-poplayer");
      const root = el("div.tt.pp", el("div.bb-hud", el("div.tt-stat", el("span", "Score"), scoreNum), el("div.tt-stat", el("span", "Pops"), popsNum)), info, el("div.pp-wrap", board, pop), el("div.cm-tools", el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("done", {}) }, "🏁 Wrap up")));
      mount(ctx.el, root);
      let hover = [];
      function paint() {
        board.textContent = "";
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const k = S.g[r][c], b = el("button.pp-c" + (k == null ? ".empty" : ""), { type: "button", "data-r": r, "data-c": c, onclick: () => tap(r, c) }, k == null ? "" : EMO[k]);
          if (k != null) b.style.setProperty("--c", FACES[k]);
          board.appendChild(b);
        }
        scoreNum.textContent = S.score.toLocaleString(); popsNum.textContent = S.pops;
        const t = S.turnOf();
        info.textContent = over ? "🎉 Board done!" : mode === "race" ? "⚡ Everyone pops!" : t === me ? "🎯 Your pop" : "⏳ " + ((ctx.player(t) || {}).name || "…") + "'s pop";
        board.classList.toggle("myturn", mode === "race" || t === me);
      }
      function tap(r, c) {
        if (over || ctx.paused()) return;
        if (mode === "turns" && S.turnOf() !== me) { PP.ui.toast("Not your turn ✋", 900); return; }
        if (S.group(r, c).length < 2) { sfx.sad(); PP.ui.toast("Needs 2+ touching 🍓", 900); return; }
        ctx.send("pop", { r, c });
      }
      function finish() {
        if (over) return; over = true;
        setTimeout(() => { if (!destroyed) mount(ctx.el, W.finale(ctx, { scores: S.stats, unit: " pts", emoji: "🍓", heading: S.score > 400 ? "Pop-tastic!" : "Nicely popped!", sub: S.score.toLocaleString() + " points as a team · " + S.pops + " pops" })); }, 1200);
      }
      paint();
      window.__pp = { S };
      return {
        onEvent(ev) {
          if (over) return;
          if (ev.type === "done") return finish();
          if (ev.type !== "pop") return;
          const d = ev.d || {}; if (!(d.r >= 0 && d.r < ROWS && d.c >= 0 && d.c < COLS)) return;
          const res = S.pop(ev.f, d.r, d.c); if (!res) return;
          if (ctx.live(ev)) { sfx.combo(Math.min(8, res.n - 1)); if (res.n >= 6) { PP.ui.confetti({ count: res.n * 8, y: 0.4 }); const p = el("div.tt-pop.big", "+" + res.pts); pop.appendChild(p); setTimeout(() => p.remove(), 1500); } }
          paint();
          if (res.cleared || res.over) { if (res.cleared) S.score += 200; paint(); finish(); }
        },
        onPlayers: paint, onPause: paint,
        destroy() { destroyed = true; },
        debug: () => S,
      };
    },
  });
})();
