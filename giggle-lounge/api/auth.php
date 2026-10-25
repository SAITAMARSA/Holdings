<?php
/*
 * Optional accounts. Playing never needs one — a room code is enough.
 * An account gives you: a private "Our Room" for a linked couple, a keepsake drawer
 * (gifts, stories, drawings you chose to keep) and a taste profile that follows you.
 *
 * actions: register | login | logout | me | invite | respond | unlink | keep_add | keep_list | keep_del | prefs_get | prefs_set
 */
require __DIR__ . '/lib.php';
need_post();
$action = (string) param('action', '');

function accounts_update(callable $fn) {
    return update_json(accounts_file(), $fn, ['users' => [], 'couples' => [], 'invites' => []]);
}

function norm_email($e) { return strtolower(trim((string) $e)); }

function find_user_by_email($acc, $email) {
    $h = short_hash('email:' . norm_email($email));
    foreach ($acc['users'] as $u) if ($u['emailH'] === $h) return $u;
    return null;
}

function me_payload($u) {
    $acc = accounts_read();
    $couple = null;
    if (!empty($u['coupleId']) && isset($acc['couples'][$u['coupleId']])) {
        $c = $acc['couples'][$u['coupleId']];
        $partner = null;
        foreach ($c['members'] as $m) if ($m !== $u['id'] && isset($acc['users'][$m])) $partner = $acc['users'][$m]['name'];
        $couple = ['id' => $c['id'], 'partner' => $partner, 'roomCode' => $c['roomCode']];
    }
    $incoming = []; $outgoing = [];
    foreach ($acc['invites'] as $inv) {
        if ($inv['state'] !== 'pending') continue;
        if ($inv['toH'] === $u['emailH'] && isset($acc['users'][$inv['from']])) {
            $incoming[] = ['id' => $inv['id'], 'from' => $acc['users'][$inv['from']]['name']];
        }
        if ($inv['from'] === $u['id']) $outgoing[] = ['id' => $inv['id'], 'to' => $inv['toEmail']];
    }
    return ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'couple' => $couple,
            'incoming' => $incoming, 'outgoing' => $outgoing];
}

function require_user() {
    $u = current_user();
    if (!$u) fail('Please log in first.', 401);
    return $u;
}

