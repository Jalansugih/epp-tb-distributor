import React from 'react';

interface Props { children: React.ReactNode; name?: string; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan pada modul.'
    };
  }

  componentDidCatch(error: unknown) {
    console.error(`[${this.props.name || 'App'}] runtime error`, error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm">
        <div className="text-rose-700 font-black text-base">Modul tidak dapat ditampilkan</div>
        <p className="text-sm text-slate-600 mt-2">
          Data belum lengkap atau terjadi kesalahan saat memuat modul. Silakan refresh dan periksa Master Data.
        </p>
        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-bold">Detail teknis</summary>
          <pre className="mt-2 whitespace-pre-wrap">{this.state.message}</pre>
        </details>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Coba lagi
        </button>
      </div>
    );
  }
}
