/* Small UI toolkit: element builder, toasts, confetti, floating emoji, modal, dice. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});

  /* el("div.card#id", {onclick, style:{}, dataset:{}}, child, "text", [children]) */
  function el(spec, attrs, ...kids) {
    const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(spec) || [];
    const node = document.createElement(m[1] || "div");
    (m[2] || "").replace(/([.#])([\w-]+)/g, (_, k, v) => {
      if (k === "#") node.id = v; else node.classList.add(v);
    });
    if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) {
      kids.unshift(attrs); attrs = null;
    }
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "class") node.className += " " + v;
        else if (k === "text") node.textContent = v;
        else if (k in node && k !== "list" && k !== "type") { try { node[k] = v; } catch (e) { node.setAttribute(k, v); } }
        else node.setAttribute(k, v === true ? "" : v);
      }
    }
    append(node, kids);
    return node;
  }
  function append(node, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      node.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function mount(node, ...kids) { clear(node); append(node, kids); return node; }

  /* toast */
  let toastBox = null;
  function toast(msg, ms) {
    if (!toastBox) { toastBox = el("div#toasts"); document.body.appendChild(toastBox); }
    const t = el("div.toast", msg);
    toastBox.appendChild(t);
    setTimeout(() => t.classList.add("out"), ms || 2600);
    setTimeout(() => t.remove(), (ms || 2600) + 400);
  }

  /* confetti: one lightweight canvas, removed when done */
  const CONF = ["#FF5CA8", "#FFD23F", "#2EE6A6", "#4DB8FF", "#A66CFF", "#FF9F1C", "#FF6B6B", "#9BE564"];
  function confetti(opts) {
    opts = opts || {};
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = el("canvas.confetti");
    cv.width = innerWidth; cv.height = innerHeight;
    document.body.appendChild(cv);
    const g = cv.getContext("2d");
    const n = opts.count || 110;
    const ox = (opts.x != null ? opts.x : 0.5) * cv.width, oy = (opts.y != null ? opts.y : 0.35) * cv.height;
    const ps = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
      ps.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: 4 + Math.random() * 6,
                c: CONF[(Math.random() * CONF.length) | 0], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, sq: Math.random() < 0.5 });
    }
    let frames = 0;
    (function tick() {
      g.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p) => {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c;
        if (p.sq) g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { g.beginPath(); g.arc(0, 0, p.r / 1.6, 0, 7); g.fill(); }
        g.restore();
      });
      if (++frames < 110) requestAnimationFrame(tick); else cv.remove();
    })();
  }

  /* an emoji that floats up the screen (pokes, reactions) */
  function floatEmoji(emoji, label, fromColor) {
    const x = 10 + Math.random() * 78;
    const f = el("div.floaty", { style: { left: x + "%" } },
      el("span.floaty-emoji", emoji),
      label ? el("span.floaty-name", { style: { background: fromColor || "#fff" } }, label) : null);
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 2600);
  }

  /* modal sheet */
  function modal(title, body, opts) {
    opts = opts || {};
    const back = el("div.modal-back");
    const close = () => { back.classList.add("out"); setTimeout(() => back.remove(), 180); if (opts.onClose) opts.onClose(); };
    const box = el("div.modal", { role: "dialog", "aria-label": title },
      el("div.modal-head", el("h2", title), el("button.icon-btn", { "aria-label": "Close", onclick: close }, "✕")),
      el("div.modal-body", body));
    back.appendChild(box);
    back.addEventListener("pointerdown", (e) => { if (e.target === back) close(); });
    document.body.appendChild(back);
    return { close, box };
  }

  /* dice: animates to a face and calls back with the value */
  const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  function rollDice(node, value, done) {
    node.classList.add("rolling");
    let i = 0;
    PP.sfx && PP.sfx.dice();
    const iv = setInterval(() => { node.textContent = FACES[(Math.random() * 6) | 0]; if (++i > 9) { clearInterval(iv); node.textContent = FACES[value - 1]; node.classList.remove("rolling"); done && done(); } }, 70);
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function fmtTime(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  PP.ui = { el, clear, mount, append, toast, confetti, floatEmoji, modal, rollDice, FACES, esc, fmtTime, debounce };
})();
