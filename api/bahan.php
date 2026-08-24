<?php
require_once __DIR__ . '/_bootstrap.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function rowOut($r){
    return [
        'id' => (int)$r['id'],
        'nama' => $r['nama'],
        'satuan' => $r['satuan'],
        'stok' => (float)$r['stok'],
        'stokMin' => (float)$r['stok_min'],
    ];
}

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM bahan_baku ORDER BY nama ASC');
    respond(['success' => true, 'data' => array_map('rowOut', $stmt->fetchAll())]);

} elseif ($method === 'POST') {
    $in = jsonInput();
    $nama = trim($in['nama'] ?? '');
    if ($nama === '') respondError('Nama bahan wajib diisi.');

    $stmt = $pdo->prepare('INSERT INTO bahan_baku (nama, satuan, stok, stok_min) VALUES (?,?,?,?)');
    $stmt->execute([
        $nama,
        $in['satuan'] ?? 'pcs',
        (float)($in['stok'] ?? 0),
        (float)($in['stokMin'] ?? 0),
    ]);
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM bahan_baku WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'data' => rowOut($stmt->fetch())], 201);

} elseif ($method === 'PUT') {
    $in = jsonInput();
    $id = (int)($in['id'] ?? 0);
    if (!$id) respondError('ID bahan tidak valid.');

    $stmt = $pdo->prepare('SELECT * FROM bahan_baku WHERE id=?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) respondError('Bahan tidak ditemukan.', 404);

    $nama    = isset($in['nama']) ? trim($in['nama']) : $existing['nama'];
    $satuan  = $in['satuan'] ?? $existing['satuan'];
    $stokMin = isset($in['stokMin']) ? (float)$in['stokMin'] : $existing['stok_min'];
    $stok    = isset($in['stok']) ? (float)$in['stok'] : $existing['stok'];

    $stmt = $pdo->prepare("UPDATE bahan_baku SET nama=?, satuan=?, stok=?, stok_min=?, updated_at=CURRENT_TIMESTAMP WHERE id=?");
    $stmt->execute([$nama, $satuan, $stok, $stokMin, $id]);

    // Sinkronkan nama & satuan pada riwayat mutasi yang sudah ada
    $stmt = $pdo->prepare('UPDATE mutasi_stok SET bahan_nama=?, satuan=? WHERE bahan_id=?');
    $stmt->execute([$nama, $satuan, $id]);

    respond(['success' => true]);

} elseif ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respondError('ID bahan tidak valid.');
    $stmt = $pdo->prepare('DELETE FROM bahan_baku WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true]);

} else {
    respondError('Method tidak didukung.', 405);
}
