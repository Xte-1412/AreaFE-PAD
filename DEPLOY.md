# 🚀 Panduan Deployment - SIPELITA (Sistem Informasi Penilaian Nirwasita Tantra)

Dokumen ini menjelaskan prosedur instalasi, konfigurasi, jaringan, verifikasi, hingga rencana rollback untuk deployment aplikasi **SIPELITA** pada lingkungan VPS terdistribusi menggunakan **Docker**.

---

## 👥 1. Informasi Umum
* **Proyek:** SIPELITA (Sistem Informasi Manajemen Data Lingkungan Hidup)
* **Kelompok:** Kelompok 15 (Praktikum PSAIT)
* **Tim Penanggung Jawab:**
  1. Safira Dwita Ramadhani (Project Manager)
  2. Tito Alla Khairi (UI/UX)
  3. Muhammad Adib Naziri (Backend Developer)
  4. Hilarius Christiano Avin Paliling (Frontend Developer)

---

## 💻 2. Prasyarat Sistem (System Requirements)
* **Sistem Operasi:** Ubuntu 24.04 LTS (atau versi Linux modern lainnya)
* **Sumber Daya Minimum:**
  * RAM: 1 GB (Dilengkapi swap space minimal 1.5 GB untuk menampung build Next.js)
  * Disk Space: Minimal 5 GB ruang kosong
* **Perangkat Lunak:**
  * Docker Engine versi `>= 20.x`
  * Docker Compose versi `>= v2.x`
* **Status Port (Harus Bebas/Kosong):**
  * Port `3000` (Frontend)
  * Port `8000` (Backend API via Nginx container)

---

## 🔐 3. Konfigurasi Environment & Dependensi
Sebelum menjalankan container, pastikan konfigurasi environment sudah sesuai:

### A. Frontend (`.env.local`)
Buat file `.env.local` di dalam root `AreaFE-PAD` untuk build production:
```bash
NEXT_PUBLIC_API_URL=http://10.33.35.48:8000
```
*(Catatan: Sesuaikan IP dengan IP privat/lokal VPS target)*

### B. Backend (`.env`)
Buat file `.env` di dalam root `AreaBE-PAD`:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=http://10.33.35.48:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=sipelita_db
DB_USERNAME=sipelita_user
DB_PASSWORD=sipelita_password
```

---

## 🐳 4. Langkah-Langkah Deployment (Docker Compose)

Deployment dilakukan secara terpadu menggunakan Docker Compose dari root project (`~/AreaPAD`):

1. **Persiapan Folder di VPS:**
   ```bash
   mkdir -p ~/AreaPAD && cd ~/AreaPAD
   ```
2. **Clone & Pull Repositori:**
   Pastikan folder `AreaFE-PAD` dan `AreaBE-PAD` berada berdampingan di bawah folder `~/AreaPAD`.
3. **Menjalankan Container Build:**
   Eksekusi perintah berikut untuk membuild seluruh service (Frontend, Backend, Nginx, MySQL):
   ```bash
   sudo docker compose up -d --build
   ```
4. **Inisialisasi Aplikasi Backend (Pertama kali deploy):**
   * **Generate Application Key:**
     ```bash
     sudo docker compose exec backend php artisan key:generate
     ```
   * **Migrasi Database & Seeding Awal:**
     ```bash
     sudo docker compose exec backend php artisan migrate --seed
     ```
     *(Proses seed menggunakan `SimpleTestingDataSeeder` yang dioptimasi hanya memakan waktu ~2.9 detik)*
   * **Atur Permission Storage Laravel:**
     ```bash
     sudo docker compose exec backend chown -R www-data:www-data storage bootstrap/cache
     ```

---

## 🌐 5. Jaringan & Keamanan
* **CORS Whitelist:** Backend Laravel dikonfigurasi (`config/cors.php`) untuk mengizinkan request dari origin frontend di port `3000` (termasuk IP privat `10.33.35.48`).
* **Dynamic Base URL:** Axios pada frontend (`lib/axios.ts`) mendeteksi secara dinamis host browser. Jika diakses melalui IP numerik privat, request API otomatis diarahkan ke port `8000` pada host tersebut.
* **Firewall / Port Binding:** Pastikan port `3000` dan `8000` pada VPS tidak diblokir oleh UFW atau sistem keamanan kampus.

---

## ⏪ 6. Rencana Rollback (Rollback Plan)
Apabila deployment versi terbaru mengalami error fatal atau gagal dijalankan, ikuti langkah rollback berikut:

1. **Kembalikan Kode ke Commit Stabil Sebelumnya:**
   Masuk ke folder repositori yang bermasalah (misal `AreaFE-PAD` atau `AreaBE-PAD`) dan lakukan checkout ke tag/commit stabil terakhir:
   ```bash
   git checkout <commit_hash_stabil>
   ```
2. **Rebuild & Restart Container:**
   Kembali ke root project (`~/AreaPAD`) dan jalankan ulang build Docker Compose:
   ```bash
   sudo docker compose up -d --build
   ```
3. **Rollback Database (Jika skema database berubah):**
   Jika skema database telah bermigrasi dan tidak kompatibel dengan kode lama, jalankan rollback migrasi:
   ```bash
   sudo docker compose exec backend php artisan migrate:rollback
   ```

---

## 🧪 7. Tes Verifikasi (Verification Tests)
Untuk memastikan sistem telah berjalan dengan normal setelah deployment:

1. **Cek Status Container:**
   ```bash
   sudo docker compose ps
   ```
   *Pastikan seluruh container (`frontend`, `backend`, `webserver`, `db`) berstatus **Up (healthy)**.*
2. **Akses Browser:**
   Buka URL Frontend di browser: `http://10.33.35.48:3000`
3. **Uji Coba Fitur Login:**
   Lakukan login menggunakan akun demo berikut untuk memverifikasi integrasi API & Database:
   * **Role Admin:** `admin@test.com` (Password: `password`)
   * **Role Pusdatin:** `pusdatin@test.com` (Password: `password`)
   * **Role DLH Provinsi:** `dlh001@test.com` (Password: `password`)
