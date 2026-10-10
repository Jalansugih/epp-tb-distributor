import type { Customer, PaymentTerm, Salesperson } from '../types';
import { csvCell, norm, normalizeHeader, parseNumber } from './csvImport';

/**
 * Mass upload (import) of store customers ("Pelanggan Toko") from CSV.
 * Same flow as products: parseDelimited -> validateCustomerRows -> preview ->
 * AppContext.importCustomers(valid customers).
 */

export const MAX_CUSTOMER_IMPORT_ROWS = 2000;

/** The store classifications offered by the customer form and its filter. */
export const CUSTOMER_GROUPS = ['Toko Kelontong Bangunan', 'Sub-Distributor', 'Kontraktor / Project', 'Retail Modern'] as const;

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

type ColumnKey =
  | 'code'
  | 'name'
  | 'group'
  | 'address'
  | 'city'
  | 'phone'
  | 'email'
  | 'taxNumber'
  | 'salesperson'
  | 'paymentTerm'
  | 'creditLimit'
  | 'status';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  required: boolean;
  aliases: string[];
  hint: string;
}

export const CUSTOMER_IMPORT_COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Kode Pelanggan', required: false, aliases: ['kodepelanggan', 'kode', 'kodetoko', 'code', 'customercode'], hint: 'Kosong = dibuatkan otomatis (CUST-xxx), kecuali nama + kota sudah ada (dianggap toko yang sama). Harus unik.' },
  { key: 'name', label: 'Nama Toko', required: true, aliases: ['namatoko', 'nama', 'namapelanggan', 'namatokoretail', 'name', 'customer'], hint: 'Wajib.' },
  { key: 'group', label: 'Grup', required: true, aliases: ['grup', 'group', 'tipe', 'tipetoko', 'klasifikasi', 'grupklasifikasitoko'], hint: `Wajib. Salah satu dari: ${CUSTOMER_GROUPS.join(' / ')}.` },
  { key: 'address', label: 'Alamat', required: false, aliases: ['alamat', 'alamatlengkap', 'alamattoko', 'address'], hint: 'Alamat lengkap toko.' },
  { key: 'city', label: 'Kota', required: false, aliases: ['kota', 'wilayah', 'kotawilayah', 'city'], hint: 'Kota / wilayah.' },
  { key: 'phone', label: 'Telepon', required: false, aliases: ['telepon', 'telp', 'hp', 'nohp', 'notelepon', 'phone'], hint: 'Nomor telepon/HP. Angka 0 di depan sering hilang di Excel; format kolom sebagai Teks sebelum mengetik.' },
  { key: 'email', label: 'Email', required: false, aliases: ['email'], hint: 'Opsional.' },
  { key: 'taxNumber', label: 'NPWP', required: false, aliases: ['npwp', 'nomornpwp', 'taxnumber'], hint: 'Opsional.' },
  { key: 'salesperson', label: 'Sales', required: false, aliases: ['sales', 'salesperson', 'namasales', 'eksekutifpenjualan', 'penanggungjawab'], hint: 'Nama atau kode sales yang sudah ada di Master Sales. Kosong = belum ditentukan.' },
  { key: 'paymentTerm', label: 'Termin Pembayaran', required: false, aliases: ['terminpembayaran', 'termin', 'paymentterm', 'top'], hint: 'Nama atau kode termin yang sudah ada. Kosong = termin pertama di master.' },
  { key: 'creditLimit', label: 'Limit Kredit', required: false, aliases: ['limitkredit', 'limit', 'plafon', 'creditlimit'], hint: 'Angka (Rp), tanpa titik/koma ribuan. Kosong = 0.' },
  { key: 'status', label: 'Status', required: false, aliases: ['status'], hint: 'aktif / nonaktif. Kosong = aktif.' },
];

const isExampleRow = (code: string, name: string) => /^contoh/i.test(code.trim()) || /^contoh/i.test(name.trim());

/* -------------------------------------------------------------------------- */
/* Template                                                                   */
/* -------------------------------------------------------------------------- */

