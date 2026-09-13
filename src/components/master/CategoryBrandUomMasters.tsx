import { generateId } from '../../lib/identifiers';
import React, { useState } from 'react';
import { Category, Brand, Uom, DiscountRule } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import {
  Tags,
  Award,
  Ruler,
  Percent,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Layers,
  Building,
  BarChart3
} from 'lucide-react';

/* =========================================================================
   1. CATEGORY MASTER COMPONENT
   ========================================================================= */
export const CategoryMaster: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    code: '',
    name: '',
    description: '',
    status: 'active'
  });

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      code: `CAT-00${categories.length + 1}`,
      name: '',
      description: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData(cat);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const catData: Category = {
      id: editingCategory ? editingCategory.id : generateId('cat'),
      code: formData.code || '',
      name: formData.name || '',
      description: formData.description || '',
      totalProducts: editingCategory ? editingCategory.totalProducts || 12 : 12,
      totalStockValue: editingCategory ? editingCategory.totalStockValue || 0 : 0,
      subcategoriesCount: editingCategory ? editingCategory.subcategoriesCount : 3,
      productCount: editingCategory ? editingCategory.productCount : 12,
      status: (formData.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active')
    };

    if (editingCategory) {
      updateCategory(catData);
    } else {
      addCategory(catData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kategori bahan bangunan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Kategori Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Kategori Material</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-center">Sub-Kategori</th>
                <th className="p-3 text-center">Total Produk SKU</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{cat.code}</td>
                  <td className="p-3 font-bold text-slate-900">{cat.name}</td>
                  <td className="p-3 text-slate-600">{cat.description || '-'}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{cat.subcategoriesCount || 4}</td>
                  <td className="p-3 text-center font-extrabold text-blue-700">{cat.productCount || 15} SKU</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {cat.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCategory ? 'Edit Kategori Material' : 'Tambah Kategori Material Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Cat & Coating"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  Simpan Kategori
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
   2. BRAND MASTER COMPONENT
   ========================================================================= */
export const BrandMaster: React.FC = () => {
  const { brands, suppliers, addBrand, updateBrand, deleteBrand } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<Partial<Brand>>({
    code: '',
    name: '',
    supplierName: suppliers[0]?.name || 'PT Semen Tiga Roda Tbk',
    country: 'Indonesia',
    status: 'active'
  });

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setFormData({
      code: `BRD-00${brands.length + 1}`,
      name: '',
      supplierName: suppliers[0]?.name || 'PT Semen Tiga Roda Tbk',
      country: 'Indonesia',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setFormData(b);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const brandData: Brand = {
      id: editingBrand ? editingBrand.id : generateId('brd'),
      code: formData.code || '',
      name: formData.name || '',
      supplierName: formData.supplierName || suppliers[0]?.name || 'PT Utama',
      country: formData.country || 'Indonesia',
      originCountry: formData.country || 'Indonesia',
      totalProducts: editingBrand ? editingBrand.totalProducts || 8 : 8,
      productCount: editingBrand ? editingBrand.productCount : 8,
      status: (formData.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active')
    };

    if (editingBrand) {
      updateBrand(brandData);
    } else {
      addBrand(brandData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari merek / principal bahan bangunan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Merek / Principal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Merek Principal</th>
                <th className="p-3">Pabrik Induk / Supplier</th>
                <th className="p-3">Negara Asal</th>
                <th className="p-3 text-center">SKU Terdaftar</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((br) => (
                <tr key={br.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{br.code}</td>
                  <td className="p-3 font-bold text-slate-900">{br.name}</td>
                  <td className="p-3 text-slate-700 font-semibold">{br.supplierName}</td>
                  <td className="p-3 text-slate-600">{br.country || 'Indonesia'}</td>
                  <td className="p-3 text-center font-extrabold text-blue-700">{br.productCount || 10} SKU</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {br.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(br)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBrand(br.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBrand ? 'Edit Merek Principal' : 'Tambah Merek Principal Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Merek</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Merek / Brand</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Holcim / Dulux"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pabrik Supplier Induk</label>
                <select
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
                  Simpan Merek
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
   3. UOM MASTER COMPONENT (Units of Measure)
   ========================================================================= */
export const UomMaster: React.FC = () => {
  const { uoms, addUom, updateUom, deleteUom } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<Uom | null>(null);
  const [formData, setFormData] = useState<Partial<Uom>>({
    code: '',
    name: '',
    symbol: '',
    description: '',
    status: 'active'
  });

  const filtered = uoms.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingUom(null);
    setFormData({
      code: `UOM-0${uoms.length + 1}`,
      name: '',
      symbol: '',
      description: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Uom) => {
    setEditingUom(u);
    setFormData(u);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const uomData: Uom = {
      id: editingUom ? editingUom.id : generateId('uom'),
      code: formData.code || '',
      name: formData.name || '',
      symbol: formData.symbol || formData.name || '',
      description: formData.description || '',
      baseUnit: editingUom ? editingUom.baseUnit || 'Pcs' : 'Pcs',
      conversions: editingUom ? editingUom.conversions || [] : [],
      status: (formData.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active')
    };

    if (editingUom) {
      updateUom(uomData);
    } else {
      addUom(uomData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari satuan barang UoM (Sak, Batang, Dus, Lembar)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Satuan UoM</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Satuan (UoM)</th>
                <th className="p-3">Simbol / Singkatan</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{u.code}</td>
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold font-mono border border-blue-200">
                      {u.symbol}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{u.description || '-'}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteUom(u.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUom ? 'Edit Satuan UoM' : 'Tambah Satuan UoM Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode UoM</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Satuan Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kilogram / Batang / Pallet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Simbol / Singkatan</label>
                <input
                  type="text"
                  required
                  placeholder="Kg / Btg / Plt"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
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
                  Simpan Satuan
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
   4. DISCOUNT RULES MASTER COMPONENT
   ========================================================================= */
export const DiscountRuleMaster: React.FC = () => {
  const { discountRules, addDiscountRule, updateDiscountRule, deleteDiscountRule, openDiscountModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<DiscountRule | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<DiscountRule>>({ code:'', name:'', type:'percentage', value:0, minQty:0, maxQty:undefined, customerGroup:'', productId:'', productName:'', categoryId:'', categoryName:'', startDate:new Date().toISOString().slice(0,10), endDate:'2099-12-31', priority:1, sequence:1, status:'active' });
  const { products, categories } = useApp();
  const filtered = discountRules.filter(r => r.code.toLowerCase().includes(searchTerm.toLowerCase()) || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || (r.customerGroup || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const openAdd = () => { setEditing(null); setForm({code:`DISC-${String(discountRules.length+1).padStart(3,'0')}`,name:'',type:'percentage',value:0,minQty:0,maxQty:undefined,customerGroup:'',productId:'',productName:'',categoryId:'',categoryName:'',startDate:new Date().toISOString().slice(0,10),endDate:'2099-12-31',priority:discountRules.length+1,sequence:discountRules.length+1,status:'active'}); setOpen(true); };
  const openEdit = (r: DiscountRule) => { setEditing(r); setForm(r); setOpen(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.code || !form.name) return; const product = products.find(p=>p.id===form.productId); const cat = categories.find(c=>c.id===form.categoryId); const d: DiscountRule = { id: editing?.id || generateId('disc'), code:form.code, name:form.name, type:form.type || 'percentage', value:Number(form.value)||0, minQty:Number(form.minQty)||0, maxQty:form.maxQty===undefined ? undefined : Number(form.maxQty), customerGroup:form.customerGroup || '', productId:form.productId || undefined, productName:product?.name || form.productName || undefined, categoryId:form.categoryId || undefined, categoryName:cat?.name || form.categoryName || undefined, startDate:form.startDate || new Date().toISOString().slice(0,10), endDate:form.endDate || '2099-12-31', priority:Number(form.priority)||1, sequence:Number(form.sequence)||1, status:form.status || 'active' }; editing ? updateDiscountRule(d) : addDiscountRule(d); setOpen(false); };
  return <div className="space-y-4">
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"><div><h3 className="font-extrabold text-blue-900 text-sm">Aturan Diskon Beruntun Multi-Tier</h3><p className="text-xs text-blue-700 mt-0.5">Kelola aturan diskon, batas qty, sasaran pelanggan, periode dan prioritas.</p></div><div className="flex gap-2"><button onClick={()=>openDiscountModal()} className="px-4 py-2 bg-white border border-blue-300 text-blue-700 text-xs font-bold rounded-xl"><Percent className="w-4 h-4 inline mr-1"/>Simulator</button><button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"><Plus className="w-4 h-4 inline mr-1"/>Tambah Aturan</button></div></div>
    <div className="bg-white rounded-2xl border overflow-hidden"><div className="p-4 border-b bg-slate-50/70"><input className="w-full max-w-md px-3 py-2 border rounded-xl text-xs" placeholder="Cari kode, nama aturan, grup pelanggan..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-slate-100 text-[10px] uppercase"><th className="p-3">Kode</th><th className="p-3">Aturan</th><th className="p-3">Nilai</th><th className="p-3">Qty</th><th className="p-3">Sasaran</th><th className="p-3">Periode</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Aksi</th></tr></thead><tbody className="divide-y">{filtered.map(r=><tr key={r.id}><td className="p-3 font-mono font-bold text-blue-700">{r.code}</td><td className="p-3 font-extrabold">{r.name}<div className="text-[10px] text-slate-400">Prioritas #{r.priority} • Step #{r.sequence}</div></td><td className="p-3 font-bold">{r.type==='percentage'?`${r.value}%`:formatRupiah(r.value)}</td><td className="p-3">{r.minQty || 0}{r.maxQty!==undefined?` – ${r.maxQty}`:'+'}</td><td className="p-3">{r.customerGroup || 'Semua Pelanggan'}{r.productName && <div className="text-[10px] text-slate-400">{r.productName}</div>}</td><td className="p-3">{r.startDate} s/d {r.endDate}</td><td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">{r.status}</span></td><td className="p-3"><div className="flex justify-center gap-1"><button onClick={()=>openEdit(r)} className="p-1.5 bg-slate-100 rounded-lg"><Edit2 className="w-3.5 h-3.5"/></button><button onClick={()=>{if(confirm(`Hapus aturan ${r.name}?`))deleteDiscountRule(r.id)}} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button></div></td></tr>)}</tbody></table></div></div>
    {open && <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"><div className="flex justify-between border-b pb-3 mb-4"><h3 className="font-extrabold">{editing?'Edit':'Tambah'} Aturan Diskon</h3><button onClick={()=>setOpen(false)}><X/></button></div><form onSubmit={submit} className="grid grid-cols-2 gap-3 text-xs"><label className="font-bold">Kode<input className="w-full px-3 py-2 border rounded-lg" required value={form.code||''} onChange={e=>setForm({...form,code:e.target.value})}/></label><label className="font-bold">Nama Aturan<input className="w-full px-3 py-2 border rounded-lg" required value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="font-bold">Jenis<select className="w-full px-3 py-2 border rounded-lg" value={form.type||'percentage'} onChange={e=>setForm({...form,type:e.target.value as any})}><option value="percentage">Persentase (%)</option><option value="fixed">Potongan Tetap (Rp)</option></select></label><label className="font-bold">Nilai<input type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg" value={form.value??0} onChange={e=>setForm({...form,value:Number(e.target.value)})}/></label><label className="font-bold">Minimum Qty<input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={form.minQty??0} onChange={e=>setForm({...form,minQty:Number(e.target.value)})}/></label><label className="font-bold">Maksimum Qty<input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={form.maxQty??''} onChange={e=>setForm({...form,maxQty:e.target.value===''?undefined:Number(e.target.value)})}/></label><label className="font-bold">Grup Pelanggan<input className="w-full px-3 py-2 border rounded-lg" placeholder="Retail / Dealer / Distributor" value={form.customerGroup||''} onChange={e=>setForm({...form,customerGroup:e.target.value})}/></label><label className="font-bold">Produk (opsional)<select className="w-full px-3 py-2 border rounded-lg" value={form.productId||''} onChange={e=>setForm({...form,productId:e.target.value})}><option value="">Semua Produk</option>{products.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label><label className="font-bold">Kategori (opsional)<select className="w-full px-3 py-2 border rounded-lg" value={form.categoryId||''} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">Semua Kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="font-bold">Prioritas<input type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={form.priority??1} onChange={e=>setForm({...form,priority:Number(e.target.value)})}/></label><label className="font-bold">Sequence / Urutan<input type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={form.sequence??1} onChange={e=>setForm({...form,sequence:Number(e.target.value)})}/></label><label className="font-bold">Mulai<input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.startDate||''} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label className="font-bold">Berakhir<input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.endDate||''} onChange={e=>setForm({...form,endDate:e.target.value})}/></label><label className="font-bold">Status<select className="w-full px-3 py-2 border rounded-lg" value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value as any})}><option value="active">Aktif</option><option value="inactive">Non-Aktif</option></select></label><div className="col-span-2 flex justify-end gap-2 border-t pt-3"><button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button><button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">Simpan Aturan</button></div></form></div></div>}
  </div>;
};
