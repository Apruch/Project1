# WarungKu Internal — Panduan Setup (XAMPP + phpMyAdmin)

Aplikasi ini sekarang tersambung ke database **MySQL** lewat backend **PHP**.
Semua data (bahan baku, mutasi stok, pemasukan, pengeluaran, akun pengguna)
disimpan di database, bukan lagi di penyimpanan browser (localStorage).

## 1. Salin folder project ke XAMPP

Salin seluruh folder `WarungKu-Internal` ke dalam folder `htdocs` XAMPP kamu, misalnya:

- Windows: `C:\xampp\htdocs\WarungKu-Internal`
- macOS: `/Applications/XAMPP/htdocs/WarungKu-Internal`
- Linux: `/opt/lampp/htdocs/WarungKu-Internal`

## 2. Nyalakan Apache & MySQL

Buka **XAMPP Control Panel**, klik **Start** pada modul **Apache** dan **MySQL**.

## 3. Import database lewat phpMyAdmin

1. Buka browser, akses `http://localhost/phpmyadmin`
2. Klik tab **Import** di bagian atas
3. Klik **Choose File**, pilih file `database/warungku.sql` dari folder project ini
4. Klik tombol **Go** di bagian bawah

phpMyAdmin akan otomatis membuat database bernama **`warungku_internal`**
beserta seluruh tabel (`users`, `bahan_baku`, `mutasi_stok`, `pemasukan`,
`pengeluaran_manual`) dan beberapa contoh data bahan baku.

## 4. Buka aplikasinya

Akses lewat browser:

```
http://localhost/WarungKu-Internal/
```

(sesuaikan nama folder kalau kamu menamainya berbeda saat menyalin ke `htdocs`)

Dari sana kamu bisa langsung **Daftar Akun** baru, lalu login dan mulai
mengelola bahan baku, mutasi stok, dan keuangan warung — semua tersimpan
langsung ke MySQL dan bisa dicek/diedit manual lewat phpMyAdmin kapan saja.

## Kalau MySQL kamu pakai password

Buka `config/db.php`, ubah baris:

```php
define('DB_PASS', '');
```

isi dengan password MySQL kamu.

## Struktur backend

```
config/db.php        → koneksi PDO ke MySQL
api/_bootstrap.php    → helper bersama (header, JSON, dsb)
api/auth.php          → login & signup
api/bahan.php         → CRUD Bahan Baku (Master Data)
api/mutasi.php        → Barang Masuk & Keluar (stok tersinkron otomatis)
api/keuangan.php      → Pemasukan, Pengeluaran, & hitung Laba/Rugi
database/warungku.sql → skema + data awal, siap import phpMyAdmin
```

## Troubleshooting

- **"Tidak dapat terhubung ke server"** → pastikan Apache aktif dan kamu
  mengakses lewat `http://localhost/...`, bukan membuka `index.html`
  langsung dari file explorer (double-click).
- **"Koneksi database gagal"** → pastikan MySQL aktif di XAMPP dan database
  `warungku_internal` sudah di-import (langkah 3 di atas).
- **Data tidak sinkron di banyak perangkat** → itu wajar untuk setup XAMPP
  lokal (server hanya jalan di komputer kamu). Untuk dipakai bersama di
  banyak perangkat dalam satu warung, XAMPP perlu diakses lewat jaringan
  WiFi yang sama, atau di-deploy ke hosting.
