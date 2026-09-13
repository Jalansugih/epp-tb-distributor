import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { ViewMode } from '../../types';
import { APP_NAME } from '../../lib/appInfo';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  FileText,
  CreditCard,
  Building2,
  PackageCheck,
  Package,
  Layers,
  ArrowLeftRight,
  SlidersHorizontal,
  Warehouse,
  Wallet,
  Receipt,
  BookOpen,
  PieChart,
  BarChart3,
  Users,
  Building,
  CalendarDays,
  UserCheck,
  FolderKanban,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  DollarSign,
  Boxes,
  Briefcase,
  LogOut,
  Sparkles,
  Landmark
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const { currentView, setCurrentView, openDiscountModal } = useApp();
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';
  const { t } = useLanguage();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    sales: false,
    purchase: false,
    inventory: false,
    finance: false,
    master: false,
    reports: false,
  });

  // Auto-expand active group when route changes
  React.useEffect(() => {
    if (currentView.startsWith('sales')) {
      setExpandedGroups((prev) => ({ ...prev, sales: true }));
    } else if (currentView.startsWith('purchase')) {
      setExpandedGroups((prev) => ({ ...prev, purchase: true }));
    } else if (currentView.startsWith('inventory')) {
      setExpandedGroups((prev) => ({ ...prev, inventory: true }));
    } else if (currentView.startsWith('finance')) {
      setExpandedGroups((prev) => ({ ...prev, finance: true }));
    } else if (currentView.startsWith('master')) {
      setExpandedGroups((prev) => ({ ...prev, master: true }));
    } else if (currentView.startsWith('reports')) {
      setExpandedGroups((prev) => ({ ...prev, reports: true }));
    }
  }, [currentView]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const navItem = (
    viewKey: ViewMode,
    labelKey: string,
    icon: React.ReactNode,
    badge?: string | number
  ) => {
    const isActive = currentView === viewKey;
    const labelText = labelKey.startsWith('nav.') ? t(labelKey) : labelKey;
    return (
      <button
        key={viewKey}
        onClick={() => {
          setCurrentView(viewKey);
          setIsMobileOpen(false);
        }}
        title={isCollapsed ? labelText : undefined}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-blue-600 text-white font-bold shadow-sm'
            : 'text-white/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span
          className={`${
            isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
          } flex shrink-0 items-center justify-center transition-colors`}
        >
          {icon}
        </span>
        {!isCollapsed && <span className="flex-1 text-left truncate">{labelText}</span>}
        {!isCollapsed && badge !== undefined && (
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono font-bold ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/80 border border-white/10'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const groupHeader = (
    groupKey: string,
    title: string,
    icon: React.ReactNode,
    itemCount?: number
  ) => {
    const isOpen = expandedGroups[groupKey];
    if (isCollapsed) {
      return (
        <div
          title={title}
          className="pt-3 pb-1 text-center font-mono font-bold text-[10px] text-white/45 uppercase tracking-widest border-t border-white/10 my-1"
        >
          {groupKey.slice(0, 3)}
        </div>
      );
    }
    return (
      <button
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between pt-3 pb-1.5 px-2 text-[11px] font-bold tracking-wider text-white/55 uppercase hover:text-white transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/60 group-hover:text-white transition-colors">{icon}</span>
          <span>{title}</span>
          {itemCount && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70 font-mono font-semibold">
              {itemCount}
            </span>
          )}
        </div>
        <span className="p-0.5 rounded group-hover:bg-slate-100 transition-colors">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#000E33] border-r border-[#000E33] flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header Branding */}
        <div className="h-16 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-[#000E33]">
  <div className="flex items-center gap-3 overflow-hidden">
    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1.10 ring-1 ring-white/20 shadow-lg shadow-black/20 shrink-0">
  <img
    src="/logo-rk-bendahara.png"
    alt="Distributor ERP"
    className="w-full h-full object-contain"
  />
    </div>

    {!isCollapsed && (
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm tracking-tight text-white leading-tight truncate">
            Rajakas.<span className="text-blue-300">ID</span>
          </span>

          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-blue-200 border border-white/10 uppercase shrink-0">
            ERP
          </span>
        </div>

        <span className="text-[10px] text-white/55 font-medium truncate">
          Building Materials System
        </span>
      </div>
    )}

          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {/* Main Dashboard */}
          {navItem('dashboard', 'nav.dashboard', <LayoutDashboard className="w-4 h-4" />)}

          {/* SALES MODULE */}
          {groupHeader('sales', 'SALES', <ShoppingBag className="w-3.5 h-3.5" />, 6)}
          {(expandedGroups.sales || isCollapsed) && (
            <div className={`space-y-0.5 ${!isCollapsed ? 'ml-3 pl-2.5 border-l border-slate-200/70' : ''}`}>
              {navItem('sales-orders', 'Sales Orders', <ShoppingBag className="w-4 h-4" />, 3)}
              {navItem('sales-quotations', 'Quotations (Penawaran)', <FileText className="w-4 h-4" />)}
              {navItem('sales-deliveries', 'Surat Jalan / Deliveries', <Truck className="w-4 h-4" />)}
              {navItem('sales-invoices', 'Invoices Penjualan', <Receipt className="w-4 h-4" />)}
              {navItem('sales-receivables', 'Piutang Dagang (AR)', <Wallet className="w-4 h-4" />)}
              {navItem('sales-payments', 'Pembayaran Piutang', <CreditCard className="w-4 h-4" />)}
            </div>
          )}

          {/* PURCHASE MODULE */}
          {groupHeader('purchase', 'PURCHASE', <Building2 className="w-3.5 h-3.5" />, 5)}
          {(expandedGroups.purchase || isCollapsed) && (
            <div className={`space-y-0.5 ${!isCollapsed ? 'ml-3 pl-2.5 border-l border-slate-200/70' : ''}`}>
              {navItem('purchase-orders', 'Purchase Orders (PO)', <Building2 className="w-4 h-4" />, 2)}
              {navItem('purchase-receipts', 'Penerimaan Barang (GR)', <PackageCheck className="w-4 h-4" />)}
              {navItem('purchase-invoices', 'Faktur Pembelian', <Receipt className="w-4 h-4" />)}
              {navItem('purchase-payables', 'Hutang Dagang (AP)', <Wallet className="w-4 h-4" />)}
              {navItem('purchase-payments', 'Pembayaran Hutang', <CreditCard className="w-4 h-4" />)}
            </div>
          )}

          {/* INVENTORY MODULE */}
          {groupHeader('inventory', 'INVENTORY', <Boxes className="w-3.5 h-3.5" />, 5)}
          {(expandedGroups.inventory || isCollapsed) && (
            <div className={`space-y-0.5 ${!isCollapsed ? 'ml-3 pl-2.5 border-l border-slate-200/70' : ''}`}>
              {navItem('inventory-stock', 'Stock Fisik Warehouse', <Package className="w-4 h-4" />)}
              {navItem('inventory-movement', 'Kartu Stok & Mutasi', <Layers className="w-4 h-4" />)}
              {navItem('inventory-transfer', 'Transfer Antar Gudang', <ArrowLeftRight className="w-4 h-4" />)}
              {navItem('inventory-adjustment', 'Stock Opname (Adjustment)', <SlidersHorizontal className="w-4 h-4" />)}
              {navItem('inventory-warehouses', 'Lokasi Gudang', <Warehouse className="w-4 h-4" />)}
            </div>
          )}

          {/* FINANCE MODULE — Admin only */}
          {isAdmin && groupHeader('finance', 'FINANCE', <Wallet className="w-3.5 h-3.5" />, 5)}
          {isAdmin && (expandedGroups.finance || isCollapsed) && (
            <div className={`space-y-0.5 ${!isCollapsed ? 'ml-3 pl-2.5 border-l border-slate-200/70' : ''}`}>
              {navItem('finance-cashbank', 'Kas & Rekening Bank', <Wallet className="w-4 h-4" />)}
              {navItem('sales-receivables', 'Receivables Tracker', <Receipt className="w-4 h-4" />)}
              {navItem('purchase-payables', 'Payables Tracker', <Receipt className="w-4 h-4" />)}
              {navItem('finance-journal', 'Jurnal Umum Transaksi', <BookOpen className="w-4 h-4" />)}
              {navItem('finance-pnl', 'Laporan Laba Rugi', <BarChart3 className="w-4 h-4" />)}
            </div>
          )}

          {/* MASTER DATA MODULE */}
          {groupHeader('master', 'MASTER DATA', <Briefcase className="w-3.5 h-3.5" />, 8)}
          {(expandedGroups.master || isCollapsed) && (
            <div className={`space-y-0.5 ${!isCollapsed ? 'ml-3 pl-2.5 border-l border-slate-200/70' : ''}`}>
              {navItem('master-customers', 'Pelanggan Toko', <Users className="w-4 h-4" />)}
              {navItem('master-suppliers', 'Pemasok / Prinsipal', <Building className="w-4 h-4" />)}
              {navItem('master-products', 'Katalog Produk', <Package className="w-4 h-4" />)}
              {navItem('master-pricelists', 'Master Data Harga', <DollarSign className="w-4 h-4" />)}
              {navItem('master-discountrules', 'Aturan Diskon', <Percent className="w-4 h-4" />)}
              {navItem('master-paymentterms', 'Syarat Pembayaran', <CalendarDays className="w-4 h-4" />)}
              {navItem('master-salespersons', 'Eksekutif Penjualan', <UserCheck className="w-4 h-4" />)}
              {navItem('master-warehouses', 'Gudang', <Warehouse className="w-4 h-4" />)}
            </div>
          )}

         {/* LAPORAN OPERASIONAL */}
          {navItem(
           'reports-sales',
   'Laporan Operasional',
  <BarChart3 className="w-4 h-4" />
)}

          {/* DOCUMENTS */}
          <div className="pt-2">
            {navItem('documents', 'Pusat Arsip Dokumen', <FolderKanban className="w-4 h-4" />)}
          </div>

          {/* SETTINGS */}
          {isAdmin && navItem('settings', 'Pengaturan Sistem', <Settings className="w-4 h-4" />)}
        </div>

        {/* Footer Status */}
        <div className="p-3 border-t border-white/10 bg-black/10 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
            <span className="relative flex shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
            </span>
            {!isCollapsed && (
              <span className="text-[10px] font-semibold text-white/70">Sistem Online</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
