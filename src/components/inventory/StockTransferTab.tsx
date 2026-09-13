import { generateDocumentNo, generateId } from '../../lib/identifiers';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockTransfer, StockTransferItem } from '../../types';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Warehouse,
  Send,
  User,
  X,
  Package
} from 'lucide-react';

export const StockTransferTab: React.FC<{
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}> = ({ isOpenCreateModal, onCloseCreateModal, onOpenCreateModal }) => {
  const { stockTransfers, warehouses, products, addStockTransfer, updateStockTransferStatus, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Form State
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<StockTransferItem[]>([]);

  // Item row input
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferQty, setTransferQty] = useState(10);

  const handleAddItem = () => {
    const p = products.find((prod) => prod.id === selectedProductId || prod.code === selectedProductId);
    if (!p) {
      addToast('Pilih produk terlebih dahulu!', 'warning');
      return;
    }
    if (transferQty <= 0) {
      addToast('Jumlah transfer harus lebih besar dari 0!', 'warning');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        uom: p.uom,
        qty: transferQty
      }
    ]);
    setSelectedProductId('');
    setTransferQty(10);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTransfer = (status: 'Draft' | 'Submitted' | 'Approved') => {
    if (fromWarehouseId === toWarehouseId) {
      addToast('Gudang Asal dan Gudang Tujuan tidak boleh sama!', 'danger');
      return;
    }
    if (items.length === 0) {
      addToast('Tambahkan minimal 1 item barang yang akan ditransfer!', 'warning');
      return;
    }

    const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === toWarehouseId);

    const newTransfer: StockTransfer = {
      id: generateId('trf'),
      transferNo: generateDocumentNo('TRF'),
      date: new Date().toISOString().slice(0, 10),
      fromWarehouseId,
      fromWarehouseName: fromWh ? fromWh.name : 'Gudang Asal',
      toWarehouseId,
      toWarehouseName: toWh ? toWh.name : 'Gudang Tujuan',
      driverName: driverName || 'Driver Operasional',
      vehicleNo: vehicleNo || 'B 9000 ERP',
      items,
      status,
      createdUser: 'Admin ERP',
      notes
    };

    addStockTransfer(newTransfer);
    onCloseCreateModal();

    // Reset Form
    setItems([]);
    setDriverName('');
    setVehicleNo('');
    setNotes('');
  };

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">Draft</span>;
      case 'Submitted':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px]">Submitted</span>;
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px]">Approved</span>;
      case 'In Transit':
        return <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-[10px]">In Transit (Pengiriman)</span>;
      case 'Received':
        return <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-[10px]">Received</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px]">Completed (Selesai)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">{status}</span>;
    }
  };

  const filteredTransfers = stockTransfers.filter((st) => {
    const matchesSearch =
      st.transferNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.fromWarehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.toWarehouseName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatusFilter === 'all' || st.status === selectedStatusFilter;

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
            placeholder="Cari nomor dokumen transfer, gudang asal, atau tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Status Transfer</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="In Transit">In Transit</option>
            <option value="Received">Received</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Transfer Baru</span>
          </button>
        </div>
      </div>

      {/* Transfer List Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. Transfer / Tanggal</th>
                <th className="py-3 px-4">Alur Transfer (Asal &rarr; Tujuan)</th>
                <th className="py-3 px-4">Pengemudi / No. Kendaraan</th>
                <th className="py-3 px-4 text-center">Jumlah Barang</th>
                <th className="py-3 px-4 text-center">Status Workflow</th>
                <th className="py-3 px-4 text-center">Aksi Lanjutan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada dokumen transfer gudang.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-blue-700">{st.transferNo}</p>
                      <p className="text-[10px] text-slate-400">{st.date}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="p-1 bg-slate-100 text-slate-700 rounded-md text-[10px]">
                          {st.fromWarehouseName}
                        </span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="p-1 bg-blue-50 text-blue-800 rounded-md text-[10px]">
                          {st.toWarehouseName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-bold text-slate-800">{st.driverName || '-'}</p>
                      <p className="text-[10px] text-slate-400">{st.vehicleNo || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {st.items.reduce((acc, i) => acc + i.qty, 0)} Pcs ({st.items.length} SKU)
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(st.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {st.status === 'Draft' && (
                          <button
                            onClick={() => updateStockTransferStatus(st.id, 'Submitted')}
                            className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-lg hover:bg-blue-700"
                          >
                            Submit
                          </button>
                        )}
                        {st.status === 'Submitted' && (
                          <button
                            onClick={() => updateStockTransferStatus(st.id, 'Approved')}
                            className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg hover:bg-amber-400"
                          >
                            Setujui (Approve)
                          </button>
                        )}
                        {st.status === 'Approved' && (
                          <button
                            onClick={() => updateStockTransferStatus(st.id, 'In Transit')}
                            className="px-2.5 py-1 bg-purple-600 text-white font-bold text-[10px] rounded-lg hover:bg-purple-700"
                          >
                            Kirim (In Transit)
                          </button>
                        )}
                        {st.status === 'In Transit' && (
                          <button
                            onClick={() => updateStockTransferStatus(st.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700"
                          >
                            Konfirmasi Terima
                          </button>
                        )}
                        {st.status === 'Completed' && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Stock Transfer */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Buat Form Transfer Antar Gudang Baru</h3>
              </div>
              <button onClick={onCloseCreateModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Warehouses Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Asal (Pengirim)</label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Tujuan (Penerima)</label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transport info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengemudi / Driver</label>
                  <input
                    type="text"
                    placeholder="Contoh: Eko Raharjo"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Polisi Kendaraan</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 9210 UX"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Add Items row */}
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-xs text-slate-800 mb-2">Pilih Barang yang Ditransfer</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white"
                  >
                    <option value="">-- Pilih Produk Material --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} (Stok: {p.stock} {p.uom})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
                    className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold outline-none focus:bg-white"
                  />
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="p-2">Kode / Material</th>
                      <th className="p-2 text-center">Qty Transfer</th>
                      <th className="p-2 text-center">Satuan</th>
                      <th className="p-2 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Belum ada item ditambahkan.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <span className="font-mono font-bold text-slate-800">{item.productCode}</span> - {item.productName}
                          </td>
                          <td className="p-2 text-center font-bold text-blue-700">{item.qty}</td>
                          <td className="p-2 text-center text-slate-600">{item.uom}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-rose-600 font-bold">
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Keperluan Transfer</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi khusus pengiriman..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={onCloseCreateModal}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveTransfer('Draft')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Simpan Draft
              </button>
              <button
                onClick={() => handleSaveTransfer('Approved')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Simpan & Setujui Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
