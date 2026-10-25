/* Describe It — describe the movie (or show, or thing) without saying its words. Talk it out on your call,
 * or type clues. Guess out loud or type it in. The dice add one silly rule to every turn. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const READY_MS = 3000;

  PP.registerGame({
    id: "describe-it", name: "Describe It", emoji: "🎬", color: "#FF9ECF",
    tagline: "Describe the movie without saying its words. The dice add a silly rule.",
    how: "Take turns describing a card to the others — no saying any word that's on it! Every turn the dice hand you one ridiculous rule, like pirate voice. Guess out loud on your call, or type it in.",
    min: 2, max: 8, tags: ["silly", "talky", "movies"],
    options: [
      { id: "deck", label: "What's on the cards?", kind: "choice", def: "all", choices: [{ v: "all", label: "🎲 Mix" }, { v: "Movies", label: "🎬 Movies" }, { v: "Cartoons", label: "🐭 Cartoons" }, { v: "TV", label: "📺 TV" }, { v: "Things", label: "🎈 Things" }] },
      { id: "secs", label: "Time per turn", kind: "choice", def: "60", choices: [{ v: "45", label: "45s" }, { v: "60", label: "60s" }, { v: "90", label: "90s" }] },
      { id: "turns", label: "Turns each", kind: "choice", def: "1", choices: [{ v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3", label: "3" }] },
    ],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const total = Math.min(12, n * Number(ctx.settings.turns || 1)), DUR = Number(ctx.settings.secs || 60) * 1000;
      const want = ctx.settings.deck && ctx.settings.deck !== "all" ? ctx.settings.deck : null;
      const deck = PP.engine.all("describe"), twists = PP.engine.all("describe-twists");
      const st = { t: -1, phase: "wait", giver: null, card: null, cv: 0, twist: null, die: 1, start: 0, got: 0, skips: 0, clues: [], guesses: [], scores: {}, team: 0, q: {}, flash: "" };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {};

      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);

      /* ---------- views ---------- */
      function render() {
        ui = {};
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Dealing the cards… 🎬"));
        if (st.phase === "ready") return viewReady();
        if (st.phase === "play") return viewPlay();
        if (st.phase === "tally") return viewTally();
      }
      const head = () => el("div.row", { style: { justifyContent: "space-between" } },
        el("span.badge", "Turn " + (st.t + 1) + " / " + total), el("span.pchip", W.avatar(ctx.player(st.giver), 26), el("b", (ctx.player(st.giver) || {}).name), "🎤"),
        el("span.badge", "Team: " + st.team + " 🎯"));

      function viewReady() {
        const die = el("div.die", "🎲"), line = el("h3", "Rolling for a silly rule…");
        mount(ctx.el, el("div.stack", head(), el("div.card.center.stack", die, line, el("p.muted", st.giver === me ? "You're up! Don't say any word on the card." : (ctx.player(st.giver) || {}).name + " is up — get your guessing voice ready."))));
        PP.ui.rollDice(die, st.die, () => { line.textContent = twists[st.twist].t; sfx.ding(); });
      }

      function viewPlay() {
        const mine = st.giver === me, tw = twists[st.twist];
        const timer = W.timer(ctx, st.start, DUR, { onEnd: () => { if (ctx.isHost()) ctx.send("end", { t: st.t }); else ctx.later(() => st.phase === "play" && ctx.send("end", { t: st.t }), 4000); } });
        const twistBar = el("div.note.center", "🎲 Rule: ", el("b", tw.t));
        const cardBox = el("div.big-card"); ui.card = cardBox;
        const clueBox = el("div.guess-log"); ui.clues = clueBox;
        if (mine) {
          const input = el("input.in", { placeholder: "Optional: type a clue (no card words!)", maxLength: 70, autocomplete: "off" });
          const guessers = roster.filter((id) => id !== me);
          const gotRow = el("div.row", { style: { justifyContent: "center" } });
          ui.gotRow = gotRow;
          mount(ctx.el, el("div.stack", head(), timer.el, twistBar, cardBox,
            el("div.card.stack", el("div.row", { style: { justifyContent: "center" } },
              el("button.btn.btn-good", { onclick: () => { if (st.card == null) return; if (guessers.length === 1) ctx.send("got", { cv: st.cv, who: guessers[0] }); else { gotRow.classList.remove("hide"); } } }, "✅ Got it!"),
              el("button.btn.btn-ghost", { onclick: () => st.card != null && st.skips < 3 && ctx.send("skip", { cv: st.cv }) }, ui.skipLbl = el("span", "⏭ Skip")),
            ),
            mount(gotRow, el("span.muted", "Who got it?"), guessers.map((id) => el("button.chip-btn", { onclick: () => { gotRow.classList.add("hide"); ctx.send("got", { cv: st.cv, who: id }); } }, W.avatar(ctx.player(id), 26)))),
            el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) { ctx.send("clue", { cv: st.cv, txt: input.value.trim() }); input.value = ""; } } }, el("div.grow", input), el("button.btn.btn-sm", { type: "submit" }, "Send"))),
            el("div.card.stack", el("b", "Guesses so far"), ui.log = el("div.guess-log"))));
          gotRow.classList.add("hide");
        } else {
          const input = el("input.in", { placeholder: "Type your guess…", maxLength: 60, autocomplete: "off" });
          mount(ctx.el, el("div.stack", head(), timer.el, twistBar, cardBox,
            el("div.card.stack", clueBox,
              el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (v && st.card != null) { ctx.send("guess", { cv: st.cv, txt: v }); input.value = ""; } } }, el("div.grow", input), el("button.btn", { type: "submit" }, "Guess")),
              el("button.btn.btn-bad.btn-sm", { onclick: () => st.card != null && ctx.send("buzz", { cv: st.cv }) }, "🚨 Banned word!")),
            el("div.card.stack", el("b", "Guesses"), ui.log = el("div.guess-log"))));
        }
        paintCard(); paintLog(); paintClues();
      }

      function paintCard() {
        if (!ui.card) return;
        const mine = st.giver === me;
        if (st.card == null) { mount(ui.card, el("h2", st.flash || "…"), el("p.muted", "Next card coming up")); return; }
        const it = deck[st.card];
        if (mine) {
          mount(ui.card, el("div.muted", it.c), el("h1", { style: { margin: "6px 0", fontSize: "clamp(1.8rem,8vw,2.6rem)" } }, it.t),
            el("div.muted", "Don't say:"), el("div.row", { style: { justifyContent: "center", marginTop: "6px" } }, PP.bannedWords(it.t).map((w) => el("span.badge", { style: { background: "#FFD6E0" } }, "🚫 " + w))));
          if (ui.skipLbl) ui.skipLbl.textContent = "⏭ Skip (" + (3 - st.skips) + " left)";
        } else mount(ui.card, el("div.muted", it.c), el("h2", "🤫 ???"), el("p.muted", "Listen up — guess out loud, or type it below"));
      }
      function paintLog() {
        if (!ui.log) return;
        mount(ui.log, st.guesses.slice(-8).reverse().map((g) => el("div.guess" + (g.res === "ok" ? ".ok" : g.res === "close" ? ".close" : ""), W.avatar(ctx.player(g.f), 22), el("b", (ctx.player(g.f) || {}).name), el("span.grow", g.txt), g.res === "ok" ? "✅" : g.res === "close" ? "🤏" : "")));
      }
      function paintClues() {
        if (!ui.clues) return;
        mount(ui.clues, st.clues.slice(-3).reverse().map((c) => el("div.guess", "💬 ", el("span.grow", c))));
      }

      function viewTally() {
        mount(ctx.el, el("div.stack", head(), el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "⏰"), el("h2", "Time's up!"),
          el("p", st.got + (st.got === 1 ? " card" : " cards") + " guessed this turn" + (st.got >= 5 ? " 🔥" : st.got === 0 ? " — that's a tricky one 😅" : "!"))),
          el("div.card", W.scoreboard(ctx, st.scores)), W.waiting(ctx, [], st.t + 1 >= total ? "Wrapping up…" : "Next turn in a moment…")));
      }

      /* ---------- host ---------- */
      function dealCard() { return ctx.draw("describe", 1, { filter: (c) => !want || c.c === want })[0]; }
      function startTurn(t) {
        ctx.send("turn", { t, card: dealCard(), twist: ctx.draw("describe-twists", 1)[0], die: PP.RNG.secure().die(6) });
      }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.t === -1 && !st.q.first) { st.q.first = 1; startTurn(0); }
        if (st.phase === "play" && st.card == null && !st.q["c" + st.cv]) { st.q["c" + st.cv] = 1; const cv = st.cv; ctx.later(() => st.cv === cv && st.card == null && ctx.send("card", { cv, i: dealCard() }), 900); }
        if (st.phase === "tally" && !st.q["n" + st.t]) { st.q["n" + st.t] = 1; const t = st.t; ctx.later(() => { if (st.t === t) (t + 1 >= total ? ctx.send("fin", {}) : startTurn(t + 1)); }, 6500); }
      }

      function scoreGot(who, live) {
        st.got++; st.team++; st.scores[st.giver]++; if (who && who !== st.giver) st.scores[who]++;
        st.cv++; st.card = null; st.flash = "✅ Nice one!";
        if (live) { sfx.ding(); PP.ui.confetti({ count: 40, y: 0.3 }); }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "turn":
              if (d.t !== st.t + 1) return;
              Object.assign(st, { t: d.t, giver: roster[d.t % n], card: d.card, cv: 0, twist: d.twist, die: d.die, phase: "ready", start: ev.t + READY_MS, got: 0, skips: 0, clues: [], guesses: [], flash: "" });
              render();
              ctx.later(() => { if (st.phase === "ready" && st.t === d.t) { st.phase = "play"; render(); } }, READY_MS);
              break;
            case "card": if (d.cv === st.cv && st.card == null) { st.card = d.i; paintCard(); } break;
            case "clue": if (d.cv === st.cv && ev.f === st.giver) { st.clues.push(d.txt); paintClues(); } break;
            case "guess": {
              if (st.phase !== "play" || d.cv !== st.cv || st.card == null || ev.f === st.giver) return;
              const it = deck[st.card], res = PP.match(d.txt, it.t, it.a);
              st.guesses.push({ f: ev.f, txt: String(d.txt).slice(0, 60), res });
              if (res === "ok") scoreGot(ev.f, live); paintCard(); paintLog(); break;
            }
            case "got": if (st.phase === "play" && d.cv === st.cv && ev.f === st.giver && st.card != null) { scoreGot(d.who, live); paintCard(); } break;
            case "skip": if (st.phase === "play" && d.cv === st.cv && ev.f === st.giver && st.skips < 3 && st.card != null) { st.skips++; st.cv++; st.card = null; st.flash = "⏭ Skipped"; paintCard(); } break;
            case "buzz": if (st.phase === "play" && d.cv === st.cv && ev.f !== st.giver && st.card != null) { st.cv++; st.card = null; st.flash = "🚨 BZZT! Banned word!"; if (live) { sfx.buzz(); ctx.el.classList.add("shake-me"); setTimeout(() => ctx.el.classList.remove("shake-me"), 700); } paintCard(); } break;
            case "end": if (d.t === st.t && st.phase === "play") { st.phase = "tally"; render(); } break;
            case "fin":
              if (st.phase === "fin") return; st.phase = "fin";
              mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🎬", heading: "That's a wrap! 🎬", sub: "Team total: " + st.team + " cards guessed" })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
