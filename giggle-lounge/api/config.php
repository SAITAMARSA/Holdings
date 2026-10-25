<?php
// Giggle Lounge — server settings.
// Override anything in api/config.local.php (create it; it is never committed).
// To keep the data folder OUTSIDE the web root (recommended), put this in config.local.php:
//   define('DATA_DIR', '/home/youraccount/giggle-data');
if (is_file(__DIR__ . '/config.local.php')) require __DIR__ . '/config.local.php';

if (!defined('DATA_DIR'))        define('DATA_DIR', dirname(__DIR__) . '/data');
if (!defined('MAX_PLAYERS'))     define('MAX_PLAYERS', 8);
if (!defined('ROOM_TTL'))        define('ROOM_TTL', 60 * 60 * 12);   // idle rooms are deleted after 12h
if (!defined('MAX_EVENTS'))      define('MAX_EVENTS', 12000);        // per room, oldest dropped past this
if (!defined('MAX_EVENT_BYTES')) define('MAX_EVENT_BYTES', 24000);   // one event's payload
if (!defined('POLL_WAIT_MAX'))   define('POLL_WAIT_MAX', 5);         // seconds a poll may wait; 0 = plain polling
if (!defined('PRESENT_SECS'))    define('PRESENT_SECS', 12);         // seen within this = "present"
if (!defined('KEEP_MAX_ITEMS'))  define('KEEP_MAX_ITEMS', 200);
if (!defined('KEEP_MAX_BYTES'))  define('KEEP_MAX_BYTES', 260000);
