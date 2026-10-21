# Catatan audit lanjutan

Diperbaiki (diuji di PostgreSQL 16 lokal dengan stub Supabase; lint, 148 test, build lulus):

1. Stok User ditolak RLS / saling menimpa -> RPC `adjust_product_stock` (delta, lock baris, tolak stok negatif, idempoten per `ref`). Klien: `applyStockChanges()` di `src/lib/db.ts`, dipakai Surat Jalan, Goods Receipt, Penyesuaian stok.
2. `post_journal_entry`: Admin bebas; non-Admin hanya jurnal otomatis yang COCOK dengan dokumen sumber yang sudah tersimpan (fungsi `validate_auto_journal`): faktur jual (piutang, penjualan, PPN, HPP dihitung ulang dari qty x buyPrice), pembayaran (kas/bank vs 1201, total bayar <= faktur), faktur beli, bayar supplier. Toleransi Rp 1. Klien menunggu dokumen tersimpan sebelum mengirim jurnal (`postAutoJournal(input, after)`).
3. Penomoran: counter localStorage kini per organisasi; ada RPC `next_document_no` + `nextDocumentNo()`; unique index kode dokumen per organisasi sebagai jaring pengaman.
4. `schema.sql` tidak lagi menimpa `is_active_user()/is_admin()`; `patch-audit-fixes.sql` menegakkan versi final.
5. Admin terakhir tidak bisa dinonaktifkan/diturunkan (kecuali oleh super admin).

Belum dikerjakan: 20+ pemanggil `generateDocumentNo` belum dialihkan ke `nextDocumentNo()` (perlu refactor async); admin yang mengedit baris produk masih bisa menimpa stok dengan nilai lama; rate limit signup / lookup kode undangan (atur di Supabase Auth: captcha + rate limit); tombol jurnal manual di FinanceView masih stub; `npm audit fix` untuk source-map-js.

## Tambahan
- `npm audit fix`: temuan high `source-map-js` selesai (package-lock.json berubah). Sisa 3 temuan hanya di devDependency vitest/tinypool (test runner, tidak ikut bundle produksi); butuh upgrade major vitest 5, ditunda.
- Tombol "Jurnal Umum" di FinanceView dihapus: dulu hanya mengirim jurnal debit 0 / kredit 0 yang selalu ditolak server.

## Catatan validasi jurnal
- Jurnal dibuat dari data yang dikirim klien lalu DIVALIDASI server; dokumen dan jurnal belum satu transaksi atomik. Bila jurnal ditolak, dokumen tetap tersimpan dan klien menampilkan toast galat.
- HPP memakai buyPrice produk SAAT jurnal diposting. Bila Admin mengubah harga beli antara faktur dibuat dan jurnal terkirim (mis. antrean offline), jurnal ditolak `JURNAL_TIDAK_SESUAI_DOKUMEN` dan perlu ditinjau Admin.
- Pembayaran supplier belum dicek terhadap sisa hutang di server.

## Perbaikan poin 5-7 (audit lanjutan 2)
**Poin 5 (overselling SO)** - sudah benar di kode: cek stok di `NewOrderModal` + RPC `create_sales_order_with_stock_check`. Yang diperbaiki hanya test yang basi (mock `salesOrders`, ekspektasi reserved Submitted, mock `lib/db`, test async) dan ditambah 4 test stok.

**Poin 6 (minStock)** - `|| 50` sudah hilang; semua layar memakai `getStockStatus`. Diperbaiki: produk habis (stok 0) tidak lagi hilang dari KPI/daftar stok menipis (`needsRestock`, label "Habis"); `weightKg || 40` dan "PPN 11%" yang ditulis mati diganti data asli / `taxRate`.

**Poin 7 (valuasi & HPP)**
- Saat stok habis karena retur/void GR, harga beli terakhir dipertahankan (sebelumnya jadi 0), di klien dan SQL.
- Biaya rata-rata dibulatkan 2 desimal; `cogsAmount` dibulatkan rupiah penuh.
- Reversal GR di server memakai biaya dari PO tersimpan (sama dengan saat penerimaan), bukan `unitCost` dari dokumen GR yang ditulis klien.
- `PurchaseOrderModal`: fallback harga 50.000 dan diskon bawaan (8% + Rp 500, 5%, 5%) dihapus karena masuk ke harga pokok; PO yang dikirim wajib harga > 0.
- Laporan Laba Rugi: baris "Net Profit" (sama dengan laba kotor, beban ditulis Rp 0) diganti "LABA KOTOR" + catatan beban operasional belum dicatat.
- Test baru: moving average, reversal, COGS, status stok. SQL diuji di PostgreSQL 16 (`supabase/tests/`).

