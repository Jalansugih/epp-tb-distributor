-- ============================================================================
-- SUPER ADMIN (pemilik platform)
-- ============================================================================
-- Jalankan SETELAH schema.sql (aman dijalankan ulang).
--
-- Super admin BUKAN role di dalam sebuah perusahaan. Ia terdaftar di tabel
-- platform_admins yang hanya bisa diubah lewat SQL Editor (tidak ada akses dari
-- aplikasi), sehingga tidak ada pengguna yang bisa menaikkan dirinya sendiri.
--
-- Semua data super admin diambil lewat fungsi sa_* (SECURITY DEFINER) yang
-- selalu memeriksa is_super_admin() lebih dulu. Policy RLS data perusahaan
-- tidak diubah: super admin hanya melihat DAFTAR perusahaan/pengguna, bukan
-- isi transaksi (penjualan, stok, keuangan) milik perusahaan.

-- 1) Status perusahaan ------------------------------------------------------
alter table public.organizations add column if not exists status text not null default 'active';
alter table public.organizations add column if not exists suspended_at timestamptz;
alter table public.organizations add column if not exists suspended_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_status_chk' and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_status_chk check (status in ('active', 'suspended'));
  end if;
end $$;

-- 2) Daftar super admin -----------------------------------------------------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
-- Sengaja tanpa policy: tidak ada akses dari aplikasi, hanya SQL Editor.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- 3) Perusahaan yang ditangguhkan kehilangan akses di level database --------
-- is_active_user()/is_admin() dipakai semua policy RLS, jadi cukup diubah di sini.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.organizations o on o.id = p.organization_id
    where p.id = auth.uid() and p.active = true and o.status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.organizations o on o.id = p.organization_id
    where p.id = auth.uid() and p.active = true and o.status = 'active' and lower(p.role) = 'admin'
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- 4) Info akses untuk pengguna yang sedang login ----------------------------
create or replace function public.my_access_info()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'is_super_admin', public.is_super_admin(),
    'organization_status', coalesce(
      (select o.status from public.organizations o
        join public.profiles p on p.organization_id = o.id
        where p.id = auth.uid()),
      'active')
  );
$$;

revoke all on function public.my_access_info() from public, anon;
grant execute on function public.my_access_info() to authenticated;

-- 5) Fungsi khusus super admin ----------------------------------------------
create or replace function public.sa_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'orgs_total',      (select count(*) from public.organizations),
    'orgs_active',     (select count(*) from public.organizations where status = 'active'),
    'orgs_suspended',  (select count(*) from public.organizations where status = 'suspended'),
    'orgs_new_7d',     (select count(*) from public.organizations where created_at >= now() - interval '7 days'),
    'orgs_new_30d',    (select count(*) from public.organizations where created_at >= now() - interval '30 days'),
    'users_total',     (select count(*) from public.profiles),
    'users_pending',   (select count(*) from public.profiles where active = false and organization_id is not null)
  );
end $$;

create or replace function public.sa_list_organizations()
returns table (
  org_id uuid,
  org_name text,
  org_status text,
  suspended_reason text,
  created_at timestamptz,
  user_count bigint,
  active_user_count bigint,
  admin_name text,
  admin_email text,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
  select
    o.id,
    o.name,
    o.status,
    o.suspended_reason,
    o.created_at,
    (select count(*) from public.profiles p where p.organization_id = o.id),
    (select count(*) from public.profiles p where p.organization_id = o.id and p.active),
    (select p.full_name from public.profiles p
       where p.organization_id = o.id and lower(p.role) = 'admin'
       order by p.created_at limit 1),
    (select p.email from public.profiles p
       where p.organization_id = o.id and lower(p.role) = 'admin'
       order by p.created_at limit 1),
    (select max(u.last_sign_in_at) from public.profiles p
       join auth.users u on u.id = p.id
       where p.organization_id = o.id)
  from public.organizations o
  order by o.created_at desc;
end $$;

create or replace function public.sa_list_users(p_org uuid default null)
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  active boolean,
  org_id uuid,
  org_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.active,
    p.organization_id,
    o.name,
    p.created_at,
    u.last_sign_in_at
  from public.profiles p
  left join public.organizations o on o.id = p.organization_id
  left join auth.users u on u.id = p.id
  where p_org is null or p.organization_id = p_org
  order by p.created_at desc;
end $$;

create or replace function public.sa_set_organization_status(
  p_org uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'INVALID_STATUS';
  end if;
  update public.organizations
     set status = p_status,
         suspended_at = case when p_status = 'suspended' then now() else null end,
         suspended_reason = case when p_status = 'suspended' then nullif(left(trim(coalesce(p_reason, '')), 300), '') else null end,
         updated_at = now()
   where id = p_org;
  if not found then
    raise exception 'ORG_NOT_FOUND';
  end if;
end $$;

create or replace function public.sa_set_user_active(p_user uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_user = auth.uid() and p_active = false then
    raise exception 'CANNOT_DEACTIVATE_SELF';
  end if;
  update public.profiles set active = p_active, updated_at = now() where id = p_user;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;
end $$;

revoke all on function public.sa_platform_stats() from public, anon;
revoke all on function public.sa_list_organizations() from public, anon;
revoke all on function public.sa_list_users(uuid) from public, anon;
revoke all on function public.sa_set_organization_status(uuid, text, text) from public, anon;
revoke all on function public.sa_set_user_active(uuid, boolean) from public, anon;
grant execute on function public.sa_platform_stats() to authenticated;
grant execute on function public.sa_list_organizations() to authenticated;
grant execute on function public.sa_list_users(uuid) to authenticated;
grant execute on function public.sa_set_organization_status(uuid, text, text) to authenticated;
grant execute on function public.sa_set_user_active(uuid, boolean) to authenticated;

-- 6) JADIKAN AKUN ANDA SUPER ADMIN -------------------------------------------
-- Daftar dulu seperti biasa lewat aplikasi, lalu jalankan SATU baris ini di
-- SQL Editor (ganti emailnya), TANPA tanda komentar:
--
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'email-anda@contoh.com'
--   on conflict do nothing;
