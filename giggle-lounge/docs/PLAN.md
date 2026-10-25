# Giggle Lounge — plan

A lounge of silly two-to-eight-player games for couples, friends and two couples on a
call. Everyone plays on their own phone; a 4-letter room code connects them.
**Design rule: laughter over winning.** No one is ever tested, quizzed or ranked.

Design principles (from what makes party games work):
1. Laughter beats winning — scores are tiny, titles are silly, nobody "loses".
2. Low friction — room code, tap a tile, play. Rules fit in one sentence.
3. Reveal together — nobody goes first and nobody waits exposed.
4. Human input — people write, draw and build; the machine only deals the prompts.
5. Real randomness — every round is dealt from a seeded RNG (server-seeded, crypto-random).
6. Kindness built in — pause / tap-out for anyone, no hidden-role bluffing, no gotchas.

## Phases

| Phase | What | Status |
| --- | --- | --- |
| 0 | Plan, design tokens, 5 bright colour themes | done |
| 1 | PHP backend: rooms (event log + long-poll), accounts, couples, keepsakes | done |
| 2 | Core: RNG, deck engine (no-repeat + learns your taste), sfx, confetti, room client | done |
| 3 | Lobby: home, room, share, pokes, theme picker, pause / tap-out, same-Wi-Fi flag | done |
| 4 | Block Party (Tetris) — 4 modes + calm mode + chaos pieces | done |
| 5 | 9 party games (below) | done |
| 6 | Accounts UI, private "Our Room", keepsake drawer | done |
| 7 | Test pass in real browsers with two simulated players | done |
| 8 | Next: sockets (Node), React, Cozy Corner (same-Wi-Fi-only), the other 10 games | planned |

## The 20-game roadmap

Built (10): Block Party (Tetris ×4 modes), Emoji Charades, Describe It (movies & more),
Gift Shop, Hot Takes, Two Truths & a Fib, Pitch It, Draw & Guess, Vibe Check, Story Chain.

Next (10): Just One, Desert Island, Telephone Draw, Caption This, Would You Rather
(predict the room), Word Chain Rumble, Reaction Rumble (tap race), Trading Cards,
Awards Night, Episode Titles (name our memories).

Locked on purpose: **Cozy Corner** — the intimate pack. Unlocks only when everyone is on
the same Wi-Fi (server compares a hash of each player's public IP) and is recommended
for in person. Not built yet.