export function buildCustomerImportTemplate(ctx: {
  salespersons: Pick<Salesperson, 'name'>[];
  paymentTerms: Pick<PaymentTerm, 'name'>[];
}): string {
  const sales = ctx.salespersons[0]?.name ?? '';
  const term = ctx.paymentTerms[0]?.name ?? '';
  const header = CUSTOMER_IMPORT_COLUMNS.map((c) => c.label);
  const example = (code: string, name: string, group: string, city: string, phone: string, limit: string) => [
    code, name, group, 'Jl. Contoh No. 1', city, phone, '', '', sales, term, limit, 'aktif',
  ];
  const lines = [
    header,
    example('CONTOH-001', 'CONTOH Toko Bangunan Satu (baris ini diabaikan)', CUSTOMER_GROUPS[0], 'Bandung', '081234567890', '50000000'),
    example('CONTOH-002', 'CONTOH Toko Bangunan Dua (baris ini diabaikan)', CUSTOMER_GROUPS[1], 'Cimahi', '082198765432', '150000000'),
  ].map((cells) => cells.map(csvCell).join(';'));
  return `\uFEFFsep=;\r\n${lines.join('\r\n')}\r\n`;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type CustomerImportMode = 'skip' | 'update';
export type CustomerImportRowStatus = 'new' | 'update' | 'skip' | 'error' | 'example';

export interface CustomerImportRow {
  line: number; // spreadsheet row number (header = 1)
  status: CustomerImportRowStatus;
  code: string;
  name: string;
  errors: string[];
  warnings: string[];
  customer?: Customer; // present for 'new' and 'update'
}

export interface CustomerImportResult {
  fatal?: string;
  missingColumns: string[];
  ignoredColumns: string[];
  rows: CustomerImportRow[];
  counts: Record<CustomerImportRowStatus, number>;
}

export interface CustomerImportContext {
  customers: Customer[];
  salespersons: Pick<Salesperson, 'id' | 'name' | 'code'>[];
  paymentTerms: Pick<PaymentTerm, 'id' | 'name' | 'code'>[];
  mode: CustomerImportMode;
  newId: () => string;
  /** YYYY-MM-DD used as the join date of new customers. */
  today?: string;
}

const emptyCounts = (): Record<CustomerImportRowStatus, number> => ({ new: 0, update: 0, skip: 0, error: 0, example: 0 });

function mapStatus(raw: string): Customer['status'] | null {
  switch (normalizeHeader(raw)) {
    case 'aktif':
    case 'active':
      return 'active';
    case 'nonaktif':
    case 'tidakaktif':
    case 'inactive':
    case 'suspended':
    case 'ditangguhkan':
    case 'nonaktifditangguhkan':
      return 'suspended';
    default:
      return null;
  }
}

const digitsOnly = (s: string) => s.replace(/\D/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomerRows(rows: string[][], ctx: CustomerImportContext): CustomerImportResult {
  const result: CustomerImportResult = { missingColumns: [], ignoredColumns: [], rows: [], counts: emptyCounts() };

  const headerIndex = rows.findIndex((r) => r.some((c) => c.trim() !== ''));
  if (headerIndex === -1) {
    result.fatal = 'File kosong.';
    return result;
  }

  const columnIndex = new Map<ColumnKey, number>();
  rows[headerIndex].forEach((rawHeader, idx) => {
    const key = normalizeHeader(rawHeader);
    if (!key) return;
    const def = CUSTOMER_IMPORT_COLUMNS.find((c) => c.aliases.includes(key));
    if (!def) result.ignoredColumns.push(rawHeader.trim());
    else if (!columnIndex.has(def.key)) columnIndex.set(def.key, idx);
  });

  result.missingColumns = CUSTOMER_IMPORT_COLUMNS.filter((c) => c.required && !columnIndex.has(c.key)).map((c) => c.label);
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
  if (nonEmptyCount > MAX_CUSTOMER_IMPORT_ROWS) {
    result.fatal = `Maksimal ${MAX_CUSTOMER_IMPORT_ROWS} baris per upload (file ini ${nonEmptyCount} baris). Bagi menjadi beberapa file.`;
    return result;
  }

  const cell = (row: string[], key: ColumnKey) => {
    const idx = columnIndex.get(key);
    return idx === undefined ? '' : (row[idx] ?? '').trim();
  };

  /* Lookups */
  const groupByKey = new Map<string, string>(CUSTOMER_GROUPS.map((g) => [normalizeHeader(g), g]));
  const salesByKey = new Map<string, Pick<Salesperson, 'id' | 'name' | 'code'>>();
  ctx.salespersons.forEach((s) => {
    salesByKey.set(norm(s.name), s);
    if (s.code) salesByKey.set(norm(s.code), s);
  });
  const termByKey = new Map<string, Pick<PaymentTerm, 'id' | 'name' | 'code'>>();
  ctx.paymentTerms.forEach((t) => {
    termByKey.set(norm(t.name), t);
    if (t.code) termByKey.set(norm(t.code), t);
  });

  const nameCityKey = (name: string, city: string) => `${norm(name)}|${norm(city)}`;
  const existingByCode = new Map<string, Customer>();
  const existingByNameCity = new Map<string, Customer>();
  const existingByPhone = new Map<string, Customer>();
  ctx.customers.forEach((c) => {
    existingByCode.set(norm(c.code), c);
    const k = nameCityKey(c.name, c.city ?? '');
    if (!existingByNameCity.has(k)) existingByNameCity.set(k, c);
    const d = digitsOnly(c.phone ?? '');
    if (d.length >= 6 && !existingByPhone.has(d)) existingByPhone.set(d, c);
  });

  /* Codes used anywhere, so generated codes never collide */
  const takenCodes = new Set<string>(existingByCode.keys());
  let maxSuffix = 100;
  const trackSuffix = (code: string) => {
    const m = code.trim().match(/^CUST-(\d+)$/i);
    if (m) maxSuffix = Math.max(maxSuffix, Number(m[1]));
  };
  ctx.customers.forEach((c) => trackSuffix(c.code));
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
      candidate = `CUST-${maxSuffix}`;
    } while (takenCodes.has(norm(candidate)));
    takenCodes.add(norm(candidate));
    return candidate;
  };

  const today = ctx.today ?? new Date().toISOString().split('T')[0];
  const seenCodes = new Map<string, number>();
  const seenNameCity = new Map<string, number>(); // rows without a code
  const seenPhones = new Map<string, number>();

  dataRows.forEach((raw, offset) => {
    if (!raw.some((c) => c.trim() !== '')) return;

    const line = headerIndex + offset + 2;
    const code = cell(raw, 'code');
    const name = cell(raw, 'name');
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isExampleRow(code, name)) {
      result.rows.push({ line, status: 'example', code, name, errors, warnings });
      result.counts.example += 1;
      return;
    }

    /* Text fields */
    if (!name) errors.push('Nama Toko wajib diisi.');
    else if (name.length > 200) errors.push('Nama Toko maksimal 200 karakter.');
    if (code.length > 50) errors.push('Kode Pelanggan maksimal 50 karakter.');

    const groupRaw = cell(raw, 'group');
    const group = groupRaw ? groupByKey.get(normalizeHeader(groupRaw)) : undefined;
    if (!groupRaw) errors.push('Grup wajib diisi.');
    else if (!group) errors.push(`Grup "${groupRaw}" tidak dikenal. Pilih salah satu: ${CUSTOMER_GROUPS.join(' / ')}.`);

    const address = cell(raw, 'address');
    const city = cell(raw, 'city');
    if (address.length > 300) errors.push('Alamat maksimal 300 karakter.');
    if (city.length > 100) errors.push('Kota maksimal 100 karakter.');

    /* Phone: Excel drops the leading 0 of numbers; restore it for Indonesian mobiles. */
    let phone = cell(raw, 'phone');
    if (phone) {
      if (!/^[+\d\s().-]+$/.test(phone)) {
        errors.push(`Telepon "${phone}" hanya boleh berisi angka, spasi, + ( ) . -`);
      } else if (/^8\d{8,11}$/.test(phone)) {
        phone = `0${phone}`;
        warnings.push(`Telepon diawali 8 (0 di depan hilang di Excel), diperbaiki menjadi ${phone}.`);
      }
      if (phone.length > 30) errors.push('Telepon maksimal 30 karakter.');
    }

    const email = cell(raw, 'email');
    if (email && !EMAIL_RE.test(email)) errors.push(`Email "${email}" tidak valid.`);
    const taxNumber = cell(raw, 'taxNumber');
    if (taxNumber.length > 30) errors.push('NPWP maksimal 30 karakter.');

    /* Masters */
    const salesRaw = cell(raw, 'salesperson');
    const sales = salesRaw ? salesByKey.get(norm(salesRaw)) : undefined;
    if (salesRaw && !sales) errors.push(`Sales "${salesRaw}" belum ada di Master Sales.`);
    const termRaw = cell(raw, 'paymentTerm');
    const term = termRaw ? termByKey.get(norm(termRaw)) : undefined;
    if (termRaw && !term) errors.push(`Termin "${termRaw}" belum ada di Master Termin Pembayaran.`);

    /* Credit limit */
    let creditLimit: number | null = null;
    {
      const text = cell(raw, 'creditLimit');
      const parsed = parseNumber(text);
      if (!parsed.ok) errors.push(`Limit Kredit "${text}" bukan angka yang valid (gunakan angka polos, mis. 50000000).`);
      else if (parsed.value !== null && parsed.value < 0) errors.push('Limit Kredit tidak boleh negatif.');
      else creditLimit = parsed.value;
    }

    /* Status */
    const statusRaw = cell(raw, 'status');
    let status: Customer['status'] | null = null;
    if (statusRaw) {
      status = mapStatus(statusRaw);
      if (!status) errors.push(`Status "${statusRaw}" tidak dikenal (pakai aktif / nonaktif).`);
    }

    /* In-file duplicates */
    if (code) {
      const first = seenCodes.get(norm(code));
      if (first !== undefined) errors.push(`Kode "${code}" dobel dengan baris ${first}.`);
      else seenCodes.set(norm(code), line);
    } else if (name) {
      const key = nameCityKey(name, city);
      const first = seenNameCity.get(key);
      if (first !== undefined) {
        errors.push(`Nama dan kota sama dengan baris ${first}. Isi Kode Pelanggan yang berbeda jika memang toko berbeda.`);
      } else {
        seenNameCity.set(key, line);
      }
    }

    /* Match an existing customer: by code, or (no code) by exact name + city */
    const matchedByName = !code && !!name ? existingByNameCity.get(nameCityKey(name, city)) : undefined;
    const existing = code ? existingByCode.get(norm(code)) : matchedByName;

    /* Non-blocking warnings */
    const phoneDigits = digitsOnly(phone);
    if (phoneDigits.length >= 6) {
      const owner = existingByPhone.get(phoneDigits);
      const firstLine = seenPhones.get(phoneDigits);
      if (owner && (!existing || owner.id !== existing.id)) warnings.push(`Nomor telepon sama dengan pelanggan ${owner.code} (${owner.name}).`);
      else if (firstLine !== undefined) warnings.push(`Nomor telepon sama dengan baris ${firstLine}.`);
      if (firstLine === undefined) seenPhones.set(phoneDigits, line);
    }
    if (!existing && name) {
      const lookalike = existingByNameCity.get(nameCityKey(name, city));
      if (lookalike) warnings.push(`Nama dan kota sama dengan pelanggan ${lookalike.code}. Pastikan ini bukan data dobel.`);
    }

    /* Outcome */
    if (errors.length > 0) {
      result.rows.push({ line, status: 'error', code, name, errors, warnings });
      result.counts.error += 1;
      return;
    }

    if (existing) {
      if (ctx.mode === 'skip') {
        warnings.push(
          matchedByName
            ? `Tanpa kode: nama dan kota sama dengan pelanggan ${existing.code}, baris dilewati.`
            : 'Kode sudah ada di data pelanggan, baris dilewati.'
        );
        result.rows.push({ line, status: 'skip', code, name, errors, warnings });
        result.counts.skip += 1;
        return;
      }
      if (matchedByName) warnings.push(`Tanpa kode: dicocokkan dengan pelanggan ${existing.code} berdasarkan nama dan kota.`);
      // Update: only overwrite what the file provides. Outstanding/credit usage is never touched.
      const merged: Customer = {
        ...existing,
        name,
        group: group!,
        address: address || existing.address,
        city: city || existing.city,
        phone: phone || existing.phone,
        email: email || existing.email,
        taxNumber: taxNumber || existing.taxNumber,
        salespersonId: sales ? sales.id : existing.salespersonId,
        salespersonName: sales ? sales.name : existing.salespersonName,
        paymentTermId: term ? term.id : existing.paymentTermId,
        paymentTermName: term ? term.name : existing.paymentTermName,
        creditLimit: creditLimit ?? existing.creditLimit,
        status: status ?? existing.status,
      };
      result.rows.push({ line, status: 'update', code: existing.code, name, errors, warnings, customer: merged });
      result.counts.update += 1;
      return;
    }

    /* New customer (mirrors what the manual form saves) */
    const finalCode = code || generateCode();
    const defaultTerm = term ?? ctx.paymentTerms[0];
    if (!sales) warnings.push('Sales kosong: pelanggan belum ditentukan salesnya.');
    if (!term) warnings.push(`Termin kosong: memakai termin pertama di master (${defaultTerm?.name ?? 'NET 30'}).`);

    const customer: Customer = {
      id: ctx.newId(),
      code: finalCode,
      name,
      group: group!,
      address,
      city,
      phone,
      ...(email ? { email } : {}),
      ...(taxNumber ? { taxNumber } : {}),
      salespersonId: sales?.id ?? '',
      salespersonName: sales?.name ?? 'Unassigned',
      paymentTermId: defaultTerm?.id ?? '',
      paymentTermName: defaultTerm?.name ?? 'NET 30',
      creditLimit: creditLimit ?? 0,
      usedCredit: 0,
      outstandingAR: 0,
      status: status ?? 'active',
      joinDate: today,
    };
    result.rows.push({ line, status: 'new', code: finalCode, name, errors, warnings, customer });
    result.counts.new += 1;
  });

  if (result.rows.length === 0) result.fatal = 'Tidak ada baris data di bawah baris judul.';
  return result;
}
