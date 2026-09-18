# PixelPort

A small gaming website: a curated game library with live filtering, a news feed,
and a playable browser arcade game (Neon Snake). Static HTML, CSS and vanilla
JavaScript — no build step, no dependencies.

## Pages

| Page | What's there |
| --- | --- |
| `index.html` | Hero, top-rated titles, news feed |
| `games.html` | Full library with search, genre/platform filters and sorting |
| `arcade.html` | Neon Snake, playable with keyboard or touch |

## Running it

Open `index.html` directly in a browser, or serve the folder:

```sh
npx http-server . -p 8080
```

Then visit http://localhost:8080.

## Structure

```
index.html  games.html  arcade.html
assets/css/style.css     theme tokens, layout, components, responsive rules
assets/js/games.js       the game catalog (plain script so file:// works)
assets/js/app.js         nav, card rendering, library filtering
assets/js/snake.js       the Neon Snake game loop and canvas renderer
```

## Adding a game

Append an entry to `window.GAMES` in `assets/js/games.js`. `accent` drives the
card artwork gradient; `rating` is a number out of 10. Both pages pick it up
automatically.

All titles, scores and news items are fictional demo content.

## Other sites in this repo

- [`greenhome-systems/`](greenhome-systems/) — marketing and catalogue site for
  Green Home Systems (solar, batteries, hybrid inverters).
