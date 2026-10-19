# patch-subscription.sql

SATU file untuk semuanya (langganan, batas, paket, promo). Jalankan SETELAH `schema.sql` dan
`patch-super-admin.sql`. Aman dijalankan berulang kali, kapan pun, termasuk di atas versi lama.
`patch-plans-promos.sql` sudah dilebur ke sini; jangan dipakai lagi.
Tempel ISI FILE .sql langsung ke Supabase SQL Editor (jangan dari tampilan markdown/chat).

## Isi
1. Katalog paket `subscription_plans`: Eksekutor, The Manager, The High Table, The Elder
   (batas pengguna/produk, harga bulanan). Ubah lewat SQL Editor; menjalankan ulang tidak menimpa.
2. Kolom di `organizations`: `plan`, `trial_ends_at`, `subscription_ends_at`.
3. Riwayat pembayaran manual: `subscription_payments`.
4. Batas pengguna aktif (trigger di `profiles`) dan produk (trigger di `products`).
5. Admin perusahaan tidak bisa mengubah paket/langganan/status sendiri.
6. `is_active_user()` / `is_admin()` menutup akses perusahaan yang langganannya habis.
7. Fungsi super admin: `sa_activate_subscription`, `sa_list_organizations`, `sa_list_subscription_payments`,
   `sa_platform_stats`, `sa_set_organization_status`.
8. Penjadwalan `pg_cron` (opsional, hanya bila ekstensi sudah aktif).

## Aturan masa aktif
- Perusahaan baru: trial 14 hari pada paket The Manager (ubah default kolom `plan` / `trial_ends_at`).
- Perusahaan yang sudah ada: trial 14 hari sejak patch dijalankan.
- Akses berakhir pada `coalesce(subscription_ends_at, trial_ends_at)`.
- Perpanjang saat masih berjalan: ditambah dari tanggal berakhir. Jika habis/trial: dihitung dari hari ini.
- Batas produk mengasumsikan tabel `public.products` dengan kolom `organization_id`
  (lihat `org_product_count` dan blok `do $$` pemasang trigger). Jika berbeda, sesuaikan.

## Paket yang bisa diedit dan promo (juga ada di patch-subscription.sql)

- Super admin bisa mengubah paket (nama, harga, batas pengguna/produk, badge, deskripsi) dari tab Paket.
- Tabel `promotions`: diskon persen atau nominal, bonus bulan gratis, per paket atau semua paket,
  minimal lama langganan, periode, kuota pemakaian. Dikelola dari tab Promo.
- Promo dipilih super admin di dialog "Aktifkan/Perpanjang Langganan". Diskon dan bonus bulan
  dihitung ulang di server (`sa_activate_subscription`), jadi angka dari browser tidak dipercaya.
  Pemakaian promo dicatat di riwayat pembayaran dan menambah `used_count`.
- Diskon nominal tidak pernah melebihi harga; bonus bulan memperpanjang masa aktif tanpa menambah tagihan.
