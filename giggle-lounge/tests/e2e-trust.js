/* Two phones, the trust / puzzle games: Block Duo, Merge Buddies, Word Duo, Pop Party, Think Alike, Mind Meld + silent mode + Mzansi. */
const L = require('./lib.js');
let bad = 0;
const ok = (name, c, extra) => { console.log((c ? '  PASS ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); if (!c) bad++; return c; };
const only = process.argv[2];
const dbg = (p, f) => p.evaluate((f) => { const s = PP.current().inst.debug(); return (new Function('s', 'return (' + f + ')'))(s); }, f);
const waitState = (p, fn, t = 20000) => p.waitForFunction((fn) => { try { const s = PP.current().inst.debug(); return (new Function('s', 'return (' + fn + ')'))(s); } catch (e) { return false; } }, fn, { timeout: t });
const meId = (p) => p.evaluate(() => PP.current().ctx.me.id);

async function pair(b) {
  const A = await L.player(b, 'Ada'), B = await L.player(b, 'Bo');
  await L.setName(A, 'Ada'); const code = await L.createRoom(A);
  await L.setName(B, 'Bo'); await L.joinRoom(B, code); await L.sleep(800);
  return [A, B];
}
async function start(A, B, name, pills = []) {
  await A.click(`.tile:has-text("${name}")`); await A.waitForSelector('.modal');
  for (const t of pills) await A.click(`.modal .pill:has-text("${t}"), .modal .opt-card:has-text("${t}")`);
  await A.click('button:has-text("Let\'s play!")');
  await A.waitForSelector('.gamebar'); await B.waitForSelector('.gamebar'); await L.sleep(700);
}
const finale = async (A, B, t = 25000) => { await A.waitForSelector('.finale', { timeout: t }); await B.waitForSelector('.finale', { timeout: t }); };
const errs = (A, B) => ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));

const games = {
  async merge(b) {
    console.log('\n== Merge Buddies (Split Brain) ==');
    const [A, B] = await pair(b); await start(A, B, 'Merge Buddies', ['Split Brain']);
    await A.waitForSelector('.mb-tile'); const before = await dbg(A, 'JSON.stringify(s.grid.map(r=>r.map(t=>t&&t.v)))');
    await B.keyboard.press('ArrowLeft'); await L.sleep(500);
    ok('Bo cannot swipe ⬅️ (belongs to Ada)', (await dbg(B, 'JSON.stringify(s.grid.map(r=>r.map(t=>t&&t.v)))')) === before);
    let moved = false;
    for (const k of ['ArrowLeft', 'ArrowRight']) { await A.keyboard.press(k); await L.sleep(500); if ((await dbg(A, 'JSON.stringify(s.grid.map(r=>r.map(t=>t&&t.v)))')) !== before) { moved = true; break; } }
    ok('Ada can swipe ⬅️➡️', moved);
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) { const p = k.match(/Left|Right/) ? A : B; await p.keyboard.press(k); await L.sleep(300); }
    const ga = await dbg(A, 'JSON.stringify(s.grid.map(r=>r.map(t=>t&&t.v)))'), gb = await dbg(B, 'JSON.stringify(s.grid.map(r=>r.map(t=>t&&t.v)))');
    ok('both phones show the identical board', ga === gb, ga);
    ok('score and swipes tracked', (await dbg(A, 's.moves')) >= 3 && (await dbg(A, 's.moves')) === (await dbg(B, 's.moves')), await dbg(A, 's.moves'));
    await A.click('button:has-text("Wrap up")'); await finale(A, B, 8000); ok('finale on both', true);
    errs(A, B);
  },
  async word(b) {
    console.log('\n== Word Duo (Split Brain) ==');
    const [A, B] = await pair(b); await start(A, B, 'Word Duo', ['Split Brain']);
    const T = await A.evaluate(() => window.__wd.target);
    ok('both phones derive the same secret word', T === (await B.evaluate(() => window.__wd.target)), T);
    const ia = (await meId(A)) === (await dbg(A, 's.__roster0 || null')) ? 0 : null;
    const roster = await A.evaluate(() => PP.current().ctx.rosterIds), me = await meId(A);
    const mine = (id) => { const i = roster.indexOf(id); return [0, 1, 2, 3, 4].filter((p) => p % 2 === i).map((p) => T[p]).join(''); };
    await A.keyboard.type(mine(roster[0])); await A.keyboard.press('Enter'); await L.sleep(500);
    ok('after one half, no row is resolved yet', (await dbg(A, 's.rows.length')) === 0);
    await B.keyboard.type(mine(roster[1])); await B.keyboard.press('Enter'); await L.sleep(800);
    ok('both halves → word assembled and solved', (await dbg(A, 's.won')) === true && (await dbg(B, 's.won')) === true);
    await finale(A, B, 8000); ok('finale on both', true); errs(A, B);
  },
  async pop(b) {
    console.log('\n== Pop Party (turns) ==');
    const [A, B] = await pair(b); await start(A, B, 'Pop Party', ['Take turns']);
    const roster = await A.evaluate(() => PP.current().ctx.rosterIds), ids = [await meId(A), await meId(B)];
    const findGroup = (p) => dbg(p, '(()=>{for(let r=0;r<10;r++)for(let c=0;c<8;c++)if(s.g[r][c]!=null&&s.group(r,c).length>=2)return [r,c];return null})()');
    const first = roster[0] === ids[0] ? [A, B] : [B, A];
    const [r, c] = await findGroup(first[0]);
    await first[1].click(`.pp-c[data-r="${r}"][data-c="${c}"]`); await L.sleep(500);
    ok('wrong player cannot pop', (await dbg(A, 's.pops')) === 0);
    await first[0].click(`.pp-c[data-r="${r}"][data-c="${c}"]`); await L.sleep(700);
    ok('right player pops; both phones agree', (await dbg(A, 's.pops')) === 1 && (await dbg(B, 's.score')) === (await dbg(A, 's.score')) && (await dbg(A, 's.score')) > 0, await dbg(A, 's.score'));
    const [r2, c2] = await findGroup(first[1]);
    await first[1].click(`.pp-c[data-r="${r2}"][data-c="${c2}"]`); await L.sleep(600);
    ok('turn passes to the partner', (await dbg(A, 's.pops')) === 2);
    errs(A, B);
  },
  async think(b) {
    console.log('\n== Think Alike (silent) ==');
    const [A, B] = await pair(b); await A.click('button.pill:has-text("Silent mode")'); await L.sleep(600);
    await start(A, B, 'Think Alike', ['5']);
    ok('silent banner shows on both phones', (await A.$('.silent-banner')) && (await B.$('.silent-banner')));
    await A.waitForSelector('.ta-opt'); await B.waitForSelector('.ta-opt');
    await A.click('.ta-opt >> nth=1'); await B.click('.ta-opt >> nth=1');
    await waitState(A, 's.phase==="reveal"'); await waitState(B, 's.phase==="reveal"');
    ok('matching picks → everyone scores 3', (await dbg(A, 'Object.values(s.scores).join()')) === '3,3', await dbg(A, 'Object.values(s.scores).join()'));
    await waitState(A, 's.r===1 && s.phase==="play"', 12000);
    await A.click('.ta-opt >> nth=0'); await B.click('.ta-opt >> nth=2');
    await waitState(A, 's.phase==="reveal" && s.r===1');
    ok('different picks → no points', (await dbg(A, 'Object.values(s.scores).join()')) === '3,3');
    errs(A, B);
  },
  async meld(b) {
    console.log('\n== Mind Meld ==');
    const [A, B] = await pair(b); await start(A, B, 'Mind Meld');
    await A.waitForSelector('input.in'); await B.waitForSelector('input.in');
    const wa = await dbg(A, 'JSON.stringify(s.hist[0])'), wb = await dbg(B, 'JSON.stringify(s.hist[0])');
    ok('different starting words, same on both phones', wa === wb && new Set(Object.values(JSON.parse(wa))).size === 2, wa);
    await A.fill('input.in', 'Sunshine'); await A.press('input.in', 'Enter'); await B.fill('input.in', 'banana'); await B.press('input.in', 'Enter');
    await waitState(A, 's.r===1 && s.phase==="play"', 10000);
    ok('mismatch → another round', true);
    await A.fill('input.in', 'Pizza'); await A.press('input.in', 'Enter'); await B.fill('input.in', ' pizza! '); await B.press('input.in', 'Enter');
    await waitState(A, 's.won', 10000); ok('same word (case/punctuation ignored) → mind meld', true, await dbg(A, 's.won'));
    await finale(A, B, 12000); ok('finale on both', true); errs(A, B);
  },
  async block(b) {
    console.log('\n== Block Duo ==');
    const [A, B] = await pair(b); await start(A, B, 'Block Duo');
    const act = await dbg(A, 's.active'); const [P, Q] = act === (await meId(A)) ? [A, B] : [B, A];
    const spot = await dbg(P, '(()=>{const k=s.key(s.active),t=s.trays[k];for(let i=0;i<3;i++){if(t[i]==null)continue;const sh=PP.BlockDuo.SHAPES[t[i]];for(let r=0;r<PP.BlockDuo.N;r++)for(let c=0;c<PP.BlockDuo.N;c++)if(PP.BlockDuo.fits(s.grid,sh,r,c))return {i,r,c}}})()');
    await Q.evaluate((d) => PP.current().ctx.send('place', d), spot); await L.sleep(500);
    ok('non-active player cannot place', (await dbg(A, 's.moves')) === 0);
    await P.evaluate((d) => PP.current().ctx.send('place', d), spot); await L.sleep(700);
    ok('active player places; boards identical', (await dbg(A, 's.moves')) === 1 && (await dbg(A, 'JSON.stringify(s.grid)')) === (await dbg(B, 'JSON.stringify(s.grid)')));
    ok('turn passed on', (await dbg(A, 's.active')) !== act);
    errs(A, B);
  },
  async mzansi(b) {
    console.log('\n== Mzansi flavour + content ==');
    const A = await L.player(b, 'Ada'); await L.setName(A, 'Ada'); await L.createRoom(A);
    const info = await A.evaluate(() => ({ sa: PP.engine.all('think-alike').filter((x) => x.g.includes('sa')).length, dsc: PP.engine.all('describe').filter((x) => (x.g || []).includes('sa') || x.c === 'Mzansi').length, words: PP.WORDS.length }));
    ok('Mzansi items present in decks', info.sa > 5 && info.dsc > 10, JSON.stringify(info));
    ok('Mzansi pill in lobby', !!(await A.$('button.pill:has-text("Mzansi")')));
    const scary = await A.evaluate(() => { const re = /\b(kill|murder|blood|ghost|zombie|death|corpse|demon|horror|scary)\b/i; let n = []; for (const id of ['think-alike', 'describe', 'charades', 'spectrums', 'story']) (PP.engine.all(id) || []).forEach((x) => re.test(JSON.stringify(x)) && n.push(id + ':' + (x.t || ''))); return n; });
    ok('nothing scary slipped into the decks', scary.length === 0, scary.join(' | '));
    ok('no JS errors', A.errs.length === 0, A.errs.join('|'));
  },
};

(async () => {
  const b = await L.launch();
  try { for (const k of Object.keys(games)) { if (only && only !== k) continue; try { await games[k](b); } catch (e) { bad++; console.log('  FAIL ' + k + ' threw: ' + e.message.split('\n')[0]); } await L.closeAll(); } }
  finally { await b.close(); }
  console.log(bad ? `\n${bad} FAILED` : '\nALL PASSED'); process.exit(bad ? 1 : 0);
})();
