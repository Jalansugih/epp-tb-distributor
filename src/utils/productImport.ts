import type { Brand, Category, Product, Uom, Warehouse } from '../types';
import { csvCell, norm, normalizeHeader, parseDelimited, parseNumber } from './csvImport';

// Re-exported so existing imports from './productImport' keep working.
export { parseDelimited, parseNumber };
export type { ParsedNumber } from './csvImport';

/**
 * Mass upload (import) of products from a CSV file.
 *
 * Everything here is pure (no React, no network) so it can be unit tested.
 * The flow is: parseDelimited(text) -> validateProductRows(rows, context) ->
 * the UI shows a preview -> the valid `product`s are handed to
 * AppContext.importProducts().
 */

export const MAX_IMPORT_ROWS = 2000;

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

type ColumnKey =
  | 'code'
  | 'name'
  | 'category'
  | 'brand'
  | 'uom'
  | 'buyPrice'
  | 'sellPrice'
  | 'stock'
  | 'minStock'
  | 'barcode'
  | 'weightKg'
  | 'status'
  | 'warehouse';

interface ColumnDef {
  key: ColumnKey;
  label: string; // header used in the template
  required: boolean;
  aliases: string[]; // normalized header spellings accepted
  hint: string;
}

export const PRODUCT_IMPORT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Kode Produk', required: false, aliases: ['kodeproduk', 'kode', 'kodesku', 'kodematerial', 'sku', 'code'], hint: 'Kosong = dibuatkan otomatis (MAT-xxx), kecuali nama sudah ada di katalog (dianggap produk yang sama). Harus unik.' },
  { key: 'name', label: 'Nama Produk', required: true, aliases: ['namaproduk', 'nama', 'namamaterial', 'produk', 'material', 'name'], hint: 'Wajib.' },
  { key: 'category', label: 'Kategori', required: true, aliases: ['kategori', 'category'], hint: 'Wajib. Harus sudah ada di Master Kategori.' },
  { key: 'brand', label: 'Merek', required: true, aliases: ['merek', 'brand', 'principal'], hint: 'Wajib. Harus sudah ada di Master Merek.' },
  { key: 'uom', label: 'Satuan', required: true, aliases: ['satuan', 'uom', 'satuandasar'], hint: 'Wajib. Harus sudah ada di Master Satuan.' },
  { key: 'buyPrice', label: 'Harga Beli', required: false, aliases: ['hargabeli', 'hargabelipabrik', 'hpp', 'buyprice'], hint: 'Angka, tanpa titik/koma ribuan. Kosong = 0.' },
  { key: 'sellPrice', label: 'Harga Jual', required: false, aliases: ['hargajual', 'harga', 'sellprice'], hint: 'Angka. Kosong = 0.' },
  { key: 'stock', label: 'Stok Awal', required: false, aliases: ['stokawal', 'stok', 'stock', 'qty'], hint: 'Hanya untuk produk BARU. Kosong = 0.' },
  { key: 'minStock', label: 'Stok Minimum', required: false, aliases: ['stokminimum', 'stokmin', 'minstok', 'minstock'], hint: 'Batas peringatan stok menipis. Kosong = 0.' },
  { key: 'barcode', label: 'Barcode', required: false, aliases: ['barcode', 'kodebarcode'], hint: 'Kosong = dibuatkan otomatis.' },
  { key: 'weightKg', label: 'Berat (Kg)', required: false, aliases: ['beratkg', 'berat', 'weight', 'weightkg'], hint: 'Angka. Kosong = 0.' },
  { key: 'status', label: 'Status', required: false, aliases: ['status'], hint: 'aktif / nonaktif / dihentikan. Kosong = aktif.' },
  { key: 'warehouse', label: 'Gudang', required: false, aliases: ['gudang', 'warehouse', 'gudangawal'], hint: 'Gudang tempat stok awal. Kosong = gudang pertama.' },
];


