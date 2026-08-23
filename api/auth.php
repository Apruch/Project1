<?php
require_once __DIR__ . '/_bootstrap.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'login') {
    $in = jsonInput();
    $username = trim($in['username'] ?? '');
    $password = $in['password'] ?? '';

    if ($username === '' || $password === '') {
        respondError('Username dan password wajib diisi.');
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        respondError('Username atau password salah, atau akun belum terdaftar.', 401);
    }

    respond([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'nama' => $user['nama'],
            'warung' => $user['warung'],
        ]
    ]);

} elseif ($method === 'POST' && $action === 'signup') {
    $in = jsonInput();
    $nama     = trim($in['nama'] ?? '');
    $warung   = trim($in['warung'] ?? '');
    $username = trim($in['username'] ?? '');
    $password = $in['password'] ?? '';

    if ($nama === '' || $warung === '' || $username === '' || $password === '') {
        respondError('Semua kolom wajib diisi.');
    }
    if (preg_match('/\s/', $username)) {
        respondError('Username tidak boleh mengandung spasi.');
    }
    if (strlen($password) < 6) {
        respondError('Password minimal 6 karakter.');
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        respondError('Username sudah dipakai, pilih username lain.');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (nama, warung, username, password) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nama, $warung, $username, $hash]);

    respond([
        'success' => true,
        'user' => [
            'id' => $pdo->lastInsertId(),
            'username' => $username,
            'nama' => $nama,
            'warung' => $warung,
        ]
    ]);

} else {
    respondError('Aksi tidak dikenali. Gunakan ?action=login atau ?action=signup dengan method POST.', 404);
}
