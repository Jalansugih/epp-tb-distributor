import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateId, generateNumericCode } from '../../lib/identifiers';
import {
  PRODUCT_IMPORT_COLUMNS,
  buildProductImportTemplate,
  parseDelimited,
  validateProductRows,
  type ImportMode,
  type ImportRowStatus,
} from '../../utils/productImport';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS_SHOWN = 500;

const STATUS_STYLE: Record<ImportRowStatus, { label: string; className: string }> = {
  new: { label: 'Baru', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update: { label: 'Perbarui', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  skip: { label: 'Dilewati', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  error: { label: 'Error', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  example: { label: 'Contoh', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Decodes as UTF-8; falls back to Windows-1252 for old Excel "CSV (comma delimited)" files. */
async function readFileText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

const csvCell = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const ProductImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { products, categories, brands, uoms, warehouses, importProducts } = useApp();

  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [readError, setReadError] = useState('');
  const [reading, setReading] = useState(false);
  const [mode, setMode] = useState<ImportMode>('skip');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const result = useMemo(
    () =>
      rawRows
        ? validateProductRows(rawRows, {
            products,
            categories,
            brands,
            uoms,
            warehouses,
            mode,
            newId: () => generateId('prod'),
            newBarcode: () => generateNumericCode('899', 9),
          })
        : null,
    [rawRows, mode, products, categories, brands, uoms, warehouses]
  );

  const importable = result ? result.counts.new + result.counts.update : 0;
  const visibleRows = useMemo(() => {
    if (!result) return [];
    const rows = result.rows.filter((r) => r.status !== 'example');
    return onlyProblems ? rows.filter((r) => r.status === 'error' || r.warnings.length > 0) : rows;
  }, [result, onlyProblems]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setReadError('');
    setRawRows(null);
    setFileName(file.name);
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setReadError('Format file harus CSV. Di Excel: File > Save As > "CSV UTF-8 (Comma delimited)".');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setReadError('Ukuran file maksimal 5 MB.');
      return;
    }
    try {
      setReading(true);
      setRawRows(parseDelimited(await readFileText(file)));
    } catch {
      setReadError('File tidak bisa dibaca. Pastikan file tidak rusak.');
    } finally {
      setReading(false);
    }
  };

  const handleDownloadTemplate = () =>
    downloadTextFile('template-upload-produk.csv', buildProductImportTemplate({ categories, brands, uoms, warehouses }));

  const handleDownloadProblems = () => {
    if (!result) return;
    const lines = ['Baris;Kode;Nama;Status;Keterangan'];
    result.rows
      .filter((r) => r.status === 'error' || r.warnings.length > 0)
      .forEach((r) =>
        lines.push(
          [String(r.line), r.code, r.name, STATUS_STYLE[r.status].label, [...r.errors, ...r.warnings].join(' | ')]
            .map(csvCell)
            .join(';')
        )
      );
    downloadTextFile('masalah-upload-produk.csv', `\uFEFFsep=;\r\n${lines.join('\r\n')}\r\n`);
  };

  const handleImport = () => {
    if (!result || importable === 0) return;
    const items = result.rows.filter((r) => r.product).map((r) => r.product!);
    importProducts(items);
    onClose();
  };

  const problemCount = result ? result.rows.filter((r) => r.status === 'error' || r.warnings.length > 0).length : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Upload Massal Katalog Produk</h3>
            <p className="text-[11px] text-slate-500">Tambah atau perbarui banyak material sekaligus dari file CSV.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* Step 1 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="font-bold text-slate-800">1. Siapkan file</div>
            <p className="text-slate-600">
              Unduh template, isi di Excel, lalu simpan sebagai <b>CSV</b> (File &gt; Save As &gt; <i>CSV UTF-8</i>). Kategori, Merek, Satuan, dan
              Gudang harus sudah ada di Master Data. Baris contoh (diawali <b>CONTOH</b>) otomatis diabaikan.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-blue-600" /> Unduh Template
              </button>
              <button onClick={() => setShowColumns((v) => !v)} className="px-2 py-2 text-blue-600 font-bold hover:underline">
                {showColumns ? 'Sembunyikan' : 'Lihat'} penjelasan kolom
              </button>
            </div>
            {showColumns && (
              <table className="w-full text-left border-collapse mt-1">
                <tbody>
                  {PRODUCT_IMPORT_COLUMNS.map((c) => (
                    <tr key={c.key} className="border-t border-slate-200 align-top">
                      <td className="py-1.5 pr-3 font-bold text-slate-800 whitespace-nowrap">
                        {c.label} {c.required && <span className="text-rose-600">*</span>}
                      </td>
                      <td className="py-1.5 text-slate-600">{c.hint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="font-bold text-slate-800">2. Pilih file &amp; aturan</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.txt,text/csv"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInput.current?.click()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Pilih File CSV
              </button>
              {fileName && (
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {fileName}
                </span>
              )}
              {reading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1">Jika Kode Produk sudah ada di katalog:</div>
              <label className="flex items-start gap-2 mb-1 cursor-pointer">
                <input type="radio" name="import-mode" checked={mode === 'skip'} onChange={() => setMode('skip')} className="mt-0.5" />
                <span>
                  <b>Lewati</b> <span className="text-slate-500">(aman: hanya menambah produk baru)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="radio" name="import-mode" checked={mode === 'update'} onChange={() => setMode('update')} className="mt-0.5" />
                <span>
                  <b>Perbarui</b>{' '}
                  <span className="text-slate-500">
                    (nama, kategori, merek, harga, stok minimum, berat, status diperbarui; kolom kosong tidak mengubah data; <b>stok tidak diubah</b>)
                  </span>
                </span>
              </label>
            </div>

            {readError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {readError}
              </div>
            )}
            {result?.fatal && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {result.fatal}
              </div>
            )}
            {result && !result.fatal && result.ignoredColumns.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-700">
                Kolom tidak dikenal diabaikan: {result.ignoredColumns.join(', ')}
              </div>
            )}
          </div>

          {/* Step 3 */}
          {result && !result.fatal && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="font-bold text-slate-800">3. Periksa hasil</div>
              <div className="flex flex-wrap gap-2 font-bold">
                {(['new', 'update', 'skip', 'error'] as ImportRowStatus[]).map((s) => (
                  <span key={s} className={`px-2.5 py-1 rounded-full border ${STATUS_STYLE[s].className}`}>
                    {STATUS_STYLE[s].label}: {result.counts[s]}
                  </span>
                ))}
                {result.counts.example > 0 && (
                  <span className={`px-2.5 py-1 rounded-full border ${STATUS_STYLE.example.className}`}>
                    Contoh diabaikan: {result.counts.example}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                  <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                  Hanya tampilkan yang bermasalah ({problemCount})
                </label>
                {problemCount > 0 && (
                  <button onClick={handleDownloadProblems} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Unduh daftar masalah
                  </button>
                )}
              </div>

              <div className="overflow-auto max-h-72 border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Baris</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Kode</th>
                      <th className="p-2">Nama Produk</th>
                      <th className="p-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleRows.slice(0, MAX_ROWS_SHOWN).map((r) => (
                      <tr key={r.line} className={r.status === 'error' ? 'bg-rose-50/40' : ''}>
                        <td className="p-2 font-mono text-slate-500">{r.line}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full border font-bold ${STATUS_STYLE[r.status].className}`}>
                            {STATUS_STYLE[r.status].label}
                          </span>
                        </td>
                        <td className="p-2 font-mono font-bold text-blue-700">{r.product?.code ?? r.code}</td>
                        <td className="p-2 font-semibold text-slate-800">{r.name}</td>
                        <td className="p-2">
                          {r.errors.map((m, i) => (
                            <div key={`e${i}`} className="text-rose-700">{m}</div>
                          ))}
                          {r.warnings.map((m, i) => (
                            <div key={`w${i}`} className="text-amber-700">{m}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                    {visibleRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">Tidak ada baris untuk ditampilkan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {visibleRows.length > MAX_ROWS_SHOWN && (
                <p className="text-slate-500">
                  Menampilkan {MAX_ROWS_SHOWN} dari {visibleRows.length} baris. Semua baris tetap diproses saat impor.
                </p>
              )}
              {result.counts.error > 0 && (
                <p className="text-slate-600">
                  Baris <b>Error</b> tidak akan diimpor. Perbaiki di file, lalu upload ulang dengan aturan <b>Lewati</b>: produk yang sudah masuk
                  tidak akan dobel.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div className="text-xs text-slate-500">
            {result && !result.fatal && importable > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" /> {importable} produk siap diimpor
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs">
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={!result || !!result.fatal || importable === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
            >
              {importable > 0 ? `Impor ${importable} Produk` : 'Impor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
