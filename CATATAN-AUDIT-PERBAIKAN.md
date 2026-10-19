# Catatan Audit dan Perbaikan — Distributor ERP

## Perubahan pada paket ini

1. `supabase/schema.sql`: `post_journal_entry()` sekarang menolak input `p_lines` yang bukan array, jurnal kurang dari 2 baris atau lebih dari 500 baris, baris non-object, kode akun kosong, nominal negatif, satu baris yang mengisi debit dan kredit sekaligus, serta baris dengan debit dan kredit sama-sama nol.
2. `supabase/patch-security-integrity.sql`: migrasi untuk menerapkan perbaikan validasi jurnal pada database Supabase yang sudah berjalan.
3. `src/components/common/OnboardingModal.tsx`: tur diperjelas sebagai **Interactive Product Tour** dan menambahkan panduan langkah Inventory dan Pembelian beserta CTA untuk membuka modul terkait.

## Langkah penerapan

- Buat backup database Supabase sebelum menjalankan SQL.
- Jika database sudah berjalan, buka Supabase SQL Editor dan jalankan `supabase/patch-security-integrity.sql`.
- Jangan pernah memasukkan `service_role` key ke variabel `VITE_*`; hanya anon/publishable key yang boleh ada di frontend.
- Setelah dependency terpasang dari `package-lock.json`, jalankan `npm test`, `npm run lint`, dan `npm run build`.

## Status verifikasi dalam lingkungan audit

- Arsip ZIP berhasil diekstrak dan file sumber diperiksa.
- Instalasi dependency tidak selesai karena cache offline tidak memiliki paket `yallist`; lingkungan juga memakai Node `22.16.0`, sedangkan beberapa dependency dalam lockfile meminta Node `22.22.2` atau lebih baru. Karena itu `vitest` tidak bisa dijalankan, dan test suite, lint TypeScript penuh, serta build produksi belum dapat dinyatakan lulus di sini. Gunakan Node `22.22.2+` lalu jalankan `npm ci`, `npm test`, `npm run lint`, dan `npm run build` di lingkungan yang dapat mengakses registry npm.
- SQL patch belum dieksekusi terhadap database Supabase nyata; jalankan di staging/backup terlebih dahulu.

Perubahan ini memperkuat validasi, tetapi bukan pengganti pengujian integrasi/penetrasi pada database dan deployment aktif.
