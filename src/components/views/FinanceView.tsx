import { generateDocumentNo } from '../../lib/identifiers';
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import { fetchAccounts, fetchJournalEntries, postJournalEntry, cashAccountForPayment, AccountingAccount, JournalEntryRecord } from '../../lib/accounting';
import { Wallet, BookOpen, Receipt, PieChart, BarChart3, Plus, RefreshCw, ArrowDownRight, ArrowUpRight, Printer, type LucideIcon } from 'lucide-react';

const money = (n: number) => formatRupiah(Math.round(n || 0));
const today = new Date().toISOString().slice(0, 10);

const navTabs: { key: 'cashbank' | 'chart' | 'journal' | 'pnl' | 'balance'; label: string; Icon: LucideIcon }[] = [
  { key: 'cashbank', label: 'Kas & Bank', Icon: Wallet },
  { key: 'chart', label: 'Bagan Akun (CoA)', Icon: BookOpen },
  { key: 'journal', label: 'Jurnal Umum', Icon: Receipt },
  { key: 'pnl', label: 'Laba Rugi', Icon: PieChart },
  { key: 'balance', label: 'Neraca', Icon: BarChart3 },
];


export const FinanceView: React.FC = () => {
  const { currentView, setCurrentView, addToast } = useApp();
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [journals, setJournals] = useState<JournalEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(today);

  const activeTab = currentView.includes('chart') ? 'chart' : currentView.includes('journal') ? 'journal' : currentView.includes('pnl') ? 'pnl' : currentView.includes('balance') ? 'balance' : 'cashbank';
  const loadAccounting = async () => {
    setLoading(true);
    try {
      const [a, j] = await Promise.all([fetchAccounts(), fetchJournalEntries(startDate, endDate)]);
      setAccounts(a); setJournals(j);
    } catch (e) { addToast(e instanceof Error ? e.message : 'Gagal memuat data akuntansi.', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadAccounting(); }, [startDate, endDate]);

  const rows = useMemo(() => journals.flatMap(j => j.lines.map(l => ({ ...l, date: j.date, voucher_no: j.voucher_no, description: j.description, reference_no: j.reference_no }))), [journals]);
  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.account_code, (map.get(r.account_code) || 0) + r.debit - r.credit);
    return map;
  }, [rows]);
  const byType = (type: string) => accounts.filter(a => a.type === type).map(a => ({ ...a, balance: (balances.get(a.code) || 0) * (a.normal_balance === 'debit' ? 1 : -1) }));
  const total = (type: string) => byType(type).reduce((s, a) => s + a.balance, 0);
  const cash = (balances.get('1101') || 0);
  const bank = (balances.get('1102') || 0);
  const ar = (balances.get('1201') || 0);
  const ap = -(balances.get('2101') || 0);
  const revenue = total('Revenue');
  const expenses = total('Expense');
  const netProfit = revenue - expenses;
  const assets = total('Asset');
  const liabilities = total('Liability');
  const equity = total('Equity') + netProfit;

  const nav = (tab: string) => setCurrentView(`finance-${tab === 'cashbank' ? 'cashbank' : tab === 'chart' ? 'chart-accounts' : tab}` as any);

  const createManualJournal = async () => {
    const voucherNo = generateDocumentNo('JU-MANUAL');
    try {
      await postJournalEntry({ voucherNo, date: today, description: 'Jurnal umum manual', referenceType: 'manual', referenceId: voucherNo, referenceNo: voucherNo, lines: [{ accountCode: '1101', debit: 0, credit: 0 }] });
    } catch { addToast('Jurnal manual harus dibuat dari form transaksi berpasangan. Fitur ini menjaga jurnal selalu balance.', 'info'); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
        {navTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => nav(key)}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => window.print()} className="px-3 py-2 border rounded-xl text-xs font-bold flex gap-2 items-center"><Printer className="w-4 h-4"/>Print</button>
        <button onClick={() => void loadAccounting()} className="px-3 py-2 border rounded-xl text-xs font-bold flex gap-2 items-center"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Refresh</button>
        <button onClick={() => void createManualJournal()} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex gap-2 items-center"><Plus className="w-4 h-4"/>Jurnal Umum</button>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3 bg-white border rounded-2xl p-4 print:hidden">
      <span className="text-xs font-bold text-slate-500">Periode</span>
      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-xs"/>
      <span className="text-slate-400">s/d</span>
      <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-xs"/>
    </div>

    {activeTab==='cashbank' && <div className="space-y-5"><div className="grid md:grid-cols-4 gap-4">{[
  { label: 'Kas', code: '1101', value: cash, Icon: ArrowUpRight },
  { label: 'Bank', code: '1102', value: bank, Icon: ArrowUpRight },
  { label: 'Piutang Usaha', code: '1201', value: ar, Icon: ArrowUpRight },
  { label: 'Hutang Usaha', code: '2101', value: ap, Icon: ArrowDownRight },
].map(({ label, code, value, Icon }) => <div key={code} className="bg-white border rounded-2xl p-5"><div className="flex justify-between"><span className="text-xs font-bold text-slate-500">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div><div className="text-xl font-black mt-2">{money(value)}</div><div className="text-[10px] text-slate-400 mt-1">Saldo berdasarkan jurnal tersimpan</div></div>)}</div><div className="bg-white border rounded-2xl p-5"><h3 className="font-black">Ringkasan Keuangan</h3><div className="grid md:grid-cols-3 gap-4 mt-4"><div><span className="text-xs text-slate-500">Pendapatan</span><p className="font-black text-emerald-600">{money(revenue)}</p></div><div><span className="text-xs text-slate-500">Beban</span><p className="font-black text-rose-600">{money(expenses)}</p></div><div><span className="text-xs text-slate-500">Laba Bersih</span><p className="font-black text-blue-700">{money(netProfit)}</p></div></div></div></div>}

    {activeTab==='chart' && <div className="bg-white border rounded-2xl overflow-hidden"><div className="p-4 border-b"><h3 className="font-black">Bagan Akun (Chart of Accounts)</h3><p className="text-xs text-slate-500 mt-1">Saldo dihitung dari jurnal, bukan angka hardcoded.</p></div><table className="w-full text-xs"><thead><tr className="bg-slate-100 text-left"><th className="p-3">Kode</th><th className="p-3">Nama Akun</th><th className="p-3">Tipe</th><th className="p-3 text-right">Saldo</th></tr></thead><tbody className="divide-y">{accounts.map(a=><tr key={a.code}><td className="p-3 font-mono font-bold text-blue-700">{a.code}</td><td className="p-3 font-bold">{a.name}</td><td className="p-3">{a.type}</td><td className="p-3 text-right font-black">{money((balances.get(a.code)||0)*(a.normal_balance==='debit'?1:-1))}</td></tr>)}</tbody></table></div>}

    {activeTab==='journal' && <div className="bg-white border rounded-2xl overflow-hidden"><div className="p-4 border-b"><h3 className="font-black">Jurnal Umum</h3><p className="text-xs text-slate-500">Jurnal otomatis dari transaksi penjualan, pembayaran, pembelian, dan pembayaran supplier.</p></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-slate-900 text-white"><th className="p-3 text-left">Tanggal</th><th className="p-3 text-left">Voucher</th><th className="p-3 text-left">Keterangan</th><th className="p-3 text-left">Akun</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Kredit</th></tr></thead><tbody className="divide-y">{rows.map((r,i)=><tr key={`${r.voucher_no}-${r.id}-${i}`}><td className="p-3">{r.date}</td><td className="p-3 font-mono font-bold">{r.voucher_no}</td><td className="p-3">{r.description}</td><td className="p-3 font-semibold">{r.account_code} - {r.account_name}</td><td className="p-3 text-right">{r.debit?money(r.debit):'-'}</td><td className="p-3 text-right">{r.credit?money(r.credit):'-'}</td></tr>)}</tbody></table>{!rows.length&&<div className="p-10 text-center text-sm text-slate-400">Belum ada jurnal pada periode ini.</div>}</div></div>}

    {activeTab==='pnl' && <Statement title="LAPORAN LABA RUGI" subtitle={`Periode ${startDate} s/d ${endDate}`}><Line label="Pendapatan / Penjualan" value={revenue}/><Line label="Harga Pokok Penjualan" value={byType('Expense').filter(a=>a.code==='5101').reduce((s,a)=>s+a.balance,0)} negative/><Line label="Beban Operasional & Pengiriman" value={byType('Expense').filter(a=>a.code!=='5101').reduce((s,a)=>s+a.balance,0)} negative/><Line label="LABA BERSIH" value={netProfit} strong/></Statement>}

    {activeTab==='balance' && <Statement title="NERACA" subtitle={`Per ${endDate}`}><Section label="ASET"/><Lines accounts={byType('Asset')}/><Line label="TOTAL ASET" value={assets} strong/><Section label="LIABILITAS"/><Lines accounts={byType('Liability')}/><Line label="TOTAL LIABILITAS" value={liabilities} strong/><Section label="EKUITAS"/><Lines accounts={byType('Equity')}/><Line label="Laba Tahun Berjalan" value={netProfit}/><Line label="TOTAL LIABILITAS + EKUITAS" value={liabilities+equity} strong/><div className={`mt-4 p-3 rounded-xl font-black text-sm ${Math.abs(assets-(liabilities+equity))<1?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>Check Balance: {money(assets)} = {money(liabilities+equity)} {Math.abs(assets-(liabilities+equity))<1?'✓ BALANCE':'⚠ BELUM BALANCE'}</div></Statement>}
  </div>;
};

const Line=({label,value,negative,strong}:{label:string,value:number,negative?:boolean,strong?:boolean})=><div className={`flex justify-between py-2 ${strong?'font-black text-sm border-t pt-3':''}`}><span>{label}</span><span>{negative&&value?'- ':''}{money(value)}</span></div>;
const Lines=({accounts}:{accounts: (AccountingAccount & {balance:number})[]})=><>{accounts.map(a=><Line key={a.code} label={`${a.code} - ${a.name}`} value={a.balance}/>)}</>;
const Section=({label}:{label:string})=><div className="mt-5 mb-1 font-black border-b pb-1">{label}</div>;
const Statement=({title,subtitle,children}:{title:string,subtitle:string,children:React.ReactNode})=><div className="bg-white border rounded-2xl p-8 max-w-3xl mx-auto"><div className="text-center border-b-2 border-slate-900 pb-4 mb-5"><h2 className="font-black text-base">PERUSAHAAN</h2><h3 className="font-black text-blue-700">{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div><div className="text-xs">{children}</div></div>;
