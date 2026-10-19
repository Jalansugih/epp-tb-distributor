-- Security/integrity patch for existing Supabase projects.
-- Back up the database and apply in Supabase SQL Editor or staging first.

create or replace function public.post_journal_entry(
  p_voucher_no text,
  p_date date,
  p_description text,
  p_reference_type text,
  p_reference_id text,
  p_reference_no text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_total_debit numeric(18,2);
  v_total_credit numeric(18,2);
  v_line jsonb;
  v_account public.accounting_accounts%rowtype;
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not public.is_active_user() then
    raise exception 'USER_NOT_ACTIVE';
  end if;

  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'JURNAL_LINES_HARUS_ARRAY';
  end if;
  if jsonb_array_length(p_lines) < 2 then
    raise exception 'JURNAL_MINIMAL_2_BARIS';
  end if;
  if jsonb_array_length(p_lines) > 500 then
    raise exception 'JURNAL_TERLALU_BANYAK_BARIS';
  end if;

  -- Validate every line before totaling or writing anything. Totals alone do
  -- not prevent negative values or a line carrying both debit and credit.
  for v_line in select value from jsonb_array_elements(p_lines) as lines(value) loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'JURNAL_BARIS_TIDAK_VALID';
    end if;
    if nullif(trim(coalesce(v_line->>'accountCode', '')), '') is null then
      raise exception 'KODE_AKUN_WAJIB';
    end if;
    if nullif(v_line->>'debit', '') is not null
      and (v_line->>'debit') !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'JURNAL_NOMINAL_DEBIT_TIDAK_VALID';
    end if;
    if nullif(v_line->>'credit', '') is not null
      and (v_line->>'credit') !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'JURNAL_NOMINAL_KREDIT_TIDAK_VALID';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) < 0
      or coalesce((nullif(v_line->>'credit', '')::numeric), 0) < 0 then
      raise exception 'JURNAL_NOMINAL_TIDAK_BOLEH_NEGATIF';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) > 0
      and coalesce((nullif(v_line->>'credit', '')::numeric), 0) > 0 then
      raise exception 'JURNAL_SATU_BARIS_TIDAK_BOLEH_DEBIT_DAN_KREDIT';
    end if;
    if coalesce((nullif(v_line->>'debit', '')::numeric), 0) = 0
      and coalesce((nullif(v_line->>'credit', '')::numeric), 0) = 0 then
      raise exception 'JURNAL_NOMINAL_BARIS_HARUS_POSITIF';
    end if;
  end loop;

  select coalesce(sum(coalesce(nullif(x->>'debit', '')::numeric, 0)),0),
         coalesce(sum(coalesce(nullif(x->>'credit', '')::numeric, 0)),0)
  into v_total_debit, v_total_credit
  from jsonb_array_elements(p_lines) x;

  if v_total_debit <= 0 or round(v_total_debit,2) <> round(v_total_credit,2) then
    raise exception 'JURNAL_TIDAK_BALANCE: debit %, credit %', v_total_debit, v_total_credit;
  end if;

  select id into v_entry_id from public.journal_entries
  where organization_id = v_org
    and reference_type = p_reference_type and reference_id = p_reference_id;
  if v_entry_id is not null then
    return v_entry_id;
  end if;

  insert into public.journal_entries
    (organization_id,voucher_no,date,description,reference_type,reference_id,reference_no,created_by)
  values
    (v_org,p_voucher_no,p_date,p_description,p_reference_type,p_reference_id,p_reference_no,auth.uid())
  returning id into v_entry_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_account from public.accounting_accounts
    where code = v_line->>'accountCode' and is_active = true;

    if not found then
      raise exception 'AKUN_TIDAK_DITEMUKAN: %', v_line->>'accountCode';
    end if;

    insert into public.journal_lines
      (journal_entry_id,account_code,account_name,debit,credit)
    values (
      v_entry_id,
      v_account.code,
      v_account.name,
      coalesce((v_line->>'debit')::numeric,0),
      coalesce((v_line->>'credit')::numeric,0)
    );
  end loop;

  return v_entry_id;
exception when unique_violation then
  select id into v_entry_id from public.journal_entries
  where organization_id = v_org
    and reference_type = p_reference_type and reference_id = p_reference_id;
  if v_entry_id is not null then return v_entry_id; end if;
  raise;
end;
$$;

revoke all on function public.post_journal_entry(text,date,text,text,text,text,jsonb) from public, anon;
grant execute on function public.post_journal_entry(text,date,text,text,text,text,jsonb) to authenticated;
