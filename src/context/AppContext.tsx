import { generateDocumentNo, generateId } from '../lib/identifiers';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatRupiah } from '../utils/discountEngine';
import { calculateCogs, calculateDeliveryStock, calculateGoodsReceiptStock } from '../utils/inventoryEngine';
import { useAuth } from './AuthContext';
import { postJournalEntry, cashAccountForPayment } from '../lib/accounting';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchTable, upsertRow, deleteRow, deleteAllRows, persist, type TableName } from '../lib/db';
import {
  ViewMode,
  Customer,
  Supplier,
  Product,
  Category,
  Brand,
  Uom,
  PriceList,
  DiscountRule,
  PaymentTerm,
  Salesperson,
  Warehouse,
  SalesOrder,
  SalesQuotation,
  DeliveryOrder,
  SalesInvoice,
  SalesPayment,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseInvoice,
  SupplierPayment,
  Receivable,
  Payable,
  StockMovement,
  StockTransfer,
  StockAdjustment,
  BatchSerialItem,
  NotificationItem,
  DiscountItem,
  SystemSettings
} from '../types';
import {
  mockCustomers,
  mockSuppliers,
  mockProducts,
  mockCategories,
  mockBrands,
  mockUoms,
  mockPriceLists,
  mockDiscountRules,
  mockPaymentTerms,
  mockSalespersons,
  mockWarehouses,
  mockSalesOrders,
  mockQuotations,
  mockDeliveries,
  mockInvoices,
  mockPayments,
  mockPurchaseRequests,
  mockPurchaseOrders,
  mockGoodsReceipts,
  mockPurchaseInvoices,
  mockSupplierPayments,
  mockReceivables,
  mockPayables,
  mockStockMovements,
  mockStockTransfers,
  mockStockAdjustments,
  mockBatchSerials,
  mockNotifications
} from '../data/mockData';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'info' | 'warning';
}

