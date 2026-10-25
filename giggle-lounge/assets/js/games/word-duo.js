/* Word Duo — co-op Wordle. Turns: take turns guessing whole words. Split: each guess is built from alternating letters,
 * so you must both have the same word in mind. */
(function () {
  "use strict";
  const PP = window.PP, { el, mount } = PP.ui, W = PP.widgets, sfx = PP.sfx;
  const TRIES = 6, LEN = 5, ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  function score(guess, target) {
    const res = new Array(LEN).fill("x"), left = {};
    for (let i = 0; i < LEN; i++) if (guess[i] === target[i]) res[i] = "g"; else left[target[i]] = (left[target[i]] || 0) + 1;
    for (let i = 0; i < LEN; i++) if (res[i] === "x" && left[guess[i]] > 0) { res[i] = "y"; left[guess[i]]--; }
    return res.join("");
  }
  PP.WordDuo = { score };

  PP.registerGame({
    id: "word-duo", name: "Word Duo", emoji: "🔤", color: "#9BE564",
    tagline: "Wordle for two. In Split Brain you each type every other letter!",
    how: "Find the secret 5-letter word in 6 tries — together. Take turns guessing, or play Split Brain where you each only type some of the letters (you take alternate positions), so you really need the same word in your heads.",
    min: 2, max: 4, tags: ["trust", "puzzle", "words"],
    options: [{ id: "mode", label: "How do you want to play?", kind: "cards", def: "split", choices: [
      { v: "split", emoji: "🧩", label: "Split Brain", desc: "Each guess is built from alternating letters — one of you types letters 1, 3, 5, the other 2, 4.", min: 2, max: 4 },
      { v: "turns", emoji: "🔁", label: "Take turns", desc: "Swap whole guesses. Talk it through — or don't.", min: 2, max: 4 },
    ] }],

    create(ctx) {
      const roster = ctx.rosterIds, me = ctx.me.id, n = roster.length, mode = ctx.settings.mode === "turns" ? "turns" : "split";
      const words = PP.WORDS.filter((w) => w.length === LEN);
      const target = ctx.rng("wd-target").pick(words);
      const st = { rows: [], parts: {}, over: false, won: false };
      let draft = "";
      const keys = {};
      const slotsOf = (id) => { const i = roster.indexOf(id); const out = []; for (let p = 0; p < LEN; p++) if (p % n === i) out.push(p); return out; };
      const myTurn = () => mode === "turns" ? roster[st.rows.length % n] === me : true;
      const need = () => (mode === "turns" ? LEN : slotsOf(me).length);
      const nm = (id) => (ctx.player(id) || {}).name || "?";

      const grid = el("div.wd-grid"), kb = el("div.wd-kb"), info = el("div.note.center");
      const root = el("div.wd", info, grid, kb);
      mount(ctx.el, root);

      function tile(ch, cls) { return el("div.wd-t" + (cls ? "." + cls : ""), ch || ""); }
      function paint() {
        grid.textContent = "";
        for (let r = 0; r < TRIES; r++) {
          const row = el("div.wd-r");
          if (r < st.rows.length) { const { w, s } = st.rows[r]; for (let i = 0; i < LEN; i++) { const t = tile(w[i], s[i]); t.style.animationDelay = i * 80 + "ms"; row.appendChild(t); } }
          else if (r === st.rows.length && !st.over) {
            if (mode === "turns") { for (let i = 0; i < LEN; i++) row.appendChild(tile(myTurn() ? draft[i] : "", "cur")); }
            else {
              const mineSlots = slotsOf(me);
              for (let p = 0; p < LEN; p++) {
                const k = mineSlots.indexOf(p), owner = roster[p % n];
                const ch = k >= 0 ? (st.parts[me] ? st.parts[me][k] : draft[k]) : (st.parts[owner] ? "•" : "");
                row.appendChild(tile(ch, (k >= 0 ? "mine" : "theirs") + (st.parts[owner] ? " set" : "")));
              }
            }
          } else for (let i = 0; i < LEN; i++) row.appendChild(tile("", ""));
          grid.appendChild(row);
        }
        info.textContent = st.over ? (st.won ? "🎉 You got it!" : "The word was " + target.toUpperCase()) :
          mode === "turns" ? (myTurn() ? "🎯 Your guess" : "⏳ " + nm(roster[st.rows.length % n]) + " is thinking…") :
          st.parts[me] ? "🔒 Locked! Waiting for " + roster.filter((id) => !st.parts[id]).map(nm).join(", ") + "…" : "🧩 Type your letters (positions " + slotsOf(me).map((p) => p + 1).join(", ") + ")" + (ctx.silent ? " — 🤫 no talking!" : "");
        kb.querySelectorAll("button[data-k]").forEach((b) => { b.className = keys[b.dataset.k] || ""; });
      }
      function buildKb() {
        ROWS.forEach((row, ri) => {
          const r = el("div.wd-kr");
          if (ri === 2) r.appendChild(el("button.wd-k.wide", { type: "button", onclick: submit }, "GO"));
          row.split("").forEach((c) => r.appendChild(el("button.wd-k", { type: "button", "data-k": c, onclick: () => type(c) }, c)));
          if (ri === 2) r.appendChild(el("button.wd-k.wide", { type: "button", onclick: () => type("⌫") }, "⌫"));
          kb.appendChild(r);
        });
      }
      function type(c) {
        if (st.over || ctx.paused() || (mode === "turns" && !myTurn()) || (mode === "split" && st.parts[me])) return;
        if (c === "⌫") draft = draft.slice(0, -1); else if (draft.length < need()) draft += c;
        sfx.tap(); paint();
      }
      function submit() {
        if (st.over || ctx.paused() || draft.length < need()) return;
        if (mode === "turns" ? !myTurn() : st.parts[me]) return;
        ctx.send("guess", { n: st.rows.length, w: draft }); draft = ""; sfx.pop();
      }
      const key = (e) => { if (/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return; if (e.key === "Enter") submit(); else if (e.key === "Backspace") type("⌫"); else if (/^[a-z]$/i.test(e.key)) type(e.key.toLowerCase()); };
      window.addEventListener("keydown", key);
      buildKb(); paint();
      window.__wd = { target };

      function resolve(w) {
        const s = score(w, target); st.rows.push({ w, s });
        for (let i = 0; i < LEN; i++) { const c = w[i], rank = { g: 3, y: 2, x: 1 }; if (!keys[c] || rank[s[i]] > rank[keys[c]]) keys[c] = s[i]; }
        st.parts = {}; draft = "";
        if (w === target) { st.won = true; st.over = true; sfx.tada(); PP.ui.confetti({ count: 200 }); }
        else if (st.rows.length >= TRIES) { st.over = true; sfx.sad(); } else sfx.swap();
        paint();
        if (st.over) setTimeout(() => { const sc = {}; roster.forEach((id) => (sc[id] = st.won ? TRIES + 1 - st.rows.length : 0)); mount(ctx.el, W.finale(ctx, { scores: sc, emoji: st.won ? "🔤" : "🤔", heading: st.won ? "Solved in " + st.rows.length + "!" : "So close!", sub: st.won ? "The word was " + target.toUpperCase() + "." : "The word was " + target.toUpperCase() + " — rematch?" })); }, 1800);
      }
      return {
        onEvent(ev) {
          if (ev.type !== "guess" || st.over || !roster.includes(ev.f)) return;
          const d = ev.d || {}; if (d.n !== st.rows.length) return;
          const w = String(d.w || "").toLowerCase().replace(/[^a-z]/g, "");
          if (mode === "turns") { if (roster[st.rows.length % n] !== ev.f || w.length !== LEN) return; resolve(w); return; }
          if (st.parts[ev.f] || w.length !== slotsOf(ev.f).length) return;
          st.parts[ev.f] = w;
          if (roster.every((id) => st.parts[id])) { const out = new Array(LEN); roster.forEach((id) => slotsOf(id).forEach((p, k) => (out[p] = st.parts[id][k]))); resolve(out.join("")); } else paint();
        },
        onPlayers: paint, onPause: paint,
        destroy() { window.removeEventListener("keydown", key); },
        debug: () => st,
      };
    },
  });
})();
