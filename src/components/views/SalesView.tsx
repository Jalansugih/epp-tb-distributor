import { generateDocumentNo, generateId } from '../../lib/identifiers';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah, formatNumber } from '../../utils/discountEngine';
import { DeliveryOrder, SalesInvoice, SalesPayment, SalesOrder } from '../../types';
import {
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  ShoppingBag,
  Truck,
  Receipt,
  Wallet,
  CreditCard,
  Percent,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Send,
  X,
  Check,
  Building,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const {
    salesOrders,
    quotations,
    deliveries,
    invoices,
    payments,
    receivables,
    warehouses,
    openDocModal,
    openDiscountModal,
    setNewOrderModalOpen,
    currentView,
    setCurrentView,
    updateSalesOrderStatus,
    convertQuotationToSO,
    addDeliveryOrder,
    updateDeliveryStatus,
    addSalesInvoice,
    recordSalesPayment,
    addToast
  } = useApp();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sub-modal states for sales workflow actions
  const [selectedSOForDelivery, setSelectedSOForDelivery] = useState<SalesOrder | null>(null);
  const [selectedSOForInvoice, setSelectedSOForInvoice] = useState<SalesOrder | null>(null);
  const [selectedInvForPayment, setSelectedInvForPayment] = useState<SalesInvoice | null>(null);

  // Form states for modals
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [warehouseName, setWarehouseName] = useState(warehouses[0]?.name || '');

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Giro' | 'Tunai' | 'Cek'>('Transfer Bank');
  const [bankName, setBankName] = useState('');
  const [paymentRefNo, setPaymentRefNo] = useState('');

  // Active Tab determined by currentView sub-path or fallback tab
  const getActiveTab = () => {
    if (currentView.includes('quotations')) return 'quotations';
    if (currentView.includes('deliveries')) return 'deliveries';
    if (currentView.includes('invoices')) return 'invoices';
    if (currentView.includes('receivables')) return 'receivables';
    if (currentView.includes('payments')) return 'payments';
    return 'orders';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'quotations') setCurrentView('sales-quotations');
    else if (tab === 'orders') setCurrentView('sales-orders');
    else if (tab === 'deliveries') setCurrentView('sales-deliveries');
    else if (tab === 'invoices') setCurrentView('sales-invoices');
    else if (tab === 'receivables') setCurrentView('sales-receivables');
    else if (tab === 'payments') setCurrentView('sales-payments');
  };

  // Filter Sales Orders
  const filteredSO = salesOrders.filter((so) => {
    const matchesSearch =
      so.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      so.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      so.salespersonName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || so.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Quotations
  const filteredQuotations = quotations.filter((q) =>
    q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter Deliveries
  const filteredDeliveries = deliveries.filter((d) =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.soCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter Invoices
  const filteredInvoices = invoices.filter((i) =>
    i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.soCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers for workflow triggers
  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSOForDelivery) return;

    const newSJCode = generateDocumentNo('SJ');
    const newDO: DeliveryOrder = {
      id: generateId('sj'),
      code: newSJCode,
      soCode: selectedSOForDelivery.code,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedSOForDelivery.customerId,
      customerName: selectedSOForDelivery.customerName,
      address: selectedSOForDelivery.address || '',
      driverName,
      vehicleNo,
      warehouseName,
      items: selectedSOForDelivery.items.map((i) => ({
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        uom: i.uom,
        qty: i.qty
      })),
      status: 'In Transit',
      notes: 'Diproses dari Sales Order'
    };

    addDeliveryOrder(newDO);
    setSelectedSOForDelivery(null);
  };

  const handleCreateInvoice = (so: SalesOrder) => {
    const newInvCode = generateDocumentNo('INV');
    const newInv: SalesInvoice = {
      id: generateId('inv'),
      code: newInvCode,
      soCode: so.code,
      date: new Date().toISOString().split('T')[0],
      dueDate: so.dueDate,
      customerId: so.customerId,
      customerName: so.customerName,
      salespersonName: so.salespersonName,
      items: so.items,
      subtotal: so.subtotal,
      taxAmount: so.taxAmount,
      totalAmount: so.totalAmount,
      paidAmount: 0,
      remainingAmount: so.totalAmount,
      paymentStatus: 'Unpaid',
      status: 'Issued'
    };

    addSalesInvoice(newInv);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForPayment) return;

    const newPayCode = generateDocumentNo('PAY');
    const newPay: SalesPayment = {
      id: generateId('pay'),
      code: newPayCode,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedInvForPayment.customerId,
      customerName: selectedInvForPayment.customerName,
      invoiceNo: selectedInvForPayment.code,
      paymentMethod,
      bankName,
      referenceNo: paymentRefNo,
      amount: paymentAmount,
      notes: 'Pelunasan piutang toko'
    };

    recordSalesPayment(newPay);
    setSelectedInvForPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Sales Flow Header & Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => handleTabChange('quotations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'quotations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Penawaran ({quotations.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sales Orders ({salesOrders.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('deliveries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'deliveries'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Surat Jalan ({deliveries.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('invoices')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Faktur ({invoices.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('receivables')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'receivables'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Piutang AR ({receivables.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pelunasan ({payments.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openDiscountModal()}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
          >
            <Percent className="w-4 h-4 text-indigo-600" />
            <span>Kalkulator Diskon Beruntun</span>
          </button>

          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Transaksi Penjualan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor dokumen, nama toko, atau salesperson..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'orders' && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600">Filter Status SO:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="All">Semua Status SO</option>
              <option value="Submitted">Submitted (Perlu ACC)</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT IMPLEMENTATIONS */}

      {/* TAB 1: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Penawaran Harga (Sales Quotation)</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {quotations.length} Penawaran</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Kode Penawaran</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Berlaku S.D</th>
                  <th className="p-3">Toko Pelanggan</th>
                  <th className="p-3">Sales Executive</th>
                  <th className="p-3 text-right">Nilai Penawaran</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi / Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">{q.code}</td>
                    <td className="p-3 text-slate-600">{q.date}</td>
                    <td className="p-3 text-slate-600">{q.validUntil}</td>
                    <td className="p-3 font-bold text-slate-900">{q.customerName}</td>
                    <td className="p-3 text-slate-600">{q.salespersonName}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(q.totalAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          q.status === 'Converted'
                            ? 'bg-purple-100 text-purple-800'
                            : q.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDocModal('PENAWARAN HARGA', `Penawaran ${q.code}`, q)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-blue-600" /> Cetak
                        </button>
                        {q.status !== 'Converted' && (
                          <button
                            onClick={() => convertQuotationToSO(q.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <ArrowRight className="w-3 h-3" /> Konversi ke SO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALES ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Nomor SO</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Toko Pelanggan</th>
                  <th className="p-3">Salesperson</th>
                  <th className="p-3">Rincian Item & Skema Diskon</th>
                  <th className="p-3 text-right">Subtotal Gross</th>
                  <th className="p-3 text-right">Total Net (PPN 11%)</th>
                  <th className="p-3">Status SO</th>
                  <th className="p-3 text-center">Aksi / Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredSO.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">
                      <div>{so.code}</div>
                      {so.requiresApproval && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Over Limit
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{so.date}</td>
                    <td className="p-3 font-bold text-slate-900">{so.customerName}</td>
                    <td className="p-3 text-slate-600">{so.salespersonName}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {so.items.map((item, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="font-bold text-slate-800">
                              {item.qty} {item.uom} {item.productName}
                            </span>
                            {item.discounts && item.discounts.length > 0 && (
                              <span className="ml-1 text-[10px] text-blue-600 font-mono">
                                ({item.discounts.map((d) => (d.type === 'percentage' ? `${d.value}%` : `Rp${d.value}`)).join('+')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-500">{formatRupiah(so.subtotal)}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(so.totalAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          so.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : so.status === 'Submitted'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : so.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {so.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Approval Action if Submitted */}
                        {so.status === 'Submitted' && (
                          <button
                            onClick={() => updateSalesOrderStatus(so.id, 'Approved')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] shadow-2xs flex items-center gap-1"
                            title="ACC Kredit Over Limit"
                          >
                            <Check className="w-3 h-3" /> ACC Direksi
                          </button>
                        )}

                        {/* Deliver Action */}
                        {(so.status === 'Approved' || so.status === 'Processing') && (
                          <button
                            onClick={() => setSelectedSOForDelivery(so)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                            title="Buat Surat Jalan"
                          >
                            <Truck className="w-3 h-3" /> Surat Jalan
                          </button>
                        )}

                        {/* Invoice Action */}
                        {so.status === 'Processing' && (
                          <button
                            onClick={() => handleCreateInvoice(so)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                            title="Terbitkan Faktur"
                          >
                            <Receipt className="w-3 h-3" /> Faktur
                          </button>
                        )}

                        <button
                          onClick={() => openDocModal('SALES ORDER', `Sales Order ${so.code}`, so)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-[10px]"
                        >
                          Cetak SO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERIES (SURAT JALAN) */}
      {activeTab === 'deliveries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Pengiriman Barang / Surat Jalan</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {deliveries.length} Surat Jalan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Nomor Surat Jalan</th>
                  <th className="p-3">Ref Sales Order</th>
                  <th className="p-3">Tanggal Kirim</th>
                  <th className="p-3">Toko Tujuan</th>
                  <th className="p-3">Pengemudi / Truk</th>
                  <th className="p-3">Gudang Asal</th>
                  <th className="p-3">Status Pengiriman</th>
                  <th className="p-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">{d.code}</td>
                    <td className="p-3 font-bold text-slate-600">{d.soCode}</td>
                    <td className="p-3 text-slate-600">{d.date}</td>
                    <td className="p-3 font-bold text-slate-900">{d.customerName}</td>
                    <td className="p-3 text-slate-700">{d.driverName} ({d.vehicleNo})</td>
                    <td className="p-3 text-slate-600">{d.warehouseName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {d.status === 'In Transit' && (
                          <button
                            onClick={() => updateDeliveryStatus(d.id, 'Delivered')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" /> Diterima Toko
                          </button>
                        )}
                        <button
                          onClick={() => openDocModal('SURAT JALAN', `Surat Jalan ${d.code}`, d)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-blue-600" /> Cetak Surat Jalan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INVOICES (FAKTUR PENJUALAN) */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Faktur Penjualan (Sales Invoices)</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {invoices.length} Faktur</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Nomor Faktur</th>
                  <th className="p-3">Ref SO</th>
                  <th className="p-3">Tanggal Faktur</th>
                  <th className="p-3">Jatuh Tempo</th>
                  <th className="p-3">Toko Pelanggan</th>
                  <th className="p-3 text-right">Nilai Total (PPN)</th>
                  <th className="p-3 text-right">Sisa Pembayaran</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">{inv.code}</td>
                    <td className="p-3 font-bold text-slate-600">{inv.soCode}</td>
                    <td className="p-3 text-slate-600">{inv.date}</td>
                    <td className="p-3 text-slate-600">{inv.dueDate}</td>
                    <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(inv.totalAmount)}</td>
                    <td className="p-3 text-right font-black text-rose-600">{formatRupiah(inv.remainingAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.remainingAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvForPayment(inv);
                              setPaymentAmount(inv.remainingAmount);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-2xs flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" /> Bayar
                          </button>
                        )}
                        <button
                          onClick={() => openDocModal('SALES INVOICE', `Faktur ${inv.code}`, inv)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px]"
                        >
                          Cetak Faktur
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RECEIVABLES (ACCOUNT RECEIVABLE / AR AGING) */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Kartu Piutang Toko Retail (Account Receivable Aging)</h3>
            <span className="text-xs font-bold text-rose-600">
              Total Outstanding: {formatRupiah(540000000)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Faktur No</th>
                  <th className="p-3">Nama Toko / Pelanggan</th>
                  <th className="p-3">Salesperson</th>
                  <th className="p-3">Tgl Faktur</th>
                  <th className="p-3">Jatuh Tempo</th>
                  <th className="p-3 text-right">Nilai Faktur</th>
                  <th className="p-3 text-right">Sisa Piutang</th>
                  <th className="p-3">Kategori Umur</th>
                  <th className="p-3 text-center">Cetak SOA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {receivables.map((ar) => (
                  <tr key={ar.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-blue-700">{ar.invoiceNo}</td>
                    <td className="p-3 font-bold text-slate-900">{ar.customerName}</td>
                    <td className="p-3 text-slate-600">{ar.salespersonName}</td>
                    <td className="p-3 text-slate-600">{ar.invoiceDate}</td>
                    <td className="p-3 text-slate-600">{ar.dueDate}</td>
                    <td className="p-3 text-right font-semibold">{formatRupiah(ar.amount)}</td>
                    <td className="p-3 text-right font-extrabold text-rose-600">{formatRupiah(ar.remainingAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ar.agingBucket === 'Current'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ar.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDocModal('STATEMENT OF ACCOUNT', `Kartu Piutang ${ar.customerName}`, ar)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" /> Cetak SOA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENTS (RIWAYAT PELUNASAN TOKO) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Riwayat Pembayaran & Pelunasan Toko</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {payments.length} Resi Pembayaran</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Nomor Pembayaran</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Toko Pelanggan</th>
                  <th className="p-3">Nomor Faktur Target</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3">Bank / Reff No</th>
                  <th className="p-3 text-right">Jumlah Dibayar</th>
                  <th className="p-3 text-center">Bukti Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">{p.code}</td>
                    <td className="p-3 text-slate-600">{p.date}</td>
                    <td className="p-3 font-bold text-slate-900">{p.customerName}</td>
                    <td className="p-3 font-bold text-slate-700">{p.invoiceNo}</td>
                    <td className="p-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{p.bankName} ({p.referenceNo})</td>
                    <td className="p-3 text-right font-black text-emerald-600">{formatRupiah(p.amount)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openDocModal('BUKTI PELUNASAN', `Resi ${p.code}`, p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px]"
                      >
                        Cetak Resi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB MODAL 1: CREATE DELIVERY ORDER */}
      {selectedSOForDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Terbitkan Surat Jalan Baru</h3>
              </div>
              <button onClick={() => setSelectedSOForDelivery(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDelivery} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{selectedSOForDelivery.code}</p>
                <p className="text-slate-600">Pelanggan: {selectedSOForDelivery.customerName}</p>
                <p className="text-slate-500">Alamat: {selectedSOForDelivery.address || 'Alamat Toko Default'}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengemudi / Supir</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plat Nomor Truk / Armada</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gudang Asal Barang</label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedSOForDelivery(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Proses & Cetak Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB MODAL 2: RECORD PAYMENT */}
      {selectedInvForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Catat Pembayaran / Pelunasan Toko</h3>
              </div>
              <button onClick={() => setSelectedInvForPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Faktur: {selectedInvForPayment.code}</p>
                <p className="text-slate-600">Toko: {selectedInvForPayment.customerName}</p>
                <p className="text-rose-600 font-bold">
                  Sisa Piutang: {formatRupiah(selectedInvForPayment.remainingAmount)}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah Nominal Pelunasan (Rp)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Giro">Giro Mundur</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="Cek">Cek Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank / Rekening Tujuan</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Referensi Transaksi / Giro</label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedInvForPayment(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
