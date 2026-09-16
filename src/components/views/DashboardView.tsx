import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  TrendingUp,
  Wallet,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    salesOrders,
    purchaseOrders,
    deliveries,
    invoices,
    payments,
    products,
    customers,
    receivables,
    payables,
    systemSettings,
    openDocModal,
    openDiscountModal,
    setNewOrderModalOpen,
    setCurrentView
  } = useApp();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const dateLabel = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const monthLabel = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Sales vs Purchase Trend Data — last 7 days, built from real invoices & purchase orders
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const Sales = invoices.filter((inv: any) => inv.date === key).reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
    const Purchase = purchaseOrders.filter((po) => po.date === key).reduce((s, po) => s + (po.totalAmount || 0), 0);
    return { day: label, Sales, Purchase };
  });

  // Receivable Aging Breakdown, computed from real outstanding receivables
  const agingBuckets = [
    { range: 'Current', amount: 0 },
    { range: '1–30 Days', amount: 0 },
    { range: '31–60 Days', amount: 0 },
    { range: '61–90 Days', amount: 0 },
    { range: '90+ Days', amount: 0 }
  ];
  receivables.forEach((r) => {
    const outstanding = (r.amount ?? r.total ?? 0) - (r.paid ?? 0);
    if (outstanding <= 0) return;
    const days = Math.floor((today.getTime() - new Date(r.dueDate).getTime()) / 86400000);
    const idx = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
    agingBuckets[idx].amount += outstanding;
  });
  const arAgingData = agingBuckets;
  const maxAging = Math.max(1, ...agingBuckets.map((b) => b.amount));

  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  // Recent transactions list — merged from real sales & purchase documents, newest first
  const recentTransactions = [
    ...salesOrders.map((so) => ({ id: `so-${so.id}`, code: so.code, type: 'Sales Order', party: so.customerName, amount: so.totalAmount, status: so.status, date: so.date })),
    ...invoices.map((inv: any) => ({ id: `inv-${inv.id}`, code: inv.code, type: 'Invoice', party: inv.customerName, amount: inv.totalAmount, status: inv.remainingAmount > 0 ? 'Unpaid' : 'Paid', date: inv.date })),
    ...purchaseOrders.map((po) => ({ id: `po-${po.id}`, code: po.code, type: 'Purchase Order', party: po.supplierName, amount: po.totalAmount, status: po.status, date: po.date })),
    ...deliveries.map((d: any) => ({ id: `sj-${d.id}`, code: d.code, type: 'Delivery Note', party: d.customerName, amount: 0, status: d.status, date: d.date })),
    ...payments.map((p: any) => ({ id: `pay-${p.id}`, code: p.code, type: 'Payment', party: p.customerName, amount: p.amount, status: 'Paid', date: p.date }))
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)
    .map((tx) => ({ ...tx, date: new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }));

  // KPI figures, computed from real data — 0 for a brand-new setup until documents are entered
  const salesToday = invoices.filter((inv: any) => inv.date === todayKey).reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
  const salesThisMonth = invoices.filter((inv: any) => (inv.date || '').startsWith(monthKey)).reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
  const receivableOutstanding = receivables.reduce((s, r) => s + Math.max(0, (r.amount ?? r.total ?? 0) - (r.paid ?? 0)), 0);
  const receivableOverdueCustomers = new Set(
    receivables
      .filter((r) => (r.amount ?? r.total ?? 0) - (r.paid ?? 0) > 0 && new Date(r.dueDate).getTime() < today.getTime())
      .map((r) => r.customerName)
  ).size;
  const receivableDueToday = receivables
    .filter((r) => r.dueDate === todayKey)
    .reduce((s, r) => s + Math.max(0, (r.amount ?? r.total ?? 0) - (r.paid ?? 0)), 0);
  const receivableOverdue = receivables
    .filter((r) => (r.amount ?? r.total ?? 0) - (r.paid ?? 0) > 0 && new Date(r.dueDate).getTime() < today.getTime())
    .reduce((s, r) => s + Math.max(0, (r.amount ?? r.total ?? 0) - (r.paid ?? 0)), 0);
  const payableOutstanding = payables.reduce((s, p) => s + Math.max(0, (p.amount ?? p.total ?? 0) - (p.paid ?? 0)), 0);
  const payableDueToday = payables
    .filter((p) => p.dueDate === todayKey)
    .reduce((s, p) => s + Math.max(0, (p.amount ?? p.total ?? 0) - (p.paid ?? 0)), 0);
  const payableOverdue = payables
    .filter((p) => (p.amount ?? p.total ?? 0) - (p.paid ?? 0) > 0 && new Date(p.dueDate).getTime() < today.getTime())
    .reduce((s, p) => s + Math.max(0, (p.amount ?? p.total ?? 0) - (p.paid ?? 0)), 0);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Selamat Datang{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {dateLabel}{systemSettings.companyName ? ` — Ringkasan Eksekutif ${systemSettings.companyName}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New Sales Order
          </button>
          <button
            onClick={() => setCurrentView('purchase-orders')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            + New Purchase Order
          </button>
        </div>
      </div>

      {/* 2. KPI Section (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today (Primary Highlight) */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Sales Today</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(salesToday)}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
            <span>{today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Sales This Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Sales This Month</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(salesThisMonth)}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
            <span>{monthLabel}</span>
          </div>
        </div>

        {/* Receivable */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Receivable</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(receivableOutstanding)}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
            <span>{receivableOverdueCustomers > 0 ? `${receivableOverdueCustomers} Toko Overdue` : 'Tidak ada yang overdue'}</span>
          </div>
        </div>

        {/* Payable */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Payable</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(payableOutstanding)}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
            <span>Hutang ke Supplier</span>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics (2 Columns: Sales Overview & Receivable Aging) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sales Overview Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Sales Overview</h3>
              <p className="text-xs text-slate-500">Perbandingan Penjualan Toko vs Pembelian Pabrik</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              7 Hari Terakhir
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={(val) => `Rp${val / 1000000}M`}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', borderColor: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="Sales"
                  name="Sales Toko"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Purchase"
                  name="Purchase Pabrik"
                  stroke="#64748b"
                  fillOpacity={1}
                  fill="url(#colorPurchase)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Receivable Aging */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Receivable Aging</h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi Umur Piutang Usaha Toko</p>

            <div className="space-y-3">
              {arAgingData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.range}</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(item.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-blue-600' : idx <= 2 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (item.amount / maxAging) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('sales-receivables')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Receivables</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Sales Order
          </button>
          <button
            onClick={() => setCurrentView('purchase-orders')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            New Purchase Order
          </button>
          <button
            onClick={() => setCurrentView('master-customers')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-slate-400" />
            Add Customer
          </button>
          <button
            onClick={() => setCurrentView('master-products')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4 text-slate-400" />
            Add Product
          </button>
          <button
            onClick={() => setCurrentView('sales-payments')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-slate-400" />
            Record Payment
          </button>
          <button
            onClick={() => openDiscountModal()}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200 transition-all flex items-center gap-1.5 ml-auto"
          >
            <Percent className="w-4 h-4 text-blue-600" />
            Simulator Diskon
          </button>
        </div>
      </div>

      {/* 5. Receivable & Payable Side-by-Side Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receivable Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Receivable (Piutang Toko)</h3>
              <p className="text-xs text-slate-500">Uang yang harus diterima dari Toko Retail</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              AR Status
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Total</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatRupiah(receivableOutstanding)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Due Today</span>
              <span className="font-bold text-blue-600 text-sm mt-0.5 block">{formatRupiah(receivableDueToday)}</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <span className="text-amber-800 block">Overdue</span>
              <span className="font-bold text-amber-700 text-sm mt-0.5 block">{formatRupiah(receivableOverdue)}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('sales-receivables')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>View Receivables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Payable Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Payable (Hutang Pabrik)</h3>
              <p className="text-xs text-slate-500">Uang yang harus dibayar ke Principal / Supplier</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              AP Status
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Total</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatRupiah(payableOutstanding)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Due Today</span>
              <span className="font-bold text-slate-700 text-sm mt-0.5 block">{formatRupiah(payableDueToday)}</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
              <span className="text-rose-800 block">Overdue</span>
              <span className="font-bold text-rose-700 text-sm mt-0.5 block">{formatRupiah(payableOverdue)}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('purchase-payables')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>View Payables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Low Stock Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Low Stock Alert</h3>
          </div>
          <button
            onClick={() => setCurrentView('inventory-stock')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View Inventory →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Minimum</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {lowStockItems.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{prod.name}</td>
                  <td className="p-3 font-mono text-slate-500">{prod.code}</td>
                  <td className="p-3 text-slate-600">{prod.warehouseName}</td>
                  <td className="p-3 text-center font-bold text-slate-900">
                    {prod.stock} {prod.uom}
                  </td>
                  <td className="p-3 text-center text-slate-500">
                    {prod.minStock} {prod.uom}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.stock <= prod.minStock / 2
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {prod.stock <= prod.minStock / 2 ? 'Critical' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Recent Transactions Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Recent Transactions</h3>
          <button
            onClick={() => setCurrentView('documents')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View All Documents →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="p-3">Document</th>
                <th className="p-3">Type</th>
                <th className="p-3">Customer / Supplier</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">{tx.code}</td>
                  <td className="p-3 text-slate-600">{tx.type}</td>
                  <td className="p-3 font-semibold text-slate-900">{tx.party}</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatRupiah(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Approved' || tx.status === 'Paid' || tx.status === 'Delivered'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : tx.status === 'Unpaid'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-500 font-mono">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
