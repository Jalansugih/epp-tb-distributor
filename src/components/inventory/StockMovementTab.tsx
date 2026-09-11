import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovementType } from '../../types';
import {
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  SlidersHorizontal,
  RefreshCw,
  ShoppingBag,
  Building2,
  Package
} from 'lucide-react';

export const StockMovementTab: React.FC = () => {
  const { stockMovements, warehouses } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  const filteredMovements = stockMovements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.documentNo && m.documentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.referenceNo && m.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || m.type === selectedType;
    const matchesWarehouse =
      selectedWarehouse === 'all' || m.warehouseName === selectedWarehouse;

    return matchesSearch && matchesType && matchesWarehouse;
  });

  const getTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'Purchase':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Purchase (Penerimaan)
          </span>
        );
      case 'Sales':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <ArrowUpRight className="w-3 h-3 text-blue-600" /> Sales (Pengiriman)
          </span>
        );
      case 'Return':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <RefreshCw className="w-3 h-3 text-purple-600" /> Return (Retur)
          </span>
        );
      case 'Transfer':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <ArrowLeftRight className="w-3 h-3 text-cyan-600" /> Transfer Gudang
          </span>
        );
      case 'Adjustment':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <SlidersHorizontal className="w-3 h-3 text-amber-600" /> Adjustment
          </span>
        );
      case 'Opening Balance':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] flex items-center gap-1 w-fit">
            <Package className="w-3 h-3 text-slate-500" /> Saldo Awal
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Document No',
      'Reference No',
      'Type',
      'Product Code',
      'Product Name',
      'Warehouse',
      'Qty In',
      'Qty Out',
      'Balance',
      'UoM',
      'User',
      'Notes'
    ];

    const rows = filteredMovements.map((m) => [
      m.date,
      m.documentNo || '-',
      m.referenceNo || '-',
      m.type,
      m.productCode,
      `"${m.productName}"`,
      m.warehouseName,
      m.qtyIn || 0,
      m.qtyOut || 0,
      m.balance || 0,
      m.uom,
      m.user || m.operator || 'Admin',
      `"${m.notes || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor dokumen, kode barang, nama material, atau referensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Movement Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Jenis Mutasi</option>
            <option value="Purchase">Purchase (Pembelian/GR)</option>
            <option value="Sales">Sales (Penjualan/Delivery)</option>
            <option value="Return">Return (Retur Barang)</option>
            <option value="Transfer">Transfer Gudang</option>
            <option value="Adjustment">Adjustment (Opname)</option>
            <option value="Opening Balance">Opening Balance (Saldo Awal)</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Gudang</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">No. Dokumen / Ref</th>
                <th className="py-3 px-4">Jenis Mutasi</th>
                <th className="py-3 px-4">Produk / Barang</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4 text-right text-emerald-700">Masuk (In)</th>
                <th className="py-3 px-4 text-right text-rose-700">Keluar (Out)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Saldo Mutasi</th>
                <th className="py-3 px-4">Operator / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada histori mutasi stok yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {m.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-900">{m.documentNo || m.referenceNo || '-'}</p>
                      {m.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{m.notes}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getTypeBadge(m.type)}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{m.productName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{m.productCode}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{m.warehouseName}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {m.qtyIn > 0 ? `+${m.qtyIn.toLocaleString('id-ID')} ${m.uom}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {m.qtyOut > 0 ? `-${m.qtyOut.toLocaleString('id-ID')} ${m.uom}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {m.balance ? `${m.balance.toLocaleString('id-ID')} ${m.uom}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.user || m.operator || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          Menampilkan total {filteredMovements.length} rekam jejak mutasi persediaan.
        </div>
      </div>
    </div>
  );
};
