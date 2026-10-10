# Catatan perbaikan menu Profil

## Yang diubah
| Berkas | Perubahan |
|---|---|
| `src/lib/auth.ts` | `changeMyPassword(current, new)` kini memverifikasi password saat ini lebih dulu, menolak password baru yang sama, dan membedakan "password salah" dari error jaringan. `updateMyFullName` memvalidasi nama dan memetakan kode error dari server. Ditambah `profileErrorCode()`. |
| `src/components/views/ProfileView.tsx` | Kolom "Password Saat Ini", tombol tampil/sembunyikan password, pesan error ikut bahasa aktif (ID/EN), pesan hilang saat mengetik, refresh profil yang gagal tidak lagi dilaporkan sebagai gagal simpan. |
| `src/i18n/translations.ts` | 26 kunci `profile.*` baru (Indonesia + Inggris). |
| `supabase/schema.sql` | `update_my_full_name` kini melempar `NAME_EMPTY` / `PROFILE_NOT_FOUND` / `NOT_AUTHENTICATED` (sebelumnya diam-diam tidak mengubah apa pun). Nama dibatasi 100 karakter di tabel (`profiles_full_name_len`), dan `handle_new_user` memotong nama pendaftar. |
| `supabase/patch-profil.sql` | **Baru.** Isi perubahan database di atas untuk database yang sudah berjalan. |
| `src/lib/auth.test.ts` | **Baru.** 11 tes untuk logika ganti nama dan ganti password. |

## Yang perlu Anda lakukan
1. Buka Supabase -> SQL Editor, jalankan `supabase/patch-profil.sql` (atau jalankan ulang `schema.sql` terbaru). Sekali saja, aman diulang.
2. Deploy frontend baru (`npm run build`).

Urutan penting: bila frontend baru dipakai sebelum patch SQL dijalankan, ganti nama tetap jalan seperti dulu, tetapi kegagalan "profil tidak ditemukan" belum terdeteksi.

## Belum disentuh (di luar menu Profil)
- Kode undangan perusahaan hanya 10 karakter hex dan `lookup_invite_code` terbuka untuk pengguna anon. Sebaiknya ditambah pembatasan percobaan atau kode lebih panjang.
- Opsional di dashboard Supabase: aktifkan "Secure password change" dan pertimbangkan kebijakan password yang lebih kuat.
