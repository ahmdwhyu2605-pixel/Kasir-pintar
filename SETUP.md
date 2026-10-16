# Cara menyiapkan Kasir Pintar dari HP Android

## 1. Buat proyek Supabase
1. Buka https://supabase.com/dashboard
2. Buat akun/proyek baru dan simpan password proyek dengan aman.
3. Buka **SQL Editor**.
4. Buka file `supabase/schema.sql`, salin seluruh isinya, tempel di SQL Editor, lalu jalankan.
5. Di **Project Settings → API**, salin Project URL dan publishable/anon key. Jangan pernah menyalin `service_role` key ke frontend.

## 2. Mengaktifkan koneksi cloud
Versi proyek yang diberikan sekarang adalah fondasi UI dan database; koneksi login/cloud perlu diintegrasikan setelah proyek Supabase milikmu dibuat. Jangan memasukkan kredensial ke chat. Gunakan konfigurasi lokal saat menyiapkan aplikasi.

## 3. Hosting web/PWA
1. Unggah file proyek ke repositori GitHub milikmu (bisa lewat browser HP).
2. Hubungkan repositori ke Cloudflare Pages.
3. Build command: kosongkan.
4. Build output directory: `/` atau direktori root proyek.
5. Setelah deploy, buka URL HTTPS dari HP Android.
6. Dari menu Chrome, pilih **Tambahkan ke layar utama** atau **Install app** jika tersedia.

## 4. Akun admin pusat
Jangan membuat akun admin hanya berdasarkan email yang dikirim dari frontend. Setelah pengguna mendaftar dan terverifikasi, set `profiles.role = 'owner_admin'` secara aman melalui SQL Editor sebagai pemilik proyek. Jangan membagikan akses dashboard Supabase kepada pengguna toko.

## 5. Sebelum rilis
- Uji dengan data palsu.
- Uji akses antar-toko dan RLS.
- Tambahkan alur lupa password, verifikasi email, pembatasan paket, logging, ekspor/backup, dan mekanisme pembayaran premium.
- Gunakan penyedia pembayaran resmi untuk transaksi premium/QRIS. Jangan menganggap pencatatan QRIS di kasir sebagai pemrosesan pembayaran.
