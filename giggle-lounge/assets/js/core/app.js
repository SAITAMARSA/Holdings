/* The shell: home, lobby, the game host (gives every game its ctx), pokes, pause / tap-out. */
(function () {
  "use strict";
  const PP = window.PP;
  const { el, mount, toast, modal } = PP.ui;
  const W = PP.widgets;
  const sfx = PP.sfx;


  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const room = new PP.RoomClient();
  PP.room = room;
  const screen = document.getElementById("screen");
  const pokebar = document.getElementById("pokebar");

  /* ---------- profile ---------- */
  const AVATARS = ["🦊", "🐼", "🐸", "🦄", "🐙", "🐯", "🐵", "🦁", "🐧", "🐨", "🐰", "🦖", "👻", "🤖", "👽", "🧙", "🦸", "🧛", "🥑", "🍕", "🌮", "🍩", "🍉", "🌈", "🔥", "⭐", "🎸", "🚀"];
  const COLORS = ["#FF5CA8", "#FFD23F", "#2EE6A6", "#4DB8FF", "#A66CFF", "#FF9F1C", "#FF6B6B", "#9BE564"];
  const ADJ = ["Captain", "Professor", "Sir", "Lady", "Chief", "Agent", "Doctor", "Baron", "Admiral", "Wizard"];
  const NOUN = ["Waffle", "Pickle", "Noodle", "Biscuit", "Turnip", "Muffin", "Pancake", "Sprout", "Pudding", "Nugget"];
  const hasSavedProfile = !!LS.get("gl.profile", null);
  function randomName() { const r = PP.RNG.secure(); return r.pick(ADJ) + " " + r.pick(NOUN); }
  let profile = LS.get("gl.profile", null) || (() => {
    const r = PP.RNG.secure();
    return { name: randomName(), avatar: r.pick(AVATARS), color: r.pick(COLORS) };
  })();
  const saveProfile = () => LS.set("gl.profile", profile);

  /* ---------- state ---------- */
  let view = "home";
  let pokeTarget = null;
  let game = null;                  // { def, inst, ctx, cleanups }
  let lobby = null;                 // refs to live lobby nodes

  const ROADMAP = [
    ["🧠", "Just One"], ["🏝️", "Desert Island"], ["📞", "Telephone Draw"], ["💬", "Caption This"], ["🗳️", "Would You Rather"],
    ["🔤", "Word Chain Rumble"], ["⚡", "Reaction Rumble"], ["🃏", "Trading Cards"], ["🏆", "Awards Night"], ["📖", "Episode Titles"],
  ];

  /* ---------- helpers ---------- */
  const present = () => room.players.filter((p) => p.present && !p.left).sort((a, b) => a.idx - b.idx);
  const hostId = () => (present()[0] || {}).id;
  function togetherness() {
    const ps = present();
    if (ps.length < 2) return null;
    return ps.every((p) => p.net === ps[0].net) ? "same" : "apart";
  }
  function inviteLink() { return location.origin + location.pathname.replace(/index\.html$/, "") + "?room=" + room.code; }

  /* =====================================================================
   *  Top bar
   * ===================================================================== */
  function renderTopbar() {
    const bar = document.getElementById("topbar");
    mount(bar,
      el("button.logo", { onclick: () => { if (view === "home") return; confirmLeave(); }, "aria-label": "Giggle Lounge home" },
        el("span.logo-mark", "🤪"), el("span.name", "Giggle Lounge")),
      el("span.spacer"),
      el("button.icon-btn#btn-sound", { title: "Sound", onclick: () => { sfx.setMuted(!sfx.muted); paintSound(); sfx.pop(); } }),
      el("button.icon-btn", { title: "Colours", onclick: () => PP.account.themeModal() }, "🎨"),
      el("button.icon-btn", { title: "Keepsakes", onclick: () => PP.account.keepsakes() }, "🧸"),
      el("button.icon-btn", { title: "Account", onclick: () => PP.account.modal() }, "👤"));
    paintSound();
  }
  function paintSound() { const b = document.getElementById("btn-sound"); if (b) b.textContent = sfx.muted ? "🔇" : "🔊"; }

  function confirmLeave() {
    const m = modal("Leave the room?", el("div.stack",
      el("p", "You can hop back in with the code anytime."),
      el("div.row", el("button.btn.btn-bad", { onclick: () => { m.close(); leaveRoom(); } }, "Leave"), el("button.btn.btn-ghost", { onclick: () => m.close() }, "Stay"))));
  }
  async function leaveRoom() {
    await room.leave();
    stopGame();
    pokebar.classList.add("hide");
    history.replaceState(null, "", location.pathname);
    renderHome();
  }

  /* =====================================================================
   *  Home
   * ===================================================================== */
  function renderHome(prefill, invited) {
    view = "home";
    stopGame();
    pokebar.classList.add("hide");
    const nameIn = el("input.in", { value: profile.name, maxLength: 16, placeholder: "Your silly name", "aria-label": "Your name",
      oninput: () => { profile.name = nameIn.value; saveProfile(); } });
    const avGrid = el("div.avatar-grid", AVATARS.map((a) => el("button.av-opt" + (a === profile.avatar ? ".on" : ""), { type: "button",
      onclick: (e) => { profile.avatar = a; saveProfile(); sfx.pop(); Array.from(avGrid.children).forEach((c) => c.classList.toggle("on", c === e.currentTarget)); } }, a)));
    const sw = el("div.swatches", COLORS.map((c) => el("button.sw" + (c === profile.color ? ".on" : ""), { type: "button", style: { background: c }, "aria-label": "colour " + c,
      onclick: (e) => { profile.color = c; saveProfile(); sfx.tap(); Array.from(sw.children).forEach((x) => x.classList.toggle("on", x === e.currentTarget)); } })));
    const codeIn = el("input.in.code-in", { maxLength: 13, placeholder: "ABCD", value: prefill || "", "aria-label": "Room code", autocapitalize: "characters", autocomplete: "off",
      oninput: () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ""); } });
    codeIn.addEventListener("keydown", (e) => { if (e.key === "Enter") joinBtn.click(); });
    const startBtn = el("button.btn.btn-big", { onclick: () => enter("create") }, "🎉 Start a room");
    const joinBtn = el("button.btn.btn-sec", { onclick: () => { if (codeIn.value.length < 4) { toast("Type the room code first 🔤"); codeIn.classList.add("shake-me"); setTimeout(() => codeIn.classList.remove("shake-me"), 700); return; } enter("join", codeIn.value); } }, "Join");
    const couple = PP.account.user && PP.account.user.couple;

    mount(screen,
      el("div.hero",
        el("div.hero-emojis", ["🎲", "😂", "🎨", "🧱", "🎁", "🎬"].map((e) => el("span", e))),
        el("h1", el("span.w1", "Giggle"), " ", el("span.w2", "Lounge")),
        el("p", "Silly games for two (or more) — on separate phones or the same couch. No downloads, just a code.")),
      invited ? el("div.card.tilt-l", { style: { background: "var(--acc)", marginTop: "10px", textAlign: "center" } }, el("b", "💌 You're invited to room " + prefill + "!"), el("div", "Pick a name and jump in.")) : null,
      el("div.home-grid",
        el("div.card.stack",
          el("h3", "Who's playing?"),
          el("div", el("label.field", "Your name"), nameIn),
          el("div", el("label.field", "Pick a face"), avGrid),
          el("div", el("label.field", "Pick a colour"), sw)),
        el("div.card.stack",
          el("h3", invited ? "Ready?" : "Let's go!"),
          invited ? null : startBtn,
          invited ? null : el("div.or", "or join a friend"),
          el("div.row", { style: { flexWrap: "nowrap" } }, el("div.grow", codeIn), joinBtn),
          couple ? el("button.btn.btn-acc", { onclick: () => enter("join", couple.roomCode) }, "💞 Our private room") : null,
          el("div.steps3", { style: { marginTop: "8px" } },
            step(1, "Start a room and share the code (WhatsApp it!)"),
            step(2, "Pick a game — anyone can start one"),
            step(3, "Better with a call going: WhatsApp, FaceTime, whatever 📞")))));
    if (invited) joinBtn.classList.add("btn-big");
  }
  const step = (n, t) => el("div.step3", el("span.n", n), el("span", t));

  async function enter(kind, code) {
    profile.name = (profile.name || "").trim() || randomName();
    saveProfile();
    try {
      if (kind === "create") await room.create(profile); else await room.join(code, profile);
    } catch (e) { toast(e.message || "Couldn't get in"); return false; }
    history.replaceState(null, "", "?room=" + room.code);
    room.start();
    buildPokebar();
    renderLobby();
    return true;
  }

  /* =====================================================================
   *  Lobby
   * ===================================================================== */
  function renderLobby() {
    view = "lobby";
    stopGame();
    pokebar.classList.remove("hide");
    const whoBox = el("div.who");
    const wifi = el("span.badge");
    const vibeBox = el("div.pills");
    const code = room.code;
    const shownCode = code.startsWith("OUR-") ? "OUR ROOM" : code;
    const link = inviteLink();

    const shareText = "Come play silly games with me! 🤪 Room " + code + " → " + link;
    const share = async () => {
      if (navigator.share) { try { await navigator.share({ title: "Giggle Lounge", text: "Come play with me! Room " + code, url: link }); return; } catch (e) { if (e.name === "AbortError") return; } }
      window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
    };
    const copy = async () => { try { await navigator.clipboard.writeText(link); toast("Link copied! Paste it anywhere 📋"); } catch (e) { toast(link); } };

    const tiles = el("div.tiles");
    const root = el("div",
      el("div.room-head",
        el("div.card.code-card.tilt-l",
          el("div.lbl", code.startsWith("OUR-") ? "Your private room 💞" : "Room code"),
          el("div.code-big", shownCode),
          el("div.row", { style: { justifyContent: "center" } },
            el("button.btn.btn-sm.btn-ghost", { onclick: copy }, "📋 Copy link"),
            el("button.btn.btn-sm.btn-good", { onclick: share }, "📲 Share"))),
        el("div.card.stack",
          el("div", el("b", "Who's here"), el("div", { style: { marginTop: "8px" } }, whoBox)),
          el("div.row", wifi),
          el("div", el("b", "Tonight's vibe "), el("small.muted", "(how the prompts feel)"), el("div", { style: { marginTop: "8px" } }, vibeBox)))),
      el("div.sec-title", "🎮 Pick a game", el("small", "anyone can start one"),
        el("span.grow"), el("button.btn.btn-sm.btn-acc", { onclick: surprise }, "🎲 Surprise us")),
      tiles,
      el("div.sec-title", "🔒 Cozy Corner", el("small", "the cuddly pack")),
      el("div", { id: "cozy" }),
      el("div.sec-title", "🚧 Coming soon", el("small", "10 more on the way")),
      el("div.soon", ROADMAP.map((r) => el("span", r[0] + " " + r[1]))),
      el("div.center", { style: { marginTop: "30px" } }, el("button.btn.btn-ghost.btn-sm", { onclick: confirmLeave }, "👋 Leave room")));
    mount(screen, root);

    PP.games.forEach((def) => tiles.appendChild(el("button.tile", { style: { "--tile": def.color }, onclick: () => openGameSheet(def) },
      el("span.t-emoji", def.emoji), el("span.t-name", def.name), el("span.t-tag", def.tagline),
      el("span.t-meta", el("span", def.min === def.max ? def.min + " players" : def.min + "–" + def.max + " players"), ...def.tags.map((t) => el("span", t))))));

    lobby = { whoBox, wifi, vibeBox };
    refreshLobby();
  }

  function refreshLobby() {
    if (view !== "lobby" || !lobby) return;
    const { whoBox, wifi, vibeBox } = lobby;
    const host = hostId();
    mount(whoBox, room.players.filter((p) => !p.left).map((p) => whoChip(p, p.id === host)));
    const t = togetherness();
    wifi.className = "badge " + (t === "same" ? "same" : t === "apart" ? "apart" : "");
    wifi.textContent = t === "same" ? "📍 Same Wi-Fi — you're together!" : t === "apart" ? "🌍 Playing apart — hop on a call 📞" : "👋 Share the code to get a friend in";
    const v = (room.meta.settings || {}).vibe || "random";
    mount(vibeBox,
      [["funny", "😂 Funny"], ["silly", "🤪 Silly"], ["random", "🎲 Random"]].map(([id, label]) =>
        el("button.pill" + (v === id ? ".on" : ""), { onclick: () => { sfx.tap(); room.send("meta.set", { vibe: id }); } }, label)),
      el("button.pill.soon", { title: "Romance arrives with Cozy Corner", disabled: true }, "💜 Romance (soon)"));
    const cozy = document.getElementById("cozy");
    if (cozy) mount(cozy, el("div.tiles", el("div.tile.locked",
      el("span.t-emoji", "💜"), el("span.t-name", "Cozy Corner"),
      el("span.t-tag", t === "same"
        ? "You're on the same Wi-Fi, so this corner can open. Nothing inside just yet — it's coming!"
        : "Locked. It only opens when everyone's on the same Wi-Fi — best done in person. 🫶"),
      el("span.t-meta", el("span", t === "same" ? "🔓 unlockable here" : "🔒 same Wi-Fi needed")))));
  }

  function whoChip(p, isHost, selectable) {
    const c = el("span.pchip" + (p.present ? "" : ".away") + (selectable && pokeTarget === p.id ? ".target" : ""),
      selectable ? { onclick: () => { pokeTarget = pokeTarget === p.id ? null : p.id; sfx.tap(); paintTargets(); toast(pokeTarget ? "🎯 Poking " + p.name : "Poking everyone"); }, style: { cursor: "pointer" }, dataset: { pid: p.id } } : { dataset: { pid: p.id } },
      W.avatar(p, 26), el("b", p.name), isHost ? el("span", "👑") : null, el("span.dot"));
    return c;
  }

  /* "Surprise us": the dice pick a game, preferring ones you haven't played lately */
  function surprise() {
    const n = present().length;
    const ok = PP.games.filter((g) => n >= g.min);
    if (!ok.length) { toast("Share the code first — you need a friend! 👋"); return; }
    const recent = LS.get("gl.recent", []);
    const rng = PP.RNG.secure();
    const weights = ok.map((g) => { const i = recent.indexOf(g.id); return i < 0 ? 3 : 0.5 + i * 0.4; });
    const pick = rng.weighted(ok, weights);
    const die = el("div.die", "🎲");
    const label = el("h2", "Rolling the dice…");
    const m = modal("Surprise!", el("div.center.stack", die, label));
    PP.ui.rollDice(die, rng.die(6), () => {
      label.textContent = pick.emoji + " " + pick.name + "!";
      sfx.tada(); PP.ui.confetti({ y: 0.3, count: 60 });
      setTimeout(() => { m.close(); startGame(pick, defaultSettings(pick)); }, 1100);
    });
  }

  /* ---------- game options sheet ---------- */
  function defaultSettings(def) {
    const s = {};
    (def.options || []).forEach((o) => { s[o.id] = o.def; });
    return s;
  }

  function openGameSheet(def) {
    const settings = defaultSettings(def);
    const msg = el("div.note.hide");
    const startBtn = el("button.btn.btn-big", "▶️ Let's play!");
    const bounds = () => {
      let min = def.min, max = def.max;
      (def.options || []).forEach((o) => {
        if (o.kind !== "cards") return;
        const ch = o.choices.find((c) => c.v === settings[o.id]);
        if (ch && ch.min != null) min = ch.min;
        if (ch && ch.max != null) max = ch.max;
      });
      return { min, max };
    };
    const check = () => {
      const n = present().length, { min, max } = bounds();
      let text = "";
      if (n < min) text = "Needs " + min + (min === max ? "" : "+") + " players — you've got " + n + ". Share the room code! 👋";
      else if (n > max) text = "This one fits " + max + " players. The others will cheer from the sidelines. 📣";
      msg.classList.toggle("hide", !text);
      msg.textContent = text;
      startBtn.disabled = n < min;
    };
    const controls = (def.options || []).map((o) => {
      if (o.kind === "cards") {
        const wrap = el("div.stack");
        const paint = () => Array.from(wrap.children).forEach((c) => c.classList.toggle("on", c.dataset.v === settings[o.id]));
        o.choices.forEach((c) => wrap.appendChild(el("button.opt-card", { type: "button", dataset: { v: c.v }, onclick: () => { settings[o.id] = c.v; paint(); check(); sfx.tap(); } },
          el("span.oc-emoji", c.emoji), el("span.oc-text", el("b", c.label), el("span", c.desc), c.min != null ? el("small", c.min === c.max ? c.min + " players" : c.min + "–" + c.max + " players") : null))));
        paint();
        return el("div", el("label.field", o.label), wrap);
      }
      if (o.kind === "toggle") {
        const b = el("button.pill" + (settings[o.id] ? ".on" : ""), { type: "button", onclick: () => { settings[o.id] = !settings[o.id]; b.classList.toggle("on", settings[o.id]); sfx.tap(); } }, o.label);
        return el("div", b, o.hint ? el("div.muted", { style: { fontSize: ".85rem", marginTop: "4px" } }, o.hint) : null);
      }
      const p = W.pills(o.choices, settings[o.id], (v) => { settings[o.id] = v; });
      return el("div", el("label.field", o.label), p.el);
    });
    startBtn.onclick = () => { m.close(); startGame(def, settings); };
    const m = modal(def.emoji + " " + def.name, el("div.stack",
      el("p", def.how),
      ...controls, msg, startBtn));
    check();
  }

  // a game (or the chosen mode of it) can narrow how many players it takes
  function playerLimit(def, settings) {
    let max = def.max;
    (def.options || []).forEach((o) => {
      if (o.kind !== "cards") return;
      const c = o.choices.find((x) => x.v === settings[o.id]);
      if (c && c.max != null) max = c.max;
    });
    return max;
  }

  function startGame(def, settings) {
    const roster = present().slice(0, playerLimit(def, settings)).map((p) => p.id);
    const recent = LS.get("gl.recent", []).filter((x) => x !== def.id);
    recent.unshift(def.id);
    LS.set("gl.recent", recent.slice(0, 6));
    room.send("game.start", { id: def.id, roster, settings }).catch((e) => toast(e.message));
  }

  /* =====================================================================
   *  Game host
   * ===================================================================== */
  function stopGame() {
    if (!game) return;
    try { game.inst && game.inst.destroy && game.inst.destroy(); } catch (e) { console.error(e); }
    game.cleanups.forEach((f) => { try { f(); } catch (e) {} });
    game = null;
  }

  function mountGame(e) {
    stopGame();
    const def = PP.games.find((g) => g.id === e.d.id);
    view = "game";
    lobby = null;
    pokebar.classList.remove("hide");
    if (!def) { mount(screen, el("div.card", "This game isn't on your version yet. Try refreshing the page! 🔄")); return; }

    const roster = e.d.roster || [];
    const root = el("div.game-root");
    const playersbar = el("div.playersbar");
    const paintPlayers = () => mount(playersbar, roster.map((id) => room.player(id)).filter(Boolean).map((p) => whoChip(p, false, true)));
    paintPlayers();

    const gamebar = el("div.gamebar",
      el("button.btn.btn-sm.btn-ghost", { onclick: endForEveryone }, "🏠 Lobby"),
      el("h2", def.emoji + " " + def.name),
      el("button.btn.btn-sm.btn-acc", { onclick: () => room.send("sys.pause", {}), title: "Pause for everyone — no questions asked" }, "⏸ Need a sec"));
    mount(screen, gamebar, playersbar, root);

    if (!roster.includes(room.pid)) {
      mount(root, el("div.card.center.stack", el("div", { style: { fontSize: "3rem" } }, "👀"), el("h3", "A game's already going!"), el("p.muted", "You'll hop in next round. Cheer them on with the buttons below! 📣")));
      game = { def, inst: null, ctx: null, cleanups: [], paintPlayers };
      return;
    }

    const cleanups = [];
    const ctx = {
      el: root, room, def, me: room.me(), settings: e.d.settings || {}, seed: e.d.seed, startT: e.t, rosterIds: roster,
      roster() { return roster.map((id) => room.player(id)).filter(Boolean); },
      player(id) { return room.player(id); },
      isHost() {
        const h = roster.map((id) => room.player(id)).filter((p) => p && p.present && !p.left).sort((a, b) => a.idx - b.idx)[0];
        return h ? h.id === room.pid : true;
      },
      send(type, data, opts) { return room.send("g." + type, data, opts).catch((err) => { toast(err.message); }); },
      sendEph(type, data, key) { return room.send("e." + type, data, { eph: true, key: key || type }).catch(() => {}); },
      now() { return room.now(); },
      timeLeft(startT, dur) { return room.timeLeft(startT, dur); },
      paused() { return room.paused; },
      vibe() { return (room.meta.settings || {}).vibe || "random"; },
      rng(key) { return PP.RNG.fromSeed(e.d.seed, key); },
      draw(deck, n, opts) { return PP.engine.draw(deck, n, Object.assign({ vibe: ctx.vibe() }, opts || {})); },
      cleanup(fn) { cleanups.push(fn); },
      live(ev) { return room.now() - ev.t < 4000; },                       // false while replaying history
      // a timeout that waits out pauses
      later(fn, ms) {
        let id; const arm = (m) => { id = setTimeout(() => { if (room.paused) arm(300); else fn(); }, m); };
        arm(ms); cleanups.push(() => clearTimeout(id)); return () => clearTimeout(id);
      },
      interval(fn, ms) { const id = setInterval(() => { if (!room.paused) fn(); }, ms); cleanups.push(() => clearInterval(id)); return id; },
      end() { return room.send("game.end", {}); },
      again() { return room.send("game.start", { id: def.id, roster: present().slice(0, playerLimit(def, ctx.settings)).map((p) => p.id), settings: ctx.settings }); },
      keep(kind, title, data) { return PP.keep.add(kind, title, data).then(() => toast("Saved to your keepsakes 🧸")).catch((err) => toast(err.message)); },
      toast,
    };
    game = { def, inst: null, ctx, cleanups, paintPlayers };
    try { game.inst = def.create(ctx); } catch (err) { console.error(err); mount(root, el("div.card", "Oops — this game tripped over its own shoelaces. 😵 ", String(err.message))); }
  }

  function endForEveryone() {
    const m = modal("Back to the lobby?", el("div.stack", el("p", "This ends the game for everyone."),
      el("div.row", el("button.btn", { onclick: () => { m.close(); room.send("game.end", {}); } }, "Yes, lobby"), el("button.btn.btn-ghost", { onclick: () => m.close() }, "Keep playing"))));
  }

  /* =====================================================================
   *  Pokes, pause overlay, room events
   * ===================================================================== */
  const POKES = ["🔥", "😂", "👏", "😱", "🫶", "🍅", "🎉", "💥", "🫵", "😴"];
  let lastPoke = 0;
  function buildPokebar() {
    mount(pokebar, el("span.pk-label#pk-label", "→ everyone"), POKES.map((e) => el("button.pk", { "aria-label": "send " + e, onclick: () => {
      const now = Date.now(); if (now - lastPoke < 250) return; lastPoke = now;
      room.send("sys.poke", { e, to: pokeTarget || null }, { eph: true }); sfx.pop();
    } }, e)));
  }
  function paintTargets() {
    document.querySelectorAll(".pchip[data-pid]").forEach((c) => c.classList.toggle("target", c.dataset.pid === pokeTarget));
    const who = pokeTarget && room.player(pokeTarget) ? room.player(pokeTarget).name : "everyone";
    const lbl = document.getElementById("pk-label");
    if (lbl) lbl.textContent = "→ " + who;
  }

  room.on("poke", (e) => {
    const from = room.player(e.f), d = e.d || {};
    const toP = d.to ? room.player(d.to) : null;
    sfx.poke();
    PP.ui.floatEmoji(d.e || "🔥", (from ? from.name : "?") + (toP ? " → " + toP.name : ""), from && from.color);
    if (d.e === "🍅" && d.to === room.pid) { document.body.appendChild(el("div.splat", "🍅")); setTimeout(() => document.querySelector(".splat") && document.querySelector(".splat").remove(), 1700); }
    if (d.e === "🎉") PP.ui.confetti({ count: 50, y: 0.6 });
  });

  const overlay = document.getElementById("pause-overlay");
  room.on("pause", (paused, by) => {
    if (paused) {
      const p = room.player(by);
      mount(overlay, el("div.pause-card.stack", el("div.big", "💛"), el("h2", (p ? p.name : "Someone") + " needs a moment"),
        el("p", "Everything is paused — no rush at all. Take a breath, grab a drink."),
        el("button.btn.btn-big", { onclick: () => room.send("sys.resume", {}) }, "▶️ I'm ready")));
      overlay.classList.remove("hide");
    } else overlay.classList.add("hide");
    if (game && game.inst && game.inst.onPause) game.inst.onPause(paused);
  });

  room.on("players", () => {
    if (view === "lobby") refreshLobby();
    if (view === "game" && game) { game.paintPlayers && game.paintPlayers(); if (game.inst && game.inst.onPlayers) game.inst.onPlayers(); }
    paintTargets();
  });
  room.on("settings", () => { if (view === "lobby") refreshLobby(); });
  room.on("gamestart", (e) => { overlay.classList.add("hide"); mountGame(e); });
  room.on("gameend", () => { overlay.classList.add("hide"); if (view === "game" || view === "lobby") renderLobby(); });
  room.on("gameevent", (e) => {
    if (!game || !game.inst || !game.inst.onEvent) return;
    const ev = { type: e.y.slice(2), eph: e.y[0] === "e", d: e.d, f: e.f, s: e.s, t: e.t, to: e.to };
    try { game.inst.onEvent(ev); } catch (err) { console.error("game event", err); }
  });
  room.on("kicked", (msg) => { toast(msg || "You were disconnected from the room."); room.stop(); pokebar.classList.add("hide"); renderHome(); });
  room.on("online", (v) => document.getElementById("online-banner").classList.toggle("hide", v));

  /* =====================================================================
   *  Boot
   * ===================================================================== */
  PP.current = () => game;
  PP.app = { enter, renderHome, renderLobby, room, get profile() { return profile; } };

  async function boot() {
    renderTopbar();
    PP.account.applySavedTheme();
    await PP.account.refresh();
    const q = new URLSearchParams(location.search);
    const code = (q.get("room") || "").toUpperCase().replace(/[^A-Z0-9\-]/g, "");
    if (code) {
      const seat = room.savedSeat(code);
      if (seat || hasSavedProfile) { if (await enter("join", code)) return; }
      renderHome(code, true);
      return;
    }
    renderHome();
  }
  boot();
})();
