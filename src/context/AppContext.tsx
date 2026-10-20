import { generateId, nextDocumentNo } from '../lib/identifiers';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatRupiah } from '../utils/discountEngine';
import { calculateCogs, calculateDeliveryStock, calculateGoodsReceiptStock, calculateMovingAverageCost, changeWarehouseStock, getWarehouseStock, reverseMovingAverageCost } from '../utils/inventoryEngine';
import { useAuth } from './AuthContext';
import { postJournalEntry, cashAccountForPayment } from '../lib/accounting';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchTable, upsertRow, upsertRowsInChunks, deleteRow, deleteAllRows, applyStockChanges, createDeliveryWithStock, applyStockTransfer, reverseInventoryDocument, cancelInventoryInvoice, updateProductMasters, createProductsWithOpeningStock, createSalesOrderWithStockCheck, persist, type TableName } from '../lib/db';
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
  importCustomers: (items: Customer[]) => { added: number; updated: number; skipped: number };
  updateCustomer: (cust: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supp: Supplier) => void;
  updateSupplier: (supp: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addProduct: (prod: Product) => void;
  importProducts: (items: Product[]) => { added: number; updated: number; skipped: number };
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

  addSalesOrder: (order: SalesOrder) => Promise<boolean>;
  updateSalesOrderStatus: (id: string, status: SalesOrder['status']) => void;
  addQuotation: (q: SalesQuotation) => void;
  convertQuotationToSO: (id: string) => Promise<boolean>;
  addDeliveryOrder: (doObj: DeliveryOrder) => Promise<boolean>;
  updateDeliveryStatus: (id: string, status: DeliveryOrder['status']) => void;
  addSalesInvoice: (inv: SalesInvoice) => void;
  cancelSalesInvoice: (id: string, reason: string) => void;
  recordSalesPayment: (pay: SalesPayment) => void;

  // Purchase Actions
  addPurchaseRequest: (pr: PurchaseRequest) => void;
  convertPRtoPO: (prId: string) => Promise<void>;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => void;
  addGoodsReceipt: (gr: GoodsReceipt) => boolean;
  reverseGoodsReceipt: (id: string, disposition: 'Voided' | 'Returned', reason: string) => void;
  addPurchaseInvoice: (pinv: PurchaseInvoice) => boolean;
  cancelPurchaseInvoice: (id: string, reason: string) => void;
  recordSupplierPayment: (pay: SupplierPayment) => void;
  
  // Inventory Actions
  addStockTransfer: (st: StockTransfer) => void;
  updateStockTransferStatus: (id: string, status: StockTransfer['status']) => void;
  addStockAdjustment: (adj: StockAdjustment) => void;
  addBatchSerial: (bs: BatchSerialItem) => void;

  markNotificationRead: (id: string) => void;

  // Admin-only danger zone
  isResettingData: boolean;
  resetAllData: () => Promise<void>;

  // Derived credit exposure of a customer (opening balance + open receivables)
  getCustomerOutstanding: (customerId: string | undefined | null) => number;
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

  const createOpeningStockMovement = (product: Product): StockMovement | null => {
    const qty = Number(product.stock);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return {
      id: `opening-stock-v1:${product.id}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      documentNo: `SALDO-AWAL-${product.code}`,
      referenceNo: product.code,
      type: 'Opening Balance',
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      warehouseId: product.warehouseId,
      warehouseName: product.warehouseName || 'Belum ditentukan',
      qtyIn: qty,
      qtyOut: 0,
      qty,
      balance: qty,
      user: profile?.full_name || 'Admin',
      operator: profile?.full_name || 'Admin',
      uom: product.uom,
      notes: 'Saldo awal saat produk dibuat.',
    };
  };

  // Persist several rows of one table from an already-computed list.
  const persistRows = <T extends { id: string }>(table: TableName, rows: T[]) => {
    rows.forEach((row) => persist(upsertRow(table, row), onSaveError));
  };

  // Credit exposure of a customer = opening balance typed in the customer
  // master (outstandingAR / outstanding / usedCredit) + the live remaining
  // balance of every receivable opened by sales invoices. Derived on read, so
  // no write to the (admin-only) customers table is needed and nothing can
  // drift out of sync.
  const getCustomerOutstanding = (customerId: string | undefined | null): number => {
    if (!customerId) return 0;
    const customer = customers.find((c) => c.id === customerId);
    const opening = customer?.outstandingAR ?? customer?.outstanding ?? customer?.usedCredit ?? 0;
    const live = receivables
      .filter((r) => r.customerId === customerId)
      .reduce((sum, r) => sum + Math.max(0, r.remainingAmount ?? r.outstanding ?? 0), 0);
    return Math.max(0, opening) + live;
  };

  // `after` = the save of the source document. The server only accepts a journal
  // for a document it already stores (and checks the amounts against it), so the
  // journal waits for that save; if the save failed there is nothing to journal.
  const postAutoJournal = (input: Parameters<typeof postJournalEntry>[0], after?: Promise<unknown>) => {
    if (!isSupabaseConfigured) return;
    const run = after ? after.then(() => postJournalEntry(input), () => undefined) : postJournalEntry(input);
    void Promise.resolve(run).catch((err) => {
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

  // Master-data integrity helpers: codes are used as lookup keys across
  // documents, so they must be unique; and a master record that documents still
  // point at must not be deleted (it would leave orphaned/blank references).
  const sameCode = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
  const codeTaken = (rows: Array<{ id: string; code: string }>, row: { id: string; code: string }) =>
    rows.some((r) => r.id !== row.id && sameCode(r.code, row.code));

  // Customers CRUD
  const addCustomer = (cust: Customer) => {
    if (codeTaken(customers, cust)) {
      addToast(`Kode pelanggan ${cust.code} sudah dipakai.`, 'danger');
      return;
    }
    setCustomers((prev) => [cust, ...prev]);
    persist(upsertRow('customers', cust), onSaveError);
    addToast(`Pelanggan ${cust.name} berhasil ditambahkan!`, 'success');
  };
  // Mass upload: adds new customers and updates existing ones in ONE state
  // update and a few chunked database writes. Re-checks code uniqueness against
  // the live customer list (it may have changed since the preview was built).
  const importCustomers = (items: Customer[]) => {
    const existingIds = new Set(customers.map((c) => c.id));
    const codeOwner = new Map(customers.map((c) => [c.code.trim().toLowerCase(), c.id]));
    const batchCodes = new Set<string>();
    const accepted: Customer[] = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const key = item.code.trim().toLowerCase();
      const owner = codeOwner.get(key);
      if ((owner && owner !== item.id) || batchCodes.has(key)) {
        skipped += 1;
        continue;
      }
      batchCodes.add(key);
      accepted.push(item);
      if (existingIds.has(item.id)) updated += 1;
      else added += 1;
    }

    if (accepted.length > 0) {
      const acceptedById = new Map(accepted.map((c) => [c.id, c]));
      setCustomers((prev) => {
        const prevIds = new Set(prev.map((c) => c.id));
        const fresh = accepted.filter((c) => !prevIds.has(c.id));
        return [...fresh, ...prev.map((c) => acceptedById.get(c.id) ?? c)];
      });
      persist(upsertRowsInChunks('customers', accepted), onSaveError);
    }

    const parts = [`${added} pelanggan ditambahkan`, `${updated} diperbarui`];
    if (skipped > 0) parts.push(`${skipped} dilewati (kode bentrok)`);
    addToast(`Upload massal selesai: ${parts.join(', ')}.`, accepted.length > 0 ? 'success' : 'warning');
    return { added, updated, skipped };
  };
  const updateCustomer = (cust: Customer) => {
    if (codeTaken(customers, cust)) {
      addToast(`Kode pelanggan ${cust.code} sudah dipakai.`, 'danger');
      return;
    }
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
    persist(upsertRow('customers', cust), onSaveError);
    addToast(`Data pelanggan ${cust.name} berhasil diperbarui!`, 'success');
  };
  const deleteCustomer = (id: string) => {
    if (!requireAdmin('menghapus pelanggan')) return;
    const usedByCustomer =
      salesOrders.some((d) => d.customerId === id) ||
      quotations.some((d) => d.customerId === id) ||
      deliveries.some((d) => d.customerId === id) ||
      invoices.some((d) => d.customerId === id) ||
      payments.some((d) => d.customerId === id) ||
      receivables.some((d) => d.customerId === id);
    if (usedByCustomer) {
      addToast('Pelanggan tidak bisa dihapus karena sudah dipakai di transaksi. Nonaktifkan saja.', 'danger');
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    persist(deleteRow('customers', id), onSaveError);
    addToast('Pelanggan berhasil dihapus!', 'warning');
  };

  // Suppliers CRUD
  const addSupplier = (supp: Supplier) => {
    if (codeTaken(suppliers, supp)) {
      addToast(`Kode pemasok ${supp.code} sudah dipakai.`, 'danger');
      return;
    }
    setSuppliers((prev) => [supp, ...prev]);
    persist(upsertRow('suppliers', supp), onSaveError);
    addToast(`Pemasok ${supp.name} berhasil ditambahkan!`, 'success');
  };
  const updateSupplier = (supp: Supplier) => {
    if (codeTaken(suppliers, supp)) {
      addToast(`Kode pemasok ${supp.code} sudah dipakai.`, 'danger');
      return;
    }
    setSuppliers((prev) => prev.map((s) => (s.id === supp.id ? supp : s)));
    persist(upsertRow('suppliers', supp), onSaveError);
    addToast(`Data pemasok ${supp.name} berhasil diperbarui!`, 'success');
  };
  const deleteSupplier = (id: string) => {
    if (!requireAdmin('menghapus supplier')) return;
    const usedBySupplier =
      purchaseOrders.some((d) => d.supplierId === id) ||
      purchaseRequests.some((d) => d.supplierId === id) ||
      purchaseInvoices.some((d) => d.supplierId === id) ||
      supplierPayments.some((d) => d.supplierId === id) ||
      payables.some((d) => d.supplierId === id);
    if (usedBySupplier) {
      addToast('Pemasok tidak bisa dihapus karena sudah dipakai di transaksi. Nonaktifkan saja.', 'danger');
      return;
    }
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    persist(deleteRow('suppliers', id), onSaveError);
    addToast('Pemasok berhasil dihapus!', 'warning');
  };

  // Products CRUD
  const addProduct = (prod: Product) => {
    if (codeTaken(products, prod)) {
      addToast(`Kode produk ${prod.code} sudah dipakai.`, 'danger');
      return;
    }
    if (!Number.isFinite(prod.stock) || prod.stock < 0) {
      addToast('Stok awal produk tidak boleh negatif.', 'danger');
      return;
    }
    setProducts((prev) => [prod, ...prev]);
    const openingMovement = createOpeningStockMovement(prod);
    if (openingMovement) {
      setStockMovements((prev) => [openingMovement, ...prev]);
      persist(createProductsWithOpeningStock([prod]), onSaveError);
    } else {
      persist(createProductsWithOpeningStock([prod]), onSaveError);
    }
    addToast(`Produk ${prod.name} berhasil ditambahkan ke katalog!`, 'success');
  };
  // Mass upload: adds new products and updates existing ones in ONE state update
  // and a few chunked database writes. Re-checks code uniqueness against the
  // live catalog (it may have changed since the preview was built).
  const importProducts = (items: Product[]) => {
    const existingById = new Map(products.map((p) => [p.id, p]));
    const existingIds = new Set(existingById.keys());
    const codeOwner = new Map(products.map((p) => [p.code.trim().toLowerCase(), p.id]));
    const batchCodes = new Set<string>();
    const accepted: Product[] = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const key = item.code.trim().toLowerCase();
      const owner = codeOwner.get(key);
      if ((owner && owner !== item.id) || batchCodes.has(key)) {
        skipped += 1;
        continue;
      }
      batchCodes.add(key);
      accepted.push(item);
      if (existingIds.has(item.id)) updated += 1;
      else added += 1;
    }

    if (accepted.length > 0) {
      const safeAccepted = accepted.map((product) => {
        const current = existingById.get(product.id);
        return current
          ? { ...product, stock: current.stock, warehouses: current.warehouses }
          : product;
      });
      const acceptedById = new Map(safeAccepted.map((p) => [p.id, p]));
      const fresh = safeAccepted.filter((p) => !existingIds.has(p.id));
      const changedExisting = safeAccepted.filter((p) => existingIds.has(p.id));
      setProducts((prev) => [
        ...fresh,
        ...prev.map((p) => {
          const imported = acceptedById.get(p.id);
          return imported ? { ...imported, stock: p.stock, warehouses: p.warehouses } : p;
        }),
      ]);
      if (changedExisting.length > 0) persist(updateProductMasters(changedExisting), onSaveError);

      const openingMovements = fresh
        .map((product) => createOpeningStockMovement(product))
        .filter((movement): movement is StockMovement => movement !== null);
      if (openingMovements.length > 0) {
        setStockMovements((prev) => [...openingMovements, ...prev]);
      }
      if (fresh.length > 0) {
        persist(createProductsWithOpeningStock(fresh), onSaveError);
      }
    }

    const parts = [`${added} produk ditambahkan`, `${updated} diperbarui`];
    if (skipped > 0) parts.push(`${skipped} dilewati (kode bentrok)`);
    addToast(`Upload massal selesai: ${parts.join(', ')}.`, accepted.length > 0 ? 'success' : 'warning');
    return { added, updated, skipped };
  };
  const updateProduct = (prod: Product) => {
    if (codeTaken(products, prod)) {
      addToast(`Kode produk ${prod.code} sudah dipakai.`, 'danger');
      return;
    }
    const current = products.find((p) => p.id === prod.id);
    if (!current) {
      addToast('Produk yang akan diperbarui tidak ditemukan.', 'danger');
      return;
    }
    const safeProduct = { ...prod, stock: current.stock, warehouses: current.warehouses };
    setProducts((prev) => prev.map((p) => p.id === safeProduct.id
      ? { ...safeProduct, stock: p.stock, warehouses: p.warehouses }
      : p));
    persist(updateProductMasters([safeProduct]), onSaveError);
    addToast(`Produk ${safeProduct.name} berhasil diperbarui!`, 'success');
  };
  const deleteProduct = (id: string) => {
    if (!requireAdmin('menghapus produk')) return;
    const target = products.find((p) => p.id === id);
    const usesProduct = (items: Array<{ productId?: string; productCode?: string }>) =>
      items.some((i) => i.productId === id || (!!target && i.productCode === target.code));
    const usedByProduct =
      salesOrders.some((d) => usesProduct(d.items)) ||
      quotations.some((d) => usesProduct(d.items)) ||
      deliveries.some((d) => usesProduct(d.items)) ||
      invoices.some((d) => usesProduct(d.items)) ||
      purchaseOrders.some((d) => usesProduct(d.items)) ||
      purchaseRequests.some((d) => usesProduct(d.items)) ||
      goodsReceipts.some((d) => usesProduct(d.items)) ||
      stockMovements.some((m) => m.productId === id || (!!target && m.productCode === target.code));
    if (usedByProduct) {
      addToast('Produk tidak bisa dihapus karena sudah punya transaksi/kartu stok. Nonaktifkan saja.', 'danger');
      return;
    }
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

  const addSalesOrder = async (order: SalesOrder): Promise<boolean> => {
    try {
      await createSalesOrderWithStockCheck(order);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Sales Order gagal disimpan karena stok tidak dapat divalidasi.', 'danger');
      return false;
    }
    setSalesOrders((prev) => [order, ...prev]);
    addToast(`Sales Order ${order.code} berhasil dibuat!`, 'success');
    return true;
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

  const convertQuotationToSO = async (id: string): Promise<boolean> => {
    const q = quotations.find((item) => item.id === id);
    if (!q) return false;
    if (q.status === 'Converted' || q.status === 'Rejected') {
      addToast(`Penawaran ${q.code} berstatus ${q.status} dan tidak bisa dikonversi lagi.`, 'warning');
      return false;
    }

    // Create SO
    const newSO: SalesOrder = {
      id: generateId('so'),
      code: await nextDocumentNo('SO'),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: q.customerId,
      customerCode: customers.find((c) => c.id === q.customerId)?.code,
      customerName: q.customerName,
      address: customers.find((c) => c.id === q.customerId)?.address || '',
      salespersonName: q.salespersonName,
      paymentTermName: q.paymentTermName,
      warehouseName: warehouses[0]?.name,
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

    try {
      await createSalesOrderWithStockCheck(newSO);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Sales Order gagal dibuat karena stok tidak dapat divalidasi.', 'danger');
      return false;
    }

    const updatedQuotation: SalesQuotation = { ...q, status: 'Converted' };
    setQuotations((prev) => prev.map((item) => (item.id === id ? updatedQuotation : item)));
    persist(upsertRow('quotations', updatedQuotation), onSaveError);
    setSalesOrders((prev) => [newSO, ...prev]);
    addToast(`Penawaran ${q.code} berhasil dikonversi menjadi Sales Order ${newSO.code}!`, 'success');
    return true;
  };

  const addDeliveryOrder = async (doObj: DeliveryOrder): Promise<boolean> => {
    if (deliveries.some((d) => d.id === doObj.id || d.code === doObj.code)) {
      addToast(`Surat Jalan ${doObj.code} sudah tercatat.`, 'warning');
      return false;
    }
    // One delivery per order: the SO must still be waiting to be shipped.
    const deliverySO = salesOrders.find((so) => so.code === doObj.soCode);
    if (deliverySO && (deliverySO.status !== 'Approved' || deliverySO.deliveryStatus !== 'Pending')) {
      addToast(`SO ${deliverySO.code} berstatus ${deliverySO.status} dan tidak bisa dibuatkan Surat Jalan.`, 'warning');
      return false;
    }
    const deliveryWarehouse = warehouses.find((warehouse) => warehouse.id === doObj.warehouseId)
      ?? warehouses.find((warehouse) => warehouse.name === doObj.warehouseName);
    if (!deliveryWarehouse) {
      addToast(`Gudang ${doObj.warehouseName} tidak ditemukan.`, 'danger');
      return false;
    }
    const savedDO: DeliveryOrder = {
      ...doObj,
      warehouseId: deliveryWarehouse.id,
      warehouseName: deliveryWarehouse.name,
      items: doObj.items.map((item) => ({
        ...item,
        unitCost: products.find((product) => product.id === item.productId || product.code === item.productCode)?.buyPrice ?? 0,
      })),
    };
    // Validate the complete delivery before changing any stock.
    let stockDeltas: ReturnType<typeof calculateDeliveryStock>;
    try {
      stockDeltas = calculateDeliveryStock(products, savedDO.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stok tidak mencukupi.';
      if (message.startsWith('INSUFFICIENT_STOCK:')) {
        const [, code, available, requested] = message.split(':');
        addToast(`Stok ${code} tidak cukup. Tersedia ${available}, dibutuhkan ${requested}.`, 'danger');
      } else {
        addToast(`Produk pada Surat Jalan tidak valid. ${message}`, 'danger');
      }
      return false;
    }
    for (const delta of stockDeltas) {
      const product = products.find((item) => item.id === delta.productId)!;
      const available = getWarehouseStock(product, deliveryWarehouse.id);
      if (available < delta.qty) {
        addToast(`Stok ${product.code} di ${deliveryWarehouse.name} tidak cukup. Tersedia ${available}, dibutuhkan ${delta.qty}.`, 'danger');
        return false;
      }
    }

    // Compute the changed rows from the current snapshot (NOT inside a
    // setState updater, which React may run lazily) so that exactly the rows
    // shown on screen are the rows sent to the database.
    const changedProducts: Product[] = products
      .filter((p) => stockDeltas.some((d) => d.productId === p.id))
      .map((p) => ({
        ...changeWarehouseStock(p, deliveryWarehouse.id, deliveryWarehouse.name, -stockDeltas.find((d) => d.productId === p.id)!.qty),
        stock: stockDeltas.find((d) => d.productId === p.id)!.newStock,
      }));
    const movementRows: StockMovement[] = stockDeltas.map((delta) => {
      const item = doObj.items.find((line) => line.productId === delta.productId || line.productCode === products.find((p) => p.id === delta.productId)?.code)!;
      const qty = delta.qty;
      const product = changedProducts.find((p) => p.id === delta.productId)!;
      const balance = getWarehouseStock(product, deliveryWarehouse.id);
      const sm: StockMovement = {
        id: `stock-posting-v1:${savedDO.id}:${delta.productId}`,
        date: `${doObj.date} 00:00`,
        documentNo: doObj.code,
        referenceNo: doObj.code,
        type: 'Out',
        productId: item.productId,
        warehouseId: deliveryWarehouse.id,
        productCode: item.productCode,
        productName: item.productName,
        warehouseName: doObj.warehouseName,
        qtyOut: qty,
        qty,
        balance,
        operator: doObj.driverName || 'System',
        uom: item.uom,
        notes: `Pengeluaran barang melalui Surat Jalan ${doObj.code}`,
      };
      return sm;
    });
    try {
      await createDeliveryWithStock(savedDO);
    } catch (err) {
      addToast(err instanceof Error ? err.message : `Surat Jalan ${savedDO.code} gagal disimpan; stok tidak berubah.`, 'danger');
      return false;
    }
    setDeliveries((prev) => [savedDO, ...prev]);
    setProducts((prev) => prev.map((product) => {
      const delta = stockDeltas.find((item) => item.productId === product.id);
      return delta ? {
        ...changeWarehouseStock(product, deliveryWarehouse.id, deliveryWarehouse.name, -delta.qty),
        stock: product.stock - delta.qty,
      } : product;
    }));
    setStockMovements((prev) => [...movementRows.filter((movement) => !prev.some((item) => item.id === movement.id)), ...prev]);
    // Also update SO deliveryStatus if matching
    const matchedSOs: SalesOrder[] = salesOrders
      .filter((so) => so.code === doObj.soCode)
      .map((so) => ({ ...so, deliveryStatus: 'Shipped', status: 'Processing' } as SalesOrder));
    setSalesOrders((prev) => prev.map((so) => matchedSOs.find((m) => m.id === so.id) ?? so));
    persistRows('sales_orders', matchedSOs);
    addToast(`Surat Jalan ${savedDO.code} berhasil dibuat!`, 'success');
    return true;
  };

  const reverseStockDocument = async (
    sourceType: 'delivery' | 'goods_receipt',
    source: DeliveryOrder | GoodsReceipt,
    disposition: 'Returned' | 'Voided',
    reason: string,
  ) => {
    if (!requireAdmin(sourceType === 'delivery' ? 'mencatat retur penjualan' : disposition === 'Voided' ? 'membatalkan Goods Receipt' : 'mencatat retur pembelian')) return;
    if (source.status === 'Returned' || source.status === 'Voided') {
      addToast(`Dokumen ${source.code} sudah pernah dibalik.`, 'warning');
      return;
    }
    const warehouse = warehouses.find((item) => item.id === source.warehouseId)
      ?? warehouses.find((item) => item.name === source.warehouseName);
    if (!warehouse) {
      addToast(`Gudang sumber dokumen ${source.code} tidak ditemukan.`, 'danger');
      return;
    }
    const reversalId = `REV-${sourceType}-${source.id}`;
    const deltas = new Map<string, { product: Product; qty: number }>();
    for (const item of source.items) {
      const product = products.find((candidate) => candidate.id === item.productId || candidate.code === item.productCode);
      if (!product) {
        addToast(`Produk ${item.productCode} pada dokumen ${source.code} tidak ditemukan.`, 'danger');
        return;
      }
      const qty = sourceType === 'delivery'
        ? (item as DeliveryOrder['items'][number]).qty
        : (item as GoodsReceipt['items'][number]).qtyReceived;
      const current = deltas.get(product.id);
      deltas.set(product.id, { product, qty: (current?.qty ?? 0) + qty });
    }
    if (!deltas.size || Array.from(deltas.values()).some((entry) => !(entry.qty > 0))) {
      addToast(`Dokumen ${source.code} tidak memiliki item stok yang dapat dibalik.`, 'danger');
      return;
    }

    const reverseDelta = sourceType === 'delivery' ? 1 : -1;
    for (const { product, qty } of deltas.values()) {
      if (reverseDelta < 0 && getWarehouseStock(product, warehouse.id) < qty) {
        addToast(`Stok ${product.code} di ${warehouse.name} tidak cukup untuk retur pembelian (${getWarehouseStock(product, warehouse.id)} tersedia, ${qty} diminta).`, 'danger');
        return;
      }
    }

    try {
      await reverseInventoryDocument(reversalId, sourceType, source.id, disposition, reason.trim());
      const updated = {
        ...source,
        status: disposition,
        reversalId,
        reversalReason: reason.trim(),
      } as typeof source;
      if (sourceType === 'delivery') {
        setDeliveries((prev) => prev.map((item) => item.id === source.id ? updated as DeliveryOrder : item));
        await upsertRow('deliveries', updated as DeliveryOrder);
      } else {
        setGoodsReceipts((prev) => prev.map((item) => item.id === source.id ? updated as GoodsReceipt : item));
        await upsertRow('goods_receipts', updated as GoodsReceipt);
        const sourceGR = source as GoodsReceipt;
        const relatedPO = purchaseOrders.find((order) => order.code === sourceGR.poCode);
        const hasInvoice = purchaseInvoices.some((invoice) => invoice.poCode === sourceGR.poCode && invoice.status !== 'Cancelled');
        if (relatedPO && !hasInvoice) {
          const activeReceipts = goodsReceipts.filter((receipt) =>
            receipt.id !== sourceGR.id && receipt.poCode === sourceGR.poCode && !['Voided', 'Returned'].includes(receipt.status)
          );
          const totalReceived = (productId: string) => activeReceipts.flatMap((receipt) => receipt.items)
            .filter((item) => item.productId === productId)
            .reduce((sum, item) => sum + item.qtyReceived, 0);
          const anyReceived = relatedPO.items.some((item) => totalReceived(item.productId) > 0);
          const fullyReceived = relatedPO.items.every((item) => totalReceived(item.productId) >= item.qty);
          const updatedPO = {
            ...relatedPO,
            status: fullyReceived ? 'Received' as const : 'Sent' as const,
            receiptStatus: fullyReceived ? 'Full' as const : anyReceived ? 'Partial' as const : 'Pending' as const,
          };
          setPurchaseOrders((prev) => prev.map((order) => order.id === updatedPO.id ? updatedPO : order));
          await upsertRow('purchase_orders', updatedPO);
        }
      }

      const changed = new Map<string, Product>();
      const movements: StockMovement[] = [];
      for (const [index, { product, qty }] of Array.from(deltas.values()).entries()) {
        const delta = qty * reverseDelta;
        const current = products.find((item) => item.id === product.id) ?? product;
        const receiptCost = sourceType === 'goods_receipt'
          ? (source as GoodsReceipt).items
              .filter((item) => item.productId === product.id || item.productCode === product.code)
              .reduce((total, item) => total + item.qtyReceived * (item.unitCost ?? current.buyPrice), 0) / qty
          : current.buyPrice;
        const updatedProduct = {
          ...changeWarehouseStock(current, warehouse.id, warehouse.name, delta),
          stock: current.stock + delta,
          buyPrice: sourceType === 'goods_receipt'
            ? reverseMovingAverageCost(current.stock, current.buyPrice, qty, receiptCost)
            : current.buyPrice,
        };
        changed.set(product.id, updatedProduct);
        movements.push({
          id: `reversal-${reversalId}-${product.id}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          documentNo: reversalId,
          referenceNo: source.code,
          type: 'Return',
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          qtyIn: delta > 0 ? qty : 0,
          qtyOut: delta < 0 ? qty : 0,
          qty,
          balance: getWarehouseStock(updatedProduct, warehouse.id),
          uom: product.uom,
          user: profile?.full_name || 'Admin',
          operator: profile?.full_name || 'Admin',
          notes: `${disposition === 'Voided' ? 'Void GR' : sourceType === 'delivery' ? 'Retur penjualan' : 'Retur pembelian'} ${source.code}. Alasan: ${reason.trim()}`,
        });
      }
      setProducts((prev) => prev.map((product) => changed.get(product.id) ?? product));
      setStockMovements((prev) => [...movements.filter((movement) => !prev.some((item) => item.id === movement.id)), ...prev]);
      addToast(`${sourceType === 'delivery' ? 'Retur penjualan' : disposition === 'Voided' ? 'Goods Receipt dibatalkan' : 'Retur pembelian'} ${source.code} berhasil dicatat.`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : `Pembalikan stok ${source.code} gagal.`, 'danger');
    }
  };

  const updateDeliveryStatus = (id: string, status: DeliveryOrder['status']) => {
    const existing = deliveries.find((d) => d.id === id);
    if (!existing) return;
    if (status === 'Returned') {
      const reason = window.prompt(`Alasan retur penuh Surat Jalan ${existing.code}:`);
      if (!reason?.trim()) return;
      void reverseStockDocument('delivery', existing, 'Returned', reason);
      return;
    }
    if (status !== 'Delivered' || existing.status !== 'In Transit') return;
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
    const invoiceSO = salesOrders.find((so) => so.code === inv.soCode);
    if (invoiceSO && invoiceSO.status !== 'Processing') {
      addToast(`SO ${invoiceSO.code} berstatus ${invoiceSO.status}; faktur hanya untuk SO yang sudah dikirim.`, 'warning');
      return;
    }
    if (invoices.some((existing) => existing.soCode === inv.soCode && existing.status !== 'Cancelled')) {
      addToast(`SO ${inv.soCode} sudah punya faktur.`, 'warning');
      return;
    }
    // Also update SO status
    const matchedSOs: SalesOrder[] = salesOrders
      .filter((so) => so.code === inv.soCode)
      .map((so) => ({ ...so, status: 'Completed' } as SalesOrder));
    setSalesOrders((prev) => prev.map((so) => matchedSOs.find((m) => m.id === so.id) ?? so));
    persistRows('sales_orders', matchedSOs);

    // Every sales invoice opens a receivable (Piutang Dagang). This is what
    // feeds the AR tab, the dashboard aging, the AR aging report and the
    // customer credit check; it is reduced again in recordSalesPayment.
    const receivable: Receivable = {
      id: `ar-${inv.id}`,
      invoiceNo: inv.code,
      soCode: inv.soCode,
      customerId: inv.customerId,
      customerName: inv.customerName,
      salespersonName: inv.salespersonName,
      invoiceDate: inv.date,
      dueDate: inv.dueDate,
      total: inv.totalAmount,
      amount: inv.totalAmount,
      paid: 0,
      paidAmount: 0,
      outstanding: inv.totalAmount,
      remainingAmount: inv.totalAmount,
      status: 'Unpaid',
      notes: `Faktur Penjualan ${inv.code}`,
    };
    setReceivables((prev) => [receivable, ...prev]);
    persist(upsertRow('receivables', receivable), onSaveError);

    // Freeze COGS on the invoice. New delivery lines carry the moving-average
    // unit cost captured when stock left the warehouse.
    const cogsAmount = inv.cogsAmount ?? calculateCogs(products, inv.items);
    const savedInvoice: SalesInvoice = { ...inv, cogsAmount };
    setInvoices((prev) => [savedInvoice, ...prev]);
    const invoiceSaved = upsertRow('invoices', savedInvoice);
    persist(invoiceSaved, onSaveError);

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
    }, invoiceSaved);
    addToast(`Faktur Penjualan ${inv.code} terbit dan jurnal otomatis dibuat!`, 'success');
  };

  const cancelSalesInvoice = async (id: string, reason: string) => {
    const invoice = invoices.find((item) => item.id === id);
    if (!invoice || invoice.status === 'Cancelled') return;
    if (!requireAdmin('membatalkan faktur penjualan')) return;
    if (invoice.status === 'Paid' || invoice.paidAmount > 0 || payments.some((payment) => payment.invoiceNo === invoice.code)) {
      addToast(`Faktur ${invoice.code} sudah memiliki pembayaran dan tidak dapat dibatalkan.`, 'danger');
      return;
    }
    if (!reason.trim()) return;
    try {
      await cancelInventoryInvoice('sales', id, reason.trim());
    } catch (err) {
      addToast(err instanceof Error ? err.message : `Pembatalan faktur ${invoice.code} gagal.`, 'danger');
      return;
    }
    const cancelled = { ...invoice, status: 'Cancelled' as const, remainingAmount: 0, cancellationReason: reason.trim() };
    setInvoices((prev) => prev.map((item) => item.id === id ? cancelled : item));
    const matchedReceivables = receivables.filter((item) => item.invoiceNo === invoice.code).map((item) => ({
      ...item, status: 'Cancelled' as const, outstanding: 0, remainingAmount: 0,
    }));
    setReceivables((prev) => prev.map((item) => matchedReceivables.find((next) => next.id === item.id) ?? item));
    persistRows('receivables', matchedReceivables);
    const matchedOrders = salesOrders.filter((order) => order.code === invoice.soCode).map((order) => ({ ...order, status: 'Processing' as const }));
    setSalesOrders((prev) => prev.map((item) => matchedOrders.find((next) => next.id === item.id) ?? item));
    persistRows('sales_orders', matchedOrders);
    addToast(`Faktur ${invoice.code} dibatalkan. Jurnal dibalik dan piutang ditutup; stok tetap mengikuti Surat Jalan/retur.`, 'success');
  };

  const recordSalesPayment = (pay: SalesPayment) => {
    if (!(pay.amount > 0)) {
      addToast('Jumlah pembayaran harus lebih besar dari 0.', 'warning');
      return;
    }
    const targetInvoice = invoices.find((inv) => inv.code === pay.invoiceNo);
    if (targetInvoice?.status === 'Cancelled') {
      addToast(`Faktur ${targetInvoice.code} sudah dibatalkan dan tidak dapat menerima pembayaran.`, 'danger');
      return;
    }
    if (targetInvoice) {
      const remaining = Math.max(0, targetInvoice.totalAmount - targetInvoice.paidAmount);
      if (pay.amount > remaining) {
        addToast(`Pembayaran melebihi sisa piutang faktur ${pay.invoiceNo} (${formatRupiah(remaining)}).`, 'danger');
        return;
      }
    }

    setPayments((prev) => [pay, ...prev]);
    const paymentSaved = upsertRow('payments', pay);
    persist(paymentSaved, onSaveError);

    // Update matching invoice
    const matchedInvoices: SalesInvoice[] = invoices
      .filter((inv) => inv.code === pay.invoiceNo)
      .map((inv) => {
        const newPaid = inv.paidAmount + pay.amount;
        const newRem = Math.max(0, inv.totalAmount - newPaid);
        return {
          ...inv,
          paidAmount: newPaid,
          remainingAmount: newRem,
          paymentStatus: newRem === 0 ? 'Paid' : 'Partial',
        } as SalesInvoice;
      });
    setInvoices((prev) => prev.map((inv) => matchedInvoices.find((m) => m.id === inv.id) ?? inv));
    persistRows('invoices', matchedInvoices);

    // Update matching receivable (Piutang Dagang)
    const matchedReceivables: Receivable[] = receivables
      .filter((ar) => ar.invoiceNo === pay.invoiceNo)
      .map((ar) => {
        const newPaid = (ar.paidAmount ?? 0) + pay.amount;
        const newRem = Math.max(0, ar.total - newPaid);
        return {
          ...ar,
          paid: newPaid,
          paidAmount: newPaid,
          outstanding: newRem,
          remainingAmount: newRem,
          status: newRem === 0 ? 'Paid' : 'Partial',
        } as Receivable;
      });
    setReceivables((prev) => prev.map((ar) => matchedReceivables.find((m) => m.id === ar.id) ?? ar));
    persistRows('receivables', matchedReceivables);

    postAutoJournal({
      voucherNo: `JU-AR-${pay.id}`, date: pay.date,
      description: `Penerimaan pembayaran ${pay.code} - ${pay.customerName}`,
      referenceType: 'sales_payment', referenceId: pay.id, referenceNo: pay.code,
      lines: [
        { accountCode: cashAccountForPayment(pay.paymentMethod), debit: pay.amount, credit: 0 },
        { accountCode: '1201', debit: 0, credit: pay.amount },
      ]
    }, paymentSaved);
    addToast(`Pembayaran ${formatRupiah(pay.amount)} berhasil dicatat dan jurnal otomatis dibuat!`, 'success');
  };

  // Purchase Actions Implementation
  const addPurchaseRequest = (pr: PurchaseRequest) => {
    setPurchaseRequests((prev) => [pr, ...prev]);
    persist(upsertRow('purchase_requests', pr), onSaveError);
    addToast(`Permintaan Pembelian ${pr.code} berhasil diajukan!`, 'success');
  };

  const convertPRtoPO = async (prId: string) => {
    const pr = purchaseRequests.find((p) => p.id === prId);
    if (!pr) return;
    if (pr.status === 'Converted') {
      addToast(`Permintaan ${pr.code} sudah dikonversi menjadi PO.`, 'warning');
      return;
    }
    const supplierObj = suppliers.find((s) => s.id === pr.supplierId);
    if (!supplierObj) {
      addToast(`Permintaan ${pr.code} belum punya pemasok yang valid. Pilih pemasok dulu sebelum membuat PO.`, 'danger');
      return;
    }

    const updatedPR: PurchaseRequest = { ...pr, status: 'Converted' };
    setPurchaseRequests((prev) =>
      prev.map((item) => (item.id === prId ? updatedPR : item))
    );
    persist(upsertRow('purchase_requests', updatedPR), onSaveError);

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
    const taxAmount = Math.round(subtotal * ((systemSettings.taxRate ?? 11) / 100));
    const totalAmount = subtotal + taxAmount;

    const newPO: PurchaseOrder = {
      id: generateId('po'),
      code: await nextDocumentNo('PO'),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplierId: supplierObj.id,
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

  const addGoodsReceipt = (gr: GoodsReceipt): boolean => {
    if (goodsReceipts.some((existing) => existing.id === gr.id || existing.code === gr.code)) {
      addToast(`Goods Receipt ${gr.code} sudah tercatat.`, 'warning');
      return false;
    }
    if (!gr.items.some((item) => item.qtyReceived > 0) || gr.items.some((item) => !(item.qtyReceived >= 0))) {
      addToast('Isi jumlah barang yang diterima (minimal 1 item lebih dari 0).', 'warning');
      return false;
    }

    // Validasi terhadap PO: status harus bisa menerima barang, dan jumlah kumulatif
    // penerimaan tidak boleh melebihi jumlah yang dipesan.
    const po = purchaseOrders.find((p) => p.code === gr.poCode);
    let isFullyReceived = true;
    if (po) {
      if (po.status === 'Draft' || po.status === 'Cancelled') {
        addToast(`PO ${po.code} berstatus ${po.status}. Kirim/aktifkan PO dulu sebelum menerima barang.`, 'warning');
        return false;
      }
      if (po.receiptStatus === 'Full' || po.status === 'Invoiced' || po.status === 'Completed') {
        addToast(`PO ${po.code} sudah diterima penuh.`, 'warning');
        return false;
      }
      const receivedBefore = (productId: string) =>
        goodsReceipts
          .filter((g) => g.poCode === po.code && !['Voided', 'Returned'].includes(g.status))
          .flatMap((g) => g.items)
          .filter((i) => i.productId === productId)
          .reduce((sum, i) => sum + i.qtyReceived, 0);
      for (const item of gr.items) {
        if (item.qtyReceived <= 0) continue;
        const ordered = po.items.find((i) => i.productId === item.productId)?.qty;
        if (ordered === undefined) {
          addToast(`${item.productName} tidak ada di PO ${po.code}.`, 'danger');
          return false;
        }
        if (receivedBefore(item.productId) + item.qtyReceived > ordered) {
          addToast(`Penerimaan ${item.productName} melebihi jumlah PO (${ordered} ${item.uom}).`, 'danger');
          return false;
        }
      }
      isFullyReceived = po.items.every((poItem) => {
        const now = gr.items.find((i) => i.productId === poItem.productId)?.qtyReceived ?? 0;
        return receivedBefore(poItem.productId) + now >= poItem.qty;
      });
    }

    // Validate products BEFORE saving anything, so an invalid receipt can no
    // longer leave a saved GR / updated PO without the matching stock.
    const receiptWarehouse = warehouses.find((warehouse) => warehouse.id === gr.warehouseId)
      ?? warehouses.find((warehouse) => warehouse.name === gr.warehouseName);
    if (!receiptWarehouse) {
      addToast(`Gudang penerima ${gr.warehouseName} tidak ditemukan.`, 'danger');
      return false;
    }
    const receivedItems = gr.items.filter((item) => item.qtyReceived > 0);
    const receiptPO = purchaseOrders.find((order) => order.code === gr.poCode);
    const orderedCostTotals = new Map<string, { qty: number; value: number }>();
    receiptPO?.items.forEach((item) => {
      const qty = Math.max(0, Number(item.qty) || 0);
      const unitCost = Math.max(0, Number(item.netPrice ?? item.unitPrice) || 0);
      const current = orderedCostTotals.get(item.productId) ?? { qty: 0, value: 0 };
      orderedCostTotals.set(item.productId, { qty: current.qty + qty, value: current.value + qty * unitCost });
    });
    const poUnitCostByProduct = new Map(
      Array.from(orderedCostTotals.entries()).map(([productId, cost]) => [
        productId,
        cost.qty > 0 ? cost.value / cost.qty : 0,
      ])
    );
    let stockDeltas: ReturnType<typeof calculateGoodsReceiptStock>;
    try {
      stockDeltas = calculateGoodsReceiptStock(products, receivedItems);
    } catch (err) {
      addToast(`Produk pada Goods Receipt tidak valid. ${err instanceof Error ? err.message : ''}`, 'danger');
      return false;
    }

    const savedGR: GoodsReceipt = {
      ...gr,
      warehouseId: receiptWarehouse.id,
      warehouseName: receiptWarehouse.name,
      items: receivedItems.map((item) => ({
        ...item,
        unitCost: poUnitCostByProduct.get(item.productId)
          ?? products.find((product) => product.id === item.productId || product.code === item.productCode)?.buyPrice
          ?? 0,
      })),
    };
    setGoodsReceipts((prev) => [savedGR, ...prev]);

    // Update matching PO: Full hanya jika semua item sudah diterima lengkap.
    const matchedPOs: PurchaseOrder[] = purchaseOrders
      .filter((p) => p.code === gr.poCode)
      .map((p) => ({
        ...p,
        status: isFullyReceived ? 'Received' : p.status,
        receiptStatus: isFullyReceived ? 'Full' : 'Partial',
      } as PurchaseOrder));
    setPurchaseOrders((prev) => prev.map((p) => matchedPOs.find((m) => m.id === p.id) ?? p));
    persistRows('purchase_orders', matchedPOs);

    // Goods Receipt increases on-hand stock immediately.
    const changedProducts: Product[] = products
      .filter((p) => stockDeltas.some((d) => d.productId === p.id))
      .map((p) => {
        const delta = stockDeltas.find((item) => item.productId === p.id)!;
        const unitCost = poUnitCostByProduct.get(p.id);
        return {
          ...changeWarehouseStock(p, receiptWarehouse.id, receiptWarehouse.name, delta.qty),
          stock: delta.newStock,
          buyPrice: unitCost === undefined
            ? p.buyPrice
            : calculateMovingAverageCost(p.stock, p.buyPrice, delta.qty, unitCost),
        };
      });
    const changedById = new Map(changedProducts.map((product) => [product.id, product]));
    setProducts((prev) => prev.map((product) => changedById.get(product.id) ?? product));

    const movementRows: StockMovement[] = stockDeltas.map((delta) => {
      const item = receivedItems.find((line) => line.productId === delta.productId || line.productCode === products.find((p) => p.id === delta.productId)?.code)!;
      const updatedProduct = changedProducts.find((p) => p.id === delta.productId)!;
      const sm: StockMovement = {
        id: `stock-posting-v1:${savedGR.id}:${delta.productId}`,
        date: `${gr.date} 00:00`,
        documentNo: gr.code,
        type: 'In',
        qty: delta.qty,
        qtyIn: delta.qty,
        qtyOut: 0,
        balance: updatedProduct ? getWarehouseStock(updatedProduct, receiptWarehouse.id) : 0,
        uom: item.uom,
        productId: item.productId,
        warehouseId: receiptWarehouse.id,
        productCode: item.productCode,
        productName: item.productName,
        referenceNo: gr.code,
        warehouseName: gr.warehouseName,
        batchNo: item.batchNo || 'LOT-RCV-AUTO',
        operator: gr.receivedBy,
        notes: `Penerimaan barang melalui Goods Receipt ${gr.code}`,
      };
      return sm;
    });
    setStockMovements((prev) => [...movementRows.filter((movement) => !prev.some((item) => item.id === movement.id)), ...prev]);

    persist((async () => {
      await upsertRow('goods_receipts', savedGR);
      await applyStockChanges(stockDeltas.map((delta) => ({
        productId: delta.productId,
        delta: delta.qty,
        ref: `${savedGR.id}:${delta.productId}`,
        warehouseId: receiptWarehouse.id,
        sourceType: 'goods_receipt' as const,
        sourceId: savedGR.id,
      })));
    })(), onSaveError);

    addToast(
      isFullyReceived
        ? `Penerimaan Barang ${gr.code} (GR) berhasil dicatat ke gudang!`
        : `Penerimaan sebagian ${gr.code} dicatat. PO masih menunggu sisa barang.`,
      'success'
    );
    return true;
  };

  const reverseGoodsReceipt = (id: string, disposition: 'Voided' | 'Returned', reason: string) => {
    const gr = goodsReceipts.find((receipt) => receipt.id === id);
    if (!gr) return;
    void reverseStockDocument('goods_receipt', gr, disposition, reason);
  };

  const addPurchaseInvoice = (pinv: PurchaseInvoice): boolean => {
    if (purchaseInvoices.some((i) => i.id === pinv.id || i.code === pinv.code)) {
      addToast(`Faktur Pembelian ${pinv.code} sudah tercatat.`, 'warning');
      return false;
    }
    const poForInvoice = purchaseOrders.find((po) => po.code === pinv.poCode);
    if (poForInvoice && poForInvoice.receiptStatus !== 'Full') {
      addToast(`Barang PO ${poForInvoice.code} belum diterima penuh. Terima barang dulu sebelum membuat faktur.`, 'warning');
      return false;
    }
    if (purchaseInvoices.some((i) => i.poCode === pinv.poCode && i.status !== 'Cancelled')) {
      addToast(`PO ${pinv.poCode} sudah memiliki faktur pembelian.`, 'warning');
      return false;
    }
    if (
      pinv.supplierInvoiceNo &&
      purchaseInvoices.some(
        (i) => i.supplierId === pinv.supplierId && i.supplierInvoiceNo === pinv.supplierInvoiceNo && i.status !== 'Cancelled'
      )
    ) {
      addToast(`Nomor faktur supplier ${pinv.supplierInvoiceNo} sudah pernah dicatat.`, 'danger');
      return false;
    }
    setPurchaseInvoices((prev) => [pinv, ...prev]);
    const purchaseInvoiceSaved = upsertRow('purchase_invoices', pinv);
    persist(purchaseInvoiceSaved, onSaveError);

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
    const matchedPOs: PurchaseOrder[] = purchaseOrders
      .filter((po) => po.code === pinv.poCode)
      .map((po) => ({ ...po, status: 'Invoiced' } as PurchaseOrder));
    setPurchaseOrders((prev) => prev.map((po) => matchedPOs.find((m) => m.id === po.id) ?? po));
    persistRows('purchase_orders', matchedPOs);

    const purchaseLines = [
      { accountCode: '1301', debit: Math.max(0, pinv.subtotal), credit: 0 },
      ...(pinv.taxAmount > 0 ? [{ accountCode: '1401', debit: pinv.taxAmount, credit: 0 }] : []),
      { accountCode: '2101', debit: 0, credit: pinv.totalAmount },
    ];
    postAutoJournal({
      voucherNo: `JU-PURCHASE-${pinv.id}`, date: pinv.date,
      description: `Faktur Pembelian ${pinv.code} - ${pinv.supplierName}`,
      referenceType: 'purchase_invoice', referenceId: pinv.id, referenceNo: pinv.code, lines: purchaseLines
    }, purchaseInvoiceSaved);
    addToast(`Faktur Pembelian ${pinv.code} terbit! Hutang Usaha (${formatRupiah(pinv.totalAmount)}) dan jurnal otomatis telah dicatat.`, 'success');
    return true;
  };

  const cancelPurchaseInvoice = async (id: string, reason: string) => {
    const invoice = purchaseInvoices.find((item) => item.id === id);
    if (!invoice || invoice.status === 'Cancelled') return;
    if (!requireAdmin('membatalkan faktur pembelian')) return;
    if (invoice.status === 'Paid' || invoice.paidAmount > 0 || supplierPayments.some((payment) =>
      payment.invoice === invoice.code || payment.invoiceNo === invoice.code
      || payment.invoice === invoice.supplierInvoiceNo || payment.invoiceNo === invoice.supplierInvoiceNo
    )) {
      addToast(`Faktur ${invoice.code} sudah memiliki pembayaran dan tidak dapat dibatalkan.`, 'danger');
      return;
    }
    if (!reason.trim()) return;
    try {
      await cancelInventoryInvoice('purchase', id, reason.trim());
    } catch (err) {
      addToast(err instanceof Error ? err.message : `Pembatalan faktur ${invoice.code} gagal.`, 'danger');
      return;
    }
    const cancelled = { ...invoice, status: 'Cancelled' as const, remainingAmount: 0, cancellationReason: reason.trim() };
    setPurchaseInvoices((prev) => prev.map((item) => item.id === id ? cancelled : item));
    const matchedPayables = payables.filter((item) => item.invoiceNo === invoice.code || item.invoiceNo === invoice.supplierInvoiceNo).map((item) => ({
      ...item, status: 'Cancelled' as const, outstanding: 0, remainingAmount: 0,
    }));
    setPayables((prev) => prev.map((item) => matchedPayables.find((next) => next.id === item.id) ?? item));
    persistRows('payables', matchedPayables);
    const matchedOrders = purchaseOrders.filter((order) => order.code === invoice.poCode).map((order) => ({ ...order, status: 'Received' as const }));
    setPurchaseOrders((prev) => prev.map((item) => matchedOrders.find((next) => next.id === item.id) ?? item));
    persistRows('purchase_orders', matchedOrders);
    addToast(`Faktur ${invoice.code} dibatalkan. Jurnal dibalik dan hutang ditutup; stok tetap mengikuti GR/retur.`, 'success');
  };

  const recordSupplierPayment = (pay: SupplierPayment) => {
    if (!(pay.amount > 0)) {
      addToast('Jumlah pembayaran harus lebih besar dari 0.', 'warning');
      return;
    }
    const targetPayable = payables.find((ap) => ap.invoiceNo === pay.invoice || ap.invoiceNo === pay.invoiceNo);
    if (targetPayable?.status === 'Cancelled') {
      addToast(`Faktur ${targetPayable.invoiceNo} sudah dibatalkan dan tidak dapat menerima pembayaran.`, 'danger');
      return;
    }
    if (targetPayable && pay.amount > targetPayable.remainingAmount) {
      addToast(`Pembayaran melebihi sisa hutang faktur ${targetPayable.invoiceNo} (${formatRupiah(targetPayable.remainingAmount)}).`, 'danger');
      return;
    }

    setSupplierPayments((prev) => [pay, ...prev]);
    const supplierPaymentSaved = upsertRow('supplier_payments', pay);
    persist(supplierPaymentSaved, onSaveError);

    // Update matching Payable
    const matchedPayables: Payable[] = payables
      .filter((ap) => ap.invoiceNo === pay.invoice || ap.invoiceNo === pay.invoiceNo)
      .map((ap) => {
        const newPaid = ap.paidAmount + pay.amount;
        const newRemaining = Math.max(0, ap.total - newPaid);
        const newStatus: Payable['status'] = newRemaining === 0 ? 'Paid' : 'Partially Paid';
        return {
          ...ap,
          paid: newPaid,
          paidAmount: newPaid,
          outstanding: newRemaining,
          remainingAmount: newRemaining,
          status: newStatus
        };
      });
    setPayables((prev) => prev.map((ap) => matchedPayables.find((m) => m.id === ap.id) ?? ap));
    persistRows('payables', matchedPayables);

    // Update matching Purchase Invoice if exists
    const matchedPInvoices: PurchaseInvoice[] = purchaseInvoices
      .filter((pinv) => pinv.supplierInvoiceNo === pay.invoice || pinv.code === pay.invoice)
      .map((pinv) => {
        const newPaid = pinv.paidAmount + pay.amount;
        const newRemaining = Math.max(0, pinv.totalAmount - newPaid);
        return {
          ...pinv,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          paymentStatus: newRemaining === 0 ? 'Paid' : 'Partially Paid'
        } as PurchaseInvoice;
      });
    setPurchaseInvoices((prev) => prev.map((pinv) => matchedPInvoices.find((m) => m.id === pinv.id) ?? pinv));
    persistRows('purchase_invoices', matchedPInvoices);

    postAutoJournal({
      voucherNo: `JU-AP-${pay.id}`, date: pay.date,
      description: `Pembayaran hutang ${pay.paymentNumber} - ${pay.supplierName}`,
      referenceType: 'supplier_payment', referenceId: pay.id, referenceNo: pay.paymentNumber,
      lines: [
        { accountCode: '2101', debit: pay.amount, credit: 0 },
        { accountCode: cashAccountForPayment(pay.paymentMethod), debit: 0, credit: pay.amount },
      ]
    }, supplierPaymentSaved);
    addToast(`Pembayaran Hutang Supplier ${formatRupiah(pay.amount)} ke ${pay.supplierName} berhasil dicatat dan dijurnal!`, 'success');
  };

  // Inventory Actions Implementation
  const addStockTransfer = (st: StockTransfer) => {
    if (stockTransfers.some((existing) => existing.id === st.id || existing.transferNo === st.transferNo)) {
      addToast(`Transfer ${st.transferNo} sudah tercatat.`, 'warning');
      return;
    }
    if (st.fromWarehouseName && st.fromWarehouseName === st.toWarehouseName) {
      addToast('Gudang asal dan gudang tujuan tidak boleh sama.', 'warning');
      return;
    }
    if (!st.items?.length || st.items.some((item) => !(item.qty > 0))) {
      addToast('Isi minimal 1 item dengan jumlah lebih dari 0.', 'warning');
      return;
    }
    setStockTransfers((prev) => [st, ...prev]);
    persist(upsertRow('stock_transfers', st), onSaveError);
    addToast(`Dokumen Transfer Gudang ${st.transferNo} berhasil dibuat!`, 'success');
  };

  const updateStockTransferStatus = (id: string, status: StockTransfer['status']) => {
    const existing = stockTransfers.find((st) => st.id === id);
    if (!existing) return;
    if ((status === 'Approved' || status === 'In Transit') && !requireAdmin('menyetujui atau mengirim transfer stok')) return;
    const order: StockTransfer['status'][] = ['Draft', 'Submitted', 'Approved', 'In Transit', 'Received', 'Completed'];
    if (order.indexOf(status) <= order.indexOf(existing.status)) {
      addToast(`Transfer ${existing.transferNo} sudah berstatus ${existing.status}.`, 'warning');
      return;
    }
    const fromWarehouse = warehouses.find((warehouse) => warehouse.id === existing.fromWarehouseId);
    const toWarehouse = warehouses.find((warehouse) => warehouse.id === existing.toWarehouseId);
    if (!fromWarehouse || !toWarehouse || fromWarehouse.id === toWarehouse.id) {
      addToast('Gudang asal atau tujuan transfer tidak valid.', 'danger');
      return;
    }
    const arriving = status === 'Completed' || status === 'Received';
    const needsDispatch = status === 'In Transit' || (arriving && order.indexOf(existing.status) < order.indexOf('In Transit'));
    const needsReceive = arriving && existing.status !== 'Received' && existing.status !== 'Completed';

    const applyLocalPhase = async (phase: 'dispatch' | 'receive') => {
      const outgoing = phase === 'dispatch';
      const warehouse = outgoing ? fromWarehouse : toWarehouse;
      const movements: StockMovement[] = [];
      const productDeltas = new Map<string, number>();
      const itemByProduct = new Map<string, StockTransfer['items'][number]>();
      for (const item of existing.items) {
        const product = products.find((candidate) => candidate.id === item.productId || candidate.code === item.productCode);
        if (!product) continue;
        const delta = outgoing ? -item.qty : item.qty;
        productDeltas.set(product.id, (productDeltas.get(product.id) ?? 0) + delta);
        const prior = itemByProduct.get(product.id);
        itemByProduct.set(product.id, prior ? { ...prior, qty: prior.qty + item.qty } : { ...item, productId: product.id });
      }
      for (const [productId, item] of itemByProduct) {
        const product = products.find((candidate) => candidate.id === productId)!;
        const qty = item.qty;
        const balance = getWarehouseStock(product, warehouse.id) + (outgoing ? -qty : qty);
        movements.push({
          id: `transfer-${existing.id}-${phase}-${productId}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          documentNo: existing.transferNo,
          referenceNo: existing.transferNo,
          type: 'Transfer',
          productId: product.id,
          productCode: item.productCode,
          productName: item.productName,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          qtyIn: outgoing ? 0 : qty,
          qtyOut: outgoing ? qty : 0,
          qty,
          balance,
          uom: item.uom,
          notes: outgoing
            ? `Transfer ${existing.transferNo}: keluar dari ${fromWarehouse.name} menuju ${toWarehouse.name}`
            : `Transfer ${existing.transferNo}: diterima di ${toWarehouse.name} dari ${fromWarehouse.name}`,
        });
      }
      setProducts((prev) => prev.map((product) => {
        const delta = productDeltas.get(product.id);
        return delta === undefined ? product : changeWarehouseStock(product, warehouse.id, warehouse.name, delta);
      }));
      if (movements.length > 0) {
        setStockMovements((prev) => [...movements.filter((movement) => !prev.some((existingMovement) => existingMovement.id === movement.id)), ...prev]);
      }
    };

    void (async () => {
      // The server validates transfer lines against this stored source document.
      await upsertRow('stock_transfers', existing);
      if (needsDispatch) {
        await applyStockTransfer(existing.id, 'dispatch');
        await applyLocalPhase('dispatch');
        if (needsReceive) {
          const inTransit = { ...existing, status: 'In Transit' as const };
          setStockTransfers((prev) => prev.map((st) => (st.id === id ? inTransit : st)));
          await upsertRow('stock_transfers', inTransit);
        }
      }
      if (needsReceive) {
        await applyStockTransfer(existing.id, 'receive');
        await applyLocalPhase('receive');
      }
      const updated = { ...existing, status };
      setStockTransfers((prev) => prev.map((st) => (st.id === id ? updated : st)));
      await upsertRow('stock_transfers', updated);
      addToast(`Status Transfer Gudang diubah menjadi ${status}`, 'info');
    })().catch((err) => {
      addToast(err instanceof Error ? err.message : 'Transfer stok gagal diproses.', 'danger');
    });
  };

  const addStockAdjustment = (adj: StockAdjustment) => {
    if (profile?.role?.toLowerCase() !== 'admin') {
      addToast('Hanya Admin yang dapat membuat penyesuaian stok.', 'danger');
      return;
    }
    if (stockAdjustments.some((existing) => existing.id === adj.id || existing.adjustmentNo === adj.adjustmentNo)) {
      addToast(`Penyesuaian ${adj.adjustmentNo} sudah tercatat.`, 'warning');
      return;
    }
    if (!(adj.qty > 0)) {
      addToast('Jumlah penyesuaian harus lebih besar dari 0.', 'warning');
      return;
    }
    const target = products.find((p) => p.id === adj.productId || p.code === adj.productCode);
    if (!target) {
      addToast(`Produk ${adj.productCode} tidak ditemukan.`, 'danger');
      return;
    }
    const adjustmentWarehouse = warehouses.find((warehouse) => warehouse.id === adj.warehouseId);
    if (!adjustmentWarehouse) {
      addToast('Gudang penyesuaian tidak ditemukan.', 'danger');
      return;
    }
    const warehouseAvailable = getWarehouseStock(target, adjustmentWarehouse.id);
    if (adj.type === 'Decrease' && adj.qty > warehouseAvailable) {
      addToast(`Pengurangan ${adj.qty} melebihi stok ${target.code} di ${adjustmentWarehouse.name} (${warehouseAvailable}).`, 'danger');
      return;
    }

    setStockAdjustments((prev) => [adj, ...prev]);

    // Update Product Stock (computed from the current snapshot, see addDeliveryOrder)
    const delta = adj.type === 'Increase' ? adj.qty : -adj.qty;
    const updatedProduct: Product = {
      ...changeWarehouseStock(target, adjustmentWarehouse.id, adjustmentWarehouse.name, delta),
      stock: target.stock + delta,
    };
    setProducts((prev) => prev.map((product) => product.id === target.id ? {
      ...changeWarehouseStock(product, adjustmentWarehouse.id, adjustmentWarehouse.name, delta),
      stock: product.stock + delta,
    } : product));

    // Record Stock Movement
    const sm: StockMovement = {
      id: `stock-posting-v1:${adj.id}:${target.id}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      documentNo: adj.adjustmentNo,
      referenceNo: adj.reference || adj.adjustmentNo,
      type: 'Adjustment',
      productId: target.id,
      warehouseId: adjustmentWarehouse.id,
      productCode: adj.productCode,
      productName: adj.productName,
      warehouseName: adjustmentWarehouse.name,
      qtyIn: adj.type === 'Increase' ? adj.qty : 0,
      qtyOut: adj.type === 'Decrease' ? adj.qty : 0,
      qty: adj.qty,
      balance: getWarehouseStock(updatedProduct, adjustmentWarehouse.id),
      user: adj.user,
      operator: adj.user,
      uom: adj.uom,
      notes: `Adjustment (${adj.type}): ${adj.reason}`
    };
    setStockMovements((prev) => [sm, ...prev]);
    // Save the source document before calling the RPC. The RPC verifies that
    // this exact adjustment is already stored, so preserve this order online
    // and in the offline outbox.
    persist((async () => {
      await upsertRow('stock_adjustments', adj);
      await applyStockChanges([{
        productId: target.id,
        delta,
        ref: `${adj.id}:${target.id}`,
        warehouseId: adjustmentWarehouse.id,
        sourceType: 'adjustment',
        sourceId: adj.id,
      }]);
    })(), onSaveError);

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
        getCustomerOutstanding,
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
        importCustomers,
        updateCustomer,
        deleteCustomer,

        addSupplier,
        updateSupplier,
        deleteSupplier,

        addProduct,
        importProducts,
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
        cancelSalesInvoice,
        recordSalesPayment,

        addPurchaseRequest,
        convertPRtoPO,
        addPurchaseOrder,
        updatePOStatus,
        addGoodsReceipt,
        reverseGoodsReceipt,
        addPurchaseInvoice,
        cancelPurchaseInvoice,
        recordSupplierPayment,

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
