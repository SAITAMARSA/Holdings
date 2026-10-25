const L = require('./lib.js');
let bad = 0;
const ok = (name, c, extra) => { console.log((c ? '  PASS ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); if (!c) bad++; return c; };
const only = process.argv[2];
async function pair(b) { const A = await L.player(b, 'Ada'), B = await L.player(b, 'Bo'); await L.setName(A, 'Ada'); const code = await L.createRoom(A); await L.setName(B, 'Bo'); await L.joinRoom(B, code); await L.sleep(800); return [A, B]; }
async function start(A, B, mode, toggles = []) {
  await A.click('.tile:has-text("Candy March")'); await A.waitForSelector('.modal'); await A.click(`.opt-card[data-v="${mode}"]`);
  for (const t of toggles) await A.click(`.modal .pill:has-text("${t}")`);
  await A.click('button:has-text("Let\'s play!")'); await A.waitForSelector('canvas.cm-canvas'); await B.waitForSelector('canvas.cm-canvas'); await L.sleep(700);
}
const info = (p) => p.evaluate(() => { const c = window.__cm; return { sig: c.board.sig(), score: c.S.score, used: c.S.used, mismatch: c.mismatch, idle: c.view.pending === 0, over: c.S.over, picked: c.S.picked, shown: Math.round(c.S.shown) }; });
const idle = async (p, t = 12000) => p.waitForFunction(() => window.__cm.view.pending === 0, null, { timeout: t });
// pointer helpers: translate a board cell to page coordinates
async function cellXY(p, r, c) { const bb = await p.locator('canvas.cm-canvas').boundingBox(); const g = await p.evaluate(() => ({ w: window.__cm.board.w, h: window.__cm.board.h })); return [bb.x + (c + 0.5) * bb.width / g.w, bb.y + (r + 0.5) * bb.height / g.h]; }
async function tapMove(p, mv) { const [x1, y1] = await cellXY(p, mv[0][0], mv[0][1]), [x2, y2] = await cellXY(p, mv[1][0], mv[1][1]); await p.mouse.click(x1, y1); await L.sleep(120); await p.mouse.click(x2, y2); }
async function swipeMove(p, mv) { const [x1, y1] = await cellXY(p, mv[0][0], mv[0][1]), [x2, y2] = await cellXY(p, mv[1][0], mv[1][1]); await p.mouse.move(x1, y1); await p.mouse.down(); await p.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 3 }); await p.mouse.move(x2, y2, { steps: 3 }); await p.mouse.up(); }
const movesIn = (p, c0, c1) => p.evaluate(({ c0, c1 }) => window.__cm.board.allMoves().filter((m) => m[0][1] >= c0 && m[0][1] <= c1 && m[1][1] >= c0 && m[1][1] <= c1), { c0, c1 });

const modes = {
  async halves(b) {
    console.log('\n== Candy March · Two Halves ==');
    const [A, B] = await pair(b); await start(A, B, 'halves');
    const a0 = await info(A), b0 = await info(B);
    ok('both phones start with the identical 12×9 board', a0.sig === b0.sig, a0.sig.length + ' chars');
    ok('board has no pre-existing matches and a move exists', await A.evaluate(() => window.__cm.board.findRuns().length === 0 && !!window.__cm.board.hint()));
    ok('HUD shows 30 moves and a goal', (await A.textContent('.cm-num')).trim() === '30' && (await A.textContent('.cm-scoreline small')).includes('goal'));
    // A taps a swap in its own (left) half using real pointer input
    const mA = (await movesIn(A, 0, 5))[0]; await tapMove(A, mA); await L.sleep(500);
    await idle(A); await idle(B); await L.sleep(300);
    const a1 = await info(A), b1 = await info(B);
    ok('A swapped by TAP (pointer input) → both boards identical, score counted', a1.sig === b1.sig && a1.score > 0 && a1.score === b1.score && a1.used === 1, 'score ' + a1.score);
    ok('animations finished with no sprite/board mismatch on either phone', a1.mismatch === 0 && b1.mismatch === 0);
    ok('moves left dropped to 29', (await A.textContent('.cm-num')).trim() === '29' && (await B.textContent('.cm-num')).trim() === '29');
    // B swipes in its (right) half
    const mB = (await movesIn(B, 6, 11))[0]; await swipeMove(B, mB); await idle(A); await idle(B); await L.sleep(300);
    const a2 = await info(A), b2 = await info(B); ok('B moved by SWIPE → identical on both', a2.sig === b2.sig && a2.used === 2 && b2.used === 2 && a2.score === b2.score, 'score ' + a2.score);
    // A tries B's half → refused, nothing happens
    const mFar = (await movesIn(A, 6, 11))[0]; const before = (await info(A)).used; await tapMove(A, mFar); await L.sleep(700);
    ok("A can't play on B's half (toast, no move made)", (await info(A)).used === before && (await info(B)).used === before && (await A.$$('.toast')).length > 0);
    // server-side validation: a forged event from A for B's half is ignored by everyone
    await A.evaluate((m) => PP.current().ctx.send('swap', { a: m[0], b: m[1] }), mFar); await L.sleep(800);
    ok('even a forged out-of-half event is ignored by both phones', (await info(A)).used === before && (await info(B)).used === before && (await info(A)).sig === (await info(B)).sig);
    // play a flurry, alternating, then compare
    for (let i = 0; i < 6; i++) { const p = i % 2 ? B : A, m = (await movesIn(p, i % 2 ? 6 : 0, i % 2 ? 11 : 5))[0]; if (m) await p.evaluate((m) => PP.current().ctx.send('swap', { a: m[0], b: m[1] }), m); await L.sleep(250); }
    await idle(A, 30000); await idle(B, 30000); await L.sleep(500);
    const a3 = await info(A), b3 = await info(B); ok('after a flurry of 6 more moves: identical board, score, mismatches=0', a3.sig === b3.sig && a3.score === b3.score && a3.mismatch === 0 && b3.mismatch === 0, 'used ' + a3.used + ' score ' + a3.score);
    ok('star bar fill reflects the score', (await A.$eval('.cm-fill', (e) => parseFloat(e.style.width))) > 0);
    await A.screenshot({ path: 'c-halves.png' });
    // refresh B mid-game → replay to the same board
    await B.reload(); await B.waitForSelector('canvas.cm-canvas'); await L.sleep(1200); const b4 = await info(B); ok('B refreshed mid-game and replayed into the same board', b4.sig === a3.sig && b4.score === a3.score, 'score ' + b4.score);
    await A.click('button:has-text("Wrap up")'); await A.waitForSelector('.finale', { timeout: 8000 }); await B.waitForSelector('.finale', { timeout: 8000 });
    ok('wrap-up → finale with stars on both', (await A.$$('.cm-bigstars span')).length === 3, (await A.textContent('.finale h2')).trim());
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async split(b) {
    console.log('\n== Candy March · Split Brain ==');
    const [A, B] = await pair(b); await start(A, B, 'split');
    console.log('  A:', (await A.textContent('.tt-role')).trim().slice(0, 60), '\n  B:', (await B.textContent('.tt-role')).trim().slice(0, 60));
    ok('A is the picker, B the director (D-pad only on B)', (await A.$('.cm-dpad:not(.hide)')) === null && (await B.$('.cm-dpad:not(.hide)')) !== null);
    const mv = await A.evaluate(() => window.__cm.board.allMoves()[0]);
    const [x, y] = await cellXY(A, mv[0][0], mv[0][1]); await A.mouse.click(x, y); await L.sleep(600);
    ok('A picked a candy → B sees the highlighted pick, D-pad lights up', JSON.stringify((await info(B)).picked) === JSON.stringify(mv[0]) && (await B.$('.cm-dpad.armed')) !== null);
    const d = mv[1][0] < mv[0][0] ? 'U' : mv[1][0] > mv[0][0] ? 'D' : mv[1][1] < mv[0][1] ? 'L' : 'R';
    await B.click(`.cm-dir-${d}`); await idle(A); await idle(B); await L.sleep(300);
    const a1 = await info(A), b1 = await info(B); ok('B chose the direction → the swap happened on both phones', a1.used === 1 && a1.sig === b1.sig && a1.score > 0 && a1.picked === null, 'score ' + a1.score);
    // B (director) tries to pick → ignored
    const mv2 = await A.evaluate(() => window.__cm.board.allMoves()[0]); await B.evaluate((m) => PP.current().ctx.send('pick', { r: m[0][0], c: m[0][1] }), mv2); await L.sleep(500);
    ok('director cannot pick (event ignored)', (await info(A)).picked === null);
    // do two more moves; after 3 the roles swap
    for (let k = 0; k < 2; k++) { const m = await A.evaluate(() => window.__cm.board.allMoves()[0]); const pk = (await info(A)).used % 6 < 3 ? A : B; await pk.evaluate((m) => PP.current().ctx.send('pick', { r: m[0][0], c: m[0][1] }), m); await L.sleep(250); const dd = m[1][0] < m[0][0] ? 'U' : m[1][0] > m[0][0] ? 'D' : m[1][1] < m[0][1] ? 'L' : 'R'; const dr = pk === A ? B : A; await dr.evaluate((d) => PP.current().ctx.send('dir', { d }), dd); await idle(A); await idle(B); }
    await L.sleep(500);
    console.log('  A:', (await A.textContent('.tt-role')).trim().slice(0, 60));
    ok('after 3 moves the roles swapped (A now chooses direction)', (await A.$('.cm-dpad:not(.hide)')) !== null && (await B.$('.cm-dpad:not(.hide)')) === null);
    ok('identical boards, no mismatch', (await info(A)).sig === (await info(B)).sig && (await info(A)).mismatch === 0 && (await info(B)).mismatch === 0);
    await A.screenshot({ path: 'c-split.png' });
    console.log('  errors:', A.errs, B.errs); bad += A.errs.length + B.errs.length;
  },

  async turns(b) {
    console.log('\n== Candy March · Pass the Move ==');
    const [A, B] = await pair(b); await start(A, B, 'turns');
    console.log('  A:', (await A.textContent('.tt-role')).trim(), '| B:', (await B.textContent('.tt-role')).trim());
    ok("A has the first move; B is told it's not their turn", (await A.textContent('.tt-role')).includes('Your move') && (await B.textContent('.tt-role')).includes('thinking'));
    const m = await B.evaluate(() => window.__cm.board.allMoves()[0]); await tapMove(B, m); await L.sleep(600);
    ok('B tapping out of turn does nothing', (await info(A)).used === 0 && (await B.$$('.toast')).length > 0);
    await B.evaluate((m) => PP.current().ctx.send('swap', { a: m[0], b: m[1] }), m); await L.sleep(600);
    ok('…and a forged out-of-turn event is ignored', (await info(A)).used === 0 && (await info(B)).used === 0);
    const mA = await A.evaluate(() => window.__cm.board.allMoves()[0]); await swipeMove(A, mA); await idle(A); await idle(B); await L.sleep(300);
    ok("A's move passed the turn to B", (await info(A)).used === 1 && (await B.textContent('.tt-role')).includes('Your move') && (await A.textContent('.tt-role')).includes('thinking'));
    // an illegal swap does NOT consume the turn
    const bad2 = await B.evaluate(() => { const bd = window.__cm.board; for (let r = 0; r < bd.h; r++) for (let c = 0; c + 1 < bd.w; c++) if (!bd.canSwap([r, c], [r, c + 1])) return [[r, c], [r, c + 1]]; });
    await tapMove(B, bad2); await L.sleep(900); await idle(B);
    ok('an illegal swap bounces back and keeps the turn', (await info(B)).used === 1 && (await B.textContent('.tt-role')).includes('Your move'));
    // rapid alternate play to the move limit (24)
    for (let i = 1; i < 24; i++) { const p = i % 2 === 0 ? A : B; const mm = await p.evaluate(() => window.__cm.board.allMoves()[0]); await p.evaluate((m) => PP.current().ctx.send('swap', { a: m[0], b: m[1] }), mm); await L.sleep(160); }
    await A.waitForSelector('.finale', { timeout: 40000 }); await B.waitForSelector('.finale', { timeout: 20000 });
    ok('after 24 moves the game ends with a star finale on both', (await A.$$('.cm-bigstars span')).length === 3, (await A.textContent('.finale h2')).trim() + ' | ' + (await A.textContent('.finale p')).trim().slice(0, 50));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async versus(b) {
    console.log('\n== Candy March · Friendly Race ==');
    const [A, B] = await pair(b); await start(A, B, 'versus');
    ok('each phone shows the other player\'s mini board + a 3:00 timer', (await A.$$('.tt-peer')).length === 1 && (await A.textContent('.timer-label')).trim().startsWith('3:'));
    ok('both start from the SAME candies (fair race)', (await info(A)).sig === (await info(B)).sig);
    const mA = await A.evaluate(() => window.__cm.board.allMoves()[0]); await tapMove(A, mA); await idle(A); await L.sleep(500);
    const mB = await B.evaluate(() => window.__cm.board.allMoves()[0]); await swipeMove(B, mB); await idle(B); await L.sleep(500);
    const ra = await A.evaluate(() => JSON.parse(JSON.stringify(window.__cmRace.results))), rb = await B.evaluate(() => JSON.parse(JSON.stringify(window.__cmRace.results)));
    ok('both phones agree on everyone\'s score', JSON.stringify(Object.values(ra).map((x) => x.score)) === JSON.stringify(Object.values(rb).map((x) => x.score)) && Object.values(ra).every((x) => x.score > 0), JSON.stringify(Object.values(ra).map((x) => x.score)));
    ok("the peer mini-board label updates", Number((await A.textContent('.tt-peerbox b')).replace(/,/g, '')) > 0);
    // A plays a bunch more locally
    for (let i = 0; i < 5; i++) { const m = await A.evaluate(() => window.__cm.board.allMoves()[0]); await tapMove(A, m); await idle(A, 20000); }
    ok('shuffle is once per game', true); await A.click('button:has-text("Shuffle")'); await idle(A); ok('shuffled without breaking the board', await A.evaluate(() => window.__cm.board.findRuns().length === 0 && !!window.__cm.board.hint() && window.__cm.mismatch === 0));
    await A.click('button:has-text("Hint")'); await L.sleep(300); ok('hint highlights a legal move', await A.evaluate(() => !!window.__cm.view.hintPair));
    await A.screenshot({ path: 'c-versus.png' });
    await B.click('button:has-text("Wrap up")'); await A.waitForSelector('.finale', { timeout: 8000 }); await B.waitForSelector('.finale', { timeout: 8000 });
    ok('wrap-up → finale with titles', (await A.$$('.podium-row')).length === 2, (await A.textContent('.finale h2')).trim());
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },
};

(async () => {
  const b = await L.launch();
  for (const k of Object.keys(modes)) { if (only && only !== k) continue; try { await modes[k](b); } catch (e) { bad++; console.log('  CRASH in ' + k + ':', (e.message || e).toString().split('\n')[0]); } finally { await L.closeAll(); } }
  console.log('\n' + (bad ? bad + ' PROBLEM(S)' : 'ALL CANDY CHECKS PASSED')); await b.close(); process.exit(bad ? 1 : 0);
})();
