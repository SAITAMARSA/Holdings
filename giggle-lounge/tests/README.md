# Tests

Unit tests are plain Node. Browser tests drive **two simulated phones** (separate browser contexts) through every game.

```sh
# unit tests (no setup)
node tests/unit-tetris.js && node tests/unit-candy.js && node tests/unit-match.js

# browser tests
npm install playwright                      # once (then: npx playwright install chromium, unless Chromium is already installed)
PHP_CLI_SERVER_WORKERS=12 php -S 127.0.0.1:8099 &    # serve the folder
node tests/e2e-games.js [charades|describe|gift|takes|truths|pitch|draw|vibe|story]   # 9 party games
node tests/e2e-tetris.js                    # Block Party, all four modes
node tests/e2e-candy.js [halves|split|turns|versus]
node tests/e2e-trust.js [merge|word|pop|think|meld|block|mzansi]   # trust/puzzle games, silent mode, Mzansi content
```

Environment: `GL_URL` (default `http://127.0.0.1:8099/`), `CHROME_PATH` (use an already-installed Chromium).

What they check, beyond "it loads": both phones hold **identical state** after every action, forged/out-of-turn events are
ignored, a refreshed phone replays into the same state, nobody's half-typed text is wiped by someone else's submission,
and each game reaches its finale.
