/* Shared widgets for games: avatars, countdown bar, scoreboard, "everybody wins" finale. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});
  const { el } = PP.ui;

  /* Nobody loses here — everyone leaves with a title. */
  const TITLES = {
    top: ["Chaos Champion 👑", "Giggle Grandmaster 🏆", "Supreme Silly Sovereign 🤴", "The Main Character ✨", "Legend of the Lounge 🌟", "Absolute Menace (affectionate) 😈"],
    mid: ["Professional Goofball 🤡", "Certified Snack Enthusiast 🍿", "Vibe Curator 🎧", "Chief Banter Officer 💬", "Wildcard Wizard 🧙", "Mildly Dangerous 🔥"],
    low: ["Gentle Spirit 🌸", "Most Likely to Nap 😴", "Heart of the Party 💛", "Unbothered Icon 😎", "Snack Break Specialist 🥨", "The Wholesome One 🧸"],
  };

  const W = {
    avatar(p, size) {
      return el("span.avatar", { style: { background: (p && p.color) || "#ddd", width: (size || 34) + "px", height: (size || 34) + "px", fontSize: Math.round((size || 34) * 0.58) + "px" }, title: p && p.name }, (p && p.avatar) || "🙂");
    },
    chip(p, extra) {
      return el("span.pchip", W.avatar(p, 26), el("b", p ? p.name : "?"), extra || null);
    },

    /* countdown bar. Reads pause-aware time from the room, so a pause freezes it. */
    timer(ctx, startT, dur, opts) {
      opts = opts || {};
      const fill = el("div.timer-fill");
      const label = el("span.timer-label");
      const box = el("div.timer", fill, label);
      let last = -1;
      const iv = setInterval(tick, 200);
      function tick() {
        const left = ctx.timeLeft(startT, dur);
        fill.style.width = Math.min(100, (left / dur) * 100) + "%";
        box.classList.toggle("hot", left < 10000);
        label.textContent = PP.ui.fmtTime(left);
        const s = Math.ceil(left / 1000);
        if (s !== last) { last = s; if (opts.onSecond) opts.onSecond(s, left); if (s <= 5 && s > 0 && !ctx.paused() && opts.beep !== false) PP.sfx.tap(); }
        if (left <= 0) { clearInterval(iv); if (opts.onEnd) opts.onEnd(); }
      }
      tick();
      ctx.cleanup(() => clearInterval(iv));
      return { el: box, stop() { clearInterval(iv); } };
    },

    /* scores: { pid: points } */
    scoreboard(ctx, scores, opts) {
      opts = opts || {};
      const rows = ctx.roster().map((p) => ({ p, s: scores[p.id] || 0 })).sort((a, b) => b.s - a.s);
      return el("div.scoreboard", rows.map((r, i) =>
        el("div.score-row" + (r.p.id === ctx.me.id ? ".me" : ""),
          el("span.rank", opts.noRank ? "" : ["🥇", "🥈", "🥉"][i] || (i + 1)),
          W.avatar(r.p, 28), el("b", r.p.name), el("span.pts", (opts.fmt ? opts.fmt(r.s) : r.s) + (opts.unit || "")))));
    },

    waiting(ctx, names, msg) {
      return el("div.waiting", el("span.dots", el("i"), el("i"), el("i")), el("span", msg || ("Waiting for " + (names.length ? names.join(", ") : "everyone") + "…")));
    },

    /* The finale: confetti, a title for every player, play again / lobby. */
    finale(ctx, cfg) {
      cfg = cfg || {};
      const scores = cfg.scores || {};
      const roster = ctx.roster();
      const sorted = roster.slice().sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
      const rng = ctx.rng("finale");
      const used = {};
      const titleFor = (i) => {
        const bank = i === 0 ? TITLES.top : i === sorted.length - 1 && sorted.length > 2 ? TITLES.low : TITLES.mid;
        let t, n = 0;
        do { t = rng.pick(bank); } while (used[t] && ++n < 10);
        used[t] = 1; return t;
      };
      const tie = sorted.length > 1 && (scores[sorted[0].id] || 0) === (scores[sorted[sorted.length - 1].id] || 0);
      setTimeout(() => { PP.ui.confetti({ count: 150 }); PP.sfx.tada(); }, 250);
      return el("div.finale",
        el("div.finale-burst", cfg.emoji || "🎉"),
        el("h2", cfg.heading || (tie ? "A perfect tie! 🤝" : "That was a good one!")),
        cfg.sub ? el("p.muted", cfg.sub) : null,
        el("div.podium", sorted.map((p, i) =>
          el("div.podium-row" + (i === 0 && !tie ? ".first" : ""),
            W.avatar(p, 44),
            el("div.podium-text", el("b", p.name), el("span", titleFor(i))),
            cfg.noScores ? null : el("span.pts", (scores[p.id] || 0) + (cfg.unit || ""))))),
        cfg.extra || null,
        el("div.finale-actions",
          el("button.btn.btn-big", { onclick: () => ctx.again() }, "🔁 Play again"),
          el("button.btn.btn-ghost", { onclick: () => ctx.end() }, "🏠 Back to the lobby")));
    },

    /* a labelled "private note" banner */
    note(text) { return el("div.note", text); },

    /* only the given player sees it */
    big(text, sub) { return el("div.bigline", el("h2", text), sub ? el("p.muted", sub) : null); },

    /* pill selector: returns {el, value()} */
    pills(options, def, onChange) {
      let val = def;
      const wrap = el("div.pills");
      const paint = () => Array.from(wrap.children).forEach((b) => b.classList.toggle("on", b.dataset.v === String(val)));
      options.forEach((o) => wrap.appendChild(el("button.pill", { dataset: { v: o.v }, type: "button", onclick: () => { val = o.v; paint(); PP.sfx.tap(); onChange && onChange(val); } }, o.label)));
      paint();
      return { el: wrap, value: () => val };
    },
  };

  PP.widgets = W;

  /* game registry — games call PP.registerGame({...}) when their script loads */
  PP.games = [];
  PP.registerGame = (d) => PP.games.push(d);
})();
