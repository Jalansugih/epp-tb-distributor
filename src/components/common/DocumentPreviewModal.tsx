import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/discountEngine';
import { APP_NAME } from '../../lib/appInfo';
import { X, Printer } from 'lucide-react';

type DocData = Record<string, any>;

const value = (v: any, fallback = '—') =>
  v === undefined || v === null || v === '' ? fallback : String(v);

const money = (v: any) => formatRupiah(Number(v || 0));

const docNumber = (data: DocData) =>
  value(data?.code || data?.paymentNumber || data?.invoiceNo || data?.invoice || data?.referenceNo);

const dateOf = (data: DocData) =>
  value(data?.date || data?.invoiceDate || data?.paymentDate || data?.receiptDate);

const isPayment = (type: string) =>
  /RECEIPT|VOUCHER|KWITANSI|PEMBAYARAN|PELUNASAN/i.test(type);

const isStatement = (type: string) =>
  /STATEMENT|REKENING KORAN|KARTU PIUTANG/i.test(type);

const isDelivery = (type: string) =>
  /SURAT JALAN|DELIVERY/i.test(type);

const isGoodsReceipt = (type: string) =>
  /GOODS RECEIPT|SURAT PENERIMAAN/i.test(type);

const isPurchaseRequest = (type: string) =>
  /PURCHASE REQUEST|PERMINTAAN PEMBELIAN/i.test(type);

const isPurchaseInvoice = (type: string) =>
  /PURCHASE INVOICE|FAKTUR PEMBELIAN/i.test(type);

const isApVoucher = (type: string) =>
  /AP VOUCHER/i.test(type);

const itemsFor = (data: DocData) => Array.isArray(data?.items) ? data.items : [];

const ItemTable = ({ type, data }: { type: string; data: DocData }) => {
  const delivery = isDelivery(type) || isGoodsReceipt(type);
  const request = isPurchaseRequest(type);
  const items = itemsFor(data);

  if (delivery) {
    return (
      <table className="doc-table">
        <thead>
          <tr>
            <th className="w-no">No</th>
            <th>Kode</th>
            <th>Nama Barang</th>
            <th className="center">Qty</th>
            <th className="center">Satuan</th>
            {isGoodsReceipt(type) && <th className="center">Qty Diterima</th>}
            {isGoodsReceipt(type) && <th>Batch</th>}
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="mono">{value(item.productCode)}</td>
              <td className="strong">{value(item.productName)}</td>
              <td className="center">{value(item.qtyOrdered ?? item.qty)}</td>
              <td className="center">{value(item.uom)}</td>
              {isGoodsReceipt(type) && <td className="center strong">{value(item.qtyReceived)}</td>}
              {isGoodsReceipt(type) && <td className="mono">{value(item.batchNo)}</td>}
            </tr>
          )) : (
            <tr><td colSpan={isGoodsReceipt(type) ? 7 : 5} className="empty-row">Tidak ada rincian barang.</td></tr>
          )}
        </tbody>
      </table>
    );
  }

  if (request) {
    return (
      <table className="doc-table">
        <thead>
          <tr>
            <th className="w-no">No</th>
            <th>Kode</th>
            <th>Nama Barang</th>
            <th className="center">Qty</th>
            <th className="center">Satuan</th>
            <th className="right">Estimasi Harga</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="mono">{value(item.productCode)}</td>
              <td className="strong">{value(item.productName)}</td>
              <td className="center">{value(item.qty)}</td>
              <td className="center">{value(item.uom)}</td>
              <td className="right">{item.estimatedPrice != null ? money(item.estimatedPrice) : '—'}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="empty-row">Tidak ada rincian barang.</td></tr>
          )}
        </tbody>
      </table>
    );
  }

  return (
    <table className="doc-table">
      <thead>
        <tr>
          <th className="w-no">No</th>
          <th>Kode</th>
          <th>Nama Barang</th>
          <th className="center">Qty</th>
          <th className="center">Satuan</th>
          <th className="right">Harga Satuan</th>
          <th className="right">Diskon</th>
          <th className="right">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.length ? items.map((item: any, i: number) => {
          const discountText = Array.isArray(item.discounts) && item.discounts.length
            ? item.discounts.map((d: any) =>
                d.type === 'percentage' ? `${d.value}%` : money(d.value)
              ).join(' + ')
            : '—';
          return (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="mono">{value(item.productCode)}</td>
              <td className="strong">{value(item.productName)}</td>
              <td className="center">{value(item.qty)}</td>
              <td className="center">{value(item.uom)}</td>
              <td className="right">{money(item.unitPrice)}</td>
              <td className="right">{discountText}</td>
              <td className="right strong">{money(item.subtotal)}</td>
            </tr>
          );
        }) : (
          <tr><td colSpan={8} className="empty-row">Tidak ada rincian barang.</td></tr>
        )}
      </tbody>
    </table>
  );
};

