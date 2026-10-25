/* Block Party — Tetris for two (or more), four ways. UI + local steering; logic lives in tetris-core.js */
(function () {
  "use strict";
  const PP = window.PP, T = PP.Tetris, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;

  const POP = {
    1: ["Nice!", "Smooth!", "Tidy!", "Ooh!"],
    2: ["Double trouble!", "Two-fer!", "Doubly nice!"],
    3: ["Triple whammy!", "Hat trick!"],
    4: ["BLOCK PARTY!! 🎆", "FOUR! Unhinged!"],
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  PP.registerGame({
    id: "block-party", name: "Block Party", emoji: "🧱", color: "#FF8A8A",
    tagline: "Falling blocks, but you're a team. Four ways to play.",
    how: "Stack falling blocks and clear lines — together. Pick a mode below. It's built for teamwork and talking nonsense.",
    min: 1, max: 4, tags: ["co-op", "silly", "relaxing"],
    options: [
      { id: "mode", label: "How do you want to play?", kind: "cards", def: "halves", choices: [
        { v: "halves", emoji: "🧩", label: "Two Halves, One Goal", desc: "Each of you owns half a wide board. A row only clears when BOTH halves are full — so you build for each other.", min: 2, max: 2 },
        { v: "split", emoji: "🎭", label: "Split Brain", desc: "One piece, two brains. One of you steers left & right, the other spins & drops. You swap jobs every few pieces!", min: 1, max: 4 },
        { v: "turns", emoji: "🔁", label: "Pass the Piece", desc: "One shared board. Take turns placing a piece — no rush, lots of “wait, NOT there!”", min: 1, max: 4 },
        { v: "versus", emoji: "🏁", label: "Friendly Race", desc: "Everyone gets the same pieces on their own board for 3 minutes. Peek at each other, send sprinkles, no losers.", min: 1, max: 4 },
      ] },
      { id: "speed", label: "Speed", kind: "choice", def: "normal", choices: [{ v: "chill", label: "🐢 Chill" }, { v: "normal", label: "🚶 Normal" }, { v: "zippy", label: "🐇 Zippy" }] },
      { id: "calm", label: "🫧 Calm mode", kind: "toggle", def: false, hint: "No game over. When the stack gets tall it gently pops to make room. Just stack and chat." },
      { id: "chaos", label: "🎪 Chaos pieces", kind: "toggle", def: false, hint: "Surprise dots, pluses and extra-chunky blocks crash the party." },
    ],

    create(ctx) {
      const mode = ctx.settings.mode || "halves";
      const speed = ctx.settings.speed || "normal", calm = !!ctx.settings.calm, chaos = !!ctx.settings.chaos;
      const roster = ctx.rosterIds, me = ctx.me.id, myIdx = Math.max(0, roster.indexOf(me));
      const live = (ev) => ctx.now() - ev.t < 4000;                     // false while replaying history
      const cleanups = [];
      let finished = false, raf = 0, destroyed = false;

      /* ---------- layout ---------- */
      const Wc = mode === "halves" ? 12 : 10, Hc = 20;
      const canvas = el("canvas.tt-canvas"), popLayer = el("div.tt-poplayer");
      const board = el("div.tt-board", canvas, popLayer);
      const panel = el("div.tt-panel"), roleBar = el("div.tt-role"), controls = el("div.tt-controls");
      const root = el("div.tt", roleBar, el("div.tt-main", board, panel), controls);
      mount(ctx.el, root);
      const view = new T.BoardView(canvas);
      const fit = () => {
        const wrapW = Math.min(ctx.el.clientWidth || innerWidth, 640), panelW = 118;
        const availW = wrapW - panelW - 14, availH = Math.max(300, innerHeight - 350);
        const cell = Math.max(13, Math.min(34, Math.floor(Math.min(availW / Wc, availH / Hc))));
        view.resize(cell, Wc, Hc);
      };
      fit();
      window.addEventListener("resize", fit); cleanups.push(() => window.removeEventListener("resize", fit));

      const stat = (label) => { const v = el("b.tt-v", "0"); return { box: el("div.tt-stat", el("span", label), v), set: (x) => { v.textContent = x; } }; };
      const sScore = stat("Score"), sLines = stat("Lines"), sLevel = stat("Level");
      const nextCv = el("canvas.tt-next");
      const nextBox = el("div.tt-stat", el("span", "Next"), nextCv);
      const wrapBtn = el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("done", {}) }, "🏁 Wrap up");
      panel.append(nextBox, sScore.box, sLines.box, sLevel.box);

      function popup(text, cls) {
        const p = el("div.tt-pop" + (cls ? "." + cls : ""), text);
        popLayer.appendChild(p); setTimeout(() => p.remove(), 1500);
      }
      function fxLive(fx, ev) {
        fx.forEach((f) => {
          if (f.t === "lock") sfx.lock();
          else if (f.t === "clear") {
            sfx.clear(); popup(pick(POP[Math.min(4, f.n)]) + (mode !== "versus" && roster.length > 1 ? " 🙌" : ""));
            if (f.n >= 3) PP.ui.confetti({ count: 60, y: 0.4 });
          } else if (f.t === "swap") { sfx.whoosh(); popup("SWITCH JOBS! 🔄", "big"); }
          else if (f.t === "relief") { sfx.pop(); popup("Poof! 🫧 more room", "big"); }
          else if (f.t === "over") sfx.sad();
        });
      }

      /* ---------- input: keyboard + touch, with hold-to-repeat ---------- */
      const act = {};       // left,right,rot,down,hard → fn
      const allowed = { left: true, right: true, rot: true, down: true, hard: true };
      const btns = {};
      function attach(b, name, repeat) {
        let t1, t2;
        const stop = () => { clearTimeout(t1); clearInterval(t2); };
        b.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (!allowed[name] || finished) return;
          act[name] && act[name]();
          if (repeat) t1 = setTimeout(() => { t2 = setInterval(() => act[name] && allowed[name] && act[name](), 75); }, 230);
        });
        ["pointerup", "pointerleave", "pointercancel"].forEach((n) => b.addEventListener(n, stop));
        cleanups.push(stop);
      }
      const mk = (name, label, aria, repeat) => { const b = el("button.ctl.ctl-" + name, { type: "button", "aria-label": aria }, label); btns[name] = b; attach(b, name, repeat); return b; };
      controls.append(
        el("div.ctl-group", mk("left", "◀", "left", true), mk("right", "▶", "right", true), mk("down", "▼", "soft drop", true)),
        el("div.ctl-group", mk("rot", "⟳", "rotate"), mk("hard", "⤓", "drop")));
      function setAllowed(names) {
        Object.keys(allowed).forEach((k) => { allowed[k] = names.includes(k); btns[k].classList.toggle("hide", !allowed[k]); });
      }
      const KEYS = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowDown: "down", s: "down", ArrowUp: "rot", w: "rot", x: "rot", " ": "hard" };
      function onKey(e) {
        if (finished || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) return;
        const name = KEYS[e.key];
        if (!name) return;
        e.preventDefault();
        if (allowed[name] && act[name]) act[name]();
      }
      window.addEventListener("keydown", onKey); cleanups.push(() => window.removeEventListener("keydown", onKey));

      /* ---------- shared finish ---------- */
      function finish(S, opts) {
        if (finished) return; finished = true;
        cancelAnimationFrame(raf);
        const go = () => {
          if (destroyed) return;
          const scores = {}; roster.forEach((id) => { scores[id] = opts.scores ? opts.scores[id] : (S.stats[id] || {}).pieces || 0; });
          mount(ctx.el, W.finale(ctx, { emoji: opts.emoji || "🧱", heading: opts.heading, sub: opts.sub, scores, unit: opts.unit || " pieces", noScores: opts.noScores }));
        };
        opts.delay ? setTimeout(go, opts.delay) : go();
      }
      const coopSub = (S) => S.lines + " lines · " + S.score + " points · level " + S.level;

      const base = { destroy() { destroyed = true; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); }, onPause() {}, onPlayers() {} };
      let inst;
      if (mode === "split") inst = runSplit();
      else if (mode === "turns") inst = runTurns();
      else if (mode === "versus") inst = runVersus();
      else inst = runHalves();
      return Object.assign(base, inst);

      /* =====================================================================
       *  MODE: Split Brain
       * ===================================================================== */
      function runSplit() {
        const S = new T.Split({ rng: ctx.rng("bag"), roster, chaos, calm, speed });
        let lastTick = ctx.now(), myRole = null;
        const roleText = () => {
          const r = S.role(me);
          const others = roster.filter((id) => id !== me).map((id) => (ctx.player(id) || {}).name).filter(Boolean).join(" & ");
          if (r === "both") return "🎮 Solo practice — you do it all";
          return r === "mover" ? "🎭 You STEER ◀ ▶ — " + (others || "partner") + " spins & drops" : "🎭 You SPIN ⟳ & DROP ⤓ — " + (others || "partner") + " steers";
        };
        const applyRole = () => {
          const r = S.role(me);
          if (r !== myRole) { myRole = r; setAllowed(r === "both" ? ["left", "right", "rot", "down", "hard"] : r === "mover" ? ["left", "right", "down"] : ["rot", "hard"]); }
          roleBar.textContent = roleText(); roleBar.classList.toggle("flip", false);
        };
        ["left", "right", "down", "rot", "hard"].forEach((n, i) => { act[n] = () => ctx.send("in", { a: ["L", "R", "S", "ROT", "DROP"][i] }); });
        panel.append(wrapBtn);
        applyRole();
        ctx.interval(() => { if (!finished && !S.over && ctx.isHost() && ctx.now() - lastTick >= S.tick) { lastTick = ctx.now(); ctx.send("tick", {}); } }, 100);
        const paint = () => {
          sScore.set(S.score); sLines.set(S.lines); sLevel.set(S.level);
          T.drawMini(nextCv, S.nextK, 62);
          view.draw(S.board, { piece: S.cur, ghost: ghostOf() });
          raf = requestAnimationFrame(paint);
        };
        const ghostOf = () => { let y = S.cur.y; const c = T.cellsOf(S.cur.k, S.cur.r); while (!S.board.collides(c, S.cur.x, y + 1, S.B)) y++; return y; };
        raf = requestAnimationFrame(paint);
        window.__tt = { S, mode };
        return {
          onEvent(ev) {
            if (ev.type === "done") return finish(S, { heading: "What a team! 🎭", sub: coopSub(S) });
            const before = S.pieces;
            const fx = S.apply(ev);
            if (live(ev)) fxLive(fx, ev);
            applyRole();
            if (S.over) finish(S, { heading: "The stack won this one! 🙈", sub: coopSub(S), emoji: "🫠", delay: 1600 });
          },
        };
      }

      /* =====================================================================
       *  MODE: Pass the Piece
       * ===================================================================== */
      function runTurns() {
        const S = new T.Turns({ rng: ctx.rng("bag"), roster, chaos, calm, speed });
        const F = new T.Faller((c, x, y) => S.board.collides(c, x, y, S.B), S.B);
        let theirs = null, turnStart = ctx.now(), lastMv = 0, lastT = -1, placing = false;
        const mine = () => S.active === me && !S.over && !finished;
        const sendMv = () => { if (F.p && Date.now() - lastMv > 90) { lastMv = Date.now(); ctx.sendEph("mv", { t: S.t, k: F.p.k, r: F.p.r, x: F.p.x, y: F.p.y }, "mv"); } };
        const beginTurn = () => {
          placing = false; turnStart = ctx.now();
          if (mine()) { F.spawn(S.curK); setAllowed(["left", "right", "rot", "down", "hard"]); sfx.ding(); popup("Your turn! 🎯", "big"); sendMv(); }
          else { F.p = null; setAllowed([]); }
          const a = ctx.player(S.active);
          roleBar.textContent = mine() ? "🎯 Your turn — place it wisely (or not)" : "⏳ " + (a ? a.name : "…") + " is placing";
        };
        act.left = () => { if (F.p && F.move(-1)) { sfx.tap(); sendMv(); } };
        act.right = () => { if (F.p && F.move(1)) { sfx.tap(); sendMv(); } };
        act.down = () => { if (F.p && F.down()) sendMv(); };
        act.rot = () => { if (F.p && F.rotate()) { sfx.tap(); sendMv(); } };
        act.hard = () => { if (!F.p || placing) return; F.hard(); placing = true; ctx.send("place", { r: F.p.r, x: F.p.x, y: F.p.y }); setAllowed([]); };
        panel.append(wrapBtn);
        beginTurn();
        ctx.interval(() => {                                   // host nudges past a turn whose player has wandered off
          if (finished || S.over || !ctx.isHost()) return;
          const a = ctx.player(S.active);
          if (a && !a.present && ctx.now() - turnStart > 15000) ctx.send("skip", { t: S.t });
        }, 1000);
        const paint = () => {
          sScore.set(S.score); sLines.set(S.lines); sLevel.set(S.level);
          T.drawMini(nextCv, S.curK, 62);
          const extra = !mine() && theirs && theirs.t === S.t && theirs.k === S.curK ? [{ piece: theirs, alpha: 0.5 }] : [];
          view.draw(S.board, { piece: mine() && F.p ? F.p : null, ghost: mine() && F.p ? F.ghostY() : null, extra });
          raf = requestAnimationFrame(paint);
        };
        raf = requestAnimationFrame(paint);
        window.__tt = { S, mode };
        return {
          onEvent(ev) {
            if (ev.type === "mv") { if (ev.f !== me) theirs = ev.d; return; }
            if (ev.type === "done") return finish(S, { heading: "Lovely teamwork! 🔁", sub: coopSub(S) });
            const t0 = S.t, fx = S.apply(ev);
            if (live(ev)) fxLive(fx, ev);
            if (S.over) { setAllowed([]); return finish(S, { heading: "The stack won this one! 🙈", sub: coopSub(S), emoji: "🫠", delay: 1600 }); }
            if (S.t !== t0) beginTurn();
          },
          onPlayers() { if (!mine()) beginTurn(); },
        };
      }

      /* =====================================================================
       *  MODE: Two Halves, One Goal
       * ===================================================================== */
      function runHalves() {
        const S = new T.Halves({ roster, chaos, calm, speed });
        const bounds = S.half[me];
        const bag = new T.PieceBag(ctx.rng("bag" + myIdx), chaos);
        let nextK = bag.next(), pending = [], lid = 0, waitingRelief = false, partner = null, lastMv = 0, acc = 0, lastFrame = performance.now(), topped = false;
        const pendCollide = (cells, px, py) => {
          for (const [x, rid, k] of pending) {
            const iy = S.board.indexOfId(rid); if (iy < 0) continue;
            for (const [cx, cy] of cells) if (px + cx === x && py + cy === iy) return true;
          }
          return false;
        };
        const F = new T.Faller((c, x, y) => S.board.collides(c, x, y, bounds) || pendCollide(c, x, y), bounds);
        const sendMv = () => { if (F.p && Date.now() - lastMv > 90) { lastMv = Date.now(); ctx.sendEph("mv", { k: F.p.k, r: F.p.r, x: F.p.x, y: F.p.y }, "mv"); } };
        const spawn = () => {
          const k = nextK; nextK = bag.next();
          if (F.spawn(k)) { sendMv(); return; }
          F.p = null;
          if (calm) { if (!waitingRelief) { waitingRelief = true; ctx.send("relief", {}); } }
          else if (!topped) { topped = true; ctx.send("over", {}); }
        };
        // locks I've sent that the server hasn't echoed back yet: still drawn, and still block my next piece
        let pendList = [];       // [{lid, cells:[[x,rid,k]]}]
        const addPending = (id, k, cells) => { pendList.push({ lid: id, cells: cells.map(([x, rid]) => [x, rid, k]) }); pending = pendList.flatMap((e) => e.cells); };
        const dropPending = (id) => { pendList = pendList.filter((e) => e.lid !== id); pending = pendList.flatMap((e) => e.cells); };
        const lockNow = () => {
          const p = F.p; if (!p) return;
          const cells = F.cells().map(([cx, cy]) => [p.x + cx, S.board.rows[p.y + cy].id]);
          const id = ++lid; addPending(id, p.k, cells);
          ctx.send("lock", { k: p.k, cells, lid: id });
          sfx.lock(); F.p = null; spawn();
        };
        act.left = () => { if (F.p && F.move(-1)) { sfx.tap(); sendMv(); } };
        act.right = () => { if (F.p && F.move(1)) { sfx.tap(); sendMv(); } };
        act.down = () => { if (F.p) { if (!F.down()) lockNow(); else sendMv(); } };
        act.rot = () => { if (F.p && F.rotate()) { sfx.tap(); sendMv(); } };
        act.hard = () => { if (F.p) { F.hard(); lockNow(); } };
        setAllowed(["left", "right", "rot", "down", "hard"]);
        const other = roster.find((id) => id !== me), op = other && ctx.player(other);
        roleBar.textContent = "🧩 You build the " + (myIdx === 0 ? "LEFT" : "RIGHT") + " half" + (op ? " — " + op.name + " builds the other" : "") + ". Rows clear when both halves are full!";
        panel.append(wrapBtn);
        spawn();

        const halfDefs = roster.map((id, i) => ({ x0: S.half[id].x0, x1: S.half[id].x1, color: ctx.player(id) ? ctx.player(id).color : "#fff", mine: id === me }));
        const hintRows = () => {                                         // my half is full on a row, waiting for my partner
          const o = [];
          S.board.rows.forEach((r, y) => { const mineFull = r.c.slice(bounds.x0, bounds.x1 + 1).every(Boolean); const all = r.c.every(Boolean); if (mineFull && !all) o.push({ y, x0: bounds.x0, x1: bounds.x1 }); });
          return o;
        };
        const paint = (now) => {
          const dt = now - lastFrame; lastFrame = now;
          if (!finished && !S.over && F.p && !ctx.paused()) {
            acc += dt;
            const ms = T.tickMs(speed, S.level) * 1.05;
            if (acc >= ms) { acc = 0; if (!F.down()) lockNow(); else sendMv(); }
          }
          sScore.set(S.score); sLines.set(S.lines); sLevel.set(S.level);
          T.drawMini(nextCv, nextK, 62);
          view.draw(S.board, { piece: F.p, ghost: F.p ? F.ghostY() : null, pending, halves: halfDefs, hint: hintRows(),
            extra: partner ? [{ piece: partner, alpha: 0.5 }] : [] });
          raf = requestAnimationFrame(paint);
        };
        raf = requestAnimationFrame(paint);
        window.__tt = { S, mode, get pending() { return pending; } };
        return {
          onEvent(ev) {
            if (ev.type === "mv") { if (ev.f !== me) partner = ev.d; return; }
            if (ev.type === "done") return finish(S, { heading: "A perfect pair! 🧩", sub: coopSub(S) });
            const fx = S.apply(ev);
            fx.forEach((f) => { if (f.t === "lock" && f.by === me) dropPending(f.lid); });
            if (live(ev)) fxLive(fx.filter((f) => !(f.t === "lock" && f.by !== me) ), ev);
            fx.forEach((f) => {
              if (f.t === "relief" && waitingRelief) { waitingRelief = false; if (!F.p) spawn(); }
              if (f.t === "clear" && live(ev) && f.by !== me) { const p = ctx.player(f.by); popup((p ? p.name : "Partner") + " completed it! 🙌"); }
            });
            if (S.over) { F.p = null; finish(S, { heading: "The stack won this one! 🙈", sub: coopSub(S), emoji: "🫠", delay: 1600 }); }
          },
        };
      }

      /* =====================================================================
       *  MODE: Friendly Race
       * ===================================================================== */
      function runVersus() {
        const bag = new T.PieceBag(ctx.rng("bag"), chaos);       // same sequence for everyone: a fair race
        const B = new T.Board(10, 20), bounds = { x0: 0, x1: 9 };
        const F = new T.Faller((c, x, y) => B.collides(c, x, y, bounds), bounds);
        let nextK = bag.next(), score = 0, lines = 0, level = 1, pieces = 0, acc = 0, lastFrame = performance.now(), oofs = 0;
        const DUR = 180000;
        const results = {}; roster.forEach((id) => (results[id] = { score: 0, lines: 0, pieces: 0, rows: null }));
        const spawn = () => {
          const k = nextK; nextK = bag.next();
          if (!F.spawn(k)) { B.relieve(8); oofs++; popup("Oof! 🙈 stack popped", "big"); sfx.sad(); F.spawn(k); }
        };
        const upd = (n) => ctx.send("upd", { score, lines, pieces, n: n || 0, rows: B.snapshot() });
        const lockNow = () => {
          const p = F.p; if (!p) return;
          B.lock(F.cells(), p.x, p.y, p.k); pieces++; sfx.lock();
          const full = B.fullRows(); let n = 0;
          if (full.length) { n = B.clearRows(full); lines += n; score += T.PTS[Math.min(4, n)] * level; level = T.levelOf(lines); sfx.clear(); popup(pick(POP[Math.min(4, n)])); if (n >= 3) PP.ui.confetti({ count: 50, y: 0.4 }); }
          F.p = null; spawn(); upd(n);
        };
        act.left = () => { if (F.p && F.move(-1)) sfx.tap(); };
        act.right = () => { if (F.p && F.move(1)) sfx.tap(); };
        act.down = () => { if (F.p && !F.down()) lockNow(); };
        act.rot = () => { if (F.p && F.rotate()) sfx.tap(); };
        act.hard = () => { if (F.p) { F.hard(); lockNow(); } };
        setAllowed(["left", "right", "rot", "down", "hard"]);
        roleBar.textContent = roster.length > 1 ? "🏁 Same pieces for everyone — stack your own board!" : "🎮 Solo practice";
        const timerEl = calm ? el("div.muted", "No timer — wrap up whenever") : W.timer(ctx, ctx.startT, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("done", {}); else setTimeout(() => ctx.send("done", {}), 3500); } }).el;
        panel.prepend(timerEl); panel.append(wrapBtn);
        const peers = el("div.tt-peers");
        const peerCv = {}, peerLbl = {};
        roster.filter((id) => id !== me).forEach((id) => {
          const p = ctx.player(id), cv = el("canvas.tt-peer"), sc = el("b", "0");
          peerCv[id] = cv; peerLbl[id] = sc;
          peers.appendChild(el("div.tt-peerbox", W.avatar(p, 22), el("span", p ? p.name : "?"), sc, cv));
          T.drawSnapshot(cv, new Array(20).fill(".".repeat(10)), 5);
        });
        root.appendChild(peers);
        spawn();
        const paint = (now) => {
          const dt = now - lastFrame; lastFrame = now;
          if (!finished && F.p && !ctx.paused()) { acc += dt; if (acc >= T.tickMs(speed, level)) { acc = 0; if (!F.down()) lockNow(); } }
          sScore.set(calm ? pieces : score); sLines.set(lines); sLevel.set(level);
          T.drawMini(nextCv, nextK, 62);
          view.draw(B, { piece: F.p, ghost: F.p ? F.ghostY() : null });
          raf = requestAnimationFrame(paint);
        };
        raf = requestAnimationFrame(paint);
        window.__tt = { mode, results };
        return {
          onEvent(ev) {
            if (ev.type === "upd") {
              const r = results[ev.f]; if (!r) return;
              Object.assign(r, { score: ev.d.score, lines: ev.d.lines, pieces: ev.d.pieces, rows: ev.d.rows });
              if (ev.f !== me && peerCv[ev.f]) {
                T.drawSnapshot(peerCv[ev.f], ev.d.rows, 5); peerLbl[ev.f].textContent = calm ? ev.d.pieces : ev.d.score;
                if (ev.d.n >= 2 && live(ev)) { PP.ui.floatEmoji("✨", ((ctx.player(ev.f) || {}).name || "?") + " cleared " + ev.d.n + "!", (ctx.player(ev.f) || {}).color); sfx.ding(); }
              }
            } else if (ev.type === "done") {
              const scores = {}; roster.forEach((id) => (scores[id] = calm ? results[id].pieces : results[id].score));
              finish({ stats: results }, { scores, unit: calm ? " pieces" : " pts", noScores: false, emoji: "🏁",
                heading: roster.length > 1 ? "Photo finish! 🏁" : "Nice practice run! 🎮", sub: "Everyone gets a title. No losers here.", noStats: false });
            }
          },
        };
      }
    },
  });
})();
