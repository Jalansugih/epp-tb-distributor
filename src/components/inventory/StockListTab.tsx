import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Package,
  Search,
  Filter,
  Download,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Plus
} from 'lucide-react';

export const StockListTab: React.FC<{
  onOpenAdjustmentModal: (productCode?: string) => void;
}> = ({ onOpenAdjustmentModal }) => {
  const { products, warehouses, purchaseOrders, salesOrders, setCurrentView } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Map incoming items per product code from open POs
  const incomingMap: Record<string, number> = {};
  purchaseOrders.forEach((po) => {
    if (po.status === 'Sent') {
      po.items.forEach((item) => {
        incomingMap[item.productCode] = (incomingMap[item.productCode] || 0) + item.qty;
      });
    }
  });

  // Map reserved items per product code from pending SOs
  const reservedMap: Record<string, number> = {};
  salesOrders.forEach((so) => {
    if (so.status === 'Approved' || so.status === 'Processing') {
      so.items.forEach((item) => {
        reservedMap[item.productCode] = (reservedMap[item.productCode] || 0) + item.qty;
      });
    }
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse =
      selectedWarehouse === 'all' || p.warehouseName === selectedWarehouse;

    const reserved = reservedMap[p.code] || 0;
    const available = p.stock - reserved;

    let status = 'In Stock';
    if (p.stock === 0) status = 'Out of Stock';
    else if (p.stock <= p.minStock) status = 'Low Stock';

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'low' && status === 'Low Stock') ||
      (selectedStatus === 'out' && status === 'Out of Stock') ||
      (selectedStatus === 'available' && available > 0);

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'Category',
      'Warehouse',
      'UoM',
      'On Hand',
      'Reserved',
      'Available',
      'Incoming',
      'Status',
      'Buy Price',
      'Asset Value'
    ];

    const rows = filteredProducts.map((p) => {
      const reserved = reservedMap[p.code] || 0;
      const available = Math.max(0, p.stock - reserved);
      const incoming = incomingMap[p.code] || 0;
      let status = 'In Stock';
      if (p.stock === 0) status = 'Out of Stock';
      else if (p.stock <= p.minStock) status = 'Low Stock';

      return [
        p.code,
        `"${p.name}"`,
        p.categoryName,
        p.warehouseName,
        p.uom,
        p.stock,
        reserved,
        available,
        incoming,
        status,
        p.buyPrice,
        p.stock * p.buyPrice
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
            placeholder="Cari berdasarkan nama barang, SKU/kode, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Warehouse Selector */}
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

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="low">Stok Menipis (Alert)</option>
            <option value="out">Habis (Out of Stock)</option>
            <option value="available">Tersedia (Available &gt; 0)</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setCurrentView('master-products')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Master Barang</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Informasi Produk / Barang</th>
                <th className="py-3 px-4">SKU / Kode</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">UoM</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right text-amber-700">Reserved</th>
                <th className="py-3 px-4 text-right text-blue-700 font-extrabold">Available</th>
                <th className="py-3 px-4 text-right text-emerald-700">Incoming</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data stok produk yang memenuhi filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const reserved = reservedMap[p.code] || 0;
                  const available = p.stock - reserved;
                  const incoming = incomingMap[p.code] || 0;

                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 justify-center">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock
                    </span>
                  );

                  if (p.stock === 0) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-300 font-bold text-[10px] flex items-center gap-1 justify-center">
                        Out of Stock
                      </span>
                    );
                  } else if (p.stock <= p.minStock) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1 justify-center">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.categoryName} • {p.brandName}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-bold">{p.code}</td>
                      <td className="py-3 px-4 text-slate-600">{p.warehouseName}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{p.uom}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {p.stock.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">
                        {reserved > 0 ? reserved.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-blue-700">
                        {available.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {incoming > 0 ? `+${incoming.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">{statusBadge}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenAdjustmentModal(p.code)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
                          title="Penyesuaian / Opname Stok"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            Rumus Persediaan: <span className="font-bold text-blue-700">Available = On Hand - Reserved</span>
          </p>
          <p>Total {filteredProducts.length} Produk Ditampilkan</p>
        </div>
      </div>
    </div>
  );
};
