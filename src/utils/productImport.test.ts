import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import {
  buildProductImportTemplate,
  MAX_IMPORT_ROWS,
  parseDelimited,
  parseNumber,
  validateProductRows,
  type ProductImportContext,
} from './productImport';

const existingProduct = (over: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  code: 'MAT-101',
  sku: 'MAT-101',
  barcode: '8990000001',
  name: 'Semen Lama',
  category: 'Semen',
  brand: 'Merek A',
  uom: 'Sak',
  buyPrice: 40000,
  sellPrice: 50000,
  stock: 10,
  minStock: 5,
  warehouseId: 'wh-1',
  warehouseName: 'Gudang Utama',
  status: 'active',
  uomConversions: [
    { uomName: 'Sak', ratio: 1, isBase: true, sellPrice: 50000 },
    { uomName: 'Pallet', ratio: 40, isBase: false, sellPrice: 1900000 },
  ],
  ...over,
});

let idCounter = 0;
const ctx = (over: Partial<ProductImportContext> = {}): ProductImportContext => ({
  products: [existingProduct()],
  categories: [{ name: 'Semen' }, { name: 'Cat' }],
  brands: [{ name: 'Merek A' }, { name: 'Merek B' }],
  uoms: [{ name: 'Sak' }, { name: 'Kg' }],
  warehouses: [
    { id: 'wh-1', name: 'Gudang Utama' },
    { id: 'wh-2', name: 'Gudang Cabang' },
  ],
  mode: 'skip',
  newId: () => `prod-new-${++idCounter}`,
  newBarcode: () => '8990000999',
  ...over,
});

const HEADER = 'Kode Produk;Nama Produk;Kategori;Merek;Satuan;Harga Beli;Harga Jual;Stok Awal;Stok Minimum;Barcode;Berat (Kg);Status;Gudang';
const run = (lines: string[], over: Partial<ProductImportContext> = {}) =>
  validateProductRows(parseDelimited([HEADER, ...lines].join('\n')), ctx(over));

