/* Two Truths and a Fib — write three things about yourself, one of them fibbed. Everyone guesses the fib. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const WRITE_MS = 150000;

  PP.registerGame({
    id: "two-truths", name: "Two Truths & a Fib", emoji: "🤥", color: "#7FE3C3",
    tagline: "Write two true things and one fib. Can they spot it?",
    how: "Everyone secretly writes three statements about themselves — two true, one fib. Then you take turns: the others vote for the fib. Fool them and you score!",
    min: 2, max: 8, tags: ["talky", "sneaky", "funny"], options: [],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const st = { phase: "write", start: ctx.startT, stmts: {}, authors: [], k: -1, votes: {}, scores: {}, q: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let drafted = false, topic = PP.engine.draw("truth-topic", 1, { noLearn: true })[0];
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const perm = (author) => ctx.rng("tt" + author).shuffle([0, 1, 2]);

      function render() {
        if (st.phase === "write") return viewWrite();
        if (st.phase === "vote") return viewVote();
        if (st.phase === "reveal") return viewReveal();
      }

      function viewWrite() {
        if (drafted || st.stmts[me]) {
          const waiting = present().filter((id) => !st.stmts[id]).map((id) => (ctx.player(id) || {}).name);
          return mount(ctx.el, el("div.stack", el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "🤐"), el("h3", "Safely hidden!"), W.waiting(ctx, waiting))));
        }
        const inputs = [0, 1, 2].map((i) => el("input.in", { placeholder: "Statement " + (i + 1), maxLength: 90, autocomplete: "off" }));
        let lie = -1; const lieBtns = [0, 1, 2].map((i) => el("button.pill", { type: "button", onclick: () => { lie = i; sfx.tap(); lieBtns.forEach((b, k) => b.classList.toggle("on", k === i)); check(); } }, "🤥 This is the fib"));
        const send = el("button.btn.btn-big", { disabled: true, onclick: () => { drafted = true; sfx.pop(); ctx.send("stmts", { a: inputs.map((x) => x.value.trim().slice(0, 90)), lie }); render(); } }, "🤫 Lock them in");
        const check = () => { send.disabled = !(lie >= 0 && inputs.every((x) => x.value.trim().length >= 2)); };
        inputs.forEach((x) => x.addEventListener("input", check));
        const topicBox = el("div.note.row", el("span", "🎲 Need ideas? Try: ", el("b", PP.engine.get("truth-topic", topic).t)),
          el("button.chip-btn", { type: "button", onclick: () => { topic = PP.engine.draw("truth-topic", 1, { noLearn: true })[0]; mount(topicBox, el("span", "🎲 Need ideas? Try: ", el("b", PP.engine.get("truth-topic", topic).t))); sfx.dice(); } }, "🎲"));
        const timer = W.timer(ctx, st.start, WRITE_MS, { onEnd: () => { if (ctx.isHost()) ctx.send("begin", {}); else ctx.later(() => st.phase === "write" && ctx.send("begin", {}), 4000); } });
        mount(ctx.el, el("div.stack", timer.el, el("div.card.stack", el("h2", "Write your three"), el("p.muted", "Two true, one fib. Make the fib sound just as believable!"), topicBox,
          [0, 1, 2].map((i) => el("div.stack", inputs[i], lieBtns[i])), send)));
      }

      function viewVote() {
        const a = st.authors[st.k], p = ctx.player(a), s = st.stmts[a], order = perm(a), mineA = a === me, voted = st.votes[me] != null;
        const waiting = roster.filter((id) => id !== a && !st.votes[id] && present().includes(id)).map((id) => (ctx.player(id) || {}).name);
        mount(ctx.el, el("div.stack", el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Round " + (st.k + 1) + " / " + st.authors.length), el("span.pchip", W.avatar(p, 26), el("b", p ? p.name : "?"))),
          el("div.card.stack", el("h2", mineA ? "Your statements 🤫" : "Which one is " + (p ? p.name : "?") + "'s fib?"),
            order.map((i) => mineA || voted
              ? el("div.truth" + (st.votes[me] === i ? ".picked" : ""), s.a[i], mineA ? (i === s.lie ? el("span.badge", "🤥 your fib") : null) : (st.votes[me] === i ? el("span.badge", "your vote") : null))
              : el("button.truth", { onclick: () => { sfx.pop(); ctx.send("vote", { k: st.k, i }); } }, s.a[i])),
            mineA ? el("p.muted", "Keep a poker face… 😏") : null,
            W.waiting(ctx, waiting))));
      }

      function viewReveal() {
        const a = st.authors[st.k], p = ctx.player(a), s = st.stmts[a], order = perm(a);
        const voters = roster.filter((id) => st.votes[id] != null);
        const fooled = voters.filter((id) => st.votes[id] !== s.lie), right = voters.filter((id) => st.votes[id] === s.lie);
        mount(ctx.el, el("div.stack", el("span.pchip", W.avatar(p, 26), el("b", p ? p.name : "?")),
          el("div.card.stack", order.map((i) => el("div.truth" + (i === s.lie ? ".fib" : ".true"), (i === s.lie ? "🤥 " : "✅ ") + s.a[i])),
            el("p", right.length ? "🕵️ Spotted it: " + right.map((id) => (ctx.player(id) || {}).name).join(", ") : "Nobody spotted it! 😈"),
            fooled.length ? el("p.muted", "Fooled: " + fooled.map((id) => (ctx.player(id) || {}).name).join(", ")) : null),
          el("div.card", W.scoreboard(ctx, st.scores)), W.waiting(ctx, [], st.k + 1 >= st.authors.length ? "Wrapping up…" : "Next person in a moment…")));
      }

      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "write" && !st.q.begin) { const need = present(); if (need.length && need.every((id) => st.stmts[id])) { st.q.begin = 1; ctx.later(() => ctx.send("begin", {}), 800); } }
        if (st.phase === "vote" && !st.q["rv" + st.k]) {
          const a = st.authors[st.k], need = present().filter((id) => id !== a);
          if (!need.length || need.every((id) => st.votes[id] != null)) { st.q["rv" + st.k] = 1; ctx.later(() => ctx.send("reveal", { k: st.k }), 700); }
          else if (!st.q["to" + st.k]) { st.q["to" + st.k] = 1; ctx.later(() => st.phase === "vote" && ctx.send("reveal", { k: st.k }), 45000); }
        }
        if (st.phase === "reveal" && !st.q["nx" + st.k]) { st.q["nx" + st.k] = 1; const k = st.k; ctx.later(() => { if (st.k === k) (k + 1 >= st.authors.length ? ctx.send("fin", {}) : ctx.send("next", { k: k + 1 })); }, 8500); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "stmts": {
              if (st.phase !== "write" || !roster.includes(ev.f) || st.stmts[ev.f]) return;
              const a = (d.a || []).map((x) => String(x).slice(0, 90)); if (a.length !== 3 || !(d.lie >= 0 && d.lie < 3)) return;
              st.stmts[ev.f] = { a, lie: d.lie }; if (ev.f === me) drafted = true;
              if (drafted) render(); break;                      // never rebuild a form someone is typing in
            }
            case "begin":
              if (st.phase !== "write") return;
              st.authors = roster.filter((id) => st.stmts[id]);
              if (st.authors.length < 1) { ctx.send("fin", {}); return; }
              st.phase = "vote"; st.k = 0; st.votes = {}; render(); break;
            case "vote": {
              const a = st.authors[st.k]; if (st.phase !== "vote" || d.k !== st.k || ev.f === a || !roster.includes(ev.f) || st.votes[ev.f] != null || !(d.i >= 0 && d.i < 3)) return;
              st.votes[ev.f] = d.i; render(); break;
            }
            case "reveal": {
              if (st.phase !== "vote" || d.k !== st.k) return;
              const a = st.authors[st.k], s = st.stmts[a];
              roster.forEach((id) => { if (st.votes[id] == null) return; if (st.votes[id] === s.lie) st.scores[id] += 2; else st.scores[a] += 1; });
              st.phase = "reveal"; if (live) { sfx.ding(); } render(); break;
            }
            case "next": if (st.phase === "reveal" && d.k === st.k + 1) { st.k = d.k; st.votes = {}; st.phase = "vote"; render(); } break;
            case "fin":
              if (st.phase === "fin") return; st.phase = "fin";
              mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🤥", heading: "Master fibbers & detectives!", sub: "Spot the fib: 2 points. Fool a friend: 1 point each." })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
