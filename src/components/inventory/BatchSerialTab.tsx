import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BatchSerialItem } from '../../types';
import {
  Barcode,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  Package
} from 'lucide-react';

export const BatchSerialTab: React.FC = () => {
  const { batchSerials, products, warehouses, addBatchSerial, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [productId, setProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [warehouseName, setWarehouseName] = useState(warehouses[0]?.name || 'Gudang Utama Cengkareng');
  const [qty, setQty] = useState(100);

  const handleOpenAddModal = () => {
    setBatchNumber(`LOT-3R-${new Date().toISOString().slice(0, 7).replace('-', '')}`);
    setSerialNumber('');
    setLotNumber('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const p = products.find((prod) => prod.id === productId || prod.code === productId);
    if (!p) {
      addToast('Pilih barang material terlebih dahulu!', 'warning');
      return;
    }

    const newItem: BatchSerialItem = {
      id: `bs-${Date.now()}`,
      productId: p.id,
      productCode: p.code,
      productName: p.name,
      batchNumber: batchNumber || undefined,
      serialNumber: serialNumber || undefined,
      lotNumber: lotNumber || undefined,
      expiryDate,
      warehouseName,
      qty,
      uom: p.uom,
      status: 'Available'
    };

    addBatchSerial(newItem);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: BatchSerialItem['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
            Available (Tersedia)
          </span>
        );
      case 'Near Expiry':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Near Expiry (&lt; 30 Hari)
          </span>
        );
      case 'Expired':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
            Expired (Kedaluwarsa)
          </span>
        );
      case 'Allocated':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
            Allocated (Dialokasikan)
          </span>
        );
    }
  };

  const filteredItems = batchSerials.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.lotNumber && item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor batch, nomor lot, serial, atau kode barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Status Batch</option>
            <option value="Available">Available (Tersedia)</option>
            <option value="Near Expiry">Mendekati Expired</option>
            <option value="Expired">Kedaluwarsa</option>
            <option value="Allocated">Allocated</option>
          </select>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Batch / Lot</span>
          </button>
        </div>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Produk Material</th>
                <th className="py-3 px-4">Batch / Lot Number</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Tanggal Expired</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Qty Batch</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada nomor batch atau serial yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{item.productCode}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {item.batchNumber || item.lotNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{item.serialNumber || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.expiryDate || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{item.warehouseName}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {item.qty.toLocaleString('id-ID')} {item.uom}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Batch / Serial */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Register Nomor Batch / Lot Baru</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Produk Material</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Batch / Lot</label>
                  <input
                    type="text"
                    placeholder="LOT-202608-A"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Seri (Serial No)</label>
                  <input
                    type="text"
                    placeholder="SNI-KS-9012"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Expired</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Qty Batch</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Gudang Penyimpanan</label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Simpan Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
