import { generateId } from '../../lib/identifiers';
import React, { useState } from 'react';
import { Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Building,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  X,
  CreditCard,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Package
} from 'lucide-react';

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500';

export const SupplierMaster: React.FC = () => {
  const {
    suppliers,
    paymentTerms,
    purchaseOrders,
    payables,
    addSupplier,
    updateSupplier,
    deleteSupplier
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Detail Drawer State
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'purchase_orders' | 'invoices' | 'payments' | 'payables' | 'documents' | 'activity'
  >('overview');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    code: '',
    name: '',
    category: '',
    city: '',
    address: '',
    contactPerson: '',
    phone: '',
    paymentTermId: paymentTerms[0]?.id || '',
    outstandingAP: 0,
    status: 'active'
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPayable = suppliers.reduce((acc, s) => acc + (s.outstandingAP || 0), 0);

  const handleOpenAdd = () => {
    const nextCode = `SUPP-10${suppliers.length + 1}`;
    setEditingSupplier(null);
    setFormData({
      code: nextCode,
      name: '',
      category: '',
      city: '',
      address: '',
      contactPerson: '',
      phone: '',
      paymentTermId: paymentTerms[0]?.id || '',
      outstandingAP: 0,
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (supp: Supplier) => {
    setEditingSupplier(supp);
    setFormData(supp);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const pt = paymentTerms.find((p) => p.id === formData.paymentTermId);

    const suppData: Supplier = {
      id: editingSupplier ? editingSupplier.id : generateId('supp'),
      code: formData.code || '',
      name: formData.name || '',
      category: formData.category || '',
      city: formData.city || '',
      address: formData.address || '',
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      paymentTermId: formData.paymentTermId || '',
      paymentTermName: pt ? pt.name : 'NET 45',
      outstandingAP: Number(formData.outstandingAP) || 0,
      status: formData.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'
    };

    if (editingSupplier) {
      updateSupplier(suppData);
    } else {
      addSupplier(suppData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pabrik ${name}?`)) {
      deleteSupplier(id);
      if (activeSupplier?.id === id) setActiveSupplier(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pabrik Principal Terdaftar</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{suppliers.length} Pabrik</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Produsen Bahan Bangunan Resmi</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Hutang Usaha Agen (AP)</p>
            <h3 className="text-lg font-extrabold text-rose-600 mt-1">{formatRupiah(totalPayable)}</h3>
            <p className="text-[11px] text-rose-600 font-bold mt-1">Kewajiban Pembayaran ke Pabrik</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Term Pembayaran Rata-rata</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">NET 45 Hari</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">Tempo Kredit Pembelian Agen</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode pabrik, nama supplier, kota, atau contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori Produk</option>
              <option value="Semen & Pasir">Semen & Pasir</option>
              <option value="Besi & Baja Construction">Besi & Baja Construction</option>
              <option value="Cat & Coating Finishes">Cat & Coating Finishes</option>
              <option value="Keramik & Sanitari">Keramik & Sanitari</option>
              <option value="Atap & Gypsum">Atap & Gypsum</option>
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 whitespace-nowrap transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pabrik / Supplier</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Pabrik Principal</th>
                <th className="p-3">Kategori Produk</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Payment Term AP</th>
                <th className="p-3 text-right">Hutang Agen (AP)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-700">{s.code}</td>
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {s.city}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {s.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800">
                    <div>{s.contactPerson}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.phone}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                      {s.paymentTermName}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-rose-600">
                    {formatRupiah(s.outstandingAP || 0)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setActiveSupplier(s);
                          setDetailTab('overview');
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                        title="Detail Supplier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPPLIER DETAIL DRAWER WITH 7 TABS */}
      {activeSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                    {activeSupplier.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {activeSupplier.category}
                  </span>
                </div>
                <h2 className="text-lg font-black mt-1 text-white">{activeSupplier.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {activeSupplier.address || activeSupplier.city}
                </p>
              </div>

              <button
                onClick={() => setActiveSupplier(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AP Summary Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Syarat Pembayaran</span>
                <p className="text-xs font-extrabold text-blue-700 mt-0.5">{activeSupplier.paymentTermName}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Hutang Usaha Agen (AP)</span>
                <p className="text-xs font-extrabold text-rose-600 mt-0.5">
                  {formatRupiah(activeSupplier.outstandingAP || 0)}
                </p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'purchase_orders', label: 'Purchase Orders' },
                  { id: 'invoices', label: 'Faktur Pembelian' },
                  { id: 'payments', label: 'Pembayaran Pabrik' },
                  { id: 'payables', label: 'Hutang (AP)' },
                  { id: 'documents', label: 'Dokumen Legal' },
                  { id: 'activity', label: 'Log Aktivitas' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                    detailTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs border-b pb-2">Kontak Person Pabrik</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 font-semibold">Contact Person:</span>
                        <p className="font-extrabold text-slate-900 mt-0.5">{activeSupplier.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Telepon Kantor:</span>
                        <p className="font-bold text-slate-800 mt-0.5">{activeSupplier.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'purchase_orders' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Riwayat Purchase Order (PO) Agen ke Pabrik</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">No. PO</th>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5 text-right">Total PO</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium">
                        {purchaseOrders
                          .filter((po) => po.supplierId === activeSupplier.id)
                          .map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-blue-700">{po.code}</td>
                              <td className="p-2.5 text-slate-600">{po.date}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">
                                {formatRupiah(po.totalAmount)}
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {purchaseOrders.filter((po) => po.supplierId === activeSupplier.id).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">
                              Belum ada Purchase Order terdaftar untuk supplier ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === 'invoices' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Faktur Pembelian dari Pabrik</h4>
                  <p className="text-slate-500">Daftar faktur penagihan resmi dari pabrik kepada agen distributor.</p>
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Riwayat Pelunasan Pembayaran ke Pabrik</h4>
                  <p className="text-slate-500">Bukti transfer kas/bank pelunasan hutang AP.</p>
                </div>
              )}

              {detailTab === 'payables' && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="font-bold text-rose-900">Total Hutang Berjalan Agen: {formatRupiah(activeSupplier.outstandingAP || 0)}</p>
                </div>
              )}

              {detailTab === 'documents' && (
                <div className="p-4 border rounded-xl border-dashed border-slate-300 text-center">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-slate-600 font-medium mt-1">Kontrak Keagenan Distributor Resmi</p>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-2 border-l-2 border-blue-500 pl-4">
                  <p className="font-bold text-slate-800">Pembaruan Kontrak Tahunan</p>
                  <span className="text-[10px] text-slate-400">Terdaftar Aktif</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingSupplier ? 'Edit Data Pabrik Supplier' : 'Tambah Pabrik Supplier / Principal'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Supplier</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pabrik / Principal</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Semen Tiga Roda Tbk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Produk Utama</label>
                  <select
                    value={['Semen & Pasir','Besi & Baja Construction','Cat & Coating Finishes','Keramik & Sanitari','Atap & Gypsum'].includes(formData.category || '') ? formData.category : '__lainnya__'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value === '__lainnya__' ? '' : e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="Semen & Pasir">Semen & Pasir</option>
                    <option value="Besi & Baja Construction">Besi & Baja Construction</option>
                    <option value="Cat & Coating Finishes">Cat & Coating Finishes</option>
                    <option value="Keramik & Sanitari">Keramik & Sanitari</option>
                    <option value="Atap & Gypsum">Atap & Gypsum</option>
                    <option value="__lainnya__">Pilih Lainnya</option>
                  </select>
                  {(!['Semen & Pasir','Besi & Baja Construction','Cat & Coating Finishes','Keramik & Sanitari','Atap & Gypsum'].includes(formData.category || '')) && (
                    <input className={inputClass} required placeholder="Tulis kategori produk utama..." value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota Pabrik</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person PIC</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Term AP</label>
                  <select
                    value={formData.paymentTermId}
                    onChange={(e) => setFormData({ ...formData, paymentTermId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {paymentTerms.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Supplier</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
