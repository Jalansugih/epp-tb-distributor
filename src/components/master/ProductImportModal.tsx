import React, { useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { generateId, generateNumericCode } from '../../lib/identifiers';
import { PRODUCT_IMPORT_COLUMNS, buildProductImportTemplate, validateProductRows, type ProductImportRow } from '../../utils/productImport';
import type { Product } from '../../types';
import { BulkImportModal } from './BulkImportModal';

export const ProductImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { products, categories, brands, uoms, warehouses, importProducts } = useApp();

  const validate = useCallback(
    (rows: string[][], mode: 'skip' | 'update') =>
      validateProductRows(rows, {
        products,
        categories,
        brands,
        uoms,
        warehouses,
        mode,
        newId: () => generateId('prod'),
        newBarcode: () => generateNumericCode('899', 9),
      }),
    [products, categories, brands, uoms, warehouses]
  );

  return (
    <BulkImportModal<ProductImportRow>
      title="Upload Massal Katalog Produk"
      subtitle="Tambah atau perbarui banyak material sekaligus dari file CSV."
      noun="produk"
      nameLabel="Nama Produk"
      columns={PRODUCT_IMPORT_COLUMNS}
      templateFilename="template-upload-produk.csv"
      problemsFilename="masalah-upload-produk.csv"
      buildTemplate={() => buildProductImportTemplate({ categories, brands, uoms, warehouses })}
      validate={validate}
      getItem={(row) => row.product as unknown as ({ code: string } & Record<string, unknown>) | undefined}
      onImport={(items) => importProducts(items as unknown as Product[])}
      intro={
        <>
          Unduh template, isi di Excel, lalu simpan sebagai <b>CSV</b> (File &gt; Save As &gt; <i>CSV UTF-8</i>). Kategori, Merek, Satuan, dan
          Gudang harus sudah ada di Master Data. Baris contoh (diawali <b>CONTOH</b>) otomatis diabaikan.
        </>
      }
      existingPrompt="Jika Kode Produk sudah ada di katalog:"
      skipHint="(aman: hanya menambah produk baru)"
      updateHint={
        <>
          (nama, kategori, merek, harga, stok minimum, berat, status diperbarui; kolom kosong tidak mengubah data; <b>stok tidak diubah</b>)
        </>
      }
      onClose={onClose}
    />
  );
};
