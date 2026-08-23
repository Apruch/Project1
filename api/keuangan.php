<?php
require_once __DIR__ . '/_bootstrap.php';

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? 'pemasukan'; // pemasukan | pengeluaran | labarugi

function pemasukanOut($r){
    return ['id'=>(int)$r['id'],'tgl'=>$r['tanggal'],'shift'=>$r['shift'],'jumlah'=>(float)$r['jumlah'],'catatan'=>$r['catatan']];
}
function pengeluaranOut($r){
    return ['id'=>(int)$r['id'],'tgl'=>$r['tanggal'],'kategori'=>$r['kategori'],'jumlah'=>(float)$r['jumlah'],'catatan'=>$r['catatan']];
}

if ($resource === 'labarugi' && $method === 'GET') {
    $start = $_GET['start'] ?? todayISO();
    $end   = $_GET['end'] ?? todayISO();

    $stmt = $pdo->prepare('SELECT COALESCE(SUM(jumlah),0) AS total FROM pemasukan WHERE tanggal BETWEEN ? AND ?');
    $stmt->execute([$start, $end]);
    $totalPemasukan = (float)$stmt->fetch()['total'];

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_harga),0) AS total FROM mutasi_stok WHERE tipe='masuk' AND tanggal BETWEEN ? AND ?");
    $stmt->execute([$start, $end]);
    $totalBelanjaBahan = (float)$stmt->fetch()['total'];

    $stmt = $pdo->prepare('SELECT COALESCE(SUM(jumlah),0) AS total FROM pengeluaran_manual WHERE tanggal BETWEEN ? AND ?');
    $stmt->execute([$start, $end]);
    $totalPengeluaranManual = (float)$stmt->fetch()['total'];

    $totalPengeluaran = $totalBelanjaBahan + $totalPengeluaranManual;

    respond([
        'success' => true,
        'data' => [
            'totalPemasukan' => $totalPemasukan,
            'totalBelanjaBahan' => $totalBelanjaBahan,
            'totalPengeluaranManual' => $totalPengeluaranManual,
            'totalPengeluaran' => $totalPengeluaran,
            'labaRugi' => $totalPemasukan - $totalPengeluaran,
        ]
    ]);
    exit;
}

if ($resource === 'pemasukan') {
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM pemasukan ORDER BY tanggal DESC, id DESC');
        respond(['success'=>true,'data'=>array_map('pemasukanOut',$stmt->fetchAll())]);

    } elseif ($method === 'POST') {
        $in = jsonInput();
        $jumlah = (float)($in['jumlah'] ?? 0);
        if ($jumlah <= 0) respondError('Jumlah penjualan harus lebih dari 0.');

        $stmt = $pdo->prepare('INSERT INTO pemasukan (tanggal, shift, jumlah, catatan) VALUES (?,?,?,?)');
        $stmt->execute([$in['tgl'] ?? todayISO(), $in['shift'] ?? 'Harian', $jumlah, $in['catatan'] ?? null]);
        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM pemasukan WHERE id=?');
        $stmt->execute([$id]);
        respond(['success'=>true,'data'=>pemasukanOut($stmt->fetch())], 201);

    } elseif ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) respondError('ID tidak valid.');
        $pdo->prepare('DELETE FROM pemasukan WHERE id=?')->execute([$id]);
        respond(['success'=>true]);

    } else {
        respondError('Method tidak didukung.', 405);
    }

} elseif ($resource === 'pengeluaran') {
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM pengeluaran_manual ORDER BY tanggal DESC, id DESC');
        respond(['success'=>true,'data'=>array_map('pengeluaranOut',$stmt->fetchAll())]);

    } elseif ($method === 'POST') {
        $in = jsonInput();
        $jumlah = (float)($in['jumlah'] ?? 0);
        if ($jumlah <= 0) respondError('Jumlah pengeluaran harus lebih dari 0.');

        $stmt = $pdo->prepare('INSERT INTO pengeluaran_manual (tanggal, kategori, jumlah, catatan) VALUES (?,?,?,?)');
        $stmt->execute([$in['tgl'] ?? todayISO(), $in['kategori'] ?? 'Lainnya', $jumlah, $in['catatan'] ?? null]);
        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM pengeluaran_manual WHERE id=?');
        $stmt->execute([$id]);
        respond(['success'=>true,'data'=>pengeluaranOut($stmt->fetch())], 201);

    } elseif ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) respondError('ID tidak valid.');
        $pdo->prepare('DELETE FROM pengeluaran_manual WHERE id=?')->execute([$id]);
        respond(['success'=>true]);

    } else {
        respondError('Method tidak didukung.', 405);
    }

} else {
    respondError('Resource tidak dikenali. Gunakan ?resource=pemasukan|pengeluaran|labarugi', 404);
}
