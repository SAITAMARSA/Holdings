<?php
/*
 * Rooms are an append-only EVENT LOG. Clients send events, poll for new ones, and every
 * client folds the same events in the same order — so all phones agree without the server
 * knowing anything about any game. (This is the part to swap for WebSockets later.)
 *
 * actions: create | join | poll | send | leave
 */
require __DIR__ . '/lib.php';
need_post();

$action = (string) param('action', '');
$code   = strtoupper(preg_replace('/[^A-Za-z0-9\-]/', '', (string) param('code', '')));

function room_file($c) { return path_of('rooms/' . $c . '.json'); }
function seq_file($c)  { return path_of('rooms/' . $c . '.seq'); }

function find_player($room, $pid, $tok) {
    foreach ($room['players'] as $i => $p) {
        if ($p['id'] === $pid && hash_equals($p['th'], hash('sha256', (string) $tok))) return $i;
    }
    return null;
}

function public_players($room) {
    $now = now_ms();
    $o = [];
    foreach ($room['players'] as $p) {
        $o[] = [
            'id' => $p['id'], 'name' => $p['name'], 'avatar' => $p['avatar'], 'color' => $p['color'],
            'idx' => $p['idx'], 'left' => !empty($p['left']), 'net' => $p['net'],
            'present' => empty($p['left']) && ($now - $p['last']) < PRESENT_SECS * 1000,
        ];
    }
    return $o;
}

function events_for($room, $since, $pid) {
    $o = [];
    foreach ($room['events'] as $e) {
        if ($e['s'] <= $since) continue;
        if (isset($e['to']) && $e['to'] !== $pid && $e['f'] !== $pid) continue;
        $o[] = $e;
    }
    return $o;
}

function append_event(&$room, $from, $type, $data, $to = null, $eph = false) {
    $room['seq']++;
    $e = ['s' => $room['seq'], 't' => now_ms(), 'f' => $from, 'y' => $type, 'd' => $data];
    if ($to) $e['to'] = $to;
    if ($eph) $e['e'] = 1;
    $room['events'][] = $e;
    // Drop stale ephemeral events (pokes, live cursors) so the log stays lean.
    $cut = now_ms() - 60000;
    $room['events'] = array_values(array_filter($room['events'], function ($x) use ($cut) {
        return empty($x['e']) || $x['t'] >= $cut;
    }));
    if (count($room['events']) > MAX_EVENTS) $room['events'] = array_slice($room['events'], -MAX_EVENTS);
    return $e;
}

function valid_color($c) { return is_string($c) && preg_match('/^#[0-9a-fA-F]{6}$/', $c) ? $c : '#FF5CA8'; }

function player_from_input($net) {
    return [
        'name'   => clean_text(param('name', ''), 16) ?: 'Player',
        'avatar' => mb_substr(clean_text(param('avatar', '😀'), 12), 0, 8) ?: '😀',
        'color'  => valid_color(param('color', '')),
        'net'    => $net,
    ];
}

function gc_rooms() {
    $dir = DATA_DIR . '/rooms';
    if (!is_dir($dir)) return;
    foreach (glob($dir . '/*') as $f) {
        if (is_file($f) && (time() - filemtime($f)) > ROOM_TTL) @unlink($f);
    }
}

function new_room($code, $private = null) {
    return ['code' => $code, 'created' => now_ms(), 'private' => $private, 'seq' => 0, 'pc' => 0,
            'players' => [], 'events' => [], 'meta' => ['settings' => ['vibe' => 'random', 'silent' => false, 'sa' => true]]];
}

// A private room belongs to a linked couple; only their logged-in sessions may enter.
function private_gate($code) {
    $u = current_user();
    if (!$u || empty($u['coupleId'])) fail('Log in with your linked account to enter your private room.', 403);
    $acc = accounts_read();
    $c = $acc['couples'][$u['coupleId']] ?? null;
    if (!$c || $c['roomCode'] !== $code) fail('That private room is not yours.', 403);
}

function add_player(&$room, $net) {
    $pl = player_from_input($net);
    $room['pc']++;
    $pid = bin2hex(random_bytes(4));
    $tok = bin2hex(random_bytes(12));
    $room['players'][] = $pl + ['id' => $pid, 'th' => hash('sha256', $tok), 'idx' => $room['pc'], 'last' => now_ms(), 'left' => false];
    return [$pid, $tok];
}

