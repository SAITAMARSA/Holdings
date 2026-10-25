<?php
require_once __DIR__ . '/config.php';

// Never print PHP warnings into a JSON response (they are still logged).
@ini_set('display_errors', '0');

/* ---------- output / input ---------- */
function now_ms() { return (int) round(microtime(true) * 1000); }

function out($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function fail($msg, $code = 400) { out(['ok' => false, 'error' => $msg], $code); }

function need_post() {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail('POST only', 405);
    // A custom header can't be sent cross-site without a CORS preflight, which we never grant.
    if (($_SERVER['HTTP_X_GL'] ?? '') !== '1') fail('bad request', 403);
}

function input() {
    static $b = null;
    if ($b === null) {
        $raw = file_get_contents('php://input');
        $b = $raw ? json_decode($raw, true) : [];
        if (!is_array($b)) $b = [];
    }
    return $b;
}

function param($k, $def = null) {
    $b = input();
    return array_key_exists($k, $b) ? $b[$k] : $def;
}

function clean_text($s, $max = 40) {
    $s = is_string($s) ? $s : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s);
    $s = trim($s);
    return mb_substr($s, 0, $max);
}

/* ---------- storage: JSON files with locking ---------- */
function ensure_dir($d) { if (!is_dir($d)) @mkdir($d, 0775, true); }

function path_of($rel) {
    $p = DATA_DIR . '/' . $rel;
    ensure_dir(dirname($p));
    return $p;
}

function read_json($file) {
    if (!is_file($file)) return null;
    $fh = @fopen($file, 'r');
    if (!$fh) return null;
    flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : null;
}

// Exclusive read-modify-write. $fn receives the data BY REFERENCE; its return value is returned.
function update_json($file, callable $fn, $default = []) {
    $fh = @fopen($file, 'c+');
    if (!$fh) fail('storage unavailable', 500);
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $d = ($raw !== '' && $raw !== false) ? json_decode($raw, true) : null;
    if (!is_array($d)) $d = $default;
    $res = $fn($d);
    $json = json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, $json);
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $res;
}

function salt() {
    static $s = null;
    if ($s !== null) return $s;
    $f = path_of('salt.txt');
    if (!is_file($f)) @file_put_contents($f, bin2hex(random_bytes(16)));
    $s = trim((string) @file_get_contents($f));
    return $s;
}

function short_hash($s) { return substr(hash('sha256', $s . salt()), 0, 12); }

function client_net() {
    // Same public IP == same Wi-Fi (usually). Only a hash is ever stored.
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? '');
    return short_hash('net:' . $ip);
}

/* ---------- accounts (shared by auth.php and room.php) ---------- */
function accounts_file() { return path_of('accounts.json'); }
function accounts_read() {
    $a = read_json(accounts_file());
    return $a ?: ['users' => [], 'couples' => [], 'invites' => []];
}

function session_boot($write = false) {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('gl_sess');
        session_set_cookie_params(['lifetime' => 60 * 60 * 24 * 60, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        @session_start();
    }
    if (!$write) @session_write_close();
}

function current_user() {
    session_boot(false);
    $uid = $_SESSION['uid'] ?? null;
    if (!$uid) return null;
    $acc = accounts_read();
    return $acc['users'][$uid] ?? null;
}

function owner_id($user) { return !empty($user['coupleId']) ? $user['coupleId'] : $user['id']; }
