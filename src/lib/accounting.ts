import { supabase } from './supabaseClient';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface AccountingAccount {
  code: string;
  name: string;
  type: AccountType;
  normal_balance: 'debit' | 'credit';
  is_active: boolean;
}

export interface JournalLine {
  id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface JournalEntryRecord {
  id: string;
  voucher_no: string;
  date: string;
  description: string;
  reference_type?: string | null;
  reference_id?: string | null;
  reference_no?: string | null;
  lines: JournalLine[];
}

export interface JournalPostingLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export async function postJournalEntry(input: {
  voucherNo: string;
  date: string;
  description: string;
  referenceType: string;
  referenceId: string;
  referenceNo: string;
  lines: JournalPostingLine[];
}) {
  if (!supabase) return;
  const { error } = await supabase.rpc('post_journal_entry', {
    p_voucher_no: input.voucherNo,
    p_date: input.date,
    p_description: input.description,
    p_reference_type: input.referenceType,
    p_reference_id: input.referenceId,
    p_reference_no: input.referenceNo,
    p_lines: input.lines,
  });
  if (error) throw error;
}

export async function fetchAccounts(): Promise<AccountingAccount[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('accounting_accounts')
    .select('code,name,type,normal_balance,is_active')
    .eq('is_active', true)
    .order('code');
  if (error) throw error;
  return (data ?? []) as AccountingAccount[];
}

export async function fetchJournalEntries(startDate?: string, endDate?: string): Promise<JournalEntryRecord[]> {
  if (!supabase) return [];
  let query = supabase
    .from('journal_entries')
    .select('id,voucher_no,date,description,reference_type,reference_id,reference_no,journal_lines(id,account_code,account_name,debit,credit)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    lines: row.journal_lines ?? [],
  })) as JournalEntryRecord[];
}

export function cashAccountForPayment(method: string) {
  return ['Tunai', 'Cash'].includes(method) ? '1101' : '1102';
}
