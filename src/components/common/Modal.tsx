import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  /** Selama sibuk (menyimpan), dialog tidak bisa ditutup. */
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** Dialog sederhana: Esc / klik latar / tombol X menutup, fokus awal di dalam dialog. */
export const Modal: React.FC<Props> = ({ title, subtitle, busy = false, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-white rounded-2xl shadow-xl outline-none p-5 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="modal-title" className="text-base font-black text-slate-900">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Tutup" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
