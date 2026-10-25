/* Candy March — a glossy match-3 you play together. Same four modes as Block Party:
 *   Two Halves (your half of a wide board) · Split Brain (one picks, one swipes) · Pass the Move · Friendly Race */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const { CandyBoard, SP, PAL } = PP.Candy;
  const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  const BASE = [220, 300, 380];                                    // points per move for ⭐ ⭐⭐ ⭐⭐⭐ (calibrated against a greedy bot)
  const RACE_MS = 180000;

  PP.registerGame({
    id: "candy-march", name: "Candy March", emoji: "🍬", color: "#FF8FD0",
    tagline: "Match-3 sweetness with a partner. Explosions included.",
    how: "Swap neighbouring candies to line up three or more. Match 4 for a striped candy, 5 for a colour bomb, an L or T for a wrapped candy — then watch the chain reactions. Pick a mode and go for three stars together!",
    min: 1, max: 4, tags: ["co-op", "match-3", "explosive"],
    options: [
      { id: "mode", label: "How do you want to play?", kind: "cards", def: "halves", choices: [
        { v: "halves", emoji: "🧩", label: "Two Halves, One Goal", desc: "A wide board, one half each. You can only swipe on your side — but the chain reactions don't care about the line!", min: 2, max: 2 },
        { v: "split", emoji: "🎭", label: "Split Brain", desc: "One of you picks the candy, the other chooses which way it swaps. Roles switch every few moves. Lots of “no, the OTHER one!”", min: 1, max: 4 },
        { v: "turns", emoji: "🔁", label: "Pass the Move", desc: "One shared board — take turns making a swap. Plan a combo for your partner. Or sabotage them. Lovingly.", min: 1, max: 4 },
        { v: "versus", emoji: "🏁", label: "Friendly Race", desc: "Everyone gets the same candies on their own board for 3 minutes. Peek at each other, send sparkles, no losers.", min: 1, max: 4 },
      ] },
      { id: "calm", label: "🫧 Calm mode", kind: "toggle", def: false, hint: "No move limit, no timer. Just match candies and chat. Wrap up whenever." },
      { id: "chaos", label: "🎪 Chaos candy", kind: "toggle", def: false, hint: "A 7th flavour joins, and striped party candies fall from the sky." },
    ],

    create(ctx) {
      const mode = ctx.settings.mode || "halves", calm = !!ctx.settings.calm, chaos = !!ctx.settings.chaos;
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, myIdx = Math.max(0, roster.indexOf(me));
      const Wc = mode === "halves" ? 12 : 8, Hc = mode === "halves" ? 9 : 8;
      const board = new CandyBoard({ w: Wc, h: Hc, rng: ctx.rng("cm"), types: chaos ? 7 : 6, party: chaos });
      const MOVES = mode === "halves" ? 30 : mode === "split" ? 24 : 24 + Math.max(0, n - 2) * 4;
      const mult = (mode === "halves" ? 1.25 : 1) * (chaos ? 1.15 : 1);
      const STARS = BASE.map((b) => Math.round((b * (calm ? 24 : MOVES) * mult) / 100) * 100);
      const S = { score: 0, used: 0, over: false, shuffled: false, picked: null, stats: {}, starsGot: 0, shown: 0, done: false };
      roster.forEach((id) => (S.stats[id] = { moves: 0, score: 0 }));
      const live = (ev) => ctx.live(ev);
      const cleanups = [];
      let destroyed = false, selected = null;

      /* ---------- layout ---------- */
      const moveNum = el("b.cm-num", mode === "versus" || calm ? "∞" : MOVES), moveBadge = el("div.cm-moves", el("span", mode === "versus" ? "TIME" : "MOVES"), moveNum);
      const scoreNum = el("b.cm-scorenum", "0"), fill = el("div.cm-fill"), bar = el("div.cm-bar", fill);
      const barMax = STARS[2] * 1.1;
      const starEls = STARS.map((v, i) => { const s = el("span.cm-star", { style: { left: (v / barMax) * 100 + "%" } }, "★"); bar.appendChild(s); return s; });
      const hud = el("div.cm-hud", moveBadge, el("div.cm-score", el("div.cm-scoreline", scoreNum, el("small", calm ? "sweetness" : "goal " + STARS[2].toLocaleString())), bar));
      const roleBar = el("div.tt-role");
      const host = el("div.cm-board"), boardWrap = el("div.cm-boardwrap", host);
      const tools = el("div.cm-tools");
      const root = el("div.cm", hud, roleBar, boardWrap, tools);
      mount(ctx.el, root);
      const view = new PP.Candy.View(host);
      const fit = () => {
        const availW = Math.min(ctx.el.clientWidth || innerWidth, 540) - 34, availH = Math.max(240, innerHeight - 450);
        const cell = Math.max(24, Math.min(58, Math.floor(Math.min(availW / Wc, availH / Hc))));
        view.resize(cell, Wc, Hc); view.sync(board);
      };
      view.sync(board); fit();
      window.addEventListener("resize", fit); cleanups.push(() => window.removeEventListener("resize", fit));
      if (mode === "halves") view.halves = roster.map((id, i) => ({ x0: i === 0 ? 0 : 6, x1: i === 0 ? 5 : 11, color: (ctx.player(id) || {}).color || "#fff", mine: id === me }));

      /* ---------- HUD ---------- */
      function paintHud() {
        scoreNum.textContent = Math.round(S.shown).toLocaleString();
        fill.style.width = Math.min(100, (S.shown / barMax) * 100) + "%";
        STARS.forEach((v, i) => { const on = S.shown >= v; if (on && !starEls[i].classList.contains("on")) { starEls[i].classList.add("on"); PP.fx.pulse(starEls[i], "pop", 700); if (S.starsGot <= i) { S.starsGot = i + 1; if (S.shown > 0 && S.live) { sfx.star(); PP.ui.confetti({ count: 70, y: 0.3 }); view.fx.text(Wc * view.cell / 2, Hc * view.cell * 0.5, "⭐ Star " + (i + 1) + "!", { color: "#FFE066", size: view.cell * 0.9, life: 1300 }); } } } });
        if (mode !== "versus" && !calm) { moveNum.textContent = Math.max(0, MOVES - S.used); moveBadge.classList.toggle("low", MOVES - S.used <= 5); }
      }
      view.onGain = (g) => { S.shown += g; S.live = true; paintHud(); };
      const sync = () => { view.sync(board); S.shown = S.score; S.live = false; paintHud(); };

      /* ---------- the swap pipeline ---------- */
      function play(steps, ev, after) {
        const target = S.score;
        if (live(ev)) { S.live = true; view.playSteps(steps, { after: () => { S.shown = target; paintHud(); checkEnd(); after && after(); } }); view.afterIdle(verify); }
        else { sync(); checkEnd(); after && after(); }
      }
      function verify() {
        if (view.pending > 0) return;                           // another move is still queued — the board is legitimately ahead of the sprites
        let bad = 0;
        board.grid.forEach((row, r) => row.forEach((x, c) => { const s = view.at(r, c); if (!x || !s || s.id !== x.id) bad++; }));
        if (bad) { window.__cm.mismatch += bad; view.sync(board); }
      }
      function doSwap(a, b, ev, who) {
        const r = board.swap(a, b);
        if (r.ok) { S.used++; S.score += r.gain; if (S.stats[who]) { S.stats[who].moves++; S.stats[who].score += r.gain; } if (!calm && S.used >= MOVES) S.over = true; }
        play(r.steps, ev);
        return r;
      }
      function checkEnd() {
        if (S.over && !S.done) { S.done = true; setTimeout(() => finish(), 900); }
      }

      /* ---------- finishing ---------- */
      function finish(race) {
        if (destroyed) return; S.done = true; clearTimeout(hintT);
        const stars = STARS.filter((v) => S.score >= v).length;
        const starRow = el("div.cm-bigstars", [0, 1, 2].map((i) => el("span" + (i < stars ? ".on" : ""), { style: { animationDelay: 0.35 * i + "s" } }, "★")));
        const scores = {}; roster.forEach((id) => (scores[id] = race ? race[id] : S.stats[id].score));
        const heads = ["Sugar crash! Round two? 🍬", "A tasty start! 🍭", "Sweet teamwork! 🍬", "Absolutely SCRUMPTIOUS! 🍭🎉"];
        if (stars >= 1) setTimeout(() => sfx.star(), 400);
        mount(ctx.el, race
          ? W.finale(ctx, { scores, unit: " pts", emoji: "🏁", heading: "Photo finish! 🏁", sub: "Same candies for everyone. Everybody gets a title." })
          : W.finale(ctx, { scores, unit: " pts", emoji: "🍬", heading: heads[stars], sub: S.score.toLocaleString() + " points together · " + stars + " of 3 stars", extra: starRow }));
      }

      /* ---------- hint, shuffle, wrap-up ---------- */
      let hintT = 0;
      const armHint = () => { clearTimeout(hintT); view.hintPair = null; if (S.done || destroyed) return; hintT = setTimeout(() => { if (canAct()) view.hintPair = board.hint(); }, 9000); };
      const showHint = () => { const m = board.hint(); if (!m) return; view.hintPair = m; sfx.pop(); setTimeout(() => (view.hintPair = null), 2600); };
      const canAct = () => !S.done && !S.over && !ctx.paused();
      const shuffleBtn = el("button.btn.btn-sm.btn-ghost", { onclick: () => { if (mode === "versus") { if (S.shuffled) return; S.shuffled = true; shuffleBtn.disabled = true; const st = board.shuffleNow(); view.playSteps([st], { after: () => view.sync(board) }); upd(0); } else if (!S.shuffled) ctx.send("shuffle", {}); } }, "🔀 Shuffle");
      const hintBtn = el("button.btn.btn-sm.btn-ghost", { onclick: showHint }, "💡 Hint");
      const wrapBtn = el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("done", {}) }, "🏁 Wrap up");
      tools.append(hintBtn, shuffleBtn, wrapBtn);

      let inst;
      let upd = () => {};                                         // race mode replaces this
      /* =====================================================================
       *  Two Halves
       * ===================================================================== */
      if (mode === "halves") {
        const half = {}; roster.forEach((id, i) => (half[id] = i === 0 ? [0, 5] : [6, 11]));
        const mine = half[me] || [0, 11], inMine = (c) => c >= mine[0] && c <= mine[1];
        const other = roster.find((id) => id !== me), op = other && ctx.player(other);
        roleBar.textContent = "🧩 Your half is the " + (myIdx === 0 ? "LEFT" : "RIGHT") + (op ? " — " + op.name + " has the other. Chain reactions cross the line!" : "");
        view.onTap = ([r, c]) => {
          if (!canAct()) return;
          if (!inMine(c)) { PP.ui.toast("That's your partner's side! 🙈", 1400); return; }
          if (!selected) { selected = [r, c]; view.sel = selected; sfx.tap(); return; }
          if (Math.abs(selected[0] - r) + Math.abs(selected[1] - c) === 1) { ctx.send("swap", { a: selected, b: [r, c] }); selected = null; view.sel = null; }
          else { selected = [r, c]; view.sel = selected; sfx.tap(); }
        };
        view.onSwipe = ([r, c], d) => { if (!canAct() || !inMine(c)) return; const dd = DIRS[d], b = [r + dd[0], c + dd[1]]; if (b[1] < 0 || b[1] >= Wc || b[0] < 0 || b[0] >= Hc || !inMine(b[1])) return; selected = null; view.sel = null; ctx.send("swap", { a: [r, c], b }); };
        inst = { onEvent(ev) {
          if (ev.type === "done") return finish(); if (ev.type === "shuffle") return doShuffle(ev);
          if (ev.type !== "swap" || S.over || !half[ev.f]) return;
          const { a, b } = ev.d, [x0, x1] = half[ev.f];
          if (!a || !b || a[1] < x0 || a[1] > x1 || b[1] < x0 || b[1] > x1) return;
          doSwap(a, b, ev, ev.f);
        } };
      }

      /* =====================================================================
       *  Split Brain
       * ===================================================================== */
      else if (mode === "split") {
        const pickers = () => { if (n < 2) return new Set(roster); const sw = Math.floor(S.used / 3) % 2; return new Set(roster.filter((_, i) => (i % 2 === 0) === (sw === 0))); };
        const role = (id) => (n < 2 ? "both" : pickers().has(id) ? "picker" : "director");
        const dpad = el("div.cm-dpad", [["U", "⬆️"], ["L", "⬅️"], ["R", "➡️"], ["D", "⬇️"]].map(([d, e]) => el("button.btn.btn-sm.cm-dir-" + d, { onclick: () => { if (canAct() && S.picked) ctx.send("dir", { d }); } }, e)));
        const paintRole = () => {
          const r = role(me), names = roster.filter((id) => id !== me).map((id) => (ctx.player(id) || {}).name).join(" & ");
          roleBar.textContent = r === "both" ? "🎮 Solo practice — tap a candy, then swipe or use the arrows" : r === "picker" ? "👆 You PICK the candy" + (names ? " — " + names + " chooses the direction" : "") : "🧭 You choose the DIRECTION" + (names ? " — " + names + " picks the candy" : "");
          dpad.classList.toggle("hide", r === "picker");
          dpad.classList.toggle("armed", !!S.picked);
        };
        paintRole(); tools.prepend(dpad);
        view.onTap = ([r, c]) => {
          if (!canAct()) return; const rl = role(me);
          if (rl === "director") { PP.ui.toast("You choose the direction — your partner picks the candy! 🧭", 1500); return; }
          if (rl === "both" && S.picked) { const a = S.picked; if (Math.abs(a[0] - r) + Math.abs(a[1] - c) === 1) { ctx.send("dir", { d: r < a[0] ? "U" : r > a[0] ? "D" : c < a[1] ? "L" : "R" }); return; } }
          ctx.send("pick", { r, c }); sfx.tap();
        };
        view.onSwipe = ([r, c], d) => { if (!canAct()) return; const rl = role(me); if (rl === "director") return; if (rl === "both") { ctx.send("pick", { r, c }); ctx.send("dir", { d }); } };
        inst = { onEvent(ev) {
          if (ev.type === "done") return finish(); if (ev.type === "shuffle") return doShuffle(ev);
          if (S.over) return;
          if (ev.type === "pick") {
            if (role(ev.f) === "director" || !roster.includes(ev.f)) return; const { r, c } = ev.d; if (!(r >= 0 && r < Hc && c >= 0 && c < Wc)) return;
            S.picked = [r, c]; view.sel = S.picked; if (live(ev)) sfx.tap(); paintRole();
          } else if (ev.type === "dir") {
            if (role(ev.f) === "picker" || !roster.includes(ev.f) || !S.picked) return; const dd = DIRS[ev.d.d]; if (!dd) return;
            const a = S.picked, b = [a[0] + dd[0], a[1] + dd[1]]; S.picked = null; view.sel = null;
            doSwap(a, b, ev, ev.f); paintRole();
          }
        } };
      }

      /* =====================================================================
       *  Pass the Move
       * ===================================================================== */
      else if (mode === "turns") {
        const active = () => roster[S.used % n];
        const paintTurn = () => { const a = ctx.player(active()); roleBar.textContent = active() === me ? "🎯 Your move — set up something sweet" : "⏳ " + (a ? a.name : "…") + " is thinking…"; boardWrap.classList.toggle("myturn", active() === me && !S.over); };
        paintTurn();
        const mineTurn = () => active() === me && canAct();
        view.onTap = ([r, c]) => {
          if (!canAct()) return; if (active() !== me) { PP.ui.toast("Not your turn yet! ✋", 1200); return; }
          if (!selected) { selected = [r, c]; view.sel = selected; sfx.tap(); return; }
          if (Math.abs(selected[0] - r) + Math.abs(selected[1] - c) === 1) { ctx.send("swap", { a: selected, b: [r, c] }); selected = null; view.sel = null; } else { selected = [r, c]; view.sel = selected; sfx.tap(); }
        };
        view.onSwipe = ([r, c], d) => { if (!mineTurn()) return; const dd = DIRS[d], b = [r + dd[0], c + dd[1]]; if (b[0] < 0 || b[0] >= Hc || b[1] < 0 || b[1] >= Wc) return; selected = null; view.sel = null; ctx.send("swap", { a: [r, c], b }); };
        inst = { onEvent(ev) {
          if (ev.type === "done") return finish(); if (ev.type === "shuffle") return doShuffle(ev);
          if (ev.type !== "swap" || S.over || ev.f !== active()) return;
          const r = doSwap(ev.d.a, ev.d.b, ev, ev.f); if (r.ok && live(ev)) sfx.ding();
          paintTurn();
        }, onPlayers: paintTurn };
      }

      /* =====================================================================
       *  Friendly Race
       * ===================================================================== */
      else {
        roleBar.textContent = n > 1 ? "🏁 Same candies for everyone — race to the sweetest score!" : "🎮 Solo practice";
        const results = {}; roster.forEach((id) => (results[id] = { score: 0, moves: 0, snap: null }));
        const peers = el("div.tt-peers"), peerCv = {}, peerLbl = {};
        roster.filter((id) => id !== me).forEach((id) => {
          const p = ctx.player(id), cv = el("canvas.tt-peer"), sc = el("b", "0"); peerCv[id] = cv; peerLbl[id] = sc;
          peers.appendChild(el("div.tt-peerbox", W.avatar(p, 22), el("span", p ? p.name : "?"), sc, cv)); drawSnap(cv, null);
        });
        root.appendChild(peers);
        function drawSnap(cv, snap) {
          const cs = 8, g = cv.getContext("2d"), dpr = window.devicePixelRatio || 1; cv.style.width = cv.style.height = cs * 8 + "px"; cv.width = cv.height = Math.round(cs * 8 * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.fillStyle = "#3B0A7A"; g.fillRect(0, 0, cs * 8, cs * 8); if (!snap) return;
          snap.forEach((row, r) => row.split(",").forEach((x, c) => { if (x === ".") return; if (x === "B") g.fillStyle = "#5A2D1A"; else { g.fillStyle = PAL[x.charCodeAt(0) - 97].mid; } g.beginPath(); g.arc(c * cs + cs / 2, r * cs + cs / 2, cs * 0.42, 0, 7); g.fill(); if (x.length > 1 || x === "B") { g.fillStyle = "#fff"; g.fillRect(c * cs + cs * 0.4, r * cs + cs * 0.4, cs * 0.2, cs * 0.2); } }));
        }
        const timer = calm ? null : W.timer(ctx, ctx.startT, RACE_MS, { onEnd: () => { if (ctx.isHost()) ctx.send("done", {}); else ctx.later(() => !S.done && ctx.send("done", {}), 3500); } });
        if (timer) root.insertBefore(timer.el, roleBar); moveBadge.querySelector("span").textContent = "PTS"; moveNum.textContent = "0";
        upd = function (n) { results[me] = { score: S.score, moves: S.used, snap: board.snapshot() }; ctx.send("upd", { score: S.score, moves: S.used, n, snap: board.snapshot() }); };
        const paintRace = () => { moveNum.textContent = Math.round(S.shown).toLocaleString(); };
        const tryMove = (a, b) => { if (!canAct()) return; const r = board.swap(a, b); if (r.ok) { S.used++; S.score += r.gain; upd(r.combo); } view.playSteps(r.steps, { after: () => { S.shown = S.score; paintHud(); paintRace(); } }); view.afterIdle(verify); armHint(); };
        view.onTap = ([r, c]) => { if (!canAct()) return; if (!selected) { selected = [r, c]; view.sel = selected; sfx.tap(); return; } if (Math.abs(selected[0] - r) + Math.abs(selected[1] - c) === 1) { const a = selected; selected = null; view.sel = null; tryMove(a, [r, c]); } else { selected = [r, c]; view.sel = selected; sfx.tap(); } };
        view.onSwipe = ([r, c], d) => { if (!canAct()) return; const dd = DIRS[d], b = [r + dd[0], c + dd[1]]; if (b[0] < 0 || b[0] >= Hc || b[1] < 0 || b[1] >= Wc) return; selected = null; view.sel = null; tryMove([r, c], b); };
        const og = view.onGain; view.onGain = (g) => { og(g); paintRace(); };
        window.__cmRace = { results, S };
        inst = { onEvent(ev) {
          if (ev.type === "upd") { const rs = results[ev.f]; if (!rs) return; Object.assign(rs, { score: ev.d.score, moves: ev.d.moves, snap: ev.d.snap }); if (ev.f !== me && peerCv[ev.f]) { drawSnap(peerCv[ev.f], ev.d.snap); peerLbl[ev.f].textContent = ev.d.score.toLocaleString(); if (ev.d.n >= 3 && live(ev)) { PP.ui.floatEmoji("✨", ((ctx.player(ev.f) || {}).name || "?") + " is on fire!", (ctx.player(ev.f) || {}).color); sfx.ding(); } } }
          else if (ev.type === "done") { const sc = {}; roster.forEach((id) => (sc[id] = results[id].score)); finish(sc); }
        } };
        shuffleBtn.disabled = false;
      }

      function doShuffle(ev) {
        if (S.shuffled || S.over) return; S.shuffled = true; shuffleBtn.disabled = true;
        const st = board.shuffleNow(); if (live(ev)) view.playSteps([st], { after: () => view.sync(board) }); else sync();
      }
      armHint();
      window.__cm = { board, view, S, mismatch: 0, STARS, mode };
      return {
        onEvent(ev) { armHint(); inst.onEvent && inst.onEvent(ev); paintHud(); },
        onPlayers() { inst.onPlayers && inst.onPlayers(); },
        destroy() { destroyed = true; clearTimeout(hintT); view.destroy(); cleanups.forEach((f) => f()); },
        onPause() {},
      };
    },
  });
})();
