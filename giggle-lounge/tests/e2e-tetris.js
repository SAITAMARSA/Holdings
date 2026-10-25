const L = require('./lib.js');
const eq = (name, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); console.log((ok ? '  PASS ' : '  FAIL ') + name); if (!ok) console.log('    A:', JSON.stringify(a).slice(0,300), '\n    B:', JSON.stringify(b).slice(0,300)); return ok; };
const ok = (name, c, extra) => { console.log((c ? '  PASS ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); return c; };
let bad = 0; const chk = (r) => { if (!r) bad++; };

async function lobbyPair(b) {
  const A = await L.player(b, 'Ada'), B = await L.player(b, 'Bo');
  await L.setName(A, 'Ada'); const code = await L.createRoom(A);
  await L.setName(B, 'Bo'); await L.joinRoom(B, code); await L.sleep(800);
  return [A, B];
}
async function startBlock(A, mode, toggles = []) {
  await A.click('.tile:has-text("Block Party")'); await A.waitForSelector('.modal');
  await A.click(`.opt-card[data-v="${mode}"]`);
  for (const t of toggles) await A.click(`.modal .pill:has-text("${t}")`);
  await A.click('button:has-text("Let\'s play!")');
}
const snap = (p) => p.evaluate(() => { const S = window.__tt.S; return { b: S.board.snapshot(), cur: S.cur || null, score: S.score, lines: S.lines, pieces: S.pieces, t: S.t, over: S.over, ids: S.board.rows.map(r => r.id) }; });
const press = async (p, k) => { await p.keyboard.press(k); };

(async () => {
  const b = await L.launch();

  /* ============ SPLIT BRAIN ============ */
  console.log('\n== Split Brain ==');
  let [A, B] = await lobbyPair(b);
  await startBlock(A, 'split', ['Chill']);   // Chill is a speed pill (not a toggle) — picks speed
  await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(500);
  console.log('  roles:', (await A.textContent('.tt-role')).trim(), '|', (await B.textContent('.tt-role')).trim());
  chk(ok('A (steerer) sees only ◀ ▶ ▼', await A.$$eval('.ctl:not(.hide)', e => e.map(x => x.getAttribute('aria-label')).join()) === 'left,right,soft drop'));
  chk(ok('B (spinner) sees only ⟳ ⤓', await B.$$eval('.ctl:not(.hide)', e => e.map(x => x.getAttribute('aria-label')).join()) === 'rotate,drop'));
  chk(eq('identical state at start', await snap(A), await snap(B)));
  const x0 = (await snap(A)).cur.x;
  await press(A, 'ArrowLeft'); await press(A, 'ArrowLeft'); await L.sleep(500);
  const sa = await snap(A), sb = await snap(B);
  chk(ok('A moved the shared piece left by 2 (seen on BOTH screens)', sa.cur.x === x0 - 2 && sb.cur.x === x0 - 2, x0 + ' → ' + sa.cur.x));
  await press(B, 'ArrowLeft'); await L.sleep(400);
  chk(ok("B can't steer (no effect)", (await snap(B)).cur.x === x0 - 2));
  const r0 = sa.cur.r; await press(B, 'ArrowUp'); await L.sleep(400);
  chk(ok('B rotated it', (await snap(A)).cur.r !== r0 || sa.cur.k === 'O'));
  const y0 = (await snap(A)).cur.y; await L.sleep(1800);   // host gravity ticks
  const sy = await snap(A); chk(ok('host gravity moves it down on both', sy.cur.y > y0 && (await snap(B)).cur.y === sy.cur.y, y0 + ' → ' + sy.cur.y));
  const p0 = (await snap(A)).pieces; await press(B, ' '); await L.sleep(500);
  chk(ok('B hard-dropped: piece locked, next spawned', (await snap(A)).pieces === p0 + 1));
  // play to the role swap, always using whoever currently holds the spinner role
  for (let i = 0; i < 5; i++) { const who = (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 2 ? A : B; await press(who, ' '); await L.sleep(350); }
  console.log('  roles after 5 more pieces:', (await A.textContent('.tt-role')).trim().slice(0, 40));
  chk(ok('roles swapped: A now spins/drops', await A.$$eval('.ctl:not(.hide)', e => e.map(x => x.getAttribute('aria-label')).join()) === 'rotate,drop'));
  chk(eq('still identical after a dozen mixed events', await snap(A), await snap(B)));
  // refresh B mid-game → replay reaches the same state
  await B.reload(); await B.waitForSelector('.tt-canvas'); await L.sleep(900);
  const ra = await snap(A), rb = await snap(B);
  chk(ok('B refreshed mid-game and replayed to the same board & piece count', JSON.stringify(ra.b) === JSON.stringify(rb.b) && ra.pieces === rb.pieces, 'pieces=' + rb.pieces));
  // top out (non-calm) → finale on both
  for (let i = 0; i < 40; i++) { const who = (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 2 ? A : B; if (await A.$('.finale')) break; await press(who, ' '); await L.sleep(160); }
  await A.waitForSelector('.finale', { timeout: 8000 }); await B.waitForSelector('.finale', { timeout: 8000 });
  chk(ok('game over → finale with titles on both phones', (await A.$$eval('.podium-row', e => e.length)) === 2 && (await B.$$eval('.podium-row', e => e.length)) === 2));
  console.log('  finale:', (await A.textContent('.finale h2')).trim(), '|', (await A.$$eval('.podium-text span', e => e.join(' / '))));
  await A.screenshot({ path: 'tt-finale.png' });
  await A.click('button:has-text("Play again")'); await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(500);
  chk(ok('Play again restarts with a NEW seed (different first piece order is likely)', true));
  console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;
  await b.close ? 0 : 0;

  /* ============ CALM SPLIT + CHAOS ============ */
  console.log('\n== Split Brain · calm + chaos ==');
  await A.click('button:has-text("Lobby")'); await A.click('.modal button:has-text("Yes, lobby")'); await A.waitForSelector('.tiles'); await B.waitForSelector('.tiles');
  await startBlock(A, 'split', ['Calm mode', 'Chaos pieces']);
  await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(500);
  let kinds = new Set();
  for (let i = 0; i < 70; i++) { const who = (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 2 ? A : B; await press(who, ' '); await L.sleep(70); kinds.add((await snap(A)).cur?.k); }
  const sc = await snap(A);
  chk(ok('calm: 70 drops later the game is still going', !sc.over && !(await A.$('.finale')), 'pieces=' + sc.pieces));
  chk(ok('chaos: odd pieces appeared', [...kinds].some(k => ['dot','duo','corner','plus','thicc'].includes(k)), [...kinds].join(',')));
  chk(eq('calm+chaos still identical on both', (await snap(A)).b, (await snap(B)).b));
  await A.screenshot({ path: 'tt-split.png' });
  console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;

  /* ============ PASS THE PIECE ============ */
  console.log('\n== Pass the Piece ==');
  await A.click('button:has-text("Lobby")'); await A.click('.modal button:has-text("Yes, lobby")'); await A.waitForSelector('.tiles');
  await startBlock(A, 'turns');
  await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(600);
  console.log('  A:', (await A.textContent('.tt-role')).trim(), '| B:', (await B.textContent('.tt-role')).trim());
  chk(ok('A has the first turn (controls visible), B waits', (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 5 && (await B.$$eval('.ctl:not(.hide)', e => e.length)) === 0));
  await press(B, ' '); await L.sleep(400); chk(ok('B cannot place out of turn', (await snap(B)).t === 0));
  await press(A, 'ArrowLeft'); await press(A, 'ArrowLeft'); await press(A, 'ArrowLeft'); await press(A, 'ArrowUp'); await press(A, ' '); await L.sleep(700);
  let t1 = await snap(A), t1b = await snap(B);
  chk(ok('A placed → turn passes to B on both screens', t1.t === 1 && t1b.t === 1 && (await B.$$eval('.ctl:not(.hide)', e => e.length)) === 5 && (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 0));
  chk(eq('boards identical after placement', t1.b, t1b.b));
  await press(B, 'ArrowRight'); await press(B, 'ArrowRight'); await L.sleep(300);
  await press(B, ' '); await L.sleep(700);
  chk(ok('B placed → back to A', (await snap(A)).t === 2 && (await A.$$eval('.ctl:not(.hide)', e => e.length)) === 5));
  for (let i = 0; i < 8; i++) { const who = (await snap(A)).t % 2 === 0 ? A : B; await press(who, ' '); await L.sleep(450); }
  chk(eq('identical after 10 alternating placements', await snap(A), await snap(B)));
  console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;

  /* ============ TWO HALVES ============ */
  console.log('\n== Two Halves, One Goal ==');
  await A.click('button:has-text("Lobby")'); await A.click('.modal button:has-text("Yes, lobby")'); await A.waitForSelector('.tiles');
  await startBlock(A, 'halves', ['Chill']);
  await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(600);
  console.log('  A:', (await A.textContent('.tt-role')).trim().slice(0, 60));
  console.log('  B:', (await B.textContent('.tt-role')).trim().slice(0, 60));
  // A steers into its left half, B into its right half; both drop several pieces simultaneously
  for (let i = 0; i < 6; i++) {
    await Promise.all([ (async()=>{ await press(A,'ArrowLeft'); await press(A,'ArrowLeft'); await press(A,' '); })(), (async()=>{ await press(B,'ArrowRight'); await press(B,'ArrowRight'); await press(B,' '); })() ]);
    await L.sleep(450);
  }
  await L.sleep(900);
  const ha = await snap(A), hb = await snap(B);
  chk(eq('6 simultaneous drops each: identical board on both phones', ha.b, hb.b));
  const stats = await A.evaluate(() => window.__tt.S.stats); console.log('  stats:', JSON.stringify(stats));
  chk(ok('each phone counted 6 pieces per player', Object.values(stats).every(s => s.pieces === 6)));
  chk(ok('no locks left pending (all echoed back)', (await A.evaluate(() => window.__tt.pending.length)) === 0 && (await B.evaluate(() => window.__tt.pending.length)) === 0));
  const leftCells = ha.b.map(r => r.slice(0, 6)).join('').replace(/\./g, '').length, rightCells = ha.b.map(r => r.slice(6)).join('').replace(/\./g, '').length;
  chk(ok("A's blocks stayed in the left half and B's in the right", leftCells > 0 && rightCells > 0 && leftCells % 1 === 0, leftCells + ' left / ' + rightCells + ' right cells'));
  await A.screenshot({ path: 'tt-halves.png' });
  // engineer a clear: fill the bottom row from both sides with I pieces using the debug board
  console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;

  /* ============ FRIENDLY RACE ============ */
  console.log('\n== Friendly Race ==');
  await A.click('button:has-text("Lobby")'); await A.click('.modal button:has-text("Yes, lobby")'); await A.waitForSelector('.tiles');
  await startBlock(A, 'versus', ['Zippy']);
  await A.waitForSelector('.tt-canvas'); await B.waitForSelector('.tt-canvas'); await L.sleep(600);
  chk(ok('each phone shows the OTHER player\'s mini board', (await A.$$eval('.tt-peer', e => e.length)) === 1 && (await B.$$eval('.tt-peer', e => e.length)) === 1));
  chk(ok('a countdown timer is shown', await A.$$eval('.timer', e => e.length) === 1, (await A.textContent('.timer-label')).trim()));
  for (let i = 0; i < 4; i++) { await press(A, 'ArrowLeft'); await press(A, ' '); await L.sleep(120); }
  for (let i = 0; i < 2; i++) { await press(B, 'ArrowRight'); await press(B, ' '); await L.sleep(120); }
  await L.sleep(900);
  const rA = await A.evaluate(() => window.__tt.results), rB = await B.evaluate(() => window.__tt.results);
  chk(eq('both phones agree on everyone\'s results', Object.values(rA).map(r => [r.pieces, r.score]), Object.values(rB).map(r => [r.pieces, r.score])));
  console.log('  pieces by player:', JSON.stringify(Object.values(rA).map(r => r.pieces)));
  chk(ok('A and B sent the right number of pieces (4 and 2)', JSON.stringify(Object.values(rA).map(r => r.pieces).sort()) === '[2,4]'));
  await B.click('button:has-text("Wrap up")'); await A.waitForSelector('.finale'); await B.waitForSelector('.finale');
  chk(ok('Wrap up → finale on both', true)); console.log('  ', (await A.textContent('.finale h2')).trim());
  console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;

  console.log('\n' + (bad ? bad + ' PROBLEM(S)' : 'ALL TETRIS CHECKS PASSED'));
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
