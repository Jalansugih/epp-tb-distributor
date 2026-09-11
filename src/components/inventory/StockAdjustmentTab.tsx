import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockAdjustment } from '../../types';
import {
  SlidersHorizontal,
  Plus,
  Search,
  PlusCircle,
  MinusCircle,
  FileText,
  Warehouse,
  X,
  AlertCircle
} from 'lucide-react';

export const StockAdjustmentTab: React.FC<{
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: (productCode?: string) => void;
  presetProductCode?: string;
}> = ({ isOpenCreateModal, onCloseCreateModal, onOpenCreateModal, presetProductCode }) => {
  const { stockAdjustments, products, warehouses, addStockAdjustment, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<'Increase' | 'Decrease'>('Decrease');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Selisih Opname Fisik');
  const [reference, setReference] = useState(`SO-OPNAME-${new Date().toISOString().slice(0, 7)}`);
  const [operatorUser, setOperatorUser] = useState('Supervisor Gudang');
  const [notes, setNotes] = useState('');

  // Set initial product if preset given
  React.useEffect(() => {
    if (presetProductCode) {
      const match = products.find((p) => p.code === presetProductCode);
      if (match) setProductId(match.id);
    }
  }, [presetProductCode, products]);

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = products.find((p) => p.id === productId || p.code === productId);
    if (!selectedProduct) {
      addToast('Pilih barang material terlebih dahulu!', 'warning');
      return;
    }
    if (qty <= 0) {
      addToast('Jumlah penyesuaian (qty) harus lebih besar dari 0!', 'warning');
      return;
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

    const newAdj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustmentNo: `ADJ/2026/08/${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 10),
      type: adjustmentType,
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      uom: selectedProduct.uom,
      qty,
      reason,
      reference,
      user: operatorUser,
      notes
    };

    addStockAdjustment(newAdj);
    onCloseCreateModal();

    // Reset Form
    setQty(1);
    setNotes('');
  };

  const filteredAdjustments = stockAdjustments.filter((adj) => {
    const matchesSearch =
      adj.adjustmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || adj.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor penyesuaian, kode barang, alasan opname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Jenis Adjustment</option>
            <option value="Increase">Penambahan (+ Increase)</option>
            <option value="Decrease">Pengurangan (- Decrease)</option>
          </select>

          <button
            onClick={() => onOpenCreateModal()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Stock Opname / Adjust</span>
          </button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. Adjustment / Tanggal</th>
                <th className="py-3 px-4">Jenis & Jumlah Qty</th>
                <th className="py-3 px-4">Produk Material</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">Alasan & No. Referensi</th>
                <th className="py-3 px-4">Operator / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada catatan penyesuaian stok opname.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-amber-800">{adj.adjustmentNo}</p>
                      <p className="text-[10px] text-slate-400">{adj.date}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {adj.type === 'Increase' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs flex items-center gap-1 w-fit">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> +{adj.qty} {adj.uom}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-black text-xs flex items-center gap-1 w-fit">
                          <MinusCircle className="w-3.5 h-3.5 text-rose-600" /> -{adj.qty} {adj.uom}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{adj.productName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{adj.productCode}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{adj.warehouseName}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{adj.reason}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {adj.reference || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{adj.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Adjustment */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Input Penyesuaian Stok (Stock Opname)</h3>
              </div>
              <button onClick={onCloseCreateModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Increase')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    adjustmentType === 'Increase'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Penambahan (+ Increase)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustmentType('Decrease')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    adjustmentType === 'Decrease'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Pengurangan (- Decrease)</span>
                </button>
              </div>

              {/* Warehouse & Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Gudang Location</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Barang Material</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} (Stok Saat Ini: {p.stock} {p.uom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Qty Selisih</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Referensi / BA</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penyesuaian (Reason)</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                >
                  <option value="Selisih Lebih Opname Fisik">Selisih Lebih Opname Fisik</option>
                  <option value="Kerusakan / Pecah Saat Racking">Kerusakan / Pecah Saat Racking</option>
                  <option value="Kedaluwarsa / Expired">Kedaluwarsa / Expired</option>
                  <option value="Barang Ditemukan Kembali">Barang Ditemukan Kembali</option>
                  <option value="Koreksi System / Opening Error">Koreksi System / Opening Error</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Petugas / Operator Opname</label>
                <input
                  type="text"
                  value={operatorUser}
                  onChange={(e) => setOperatorUser(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Detail temuan fisik di lapangan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
