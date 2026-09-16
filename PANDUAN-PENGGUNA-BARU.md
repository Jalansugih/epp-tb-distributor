# Panduan Mulai Pakai — Rajakas.ID ERP

Aplikasi ini sudah dibersihkan dari seluruh data contoh (pelanggan, supplier,
produk, transaksi, saldo, dsb). Semua tabel, dashboard, dan laporan akan
tampil kosong/nol sampai Anda mengisi data asli perusahaan Anda sendiri.

Ikuti urutan di bawah ini — **data master harus diisi dulu sebelum transaksi**,
karena form transaksi (Sales Order, PO, dst.) mengambil pilihannya dari data
master tersebut.

## -1. Menjadikan Akun Anda Admin (wajib untuk akun pertama)

Aplikasi ini butuh Supabase Authentication, dan role `Admin` **tidak bisa**
diberikan sendiri lewat aplikasi — harus diatur manual sekali saja lewat
Supabase Dashboard:

1. Buka https://supabase.com/dashboard, login dengan akun yang dipakai untuk
   membuat project Supabase aplikasi ini.
2. Pilih project Anda → menu **Authentication → Users**. Pastikan akun email
   Anda sudah terdaftar di sana (kalau belum, buat dulu dari sini).
3. Pindah ke menu **Table Editor → tabel `profiles`**. Cari baris dengan
   email Anda.
4. Edit kolom `role` menjadi `Admin` (huruf besar di awal), dan pastikan
   kolom `active` bernilai `true`.
5. Logout lalu login lagi di aplikasi. Menu **Finance**, **Settings**, dan
   semua tombol hapus data kini akan muncul.

Kalau baris profil Anda belum ada di tabel `profiles`, jalankan SQL berikut
di **SQL Editor** Supabase (ganti email sesuai akun Anda):

```sql
update public.profiles
set role = 'Admin', active = true
where email = 'email_anda@perusahaan.com';
```

## 0. Pengaturan Perusahaan

Buka menu **Settings**, isi:
- Nama perusahaan
- Alamat
- NPWP
- Tarif pajak (default 11%, sesuaikan bila perlu)

Data ini otomatis muncul di kop semua dokumen cetak (PO, Invoice, Surat
Jalan, dll).

## 1. Data Master Dasar

Isi dulu master yang jadi acuan pilihan di form lain:

| Menu | Isi dengan |
|---|---|
| Satuan (UOM) | Pcs, Box, Sak, Karung, dst — sesuai satuan barang Anda |
| Kategori Produk | Kategori barang yang Anda jual |
| Brand | Merek barang yang Anda distribusikan |
| Gudang | Lokasi gudang/stok Anda (minimal 1) |
| Termin Pembayaran | Mis. COD, Net 30, Net 45 |
| Salesperson | Tim sales Anda |

## 2. Master Produk, Pelanggan & Supplier

- **Produk**: kode, nama, kategori, brand, satuan, harga beli/jual, stok awal,
  stok minimum — semua field kini kosong secara default, jadi isi manual
  sesuai data barang Anda (tidak ada lagi harga/stok contoh yang terisi
  otomatis).
- **Pelanggan**: kode, nama toko, grup, kota, salesperson, termin, limit
  kredit.
- **Supplier**: kode, nama, kategori, kota, kontak, termin pembayaran.

## 3. Mulai Transaksi

Setelah master lengkap, alur transaksi normal:

**Sisi Penjualan:** Quotation → Sales Order → Surat Jalan (Delivery) →
Invoice → Payment

**Sisi Pembelian:** Purchase Request → Purchase Order → Goods Receipt →
Purchase Invoice → Supplier Payment

Dashboard, grafik penjualan, aging piutang/hutang, dan laporan keuangan
semuanya dihitung otomatis dari dokumen yang Anda buat di sini — tidak ada
lagi angka yang di-hardcode, jadi akan mulai dari nol dan terisi seiring
transaksi berjalan.

## 4. Kalau Pakai Supabase (mode production)

Ikuti `README.md` untuk setup Supabase seperti biasa. Karena data contoh
sudah dikosongkan di `src/data/mockData.ts`, script `npm run seed` sekarang
tidak akan mengisi apa pun (aman dijalankan atau dilewati) — database Anda
akan mulai benar-benar kosong, sesuai isi tabel yang Anda buat sendiri lewat
aplikasi.

## 5. Menghapus Semua Data (Reset ke Nol)

Kalau Dashboard atau menu lain masih menampilkan angka/data padahal Anda
ingin mulai benar-benar dari nol (misalnya sisa data uji coba), gunakan:

**Settings → tab "Kelola Data" → Hapus Semua Data** (hanya muncul untuk akun
Admin — lihat bagian -1 di atas kalau menu Settings belum kelihatan). Ketik
konfirmasi yang diminta, lalu semua data master & transaksi di database akan
dihapus permanen dan Dashboard kembali ke nol. Profil perusahaan dan akun
login tidak ikut terhapus.

## Yang Perlu Dicek Sendiri Setelah Ini

Kami sudah audit dan bersihkan angka/teks contoh yang kami temukan (dashboard,
dokumen cetak, form tambah data, timeline aktivitas, dll). Karena basis
kodenya besar, sebaiknya tetap lakukan uji-coba manual singkat sebelum rilis:
buka tiap modul dengan akun baru/kosong, isi 1 data dummy Anda sendiri per
modul, dan pastikan tidak ada nama/angka yang terasa "asing" muncul begitu
saja.