function active_count($room) {
    $n = 0;
    foreach ($room['players'] as $p) if (empty($p['left']) && (now_ms() - $p['last']) < 120000) $n++;
    return $n;
}

/* ================= actions ================= */

if ($action === 'create') {
    gc_rooms();
    $net = client_net();
    for ($try = 0; $try < 30; $try++) {
        $len = $try < 20 ? 4 : 5;
        $c = '';
        $alpha = 'BCDFGHJKLMNPQRSTVWXZ';   // no vowels: never spells anything rude
        for ($i = 0; $i < $len; $i++) $c .= $alpha[random_int(0, strlen($alpha) - 1)];
        if (!is_file(room_file($c))) break;
    }
    $res = update_json(room_file($c), function (&$room) use ($c, $net) {
        $room = new_room($c);
        [$pid, $tok] = add_player($room, $net);
        file_put_contents(seq_file($c), (string) $room['seq'], LOCK_EX);
        return ['pid' => $pid, 'token' => $tok];
    }, []);
    out(['ok' => true, 'code' => $c] + $res);
}

if ($code === '') fail('Missing room code');

if ($action === 'join') {
    $net = client_net();
    $pid = (string) param('pid', ''); $tok = (string) param('token', '');
    $isPrivate = strpos($code, 'OUR-') === 0;
    $exists = is_file(room_file($code));
    if ($isPrivate) private_gate($code);
    elseif (!$exists) fail('No room with that code. Check the letters?', 404);

    $res = update_json(room_file($code), function (&$room) use ($code, $net, $pid, $tok, $isPrivate) {
        if (empty($room['code'])) $room = new_room($code, $isPrivate ? $code : null);
        if (!$isPrivate && !empty($room['private'])) fail('Private room', 403);
        $i = $pid !== '' ? find_player($room, $pid, $tok) : null;
        if ($i !== null) {                       // rejoin: same seat
            $pl = player_from_input($net);
            $room['players'][$i] = $pl + $room['players'][$i];
            $room['players'][$i]['left'] = false;
            $room['players'][$i]['last'] = now_ms();
            $p = $room['players'][$i]['id']; $t = $tok;
        } else {
            if (active_count($room) >= MAX_PLAYERS) fail('That room is full (8 max).', 409);
            [$p, $t] = add_player($room, $net);
        }
        append_event($room, $p, 'sys.join', ['pid' => $p], null, true);
        file_put_contents(seq_file($room['code']), (string) $room['seq'], LOCK_EX);
        return ['pid' => $p, 'token' => $t];
    }, []);
    out(['ok' => true, 'code' => $code] + $res);
}

// everything below needs a seat in the room
$pid = (string) param('pid', '');
$tok = (string) param('token', '');
$room = read_json(room_file($code));
if (!$room) fail('Room not found', 404);
if (find_player($room, $pid, $tok) === null) fail('Not in this room', 403);

// A held-open poll ties up one PHP process. Cap how many may wait at once (flock'd slot files) so a busy room can't
// starve the host: past the cap, a poll just answers immediately and the client's short-poll fallback takes over.
function take_wait_slot() {
    for ($i = 0; $i < MAX_WAITERS; $i++) {
        $fh = @fopen(path_of('slots/' . $i . '.lock'), 'c');
        if ($fh && flock($fh, LOCK_EX | LOCK_NB)) return $fh;
        if ($fh) fclose($fh);
    }
    return null;
}

if ($action === 'poll') {
    $since = (int) param('since', 0);
    $wait  = min((float) param('wait', 0), (float) POLL_WAIT_MAX);
    $slot = null;
    if ($wait > 0) { $slot = take_wait_slot(); if ($slot === null) $wait = 0; }
    if ($wait > 0) {
        $deadline = microtime(true) + $wait;
        while (microtime(true) < $deadline) {
            clearstatcache();
            if ((int) @file_get_contents(seq_file($code)) > $since) break;
            usleep(120000);
        }
        $room = read_json(room_file($code)) ?: $room;
    }
    if ($slot) { flock($slot, LOCK_UN); fclose($slot); }
    $i = find_player($room, $pid, $tok);
    if ($i !== null && (now_ms() - $room['players'][$i]['last']) > 4000) {   // heartbeat, at most every 4s
        $room = update_json(room_file($code), function (&$r) use ($pid) {
            foreach ($r['players'] as &$p) if ($p['id'] === $pid) { $p['last'] = now_ms(); $p['left'] = false; }
            return $r;
        });
    }
    out(['ok' => true, 'now' => now_ms(), 'seq' => $room['seq'], 'players' => public_players($room),
         'meta' => $room['meta'], 'events' => events_for($room, $since, $pid)]);
}

