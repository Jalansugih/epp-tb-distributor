import { describe, expect, it } from 'vitest';
import type { Customer } from '../types';
import {
  CUSTOMER_GROUPS,
  MAX_CUSTOMER_IMPORT_ROWS,
  buildCustomerImportTemplate,
  validateCustomerRows,
  type CustomerImportContext,
} from './customerImport';
import { parseDelimited } from './csvImport';

const existingCustomer = (over: Partial<Customer> = {}): Customer => ({
  id: 'cust-1',
  code: 'CUST-101',
  name: 'Toko Jaya Abadi',
  group: 'Sub-Distributor',
  phone: '081111111111',
  email: 'jaya@toko.id',
  taxNumber: '01.234.567.8-901.000',
  address: 'Jl. Lama 1',
  city: 'Bandung',
  salespersonId: 'sp-1',
  salespersonName: 'Andi',
  creditLimit: 10000000,
  usedCredit: 2500000,
  outstandingAR: 2500000,
  paymentTermId: 'pt-1',
  paymentTermName: 'NET 30',
  status: 'active',
  joinDate: '2026-01-01',
  ...over,
});

let n = 0;
const ctx = (over: Partial<CustomerImportContext> = {}): CustomerImportContext => ({
  customers: [existingCustomer()],
  salespersons: [
    { id: 'sp-1', name: 'Andi', code: 'SLS-01' },
    { id: 'sp-2', name: 'Budi', code: 'SLS-02' },
  ],
  paymentTerms: [
    { id: 'pt-1', name: 'NET 30', code: 'N30' },
    { id: 'pt-2', name: 'COD', code: 'COD' },
  ],
  mode: 'skip',
  newId: () => `cust-new-${++n}`,
  today: '2026-10-10',
  ...over,
});

const HEADER = 'Kode Pelanggan;Nama Toko;Grup;Alamat;Kota;Telepon;Email;NPWP;Sales;Termin Pembayaran;Limit Kredit;Status';
const run = (lines: string[], over: Partial<CustomerImportContext> = {}) =>
  validateCustomerRows(parseDelimited([HEADER, ...lines].join('\n')), ctx(over));

describe('validateCustomerRows - structure', () => {
  it('requires Nama Toko and Grup columns', () => {
    const r = validateCustomerRows(parseDelimited('Kode;Kota\nA;B'), ctx());
    expect(r.fatal).toMatch(/Nama Toko, Grup/);
  });
  it('fails on empty and header-only files', () => {
    expect(validateCustomerRows([], ctx()).fatal).toBeTruthy();
    expect(validateCustomerRows(parseDelimited(HEADER), ctx()).fatal).toBeTruthy();
  });
  it('enforces the row limit', () => {
    const lines = Array.from({ length: MAX_CUSTOMER_IMPORT_ROWS + 1 }, (_, i) => `K${i};Toko ${i};Retail Modern;;;;;;;;;`);
    expect(run(lines).fatal).toMatch(/Maksimal/);
  });
  it('accepts header aliases and reports unknown columns', () => {
    const rows = parseDelimited('Nama;Tipe;HP;Catatan\nToko Baru;retail modern;081234567890;halo');
    const r = validateCustomerRows(rows, ctx());
    expect(r.fatal).toBeUndefined();
    expect(r.ignoredColumns).toEqual(['Catatan']);
    expect(r.counts.new).toBe(1);
  });
});

