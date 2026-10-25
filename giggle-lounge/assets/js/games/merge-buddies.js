/* Merge Buddies — 2048 for two. Slide tiles, merge equal numbers, reach 2048 together.
 * "Take turns": alternate swipes.  "Split Brain": one of you only controls ⬅️➡️, the other only ⬆️⬇️ — and you hope
 * your partner swipes the way you're thinking. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const SIZE = 4, VEC = { L: [0, -1], R: [0, 1], U: [-1, 0], D: [1, 0] };
  const TILE = { 2: ["#FFD1E8", "#FF7AB8"], 4: ["#FFE0A8", "#FFA93D"], 8: ["#FFF3A0", "#FFD21E"], 16: ["#C6FFD4", "#35D86A"], 32: ["#B8FFF2", "#19D3C5"], 64: ["#C4E4FF", "#3EA8FF"], 128: ["#E6D2FF", "#A66CFF"],
    256: ["#FFC2E8", "#E83EA8"], 512: ["#FFC2C2", "#FF4D6D"], 1024: ["#FFE29A", "#F59E0B"], 2048: ["#FFF6B8", "#FFC400"] };

  /* ---------- reducer ---------- */
  class Merge {
    constructor(o) {
      this.o = o; this.rng = o.rng; this.nid = 1; this.score = 0; this.moves = 0; this.best = 2; this.over = false; this.won = false;
      this.grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null)); this.stats = {}; o.roster.forEach((id) => (this.stats[id] = { moves: 0, points: 0 }));
      this.spawn(); this.spawn();
    }
    spawn() {
      const free = []; for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!this.grid[r][c]) free.push([r, c]);
      if (!free.length) return null;
      const [r, c] = this.rng.pick(free), t = { id: this.nid++, v: this.rng.chance(0.9) ? 2 : 4 }; this.grid[r][c] = t; return { r, c, id: t.id, v: t.v };
    }
    /* what may this player do? */
    allowed(id, d) {
      const R = this.o.roster; if (R.length < 2) return true;
      if (this.o.mode === "split") { const i = R.indexOf(id); return i >= 0 && (i % 2 === 0 ? d === "L" || d === "R" : d === "U" || d === "D"); }
      return id === R[this.moves % R.length];
    }
    line(dir, i) { const out = []; for (let k = 0; k < SIZE; k++) out.push(dir === "L" ? [i, k] : dir === "R" ? [i, SIZE - 1 - k] : dir === "U" ? [k, i] : [SIZE - 1 - k, i]); return out; }
    apply(ev) {
      const fx = [];
      if (this.over || ev.type !== "move" || !VEC[ev.d.d] || !this.allowed(ev.f, ev.d.d)) return fx;
      const dir = ev.d.d, moves = [], merges = []; let gain = 0, moved = false;
      for (let i = 0; i < SIZE; i++) {
        const pos = this.line(dir, i), tiles = pos.map(([r, c]) => ({ t: this.grid[r][c], r, c })).filter((x) => x.t), out = [];
        for (const x of tiles) { const last = out[out.length - 1]; if (last && !last.merged && last.t.v === x.t.v) { last.merged = x.t; last.v = x.t.v * 2; } else out.push({ t: x.t, from: [x.r, x.c], v: x.t.v }); }
        pos.forEach(([r, c]) => (this.grid[r][c] = null));
        out.forEach((o, k) => {
          const [r, c] = pos[k];
          if (o.merged) { const nt = { id: this.nid++, v: o.v }; this.grid[r][c] = nt; moves.push({ id: o.t.id, to: [r, c] }, { id: o.merged.id, to: [r, c] }); merges.push({ id: nt.id, v: o.v, r, c }); gain += o.v; moved = true; this.best = Math.max(this.best, o.v); if (o.v === 2048 && !this.won) { this.won = true; fx.push({ t: "win" }); } }
          else { this.grid[r][c] = o.t; if (o.from[0] !== r || o.from[1] !== c) { moves.push({ id: o.t.id, to: [r, c] }); moved = true; } }
        });
      }
      if (!moved) return fx;
      const born = this.spawn(); this.score += gain; this.moves++; this.stats[ev.f].moves++; this.stats[ev.f].points += gain;
      fx.push({ t: "move", dir, moves, merges, born, gain, by: ev.f });
      if (!this.canMove()) { if (this.o.calm) { this.relieve(); fx.push({ t: "relief" }); } else { this.over = true; fx.push({ t: "over" }); } }
      return fx;
    }
    canMove() {
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) { const t = this.grid[r][c]; if (!t) return true; if (c + 1 < SIZE && this.grid[r][c + 1] && this.grid[r][c + 1].v === t.v) return true; if (r + 1 < SIZE && this.grid[r + 1][c] && this.grid[r + 1][c].v === t.v) return true; }
      return false;
    }
    relieve() { const all = []; this.grid.forEach((row, r) => row.forEach((t, c) => t && all.push([t.v, r, c]))); all.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).slice(0, 6).forEach(([, r, c]) => (this.grid[r][c] = null)); }
  }
  PP.MergeBuddies = { Merge };

  PP.registerGame({
    id: "merge-buddies", name: "Merge Buddies", emoji: "🔢", color: "#FFC857",
    tagline: "2048, together. In Split Brain you only control half the swipes!",
    how: "Slide all the tiles; equal numbers merge into bigger ones. Reach 2048 together! In Split Brain, one of you controls ⬅️ ➡️ and the other ⬆️ ⬇️ — so you really have to be thinking the same thing.",
    min: 1, max: 4, tags: ["trust", "puzzle", "swipe"],
    options: [
      { id: "mode", label: "How do you want to play?", kind: "cards", def: "split", choices: [
        { v: "split", emoji: "🎭", label: "Split Brain", desc: "One of you only swipes ⬅️ ➡️, the other only ⬆️ ⬇️. No turns — just trust (or chaos).", min: 2, max: 4 },
        { v: "turns", emoji: "🔁", label: "Take turns", desc: "Swap swipes. Plan a combo for your partner — or accidentally ruin it.", min: 1, max: 4 },
      ] },
      { id: "calm", label: "🫧 Calm mode", kind: "toggle", def: false, hint: "No game over. If the board jams, a few small tiles quietly disappear." },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, mode = ctx.settings.mode === "turns" || n < 2 ? "turns" : "split";
      const S = new Merge({ roster, mode, calm: !!ctx.settings.calm, rng: ctx.rng("m2048") });
      let finished = false, destroyed = false; const live = (ev) => ctx.live(ev), cleanups = [];

      const scoreNum = el("b.tt-v", "0"), bestNum = el("b.tt-v", "2"), movesNum = el("b.tt-v", "0");
      const hud = el("div.bb-hud", el("div.tt-stat", el("span", "Score"), scoreNum), el("div.tt-stat", el("span", "Best tile"), bestNum), el("div.tt-stat", el("span", "Swipes"), movesNum));
      const roleBar = el("div.tt-role"), pop = el("div.tt-poplayer");
      const bg = el("div.mb-bg"); for (let i = 0; i < SIZE * SIZE; i++) bg.appendChild(el("i"));
      const tilesLayer = el("div.mb-tiles"), boardEl = el("div.mb-board", bg, tilesLayer, pop);
      const pad = el("div.mb-pad", ["U", "L", "D", "R"].map((d) => el("button.btn.btn-sm.mb-" + d, { onclick: () => send(d) }, { U: "⬆️", L: "⬅️", D: "⬇️", R: "➡️" }[d])));
      const root = el("div.tt.mb", hud, roleBar, boardEl, pad, el("div.cm-tools", el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("done", {}) }, "🏁 Wrap up")));
      mount(ctx.el, root);
      let px = 80; const els = new Map();
      const fit = () => { const wdt = Math.min(ctx.el.clientWidth || innerWidth, 460) - 28; px = Math.floor(Math.min(wdt, Math.max(240, innerHeight - 520)) / SIZE) * SIZE; boardEl.style.width = boardEl.style.height = px + "px"; boardEl.style.setProperty("--g", Math.round(px / 50) + "px"); place(); };
      const cellPx = () => (px - parseInt(boardEl.style.getPropertyValue("--g")) * (SIZE + 1)) / SIZE;
      const posOf = (r, c) => { const g = parseInt(boardEl.style.getPropertyValue("--g")), cs = cellPx(); return [g + c * (cs + g), g + r * (cs + g)]; };
      function paintTile(node, v) { const [hi, lo] = TILE[Math.min(2048, v)] || TILE[2048]; node.style.background = "linear-gradient(180deg," + hi + "," + lo + ")"; node.style.boxShadow = "0 4px 0 " + PP.Tetris.shade(lo, -0.35) + ", inset 0 3px 0 rgba(255,255,255,.65)"; node.textContent = v; node.style.fontSize = (v >= 1024 ? 0.34 : v >= 128 ? 0.4 : 0.5) * cellPx() + "px"; }
      function place() { const cs = cellPx(); S.grid.forEach((row, r) => row.forEach((t, c) => { if (!t) return; let node = els.get(t.id); if (!node) { node = el("div.mb-tile"); els.set(t.id, node); tilesLayer.appendChild(node); } const [x, y] = posOf(r, c); node.style.width = node.style.height = cs + "px"; node.style.transform = "translate(" + x + "px," + y + "px)"; paintTile(node, t.v); })); }
      function rebuild() { tilesLayer.textContent = ""; els.clear(); place(); }
      function popup(text, cls) { const p = el("div.tt-pop" + (cls ? "." + cls : ""), text); pop.appendChild(p); setTimeout(() => p.remove(), 1500); }

      const canDo = (d) => !finished && !S.over && !ctx.paused() && S.allowed(me, d);
      function send(d) { if (canDo(d)) ctx.send("move", { d }); else if (!S.over && !finished) { PP.ui.toast(mode === "split" ? "That swipe belongs to your partner! 🙈" : "Not your turn ✋", 1100); } }
      /* swipe + keys */
      let sw = null;
      boardEl.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY }; });
      boardEl.addEventListener("pointerup", (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return; send(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U"); });
      const key = (e) => { const d = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D" }[e.key]; if (d && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); send(d); } };
      window.addEventListener("keydown", key); cleanups.push(() => window.removeEventListener("keydown", key));
      window.addEventListener("resize", fit); cleanups.push(() => window.removeEventListener("resize", fit));

      function hudPaint() {
        scoreNum.textContent = S.score.toLocaleString(); bestNum.textContent = S.best; movesNum.textContent = S.moves;
        const a = ctx.player(S.o.roster[S.moves % n]), r = (id) => { const i = roster.indexOf(id); return i % 2 === 0 ? "⬅️➡️" : "⬆️⬇️"; };
        roleBar.textContent = S.over ? "💥 Jammed!" : mode === "split" && n > 1 ? "🎭 You control " + r(me) + " — " + (roster.filter((x) => x !== me).map((x) => (ctx.player(x) || {}).name + " " + r(x)).join(", ")) : S.o.roster[S.moves % n] === me ? "🎯 Your swipe" : "⏳ " + (a ? a.name : "…") + "'s swipe";
        ["U", "L", "D", "R"].forEach((d) => { const b = pad.querySelector(".mb-" + d); b.classList.toggle("hide", !(n < 2 || mode === "turns" || S.allowed(me, d))); b.disabled = !canDo(d); });
        boardEl.classList.toggle("myturn", mode === "turns" && S.o.roster[S.moves % n] === me && !S.over);
      }
      function finish(msg) { if (finished) return; finished = true; const sc = {}; roster.forEach((id) => (sc[id] = S.stats[id].points)); setTimeout(() => { if (!destroyed) mount(ctx.el, W.finale(ctx, { scores: sc, unit: " pts", emoji: "🔢", heading: msg || "What a merge!", sub: S.score.toLocaleString() + " points · best tile " + S.best + " · " + S.moves + " swipes" })); }, msg ? 1200 : 0); }

      fit(); hudPaint();
      window.__mb = { S };
      return {
        onEvent(ev) {
          if (ev.type === "done") return finish();
          const fx = S.apply(ev);
          fx.forEach((f) => {
            if (f.t === "move") {
              if (!live(ev)) return;
              const cs = cellPx();
              f.moves.forEach((m) => { const node = els.get(m.id); if (node) { const [x, y] = posOf(m.to[0], m.to[1]); node.style.transform = "translate(" + x + "px," + y + "px)"; } });
              sfx.swap();
              setTimeout(() => {
                if (destroyed) return;
                f.moves.forEach((m) => { if (f.merges.some((g) => g.r === m.to[0] && g.c === m.to[1])) { const node = els.get(m.id); if (node) { node.remove(); els.delete(m.id); } } });
                f.merges.forEach((g) => { const node = el("div.mb-tile.merged"); els.set(g.id, node); tilesLayer.appendChild(node); const [x, y] = posOf(g.r, g.c); node.style.width = node.style.height = cs + "px"; node.style.transform = "translate(" + x + "px," + y + "px)"; paintTile(node, g.v); sfx.combo(Math.min(8, Math.log2(g.v))); if (g.v >= 128) PP.ui.confetti({ count: Math.min(120, g.v / 8), y: 0.4 }); if (g.v >= 64) popup(g.v + "!", "big"); });
                if (f.born) { const node = el("div.mb-tile.born"); els.set(f.born.id, node); tilesLayer.appendChild(node); const [x, y] = posOf(f.born.r, f.born.c); node.style.width = node.style.height = cs + "px"; node.style.transform = "translate(" + x + "px," + y + "px)"; paintTile(node, f.born.v); }
                if (f.gain) PP.fx.shake(boardEl, Math.min(6, 1 + f.gain / 64), 260);
              }, 120);
            }
            if (f.t === "win" && live(ev)) { popup("2048! 🎉", "big"); sfx.tada(); PP.ui.confetti({ count: 200 }); }
            if (f.t === "relief" && live(ev)) { popup("Poof! 🫧", "big"); rebuild(); }
            if (f.t === "over") sfx.sad();
          });
          if (!live(ev) && fx.length) rebuild();
          hudPaint();
          if (S.over) finish("Jammed! 🔢");
        },
        onPlayers: hudPaint, onPause: hudPaint,
        destroy() { destroyed = true; cleanups.forEach((f) => f()); },
        debug: () => S,
      };
    },
  });
})();
