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
