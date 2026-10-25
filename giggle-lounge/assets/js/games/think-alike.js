/* Think Alike — everyone secretly picks from the same four options. Match the others to score. No talking required. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const DUR = 30000, ROUNDS = 8;

  PP.registerGame({
    id: "think-alike", name: "Think Alike", emoji: "🧠", color: "#7DE0C4", silent: "native",
    tagline: "Pick the same thing as your partner — without a word.",
    how: "You all see the same four options. Secretly pick the one you think everybody else will pick. Everyone matches = big points. A great one for silent mode: no clues, just trust!",
    min: 2, max: 8, tags: ["trust", "mind-reading", "silent"],
    options: [{ id: "rounds", label: "How many rounds", kind: "choice", def: "8", choices: [{ v: "5", label: "5" }, { v: "8", label: "8" }, { v: "12", label: "12" }] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, total = Number(ctx.settings.rounds || ROUNDS);
      const deck = PP.engine.all("think-alike");
      const st = { r: -1, phase: "wait", i: 0, picks: {}, scores: {}, res: null, q: {}, start: 0, streak: 0 };
      roster.forEach((id) => (st.scores[id] = 0));
      let mine = null;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const head = () => el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Round " + (st.r + 1) + " / " + total), st.streak > 1 ? el("span.badge", "🔥 " + st.streak + " in sync") : null);

      function render() {
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Shuffling the options… 🧠"));
        const q = deck[st.i];
        if (st.phase === "play") {
          const timer = W.timer(ctx, st.start, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("reveal", { r: st.r }); else ctx.later(() => st.phase === "play" && ctx.send("reveal", { r: st.r }), 4000); } });
          mount(ctx.el, el("div.stack", head(), timer.el, el("div.card.stack.center", el("h3", q.t),
            el("div.ta-opts", q.o.map((o, k) => el("button.ta-opt" + (mine === k ? ".on" : ""), { type: "button", disabled: mine != null, onclick: () => { mine = k; sfx.pop(); ctx.send("pick", { r: st.r, k }); render(); } }, o))),
            mine != null ? W.waiting(ctx, present().filter((id) => st.picks[id] == null).map((id) => (ctx.player(id) || {}).name), "Locked in! Waiting for…") : el("div.note", ctx.silent ? "🤫 No talking — what would they pick?" : "Pick what you think they'll pick."))));
        } else {
          const R = st.res;
          mount(ctx.el, el("div.stack", head(), el("div.card.stack.center", el("h3", q.t),
            el("div.ta-opts", q.o.map((o, k) => el("div.ta-opt.rev" + (R.top === k && R.size > 1 ? ".win" : ""), el("span", o), el("div.ta-who", roster.filter((id) => st.picks[id] === k).map((id) => W.avatar(ctx.player(id), 26)))))),
            el("div.note", R.all ? "EVERYONE MATCHED! 🤯🎉" : R.size > 1 ? "Partly in sync 😮 (" + R.size + " of " + R.cnt + ")" : "Total opposites 🌀 — hilarious."),
            PP.engine.reactionBar("think-alike", st.i)),
            el("div.card", W.scoreboard(ctx, st.scores)), W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next one coming…")));
          if (R.all) { sfx.tada(); PP.ui.confetti({ count: 120, y: 0.3 }); } else sfx.ding();
        }
      }
      function startRound(r) { ctx.send("round", { r, i: ctx.draw("think-alike", 1)[0] }); }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; startRound(0); }
        if (st.phase === "play" && !st.q["rv" + st.r]) { const p = present(); if (p.length && p.every((id) => st.picks[id] != null)) { st.q["rv" + st.r] = 1; ctx.later(() => ctx.send("reveal", { r: st.r }), 600); } }
        if (st.phase === "reveal" && !st.q["nx" + st.r]) { st.q["nx" + st.r] = 1; const r = st.r; ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : startRound(r + 1)); }, 6500); }
      }
      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {};
          switch (ev.type) {
            case "round": if (d.r !== st.r + 1) return; Object.assign(st, { r: d.r, phase: "play", i: d.i, picks: {}, res: null, start: ev.t }); mine = null; render(); break;
            case "pick": if (d.r === st.r && st.phase === "play" && roster.includes(ev.f) && st.picks[ev.f] == null && d.k >= 0 && d.k < 4) st.picks[ev.f] = d.k; break;
            case "reveal": {
              if (d.r !== st.r || st.phase !== "play") return;
              const cnt = Object.keys(st.picks).length, tally = {}; Object.values(st.picks).forEach((k) => (tally[k] = (tally[k] || 0) + 1));
              let top = -1, size = 0; Object.keys(tally).forEach((k) => { if (tally[k] > size) { size = tally[k]; top = Number(k); } });
              const all = cnt > 1 && size === cnt, pts = {};
              roster.forEach((id) => { pts[id] = st.picks[id] != null && size > 1 && st.picks[id] === top ? (all ? 3 : 1) : 0; st.scores[id] += pts[id]; });
              st.streak = all ? st.streak + 1 : 0; st.res = { top, size, cnt, all, pts }; st.phase = "reveal"; render(); break;
            }
            case "fin": if (st.phase === "fin") return; st.phase = "fin"; mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🧠", heading: "Brains: synchronised!", sub: "Matching the group is what counts." })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
