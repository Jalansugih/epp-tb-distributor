import { generateDocumentNo, generateId, generateNumericCode } from '../../lib/identifiers';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SupplierPayment, Payable } from '../../types';
import { formatRupiah } from '../../utils/discountEngine';
import {
  X,
  CreditCard,
  Building2,
  Check,
  Receipt,
  Wallet,
  Calendar,
  FileText
} from 'lucide-react';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayable?: Payable | null;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPayable
}) => {
  const { suppliers, payables, recordSupplierPayment, addToast } = useApp();

  const [paymentNumber, setPaymentNumber] = useState(generateDocumentNo('SPAY'));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Other'>('Bank Transfer');
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Unpaid or partially paid payables
  const activePayables = payables.filter((ap) => ap.remainingAmount > 0);

  // Payables for selected supplier
  const supplierPayables = activePayables.filter((ap) => {
    if (!selectedSupplierId) return true;
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    return ap.supplierName.toLowerCase().includes(sup?.name.toLowerCase() || '');
  });

  // Selected Payable entry
  const currentPayable = payables.find((ap) => ap.invoiceNo === selectedInvoiceNo) || selectedPayable || supplierPayables[0];

  useEffect(() => {
    if (selectedPayable) {
      setSelectedInvoiceNo(selectedPayable.invoiceNo);
      const sup = suppliers.find((s) => s.name === selectedPayable.supplierName);
      if (sup) setSelectedSupplierId(sup.id);
      setAmount(selectedPayable.remainingAmount);
    } else if (supplierPayables.length > 0) {
      const first = supplierPayables[0];
      setSelectedInvoiceNo(first.invoiceNo);
      setAmount(first.remainingAmount);
    }
  }, [selectedPayable, selectedSupplierId]);

  useEffect(() => {
    if (currentPayable) {
      setAmount(currentPayable.remainingAmount);
    }
  }, [selectedInvoiceNo]);

  if (!isOpen) return null;

  const handlePayFull = () => {
    if (currentPayable) {
      setAmount(currentPayable.remainingAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceNo) {
      addToast('Pilih Faktur Hutang yang akan dibayar', 'warning');
      return;
    }
    if (amount <= 0) {
      addToast('Jumlah pembayaran harus lebih besar dari 0', 'warning');
      return;
    }

    const supObj = suppliers.find((s) => s.id === selectedSupplierId) || {
      id: 'sup-201',
      name: currentPayable?.supplierName || ''
    };

    const newPayment: SupplierPayment = {
      id: generateId('spay'),
      paymentNumber,
      code: paymentNumber,
      date,
      supplierId: supObj.id,
      supplierName: currentPayable?.supplierName || supObj.name,
      invoice: selectedInvoiceNo,
      invoiceNo: selectedInvoiceNo,
      paymentMethod,
      amount,
      reference: reference || generateNumericCode('TRF-MANDIRI-', 6),
      referenceNo: reference || generateNumericCode('TRF-MANDIRI-', 6),
      notes
    };

    recordSupplierPayment(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">SUPPLIER PAYMENT</span>
              <h2 className="text-base font-black tracking-tight text-white">Catat Pembayaran Hutang Usaha</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">No. Bukti Bayar</label>
              <input
                type="text"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-700"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tanggal Bayar</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pilih Supplier / Principal</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pilih Faktur / Tagihan Hutang (AP)</label>
            <select
              value={selectedInvoiceNo}
              onChange={(e) => setSelectedInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-blue-900"
            >
              {supplierPayables.length === 0 ? (
                <option value="">(Tidak ada hutang tersisa untuk supplier ini)</option>
              ) : (
                supplierPayables.map((ap) => (
                  <option key={ap.id} value={ap.invoiceNo}>
                    Faktur: {ap.invoiceNo} — Sisa Hutang: {formatRupiah(ap.remainingAmount)} (Jatuh Tempo: {ap.dueDate})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentPayable && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Tagihan Faktur:</span>
                <strong className="text-slate-900">{formatRupiah(currentPayable.total || currentPayable.amount)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Telah Dibayar Sebelumnya:</span>
                <strong className="text-emerald-700">{formatRupiah(currentPayable.paid || currentPayable.paidAmount)}</strong>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-xs">
                <span>Sisa Outstanding AP:</span>
                <strong className="text-rose-600">{formatRupiah(currentPayable.remainingAmount)}</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash / Kasir</option>
                <option value="Other">Giro / Cek / Lainnya</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[10px] font-bold text-slate-500">Jumlah Dibayar (Rp)</label>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Lunasi
                </button>
              </div>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-right text-emerald-600 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">No. Referensi / No. Rekening Transfer</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="mis. TRF-MANDIRI-991823"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Catatan Pembayaran</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan transfer, konfirmasi admin keuangan"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};