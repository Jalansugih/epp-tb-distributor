import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { ViewMode } from '../../types';
import {
  Search,
  X,
  LayoutDashboard,
  ShoppingBag,
  Building2,
  Package,
  Wallet,
  Users,
  Settings,
  ArrowRight,
  Percent
} from 'lucide-react';

export const CommandMenu: React.FC = () => {
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setCurrentView,
    products,
    customers,
    salesOrders,
    openDiscountModal
  } = useApp();
  const { t } = useLanguage();

  const [query, setQuery] = useState('');

  // Shortcut key listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandMenuOpen(!isCommandMenuOpen);
      }
      if (e.key === 'Escape' && isCommandMenuOpen) {
        setCommandMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandMenuOpen, setCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredOrders = salesOrders.filter((so) =>
    so.code.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (view: ViewMode) => {
    setCurrentView(view);
    setCommandMenuOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, toko, faktur, atau menu ERP... (ketik sesuatu)"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-hidden"
          />
          <button
            onClick={() => setCommandMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs divide-y divide-slate-100">
          {/* Menu Shortcuts */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Pintasan Navigasi ERP
            </span>
            <div className="space-y-1">
              <button
                onClick={() => navigateTo('dashboard')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  <span>Dashboard Eksekutif</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setCommandMenuOpen(false);
                  openDiscountModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-blue-50/60 hover:bg-blue-100 text-blue-800 font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Simulator Diskon Bertingkat (Sequential Discount)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                onClick={() => navigateTo('sales-orders')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Pesanan Penjualan (Sales Orders)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigateTo('inventory-stock')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Stok Bahan Bangunan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Product Results */}
          {query.trim().length > 0 && (
            <div className="pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                Bahan Bangunan ({filteredProducts.length})
              </span>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigateTo('master-products')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {p.code} | Stok: {p.stock} {p.uom}
                    </span>
                  </div>
                  <span className="font-bold text-blue-600">Rp {p.sellPrice.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Customer Results */}
          {query.trim().length > 0 && (
            <div className="pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                Toko Pelanggan ({filteredCustomers.length})
              </span>
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigateTo('master-customers')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.city} | {c.group}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">{c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-right text-[10px] text-slate-400 font-medium">
          Tekan <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono">Esc</kbd> untuk menutup
        </div>
      </div>
    </div>
  );
};
