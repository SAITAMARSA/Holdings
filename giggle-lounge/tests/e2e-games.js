const L = require('./lib.js');
let bad = 0;
const ok = (name, c, extra) => { console.log((c ? '  PASS ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); if (!c) bad++; return c; };
const only = process.argv[2];
const dbg = (p) => p.evaluate(() => JSON.parse(JSON.stringify(PP.current().inst.debug())));
const waitState = (p, fn, arg, t = 20000) => p.waitForFunction(({ fn, arg }) => { try { const s = PP.current().inst.debug(); return (new Function('s', 'a', 'return (' + fn + ')'))(s, arg); } catch (e) { return false; } }, { fn, arg }, { timeout: t });

async function pair(b) {
  const A = await L.player(b, 'Ada'), B = await L.player(b, 'Bo');
  await L.setName(A, 'Ada'); const code = await L.createRoom(A);
  await L.setName(B, 'Bo'); await L.joinRoom(B, code); await L.sleep(800);
  return [A, B];
}
async function start(A, B, name, pills = []) {
  await A.click(`.tile:has-text("${name}")`); await A.waitForSelector('.modal');
  for (const t of pills) await A.click(/^\d+$/.test(t) ? `.modal .pill:text-is("${t}")` : `.modal .pill:has-text("${t}")`);
  await A.click('button:has-text("Let\'s play!")');
  await A.waitForSelector('.gamebar'); await B.waitForSelector('.gamebar'); await L.sleep(600);
}
const finale = async (A, B, t = 25000) => { await A.waitForSelector('.finale', { timeout: t }); await B.waitForSelector('.finale', { timeout: t }); };
const heading = async (p) => (await p.textContent('.finale h2')).trim();

const games = {
  async charades(b) {
    console.log('\n== Emoji Charades ==');
    const [A, B] = await pair(b); await start(A, B, 'Emoji Charades', ['Quick']);
    await A.waitForSelector('.opt-card'); await A.click('.opt-card >> nth=0');
    await waitState(B, 's.phase==="build"'); await waitState(A, 's.phase==="build"');
    const secret = await A.evaluate(() => { const s = PP.current().inst.debug(); return PP.engine.get('charades', s.secret); });
    ok('giver picked; both see the build phase with the same secret', (await dbg(B)).secret === (await dbg(A)).secret, secret.t);
    for (const i of [0, 3, 5]) await A.click(`.emoji-grid button >> nth=${i}`);
    await L.sleep(700);
    const ta = (await A.textContent('.big-emoji')).trim(), tb = (await B.textContent('.big-emoji')).trim();
    ok('emojis appear live on the guesser phone', ta === tb && ta.length > 2, ta);
    await B.fill('input[placeholder="Type your guess…"]', 'banana pancakes zzz'); await B.press('input[placeholder="Type your guess…"]', 'Enter'); await L.sleep(600);
    ok('wrong guess is logged, not solved', (await dbg(A)).guesses.length === 1 && Object.keys((await dbg(A)).solved).length === 0);
    await B.fill('input[placeholder="Type your guess…"]', secret.t.toLowerCase()); await B.press('input[placeholder="Type your guess…"]', 'Enter');
    await waitState(A, 's.phase==="reveal"'); await waitState(B, 's.phase==="reveal"');
    const sA = (await dbg(A)).scores, sB = (await dbg(B)).scores;
    ok('both phones agree on scores; guesser got 3, giver 1', JSON.stringify(sA) === JSON.stringify(sB) && Object.values(sA).sort().join() === '1,3', JSON.stringify(Object.values(sA)));
    await waitState(A, 's.r===1 && s.phase==="pick"', null, 15000);
    await B.waitForSelector('.opt-card', { timeout: 5000 }); ok('host auto-advanced to round 2 with B as the giver', (await dbg(B)).giver === (await B.evaluate(() => PP.current().ctx.me.id)) && (await A.$('.opt-card')) === null);
    await B.click('.opt-card >> nth=1'); await waitState(A, 's.phase==="build"');
    await B.click('.emoji-grid button >> nth=2'); await A.fill('input[placeholder="Type your guess…"]', 'definitely wrong'); await A.press('input[placeholder="Type your guess…"]', 'Enter'); await L.sleep(500);
    await B.click('button.chip-btn[title="That\'s right!"]'); // giver accepts a guess as correct
    await waitState(A, 's.phase==="reveal"');
    ok('giver can ACCEPT a guess that was right but spelled differently', Object.keys((await dbg(A)).solved).length === 1);
    await finale(A, B, 20000); ok('finale on both phones', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async describe(b) {
    console.log('\n== Describe It ==');
    const [A, B] = await pair(b); await start(A, B, 'Describe It', ['45s']);
    await waitState(A, 's.phase==="play"', null, 8000); await waitState(B, 's.phase==="play"', null, 8000);
    const s = await dbg(A);
    ok('dice picked a silly rule, both see the same one', s.twist === (await dbg(B)).twist && s.twist != null, await A.textContent('.note'));
    const card = await A.evaluate(() => { const s = PP.current().inst.debug(); return PP.engine.get('describe', s.card); });
    ok('describer sees the title + banned words; guesser does not', (await A.textContent('.big-card')).includes(card.t) && !(await B.textContent('.big-card')).includes(card.t));
    ok('banned-word chips shown', (await A.$$('.big-card .badge')).length >= 1, await A.$$eval('.big-card .badge', e => e.map(x => x.textContent).join(' ')));
    await B.fill('input[placeholder="Type your guess…"]', card.t); await B.press('input[placeholder="Type your guess…"]', 'Enter');
    await waitState(A, 's.team===1', null, 6000);
    const a1 = await dbg(A), b1 = await dbg(B);
    ok('typed guess auto-judged correct on both phones', a1.team === 1 && b1.team === 1 && JSON.stringify(a1.scores) === JSON.stringify(b1.scores));
    await waitState(A, 's.card!==null && s.cv===1', null, 8000); ok('host dealt a fresh card', true);
    await B.click('button:has-text("Banned word")'); await waitState(A, 's.cv===2', null, 5000);
    ok('🚨 buzz burns the card (no points), card swaps', (await dbg(A)).team === 1);
    await waitState(A, 's.card!==null && s.cv===2', null, 8000);
    await A.click('button:has-text("Skip")'); await waitState(B, 's.skips===1', null, 5000); ok('skip counted on both', (await dbg(B)).skips === 1);
    await A.evaluate(() => PP.current().ctx.send('end', { t: 0 })); await waitState(B, 's.phase==="tally"', null, 6000); ok('turn ended → tally on both', true);
    await waitState(A, 's.t===1 && s.phase!=="tally"', null, 12000); ok('host started turn 2 (B describes)', (await A.textContent('.badge')).includes('Turn 2'));
    await waitState(B, 's.phase==="play"', null, 8000);
    await B.evaluate(() => PP.current().ctx.send('end', { t: 1 })); await finale(A, B, 20000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async gift(b) {
    console.log('\n== Gift Shop ==');
    const [A, B] = await pair(b); await start(A, B, 'Gift Shop');
    await A.waitForSelector('.gift-item'); await B.waitForSelector('.gift-item');
    const sc = await dbg(A); const bud = await A.evaluate(() => PP.engine.get('gift-budget', PP.current().inst.debug().sc[1].b).t);
    ok('each player sees who they shop for + occasion + quirk + budget', (await A.textContent('.note')).length > 5, 'budget ' + bud);
    // 1) the shop disables anything you can't afford; 2) a basket holds at most 6 things
    const expensive = await A.$$eval('.gift-item', (e) => e.map((x, i) => [i, x.disabled]).filter((x) => x[1]).length);
    ok('items that would bust the budget are greyed out', expensive > 0, expensive + ' of 60 disabled at budget ' + bud);
    for (let i = 0; i < 8; i++) await A.click('.gift-item >> nth=11', { timeout: 1200 }).catch(() => {});   // "Coupon: One Free Hug" (1 coin)
    const chips = await A.$$eval('.cart .chip-btn', (e) => e.length), lbl = (await A.textContent('.timer-label')).trim(), m = /(\d+) \/ (\d+)/.exec(lbl);
    ok('basket stops at 6 items OR the budget — whichever comes first — and never overspends', chips === Math.min(6, Number(m[2])) && Number(m[1]) <= Number(m[2]), chips + ' items, ' + lbl);
    await A.click('.cart .chip-btn >> nth=0');
    ok('tapping an item in the basket removes it', (await A.$$eval('.cart .chip-btn', (e) => e.length)) === chips - 1);
    await A.fill('input[placeholder="Name your gift (optional)"]', 'The Big One'); await A.fill('textarea', 'Happy Tuesday!'); await A.click('button:has-text("Wrap it")');
    await B.click('.gift-item >> nth=11'); await B.click('.gift-item >> nth=37', { timeout: 1500 }).catch(() => {}); await B.fill('textarea', 'for you'); await B.click('button:has-text("Wrap it")');
    await waitState(A, 's.phase==="open"', null, 8000); await waitState(B, 's.phase==="open"', null, 8000);
    ok('everyone wrapped → host opened the reveal on both', Object.keys((await dbg(A)).gifts).length === 2);
    await B.click('.gift-box'); await B.waitForSelector('.gb-lid'); await L.sleep(1500);
    ok('recipient opened it; the OTHER phone sees the opened gift too', (await A.$$('.gift-box.open')).length === 1 && (await A.textContent('.big-emoji')).length > 0, (await A.textContent('.big-emoji')).trim());
    await B.click('button:has-text("Love it")'); await waitState(A, 's.rated[0]===0', null, 5000);
    ok('rating (😍) shown to the giver, score +3', (await dbg(A)).scores[Object.keys((await dbg(A)).scores)[0]] === 3);
    await waitState(A, 's.open===1', null, 9000); await A.click('.gift-box'); await L.sleep(1400);
    await A.click('button:has-text("Return to sender")'); await waitState(B, 's.rated[1]===2', null, 5000);
    await finale(A, B, 20000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async takes(b) {
    console.log('\n== Hot Takes ==');
    const [A, B] = await pair(b); await start(A, B, 'Hot Takes', ['3 takes']);
    const rank = async (p, order) => { await p.waitForSelector('.rank-item'); for (const k of order) await p.click(`.rank-item >> nth=${k}`); await p.click('button:has-text("Lock it in")'); };
    await rank(A, [0, 1, 2, 3, 4]); await rank(B, [4, 3, 2, 1, 0]);
    await waitState(A, 's.phase==="reveal"'); await waitState(B, 's.phase==="reveal"');
    ok('exact opposite rankings → 0% in sync', (await dbg(A)).harmony[0] === 0, (await dbg(A)).harmony[0] + '%');
    ok('reveal shows both lists + a spiciest take', (await A.$$('.take-col')).length === 2 && (await A.textContent('.note')).includes('Spiciest'));
    await waitState(A, 's.r===1 && s.phase==="rank"', null, 15000);
    await rank(A, [0, 1, 2, 3, 4]); await rank(B, [0, 1, 2, 3, 4]); await waitState(A, 's.phase==="reveal"');
    ok('identical rankings → 100% in sync', (await dbg(A)).harmony[1] === 100, (await dbg(A)).harmony[1] + '%');
    ok('✨ marks every agreed position (5 rows × 2 players)', (await A.$$('.take-row.same')).length === 10);
    await waitState(A, 's.r===2 && s.phase==="rank"', null, 15000);
    await rank(A, [0, 1, 2, 3, 4]); await rank(B, [1, 0, 2, 3, 4]); await waitState(A, 's.phase==="reveal"');
    const h = (await dbg(A)).harmony; ok('a swap of two neighbours → 83%', h[2] === 83, h[2] + '%');
    await finale(A, B, 20000); ok('finale with a verdict', true, await heading(A));
    ok('both phones agree', JSON.stringify((await dbg(A)).harmony) === JSON.stringify((await dbg(B)).harmony));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async truths(b) {
    console.log('\n== Two Truths & a Fib ==');
    const [A, B] = await pair(b); await start(A, B, 'Two Truths');
    const write = async (p, lie, tag) => { await p.waitForSelector('input[placeholder="Statement 1"]'); for (let i = 0; i < 3; i++) await p.fill(`input[placeholder="Statement ${i + 1}"]`, `${tag} statement ${i}`); await p.click(`button:has-text("This is the fib") >> nth=${lie}`); await p.click('button:has-text("Lock them in")'); };
    await write(A, 1, 'Ada'); await write(B, 2, 'Bo');
    await waitState(A, 's.phase==="vote"', null, 8000); await waitState(B, 's.phase==="vote"', null, 8000);
    ok('everyone locked → game moves to voting author #1 (Ada)', (await dbg(B)).k === 0 && (await B.$$('button.truth')).length === 3);
    ok('the author sees their own statements, not buttons', (await A.$$('button.truth')).length === 0 && (await A.$$('.truth')).length === 3);
    const texts = await B.$$eval('button.truth', e => e.map(x => x.textContent)); const orderA = await A.$$eval('.truth', e => e.map(x => x.textContent.replace('🤥 your fib', '').trim()));
    ok('statement order (seeded shuffle) is identical on both phones', JSON.stringify(texts) === JSON.stringify(orderA), texts.join(' | '));
    await B.click('button.truth:has-text("Ada statement 1")'); await waitState(A, 's.phase==="reveal"', null, 8000);
    ok('B found the fib → +2 for B', (await dbg(A)).scores[Object.keys((await dbg(A)).scores)[1]] === 2);
    await waitState(A, 's.k===1 && s.phase==="vote"', null, 14000);
    await A.click('button.truth:has-text("Bo statement 0")'); await waitState(B, 's.k===1 && s.phase==="reveal"', null, 8000);
    const sc = Object.values((await dbg(B)).scores); ok('A was fooled → Bo +1 (and no points for A)', JSON.stringify(sc) === '[0,3]', JSON.stringify(sc));
    await finale(A, B, 20000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async pitch(b) {
    console.log('\n== Pitch It ==');
    const [A, B] = await pair(b); await start(A, B, 'Pitch It', ['2', '45s']);
    await A.waitForSelector('textarea'); await B.waitForSelector('textarea');
    const lab = async (p) => (await p.textContent('.card.stack.center')).replace(/\s+/g, ' ').trim();
    ok('both see the same product, customer', (await dbg(A)).p === (await dbg(B)).p && (await dbg(A)).c === (await dbg(B)).c, (await lab(A)).slice(0, 80));
    await A.fill('textarea', 'Buy it. You will thank me later.'); await A.click('button:has-text("Pitch it")');
    await B.fill('textarea', 'It is a bargain for the discerning customer!'); await B.click('button:has-text("Pitch it")');
    await waitState(A, 's.phase==="vote"', null, 8000); await waitState(B, 's.phase==="vote"', null, 8000);
    ok('pitches appear anonymously, in the same order on both phones', (await A.$$eval('.quote', e => e.map(x => x.textContent)).then(x => x.join())) === (await B.$$eval('.quote', e => e.map(x => x.textContent)).then(x => x.join())));
    ok("you can't vote for your own pitch", (await A.$$('.card .note')).length >= 1 && (await A.$$('button.flame')).length === 3);
    await A.click('button.flame >> nth=2'); await A.click('button:has-text("Send my flames")');
    await B.click('button.flame >> nth=0'); await B.click('button.flame >> nth=1'); await B.click('button:has-text("Send my flames")');
    await waitState(A, 's.phase==="results"', null, 8000);
    const fl = (await dbg(A)).flames; ok('flames tallied: Bo got 3, Ada got 2', JSON.stringify(Object.values(fl).sort()) === '[2,3]', JSON.stringify(fl));
    ok('winner crowned with a Keep button', (await A.$$('.winner')).length === 1 && (await A.$$('button:has-text("Keep this pitch")')).length === 1);
    await waitState(A, 's.r===1 && s.phase==="write"', null, 16000); ok('round 2 begins', true);
    await A.fill('textarea', 'Second pitch from Ada'); await A.click('button:has-text("Pitch it")'); await B.fill('textarea', 'Second pitch from Bo'); await B.click('button:has-text("Pitch it")');
    await waitState(A, 's.phase==="vote"', null, 8000);
    await A.click('button.flame >> nth=0'); await A.click('button:has-text("Send my flames")'); await B.click('button.flame >> nth=2'); await B.click('button:has-text("Send my flames")');
    await finale(A, B, 30000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async draw(b) {
    console.log('\n== Draw & Guess ==');
    const [A, B] = await pair(b); await start(A, B, 'Draw & Guess', ['60s', '1']);
    await A.waitForSelector('.opt-card'); await A.click('.opt-card >> nth=0');
    await waitState(B, 's.phase==="draw"'); await A.waitForSelector('canvas.draw-cv'); await B.waitForSelector('canvas.draw-cv');
    const word = await A.evaluate(() => PP.engine.get('draw', PP.current().inst.debug().word));
    const box = await A.locator('canvas.draw-cv').boundingBox();
    await A.mouse.move(box.x + box.width * .2, box.y + box.height * .2); await A.mouse.down();
    for (let i = 1; i <= 12; i++) await A.mouse.move(box.x + box.width * (.2 + i * .05), box.y + box.height * (.2 + i * .04));
    await A.mouse.up(); await L.sleep(900);
    const ink = (p) => p.evaluate(() => { const c = document.querySelector('canvas.draw-cv'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 200 || d[i + 1] < 200) n++; return n; });
    const ia = await ink(A), ib = await ink(B);
    ok("the drawing streams live to the guesser's canvas", ia > 300 && ib > 300 && Math.abs(ia - ib) / ia < 0.15, 'ink pixels A=' + ia + ' B=' + ib);
    ok('guesser sees a hidden word pattern, not the word', !(await B.textContent('.big-emoji')).toLowerCase().includes(word.t.toLowerCase().slice(0, 3)), (await B.textContent('.big-emoji')).trim());
    await A.click('button:has-text("Undo")'); await L.sleep(700); const ia2 = await ink(A), ib2 = await ink(B);
    ok('undo clears the stroke on both phones', ia2 < 50 && ib2 < 50, ia2 + '/' + ib2);
    await B.fill('input[placeholder="What is it?"]', word.t); await B.press('input[placeholder="What is it?"]', 'Enter');
    await waitState(A, 's.phase==="reveal"', null, 8000); ok('correct guess → reveal on both', true);
    ok('scores agree', JSON.stringify((await dbg(A)).scores) === JSON.stringify((await dbg(B)).scores), JSON.stringify(Object.values((await dbg(A)).scores)));
    await waitState(A, 's.r===1 && s.phase==="pick"', null, 14000); await B.click('.opt-card >> nth=0'); await waitState(A, 's.phase==="draw"');
    await A.evaluate(() => PP.current().ctx.send('reveal', { r: 1 })); await finale(A, B, 25000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async vibe(b) {
    console.log('\n== Vibe Check ==');
    const [A, B] = await pair(b); await start(A, B, 'Vibe Check');
    await waitState(A, 's.phase==="play"'); await waitState(B, 's.phase==="play"');
    const s = await dbg(A);
    ok('psychic sees the target zone; guesser sees none', (await A.$$('.dial path[stroke]')).length === 4 && (await B.$$('.dial path[stroke]')).length === 0);
    await A.fill('input[placeholder^="Type your clue"]', 'my hot take'); await A.click('button:has-text("Send clue")'); await L.sleep(700);
    ok('clue reaches the guesser', (await B.textContent('.note.center')).includes('my hot take'));
    const svg = await B.locator('svg.dial').boundingBox();
    const x = svg.x + svg.width * (170 + 150 * Math.cos(Math.PI * (1 - s.target / 100))) / 340, y = svg.y + svg.height * (170 - 150 * Math.sin(Math.PI * (1 - s.target / 100))) / 190;
    await B.mouse.click(x, y); await B.click('button:has-text("Lock in")');
    await waitState(A, 's.phase==="reveal"', null, 8000);
    const r = await dbg(A); ok('aimed straight at the target → BULLSEYE (4 pts to guesser)', r.res.best === 4 && Math.abs(r.guesses[Object.keys(r.guesses)[0]] - s.target) <= 4, 'target ' + s.target + ' aimed ' + JSON.stringify(r.guesses));
    ok('psychic earns the average (4)', Object.values(r.res.pts).sort().join() === '4,4');
    await waitState(B, 's.phase==="reveal"', null, 6000); ok('both phones agree', JSON.stringify((await dbg(B)).scores) === JSON.stringify(r.scores));
    await waitState(A, 's.r===1 && s.phase==="play"', null, 15000); await waitState(B, 's.r===1 && s.phase==="play"', null, 15000);
    await A.waitForSelector('button:has-text("Lock in")', { timeout: 8000 });
    await A.click('button:has-text("Lock in")'); await waitState(B, 's.phase==="reveal"', null, 8000);
    await finale(A, B, 20000); ok('finale', true, await heading(A));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },

  async story(b) {
    console.log('\n== Story Chain ==');
    const [A, B] = await pair(b); await start(A, B, 'Story Chain', ['Short']);
    await A.waitForSelector('.story-line.opener'); ok('both see the same opening line', (await A.textContent('.story-line.opener')) === (await B.textContent('.story-line.opener')), (await A.textContent('.story-line.opener')).slice(0, 50));
    for (let t = 0; t < 6; t++) {
      const w = t % 2 === 0 ? A : B, o = t % 2 === 0 ? B : A;
      await w.waitForSelector('textarea', { timeout: 8000 });
      if (t === 2) { ok('twist card on every 3rd turn', (await w.textContent('.note.center')).includes('Twist'), (await w.textContent('.note.center')).trim()); }
      await w.fill('textarea', 'Sentence number ' + (t + 1) + ' happened.'); await w.click(t === 5 ? 'button:has-text("The end")' : 'button:has-text("Add it")'); await L.sleep(500);
      if (t === 0) { await o.click('.laugh >> nth=0'); await L.sleep(500); ok('😂 reaction counted on both phones', (await w.textContent('.laugh')).includes('1') && (await o.textContent('.laugh')).includes('1')); }
    }
    await waitState(A, 's.phase==="title"', null, 8000); await waitState(B, 's.phase==="title"', null, 8000);
    ok('the last writer (Bo) is asked to name the story', (await B.$('input[placeholder^="A title"]')) !== null && (await A.$('input[placeholder^="A title"]')) === null);
    await B.fill('input[placeholder^="A title"]', 'The Llama Incident'); await B.click('button:has-text("Title it")');
    await finale(A, B, 15000); ok('storybook + finale on both', (await A.textContent('.storybook h1')).includes('The Llama Incident') && (await B.textContent('.storybook h1')).includes('The Llama Incident'));
    ok('laughs scored (Ada earned 1)', (await A.textContent('.podium')).includes('1 😂'));
    ok('no JS errors', A.errs.length + B.errs.length === 0, [...A.errs, ...B.errs].join('|'));
  },
};

(async () => {
  const b = await L.launch();
  for (const k of Object.keys(games)) { if (only && only !== k) continue; try { await games[k](b); } catch (e) { bad++; console.log('  CRASH in ' + k + ':', (e.message || e).toString().split('\n')[0]); } finally { await L.closeAll(); } }
  console.log('\n' + (bad ? bad + ' PROBLEM(S)' : 'ALL GAME CHECKS PASSED'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
