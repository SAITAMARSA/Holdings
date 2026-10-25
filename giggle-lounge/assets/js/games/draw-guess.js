/* Draw & Guess — one person draws, everyone else races to guess. Strokes stream live to every phone. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const COLORS = ["#2B1B4D", "#FF5CA8", "#FF6B6B", "#FF9F1C", "#FFD23F", "#2EE6A6", "#4DB8FF", "#A66CFF", "#FFFFFF"];
  const SIZES = [5, 11, 22];
  const SZ = 600;                                        // internal canvas resolution; strokes are sent as 0–1000

  PP.registerGame({
    id: "draw-guess", name: "Draw & Guess", emoji: "🎨", color: "#FFB86B",
    tagline: "Draw it badly. Guess it fast.",
    how: "Take turns drawing a secret word (or an absurd scene!) while the others guess. Strokes appear live on everyone's screen. Stick-figure skills welcome.",
    min: 2, max: 8, tags: ["silly", "creative", "fast"],
    options: [
      { id: "words", label: "What do you draw?", kind: "choice", def: "all", choices: [{ v: "all", label: "🎲 Mix" }, { v: "f", label: "🖍️ Everyday things" }, { v: "s", label: "🤪 Absurd scenes" }] },
      { id: "secs", label: "Time per drawing", kind: "choice", def: "80", choices: [{ v: "60", label: "60s" }, { v: "80", label: "80s" }, { v: "110", label: "110s" }] },
      { id: "rounds", label: "Turns each", kind: "choice", def: "2", choices: [{ v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3", label: "3" }] },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const total = Math.min(12, n * Number(ctx.settings.rounds || 2)), DUR = Number(ctx.settings.secs || 80) * 1000;
      const kind = ctx.settings.words === "all" || !ctx.settings.words ? null : ctx.settings.words;
      const deck = PP.engine.all("draw");
      const st = { r: -1, phase: "wait", giver: null, opts: [], word: null, strokes: {}, order: [], solved: {}, sorder: [], guesses: [], hints: 0, scores: {}, start: 0, q: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {}, g = null, color = COLORS[0], size = SIZES[1], pencil = false;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const wordOf = () => deck[st.word];

      /* ---------- canvas drawing ---------- */
      const px = (v) => (v / 1000) * SZ;
      function drawSeg(c, w, pts, from) {
        if (!g) return;
        g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round";
        let prev = from;
        pts.forEach((p) => {
          g.beginPath();
          if (prev) { g.moveTo(px(prev[0]), px(prev[1])); g.lineTo(px(p[0]), px(p[1])); g.stroke(); }
          else { g.arc(px(p[0]), px(p[1]), w / 2, 0, 7); g.fill(); }
          prev = p;
        });
      }
      function redraw() {
        if (!g) return;
        g.fillStyle = "#fff"; g.fillRect(0, 0, SZ, SZ);
        st.order.forEach((id) => { const s = st.strokes[id]; if (s) drawSeg(s.c, s.w, s.pts, null); });
      }

      /* ---------- views ---------- */
      function render() {
        ui = {}; g = null;
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Sharpening pencils… ✏️"));
        if (st.phase === "pick") return viewPick();
        if (st.phase === "draw") return viewDraw();
        if (st.phase === "reveal") return viewReveal();
      }
      const head = () => el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Drawing " + (st.r + 1) + " / " + total), el("span.pchip", W.avatar(ctx.player(st.giver), 26), el("b", (ctx.player(st.giver) || {}).name), "🖍️"));

      function viewPick() {
        const mine = st.giver === me;
        mount(ctx.el, el("div.stack", head(), mine
          ? el("div.card.stack", el("h3", "What will you draw?"), st.opts.map((i) => el("button.opt-card", { onclick: () => { sfx.pop(); ctx.send("pick", { r: st.r, i }); } }, el("span.oc-emoji", "✏️"), el("span.oc-text", el("b", deck[i].t), el("span", deck[i].g[0] === "absurd" ? "absurd scene 🤪" : deck[i].g[0])))))
          : el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "✏️"), el("h3", (ctx.player(st.giver) || {}).name + " is choosing…"))));
      }

      function pattern() {
        const w = wordOf().t, ltrs = w.replace(/[^A-Za-z0-9]/g, "");
        let shown = 0;
        return w.split(" ").map((word) => word.split("").map((ch) => { if (!/[A-Za-z0-9]/.test(ch)) return ch; const k = shown++; return st.hints > 0 && k < st.hints ? ch.toUpperCase() : "＿"; }).join(" ")).join("   ");
      }

      function viewDraw() {
        const mine = st.giver === me;
        const cv = el("canvas.draw-cv", { width: SZ, height: SZ }); g = cv.getContext("2d"); redraw();
        const timer = W.timer(ctx, st.start, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("reveal", { r: st.r }); else ctx.later(() => st.phase === "draw" && ctx.send("reveal", { r: st.r }), 4000); } });
        const pat = el("div.big-emoji", { style: { fontSize: "1.8rem", letterSpacing: ".05em" } }); ui.pat = pat;
        pat.textContent = mine ? wordOf().t : pattern();
        if (mine) {
          wire(cv);
          const sw = el("div.swatches", COLORS.map((c) => el("button.sw" + (c === color ? ".on" : ""), { type: "button", style: { background: c }, onclick: (e) => { color = c; Array.from(sw.children).forEach((x) => x.classList.toggle("on", x === e.currentTarget)); sfx.tap(); } })));
          const sz = el("div.row", SIZES.map((s) => el("button.chip-btn" + (s === size ? ".on" : ""), { type: "button", onclick: (e) => { size = s; Array.from(sz.children).forEach((x) => x.classList.toggle("on", x === e.currentTarget)); } }, el("span", { style: { display: "inline-block", width: s + 6 + "px", height: s + 6 + "px", borderRadius: "50%", background: "var(--ink)" } }))));
          mount(ctx.el, el("div.stack", head(), timer.el, el("div.card.stack.center", el("div.note", "Draw: ", el("b", wordOf().t)), cv,
            sw, el("div.row", { style: { justifyContent: "center" } }, sz, el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("undo", { r: st.r }) }, "↩️ Undo"), el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("clear", { r: st.r }) }, "🗑 Clear"))),
            el("div.card.stack", el("b", "Guesses"), ui.log = el("div.guess-log"))));
        } else {
          const input = el("input.in", { placeholder: "What is it?", maxLength: 60, autocomplete: "off" });
          const form = el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (v && !st.solved[me]) { ctx.send("guess", { r: st.r, txt: v }); input.value = ""; } } }, el("div.grow", input), el("button.btn", { type: "submit" }, "Guess"));
          mount(ctx.el, el("div.stack", head(), timer.el, el("div.card.stack.center", cv, pat, st.solved[me] ? el("div.note", "🎉 You got it!") : form),
            el("div.card.stack", el("b", "Guesses"), ui.log = el("div.guess-log"))));
          if (!st.solved[me]) setTimeout(() => input.focus(), 60);
        }
        paintLog();
      }

      function wire(cv) {
        let cur = null, buf = [], timer = null, last = null;
        const pos = (e) => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1000, Math.round(((e.clientX - r.left) / r.width) * 1000))), Math.max(0, Math.min(1000, Math.round(((e.clientY - r.top) / r.height) * 1000)))]; };
        const flush = () => { if (cur && buf.length) { ctx.send("seg", { r: st.r, id: cur.id, c: cur.c, w: cur.w, pts: buf }); buf = []; } };
        cv.addEventListener("pointerdown", (e) => {
          e.preventDefault(); cv.setPointerCapture(e.pointerId);
          const p = pos(e); cur = { id: me + "-" + Date.now().toString(36), c: color, w: size }; last = null; buf = [p];
          drawSeg(cur.c, cur.w, [p], null); last = p; timer = setInterval(flush, 110);
        });
        cv.addEventListener("pointermove", (e) => {
          if (!cur) return; const p = pos(e);
          if (last && Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 4) return;
          drawSeg(cur.c, cur.w, [p], last); last = p; buf.push(p);
        });
        const up = () => { if (!cur) return; clearInterval(timer); flush(); cur = null; };
        ["pointerup", "pointercancel", "pointerleave"].forEach((n) => cv.addEventListener(n, up));
        ctx.cleanup(() => clearInterval(timer));
      }

      function paintLog() {
        if (!ui.log) return;
        const mine = st.giver === me;
        mount(ui.log, st.guesses.slice(-10).reverse().map((x) => el("div.guess" + (x.res === "ok" ? ".ok" : x.res === "close" ? ".close" : ""), W.avatar(ctx.player(x.f), 22), el("b", (ctx.player(x.f) || {}).name), el("span.grow", x.txt),
          x.res === "ok" ? "✅" : x.res === "close" ? "🤏" : (mine ? el("button.chip-btn", { onclick: () => ctx.send("accept", { r: st.r, gid: x.id }) }, "✅") : ""))));
      }

      function viewReveal() {
        const w = wordOf(), solvers = roster.filter((id) => st.solved[id] != null);
        const cv = el("canvas.draw-cv", { width: SZ, height: SZ }); g = cv.getContext("2d"); redraw();
        mount(ctx.el, el("div.stack", head(), el("div.card.center.stack", el("div.muted", "It was…"), el("h2", w.t), cv,
          solvers.length ? el("p", "🎉 Guessed by " + solvers.map((id) => (ctx.player(id) || {}).name).join(", ")) : el("p.muted", "Nobody got it — a masterpiece of mystery! 🖼️"),
          el("div.row", { style: { justifyContent: "center" } }, el("button.btn.btn-sm.btn-acc", { onclick: (e) => { e.currentTarget.disabled = true; const t = document.createElement("canvas"); t.width = t.height = 360; t.getContext("2d").drawImage(cv, 0, 0, 360, 360); ctx.keep("drawing", w.t, { img: t.toDataURL("image/jpeg", 0.7), word: w.t }); } }, "🧸 Keep this drawing")),
          PP.engine.reactionBar("draw", st.word)),
          el("div.card", W.scoreboard(ctx, st.scores)), W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next drawing in a moment…")));
      }

      function startRound(r) { ctx.send("round", { r, opts: ctx.draw("draw", 3, { filter: (w) => !kind || (kind === "s" ? w.v === "s" : w.v !== "s") }) }); }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; startRound(0); }
        if (st.phase === "pick" && !st.q["pk" + st.r]) { st.q["pk" + st.r] = 1; ctx.later(() => st.phase === "pick" && ctx.send("reveal", { r: st.r }), 40000); }
        if (st.phase === "draw" && !st.q["rv" + st.r]) {
          const need = roster.filter((id) => id !== st.giver && present().includes(id));
          if (need.length && need.every((id) => st.solved[id] != null)) { st.q["rv" + st.r] = 1; ctx.later(() => ctx.send("reveal", { r: st.r }), 1200); }
        }
        if (st.phase === "draw" && !st.q["h" + st.r]) {
          st.q["h" + st.r] = 1; const r = st.r;
          ctx.later(() => st.r === r && st.phase === "draw" && ctx.send("hint", { r, n: 1 }), DUR * 0.4);
          ctx.later(() => st.r === r && st.phase === "draw" && ctx.send("hint", { r, n: 2 }), DUR * 0.7);
        }
        if (st.phase === "reveal" && !st.q["nx" + st.r]) { st.q["nx" + st.r] = 1; const r = st.r; ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : startRound(r + 1)); }, 9000); }
      }

      function solve(f, live) {
        if (st.solved[f] != null) return;
        st.solved[f] = st.sorder.length; st.sorder.push(f);
        const frac = Math.max(0, Math.min(1, ctx.timeLeft(st.start, DUR) / DUR));
        st.scores[f] += 2 + Math.ceil(frac * 3) - (st.sorder.length > 1 ? 1 : 0); st.scores[st.giver] += 1;
        if (live) { sfx.ding(); if (f === me) PP.ui.confetti({ count: 60, y: 0.3 }); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "round":
              if (d.r !== st.r + 1) return;
              Object.assign(st, { r: d.r, phase: "pick", giver: roster[d.r % n], opts: d.opts, word: null, strokes: {}, order: [], solved: {}, sorder: [], guesses: [], hints: 0 }); render(); break;
            case "pick": if (d.r === st.r && st.phase === "pick" && ev.f === st.giver && st.opts.includes(d.i)) { st.word = d.i; st.phase = "draw"; st.start = ev.t; render(); } break;
            case "seg": {
              if (d.r !== st.r || st.phase !== "draw" || ev.f !== st.giver) return;
              let s = st.strokes[d.id];
              if (!s) { s = st.strokes[d.id] = { c: COLORS.includes(d.c) ? d.c : COLORS[0], w: Math.max(2, Math.min(30, Number(d.w) || 8)), pts: [] }; st.order.push(d.id); }
              const pts = (d.pts || []).slice(0, 80).map((p) => [Number(p[0]) || 0, Number(p[1]) || 0]);
              if (ev.f !== me) drawSeg(s.c, s.w, pts, s.pts.length ? s.pts[s.pts.length - 1] : null);
              s.pts.push(...pts); break;
            }
            case "undo": if (d.r === st.r && st.phase === "draw" && ev.f === st.giver) { const id = st.order.pop(); if (id) delete st.strokes[id]; redraw(); } break;
            case "clear": if (d.r === st.r && st.phase === "draw" && ev.f === st.giver) { st.strokes = {}; st.order = []; redraw(); } break;
            case "hint": if (d.r === st.r && st.phase === "draw" && d.n > st.hints) { st.hints = d.n; if (ui.pat && st.giver !== me) ui.pat.textContent = pattern(); } break;
            case "guess": {
              if (d.r !== st.r || st.phase !== "draw" || ev.f === st.giver || st.solved[ev.f] != null) return;
              const w = wordOf(), res = PP.match(d.txt, w.t, w.a);
              st.guesses.push({ id: ev.s, f: ev.f, txt: String(d.txt).slice(0, 60), res });
              if (res === "ok") { solve(ev.f, live); if (ev.f === me) { const keepG = g; render(); } }
              paintLog(); break;
            }
            case "accept": { if (d.r !== st.r || st.phase !== "draw" || ev.f !== st.giver) return; const x = st.guesses.find((y) => y.id === d.gid); if (x && x.res !== "ok" && st.solved[x.f] == null) { x.res = "ok"; solve(x.f, live); paintLog(); if (x.f === me) render(); } break; }
            case "reveal": if (d.r === st.r && (st.phase === "draw" || st.phase === "pick")) { if (st.word == null) st.word = st.opts[0]; st.phase = "reveal"; render(); } break;
            case "fin": if (st.phase === "fin") return; st.phase = "fin"; mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🎨", heading: "Gallery night! 🖼️", sub: "Every masterpiece was… a masterpiece." })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
