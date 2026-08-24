# WarungKu Internal — Panduan Setup (SQLite)

Aplikasi ini memakai **SQLite** — database berbentuk **satu file** yang
tersimpan langsung di perangkat/server tempat aplikasi ini di-deploy.

Tidak perlu MySQL, tidak perlu server database terpisah, tidak perlu
import lewat phpMyAdmin. Yang dibutuhkan hanya **PHP** dengan ekstensi
`pdo_sqlite` — ekstensi ini sudah aktif secara default di hampir semua
instalasi PHP, termasuk XAMPP, sehingga aplikasi ini tetap bisa dijalankan
di dalam XAMPP (cukup pakai Apache-nya saja, MySQL tidak perlu dinyalakan).

## Cara menjalankan

### Opsi A — Pakai XAMPP (cukup Apache, MySQL tidak perlu dinyalakan)

1. Salin folder `WarungKu-Internal` ke `htdocs` XAMPP kamu
2. Nyalakan **Apache** saja di XAMPP Control Panel (MySQL tidak perlu)
3. Buka `http://localhost/WarungKu-Internal/`

### Opsi B — Pakai PHP built-in server (tanpa XAMPP sama sekali)

```bash
cd WarungKu-Internal
php -S localhost:8000
```

lalu buka `http://localhost:8000/` di browser.

## Bagaimana database dibuat?

Saat aplikasi pertama kali diakses, `config/db.php` otomatis:

1. Membuat file `database/warungku.sqlite` (jika belum ada)
2. Menjalankan skema dari `database/warungku.sql` untuk membuat semua
   tabel (`users`, `bahan_baku`, `mutasi_stok`, `pemasukan`,
   `pengeluaran_manual`) beserta beberapa contoh data bahan baku

Tidak ada langkah manual yang perlu dilakukan — cukup akses aplikasinya,
lalu **Daftar Akun** dan mulai pakai.

## Di mana data saya tersimpan?

Semua data (akun, bahan baku, mutasi stok, keuangan) ada di **satu file**:

```
database/warungku.sqlite
```

- **Backup**: cukup salin file ini ke tempat aman
- **Pindah ke perangkat/server lain**: salin folder project + file
  `warungku.sqlite` ini, datanya langsung ikut pindah
- **Reset ke data awal**: hapus file `warungku.sqlite`, lalu akses
  aplikasinya lagi — database baru akan otomatis dibuat ulang dari skema

## Struktur backend

```
config/db.php          → koneksi PDO ke SQLite + auto-buat database
database/warungku.sql  → skema + data awal (dijalankan otomatis)
database/warungku.sqlite → file database sesungguhnya (dibuat otomatis, jangan dihapus kecuali mau reset)
api/_bootstrap.php      → helper bersama (header, JSON, dsb)
api/auth.php            → login & signup
api/bahan.php           → CRUD Bahan Baku (Master Data)
api/mutasi.php          → Barang Masuk & Keluar (stok tersinkron otomatis)
api/keuangan.php        → Pemasukan, Pengeluaran, & hitung Laba/Rugi
```

## Troubleshooting

- **"Koneksi database gagal"** → pastikan ekstensi PHP `pdo_sqlite` aktif
  (cek dengan `php -m | grep sqlite`) dan folder `database/` bisa ditulis
  (writable) oleh web server.
- **"Tidak dapat terhubung ke server"** → pastikan Apache/PHP aktif dan
  kamu mengakses lewat `http://localhost/...`, bukan membuka `index.html`
  langsung dari file explorer (double-click).
- **Data hilang setelah update aplikasi** → jangan timpa/hapus file
  `database/warungku.sqlite` saat mengganti file aplikasi yang lain.
  File ini terpisah dari kode aplikasi dan harus tetap dipertahankan.
- **Mau pakai banyak perangkat sekaligus dalam satu warung** → karena
  SQLite tersimpan sebagai file lokal di satu server, semua perangkat
  perlu mengakses server yang sama lewat jaringan (WiFi yang sama atau
  hosting). SQLite kurang cocok untuk banyak proses menulis bersamaan
  dalam skala besar, tapi lebih dari cukup untuk kebutuhan satu warung.
