import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Bell,
  Globe,
  Plus,
  Menu,
  ChevronRight,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Calculator,
  Percent
} from 'lucide-react';

interface TopBarProps {
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TopBar: React.FC<TopBarProps> = ({
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const {
    currentView,
    notifications,
    setCommandMenuOpen,
    setNewOrderModalOpen,
    openDiscountModal,
    markNotificationRead
  } = useApp();
  const { language, setLanguage, t } = useLanguage();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Format current date e.g. "12 August 2026"
  const formattedDate = '12 August 2026';

  // Get Breadcrumb string based on currentView
  const getBreadcrumb = () => {
    const parts = currentView.split('-');
    if (parts.length === 1) {
      return { parent: 'ERP System', current: t(`nav.${currentView}`, currentView) };
    }
    const parentKey = `nav.${parts[0]}`;
    const currentKey = `nav.${currentView}`;
    return { parent: t(parentKey, parts[0].toUpperCase()), current: t(currentKey, currentView) };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shadow-2xs">
      {/* Left Area: Mobile Menu Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>BuildDistro ERP</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">{breadcrumb.parent}</span>
          </div>

          {/* Page Title */}
          <h1 className="text-base font-bold text-slate-900 tracking-tight capitalize">
            {breadcrumb.current}
          </h1>
        </div>
      </div>

      {/* Right Area: Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-500 transition-all shadow-2xs group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          <span className="w-36 lg:w-48 text-left truncate">{t('app.search')}</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>

        {/* Sequential Discount Simulator Quick Button */}
        <button
          onClick={() => openDiscountModal()}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          title="Simulator Diskon Bertingkat"
        >
          <Percent className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden xl:inline">{t('app.discount_calculator')}</span>
        </button>

        {/* Quick New Order Button */}
        <button
          onClick={() => setNewOrderModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('app.quick_action')}</span>
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Notif Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-800">{t('app.notifications')}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                    {unreadNotifCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-blue-50/50 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'warning' && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'danger' && (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'info' && (
                          <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30">
              AD
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">Admin ERP</span>
              <span className="text-[10px] text-slate-500">Super Administrator</span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="p-3">
                <p className="font-bold text-xs text-slate-900">Admin Distributor</p>
                <p className="text-[10px] text-slate-500">admin@bahambangunan.co.id</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md">
                  Profil Pengguna
                </button>
                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md">
                  Pengaturan Keamanan
                </button>
              </div>
              <div className="pt-1">
                <button className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md font-semibold">
                  Keluar / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
