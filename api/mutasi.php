<?php
require_once __DIR__ . '/_bootstrap.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function mutasiOut($r){
    return [
        'id' => (int)$r['id'],
        'tgl' => $r['tanggal'],
        'tipe' => $r['tipe'],
        'bahanId' => (int)$r['bahan_id'],
        'bahanNama' => $r['bahan_nama'],
        'satuan' => $r['satuan'],
        'jumlah' => (float)$r['jumlah'],
        'totalHarga' => (float)$r['total_harga'],
        'hargaSatuan' => (float)$r['harga_satuan'],
        'keterangan' => $r['keterangan'],
        'catatan' => $r['catatan'],
    ];
}

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM mutasi_stok ORDER BY tanggal DESC, id DESC');
    respond(['success' => true, 'data' => array_map('mutasiOut', $stmt->fetchAll())]);

} elseif ($method === 'POST') {
    $in = jsonInput();
    $tipe = $in['tipe'] ?? '';
    $bahanId = (int)($in['bahanId'] ?? 0);
    $jumlah = (float)($in['jumlah'] ?? 0);

    if (!in_array($tipe, ['masuk', 'keluar'])) respondError('Tipe mutasi tidak valid.');
    if ($jumlah <= 0) respondError('Jumlah harus lebih dari 0.');

    $stmt = $pdo->prepare('SELECT * FROM bahan_baku WHERE id=?');
    $stmt->execute([$bahanId]);
    $bahan = $stmt->fetch();
    if (!$bahan) respondError('Bahan tidak ditemukan.', 404);

    $tgl = $in['tgl'] ?? todayISO();

    $pdo->beginTransaction();
    try {
        if ($tipe === 'masuk') {
            $totalHarga = (float)($in['totalHarga'] ?? 0);
            $hargaSatuan = $jumlah > 0 ? $totalHarga / $jumlah : 0;

            $pdo->prepare('UPDATE bahan_baku SET stok = stok + ? WHERE id = ?')
                ->execute([$jumlah, $bahanId]);

            $stmt = $pdo->prepare('INSERT INTO mutasi_stok
                (tanggal, tipe, bahan_id, bahan_nama, satuan, jumlah, total_harga, harga_satuan, catatan)
                VALUES (?,?,?,?,?,?,?,?,?)');
            $stmt->execute([$tgl, 'masuk', $bahanId, $bahan['nama'], $bahan['satuan'], $jumlah, $totalHarga, $hargaSatuan, $in['catatan'] ?? null]);

        } else {
            $keterangan = $in['keterangan'] ?? 'Operasional';
            $stokBaru = max(0, $bahan['stok'] - $jumlah);

            $pdo->prepare('UPDATE bahan_baku SET stok = ? WHERE id = ?')
                ->execute([$stokBaru, $bahanId]);

            $stmt = $pdo->prepare('INSERT INTO mutasi_stok
                (tanggal, tipe, bahan_id, bahan_nama, satuan, jumlah, keterangan, catatan)
                VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([$tgl, 'keluar', $bahanId, $bahan['nama'], $bahan['satuan'], $jumlah, $keterangan, $in['catatan'] ?? null]);
        }

        $id = $pdo->lastInsertId();
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        respondError('Gagal menyimpan mutasi: ' . $e->getMessage(), 500);
    }

    $stmt = $pdo->prepare('SELECT * FROM mutasi_stok WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'data' => mutasiOut($stmt->fetch())], 201);

} elseif ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respondError('ID mutasi tidak valid.');

    $stmt = $pdo->prepare('SELECT * FROM mutasi_stok WHERE id=?');
    $stmt->execute([$id]);
    $m = $stmt->fetch();
    if (!$m) respondError('Mutasi tidak ditemukan.', 404);

    $pdo->beginTransaction();
    try {
        // Kembalikan stok seperti sebelum mutasi ini tercatat
        if ($m['tipe'] === 'masuk') {
            $pdo->prepare('UPDATE bahan_baku SET stok = MAX(0, stok - ?) WHERE id = ?')
                ->execute([$m['jumlah'], $m['bahan_id']]);
        } else {
            $pdo->prepare('UPDATE bahan_baku SET stok = stok + ? WHERE id = ?')
                ->execute([$m['jumlah'], $m['bahan_id']]);
        }
        $pdo->prepare('DELETE FROM mutasi_stok WHERE id=?')->execute([$id]);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        respondError('Gagal menghapus mutasi: ' . $e->getMessage(), 500);
    }

    respond(['success' => true]);

} else {
    respondError('Method tidak didukung.', 405);
}
