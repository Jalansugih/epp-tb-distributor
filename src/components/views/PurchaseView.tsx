import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah } from '../../utils/discountEngine';
import { PurchaseOrderModal } from '../common/PurchaseOrderModal';
import { SupplierPaymentModal } from '../common/SupplierPaymentModal';
import { PayableAgingView } from '../common/PayableAgingView';
import {
  Building2,
  Plus,
  Search,
  Printer,
  PackageCheck,
  Receipt,
  Wallet,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  Filter,
  CreditCard
} from 'lucide-react';

export const PurchaseView: React.FC = () => {
  const {
    purchaseRequests,
    purchaseOrders,
    goodsReceipts,
    purchaseInvoices,
    payables,
    supplierPayments,
    openDocModal,
    addToast,
    setCurrentView,
    currentView,
    convertPRtoPO,
    addGoodsReceipt,
    addPurchaseInvoice
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedPRForPO, setSelectedPRForPO] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayableForPayment, setSelectedPayableForPayment] = useState<any>(null);

  // Determine active tab from global view state or local selection
  const getActiveTab = () => {
    if (currentView.includes('requests')) return 'requests';
    if (currentView.includes('receipts')) return 'receipts';
    if (currentView.includes('invoices')) return 'invoices';
    if (currentView.includes('payables')) return 'payables';
    if (currentView.includes('payments')) return 'payments';
    if (currentView.includes('aging')) return 'aging';
    return 'orders';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'requests') setCurrentView('purchase-requests');
    else if (tab === 'orders') setCurrentView('purchase-orders');
    else if (tab === 'receipts') setCurrentView('purchase-receipts');
    else if (tab === 'invoices') setCurrentView('purchase-invoices');
    else if (tab === 'payables') setCurrentView('purchase-payables');
    else if (tab === 'payments') setCurrentView('purchase-payments');
    else if (tab === 'aging') setCurrentView('purchase-aging');
  };

  const openCreatePO = (prData?: any) => {
    setSelectedPRForPO(prData || null);
    setIsPOModalOpen(true);
  };

  const openPaymentModal = (payable?: any) => {
    setSelectedPayableForPayment(payable || null);
    setIsPaymentModalOpen(true);
  };

  // Filtered lists
  const filteredRequests = purchaseRequests.filter(
    (pr) =>
      pr.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pr.supplierName && pr.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredOrders = purchaseOrders.filter(
    (po) =>
      po.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = goodsReceipts.filter(
    (gr) =>
      gr.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gr.poCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gr.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = purchaseInvoices.filter(
    (inv) =>
      inv.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.poCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayables = payables.filter(
    (ap) =>
      ap.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = supplierPayments.filter(
    (pay) =>
      pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick total metrics
  const totalAPOutstanding = payables.reduce((acc, curr) => acc + (curr.remainingAmount || curr.outstanding || 0), 0);
  const totalInvoicedThisMonth = purchaseInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => handleTabChange('requests')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'requests' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Permintaan PR ({purchaseRequests.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('orders')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Purchase Order PO ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('receipts')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'receipts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Penerimaan GR ({goodsReceipts.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('invoices')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Faktur Pembelian ({purchaseInvoices.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('payables')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payables' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Hutang AP ({payables.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('payments')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pembayaran ({supplierPayments.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('aging')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'aging' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Payable Aging</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openPaymentModal()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Bayar Hutang</span>
          </button>

          <button
            onClick={() => openCreatePO()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Ke Pabrik</span>
          </button>
        </div>
      </div>

      {/* Global Search Bar (Shown on non-aging tabs) */}
      {activeTab !== 'aging' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode dokumen, supplier pabrik, nomor faktur..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span>
              Total Outstanding AP: <strong className="text-rose-600 font-extrabold">{formatRupiah(totalAPOutstanding)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* VIEW CONTENT BY ACTIVE TAB */}

      {/* 1. PURCHASE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Permintaan Pembelian (Purchase Requests - PR)</h3>
            <span className="text-xs font-bold text-slate-500">{filteredRequests.length} Permintaan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Kode PR</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Pemohon & Divisi</th>
                  <th className="p-3">Target Gudang</th>
                  <th className="p-3">Usulan Supplier</th>
                  <th className="p-3">Prioritas</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredRequests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{pr.code}</td>
                    <td className="p-3 text-slate-600">{pr.date}</td>
                    <td className="p-3 text-slate-900 font-semibold">{pr.requesterName} ({pr.department})</td>
                    <td className="p-3 text-slate-600">{pr.warehouseName}</td>
                    <td className="p-3 font-bold text-slate-800">{pr.supplierName || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pr.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pr.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          pr.status === 'Converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pr.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {pr.status !== 'Converted' ? (
                        <button
                          onClick={() => convertPRtoPO(pr.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 mx-auto"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Konversi Ke PO
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">Ter-konversi PO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PURCHASE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Purchase Orders Ke Pabrik / Principal (PO)</h3>
            <span className="text-xs font-bold text-blue-700">Total PO Aktif: {filteredOrders.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">No. PO</th>
                  <th className="p-3">Tanggal Order</th>
                  <th className="p-3">Supplier Principal</th>
                  <th className="p-3">Syarat Bayar</th>
                  <th className="p-3">Gudang Tujuan</th>
                  <th className="p-3 text-right">Total Nilai PO</th>
                  <th className="p-3">Status Kirim</th>
                  <th className="p-3">Status Penerimaan</th>
                  <th className="p-3 text-center">Dokumen / Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{po.code}</td>
                    <td className="p-3 text-slate-600">{po.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-500">Buyer: {po.buyerName}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{po.paymentTermName}</td>
                    <td className="p-3 text-slate-600">{po.warehouseName}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(po.totalAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          po.status === 'Received' || po.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'Sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          po.receiptStatus === 'Full'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {po.receiptStatus === 'Full' ? 'Penuh (Full)' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDocModal('PURCHASE ORDER', `Dokumen PO ${po.code}`, po)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        Cetak PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GOODS RECEIPTS TAB */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Bukti Penerimaan Barang Gudang (Goods Receipt - GR)</h3>
            <span className="text-xs font-bold text-slate-500">{filteredReceipts.length} Penerimaan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">No. GR</th>
                  <th className="p-3">Ref No. PO</th>
                  <th className="p-3">Tanggal Terima</th>
                  <th className="p-3">Supplier Principal</th>
                  <th className="p-3">Lokasi Gudang</th>
                  <th className="p-3">Penerima (Petugas)</th>
                  <th className="p-3">Status Simpan</th>
                  <th className="p-3 text-center">Surat Penerimaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredReceipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{gr.code}</td>
                    <td className="p-3 font-semibold text-slate-800">{gr.poCode}</td>
                    <td className="p-3 text-slate-600">{gr.date}</td>
                    <td className="p-3 font-bold text-slate-900">{gr.supplierName}</td>
                    <td className="p-3 text-slate-600">{gr.warehouseName}</td>
                    <td className="p-3 text-slate-700 font-semibold">{gr.receivedBy}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        {gr.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDocModal('GOODS RECEIPT', `Surat Penerimaan ${gr.code}`, gr)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        Bukti GR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PURCHASE INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Faktur Pembelian Dari Supplier (Purchase Invoices)</h3>
            <span className="text-xs font-bold text-slate-600">Total Nilai Tagihan: {formatRupiah(totalInvoicedThisMonth)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">No. Faktur Sistem</th>
                  <th className="p-3">No. Faktur Supplier</th>
                  <th className="p-3">Ref PO</th>
                  <th className="p-3">Supplier Principal</th>
                  <th className="p-3">Tgl Faktur</th>
                  <th className="p-3">Jatuh Tempo</th>
                  <th className="p-3 text-right">Nilai Total Tagihan</th>
                  <th className="p-3 text-right">Sisa Hutang</th>
                  <th className="p-3">Status Pembayaran</th>
                  <th className="p-3 text-center">Aksi Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{inv.code}</td>
                    <td className="p-3 font-bold text-slate-900">{inv.supplierInvoiceNo || '-'}</td>
                    <td className="p-3 text-slate-600">{inv.poCode}</td>
                    <td className="p-3 font-bold text-slate-800">{inv.supplierName}</td>
                    <td className="p-3 text-slate-600">{inv.date}</td>
                    <td className="p-3 text-slate-600">{inv.dueDate}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(inv.totalAmount)}</td>
                    <td className="p-3 text-right font-bold text-rose-600">{formatRupiah(inv.remainingAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const matchingPayable = payables.find((p) => p.invoiceNo === inv.supplierInvoiceNo || p.invoiceNo === inv.code);
                          openPaymentModal(matchingPayable);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs"
                      >
                        Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ACCOUNT PAYABLE TAB */}
      {activeTab === 'payables' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hutang Usaha Ke Supplier & Pabrik Principal (Account Payable - AP)</h3>
              <p className="text-xs text-slate-500">Monitoring kewajiban pembayaran faktur berdasarkan tanggal jatuh tempo</p>
            </div>
            <span className="text-xs font-black text-rose-600">Total Outstanding AP: {formatRupiah(totalAPOutstanding)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">No. Faktur Tagihan</th>
                  <th className="p-3">Pabrik Supplier</th>
                  <th className="p-3">Tgl Faktur</th>
                  <th className="p-3">Tanggal Jatuh Tempo</th>
                  <th className="p-3 text-right">Nilai Tagihan</th>
                  <th className="p-3 text-right">Telah Dibayar</th>
                  <th className="p-3 text-right">Sisa Outstanding AP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredPayables.map((ap) => {
                  const rem = ap.remainingAmount ?? ap.outstanding ?? (ap.amount - ap.paidAmount);
                  return (
                    <tr key={ap.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-blue-700">{ap.invoiceNo}</td>
                      <td className="p-3 font-bold text-slate-900">{ap.supplierName}</td>
                      <td className="p-3 text-slate-600">{ap.invoiceDate}</td>
                      <td className="p-3 text-slate-600 font-semibold">{ap.dueDate}</td>
                      <td className="p-3 text-right font-semibold">{formatRupiah(ap.amount || ap.total)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-700">{formatRupiah(ap.paidAmount || ap.paid || 0)}</td>
                      <td className="p-3 text-right font-black text-rose-600">{formatRupiah(rem)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ap.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ap.status === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : ap.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ap.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rem > 0 && (
                            <button
                              onClick={() => openPaymentModal(ap)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs"
                            >
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => openDocModal('AP VOUCHER', `Voucher AP ${ap.supplierName}`, ap)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[10px] rounded-lg"
                          >
                            Voucher
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUPPLIER PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Riwayat Pembayaran Ke Supplier (Supplier Payments)</h3>
            <span className="text-xs font-bold text-emerald-700">{filteredPayments.length} Pembayaran Dicatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">No. Bukti Pembayaran</th>
                  <th className="p-3">Tanggal Bayar</th>
                  <th className="p-3">Supplier Principal</th>
                  <th className="p-3">Faktur Diterapkan</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3 text-right">Jumlah Dibayar</th>
                  <th className="p-3">No. Referensi / Bank</th>
                  <th className="p-3 text-center">Cetak Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{pay.paymentNumber}</td>
                    <td className="p-3 text-slate-600">{pay.date}</td>
                    <td className="p-3 font-bold text-slate-900">{pay.supplierName}</td>
                    <td className="p-3 font-semibold text-slate-800">{pay.invoice}</td>
                    <td className="p-3 font-semibold text-slate-700">{pay.paymentMethod}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{formatRupiah(pay.amount)}</td>
                    <td className="p-3 text-slate-600">{pay.reference}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDocModal('PAYMENT RECEIPT', `Kwitansi ${pay.paymentNumber}`, pay)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        Kwitansi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. PAYABLE AGING REPORT TAB */}
      {activeTab === 'aging' && (
        <PayableAgingView onOpenPaymentModal={openPaymentModal} />
      )}

      {/* MODALS */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        initialPRData={selectedPRForPO}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedPayable={selectedPayableForPayment}
      />
    </div>
  );
};