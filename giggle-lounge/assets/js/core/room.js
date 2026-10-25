/* Talking to the server: a tiny fetch wrapper and the RoomClient.
 * RoomClient keeps one long-poll loop open, applies events strictly in server order, and turns
 * them into callbacks. Swap this file for a WebSocket client later and the games won't notice. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});

  async function api(file, body, signal) {
    let r;
    try {
      r = await fetch("api/" + file, {
        method: "POST", credentials: "same-origin", signal,
        headers: { "Content-Type": "application/json", "X-GL": "1" },
        body: JSON.stringify(body || {}),
      });
    } catch (e) {
      if (e.name === "AbortError") throw e;
      throw Object.assign(new Error("Can't reach the server — check your connection."), { offline: true });
    }
    let j;
    try { j = await r.json(); } catch (e) { j = { ok: false, error: "The server sent something unexpected. Is PHP running?" }; }
    if (!j.ok) throw Object.assign(new Error(j.error || "Something went wrong"), { status: r.status });
    return j;
  }
  PP.api = api;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  class RoomClient {
    constructor() {
      this.h = {};                      // event handlers
      this.code = null; this.pid = null; this.token = null;
      this.players = []; this.meta = { settings: { vibe: "random" } };
      this.lastSeq = 0; this.running = false; this.online = true;
      this.offset = 0; this._bestRtt = Infinity;
      this.pausedBy = null; this.pausedAt = 0; this.pausedMs = 0;
      this.inGame = false;
      this._q = []; this._sending = false; this._abort = null; this._gen = 0;
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.running && this._abort) this._abort.abort();   // wake the poll right away
      });
    }
    on(name, fn) { (this.h[name] = this.h[name] || []).push(fn); return this; }
    emit(name, a, b) { (this.h[name] || []).forEach((fn) => { try { fn(a, b); } catch (e) { console.error(name, e); } }); }

    now() { return Date.now() + this.offset; }
    me() { return this.players.find((p) => p.id === this.pid) || null; }
    player(id) { return this.players.find((p) => p.id === id) || null; }

    /* ---- joining ---- */
    async create(profile) {
      const r = await api("room.php", Object.assign({ action: "create" }, profile));
      this._seat(r); return r;
    }
    async join(code, profile) {
      code = String(code).toUpperCase().replace(/[^A-Z0-9\-]/g, "");
      const saved = LS.get("gl.seat." + code) || {};
      const r = await api("room.php", Object.assign({ action: "join", code, pid: saved.pid, token: saved.token }, profile));
      this._seat(r); return r;
    }
    _seat(r) {
      this.code = r.code; this.pid = r.pid; this.token = r.token;
      LS.set("gl.seat." + r.code, { pid: r.pid, token: r.token });
      LS.set("gl.lastRoom", r.code);
      this.lastSeq = 0; this.inGame = false;
      this.pausedBy = null; this.pausedMs = 0;
    }
    savedSeat(code) { return LS.get("gl.seat." + code); }

    /* ---- the poll loop ---- */
    start() {
      if (this.running) return;
      this.running = true;
      const gen = ++this._gen;
      this._loop(gen);
    }
    stop() { this.running = false; this._gen++; if (this._abort) this._abort.abort(); }

    async _loop(gen) {
      let backoff = 0;
      while (this.running && gen === this._gen) {
        const t0 = Date.now();
        this._abort = new AbortController();
        try {
          const r = await api("room.php", { action: "poll", code: this.code, pid: this.pid, token: this.token, since: this.lastSeq, wait: PP.config.pollWait }, this._abort.signal);
          if (gen !== this._gen) return;
          this._clock(r, t0);
          this._apply(r);
          backoff = 0; this._setOnline(true);
        } catch (e) {
          if (gen !== this._gen) return;
          if (e.name === "AbortError") continue;
          if (e.status === 403 || e.status === 404) { this.running = false; this.emit("kicked", e.message); return; }
          this._setOnline(false);
          await sleep(Math.min(5000, 500 * Math.pow(2, backoff++)));
          continue;
        }
        const spent = Date.now() - t0;
        if (spent < 350) await sleep(350 - spent);      // never spin: also the fallback if the host disables long-polling
      }
    }
    _setOnline(v) { if (v !== this.online) { this.online = v; this.emit("online", v); } }
    _clock(r, t0) {
      const t1 = Date.now(), rtt = t1 - t0;
      if (rtt < this._bestRtt + 40) { this._bestRtt = Math.min(this._bestRtt, rtt); this.offset = r.now - (t0 + t1) / 2; }
    }

    _apply(r) {
      if (r.players) {
        const before = JSON.stringify(this.players);
        this.players = r.players;
        if (JSON.stringify(this.players) !== before) this.emit("players", this.players);
      }
      if (r.meta) {
        const b = JSON.stringify(this.meta.settings);
        this.meta = r.meta;
        if (JSON.stringify(r.meta.settings) !== b) this.emit("settings", r.meta.settings);
      }
      const evs = (r.events || []).filter((e) => e.s > this.lastSeq).sort((a, b) => a.s - b.s);
      for (const e of evs) { this.lastSeq = e.s; this._dispatch(e); }
    }

    _dispatch(e) {
      switch (e.y) {
        case "game.start": this.inGame = true; this.pausedBy = null; this.pausedMs = 0; this.emit("gamestart", e); break;
        case "game.end":   this.inGame = false; this.pausedBy = null; this.emit("gameend", e); break;
        case "sys.pause":  if (!this.pausedBy) { this.pausedBy = e.f; this.pausedAt = e.t; this.emit("pause", true, e.f); } break;
        case "sys.resume": if (this.pausedBy) { this.pausedMs += e.t - this.pausedAt; this.pausedBy = null; this.emit("pause", false, e.f); } break;
        case "sys.poke":   this.emit("poke", e); break;
        case "sys.join":   break;
        default:
          if (e.y.startsWith("g.") || e.y.startsWith("e.")) this.emit("gameevent", e);
      }
    }

    /* ms still left on a timer that started at server-time startT, not counting paused time */
    timeLeft(startT, dur) {
      let paused = this.pausedMs;
      if (this.pausedBy) paused += this.now() - this.pausedAt;
      return Math.max(0, startT + dur + paused - this.now());
    }
    get paused() { return !!this.pausedBy; }

    /* ---- sending (serialised, so one player's events always arrive in order) ---- */
    send(type, data, opts) {
      opts = opts || {};
      return new Promise((resolve, reject) => {
        const item = { type, data: data == null ? {} : data, to: opts.to, eph: !!opts.eph, key: opts.key, resolve, reject };
        if (item.key) {                                    // coalesce: only the newest value for a key matters
          const old = this._q.findIndex((q) => q.key === item.key);
          if (old >= 0) { this._q[old].resolve(); this._q.splice(old, 1); }
        }
        this._q.push(item);
        this._drain();
      });
    }
    async _drain() {
      if (this._sending) return;
      this._sending = true;
      while (this._q.length) {
        const it = this._q.shift();
        try {
          const r = await api("room.php", { action: "send", code: this.code, pid: this.pid, token: this.token,
            type: it.type, data: it.data, to: it.to, eph: it.eph, since: this.lastSeq });
          this._clock(r, Date.now() - 60);
          this._apply(r); this._setOnline(true); it.resolve(r);
        } catch (e) {
          if (e.offline) this._setOnline(false);
          it.reject(e);
        }
      }
      this._sending = false;
    }

    async leave() {
      this.stop();
      try { await api("room.php", { action: "leave", code: this.code, pid: this.pid, token: this.token }); } catch (e) {}
      LS.del("gl.seat." + this.code);
      LS.del("gl.lastRoom");
      this.code = null;
    }
  }

  PP.config = PP.config || { pollWait: 3 };
  PP.RoomClient = RoomClient;
})();
