import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatRupiah, formatNumber } from '../../utils/discountEngine';
import { X, Printer, Building, FileCheck } from 'lucide-react';

export const DocumentPreviewModal: React.FC = () => {
  const { isDocModalOpen, docModalData, closeDocModal } = useApp();
  const { t } = useLanguage();

  if (!isDocModalOpen || !docModalData) return null;

  const { type, title, data } = docModalData;

  const handlePrint = () => {
    window.print();
  };

  const isPaymentDoc = type.includes('RECEIPT') || type.includes('VOUCHER') || type.includes('KWITANSI') || type.includes('PEMBAYARAN');
  const isStatementDoc = type.includes('STATEMENT') || type.includes('REKENING KORAN');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen (Print / PDF)
            </button>
            <button
              onClick={closeDocModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Content */}
        <div className="p-8 overflow-y-auto font-sans text-slate-800 bg-white" id="printable-area">
          {/* Company Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                PT BAHAN BANGUNAN JAYA DISTRIBUTOR
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Distributor Resmi Semen, Besi, Cat, Keramik & Material Konstruksi
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Kawasan Industri Daan Mogot Km 14 No. 88, Jakarta Barat | Telp: (021) 5582-9000
              </p>
              <p className="text-[11px] text-slate-500">NPWP: 01.332.998.4-015.000</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded uppercase tracking-wider">
                {type}
              </span>
              <p className="text-sm font-bold text-slate-900 mt-2">{data?.code || data?.paymentNumber || data?.invoiceNo || 'DOC-2026-08'}</p>
              <p className="text-xs text-slate-500">Tanggal: {data?.date || data?.invoiceDate || '12 Aug 2026'}</p>
            </div>
          </div>

          {/* Customer / Supplier Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Tujuan / Kepada Yth:
              </span>
              <p className="font-bold text-sm text-slate-900">
                {data?.customerName || data?.supplierName || 'Toko Bangunan Makmur Jaya'}
              </p>
              <p className="text-slate-600 mt-0.5">
                {data?.address || 'Jl. Daan Mogot No. 142, Kalideres, Jakarta Barat'}
              </p>
              <p className="text-slate-600">Syarat Pembayaran: {data?.paymentTermName || '30 Hari (TOP)'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Rincian Transaksi:
              </span>
              <p className="text-slate-700">
                <span className="font-semibold">Salesperson / PIC:</span> {data?.salespersonName || data?.buyerName || 'Budi Santoso'}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Jatuh Tempo:</span> {data?.dueDate || data?.validUntil || '11 Sep 2026'}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Status Dokumen:</span>{' '}
                <span className="font-bold text-blue-700">{data?.status || data?.paymentStatus || 'Disetujui (Approved)'}</span>
              </p>
            </div>
          </div>

          {/* Render standard items or payment/statement table */}
          {isPaymentDoc ? (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Metode Pembayaran:</span>
                    <span className="font-bold text-slate-900 text-sm">{data?.paymentMethod || 'Transfer Bank BCA'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nomor Referensi / Giro:</span>
                    <span className="font-mono font-bold text-slate-900">{data?.referenceNo || data?.reference || 'TRF-BCA-88902'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Faktur Terkait:</span>
                    <span className="font-mono font-bold text-blue-600">{data?.invoiceNo || data?.invoice || 'INV/2026/08/0450'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jumlah Dibayar:</span>
                    <span className="font-black text-emerald-700 text-base">{formatRupiah(data?.amount || data?.paidAmount || 15000000)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isStatementDoc ? (
            <div className="mb-6 space-y-4 text-xs">
              <div className="font-bold text-slate-800 text-sm mb-2">Ringkasan Mutasi Piutang Pelanggan:</div>
              <table className="w-full text-left border-collapse text-xs mb-4">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="p-2.5">No Faktur</th>
                    <th className="p-2.5">Tgl Faktur</th>
                    <th className="p-2.5">Jatuh Tempo</th>
                    <th className="p-2.5 text-right">Nilai Faktur</th>
                    <th className="p-2.5 text-right">Sudah Dibayar</th>
                    <th className="p-2.5 text-right">Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">INV/2026/08/0450</td>
                    <td className="p-2.5">2026-08-01</td>
                    <td className="p-2.5 text-rose-600 font-bold">2026-08-31</td>
                    <td className="p-2.5 text-right font-bold">{formatRupiah(42180000)}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-bold">{formatRupiah(15000000)}</td>
                    <td className="p-2.5 text-right text-rose-700 font-black">{formatRupiah(27180000)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">INV/2026/08/0412</td>
                    <td className="p-2.5">2026-07-15</td>
                    <td className="p-2.5 text-slate-600 font-bold">2026-08-15</td>
                    <td className="p-2.5 text-right font-bold">{formatRupiah(18500000)}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-bold">{formatRupiah(0)}</td>
                    <td className="p-2.5 text-right text-rose-700 font-black">{formatRupiah(18500000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Items Table for SQ, SO, SJ, INV, PO, PINV */
            <table className="w-full text-left border-collapse text-xs mb-6">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-2.5 rounded-l">No</th>
                  <th className="p-2.5">Kode & Nama Material</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-center">Satuan</th>
                  <th className="p-2.5 text-right">Harga Satuan</th>
                  <th className="p-2.5">Skema Diskon Beruntun</th>
                  <th className="p-2.5 text-right rounded-r">Total Net (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {(data?.items && data.items.length > 0 ? data.items : [
                  {
                    productCode: 'SEM-3910',
                    productName: 'Semen Tiga Roda Portland PC 50kg',
                    qty: 200,
                    uom: 'Sak',
                    unitPrice: 72000,
                    discounts: [{ sequence: 1, type: 'percentage', value: 10 }],
                    subtotal: 12960000
                  },
                  {
                    productCode: 'BESI-12SNI',
                    productName: 'Besi Beton Polos 12mm x 12m SNI',
                    qty: 100,
                    uom: 'Batang',
                    unitPrice: 95000,
                    discounts: [{ sequence: 1, type: 'fixed', value: 5000 }],
                    subtotal: 9000000
                  }
                ]).map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-2.5">
                      <span className="font-bold text-slate-900 block">{item.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.productCode}</span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{item.qty}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.uom}</td>
                    <td className="p-2.5 text-right">{formatRupiah(item.unitPrice)}</td>
                    <td className="p-2.5">
                      {item.discounts && item.discounts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.discounts.map((d: any, dIdx: number) => (
                            <span
                              key={dIdx}
                              className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] border border-blue-200 font-semibold"
                            >
                              Step {d.sequence}: {d.type === 'percentage' ? `${d.value}%` : `Rp${d.value}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals Summary */}
          <div className="flex justify-between items-start mb-8 gap-6">
            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Catatan / Terms & Conditions:</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {data?.notes || 'Barang yang sudah dibeli tidak dapat dikembalikan tanpa persetujuan tertulis dari manajemen. Pembayaran dianggap sah setelah dana efektif di rekening PT Bahan Bangunan Jaya Distributor.'}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-1.5 text-xs shrink-0">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang:</span>
                <span className="font-bold text-slate-900">{formatRupiah(data?.subtotal || data?.amount || 21960000)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PPN (11%):</span>
                <span className="font-bold text-slate-900">{formatRupiah(data?.taxAmount || 2415600)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>TOTAL AKHIR:</span>
                <span className="text-blue-700">{formatRupiah(data?.totalAmount || data?.amount || 24375600)}</span>
              </div>
            </div>
          </div>

          {/* 4-Column Signatures Area */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs text-slate-600 pt-6 border-t border-slate-200">
            <div>
              <p className="font-semibold mb-12">Penerima Toko</p>
              <div className="border-b border-slate-400 w-32 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">( Cap & Tanda Tangan )</p>
            </div>
            <div>
              <p className="font-semibold mb-12">Pengemudi / Supir</p>
              <div className="border-b border-slate-400 w-32 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">( Nama Terang )</p>
            </div>
            <div>
              <p className="font-semibold mb-12">Kepala Gudang</p>
              <div className="border-b border-slate-400 w-32 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">( Supriatna )</p>
            </div>
            <div>
              <p className="font-semibold mb-12">Hormat Kami,</p>
              <div className="border-b border-slate-400 w-32 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">( Finance Manager )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
