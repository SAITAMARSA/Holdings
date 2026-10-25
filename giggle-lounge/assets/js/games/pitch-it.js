/* Pitch It — the dice deal a product and a customer (and sometimes a twist). Everyone writes a pitch.
 * Pitches are shown without names; you hand out flames; then the authors are revealed. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;

  PP.registerGame({
    id: "pitch-it", name: "Pitch It", emoji: "💡", color: "#8FD4FF",
    tagline: "Sell a ridiculous product to a ridiculous customer.",
    how: "The dice deal you a product, a customer, and sometimes a twist. Everyone writes a pitch — then they're read out without names and you give them flames. Best pitch gets crowned.",
    min: 2, max: 8, tags: ["silly", "creative", "voting"],
    options: [
      { id: "rounds", label: "How many pitches?", kind: "choice", def: "3", choices: [{ v: "2", label: "2" }, { v: "3", label: "3" }, { v: "4", label: "4" }] },
      { id: "secs", label: "Time to write", kind: "choice", def: "75", choices: [{ v: "45", label: "45s" }, { v: "75", label: "75s" }, { v: "120", label: "2 min" }] },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, total = Number(ctx.settings.rounds || 3), DUR = Number(ctx.settings.secs || 75) * 1000;
      const st = { r: -1, phase: "wait", p: 0, c: 0, tw: null, start: 0, pitches: {}, votes: {}, scores: {}, order: [], q: {}, winner: null, flames: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let myVotes = {}, sentVotes = false, wrote = false;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const label = () => el("div.card.stack.center",
        el("div.muted", "Pitch"), el("h2", PP.engine.get("pitch-product", st.p).t), el("div.muted", "to"), el("h2", PP.engine.get("pitch-customer", st.c).t),
        st.tw != null ? el("div.note", "🎲 Twist: ", el("b", PP.engine.get("pitch-twist", st.tw).t)) : null);

      function render() {
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Rolling the pitch dice… 🎲"));
        if (st.phase === "write") return viewWrite();
        if (st.phase === "vote") return viewVote();
        if (st.phase === "results") return viewResults();
      }
      const head = () => el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Pitch " + (st.r + 1) + " / " + total));

      function viewWrite() {
        if (wrote || st.pitches[me]) {
          const waiting = present().filter((id) => !st.pitches[id]).map((id) => (ctx.player(id) || {}).name);
          return mount(ctx.el, el("div.stack", head(), label(), el("div.card.center.stack", el("h3", "Pitch submitted 🎤"), W.waiting(ctx, waiting))));
        }
        const box = el("textarea.in", { placeholder: "Make it irresistible…", maxLength: 220 }), cnt = el("div.counter", "0 / 220");
        box.addEventListener("input", () => { cnt.textContent = box.value.length + " / 220"; send.disabled = box.value.trim().length < 3; });
        const send = el("button.btn.btn-big", { disabled: true, onclick: () => { wrote = true; sfx.pop(); ctx.send("pitch", { r: st.r, txt: box.value.trim().slice(0, 220) }); render(); } }, "🎤 Pitch it!");
        const timer = W.timer(ctx, st.start, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("show", { r: st.r }); else ctx.later(() => st.phase === "write" && ctx.send("show", { r: st.r }), 4000); } });
        mount(ctx.el, el("div.stack", head(), timer.el, label(), el("div.card.stack", box, cnt, send)));
      }

      function viewVote() {
        const mineIdx = st.order.indexOf(me);
        const waiting = present().filter((id) => st.votes[id] == null).map((id) => (ctx.player(id) || {}).name);
        if (sentVotes) return mount(ctx.el, el("div.stack", head(), label(), el("div.card.center.stack", el("h3", "Flames sent 🔥"), W.waiting(ctx, waiting))));
        const cards = st.order.map((id, idx) => {
          const own = id === me, txt = st.pitches[id];
          const fl = el("div.row", { style: { justifyContent: "center" } });
          const paint = () => mount(fl, [1, 2, 3].map((k) => el("button.flame" + (myVotes[idx] >= k ? ".on" : ""), { type: "button", onclick: () => { myVotes[idx] = myVotes[idx] === k ? k - 1 : k; sfx.tap(); paint(); check(); } }, "🔥")));
          if (!own) paint();
          return el("div.card.stack", el("div.quote", "“" + txt + "”"), own ? el("div.note.center", "That's yours — no voting for yourself! 😉") : fl);
        });
        const send = el("button.btn.btn-big", { onclick: () => { sentVotes = true; sfx.ding(); ctx.send("votes", { r: st.r, v: myVotes }); render(); } }, "🔥 Send my flames");
        const check = () => {};
        mount(ctx.el, el("div.stack", head(), label(), el("p.muted.center", "Give 1–3 🔥 to each pitch. Names are secret until the reveal."), cards, send));
      }

      function viewResults() {
        const rows = st.order.map((id) => ({ id, f: st.flames[id] || 0, txt: st.pitches[id] })).sort((a, b) => b.f - a.f);
        mount(ctx.el, el("div.stack", head(), label(),
          rows.map((r, i) => el("div.card.stack" + (i === 0 ? ".winner" : ""), i === 0 ? el("div.center", el("span.badge", "👑 Pitch of the round")) : null,
            el("div.quote", "“" + r.txt + "”"), el("div.row", W.avatar(ctx.player(r.id), 28), el("b.grow", (ctx.player(r.id) || {}).name || "?"), el("b", "🔥 ".repeat(Math.min(r.f, 12)) || "—"), el("b", r.f)),
            i === 0 ? el("button.btn.btn-sm.btn-acc", { onclick: (e) => { e.currentTarget.disabled = true; ctx.keep("pitch", PP.engine.get("pitch-product", st.p).t, { product: PP.engine.get("pitch-product", st.p).t, customer: PP.engine.get("pitch-customer", st.c).t, pitch: r.txt, by: (ctx.player(r.id) || {}).name }); } }, "🧸 Keep this pitch") : null)),
          el("div.card", W.scoreboard(ctx, st.scores, { unit: " 🔥" })), W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next pitch in a moment…")));
      }

      function deal(r) {
        const rng = PP.RNG.secure();
        ctx.send("deal", { r, p: ctx.draw("pitch-product", 1)[0], c: ctx.draw("pitch-customer", 1)[0], tw: rng.chance(0.6) ? ctx.draw("pitch-twist", 1)[0] : null });
      }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; deal(0); }
        if (st.phase === "write" && !st.q["sh" + st.r]) { const need = present(); if (need.length && need.every((id) => st.pitches[id])) { st.q["sh" + st.r] = 1; ctx.later(() => ctx.send("show", { r: st.r }), 700); } }
        if (st.phase === "vote" && !st.q["rs" + st.r]) {
          const need = present();
          if (need.length && need.every((id) => st.votes[id] != null)) { st.q["rs" + st.r] = 1; ctx.later(() => ctx.send("results", { r: st.r }), 700); }
          else if (!st.q["vt" + st.r]) { st.q["vt" + st.r] = 1; ctx.later(() => st.phase === "vote" && ctx.send("results", { r: st.r }), 90000); }
        }
        if (st.phase === "results" && !st.q["ad" + st.r]) { st.q["ad" + st.r] = 1; const r = st.r; ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : deal(r + 1)); }, 12000); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "deal": if (d.r !== st.r + 1) return; Object.assign(st, { r: d.r, phase: "write", p: d.p, c: d.c, tw: d.tw, start: ev.t, pitches: {}, votes: {}, order: [], flames: {}, winner: null }); myVotes = {}; sentVotes = false; wrote = false; render(); break;
            case "pitch": if (d.r !== st.r || st.phase !== "write" || !roster.includes(ev.f) || st.pitches[ev.f]) return; st.pitches[ev.f] = String(d.txt || "").slice(0, 220); if (ev.f === me) wrote = true;
              if (wrote) render(); break;                        // keep my half-written pitch safe
            case "show":
              if (d.r !== st.r || st.phase !== "write") return;
              st.order = ctx.rng("pv" + st.r).shuffle(roster.filter((id) => st.pitches[id])); st.phase = "vote"; render(); break;
            case "votes": {
              if (d.r !== st.r || st.phase !== "vote" || !roster.includes(ev.f) || st.votes[ev.f] != null) return;
              const v = {}; Object.keys(d.v || {}).forEach((k) => { const i = Number(k), f = Math.max(0, Math.min(3, Number(d.v[k]) || 0)); if (st.order[i] && st.order[i] !== ev.f) v[i] = f; });
              st.votes[ev.f] = v; if (ev.f === me) sentVotes = true;
              if (sentVotes) render(); break;
            }
            case "results": {
              if (d.r !== st.r || st.phase !== "vote") return;
              st.flames = {}; st.order.forEach((id) => (st.flames[id] = 0));
              Object.keys(st.votes).forEach((voter) => Object.keys(st.votes[voter]).forEach((i) => { st.flames[st.order[i]] += st.votes[voter][i]; }));
              const top = Math.max(...st.order.map((id) => st.flames[id])); st.order.forEach((id) => { st.scores[id] += st.flames[id] + (st.flames[id] === top && top > 0 ? 2 : 0); });
              st.phase = "results"; if (live) { sfx.tada(); PP.ui.confetti({ count: 90, y: 0.25 }); } render(); break;
            }
            case "fin": if (st.phase === "fin") return; st.phase = "fin"; mount(ctx.el, W.finale(ctx, { scores: st.scores, unit: " 🔥", emoji: "💡", heading: "Shark Tank, but sillier!", sub: "Flames earned + 2 bonus for each winning pitch." })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
