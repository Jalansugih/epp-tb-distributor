import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Warehouse } from '../../types';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  MapPin,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building,
  Boxes,
  X,
  Edit,
  Trash2
} from 'lucide-react';

export const WarehouseTab: React.FC = () => {
  const { warehouses, products, addWarehouse, updateWarehouse, deleteWarehouse, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('1,200 m²');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const handleOpenAdd = () => {
    setEditingWh(null);
    setCode(`WH-0${warehouses.length + 1}`);
    setName('');
    setAddress('');
    setManager('');
    setPhone('');
    setCapacity('1,000 m²');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWh(wh);
    setCode(wh.code);
    setName(wh.name);
    setAddress(wh.address);
    setManager(wh.manager || '');
    setPhone(wh.phone || '');
    setCapacity(wh.capacity || '1,000 m²');
    setStatus(wh.status || 'active');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !address) {
      addToast('Harap isi kode, nama, dan alamat gudang!', 'warning');
      return;
    }

    if (editingWh) {
      updateWarehouse({
        ...editingWh,
        code,
        name,
        address,
        manager,
        phone,
        capacity,
        status
      });
      addToast(`Gudang ${name} berhasil diperbarui!`, 'success');
    } else {
      const newWh: Warehouse = {
        id: `wh-${Date.now()}`,
        code,
        name,
        address,
        manager,
        phone,
        capacity,
        status
      };
      addWarehouse(newWh);
      addToast(`Gudang baru ${name} berhasil ditambahkan!`, 'success');
    }

    setIsModalOpen(false);
  };

  const filteredWarehouses = warehouses.filter((w) => {
    return (
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.manager && w.manager.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari gudang berdasarkan nama, kode, alamat, atau kepala gudang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Gudang Baru</span>
        </button>
      </div>

      {/* Warehouse Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((wh) => {
          // Count items allocated to this warehouse
          const whProducts = products.filter((p) => p.warehouseName === wh.name);
          const totalStockCount = whProducts.reduce((acc, p) => acc + p.stock, 0);

          return (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 bg-slate-100 font-mono font-bold text-slate-800 text-[11px] rounded-lg">
                    {wh.code}
                  </span>
                  {wh.status === 'active' ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold rounded-full">
                      Non-Aktif
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{wh.name}</h3>

                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{wh.address}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kepala Gudang</span>
                    <span className="font-bold text-slate-800">{wh.manager || 'Supriatna'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kapasitas Gudang</span>
                    <span className="font-bold text-slate-800">{wh.capacity || '1,500 m²'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>{whProducts.length} SKU ({totalStockCount.toLocaleString('id-ID')} Total Qty)</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(wh)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Gudang"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus gudang ${wh.name}?`)) {
                        deleteWarehouse(wh.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Gudang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Warehouse */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingWh ? 'Edit Data Gudang' : 'Tambah Gudang Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Gudang</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Operational</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Gudang / Cabang</label>
                <input
                  type="text"
                  placeholder="Contoh: Gudang Cabang Semarang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Gudang</label>
                <textarea
                  rows={2}
                  placeholder="Jalan, Kawasan Industri, Kota..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Gudang</label>
                  <input
                    type="text"
                    placeholder="E.g. Bambang S."
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas Ruang (m²)</label>
                  <input
                    type="text"
                    placeholder="1,500 m²"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>
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
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