if ($action === 'register') {
    $email = norm_email(param('email', ''));
    $name  = clean_text(param('name', ''), 16);
    $pass  = (string) param('password', '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('That email does not look right.');
    if ($name === '') fail('Pick a display name.');
    if (strlen($pass) < 8) fail('Password needs at least 8 characters.');
    $uid = accounts_update(function (&$acc) use ($email, $name, $pass) {
        if (find_user_by_email($acc, $email)) fail('That email already has an account — try logging in.', 409);
        $id = 'u' . bin2hex(random_bytes(6));
        $acc['users'][$id] = ['id' => $id, 'email' => $email, 'emailH' => short_hash('email:' . $email),
            'name' => $name, 'pass' => password_hash($pass, PASSWORD_DEFAULT), 'created' => now_ms()];
        return $id;
    });
    session_boot(true); session_regenerate_id(true); $_SESSION['uid'] = $uid; session_write_close();
    out(['ok' => true, 'me' => me_payload(accounts_read()['users'][$uid])]);
}

if ($action === 'login') {
    $email = norm_email(param('email', ''));
    $pass  = (string) param('password', '');
    $u = find_user_by_email(accounts_read(), $email);
    if (!$u || !password_verify($pass, $u['pass'])) { usleep(500000); fail('Email or password is wrong.', 401); }
    session_boot(true); session_regenerate_id(true); $_SESSION['uid'] = $u['id']; session_write_close();
    out(['ok' => true, 'me' => me_payload($u)]);
}

if ($action === 'logout') {
    session_boot(true); $_SESSION = []; session_destroy();
    out(['ok' => true]);
}

if ($action === 'me') {
    $u = current_user();
    out(['ok' => true, 'me' => $u ? me_payload($u) : null]);
}

if ($action === 'invite') {
    $u = require_user();
    if (!empty($u['coupleId'])) fail('You are already linked up.');
    $email = norm_email(param('email', ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('That email does not look right.');
    if ($email === $u['email']) fail('That is your own email!');
    accounts_update(function (&$acc) use ($u, $email) {
        $toH = short_hash('email:' . $email);
        foreach ($acc['invites'] as $inv) if ($inv['state'] === 'pending' && $inv['from'] === $u['id'] && $inv['toH'] === $toH) fail('Already invited — waiting for them to accept.');
        $id = 'i' . bin2hex(random_bytes(5));
        $acc['invites'][$id] = ['id' => $id, 'from' => $u['id'], 'toH' => $toH, 'toEmail' => $email, 'state' => 'pending', 'created' => now_ms()];
    });
    out(['ok' => true, 'me' => me_payload($u)]);
}

if ($action === 'respond') {
    $u = require_user();
    $iid = (string) param('id', '');
    $accept = !empty(param('accept'));
    accounts_update(function (&$acc) use ($u, $iid, $accept) {
        $inv = $acc['invites'][$iid] ?? null;
        if (!$inv || $inv['state'] !== 'pending' || $inv['toH'] !== $u['emailH']) fail('That invite is not available.');
        if (!$accept) { $acc['invites'][$iid]['state'] = 'declined'; return; }
        $a = $inv['from']; $b = $u['id'];
        if (!empty($acc['users'][$a]['coupleId']) || !empty($acc['users'][$b]['coupleId'])) fail('One of you is already linked.');
        $cid = 'c' . bin2hex(random_bytes(6));
        $alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $rc = 'OUR-';
        for ($i = 0; $i < 8; $i++) $rc .= $alpha[random_int(0, strlen($alpha) - 1)];
        $acc['couples'][$cid] = ['id' => $cid, 'members' => [$a, $b], 'roomCode' => $rc, 'created' => now_ms()];
        $acc['users'][$a]['coupleId'] = $cid;
        $acc['users'][$b]['coupleId'] = $cid;
        $acc['invites'][$iid]['state'] = 'accepted';
    });
    out(['ok' => true, 'me' => me_payload(current_user())]);
}

if ($action === 'unlink') {
    $u = require_user();
    accounts_update(function (&$acc) use ($u) {
        $cid = $u['coupleId'] ?? null;
        if (!$cid || !isset($acc['couples'][$cid])) return;
        foreach ($acc['couples'][$cid]['members'] as $m) unset($acc['users'][$m]['coupleId']);
        unset($acc['couples'][$cid]);
    });
    out(['ok' => true, 'me' => me_payload(current_user())]);
}

/* ---------- keepsakes & taste profile (owned by the couple if linked, else the user) ---------- */
if ($action === 'keep_list') {
    $u = require_user();
    $d = read_json(path_of('keeps/' . owner_id($u) . '.json')) ?: ['items' => []];
    out(['ok' => true, 'items' => array_reverse($d['items'])]);
}

if ($action === 'keep_add') {
    $u = require_user();
    $kind  = preg_replace('/[^a-z\-]/', '', (string) param('kind', 'misc'));
    $title = clean_text(param('title', ''), 60) ?: 'Keepsake';
    $data  = param('data', null);
    if (strlen(json_encode($data)) > KEEP_MAX_BYTES) fail('That keepsake is too big to store.', 413);
    $id = 'k' . bin2hex(random_bytes(5));
    update_json(path_of('keeps/' . owner_id($u) . '.json'), function (&$d) use ($u, $kind, $title, $data, $id) {
        $d['items'][] = ['id' => $id, 'kind' => $kind, 'title' => $title, 'data' => $data, 'by' => $u['name'], 't' => now_ms()];
        if (count($d['items']) > KEEP_MAX_ITEMS) $d['items'] = array_slice($d['items'], -KEEP_MAX_ITEMS);
    }, ['items' => []]);
    out(['ok' => true, 'id' => $id]);
}

if ($action === 'keep_del') {
    $u = require_user();
    $id = (string) param('id', '');
    update_json(path_of('keeps/' . owner_id($u) . '.json'), function (&$d) use ($id) {
        $d['items'] = array_values(array_filter($d['items'] ?? [], function ($k) use ($id) { return $k['id'] !== $id; }));
    }, ['items' => []]);
    out(['ok' => true]);
}

if ($action === 'prefs_get') {
    $u = require_user();
    $d = read_json(path_of('prefs/' . owner_id($u) . '.json')) ?: ['w' => new stdClass()];
    out(['ok' => true, 'prefs' => $d]);
}

if ($action === 'prefs_set') {
    $u = require_user();
    $w = param('w', []);
    if (!is_array($w)) fail('bad prefs');
    $clean = [];
    foreach (array_slice($w, 0, 300, true) as $tag => $val) {
        $tag = preg_replace('/[^a-z0-9:_\-]/i', '', (string) $tag);
        if ($tag !== '' && is_numeric($val)) $clean[$tag] = max(0.2, min(4.0, (float) $val));
    }
    update_json(path_of('prefs/' . owner_id($u) . '.json'), function (&$d) use ($clean) { $d = ['w' => $clean ?: new stdClass()]; }, []);
    out(['ok' => true]);
}

fail('unknown action');
