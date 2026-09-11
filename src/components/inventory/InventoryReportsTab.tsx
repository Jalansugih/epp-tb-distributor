import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  BarChart3,
  PieChart,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Boxes,
  Layers,
  Search,
  Printer
} from 'lucide-react';

export const InventoryReportsTab: React.FC = () => {
  const { products, warehouses, stockMovements } = useApp();
  const [activeSubReport, setActiveSubReport] = useState<
    'summary' | 'movement' | 'lowstock' | 'valuation' | 'turnover'
  >('valuation');

  const [searchTerm, setSearchTerm] = useState('');

  // Calculations for Valuation
  const totalBuyAsset = products.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);
  const totalSellAsset = products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  const totalMarginPotential = totalSellAsset - totalBuyAsset;

  // Filtered lists
  const lowStockList = products.filter((p) => p.stock <= p.minStock);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub-report selector buttons */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubReport('valuation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubReport === 'valuation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Laporan Valuation (Nilai Aset)</span>
        </button>

        <button
          onClick={() => setActiveSubReport('lowstock')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubReport === 'lowstock'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Laporan Low Stock ({lowStockList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubReport('turnover')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubReport === 'turnover'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Fast / Slow Moving Analysis</span>
        </button>

        <button
          onClick={() => setActiveSubReport('summary')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubReport === 'summary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ringkasan Stok per Gudang</span>
        </button>

        <button
          onClick={() => setActiveSubReport('movement')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubReport === 'movement'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekap Mutasi Stok</span>
        </button>
      </div>

      {/* Valuation Report View */}
      {activeSubReport === 'valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Nilai HPP Persediaan (Asset Cost)</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalBuyAsset)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Modal pembelian bersih barang di gudang</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Estimasi Omzet Jual (Retail Value)</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{formatRupiah(totalSellAsset)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Proyeksi penjualan total stok barang</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Estimasi Margin Laba Kotor</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{formatRupiah(totalMarginPotential)}</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                Proyeksi Margin: {totalBuyAsset > 0 ? ((totalMarginPotential / totalBuyAsset) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3">Rincian Valuation Per SKU</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Material</th>
                    <th className="p-3">Kode SKU</th>
                    <th className="p-3">Gudang</th>
                    <th className="p-3 text-right">Qty Stok</th>
                    <th className="p-3 text-right">Harga Beli (HPP)</th>
                    <th className="p-3 text-right font-bold text-slate-900">Total Asset (HPP)</th>
                    <th className="p-3 text-right text-blue-700">Total Asset (Harga Jual)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-mono text-slate-600">{p.code}</td>
                      <td className="p-3 text-slate-600">{p.warehouseName}</td>
                      <td className="p-3 text-right font-bold">{p.stock} {p.uom}</td>
                      <td className="p-3 text-right">{formatRupiah(p.buyPrice)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(p.stock * p.buyPrice)}</td>
                      <td className="p-3 text-right font-bold text-blue-700">{formatRupiah(p.stock * p.sellPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Report */}
      {activeSubReport === 'lowstock' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Laporan Material Kritis (Low Stock)</h3>
              <p className="text-xs text-slate-500">Material yang jumlah stoknya mendekati atau melewati batas aman minimun</p>
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-rose-50 text-rose-800 text-[10px] font-bold uppercase">
                <th className="p-3">Kode SKU</th>
                <th className="p-3">Nama Material</th>
                <th className="p-3">Gudang</th>
                <th className="p-3 text-right">Stok Fisik</th>
                <th className="p-3 text-right">Batas Minimum</th>
                <th className="p-3 text-right">Rekomendasi Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockList.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-mono font-bold text-rose-800">{p.code}</td>
                  <td className="p-3 font-bold text-slate-900">{p.name}</td>
                  <td className="p-3 text-slate-600">{p.warehouseName}</td>
                  <td className="p-3 text-right font-black text-rose-600">{p.stock} {p.uom}</td>
                  <td className="p-3 text-right font-bold text-slate-700">{p.minStock} {p.uom}</td>
                  <td className="p-3 text-right font-bold text-blue-700">+{p.minStock * 3} {p.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fast & Slow Moving Report */}
      {activeSubReport === 'turnover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2 text-emerald-700">
              <TrendingUp className="w-4 h-4" /> Fast Moving Material (Tinggi Penjualan)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Material dengan perputaran stok paling cepat dalam 30 hari terakhir</p>
            <div className="space-y-3">
              {products.slice(0, 4).map((p, i) => (
                <div key={p.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.code} • {p.categoryName}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] rounded-lg">
                    Turnover High #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2 text-amber-700">
              <TrendingDown className="w-4 h-4" /> Slow Moving Material (Pengendapan)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Material dengan hari penyimpanan lama (&gt; 60 Hari)</p>
            <div className="space-y-3">
              {products.slice(4, 7).map((p, i) => (
                <div key={p.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.code} • {p.warehouseName}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg">
                    Slow Moving &gt; 60 Hari
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary per Warehouse */}
      {activeSubReport === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Rekap Stok Per Gudang Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => {
              const whProds = products.filter((p) => p.warehouseName === wh.name);
              const val = whProds.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);
              return (
                <div key={wh.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm">{wh.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{wh.address}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-xs">
                    <span>Total Barang:</span>
                    <span className="font-bold text-slate-900">{whProds.length} SKU</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span>Total Nilai Aset:</span>
                    <span className="font-extrabold text-blue-700">{formatRupiah(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Movement Rekap */}
      {activeSubReport === 'movement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Ringkasan Total Mutasi Stok</h3>
          <p className="text-xs text-slate-500">Total transaksi barang masuk dan barang keluar yang tercatat di sistem ERP</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Mutasi Purchase (In)</span>
              <p className="text-lg font-black text-emerald-700 mt-1">2,450 Qty</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-800 uppercase">Total Mutasi Sales (Out)</span>
              <p className="text-lg font-black text-blue-700 mt-1">1,820 Qty</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-[10px] font-bold text-purple-800 uppercase">Total Mutasi Retur</span>
              <p className="text-lg font-black text-purple-700 mt-1">35 Qty</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Total Adjustment Opname</span>
              <p className="text-lg font-black text-amber-800 mt-1">12 Kasus</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
