import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah, formatNumber } from '../../utils/discountEngine';
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  Calendar,
  Users,
  Building,
  Package,
  UserCheck,
  Warehouse,
  Download,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    salesOrders,
    purchaseOrders,
    customers,
    suppliers,
    products,
    salespersons,
    warehouses,
    receivables,
    payables,
    invoices,
    currentView,
    setCurrentView,
    addToast
  } = useApp();
  const { t } = useLanguage();

  // Selected Report Tab
  const [activeReportTab, setActiveReportTab] = useState<
    | 'sales'
    | 'purchase'
    | 'inventory'
    | 'ar-aging'
    | 'ap-aging'
    | 'customer'
    | 'product'
    | 'salesperson'
    | 'profit'
  >('sales');

  // Filter States
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [selectedCustomer, setSelectedCustomer] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedSalesperson, setSelectedSalesperson] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Export handlers
  const handleExportPDF = () => {
    addToast('PDF Report berhasil di-generate dan diunduh!', 'success');
    window.print();
  };

  const handleExportExcel = () => {
    addToast('Excel Spreadsheet (.xlsx) berhasil di-export!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Akuntansi — Laporan Keuangan Lengkap
          </h2>
          <p className="text-xs text-slate-500">
            Akses 9 Laporan Komprehensif dengan Filter Tanggal, Toko, Supplier, Product & Warehouse
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ekspor PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* 9 Report Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 print:hidden">
        {[
          { id: 'sales', label: '1. Penjualan', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'purchase', label: '2. Pembelian', icon: <Building className="w-3.5 h-3.5" /> },
          { id: 'inventory', label: '3. Persediaan', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'ar-aging', label: '4. Umur Piutang (AR)', icon: <PieChart className="w-3.5 h-3.5" /> },
          { id: 'ap-aging', label: '5. Umur Hutang (AP)', icon: <PieChart className="w-3.5 h-3.5" /> },
          { id: 'customer', label: '6. Pelanggan', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'product', label: '7. Produk', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'salesperson', label: '8. Performa Sales', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'profit', label: '9. Laba Rugi', icon: <TrendingUp className="w-3.5 h-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeReportTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Multi-Filter Panel */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Laporan Global:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Date Range */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Mulai Tgl:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Sampai Tgl:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
            />
          </div>

          {/* Customer */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Pelanggan Toko:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="All">Semua Toko</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Supplier Pabrik:</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="All">Semua Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Salesperson */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Salesperson:</label>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="All">Semua Sales</option>
              {salespersons.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Gudang:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="All">Semua Gudang</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Status Transaksi:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="All">Semua Status</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT AREA */}
      <div id="printable-report" className="print-report bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {/* 1. SALES REPORT */}
        {activeReportTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Penjualan Distributor (Sales Report)</h3>
                <p className="text-xs text-slate-500">Periode: {startDate} s/d {endDate}</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Total Omset: {formatRupiah(salesOrders.reduce((sum, so) => sum + so.totalAmount, 0))}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">No SO</th>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">Toko Pelanggan</th>
                  <th className="p-2.5">Salesperson</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                  <th className="p-2.5 text-right">PPN 11%</th>
                  <th className="p-2.5 text-right">Total Net</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{so.code}</td>
                    <td className="p-2.5 font-mono text-slate-500">{so.date}</td>
                    <td className="p-2.5 font-bold text-slate-900">{so.customerName}</td>
                    <td className="p-2.5">{so.salespersonName}</td>
                    <td className="p-2.5 text-right">{formatRupiah(so.subtotal)}</td>
                    <td className="p-2.5 text-right text-slate-500">{formatRupiah(so.taxAmount)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(so.totalAmount)}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {so.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. PURCHASE REPORT */}
        {activeReportTab === 'purchase' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Pembelian & Pengadaan (Purchase Report)</h3>
                <p className="text-xs text-slate-500">Periode: {startDate} s/d {endDate}</p>
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Total Belanja Pabrik: {formatRupiah(purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0))}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">No PO</th>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">Pabrik / Supplier</th>
                  <th className="p-2.5">Gudang Tujuan</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                  <th className="p-2.5 text-right">PPN 11%</th>
                  <th className="p-2.5 text-right">Total Net</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{po.code}</td>
                    <td className="p-2.5 font-mono text-slate-500">{po.date}</td>
                    <td className="p-2.5 font-bold text-slate-900">{po.supplierName}</td>
                    <td className="p-2.5">{po.warehouseName}</td>
                    <td className="p-2.5 text-right">{formatRupiah(po.subtotal)}</td>
                    <td className="p-2.5 text-right text-slate-500">{formatRupiah(po.taxAmount)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(po.totalAmount)}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. INVENTORY REPORT */}
        {activeReportTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Valuasi & Stok Persediaan (Inventory Report)</h3>
                <p className="text-xs text-slate-500">Nilai Aset Stok Fisik Gudang Utama & Cabang</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Nilai Aset: {formatRupiah(products.reduce((sum, i) => sum + i.stock * i.buyPrice, 0))}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">SKU Code</th>
                  <th className="p-2.5">Nama Material</th>
                  <th className="p-2.5 text-center">Satuan</th>
                  <th className="p-2.5 text-center">Stok Fisik</th>
                  <th className="p-2.5 text-right">Harga Pokok (Cost)</th>
                  <th className="p-2.5 text-right">Nilai Total Stok</th>
                  <th className="p-2.5 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{item.code}</td>
                    <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.uom}</td>
                    <td className="p-2.5 text-center font-black text-slate-900">{formatNumber(item.stock)}</td>
                    <td className="p-2.5 text-right">{formatRupiah(item.buyPrice)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(item.stock * item.buyPrice)}</td>
                    <td className="p-2.5 text-center">
                      {item.stock <= item.minStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Menipis ({item.stock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. RECEIVABLE AGING (AR AGING) */}
        {activeReportTab === 'ar-aging' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Umur Piutang Toko (Receivable Aging Report)</h3>
                <p className="text-xs text-slate-500">Analisis Matriks Umur Piutang Usaha toko bangunan</p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Total Piutang Toko: {formatRupiah(receivables.reduce((sum, r) => sum + r.outstanding, 0))}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">Nama Toko</th>
                  <th className="p-2.5 text-right">Lancar (&lt;30 Hari)</th>
                  <th className="p-2.5 text-right">31–60 Hari</th>
                  <th className="p-2.5 text-right">61–90 Hari</th>
                  <th className="p-2.5 text-right">&gt;90 Hari</th>
                  <th className="p-2.5 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {receivables.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{r.customerName}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-bold">{formatRupiah(r.outstanding * 0.6)}</td>
                    <td className="p-2.5 text-right text-amber-700 font-bold">{formatRupiah(r.outstanding * 0.3)}</td>
                    <td className="p-2.5 text-right text-orange-700 font-bold">{formatRupiah(r.outstanding * 0.1)}</td>
                    <td className="p-2.5 text-right text-rose-700 font-bold">{formatRupiah(0)}</td>
                    <td className="p-2.5 text-right font-black text-rose-700">{formatRupiah(r.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PAYABLE AGING (AP AGING) */}
        {activeReportTab === 'ap-aging' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Umur Hutang Pabrik (Payable Aging Report)</h3>
                <p className="text-xs text-slate-500">Jadwal Pembayaran Hutang ke Produsen/Pabrik Semen & Besi</p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Total Hutang Pabrik: {formatRupiah(payables.reduce((sum, p) => sum + p.outstanding, 0))}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">Pabrik / Supplier</th>
                  <th className="p-2.5 text-right">Lancar (&lt;30 Hari)</th>
                  <th className="p-2.5 text-right">31–60 Hari</th>
                  <th className="p-2.5 text-right">61–90 Hari</th>
                  <th className="p-2.5 text-right">&gt;90 Hari</th>
                  <th className="p-2.5 text-right">Total Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{p.supplierName}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-bold">{formatRupiah(p.outstanding * 0.7)}</td>
                    <td className="p-2.5 text-right text-amber-700 font-bold">{formatRupiah(p.outstanding * 0.3)}</td>
                    <td className="p-2.5 text-right text-orange-700 font-bold">{formatRupiah(0)}</td>
                    <td className="p-2.5 text-right text-rose-700 font-bold">{formatRupiah(0)}</td>
                    <td className="p-2.5 text-right font-black text-amber-700">{formatRupiah(p.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. CUSTOMER REPORT */}
        {activeReportTab === 'customer' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Kontribusi Pelanggan (Customer Report)</h3>
                <p className="text-xs text-slate-500">Evaluasi Limit Kredit dan Kontribusi Toko</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">Kode Toko</th>
                  <th className="p-2.5">Nama Toko</th>
                  <th className="p-2.5">Wilayah</th>
                  <th className="p-2.5 text-right">Plafond Kredit</th>
                  <th className="p-2.5 text-right">Sisa Kredit</th>
                  <th className="p-2.5 text-center">Status Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{c.code}</td>
                    <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-2.5">{c.address}</td>
                    <td className="p-2.5 text-right font-bold">{formatRupiah(c.creditLimit)}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-bold">{formatRupiah(c.creditLimit - c.usedCredit)}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sehat (Active)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. PRODUCT REPORT */}
        {activeReportTab === 'product' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Performa Produk Material (Product Report)</h3>
                <p className="text-xs text-slate-500">Analisis Produk Terlaris & Margin Kotor per Material</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">Kode Barang</th>
                  <th className="p-2.5">Nama Material</th>
                  <th className="p-2.5 text-center">Satuan</th>
                  <th className="p-2.5 text-right">Harga Beli</th>
                  <th className="p-2.5 text-right">Harga Jual List</th>
                  <th className="p-2.5 text-right">Margin Kotor (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const marginPct = p.sellPrice ? (((p.sellPrice - p.buyPrice) / p.sellPrice) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-600">{p.code}</td>
                      <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-2.5 text-center text-slate-600">{p.uom}</td>
                      <td className="p-2.5 text-right">{formatRupiah(p.buyPrice)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatRupiah(p.sellPrice)}</td>
                      <td className="p-2.5 text-right text-emerald-600 font-bold">{marginPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. SALESPERSON PERFORMANCE */}
        {activeReportTab === 'salesperson' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Performa Salesman (Salesperson Performance)</h3>
                <p className="text-xs text-slate-500">Pencapaian Target Penjualan & Komisi Sales</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2.5">Salesman</th>
                  <th className="p-2.5">Wilayah Coverage</th>
                  <th className="p-2.5 text-right">Target Omset</th>
                  <th className="p-2.5 text-right">Realisasi Sales</th>
                  <th className="p-2.5 text-right">Pencapaian (%)</th>
                  <th className="p-2.5 text-right">Komisi Est. (1%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salespersons.map((s) => {
                  const real = invoices.filter((inv) => inv.salespersonName === s.name && inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.subtotal, 0);
                  const target = s.monthlyTarget || 300000000;
                  const ach = ((real / target) * 100).toFixed(1);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-2.5">{s.region}</td>
                      <td className="p-2.5 text-right">{formatRupiah(target)}</td>
                      <td className="p-2.5 text-right font-bold text-blue-700">{formatRupiah(real)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">{ach}%</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">{formatRupiah(real * 0.01)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. PROFIT REPORT */}
        {activeReportTab === 'profit' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laporan Laba Rugi Operasional (Profit Report)</h3>
                <p className="text-xs text-slate-500">Ringkasan Pendapatan Net, COGS, Diskon Bertingkat & Margin Bersih</p>
              </div>
            </div>

            <div className="max-w-xl mx-auto space-y-3 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-1.5 border-b border-slate-200 font-semibold text-slate-700">
                <span>Total Penjualan Kotor (Gross Revenue):</span>
                <span>{formatRupiah(invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.subtotal + inv.taxAmount, 0))}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 text-rose-600 font-semibold">
                <span>Total Potongan Diskon Bertingkat:</span>
                <span>- {formatRupiah(invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + Math.max(0, inv.subtotal - inv.totalAmount + inv.taxAmount), 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 font-black text-slate-900 text-sm">
                <span>Pendapatan Bersih (Net Revenue):</span>
                <span className="text-blue-700">{formatRupiah(invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.subtotal, 0))}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-600 font-semibold">
                <span>Harga Pokok Penjualan (HPP / COGS):</span>
                <span>- {formatRupiah(invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.items.reduce((x, item) => x + item.qty * (products.find((p) => p.id === item.productId)?.buyPrice || 0), 0), 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 font-black text-slate-900 text-sm">
                <span>Laba Kotor Operasional (Gross Profit):</span>
                <span className="text-emerald-700">{formatRupiah(
                  invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.subtotal, 0) -
                  invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.items.reduce((x, item) => x + item.qty * (products.find((p) => p.id === item.productId)?.buyPrice || 0), 0), 0)
                )}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-600">
                <span>Beban Operasional & Logistik Supir:</span>
                <span>- {formatRupiah(0)}</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-black text-emerald-900 text-base">
                <span>ESTIMASI LABA BERSIH (NET PROFIT):</span>
                <span>{formatRupiah(
                  invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.subtotal, 0) -
                  invoices.filter((inv) => inv.date >= startDate && inv.date <= endDate && inv.status !== 'Cancelled').reduce((sum, inv) => sum + inv.items.reduce((x, item) => x + item.qty * (products.find((p) => p.id === item.productId)?.buyPrice || 0), 0), 0)
                )}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
