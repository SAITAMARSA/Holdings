# Putting Giggle Lounge on your hosting (shared hosting / cPanel)

Giggle Lounge is plain files + a little PHP. Anything that runs PHP 7.4+ works — no Composer, Node or database.

## 1. Upload

1. In your hosting panel, create a **subdomain** (e.g. `play.yourdomain.com`) and note its folder.
2. Upload the **contents** of the `giggle-lounge/` folder into that folder, so that `index.html` and `api/` sit at its root.
   (Skip `tests/` and `docs/` if you like.)
3. Make sure the **`data/`** folder is writable by PHP (permissions `755`, or `775` if your host needs it). It starts empty.

## 2. Run the check

Open `https://play.yourdomain.com/check.html`. You want a column of ✅:

| Check | If it fails |
| --- | --- |
| PHP 7.4+ | Pick a newer PHP version for the subdomain in the panel. |
| data folder writable | Fix the permissions on `data/`. |
| file locking | Rare. Ask your host whether `flock()` is disabled. |
| **Parallel-request test** | If it says your host runs requests *one after another*, set `POLL_WAIT_MAX` to `0` (below). Play still works, with ~½ s of delay. |
| data outside web root (⚠️) | Optional but recommended — see step 3. |

Delete `check.html` when you're done.

## 3. Keep the data out of the public web folder (recommended)

`data/` holds rooms and accounts. It ships with an `.htaccess` that blocks web access on Apache, but the safest place is
**outside** the web root. Create `api/config.local.php` (never committed):

```php
<?php
define('DATA_DIR', '/home/YOURACCOUNT/giggle-data');   // a folder ABOVE public_html, writable by PHP
// define('POLL_WAIT_MAX', 0);                          // uncomment if the parallel-request test failed
```

Then re-run `check.html` — the last row should turn ✅.

## 4. Share it

Open the site, make a room, hit **Share**. The link carries the room code (`?room=ABCD`), so friends land straight in.
For the full effect, start a WhatsApp / FaceTime call and play alongside it.

## Settings (`api/config.local.php`)

| Constant | Default | Meaning |
| --- | --- | --- |
| `DATA_DIR` | `../data` | Where rooms/accounts are stored |
| `POLL_WAIT_MAX` | `5` | Seconds a request may wait for news. `0` = plain polling (use if your host serialises requests) |
| `MAX_PLAYERS` | `8` | Players per room |
| `ROOM_TTL` | 12 h | Idle rooms are deleted after this |

## Privacy

* Playing needs **no account**. Rooms are only reachable with the code. Room events are stored on your server for ≤12 h.
* Accounts store: email, display name, a hashed password, and anything the player chooses to keep. **Linked couples** get a private room only they can enter.
* "Same Wi-Fi" detection compares a salted **hash** of each player's public IP — the IP itself is never stored.
* Honest limitation: answers in a reveal-together game are in the room's event log until the reveal (a technical person could read them in the browser's network tab). Fine for friends; not for secrets.

## Moving to Node + WebSockets later

Everything transport-related is in `assets/js/core/room.js` (client) and `api/room.php` (server). Games only talk to
`ctx.send()` and `onEvent()`, so replacing the transport with a WebSocket server that appends to the same kind of ordered log needs no game changes.
