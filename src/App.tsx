import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
const DashboardView = lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const SalesView = lazy(() => import('./components/views/SalesView').then(m => ({ default: m.SalesView })));
const PurchaseView = lazy(() => import('./components/views/PurchaseView').then(m => ({ default: m.PurchaseView })));
const InventoryView = lazy(() => import('./components/views/InventoryView').then(m => ({ default: m.InventoryView })));
const FinanceView = lazy(() => import('./components/views/FinanceView').then(m => ({ default: m.FinanceView })));
const MasterDataView = lazy(() => import('./components/views/MasterDataView').then(m => ({ default: m.MasterDataView })));
const DocumentsView = lazy(() => import('./components/views/DocumentsView').then(m => ({ default: m.DocumentsView })));
const ReportsView = lazy(() => import('./components/views/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
import { DiscountCalculatorModal } from './components/common/DiscountCalculatorModal';
import { DocumentPreviewModal } from './components/common/DocumentPreviewModal';
import { CommandMenu } from './components/common/CommandMenu';
import { NewOrderModal } from './components/common/NewOrderModal';
import { GlobalToast } from './components/common/GlobalToast';
import { OnboardingModal } from './components/common/OnboardingModal';
import { APP_NAME, APP_VERSION } from './lib/appInfo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Server, Warehouse as WarehouseIcon } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, setCurrentView, isCloudConnected, isLoadingData, warehouses } = useApp();
  const { user, profile } = useAuth();

  // MainLayout only ever renders once the user is authenticated (see
  // AuthGate below), which itself requires Supabase to be configured —
  // so isCloudConnected is always true here. Kept as a variable (rather
  // than assuming `true`) purely as a defensive guard in case that
  // invariant ever changes.
  const mainWarehouse =
    warehouses.find((w) => w.type === 'Gudang Utama' && w.status === 'active') ??
    warehouses.find((w) => w.status === 'active') ??
    null;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdmin && (currentView.startsWith('finance') || currentView === 'settings')) {
      setCurrentView('dashboard');
    }
  }, [currentView, isAdmin, setCurrentView]);

  const renderContent = () => {
    if (!isAdmin && (currentView.startsWith('finance') || currentView === 'settings')) {
      return <DashboardView />;
    }
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
            <ErrorBoundary name={currentView}><Suspense fallback={<div className="bg-white border rounded-2xl p-8 text-sm text-slate-500">Memuat modul…</div>}>{renderContent()}</Suspense></ErrorBoundary>
          </main>

          {/* Quick Notify / Status Bar (Clean Minimalism Theme) */}
          <footer className="bg-white border-t border-slate-200 py-2 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isLoadingData ? 'Menyinkronkan…' : 'Supabase Connected'}
              </span>
              <span className="hidden md:inline-block text-slate-300">|</span>
              <span className="hidden md:flex items-center gap-1 text-slate-600">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Cloud Sync: <strong className="text-slate-800">{isCloudConnected ? 'Live' : '—'}</strong>
              </span>
              <span className="hidden lg:inline-block text-slate-300">|</span>
              <span className="hidden lg:flex items-center gap-1 text-slate-500">
                <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                {mainWarehouse
                  ? `Gudang Utama: ${mainWarehouse.name}${mainWarehouse.code ? ` (${mainWarehouse.code})` : ''}`
                  : 'Belum ada gudang aktif'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700">{APP_NAME} v{APP_VERSION}</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Drawers & Modals */}
      <DiscountCalculatorModal />
      <DocumentPreviewModal />
      <CommandMenu />
      <ErrorBoundary name="New Sales Order"><NewOrderModal /></ErrorBoundary>
      <GlobalToast />
      <ErrorBoundary name="Onboarding"><OnboardingModal /></ErrorBoundary>
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Memuat sesi…</div>;
  }

  if (!user) return <LoginView />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-md">
          <h1 className="font-black text-slate-900">Profil belum tersedia</h1>
          <p className="text-sm text-slate-500 mt-2">Akun berhasil login, tetapi profil aplikasi belum tersedia. Hubungi administrator.</p>
        </div>
      </div>
    );
  }

  if (!profile.active) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm">
          <h1 className="font-black text-slate-900">Akun dinonaktifkan</h1>
          <p className="text-sm text-slate-500 mt-2">Hubungi administrator untuk mendapatkan akses kembali.</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  );
}
