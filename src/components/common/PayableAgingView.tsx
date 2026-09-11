import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Building2,
  Wallet,
  ArrowUpRight,
  Printer
} from 'lucide-react';

interface PayableAgingViewProps {
  onOpenPaymentModal: (payable?: any) => void;
}

export const PayableAgingView: React.FC<PayableAgingViewProps> = ({ onOpenPaymentModal }) => {
  const { payables, suppliers, openDocModal } = useApp();

  // Helper to categorize aging bucket based on dueDate vs today
  const calculateAgingBucket = (dueDateStr: string, remainingAmount: number) => {
    if (remainingAmount <= 0) return 'Paid';
    const today = new Date('2026-08-12').getTime();
    const due = new Date(dueDateStr).getTime();
    const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Current';
    if (diffDays <= 30) return '1–30 Days';
    if (diffDays <= 60) return '31–60 Days';
    if (diffDays <= 90) return '61–90 Days';
    return '90+ Days';
  };

  // Compute bucket sums across all payables
  let currentSum = 0;
  let days1to30Sum = 0;
  let days31to60Sum = 0;
  let days61to90Sum = 0;
  let days90PlusSum = 0;

  payables.forEach((ap) => {
    const rem = ap.remainingAmount ?? ap.outstanding ?? (ap.amount - ap.paidAmount);
    if (rem <= 0) return;

    const bucket = ap.agingBucket || calculateAgingBucket(ap.dueDate, rem);

    if (bucket === 'Current') currentSum += rem;
    else if (bucket === '1–30 Days' || bucket.includes('1-30')) days1to30Sum += rem;
    else if (bucket === '31–60 Days' || bucket.includes('31-60')) days31to60Sum += rem;
    else if (bucket === '61–90 Days' || bucket.includes('61-90')) days61to90Sum += rem;
    else if (bucket === '90+ Days' || bucket.includes('>60') || bucket.includes('90')) days90PlusSum += rem;
  });

  const totalOutstanding = currentSum + days1to30Sum + days31to60Sum + days61to90Sum + days90PlusSum;

  const chartData = [
    { name: 'Current (Lancar)', amount: currentSum, color: '#10b981' },
    { name: '1–30 Hari', amount: days1to30Sum, color: '#f59e0b' },
    { name: '31–60 Hari', amount: days31to60Sum, color: '#f97316' },
    { name: '61–90 Hari', amount: days61to90Sum, color: '#ef4444' },
    { name: '90+ Hari', amount: days90PlusSum, color: '#b91c1c' }
  ];

  // Group by Supplier
  const supplierAgingMap: { [key: string]: { current: number; d1_30: number; d31_60: number; d61_90: number; d90: number; total: number } } = {};

  payables.forEach((ap) => {
    const rem = ap.remainingAmount ?? ap.outstanding ?? (ap.amount - ap.paidAmount);
    if (rem <= 0) return;

    const supName = ap.supplierName || 'Pabrik Supplier';
    if (!supplierAgingMap[supName]) {
      supplierAgingMap[supName] = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90: 0, total: 0 };
    }

    const bucket = ap.agingBucket || calculateAgingBucket(ap.dueDate, rem);

    if (bucket === 'Current') supplierAgingMap[supName].current += rem;
    else if (bucket === '1–30 Days' || bucket.includes('1-30')) supplierAgingMap[supName].d1_30 += rem;
    else if (bucket === '31–60 Days' || bucket.includes('31-60')) supplierAgingMap[supName].d31_60 += rem;
    else if (bucket === '61–90 Days' || bucket.includes('61-90')) supplierAgingMap[supName].d61_90 += rem;
    else supplierAgingMap[supName].d90 += rem;

    supplierAgingMap[supName].total += rem;
  });

  const supplierAgingRows = Object.keys(supplierAgingMap).map((supName) => ({
    supplierName: supName,
    ...supplierAgingMap[supName]
  }));

  return (
    <div className="space-y-6">
      {/* Top Aging Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Outstanding AP
          </span>
          <p className="text-base font-black text-white">{formatRupiah(totalOutstanding)}</p>
          <span className="text-[10px] text-blue-300 font-medium">Hutang Ke Principal</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 block mb-1">Current (Lancar)</span>
          <p className="text-sm font-black text-slate-900">{formatRupiah(currentSum)}</p>
          <span className="text-[10px] text-slate-500 font-medium">Belum jatuh tempo</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 block mb-1">1–30 Hari</span>
          <p className="text-sm font-black text-amber-900">{formatRupiah(days1to30Sum)}</p>
          <span className="text-[10px] text-amber-700 font-medium">Jatuh tempo minggu ini</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-orange-200 shadow-2xs">
          <span className="text-[10px] font-bold text-orange-700 block mb-1">31–60 Hari</span>
          <p className="text-sm font-black text-orange-900">{formatRupiah(days31to60Sum)}</p>
          <span className="text-[10px] text-orange-700 font-medium">Overdue 1 bulan</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 block mb-1">61–90 Hari</span>
          <p className="text-sm font-black text-rose-900">{formatRupiah(days61to90Sum)}</p>
          <span className="text-[10px] text-rose-700 font-medium">Kategori Kritis</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-300 shadow-2xs">
          <span className="text-[10px] font-bold text-red-800 block mb-1">90+ Hari</span>
          <p className="text-sm font-black text-red-900">{formatRupiah(days90PlusSum)}</p>
          <span className="text-[10px] text-red-700 font-bold">Macet / Restrukturisasi</span>
        </div>
      </div>

      {/* Visual Recharts Bar Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Visual Distribusi Umur Hutang Usaha (Payable Aging Chart)</h3>
            <p className="text-xs text-slate-500">Analisis statistik hutang per periode jatuh tempo untuk perencanaan arus kas</p>
          </div>
          <button
            onClick={() => openDocModal('PAYABLE AGING REPORT', 'Laporan Rekap Umur Hutang', chartData)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Cetak Laporan AP Aging
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
              <YAxis
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <Tooltip
                formatter={(value: any) => [formatRupiah(Number(value)), 'Jumlah Hutang']}
                contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplier Aging Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Tabel Rincian Umur Hutang Per Supplier / Principal</h3>
          <span className="text-xs text-slate-500 font-semibold">{supplierAgingRows.length} Supplier Aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Nama Supplier / Principal</th>
                <th className="p-3 text-right">Current</th>
                <th className="p-3 text-right">1–30 Hari</th>
                <th className="p-3 text-right">31–60 Hari</th>
                <th className="p-3 text-right">61–90 Hari</th>
                <th className="p-3 text-right">90+ Hari</th>
                <th className="p-3 text-right">Total Outstanding AP</th>
                <th className="p-3 text-center">Aksi Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {supplierAgingRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{row.supplierName}</span>
                  </td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">
                    {row.current > 0 ? formatRupiah(row.current) : '-'}
                  </td>
                  <td className="p-3 text-right text-amber-600 font-semibold">
                    {row.d1_30 > 0 ? formatRupiah(row.d1_30) : '-'}
                  </td>
                  <td className="p-3 text-right text-orange-600 font-semibold">
                    {row.d31_60 > 0 ? formatRupiah(row.d31_60) : '-'}
                  </td>
                  <td className="p-3 text-right text-rose-600 font-bold">
                    {row.d61_90 > 0 ? formatRupiah(row.d61_90) : '-'}
                  </td>
                  <td className="p-3 text-right text-red-700 font-extrabold">
                    {row.d90 > 0 ? formatRupiah(row.d90) : '-'}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    {formatRupiah(row.total)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        const matchingPayable = payables.find((p) => p.supplierName === row.supplierName && p.remainingAmount > 0);
                        onOpenPaymentModal(matchingPayable);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95"
                    >
                      Bayar Hutang
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};