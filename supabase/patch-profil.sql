-- ============================================================================
-- PATCH: perbaikan menu Profil (jalankan SEKALI di Supabase -> SQL Editor
-- bila database sudah berjalan; aman dijalankan ulang). Isinya sama dengan
-- bagian terkait di schema.sql, jadi TIDAK perlu dijalankan kalau Anda
-- menjalankan ulang schema.sql terbaru.
-- ============================================================================

-- 1. Ganti nama: gagal dengan jelas (bukan "sukses palsu") bila nama kosong
--    atau profil tidak ditemukan.
create or replace function public.update_my_full_name(p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := left(trim(coalesce(p_full_name, '')), 100);
  v_rows integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if v_name = '' then
    raise exception 'NAME_EMPTY';
  end if;

  update public.profiles
     set full_name = v_name
   where id = auth.uid();
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
end;
$$;
revoke all on function public.update_my_full_name(text) from public, anon;
grant execute on function public.update_my_full_name(text) to authenticated;

-- 2. Batas panjang nama 100 karakter di level tabel.
update public.profiles set full_name = left(full_name, 100) where char_length(full_name) > 100;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_full_name_len' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_full_name_len check (char_length(full_name) <= 100);
  end if;
end $$;

-- 3. Pendaftaran baru: nama dari form dipotong 100 karakter agar tidak
--    melanggar constraint di atas.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_full_name text;
  v_org_name text;
  v_invite text;
  v_org_id uuid;
  v_role text := 'User';
  v_active boolean := false;
begin
  v_full_name := left(coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  ), 100);
  v_org_name := nullif(left(trim(coalesce(new.raw_user_meta_data->>'org_name', '')), 120), '');
  v_invite   := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'invite_code', ''))), '');

  if v_invite is not null then
    select id into v_org_id from public.organizations where invite_code = v_invite;
    if v_org_id is null then
      raise exception 'INVITE_CODE_INVALID';
    end if;
  elsif v_org_name is not null then
    insert into public.organizations (name) values (v_org_name) returning id into v_org_id;
    v_role := 'Admin';
    v_active := true;
  end if;

  insert into public.profiles (id, email, full_name, role, active, organization_id)
  values (new.id, coalesce(new.email, ''), v_full_name, v_role, v_active, v_org_id)
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;
