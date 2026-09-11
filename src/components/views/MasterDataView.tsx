import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import { CustomerMaster } from '../master/CustomerMaster';
import { SupplierMaster } from '../master/SupplierMaster';
import { ProductMaster } from '../master/ProductMaster';
import {
  CategoryMaster,
  BrandMaster,
  UomMaster,
  DiscountRuleMaster
} from '../master/CategoryBrandUomMasters';
import {
  PriceListMaster,
  PaymentTermMaster,
  SalespersonMaster,
  WarehouseMaster
} from '../master/PriceListTermSalespersonWarehouseMasters';
import {
  Users,
  Building,
  Package,
  Tags,
  Award,
  Ruler,
  DollarSign,
  CalendarDays,
  UserCheck,
  Warehouse as WarehouseIcon,
  Percent
} from 'lucide-react';

export const MasterDataView: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  const getActiveTab = (): string => {
    if (currentView.includes('suppliers')) return 'suppliers';
    if (currentView.includes('products')) return 'products';
    if (currentView.includes('categories')) return 'categories';
    if (currentView.includes('brands')) return 'brands';
    if (currentView.includes('uom')) return 'uom';
    if (currentView.includes('pricelists')) return 'pricelists';
    if (currentView.includes('paymentterms')) return 'paymentterms';
    if (currentView.includes('salespersons')) return 'salespersons';
    if (currentView.includes('warehouses')) return 'warehouses';
    if (currentView.includes('discountrules')) return 'discountrules';
    return 'customers';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    const viewMap: Record<string, ViewMode> = {
      customers: 'master-customers',
      suppliers: 'master-suppliers',
      products: 'master-products',
      categories: 'master-categories',
      brands: 'master-brands',
      uom: 'master-uom',
      pricelists: 'master-pricelists',
      paymentterms: 'master-paymentterms',
      salespersons: 'master-salespersons',
      warehouses: 'master-warehouses',
      discountrules: 'master-discountrules'
    };
    if (viewMap[tab]) {
      setCurrentView(viewMap[tab]);
    }
  };

  const navTabs = [
    { id: 'customers', label: 'Pelanggan / Toko', icon: Users },
    { id: 'suppliers', label: 'Pemasok / Pabrik', icon: Building },
    { id: 'products', label: 'Katalog Materials', icon: Package },
    { id: 'categories', label: 'Kategori', icon: Tags },
    { id: 'brands', label: 'Merek / Principal', icon: Award },
    { id: 'uom', label: 'Satuan (UoM)', icon: Ruler },
    { id: 'pricelists', label: 'Daftar Harga', icon: DollarSign },
    { id: 'paymentterms', label: 'Payment Terms', icon: CalendarDays },
    { id: 'salespersons', label: 'Sales Executive', icon: UserCheck },
    { id: 'warehouses', label: 'Master Gudang', icon: WarehouseIcon },
    { id: 'discountrules', label: 'Aturan Diskon', icon: Percent }
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'customers' && <CustomerMaster />}
        {activeTab === 'suppliers' && <SupplierMaster />}
        {activeTab === 'products' && <ProductMaster />}
        {activeTab === 'categories' && <CategoryMaster />}
        {activeTab === 'brands' && <BrandMaster />}
        {activeTab === 'uom' && <UomMaster />}
        {activeTab === 'pricelists' && <PriceListMaster />}
        {activeTab === 'paymentterms' && <PaymentTermMaster />}
        {activeTab === 'salespersons' && <SalespersonMaster />}
        {activeTab === 'warehouses' && <WarehouseMaster />}
        {activeTab === 'discountrules' && <DiscountRuleMaster />}
      </div>
    </div>
  );
};
