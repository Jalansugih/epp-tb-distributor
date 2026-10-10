/**
 * Shared helpers for CSV mass upload (products, customers, ...):
 * CSV parsing, Indonesian/English number parsing and small text utilities.
 * Pure functions only (no React, no network) so they are unit tested.
 */

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
/* Text helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Lowercases, strips accents and every non-alphanumeric char: "Berat (Kg)" -> "beratkg". */
export const normalizeHeader = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Trim + lowercase, used for case-insensitive lookups. */
export const norm = (s: string) => s.trim().toLowerCase();

/** Escapes one cell for a semicolon-separated CSV. */
export const csvCell = (value: string) => (/[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
