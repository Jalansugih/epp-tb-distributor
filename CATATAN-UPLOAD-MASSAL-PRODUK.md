# Upload Massal Katalog Produk

Lokasi: **Master Data > Katalog Produk > tombol "Upload Massal"**.

## Cara pakai
1. Klik **Unduh Template** (berisi nama kategori/merek/satuan/gudang Anda sebagai contoh).
2. Isi di Excel, lalu **Save As > CSV UTF-8**.
3. Klik **Pilih File CSV**, periksa hasil pratinjau, lalu **Impor**.

## Aturan
- Kolom wajib: Nama Produk, Kategori, Merek, Satuan. Kategori/Merek/Satuan/Gudang harus sudah ada di Master Data (huruf besar-kecil bebas).
- Kode Produk kosong -> dibuatkan otomatis (MAT-xxx, tidak bentrok). Barcode kosong -> dibuatkan otomatis.
- Kode sudah ada: pilih **Lewati** (aman, default) atau **Perbarui** (nama, kategori, merek, harga, stok minimum, berat, status; kolom kosong tidak mengubah data).
- **Stok tidak pernah diubah** untuk produk yang sudah ada. Stok Awal hanya berlaku untuk produk baru (masuk ke gudang yang dipilih, default gudang pertama).
- Satuan produk yang sudah ada tidak bisa diubah lewat upload (ubah lewat form edit).
- Baris Error tidak diimpor; perbaiki lalu upload ulang dengan aturan Lewati supaya tidak dobel. Ada tombol "Unduh daftar masalah".
- Maksimal 2000 baris dan 5 MB per file. Baris contoh (kode/nama diawali CONTOH) diabaikan.
- Angka: tulis polos (1500000). Format 1.500.000 dan 12,5 juga dikenali; "1,500" ditolak karena ambigu.

## Berkas yang berubah/baru
- baru: `src/utils/productImport.ts` (logika), `src/components/master/ProductImportModal.tsx` (tampilan), 2 file tes
- ubah: `ProductMaster.tsx` (tombol), `AppContext.tsx` (`importProducts`), `lib/db.ts` (`upsertRowsInChunks`), `vitest.config.ts`

Tidak ada perubahan database dan tidak ada library baru.