if ($action === 'send') {
    $type  = (string) param('type', '');
    $data  = param('data', null);
    $to    = param('to', null);
    $eph   = !empty(param('eph'));
    $since = (int) param('since', 0);
    if (!preg_match('/^(g|e|sys|game|meta)\.[A-Za-z0-9_.]{1,30}$/', $type)) fail('bad event type');
    if (strlen(json_encode($data)) > MAX_EVENT_BYTES) fail('event too big', 413);
    $allowSys = ['sys.pause', 'sys.resume', 'sys.poke'];
    if (strpos($type, 'sys.') === 0 && !in_array($type, $allowSys, true)) fail('reserved');
    if ($to !== null && !is_string($to)) $to = null;

    $res = update_json(room_file($code), function (&$r) use ($pid, $type, $data, $to, $eph) {
        if ($type === 'game.start' || $type === 'game.end' || $type === 'meta.set') $data = is_array($data) ? $data : [];
        foreach ($r['players'] as &$p) if ($p['id'] === $pid) { $p['last'] = now_ms(); $p['left'] = false; }
        unset($p);

        if ($type === 'game.start') {
            $gid = preg_replace('/[^a-z0-9\-]/', '', (string) ($data['id'] ?? ''));
            if ($gid === '') fail('no game');
            // keep only recent ephemera; the new game starts from a clean log
            $r['events'] = array_values(array_filter($r['events'], function ($x) { return !empty($x['e']); }));
            $roster = [];
            foreach (($data['roster'] ?? []) as $rp) if (is_string($rp)) $roster[] = $rp;
            $e = append_event($r, $pid, 'game.start', [
                'id' => $gid,
                'settings' => is_array($data['settings'] ?? null) ? $data['settings'] : new stdClass(),
                'roster' => array_slice($roster, 0, MAX_PLAYERS),
                'seed' => random_int(1, 2147483646),     // crypto-random, server-chosen: no repeats between sessions
            ]);
            $r['meta']['game'] = ['id' => $gid, 'startSeq' => $e['s']];
        } elseif ($type === 'game.end') {
            $r['events'] = array_values(array_filter($r['events'], function ($x) { return !empty($x['e']); }));
            append_event($r, $pid, 'game.end', new stdClass());
            unset($r['meta']['game']);
        } elseif ($type === 'meta.set') {
            $vibe = (string) ($data['vibe'] ?? '');
            if (in_array($vibe, ['random', 'funny', 'silly'], true)) $r['meta']['settings']['vibe'] = $vibe;
            if (isset($data['silent'])) $r['meta']['settings']['silent'] = (bool) $data['silent'];
            if (isset($data['sa'])) $r['meta']['settings']['sa'] = (bool) $data['sa'];
            append_event($r, $pid, 'meta.set', $r['meta']['settings'], null, true);
        } elseif (strpos($type, 'game.') === 0 || strpos($type, 'meta.') === 0) {
            fail('reserved');
        } else {
            append_event($r, $pid, $type, $data, $to, $eph);
        }
        file_put_contents(seq_file($r['code']), (string) $r['seq'], LOCK_EX);
        return $r['seq'];
    });
    // Return anything new straight away so the sender sees their own move instantly.
    $room = read_json(room_file($code));
    out(['ok' => true, 'now' => now_ms(), 'seq' => $room['seq'], 'players' => public_players($room),
         'meta' => $room['meta'], 'events' => events_for($room, $since, $pid)]);
}

if ($action === 'leave') {
    update_json(room_file($code), function (&$r) use ($pid) {
        foreach ($r['players'] as &$p) if ($p['id'] === $pid) $p['left'] = true;
        unset($p);
        append_event($r, $pid, 'sys.join', ['pid' => $pid], null, true);
        file_put_contents(seq_file($r['code']), (string) $r['seq'], LOCK_EX);
    });
    out(['ok' => true]);
}

fail('unknown action');
