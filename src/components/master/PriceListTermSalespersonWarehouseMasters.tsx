import React, { useState } from 'react';
import { PriceList, PaymentTerm, Salesperson, Warehouse } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  DollarSign,
  CalendarDays,
  UserCheck,
  Warehouse as WarehouseIcon,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  Building,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Boxes,
  MapPin,
  TrendingUp,
  Percent
} from 'lucide-react';

/* =========================================================================
   1. PRICE LIST MASTER COMPONENT
   ========================================================================= */
export const PriceListMaster: React.FC = () => {
  const { priceLists, products, addPriceList, updatePriceList, deletePriceList } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPL, setSelectedPL] = useState<PriceList | null>(null);

  const filtered = priceLists.filter(
    (pl) =>
      pl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pl.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari daftar harga khusus (Price List)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Daftar Harga (Price List)</th>
                <th className="p-3">Grup Toko Sasaran</th>
                <th className="p-3">Mata Uang</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((pl) => (
                <tr key={pl.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{pl.code}</td>
                  <td className="p-3 font-bold text-slate-900">{pl.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {pl.customerGroupTarget || 'Semua Toko'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700">{pl.currency || 'IDR'}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {pl.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedPL(pl)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs"
                    >
                      Lihat Item Harga
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Price List Modal */}
      {selectedPL && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                  {selectedPL.code}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">{selectedPL.name}</h3>
              </div>
              <button onClick={() => setSelectedPL(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Daftar Penyesuaian Harga Khusus Matriks</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Harga List Standar</th>
                      <th className="p-2.5 text-right">Harga Khusus Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {products.slice(0, 5).map((p) => {
                      const itemMatch = selectedPL.items?.find((i) => i.productId === p.id);
                      const customPrice = itemMatch ? itemMatch.price : p.sellPrice * 0.95;

                      return (
                        <tr key={p.id}>
                          <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                          <td className="p-2.5 text-right text-slate-500 line-through">{formatRupiah(p.sellPrice)}</td>
                          <td className="p-2.5 text-right font-extrabold text-blue-700">
                            {formatRupiah(customPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   2. PAYMENT TERM MASTER COMPONENT
   ========================================================================= */
export const PaymentTermMaster: React.FC = () => {
  const { paymentTerms, addPaymentTerm, deletePaymentTerm } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  const [newTermDays, setNewTermDays] = useState(30);
  const [newTermDesc, setNewTermDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName) return;
    addPaymentTerm({
      id: `pt-${Date.now()}`,
      code: `NET${newTermDays}`,
      name: newTermName,
      days: newTermDays,
      description: newTermDesc || `Jatuh tempo ${newTermDays} hari`
    });
    setIsModalOpen(false);
    setNewTermName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Master Syarat Pembayaran (Payment Terms)</h3>
          <p className="text-xs text-slate-500">
            Mengatur aturan jatuh tempo kredit penjualan toko maupun pembelian ke pabrik.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Payment Term Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentTerms.map((term) => (
          <div
            key={term.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs font-mono">
                {term.code}
              </span>
              {term.isDefault && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  DEFAULT
                </span>
              )}
            </div>

            <h4 className="font-extrabold text-slate-900 text-sm">{term.name}</h4>
            <p className="text-xs text-slate-600">{term.description}</p>
            {term.installmentDetails && (
              <p className="text-[11px] text-indigo-600 font-bold bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                Skema: {term.installmentDetails}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Jatuh Tempo: {term.days} Hari</span>
              {!term.isDefault && (
                <button
                  onClick={() => deletePaymentTerm(term.id)}
                  className="text-rose-600 hover:text-rose-800 font-bold"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Buat Syarat Pembayaran Kustom</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Syarat Pembayaran</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: NET 21 Hari Project"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hari Jatuh Tempo</label>
                <input
                  type="number"
                  required
                  value={newTermDays}
                  onChange={(e) => setNewTermDays(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">KeteranganTambahan</label>
                <input
                  type="text"
                  placeholder="Keterangan aturan cicilan"
                  value={newTermDesc}
                  onChange={(e) => setNewTermDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-xs">
                  Simpan Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. SALESPERSON MASTER COMPONENT
   ========================================================================= */
export const SalespersonMaster: React.FC = () => {
  const { salespersons, customers, addSalesperson, updateSalesperson, deleteSalesperson } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSalesperson, setActiveSalesperson] = useState<Salesperson | null>(null);

  const filtered = salespersons.filter(
    (sp) =>
      sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Sales Executive, kode, atau HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Sales Executive</th>
                <th className="p-3">No. HP / WA</th>
                <th className="p-3 text-right">Target Bulanan</th>
                <th className="p-3 text-center">Komisi %</th>
                <th className="p-3 text-center">Toko Binaan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{sp.code}</td>
                  <td className="p-3 font-extrabold text-slate-900">{sp.name}</td>
                  <td className="p-3 font-mono text-slate-700">{sp.phone}</td>
                  <td className="p-3 text-right font-extrabold text-slate-900">{formatRupiah(sp.targetMonthly)}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">{sp.commissionPercent}%</td>
                  <td className="p-3 text-center font-bold text-blue-700">{sp.assignedCustomersCount || 10} Toko</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {sp.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setActiveSalesperson(sp)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeSalesperson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                  {activeSalesperson.code}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{activeSalesperson.name}</h3>
                <p className="text-xs text-slate-500">HP: {activeSalesperson.phone}</p>
              </div>
              <button onClick={() => setActiveSalesperson(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Toko Retail Binaan Sales ini</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Kode Toko</th>
                      <th className="p-2.5">Nama Toko Retail</th>
                      <th className="p-2.5 text-right">Limit Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {customers
                      .filter((c) => c.salespersonId === activeSalesperson.id)
                      .map((c) => (
                        <tr key={c.id}>
                          <td className="p-2.5 font-mono text-blue-700 font-bold">{c.code}</td>
                          <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                          <td className="p-2.5 text-right font-extrabold">{formatRupiah(c.creditLimit)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   4. WAREHOUSE MASTER COMPONENT
   ========================================================================= */
export const WarehouseMaster: React.FC = () => {
  const { warehouses, products } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWH, setSelectedWH] = useState<Warehouse | null>(null);

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari lokasi gudang distributor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Lokasi Gudang</th>
                <th className="p-3">Tipe Gudang</th>
                <th className="p-3">Kota / Lokasi</th>
                <th className="p-3">Kepala Gudang</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{w.code}</td>
                  <td className="p-3 font-bold text-slate-900">{w.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                      {w.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{w.city}</td>
                  <td className="p-3 text-slate-800 font-semibold">{w.managerName}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedWH(w)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs"
                    >
                      Cek Stok
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWH && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                  {selectedWH.code}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">{selectedWH.name}</h3>
              </div>
              <button onClick={() => setSelectedWH(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Rincian Stok Barang di {selectedWH.name}</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Stok di Gudang ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                        <td className="p-2.5 text-right font-extrabold text-blue-700">
                          {Math.floor(p.stock * 0.5)} {p.uom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
