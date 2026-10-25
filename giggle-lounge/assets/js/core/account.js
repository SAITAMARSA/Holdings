/* Themes, optional accounts (login, link with a partner, private "Our Room") and the keepsake drawer. */
(function () {
  "use strict";
  const PP = window.PP;
  const { el, mount, toast, modal } = PP.ui;
  const W = PP.widgets;

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const THEMES = [
    { id: "candy", name: "Candy Night", emoji: "🍬", c: ["#3FD64F", "#FF5CA8", "#7A22C9"] },
    { id: "bubblegum", name: "Bubblegum Pop", emoji: "🫧", c: ["#FF4D9E", "#7B4DFF", "#FFE14D"] },
    { id: "ocean", name: "Ocean Zing", emoji: "🌊", c: ["#FF9F1C", "#1AA7EC", "#0A8CD8"] },
    { id: "lime", name: "Lime Fizz", emoji: "🍋", c: ["#FF5CA8", "#27C26A", "#2FB864"] },
    { id: "sunset", name: "Sunset Sorbet", emoji: "🌅", c: ["#3FD64F", "#FF6B3D", "#FF6B3D"] },
    { id: "grape", name: "Grape Romance", emoji: "💜", c: ["#FF4FA3", "#B13CFF", "#8F2BD1"] },
  ];

  const A = (PP.account = {
    user: null,

    applySavedTheme() {
      const t = LS.get("gl.theme", null), c = LS.get("gl.accent", null);
      if (t) document.documentElement.setAttribute("data-theme", t);
      if (c) document.documentElement.style.setProperty("--pri", c);
    },

    async refresh() {
      try { const r = await PP.api("auth.php", { action: "me" }); A.user = r.me; if (A.user) PP.engine.pull(); } catch (e) { A.user = null; }
      return A.user;
    },

    /* ---------- colours ---------- */
    themeModal() {
      const cur = document.documentElement.getAttribute("data-theme") || "candy";
      const grid = el("div.stack");
      const paint = () => Array.from(grid.children).forEach((c) => c.classList.toggle("on", c.dataset.t === (document.documentElement.getAttribute("data-theme") || "candy")));
      THEMES.forEach((t) => grid.appendChild(el("button.opt-card", { type: "button", dataset: { t: t.id }, onclick: () => {
        document.documentElement.setAttribute("data-theme", t.id);
        document.documentElement.style.removeProperty("--pri"); LS.set("gl.accent", null);
        LS.set("gl.theme", t.id); paint(); PP.sfx.pop();
      } }, el("span.oc-emoji", t.emoji), el("span.oc-text", el("b", t.name), el("span.row", t.c.map((c) => el("span", { style: { width: "26px", height: "26px", borderRadius: "50%", background: c, border: "3px solid #fff", boxShadow: "0 2px 0 rgba(0,0,0,.25)", display: "inline-block" } })))))));
      paint();
      const picker = el("input", { type: "color", value: LS.get("gl.accent", null) || "#3FD64F", style: { width: "56px", height: "40px", border: "3px solid var(--ink)", borderRadius: "10px", padding: "0", background: "#fff" },
        oninput: () => { document.documentElement.style.setProperty("--pri", picker.value); LS.set("gl.accent", picker.value); } });
      modal("🎨 Pick your colours", el("div.stack", grid,
        el("div.row", el("b", "Or your own main colour:"), picker,
          el("button.btn.btn-sm.btn-ghost", { onclick: () => { LS.set("gl.accent", null); document.documentElement.style.removeProperty("--pri"); toast("Back to the theme's colour"); } }, "Reset")),
        el("p.muted", "Colours stay on this device only.")));
    },

    /* ---------- account ---------- */
    modal() {
      const body = el("div.stack");
      const m = modal("👤 You", body);
      const draw = () => A.user ? drawIn(body, m, draw) : drawOut(body, m, draw);
      draw();
    },

    /* ---------- keepsakes ---------- */
    keepsakes() {
      const body = el("div.stack", el("p.muted", "Loading…"));
      modal("🧸 Keepsakes", body);
      PP.keep.list().then((items) => {
        mount(body,
          A.user ? el("p.muted", A.user.couple ? "Shared with " + (A.user.couple.partner || "your partner") + " — only the two of you can see these. 💞" : "Saved to your account.") : el("p.muted", "Saved on this device. Log in to keep them forever and share with your partner."),
          items.length ? items.map((it) => keepCard(it, () => { PP.keep.del(it).then(() => { toast("Removed"); A.keepsakes && 0; }); })) : el("div.card.center", "Nothing yet! Play a game and tap 🧸 Keep it on something you love."));
      }).catch((e) => mount(body, el("p", e.message)));
    },
  });

  /* ---------- account views ---------- */
  function drawOut(body, m, redraw) {
    let mode = "login";
    const wrap = el("div.stack");
    const paint = () => {
      const email = el("input.in", { type: "email", placeholder: "you@example.com", autocomplete: "email" });
      const name = el("input.in", { placeholder: "Display name", maxLength: 16 });
      const pass = el("input.in", { type: "password", placeholder: mode === "signup" ? "Password (8+ characters)" : "Password", autocomplete: mode === "signup" ? "new-password" : "current-password" });
      const go = el("button.btn.btn-big", { onclick: async () => {
        go.disabled = true;
        try {
          const r = await PP.api("auth.php", mode === "signup" ? { action: "register", email: email.value, name: name.value, password: pass.value } : { action: "login", email: email.value, password: pass.value });
          A.user = r.me; PP.engine.pull(); toast("Welcome, " + r.me.name + "! 🎉"); redraw();
        } catch (e) { toast(e.message); go.disabled = false; }
      } }, mode === "signup" ? "Create account" : "Log in");
      mount(wrap,
        el("div.pills", el("button.pill" + (mode === "login" ? ".on" : ""), { onclick: () => { mode = "login"; paint(); } }, "Log in"), el("button.pill" + (mode === "signup" ? ".on" : ""), { onclick: () => { mode = "signup"; paint(); } }, "Sign up")),
        mode === "signup" ? name : null, email, pass, go);
    };
    paint();
    mount(body,
      el("p", "You never need an account to play. Make one if you want a ", el("b", "private room just for the two of you"), ", a keepsake drawer, and a taste profile that follows you."),
      wrap,
      el("p.muted", { style: { fontSize: ".85rem" } }, "We store your email, display name, a scrambled password, and whatever keepsakes you choose to save. Game answers live only in the room while you play."));
  }

  function drawIn(body, m, redraw) {
    const u = A.user;
    const emailIn = el("input.in", { type: "email", placeholder: "their email", autocomplete: "off" });
    const act = async (payload, okMsg) => {
      try { const r = await PP.api("auth.php", payload); if (r.me) A.user = r.me; if (okMsg) toast(okMsg); redraw(); } catch (e) { toast(e.message); }
    };
    mount(body,
      el("div.row", W.avatar({ avatar: "🙂", color: "var(--acc)" }, 44), el("div", el("b", u.name), el("div.muted", { style: { fontSize: ".85rem" } }, u.email))),
      u.couple
        ? el("div.card.stack", el("h3", "💞 Linked with " + (u.couple.partner || "your partner")),
            el("p", "You have a private room that only the two of you can enter."),
            el("button.btn.btn-acc", { onclick: async () => { m.close(); await PP.app.enter("join", u.couple.roomCode); } }, "💞 Go to our private room"),
            el("button.btn.btn-sm.btn-ghost", { onclick: () => { if (confirm("Unlink your accounts? Your shared keepsakes stay safe with the couple record but you'll lose the private room.")) act({ action: "unlink" }, "Unlinked"); } }, "Unlink"))
        : el("div.card.stack", el("h3", "Link up with your partner"),
            el("p", "Both of you make an account, then one invites the other by email. Once they accept, you get a private room and shared keepsakes."),
            u.incoming.map((i) => el("div.row", el("b", "💌 " + i.from + " invited you"), el("button.btn.btn-sm.btn-good", { onclick: () => act({ action: "respond", id: i.id, accept: true }, "Linked! 💞") }, "Accept"), el("button.btn.btn-sm.btn-ghost", { onclick: () => act({ action: "respond", id: i.id, accept: false }) }, "No thanks"))),
            u.outgoing.map((o) => el("div.note", "Waiting for " + o.to + " to accept…")),
            el("div.row", { style: { flexWrap: "nowrap" } }, el("div.grow", emailIn), el("button.btn.btn-sm", { onclick: () => act({ action: "invite", email: emailIn.value }, "Invite sent! They'll see it when they log in.") }, "Invite"))),
      el("div.row",
        el("button.btn.btn-sm.btn-ghost", { onclick: () => { PP.engine.reset(); toast("Taste profile wiped — fresh start! 🧼"); } }, "🧼 Reset my taste profile"),
        el("button.btn.btn-sm.btn-ghost", { onclick: async () => { await PP.api("auth.php", { action: "logout" }); A.user = null; toast("Logged out"); redraw(); } }, "Log out")));
  }

  /* ---------- keepsakes store (account if logged in, otherwise this device) ---------- */
  PP.keep = {
    async add(kind, title, data) {
      if (A.user) return PP.api("auth.php", { action: "keep_add", kind, title, data });
      const items = LS.get("gl.keeps", []);
      items.push({ id: "L" + Date.now(), kind, title, data, by: (PP.app && PP.app.profile.name) || "me", t: Date.now() });
      LS.set("gl.keeps", items.slice(-40));
    },
    async list() {
      if (A.user) return (await PP.api("auth.php", { action: "keep_list" })).items;
      return LS.get("gl.keeps", []).slice().reverse();
    },
    async del(it) {
      if (A.user) return PP.api("auth.php", { action: "keep_del", id: it.id });
      LS.set("gl.keeps", LS.get("gl.keeps", []).filter((k) => k.id !== it.id));
    },
  };

  function keepCard(it, onDel) {
    const d = it.data || {};
    let inner;
    if (it.kind === "gift") inner = el("div", el("div.big-emoji", (d.items || []).map((x) => x.e).join(" ")), d.note ? el("p", "“" + d.note + "”") : null, el("small.muted", (d.from || it.by) + " → " + (d.to || "?")));
    else if (it.kind === "story") inner = el("p", { style: { whiteSpace: "pre-wrap" } }, d.text || "");
    else if (it.kind === "drawing") inner = el("div", d.img ? el("img", { src: d.img, style: { width: "100%", borderRadius: "12px", border: "3px solid var(--ink)" } }) : null, d.word ? el("small.muted", "It was: " + d.word) : null);
    else if (it.kind === "pitch") inner = el("div", el("b", d.product + " → " + d.customer), el("p", "“" + d.pitch + "”"), el("small.muted", "pitched by " + (d.by || it.by)));
    else inner = el("pre", { style: { whiteSpace: "pre-wrap" } }, JSON.stringify(d, null, 1));
    return el("div.card.stack", el("div.row", el("b.grow", it.title), el("small.muted", new Date(it.t).toLocaleDateString())), inner,
      el("div.row", el("small.muted.grow", "kept by " + it.by), el("button.btn.btn-sm.btn-ghost", { onclick: (e) => { onDel(); e.currentTarget.closest(".card").remove(); } }, "🗑️")));
  }
})();