describe('validateCustomerRows - new customers', () => {
  it('builds a customer shaped like the manual form output', () => {
    const r = run(['CUST-500;Toko Baru;kontraktor/project;Jl. Baru 5;Cimahi;0812-3456-7890;baru@toko.id;99.999;budi;cod;50.000.000;aktif']);
    expect(r.counts.new).toBe(1);
    expect(r.rows[0].customer).toMatchObject({
      code: 'CUST-500', name: 'Toko Baru', group: 'Kontraktor / Project',
      address: 'Jl. Baru 5', city: 'Cimahi', phone: '0812-3456-7890',
      email: 'baru@toko.id', taxNumber: '99.999',
      salespersonId: 'sp-2', salespersonName: 'Budi',
      paymentTermId: 'pt-2', paymentTermName: 'COD',
      creditLimit: 50000000, usedCredit: 0, outstandingAR: 0,
      status: 'active', joinDate: '2026-10-10',
    });
    expect(r.rows[0].customer!.id).toMatch(/^cust-new-/);
  });
  it('defaults: unassigned sales, first payment term, limit 0, with explanatory warnings', () => {
    const r = run(['N1;Toko Minimal;Retail Modern;;;;;;;;;']);
    const c = r.rows[0].customer!;
    expect(c).toMatchObject({ salespersonId: '', salespersonName: 'Unassigned', paymentTermId: 'pt-1', paymentTermName: 'NET 30', creditLimit: 0, status: 'active' });
    expect(r.rows[0].warnings.join(' ')).toMatch(/Sales kosong/);
    expect(r.rows[0].warnings.join(' ')).toMatch(/Termin kosong/);
  });
  it('maps non-active statuses to suspended', () => {
    expect(run(['N1;A;Retail Modern;;;;;;;;;nonaktif']).rows[0].customer!.status).toBe('suspended');
    expect(run(['N2;B;Retail Modern;;;;;;;;;Ditangguhkan']).rows[0].customer!.status).toBe('suspended');
  });
  it('restores the leading 0 that Excel drops from mobile numbers', () => {
    const r = run(['N1;Toko HP;Retail Modern;;;81234567890;;;;;;']);
    expect(r.rows[0].customer!.phone).toBe('081234567890');
    expect(r.rows[0].warnings.join(' ')).toMatch(/diperbaiki menjadi 081234567890/);
  });
  it('generates unique codes avoiding existing and in-file codes', () => {
    const r = run([';Toko A;Retail Modern;;Bandung;;;;;;;', ';Toko B;Retail Modern;;Bandung;;;;;;;', 'CUST-103;Toko C;Retail Modern;;;;;;;;;']);
    const codes = r.rows.map((x) => x.customer!.code);
    expect(new Set(codes).size).toBe(3);
    expect(codes[2]).toBe('CUST-103');
    expect(codes[0]).not.toBe('CUST-103');
    expect(codes[1]).not.toBe('CUST-103');
    expect(codes[0]).not.toBe('CUST-101');
  });
  it('works with no sales or payment terms configured', () => {
    const c = run(['N1;Toko;Retail Modern;;;;;;;;;'], { salespersons: [], paymentTerms: [] }).rows[0].customer!;
    expect(c).toMatchObject({ salespersonId: '', paymentTermId: '', paymentTermName: 'NET 30' });
  });
});

describe('validateCustomerRows - errors', () => {
  it('reports every problem of a row with the spreadsheet line', () => {
    const r = run(['E1;;Warung;;;12ab;bukan-email;;Zed;Kredit 90;abc;mati']);
    const row = r.rows[0];
    expect(row.status).toBe('error');
    expect(row.line).toBe(2);
    const msg = row.errors.join(' | ');
    expect(msg).toMatch(/Nama Toko wajib/);
    expect(msg).toMatch(/Grup "Warung"/);
    expect(msg).toMatch(/Telepon "12ab"/);
    expect(msg).toMatch(/Email "bukan-email"/);
    expect(msg).toMatch(/Sales "Zed"/);
    expect(msg).toMatch(/Termin "Kredit 90"/);
    expect(msg).toMatch(/Limit Kredit "abc"/);
    expect(msg).toMatch(/Status "mati"/);
    expect(row.customer).toBeUndefined();
  });
  it('rejects a negative credit limit', () => {
    expect(run(['E1;Toko;Retail Modern;;;;;;;;-5;']).rows[0].errors[0]).toMatch(/negatif/);
  });
  it('flags duplicated codes in the file but keeps the first', () => {
    const r = run(['D1;Satu;Retail Modern;;;;;;;;;', 'd1;Dua;Retail Modern;;;;;;;;;']);
    expect(r.rows.map((x) => x.status)).toEqual(['new', 'error']);
    expect(r.rows[1].errors[0]).toMatch(/dobel dengan baris 2/);
  });
  it('flags the same name+city twice without codes, but allows different cities', () => {
    const same = run([';Toko Kembar;Retail Modern;;Bandung;;;;;;;', ';toko kembar;Retail Modern;;bandung;;;;;;;']);
    expect(same.rows[1].status).toBe('error');
    const diff = run([';Toko Kembar;Retail Modern;;Bandung;;;;;;;', ';Toko Kembar;Retail Modern;;Cimahi;;;;;;;']);
    expect(diff.counts.new).toBe(2);
  });
  it('numbers lines correctly around blank rows', () => {
    const r = run(['A1;Satu;Retail Modern;;;;;;;;;', ';;;;;;;;;;;', 'A2;;Retail Modern;;;;;;;;;']);
    expect(r.rows.map((x) => x.line)).toEqual([2, 4]);
  });
});

