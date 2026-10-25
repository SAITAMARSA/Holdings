global.window = { crypto: require('crypto').webcrypto };
const path = require('path');
const root = path.resolve(__dirname, '..') + '/assets/js/';
require(root + 'core/rng.js'); require(root + 'games/candy-core.js');
const { RNG } = window.PP; const { CandyBoard, SP } = window.PP.Candy;
let pass = 0, fail = 0;
const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + n + (x !== undefined ? '  → ' + x : '')); };

// a board with no matches and no moves except what we plant: type = (2r + c) % 5  (types 0..4); we plant type 5
const bgRows = (h, w) => Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => String((2 * r + c) % 5)).join(''));
const mk = (rows, seed) => { const b = new CandyBoard({ w: rows[0].length, h: rows.length, rng: RNG.fromSeed(seed || 1, 'c'), types: 6, empty: true }); b.setTypes(rows); return b; };
const put = (rows, r, c, ch) => { rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1); };
const full = (b) => b.grid.every((row) => row.every(Boolean));
const runsLeft = (b) => b.findRuns().length;

console.log('Setup');
let b = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(5, 'c'), types: 6 });
ok('a fresh 8×8 board has no matches, is full, and has a move', runsLeft(b) === 0 && full(b) && !!b.hint());
let allOk = true; for (let s = 1; s <= 200; s++) { const x = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(s, 'c'), types: 6 }); if (runsLeft(x) || !x.hint()) allOk = false; }
ok('200 different seeds: all start clean and playable', allOk);
const wide = new CandyBoard({ w: 12, h: 9, rng: RNG.fromSeed(9, 'c'), types: 7 }); ok('12×9 with 7 flavours also starts clean', runsLeft(wide) === 0 && !!wide.hint());
ok('background pattern used in tests has no runs', runsLeft(mk(bgRows(6, 6))) === 0);

console.log('Matching');
{ const rows = bgRows(6, 6); put(rows, 2, 0, '5'); put(rows, 2, 1, '5'); put(rows, 3, 2, '5'); const t = mk(rows);
  ok('swap that makes 3 in a row is legal', t.canSwap([2, 2], [3, 2]));
  const r = t.swap([2, 2], [3, 2]);
  ok('→ ok, scores points, board refilled, no matches left', r.ok && r.gain >= 120 && full(t) && runsLeft(t) === 0, 'gain ' + r.gain);
  const steps = r.steps.map((s) => s.k).join(','); ok('→ animation steps: swap, clear, fall (…)', steps.startsWith('swap,clear,fall'), steps); }
{ const t = mk(bgRows(6, 6)); const before = t.sig();
  ok('a swap that makes nothing is illegal', !t.canSwap([1, 1], [1, 2]));
  const r = t.swap([1, 1], [1, 2]); ok('→ bounces back, board untouched, no points', !r.ok && r.gain === 0 && r.steps[0].bounce === true && t.sig() === before); }
{ const t = mk(bgRows(6, 6)); ok('non-adjacent swap rejected', !t.swap([0, 0], [2, 2]).ok); ok('off-board swap rejected', !t.swap([0, 0], [-1, 0]).ok); }

