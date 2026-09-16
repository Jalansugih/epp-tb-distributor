import { generateId } from '../../lib/identifiers';
import React, { useState } from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Building2,
  FileText,
  CreditCard,
  DollarSign,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export const CustomerMaster: React.FC = () => {
  const {
    customers,
    salespersons,
    paymentTerms,
    salesOrders,
    receivables,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Detail Drawer State
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'orders' | 'invoices' | 'payments' | 'receivables' | 'documents' | 'activity'
  >('overview');

  // Add/Edit Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    code: '',
    name: '',
    group: '',
    city: '',
    address: '',
    phone: '',
    salespersonId: salespersons[0]?.id || '',
    paymentTermId: paymentTerms[0]?.id || '',
    creditLimit: 0,
    outstandingAR: 0,
    status: 'active'
  });

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.salespersonName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || c.group === selectedGroup;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  // Calculation Metrics
  const totalLimit = customers.reduce((acc, c) => acc + c.creditLimit, 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + (c.outstandingAR || 0), 0);
  const totalAvailable = totalLimit - totalOutstanding;

  const handleOpenAdd = () => {
    const nextCode = `CUST-10${customers.length + 1}`;
    setEditingCustomer(null);
    setFormData({
      code: nextCode,
      name: '',
      group: '',
      city: '',
      address: '',
      phone: '',
      salespersonId: salespersons[0]?.id || '',
      paymentTermId: paymentTerms[0]?.id || '',
      creditLimit: 0,
      outstandingAR: 0,
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData(cust);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const sp = salespersons.find((s) => s.id === formData.salespersonId);
    const pt = paymentTerms.find((p) => p.id === formData.paymentTermId);

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : generateId('cust'),
      code: formData.code || '',
      name: formData.name || '',
      group: formData.group || '',
      city: formData.city || '',
      address: formData.address || '',
      phone: formData.phone || '',
      salespersonId: formData.salespersonId || '',
      salespersonName: sp ? sp.name : salespersons[0]?.name || 'Unassigned',
      paymentTermId: formData.paymentTermId || '',
      paymentTermName: pt ? pt.name : 'NET 30',
      creditLimit: Number(formData.creditLimit) || 0,
      usedCredit: Number(formData.outstandingAR) || Number(formData.usedCredit) || 0,
      outstandingAR: Number(formData.outstandingAR) || 0,
      status: formData.status?.toLowerCase() === 'suspended' ? 'suspended' : 'active',
      joinDate: editingCustomer ? editingCustomer.joinDate : new Date().toISOString().split('T')[0]
    };

    if (editingCustomer) {
      updateCustomer(customerData);
    } else {
      addCustomer(customerData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data toko ${name}?`)) {
      deleteCustomer(id);
      if (activeCustomer?.id === id) setActiveCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Pelanggan Terdaftar</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{customers.length} Toko</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Terverifikasi
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Plafon Kredit Agen</p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">{formatRupiah(totalLimit)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Gabungan seluruh toko</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Piutang Berjalan (AR)</p>
            <h3 className="text-lg font-extrabold text-amber-600 mt-1">{formatRupiah(totalOutstanding)}</h3>
            <p className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Menggunakan Limit
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Sisa Kredit Tersedia</p>
            <h3 className="text-lg font-extrabold text-emerald-600 mt-1">{formatRupiah(totalAvailable)}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Siap untuk Order Baru</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode toko, nama retail, kota, atau sales executive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Tipe Toko</option>
              <option value="Toko Kelontong Bangunan">Toko Kelontong Bangunan</option>
              <option value="Sub-Distributor">Sub-Distributor</option>
              <option value="Kontraktor / Project">Kontraktor / Project</option>
              <option value="Retail Modern">Retail Modern</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Inactive">Non-Aktif</option>
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 whitespace-nowrap transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Toko Retail</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Toko Retail</th>
                <th className="p-3">Tipe / Group</th>
                <th className="p-3">Sales Person</th>
                <th className="p-3">Payment Term</th>
                <th className="p-3 text-right">Limit Kredit</th>
                <th className="p-3 text-right">Piutang (AR)</th>
                <th className="p-3 text-right">Sisa Limit</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Tidak ada data pelanggan yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const avail = c.creditLimit - (c.outstandingAR || 0);
                  const isLimitWarning = c.outstandingAR && c.outstandingAR > c.creditLimit * 0.8;

                  return (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{c.code}</td>
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {c.city}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {c.group}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-semibold">{c.salespersonName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                          {c.paymentTermName}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(c.creditLimit)}</td>
                      <td
                        className={`p-3 text-right font-extrabold ${
                          isLimitWarning ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatRupiah(c.outstandingAR || 0)}
                      </td>
                      <td
                        className={`p-3 text-right font-extrabold ${
                          avail < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatRupiah(avail)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setDetailTab('overview');
                            }}
                            title="Lihat Detail & Tab Status"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Data Toko"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            title="Hapus Toko"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL WITH 7 TABS */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                    {activeCustomer.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {activeCustomer.group}
                  </span>
                </div>
                <h2 className="text-lg font-black mt-1 text-white">{activeCustomer.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {activeCustomer.address || activeCustomer.city}
                </p>
              </div>

              <button
                onClick={() => setActiveCustomer(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credit Limit Summary Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Limit Kredit</span>
                <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                  {formatRupiah(activeCustomer.creditLimit)}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Outstanding AR</span>
                <p className="text-xs font-extrabold text-amber-600 mt-0.5">
                  {formatRupiah(activeCustomer.outstandingAR || 0)}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Sisa Kredit</span>
                <p className="text-xs font-extrabold text-emerald-600 mt-0.5">
                  {formatRupiah(activeCustomer.creditLimit - (activeCustomer.outstandingAR || 0))}
                </p>
              </div>
            </div>

            {/* Tab Navigators */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 scrollbar-none">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'orders', label: 'Sales Orders' },
                  { id: 'invoices', label: 'Faktur' },
                  { id: 'payments', label: 'Pembayaran' },
                  { id: 'receivables', label: 'Piutang AR' },
                  { id: 'documents', label: 'Dokumen' },
                  { id: 'activity', label: 'Aktivitas Log' }
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

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs border-b pb-2">Informasi Kontak & Lisensi</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">Sales Executive PIC:</span>
                        <p className="font-extrabold text-slate-900 mt-0.5">{activeCustomer.salespersonName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Syarat Pembayaran:</span>
                        <p className="font-extrabold text-blue-700 mt-0.5">{activeCustomer.paymentTermName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">No. Telepon / WhatsApp:</span>
                        <p className="font-bold text-slate-800 mt-0.5">{activeCustomer.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Tanggal Bergabung:</span>
                        <p className="font-bold text-slate-800 mt-0.5">{activeCustomer.joinDate || '2025-01-15'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs border-b pb-2">Alamat Pengiriman Utama</h4>
                    <p className="text-xs text-slate-700 font-medium">
                      {activeCustomer.address || 'Jl. Industri Bangunan No. 45'}, {activeCustomer.city}
                    </p>
                  </div>
                </div>
              )}

              {detailTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs">Riwayat Sales Order Toko ini</h4>
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">No. SO</th>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5 text-right">Total Order</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium">
                        {salesOrders
                          .filter((so) => so.customerId === activeCustomer.id)
                          .map((so) => (
                            <tr key={so.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-blue-700">{so.code}</td>
                              <td className="p-2.5 text-slate-600">{so.date}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">
                                {formatRupiah(so.totalAmount)}
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {so.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {salesOrders.filter((so) => so.customerId === activeCustomer.id).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">
                              Belum ada transaksi Sales Order terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === 'invoices' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Faktur Penjualan (Sales Invoices)</h4>
                  <p className="text-slate-500">Daftar penagihan faktur resmi distributor kepada {activeCustomer.name}.</p>
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Riwayat Pembayaran Pelanggan</h4>
                  <p className="text-slate-500">Penerimaan pembayaran kas/bank dari toko.</p>
                </div>
              )}

              {detailTab === 'receivables' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Piutang Usaha Outstanding</h4>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="font-bold text-amber-900">Total Piutang Toko: {formatRupiah(activeCustomer.outstandingAR || 0)}</p>
                  </div>
                </div>
              )}

              {detailTab === 'documents' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Dokumen Toko & Legalitas</h4>
                  <div className="p-4 border rounded-xl border-dashed border-slate-300 text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-600 font-medium">KTP Pemilik, NPWP Toko, NIB Telah Terverifikasi</p>
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Aktivitas & Log Sistem</h4>
                  <div className="space-y-2 border-l-2 border-blue-500 pl-4">
                    <div>
                      <p className="font-bold text-slate-800">Batas Kredit Diperbarui</p>
                      <span className="text-[10px] text-slate-400">Hari ini, 09:30 WIB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingCustomer ? 'Edit Data Toko Retail' : 'Tambah Toko Retail / Pelanggan Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Toko</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Toko Retail</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Bangunan Jaya Abadi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grup / Klasifikasi Toko</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Toko Kelontong Bangunan">Toko Kelontong Bangunan</option>
                    <option value="Sub-Distributor">Sub-Distributor</option>
                    <option value="Kontraktor / Project">Kontraktor / Project</option>
                    <option value="Retail Modern">Retail Modern</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota / Wilayah</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab Eksekutif Penjualan</label>
                  <select
                    value={formData.salespersonId || ''}
                    onChange={(e) => setFormData({ ...formData, salespersonId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="">— Belum Ditentukan —</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} ({sp.code})
                      </option>
                    ))}
                  </select>
                  {salespersons.length === 0 && (
                    <p className="mt-1 text-[10px] text-amber-600 font-semibold">Belum ada Sales Executive. Tambahkan terlebih dahulu di Master Sales Executive.</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Term Default</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Limit Kredit Plafon (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-extrabold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Toko</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Non-Aktif / Ditangguhkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Toko</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Jl. Raya Utama Bangunan..."
                />
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
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
