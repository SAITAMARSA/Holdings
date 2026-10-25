/* Candy March engine — a deterministic match-3 board.
 *
 * Everything that is random (refills, reshuffles) comes from the RNG you pass in, consumed in a fixed order,
 * so the same swaps always produce the same board on every phone. swap() returns a list of animation STEPS
 * (swap / clear / fall / shuffle); the board's logical state is already final when swap() returns.
 *
 * Candies are { id, t, s }:  t = flavour 0..types-1 (bomb: -1),  s = special
 *   0 plain · 1 striped across (clears its ROW) · 2 striped down (clears its COLUMN) · 3 wrapped (3×3 blast) · 4 colour bomb
 * Match 4 → striped · match 5 → colour bomb · L / T shape → wrapped.
 */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});
  const SP = { NONE: 0, ROW: 1, COL: 2, WRAP: 3, BOMB: 4 };
  const PER = 40;                                   // points per candy
  const LABELS = ["Sweet!", "Tasty!", "Delicious!", "Divine!", "Sugar Rush!", "SCRUMPTIOUS!", "CANDY GOD!"];
  const key = (r, c) => r * 100 + c;

  class CandyBoard {
    constructor(o) {
      this.w = o.w; this.h = o.h; this.rng = o.rng; this.types = o.types || 6; this.party = !!o.party;
      this.nid = 1; this.grid = [];
      if (!o.empty) this.fill();
    }
    spawn() {
      const t = this.rng.int(this.types);
      let s = 0;
      if (this.party && this.rng.chance(0.05)) s = this.rng.chance(0.5) ? SP.ROW : SP.COL;     // party candies fall in sometimes
      return { id: this.nid++, t, s };
    }
    cell(r, c) { return r >= 0 && r < this.h && c >= 0 && c < this.w ? this.grid[r][c] : null; }

    /* initial fill: never starts with a match, always has a move */
    fill() {
      for (let tries = 0; tries < 60; tries++) {
        this.grid = [];
        for (let r = 0; r < this.h; r++) {
          const row = [];
          for (let c = 0; c < this.w; c++) {
            let t = this.rng.int(this.types), guard = 0;
            const bad = (x) => (c >= 2 && row[c - 1].t === x && row[c - 2].t === x) || (r >= 2 && this.grid[r - 1][c].t === x && this.grid[r - 2][c].t === x);
            while (bad(t) && guard++ < this.types) t = (t + 1) % this.types;
            row.push({ id: this.nid++, t, s: 0 });
          }
          this.grid.push(row);
        }
        if (this.findRuns().length === 0 && this.hint()) return;
      }
    }
    setTypes(rows) {                                  // tests: rows of digit strings ('.' = random)
      this.grid = rows.map((str) => str.split("").map((ch) => ({ id: this.nid++, t: ch === "." ? this.rng.int(this.types) : Number(ch), s: 0 })));
      this.h = rows.length; this.w = rows[0].length;
    }

    /* ---------- finding matches ---------- */
    findRuns() {
      const runs = [];
      for (let r = 0; r < this.h; r++) {
        let c = 0;
        while (c < this.w) {
          const a = this.grid[r][c];
          if (!a || a.t < 0) { c++; continue; }
          let e = c + 1;
          while (e < this.w && this.grid[r][e] && this.grid[r][e].t === a.t) e++;
          if (e - c >= 3) runs.push({ dir: "h", t: a.t, cells: Array.from({ length: e - c }, (_, i) => [r, c + i]) });
          c = e;
        }
      }
      for (let c = 0; c < this.w; c++) {
        let r = 0;
        while (r < this.h) {
          const a = this.grid[r][c];
          if (!a || a.t < 0) { r++; continue; }
          let e = r + 1;
          while (e < this.h && this.grid[e][c] && this.grid[e][c].t === a.t) e++;
          if (e - r >= 3) runs.push({ dir: "v", t: a.t, cells: Array.from({ length: e - r }, (_, i) => [r + i, c]) });
          r = e;
        }
      }
      return runs;
    }

    _swapCells(a, b) { const t = this.grid[a[0]][a[1]]; this.grid[a[0]][a[1]] = this.grid[b[0]][b[1]]; this.grid[b[0]][b[1]] = t; }
    _adjacent(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }

    /* is swapping a<->b a legal move? (leaves the board untouched) */
    canSwap(a, b) {
      if (!this._adjacent(a, b) || !this.cell(a[0], a[1]) || !this.cell(b[0], b[1])) return false;
      const A = this.grid[a[0]][a[1]], B = this.grid[b[0]][b[1]];
      if (A.s === SP.BOMB || B.s === SP.BOMB || (A.s && B.s)) return true;
      this._swapCells(a, b);
      const ok = this.findRuns().length > 0;
      this._swapCells(a, b);
      return ok;
    }
    /* first available move, or null */
    hint() {
      for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
        if (c + 1 < this.w && this.canSwap([r, c], [r, c + 1])) return [[r, c], [r, c + 1]];
        if (r + 1 < this.h && this.canSwap([r, c], [r + 1, c])) return [[r, c], [r + 1, c]];
      }
      return null;
    }
    /* every legal move (for bots / tests) */
    allMoves() {
      const o = [];
      for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
        if (c + 1 < this.w && this.canSwap([r, c], [r, c + 1])) o.push([[r, c], [r, c + 1]]);
        if (r + 1 < this.h && this.canSwap([r, c], [r + 1, c])) o.push([[r, c], [r + 1, c]]);
      }
      return o;
    }

    /* ---------- the move ---------- */
    swap(a, b) {
      if (!this.canSwap(a, b)) return { ok: false, gain: 0, steps: [{ k: "swap", a, b, bounce: true }] };
      const A = this.grid[a[0]][a[1]], B = this.grid[b[0]][b[1]];
      let forced = null;
      this._swapCells(a, b);                                   // after this, A sits at b and B sits at a
      if (A.s === SP.BOMB || B.s === SP.BOMB) forced = this._bombCombo(A, B, a, b);
      else if (A.s && B.s) forced = this._specialCombo(A, B, b);
      const steps = [{ k: "swap", a, b, bounce: false }];
      const res = this._resolve({ pivots: [a, b], forced });
      steps.push(...res.steps);
      const sh = this._ensureMoves();
      if (sh) steps.push(sh);
      return { ok: true, gain: res.gain, combo: res.combo, made: res.made, cleared: res.cleared, steps };
    }

    _bombCombo(A, B, a, b) {
      const bombIsA = A.s === SP.BOMB, other = bombIsA ? B : A, bombPos = bombIsA ? b : a;      // A moved to b
      const clear = [bombPos], convert = [];
      if (other.s === SP.BOMB) {                                // two bombs: everything goes
        for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) clear.push([r, c]);
        return { clear, fx: [{ k: "all" }], bonus: 600 };
      }
      const t = other.t;
      for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
        const x = this.grid[r][c];
        if (x && x.t === t && x.id !== other.id) {
          clear.push([r, c]);
          if (other.s === SP.ROW || other.s === SP.COL) convert.push({ r, c, s: (r + c) % 2 ? SP.ROW : SP.COL });   // bomb + striped: every one of that colour becomes striped
          else if (other.s === SP.WRAP) convert.push({ r, c, s: SP.WRAP });
        }
      }
      const otherPos = bombIsA ? a : b;
      clear.push(otherPos);
      return { clear, convert, fx: [{ k: "zap", from: bombPos, to: clear.slice(1) }], bonus: other.s ? 300 : 150 };
    }
    _specialCombo(A, B, at) {
      const [r, c] = at, clear = [];
      const addRow = (rr) => { for (let x = 0; x < this.w; x++) clear.push([rr, x]); };
      const addCol = (cc) => { for (let y = 0; y < this.h; y++) clear.push([y, cc]); };
      const stripe = (s) => s === SP.ROW || s === SP.COL;
      const fx = [];
      if (stripe(A.s) && stripe(B.s)) { addRow(r); addCol(c); fx.push({ k: "row", r }, { k: "col", c }); }
      else if (A.s === SP.WRAP && B.s === SP.WRAP) { for (let y = r - 2; y <= r + 2; y++) for (let x = c - 2; x <= c + 2; x++) if (this.cell(y, x)) clear.push([y, x]); fx.push({ k: "blast", r, c, rad: 2 }); }
      else { for (let d = -1; d <= 1; d++) { if (r + d >= 0 && r + d < this.h) { addRow(r + d); fx.push({ k: "row", r: r + d }); } if (c + d >= 0 && c + d < this.w) { addCol(c + d); fx.push({ k: "col", c: c + d }); } } }
      return { clear, fx, bonus: 250 };
    }

    /* cascade loop */
    _resolve(o) {
      const steps = []; let combo = 0, gain = 0, forced = o.forced, made = 0; const cleared = {};
      for (;;) {
        const runs = this.findRuns();
        if (!runs.length && !forced) break;
        combo++;
        const clearSet = new Map(), created = [], fx = [], convert = [];
        let bonus = 0;
        // 1. group overlapping runs and decide what each group makes
        const groups = [];
        for (const run of runs) {
          const hit = groups.filter((g) => run.cells.some(([r, c]) => g.keys.has(key(r, c))));
          const g = hit[0] || { keys: new Set(), runs: [] };
          hit.slice(1).forEach((h) => { h.keys.forEach((k) => g.keys.add(k)); g.runs.push(...h.runs); groups.splice(groups.indexOf(h), 1); });
          run.cells.forEach(([r, c]) => g.keys.add(key(r, c))); g.runs.push(run);
          if (!hit[0]) groups.push(g);
        }
        const pivots = combo === 1 ? o.pivots : [];
        for (const g of groups) {
          const cells = Array.from(g.keys).map((k) => [Math.floor(k / 100), k % 100]);
          cells.forEach(([r, c]) => clearSet.set(key(r, c), [r, c]));
          const hr = g.runs.filter((x) => x.dir === "h").sort((a, b) => b.cells.length - a.cells.length)[0];
          const vr = g.runs.filter((x) => x.dir === "v").sort((a, b) => b.cells.length - a.cells.length)[0];
          const t = g.runs[0].t;
          const pivotIn = (list) => pivots.find(([pr, pc]) => list.some(([r, c]) => r === pr && c === pc)) || list[Math.floor(list.length / 2)];
          let make = null;
          if (hr && vr && hr.cells.length >= 3 && vr.cells.length >= 3 && g.keys.size > Math.max(hr.cells.length, vr.cells.length)) {
            const cross = hr.cells.find(([r, c]) => vr.cells.some(([r2, c2]) => r2 === r && c2 === c)) || pivotIn(cells);
            make = { at: cross, t, s: SP.WRAP };
          } else {
            const best = (hr && vr ? (hr.cells.length >= vr.cells.length ? hr : vr) : hr || vr);
            const len = best.cells.length;
            if (len >= 5) make = { at: pivotIn(best.cells), t: -1, s: SP.BOMB };
            else if (len === 4) make = { at: pivotIn(best.cells), t, s: best.dir === "h" ? SP.COL : SP.ROW };
          }
          if (make) { created.push(make); bonus += 120; }
        }
        if (forced) { forced.clear.forEach(([r, c]) => this.cell(r, c) && clearSet.set(key(r, c), [r, c])); (forced.convert || []).forEach((cv) => convert.push(cv)); fx.push(...(forced.fx || [])); bonus += forced.bonus || 0; forced = null; }
        // bomb/striped conversion happens before the explosion so the stripes fire
        convert.forEach((cv) => { const x = this.cell(cv.r, cv.c); if (x) x.s = cv.s; });
        // 2. specials caught in the blast go off too (chain reaction)
        const queue = Array.from(clearSet.values()).filter(([r, c]) => { const x = this.grid[r][c]; return x && x.s && x.s !== SP.BOMB && !created.some((m) => m.at[0] === r && m.at[1] === c); });
        const seen = new Set();
        while (queue.length) {
          const [r, c] = queue.shift(); const x = this.grid[r][c]; if (!x || seen.has(x.id)) continue; seen.add(x.id);
          const add = (rr, cc) => { if (!this.cell(rr, cc)) return; const k = key(rr, cc); if (!clearSet.has(k)) { clearSet.set(k, [rr, cc]); const y = this.grid[rr][cc]; if (y && y.s && y.s !== SP.BOMB) queue.push([rr, cc]); } };
          bonus += 60;
          if (x.s === SP.ROW) { for (let cc = 0; cc < this.w; cc++) add(r, cc); fx.push({ k: "row", r }); }
          else if (x.s === SP.COL) { for (let rr = 0; rr < this.h; rr++) add(rr, c); fx.push({ k: "col", c }); }
          else if (x.s === SP.WRAP) { for (let rr = r - 1; rr <= r + 1; rr++) for (let cc = c - 1; cc <= c + 1; cc++) add(rr, cc); fx.push({ k: "blast", r, c, rad: 1 }); }
        }
        // 3. remove the cleared candies, drop in the new specials
        const survivors = new Set(created.map((m) => key(m.at[0], m.at[1])));
        const gone = [];
        clearSet.forEach(([r, c], k) => { const x = this.grid[r][c]; if (!x) return; if (survivors.has(k)) return; gone.push({ r, c, id: x.id, t: x.t, s: x.s }); if (x.t >= 0) cleared[x.t] = (cleared[x.t] || 0) + 1; this.grid[r][c] = null; });
        const mades = created.map((m) => { const old = this.grid[m.at[0]][m.at[1]]; const nc = { id: this.nid++, t: m.t, s: m.s }; this.grid[m.at[0]][m.at[1]] = nc; made++; return { r: m.at[0], c: m.at[1], cell: nc, oldId: old && old.id }; });
        const g1 = Math.round(PER * gone.length * (1 + (combo - 1) * 0.5)) + bonus * combo;
        gain += g1;
        steps.push({ k: "clear", cells: gone, created: mades, convert, fx, combo, gain: g1, label: LABELS[Math.min(LABELS.length - 1, combo - 1 + (created.length ? 1 : 0))], big: !!(fx.length || created.length) });
        steps.push(this._gravity());
      }
      return { steps, gain, combo, made, cleared };
    }

    _gravity() {
      const moves = [], spawns = [];
      for (let c = 0; c < this.w; c++) {
        let write = this.h - 1;
        for (let r = this.h - 1; r >= 0; r--) {
          const x = this.grid[r][c];
          if (!x) continue;
          if (r !== write) { moves.push({ id: x.id, from: [r, c], to: [write, c] }); this.grid[write][c] = x; this.grid[r][c] = null; }
          write--;
        }
        const n = write + 1;
        for (let r = write; r >= 0; r--) { const x = this.spawn(); this.grid[r][c] = x; spawns.push({ cell: x, to: [r, c], from: r - n }); }
      }
      return { k: "fall", moves, spawns };
    }

    /* no moves left? shuffle (keeps specials where they are) */
    _ensureMoves() {
      if (this.hint()) return null;
      const pos = [], cells = [];
      for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) { pos.push([r, c]); cells.push(this.grid[r][c]); }
      for (let tries = 0; tries < 80; tries++) {
        const sh = this.rng.shuffle(cells);
        pos.forEach(([r, c], i) => (this.grid[r][c] = sh[i]));
        if (this.findRuns().length === 0 && this.hint()) break;
      }
      const moves = []; pos.forEach(([r, c]) => moves.push({ id: this.grid[r][c].id, to: [r, c] }));
      if (this.findRuns().length || !this.hint()) { this.fill(); return { k: "shuffle", moves: [], fresh: true }; }
      return { k: "shuffle", moves };
    }
    shuffleNow() { const pos = [], cells = []; for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) { pos.push([r, c]); cells.push(this.grid[r][c]); }
      for (let tries = 0; tries < 80; tries++) { const sh = this.rng.shuffle(cells); pos.forEach(([r, c], i) => (this.grid[r][c] = sh[i])); if (this.findRuns().length === 0 && this.hint()) break; }
      const moves = pos.map(([r, c]) => ({ id: this.grid[r][c].id, to: [r, c] })); return { k: "shuffle", moves }; }

    snapshot() { return this.grid.map((row) => row.map((x) => (x ? (x.s === SP.BOMB ? "B" : String.fromCharCode(97 + x.t) + (x.s ? x.s : "")) : ".")).join(",")); }
    sig() { return this.grid.map((row) => row.map((x) => x.t + ":" + x.s + ":" + x.id).join(" ")).join("|"); }
  }

  PP.Candy = { CandyBoard, SP, PER, LABELS };
})();
