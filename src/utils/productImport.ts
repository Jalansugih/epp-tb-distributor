import type { Brand, Category, Product, Uom, Warehouse } from '../types';

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
/* CSV parsing                                                                */
/* -------------------------------------------------------------------------- */

const DELIMITERS = [';', '\t', ','] as const;

function detectDelimiter(text: string): string {
  // Count candidate delimiters outside quotes on the first non-empty line.
  const firstLine = text.split(/\r\n|\n|\r/).find((l) => l.trim() !== '' && !/^sep=/i.test(l.trim())) ?? '';
  const counts = new Map<string, number>(DELIMITERS.map((d) => [d, 0]));
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && counts.has(ch)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let best: string = ';';
  let bestCount = 0;
  for (const d of DELIMITERS) {
    const c = counts.get(d) ?? 0;
    if (c > bestCount) {
      best = d;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Parses CSV/TSV text. Handles quotes, escaped quotes (""), line breaks inside
 * quotes, a UTF-8 BOM, an Excel "sep=;" first line, and auto-detects the
 * delimiter (Indonesian Excel exports ";", English Excel exports ",").
 * Empty rows are kept so the returned index matches the spreadsheet row.
 */
export function parseDelimited(input: string): string[][] {
  let text = input.replace(/^\uFEFF/, '');
  let delimiter: string | null = null;

  const sep = text.match(/^sep=(.)\r?\n/i);
  if (sep) {
    delimiter = sep[1];
    text = text.slice(sep[0].length);
  }
  if (!delimiter) delimiter = detectDelimiter(text);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === delimiter) {
      endField();
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      endRow();
    } else if (ch === '\n') {
      endRow();
    } else {
      field += ch;
    }
  }
  // Last row without trailing newline.
  if (field !== '' || row.length > 0) endRow();

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Number parsing (Indonesian + English formats)                              */
/* -------------------------------------------------------------------------- */

export type ParsedNumber = { ok: true; value: number | null } | { ok: false };

/**
 * Accepts "1500000", "1.500.000", "1.500.000,50", "1,500,000.50", "Rp 25.000",
 * "12,5" and "12.5". Empty -> { ok: true, value: null }.
 * Ambiguous values such as "1,500" (1.5 or 1500?) are rejected instead of
 * guessed, because a silent 1000x mistake in a price is worse than an error.
 */
export function parseNumber(raw: string): ParsedNumber {
  let s = raw.trim().replace(/^rp\.?\s*/i, '').replace(/\s/g, '');
  if (s === '') return { ok: true, value: null };

  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return { ok: false };

  const groupsOk = (str: string, sep: string) => {
    const parts = str.split(sep);
    return parts.length > 1 && parts[0].length >= 1 && parts[0].length <= 3 && parts.slice(1).every((p) => /^\d{3}$/.test(p));
  };

  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  let normalized: string;

  if (dots > 0 && commas > 0) {
    const decimalSep = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    const [intPart, fracPart, ...extra] = s.split(decimalSep);
    if (extra.length > 0 || !/^\d+$/.test(fracPart ?? '')) return { ok: false };
    if (intPart.includes(decimalSep) || !groupsOk(intPart, thousandSep)) return { ok: false };
    normalized = `${intPart.split(thousandSep).join('')}.${fracPart}`;
  } else if (dots > 0 || commas > 0) {
    const sepChar = dots > 0 ? '.' : ',';
    const count = dots > 0 ? dots : commas;
    if (count > 1) {
      if (!groupsOk(s, sepChar)) return { ok: false };
      normalized = s.split(sepChar).join('');
    } else {
      const [before, after] = s.split(sepChar);
      const looksLikeThousands = /^\d{1,3}$/.test(before) && before !== '0' && /^\d{3}$/.test(after);
      if (looksLikeThousands) {
        // "1.500" is a thousands group in Indonesian notation; "1,500" is ambiguous.
        if (sepChar === ',') return { ok: false };
        normalized = `${before}${after}`;
      } else {
        if (before === '' || after === '') return { ok: false };
        normalized = `${before}.${after}`;
      }
    }
  } else {
    normalized = s;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false };
  return { ok: true, value: negative ? -value : value };
}

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
  { key: 'code', label: 'Kode Produk', required: false, aliases: ['kodeproduk', 'kode', 'kodesku', 'kodematerial', 'sku', 'code'], hint: 'Kosong = dibuatkan otomatis (MAT-xxx). Harus unik.' },
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

const normalizeHeader = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const norm = (s: string) => s.trim().toLowerCase();

/** Rows whose code or name starts with "CONTOH" (the template examples) are ignored. */
const isExampleRow = (code: string, name: string) => /^contoh/i.test(code.trim()) || /^contoh/i.test(name.trim());

/* -------------------------------------------------------------------------- */
/* Template                                                                   */
/* -------------------------------------------------------------------------- */

const csvCell = (value: string) => (/[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

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

    const existing = code ? existingByCode.get(norm(code)) : undefined;

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
        warnings.push('Kode sudah ada di katalog, baris dilewati.');
        result.rows.push({ line, status: 'skip', code, name, errors, warnings });
        result.counts.skip += 1;
        return;
      }
      // Update: only overwrite what the file provides; stock/warehouses are never touched.
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
