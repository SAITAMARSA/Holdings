/* Mind Meld — you each get a different starting word. Everyone types a word that sits "between" the last ones. Meet in the middle! */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const MAX = 7, norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  PP.registerGame({
    id: "mind-meld", name: "Mind Meld", emoji: "🫠", color: "#FF9ED8", silent: "native",
    tagline: "Start with different words. Type the word between. Land on the SAME one!",
    how: "Each of you starts with a different word. Everybody types one new word that connects the words from last round. Keep going until you all type the exact same word. Fewer rounds = better mind-meld. Works silently!",
    min: 2, max: 4, tags: ["trust", "mind-reading", "silent", "words"],
    options: [],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const st = { r: 0, phase: "wait", hist: [], words: {}, q: {}, won: null, starts: null };
      let sent = false, ui = {};
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const nm = (id) => (ctx.player(id) || {}).name || "?";

      function row(words, cls) { return el("div.mm-row" + (cls || ""), roster.map((id) => el("div.mm-word", { style: { borderColor: (ctx.player(id) || {}).color } }, el("small", W.avatar(ctx.player(id), 20)), el("b", words[id] || "…")))); }
      function render() {
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Picking your starting words… 🫠"));
        const hist = st.hist.map((h, i) => row(h, i === 0 ? ".first" : ""));
        if (st.phase === "play") {
          const inp = el("input.in", { placeholder: "A word that connects them all…", maxLength: 20, autocapitalize: "off", disabled: sent });
          ui.inp = inp;
          const go = (e) => { e && e.preventDefault(); const w = norm(inp.value); if (!w || sent) return; sent = true; sfx.pop(); ctx.send("word", { r: st.r, w: inp.value.trim().slice(0, 20) }); render(); };
          mount(ctx.el, el("div.stack", el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", st.r === 0 ? "Starting words" : "Round " + st.r + " / " + MAX), el("span.badge", "🫠 Meld them")),
            el("div.card.stack.center", el("div.mm-hist", hist),
              st.r === 0 ? el("div.note", "Each player got a different word. Type one word that sits between them all — and hope everyone lands on the same one!") : el("div.note", "Not the same yet! Type a word between these."),
              sent ? W.waiting(ctx, present().filter((id) => !(st.words[id])).map(nm), "Locked in! Waiting for…") : el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: go }, el("div.grow", inp), el("button.btn", { type: "submit" }, "Lock in")))));
          if (!sent) setTimeout(() => inp.focus && inp.focus(), 50);
        } else {
          mount(ctx.el, el("div.stack", el("div.card.stack.center", el("div.mm-hist", hist),
            st.won ? [el("h2", "MIND MELD! 🫠✨"), el("div.note", "All of you landed on “" + st.won + "” in " + st.r + " round" + (st.r === 1 ? "" : "s") + "!")] : el("div.note", "Couldn't meld in " + MAX + " rounds — your brains are just too creative 😄")),
            W.waiting(ctx, [], "Wrapping up…")));
        }
      }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && !st.q.first) { st.q.first = 1; const words = ctx.draw("mind-words", n).map((i) => PP.engine.all("mind-words")[i].t); ctx.send("start", { words }); }
        if (st.phase === "play" && !st.q["rv" + st.r]) { const p = present(); if (p.length && p.every((id) => st.words[id])) { st.q["rv" + st.r] = 1; const r = st.r; ctx.later(() => ctx.send("reveal", { r }), 500); } }
        if (st.phase === "end" && !st.q.fin) { st.q.fin = 1; ctx.later(() => ctx.send("fin", {}), 6000); }
      }
      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {};
          switch (ev.type) {
            case "start": if (st.phase !== "wait" || !Array.isArray(d.words)) return; { const w = {}; roster.forEach((id, i) => (w[id] = String(d.words[i] || "word"))); st.hist = [w]; st.phase = "play"; st.r = 0; st.words = {}; sent = false; render(); } break;
            case "word": if (d.r === st.r && st.phase === "play" && roster.includes(ev.f) && !st.words[ev.f]) { st.words[ev.f] = String(d.w || "").slice(0, 20); } break;
            case "reveal": {
              if (d.r !== st.r || st.phase !== "play") return;
              st.hist.push(Object.assign({}, st.words)); st.r++;
              const vals = roster.map((id) => norm(st.words[id])).filter(Boolean);
              const same = vals.length >= 2 && vals.every((v) => v === vals[0]);
              if (same) { st.won = st.words[roster[0]]; st.phase = "end"; sfx.tada(); PP.ui.confetti({ count: 200 }); }
              else if (st.r >= MAX) { st.phase = "end"; sfx.sad(); } else { st.words = {}; sent = false; sfx.ding(); }
              render(); break;
            }
            case "fin": { if (st.phase === "fin") return; st.phase = "fin"; const sc = {}; roster.forEach((id) => (sc[id] = st.won ? Math.max(1, MAX + 1 - st.r) : 0)); mount(ctx.el, W.finale(ctx, { scores: sc, emoji: "🫠", heading: st.won ? "One mind, " + n + " bodies!" : "Almost melded!", sub: st.won ? "Melded in " + st.r + " round" + (st.r === 1 ? "" : "s") + " on “" + st.won + "”." : "Try again — new words every time." })); break; }
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
