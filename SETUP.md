# WarungKu Internal — Panduan Setup (GitHub Pages / Static Hosting)

Aplikasi ini sekarang **murni HTML/CSS/JavaScript** — tidak ada PHP,
tidak ada database server. Semua data tersimpan langsung di
**penyimpanan browser perangkat** (localStorage) tempat aplikasi dibuka.

Karena tidak butuh server backend apa pun, aplikasi ini bisa langsung
di-hosting di **GitHub Pages**, Netlify, Vercel, atau hosting statis
lainnya — bahkan bisa dibuka langsung dari file lokal.

## Cara deploy ke GitHub Pages

1. Push seluruh isi folder `WarungKu-Internal` ke sebuah repository GitHub
2. Buka **Settings** repo tsb → menu **Pages** di sidebar kiri
3. Di bagian **Source**, pilih branch (misal `main`) dan folder `/ (root)`
4. Klik **Save** — GitHub akan memberi URL seperti:
   `https://namamu.github.io/nama-repo/`
5. Buka URL tersebut — aplikasi langsung jalan, tidak perlu setup lain

## Di mana data saya tersimpan?

Semua data (akun, bahan baku, mutasi stok, pemasukan, pengeluaran)
tersimpan di **localStorage browser**, per perangkat + per browser:

- Data **tidak otomatis tersinkron** antar perangkat atau antar browser
  yang berbeda (misal Chrome vs Firefox di HP yang sama = data terpisah)
- Data **tetap ada** meski aplikasi ditutup, HP di-restart, atau internet
  mati — karena memang tidak butuh internet setelah halaman dimuat
- Data **bisa hilang** kalau: cache/data browser dibersihkan manual,
  memakai mode Incognito/Private, atau ganti perangkat

## Backup & pindah data

Karena tidak ada database server untuk dicek manual, dipakai fitur bawaan
di menu (ikon ⋮ pojok kanan atas):

- **Ekspor Data (Backup JSON)** — download semua data jadi 1 file JSON
- **Reset Semua Data** — hapus semua data dan mulai dari data awal lagi

Untuk pindah data ke perangkat lain: saat ini butuh proses manual (ekspor
lalu impor via edit localStorage) — kalau perlu fitur impor otomatis dari
file backup, tinggal bilang saja nanti bisa ditambahkan.

## Instal sebagai aplikasi (PWA)

Karena punya `manifest.json` dan Service Worker, aplikasi ini bisa
"diinstal" ke HP/laptop seperti aplikasi native:

- **Android (Chrome)**: menu ⋮ → "Add to Home screen" / "Install app"
- **iOS (Safari)**: tombol Share → "Add to Home Screen"
- **Desktop (Chrome/Edge)**: ikon install di address bar

Setelah diinstal, aplikasi bisa dibuka offline (halaman & tampilannya),
tapi tetap butuh koneksi saat pertama kali diakses untuk men-download
file-filenya.

## Struktur project

```
index.html    → shell utama + splash/login/signup
css/style.css → semua styling
js/db.js      → data layer (localStorage) — Bahan Baku, Mutasi Stok, Keuangan
js/app.js     → UI, navigasi, autentikasi (localStorage, password di-hash)
manifest.json → konfigurasi PWA (install ke homescreen)
sw.js         → Service Worker (offline & caching)
assets/       → logo
icons/        → ikon aplikasi berbagai ukuran
```

## Troubleshooting

- **Data hilang setelah update kode** → data localStorage terpisah dari
  file kode, jadi aman saat update file. Yang bisa menghapus data hanya
  tombol "Reset Semua Data" atau membersihkan cache browser secara manual.
- **Halaman blank / dropdown aneh setelah update** → coba hard refresh
  (Ctrl+Shift+R) atau unregister Service Worker lewat DevTools → Application
  → Service Workers → Unregister, karena versi lama mungkin masih di-cache.
- **Mau dipakai beberapa kasir/perangkat sekaligus dalam satu warung** →
  localStorage itu per-perangkat, jadi tiap perangkat akan punya data
  sendiri-sendiri (tidak saling terhubung). Untuk kebutuhan multi-perangkat
  yang datanya harus selalu sama, aplikasi ini perlu backend server lagi
  (database) — kalau nanti dibutuhkan, tinggal bilang saja.