console.log('Special candies are born');
{ const rows = bgRows(6, 6); put(rows, 2, 0, '5'); put(rows, 2, 1, '5'); put(rows, 2, 3, '5'); put(rows, 3, 2, '5'); const t = mk(rows);
  const r = t.swap([2, 2], [3, 2]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('match 4 (horizontal) → striped candy that clears a COLUMN', c1.created.length === 1 && c1.created[0].cell.s === SP.COL && c1.created[0].cell.t === 5, JSON.stringify(c1.created.map((x) => [x.r, x.c, x.cell.s])));
  ok('→ it appears where the player swapped', c1.created[0].r === 2 && c1.created[0].c === 2); }
{ const rows = bgRows(8, 6); put(rows, 2, 1, '5'); put(rows, 3, 1, '5'); put(rows, 5, 1, '5'); put(rows, 4, 2, '5'); const t = mk(rows);
  const r = t.swap([4, 1], [4, 2]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('match 4 (vertical) → striped candy that clears a ROW', c1.created.length === 1 && c1.created[0].cell.s === SP.ROW, JSON.stringify(c1.created.map((x) => x.cell.s))); }
{ const rows = bgRows(6, 7); [0, 1, 3, 4].forEach((c) => put(rows, 2, c, '5')); put(rows, 3, 2, '5'); const t = mk(rows);
  const r = t.swap([2, 2], [3, 2]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('match 5 → COLOUR BOMB (no flavour)', c1.created.length === 1 && c1.created[0].cell.s === SP.BOMB && c1.created[0].cell.t === -1); }
{ const rows = bgRows(6, 6); put(rows, 2, 0, '5'); put(rows, 2, 1, '5'); put(rows, 2, 3, '5'); put(rows, 0, 2, '5'); put(rows, 1, 2, '5'); const t = mk(rows);
  const r = t.swap([2, 2], [2, 3]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('L / T shape → WRAPPED candy at the corner', c1.created.length === 1 && c1.created[0].cell.s === SP.WRAP && c1.created[0].r === 2 && c1.created[0].c === 2, JSON.stringify(c1.created.map((x) => [x.r, x.c, x.cell.s]))); }

console.log('Specials explode');
{ const rows = bgRows(6, 6); put(rows, 3, 0, '5'); put(rows, 3, 1, '5'); put(rows, 4, 2, '5'); const t = mk(rows);
  t.grid[3][0].s = SP.ROW;                                           // a row-striped 5 inside the match
  const r = t.swap([3, 2], [4, 2]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('matching a row-striped candy clears its WHOLE row', c1.fx.some((f) => f.k === 'row' && f.r === 3) && [0, 1, 2, 3, 4, 5].every((c) => c1.cells.some((x) => x.r === 3 && x.c === c)), c1.cells.length + ' candies'); }
{ const rows = bgRows(6, 6); put(rows, 3, 1, '5'); put(rows, 3, 2, '5'); put(rows, 2, 3, '5'); const t = mk(rows);
  t.grid[3][2].s = SP.WRAP; const r = t.swap([2, 3], [3, 3]); const c1 = r.steps.find((s) => s.k === 'clear');
  ok('matching a wrapped candy blasts the 3×3 around it', c1.fx.some((f) => f.k === 'blast') && c1.cells.length >= 9, c1.cells.length + ' candies'); }
{ const rows = bgRows(6, 6); put(rows, 2, 2, '3'); const t = mk(rows); t.grid[2][2] = { id: 999, t: -1, s: SP.BOMB };
  const target = t.grid[2][3].t; const n = t.grid.flat().filter((x) => x.t === target).length;
  const r = t.swap([2, 2], [2, 3]); const c1 = r.steps.find((s) => s.k === 'clear');
  const kinds = new Set(c1.cells.filter((x) => x.t >= 0).map((x) => x.t));
  ok('colour bomb + any candy clears EVERY candy of that flavour', r.ok && kinds.size === 1 && c1.cells.filter((x) => x.t === target).length === n && c1.fx.some((f) => f.k === 'zap'), n + ' of flavour ' + target); }
{ const t = mk(bgRows(6, 6)); t.grid[2][2] = { id: 901, t: -1, s: SP.BOMB }; t.grid[2][3] = { id: 902, t: -1, s: SP.BOMB };
  const r = t.swap([2, 2], [2, 3]); const c1 = r.steps.find((s) => s.k === 'clear'); ok('two colour bombs together wipe the whole board', c1.cells.length === 36, c1.cells.length); }
{ const t = mk(bgRows(6, 6)); t.grid[2][2].s = SP.ROW; t.grid[2][3].s = SP.COL;
  const r = t.swap([2, 2], [2, 3]); const c1 = r.steps.find((s) => s.k === 'clear'); ok('two striped candies → a row AND a column (cross)', r.ok && c1.fx.some((f) => f.k === 'row') && c1.fx.some((f) => f.k === 'col') && c1.cells.length >= 11, c1.cells.length + ' candies'); }
{ const t = mk(bgRows(7, 7)); t.grid[3][3].s = SP.WRAP; t.grid[3][4].s = SP.WRAP;
  const r = t.swap([3, 3], [3, 4]); const c1 = r.steps.find((s) => s.k === 'clear'); ok('two wrapped candies → a huge 5×5 blast', r.ok && c1.cells.length >= 25, c1.cells.length + ' candies'); }
{ const t = mk(bgRows(6, 6)); t.grid[2][2].s = SP.ROW; ok('a striped candy next to a plain one with no match is NOT a legal move', !t.canSwap([2, 2], [2, 3])); }

console.log('Gravity & chain reactions');
{ let cas = 0, max = 0; for (let s = 1; s <= 60; s++) { const t = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(s, 'c'), types: 6 }); const m = t.hint(); const r = t.swap(m[0], m[1]); if (r.combo > 1) cas++; max = Math.max(max, r.combo); }
  ok('cascades happen naturally', cas > 3, cas + ' of 60 first moves cascaded, longest chain ' + max); }
{ const t = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(2, 'c'), types: 6 }); const m = t.hint(); const r = t.swap(m[0], m[1]); const fall = r.steps.find((s) => s.k === 'fall');
  ok('fall steps list moved candies and brand-new spawns above the board', fall.spawns.every((s) => s.from < 0 || s.from < s.to[0]) && fall.moves.every((x) => x.to[0] > x.from[0])); }

console.log('Determinism & invariants (bot plays thousands of moves)');
const play = (seed, types, party, w, h, n) => { const t = new CandyBoard({ w, h, rng: RNG.fromSeed(seed, 'c'), types, party }); const pick = RNG.fromSeed(seed, 'bot'); let gain = 0, moves = 0, shuffles = 0, specials = 0, bad = 0, maxCombo = 0;
  for (let i = 0; i < n; i++) { const ms = t.allMoves(); if (!ms.length) { bad++; break; } const m = pick.pick(ms); const r = t.swap(m[0], m[1]); if (!r.ok) bad++; gain += r.gain; moves++; maxCombo = Math.max(maxCombo, r.combo); specials += r.made; shuffles += r.steps.filter((s) => s.k === 'shuffle').length;
    const ids = new Set(); t.grid.forEach((row) => row.forEach((x) => { if (!x || ids.has(x.id)) bad++; else ids.add(x.id); })); if (runsLeft(t) || !full(t) || !t.hint()) bad++; }
  return { t, gain, moves, shuffles, specials, bad, maxCombo }; };
const A = play(7, 6, false, 8, 8, 400), Bz = play(7, 6, false, 8, 8, 400);
ok('400 random moves: board always full, no stray matches, unique ids, a move always exists', A.bad === 0, 'avg ' + Math.round(A.gain / A.moves) + ' pts/move, longest chain ' + A.maxCombo + ', ' + A.specials + ' specials made, ' + A.shuffles + ' reshuffles');
ok('same seed + same choices → identical board', A.t.sig() === Bz.t.sig());
ok('different seed → different board', play(8, 6, false, 8, 8, 50).t.sig() !== play(7, 6, false, 8, 8, 50).t.sig());
const P = play(3, 7, true, 12, 9, 300); ok('chaos (7 flavours + party candies) on the wide 12×9 board holds up too', P.bad === 0, 'avg ' + Math.round(P.gain / P.moves) + ' pts/move');
let tot = 0, n = 0; for (let s = 1; s <= 12; s++) { const r = play(s * 11, 6, false, 8, 8, 80); tot += r.gain; n += r.moves; if (r.bad) { ok('invariants hold for seed ' + s, false); } }
console.log('  (calibration) random play averages ' + Math.round(tot / n) + ' points per move on 8×8');
// greedy bot: take the move that scores the most — calibrates the star thresholds
const greedy = (seed, moves) => { const t = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(seed, 'c'), types: 6 }); let g = 0; for (let i = 0; i < moves; i++) { let best = null, bs = -1; for (const m of t.allMoves()) { const c = new CandyBoard({ w: 8, h: 8, rng: RNG.fromSeed(0, 'x'), types: 6, empty: true }); c.grid = t.grid.map((r) => r.map((x) => ({ ...x }))); c.nid = t.nid + 1e6; c.rng = RNG.fromSeed(i * 31 + m[0][0] * 7 + m[0][1], 'sim'); const r = c.swap(m[0], m[1]); const sc = r.gain; if (sc > bs) { bs = sc; best = m; } } const r = t.swap(best[0], best[1]); g += r.gain; } return g; };
let gs = 0; for (let s = 1; s <= 4; s++) gs += greedy(s * 5, 24); console.log('  (calibration) greedy play over 24 moves averages ' + Math.round(gs / 4) + ' points → ' + Math.round(gs / 4 / 24) + '/move');
console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