const Totals = ({ data }: { data: DocData }) => (
  <div className="doc-total-wrap">
    <div className="doc-notes">
      <div className="label">Catatan / Keterangan</div>
      <div>{value(data?.notes)}</div>
    </div>
    <div className="doc-totals">
      <div><span>Subtotal</span><strong>{money(data?.subtotal)}</strong></div>
      {Number(data?.discountTotal || 0) !== 0 && (
        <div><span>Total Diskon</span><strong>{money(data?.discountTotal)}</strong></div>
      )}
      {Number(data?.taxAmount || 0) !== 0 && (
        <div><span>PPN</span><strong>{money(data?.taxAmount)}</strong></div>
      )}
      <div className="grand"><span>TOTAL</span><strong>{money(data?.totalAmount)}</strong></div>
    </div>
  </div>
);

const PaymentBlock = ({ data }: { data: DocData }) => (
  <div className="payment-box">
    <div><span>Nomor Pembayaran</span><strong className="mono">{docNumber(data)}</strong></div>
    <div><span>Tanggal</span><strong>{dateOf(data)}</strong></div>
    <div><span>Pelanggan / Supplier</span><strong>{value(data?.customerName || data?.supplierName)}</strong></div>
    <div><span>Faktur Terkait</span><strong className="mono">{value(data?.invoiceNo || data?.invoice)}</strong></div>
    <div><span>Metode Pembayaran</span><strong>{value(data?.paymentMethod)}</strong></div>
    <div><span>Bank / Referensi</span><strong>{value(data?.bankName || data?.referenceNo || data?.reference)}</strong></div>
    <div className="payment-amount"><span>JUMLAH DIBAYAR</span><strong>{money(data?.amount || data?.paidAmount)}</strong></div>
  </div>
);

