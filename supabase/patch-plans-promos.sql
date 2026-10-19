create table if not exists public.promotions (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,
  name           text not null,
  discount_type  text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value bigint not null default 0 check (discount_value >= 0),
  bonus_months   int not null default 0 check (bonus_months between 0 and 12),
  plan           text references public.subscription_plans(code) on delete cascade,
  min_months     int not null default 1 check (min_months between 1 and 36),
  starts_at      timestamptz,
  ends_at        timestamptz,
  max_uses       int check (max_uses is null or max_uses > 0),
  used_count     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint promotions_percent_chk check (discount_type <> 'percent' or discount_value <= 100),
  constraint promotions_effect_chk check (discount_value > 0 or bonus_months > 0),
  constraint promotions_dates_chk check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create unique index if not exists promotions_code_uidx on public.promotions (upper(code));
alter table public.promotions enable row level security;
revoke all on public.promotions from anon, authenticated;

alter table public.subscription_payments add column if not exists promo_id uuid references public.promotions(id) on delete set null;
alter table public.subscription_payments add column if not exists promo_code text;
alter table public.subscription_payments add column if not exists discount bigint not null default 0;
alter table public.subscription_payments add column if not exists bonus_months int not null default 0;

create or replace function public.sa_update_plan(
  p_code         text,
  p_name         text,
  p_max_users    int,
  p_max_products int,
  p_price        bigint,
  p_badge        text default null,
  p_description  text default null
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
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'INVALID_NAME';
  end if;
  if (p_max_users is not null and p_max_users < 1) or (p_max_products is not null and p_max_products < 1) then
    raise exception 'INVALID_LIMIT';
  end if;
  if p_price is null or p_price < 0 then
    raise exception 'INVALID_PRICE';
  end if;
  update public.subscription_plans
     set name = left(trim(p_name), 60),
         max_users = p_max_users,
         max_products = p_max_products,
         price_monthly = p_price,
         badge = nullif(left(trim(coalesce(p_badge, '')), 40), ''),
         description = nullif(left(trim(coalesce(p_description, '')), 300), '')
   where code = p_code;
  if not found then
    raise exception 'PLAN_NOT_FOUND';
  end if;
end $$;

create or replace function public.sa_list_promotions()
returns table (
  id uuid,
  code text,
  name text,
  discount_type text,
  discount_value bigint,
  bonus_months int,
  plan text,
  plan_name text,
  min_months int,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int,
  active boolean,
  created_at timestamptz
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
  select p.id, p.code, p.name, p.discount_type, p.discount_value, p.bonus_months,
         p.plan, pl.name, p.min_months, p.starts_at, p.ends_at, p.max_uses,
         p.used_count, p.active, p.created_at
    from public.promotions p
    left join public.subscription_plans pl on pl.code = p.plan
   order by p.created_at desc;
end $$;

create or replace function public.sa_save_promotion(
  p_id             uuid,
  p_code           text,
  p_name           text,
  p_discount_type  text,
  p_discount_value bigint,
  p_bonus_months   int,
  p_plan           text,
  p_min_months     int,
  p_starts_at      timestamptz,
  p_ends_at        timestamptz,
  p_max_uses       int,
  p_active         boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_id   uuid;
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9_-]{3,30}$' then
    raise exception 'INVALID_PROMO_CODE';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'INVALID_NAME';
  end if;
  if p_discount_type not in ('percent', 'fixed')
     or coalesce(p_discount_value, 0) < 0
     or (p_discount_type = 'percent' and coalesce(p_discount_value, 0) > 100) then
    raise exception 'INVALID_DISCOUNT';
  end if;
  if coalesce(p_discount_value, 0) = 0 and coalesce(p_bonus_months, 0) = 0 then
    raise exception 'PROMO_NO_EFFECT';
  end if;
  if coalesce(p_bonus_months, 0) not between 0 and 12 or coalesce(p_min_months, 1) not between 1 and 36 then
    raise exception 'INVALID_DISCOUNT';
  end if;
  if p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'INVALID_PROMO_DATES';
  end if;
  if p_max_uses is not null and p_max_uses < 1 then
    raise exception 'INVALID_DISCOUNT';
  end if;
  if p_plan is not null and not exists (select 1 from public.subscription_plans where code = p_plan) then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  begin
    if p_id is null then
      insert into public.promotions
        (code, name, discount_type, discount_value, bonus_months, plan, min_months, starts_at, ends_at, max_uses, active)
      values
        (v_code, left(trim(p_name), 80), p_discount_type, coalesce(p_discount_value, 0), coalesce(p_bonus_months, 0),
         p_plan, coalesce(p_min_months, 1), p_starts_at, p_ends_at, p_max_uses, coalesce(p_active, true))
      returning id into v_id;
    else
      update public.promotions
         set code = v_code,
             name = left(trim(p_name), 80),
             discount_type = p_discount_type,
             discount_value = coalesce(p_discount_value, 0),
             bonus_months = coalesce(p_bonus_months, 0),
             plan = p_plan,
             min_months = coalesce(p_min_months, 1),
             starts_at = p_starts_at,
             ends_at = p_ends_at,
             max_uses = p_max_uses,
             active = coalesce(p_active, true),
             updated_at = now()
       where id = p_id
       returning id into v_id;
      if v_id is null then
        raise exception 'PROMO_NOT_FOUND';
      end if;
    end if;
  exception when unique_violation then
    raise exception 'PROMO_CODE_EXISTS';
  end;
  return v_id;
end $$;

drop function if exists public.sa_activate_subscription(uuid, text, int, bigint, text);
create or replace function public.sa_activate_subscription(
  p_org    uuid,
  p_plan   text,
  p_months int,
  p_amount bigint default null,
  p_note   text default null,
  p_promo  uuid default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org      public.organizations%rowtype;
  v_plan     public.subscription_plans%rowtype;
  v_promo    public.promotions%rowtype;
  v_base     timestamptz;
  v_end      timestamptz;
  v_users    bigint;
  v_products bigint;
  v_subtotal bigint;
  v_discount bigint := 0;
  v_bonus    int := 0;
begin
  if not public.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'INVALID_MONTHS';
  end if;
  if p_amount is not null and p_amount < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_plan from public.subscription_plans where code = p_plan;
  if not found then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  select * into v_org from public.organizations where id = p_org for update;
  if not found then
    raise exception 'ORG_NOT_FOUND';
  end if;

  select count(*) into v_users from public.profiles where organization_id = p_org and active;
  if v_plan.max_users is not null and v_users > v_plan.max_users then
    raise exception 'USAGE_EXCEEDS_PLAN: % pengguna aktif melebihi batas % milik paket %', v_users, v_plan.max_users, v_plan.name;
  end if;
  v_products := public.org_product_count(p_org);
  if v_plan.max_products is not null and v_products > v_plan.max_products then
    raise exception 'USAGE_EXCEEDS_PLAN: % produk melebihi batas % milik paket %', v_products, v_plan.max_products, v_plan.name;
  end if;

  v_subtotal := v_plan.price_monthly * p_months;

  if p_promo is not null then
    select * into v_promo from public.promotions where id = p_promo for update;
    if not found then
      raise exception 'PROMO_NOT_FOUND';
    end if;
    if not v_promo.active then
      raise exception 'PROMO_INACTIVE';
    end if;
    if (v_promo.starts_at is not null and v_promo.starts_at > now())
       or (v_promo.ends_at is not null and v_promo.ends_at <= now()) then
      raise exception 'PROMO_NOT_VALID_NOW';
    end if;
    if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
      raise exception 'PROMO_QUOTA_REACHED';
    end if;
    if v_promo.plan is not null and v_promo.plan <> p_plan then
      raise exception 'PROMO_PLAN_MISMATCH';
    end if;
    if p_months < v_promo.min_months then
      raise exception 'PROMO_MIN_MONTHS';
    end if;
    v_discount := case v_promo.discount_type
                    when 'percent' then round(v_subtotal * v_promo.discount_value / 100.0)::bigint
                    else least(v_promo.discount_value, v_subtotal)
                  end;
    v_bonus := v_promo.bonus_months;
    update public.promotions set used_count = used_count + 1, updated_at = now() where id = p_promo;
  end if;

  v_base := case
              when v_org.subscription_ends_at is not null and v_org.subscription_ends_at > now()
              then v_org.subscription_ends_at
              else now()
            end;
  v_end := v_base + make_interval(months => p_months + v_bonus);

  update public.organizations
     set plan = p_plan,
         subscription_ends_at = v_end,
         status = 'active',
         suspended_at = null,
         suspended_reason = null,
         updated_at = now()
   where id = p_org;

  insert into public.subscription_payments
    (organization_id, plan, months, amount, note, period_start, period_end, created_by,
     promo_id, promo_code, discount, bonus_months)
  values
    (p_org, p_plan, p_months, p_amount, nullif(left(trim(coalesce(p_note, '')), 300), ''), v_base, v_end, auth.uid(),
     p_promo, case when p_promo is not null then v_promo.code end, v_discount, v_bonus);

  return v_end;
end $$;

drop function if exists public.sa_list_subscription_payments(uuid);
create function public.sa_list_subscription_payments(p_org uuid)
returns table (
  id uuid,
  plan text,
  plan_name text,
  months int,
  amount bigint,
  note text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz,
  created_by_email text,
  promo_code text,
  discount bigint,
  bonus_months int
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
  select sp.id, sp.plan, pl.name, sp.months, sp.amount, sp.note,
         sp.period_start, sp.period_end, sp.created_at, u.email::text,
         sp.promo_code, sp.discount, sp.bonus_months
    from public.subscription_payments sp
    join public.subscription_plans pl on pl.code = sp.plan
    left join auth.users u on u.id = sp.created_by
   where sp.organization_id = p_org
   order by sp.created_at desc
   limit 20;
end $$;

revoke all on function public.sa_update_plan(text, text, int, int, bigint, text, text) from public, anon;
revoke all on function public.sa_list_promotions() from public, anon;
revoke all on function public.sa_save_promotion(uuid, text, text, text, bigint, int, text, int, timestamptz, timestamptz, int, boolean) from public, anon;
revoke all on function public.sa_activate_subscription(uuid, text, int, bigint, text, uuid) from public, anon;
revoke all on function public.sa_list_subscription_payments(uuid) from public, anon;
grant execute on function public.sa_update_plan(text, text, int, int, bigint, text, text) to authenticated;
grant execute on function public.sa_list_promotions() to authenticated;
grant execute on function public.sa_save_promotion(uuid, text, text, text, bigint, int, text, int, timestamptz, timestamptz, int, boolean) to authenticated;
grant execute on function public.sa_activate_subscription(uuid, text, int, bigint, text, uuid) to authenticated;
grant execute on function public.sa_list_subscription_payments(uuid) to authenticated;
