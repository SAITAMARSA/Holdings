/* Vibe Check — a hidden spot on a dial between two opposites. The psychic gives a clue, everyone else aims for it. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const ZONES = [[4, 4, "#FFD23F"], [9, 3, "#FF9F1C"], [15, 2, "#FF5CA8"], [24, 1, "#A66CFF"]];   // [± width, points, colour]
  const DUR = 80000;
  const ptsFor = (d) => { for (const [w, p] of ZONES) if (d <= w) return p; return 0; };
  const R = 150, CX = 170, CY = 170;
  const NS = "http://www.w3.org/2000/svg";
  const ang = (v) => Math.PI * (1 - v / 100);
  const pt = (v, r) => [CX + r * Math.cos(ang(v)), CY - r * Math.sin(ang(v))];
  const arc = (v0, v1, r) => { const a = pt(v0, r), b = pt(v1, r); return "M" + a[0] + " " + a[1] + " A" + r + " " + r + " 0 0 1 " + b[0] + " " + b[1]; };
  const S = (tag, attrs, ...kids) => { const x = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach((k) => x.setAttribute(k, attrs[k])); kids.forEach((k) => k && x.appendChild(k)); return x; };

  PP.registerGame({
    id: "vibe-check", name: "Vibe Check", emoji: "🎯", color: "#FFE066",
    tagline: "Read their mind on a dial between two opposites.",
    how: "A secret spot hides on a dial between two opposites, like “Overrated ↔ Underrated”. The psychic sees it and gives a clue. Everyone else aims the dial where they think it is. Closer = more points!",
    min: 2, max: 8, tags: ["mind-reading", "silly", "chatty"],
    options: [{ id: "rounds", label: "Turns as psychic", kind: "choice", def: "1", choices: [{ v: "1", label: "1 each" }, { v: "2", label: "2 each" }] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, total = Math.min(10, n * Number(ctx.settings.rounds || 1));
      const deck = PP.engine.all("spectrums");
      const st = { r: -1, phase: "wait", psy: null, i: 0, target: 50, clue: "", guesses: {}, scores: {}, res: null, q: {}, start: 0 };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {}, myGuess = 50, locked = false;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);

      function dial(opts) {
        opts = opts || {};
        const svg = S("svg", { viewBox: "0 0 340 190", class: "dial" });
        svg.appendChild(S("path", { d: arc(0, 100, R), class: "dial-track" }));
        if (opts.target != null) ZONES.slice().reverse().forEach(([w, , c]) => svg.appendChild(S("path", { d: arc(Math.max(0, opts.target - w), Math.min(100, opts.target + w), R), stroke: c, "stroke-width": 26, fill: "none", opacity: 0.95 })));
        const needles = S("g", {}); svg.appendChild(needles);
        svg.appendChild(S("circle", { cx: CX, cy: CY, r: 12, class: "dial-hub" }));
        const set = (list) => {
          while (needles.firstChild) needles.removeChild(needles.firstChild);
          list.forEach((nd) => {
            const [x, y] = pt(nd.v, R - 4);
            needles.appendChild(S("line", { x1: CX, y1: CY, x2: x, y2: y, stroke: nd.color || "#2B1B4D", "stroke-width": nd.mine ? 5 : 3.5, "stroke-linecap": "round" }));
            if (nd.label) { const [lx, ly] = pt(nd.v, R + 16); const t = S("text", { x: lx, y: ly + 5, "text-anchor": "middle", "font-size": 16 }); t.textContent = nd.label; needles.appendChild(t); }
          });
        };
        svg.set = set; return svg;
      }

      function render() {
        ui = {};
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Calibrating the dial… 🎯"));
        if (st.phase === "play") return viewPlay();
        if (st.phase === "reveal") return viewReveal();
      }
      const head = () => el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Round " + (st.r + 1) + " / " + total), el("span.pchip", W.avatar(ctx.player(st.psy), 26), el("b", (ctx.player(st.psy) || {}).name), "🔮"));
      const poles = () => { const s = deck[st.i]; return el("div.row", { style: { justifyContent: "space-between" } }, el("b.pole", s.l), el("b.pole", s.r)); };

      function viewPlay() {
        const mine = st.psy === me, timer = W.timer(ctx, st.start, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("reveal", { r: st.r }); else ctx.later(() => st.phase === "play" && ctx.send("reveal", { r: st.r }), 4000); } });
        if (mine) {
          const d = dial({ target: st.target }); d.set([]);
          const clue = el("input.in", { placeholder: "Type your clue (or just say it out loud!)", maxLength: 60 });
          mount(ctx.el, el("div.stack", head(), timer.el, el("div.card.stack.center", el("div.note", "🔮 You're the psychic — only you can see the target!"), poles(), d,
            el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); if (clue.value.trim()) { ctx.send("clue", { r: st.r, txt: clue.value.trim() }); sfx.pop(); } } }, el("div.grow", clue), el("button.btn", { type: "submit" }, "Send clue")),
            ui.clue = el("div.note.center"), W.waiting(ctx, present().filter((id) => id !== me && st.guesses[id] == null).map((id) => (ctx.player(id) || {}).name), "Waiting for guesses…"))));
        } else {
          const d = dial(); const paint = () => d.set([{ v: myGuess, mine: true, color: "var(--pri)" }]); paint();
          const drag = (e) => { const r = d.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 340, y = ((e.clientY - r.top) / r.height) * 190; const a = Math.atan2(CY - y, x - CX); myGuess = Math.max(0, Math.min(100, Math.round((1 - Math.max(0, Math.min(Math.PI, a)) / Math.PI) * 100))); paint(); slider.value = myGuess; };
          let down = false; d.addEventListener("pointerdown", (e) => { if (locked) return; down = true; d.setPointerCapture(e.pointerId); drag(e); }); d.addEventListener("pointermove", (e) => down && !locked && drag(e)); d.addEventListener("pointerup", () => (down = false));
          const slider = el("input", { type: "range", min: 0, max: 100, value: myGuess, style: { width: "100%" }, oninput: () => { if (locked) return; myGuess = Number(slider.value); paint(); } });
          const lock = el("button.btn.btn-big", { onclick: () => { locked = true; sfx.pop(); ctx.send("guess", { r: st.r, v: myGuess }); render(); } }, "🔒 Lock in my guess");
          mount(ctx.el, el("div.stack", head(), timer.el, el("div.card.stack.center", poles(), d, locked ? el("div.note", "🔒 Locked in at " + myGuess) : [slider, lock],
            ui.clue = el("div.note.center", st.clue ? "💬 Clue: " + st.clue : "Waiting for the psychic's clue… (they might say it out loud!)"),
            locked ? W.waiting(ctx, present().filter((id) => id !== st.psy && st.guesses[id] == null).map((id) => (ctx.player(id) || {}).name)) : null)));
        }
      }

      function viewReveal() {
        const d = dial({ target: st.target });
        const ids = roster.filter((id) => st.guesses[id] != null);
        d.set(ids.map((id) => ({ v: st.guesses[id], color: (ctx.player(id) || {}).color || "#333", label: (ctx.player(id) || {}).avatar })));
        const R2 = st.res;
        mount(ctx.el, el("div.stack", head(), el("div.card.stack.center", poles(), d,
          st.clue ? el("div.note", "💬 Clue was: ", el("b", st.clue)) : null,
          ids.length ? ids.map((id) => el("div.guess", W.avatar(ctx.player(id), 22), el("b", (ctx.player(id) || {}).name), el("span.grow", "aimed at " + st.guesses[id]), el("b", "+" + R2.pts[id]))) : el("p.muted", "Nobody guessed!"),
          el("div.note", "🎯 Target was " + st.target + ". ", R2.best >= 4 ? "BULLSEYE! 🔥" : R2.best >= 3 ? "So close! 😮" : R2.best >= 1 ? "In the neighbourhood 🏘️" : "Total vibe mismatch 🌀"),
          PP.engine.reactionBar("spectrums", st.i)),
          el("div.card", W.scoreboard(ctx, st.scores)), W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next dial in a moment…")));
        if (R2.best >= 4) { sfx.tada(); PP.ui.confetti({ count: 100, y: 0.3 }); } else sfx.ding();
      }

      function startRound(r) { ctx.send("round", { r, i: ctx.draw("spectrums", 1)[0], target: 6 + PP.RNG.secure().int(89) }); }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; startRound(0); }
        if (st.phase === "play" && !st.q["rv" + st.r]) {
          const need = present().filter((id) => id !== st.psy);
          if (need.length && need.every((id) => st.guesses[id] != null)) { st.q["rv" + st.r] = 1; ctx.later(() => ctx.send("reveal", { r: st.r }), 800); }
        }
        if (st.phase === "reveal" && !st.q["nx" + st.r]) { st.q["nx" + st.r] = 1; const r = st.r; ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : startRound(r + 1)); }, 9500); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {};
          switch (ev.type) {
            case "round":
              if (d.r !== st.r + 1) return;
              Object.assign(st, { r: d.r, phase: "play", psy: roster[d.r % n], i: d.i, target: Math.max(0, Math.min(100, Number(d.target) || 50)), clue: "", guesses: {}, res: null, start: ev.t }); myGuess = 50; locked = false; render(); break;
            case "clue": if (d.r === st.r && st.phase === "play" && ev.f === st.psy) { st.clue = String(d.txt || "").slice(0, 60); if (ui.clue) ui.clue.textContent = st.psy === me ? "✅ Sent: " + st.clue : "💬 Clue: " + st.clue; } break;
            case "guess": if (d.r === st.r && st.phase === "play" && ev.f !== st.psy && roster.includes(ev.f) && st.guesses[ev.f] == null) { st.guesses[ev.f] = Math.max(0, Math.min(100, Number(d.v) || 0)); if (ev.f === me) locked = true;
              if (locked || st.psy === me) render(); } break;
            case "reveal": {
              if (d.r !== st.r || st.phase !== "play") return;
              const pts = {}; let sum = 0, cnt = 0, best = 0;
              roster.forEach((id) => { pts[id] = 0; if (st.guesses[id] != null) { const p = ptsFor(Math.abs(st.guesses[id] - st.target)); pts[id] = p; st.scores[id] += p; sum += p; cnt++; best = Math.max(best, p); } });
              if (cnt) { const bonus = Math.round(sum / cnt); pts[st.psy] = bonus; st.scores[st.psy] += bonus; }
              st.res = { pts, best }; st.phase = "reveal"; render(); break;
            }
            case "fin": if (st.phase === "fin") return; st.phase = "fin"; mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🎯", heading: "Psychic powers confirmed!", sub: "Closer to the target = more points. The psychic earns the group's average." })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
