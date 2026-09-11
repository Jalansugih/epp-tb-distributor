import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { DiscountItem, SalesOrderItem, SalesOrder, SalesQuotation } from '../../types';
import { calculateSequentialDiscounts, formatRupiah, formatNumber } from '../../utils/discountEngine';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Check,
  Percent,
  AlertTriangle,
  CreditCard,
  Building2,
  Warehouse as WarehouseIcon,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

export const NewOrderModal: React.FC = () => {
  const {
    isNewOrderModalOpen,
    setNewOrderModalOpen,
    customers,
    products,
    paymentTerms,
    salespersons,
    warehouses,
    addSalesOrder,
    addQuotation,
    addToast
  } = useApp();
  const { t } = useLanguage();

  const [documentType, setDocumentType] = useState<'so' | 'quotation'>('so');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState(paymentTerms[0]?.name || '30 Hari (Default)');
  const [selectedSalesperson, setSelectedSalesperson] = useState(salespersons[0]?.name || 'Budi Santoso');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.name || 'Gudang Utama Cengkareng');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Selected customer metadata for credit check
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Auto populate address when customer changes
  React.useEffect(() => {
    if (selectedCustomer) {
      setDeliveryAddress(selectedCustomer.address || '');
      if (selectedCustomer.salespersonName) {
        setSelectedSalesperson(selectedCustomer.salespersonName);
      }
      if (selectedCustomer.paymentTermName) {
        setSelectedPaymentTerm(selectedCustomer.paymentTermName);
      }
    }
  }, [selectedCustomerId]);

  // Credit limits math
  const creditLimit = selectedCustomer?.creditLimit || 0;
  const outstanding = selectedCustomer?.outstanding || 0;
  const availableCredit = creditLimit - outstanding;

  // Items in Order Builder
  const [orderItems, setOrderItems] = useState<
    {
      productId: string;
      qty: number;
      discounts: DiscountItem[];
    }[]
  >([
    {
      productId: products[0]?.id || '',
      qty: 100,
      discounts: [
        { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Tier 1' },
        { id: 'd2', sequence: 2, type: 'percentage', value: 3, label: 'Diskon Volume' }
      ]
    }
  ]);

  if (!isNewOrderModalOpen) return null;

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: products[0]?.id || '',
        qty: 50,
        discounts: [
          { id: Math.random().toString(36).substring(2, 9), sequence: 1, type: 'percentage', value: 5, label: 'Diskon Reguler' }
        ]
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleAddDiscountToItem = (itemIndex: number) => {
    const updated = [...orderItems];
    const currDiscs = updated[itemIndex].discounts;
    const nextSeq = currDiscs.length + 1;
    currDiscs.push({
      id: Math.random().toString(36).substring(2, 9),
      sequence: nextSeq,
      type: 'percentage',
      value: 2,
      label: `Diskon Step ${nextSeq}`
    });
    setOrderItems(updated);
  };

  const handleRemoveDiscountFromItem = (itemIndex: number, discountId: string) => {
    const updated = [...orderItems];
    const filtered = updated[itemIndex].discounts.filter((d) => d.id !== discountId);
    updated[itemIndex].discounts = filtered.map((d, idx) => ({ ...d, sequence: idx + 1 }));
    setOrderItems(updated);
  };

  const handleUpdateItemDiscount = (
    itemIndex: number,
    discountIdx: number,
    field: keyof DiscountItem,
    val: any
  ) => {
    const updated = [...orderItems];
    updated[itemIndex].discounts[discountIdx] = {
      ...updated[itemIndex].discounts[discountIdx],
      [field]: val
    };
    setOrderItems(updated);
  };

  // Calculate Order Totals
  let calculatedSubtotal = 0;
  let totalRawBeforeDiscounts = 0;

  const processedItems: SalesOrderItem[] = orderItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId) || products[0];
    const rawUnitPrice = prod.sellPrice;
    const totalRawPrice = rawUnitPrice * item.qty;
    totalRawBeforeDiscounts += totalRawPrice;

    const discountRes = calculateSequentialDiscounts(totalRawPrice, item.discounts);
    const itemSubtotal = discountRes.finalPrice;
    calculatedSubtotal += itemSubtotal;

    return {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      series: prod.series,
      uom: prod.uom,
      qty: item.qty,
      unitPrice: rawUnitPrice,
      discounts: item.discounts,
      netUnitPrice: item.qty > 0 ? Math.round(itemSubtotal / item.qty) : rawUnitPrice,
      subtotal: itemSubtotal
    };
  });

  const totalDiscountDeduction = totalRawBeforeDiscounts - calculatedSubtotal;
  const taxAmount = Math.round(calculatedSubtotal * 0.11);
  const totalAmount = calculatedSubtotal + taxAmount;

  // Credit Warning Trigger
  const isOverCreditLimit = documentType === 'so' && totalAmount > availableCredit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      addToast('Harap tambahkan minimal 1 barang ke pesanan!', 'warning');
      return;
    }

    if (documentType === 'quotation') {
      const newSQCode = `SQ/2026/08/0${Math.floor(100 + Math.random() * 900)}`;
      const newSQ: SalesQuotation = {
        id: `sq-${Date.now()}`,
        code: newSQCode,
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        salespersonName: selectedSalesperson,
        paymentTermName: selectedPaymentTerm,
        items: processedItems,
        subtotal: calculatedSubtotal,
        taxAmount,
        totalAmount,
        status: 'Sent',
        notes
      };

      addQuotation(newSQ);
      setNewOrderModalOpen(false);
      return;
    }

    // Sales Order Mode
    const newSOCode = `SO/2026/08/0${Math.floor(100 + Math.random() * 900)}`;
    const status: SalesOrder['status'] = isOverCreditLimit ? 'Submitted' : 'Approved';

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      code: newSOCode,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerCode: selectedCustomer.code,
      customerName: selectedCustomer.name,
      address: deliveryAddress,
      salespersonName: selectedSalesperson,
      paymentTermName: selectedPaymentTerm,
      warehouseName: selectedWarehouse,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discountTotal: totalDiscountDeduction,
      taxAmount,
      totalAmount,
      status,
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      deliveryStatus: 'Pending',
      requiresApproval: isOverCreditLimit,
      approvalReason: isOverCreditLimit
        ? `Order ${formatRupiah(totalAmount)} Melebihi Sisa Kredit Tersedia (${formatRupiah(availableCredit)})`
        : undefined,
      notes
    };

    addSalesOrder(newSO);
    setNewOrderModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {documentType === 'so' ? 'Buat Sales Order Baru' : 'Buat Penawaran Harga Baru (Quotation)'}
                </h2>
              </div>
              <p className="text-xs text-blue-200">
                Lengkap dengan Fleksibel Discount Engine (Dynamic Step) & Validasi Plafon Kredit Toko
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Doc Type */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDocumentType('so')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  documentType === 'so' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sales Order
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('quotation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  documentType === 'quotation' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Penawaran (Quotation)
              </button>
            </div>

            <button
              onClick={() => setNewOrderModalOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Customer Selection & Live Credit Limit Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer selector */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 md:col-span-1">
              <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Pilih Pelanggan / Toko Retail
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.type})
                  </option>
                ))}
              </select>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Alamat Pengiriman Toko</span>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Alamat lengkap toko..."
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Live Customer Credit Limit Check Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs md:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    Informasi Plafon Kredit — {selectedCustomer?.name}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCustomer?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {selectedCustomer?.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-500 font-bold block">Plafon Kredit (Limit)</span>
                  <span className="font-black text-slate-900 text-xs">{formatRupiah(creditLimit)}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50">
                  <span className="text-[10px] text-rose-600 font-bold block">Piutang Berjalan (AR)</span>
                  <span className="font-black text-rose-700 text-xs">{formatRupiah(outstanding)}</span>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    availableCredit < totalAmount ? 'bg-rose-100 border border-rose-300' : 'bg-emerald-50'
                  }`}
                >
                  <span className="text-[10px] text-slate-600 font-bold block">Sisa Kredit Tersedia</span>
                  <span
                    className={`font-black text-xs ${
                      availableCredit < totalAmount ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatRupiah(availableCredit)}
                  </span>
                </div>
              </div>

              {/* Over Limit Credit Alert Warning */}
              {isOverCreditLimit && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-amber-900 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">PERINGATAN OVER LIMIT:</span> Total SO ini ({formatRupiah(totalAmount)})
                    melebihi sisa kredit ({formatRupiah(availableCredit)}). SO akan disubmit dengan status{' '}
                    <span className="font-extrabold text-amber-900">Submitted (Memerlukan Approval)</span>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operational Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sales Executive</label>
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                {salespersons.map((sp) => (
                  <option key={sp.id} value={sp.name}>
                    {sp.name} ({sp.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Syarat Pembayaran (Payment Terms)</label>
              <select
                value={selectedPaymentTerm}
                onChange={(e) => setSelectedPaymentTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                {paymentTerms.map((pt) => (
                  <option key={pt.id} value={pt.name}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gudang Pengeluaran</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ITEM TABLE WITH FLEXIBLE DISCOUNT ENGINE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Daftar Material & Diskon Beruntun (Flexible Engine)</h3>
                <p className="text-[11px] text-slate-500">
                  Dukungan unlimited dynamic discount steps beruntun (Persentase % & Nominal Rp per item)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tambah Material
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {orderItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId) || products[0];
                const rawTotal = prod.sellPrice * item.qty;
                const calc = calculateSequentialDiscounts(rawTotal, item.discounts);
                const isUnderMoq = item.qty < (prod.minOrder || 1);

                return (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>

                      {/* Product Selector */}
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Nama Produk & Merek
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].productId = e.target.value;
                            setOrderItems(updated);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.name} ({p.brand}) — Rp {formatNumber(p.sellPrice)} / {p.uom}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Qty Input & MOQ Validation */}
                      <div className="w-full md:w-32">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Kuantitas ({prod.uom})
                        </label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].qty = Math.max(1, Number(e.target.value) || 1);
                            setOrderItems(updated);
                          }}
                          className={`w-full px-3 py-2 border rounded-xl font-bold text-center text-slate-900 ${
                            isUnderMoq ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-300'
                          }`}
                        />
                      </div>

                      {/* Unit Price Gross */}
                      <div className="w-full md:w-32 text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Harga Katalog</span>
                        <span className="font-bold text-slate-700 text-xs">Rp {formatNumber(prod.sellPrice)}</span>
                      </div>

                      {/* Net Price calculated */}
                      <div className="w-full md:w-36 text-right bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                        <span className="block text-[10px] font-bold text-blue-600 uppercase">Total Net Item</span>
                        <span className="font-extrabold text-blue-800 text-sm">{formatRupiah(calc.finalPrice)}</span>
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* MOQ Warning Alert if Under Minimum Order */}
                    {isUnderMoq && (
                      <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          Peringatan MOQ: Kuantitas ({item.qty} {prod.uom}) dibawah Minimum Order Pabrik/Distributor ({prod.minOrder || 1} {prod.uom}).
                        </span>
                      </div>
                    )}

                    {/* FLEXIBLE DISCOUNT ENGINE BADGES FOR ITEM */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5 text-blue-600" />
                          Skema Diskon Beruntun (Dynamic Array):
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddDiscountToItem(idx)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs transition-all"
                        >
                          <Plus className="w-3 h-3" /> Tambah Step Diskon
                        </button>
                      </div>

                      {item.discounts.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Tidak ada diskon khusus untuk item ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {item.discounts.map((disc, dIdx) => (
                            <div
                              key={disc.id}
                              className="p-2 rounded-lg bg-white border border-slate-300 shadow-2xs flex items-center justify-between gap-1.5"
                            >
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="font-bold text-slate-400 text-[10px]">#{disc.sequence}</span>
                                <input
                                  type="text"
                                  value={disc.label || ''}
                                  placeholder="Label Diskon"
                                  onChange={(e) =>
                                    handleUpdateItemDiscount(idx, dIdx, 'label', e.target.value)
                                  }
                                  className="w-full text-[10px] font-medium bg-transparent border-b border-dashed border-slate-300 focus:outline-hidden"
                                />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <select
                                  value={disc.type}
                                  onChange={(e) =>
                                    handleUpdateItemDiscount(idx, dIdx, 'type', e.target.value as any)
                                  }
                                  className="text-[10px] font-bold bg-slate-100 rounded px-1 py-0.5"
                                >
                                  <option value="percentage">%</option>
                                  <option value="fixed">Rp</option>
                                </select>

                                <input
                                  type="number"
                                  value={disc.value}
                                  onChange={(e) =>
                                    handleUpdateItemDiscount(
                                      idx,
                                      dIdx,
                                      'value',
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-14 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded px-1 py-0.5"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDiscountFromItem(idx, disc.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sequential calculation summary breakdown line */}
                      <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/80 flex items-center justify-between">
                        <span>Perhitungan Step: Rp {formatNumber(rawTotal)}</span>
                        {calc.steps.map((st) => (
                          <span key={st.sequence} className="text-rose-600 font-semibold">
                            -{st.type === 'percentage' ? `${st.value}%` : `Rp${formatNumber(st.value)}`} (Rp{formatNumber(st.deductionAmount)})
                          </span>
                        ))}
                        <span className="font-bold text-slate-900 text-xs">
                          = {formatRupiah(calc.finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan / Insttruksi Khusus Pengiriman</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kirim via Truk Fuso, bongkar muat ditanggung pembeli..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs"
            />
          </div>

          {/* Grand Totals Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1 text-xs text-slate-300">
              <p>
                Total Harga Katalog Sebelum Diskon:{' '}
                <span className="font-bold text-white">{formatRupiah(totalRawBeforeDiscounts)}</span>
              </p>
              <p className="text-rose-400 font-semibold">
                Total Potongan Diskon Beruntun:{' '}
                <span className="font-bold text-rose-300">- {formatRupiah(totalDiscountDeduction)}</span>
              </p>
              <p>
                Subtotal Net + PPN 11%:{' '}
                <span className="font-bold text-white">
                  {formatRupiah(calculatedSubtotal)} + {formatRupiah(taxAmount)}
                </span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-blue-300 uppercase block tracking-wider">
                {documentType === 'so' ? 'TOTAL SALES ORDER (PPN 11%)' : 'TOTAL PENAWARAN (PPN 11%)'}
              </span>
              <span className="text-2xl md:text-3xl font-black text-emerald-400">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setNewOrderModalOpen(false)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              {documentType === 'so' ? 'Terbitkan Sales Order' : 'Terbitkan Penawaran Harga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
