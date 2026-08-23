<?php
/**
 * config/db.php — Koneksi database untuk XAMPP / phpMyAdmin
 *
 * Default XAMPP: host=localhost, user=root, password kosong.
 * Kalau MySQL kamu pakai password, isi di DB_PASS di bawah.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'warungku_internal');
define('DB_USER', 'root');
define('DB_PASS', '');       // isi password MySQL kamu kalau ada
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error'   => 'Koneksi database gagal. Pastikan XAMPP (Apache & MySQL) sudah dijalankan dan database "warungku_internal" sudah di-import lewat phpMyAdmin.',
                'detail'  => $e->getMessage()
            ]);
            exit;
        }
    }
    return $pdo;
}
