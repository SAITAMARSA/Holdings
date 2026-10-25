<?php
// Hosting self-check. Open /check.html — it calls this and tells you what works.
require __DIR__ . '/lib.php';
$checks = [];
$checks['php'] = ['ok' => version_compare(PHP_VERSION, '7.4', '>='), 'note' => 'PHP ' . PHP_VERSION . ' (needs 7.4+)'];
foreach (['json', 'mbstring', 'session'] as $ext) $checks[$ext] = ['ok' => extension_loaded($ext), 'note' => $ext . ' extension'];
$dir = DATA_DIR; ensure_dir($dir);
$checks['data_writable'] = ['ok' => is_dir($dir) && is_writable($dir), 'note' => 'data folder: ' . $dir];
$t = path_of('ping-test.json');
$ok = false;
try { $ok = update_json($t, function (&$d) { $d['n'] = ($d['n'] ?? 0) + 1; return true; }, []); } catch (Throwable $e) {}
$checks['file_locking'] = ['ok' => $ok === true, 'note' => 'flock read/modify/write'];
@unlink($t);
$checks['password_hash'] = ['ok' => function_exists('password_hash'), 'note' => 'password_hash (accounts)'];
$checks['random_bytes'] = ['ok' => function_exists('random_bytes'), 'note' => 'random_bytes (secure randomness)'];
$web = (strpos(realpath($dir) ?: '', realpath(dirname(__DIR__)) ?: '#') === 0);
$checks['data_outside_web'] = ['ok' => !$web, 'warn' => $web, 'note' => $web
    ? 'data/ is inside the web folder — blocked by .htaccess on Apache, but better moved out (see README).'
    : 'data folder is outside the web root'];
out(['ok' => true, 'now' => now_ms(), 'checks' => $checks, 'pollWaitMax' => POLL_WAIT_MAX]);