interface AppContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  isLoadingData: boolean;
  isCloudConnected: boolean;
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
  uoms: Uom[];
  priceLists: PriceList[];
  discountRules: DiscountRule[];
  paymentTerms: PaymentTerm[];
  salespersons: Salesperson[];
  warehouses: Warehouse[];
  salesOrders: SalesOrder[];
  quotations: SalesQuotation[];
  deliveries: DeliveryOrder[];
  invoices: SalesInvoice[];
  payments: SalesPayment[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
  receivables: Receivable[];
  payables: Payable[];
  stockMovements: StockMovement[];
  stockTransfers: StockTransfer[];
  stockAdjustments: StockAdjustment[];
  batchSerials: BatchSerialItem[];
  notifications: NotificationItem[];
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: SystemSettings) => void;
  
  // Modals & Drawers
  isDiscountModalOpen: boolean;
  openDiscountModal: (initialPrice?: number, discounts?: DiscountItem[]) => void;
  closeDiscountModal: () => void;
  discountModalInitialPrice: number;
  discountModalDiscounts: DiscountItem[];

  isDocModalOpen: boolean;
  docModalData: { type: string; title: string; data: any } | null;
  openDocModal: (type: string, title: string, data: any) => void;
  closeDocModal: () => void;

  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;

  isNewOrderModalOpen: boolean;
  setNewOrderModalOpen: (open: boolean) => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'danger' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Master Data CRUD Actions
  addCustomer: (cust: Customer) => void;
  updateCustomer: (cust: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supp: Supplier) => void;
  updateSupplier: (supp: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addProduct: (prod: Product) => void;
  updateProduct: (prod: Product) => void;
  deleteProduct: (id: string) => void;

  addCategory: (cat: Category) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;

  addBrand: (br: Brand) => void;
  updateBrand: (br: Brand) => void;
  deleteBrand: (id: string) => void;

  addUom: (uom: Uom) => void;
  updateUom: (uom: Uom) => void;
  deleteUom: (id: string) => void;

  addPriceList: (pl: PriceList) => void;
  updatePriceList: (pl: PriceList) => void;
  deletePriceList: (id: string) => void;

  addDiscountRule: (rule: DiscountRule) => void;
  updateDiscountRule: (rule: DiscountRule) => void;
  deleteDiscountRule: (id: string) => void;

  addPaymentTerm: (term: PaymentTerm) => void;
  updatePaymentTerm: (term: PaymentTerm) => void;
  deletePaymentTerm: (id: string) => void;

  addSalesperson: (sp: Salesperson) => void;
  updateSalesperson: (sp: Salesperson) => void;
  deleteSalesperson: (id: string) => void;

  addWarehouse: (wh: Warehouse) => void;
  updateWarehouse: (wh: Warehouse) => void;
  deleteWarehouse: (id: string) => void;

  addSalesOrder: (order: SalesOrder) => void;
  updateSalesOrderStatus: (id: string, status: SalesOrder['status']) => void;
  addQuotation: (q: SalesQuotation) => void;
  convertQuotationToSO: (id: string) => void;
  addDeliveryOrder: (doObj: DeliveryOrder) => void;
  updateDeliveryStatus: (id: string, status: DeliveryOrder['status']) => void;
  addSalesInvoice: (inv: SalesInvoice) => void;
  recordSalesPayment: (pay: SalesPayment) => void;

  // Purchase Actions
  addPurchaseRequest: (pr: PurchaseRequest) => void;
  convertPRtoPO: (prId: string) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => void;
  addGoodsReceipt: (gr: GoodsReceipt) => void;
  addPurchaseInvoice: (pinv: PurchaseInvoice) => void;
  recordSupplierPayment: (pay: SupplierPayment) => void;
  
  // Inventory Actions
  addStockMovement: (sm: StockMovement) => void;
  addStockTransfer: (st: StockTransfer) => void;
  updateStockTransferStatus: (id: string, status: StockTransfer['status']) => void;
  addStockAdjustment: (adj: StockAdjustment) => void;
  addBatchSerial: (bs: BatchSerialItem) => void;

  markNotificationRead: (id: string) => void;

  // Admin-only danger zone
  isResettingData: boolean;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';
  const requireAdmin = (action: string) => {
    if (isAdmin) return true;
    addToast(`Akses ditolak: hanya Admin yang dapat ${action}.`, 'danger');
    return false;
  };
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(isSupabaseConfigured);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [uoms, setUoms] = useState<Uom[]>(mockUoms);
  const [priceLists, setPriceLists] = useState<PriceList[]>(mockPriceLists);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(mockDiscountRules);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(mockPaymentTerms);
  const [salespersons, setSalespersons] = useState<Salesperson[]>(mockSalespersons);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(mockSalesOrders);
  const [quotations, setQuotations] = useState<SalesQuotation[]>(mockQuotations);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(mockDeliveries);
  const [invoices, setInvoices] = useState<SalesInvoice[]>(mockInvoices);
  const [payments, setPayments] = useState<SalesPayment[]>(mockPayments);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(mockPurchaseRequests);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(mockGoodsReceipts);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(mockPurchaseInvoices);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(mockSupplierPayments);
  const [receivables, setReceivables] = useState<Receivable[]>(mockReceivables);
  const [payables, setPayables] = useState<Payable[]>(mockPayables);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(mockStockMovements);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(mockStockTransfers);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(mockStockAdjustments);
  const [batchSerials, setBatchSerials] = useState<BatchSerialItem[]>(mockBatchSerials);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: 'company',
    companyName: '',
    address: '',
    npwp: '',
    taxRate: 11,
  });

  // Load the shared company dataset from Supabase after authentication.
  // The bundled mock data remains useful only as an initial UI fallback for
  // local/demo mode; when Supabase is configured, database results are used
  // as the source of truth and an empty table stays empty.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;

    const loadAll = async () => {
      const [
        cCustomers, cSuppliers, cProducts, cCategories, cBrands, cUoms,
        cPriceLists, cDiscountRules, cPaymentTerms, cSalespersons, cWarehouses,
        cSalesOrders, cQuotations, cDeliveries, cInvoices, cPayments,
        cPurchaseRequests, cPurchaseOrders, cGoodsReceipts, cPurchaseInvoices,
        cSupplierPayments, cReceivables, cPayables, cStockMovements,
        cStockTransfers, cStockAdjustments, cBatchSerials, cNotifications, cSystemSettings
      ] = await Promise.all([
        fetchTable<Customer>('customers'),
        fetchTable<Supplier>('suppliers'),
        fetchTable<Product>('products'),
        fetchTable<Category>('categories'),
        fetchTable<Brand>('brands'),
        fetchTable<Uom>('uoms'),
        fetchTable<PriceList>('price_lists'),
        fetchTable<DiscountRule>('discount_rules'),
        fetchTable<PaymentTerm>('payment_terms'),
        fetchTable<Salesperson>('salespersons'),
        fetchTable<Warehouse>('warehouses'),
        fetchTable<SalesOrder>('sales_orders'),
        fetchTable<SalesQuotation>('quotations'),
        fetchTable<DeliveryOrder>('deliveries'),
        fetchTable<SalesInvoice>('invoices'),
        fetchTable<SalesPayment>('payments'),
        fetchTable<PurchaseRequest>('purchase_requests'),
        fetchTable<PurchaseOrder>('purchase_orders'),
        fetchTable<GoodsReceipt>('goods_receipts'),
        fetchTable<PurchaseInvoice>('purchase_invoices'),
        fetchTable<SupplierPayment>('supplier_payments'),
        fetchTable<Receivable>('receivables'),
        fetchTable<Payable>('payables'),
        fetchTable<StockMovement>('stock_movements'),
        fetchTable<StockTransfer>('stock_transfers'),
        fetchTable<StockAdjustment>('stock_adjustments'),
        fetchTable<BatchSerialItem>('batch_serials'),
        fetchTable<NotificationItem>('notifications'),
        fetchTable<SystemSettings>('system_settings')
      ]);

      if (cancelled) return;

      setCustomers(cCustomers);
      setSuppliers(cSuppliers);
      setProducts(cProducts);
      setCategories(cCategories);
      setBrands(cBrands);
      setUoms(cUoms);
      setPriceLists(cPriceLists);
      setDiscountRules(cDiscountRules);
      setPaymentTerms(cPaymentTerms);
      setSalespersons(cSalespersons);
      setWarehouses(cWarehouses);
      setSalesOrders(cSalesOrders);
      setQuotations(cQuotations);
      setDeliveries(cDeliveries);
      setInvoices(cInvoices);
      setPayments(cPayments);
      setPurchaseRequests(cPurchaseRequests);
      setPurchaseOrders(cPurchaseOrders);
      setGoodsReceipts(cGoodsReceipts);
      setPurchaseInvoices(cPurchaseInvoices);
      setSupplierPayments(cSupplierPayments);
      setReceivables(cReceivables);
      setPayables(cPayables);
      setStockMovements(cStockMovements);
      setStockTransfers(cStockTransfers);
      setStockAdjustments(cStockAdjustments);
      setBatchSerials(cBatchSerials);
      setNotifications(cNotifications);
      if (cSystemSettings[0]) setSystemSettings(cSystemSettings[0]);

      setIsLoadingData(false);
    };

    loadAll().catch((err) => {
      console.error('[Supabase] Initial data load failed:', err);
      if (!cancelled) setIsLoadingData(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modals
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountModalInitialPrice, setDiscountModalInitialPrice] = useState(100000);
  const [discountModalDiscounts, setDiscountModalDiscounts] = useState<DiscountItem[]>([
    { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Tier 1' },
    { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Diskon Volume' },
    { id: 'd3', sequence: 3, type: 'percentage', value: 2, label: 'Diskon Cash 14 Hari' },
    { id: 'd4', sequence: 4, type: 'fixed', value: 1000, label: 'Potongan Ongkir' },
    { id: 'd5', sequence: 5, type: 'percentage', value: 3, label: 'Bonus Toko VIP' }
  ]);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalData, setDocModalData] = useState<{ type: string; title: string; data: any } | null>(null);

  const [isCommandMenuOpen, setCommandMenuOpen] = useState(false);
  const [isNewOrderModalOpen, setNewOrderModalOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openDiscountModal = (initialPrice = 100000, discounts?: DiscountItem[]) => {
    setDiscountModalInitialPrice(initialPrice);
    if (discounts && discounts.length > 0) {
      setDiscountModalDiscounts(discounts);
    }
    setIsDiscountModalOpen(true);
  };

  const closeDiscountModal = () => {
    setIsDiscountModalOpen(false);
  };

  const openDocModal = (type: string, title: string, data: any) => {
    setDocModalData({ type, title, data });
    setIsDocModalOpen(true);
  };

  const closeDocModal = () => {
    setIsDocModalOpen(false);
    setDocModalData(null);
  };

  const onSaveError = (msg: string) => addToast(msg, 'danger');

  const postAutoJournal = (input: Parameters<typeof postJournalEntry>[0]) => {
    if (!isSupabaseConfigured) return;
    void postJournalEntry(input).catch((err) => {
      const message = err instanceof Error ? err.message : 'Jurnal otomatis gagal dibuat.';
      addToast(`Transaksi tersimpan, tetapi jurnal otomatis gagal: ${message}`, 'danger');
    });
  };

  const updateSystemSettings = (settings: SystemSettings) => {
    const normalized: SystemSettings = {
      ...settings,
      id: 'company',
      taxRate: Math.max(0, Number(settings.taxRate) || 0),
      updatedAt: new Date().toISOString(),
    };
    setSystemSettings(normalized);
    if (!isSupabaseConfigured) {
      addToast('Pengaturan ERP berhasil disimpan (mode lokal, tanpa Supabase).', 'success');
      return;
    }
    // Only confirm success once Supabase actually accepts the write — showing
    // a success toast before the network call resolves is what previously
    // produced a confusing "berhasil" immediately followed by "gagal" if the
    // save then failed (e.g. RLS blocking a non-admin write).
    upsertRow('system_settings', normalized)
      .then(() => addToast('Pengaturan ERP berhasil disimpan ke database.', 'success'))
      .catch((err) => onSaveError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan ke database.'));
  };

  // Customers CRUD
  const addCustomer = (cust: Customer) => {
    setCustomers((prev) => [cust, ...prev]);
    persist(upsertRow('customers', cust), onSaveError);
    addToast(`Pelanggan ${cust.name} berhasil ditambahkan!`, 'success');
  };
  const updateCustomer = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
    persist(upsertRow('customers', cust), onSaveError);
    addToast(`Data pelanggan ${cust.name} berhasil diperbarui!`, 'success');
  };
  const deleteCustomer = (id: string) => {
    if (!requireAdmin('menghapus pelanggan')) return;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    persist(deleteRow('customers', id), onSaveError);
    addToast('Pelanggan berhasil dihapus!', 'warning');
  };

  // Suppliers CRUD
  const addSupplier = (supp: Supplier) => {
    setSuppliers((prev) => [supp, ...prev]);
    persist(upsertRow('suppliers', supp), onSaveError);
    addToast(`Pemasok ${supp.name} berhasil ditambahkan!`, 'success');
  };
  const updateSupplier = (supp: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supp.id ? supp : s)));
    persist(upsertRow('suppliers', supp), onSaveError);
    addToast(`Data pemasok ${supp.name} berhasil diperbarui!`, 'success');
  };
  const deleteSupplier = (id: string) => {
    if (!requireAdmin('menghapus supplier')) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    persist(deleteRow('suppliers', id), onSaveError);
    addToast('Pemasok berhasil dihapus!', 'warning');
  };

  // Products CRUD
  const addProduct = (prod: Product) => {
    setProducts((prev) => [prod, ...prev]);
    persist(upsertRow('products', prod), onSaveError);
    addToast(`Produk ${prod.name} berhasil ditambahkan ke katalog!`, 'success');
  };
  const updateProduct = (prod: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    persist(upsertRow('products', prod), onSaveError);
    addToast(`Produk ${prod.name} berhasil diperbarui!`, 'success');
  };
  const deleteProduct = (id: string) => {
    if (!requireAdmin('menghapus produk')) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    persist(deleteRow('products', id), onSaveError);
    addToast('Produk berhasil dihapus dari katalog!', 'warning');
  };

  // Categories CRUD
  const addCategory = (cat: Category) => {
    setCategories((prev) => [...prev, cat]);
    persist(upsertRow('categories', cat), onSaveError);
    addToast(`Kategori ${cat.name} berhasil dibuat!`, 'success');
  };
  const updateCategory = (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    persist(upsertRow('categories', cat), onSaveError);
    addToast(`Kategori ${cat.name} diperbarui!`, 'success');
  };
  const deleteCategory = (id: string) => {
    if (!requireAdmin('menghapus kategori')) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    persist(deleteRow('categories', id), onSaveError);
    addToast('Kategori berhasil dihapus!', 'warning');
  };

  // Brands CRUD
  const addBrand = (br: Brand) => {
    setBrands((prev) => [...prev, br]);
    persist(upsertRow('brands', br), onSaveError);
    addToast(`Merek ${br.name} berhasil dibuat!`, 'success');
  };
  const updateBrand = (br: Brand) => {
    setBrands((prev) => prev.map((b) => (b.id === br.id ? br : b)));
    persist(upsertRow('brands', br), onSaveError);
    addToast(`Merek ${br.name} diperbarui!`, 'success');
  };
  const deleteBrand = (id: string) => {
    if (!requireAdmin('menghapus merek')) return;
    setBrands((prev) => prev.filter((b) => b.id !== id));
    persist(deleteRow('brands', id), onSaveError);
    addToast('Merek berhasil dihapus!', 'warning');
  };

  // UOM CRUD
  const addUom = (uom: Uom) => {
    setUoms((prev) => [...prev, uom]);
    persist(upsertRow('uoms', uom), onSaveError);
    addToast(`Satuan UoM ${uom.name} berhasil ditambahkan!`, 'success');
  };
  const updateUom = (uom: Uom) => {
    setUoms((prev) => prev.map((u) => (u.id === uom.id ? uom : u)));
    persist(upsertRow('uoms', uom), onSaveError);
    addToast(`Satuan UoM ${uom.name} diperbarui!`, 'success');
  };
  const deleteUom = (id: string) => {
    if (!requireAdmin('menghapus satuan')) return;
    setUoms((prev) => prev.filter((u) => u.id !== id));
    persist(deleteRow('uoms', id), onSaveError);
    addToast('Satuan UoM berhasil dihapus!', 'warning');
  };

  // PriceList CRUD
  const addPriceList = (pl: PriceList) => {
    setPriceLists((prev) => [...prev, pl]);
    persist(upsertRow('price_lists', pl), onSaveError);
    addToast(`Price List ${pl.name} berhasil dibuat!`, 'success');
  };
  const updatePriceList = (pl: PriceList) => {
    setPriceLists((prev) => prev.map((p) => (p.id === pl.id ? pl : p)));
    persist(upsertRow('price_lists', pl), onSaveError);
    addToast(`Price List ${pl.name} diperbarui!`, 'success');
  };
  const deletePriceList = (id: string) => {
    if (!requireAdmin('menghapus daftar harga')) return;
    setPriceLists((prev) => prev.filter((p) => p.id !== id));
    persist(deleteRow('price_lists', id), onSaveError);
    addToast('Price List berhasil dihapus!', 'warning');
  };

  // Discount Rules CRUD
  const addDiscountRule = (rule: DiscountRule) => {
    setDiscountRules((prev) => [...prev, rule]);
    persist(upsertRow('discount_rules', rule), onSaveError);
    addToast(`Aturan Diskon ${rule.name} berhasil ditambahkan!`, 'success');
  };
  const updateDiscountRule = (rule: DiscountRule) => {
    setDiscountRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    persist(upsertRow('discount_rules', rule), onSaveError);
    addToast(`Aturan Diskon ${rule.name} diperbarui!`, 'success');
  };
  const deleteDiscountRule = (id: string) => {
    if (!requireAdmin('menghapus aturan diskon')) return;
    setDiscountRules((prev) => prev.filter((r) => r.id !== id));
    persist(deleteRow('discount_rules', id), onSaveError);
    addToast('Aturan Diskon berhasil dihapus!', 'warning');
  };

  // Payment Terms CRUD
  const addPaymentTerm = (term: PaymentTerm) => {
    setPaymentTerms((prev) => [...prev, term]);
    persist(upsertRow('payment_terms', term), onSaveError);
    addToast(`Payment Term ${term.name} berhasil ditambahkan!`, 'success');
  };
  const updatePaymentTerm = (term: PaymentTerm) => {
    setPaymentTerms((prev) => prev.map((t) => (t.id === term.id ? term : t)));
    persist(upsertRow('payment_terms', term), onSaveError);
    addToast(`Payment Term ${term.name} diperbarui!`, 'success');
  };
  const deletePaymentTerm = (id: string) => {
    if (!requireAdmin('menghapus termin pembayaran')) return;
    setPaymentTerms((prev) => prev.filter((t) => t.id !== id));
    persist(deleteRow('payment_terms', id), onSaveError);
    addToast('Payment Term berhasil dihapus!', 'warning');
  };

  // Salespersons CRUD
  const addSalesperson = (sp: Salesperson) => {
    setSalespersons((prev) => [...prev, sp]);
    persist(upsertRow('salespersons', sp), onSaveError);
    addToast(`Sales Executive ${sp.name} berhasil ditambahkan!`, 'success');
  };
  const updateSalesperson = (sp: Salesperson) => {
    setSalespersons((prev) => prev.map((s) => (s.id === sp.id ? sp : s)));
    persist(upsertRow('salespersons', sp), onSaveError);
    addToast(`Sales Executive ${sp.name} diperbarui!`, 'success');
  };
  const deleteSalesperson = (id: string) => {
    if (!requireAdmin('menghapus salesperson')) return;
    setSalespersons((prev) => prev.filter((s) => s.id !== id));
    persist(deleteRow('salespersons', id), onSaveError);
    addToast('Salesperson berhasil dihapus!', 'warning');
  };

  // Warehouses CRUD
  const addWarehouse = (wh: Warehouse) => {
    setWarehouses((prev) => [...prev, wh]);
    persist(upsertRow('warehouses', wh), onSaveError);
    addToast(`Gudang ${wh.name} berhasil ditambahkan!`, 'success');
  };
  const updateWarehouse = (wh: Warehouse) => {
    setWarehouses((prev) => prev.map((w) => (w.id === wh.id ? wh : w)));
    persist(upsertRow('warehouses', wh), onSaveError);
    addToast(`Gudang ${wh.name} diperbarui!`, 'success');
  };
  const deleteWarehouse = (id: string) => {
    if (!requireAdmin('menghapus gudang')) return;
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    persist(deleteRow('warehouses', id), onSaveError);
    addToast('Gudang berhasil dihapus!', 'warning');
  };

  const addSalesOrder = (order: SalesOrder) => {
    setSalesOrders((prev) => [order, ...prev]);
    persist(upsertRow('sales_orders', order), onSaveError);
    addToast(`Sales Order ${order.code} berhasil dibuat!`, 'success');
  };

  const updateSalesOrderStatus = (id: string, status: SalesOrder['status']) => {
    const existing = salesOrders.find((so) => so.id === id);
    if (!existing) return;
    const updated = { ...existing, status };
    setSalesOrders((prev) => prev.map((so) => (so.id === id ? updated : so)));
    persist(upsertRow('sales_orders', updated), onSaveError);
    addToast(`Status Sales Order diubah menjadi ${status}`, 'info');
  };

  const addQuotation = (q: SalesQuotation) => {
    setQuotations((prev) => [q, ...prev]);
    persist(upsertRow('quotations', q), onSaveError);
    addToast(`Penawaran Harga ${q.code} berhasil diterbitkan!`, 'success');
  };

  const convertQuotationToSO = (id: string) => {
    const q = quotations.find((item) => item.id === id);
    if (!q) return;

    // Update Quotation status
    const updatedQuotation: SalesQuotation = { ...q, status: 'Converted' };
    setQuotations((prev) =>
      prev.map((item) => (item.id === id ? updatedQuotation : item))
    );
    persist(upsertRow('quotations', updatedQuotation), onSaveError);

    // Create SO
    const newSO: SalesOrder = {
      id: generateId('so'),
      code: generateDocumentNo('SO'),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: q.customerId,
      customerName: q.customerName,
      salespersonName: q.salespersonName,
      paymentTermName: q.paymentTermName,
      items: q.items,
      subtotal: q.subtotal,
      discountTotal: 0,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      status: 'Approved',
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      deliveryStatus: 'Pending',
      notes: `Dikonversi otomatis dari Penawaran ${q.code}`
    };

    setSalesOrders((prev) => [newSO, ...prev]);
    persist(upsertRow('sales_orders', newSO), onSaveError);
    addToast(`Penawaran ${q.code} berhasil dikonversi menjadi Sales Order ${newSO.code}!`, 'success');
  };

  const addDeliveryOrder = (doObj: DeliveryOrder) => {
    if (deliveries.some((d) => d.id === doObj.id || d.code === doObj.code)) {
      addToast(`Surat Jalan ${doObj.code} sudah tercatat.`, 'warning');
      return;
    }
    // Validate the complete delivery before changing any stock.
    let stockDeltas: ReturnType<typeof calculateDeliveryStock>;
    try {
      stockDeltas = calculateDeliveryStock(products, doObj.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stok tidak mencukupi.';
      if (message.startsWith('INSUFFICIENT_STOCK:')) {
        const [, code, available, requested] = message.split(':');
        addToast(`Stok ${code} tidak cukup. Tersedia ${available}, dibutuhkan ${requested}.`, 'danger');
      } else {
        addToast(`Produk pada Surat Jalan tidak valid. ${message}`, 'danger');
      }
      return;
    }

    setDeliveries((prev) => [doObj, ...prev]);
    persist(upsertRow('deliveries', doObj), onSaveError);

    const changedProducts: Product[] = [];
    setProducts((prev) => prev.map((product) => {
      const delta = stockDeltas.find((d) => d.productId === product.id);
      if (!delta) return product;
      const updated = { ...product, stock: delta.newStock };
      changedProducts.push(updated);
      return updated;
    }));
    changedProducts.forEach((product) => persist(upsertRow('products', product), onSaveError));

    doObj.items.forEach((item) => {
      const product = changedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
      const balance = product?.stock ?? 0;
      const sm: StockMovement = {
        id: generateId('sm'),
        date: `${doObj.date} 00:00`,
        documentNo: doObj.code,
        referenceNo: doObj.code,
        type: 'Out',
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        warehouseName: doObj.warehouseName,
        qtyOut: item.qty,
        qty: item.qty,
        balance,
        operator: doObj.driverName || 'System',
        uom: item.uom,
        notes: `Pengeluaran barang melalui Surat Jalan ${doObj.code}`,
      };
      setStockMovements((prev) => [sm, ...prev]);
      persist(upsertRow('stock_movements', sm), onSaveError);
    });

    // Also update SO deliveryStatus if matching
    const matchedSOs: SalesOrder[] = [];
    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.code === doObj.soCode) {
          const updated: SalesOrder = { ...so, deliveryStatus: 'Shipped', status: 'Processing' };
          matchedSOs.push(updated);
          return updated;
        }
        return so;
      })
    );
    matchedSOs.forEach((so) => persist(upsertRow('sales_orders', so), onSaveError));
    addToast(`Surat Jalan ${doObj.code} berhasil dibuat!`, 'success');
  };

  const updateDeliveryStatus = (id: string, status: DeliveryOrder['status']) => {
    const existing = deliveries.find((d) => d.id === id);
    if (!existing) return;
    const updated = { ...existing, status };
    setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
    persist(upsertRow('deliveries', updated), onSaveError);
    addToast(`Status Surat Jalan diperbarui: ${status}`, 'info');
  };

  const addSalesInvoice = (inv: SalesInvoice) => {
    if (invoices.some((existing) => existing.id === inv.id || existing.code === inv.code)) {
      addToast(`Faktur Penjualan ${inv.code} sudah tercatat.`, 'warning');
      return;
    }
    setInvoices((prev) => [inv, ...prev]);
    persist(upsertRow('invoices', inv), onSaveError);
    // Also update SO status
    const matchedSOs: SalesOrder[] = [];
    setSalesOrders((prev) =>
      prev.map((so) => {
        if (so.code === inv.soCode) {
          const updated: SalesOrder = { ...so, status: 'Completed' };
          matchedSOs.push(updated);
          return updated;
        }
        return so;
      })
    );
    matchedSOs.forEach((so) => persist(upsertRow('sales_orders', so), onSaveError));

    // Revenue/AR journal plus COGS/inventory relief. Cost is taken from the
    // product's current buyPrice because the invoice item stores selling
    // price, not cost. The DO has already reduced physical stock.
    const cogsAmount = calculateCogs(products, inv.items);

    const salesLines = [
      { accountCode: '1201', debit: inv.totalAmount, credit: 0 },
      { accountCode: '4101', debit: 0, credit: Math.max(0, inv.subtotal) },
      ...(inv.taxAmount > 0 ? [{ accountCode: '2201', debit: 0, credit: inv.taxAmount }] : []),
      ...(cogsAmount > 0
        ? [
            { accountCode: '5101', debit: cogsAmount, credit: 0 },
            { accountCode: '1301', debit: 0, credit: cogsAmount },
          ]
        : []),
    ];
    postAutoJournal({
      voucherNo: `JU-SALES-${inv.id}`, date: inv.date,
      description: `Faktur Penjualan ${inv.code} - ${inv.customerName}`,
      referenceType: 'sales_invoice', referenceId: inv.id, referenceNo: inv.code, lines: salesLines
    });
    addToast(`Faktur Penjualan ${inv.code} terbit dan jurnal otomatis dibuat!`, 'success');
  };

  const recordSalesPayment = (pay: SalesPayment) => {
    setPayments((prev) => [pay, ...prev]);
    persist(upsertRow('payments', pay), onSaveError);
    // Update matching invoice & receivables
    const matchedInvoices: SalesInvoice[] = [];
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.code === pay.invoiceNo) {
          const newPaid = inv.paidAmount + pay.amount;
          const newRem = Math.max(0, inv.totalAmount - newPaid);
          const updated: SalesInvoice = {
            ...inv,
            paidAmount: newPaid,
            remainingAmount: newRem,
            paymentStatus: newRem === 0 ? 'Paid' : 'Partial'
          };
          matchedInvoices.push(updated);
          return updated;
        }
        return inv;
      })
    );
    matchedInvoices.forEach((inv) => persist(upsertRow('invoices', inv), onSaveError));
    postAutoJournal({
      voucherNo: `JU-AR-${pay.id}`, date: pay.date,
      description: `Penerimaan pembayaran ${pay.code} - ${pay.customerName}`,
      referenceType: 'sales_payment', referenceId: pay.id, referenceNo: pay.code,
      lines: [
        { accountCode: cashAccountForPayment(pay.paymentMethod), debit: pay.amount, credit: 0 },
        { accountCode: '1201', debit: 0, credit: pay.amount },
      ]
    });
    addToast(`Pembayaran ${formatRupiah(pay.amount)} berhasil dicatat dan jurnal otomatis dibuat!`, 'success');
  };

  // Purchase Actions Implementation
  const addPurchaseRequest = (pr: PurchaseRequest) => {
    setPurchaseRequests((prev) => [pr, ...prev]);
    persist(upsertRow('purchase_requests', pr), onSaveError);
    addToast(`Permintaan Pembelian ${pr.code} berhasil diajukan!`, 'success');
  };

  const convertPRtoPO = (prId: string) => {
    const pr = purchaseRequests.find((p) => p.id === prId);
    if (!pr) return;

    const updatedPR: PurchaseRequest = { ...pr, status: 'Converted' };
    setPurchaseRequests((prev) =>
      prev.map((item) => (item.id === prId ? updatedPR : item))
    );
    persist(upsertRow('purchase_requests', updatedPR), onSaveError);

    const supplierObj = suppliers.find((s) => s.id === pr.supplierId) || suppliers[0];

    const poItems = pr.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      uom: item.uom,
      qty: item.qty,
      unitPrice: item.estimatedPrice || 0,
      discounts: [],
      netPrice: item.estimatedPrice || 0,
      subtotal: item.qty * (item.estimatedPrice || 0)
    }));

    const subtotal = poItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const taxAmount = Math.round(subtotal * 0.11);
    const totalAmount = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: generateId('po'),
      code: generateDocumentNo('PO'),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplierId: supplierObj?.id || pr.supplierId || '',
      supplierNumber: supplierObj?.code || '',
      supplierName: supplierObj?.name || pr.supplierName || '',
      address: supplierObj?.address || '',
      warehouseName: pr.warehouseName || '',
      paymentTermId: supplierObj?.paymentTermId || '',
      paymentTermName: supplierObj?.paymentTermName || '30 Hari (Default)',
      buyerName: profile?.full_name || '',
      items: poItems,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'Sent',
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      receiptStatus: 'Pending',
      notes: `Dikonversi dari Permintaan Pembelian ${pr.code}`
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    persist(upsertRow('purchase_orders', newPO), onSaveError);
    addToast(`Purchase Request ${pr.code} berhasil dikonversi menjadi PO ${newPO.code}!`, 'success');
  };

  const addPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders((prev) => [po, ...prev]);
    persist(upsertRow('purchase_orders', po), onSaveError);
    addToast(`Purchase Order ${po.code} berhasil diterbitkan ke ${po.supplierName}!`, 'success');
  };

  const updatePOStatus = (id: string, status: PurchaseOrder['status']) => {
    const existing = purchaseOrders.find((po) => po.id === id);
    if (!existing) return;
    const updated = { ...existing, status };
    setPurchaseOrders((prev) => prev.map((po) => (po.id === id ? updated : po)));
    persist(upsertRow('purchase_orders', updated), onSaveError);
    addToast(`Status PO diperbarui: ${status}`, 'info');
  };

  const addGoodsReceipt = (gr: GoodsReceipt) => {
    if (goodsReceipts.some((existing) => existing.id === gr.id || existing.code === gr.code)) {
      addToast(`Goods Receipt ${gr.code} sudah tercatat.`, 'warning');
      return;
    }
    setGoodsReceipts((prev) => [gr, ...prev]);
    persist(upsertRow('goods_receipts', gr), onSaveError);
    // Update matching PO status
    const matchedPOs: PurchaseOrder[] = [];
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.code === gr.poCode) {
          const updated: PurchaseOrder = { ...po, status: 'Received', receiptStatus: 'Full' };
          matchedPOs.push(updated);
          return updated;
        }
        return po;
      })
    );
    matchedPOs.forEach((po) => persist(upsertRow('purchase_orders', po), onSaveError));
    // Goods Receipt increases on-hand stock immediately.
    let stockDeltas: ReturnType<typeof calculateGoodsReceiptStock>;
    try {
      stockDeltas = calculateGoodsReceiptStock(products, gr.items);
    } catch (err) {
      addToast(`Produk pada Goods Receipt tidak valid. ${err instanceof Error ? err.message : ''}`, 'danger');
      return;
    }

    const changedProducts: Product[] = [];
    setProducts((prev) => prev.map((product) => {
      const delta = stockDeltas.find((d) => d.productId === product.id);
      if (!delta) return product;
      const updated = { ...product, stock: delta.newStock };
      changedProducts.push(updated);
      return updated;
    }));
    changedProducts.forEach((product) => persist(upsertRow('products', product), onSaveError));

    gr.items.forEach((item) => {
      const updatedProduct = changedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
      const sm: StockMovement = {
        id: generateId('sm'),
        date: `${gr.date} 00:00`,
        documentNo: gr.code,
        type: 'In',
        qty: item.qtyReceived,
        qtyIn: item.qtyReceived,
        qtyOut: 0,
        balance: updatedProduct?.stock ?? 0,
        uom: item.uom,
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        referenceNo: gr.code,
        warehouseName: gr.warehouseName,
        batchNo: item.batchNo || 'LOT-RCV-AUTO',
        operator: gr.receivedBy,
        notes: `Penerimaan barang melalui Goods Receipt ${gr.code}`,
      };
      setStockMovements((prev) => [sm, ...prev]);
      persist(upsertRow('stock_movements', sm), onSaveError);
    });

    addToast(`Penerimaan Barang ${gr.code} (GR) berhasil dicatat ke gudang!`, 'success');
  };

  const addPurchaseInvoice = (pinv: PurchaseInvoice) => {
    setPurchaseInvoices((prev) => [pinv, ...prev]);
    persist(upsertRow('purchase_invoices', pinv), onSaveError);

    // Automatically record an Account Payable (Hutang Usaha) entry
    const newPayable: Payable = {
      id: generateId('ap'),
      invoiceNo: pinv.supplierInvoiceNo || pinv.code,
      poCode: pinv.poCode,
      supplierId: pinv.supplierId,
      supplierName: pinv.supplierName,
      invoiceDate: pinv.date,
      dueDate: pinv.dueDate,
      total: pinv.totalAmount,
      amount: pinv.totalAmount,
      paid: 0,
      paidAmount: 0,
      outstanding: pinv.totalAmount,
      remainingAmount: pinv.totalAmount,
      status: 'Unpaid',
      agingBucket: 'Current',
      notes: pinv.notes || `Faktur Pembelian ${pinv.code}`
    };

    setPayables((prev) => [newPayable, ...prev]);
    persist(upsertRow('payables', newPayable), onSaveError);

    // Update PO status
    const matchedPOs: PurchaseOrder[] = [];
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.code === pinv.poCode) {
          const updated: PurchaseOrder = { ...po, status: 'Invoiced' };
          matchedPOs.push(updated);
          return updated;
        }
        return po;
      })
    );
    matchedPOs.forEach((po) => persist(upsertRow('purchase_orders', po), onSaveError));

    const purchaseLines = [
      { accountCode: '1301', debit: Math.max(0, pinv.subtotal), credit: 0 },
      ...(pinv.taxAmount > 0 ? [{ accountCode: '1401', debit: pinv.taxAmount, credit: 0 }] : []),
      { accountCode: '2101', debit: 0, credit: pinv.totalAmount },
    ];
    postAutoJournal({
      voucherNo: `JU-PURCHASE-${pinv.id}`, date: pinv.date,
      description: `Faktur Pembelian ${pinv.code} - ${pinv.supplierName}`,
      referenceType: 'purchase_invoice', referenceId: pinv.id, referenceNo: pinv.code, lines: purchaseLines
    });
    addToast(`Faktur Pembelian ${pinv.code} terbit! Hutang Usaha (${formatRupiah(pinv.totalAmount)}) dan jurnal otomatis telah dicatat.`, 'success');
  };

  const recordSupplierPayment = (pay: SupplierPayment) => {
    setSupplierPayments((prev) => [pay, ...prev]);
    persist(upsertRow('supplier_payments', pay), onSaveError);

    // Update matching Payable
    const matchedPayables: Payable[] = [];
    setPayables((prev) =>
      prev.map((ap) => {
        if (ap.invoiceNo === pay.invoice || ap.invoiceNo === pay.invoiceNo) {
          const newPaid = ap.paidAmount + pay.amount;
          const newRemaining = Math.max(0, ap.total - newPaid);
          const newStatus: Payable['status'] = newRemaining === 0 ? 'Paid' : 'Partially Paid';
          const updated: Payable = {
            ...ap,
            paid: newPaid,
            paidAmount: newPaid,
            outstanding: newRemaining,
            remainingAmount: newRemaining,
            status: newStatus
          };
          matchedPayables.push(updated);
          return updated;
        }
        return ap;
      })
    );
    matchedPayables.forEach((ap) => persist(upsertRow('payables', ap), onSaveError));

    // Update matching Purchase Invoice if exists
    const matchedPInvoices: PurchaseInvoice[] = [];
    setPurchaseInvoices((prev) =>
      prev.map((pinv) => {
        if (pinv.supplierInvoiceNo === pay.invoice || pinv.code === pay.invoice) {
          const newPaid = pinv.paidAmount + pay.amount;
          const newRemaining = Math.max(0, pinv.totalAmount - newPaid);
          const updated: PurchaseInvoice = {
            ...pinv,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            paymentStatus: newRemaining === 0 ? 'Paid' : 'Partially Paid'
          };
          matchedPInvoices.push(updated);
          return updated;
        }
        return pinv;
      })
    );
    matchedPInvoices.forEach((pinv) => persist(upsertRow('purchase_invoices', pinv), onSaveError));
    postAutoJournal({
      voucherNo: `JU-AP-${pay.id}`, date: pay.date,
      description: `Pembayaran hutang ${pay.paymentNumber} - ${pay.supplierName}`,
      referenceType: 'supplier_payment', referenceId: pay.id, referenceNo: pay.paymentNumber,
      lines: [
        { accountCode: '2101', debit: pay.amount, credit: 0 },
        { accountCode: cashAccountForPayment(pay.paymentMethod), debit: 0, credit: pay.amount },
      ]
    });
    addToast(`Pembayaran Hutang Supplier ${formatRupiah(pay.amount)} ke ${pay.supplierName} berhasil dicatat dan dijurnal!`, 'success');
  };

  // Inventory Actions Implementation
  const addStockMovement = (sm: StockMovement) => {
    setStockMovements((prev) => [sm, ...prev]);
    persist(upsertRow('stock_movements', sm), onSaveError);
  };

  const addStockTransfer = (st: StockTransfer) => {
    setStockTransfers((prev) => [st, ...prev]);
    persist(upsertRow('stock_transfers', st), onSaveError);
    addToast(`Dokumen Transfer Gudang ${st.transferNo} berhasil dibuat!`, 'success');
  };

  const updateStockTransferStatus = (id: string, status: StockTransfer['status']) => {
    const existing = stockTransfers.find((st) => st.id === id);
    if (!existing) return;
    const updated = { ...existing, status };
    setStockTransfers((prev) => prev.map((st) => (st.id === id ? updated : st)));
    persist(upsertRow('stock_transfers', updated), onSaveError);
    addToast(`Status Transfer Gudang diubah menjadi ${status}`, 'info');
  };

  const addStockAdjustment = (adj: StockAdjustment) => {
    setStockAdjustments((prev) => [adj, ...prev]);
    persist(upsertRow('stock_adjustments', adj), onSaveError);

    // Update Product Stock
    const matchedProducts: Product[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adj.productId || p.code === adj.productCode) {
          const delta = adj.type === 'Increase' ? adj.qty : -adj.qty;
          const newStock = Math.max(0, p.stock + delta);
          const updated = { ...p, stock: newStock };
          matchedProducts.push(updated);
          return updated;
        }
        return p;
      })
    );
    matchedProducts.forEach((p) => persist(upsertRow('products', p), onSaveError));

    // Record Stock Movement
    const sm: StockMovement = {
      id: generateId('sm'),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      documentNo: adj.adjustmentNo,
      referenceNo: adj.reference || adj.adjustmentNo,
      type: 'Adjustment',
      productCode: adj.productCode,
      productName: adj.productName,
      warehouseName: adj.warehouseName,
      qtyIn: adj.type === 'Increase' ? adj.qty : 0,
      qtyOut: adj.type === 'Decrease' ? adj.qty : 0,
      qty: adj.qty,
      balance: 0,
      user: adj.user,
      operator: adj.user,
      uom: adj.uom,
      notes: `Adjustment (${adj.type}): ${adj.reason}`
    };
    setStockMovements((prev) => [sm, ...prev]);
    persist(upsertRow('stock_movements', sm), onSaveError);

    addToast(`Penyesuaian Stok (${adj.type} ${adj.qty} ${adj.uom}) berhasil disimpan!`, 'success');
  };

  const addBatchSerial = (bs: BatchSerialItem) => {
    setBatchSerials((prev) => [bs, ...prev]);
    persist(upsertRow('batch_serials', bs), onSaveError);
    addToast(`Nomor Batch / Lot ${bs.batchNumber || bs.serialNumber} berhasil didaftarkan!`, 'success');
  };

  const markNotificationRead = (id: string) => {
    const existing = notifications.find((n) => n.id === id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (existing) persist(upsertRow('notifications', { ...existing, read: true }), onSaveError);
  };

  // Admin-only: wipe every master + transactional table (everything except
  // company system_settings and user profiles/logins) both in Supabase and
  // in local state, so the dashboard and every list genuinely start at zero.
  // Irreversible — the UI is responsible for confirming with the user first.
  const [isResettingData, setIsResettingData] = useState(false);
  const resetAllData = async () => {
    if (!requireAdmin('menghapus semua data')) return;
    setIsResettingData(true);
    const tablesToWipe: TableName[] = [
      'customers', 'suppliers', 'products', 'categories', 'brands', 'uoms',
      'price_lists', 'discount_rules', 'payment_terms', 'salespersons', 'warehouses',
      'sales_orders', 'quotations', 'deliveries', 'invoices', 'payments',
      'purchase_requests', 'purchase_orders', 'goods_receipts', 'purchase_invoices',
      'supplier_payments', 'receivables', 'payables', 'stock_movements',
      'stock_transfers', 'stock_adjustments', 'batch_serials', 'notifications'
    ];
    try {
      if (isSupabaseConfigured) {
        for (const table of tablesToWipe) {
          await deleteAllRows(table);
        }
      }
      setCustomers([]);
      setSuppliers([]);
      setProducts([]);
      setCategories([]);
      setBrands([]);
      setUoms([]);
      setPriceLists([]);
      setDiscountRules([]);
      setPaymentTerms([]);
      setSalespersons([]);
      setWarehouses([]);
      setSalesOrders([]);
      setQuotations([]);
      setDeliveries([]);
      setInvoices([]);
      setPayments([]);
      setPurchaseRequests([]);
      setPurchaseOrders([]);
      setGoodsReceipts([]);
      setPurchaseInvoices([]);
      setSupplierPayments([]);
      setReceivables([]);
      setPayables([]);
      setStockMovements([]);
      setStockTransfers([]);
      setStockAdjustments([]);
      setBatchSerials([]);
      setNotifications([]);
      addToast('Semua data master & transaksi berhasil dihapus. Aplikasi kembali kosong.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? `Gagal menghapus semua data: ${err.message}` : 'Gagal menghapus semua data.', 'danger');
    } finally {
      setIsResettingData(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        isLoadingData,
        isCloudConnected: isSupabaseConfigured,
        customers,
        suppliers,
        products,
        categories,
        brands,
        uoms,
        priceLists,
        discountRules,
        paymentTerms,
        salespersons,
        warehouses,
        salesOrders,
        quotations,
        deliveries,
        invoices,
        payments,
        purchaseRequests,
        purchaseOrders,
        goodsReceipts,
        purchaseInvoices,
        supplierPayments,
        receivables,
        payables,
        stockMovements,
        stockTransfers,
        stockAdjustments,
        batchSerials,
        notifications,
        systemSettings,
        updateSystemSettings,

        isDiscountModalOpen,
        openDiscountModal,
        closeDiscountModal,
        discountModalInitialPrice,
        discountModalDiscounts,

        isDocModalOpen,
        docModalData,
        openDocModal,
        closeDocModal,

        isCommandMenuOpen,
        setCommandMenuOpen,

        isNewOrderModalOpen,
        setNewOrderModalOpen,

        toasts,
        addToast,
        removeToast,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        addSupplier,
        updateSupplier,
        deleteSupplier,

        addProduct,
        updateProduct,
        deleteProduct,

        addCategory,
        updateCategory,
        deleteCategory,

        addBrand,
        updateBrand,
        deleteBrand,

        addUom,
        updateUom,
        deleteUom,

        addPriceList,
        updatePriceList,
        deletePriceList,

        addDiscountRule,
        updateDiscountRule,
        deleteDiscountRule,

        addPaymentTerm,
        updatePaymentTerm,
        deletePaymentTerm,

        addSalesperson,
        updateSalesperson,
        deleteSalesperson,

        addWarehouse,
        updateWarehouse,
        deleteWarehouse,

        addSalesOrder,
        updateSalesOrderStatus,
        addQuotation,
        convertQuotationToSO,
        addDeliveryOrder,
        updateDeliveryStatus,
        addSalesInvoice,
        recordSalesPayment,

        addPurchaseRequest,
        convertPRtoPO,
        addPurchaseOrder,
        updatePOStatus,
        addGoodsReceipt,
        addPurchaseInvoice,
        recordSupplierPayment,

        addStockMovement,
        addStockTransfer,
        updateStockTransferStatus,
        addStockAdjustment,
        addBatchSerial,

        markNotificationRead,

        isResettingData,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