const StatementBlock = ({ data }: { data: DocData }) => {
  const rows = Array.isArray(data?.items) ? data.items : [];
  return (
    <div>
      <div className="section-title">RINGKASAN PIUTANG</div>
      <table className="doc-table">
        <thead>
          <tr>
            <th>No</th><th>No Faktur</th><th>Tgl Faktur</th><th>Jatuh Tempo</th>
            <th className="right">Nilai</th><th className="right">Dibayar</th><th className="right">Sisa</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="mono">{value(r.invoiceNo || r.code)}</td>
              <td>{value(r.invoiceDate || r.date)}</td>
              <td>{value(r.dueDate)}</td>
              <td className="right">{money(r.total || r.amount)}</td>
              <td className="right">{money(r.paid || r.paidAmount)}</td>
              <td className="right strong">{money(r.outstanding || r.remainingAmount)}</td>
            </tr>
          )) : (
            <tr><td colSpan={7} className="empty-row">Tidak ada rincian mutasi pada data dokumen ini.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const DocumentPreviewModal: React.FC = () => {
  const { isDocModalOpen, docModalData, closeDocModal, systemSettings } = useApp();

  if (!isDocModalOpen || !docModalData) return null;

  const { type, title, data } = docModalData;
  const payment = isPayment(type) || isApVoucher(type);
  const statement = isStatement(type);
  const delivery = isDelivery(type);
  const goodsReceipt = isGoodsReceipt(type);
  const purchaseRequest = isPurchaseRequest(type);
  const purchaseInvoice = isPurchaseInvoice(type);

  const partyName = value(data?.customerName || data?.supplierName);
  const partyAddress = value(data?.address);
  const reference =
    value(data?.soCode || data?.poCode || data?.sjCode || data?.invoiceNo || data?.invoice);

  return (
    <div className="document-modal-backdrop print-document-backdrop">
      <div className="document-modal-shell">
        <div className="document-toolbar print-hidden">
          <div className="font-bold">{title}</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="print-button">
              <Printer className="w-4 h-4" /> Cetak / Simpan PDF
            </button>
            <button onClick={closeDocModal} className="close-button" aria-label="Tutup">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <article id="printable-area" className="print-document">
          <header className="doc-header">
            <div className="company">
              <div className="company-name">{systemSettings.companyName || 'Nama Perusahaan Belum Diisi'}</div>
              <div className="company-subtitle">Distributor Material Konstruksi & Bahan Bangunan</div>
              <div className="company-meta">
                {systemSettings.address || 'Alamat belum diisi — lengkapi di menu Pengaturan'}<br />
                {systemSettings.npwp ? `NPWP ${systemSettings.npwp}` : ''}
              </div>
            </div>
            <div className="doc-title">
              <div className="doc-type">{type}</div>
              <div className="doc-code">{docNumber(data)}</div>
              <div className="doc-date">Tanggal: {dateOf(data)}</div>
            </div>
          </header>

          <section className="doc-meta-grid">
            <div>
              <div className="doc-label">{purchaseRequest ? 'PEMOHON' : 'KEPADA YTH.'}</div>
              <div className="doc-party">{partyName}</div>
              {partyAddress !== '—' && <div>{partyAddress}</div>}
              {!payment && !statement && !delivery && !goodsReceipt && (
                <div>Syarat Pembayaran: {value(data?.paymentTermName)}</div>
              )}
            </div>
            <div>
              <div className="doc-label">INFORMASI DOKUMEN</div>
              {reference !== '—' && <div>Referensi: <strong className="mono">{reference}</strong></div>}
              {data?.warehouseName && <div>Gudang: <strong>{data.warehouseName}</strong></div>}
              {data?.salespersonName && <div>Sales: <strong>{data.salespersonName}</strong></div>}
              {data?.buyerName && <div>Buyer: <strong>{data.buyerName}</strong></div>}
              {data?.driverName && <div>Pengemudi: <strong>{data.driverName}</strong></div>}
              {data?.vehicleNo && <div>Kendaraan: <strong className="mono">{data.vehicleNo}</strong></div>}
              {data?.dueDate && <div>Jatuh Tempo: <strong>{data.dueDate}</strong></div>}
              {data?.validUntil && <div>Berlaku s/d: <strong>{data.validUntil}</strong></div>}
              {data?.status && <div>Status: <strong>{data.status}</strong></div>}
            </div>
          </section>

          {payment ? (
            <PaymentBlock data={data} />
          ) : statement ? (
            <StatementBlock data={data} />
          ) : (
            <>
              <ItemTable type={type} data={data} />
              {!delivery && !goodsReceipt && !purchaseRequest && <Totals data={data} />}
            </>
          )}

          {delivery && (
            <div className="delivery-extra">
              <div><span>Penerima</span><strong>{value(data?.receiverName)}</strong></div>
              <div><span>Diterima pada</span><strong>{value(data?.deliveredAt)}</strong></div>
            </div>
          )}

          <div className="signature-area">
            <div>
              <div className="signature-role">Dibuat / Diperiksa</div>
              <div className="signature-space" />
              <div className="signature-line" />
              <div className="signature-hint">Nama & Jabatan</div>
            </div>
            {delivery || goodsReceipt ? (
              <div>
                <div className="signature-role">Penerima Barang</div>
                <div className="signature-space" />
                <div className="signature-line" />
                <div className="signature-hint">Nama & Tanda Tangan</div>
              </div>
            ) : (
              <div>
                <div className="signature-role">Menyetujui</div>
                <div className="signature-space" />
                <div className="signature-line" />
                <div className="signature-hint">Nama & Jabatan</div>
              </div>
            )}
          </div>

          <footer className="doc-footer">
            <span>{type} · {docNumber(data)}</span>
            <span>Dicetak dari {APP_NAME}</span>
          </footer>
        </article>
      </div>
    </div>
  );
};
