# Aplikasi bisa di-install & jalan offline (PWA)

## Cara install
- **Chrome/Edge desktop**: ikon "Instal" di address bar, atau titik 3 → *Instal Rajakas.ID*. Atau tombol **Instal Aplikasi** di bawah sidebar.
- **Android (Chrome)**: titik 3 → *Instal aplikasi* / *Tambahkan ke layar utama*.
- **iPhone/iPad (Safari)**: Bagikan → *Tambah ke Layar Utama*.
PWA hanya jalan di **HTTPS** (Vercel sudah HTTPS) atau localhost.

## Saat internet putus
- Aplikasi tetap terbuka (semua halaman di-cache oleh service worker).
- Data terakhir yang pernah dimuat tetap tampil (cache IndexedDB di perangkat).
- Perubahan (tambah/ubah/hapus data, jurnal otomatis) disimpan di antrean perangkat, banner kuning tampil, dan **dikirim otomatis berurutan** ke Supabase begitu online (juga saat app dibuka lagi).
- Login terakhir diingat, jadi tidak perlu internet untuk membuka app.

## Batasan yang perlu diketahui
- Login pertama kali & daftar akun **wajib online**.
- Konflik: jika dua perangkat mengubah data yang sama saat offline, yang dikirim terakhir menang (sama seperti perilaku online).
- Perubahan yang ditolak server (mis. aturan RLS) tidak memblokir antrean. Perubahan itu **tetap disimpan di perangkat**; banner merah menampilkan pesannya dengan tombol **Kirim ulang** dan **Hapus**.
- Logout menghapus cache data dari perangkat; antrean yang belum terkirim tetap disimpan sampai login perusahaan yang sama.
- Stok & nomor dokumen dihitung di perangkat; kalau 2 perangkat membuat dokumen offline bersamaan, cek ulang nomor/stok setelah sinkron.

## File terkait
`vite.config.ts` (vite-plugin-pwa), `src/lib/offline.ts` (cache + antrean), `src/lib/db.ts`, `src/lib/accounting.ts`, `src/context/AuthContext.tsx`, `src/hooks/useOffline.ts`, `src/components/common/OfflineBanner.tsx`, `public/icons/*` (ikon sementara huruf "R" — ganti dengan logo asli, ukuran 192/512/maskable 512).


## Deploy
- Salin `.env.example` → isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (di Vercel: Settings → Environment Variables).
- `vercel.json` sudah mengatur header agar `sw.js` selalu fresh dan aset ber-hash di-cache lama.
- Jalankan `supabase/schema.sql` dan `supabase/patch-profil.sql` di Supabase SQL Editor sebelum dipakai.
