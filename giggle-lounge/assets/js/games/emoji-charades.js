/* Emoji Charades — one person builds a movie / song / disaster out of emojis, everyone else guesses.
 * A person does the creative part; the game only deals the secret. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const BUILD_MS = 90000, MAX_EMOJI = 12;
  const CATS = { all: null, movies: "Movie", songs: "Song", food: "Food", places: "Place", phrases: "Phrase", disasters: "Everyday disaster" };

  PP.registerGame({
    id: "emoji-charades", name: "Emoji Charades", emoji: "🎭", color: "#FFD23F",
    tagline: "Say a movie, song or everyday disaster using only emojis.",
    how: "One of you builds a secret thing out of emojis — a film, a song, a disaster — and everyone else races to guess it. Terrible emoji choices are the whole point.",
    min: 2, max: 8, tags: ["silly", "guessing", "creative"],
    options: [
      { id: "cat", label: "What are we guessing?", kind: "choice", def: "all", choices: [{ v: "all", label: "🎲 Everything" }, { v: "movies", label: "🎬 Movies" }, { v: "songs", label: "🎵 Songs" }, { v: "food", label: "🍕 Food" }, { v: "places", label: "🌍 Places" }, { v: "phrases", label: "💬 Phrases" }, { v: "disasters", label: "🤦 Disasters" }] },
      { id: "rounds", label: "How long?", kind: "choice", def: "2", choices: [{ v: "1", label: "Quick (1 turn each)" }, { v: "2", label: "Normal (2 each)" }, { v: "3", label: "Long (3 each)" }] },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const total = Math.min(12, n * Number(ctx.settings.rounds || 2));
      const want = CATS[ctx.settings.cat || "all"];
      const deck = PP.engine.all("charades");
      const st = { r: -1, phase: "wait", giver: null, opts: [], secret: null, seq: [], guesses: [], solved: {}, order: [], scores: {}, hint: false, start: 0, queued: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {}, tab = Object.keys(PP.EMOJI)[0];
      const item = () => deck[st.secret];

      const present = () => roster.filter((id) => { const p = ctx.player(id); return p && p.present; });
      const guessers = () => roster.filter((id) => id !== st.giver);

      /* ---------- views ---------- */
      function render() {
        ui = {};
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Shuffling the emoji… 🎲"));
        if (st.phase === "pick") return viewPick();
        if (st.phase === "build") return viewBuild();
        if (st.phase === "reveal") return viewReveal();
      }
      const roundBar = () => el("div.row", { style: { justifyContent: "space-between" } },
        el("span.badge", "Round " + (st.r + 1) + " / " + total),
        el("span.pchip", W.avatar(ctx.player(st.giver), 26), el("b", (ctx.player(st.giver) || {}).name || "?"), "🎨"));

      function viewPick() {
        const mine = st.giver === me;
        mount(ctx.el, el("div.stack", roundBar(),
          mine
            ? el("div.card.stack", el("h3.phase-title", "Pick your secret 🤫"), el("p.muted", "Only you know which one you chose. Then build it out of emojis!"),
                st.opts.map((i) => el("button.opt-card", { onclick: () => { sfx.pop(); ctx.send("pick", { r: st.r, i }); } }, el("span.oc-emoji", "❓"), el("span.oc-text", el("b", deck[i].t), el("span", deck[i].c)))))
            : el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "🤫"), el("h3", (ctx.player(st.giver) || {}).name + " is choosing a secret…"), W.waiting(ctx, [], "Get your guessing face ready"))));
      }

      function viewBuild() {
        const mine = st.giver === me, it = item();
        const emo = el("div.big-emoji", st.seq.join("") || (mine ? "👆 tap emojis below" : "⏳ waiting for emojis…"));
        ui.emo = emo;
        const words = it.t.split(/\s+/).length;
        const hintTxt = el("div.note.center");
        const paintHint = () => { hintTxt.textContent = "Hint: " + it.c + " · " + words + (words === 1 ? " word" : " words") + (st.hint ? " · starts with “" + it.t[0].toUpperCase() + "”" : ""); };
        ui.paintHint = paintHint; paintHint();
        const timer = W.timer(ctx, st.start, BUILD_MS, { onEnd: () => { if (ctx.isHost()) ctx.send("reveal", { r: st.r }); else ctx.later(() => st.phase === "build" && ctx.send("reveal", { r: st.r }), 4000); } });

        if (mine) {
          const grid = el("div.emoji-grid");
          const tabs = el("div.tabs", Object.keys(PP.EMOJI).map((k) => el("button.tab" + (k === tab ? ".on" : ""), { onclick: () => { tab = k; fill(); Array.from(tabs.children).forEach((t) => t.classList.toggle("on", t.textContent === k)); } }, k)));
          const fill = () => mount(grid, PP.EMOJI[tab].map((e) => el("button", { type: "button", onclick: () => { if (st.seq.length >= MAX_EMOJI) return sfx.buzz(); sfx.tap(); const s = st.seq.concat([e]); ctx.send("emo", { r: st.r, seq: s }); } }, e)));
          fill();
          mount(ctx.el, el("div.stack", roundBar(), timer.el,
            el("div.card.stack", el("div.note", "Your secret: ", el("b", it.t), " — " + it.c), emo,
              el("div.row", { style: { justifyContent: "center" } },
                el("button.btn.btn-sm.btn-ghost", { onclick: () => st.seq.length && ctx.send("emo", { r: st.r, seq: st.seq.slice(0, -1) }) }, "⌫ Undo"),
                el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("emo", { r: st.r, seq: [] }) }, "🗑 Clear"),
                el("button.btn.btn-sm.btn-acc", { onclick: () => { if (!st.hint) ctx.send("hint", { r: st.r }); } }, "💡 Give a hint"),
                el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("reveal", { r: st.r }) }, "🏳️ Give up")),
              tabs, grid),
            el("div.card.stack", el("b", "Guesses"), ui.log = el("div.guess-log"), el("small.muted", "Tap ✅ on a guess to accept it if it's right but spelled differently."))));
          paintLog();
        } else {
          const input = el("input.in", { placeholder: "Type your guess…", maxLength: 60, autocomplete: "off", autocapitalize: "words" });
          const form = el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (!v || st.solved[me]) return; ctx.send("guess", { r: st.r, txt: v }); input.value = ""; } },
            el("div.grow", input), el("button.btn", { type: "submit" }, "Guess"));
          ui.form = form;
          mount(ctx.el, el("div.stack", roundBar(), timer.el,
            el("div.card.stack", emo, hintTxt, st.solved[me] ? el("div.note.center", "🎉 You got it! Sit tight while the others guess.") : form),
            el("div.card.stack", el("b", "Everyone's guesses"), ui.log = el("div.guess-log"))));
          paintLog();
          if (!st.solved[me]) setTimeout(() => input.focus(), 50);
        }
      }

      function paintLog() {
        if (!ui.log) return;
        const mine = st.giver === me;
        mount(ui.log, st.guesses.slice().reverse().map((g) => {
          const p = ctx.player(g.f);
          return el("div.guess" + (g.res === "ok" ? ".ok" : g.res === "close" ? ".close" : ""), W.avatar(p, 22), el("b", p ? p.name : "?"), el("span.grow", g.txt),
            g.res === "ok" ? "✅" : g.res === "close" ? "🤏 close!" : (mine ? el("button.chip-btn", { title: "That's right!", onclick: () => ctx.send("accept", { r: st.r, gid: g.id }) }, "✅") : ""));
        }));
      }

      function viewReveal() {
        const it = item();
        const gained = roster.filter((id) => st.solved[id] != null);
        mount(ctx.el, el("div.stack", roundBar(),
          el("div.card.center.stack", el("div.muted", "It was…"), el("h2", it.t), el("div.big-emoji", st.seq.join("")),
            gained.length ? el("p", "🎉 Guessed by " + gained.map((id) => (ctx.player(id) || {}).name).join(", ")) : el("p.muted", "Nobody got it — that's one tricky emoji story! 😅"),
            PP.engine.reactionBar("charades", st.secret)),
          el("div.card", W.scoreboard(ctx, st.scores)),
          W.waiting(ctx, [], st.r + 1 >= total ? "Wrapping up…" : "Next round in a moment…")));
      }

      /* ---------- the host moves things along ---------- */
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.queued.first) { st.queued.first = 1; startRound(0); }
        if (st.phase === "build" && !st.queued["rv" + st.r]) {
          const gs = guessers().filter((id) => present().includes(id));
          if (gs.length && gs.every((id) => st.solved[id] != null)) { st.queued["rv" + st.r] = 1; ctx.later(() => ctx.send("reveal", { r: st.r }), 900); }
        }
        if (st.phase === "pick" && !st.queued["pk" + st.r]) { st.queued["pk" + st.r] = 1; ctx.later(() => { if (st.phase === "pick") ctx.send("reveal", { r: st.r }); }, 40000); }
        if (st.phase === "reveal" && !st.queued["nx" + st.r]) {
          st.queued["nx" + st.r] = 1;
          const r = st.r;
          ctx.later(() => { if (st.r === r) (r + 1 >= total ? ctx.send("fin", {}) : startRound(r + 1)); }, 7500);
        }
      }
      function startRound(r) {
        const giver = roster[r % n];
        const opts = ctx.draw("charades", 3, { filter: (c) => !want || c.c === want, exclude: [] });
        ctx.send("round", { r, opts });
      }

      /* ---------- the log, folded ---------- */
      function markSolved(f, live) {
        if (st.solved[f] != null) return;
        st.solved[f] = st.order.length; st.order.push(f);
        const pts = [3, 2, 1][Math.min(2, st.order.length - 1)];
        st.scores[f] += pts; st.scores[st.giver] += 1;
        if (live) { sfx.ding(); if (f === me) PP.ui.confetti({ count: 60, y: 0.3 }); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "round":
              if (d.r !== st.r + 1) return;
              Object.assign(st, { r: d.r, phase: "pick", giver: roster[d.r % n], opts: d.opts, secret: null, seq: [], guesses: [], solved: {}, order: [], hint: false });
              if (live && st.giver === me) sfx.whoosh();
              render(); break;
            case "pick":
              if (d.r !== st.r || st.phase !== "pick" || ev.f !== st.giver) return;
              if (!st.opts.includes(d.i)) return;
              st.secret = d.i; st.phase = "build"; st.start = ev.t; render(); break;
            case "emo":
              if (d.r !== st.r || st.phase !== "build" || ev.f !== st.giver) return;
              st.seq = d.seq.slice(0, MAX_EMOJI);
              if (ui.emo) ui.emo.textContent = st.seq.join("") || "👆 tap emojis below";
              break;
            case "hint":
              if (d.r !== st.r || st.phase !== "build") return;
              st.hint = true; ui.paintHint && ui.paintHint(); break;
            case "guess": {
              if (d.r !== st.r || st.phase !== "build" || ev.f === st.giver || st.solved[ev.f] != null) return;
              const it = item(), res = PP.match(d.txt, it.t, it.a);
              st.guesses.push({ id: ev.s, f: ev.f, txt: String(d.txt).slice(0, 60), res });
              if (res === "ok") { markSolved(ev.f, live); if (ev.f === me) render(); }
              paintLog(); break;
            }
            case "accept": {
              if (d.r !== st.r || st.phase !== "build" || ev.f !== st.giver) return;
              const g = st.guesses.find((x) => x.id === d.gid);
              if (g && g.res !== "ok" && st.solved[g.f] == null) { g.res = "ok"; markSolved(g.f, live); if (g.f === me) render(); paintLog(); }
              break;
            }
            case "reveal":
              if (d.r !== st.r || (st.phase !== "build" && st.phase !== "pick")) return;
              if (st.secret == null) st.secret = st.opts[0];
              st.phase = "reveal"; render(); break;
            case "fin":
              if (st.phase === "fin") return;
              st.phase = "fin";
              mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🎭", heading: "What a performance!", sub: "Most emojis were questionable. Every guess was glorious." }));
              break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