describe('parseDelimited', () => {
  it('detects semicolon, comma and tab delimiters', () => {
    expect(parseDelimited('a;b;c\n1;2;3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
    expect(parseDelimited('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
    expect(parseDelimited('a\tb\tc\n1\t2\t3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('handles quotes, escaped quotes, embedded delimiters and line breaks', () => {
    expect(parseDelimited('a;b\n"x;y";"say ""hi"""\n"line1\nline2";z')).toEqual([
      ['a', 'b'],
      ['x;y', 'say "hi"'],
      ['line1\nline2', 'z'],
    ]);
  });
  it('strips the BOM and an Excel sep= line, and handles CRLF', () => {
    expect(parseDelimited('\uFEFFsep=;\r\na;b\r\n1;2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('does not treat a comma inside a semicolon file as the delimiter', () => {
    expect(parseDelimited('Nama;Harga\nSemen 40,5 kg;1000')).toEqual([['Nama', 'Harga'], ['Semen 40,5 kg', '1000']]);
  });
});

describe('parseNumber', () => {
  const val = (s: string) => {
    const r = parseNumber(s);
    return r.ok ? r.value : 'INVALID';
  };
  it('parses plain and Indonesian formats', () => {
    expect(val('1500000')).toBe(1500000);
    expect(val('1.500.000')).toBe(1500000);
    expect(val('1.500')).toBe(1500);
    expect(val('1.500.000,50')).toBe(1500000.5);
    expect(val('Rp 25.000')).toBe(25000);
    expect(val('12,5')).toBe(12.5);
    expect(val('12.5')).toBe(12.5);
    expect(val('0.5')).toBe(0.5);
    expect(val('0')).toBe(0);
  });
  it('parses English thousands formats', () => {
    expect(val('1,500,000')).toBe(1500000);
    expect(val('1,500,000.50')).toBe(1500000.5);
  });
  it('returns null for blank and rejects invalid or ambiguous input', () => {
    expect(val('')).toBeNull();
    expect(val('abc')).toBe('INVALID');
    expect(val('1,500')).toBe('INVALID'); // 1.5 or 1500? refuse to guess
    expect(val('1.5.0')).toBe('INVALID');
    expect(val('12a')).toBe('INVALID');
  });
});

describe('validateProductRows - structure', () => {
  it('fails when required columns are missing', () => {
    const r = validateProductRows(parseDelimited('Kode;Nama\nA;B'), ctx());
    expect(r.fatal).toMatch(/Kategori, Merek, Satuan/);
  });
  it('fails on an empty file or header-only file', () => {
    expect(validateProductRows([], ctx()).fatal).toBeTruthy();
    expect(validateProductRows(parseDelimited(HEADER), ctx()).fatal).toBeTruthy();
  });
  it('rejects files over the row limit', () => {
    const lines = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `P${i};Produk ${i};Semen;Merek A;Sak;;;;;;;;`);
    expect(run(lines).fatal).toMatch(/Maksimal/);
  });
  it('accepts header aliases and reports unknown columns', () => {
    const rows = parseDelimited('SKU;Material;Category;Brand;UoM;Catatan\nX1;Semen Baru;Semen;Merek A;Sak;hello');
    const r = validateProductRows(rows, ctx());
    expect(r.fatal).toBeUndefined();
    expect(r.ignoredColumns).toEqual(['Catatan']);
    expect(r.counts.new).toBe(1);
  });
});

describe('validateProductRows - new products', () => {
  it('builds a complete product mirroring the manual form', () => {
    const r = run(['NEW-1;Semen Baru;semen;merek b;sak;45.000;52000;100;20;;40;aktif;Gudang Cabang']);
    expect(r.counts.new).toBe(1);
    const p = r.rows[0].product!;
    expect(p).toMatchObject({
      code: 'NEW-1', sku: 'NEW-1', name: 'Semen Baru',
      category: 'Semen', brand: 'Merek B', uom: 'Sak', // canonical master spelling
      buyPrice: 45000, sellPrice: 52000, stock: 100, minStock: 20, weightKg: 40,
      taxPercent: 11, status: 'active', barcode: '8990000999',
      warehouseId: 'wh-2', warehouseName: 'Gudang Cabang',
    });
    expect(p.warehouses).toEqual([
      { warehouseId: 'wh-1', warehouseName: 'Gudang Utama', stock: 0 },
      { warehouseId: 'wh-2', warehouseName: 'Gudang Cabang', stock: 100 },
    ]);
    expect(p.uomConversions).toEqual([{ uomName: 'Sak', ratio: 1, isBase: true, sellPrice: 52000 }]);
    expect(p.id).toMatch(/^prod-new-/);
  });
  it('defaults optional fields and uses the first warehouse', () => {
    const p = run(['N1;Produk Minimal;Cat;Merek A;Kg;;;;;;;;']).rows[0].product!;
    expect(p).toMatchObject({ buyPrice: 0, sellPrice: 0, stock: 0, minStock: 0, weightKg: 0, status: 'active', warehouseId: 'wh-1' });
    expect(p.warehouses?.[0].stock).toBe(0);
  });
  it('generates unique codes that avoid existing and in-file codes', () => {
    const r = run([
      ';Tanpa Kode 1;Semen;Merek A;Sak;;;;;;;;',
      ';Tanpa Kode 2;Semen;Merek A;Sak;;;;;;;;',
      'MAT-103;Kode Eksplisit;Semen;Merek A;Sak;;;;;;;;',
    ]);
    const codes = r.rows.map((x) => x.product!.code);
    expect(new Set(codes).size).toBe(3);
    expect(codes[2]).toBe('MAT-103');
    expect(codes[0]).not.toBe('MAT-101');
    expect(codes[0]).not.toBe('MAT-103');
    expect(codes[1]).not.toBe('MAT-103');
  });
  it('works with no warehouses configured', () => {
    const p = run(['N1;Produk;Semen;Merek A;Sak;;;5;;;;;'], { warehouses: [] }).rows[0].product!;
    expect(p.warehouseId).toBe('');
    expect(p.warehouseName).toBe('Belum ditentukan');
    expect(p.warehouses).toEqual([]);
  });
});

describe('validateProductRows - errors', () => {
  it('reports every problem of a row, with the spreadsheet line number', () => {
    const r = run(['E1;;Beton;Merek Z;Meter;abc;-5;;;;;libur;Gudang X']);
    expect(r.counts.error).toBe(1);
    const row = r.rows[0];
    expect(row.line).toBe(2);
    expect(row.errors.join(' | ')).toMatch(/Nama Produk wajib/);
    expect(row.errors.join(' | ')).toMatch(/Kategori "Beton"/);
    expect(row.errors.join(' | ')).toMatch(/Merek "Merek Z"/);
    expect(row.errors.join(' | ')).toMatch(/Satuan "Meter"/);
    expect(row.errors.join(' | ')).toMatch(/Harga Beli "abc"/);
    expect(row.errors.join(' | ')).toMatch(/Harga Jual tidak boleh negatif/);
    expect(row.errors.join(' | ')).toMatch(/Status "libur"/);
    expect(row.errors.join(' | ')).toMatch(/Gudang "Gudang X"/);
    expect(row.product).toBeUndefined();
  });
  it('flags a code duplicated inside the file but keeps the first occurrence', () => {
    const r = run(['D1;Satu;Semen;Merek A;Sak;;;;;;;;', 'd1;Dua;Semen;Merek A;Sak;;;;;;;;']);
    expect(r.rows[0].status).toBe('new');
    expect(r.rows[1].status).toBe('error');
    expect(r.rows[1].errors[0]).toMatch(/dobel dengan baris 2/);
  });
  it('numbers lines correctly around blank rows', () => {
    const r = run(['A1;Satu;Semen;Merek A;Sak;;;;;;;;', ';;;;;;;;;;;;', 'A2;;Semen;Merek A;Sak;;;;;;;;']);
    expect(r.rows.map((x) => x.line)).toEqual([2, 4]);
  });
});

describe('validateProductRows - existing codes', () => {
  const line = 'MAT-101;Semen Baru Nama;Cat;Merek B;Sak;41000;;999;7;;;;';

  it('skip mode leaves existing products untouched', () => {
    const r = run([line], { mode: 'skip' });
    expect(r.counts.skip).toBe(1);
    expect(r.rows[0].product).toBeUndefined();
  });
  it('update mode merges provided fields and never touches stock or ids', () => {
    const r = run([line], { mode: 'update' });
    expect(r.counts.update).toBe(1);
    const p = r.rows[0].product!;
    expect(p).toMatchObject({
      id: 'prod-1', code: 'MAT-101', name: 'Semen Baru Nama', category: 'Cat', brand: 'Merek B',
      buyPrice: 41000, minStock: 7,
      sellPrice: 50000, // blank in file -> unchanged
      stock: 10,        // 999 in file ignored
      barcode: '8990000001',
    });
    expect(r.rows[0].warnings.join(' ')).toMatch(/Stok Awal diabaikan/);
  });
  it('update mode changes only the base conversion price and keeps other conversions', () => {
    const p = run(['MAT-101;Semen;Semen;Merek A;Sak;;55000;;;;;;'], { mode: 'update' }).rows[0].product!;
    expect(p.sellPrice).toBe(55000);
    expect(p.uomConversions).toEqual([
      { uomName: 'Sak', ratio: 1, isBase: true, sellPrice: 55000 },
      { uomName: 'Pallet', ratio: 40, isBase: false, sellPrice: 1900000 },
    ]);
  });
  it('update mode refuses to change the unit of an existing product', () => {
    const r = run(['MAT-101;Semen;Semen;Merek A;Kg;;;;;;;;'], { mode: 'update' });
    expect(r.counts.error).toBe(1);
    expect(r.rows[0].errors[0]).toMatch(/tidak bisa diubah/);
  });
  it('matches existing codes case-insensitively', () => {
    expect(run(['mat-101;Semen;Semen;Merek A;Sak;;;;;;;;'], { mode: 'skip' }).counts.skip).toBe(1);
  });
});

describe('validateProductRows - warnings and examples', () => {
  it('warns (without blocking) when selling below cost and on shared barcodes', () => {
    const r = run(['W1;Rugi;Semen;Merek A;Sak;50000;40000;;;8990000001;;;']);
    expect(r.counts.new).toBe(1);
    expect(r.rows[0].warnings.join(' ')).toMatch(/lebih rendah/);
    expect(r.rows[0].warnings.join(' ')).toMatch(/Barcode sudah dipakai produk MAT-101/);
  });
  it('ignores the template example rows', () => {
    const r = run(['CONTOH-001;CONTOH Produk Satu;X;Y;Z;;;;;;;;', 'REAL-1;Produk Asli;Semen;Merek A;Sak;;;;;;;;']);
    expect(r.counts.example).toBe(1);
    expect(r.counts.new).toBe(1);
  });
});

describe('buildProductImportTemplate', () => {
  it('round-trips through the parser and validator (examples ignored, no errors)', () => {
    const c = ctx();
    const template = buildProductImportTemplate({
      categories: c.categories, brands: c.brands, uoms: c.uoms, warehouses: c.warehouses,
    });
    expect(template.startsWith('\uFEFFsep=;')).toBe(true);
    const r = validateProductRows(parseDelimited(template), c);
    expect(r.fatal).toBeUndefined();
    expect(r.counts.example).toBe(2);
    expect(r.counts.error).toBe(0);
  });
});
