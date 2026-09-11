import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/views/DashboardView';
import { SalesView } from './components/views/SalesView';
import { PurchaseView } from './components/views/PurchaseView';
import { InventoryView } from './components/views/InventoryView';
import { FinanceView } from './components/views/FinanceView';
import { MasterDataView } from './components/views/MasterDataView';
import { DocumentsView } from './components/views/DocumentsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { DiscountCalculatorModal } from './components/common/DiscountCalculatorModal';
import { DocumentPreviewModal } from './components/common/DocumentPreviewModal';
import { CommandMenu } from './components/common/CommandMenu';
import { NewOrderModal } from './components/common/NewOrderModal';
import { GlobalToast } from './components/common/GlobalToast';
import { Database, ShieldCheck, Clock, Server } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, isCloudConnected, isLoadingData } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    if (currentView === 'dashboard') return <DashboardView />;
    if (currentView.startsWith('sales')) return <SalesView />;
    if (currentView.startsWith('purchase')) return <PurchaseView />;
    if (currentView.startsWith('inventory')) return <InventoryView />;
    if (currentView.startsWith('finance')) return <FinanceView />;
    if (currentView.startsWith('master')) return <MasterDataView />;
    if (currentView.startsWith('reports')) return <ReportsView />;
    if (currentView === 'documents') return <DocumentsView />;
    if (currentView === 'settings') return <SettingsView />;
    return <DashboardView />;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      <div className="flex flex-1 min-h-screen relative">
        {/* Left Dark Sidebar Navigation */}
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Main Content Area - dynamically adjusts padding when sidebar collapses/expands */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:pl-16' : 'lg:pl-60'
          }`}
        >
          {/* Sticky Top Header */}
          <TopBar
            setIsMobileOpen={setIsMobileOpen}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
            {renderContent()}
          </main>

          {/* Quick Notify / Status Bar (Clean Minimalism Theme) */}
          <footer className="bg-white border-t border-slate-200 py-2 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
            <div className="flex items-center gap-4">
              {isCloudConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isLoadingData ? 'Menyinkronkan…' : 'Supabase Connected'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Mode Lokal (Supabase belum dikonfigurasi)
                </span>
              )}
              <span className="hidden md:inline-block text-slate-300">|</span>
              <span className="hidden md:flex items-center gap-1 text-slate-600">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Cloud Sync: <strong className="text-slate-800">{isCloudConnected ? 'Live' : '—'}</strong>
              </span>
              <span className="hidden lg:inline-block text-slate-300">|</span>
              <span className="hidden lg:inline text-slate-500">
                Gudang Utama: Jakarta Daan Mogot (GDG-01)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-semibold">
                User: <strong className="text-slate-800 font-bold">Admin ERP</strong> (IP: 192.168.1.104)
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700">DistribuERP v2.4 PRO</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Drawers & Modals */}
      <DiscountCalculatorModal />
      <DocumentPreviewModal />
      <CommandMenu />
      <NewOrderModal />
      <GlobalToast />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </LanguageProvider>
  );
}
