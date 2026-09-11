import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { DiscountItem, PurchaseOrderItem, PurchaseOrder } from '../../types';
import { calculateSequentialDiscounts, formatRupiah, formatNumber } from '../../utils/discountEngine';
import {
  X,
  Plus,
  Trash2,
  Building2,
  Check,
  Percent,
  Warehouse as WarehouseIcon,
  UserCheck,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar,
  FileText
} from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPRData?: any;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  initialPRData
}) => {
  const {
    suppliers,
    products,
    paymentTerms,
    warehouses,
    addPurchaseOrder,
    addToast
  } = useApp();
  const { t } = useLanguage();

  const [poCode, setPoCode] = useState(`PO/2026/08/0${Math.floor(100 + Math.random() * 900)}`);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.name || 'Gudang Utama Cengkareng');
  const [paymentTermName, setPaymentTermName] = useState('30 Hari (Default)');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState('30_70'); // '30_70' or '50_50' or 'custom'
  const [buyerName, setBuyerName] = useState('Andi Prasetyo (Purchasing Specialist)');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [includeTax, setIncludeTax] = useState(true);

  // Selected supplier details
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  useEffect(() => {
    if (selectedSupplier) {
      setAddress(selectedSupplier.address || '');
      if (selectedSupplier.paymentTermName) {
        setPaymentTermName(selectedSupplier.paymentTermName);
      }
    }
  }, [selectedSupplierId]);

  // Items State
  const [items, setItems] = useState<
    {
      productId: string;
      qty: number;
      unitPrice: number;
      discounts: DiscountItem[];
      editingDiscounts?: boolean;
    }[]
  >([
    {
      productId: products[0]?.id || '',
      qty: 500,
      unitPrice: products[0]?.buyPrice || 65000,
      discounts: [
        { id: 'd1', sequence: 1, type: 'percentage', value: 8, label: 'Diskon Principal Pabrik' },
        { id: 'd2', sequence: 2, type: 'fixed', value: 500, label: 'Subsidi Ongkir' }
      ]
    }
  ]);

  useEffect(() => {
    if (initialPRData && initialPRData.items) {
      if (initialPRData.supplierId) setSelectedSupplierId(initialPRData.supplierId);
      if (initialPRData.warehouseName) setSelectedWarehouse(initialPRData.warehouseName);
      
      const mapped = initialPRData.items.map((it: any) => {
        const prod = products.find((p) => p.id === it.productId) || products[0];
        return {
          productId: prod.id,
          qty: it.qty || 100,
          unitPrice: it.estimatedPrice || prod.buyPrice || 50000,
          discounts: [
            { id: 'pd1', sequence: 1, type: 'percentage' as const, value: 5, label: 'Diskon Kontrak' }
          ]
        };
      });
      if (mapped.length > 0) setItems(mapped);
      if (initialPRData.notes) setNotes(`Referensi PR: ${initialPRData.code} - ${initialPRData.notes}`);
    }
  }, [initialPRData]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const prod = products[0] || { id: '', buyPrice: 50000 };
    setItems([
      ...items,
      {
        productId: prod.id,
        qty: 100,
        unitPrice: prod.buyPrice || 50000,
        discounts: [
          { id: Math.random().toString(36).substring(2, 9), sequence: 1, type: 'percentage', value: 5, label: 'Diskon Reguler' }
        ]
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      addToast('Minimal 1 item barang dalam Purchase Order', 'warning');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemProductChange = (index: number, newProdId: string) => {
    const prod = products.find((p) => p.id === newProdId);
    setItems(
      items.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            productId: newProdId,
            unitPrice: prod?.buyPrice || item.unitPrice
          };
        }
        return item;
      })
    );
  };

  // Discount Engine Operations for Row
  const handleAddDiscount = (itemIndex: number) => {
    setItems(
      items.map((item, idx) => {
        if (idx === itemIndex) {
          const nextSeq = item.discounts.length + 1;
          const newDisc: DiscountItem = {
            id: Math.random().toString(36).substring(2, 9),
            sequence: nextSeq,
            type: 'percentage',
            value: 2,
            label: `Diskon Tahap ${nextSeq}`
          };
          return {
            ...item,
            discounts: [...item.discounts, newDisc]
          };
        }
        return item;
      })
    );
  };

  const handleUpdateDiscount = (
    itemIndex: number,
    discId: string,
    field: keyof DiscountItem,
    val: any
  ) => {
    setItems(
      items.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            discounts: item.discounts.map((d) => (d.id === discId ? { ...d, [field]: val } : d))
          };
        }
        return item;
      })
    );
  };

  const handleDeleteDiscount = (itemIndex: number, discId: string) => {
    setItems(
      items.map((item, idx) => {
        if (idx === itemIndex) {
          const filtered = item.discounts.filter((d) => d.id !== discId);
          const resequenced = filtered.map((d, i) => ({ ...d, sequence: i + 1 }));
          return { ...item, discounts: resequenced };
        }
        return item;
      })
    );
  };

  const handleReorderDiscount = (itemIndex: number, discIndex: number, direction: 'up' | 'down') => {
    setItems(
      items.map((item, idx) => {
        if (idx === itemIndex) {
          const arr = [...item.discounts];
          const targetIndex = direction === 'up' ? discIndex - 1 : discIndex + 1;
          if (targetIndex < 0 || targetIndex >= arr.length) return item;

          const temp = arr[discIndex];
          arr[discIndex] = arr[targetIndex];
          arr[targetIndex] = temp;

          const resequenced = arr.map((d, i) => ({ ...d, sequence: i + 1 }));
          return { ...item, discounts: resequenced };
        }
        return item;
      })
    );
  };

  const toggleEditDiscounts = (itemIndex: number) => {
    setItems(
      items.map((item, idx) => (idx === itemIndex ? { ...item, editingDiscounts: !item.editingDiscounts } : item))
    );
  };

  // Calculate totals
  const calculatedItems: PurchaseOrderItem[] = items.map((item) => {
    const prod = products.find((p) => p.id === item.productId) || products[0];
    const calc = calculateSequentialDiscounts(item.unitPrice, item.discounts);
    const netUnitPrice = calc.finalPrice;
    const subtotal = netUnitPrice * item.qty;

    return {
      productId: prod?.id || '',
      productCode: prod?.code || 'PRD-000',
      productName: prod?.name || 'Item Barang',
      uom: prod?.uom || 'Unit',
      qty: item.qty,
      unitPrice: item.unitPrice,
      discounts: item.discounts,
      netPrice: netUnitPrice,
      subtotal
    };
  });

  const subtotalPO = calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const taxAmountPO = includeTax ? Math.round(subtotalPO * 0.11) : 0;
  const totalAmountPO = subtotalPO + taxAmountPO;

  // Installment calculations
  const installment1 = installmentPlan === '30_70' ? Math.round(totalAmountPO * 0.3) : Math.round(totalAmountPO * 0.5);
  const installment2 = totalAmountPO - installment1;

  const handleSubmit = (status: PurchaseOrder['status'] = 'Sent') => {
    if (!selectedSupplier) {
      addToast('Pilih Supplier Pabrik terlebih dahulu', 'warning');
      return;
    }
    if (calculatedItems.length === 0) {
      addToast('Masukkan minimal 1 produk', 'warning');
      return;
    }

    const effectivePaymentTerm = isInstallment
      ? `Termin Installment (${installmentPlan === '30_70' ? '30% DP, 70% 30 Hari' : '50% DP, 50% 14 Hari'})`
      : paymentTermName;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      code: poCode,
      date: poDate,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplierId: selectedSupplier.id,
      supplierNumber: selectedSupplier.code || 'SUP-001',
      supplierName: selectedSupplier.name,
      address,
      warehouseName: selectedWarehouse,
      paymentTermName: effectivePaymentTerm,
      buyerName,
      items: calculatedItems,
      subtotal: subtotalPO,
      taxAmount: taxAmountPO,
      totalAmount: totalAmountPO,
      status,
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      receiptStatus: 'Pending',
      notes
    };

    addPurchaseOrder(newPO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                  PURCHASE ORDER ENGINE
                </span>
                <span className="text-xs text-slate-300">| No. Ref: {poCode}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Buat Purchase Order Ke Pabrik Principal
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* Section 1: Header Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Column 1: Supplier & Ref */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Supplier / Principal Pabrik *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      [{sup.code || 'SUP'}] {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    No. Supplier
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedSupplier?.code || 'SUP-001'}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    No. PO
                  </label>
                  <input
                    type="text"
                    value={poCode}
                    onChange={(e) => setPoCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-700"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Warehouse, Date & Buyer */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Tanggal Order
                  </label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Tujuan Gudang
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.name}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Purchaser / Sales Buyer
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                    placeholder="Nama Penanggung Jawab Purchasing"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Payment Term & Installments */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Syarat Pembayaran (Payment Term)
                </label>
                <select
                  value={paymentTermName}
                  onChange={(e) => setPaymentTermName(e.target.value)}
                  disabled={isInstallment}
                  className={`w-full px-3 py-2 border rounded-xl font-medium text-slate-800 ${
                    isInstallment ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="14 Hari">14 Hari</option>
                  <option value="30 Hari (Default)">30 Hari (Default)</option>
                  <option value="45 Hari">45 Hari</option>
                  <option value="Custom (Sesuai Kesepakatan)">Custom (Sesuai Kesepakatan)</option>
                </select>
              </div>

              {/* Installments Option */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="chkInstallment" className="flex items-center gap-2 font-bold text-blue-900 cursor-pointer">
                    <input
                      id="chkInstallment"
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Skema Pembayaran Installment / DP</span>
                  </label>
                </div>

                {isInstallment && (
                  <div className="mt-2 space-y-1.5">
                    <select
                      value={installmentPlan}
                      onChange={(e) => setInstallmentPlan(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-blue-300 rounded-lg text-slate-800 font-semibold text-[11px]"
                    >
                      <option value="30_70">30% DP Langsung, 70% Setelah 30 Hari</option>
                      <option value="50_50">50% DP Langsung, 50% Setelah 14 Hari</option>
                    </select>
                    <div className="text-[10px] font-semibold text-blue-800 bg-white p-1.5 rounded-md border border-blue-200 flex justify-between">
                      <span>Termin 1 (DP): <strong>{formatRupiah(installment1)}</strong></span>
                      <span>Termin 2: <strong>{formatRupiah(installment2)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address & Notes Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                Alamat Pabrik / Lokasi Pengiriman Supplier
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                placeholder="Alamat Kantor/Pabrik Supplier"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                Catatan Khusus PO Ke Pabrik
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                placeholder="Instruksi pengiriman, armada kontainer, dsb."
              />
            </div>
          </div>

          {/* Section 2: Product Items Table with Sequential Discount Engine */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">
                  Daftar Barang & Engine Diskon Beruntun (Sequential Discount)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Barang
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3 w-8">#</th>
                    <th className="p-3 min-w-[200px]">Produk & Kode</th>
                    <th className="p-3 w-28 text-center">Qty & Satuan</th>
                    <th className="p-3 w-32 text-right">Harga Bruto (Rp)</th>
                    <th className="p-3 min-w-[260px]">Skema Diskon Beruntun (Sequential)</th>
                    <th className="p-3 w-32 text-right">Harga Net / Unit</th>
                    <th className="p-3 w-36 text-right">Total Subtotal</th>
                    <th className="p-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-xs">
                  {calculatedItems.map((item, index) => {
                    const rawItem = items[index];
                    const discountCalc = calculateSequentialDiscounts(rawItem.unitPrice, rawItem.discounts);

                    return (
                      <React.Fragment key={index}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-400 text-center">{index + 1}</td>
                          <td className="p-3">
                            <select
                              value={rawItem.productId}
                              onChange={(e) => handleItemProductChange(index, e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.code}] {p.name}
                                </option>
                              ))}
                            </select>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Kode: <span className="font-bold text-blue-700">{item.productCode}</span> | Stok: {products.find(p => p.id === rawItem.productId)?.stock || 0} {item.uom}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={rawItem.qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setItems(items.map((it, idx) => (idx === index ? { ...it, qty: val } : it)));
                                }}
                                className="w-16 p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-center text-slate-900"
                              />
                              <span className="text-[11px] font-bold text-slate-600">{item.uom}</span>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={rawItem.unitPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItems(items.map((it, idx) => (idx === index ? { ...it, unitPrice: val } : it)));
                              }}
                              className="w-28 p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-right text-slate-900"
                            />
                          </td>

                          {/* Sequential Discount Column */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1">
                                {rawItem.discounts.map((d, dIdx) => (
                                  <span
                                    key={d.id}
                                    className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <span className="text-slate-500">{d.sequence}.</span>
                                    <span>{d.label}:</span>
                                    <strong className="text-blue-900">
                                      {d.type === 'percentage' ? `${d.value}%` : formatRupiah(d.value)}
                                    </strong>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditDiscounts(index)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                >
                                  <Percent className="w-3 h-3" />
                                  {rawItem.editingDiscounts ? 'Tutup Pengaturan Diskon' : 'Kelola / Tambah Diskon (Add, Edit, Delete, Reorder)'}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-right font-bold text-slate-800">
                            {formatRupiah(item.netPrice || 0)}
                            {discountCalc.totalDeduction > 0 && (
                              <div className="text-[9.5px] text-emerald-600 font-semibold">
                                Hemat {formatRupiah(discountCalc.totalDeduction)}/unit
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right font-black text-slate-900 text-sm">
                            {formatRupiah(item.subtotal)}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus baris barang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expandable Discount Editor */}
                        {rawItem.editingDiscounts && (
                          <tr className="bg-slate-50/90 border-b-2 border-blue-200">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-bold text-slate-900 text-xs">
                                      Engine Diskon Beruntun — Baris {index + 1}: {item.productName}
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddDiscount(index)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Discount Step
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {rawItem.discounts.map((d, dIdx) => (
                                    <div
                                      key={d.id}
                                      className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
                                    >
                                      <span className="w-6 text-center font-bold text-slate-500">#{d.sequence}</span>

                                      <input
                                        type="text"
                                        value={d.label}
                                        onChange={(e) =>
                                          handleUpdateDiscount(index, d.id, 'label', e.target.value)
                                        }
                                        placeholder="Nama Diskon (mis: Tier 1)"
                                        className="flex-1 min-w-[140px] px-2 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
                                      />

                                      <select
                                        value={d.type}
                                        onChange={(e) =>
                                          handleUpdateDiscount(index, d.id, 'type', e.target.value as any)
                                        }
                                        className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800"
                                      >
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal Potongan (Rp)</option>
                                      </select>

                                      <input
                                        type="number"
                                        min={0}
                                        value={d.value}
                                        onChange={(e) =>
                                          handleUpdateDiscount(
                                            index,
                                            d.id,
                                            'value',
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-right text-blue-900"
                                      />

                                      {/* Reorder Buttons */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={dIdx === 0}
                                          onClick={() => handleReorderDiscount(index, dIdx, 'up')}
                                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                                          title="Geser Ke Atas"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={dIdx === rawItem.discounts.length - 1}
                                          onClick={() => handleReorderDiscount(index, dIdx, 'down')}
                                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                                          title="Geser Ke Bawah"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDiscount(index, d.id)}
                                        className="p-1 text-rose-500 hover:text-rose-700"
                                        title="Delete Discount Step"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Step Breakdown Preview */}
                                <div className="p-2.5 bg-blue-50/60 rounded-lg text-[11px] text-slate-700 space-y-1">
                                  <div className="font-bold text-blue-900">Kalkulasi Bertahap Per Unit:</div>
                                  <div className="flex flex-wrap gap-3 font-medium">
                                    <span>Harga Bruto: <strong>{formatRupiah(rawItem.unitPrice)}</strong></span>
                                    {discountCalc.steps.map((st, sIdx) => (
                                      <span key={sIdx} className="text-slate-600">
                                        → Step {st.sequence} ({st.label}): -{formatRupiah(st.deductionAmount)} (Sisa: {formatRupiah(st.resultingPrice)})
                                      </span>
                                    ))}
                                    <span className="font-bold text-emerald-700">
                                      = Harga Net Final: <strong>{formatRupiah(discountCalc.finalPrice)}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Summary Footer */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <label htmlFor="chkTax" className="flex items-center gap-2 font-bold text-xs text-blue-300 cursor-pointer">
                <input
                  id="chkTax"
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="rounded text-blue-500 w-4 h-4 focus:ring-blue-400"
                />
                <span>Termasuk PPN 11% Faktur Pajak Principal</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Pajak Masukan (PPN 11%) otomatis dihitung dari subtotal setelah diskon beruntun.
              </p>
            </div>

            <div className="w-full md:w-80 space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-xs">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Subtotal Bersih PO:</span>
                <span className="font-bold text-white">{formatRupiah(subtotalPO)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>PPN 11%:</span>
                <span className="font-bold text-blue-400">{formatRupiah(taxAmountPO)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-700 pt-2">
                <span className="text-sm font-black text-white">Grand Total PO:</span>
                <span className="text-lg font-black text-emerald-400">{formatRupiah(totalAmountPO)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 font-bold text-slate-700 rounded-xl transition-all"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('Draft')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 rounded-xl transition-all"
            >
              Simpan Draft PO
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('Sent')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Terbitkan PO Ke Pabrik
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};