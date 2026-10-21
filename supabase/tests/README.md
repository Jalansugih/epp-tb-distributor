# Uji SQL lokal (tanpa Supabase)

Dipakai untuk menguji RPC stok / moving average di PostgreSQL 16 biasa.

```bash
createdb t7
psql -d t7 -f supabase/tests/00-stub-supabase.sql      # stub auth.uid(), role anon/authenticated
for f in schema patch-security-integrity patch-subscription patch-plans-promos patch-super-admin patch-profil patch-audit-fixes; do
  psql -d t7 -f supabase/$f.sql          # beberapa error urutan di patch-subscription/super-admin bisa diabaikan
done
psql -d t7 -f supabase/tests/10-moving-average.sql      # harapan: p1 1100.00, p2 1300.00, p3 1033.33; setelah void: 1000.00 / 1300.00 (stok 0) / 1000.00
psql -d t7 -f supabase/tests/11-reversal-uses-po-cost.sql  # harapan: setelah reversal p1 kembali 1000.00 walau unitCost di dokumen GR dimanipulasi
psql -d t7 -f supabase/tests/20-invoice-cogs-server-cost.sql  # harapan: 5 NOTICE 'OK' (HPP palsu ditolak, biaya SJ dipakai, data lama fallback)
psql -d t7 -f supabase/tests/30-stock-reconciliation.sql  # harapan: OK A/B/C (alur resmi bersih; manipulasi stok terdeteksi)
psql -d t7 -f supabase/tests/40-duplicate-document-number.sql  # harapan: OK 1/2/3 (nomor SJ kembar ditolak utuh; replay idempoten)
```
Semua file bisa dijalankan berurutan di database yang sama.
