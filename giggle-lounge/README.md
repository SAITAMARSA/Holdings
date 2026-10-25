# 🤪 Giggle Lounge

Silly games for two (or more) — on separate phones or the same couch. **No downloads, no app store:
one person starts a room, shares a 4-letter code, and everyone plays in their browser.**
Made for couples reconnecting over a call, friends on a group chat, or two couples at once.

> **Design rule: laughter over winning.** Nobody is ever quizzed, tested or ranked. Every game ends with
> a silly title for every player. Anyone can tap **⏸ Need a sec** and the whole room pauses, no questions asked.

## The games (11)

| | Game | What it is | Players |
|---|---|---|---|
| 🧱 | **Block Party** | Tetris as a team. **Two Halves** (a row clears only when *both* halves are full) · **Split Brain** (one steers, one spins & drops, roles swap) · **Pass the Piece** · **Friendly Race**. + Calm mode, Chaos pieces. | 1–4 |
| 🍬 | **Candy March** | Glossy match-3 with striped / wrapped / colour-bomb candies, chain reactions, explosions and a 3-star bar. Same four modes as Block Party. + Calm, Chaos candy. | 1–4 |
| 🎭 | **Emoji Charades** | Build a movie / song / everyday disaster out of emojis; the others guess. | 2–8 |
| 🎬 | **Describe It** | Describe the movie without saying its words. The dice add a silly rule each turn. | 2–8 |
| 🎁 | **Gift Shop** | Dice pick a person, an occasion and a budget. Build them a gift from absurd emoji items. | 2–8 |
| 🌶️ | **Hot Takes** | Secretly rank five silly things; reveal together; argue lovingly. | 2–8 |
| 🤥 | **Two Truths & a Fib** | Two true things, one fib. Spot it. | 2–8 |
| 💡 | **Pitch It** | Sell a ridiculous product to a ridiculous customer; hand out flames. | 2–8 |
| 🎨 | **Draw & Guess** | Strokes stream live to every phone. | 2–8 |
| 🎯 | **Vibe Check** | Read their mind on a dial between two opposites. | 2–8 |
| 📖 | **Story Chain** | One sentence each, with dice-dealt plot twists. | 2–8 |
| 🧩 | **Block Duo** | Block-Blast for two: shared tray or your own trays, drag & drop. | 1–4 |
| 🔢 | **Merge Buddies** | Co-op 2048. Split Brain: one of you only swipes ⬅️➡️, the other ⬆️⬇️. | 1–4 |
| 🔤 | **Word Duo** | Co-op Wordle. Split Brain: you each type alternate letters. | 2–4 |
| 🍓 | **Pop Party** | Pop fruity groups; swap turns or pop together. | 1–4 |
| 🧠 | **Think Alike** | Secretly pick the same option as your partner. Silent by nature. | 2–8 |
| 🫠 | **Mind Meld** | Start with different words, converge on the same one. Silent by nature. | 2–4 |

### 🤫 Silent mode & 🇿🇦 Mzansi flavour
- **Silent mode** (lobby pill, or per game): no talking, just emoji pokes and trust. Vibe Check swaps the spoken clue for a 3-emoji picker; games that can't work without words (Describe It) say so.
- **Mzansi flavour** (lobby pill, on by default): South African soapies, Netflix/Showmax titles, food, places and slang get 3× the weight in the decks. Switch off for neutral prompts. Everything stays light and cosy — nothing scary.

Plus: emoji **pokes** (🍅 splats on the target's screen), 6 colour themes + your own colour, a private
**Our Room** for linked couples, a keepsake drawer, and a **Cozy Corner** placeholder that only unlocks when
everyone is on the same Wi-Fi (planned, not built).

## Try it locally (30 seconds)

You need PHP 7.4+ (nothing else — no Composer, no database).

```sh
cd giggle-lounge
PHP_CLI_SERVER_WORKERS=8 php -S 127.0.0.1:8080
# open http://127.0.0.1:8080 in two browser windows
```

`PHP_CLI_SERVER_WORKERS` matters: PHP's built-in server handles one request at a time by default, and real-time
play keeps a request open per player.

## Put it on your hosting

See **[docs/HOSTING.md](docs/HOSTING.md)** — upload the folder to a subdomain, open `/check.html`, done.

## How it works (the 60-second version)

* A **room** is an append-only **event log** on the server (`api/room.php`). Phones send events, then keep one short
  long-poll open for new ones. The server knows nothing about any game.
* **Every phone folds the same events in the same order**, so everyone ends up with identical state — a shared
  Tetris board, a match-3 board, a story. This is why a refreshed or late-joining phone just replays the log and
  lands in the same place.
* **Randomness is real.** The server picks each game's seed with `random_int()`. Piece order, candy refills,
  shuffles and dealt prompts all come from a seeded RNG consumed in a fixed order — different every session, identical on every phone.
* The host (first present player) only drives *timing* (next round, time's up). If they leave, the next player takes over seamlessly because all state lives in the log.
* **800 hand-written prompts** are dealt by a deck engine that never repeats until a deck is used up and gently learns what your group enjoys (👍/👎). 15% of deals ignore taste on purpose so you keep discovering things.

```
index.html  check.html
api/        room.php (event log) · auth.php (accounts, couples, keepsakes) · lib.php · config.php · ping.php
assets/css/ app.css — the "Candy Night" design system (6 themes)
assets/js/core/   rng · sfx · ui · fx (particles) · room (client) · engine (decks) · widgets · match · account · app
assets/js/data/   the prompt decks
assets/js/games/  one file per game  (+ tetris-core / candy-core: pure game logic;  candy-view: renderer)
tests/      browser + unit tests (see tests/README.md)
data/       runtime storage (rooms, accounts) — never commit, never expose
```

## Adding a game

Create `assets/js/games/my-game.js`, add a `<script>` tag in `index.html`, and register it:

```js
PP.registerGame({
  id: "my-game", name: "My Game", emoji: "🎲", color: "#FFB86B", tagline: "…", how: "…", min: 2, max: 8, tags: ["silly"],
  options: [{ id: "rounds", label: "How long?", kind: "choice", def: "3", choices: [{ v: "3", label: "Short" }] }],
  create(ctx) {
    // ctx.el (mount your UI here) · ctx.rosterIds · ctx.me · ctx.settings · ctx.seed · ctx.rng("key")
    // ctx.send(type, data) · ctx.isHost() · ctx.later(fn, ms) · ctx.draw(deck, n) · ctx.live(ev) · ctx.keep(…) · ctx.end() · ctx.again()
    return { onEvent(ev) { /* ev.type, ev.d, ev.f (sender) — fold into your state, then render */ }, onPlayers() {}, destroy() {} };
  },
});
```

Rules of thumb: derive all state from events (so replays work), never re-render a form someone is typing in,
let the host decide *when*, and let events decide *what*.

## Roadmap

Built: the 11 games above. Next ten: Just One · Desert Island · Telephone Draw · Caption This · Would You Rather ·
Word Chain Rumble · Reaction Rumble · Trading Cards · Awards Night · Episode Titles — then **Cozy Corner**
(same-Wi-Fi only) and a move to Node + WebSockets + React. The transport is isolated in `assets/js/core/room.js`,
so swapping long-polling for sockets won't touch any game.

All titles, prompts and testimonials are fictional demo content.
