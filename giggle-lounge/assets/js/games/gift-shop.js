/* Gift Shop — the dice deal you a person, an occasion and a budget. You build them a gift out of silly emoji
 * items, wrap it, write a note — then they open it and tell you what they really think. Human-made, not machine-made. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const PAPERS = ["#FF5CA8", "#FFD23F", "#2EE6A6", "#4DB8FF", "#A66CFF", "#FF9F1C", "#FF6B6B", "#9BE564"];
  const RIBBONS = ["🎀", "🌟", "💖", "🪩", "🌈", "🍬", "🎈", "🦋"];
  const RATES = [["😍", "Love it!", 3], ["😐", "Meh", 1], ["🙃", "Return to sender", 0]];
  const MAX_ITEMS = 6;

  PP.registerGame({
    id: "gift-shop", name: "Gift Shop", emoji: "🎁", color: "#C9A7FF",
    tagline: "The dice pick a person and a budget. Build the silliest gift.",
    how: "The dice tell you who to shop for, the occasion, and your budget. Build them a gift from absurd emoji items, wrap it, write a note — then they open it and give their honest reaction.",
    min: 2, max: 8, tags: ["silly", "creative", "kind"],
    options: [{ id: "rounds", label: "Rounds of gifting", kind: "choice", def: "1", choices: [{ v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3", label: "3" }] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, myIdx = roster.indexOf(me);
      const total = Math.min(3, Number(ctx.settings.rounds || 1));
      const ITEMS = PP.GIFT_ITEMS;
      const st = { r: -1, phase: "wait", sc: null, gifts: {}, open: 0, rated: {}, scores: {}, q: {} };
      roster.forEach((id) => (st.scores[id] = 0));
      let ui = {}, cart = [], paper = 0, ribbon = 0, submitted = false;

      const recipientIdx = (i, r) => (i + 1 + (r % Math.max(1, n - 1))) % n;
      const recipient = (giverIdx) => roster[recipientIdx(giverIdx, st.r)];
      const budgetFor = (giverIdx) => PP.engine.get("gift-budget", st.sc[recipientIdx(giverIdx, st.r)].b).t;
      const cost = () => cart.reduce((s, i) => s + ITEMS[i][2], 0);
      const present = () => roster.filter((id) => (ctx.player(id) || {}).present);

      function render() {
        ui = {};
        if (st.phase === "wait") return mount(ctx.el, W.waiting(ctx, [], "Opening the shop… 🛍️"));
        if (st.phase === "shop") return viewShop();
        if (st.phase === "open") return viewOpen();
      }

      /* ---------- shopping ---------- */
      function viewShop() {
        const to = ctx.player(recipient(myIdx)), scn = st.sc[recipientIdx(myIdx, st.r)], budget = budgetFor(myIdx);
        const occ = PP.engine.get("gift-occasion", scn.o).t, q = PP.engine.get("gift-quirk", scn.q).t;
        if (submitted) {
          const waiting = roster.filter((id) => st.gifts[id] == null && present().includes(id)).map((id) => (ctx.player(id) || {}).name);
          return mount(ctx.el, el("div.stack", el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "🎁"), el("h3", "Wrapped and ready!"), W.waiting(ctx, waiting))));
        }
        const die = el("div.die", "🎲");
        const meter = el("div.timer"), meterFill = el("div.timer-fill"), meterLbl = el("span.timer-label");
        meter.append(meterFill, meterLbl);
        const cartBox = el("div.row.cart", { style: { minHeight: "48px", justifyContent: "center" } });
        const grid = el("div.gift-grid");
        const title = el("input.in", { placeholder: "Name your gift (optional)", maxLength: 30 });
        const note = el("textarea.in", { placeholder: "Write a little note…", maxLength: 100 });
        const wrapBtn = el("button.btn.btn-big", { onclick: () => { if (!cart.length) return; submitted = true; sfx.tada(); ctx.send("gift", { r: st.r, items: cart.slice(), paper, ribbon, title: title.value.trim(), note: note.value.trim() }); render(); } }, "🎁 Wrap it!");
        const paintCart = () => {
          mount(cartBox, cart.length ? cart.map((i, k) => el("button.chip-btn", { title: ITEMS[i][1], onclick: () => { cart.splice(k, 1); sfx.tap(); paintCart(); paintShop(); } }, ITEMS[i][0])) : el("span.muted", "Your basket is empty — tap some items! 🛒"));
          const c = cost(); meterFill.style.width = Math.min(100, (c / budget) * 100) + "%"; meter.classList.toggle("hot", c > budget * 0.85);
          meterLbl.textContent = "🪙 " + c + " / " + budget;
          wrapBtn.disabled = !cart.length;
        };
        const paintShop = () => {
          Array.from(grid.children).forEach((b) => { const i = Number(b.dataset.i); b.disabled = cart.length >= MAX_ITEMS || cost() + ITEMS[i][2] > budget; });
        };
        ITEMS.forEach((it, i) => grid.appendChild(el("button.gift-item", { type: "button", dataset: { i }, title: it[1], onclick: () => { if (cart.length >= MAX_ITEMS || cost() + it[2] > budget) return sfx.buzz(); cart.push(i); sfx.pop(); paintCart(); paintShop(); } },
          el("span.gi-e", it[0]), el("span.gi-n", it[1]), el("span.gi-p", "🪙" + it[2]))));
        const papers = el("div.swatches", PAPERS.map((c, i) => el("button.sw" + (i === paper ? ".on" : ""), { type: "button", style: { background: c }, onclick: (e) => { paper = i; Array.from(papers.children).forEach((x) => x.classList.toggle("on", x === e.currentTarget)); sfx.tap(); } })));
        const ribs = el("div.row", RIBBONS.map((r, i) => el("button.chip-btn" + (i === ribbon ? ".on" : ""), { type: "button", onclick: (e) => { ribbon = i; Array.from(ribs.children).forEach((x) => x.classList.toggle("on", x === e.currentTarget)); sfx.tap(); } }, r)));
        mount(ctx.el, el("div.stack",
          el("div.card.stack", el("div.row", die, el("div", el("div.muted", "You're shopping for"), el("h2", { style: { margin: 0 } }, W.avatar(to, 34), " ", to ? to.name : "?"))),
            el("div.note", "🎉 Occasion: ", el("b", occ)), el("div.note", "🧐 They're ", el("b", q)), meter),
          el("div.card.stack", el("b", "Your basket (tap to remove)"), cartBox),
          el("div.card.stack", el("b", "The shop"), grid),
          el("div.card.stack", el("b", "Wrap it up"), el("div", el("label.field", "Paper"), papers), el("div", el("label.field", "Ribbon"), ribs), title, note, wrapBtn)));
        PP.ui.rollDice(die, 1 + ((scn.o + scn.q) % 6), () => {});
        paintCart(); paintShop();
      }

      /* ---------- opening ---------- */
      function viewOpen() {
        const gi = st.open, giver = roster[gi], g = st.gifts[giver], to = ctx.player(recipient(gi)), from = ctx.player(giver);
        const mineToOpen = to && to.id === me;
        if (!g) return mount(ctx.el, el("div.card.center.stack", el("h3", (from ? from.name : "?") + " didn't wrap anything 🙈"), W.waiting(ctx, [], "On to the next gift…")));
        const box = el("div.gift-box", { style: { "--paper": PAPERS[g.paper % PAPERS.length] } }, el("div.gb-lid", RIBBONS[g.ribbon % RIBBONS.length]), el("div.gb-body"));
        const reveal = el("div.stack.hide");
        const rated = st.rated[gi];
        const opened = el("div.card.center.stack",
          el("div.muted", (from ? from.name : "?") + " got " + (to ? to.name : "?") + " …"), box, el("div.muted", mineToOpen ? "👆 Tap to open your gift!" : "Waiting for " + (to ? to.name : "?") + " to open it…"), reveal);
        const keepBtn = () => el("button.btn.btn-sm.btn-acc", { onclick: (e) => { e.currentTarget.disabled = true; ctx.keep("gift", g.title || "A gift", { items: g.items.map((i) => ({ e: ITEMS[i][0], name: ITEMS[i][1] })), note: g.note, from: from ? from.name : "?", to: ctx.me.name, title: g.title }); } }, "🧸 Keep it");
        const doOpen = (instant) => {
          if (opened.classList.contains("opened")) return; opened.classList.add("opened");
          if (!instant) { box.classList.add("shake-me"); sfx.whoosh(); }
          setTimeout(() => {
            box.classList.add("open"); if (!instant) { sfx.tada(); PP.ui.confetti({ count: 80, y: 0.35 }); }
            mount(reveal, g.title ? el("h2", g.title) : null,
              el("div.big-emoji", g.items.map((i) => ITEMS[i][0]).join(" ")),
              el("div.muted", g.items.map((i) => ITEMS[i][1]).join(" · ")),
              g.note ? el("div.note", "“" + g.note + "”") : null,
              el("div.muted", "from " + (from ? from.name : "?") + " · 🪙 " + g.items.reduce((s, i) => s + ITEMS[i][2], 0) + " spent"),
              ui.rate = el("div.row", { style: { justifyContent: "center" } }, mineToOpen && rated == null ? RATES.map((r, k) => el("button.btn.btn-sm.btn-ghost", { onclick: () => ctx.send("rate", { r: st.r, i: gi, v: k }) }, r[0] + " " + r[1])) : (rated != null ? el("div.stack.center", el("h2", RATES[rated][0] + " " + RATES[rated][1]), mineToOpen ? keepBtn() : null) : el("span.muted", "…waiting for their verdict"))));
            reveal.classList.remove("hide");
          }, instant ? 0 : 700);
        };
        box.addEventListener("click", () => { if (mineToOpen) ctx.send("opened", { r: st.r, i: gi }); });
        ui.doOpen = doOpen;
        mount(ctx.el, el("div.stack", el("span.badge", "Round " + (st.r + 1) + "/" + total + " · gift " + (gi + 1) + "/" + n), opened,
          el("div.card", W.scoreboard(ctx, st.scores, { noRank: false }))));
        if ((st.opened && st.opened[gi]) || rated != null) doOpen(true);
      }

      /* ---------- the host moves things on ---------- */
      function deal(r) {
        const sc = roster.map(() => ({ o: PP.engine.draw("gift-occasion", 1, { vibe: ctx.vibe() })[0], q: PP.engine.draw("gift-quirk", 1, { vibe: ctx.vibe() })[0], b: PP.engine.draw("gift-budget", 1, { noLearn: true })[0] }));
        ctx.send("deal", { r, sc });
      }
      function hostCheck() {
        if (!ctx.isHost()) return;
        if (st.phase === "wait" && st.r === -1 && !st.q.first) { st.q.first = 1; deal(0); }
        if (st.phase === "shop" && !st.q["op" + st.r]) {
          const need = roster.filter((id) => present().includes(id));
          if (need.length && need.every((id) => st.gifts[id] != null)) { st.q["op" + st.r] = 1; ctx.later(() => ctx.send("start", { r: st.r }), 1200); }
          else if (!st.q["to" + st.r]) { st.q["to" + st.r] = 1; ctx.later(() => st.phase === "shop" && ctx.send("start", { r: st.r }), 240000); }
        }
        if (st.phase === "open" && !st.q["ad" + st.r + ":" + st.open]) {
          const gi = st.open, g = st.gifts[roster[gi]];
          if (!g || st.rated[gi] != null) { st.q["ad" + st.r + ":" + st.open] = 1; ctx.later(() => ctx.send("adv", { r: st.r, i: gi }), g ? 3800 : 1800); }
        }
      }

      render(); hostCheck();
      return {
        onEvent(ev) {
          const d = ev.d || {}, live = ctx.live(ev);
          switch (ev.type) {
            case "deal":
              if (d.r !== st.r + 1) return;
              Object.assign(st, { r: d.r, phase: "shop", sc: d.sc, gifts: {}, open: 0, rated: {}, opened: {} }); cart = []; submitted = false; paper = 0; ribbon = 0;
              render(); break;
            case "gift": {
              if (d.r !== st.r || st.phase !== "shop" || st.gifts[ev.f] != null) return;
              const gi = roster.indexOf(ev.f); if (gi < 0) return;
              const items = (d.items || []).filter((i) => ITEMS[i]).slice(0, MAX_ITEMS);
              if (!items.length || items.reduce((s, i) => s + ITEMS[i][2], 0) > budgetFor(gi)) return;
              st.gifts[ev.f] = { items, paper: Number(d.paper) || 0, ribbon: Number(d.ribbon) || 0, title: String(d.title || "").slice(0, 30), note: String(d.note || "").slice(0, 100) };
              if (ev.f === me) submitted = true;
              if (submitted) render(); break;                    // don't wipe my basket / note while I'm shopping
            }
            case "start": if (d.r === st.r && st.phase === "shop") { st.phase = "open"; st.open = 0; render(); } break;
            case "opened": if (d.r === st.r && st.phase === "open" && d.i === st.open) { st.opened[d.i] = true; ui.doOpen && ui.doOpen(false); } break;
            case "rate": {
              if (d.r !== st.r || st.phase !== "open" || d.i !== st.open || st.rated[d.i] != null) return;
              const to = recipient(d.i); if (ev.f !== to) return;
              const k = Math.max(0, Math.min(2, Number(d.v) || 0)); st.rated[d.i] = k; st.scores[roster[d.i]] += RATES[k][2];
              if (live) { sfx.ding(); PP.ui.floatEmoji(RATES[k][0], (ctx.player(ev.f) || {}).name, (ctx.player(ev.f) || {}).color); }
              render(); break;
            }
            case "adv":
              if (d.r !== st.r || st.phase !== "open" || d.i !== st.open) return;
              if (st.open + 1 < n) { st.open++; render(); }
              else if (st.r + 1 < total) deal(st.r + 1);
              else ctx.send("fin", {});
              break;
            case "fin":
              if (st.phase === "fin") return; st.phase = "fin";
              mount(ctx.el, W.finale(ctx, { scores: st.scores, emoji: "🎁", heading: "Best gifts ever (probably)", sub: "Scores = how much each gift was loved 😍" })); break;
          }
          hostCheck();
        },
        onPlayers() { hostCheck(); },
        debug: () => st,
      };
    },
  });
})();
