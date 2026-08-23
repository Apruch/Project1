-- ═══════════════════════════════════════════════════════════════
-- WarungKu Internal — Skema Database (MySQL / MariaDB)
-- Cara pakai:
--   1. Buka phpMyAdmin (http://localhost/phpmyadmin)
--   2. Buat database baru bernama: warungku_internal
--   3. Pilih database tsb -> tab "Import" -> pilih file ini -> Go
--   (atau import lewat terminal: mysql -u root warungku_internal < warungku.sql)
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS warungku_internal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warungku_internal;

-- ── Tabel akun pengguna (Login & Signup) ──────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  warung VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,      -- disimpan ter-hash (password_hash)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Modul 1: Bahan Baku (Master Data) ──────────────────────────
CREATE TABLE IF NOT EXISTS bahan_baku (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  satuan VARCHAR(30) NOT NULL DEFAULT 'pcs',
  stok DECIMAL(12,2) NOT NULL DEFAULT 0,
  stok_min DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Modul 2: Mutasi Stok (Barang Masuk & Keluar) ───────────────
CREATE TABLE IF NOT EXISTS mutasi_stok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  tipe ENUM('masuk','keluar') NOT NULL,
  bahan_id INT NOT NULL,
  bahan_nama VARCHAR(150) NOT NULL,     -- disalin saat transaksi agar riwayat tetap utuh walau nama bahan berubah
  satuan VARCHAR(30) NOT NULL,
  jumlah DECIMAL(12,2) NOT NULL,
  total_harga DECIMAL(14,2) DEFAULT 0,  -- khusus tipe 'masuk' (untuk hitung harga satuan & pengeluaran otomatis)
  harga_satuan DECIMAL(14,2) DEFAULT 0, -- khusus tipe 'masuk'
  keterangan VARCHAR(50) DEFAULT NULL,  -- khusus tipe 'keluar': Operasional/Rusak/Basi/Lainnya
  catatan VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bahan_id) REFERENCES bahan_baku(id) ON DELETE CASCADE,
  INDEX idx_tanggal (tanggal),
  INDEX idx_tipe (tipe)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Modul 3: Keuangan — Pemasukan ───────────────────────────────
CREATE TABLE IF NOT EXISTS pemasukan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  shift VARCHAR(30) NOT NULL DEFAULT 'Harian',
  jumlah DECIMAL(14,2) NOT NULL,
  catatan VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Modul 3: Keuangan — Pengeluaran Operasional Manual ─────────
-- (Belanja bahan baku TIDAK disimpan di sini — otomatis dihitung dari mutasi_stok tipe 'masuk')
CREATE TABLE IF NOT EXISTS pengeluaran_manual (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  kategori VARCHAR(50) NOT NULL DEFAULT 'Lainnya',
  jumlah DECIMAL(14,2) NOT NULL,
  catatan VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Contoh data awal (boleh dihapus) ───────────────────────────
INSERT INTO bahan_baku (nama, satuan, stok, stok_min) VALUES
('Beras Premium', 'kg', 45, 15),
('Minyak Goreng', 'liter', 8, 10),
('Gula Pasir', 'kg', 22, 8),
('Tepung Terigu', 'kg', 5, 6),
('Telur Ayam', 'kg', 14, 5),
('Ayam Potong', 'kg', 0, 4),
('Bawang Merah', 'kg', 3.5, 2),
('Gas LPG 3kg', 'tabung', 6, 3);
