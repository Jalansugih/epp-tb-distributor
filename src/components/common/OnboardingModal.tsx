import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Sparkles,
  Building2,
  Layers,
  Users,
  ShoppingBag,
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ViewMode } from '../../types';
import { APP_NAME } from '../../lib/appInfo';

const STORAGE_PREFIX = 'rajakas_onboarding_done_v1';

/** Custom event any component can dispatch to re-open the tour manually. */
export const OPEN_ONBOARDING_EVENT = 'rajakas:open-onboarding';

interface OnboardingStep {
  key: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaView?: ViewMode;
  note?: string;
}

export const OnboardingModal: React.FC = () => {
  const { setCurrentView } = useApp();
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';
  const storageKey = `${STORAGE_PREFIX}_${profile?.id ?? 'anon'}`;

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-open once per account on first load, unless already completed/skipped.
  useEffect(() => {
    if (!profile) return;
    try {
      const done = window.localStorage.getItem(storageKey);
      if (!done) {
        setIsOpen(true);
        setStepIndex(0);
      }
    } catch {
      // localStorage unavailable — fail silently, just don't auto-show.
    }
  }, [profile, storageKey]);

  // Allow re-opening the tour manually (e.g. from a "Mulai Panduan" button in the sidebar).
  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_ONBOARDING_EVENT, handler);
    return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, handler);
  }, []);

  const steps: OnboardingStep[] = useMemo(() => {
    const list: OnboardingStep[] = [
      {
        key: 'welcome',
        icon: <Sparkles className="w-6 h-6" />,
        eyebrow: 'Selamat Datang',
        title: `Yuk mulai pakai ${APP_NAME}`,
        description:
          'Aplikasi ini masih kosong sampai Anda mengisi data perusahaan Anda sendiri. Ikuti langkah-langkah singkat berikut ini urut dari atas ke bawah — isi ini dulu, baru ini, supaya form-form berikutnya tidak error karena datanya belum ada.',
      },
    ];

    if (isAdmin) {
      list.push({
        key: 'company-settings',
        icon: <Building2 className="w-6 h-6" />,
        eyebrow: 'Langkah 1',
        title: 'Isi Pengaturan Perusahaan',
        description:
          'Buka menu Settings dan isi nama perusahaan, alamat, NPWP, serta tarif pajak. Data ini otomatis muncul di kop semua dokumen cetak seperti PO, Invoice, dan Surat Jalan.',
        ctaLabel: 'Buka Pengaturan',
        ctaView: 'settings',
      });
    }

    list.push(
      {
        key: 'master-basic',
        icon: <Layers className="w-6 h-6" />,
        eyebrow: `Langkah ${isAdmin ? 2 : 1}`,
        title: 'Isi Data Master Dasar',
        description:
          'Ini acuan pilihan untuk semua form transaksi nantinya, jadi isi dulu sebelum lanjut ke langkah berikutnya:',
        bullets: [
          'Satuan (UOM) — Pcs, Box, Sak, Karung, dst',
          'Kategori Produk & Brand',
          'Gudang — minimal 1 lokasi',
          'Termin Pembayaran — mis. COD, Net 30',
          'Salesperson / tim sales Anda',
        ],
        ctaLabel: 'Buka Master Data',
        ctaView: 'master-uom',
      },
      {
        key: 'master-detail',
        icon: <Users className="w-6 h-6" />,
        eyebrow: `Langkah ${isAdmin ? 3 : 2}`,
        title: 'Isi Produk, Pelanggan & Supplier',
        description:
          'Setelah data dasar siap, lengkapi tiga master ini — form Sales Order dan PO akan mengambil pilihannya dari sini:',
        bullets: [
          'Produk — kode, kategori, brand, satuan, harga, stok awal',
          'Pelanggan — kode, toko, grup, kota, termin, limit kredit',
          'Supplier — kode, nama, kota, kontak, termin pembayaran',
        ],
        ctaLabel: 'Buka Master Produk',
        ctaView: 'master-products',
      },
      {
        key: 'transactions',
        icon: <ShoppingBag className="w-6 h-6" />,
        eyebrow: `Langkah ${isAdmin ? 4 : 3}`,
        title: 'Baru Mulai Transaksi',
        description:
          'Kalau data master sudah lengkap, alur transaksi normalnya begini:',
        bullets: [
          'Penjualan: Quotation → Sales Order → Surat Jalan → Invoice → Pembayaran',
          'Pembelian: Purchase Request → PO → Penerimaan Barang → Faktur → Pembayaran',
        ],
        ctaLabel: 'Buka Sales Order',
        ctaView: 'sales-orders',
      },
      {
        key: 'finish',
        icon: <PartyPopper className="w-6 h-6" />,
        eyebrow: 'Selesai',
        title: 'Siap jalan!',
        description:
          'Dashboard, grafik penjualan, dan laporan keuangan akan otomatis terisi seiring transaksi yang Anda buat. Kalau butuh diulas lagi, panduan lengkap selalu ada lewat tombol "Panduan" di sidebar.',
        note: !isAdmin
          ? 'Menu Settings dan Finance hanya muncul untuk akun dengan role Admin. Hubungi admin Anda kalau butuh akses.'
          : undefined,
      }
    );

    return list;
  }, [isAdmin]);

  const total = steps.length;
  const current = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  const markDone = () => {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    // Closing via the X does not mark the tour as done — it will show again next time.
    setIsOpen(false);
  };

  const handleSkip = () => {
    markDone();
    setIsOpen(false);
  };

  const handleFinish = () => {
    markDone();
    setIsOpen(false);
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStepIndex((i) => Math.min(i + 1, total - 1));
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleCta = () => {
    if (current.ctaView) {
      setCurrentView(current.ctaView);
    }
    markDone();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-[#0F2747] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4.5 h-4.5 text-blue-300" />
            <div className="flex flex-col leading-tight">
              <h2 className="text-sm font-bold tracking-tight">Panduan Mulai Pakai</h2>
              <span className="text-[10px] text-white/55 font-medium">
                Langkah {stepIndex + 1} dari {total}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-5 pt-4">
          {steps.map((s, idx) => (
            <div
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                idx === stepIndex
                  ? 'bg-blue-600 w-6'
                  : idx < stepIndex
                  ? 'bg-blue-300 w-3'
                  : 'bg-slate-200 w-3'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="p-5 pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {current.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {current.eyebrow}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{current.description}</p>

          {current.bullets && (
            <ul className="space-y-1.5 pl-1">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {current.note && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {current.note}
            </div>
          )}

          {current.ctaView && (
            <button
              onClick={handleCta}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              {current.ctaLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={isFirst ? handleSkip : handleBack}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            {isFirst ? (
              'Lewati tur'
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                Kembali
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {isLast ? (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                Selesai
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
