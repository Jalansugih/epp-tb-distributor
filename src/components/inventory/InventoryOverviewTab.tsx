import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Package,
  AlertTriangle,
  Warehouse,
  Barcode,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Boxes,
  Truck,
  Layers
} from 'lucide-react';

export const InventoryOverviewTab: React.FC<{
  onNavigateTab: (tab: string) => void;
  onOpenAdjustmentModal: () => void;
  onOpenTransferModal: () => void;
}> = ({ onNavigateTab, onOpenAdjustmentModal, onOpenTransferModal }) => {
  const { products, warehouses, batchSerials, stockMovements, addToast, setCurrentView } = useApp();

  // KPIs
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);
  const totalSellingValue = products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalProducts = products.length;
  const activeWarehouses = warehouses.filter((w) => w.status === 'active').length;
  const totalBatches = batchSerials.length;

  // Fast & Slow moving analytics, computed from real stock-out movements per product
  const movementByProduct = new Map<string, { qtyOut: number; lastDate: string }>();
  stockMovements
    .filter((m) => (m.qtyOut ?? 0) > 0)
    .forEach((m) => {
      const key = m.productId || m.productCode;
      const entry = movementByProduct.get(key) || { qtyOut: 0, lastDate: m.date };
      entry.qtyOut += m.qtyOut ?? 0;
      if (m.date > entry.lastDate) entry.lastDate = m.date;
      movementByProduct.set(key, entry);
    });

  const movementRanked = products
    .map((p) => {
      const mv = movementByProduct.get(p.id) || movementByProduct.get(p.code);
      return { product: p, qtyOut: mv?.qtyOut ?? 0, lastDate: mv?.lastDate };
    })
    .filter((r) => r.qtyOut > 0);

  const daysSince = (dateStr?: string) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };

  const fastMovingProducts = [...movementRanked]
    .sort((a, b) => b.qtyOut - a.qtyOut)
    .slice(0, 3)
    .map((r) => ({
      code: r.product.code,
      name: r.product.name,
      uom: r.product.uom,
      stock: r.product.stock,
      turnover: `${r.qtyOut} ${r.product.uom} keluar`,
      trend: ''
    }));

  const slowMovingProducts = [...movementRanked]
    .sort((a, b) => a.qtyOut - b.qtyOut)
    .slice(0, 2)
    .map((r) => ({
      code: r.product.code,
      name: r.product.name,
      uom: r.product.uom,
      stock: r.product.stock,
      turnover: `${r.qtyOut} ${r.product.uom} keluar`,
      age: daysSince(r.lastDate) != null ? `${daysSince(r.lastDate)} Hari` : '-'
    }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Aset Stok</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{formatRupiah(totalStockValue)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Nilai Jual: <span className="text-blue-700 font-bold">{formatRupiah(totalSellingValue)}</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Item Barang</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{totalProducts} SKU</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Terdaftar di Katalog</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peringatan Stok Menipis</span>
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600">{lowStockProducts.length} Material</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Di bawah batas minimum stok</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gudang Aktif</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Warehouse className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{activeWarehouses} Lokasi</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {warehouses.filter((w) => w.status === 'active').map((w) => w.name).join(', ') || 'Belum ada gudang'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Batch / Lot</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Barcode className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{totalBatches} Lot Active</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Tracking Terkendali</p>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="font-extrabold text-sm tracking-wide">Pusat Manajemen & Operasional Gudang ERP</h3>
          <p className="text-xs text-blue-200 mt-0.5">
            Lakukan mutasi barang, transfer antar gudang, penyesuaian stok opname, atau cek nomor batch produksi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>+ Transfer Gudang</span>
          </button>
          <button
            onClick={onOpenAdjustmentModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>+ Stok Opname</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20"
          >
            <span>Cek Laporan Stok</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert & Fast/Slow Moving Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Peringatan Material Di Bawah Minimum</h3>
                <p className="text-xs text-slate-500">Daftar barang yang perlu segera direstock / dipesan ke pabrik</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('stock')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Lihat Semua Stok
            </button>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-800">{p.code}</span>
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gudang: <span className="font-semibold text-slate-700">{p.warehouseName}</span> | Batas Min:{' '}
                    <span className="font-bold text-slate-800">{p.minStock} {p.uom}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-black rounded-lg">
                    {p.stock} {p.uom}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentView('purchase-requests');
                      addToast(`Dialihkan ke modul Pembelian untuk restock ${p.name}`, 'info');
                    }}
                    className="block text-[10px] text-blue-700 hover:underline font-bold mt-1"
                  >
                    + Buat PR Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fast Moving vs Slow Moving Products */}
        <div className="space-y-4">
          {/* Fast Moving */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Fast Moving Products (Turnover Tinggi)</h3>
            </div>
            <div className="space-y-2">
              {fastMovingProducts.map((fm, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{fm.name}</p>
                    <p className="text-[11px] text-slate-500">Rata-rata Penjualan: <span className="font-semibold text-slate-800">{fm.turnover}</span></p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]">
                    {fm.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Slow Moving Products (Pengendapan Stok)</h3>
            </div>
            <div className="space-y-2">
              {slowMovingProducts.map((sm, idx) => (
                <div key={idx} className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{sm.name}</p>
                    <p className="text-[11px] text-slate-500">Umur di Gudang: <span className="font-semibold text-rose-700">{sm.age}</span> | Turnover: {sm.turnover}</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px]">
                    Evaluasi Promo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
