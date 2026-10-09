# Rajakas.ID ERP

ERP distributor berbasis **React + Vite + Tailwind** dengan **Supabase** sebagai
backend/database. Modul utama: Sales, Purchase, Inventory, Finance/Accounting,
Master Data, Documents, dan Reports.

## Status production

Aplikasi ini **memerlukan Supabase Authentication + database** untuk masuk dan
menggunakan ERP. Mode demo tanpa Supabase tidak lagi dianggap sebagai mode
operasional dan tidak didokumentasikan sebagai jalur production.

### 1. Install

Prasyarat: Node.js 18+.

```bash
npm install
```

### 2. Konfigurasi environment

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`VITE_SUPABASE_ANON_KEY`/publishable key boleh dipakai di browser. **Jangan**
pernah memasukkan `service_role` key ke variabel `VITE_*` atau ke source code.

### 3. Setup database Supabase

Gunakan **hanya satu sumber schema**, yaitu:

```text
supabase/schema.sql
```

Jalankan seluruh file tersebut di **Supabase Dashboard → SQL Editor**.

File `schema.sql` di root tidak digunakan dan telah dihapus. Jangan membuat
schema kedua di root; semua perubahan database harus masuk ke file ini.

Schema production:
- mengaktifkan RLS pada tabel aplikasi;
- hanya user yang masih `active` yang dapat membaca/menulis data;
- role `Admin` dapat mengelola master data dan menghapus data;
- role `User` dapat menjalankan transaksi operasional tetapi tidak dapat
  menghapus data/master;
- Finance dan Pengaturan Sistem dibatasi ke Admin pada UI;
- menjaga tabel jurnal agar tidak dapat dimodifikasi langsung oleh client;
- menyediakan RPC `post_journal_entry` untuk posting jurnal yang tervalidasi;
- mencatat HPP (5101) dan pengurangan Persediaan (1301) saat faktur penjualan
  diposting;
- menyimpan konfigurasi perusahaan di `system_settings`.

### Multi tenant (banyak perusahaan)

Satu project Supabase bisa melayani banyak perusahaan; data tiap perusahaan
terisolasi oleh RLS:

- tabel `organizations` menyimpan perusahaan (tenant) beserta kode undangan;
- `profiles` dan **semua** tabel data/jurnal memiliki `organization_id`;
  primary key tabel data adalah `(organization_id, id)` sehingga dua perusahaan
  boleh sama-sama punya id seperti `cust-1`;
- policy RLS mensyaratkan `organization_id = current_org_id()`; Admin hanya
  bisa mengelola profil di perusahaannya sendiri dan tidak bisa memindahkan
  user ke perusahaan lain;
- Chart of Accounts (`accounting_accounts`) adalah satu daftar standar yang
  dipakai bersama; jurnal (`journal_entries`) per perusahaan, nomor voucher
  unik per perusahaan;
- role dan perusahaan ditentukan **hanya oleh trigger database**, tidak dari
  metadata yang dikirim browser.

Alur pendaftaran (tombol **Daftar akun baru** di halaman login):

1. **Buat perusahaan baru** → perusahaan dibuat, pendaftar menjadi Admin aktif.
2. **Gabung dengan kode** → pendaftar menjadi `User` berstatus menunggu sampai
   Admin perusahaan itu mengaktifkannya di **Pengaturan → Akun Pengguna**.
   Kode undangan ada di halaman yang sama dan bisa dibuat ulang kapan saja.

Migrasi dari versi single-tenant: jalankan ulang `supabase/schema.sql`. Data
dan user lama otomatis dipindahkan ke perusahaan bernama **Perusahaan Utama**
(nama bisa diubah di tabel `organizations`).

Batasan yang perlu diketahui: satu akun hanya milik satu perusahaan; user
yang dibuat manual di dashboard Supabase tanpa mendaftar lewat aplikasi belum
punya perusahaan sampai `profiles.organization_id`-nya diisi.

### 4. Buat user aplikasi

Buka aplikasi lalu pilih **Daftar akun baru → Buat perusahaan baru**; akun
pertama itu menjadi Admin perusahaan Anda. Karyawan lain mendaftar dengan kode
undangan dan diaktifkan oleh Admin. (Membuat user lewat Supabase Dashboard
tetap bisa, tetapi akun itu belum punya perusahaan sampai Anda mengisinya.)
Field `role`/`active`/`organization_id` tidak bisa diubah dari browser kecuali
oleh Admin perusahaan yang sama.

### 5. Jalankan lokal

```bash
npm run dev
```

Buka alamat Vite yang ditampilkan di terminal (default port `3000`).

### 6. Build production

```bash
npm run lint
npm run build
```

Output:

```text
dist/
```

Deploy `dist` ke Vercel, Netlify, Cloudflare Pages, atau static hosting lain.

Environment variables yang wajib di hosting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Seed data (opsional)

Skrip `npm run seed` memerlukan service-role key dan hanya boleh dijalankan
dari lingkungan server/terminal terpercaya.

Contoh:

```bash
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
npm run seed
```

**Jangan** memasukkan service-role key ke `.env.local` dengan prefix `VITE_`
dan jangan commit key tersebut.

## Perilaku transaksi penting

- **Goods Receipt** menambah `products.stock` dan mencatat `stock_movements`.
- **Delivery Order** memvalidasi stok terlebih dahulu, lalu mengurangi
  `products.stock` dan mencatat pergerakan keluar. Stok tidak boleh negatif.
- **Sales Invoice** memposting Piutang/Penjualan/PPN sekaligus HPP ke akun
  `5101` dan kredit Persediaan `1301`. Nilai HPP memakai `buyPrice` produk.
- Nomor dokumen menggunakan urutan `PREFIX/YYYY/MM/0001` per browser/session
  storage. Untuk penggunaan lintas banyak user/cabang, migrasikan counter ke
  RPC PostgreSQL atomik sebelum penerbitan dokumen resmi berskala besar.
- Dashboard pertama pada database baru memang dapat kosong. Jalankan
  `npm run seed` dari terminal terpercaya atau masukkan master data manual.

## Struktur proyek

```text
src/
  components/    UI per modul
  context/       state global, auth, persistence
  lib/           Supabase, database, accounting, identifiers
  data/          data contoh yang dipakai sebagai state awal
  types/         definisi TypeScript
supabase/
  schema.sql     satu-satunya schema database yang dipakai
scripts/
  seed.ts        seed data opsional
```

## Production checklist

- [ ] Supabase project sudah dibuat.
- [ ] `supabase/schema.sql` sudah dijalankan.
- [ ] Supabase Authentication sudah aktif.
- [ ] User aplikasi sudah dibuat.
- [ ] `VITE_SUPABASE_URL` sudah diisi di hosting.
- [ ] `VITE_SUPABASE_ANON_KEY` sudah diisi di hosting.
- [ ] Tidak ada `service_role` key di client/browser.
- [ ] `npm ci` berhasil.
- [ ] `npm run lint` berhasil.
- [ ] `npm run build` berhasil.
- [ ] Login → transaksi → Finance → Reports diuji di environment production.

## Catatan keamanan

Public/anon Supabase key memang dapat berada di bundle browser. Keamanan data
bergantung pada **RLS**, bukan pada kerahasiaan anon key. Karena itu jangan
mengubah policy production menjadi `using (true)`/`with check (true)` tanpa
pembatasan role/tenant (`organization_id = current_org_id()`).

## Package manager

Proyek ini menggunakan **npm**. Gunakan `package-lock.json` dan jangan
mencampurkan Bun lockfile dengan proses CI/deployment.
