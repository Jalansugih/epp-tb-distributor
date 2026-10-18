import React, { useMemo, useState } from 'react';
import { X, PackageCheck, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateDocumentNo, generateId } from '../../lib/identifiers';
import { formatRupiah } from '../../utils/discountEngine';
import { GoodsReceipt, PurchaseInvoice, PurchaseOrder } from '../../types';

const today = () => new Date().toISOString().split('T')[0];

const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const ModalShell: React.FC<{ title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({
  title,
  icon,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Tutup">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/** Terima barang dari PO (mendukung penerimaan sebagian). */
export const GoodsReceiptModal: React.FC<{ po: PurchaseOrder; onClose: () => void }> = ({ po, onClose }) => {
  const { goodsReceipts, warehouses, addGoodsReceipt, openDocModal, addToast } = useApp();
  const { profile } = useAuth();

  const receivedBefore = useMemo(() => {
    const map: Record<string, number> = {};
    goodsReceipts
      .filter((g) => g.poCode === po.code)
      .forEach((g) => g.items.forEach((i) => (map[i.productId] = (map[i.productId] || 0) + i.qtyReceived)));
    return map;
  }, [goodsReceipts, po.code]);

  const [date, setDate] = useState(today());
  const [warehouseName, setWarehouseName] = useState(po.warehouseName || warehouses[0]?.name || '');
  const [receivedBy, setReceivedBy] = useState(profile?.full_name || '');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    po.items.forEach((item) => {
      init[item.productId] = Math.max(0, item.qty - (receivedBefore[item.productId] || 0));
    });
    return init;
  });
  const [batch, setBatch] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName) {
      addToast('Pilih gudang penerima terlebih dahulu.', 'warning');
      return;
    }
    if (!receivedBy.trim()) {
      addToast('Isi nama penerima barang.', 'warning');
      return;
    }
    const gr: GoodsReceipt = {
      id: generateId('gr'),
      code: generateDocumentNo('GR'),
      poCode: po.code,
      date,
      supplierName: po.supplierName,
      warehouseName,
      receivedBy: receivedBy.trim(),
      items: po.items.map((item) => ({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        uom: item.uom,
        qtyOrdered: item.qty,
        qtyReceived: Number(qty[item.productId]) || 0,
        batchNo: batch[item.productId]?.trim() || undefined,
      })),
      status: 'Stored',
      notes: notes.trim() || undefined,
    };
    if (!addGoodsReceipt(gr)) return; // alasan penolakan sudah tampil lewat toast
    onClose();
    openDocModal('GOODS RECEIPT', `Surat Penerimaan ${gr.code}`, {
      ...gr,
      items: gr.items.filter((i) => i.qtyReceived > 0),
    });
  };

  return (
    <ModalShell title={`Terima Barang - ${po.code}`} icon={<PackageCheck className="w-4 h-4 text-emerald-600" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
        <div className="text-slate-600">
          Supplier: <span className="font-bold text-slate-900">{po.supplierName}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Tanggal Terima</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Gudang Penerima</span>
            <select value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} className={inputCls}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Diterima Oleh</span>
            <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={inputCls} required />
          </label>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-2">Produk</th>
                <th className="p-2 text-right">Dipesan</th>
                <th className="p-2 text-right">Sudah Diterima</th>
                <th className="p-2 text-right">Terima Sekarang</th>
                <th className="p-2">No. Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {po.items.map((item) => {
                const done = receivedBefore[item.productId] || 0;
                const remaining = Math.max(0, item.qty - done);
                return (
                  <tr key={item.productId}>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.productCode}</div>
                    </td>
                    <td className="p-2 text-right">
                      {item.qty} {item.uom}
                    </td>
                    <td className="p-2 text-right">{done}</td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={qty[item.productId] ?? 0}
                        disabled={remaining === 0}
                        onChange={(e) =>
                          setQty((prev) => ({
                            ...prev,
                            [item.productId]: Math.min(remaining, Math.max(0, Number(e.target.value) || 0)),
                          }))
                        }
                        className={`${inputCls} w-24 text-right ml-auto`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={batch[item.productId] || ''}
                        onChange={(e) => setBatch((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        placeholder="opsional"
                        className={`${inputCls} w-28`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <label className="block space-y-1">
          <span className="font-bold text-slate-700">Catatan</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
            Batal
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
            Simpan Penerimaan
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/** Buat faktur pembelian dari PO yang sudah diterima penuh. */
export const PurchaseInvoiceModal: React.FC<{ po: PurchaseOrder; onClose: () => void }> = ({ po, onClose }) => {
  const { goodsReceipts, addPurchaseInvoice, addToast } = useApp();
  const lastGR = goodsReceipts.find((g) => g.poCode === po.code); // daftar GR terbaru di depan

  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState(po.dueDate || today());
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierInvoiceNo.trim()) {
      addToast('Isi nomor faktur dari supplier.', 'warning');
      return;
    }
    const inv: PurchaseInvoice = {
      id: generateId('pinv'),
      code: generateDocumentNo('PINV'),
      poCode: po.code,
      grCode: lastGR?.code,
      supplierInvoiceNo: supplierInvoiceNo.trim(),
      date,
      dueDate,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      paymentTermName: po.paymentTermName,
      items: po.items,
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      paidAmount: 0,
      remainingAmount: po.totalAmount,
      paymentStatus: 'Unpaid',
      status: 'Issued',
      notes: notes.trim() || undefined,
    };
    if (!addPurchaseInvoice(inv)) return;
    onClose();
  };

  return (
    <ModalShell title={`Buat Faktur Pembelian - ${po.code}`} icon={<Receipt className="w-4 h-4 text-blue-600" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
        <div className="text-slate-600">
          Supplier: <span className="font-bold text-slate-900">{po.supplierName}</span> · Total:{' '}
          <span className="font-black text-slate-900">{formatRupiah(po.totalAmount)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="font-bold text-slate-700">No. Faktur Supplier</span>
            <input value={supplierInvoiceNo} onChange={(e) => setSupplierInvoiceNo(e.target.value)} className={inputCls} required />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Tanggal Faktur</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Jatuh Tempo</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} required />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="font-bold text-slate-700">Catatan</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
            Batal
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white">
            Terbitkan Faktur
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
