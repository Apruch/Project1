<?php
/**
 * config/db.php — Koneksi database SQLite
 *
 * Database tersimpan sebagai SATU FILE di dalam folder database/,
 * langsung di perangkat/server tempat aplikasi ini berjalan.
 * Tidak perlu MySQL, tidak perlu XAMPP MySQL/phpMyAdmin, tidak
 * perlu proses import manual — file database & tabelnya otomatis
 * dibuat sendiri dari database/warungku.sql saat pertama kali diakses.
 */

define('DB_DIR', __DIR__ . '/../database');
define('DB_FILE', DB_DIR . '/warungku.sqlite');
define('DB_SCHEMA', DB_DIR . '/warungku.sql');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $isNew = !file_exists(DB_FILE);

            if (!is_dir(DB_DIR)) {
                mkdir(DB_DIR, 0775, true);
            }

            $pdo = new PDO('sqlite:' . DB_FILE, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON');

            // Kalau file database belum ada (pertama kali dijalankan),
            // buat otomatis dari skema + data awal.
            if ($isNew && file_exists(DB_SCHEMA)) {
                $sql = file_get_contents(DB_SCHEMA);
                $pdo->exec($sql);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error'   => 'Koneksi database gagal. Pastikan ekstensi PHP "pdo_sqlite" aktif dan folder "database/" bisa ditulis (writable) oleh server.',
                'detail'  => $e->getMessage()
            ]);
            exit;
        }
    }
    return $pdo;
}
