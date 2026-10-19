import React, { useState } from 'react';
import { Modal } from './Modal';

type Props = {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  /** 'danger' = merah (tangguhkan/nonaktifkan), 'success' = hijau (aktifkan kembali). */
  tone?: 'danger' | 'success';
  /** Tampilkan kolom alasan (opsional diisi). */
  askReason?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

/** Pengganti window.confirm/prompt: tetap tampil di PWA / iframe yang memblokir dialog bawaan browser. */
export const ConfirmDialog: React.FC<Props> = ({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  askReason = false,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');
  return (
    <Modal title={title} busy={busy} narrow onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onConfirm(reason);
        }}
        className="space-y-4"
      >
        <div className="text-xs text-slate-700">{message}</div>
        {askReason && (
          <label className="block text-xs font-bold text-slate-700">
            Alasan (opsional)
            <input
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-medium bg-white"
            />
          </label>
        )}
        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-60 ${
              tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {busy ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};
