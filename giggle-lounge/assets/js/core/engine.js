/* Deck engine: deals prompts so nothing repeats until the deck is used up, and quietly learns
 * what *this* group enjoys.
 *
 *  - every item has a vibe (v: "f" funny | "s" silly) and tags (g: [...])
 *  - draw(): never repeats until the deck is exhausted (remembered across sessions), honours the
 *    chosen vibe, and weights items by learned taste. 15% of draws ignore taste on purpose, so
 *    you keep discovering new favourites instead of narrowing down.
 *  - react(): a 👍 / 👎 nudges the weight of that item's tags. Gentle: weights stay in 0.2–4.
 *  - taste lives on the device; if you are logged in it also syncs to your account (or couple).
 */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  const decks = {};
  let prefs = LS.get("gl.prefs", { w: {} });
  let seen = LS.get("gl.seen", {});
  const EXPLORE = 0.15;
  let SA_ON = LS.get("gl.sa", true);

  function norm(it) { return typeof it === "string" ? { t: it, v: "f", g: [] } : Object.assign({ v: "f", g: [] }, it); }

  const E = {
    EXPLORE,
    get sa() { return SA_ON ? 3 : 1; },
    saOn() { return SA_ON; },
    setSA(on) { SA_ON = !!on; LS.set("gl.sa", SA_ON); },
    registerDeck(id, items) { decks[id] = items.map(norm); },
    extendDeck(id, items) { decks[id] = (decks[id] || []).concat(items.map(norm)); },                 // appended, so existing indexes stay valid
    size(id) { return decks[id] ? decks[id].length : 0; },
    get(id, idx) { return decks[id][idx]; },
    all(id) { return decks[id]; },
    totalPrompts() { return Object.keys(decks).reduce((n, k) => n + decks[k].length, 0); },

    weight(deckId, item) {
      const W = prefs.w;
      let w = W["v:" + item.v] || 1;
      if (item.g.indexOf("sa") >= 0) w *= E.sa;                       // 🇿🇦 Mzansi flavour: boost South African items
      for (const g of item.g) w *= W[deckId + ":" + g] || 1;
      return clamp(w, 0.1, 6);
    },

    /* returns n distinct indexes into the deck */
    draw(deckId, n, opts) {
      opts = opts || {};
      const deck = decks[deckId];
      const rng = opts.rng || PP.RNG.secure();
      const vibe = opts.vibe || "random";
      const extra = opts.filter || (() => true);
      const ok = (it) => extra(it) && (vibe === "random" || (vibe === "funny" ? it.v === "f" : it.v === "s") || it.v === "b");
      const exclude = new Set(opts.exclude || []);
      const done = new Set(seen[deckId] || []);
      const pick = [];
      for (let k = 0; k < n; k++) {
        let pool = [];
        for (let i = 0; i < deck.length; i++) if (!done.has(i) && !exclude.has(i) && !pick.includes(i) && ok(deck[i])) pool.push(i);
        if (!pool.length) {                           // deck used up for this vibe: shuffle the discards back in
          for (let i = 0; i < deck.length; i++) if (ok(deck[i])) done.delete(i);
          for (let i = 0; i < deck.length; i++) if (!done.has(i) && !exclude.has(i) && !pick.includes(i) && ok(deck[i])) pool.push(i);
          if (!pool.length) pool = deck.map((_, i) => i).filter((i) => !pick.includes(i));
        }
        let idx;
        if (opts.noLearn || rng.chance(EXPLORE)) idx = rng.pick(pool);
        else idx = rng.weighted(pool, pool.map((i) => E.weight(deckId, deck[i])));
        pick.push(idx);
        done.add(idx);
      }
      seen[deckId] = Array.from(done);
      LS.set("gl.seen", seen);
      return pick;
    },

    /* 👍 +1 / 👎 -1 on a dealt item */
    react(deckId, idx, sign) {
      const item = decks[deckId][idx];
      const W = prefs.w;
      const tags = ["v:" + item.v].concat(item.g.map((g) => deckId + ":" + g));
      tags.forEach((t) => { W[t] = clamp((W[t] || 1) * (sign > 0 ? 1.3 : 0.75), 0.2, 4); });
      LS.set("gl.prefs", prefs);
      E.sync();
    },

    taste() { return prefs.w; },
    reset() { prefs = { w: {} }; seen = {}; LS.set("gl.prefs", prefs); LS.set("gl.seen", seen); E.sync(); },

    /* account sync */
    sync: (function () {
      let t = null;
      return function () {
        clearTimeout(t);
        t = setTimeout(() => { if (PP.account && PP.account.user) PP.api("auth.php", { action: "prefs_set", w: prefs.w }).catch(() => {}); }, 1500);
      };
    })(),
    async pull() {
      try {
        const r = await PP.api("auth.php", { action: "prefs_get" });
        const w = (r.prefs && r.prefs.w) || {};
        if (Object.keys(w).length) { prefs.w = Object.assign({}, prefs.w, w); LS.set("gl.prefs", prefs); }
      } catch (e) {}
    },

    /* 👍 / 👎 chips for a dealt card; one tap each, then they thank you */
    reactionBar(deckId, idx) {
      const { el } = PP.ui;
      const wrap = el("div.react-bar", el("span.react-q", "More like this?"));
      const done = (sign, b) => { E.react(deckId, idx, sign); wrap.classList.add("done"); wrap.textContent = sign > 0 ? "Noted! 🎯" : "Got it, fewer of those 🫡"; PP.sfx.tap(); };
      const up = el("button.chip-btn", { onclick: () => done(1) }, "👍");
      const dn = el("button.chip-btn", { onclick: () => done(-1) }, "👎");
      wrap.append(up, dn);
      return wrap;
    },
  };

  PP.engine = E;
})();
