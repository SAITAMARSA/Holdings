/* Story Chain — build a story one sentence at a time. Every few turns the dice add a twist you must include. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const TURN_MS = 70000, TITLE_MS = 40000;

  PP.registerGame({
    id: "story-chain", name: "Story Chain", emoji: "📖", color: "#B8E986",
    tagline: "One sentence each. Chaos guaranteed.",
    how: "The dice deal an opening line. Then you take turns adding one sentence each — and every few turns a twist card makes you include something ridiculous. Tap 😂 on the lines you love.",
    min: 2, max: 8, tags: ["silly", "creative", "storytelling"],
    options: [{ id: "len", label: "How long is the story?", kind: "choice", def: "3", choices: [{ v: "2", label: "Short" }, { v: "3", label: "Medium" }, { v: "4", label: "Long" }] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length;
      const total = Math.max(6, Math.min(16, n * Number(ctx.settings.len || 3)));
      const st = { phase: "wait", opener: 0, lines: [], t: -1, tw: null, start: 0, title: "", laughs: {}, scores: {}, q: {}, tstart: 0 };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {}, sent = false;
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);
      const writer = (t) => roster[t % n];
      const opener = () => PP.engine.get("story-opener", st.opener).t;

      const storyBox = () => {
        const box = el("div.story");
        box.appendChild(el("p.story-line.opener", opener()));
        st.lines.forEach((l, i) => {
          const p = ctx.player(l.f), key = i;
          const count = Object.keys(st.laughs[key] || {}).length;
          box.appendChild(el("p.story-line" + (l.filler ? ".filler" : ""), el("span", l.txt + " "),
            el("small.muted", "— " + (p ? p.name : "?") + " "),
            l.filler ? null : el("button.chip-btn.laugh" + ((st.laughs[key] || {})[me] ? ".on" : ""), { title: "That's funny", onclick: () => { if (l.f !== me && !(st.laughs[key] || {})[me]) { sfx.pop(); ctx.send("laugh", { i: key }); } } }, "😂" + (count ? " " + count : ""))));
        });
        return box;
      };

      function render() {
        ui = {};
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Finding the first line… 📖"));
        if (st.phase === "write") return viewWrite();
        if (st.phase === "title") return viewTitle();
      }

      function viewWrite() {
        const w = writer(st.t), mine = w === me, p = ctx.player(w);
        const timer = W.timer(ctx, st.tstart, TURN_MS, { onEnd: () => { if (ctx.isHost()) ctx.send("skip", { t: st.t }); else ctx.later(() => st.phase === "write" && ctx.send("skip", { t: st.t }), 5000); } });
        const last = st.t === total - 1;
        const twist = st.tw != null ? el("div.note.center", "🎲 Twist card: ", el("b", PP.engine.get("story-twist", st.tw).t)) : null;
        const area = el("div.card.stack");
        if (mine && !sent) {
          const box = el("textarea.in", { placeholder: last ? "Write the ENDING…" : "Add your sentence…", maxLength: 170 }), cnt = el("div.counter", "0 / 170");
          box.addEventListener("input", () => { cnt.textContent = box.value.length + " / 170"; go.disabled = box.value.trim().length < 3; });
          const go = el("button.btn.btn-big", { disabled: true, onclick: () => { sent = true; sfx.pop(); ctx.send("line", { t: st.t, txt: box.value.trim().slice(0, 170) }); } }, last ? "🎬 The end!" : "➕ Add it");
          mount(area, el("h3", "Your turn! ✍️"), twist, box, cnt, go);
        } else mount(area, el("div.center.stack", el("h3", mine ? "Added!" : (p ? p.name : "?") + " is writing…"), twist, W.waiting(ctx, [], mine ? "Passing the pen…" : "Think of a great reaction 😂")));
        mount(ctx.el, el("div.stack", el("div.row", { style: { justifyContent: "space-between" } }, el("span.badge", "Line " + (st.t + 1) + " / " + total), el("span.pchip", W.avatar(p, 26), el("b", p ? p.name : "?"), "✍️")), timer.el,
          el("div.card", ui.story = storyBox()), area));
      }

      function viewTitle() {
        const w = writer(total - 1), mine = w === me;
        const input = el("input.in", { placeholder: "A title for our masterpiece…", maxLength: 50 });
        const timer = W.timer(ctx, st.tstart, TITLE_MS, { onEnd: () => { if (ctx.isHost()) ctx.send("fin", {}); else ctx.later(() => st.phase === "title" && ctx.send("fin", {}), 5000); } });
        mount(ctx.el, el("div.stack", timer.el, el("div.card", storyBox()),
          el("div.card.stack.center", mine
            ? [el("h3", "You wrote the ending — name the story! 🏷️"), el("form.row", { style: { flexWrap: "nowrap" }, onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) ctx.send("title", { txt: input.value.trim().slice(0, 50) }); } }, el("div.grow", input), el("button.btn", { type: "submit" }, "Title it"))]
            : [el("h3", (ctx.player(w) || {}).name + " is naming the story…"), W.waiting(ctx, [])])));
      }

      function viewFinal() {
        const title = st.title || "A Tale Without a Name";
        const text = opener() + "\n" + st.lines.map((l) => l.txt).join("\n");
        const sc = {}; roster.forEach((id) => (sc[id] = 0));
        st.lines.forEach((l, i) => { sc[l.f] = (sc[l.f] || 0) + Object.keys(st.laughs[i] || {}).length; });
        mount(ctx.el, el("div.stack", el("div.card.stack.storybook", el("h1.center", "📖 " + title), storyBox(),
          el("div.row", { style: { justifyContent: "center" } }, el("button.btn.btn-sm.btn-acc", { onclick: (e) => { e.currentTarget.disabled = true; ctx.keep("story", title, { text: title + "\n\n" + text }); } }, "🧸 Keep this story"))),
          W.finale(ctx, { scores: sc, unit: " 😂", emoji: "📖", heading: "The End! 🎉", sub: "Scores = laughs your lines earned." })));
      }

      function startStory() { ctx.send("open", { i: ctx.draw("story-opener", 1)[0], tw: twistFor(0) }); }
      const twistFor = (t) => (t % 3 === 2 ? ctx.draw("story-twist", 1)[0] : null);
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.t === -1 && !st.q.first) { st.q.first = 1; startStory(); }
        if (st.phase === "title" && !st.q.tt) { st.q.tt = 1; }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "open": if (st.phase !== "wait") return; Object.assign(st, { phase: "write", opener: d.i, t: 0, tw: d.tw, tstart: ev.t }); sent = false; render(); break;
            case "line": {
              if (st.phase !== "write" || d.t !== st.t || ev.f !== writer(st.t)) return;
              st.lines.push({ f: ev.f, txt: String(d.txt || "").slice(0, 170) }); advance(ev, live); break;
            }
            case "skip": {
              if (st.phase !== "write" || d.t !== st.t) return;
              st.lines.push({ f: writer(st.t), txt: PP.engine.get("story-filler", Math.abs(st.t * 7) % PP.engine.size("story-filler")).t, filler: true }); advance(ev, live); break;
            }
            case "laugh": { const i = d.i; if (st.lines[i] && st.lines[i].f !== ev.f && !st.lines[i].filler) { (st.laughs[i] = st.laughs[i] || {})[ev.f] = 1; if (live && st.lines[i].f === me) { sfx.ding(); PP.ui.floatEmoji("😂", (ctx.player(ev.f) || {}).name, (ctx.player(ev.f) || {}).color); } if (st.phase === "write" && ui.story) mount(ui.story.parentNode, ui.story = storyBox()); } break; }
            case "title": if (st.phase === "title" && ev.f === writer(total - 1)) { st.title = String(d.txt || "").slice(0, 50); if (ctx.isHost()) ctx.later(() => ctx.send("fin", {}), 600); } break;
            case "fin": if (st.phase === "fin") return; st.phase = "fin"; viewFinal(); if (live) { sfx.tada(); } break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };

      function advance(ev, live) {
        if (live) sfx.ding();
        if (st.t + 1 >= total) { st.phase = "title"; st.tstart = ev.t; render(); return; }
        st.t++; st.tstart = ev.t; st.tw = null; sent = false;
        // the twist for the next turn is decided deterministically from the seed, so every phone agrees
        if (st.t % 3 === 2) st.tw = ctx.rng("tw" + st.t).int(PP.engine.size("story-twist"));
        render();
      }
    },
  });
})();