/** Rows whose code or name starts with "CONTOH" (the template examples) are ignored. */
const isExampleRow = (code: string, name: string) => /^contoh/i.test(code.trim()) || /^contoh/i.test(name.trim());

/* -------------------------------------------------------------------------- */
/* Template                                                                   */
/* -------------------------------------------------------------------------- */


/**
 * Builds the downloadable template. It starts with "sep=;" so Excel splits the
 * columns correctly regardless of the computer's regional settings, and uses
 * the user's REAL category/brand/uom/warehouse names in the example rows.
 */
export function buildProductImportTemplate(ctx: {
  categories: Pick<Category, 'name'>[];
  brands: Pick<Brand, 'name'>[];
  uoms: Pick<Uom, 'name'>[];
  warehouses: Pick<Warehouse, 'name'>[];
}): string {
  const category = ctx.categories[0]?.name ?? 'Semen';
  const brand = ctx.brands[0]?.name ?? 'Merek A';
  const uom = ctx.uoms[0]?.name ?? 'Sak';
  const warehouse = ctx.warehouses[0]?.name ?? '';

  const header = PRODUCT_IMPORT_COLUMNS.map((c) => c.label);
  const example = (code: string, name: string, buy: string, sell: string, stock: string, min: string, weight: string) => [
    code, name, category, brand, uom, buy, sell, stock, min, '', weight, 'aktif', warehouse,
  ];

  const lines = [
    header,
    example('CONTOH-001', 'CONTOH Produk Satu (baris ini diabaikan)', '45000', '52000', '100', '20', '40'),
    example('CONTOH-002', 'CONTOH Produk Dua (baris ini diabaikan)', '78500', '85000', '50', '10', '25'),
  ].map((cells) => cells.map(csvCell).join(';'));

  return `\uFEFFsep=;\r\n${lines.join('\r\n')}\r\n`;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type ImportMode = 'skip' | 'update';
export type ImportRowStatus = 'new' | 'update' | 'skip' | 'error' | 'example';

export interface ProductImportRow {
  line: number; // spreadsheet row number (header = 1)
  status: ImportRowStatus;
  code: string;
  name: string;
  errors: string[];
  warnings: string[];
  product?: Product; // present for 'new' and 'update'
}

export interface ProductImportResult {
  fatal?: string;
  missingColumns: string[];
  ignoredColumns: string[];
  rows: ProductImportRow[];
  counts: Record<ImportRowStatus, number>;
}

export interface ProductImportContext {
  products: Product[];
  categories: Pick<Category, 'name'>[];
  brands: Pick<Brand, 'name'>[];
  uoms: Pick<Uom, 'name'>[];
  warehouses: Pick<Warehouse, 'id' | 'name'>[];
  mode: ImportMode;
  newId: () => string;
  newBarcode: () => string;
}

const emptyCounts = (): Record<ImportRowStatus, number> => ({ new: 0, update: 0, skip: 0, error: 0, example: 0 });

function mapStatus(raw: string): Product['status'] | null {
  switch (norm(raw)) {
    case 'aktif':
    case 'active':
      return 'active';
    case 'nonaktif':
    case 'tidakaktif':
    case 'tidak aktif':
    case 'inactive':
      return 'inactive';
    case 'dihentikan':
    case 'discontinued':
      return 'discontinued';
    default:
      return null;
  }
}

export function validateProductRows(rows: string[][], ctx: ProductImportContext): ProductImportResult {
  const result: ProductImportResult = { missingColumns: [], ignoredColumns: [], rows: [], counts: emptyCounts() };

  // Header = first row that has any content.
  const headerIndex = rows.findIndex((r) => r.some((c) => c.trim() !== ''));
  if (headerIndex === -1) {
    result.fatal = 'File kosong.';
    return result;
  }

  const columnIndex = new Map<ColumnKey, number>();
  rows[headerIndex].forEach((rawHeader, idx) => {
    const key = normalizeHeader(rawHeader);
    if (!key) return;
    const def = PRODUCT_IMPORT_COLUMNS.find((c) => c.aliases.includes(key));
    if (!def) {
      result.ignoredColumns.push(rawHeader.trim());
    } else if (!columnIndex.has(def.key)) {
      columnIndex.set(def.key, idx);
    }
  });

  result.missingColumns = PRODUCT_IMPORT_COLUMNS.filter((c) => c.required && !columnIndex.has(c.key)).map((c) => c.label);
  if (result.missingColumns.length > 0) {
    result.fatal = `Kolom wajib tidak ditemukan di baris judul: ${result.missingColumns.join(', ')}. Gunakan template yang disediakan.`;
    return result;
  }

  const dataRows = rows.slice(headerIndex + 1);
  const nonEmptyCount = dataRows.filter((r) => r.some((c) => c.trim() !== '')).length;
  if (nonEmptyCount === 0) {
    result.fatal = 'Tidak ada baris data di bawah baris judul.';
    return result;
  }
  if (nonEmptyCount > MAX_IMPORT_ROWS) {
    result.fatal = `Maksimal ${MAX_IMPORT_ROWS} baris per upload (file ini ${nonEmptyCount} baris). Bagi menjadi beberapa file.`;
    return result;
  }

  const cell = (row: string[], key: ColumnKey) => {
    const idx = columnIndex.get(key);
    return idx === undefined ? '' : (row[idx] ?? '').trim();
  };

  /* Lookup tables (case-insensitive, canonical master spelling is stored). */
  const categoryByName = new Map(ctx.categories.map((c) => [norm(c.name), c.name]));
  const brandByName = new Map(ctx.brands.map((b) => [norm(b.name), b.name]));
  const uomByName = new Map(ctx.uoms.map((u) => [norm(u.name), u.name]));
  const warehouseByName = new Map(ctx.warehouses.map((w) => [norm(w.name), w]));
  const existingByCode = new Map<string, Product>();
  ctx.products.forEach((p) => existingByCode.set(norm(p.code), p));
  // Rows WITHOUT a code are matched to existing products by exact name, so
  // uploading the same file twice does not create duplicates.
  const existingByName = new Map<string, Product>();
  ctx.products.forEach((p) => {
    if (!existingByName.has(norm(p.name))) existingByName.set(norm(p.name), p);
  });

  /* Pre-scan: codes used anywhere (existing + file) so generated codes never collide. */
  const takenCodes = new Set<string>(existingByCode.keys());
  let maxSuffix = 100;
  const trackSuffix = (code: string) => {
    const m = code.trim().match(/^MAT-(\d+)$/i);
    if (m) maxSuffix = Math.max(maxSuffix, Number(m[1]));
  };
  ctx.products.forEach((p) => trackSuffix(p.code));
  dataRows.forEach((r) => {
    const code = cell(r, 'code');
    if (code) {
      takenCodes.add(norm(code));
      trackSuffix(code);
    }
  });
  const generateCode = () => {
    let candidate: string;
    do {
      maxSuffix += 1;
      candidate = `MAT-${maxSuffix}`;
    } while (takenCodes.has(norm(candidate)));
    takenCodes.add(norm(candidate));
    return candidate;
  };

  const seenCodes = new Map<string, number>(); // code -> first line in file
  const seenNames = new Map<string, number>(); // name -> first line, for rows without a code
  const barcodeOwner = new Map<string, string>(); // barcode -> product code (existing)
  ctx.products.forEach((p) => p.barcode && barcodeOwner.set(norm(p.barcode), p.code));
  const seenBarcodes = new Map<string, number>(); // barcode -> first line in file

  dataRows.forEach((raw, offset) => {
    if (!raw.some((c) => c.trim() !== '')) return; // blank spreadsheet row

    const line = headerIndex + offset + 2; // header = row 1 when headerIndex = 0
    const code = cell(raw, 'code');
    const name = cell(raw, 'name');
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isExampleRow(code, name)) {
      result.rows.push({ line, status: 'example', code, name, errors, warnings });
      result.counts.example += 1;
      return;
    }

    /* Required text fields */
    if (!name) errors.push('Nama Produk wajib diisi.');
    else if (name.length > 200) errors.push('Nama Produk maksimal 200 karakter.');
    if (code.length > 50) errors.push('Kode Produk maksimal 50 karakter.');

    /* Masters */
    const categoryRaw = cell(raw, 'category');
    const brandRaw = cell(raw, 'brand');
    const uomRaw = cell(raw, 'uom');
    const category = categoryRaw ? categoryByName.get(norm(categoryRaw)) : undefined;
    const brand = brandRaw ? brandByName.get(norm(brandRaw)) : undefined;
    const uom = uomRaw ? uomByName.get(norm(uomRaw)) : undefined;
    if (!categoryRaw) errors.push('Kategori wajib diisi.');
    else if (!category) errors.push(`Kategori "${categoryRaw}" belum ada di Master Kategori.`);
    if (!brandRaw) errors.push('Merek wajib diisi.');
    else if (!brand) errors.push(`Merek "${brandRaw}" belum ada di Master Merek.`);
    if (!uomRaw) errors.push('Satuan wajib diisi.');
    else if (!uom) errors.push(`Satuan "${uomRaw}" belum ada di Master Satuan.`);

    /* Numbers */
    const readNumber = (key: ColumnKey, label: string, opts: { allowNegative?: boolean } = {}) => {
      const text = cell(raw, key);
      const parsed = parseNumber(text);
      if (!parsed.ok) {
        errors.push(`${label} "${text}" bukan angka yang valid (gunakan angka polos, mis. 1500000 atau 12,5).`);
        return null;
      }
      if (parsed.value !== null && parsed.value < 0 && !opts.allowNegative) {
        errors.push(`${label} tidak boleh negatif.`);
        return null;
      }
      return parsed.value; // null = left blank
    };
    const buyPrice = readNumber('buyPrice', 'Harga Beli');
    const sellPrice = readNumber('sellPrice', 'Harga Jual');
    const stock = readNumber('stock', 'Stok Awal');
    const minStock = readNumber('minStock', 'Stok Minimum');
    const weightKg = readNumber('weightKg', 'Berat');

    /* Status */
    const statusRaw = cell(raw, 'status');
    let status: Product['status'] | null = null;
    if (statusRaw) {
      status = mapStatus(statusRaw);
      if (!status) errors.push(`Status "${statusRaw}" tidak dikenal (pakai aktif / nonaktif / dihentikan).`);
    }

    /* Warehouse (only used for NEW products) */
    const warehouseRaw = cell(raw, 'warehouse');
    let warehouse = ctx.warehouses[0];
    if (warehouseRaw) {
      const found = warehouseByName.get(norm(warehouseRaw));
      if (found) warehouse = found;
      else errors.push(`Gudang "${warehouseRaw}" belum ada di Master Gudang.`);
    }

    /* Barcode */
    const barcodeRaw = cell(raw, 'barcode');
    if (barcodeRaw.length > 50) errors.push('Barcode maksimal 50 karakter.');

    /* Duplicate code inside the file */
    let finalCode = code;
    if (code) {
      const first = seenCodes.get(norm(code));
      if (first !== undefined) errors.push(`Kode "${code}" dobel dengan baris ${first}.`);
      else seenCodes.set(norm(code), line);
    }

    if (!code && name) {
      const firstByName = seenNames.get(norm(name));
      if (firstByName !== undefined) {
        errors.push(`Nama "${name}" dobel dengan baris ${firstByName}. Isi Kode Produk yang berbeda jika memang produk berbeda.`);
      } else {
        seenNames.set(norm(name), line);
      }
    }

    const matchedByName = !code && !!name ? existingByName.get(norm(name)) : undefined;
    const existing = code ? existingByCode.get(norm(code)) : matchedByName;

    /* Update-mode specific rules */
    if (existing && ctx.mode === 'update' && uom && norm(existing.uom) !== norm(uom)) {
      errors.push(`Satuan produk yang sudah ada (${existing.uom}) tidak bisa diubah lewat upload massal. Ubah lewat form edit.`);
    }

    /* Non-blocking warnings */
    if (buyPrice !== null && sellPrice !== null && sellPrice > 0 && buyPrice > sellPrice) {
      warnings.push('Harga jual lebih rendah dari harga beli.');
    }
    if (barcodeRaw) {
      const bc = norm(barcodeRaw);
      const ownerCode = barcodeOwner.get(bc);
      const firstLine = seenBarcodes.get(bc);
      if (ownerCode && norm(ownerCode) !== norm(code)) warnings.push(`Barcode sudah dipakai produk ${ownerCode}.`);
      else if (firstLine !== undefined) warnings.push(`Barcode sama dengan baris ${firstLine}.`);
      if (firstLine === undefined) seenBarcodes.set(bc, line);
    }
    if (existing && stock !== null && stock !== existing.stock) {
      warnings.push('Stok Awal diabaikan untuk produk yang sudah ada (stok diubah lewat Penyesuaian Stok).');
    }

    /* Decide outcome */
    if (errors.length > 0) {
      result.rows.push({ line, status: 'error', code, name, errors, warnings });
      result.counts.error += 1;
      return;
    }

    if (existing) {
      if (ctx.mode === 'skip') {
        warnings.push(
          matchedByName
            ? `Tanpa kode: nama sama dengan produk ${existing.code}, baris dilewati.`
            : 'Kode sudah ada di katalog, baris dilewati.'
        );
        result.rows.push({ line, status: 'skip', code, name, errors, warnings });
        result.counts.skip += 1;
        return;
      }
      // Update: only overwrite what the file provides; stock/warehouses are never touched.
      if (matchedByName) warnings.push(`Tanpa kode: dicocokkan dengan produk ${existing.code} berdasarkan nama.`);
      const sell = sellPrice ?? existing.sellPrice;
      const merged: Product = {
        ...existing,
        name,
        category: category!,
        brand: brand!,
        buyPrice: buyPrice ?? existing.buyPrice,
        sellPrice: sell,
        minStock: minStock ?? existing.minStock,
        weightKg: weightKg ?? existing.weightKg,
        barcode: barcodeRaw || existing.barcode,
        status: status ?? existing.status,
        uomConversions: existing.uomConversions?.length
          ? existing.uomConversions.map((c: any) => (c.isBase ? { ...c, sellPrice: sell } : c))
          : [{ uomName: existing.uom, ratio: 1, isBase: true, sellPrice: sell }],
      };
      result.rows.push({ line, status: 'update', code: existing.code, name, errors, warnings, product: merged });
      result.counts.update += 1;
      return;
    }

    // New product
    finalCode = finalCode || generateCode();
    const initialStock = stock ?? 0;
    const sellValue = sellPrice ?? 0;
    const product: Product = {
      id: ctx.newId(),
      code: finalCode,
      sku: finalCode,
      barcode: barcodeRaw || ctx.newBarcode(),
      name,
      category: category!,
      brand: brand!,
      uom: uom!,
      buyPrice: buyPrice ?? 0,
      sellPrice: sellValue,
      stock: initialStock,
      minStock: minStock ?? 0,
      weightKg: weightKg ?? 0,
      taxPercent: 11,
      warehouseId: warehouse?.id ?? '',
      warehouseName: warehouse?.name ?? 'Belum ditentukan',
      status: status ?? 'active',
      warehouses: ctx.warehouses.map((w) => ({
        warehouseId: w.id,
        warehouseName: w.name,
        stock: warehouse && w.id === warehouse.id ? initialStock : 0,
      })),
      uomConversions: [{ uomName: uom!, ratio: 1, isBase: true, sellPrice: sellValue }],
    };
    result.rows.push({ line, status: 'new', code: finalCode, name, errors, warnings, product });
    result.counts.new += 1;
  });

  if (result.rows.length === 0) result.fatal = 'Tidak ada baris data di bawah baris judul.';
  return result;
}
