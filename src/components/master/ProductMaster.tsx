import { generateId, generateNumericCode } from '../../lib/identifiers';
import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Package,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  Percent,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Tag,
  ShieldAlert,
  Layers,
  Ruler,
  DollarSign
} from 'lucide-react';

export const ProductMaster: React.FC = () => {
  const {
    products,
    categories,
    brands,
    uoms,
    warehouses,
    addProduct,
    updateProduct,
    deleteProduct,
    openDiscountModal
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Detail Drawer State
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'inventory' | 'sales_history' | 'purchase_history' | 'pricing' | 'uom_conversions' | 'activity'
  >('overview');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    code: '',
    name: '',
    category: categories[0]?.name || 'Semen & Pasir',
    brand: brands[0]?.name || 'Tiga Roda',
    uom: 'Sak',
    buyPrice: 60000,
    sellPrice: 68000,
    stock: 500,
    minStock: 100,
    barcode: '',
    weightKg: 40,
    status: 'active'
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const totalCatalogItems = products.length;
  const lowStockCount = products.filter((p) => p.stock <= (p.minStock || 50)).length;
  const totalStockValuation = products.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);

  const handleOpenAdd = () => {
    const nextCode = `MAT-10${products.length + 1}`;
    setEditingProduct(null);
    setFormData({
      code: nextCode,
      name: '',
      category: categories[0]?.name || 'Semen & Pasir',
      brand: brands[0]?.name || 'Tiga Roda',
      uom: 'Sak',
      buyPrice: 50000,
      sellPrice: 58000,
      stock: 200,
      minStock: 50,
      barcode: generateNumericCode('899', 9),
      weightKg: 10,
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData(prod);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const prodData: Product = {
      id: editingProduct ? editingProduct.id : generateId('prod'),
      code: formData.code || '',
      sku: formData.sku || formData.code || '',
      barcode: formData.barcode || generateNumericCode('899', 9),
      name: formData.name || '',
      category: formData.category || 'Semen & Pasir',
      brand: formData.brand || 'Tiga Roda',
      uom: formData.uom || 'Sak',
      buyPrice: Number(formData.buyPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 50,
      weightKg: Number(formData.weightKg) || 1,
      taxPercent: 11,
      warehouseId: formData.warehouseId || warehouses[0]?.id || '',
      warehouseName: formData.warehouseName || warehouses[0]?.name || 'Belum ditentukan',
      status: formData.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
      warehouses: [
        ...(warehouses.length ? warehouses.map((w, index) => ({ warehouseId: w.id, warehouseName: w.name, stock: index === 0 ? Number(formData.stock || 0) : 0 })) : [])
      ],
      uomConversions: [
        { uomName: 'Sak', ratio: 1, isBase: true, sellPrice: Number(formData.sellPrice) || 0 },
        { uomName: 'Pallet (50 Sak)', ratio: 50, isBase: false, sellPrice: (Number(formData.sellPrice) || 0) * 49 }
      ]
    };

    if (editingProduct) {
      updateProduct(prodData);
    } else {
      addProduct(prodData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk material ${name}?`)) {
      deleteProduct(id);
      if (activeProduct?.id === id) setActiveProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Katalog Material</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{totalCatalogItems} SKU</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Siap untuk SO / PO</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Peringatan Stok Menipis</p>
            <h3 className="text-xl font-extrabold text-amber-600 mt-1">{lowStockCount} Produk</h3>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Perlu Re-Order PO Pabrik</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Nilai Aset Persediaan (HPP)</p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">{formatRupiah(totalStockValuation)}</h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">Nilai Buku Gudang</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode material, nama produk, merek, atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Merek Principal</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openDiscountModal()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Percent className="w-4 h-4 text-blue-600" />
              <span>Simulator Diskon Beruntun</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 whitespace-nowrap transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Material</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode SKU</th>
                <th className="p-3">Nama Material Bangunan</th>
                <th className="p-3">Merek & Kategori</th>
                <th className="p-3">Satuan (UoM)</th>
                <th className="p-3 text-right">Harga Beli Pabrik</th>
                <th className="p-3 text-right">Harga Jual List</th>
                <th className="p-3 text-right">Stok Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= (p.minStock || 50);

                return (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{p.code}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800 font-bold">{p.brand}</div>
                      <div className="text-[11px] text-slate-500">{p.category}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200">
                        {p.uom}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-600 font-semibold">{formatRupiah(p.buyPrice)}</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{formatRupiah(p.sellPrice)}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-black ${isLow ? 'text-rose-600 font-mono' : 'text-slate-900'}`}
                      >
                        {p.stock.toLocaleString('id-ID')} {p.uom}
                      </span>
                      {isLow && (
                        <span className="block text-[9px] font-bold text-rose-500 uppercase">Min: {p.minStock}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setActiveProduct(p);
                            setDetailTab('overview');
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Detail Produk"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER FOR PRODUCT */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                    {activeProduct.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 text-xs font-bold">
                    {activeProduct.brand}
                  </span>
                </div>
                <h2 className="text-lg font-black mt-1 text-white">{activeProduct.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeProduct.category} • Barcode: {activeProduct.barcode}</p>
              </div>

              <button
                onClick={() => setActiveProduct(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price & Stock Quick Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Harga Beli Pabrik</span>
                <p className="text-xs font-extrabold text-slate-700 mt-0.5">{formatRupiah(activeProduct.buyPrice)}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Harga Jual List</span>
                <p className="text-xs font-extrabold text-blue-700 mt-0.5">{formatRupiah(activeProduct.sellPrice)}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Stok</span>
                <p className="text-xs font-extrabold text-emerald-600 mt-0.5">
                  {activeProduct.stock} {activeProduct.uom}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 scrollbar-none">
              {(
                [
                  { id: 'overview', label: 'Overview Specs' },
                  { id: 'inventory', label: 'Stok per Gudang' },
                  { id: 'sales_history', label: 'Riwayat Penjualan' },
                  { id: 'purchase_history', label: 'Riwayat PO Pabrik' },
                  { id: 'pricing', label: 'Diskon & Price List' },
                  { id: 'uom_conversions', label: 'Konversi UoM' }
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 border-b pb-2">Spesifikasi Fisik & Perpajakan</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 font-semibold">Satuan Dasar (Base UoM):</span>
                        <p className="font-extrabold text-slate-900 mt-0.5">{activeProduct.uom}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Berat Satuan (Kg):</span>
                        <p className="font-bold text-slate-800 mt-0.5">{activeProduct.weightKg || 40} kg</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">PPN Faktur:</span>
                        <p className="font-bold text-emerald-700 mt-0.5">11% (Inklusif/Eksklusif)</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Batas Minimum Stok:</span>
                        <p className="font-bold text-rose-600 mt-0.5">{activeProduct.minStock || 50} Sak</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'inventory' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Sebaran Stok di Lokasi Gudang Distributor</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeProduct.warehouses && activeProduct.warehouses.length > 0 ? (
                      activeProduct.warehouses.map((wh) => (
                        <div key={wh.warehouseId} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block">{wh.warehouseName}</span>
                          <p className="text-sm font-extrabold text-slate-900 mt-1">
                            {wh.stock} {activeProduct.uom}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-3 bg-slate-50 rounded-xl text-center text-slate-500">
                        Stok terdistribusi di Gudang Utama Balaraja ({activeProduct.stock} {activeProduct.uom})
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'sales_history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Riwayat Penjualan Produk ini ke Toko</h4>
                  <p className="text-slate-500">Semua SO yang memuat SKU ini dalam 30 hari terakhir.</p>
                </div>
              )}

              {detailTab === 'purchase_history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Riwayat Pembelian ke Pabrik Principal</h4>
                  <p className="text-slate-500">Riwayat penerimaan barang (Goods Receipt / GR) dari pabrik.</p>
                </div>
              )}

              {detailTab === 'pricing' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Skema Harga & Multi-Diskon Beruntun</h4>
                  <button
                    onClick={() => openDiscountModal(activeProduct.sellPrice, activeProduct.defaultDiscounts)}
                    className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-bold text-center hover:bg-blue-100"
                  >
                    Buka Simulator Diskon Beruntun untuk SKU ini
                  </button>
                </div>
              )}

              {detailTab === 'uom_conversions' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Multi-Satuan & Ratio Konversi (UoM)</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-bold border-b pb-2">
                      <span>Satuan</span>
                      <span>Ratio Konversi</span>
                      <span>Harga Standar</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span>1 Sak (Base)</span>
                      <span>1.0</span>
                      <span>{formatRupiah(activeProduct.sellPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-slate-600">
                      <span>1 Pallet</span>
                      <span>50 Sak</span>
                      <span>{formatRupiah(activeProduct.sellPrice * 49)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL FOR ADD/EDIT */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingProduct ? 'Edit Katalog Material' : 'Tambah Material Bangunan Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Material Bangunan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Semen Portland Type I 40kg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merek / Principal</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Dasar (UoM)</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {uoms.map((u) => (
                      <option key={u.id} value={u.symbol || u.name}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gudang Penyimpanan Utama</label>
                  <select
                    value={formData.warehouseId || warehouses[0]?.id || ''}
                    onChange={(e) => {
                      const wh = warehouses.find((w) => w.id === e.target.value);
                      setFormData({ ...formData, warehouseId: e.target.value, warehouseName: wh?.name || '' });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="">— Belum ditentukan —</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli Pabrik (HPP)</label>
                  <input
                    type="number"
                    required
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Jual List Toko</label>
                  <input
                    type="number"
                    required
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-extrabold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Min Stok</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berat per Unit (Kg)</label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
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
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
