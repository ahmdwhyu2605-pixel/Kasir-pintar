# Kasir Pintar — proyek awal

Kasir Pintar adalah fondasi aplikasi POS multi-toko (web/PWA) dengan paket gratis dan premium.

## Isi proyek
- `index.html`, `app.css`, `app.js`: antarmuka kasir awal yang responsif untuk HP.
- `manifest.webmanifest`, `service-worker.js`: fondasi PWA agar bisa ditambahkan ke layar utama Android.
- `supabase/schema.sql`: skema database awal, fungsi pembuatan profil toko, dan kebijakan RLS.
- `supabase/config.example.js`: contoh konfigurasi frontend (bukan tempat menyimpan service-role key).
- `SETUP.md`: langkah pemasangan.

## Status
Ini **belum menjadi layanan online yang sudah terpasang**. Aplikasi perlu proyek Supabase, URL dan anon/publishable key, lalu di-deploy ke hosting. Koneksi login dan sinkronisasi cloud belum diaktifkan di frontend pada versi awal ini. Data demo disimpan lokal di browser perangkat.

## Fitur demo saat ini
- Ringkasan penjualan sederhana.
- Daftar produk, stok, tambah produk.
- Keranjang dan transaksi demo.
- Pencatatan pemasukan/pengeluaran.
- PWA dasar.

## Batasan penting
- Jangan gunakan untuk pembukuan resmi sebelum pengujian menyeluruh.
- QRIS hanya dapat dicatat sebagai metode pembayaran; ini bukan integrasi pembayaran otomatis.
- Jangan menaruh password, Supabase service-role key, atau secret lain di frontend.
- Kebijakan SQL adalah fondasi awal dan perlu diuji sebelum digunakan dengan data nyata.