**HPP faktur tidak lagi ditentukan klien (butir 1, selesai)**
- `stock_change_log` punya kolom baru `unit_cost`. Saat Surat Jalan keluar, `adjust_product_stock` (server) mencatat biaya rata-rata produk di database pada saat itu.
- `validate_auto_journal` (faktur penjualan) menghitung HPP dari catatan itu: rata-rata tertimbang per produk dari Surat Jalan SO yang sama (SJ berstatus Returned tidak dihitung). `cogsAmount` dari klien hanya diterima kalau selisihnya <= max(Rp 1 x jumlah baris, 0,5%); selebihnya jurnal ditolak dengan `JURNAL_HPP_TIDAK_SESUAI_PENGIRIMAN`. Kalau `cogsAmount` kosong, server memakai biaya pengiriman.
- Data lama (SO yang SJ-nya dibuat sebelum patch ini, tanpa `unit_cost`) tetap memakai perilaku lama (percaya `unitCost`/`cogsAmount` dokumen). Itu satu-satunya celah yang tersisa dan hanya untuk data historis.
- Batas 0,5% sengaja ada: harga rata-rata di cache perangkat bisa sedikit tertinggal. Kalau terlalu sering menolak faktur sah, longgarkan/ketatkan angka itu di `validate_auto_journal`.
- Diuji di PostgreSQL 16: `supabase/tests/20-invoice-cogs-server-cost.sql` (5 skenario). Patch lama meloloskan HPP palsu; patch baru menolaknya.

## Poin 8 - kartu stok & rekonsiliasi
Sudah benar di kode: server menulis `stock_movements` dalam transaksi yang sama dengan perubahan stok (`adjust_product_stock`, transfer, reversal, saldo awal); `balance` dihitung server per gudang; baris produk yang sama dalam satu dokumen digabung jadi satu kartu stok.
Diperbaiki / ditambah:
- **`fetchTable` tidak paginasi** -> Supabase memotong hasil di 1.000 baris, jadi kartu stok yang lebih dari itu terpotong diam-diam dan panel rekonsiliasi di layar memberi selisih palsu. Sekarang membaca halaman demi halaman (urutan stabil `created_at desc, id`). Test: `src/lib/db.fetchTable.test.ts`.
- **RPC `stock_reconciliation()`** (SQL, di akhir `patch-audit-fixes.sql`): membandingkan stok produk dengan jumlah kartu stok, dihitung di database: total, per gudang, dan konsistensi total vs alokasi gudang. Tombol **"Cek di server"** di panel Rekonsiliasi (Stok > Kartu Stok). Test: `supabase/tests/30-stock-reconciliation.sql`.

## Poin 9 - idempotensi & nomor dokumen
Sudah benar di kode: semua dokumen transaksi (SO, SQ, SJ, INV, PAY, PO, GR, PINV, SPAY, ADJ, TRF) memakai `nextDocumentNo()` (atomik di server); counter lokal tinggal untuk kode master (DISC/PL/SP/WH) dan fallback offline (diberi sufiks acak `-OFF-xxxx`). Ref stok memakai id dokumen (UUID), bukan nomor, jadi nomor kembar tidak lagi membuat pengurangan stok "ditelan". SJ dengan nomor kembar ditolak utuh oleh server (uji: `supabase/tests/40-duplicate-document-number.sql`); replay payload yang sama idempoten.
Celah yang masih ada dan diperbaiki: **Goods Receipt dan Penyesuaian Stok** mengubah stok di layar lebih dulu, lalu disimpan di belakang. Kalau server menolak (nomor kembar dari perangkat lain, RLS, validasi), layar tetap menampilkan stok yang sudah berubah sampai reload. Sekarang `onStockSaveRejected` memuat ulang products, kartu stok, GR, penyesuaian, dan PO dari server lalu menampilkan pesan jelas. Test: `src/context/AppContext.stockRollback.test.tsx` (gagal bila handler lama dipakai).

