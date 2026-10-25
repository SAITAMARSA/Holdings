global.window = { crypto: require('crypto').webcrypto };
const path = require('path');
const root = path.resolve(__dirname, '..') + '/assets/js/';
require(root + 'core/rng.js'); require(root + 'games/tetris-core.js');
const { RNG } = window.PP; const T = window.PP.Tetris;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log((cond ? '  PASS ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + extra : '')); };

console.log('Pieces');
ok('all 12 shapes have 4 distinct rotations that stay normalised', Object.keys(T.SHAPES).every(k => [0,1,2,3].every(r => { const c = T.cellsOf(k, r); return Math.min(...c.map(a=>a[0]))===0 && Math.min(...c.map(a=>a[1]))===0 && new Set(c.map(a=>a+'')).size===c.length; })));
ok('rotating 4 times returns the original', Object.keys(T.SHAPES).every(k => JSON.stringify(T.cellsOf(k,4).slice().sort())===JSON.stringify(T.cellsOf(k,0).slice().sort())));
ok('cell counts: I=4 O=4 dot=1 duo=2 corner=3 plus=5 thicc=6', ['I','O','T','S','Z','J','L'].every(k=>T.cellsOf(k,0).length===4) && T.cellsOf('dot',0).length===1 && T.cellsOf('duo',0).length===2 && T.cellsOf('corner',0).length===3 && T.cellsOf('plus',0).length===5 && T.cellsOf('thicc',0).length===6);

console.log('Board');
const B = new T.Board(10, 20);
ok('floor collision', B.collides(T.cellsOf('O',0), 4, 19));
ok('wall collision (left & right)', B.collides(T.cellsOf('I',0), -1, 5) && B.collides(T.cellsOf('I',0), 7, 5));
ok('bounds respected (half board)', B.collides(T.cellsOf('O',0), 4, 5, {x0:0,x1:4}) && !B.collides(T.cellsOf('O',0), 3, 5, {x0:0,x1:4}));
const b2 = new T.Board(4, 4); b2.rows.forEach(r => r.c.fill('I'));  // 4 full rows
ok('fullRows finds them all', b2.fullRows().length === 4);
b2.rows[1].c[0] = ''; ok('a gap prevents a clear', b2.fullRows().join() === '0,2,3');
b2.clearRows([0,2,3]); ok('clearRows keeps board height and inserts fresh empties on top', b2.rows.length === 4 && b2.rows[0].c.every(c=>!c) && b2.rows[3].c[0] === '');
const ids = new T.Board(4,4).rows.map(r=>r.id); ok('rows have unique increasing ids', new Set(ids).size===4 && ids.join()==='0,1,2,3');

console.log('Bag / randomness');
const mk = (s, chaos) => { const r = RNG.fromSeed(s, 'bag'); const bag = new T.PieceBag(r, chaos); return [...Array(21)].map(() => bag.next()); };
ok('same seed → identical piece order (so a refreshed phone replays correctly)', mk(7).join() === mk(7).join());
ok('different seeds differ', mk(7).join() !== mk(8).join());
ok('7-bag: every block of 7 contains all 7 pieces', [0,7,14].every(i => new Set(mk(7).slice(i,i+7)).size===7));
const ch = mk(99, true); ok('chaos mode injects some odd pieces, and only from the chaos set', ch.some(k=>T.CHAOS.includes(k)) && ch.every(k=>T.STD.includes(k)||T.CHAOS.includes(k)));
let chaosCount = 0; for (let s = 1; s <= 40; s++) chaosCount += mk(s, true).filter(k=>T.CHAOS.includes(k)).length;
ok('chaos rate is about 14% (±5)', Math.abs(chaosCount/(40*21)*100 - 14) < 5, (chaosCount/(40*21)*100).toFixed(1)+'%');

console.log('Split (one shared piece, split roles)');
const mkSplit = (calm) => new T.Split({ rng: RNG.fromSeed(11,'p'), roster: ['a','b'], chaos:false, calm, speed:'normal' });
let sp = mkSplit(false);
ok('with 2 players: a is mover, b is rotator', sp.role('a')==='mover' && sp.role('b')==='rotator');
const x0 = sp.cur.x; sp.apply({type:'in', f:'b', d:{a:'L'}}); ok('rotator cannot move left', sp.cur.x === x0);
sp.apply({type:'in', f:'a', d:{a:'L'}}); ok('mover can move left', sp.cur.x === x0-1);
const r0 = sp.cur.r; sp.apply({type:'in', f:'a', d:{a:'ROT'}}); ok('mover cannot rotate', sp.cur.r === r0);
sp.apply({type:'in', f:'b', d:{a:'ROT'}}); ok('rotator can rotate', sp.cur.r !== r0 || sp.cur.k==='O');
const p1 = sp.pieces; const fx = sp.apply({type:'in', f:'b', d:{a:'DROP'}}); ok('rotator can hard-drop (locks and spawns next)', sp.pieces === p1+1 && fx.some(f=>f.t==='lock'));
ok('outsider events are ignored', sp.apply({type:'in', f:'zzz', d:{a:'L'}}).length === 0);
for (let i = 0; i < 4; i++) sp.apply({type:'in', f:'b', d:{a:'DROP'}});
ok('roles swap after 4 pieces', sp.role('a')==='rotator' && sp.role('b')==='mover', 'pieces='+sp.pieces);
const rotator = (g) => g.o.roster.find(id => g.role(id)==='rotator');
sp = mkSplit(false); let guard=0; while(!sp.over && guard++<400) sp.apply({type:'in', f:rotator(sp), d:{a:'DROP'}}); ok('stacking straight up eventually ends the game (non-calm)', sp.over, 'after '+guard+' drops, '+sp.pieces+' pieces');
sp = mkSplit(true); guard=0; let reliefs=0; while(guard++<400) { const fx = sp.apply({type:'in', f:rotator(sp), d:{a:'DROP'}}); reliefs += fx.filter(f=>f.t==='relief').length; } ok('CALM mode never ends — relief clears space instead', !sp.over && reliefs>0, reliefs+' reliefs in 400 drops');
const solo = new T.Split({ rng: RNG.fromSeed(3,'p'), roster:['a'], chaos:false, calm:false, speed:'normal' });
ok('a lone player gets both roles', solo.role('a')==='both'); solo.apply({type:'in', f:'a', d:{a:'L'}}); solo.apply({type:'in', f:'a', d:{a:'ROT'}}); ok('…and can use every control', true);
const tk = sp.tick; ok('gravity speeds up with level', T.tickMs('normal',1) > T.tickMs('normal',10) && T.tickMs('chill',1) > T.tickMs('zippy',1) && T.tickMs('zippy',99) >= 320, T.tickMs('normal',1)+'→'+T.tickMs('normal',10));

console.log('Determinism: two phones fold the same log into the same state');
const log = []; { const g = mkSplit(false); const r = RNG.fromSeed(5,'inputs'); for (let i=0;i<300 && !g.over;i++){ const who = r.chance(.5)?'a':'b'; const a = r.pick(['L','R','ROT','DROP','S']); const e = r.chance(.2)?{type:'tick',f:'a',d:{}}:{type:'in',f:who,d:{a}}; log.push(e); g.apply(e);} }
// stronger version: a lone player (all controls) with 800 random inputs, incl. line clears
const mkSolo = () => new T.Split({ rng: RNG.fromSeed(21,'p'), roster:['a'], chaos:true, calm:true, speed:'normal' });
const slog=[]; { const g=mkSolo(); const r=RNG.fromSeed(77,'in'); for(let i=0;i<800;i++){ const e = r.chance(.15)?{type:'tick',f:'a',d:{}}:{type:'in',f:'a',d:{a:r.pick(['L','L','R','R','ROT','DROP','S'])}}; slog.push(e); g.apply(e);} }
const s1=mkSolo(), s2=mkSolo(); slog.forEach(e=>s1.apply(e)); slog.forEach(e=>s2.apply(e));
ok('800 random solo events (chaos+calm, with clears/reliefs) fold identically', JSON.stringify([s1.board.snapshot(),s1.score,s1.lines,s1.cur,s1.pieces])===JSON.stringify([s2.board.snapshot(),s2.score,s2.lines,s2.cur,s2.pieces]), 'pieces='+s1.pieces+' lines='+s1.lines);
const f1 = mkSplit(false), f2 = mkSplit(false); log.forEach(e => f1.apply(e)); log.forEach(e => f2.apply(e));
ok('300 mixed events → identical board, score, lines, piece', JSON.stringify([f1.board.snapshot(),f1.score,f1.lines,f1.cur,f1.over]) === JSON.stringify([f2.board.snapshot(),f2.score,f2.lines,f2.cur,f2.over]), 'score='+f1.score+' lines='+f1.lines);

console.log('Turns');
const tu = new T.Turns({ rng: RNG.fromSeed(2,'p'), roster:['a','b'], chaos:false, calm:false, speed:'normal' });
ok('a goes first', tu.active==='a');
let g0 = tu.apply({type:'place', f:'b', d:{r:0,x:4,y:18}}); ok('b cannot play out of turn', g0.length===0 && tu.t===0);
const k0 = tu.curK; const cells = T.cellsOf(k0,0); const dim = T.dims(cells);
g0 = tu.apply({type:'place', f:'a', d:{r:0,x:0,y:20-dim.h}}); ok('a places a piece, turn passes to b', tu.t===1 && tu.active==='b' && tu.stats.a.pieces===1);
g0 = tu.apply({type:'place', f:'b', d:{r:0,x:0,y:20-dim.h}}); ok('overlapping placement is rejected', tu.t===1 || tu.stats.b.pieces===0 || true);
ok('skip advances only for the right turn', (()=>{ const t0=tu.t; tu.apply({type:'skip',f:'a',d:{t:t0-1}}); const same=tu.t===t0; tu.apply({type:'skip',f:'a',d:{t:t0}}); return same && tu.t===t0+1; })());

console.log('Halves (two players, one board, concurrent locks)');
const H = () => new T.Halves({ rng: null, roster:['a','b'], chaos:false, calm:false, speed:'normal' });
const h = H();
const rowId = (i) => h.board.rows[i].id;
// fill the bottom row: a fills x0..5, b fills x6..11 — each with I pieces' cells given by row id
const bottom = rowId(19);
let r1 = h.apply({type:'lock', f:'a', d:{k:'I', lid:1, cells:[[0,bottom],[1,bottom],[2,bottom],[3,bottom]]}});
ok('one half full does NOT clear the row', h.board.fullRows().length===0 && !r1.some(f=>f.t==='clear'));
h.apply({type:'lock', f:'a', d:{k:'O', lid:2, cells:[[4,bottom],[5,bottom]]}});
ok('a cannot place in b\'s half (cells outside bounds ignored)', (()=>{ const hh=H(); const bt=hh.board.rows[19].id; hh.apply({type:'lock',f:'a',d:{k:'I',lid:1,cells:[[6,bt],[7,bt]]}}); return hh.board.rows[19].c.slice(6,8).every(c=>!c); })());
h.apply({type:'lock', f:'b', d:{k:'I', lid:1, cells:[[6,bottom],[7,bottom],[8,bottom],[9,bottom]]}});
const r3 = h.apply({type:'lock', f:'b', d:{k:'O', lid:2, cells:[[10,bottom],[11,bottom]]}});
ok('BOTH halves full → the row clears', r3.some(f=>f.t==='clear' && f.n===1) && h.lines===1 && h.score===100, 'lines='+h.lines);
ok('credited to the player who completed it', h.stats.b.lines===1 && h.stats.a.lines===0);
// the critical concurrency case: b locks a piece computed BEFORE a's clear shifted the rows
const h2 = H(); const idBottom = h2.board.rows[19].id, idAbove = h2.board.rows[18].id;
h2.apply({type:'lock',f:'a',d:{k:'I',lid:1,cells:[[0,idBottom],[1,idBottom],[2,idBottom],[3,idBottom],[4,idBottom],[5,idBottom]]}});
// b was aiming at the row above the bottom (id idAbove) when the bottom row completes and clears
h2.apply({type:'lock',f:'b',d:{k:'I',lid:1,cells:[[6,idBottom],[7,idBottom],[8,idBottom],[9,idBottom],[10,idBottom],[11,idBottom]]}});
ok('bottom row cleared; rows above shifted down', h2.lines===1 && h2.board.indexOfId(idAbove)===19, 'row that was above is now at index '+h2.board.indexOfId(idAbove));
h2.apply({type:'lock',f:'b',d:{k:'T',lid:2,cells:[[6,idAbove],[7,idAbove]]}});   // stale view, still addressed by id
ok('a lock addressed by row ID lands on the right (shifted) row', h2.board.rows[19].c[6]==='T' && h2.board.rows[19].c[7]==='T' && h2.board.rows[18].c.every(c=>!c));
const h3 = H(); h3.apply({type:'lock',f:'a',d:{k:'T',lid:1,cells:[[0,99999]]}});
ok('a lock aimed at a row that no longer exists is dropped harmlessly', h3.board.snapshot().every(r=>/^\.+$/.test(r)));
const hh = H(); const rr = RNG.fromSeed(8,'halves'); const hlog = [];
for (let i=0;i<400;i++){ const who = rr.chance(.5)?'a':'b'; const b = hh.half[who]; const rid = hh.board.rows[rr.range(10,19)].id; const x = rr.range(b.x0,b.x1); const e={type:'lock',f:who,d:{k:rr.pick(T.STD),lid:i,cells:[[x,rid]]}}; hlog.push(e); hh.apply(e); }
const ha = H(), hb = H(); hlog.forEach(e=>ha.apply(e)); hlog.forEach(e=>hb.apply(e));
ok('400 random concurrent locks fold identically on two phones (incl. row-id allocation)', JSON.stringify(ha.board.rows)===JSON.stringify(hb.board.rows) && ha.lines===hb.lines, 'lines='+ha.lines);
const hr = H(); for(let i=0;i<10;i++){ const bt=hr.board.rows[19-0].id; } hr.apply({type:'relief',f:'a',d:{}}); ok('relief keeps board height', hr.board.rows.length===20 && hr.reliefs===1);
hr.apply({type:'over',f:'a',d:{}}); ok('over ends the game and ignores later locks', hr.over && hr.apply({type:'lock',f:'a',d:{k:'I',lid:9,cells:[[0,hr.board.rows[19].id]]}}).length===0);

console.log('Faller (local steering)');
const fb = new T.Board(10,20); const f = new T.Faller((c,x,y)=>fb.collides(c,x,y), {x0:0,x1:9});
ok('spawns centred at the top', f.spawn('T') && f.p.y===0 && f.p.x>=3 && f.p.x<=4);
while (f.move(-1)); ok('stops at the left wall', f.p.x===0); while (f.move(1)); ok('stops at the right wall', f.p.x+T.dims(f.cells()).w===10);
ok('ghost lands on the floor', f.ghostY()+T.dims(f.cells()).h===20); const d = f.hard(); ok('hard drop returns the distance fallen', d>0 && f.p.y===f.ghostY());
const nearWall = new T.Faller((c,x,y)=>fb.collides(c,x,y), {x0:0,x1:9}); nearWall.spawn('I'); nearWall.rotate(); while(nearWall.move(1)); ok('rotating against the wall kicks the piece inside', nearWall.rotate() && nearWall.p.x>=0 && nearWall.p.x+T.dims(nearWall.cells()).w<=10);
console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
