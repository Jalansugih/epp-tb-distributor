# Upload Massal Pelanggan Toko

Lokasi: **Master Data > Pelanggan Toko > tombol "Upload Massal"**. Cara kerjanya sama dengan upload produk (template CSV -> pratinjau -> impor).

## Kolom template
Kode Pelanggan, **Nama Toko***, **Grup***, Alamat, Kota, Telepon, Email, NPWP, Sales, Termin Pembayaran, Limit Kredit, Status.

## Aturan
- **Grup** harus salah satu dari: Toko Kelontong Bangunan / Sub-Distributor / Kontraktor / Project / Retail Modern.
- **Sales** dan **Termin Pembayaran** (nama atau kode) harus sudah ada di Master Data. Sales kosong = "Unassigned". Termin kosong = termin pertama di master. Keduanya diberi peringatan di pratinjau.
- **Kode kosong** -> dibuatkan otomatis (CUST-xxx). Jika nama + kota sudah ada, baris dianggap toko yang sama (dilewati/diperbarui), jadi upload ulang file yang sama tidak membuat data dobel.
- **Kode sudah ada**: pilih **Lewati** (default, aman) atau **Perbarui**. Perbarui hanya mengubah kolom yang diisi; kolom kosong tidak mengubah data. **Piutang berjalan (usedCredit / outstandingAR) tidak pernah diubah.** Piutang awal sengaja tidak ada di template; masukkan lewat proses saldo awal agar sesuai jurnal.
- Peringatan (tidak memblokir): nomor telepon sama dengan pelanggan lain, nama + kota mirip pelanggan lain.
- Angka 0 di depan nomor telepon yang hilang karena Excel (mis. 8123... -> 08123...) diperbaiki otomatis dan diberi catatan. Tetap disarankan memformat kolom Telepon sebagai Text.
- Maksimal 2000 baris dan 5 MB per file. Baris contoh (diawali CONTOH) diabaikan.

## Perbaikan tambahan di menu Pelanggan Toko (ditemukan saat mengerjakan fitur ini)
1. **Filter Status tidak pernah cocok**: pilihan "Aktif/Non-Aktif" memakai nilai `Active/Inactive` padahal data tersimpan `active/suspended`, sehingga hasil filter selalu kosong. Sudah diperbaiki.
2. **Edit pelanggan menghapus Email, NPWP, tipe, dan tanggal dibuat** karena objek disusun ulang hanya dari kolom yang tampil di form. Sekarang data lama dipertahankan.
3. **Grup kosong untuk pelanggan baru**: form menampilkan "Toko Kelontong Bangunan" tetapi nilai yang disimpan kosong jika tidak diubah. Sekarang bawaannya terisi.
4. Daftar grup dipakai bersama (satu konstanta) oleh form, filter, dan upload massal.

## Perubahan pada upload produk
Baris tanpa Kode Produk kini dicocokkan dengan produk yang namanya sama persis (supaya upload ulang tidak dobel). Dua baris tanpa kode dengan nama sama dalam satu file ditandai Error.

## Berkas
- baru: `src/utils/csvImport.ts` (parser CSV/angka bersama), `src/utils/customerImport.ts`, `src/components/master/BulkImportModal.tsx` (jendela umum), `CustomerImportModal.tsx`, tes
- ubah: `ProductImportModal.tsx` (kini memakai jendela umum), `CustomerMaster.tsx`, `AppContext.tsx` (`importCustomers`), `productImport.ts`, `vitest.config.ts`
- devDependencies baru (hanya untuk tes): jsdom, @testing-library/react, @testing-library/dom. Tidak ada perubahan database dan tidak ada library baru untuk aplikasi.
