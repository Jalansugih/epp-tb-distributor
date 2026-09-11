import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import { InventoryOverviewTab } from '../inventory/InventoryOverviewTab';
import { StockListTab } from '../inventory/StockListTab';
import { StockMovementTab } from '../inventory/StockMovementTab';
import { StockTransferTab } from '../inventory/StockTransferTab';
import { StockAdjustmentTab } from '../inventory/StockAdjustmentTab';
import { WarehouseTab } from '../inventory/WarehouseTab';
import { BatchSerialTab } from '../inventory/BatchSerialTab';
import { InventoryReportsTab } from '../inventory/InventoryReportsTab';
import {
  PieChart,
  Package,
  Layers,
  ArrowLeftRight,
  SlidersHorizontal,
  Warehouse,
  Barcode,
  BarChart3,
  Plus
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  // Modals state
  const [isOpenAdjustmentModal, setIsOpenAdjustmentModal] = useState(false);
  const [presetProductCode, setPresetProductCode] = useState<string | undefined>(undefined);
  const [isOpenTransferModal, setIsOpenTransferModal] = useState(false);

  const handleOpenAdjustmentModal = (productCode?: string) => {
    setPresetProductCode(productCode);
    setIsOpenAdjustmentModal(true);
  };

  const handleOpenTransferModal = () => {
    setIsOpenTransferModal(true);
  };

  // Determine active tab based on currentView
  const getActiveTab = () => {
    if (currentView === 'inventory-overview') return 'overview';
    if (currentView === 'inventory-stock') return 'stock';
    if (currentView === 'inventory-movement') return 'movement';
    if (currentView === 'inventory-transfer') return 'transfer';
    if (currentView === 'inventory-adjustment') return 'adjustment';
    if (currentView === 'inventory-warehouses') return 'warehouses';
    if (currentView === 'inventory-batch') return 'batch';
    if (currentView === 'inventory-reports') return 'reports';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'overview':
        setCurrentView('inventory-overview');
        break;
      case 'stock':
        setCurrentView('inventory-stock');
        break;
      case 'movement':
        setCurrentView('inventory-movement');
        break;
      case 'transfer':
        setCurrentView('inventory-transfer');
        break;
      case 'adjustment':
        setCurrentView('inventory-adjustment');
        break;
      case 'warehouses':
        setCurrentView('inventory-warehouses');
        break;
      case 'batch':
        setCurrentView('inventory-batch');
        break;
      case 'reports':
        setCurrentView('inventory-reports');
        break;
      default:
        setCurrentView('inventory-overview');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Sub-navigation Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Modul Manajemen Persediaan & Stok (Inventory)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola stok fisik, kartu mutasi, transfer antar gudang, opname, master gudang, & batch tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdjustmentModal()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>+ Stock Opname</span>
            </button>
            <button
              onClick={handleOpenTransferModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>+ Transfer Gudang</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleTabChange('stock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'stock'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stok Fisik</span>
          </button>

          <button
            onClick={() => handleTabChange('movement')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'movement'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kartu Stok / Mutasi</span>
          </button>

          <button
            onClick={() => handleTabChange('transfer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'transfer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Gudang</span>
          </button>

          <button
            onClick={() => handleTabChange('adjustment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'adjustment'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Stock Opname</span>
          </button>

          <button
            onClick={() => handleTabChange('warehouses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'warehouses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Master Gudang</span>
          </button>

          <button
            onClick={() => handleTabChange('batch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'batch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Batch & Serial</span>
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan Stok</span>
          </button>
        </div>
      </div>

      {/* Render Active View Tab */}
      {activeTab === 'overview' && (
        <InventoryOverviewTab
          onNavigateTab={handleTabChange}
          onOpenAdjustmentModal={handleOpenAdjustmentModal}
          onOpenTransferModal={handleOpenTransferModal}
        />
      )}

      {activeTab === 'stock' && (
        <StockListTab onOpenAdjustmentModal={handleOpenAdjustmentModal} />
      )}

      {activeTab === 'movement' && <StockMovementTab />}

      {activeTab === 'transfer' && (
        <StockTransferTab
          isOpenCreateModal={isOpenTransferModal}
          onCloseCreateModal={() => setIsOpenTransferModal(false)}
          onOpenCreateModal={handleOpenTransferModal}
        />
      )}

      {activeTab === 'adjustment' && (
        <StockAdjustmentTab
          isOpenCreateModal={isOpenAdjustmentModal}
          onCloseCreateModal={() => setIsOpenAdjustmentModal(false)}
          onOpenCreateModal={handleOpenAdjustmentModal}
          presetProductCode={presetProductCode}
        />
      )}

      {activeTab === 'warehouses' && <WarehouseTab />}

      {activeTab === 'batch' && <BatchSerialTab />}

      {activeTab === 'reports' && <InventoryReportsTab />}
    </div>
  );
};