describe('validateCustomerRows - existing customers', () => {
  const line = 'CUST-101;Toko Jaya Abadi Baru;Retail Modern;;;;;;budi;;25.000.000;nonaktif';

  it('skip mode leaves existing customers untouched', () => {
    const r = run([line], { mode: 'skip' });
    expect(r.counts.skip).toBe(1);
    expect(r.rows[0].customer).toBeUndefined();
  });
  it('update mode merges only provided fields and never touches receivables', () => {
    const r = run([line], { mode: 'update' });
    expect(r.counts.update).toBe(1);
    expect(r.rows[0].customer).toMatchObject({
      id: 'cust-1', code: 'CUST-101', name: 'Toko Jaya Abadi Baru', group: 'Retail Modern',
      salespersonId: 'sp-2', salespersonName: 'Budi',
      creditLimit: 25000000, status: 'suspended',
      // untouched because blank in the file:
      address: 'Jl. Lama 1', city: 'Bandung', phone: '081111111111', email: 'jaya@toko.id',
      taxNumber: '01.234.567.8-901.000', paymentTermId: 'pt-1', joinDate: '2026-01-01',
      // never touched:
      usedCredit: 2500000, outstandingAR: 2500000,
    });
  });
  it('matches codes case-insensitively', () => {
    expect(run(['cust-101;X;Retail Modern;;;;;;;;;'], { mode: 'skip' }).counts.skip).toBe(1);
  });
  it('without a code, matches an existing customer by exact name + city (safe re-upload)', () => {
    const skipped = run([';toko jaya abadi;Sub-Distributor;;bandung;;;;;;;'], { mode: 'skip' });
    expect(skipped.counts.skip).toBe(1);
    expect(skipped.rows[0].warnings.join(' ')).toMatch(/Tanpa kode/);
    const updated = run([';Toko Jaya Abadi;Sub-Distributor;Jl. Pindah 9;Bandung;;;;;;;'], { mode: 'update' });
    expect(updated.counts.update).toBe(1);
    expect(updated.rows[0].customer).toMatchObject({ id: 'cust-1', address: 'Jl. Pindah 9' });
  });
  it('same name in another city is a new customer, with a look-alike hint only for same city', () => {
    const r = run([';Toko Jaya Abadi;Sub-Distributor;;Cimahi;;;;;;;']);
    expect(r.counts.new).toBe(1);
    const lookalike = run(['NEW-9;Toko Jaya Abadi;Sub-Distributor;;Bandung;;;;;;;']);
    expect(lookalike.counts.new).toBe(1);
    expect(lookalike.rows[0].warnings.join(' ')).toMatch(/Nama dan kota sama dengan pelanggan CUST-101/);
  });
  it('warns when a phone number belongs to another customer', () => {
    const r = run(['P1;Toko Lain;Retail Modern;;;081111111111;;;;;;']);
    expect(r.counts.new).toBe(1);
    expect(r.rows[0].warnings.join(' ')).toMatch(/telepon sama dengan pelanggan CUST-101/);
  });
});

describe('templates and examples', () => {
  it('ignores CONTOH rows', () => {
    const r = run(['CONTOH-1;CONTOH Toko;X;;;;;;;;;', 'REAL-1;Toko Asli;Retail Modern;;;;;;;;;']);
    expect(r.counts.example).toBe(1);
    expect(r.counts.new).toBe(1);
  });
  it('template round-trips: examples ignored and no errors', () => {
    const c = ctx();
    const tpl = buildCustomerImportTemplate({ salespersons: c.salespersons, paymentTerms: c.paymentTerms });
    expect(tpl.startsWith('\uFEFFsep=;')).toBe(true);
    const r = validateCustomerRows(parseDelimited(tpl), c);
    expect(r.fatal).toBeUndefined();
    expect(r.counts.example).toBe(2);
    expect(r.counts.error).toBe(0);
  });
  it('groups list matches the four store types of the form', () => {
    expect(CUSTOMER_GROUPS).toEqual(['Toko Kelontong Bangunan', 'Sub-Distributor', 'Kontraktor / Project', 'Retail Modern']);
  });
});
