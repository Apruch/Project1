-- ═══════════════════════════════════════════════════════════════
-- WarungKu Internal — Skema Database (SQLite)
--
-- Database ini berupa SATU FILE (database/warungku.sqlite) yang
-- tersimpan langsung di perangkat/server tempat aplikasi di-deploy —
-- tidak perlu server MySQL/XAMPP terpisah, cukup PHP dengan
-- ekstensi pdo_sqlite (sudah aktif secara default di hampir semua
-- instalasi PHP, termasuk XAMPP).
--
-- File ini otomatis dijalankan oleh config/db.php saat aplikasi
-- pertama kali diakses dan file warungku.sqlite belum ada —
-- jadi TIDAK PERLU proses import manual lewat phpMyAdmin dsb.
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── Tabel akun pengguna (Login & Signup) ──────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama VARCHAR(100) NOT NULL,
  warung VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,      -- disimpan ter-hash (password_hash)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Modul 1: Bahan Baku (Master Data) ──────────────────────────
CREATE TABLE IF NOT EXISTS bahan_baku (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama VARCHAR(150) NOT NULL,
  satuan VARCHAR(30) NOT NULL DEFAULT 'pcs',
  stok DECIMAL(12,2) NOT NULL DEFAULT 0,
  stok_min DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Modul 2: Mutasi Stok (Barang Masuk & Keluar) ───────────────
CREATE TABLE IF NOT EXISTS mutasi_stok (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk','keluar')),
  bahan_id INTEGER NOT NULL,
  bahan_nama VARCHAR(150) NOT NULL,     -- disalin saat transaksi agar riwayat tetap utuh walau nama bahan berubah
  satuan VARCHAR(30) NOT NULL,
  jumlah DECIMAL(12,2) NOT NULL,
  total_harga DECIMAL(14,2) DEFAULT 0,  -- khusus tipe 'masuk' (untuk hitung harga satuan & pengeluaran otomatis)
  harga_satuan DECIMAL(14,2) DEFAULT 0, -- khusus tipe 'masuk'
  keterangan VARCHAR(50) DEFAULT NULL,  -- khusus tipe 'keluar': Operasional/Rusak/Basi/Lainnya
  catatan VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bahan_id) REFERENCES bahan_baku(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_mutasi_tanggal ON mutasi_stok(tanggal);
CREATE INDEX IF NOT EXISTS idx_mutasi_tipe ON mutasi_stok(tipe);

-- ── Modul 3: Keuangan — Pemasukan ───────────────────────────────
CREATE TABLE IF NOT EXISTS pemasukan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  shift VARCHAR(30) NOT NULL DEFAULT 'Harian',
  jumlah DECIMAL(14,2) NOT NULL,
  catatan VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pemasukan_tanggal ON pemasukan(tanggal);

-- ── Modul 3: Keuangan — Pengeluaran Operasional Manual ─────────
-- (Belanja bahan baku TIDAK disimpan di sini — otomatis dihitung dari mutasi_stok tipe 'masuk')
CREATE TABLE IF NOT EXISTS pengeluaran_manual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  kategori VARCHAR(50) NOT NULL DEFAULT 'Lainnya',
  jumlah DECIMAL(14,2) NOT NULL,
  catatan VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tanggal ON pengeluaran_manual(tanggal);

-- ── Contoh data awal (boleh dihapus lewat menu Bahan Baku) ─────
INSERT INTO bahan_baku (nama, satuan, stok, stok_min) VALUES
('Beras Premium', 'kg', 45, 15),
('Minyak Goreng', 'liter', 8, 10),
('Gula Pasir', 'kg', 22, 8),
('Tepung Terigu', 'kg', 5, 6),
('Telur Ayam', 'kg', 14, 5),
('Ayam Potong', 'kg', 0, 4),
('Bawang Merah', 'kg', 3.5, 2),
('Gas LPG 3kg', 'tabung', 6, 3);
