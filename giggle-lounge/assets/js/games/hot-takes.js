/* Hot Takes — everyone secretly ranks the same five silly things, then you all reveal at once.
 * No right answers. The fun is the argument about why you put pineapple first. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const VERDICT = [[88, "Soulmates 💞", "You think scarily alike."], [72, "Telepathic ✨", "Basically one brain in two bodies."], [55, "Charming chaos 🌀", "Similar-ish, with delightful surprises."], [38, "Delightfully different 🌈", "Opposites make the best arguments."], [0, "Opposites attract 🧲", "Wow. Who raised you two?"]];
  const DEFEND = ["Defend your #1 out loud! 🎤", "Whoever ranked it last must explain themselves. 🧐", "Argue for your top pick in a movie-trailer voice. 🎬", "Convince the others to switch — you have 20 seconds. ⏱️", "Say your #1 like it's a very serious award speech. 🏆"];

  PP.registerGame({
    id: "hot-takes", name: "Hot Takes", emoji: "🌶️", color: "#FF9F5C",
    tagline: "Secretly rank five silly things. Reveal together. Argue lovingly.",
    how: "You all see the same five things. Rank them in secret, then everyone's list is revealed at once. See where you agree, and who had the spiciest take.",
    min: 2, max: 8, tags: ["silly", "no wrong answers", "chatty"],
    options: [{ id: "rounds", label: "How many?", kind: "choice", def: "5", choices: [{ v: "3", label: "3 takes" }, { v: "5", label: "5 takes" }, { v: "7", label: "7 takes" }] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, total = Number(ctx.settings.rounds || 5);
      const deck = PP.engine.all("ranks");
      const st = { r: -1, phase: "wait", i: null, sub: {}, scores: {}, harmony: [], q: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let mine = [], locked = false;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);

      /* ----- math ----- */
      const pos = (order) => { const p = []; order.forEach((item, rank) => (p[item] = rank)); return p; };
      const agree = (a, b) => { const pa = pos(a), pb = pos(b); let s = 0; for (let k = 0; k < 5; k++) s += Math.abs(pa[k] - pb[k]); return 1 - s / 12; };
      function stats() {
        const ids = roster.filter((id) => st.sub[id]);
        const per = {}; ids.forEach((id) => (per[id] = []));
        const pairs = [];
        for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) { const a = agree(st.sub[ids[x]], st.sub[ids[y]]); pairs.push(a); per[ids[x]].push(a); per[ids[y]].push(a); }
        const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 1);
        const sim = {}; ids.forEach((id) => (sim[id] = Math.round(mean(per[id]) * 100)));
        let spicy = null;
        for (let k = 0; k < 5; k++) {
          const ps = ids.map((id) => pos(st.sub[id])[k]), spread = Math.max(...ps) - Math.min(...ps);
          if (!spicy || spread > spicy.spread) spicy = { k, spread, hi: ids[ps.indexOf(Math.min(...ps))], lo: ids[ps.indexOf(Math.max(...ps))], a: Math.min(...ps), b: Math.max(...ps) };
        }
        return { ids, sim, harmony: Math.round(mean(pairs) * 100), spicy };
      }

      /* ----- views ----- */
      function render() {
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Warming up some hot takes… 🌶️"));
        if (st.phase === "rank") return viewRank();
        if (st.phase === "reveal") return viewReveal();
      }
      const head = () => el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Take " + (st.r + 1) + " / " + total), el("span.badge", "🌶️ " + (st.harmony.length ? Math.round(st.harmony.reduce((a, b) => a + b, 0) / st.harmony.length) + "% in sync" : "let's see…")));

      function viewRank() {
        const it = deck[st.i];
        if (locked) {
          const waiting = present().filter((id) => !st.sub[id]).map((id) => (ctx.player(id) || {}).name);
          return mount(ctx.el, el("div.stack", head(), el("div.card.center.stack", el("h3", it.t), el("div", { style: { fontSize: "2.6rem" } }, "🔒"), el("p", "Locked in! Poker face on."), W.waiting(ctx, waiting))));
        }
        const list = el("div.stack"), chosen = el("div.row", { style: { minHeight: "42px" } });
        const lock = el("button.btn.btn-big", { disabled: true, onclick: () => { locked = true; sfx.pop(); ctx.send("rank", { r: st.r, order: mine.slice() }); render(); } }, "🔒 Lock it in");
        const paint = () => {
          mount(list, it.i.map((label, k) => { const at = mine.indexOf(k); return el("button.rank-item" + (at >= 0 ? ".on" : ""), { onclick: () => { if (at >= 0) mine.splice(at, 1); else mine.push(k); sfx.tap(); paint(); } }, el("span.rank-n", at >= 0 ? at + 1 : "·"), el("span", label)); }));
          mount(chosen, el("span.muted", "Best → worst: "), mine.map((k) => el("span.badge", it.i[k].split(" ")[0] + (it.i[k].split(" ").length > 1 ? "" : ""))));
          lock.disabled = mine.length !== 5;
        };
        mount(ctx.el, el("div.stack", head(), el("div.card.stack", el("h2", it.t), el("p.muted", "Tap in order: 1st = best. Tap again to undo."), list, chosen, lock)));
        paint();
      }

      function viewReveal() {
        const it = deck[st.i], S = stats(), verdict = VERDICT.find((v) => S.harmony >= v[0]);
        const cols = el("div.takes", S.ids.map((id) => {
          const order = st.sub[id], p = ctx.player(id);
          return el("div.take-col", el("div.row", W.avatar(p, 26), el("b", p ? p.name : "?")),
            order.map((item, rank) => {
              const same = S.ids.every((o) => st.sub[o][rank] === item);
              return el("div.take-row" + (same ? ".same" : ""), el("span.rank-n", rank + 1), el("span", it.i[item]), same ? "✨" : "");
            }));
        }));
        const sp = S.spicy, hi = ctx.player(sp.hi), lo = ctx.player(sp.lo);
        mount(ctx.el, el("div.stack", head(), el("div.card.stack.center", el("h3", it.t), el("div.harmony", el("div.harmony-fill", { style: { width: S.harmony + "%" } }), el("span", S.harmony + "% in sync")),
          cols,
          sp.spread > 1 && S.ids.length > 1 ? el("div.note", "🌶️ Spiciest take: ", el("b", it.i[sp.k]), " — #" + (sp.a + 1) + " for " + (hi ? hi.name : "?") + ", #" + (sp.b + 1) + " for " + (lo ? lo.name : "?") + " 😱") : el("div.note", "✨ Wow — no real disagreements!"),
          el("div.muted", DEFEND[(st.i + st.r) % DEFEND.length]), PP.engine.reactionBar("ranks", st.i)),
          el("div.card", W.scoreboard(ctx, st.scores, { unit: " in sync", fmt: (x) => (st.harmony.length ? Math.round(x / st.harmony.length) : 0) })),
          W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next take in a moment…")));
        if (S.harmony >= 85) { sfx.tada(); PP.ui.confetti({ count: 70, y: 0.3 }); } else sfx.ding();
      }

      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; ctx.send("deal", { r: 0, i: ctx.draw("ranks", 1)[0] }); }
        if (st.phase === "rank" && !st.q["rv" + st.r]) {
          const need = present();
          if (need.length && need.every((id) => st.sub[id])) { st.q["rv" + st.r] = 1; ctx.later(() => ctx.send("reveal", { r: st.r }), 700); }
          else if (!st.q["to" + st.r]) { st.q["to" + st.r] = 1; ctx.later(() => st.phase === "rank" && ctx.send("reveal", { r: st.r }), 120000); }
        }
        if (st.phase === "reveal" && !st.q["ad" + st.r]) { st.q["ad" + st.r] = 1; const r = st.r; ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : ctx.send("deal", { r: r + 1, i: ctx.draw("ranks", 1)[0] })); }, 11000); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {};
          switch (ev.type) {
            case "deal": if (d.r !== st.r + 1) return; Object.assign(st, { r: d.r, phase: "rank", i: d.i, sub: {} }); mine = []; locked = false; render(); break;
            case "rank": {
              if (d.r !== st.r || st.phase !== "rank" || !roster.includes(ev.f) || st.sub[ev.f]) return;
              const o = d.order; if (!Array.isArray(o) || o.length !== 5 || new Set(o).size !== 5 || o.some((x) => !(x >= 0 && x < 5))) return;
              st.sub[ev.f] = o; if (ev.f === me) locked = true;
              if (locked) render(); break;
            }
            case "reveal": {
              if (d.r !== st.r || st.phase !== "rank") return;
              st.phase = "reveal"; const S = stats(); st.harmony.push(S.harmony); S.ids.forEach((id) => (st.scores[id] += S.sim[id])); render(); break;
            }
            case "fin": {
              if (st.phase === "fin") return; st.phase = "fin";
              const avg = st.harmony.length ? Math.round(st.harmony.reduce((a, b) => a + b, 0) / st.harmony.length) : 0, v = VERDICT.find((x) => avg >= x[0]);
              const sc = {}; roster.forEach((id) => (sc[id] = st.harmony.length ? Math.round(st.scores[id] / st.harmony.length) : 0));
              mount(ctx.el, W.finale(ctx, { scores: sc, unit: "% in sync", emoji: "🌶️", heading: v[1], sub: "Overall " + avg + "% in sync. " + v[2] })); break;
            }
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
