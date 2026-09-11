import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  FolderKanban,
  Printer,
  Search,
  FileText,
  Receipt,
  Truck,
  Building2,
  Filter,
  Eye,
  Download,
  CreditCard,
  Wallet,
  BookOpen
} from 'lucide-react';
import { formatRupiah } from '../../utils/discountEngine';

export const DocumentsView: React.FC = () => {
  const { salesOrders, purchaseOrders, quotations, deliveries, invoices, payments, openDocModal } = useApp();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');

  // Generate all 9 document types from store data
  const allDocuments = [
    ...quotations.map((q) => ({
      id: `sq-${q.id}`,
      code: q.code,
      type: 'QUOTATION',
      party: q.customerName,
      date: q.date,
      amount: q.totalAmount,
      raw: q
    })),
    ...salesOrders.map((so) => ({
      id: `so-${so.id}`,
      code: so.code,
      type: 'SALES ORDER',
      party: so.customerName,
      date: so.date,
      amount: so.totalAmount,
      raw: so
    })),
    ...deliveries.map((d) => ({
      id: `sj-${d.id}`,
      code: d.code,
      type: 'DELIVERY NOTE',
      party: d.customerName,
      date: d.date,
      amount: 0,
      raw: d
    })),
    ...invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      code: inv.code,
      type: 'SALES INVOICE',
      party: inv.customerName,
      date: inv.date,
      amount: inv.totalAmount,
      raw: inv
    })),
    ...purchaseOrders.map((po) => ({
      id: `po-${po.id}`,
      code: po.code,
      type: 'PURCHASE ORDER',
      party: po.supplierName,
      date: po.date,
      amount: po.totalAmount,
      raw: po
    })),
    ...purchaseOrders.map((po) => ({
      id: `pinv-${po.id}`,
      code: `PINV/${po.code}`,
      type: 'PURCHASE INVOICE',
      party: po.supplierName,
      date: po.date,
      amount: po.totalAmount,
      raw: po
    })),
    ...payments.map((p) => ({
      id: `pay-${p.id}`,
      code: p.code,
      type: 'PAYMENT RECEIPT',
      party: p.customerName,
      date: p.date,
      amount: p.amount,
      raw: p
    })),
    {
      id: 'pv-001',
      code: 'PV/2026/08/0012',
      type: 'PAYMENT VOUCHER',
      party: 'PT Indocement Tunggal Prakarsa Tbk',
      date: '2026-08-10',
      amount: 80200000,
      raw: {
        paymentNumber: 'PV/2026/08/0012',
        supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
        paymentMethod: 'Transfer Bank Mandiri',
        referenceNo: 'TRF-MND-99210',
        amount: 80200000,
        date: '2026-08-10',
        invoiceNo: 'PINV/2026/08/0055'
      }
    },
    {
      id: 'soa-001',
      code: 'SOA/2026/08/TK01',
      type: 'STATEMENT OF ACCOUNT',
      party: 'Toko Bangunan Makmur Jaya',
      date: '2026-08-12',
      amount: 45680000,
      raw: {
        code: 'SOA/2026/08/TK01',
        customerName: 'Toko Bangunan Makmur Jaya',
        address: 'Jl. Daan Mogot No. 142, Kalideres, Jakarta Barat',
        date: '2026-08-12',
        totalAmount: 45680000
      }
    }
  ];

  const filteredDocs = allDocuments.filter((doc) => {
    const matchesSearch =
      doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.party.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = docTypeFilter === 'All' || doc.type === docTypeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'QUOTATION': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SALES ORDER': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELIVERY NOTE': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SALES INVOICE': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PURCHASE ORDER': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PURCHASE INVOICE': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'PAYMENT RECEIPT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PAYMENT VOUCHER': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'STATEMENT OF ACCOUNT': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Pusat Arsip Dokumen ERP</h2>
          <p className="text-xs text-slate-500">Cetak ulang 9 Dokumen Resmi: Quotation, SO, Delivery Note, Invoice, PO, Receipt, Voucher & Statement</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode dokumen, nama toko, supplier..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Tipe Dokumen (9 Jenis):</span>
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">Semua Tipe Dokumen (9 Jenis)</option>
            <option value="QUOTATION">1. Quotation (Penawaran)</option>
            <option value="SALES ORDER">2. Sales Order (SO)</option>
            <option value="DELIVERY NOTE">3. Delivery Note (Surat Jalan)</option>
            <option value="SALES INVOICE">4. Sales Invoice (Faktur Penjualan)</option>
            <option value="PURCHASE ORDER">5. Purchase Order (PO)</option>
            <option value="PURCHASE INVOICE">6. Purchase Invoice (Faktur Pembelian)</option>
            <option value="PAYMENT RECEIPT">7. Payment Receipt (Kwitansi)</option>
            <option value="PAYMENT VOUCHER">8. Payment Voucher (Voucher Pengeluaran)</option>
            <option value="STATEMENT OF ACCOUNT">9. Statement of Account (Rekening Koran AR)</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                <th className="px-6 py-3">Kode Dokumen</th>
                <th className="px-6 py-3">Jenis Dokumen</th>
                <th className="px-6 py-3">Pelanggan / Supplier</th>
                <th className="px-6 py-3">Tanggal Issued</th>
                <th className="px-6 py-3 text-right">Nilai Transaksi</th>
                <th className="px-6 py-3 text-center">Aksi Pratinjau & Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] font-medium">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-blue-600">{doc.code}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeStyle(
                        doc.type
                      )}`}
                    >
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">{doc.party}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono">{doc.date}</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-900">
                    {doc.amount > 0 ? formatRupiah(doc.amount) : '-'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => openDocModal(doc.type, `${doc.type} — ${doc.code}`, doc.raw)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors border border-blue-200"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      Pratinjau & Cetak
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
