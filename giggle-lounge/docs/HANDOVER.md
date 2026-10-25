# Giggle Lounge — handover for a PC / offline session

## Get the code
- Repo: `https://github.com/saitamarsa/holdings` (folder `giggle-lounge/`)
- Branch: `claude/ask-qrifet` (latest commit: "Silent mode, Mzansi flavour, and six new trust/puzzle games")
```
git clone https://github.com/saitamarsa/holdings.git
cd holdings && git checkout claude/ask-qrifet
cd giggle-lounge
```
No git? On GitHub choose the branch, then Code → Download ZIP.

## Run locally (needs PHP 8+)
```
php -S 127.0.0.1:8099 -t .
```
Open http://127.0.0.1:8099 in two windows (or a phone on the same Wi-Fi via your PC's LAN IP); create a room in one, join with the code in the other. `/check.html` probes long-poll concurrency.

## Tests (need Node + Playwright; set CHROME_PATH if Chromium isn't auto-found)
```
GL_URL=http://127.0.0.1:8099/ node tests/unit-tetris.js   # also unit-candy, unit-match
GL_URL=http://127.0.0.1:8099/ node tests/e2e-games.js     # also e2e-tetris, e2e-candy, e2e-trust
```
Start the PHP server with `PHP_CLI_SERVER_WORKERS=12 php -S ...` so long-polling doesn't starve workers. See `tests/README.md`.

## Ship to Starter Cloud (shared hosting)
1. cPanel → create the subdomain; note its document root.
2. Upload the contents of `giggle-lounge/` (skip `tests/`, `docs/`) via File Manager/FTP.
3. Make `api/data/` writable by PHP (755, or 775 if needed). Its `.htaccess` blocks web access.
4. Visit `https://<subdomain>/check.html`, then try a room from two phones.
5. If slow/failing: `docs/HOSTING.md`; tune `MAX_WAITERS` / `POLL_WAIT_MAX` in `api/config.php`.
Not yet verified on real shared hosting — only locally.

## What exists
- Architecture: PHP append-only event log per room (`api/room.php`); clients long-poll and fold the same events, host drives timing. Details in `README.md` and `docs/PLAN.md`.
- Games: Tetris (Two Halves / Split Brain / Pass the Piece / Friendly Race, calm + chaos), Candy March (match-3, same modes), Emoji Charades, Describe It, Gift Shop, Hot Takes, Two Truths, Pitch It, Draw & Guess, Vibe Check, Story Chain, Block Duo, Merge Buddies, Word Duo, Pop Party, Think Alike, Mind Meld.
- Silent mode (lobby pill + per-game toggle) and 🇿🇦 Mzansi flavour (3× weight for South African content; data in `assets/js/data/mzansi.js`, `trust.js`). Nothing scary by design.
- Game plugin API: `PP.registerGame({...})` — see any file in `assets/js/games/` (e.g. `think-alike.js` is a compact round-based example).

## Known gaps / ideas
- Block Duo drag-and-drop only tested via events, not real touch.
- Lobby game-count text and README/PLAN were only lightly updated for the new games.
- "Cozy Corner" (romance content) is a same-Wi-Fi placeholder, not enforced.
- Hidden info (e.g. Word Duo's secret word) is honour-system: visible in the network tab.
- Later: Node/React/sockets rewrite; accounts are optional email login in `api/auth.php`.
- Content is South African-oriented but deliberately not generic "African".

## Starter prompt for the new session
> Read `giggle-lounge/docs/HANDOVER.md`, `README.md` and `docs/PLAN.md`. Run the app locally and the test suites, then help me review the games visually and prepare the Starter Cloud upload. Keep everything friendly, silly and not scary.
