# Distributor ERP

Aplikasi web ERP distributor (Sales, Purchase, Inventory, Akuntansi/Laporan
Keuangan, Master Data) — React + Vite + Tailwind di front end, Supabase
(Postgres) sebagai database.

## Menjalankan secara lokal

**Prasyarat:** Node.js 18+

1. Install dependencies:
   ```
   npm install
   ```
2. (Opsional tapi disarankan) Siapkan Supabase — lihat bagian "Setup Supabase"
   di bawah. Tanpa ini, aplikasi tetap bisa dijalankan dan akan memakai data
   demo bawaan, tapi perubahan data **tidak akan tersimpan**.
3. Jalankan:
   ```
   npm run dev
   ```

## Setup Supabase (agar data benar-benar tersimpan)

1. Buat project baru di [supabase.com](https://supabase.com) (gratis untuk mulai).
2. Buka **SQL Editor** di dashboard Supabase, tempel seluruh isi file
   [`supabase/schema.sql`](./supabase/schema.sql), lalu jalankan (Run).
   Ini akan membuat 28 tabel (customers, products, sales_orders,
   purchase_orders, receivables, payables, dst).
3. Buka **Project Settings → API**, salin `Project URL` dan `anon public` key.
4. Copy `.env.example` menjadi `.env`, lalu isi:
   ```
   VITE_SUPABASE_URL="https://xxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```
5. (Opsional) Muat data contoh/demo ke database yang baru dibuat:
   ```
   SUPABASE_URL="https://xxxx.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="<service_role_key_dari_dashboard>" \
   npm run seed
   ```
   `service_role` key **hanya** untuk seeding sekali di terminal — jangan
   pernah dipakai di variabel `VITE_...` karena akan ikut ter-bundle ke
   browser.
6. Restart `npm run dev`. Status koneksi di pojok kanan bawah aplikasi akan
   berubah dari "Mode Lokal" menjadi "Supabase Connected".

### Catatan desain skema

Setiap entitas disimpan sebagai satu baris dengan kolom `data jsonb` yang
menyimpan objek lengkapnya (termasuk item, diskon, dsb persis seperti struktur
di `src/types/index.ts`). Ini dipilih supaya struktur data yang sudah ada di
aplikasi tidak perlu dipecah ke puluhan tabel relasi hanya untuk bisa
persist — trade-off-nya, laporan agregat tetap dihitung di sisi browser
seperti sekarang (bukan lewat query SQL). Kalau ke depannya volume data besar
atau butuh laporan lintas-aplikasi, tabel-tabel inti (products, sales_orders,
customers) adalah kandidat pertama untuk dinormalisasi ke kolom-kolom asli.

Row Level Security (RLS) sudah diaktifkan di semua tabel dengan policy
"allow all" karena aplikasi ini belum punya halaman login. **Sebelum
di-deploy untuk dipakai banyak orang**, tambahkan Supabase Auth dan perketat
policy tersebut (lihat komentar di `supabase/schema.sql`) — saat ini siapa
pun yang memegang anon key bisa baca/tulis semua data.

## Deploy

Build untuk production:
```
npm run build
```
Menghasilkan folder `dist/` (static site) yang bisa di-deploy ke Vercel,
Netlify, Cloudflare Pages, atau hosting static apa pun.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables yang wajib diisi di hosting:** `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` (sama seperti di `.env`)

## Struktur proyek

```
src/
  components/    UI per modul (sales, purchase, inventory, master, layout, dst)
  context/       AppContext.tsx — state global + persistence ke Supabase
  lib/           supabaseClient.ts, db.ts — koneksi & helper database
  data/          mockData.ts — data demo (dipakai kalau Supabase belum diset)
  types/         Definisi TypeScript untuk semua entitas
supabase/
  schema.sql     Skema database lengkap (jalankan sekali di SQL Editor)
scripts/
  seed.ts        Skrip opsional untuk mengisi data demo ke Supabase
```
