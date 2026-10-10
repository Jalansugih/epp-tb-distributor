import React, { useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../lib/identifiers';
import {
  CUSTOMER_IMPORT_COLUMNS,
  buildCustomerImportTemplate,
  validateCustomerRows,
  type CustomerImportRow,
} from '../../utils/customerImport';
import type { Customer } from '../../types';
import { BulkImportModal } from './BulkImportModal';

export const CustomerImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { customers, salespersons, paymentTerms, importCustomers } = useApp();

  const validate = useCallback(
    (rows: string[][], mode: 'skip' | 'update') =>
      validateCustomerRows(rows, {
        customers,
        salespersons,
        paymentTerms,
        mode,
        newId: () => generateId('cust'),
      }),
    [customers, salespersons, paymentTerms]
  );

  return (
    <BulkImportModal<CustomerImportRow>
      title="Upload Massal Pelanggan Toko"
      subtitle="Tambah atau perbarui banyak toko sekaligus dari file CSV."
      noun="pelanggan"
      nameLabel="Nama Toko"
      columns={CUSTOMER_IMPORT_COLUMNS}
      templateFilename="template-upload-pelanggan.csv"
      problemsFilename="masalah-upload-pelanggan.csv"
      buildTemplate={() => buildCustomerImportTemplate({ salespersons, paymentTerms })}
      validate={validate}
      getItem={(row) => row.customer as unknown as ({ code: string } & Record<string, unknown>) | undefined}
      onImport={(items) => importCustomers(items as unknown as Customer[])}
      intro={
        <>
          Unduh template, isi di Excel, lalu simpan sebagai <b>CSV</b> (File &gt; Save As &gt; <i>CSV UTF-8</i>). Sales dan Termin Pembayaran
          harus sudah ada di Master Data. Agar angka 0 di depan nomor telepon tidak hilang, ubah format kolom Telepon menjadi <b>Text</b> sebelum
          mengetik. Baris contoh (diawali <b>CONTOH</b>) otomatis diabaikan.
        </>
      }
      existingPrompt="Jika pelanggan sudah ada (kode sama, atau tanpa kode tetapi nama + kota sama):"
      skipHint="(aman: hanya menambah pelanggan baru)"
      updateHint={
        <>
          (nama, grup, alamat, kota, telepon, email, NPWP, sales, termin, limit kredit, status diperbarui; kolom kosong tidak mengubah data;{' '}
          <b>piutang berjalan tidak diubah</b>)
        </>
      }
      onClose={onClose}
    />
  );
};
